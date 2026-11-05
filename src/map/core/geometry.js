// Pure geometry on polylines and polygons in local metres ([x east, y north, z?]). No three.js, no DOM: unit-tested.

/** @typedef {number[]} Pt  [x, y] or [x, y, z] */

/**
 * a closed ring without its repeated last point
 * @param {Pt[]} p
 */
export function ring(p) {
  const last = p[p.length - 1];
  return p.length > 1 && p[0][0] === last[0] && p[0][1] === last[1] ? p.slice(0, -1) : p;
}
/** signed area: positive when counter-clockwise @param {Pt[]} p */
export const area = (p) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i],
      [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
};
/** @param {number} x @param {number} y @param {Pt[]} p */
export const inPoly = (x, y, p) => {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i],
      [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/** a small seeded random generator, so the city looks the same on every visit */
/** @param {number} seed @returns {() => number} */
export const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
/** a repeatable pseudo-random number in [0, 1) for n @param {number} n */
export const hash = (n) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
/** @param {Pt[]} p */
export function polyLen(p) {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
}
/**
 * point + direction at distance s along polyline p (cum = cumulative(p))
 * @param {Pt[]} p
 * @param {number[]} cum
 * @param {number} s
 */
export function sampleAt(p, cum, s) {
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const a = p[i - 1],
    b = p[i],
    seg = cum[i] - cum[i - 1] || 1,
    k = Math.min(1, Math.max(0, (s - cum[i - 1]) / seg));
  return {
    x: a[0] + (b[0] - a[0]) * k,
    y: a[1] + (b[1] - a[1]) * k,
    dx: (b[0] - a[0]) / seg,
    dy: (b[1] - a[1]) / seg,
    z: (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * k,
  };
}
/** distance along p at each point @param {Pt[]} p @returns {number[]} */
export const cumulative = (p) =>
  p.reduce(
    (/** @type {number[]} */ acc, q, i) => (
      acc.push(i ? acc[i - 1] + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0),
      acc
    ),
    [],
  );
