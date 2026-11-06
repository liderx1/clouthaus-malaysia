// The 3D floor plate: the typical floor of the tower (levels 17–32) built from the developer's plan, at its height in
// the 3D tower. Walls come from the plan drawing itself (public/map/plate.json, made by scripts/plate_walls.mjs); the
// units, their rooms and every detail the developer publishes for each type come from seed/plate-units.json.
// Choosing a unit type opens it: the tower opens up at that floor, the unit lights up in champagne with its rooms
// named, and a panel lists its size, bedrooms and bathrooms, dimensions, homes, levels, the side it faces and its
// features. Tap another unit or type to move to it; × goes back to the map.
// Bundled on its own into public/map/plate.js and loaded the first time a unit type is opened (src/map/ui.js).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const WALL_H = 1.7; // cut-away height, so the rooms read from above
const W = {
  en: {
    close: 'Back to the map',
    size: 'Size',
    rooms: 'Bedrooms / bathrooms',
    dims: 'Overall (mm)',
    homes: 'Homes',
    levels: 'Levels',
    faces: 'Faces',
    unit: 'Unit',
    plan: 'Open the floor plan',
    every: 'In every home',
    hint: 'Tap a unit, or choose a type below',
    note: 'Walls and positions from the developer’s plans; indicative.',
    notHere: 'Not on this floor: shown from its own plan.',
  },
  zh: {
    close: '返回地图',
    size: '面积',
    rooms: '房 / 浴',
    dims: '外尺寸（毫米）',
    homes: '户数',
    levels: '楼层',
    faces: '朝向',
    unit: '单位',
    plan: '查看平面图',
    every: '每户标配',
    hint: '点选单位，或在下方选择户型',
    note: '墙体与位置依建商平面图绘制，仅供参考。',
    notHere: '不在此标准层，请参阅该户型平面图。',
  },
};
const lang = () => (document.documentElement.lang.startsWith('zh') ? 'zh' : 'en');
const w = (/** @type {string} */ k) => /** @type {any} */ (W)[lang()][k];
const tr = (/** @type {any} */ o) => (o && typeof o === 'object' ? (o[lang()] ?? o.en) : o);
const esc = (/** @type {string} */ s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

let state = null;

/**
 * @param {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: any, S: any, centre: number[], facing: number,
 *   floorZ: number, hide: THREE.Object3D[], glass?: THREE.Material[], fade?: THREE.Material[], data: string, type: string,
 *   uplight?: any, renderer?: any,
 *   onZoom: (src: string, alt: string) => void }} ctx
 */
/** @type {Promise<any> | null} */
let built = null;
/**
 * Build the floor once, ahead of time (called when the map is idle), so opening it is instant: the data is fetched,
 * the geometry made, and its shaders compiled while nothing is happening on screen.
 * @param {any} ctx
 */
export function prepare(ctx) {
  return (built ??= (async () => {
    const D = await (await fetch(ctx.data)).json();
    const { scene } = ctx;
    // plan → world: u along the long side (toward The Exchange 106), v toward KL City Centre
    const b = (ctx.facing * Math.PI) / 180,
      U = [Math.cos(b), -Math.sin(b)],
      V = [Math.sin(b), Math.cos(b)];
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    g.matrix.makeBasis(
      new THREE.Vector3(U[0], 0, -U[1]),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-V[0], 0, V[1]),
    );
    g.matrix.setPosition(ctx.centre[0], ctx.floorZ, -ctx.centre[1]);
    // local frame: x = u, z = −v
    const P = (/** @type {number[]} */ p, y = 0) => new THREE.Vector3(p[0], y, -p[1]);
    const toWorld = (/** @type {number[]} */ p, y = 0) => P(p, y).applyMatrix4(g.matrix);

    // the slab, a rounded rectangle the size of the floor: dark glass with a glowing rim
    const [[u0, v1], [u1, v0]] = D.bbox,
      r = 5;
    const shape = new THREE.Shape();
    shape.moveTo(u0 + r, v0);
    shape.lineTo(u1 - r, v0);
    shape.quadraticCurveTo(u1, v0, u1, v0 + r);
    shape.lineTo(u1, v1 - r);
    shape.quadraticCurveTo(u1, v1, u1 - r, v1);
    shape.lineTo(u0 + r, v1);
    shape.quadraticCurveTo(u0, v1, u0, v1 - r);
    shape.lineTo(u0, v0 + r);
    shape.quadraticCurveTo(u0, v0, u0 + r, v0);
    const GOLD = 0xe6cfa1,
      GLOW = 0xf6e3b6;
    /** every material, so the look can switch between night (glowing gold) and day (deep bronze on the bright city) */
    const M = /** @type {Record<string, any>} */ ({});
    const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false });
    slabGeo.rotateX(Math.PI / 2);
    slabGeo.scale(1, 1, -1); // extrude downward, v → −z
    g.add(
      new THREE.Mesh(
        slabGeo,
        (M.slab = new THREE.MeshBasicMaterial({
          color: 0x1a130b,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        })),
      ),
    );
    const rim = shape.getSpacedPoints(200).map((q) => new THREE.Vector3(q.x, 0.03, -q.y));
    g.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rim),
        (M.rim = new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0.95 })),
      ),
    );
    // the curtain wall, a breath of glass
    const glassGeo = new THREE.BufferGeometry();
    const gp = [];
    for (let i = 0; i < rim.length - 1; i++) {
      const q0 = rim[i],
        q1 = rim[i + 1];
      gp.push(q0.x, 0, q0.z, q1.x, 0, q1.z, q1.x, 2.8, q1.z, q0.x, 0, q0.z, q1.x, 2.8, q1.z, q0.x, 2.8, q0.z);
    }
    glassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    g.add(
      new THREE.Mesh(
        glassGeo,
        (M.glass = new THREE.MeshBasicMaterial({
          color: GOLD,
          transparent: true,
          opacity: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false,
        })),
      ),
    );
    // the walls, straight from the plan: near-clear volumes with glowing edges
    const wallGeo = mergeGeometries(
      D.walls.map((/** @type {number[]} */ [a, b2, c, d]) => {
        const bg = new THREE.BoxGeometry(c - a, WALL_H, d - b2);
        bg.translate((a + c) / 2, WALL_H / 2, -(b2 + d) / 2);
        return bg;
      }),
    );
    g.add(
      new THREE.Mesh(
        wallGeo,
        (M.wall = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.08, depthWrite: false })),
      ),
      new THREE.LineSegments(
        new THREE.EdgesGeometry(wallGeo, 30),
        (M.edge = new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0.34, depthWrite: false })),
      ),
    );
    // a ring of light round the floor, and a dotted one further out
    const R0 = Math.hypot(u1 - u0, v1 - v0) / 2 + 3;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(R0, R0 + 0.35, 160),
      (M.ring = new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      })),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.2;
    g.add(ring);
    const dots = [];
    for (let i = 0; i < 120; i++) {
      const a2 = (i / 120) * Math.PI * 2;
      dots.push(Math.cos(a2) * (R0 + 6), -0.2, Math.sin(a2) * (R0 + 6));
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
    g.add(
      new THREE.Points(
        dotGeo,
        (M.dots = new THREE.PointsMaterial({
          color: GLOW,
          size: 0.55,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        })),
      ),
    );
    // light pillars: a fading beam with a bright foot, for the rooms of the chosen unit and for every unit
    const BEAM_C = { value: new THREE.Color(GLOW) };
    M.beamC = BEAM_C;
    M.beams = /** @type {THREE.ShaderMaterial[]} */ ([]);
    M.foot = new THREE.MeshBasicMaterial({ color: GLOW, transparent: true, opacity: 0.9, depthWrite: false });
    // shared per strength, so choosing another unit makes no new shader
    const beamCache = /** @type {Record<number, THREE.ShaderMaterial>} */ ({});
    const beamMat = (/** @type {number} */ k) => (beamCache[k] ??= M.beams[M.beams.push(newBeam(k)) - 1]);
    const newBeam = (/** @type {number} */ k) =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uC: BEAM_C, uK: { value: k } },
        vertexShader:
          'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader:
          'uniform vec3 uC; uniform float uK; varying float vY; void main(){ gl_FragColor = vec4(uC, uK * pow(clamp(1.0 - vY, 0.0, 1.0), 1.6)); }', // clamped: pow() of a tiny negative is NaN, which bloom smears into black blocks,
      });
    const beamGeo = (/** @type {number} */ h, /** @type {number} */ r2) =>
      new THREE.CylinderGeometry(r2, r2, h, 10, 1, true).translate(0, h / 2, 0);
    const roomBeams = new THREE.Group(),
      unitBeams = new THREE.Group();
    g.add(roomBeams, unitBeams);
    const ROOM_H = 7,
      UNIT_H = 11;
    // the units' floors: a faint wash, the chosen one lit
    const units = D.units.map((/** @type {any} */ u) => {
      const s2 = new THREE.Shape(u.poly.map((/** @type {number[]} */ q) => new THREE.Vector2(q[0], q[1])));
      const geo = new THREE.ShapeGeometry(s2);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0.04, 0);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.06, depthWrite: false }),
      );
      mesh.userData.unit = u;
      g.add(mesh);
      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          u.poly.map((/** @type {number[]} */ q) => new THREE.Vector3(q[0], 0.06, -q[1])),
        ),
        new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0, depthWrite: false }),
      );
      g.add(outline);
      const c = u.poly.reduce((a2, q) => [a2[0] + q[0] / u.poly.length, a2[1] + q[1] / u.poly.length], [0, 0]);
      const beam = new THREE.Mesh(beamGeo(UNIT_H, 0.06), beamMat(0.55));
      beam.position.set(c[0], 0, -c[1]);
      unitBeams.add(beam);
      return { u, mesh, outline, centre: c };
    });
    // dimension lines along the chosen unit: the overall size from its plan
    const dimLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      (M.dim = new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0.85, depthWrite: false })),
    );
    g.add(dimLines);
    // the model is never hidden by the city: drawn after it, with no depth test (the dark slab first, then the rest)
    // a sample room pillar and foot, so their shaders are compiled now and not on the first tap
    const sample = [
      new THREE.Mesh(beamGeo(7, 0.05), beamMat(0.9)),
      new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), M.foot),
    ];
    roomBeams.add(...sample);
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = false;
      const m = /** @type {any} */ (o).material;
      if (m) m.depthTest = false;
      o.renderOrder = /** @type {any} */ (o).material === M.slab ? 19 : 20;
    });
    M.beams.forEach((b) => (b.depthTest = false));
    M.foot.depthTest = false;

    g.updateMatrixWorld(true);
    g.visible = true;
    scene.add(g);
    try {
      // compiled in the background where the browser can (parallel shader compile), else at once
      if (ctx.renderer?.compileAsync) await ctx.renderer.compileAsync(g, ctx.camera, scene);
      else ctx.renderer?.compile(scene, ctx.camera);
    } catch {}
    roomBeams.clear();
    g.visible = false;
    return { D, g, toWorld, units, roomBeams, dimLines, beamMat, beamGeo, ROOM_H, UNIT_H, M };
  })());
}

export async function open(ctx) {
  if (state) return select(ctx.type);
  const B = await prepare(ctx);
  const { camera, controls, S } = ctx;
  const { D, g, toWorld, units, roomBeams, dimLines, beamMat, beamGeo, ROOM_H, UNIT_H, M } = B;
  g.visible = true;
  let dimAt = /** @type {{ w: number[], d: number[] } | null} */ (null);

  // the map steps aside: the tower is opened at this floor, the halo and rings hidden
  const saved = {
    pos: camera.position.clone(),
    target: controls.target.clone(),
    near: camera.near,
    min: controls.minDistance,
    polar: controls.maxPolarAngle,
    rot: controls.autoRotate,
  };
  ctx.hide.forEach((o) => {
    o.userData.plateVis = o.visible;
    o.visible = false;
  });
  // the tower turns to glass (its materials are transparent from the start, so only the opacity moves: no shader
  // rebuild, no stall), the lit Twin Towers step back to a ghost, and a soft light rises up the facade
  const glassMats = ctx.glass ?? [],
    fadeMats = ctx.fade ?? [];
  const before = [...glassMats, ...fadeMats].map((m) => ({ m, o: m.opacity, d: m.depthWrite }));
  glassMats.forEach((m) => (m.depthWrite = false));
  fadeMats.forEach((m) => (m.depthWrite = false));
  const up = ctx.uplight;
  if (up) up.visible = true;
  let fade = { t0: performance.now(), from: 0, to: 1 };
  const applyFade = (/** @type {number} */ k) => {
    // the tower as glass: a little more body by day, when the bright city behind would wash it out
    const glass = S.nightTarget > 0.5 ? 0.12 : 0.3;
    for (const m of glassMats) m.opacity = 1 - (1 - glass) * k;
    for (const m of fadeMats) m.opacity = 1 - 0.8 * k;
    if (up) up.material.uniforms.uOn.value = k;
  };
  S.plate = true;
  // the look follows day and night: glowing gold on the dark city, deep bronze on the bright one
  let lookNight = -1;
  const look = () => {
    const night = S.nightTarget > 0.5 ? 1 : 0;
    if (night === lookNight) return;
    lookNight = night;
    const N = !!night;
    const set = (/** @type {any} */ m, c, o) => {
      m.color?.set(c);
      m.opacity = o;
    };
    // by day the floor stands on a darker glass slab, so the gold reads as it does at night
    set(M.slab, N ? 0x1a130b : 0x3b2e20, N ? 0.42 : 0.55);
    set(M.rim, N ? 0xf6e3b6 : 0xf0d39a, 0.95);
    set(M.glass, N ? 0xe6cfa1 : 0xc9a46a, N ? 0.05 : 0.07);
    set(M.wall, N ? 0xe6cfa1 : 0xe6cfa1, N ? 0.08 : 0.1);
    set(M.edge, N ? 0xf6e3b6 : 0xf0d39a, N ? 0.34 : 0.5);
    set(M.ring, N ? 0xe6cfa1 : 0xa77a34, N ? 0.45 : 0.7);
    set(M.dots, N ? 0xf6e3b6 : 0xa77a34, N ? 0.7 : 0.85);
    set(M.dim, N ? 0xf6e3b6 : 0xf0d39a, 0.9);
    set(M.foot, N ? 0xf6e3b6 : 0xf6e3b6, 0.9);
    M.beamC.value.set(N ? 0xf6e3b6 : 0xf0d39a);
    for (const b2 of M.beams) b2.blending = THREE.AdditiveBlending;
    unitLook = [0xe6cfa1, 0.5, N ? 0.04 : 0.05, 0xf6e3b6];
    paintUnits();
    document.body.classList.toggle('plate-day', !N);
  };
  /** chosen unit colour, its opacity, the others' opacity, outline colour */
  let unitLook = [0xe6cfa1, 0.5, 0.04, 0xf6e3b6];
  const paintUnits = () => {
    const un = unitFor(current);
    units.forEach((x) => {
      const on = x === un;
      x.mesh.material.color.set(unitLook[0]);
      x.mesh.material.opacity = on ? unitLook[1] : unitLook[2];
      x.outline.material.color.set(unitLook[3]);
      x.outline.material.opacity = on ? 1 : 0.22;
    });
  };
  // by day the city behind is calmed a little so the plan reads, never greyed out
  S.fly = null;
  S.zoomTo = null;
  controls.autoRotate = false;
  controls.minDistance = 12;
  camera.near = 1;
  camera.updateProjectionMatrix();

  // overlay: unit tags, room names, the detail panel, type chips, close
  const ui = document.createElement('div');
  ui.className = 'plate';
  document.body.append(ui);
  document.body.classList.add('is-plate');
  let current = ctx.type;

  const typeOf = (/** @type {string} */ t) => D.types[t];
  const unitFor = (/** @type {string} */ t) => units.find((x) => x.u.types.includes(t));
  function render() {
    const t = typeOf(current),
      un = unitFor(current),
      zh = lang() === 'zh';
    const rows = [
      [w('size'), `${t.sqft.toLocaleString('en')} sq ft · ${t.m2} m²`],
      [
        w('rooms'),
        zh
          ? `${t.bed} 房 ${t.bath} 浴`
          : `${t.bed} bedroom${t.bed > 1 ? 's' : ''} · ${t.bath} bathroom${t.bath > 1 ? 's' : ''}`,
      ],
      [w('dims'), t.dims],
      [w('unit'), `${t.unit}`],
      [w('levels'), t.levels],
      [w('homes'), `${t.homes}`],
      [w('faces'), tr(t.side)],
    ];
    ui.innerHTML = `
      <header class="plate-top"><div><b>${esc(tr(D.floor))}</b><small>${esc(w('note'))}</small></div><button class="plate-x" type="button" aria-label="${esc(w('close'))}">×</button></header>
      <aside class="plate-card">
        <h2>${esc(zh ? current.replace('Type ', '') + ' 型' : current)}</h2>
        ${un ? '' : `<p class="plate-warn">${esc(w('notHere'))}</p>`}
        <dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <ul>${t.extra.map((/** @type {any} */ e) => `<li>${esc(tr(e))}</li>`).join('')}</ul>
        <details><summary>${esc(w('every'))}</summary><ul>${D.common.map((/** @type {any} */ e) => `<li>${esc(tr(e))}</li>`).join('')}</ul></details>
        <button class="plate-plan" type="button">${esc(w('plan'))}</button>
      </aside>
      <nav class="plate-types">${Object.keys(D.types)
        .map(
          (k) =>
            `<button type="button" data-type="${k}"${k === current ? ' class="is-on"' : ''}>${k.replace('Type ', '')}</button>`,
        )
        .join('')}</nav>
      ${units.map((x) => `<span class="plate-tag${x === un ? ' is-on' : ''}" data-u="${x.u.unit}">${esc(x.u.types.map((y) => y.replace('Type ', '')).join(' / '))}<i>${x.u.unit}</i></span>`).join('')}
${un ? un.u.rooms.map((/** @type {any} */ rm, i) => `<span class="plate-room" data-r="${i}">${esc(D.names[rm.k][zh ? 1 : 0])}</span>`).join('') : ''}
      ${un ? `<span class="plate-dim" data-dim="w">${esc(t.dims.split(' × ')[0])} mm</span><span class="plate-dim" data-dim="d">${esc(t.dims.split(' × ')[1])} mm</span>` : ''}`;
    ui.querySelector('.plate-x')?.addEventListener('click', close);
    ui.querySelector('.plate-plan')?.addEventListener('click', () => ctx.onZoom(t.plan, current));
    ui.querySelectorAll('[data-type]').forEach((el) =>
      el.addEventListener('click', () => select(/** @type {string} */ (el.getAttribute('data-type')))),
    );
    ui.querySelectorAll('.plate-tag').forEach((el) =>
      el.addEventListener('click', () => {
        const x = units.find((y) => String(y.u.unit) === el.getAttribute('data-u'));
        if (x) select(x.u.types[0]);
      }),
    );
    ui.querySelector('.plate-types .is-on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    // floors: the chosen unit in champagne
    paintUnits();
    // beams on the chosen unit's rooms
    roomBeams.clear();
    if (un)
      for (const rm of un.u.rooms) {
        const bm = new THREE.Mesh(beamGeo(ROOM_H, 0.05), beamMat(0.9));
        bm.position.set(rm.at[0], 0, -rm.at[1]);
        bm.renderOrder = 20;
        roomBeams.add(bm);
        const foot = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20).rotateX(-Math.PI / 2), M.foot);
        foot.position.set(rm.at[0], 0.08, -rm.at[1]);
        foot.renderOrder = 20;
        roomBeams.add(foot);
      }
    // dimension lines outside the unit's outline, with ticks at the ends
    dimAt = null;
    if (un) {
      const us = un.u.poly.map((q) => q[0]),
        vs = un.u.poly.map((q) => q[1]);
      const a0 = Math.min(...us),
        a1 = Math.max(...us),
        b0 = Math.min(...vs),
        b1 = Math.max(...vs);
      const outV = b1 > 0 ? b1 + 1.6 : b0 - 1.6,
        outU = a1 > 0 ? a1 + 1.6 : a0 - 1.6,
        y = 0.1;
      const L = [
        [a0, outV, a1, outV],
        [a0, outV - 0.5, a0, outV + 0.5],
        [a1, outV - 0.5, a1, outV + 0.5],
        [outU, b0, outU, b1],
        [outU - 0.5, b0, outU + 0.5, b0],
        [outU - 0.5, b1, outU + 0.5, b1],
      ].flatMap(([x0, z0, x1, z1]) => [x0, y, -z0, x1, y, -z1]);
      dimLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
      dimLines.geometry.computeBoundingSphere();
      dimAt = { w: [(a0 + a1) / 2, outV + (b1 > 0 ? 1.2 : -1.2)], d: [outU + (a1 > 0 ? 1.4 : -1.4), (b0 + b1) / 2] };
    }
    dimLines.visible = !!un;
  }
  /** fly to frame the floor with the chosen unit in front */
  function frame(first = false) {
    // the whole floor in view, seen from the KL Tower side so it reads like the developer's drawing (KLCC at the
    // top), leaning a little toward the chosen unit; a phone held upright stands further back
    const un = unitFor(current);
    const c = un ? un.centre : [0, 0];
    const portrait = innerWidth < innerHeight;
    // a phone shows the chosen unit up close, in the upper half of the screen (the details panel is below)
    // seen from the KL City Centre side, a three-quarter view: the lit Twin Towers stay behind the viewer, the chosen
    // unit near the centre (on a phone, above the details panel)
    const target = toWorld(portrait ? [c[0], c[1] + 7] : [c[0] * 0.7, c[1] * 0.7], 0);
    const back = toWorld([0.35, 1], 0)
      .sub(toWorld([0, 0], 0))
      .normalize();
    const dist = portrait ? 96 : 62;
    const pos = target
      .clone()
      .add(back.multiplyScalar(dist * (portrait ? 0.5 : 0.7)))
      .setY(target.y + dist * (portrait ? 0.82 : 0.66));
    S.fly = {
      t0: performance.now(),
      dur: first ? 1600 : 900,
      fromP: camera.position.clone(),
      fromT: controls.target.clone(),
      toP: pos,
      toT: target,
    };
  }
  function select(/** @type {string} */ t) {
    if (!D.types[t]) return;
    current = t;
    render();
    frame();
  }
  state = { select, close };

  // labels follow the view
  const v = new THREE.Vector3();
  let raf = 0;
  const place = (/** @type {HTMLElement} */ el, /** @type {THREE.Vector3} */ p) => {
    v.copy(p).project(camera);
    const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
    el.style.opacity = on ? '' : '0';
    el.style.transform = `translate(${((v.x + 1) / 2) * innerWidth}px, ${((1 - v.y) / 2) * innerHeight}px) translate(-50%, -50%)`;
  };
  const tick = () => {
    if (fade) {
      const k = Math.min(1, (performance.now() - fade.t0) / 700),
        e = k * k * (3 - 2 * k);
      applyFade(fade.from + (fade.to - fade.from) * e);
      if (k >= 1) {
        const done = fade;
        fade = null;
        if (done.to === 0) finish();
      }
    }
    if (state) look();
    ui.querySelectorAll('.plate-tag').forEach((el) => {
      const x = units.find((y) => String(y.u.unit) === el.getAttribute('data-u'));
      if (x) place(/** @type {HTMLElement} */ (el), toWorld(x.centre, UNIT_H + 0.8));
    });
    const un = unitFor(current);
    if (un)
      ui.querySelectorAll('.plate-room').forEach((el) => {
        const rm = un.u.rooms[Number(el.getAttribute('data-r'))];
        if (rm) place(/** @type {HTMLElement} */ (el), toWorld(rm.at, ROOM_H + 0.5));
      });
    if (dimAt)
      ui.querySelectorAll('.plate-dim').forEach((el) => {
        const at = /** @type {any} */ (dimAt)[/** @type {string} */ (el.getAttribute('data-dim'))];
        if (at) place(/** @type {HTMLElement} */ (el), toWorld(at, 0.3));
      });
    raf = requestAnimationFrame(tick);
  };
  // tap a unit on the floor to choose it
  const ray = new THREE.Raycaster(),
    ptr = new THREE.Vector2();
  let down = null;
  const onDown = (/** @type {PointerEvent} */ e) => (down = [e.clientX, e.clientY]);
  const onUp = (/** @type {PointerEvent} */ e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(
      units.map((x) => x.mesh),
      false,
    )[0];
    if (hit) select(hit.object.userData.unit.types[0]);
  };
  const canvas = /** @type {HTMLElement} */ (document.querySelector('#stage canvas'));
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  const esc_ = (/** @type {KeyboardEvent} */ e) =>
    e.key === 'Escape' && !document.querySelector('.plan-zoom') && close();
  addEventListener('keydown', esc_);
  const langObs = new MutationObserver(render);
  langObs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
  frame(true);
  raf = requestAnimationFrame(tick);

  function close() {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    removeEventListener('keydown', esc_);
    langObs.disconnect();
    g.visible = false; // kept, ready for next time
    ui.remove();
    document.body.classList.remove('is-plate', 'plate-day');
    // the chosen type in the list goes back to normal
    document.querySelectorAll('.store.is-on').forEach((el) => el.classList.remove('is-on'));
    ctx.hide.forEach((o) => (o.visible = o.userData.plateVis ?? true));
    camera.near = saved.near;
    camera.updateProjectionMatrix();
    controls.minDistance = saved.min;
    S.plate = false;
    S.fly = {
      t0: performance.now(),
      dur: 1200,
      fromP: camera.position.clone(),
      fromT: controls.target.clone(),
      toP: saved.pos,
      toT: saved.target,
    };
    state = null;
    // the tower fades back from glass; the uplight goes with it
    const k0 = up ? up.material.uniforms.uOn.value : 1;
    fade = { t0: performance.now(), from: k0, to: 0 };
  }
  /** after the fade back: the tower is solid again (unless the floor was opened again meanwhile) */
  function finish() {
    cancelAnimationFrame(raf);
    if (state) return;
    for (const x of before) {
      x.m.opacity = x.o;
      x.m.depthWrite = x.d;
    }
    if (up) up.visible = false;
  }
}
