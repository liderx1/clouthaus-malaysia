import type { CollectionConfig } from 'payload'
import { SITE_CONFIG } from '../lib/site'
import { mapPosition } from '../fields/shared'
import { abs } from '../fields/preview'
import { publishedOrEditor } from '../access'

export const CATEGORIES = [
  { label: 'Food & drink', value: 'food' }, { label: 'Fashion', value: 'fashion' }, { label: 'Beauty & health', value: 'beauty' },
  { label: 'Gadgets & telco', value: 'tech' }, { label: 'Home & lifestyle', value: 'home' }, { label: 'Fun & family', value: 'fun' },
  { label: 'Groceries', value: 'grocery' }, { label: 'Services', value: 'services' },
]

export const Stores: CollectionConfig = {
  slug: 'stores',
  labels: { singular: 'Store', plural: 'Stores · 商店' },
  orderable: true,
  versions: { drafts: { autosave: { interval: 400 } } },
  admin: {
    useAsTitle: 'name', group: 'Stores · 商店',
    defaultColumns: ['logo', 'name', 'floor', 'unit', 'category', 'featured', '_status'],
    listSearchableFields: ['name', 'unit'],
    description: 'Every store on the 3D map and in the Stores tab. Pick a store to edit it; the preview on the right updates as you type.',
    livePreview: { url: ({ data, req }: any) => abs(req, `/?preview=1#store=${encodeURIComponent(String(data?.name ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))}-${String(data?.unit ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')}`) },
  },
  access: { read: publishedOrEditor },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'logo', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'floor', type: 'select', required: true, options: SITE_CONFIG.floors.map((f) => ({ label: f.admin ?? f.code, value: f.code })), admin: { width: '25%' } },
        { name: 'unit', type: 'text', required: true, admin: { width: '25%' } },
        { name: 'category', type: 'select', required: true, defaultValue: 'food', options: CATEGORIES, admin: { width: '30%' } },
        { name: 'featured', label: 'Anchor store ★', type: 'checkbox', admin: { width: '20%', description: 'Shown first.' } },
      ],
    },
    { name: 'desc', label: 'Short description (store card)', type: 'textarea', localized: true, admin: { description: 'Leave empty for an automatic line with floor and unit.' } },
    mapPosition('pin', 'Where the store is', { estimated: true }),
  ],
}
