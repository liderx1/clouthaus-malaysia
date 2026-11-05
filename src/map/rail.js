import * as THREE from 'three';
import { OSM } from './data.js';
import { cumulative, sampleAt } from './geo.js';
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
const mrtLines = OSM.rails.filter((r) => r.t === 'subway' && r.p.length > 20);
{
  const beams = [],
    piers = [],
    rails = [],
    walls = [];
  for (const r of OSM.rails.filter((r) => r.t === 'subway' || r.t === 'platform')) {
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
