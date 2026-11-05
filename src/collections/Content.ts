import type { CollectionConfig } from 'payload'
import { mapPosition } from '../fields/shared'
import { abs } from '../fields/preview'
import { SITE_CONFIG } from '../lib/site'
import { publishedOrEditor } from '../access'

const WHATS_ON = "What's on · 活动"
const GETTING = 'Getting here · 交通'
const live = (hash: string) => ({ url: ({ req }: any) => abs(req, `/?preview=1#${hash}`) })
const common = { orderable: true, access: { read: publishedOrEditor }, versions: { drafts: { autosave: { interval: 400 } } } } as const

export const Events: CollectionConfig = {
  slug: 'events', ...common,
  labels: { singular: 'Event / campaign', plural: 'Events & campaigns' },
  admin: { useAsTitle: 'title', group: WHATS_ON, defaultColumns: ['image', 'title', 'category', 'start', 'end', '_status'], livePreview: live('news'),
    description: 'Cards in the What’s on tab. Drag to reorder; the first one is the highlight.' },
  fields: [
    { type: 'row', fields: [
      { name: 'title', type: 'text', required: true, localized: true, admin: { width: '60%' } },
      { name: 'category', type: 'select', required: true, defaultValue: 'event', admin: { width: '40%' }, options: [{ label: 'Event', value: 'event' }, { label: 'Campaign', value: 'campaign' }, { label: 'Pop-up', value: 'popup' }] },
    ] },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { type: 'row', fields: [
      { name: 'start', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
      { name: 'end', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
    ] },
    { name: 'note', label: 'Custom date text', type: 'text', localized: true, admin: { description: 'Optional, e.g. “Every weekend in October”. Replaces the dates.' } },
  ],
}

export const Highlights: CollectionConfig = {
  slug: 'highlights', ...common,
  labels: { singular: 'Highlight', plural: 'Highlights' },
  admin: { useAsTitle: 'title', group: WHATS_ON, defaultColumns: ['image', 'title', 'subtitle', '_status'], livePreview: live('news') },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'desc', label: 'Description', type: 'textarea', localized: true },
    { type: 'row', fields: [
      { name: 'subtitle', label: 'Small line', type: 'text', localized: true, admin: { width: '50%' } },
      { name: 'link', type: 'text', admin: { width: '50%', description: 'A part of the site (/#stores, /#visit, /#about, /#route=mrt) or a full https:// address.' } },
    ] },
  ],
}

export const Notices: CollectionConfig = {
  slug: 'notices', ...common,
  labels: { singular: 'Notice', plural: 'Notices' },
  admin: { useAsTitle: 'text', group: WHATS_ON, defaultColumns: ['text', 'date', '_status'], livePreview: live('news'), description: 'The first notice also shows at the top of the map.' },
  fields: [
    { name: 'text', type: 'text', required: true, localized: true },
    { type: 'row', fields: [
      { name: 'date', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
      { name: 'link', type: 'text', admin: { width: '50%' } },
    ] },
  ],
}

export const Facilities: CollectionConfig = {
  slug: 'facilities', ...common,
  labels: { singular: 'Facility', plural: 'Facilities' },
  admin: { useAsTitle: 'name', group: 'Visit · 到访', defaultColumns: ['name', 'icon', 'where'], livePreview: live('visit') },
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, localized: true, admin: { width: '60%' } },
      { name: 'icon', type: 'select', admin: { width: '40%' }, options: ['atm', 'baby', 'stroller', 'carwash', 'parking', 'wc', 'wifi', 'alert', 'surau', 'wheel'].map((v) => ({ label: v, value: v })) },
    ] },
    { name: 'where', label: 'Where / details', type: 'textarea', localized: true },
  ],
}

export const Facts: CollectionConfig = {
  slug: 'facts', ...common,
  labels: { singular: 'Why visit', plural: 'Why visit' },
  admin: { useAsTitle: 'title', group: 'Visit · 到访', livePreview: live('visit'), description: 'Selling points shown first in the Visit tab.' },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'text', type: 'textarea', localized: true },
  ],
}

export const Entrances: CollectionConfig = {
  slug: 'entrances', ...common,
  labels: { singular: 'Entrance', plural: 'Entrances' },
  admin: { useAsTitle: 'name', group: GETTING, defaultColumns: ['name', 'kind', 'key'], livePreview: live('go'), description: 'Mall entrances and car park entrances. Routes end at one of these.' },
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, localized: true, admin: { width: '50%' } },
      { name: 'kind', label: 'Type', type: 'select', required: true, admin: { width: '25%' }, options: [{ label: 'Main', value: 'main' }, { label: 'MRT', value: 'mrt' }, { label: 'Bus', value: 'bus' }, { label: 'Side', value: 'side' }, { label: 'Car park', value: 'parking' }] },
      { name: 'key', label: 'Short ID', type: 'text', required: true, unique: true, admin: { width: '25%', description: 'Used by routes, e.g. parkA' } },
    ] },
    mapPosition('pos', 'Where it is', { z: true, required: true }),
  ],
}

export const Exits: CollectionConfig = {
  slug: 'exits', ...common,
  labels: { singular: 'Emergency exit / assembly point', plural: 'Emergency exits' },
  admin: { useAsTitle: 'name', group: GETTING, defaultColumns: ['name', 'kind'], livePreview: live('safety'), description: 'Copy these from the mall’s approved evacuation plan.' },
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, localized: true, admin: { width: '60%' } },
      { name: 'kind', label: 'Type', type: 'select', required: true, defaultValue: 'exit', admin: { width: '40%' }, options: [{ label: 'Emergency exit', value: 'exit' }, { label: 'Assembly point', value: 'assembly' }] },
    ] },
    mapPosition('pos', 'Where it is', { required: true }),
  ],
}

export const Routes: CollectionConfig = {
  slug: 'routes', ...common,
  labels: { singular: 'Route', plural: 'Getting-here routes' },
  admin: { useAsTitle: 'label', group: GETTING, defaultColumns: ['label', 'mode', 'to'], livePreview: { url: ({ data, req }: any) => abs(req, `/?preview=1#route=${data?.key ?? ''}`) },
    description: 'Each route becomes a button. The path is worked out on the real road network.' },
  fields: [
    { type: 'row', fields: [
      { name: 'label', label: 'Button label', type: 'text', required: true, localized: true, admin: { width: '50%' } },
      { name: 'key', label: 'Short ID', type: 'text', required: true, unique: true, admin: { width: '25%' } },
      { name: 'mode', type: 'select', required: true, defaultValue: 'walk', admin: { width: '25%' }, options: [{ label: 'Walk', value: 'walk' }, { label: 'Drive', value: 'drive' }] },
    ] },
    { name: 'note', label: 'Directions', type: 'text', localized: true },
    { name: 'to', label: 'Ends at', type: 'relationship', relationTo: 'entrances', required: true },
    { name: 'start', label: 'Driving start', type: 'select', admin: { condition: (_, s) => s?.mode === 'drive' }, options: SITE_CONFIG.drive.starts },
    { ...mapPosition('from', 'Walking start', { z: true }), admin: { condition: (_: unknown, s: any) => s?.mode !== 'drive' } } as any,
  ],
}
