import { bus } from './core/events.js';
import { esc } from './core/text.js';
import { MALL_H, PLACES, V } from './data.js';
import { $, $$, MOBILE } from './env.js';
import { pick, t } from './i18n.js';
import { LINK_ROOF, mallC } from './mall.js';
import { BEACONS, asmMarks, entMarks, exitMarks } from './markers.js';
import { hidePin } from './pin.js';
import { ROUTE_COL, ROUTE_ICON, dijkstra, nearest, routeMesh, routePoints, walkGraph } from './routes.js';
import { camera, controls, scene } from './stage.js';
import { MODE, S } from './state.js';

/* ---------- modes ---------- */
function clearRoutes() {
  MODE.meshes.forEach((m) => scene.remove(m.g));
  MODE.meshes = [];
}
let built = '';
export function applyModes() {
  const sig = `${MODE.route}|${MODE.safety}`,
    rebuild = sig !== built;
  built = sig;
  if (rebuild) clearRoutes();
  const keep = new Set(),
    note = $('#routeNote');
  if (MODE.route) {
    const r = PLACES.routes.find((x) => x.id === MODE.route);
    if (rebuild) {
      const m = routeMesh(routePoints(r), ROUTE_COL[r.id] || '#FF6A2B', r.mode === 'drive' ? 3.5 : 1);
      scene.add(m.g);
      MODE.meshes.push(m);
      flyTo(m.p);
    }
    const L = MODE.meshes[0]?.L || 0,
      walk = r.mode === 'walk',
      mins = Math.max(1, Math.round(L / (walk ? 75 : 300)));
    const [bg, ic] = ROUTE_ICON[r.id] || ROUTE_ICON.carN;
    note.innerHTML = `<i style="background:${bg}">${ic}</i><span><b>${esc(pick(r.label))}</b><small>${esc(pick(r.note))}</small></span><em>${Math.round(L / 10) * 10} m<br>≈ ${mins} ${t(walk ? 'minWalk' : 'minDrive')}</em>`;
    note.hidden = false;
    note.style.animation = 'none';
    void note.offsetWidth;
    note.style.animation = '';
    keep.add('route');
    entMarks.forEach((x) => {
      const on = x.e.id === r.to || MODE.entrances;
      x.b.visible = on;
      x.l.on = on;
      x.l.target = x.e.id === r.to;
    });
    keep.add('entrances');
  } else {
    entMarks.forEach((x) => {
      x.b.visible = MODE.entrances;
      x.l.on = MODE.entrances;
      x.l.target = MODE.entrances;
    });
    note.hidden = !MODE.safety;
  }
  if (MODE.entrances) keep.add('entrances');
  exitMarks.concat(asmMarks).forEach((x) => {
    x.b.visible = MODE.safety;
    x.l.on = MODE.safety;
  });
  if (MODE.safety) {
    keep.add('safety');
    note.innerHTML = `<i style="background:#15803D">⇱</i><span><b>${t('safety')}</b><small>${esc(t('exitText'))}</small></span>`;
    if (rebuild) {
      const a = PLACES.assembly[0];
      const GW = walkGraph();
      for (const e of PLACES.emergency) {
        const path = dijkstra(GW, nearest(GW, e.x, e.y), nearest(GW, a.x, a.y));
        const pts = [[e.x, e.y, 0], ...(path || []), [a.x, a.y, 0]];
        const m = routeMesh(pts, '#16C060');
        scene.add(m.g);
        MODE.meshes.push(m);
      }
      flyTo([[a.x, a.y], ...PLACES.emergency.map((e) => [e.x, e.y])]);
    }
  }
  if (MODE.entrances && !MODE.route && rebuildEnt !== MODE.entrances) flyTo(PLACES.entrances.map((e) => [e.x, e.y]));
  rebuildEnt = MODE.entrances;
  BEACONS.forEach((b) => {
    if (b.visible && !b.userData.on) b.userData.t0 = performance.now();
    b.userData.on = b.visible;
  });
  LINK_ROOF.forEach((m) => {
    m.visible = !MODE.route && !MODE.safety;
  });
  if (MODE.store) keep.add('store');
  else hidePin();
  // on phones a picked store leaves the whole 3D scene as it is (no fading, every label kept): the screen is small
  // enough already, so the pin alone shows where it is
  const storeFocus = MODE.store && !MOBILE;
  S.dimTarget = MODE.route || MODE.safety || MODE.focus ? 0.78 : storeFocus || MODE.entrances ? 0.5 : 0;
  MODE.keep = MODE.route || MODE.safety || MODE.focus || storeFocus ? keep : null;
  $$('.route-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.route === MODE.route));
  $$('[data-mode]').forEach((b) => b.classList.toggle('is-on', !!MODE[b.dataset.mode]));
  bus.emit('modes:change');
}
let rebuildEnt = false;
export function focusMall() {
  MODE.focus = true;
  applyModes();
  flyTo(null, [mallC[0], mallC[1]], Math.max(300, MALL_H * 1.7), MALL_H * 0.4); // a tower is framed whole
}
/* smooth camera moves */
export function flyTo(pts, centre, distance, z = 0) {
  S.zoomTo = null;
  let c = centre,
    d = distance;
  if (pts) {
    const xs = pts.map((q) => q[0]),
      ys = pts.map((q) => q[1]);
    c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    d =
      Math.max(260, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.35) *
      Math.max(1, 0.95 / camera.aspect);
  } // narrow phone screens need to stand further back
  const target = V(c[0], c[1], z);
  const dir = camera.position.clone().sub(controls.target).normalize();
  dir.y = Math.max(dir.y, 0.55);
  dir.normalize();
  S.fly = {
    t0: performance.now(),
    dur: 1400,
    fromP: camera.position.clone(),
    fromT: controls.target.clone(),
    toP: target.clone().add(dir.multiplyScalar(d)),
    toT: target,
  };
  controls.autoRotate = false;
}

bus.on('mall:focus', focusMall);
