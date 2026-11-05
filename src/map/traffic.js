import * as THREE from 'three';
import { OSM } from './data.js';
import { MOBILE } from './env.js';
import { cumulative, polyLen, rand, sampleAt } from './geo.js';
import { RW, roadZ } from './ground.js';
import { box, rbox, solid, wheel } from './rail.js';
import { dimmable, scene } from './stage.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- street lamps and traffic ---------- */
const lampHeads = [];
{
  const poles = [];
  for (const r of OSM.roads) {
    if (!['trunk', 'primary', 'secondary', 'tertiary'].includes(r.t) || r.bridge) continue;
    const w = RW[r.t],
      cum = cumulative(r.p);
    for (let s = 14; s < cum.at(-1); s += 34) {
      const q = sampleAt(r.p, cum, s);
      const sg = Math.floor(s / 34) % 2 ? 1 : -1;
      const x = q.x - q.dy * (w / 2 + 0.8) * sg,
        y = q.y + q.dx * (w / 2 + 0.8) * sg;
      const g = new THREE.CylinderGeometry(0.09, 0.13, 9, 5);
      g.translate(x, 4.5, -y);
      poles.push(g);
      lampHeads.push([x - q.dy * -1.2 * sg, y + q.dx * -1.2 * sg]);
    }
  }
  if (poles.length)
    scene.add(
      new THREE.Mesh(
        mergeGeometries(poles),
        dimmable(new THREE.MeshStandardMaterial({ color: 0x6e7378, roughness: 0.5, metalness: 0.6 }), 'pole'),
      ),
    );
}
export const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffc777, emissiveIntensity: 0 });
const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 8, 6), lampMat, lampHeads.length);
lampHeads.forEach(([x, y], i) => lamps.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 8.9, -y)));
scene.add(lamps);

// traffic: sedans, SUVs, MPVs, RapidKL buses and motorbikes (a big share of KL traffic); body takes the paint colour, details do not
const GLASS = 0x1f2a36,
  TYRE = 0x16181b,
  CHROME = 0x9ba1a7,
  HEAD = 0xf4f1e6,
  TAIL = 0xb3201a;
const VEH = {
  sedan: {
    len: 4.6,
    v: 1,
    body: () => [rbox(1.8, 0.72, 4.55, 0.22, 0, 0.62, 0), rbox(1.62, 0.62, 2.35, 0.24, 0, 1.22, -0.25)],
    det: () => [
      box(1.66, 0.5, 2.2, 0, 1.24, -0.25, GLASS),
      ...[
        [0.82, 1.45],
        [-0.82, 1.45],
        [0.82, -1.4],
        [-0.82, -1.4],
      ].map(([x, z]) => wheel(0.33, 0.24, x, 0.33, z, TYRE)),
      box(1.5, 0.14, 0.06, 0, 0.72, 2.28, HEAD),
      box(1.5, 0.14, 0.06, 0, 0.78, -2.28, TAIL),
    ],
  },
  suv: {
    len: 4.8,
    v: 1,
    body: () => [rbox(1.9, 0.9, 4.75, 0.25, 0, 0.78, 0), rbox(1.82, 0.72, 3.1, 0.22, 0, 1.55, -0.35)],
    det: () => [
      box(1.86, 0.58, 2.95, 0, 1.58, -0.35, GLASS),
      ...[
        [0.88, 1.55],
        [-0.88, 1.55],
        [0.88, -1.5],
        [-0.88, -1.5],
      ].map(([x, z]) => wheel(0.38, 0.28, x, 0.38, z, TYRE)),
      box(1.6, 0.16, 0.06, 0, 0.9, 2.38, HEAD),
      box(1.6, 0.16, 0.06, 0, 0.98, -2.38, TAIL),
      box(1.6, 0.06, 2.6, 0, 1.96, -0.35, CHROME),
    ],
  },
  mpv: {
    len: 4.9,
    v: 0.95,
    body: () => [rbox(1.85, 1.75, 4.85, 0.3, 0, 1.15, 0)],
    det: () => [
      box(1.9, 0.62, 3.9, 0, 1.55, -0.3, GLASS),
      box(1.6, 0.6, 0.1, 0, 1.45, 2.4, GLASS),
      ...[
        [0.86, 1.6],
        [-0.86, 1.6],
        [0.86, -1.6],
        [-0.86, -1.6],
      ].map(([x, z]) => wheel(0.35, 0.26, x, 0.35, z, TYRE)),
      box(1.55, 0.16, 0.06, 0, 0.8, 2.44, HEAD),
      box(1.55, 0.16, 0.06, 0, 0.9, -2.44, TAIL),
    ],
  },
  bus: {
    len: 12,
    v: 0.75,
    body: () => [rbox(2.5, 2.9, 12, 0.3, 0, 1.85, 0)],
    det: () => [
      box(2.54, 1.15, 10.4, 0, 2.25, -0.4, GLASS),
      box(2.2, 1.3, 0.1, 0, 2.1, 6.0, GLASS),
      box(2.54, 0.5, 11.9, 0, 0.95, 0, 0xc8102e),
      box(2.54, 0.16, 11.9, 0, 3.15, 0, 0xc8102e),
      ...[
        [1.1, 4],
        [-1.1, 4],
        [1.1, -3.6],
        [-1.1, -3.6],
      ].map(([x, z]) => wheel(0.5, 0.34, x, 0.5, z, TYRE)),
      box(2.0, 0.2, 0.06, 0, 0.85, 6.02, HEAD),
      box(2.0, 0.2, 0.06, 0, 0.9, -6.02, TAIL),
    ],
  },
  moto: {
    len: 2,
    v: 1.1,
    body: () => [rbox(0.34, 0.42, 1.25, 0.12, 0, 0.72, 0), rbox(0.42, 0.3, 0.6, 0.1, 0, 0.98, -0.25)],
    det: () => [
      wheel(0.3, 0.1, 0, 0.3, 0.66, TYRE),
      wheel(0.3, 0.1, 0, 0.3, -0.66, TYRE),
      box(0.62, 0.05, 0.05, 0, 1.25, 0.45, CHROME),
      box(0.42, 0.6, 0.3, 0, 1.45, -0.12, 0x2e3742),
      solid(new THREE.SphereGeometry(0.16, 10, 8).translate(0, 1.92, -0.06), 0xe8e6e1),
      box(0.12, 0.45, 0.12, 0.17, 0.95, 0.2, 0x2e3742),
      box(0.12, 0.45, 0.12, -0.17, 0.95, 0.2, 0x2e3742),
      box(0.16, 0.1, 0.05, 0, 0.95, 0.63, HEAD),
      box(0.14, 0.08, 0.05, 0, 0.9, -0.6, TAIL),
    ],
  },
};
const PAINT = [
  '#F4F4F2',
  '#F4F4F2',
  '#C9CCCF',
  '#C9CCCF',
  '#1E2227',
  '#8D9196',
  '#A51E25',
  '#24406E',
  '#E7E2D5',
  '#5B6670',
];
const CARS = [];
{
  const ways = OSM.roads.filter(
    (r) => ['trunk', 'trunk_link', 'primary', 'secondary', 'tertiary'].includes(r.t) && polyLen(r.p) > 60,
  );
  for (const r of ways) {
    const cum = cumulative(r.p),
      L = cum.at(-1),
      z = roadZ(r);
    const dirs = r.oneway ? [1] : [1, -1];
    const lanes = r.t === 'trunk' ? 2 : 1;
    for (const dir of dirs)
      for (let lane = 0; lane < lanes; lane++) {
        const n = Math.max(1, Math.floor(L / ((r.t === 'trunk' ? 26 : 55) * (MOBILE ? 2.2 : 1))));
        for (let i = 0; i < n; i++) {
          const u = rand();
          const type =
            u < 0.3 ? 'moto' : u < 0.62 ? 'sedan' : u < 0.8 ? 'suv' : u < 0.93 || r.t !== 'trunk' ? 'mpv' : 'bus';
          const base = (RW[r.t] / 4) * (r.oneway ? (lane ? 0.5 : -0.5) : 0.6 + lane * 0.9) * (r.oneway ? 1 : dir);
          CARS.push({
            type,
            p: r.p,
            cum,
            L,
            z,
            dir,
            s: rand() * L,
            v: (r.t === 'trunk' ? 12 : 8) * (0.8 + rand() * 0.4) * VEH[type].v,
            off: base + (type === 'moto' ? (rand() - 0.5) * 1.2 : 0),
            i: 0,
          });
        }
      }
  }
}
const FLEET = {};
for (const [type, d] of Object.entries(VEH)) {
  const list = CARS.filter((c) => c.type === type);
  if (!list.length) continue;
  const body = new THREE.InstancedMesh(
    mergeGeometries(d.body().map((g) => solid(g, 0xffffff))),
    dimmable(
      new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 0.55, envMapIntensity: 1.2, vertexColors: true }),
      'vb',
    ),
    list.length,
  );
  const det = new THREE.InstancedMesh(
    mergeGeometries(d.det()),
    dimmable(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.3 }), 'vd'),
    list.length,
  );
  list.forEach((c, i) => {
    c.i = i;
    body.setColorAt(i, new THREE.Color(type === 'bus' ? '#F4F4F2' : PAINT[(i * 7 + type.length) % PAINT.length]));
  });
  scene.add(body, det);
  FLEET[type] = { body, det, list };
}
const head = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1.5, 0.25, 0.15),
  new THREE.MeshBasicMaterial({ color: 0xfff6e0 }),
  CARS.length,
);
const tail = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1.5, 0.25, 0.15),
  new THREE.MeshBasicMaterial({ color: 0xff2a1a }),
  CARS.length,
);
scene.add(head, tail);
export const _m = new THREE.Matrix4(),
  _q = new THREE.Quaternion(),
  _e = new THREE.Euler(),
  _v = new THREE.Vector3(),
  _s = new THREE.Vector3(1, 1, 1),
  _0 = new THREE.Vector3(0, 0, 0);
export function moveCars(dt, night) {
  CARS.forEach((c, k) => {
    c.s = (c.s + c.v * dt * c.dir + c.L) % c.L;
    const q = sampleAt(c.p, c.cum, c.s);
    const x = q.x - q.dy * c.off,
      y = q.y + q.dx * c.off,
      fx = q.dx * c.dir,
      fy = q.dy * c.dir,
      half = VEH[c.type].len / 2,
      F = FLEET[c.type];
    _q.setFromEuler(_e.set(0, Math.atan2(fx, -fy), 0));
    _v.set(x, c.z + 0.14, -y);
    _m.compose(_v, _q, _s);
    F.body.setMatrixAt(c.i, _m);
    F.det.setMatrixAt(c.i, _m);
    const w = c.type === 'moto' ? 0.15 : c.type === 'bus' ? 1.3 : 1;
    _v.set(x + fx * half, c.z + 0.85, -(y + fy * half));
    _m.compose(_v, _q, night ? _s.set(w, 1, 1) : _0);
    head.setMatrixAt(k, _m);
    _v.set(x - fx * half, c.z + 0.9, -(y - fy * half));
    _m.compose(_v, _q, night ? _s.set(w, 1, 1) : _0);
    tail.setMatrixAt(k, _m);
    _s.set(1, 1, 1);
  });
  for (const F of Object.values(FLEET)) F.body.instanceMatrix.needsUpdate = F.det.instanceMatrix.needsUpdate = true;
  head.instanceMatrix.needsUpdate = tail.instanceMatrix.needsUpdate = true;
}
