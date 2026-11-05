// Site-specific additions to the scene, chosen by site.config.json → "extras". A new site needs none; add a module here
// only for landmarks OpenStreetMap does not have (see sites/clouthaus.js for an example).
import { CONFIG } from '../config.js';
import * as clouthaus from './clouthaus.js';

/** @type {Record<string, { build: () => void }>} */
const SITES = { clouthaus };
if (CONFIG.extras) SITES[CONFIG.extras]?.build();
