// Soft background music, generated in the browser (Web Audio): slow warm chord pads with a long reverb tail and a few
// quiet bell notes. Nothing to download and no licence to clear. It fades in on arrival; browsers only allow sound
// after the visitor's first touch, click or key, so where autoplay is blocked it starts at that first gesture.
// The round button (#music) turns it off and on; the choice is remembered on this device.
// Bundled on its own into public/map/music.js (scripts/build-map.mjs), outside the map's size budget.

const KEY = 'site-music';
const VOLUME = 0.16;
const btn = /** @type {HTMLButtonElement | null} */ (document.getElementById('music'));
const test = new URLSearchParams(location.search).has('test');
// the button lives in the top bar, beside day / night, so it lays out with the other controls on every screen
const tools = document.querySelector('.top-tools');
if (btn && tools) tools.insertBefore(btn, tools.querySelector('.langs'));

/** @type {AudioContext | null} */
let ctx = null;
/** @type {GainNode | null} */
let master = null;
let on = !test;
try {
  if (localStorage.getItem(KEY) === 'off') on = false;
} catch {}

// chords as MIDI notes: Dmaj9, Bm11, Gmaj9, Aadd9 (bright, unhurried, resolved)
const CHORDS = [
  [50, 57, 61, 64, 66],
  [47, 54, 57, 62, 64],
  [43, 50, 54, 57, 62],
  [45, 52, 57, 59, 64],
];
const BELLS = [74, 76, 78, 81, 83, 86]; // D major pentatonic, high
const hz = (/** @type {number} */ m) => 440 * 2 ** ((m - 69) / 12);

function reverb(/** @type {AudioContext} */ c) {
  const len = c.sampleRate * 4.5,
    buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

function start() {
  if (ctx) return;
  const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  const wet = ctx.createGain(),
    dry = ctx.createGain(),
    rv = reverb(ctx),
    tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2200;
  wet.gain.value = 0.55;
  dry.gain.value = 0.45;
  tone.connect(dry).connect(master);
  tone.connect(rv).connect(wet).connect(master);
  master.connect(ctx.destination);
  const bus = tone;

  const pad = (/** @type {number[]} */ notes, /** @type {number} */ t, /** @type {number} */ dur) => {
    if (!ctx) return;
    for (const n of notes)
      for (const det of [-5, 5]) {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          f = ctx.createBiquadFilter();
        o.type = n < 52 ? 'sine' : 'triangle';
        o.frequency.value = hz(n);
        o.detune.value = det;
        f.type = 'lowpass';
        f.frequency.value = 900;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05, t + 3);
        g.gain.setValueAtTime(0.05, t + dur - 2);
        g.gain.linearRampToValueAtTime(0, t + dur + 3);
        o.connect(f).connect(g).connect(bus);
        o.start(t);
        o.stop(t + dur + 3.2);
      }
  };
  const bell = (/** @type {number} */ n, /** @type {number} */ t) => {
    if (!ctx) return;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = hz(n);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 3.6);
  };
  // schedule a few seconds ahead, one chord every 8 s, a bell now and then
  let next = ctx.currentTime + 0.1,
    i = 0;
  const tick = () => {
    if (!ctx) return;
    while (next < ctx.currentTime + 10) {
      pad(CHORDS[i % CHORDS.length], next, 8);
      for (let k = 0; k < 3; k++)
        if (Math.random() < 0.55)
          bell(BELLS[Math.floor(Math.random() * BELLS.length)], next + 1 + k * 2.4 + Math.random());
      next += 8;
      i++;
    }
  };
  tick();
  setInterval(tick, 2000);
}

function fadeTo(/** @type {number} */ v, /** @type {number} */ secs) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(v, t + secs);
}

function render() {
  if (!btn) return;
  btn.classList.toggle('is-on', on);
  btn.setAttribute('aria-pressed', String(on));
  const zh = document.documentElement.lang.startsWith('zh');
  btn.setAttribute('aria-label', on ? (zh ? '关闭音乐' : 'Turn music off') : zh ? '播放音乐' : 'Play music');
}

/** sound on: create the music if needed, wake the audio (needs a gesture in most browsers) and fade in slowly */
function play(secs = 6) {
  start();
  ctx?.resume().then(() => fadeTo(VOLUME, secs));
}

btn?.addEventListener('click', (e) => {
  e.stopPropagation();
  on = !on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
  if (on) play(2.5);
  else fadeTo(0, 1.2);
  render();
});
// arrival: try straight away; if the browser holds the sound back, the first touch anywhere starts it
if (on) {
  play();
  const first = () => {
    if (on && (!ctx || ctx.state !== 'running')) play();
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => removeEventListener(t, first, true));
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((t) => addEventListener(t, first, true));
}
// quiet while the page is in the background
document.addEventListener('visibilitychange', () => {
  if (!ctx || !on) return;
  if (document.hidden) fadeTo(0, 0.5);
  else fadeTo(VOLUME, 2);
});
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
render();
