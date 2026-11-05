import { renderStores } from './content.js';
import { bus } from './core/events.js';
import { FACIL, FEATS, NOTICES, PICK, PLACES, PREVIEW, Q, SITE, SITE_FACTS, STORES, TOPICS, json } from './data.js';
import { $ } from './env.js';
import { mallC } from './mall.js';
import { flyTo } from './modes.js';
import { showPin } from './pin.js';
import { camera, controls } from './stage.js';
import { MODE, S } from './state.js';
import { buildUI, showStore } from './ui.js';

if (PICK) {
  document.body.classList.add('is-pick');
  $('#panel').hidden = true;
  const hint = document.createElement('p');
  hint.className = 'pick-hint';
  hint.textContent = 'Tap the spot on the map · 点地图上的位置';
  document.body.append(hint);
  if (Q.has('x')) {
    pickAt(+Q.get('x'), +Q.get('y'));
    flyTo(null, [+Q.get('x'), +Q.get('y')], 220);
  } else flyTo(null, [mallC[0], mallC[1]], 320);
}
bus.on('map:pick', ([x, y]) => pickAt(x, y));
export function pickAt(x, y) {
  MODE.store = { name: `x ${x}, y ${y}`, unit: '', floor: 'G', pin: { x, y } };
  showPin(MODE.store);
  S.dimTarget = 0.4;
}
if (PREVIEW) {
  // the CMS sends a message on every edit; drafts autosave, so re-read the content shortly after typing stops
  let t = 0;
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !/^payload-(live-preview|document-event)$/.test(e.data?.type || '')) return;
    if (e.data.collectionSlug === 'stores' && e.data.data && MODE.store) liveStore(e.data.data); // instant, from the form itself
    clearTimeout(t);
    t = setTimeout(refreshContent, e.data.type === 'payload-document-event' ? 50 : 900);
  });
  (window.opener || parent).postMessage({ type: 'payload-live-preview', ready: true }, location.origin); // tells the CMS the preview is listening
}
async function refreshContent() {
  const [stores, site, topics, notices, facil, feats, facts, places] = await Promise.all(
    ['stores', 'site', 'topics', 'notices', 'facilities', 'features', 'facts', 'places'].map((n) =>
      json(`/content/${n}.json`),
    ),
  );
  if (JSON.stringify(places) !== JSON.stringify(PLACES)) {
    sessionStorage.setItem('eko-cam', JSON.stringify([camera.position.toArray(), controls.target.toArray()]));
    location.reload();
    return;
  }
  STORES.splice(0, STORES.length, ...(stores.items || []).filter((s) => s && s.name));
  for (const [o, n] of [
    [SITE, site],
    [TOPICS, topics],
    [NOTICES, notices],
    [FACIL, facil],
    [FEATS, feats],
    [SITE_FACTS, facts],
  ]) {
    for (const k of Object.keys(o)) delete o[k];
    Object.assign(o, n);
  }
  if (MODE.store)
    MODE.store =
      STORES.find((s) => s.name === MODE.store.name && s.floor === MODE.store.floor) ||
      STORES.find((s) => s.unit === MODE.store.unit) ||
      null;
  buildUI();
  if (MODE.store) {
    showPin(MODE.store);
    if (!$('#card').hidden) showStore(MODE.store);
  }
}
// the store being edited, straight from the CMS form (before it is even saved)
const logoUrl = new Map();
async function liveStore(d) {
  const s = MODE.store;
  if (!s) return;
  Object.assign(s, {
    name: d.name ?? s.name,
    floor: d.floor ?? s.floor,
    unit: d.unit ?? s.unit,
    category: d.category ?? s.category,
    featured: !!d.featured,
    desc: d.desc || undefined,
  });
  if (d.pin && Number.isFinite(d.pin.x) && Number.isFinite(d.pin.y))
    s.pin = { x: d.pin.x, y: d.pin.y, estimated: !!d.pin.estimated };
  const id = typeof d.logo === 'object' ? d.logo?.id : d.logo;
  if (id && !logoUrl.has(id))
    logoUrl.set(
      id,
      await fetch(`/api/media/${id}`)
        .then((r) => r.json())
        .then((m) => m.url)
        .catch(() => s.logo),
    );
  if (id) s.logo = logoUrl.get(id);
  else if (d.logo === null) s.logo = '';
  showPin(s);
  renderStores();
  if (!$('#card').hidden) showStore(s);
}
try {
  const c = JSON.parse(sessionStorage.getItem('eko-cam') || 'null');
  if (c && PREVIEW) {
    camera.position.fromArray(c[0]);
    controls.target.fromArray(c[1]);
    sessionStorage.removeItem('eko-cam');
  }
} catch {}
