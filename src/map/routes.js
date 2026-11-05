import * as THREE from 'three';
import { CONFIG } from './config.js';
import { OSM, PLACES } from './data.js';
import { cumulative, polyLen, sampleAt } from './geo.js';
import { FOOT, ribbon, roadZ } from './ground.js';
import { buildGraph, dijkstra, nearest } from './core/routing.js';
import { U } from './stage.js';
import { _m, _q, _s, _v } from './traffic.js';

/* ---------- route finding on the real road network ---------- */
const WALK = new Set([
  'footway',
  'path',
  'pedestrian',
  'steps',
  'corridor',
  'service',
  'residential',
  'living_street',
  'unclassified',
  'tertiary',
  'tertiary_link',
  'track',
  'cycleway',
]);
const DRIVE = new Set([
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'unclassified',
  'residential',
  'service',
  'living_street',
]);
const graph = (types, oneway) => buildGraph(OSM.roads, types, { oneway, zOf: roadZ, slow: FOOT });
export { dijkstra, nearest };
let GW, GD, GDu;
/** the walking network, built on first use */
export const walkGraph = () => (GW ??= graph(WALK, false));
const ENT = Object.fromEntries(PLACES.entrances.map((e) => [e.id, e]));
export function routePoints(r) {
  if (r.mode === 'walk') {
    GW ??= graph(WALK, false);
    const from = [r.x, r.y, r.z],
      to = ENT[r.to];
    const s = nearest(GW, from[0], from[1]),
      g = nearest(GW, to.x, to.y);
    const path = dijkstra(GW, s, g) || [];
    return [[from[0], from[1], from[2] ?? 0], ...path, [to.x, to.y, to.z ?? 0]];
  }
  GD ??= graph(DRIVE, true);
  GDu ??= graph(DRIVE, false);
  // driving routes start at the north or south end of the main road (site.config.json → drive)
  const jc = OSM.roads.filter((x) => x.name === CONFIG.drive.road && x.t === CONFIG.drive.roadType).flatMap((x) => x.p);
  const north = /north$/.test(r.start);
  const startQ = jc.reduce((a, q) => ((north ? q[1] > a[1] : q[1] < a[1]) ? q : a));
  const to = ENT[r.to];
  const s = `${startQ[0]},${startQ[1]}`,
    g = nearest(GD, to.x, to.y);
  const path =
    (GD.has(s) && dijkstra(GD, s, g)) ||
    dijkstra(GDu, nearest(GDu, startQ[0], startQ[1]), nearest(GDu, to.x, to.y)) ||
    [];
  return [...path, [to.x, to.y, 0]];
}
function resample(pts, step = 1.5) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++)
      out.push([
        a[0] + ((b[0] - a[0]) * k) / n,
        a[1] + ((b[1] - a[1]) * k) / n,
        (a[2] ?? 0) + (((b[2] ?? 0) - (a[2] ?? 0)) * k) / n,
      ]);
  }
  out.push(pts.at(-1));
  return out;
}
// glowing animated route: a bright core with moving chevrons, a soft halo, and beads travelling to the mall
function clean(pts) {
  const out = [];
  for (const q of pts) {
    const a = out.at(-1);
    if (a && Math.hypot(q[0] - a[0], q[1] - a[1]) < 0.8 && Math.abs((q[2] ?? 0) - (a[2] ?? 0)) < 0.5) continue;
    const b = out.at(-2);
    if (b && Math.hypot(q[0] - b[0], q[1] - b[1]) < Math.hypot(a[0] - b[0], a[1] - b[1]) * 0.5) out.pop();
    out.push(q);
  }
  return out;
}
export function routeMesh(pts, color, wide = 1) {
  const p = resample(clean(pts)),
    g = new THREE.Group(),
    col = new THREE.Color(color),
    L = polyLen(p);
  const uStart = { value: U.uTime.value };
  const mat = (w, core) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uCol: { value: col }, uLen: { value: L }, uStart },
      vertexShader:
        'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime; uniform vec3 uCol; uniform float uLen; uniform float uStart; varying vec2 vU;
      void main(){ float across = clamp(1.0 - abs(vU.x - 0.5) * 2.0, 0.0, 1.0);   // clamped: pow() of a tiny negative is NaN, which bloom smears into black blocks
        ${
          core
            ? `float chev = step(0.55, fract((vU.y - abs(vU.x - 0.5) * 4.0) / 7.0 - uTime * 1.4));
          float flick = 0.82 + 0.18 * sin(uTime * 23.0 + vU.y * 0.7) * sin(uTime * 7.0);
          float grow = smoothstep(0.0, 6.0, (uTime - uStart) * max(uLen / 1.6, 160.0) - vU.y);
          gl_FragColor = vec4(mix(uCol, vec3(1.0), chev * 0.55) * flick, (0.55 + 0.45 * chev) * smoothstep(0.0, 0.25, across) * grow);`
            : 'float a = pow(across, 1.6) * (0.38 + 0.12 * sin(uTime * 4.0)) * smoothstep(0.0, 6.0, (uTime - uStart) * max(uLen / 1.6, 160.0) - vU.y); gl_FragColor = vec4(uCol, a);'
        } }`,
    });
  const lift = p.map((q) => [q[0], q[1], (q[2] ?? 0) + 1.4]);
  const edge = new THREE.Mesh(
    ribbon(
      lift.map((q) => [q[0], q[1], q[2] - 0.03]),
      6.4 * wide,
      0,
    ),
    new THREE.MeshBasicMaterial({
      color: col.clone().multiplyScalar(0.45),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  g.add(
    new THREE.Mesh(ribbon(lift, 16 * wide, 0), mat(16, false)),
    edge,
    new THREE.Mesh(
      ribbon(
        lift.map((q) => [q[0], q[1], q[2] + 0.05]),
        4.6 * wide,
        0,
      ),
      mat(4.6, true),
    ),
  );
  const beads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1.3, 12, 8),
    new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(1, 1, 1), 0.5) }),
    14,
  );
  g.add(beads);
  const cum = cumulative(p);
  g.userData.tick = (time) => {
    const shown = Math.min(L, (time - uStart.value) * Math.max(L / 1.6, 160));
    for (let i = 0; i < 14; i++) {
      const s = (time * 38 + (i * L) / 14) % Math.max(1, shown);
      const q = sampleAt(p, cum, s);
      const sc = 0.9 + 0.5 * Math.sin(time * 6 + i);
      _m.compose(_v.set(q.x, q.z + 2.6, -q.y), _q.identity(), _s.clone().setScalar(sc));
      beads.setMatrixAt(i, _m);
    }
    beads.instanceMatrix.needsUpdate = true;
  };
  g.userData.start = performance.now();
  return { g, p, L };
}
export const ROUTE_COL = { mrt: '#0A6CFF', bus: '#E8890B', carN: '#F04A12', carS: '#F04A12' };
