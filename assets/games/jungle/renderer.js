// Kwizillo Runner — the picture. The engine (engine.js) owns lanes, items and
// coins; this file turns a run into a scene for one of three levels (jungle,
// city, sky) with a boy or a girl. The track curves left and right, the floor
// is sampled row by row in perspective from the level's background painting,
// the shoulders come from a procedural tile, scenery and dressing live at fixed
// world positions and stream past the camera. The sky level lets go of the
// cloud path in two stretches: the hero hangs from a glider and the obstacles
// fly. Missing paintings fall back to the jungle set, so a level plays before
// all of its art exists.
import {flipFrame} from './flip.js';
import {height} from './engine.js';
import {badge,shieldAura,magnetAura} from './arcade-icons.js';
import {CAMERA,travel,project,itemDepth,sceneryDepth} from './world.js';

export const HEROES=['boy','girl'];
// real-world widths (lanes ≈ 1 m) for street furniture, so a postbox is not as tall as a house
const PROP_WIDTH={'scenery-postbox':.55,'scenery-hydrant':.42,'scenery-bench':1.6,'scenery-busstop':2.6,'scenery-balloon-seller':1.7,'scenery-fountain':3.2,'scenery-tree-city':2.4,'scenery-lamp':1.4};
export const LEVELS={
 jungle:{scenes:['jungle-watervallen','jungle-tempel','jungle-avond'],night:scene=>scene==='jungle-avond',shoulder:'grass',sky:['#83d4db','#082936'],rays:false,sun:true,dust:'#d9c39b',air:{kind:'swing',windows:[[.30,.41],[.70,.81]]},extras:['jungle-ravine','jungle-ravine-edge','scenery-liana'],
  obstacles:{log:'obstacle-log',rock:'obstacle-rock'},card:'collectible-jungle-card',cardId:'jungle-leaf',pebbles:true,flowers:true,dapples:true,
  props:[{name:'scenery-fern',spacing:3.2,x:[1.78,1.98],w:[1.5,2.1]},{name:'scenery-tree',spacing:6.4,offset:.7,x:[3.15,3.65],w:[4.5,5.5]}]},
 stad:{scenes:['city-day','city-evening'],night:scene=>scene==='city-evening',shoulder:'pavement',sky:['#9fd0f5','#2b2a55'],rays:false,dust:'#c9c9cf',
  obstacles:{log:'obstacle-barrier',rock:'obstacle-cone'},card:'collectible-city-card',cardId:'city-star',pebbles:false,flowers:false,dapples:false,
  props:[{name:'scenery-lamp',spacing:4.8,x:[1.85,1.85],w:[1.4,1.4]},{pick:['scenery-house-01','scenery-shop-01','scenery-house-02','scenery-tower-01','scenery-house-03','scenery-shop-02','scenery-house-04','scenery-tower-02','scenery-shop-03','scenery-building'],spacing:4.9,offset:1.1,x:[4.0,4.6],w:[5.2,6.4],ground:true},{pick:['scenery-tree-city','scenery-bench','scenery-postbox','scenery-hydrant','scenery-busstop','scenery-balloon-seller','scenery-fountain'],spacing:7.3,offset:2.9,x:[2.55,2.9],w:[1.6,2.4]}],extras:['scenery-house-01','scenery-house-02','scenery-house-03','scenery-house-04','scenery-shop-01','scenery-shop-02','scenery-shop-03','scenery-tower-01','scenery-tower-02','scenery-bench','scenery-postbox','scenery-hydrant','scenery-busstop','scenery-balloon-seller','scenery-fountain','city-evening','obstacle-car-side','obstacle-car-side-2'],crossings:true},
 lucht:{scenes:['sky-day'],night:()=>false,shoulder:'cloud',sky:['#69b4f2'],rays:false,sun:true,dust:null,glide:true,air:{kind:'glide',windows:[[.22,.46],[.66,.88]]},
  obstacles:{log:'obstacle-bird',rock:'obstacle-storm'},card:'collectible-sky-card',cardId:'sky-feather',pebbles:false,flowers:false,dapples:false,
  props:[{name:'scenery-cloud',spacing:3.6,x:[2.2,3.4],w:[2.4,4],float:true,mirror:true},{name:'scenery-cloud',spacing:5.1,offset:1.7,x:[4.5,7],w:[3,5.5],float:true,mirror:true,lift:[-.8,1.2]},{name:'scenery-balloon',spacing:31,offset:3,x:[3.6,5.2],w:[2.1,2.9],float:true,lift:[1.8,3.4]},{name:'scenery-island',spacing:19,offset:7,x:[4,6.5],w:[4.5,7.5],float:true,lift:[-.4,.6],mirror:true}]},
};
// Stretches where the path lets go (fractions of the run, by distance): the sky
// level hands the child a glider, the jungle a liana to swing on.
export const progress=s=>s.distance/(s.duration*(s.easy?.26:.31));
export const airborne=(level,s)=>{const air=LEVELS[level]?.air;if(!air)return null;const p=progress(s);return air.windows.some(([a,b])=>p>=a&&p<b)?air.kind:null;};
export const isGliding=(level,s)=>!!airborne(level,s);
// seconds until the path lets go (positive), and seconds since it came back (positive), for the grab / release poses
export const gapTiming=(level,s)=>{const air=LEVELS[level]?.air;if(!air)return {to:Infinity,since:Infinity};const p=progress(s);let to=Infinity,since=Infinity;for(const [a,b] of air.windows){if(p<a)to=Math.min(to,(a-p)*s.duration);if(p>=b)since=Math.min(since,(p-b)*s.duration);}return {to,since};};

// Every painting a level + hero needs, and what stands in for one that is not
// there yet (the jungle set and the boy always exist).
const FALLBACK={'city-day':'jungle-tempel','sky-day':'jungle-watervallen','obstacle-barrier':'obstacle-log','obstacle-cone':'obstacle-rock','obstacle-bird':'obstacle-log','obstacle-storm':'obstacle-rock','scenery-lamp':'scenery-tree','scenery-building':'scenery-tree','scenery-tree-city':'scenery-tree','scenery-cloud':'scenery-fern','scenery-balloon':'scenery-tree','scenery-island':'scenery-bridge','collectible-city-card':'collectible-jungle-card','collectible-sky-card':'collectible-jungle-card'};
export function assetNames(level,hero){const L=LEVELS[level];const names=new Set([...L.scenes,L.obstacles.log,L.obstacles.rock,L.card,'collectible-coin',...L.props.flatMap(p=>p.pick||[p.name]),...(L.extras||[])]);for(const f of ['run-01','run-02','run-03','run-04','jump','flip','glide','swing','swing-back','swing-2','grab','release','reach'])names.add(`hero-${hero}-${f}`);names.add('scenery-glider');for(const n of [...names])if(FALLBACK[n])names.add(FALLBACK[n]);if(hero!=='boy')for(const f of ['run-01','run-02','run-03','run-04','jump','flip','glide','swing','swing-back','swing-2','grab','release','reach'])names.add(`hero-boy-${f}`);names.add('hero-boy-jump');names.add('hero-boy-run-02');names.add('hero-girl-run-02');for(const l of Object.values(LEVELS))names.add(l.scenes[0]);names.add('hero-boy-portrait');names.add('hero-girl-portrait');return [...names];}
// The painting that stands in for a missing one: a girl frame → the boy's, a level prop → its jungle cousin, a glide pose → the jump pose.
export function resolveName(name,cache){if(cache[name]||(manifest&&manifest.has(name)))return name;if(FALLBACK[name]&&cache[FALLBACK[name]])return FALLBACK[name];const m=name.match(/^hero-girl-(.+)$/);if(m&&cache['hero-boy-'+m[1]])return 'hero-boy-'+m[1];if(/^hero-.+-(glide|swing)$/.test(name)){const j=name.replace(/glide|swing/,'jump');return cache[j]?j:'hero-boy-jump';}if(/^hero-.+-(swing-back|swing-2)$/.test(name)){const j=name.replace(/swing-(back|2)/,'swing');return cache[j]?j:resolveName(j,cache);}if(/^hero-.+-(grab|reach)$/.test(name)){const j=name.replace(/grab|reach/,'jump');return cache[j]?j:'hero-boy-jump';}if(/^hero-.+-release$/.test(name)){const j=name.replace('release','run-02');return cache[j]?j:'hero-boy-run-02';}if(/^hero-.+-portrait$/.test(name)){const j=name.replace('portrait','run-02');return cache[j]?j:'hero-boy-run-02';}return name;}
const one=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Afbeelding kon niet laden: '+src));im.src=src;});
// img/manifest.json lists the paintings that exist, so a level whose art is not
// finished asks for nothing that is missing (no 404s) and takes its stand-ins at once.
let manifest=null;export let stamp='';
export const versioned=url=>stamp?url+(url.includes('?')?'&':'?')+'v='+stamp:url;
async function present(base){if(manifest)return manifest;try{const r=await fetch(new URL('manifest.json',base).href,{cache:'no-cache'});const j=await r.json();const list=Array.isArray(j)?j:j.files;stamp=Array.isArray(j)?'':String(j.v||'');manifest=new Set(list);}catch{manifest=null;}return manifest;}
export async function loadAssets(base,names,cache={}){
 const have=await present(base);
 await Promise.all(names.map(async name=>{if(cache[name]!==undefined)return;if(have&&!have.has(name)){cache[name]=null;return;}try{cache[name]=await one(versioned(new URL(name+'.png',base).href));}catch{cache[name]=null;}}));
 const optional=/^(jungle-ravine|jungle-ravine-edge|scenery-liana|scenery-glider|scenery-(house|shop|tower)-\d+|scenery-(bench|postbox|hydrant|busstop|balloon-seller|fountain)|city-evening|obstacle-car-side(-2)?|hero-(boy|girl)-(swing-back|swing-2|grab|release|reach))$/;
 const images={};for(const name of names){const im=cache[resolveName(name,cache)];if(!im&&!optional.test(name))throw new Error('Afbeelding kon niet laden: '+name);if(im)images[name]=im;}
 return images;
}

// Procedural shoulder tiles, drawn once; the floor samples them row by row in
// perspective. Round clumps and short dashes stay leafy when magnified.
function tile(kind,night){const S=512;const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 if(kind==='pavement'){g.fillStyle='#b9b4a8';g.fillRect(0,0,S,S);for(let i=0;i<700;i++){g.fillStyle=['#aaa598','#c5c0b3','#9d9889'][i%3];g.globalAlpha=.5;const r=1+rnd()*9;g.beginPath();g.ellipse(rnd()*S,rnd()*S,r,r*.7,rnd()*3,0,7);g.fill();}g.globalAlpha=1;g.strokeStyle='#8d887c';g.lineWidth=4;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(0,i*S/4);g.lineTo(S,i*S/4);g.stroke();g.beginPath();g.moveTo(i*S/4,0);g.lineTo(i*S/4,S);g.stroke();}return c;}
 if(kind==='cloud'){g.fillStyle='#dcecfb';g.fillRect(0,0,S,S);for(let i=0;i<700;i++){g.fillStyle=['#ffffff','#eef6ff','#f7fbff','#cfe3fb'][i%4];g.globalAlpha=.6;const r=6+rnd()*rnd()*40;g.beginPath();g.ellipse(rnd()*S,rnd()*S,r,r*(.5+rnd()*.5),rnd()*3,0,7);g.fill();}g.globalAlpha=1;return c;}
 g.fillStyle=night?'#14382e':'#4f8d36';g.fillRect(0,0,S,S);
 const day=['#3f7a2c','#5c9f3f','#72b64d','#3a6f27','#86c95a','#a5da6b','#2f6222'],dark=['#0f2d25','#1a4437','#23533f','#0c2620','#2c6a50','#0a1f19'],pal=night?dark:day;
 for(let i=0;i<900;i++){g.fillStyle=pal[i%pal.length];g.globalAlpha=.55;const r=3+rnd()*rnd()*26;g.beginPath();g.ellipse(rnd()*S,rnd()*S,r,r*(.5+rnd()*.5),rnd()*3.2,0,7);g.fill();}
 g.globalAlpha=.9;g.lineCap='round';
 for(let i=0;i<2200;i++){const x=rnd()*S,y=rnd()*S,l=2+rnd()*5,a=rnd()*6.3;g.strokeStyle=pal[(i*3)%pal.length];g.lineWidth=1.5+rnd()*2;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
 g.globalAlpha=1;return c;}

export class Renderer{
 constructor(canvas,images,{level='jungle',scene,hero='boy'}={}){this.canvas=canvas;this.g=canvas.getContext('2d',{alpha:false});if(!this.g)throw Error('Canvas niet beschikbaar');this.images=images;this.particles=[];this.labels=[];this.reduced=false;this.tiles={};this.curve=0;this.curveTarget=0;this.nextBend=0;this.glideBlend=0;this.setLevel(level,scene);this.hero=hero;this.resize();}
 setLevel(level,scene){this.level=LEVELS[level]?level:'jungle';const L=LEVELS[this.level];this.scene=scene&&L.scenes.includes(scene)&&(!this.images||this.images[scene])?scene:L.scenes[0];this.isNight=L.night(this.scene);}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.max(360,Math.round(rect.width*dpr));this.canvas.height=Math.max(540,Math.round(rect.height*dpr));}
 // The track bends: everything at a depth slides sideways by the same amount.
 off(depth){return this.curve*depth*depth;}
 point(l,z){const depth=itemDepth(z),p=project((l-1)*1.04,depth);p.x+=this.off(depth);return p;}
 // The canyon painting scrolled (ping-pong, so no seam) into a device-sized buffer once per frame; the floor rows copy from it 1:1.
 canyon(im,distance){const ky=this.canvas.height/900,W=Math.round(this.canvas.width/2),H=Math.round(588*ky);if(!this.canyonBuf||this.canyonBuf.width!==W||this.canyonBuf.height!==H){this.canyonBuf=document.createElement('canvas');this.canyonBuf.width=W;this.canyonBuf.height=H;}const c=this.canyonBuf,g=c.getContext('2d');if(this.canyonAt===distance)return c;this.canyonAt=distance;const segH=W*im.height/im.width*1.45,sc=distance*.045*(590/.85*ky)/segH,k0=Math.floor(sc);g.clearRect(0,0,W,H);for(let k=k0;k<=k0+Math.ceil(H/segH)+1;k++){const top=(k-sc)*segH;if(top>H||top+segH<0)continue;g.save();if(((k%2)+2)%2){g.translate(0,top+segH);g.scale(1,-1);g.drawImage(im,0,0,W,segH);}else g.drawImage(im,0,top,W,segH);g.restore();}return c;}
 // The cliff-edge painting with its foreground path fading out at the bottom, so it melts into the track (made once).
 faded(im){if(this.fadedEdge)return this.fadedEdge;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='destination-out';const grad=g.createLinearGradient(0,im.height*.68,0,im.height);grad.addColorStop(0,'#0000');grad.addColorStop(1,'#000');g.fillStyle=grad;g.fillRect(0,0,im.width,im.height);return this.fadedEdge=c;}
 // Still grass for the shoulders (drawn once): a tile sampled in perspective, dense and bright near, soft and dark far, never moving.
 lawn(night){const key='lawn'+(night?'-n':'');if(this.tiles[key])return this.tiles[key];const t=tile('grass',night),c=document.createElement('canvas');c.width=600;c.height=590;const g=c.getContext('2d');/* a true perspective projection of one flat lawn: each row shows the slice of the tile at its own depth, so blades stay coherent from row to row */const K=46;for(let y=0;y<590;y+=2){const d0=CAMERA.focal*CAMERA.height/(y+312-CAMERA.horizon),d1=CAMERA.focal*CAMERA.height/(y+314-CAMERA.horizon),sw=Math.max(160,Math.min(512,512*d0/10)),ty=((d1*K)%512+512)%512,sh=Math.max(1,Math.min(60,(d0-d1)*K,512-ty));g.globalAlpha=Math.min(1,y/140)*.92;g.drawImage(t,(512-sw)/2,ty,sw,sh,0,y,600,2);}g.globalAlpha=1;const fade=g.createLinearGradient(0,0,0,590);fade.addColorStop(0,night?'#0d2a20':'#5f9a48');fade.addColorStop(.25,night?'#0d2a2000':'#5f9a4800');g.fillStyle=fade;g.fillRect(0,0,600,590);return this.tiles[key]=c;}
 // River water for the jungle crossing (drawn once): deep green-blue with soft ripples and a few highlights; sampled like the path so it streams.
 water(night){const key='water'+(night?'-n':'');if(this.tiles[key])return this.tiles[key];const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');let seed=13;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};g.fillStyle=night?'#0b2433':'#1d5a63';g.fillRect(0,0,S,S);for(let i=0;i<260;i++){g.fillStyle=(night?['#0e2d3f','#123a4d','#081b27']:['#226a72','#2a7a80','#17505a','#31878c'])[i%4];g.globalAlpha=.5;g.beginPath();g.ellipse(rnd()*S,rnd()*S,20+rnd()*70,3+rnd()*7,0,0,7);g.fill();}g.globalAlpha=1;g.lineCap='round';for(let i=0;i<120;i++){g.strokeStyle=night?'#8fd8ff':'#cfffff';g.globalAlpha=.25+rnd()*.35;g.lineWidth=1.5+rnd()*1.5;const x=rnd()*S,y=rnd()*S,l=10+rnd()*40;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l/2,y-3,x+l,y);g.stroke();}g.globalAlpha=1;return this.tiles[key]=c;}
 shoulder(){const L=LEVELS[this.level],key=L.shoulder+(this.isNight?'-night':'');return this.tiles[key]??=tile(L.shoulder,this.isNight);}
 // Trees, plants and obstacles get a moonlit copy for the evening scene (made once).
 night(name){if(!/^(scenery|obstacle)-/.test(name))return this.images[name];this.nightImages??={};if(this.nightImages[name])return this.nightImages[name];const im=this.images[name],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#0a2740';g.globalAlpha=.5;g.fillRect(0,0,c.width,c.height);return this.nightImages[name]=c;}
 image(name,x,y,w,angle=0,alpha=1,flip=false){const im=this.isNight?this.night(name):this.images[name];if(!im)return;const g=this.g,h=w*im.height/im.width*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.translate(x,y);g.rotate(angle);if(flip)g.scale(-1,1);g.drawImage(im,-w/2,-h,w,h);g.restore();}
 // The first opaque row of a painting (cached): where the fists are on the hanging and reaching poses.
 topOf(name){this.tops??={};if(this.tops[name]!==undefined)return this.tops[name];const im=this.images[name];const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,im.width,im.height).data;let top=0;outer:for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x+=2)if(d[(y*im.width+x)*4+3]>40){top=y;break outer;}return this.tops[name]=top/im.height;}
 flip(x,bottom,width,remaining,alpha){const g=this.g,im=this.images[`hero-${this.hero}-flip`],frame=flipFrame(remaining),cw=im.width/4,ch=im.height/2;const h=width*ch/cw*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.drawImage(im,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,x-width/2,bottom-h,width,h);g.restore();}
 event(e){const p=this.point(e.lane??1,1);if(['coin','gold','combo','card','clear','magnet','shield','block','double','speed'].includes(e.type)){const label=this.labelFor?.(e)??({coin:`+${e.value??1}`,gold:`+${e.value??5} GOUD!`,combo:`COMBO +5`,card:'Kaart ontdekt!',clear:'Mooie sprong!',magnet:'MAGNEET!',shield:'SCHILD!',block:'Gered!',double:'DUBBELE MUNTEN!',speed:'TURBO!'})[e.type];this.labels.push({x:p.x,y:p.y-160,text:label,life:1});if(!this.reduced)for(let i=0;i<9;i++){const a=i*2.4;this.particles.push({x:p.x,y:p.y-55,vx:Math.cos(a)*80,vy:Math.sin(a)*85-50,life:.65,color:e.type==='card'?'#a2f7ff':'#ffe58e'});}}}

 drawWorld(s,dt){const g=this.g,L=LEVELS[this.level],bg=this.images[this.scene],distance=travel(s),night=this.isNight,air=airborne(this.level,s),gliding=!!air;
 // a new bend every few seconds, eased; the run starts straight
 if(s.time>this.nextBend){this.nextBend=s.time+4+Math.random()*4;this.curveTarget=s.time<2?0:(Math.random()-.5)*.045;}
 if(gliding||this.glideBlend>.02)this.curveTarget=0; // the track runs straight while the child hangs or flies
 this.curve+=(this.curveTarget-this.curve)*(1-Math.exp(-dt*.8));
 this.glideBlend+=((gliding?1:0)-this.glideBlend)*(1-Math.exp(-dt*1.7));
 const raw=this.glideBlend,blend=raw*raw*(3-2*raw); // smoothstep: eases in and out of the swing / glide
 g.fillStyle=night?L.sky[1]:L.sky[0];g.fillRect(0,0,600,900);
 // the skyline: the top of the painting, drifting with the bend
 g.drawImage(bg,0,0,bg.width,bg.height*.45,-12-Math.sin(distance*.008)*9-this.curve*350,-8,624,338);

 // The floor, row by row. A row shows the world point the hero reaches a little
 // later, so a stretch where the path lets go (the ravine, the open sky) is
 // visible as a gap that comes towards you and streams past — the same world,
 // never a cross-fade.
 const rate=s.duration*(s.easy?.26:.31),windows=L.air?.windows||[];
 const gapAt=depth=>{if(!windows.length)return false;const p=(s.distance+(depth-CAMERA.player)/(CAMERA.far-CAMERA.player))/rate;return windows.some(([a,b])=>p>=a&&p<b);};
 const chasm=L.air?.kind==='swing'?(night?['#12261c','#0b1a12','#060d09']:['#4a6a3a','#2c4a2c','#15291a']):['#8fc6f3','#b8dbf8','#d8ecfd'];
 const ravine=L.air?.kind==='swing'?this.images['jungle-ravine']:null,edge=L.air?.kind==='swing'?this.images['jungle-ravine-edge']:null;
 const pav=L.shoulder==='pavement',earthTop=pav?(night?'#5a5868':'#b4afa4'):night?'#173d33':L.shoulder==='cloud'?'#d9e9f9':'#6a9a4a',earthMid=pav?(night?'#4b4958':'#a19c91'):night?'#123327':L.shoulder==='cloud'?'#c3daf3':'#4f8a3a',earthBot=pav?(night?'#33323f':'#7f7a70'):night?'#0d2a20':L.shoulder==='cloud'?'#aecbee':'#3a6f2c';
 const earth=g.createLinearGradient(0,310,0,900);earth.addColorStop(0,earthTop);earth.addColorStop(.5,earthMid);earth.addColorStop(1,earthBot);g.fillStyle=earth;g.fillRect(0,310,600,590);
 if(L.shoulder==='grass'){g.save();g.globalAlpha=.4;g.globalCompositeOperation='overlay';g.drawImage(this.lawn(night),0,310,600,590);g.globalCompositeOperation='source-over';g.globalAlpha=.16;g.drawImage(this.lawn(night),0,310,600,590);g.restore();}
 const deep=g.createLinearGradient(0,310,0,900);deep.addColorStop(0,chasm[0]);deep.addColorStop(.35,chasm[1]);deep.addColorStop(1,chasm[2]);

 // The path lets go: in the jungle the track becomes a river far below (the
 // child swings across on a liana), in the sky it becomes open air. The river
 // and the air are drawn exactly like the path — a band between the same left
 // and right edges, streaming at the same speed — so nothing else in the world
 // changes and the transition is just the bank where the path ends.
 const water=L.air?.kind==='swing'?this.water(night):null;
 let prevGap=false;
 for(let y=312;y<902;y+=2){const depth=CAMERA.focal*CAMERA.height/(y-CAMERA.horizon),scale=CAMERA.focal/depth,worldZ=depth+distance,off=this.off(depth);
  const gap=gapAt(depth),left=300-1.50*scale+off,right=300+1.50*scale+off;
  if(gap){
   if(water){const K=26,ty=((worldZ*K)%512+512)%512,d1=CAMERA.focal*CAMERA.height/(y+2-CAMERA.horizon),sh=Math.max(1,Math.min(40,(depth-d1)*K,512-ty)),sw=Math.max(200,Math.min(512,512*depth/9));
    g.drawImage(water,(512-sw)/2,ty,sw,sh,left-4,y,right-left+8,3);
    // the banks: a dark rim of earth on both sides of the water
    g.fillStyle=night?'#0b1d14':'#3d2c17';g.fillRect(left-4-scale*.07,y,scale*.07+2,3);g.fillRect(right+2,y,scale*.07+2,3);}
   else{const t=(y-312)/590;g.fillStyle=`rgb(${Math.round(143+48*t)},${Math.round(198+26*t)},${Math.round(243+8*t)})`;g.fillRect(0,y,600,3);prevGap=true;continue;} // open sky across the whole width, one smooth gradient
   if(!prevGap){g.fillStyle=night?'#0a1f16':L.air?.kind==='swing'?'#2a2014':'#dcefff';g.fillRect(left-6,y-3,right-left+12,4);}
   prevGap=true;continue;}
  prevGap=false;
  const phase=((worldZ/10)%2+2)%2,t=phase<1?phase:2-phase,sy=bg.height*(.80+t*.19);
  g.drawImage(bg,bg.width*.30,sy,bg.width*.40,1,left,y,right-left,3);
 }

 // Ground dressing in world space: pebbles along the path edge, flowers in the verge, dapples on the track.
 {g.save();g.beginPath();g.rect(0,310,600,590);g.clip();
  if(L.pebbles)for(let i=0;i<40;i++){const depth=sceneryDepth(i,1.45,distance,i%2?.7:0);if(depth>40||depth<.6||gapAt(depth))continue;const side=i%2?1:-1,p=project(side*(1.42+(i%3)*.05),depth);p.x+=this.off(depth);g.fillStyle=night?'#6b7f86':'#e6cfa2';g.globalAlpha=Math.min(1,(42-depth)/10);g.beginPath();g.ellipse(p.x,p.y-p.scale*.03,p.scale*.055,p.scale*.03,0,0,7);g.fill();}
  if(L.flowers)for(let i=0;i<36;i++){const depth=sceneryDepth(i,2.05,distance,i%2?1.1:.3);if(depth>34||depth<.6||gapAt(depth))continue;const side=i%2?1:-1,wob=Math.sin(i*5.3)*.5+.5,p=project(side*(1.95+wob*1.6),depth);p.x+=this.off(depth);g.fillStyle=night?['#7fe0ff','#ffe98a','#ff9ad5'][i%3]:['#ff6d8a','#ffd84d','#ff9d3d','#f4f4ff'][i%4];g.globalAlpha=Math.min(1,(36-depth)/8)*(night?.7:.9);g.beginPath();g.arc(p.x,p.y-p.scale*.06,Math.max(1.2,p.scale*.045),0,7);g.fill();}
  g.globalAlpha=1;
  if(L.dapples)for(let i=0;i<9;i++){const depth=sceneryDepth(i,4.4,distance,i*.9);if(depth>30||depth<.8||gapAt(depth))continue;const p=project(Math.sin(i*2.1)*1.05,depth);p.x+=this.off(depth);g.fillStyle=night?'#a9e2ff':'#fff5b8';g.globalAlpha=(night?.07:.16)*Math.min(1,(32-depth)/8);g.beginPath();g.ellipse(p.x,p.y-p.scale*.02,p.scale*.62,p.scale*.16,0,0,7);g.fill();}
  g.globalAlpha=1;g.restore();}
 // Trackside scenery at fixed world positions, passing the camera.
 const props=[];
 for(const spec of L.props)for(let i=0;i<24;i++)for(const side of[-1,1]){
  const depth=sceneryDepth(i,spec.spacing,distance,(spec.offset||0)+(side===1?spec.spacing*.47:0));
  if(depth>68||depth<.42)continue;

  const v=Math.sin(i*8.17+side+spec.spacing)*.5+.5;
  const lift=spec.float?(spec.lift?spec.lift[0]+v*(spec.lift[1]-spec.lift[0]):0)+Math.sin(s.time*.8+i)*.15:0;
  let name=spec.name;if(spec.pick){const have=spec.pick.filter(n=>this.images[n]);if(!have.length)continue;name=have[(i*7+(side>0?3:0)+Math.floor(v*5))%have.length];}
  const px=side*(spec.x[0]+v*(spec.x[1]-spec.x[0]));
  let width=spec.w[0]+v*(spec.w[1]-spec.w[0]);if(spec.pick){const im=this.images[name];width=PROP_WIDTH[name]??width*Math.min(1.25,Math.max(.45,im.width/im.height/.72));}
  props.push({depth,x:px,name,width,lift,flip:!!spec.mirror&&(i+side)%2===0});
 }
 for(const o of props.sort((a,b)=>b.depth-a.depth)){const p=project(o.x,o.depth);p.x+=this.off(o.depth);const a=Math.min(1,(70-o.depth)/12,(o.depth-.3)/.5);
  // a soft contact shadow ties each plant, tree or building to the ground
  if(!o.lift){const w=o.width*p.scale;g.save();g.globalAlpha=a*.28;g.fillStyle=night?'#03110c':'#1b3a12';g.beginPath();g.ellipse(p.x,p.y-w*.035,w*.3,w*.055,0,0,7);g.fill();g.restore();}
  this.image(o.name,p.x,p.y-o.lift*p.scale,o.width*p.scale,0,a,o.flip);}
 // light: sun shafts by day, moon glow by night; distance haze hides the recycle boundary
 if(night){const moon=g.createRadialGradient(470,70,4,470,70,190);moon.addColorStop(0,'#d8f3ff55');moon.addColorStop(.35,'#7fc6ff1c');moon.addColorStop(1,'#00000000');g.fillStyle=moon;g.fillRect(200,0,400,320);}
 else if(L.rays||L.sun){g.save();g.globalCompositeOperation='lighter';if(L.rays)for(let i=0;i<4;i++){const x0=120+i*95+Math.sin(s.time*.35+i)*10,ray=g.createLinearGradient(0,0,0,560);ray.addColorStop(0,'#fff6c0'+(i%2?'2a':'20'));ray.addColorStop(1,'#fff6c000');g.fillStyle=ray;g.beginPath();g.moveTo(x0,-10);g.lineTo(x0+26,-10);g.lineTo(x0+150,560);g.lineTo(x0+40,560);g.closePath();g.fill();}
  if(L.sun){const sun=g.createRadialGradient(560,30,6,560,30,230);sun.addColorStop(0,'#ffffff8c');sun.addColorStop(.3,'#ffe8a044');sun.addColorStop(1,'#ffe8a000');g.fillStyle=sun;g.fillRect(250,0,350,300);}g.restore();}
 const fogC=night?'#073e4b':L.shoulder==='pavement'?'#d7e3ee':L.shoulder==='cloud'?'#e6f2ff':'#bdeadd';
 const fog=g.createLinearGradient(0,280,0,440);fog.addColorStop(0,fogC+'00');fog.addColorStop(.22,fogC+'66');fog.addColorStop(1,'#ffffff00');g.fillStyle=fog;g.fillRect(0,280,600,160);
 return {gliding,blend,air};
 }

 draw(s,dt,active){const g=this.g,L=LEVELS[this.level],bg=this.images[this.scene];g.setTransform(this.canvas.width/600,0,0,this.canvas.height/900,0,0);
 const {gliding,blend,air}=this.drawWorld(s,dt);
 const shade=g.createLinearGradient(0,0,0,900);shade.addColorStop(0,'#07284266');shade.addColorStop(.2,'#00000000');shade.addColorStop(.8,'#00000000');shade.addColorStop(1,'#082c4833');g.fillStyle=shade;g.fillRect(0,0,600,900);
 if(!this.reduced){for(let i=0;i<14;i++){const t=s.time*.17+i*2.7,x=(Math.sin(t*.8)*.5+.5)*580,y=180+(i*79+s.time*11)%580;g.fillStyle=this.isNight?'#fff3a0':'#ffffc1';g.globalAlpha=.2+.2*Math.sin(t);g.beginPath();g.arc(x,y,this.isNight?2.5:1.6,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
 const hero=this.hero,liftPx=blend*150; // flying obstacles and coins hang above the (missing) path
 const player=()=>{const p=this.point(s.x,1),jump=height(s),land=s.jump>0?0:Math.sin(s.time*19)*(this.reduced||gliding?0:2);
  const {to:sTo,since:sSince}=gapTiming(this.level,s);const shadowK=air?0:sTo<.5?sTo/.5:sSince<.45?sSince/.45:1;
  if(shadowK>0){g.fillStyle='#2c27143b';g.globalAlpha=shadowK;g.beginPath();g.ellipse(p.x,p.y+4,39-jump*10,10-jump*3,0,0,7);g.fill();g.globalAlpha=1;}
  const step=Math.floor(s.distance*27);if(active&&!this.reduced&&L.dust&&!gliding&&s.jump<=0&&step!==this.lastStep){this.lastStep=step;for(let i=0;i<3;i++)this.particles.push({x:p.x+(Math.random()-.5)*36,y:p.y+2,vx:(Math.random()-.5)*40,vy:20+Math.random()*40,life:.5,r:5+Math.random()*5,color:L.dust});}
  const {to,since}=gapTiming(this.level,s),kind=L.air?.kind;
  const LEAD=.5,TAIL=.45; // seconds: the jump towards the liana / glider, and the landing
  const phase=air?'in':to<LEAD?'lead':since<TAIL?'tail':null;
  const sway=air==='swing'?Math.sin(s.time*2.1)*.22:0;
  // the hanging / reaching poses (384×560) are drawn narrower than the run frames so the child stays the same size — arms up only add height
  const SW=168,LIFT=kind==='glide'?150:110;const heroLift=phase==='lead'?(1-to/LEAD)**2*LIFT:phase==='in'?LIFT+(kind==='glide'?Math.sin(s.time*1.6)*10:0):phase==='tail'?(1-since/TAIL)**2*LIFT:0;
  const alpha=s.cooldown>.15?.72:1,bottom=p.y+17-jump*137+land-heroLift;
  const fists=name=>{const im=this.images[name];const h=SW*im.height/im.width*(this.canvas.width/600)/(this.canvas.height/900);return bottom-h+this.topOf(name)*h+10;};
  const has=n=>manifest?.has(n)||!!this.images[n];
  if(kind==='swing'&&phase){
   const liana=this.images['scenery-liana'];
   const drawLiana=(x0,y0,x1,y1,a)=>{if(!liana)return;const ang=Math.atan2(x1-x0,y1-y0),len=Math.hypot(x1-x0,y1-y0)+8,w=len*liana.width/liana.height;g.save();g.globalAlpha=a;g.translate(x0,y0);g.rotate(-ang);g.drawImage(liana,-w/2,0,w,len);g.restore();};
   const sn=air?Math.sin(s.time*2.1):0,hx=p.x+sn*26,top={x:p.x-sn*60,y:-40};
   if(phase==='lead'){const k=1-to/LEAD;const pose=has(`hero-${hero}-grab`)?`hero-${hero}-grab`:`hero-${hero}-jump`;const hy=fists(pose);
    drawLiana(p.x,top.y,p.x,hy-(1-k)*(1-k)*300,alpha*Math.min(1,k*2)); // the liana's end comes down to the rising hands and meets them exactly
    this.image(pose,p.x,bottom,SW,clampTilt(s),alpha);}
   else if(phase==='in'){const pose=sn>.35&&has(`hero-${hero}-swing-back`)?`hero-${hero}-swing-back`:sn<-.35?`hero-${hero}-swing`:has(`hero-${hero}-swing-2`)?`hero-${hero}-swing-2`:`hero-${hero}-swing`;
    const hy=fists(pose),ph=Math.abs(hy-bottom);const hand={x:hx+Math.sin(sway)*ph,y:bottom-Math.cos(sway)*ph};
    drawLiana(top.x,top.y,hand.x,hand.y,alpha);
    this.image(pose,hx,bottom,SW,sway,alpha);}
   else{const k=since/TAIL;const pose=k<.7&&has(`hero-${hero}-release`)?`hero-${hero}-release`:null;
    if(pose)this.image(pose,p.x,bottom,SW,clampTilt(s),alpha);else this.image(`hero-${hero}-run-0${1+Math.floor(s.distance*27)%4}`,p.x,bottom,211,clampTilt(s),alpha);}
  }
  else if(kind==='glide'&&phase){
   const glider=this.images['scenery-glider'];
   const drawGlider=(cx,handY,a)=>{if(!glider)return;const w=250,h=w*glider.height/glider.width;g.save();g.globalAlpha=a;g.drawImage(glider,cx-w/2,handY-h*.86,w,h);g.restore();}; // the control bar sits at 86 % of the painting's height
   if(phase==='lead'){const k=1-to/LEAD;const pose=has(`hero-${hero}-reach`)?`hero-${hero}-reach`:`hero-${hero}-jump`;const hy=fists(pose);
    drawGlider(p.x,hy-(1-k)*(1-k)*360,alpha*Math.min(1,k*2.5));
    this.image(pose,p.x,bottom,SW,clampTilt(s),alpha);}
   else if(phase==='in'){this.image(`hero-${hero}-glide`,p.x,bottom,236,clampTilt(s)*1.6,alpha);}
   else{const k=since/TAIL;const pose=k<.7&&has(`hero-${hero}-release`)?`hero-${hero}-release`:null;
    drawGlider(p.x,fists(pose||`hero-${hero}-reach`)-k*k*420,alpha*(1-k));
    if(pose)this.image(pose,p.x,bottom,SW,clampTilt(s),alpha);else this.image(`hero-${hero}-run-0${1+Math.floor(s.distance*27)%4}`,p.x,bottom,211,clampTilt(s),alpha);}
  }
  else if(s.jump>0&&!this.reduced)this.flip(p.x,bottom,211,s.jump,alpha);
  else this.image(s.jump>0?`hero-${hero}-jump`:`hero-${hero}-run-0${1+Math.floor(s.distance*27)%4}`,p.x,bottom,211,clampTilt(s)+this.curve*.4,alpha);
  if(s.shield)shieldAura(g,p.x,p.y-85-jump*137-heroLift,74,116,s.time,this.reduced);
  if(s.magnet>0)magnetAura(g,p.x,p.y-85-jump*137-heroLift,86,130,s.time,this.reduced);};
 let drawn=false;
 for(const o of [...s.items].sort((a,b)=>a.z-b.z)){if(o.z<0||itemDepth(o.z)<.8)continue;if(o.z>1&&!drawn){player();drawn=true;}if(o.resolved&&!['rock','log','car'].includes(o.kind))continue;
  const p=this.point(o.lane,o.z);const flies=gliding||(L.glide&&o.kind==='log');const raise=flies?(gliding?liftPx:70)*4/itemDepth(o.z):0; // nearer things are lifted more on screen
  if(s.magnet>0&&['coin','gold'].includes(o.kind)&&o.z>.58){const pull=Math.min(1,(o.z-.58)/.21),target=this.point(s.x,1);p.x+=(target.x-p.x)*pull;p.y+=(target.y-45-p.y)*pull;}
  p.y-=raise;
  if(o.kind==='car'){const im=this.images[o.dir>0?'obstacle-car-side':'obstacle-car-side-2']||this.images[L.obstacles.rock];const w=p.scale*1.55,h=w*im.height/im.width*(this.canvas.width/600)/(this.canvas.height/900);
   // the crossing: a darker band of road across the whole width at the car's depth
   const bx0=300-2.6*p.scale+this.off(itemDepth(o.z)),bw=5.2*p.scale,bh=p.scale*.34;
   // the side street: the same asphalt as the path, turned a quarter so its centre line runs across
   g.save();g.beginPath();g.rect(bx0,p.y-bh/2,bw,bh);g.clip();g.translate(bx0+bw/2,p.y);g.rotate(Math.PI/2);g.drawImage(bg,bg.width*.30,bg.height*.80,bg.width*.40,bg.height*.19,-bh/2,-bw/2,bh,bw);g.restore();
   g.fillStyle='#00000033';g.fillRect(bx0,p.y-bh/2,bw,2);g.fillRect(bx0,p.y+bh/2-2,bw,2);
   g.fillStyle='#1f200b40';g.beginPath();g.ellipse(p.x,p.y,w*.45,w*.06,0,0,7);g.fill();
   g.save();g.translate(p.x,p.y);if(o.dir<0)g.scale(-1,1);g.drawImage(im,-w/2,-h,w,h);
   // spinning wheels: a dark spoke cross turning with the distance driven, drawn over the painted hubs
   const wheels=im===this.images['obstacle-car-side-2']?[[.235,.815,.075]]:[[.22,.815,.078]];const rot=o.lane*11;
   for(const [fx,fy,fr] of [...(wheels.length?[[wheels[0][0],wheels[0][1],wheels[0][2]],[1-wheels[0][0]-.02,wheels[0][1],wheels[0][2]]]:[])]){const cx=-w/2+fx*w,cy=-h+fy*h,r=fr*w;g.save();g.translate(cx,cy);g.rotate(rot);g.strokeStyle='#1a1c22aa';g.lineWidth=Math.max(1.5,r*.22);for(let k=0;k<3;k++){g.beginPath();g.moveTo(-r*.82,0);g.lineTo(r*.82,0);g.stroke();g.rotate(Math.PI/3);}g.restore();}
   g.restore();continue;}
  if(['magnet','shield','gold','double','speed'].includes(o.kind)){badge(g,o.kind,p.x,p.y-p.scale*.2,p.scale*.45,s.time);continue;}
  const width=p.scale*(o.kind==='coin'?.30:o.kind==='card'?.42:.73);const name=o.kind==='coin'?'collectible-coin':o.kind==='card'?L.card:L.obstacles[o.kind];const lift=o.kind==='coin'?p.scale*.24:0;
  if(o.kind==='coin'||o.kind==='card'){g.save();g.shadowColor=o.kind==='coin'?'#ffe590':'#b988ff';g.shadowBlur=this.reduced?0:12;this.image(name,p.x,p.y-lift,width,this.reduced?0:Math.sin(s.time*2+o.z)*.05);g.restore();if(o.kind==='coin'&&!this.reduced&&((s.time*1.6+o.z*7)%1)<.18){const r=width*.55,cx=p.x+width*.28,cy=p.y-lift-width*.95;g.fillStyle='#ffffffd9';g.beginPath();g.moveTo(cx,cy-r);g.quadraticCurveTo(cx,cy,cx+r,cy);g.quadraticCurveTo(cx,cy,cx,cy+r);g.quadraticCurveTo(cx,cy,cx-r,cy);g.quadraticCurveTo(cx,cy,cx,cy-r);g.fill();}}
  else{if(!flies){g.fillStyle='#1f200b40';g.beginPath();g.ellipse(p.x,p.y,width*.43,width*.09,0,0,7);g.fill();}const bob=flies&&!this.reduced?Math.sin(s.time*6+o.lane)*p.scale*.03:0;this.image(name,p.x,p.y+bob,width,flies&&o.kind==='log'?Math.sin(s.time*9)*.06:0);}}
 if(!drawn)player();
 // turbo: speed streaks racing in from the edges and a warm glow
 if(s.boost>0&&!this.reduced){g.save();g.globalCompositeOperation='lighter';const k=Math.min(1,s.boost/.6);for(let i=0;i<26;i++){const a=(i/26)*Math.PI*2+Math.sin(i*7.3)*.2,r0=170+((s.time*1100+i*137)%460),len=120+(i%4)*50,x0=300+Math.cos(a)*r0,y0=480+Math.sin(a)*r0*.8,x1=300+Math.cos(a)*(r0+len),y1=480+Math.sin(a)*(r0+len)*.8;const grad=g.createLinearGradient(x0,y0,x1,y1);grad.addColorStop(0,'#fff2a000');grad.addColorStop(1,`rgba(255,240,160,${(.85*k).toFixed(2)})`);g.strokeStyle=grad;g.lineWidth=4;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();}const glow=g.createRadialGradient(300,560,80,300,560,520);glow.addColorStop(0,'#ffb04000');glow.addColorStop(1,`rgba(255,150,40,${(.28*k).toFixed(2)})`);g.fillStyle=glow;g.fillRect(0,0,600,900);g.restore();}
 for(const p of this.particles){if(active){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;}g.globalAlpha=Math.max(0,p.life/.65)*(p.r?.55:1);g.fillStyle=p.color;if(p.r){g.beginPath();g.arc(p.x,p.y,p.r*(1.6-p.life),0,7);g.fill();}else g.fillRect(p.x,p.y,4,4);}g.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
 for(const p of this.labels){if(active){p.life-=dt;p.y-=35*dt;}g.globalAlpha=Math.min(1,Math.max(0,p.life*2));g.font='900 23px system-ui';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#63491a';g.strokeText(p.text,p.x,p.y);g.fillStyle='#fff4b4';g.fillText(p.text,p.x,p.y);}g.globalAlpha=1;this.labels=this.labels.filter(p=>p.life>0);
 }
 destroy(){this.particles=[];this.labels=[];}
}
function clampTilt(s){return Math.max(-.08,Math.min(.08,(s.lane-s.x)*.09));}
