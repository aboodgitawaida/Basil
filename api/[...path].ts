import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApi } from '../server/api.js'

/** Vercel entry point: every /api/* request lands here and goes through the
 *  same handlers as `npm run dev` and `npm start`. The model key comes from
 *  the project's Environment Variables, never from the repo. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (await handleApi(req, res)) return
  res.statusCode = 404
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ error: 'no such route' }))
}
