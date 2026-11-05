import { seo } from '@/lib/seo'
export const dynamic = 'force-dynamic'
export async function GET() {
  const s = await seo(), base = s.site || ''
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url></urlset>\n`
  return new Response(xml, { headers: { 'content-type': 'application/xml' } })
}
