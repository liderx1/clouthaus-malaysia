// Builds the JSON the 3D map reads (/content/*.json), in the same shape the map has always used:
// translated files as { en, ms, zh }, each { items: [...] } or a flat object.
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { url } from './media-url'

export { url }

import { LOCALES } from './site'
type Loc = string
// dates are stored as instants; the mall's calendar day is in Kuala Lumpur time
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }) : '')

export const payload = () => getPayload({ config })

async function all(p: Payload, collection: any, locale: Loc | 'all', draft: boolean) {
  // the public site sees published entries only; a never-published draft has empty fields and must not leak out
  const r = await p.find({ collection, locale: locale as any, draft, depth: 1, limit: 2000, pagination: false, sort: '_order', fallbackLocale: 'en' as any,
    ...(draft ? {} : { where: { _status: { equals: 'published' } } }) })
  return r.docs as any[]
}
async function perLocale(p: Payload, collection: string, draft: boolean, map: (d: any) => object) {
  const out: Record<string, { items: object[] }> = {}
  for (const l of LOCALES) out[l] = { items: (await all(p, collection, l, draft)).map(map) }
  return out
}

export async function build(file: string, draft = false): Promise<unknown> {
  const p = await payload()
  switch (file) {
    case 'stores': {
      // the card text is translated: { en, zh, … } when any language other than English has its own
      const other: Record<string, Map<any, string>> = {}
      for (const l of LOCALES.filter((l) => l !== 'en')) other[l] = new Map((await all(p, 'stores', l, draft)).map((s) => [s.id, s.desc]))
      const desc = (s: any) => {
        const t: Record<string, string> = Object.fromEntries(Object.entries(other).map(([l, m]) => [l, m.get(s.id)]).filter(([, v]) => v && v !== s.desc))
        return Object.keys(t).length ? { en: s.desc, ...t } : s.desc
      }
      return { items: (await all(p, 'stores', 'en', draft)).map((s) => ({ name: s.name, floor: s.floor, unit: s.unit, logo: url(s.logo) || s.logoPath || '', ...(url(s.plan) ? { plan: url(s.plan) } : {}), category: s.category, featured: !!s.featured,
        ...(s.desc ? { desc: desc(s) } : {}), ...(Number.isFinite(s.pin?.x) && Number.isFinite(s.pin?.y) ? { pin: { x: s.pin.x, y: s.pin.y, ...(s.pin.estimated ? { estimated: true } : {}) } } : {}) })) }
    }
    case 'topics':
      return perLocale(p, 'events', draft, (e) => ({ image: url(e.image), title: e.title, category: e.category, start: day(e.start), end: day(e.end), note: e.note ?? '' }))
    case 'features':
      return perLocale(p, 'highlights', draft, (e) => ({ image: url(e.image), title: e.title, desc: e.desc ?? '', subtitle: e.subtitle ?? '', link: e.link ?? '' }))
    case 'notices':
      return perLocale(p, 'notices', draft, (n) => ({ date: day(n.date), text: n.text, link: n.link ?? '' }))
    case 'facilities':
      return perLocale(p, 'facilities', draft, (f) => ({ icon: f.icon, name: f.name, where: f.where ?? '' }))
    case 'facts':
      return perLocale(p, 'facts', draft, (f) => ({ title: f.title, text: f.text ?? '' }))
    case 'site': {
      const out: Record<string, object> = {}
      for (const l of LOCALES) { const s: any = await p.findGlobal({ slug: 'site', locale: l as any, draft, fallbackLocale: 'en' as any })
        out[l] = { hours: s.hours, address: s.address, email: s.email, mrt: s.mrt, car: s.car, map_url: s.mapUrl, instagram: s.instagram ?? {}, facebook: s.facebook ?? {} } }
      return out
    }
    case 'places': {
      const [ent, exits, routes] = await Promise.all([all(p, 'entrances', 'all', draft), all(p, 'exits', 'all', draft), all(p, 'routes', 'all', draft)])
      const pos = (d: any, k: string) => ({ x: d[k]?.x ?? 0, y: d[k]?.y ?? 0, z: d[k]?.z ?? 0 })
      return {
        entrances: ent.map((e) => ({ id: e.key, kind: e.kind, name: e.name, ...pos(e, 'pos') })),
        emergency: exits.filter((e) => e.kind === 'exit').map((e) => ({ id: String(e.id), name: e.name, ...pos(e, 'pos') })),
        assembly: exits.filter((e) => e.kind === 'assembly').map((e) => ({ id: String(e.id), name: e.name, ...pos(e, 'pos') })),
        routes: routes.map((r) => ({ id: r.key, mode: r.mode, start: r.start ?? '', ...pos(r, 'from'), to: typeof r.to === 'object' ? r.to?.key : ent.find((e) => e.id === r.to)?.key, label: r.label, note: r.note })),
      }
    }
  }
  return null
}
