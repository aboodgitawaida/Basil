import type { IncomingMessage, ServerResponse } from 'node:http'
import { aiStatus, judgeCraft, parseItems, suggestMeals } from './handlers'

const MAX_BODY = 64 * 1024

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
      if (data.length > MAX_BODY) reject(new Error('body too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
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
export async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = (req.url ?? '').split('?')[0]
  if (!url.startsWith('/api/')) return false

  if (url === '/api/status') {
    send(res, 200, aiStatus())
    return true
  }

  if (req.method !== 'POST') {
    send(res, 405, { error: 'POST only' })
    return true
  }

  let body: any
  try {
    body = JSON.parse((await readBody(req)) || '{}')
  } catch {
    send(res, 400, { error: 'bad body' })
    return true
  }

  try {
    if (url === '/api/parse') {
      const text = typeof body.text === 'string' ? body.text.slice(0, 4000) : ''
      if (!text.trim()) return send(res, 400, { error: 'nothing to parse' }), true
      send(res, 200, await parseItems(text))
      return true
    }
    if (url === '/api/suggest') {
      const inv = typeof body.inventory === 'string' ? body.inventory.slice(0, 8000) : ''
      const dietary = Array.isArray(body.dietary) ? body.dietary.slice(0, 12).map(String) : []
      send(res, 200, await suggestMeals(inv, dietary))
      return true
    }
    if (url === '/api/craft') {
      const ing = Array.isArray(body.ingredients) ? body.ingredients.slice(0, 9).map(String) : []
      if (!ing.length) return send(res, 400, { error: 'empty board' }), true
      send(res, 200, await judgeCraft(ing))
      return true
    }
  } catch (err) {
    send(res, 500, { ok: false, reason: 'unreachable', detail: String(err).slice(0, 200) })
    return true
  }

  send(res, 404, { error: 'no such route' })
  return true
}
