// The button in the bottom-right corner: hides every panel, bar and card so only the 3D scene and its labels and
// markers stay on screen. Press it again (or H) to bring them back.
import { $ } from './env.js';
import { t } from './i18n.js';
import { S } from './state.js';

const btn = $('#uiToggle');
const label = btn?.querySelector('[data-t]');

/** @param {boolean} off */
export function setUIHidden(off) {
  if (!btn || !label) return;
  S.uiOff = off;
  document.documentElement.classList.toggle('ui-off', off);
  btn.setAttribute('aria-pressed', String(off));
  label.dataset.t = off ? 'showUI' : 'hideUI';
  label.textContent = t(label.dataset.t);
  btn.title = label.textContent;
}

btn?.addEventListener('click', () => setUIHidden(!S.uiOff));
addEventListener('keydown', (e) => {
  const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]');
  if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'h') setUIHidden(!S.uiOff);
});
setUIHidden(false);
