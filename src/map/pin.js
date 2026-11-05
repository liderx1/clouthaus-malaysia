import * as THREE from 'three';
import { MALL_H, V } from './data.js';
import { $$ } from './env.js';
import { initials } from './geo.js';
import { CONFIG } from './config.js';
import { bus } from './core/events.js';
import { t } from './i18n.js';
import { label } from './labels.js';
import { mallC } from './mall.js';
import { overlay } from './stage.js';
import { S } from './state.js';

/* ---------- store pin: only the store the visitor picked, drawn on top so buildings never hide it ----------
   Exact unit positions come from the CMS ("3D map pin position", metres from the mall centre). Until a store has one,
   the pin stands over the mall and the card names the floor and unit; nothing is guessed. */
/** pin height of each floor (site.config.json → floors) */
const FLOOR_Z = Object.fromEntries(CONFIG.floors.map((/** @type {{ code: string, z: number }} */ f) => [f.code, f.z]));
export const pinGroup = new THREE.Group();
overlay.add(pinGroup); // over the finished picture: no glow, no tone mapping, never hidden by buildings
export const pinSprite = new THREE.Sprite(
  new THREE.SpriteMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: false,
    toneMapped: false,
  }),
);
pinSprite.center.set(0.5, 0);
pinSprite.renderOrder = 1000;
pinSprite.scale.set(0.05, 0.062, 1);
const pinStem = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.18, 1, 8),
  new THREE.MeshBasicMaterial({
    color: 0xe8331f,
    depthTest: false,
    transparent: true,
    opacity: 0.85,
    toneMapped: false,
  }),
);
pinStem.renderOrder = 999;
export const pinDot = new THREE.Mesh(
  new THREE.RingGeometry(1.2, 2.4, 32),
  new THREE.MeshBasicMaterial({
    color: 0xe8331f,
    depthTest: false,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  }),
);
pinDot.rotation.x = -Math.PI / 2;
pinDot.renderOrder = 999;
pinGroup.add(pinSprite, pinStem, pinDot);
pinGroup.visible = false;
// the store's name over the pin: tap it to bring the card back, or its × to take the pin off the map
const pinLabel = label('', V(0, 0, 0), {
  kind: 'store',
  pri: 2000,
  maxDist: 99999,
  group: 'store',
  onClick: () => bus.emit('store:card'),
});
pinLabel.on = false;
const pinX = document.createElement('button');
pinX.type = 'button';
pinX.className = 'lbl-x';
pinX.textContent = '×';
pinX.addEventListener('click', (e) => {
  e.stopPropagation();
  bus.emit('store:clear');
});
pinLabel.el.append(pinX);
export function storeSpot(s) {
  const has = s.pin && s.pin.x !== '' && s.pin.y !== '' && Number.isFinite(+s.pin.x) && Number.isFinite(+s.pin.y);
  return has
    ? { x: +s.pin.x, y: +s.pin.y, z: FLOOR_Z[s.floor] ?? 4, exact: true, est: !!s.pin.estimated }
    : { x: mallC[0], y: mallC[1], z: MALL_H + 2, exact: false };
}
export function showPin(s) {
  const p = storeSpot(s),
    top = MALL_H + 16;
  pinSprite.material.map?.dispose();
  pinSprite.material.map = pinTexture(s);
  pinSprite.material.needsUpdate = true;
  pinSprite.position.set(p.x, top, -p.y);
  pinStem.scale.y = top - p.z;
  pinStem.position.set(p.x, (top + p.z) / 2, -p.y);
  pinDot.position.set(p.x, p.z + 0.1, -p.y);
  pinGroup.visible = true;
  S.pin = { at: pinSprite.position, w: pinSprite.scale.x, h: pinSprite.scale.y };
  pinGroup.userData = { t0: performance.now(), top };
  pinLabel.pos.set(p.x, top + 9, -p.y);
  pinLabel.el.firstChild.textContent = s.name;
  pinX.setAttribute('aria-label', `${t('removePin')}: ${s.name}`);
  pinLabel.w = null;
  pinLabel.on = true;
  return p;
}
export function hidePin() {
  pinGroup.visible = false;
  S.pin = null;
  pinLabel.on = false;
  $$('.store.is-on').forEach((b) => b.classList.remove('is-on'));
}
function pinTexture(s) {
  // drawn at 2× (416 × 512) so the pin and logo stay crisp on 2–3× phone screens; the shapes keep their 208 × 256 layout
  const c = document.createElement('canvas');
  c.width = 416;
  c.height = 512;
  const x = c.getContext('2d');
  x.scale(2, 2);
  x.imageSmoothingQuality = 'high';
  const draw = (img) => {
    x.clearRect(0, 0, 208, 256);
    x.shadowColor = 'rgba(0,0,0,.35)';
    x.shadowBlur = 14;
    x.shadowOffsetY = 6;
    x.fillStyle = '#E8331F';
    x.beginPath();
    x.arc(104, 96, 86, Math.PI, 0);
    x.bezierCurveTo(190, 160, 120, 200, 104, 248);
    x.bezierCurveTo(88, 200, 18, 160, 18, 96);
    x.fill();
    x.shadowColor = 'transparent';
    x.fillStyle = '#fff';
    x.beginPath();
    x.arc(104, 96, 64, 0, Math.PI * 2);
    x.fill();
    if (img) {
      x.save();
      x.beginPath();
      x.arc(104, 96, 58, 0, Math.PI * 2);
      x.clip();
      x.drawImage(img, 46, 38, 116, 116);
      x.restore();
    } else {
      x.fillStyle = '#0A172E';
      x.font = 'bold 46px Jost, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(initials(s.name), 104, 98);
    }
    tex.needsUpdate = true;
  };
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  draw();
  S.pinLoading = !!s.logo; // the logo arrives a moment later (the screenshot sweep waits for it)
  if (s.logo) {
    const img = new Image();
    img.onload = img.onerror = () => {
      if (img.complete && img.naturalWidth) draw(img);
      S.pinLoading = false;
    };
    img.src = s.logo;
  }
  return tex;
}
