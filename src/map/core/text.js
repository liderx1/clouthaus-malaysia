// Small text helpers shared by the map UI. Pure: unit-tested.

/** @type {Record<string, string>} */
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
/** escape text for innerHTML @param {unknown} v */
export const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ENTITIES[c]);

/** up to two letters for a store without a logo: "Coffee Bean & Tea Leaf" → "CB" */
/** @param {unknown} name */
export const initials = (name) =>
  String(name ?? '')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...w][0])
    .join('')
    .toUpperCase();

/** the store's share link id: "Starbucks", unit "LG-11" → "starbucks-lg11" */
/** @param {{ name?: string, unit?: string }} s */
export const storeSlug = (s) =>
  String(s.name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') +
  '-' +
  String(s.unit ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

/**
 * floor code as visitors read it, from the site's short names (site.config.json → floors): "1" → "L1"
 * @param {string} f @param {Record<string, string>} [short] code → short name
 */
export const floorName = (f, short = {}) => short[f] ?? f;

// names that tell a visitor nothing on a city map: "Tower 2", "Blok 3", "B", "East Wing", "Block A1"
const GENERIC =
  /^(?:(?:tower|block|blok|wing|phase|tingkat|level|annex|podium|east|west|north|south|main)\b[\s\w-]{0,6}|[\w-]{1,3}|.*\b(?:block|blok)\s*\w{1,2})$/i;
/** @param {string} name */
export const isGenericName = (name) => GENERIC.test(String(name ?? '').trim());
