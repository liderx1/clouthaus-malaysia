import type { GlobalConfig } from 'payload'
import { abs } from '../fields/preview'
import { editorsOnly } from '../access'
import { SITE_CONFIG } from '../lib/site'

const SETTINGS = 'Settings · 设定'
const social = (name: string, label: string) => ({ name, label, type: 'group' as const, fields: [
  { type: 'row' as const, fields: [{ name: 'handle', type: 'text' as const, admin: { width: '40%' } }, { name: 'url', label: 'Link', type: 'text' as const, admin: { width: '60%' } }] },
  { name: 'text', label: 'Description', type: 'textarea' as const, localized: true },
] })

export const Site: GlobalConfig = {
  slug: 'site', label: 'Mall info & contact', access: { read: editorsOnly },
  versions: { drafts: { autosave: { interval: 400 } } },
  admin: { group: 'Visit · 到访', livePreview: { url: ({ req }: any) => abs(req, '/?preview=1#visit') } },
  fields: [
    { name: 'hours', label: 'Opening hours', type: 'text', localized: true, admin: { description: 'Keep the times in the form “10:00am – 10:00pm”: the map reads them for “Open now”.' } },
    { name: 'address', type: 'text', localized: true },
    { type: 'row', fields: [{ name: 'email', type: 'email', admin: { width: '50%' } }, { name: 'mapUrl', label: 'Google Maps link', type: 'text', admin: { width: '50%' } }] },
    { name: 'mrt', label: 'By MRT', type: 'textarea', localized: true },
    { name: 'car', label: 'By car', type: 'textarea', localized: true },
    social('instagram', 'Instagram'), social('facebook', 'Facebook'),
  ],
}

export const Seo: GlobalConfig = {
  slug: 'seo', label: 'SEO & analytics', access: { read: editorsOnly },
  admin: { group: SETTINGS, description: 'What Google, social media and link previews show, plus Google Analytics.' },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Search & sharing', fields: [
        { name: 'title', label: 'Page title', type: 'text', localized: true, required: true, maxLength: 70, admin: { description: 'About 50–60 characters. Shown in the browser tab and in Google.' } },
        { name: 'description', label: 'Meta description', type: 'textarea', localized: true, maxLength: 170, admin: { description: 'About 120–160 characters. The grey text under the title in Google.' } },
        { name: 'ogImage', label: 'Share image (1200 × 630)', type: 'upload', relationTo: 'media', admin: { description: 'Shown when the link is shared on WhatsApp, Facebook, LINE…' } },
        { name: 'siteUrl', label: 'Website address', type: 'text', defaultValue: (SITE_CONFIG as any).test?.liveUrl ?? '', admin: { description: 'The main address, used for the canonical link and the sitemap.' } },
        { name: 'noindex', label: 'Hide from search engines (noindex)', type: 'checkbox', defaultValue: true, admin: { description: 'Keep ticked while the site is a preview. Untick on launch day.' } },
      ] },
      { label: 'Analytics', fields: [
        { name: 'gaId', label: 'Google Analytics 4 measurement ID', type: 'text', admin: { placeholder: 'G-XXXXXXXXXX', description: 'Paste the ID from GA4 → Admin → Data streams. Leave empty to turn Analytics off.' }, validate: (v: unknown) => !v || /^G-[A-Z0-9]{4,}$/.test(String(v)) || 'Looks like G-XXXXXXXXXX' },
        { name: 'gscVerification', label: 'Google Search Console verification code', type: 'text', admin: { description: 'Only the content="…" part of the HTML-tag method.' } },
      ] },
    ] },
  ],
}
