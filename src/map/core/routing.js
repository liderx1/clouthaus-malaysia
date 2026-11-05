// Shortest paths on the OSM road network. Pure: unit-tested.

/**
 * road graph keyed by "x,y": node = { q: [x, y, z], e: [[neighbour, cost], …] }.
 * roads: [{ t: type, p: [[x, y], …], oneway }]; `slow` types (footways) cost a little less so walks prefer them.
 * @typedef {Map<string, { q: number[], e: [string, number][] }>} Graph
 * @param {{ t: string, p: number[][], oneway?: boolean }[]} roads
 * @param {Set<string>} types
 * @param {{ oneway?: boolean, zOf?: (road: any) => number, slow?: Set<string> }} [opts]
 */
export function buildGraph(roads, types, { oneway = false, zOf = () => 0, slow = new Set() } = {}) {
  /** @type {Graph} */
  const N = new Map(),
    id = (/** @type {number[]} */ q) => `${q[0]},${q[1]}`;
  /** the node at key k (created at point q), raised to the highest road level z through it */
  const node = (/** @type {string} */ k, /** @type {number[]} */ q, /** @type {number} */ z) => {
    let n = N.get(k);
    if (!n) N.set(k, (n = { q: [q[0], q[1], z], e: [] }));
    else if (z > n.q[2]) n.q[2] = z;
    return n;
  };
  for (const r of roads) {
    if (!types.has(r.t)) continue;
    const z = zOf(r),
      w = slow.has(r.t) ? 0.85 : 1;
    for (let i = 1; i < r.p.length; i++) {
      const a = id(r.p[i - 1]),
        b = id(r.p[i]);
      const L = Math.hypot(r.p[i][0] - r.p[i - 1][0], r.p[i][1] - r.p[i - 1][1]) * w;
      node(a, r.p[i - 1], z).e.push([b, L]);
      const B = node(b, r.p[i], z);
      if (!(oneway && r.oneway)) B.e.push([a, L]);
    }
  }
  return N;
}
/**
 * closest node to (x, y), optionally only nodes passing `filter`
 * @param {Graph} N @param {number} x @param {number} y
 * @param {(node: { q: number[] }) => boolean} [filter]
 * @returns {string | undefined}
 */
export function nearest(N, x, y, filter) {
  let best,
    bd = Infinity;
  for (const [k, n] of N) {
    if (filter && !filter(n)) continue;
    const d = Math.hypot(n.q[0] - x, n.q[1] - y);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}
/**
 * shortest path from node s to node g as a list of [x, y, z], or null when unreachable
 * @param {Graph} N @param {string} s @param {string} g
 * @returns {number[][] | null}
 */
export function dijkstra(N, s, g) {
  /** @type {Map<string, number>} */
  const D = new Map([[s, 0]]),
    /** @type {Map<string, string>} */
    P = new Map(),
    /** @type {[number, string][]} */
    H = [[0, s]],
    done = new Set();
  const push = (/** @type {[number, string]} */ it) => {
    H.push(it);
    let i = H.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (H[p][0] <= H[i][0]) break;
      [H[p], H[i]] = [H[i], H[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = H[0],
      last = /** @type {[number, string]} */ (H.pop());
    if (H.length) {
      H[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1,
          r = l + 1;
        let m = i;
        if (l < H.length && H[l][0] < H[m][0]) m = l;
        if (r < H.length && H[r][0] < H[m][0]) m = r;
        if (m === i) break;
        [H[m], H[i]] = [H[i], H[m]];
        i = m;
      }
    }
    return top;
  };
  while (H.length) {
    const [d, u] = pop();
    if (done.has(u)) continue;
    done.add(u);
    if (u === g) break;
    for (const [v, w] of N.get(u)?.e ?? []) {
      const nd = d + w;
      if (nd < (D.get(v) ?? Infinity)) {
        D.set(v, nd);
        P.set(v, u);
        push([nd, v]);
      }
    }
  }
  if (!D.has(g)) return null;
  const path = [g];
  while (path[0] !== s) path.unshift(/** @type {string} */ (P.get(path[0])));
  return path.map((k) => /** @type {{ q: number[] }} */ (N.get(k)).q);
}
