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
const mallGeo = buildingGeometry([{ ...MALL, h: MALL_H, type: 'commercial', kId: 6 }]);
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
  x.fillStyle = '#8F9193';
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
    m.position.set(px + nx * 0.6, 13.5, -(py + ny * 0.6));
    m.rotation.y = Math.atan2(nx, -ny);
    m.renderOrder = 2;
    mallGroup.add(m);
  };
  sign(a[0] + dx * k, a[1] + dy * k, nx, ny, 22);
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
  new THREE.LineBasicMaterial({ color: 0xff6a2b, transparent: true }),
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
    uniforms: U,
    vertexShader:
      'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform float uDim; uniform float uNight; varying vec2 vU; void main(){ float r = length(vU);
    float th = mix(0.1, 0.04, uNight);
    float w = fract(uTime * 0.35); float ringA = smoothstep(th, 0.0, abs(r - w)) * (1.0 - w);
    float w2 = fract(uTime * 0.35 + 0.5); ringA += smoothstep(th, 0.0, abs(r - w2)) * (1.0 - w2);
    float halo = smoothstep(1.0, 0.45, r) * smoothstep(0.38, 0.6, r) * (0.34 + 0.1 * sin(uTime * 2.2)) * (1.0 - uNight * 0.7);
    vec3 col = mix(vec3(1.0, 0.0, 0.5), vec3(1.0, 0.42, 0.15), uNight);   // fluorescent magenta by day, warm orange by night
    gl_FragColor = vec4(col, clamp(ringA * mix(1.6, 0.6, uNight) + halo * mix(1.5, 1.0, uNight) + uDim * 0.4 * ringA, 0.0, 0.95)); }`,
  }),
);
pulse.rotation.x = -Math.PI / 2;
pulse.position.set(mallC[0], 0.4, -mallC[1]);
pulse.scale.setScalar(mallRad * 1.45);
scene.add(pulse);
