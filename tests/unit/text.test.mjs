import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, floorName, initials, storeSlug } from '../../src/map/core/text.js';

test('esc makes text safe for innerHTML', () => {
  assert.equal(esc('<b>"A&B"</b>'), '&lt;b&gt;&quot;A&amp;B&quot;&lt;/b&gt;');
  assert.equal(esc(null), '');
  assert.equal(esc(42), '42');
});

test('initials: up to two letters, punctuation ignored', () => {
  assert.equal(initials('Coffee Bean & Tea Leaf'), 'CB');
  assert.equal(initials('watsons'), 'W');
  assert.equal(initials('A&W'), 'A');
  assert.equal(initials('名創 優品'), '名優');
  assert.equal(initials(''), '');
});

test('storeSlug is stable and URL-safe', () => {
  assert.equal(storeSlug({ name: 'Starbucks', unit: 'LG-11' }), 'starbucks-lg11');
  assert.equal(storeSlug({ name: 'Beauté Library', unit: '33' }), 'beaute-library-33');
  assert.equal(storeSlug({ name: "Dunkin' Donuts!", unit: 'G 05' }), 'dunkin-donuts-g05');
  assert.match(storeSlug({ name: '¿¿', unit: '' }), /^[a-z0-9-]*$/);
});

test("floorName uses the site's short names, else the code", () => {
  const short = { 1: 'L1', 2: 'L2', B1: 'B1' };
  assert.equal(floorName('1', short), 'L1');
  assert.equal(floorName('2', short), 'L2');
  assert.equal(floorName('LG', short), 'LG');
  assert.equal(floorName('G'), 'G');
});

import { fill } from '../../src/map/core/fill.js';
test('fill puts values into {placeholders} and leaves unknown ones', () => {
  assert.equal(
    fill('Find {name} on {floor}, unit {unit}.', { name: 'Starbucks', floor: 'LG', unit: 11 }),
    'Find Starbucks on LG, unit 11.',
  );
  assert.equal(fill('{who} and {name}', { name: 'A' }), '{who} and A');
  assert.equal(fill(undefined, {}), '');
});

test('isGenericName: drops "Tower 2", "Blok 3", single letters; keeps real names', async () => {
  const { isGenericName } = await import('../../src/map/core/text.js');
  for (const n of ['Tower 2', 'Blok 3', 'B', 'East Wing', 'Block A1', 'Wisma X Block B', 'A-1'])
    assert.equal(isGenericName(n), true, n);
  for (const n of ['Menara Maxis', 'Suria KLCC', 'Tower Regency', 'ONE KL', 'Four Seasons Place Kuala Lumpur'])
    assert.equal(isGenericName(n), false, n);
});
