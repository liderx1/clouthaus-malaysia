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
