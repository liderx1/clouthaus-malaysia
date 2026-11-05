// CloutHaus Residences (site.config.json → "extras": "clouthaus"): what OpenStreetMap does not model at Jalan P. Ramlee.
// - the shared podium, drawn on the OSM outline of the development site (landuse=construction "CloutHaus Residences …");
// - the second tower, Paradox KLCC (58 storeys: the hotel with Paradox Residences above), as an INDICATIVE massing: the
//   two towers stand about 30 m apart on that site, but no plan of its footprint is public, so it is placed in the site's
//   free south-west part and labelled as indicative;
// - the 25 m infinity lap pool on the 63A rooftop, along the KLCC side.
import * as THREE from 'three';
import { buildingGeometry } from '../buildings.js';
import { CONFIG } from '../config.js';
import { ring, roundedRect } from '../core/geometry.js';
import { MALL, MALL_H, OSM, V } from '../data.js';
import { label } from '../labels.js';
import { mallGroup, mallMesh } from '../mall.js';
import { dimmable } from '../stage.js';

const PODIUM_H = CONFIG.main.tower?.podium ?? 28;

export function build() {
  const site = OSM.areas.find((a) => /^CloutHaus/i.test(a.name ?? ''));
  const r0 = ring(MALL.p),
    c0 = r0.reduce((a, q) => [a[0] + q[0] / r0.length, a[1] + q[1] / r0.length], [0, 0]);
  const facing = CONFIG.main.footprint?.facing ?? 0;
  if (site) {
    const podium = new THREE.Mesh(
      buildingGeometry([{ id: -1, p: site.p, h: PODIUM_H - 1, type: 'commercial', kId: 7, exact: true }]),
      mallMesh.material,
    );
    podium.castShadow = podium.receiveShadow = true;
    mallGroup.add(podium);
    // Paradox Hotel, indicative: centred on the site corners furthest from CloutHaus
    const far = ring(site.p).filter((q) => Math.hypot(q[0] - c0[0], q[1] - c0[1]) > 45);
    if (far.length) {
      const c = far.reduce((a, q) => [a[0] + q[0] / far.length, a[1] + q[1] / far.length], [0, 0]);
      // 58 storeys: the Paradox KLCC hotel below, 242 Paradox Residences above (TA Global, as reported by The Edge)
      const H = 58 * (CONFIG.main.tower?.floorHeight ?? 3.8);
      const p = roundedRect(c[0], c[1], 40, 24, 5, facing);
      const tower = new THREE.Mesh(
        buildingGeometry([{ id: -2, p: [...p, p[0]], h: H, min: PODIUM_H - 1, type: 'hotel', kId: 7, exact: true }]),
        mallMesh.material,
      );
      tower.castShadow = true;
      mallGroup.add(tower);
      label(
        { en: 'Paradox KLCC · hotel & residences (indicative)', zh: 'Paradox KLCC · 酒店与住宅（示意）' },
        V(c[0], c[1], H + 6),
        { kind: 'building', pri: 600, color: '#7A8696', maxDist: 2600, minor: 1 },
      );
    }
  }
  // rooftop: the 25 m lap pool, deck and glass balustrade on 63A
  {
    const b = (facing * Math.PI) / 180,
      vx = Math.sin(b),
      vy = Math.cos(b),
      d = (CONFIG.main.footprint?.d ?? 20) / 2 - 4.5;
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(34, 0.3, (CONFIG.main.footprint?.d ?? 20) - 4),
      dimmable(new THREE.MeshStandardMaterial({ color: 0x9c8a74, roughness: 0.8 }), 'roofdeck'),
    );
    const pool = new THREE.Mesh(
      new THREE.BoxGeometry(25, 0.25, 3.6),
      new THREE.MeshStandardMaterial({
        color: 0x38b6d8,
        emissive: 0x0f6f8f,
        emissiveIntensity: 0.35,
        roughness: 0.05,
        metalness: 0.1,
      }),
    );
    deck.position.set(c0[0], MALL_H + 0.15, -c0[1]);
    pool.position.set(c0[0] + vx * d, MALL_H + 0.35, -(c0[1] + vy * d));
    deck.rotation.y = pool.rotation.y = -b + Math.PI / 2;
    mallGroup.add(deck, pool);
  }
}
