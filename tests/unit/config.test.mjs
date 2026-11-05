// site.config.json is filled in by hand for every new site: check it against site.config.schema.json before anything
// is built (a typo here would otherwise only show as a broken map).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const schema = JSON.parse(fs.readFileSync('site.config.schema.json', 'utf8'));

test('required settings are there and nothing unknown', () => {
  for (const k of schema.required) assert.ok(k in config, `site.config.json is missing "${k}"`);
  for (const k of Object.keys(config))
    assert.ok(k in schema.properties, `site.config.json has an unknown setting "${k}"`);
  for (const k of Object.keys(config.main)) assert.ok(k in schema.properties.main.properties, `unknown main.${k}`);
});

test('languages are supported, and every translated text is for one of them', () => {
  const ok = schema.properties.locales.items.enum;
  assert.ok(config.locales.length > 0);
  for (const l of config.locales)
    assert.ok(ok.includes(l), `unsupported language "${l}" (supported: ${ok.join(', ')})`);
  for (const l of Object.keys(config.text ?? {}))
    assert.ok(config.locales.includes(l), `text for "${l}", which is not in locales`);
  for (const l of Object.keys(config.seo ?? {}).filter((k) => k !== 'shareImage'))
    assert.ok(config.locales.includes(l), `seo for "${l}", which is not in locales`);
});

test('the map centre, size and main building make sense', () => {
  const { lat, lon, radius } = config.origin;
  assert.ok(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180, 'origin lat / lon out of range');
  assert.ok(radius >= 200 && radius <= 3000, 'origin.radius should be 200–3000 m');
  assert.ok(config.main.height > 0 && config.main.height < 700, 'main.height in metres');
  new Intl.DateTimeFormat('en', { timeZone: config.timezone }); // throws on an unknown time zone
  assert.ok(fs.existsSync(`public${config.logo}`), `logo ${config.logo} not found under public/`);
});

test('driving starts end in -north or -south (routes start at that end of the main road)', () => {
  for (const s of config.drive?.starts ?? []) assert.match(s.value, /-(north|south)$|^(north|south)$/);
});

test('floors have unique codes and rise from bottom to top', () => {
  const codes = config.floors.map((f) => f.code);
  assert.equal(new Set(codes).size, codes.length, 'duplicate floor code');
  for (let i = 1; i < config.floors.length; i++)
    assert.ok(config.floors[i].z > config.floors[i - 1].z, 'floors must be listed bottom to top');
  assert.ok(config.floors.at(-1).z <= config.main.height + 1, 'a floor above the top of the building');
});

test('site extras name a module that exists', () => {
  if (config.extras) assert.ok(fs.existsSync(`src/map/sites/${config.extras}.js`), `src/map/sites/${config.extras}.js`);
});
