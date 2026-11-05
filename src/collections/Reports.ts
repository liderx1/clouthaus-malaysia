import type { CollectionConfig } from 'payload'

// Site health: errors and slow frame rates reported by visitors' browsers through POST /report.
// Identical reports are merged (count + last seen), so the table stays small. Editors can read and delete, never write.
export const Reports: CollectionConfig = {
  slug: 'reports',
  labels: { singular: 'Site health report', plural: 'Site health' },
  access: {
    read: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
    create: () => false,
    update: () => false,
  },
  admin: {
    useAsTitle: 'message',
    group: 'Settings · 设定',
    defaultColumns: ['kind', 'message', 'count', 'device', 'lastSeen'],
    description:
      'Problems visitors’ browsers ran into on the 3D map: script errors, and phones or computers that could not keep a smooth frame rate. Identical reports are counted together. Delete a report once it is dealt with.',
  },
  defaultSort: '-lastSeen',
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Error', value: 'error' },
        { label: 'Slow', value: 'slow' },
      ],
      admin: { readOnly: true },
    },
    { name: 'message', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'source', type: 'text', admin: { readOnly: true, description: 'File and line, when the browser gave one.' } },
    { name: 'device', type: 'select', options: ['desktop', 'phone'], admin: { readOnly: true } },
    { name: 'page', type: 'text', admin: { readOnly: true } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'count', type: 'number', defaultValue: 1, admin: { readOnly: true } },
    { name: 'lastSeen', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'key', type: 'text', index: true, admin: { hidden: true } },
  ],
}
