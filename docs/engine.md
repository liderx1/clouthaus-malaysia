# 3D map site — engine reference

The technical reference for the engine: a 3D map website (Three.js) on Next.js with Payload CMS and Supabase.
This repo is set up for **CloutHaus Residences** (Jalan P. Ramlee, KL City Centre): a 64-storey residential tower, its
15 unit types and 25 facilities in the directory, and KLCC around it. The engine was first built for EkoCheras Mall; a
few parts of this document still describe the mall wording.

### Settings added for a tower (site.config.json)

| Setting | What it does |
| --- | --- |
| `origin.skyline`, `origin.skylineMin` | also fetch buildings at least `skylineMin` m tall (default 150) out to `skyline` m, so Merdeka 118, KL Tower and The Exchange 106 stand on the horizon where they really are |
| `main.style: "tower"`, `main.tower` | curtain-wall tower shader: floor height, podium, crown, glass and fin colours, lit amenity floors (`bands`) |
| `main.footprint` | draw the main building from the published floor plan (rounded rectangle w × d, corner r, long side facing `facing`°) when the OSM outline is only a sketch |
| `main.view` | compass bearing the opening view looks from; a tall building is framed from further away |
| `categories` | the directory's own categories (here bedrooms / dual key / facility levels) instead of the mall ones; a migration is needed when values change |
| `landmarks` | big labels over the tallest building at a point (Twin Towers, Merdeka 118, …) |
| `text.<lang>.ui` | any interface wording by its key in `src/map/i18n.js` (“stores” → “unit types & facilities”) |
| `aboutImage` | the picture at the top of the About popup |
| `main.halo`, `main.highlight` | the warm light around the main building (behind it by night, a ring in front by day) and its outline colour |
| `main.routes`, `storeRoute` | the routes offered on the main building's card (car, bus); `false` drops the route button from unit cards |
| `routeColors` | each route's own colour on the map and its button |
| `litLandmarks` | landmarks drawn in their real night lighting and never faded (the Petronas Twin Towers) |
| `names` | corrections to OSM's Chinese names (`{"zh": null}` keeps the English where OSM's is doubtful) |
| `look` | sky and haze tints of the 3D scene, so it takes the site's palette |
| `tours` | units with a 3D walk-through (`src/tour/tour.js`, bundled on its own into `public/map/tour.js` and loaded when opened): the unit is modelled from the developer's floor plan and placed at its level and position in the tower, so its windows show the real 3D city; open from the unit's card or `/#tour=<id>` |

Labels change language with the page: names come from OSM's `name:zh` tags (fetched by `scripts/fetch_osm.py`) and
the landmark names in `site.config.json`. Generic names ("Tower 2", "Blok 3") are not shown; buildings, roads and
places that are not the point of the page are drawn quieter (`lbl--minor`, `lbl--far`). Background music is generated
in the browser (`src/music/music.js`, bundled on its own into `public/map/music.js`) and has an on/off button in the
top bar. The black-and-gold look is `public/map/theme.css`, loaded after `map.css`. The bundle carries only what
the site uses: `scripts/build-map.mjs` sets build flags from `site.config.json` (languages, mall or tower facade).

Rail lines in tunnels (OSM `tunnel=yes` or a negative layer) are drawn as a coloured trace on the ground in the line's
colour; the KL Monorail gets its guideway, piers and two 4-car trains; Grab and foodpanda riders join the traffic.
`sites/clouthaus.js` adds the podium on the OSM site outline, the 63A rooftop pool and an **indicative** Paradox Hotel
tower (no public footprint: replace it when the developer's site plan is available).

## The site

The whole site is one page, **`index.html`**: a live 3D map of the mall and Cheras (Three.js, code in `map/`).
Everything else lives inside it:

| Where | What |
| --- | --- |
| Getting here tab | Routes from the MRT, bus and car, entrances, emergency exits |
| Stores tab | Search and categories; the chosen store gets a pin and a card |
| What's on tab | Notices, events, campaigns and highlights |
| Visit tab | Why EkoCheras, hours, address, contact, social, facilities; **About** and **Contact** open as popups |

The contact popup is one form for leasing, general enquiries, feedback, advertising, lost & found and careers.
Old addresses redirect (`vercel.json`): `/about.html` → `/#about`, `/contact.html` → `/#contact`, `/map/` → `/`.
Direct links: `/#stores`, `/#news`, `/#visit`, `/#about`, `/#contact`, `/#route=mrt`, `/#store=<name>-<unit>`, `/#safety`.

## Content manager (Payload CMS)

The site runs on Next.js with **Payload CMS** at **`/admin`** (editors sign in with Payload's own accounts).
Content lives in Supabase Postgres, in its own `payload` schema; uploaded images go to Supabase Storage.

| In the admin | What it controls |
| --- | --- |
| Stores · 商店 | 285 stores: name, logo, floor, unit, category, anchor, description, position (📍 Pick on the map) |
| What's on · 活动 | Events & campaigns, highlights, notices |
| Visit · 到访 | Facilities, Why EkoCheras, mall info & contact |
| Getting here · 交通 | Entrances, emergency exits & assembly points, routes |
| Settings · 设定 | SEO & analytics (title, description, share image, noindex, GA4 ID, Search Console code), images, editors |

Every form has a live preview of the 3D map next to it (the eye button): typing updates it straight away, and
drafts save themselves. **Publish** puts the change on the site. Texts are edited in English, Bahasa Melayu and
中文 with the locale switch at the top; anything left empty falls back to English.

The map reads its content from `/content/<name>.json` (`src/app/content/[file]/route.ts`), built from Payload in
the same shape the map has always used. `/` serves `src/site/index.html` with the SEO and GA4 tags from the CMS;
`/robots.txt` and `/sitemap.xml` follow the noindex switch and the website address.

### Running it

1. Copy `.env.example` to `.env` and fill it in (Supabase connection strings and Storage keys, `PAYLOAD_SECRET`).
   For a quick local try without Supabase: `npm i -D embedded-postgres && node scripts/devdb.mjs` starts a throwaway Postgres on port 54329.
2. `npm install`, then `npx payload migrate` and, on an empty database, `npm run seed` (imports `seed/`). The Vercel build runs both; the seed skips itself once there is content.
3. `npm run dev` → http://localhost:3000 and http://localhost:3000/admin (the first visit asks for the first editor).

Schema changes: edit the collections, run `npm run migrate:create <name>` and commit the file in `src/migrations`;
the Vercel build runs `payload migrate` before `next build` (using `DATABASE_URI_MIGRATE`).

## 3D map (`/map/`)

- `public/map/osm.json` holds buildings, roads, the MRT line, parks and places from **OpenStreetMap** (© OpenStreetMap
  contributors, ODbL — keep the credit line on the page). Regenerate it with `python3 scripts/fetch_osm.py`
  when the area changes; it is re-centred on the EkoCheras Mall building.
- the Getting here section of the admin positions are metres from the centre of the mall (x = east, y = north, z = height).
  Entrances, emergency exits and the assembly point are **approximate**: replace them with the mall's approved
  floor and evacuation plans before launch.
- Routes are drawn on the real road network: walking routes start at the route's x / y / z, driving routes at
  one end of Jalan Cheras, and all of them end at the chosen entrance.
- Stores are browsed by **category**, with **anchor stores** first (CMS: *Anchor store*). Only the store a visitor
  picks gets a pin, at its *3D map pin position*. 108 positions come from each store's own Google Maps listing
  (looked up in November 2026); the rest are estimated from neighbouring unit numbers on the same floor and
  marked *Estimated*. Check them against the mall floor plan and untick *Estimated*.
- Links can be shared: `/map/#store=<name>-<unit>`, `/map/#route=mrt` (or `bus`, `carN`, `carS`), `/map/#safety`.
- The Visit tab opens with "Why EkoCheras" highlights from `content/facts.json` (CMS: *Why EkoCheras*), plus a
  leasing enquiry link. Opening status ("Open now · until 10pm") is read from the opening hours in `site.json`.
- Textures in `public/map/tex/` are CC0 from [Poly Haven](https://polyhaven.com): asphalt, concrete paving, clay roof tiles,
  plaster, bark, grass; the sky is the *Sunflowers* (sunny day with cumulus) and *Qwantani dusk 2* (night) pure-sky HDRIs, and
  reflections use the *Wide Street 01* (midday sun) and *Shanghai Bund* city HDRIs. Vehicles, trains, trees and palms are modelled in code.
- The OpenStreetMap credit (required by its licence) is at the end of the Visit tab.
- Heights, trees and building colours are generated where OpenStreetMap has no data, so the scene is a faithful
  layout, not a photographic copy. Three.js is loaded from jsDelivr.

### Site settings (`site.config.json`)

Everything specific to this site lives in `site.config.json` at the repo root (described field by field in
`site.config.schema.json`): name, logo, time zone, languages, the map's centre and radius, the main building (its
OpenStreetMap name, label, height, colours, which facade carries the main sign), the main road for driving routes,
road labels to hide, the About copy and figures, the form's consent line, SEO defaults, and the store the browser
sweep uses. The map, the CMS, the seed and `scripts/fetch_osm.py` all read it. Landmarks OpenStreetMap does not have
go in a module under `src/map/sites/` named by `"extras"` (EkoCheras: the Tower J–H sky bridge and the covered MRT
link bridge). Built-in interface languages: English, Traditional Chinese (`zh-TW`), Simplified Chinese (`zh`), Malay.

### Map code

The map is written as ES modules in `src/map/` and bundled by esbuild into `public/map/map.js` (Three.js stays
external, loaded through the page's import map). Edit `src/map/`, never `public/map/map.js`.

| Module | What it does |
| --- | --- |
| `index.js` | entry point: loads the modules in the order the scene is built |
| `state.js` | shared state: language, day/night, the active mode (route, entrances, safety, focus, store) |
| `data.js`, `i18n.js`, `env.js` | map data (OSM + CMS content), translations, small DOM helpers, `?test` mode |
| `report.js` | sends script errors and a sustained low frame rate to the admin's *Site health* |
| `stage.js`, `post.js`, `loop.js` | renderer, camera, lights, sky, bloom, the frame loop and adaptive resolution |
| `ground.js`, `rail.js`, `buildings.js`, `mall.js`, `trees.js`, `traffic.js` | the city: roads, MRT line, buildings, the mall, trees, cars, motorbikes and trains |
| `labels.js`, `markers.js`, `pin.js` | place labels, Getting here markers and the store pin |
| `routes.js`, `modes.js`, `ghost.js` | route finding and ribbons, switching modes, see-through city in focus modes |
| `content.js`, `ui.js`, `dock.js`, `hideui.js`, `main.js`, `preview.js` | stores, news, visit info, popups, the bottom panel, the hide-panels button, share links, CMS live preview |
| `core/` | pure logic with no Three.js or DOM: geometry, routing, label placement, opening hours, text, the event bus |

**Rules the tests enforce** (`tests/unit/modules.test.mjs`): no import cycles; the 3D scene never imports the UI
(a click on a label is announced on the event bus in `core/events.js` and the UI listens); `core/` has no Three.js,
no DOM and no imports from outside `core/`. `core/` is type-checked in strict mode, the rest of the map in basic mode.

### Checks and release

```bash
npm run watch:map    # rebuild public/map/map.js on every save (with npm run dev)
npm run check        # ESLint + type checks + unit tests; npm run build runs it first, so a failure stops a deploy
npm run format       # Prettier
npm run test:e2e     # whole-site sweep in Chrome (add -- --phone, -- --local-map)
npm run test:visual  # compare the sweep's screenshots with the approved ones (-- --update to approve)
npm run verify       # all of the above before a push: checks; sweeps on desktop, phone (390×844), small phone
                     # (360×640) and a phone held sideways (844×390); comparison of all their screenshots
```

| Layer | What it catches |
| --- | --- |
| ESLint, type checks | typos, wrong arguments, unused code |
| Unit tests (`tests/unit`) | wrong routes, overlapping labels, wrong opening status, broken share links, architecture rules |
| Bundle budget (`scripts/build-map.mjs`) | `map.js` growing past 140 KB |
| Sweep (`tests/e2e/sweep.mjs`) | any script error in day and night × every route, entrances, exits, focus, store search, hidden panels, three languages, on desktop and phone |
| Phone checks (in the sweep) | no label covering a store pin (16 stores) or sitting under a button; the × on the store label works; the contact form can be filled in and closed |
| Visual comparison (`tests/e2e/visual.mjs`) | anything that looks different from the approved screenshots (more than 0.2% of the screen) |
| Contact form (in the sweep) | the message box widening, or the form closing and losing the text when its resize handle is let go outside |
| Site health (admin) | errors and too-slow devices on real visitors' browsers, after release |

`?test` freezes traffic, trains and pulses, turns off auto-rotate and fixes the resolution, so two runs give the
same screenshots (they differ by under 0.05%).

**Release flow.** Work on the `dev` branch. Before pushing, run `npm run verify` on a machine with a GPU: the
checks, then the full sweep on desktop and phone, then the comparison of all 40 screenshots with the approved ones
(`npm run test:visual -- --update` approves an intended change). Push `dev`, and GitHub Actions
(`.github/workflows/ci.yml`) runs the checks again plus a smoke test in Chrome (a route, entrances, a store search,
hidden panels and the contact form). Only when both pass does it fast-forward `main`, which Vercel deploys.
GitHub's machines have no GPU, so WebGL runs on the CPU at about one frame a second; that is why the full sweep and
the screenshot comparison run locally (`CPU_WEBGL=1` reproduces the CI machines on a Mac). The `dev` branch itself
is not deployed by Vercel (`vercel.json`): its build would need the production database, and preview builds must
never run migrations against it.

### Site health

Visitors' browsers report script errors and devices that stay under 25 fps for 20 seconds even at the lowest
resolution to `POST /report` (`src/app/report/route.ts`): at most 5 reports per visit, 10 per minute per address,
2 KB each. They are stored in the admin under *Settings → Site health*, with identical reports merged into one row
with a count. Reports are never sent from localhost, `?test` runs or the pin picker.

### Day and night

The map follows the time in Kuala Lumpur: day from 6am, night from 6pm (checked every minute). A visitor who taps
*Day / night* keeps their choice for the rest of the visit. By day the city around the mall is faded a little
(softer colours, lighter; `CALM_DAY` in `src/map/loop.js`) so the mall stands out; the mall itself is never faded.

### Hide panels

The round button in the bottom-right corner (or the H key) hides the top bar, the bottom panel, the compass, the
scale and any open card, leaving only the 3D scene with its labels and markers; press it again to bring them back.

## Before launch on the official domain

- In the admin, *SEO & analytics*: untick *Hide from search engines*, set the website address, add the GA4 ID and Search Console code.
- Connect the contact popup form to the mall's email or CRM (it currently shows a thank-you message only).
- Replace the approximate entrances, emergency exits and assembly point in the Getting here section of the admin with the mall's
  approved plans.

## Other files

- `src/collections`, `src/globals` — CMS fields (which inputs editors see).
- `images/about-car-display.webp` (About popup): BMW Welt, Munich, by a Pexels photographer (pexels.com/photo/19429389, Pexels
  licence: free for commercial use, no credit required). A stand-in: replace it with the mall's own atrium photo before launch.
  Files in `public/images` are cached by browsers for a day, so a replaced image needs a new file name, not the same one.
  Images uploaded in the admin need no such care: their addresses carry a stamp of when they last changed
  (`src/lib/media-url.ts`), so a replaced picture shows at once while unchanged ones stay cached.
- `gen_images.py` — regenerates the illustrated SVG posters in `images/` (and the About photo from `images/src/`).
- `fonts/` — Jost, Anton and Bodoni Moda, self-hosted (SIL Open Font License, see the `OFL-*.txt` files).
  The site loads no external assets except Three.js for the 3D map (jsDelivr).
