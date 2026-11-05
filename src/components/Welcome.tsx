import { SITE_CONFIG } from '@/lib/site'
import Link from 'next/link'

const card: React.CSSProperties = { display: 'block', padding: '18px 20px', borderRadius: 14, background: 'var(--theme-elevation-50)', textDecoration: 'none', color: 'inherit' }
const items: [string, string, string][] = [
  ['/admin/collections/stores', 'Stores · 商店', 'Add a store, change its unit or logo, or tap where it is on the 3D map.'],
  ['/admin/collections/events', "What's on · 活动", 'Events, campaigns and pop-ups, with dates and a poster.'],
  ['/admin/collections/notices', 'Notices · 公告', 'Short notices; the first one shows at the top of the map.'],
  ['/admin/globals/site', 'Mall info · 商场资料', 'Opening hours, address, MRT and car directions, social links.'],
  ['/admin/collections/entrances', 'Entrances & exits · 出入口', 'Move an entrance or emergency exit by tapping the map.'],
  ['/admin/globals/seo', 'SEO & Analytics', 'Page title, description, share image and Google Analytics.'],
]
export const Welcome = () => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ margin: '0 0 6px' }}>Welcome to the {SITE_CONFIG.name} content manager</h2>
    <p style={{ margin: '0 0 18px', opacity: .75 }}>Everything on the website is edited here. Each edit shows live in the preview next to it; press <b>Publish</b> to put it on the site. Switch language (English / BM / 中文) at the top of any form.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {items.map(([href, t, d]) => <Link key={href} href={href} style={card}><b style={{ display: 'block', marginBottom: 4 }}>{t}</b><span style={{ opacity: .75, fontSize: 13 }}>{d}</span></Link>)}
    </div>
    <p style={{ marginTop: 16 }}><a href="/" target="_blank" rel="noopener">Open the website ↗</a></p>
  </div>
)
