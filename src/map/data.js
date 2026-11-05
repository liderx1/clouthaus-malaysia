import * as THREE from 'three';
import { S } from './state.js';

/* ---------- data ---------- */
// ?preview=1 is the CMS live preview (drafts, refreshed while the editor types); ?pick=1 lets the CMS pick a spot on the map
export const Q = new URLSearchParams(location.search),
  PREVIEW = Q.has('preview'),
  PICK = Q.has('pick');
const src = (u) => (PREVIEW ? `${u}?draft=1` : u);
export const json = (u) =>
  fetch(src(u), { cache: PREVIEW ? 'no-store' : 'default' })
    .then((r) => r.json())
    .catch(() => ({}));
export const [OSM, PLACES, STORES, SITE, TOPICS, NOTICES, FACIL, FEATS, SITE_FACTS] = await Promise.all([
  fetch('/map/osm.json').then((r) => r.json()),
  json('/content/places.json'),
  json('/content/stores.json').then((d) => (d.items || []).filter((s) => s && s.name)),
  ...['site', 'topics', 'notices', 'facilities', 'features'].map((n) => json(`/content/${n}.json`)),
  json('/content/facts.json'),
]);
// CMS files are { en, ms, zh }; empty translations fall back to English
export const tr = (d, key) => {
  const v = d?.[S.lang]?.[key],
    e = d?.en?.[key];
  return v && typeof v === 'object' && !Array.isArray(v)
    ? { ...e, ...Object.fromEntries(Object.entries(v).filter(([, x]) => x)) }
    : v || e;
};
export const items = (d) =>
  (d?.en?.items || []).map((it, i) => {
    const o = { ...it };
    for (const [k, x] of Object.entries(d?.[S.lang]?.items?.[i] || {})) if (x) o[k] = x;
    return o;
  });
export const V = (x, y, z = 0) => new THREE.Vector3(x, z, -y);
export { ring } from './core/geometry.js';
import { area, inPoly, ring } from './core/geometry.js';
import { CONFIG } from './config.js';
// the main building (site.config.json → main): found by its OpenStreetMap name, else the largest building at the origin
export const MALL =
  OSM.buildings.find((b) => b.name === CONFIG.main.osmName) ??
  OSM.buildings
    .filter((b) => inPoly(0, 0, ring(b.p)))
    .sort((a, b) => Math.abs(area(ring(b.p))) - Math.abs(area(ring(a.p))))[0];
export const MALL_R = ring(MALL.p);
export const MALL_H = CONFIG.main.height;
