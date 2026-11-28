// THE YARD: a big wooden engine shed over the main line, a storage siding for spare / for-sale cars,
// a raised yard office with stairs, a parked boxcar and lamps.
// Local space: +z along the track, +x towards the station side, ground at y=0, main track along x=0.
import * as THREE from 'three';

export const YARD = { SLOTS: {} };   // filled in by buildYard (where each car parks)

export function buildYard(G, { mainAt }) {
  const boxes = [], circles = [];   // colliders in local space: boxes {x,z,hx,hz}, circles {x,z,r}
  const tex = (w, h, f, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const boards = (base) => (x, w, h) => { for (let i = 0; i < 8; i++) { const v = (Math.random() * 18 - 9) | 0; x.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v})`; x.fillRect(i * w / 8, 0, w / 8, h); x.fillStyle = '#0006'; x.fillRect(i * w / 8, 0, 2, h); }
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * .15})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 10 + Math.random() * 40); } };
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .9, ...o });
  const wallM = new THREE.MeshStandardMaterial({ map: tex(256, 256, boards([74, 52, 36]), 6, 1), roughness: .95 });
  const wallM2 = new THREE.MeshStandardMaterial({ map: tex(256, 256, boards([74, 52, 36]), 1, 1), roughness: .95 });
  const trimM = std(0x6a2a1c), postM = std(0x4a3424), darkM = std(0x1e1a16), roofM = new THREE.MeshStandardMaterial({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#2e2c2a'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 8) { x.fillStyle = '#3c3a36'; x.fillRect(i, 0, 4, h); } }, 20, 1), roughness: .7, metalness: .4, side: THREE.DoubleSide });
  const glassM = new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0x5a3a14, emissiveIntensity: .6, roughness: .2 });
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xffd890 });
  const box = (w, h, d, m, x, y, z, par = G) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  const sloped = (x0, y0, x1, y1, len, m, z = 0) => { const w = Math.hypot(x1 - x0, y1 - y0); const o = box(w, .16, len, m, (x0 + x1) / 2, (y0 + y1) / 2, z); o.rotation.z = Math.atan2(y1 - y0, x1 - x0); return o; };
  const shapeAt = (pts, m, z) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); const o = new THREE.Mesh(new THREE.ShapeGeometry(s), m); o.position.z = z; o.material.side = THREE.DoubleSide; G.add(o); return o; };
  const sign = (text, w, h, x, y, z, ry) => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#1d1a14'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116); g.fillStyle = '#e8dcc0'; g.font = 'bold 64px Georgia'; g.textAlign = 'center'; g.fillText(text, 256, 88);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); o.position.set(x, y, z); o.rotation.y = ry; G.add(o); return o; };

  // ================= ENGINE SHED (4 tracks: the main line + 3 storage tracks) =================
  // the main line bends a little through the shed: measure it so walls and doors stay well clear of the train
  const Z = 22, H = 7; let mMin = 1e9, mMax = -1e9;
  for (let d = -30; d <= 30; d += 1) { const q = mainAt(d); if (Math.abs(q.z) <= Z + 3) { mMin = Math.min(mMin, q.x); mMax = Math.max(mMax, q.x); } }
  const SX = [mMax + 7, mMax + 12, mMax + 17];
  const X0 = mMin - 5.4, X1 = SX[2] + 4, CX0 = X0 + 1.6, CX1 = X1 - 1.5, CH = H + 2.8, PK = CH + 2.2, DOOR_L = mMin - 3.8, DOOR_R = SX[2] + 2.6, DOOR_H = 6.4, MID = (CX0 + CX1) / 2;
  YARD.SLOTS = { workshop: { x: SX[0], z: 9.5 }, gun: { x: SX[0], z: -9.5 }, material: { x: SX[1], z: 3 }, cargo: { x: SX[2], z: -4 } }; YARD.X0 = X0; YARD.X1 = X1;
  box(X1 - X0, .06, 2 * Z, std(0x2a2826, { roughness: 1 }), (X0 + X1) / 2, .03, 0).castShadow = false;   // dirt floor
  for (const x of [X0, X1]) { box(.3, H, 2 * Z, wallM, x, H / 2, 0); box(.4, .3, 2 * Z + .2, trimM, x, H - .15, 0); boxes.push({ x, z: 0, hx: .25, hz: Z }); }
  for (const z of [-Z, Z]) {
    box(DOOR_L - X0, H, .3, wallM2, (X0 + DOOR_L) / 2, H / 2, z); box(X1 - DOOR_R, H, .3, wallM2, (DOOR_R + X1) / 2, H / 2, z);
    box(DOOR_R - DOOR_L, H - DOOR_H, .3, wallM2, (DOOR_L + DOOR_R) / 2, (H + DOOR_H) / 2, z);
    for (const x of [DOOR_L, DOOR_R]) box(.4, DOOR_H + .3, .5, trimM, x, (DOOR_H + .3) / 2, z);
    box(DOOR_R - DOOR_L + .4, .35, .5, trimM, (DOOR_L + DOOR_R) / 2, DOOR_H + .15, z);
    boxes.push({ x: (X0 + DOOR_L) / 2, z, hx: (DOOR_L - X0) / 2 + .1, hz: .25 }, { x: (DOOR_R + X1) / 2, z, hx: (X1 - DOOR_R) / 2 + .1, hz: .25 });
    shapeAt([[CX0, H], [CX1, H], [CX1, CH], [MID, PK], [CX0, CH]], wallM2.clone(), z);
    shapeAt([[X0, H], [CX0, H], [CX0, H + .9]], wallM2.clone(), z); shapeAt([[CX1, H], [X1, H], [CX1, H + .9]], wallM2.clone(), z);
    sign('THE YARD', 7, 1.75, MID, CH - .6, z + (z > 0 ? .2 : -.2), z > 0 ? 0 : Math.PI);
    const lb = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), bulbM); lb.position.set(DOOR_R + .6, DOOR_H - .4, z + (z > 0 ? .5 : -.5)); G.add(lb);
  }
  for (const x of [CX0, CX1]) { box(.25, .5, 2 * Z, wallM, x, H + .25, 0); box(.25, .5, 2 * Z, wallM, x, CH - .25, 0);
    const win = box(.08, CH - H - 1, 2 * Z - .4, glassM, x, (H + CH) / 2, 0); win.castShadow = false;
    for (let z = -Z; z <= Z; z += 2.2) box(.3, CH - H, .22, postM, x, (H + CH) / 2, z); }
  sloped(X0 - .5, H - .25, CX0, H + .9, 2 * Z + 1, roofM); sloped(CX1, H + .9, X1 + .5, H - .25, 2 * Z + 1, roofM);
  sloped(CX0 - .6, CH - .3, MID, PK, 2 * Z + 1.2, roofM); sloped(MID, PK, CX1 + .6, CH - .3, 2 * Z + 1.2, roofM);
  box(.3, .3, 2 * Z + 1.2, trimM, MID, PK + .1, 0);
  // posts between the tracks, tie beams, hanging lamps
  const POSTS = [CX0, mMax + 3.8, SX[0] + 2.5, SX[1] + 2.5, CX1];
  for (let z = -Z + 5.5; z < Z; z += 5.5) {
    for (const x of POSTS) { box(.3, H, .3, postM, x, H / 2, z); circles.push({ x, z, r: .3 }); }
    box(CX1 - CX0, .3, .3, postM, MID, H - .1, z);
    for (const x of POSTS.slice(1, 4)) for (const k of [-1, 1]) { const br = box(.18, 2.2, .18, postM, x + k * .9, H - .9, z); br.rotation.z = k * .7; }
  }
  for (const x of [mMax + 3.8, SX[1] + 2.5]) for (const z of [-16.5, -5.5, 5.5, 16.5]) {
    box(.03, 1.0, .03, darkM, x, H - .6, z); const sh = new THREE.Mesh(new THREE.ConeGeometry(.45, .35, 14, 1, true), std(0x2e3a2e, { side: THREE.DoubleSide, metalness: .5 })); sh.position.set(x, H - 1.2, z); G.add(sh);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), bulbM); b.position.set(x, H - 1.3, z); G.add(b);
  }
  for (const z of [-9, 9]) { const l = new THREE.PointLight(0xffc880, 34, 26, 1.4); l.position.set(SX[1] - 2.5, H - 1.4, z); G.add(l); }
  // work corner along the left wall: bench, tool rack, crates, oil drums
  const WX = X0 + 1.0;
  box(1.0, .08, 4, std(0x5a3d26), WX, 1.0, -6); for (const dz of [-1.8, 1.8]) for (const dx of [-.4, .4]) box(.1, 1.0, .1, postM, WX + dx, .5, -6 + dz);
  box(.1, 1.6, 4, std(0x4a3a2a), X0 + .25, 2.0, -6); for (let i = 0; i < 6; i++) box(.06, .5 + Math.random() * .4, .08, std(0x8a9098, { metalness: .8, roughness: .3 }), X0 + .35, 2.0, -7.6 + i * .6);
  boxes.push({ x: WX, z: -6, hx: .6, hz: 2.1 });
  for (const [z, s, y] of [[2, 1, 0], [3.3, .8, 0], [2.6, .7, 1]]) box(s, s, s, std(0x6a4a2a), WX, s / 2 + y, z);
  boxes.push({ x: WX, z: 2.6, hx: .6, hz: 1.2 });
  for (const z of [10, 11]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 1.0, 14), std(0x7a3a22, { metalness: .4 })); d.position.set(WX, .5, z); d.castShadow = true; G.add(d); circles.push({ x: WX, z, r: .4 }); }

  // ================= STORAGE TRACKS (inside, then curving out to join the main line at both ends) =================
  const sl = std(0x3a2a1c), railM = std(0x8a8f98, { metalness: .8, roughness: .35 });
  const trackAlong = (pts) => { const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))), L = c.getLength(), n = Math.floor(L / 1.1);
    for (let i = 0; i <= n; i++) { const p = c.getPointAt(i / n), t = c.getTangentAt(i / n), s = new THREE.Mesh(new THREE.BoxGeometry(3.2, .18, .45), sl); s.position.set(p.x, .08, p.z); s.rotation.y = Math.atan2(t.x, t.z); s.receiveShadow = true; G.add(s); }
    for (const off of [-.75, .75]) { const rp = []; for (let i = 0; i <= n; i++) { const p = c.getPointAt(i / n), t = c.getTangentAt(i / n); rp.push(new THREE.Vector3(p.x + t.z * off, .26, p.z - t.x * off)); }
      G.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), n * 2, .07, 5), railM)); } };
  SX.forEach((sx, k) => { for (const sgn of [-1, 1]) { const j1 = Z + 18 + k * 9, a = mainAt(sgn * j1), b = mainAt(sgn * (j1 + 8));
    trackAlong([[sx, 0], [sx, sgn * Z], [sx - .4, sgn * (Z + 6)], [(sx + a.x) / 2 + 1, sgn * (Z + 12 + k * 4)], [a.x + .4, a.z], [b.x, b.z]]); } });
  sign('STORAGE', 4, 1, SX[1], H - .5, Z - .4, Math.PI);

  // ================= YARD OFFICE (raised deck, stairs, lamps) =================
  const OX = X1 + 12, OZ = -10;
  for (const dx of [-4.5, 0, 4.5]) for (const dz of [-3, 3]) box(.3, 2.6, .3, postM, OX + dx, 1.3, OZ + dz);
  box(10, .25, 7, std(0x5a4030), OX, 2.7, OZ);
  box(7.5, 3.4, 5, wallM2, OX + .6, 4.5, OZ);
  sloped(OX + .6 - 4.3, 6.05, OX + .6, 7.65, 6.2, roofM, OZ); sloped(OX + .6, 7.65, OX + .6 + 4.3, 6.05, 6.2, roofM, OZ);
  for (const zz of [OZ - 2.55, OZ + 2.55]) shapeAt([[OX + .6 - 3.75, 6.2], [OX + .6 + 3.75, 6.2], [OX + .6, 7.6]], wallM2.clone(), zz);
  for (const [dx, dz] of [[-2, 2.52], [2, 2.52]]) { const w = box(1.0, .9, .06, glassM, OX + .6 + dx, 4.8, OZ + dz); w.castShadow = false; }
  box(1.1, 2.1, .08, std(0x3a2418), OX - 2.0, 3.85, OZ + 2.53);
  for (let i = 0; i < 6; i++) box(.08, 1.0, .08, postM, OX - 4.9 + i * 1.95, 3.3, OZ + 3.4); box(9.8, .08, .08, postM, OX, 3.8, OZ + 3.4);   // deck railing
  // stairs down towards the shed
  for (let i = 0; i < 9; i++) box(1.3, .12, .4, std(0x5a4030), OX - 5.6 - i * .32, 2.55 - i * .3, OZ + 2.4);
  for (const k of [-.65, .65]) sloped(OX - 5.3, 2.7, OX - 8.6, -.05, .1, postM, OZ + 2.4 + k);
  boxes.push({ x: OX, z: OZ, hx: 5.1, hz: 3.6 });
  for (const [x, y, z] of [[OX + 4.6, 4.2, OZ + 3.4], [OX - 4.6, 4.2, OZ + 3.4]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(.15, 10, 8), bulbM); b.position.set(x, y, z); G.add(b); }
  const ol = new THREE.PointLight(0xffc880, 18, 16, 1.5); ol.position.set(OX - 3, 4.4, OZ + 4.2); G.add(ol);
  // ================= PARKED BOXCAR on a stub track =================
  const BX = X1 + 7, BZ = 12;
  trackAlong([[BX, BZ - 8], [BX, BZ + 8]]);
  const yel = std(0xd8a21a, { roughness: .6, metalness: .2 });
  box(3.0, 3.0, 9, yel, BX, 2.6, BZ); box(3.2, .2, 9.3, darkM, BX, 4.2, BZ); box(3.1, .4, 9, darkM, BX, .9, BZ);
  for (const k of [-1, 1]) { box(.06, 2.6, 2.2, std(0x9a7414), BX + 1.53 * k, 2.6, BZ); for (const s of [-1, 1]) { const xb = box(.05, .1, 3.1, darkM, BX + 1.55 * k, 2.6, BZ); xb.rotation.x = s * .9; }
    for (const z of [BZ - 3, BZ + 3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .2, 14), darkM); w.rotation.z = Math.PI / 2; w.position.set(BX + 1.0 * k, .5, z); G.add(w); } }
  boxes.push({ x: BX, z: BZ, hx: 1.7, hz: 4.7 });
  // ================= lamp posts around the yard =================
  for (const [x, z] of [[X0 - 3, 26], [X0 - 3, -26], [X1 + 2.5, -26], [X1 + 2.5, 26], [X1 + 2, -3]]) {
    box(.18, 4.2, .18, darkM, x, 2.1, z); box(.7, .08, .08, darkM, x + .3, 4.1, z);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), bulbM); b.position.set(x + .6, 3.9, z); G.add(b); circles.push({ x, z, r: .25 });
  }
  return { boxes, circles };
}

// a sign texture for a car on the siding ("FOR SALE · 40" / "STORED · LV 2")
export function slotSign() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.0), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  m.userData.draw = (title, sub, col) => { const g = c.getContext('2d'); g.clearRect(0, 0, 512, 160); g.fillStyle = '#14110ce8'; g.fillRect(0, 0, 512, 160); g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(6, 6, 500, 148);
    g.fillStyle = col; g.font = 'bold 58px Georgia'; g.textAlign = 'center'; g.fillText(title, 256, 70); g.fillStyle = '#e8dcc0'; g.font = '40px Georgia'; g.fillText(sub, 256, 126); t.needsUpdate = true; };
  return m;
}
