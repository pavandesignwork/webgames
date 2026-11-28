// THE ISLAND: coastline, lakes, a river with a railway bridge, a central mountain with a cave, an old mine,
// a tunnel through the Iron Hills, small villages, landmarks at stations, big gateway stations, sheds,
// telegraph poles and bushes. Static meshes are merged per material so the extra scenery stays cheap.
import * as THREE from 'three';
import { mergeGeometries } from './vendor/jsm/utils/BufferGeometryUtils.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const rng = seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ===================================================================== PLAN (before the terrain is built)
export function planIsland({ curve, TL, trackDist }) {
  const R = rng(4242);
  const P = s => curve.getPointAt(((s / TL) % 1 + 1) % 1), T = s => curve.getTangentAt(((s / TL) % 1 + 1) % 1);
  const at = (s, lat, dz = 0) => { const p = P(s), t = T(s); return { x: p.x + t.z * lat + t.x * dz, z: p.z - t.x * lat + t.z * dz, yaw: Math.atan2(t.x, t.z) }; };
  const st = i => i / 25 * TL;
  // coastline radius per degree: track radius + a margin (narrow along the Drowned Coast)
  const trackR = new Array(360).fill(0);
  for (let i = 0; i < 720; i++) { const p = P(i / 720 * TL), a = Math.round((Math.atan2(p.z, p.x) * 180 / Math.PI + 360)) % 360, r = Math.hypot(p.x, p.z); for (let k = -5; k <= 5; k++) { const j = (a + k + 360) % 360; trackR[j] = Math.max(trackR[j], r); } }
  const coast = trackR.map((r, a) => { const deg = a > 180 ? a - 360 : a; const near = sstep(-175, -150, deg) * (1 - sstep(-80, -55, deg)); return r + lerp(215, 95, near) + Math.sin(a * .21) * 12 + Math.sin(a * .07) * 15; });
  const coastR = th => { const a = ((th * 180 / Math.PI) % 360 + 360) % 360, i = Math.floor(a), f = a - i; return lerp(coast[i], coast[(i + 1) % 360], f); };
  const plan = { coastR, lakes: [], mounts: [], pads: [], river: null, keep: [], extraCrates: [], at, st, P, T, TL };
  const keep = (x, z, r) => plan.keep.push({ x, z, r });
  { const q = at(0, 16); keep(q.x, q.z, 52); }   // the Yard (shed, storage tracks, office)
  // lakes + central mountain
  plan.lakes.push({ x: 80, z: 90, r: 55 }, { x: -170, z: 40, r: 40 }, { x: -40, z: -205, r: 36 });
  plan.mounts.push({ x: -45, z: -45, r: 95, h: 42 }, { x: 150, z: -120, r: 60, h: 16 }, { x: -120, z: 170, r: 55, h: 14 });
  for (const l of plan.lakes) keep(l.x, l.z, l.r * 1.25);
  // river: from the southern lake, under the track (bridge) and out to the sea
  const sc = 18.75 / 25 * TL, cp = P(sc), ct = T(sc); let nx = ct.z, nz = -ct.x; const L3 = plan.lakes[2]; if ((cp.x - L3.x) * nx + (cp.z - L3.z) * nz < 0) { nx = -nx; nz = -nz; }
  const rp = [[L3.x, L3.z], [lerp(L3.x, cp.x, .45) + 8, lerp(L3.z, cp.z, .45)], [cp.x - nx * 22, cp.z - nz * 22], [cp.x, cp.z], [cp.x + nx * 24, cp.z + nz * 24], [cp.x + nx * 70 + 10, cp.z + nz * 70], [cp.x + nx * 150, cp.z + nz * 150]];
  plan.river = { pts: rp, cross: sc };
  for (const [x, z] of rp) keep(x, z, 12);
  // tunnel through the Iron Hills
  plan.tunnel = { s0: 12.15 / 25 * TL, s1: 12.85 / 25 * TL };
  for (let s = plan.tunnel.s0 - 10; s < plan.tunnel.s1 + 10; s += 6) { const q = at(s, 0); keep(q.x, q.z, 24); }
  // caves: one at the foot of the mountain (opening to the east), one old mine at Old Mine station
  const cave1 = { x: 30, z: -40, r: 8, face: Math.PI / 2, mine: false };
  const mineSide = trySide(11, [32, 38, 45], 30);
  const cave2 = { ...mineSide, r: 7, mine: true };
  plan.caves = [cave1, cave2];
  for (const c of plan.caves) { plan.pads.push({ x: c.x, z: c.z, r: c.r * 1.5, y: 0 }); keep(c.x, c.z, c.r + 6); plan.extraCrates.push(...[[-.3, -.35], [.35, -.2], [0, -.55]].map(([a, b]) => { const cs = Math.cos(c.face), sn = Math.sin(c.face); const lx = a * c.r, lz = b * c.r; return { x: c.x + lx * cs + lz * sn, z: c.z - lx * sn + lz * cs }; })); }
  // pick a spot beside a station: side -1 = opposite the platform, then the platform side
  function trySide(i, dists, need) {
    for (const side of [-1, 1]) for (const D of dists) { const q = at(st(i), side * D); const [d] = trackDist(q.x, q.z); const p = P(st(i)); const face = Math.atan2(p.x - q.x, p.z - q.z);
      if (d >= need && !plan.lakes.some(l => Math.hypot(q.x - l.x, q.z - l.z) < l.r + 20)) return { x: q.x, z: q.z, face, side, D }; }
    const q = at(st(i), -dists[dists.length - 1]), p = P(st(i)); return { x: q.x, z: q.z, face: Math.atan2(p.x - q.x, p.z - q.z), side: -1, D: dists.at(-1) };
  }
  // landmarks at stations
  const LM = [[2, 'farm', [38, 46], 30], [4, 'windmill', [32, 40], 26], [6, 'sawmill', [28, 36], 22], [7, 'oak', [26, 34], 20], [8, 'graveyard', [30, 38], 24],
    [14, 'rockfall', [24, 30], 18], [15, 'pier', [40, 55], 30], [17, 'lighthouse', [48, 60], 36], [19, 'wreck', [50, 62], 38], [21, 'ash', [38, 48], 28], [23, 'bones', [32, 40], 26]];
  plan.landmarks = LM.map(([i, kind, ds, need]) => { let o = trySide(i, ds, need);
    if (kind === 'pier' || kind === 'lighthouse' || kind === 'wreck') { const p = P(st(i)), th = Math.atan2(p.z, p.x) + (kind === 'wreck' ? .16 : 0), Rc = coastR(th), u = [Math.cos(th), Math.sin(th)], rr = kind === 'pier' ? Rc - 42 : kind === 'wreck' ? Rc - 36 : Rc - 32;
      o = { x: u[0] * rr, z: u[1] * rr, face: kind === 'pier' ? Math.atan2(u[0], u[1]) : Math.atan2(-u[0], -u[1]) }; }
    keep(o.x, o.z, kind === 'farm' ? 26 : kind === 'graveyard' ? 18 : 16); return { i, kind, ...o }; });
  // villages
  plan.villages = [[1, 'farm', [70, 85, 100]], [9, 'forest', [62, 78, 92]], [18, 'fisher', [0]]].map(([i, kind, ds]) => {
    let o; if (kind === 'fisher') { const p = P(st(i)), th = Math.atan2(p.z, p.x), Rc = coastR(th), u = [Math.cos(th), Math.sin(th)], rr = Rc - 34; o = { x: u[0] * rr, z: u[1] * rr }; }
    else o = trySide(i, ds, 48);
    keep(o.x, o.z, 34); return { i, kind, x: o.x, z: o.z }; });
  // big gateway stations
  plan.bigStations = [5, 10, 15, 20];
  for (const i of plan.bigStations) for (const dz of [-20, 0, 20]) { const q = at(st(i), 0, dz); keep(q.x, q.z, 22); }
  // scattered sheds / cabins / water towers / haystacks
  plan.sheds = [];
  for (let k = 0; k < 400 && plan.sheds.length < 18; k++) { const a = R() * 6.283, rr = 60 + R() * 600, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (rr > coastR(a) - 40) continue;
    const [d] = trackDist(x, z); if (d < 26 || d > 140) continue; if (plan.keep.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 10)) continue;
    const kinds = ['shed', 'cabin', 'tower', 'hay', 'outhouse', 'ruin']; const kind = kinds[Math.floor(R() * kinds.length)]; plan.sheds.push({ x, z, kind, face: R() * 6.283 }); keep(x, z, 10); }
  plan.blocked = (x, z) => plan.keep.some(c => (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r);
  return plan;
}

// terrain height changes: mountains, flat pads, lakes, the river channel and the coastline
export function islandH(plan, x, z, h) {
  for (const m of plan.mounts) { const d = Math.hypot(x - m.x, z - m.z); if (d < m.r) h += m.h * (Math.cos(d / m.r * Math.PI) + 1) / 2 * (1 + Math.sin(x * .09 + z * .07) * .12); }
  for (const p of plan.pads) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r * 2) h = lerp(h, p.y, 1 - sstep(p.r, p.r * 2, d)); }
  for (const l of plan.lakes) { const d = Math.hypot(x - l.x, z - l.z); if (d < l.r * 1.5) h = lerp(h, -2.8, 1 - sstep(l.r * .7, l.r * 1.4, d)); }
  const rv = plan.river.pts; let dr = 1e9; for (let i = 0; i < rv.length - 1; i++) { const [ax, az] = rv[i], [bx, bz] = rv[i + 1], vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); dr = Math.min(dr, Math.hypot(x - ax - vx * t, z - az - vz * t)); }
  if (dr < 12) h = lerp(h, -2.2, 1 - sstep(4, 11, dr));
  const r = Math.hypot(x, z), Rc = plan.coastR(Math.atan2(z, x)); h = lerp(h, -7, sstep(Rc - 28, Rc + 30, r));
  return h;
}
export const WATER_Y = -0.75, SEA_Y = -1.0;

// ===================================================================== BUILD
export function buildIsland({ scene, plan, hgt, addColl, addBox, trackDist }) {
  const R = rng(777), root = new THREE.Group(); scene.add(root);
  const anim = [];   // things that move every frame
  const M = {}; const mat = (k, c, o = {}) => M[k] || (M[k] = new THREE.MeshStandardMaterial({ color: c, roughness: .9, ...o }));
  const tex = (w, h, f, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const plankTex = tex(128, 128, (x, w, h) => { for (let i = 0; i < 6; i++) { const v = (Math.random() * 20) | 0; x.fillStyle = `rgb(${120 + v},${120 + v},${120 + v})`; x.fillRect(0, i * h / 6, w, h / 6); x.fillStyle = '#0005'; x.fillRect(0, i * h / 6, w, 2); } });
  const stoneTex = tex(128, 128, (x, w, h) => { x.fillStyle = '#888'; x.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { const v = (Math.random() * 40) | 0; x.fillStyle = `rgb(${110 + v},${110 + v},${105 + v})`; x.fillRect(i * 32 + (j % 2) * 16 + 2, j * 16 + 2, 28, 12); } });
  const wood = c => M['w' + c] || (M['w' + c] = new THREE.MeshStandardMaterial({ map: plankTex, color: c, roughness: .95 }));
  const stone = c => M['s' + c] || (M['s' + c] = new THREE.MeshStandardMaterial({ map: stoneTex, color: c, roughness: .95 }));
  const glowWin = M.gw || (M.gw = new THREE.MeshStandardMaterial({ color: 0x2a1e10, emissive: 0xffa040, emissiveIntensity: .9 }));
  const darkWin = mat('dw', 0x0c0d10, { roughness: .3 }), dark = mat('dk', 0x1a1714), iron = mat('ir', 0x2a2c30, { metalness: .6, roughness: .5 });
  const rust = mat('ru', 0x6a3a22, { metalness: .4 }), bone = mat('bn', 0xd8d0b4), rock = mat('rk', 0x5a5852, { flatShading: true }), char = mat('ch', 0x1c1814);
  const bulb = M.bu || (M.bu = new THREE.MeshBasicMaterial({ color: 0xffd890 }));
  const box = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  const cyl = (r1, r2, h, m, x, y, z, p, seg = 12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
  const ball = (r, m, x, y, z, p, seg = 10) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg * .7 | 0)), m); o.position.set(x, y, z); p.add(o); return o; };
  const rockAt = (s, x, y, z, p) => { const o = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rock); o.scale.set(s * (.8 + R() * .5), s * (.6 + R() * .5), s * (.8 + R() * .5)); o.rotation.set(R() * 3, R() * 3, R() * 3); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
  // a group standing on the ground, facing `face` (local +z towards the face direction)
  const place = (x, z, face, yOff = 0, lowest = 0) => { const g = new THREE.Group(); let y = hgt(x, z); if (lowest) for (const [a, b] of [[-lowest, -lowest], [lowest, -lowest], [-lowest, lowest], [lowest, lowest]]) y = Math.min(y, hgt(x + a, z + b)); g.position.set(x, y + yOff, z); g.rotation.y = face; root.add(g); g.updateMatrixWorld(); return g; };
  const colB = (g, lx, lz, hx, hz) => addBox(g.position.x, g.position.z, g.rotation.y, lx, lz, hx, hz);
  const colC = (g, lx, lz, r) => { const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y); addColl(g.position.x + lx * c + lz * s, g.position.z - lx * s + lz * c, r); };
  const shape = (pts, m, p, holes = []) => { const s = new THREE.Shape(); pts.forEach(([a, b], i) => i ? s.lineTo(a, b) : s.moveTo(a, b)); for (const hpts of holes) { const h = new THREE.Path(); hpts.forEach(([a, b], i) => i ? h.lineTo(a, b) : h.moveTo(a, b)); s.holes.push(h); } const o = new THREE.Mesh(new THREE.ShapeGeometry(s), m); m.side = THREE.DoubleSide; p.add(o); return o; };

  // ---------- a small house (front = +z). opts: w,d,h,wall,roof,lit,boarded,burnt,stilts
  function house(g, { w = 6, d = 7, h = 3.2, wall = 0x6a5440, roof = 0x3a2a22, lit = R() < .5, boarded = false, burnt = false, chimney = true, stilts = 0 } = {}) {
    const base = stilts;
    if (stilts) { for (const a of [-1, 1]) for (const b of [-1, 0, 1]) cyl(.18, .2, stilts + 3, wood(0x5a4030), a * (w / 2 - .3), stilts / 2 - 1.5, b * (d / 2 - .3), g, 6); box(w + 1.6, .2, d + 1.6, wood(0x6a5040), 0, stilts, 0, g); }
    else box(w + .3, 2.4, d + .3, stone(0x8a8478), 0, -1.0, 0, g);
    const wm = burnt ? char : wood(wall);
    if (burnt) { box(w, h * .8, .25, wm, 0, base + h * .4, -d / 2, g); box(.25, h * .55, d, wm, -w / 2, base + h * .27, 0, g); box(.25, h * .9, d * .6, wm, w / 2, base + h * .45, -d * .2, g); box(w * .5, h * .4, .25, wm, -w * .25, base + h * .2, d / 2, g);
      for (let i = 0; i < 3; i++) { const bm = box(w * .9, .2, .2, char, 0, base + h * (.6 + i * .1), -d / 2 + i * 2, g); bm.rotation.z = (R() - .5) * .5; } return; }
    box(w, h, d, wm, 0, base + h / 2, 0, g);
    const rise = h * .55, hyp = Math.hypot(d / 2 + .4, rise);
    for (const k of [-1, 1]) { const r = box(w + .7, .16, hyp, mat('rf' + roof, roof), 0, base + h + rise / 2, k * (d / 4 + .2), g); r.rotation.x = k * Math.atan2(rise, d / 2 + .4); }
    for (const k of [-1, 1]) { const tri = shape([[-d / 2, 0], [d / 2, 0], [0, rise]], wm, g); tri.rotation.y = Math.PI / 2; tri.position.set(k * w / 2, base + h, 0); }
    box(1.0, 2.0, .1, dark, -w * .18, base + 1.0, d / 2 + .03, g);
    for (const [x, y, z, ry] of [[w * .22, base + h * .58, d / 2 + .04, 0], [-w / 2 - .04, base + h * .58, 0, Math.PI / 2], [w / 2 + .04, base + h * .58, -d * .15, Math.PI / 2]]) {
      const wi = box(1.0, .85, .06, boarded ? darkWin : (lit ? glowWin : darkWin), x, y, z, g); wi.rotation.y = ry; wi.castShadow = false;
      if (boarded) for (const s of [-1, 1]) { const b = box(1.3, .14, .06, wood(0x6a5038), x + (ry ? 0 : 0), y, z + (ry ? 0 : .04), g); b.rotation.y = ry; b.rotation.z = s * .55; } }
    if (chimney) box(.6, 1.6, .6, stone(0x7a6e66), w * .3, base + h + rise * .7, -d * .15, g);
  }

  // ---------- the cave builder (hemisphere with an opening towards local +z)
  function cave(c) {
    const g = place(c.x, c.z, c.face, -.2), r = c.r, open = c.mine ? .7 : 1.0;
    const geo = new THREE.SphereGeometry(r, 18, 9, Math.PI / 2 + open / 2, Math.PI * 2 - open, 0, Math.PI / 2), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); if (v.y > .3) v.multiplyScalar(1 + (R() - .5) * .18); pos.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals();
    const shell = new THREE.Mesh(geo, mat('cav', 0x4e4a44, { flatShading: true, side: THREE.DoubleSide })); shell.scale.y = .75; shell.castShadow = true; g.add(shell);
    const inner = new THREE.Mesh(geo, mat('cavi', 0x16120e, { side: THREE.BackSide })); inner.scale.set(.96, .72, .96); g.add(inner);
    for (let i = 0; i < 9; i++) { const a = Math.PI / 2 + open / 2 + i / 8 * (Math.PI * 2 - open); rockAt(2 + R() * 1.6, Math.cos(a) * r * 1.05, .6, Math.sin(a) * r * 1.05, g); }
    for (const k of [-1, 1]) rockAt(2.4, k * r * Math.sin(open / 2) * 1.1, 1.2, r * Math.cos(open / 2) * 1.0, g);
    if (c.mine) { for (const k of [-1, 1]) box(.35, 4.2, .35, wood(0x6a4a2a), k * 2.4, 2.1, r * .86, g); box(5.4, .4, .4, wood(0x6a4a2a), 0, 4.2, r * .86, g);
      for (let z = -r * .7; z < r + 8; z += .9) box(1.8, .12, .3, wood(0x4a3020), 0, .08, z, g); for (const k of [-.45, .45]) box(.08, .1, r * 1.7 + 8, iron, k, .2, r * .45 - .5, g);
      const cart = new THREE.Group(); cart.position.set(0, .2, r + 4); g.add(cart); box(1.4, .8, 1.8, rust, 0, .7, 0, cart); for (const a of [-1, 1]) for (const b of [-1, 1]) { const wl = cyl(.22, .22, .1, iron, a * .6, .25, b * .6, cart, 10); wl.rotation.z = Math.PI / 2; }
      const sign = box(2.4, .6, .08, wood(0x8a6a40), 0, 4.8, r * .86 + .25, g); }
    const lantern = ball(.14, bulb, -r * .35, 1.6, -r * .2, g); box(.08, .5, .08, dark, -r * .35, 1.2, -r * .2, g);
    for (let i = 0; i < 4; i++) { const b = box(.5 + R() * .3, .12, .12, bone, (R() - .5) * r, .1, -R() * r * .6, g); b.rotation.y = R() * 3; }
    for (let i = 0; i < 12; i++) { const a = Math.PI / 2 + open / 2 + i / 11 * (Math.PI * 2 - open); colC(g, Math.cos(a) * r, Math.sin(a) * r, 1.4); }
    // stalactites
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(.25, 1.2 + R(), 5), M.cav); s.rotation.x = Math.PI; s.position.set((R() - .5) * r, r * .72 - .7, (R() - .6) * r); g.add(s); }
  }
  plan.caves.forEach(cave);

  // ---------- lakes, river, sea
  const waterM = new THREE.MeshStandardMaterial({ color: 0x1c3038, roughness: .15, metalness: .4, transparent: true, opacity: .88 });
  for (const l of plan.lakes) { const w = new THREE.Mesh(new THREE.CircleGeometry(l.r * 1.25, 40), waterM); w.rotation.x = -Math.PI / 2; w.position.set(l.x, WATER_Y, l.z); scene.add(w);
    // reeds + a rowing boat + a jetty on the first lake
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, rr = l.r * (1.0 + R() * .15); const x = l.x + Math.cos(a) * rr, z = l.z + Math.sin(a) * rr; const g = new THREE.Group(); g.position.set(x, hgt(x, z), z); root.add(g); for (let k = 0; k < 4; k++) { const rd = cyl(.02, .03, 1.4 + R(), mat('reed', 0x5a6a34), (R() - .5) * .6, .7, (R() - .5) * .6, g, 4); rd.rotation.z = (R() - .5) * .3; } } }
  { const l = plan.lakes[0], g = place(l.x + l.r * .95, l.z, -Math.PI / 2, 0); for (let i = 0; i < 9; i++) box(1.6, .1, .9, wood(0x7a5a3a), 0, .45 - (g.position.y - WATER_Y - .45) + (g.position.y - WATER_Y - .45), i * .95 - 2, g);
    const boat = new THREE.Group(); boat.userData.keep = true; boat.position.set(l.x + l.r * .55, WATER_Y + .05, l.z + 6); boat.rotation.y = 1; root.add(boat); const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood(0x6a4a30)); hull.scale.set(.8, .45, 2); boat.add(hull);
    anim.push(t => { boat.position.y = WATER_Y + .05 + Math.sin(t * 1.3) * .05; boat.rotation.z = Math.sin(t * .9) * .05; }); }
  { const c = new THREE.CatmullRomCurve3(plan.river.pts.map(([x, z]) => new THREE.Vector3(x, 0, z))), n = 120, pos = [], idx = [];
    for (let i = 0; i <= n; i++) { const p = c.getPointAt(i / n), t = c.getTangentAt(i / n); for (const s of [-1, 1]) pos.push(p.x + t.z * 7.5 * s, WATER_Y - .05, p.z - t.x * 7.5 * s); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, waterM); m.material.side = THREE.DoubleSide; scene.add(m); }

  // ---------- railway bridge over the river
  { const s = plan.river.cross, g = new THREE.Group(), q = plan.at(s, 0); g.position.set(q.x, 0, q.z); g.rotation.y = q.yaw; root.add(g);
    const steel = mat('brs', 0x3a3e44, { metalness: .6, roughness: .45 });
    for (const k of [-1, 1]) { box(.2, .25, 26, steel, k * 3.1, 1.4, 0, g); box(.25, .3, 26, steel, k * 3.1, -.25, 0, g);
      for (let z = -13; z <= 13; z += 2.6) { box(.16, 1.7, .16, steel, k * 3.1, .58, z, g); const dg = box(.1, 2.3, .1, steel, k * 3.1, .58, z + 1.3, g); dg.rotation.x = (z / 2.6) % 2 ? .85 : -.85; } }
    for (const z of [-13, 13]) box(6.4, 3.2, 2.2, stone(0x7a756c), 0, -1.7, z + Math.sign(z) * .6, g);
    for (const z of [-4.5, 4.5]) box(2.4, 2.6, 1.6, stone(0x7a756c), 0, -2.2, z, g);
    box(6.2, .14, 26, wood(0x4a3424), 0, -.02, 0, g);
    addBox(q.x, q.z, q.yaw, 0, 0, 3.1, 13, .3); }

  // ---------- tunnel through the Iron Hills
  { const { s0, s1 } = plan.tunnel, steps = Math.ceil((s1 - s0) / 2), inRing = [], outRing = [], sec = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12; sec.push([-Math.cos(a) * 3.7, 3.1 + Math.sin(a) * 3.7]); }
    const inner = [[-3.7, -.3], ...sec, [3.7, -.3]];
    const tube = (sect, noise) => { const rings = []; for (let i = 0; i <= steps; i++) { const s = s0 + (s1 - s0) * i / steps, p = plan.P(s), t = plan.T(s), ring = [];
        const u = i / steps, H = 9 + 7 * Math.sin(u * Math.PI);
        for (const [lx, ly] of (typeof sect === 'function' ? sect(H) : sect)) { const n = noise && ly > 0 && Math.abs(lx) > .5 ? (R() - .5) * 2.2 : 0; ring.push(new THREE.Vector3(p.x + t.z * (lx + n * .4), ly + n, p.z - t.x * (lx + n * .4))); } rings.push(ring); }
      const pos = [], idx = [], m = rings[0].length; rings.forEach(r => r.forEach(v => pos.push(v.x, v.y, v.z)));
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + m; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return { g, rings }; };
    const t1 = tube(inner, false); const tin = new THREE.Mesh(t1.g, mat('tun', 0x3a3632, { side: THREE.DoubleSide, flatShading: true })); tin.receiveShadow = true; root.add(tin);
    const outSec = H => { const o = []; for (let k = 0; k <= 16; k++) { const a = Math.PI * k / 16; o.push([-Math.cos(a) * 19, -1.5 + Math.sin(a) * H]); } return o; };
    const t2 = tube(outSec, true); const tout = new THREE.Mesh(t2.g, mat('hill', 0x5a564e, { side: THREE.DoubleSide, flatShading: true })); tout.castShadow = tout.receiveShadow = true; root.add(tout);
    // portal walls with the arch hole + timber frame + lanterns
    for (const end of [0, steps]) { const s = s0 + (s1 - s0) * end / steps, q = plan.at(s, 0), g = new THREE.Group(); g.position.set(q.x, 0, q.z); g.rotation.y = q.yaw; root.add(g);
      const H = 9; const outer = []; for (let k = 0; k <= 16; k++) { const a = Math.PI * k / 16; outer.push([-Math.cos(a) * 19, -1.5 + Math.sin(a) * H]); }
      const face = shape(outer, mat('pf', 0x605a50, { flatShading: true }), g, [inner.slice().reverse()]); face.rotation.y = Math.PI;
      for (const k of [-1, 1]) box(.5, 6.6, .6, wood(0x5a3a22), k * 3.6, 3.0, 0, g); box(8, .6, .7, wood(0x5a3a22), 0, 6.6, 0, g);
      for (const k of [-1, 1]) rockAt(3, k * 9, 1, end ? -2 : 2, g);
      for (let lat = 5.5; lat < 18; lat += 2.2) for (const k of [-1, 1]) addColl(q.x + Math.cos(q.yaw) * k * lat, q.z - Math.sin(q.yaw) * k * lat, 1.2); }
    for (let i = 0; i <= steps; i += 2) { const s = s0 + (s1 - s0) * i / steps, q1 = plan.at(s, -4.6), q2 = plan.at(s, 4.6), o1 = plan.at(s, -19), o2 = plan.at(s, 19); addColl(q1.x, q1.z, 1.1); addColl(q2.x, q2.z, 1.1); addColl(o1.x, o1.z, 2.5); addColl(o2.x, o2.z, 2.5); }
    for (let i = 3; i < steps; i += 7) { const s = s0 + (s1 - s0) * i / steps, q = plan.at(s, -3.4); ball(.13, bulb, q.x, 3.2, q.z, root); }
    for (let i = 0; i < 10; i++) { const s = s0 + (s1 - s0) * R(), q = plan.at(s, (R() < .5 ? -1 : 1) * (8 + R() * 8)); rockAt(2 + R() * 3, q.x, 9 + R() * 5, q.z, root); } }

  // ---------- landmarks
  for (const L of plan.landmarks) {
    const g = place(L.x, L.z, L.face, 0, 4);
    if (L.kind === 'farm') { const b = new THREE.Group(); b.position.set(-6, 0, 0); g.add(b); house(b, { w: 9, d: 12, h: 5, wall: 0x7a2a20, roof: 0x3a3430, chimney: false, lit: false }); colB(g, -6, 0, 5, 6.5);
      cyl(2.4, 2.4, 11, mat('silo', 0x9a9a92, { metalness: .5 }), 3.5, 5.5, -3, g, 16); ball(2.45, mat('silo'), 3.5, 11, -3, g, 16); colC(g, 3.5, -3, 2.8);
      for (let i = 0; i < 18; i++) { const a = i / 18 * 6.28; box(.12, 1.1, .12, wood(0x6a5038), Math.cos(a) * 16, .55, Math.sin(a) * 16 + 4, g); }
      const sc = new THREE.Group(); sc.position.set(6, 0, 10); g.add(sc); box(.12, 2.4, .12, wood(0x6a5038), 0, 1.2, 0, sc); box(1.6, .1, .1, wood(0x6a5038), 0, 1.9, 0, sc); box(.7, .8, .3, mat('sack', 0x7a6a44), 0, 1.7, 0, sc); ball(.25, mat('sack'), 0, 2.35, 0, sc); cyl(.3, .45, .3, mat('hat', 0x5a4a24), 0, 2.55, 0, sc); }
    if (L.kind === 'windmill') { cyl(2.2, 3.2, 11, stone(0x9a9488), 0, 5.5, 0, g, 10); const cap = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2.6, 10), mat('rf3', 0x3a2a22)); cap.position.y = 12.3; g.add(cap); colC(g, 0, 0, 3.4);
      box(1, 2, .1, dark, 0, 1, 3.2, g); const sails = new THREE.Group(); sails.userData.keep = true; sails.position.set(0, 10.5, 2.9); g.add(sails); cyl(.3, .3, .8, wood(0x5a4030), 0, 0, 0, sails).rotation.x = Math.PI / 2;
      for (let k = 0; k < 4; k++) { const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; sails.add(arm); box(.25, 7, .15, wood(0x6a5038), 0, 3.6, 0, arm); box(1.5, 5.6, .05, mat('sail', 0xb8ae94, { side: THREE.DoubleSide }), .85, 4.0, 0, arm); }
      anim.push(t => { sails.rotation.z = t * .5; }); }
    if (L.kind === 'sawmill') { for (const a of [-1, 1]) for (const b of [-1, 0, 1]) box(.3, 4, .3, wood(0x5a4030), a * 4, 2, b * 4, g); box(9.4, .2, 9.4, mat('rf2', 0x2e2c2a), 0, 4.1, 0, g);
      const saw = cyl(1.2, 1.2, .06, iron, 0, 1.6, 0, g, 24); saw.rotation.x = Math.PI / 2; box(4, .9, 1, wood(0x6a5038), 0, .45, 0, g);
      for (let i = 0; i < 9; i++) { const lg = cyl(.35, .35, 5, mat('log', 0x6a4a2a), 7 + (i % 3) * .72, .35 + Math.floor(i / 3) * .62, -2 + (i % 3) * 0, g, 8); lg.rotation.x = Math.PI / 2; lg.position.x = 6.5 + (i % 3) * .72 + Math.floor(i / 3) * .36; }
      colB(g, 0, 0, 4.3, 4.3); colB(g, 7.4, -2, 1.4, 2.6); }
    if (L.kind === 'oak') { cyl(1.6, 2.6, 9, mat('oak', 0x3a2c22), 0, 4.5, 0, g, 9); const hole = new THREE.Mesh(new THREE.CircleGeometry(.9, 12), dark); hole.scale.y = 1.5; hole.position.set(0, 2.2, 2.25); hole.rotation.x = -.1; g.add(hole);
      for (let i = 0; i < 7; i++) { const br = cyl(.25, .6, 6 + R() * 4, mat('oak'), 0, 0, 0, g, 6); const a = i / 7 * 6.28; br.position.set(Math.cos(a) * 2, 8 + R() * 2, Math.sin(a) * 2); br.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); } colC(g, 0, 0, 2.8);
      for (let i = 0; i < 6; i++) { const rt = cyl(.2, .5, 3, mat('oak'), 0, 0, 0, g, 5); const a = i / 6 * 6.28 + .3; rt.position.set(Math.cos(a) * 2.6, .3, Math.sin(a) * 2.6); rt.rotation.set(Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3); } }
    if (L.kind === 'graveyard') { for (let i = 0; i < 14; i++) { const x = -7 + (i % 5) * 3.4 + (R() - .5), z = -5 + Math.floor(i / 5) * 4 + (R() - .5); const t = box(.8, 1.1 + R() * .5, .2, stone(0x8a8a84), x, .5, z, g); t.rotation.set((R() - .5) * .3, (R() - .5) * .3, (R() - .5) * .3); if (R() < .3) { box(.12, 1.4, .12, stone(0x8a8a84), x, .7, z, g); box(.7, .12, .12, stone(0x8a8a84), x, 1.0, z, g); } colC(g, x, z, .45); }
      for (let i = -11; i <= 11; i += 1.1) for (const z of [-8, 8]) box(.07, 1.3, .07, iron, i, .65, z, g); for (const z of [-8, 8]) box(22, .06, .06, iron, 0, 1.2, z, g);
      cyl(.4, .7, 7, mat('oak2', 0x2a221c), 9, 3.5, 2, g, 6); for (let i = 0; i < 4; i++) { const b = cyl(.08, .2, 3, mat('oak2'), 9, 6.5, 2, g, 5); b.rotation.set((R() - .5) * 1.8, R() * 3, (R() - .5) * 1.8); } }
    if (L.kind === 'rockfall') for (let i = 0; i < 12; i++) { const x = (R() - .5) * 14, z = (R() - .5) * 10, s = 1.2 + R() * 2.4; rockAt(s, x, s * .4, z, g); colC(g, x, z, s * .9); }
    if (L.kind === 'pier') { const dy = Math.max(.5, SEA_Y + 1.3 - g.position.y); for (let i = 0; i < 40; i++) box(2.6, .14, .9, wood(0x6a5038), 0, dy, i * .95, g); for (let i = 0; i < 40; i += 3) for (const k of [-1, 1]) cyl(.15, .15, 9, wood(0x4a3424), k * 1.2, dy - 4.5, i * .95, g, 6);
      const bt = new THREE.Group(); bt.userData.keep = true; bt.position.set(3, SEA_Y - g.position.y + .1, 34); g.add(bt); const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood(0x4a5a6a)); hull.scale.set(1.1, .6, 2.8); bt.add(hull); anim.push(t => { bt.rotation.z = Math.sin(t) * .06; });
      addBox(g.position.x + Math.sin(g.rotation.y) * 19, g.position.z + Math.cos(g.rotation.y) * 19, g.rotation.y, 0, 0, 1.3, 19, g.position.y + dy + .05); }
    if (L.kind === 'lighthouse') { const red = mat('lhr', 0xa82a20), wht = mat('lhw', 0xd8d4c8); box(8, 2, 8, stone(0x7a756c), 0, 0, 0, g);
      for (let i = 0; i < 6; i++) cyl(2.4 - i * .15, 2.4 - (i + 1) * .15, 3, i % 2 ? red : wht, 0, 1 + i * 3 + 1.5, 0, g, 14);
      cyl(2.0, 2.0, .3, iron, 0, 19.2, 0, g, 16); cyl(1.1, 1.1, 2, glowWin, 0, 20.4, 0, g, 12); const cap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.4, 12), red); cap.position.y = 22.1; g.add(cap);
      const beam = new THREE.Group(); beam.userData.keep = true; beam.position.y = 20.4; g.add(beam); const bm = new THREE.Mesh(new THREE.ConeGeometry(5, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: .07, depthWrite: false, side: THREE.DoubleSide })); bm.rotation.z = Math.PI / 2; bm.position.x = 30; beam.add(bm);
      anim.push(t => { beam.rotation.y = t * .6; }); colC(g, 0, 0, 3.0); const hg = new THREE.Group(); hg.position.set(-6, 0, 2); g.add(hg); house(hg, { w: 4, d: 5, h: 2.6, wall: 0xd8d4c8, lit: true }); colB(g, -6, 2, 2.3, 2.8); }
    if (L.kind === 'wreck') { const hull = new THREE.Group(); hull.rotation.set(0, .3, .35); hull.position.y = 2.3 + Math.max(0, SEA_Y + .5 - g.position.y); g.add(hull); const hm = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('hull', 0x3a2c22, { side: THREE.DoubleSide })); hm.scale.set(3.2, 2.6, 11); hull.add(hm);
      for (let i = -4; i <= 4; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(3.1, .15, 6, 12, Math.PI), mat('hull')); rib.scale.y = .7; rib.position.set(0, -.3, i * 2.2); hull.add(rib); }
      const mast = cyl(.25, .3, 9, mat('hull'), 0, 3, -2, hull, 6); mast.rotation.x = .5; colC(g, 0, 0, 4); colC(g, 0, 5, 3.5); colC(g, 0, -5, 3.5); }
    if (L.kind === 'ash') { for (const [x, z] of [[-7, 0], [3, -4], [6, 7]]) { const hg = new THREE.Group(); hg.position.set(x, 0, z); hg.rotation.y = R() * 3; g.add(hg); house(hg, { w: 5, d: 6, h: 3, burnt: true }); colC(g, x, z, 3.2); }
      for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2a2624, transparent: true, opacity: .35, depthWrite: false })); s.position.set(-7, 3, 0); g.add(s); anim.push(t => { const k = (t * .25 + i / 4) % 1; s.position.y = 3 + k * 8; s.scale.setScalar(1 + k * 2.5); s.material.opacity = .35 * (1 - k); }); } }
    if (L.kind === 'bones') { for (let i = 0; i < 7; i++) for (const k of [-1, 1]) { const rib = new THREE.Mesh(new THREE.TorusGeometry(4.5 - Math.abs(i - 3) * .4, .3, 6, 12, Math.PI * .55), bone); rib.rotation.set(0, 0, k > 0 ? 0 : Math.PI - Math.PI * .55); rib.position.set(0, 0, -9 + i * 2.8); g.add(rib); }
      const sp = cyl(.45, .45, 20, bone, 0, .4, 0, g, 8); sp.rotation.x = Math.PI / 2; const sk = ball(2.6, bone, 0, 1.6, 12.5, g, 12); sk.scale.set(1, .8, 1.3); for (const k of [-1, 1]) ball(.7, dark, k * 1.1, 2.2, 14.6, g, 8);
      for (let i = 0; i < 8; i++) colC(g, 0, -9 + i * 3, 1.6); colC(g, 0, 12.5, 3); }
  }

  // ---------- villages
  for (const V of plan.villages) {
    const n = V.kind === 'fisher' ? 4 : 5, cx = V.x, cz = V.z;
    if (V.kind !== 'fisher') { const sq = place(cx, cz, 0); box(1.4, .9, 1.4, stone(0x8a8478), 0, .45, 0, sq); box(1.7, .1, .2, wood(0x5a4030), 0, 2.1, 0, sq); for (const k of [-.7, .7]) box(.15, 1.3, .15, wood(0x5a4030), k, 1.4, 0, sq); colC(sq, 0, 0, 1.1);
      const lp = place(cx + 3, cz + 2, 0); box(.15, 3.6, .15, dark, 0, 1.8, 0, lp); ball(.18, bulb, .3, 3.4, 0, lp); colC(lp, 0, 0, .3); }
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R() * .4, rr = V.kind === 'fisher' ? 13 : 16 + R() * 5, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      const w = 5 + R() * 2.5, d = 6 + R() * 2, face = Math.atan2(cx - x, cz - z), g = place(x, z, face, 0, 4);
      const pal = V.kind === 'forest' ? [0x4a3a2c, 0x3e3428] : V.kind === 'fisher' ? [0x5a6a74, 0x7a6a58, 0x4a5a5a] : [0x7a5a40, 0x8a7a5a, 0x6a4a3a];
      house(g, { w, d, h: 3 + R() * .8, wall: pal[i % pal.length], roof: V.kind === 'fisher' ? 0x2a3a44 : 0x3a2a22, boarded: V.kind === 'forest' && R() < .7, lit: V.kind !== 'forest' && R() < .6, stilts: V.kind === 'fisher' ? Math.max(0, -g.position.y) + 1.2 : 0 });
      colB(g, 0, 0, w / 2 + .3, d / 2 + .3);
      if (V.kind === 'farm') for (let k = 0; k < 6; k++) box(.1, .9, .1, wood(0x6a5038), -w / 2 - 1 + k * (w + 2) / 5, .45, d / 2 + 3, g); }
    if (V.kind === 'fisher') { for (let i = 0; i < 3; i++) { const a = R() * 6.28, b = new THREE.Group(), rr = 30 + R() * 12; b.userData.keep = true; b.position.set(cx + Math.cos(Math.atan2(cz, cx)) * rr + (R() - .5) * 20, SEA_Y + .05, cz + Math.sin(Math.atan2(cz, cx)) * rr + (R() - .5) * 20); b.rotation.y = a; root.add(b);
      const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood([0x8a3a2a, 0x3a5a7a, 0xc8b890][i])); hull.scale.set(1, .5, 2.4); b.add(hull); anim.push(t => { b.position.y = SEA_Y + .05 + Math.sin(t * 1.1 + i) * .08; b.rotation.z = Math.sin(t * .8 + i) * .07; }); }
      for (let i = 0; i < 3; i++) { const g = place(cx + (R() - .5) * 10, cz + (R() - .5) * 10, R() * 6); for (let k = 0; k < 2; k++) box(.1, 1.8, .1, wood(0x5a4030), k * 2.4 - 1.2, .9, 0, g); box(2.6, .05, .05, wood(0x5a4030), 0, 1.6, 0, g); box(2.2, 1.2, .02, mat('net', 0x3a3a30, { transparent: true, opacity: .6 }), 0, 1.0, 0, g); } }
  }

  // ---------- big gateway stations: canopy, station house, water tower, siding with parked wagons
  const waterTower = (g, x, z) => { for (const a of [-1, 1]) for (const b of [-1, 1]) box(.25, 6, .25, wood(0x4a3424), x + a * 1.4, 3, z + b * 1.4, g); cyl(2.1, 2.1, 3, wood(0x6a5038), x, 7.5, z, g, 14); const c = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.2, 14), mat('rf4', 0x2e2c2a)); c.position.set(x, 9.6, z); g.add(c); colC(g, x, z, 2.2); };
  for (const i of plan.bigStations) { const s = plan.st(i), q = plan.at(s, 0), g = new THREE.Group(); g.position.set(q.x, 0, q.z); g.rotation.y = q.yaw; root.add(g); g.updateMatrixWorld();
    for (let z = -10; z <= 10; z += 5) { box(.22, 4.8, .22, iron, 5.7, 2.4, z, g); colC(g, 5.7, z, .25); } const cn = box(4.4, .16, 23, mat('cnp', 0x2a2c30, { metalness: .5 }), 4.3, 4.9, 0, g); cn.rotation.z = -.08;
    const hg = new THREE.Group(); hg.position.set(12.5, 0, 1); hg.rotation.y = -Math.PI / 2; g.add(hg); house(hg, { w: 11, d: 6.5, h: 5.2, wall: [0x6a4a3a, 0x5a5a5e, 0x4a5a6a, 0x5a3a32][i / 5 - 1], lit: true }); colB(g, 12.5, 1, 3.6, 5.8);
    waterTower(g, 10, -13);
    for (let z = -24; z <= 24; z += 1.1) box(3.2, .18, .45, mat('slp', 0x3a2a1c), -7.5, .09, z, g); for (const k of [-.75, .75]) box(.1, .14, 49, iron, -7.5 + k, .26, 0, g);
    for (const [z, kind] of [[-12, 'box'], [2, 'flat'], [14, 'box']]) { const wg = new THREE.Group(); wg.position.set(-7.5, .3, z); g.add(wg); box(3, .4, 5.6, dark, 0, .5, 0, wg);
      for (const a of [-1, 1]) for (const b of [-1, 1]) { const wl = cyl(.42, .42, .15, iron, a * 1, .42, b * 1.9, wg, 12); wl.rotation.z = Math.PI / 2; }
      if (kind === 'box') { box(3, 2.6, 5.6, rust, 0, 2.0, 0, wg); box(3.2, .15, 5.8, dark, 0, 3.35, 0, wg); } else for (let k = 0; k < 3; k++) box(.9, .7, .9, wood(0x6a4a2a), (k - 1) * .95, 1.05, (R() - .5) * 3, wg);
      colB(g, -7.5, z, 1.6, 2.9); }
    for (const z of [-20, 20]) { box(.15, 4, .15, dark, -10.5, 2, z, g); ball(.17, bulb, -10.2, 3.9, z, g); } }

  // ---------- scattered sheds, cabins, water towers, haystacks, outhouses, ruins
  for (const S of plan.sheds) { const g = place(S.x, S.z, S.face, 0, 3);
    if (S.kind === 'shed') { house(g, { w: 3.5, d: 4, h: 2.4, wall: 0x5a4a3a, chimney: false, lit: false, boarded: true }); colB(g, 0, 0, 2, 2.2); }
    if (S.kind === 'cabin') { house(g, { w: 5, d: 6, h: 2.8, wall: 0x4a3a2c, lit: R() < .4 }); colB(g, 0, 0, 2.8, 3.3); box(1.2, .6, 1.2, wood(0x6a4a2a), 3.4, .3, 1, g); }
    if (S.kind === 'tower') waterTower(g, 0, 0);
    if (S.kind === 'hay') { for (let k = 0; k < 5; k++) { const h = cyl(.9, .9, 1.5, mat('hay', 0xb89a4a), (k % 3) * 1.9 - 1.9, .9 + Math.floor(k / 3) * 1.7, 0, g, 12); h.rotation.x = Math.PI / 2; } colB(g, 0, 0, 3, 1); }
    if (S.kind === 'outhouse') { box(1.4, 2.3, 1.4, wood(0x5a4a3a), 0, 1.15, 0, g); box(1.6, .1, 1.7, mat('rf2', 0x2e2c2a), 0, 2.4, 0, g); box(.15, .4, .05, dark, 0, 1.8, .72, g); colC(g, 0, 0, 1); }
    if (S.kind === 'ruin') { for (let k = 0; k < 4; k++) { const w = box(3 + R() * 3, 1 + R() * 2.5, .5, stone(0x7a756c), (R() - .5) * 4, 1, (k - 1.5) * 2.5, g); w.rotation.y = (k % 2) * Math.PI / 2 + (R() - .5) * .2; colC(g, w.position.x, w.position.z, 1.4); } }
  }

  // ---------- telegraph poles along the track (instanced) + bushes everywhere (instanced)
  { const pg = new THREE.CylinderGeometry(.11, .14, 7, 6), cg = new THREE.BoxGeometry(1.6, .1, .1), poles = new THREE.InstancedMesh(pg, mat('pole', 0x3a2c20), 120), bars = new THREE.InstancedMesh(cg, mat('pole'), 120), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1); let n = 0;
    for (let s = 20; s < plan.TL && n < 120; s += 28) { const p = plan.at(s, -6.8); if (plan.blocked(p.x, p.z) || Math.abs(((s % (plan.TL / 25)) + plan.TL / 25) % (plan.TL / 25) - plan.TL / 50) > plan.TL / 50 - 18) continue; if (hgt(p.x, p.z) < -.4) continue;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw); poles.setMatrixAt(n, m4.compose(new THREE.Vector3(p.x, 3.5, p.z), q, one)); bars.setMatrixAt(n, m4.compose(new THREE.Vector3(p.x, 6.6, p.z), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)), one)); addColl(p.x, p.z, .25); n++; }
    poles.count = bars.count = n; poles.castShadow = true; root.add(poles, bars); }
  { const N = 2600, bg = new THREE.DodecahedronGeometry(1, 0), bushes = new THREE.InstancedMesh(bg, mat('bush', 0xffffff, { flatShading: true }), N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); let n = 0;
    const cols = [0x2e3a22, 0x24301e, 0x3a3a2a, 0x2a3428, 0x3a2a22];
    for (let k = 0; k < N * 3 && n < N; k++) { const x = (R() - .5) * 1600, z = (R() - .5) * 1600, r = Math.hypot(x, z); if (r > plan.coastR(Math.atan2(z, x)) - 20) continue; const y = hgt(x, z); if (y < -.3) continue; if (plan.blocked(x, z)) continue; if (trackDist(x, z)[0] < 6) continue;
      const s = .35 + R() * .8; q.setFromEuler(new THREE.Euler(0, R() * 6, 0)); bushes.setMatrixAt(n, m4.compose(new THREE.Vector3(x, y + s * .3, z), q, new THREE.Vector3(s * 1.3, s * .8, s * 1.3))); bushes.setColorAt(n++, c.set(cols[Math.floor(Math.min(4, Math.max(0, (Math.atan2(z, x) / 6.283 + 1) % 1 * 5)))])); }
    bushes.count = n; root.add(bushes); }

  // ---------- merge every static mesh per material (keeps draw calls low)
  root.updateMatrixWorld(true);
  const animated = new Set(); root.traverse(o => { if (o.isInstancedMesh) animated.add(o); });
  const isAnimated = o => { for (let p = o; p; p = p.parent) if (p.userData.anim) return true; return false; };
  // mark groups that move
  root.traverse(o => { if (o.isGroup && o.parent && o.parent !== root && (o.children.some(c => c.isGroup) === false)) {} });
  const byMat = new Map(), remove = [];
  root.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep) return; for (let p = o.parent; p && p !== root; p = p.parent) if (p.userData.keep) return;
    if (Array.isArray(o.material) || (o.material.transparent && o.material.opacity < .5)) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const key = o.material.uuid; if (!byMat.has(key)) byMat.set(key, { m: o.material, gs: [], shadow: o.castShadow }); byMat.get(key).gs.push(g); remove.push(o); });
  return { root, anim, byMat, remove, finish() {
    for (const o of remove) o.parent.remove(o);
    for (const { m, gs, shadow } of byMat.values()) { const merged = mergeGeometries(gs, false); if (!merged) continue; const mesh = new THREE.Mesh(merged, m); mesh.castShadow = shadow; mesh.receiveShadow = true; scene.add(mesh); }
  }, update(t) { for (const f of anim) f(t); } };
}
