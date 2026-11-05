import * as THREE from 'three';
import { OSM } from './data.js';
import { chainLines } from './core/geometry.js';
import { cumulative, polyLen, sampleAt } from './geo.js';
import { ribbon } from './ground.js';
import { dimmable, scene } from './stage.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- shared helpers for detailed props ---------- */
export const solid = (g, hex) => {
  g = g.index ? g.toNonIndexed() : g;
  g.deleteAttribute('uv');
  const c = new THREE.Color(hex),
    n = g.attributes.position.count,
    a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
};
export const box = (w, h, l, x, y, z, hex) => solid(new THREE.BoxGeometry(w, h, l).translate(x, y, z), hex);
export const rbox = (w, h, l, r, x, y, z, hex) => solid(new RoundedBoxGeometry(w, h, l, 2, r).translate(x, y, z), hex);
export const wheel = (r, w, x, y, z, hex = 0x1a1c1f) =>
  solid(new THREE.CylinderGeometry(r, r, w, 14).rotateZ(Math.PI / 2).translate(x, y, z), hex);
const offsetLine = (p, off) =>
  p.map((q, i) => {
    const a = p[Math.max(0, i - 1)],
      b = p[Math.min(p.length - 1, i + 1)];
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      L = Math.hypot(dx, dy) || 1;
    return [q[0] - (dy / L) * off, q[1] + (dx / L) * off, q[2]];
  });

/* ---------- MRT viaduct (double track), platforms, two Kajang Line trains ---------- */
export const RAIL_Z = 13;
// elevated metro only: lines in tunnels (OSM tunnel=yes or a negative layer) are drawn as a coloured trace on the ground
const mrtLines = OSM.rails.filter((r) => r.t === 'subway' && !r.tunnel && r.p.length > 20);
viaduct: {
  const beams = [],
    piers = [],
    rails = [],
    walls = [];
  for (const r of OSM.rails.filter((r) => (r.t === 'subway' || r.t === 'platform') && !r.tunnel)) {
    const plat = r.t === 'platform',
      z = plat ? RAIL_Z - 0.6 : RAIL_Z,
      W = plat ? 6 : 9.6;
    const p = r.p.map((q) => [q[0], q[1], z]);
    beams.push(
      ribbon(p, W, 0, false),
      ribbon(
        p.map((q) => [q[0], q[1], q[2] - 2.2]),
        W - 2.4,
        0,
        false,
      ),
    );
    if (!plat) {
      for (const sg of [1, -1]) {
        walls.push(
          ribbon(
            offsetLine(p, sg * 4.6).map((q) => [q[0], q[1], q[2] + 0.55]),
            0.35,
            0,
            false,
          ),
        );
      }
      for (const t of [-2.1, 2.1])
        for (const d of [-0.72, 0.72])
          rails.push(
            ribbon(
              offsetLine(p, t + d).map((q) => [q[0], q[1], q[2] + 0.25]),
              0.12,
              0,
              false,
            ),
          );
      const cum = cumulative(r.p);
      for (let s = 0; s < cum.at(-1); s += 30) {
        const q = sampleAt(r.p, cum, s),
          a = Math.atan2(q.dy, q.dx);
        piers.push(
          new THREE.CylinderGeometry(1.3, 1.5, z - 2.2, 12).translate(0, (z - 2.2) / 2, 0).translate(q.x, 0, -q.y),
        );
        piers.push(new THREE.BoxGeometry(7.6, 1.4, 2.4).rotateY(a).translate(q.x, z - 2.6, -q.y));
      }
    }
  }
  if (!beams.length) break viaduct; // no elevated metro in the area (it may all run in tunnels)
  const concrete = dimmable(
    new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.75, side: THREE.DoubleSide }),
    'via',
  );
  const m1 = new THREE.Mesh(mergeGeometries(beams), concrete);
  m1.castShadow = m1.receiveShadow = true;
  scene.add(m1);
  const m2 = new THREE.Mesh(
    mergeGeometries(
      piers.map((g) => {
        g.deleteAttribute('uv');
        return g.index ? g.toNonIndexed() : g;
      }),
    ),
    concrete.clone(),
  );
  m2.castShadow = true;
  scene.add(m2);
  const wl = walls.map((g) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 2) p.setY(i, p.getY(i) + 1.1);
    g.computeVertexNormals();
    return g;
  });
  scene.add(
    new THREE.Mesh(
      mergeGeometries(wl),
      dimmable(new THREE.MeshStandardMaterial({ color: 0xe6e3dc, roughness: 0.7, side: THREE.DoubleSide }), 'parapet'),
    ),
  );
  scene.add(
    new THREE.Mesh(
      mergeGeometries(rails),
      dimmable(new THREE.MeshStandardMaterial({ color: 0x8b9096, roughness: 0.3, metalness: 0.9 }), 'rail'),
    ),
  );
}
// Kajang Line (Siemens Inspiro): silver body, dark window band, green stripe, black cab ends; 4 cars
export const TRAIN = (() => {
  const line = mrtLines[0];
  if (!line) return null;
  const carGeo = (cab) => {
    const parts = [
      rbox(2.95, 3.3, 21.4, 0.35, 0, 2.35, 0, 0xd6dadd),
      box(2.6, 0.7, 18, 0, 0.55, 0, 0x2a2d31),
      box(2.7, 0.9, 3, 0, 0.45, 7, 0x1b1d20),
      box(2.7, 0.9, 3, 0, 0.45, -7, 0x1b1d20),
      box(3.0, 0.3, 20.6, 0, 1.55, 0, 0x00a651),
      box(2.4, 0.25, 19, 0, 4.05, 0, 0xb9bec2),
    ];
    for (const z of [-7.6, -2.5, 2.5, 7.6]) parts.push(box(3.02, 2.3, 1.45, 0, 2.55, z, 0xc3c8cc));
    if (cab)
      parts.push(rbox(2.97, 2.9, 0.9, 0.3, 0, 2.5, 10.4, 0x121418), box(3.0, 0.35, 0.5, 0, 1.15, 10.7, 0x00a651));
    return mergeGeometries(parts);
  };
  const winGeo = mergeGeometries(
    [0, 1]
      .map((k) => box(3.0, 0.95, 4.2, 0, 3.0, k ? 5 : -5, 0xffffff))
      .concat([box(3.0, 0.95, 2.8, 0, 3.0, 0, 0xffffff)]),
  );
  const body = dimmable(
    new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.55, roughness: 0.32 }),
    'train',
  );
  const win = new THREE.MeshStandardMaterial({
    color: 0x1a2533,
    emissive: 0xffe2b0,
    emissiveIntensity: 0,
    roughness: 0.15,
    metalness: 0.4,
  });
  const g0 = carGeo(false),
    gc = carGeo(true);
  const trains = [2.1, -2.1].map((off, k) => {
    const p = offsetLine(
        line.p.map((q) => [q[0], q[1], 0]),
        off,
      ),
      cum = cumulative(p);
    const cars = [0, 1, 2, 3].map((i) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(i === 0 || i === 3 ? gc : g0, body);
      if (i === 3) m.rotation.y = Math.PI;
      g.add(m, new THREE.Mesh(winGeo, win));
      scene.add(g);
      return g;
    });
    return { cars, p, cum, L: cum.at(-1), dir: k ? -1 : 1, phase: k * 0.5 };
  });
  return { trains, win };
})();

/* ---------- underground lines: a coloured trace on the ground, so the network still reads from above ---------- */
// official line colours in Kuala Lumpur (Kelana Jaya red, Putrajaya yellow, Kajang green); others take the OSM colour or grey
/** @type {[RegExp, number][]} */
const LINE_COL = [
  [/kelana jaya/i, 0xd50032],
  [/putrajaya/i, 0xf5c400],
  [/kajang/i, 0x0a8a3a],
  [/ampang|sri petaling/i, 0xe57200],
  [/monorail|monorel/i, 0x7dba00],
];
export const lineColour = (r) =>
  LINE_COL.find(([re]) => re.test(r.name ?? ''))?.[1] ?? (r.colour ? new THREE.Color(r.colour).getHex() : 0x8a8f95);
{
  const byCol = new Map();
  for (const r of OSM.rails.filter((r) => r.tunnel && r.t !== 'platform' && r.p.length > 1)) {
    const c = lineColour(r);
    (byCol.get(c) || byCol.set(c, []).get(c)).push(
      ribbon(
        r.p.map((q) => [q[0], q[1], 0.22]),
        2.4,
        0,
        false,
      ),
    );
  }
  for (const [c, list] of byCol) {
    const m = new THREE.Mesh(
      mergeGeometries(list),
      dimmable(
        new THREE.MeshBasicMaterial({
          color: c,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4,
        }),
        'tunnel',
      ),
    );
    m.renderOrder = 1;
    scene.add(m);
  }
}

/* ---------- monorail: a concrete guideway beam per track on single piers, with 4-car trains ---------- */
export const MONO_Z = 11;
const monoWays = OSM.rails.filter((r) => r.t === 'monorail' && !r.tunnel);
/** the two tracks as continuous lines (OSM splits them at every bridge) */
const monoTracks = chainLines(monoWays.map((r) => r.p))
  .filter((p) => polyLen(p) > 200)
  .slice(0, 2);
if (monoWays.length) {
  const beams = [],
    piers = [];
  for (const r of monoWays) {
    const p = r.p.map((q) => [q[0], q[1], MONO_Z]);
    beams.push(
      ribbon(p, 0.9, 0, false),
      ribbon(
        p.map((q) => [q[0], q[1], q[2] - 1.6]),
        0.9,
        0,
        false,
      ),
    );
    for (const sg of [1, -1]) {
      const side = ribbon(offsetLine(p, sg * 0.45), 0.02, 0, false),
        pos = side.attributes.position;
      for (let i = 0; i < pos.count; i += 2) pos.setY(i, pos.getY(i) - 1.6);
      side.computeVertexNormals();
      beams.push(side);
    }
    const cum = cumulative(r.p);
    for (let s = 6; s < cum.at(-1); s += 28) {
      const q = sampleAt(r.p, cum, s);
      piers.push(new THREE.CylinderGeometry(0.55, 0.7, MONO_Z - 1.6, 10).translate(q.x, (MONO_Z - 1.6) / 2, -q.y));
    }
  }
  const concrete = dimmable(
    new THREE.MeshStandardMaterial({ color: 0xd4d1ca, roughness: 0.7, side: THREE.DoubleSide }),
    'mono',
  );
  const m1 = new THREE.Mesh(mergeGeometries(beams.map((g) => (g.deleteAttribute('uv'), g))), concrete);
  const m2 = new THREE.Mesh(
    mergeGeometries(piers.map((g) => (g.deleteAttribute('uv'), g.index ? g.toNonIndexed() : g))),
    concrete,
  );
  m1.castShadow = m2.castShadow = true;
  scene.add(m1, m2);
}
// KL Monorail style: white body straddling the beam, dark window band, green stripe, rounded cab ends
export const MONO = (() => {
  if (!monoTracks.length) return null;
  const car = (cab) =>
    mergeGeometries([
      rbox(2.8, 3.0, 11.6, 0.5, 0, 1.0, 0, 0xf1f2f0),
      box(2.84, 0.9, 10.2, 0, 1.55, 0, 0x1d2731),
      box(2.86, 0.22, 11.2, 0, 0.6, 0, 0x7dba00),
      box(1.4, 1.4, 11, 0, -1.0, 0, 0x6f757b),
      ...(cab ? [rbox(2.6, 1.6, 1.2, 0.5, 0, 1.4, 5.8, 0x1d2731)] : []),
    ]);
  const body = dimmable(
    new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.4, roughness: 0.35 }),
    'mtrain',
  );
  const win = new THREE.MeshStandardMaterial({
    color: 0x1a2533,
    emissive: 0xffe2b0,
    emissiveIntensity: 0,
    roughness: 0.2,
  });
  const winGeo = box(2.88, 0.7, 9.6, 0, 1.55, 0, 0xffffff);
  const gc = car(true),
    g0 = car(false);
  const trains = monoTracks.map((p, k) => {
    const cum = cumulative(p);
    const cars = [0, 1, 2, 3].map((i) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(i === 0 || i === 3 ? gc : g0, body);
      if (i === 3) m.rotation.y = Math.PI;
      g.add(m, new THREE.Mesh(winGeo, win));
      g.castShadow = true;
      scene.add(g);
      return g;
    });
    return { cars, p, cum, L: cum.at(-1), dir: k ? -1 : 1, phase: 0.3 + k * 0.4 };
  });
  return { trains, win };
})();
