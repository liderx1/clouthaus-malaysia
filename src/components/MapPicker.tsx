'use client'
// "Pick on the map": opens the 3D map in pick mode; tapping a spot fills x / y (and keeps z).
import { useField } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export const MapPicker = ({ path }: { path: string }) => {
  const base = path.split('.').slice(0, -1).join('.')
  const x = useField<number>({ path: `${base}.x` }), y = useField<number>({ path: `${base}.y` })
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const on = (e: MessageEvent) => { if (e.origin !== location.origin || e.data?.type !== 'eko-pick') return; x.setValue(e.data.x); y.setValue(e.data.y); setOpen(false) }
    addEventListener('message', on); return () => removeEventListener('message', on)
  }, [open, x, y])
  const has = Number.isFinite(x.value) && Number.isFinite(y.value)
  return (
    <div style={{ marginBottom: 12 }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => setOpen(true)}>📍 Pick on the map</button>
      <span style={{ marginLeft: 12, opacity: .7, fontSize: 13 }}>{has ? `x ${x.value}, y ${y.value}` : 'Not placed yet'}</span>
      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(1100px, 94vw)', height: 'min(720px, 86vh)', borderRadius: 16, overflow: 'hidden', background: '#000', position: 'relative' }}>
            <iframe title="Pick on the map" src={`/?pick=1${has ? `&x=${x.value}&y=${y.value}` : ''}`} style={{ width: '100%', height: '100%', border: 0 }} />
            <button type="button" onClick={() => setOpen(false)} style={{ position: 'absolute', top: 10, right: 12, border: 0, borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>, document.body
      )}
    </div>
  )
}
