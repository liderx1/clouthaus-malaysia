// Site health: sends script errors and a sustained low frame rate to POST /report, where they appear in the admin
// under Settings → Site health. Loaded first, so it also catches errors while the scene is being built.
// Off on localhost, in ?test runs and in the CMS pin picker; at most a few reports per visit.
import { MOBILE, TEST } from './env.js';

const ON = !TEST && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !/[?&]pick=/.test(location.search);
const MAX_PER_VISIT = 5;
let sent = 0;

/**
 * @param {'error' | 'slow'} kind
 * @param {unknown} message
 * @param {string} [source] file:line:column
 */
export function report(kind, message, source = '') {
  if (!ON || sent >= MAX_PER_VISIT) return;
  sent++;
  const body = JSON.stringify({
    kind,
    message: String(message).slice(0, 300),
    source,
    device: MOBILE ? 'phone' : 'desktop',
    page: location.pathname + location.hash,
  });
  if (!navigator.sendBeacon?.('/report', new Blob([body], { type: 'application/json' })))
    fetch('/report', { method: 'POST', body, keepalive: true }).catch(() => {});
}

addEventListener('error', (e) =>
  report(
    'error',
    e.message || 'Script error',
    e.filename ? `${e.filename.split('/').pop()}:${e.lineno}:${e.colno}` : '',
  ),
);
addEventListener('unhandledrejection', (e) => report('error', `Unhandled: ${e.reason?.message ?? e.reason}`));

// Frame rate: the loop already lowers the resolution when frames are slow. If 20 seconds in a row still average
// under 25 fps at the lowest resolution, the device cannot keep up: report it once.
const SLOW_MS = 40;
const SLOW_SECONDS = 20;
let seconds = 0,
  slowRun = 0,
  done = false;
/**
 * called once a second by the frame loop
 * @param {number} ms average frame time over the last second
 * @param {boolean} atLowest the resolution is already at its minimum
 */
export function noteFrameRate(ms, atLowest) {
  if (done || ++seconds < 10) return; // skip loading and the opening fly-in
  slowRun = ms > SLOW_MS && atLowest ? slowRun + 1 : 0;
  if (slowRun >= SLOW_SECONDS) {
    done = true;
    report('slow', 'Under 25 fps for 20 s even at the lowest resolution');
  }
}
