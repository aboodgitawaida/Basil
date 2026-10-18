import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApiHandler } from '../../server/api'
import { RateLimiter } from '../../server/rateLimit'

type Sent = { status: number; headers: Record<string, string>; body: any }

/** Drives the handler the way Node's http server would, without a socket. */
async function call(
  handler: ReturnType<typeof createApiHandler>,
  method: string,
  url: string,
  body?: unknown,
  opts: { preParsed?: boolean; ip?: string } = {},
): Promise<Sent | null> {
  const raw = body === undefined ? '' : JSON.stringify(body)
  const req = Readable.from(opts.preParsed || !raw ? [] : [raw]) as unknown as IncomingMessage & { body?: unknown }
  Object.assign(req, { method, url, headers: { 'x-forwarded-for': opts.ip ?? '1.1.1.1' }, socket: {} })
  if (opts.preParsed) req.body = body
  const sent: Sent = { status: 200, headers: {}, body: undefined }
  const res = {
    set statusCode(v: number) { sent.status = v },
    setHeader: (k: string, v: string) => { sent.headers[k.toLowerCase()] = v },
    end: (text: string) => { sent.body = JSON.parse(text) },
  } as unknown as ServerResponse
  const handled = await handler(req, res)
  return handled ? sent : null
}

const env = { ...process.env }
beforeEach(() => {
  // never let a developer's real key or provider leak into a test
  for (const k of ['GEMINI_API_KEY', 'GROQ_API_KEY', 'BASIL_MODEL', 'BASIL_GROQ_URL', 'BASIL_GEMINI_URL']) delete process.env[k]
  process.env.BASIL_PROVIDER = 'groq'
})
afterEach(() => {
  process.env = { ...env }
  vi.unstubAllGlobals()
})

const open = () => createApiHandler(new RateLimiter(() => ({ perMinute: 0, perDay: 0 })))

describe('routing', () => {
  it('leaves non-API paths to the next handler', async () => {
    expect(await call(open(), 'GET', '/index.html')).toBeNull()
  })

  it('reports status without the key', async () => {
    process.env.GROQ_API_KEY = 'secret-key'
    const r = await call(open(), 'GET', '/api/status?x=1')
    expect(r?.body).toEqual({ provider: 'groq', model: 'openai/gpt-oss-120b', configured: true })
    expect(JSON.stringify(r?.body)).not.toContain('secret-key')
  })

  it('rejects the wrong method, bad JSON, empty input and unknown routes', async () => {
    expect((await call(open(), 'GET', '/api/parse'))?.status).toBe(405)
    const h = open()
    const bad = Readable.from(['{nope']) as any
    Object.assign(bad, { method: 'POST', url: '/api/parse', headers: {}, socket: {} })
    let status = 0
    await h(bad, { set statusCode(v: number) { status = v }, setHeader() {}, end() {} } as any)
    expect(status).toBe(400)
    expect((await call(open(), 'POST', '/api/parse', { text: '   ' }))?.status).toBe(400)
    expect((await call(open(), 'POST', '/api/craft', { ingredients: [] }))?.status).toBe(400)
    expect((await call(open(), 'POST', '/api/nope', {}))?.status).toBe(404)
  })
})

describe('model routes', () => {
  it('says no-key instead of failing when no key is set', async () => {
    const r = await call(open(), 'POST', '/api/parse', { text: 'milk' })
    expect(r?.status).toBe(200)
    expect(r?.body).toMatchObject({ ok: false, reason: 'no-key' })
  })

  it('accepts a body Vercel already parsed', async () => {
    const r = await call(open(), 'POST', '/api/craft', { ingredients: ['bread'] }, { preParsed: true })
    expect(r?.body).toMatchObject({ ok: false, reason: 'no-key' })
  })

  it('calls the provider with the key and validates what comes back', async () => {
    process.env.GROQ_API_KEY = 'k'
    process.env.BASIL_GROQ_URL = 'https://stub.test/v1'
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ name: 'Toast', ok: true, steps: ['toast it'], minutes: 3 }) } }],
    })))
    vi.stubGlobal('fetch', fetchMock)
    const r = await call(open(), 'POST', '/api/craft', { ingredients: ['bread'] })
    expect(r?.body).toMatchObject({ ok: true, data: { name: 'Toast', ok: true }, provider: 'groq' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://stub.test/v1/chat/completions')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer k')
  })

  it('reports an unreadable model reply as bad-json', async () => {
    process.env.GROQ_API_KEY = 'k'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'no idea' } }] }))))
    const r = await call(open(), 'POST', '/api/parse', { text: 'milk' })
    expect(r?.body).toMatchObject({ ok: false, reason: 'bad-json' })
  })

  it('passes the provider status through so the client can explain it', async () => {
    process.env.GROQ_API_KEY = 'k'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('gone', { status: 404 })))
    const r = await call(open(), 'POST', '/api/suggest', { inventory: '- milk' })
    expect(r?.body).toMatchObject({ ok: false, reason: 'unreachable' })
    expect(r?.body.detail).toContain('groq 404')
  })
})

describe('rate limiting', () => {
  it('refuses with 429 and retry-after once a visitor is over the limit', async () => {
    const h = createApiHandler(new RateLimiter(() => ({ perMinute: 2, perDay: 0 })))
    await call(h, 'POST', '/api/parse', { text: 'milk' })
    await call(h, 'POST', '/api/parse', { text: 'milk' })
    const r = await call(h, 'POST', '/api/parse', { text: 'milk' })
    expect(r?.status).toBe(429)
    expect(r?.body).toMatchObject({ ok: false, reason: 'rate-limited' })
    expect(Number(r?.headers['retry-after'])).toBeGreaterThan(0)
    // someone else is unaffected
    expect((await call(h, 'POST', '/api/parse', { text: 'milk' }, { ip: '2.2.2.2' }))?.status).toBe(200)
  })

  it('does not count status checks or rejected requests', async () => {
    const h = createApiHandler(new RateLimiter(() => ({ perMinute: 1, perDay: 0 })))
    await call(h, 'GET', '/api/status')
    await call(h, 'POST', '/api/parse', { text: '' })
    expect((await call(h, 'POST', '/api/parse', { text: 'milk' }))?.status).toBe(200)
  })
})
