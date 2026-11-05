import { CONFIG } from './config.js';
import { fill } from './core/fill.js';
import { bus } from './core/events.js';
import * as THREE from 'three';
import {
  greenLabel,
  openPop,
  popOpen,
  renderCats,
  renderNews,
  renderOpen,
  renderStores,
  renderVisit,
} from './content.js';
import { PICK, PLACES, STORES } from './data.js';
import { isNightAt, nowAt } from './core/hours.js';
import { $, $$, TEST } from './env.js';
import { ground } from './ground.js';
import { pick, t } from './i18n.js';
import { ROUTE_COL, ROUTE_ICON } from './routes.js';
import { mallMesh } from './mall.js';
import { asmMarks, entMarks, exitMarks } from './markers.js';
import { applyModes, focusMall } from './modes.js';
import { pinGroup, pinSprite, storeSpot } from './pin.js';
import { HOME, U, camera, controls, renderer } from './stage.js';
import { MODE, S } from './state.js';

/* ---------- UI ---------- */
export function buildUI() {
  document.documentElement.lang = { zh: 'zh-Hans', 'zh-TW': 'zh-Hant-TW' }[S.lang] ?? S.lang;
  $$('[data-t]').forEach((el) => {
    el.textContent = t(el.dataset.t);
  });
  $$('[data-lang]').forEach((b) => b.setAttribute('aria-current', b.dataset.lang === S.lang));
  const ICON = ROUTE_ICON;
  $('#routes').innerHTML = PLACES.routes
    .map(
      (r) =>
        `<button class="route-btn" type="button" data-route="${r.id}"><i style="background:${(ICON[r.id] || ICON.carN)[0]}">${(ICON[r.id] || ICON.carN)[1]}</i>${pick(r.label)}</button>`,
    )
    .join('');
  $$('.route-btn').forEach((b) =>
    b.addEventListener('click', () => {
      MODE.route = MODE.route === b.dataset.route ? null : b.dataset.route;
      MODE.safety = MODE.focus = false;
      if (MODE.route) {
        MODE.store = null;
        $('#card').hidden = true;
      }
      applyModes();
    }),
  );
  entMarks.forEach((x) => {
    x.l.el.firstChild.textContent = pick(x.e.name);
    x.l.w = null;
  });
  exitMarks.forEach((x) => {
    x.l.el.firstChild.textContent = pick(x.e.name);
    x.l.w = null;
  });
  asmMarks.forEach((x) => {
    x.l.el.firstChild.textContent = pick(x.a.name);
    x.l.w = null;
  });
  $('#storeQ').placeholder = fill(t('searchStores'), { n: STORES.length });
  renderCats();
  renderStores();
  renderNews();
  renderVisit();
  renderOpen();
  greenLabel.el.firstChild.textContent = t('greenRoof');
  greenLabel.w = null;
  if (!$('#card').hidden && lastCard) lastCard();
  if (popOpen) openPop(popOpen);
  applyModes();
}
$$('[data-mode]').forEach((b) =>
  b.addEventListener('click', () => {
    const k = b.dataset.mode;
    MODE[k] = !MODE[k];
    if (k === 'safety' && MODE.safety) {
      MODE.route = null;
      MODE.focus = false;
    }
    if (k === 'focus' && MODE.focus) {
      focusMall();
      return;
    }
    applyModes();
  }),
);
// one button per language in site.config.json → locales, in that order
const LANG_BUTTON = {
  en: 'EN',
  zh: '中文',
  'zh-TW': '繁中',
  ms: 'BM',
  ja: '日本語',
  ko: '한국어',
  th: 'ไทย',
  vi: 'VI',
  id: 'ID',
};
$('.langs').innerHTML = CONFIG.locales
  .map((/** @type {string} */ l) => `<button data-lang="${l}">${LANG_BUTTON[l] ?? l.toUpperCase()}</button>`)
  .join('');
$('#brand').setAttribute('aria-label', CONFIG.name);
$$('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => {
    S.lang = b.dataset.lang;
    try {
      localStorage.setItem('eko-lang', S.lang);
    } catch {}
    buildUI();
    bus.emit('lang');
  }),
);
/* ---------- day / night: follows the time in Kuala Lumpur (night 6pm–6am) until the visitor picks one ---------- */
/** @param {boolean} night @param {boolean} [now] switch instantly instead of fading */
function setNight(night, now = false) {
  S.nightTarget = night ? 1 : 0;
  if (now) U.uNight.value = S.nightTarget;
  document.body.classList.toggle('is-night', night);
  document.body.classList.toggle('is-day', !night);
  $('#daynight').setAttribute('aria-pressed', String(night));
}
let pickedByVisitor = false;
const followClock = (now = false) => !pickedByVisitor && setNight(TEST || isNightAt(nowAt(CONFIG.timezone)), now);
followClock(true);
setInterval(followClock, 60000);
$('#daynight').addEventListener('click', () => {
  pickedByVisitor = true;
  setNight(!S.nightTarget);
});
$('#reset').addEventListener('click', () => {
  Object.assign(MODE, { route: null, entrances: false, safety: false, focus: false, store: null });
  S.zoomTo = null;
  renderStores();
  $('#card').hidden = true;
  applyModes();
  S.fly = {
    t0: performance.now(),
    dur: 1400,
    fromP: camera.position.clone(),
    fromT: controls.target.clone(),
    toP: HOME.p.clone(),
    toT: HOME.t.clone(),
  };
});
// the card's height (0 while hidden) as --card-h, so the phone layout can stack the buttons above it
new ResizeObserver(() => {
  const c = $('#card');
  document.documentElement.style.setProperty('--card-h', c.hidden ? '0px' : `${c.offsetHeight + 10}px`);
}).observe($('#card'));
new MutationObserver(() =>
  document.documentElement.style.setProperty(
    '--card-h',
    $('#card').hidden ? '0px' : `${$('#card').offsetHeight + 10}px`,
  ),
).observe($('#card'), { attributes: true, attributeFilter: ['hidden'] });
// closing the card keeps the store's pin on the map (tap the pin to bring the card back; Reset view clears it)
$('.card-x').addEventListener('click', () => {
  $('#card').hidden = true;
  lastCard = null;
});

let lastCard = null;
function card(fn) {
  lastCard = fn;
  fn();
}
function showPlace(title, tag, text) {
  const c = $('#card');
  $('#cardTag').textContent = tag;
  $('#cardTitle').textContent = title;
  $('#cardText').textContent = text;
  $('#cardShare').textContent = t('share');
  $('#cardShare').hidden = !MODE.store;
  $('#cardLogo').removeAttribute('style');
  $('#cardGo').hidden = true;
  if ($('#cardGo2')) $('#cardGo2').hidden = true;
  zoomSrc = null;
  $('#cardLogo').classList.remove('can-zoom');
  c.hidden = false;
  c.style.animation = 'none';
  void c.offsetWidth;
  c.style.animation = '';
}
export function showStore(s) {
  lastCard = () => showStore(s);
  const f = t('floors')[s.floor] || s.floor;
  showPlace(
    s.name,
    `${f} · ${t('unit')} ${s.unit}`,
    (pick(s.desc) || t('storeText')(s.name, f, s.unit)) +
      (!storeSpot(s).exact ? ' ' + t('exactSoon') : storeSpot(s).est ? ' ' + t('estimated') : ''),
  );
  if (s.logo) $('#cardLogo').style.backgroundImage = `url("${s.logo}")`;
  zoomSrc = s.plan || null;
  $('#cardLogo').classList.toggle('can-zoom', !!zoomSrc);
  // a route to the store (from the MRT) only where the site wants one: a home in a tower has no door of its own
  if (CONFIG.storeRoute === false) return;
  const go = $('#cardGo');
  go.textContent = t('routeMrt');
  go.hidden = false;
  go.onclick = () => {
    MODE.route = 'mrt';
    applyModes();
  };
}
/** the main building's own card: its address, a line about it and its routes (site.config.json → main.routes) */
export function showMain() {
  lastCard = showMain;
  showPlace(CONFIG.main.label ?? CONFIG.name, t('mainTag'), t('mainText'));
  if (CONFIG.aboutImage?.src) $('#cardLogo').style.backgroundImage = `url("${CONFIG.aboutImage.src}")`;
  zoomSrc = CONFIG.aboutImage?.src ?? null;
  $('#cardLogo').classList.toggle('can-zoom', !!zoomSrc);
  const ids = /** @type {string[]} */ (CONFIG.main.routes ?? []);
  [$('#cardGo'), $('#cardGo2')].forEach((b, i) => {
    const r = PLACES.routes.find((x) => x.id === ids[i]);
    if (!b || !r) return;
    b.hidden = false;
    b.textContent = pick(r.label);
    b.style.setProperty('--rc', ROUTE_COL[r.id] ?? '');
    b.dataset.route = r.id;
    b.onclick = () => {
      MODE.route = r.id;
      applyModes();
    };
  });
}
// the picture on the card (a floor plan, the building) opens full screen; × or Escape closes it
let zoomSrc = null;
function openZoom() {
  if (!zoomSrc) return;
  const z = document.createElement('div');
  z.className = 'plan-zoom';
  z.setAttribute('role', 'dialog');
  z.setAttribute('aria-modal', 'true');
  z.innerHTML = `<img src="${zoomSrc}" alt="${$('#cardTitle').textContent}"><button type="button" aria-label="${t('close')}">×</button>`;
  const close = () => {
    z.remove();
    removeEventListener('keydown', esc);
  };
  const esc = (/** @type {KeyboardEvent} */ e) => e.key === 'Escape' && close();
  z.querySelector('button').addEventListener('click', close);
  z.addEventListener('click', (e) => e.target === z && close());
  addEventListener('keydown', esc);
  document.body.append(z);
  z.querySelector('button').focus();
}
$('#cardLogo').addEventListener('click', openZoom);

// click a store pin
const ray = new THREE.Raycaster(),
  ptr = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  downAt = [e.clientX, e.clientY];
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  if (PICK) {
    const hit = ray.intersectObjects([mallMesh, ground], false)[0];
    if (!hit) return;
    const x = +hit.point.x.toFixed(1),
      y = +(-hit.point.z).toFixed(1);
    bus.emit('map:pick', [x, y]);
    parent.postMessage({ type: 'eko-pick', x, y }, location.origin);
    return;
  }
  if (pinGroup.visible && MODE.store && ray.intersectObject(pinSprite)[0]) return showStore(MODE.store);
  if (ray.intersectObject(mallMesh)[0]) {
    focusMall();
    showMain();
  }
});

bus.on('place', (get) => card(() => showPlace(...get())));
bus.on('mall:focus', () => showMain());
bus.on('store:show', (s) => showStore(s));
