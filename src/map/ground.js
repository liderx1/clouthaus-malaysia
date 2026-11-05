import * as THREE from 'three';
import { CONFIG } from './config.js';
import { OSM, ring } from './data.js';
import { cumulative, sampleAt } from './geo.js';
import { U, dimmable, scene } from './stage.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- ground & land use ---------- */
const groundMat = dimmable(new THREE.MeshStandardMaterial({ color: 0xb9b7ae, roughness: 0.95 }), 'ground');
export const ground = new THREE.Mesh(new THREE.CircleGeometry(3200, 96), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const LAND = {
  residential: 0xe0ded6,
  retail: 0xe6e0d3,
  commercial: 0xe2ded6,
  park: 0x8fb46b,
  recreation_ground: 0x9bbe76,
  grass: 0x9cc17a,
  wood: 0x5f8f48,
  scrub: 0x7fa25d,
  parking: 0xc8cacc,
  pitch: 0x6fa95c,
  water: 0x6faed2,
  brownfield: 0xcbbda4,
  construction: 0xd2c6ae,
  swimming_pool: 0x6ecbe6,
  garden: 0x93bb72,
  cemetery: 0x9db984,
  industrial: 0xd6d3cc,
};
// free CC0 textures from Poly Haven (map/tex), tiled in metres
const TL = new THREE.TextureLoader();
export function tex(name, repeat, srgb = true, ext = 'jpg') {
  const t = TL.load(`/map/tex/${name}.${ext}`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.repeat.set(1 / repeat, 1 / repeat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const GREEN = new Set(['park', 'wood', 'grass', 'pitch', 'recreation_ground', 'garden', 'scrub', 'cemetery']);
const GREEN_TINT = { wood: 0x9cc48a, pitch: 0xd8f0b8, scrub: 0xc2dca0 };
const VIVID = !!CONFIG.look?.vividGreen;
{
  const green = [],
    other = [];
  for (const a of OSM.areas) {
    const col = LAND[a.t];
    if (!col) continue;
    const r = ring(a.p);
    if (r.length < 3) continue;
    const g = new THREE.ShapeGeometry(new THREE.Shape(r.map((q) => new THREE.Vector2(q[0], q[1])))).toNonIndexed();
    g.rotateX(-Math.PI / 2);
    g.translate(0, GREEN.has(a.t) ? 0.09 : 0.05, 0);
    const c = new THREE.Color(GREEN.has(a.t) ? (GREEN_TINT[a.t] ?? (VIVID ? 0xb4de86 : 0xcde8b0)) : col),
      n = g.attributes.position.count,
      cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.toArray(cols, i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    (GREEN.has(a.t) ? green : other).push(g);
  }
  if (green.length) {
    const m = new THREE.Mesh(
      mergeGeometries(green),
      dimmable(
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 1,
          map: tex('leafy_grass_diff', 4),
          normalMap: tex('leafy_grass_nor', 4, false),
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -2,
        }),
        'grass',
      ),
    );
    m.receiveShadow = true;
    scene.add(m);
  }
  if (other.length) {
    const m = new THREE.Mesh(
      mergeGeometries(
        other.map((g) => {
          g.deleteAttribute('uv');
          return g;
        }),
      ),
      dimmable(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), 'land'),
    );
    m.receiveShadow = true;
    scene.add(m);
  }
}

/* ---------- roads ---------- */
export const RW = {
  motorway: 22,
  trunk: 19,
  trunk_link: 8,
  primary: 15,
  primary_link: 7,
  secondary: 12,
  secondary_link: 7,
  tertiary: 10,
  tertiary_link: 7,
  unclassified: 7,
  residential: 6.5,
  living_street: 5,
  service: 4.2,
  footway: 2.2,
  path: 1.8,
  pedestrian: 4,
  steps: 2,
  corridor: 2.4,
  cycleway: 2,
  track: 3,
};
export const FOOT = new Set(['footway', 'path', 'steps', 'corridor', 'cycleway', 'pedestrian', 'track']);
export const roadZ = (r) => (r.bridge ? 7 * Math.max(1, r.layer || 1) : 0);
export function ribbon(p, w, y, uvLen = true) {
  // flat strip along polyline; uv.x across (0..1), uv.y metres along
  const pos = [],
    uv = [],
    idx = [];
  const cum = cumulative(p);
  const n = p.length;
  for (let i = 0; i < n; i++) {
    const a = p[Math.max(0, i - 1)],
      b = p[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0],
      dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    dx /= L;
    dy /= L;
    const nx = (-dy * w) / 2,
      ny = (dx * w) / 2,
      z = (p[i][2] ?? 0) + y;
    pos.push(p[i][0] + nx, z, -(p[i][1] + ny), p[i][0] - nx, z, -(p[i][1] - ny));
    uv.push(0, uvLen ? cum[i] : 0, 1, uvLen ? cum[i] : 0);
    if (i) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    } // counter-clockwise from above: faces up
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const metres = (g, w) => {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * w);
  return g;
}; // uv.x across in metres
const withZ = (r) => r.p.map((q) => [q[0], q[1], roadZ(r)]);
{
  const asphalt = [],
    walk = [],
    curb = [];
  for (const r of OSM.roads) {
    if (r.tunnel) continue; // underground roads and passages through buildings are not drawn
    const w = RW[r.t] ?? 5,
      p = withZ(r);
    if (FOOT.has(r.t)) walk.push(metres(ribbon(p, w, 0.16), w));
    else {
      const g = metres(ribbon(p, w, 0.14), w);
      const n = g.attributes.position.count;
      g.setAttribute('aW', new THREE.Float32BufferAttribute(new Array(n).fill(w), 1));
      asphalt.push(g);
      if (w >= 6.5 && !r.bridge) curb.push(metres(ribbon(p, w + 4, 0.1), w + 4));
    }
  }
  const roadMat = dimmable(
    new THREE.MeshStandardMaterial({
      color: 0x8c8f93,
      roughness: 0.92,
      map: tex('asphalt_02_diff', 6),
      normalMap: tex('asphalt_02_nor', 6, false),
    }),
    'road',
  );
  roadMat.onBeforeCompile = ((prev) => (sh, r) => {
    // lane markings drawn from uv: centre dashes, edge lines on wide roads
    sh.vertexShader =
      'attribute float aW; varying float vW; varying vec2 vRUv;\n' +
      sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vW = aW; vRUv = uv;');
    sh.fragmentShader =
      'varying float vW; varying vec2 vRUv;\n' +
      sh.fragmentShader
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
      float cx = abs(vRUv.x - vW * 0.5);
      float dash = step(cx, 0.09) * step(fract(vRUv.y / 9.0), 0.5) * step(8.5, vW);
      float edge = step(vW * 0.5 - 0.55, cx) * step(cx, vW * 0.5 - 0.4) * step(11.0, vW);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.9, 0.84), max(dash, edge) * 0.85);`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(1.0, 0.6, 0.28) * uNight * (0.05 + 0.05 * max(dash, edge)) * (1.0 - uDim);',
        );
    sh.uniforms.uNight = U.uNight;
    sh.fragmentShader = 'uniform float uNight;\n' + sh.fragmentShader;
    prev(sh, r);
  })(roadMat.onBeforeCompile);
  const add = (geos, mat, layer = 0) => {
    if (!geos.length) return;
    if (layer) Object.assign(mat, { polygonOffset: true, polygonOffsetFactor: -layer, polygonOffsetUnits: -layer * 2 });
    const m = new THREE.Mesh(mergeGeometries(geos), mat);
    m.receiveShadow = true;
    scene.add(m);
  };
  const pave = () => ({
    map: tex('concrete_pavement_diff', 3),
    normalMap: tex('concrete_pavement_nor', 3, false),
    roughness: 0.95,
  });
  add(curb, dimmable(new THREE.MeshStandardMaterial({ color: 0xe2ded6, ...pave() }), 'curb'), 2);
  add(asphalt, roadMat, 3);
  add(walk, dimmable(new THREE.MeshStandardMaterial({ color: 0xeae4da, ...pave() }), 'walk'), 4);
  // elevated roads and the MRT link bridge get piers
  const piers = [];
  for (const r of OSM.roads)
    if (r.bridge) {
      const p = r.p,
        cum = cumulative(p);
      for (let s = 10; s < cum.at(-1); s += 28) {
        const q = sampleAt(p, cum, s);
        const z = roadZ(r);
        const g = new THREE.CylinderGeometry(0.7, 0.9, z, 8);
        g.translate(q.x, z / 2, -q.y);
        piers.push(g);
      }
    }
  add(piers, dimmable(new THREE.MeshStandardMaterial({ color: 0xbdb9b0, roughness: 0.85 }), 'pier'));
  for (const r of OSM.roads)
    if (r.bridge) {
      const g = ribbon(withZ(r), (RW[r.t] ?? 4) + 1.2, -0.5, false);
      const m = new THREE.Mesh(
        g,
        dimmable(new THREE.MeshStandardMaterial({ color: 0xcac6bd, roughness: 0.8, side: THREE.DoubleSide }), 'deck'),
      );
      m.castShadow = true;
      scene.add(m);
    }
}
