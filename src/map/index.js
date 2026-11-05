// A 3D map of one building (site.config.json → main) and the streets around it.
// Geometry comes from OpenStreetMap (public/map/osm.json, refreshed by scripts/fetch_osm.py); stores, events,
// entrances, exits and routes come from the CMS (/content/*.json). Data x = east, y = north; three.js X = x, Z = -y.
// Modules are imported in the order the scene is built; scripts/build-map.mjs bundles them into public/map/map.js.
import './state.js';
import './env.js';
import './report.js';
import './i18n.js';
import './data.js';
import './stage.js';
import './geo.js';
import './ground.js';
import './rail.js';
import './buildings.js';
import './mall.js';
import './sites/index.js';
import './trees.js';
import './traffic.js';
import './labels.js';
import './routes.js';
import './markers.js';
import './pin.js';
import './modes.js';
import './content.js';
import './ui.js';
import './post.js';
import './main.js';
import './dock.js';
import './hideui.js';
import './ghost.js';
import './preview.js';
import './loop.js';
