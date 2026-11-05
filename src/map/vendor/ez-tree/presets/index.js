// @ts-nocheck (vendored, see README.md)
// Trimmed for EkoCheras: only the presets the map uses (the full set is in the upstream repo).
import ashMedium from './ash_medium.json';
import oakMedium from './oak_medium.json';
import TreeOptions from '../options';

export const TreePreset = {
  'Ash Medium': ashMedium,
  'Oak Medium': oakMedium,
};

/**
 * @param {string} name The name of the preset to load
 * @returns {TreeOptions}
 */
export function loadPreset(name) {
  const preset = TreePreset[name];
  return preset ? structuredClone(preset) : new TreeOptions();
}
