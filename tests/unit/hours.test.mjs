import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, isNightAt, isOpen, nowAt, parseHours } from '../../src/map/core/hours.js';

test('parseHours reads the CMS text', () => {
  assert.deepEqual(parseHours('Mondays to Sundays, 10:00am – 10:00pm'), { open: 600, close: 1320 });
  assert.deepEqual(parseHours('10am-10pm'), { open: 600, close: 1320 });
  assert.deepEqual(parseHours('9:30 AM to 9:30 PM'), { open: 570, close: 1290 });
  assert.deepEqual(parseHours('12pm - 12am'), { open: 720, close: 0 });
  assert.equal(parseHours('Open daily'), null);
  assert.equal(parseHours(undefined), null);
});

test('isOpen, including hours past midnight', () => {
  const day = { open: 600, close: 1320 };
  assert.equal(isOpen(day, 599), false);
  assert.equal(isOpen(day, 600), true);
  assert.equal(isOpen(day, 1319), true);
  assert.equal(isOpen(day, 1320), false);
  const late = { open: 600, close: 60 }; // 10am – 1am
  assert.equal(isOpen(late, 30), true);
  assert.equal(isOpen(late, 120), false);
  assert.equal(isOpen(late, 1400), true);
  assert.equal(isOpen(null, 700), false);
});

test('night runs from 6pm to 6am', () => {
  assert.equal(isNightAt(5 * 60 + 59), true);
  assert.equal(isNightAt(6 * 60), false);
  assert.equal(isNightAt(12 * 60), false);
  assert.equal(isNightAt(17 * 60 + 59), false);
  assert.equal(isNightAt(18 * 60), true);
  assert.equal(isNightAt(0), true);
});

test('formatTime', () => {
  assert.equal(formatTime(600), '10am');
  assert.equal(formatTime(1320), '10pm');
  assert.equal(formatTime(570), '9:30am');
  assert.equal(formatTime(720), '12pm');
  assert.equal(formatTime(0), '12am');
});

test("nowAt uses the site's time zone", () => {
  assert.equal(nowAt('Asia/Taipei', new Date('2026-01-01T02:30:00Z')), 10 * 60 + 30);
  assert.equal(nowAt('Asia/Kuala_Lumpur', new Date('2026-01-01T02:30:00Z')), 10 * 60 + 30);
  assert.equal(nowAt('Asia/Kuala_Lumpur', new Date('2026-01-01T20:00:00Z')), 4 * 60);
});
