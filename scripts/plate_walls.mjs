// Builds public/map/plate.json, the 3D structure of the typical floor: the walls are read straight from the
// developer's typical floor plan (seed/typical-floor-plan.jpg) — every dark, thick stroke inside the floor
// becomes a wall, door swings and thin lines are dropped — and merged into rectangles in metres in the tower's frame
// (u toward The Exchange 106, v toward KL City Centre). The units, their rooms and dimensions come from
// seed/plate-units.json (digitised from the same plan and each type's plan).
// Run: node scripts/plate_walls.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const units = JSON.parse(fs.readFileSync('seed/plate-units.json', 'utf8'));
const SRC = 'seed/typical-floor-plan.jpg'; // the developer's typical floor plan, full size
const FULL = 1800; // the units were digitised on the 1800 px original; the web copy is smaller
const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const k = info.width / FULL;
const PX = units.px * k,
  CX = 873.5 * k,
  CY = 511 * k;
const [x0, y0, x1, y1] = [302 * k, 237 * k, 1445 * k, 785 * k].map(Math.round);
const W = info.width;
const dark = (x, y) => {
  const i = (y * W + x) * 3,
    r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  return 0.299 * r + 0.587 * g + 0.114 * b < 88 && Math.max(r, g, b) - Math.min(r, g, b) < 30;
};
// the mask, then an opening (2 × 2) so hairlines and door arcs go and walls stay
const w = x1 - x0,
  h = y1 - y0,
  raw = new Uint8Array(w * h),
  mask = new Uint8Array(w * h);
for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) raw[y * w + x] = dark(x0 + x, y0 + y) ? 1 : 0;
const at = (a, x, y) => (x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : 0);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    let keep = 0;
    for (const [dx, dy] of [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ])
      if (at(raw, x + dx, y + dy) && at(raw, x + dx + 1, y + dy) && at(raw, x + dx, y + dy + 1) && at(raw, x + dx + 1, y + dy + 1)) keep = 1;
    mask[y * w + x] = keep;
  }
// greedy rectangles: grow right along a row, then down while the whole span stays wall
const used = new Uint8Array(w * h),
  rects = [];
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    if (!mask[y * w + x] || used[y * w + x]) continue;
    let x2 = x;
    while (x2 + 1 < w && mask[y * w + x2 + 1] && !used[y * w + x2 + 1]) x2++;
    let y2 = y;
    grow: while (y2 + 1 < h) {
      for (let xx = x; xx <= x2; xx++) if (!mask[(y2 + 1) * w + xx] || used[(y2 + 1) * w + xx]) break grow;
      y2++;
    }
    for (let yy = y; yy <= y2; yy++) for (let xx = x; xx <= x2; xx++) used[yy * w + xx] = 1;
    if ((x2 - x + 1) * (y2 - y + 1) < 4) continue;
    const u = (px) => +((px + x0 - CX) / PX).toFixed(2),
      v = (py) => +((CY - (py + y0)) / PX).toFixed(2);
    rects.push([u(x), v(y2 + 1), u(x2 + 1), v(y)]);
  }
fs.writeFileSync('public/map/plate.json', JSON.stringify({ ...units, walls: rects }));
console.log(`plate: ${rects.length} wall pieces, ${(fs.statSync('public/map/plate.json').size / 1024).toFixed(0)} KB`);
