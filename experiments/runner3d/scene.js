// Kwizillo Runner — the 3D view (Three.js). The engine (engine.js) stays the
// authority on lanes, items, coins and rewards; this file only turns a run
// state into a picture: a curved, hilly track that streams towards the camera,
// instanced low-poly scenery per level, a procedural boy or girl who runs,
// flips and glides, coins that spin and sparkle, and a camera that lags,
// banks and bobs. Everything is built in code — no model files are needed.
import * as THREE from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {height} from './engine.js';

export const LEVELS=['jungle','stad','lucht'];
const LANE=1.5, TRACK=24, LOOP=192, UNITS_PER_SECOND=.31*TRACK;
const worldOf=s=>s.distance*TRACK;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// ---------- procedural textures ----------
function canvasTexture(size,draw,repeat=[1,1]){const c=document.createElement('canvas');c.width=size;c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function seeded(seed){let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function speckle(g,S,rnd,colors,count,rmin,rmax,alpha=.5){for(let i=0;i<count;i++){g.fillStyle=colors[i%colors.length];g.globalAlpha=alpha;const r=rmin+rnd()*rnd()*(rmax-rmin);g.beginPath();g.ellipse(rnd()*S,rnd()*S,r,r*(.5+rnd()*.5),rnd()*3.2,0,7);g.fill();}g.globalAlpha=1;}
const TEX={
 grass:()=>canvasTexture(512,(g,S)=>{const rnd=seeded(11);g.fillStyle='#4f8d36';g.fillRect(0,0,S,S);speckle(g,S,rnd,['#3f7a2c','#5c9f3f','#72b64d','#3a6f27','#86c95a','#a5da6b'],900,3,28);g.lineCap='round';for(let i=0;i<2200;i++){const x=rnd()*S,y=rnd()*S,l=2+rnd()*5,a=rnd()*6.3;g.strokeStyle=['#6ab34c','#93d662','#437f30','#b0e474','#2f6a22'][i%5];g.lineWidth=1.5+rnd()*2;g.globalAlpha=.9;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}g.globalAlpha=1;},[70,76]),
 dirt:()=>canvasTexture(512,(g,S)=>{const rnd=seeded(5);g.fillStyle='#c9a06a';g.fillRect(0,0,S,S);speckle(g,S,rnd,['#b98d58','#d4ad78','#a97e4c','#dcb886','#c39562'],1400,2,22,.45);speckle(g,S,rnd,['#8d6a3f','#e2c493','#7c5a33'],260,1,4,.8);const e=g.createLinearGradient(0,0,S,0);e.addColorStop(0,'#4a3a2088');e.addColorStop(.12,'#4a3a2000');e.addColorStop(.88,'#4a3a2000');e.addColorStop(1,'#4a3a2088');g.fillStyle=e;g.fillRect(0,0,S,S);},[1,52]),
 asphalt:()=>canvasTexture(512,(g,S)=>{const rnd=seeded(9);g.fillStyle='#4c505a';g.fillRect(0,0,S,S);speckle(g,S,rnd,['#42464f','#565a64','#3c4048','#61656f'],1600,1,8,.5);g.fillStyle='#e9e4c8';g.fillRect(S*.155,0,S*.03,S);g.fillRect(S*.815,0,S*.03,S);g.fillStyle='#f4e7a0';for(let y=0;y<S;y+=S/4)g.fillRect(S*.485,y,S*.03,S/8);const e=g.createLinearGradient(0,0,S,0);e.addColorStop(0,'#00000088');e.addColorStop(.08,'#00000000');e.addColorStop(.92,'#00000000');e.addColorStop(1,'#00000088');g.fillStyle=e;g.fillRect(0,0,S,S);},[1,52]),
 pavement:()=>canvasTexture(512,(g,S)=>{const rnd=seeded(3);g.fillStyle='#b9b4a8';g.fillRect(0,0,S,S);speckle(g,S,rnd,['#aaa598','#c5c0b3','#9d9889'],700,1,10,.5);g.strokeStyle='#8d887c';g.lineWidth=3;for(let i=0;i<=8;i++){g.beginPath();g.moveTo(0,i*S/8);g.lineTo(S,i*S/8);g.stroke();g.beginPath();g.moveTo(i*S/8,0);g.lineTo(i*S/8,S);g.stroke();}},[40,44]),
 cloud:()=>canvasTexture(512,(g,S)=>{const rnd=seeded(21);g.fillStyle='#eef6ff';g.fillRect(0,0,S,S);speckle(g,S,rnd,['#ffffff','#dfeeff','#f7fbff','#cfe3fb'],700,6,40,.6);const e=g.createLinearGradient(0,0,S,0);e.addColorStop(0,'#7fb0e055');e.addColorStop(.15,'#7fb0e000');e.addColorStop(.85,'#7fb0e000');e.addColorStop(1,'#7fb0e055');g.fillStyle=e;g.fillRect(0,0,S,S);},[1,40]),
 sky:()=>canvasTexture(256,(g,S)=>{const rnd=seeded(31);g.fillStyle='#8fc8f0';g.fillRect(0,0,S,S);speckle(g,S,rnd,['#a6d6f7','#7bbde8','#b9e0fa'],300,8,60,.35);},[30,30]),
 windows:()=>canvasTexture(256,(g,S)=>{const rnd=seeded(17);g.fillStyle='#5f6f88';g.fillRect(0,0,S,S);for(let y=0;y<8;y++)for(let x=0;x<6;x++){const lit=rnd()>.45;g.fillStyle=lit?['#ffe9a3','#fff4c8','#ffd77a'][(x+y)%3]:'#2d3a50';g.fillRect(x*S/6+6,y*S/8+6,S/6-12,S/8-14);}},[1,1]),
};

// ---------- curved world ----------
// Every material that lives in the world bends away from the camera: the track
// curves left and right and rolls over hills. It is a vertex trick (the engine
// stays straight), so one pair of uniforms drives the whole scene.
function bend(material,u){material.onBeforeCompile=shader=>{shader.uniforms.uCurve=u.curve;shader.uniforms.uHill=u.hill;shader.vertexShader='uniform float uCurve;uniform float uHill;\n'+shader.vertexShader.replace('#include <project_vertex>',`
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
 mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
 mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
float kz = max(0.0, -mvPosition.z - 5.0);
mvPosition.x += uCurve * kz * kz;
mvPosition.y += uHill * kz * kz;
gl_Position = projectionMatrix * mvPosition;`);};material.customProgramCacheKey=()=>'kwizillo-bend';return material;}

// ---------- low-poly builders (merged geometries with vertex colours) ----------
function colored(geometry,hex){const c=new THREE.Color(hex);const n=geometry.attributes.position.count;const arr=new Float32Array(n*3);for(let i=0;i<n;i++){arr[i*3]=c.r;arr[i*3+1]=c.g;arr[i*3+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(arr,3));return geometry;}
function part(geometry,hex,{x=0,y=0,z=0,rx=0,ry=0,rz=0,s=1}={}){const g=geometry.index?geometry.toNonIndexed():geometry;g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);if(s!==1)g.scale(s,s,s);g.translate(x,y,z);return colored(g,hex);}
const merge=parts=>{const g=mergeGeometries(parts.map(p=>p.index?p.toNonIndexed():p),false);g.computeVertexNormals();return g;};

const BUILD={
 tree:()=>merge([part(new THREE.CylinderGeometry(.16,.3,2.4,6),'#7a4f2a',{y:1.2}),part(new THREE.IcosahedronGeometry(1.35,1),'#3f9a3c',{y:3.1}),part(new THREE.IcosahedronGeometry(.95,1),'#58b84a',{x:.7,y:2.6,z:.3}),part(new THREE.IcosahedronGeometry(.85,1),'#347f31',{x:-.75,y:2.75,z:-.2})]),
 palm:()=>{const parts=[];for(let i=0;i<5;i++)parts.push(part(new THREE.CylinderGeometry(.13+i*.02,.17+i*.02,.9,6),'#9a6a3a',{x:i*.12,y:.45+i*.85,rz:-.08}));for(let i=0;i<7;i++){const a=i/7*Math.PI*2;parts.push(part(new THREE.BoxGeometry(2.4,.06,.5),'#4fb04a',{x:.6+Math.cos(a)*1.0,y:4.5-Math.abs(Math.sin(a))*.2,z:Math.sin(a)*1.0,ry:-a,rz:.35}));}parts.push(part(new THREE.SphereGeometry(.28,6,5),'#8a5a2a',{x:.6,y:4.35}));return merge(parts);},
 fern:()=>{const parts=[];for(let i=0;i<7;i++){const a=i/7*Math.PI*2;parts.push(part(new THREE.ConeGeometry(.22,1.3,4),['#3e9a3a','#57b649','#2f7d2d'][i%3],{x:Math.cos(a)*.35,y:.55,z:Math.sin(a)*.35,rx:Math.PI*.42,ry:-a+Math.PI/2}));}return merge(parts);},
 bush:()=>merge([part(new THREE.IcosahedronGeometry(.7,1),'#3c8f39',{y:.55}),part(new THREE.IcosahedronGeometry(.5,1),'#55ad48',{x:.5,y:.45,z:.2}),part(new THREE.IcosahedronGeometry(.45,1),'#2f7a2e',{x:-.45,y:.4,z:-.1})]),
 rock:()=>merge([part(new THREE.DodecahedronGeometry(.7,0),'#8f8a80',{y:.45,s:1}),part(new THREE.DodecahedronGeometry(.45,0),'#a7a297',{x:.55,y:.3,z:.2})]),
 flower:()=>merge([part(new THREE.CylinderGeometry(.03,.03,.5,4),'#4a9a3a',{y:.25}),part(new THREE.SphereGeometry(.14,6,5),'#ff5f8a',{y:.55})]),
 building:()=>{const parts=[part(new THREE.BoxGeometry(4,12,4),'#8d9bb4',{y:6}),part(new THREE.BoxGeometry(4.3,.5,4.3),'#4a5670',{y:12.2}),part(new THREE.BoxGeometry(1.2,1.4,1.2),'#5c6a86',{x:1,y:13.1,z:-.8})];
  for(let r=0;r<6;r++)for(let c=0;c<3;c++){const y=1.4+r*1.8,x=(c-1)*1.2,lit=(r*3+c)%5!==1;const col=lit?'#ffe9a3':'#2d3a50';
   parts.push(part(new THREE.BoxGeometry(.7,.9,.08),col,{x,y,z:2.02}),part(new THREE.BoxGeometry(.7,.9,.08),col,{x,y,z:-2.02}),part(new THREE.BoxGeometry(.08,.9,.7),col,{x:2.02,y,z:x}),part(new THREE.BoxGeometry(.08,.9,.7),col,{x:-2.02,y,z:x}));}
  return merge(parts);},
 lamp:()=>merge([part(new THREE.CylinderGeometry(.07,.1,4.2,6),'#3a3f4a',{y:2.1}),part(new THREE.BoxGeometry(.9,.12,.12),'#3a3f4a',{x:.4,y:4.2}),part(new THREE.SphereGeometry(.2,8,6),'#fff1a8',{x:.8,y:4.1})]),
 car:()=>merge([part(new THREE.BoxGeometry(1.7,.6,3.4),'#e34a4a',{y:.55}),part(new THREE.BoxGeometry(1.5,.55,1.8),'#f0f4ff',{y:1.1,z:-.1}),...[[-.8,1],[.8,1],[-.8,-1],[.8,-1]].map(([x,z])=>part(new THREE.CylinderGeometry(.3,.3,.25,10),'#222',{x,y:.3,z,rz:Math.PI/2}))]),
 cone:()=>merge([part(new THREE.ConeGeometry(.42,1.1,8),'#ff7a1a',{y:.55}),part(new THREE.CylinderGeometry(.34,.36,.14,8),'#ffffff',{y:.55}),part(new THREE.BoxGeometry(1,.1,1),'#ff7a1a',{y:.05})]),
 barrier:()=>merge([part(new THREE.BoxGeometry(1.6,.36,.18),'#e8453c',{y:.75}),part(new THREE.BoxGeometry(.5,.36,.19),'#ffffff',{x:-.35,y:.75}),part(new THREE.BoxGeometry(.5,.36,.19),'#ffffff',{x:.55,y:.75}),part(new THREE.BoxGeometry(.12,.75,.5),'#555a66',{x:-.65,y:.37}),part(new THREE.BoxGeometry(.12,.75,.5),'#555a66',{x:.65,y:.37})]),
 log:()=>merge([part(new THREE.CylinderGeometry(.36,.36,1.7,10),'#7a4a24',{y:.36,rz:Math.PI/2}),part(new THREE.CylinderGeometry(.37,.37,.08,10),'#c99a62',{x:.85,y:.36,rz:Math.PI/2}),part(new THREE.CylinderGeometry(.37,.37,.08,10),'#c99a62',{x:-.85,y:.36,rz:Math.PI/2})]),
 boulder:()=>merge([part(new THREE.DodecahedronGeometry(.62,0),'#85817a',{y:.5}),part(new THREE.DodecahedronGeometry(.36,0),'#9b978f',{x:.4,y:.35,z:.25})]),
 cloudPuff:()=>merge([part(new THREE.IcosahedronGeometry(1.1,1),'#ffffff',{y:0}),part(new THREE.IcosahedronGeometry(.8,1),'#f4f9ff',{x:1,y:-.1,z:.2}),part(new THREE.IcosahedronGeometry(.7,1),'#f0f6ff',{x:-.95,y:-.15,z:-.1}),part(new THREE.IcosahedronGeometry(.6,1),'#ffffff',{x:.2,y:.5,z:-.3})]),
 storm:()=>merge([part(new THREE.IcosahedronGeometry(.75,1),'#5b6478',{y:.9}),part(new THREE.IcosahedronGeometry(.55,1),'#6d768a',{x:.65,y:.8}),part(new THREE.IcosahedronGeometry(.5,1),'#4d5568',{x:-.6,y:.85}),part(new THREE.ConeGeometry(.16,.7,3),'#ffe45a',{y:.25,rx:Math.PI})]),
 island:()=>merge([part(new THREE.ConeGeometry(3.2,4,7),'#8a6a48',{y:-2,rx:Math.PI}),part(new THREE.CylinderGeometry(3.2,3.2,.5,7),'#57b04a',{y:.25}),part(new THREE.IcosahedronGeometry(1,1),'#3f9a3c',{x:.8,y:1.2}),part(new THREE.CylinderGeometry(.12,.18,1.4,5),'#7a4f2a',{x:.8,y:.6})]),
 balloon:()=>merge([part(new THREE.SphereGeometry(1.2,10,8),'#ff5a7a',{y:2.6}),part(new THREE.SphereGeometry(1.21,10,8),'#ffd85a',{y:2.6,s:1}).scale(1,1,.55),part(new THREE.BoxGeometry(.7,.5,.7),'#8a5a2a',{y:.6})]),
 bird:()=>merge([part(new THREE.SphereGeometry(.28,8,6),'#ffffff',{y:1.3}).scale(1,.8,1.5),part(new THREE.ConeGeometry(.08,.3,4),'#ffb347',{y:1.3,z:.5,rx:Math.PI/2}),part(new THREE.BoxGeometry(1.2,.04,.4),'#e9edf5',{y:1.36})]),
 mountain:()=>merge([part(new THREE.ConeGeometry(9,14,6),'#7a8aa8',{y:7}),part(new THREE.ConeGeometry(4.2,5.5,6),'#ffffff',{y:11.3})]),
};

// Level recipes: what stands beside the track, what the ground looks like, the
// colours of sky and fog, and which prop plays the two obstacle kinds.
const LEVEL={
 jungle:{sky:['#8fd4ff','#dff6ff'],fog:'#c7ecdc',hemi:['#cfefff','#3d6a2e'],sun:['#fff3d0',1.7],ground:'grass',path:'dirt',obstacles:{log:'log',rock:'boulder'},
  props:[{kind:'tree',n:34,x:[3.8,9],s:[.8,1.5]},{kind:'palm',n:16,x:[3.4,7],s:[.7,1.2]},{kind:'fern',n:44,x:[2.9,5],s:[.7,1.3]},{kind:'bush',n:30,x:[3,6],s:[.7,1.4]},{kind:'rock',n:14,x:[3.2,6],s:[.5,1.1]},{kind:'flower',n:70,x:[2.9,4.5],s:[.8,1.4]},{kind:'tree',n:26,x:[9,22],s:[1.2,2.2]}],backdrop:'jungle'},
 stad:{sky:['#5ea9e8','#ffd9a8'],fog:'#c9d8e8',hemi:['#e8f1ff','#5a5f6a'],sun:['#ffe9c8',1.5],ground:'pavement',path:'asphalt',obstacles:{log:'barrier',rock:'cone'},
  props:[{kind:'building',n:28,x:[6.5,9.5],s:[.7,1.6],yaw:0},{kind:'building',n:22,x:[12,20],s:[1,2.4],yaw:0},{kind:'lamp',n:24,x:[3.3,3.3],s:[1,1]},{kind:'car',n:10,x:[4.4,4.6],s:[1,1],yaw:0},{kind:'tree',n:14,x:[4.6,5.4],s:[.6,.9]},{kind:'bush',n:20,x:[3.4,4.4],s:[.6,1]}],backdrop:null},
 lucht:{sky:['#3f86dc','#f3d3e9'],fog:'#c9d9f2',hemi:['#ffffff','#7aa7e0'],sun:['#fff6dc',1.9],ground:'sky',path:'cloud',obstacles:{log:'bird',rock:'storm'},
  props:[{kind:'cloudPuff',n:40,x:[3.2,9],s:[.6,1.6],y:[-1.5,1.5]},{kind:'cloudPuff',n:26,x:[0,7],s:[1.2,2.6],y:[-9,-4]},{kind:'cloudPuff',n:30,x:[9,30],s:[1.5,4],y:[-8,-2]},{kind:'island',n:8,x:[8,20],s:[.8,1.6],y:[-6,-1]},{kind:'balloon',n:8,x:[6,16],s:[.9,1.8],y:[2,8]},{kind:'bird',n:10,x:[4,12],s:[.8,1.3],y:[2,5]},{kind:'mountain',n:10,x:[24,50],s:[1,2.4],y:[-14,-10]}],backdrop:null,glide:true},
};
// Where the sky level lets go of the cloud path and hands the child a glider.
export const GLIDE_WINDOWS=[[.22,.46],[.66,.88]];
export const progress=s=>s.distance/(s.duration*(s.easy?.26:.31));
export const isGliding=(level,s)=>level==='lucht'&&GLIDE_WINDOWS.some(([a,b])=>progress(s)>=a&&progress(s)<b);

// ---------- the hero: a procedural kid, boy or girl ----------
function hero(kind){
 const skin='#f3c9a4',mat=hex=>new THREE.MeshStandardMaterial({color:hex,roughness:.85,metalness:0,flatShading:false});
 const g=new THREE.Group();g.name='hero';
 const add=(parent,geo,hex,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat(hex));m.position.set(x,y,z);parent.add(m);return m;};
 const boy=kind==='boy';
 const body=new THREE.Group();g.add(body);g.userData.body=body;
 add(body,new THREE.CapsuleGeometry(.24,.34,4,10),boy?'#3d9a4c':'#e8579b',0,.96,0).scale.set(1.15,1,.85);
 if(!boy)add(body,new THREE.ConeGeometry(.42,.34,12,1,true),'#7a4fd8',0,.62,0);
 else add(body,new THREE.CylinderGeometry(.27,.29,.3,10),'#c8b48c',0,.66,0);
 add(body,new THREE.BoxGeometry(.4,.42,.22),boy?'#a67c52':'#ff9ad0',0,.98,.28);
 const head=add(body,new THREE.SphereGeometry(.31,16,12),skin,0,1.44,0);
 const hair=add(body,new THREE.SphereGeometry(.335,16,12),boy?'#5a3a1e':'#c96a2b',0,1.5,-.02);hair.scale.set(1,.72,1);
 if(!boy){add(body,new THREE.CapsuleGeometry(.09,.5,4,8),'#c96a2b',0,1.3,.34).rotation.x=-.5;add(body,new THREE.SphereGeometry(.09,8,6),'#ffd84d',0,1.56,.3);}
 add(body,new THREE.SphereGeometry(.045,8,6),'#1b2436',-.11,1.46,-.28);add(body,new THREE.SphereGeometry(.045,8,6),'#1b2436',.11,1.46,-.28);
 const limb=(x,y,len,r,hex,tipHex)=>{const pivot=new THREE.Group();pivot.position.set(x,y,0);body.add(pivot);add(pivot,new THREE.CapsuleGeometry(r,len,4,8),hex,0,-len/2-r*.5,0);add(pivot,new THREE.SphereGeometry(r*1.15,8,6),tipHex,0,-len-r,0);return pivot;};
 g.userData.arms=[limb(-.36,1.12,.4,.075,boy?'#3d9a4c':'#e8579b',skin),limb(.36,1.12,.4,.075,boy?'#3d9a4c':'#e8579b',skin)];
 g.userData.legs=[limb(-.13,.6,.46,.09,skin,'#5a3a1e'),limb(.13,.6,.46,.09,skin,'#5a3a1e')];
 // hang glider, shown only while gliding
 const wing=new THREE.Group();wing.position.y=1.9;const wm=mat('#ff6b8a');
 const sail=new THREE.Mesh(new THREE.ConeGeometry(1.35,1.2,3,1),new THREE.MeshStandardMaterial({color:'#ff6b8a',roughness:.7,side:THREE.DoubleSide}));sail.rotation.y=Math.PI;sail.scale.set(1.15,.05,1.35);sail.position.z=-.25;wing.add(sail);
 const stripe=sail.clone();stripe.material=new THREE.MeshStandardMaterial({color:'#ffd84d',roughness:.7,side:THREE.DoubleSide});stripe.scale.set(.55,.06,1.35);stripe.position.y=.01;wing.add(stripe);
 const bar=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.1,6),mat('#556'));bar.rotation.z=Math.PI/2;bar.position.y=-.5;wing.add(bar);
 for(const x of[-.5,.5]){const strut=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.6,5),wm);strut.position.set(x,-.22,0);wing.add(strut);}
 wing.visible=false;g.add(wing);g.userData.wing=wing;
 g.traverse(o=>{if(o.isMesh)o.castShadow=false;});
 return g;
}

// ---------- the scene ----------
export class RunnerScene{
 constructor(canvas,{level='jungle',hero:kind='boy',reduced=false,images={}}={}){
  this.canvas=canvas;this.reduced=reduced;this.images=images;this.level=LEVELS.includes(level)?level:'jungle';this.kind=kind;
  const r=this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(58,1,.1,320);
  this.u={curve:{value:0},hill:{value:0}};this.curveTarget=0;this.hillTarget=0;this.nextBendAt=0;
  this.time=0;this.cam={x:0,y:3.2,z:5.6};
  this.sparks=[];this.tmp=new THREE.Object3D();
  this.build();this.resize();
 }
 mat(opts){return bend(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,metalness:0,flatShading:true,...opts}),this.u);}
 build(){
  const L=LEVEL[this.level],S=this.scene;
  S.background=new THREE.Color(L.sky[0]);S.fog=new THREE.Fog(L.fog,26,150);
  // sky dome (not bent, follows the camera), sun sprite
  const dome=new THREE.Mesh(new THREE.SphereGeometry(280,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(L.sky[0])},bottom:{value:new THREE.Color(L.sky[1])}},vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying float h;void main(){float t=smoothstep(-0.05,0.55,h);gl_FragColor=vec4(mix(bottom,top,t),1.0);}'}));
  dome.renderOrder=-10;S.add(dome);this.dome=dome;
  const sunTex=canvasTexture(128,(g,s)=>{const r=g.createRadialGradient(s/2,s/2,2,s/2,s/2,s/2);r.addColorStop(0,'#ffffff');r.addColorStop(.25,'#fff6c8cc');r.addColorStop(1,'#fff6c800');g.fillStyle=r;g.fillRect(0,0,s,s);});
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));sun.scale.set(70,70,1);sun.position.set(60,70,-220);S.add(sun);
  S.add(new THREE.HemisphereLight(L.hemi[0],L.hemi[1],1.15));
  const dir=new THREE.DirectionalLight(L.sun[0],L.sun[1]);dir.position.set(6,12,5);S.add(dir);
  // the far illustration behind the jungle (the waterfalls), never bent, never fogged
  if(L.backdrop&&this.images[L.backdrop]){const im=this.images[L.backdrop];const t=new THREE.Texture(im);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;t.repeat.set(1,.34);t.offset.set(0,.66);
   const w=230,h=w*(im.height*.34)/im.width;const bp=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,fog:false}));bp.position.set(0,h*.5-14,-215);S.add(bp);this.backdrop=bp;}
  // ground: a wide floor and the path on top of it, both scrolling textures
  this.tex={ground:TEX[L.ground](),path:TEX[L.path]()};
  // the ground planes are tessellated along the track so the bend (a per-vertex trick) stays smooth
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(240,260,6,96),bend(new THREE.MeshLambertMaterial({map:this.tex.ground}),this.u));floor.rotation.x=-Math.PI/2;floor.position.set(0,0,-100);S.add(floor);this.floor=floor;
  const pathW=LANE*3+.9;
  if(L.glide){
   // the sky path is made of cloud slabs that can be missing (the glide stretches)
   this.slabs=[];const geo=new THREE.PlaneGeometry(pathW,TRACK,1,8);geo.rotateX(-Math.PI/2);
   for(let i=0;i<12;i++){const m=new THREE.Mesh(geo,bend(new THREE.MeshLambertMaterial({map:this.tex.path}),this.u));S.add(m);this.slabs.push(m);}
   floor.visible=false;
  }else{
   const path=new THREE.Mesh(new THREE.PlaneGeometry(pathW,260,1,96),bend(new THREE.MeshLambertMaterial({map:this.tex.path}),this.u));path.rotation.x=-Math.PI/2;path.position.set(0,.02,-100);S.add(path);this.path=path;
  }
  // scenery: instanced props at fixed places along a loop of the track
  this.props=[];const rnd=seeded(this.level==='jungle'?4:this.level==='stad'?8:15);
  for(const spec of L.props){
   const mesh=new THREE.InstancedMesh(BUILD[spec.kind](),this.mat({}),spec.n);mesh.frustumCulled=false;S.add(mesh);
   if(spec.kind==='building'){const tints=['#ffffff','#f7e3d2','#d9e6ff','#ffe9c9','#e2f2e4','#f2d9e8'];for(let i=0;i<spec.n;i++)mesh.setColorAt(i,new THREE.Color(tints[i%tints.length]));mesh.instanceColor.needsUpdate=true;}
   const places=[];for(let i=0;i<spec.n;i++){const side=i%2?1:-1;places.push({w:rnd()*LOOP,x:side*lerp(spec.x[0],spec.x[1],rnd()),y:spec.y?lerp(spec.y[0],spec.y[1],rnd()):0,s:lerp(spec.s[0],spec.s[1],rnd()),yaw:spec.yaw??rnd()*6.28,bob:rnd()*6.28});}
   this.props.push({mesh,places,kind:spec.kind,floats:!!spec.y});
  }
  // items: one instanced mesh per kind, filled every frame from the run state
  const items={
   coin:new THREE.InstancedMesh(part(new THREE.CylinderGeometry(.42,.42,.1,18),'#ffd23f',{rx:Math.PI/2}),bend(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.55,emissive:'#7a5200',emissiveIntensity:.35}),this.u),40),
   gold:new THREE.InstancedMesh(part(new THREE.OctahedronGeometry(.5,0),'#ffc21a'),bend(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.25,metalness:.7,emissive:'#8a5a00',emissiveIntensity:.5}),this.u),8),
   magnet:new THREE.InstancedMesh(merge([part(new THREE.TorusGeometry(.32,.11,8,14,Math.PI),'#ff3b5c',{rx:Math.PI}),part(new THREE.BoxGeometry(.22,.22,.22),'#e8ecf5',{x:-.32,y:.05}),part(new THREE.BoxGeometry(.22,.22,.22),'#e8ecf5',{x:.32,y:.05})]),this.mat({emissive:'#5a0010',emissiveIntensity:.3}),4),
   shield:new THREE.InstancedMesh(part(new THREE.IcosahedronGeometry(.45,1),'#7fe6ff'),bend(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.2,metalness:.2,transparent:true,opacity:.8,emissive:'#0a5f7a',emissiveIntensity:.6}),this.u),4),
   double:new THREE.InstancedMesh(part(new THREE.OctahedronGeometry(.5,0),'#fff35a').scale(1,1.4,.35),bend(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.3,emissive:'#7a6a00',emissiveIntensity:.7}),this.u),4),
   card:new THREE.InstancedMesh(merge([part(new THREE.BoxGeometry(.6,.85,.06),'#7a3fd8'),part(new THREE.BoxGeometry(.48,.7,.07),'#a77bff'),part(new THREE.SphereGeometry(.14,8,6),'#ffe45a')]),this.mat({emissive:'#2a0a5a',emissiveIntensity:.5}),4),
   log:new THREE.InstancedMesh(BUILD[L.obstacles.log](),this.mat({}),8),
   rock:new THREE.InstancedMesh(BUILD[L.obstacles.rock](),this.mat({}),8),
  };
  for(const m of Object.values(items)){m.frustumCulled=false;m.count=0;S.add(m);}this.items=items;
  // hero, blob shadow, sparkles
  this.setHero(this.kind);
  const shadowTex=canvasTexture(128,(g,s)=>{const r=g.createRadialGradient(s/2,s/2,2,s/2,s/2,s/2);r.addColorStop(0,'#00000099');r.addColorStop(.6,'#00000055');r.addColorStop(1,'#00000000');g.fillStyle=r;g.fillRect(0,0,s,s);});
  this.shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.1),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.position.y=.012;S.add(this.shadow);
  const sparkTex=canvasTexture(64,(g,s)=>{const r=g.createRadialGradient(s/2,s/2,1,s/2,s/2,s/2);r.addColorStop(0,'#ffffff');r.addColorStop(.35,'#ffe990cc');r.addColorStop(1,'#ffe99000');g.fillStyle=r;g.fillRect(0,0,s,s);});
  this.sparkMat=new THREE.SpriteMaterial({map:sparkTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  this.sparkPool=[];for(let i=0;i<48;i++){const sp=new THREE.Sprite(this.sparkMat);sp.visible=false;S.add(sp);this.sparkPool.push(sp);}
 }
 setHero(kind){if(this.hero){this.scene.remove(this.hero);}this.kind=kind;this.hero=hero(kind);this.scene.add(this.hero);}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.max(320,Math.round(rect.width)),h=Math.max(480,Math.round(rect.height));this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.fov=w/h<.62?68:w/h<.8?62:56;this.camera.updateProjectionMatrix();}
 // pickups burst into sparkles at the hero
 event(e){if(this.reduced)return;if(!['coin','gold','combo','card','magnet','shield','double','block','clear'].includes(e.type))return;const n=e.type==='coin'?6:12;const x=((e.lane??1)-1)*LANE;for(let i=0;i<n;i++){const sp=this.sparkPool.find(s=>!s.visible);if(!sp)break;sp.visible=true;sp.position.set(x,1.1,0);const a=Math.random()*6.28,v=1.5+Math.random()*2.5;sp.userData={vx:Math.cos(a)*v,vy:2+Math.random()*3,vz:Math.sin(a)*v,life:.55};sp.scale.setScalar(e.type==='coin'?.35:.5);sp.material=this.sparkMat;}}
 draw(s,dt,active,phase){
  this.time+=dt;const d=worldOf(s),L=LEVEL[this.level],gliding=isGliding(this.level,s);
  // bends: a new curve/hill every few seconds, eased
  if(this.time>this.nextBendAt){this.nextBendAt=this.time+4+Math.random()*4;this.curveTarget=(Math.random()-.5)*.0032;this.hillTarget=(Math.random()-.5)*.0022;}
  const ease=1-Math.exp(-dt*.7);this.u.curve.value+=(this.curveTarget-this.u.curve.value)*ease;this.u.hill.value+=(this.hillTarget-this.u.hill.value)*ease;
  // ground scroll
  this.tex.ground.offset.y=(d/260)*this.tex.ground.repeat.y;this.tex.path.offset.y=(d/260)*this.tex.path.repeat.y;
  if(this.slabs){const k0=Math.floor((d-14)/TRACK);this.slabs.forEach((m,i)=>{const k=k0+i,w=k*TRACK,z=-(w+TRACK/2-d);const at=(w+TRACK/2)/(s.duration*TRACK*(s.easy?.26:.31));const gap=GLIDE_WINDOWS.some(([a,b])=>at>=a&&at<b);m.visible=!gap&&z<8;m.position.set(0,.02,z);});}
  // scenery
  for(const p of this.props){const m=p.mesh;let n=0;for(const pl of p.places){let z=((pl.w-d)%LOOP+LOOP)%LOOP;z=-(z-10);if(z>8||z<-160)continue;const y=pl.y+(p.floats?Math.sin(this.time*.6+pl.bob)*.4:0);this.tmp.position.set(pl.x,y,z);this.tmp.rotation.set(0,pl.yaw,0);this.tmp.scale.setScalar(pl.s);this.tmp.updateMatrix();m.setMatrixAt(n++,this.tmp.matrix);}m.count=n;m.instanceMatrix.needsUpdate=true;}
  // items
  const counts={};for(const m of Object.values(this.items))m.count=0;
  const heroX=(s.x-1)*LANE;
  for(const o of s.items){if(o.z<0)continue;if(o.resolved&&!['rock','log'].includes(o.kind))continue;const m=this.items[o.kind];if(!m)continue;let x=(o.lane-1)*LANE,z=-(1-o.z)*TRACK,y=0;
   if(s.magnet>0&&['coin','gold'].includes(o.kind)&&o.z>.58){const pull=Math.min(1,(o.z-.58)/.21);x=lerp(x,heroX,pull);y=lerp(0,.9,pull);}
   const spin=this.reduced?0:this.time*2.2+o.z*6;
   if(['coin','gold','magnet','shield','double','card'].includes(o.kind)){y+=.9+Math.sin(this.time*3+o.z*9)*.08;this.tmp.rotation.set(0,spin,0);}else{this.tmp.rotation.set(0,0,0);if(o.kind==='log'&&L.obstacles.log==='bird'){y=.35+Math.sin(this.time*8)*.08;this.tmp.rotation.set(0,0,Math.sin(this.time*12)*.15);}}
   this.tmp.position.set(x,y,z);this.tmp.scale.setScalar(1);this.tmp.updateMatrix();const i=counts[o.kind]=(counts[o.kind]||0);if(i<m.instanceMatrix.count){m.setMatrixAt(i,this.tmp.matrix);counts[o.kind]=i+1;}}
  for(const [k,m] of Object.entries(this.items)){m.count=counts[k]||0;m.instanceMatrix.needsUpdate=true;}
  // hero pose
  const h=this.hero,jump=height(s),up=jump*2.1,run=phase==='playing'||phase==='finished'||phase==='countdown';
  const ph=s.distance*27*Math.PI;
  const arms=h.userData.arms,legs=h.userData.legs,body=h.userData.body,wing=h.userData.wing;
  h.position.set(heroX,up,0);
  const bank=(s.lane-s.x)*.55;
  if(phase==='ready'){h.rotation.set(0,Math.sin(this.time*.6)*.35,0);body.position.y=Math.sin(this.time*2)*.02;arms[0].rotation.x=Math.sin(this.time*2)*.08;arms[1].rotation.x=-Math.sin(this.time*2)*.08;arms[0].rotation.z=.15;arms[1].rotation.z=-.15;legs.forEach(l=>{l.rotation.x=0;});wing.visible=false;}
  else if(gliding){wing.visible=true;wing.scale.setScalar(Math.min(1,wing.scale.x+dt*3));h.position.y=1.6+jump*1.4+Math.sin(this.time*1.5)*.15;h.rotation.set(.55,0,-bank*.8);arms.forEach((a,i)=>{a.rotation.x=-2.7;a.rotation.z=(i?-1:1)*.25;});legs.forEach((l,i)=>{l.rotation.x=.75+Math.sin(this.time*3+i)*.08;});body.position.y=0;}
  else{wing.visible=false;wing.scale.setScalar(.01);const flip=s.jump>0&&!this.reduced?-(1-s.jump/.92)*Math.PI*2:0;h.rotation.set(flip,0,-bank);
   if(s.jump>0){arms.forEach((a,i)=>{a.rotation.x=-2.4;a.rotation.z=(i?-1:1)*.5;});legs.forEach(l=>{l.rotation.x=1.1;});body.position.y=0;}
   else if(run){const sw=Math.sin(ph);legs[0].rotation.x=sw*.95;legs[1].rotation.x=-sw*.95;arms[0].rotation.x=-sw*.9;arms[1].rotation.x=sw*.9;arms[0].rotation.z=.12;arms[1].rotation.z=-.12;body.position.y=Math.abs(Math.cos(ph))*.06;body.rotation.x=.12;}
   else{legs.forEach(l=>l.rotation.x=0);arms.forEach(a=>a.rotation.x=0);body.position.y=0;body.rotation.x=0;}}
  if(s.cooldown>.15&&Math.floor(this.time*18)%2)h.visible=false;else h.visible=true;
  this.shadow.position.set(heroX,.012,0);const sh=gliding?.35:1-jump*.45;this.shadow.scale.setScalar(sh);this.shadow.material.opacity=gliding?.35:1-jump*.5;this.shadow.visible=!(this.slabs&&isGliding(this.level,s));
  // sparkles
  for(const sp of this.sparkPool){if(!sp.visible)continue;const u=sp.userData;u.life-=dt;if(u.life<=0){sp.visible=false;continue;}sp.position.x+=u.vx*dt;sp.position.y+=u.vy*dt;sp.position.z+=u.vz*dt;u.vy-=9*dt;sp.material.opacity=Math.min(1,u.life*2.5);}
  // camera: behind and above, lagging on lane changes, bobbing with the steps
  const camX=lerp(this.cam.x,heroX*.55,1-Math.exp(-dt*6));this.cam.x=camX;
  const bob=run&&!this.reduced&&s.jump<=0&&!gliding?Math.abs(Math.sin(ph))*.05:0;
  if(phase==='ready'){this.camera.position.set(1.5,1.3,3.4);this.camera.lookAt(0,.15,-.3);}
  else{this.camera.position.set(camX,4.1+bob+(gliding?.7:0),7.4);this.camera.lookAt(heroX*.35,1.0+(gliding?.9:0),-13);this.camera.rotation.z=-bank*.12;}
  this.dome.position.copy(this.camera.position);
  this.renderer.render(this.scene,this.camera);
 }
 destroy(){this.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});this.renderer.dispose();}
}
