// The walk-in train "No 7": locomotive + cab, workshop wagon, caged gun deck.
// Train-local space: forward = +z, floor of the walk-in cars at y = DECK.
import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/jsm/geometries/RoundedBoxGeometry.js';
export const DECK=1.2;
// gun deck sits behind two extra cars: material car (rails) and cargo car
export const GUN_SHIFT=-12;
export const GUN_Z=-5.1+GUN_SHIFT;
export function buildTrain(){
const T=new THREE.Group();
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
const inner=new THREE.MeshStandardMaterial({color:0x3c3a36,roughness:.7,metalness:.4});
const hazM=new THREE.MeshStandardMaterial({map:hazTex,roughness:.6,metalness:.3});
// ---- helpers ----
const box=(w,h,d,m,x,y,z,par)=>{ const r=Math.min(.06,Math.min(w,h,d)*.3); const o=new THREE.Mesh(r>.012?new RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=o.receiveShadow=true; (par||T).add(o); return o; };

// a walk-in car shell: floor + walls with window openings + curved roof
function carShell(z0,len,{door=true,winFront=false,winBack=false}={}){ const g=new THREE.Group(); T.add(g); const hw=1.55, wh=2.6;
  box(3.3,.3,len,tread,0,DECK-.15,z0+len/2,g);
  for(const k of [-1,1]){ // side walls with 2 window holes
    const parts=[[0,1.0],[1.0,.6]]; box(.1,1.05,len,panel,hw*k,DECK+.52,z0+len/2,g); box(.1,.5,len,panel,hw*k,DECK+wh-.25,z0+len/2,g);
    const nWin=Math.max(1,Math.floor(len/2.2)); for(let i=0;i<=nWin;i++){ const pz=z0+i*len/nWin; box(.1,1.05,.35,panel,hw*k,DECK+1.57,Math.min(z0+len-.17,Math.max(z0+.17,pz)),g); } }
  for(const k of [-1,1]){ box(.03,1.05,len-.1,inner,(hw-.07)*k,DECK+.52,z0+len/2,g); box(.03,.5,len-.1,inner,(hw-.07)*k,DECK+wh-.25,z0+len/2,g); }
  if(winFront){ box(3.0,1.05,.03,inner,0,DECK+.52,z0+len-.07,g); box(3.0,.5,.03,inner,0,DECK+wh-.25,z0+len-.07,g); }
  for(const [zz,win] of [[z0,winBack],[z0+len,winFront]]){ if(win){ box(3.2,1.05,.1,panel,0,DECK+.52,zz,g); box(3.2,.5,.1,panel,0,DECK+wh-.25,zz,g); box(.35,1.05,.1,panel,-1.42,DECK+1.57,zz,g); box(.35,1.05,.1,panel,1.42,DECK+1.57,zz,g); }
    else if(door){ box(1.05,wh,.1,panel,-1.08,DECK+wh/2,zz,g); box(1.05,wh,.1,panel,1.08,DECK+wh/2,zz,g); box(1.1,.55,.1,panel,0,DECK+wh-.27,zz,g); const fr=new THREE.Mesh(new THREE.TorusGeometry(.56,.05,6,16,Math.PI),steel); fr.position.set(0,DECK+2.05,zz); g.add(fr); } }
  const rg=new THREE.CylinderGeometry(2.2,2.2,len+.3,24,1,true,Math.PI-.78,1.56); rg.rotateX(Math.PI/2);
  const roof=new THREE.Mesh(rg,std(0x1c1d22,{metalness:.5,roughness:.6,side:THREE.DoubleSide})); roof.position.set(0,DECK+wh-1.55,z0+len/2); roof.castShadow=true; g.add(roof);
  for(let i=0;i<=len;i+=1.45){ const rgb=new THREE.CylinderGeometry(2.12,2.12,.12,20,1,true,Math.PI-.78,1.56); rgb.rotateX(Math.PI/2); const rib=new THREE.Mesh(rgb,std(0x2a2b30,{metalness:.5,side:THREE.DoubleSide})); rib.position.set(0,DECK+wh-1.55,z0+i); g.add(rib); }
  box(3.4,.5,len,hazM,0,DECK-.55,z0+len/2,g);
  for(const zz of [z0+.9,z0+len-.9]) for(const k of [-1,1]){ const wh2=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.18,16),blk); wh2.rotation.z=Math.PI/2; wh2.position.set(1.02*k,.55,zz); g.add(wh2); }
  return g; }
// ================= CAR 1: LOCOMOTIVE (boiler in front, walk-in CAB behind) =================
{ const z0=4; // boiler from z=8 to z=13
  // walk-in cab
  carShell(z0,4,{winFront:true,door:true});
  // control desk
  const desk=box(2.6,1.0,.9,std(0x2b3326,{metalness:.5,roughness:.5}),0,DECK+.5,z0+3.45);
  const top=new THREE.Mesh(new THREE.BoxGeometry(2.6,.08,.95),steel); top.position.set(0,DECK+1.04,z0+3.45); top.rotation.x=-.35; T.add(top);
  // gauges
  const gaugeTex=canvasTex(128,128,(x,w,h)=>{ x.fillStyle='#e8e0c8'; x.beginPath(); x.arc(64,64,60,0,7); x.fill(); x.strokeStyle='#222'; x.lineWidth=3; for(let i=0;i<10;i++){ const a=Math.PI*.8+i/9*Math.PI*1.4; x.beginPath(); x.moveTo(64+Math.cos(a)*46,64+Math.sin(a)*46); x.lineTo(64+Math.cos(a)*56,64+Math.sin(a)*56); x.stroke(); } x.strokeStyle='#b01010'; x.lineWidth=4; x.beginPath(); x.moveTo(64,64); x.lineTo(64+Math.cos(-.4)*44,64+Math.sin(-.4)*44); x.stroke(); });
  for(const [gx,gy] of [[-.9,1.65],[-.45,1.75],[.45,1.75],[.9,1.65]]){ const ring=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.06,20),brass); ring.rotation.x=Math.PI/2-.35; ring.position.set(gx,DECK+gy-.38,z0+3.62); T.add(ring); const face2=new THREE.Mesh(new THREE.CircleGeometry(.16,20),new THREE.MeshBasicMaterial({map:gaugeTex})); face2.position.set(gx,DECK+gy-.38,z0+3.58); face2.rotation.x=-.35; face2.rotation.y=Math.PI; T.add(face2); }
  // throttle lever + brake lever
  const lev=(x,col,ang)=>{ const base=new THREE.Mesh(new THREE.BoxGeometry(.3,.15,.3),blk); base.position.set(x,DECK+1.1,z0+3.35); T.add(base); const arm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.7,8),steel); arm.position.set(x,DECK+1.45,z0+3.35); arm.rotation.x=ang; T.add(arm); const knob=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),std(col,{roughness:.4})); knob.position.set(x,DECK+1.78,z0+3.35-Math.sin(ang)*.35); T.add(knob); };
  lev(-.2,0xc01818,-.4); lev(.25,0x2b6fd6,.25);
  // indicator lights
  for(let i=0;i<8;i++){ const c=[0x3cff6a,0x3cff6a,0xffb020,0xff3030][i%4]; const l=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),new THREE.MeshBasicMaterial({color:c})); l.position.set(-1.1+i*.1+(i>3?1.4:0),DECK+1.12,z0+3.15); T.add(l); }
  const red=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.08,14),new THREE.MeshBasicMaterial({color:0xff2020})); red.position.set(1.05,DECK+1.12,z0+3.2); T.add(red);
  // firebox door glowing at the boiler back wall, cab lamp
  const fire=new THREE.Mesh(new THREE.PlaneGeometry(.7,.5),new THREE.MeshBasicMaterial({color:0xff7a2a})); fire.position.set(-1.2,DECK+.7,z0+3.0); fire.rotation.y=Math.PI/2; T.add(fire);
  const firel=new THREE.PointLight(0xff6a20,8,4,2); firel.position.set(-1.1,DECK+.8,z0+3); T.add(firel);
  const cablamp=new THREE.Mesh(new THREE.BoxGeometry(.35,.22,.2),new THREE.MeshBasicMaterial({color:0xfff2c8})); cablamp.position.set(1.2,DECK+2.35,z0+3.6); T.add(cablamp);
  const cl=new THREE.PointLight(0xffe8b8,4,7,2); cl.position.set(1.0,DECK+2.2,z0+3.2); cl.castShadow=true; T.add(cl);
  // driver's stool
  const stool=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.08,14),std(0x6a3a22)); stool.position.set(0,DECK+.75,z0+2.3); T.add(stool); box(.08,.75,.08,steel,0,DECK+.37,z0+2.3);
}
// ================= CAR 2: WORKSHOP WAGON =================
{ const z0=-2.2, len=5.8; carShell(z0,len,{door:true});
  // workbench with blueprint
  const bench=box(.9,.08,2.2,plank,-1.05,DECK+.95,z0+3);
  for(const dz of [-.95,.95]) for(const dx of [-.35,.35]) box(.08,.95,.08,std(0x3a2816),-1.05+dx,DECK+.47,z0+3+dz);
  const bpTex=canvasTex(256,160,(x,w,h)=>{ x.fillStyle='#1c4fa8'; x.fillRect(0,0,w,h); x.strokeStyle='#cfe2ff'; x.lineWidth=2; x.strokeRect(10,10,w-20,h-20); x.beginPath(); x.arc(80,95,22,0,7); x.arc(170,95,22,0,7); x.stroke(); x.strokeRect(50,40,150,40); x.strokeRect(150,22,24,18); x.font='12px monospace'; x.fillStyle='#cfe2ff'; x.fillText('GUN MK-II',20,145); x.fillText('No 7',200,30); });
  const bp=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.3),new THREE.MeshStandardMaterial({map:bpTex,roughness:.9})); bp.rotation.x=-Math.PI/2; bp.rotation.z=Math.PI/2; bp.position.set(-1.05,DECK+1.0,z0+3); T.add(bp);
  // tool wall on the right
  const board=box(.06,1.3,2.6,std(0x5a4a34),1.48,DECK+1.6,z0+3);
  const toolY=std(0xd6a21e,{roughness:.5,metalness:.2}), toolB=std(0x2a2a2e,{metalness:.6});
  const wrench=new THREE.Group(); box(.04,.7,.08,steel,0,0,0,wrench); const jaw=new THREE.Mesh(new THREE.TorusGeometry(.09,.03,6,10,4.5),steel); jaw.position.y=.38; wrench.add(jaw); wrench.position.set(1.42,DECK+1.6,z0+2.0); T.add(wrench);
  const drill=new THREE.Group(); box(.12,.3,.12,toolY,0,0,0,drill); box(.12,.12,.32,toolB,0,.2,.1,drill); drill.position.set(1.4,DECK+1.55,z0+2.6); T.add(drill);
  const hammer=new THREE.Group(); box(.04,.6,.04,std(0x6a4a2a),0,0,0,hammer); box(.08,.1,.22,steel,0,.32,0,hammer); hammer.position.set(1.42,DECK+1.6,z0+3.2); T.add(hammer);
  for(const dz of [3.8,4.1]){ const pipe=new THREE.Group(); box(.06,1.1,.06,steel,0,0,0,pipe); box(.14,.2,.18,toolY,0,.55,0,pipe); pipe.position.set(1.42,DECK+1.5,z0+dz); T.add(pipe); }
  // shelf with paint cans + scrap pile
  box(.4,.06,1.6,plank,-1.3,DECK+.5,z0+.9);
  [0xb02a2a,0x2a8a3a,0x7a3ac0,0xd6a21e].forEach((c,i)=>{ const can=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.26,12),std(0xb8bcc2,{metalness:.7,roughness:.4})); can.position.set(-1.3,DECK+.66,z0+.35+i*.38); T.add(can); const drip=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.06,12),std(c,{roughness:.3})); drip.position.set(-1.3,DECK+.77,z0+.35+i*.38); T.add(drip); });
  for(let i=0;i<10;i++){ const sc=new THREE.Mesh(new THREE.BoxGeometry(.15+Math.random()*.25,.05,.2+Math.random()*.3),rust); sc.position.set(.9+Math.random()*.4,DECK+.05+i*.05,z0+.7+Math.random()*.6); sc.rotation.y=Math.random()*3; T.add(sc); }
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xffe0a0})); bulb.position.set(0,DECK+2.3,z0+3); T.add(bulb); const wl=new THREE.PointLight(0xffd9a0,9,6,2); wl.position.set(0,DECK+2.2,z0+3); wl.castShadow=true; T.add(wl);
  const cord=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.4,4),blk); cord.position.set(0,DECK+2.55,z0+3); T.add(cord);
}
// ================= CAR 3: CAGED GUN DECK (open-top flatcar with mesh cage) =================
{ const z0=-8+GUN_SHIFT, len=5.2; box(3.3,.3,len,tread,0,DECK-.15,z0+len/2); box(3.4,.5,len,hazM,0,DECK-.55,z0+len/2);
  for(const zz of [z0+.9,z0+len-.9]) for(const k of [-1,1]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.18,16),blk); w.rotation.z=Math.PI/2; w.position.set(1.02*k,.55,zz); T.add(w); }
  const meshTex=canvasTex(128,128,(x,w,h)=>{ x.clearRect(0,0,w,h); x.strokeStyle='#2a2d33'; x.lineWidth=5; for(let i=-128;i<256;i+=22){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+128,128); x.stroke(); x.beginPath(); x.moveTo(i+128,0); x.lineTo(i,128); x.stroke(); } }); meshTex.repeat.set(4,1.2);
  const meshM=new THREE.MeshStandardMaterial({map:meshTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide,metalness:.7,roughness:.4});
  for(const k of [-1,1]){ const side=new THREE.Mesh(new THREE.PlaneGeometry(len,1.3),meshM); side.rotation.y=Math.PI/2; side.position.set(1.6*k,DECK+.65,z0+len/2); T.add(side); box(.08,.08,len,steel,1.6*k,DECK+1.32,z0+len/2); }
  const back=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.3),meshM); back.position.set(0,DECK+.65,z0); T.add(back); box(3.2,.08,.08,steel,0,DECK+1.32,z0);
  for(const [px,pz] of [[-1.6,z0],[1.6,z0],[-1.6,z0+len],[1.6,z0+len]]) box(.1,1.35,.1,steel,px,DECK+.67,pz);
  // the gun mount: pedestal + swivel + twin barrels + seat handles
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.6,.75,.35,20),steel); ped.position.set(0,DECK+.17,z0+1.8); T.add(ped);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.9,12),steel); post.position.set(0,DECK+.75,z0+1.8); T.add(post);
  const gun=new THREE.Group(); gun.position.set(0,DECK+1.25,z0+1.8); gun.rotation.y=Math.PI; gun.rotation.x=-.08; T.add(gun);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.6,.45,.8),std(0x2a2c32,{metalness:.6,roughness:.45})); gun.add(body); T.userData.gun=gun;
  const shield=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.7,16,1,true,-.8,1.6),std(0x2a2c32,{metalness:.6,roughness:.5,side:THREE.DoubleSide})); shield.position.set(0,.05,.25); gun.add(shield);
  for(const k of [-1,1]){ const b=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.6,10),blk); b.rotation.x=Math.PI/2; b.position.set(.14*k,.05,1.15); gun.add(b); const m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,.16,10),brass); m.rotation.x=Math.PI/2; m.position.set(.14*k,.05,1.95); gun.add(m); }
  const belt=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.6),brass); belt.position.set(.38,-.05,0); gun.add(belt);
  for(const k of [-1,1]){ const h=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.35,8),blk); h.rotation.z=Math.PI/2; h.position.set(.32*k,0,-.5); gun.add(h); const g2=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.18,8),std(0x6a3a22)); g2.position.set(.5*k,0,-.5); g2.rotation.z=Math.PI/2; gun.add(g2); }
  const sight=new THREE.Mesh(new THREE.TorusGeometry(.08,.015,6,14),steel); sight.position.set(0,.32,.2); gun.add(sight);
  const ammo=box(.5,.35,.4,std(0x3a4a2a),1.1,DECK+.18,z0+3.2); const ammo2=box(.5,.35,.4,std(0x3a4a2a),1.1,DECK+.18,z0+3.7);
  const flood=new THREE.SpotLight(0xfff0d0,60,12,.7,.5,1.5); flood.position.set(1.3,DECK+2.6,z0+len); flood.target.position.set(0,DECK+1,z0+1.8); T.add(flood,flood.target); const fl2=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.2),new THREE.MeshBasicMaterial({color:0xfff2c8})); fl2.position.copy(flood.position); T.add(fl2); box(.06,1.4,.06,steel,1.3,DECK+1.95,z0+len);
  const warn=new THREE.PointLight(0xff3020,6,6,2); warn.position.set(-1.4,DECK+1.5,z0+.2); T.add(warn); const wb=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial({color:0xff3a2a})); wb.position.copy(warn.position); T.add(wb);
}

// ===================== DETAIL PASS =====================
const glass=new THREE.MeshStandardMaterial({color:0x8fb0c8,metalness:.2,roughness:.05,transparent:true,opacity:.22});
const dark=std(0x14161a,{metalness:.6,roughness:.4});
const tube=(pts,r,m,par)=>{ const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))); const o=new THREE.Mesh(new THREE.TubeGeometry(c,Math.max(8,pts.length*8),r,8),m); o.castShadow=true; (par||T).add(o); return o; };
const rivets=new THREE.InstancedMesh(new THREE.SphereGeometry(.028,6,4),dark,4000); rivets.count=0; T.add(rivets);
const rv=(x,y,z)=>{ if(rivets.count<4000) rivets.setMatrixAt(rivets.count++,new THREE.Matrix4().makeTranslation(x,y,z)); };
// --- walk-in cars: window frames + glass, rivet seams, trim, steps, grab rails, end lamps ---
for(const [z0,len] of [[4,4],[-2.2,5.8]]){
  const nWin=Math.max(1,Math.floor(len/2.2));
  for(const k of [-1,1]){
    for(let i=0;i<nWin;i++){ const zc=z0+(i+.5)*len/nWin, wl=len/nWin-.35;
      for(const y of [-.55,.55]) box(.07,.07,wl+.1,dark,1.61*k,DECK+1.57+y,zc); for(const dz of [-wl/2,wl/2]) box(.07,1.17,.07,dark,1.61*k,DECK+1.57,zc+dz);
      const gl=new THREE.Mesh(new THREE.PlaneGeometry(wl,1.05),glass); gl.rotation.y=Math.PI/2; gl.position.set(1.55*k,DECK+1.57,zc); T.add(gl);
      box(.14,.06,wl+.2,std(0x3a2a1c),1.65*k,DECK+1.02,zc); }   // window sill
    box(.05,.09,len+.05,dark,1.62*k,DECK+.35,z0+len/2);           // brass trim line
    box(.05,.09,len+.05,dark,1.62*k,DECK+2.12,z0+len/2);
    for(let z=z0+.12;z<z0+len;z+=.22){ rv(1.62*k,DECK+.12,z); rv(1.62*k,DECK+.98,z); rv(1.62*k,DECK+2.52,z); }
    for(let zz=z0;zz<=z0+len+.01;zz+=len/2) for(let y=DECK+.1;y<DECK+2.5;y+=.2) rv(1.62*k,y,zz);
    // steps + grab rail at each door end
    for(const zz of [z0+.25,z0+len-.25]){ box(.5,.06,.4,tread,1.85*k,DECK-.55,zz); box(.5,.06,.4,tread,1.85*k,DECK-.1,zz); box(.04,.55,.04,steel,2.08*k,DECK-.32,zz);
      tube([[1.68*k,DECK+.3,zz],[1.75*k,DECK+.35,zz],[1.75*k,DECK+1.9,zz],[1.68*k,DECK+1.95,zz]],.03,steel); } }
  // ladder to the roof on the back end
  for(const k of [.75,1.3]) box(.05,2.6,.05,steel,k,DECK+1.3,z0-.08); for(let y=DECK+.25;y<DECK+2.6;y+=.3) box(.6,.04,.04,steel,1.02,y,z0-.08);
  // roof walkway + vent
  box(.7,.05,len-.3,plank,0,DECK+3.3,z0+len/2); const vent=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.35,10),dark); vent.position.set(.6,DECK+3.35,z0+len*.3); T.add(vent); const vc=new THREE.Mesh(new THREE.ConeGeometry(.3,.15,10),dark); vc.position.set(.6,DECK+3.58,z0+len*.3); T.add(vc);
  // underframe: brake cylinders, tank, truss rods
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1.2,14),dark); tank.rotation.x=Math.PI/2; tank.position.set(.6,DECK-.95,z0+len/2); T.add(tank);
  for(const k of [-1,1]) tube([[1.2*k,DECK-.8,z0+.3],[1.2*k,DECK-1.15,z0+len/2],[1.2*k,DECK-.8,z0+len-.3]],.025,steel);
}
// --- locomotive exterior: armoured yellow-and-black war engine ---
{ const P=panel, D=dark, horn=std(0xe8dcb4,{roughness:.6}), glow=new THREE.MeshBasicMaterial({color:0xfff6dc});
  const hz=new THREE.MeshStandardMaterial({map:hazTex,roughness:.6,metalness:.3});
  // angular armoured boiler hood (octagon, flat top kept low so the driver sees over it)
  const hoodG=new THREE.CylinderGeometry(.94,.98,5.6,8); hoodG.rotateY(Math.PI/8); hoodG.rotateX(Math.PI/2);
  const hood=new THREE.Mesh(hoodG,P); hood.position.set(0,1.84,10.9); hood.castShadow=hood.receiveShadow=true; T.add(hood);
  for(const z of [8.25,9.65,11.05,12.45,13.6]){ const bg=new THREE.CylinderGeometry(1.02,1.02,.14,8); bg.rotateY(Math.PI/8); bg.rotateX(Math.PI/2); const b=new THREE.Mesh(bg,D); b.position.set(0,1.84,z); T.add(b); }
  for(const k of [-1,1]){ for(const y of [1.5,2.18]){ box(.06,.08,5.6,D,.91*k,y,10.9); for(let z=8.3;z<13.6;z+=.32) rv(.95*k,y,z); }
    // raised armour plates on the hood flanks, angled like scales
    for(let i=0;i<4;i++){ const pl=box(.08,.45,1.15,P,.97*k,1.84,8.95+i*1.4); pl.rotation.z=.12*k; } }
  for(let z=8.3;z<13.6;z+=.32) rv(0,2.74,z);
  // front face, big headlight
  const fg=new THREE.CylinderGeometry(1.0,1.0,.2,8); fg.rotateY(Math.PI/8); fg.rotateX(Math.PI/2); const face=new THREE.Mesh(fg,D); face.position.set(0,1.84,13.75); T.add(face);
  const hl=new THREE.Mesh(new THREE.CylinderGeometry(.55,.5,.55,20),D); hl.rotation.x=Math.PI/2; hl.position.set(0,1.9,14.05); T.add(hl);
  const hr=new THREE.Mesh(new THREE.TorusGeometry(.5,.07,8,24),steel); hr.position.set(0,1.9,14.33); T.add(hr);
  const lens=new THREE.Mesh(new THREE.CircleGeometry(.45,24),glow); lens.position.set(0,1.9,14.33); T.add(lens);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(.95,24),new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:.18,depthWrite:false})); halo.position.set(0,1.9,14.36); T.add(halo);
  const head=new THREE.SpotLight(0xfff0c8,500,100,.38,.5,1.4); head.position.set(0,1.9,14.4); head.target.position.set(0,1,50); head.castShadow=true; T.add(head,head.target);
  // tall smokestack
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.36,.3,1.7,14),P); st.position.set(0,3.55,12.7); st.castShadow=true; T.add(st);
  const sb=new THREE.Mesh(new THREE.CylinderGeometry(.5,.55,.25,14),D); sb.position.set(0,2.76,12.7); T.add(sb);
  const sr=new THREE.Mesh(new THREE.CylinderGeometry(.46,.4,.3,14),D); sr.position.set(0,4.45,12.7); T.add(sr);
  for(const y of [3.2,3.9]){ const r=new THREE.Mesh(new THREE.TorusGeometry(.35,.04,6,16),D); r.rotation.x=Math.PI/2; r.position.set(0,y,12.7); T.add(r); }
  // two big curved horns on top of the hood
  const hornGeo=pts=>{ const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))), TS=18, RS=10, g=new THREE.TubeGeometry(c,TS,.26,RS,false), p=g.attributes.position, cp=new THREE.Vector3();
    for(let i=0;i<=TS;i++){ c.getPointAt(i/TS,cp); const s=Math.max(.04,1-i/TS*.96); for(let j=0;j<=RS;j++){ const n=i*(RS+1)+j; p.setXYZ(n,cp.x+(p.getX(n)-cp.x)*s,cp.y+(p.getY(n)-cp.y)*s,cp.z+(p.getZ(n)-cp.z)*s); } }
    g.computeVertexNormals(); return g; };
  for(const k of [-1,1]){ const h=new THREE.Mesh(hornGeo([[.56*k,2.65,11.9],[.8*k,3.1,11.75],[.95*k,3.6,11.35],[.92*k,3.95,10.75],[.78*k,4.05,10.25]]),horn); h.castShadow=true; T.add(h);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,.18,10),D); base.position.set(.56*k,2.72,11.9); T.add(base);
    for(let i=0;i<3;i++){ const ring=new THREE.Mesh(new THREE.TorusGeometry(.2-i*.03,.025,5,12),D); const c=[[.68*k,2.92,11.85],[.86*k,3.3,11.6],[.95*k,3.6,11.35]][i]; ring.position.set(...c); ring.lookAt(c[0]+.4*k,c[1]+.9,c[2]-.4); T.add(ring); } }
  // chassis: black frame, hazard-striped buffer beam, yellow spikes, big plough
  box(3.1,.4,6.6,D,0,1.0,10.9);
  box(3.0,.4,.35,hz,0,1.05,14.15);
  for(let i=0;i<7;i++){ const sp=new THREE.Mesh(new THREE.ConeGeometry(.14,.5,4),P); sp.rotation.x=Math.PI/2; sp.position.set(-1.29+i*.43,1.05,14.55); sp.castShadow=true; T.add(sp); }
  for(let i=-5;i<=5;i++){ const bar=box(.09,.09,1.45,D,i*.27,.62,14.65); bar.rotation.x=.62; bar.rotation.y=-i*.06; }
  box(3.1,.12,.12,D,0,.2,15.15); box(2.9,.1,.1,D,0,.85,14.3);
  for(const k of [-1,1]){
    // armour skirt over the wheels with side spikes
    box(.1,.55,5.6,P,1.55*k,1.45,10.85); box(.12,.08,5.6,D,1.56*k,1.18,10.85); box(.12,.08,5.6,D,1.56*k,1.72,10.85);
    for(let z=8.6;z<13.4;z+=.95){ const sp=new THREE.Mesh(new THREE.ConeGeometry(.15,.38,4),P); sp.rotation.z=-Math.PI/2*k; sp.position.set(1.78*k,1.45,z); sp.castShadow=true; T.add(sp); rv(1.61*k,1.62,z+.45); rv(1.61*k,1.28,z+.45); }
    // wheels: black with yellow rims, side rods, pistons
    for(const z of [9.0,10.6,12.2]){ const w=new THREE.Group(); w.position.set(1.28*k,.8,z); T.add(w);
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(.78,.78,.16,22),D); disc.rotation.z=Math.PI/2; w.add(disc);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.72,.06,6,26),P); rim.rotation.y=Math.PI/2; rim.position.x=.09*k; w.add(rim);
      for(let s=0;s<6;s++){ const spk=new THREE.Mesh(new THREE.BoxGeometry(.04,1.3,.07),steel); spk.rotation.x=s*Math.PI/6; spk.position.x=.09*k; w.add(spk); }
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.12,10),P); hub.rotation.z=Math.PI/2; hub.position.x=.14*k; w.add(hub); }
    box(.07,.13,3.6,steel,1.45*k,.62,10.6);
    const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,1.0,14),D); cyl.rotation.x=Math.PI/2; cyl.position.set(1.3*k,.95,13.55); T.add(cyl);
    for(const z of [13.1,14.0]){ const r=new THREE.Mesh(new THREE.TorusGeometry(.35,.04,6,16),P); r.position.set(1.3*k,.95,z); T.add(r); }
    // marker lamps beside the headlight
    const ml=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.2),D); ml.position.set(.95*k,1.5,14.0); T.add(ml);
    const mg=new THREE.Mesh(new THREE.PlaneGeometry(.14,.14),new THREE.MeshBasicMaterial({color:k<0?0xff3a2a:0xffd060})); mg.position.set(.95*k,1.5,14.11); T.add(mg);
    // grab rail along the hood
    tube([[.8*k,2.72,8.3],[.88*k,2.66,10],[.88*k,2.62,12.8],[.66*k,2.4,13.6]],.03,steel); }
  // cab exterior: black X-bracing on the yellow walls, dark roof lip, roof lamp
  for(const k of [-1,1]){ for(const zc of [5,7]){ for(const s of [-1,1]){ const xb=box(.06,.09,2.15,D,1.63*k,DECK+.53,zc); xb.rotation.x=s*Math.atan2(.9,2); } box(.06,1.0,.09,D,1.63*k,DECK+.53,zc+1); }
    box(.5,.08,4.6,D,1.75*k,DECK+2.7,6); }
  const rl=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.25),D); rl.position.set(0,DECK+3.0,7.85); T.add(rl);
  const rlg=new THREE.Mesh(new THREE.PlaneGeometry(.22,.12),glow); rlg.position.set(0,DECK+3.0,7.98); T.add(rlg);
}
// --- cab interior detail ---
{ const z0=4;
  tube([[-1.4,DECK+2.4,z0+.2],[-1.4,DECK+2.4,z0+3.7]],.05,brass); tube([[1.4,DECK+2.3,z0+.2],[1.4,DECK+2.3,z0+3.4],[1.1,DECK+1.9,z0+3.7]],.04,steel);
  for(const [x,y,c] of [[-.9,DECK+2.1,0xc01818],[.9,DECK+2.0,0x2b6fd6]]){ const v=new THREE.Mesh(new THREE.TorusGeometry(.14,.025,6,14),std(c,{metalness:.4})); v.position.set(x,y,z0+3.85); T.add(v); for(let i=0;i<3;i++){ const sp=new THREE.Mesh(new THREE.BoxGeometry(.26,.02,.02),v.material); sp.rotation.z=i*1.05; sp.position.copy(v.position); T.add(sp); } }
  const glassG=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.45,8),glass); glassG.position.set(-.3,DECK+2.05,z0+3.85); T.add(glassG); const water=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.25,8),std(0x3a7ac0)); water.position.set(-.3,DECK+1.95,z0+3.85); T.add(water);
  for(const k of [-1,1]) box(.05,.4,.4,brass,-.3+k*.0,DECK+2.05,z0+3.88).scale.set(1,.15,.15);
  // shovel leaning on the wall + coal bin
  const sh=new THREE.Group(); box(.04,1.1,.04,std(0x6a4a2a),0,0,0,sh); box(.26,.04,.3,steel,0,-.55,.08,sh); sh.position.set(1.3,DECK+.6,z0+.6); sh.rotation.z=.25; T.add(sh);
  box(.9,.4,.8,std(0x3a2a1c),-1.0,DECK+.2,z0+.6); for(let i=0;i<14;i++){ const c=new THREE.Mesh(new THREE.DodecahedronGeometry(.1+Math.random()*.06,0),std(0x141416,{metalness:.2,roughness:.5})); c.position.set(-1.0+(Math.random()-.5)*.7,DECK+.45+Math.random()*.1,z0+.6+(Math.random()-.5)*.6); T.add(c); }
  // wiring along the desk
  tube([[-1.2,DECK+.9,z0+3.9],[-.6,DECK+.6,z0+3.95],[0,DECK+.8,z0+3.95],[.8,DECK+.55,z0+3.95],[1.2,DECK+.9,z0+3.9]],.015,std(0x222222));
  // hanging lantern
  tube([[1.15,DECK+2.6,z0+1.5],[1.15,DECK+2.25,z0+1.5]],.01,dark); const lan=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.25,8),brass); lan.position.set(1.15,DECK+2.12,z0+1.5); T.add(lan); const lg=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0xffc870})); lg.position.copy(lan.position); T.add(lg);
}
// --- workshop interior detail ---
{ const z0=-2.2;
  tube([[-1.4,DECK+2.45,z0+.2],[-1.4,DECK+2.45,z0+5.6]],.04,steel); tube([[1.35,DECK+2.4,z0+.2],[1.35,DECK+2.4,z0+5.6]],.06,std(0x7a3e22,{metalness:.4}));
  for(let z=z0+.6;z<z0+5.6;z+=1.2){ box(.06,.12,.12,dark,-1.4,DECK+2.45,z); }
  // vice on the bench, gear and spring parts
  const vice=new THREE.Group(); box(.22,.14,.18,std(0x2b4a7a,{metalness:.5}),0,0,0,vice); box(.04,.04,.3,steel,0,.02,.22,vice); vice.position.set(-1.05,DECK+1.07,z0+2.0); T.add(vice);
  const gear=new THREE.Mesh(new THREE.TorusGeometry(.12,.04,6,12),steel); gear.rotation.x=Math.PI/2; gear.position.set(-.9,DECK+1.01,z0+3.85); T.add(gear);
  for(let i=0;i<8;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(.05,.03,.05),steel); const a=i/8*6.283; t.position.set(-.9+Math.cos(a)*.17,DECK+1.01,z0+3.85+Math.sin(a)*.17); T.add(t); }
  const lamp2=new THREE.Group(); box(.04,.45,.04,dark,0,.22,0,lamp2); const sh2=new THREE.Mesh(new THREE.ConeGeometry(.12,.14,10,1,true),std(0x2a5a3a,{side:THREE.DoubleSide})); sh2.position.set(.08,.45,0); sh2.rotation.z=-2.2; lamp2.add(sh2); lamp2.position.set(-1.25,DECK+1.0,z0+4.0); T.add(lamp2);
  // crates & barrel by the door
  box(.6,.5,.6,plank,1.05,DECK+.25,z0+5.1); box(.45,.4,.45,plank,1.1,DECK+.7,z0+5.1);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.75,14),std(0x7a3e22,{metalness:.4})); barrel.position.set(-1.15,DECK+.38,z0+5.1); T.add(barrel); for(const y of [.12,.62]){ const h=new THREE.Mesh(new THREE.TorusGeometry(.305,.02,4,16),dark); h.rotation.x=Math.PI/2; h.position.set(-1.15,DECK+y,z0+5.1); T.add(h); }
}
// --- gun deck detail: armored shield plates, spent shells, sandbags ---
{ const z0=-8+GUN_SHIFT;
  for(const k of [-1,1]){ const p=new THREE.Mesh(new RoundedBoxGeometry(.12,.7,1.0,2,.04),panel); p.position.set(1.62*k,DECK+.35,z0+.6); T.add(p); for(let i=0;i<4;i++) rv(1.69*k,DECK+.1+i*.17,z0+.15); }
  for(let i=0;i<12;i++){ const sh=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.1,6),brass); sh.position.set((Math.random()-.5)*1.4,DECK+.03,z0+1.8+(Math.random()-.5)*1.4); sh.rotation.set(Math.PI/2,Math.random()*6,0); T.add(sh); }
  for(let i=0;i<5;i++){ const sb=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.35,4,8),std(0x8a7a5a)); sb.rotation.z=Math.PI/2; sb.position.set(-1.1+(i%3)*.5,DECK+.15+(i>2?.26:0),z0+.35); T.add(sb); }
}
rivets.instanceMatrix.needsUpdate=true;

// couplers between cars
for(const z of [3.8,-2.3,-8.3,-14.3]) box(.3,.25,.5,steel,0,DECK-.4,z);
// ================= MATERIAL CAR (rails + sleepers) and CARGO CAR (crates) =================
function flatcar(z0,len,col){ box(3.3,.3,len,tread,0,DECK-.15,z0+len/2); box(3.4,.5,len,hazM,0,DECK-.55,z0+len/2);
  for(const zz of [z0+.9,z0+len-.9]) for(const k of [-1,1]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.18,16),blk); w.rotation.z=Math.PI/2; w.position.set(1.02*k,.55,zz); T.add(w); }
  for(const k of [-1,1]){ for(let z=z0+.3;z<z0+len;z+=1.1) box(.08,.9,.08,steel,1.55*k,DECK+.45,z); box(.06,.06,len,brass,1.55*k,DECK+.9,z0+len/2); }
  const sign=box(1.4,.35,.06,col,0,DECK+.55,z0+len-.05); return sign; }
{ const z0=-8.2, len=5.8; flatcar(z0,len,std(0xc9a24a));
  const railM=std(0xb8bec8,{metalness:.85,roughness:.3}), slM=std(0x5a3d26);
  T.userData.railStack=[]; for(let i=0;i<6;i++){ const g=new THREE.Group(); for(const k of [-.25,.25]){ const r=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,4.6),railM); r.position.set(k,0,0); g.add(r); } g.position.set(-.75+(i%2)*.0,DECK+.1+Math.floor(i/2)*.16,z0+len/2); g.position.x=-.8+(i%2)*.55; T.add(g); T.userData.railStack.push(g); }
  for(let i=0;i<8;i++){ const sl=new THREE.Mesh(new THREE.BoxGeometry(1.1,.18,.32),slM); sl.position.set(.85,DECK+.1+Math.floor(i/2)*.2,z0+1.2+(i%2)*.5); sl.rotation.y=Math.PI/2; T.add(sl); } }
{ const z0=-14.2, len=5.8; flatcar(z0,len,std(0x4ab0e8));
  T.userData.cargo=[]; const cm=[std(0x6a4a2a),std(0x5a6a3a),std(0x7a3a2a)];
  for(let i=0;i<4;i++){ const c=box(.9,.8,.9,cm[i%3],(i%2?.7:-.7),DECK+.4,z0+1.4+Math.floor(i/2)*2.6); c.visible=false; T.userData.cargo.push(c); }
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),new THREE.MeshBasicMaterial({color:0xffc870})); lamp.position.set(1.55,DECK+1.1,z0+len/2); T.add(lamp); }
// missile launcher on the cab roof (hidden until built)
{ const g=new THREE.Group(); g.position.set(0,DECK+3.35,6.2); const base=box(.8,.25,.8,blk,0,0,0,g); for(const k of [-1,1]){ const tube=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,1.4,10),std(0x2a2c32,{metalness:.6})); tube.rotation.x=Math.PI/2-.3; tube.position.set(.22*k,.35,0); g.add(tube); const tip=new THREE.Mesh(new THREE.ConeGeometry(.15,.3,10),std(0xc02020)); tip.rotation.x=-.3-Math.PI/2; tip.position.set(.22*k,.15,-.7); g.add(tip); } g.visible=false; T.add(g); T.userData.launcher=g; }
rivets.instanceMatrix.needsUpdate=true;
T.traverse(o=>{ if(o.isLight&&o.castShadow&&!o.isSpotLight) o.castShadow=false; });
return T; }
