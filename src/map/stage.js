import * as THREE from 'three';
import { V } from './data.js';
import { $, MOBILE, TEST } from './env.js';
import { S } from './state.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

/* ---------- renderer, scene, camera ---------- */
export const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); // anti-aliasing comes from the multisampled composer target
// resolution adapts to the device: it starts modest and steps down if frames run slow (see the loop)
// sharpest resolution tried: phones have 2–3× screens; 2× is near-indistinguishable from 3× at this scale and half
// the pixels. core/quality.js steps down from here when a device cannot keep up.
export const DPR_MAX = Math.min(devicePixelRatio, MOBILE ? 2 : 1.5);
S.dpr = DPR_MAX;
renderer.setPixelRatio(S.dpr);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // the sun and the city do not move: draw shadows once, and again only when something changes
export const redrawShadows = () => {
  renderer.shadowMap.needsUpdate = true;
};
$('#stage').appendChild(renderer.domElement);
export const scene = new THREE.Scene();
/** drawn after bloom and tone mapping (see loop.js): the store pin, so it stays crisp and true to colour by day and night */
export const overlay = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
// image-based light from Poly Haven city HDRIs (CC0): Canary Wharf by day, Shanghai Bund by night, for real reflections on glass and paint
export const ENV = {};
for (const [k, file, later] of /** @type {[string, string, number][]} */ ([
  ['night', 'shanghai_bund_512', 0],
  ['day', 'wide_street_01_512', 2500],
]))
  setTimeout(
    () =>
      new RGBELoader().load(`/map/tex/${file}.hdr`, (t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        ENV[k] = pmrem.fromEquirectangular(t).texture;
        t.dispose();
        if (!scene.environment) scene.environment = ENV[k];
      }),
    later,
  );
export const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 4, 6000);
export const HOME = ((k) => ({ p: V(15 + 385 * k, 25 - 445 * k, 22 + 200 * k), t: V(15, 0, 22) }))(MOBILE ? 1.75 : 1.2);
camera.position.copy(HOME.p);
export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME.t);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
// the lowest view is a little above street level, looking slightly down (about 8° below the horizon): never under
// the ground or out past the edge of the modelled city
controls.maxPolarAngle = Math.PI * 0.455;
controls.minDistance = 25;
controls.maxDistance = 1800;
const BOUNDS = { r: 1100, yMin: 0, yMax: 40 }; // how far from the mall the view may wander, and how high its centre sits
/** keep the point the camera looks at above the ground and within the city; the camera moves with it */
export function keepInBounds() {
  const t = controls.target,
    c = HOME.t,
    shift = new THREE.Vector3();
  if (t.y < BOUNDS.yMin) shift.y = BOUNDS.yMin - t.y;
  else if (t.y > BOUNDS.yMax) shift.y = BOUNDS.yMax - t.y;
  const dx = t.x - c.x,
    dz = t.z - c.z,
    d = Math.hypot(dx, dz);
  if (d > BOUNDS.r) {
    shift.x = (dx / d) * BOUNDS.r - dx;
    shift.z = (dz / d) * BOUNDS.r - dz;
  }
  if (shift.lengthSq()) {
    t.add(shift);
    camera.position.add(shift);
  }
}
controls.autoRotate = !TEST;
controls.autoRotateSpeed = 0.35;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.7;
controls.panSpeed = 0.8;
controls.enableZoom = false; // wheel and trackpad zoom are eased below
renderer.domElement.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    controls.autoRotate = false;
    S.fly = null;
    const d = camera.position.distanceTo(controls.target),
      k = Math.exp((e.ctrlKey ? e.deltaY * 2.5 : e.deltaY) * (e.deltaMode ? 0.05 : 0.0011));
    S.zoomTo = THREE.MathUtils.clamp((S.zoomTo ?? d) * k, controls.minDistance, controls.maxDistance);
  },
  { passive: false },
);
// pinch on touch screens still uses OrbitControls' own dolly
renderer.domElement.addEventListener(
  'touchstart',
  () => {
    controls.enableZoom = true;
  },
  { passive: true },
);
renderer.domElement.addEventListener(
  'pointerdown',
  () => {
    controls.autoRotate = false;
  },
  { once: true },
);

// uCalm: by day, the city around the mall is faded a little (softer colour, lighter) so the eye goes to the mall
export const U = { uTime: { value: 0 }, uNight: { value: 1 }, uDim: { value: 0 }, uCalm: { value: 0 } };
/** parts of the mall itself: dimmable for focus modes, but never muted by day */
const MALL_PARTS = new Set(['skyb', 'lglass', 'lroof']);
export const SUN = new THREE.DirectionalLight(0xfff2e0, 2.6);
SUN.position.set(-420, 620, 260);
SUN.castShadow = true;
Object.assign(SUN.shadow.camera, { left: -760, right: 760, top: 760, bottom: -760, near: 10, far: 2000 });
SUN.shadow.mapSize.set(2048, 2048); // shadows are drawn once, so a sharper map costs memory, not frame time
SUN.shadow.bias = -0.0004;
SUN.shadow.normalBias = 0.6;
scene.add(SUN, SUN.target);
export const HEMI = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5c, 0.5);
scene.add(HEMI);

// sky dome: Poly Haven pure-sky HDRIs (tone-mapped to JPG) - tropical cumulus by day, dusk by night
const skyTex = (n) => {
  const t = new THREE.TextureLoader().load(`/map/tex/${n}.jpg`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
export const sky = new THREE.Mesh(
  new THREE.SphereGeometry(4000, 64, 32),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uNight: U.uNight,
      uDay: { value: skyTex('sky_day') },
      uDusk: { value: skyTex('sky_night') },
      uHorD: { value: new THREE.Color(0xb9c2c4) },
      uHorN: { value: new THREE.Color(0x5e4f5e) },
    },
    vertexShader:
      'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uNight; uniform sampler2D uDay, uDusk; uniform vec3 uHorD, uHorN; varying vec3 vP;
    void main(){ float h = vP.y; vec2 uv = vec2(atan(vP.z, vP.x) / 6.2831853 + 0.5, clamp(asin(clamp(h, 0.0, 1.0)) / 1.5707963, 0.002, 0.998));
      vec3 c = mix(texture2D(uDay, uv).rgb, texture2D(uDusk, uv).rgb, uNight);
      c = mix(mix(uHorD, uHorN, uNight), c, smoothstep(-0.02, 0.06, h));
      gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
    }`,
  }),
);
sky.material.toneMapped = false;
sky.renderOrder = -1;
scene.add(sky);
scene.fog = new THREE.Fog(0xb9c2c4, 1800, 5200);

/* inject "dim everything except what matters" into a material */
export function dimmable(mat, key = 'dim') {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uDim = U.uDim;
    sh.uniforms.uDimN = U.uNight;
    sh.uniforms.uCalm = U.uCalm;
    const calm = MALL_PARTS.has(key)
      ? ''
      : ' gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(vec3(dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114))), gl_FragColor.rgb, 0.7) * 0.72 + vec3(0.25, 0.25, 0.24), uCalm);\n';
    sh.fragmentShader =
      'uniform float uDim; uniform float uDimN; uniform float uCalm;\n' +
      sh.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n' +
          calm +
          ' gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(mix(vec3(dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114))), gl_FragColor.rgb, 0.2) * 0.25 + vec3(0.70, 0.72, 0.75), gl_FragColor.rgb * 0.07 + vec3(0.006, 0.009, 0.018), uDimN), uDim);',
      );
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}
