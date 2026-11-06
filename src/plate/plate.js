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
 *   floorZ: number, hide: THREE.Object3D[], data: string, type: string, onZoom: (src: string, alt: string) => void }} ctx
 */
export async function open(ctx) {
  if (state) return select(ctx.type);
  const D = await (await fetch(ctx.data)).json();
  const { scene, camera, controls, S } = ctx;
  // plan → world: u along the long side (toward The Exchange 106), v toward KL City Centre
  const b = (ctx.facing * Math.PI) / 180,
    U = [Math.cos(b), -Math.sin(b)],
    V = [Math.sin(b), Math.cos(b)];
  const g = new THREE.Group();
  g.matrixAutoUpdate = false;
  g.matrix.makeBasis(new THREE.Vector3(U[0], 0, -U[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-V[0], 0, V[1]));
  g.matrix.setPosition(ctx.centre[0], ctx.floorZ, -ctx.centre[1]);
  // local frame: x = u, z = −v
  const P = (/** @type {number[]} */ p, y = 0) => new THREE.Vector3(p[0], y, -p[1]);
  const toWorld = (/** @type {number[]} */ p, y = 0) => P(p, y).applyMatrix4(g.matrix);

  // the slab, a rounded rectangle the size of the floor
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
  const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false });
  slabGeo.rotateX(Math.PI / 2); // extrude downward; shape y (= v) becomes −z
  const slab = new THREE.Mesh(
    slabGeo,
    new THREE.MeshStandardMaterial({ color: 0xd9d2c6, roughness: 0.85, emissive: 0x6e6a63 }),
  );
  g.add(slab);
  // curtain wall: a faint glass band round the edge
  const edgePts = shape.getSpacedPoints(160).map((q) => new THREE.Vector3(q.x, 0, -q.y));
  const glassGeo = new THREE.BufferGeometry();
  const gp = [];
  for (let i = 0; i < edgePts.length - 1; i++) {
    const a = edgePts[i],
      c = edgePts[i + 1];
    gp.push(a.x, 0, a.z, c.x, 0, c.z, c.x, 2.8, c.z, a.x, 0, a.z, c.x, 2.8, c.z, a.x, 2.8, a.z);
  }
  glassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  glassGeo.computeVertexNormals();
  g.add(
    new THREE.Mesh(
      glassGeo,
      new THREE.MeshStandardMaterial({
        color: 0xcfe0e6,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ),
  );
  // the walls, straight from the plan
  const wallGeo = mergeGeometries(
    D.walls.map((/** @type {number[]} */ [a, b2, c, d]) => {
      const bg = new THREE.BoxGeometry(c - a, WALL_H, d - b2);
      bg.translate((a + c) / 2, WALL_H / 2, -(b2 + d) / 2);
      return bg;
    }),
  );
  g.add(
    new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0x3a312a, roughness: 0.7, emissive: 0x1c1712 })),
  );
  // the units' floors: ivory, the chosen one lit champagne
  const floorMat = () =>
    new THREE.MeshStandardMaterial({ color: 0xf1ebe1, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1 });
  const units = D.units.map((/** @type {any} */ u) => {
    const s2 = new THREE.Shape(u.poly.map((/** @type {number[]} */ q) => new THREE.Vector2(q[0], q[1])));
    const geo = new THREE.ShapeGeometry(s2);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0.02, 0);
    const mesh = new THREE.Mesh(geo, floorMat());
    mesh.userData.unit = u;
    g.add(mesh);
    const c = u.poly.reduce((a, q) => [a[0] + q[0] / u.poly.length, a[1] + q[1] / u.poly.length], [0, 0]);
    return { u, mesh, centre: c };
  });
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = false;
  });
  g.updateMatrixWorld(true);
  scene.add(g);

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
  S.plate = true;
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
      ${un ? un.u.rooms.map((/** @type {any} */ rm, i) => `<span class="plate-room" data-r="${i}">${esc(D.names[rm.k][zh ? 1 : 0])}</span>`).join('') : ''}`;
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
    units.forEach((x) => {
      const on = x === un;
      x.mesh.material.color.set(on ? 0xe2b25c : 0xe9e5de);
      x.mesh.material.emissive.set(on ? 0xa27a34 : 0x76736e);
    });
  }
  /** fly to frame the floor with the chosen unit in front */
  function frame(first = false) {
    // the whole floor in view, seen from the KL Tower side so it reads like the developer's drawing (KLCC at the
    // top), leaning a little toward the chosen unit; a phone held upright stands further back
    const un = unitFor(current);
    const c = un ? un.centre : [0, 0];
    const portrait = innerWidth < innerHeight;
    // a phone shows the chosen unit up close, in the upper half of the screen (the details panel is below)
    const target = toWorld(portrait ? [c[0], c[1] - 9] : [c[0] * 0.45, c[1] * 0.45], 0);
    const back = toWorld([0, -1], 0)
      .sub(toWorld([0, 0], 0))
      .normalize();
    const dist = portrait ? 62 : 66;
    const pos = target
      .clone()
      .add(back.multiplyScalar(dist * (portrait ? 0.22 : 0.4)))
      .setY(target.y + dist * 0.92);
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
    ui.querySelectorAll('.plate-tag').forEach((el) => {
      const x = units.find((y) => String(y.u.unit) === el.getAttribute('data-u'));
      if (x) place(/** @type {HTMLElement} */ (el), toWorld(x.centre, WALL_H + 2.2));
    });
    const un = unitFor(current);
    if (un)
      ui.querySelectorAll('.plate-room').forEach((el) => {
        const rm = un.u.rooms[Number(el.getAttribute('data-r'))];
        if (rm) place(/** @type {HTMLElement} */ (el), toWorld(rm.at, 0.4));
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
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    removeEventListener('keydown', esc_);
    langObs.disconnect();
    scene.remove(g);
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    ui.remove();
    document.body.classList.remove('is-plate');
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
  }
}
