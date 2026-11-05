import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeLabels } from '../../src/map/core/placement.js';

const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const noOverlaps = (out) => {
  const boxes = out.filter((o) => o.shown).map((o) => o.r);
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) assert.ok(!overlap(boxes[i], boxes[j]), `labels ${i} and ${j} overlap`);
};

test('a lone label sits right above its anchor', () => {
  const [o] = placeLabels([{ sx: 500, sy: 400, w: 80, must: true, key: true }], { width: 1440, top: 84 });
  assert.deepEqual([o.shown, o.dx, o.dy], [true, 0, 0]);
});

test('labels on the same spot stack or move aside, never overlap', () => {
  const items = Array.from({ length: 8 }, () => ({ sx: 700, sy: 600, w: 120, must: true, key: true }));
  const out = placeLabels(items, { width: 1440, top: 84 });
  assert.ok(out.every((o) => o.shown));
  noOverlaps(out);
});

test('optional labels hide instead of overlapping', () => {
  const items = [
    { sx: 700, sy: 600, w: 120, must: true, key: true },
    { sx: 710, sy: 600, w: 120, must: false },
    { sx: 1100, sy: 600, w: 120, must: false },
  ];
  const out = placeLabels(items, { width: 1440, top: 84 });
  assert.deepEqual(
    out.map((o) => o.shown),
    [true, false, true],
  );
});

test('labels stay inside a phone screen', () => {
  const width = 390;
  const items = [
    { sx: 5, sy: 500, w: 150, must: true, key: true },
    { sx: 385, sy: 500, w: 150, must: true, key: true },
    { sx: 195, sy: 500, w: 150, must: true, key: true },
    { sx: 200, sy: 505, w: 150, must: true, key: true },
  ];
  const out = placeLabels(items, { width, top: 64 });
  noOverlaps(out);
  for (const o of out.filter((o) => o.shown)) assert.ok(o.r[0] >= 0 && o.r[2] <= width, `box ${o.r} off screen`);
});

test('optional labels that would be cut off at the screen edge hide', () => {
  const out = placeLabels([{ sx: 1420, sy: 500, w: 120, must: false }], { width: 1440, top: 84 });
  assert.equal(out[0].shown, false);
});

test('labels keep clear of blocked boxes (the store pin)', () => {
  const pin = [470, 330, 530, 410];
  const out = placeLabels([{ sx: 500, sy: 420, w: 120, must: true, key: true }], {
    width: 1440,
    top: 84,
    blocked: [pin],
  });
  assert.ok(out[0].shown);
  const r = /** @type {number[]} */ (out[0].r);
  assert.ok(!(r[0] < pin[2] && r[2] > pin[0] && r[1] < pin[3] && r[3] > pin[1]), `label ${r} covers the pin`);
});

test('a crowded small screen still keeps key labels off the pin and each other where it can', () => {
  // eight entrance labels bunched on a 360 px phone, under a pin
  const pin = [150, 300, 210, 380];
  const items = Array.from({ length: 8 }, (_, i) => ({
    sx: 150 + (i % 3) * 30,
    sy: 360 + (i % 2) * 20,
    w: 130,
    must: true,
    key: true,
  }));
  const out = placeLabels(items, { width: 360, top: 64, blocked: [pin] });
  assert.ok(out.every((o) => o.shown));
  for (const o of out) {
    const r = /** @type {number[]} */ (o.r);
    assert.ok(!(r[0] < pin[2] && r[2] > pin[0] && r[1] < pin[3] && r[3] > pin[1]), `label ${r} covers the pin`);
  }
  noOverlaps(out);
});

test('nothing is placed above the top bar', () => {
  const out = placeLabels([{ sx: 500, sy: 100, w: 80, must: false }], { width: 1440, top: 84 });
  assert.equal(out[0].shown, false);
});

test('optional labels respect the cap', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ sx: 60 + i * 130, sy: 500, w: 80, must: false }));
  assert.equal(placeLabels(items, { width: 1440, top: 84, max: 4 }).filter((o) => o.shown).length, 4);
});
