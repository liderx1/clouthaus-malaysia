import fs from 'node:fs/promises'
import path from 'node:path'
import { headTags, seo } from '@/lib/seo'

export const dynamic = 'force-dynamic'
// The site is the 3D map: src/site/index.html with the SEO and analytics tags from the CMS put in.
export async function GET() {
  const [html, s] = await Promise.all([fs.readFile(path.join(process.cwd(), 'src/site/index.html'), 'utf8'), seo()])
  const page = html.replace(/<title>[\s\S]*?<\/title>\s*/, '').replace(/<meta name="description"[^>]*>\s*/, '').replace(/<meta name="robots"[^>]*>\s*/, '').replace('</head>', headTags(s) + '\n</head>')
  return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, s-maxage=30, stale-while-revalidate=60' } })
}
