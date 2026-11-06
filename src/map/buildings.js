import * as THREE from 'three';
import { CONFIG } from './config.js';
import { MALL, MALL_H, MALL_R, OSM, ring } from './data.js';
import { area, hash, hexCol, inPoly } from './geo.js';
import { tex } from './ground.js';
import { U, dimmable, scene } from './stage.js';

/* ---------- buildings (walls with window bands; lights at night) ---------- */
const BCOL = {
  house: [
    ['#EDE6D6', '#F2EEE6', '#E7DCC6', '#EFE4D2'],
    ['#A5523A', '#B4644A', '#8C4734', '#9A5A45'],
  ],
  tall: [
    ['#DCE0E3', '#E7E6E1', '#D3D8DC'],
    ['#A3A9AE', '#B0B4B6'],
  ],
  glass: [
    ['#8EA4B6', '#9CB0BF', '#7F95A8'],
    ['#7E878F', '#8A9298'],
  ],
  shop: [
    ['#D8D3C9', '#CFD2D4', '#E2DCD0'],
    ['#A9ADB1', '#B6B2AA'],
  ],
  industrial: [
    ['#C7C4BC', '#BFC3C5'],
    ['#9FA4A8', '#A8A49B'],
  ],
  finned: [['#1B2638'], ['#7E868E']], // dark glass, white fins (Tower A, INNSiDE)
  resi: [['#E2E3E0', '#D9DCDD', '#E8E6E1'], ['#9DA3A8']], // white residential towers with balconies
};
// facades seen on Street View for the towers around the mall
const STYLE = {
  'Tower A': 'finned',
  'INNSiDE by Meliá': 'finned',
  'Tower J': 'resi',
  'Tower H': 'resi',
  'Tower E': 'resi',
};
const RESI = OSM.areas.filter((a) => a.t === 'residential').map((a) => ring(a.p));
// a footprint counts as "on the podium" when its centre or any corner is inside, or within 1.5 m of, the mall outline
function nearEdge(x, y) {
  for (let i = 0; i < MALL_R.length; i++) {
    const a = MALL_R[i],
      b = MALL_R[(i + 1) % MALL_R.length],
      ex = b[0] - a[0],
      ey = b[1] - a[1],
      L = ex * ex + ey * ey || 1;
    const k = Math.max(0, Math.min(1, ((x - a[0]) * ex + (y - a[1]) * ey) / L));
    if (Math.hypot(x - a[0] - ex * k, y - a[1] - ey * k) < 1.5) return true;
  }
  return false;
}
function onMall(r) {
  const c = r.reduce((a, q) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0]);
  return inPoly(c[0], c[1], MALL_R) || r.some((q) => inPoly(q[0], q[1], MALL_R) || nearEdge(q[0], q[1]));
}
export function bInfo(b) {
  const r = ring(b.p),
    A = Math.abs(area(r));
  let typ = b.type;
  if (typ === 'yes' && !b.h && !b.name && A < 8000 && RESI.some((p) => inPoly(r[0][0], r[0][1], p))) typ = 'terrace'; // Cheras link houses
  let h = b.h;
  const seed = hash(b.id || A);
  if (!h)
    h =
      {
        house: 7,
        terrace: 7.4,
        detached: 8,
        semidetached_house: 8,
        bungalow: 4.5,
        garage: 3,
        roof: 4,
        shed: 3,
        kiosk: 3.5,
        apartments: 36,
        hotel: 30,
        commercial: 13,
        retail: 8.5,
        office: 24,
        school: 13,
        mosque: 12,
        church: 12,
        temple: 9,
        industrial: 9,
        warehouse: 9,
      }[typ] ?? (A < 110 ? 6.6 : A < 260 ? 7.6 : A < 900 ? 10 : A < 3000 ? 13 : 16);
  if (!b.exact) h *= 0.92 + seed * 0.16; // the main building keeps its real height
  const tallish = h > 26,
    house =
      !tallish &&
      (['house', 'terrace', 'detached', 'semidetached_house', 'residential', 'bungalow'].includes(typ) ||
        (typ === 'yes' && A < 260));
  const kind =
    STYLE[b.name] ||
    (b.part && h > 150 ? 'resi' : null) ||
    (typ === 'apartments' && h > 26 ? 'resi' : null) ||
    (b.part && h > 40
      ? 'glass'
      : tallish
        ? seed > 0.55
          ? 'glass'
          : 'tall'
        : house
          ? 'house'
          : ['industrial', 'warehouse'].includes(typ)
            ? 'industrial'
            : 'shop');
  // towers that stand on the mall podium start at its roof (their footprints overlap the podium walls)
  const base = b !== MALL && h > MALL_H + 4 && onMall(r) ? Math.max(b.min || 0, MALL_H + 0.05) : b.min || 0;
  return { r, h, base, seed, kind };
}
// pitched (hip) roof over the footprint's oriented bounding box; returns the new vertex count, or -v-1 when the footprint is not box-like
const ROOFG = { pos: [], nor: [], col: [], uv: [], idx: [], v: 0 };
function hipRoof(r, h, rc) {
  const G = ROOFG;
  let best = null;
  for (let i = 0; i < r.length; i++) {
    const [x1, y1] = r[i],
      [x2, y2] = r[(i + 1) % r.length];
    const a = Math.atan2(y2 - y1, x2 - x1),
      c = Math.cos(a),
      s = Math.sin(a);
    let u0 = Infinity,
      u1 = -Infinity,
      w0 = Infinity,
      w1 = -Infinity;
    for (const [x, y] of r) {
      const u = x * c + y * s,
        w = -x * s + y * c;
      u0 = Math.min(u0, u);
      u1 = Math.max(u1, u);
      w0 = Math.min(w0, w);
      w1 = Math.max(w1, w);
    }
    const A = (u1 - u0) * (w1 - w0);
    if (!best || A < best.A) best = { A, c, s, u0: u0 - 0.35, u1: u1 + 0.35, w0: w0 - 0.35, w1: w1 + 0.35 };
  }
  if (r.length > 12 || Math.abs(area(r)) / best.A < 0.8) return false;
  let { c, s, u0, u1, w0, w1 } = best;
  const L = u1 - u0,
    W = w1 - w0,
    rise = Math.min(2.8, Math.min(L, W) * 0.3);
  const P = (u, w, z) => [u * c - w * s, u * s + w * c, z];
  let A_, B_, C_, D_, R1, R2;
  if (L >= W) {
    const m = (w0 + w1) / 2;
    A_ = P(u0, w0, h);
    B_ = P(u1, w0, h);
    C_ = P(u1, w1, h);
    D_ = P(u0, w1, h);
    R1 = P(u0 + W / 2, m, h + rise);
    R2 = P(u1 - W / 2, m, h + rise);
  } else {
    const m = (u0 + u1) / 2;
    A_ = P(u0, w1, h);
    B_ = P(u0, w0, h);
    C_ = P(u1, w0, h);
    D_ = P(u1, w1, h);
    R1 = P(m, w1 - L / 2, h + rise);
    R2 = P(m, w0 + L / 2, h + rise);
  }
  const face = (pts) => {
    const [a, b, d] = pts.map((q) => new THREE.Vector3(q[0], q[2], -q[1]));
    const n = b.clone().sub(a).cross(d.clone().sub(a)).normalize();
    const ord = n.y < 0 ? [...pts].reverse() : pts;
    if (n.y < 0) n.negate();
    const t = new THREE.Vector3(ord[1][0] - ord[0][0], 0, -(ord[1][1] - ord[0][1])).normalize(),
      bt = n.clone().cross(t); // tile rows run along the eaves
    for (const q of ord) {
      const P3 = new THREE.Vector3(q[0], q[2], -q[1]);
      G.pos.push(P3.x, P3.y, P3.z);
      G.nor.push(n.x, n.y, n.z);
      rc.toArray(G.col, G.col.length);
      G.uv.push(P3.dot(t), P3.dot(bt));
    }
    for (let k = 1; k < ord.length - 1; k++) G.idx.push(G.v, G.v + k, G.v + k + 1);
    G.v += ord.length;
  };
  face([A_, B_, R2, R1]);
  face([C_, D_, R1, R2]);
  face([B_, C_, R2]);
  face([D_, A_, R1]);
  return true;
}
export function buildingGeometry(list) {
  const pos = [],
    nor = [],
    col = [],
    wall = [],
    info = [],
    idx = [],
    uv = [];
  let v = 0;
  for (const b of list) {
    let { r, h, base, seed, kind } = bInfo(b);
    if (r.length < 3) continue;
    if (area(r) < 0) r = [...r].reverse(); // counter-clockwise
    const [walls, roofs] = BCOL[kind];
    const wc = hexCol(walls[Math.floor(seed * walls.length)], 0.04),
      rc = hexCol(roofs[Math.floor(seed * 7) % roofs.length], 0.05);
    const kId = b.kId ?? { house: 0, shop: 1, industrial: 1, tall: 2, glass: 3, finned: 4, resi: 5 }[kind];
    let u = 0;
    for (let i = 0; i < r.length; i++) {
      const [x1, y1] = r[i],
        [x2, y2] = r[(i + 1) % r.length];
      const L = Math.hypot(x2 - x1, y2 - y1);
      if (L < 0.05) continue;
      const nx = (y2 - y1) / L,
        ny = -(x2 - x1) / L; // outward for CCW
      pos.push(x1, base, -y1, x2, base, -y2, x2, h, -y2, x1, h, -y1);
      for (let k = 0; k < 4; k++) {
        nor.push(nx, 0, -ny);
        wc.toArray(col, col.length);
        info.push(h, seed, kId);
      }
      wall.push(u, base, u + L, base, u + L, h, u, h);
      uv.push(u, base, u + L, base, u + L, h, u, h);
      u += L;
      idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
      v += 4;
    }
    if (kind === 'house' && hipRoof(r, h, new THREE.Color(1, 1, 1).multiplyScalar(0.82 + seed * 0.18))) continue;
    const tri = THREE.ShapeUtils.triangulateShape(
      r.map((q) => new THREE.Vector2(q[0], q[1])),
      [],
    );
    for (const q of r) {
      pos.push(q[0], h, -q[1]);
      nor.push(0, 1, 0);
      rc.toArray(col, col.length);
      wall.push(0, -1);
      info.push(h, seed, kId);
      uv.push(q[0], q[1]);
    }
    for (const [a, b2, c] of tri) {
      const [p, q, o] = [r[a], r[b2], r[c]]; // counter-clockwise seen from above = facing up
      if ((q[0] - p[0]) * (o[1] - p[1]) - (q[1] - p[1]) * (o[0] - p[0]) > 0) idx.push(v + a, v + b2, v + c);
      else idx.push(v + a, v + c, v + b2);
    }
    v += r.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aWall', new THREE.Float32BufferAttribute(wall, 2));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
/* main.style "tower": floor height, podium, crown and the lit amenity floors (main.tower), baked into the shader */
const TOWER = CONFIG.main.style === 'tower';
const TWC = CONFIG.main.tower ?? {};
const f1 = (/** @type {number} */ v) => Number(v).toFixed(2);
const glsl = (/** @type {string} */ hex) => {
  const c = new THREE.Color(hex);
  return `vec3(${c.r.toFixed(3)}, ${c.g.toFixed(3)}, ${c.b.toFixed(3)})`;
};
const TW = {
  fh: f1(TWC.floorHeight ?? 3.6),
  podium: f1(TWC.podium ?? 0),
  crown: f1(TWC.crown ?? 8),
  glass: glsl(TWC.glass ?? '#3A4A58'),
  fin: glsl(TWC.fin ?? '#E8E9EA'),
  bands: (TWC.bands ?? [])
    .map(
      (/** @type {number[]} */ [a, b]) =>
        `bandGlow = max(bandGlow, step(${f1(a)}, vWall.y) * step(vWall.y, ${f1(b)}));`,
    )
    .join(' '),
};
/**
 * @param {THREE.Material} mat
 * @param {boolean | 'lit'} mall  true: the main building; 'lit': a lit landmark (site.config.json → litLandmarks),
 *   never faded or dimmed; false: the city
 */
export function windowShader(mat, mall = false) {
  const lit = mall === 'lit';
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uNight: U.uNight, uTime: U.uTime, uDim: U.uDim, uCalm: U.uCalm });
    sh.vertexShader =
      'attribute vec2 aWall; attribute vec3 aInfo; varying vec2 vWall; varying vec3 vInfo; varying float vWN; varying vec3 vWP; varying vec3 vNrm;\n' +
      sh.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n vWall = aWall; vInfo = aInfo; vWN = normal.y; vWP = position; vNrm = normal;',
      );
    sh.fragmentShader =
      `uniform float uNight; uniform float uTime; uniform float uDim; uniform float uCalm; varying vec2 vWall; varying vec3 vInfo; varying float vWN; varying vec3 vWP; varying vec3 vNrm;
      float h31(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }\n` +
      sh.fragmentShader
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
        float kind = vInfo.z; float sp = kind < 0.5 ? 3.2 : kind < 1.5 ? 3.6 : 2.6; float fl = kind < 0.5 ? 3.0 : 3.4;
        float fu = fract(vWall.x / sp), fv = fract(vWall.y / fl);
        float wall = step(abs(vWN), 0.5) * step(0.0, vWall.y);
        float win = wall * step(0.2, fu) * step(fu, 0.8) * step(0.3, fv) * step(fv, 0.86) * step(1.4, vWall.y) * step(vWall.y, vInfo.x - 0.7);
        if (kind > 2.5) win = wall * step(0.06, fu) * step(0.08, fv) * step(1.0, vWall.y) * step(vWall.y, vInfo.x - 0.5);
        float band = wall * (1.0 - smoothstep(0.0, 0.05, fv)) * step(1.5, kind);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.20, 0.27, 0.34), win * (kind > 2.5 ? 0.55 : 0.78));
        diffuseColor.rgb *= 1.0 - band * 0.18;
        float shopGlow = 0.0, signGlow = 0.0, tealGlow = 0.0;
        if (kind > 0.5 && kind < 1.5 && wall > 0.5) {                 // shophouses: dark shopfronts and a signboard band
          float seg = floor(vWall.x / 6.0); float sb = step(3.0, vWall.y) * step(vWall.y, 4.1);
          vec3 sc = vec3(h31(vec3(seg, 1.0, vInfo.y)), h31(vec3(seg, 2.0, vInfo.y)), h31(vec3(seg, 3.0, vInfo.y)));
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.85, 0.15, 0.12), sc, 0.55), sb);
          float sf = step(0.3, vWall.y) * step(vWall.y, 2.8) * step(0.08, fract(vWall.x / 6.0)) * step(fract(vWall.x / 6.0), 0.92);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.13, 0.15), sf); win = max(win, sf); shopGlow = sf; signGlow = sb;
        }
        if (kind > 3.5 && kind < 4.5 && wall > 0.5) {                 // dark glass tower with white fins in a broken pattern
          float c = floor(vWall.x / 1.5); float seg = floor(vWall.y / (3.4 * (2.0 + floor(h31(vec3(c, 1.0, vInfo.y)) * 6.0))));
          float white = step(0.58, h31(vec3(c, seg, vInfo.y))) * step(0.18, fract(vWall.x / 1.5));
          diffuseColor.rgb = mix(vec3(0.09, 0.13, 0.21), vec3(0.92, 0.93, 0.94), white);
          win = (1.0 - white) * step(1.0, vWall.y);
        }
        if (kind > 4.5 && kind < 5.5 && wall > 0.5) {                 // residential tower: balcony slabs, glass, recessed cores
          float slab = step(fract(vWall.y / 3.2), 0.24); float rec = step(0.86, fract(vWall.x / 13.0)); float fin = step(fract(vWall.x / 6.5), 0.12);
          float g = step(0.08, fract(vWall.x / 3.25)) * step(fract(vWall.x / 3.25), 0.9) * step(0.2, fract(vWall.y / 3.2));
          diffuseColor.rgb = mix(mix(vec3(0.86, 0.87, 0.88), vec3(0.42, 0.50, 0.56), g), vec3(0.97), max(slab, fin));
          diffuseColor.rgb *= 1.0 - rec * 0.35; win = g * (1.0 - max(slab, fin)) * step(4.0, vWall.y);
        }
        float bandGlow = 0.0, litGlow = 0.0, wash = 0.0;
        if (kind > 7.5 && wall > 0.5) {                               // lit landmark: polished stainless steel, white light strips
          float fc = fract(vWall.x / 1.25); float ring = step(fract(vWall.y / 18.0), 0.035);
          float fin = step(fc, 0.3);
          diffuseColor.rgb = mix(vec3(0.62, 0.66, 0.71), vec3(0.95, 0.96, 0.97), max(fin, ring));
          win = 0.0;
          litGlow = fin * 0.62 + ring * 1.0 + (1.0 - fin) * 0.07;
          litGlow *= 0.7 + 0.3 * smoothstep(0.0, vInfo.x, vWall.y);
        }
        if (kind > 6.5 && kind < 7.5 && wall > 0.5) {                 // main.style "tower": curtain wall with a fin at every floor
          float fh = ${TW.fh}; float fy = fract(vWall.y / fh); float col = fract(vWall.x / 1.6);
          float fin = step(fy, 0.1);                                  // the slab edge / sun fin along each floor
          float mull = step(col, 0.05);
          vec3 glass = mix(${TW.glass}, ${TW.glass} * 1.45, 0.25 + 0.5 * h31(vec3(floor(vWall.x / 1.6), floor(vWall.y / fh), 9.0)));
          vec3 c = mix(glass, ${TW.fin}, max(fin, mull * 0.55));
          float podium = step(vWall.y, ${TW.podium});
          c = mix(c, mix(vec3(0.10, 0.11, 0.12), ${TW.fin}, step(fract(vWall.y / 4.2), 0.05)), podium);
          ${TW.bands}
          // the sky-gap amenity floors: recessed dark glass behind columns, warm light inside
          float colm = step(fract(vWall.x / 9.0), 0.16);
          c = mix(c, mix(vec3(0.06, 0.06, 0.07), ${TW.fin}, colm), bandGlow);
          float crown = step(vInfo.x - ${TW.crown}, vWall.y);
          c = mix(c, mix(${TW.fin} * 1.1, glass * 0.8, step(0.4, fract(vWall.y / 1.1))), crown);
          diffuseColor.rgb = c;
          win = (1.0 - max(fin, mull)) * (1.0 - podium) * (1.0 - crown) * (1.0 - bandGlow * colm);
          wash = (fin * 0.55 + 0.05) * (1.0 - podium) + crown * 0.25;
          shopGlow = podium * step(vWall.y, 5.0); signGlow = crown * 0.6 + fin * (1.0 - podium) * 0.05; tealGlow = bandGlow * (1.0 - colm);
        }
        ${
          __TOWER__
            ? ''
            : `        if (kind > 5.5 && kind < 6.5 && wall > 0.5) {                 // EkoCheras Mall, as on Street View (2024)
          float sc = floor(vWall.x / 1.15);
          vec3 orange = mix(vec3(0.93, 0.50, 0.20), vec3(0.97, 0.66, 0.38), h31(vec3(sc, 2.0, 3.0)));
          vec3 c = mix(vec3(0.95, 0.91, 0.85), orange, step(0.36, h31(vec3(sc, 7.0, 1.0))));
          c = mix(c, vec3(0.98), step(fract(vWall.x / 1.15), 0.07) * step(0.5, h31(vec3(sc, 4.0, 4.0))));
          float east = step(0.6, vNrm.x), n = -vWP.z;
          float teal = east * step(14.0, n) * step(n, 75.0) * step(5.4, vWall.y);
          float panel = east * step(-11.0, n) * step(n, 11.0) * step(6.0, vWall.y);
          float dark = clamp(east * (step(-24.0, n) * step(n, -11.0) + step(n, -48.0)) + (1.0 - east) * step(0.8, h31(vec3(floor(vWall.x / 14.0), 5.0, 5.0))), 0.0, 1.0) * (1.0 - teal) * step(5.4, vWall.y);
          vec3 tealC = mix(vec3(0.15, 0.52, 0.55), vec3(0.78, 0.9, 0.9), clamp(step(0.93, fract(vWall.x / 1.6)) + step(0.9, fract(vWall.y / 1.7)), 0.0, 1.0));
          vec3 darkC = mix(vec3(0.11, 0.17, 0.24), vec3(0.62, 0.66, 0.7), clamp(step(0.93, fract(vWall.x / 1.4)) + step(0.92, fract(vWall.y / 1.8)), 0.0, 1.0));
          c = mix(c, tealC, teal); c = mix(c, darkC, dark); c = mix(c, vec3(0.56, 0.57, 0.58), panel);
          float gf = step(vWall.y, 4.6), canopy = step(4.6, vWall.y) * step(vWall.y, 5.4);
          c = mix(c, vec3(0.12, 0.13, 0.15), gf); c = mix(c, vec3(0.18, 0.18, 0.2), canopy);
          float sid = floor(vWall.x / 9.0); float sg = step(0.68, h31(vec3(sid, 9.0, 2.0))) * step(6.2, vWall.y) * step(vWall.y, 10.5) * step(0.15, fract(vWall.x / 9.0)) * step(fract(vWall.x / 9.0), 0.85) * (1.0 - teal) * (1.0 - panel);
          c = mix(c, mix(vec3(0.74, 0.11, 0.12), vec3(0.95, 0.94, 0.9), step(0.55, h31(vec3(sid, 1.0, 1.0)))), sg);
          diffuseColor.rgb = c; win = max(gf * step(0.4, vWall.y), max(teal, dark) * 0.6);
          shopGlow = gf * step(0.4, vWall.y); signGlow = sg; tealGlow = teal;
        }
`
        }
        roughnessFactor = mix(roughnessFactor, 0.12, win);
        float lit = step(kind > 6.5 ? 0.86 : 0.58, h31(vec3(floor(vWall.x / sp), floor(vWall.y / fl), floor(vInfo.y * 97.0))));
        vec3 warm = mix(vec3(1.0, 0.74, 0.42), vec3(0.85, 0.92, 1.0), step(0.8, h31(vec3(floor(vWall.y / fl), vInfo.y, 3.0))));`,
        )
        .replace(
          '#include <metalnessmap_fragment>',
          '#include <metalnessmap_fragment>\n metalnessFactor = mix(metalnessFactor, 0.55, win);',
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
        totalEmissiveRadiance += step(5.5, kind) * (win * lit * 0.3 + shopGlow * 0.5) * uNight * warm * 1.1 * (1.0 - uDim * 0.85 * step(kind, 5.5)) + step(5.5, kind) * uNight * (signGlow * vec3(1.0, 0.85, 0.7) * 0.9 + tealGlow * mix(vec3(0.2, 0.75, 0.8), vec3(1.0, 0.78, 0.5), step(6.5, kind)) * 0.5);
        totalEmissiveRadiance += litGlow * (uNight * 0.9 + (1.0 - uNight) * 0.16) * vec3(0.95, 0.97, 1.0) + wash * uNight * vec3(1.0, 0.8, 0.5);
        ${
          lit
            ? ''
            : mall && TOWER
              ? `float scan = smoothstep(0.0, 3.0, 3.0 - abs(vWall.y - fract(uTime * 0.12) * (vInfo.x + 6.0)));
        totalEmissiveRadiance += wall * vec3(1.0, 0.45, 0.16) * scan * (0.05 * uNight + uDim * 0.6);`
              : mall
                ? `float strip = wall * (1.0 - smoothstep(0.0, 0.07, abs(fract(vWall.y / 4.4) - 0.5) * 2.0 - 0.86) );
        float scan = smoothstep(0.0, 1.6, 1.6 - abs(vWall.y - fract(uTime * 0.18) * (vInfo.x + 6.0)));
        totalEmissiveRadiance += wall * vec3(1.0, 0.45, 0.16) * (strip * (0.35 * uNight + 0.25 * uDim) + scan * (0.05 * uNight + uDim * 0.7));`
                : ''
        }`,
        )
        .replace(
          '#include <dithering_fragment>',
          mall
            ? '#include <dithering_fragment>'
            : '#include <dithering_fragment>\n gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(vec3(dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114))), gl_FragColor.rgb, 0.7) * 0.72 + vec3(0.25, 0.25, 0.24), uCalm);\n gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(mix(vec3(dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114))), gl_FragColor.rgb, 0.2) * 0.25 + vec3(0.70, 0.72, 0.75), gl_FragColor.rgb * 0.07 + vec3(0.006, 0.009, 0.018), uNight), uDim);',
        );
  };
  mat.customProgramCacheKey = () => (lit ? 'litlm' : mall ? 'mall' : 'bld');
  return mat;
}
// OSM draws a building either as its outline or as its parts, never both: drop outlines that contain parts, and exact duplicates
const PARTS = OSM.buildings
  .filter((b) => b.part)
  .map((b) => ring(b.p).reduce((a, q, i, r) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0]));
// lit landmarks (site.config.json → litLandmarks, e.g. the Petronas Twin Towers): their own lit material, never faded
const LIT_AT = /** @type {{ at: number[], r: number, minH?: number }[]} */ (CONFIG.litLandmarks ?? []);
const centre = (/** @type {any} */ b) =>
  ring(b.p).reduce((a, q, i, r) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0]);
const isLit = (/** @type {any} */ b) =>
  LIT_AT.some(
    ({ at, r, minH = 0 }) => Math.hypot(centre(b)[0] - at[0], centre(b)[1] - at[1]) < r && bInfo(b).h >= minH,
  );
const seenFoot = new Set();
const others = OSM.buildings.filter((b) => {
  if (b === MALL || b.id === MALL.id) return false;
  const r = ring(b.p);
  if (onMall(r) && bInfo(b).h <= MALL_H + 4) return false;
  if (!b.part && PARTS.some((c) => inPoly(c[0], c[1], r))) return false;
  const k = r
    .map((q) => q.map((v) => v.toFixed(1)).join(','))
    .sort()
    .join(';');
  if (seenFoot.has(k)) return false;
  seenFoot.add(k);
  return true;
}); // parts hidden inside the podium would only z-fight
const litOnes = others.filter(isLit);
others.splice(0, others.length, ...others.filter((b) => !litOnes.includes(b)));
if (litOnes.length) {
  const m = new THREE.Mesh(
    buildingGeometry(litOnes.map((b) => ({ ...b, kId: 8 }))),
    windowShader(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.62, envMapIntensity: 1.8 }),
      'lit',
    ),
  );
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
}
const bMesh = new THREE.Mesh(
  buildingGeometry(others),
  windowShader(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0,
      envMapIntensity: 0.6,
      normalMap: tex('white_plaster_rough_01_nor', 2.5, false),
      normalScale: new THREE.Vector2(0.6, 0.6),
    }),
  ),
);
{
  const G = ROOFG,
    g = new THREE.BufferGeometry(); // clay-tile hip roofs of the link houses
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(G.uv, 2));
  g.setIndex(G.idx);
  const roofs = new THREE.Mesh(
    g,
    dimmable(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(1.7, 1.45, 1.3),
        vertexColors: true,
        roughness: 0.8,
        map: tex('clay_roof_tiles_diff', 2.2),
        normalMap: tex('clay_roof_tiles_nor', 2.2, false),
      }),
      'tiles',
    ),
  );
  roofs.castShadow = roofs.receiveShadow = true;
  scene.add(roofs);
}
bMesh.castShadow = bMesh.receiveShadow = true;
scene.add(bMesh);
