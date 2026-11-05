import * as THREE from 'three';
import { $, TEST } from './env.js';
import { sampleAt } from './geo.js';
import { ghost } from './ghost.js';
import { updateLabels } from './labels.js';
import { clock, dayFog, nightFog } from './main.js';
import { HI, crownMat, edges, mallGroup } from './mall.js';
import { BEACONS } from './markers.js';
import { pinDot, pinGroup, pinSprite } from './pin.js';
import { bloom, composer } from './post.js';
import { MONO, MONO_Z, RAIL_Z, TRAIN } from './rail.js';
import {
  DPR_MAX,
  ENV,
  HEMI,
  SUN,
  U,
  camera,
  controls,
  keepInBounds,
  overlay,
  redrawShadows,
  renderer,
  scene,
  sky,
} from './stage.js';
import { createQuality } from './core/quality.js';
import { noteFrameRate } from './report.js';
import { MODE, S } from './state.js';
import { lampMat, moveCars } from './traffic.js';
import { nearTrees } from './trees.js';

/** by day the city around the mall is faded a little (softer colour, lighter) so the mall stands out: 0 = off, 1 = full fade */
const CALM_DAY = 0.6;
let booted = false;
// always the sharpest resolution; it steps down only for a device that cannot reach 20 fps for 5 s in a row
const quality = createQuality({ max: DPR_MAX, slowMs: 50, slowRun: 5 });
// a hidden tab stops the loop; when it comes back the first seconds are not a fair measure
document.addEventListener('visibilitychange', () => document.hidden || quality.pause());
const perf = { n: 0, t: 0 };
redrawShadows();
renderer.setAnimationLoop(() => {
  const rawDt = clock.getDelta(),
    dt = Math.min(rawDt, 0.05),
    time = TEST ? 1 : clock.elapsedTime,
    now = performance.now();
  U.uTime.value = time;
  // ?test: every transition lands at once, so screenshots do not depend on how fast the machine draws
  const ease = (rate) => (TEST ? 1 : Math.min(1, dt * rate));
  U.uDim.value += (S.dimTarget - U.uDim.value) * ease(4);
  ghost(U.uDim.value);
  U.uNight.value += (S.nightTarget - U.uNight.value) * ease(2.5);
  const n = U.uNight.value;
  U.uCalm.value = CALM_DAY * (1 - n);
  SUN.intensity = 2.3 * (1 - n) + 0.12 * n;
  SUN.color.setRGB(1, 0.93 - 0.08 * n, 0.82 + 0.18 * n);
  HEMI.intensity = 0.5 * (1 - n) + 0.06 * n;
  scene.environmentIntensity = 0.28 * (1 - n) + 0.03 * n;
  const wantEnv = n > 0.5 ? ENV.night : ENV.day;
  if (wantEnv && scene.environment !== wantEnv) scene.environment = wantEnv;
  sky.position.copy(camera.position);
  renderer.toneMappingExposure = 1.05 - 0.2 * n;
  scene.fog.color.copy(dayFog).lerp(nightFog, n);
  bloom.strength = 0.08 + 0.55 * n + 0.15 * U.uDim.value;
  bloom.threshold = 0.95 - 0.1 * n;
  lampMat.emissiveIntensity = 3 * n;
  mallGroup.userData.logo.material.emissiveIntensity = 0.55 * n;
  if (TRAIN) TRAIN.win.emissiveIntensity = 1.6 * n;
  if (MONO) MONO.win.emissiveIntensity = 1.6 * n;
  // the highlight on the main building: main.highlight (e.g. the facade's gold), else magenta by day / orange by night
  if (HI) crownMat.color.copy(HI);
  else crownMat.color.setRGB(1, 0.08 + 0.34 * n, 0.58 - 0.41 * n);
  crownMat.color.multiplyScalar(1.2 + 0.9 * n + (0.6 + 0.8 * U.uDim.value) * (0.5 + 0.5 * Math.sin(time * 2.6)));
  if (HI) edges.material.color.copy(HI);
  else edges.material.color.setRGB(1, 0.08 + 0.34 * n, 0.58 - 0.41 * n);
  edges.material.opacity = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(time * 2.6)) * (0.4 + U.uDim.value);
  if (pinGroup.visible) {
    const k = Math.min(1, (now - pinGroup.userData.t0) / 650),
      b = 1 - Math.pow(1 - k, 3) * Math.cos(k * 9); // drop with a small bounce
    pinSprite.position.y = pinGroup.userData.top + 40 * (1 - b);
    pinDot.scale.setScalar(1 + 2.5 * ((time * 0.9) % 1));
    pinDot.material.opacity = 1 - ((time * 0.9) % 1);
  }
  BEACONS.forEach((g) => {
    if (!g.visible) return;
    const k = Math.min(1, (now - (g.userData.t0 || 0)) / 500);
    g.scale.setScalar(0.2 + 0.8 * (1 - Math.pow(1 - k, 3)) + 0.06 * Math.sin(time * 5));
    g.userData.disc.scale.setScalar(1 + 0.5 * ((time * 1.2) % 1));
    g.userData.disc.material.opacity = 0.9 * (1 - ((time * 1.2) % 1));
  });
  if (TRAIN)
    TRAIN.trains.forEach((T) => {
      const s0 = (time * 16 + T.phase * T.L) % T.L;
      T.cars.forEach((c, i) => {
        const s = T.dir > 0 ? (s0 - i * 22 + T.L) % T.L : (T.L - s0 + i * 22) % T.L;
        const q = sampleAt(T.p, T.cum, s);
        c.position.set(q.x, RAIL_Z + 0.1, -q.y);
        c.rotation.y = Math.atan2(q.dx * T.dir, -q.dy * T.dir);
      });
    });
  if (MONO)
    MONO.trains.forEach((T) => {
      const s0 = (time * 12 + T.phase * T.L) % T.L;
      T.cars.forEach((c, i) => {
        const s = T.dir > 0 ? (s0 - i * 12 + T.L) % T.L : (T.L - s0 + i * 12) % T.L;
        const q = sampleAt(T.p, T.cum, s);
        c.position.set(q.x, MONO_Z + 0.4, -q.y);
        c.rotation.y = Math.atan2(q.dx * T.dir, -q.dy * T.dir);
      });
    });
  moveCars(TEST ? 0 : dt, n > 0.35);
  MODE.meshes.forEach((m) => m.g.userData.tick?.(time));
  if (S.fly) {
    const k = TEST ? 1 : Math.min(1, (now - S.fly.t0) / S.fly.dur),
      e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(S.fly.fromP, S.fly.toP, e);
    controls.target.lerpVectors(S.fly.fromT, S.fly.toT, e);
    if (k >= 1) S.fly = null;
  }
  if (S.zoomTo != null) {
    const off = camera.position.clone().sub(controls.target),
      d = off.length(),
      nd = d + (S.zoomTo - d) * ease(9);
    camera.position.copy(controls.target).add(off.setLength(nd));
    if (Math.abs(S.zoomTo - nd) < 0.05) S.zoomTo = null;
  }
  controls.update();
  keepInBounds();
  // compass + scale bar
  const az = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
  $('#rose').style.transform = `rotate(${(az * 180) / Math.PI}deg)`;
  const a = controls.target.clone().project(camera),
    right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const b = controls.target.clone().add(right.multiplyScalar(100)).project(camera);
  const px = (Math.abs(b.x - a.x) * innerWidth) / 2;
  $('#scale i').style.width = `${Math.max(10, Math.min(260, px))}px`;
  nearTrees.update(now);
  updateLabels(now);
  composer.render();
  // the pin on top of the finished frame
  if (pinGroup.visible) {
    renderer.autoClear = false;
    renderer.setRenderTarget(null);
    renderer.render(overlay, camera);
    renderer.autoClear = true;
  }
  // keep it smooth and sharp: once a second, core/quality.js picks the resolution from the average frame time
  perf.n++;
  perf.t += rawDt;
  if (perf.t > 1 && !TEST) {
    const ms = (perf.t / perf.n) * 1000;
    perf.n = 0;
    perf.t = 0;
    noteFrameRate(Math.min(ms, 50), S.dpr <= 0.75);
    // measure only steady viewing: a day / night change or a camera flight strains a few frames on purpose
    const transition = !!S.fly || Math.abs(U.uNight.value - S.nightTarget) > 0.01;
    const next = transition ? (quality.pause(), S.dpr) : quality.update(ms, now);
    if (next !== S.dpr) {
      S.dpr = next;
      renderer.setPixelRatio(S.dpr);
      composer.setPixelRatio(S.dpr);
    }
  }
  S.frames++;
  if (!booted) {
    booted = true;
    requestAnimationFrame(() => $('#preload').classList.add('is-done'));
  }
});
