// The site's own settings for the CMS and the server (site.config.json at the repo root; the map reads the same file).
import config from '../../site.config.json'

export const SITE_CONFIG = config as typeof config & { locales: string[] }
/** the languages offered, the first one being the default */
export const LOCALES = SITE_CONFIG.locales
/** names of the languages in the admin's language menu */
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ms: 'Bahasa Melayu', zh: '中文（简体）', 'zh-TW': '中文（繁體）', ja: '日本語', ko: '한국어', th: 'ไทย', vi: 'Tiếng Việt', id: 'Bahasa Indonesia',
}
export const localeName = (code: string) => LOCALE_NAMES[code] ?? code
