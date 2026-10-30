import type { IncomingMessage } from 'node:http'

/**
 * A per-visitor cap on model calls, so a public URL can't quietly spend the
 * whole key. Counts live in memory: on Vercel each warm instance keeps its own,
 * so this is a speed bump rather than a hard quota. That is enough to stop a
 * loop or a bored stranger, which is the realistic threat for a personal app.
 *
 * BASIL_RATE_PER_MIN and BASIL_RATE_PER_DAY override the defaults; 0 turns a
 * window off.
 */

const MINUTE = 60_000
const DAY = 86_400_000

export type Limits = { perMinute: number; perDay: number }

export function limitsFromEnv(env: NodeJS.ProcessEnv = process.env): Limits {
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v)
    return v !== undefined && v.trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
  }
  return { perMinute: num(env.BASIL_RATE_PER_MIN, 20), perDay: num(env.BASIL_RATE_PER_DAY, 300) }
}

/** Vercel sets x-vercel-forwarded-for itself, so a visitor can't fake it;
 *  most other proxies put the caller first in x-forwarded-for. */
export function clientIp(req: IncomingMessage): string {
  const vercel = req.headers['x-vercel-forwarded-for']
  const fromVercel = (Array.isArray(vercel) ? vercel[0] : vercel)?.split(',')[0]?.trim()
  if (fromVercel) return fromVercel
  const fwd = req.headers['x-forwarded-for']
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim()
  const real = req.headers['x-real-ip']
  return first || (Array.isArray(real) ? real[0] : real) || req.socket?.remoteAddress || 'unknown'
}

type Hits = { minuteStart: number; minute: number; dayStart: number; day: number }

export class RateLimiter {
  private hits = new Map<string, Hits>()

  constructor(private limits: () => Limits = limitsFromEnv, private now: () => number = Date.now) {}

  /** Records one call and says whether it is allowed. A refused call is not
   *  counted, so waiting out the window always works. */
  take(key: string): { ok: true } | { ok: false; retryAfterSec: number; window: 'minute' | 'day' } {
    const { perMinute, perDay } = this.limits()
    const t = this.now()
    let h = this.hits.get(key)
    if (!h) {
      h = { minuteStart: t, minute: 0, dayStart: t, day: 0 }
      this.hits.set(key, h)
    }
    if (t - h.minuteStart >= MINUTE) { h.minuteStart = t; h.minute = 0 }
    if (t - h.dayStart >= DAY) { h.dayStart = t; h.day = 0 }

    if (perDay > 0 && h.day >= perDay) {
      return { ok: false, window: 'day', retryAfterSec: Math.ceil((h.dayStart + DAY - t) / 1000) }
    }
    if (perMinute > 0 && h.minute >= perMinute) {
      return { ok: false, window: 'minute', retryAfterSec: Math.ceil((h.minuteStart + MINUTE - t) / 1000) }
    }
    h.minute += 1
    h.day += 1
    this.prune(t)
    return { ok: true }
  }

  /** Keeps memory flat on a long-running server: forget anyone idle a day. */
  private prune(t: number) {
    if (this.hits.size < 1000) return
    for (const [k, h] of this.hits) if (t - h.dayStart >= DAY && t - h.minuteStart >= MINUTE) this.hits.delete(k)
  }
}
