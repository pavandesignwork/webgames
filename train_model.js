// The walk-in train "No 7": locomotive + cab, workshop wagon, caged gun deck.
// Train-local space: forward = +z, floor of the walk-in cars at y = DECK.
import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/jsm/geometries/RoundedBoxGeometry.js';
export const DECK=1.2;
// Car slots behind the loco, front to back. Cars you don't own are left out and the ones behind slide forward.
export const GUN_SHIFT=-12;
export const GUN_Z=-5.1+GUN_SHIFT;
export const CARS=['workshop','material','cargo','gun'];
const SLOT={workshop:6.1,material:6.0,cargo:6.0}, ENDS={workshop:-2.4,material:-8.3,cargo:-14.3,gun:-20.2};
// walkable floor rectangles [x0,x1,z0,z1] (each car owns the gangway in front of it), side doors, in train-local space before shifting
export const WALKS={cab:[[-1.35,1.35,4.15,6.9]],workshop:[[-.5,.5,3.4,4.3],[-1.35,1.35,-2.05,3.5]],material:[[-.5,.5,-2.95,-1.7],[-1.45,1.45,-8.1,-2.5]],
  cargo:[[-.5,.5,-8.7,-7.6],[-1.45,1.45,-14.1,-8.5]],gun:[[-.5,.5,-14.7,-13.6],[-1.45,1.45,-19.85,-14.85]]};
export const BLOCKS={cab:[],workshop:[[-1.5,-.55,-.35,1.95],[-1.5,-1.05,-2.1,-.45],[.85,1.45,2.0,2.6]],material:[[-1.45,-.3,-7.7,-2.9],[.95,1.45,-7.2,-5.5],[.65,1.15,-8.15,-7.65]],
  cargo:[[.5,1.5,-13.3,-12.3],[-1.5,-.5,-13.3,-12.3],[.5,1.5,-10.7,-9.7],[-1.5,-.5,-10.7,-9.7]],gun:[[-.75,.75,-18.95,-17.45],[.85,1.35,-17.0,-16.1],[-1.35,.1,-19.9,-19.4]]};
export const DOORZ={cab:4.6,workshop:1.0,material:-5.3,cargo:-11.3,gun:-17.5};
// u = upgrade levels; returns z offset of every owned car (null = not owned) and the rear end of the train
export function layout(u){ const o={}; let off=0, rear=3.9; for(const c of CARS){ if((u[c]||0)>0){ o[c]=off; rear=ENDS[c]+off; } else { o[c]=null; if(SLOT[c]) off+=SLOT[c]; } } o.rear=rear; return o; }
export function buildTrain(){
const T=new THREE.Group(); let cur=T;
const G={}; for(const c of ['cab',...CARS]){ G[c]=new THREE.Group(); G[c].name=c; cur.add(G[c]); }
const parts=[]; const part=(car,name,test,f)=>{ const g=new THREE.Group(); (typeof car==='string'?G[car]:car).add(g); const prev=cur; cur=g; f(g); cur=prev; parts.push({g,name,test}); return g; };
const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,metalness:0,...o});
const canvasTex=(w,h,f)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; f(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; };
// ---- textures: riveted yellow armour panel (tinted by paint), tread-plate floor, planks ----
const panelTex=canvasTex(256,256,(x,w,h)=>{ x.fillStyle='#ececec'; x.fillRect(0,0,w,h);
  for(let i=0;i<260;i++){ const g=120+Math.random()*90|0; x.fillStyle=`rgba(${g*.6|0},${g*.5|0},${g*.35|0},${Math.random()*.2})`; x.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*18,2+Math.random()*28); }
  x.fillStyle='rgba(30,24,18,.28)'; for(let i=0;i<30;i++) x.fillRect(Math.random()*w,h-6-Math.random()*40,2+Math.random()*3,46);
  x.strokeStyle='#222'; x.lineWidth=7; x.strokeRect(3,3,w-6,h-6); x.lineWidth=4; x.beginPath(); x.moveTo(0,h/2); x.lineTo(w,h/2); x.stroke();
  x.fillStyle='#333'; for(let i=0;i<8;i++) for(const [px,py] of [[16+i*31,14],[16+i*31,h-14],[16+i*31,h/2-11],[16+i*31,h/2+11],[14,16+i*31],[w-14,16+i*31]]){ x.beginPath(); x.arc(px,py,3.4,0,7); x.fill(); } });
const panel=new THREE.MeshStandardMaterial({map:panelTex,color:0xf2c21a,roughness:.55,metalness:.3}); T.userData.paintMat=panel;
const hazTex=canvasTex(256,64,(x,w,h)=>{ x.fillStyle='#f2c21a'; x.fillRect(0,0,w,h); x.fillStyle='#16161a'; for(let i=-64;i<w+64;i+=48){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+24,0); x.lineTo(i-8,h); x.lineTo(i-32,h); x.fill(); } });
const treadTex=canvasTex(128,128,(x,w,h)=>{ x.fillStyle='#4a4e55'; x.fillRect(0,0,w,h); x.strokeStyle='#6a707a'; x.lineWidth=5; for(let i=0;i<4;i++) for(let j=0;j<4;j++){ x.beginPath(); const cx=i*32+16, cy=j*32+16; if((i+j)%2){ x.moveTo(cx-9,cy-5); x.lineTo(cx+9,cy+5); } else { x.moveTo(cx-5,cy+9); x.lineTo(cx+5,cy-9); } x.stroke(); } }); treadTex.repeat.set(3,6);
const tread=new THREE.MeshStandardMaterial({map:treadTex,roughness:.45,metalness:.7});
const plankTex=canvasTex(256,64,(x,w,h)=>{ for(let i=0;i<4;i++){ x.fillStyle=['#5a3d26','#4d331f','#62442a','#553923'][i]; x.fillRect(0,i*16,w,16); x.fillStyle='#2a1a10'; x.fillRect(0,i*16,w,1.5); } });
const plank=new THREE.MeshStandardMaterial({map:plankTex,roughness:.9});
const brass=std(0xc9a24a,{metalness:.9,roughness:.3}), blk=std(0x1b1c20,{metalness:.5,roughness:.5}), rust=std(0x7a3e22,{metalness:.4,roughness:.85}), steel=std(0x6a7078,{metalness:.85,roughness:.35});
const inner=new THREE.MeshStandardMaterial({map:panelTex,color:0x8f8a78,roughness:.8,metalness:.15});
const hazM=new THREE.MeshStandardMaterial({map:hazTex,roughness:.6,metalness:.3});
// ---- helpers ----
const box=(w,h,d,m,x,y,z,par)=>{ const r=Math.min(.06,Math.min(w,h,d)*.3); const o=new THREE.Mesh(r>.012?new RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=o.receiveShadow=true; (par||cur).add(o); return o; };

// a walk-in car shell: floor + walls with window openings + curved roof
function carShell(z0,len,{door=true,winFront=false,winBack=false,lo=1.05,tb=.5}={}){ const g=new THREE.Group(); cur.add(g); const hw=1.55, wh=2.6, wH=wh-lo-tb, wy=DECK+lo+wH/2;
  box(3.3,.3,len,tread,0,DECK-.15,z0+len/2,g);
  for(const k of [-1,1]){ box(.1,lo,len,panel,hw*k,DECK+lo/2,z0+len/2,g); box(.1,tb,len,panel,hw*k,DECK+wh-tb/2,z0+len/2,g);
    const nWin=Math.max(1,Math.floor(len/2.2)); for(let i=0;i<=nWin;i++){ const pz=z0+i*len/nWin; box(.1,wH,.3,panel,hw*k,wy,Math.min(z0+len-.15,Math.max(z0+.15,pz)),g); } }
  for(const k of [-1,1]){ box(.03,lo,len-.1,inner,(hw-.07)*k,DECK+lo/2,z0+len/2,g); box(.03,tb,len-.1,inner,(hw-.07)*k,DECK+wh-tb/2,z0+len/2,g); }
  if(winFront){ box(3.0,lo,.03,inner,0,DECK+lo/2,z0+len-.07,g); box(3.0,tb,.03,inner,0,DECK+wh-tb/2,z0+len-.07,g); }
  for(const [zz,win] of [[z0,winBack],[z0+len,winFront]]){ if(win){ box(3.2,lo,.1,panel,0,DECK+lo/2,zz,g); box(3.2,tb,.1,panel,0,DECK+wh-tb/2,zz,g); box(.2,wH,.1,panel,-1.5,wy,zz,g); box(.2,wH,.1,panel,1.5,wy,zz,g); }
    else if(door){ box(1.05,wh,.1,panel,-1.08,DECK+wh/2,zz,g); box(1.05,wh,.1,panel,1.08,DECK+wh/2,zz,g); box(1.1,.55,.1,panel,0,DECK+wh-.27,zz,g); const fr=new THREE.Mesh(new THREE.TorusGeometry(.56,.05,6,16,Math.PI),steel); fr.position.set(0,DECK+2.05,zz); g.add(fr); } }
  // close the arch above each end wall
  { const sh=new THREE.Shape(); for(let i=0;i<=16;i++){ const t=-.78+i/16*1.56; const x=2.2*Math.sin(t), y=-1.55+2.2*Math.cos(t); i?sh.lineTo(x,y):sh.moveTo(x,y); } const cg=new THREE.ShapeGeometry(sh);
    for(const zz of [z0,z0+len]){ const cap=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({map:panelTex,color:0x8f8a78,roughness:.8,metalness:.15,side:THREE.DoubleSide})); cap.position.set(0,DECK+2.6,zz); g.add(cap); } }
  const rg=new THREE.CylinderGeometry(2.2,2.2,len+.3,24,1,true,Math.PI-.78,1.56); rg.rotateX(Math.PI/2);
  const roof=new THREE.Mesh(rg,std(0x1c1d22,{metalness:.5,roughness:.6,side:THREE.DoubleSide})); roof.position.set(0,DECK+wh-1.55,z0+len/2); roof.castShadow=true; g.add(roof);
  for(let i=0;i<=len;i+=1.45){ const rgb=new THREE.CylinderGeometry(2.12,2.12,.12,20,1,true,Math.PI-.78,1.56); rgb.rotateX(Math.PI/2); const rib=new THREE.Mesh(rgb,std(0x2a2b30,{metalness:.5,side:THREE.DoubleSide})); rib.position.set(0,DECK+wh-1.55,z0+i); g.add(rib); }
  box(3.4,.5,len,hazM,0,DECK-.55,z0+len/2,g);
  for(const zz of [z0+.9,z0+len-.9]) for(const k of [-1,1]){ const wh2=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.18,16),blk); wh2.rotation.z=Math.PI/2; wh2.position.set(1.02*k,.55,zz); g.add(wh2); }
  return g; }
// ================= CAR 1: LOCOMOTIVE (boiler in front, walk-in CAB behind) =================
cur=G.cab;
{ const z0=4; // walk-in cab (boiler in front, built in the levelled-parts section)
  // walk-in cab
  carShell(z0,4,{winFront:true,door:true,lo:.8,tb:.3});   // tall windows so the driver can see
  // simple driver console: a low desk, three big levers, a row of lights, three gauges
  const deskM=std(0x3a3f46,{metalness:.5,roughness:.6}), topM=std(0x8c9096,{metalness:.55,roughness:.5});
  box(2.7,.82,.62,deskM,0,DECK+.41,z0+3.6);
  const top=new THREE.Mesh(new THREE.BoxGeometry(2.7,.06,.78),topM); top.position.set(0,DECK+.86,z0+3.52); top.rotation.x=-.22; cur.add(top);
  for(const x of [-.7,.7]) box(1.25,.5,.04,std(0x2e3238,{metalness:.4}),x,DECK+.38,z0+3.27);           // cupboard doors under the desk
  // levers pivot at their base so the game can move them (throttle · horn · brake)
  const lever=(x,col)=>{ box(.24,.16,.28,blk,x,DECK+.97,z0+3.5); const pv=new THREE.Group(); pv.position.set(x,DECK+1.0,z0+3.5); pv.rotation.x=-.3; cur.add(pv);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.55,8),std(0xd8d8d0,{metalness:.3})); arm.position.y=.27; pv.add(arm);
    const knob=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.16,10),std(col,{roughness:.45})); knob.position.y=.54; pv.add(knob); return pv; };
  T.userData.levers=[lever(.45,0x3ad06a),lever(.85,0xd8b020),lever(1.2,0xd03a2a)];
  const lights=[0x3cff6a,0x3cff6a,0x3cff6a,0xff8a20,0xff3030,0x3cff6a];
  lights.forEach((c,i)=>{ const l=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:c})); l.position.set(-1.15+i*.13,DECK+.93,z0+3.3); cur.add(l); });
  const gaugeTex=canvasTex(128,128,(x,w,h)=>{ x.fillStyle='#e8e0c8'; x.beginPath(); x.arc(64,64,60,0,7); x.fill(); x.strokeStyle='#222'; x.lineWidth=3; for(let i=0;i<10;i++){ const a=Math.PI*.8+i/9*Math.PI*1.4; x.beginPath(); x.moveTo(64+Math.cos(a)*46,64+Math.sin(a)*46); x.lineTo(64+Math.cos(a)*56,64+Math.sin(a)*56); x.stroke(); } x.strokeStyle='#b01010'; x.lineWidth=4; x.beginPath(); x.moveTo(64,64); x.lineTo(64+Math.cos(-.4)*44,64+Math.sin(-.4)*44); x.stroke(); });
  const speedTex=canvasTex(128,128,(x,w,h)=>{ x.fillStyle='#e8e0c8'; x.beginPath(); x.arc(64,64,60,0,7); x.fill(); x.strokeStyle='#222'; x.lineWidth=3; for(let i=0;i<10;i++){ const a=Math.PI*.8+i/9*Math.PI*1.4; x.beginPath(); x.moveTo(64+Math.cos(a)*46,64+Math.sin(a)*46); x.lineTo(64+Math.cos(a)*56,64+Math.sin(a)*56); x.stroke(); } x.fillStyle='#b01010'; x.font='bold 16px Georgia'; x.textAlign='center'; x.fillText('SPEED',64,96); });
  for(let i=0;i<3;i++){ const g=new THREE.Mesh(new THREE.CircleGeometry(.1,20),new THREE.MeshBasicMaterial({map:i?gaugeTex:speedTex})); g.position.set(-1.05+i*.28,DECK+.94,z0+3.62); g.rotation.x=-Math.PI/2+.22; cur.add(g);
    if(!i){ const pv=new THREE.Group(); pv.position.copy(g.position); pv.rotation.copy(g.rotation); cur.add(pv); const nd=new THREE.Group(); nd.position.z=.006; pv.add(nd); const ndl=new THREE.Mesh(new THREE.BoxGeometry(.012,.085,.004),new THREE.MeshBasicMaterial({color:0xb01010})); ndl.position.y=.036; nd.add(ndl); T.userData.needle=nd; }
    const r=new THREE.Mesh(new THREE.TorusGeometry(.1,.015,6,20),blk); r.position.copy(g.position); r.rotation.copy(g.rotation); cur.add(r); }
  // one work lamp in the back corner (out of the driver's view)
  const cablamp=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.12),new THREE.MeshBasicMaterial({color:0xfff2c8})); cablamp.position.set(-1.3,DECK+2.2,z0+.4); cur.add(cablamp);
  const cl=new THREE.PointLight(0xffe8b8,5,7,2); cl.position.set(-1.0,DECK+2.0,z0+.8); cl.castShadow=true; cur.add(cl);
}
// ================= CAR 2: WORKSHOP WAGON =================
cur=G.workshop;
{ const z0=-2.2, len=5.8; carShell(z0,len,{door:true});
  // workbench with blueprint
  const bench=box(.9,.08,2.2,plank,-1.05,DECK+.95,z0+3);
  for(const dz of [-.95,.95]) for(const dx of [-.35,.35]) box(.08,.95,.08,std(0x3a2816),-1.05+dx,DECK+.47,z0+3+dz);
  const bpTex=canvasTex(256,160,(x,w,h)=>{ x.fillStyle='#1c4fa8'; x.fillRect(0,0,w,h); x.strokeStyle='#cfe2ff'; x.lineWidth=2; x.strokeRect(10,10,w-20,h-20); x.beginPath(); x.arc(80,95,22,0,7); x.arc(170,95,22,0,7); x.stroke(); x.strokeRect(50,40,150,40); x.strokeRect(150,22,24,18); x.font='12px monospace'; x.fillStyle='#cfe2ff'; x.fillText('GUN MK-II',20,145); x.fillText('No 7',200,30); });
  const bp=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.3),new THREE.MeshStandardMaterial({map:bpTex,roughness:.9})); bp.rotation.x=-Math.PI/2; bp.rotation.z=Math.PI/2; bp.position.set(-1.05,DECK+1.0,z0+3); cur.add(bp);
  // tool wall on the right
  const board=box(.06,1.3,2.6,std(0x5a4a34),1.48,DECK+1.6,z0+3);
  const toolY=std(0xd6a21e,{roughness:.5,metalness:.2}), toolB=std(0x2a2a2e,{metalness:.6});
  const wrench=new THREE.Group(); box(.04,.7,.08,steel,0,0,0,wrench); const jaw=new THREE.Mesh(new THREE.TorusGeometry(.09,.03,6,10,4.5),steel); jaw.position.y=.38; wrench.add(jaw); wrench.position.set(1.42,DECK+1.6,z0+2.0); cur.add(wrench);
  const drill=new THREE.Group(); box(.12,.3,.12,toolY,0,0,0,drill); box(.12,.12,.32,toolB,0,.2,.1,drill); drill.position.set(1.4,DECK+1.55,z0+2.6); cur.add(drill);
  const hammer=new THREE.Group(); box(.04,.6,.04,std(0x6a4a2a),0,0,0,hammer); box(.08,.1,.22,steel,0,.32,0,hammer); hammer.position.set(1.42,DECK+1.6,z0+3.2); cur.add(hammer);
  for(const dz of [3.8,4.1]){ const pipe=new THREE.Group(); box(.06,1.1,.06,steel,0,0,0,pipe); box(.14,.2,.18,toolY,0,.55,0,pipe); pipe.position.set(1.42,DECK+1.5,z0+dz); cur.add(pipe); }
  // shelf with paint cans + scrap pile
  box(.4,.06,1.6,plank,-1.3,DECK+.5,z0+.9);
  [0xb02a2a,0x2a8a3a,0x7a3ac0,0xd6a21e].forEach((c,i)=>{ const can=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.26,12),std(0xb8bcc2,{metalness:.7,roughness:.4})); can.position.set(-1.3,DECK+.66,z0+.35+i*.38); cur.add(can); const drip=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.06,12),std(c,{roughness:.3})); drip.position.set(-1.3,DECK+.77,z0+.35+i*.38); cur.add(drip); });
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xffe0a0})); bulb.position.set(0,DECK+2.3,z0+3); cur.add(bulb); const wl=new THREE.PointLight(0xffd9a0,9,6,2); wl.position.set(0,DECK+2.2,z0+3); wl.castShadow=true; cur.add(wl);
  const cord=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.4,4),blk); cord.position.set(0,DECK+2.55,z0+3); cur.add(cord);
}
cur=G.gun;
// ================= CAR 3: CAGED GUN DECK (open-top flatcar with mesh cage) =================
{ const z0=-8+GUN_SHIFT, len=5.2; box(3.3,.3,len,tread,0,DECK-.15,z0+len/2); box(3.4,.5,len,hazM,0,DECK-.55,z0+len/2);
  for(const zz of [z0+.9,z0+len-.9]) for(const k of [-1,1]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.18,16),blk); w.rotation.z=Math.PI/2; w.position.set(1.02*k,.55,zz); cur.add(w); }
  const meshTex=canvasTex(128,128,(x,w,h)=>{ x.clearRect(0,0,w,h); x.strokeStyle='#2a2d33'; x.lineWidth=5; for(let i=-128;i<256;i+=22){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+128,128); x.stroke(); x.beginPath(); x.moveTo(i+128,0); x.lineTo(i,128); x.stroke(); } }); meshTex.repeat.set(4,1.2);
  const meshM=new THREE.MeshStandardMaterial({map:meshTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide,metalness:.7,roughness:.4});
  for(const k of [-1,1]){ const side=new THREE.Mesh(new THREE.PlaneGeometry(len,1.3),meshM); side.rotation.y=Math.PI/2; side.position.set(1.6*k,DECK+.65,z0+len/2); cur.add(side); box(.08,.08,len,steel,1.6*k,DECK+1.32,z0+len/2); }
  const back=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.3),meshM); back.position.set(0,DECK+.65,z0); cur.add(back); box(3.2,.08,.08,steel,0,DECK+1.32,z0);
  for(const [px,pz] of [[-1.6,z0],[1.6,z0],[-1.6,z0+len],[1.6,z0+len]]) box(.1,1.35,.1,steel,px,DECK+.67,pz);
  // the gun mount: pedestal + swivel + twin barrels + seat handles
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.6,.75,.35,20),steel); ped.position.set(0,DECK+.17,z0+1.8); cur.add(ped);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.9,12),steel); post.position.set(0,DECK+.75,z0+1.8); cur.add(post);
  const gun=new THREE.Group(); gun.position.set(0,DECK+1.25,z0+1.8); gun.rotation.y=Math.PI; gun.rotation.x=-.08; cur.add(gun);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.6,.45,.8),std(0x2a2c32,{metalness:.6,roughness:.45})); gun.add(body); T.userData.gun=gun;
  const gm=std(0x2a2c32,{metalness:.6,roughness:.5,side:THREE.DoubleSide});
  part(gun,'gun',l=>l<=1,()=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,1.6,10),blk); b.rotation.x=Math.PI/2; b.position.set(0,.05,1.15); gun.children.at(-1); cur.add(b); const m=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.16,10),brass); m.rotation.x=Math.PI/2; m.position.set(0,.05,1.95); cur.add(m); });
  part(gun,'gun',l=>l===2||l===3,()=>{ for(const k of [-1,1]){ const b=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.6,10),blk); b.rotation.x=Math.PI/2; b.position.set(.14*k,.05,1.15); cur.add(b); const m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,.16,10),brass); m.rotation.x=Math.PI/2; m.position.set(.14*k,.05,1.95); cur.add(m); } });
  part(gun,'gun',l=>l>=3,()=>{ const sh=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.7,16,1,true,-.8,1.6),panel); sh.material=panel; sh.position.set(0,.05,.25); cur.add(sh);
    const sc=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.5,10),brass); sc.rotation.x=Math.PI/2; sc.position.set(.2,.36,.1); cur.add(sc); });
  part(gun,'gun',l=>l>=4,()=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(.16,.21,2.3,14),blk); b.rotation.x=Math.PI/2; b.position.set(0,.08,1.45); cur.add(b);
    const brake=new THREE.Mesh(new THREE.BoxGeometry(.5,.22,.35),blk); brake.position.set(0,.08,2.65); cur.add(brake); for(const k of [-1,1]){ const r=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,6,14),panel); r.position.set(0,.08,.9+k*.4); cur.add(r); } });
  const belt=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.6),brass); belt.position.set(.38,-.05,0); gun.add(belt);
  for(const k of [-1,1]){ const h=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.35,8),blk); h.rotation.z=Math.PI/2; h.position.set(.32*k,0,-.5); gun.add(h); const g2=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.18,8),std(0x6a3a22)); g2.position.set(.5*k,0,-.5); g2.rotation.z=Math.PI/2; gun.add(g2); }
  const sight=new THREE.Mesh(new THREE.TorusGeometry(.08,.015,6,14),steel); sight.position.set(0,.32,.2); gun.add(sight);
  const ammo=box(.5,.35,.4,std(0x3a4a2a),1.1,DECK+.18,z0+3.2); const ammo2=box(.5,.35,.4,std(0x3a4a2a),1.1,DECK+.18,z0+3.7);
  const flood=new THREE.SpotLight(0xfff0d0,60,12,.7,.5,1.5); flood.position.set(1.3,DECK+2.6,z0+len); flood.target.position.set(0,DECK+1,z0+1.8); cur.add(flood,flood.target); const fl2=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.2),new THREE.MeshBasicMaterial({color:0xfff2c8})); fl2.position.copy(flood.position); cur.add(fl2); box(.06,1.4,.06,steel,1.3,DECK+1.95,z0+len);
  const warn=new THREE.PointLight(0xff3020,6,6,2); warn.position.set(-1.4,DECK+1.5,z0+.2); cur.add(warn); const wb=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial({color:0xff3a2a})); wb.position.copy(warn.position); cur.add(wb);
}

// ===================== DETAIL PASS =====================
const glass=new THREE.MeshStandardMaterial({color:0x8fb0c8,metalness:.2,roughness:.05,transparent:true,opacity:.22});
const dark=std(0x14161a,{metalness:.6,roughness:.4});
const tube=(pts,r,m,par)=>{ const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))); const o=new THREE.Mesh(new THREE.TubeGeometry(c,Math.max(8,pts.length*8),r,8),m); o.castShadow=true; (par||cur).add(o); return o; };
const rivGeo=new THREE.SphereGeometry(.028,6,4), rivMeshes=[];
const rv=(x,y,z)=>{ let r=cur.userData.rv; if(!r){ r=new THREE.InstancedMesh(rivGeo,dark,1500); r.count=0; r.castShadow=false; cur.userData.rv=r; cur.add(r); rivMeshes.push(r); } if(r.count<1500) r.setMatrixAt(r.count++,new THREE.Matrix4().makeTranslation(x,y,z)); };
// --- walk-in cars: window frames + glass, rivet seams, trim, steps, grab rails, end lamps ---
for(const [z0,len] of [[4,4],[-2.2,5.8]]){ cur=z0>0?G.cab:G.workshop; const lo=z0>0?.8:1.05, tb=z0>0?.3:.5, wH=2.6-lo-tb, wy=DECK+lo+wH/2;
  const nWin=Math.max(1,Math.floor(len/2.2));
  for(const k of [-1,1]){
    for(let i=0;i<nWin;i++){ const zc=z0+(i+.5)*len/nWin, wl=len/nWin-.35;
      for(const y of [-wH/2,wH/2]) box(.07,.07,wl+.1,dark,1.61*k,wy+y,zc); for(const dz of [-wl/2,wl/2]) box(.07,wH+.12,.07,dark,1.61*k,wy,zc+dz);
      const gl=new THREE.Mesh(new THREE.PlaneGeometry(wl,wH),glass); gl.rotation.y=Math.PI/2; gl.position.set(1.55*k,wy,zc); cur.add(gl);
      box(.14,.06,wl+.2,std(0x3a2a1c),1.65*k,DECK+lo-.03,zc); }   // window sill
    box(.05,.09,len+.05,dark,1.62*k,DECK+.35,z0+len/2);           // brass trim line
    box(.05,.09,len+.05,dark,1.62*k,DECK+2.6-tb+.02,z0+len/2);
    for(let z=z0+.12;z<z0+len;z+=.22){ rv(1.62*k,DECK+.12,z); rv(1.62*k,DECK+lo-.07,z); rv(1.62*k,DECK+2.52,z); }
    for(let zz=z0;zz<=z0+len+.01;zz+=len/2) for(let y=DECK+.1;y<DECK+2.5;y+=.2) rv(1.62*k,y,zz);
    // steps + grab rail at each door end
    for(const zz of [z0+.25,z0+len-.25]){ box(.5,.06,.4,tread,1.85*k,DECK-.55,zz); box(.5,.06,.4,tread,1.85*k,DECK-.1,zz); box(.04,.55,.04,steel,2.08*k,DECK-.32,zz);
      tube([[1.68*k,DECK+.3,zz],[1.75*k,DECK+.35,zz],[1.75*k,DECK+1.9,zz],[1.68*k,DECK+1.95,zz]],.03,steel); } }
  // ladder to the roof on the back end
  for(const k of [.75,1.3]) box(.05,2.6,.05,steel,k,DECK+1.3,z0-.08); for(let y=DECK+.25;y<DECK+2.6;y+=.3) box(.6,.04,.04,steel,1.02,y,z0-.08);
  // roof walkway + vent
  box(.7,.05,len-.3,plank,0,DECK+3.3,z0+len/2); const vent=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.35,10),dark); vent.position.set(.6,DECK+3.35,z0+len*.3); cur.add(vent); const vc=new THREE.Mesh(new THREE.ConeGeometry(.3,.15,10),dark); vc.position.set(.6,DECK+3.58,z0+len*.3); cur.add(vc);
  // underframe: brake cylinders, tank, truss rods
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1.2,14),dark); tank.rotation.x=Math.PI/2; tank.position.set(.6,DECK-.95,z0+len/2); cur.add(tank);
  for(const k of [-1,1]) tube([[1.2*k,DECK-.8,z0+.3],[1.2*k,DECK-1.15,z0+len/2],[1.2*k,DECK-.8,z0+len-.3]],.025,steel);
}
// ===================== LOCOMOTIVE EXTERIOR + LEVELLED PARTS =====================
// part(car or object, upgrade name, test(level), build) -> a group shown only when test(level) is true
{ cur=G.cab; const P=panel, D=dark, hornM=std(0xe8dcb4,{roughness:.6}), glow=new THREE.MeshBasicMaterial({color:0xfff6dc}),
    iron=std(0x4a3a30,{metalness:.55,roughness:.7}), green=std(0x23302c,{metalness:.6,roughness:.45}), ember=new THREE.MeshBasicMaterial({color:0xff6a1a});
  const oct=(r1,r2,len)=>{ const g=new THREE.CylinderGeometry(r1,r2,len,8); g.rotateY(Math.PI/8); g.rotateX(Math.PI/2); return g; };
  const mesh=(geo,m,x,y,z)=>{ const o=new THREE.Mesh(geo,m); o.position.set(x,y,z); o.castShadow=true; cur.add(o); return o; };
  const cylZ=(r1,r2,len,m,x,y,z,seg=18)=>{ const o=mesh(new THREE.CylinderGeometry(r1,r2,len,seg),m,x,y,z); o.rotation.x=Math.PI/2; return o; };
  const ring=(r,t,m,x,y,z,axis='z')=>{ const o=mesh(new THREE.TorusGeometry(r,t,6,24),m,x,y,z); if(axis==='y') o.rotation.x=Math.PI/2; return o; };
  // ---------- always there: chassis, wheels, rods, pistons, buffer beam, marker lamps ----------
  box(3.1,.4,6.6,D,0,1.0,10.9); box(3.0,.4,.35,hazM,0,1.05,14.15);
  for(const k of [-1,1]){
    for(const z of [9.0,10.6,12.2]){ const w=new THREE.Group(); w.position.set(1.28*k,.8,z); cur.add(w);
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(.78,.78,.16,22),D); disc.rotation.z=Math.PI/2; w.add(disc);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.72,.06,6,26),P); rim.rotation.y=Math.PI/2; rim.position.x=.09*k; w.add(rim);
      for(let s=0;s<6;s++){ const spk=new THREE.Mesh(new THREE.BoxGeometry(.04,1.3,.07),steel); spk.rotation.x=s*Math.PI/6; spk.position.x=.09*k; w.add(spk); }
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.12,10),P); hub.rotation.z=Math.PI/2; hub.position.x=.14*k; w.add(hub); }
    box(.07,.13,3.6,steel,1.45*k,.62,10.6);
    cylZ(.34,.34,1.0,D,1.3*k,.95,13.55,14); for(const z of [13.1,14.0]) ring(.35,.04,P,1.3*k,.95,z);
    box(.22,.22,.2,D,.95*k,1.5,14.0); mesh(new THREE.PlaneGeometry(.14,.14),new THREE.MeshBasicMaterial({color:k<0?0xff3a2a:0xffd060}),.95*k,1.5,14.11); }
  // ---------- ENGINE: 1 rusty boiler, 2 brass boiler, 3 armoured hood, 4 twin-stack war engine ----------
  const roundBoiler=m=>{ cylZ(.86,.86,5.6,m,0,1.8,10.9,24); cylZ(.92,.92,.3,D,0,1.8,13.6,24); cylZ(.7,.7,.06,D,0,1.8,13.77,24); cylZ(.12,.12,.1,brass,0,1.8,13.82,12); };
  part('cab','engine',l=>l<=1,()=>{ roundBoiler(iron);
    for(const z of [8.6,11,13.2]) ring(.89,.05,D,0,1.8,z);
    for(let i=0;i<9;i++){ const p=box(.2+Math.random()*.15,.03,.4+Math.random()*.5,rust,(Math.random()-.5)*.2,2.66,8.6+i*.55); p.rotation.z=(Math.random()-.5)*.4; }   // rust patches
    mesh(new THREE.CylinderGeometry(.28,.24,.9,14),iron,0,2.95,12.7); ring(.3,.05,D,0,3.38,12.7,'y');
    mesh(new THREE.SphereGeometry(.36,14,10,0,Math.PI*2,0,Math.PI/2),iron,0,2.55,10.6); });
  part('cab','engine',l=>l===2,()=>{ roundBoiler(green);
    for(const z of [8.4,9.6,10.8,12,13.2]) ring(.885,.05,brass,0,1.8,z);
    mesh(new THREE.CylinderGeometry(.42,.27,1.4,16),green,0,3.25,12.7); ring(.43,.07,brass,0,3.95,12.7,'y'); ring(.3,.05,brass,0,2.7,12.7,'y');
    mesh(new THREE.SphereGeometry(.42,14,10,0,Math.PI*2,0,Math.PI/2),brass,0,2.55,10.4); mesh(new THREE.SphereGeometry(.32,12,8,0,Math.PI*2,0,Math.PI/2),green,0,2.58,11.5);
    for(const k of [-1,1]) tube([[.6*k,2.5,8.3],[.66*k,2.45,10],[.66*k,2.4,12.8],[.5*k,2.2,13.6]],.03,brass); });
  part('cab','engine',l=>l>=3,()=>{
    const hood=mesh(oct(.94,.98,5.6),P,0,1.84,10.9); hood.receiveShadow=true;
    for(const z of [8.25,9.65,11.05,12.45,13.6]) mesh(oct(1.02,1.02,.14),D,0,1.84,z);
    for(const k of [-1,1]){ for(const y of [1.5,2.18]){ box(.06,.08,5.6,D,.91*k,y,10.9); for(let z=8.3;z<13.6;z+=.32) rv(.95*k,y,z); }
      for(let i=0;i<4;i++){ const pl=box(.08,.45,1.15,P,.97*k,1.84,8.95+i*1.4); pl.rotation.z=.12*k; } }
    for(let z=8.3;z<13.6;z+=.32) rv(0,2.74,z);
    mesh(oct(1.0,1.0,.2),D,0,1.84,13.75); });
  const tallStack=x=>{ mesh(new THREE.CylinderGeometry(.36,.3,1.7,14),P,x,3.55,12.7); mesh(new THREE.CylinderGeometry(.5,.55,.25,14),D,x,2.76,12.7); mesh(new THREE.CylinderGeometry(.46,.4,.3,14),D,x,4.45,12.7); for(const y of [3.2,3.9]) ring(.35,.04,D,x,y,12.7,'y'); };
  part('cab','engine',l=>l===3,()=>tallStack(0));
  part('cab','engine',l=>l===4,()=>{ for(const x of [-.42,.42]) tallStack(x);
    for(const x of [-.28,.28]) for(let i=0;i<4;i++) box(.07,.04,.5,ember,x,2.75,9.0+i*.75);       // glowing firebox vents
    for(const x of [-.42,.42]) mesh(new THREE.TorusGeometry(.5,.04,6,18),ember,x,2.9,12.7).rotation.x=Math.PI/2;
    for(const k of [-1,1]) tube([[.5*k,2.7,8.4],[.62*k,2.95,9.5],[.62*k,2.95,11.8],[.42*k,2.9,12.4]],.06,steel); });
  // ---------- ARMOUR: 1 wheel skirts, 2 X-braced plating, 3 spikes everywhere ----------
  part('cab','armor',l=>l>=1,()=>{ for(const k of [-1,1]){ box(.1,.55,5.6,P,1.55*k,1.45,10.85); box(.12,.08,5.6,D,1.56*k,1.18,10.85); box(.12,.08,5.6,D,1.56*k,1.72,10.85);
      for(let z=8.6;z<13.4;z+=.95){ rv(1.61*k,1.62,z+.45); rv(1.61*k,1.28,z+.45); } } });
  const xBrace=(g,z0,n,w,lo)=>{ for(const k of [-1,1]) for(let i=0;i<n;i++){ const zc=z0+w/2+i*w; for(const s of [-1,1]){ const xb=box(.06,.09,Math.hypot(w,lo-.1)+.05,D,1.63*k,DECK+lo/2,zc); xb.rotation.x=s*Math.atan2(lo-.1,w); } box(.06,lo,.09,D,1.63*k,DECK+lo/2,z0+(i+1)*w); } };
  part('cab','armor',l=>l>=2,()=>{ xBrace(cur,4,2,2,.8); for(const k of [-1,1]) box(.5,.08,4.6,D,1.75*k,DECK+2.7,6);
    for(const z of [4.6,5.8,7.0]){ const rg=new THREE.CylinderGeometry(2.26,2.26,.7,20,1,true,Math.PI-.7,1.4); rg.rotateX(Math.PI/2); const pl=new THREE.Mesh(rg,new THREE.MeshStandardMaterial({map:panelTex,color:0x1c1d22,metalness:.5,roughness:.6,side:THREE.DoubleSide})); pl.position.set(0,DECK+1.05,z); cur.add(pl); }; });
  part('workshop','armor',l=>l>=2,()=>{ xBrace(cur,-2.2,3,5.8/3,1.05); });
  const spikeRow=(pts,dir)=>{ for(const [x,y,z] of pts){ const sp=mesh(new THREE.ConeGeometry(.14,.4,4),P,x,y,z); if(dir==='up'){} else if(dir==='back') sp.rotation.x=-Math.PI/2; else sp.rotation.z=-Math.PI/2*dir; } };
  part('cab','armor',l=>l>=3,()=>{ for(const k of [-1,1]){ spikeRow([...Array(6)].map((_,i)=>[1.78*k,1.45,8.6+i*.95]),k); spikeRow([...Array(4)].map((_,i)=>[1.62*k,DECK+2.62,4.4+i*1.05]),k); } });
  part('workshop','armor',l=>l>=3,()=>{ for(const k of [-1,1]) spikeRow([...Array(6)].map((_,i)=>[1.62*k,DECK+2.62,-1.8+i*1.0]),k); });
  part('gun','armor',l=>l>=3,()=>{ spikeRow([...Array(7)].map((_,i)=>[-1.35+i*.45,DECK+.9,-20.2]),'back'); for(const k of [-1,1]) spikeRow([...Array(4)].map((_,i)=>[1.72*k,DECK+.9,-19.5+i*1.3]),k); });
  // ---------- PLOUGH: 0 little cowcatcher, 1 steel plough, 2 spiked plough, 3 horned ram ----------
  part('cab','plough',l=>l===0,()=>{ for(let i=-3;i<=3;i++){ const bar=box(.07,.07,.9,rust,i*.24,.72,14.55); bar.rotation.x=.75; bar.rotation.y=-i*.05; } box(1.9,.08,.08,rust,0,.38,14.85); });
  const bigPlough=m=>{ for(let i=-5;i<=5;i++){ const bar=box(.09,.09,1.45,m,i*.27,.62,14.65); bar.rotation.x=.62; bar.rotation.y=-i*.06; } box(3.1,.12,.12,m,0,.2,15.15); box(2.9,.1,.1,m,0,.85,14.3); };
  part('cab','plough',l=>l===1,()=>bigPlough(steel));
  part('cab','plough',l=>l>=2,()=>{ bigPlough(D); for(let i=0;i<7;i++){ const sp=mesh(new THREE.ConeGeometry(.14,.5,4),P,-1.29+i*.43,1.05,14.55); sp.rotation.x=Math.PI/2; } });
  const hornGeo=pts=>{ const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))), TS=18, RS=10, g=new THREE.TubeGeometry(c,TS,.26,RS,false), p=g.attributes.position, cp=new THREE.Vector3();
    for(let i=0;i<=TS;i++){ c.getPointAt(i/TS,cp); const s=Math.max(.04,1-i/TS*.96); for(let j=0;j<=RS;j++){ const n=i*(RS+1)+j; p.setXYZ(n,cp.x+(p.getX(n)-cp.x)*s,cp.y+(p.getY(n)-cp.y)*s,cp.z+(p.getZ(n)-cp.z)*s); } }
    g.computeVertexNormals(); return g; };
  part('cab','plough',l=>l>=3,()=>{ for(const k of [-1,1]){ mesh(hornGeo([[.56*k,2.6,11.9],[.8*k,3.05,11.75],[.95*k,3.55,11.35],[.92*k,3.9,10.75],[.78*k,4.0,10.25]]),hornM,0,0,0);
      mesh(new THREE.CylinderGeometry(.32,.38,.18,10),D,.56*k,2.66,11.9);
      [[.68*k,2.87,11.85],[.86*k,3.25,11.6],[.95*k,3.55,11.35]].forEach((c,i)=>{ const r=mesh(new THREE.TorusGeometry(.2-i*.03,.025,5,12),D,...c); r.lookAt(c[0]+.4*k,c[1]+.9,c[2]-.4); }); } });
  // ---------- LIGHT: 0 small lamp, 1 big headlight, 2 roof searchlight ----------
  part('cab','light',l=>l===0,()=>{ box(.36,.32,.3,brass,0,2.9,13.45); mesh(new THREE.CircleGeometry(.12,16),glow,0,2.9,13.61); });
  part('cab','light',l=>l>=1,()=>{ cylZ(.55,.5,.55,D,0,1.9,14.05,20); mesh(new THREE.TorusGeometry(.5,.07,8,24),steel,0,1.9,14.33); mesh(new THREE.CircleGeometry(.45,24),glow,0,1.9,14.33);
    mesh(new THREE.CircleGeometry(.95,24),new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:.18,depthWrite:false}),0,1.9,14.36); });
  part('cab','light',l=>l>=2,()=>{ const y=DECK+3.45; box(.08,.45,.08,D,.85,y-.15,7.3); const yoke=mesh(new THREE.TorusGeometry(.32,.04,6,14,Math.PI),D,.85,y+.05,7.3); yoke.rotation.z=Math.PI;
    cylZ(.28,.32,.5,D,.85,y+.1,7.35,16); mesh(new THREE.CircleGeometry(.25,18),glow,.85,y+.1,7.61); });
  const head=new THREE.SpotLight(0xfff0c8,500,100,.38,.5,1.4); head.castShadow=true; cur.add(head,head.target); T.userData.headLight=head;
  // ---------- HORN: 0 brass whistle, 1 twin scare-horns ----------
  part('cab','horn',l=>l===0,()=>{ mesh(new THREE.CylinderGeometry(.07,.1,.5,10),brass,-.7,DECK+3.38,7.3); mesh(new THREE.SphereGeometry(.09,8,6),brass,-.7,DECK+3.66,7.3); });
  part('cab','horn',l=>l>=1,()=>{ box(.5,.14,.3,D,-.8,DECK+3.17,7.1); for(const [x,len] of [[-.95,1.0],[-.62,.75]]){ const h=mesh(new THREE.ConeGeometry(.17,len,14,1,true),D,x,DECK+3.4,7.1+len/2-.3); h.rotation.x=Math.PI/2; h.material=std(0x1b1c20,{metalness:.7,roughness:.35,side:THREE.DoubleSide}); mesh(new THREE.TorusGeometry(.17,.025,6,16),P,x,DECK+3.4,7.1+len-.3); } });
  // ---------- MISSILE LAUNCHER on the cab roof: 1 one tube, 2 two tubes, 3 four tubes + guidance dish ----------
  const LZ=5.5, LY=DECK+3.4;
  const tubeAt=(x,y)=>{ const t=cylZ(.16,.16,1.4,std(0x2a2c32,{metalness:.6}),x,y,LZ,12); t.rotation.x=Math.PI/2-.3; const tip=mesh(new THREE.ConeGeometry(.15,.3,10),std(0xc02020),x,y+.2,LZ+.68); tip.rotation.x=Math.PI/2-.3; ring(.17,.03,P,x,y,LZ-.2); };
  part('cab','launcher',l=>l>=1,()=>{ box(.9,.22,.9,blk,0,LY,LZ); });
  part('cab','launcher',l=>l===1,()=>tubeAt(0,LY+.35));
  part('cab','launcher',l=>l===2,()=>{ tubeAt(-.22,LY+.35); tubeAt(.22,LY+.35); });
  part('cab','launcher',l=>l>=3,()=>{ for(const x of [-.22,.22]) for(const y of [.32,.66]) tubeAt(x,LY+y); box(.04,.6,.04,D,.55,LY+.4,LZ-.4); const dish=mesh(new THREE.SphereGeometry(.22,12,8,0,Math.PI*2,0,Math.PI/3),steel,.55,LY+.75,LZ-.4); dish.rotation.x=-1; });
  // cab roof marker lamp
  box(.3,.2,.2,D,0,DECK+2.95,8.12); mesh(new THREE.PlaneGeometry(.22,.12),glow,0,DECK+2.95,8.23);
}
// ---------- WORKSHOP CAR levels: 2 tool chest + drill press, 3 repair crane on the roof ----------
part('workshop','workshop',l=>l>=2,()=>{ const z0=-2.2, red=std(0xb02a20,{metalness:.4,roughness:.5});
  box(.5,.9,.5,red,1.15,DECK+.45,z0+4.5); for(let i=0;i<4;i++) box(.02,.04,.3,steel,.89,DECK+.15+i*.2,z0+4.5);
  box(.25,.06,.25,dark,-1.05,DECK+1.02,z0+3.9); box(.06,.7,.06,steel,-1.15,DECK+1.37,z0+3.9); box(.3,.16,.2,red,-1.05,DECK+1.67,z0+3.9); box(.03,.2,.03,steel,-1.0,DECK+1.49,z0+3.9); });
part('workshop','workshop',l=>l>=3,()=>{ const z0=-2.2, Y=std(0xf2c21a,{metalness:.3,roughness:.5});
  box(.35,.3,.35,dark,-.6,DECK+3.3,z0+1.2); const arm1=box(.14,1.4,.14,Y,-.6,DECK+4.1,z0+1.2); arm1.rotation.z=.3; const arm2=box(1.2,.12,.12,Y,-.05,DECK+4.7,z0+1.2); arm2.rotation.z=-.2;
  tube([[.5,DECK+4.55,z0+1.2],[.55,DECK+4.1,z0+1.2]],.015,dark); box(.1,.18,.1,steel,.55,DECK+3.98,z0+1.2);
  box(.12,.3,.12,dark,.6,DECK+3.3,z0+4.4); const bea=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color:0x4aff7a})); bea.position.set(.6,DECK+3.51,z0+4.4); cur.add(bea); });
// --- gun deck detail: armored shield plates, spent shells, sandbags ---
cur=G.gun;
{ const z0=-8+GUN_SHIFT;
  for(const k of [-1,1]){ const p=new THREE.Mesh(new RoundedBoxGeometry(.12,.7,1.0,2,.04),panel); p.position.set(1.62*k,DECK+.35,z0+.6); cur.add(p); for(let i=0;i<4;i++) rv(1.69*k,DECK+.1+i*.17,z0+.15); }
  for(let i=0;i<12;i++){ const sh=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.1,6),brass); sh.position.set((Math.random()-.5)*1.4,DECK+.03,z0+1.8+(Math.random()-.5)*1.4); sh.rotation.set(Math.PI/2,Math.random()*6,0); cur.add(sh); }
  for(let i=0;i<5;i++){ const sb=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.35,4,8),std(0x8a7a5a)); sb.rotation.z=Math.PI/2; sb.position.set(-1.1+(i%3)*.5,DECK+.15+(i>2?.26:0),z0+.35); cur.add(sb); }
}
rivMeshes.forEach(r=>{ r.instanceMatrix.needsUpdate=true; r.computeBoundingSphere(); });

// couplers between cars
[['workshop',3.8],['material',-2.3],['cargo',-8.3],['gun',-14.3]].forEach(([c,z])=>box(.3,.25,.5,steel,0,DECK-.4,z,G[c]));
// ================= MATERIAL CAR (rails + sleepers) and CARGO CAR (crates) =================
function flatcar(z0,len,col){ box(3.3,.3,len,tread,0,DECK-.15,z0+len/2); box(3.4,.5,len,hazM,0,DECK-.55,z0+len/2);
  for(const zz of [z0+.9,z0+len-.9]) for(const k of [-1,1]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.18,16),blk); w.rotation.z=Math.PI/2; w.position.set(1.02*k,.55,zz); cur.add(w); }
  for(const k of [-1,1]){ for(let z=z0+.3;z<z0+len;z+=1.1) box(.08,.9,.08,steel,1.55*k,DECK+.45,z); box(.06,.06,len,brass,1.55*k,DECK+.9,z0+len/2); }
  const sign=box(1.4,.35,.06,col,0,DECK+.55,z0+len-.05); return sign; }
cur=G.material;
{ const z0=-8.2, len=5.8; flatcar(z0,len,std(0xc9a24a));
  const railM=std(0xb8bec8,{metalness:.85,roughness:.3}), slM=std(0x5a3d26);
  T.userData.railStack=[]; for(let i=0;i<7;i++){ const g=new THREE.Group(); for(const k of [-.25,.25]){ const r=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,4.6),railM); r.position.set(k,0,0); g.add(r); } g.position.set(-.75+(i%2)*.0,DECK+.1+Math.floor(i/2)*.16,z0+len/2); g.position.x=-1.05+(i%2)*.45; cur.add(g); T.userData.railStack.push(g); }
  for(let i=0;i<8;i++){ const sl=new THREE.Mesh(new THREE.BoxGeometry(1.1,.18,.32),slM); sl.position.set(1.15,DECK+.1+Math.floor(i/2)*.2,z0+1.6+(i%2)*.5); sl.rotation.y=Math.PI/2; cur.add(sl); } }
part('material','material',l=>l>=2,()=>{ const z0=-8.2; for(const k of [-1,1]) for(let z=z0+.3;z<z0+5.8;z+=1.1){ box(.1,1.5,.1,dark,1.6*k,DECK+.75,z); box(.14,.14,.14,panel,1.6*k,DECK+1.55,z); } for(const k of [-1,1]) box(.05,.05,5.6,steel,1.6*k,DECK+1.35,z0+2.9); });
part('material','material',l=>l>=3,()=>{ const z0=-8.2, Y=panel; box(.4,.3,.4,dark,.9,DECK+.15,z0+.3); box(.16,2.3,.16,Y,.9,DECK+1.4,z0+.3); const jib=box(2.2,.14,.14,Y,0,DECK+2.5,z0+.3); jib.rotation.z=-.15;
  tube([[-.85,DECK+2.6,z0+.3],[-.85,DECK+1.9,z0+.3]],.015,dark); const hook=new THREE.Mesh(new THREE.TorusGeometry(.08,.025,6,10,4.5),steel); hook.position.set(-.85,DECK+1.82,z0+.3); cur.add(hook); });
cur=G.cargo;
{ const z0=-14.2, len=5.8; flatcar(z0,len,std(0x4ab0e8));
  T.userData.cargo=[]; const cm=[std(0x6a4a2a),std(0x5a6a3a),std(0x7a3a2a)];
  for(let i=0;i<4;i++){ const c=box(.9,.8,.9,cm[i%3],(i%2?1.0:-1.0),DECK+.4,z0+1.4+Math.floor(i/2)*2.6); c.visible=false; T.userData.cargo.push(c); }
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),new THREE.MeshBasicMaterial({color:0xffc870})); lamp.position.set(1.55,DECK+1.1,z0+len/2); cur.add(lamp); }
part('cargo','cargo',l=>l>=2,()=>{ const z0=-14.2; for(let i=0;i<4;i++){ const h=new THREE.Mesh(new THREE.TorusGeometry(1.55,.05,6,20,Math.PI),dark); h.position.set(0,DECK+1.0,z0+.5+i*1.6); cur.add(h); }
  const tarp=new THREE.Mesh(new THREE.CylinderGeometry(1.53,1.53,4.9,20,1,true,-Math.PI/2,Math.PI),std(0x5a5a3a,{side:THREE.DoubleSide,roughness:.95})); tarp.rotation.x=Math.PI/2; tarp.rotation.y=Math.PI/2; tarp.position.set(0,DECK+1.0,z0+2.9); tarp.scale.set(1,1,1); cur.add(tarp); });
part('gun','gun',l=>l>=4,()=>{ const z0=-20; for(const k of [-1,1]){ box(.08,.75,4.4,panel,1.66*k,DECK+.45,z0+2.6); for(let z=z0+.6;z<z0+4.8;z+=.5) rv(1.71*k,DECK+.72,z); } });
rivMeshes.forEach(r=>{ r.instanceMatrix.needsUpdate=true; r.computeBoundingSphere(); });
T.traverse(o=>{ if(o.isLight&&o.castShadow&&!o.isSpotLight) o.castShadow=false; });
// show the right look for every part + slide cars together for the cars you own
T.userData.setLevels=u=>{ for(const p of parts) p.g.visible=!!p.test(u[p.name]||0);
  const L=layout(u); for(const c of CARS){ G[c].visible=L[c]!=null; G[c].position.z=L[c]||0; }
  const h=T.userData.headLight, l=u.light||0;
  if(l===0){ h.position.set(0,2.9,13.7); h.intensity=140; h.distance=45; h.angle=.3; } else { h.position.set(0,1.9,14.4); h.intensity=l>=2?750:500; h.distance=l>=2?140:100; h.angle=l>=2?.44:.38; }
  h.target.position.set(0,1,h.position.z+40); return L; };
T.userData.setLevels({engine:1});
return T; }
