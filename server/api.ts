import type { IncomingMessage, ServerResponse } from 'node:http'
import { aiStatus, parseItems, suggestMeals } from './handlers.js'
import { RateLimiter, clientIp } from './rateLimit.js'

const MAX_BODY = 64 * 1024

function readBody(req: IncomingMessage): Promise<string> {
  // Vercel parses JSON bodies before the handler runs and drains the stream,
  // so reading it again would hang. Use what it already parsed.
  const parsed = (req as { body?: unknown }).body
  if (parsed !== undefined && parsed !== null) {
    const text = typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
    return text.length > MAX_BODY ? Promise.reject(new Error('body too large')) : Promise.resolve(text)
  }
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      if (data.length > MAX_BODY) return   // already refused; drain the rest
      data += chunk
      if (data.length > MAX_BODY) reject(new Error('body too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/**
 * Browsers say which site a request came from. Only Basil's own pages may
 * spend the model key from a browser, so another website can't quietly use
 * it through its visitors. Scripts outside a browser send no origin; the rate
 * limit is what holds them back.
 */
export function fromThisSite(req: IncomingMessage): boolean {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = req.headers.origin
  if (!origin) return true
  const hosts = [req.headers['x-forwarded-host'], req.headers.host].flat().filter(Boolean)
  try {
    return hosts.includes(new URL(origin).host)
  } catch {
    return false
  }
}

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(JSON.stringify(body))
}

/**
 * The whole API surface, as a plain node handler so the same code runs behind
 * the Vite dev server and behind Express in production. Returns true if it
 * handled the request.
 *
 * The provider key is read here, server-side. Nothing on these routes echoes
 * it back, and it is never part of the client bundle.
 */
export function createApiHandler(limiter: RateLimiter = new RateLimiter()) {
  /** Only calls that would reach the model count against the visitor. */
  const allowed = (req: IncomingMessage, res: ServerResponse): boolean => {
    const verdict = limiter.take(clientIp(req))
    if (verdict.ok) return true
    res.setHeader('retry-after', String(verdict.retryAfterSec))
    send(res, 429, {
      ok: false,
      reason: 'rate-limited',
      detail: `too many requests this ${verdict.window}; retry in ${verdict.retryAfterSec}s`,
    })
    return false
  }

  return async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = (req.url ?? '').split('?')[0]
    if (!url.startsWith('/api/')) return false

    if (url === '/api/status') {
      send(res, 200, aiStatus())
      return true
    }

    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST')
      send(res, 405, { error: 'POST only' })
      return true
    }

    if (!fromThisSite(req)) {
      send(res, 403, { ok: false, reason: 'forbidden', detail: 'requests from other sites are not accepted' })
      return true
    }

    let body: any
    try {
      body = JSON.parse((await readBody(req)) || '{}')
    } catch (err) {
      const big = err instanceof Error && err.message === 'body too large'
      send(res, big ? 413 : 400, { error: big ? 'body too large' : 'bad body' })
      return true
    }
    if (!body || typeof body !== 'object') {
      send(res, 400, { error: 'bad body' })
      return true
    }

    try {
      if (url === '/api/parse') {
        const text = typeof body.text === 'string' ? body.text.slice(0, 4000) : ''
        if (!text.trim()) return send(res, 400, { error: 'nothing to parse' }), true
        if (!allowed(req, res)) return true
        send(res, 200, await parseItems(text))
        return true
      }
      if (url === '/api/suggest') {
        const inv = typeof body.inventory === 'string' ? body.inventory.slice(0, 8000) : ''
        const dietary = Array.isArray(body.dietary) ? body.dietary.slice(0, 12).map(String) : []
        if (!allowed(req, res)) return true
        send(res, 200, await suggestMeals(inv, dietary))
        return true
      }
    } catch (err) {
      // the details stay in the server log; the visitor only needs to know to fall back
      console.error('[basil] api error', err)
      send(res, 500, { ok: false, reason: 'unreachable', detail: 'server error' })
      return true
    }

    send(res, 404, { error: 'no such route' })
    return true
  }
}

export const handleApi = createApiHandler()
