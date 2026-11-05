// Render resolution control: start sharp, drop when frames are slow, climb back when they are smooth again.
// Pure: unit-tested (tests/unit/quality.test.mjs).
//
// Phones lock their screen to 60 Hz, so a smooth frame takes ~16.7 ms, never "15 ms with room to spare": recovery
// counts frames that hold the refresh rate (under 19 ms). A level that proved too slow is not tried again for a while,
// so the picture does not keep flipping between sharp and soft.

const SMOOTH_MS = 19; // holding 60 fps (or better on 90 / 120 Hz screens)
const WARMUP = 3; // seconds after loading (shaders compiling, textures uploading) that say nothing about the device
const SMOOTH_RUN = 2; // seconds in a row before climbing a step
const CEILING_MS = 30000; // how long a level that was too slow stays off-limits

/**
 * @param {{ max: number, min?: number, step?: number, slowMs?: number, slowRun?: number }} opts
 *   slowMs / slowRun: a step down needs `slowRun` seconds in a row slower than `slowMs` per frame (default: 1 s under 40 fps)
 * @returns {{ level: number, update: (ms: number, now: number) => number, pause: () => void }}
 */
export function createQuality({ max, min = 0.75, step = 0.25, slowMs = 25, slowRun = 1 }) {
  let level = max,
    seen = 0,
    smooth = 0,
    slow = 0,
    ceiling = Infinity,
    ceilingUntil = 0;
  const round = (/** @type {number} */ v) => Math.round(v / step) * step;
  return {
    get level() {
      return level;
    },
    /** feed the average frame time of the last second; returns the resolution to use */
    update(ms, now) {
      if (++seen <= WARMUP) return level;
      if (now > ceilingUntil) ceiling = Infinity;
      if (ms > slowMs) {
        smooth = 0;
        if (++slow >= slowRun && level > min) {
          slow = 0;
          ceiling = level;
          ceilingUntil = now + CEILING_MS;
          level = Math.max(min, round(level - step));
        }
        return level;
      }
      slow = 0;
      if (ms < SMOOTH_MS) {
        if (++smooth >= SMOOTH_RUN && level < max && level + step < ceiling) {
          level = Math.min(max, round(level + step));
          smooth = 0;
        }
      } else smooth = 0;
      return level;
    },
    /** a hidden tab or a long stall says nothing about the device: start counting again */
    pause() {
      seen = 0;
      smooth = 0;
      slow = 0;
    },
  };
}
