// A tiny event bus. Scene modules (labels, markers) announce what was clicked; the UI modules listen. So the scene never
// imports the UI and the module graph stays one-directional (checked by tests/unit/modules.test.mjs).

/**
 * What each event carries.
 * @typedef {{
 *   'place': () => [string, string, string],
 *   'mall:focus': void,
 *   'modes:change': void,
 *   'store:show': any,
 *   'map:pick': [number, number],
 *   'store:clear': void,
 *   'store:card': void,
 *   'lang': void,
 *   'plate:open': string,
 * }} MapEvents
 * - place: a place label was clicked; () => [title, tag, text], re-read when the language changes
 * - mall:focus: the main building's label was clicked
 * - modes:change: the map mode changed (route, entrances, safety, focus, store), so update the share link
 * - store:show: open the card for this store
 * - map:pick: the map was tapped in pick mode (the CMS pin picker), at [x, y] metres
 * - store:clear: take the picked store's pin off the map (the × on its label)
 * - store:card: bring back the picked store's card (a tap on its label)
 * - lang: the visitor switched language (labels on the map rewrite their words)
 * - plate:open: show this unit type on the 3D floor plate
 */

/** @template {Record<string, any>} E */
export function createBus() {
  /** @type {Map<keyof E, Set<(detail: any) => void>>} */
  const handlers = new Map();
  return {
    /**
     * @template {keyof E} K
     * @param {K} type
     * @param {(detail: E[K]) => void} fn
     * @returns {() => void} unsubscribe
     */
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)?.add(fn);
      return () => handlers.get(type)?.delete(fn);
    },
    /**
     * @template {keyof E} K
     * @param {K} type
     * @param {E[K]} [detail]
     */
    emit(type, detail) {
      handlers.get(type)?.forEach((fn) => fn(detail));
    },
  };
}

/** the map's bus */
export const bus = /** @type {ReturnType<typeof createBus<MapEvents>>} */ (createBus());
