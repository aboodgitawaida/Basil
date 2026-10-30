import { describe, expect, it } from 'vitest'
import type { IncomingMessage } from 'node:http'
import { RateLimiter, clientIp, limitsFromEnv } from '../../server/rateLimit'

function clock(start = 1_000_000) {
  let t = start
  return { now: () => t, advance: (ms: number) => { t += ms } }
}

describe('RateLimiter', () => {
  it('allows up to the per-minute limit, then refuses until the minute is up', () => {
    const c = clock()
    const rl = new RateLimiter(() => ({ perMinute: 3, perDay: 100 }), c.now)
    expect([rl.take('a'), rl.take('a'), rl.take('a')].every(r => r.ok)).toBe(true)
    const refused = rl.take('a')
    expect(refused).toEqual({ ok: false, window: 'minute', retryAfterSec: 60 })
    c.advance(59_000)
    expect(rl.take('a').ok).toBe(false)
    c.advance(1_000)
    expect(rl.take('a').ok).toBe(true)
  })

  it('counts each visitor separately', () => {
    const rl = new RateLimiter(() => ({ perMinute: 1, perDay: 100 }), clock().now)
    expect(rl.take('a').ok).toBe(true)
    expect(rl.take('b').ok).toBe(true)
    expect(rl.take('a').ok).toBe(false)
  })

  it('enforces the daily cap across minutes', () => {
    const c = clock()
    const rl = new RateLimiter(() => ({ perMinute: 10, perDay: 2 }), c.now)
    rl.take('a'); c.advance(61_000); rl.take('a'); c.advance(61_000)
    const r = rl.take('a')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.window).toBe('day')
    c.advance(86_400_000)
    expect(rl.take('a').ok).toBe(true)
  })

  it('treats 0 as no limit', () => {
    const rl = new RateLimiter(() => ({ perMinute: 0, perDay: 0 }), clock().now)
    for (let i = 0; i < 500; i++) expect(rl.take('a').ok).toBe(true)
  })
})

describe('limitsFromEnv', () => {
  it('has defaults and takes overrides', () => {
    expect(limitsFromEnv({})).toEqual({ perMinute: 20, perDay: 300 })
    expect(limitsFromEnv({ BASIL_RATE_PER_MIN: '5', BASIL_RATE_PER_DAY: '0' })).toEqual({ perMinute: 5, perDay: 0 })
  })

  it('ignores values that are not numbers', () => {
    expect(limitsFromEnv({ BASIL_RATE_PER_MIN: 'lots', BASIL_RATE_PER_DAY: '-4' })).toEqual({ perMinute: 20, perDay: 300 })
  })
})

describe('clientIp', () => {
  const req = (headers: Record<string, string>, remoteAddress = '10.0.0.1') =>
    ({ headers, socket: { remoteAddress } }) as unknown as IncomingMessage

  it('takes the first forwarded address, then x-real-ip, then the socket', () => {
    expect(clientIp(req({ 'x-vercel-forwarded-for': '9.9.9.9', 'x-forwarded-for': '1.2.3.4' }))).toBe('9.9.9.9')
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 10.0.0.2' }))).toBe('1.2.3.4')
    expect(clientIp(req({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8')
    expect(clientIp(req({}))).toBe('10.0.0.1')
  })
})
