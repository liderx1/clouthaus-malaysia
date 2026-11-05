import { SITE_CONFIG } from '@/lib/site'
export const Logo = () => <img src={SITE_CONFIG.logo} alt={SITE_CONFIG.name} style={{ width: 180, height: 'auto' }} />
export const Icon = () => <img src="/images/favicon.svg" alt="" style={{ width: 24, height: 24 }} />
