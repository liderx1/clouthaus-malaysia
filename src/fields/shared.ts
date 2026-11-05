import type { Field } from 'payload'

/** x / y (metres from the centre of the mall) with a "pick on the 3D map" button next to them */
export const mapPosition = (name = 'pin', label = 'Position on the 3D map', opts: { z?: boolean; required?: boolean; estimated?: boolean } = {}): Field => ({
  name,
  label,
  type: 'group',
  admin: { description: 'Click “Pick on the map” and tap the spot on the 3D map. x = metres east, y = metres north of the mall centre.' },
  fields: [
    { name: 'picker', type: 'ui', admin: { components: { Field: '@/components/MapPicker#MapPicker' } } },
    {
      type: 'row',
      fields: [
        { name: 'x', label: 'x (east, m)', type: 'number', required: opts.required, admin: { width: '33%', step: 0.1 } },
        { name: 'y', label: 'y (north, m)', type: 'number', required: opts.required, admin: { width: '33%', step: 0.1 } },
        ...(opts.z ? [{ name: 'z', label: 'Height (m)', type: 'number', defaultValue: 0, admin: { width: '33%', step: 0.5, description: 'MRT bridge ≈ 9 m' } } as Field] : []),
      ],
    },
    ...(opts.estimated ? [{ name: 'estimated', label: 'Estimated (not yet checked on the floor plan)', type: 'checkbox' } as Field] : []),
  ],
})

export const orderable = { orderable: true } as const
