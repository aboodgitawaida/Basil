// Pretends to be the Gemini endpoint so the proxy can be exercised without a
// key or network. Replies from a scripted queue: valid JSON, then rubbish.
import { createServer } from 'node:http'
const replies = JSON.parse(process.argv[3] ?? '[]')
let n = 0
const seen = []
createServer((req, res) => {
  let body = ''
  req.on('data', c => (body += c))
  req.on('end', () => {
    if (req.url.includes('__seen')) { res.end(JSON.stringify(seen)); return }
    seen.push({ url: req.url, key: req.headers['x-goog-api-key'], body: JSON.parse(body || '{}') })
    const text = replies[Math.min(n++, replies.length - 1)] ?? '{}'
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }))
  })
}).listen(Number(process.argv[2]), () => console.log('stub up'))
