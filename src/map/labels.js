import { bus } from './core/events.js';
import { placeLabels } from './core/placement.js';
import { isGenericName } from './core/text.js';
import { bInfo } from './buildings.js';
import { CONFIG } from './config.js';
import { MALL, MALL_H, OSM, V, ring } from './data.js';
import { $, MOBILE } from './env.js';
import { cumulative, inPoly, polyLen, sampleAt } from './geo.js';
import { FOOT, roadZ } from './ground.js';
import { pick, t } from './i18n.js';
import { mallC } from './mall.js';
import { RAIL_Z } from './rail.js';
import { camera, controls } from './stage.js';
import { MODE, S } from './state.js';

/* ---------- labels ---------- */
export const LABELS = [];
/**
 * a clickable HTML label pinned to a point in the scene
 * @param {string | Record<string, string> | (() => string)} text  words, translated ({ en, zh }) or worked out on each language change
 * @param {import('three').Vector3} pos
 * @param {{ kind?: string, pri?: number, color?: string, maxDist?: number, onClick?: () => void, group?: string, icon?: string, minor?: number }} [opts]
 *   minor: 1 for a label that is not the point of the page (shown quieter), 2 for one that is also far away
 */
export function label(
  text,
  pos,
  { kind = 'place', pri = 30, color, maxDist = 900, onClick, group = 'base', icon, minor = 0 } = {},
) {
  const el = document.createElement('div');
  el.className = `lbl lbl--${kind}${minor ? ` lbl--minor${minor > 1 ? ' lbl--far' : ''}` : ''}`;
  const span = document.createElement('span');
  span.textContent = textOf(text);
  if (icon) span.dataset.icon = icon;
  el.append(span);
  if (color) el.style.setProperty('--c', color);
  if (onClick)
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
  $('#labels').appendChild(el);
  const L = { el, pos, pri, maxDist, group, kind, on: true, text };
  LABELS.push(L);
  return L;
}
/** a label's words in the current language: a string, { en, zh, … } (English where a language has none) or a function */
const textOf = (/** @type {any} */ x) => (typeof x === 'function' ? x() : (pick(x) ?? ''));
/** the visitor switched language: every label with translated words is rewritten and measured again */
export function relabel() {
  for (const L of LABELS)
    if (L.text && typeof L.text !== 'string') {
      L.el.firstChild.textContent = textOf(L.text);
      L.w = null;
    }
}
bus.on('lang', relabel);
/** a place's name for a label: OSM's own Chinese name (name:zh), unless site.config.json → names says otherwise */
const named = (/** @type {{ name: string, zh?: string }} */ o, name = o.name) => {
  const fix = CONFIG.names?.[name];
  const zh = fix && 'zh' in fix ? fix.zh : o.zh;
  return zh ? { en: name, zh } : name;
};
label(CONFIG.main.label, V(mallC[0], mallC[1], MALL_H + 8), {
  kind: 'mall',
  pri: 1000,
  maxDist: 99999,
  onClick: () => bus.emit('mall:focus'),
});
const TAGS = {
  zh: {
    restaurant: '餐厅',
    cafe: '咖啡馆',
    fast_food: '快餐',
    bank: '银行',
    atm: '提款机',
    clinic: '诊所',
    hospital: '医院',
    dentist: '牙科',
    pharmacy: '药房',
    school: '学校',
    kindergarten: '幼儿园',
    fuel: '加油站',
    place_of_worship: '宗教场所',
    hotel: '酒店',
    supermarket: '超市',
    convenience: '便利店',
    police: '警察局',
    post_office: '邮局',
    bakery: '面包店',
    hairdresser: '理发店',
    car_repair: '汽车维修',
  },
  ms: {
    restaurant: 'Restoran',
    cafe: 'Kafe',
    fast_food: 'Makanan segera',
    bank: 'Bank',
    atm: 'ATM',
    clinic: 'Klinik',
    hospital: 'Hospital',
    dentist: 'Klinik gigi',
    pharmacy: 'Farmasi',
    school: 'Sekolah',
    kindergarten: 'Tadika',
    fuel: 'Stesen minyak',
    place_of_worship: 'Rumah ibadat',
    hotel: 'Hotel',
    supermarket: 'Pasar raya',
    convenience: 'Kedai serbaneka',
    police: 'Balai polis',
    post_office: 'Pejabat pos',
    bakery: 'Kedai roti',
    hairdresser: 'Kedai gunting',
    car_repair: 'Bengkel kereta',
  },
};
const tagName = (k) => (S.lang === 'en' ? k.replace(/_/g, ' ') : (TAGS[S.lang]?.[k] ?? t('place')));
const dist = (p) => Math.round(Math.hypot(p[0] - mallC[0], p[1] - mallC[1]));
{
  const seen = new Set();
  // a station is named after the lines that pass it: MRT, LRT, Monorail (OSM station names may carry a code, e.g. KJ10)
  const LINE = { subway: 'MRT', light_rail: 'LRT', monorail: 'Monorail', rail: 'KTM' };
  const LINE_ZH = { MRT: '捷运', LRT: '轻快铁', Monorail: '单轨', KTM: 'KTM' };
  const linesAt = (q) => {
    const l = [
      ...new Set(
        OSM.rails
          .filter((r) => LINE[r.t] && r.p.some((v) => Math.hypot(v[0] - q[0], v[1] - q[1]) < 140))
          .map((r) => LINE[r.t]),
      ),
    ];
    return (l.length ? l : ['MRT']).map((x) => (S.lang.startsWith('zh') ? LINE_ZH[x] : x)).join(' · ');
  };
  for (const p of OSM.pois.filter((p) => p.kind === 'station')) {
    const name = p.name.replace(/^[A-Z]{2}\d+[A-Z]?\s+/, '');
    if (seen.has(name)) continue;
    seen.add(name);
    const nm = named(p, name);
    label(() => `${linesAt(p.p)} ${textOf(nm)}`, V(p.p[0], p.p[1], RAIL_Z + 9), {
      kind: 'station',
      pri: 900,
      color: '#1565D8',
      maxDist: 3000,
      minor: dist(p.p) > 800 ? 1 : 0,
      onClick: () =>
        bus.emit('place', () => [textOf(nm), `${linesAt(p.p)} · ${t('station')}`, `${dist(p.p)} m ${t('away')}`]),
    });
  }
  // landmarks (site.config.json → landmarks): a name over the tallest building or part at a point, seen from far away
  for (const lm of CONFIG.landmarks ?? []) {
    const [x, y] = lm.at,
      under = OSM.buildings.filter((b) => inPoly(x, y, ring(b.p)));
    if (!under.length) continue;
    const top = Math.max(...under.map((b) => bInfo(b).h));
    under.forEach((b) => b.name && seen.add(b.name));
    label(lm.label, V(x, y, top + 6), {
      kind: 'landmark',
      pri: 950,
      color: '#3D4A5C',
      maxDist: 6000,
      onClick: () =>
        bus.emit('place', () => [textOf(lm.label), pick(lm.kind) ?? t('place'), `${dist([x, y])} m ${t('away')}`]),
    });
  }
  // other named buildings: only real names, only the tall or near ones, and quieter than the landmarks
  for (const b of OSM.buildings) {
    if (!b.name || b.part || b === MALL || seen.has(b.name) || isGenericName(b.name)) continue;
    const r = ring(b.p);
    const c = r.reduce((a, q) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0]),
      d = dist(c),
      h = b.h || 0;
    if (d > 1100 || h < 15 || (d > 500 && h < 120)) continue;
    seen.add(b.name);
    const nm = named(b);
    label(nm, V(c[0], c[1], bInfo(b).h + 4), {
      kind: 'building',
      pri: 300 + h - d / 10,
      color: '#7A8696',
      maxDist: 1400,
      minor: d > 450 ? 2 : 1,
      onClick: () => bus.emit('place', () => [textOf(nm), t('place'), `${d} m ${t('away')}`]),
    });
  }
  const byName = new Map();
  for (const r of OSM.roads)
    if (r.name && !FOOT.has(r.t) && !CONFIG.hideRoadLabels?.includes(r.name)) {
      const L = polyLen(r.p);
      const cur = byName.get(r.name);
      if (!cur || L > cur.L) byName.set(r.name, { r, L });
    }
  for (const [name, { r }] of byName) {
    const cum = cumulative(r.p);
    const q = sampleAt(r.p, cum, cum.at(-1) / 2);
    const pri = r.t.startsWith('trunk') ? 700 : r.t.startsWith('tertiary') ? 260 : 60;
    label(named(r, name), V(q.x, q.y, roadZ(r) + 2), {
      kind: 'road',
      pri,
      maxDist: pri > 500 ? 2600 : pri > 200 ? 1100 : 520,
      minor: 1,
    });
  }
  for (const s of OSM.stops)
    if (s.name && dist(s.p) < 700)
      label(named(s), V(s.p[0], s.p[1], 3), {
        kind: 'bus',
        pri: 200,
        color: '#F5A623',
        maxDist: 700,
        minor: 1,
        onClick: () => bus.emit('place', () => [textOf(named(s)), t('bus'), `${dist(s.p)} m ${t('away')}`]),
      });
  const KIND = {
    amenity: '#C25B9C',
    shop: '#E8531F',
    tourism: '#2E9E5B',
    leisure: '#2E9E5B',
    office: '#5A6372',
    healthcare: '#D64545',
  };
  // places nearby: only the useful kinds (hotels, malls, sights, hospitals, schools, banks…), quiet
  const USEFUL =
    /^(hotel|mall|museum|attraction|aquarium|gallery|hospital|clinic|school|university|bank|police|place_of_worship|park|theatre|arts_centre|embassy|supermarket)$/;
  for (const p of OSM.pois
    .filter((p) => p.kind !== 'station' && dist(p.p) < 600 && USEFUL.test(p.sub ?? '') && !isGenericName(p.name))
    .sort((a, b) => dist(a.p) - dist(b.p))
    .slice(0, 40)) {
    const pri = ['hospital', 'school', 'university', 'bank', 'fuel', 'police', 'place_of_worship', 'clinic'].includes(
      p.sub,
    )
      ? 150
      : 40;
    const nm = named(p);
    label(nm, V(p.p[0], p.p[1], 5), {
      kind: 'poi',
      pri,
      color: KIND[p.kind] || '#5A6372',
      maxDist: pri > 100 ? 800 : 420,
      minor: 2,
      onClick: () => bus.emit('place', () => [textOf(nm), tagName(p.sub || p.kind), `${dist(p.p)} m ${t('away')}`]),
    });
  }
}
let declutterAt = 0;
document.fonts?.ready.then(() =>
  LABELS.forEach((L) => {
    L.w = null;
  }),
); // re-measure once the web fonts are in
const MUST = new Set(['entrance', 'exit', 'assembly', 'store', 'mall', 'station']);
/**
 * the store pin's box on screen, so no label covers it. The pin is a sprite of fixed screen size (sizeAttenuation off):
 * its height in pixels is scale × the projection's vertical factor × half the screen height; it stands on its base.
 */
function pinBox(w, h) {
  if (!S.pin) return [];
  const p = S.pin.at.clone().project(camera);
  if (p.z > 1) return [];
  const m = camera.projectionMatrix.elements,
    pw = (S.pin.w * m[0] * w) / 2,
    ph = (S.pin.h * m[5] * h) / 2,
    x = (p.x * 0.5 + 0.5) * w,
    y = (-p.y * 0.5 + 0.5) * h;
  return [[x - pw / 2 - 4, y - ph - 4, x + pw / 2 + 4, y + 2]];
}
/**
 * boxes of the buttons floating over the map (compass, hide-panels button, store card, top bar items), so labels and
 * their × never sit under them: on a small phone a tap meant for a label would otherwise land on the button above it
 */
const CONTROLS = ['#compass', '#uiToggle', '#card', '.top .brand', '.top-tools', '#routeNote', '#music'];
function controlBoxes() {
  const out = [];
  for (const sel of CONTROLS) {
    const el = /** @type {HTMLElement | null} */ (document.querySelector(sel));
    if (!el || el.hidden || (S.uiOff && sel !== '#uiToggle')) continue; // hidden panels take no room
    const r = el.getBoundingClientRect();
    if (r.width && r.height) out.push([r.left - 6, r.top - 6, r.right + 6, r.bottom + 6]);
  }
  return out;
}
export function updateLabels(now) {
  const w = innerWidth,
    h = innerHeight,
    camD = camera.position.distanceTo(controls.target),
    focusGroups = MODE.keep,
    top = S.uiOff ? 12 : MOBILE ? 64 : 84,
    bottom = h - (S.uiOff ? 72 : S.dockH) - 8;
  const vis = [];
  for (const L of LABELS) {
    const allowed = L.on && (!focusGroups || focusGroups.has(L.group) || L.kind === 'mall');
    if (!allowed) {
      L.vis = false;
      continue;
    }
    const p = L.pos.clone().project(camera);
    L.sx = (p.x * 0.5 + 0.5) * w;
    L.sy = (-p.y * 0.5 + 0.5) * h;
    L.vis =
      p.z < 1 &&
      L.sx > 20 &&
      L.sx < w - 20 &&
      L.sy > top &&
      L.sy < bottom &&
      (MUST.has(L.kind) || camera.position.distanceTo(L.pos) < L.maxDist * (camD < 400 ? 1.2 : 1));
    if (L.vis) vis.push(L);
  }
  if (now - declutterAt > 150) {
    declutterAt = now;
    vis.sort(
      (a, b) =>
        +(b.kind === 'mall') - +(a.kind === 'mall') ||
        +!!b.target - +!!a.target ||
        +MUST.has(b.kind) - +MUST.has(a.kind) ||
        b.pri - a.pri,
    );
    for (const L of LABELS) {
      L.shown = false;
      L.dy = 0;
    }
    const spots = placeLabels(
      vis.map((L) => ({
        sx: L.sx,
        sy: L.sy,
        w: (L.w ??= L.el.getBoundingClientRect().width || 80),
        must: MUST.has(L.kind),
        // in route / exit / entrance views the mall label gives way when there is no room: those markers matter more
        key:
          (L.kind === 'mall' && !MODE.route && !MODE.safety && !MODE.entrances) ||
          L.kind === 'store' ||
          !!L.target ||
          L.group === 'safety' ||
          L.group === 'entrances',
      })),
      { width: w, top, max: MOBILE ? 22 : 60, blocked: [...(S.pinRect = pinBox(w, h)), ...controlBoxes()] },
    );
    vis.forEach((L, i) => Object.assign(L, { shown: spots[i].shown, dx: spots[i].dx, dy: spots[i].dy }));
  }
  for (const L of LABELS) {
    // a label the de-clutter drops stays a moment (0.4 s) before it goes, so labels do not blink as the view moves
    const want = L.vis && L.shown;
    if (want) L.lastOn = now;
    const on = want || (L.vis && L.was && now - (L.lastOn || 0) < 400);
    if (on !== L.was) {
      L.el.classList.toggle('is-hidden', !on);
      L.was = on;
    }
    if (on) {
      L.el.style.transform = `translate(${(L.sx + (L.dx || 0)).toFixed(1)}px, ${L.sy.toFixed(1)}px) translate(-50%, -100%)`;
      /* the anchor stays put; the stem grows to lift a stacked label */ const st = 14 - (L.dy || 0),
        sk = Math.round((Math.atan2(-(L.dx || 0), st) * 180) / Math.PI);
      const zi = Math.round(L.sy + (L.dy || 0));
      if (L.zi !== zi) {
        L.el.style.zIndex = zi;
        L.zi = zi;
      } /* lower labels on top, so stems from the row above pass behind them */
      if (L.st !== st || L.sk !== sk) {
        L.el.style.setProperty('--stem', st + 'px');
        L.el.style.setProperty('--skew', sk + 'deg');
        L.st = st;
        L.sk = sk;
      }
    }
  }
}
