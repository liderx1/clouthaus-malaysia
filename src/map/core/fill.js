// Fills {name}, {floor}… placeholders in a configured string. Pure: unit-tested.

/** @param {unknown} s @param {Record<string, unknown>} vars */
export const fill = (s, vars) => String(s ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
