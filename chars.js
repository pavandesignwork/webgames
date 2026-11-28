// Crew characters: rigged low-poly humans (Quaternius Modular Men / Women, CC0) animated in code.
// No animation files are needed: arms, legs, hips and head are posed every frame (idle, walk, run, wave).
import * as THREE from 'three';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';
import { clone } from './vendor/jsm/utils/SkeletonUtils.js';

export const OUTFITS = [
  { f: 'm_Worker', name: 'Rail Worker' }, { f: 'w_Worker', name: 'Rail Worker' },
  { f: 'm_Farmer', name: 'Farmer' }, { f: 'w_Casual', name: 'Flannel' },
  { f: 'm_Adventurer', name: 'Explorer' }, { f: 'w_Adventurer', name: 'Explorer' },
  { f: 'm_Casual2', name: 'Mechanic' }, { f: 'w_Punk', name: 'Punk' }];

const loader = new GLTFLoader(), cache = {};
const load = f => cache[f] || (cache[f] = loader.loadAsync('assets/chars/' + f + '.glb'));
const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }, tq = new THREE.Quaternion();

// a character: call .update(dt, speed) every frame; speed in m/s (0 = idle)
export class Crew {
  constructor(outfit = 0) { this.root = new THREE.Group(); this.phase = Math.random() * 6; this.t = Math.random() * 10; this.bones = null; this.wave = 0; this.setOutfit(outfit); }
  async setOutfit(i) {
    this.outfit = i; const g = await load(OUTFITS[i % OUTFITS.length].f); if (this.outfit !== i) return;
    if (this.model) this.root.remove(this.model);
    const m = clone(g.scene); m.scale.setScalar(1.75 / 1.86);
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    this.bones = {}; m.traverse(o => { if (o.isBone) this.bones[o.name] = { b: o, q: o.quaternion.clone() }; });
    this.model = m; this.root.add(m); this.update(0, 0);
  }
  rot(name, ...ops) { const B = this.bones[name]; if (!B) return; B.b.quaternion.copy(B.q); for (const [a, ang] of ops) if (ang) B.b.quaternion.multiply(tq.setFromAxisAngle(AX[a], ang)); }
  update(dt, speed = 0, pitch = 0) {
    if (!this.bones) return; this.t += dt;
    const run = Math.min(1, Math.max(0, (speed - 2.6) / 1.4)), walk = Math.min(1, speed / 1.2);
    this.phase += dt * (speed > .05 ? 3.2 + speed * 1.25 : 0);
    const s = Math.sin(this.phase), c = Math.cos(this.phase), br = Math.sin(this.t * 1.7) * .03;
    const leg = walk * (.5 + run * .35), arm = walk * (.4 + run * .15), knee = walk * (.55 + run * .6);
    // legs: z swings forward/back (mirrored on the right side), x bends the knee
    this.rot('UpperLegL', ['z', s * leg - run * .1]); this.rot('UpperLegR', ['z', s * leg + run * .1]);
    this.rot('LowerLegL', ['x', Math.max(0, -c) * knee + .05]); this.rot('LowerLegR', ['x', Math.max(0, c) * knee + .05]);
    this.rot('FootL', ['x', 0]); this.rot('FootR', ['x', 0]);
    // arms hang down (x), swing opposite to the legs (z), elbows bend a little more when running
    const w = this.wave > 0 ? (this.wave -= dt, 1) : 0;
    this.rot('UpperArmL', ['x', -1.22 + br * .5], ['z', s * arm]);
    this.rot('UpperArmR', ['x', w ? .9 : -1.22 + br * .5], ['z', w ? 0 : s * arm]);
    this.rot('LowerArmL', ['z', -.12 - run * .7 - walk * .05]); this.rot('LowerArmR', ['z', w ? .6 + Math.sin(this.t * 14) * .5 : .12 + run * .7 + walk * .05]);
    // body: breathe, lean into a run, look up / down
    this.rot('Torso', ['x', run * .2 + br]); this.rot('Head', ['x', -pitch * .6]);
    this.rot('Hips', ['y', s * .06 * walk]);
    if (this.model) this.model.position.y = Math.abs(s) * .05 * walk - .02 * walk;
  }
}
// load every outfit early so switching is instant
export const preloadCrew = () => Promise.all(OUTFITS.map(o => load(o.f)));
