// Type B 3D walk-through: the unit modelled from the developer's Type B floor plan (9,540 × 10,680 mm, dual key) and
// specification list (marble floors, 3.0 m ceilings, 2.8 m curtain-wall glass, Gaggenau / Bosch / Gessi / Laufen /
// Yale), placed where unit 8 is in the 3D tower (KL City Centre side, site.config.json → tours) so the windows look
// out on the real 3D city and the Petronas Twin Towers. Furniture and décor are illustrative and marked as such.
// Look around by dragging; the room buttons move between viewpoints; hotspots name the fittings.
// Bundled on its own into public/map/tour.js and loaded only when a visitor opens it (src/map/ui.js).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------- words ---------- */
const W = {
  en: {
    title: 'Type B · 1,098 sq ft',
    sub: '3D walk-through · level 40 (indicative)',
    hint: 'Drag to look around',
    note: "Indicative 3D interior built from the developer's Type B floor plan and specification list. Furniture and décor are illustrative.",
    close: 'Back to the map',
    rooms: {
      living: 'Living',
      dining: 'Dining & kitchen',
      bedroom: 'Bedroom',
      study: 'Study',
      foyer: 'Foyer',
      bath: 'Bathroom 1',
    },
  },
  zh: {
    title: 'B 型 · 1,098 平方英尺',
    sub: '3D 参观 · 40 楼（示意）',
    hint: '拖动画面环顾四周',
    note: '示意：依建商 B 型平面图与配备清单建模，家具与装潢仅供参考。',
    close: '返回地图',
    rooms: { living: '客厅', dining: '饭厅与厨房', bedroom: '卧室', study: '书房', foyer: '玄关', bath: '浴室 1' },
  },
};
const lang = () => (document.documentElement.lang.startsWith('zh') ? 'zh' : 'en');
const w = (/** @type {string} */ k) => /** @type {any} */ (W)[lang()][k];

/* ---------- the plan, in metres: x across the unit (bedroom side 0 → living side 9.54), z from the window inward ---------- */
const UW = 9.54,
  UD = 10.68,
  H = 3.0,
  T = 0.12; // wall thickness
// viewpoints: eye position and the direction to look at first
const NODES = {
  living: { eye: [6.6, 1.5, 4.2], look: [5.9, 1.25, 0] },
  dining: { eye: [6.2, 1.5, 6.6], look: [7.6, 1.0, 10.4] },
  bedroom: { eye: [3.85, 1.55, 3.78], look: [0.6, 0.9, 1.4] },
  study: { eye: [3.0, 1.5, 8.0], look: [1.2, 0.9, 10.4] },
  foyer: { eye: [5.0, 1.5, 9.9], look: [5.6, 1.4, 4.0] },
  bath: { eye: [8.2, 1.5, 7.0], look: [8.6, 1.0, 4.4] },
};
// hotspots: where, and what the developer says is there
const SPOTS = [
  {
    at: [6.0, 1.9, 0.15],
    en: ['Curtain wall', '2.8 m glass, 26 mm double-glazed'],
    zh: ['落地玻璃幕墙', '玻璃高 2.8 米，26 毫米双层'],
  },
  { at: [7.4, 2.95, 2.2], en: ['Ceiling height', 'up to 3.0 m'], zh: ['天花板高度', '最高 3.0 米'] },
  {
    at: [7.6, 0.05, 4.6],
    en: ['Marble floor', 'living, dining, kitchen and bedroom'],
    zh: ['大理石地板', '客厅、饭厅、厨房与卧室'],
  },
  { at: [6.7, 1.05, 10.2], en: ['Gaggenau', 'built-in hob and hood'], zh: ['Gaggenau', '嵌入式炉具与抽油烟机'] },
  {
    at: [9.2, 1.6, 8.1],
    en: ['Bosch & Gaggenau', 'built-in fridge, combi microwave oven'],
    zh: ['Bosch 与 Gaggenau', '嵌入式冰箱、组合微波炉'],
  },
  {
    at: [8.9, 1.0, 6.9],
    en: ['Gessi & Laufen', 'basin mixer, wash basin and WC'],
    zh: ['Gessi 与 Laufen', '龙头、洗手盆与马桶'],
  },
  { at: [5.0, 1.2, 10.6], en: ['Yale Bespoke', 'digital door lock'], zh: ['Yale Bespoke', '电子门锁'] },
  {
    at: [3.0, 1.5, 7.6],
    en: ['Dual key', 'bedroom side and living side, one foyer'],
    zh: ['双钥匙', '卧室区与客厅区，共用玄关'],
  },
  { at: [4.3, 1.4, 2.1], en: ['Built-in wardrobe', 'handed over with the home'], zh: ['嵌入式衣柜', '交屋即附'] },
  {
    at: [0.5, 2.2, 0.15],
    en: ['Air-conditioning', 'VRF, grilles in the ceiling'],
    zh: ['冷气', 'VRF 系统，天花出风口'],
  },
];

/* ---------- materials ---------- */
function canvasTex(
  /** @type {number} */ size,
  /** @type {(x: CanvasRenderingContext2D, s: number) => void} */ draw,
  rep = 1,
) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = 8;
  return t;
}
const rnd = (() => {
  let s = 7;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
})();
function materials() {
  const marble = canvasTex(
    1024,
    (x, s) => {
      x.fillStyle = '#EEEAE3';
      x.fillRect(0, 0, s, s);
      for (let i = 0; i < 2600; i++) {
        x.fillStyle = `rgba(${200 + rnd() * 40},${196 + rnd() * 40},${190 + rnd() * 40},.18)`;
        x.fillRect(rnd() * s, rnd() * s, 2 + rnd() * 14, 2 + rnd() * 14);
      }
      for (let v = 0; v < 9; v++) {
        x.strokeStyle = `rgba(120,112,104,${0.12 + rnd() * 0.25})`;
        x.lineWidth = 0.6 + rnd() * 2.2;
        x.beginPath();
        let px = rnd() * s,
          py = 0;
        x.moveTo(px, py);
        while (py < s) {
          px += (rnd() - 0.5) * 70;
          py += 20 + rnd() * 50;
          x.lineTo(px, py);
        }
        x.stroke();
      }
      // tile joints, 1.2 m slabs
      x.strokeStyle = 'rgba(150,140,130,.35)';
      x.lineWidth = 2;
      x.strokeRect(0, 0, s, s);
    },
    1,
  );
  const timber = canvasTex(512, (x, s) => {
    x.fillStyle = '#9C7650';
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 160; i++) {
      x.strokeStyle = `rgba(${70 + rnd() * 50},${48 + rnd() * 30},${28 + rnd() * 20},${0.12 + rnd() * 0.2})`;
      x.lineWidth = 1 + rnd() * 2;
      const y = rnd() * s;
      x.beginPath();
      x.moveTo(0, y);
      x.bezierCurveTo(s / 3, y + (rnd() - 0.5) * 12, (2 * s) / 3, y + (rnd() - 0.5) * 12, s, y + (rnd() - 0.5) * 6);
      x.stroke();
    }
  });
  const fabric = canvasTex(256, (x, s) => {
    x.fillStyle = '#CFC6B9';
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 6000; i++) {
      const g = 170 + rnd() * 60;
      x.fillStyle = `rgba(${g},${g - 8},${g - 18},.25)`;
      x.fillRect(rnd() * s, rnd() * s, 1.5, 1.5);
    }
  });
  const M = (/** @type {THREE.MeshStandardMaterialParameters} */ o) => new THREE.MeshStandardMaterial(o);
  marble.repeat.set(1 / 1.2, 1 / 1.2);
  return {
    floor: M({ map: marble, roughness: 0.18, metalness: 0.05, envMapIntensity: 0.6 }),
    marble: M({ map: marble, roughness: 0.2, envMapIntensity: 0.6 }),
    wall: M({ color: 0xf0ece6, roughness: 0.92 }),
    ceiling: M({ color: 0xf6f3ee, roughness: 0.95 }),
    timber: M({ map: timber, roughness: 0.55 }),
    darkTimber: M({ map: timber, color: 0x8a7a68, roughness: 0.5 }),
    fabric: M({ map: fabric, roughness: 0.95 }),
    fabricDark: M({ map: fabric, color: 0x8f8579, roughness: 0.95 }),
    linen: M({ color: 0xf2eee7, roughness: 0.9 }),
    leather: M({ color: 0x6e4e37, roughness: 0.55 }),
    rug: M({ map: fabric, color: 0xa69d92, roughness: 1 }),
    metal: M({ color: 0x2b2826, roughness: 0.4, metalness: 0.7 }),
    brass: M({ color: 0xc4a066, roughness: 0.28, metalness: 0.9 }),
    blackGlass: M({ color: 0x0d0d0e, roughness: 0.08, metalness: 0.3 }),
    lacquer: M({ color: 0xe7e1d8, roughness: 0.35 }),
    screen: M({ color: 0x050607, roughness: 0.12, metalness: 0.4 }),
    porcelain: M({ color: 0xf8f8f6, roughness: 0.2 }),
    glass: M({ color: 0xd9e6ea, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.12, depthWrite: false }),
    showerGlass: M({ color: 0xdfe9ec, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false }),
    sheer: M({
      color: 0xf1ebe0,
      roughness: 1,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    plant: M({ color: 0x4d6b3c, roughness: 0.9 }),
    light: new THREE.MeshBasicMaterial({ color: 0xfff2d8 }),
    cove: new THREE.MeshBasicMaterial({ color: 0xffe2b0 }),
  };
}

/* ---------- building it ---------- */
/** a box from x0..x1, y0..y1, z0..z1 (plan metres) */
function box(/** @type {THREE.Material} */ m, x0, y0, z0, x1, y1, z1, r = 0) {
  const g =
    r > 0
      ? new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 2, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2))
      : new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return mesh;
}
function cyl(/** @type {THREE.Material} */ m, x, y0, z, r, h, seg = 28) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  mesh.position.set(x, y0 + h / 2, z);
  return mesh;
}
/** a wall along x or z with optional door gaps [from, to] (doors are open: just the gap and a lintel) */
function wall(/** @type {any} */ M, /** @type {THREE.Group} */ g, axis, at, from, to, gaps = []) {
  let a = from;
  const cuts = [...gaps].sort((p, q) => p[0] - q[0]);
  for (const [g0, g1] of [...cuts, [to, to]]) {
    if (g0 > a)
      g.add(
        axis === 'x'
          ? box(M.wall, a, 0, at - T / 2, g0, H, at + T / 2)
          : box(M.wall, at - T / 2, 0, a, at + T / 2, H, g0),
      );
    if (g1 > g0)
      g.add(
        axis === 'x'
          ? box(M.wall, g0, 2.2, at - T / 2, g1, H, at + T / 2)
          : box(M.wall, at - T / 2, 2.2, g0, at + T / 2, H, g1),
      );
    a = g1;
  }
}
function chair(/** @type {any} */ M, x, z, rot) {
  const c = new THREE.Group();
  c.add(
    box(M.fabric, -0.24, 0.42, -0.24, 0.24, 0.5, 0.24, 0.04),
    box(M.fabric, -0.24, 0.5, 0.18, 0.24, 0.88, 0.25, 0.04),
  );
  for (const [a, b] of [
    [-0.2, -0.2],
    [0.2, -0.2],
    [-0.2, 0.2],
    [0.2, 0.2],
  ])
    c.add(cyl(M.metal, a, 0, b, 0.015, 0.42, 8));
  c.position.set(x, 0, z);
  c.rotation.y = rot;
  return c;
}
function build(/** @type {any} */ M) {
  const g = new THREE.Group();
  // shell: floor, ceiling, outer walls, window wall
  g.add(box(M.floor, 0, -0.05, 0, UW, 0, UD));
  const ceil = box(M.ceiling, 0, H, 0, UW, H + 0.05, UD);
  g.add(ceil);
  wall(M, g, 'z', 0, 0, UD);
  wall(M, g, 'z', UW, 0, UD);
  wall(M, g, 'x', UD, 0, UW, [[4.3, 5.5]]);
  g.add(box(M.darkTimber, 4.3, 0, UD - 0.04, 5.5, 2.2, UD + 0.02)); // the front door, closed
  g.add(box(M.brass, 5.3, 1.0, UD - 0.1, 5.34, 1.25, UD - 0.05));
  // window wall: 2.8 m of glass on a low sill, mullions, a spandrel band above
  g.add(box(M.metal, 0, 0, -0.06, UW, 0.1, 0.06), box(M.metal, 0, 2.9, -0.06, UW, H, 0.06));
  g.add(box(M.glass, 0, 0.1, -0.01, UW, 2.9, 0.01));
  for (const x of [0.05, 1.69, 3.26, 4.74, 6.39, 7.95, UW - 0.05])
    g.add(box(M.metal, x - 0.035, 0.1, -0.05, x + 0.035, 2.9, 0.05));
  // sheer curtains gathered at the ends of each side
  for (const [x0, x1] of [
    [0.15, 0.75],
    [3.6, 4.2],
    [5.3, 5.9],
    [8.8, 9.4],
  ])
    g.add(box(M.sheer, x0, 0.05, 0.12, x1, 2.88, 0.2));
  // party wall between the bedroom side and the living side, with the wardrobe on one face and the media wall on the other
  g.add(box(M.wall, 4.7, 0, 0.1, 4.82, H, 7.0));
  g.add(box(M.timber, 4.22, 0, 0.5, 4.7, 2.7, 3.7)); // wardrobe (bedroom side)
  for (const z of [1.3, 2.1, 2.9]) g.add(box(M.brass, 4.2, 0.9, z - 0.01, 4.215, 1.6, z + 0.01));
  g.add(box(M.darkTimber, 4.82, 0, 0.5, 5.3, 2.7, 3.7)); // media wall (living side)
  g.add(box(M.screen, 5.3, 1.0, 1.25, 5.33, 1.95, 2.95)); // TV
  g.add(box(M.lacquer, 5.3, 0.25, 1.0, 5.75, 0.55, 3.2)); // low console
  // bedroom side: bath 2, corridor, study
  wall(M, g, 'x', 3.94, 0, 2.2);
  wall(M, g, 'z', 2.2, 3.94, 7.47, [[6.55, 7.35]]);
  wall(M, g, 'x', 7.47, 0, 3.8, [[2.25, 3.75]]);
  wall(M, g, 'z', 3.8, 7.47, UD, [[8.2, 9.1]]);
  g.add(box(M.timber, 4.15, 0, 4.2, 4.7, 2.4, 6.9)); // tall cabinet on the corridor
  // living side: bath 1, kitchen
  wall(M, g, 'x', 3.94, 7.3, UW);
  wall(M, g, 'z', 7.3, 3.94, 7.47);
  wall(M, g, 'x', 7.47, 7.3, UW, [[7.55, 8.35]]);
  g.add(box(M.lacquer, 5.6, 0, 7.5, 6.1, 1.0, 8.0)); // foyer console / shoe cabinet

  /* living */
  g.add(box(M.rug, 6.5, 0, 0.7, 8.7, 0.012, 3.6));
  const sofa = new THREE.Group();
  sofa.add(
    box(M.fabric, 8.35, 0.18, 0.9, 9.3, 0.45, 3.05, 0.06),
    box(M.fabric, 9.05, 0.45, 0.9, 9.32, 0.85, 3.05, 0.08),
  );
  sofa.add(
    box(M.fabric, 8.35, 0.45, 0.9, 9.3, 0.65, 1.12, 0.06),
    box(M.fabric, 8.35, 0.45, 2.83, 9.3, 0.65, 3.05, 0.06),
  );
  for (const z of [1.15, 1.98]) sofa.add(box(M.fabric, 8.4, 0.45, z, 9.03, 0.6, z + 0.82, 0.08));
  sofa.add(
    box(M.fabricDark, 8.85, 0.55, 1.3, 9.0, 0.95, 1.75, 0.1),
    box(M.leather, 8.85, 0.55, 2.3, 9.0, 0.95, 2.7, 0.1),
  );
  sofa.add(box(M.metal, 8.35, 0, 0.95, 9.3, 0.18, 3.0));
  g.add(sofa);
  g.add(cyl(M.marble, 7.55, 0.36, 1.85, 0.42, 0.04, 40), cyl(M.metal, 7.55, 0, 1.85, 0.12, 0.36));
  g.add(cyl(M.marble, 7.35, 0.28, 2.45, 0.28, 0.04, 40), cyl(M.metal, 7.35, 0, 2.45, 0.1, 0.28));
  const arm = new THREE.Group();
  arm.add(
    box(M.leather, -0.38, 0.2, -0.36, 0.38, 0.42, 0.36, 0.08),
    box(M.leather, -0.38, 0.42, 0.22, 0.38, 0.85, 0.38, 0.08),
  );
  arm.position.set(7.6, 0, 0.75);
  arm.rotation.y = Math.PI * 0.85;
  g.add(arm);
  g.add(cyl(M.lacquer, 6.85, 0, 0.55, 0.14, 0.38));
  for (const [dx, dy, dz, r] of [
    [0, 0.62, 0, 0.19],
    [0.1, 0.78, 0.06, 0.14],
    [-0.09, 0.74, -0.05, 0.13],
    [0.02, 0.92, -0.02, 0.1],
  ]) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M.plant);
    leaf.position.set(6.85 + dx, dy, 0.55 + dz);
    g.add(leaf);
  }
  // cove light along the living and bedroom ceilings, as in the brand's lit interiors
  g.add(box(M.cove, 5.35, 2.86, 0.3, 9.3, 2.885, 0.34), box(M.cove, 0.3, 2.86, 0.3, 4.15, 2.885, 0.34));

  /* dining */
  g.add(box(M.marble, 4.9, 0.72, 5.15, 6.3, 0.76, 5.9), box(M.metal, 5.5, 0, 5.4, 5.7, 0.72, 5.65));
  g.add(chair(M, 5.25, 4.9, 0), chair(M, 5.95, 4.9, 0), chair(M, 5.25, 6.15, Math.PI), chair(M, 5.95, 6.15, Math.PI));
  g.add(cyl(M.brass, 5.6, 1.95, 5.52, 0.01, 1.05, 6), cyl(M.light, 5.6, 1.85, 5.52, 0.22, 0.08, 32));

  /* kitchen: base run along the back wall, upper cabinets, hob and hood, sink; tall units at the end */
  g.add(box(M.lacquer, 5.95, 0, 9.95, 8.85, 0.82, UD - T / 2));
  g.add(box(M.marble, 5.93, 0.82, 9.9, 8.87, 0.86, UD - T / 2));
  g.add(box(M.lacquer, 5.95, 1.55, 10.25, 8.85, 2.35, UD - T / 2));
  g.add(box(M.blackGlass, 6.4, 0.862, 10.0, 7.0, 0.87, 10.5)); // Gaggenau hob
  g.add(box(M.metal, 6.35, 1.42, 10.0, 7.05, 1.55, 10.55)); // slim hood
  g.add(box(M.metal, 7.35, 0.86, 10.05, 7.85, 0.87, 10.45), cyl(M.brass, 7.6, 0.87, 10.5, 0.015, 0.3, 8)); // sink, tap
  g.add(box(M.lacquer, 8.9, 0, 7.55, UW - T / 2, 2.45, 8.75)); // tall units: built-in fridge, oven stack
  g.add(box(M.blackGlass, 8.88, 1.05, 7.7, 8.9, 1.5, 8.6)); // combi microwave oven
  for (const z of [7.9, 8.4]) g.add(box(M.brass, 8.86, 1.7, z, 8.88, 2.2, z + 0.02));

  /* bedroom */
  g.add(box(M.rug, 2.2, 0, 0.7, 3.95, 0.012, 3.85));
  g.add(box(M.fabricDark, 0.06, 0, 0.95, 0.22, 1.25, 3.25, 0.05)); // headboard
  g.add(box(M.metal, 0.22, 0, 1.1, 2.45, 0.32, 3.1), box(M.linen, 0.22, 0.32, 1.1, 2.45, 0.6, 3.1, 0.08));
  g.add(box(M.linen, 0.3, 0.6, 1.25, 0.75, 0.75, 1.95, 0.07), box(M.linen, 0.3, 0.6, 2.25, 0.75, 0.75, 2.95, 0.07));
  g.add(box(M.leather, 1.75, 0.58, 1.08, 2.47, 0.64, 3.12, 0.03)); // throw
  for (const z of [0.6, 3.6]) {
    g.add(box(M.timber, 0.1, 0, z - 0.25, 0.55, 0.5, z + 0.25));
    g.add(cyl(M.brass, 0.32, 0.5, z, 0.06, 0.35, 12), cyl(M.light, 0.32, 0.85, z, 0.13, 0.18, 24));
  }
  g.add(box(M.fabric, 2.55, 0.15, 1.3, 3.05, 0.48, 2.9, 0.06)); // bench at the foot of the bed

  /* bath 2 and bath 1: vanity, basin, WC, shower */
  for (const [x0, x1, flip] of [
    [0.06, 2.14, false],
    [7.36, UW - 0.06, true],
  ]) {
    const v0 = flip ? x1 - 0.55 : x0,
      v1 = flip ? x1 : x0 + 0.55;
    g.add(box(M.darkTimber, v0, 0.45, 6.5, v1, 0.85, 7.3), box(M.marble, v0, 0.85, 6.5, v1, 0.88, 7.3));
    g.add(box(M.porcelain, v0 + 0.1, 0.88, 6.7, v1 - 0.1, 0.98, 7.1, 0.03));
    g.add(box(M.brass, flip ? v1 - 0.08 : v0 + 0.04, 0.98, 6.88, flip ? v1 - 0.04 : v0 + 0.08, 1.15, 6.92));
    g.add(box(M.screen, flip ? x1 - 0.03 : x0, 1.15, 6.55, flip ? x1 : x0 + 0.03, 1.9, 7.25)); // mirror
    const wc = flip ? x1 - 0.4 : x0 + 0.05;
    g.add(box(M.porcelain, wc, 0, 5.6, wc + 0.35, 0.42, 6.15, 0.1));
    g.add(box(M.showerGlass, flip ? x0 + 0.95 : x1 - 0.95, 0, 4.0, flip ? x0 + 0.97 : x1 - 0.93, 2.0, 5.2));
    g.add(cyl(M.brass, flip ? x1 - 0.3 : x0 + 0.3, 2.05, 4.4, 0.12, 0.02, 20));
  }

  /* study: L-shaped desk along the back and side walls */
  g.add(box(M.timber, 0.1, 0.72, 9.95, 3.3, 0.76, UD - T / 2), box(M.timber, 0.1, 0.72, 8.6, 0.75, 0.76, 9.95));
  g.add(box(M.metal, 0.15, 0, 10.3, 0.2, 0.72, 10.6), box(M.metal, 3.2, 0, 10.3, 3.25, 0.72, 10.6));
  g.add(chair(M, 1.9, 9.6, Math.PI));
  g.add(box(M.screen, 1.5, 0.95, 10.4, 2.3, 1.42, 10.45));

  // downlights in the ceiling, warm
  for (const [x, z] of [
    [6.4, 1.2],
    [8.0, 1.2],
    [6.4, 3.0],
    [8.0, 3.0],
    [2.0, 1.2],
    [2.0, 3.0],
    [3.3, 2.0],
    [7.2, 9.0],
    [8.4, 9.0],
    [1.8, 8.8],
    [5.0, 9.2],
    [3.0, 5.6],
    [8.3, 5.6],
    [1.1, 5.6],
  ])
    g.add(cyl(M.light, x, H - 0.012, z, 0.055, 0.01, 18));
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = false;
  });
  return g;
}

/* ---------- the walk-through ---------- */
let open_ = null;
/**
 * @param {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: any, S: any, U: any, centre: number[],
 *   facing: number, depth: number, unitFrom: number, floorZ: number, hide: THREE.Object3D[], landmark?: number[] }} ctx
 *   centre: the tower's centre (metres, x east, y north); facing: the bearing the long side faces; depth: the tower's
 *   depth; unitFrom: where the unit starts along the facade (metres from the tower's centre); floorZ: the floor's height
 */
export function open(ctx) {
  if (open_) return;
  const { scene, camera, controls, S } = ctx;
  const M = materials();
  const room = build(M);
  // plan → world: x along the facade (toward The Exchange 106 side), z inward from the KLCC facade
  const b = (ctx.facing * Math.PI) / 180,
    Ux = Math.cos(b),
    Uy = -Math.sin(b),
    Vx = Math.sin(b),
    Vy = Math.cos(b);
  const ox = ctx.centre[0] + ctx.unitFrom * Ux + (ctx.depth / 2) * Vx,
    oy = ctx.centre[1] + ctx.unitFrom * Uy + (ctx.depth / 2) * Vy;
  room.matrixAutoUpdate = false;
  room.matrix.makeBasis(new THREE.Vector3(Ux, 0, -Uy), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Vx, 0, Vy));
  room.matrix.setPosition(ox, ctx.floorZ, -oy);
  room.updateMatrixWorld(true);
  // warm interior light
  const lights = new THREE.Group();
  for (const [x, z, i] of [
    [7.2, 2.2, 9],
    [5.6, 5.5, 6],
    [2.0, 2.2, 7],
    [7.5, 9.0, 6],
    [1.8, 9.0, 5],
    [4.9, 9.3, 4],
    [8.3, 5.6, 3],
    [1.1, 5.6, 3],
  ]) {
    const l = new THREE.PointLight(0xffe0b8, i, 0, 2);
    l.position.set(x, 2.7, z);
    lights.add(l);
  }
  const fill = new THREE.HemisphereLight(0xfff5e8, 0x8a7a66, 0.6);
  lights.add(fill);
  lights.matrixAutoUpdate = false;
  lights.matrix.copy(room.matrix);
  scene.add(room, lights);
  const toWorld = (/** @type {number[]} */ p) => new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(room.matrix);

  // camera: close range, look-around (orbit a target a few centimetres ahead of the eye)
  const saved = {
    pos: camera.position.clone(),
    target: controls.target.clone(),
    near: camera.near,
    far: camera.far,
    fov: camera.fov,
    min: controls.minDistance,
    max: controls.maxDistance,
    polar: controls.maxPolarAngle,
    minPolar: controls.minPolarAngle,
    pan: controls.enablePan,
    rot: controls.autoRotate,
    speed: controls.rotateSpeed,
  };
  ctx.hide.forEach((o) => (o.userData.tourVis = o.visible) && (o.visible = false));
  S.tour = true;
  S.fly = null;
  S.zoomTo = null;
  camera.near = 0.08;
  camera.far = 4000;
  camera.fov = innerWidth < innerHeight ? 70 : 62;
  camera.updateProjectionMatrix();
  Object.assign(controls, {
    minDistance: 0.05,
    maxDistance: 0.06,
    maxPolarAngle: Math.PI * 0.86,
    minPolarAngle: Math.PI * 0.14,
    enablePan: false,
    autoRotate: false,
    rotateSpeed: -0.32,
  });
  let anim = null;
  const goTo = (/** @type {string} */ id, now = false) => {
    const n = /** @type {any} */ (NODES)[id];
    const eye = toWorld(n.eye),
      look = toWorld(n.look),
      dir = look.clone().sub(eye).normalize();
    const toT = eye.clone().add(dir.clone().multiplyScalar(0.055)),
      toP = eye.clone();
    // the camera sits behind the target; with a tiny distance the view turns about the eye
    if (now) {
      controls.target.copy(toT);
      camera.position.copy(toP);
    } else anim = { t0: performance.now(), fromP: camera.position.clone(), fromT: controls.target.clone(), toP, toT };
    ui.querySelectorAll('[data-room]').forEach((b) => b.classList.toggle('is-on', b.getAttribute('data-room') === id));
  };

  // the overlay: title, the note, room buttons, hotspots, close
  const ui = document.createElement('div');
  ui.className = 'tour';
  const render = () => {
    ui.innerHTML = `<header class="tour-top"><div><b>${w('title')}</b><small>${w('sub')}</small></div><button class="tour-x" type="button" aria-label="${w('close')}">×</button></header>
      <p class="tour-hint">${w('hint')}</p>
      <nav class="tour-rooms">${Object.keys(NODES)
        .map((k) => `<button type="button" data-room="${k}">${w('rooms')[k]}</button>`)
        .join('')}</nav>
      <p class="tour-note">${w('note')}</p>
      ${SPOTS.map((s, i) => `<div class="tour-spot" data-spot="${i}"><i></i><span><b>${s[lang()][0]}</b><small>${s[lang()][1]}</small></span></div>`).join('')}
      ${ctx.landmark ? `<div class="tour-spot tour-spot--far" data-far="1"><i></i><span><b>${lang() === 'zh' ? '国油双峰塔' : 'Petronas Twin Towers'}</b><small>${lang() === 'zh' ? '窗外景观' : 'the view from the window'}</small></span></div>` : ''}`;
    ui.querySelector('.tour-x')?.addEventListener('click', close);
    ui.querySelectorAll('[data-room]').forEach((b) =>
      b.addEventListener('click', () => goTo(/** @type {string} */ (b.getAttribute('data-room')))),
    );
    ui.querySelectorAll('.tour-spot').forEach((el) =>
      el.addEventListener('click', () => el.classList.toggle('is-open')),
    );
  };
  render();
  document.body.append(ui);
  document.body.classList.add('is-tour');
  const langObs = new MutationObserver(render);
  langObs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  goTo('living', true);
  ui.querySelector('[data-room="living"]')?.classList.add('is-on');

  // each frame: camera moves between rooms, hotspots follow the view
  const spots = SPOTS.map((s) => toWorld(s.at));
  const far = ctx.landmark ? new THREE.Vector3(ctx.landmark[0], 360, -ctx.landmark[1]) : null;
  const v = new THREE.Vector3();
  let raf = 0;
  const tick = (/** @type {number} */ now) => {
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / 900),
        e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      camera.position.lerpVectors(anim.fromP, anim.toP, e);
      controls.target.lerpVectors(anim.fromT, anim.toT, e);
      if (k >= 1) anim = null;
    }
    const els = ui.querySelectorAll('.tour-spot');
    els.forEach((el, i) => {
      const p = i < spots.length ? spots[i] : far;
      if (!p) return;
      v.copy(p).project(camera);
      const d = camera.position.distanceTo(p),
        inView = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && (i >= spots.length || d < 6.5);
      const h = /** @type {HTMLElement} */ (el);
      h.style.opacity = inView ? '1' : '0';
      h.style.pointerEvents = inView ? 'auto' : 'none';
      h.style.transform = `translate(${((v.x + 1) / 2) * innerWidth}px, ${((1 - v.y) / 2) * innerHeight}px)`;
    });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  const hideHint = () => ui.querySelector('.tour-hint')?.classList.add('is-gone');
  addEventListener('pointerdown', hideHint, { once: true });
  const esc = (/** @type {KeyboardEvent} */ e) => e.key === 'Escape' && close();
  addEventListener('keydown', esc);

  function close() {
    cancelAnimationFrame(raf);
    removeEventListener('keydown', esc);
    langObs.disconnect();
    scene.remove(room, lights);
    room.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    ui.remove();
    document.body.classList.remove('is-tour');
    ctx.hide.forEach((o) => (o.visible = o.userData.tourVis ?? true));
    camera.near = saved.near;
    camera.far = saved.far;
    camera.fov = saved.fov;
    camera.updateProjectionMatrix();
    Object.assign(controls, {
      minDistance: saved.min,
      maxDistance: saved.max,
      maxPolarAngle: saved.polar,
      minPolarAngle: saved.minPolar,
      enablePan: saved.pan,
      rotateSpeed: saved.speed,
    });
    camera.position.copy(saved.pos);
    controls.target.copy(saved.target);
    controls.update();
    S.tour = false;
    open_ = null;
    if (location.hash.startsWith('#tour')) history.replaceState(null, '', location.pathname + location.search);
  }
  open_ = { close };
}
