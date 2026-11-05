import * as THREE from 'three';
import { buildingGeometry, windowShader } from './buildings.js';
import { CONFIG } from './config.js';
import { MALL, MALL_H, MALL_R, ring } from './data.js';
import { inPoly } from './geo.js';
import { ribbon } from './ground.js';
import { U, scene } from './stage.js';

/* ---------- the main building (site.config.json → main): highlighted, glowing, scanning ---------- */
export const mallGroup = new THREE.Group();
scene.add(mallGroup);
const mallMat = windowShader(
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0x000000,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }),
  true,
);
export const TOWER = CONFIG.main.style === 'tower';
/** main.highlight: the colour of the main building's outline, crown ribbon and pulse (default magenta / orange) */
export const HI = CONFIG.main.highlight ? new THREE.Color(CONFIG.main.highlight) : null;
const mallGeo = buildingGeometry([{ ...MALL, h: MALL_H, type: 'commercial', kId: TOWER ? 7 : 6, exact: TOWER }]);
{
  const c = mallGeo.attributes.color;
  const w = new THREE.Color(CONFIG.main.facade ?? '#F1E9DC'),
    roof = new THREE.Color(CONFIG.main.roof ?? '#C9CDD0');
  const n = mallGeo.attributes.normal;
  for (let i = 0; i < c.count; i++) (n.getY(i) > 0.5 ? roof : w).toArray(c.array, i * 3);
}
export const mallMesh = new THREE.Mesh(mallGeo, mallMat);
mallMesh.castShadow = mallMesh.receiveShadow = true;
mallGroup.add(mallMesh);
export const MR = ring(MALL.p);
export const mallC = MR.reduce((a, q) => [a[0] + q[0] / MR.length, a[1] + q[1] / MR.length], [0, 0]);
const TOWER_CROWN = CONFIG.main.tower?.crown ?? 8;
const mallRad = Math.max(...MR.map((q) => Math.hypot(q[0] - mallC[0], q[1] - mallC[1])));
/** roofs of covered walkways (site extras), hidden while a route or the exits are shown so the route stays visible */
export const LINK_ROOF = [];
// logo panels: one over the main entrance (main.signFacade, the two corners of that facade; else the longest one), plus
// one on each of the next three longest facades so the name reads from all sides
{
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = TOWER ? '#1E2A36' : '#8F9193';
  x.fillRect(0, 0, 1024, 512);
  x.fillStyle = 'rgba(255,255,255,.08)';
  for (let i = 0; i < 1024; i += 64) x.fillRect(i, 0, 2, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    x.drawImage(img, 112, 96, 800, (800 * img.height) / img.width || 320);
    tex.needsUpdate = true;
  };
  img.src = CONFIG.logo;
  const edgeLen = (/** @type {number} */ i) =>
    Math.hypot(MR[(i + 1) % MR.length][0] - MR[i][0], MR[(i + 1) % MR.length][1] - MR[i][1]);
  const near = (/** @type {number[]} */ q, /** @type {number[]} */ r) => Math.hypot(q[0] - r[0], q[1] - r[1]) < 1;
  const [fa, fb] = CONFIG.main.signFacade ?? [];
  let e = fa ? MR.findIndex((q, i) => near(q, fa) && near(MR[(i + 1) % MR.length], fb)) : -1;
  if (e < 0) e = MR.reduce((best, _, i) => (edgeLen(i) > edgeLen(best) ? i : best), 0);
  const a = MR[e],
    b = MR[(e + 1) % MR.length],
    k = fa ? Math.min(1, Math.max(0, (0 - a[1]) / (b[1] - a[1]))) : 0.5; // EkoCheras: the panel sits where the facade crosses y = 0
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    L = Math.hypot(dx, dy);
  let nx = dy / L,
    ny = -dx / L;
  if (nx < 0) {
    nx = -nx;
    ny = -ny;
  }
  const logoMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.6,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0,
    polygonOffset: true,
    polygonOffsetFactor: -8,
    polygonOffsetUnits: -16,
  });
  // one panel over the main entrance, plus one on every other long facade so the name reads from all sides
  const sign = (px, py, nx, ny, w) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), logoMat);
    m.position.set(px + nx * 0.6, TOWER ? MALL_H - (TOWER_CROWN + w / 2) - 2 : 13.5, -(py + ny * 0.6));
    m.rotation.y = Math.atan2(nx, -ny);
    m.renderOrder = 2;
    mallGroup.add(m);
  };
  sign(a[0] + dx * k, a[1] + dy * k, nx, ny, TOWER ? Math.min(24, L * 0.6) : 22);
  MR.map((q, i) => [i, Math.hypot(MR[(i + 1) % MR.length][0] - q[0], MR[(i + 1) % MR.length][1] - q[1])])
    .filter(([i]) => i !== e)
    .sort((u, v) => v[1] - u[1])
    .slice(0, 3)
    .forEach(([i, L2]) => {
      const p = MR[i],
        q = MR[(i + 1) % MR.length],
        ex = (q[0] - p[0]) / L2,
        ey = (q[1] - p[1]) / L2,
        mx = (p[0] + q[0]) / 2,
        my = (p[1] + q[1]) / 2;
      let ux = ey,
        uy = -ex;
      if ((mx + ux - mallC[0]) ** 2 + (my + uy - mallC[1]) ** 2 < (mx - mallC[0]) ** 2 + (my - mallC[1]) ** 2) {
        ux = -ux;
        uy = -uy;
      }
      if (!inPoly(mx + ux * 3, my + uy * 3, MALL_R)) sign(mx, my, ux, uy, Math.min(18, L2 * 0.5));
    });
  mallGroup.userData.logo = { material: logoMat };
}
export const edges = new THREE.LineSegments(
  new THREE.EdgesGeometry(mallGeo, 20),
  new THREE.LineBasicMaterial({ color: HI ?? 0xff6a2b, transparent: true }),
);
mallGroup.add(edges);
export const crownMat = new THREE.MeshBasicMaterial({ color: 0xff6a2b, transparent: true, side: THREE.DoubleSide });
{
  const loop = MR.concat([MR[0]]);
  for (const z of [MALL_H + 0.25, 0.35])
    mallGroup.add(
      new THREE.Mesh(
        ribbon(
          loop.map((q) => [q[0], q[1], z]),
          z > 1 ? 1.4 : 2.4,
          0,
          false,
        ),
        crownMat,
      ),
    );
}
const pulse = new THREE.Mesh(
  new THREE.RingGeometry(0, 1, 96, 1),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { ...U, uK: { value: 1 } },
    vertexShader:
      'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform float uDim; uniform float uNight; uniform float uK; varying vec2 vU; void main(){ float r = length(vU);
    float th = mix(0.1, 0.04, uNight);
    float w = fract(uTime * 0.35); float ringA = smoothstep(th, 0.0, abs(r - w)) * (1.0 - w);
    float w2 = fract(uTime * 0.35 + 0.5); ringA += smoothstep(th, 0.0, abs(r - w2)) * (1.0 - w2);
    float halo = smoothstep(1.0, 0.45, r) * smoothstep(0.38, 0.6, r) * (0.34 + 0.1 * sin(uTime * 2.2)) * (1.0 - uNight * 0.7);
    vec3 col = ${HI ? `vec3(${HI.r.toFixed(3)}, ${HI.g.toFixed(3)}, ${HI.b.toFixed(3)})` : 'mix(vec3(1.0, 0.0, 0.5), vec3(1.0, 0.42, 0.15), uNight)'};   // main.highlight, else fluorescent magenta by day, warm orange by night
    gl_FragColor = vec4(col, uK * clamp(ringA * mix(1.6, 0.6, uNight) + halo * mix(1.5, 1.0, uNight) + uDim * 0.4 * ringA, 0.0, 0.95)); }`,
  }),
);
pulse.rotation.x = -Math.PI / 2;
pulse.position.set(mallC[0], 0.4, -mallC[1]);
pulse.scale.setScalar(CONFIG.main.pulseRadius ?? mallRad * 1.45); // a tower on a podium needs a wider ring
scene.add(pulse);
// among tall buildings the ground around the main building is hidden from most views: a faint second pass of the
// same ring is drawn through them (site.config.json → main.pulseThrough, 0–1)
if (CONFIG.main.pulseThrough) {
  const m = /** @type {THREE.ShaderMaterial} */ (pulse.material).clone();
  m.uniforms = { ...U, uK: { value: CONFIG.main.pulseThrough } };
  m.depthTest = false;
  const ghost = new THREE.Mesh(pulse.geometry, m);
  ghost.rotation.copy(pulse.rotation);
  ghost.position.copy(pulse.position);
  ghost.scale.copy(pulse.scale);
  ghost.renderOrder = 2;
  scene.add(ghost);
}
/* ---------- main.halo: a soft light around the main building, after the brand's lit-from-behind look ----------
   A billboard of warm light that always stands just behind the building (seen from the camera), so the building
   itself is drawn over its centre and the glow reads as an aura around it, by day as well as by night. */
export const HALO = CONFIG.main.halo
  ? (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,246,226,1)');
      g.addColorStop(0.22, 'rgba(246,224,182,.82)');
      g.addColorStop(0.5, 'rgba(224,186,124,.32)');
      g.addColorStop(1, 'rgba(210,160,96,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      // by day the city is bright: the glow is drawn in front, as a ring that leaves the building itself clear
      const c2 = document.createElement('canvas');
      c2.width = c2.height = 256;
      const x2 = c2.getContext('2d'),
        g2 = x2.createRadialGradient(128, 128, 0, 128, 128, 128);
      g2.addColorStop(0, 'rgba(255,236,200,.05)');
      g2.addColorStop(0.16, 'rgba(255,230,190,.1)');
      g2.addColorStop(0.32, 'rgba(250,214,160,.42)');
      g2.addColorStop(0.52, 'rgba(240,196,130,.3)');
      g2.addColorStop(0.76, 'rgba(235,190,120,.1)');
      g2.addColorStop(1, 'rgba(230,180,110,0)');
      x2.fillStyle = g2;
      x2.fillRect(0, 0, 256, 256);
      const dayTex = new THREE.CanvasTexture(c2);
      dayTex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
      const s = new THREE.Sprite(mat);
      s.renderOrder = 1;
      scene.add(s);
      return {
        sprite: s,
        day: new THREE.Color(CONFIG.main.halo.day ?? '#E9B96E'),
        night: new THREE.Color(CONFIG.main.halo.night ?? '#F3D9A6'),
        size: CONFIG.main.halo.size ?? 1.5,
        r: mallRad,
        tex,
        dayTex,
      };
    })()
  : null;
/** keep the halo behind the building as the camera moves; brighter and additive at night */
export function updateHalo(/** @type {THREE.Camera} */ cam, /** @type {number} */ n, /** @type {number} */ time) {
  if (!HALO) return;
  const { sprite: s } = HALO,
    dx = mallC[0] - cam.position.x,
    dz = -mallC[1] - cam.position.z,
    d = Math.hypot(dx, dz) || 1,
    night = n > 0.5,
    back = night ? HALO.r + 6 : -HALO.r; // by night behind the building, by day in front of it
  s.position.set(mallC[0] + (dx / d) * back, MALL_H * 0.56, -mallC[1] + (dz / d) * back);
  const k = (1 + 0.03 * Math.sin(time * 0.9)) * (night ? 1 : 1.25);
  s.scale.set(MALL_H * 0.95 * HALO.size * k, MALL_H * 1.45 * HALO.size * k, 1);
  s.material.color.copy(HALO.day).lerp(HALO.night, n);
  s.material.opacity = night ? 0.5 : 0.42;
  if (s.material.map !== (night ? HALO.tex : HALO.dayTex)) {
    s.material.map = night ? HALO.tex : HALO.dayTex;
    s.material.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
    s.material.depthTest = night;
    s.material.needsUpdate = true;
  }
}
