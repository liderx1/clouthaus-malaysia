export const START_HASH = location.hash;
/** ?test: a still, repeatable scene for screenshot comparison — frozen clock (no traffic, trains or pulses),
 *  no auto-rotate, fixed resolution, and the clock in the opening-hours badge set to noon */
export const TEST = new URLSearchParams(location.search).has('test');
export const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
/** a phone, upright or held sideways (the same test as the phone layout in map.css), or a mobile browser */
export const MOBILE =
  matchMedia('(max-width: 760px), (max-height: 500px) and (orientation: landscape)').matches ||
  /Mobi/.test(navigator.userAgent);
