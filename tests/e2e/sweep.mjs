// Whole-site visual sweep: day and night × every route, entrances, safety, focus, a store search, all languages.
// Fails on any page error or console error, and saves a screenshot of each state.
//
//   node tests/e2e/sweep.mjs                         # the live site, desktop
//   node tests/e2e/sweep.mjs --phone                 # 390×844 touch phone
//   node tests/e2e/sweep.mjs --size=360x640          # any other screen (under 760 px wide counts as a phone)
//   BASE_URL=http://localhost:3000 node tests/e2e/sweep.mjs
//   node tests/e2e/sweep.mjs --local-map             # live content, this checkout's public/map/map.js + map.css
//   node tests/e2e/sweep.mjs --smoke                 # a few states only (CI: WebGL on the CPU draws about 1 frame/s)
//   CPU_WEBGL=1 node tests/e2e/sweep.mjs --smoke     # the same, drawn on the CPU like on CI
//
// Needs Google Chrome (set CHROME=/path/to/chrome if it is not in the usual place).
import fs from 'node:fs';
import path from 'node:path';

import puppeteer from 'puppeteer-core';
const args = process.argv.slice(2);
const phone = args.includes('--phone');
const smoke = args.includes('--smoke');
const LOAD_TIMEOUT = smoke ? 600000 : 120000;
const sizeArg = args.find((a) => /^--size=\d+x\d+$/.test(a));
// --size=WxH tries another screen; narrower than 760 px counts as a phone (touch, phone layout)
const [W, H] = sizeArg ? sizeArg.slice(7).split('x').map(Number) : phone ? [390, 844] : [1440, 900];
const touch = phone || W < 760;
const SITE_TEST = JSON.parse(fs.readFileSync('site.config.json', 'utf8')).test ?? {};
// the site to check: BASE_URL, else the live address in site.config.json → test.liveUrl
const BASE = (process.env.BASE_URL || SITE_TEST.liveUrl || 'http://localhost:3000').replace(/\/$/, '');
const CHROME =
  process.env.CHROME ||
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : '/usr/bin/google-chrome');
const OUT = process.env.OUT || path.join('tests', 'e2e', 'shots');
const LOCAL_MAP = args.includes('--local-map') ? path.resolve('public/map') : null;
const SAMPLE_STORE = SITE_TEST.sampleStore ?? null;
fs.mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({
  executablePath: CHROME,
  // macOS: the real GPU through Metal. Linux CI: software WebGL (SwiftShader), no sandbox inside the container.
  args:
    process.platform === 'darwin' && !process.env.CPU_WEBGL // CPU_WEBGL=1 reproduces the CI machines locally
      ? ['--use-angle=metal', '--ignore-gpu-blocklist']
      : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
  headless: 'new',
  protocolTimeout: 600000,
});
const errors = [];
try {
  const p = await b.newPage();
  await p.setViewport({ width: W, height: H, isMobile: touch, hasTouch: touch });
  if (LOCAL_MAP) {
    await p.setRequestInterception(true);
    const localBody = fs.readFileSync('src/site/index.html', 'utf8').match(/<body[\s\S]*<\/body>/)?.[0];
    p.on('request', async (r) => {
      // the page itself: live <head> (SEO tags from the CMS) with this checkout's <body>
      if (r.resourceType() === 'document' && localBody) {
        const live = await (await fetch(r.url())).text();
        return r.respond({
          status: 200,
          contentType: 'text/html',
          body: live.replace(/<body[\s\S]*<\/body>/, () => localBody),
        });
      }
      // everything under /map/ (script, styles, textures, OSM data) from this checkout when it has the file
      const m = new URL(r.url()).pathname.match(/^\/map\/(.+)$/);
      const file = m && path.join(LOCAL_MAP, decodeURIComponent(m[1]));
      if (!file || !fs.existsSync(file)) return r.continue();
      const type = {
        js: 'text/javascript',
        css: 'text/css',
        json: 'application/json',
        webp: 'image/webp',
        jpg: 'image/jpeg',
        png: 'image/png',
        hdr: 'application/octet-stream',
        map: 'application/json',
      };
      r.respond({
        status: 200,
        contentType: type[file.split('.').pop()] ?? 'application/octet-stream',
        body: fs.readFileSync(file),
      });
    });
  }
  p.on('pageerror', (e) => errors.push('page: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
  // any file the page asks for that fails (a missing image, font, texture or content file)
  p.on('response', (r) => r.status() >= 400 && errors.push(`load: ${r.status()} ${r.url().replace(BASE, '')}`));
  p.on(
    'requestfailed',
    (r) =>
      !/\/report$/.test(r.url()) &&
      errors.push(`load failed: ${r.url().replace(BASE, '')} (${r.failure()?.errorText})`),
  );
  // ?test freezes traffic, trains and pulses so screenshots are repeatable (tests/e2e/visual.mjs compares them)
  await p.goto(BASE + '/?test', { waitUntil: 'networkidle0', timeout: LOAD_TIMEOUT });
  await p.waitForSelector('#preload.is-done', { timeout: LOAD_TIMEOUT });

  // what this site has, read from the page and its content, so the sweep works for any site built on this engine:
  // its routes, its languages, and one store to search for and share (site.config.json → test.sampleStore, else the
  // first anchor store)
  const site = await p.evaluate(async (want) => {
    const d = await (await fetch('/content/stores.json')).json();
    const items = (d.items ?? []).filter((x) => x?.name);
    const s = items.find((x) => x.name === want) ?? items.find((x) => x.featured) ?? items[0];
    const part = (v) =>
      String(v ?? '')
        .toLowerCase()
        .normalize('NFKD');
    return {
      routes: [...document.querySelectorAll('.route-btn')].map((b) => b.dataset.route),
      langs: [...document.querySelectorAll('[data-lang]')].map((b) => b.dataset.lang),
      store: s && {
        name: s.name,
        query: part(s.name).split(/\s+/)[0].slice(0, 4),
        slug: `${part(s.name)
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}-${part(s.unit).replace(/[^a-z0-9]+/g, '')}`,
      },
    };
  }, SAMPLE_STORE);
  const tag = sizeArg ? `s${W}x${H}` : phone ? 'phone' : 'desktop';
  const shots = [];
  // wait until the camera has landed and a few more frames are drawn (?test exposes both), then let CSS fades finish.
  // Frame-based, so it works on a fast Mac and on a CI runner drawing WebGL on the CPU at under 1 fps alike.
  const settle = async (ms) => {
    await p.waitForFunction(() => !window.__mapIdle || window.__mapIdle(), { timeout: LOAD_TIMEOUT, polling: 100 });
    const f0 = await p.evaluate(() => window.__mapFrames?.() ?? 0);
    await p.waitForFunction(
      (f) => !window.__mapFrames || window.__mapFrames() >= f + 4,
      { timeout: LOAD_TIMEOUT, polling: 100 },
      f0,
    );
    await wait(ms);
  };
  const step = async (name, fn, ms = 1200) => {
    await fn();
    await wait(300);
    await settle(ms);
    await p.screenshot({ path: path.join(OUT, `${tag}_${name}.png`) });
    shots.push(name);
  };
  const fresh = async () => {
    await p.click('#reset');
    await wait(100);
    await settle(200);
  };
  for (const night of smoke ? [true] : [true, false]) {
    const n = night ? 'night' : 'day';
    if (!night) await p.click('#daynight');
    await step(n + '_home', () => p.click('#reset'));
    for (const r of smoke ? site.routes.slice(0, 1) : site.routes)
      await step(`${n}_${r}`, async () => {
        await fresh();
        await p.click(`.route-btn[data-route="${r}"]`);
      });
    for (const m of smoke ? ['entrances'] : ['entrances', 'safety', 'focus'])
      await step(`${n}_${m}`, async () => {
        await fresh();
        await p.click(`[data-mode="${m}"]`);
      });
    await step(n + '_store', async () => {
      await fresh();
      await p.click('[data-tab="stores"]');
      await wait(300);
      await p.$eval('#storeQ', (el) => (el.value = ''));
      await p.click('#storeQ');
      await p.type('#storeQ', site.store.query);
      await wait(400);
      const hits = await p.$$eval('#storeList .store', (x) => x.length);
      if (!hits) errors.push(`search: no stores found for "${site.store.query}"`);
      else await p.click('#storeList .store');
    });
    // closing the card keeps the store's pin and label on the map
    const hadCard = await p.$eval('#card', (c) => !c.hidden);
    await p.click('.card-x').catch(() => {});
    await wait(400);
    if (hadCard && !(await p.$('#labels .lbl--store:not(.is-hidden)')))
      errors.push(`closing the store card removed its pin (${n})`);
    // tapping the store's label brings the card back; the × on the label takes the pin off the map
    if (hadCard) {
      await p.click('#labels .lbl--store span');
      await wait(400);
      if (await p.$eval('#card', (c) => c.hidden))
        errors.push(`tapping the store label did not bring the card back (${n})`);
      await p.click('#labels .lbl--store .lbl-x');
      await settle(300);
      const left = await p.evaluate(() => ({
        pin: !!document.querySelector('#labels .lbl--store:not(.is-hidden)'),
        card: !document.querySelector('#card').hidden,
        hash: location.hash,
      }));
      if (left.pin || left.card || left.hash.includes('store'))
        errors.push(`the × on the store label did not clear the store (${n}: ${JSON.stringify(left)})`);
    }
    await p.click('[data-tab="go"]');
    await step(n + '_hidden', async () => {
      await fresh();
      await p.click('#uiToggle');
    });
    const hidden = await p.evaluate(() => ({
      dock: getComputedStyle(document.querySelector('#panel')).visibility,
      labels: document.querySelectorAll('#labels .lbl:not(.is-hidden)').length,
    }));
    if (hidden.dock !== 'hidden') errors.push(`hide panels: the panel is still visible (${n})`);
    if (!hidden.labels) errors.push(`hide panels: no map labels left on screen (${n})`);
    const hit = await p.evaluate(() => {
      const t = document.querySelector('#uiToggle').getBoundingClientRect();
      const el = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
      return el?.closest('#uiToggle')
        ? null
        : (el?.textContent || el?.className || el?.tagName || '').toString().slice(0, 60);
    });
    if (hit) errors.push(`hide panels: the button to bring them back is covered by "${hit}" (${n})`);
    await p.click('#uiToggle');
    await wait(400);
    if (await p.evaluate(() => document.documentElement.classList.contains('ui-off')))
      errors.push(`hide panels: pressing the button again did not bring the panels back (${n})`);
  }
  // contact form: the message box grows downward only, and letting go of its resize handle outside the popup
  // must not close the form (the browser reports that as a click on the backdrop)
  if (touch) {
    // phones: the form opens, its last field and the send button can be reached, and × closes it
    await p.evaluate(() => document.querySelector('[data-pop="contact"]')?.click());
    const ta = await p.waitForSelector('textarea[name=message]', { timeout: 10000 });
    await ta.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await ta.tap();
    await ta.type('Hello');
    const send = await p.$('#modalBody button[type=submit], #modalBody .card-go');
    await send?.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    const reach = await p.evaluate(() => {
      const t = document.querySelector('textarea[name=message]').getBoundingClientRect();
      const s = document.querySelector('#modalBody button[type=submit], #modalBody .card-go')?.getBoundingClientRect();
      return { text: t.top >= 0 && t.bottom <= innerHeight, send: !!s && s.top >= 0 && s.bottom <= innerHeight };
    });
    if (!reach.text || !reach.send)
      errors.push(`contact form on a phone: cannot reach ${!reach.text ? 'the message box' : 'the send button'}`);
    await p.click('.modal-x');
    await wait(400);
    if (!(await p.$eval('#modal', (m) => m.hidden))) errors.push('contact form on a phone: × does not close it');
  } else {
    await p.evaluate(() => document.querySelector('[data-pop="contact"]')?.click());
    const ta = await p.waitForSelector('textarea[name=message]', { timeout: 10000 });
    // let the popup's opening zoom finish before taking mouse positions (slow on CPU-drawn CI machines)
    await p.waitForFunction(
      () =>
        (document.querySelector('#modal .modal-box')?.getAnimations({ subtree: true }) ?? []).every(
          (x) => x.playState !== 'running',
        ),
      {
        timeout: LOAD_TIMEOUT,
      },
    );
    const size = () => ta.evaluate((e) => [e.offsetWidth, e.offsetHeight]); // layout size, unaffected by transforms
    const [w0, h0] = await size();
    await ta.type('Hello');
    const a = await ta.boundingBox();
    await p.mouse.move(a.x + a.width - 3, a.y + a.height - 3);
    await p.mouse.down();
    await p.mouse.move(a.x + a.width + 300, a.y + a.height + 600, { steps: 10 });
    await p.mouse.up();
    const open = !(await p.$eval('#modal', (m) => m.hidden));
    if (!open) errors.push('contact form: closed after resizing the message box');
    else {
      const [w1, h1] = await size();
      // (it may get a little narrower when the taller form brings up the popup's scrollbar)
      if (w1 > w0) errors.push(`contact form: the message box can be widened (${w0} → ${w1})`);
      if (h1 <= h0) errors.push('contact form: the message box does not grow downward');
      if ((await ta.evaluate((e) => e.value)) !== 'Hello') errors.push('contact form: typed text lost');
    }
    await p.mouse.click(8, 8); // a real click on the backdrop still closes it
    await wait(400);
    if (!(await p.$eval('#modal', (m) => m.hidden)))
      errors.push('contact form: a click on the backdrop does not close it');
  }
  // the view stays above the ground and inside the city however hard it is dragged
  if (!smoke) {
    await fresh();
    const mid = [W / 2, H * 0.4];
    const drag = async (dx, dy, button = 'left') => {
      await p.mouse.move(mid[0], mid[1]);
      await p.mouse.down({ button });
      await p.mouse.move(mid[0] + dx, mid[1] + dy, { steps: 12 });
      await p.mouse.up({ button });
      await wait(300);
    };
    for (let i = 0; i < 4; i++) await drag(0, -H * 0.4); // tilt down towards the street
    for (let i = 0; i < 6; i++) await drag(0, -H * 0.4, 'right'); // pan the ground away
    for (let i = 0; i < 6; i++) await drag(W * 0.4, 0, 'right');
    await settle(800);
    const v = await p.evaluate(() => window.__view?.());
    if (v && (v.tilt > 82.5 || v.targetY < -0.01 || v.camY < 2 || v.far > 1101))
      errors.push(`camera left its bounds: ${JSON.stringify(v)}`);
    else console.log('camera bounds held:', JSON.stringify(v));
  }
  // store pins stay visible: pick a run of stores and check no label covers the pin (most of them stand on the mall,
  // right where the orange EkoCheras Mall label is)
  if (!smoke) {
    await fresh();
    await p.click('[data-tab="stores"]');
    const ids = await p.evaluate(() =>
      [...document.querySelectorAll('#cats [data-cat]')].map((b) => b.getAttribute('data-cat')).slice(0, 4),
    );
    let checked = 0;
    for (const cat of ids) {
      await p.click(`#cats [data-cat="${cat}"]`);
      await wait(200);
      const n = Math.min(4, await p.$$eval('#storeList .store', (x) => x.length));
      for (let i = 0; i < n; i++) {
        await p.evaluate((k) => document.querySelectorAll('#storeList .store')[k].click(), i);
        await settle(500);
        const hit = await p.evaluate(() => {
          const [r] = window.__pinRect?.() ?? [];
          if (!r) return null;
          const over = [...document.querySelectorAll('#labels .lbl:not(.is-hidden)')]
            .filter((l) => !l.classList.contains('lbl--store'))
            .map((l) => [l.textContent, l.querySelector('span').getBoundingClientRect()])
            .filter(([, b]) => b.left < r[2] - 4 && b.right > r[0] + 4 && b.top < r[3] - 4 && b.bottom > r[1] + 4);
          return over.map(([t]) => t.trim());
        });
        checked++;
        const store = await p.$eval('#cardTitle', (e) => e.textContent);
        if (hit?.length) errors.push(`pin of ${store} covered by: ${hit.join(', ')}`);
      }
    }
    await p.click('.card-x').catch(() => {});
    console.log(`${checked} store pins checked for labels on top`);
  }
  for (const l of [...site.langs.slice(1), site.langs[0]]) {
    await p.click(`[data-lang="${l}"]`);
    await wait(500);
  }
  if (!phone && !smoke) {
    // H hides and shows the panels
    await p.keyboard.press('h');
    await wait(300);
    if (!(await p.evaluate(() => document.documentElement.classList.contains('ui-off'))))
      errors.push('H key: panels not hidden');
    await p.keyboard.press('h');
    await wait(300);
    // share links open the right thing; a broken one is ignored without an error
    const links = [
      [
        `#store=${site.store.slug}`,
        (name) =>
          document.querySelector('#cardTitle')?.textContent?.includes(name) && !document.querySelector('#card').hidden,
        site.store.name,
      ],
      [
        `#route=${site.routes.at(-1)}`,
        (r) => document.querySelector(`.route-btn[data-route="${r}"]`)?.classList.contains('is-on'),
        site.routes.at(-1),
      ],
      ['#safety', () => document.querySelector('[data-mode="safety"]')?.classList.contains('is-on')],
      ['#about', () => !document.querySelector('#modal').hidden && !!document.querySelector('#modalBody .modal-img')],
      ['#contact', () => !document.querySelector('#modal').hidden && !!document.querySelector('#modalBody textarea')],
      ['#store=no-such-store-x1', () => true],
    ];
    for (const [hash, ok, arg] of links) {
      await p.goto('about:blank'); // a fresh load, like opening a shared link (a hash change alone keeps the page)
      await p.goto(`${BASE}/?test${hash}`, { waitUntil: 'networkidle0', timeout: LOAD_TIMEOUT });
      await p.waitForSelector('#preload.is-done', { timeout: LOAD_TIMEOUT });
      await settle(600);
      if (!(await p.evaluate(ok, arg))) errors.push(`share link ${hash}: did not open`);
    }
    // a link pasted into the open tab works too
    await p.evaluate(() => (location.hash = '#about'));
    await settle(600);
    if (await p.$eval('#modal', (m) => m.hidden)) errors.push('share link pasted into an open tab: did not open');
    await p.keyboard.press('Escape');
    // the chosen language survives a reload
    const other = site.langs[1];
    if (other) {
      await p.click(`[data-lang="${other}"]`);
      await p.reload({ waitUntil: 'networkidle0' });
      await p.waitForSelector('#preload.is-done', { timeout: LOAD_TIMEOUT });
      if (
        (await p.evaluate(() => document.documentElement.lang)) !==
        ({ zh: 'zh-Hans', 'zh-TW': 'zh-Hant-TW' }[other] ?? other)
      )
        errors.push('language: not kept after reload');
      await p.click(`[data-lang="${site.langs[0]}"]`);
    }
  }
  console.log(`${shots.length} states checked (${W}×${H}), screenshots in ${OUT}`);
} catch (e) {
  // a step that could not run still reports everything found before it
  errors.push(`stopped: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('no errors');
