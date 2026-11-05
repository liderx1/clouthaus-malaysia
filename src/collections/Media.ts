import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: { group: 'Settings · 设定', description: 'Logos, event posters and photos. Square logos work best (e.g. 160 × 160).' },
  access: { read: () => true },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [{ name: 'thumb', width: 320, height: 320, fit: 'inside', formatOptions: { format: 'webp', options: { quality: 82 } } }],
    adminThumbnail: 'thumb',
  },
  fields: [{ name: 'alt', label: 'Alt text', type: 'text', localized: true }],
}
