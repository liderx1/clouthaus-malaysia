// Soft background music, generated in the browser (Web Audio): slow warm chord pads with a long reverb tail and a few
// bell notes. Nothing to download and no licence to clear.
// Browsers only allow sound after the visitor touches the page, so on arrival a small "Turn on the music" note sits
// beside the round button (#music). The first touch anywhere, or the button, starts the music with a slow fade; once
// the music has played, the note never comes back on this visit (a reload shows it again). The button turns it off
// and on; "off" is remembered on this device.
// The sound goes out through an <audio> element, so phones play it even with the ring / silent switch on silent
// (Web Audio alone follows that switch on iPhone). Bundled on its own into public/map/music.js (scripts/build-map.mjs).

const KEY = 'site-music';
const VOLUME = 0.22;
const btn = /** @type {HTMLButtonElement | null} */ (document.getElementById('music'));
const test = new URLSearchParams(location.search).has('test');
// the button lives in the top bar, beside day / night, so it lays out with the other controls on every screen
const tools = document.querySelector('.top-tools');
if (btn && tools) tools.insertBefore(btn, tools.querySelector('.langs'));
const hint = document.createElement('span');
hint.className = 'music-hint';
hint.setAttribute('aria-hidden', 'true');
if (btn) btn.append(hint);

/** @type {AudioContext | null} */
let ctx = null;
/** @type {GainNode | null} */
let master = null;
/** @type {HTMLAudioElement | null} */
let out = null;
/** @type {AudioNode | null} */
let last = null;
let on = false; // sound is playing (or fading in)
let heard = false; // the music has played at least once on this visit: the note is not shown again
let wanted = !test;
try {
  if (localStorage.getItem(KEY) === 'off') wanted = false;
} catch {}

// chords as MIDI notes, voiced in the middle register so phone speakers carry them: Dmaj9, Bm11, Gmaj9, Aadd9
const CHORDS = [
  [62, 69, 73, 76, 78],
  [59, 66, 69, 74, 76],
  [55, 62, 66, 69, 74],
  [57, 64, 69, 71, 76],
];
const BASS = [50, 47, 43, 45];
const BELLS = [78, 81, 83, 86, 88, 90]; // D major pentatonic, high
const hz = (/** @type {number} */ m) => 440 * 2 ** ((m - 69) / 12);

function reverb(/** @type {AudioContext} */ c) {
  const len = c.sampleRate * 4,
    buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

function build() {
  if (ctx) return;
  const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  const wet = ctx.createGain(),
    dry = ctx.createGain(),
    rv = reverb(ctx),
    tone = ctx.createBiquadFilter(),
    comp = ctx.createDynamicsCompressor();
  tone.type = 'lowpass';
  tone.frequency.value = 3200;
  wet.gain.value = 0.5;
  dry.gain.value = 0.7;
  tone.connect(dry).connect(master);
  tone.connect(rv).connect(wet).connect(master);
  master.connect(comp);
  last = comp;
  // through an <audio> element where the browser allows it (plays on iPhone in silent mode), else straight out
  if (ctx.createMediaStreamDestination) {
    const dest = ctx.createMediaStreamDestination();
    comp.connect(dest);
    out = new Audio();
    out.srcObject = dest.stream;
    out.setAttribute('playsinline', '');
  } else comp.connect(ctx.destination);
  const bus = tone;

  const voice = (
    /** @type {number} */ n,
    /** @type {number} */ t,
    /** @type {number} */ dur,
    /** @type {OscillatorType} */ type,
    /** @type {number} */ level,
  ) => {
    if (!ctx) return;
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = type;
      o.frequency.value = hz(n);
      o.detune.value = det;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level, t + 2.5);
      g.gain.setValueAtTime(level, t + dur - 1.5);
      g.gain.linearRampToValueAtTime(0, t + dur + 2.5);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + dur + 2.7);
    }
  };
  const bell = (/** @type {number} */ n, /** @type {number} */ t) => {
    if (!ctx) return;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = hz(n);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 3.3);
  };
  // schedule ahead: one chord every 8 s, a soft bass under it, a few bell notes on top
  let next = ctx.currentTime + 0.1,
    i = 0;
  const tick = () => {
    if (!ctx || ctx.state !== 'running') return;
    while (next < ctx.currentTime + 10) {
      for (const n of CHORDS[i % CHORDS.length]) voice(n, next, 8, 'triangle', 0.035);
      voice(BASS[i % BASS.length], next, 8, 'sine', 0.06);
      for (let k = 0; k < 3; k++)
        if (Math.random() < 0.6)
          bell(BELLS[Math.floor(Math.random() * BELLS.length)], next + 1 + k * 2.4 + Math.random());
      next += 8;
      i++;
    }
  };
  setInterval(tick, 1000);
  ctx.addEventListener?.('statechange', tick);
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
  btn.setAttribute('aria-label', on ? (zh ? '关闭音乐' : 'Turn music off') : zh ? '开启音乐' : 'Turn on the music');
  hint.textContent = zh ? '开启音乐' : 'Turn on the music';
  btn.classList.toggle('has-hint', !heard && !on && !test);
}

/** start (must run inside a touch, click or key: that is when browsers allow sound) and fade in */
function play(secs = 5) {
  build();
  if (!ctx) return;
  on = true;
  // if the browser will not play the <audio> element, send the sound straight out instead (called at once, inside
  // the gesture, as phone browsers require)
  out?.play().catch(() => {
    if (ctx && last && out) {
      last.connect(ctx.destination);
      out = null;
    }
  });
  fadeTo(VOLUME, secs);
  render();
  return ctx.resume().then(
    () => {
      if (ctx?.state === 'running') heard = true;
      else on = false;
      render();
      return on;
    },
    () => ((on = false), render(), false),
  );
}
function stop() {
  on = false;
  fadeTo(0, 1.2);
  setTimeout(() => !on && ctx?.suspend(), 1400);
  render();
}

btn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (on) stop();
  else play(2.5);
  wanted = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
});
// arrival: the first touch anywhere starts the music (unless the visitor turned it off before)
// (a touch only counts as a gesture when it ends, and a browser may still refuse: keep listening until the sound runs)
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'];
const done = () => GESTURES.forEach((t) => removeEventListener(t, first, true));
const first = (/** @type {Event} */ e) => {
  if (!wanted || on) return done();
  if (btn && btn.contains(/** @type {Node} */ (e.target))) return done();
  play()?.then((ok) => ok && done());
};
if (!test) GESTURES.forEach((t) => addEventListener(t, first, true));
// quiet while the page is in the background
document.addEventListener('visibilitychange', () => {
  if (!ctx || !on) return;
  if (document.hidden) fadeTo(0, 0.5);
  else fadeTo(VOLUME, 2);
});
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
render();
