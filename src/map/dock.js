import { $$ } from './env.js';

// dock rows: every row that overflows gets its own ‹ › pair, vertically centred on that row.
// An arrow shows only when there is more in that direction; a click brings the next hidden item fully into view.
// Wheel and trackpad scroll the row under the pointer, eased.
const ROW_V = new WeakMap();
function glide(row, to) {
  const st = ROW_V.get(row) || { to: row.scrollLeft, raf: 0 };
  st.to = Math.max(0, Math.min(row.scrollWidth - row.clientWidth, to));
  ROW_V.set(row, st);
  if (!st.raf) st.raf = -1;
  syncArrows(row);
  if (st.raf === -1) st.raf = 0;
  if (!st.raf) {
    const step = () => {
      const d = st.to - row.scrollLeft;
      if (Math.abs(d) < 1.5) {
        row.scrollLeft = st.to;
        st.raf = 0;
        syncArrows(row);
        return;
      }
      row.scrollLeft += Math.sign(d) * Math.max(1, Math.abs(d) * 0.18);
      st.raf = requestAnimationFrame(step);
    };
    st.raf = requestAnimationFrame(step);
  }
}
const target = (row) => {
  const st = ROW_V.get(row);
  return st && st.raf ? st.to : row.scrollLeft;
};
addEventListener('resize', () =>
  $$('.dock .hrow').forEach((r) => {
    const st = ROW_V.get(r);
    if (st?.raf) {
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    }
  }),
);
// one click moves about 80% of the visible width, then settles on the nearest item edge so nothing is cut in half
function pageTo(row, dir) {
  const from = target(row),
    view = row.clientWidth,
    max = row.scrollWidth - view,
    base = row.firstElementChild?.offsetLeft ?? 0;
  const want = Math.max(0, Math.min(max, from + dir * view * 0.8));
  const starts = [...row.children].filter((c) => c.offsetWidth).map((c) => c.offsetLeft - base);
  if (want >= max - 1 || want <= 0) return glide(row, want);
  let snap = Math.max(...starts.filter((x) => x <= want + 1)); // the item that starts at or just before the new left edge
  if (dir > 0 && snap <= from + 8) snap = Math.min(...starts.filter((x) => x > from + 8));
  glide(row, Math.max(0, Math.min(max, snap - 6)));
}
function syncArrows(row) {
  const w = row?.parentElement;
  if (!w?.classList.contains('rowwrap')) return;
  const max = row.scrollWidth - row.clientWidth,
    x = target(row);
  w.classList.toggle('can-l', max > 2 && x > 2);
  w.classList.toggle('can-r', max > 2 && x < max - 2);
}
const syncAll = () => $$('.dock .hrow').forEach(syncArrows);
$$('.dock .hrow').forEach((row) => {
  const w = document.createElement('div');
  w.className = 'rowwrap';
  row.before(w);
  w.append(row);
  for (const dir of [-1, 1]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `dock-arrow dock-arrow--${dir < 0 ? 'l' : 'r'}`;
    b.setAttribute('aria-label', dir < 0 ? 'Scroll left' : 'Scroll right');
    b.textContent = dir < 0 ? '‹' : '›';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      pageTo(row, dir);
    });
    w.append(b);
  }
  row.addEventListener(
    'wheel',
    (e) => {
      const max = row.scrollWidth - row.clientWidth;
      if (max <= 2) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      glide(row, target(row) + d * (e.deltaMode ? 30 : 1));
    },
    { passive: false },
  );
  row.addEventListener(
    'scroll',
    () => {
      const st = ROW_V.get(row);
      if (!st || !st.raf) syncArrows(row);
    },
    { passive: true },
  );
  // drag with the mouse (touch scrolls natively); a fling keeps going a little
  let drag = null;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button || row.scrollWidth <= row.clientWidth + 2 || e.target.closest('input'))
      return;
    const st = ROW_V.get(row);
    if (st?.raf) {
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    }
    drag = { x: e.clientX, left: row.scrollLeft, moved: false, v: 0, t: performance.now(), lx: e.clientX };
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      row.classList.add('is-drag');
      row.setPointerCapture?.(e.pointerId);
    }
    if (drag.moved) {
      const now = performance.now();
      drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.t);
      drag.t = now;
      drag.lx = e.clientX;
      row.scrollLeft = drag.left - dx;
      syncArrows(row);
    }
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    row.classList.remove('is-drag');
    if (d.moved) {
      ROW_V.set(row, { to: row.scrollLeft, raf: 0 });
      glide(row, row.scrollLeft - d.v * 260);
      row.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          e.preventDefault();
        },
        { capture: true, once: true },
      );
    }
  });
  new MutationObserver(() => {
    const st = ROW_V.get(row);
    if (st?.raf) cancelAnimationFrame(st.raf);
    ROW_V.delete(row);
    row.scrollLeft = 0;
    requestAnimationFrame(() => syncArrows(row));
  }).observe(row, { childList: true });
  new ResizeObserver(() => syncArrows(row)).observe(row);
});
$$('[data-tab]').forEach((b) => b.addEventListener('click', () => requestAnimationFrame(syncAll)));
setTimeout(syncAll, 300);
