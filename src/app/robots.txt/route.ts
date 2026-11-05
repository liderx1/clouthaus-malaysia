import { seo } from '@/lib/seo'
export const dynamic = 'force-dynamic'
export async function GET() {
  const s = await seo()
  const body = s.noindex ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /admin\n${s.site ? `Sitemap: ${s.site}/sitemap.xml\n` : ''}`
  return new Response(body, { headers: { 'content-type': 'text/plain' } })
}
