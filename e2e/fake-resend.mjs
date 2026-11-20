// Stands in for api.resend.com (the site server reaches it via RESEND_BASE_URL).
// Tests run in parallel against one instance, so every send is attributed to the
// test whose marker string appears in its body, and failure modes are per marker.
import { createServer } from 'node:http'

const PORT = 8099
const sent = []
const failingMarkers = new Set()

const readBody = req => new Promise(resolve => {
  let data = ''
  req.on('data', chunk => { data += chunk })
  req.on('end', () => resolve(data))
})

const reply = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const marker = url.searchParams.get('marker')

  if (req.method === 'GET' && url.pathname === '/__health') return reply(res, 200, { ok: true })
  if (req.method === 'GET' && url.pathname === '/__sent') {
    return reply(res, 200, sent.filter(entry => entry.raw.includes(marker)).map(entry => entry.body))
  }
  if (req.method === 'POST' && url.pathname === '/__fail') {
    failingMarkers.add(marker)
    return reply(res, 200, { ok: true })
  }
  if (req.method === 'POST' && url.pathname === '/emails') {
    const raw = await readBody(req)
    sent.push({ raw, body: JSON.parse(raw) })
    const failing = [...failingMarkers].some(m => raw.includes(m))
    return failing
      ? reply(res, 422, { name: 'validation_error', message: 'fake failure', statusCode: 422 })
      : reply(res, 200, { id: 'test-email' })
  }
  reply(res, 404, { message: 'Not found' })
}).listen(PORT, '127.0.0.1')
