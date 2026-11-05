import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, dijkstra, nearest } from '../../src/map/core/routing.js';

// a square block with a diagonal footpath:  (0,0) ── (10,0)
//                                              │   ╲    │
//                                            (0,10) ─ (10,10)
const roads = [
  {
    t: 'residential',
    p: [
      [0, 0],
      [10, 0],
      [10, 10],
    ],
  },
  {
    t: 'residential',
    p: [
      [0, 0],
      [0, 10],
      [10, 10],
    ],
  },
  {
    t: 'footway',
    p: [
      [0, 0],
      [10, 10],
    ],
  },
  {
    t: 'primary',
    p: [
      [10, 10],
      [20, 10],
    ],
    oneway: true,
  },
];
const walk = new Set(['residential', 'footway']);
const drive = new Set(['residential', 'primary']);

test('walking takes the diagonal footpath', () => {
  const N = buildGraph(roads, walk, { slow: new Set(['footway']) });
  const path = dijkstra(N, '0,0', '10,10');
  assert.deepEqual(
    path.map((q) => q.slice(0, 2)),
    [
      [0, 0],
      [10, 10],
    ],
  );
});

test('driving goes round the block and ignores the footpath', () => {
  const N = buildGraph(roads, drive, { oneway: true });
  const path = dijkstra(N, '0,0', '10,10');
  assert.equal(path.length, 3);
  assert.deepEqual(path[0].slice(0, 2), [0, 0]);
  assert.deepEqual(path.at(-1).slice(0, 2), [10, 10]);
});

test('one-way streets are only driven one way', () => {
  const N = buildGraph(roads, drive, { oneway: true });
  assert.ok(dijkstra(N, '10,10', '20,10'));
  assert.equal(dijkstra(N, '20,10', '10,10'), null);
  const both = buildGraph(roads, drive, { oneway: false });
  assert.ok(dijkstra(both, '20,10', '10,10'));
});

test('nodes keep the highest road level (bridges over streets)', () => {
  const N = buildGraph(roads, drive, { zOf: (r) => (r.t === 'primary' ? 6 : 0) });
  assert.equal(N.get('10,10').q[2], 6);
  assert.equal(N.get('0,0').q[2], 0);
});

test('nearest node, with a filter', () => {
  const N = buildGraph(roads, walk);
  assert.equal(nearest(N, 1, 2), '0,0');
  assert.equal(nearest(N, 9, 9), '10,10');
  assert.equal(
    nearest(N, 1, 2, (n) => n.q[0] > 5),
    '10,0',
  );
});
