// One-off import of the existing site content (seed/content/*.json, seed/places.json) into Payload.
// Run once against an empty database: npm run seed. Images are uploaded to the media collection (Supabase Storage in production).
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE_CONFIG } from '../src/lib/site'

const root = process.cwd()
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'))
const p = await getPayload({ config })
const L = SITE_CONFIG.locales.filter((l) => l !== 'en') as any[]
const pub = { _status: 'published' as const }

// each part is imported only if its collection is still empty, so an interrupted run picks up where it stopped
const empty = async (c: any) => (await p.count({ collection: c })).totalDocs === 0

const media = new Map<string, number | string>()
async function upload(rel: string, alt = '') {
  if (!rel || /^https?:/.test(rel)) return undefined
  if (media.has(rel)) return media.get(rel)
  const file = path.join(root, 'public', rel)
  if (!fs.existsSync(file)) return undefined
  const doc = await p.create({ collection: 'media', data: { alt }, filePath: file })
  media.set(rel, doc.id); return doc.id
}
async function localized(collection: any, id: any, i: number, src: any, fields: string[]) {
  for (const l of L) { const it = src[l]?.items?.[i] ?? src[l]; const data: any = {}
    for (const f of fields) if (it?.[f]) data[f] = it[f]
    if (Object.keys(data).length) await p.update({ collection, id, locale: l, data: { ...data, ...pub } }) }
}

// stores
const stores = read('seed/content/stores.json').items
if (await empty('stores')) for (const s of stores) {
  await p.create({ collection: 'stores', locale: 'en', data: { ...pub, name: s.name, floor: s.floor, unit: s.unit, category: s.category ?? 'services', featured: !!s.featured,
    logo: await upload(s.logo, s.name) as any, desc: s.desc, pin: s.pin ? { x: s.pin.x, y: s.pin.y, estimated: !!s.pin.estimated } : undefined } })
}
console.log('stores', stores.length)

// translated lists
const lists: [string, string, (it: any) => Promise<any>, string[]][] = [
  ['topics', 'events', async (e) => ({ title: e.title, category: e.category, start: e.start || undefined, end: e.end || undefined, note: e.note, image: await upload(e.image, e.title) }), ['title', 'note']],
  ['features', 'highlights', async (e) => ({ title: e.title, desc: e.desc, subtitle: e.subtitle, link: e.link, image: await upload(e.image, e.title) }), ['title', 'desc', 'subtitle']],
  ['notices', 'notices', async (n) => ({ text: n.text, date: n.date || undefined, link: n.link }), ['text']],
  ['facilities', 'facilities', async (f) => ({ name: f.name, where: f.where, icon: f.icon }), ['name', 'where']],
  ['facts', 'facts', async (f) => ({ title: f.title, text: f.text }), ['title', 'text']],
]
for (const [file, collection, map, tr] of lists) {
  if (!(await empty(collection))) continue
  const src = read(`seed/content/${file}.json`)
  for (const [i, it] of (src.en.items as any[]).entries()) { const doc = await p.create({ collection: collection as any, locale: 'en', data: { ...pub, ...(await map(it)) } }); await localized(collection, doc.id, i, src, tr) }
  console.log(collection, src.en.items.length)
}

// site info (only if it was never filled in)
const siteFilled = !!((await p.findGlobal({ slug: 'site', locale: 'en' })) as any).hours
const site = read('seed/content/site.json')
const siteData = (s: any) => ({ hours: s.hours, address: s.address, email: s.email, mapUrl: s.map_url, mrt: s.mrt, car: s.car, instagram: s.instagram, facebook: s.facebook })
if (!siteFilled) await p.updateGlobal({ slug: 'site', locale: 'en', data: { ...pub, ...siteData(site.en) } })
if (!siteFilled) for (const l of L) await p.updateGlobal({ slug: 'site', locale: l, data: { ...pub, hours: site[l].hours, address: site[l].address, mrt: site[l].mrt, car: site[l].car, instagram: { ...site.en.instagram, ...site[l].instagram }, facebook: { ...site.en.facebook, ...site[l].facebook } } as any })

// entrances, exits, routes
const places = read('seed/places.json')
const ids: Record<string, any> = {}
const name3 = async (collection: any, id: any, n: any, field = 'name') => { for (const l of L) if (n?.[l]) await p.update({ collection, id, locale: l, data: { [field]: n[l], ...pub } as any }) }
if (await empty('entrances')) for (const e of places.entrances) { const d = await p.create({ collection: 'entrances', locale: 'en', data: { ...pub, name: e.name.en, kind: e.kind, key: e.id, pos: { x: e.x, y: e.y, z: e.z ?? 0 } } }); ids[e.id] = d.id; await name3('entrances', d.id, e.name) }
if (await empty('exits')) for (const [kind, list] of [['exit', places.emergency], ['assembly', places.assembly]] as const) for (const e of list) { const d = await p.create({ collection: 'exits', locale: 'en', data: { ...pub, name: e.name.en, kind, pos: { x: e.x, y: e.y } } }); await name3('exits', d.id, e.name) }
if (!Object.keys(ids).length) for (const e of (await p.find({ collection: 'entrances', limit: 100 })).docs as any[]) ids[e.key] = e.id
if (await empty('routes')) for (const r of places.routes) { const d = await p.create({ collection: 'routes', locale: 'en', data: { ...pub, label: r.label.en, note: r.note.en, key: r.id, mode: r.mode, start: r.start || undefined, to: ids[r.to], from: r.mode === 'walk' ? { x: r.x, y: r.y, z: r.z } : undefined } as any })
  for (const l of L) await p.update({ collection: 'routes', id: d.id, locale: l, data: { label: r.label[l], note: r.note[l], ...pub } }) }

// SEO defaults
const seoFilled = !!((await p.findGlobal({ slug: 'seo', locale: 'en' })) as any).title
const seoDefaults = (SITE_CONFIG as any).seo ?? {}
if (!seoFilled) for (const l of SITE_CONFIG.locales) {
  const d = seoDefaults[l] ?? {}
  await p.updateGlobal({ slug: 'seo', locale: l as any, data: { title: d.title ?? SITE_CONFIG.name, description: d.description ?? '', ...(l === 'en' ? { noindex: true, ogImage: await upload(seoDefaults.shareImage, SITE_CONFIG.name) as any } : {}) } })
}
// sharper store logos: the first import used 160 px tiles; public/images/logos holds 512 px versions made from the mall's
// own originals. Only media items still at that small size are replaced, so a logo an editor uploaded is left alone,
// and once upgraded a logo is never touched again.
const hd = path.join(root, 'public/images/logos')
let upgraded = 0
for (const m of (await p.find({ collection: 'media', where: { width: { less_than_equal: 200 } }, limit: 1000, depth: 0 })).docs as any[]) {
  // the file of the same name; Payload may have added -1, -2 … to a repeated name (but sour-little-7 is a real name)
  const name = String(m.filename ?? '')
  const file = [name, name.replace(/-\d+\.webp$/, '.webp')].map((n) => path.join(hd, n)).find((f) => fs.existsSync(f))
  if (!file) continue
  await p.update({ collection: 'media', id: m.id, data: {}, filePath: file })
  upgraded++
}
console.log('logos upgraded', upgraded)

console.log('seed done'); process.exit(0)
