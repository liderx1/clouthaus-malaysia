import * as THREE from 'three';
import { OSM, ring } from './data.js';

/* ---------- geometry helpers ---------- */
export { area, inPoly, hash, polyLen, sampleAt, cumulative } from './core/geometry.js';
export { initials } from './core/text.js';
import { inPoly, seeded } from './core/geometry.js';
export const rand = seeded(1234567);
export const hexCol = (h, j = 0) => {
  const c = new THREE.Color(h);
  if (j) c.offsetHSL(0, 0, (rand() - 0.5) * j);
  return c;
};

// spatial hashes so trees and pins stay off buildings and roads
export const CELL = 30,
  bGrid = new Map(),
  rGrid = new Map();
export const key = (x, y) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
OSM.buildings.forEach((b, i) => {
  const r = ring(b.p);
  const xs = r.map((q) => q[0]),
    ys = r.map((q) => q[1]);
  for (let x = Math.min(...xs); x <= Math.max(...xs) + CELL; x += CELL)
    for (let y = Math.min(...ys); y <= Math.max(...ys) + CELL; y += CELL) {
      const k = key(x, y);
      (bGrid.get(k) || bGrid.set(k, []).get(k)).push(i);
    }
});
export const onBuilding = (x, y) => (bGrid.get(key(x, y)) || []).some((i) => inPoly(x, y, ring(OSM.buildings[i].p)));
