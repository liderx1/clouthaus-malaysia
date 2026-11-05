import { bus } from './core/events.js';
import * as THREE from 'three';
import { PLACES, V } from './data.js';
import { pick, t } from './i18n.js';
import { label } from './labels.js';
import { scene } from './stage.js';

/* ---------- markers: entrances, exits, assembly ---------- */
export const BEACONS = [];
function beacon(x, y, z, color) {
  const g = new THREE.Group();
  const c = new THREE.Color(color);
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 12, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  col.position.y = 6;
  const top = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 12), new THREE.MeshBasicMaterial({ color: c }));
  top.position.y = 12.5;
  const disc = new THREE.Mesh(
    new THREE.RingGeometry(2, 4.5, 32),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.4;
  g.add(col, top, disc);
  g.position.set(x, z, -y);
  g.visible = false;
  g.userData.disc = disc;
  scene.add(g);
  BEACONS.push(g);
  return g;
}
const KIND_COL = { mrt: '#1565D8', bus: '#B45309', parking: '#5B3CD6', main: '#C2410C', side: '#C2410C' },
  KIND_ICON = { mrt: 'M', bus: 'B', parking: 'P', main: '★', side: '↗' };
export const entMarks = PLACES.entrances.map((e) => ({
  e,
  b: beacon(e.x, e.y, e.z ?? 0, KIND_COL[e.kind] || '#FF5A1F'),
  l: label(pick(e.name), V(e.x, e.y, (e.z ?? 0) + 14), {
    kind: 'entrance',
    pri: 950,
    maxDist: 99999,
    group: 'entrances',
    color: KIND_COL[e.kind] || '#FF5A1F',
    icon: KIND_ICON[e.kind] || '★',
    onClick: () => bus.emit('place', () => [pick(e.name), t('entText'), t('approx')]),
  }),
}));
export const exitMarks = PLACES.emergency.map((e) => ({
  e,
  b: beacon(e.x, e.y, 0, '#2EBF6B'),
  l: label(pick(e.name), V(e.x, e.y, 14), {
    kind: 'exit',
    pri: 960,
    maxDist: 99999,
    group: 'safety',
    color: '#15803D',
    icon: '⇱',
    onClick: () => bus.emit('place', () => [pick(e.name), t('safety'), `${t('exitText')} · ${t('approx')}`]),
  }),
}));
export const asmMarks = PLACES.assembly.map((a) => ({
  a,
  b: beacon(a.x, a.y, 0, '#2EBF6B'),
  l: label(pick(a.name), V(a.x, a.y, 14), {
    kind: 'assembly',
    pri: 970,
    maxDist: 99999,
    group: 'safety',
    color: '#15803D',
    icon: '⚑',
    onClick: () => bus.emit('place', () => [pick(a.name), t('safety'), t('approx')]),
  }),
}));
[...entMarks, ...exitMarks, ...asmMarks].forEach((m) => {
  m.l.on = false;
});
