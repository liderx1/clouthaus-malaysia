import * as THREE from 'three';
import { OSM, ring } from './data.js';
import { MOBILE } from './env.js';
import { CELL, area, cumulative, inPoly, key, onBuilding, rand, sampleAt } from './geo.js';
import { FOOT, RW, tex } from './ground.js';
import { MR } from './mall.js';
import { Tree } from './vendor/ez-tree/tree.js';
import { camera } from './stage.js';
import { seeded } from './core/geometry.js';

/** tree shapes and leaf textures: seeded, so every visit (and every screenshot) draws the same trees */
const leafRand = seeded(20261104);
import { dimmable, scene } from './stage.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- trees ---------- */
const treePts = [];
{
  const roadSegs = new Map();
  for (const r of OSM.roads) {
    if (FOOT.has(r.t) || r.bridge) continue;
    const w = RW[r.t] ?? 5;
    for (let i = 1; i < r.p.length; i++) {
      const a = r.p[i - 1],
        b = r.p[i];
      const k = key((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      (roadSegs.get(k) || roadSegs.set(k, []).get(k)).push([a, b, w]);
    }
  }
  const nearRoad = (x, y) => {
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const [a, b, w] of roadSegs.get(`${Math.floor(x / CELL) + dx},${Math.floor(y / CELL) + dy}`) || []) {
          const ex = b[0] - a[0],
            ey = b[1] - a[1],
            L = ex * ex + ey * ey || 1,
            k = Math.max(0, Math.min(1, ((x - a[0]) * ex + (y - a[1]) * ey) / L));
          if (Math.hypot(x - a[0] - ex * k, y - a[1] - ey * k) < w / 2 + 1.2) return true;
        }
    return false;
  };
  const ok = (x, y) => Math.hypot(x, y) < 1100 && !onBuilding(x, y) && !nearRoad(x, y) && !inPoly(x, y, MR);
  const DENS = Object.fromEntries(
    Object.entries({
      wood: 55,
      park: 110,
      recreation_ground: 260,
      garden: 140,
      grass: 220,
      scrub: 120,
      residential: 900,
      cemetery: 300,
    }).map(([k, v]) => [k, v * (MOBILE ? 2.5 : 1)]),
  );
  for (const a of OSM.areas) {
    const d = DENS[a.t];
    if (!d) continue;
    const r = ring(a.p);
    const A = Math.abs(area(r));
    const n = Math.min(a.t === 'residential' ? 160 : 700, Math.round(A / d));
    const xs = r.map((q) => q[0]),
      ys = r.map((q) => q[1]);
    let tries = 0,
      got = 0;
    while (got < n && tries++ < n * 6) {
      const x = Math.min(...xs) + rand() * (Math.max(...xs) - Math.min(...xs)),
        y = Math.min(...ys) + rand() * (Math.max(...ys) - Math.min(...ys));
      if (inPoly(x, y, r) && ok(x, y)) {
        treePts.push([x, y, a.t === 'wood' ? 1.15 : 1]);
        got++;
      }
    }
  }
  for (const r of OSM.roads) {
    if (!['trunk', 'primary', 'secondary', 'tertiary', 'residential'].includes(r.t) || r.bridge) continue;
    const w = RW[r.t],
      cum = cumulative(r.p),
      step = r.t === 'residential' ? 22 : 13;
    for (let s = 6; s < cum.at(-1); s += step) {
      const q = sampleAt(r.p, cum, s);
      for (const sgn of [1, -1]) {
        if (r.t === 'residential' && rand() < 0.5) continue;
        const x = q.x - q.dy * (w / 2 + 2.6) * sgn,
          y = q.y + q.dx * (w / 2 + 2.6) * sgn;
        if (ok(x, y)) treePts.push([x, y, 0.85, r.t === 'trunk' || r.t === 'primary' ? 1 : 0]);
      }
    }
  }
}
// canopy = leaf cards (alpha leaf texture drawn here) around a dense core; palms with pinnate fronds line the main roads
function leafTexture(palm) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const R = (a, b) => a + leafRand() * (b - a);
  if (palm) {
    x.translate(128, 0);
    for (let y = 6; y < 250; y += 5)
      for (const sg of [-1, 1]) {
        const len = 60 + 50 * Math.sin((y / 256) * Math.PI);
        x.strokeStyle = `hsl(${R(90, 110)},${R(40, 55)}%,${R(24, 36)}%)`;
        x.lineWidth = 3.2;
        x.beginPath();
        x.moveTo(0, y);
        x.quadraticCurveTo(sg * len * 0.5, y + 6, sg * len, y + 22);
        x.stroke();
      }
    x.strokeStyle = '#5c6b3a';
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(0, 256);
    x.stroke();
  } else
    for (let i = 0; i < 260; i++) {
      x.save();
      x.translate(R(14, 242), R(14, 242));
      x.rotate(R(0, 6.28));
      x.fillStyle = `hsl(${R(88, 118)},${R(32, 52)}%,${R(20, 42)}%)`;
      x.beginPath();
      x.ellipse(0, 0, R(9, 15), R(4, 7), 0, 0, 6.28);
      x.fill();
      x.restore();
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/* ---------- street-level close-ups: full EZ-Tree models ----------
   The city has thousands of trees, drawn as light, dense card trees (~200 triangles each), which also read best from the
   usual overhead views. Only when the camera comes down to street level (under STREET_H) are the trees around it swapped
   for procedural EZ-Tree models (4 variants, ~6–8k triangles each) with real branches; their cards are hidden
   meanwhile, and everything returns to cards as soon as the camera rises again. */
const EZ_MAX = MOBILE ? 100 : 200; // how many trees get the full model
const EZ_RADIUS = 160; // and only within this distance (m)
const STREET_H = 70; // camera height (m) under which the swap is on
const EZ_HEIGHT = 10.5; // metres at instance scale 1, matching the card trees
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
export const nearTrees = {
  /** @type {THREE.InstancedMesh[][]} [branches, leaves] per variant */
  variants: [],
  /** @type {THREE.Matrix4[]} each tree's own transform */
  mats: [],
  /** @type {number[][]} tree positions [x, z] in scene space */
  pos: [],
  /** @type {THREE.InstancedMesh[]} the card meshes */
  cards: [],
  shown: new Set(),
  /** @type {number[]} triangles per variant (shown in ?debug) */
  tris: [],
  last: new THREE.Vector3(1e9, 0, 0),
  at: 0,
  setup(trees, cards) {
    this.cards = cards;
    const m = new THREE.Matrix4();
    trees.forEach((_, i) => {
      cards[0].getMatrixAt(i, m);
      this.mats.push(m.clone());
      this.pos.push([m.elements[12], m.elements[14]]);
    });
    const leafMat = dimmable(
      new THREE.MeshStandardMaterial({
        map: tex('eztree_leaf_oak', 1, true, 'webp'),
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        roughness: 0.85,
      }),
      'leaf',
    );
    const ashMat = dimmable(
      new THREE.MeshStandardMaterial({
        map: tex('eztree_leaf_ash', 1, true, 'webp'),
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        roughness: 0.85,
      }),
      'leaf',
    );
    const barkMat = dimmable(
      new THREE.MeshStandardMaterial({
        color: 0xb8a998,
        map: tex('eztree_bark_col', 1, true, 'webp'),
        normalMap: tex('eztree_bark_nor', 1, false, 'webp'),
        roughness: 0.95,
      }),
      'bark',
    );
    // dense, broad canopies like Malaysian street trees (rain tree, angsana): more and bigger leaves than the presets,
    // branches meshed lighter (every 2nd ring, fewer sides) since leaves hide most of them
    const detail = { sectionStride: 3, segmentFactor: 0.5, leafStride: 1, leafScale: 1, billboard: 'single' };
    for (const [preset, seed] of /** @type {[string, number][]} */ ([
      ['Oak Medium', 101],
      ['Ash Medium', 202],
      ['Oak Medium', 303],
      ['Ash Medium', 404],
    ])) {
      const t = new Tree();
      t.loadPreset(preset);
      t.options.seed = seed;
      // two branch levels instead of three (most of the triangles), leaves as big clusters so the canopy reads full
      t.options.branch.levels = 2;
      t.options.leaves.count = Math.round(t.options.leaves.count * 0.8);
      t.options.leaves.size *= 6;
      t.options.leaves.start = Math.min(t.options.leaves.start, 0.05);
      const g = t.createGeometry(detail);
      const attr = (/** @type {THREE.BufferGeometry} */ geo) =>
        /** @type {THREE.BufferAttribute} */ (geo.attributes.position);
      const box = new THREE.Box3().setFromBufferAttribute(attr(g.branches));
      box.union(new THREE.Box3().setFromBufferAttribute(attr(g.leaves)));
      const k = EZ_HEIGHT / (box.max.y - box.min.y);
      for (const geo of [g.branches, g.leaves]) geo.translate(0, -box.min.y, 0).scale(k, k, k);
      const b = new THREE.InstancedMesh(g.branches, barkMat, EZ_MAX),
        l = new THREE.InstancedMesh(g.leaves, preset.startsWith('Ash') ? ashMat : leafMat, EZ_MAX);
      b.count = l.count = 0;
      const tris = (/** @type {THREE.BufferGeometry} */ geo) => (geo.index ? geo.index.count : attr(geo).count) / 3;
      this.tris.push(tris(g.branches) + tris(g.leaves));
      b.frustumCulled = l.frustumCulled = false; // instances spread over the city; the bounds are of one tree
      l.receiveShadow = true;
      scene.add(b, l);
      this.variants.push([b, l]);
    }
  },
  /** called by the frame loop; re-picks the nearest trees when the camera has moved */
  update(now) {
    if (now - this.at < 250 || camera.position.distanceToSquared(this.last) < 16) return;
    this.at = now;
    this.last.copy(camera.position);
    const cx = camera.position.x,
      cz = camera.position.z,
      r2 = EZ_RADIUS * EZ_RADIUS;
    const near = [];
    const street = camera.position.y < STREET_H;
    for (let i = 0; street && i < this.pos.length; i++) {
      const dx = this.pos[i][0] - cx,
        dz = this.pos[i][1] - cz,
        d2 = dx * dx + dz * dz;
      if (d2 < r2) near.push([d2, i]);
    }
    near.sort((a, b) => a[0] - b[0]);
    const pick = new Set(near.slice(0, EZ_MAX).map(([, i]) => i));
    // cards back for trees that left the set, hidden for those that joined
    for (const i of this.shown) if (!pick.has(i)) for (const c of this.cards) c.setMatrixAt(i, this.mats[i]);
    for (const i of pick) if (!this.shown.has(i)) for (const c of this.cards) c.setMatrixAt(i, ZERO);
    this.shown = pick;
    for (const c of this.cards) c.instanceMatrix.needsUpdate = true;
    const counts = this.variants.map(() => 0);
    for (const i of pick) {
      const v = i % this.variants.length,
        [b, l] = this.variants[v];
      b.setMatrixAt(counts[v], this.mats[i]);
      l.setMatrixAt(counts[v], this.mats[i]);
      counts[v]++;
    }
    this.variants.forEach(([b, l], v) => {
      b.count = l.count = counts[v];
      b.instanceMatrix.needsUpdate = l.instanceMatrix.needsUpdate = true;
    });
  },
};

{
  const palms = treePts.filter((p) => p[3]),
    trees = treePts.filter((p) => !p[3]);
  const m = new THREE.Matrix4(),
    q = new THREE.Quaternion(),
    sc = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  // broadleaf (rain tree / angsana style): 18 cards + core, normals pushed outward for soft rounded shading
  const cards = [];
  for (let i = 0; i < 18; i++) {
    const g = new THREE.PlaneGeometry(3.4, 3.4);
    const th = leafRand() * 6.28,
      ph = Math.acos(leafRand() * 1.6 - 0.6);
    g.rotateX(leafRand() * 3.14)
      .rotateY(leafRand() * 6.28)
      .translate(Math.cos(th) * Math.sin(ph) * 2.5, 5.9 + Math.cos(ph) * 1.4, Math.sin(th) * Math.sin(ph) * 2.5);
    cards.push(g);
  }
  const crown = mergeGeometries(cards);
  {
    const p = crown.attributes.position,
      n = crown.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i) - 5.6, p.getZ(i)).normalize();
      n.setXYZ(i, v.x, v.y, v.z);
    }
  }
  const core = new THREE.IcosahedronGeometry(2.3, 1).scale(1.1, 0.72, 1.1).translate(0, 5.8, 0);
  const trunk = mergeGeometries([
    new THREE.CylinderGeometry(0.2, 0.36, 5.2, 8).translate(0, 2.6, 0),
    new THREE.CylinderGeometry(0.09, 0.15, 2.4, 6).rotateZ(0.7).translate(0.75, 4.6, 0),
    new THREE.CylinderGeometry(0.09, 0.15, 2.2, 6).rotateX(-0.7).translate(0, 4.5, 0.7),
  ]);
  const leafMat = dimmable(
    new THREE.MeshStandardMaterial({
      map: leafTexture(false),
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.85,
    }),
    'leaf',
  );
  const coreMat = dimmable(new THREE.MeshStandardMaterial({ color: 0x3e6530, roughness: 0.95 }), 'core');
  const barkMat = dimmable(
    new THREE.MeshStandardMaterial({
      color: 0x9a8c7c,
      map: tex('bark_brown_02_diff', 1.5),
      normalMap: tex('bark_brown_02_nor', 1.5, false),
      roughness: 0.95,
    }),
    'bark',
  );
  const L1 = new THREE.InstancedMesh(crown, leafMat, trees.length),
    L2 = new THREE.InstancedMesh(core, coreMat, trees.length),
    T1 = new THREE.InstancedMesh(trunk, barkMat, trees.length);
  const greens = ['#9DBB7E', '#B4C98F', '#8FAF72', '#C4D49B', '#A6BF83'];
  trees.forEach(([x, y, k], i) => {
    const s = (0.75 + rand() * 0.6) * k;
    q.setFromAxisAngle(up, rand() * 6.28);
    sc.set(s, s * (0.85 + rand() * 0.3), s);
    m.compose(new THREE.Vector3(x, 0, -y), q, sc);
    L1.setMatrixAt(i, m);
    L2.setMatrixAt(i, m);
    T1.setMatrixAt(i, m);
    L1.setColorAt(i, new THREE.Color(greens[i % greens.length]));
    L2.setColorAt(i, new THREE.Color(greens[(i + 2) % greens.length]).multiplyScalar(0.55));
  });
  L2.castShadow = T1.castShadow = !MOBILE;
  L1.receiveShadow = true;
  scene.add(L1, L2, T1);
  nearTrees.setup(trees, [L1, L2, T1]);
  // palms
  const fronds = [];
  for (let i = 0; i < 11; i++) {
    const g = new THREE.PlaneGeometry(1.6, 4.6, 1, 8);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const t = (p.getY(k) + 2.3) / 4.6;
      p.setY(k, t * 4.2);
      p.setZ(k, -t * t * 2.2);
    }
    g.rotateX(-Math.PI / 2 + 0.55)
      .rotateY((i / 11) * 6.28 + leafRand() * 0.3)
      .translate(0, 9.2, 0);
    g.computeVertexNormals();
    fronds.push(g);
  }
  const frond = mergeGeometries(fronds),
    ptrunk = new THREE.CylinderGeometry(0.2, 0.28, 9.4, 8, 6).translate(0, 4.7, 0);
  {
    const p = ptrunk.attributes.position;
    for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) + Math.pow(p.getY(k) / 9.4, 2) * 0.5);
  }
  const P1 = new THREE.InstancedMesh(
    frond,
    dimmable(
      new THREE.MeshStandardMaterial({
        map: leafTexture(true),
        alphaTest: 0.4,
        side: THREE.DoubleSide,
        roughness: 0.8,
      }),
      'frond',
    ),
    palms.length,
  );
  const P2 = new THREE.InstancedMesh(
    ptrunk,
    dimmable(
      new THREE.MeshStandardMaterial({ color: 0xb2a794, map: tex('bark_brown_02_diff', 0.8), roughness: 0.9 }),
      'ptrunk',
    ),
    palms.length,
  );
  palms.forEach(([x, y], i) => {
    const s = 0.85 + rand() * 0.3;
    q.setFromAxisAngle(up, rand() * 6.28);
    sc.set(s, s, s);
    m.compose(new THREE.Vector3(x, 0, -y), q, sc);
    P1.setMatrixAt(i, m);
    P2.setMatrixAt(i, m);
  });
  P1.castShadow = P2.castShadow = true;
  scene.add(P1, P2);
}
