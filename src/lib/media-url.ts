// Pure helper, no Payload or Next imports, so the unit tests can load it directly (tests/unit/media-url.test.mjs).

/**
 * an uploaded image's address, stamped with when it last changed (?v=…). Browsers and the CDN keep images for days;
 * the stamp gives a replaced file a new address, so visitors see the new picture at once while unchanged ones stay cached.
 */
export const url = (m: unknown) => {
  if (!m || typeof m !== 'object' || !('url' in m)) return ''
  const { url: u, updatedAt } = m as { url?: string; updatedAt?: string }
  if (!u) return ''
  const v = updatedAt ? Date.parse(updatedAt) : NaN
  return Number.isFinite(v) ? `${u}${u.includes('?') ? '&' : '?'}v=${v.toString(36)}` : u
}
