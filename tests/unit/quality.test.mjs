import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQuality } from '../../src/map/core/quality.js';

const run = (q, list, t0 = 0) => list.map((ms, i) => q.update(ms, t0 + i * 1000));

test('starts sharp and ignores the first seconds after loading', () => {
  const q = createQuality({ max: 2 });
  assert.deepEqual(run(q, [60, 60, 60]), [2, 2, 2]);
});

test('slow frames lower the resolution a step at a time, down to the floor', () => {
  const q = createQuality({ max: 2 });
  const out = run(q, [16, 16, 16, 40, 40, 40, 40, 40, 40, 40]);
  assert.deepEqual(out.slice(3), [1.75, 1.5, 1.25, 1, 0.75, 0.75, 0.75]);
});

test('a phone locked at 60 Hz (16.7 ms) climbs back up — the old rule (under 15 ms) never did', () => {
  const q = createQuality({ max: 2 });
  run(q, [16, 16, 16, 40, 40]); // dropped to 1.5 during a hiccup
  const later = run(q, Array(80).fill(16.7), 40000); // well after the 30 s ceiling expires
  assert.equal(later.at(-1), 2);
});

test('a level that was too slow is not retried for 30 s (no flicker between sharp and soft)', () => {
  const q = createQuality({ max: 2 });
  run(q, [16, 16, 16]);
  assert.equal(q.update(40, 3000), 1.75); // 2 was too slow
  const next = run(q, Array(20).fill(16.7), 4000); // 20 smooth seconds, inside the 30 s window
  assert.ok(
    next.every((l) => l <= 1.75),
    `went back to 2 too soon: ${next}`,
  );
  assert.equal(run(q, Array(4).fill(16.7), 40000).at(-1), 2); // after the window it may try again
});

test('in-between frame times hold the level', () => {
  const q = createQuality({ max: 2 });
  assert.deepEqual(run(q, [16, 16, 16, 22, 22, 22, 22]).slice(3), [2, 2, 2, 2]);
});

test('pause restarts the warm-up', () => {
  const q = createQuality({ max: 2 });
  run(q, [16, 16, 16]);
  q.pause();
  assert.deepEqual(run(q, [90, 90, 90], 5000), [2, 2, 2]);
});

test('as configured on the site: only a device under 20 fps for 5 s in a row steps down', () => {
  const q = createQuality({ max: 2, slowMs: 50, slowRun: 5 });
  run(q, [16, 16, 16]);
  // a few slow seconds (a day / night change, a busy moment) keep full quality
  assert.deepEqual(run(q, [40, 60, 60, 60, 60, 16, 60, 60], 3000), [2, 2, 2, 2, 2, 2, 2, 2]);
  // five slow seconds in a row: one step down
  assert.equal(run(q, [60, 60, 60, 60, 60], 20000).at(-1), 1.75);
});
