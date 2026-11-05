// Opening hours, read from the free-text hours in the CMS ("Mondays to Sundays, 10:00am – 10:00pm"). Pure: unit-tested.

/** minutes after midnight for "10", "10:30" with "am"/"pm" */
/** @param {string} h @param {string | undefined} m @param {string} ap */
const minutes = (h, m, ap) => ((+h % 12) + (/pm/i.test(ap) ? 12 : 0)) * 60 + (m ? +m : 0);

/** { open, close } in minutes after midnight, or null when the text has no "…am – …pm" range */
/** @typedef {{ open: number, close: number }} Hours */
/** @param {unknown} text @returns {Hours | null} */
export function parseHours(text) {
  const m = String(text ?? '').match(/(\d{1,2})(?::(\d\d))?\s*(am|pm)[^\d]+(\d{1,2})(?::(\d\d))?\s*(am|pm)/i);
  return m ? { open: minutes(m[1], m[2], m[3]), close: minutes(m[4], m[5], m[6]) } : null;
}

/** is the mall open at `now` (minutes after midnight)? Handles hours that run past midnight (e.g. 10am – 1am). */
/** @param {Hours | null} hours @param {number} now */
export function isOpen(hours, now) {
  if (!hours) return false;
  const { open, close } = hours;
  return close > open ? now >= open && now < close : now >= open || now < close;
}

/** night from 6pm to 6am @param {number} now minutes after midnight */
export const isNightAt = (now) => now < 6 * 60 || now >= 18 * 60;

/** "10pm", "9:30am" @param {number} v minutes after midnight */
export const formatTime = (v) =>
  `${((Math.floor(v / 60) + 11) % 12) + 1}${v % 60 ? ':' + String(v % 60).padStart(2, '0') : ''}${v % 1440 >= 720 ? 'pm' : 'am'}`;

/**
 * minutes after midnight right now at the site (its IANA time zone), whatever the visitor's own time zone
 * @param {string} timeZone e.g. 'Asia/Kuala_Lumpur', 'Asia/Taipei'
 */
export function nowAt(timeZone, date = new Date()) {
  const kl = new Date(date.toLocaleString('en-US', { timeZone }));
  return kl.getHours() * 60 + kl.getMinutes();
}
