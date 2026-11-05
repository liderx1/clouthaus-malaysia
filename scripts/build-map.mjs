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
  plugins: [
    {
      name: 'slim',
      setup(b) {
        // indentation and end-of-line comments inside multi-line strings (shaders, HTML) are not minified by esbuild;
        // they mean nothing there either
        b.onLoad({ filter: /src[\\/]map[\\/].*\.js$/ }, (a) =>
          /[\\/]vendor[\\/]/.test(a.path)
            ? undefined
            : {
                contents: fs
                  .readFileSync(a.path, 'utf8')
                  .replace(/\n[ \t]+/g, '\n')
                  .replace(/([;{])[ \t]+\/\/[^\n]*/g, '$1'),
                loader: 'js',
              },
        );
        // the map reads site.config.json, but not its SEO defaults or test settings: keep those out of the download
        b.onLoad({ filter: /site\.config\.json$/ }, (a) => {
          const c = JSON.parse(fs.readFileSync(a.path, 'utf8'));
          for (const k of ['seo', 'test', '$schema']) delete c[k];
          return { contents: JSON.stringify(c), loader: 'json' };
        });
      },
    },
  ],
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
