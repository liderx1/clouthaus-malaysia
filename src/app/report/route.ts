import { getPayload } from 'payload'
import config from '@payload-config'

// POST /report — the 3D map's error and slow-frame beacons (src/map/report.js) land here and are stored in the
// "Site health" collection. Small bodies only, a per-address rate limit, and identical reports merged into one row.

const MAX_BODY = 2048
const PER_MINUTE = 10
const hits = new Map<string, { n: number; t: number }>()

const clip = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const h = hits.get(ip)
  if (h && now - h.t < 60_000) {
    if (++h.n > PER_MINUTE) return new Response(null, { status: 429 })
  } else hits.set(ip, { n: 1, t: now })
  if (hits.size > 5000) hits.clear()

  const text = await req.text()
  if (!text || text.length > MAX_BODY) return new Response(null, { status: 413 })
  let body: Record<string, unknown>
  try {
    body = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }
  const kind = body.kind === 'slow' ? 'slow' : body.kind === 'error' ? 'error' : null
  const message = clip(body.message, 300)
  if (!kind || !message) return new Response(null, { status: 400 })
  const source = clip(body.source, 200)
  const device = body.device === 'phone' ? 'phone' : 'desktop'
  const key = clip(`${kind}|${message}|${source}|${device}`, 600)

  const payload = await getPayload({ config })
  const found = await payload.find({ collection: 'reports', where: { key: { equals: key } }, limit: 1, depth: 0 })
  const lastSeen = new Date().toISOString()
  if (found.docs[0])
    await payload.update({
      collection: 'reports',
      id: found.docs[0].id,
      data: { count: (found.docs[0].count || 1) + 1, lastSeen, page: clip(body.page, 300), userAgent: clip(req.headers.get('user-agent'), 300) },
      overrideAccess: true,
    })
  else
    await payload.create({
      collection: 'reports',
      data: { kind, message, source, device, key, count: 1, lastSeen, page: clip(body.page, 300), userAgent: clip(req.headers.get('user-agent'), 300) },
      overrideAccess: true,
    })
  return new Response(null, { status: 204 })
}
