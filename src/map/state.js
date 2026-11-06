// Shared state: language, day/night targets, camera moves and the active map mode. Clicks travel the other way, from the
// scene to the UI, on the event bus in core/events.js.
export const S = {
  lang: 'en',
  dimTarget: 0,
  nightTarget: 1,
  fly: null,
  zoomTo: null,
  dpr: 1,
  dockH: 140,
  uiOff: false,
  frames: 0,
  /** the store pin drawn in the scene, so labels keep clear of it: { at: base position, w, h: size in screen fractions } */
  pin: null,
  /** …and where it was on screen at the last label placement (the sweep checks no label covers it) */
  pinRect: [],
  pinLoading: false,
  /** a unit's 3D walk-through is open (src/tour): the map's clicks and labels stand aside */
  tour: false,
};
export const MODE = {
  route: null,
  entrances: false,
  safety: false,
  focus: false,
  store: null,
  cat: 'anchor',
  keep: null,
  meshes: [],
};
