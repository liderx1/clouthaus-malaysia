import { payload, url } from './content'
import { SITE_CONFIG } from './site'
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
export async function seo() {
  const s: any = await (await payload()).findGlobal({ slug: 'seo', locale: 'en', depth: 1 }).catch(() => ({}))
  return { title: s.title || SITE_CONFIG.seo?.en?.title || SITE_CONFIG.name, description: s.description || '', image: url(s.ogImage), site: (s.siteUrl || '').replace(/\/$/, ''), noindex: s.noindex !== false, gaId: s.gaId || '', gsc: s.gscVerification || '' }
}
export function headTags(s: Awaited<ReturnType<typeof seo>>) {
  const abs = (u: string) => (u && !/^https?:/.test(u) && s.site ? s.site + u : u)
  return [
    `<title>${esc(s.title)}</title>`,
    `<meta name="description" content="${esc(s.description)}">`,
    `<meta name="robots" content="${s.noindex ? 'noindex, nofollow' : 'index, follow'}">`,
    s.site && `<link rel="canonical" href="${esc(s.site)}/">`,
    `<meta property="og:type" content="website"><meta property="og:title" content="${esc(s.title)}"><meta property="og:description" content="${esc(s.description)}">`,
    s.site && `<meta property="og:url" content="${esc(s.site)}/">`,
    s.image && `<meta property="og:image" content="${esc(abs(s.image))}"><meta name="twitter:card" content="summary_large_image">`,
    s.gsc && `<meta name="google-site-verification" content="${esc(s.gsc)}">`,
    s.gaId && `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(s.gaId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(s.gaId)}');</script>`,
  ].filter(Boolean).join('\n')
}
