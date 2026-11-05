// Label decluttering: which labels show and where, so no two overlap. Pure: unit-tested.

const H = 32; // label height incl. padding
const SHIFTS = [0, -0.6, 0.6, -1.1, 1.1]; // sideways nudges, in label widths

/** total area of r covered by the boxes in qs @param {number[]} r @param {number[][]} qs */
const overlap = (r, qs) =>
  qs.reduce(
    (sum, q) =>
      sum +
      Math.max(0, Math.min(r[2], q[2]) - Math.max(r[0], q[0])) *
        Math.max(0, Math.min(r[3], q[3]) - Math.max(r[1], q[1])),
    0,
  );

/**
 * Place labels in priority order (most important first).
 * item: { sx, sy, w, must, key } — screen anchor, width; `must` labels look for the nearest free spot
 * (straight up a row at a time, then nudged sideways), `key` ones may stack higher and always show.
 * Others show only where they fit as they are, up to `max`.
 * `blocked`: boxes no label may cover (the store pin drawn in the scene).
 * Returns [{ shown, dx, dy, r }] in the same order; r is the box taken [x0, y0, x1, y1].
 */
/**
 * @param {{ sx: number, sy: number, w: number, must?: boolean, key?: boolean }[]} items
 * @param {{ width: number, top: number, max?: number, blocked?: number[][] }} screen
 * @returns {{ shown: boolean, dx: number, dy: number, r?: number[] }[]}
 */
export function placeLabels(items, { width, top, max = 60, blocked = [] }) {
  /** @type {number[][]} */
  const placed = [];
  /** @param {number[]} r */
  const free = (r) =>
    r[1] > top && ![...blocked, ...placed].some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
  return items.map((L) => {
    const W = L.w + 8;
    /** @param {number} x */
    const clampX = (x) => Math.min(Math.max(x, W / 2 + 8), width - W / 2 - 8);
    /** @param {number} cx @param {number} k row */
    const box = (cx, k) => [cx - W / 2 - 3, L.sy - H - 14 - k * (H + 2), cx + W / 2 + 3, L.sy - 12 - k * (H + 2)];
    if (!L.must) {
      const r = box(L.sx, 0);
      if (placed.length < max && r[0] >= 4 && r[2] <= width - 4 && free(r)) {
        placed.push(r);
        return { shown: true, dx: 0, dy: 0, r };
      }
      return { shown: false, dx: 0, dy: 0 };
    }
    const lim = L.key ? 10 : 3;
    /** @type {{ r: number[], cx: number, k: number } | null} */
    let best = null;
    for (let k = 0; k <= lim && !best; k++)
      for (const sh of SHIFTS) {
        const cx = clampX(L.sx + sh * (W + 6)),
          r = box(cx, k);
        if (free(r)) {
          best = { r, cx, k };
          break;
        }
      }
    // key labels must show. Still no room (a small phone, many labels): look further sideways, then settle for the spot
    // that overlaps least, never covering the pin or a button (blocked boxes weigh far more than other labels)
    if (!best && L.key) {
      let least = Infinity;
      for (let k = 0; k <= lim; k++)
        for (const sh of [...SHIFTS, -1.7, 1.7, -2.4, 2.4]) {
          const cx = clampX(L.sx + sh * (W + 6)),
            r = box(cx, k);
          if (r[1] <= top) continue;
          if (free(r)) {
            least = -1;
            best = { r, cx, k };
            break;
          }
          const cost = overlap(r, blocked) * 50 + overlap(r, placed) + k * 40;
          if (cost < least) {
            least = cost;
            best = { r, cx, k };
          }
        }
      best ??= { r: box(clampX(L.sx), 0), cx: clampX(L.sx), k: 0 };
    }
    if (!best) return { shown: false, dx: 0, dy: 0 };
    placed.push(best.r);
    return { shown: true, dx: best.cx - L.sx, dy: best.k ? -best.k * (H + 2) : 0, r: best.r };
  });
}
