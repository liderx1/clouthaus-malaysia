import * as THREE from 'three';
import { MOBILE } from './env.js';
import { LABELS } from './labels.js';
import { camera, renderer, scene } from './stage.js';
import { S } from './state.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ---------- post-processing ---------- */
export const composer = new EffectComposer(
  renderer,
  new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: MOBILE ? 2 : 4 /* phone GPUs resolve multisampling in tile memory: 2× is cheap there */,
  }),
);
composer.setPixelRatio(S.dpr);
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
// (ambient occlusion removed: it cost more GPU time than the rest of the frame)
export const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight).multiplyScalar(0.5),
  0.1,
  0.45,
  0.95,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  LABELS.forEach((L) => {
    L.w = null;
  });
});
