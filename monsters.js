// Monsters for Rattlejaw Rails (original designs).
import * as THREE from 'three';
const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0,...o});
// RATTLEJAW: a huge armored burrowing worm with lantern eyes
export function makeRattlejaw(){ const g=new THREE.Group(); const plate=std(0x5b3a2a,{metalness:.55,roughness:.6}), rust=std(0x8a4a24,{metalness:.4,roughness:.8}), flesh=std(0x3a1c22,{roughness:.9}), bone=std(0xe8dcc0,{roughness:.6}), rivet=std(0x2a2a2a,{metalness:.8});
  const segs=[];
  for(let i=0;i<16;i++){ const r=2.4-i*.09; const s=new THREE.Group();
    const body=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),flesh); body.scale.z=.9; s.add(body);
    const pl=new THREE.Mesh(new THREE.SphereGeometry(r*1.06,18,10,0,Math.PI*2,0,Math.PI*.55),i%2?plate:rust); pl.scale.z=.95; s.add(pl);
    for(let k=0;k<8;k++){ const rv=new THREE.Mesh(new THREE.SphereGeometry(.12,6,5),rivet); const a=k/8*Math.PI*2; rv.position.set(Math.cos(a)*r*.98,Math.abs(Math.sin(a))*r*.4+r*.55,Math.sin(a)*r*.2); s.add(rv); }
    for(const k of [-1,1]){ const leg=new THREE.Mesh(new THREE.ConeGeometry(.22,1.9,6),bone); leg.position.set(r*.9*k,-r*.55,0); leg.rotation.z=k*2.4; s.add(leg); }
    const spike=new THREE.Mesh(new THREE.ConeGeometry(.3,1.2,6),bone); spike.position.y=r*1.05+.4; s.add(spike);
    g.add(s); segs.push({s,r}); }
  // head
  const head=new THREE.Group(); g.add(head);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(2.9,22,16),plate); skull.scale.set(1.05,.85,1.2); head.add(skull);
  const brow=new THREE.Mesh(new THREE.BoxGeometry(4.6,.6,1.2),rust); brow.position.set(0,1.25,2.2); brow.rotation.x=-.3; head.add(brow);
  const jawTop=new THREE.Group(), jawBot=new THREE.Group(); jawTop.position.set(0,.1,2.2); jawBot.position.set(0,-.4,2.2); head.add(jawTop,jawBot);
  const upper=new THREE.Mesh(new THREE.SphereGeometry(2.3,20,10,0,Math.PI*2,0,Math.PI/2),plate); upper.scale.set(1.15,.6,1.5); upper.rotation.x=Math.PI/2; upper.position.z=1.2; jawTop.add(upper);
  const lower=new THREE.Mesh(new THREE.SphereGeometry(2.2,20,10,0,Math.PI*2,Math.PI/2,Math.PI/2),rust); lower.scale.set(1.1,.7,1.45); lower.rotation.x=-Math.PI/2; lower.position.z=1.1; jawBot.add(lower);
  const mouth=new THREE.Mesh(new THREE.SphereGeometry(2,16,10),new THREE.MeshBasicMaterial({color:0x140406})); mouth.scale.set(1,.55,1.2); mouth.position.set(0,-.2,2.5); head.add(mouth);
  const glow=new THREE.PointLight(0xff3a1a,30,9,2); glow.position.set(0,-.1,3.5); head.add(glow);
  for(let i=0;i<13;i++){ const a=-1.25+i/12*2.5; for(const [jaw,y,dir] of [[jawTop,-.1,Math.PI],[jawBot,.25,0]]){ const t=new THREE.Mesh(new THREE.ConeGeometry(.17,.75+Math.abs(Math.sin(i*1.7))*.5,6),bone); t.position.set(Math.sin(a)*2.2,y,Math.cos(a)*2.2+1.1); t.rotation.x=dir; jaw.add(t); } }
  const eyes=[]; for(const k of [-1,1]) for(const [x,y,s] of [[1.3,1.1,.42],[1.95,.6,.28]]){ const e=new THREE.Mesh(new THREE.SphereGeometry(s,14,10),new THREE.MeshBasicMaterial({color:0xffd23a})); e.position.set(x*k,y,2.45); head.add(e); const cage=new THREE.Mesh(new THREE.TorusGeometry(s*1.15,.06,6,14),rivet); cage.position.copy(e.position); cage.position.z+=.08; head.add(cage); eyes.push(e); }
  const whistle=new THREE.Mesh(new THREE.CylinderGeometry(.25,.35,1.6,10),std(0xb08a3a,{metalness:.9,roughness:.3})); whistle.position.set(.8,2.6,-.4); whistle.rotation.z=-.3; head.add(whistle);
  g.userData={segs,head,jawTop,jawBot,eyes}; g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; }
// TRACK GNAWER: a small, fast, rat-like pack creature with glowing eyes
export function makeGnawer(){ const g=new THREE.Group(), fur=std(0x2a2620,{roughness:1}), bone=std(0xe0d6c0);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.38,14,10),fur); body.scale.set(.8,.7,1.4); body.position.y=.42; g.add(body);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.26,.6,10),fur); head.rotation.x=Math.PI/2; head.position.set(0,.5,.72); g.add(head);
  for(const k of [-1,1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:0xffe23a})); e.position.set(.12*k,.6,.62); g.add(e);
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.08,.2,6),fur); ear.position.set(.14*k,.78,.45); g.add(ear);
    for(const z of [.3,-.3]){ const leg=new THREE.Mesh(new THREE.CylinderGeometry(.05,.04,.35,6),fur); leg.position.set(.22*k,.17,z); g.add(leg); } }
  for(let i=0;i<4;i++){ const t=new THREE.Mesh(new THREE.ConeGeometry(.03,.1,4),bone); t.position.set(-.06+i*.04,.4,.98); t.rotation.x=Math.PI; g.add(t); }
  for(let i=0;i<6;i++){ const sp=new THREE.Mesh(new THREE.ConeGeometry(.05,.22,5),bone); sp.position.set(0,.72-i*.02,.2-i*.15); sp.rotation.x=-.4; g.add(sp); }
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.03,.01,.9,5),fur); tail.rotation.x=1.2; tail.position.set(0,.4,-.85); g.add(tail);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; }
