import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Editor', plural: 'Editors' },
  auth: true,
  admin: { useAsTitle: 'email', group: 'Settings · 设定' },
  fields: [{ name: 'name', type: 'text' }],
}
