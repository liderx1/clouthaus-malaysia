// Architecture checks on the map's module graph (read from the import lines of src/map).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src/map';
const files = fs
  .readdirSync(ROOT, { recursive: true })
  .filter((f) => f.endsWith('.js') && !f.startsWith('vendor'))
  .map((f) => f.split(path.sep).join('/'));
const graph = new Map(
  files.map((f) => {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const deps = [...src.matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+'(\.[^']+)'|^\s*import\s+'(\.[^']+)'/gm)]
      .map((m) => path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1] || m[2])))
      .filter((d) => d.endsWith('.js') && !d.startsWith('vendor/'));
    return [f, deps];
  }),
);

const SCENE = [
  'stage',
  'ground',
  'rail',
  'buildings',
  'mall',
  'trees',
  'traffic',
  'labels',
  'markers',
  'pin',
  'routes',
];
const UI = ['ui', 'content', 'modes', 'dock', 'main', 'preview', 'loop'];

test('every import points at a file that exists', () => {
  for (const [f, deps] of graph) for (const d of deps) assert.ok(graph.has(d), `${f} imports missing ${d}`);
});

test('the module graph has no cycles', () => {
  const state = new Map();
  const visit = (f, trail) => {
    if (state.get(f) === 'done') return;
    assert.notEqual(state.get(f), 'open', `import cycle: ${[...trail, f].join(' → ')}`);
    state.set(f, 'open');
    for (const d of graph.get(f) ?? []) visit(d, [...trail, f]);
    state.set(f, 'done');
  };
  for (const f of graph.keys()) visit(f, []);
});

test('the 3D scene never imports the UI (clicks go through the event bus)', () => {
  for (const s of SCENE)
    for (const d of graph.get(`${s}.js`) ?? [])
      assert.ok(!UI.includes(d.replace(/\.js$/, '')), `${s}.js imports UI module ${d}`);
});

test('core/ is pure: no three.js, no DOM, no imports from outside core', () => {
  for (const f of files.filter((f) => f.startsWith('core/'))) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!/from 'three'/.test(src), `${f} imports three`);
    assert.ok(
      !/\b(document|window|location|innerWidth)\b/.test(src.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')),
      `${f} touches the DOM`,
    );
    for (const d of graph.get(f)) assert.ok(d.startsWith('core/'), `${f} imports ${d}`);
  }
});

test('every module is reachable from index.js (nothing left orphaned)', () => {
  const seen = new Set();
  const walk = (f) => {
    if (seen.has(f)) return;
    seen.add(f);
    for (const d of graph.get(f) ?? []) walk(d);
  };
  walk('index.js');
  for (const f of files) assert.ok(seen.has(f), `${f} is not loaded by anything`);
});
