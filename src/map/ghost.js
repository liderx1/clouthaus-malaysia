import { redrawShadows, scene } from './stage.js';

// focus modes turn the city see-through so routes, pins and markers read clearly; the ground and roads stay solid
const GHOST_KEYS = new Set([
  'bld',
  'tiles',
  'leaf',
  'core',
  'bark',
  'frond',
  'ptrunk',
  'pole',
  'vb',
  'vd',
  'via',
  'pier',
  'parapet',
  'rail',
  'deck',
  'train',
  'lglass',
  'lroof',
  'skyb',
]);
const GHOSTS = [];
scene.traverse((/** @type {any} */ o) => {
  const k = o.material?.customProgramCacheKey?.();
  if (o.isMesh && GHOST_KEYS.has(k)) {
    o.material.userData.wasTransparent = o.material.transparent;
    GHOSTS.push(o);
  }
});
let ghosted = false;
export function ghost(d) {
  const on = d > 0.02;
  if (on !== ghosted) {
    ghosted = on;
    GHOSTS.forEach((o) => {
      o.material.transparent = on || o.material.userData.wasTransparent;
      o.material.needsUpdate = true;
      redrawShadows();
      o.userData.cast ??= o.castShadow;
      o.castShadow = on ? false : o.userData.cast;
    });
  }
  if (on)
    GHOSTS.forEach((o) => {
      o.material.opacity = Math.min((o.material.userData.op ??= o.material.opacity), 1 - 0.9 * d);
      o.material.depthWrite = d < 0.3;
    });
  else
    GHOSTS.forEach((o) => {
      if (o.material.userData.op != null) {
        o.material.opacity = o.material.userData.op;
        o.material.depthWrite = true;
      }
    });
}
