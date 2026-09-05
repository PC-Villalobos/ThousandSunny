import http from 'node:http'
import { readFileSync } from 'node:fs'

import { sanitizeControl } from './sanitize.mjs'

const HOST = '127.0.0.1'
const PORT = Number(process.env.SUNNY_PREVIEW_PORT || 4328)
const SOURCE_URL = process.env.SUNNY_PREVIEW_SOURCE_URL
const INIT_DATA = process.env.SUNNY_PREVIEW_INIT_DATA
const candidateUrl = new URL('../runtime_candidate/public/cubierta.html', import.meta.url)

if (!SOURCE_URL) throw new Error('SUNNY_PREVIEW_SOURCE_URL is required')
if (!INIT_DATA) throw new Error('SUNNY_PREVIEW_INIT_DATA is required')
const source = new URL(SOURCE_URL)
if (source.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(source.hostname)) {
  throw new Error('SUNNY_PREVIEW_SOURCE_URL must be loopback HTTP')
}

const page = readFileSync(candidateUrl, 'utf8').replace(
  '<script>',
  '<script>window.__CUBIERTA_PREVIEW__=true;</script><script>',
)

const send = (res, status, type, body) => {
  res.writeHead(status, {
    'content-type': type,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, 'application/json', JSON.stringify({ error: 'read_only_preview' }))
  if (req.url === '/' || req.url === '/cubierta.html') return send(res, 200, 'text/html; charset=utf-8', page)
  if (req.url !== '/preview/control') return send(res, 404, 'application/json', JSON.stringify({ error: 'not_found' }))

  try {
    const upstream = await fetch(source, {
      method: 'GET',
      headers: { 'x-telegram-init-data': INIT_DATA },
      redirect: 'error',
      cache: 'no-store',
    })
    const payload = await upstream.json()
    if (!upstream.ok) return send(res, 502, 'application/json', JSON.stringify({ error: 'upstream_rejected' }))
    const control = sanitizeControl(payload.control || payload)
    return send(res, 200, 'application/json', JSON.stringify({ control }))
  } catch {
    return send(res, 502, 'application/json', JSON.stringify({ error: 'preview_source_unavailable' }))
  }
})

server.listen(PORT, HOST, () => {
  process.stdout.write(`Cubierta preview: http://${HOST}:${PORT}\n`)
})
