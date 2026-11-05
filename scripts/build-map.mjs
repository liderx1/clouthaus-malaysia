// Bundles src/map/*.js into public/map/map.js (three.js stays external, loaded through the page's import map).
// `--watch` rebuilds on every save while working on the map.
import fs from 'node:fs';
import { build, context } from 'esbuild';

// raised from 120 KB when the EZ-Tree generator (~22 KB) came in for the trees near the camera
const BUDGET_KB = 140;

const options = {
  entryPoints: ['src/map/index.js'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  external: ['three', 'three/*'],
  outfile: 'public/map/map.js',
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  logLevel: 'warning',
};
if (process.argv.includes('--watch')) {
  await (await context(options)).watch();
  console.log('map: watching src/map');
} else {
  await build(options);
  // performance budget: the map script is downloaded before anything shows, so keep it small
  const kb = fs.statSync(options.outfile).size / 1024;
  if (kb > BUDGET_KB) throw new Error(`map.js is ${kb.toFixed(0)} KB, over the ${BUDGET_KB} KB budget`);
  console.log(`map: bundled public/map/map.js (${kb.toFixed(0)} KB of ${BUDGET_KB} KB budget)`);
}
