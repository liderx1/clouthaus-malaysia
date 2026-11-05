import { test } from 'node:test';
import assert from 'node:assert/strict';
import { area, cumulative, hash, inPoly, polyLen, ring, sampleAt, seeded } from '../../src/map/core/geometry.js';

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

test('ring drops the repeated closing point', () => {
  assert.equal(ring([...square, [0, 0]]).length, 4);
  assert.equal(ring(square).length, 4);
});

test('area is signed by winding', () => {
  assert.equal(area(square), 100);
  assert.equal(area([...square].reverse()), -100);
});

test('inPoly', () => {
  assert.equal(inPoly(5, 5, square), true);
  assert.equal(inPoly(15, 5, square), false);
  assert.equal(inPoly(-1, -1, square), false);
});

test('polyLen, cumulative and sampleAt walk a polyline', () => {
  const p = [
    [0, 0, 0],
    [3, 4, 0],
    [3, 10, 6],
  ];
  assert.equal(polyLen(p), 11);
  assert.deepEqual(cumulative(p), [0, 5, 11]);
  const mid = sampleAt(p, cumulative(p), 2.5);
  assert.deepEqual([mid.x, mid.y], [1.5, 2]);
  const up = sampleAt(p, cumulative(p), 8);
  assert.deepEqual([up.x, up.y, up.z], [3, 7, 3]);
  const past = sampleAt(p, cumulative(p), 99);
  assert.deepEqual([past.x, past.y], [3, 10]);
});

test('seeded random is repeatable and in [0, 1)', () => {
  const a = seeded(1234567),
    b = seeded(1234567);
  const xs = Array.from({ length: 100 }, a);
  assert.deepEqual(xs, Array.from({ length: 100 }, b));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.ok(hash(3) >= 0 && hash(3) < 1 && hash(3) === hash(3));
});

test('chainLines joins pieces end to end, flipping reversed ones', async () => {
  const { chainLines } = await import('../../src/map/core/geometry.js');
  const out = chainLines([
    [
      [10, 0],
      [20, 0],
    ],
    [
      [0, 0],
      [10, 0],
    ],
    [
      [30, 0],
      [20.5, 0],
    ],
    [
      [100, 100],
      [101, 100],
    ],
  ]);
  assert.equal(out.length, 2);
  assert.deepEqual(
    out[0].map((q) => q[0]),
    [0, 10, 20, 30],
  );
  assert.equal(polyLen(out[1]), 1);
});

test('roundedRect: size, winding and which way the long side faces', async () => {
  const { roundedRect } = await import('../../src/map/core/geometry.js');
  const r = roundedRect(0, 0, 50, 20, 4, 90); // long side faces east
  assert.ok(area(r) > 0, 'counter-clockwise');
  const xs = r.map((q) => q[0]),
    ys = r.map((q) => q[1]);
  assert.ok(Math.abs(Math.max(...xs) - 10) < 0.01 && Math.abs(Math.min(...xs) + 10) < 0.01, 'depth along east–west');
  assert.ok(Math.abs(Math.max(...ys) - 25) < 0.01, 'length along north–south');
  assert.ok(Math.abs(area(r)) < 50 * 20 && Math.abs(area(r)) > 50 * 20 - 4 * 4 * 4, 'corners are rounded off');
});
