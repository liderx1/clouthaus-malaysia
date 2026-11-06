import { CONFIG } from './config.js';
import { fill } from './core/fill.js';
import { esc, floorName, storeSlug } from './core/text.js';
import { formatTime, isOpen, nowAt, parseHours } from './core/hours.js';
import { FACIL, FEATS, MALL_H, NOTICES, PLACES, SITE, SITE_FACTS, STORES, TOPICS, V, items, tr } from './data.js';
import { $, $$, MOBILE, TEST } from './env.js';
import { initials } from './geo.js';
import { t } from './i18n.js';
import { label } from './labels.js';
import { mallC } from './mall.js';
import { applyModes, flyTo } from './modes.js';
import { showPin } from './pin.js';
import { camera, controls } from './stage.js';
import { MODE, S } from './state.js';
import { bus } from './core/events.js';

/* ---------- the site's content, inside the map ---------- */
const fmtDate = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString(
        { en: 'en-GB', zh: 'zh-CN', 'zh-TW': 'zh-TW', ms: 'ms-MY' }[S.lang] ?? S.lang,
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
      )
    : '';
const CAT_ORDER = [
  'anchor',
  ...(CONFIG.categories?.map((/** @type {{ value: string }} */ c) => c.value) ?? [
    'food',
    'fashion',
    'beauty',
    'tech',
    'home',
    'fun',
    'grocery',
    'services',
  ]),
];
export function renderCats() {
  const inCat = (s, c) => (c === 'anchor' ? s.featured : s.category === c),
    name = (c) => (c === 'anchor' ? '★ ' + t('anchors') : t('storeCats')[c]);
  $('#cats').innerHTML = CAT_ORDER.filter((c) => STORES.some((s) => inCat(s, c)))
    .map(
      (c) =>
        `<button class="chip${c === 'anchor' ? ' chip--star' : ''}${MODE.cat === c ? ' is-on' : ''}" type="button" data-cat="${c}">${esc(name(c))} <b>${STORES.filter((s) => inCat(s, c)).length}</b></button>`,
    )
    .join('');
}
export function renderStores() {
  const q = $('#storeQ').value.trim().toLowerCase();
  const list =
    !q && !MODE.cat
      ? []
      : STORES.filter(
          (s) =>
            (!MODE.cat || q || (MODE.cat === 'anchor' ? s.featured : s.category === MODE.cat)) &&
            (!q ||
              s.name.toLowerCase().startsWith(q) ||
              s.name
                .toLowerCase()
                .split(/\s+/)
                .some((w) => w.startsWith(q))),
        );
  $('#storeList').innerHTML = list.length
    ? list
        .map(
          (s) =>
            `<button class="store${MODE.store === s ? ' is-on' : ''}" type="button" data-store="${STORES.indexOf(s)}">${s.logo ? `<img src="${esc(s.logo)}" alt="" loading="lazy">` : `<i>${esc(initials(s.name))}</i>`}<b>${esc(s.name)}</b><small>${esc(floorName(s.floor, FLOOR_SHORT))} · ${esc(s.unit)}</small></button>`,
        )
        .join('')
    : `<span class="hint">${esc(q ? t('noResults') : t('pickCat'))}</span>`;
}
$('#cats').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  MODE.cat = b.dataset.cat;
  $('#storeQ').value = '';
  renderCats();
  renderStores();
  $('#storeList').scrollLeft = 0;
});
$('#storeList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-store]');
  if (!b) return;
  const s = STORES[+b.dataset.store];
  // tapping the store that is already picked takes it off the map again
  if (MODE.store === s) clearStore();
  else goToStore(s);
});
/** take the picked store off the map: pin, label, card and highlight; the camera stays where it is */
export function clearStore() {
  if (!MODE.store) return;
  MODE.store = null;
  $('#card').hidden = true;
  applyModes();
  renderStores();
}
bus.on('store:clear', clearStore);
bus.on('store:card', () => MODE.store && bus.emit('store:show', MODE.store));
$('#storeQ').addEventListener('input', () => {
  renderStores();
});
function goToStore(s) {
  // a home type opens on the 3D floor plate (site.config.json → plate.categories) instead of a pin
  if (CONFIG.plate?.categories?.includes(s.category)) {
    $$('.store').forEach((b) => b.classList.toggle('is-on', STORES[+b.dataset.store] === s));
    bus.emit('plate:open', s.name);
    return;
  }
  Object.assign(MODE, { route: null, safety: false, focus: false, entrances: false, store: s });
  applyModes();
  const p = showPin(s);
  $$('.store').forEach((b) => b.classList.toggle('is-on', STORES[+b.dataset.store] === s));
  // phones: glide to centre the pin at the current zoom; computers: move in closer
  flyTo(null, [p.x, p.y], MOBILE ? camera.position.distanceTo(controls.target) : 280, p.z); // at the pin's floor (a tower is tall)
  bus.emit('store:show', s);
}
export function renderNews() {
  const notes = items(NOTICES),
    feats = items(FEATS).map((it) => ({ ...it, category: 'feature', line: it.subtitle })),
    tops = items(TOPICS).map((it) => ({
      ...it,
      line: it.note || [fmtDate(it.start), fmtDate(it.end)].filter(Boolean).join(' – '),
    }));
  $('#news').innerHTML =
    notes
      .map(
        (n) =>
          `<div class="info info--note"><em>${t('notices')} · ${fmtDate(n.date)}</em><small>${esc(n.text)}</small></div>`,
      )
      .join('') +
    [...tops, ...feats]
      .map(
        (it) =>
          `<${it.link ? `button type="button" data-link="${esc(it.link)}"` : 'div'} class="info info--img">${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy">` : '<span></span>'}<div><em>${esc(t('cats')[it.category] || '')}</em><b>${esc(it.title)}</b><small>${esc(it.line || it.desc || '')}</small></div></${it.link ? 'button' : 'div'}>`,
      )
      .join('');
  const first = notes[0];
  $('#notice').hidden = !first;
  if (first) $('#notice').textContent = first.text;
}
export function renderVisit() {
  const ig = tr(SITE, 'instagram') || {},
    fb = tr(SITE, 'facebook') || {},
    box = (h, body) => `<div class="info"><em>${h}</em>${body}</div>`;
  const facts = items(SITE_FACTS)
    .map(
      (x) =>
        `<div class="info info--fact"><em>${esc(t('why'))}</em><b>${esc(x.title)}</b><small>${esc(x.text)}</small></div>`,
    )
    .join('');
  $('#visit').innerHTML =
    facts +
    box(t('hours'), `<b>${esc(tr(SITE, 'hours'))}</b>`) +
    box(
      t('address'),
      `<p>${esc(tr(SITE, 'address'))}</p><a href="${esc(tr(SITE, 'map_url'))}" target="_blank" rel="noopener">${t('openMaps')} →</a>`,
    ) +
    box(t('byMrt'), `<p>${esc(tr(SITE, 'mrt'))}</p>`) +
    box(t('byCar'), `<p>${esc(tr(SITE, 'car'))}</p>`) +
    box(t('contact'), `<a href="mailto:${esc(tr(SITE, 'email'))}">${esc(tr(SITE, 'email'))}</a>`) +
    box(
      t('follow'),
      `<a href="${esc(ig.url)}" target="_blank" rel="noopener">Instagram ${esc(ig.handle)}</a><br><a href="${esc(fb.url)}" target="_blank" rel="noopener">Facebook ${esc(fb.handle)}</a>`,
    ) +
    items(FACIL)
      .map((x) => box(t('facilities'), `<b>${esc(x.name)}</b><small>${esc(x.where)}</small>`))
      .join('') +
    `<button class="info info--link info--hot" type="button" data-pop="contact">${t('contactUs')}</button><button class="info info--link" type="button" data-pop="about">${t('about')}</button>`;
}
// About and the contact form open as popups over the map
// the About popup's copy and its four figures are the site's own (site.config.json → text.<lang>.about, aboutFacts)
/** short floor names for the store list (site.config.json → floors) */
const FLOOR_SHORT = Object.fromEntries(CONFIG.floors.map((/** @type {any} */ f) => [f.code, f.short ?? f.code]));
const about = () =>
  (CONFIG.text?.[S.lang] ?? CONFIG.text?.en)?.about ?? { title: CONFIG.name, paragraphs: [], factLabels: [] };
const FORM = {
  en: {
    title: 'Get in touch',
    lead: 'Leasing, general enquiries or feedback: one form, and the right team replies.',
    topic: 'Topic',
    topics: [
      'Leasing & retail space',
      'General enquiry',
      'Feedback on your visit',
      'Advertising & event venue',
      'Lost & found',
      'Careers',
    ],
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company / brand',
    message: 'Message',
    agree: 'I agree to {name} using my details to respond to this message.',
    send: 'Send',
    thanks: 'Thank you. We have your message and will reply within 2 working days.',
  },
  zh: {
    title: '联系我们',
    lead: '招商、一般咨询或意见反馈，同一份表格，由对应团队回复。',
    topic: '主题',
    topics: ['招商与零售空间', '一般咨询', '到访意见', '广告与活动场地', '失物招领', '工作机会'],
    name: '姓名',
    email: '电邮',
    phone: '电话',
    company: '公司 / 品牌',
    message: '内容',
    agree: '我同意 {name} 使用我的资料回复此讯息。',
    send: '发送',
    thanks: '谢谢！我们已收到您的讯息，将于 2 个工作日内回复。',
  },
  ms: {
    title: 'Hubungi kami',
    lead: 'Sewaan, pertanyaan umum atau maklum balas: satu borang, pasukan yang betul akan membalas.',
    topic: 'Topik',
    topics: [
      'Sewaan & ruang runcit',
      'Pertanyaan umum',
      'Maklum balas lawatan',
      'Pengiklanan & ruang acara',
      'Barang hilang & dijumpai',
      'Kerjaya',
    ],
    name: 'Nama',
    email: 'E-mel',
    phone: 'Telefon',
    company: 'Syarikat / jenama',
    message: 'Mesej',
    agree: 'Saya bersetuju {name} menggunakan butiran saya untuk membalas mesej ini.',
    send: 'Hantar',
    thanks: 'Terima kasih. Mesej anda telah diterima dan kami akan membalas dalam 2 hari bekerja.',
  },
};
export let popOpen = null;
export function openPop(kind, opts = {}) {
  popOpen = kind;
  const b = $('#modalBody');
  if (kind === 'about') {
    const { title: h, paragraphs: ps, factLabels: fl } = about();
    b.innerHTML = `<img class="modal-img" src="${esc(CONFIG.aboutImage?.src ?? '/images/about-car-display.webp')}" alt="${esc(CONFIG.aboutImage?.alt ?? '')}" width="1920" height="800"><span class="card-tag">${esc(t('about'))}</span><h2>${esc(h)}</h2>${ps.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="modal-facts">${(CONFIG.aboutFacts ?? []).map((/** @type {string} */ v, /** @type {number} */ i) => `<div><b>${v}</b><span>${esc(fl[i])}</span></div>`).join('')}</div>
      <button class="card-go" type="button" data-pop="contact">${esc(t('contactUs'))}</button><p class="credits">${esc(t('credits'))}</p>`;
  } else {
    const F = FORM[S.lang] || FORM.en,
      topic = opts.topic ?? 0;
    b.innerHTML = `<span class="card-tag">${esc(t('contactUs'))}</span><h2>${esc(F.title)}</h2><p>${esc(F.lead)}</p>
      <form class="pform" novalidate>
        <label class="full">${esc(F.topic)}<select name="topic">${F.topics.map((x, i) => `<option value="${i}"${i === topic ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
        <label>${esc(F.name)} *<input name="name" required autocomplete="name"></label><label>${esc(F.email)} *<input name="email" type="email" required autocomplete="email"></label>
        <label>${esc(F.phone)}<input name="phone" type="tel" autocomplete="tel"></label><label class="lease">${esc(F.company)}<input name="company" autocomplete="organization"></label>
        <label class="full">${esc(F.message)} *<textarea name="message" rows="4" required></textarea></label>
        <label class="full check"><input type="checkbox" required> ${esc(fill((CONFIG.text?.[S.lang] ?? CONFIG.text?.en)?.agree ?? F.agree, { name: CONFIG.name }))}</label>
        <button class="card-go full" type="submit">${esc(F.send)}</button></form>`;
    const form = b.querySelector('form'),
      sync = () => {
        form.querySelector('.lease').hidden = form.topic.value !== '0';
      };
    form.topic.addEventListener('change', sync);
    sync();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      b.innerHTML = `<div class="sent"><i>✓</i><h2>${esc(F.title)}</h2><p>${esc(F.thanks)}</p></div>`;
    });
  }
  const m = $('#modal');
  m.hidden = false;
  m.classList.remove('is-in');
  void m.offsetWidth;
  m.classList.add('is-in');
  history.replaceState(null, '', '#' + kind);
}
function closePop() {
  $('#modal').hidden = true;
  popOpen = null;
  syncHash();
}
// close on a click on the backdrop, but only when the press also started there: dragging the message box's resize
// handle (or selecting text) and letting go outside the popup must not close the form and lose what was typed
let pressedBackdrop = false;
$('#modal').addEventListener('pointerdown', (e) => {
  pressedBackdrop = e.target.id === 'modal';
});
$('#modal').addEventListener('click', (e) => {
  if ((e.target.id === 'modal' && pressedBackdrop) || e.target.closest('.modal-x')) closePop();
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popOpen) closePop();
  else if (e.key === 'Escape') clearStore();
});
document.addEventListener('click', (e) => {
  if (!(e.target instanceof HTMLElement)) return;
  const p = /** @type {HTMLElement | null} */ (e.target.closest('[data-pop]'));
  if (p) {
    e.preventDefault();
    openPop(p.dataset.pop);
    return;
  }
  const l = /** @type {HTMLElement | null} */ (e.target.closest('[data-link]'));
  if (l) {
    const u = l.dataset.link;
    if (/^https?:/.test(u)) open(u, '_blank', 'noopener');
    else {
      history.replaceState(null, '', u.replace(/^\//, ''));
      readHash();
    }
  }
});

$$('[data-tab]').forEach((b) =>
  b.addEventListener('click', () => {
    const dock = $('#panel');
    if (b.classList.contains('is-on')) {
      dock.classList.toggle('is-min');
      return syncDock();
    }
    dock.classList.remove('is-min');
    $$('[data-tab]').forEach((x) => x.classList.toggle('is-on', x === b));
    $$('[data-pane]').forEach((p) => {
      p.hidden = p.dataset.pane !== b.dataset.tab;
    });
    syncDock();
  }),
);
// keep the card, route note and labels clear of the dock
function syncDock() {
  S.dockH = $('#panel').getBoundingClientRect().height + 16;
  document.documentElement.style.setProperty('--dock-h', `${S.dockH}px`);
}
new ResizeObserver(syncDock).observe($('#panel'));
fetch(CONFIG.logo)
  .then((r) => r.text())
  .then((svg) => {
    $('#brand').innerHTML = svg.replace(/#FFFFFF/gi, 'currentColor').replace(/class="lp-[a-z]+"/g, '');
  })
  .catch(() => {});

// open now, in Kuala Lumpur time, read from the hours text ("10:00am – 10:00pm")
export function renderOpen() {
  const el = $('#open'),
    hours = parseHours(SITE?.en?.hours);
  el.hidden = !hours;
  if (!hours) return;
  const open = isOpen(hours, TEST ? 12 * 60 : nowAt(CONFIG.timezone));
  el.classList.toggle('is-open', open);
  el.textContent = open
    ? `${t('openNow')} · ${t('until')} ${formatTime(hours.close)}`
    : `${t('closedNow')} · ${t('opens')} ${formatTime(hours.open)}`;
}
setInterval(renderOpen, 60000);
// shareable links: #store=<slug>, #route=<id>, #safety
bus.on('modes:change', () => syncHash());
export function syncHash() {
  if (popOpen) return;
  const h = MODE.store
    ? `#store=${storeSlug(MODE.store)}`
    : MODE.route
      ? `#route=${MODE.route}`
      : MODE.safety
        ? '#safety'
        : '';
  if (location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search);
}
export function readHash(raw = location.hash) {
  const h = decodeURIComponent(raw.slice(1));
  if (!h) return;
  if (h === 'about' || h === 'contact') return openPop(h);
  if (['stores', 'news', 'visit', 'go'].includes(h)) {
    $(`[data-tab="${h}"]`).click();
    return;
  }
  const [k, v] = h.split('=');
  if (k === 'store') {
    const s = STORES.find((x) => storeSlug(x) === v);
    if (s) {
      $('[data-tab="stores"]').click();
      MODE.cat = s.featured ? 'anchor' : s.category;
      renderCats();
      renderStores();
      goToStore(s);
    }
  } else if (k === 'route' && PLACES.routes.some((r) => r.id === v)) {
    MODE.route = v;
    applyModes();
  } else if (k === 'safety') {
    MODE.safety = true;
    applyModes();
  }
}
$('#cardShare').addEventListener('click', async () => {
  const url = location.href,
    title = $('#cardTitle').textContent;
  try {
    if (navigator.share && MOBILE) await navigator.share({ title, url });
    else {
      await navigator.clipboard.writeText(url);
      toast(t('copied'));
    }
  } catch {}
});
let toastTimer = 0;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 1800);
}
// a roof-garden label on the main building, for sites that have one (site.config.json → main.roofLabel)
export const greenLabel = label('Green roof', V(mallC[0] - 20, mallC[1] + 60, MALL_H + 2), {
  kind: 'green',
  pri: 500,
  maxDist: 900,
  color: '#15803D',
});
greenLabel.on = !!CONFIG.main.roofLabel;
