# EZ-Tree (vendored)

Procedural tree generator by Daniel Greenheck, MIT licence (see `LICENSE`):
https://github.com/dgreenheck/ez-tree — copied from commit in `COMMIT`.

Only the generator is kept (`tree.js` and its helpers) plus two presets. The map calls `Tree#createGeometry()` and
draws the result with its own instanced materials (`src/map/trees.js`), so the upstream textures and demo app are
not included. The leaf and bark textures in `public/map/tex/eztree_*` come from the same repo: leaves under its MIT
licence, bark `Bark001` from ambientCG (CC0).

Not linted or type-checked with the map code; update by copying the files again from upstream.
