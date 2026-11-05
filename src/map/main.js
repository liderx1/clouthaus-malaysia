import * as THREE from 'three';
import { CONFIG } from './config.js';
import { readHash } from './content.js';
import { V } from './data.js';
import { START_HASH, TEST } from './env.js';
import { LABELS } from './labels.js';
import { nearTrees } from './trees.js';
import { HOME, camera, controls, renderer, scene } from './stage.js';
import { S } from './state.js';
import { buildUI } from './ui.js';

/* ---------- loop ---------- */
export const clock = new THREE.Clock();
// haze toward the horizon (site.config.json → look tints it to the site's palette)
export const dayFog = new THREE.Color(CONFIG.look?.fogDay ?? 0xb9c2c4),
  nightFog = new THREE.Color(CONFIG.look?.fogNight ?? 0x3a3142);
buildUI();
// ?debug exposes the scene for inspection from the browser console
if (location.search.includes('debug'))
  Object.assign(window, {
    __scene: scene,
    __renderer: renderer,
    __labels: LABELS,
    __trees: nearTrees,
    __cam: camera,
    __view: (e, a) => {
      controls.autoRotate = false;
      camera.position.copy(V(...e));
      controls.target.copy(V(...a));
      controls.update();
    },
  });
// ?test lets the screenshot sweep wait until the camera has stopped moving
if (TEST)
  Object.assign(window, {
    __mapIdle: () => !S.fly && S.zoomTo == null && !S.pinLoading,
    __mapFrames: () => S.frames,
    __pinRect: () => S.pinRect,
    __view: () => ({
      tilt:
        (Math.acos((camera.position.y - controls.target.y) / camera.position.distanceTo(controls.target)) * 180) /
        Math.PI,
      targetY: controls.target.y,
      camY: camera.position.y,
      far: Math.hypot(controls.target.x - HOME.t.x, controls.target.z - HOME.t.z),
    }),
  });
document.documentElement.classList.add('is-ready');

readHash(START_HASH);
// a share link pasted into an open tab, or back / forward between links
addEventListener('hashchange', () => readHash());
