// Visual regression: compares the screenshots from tests/e2e/sweep.mjs with approved ones and fails when a state
// changed more than the tolerance.
//
//   node tests/e2e/visual.mjs            # compare, write red-pixel diffs to tests/e2e/diff/
//   node tests/e2e/visual.mjs --update   # approve the current screenshots as the new baseline
//
// Locally the baseline is tests/e2e/baseline/<platform>/ (not committed: GPUs and fonts differ between machines).
// In CI, BASELINE points at the screenshots of the last release that passed (see .github/workflows/ci.yml).
import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const SHOTS = process.env.OUT || path.join('tests', 'e2e', 'shots');
const BASE = process.env.BASELINE || path.join('tests', 'e2e', 'baseline', process.platform);
const DIFF = path.join('tests', 'e2e', 'diff');
const TOLERANCE = +(process.env.VISUAL_TOLERANCE || 0.002); // share of pixels allowed to differ (labels re-flow by a pixel or two)

const shots = fs.existsSync(SHOTS) ? fs.readdirSync(SHOTS).filter((f) => f.endsWith('.png')) : [];
if (!shots.length) {
  console.error(`no screenshots in ${SHOTS}: run tests/e2e/sweep.mjs first`);
  process.exit(2);
}
if (process.argv.includes('--update')) {
  fs.rmSync(BASE, { recursive: true, force: true });
  fs.mkdirSync(BASE, { recursive: true });
  for (const f of shots) fs.copyFileSync(path.join(SHOTS, f), path.join(BASE, f));
  console.log(`baseline updated: ${shots.length} screenshots in ${BASE}`);
  process.exit(0);
}
if (!fs.existsSync(BASE)) {
  console.error(`no baseline for ${process.platform} yet: approve one with --update`);
  process.exit(2);
}
fs.rmSync(DIFF, { recursive: true, force: true });
fs.mkdirSync(DIFF, { recursive: true });
const failed = [];
for (const f of shots) {
  const ref = path.join(BASE, f);
  if (!fs.existsSync(ref)) {
    console.log(`new   ${f} (not in the baseline)`);
    continue;
  }
  const a = PNG.sync.read(fs.readFileSync(ref)),
    b = PNG.sync.read(fs.readFileSync(path.join(SHOTS, f)));
  if (a.width !== b.width || a.height !== b.height) {
    failed.push(`${f}: size ${b.width}×${b.height}, baseline ${a.width}×${a.height}`);
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.15 });
  const share = n / (a.width * a.height);
  const line = `${(share * 100).toFixed(2).padStart(6)}%  ${f}`;
  if (share > TOLERANCE) {
    fs.writeFileSync(path.join(DIFF, f), PNG.sync.write(diff));
    failed.push(line);
  } else console.log(`ok   ${line}`);
}
if (failed.length) {
  console.error(`\nchanged more than ${TOLERANCE * 100}% (diffs in ${DIFF}):\n${failed.join('\n')}`);
  console.error('if the change is intended, approve it with: node tests/e2e/visual.mjs --update');
  process.exit(1);
}
console.log(`\nall ${shots.length} screenshots match the baseline`);
