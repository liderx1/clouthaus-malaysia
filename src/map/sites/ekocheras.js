// EkoCheras Mall only (site.config.json → "extras": "ekocheras"): landmarks seen on Street View that OpenStreetMap does
// not model — the red sky bridge between Tower J and Tower H, and the covered MRT link bridge to the mall.
import * as THREE from 'three';
import { bInfo } from '../buildings.js';
import { OSM, ring } from '../data.js';
import { ribbon, roadZ } from '../ground.js';
import { LINK_ROOF } from '../mall.js';
import { dimmable, scene } from '../stage.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function build() {
  {
    const J = OSM.buildings.find((b) => b.name === 'Tower J'),
      H = OSM.buildings.find((b) => b.name === 'Tower H');
    if (J && H) {
      const cen = (b) => {
        const r = ring(b.p);
        return r.reduce((a, q) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0]);
      };
      const p = cen(J),
        q = cen(H),
        L = Math.hypot(q[0] - p[0], q[1] - p[1]),
        top = Math.min(bInfo(J).h, bInfo(H).h);
      const br = new THREE.Mesh(
        new THREE.BoxGeometry(L, 7, 9),
        dimmable(new THREE.MeshStandardMaterial({ color: 0xb7452f, roughness: 0.5, metalness: 0.3 }), 'skyb'),
      );
      br.position.set((p[0] + q[0]) / 2, top - 20, -(p[1] + q[1]) / 2);
      br.rotation.y = Math.atan2(q[1] - p[1], q[0] - p[0]);
      br.castShadow = true;
      scene.add(br);
    }
  }
  {
    const link = OSM.roads.find((r) => r.name === 'to EkoCheras Mall' && r.bridge);
    if (link) {
      const z = roadZ(link),
        p = link.p,
        glass = [],
        roof = [];
      for (let i = 1; i < p.length; i++) {
        const [x1, y1] = p[i - 1],
          [x2, y2] = p[i];
        const L = Math.hypot(x2 - x1, y2 - y1),
          ux = (x2 - x1) / L,
          uy = (y2 - y1) / L;
        for (const sg of [1, -1]) {
          const ox = -uy * 2.6 * sg,
            oy = ux * 2.6 * sg;
          const g = new THREE.PlaneGeometry(L, 3.2);
          g.rotateY(Math.atan2(y2 - y1, x2 - x1));
          g.translate((x1 + x2) / 2 + ox, z + 1.6, -((y1 + y2) / 2 + oy));
          glass.push(g);
        }
      }
      roof.push(
        ribbon(
          p.map((q) => [q[0], q[1], z + 3.3]),
          6.2,
          0,
          false,
        ),
      );
      const gm = new THREE.Mesh(
        mergeGeometries(glass),
        dimmable(
          new THREE.MeshStandardMaterial({
            color: 0x9fb4c2,
            roughness: 0.08,
            metalness: 0.6,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
          }),
          'lglass',
        ),
      );
      const rm = new THREE.Mesh(
        mergeGeometries(roof),
        dimmable(
          new THREE.MeshStandardMaterial({ color: 0xc9cdd0, roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide }),
          'lroof',
        ),
      );
      rm.castShadow = true;
      scene.add(gm, rm);
      LINK_ROOF.push(rm);
    }
  }
}
