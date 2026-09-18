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
import {badge} from './arcade-icons.js';
import {CAMERA,travel,project,itemDepth,sceneryDepth} from './world.js';

export const HEROES=['boy','girl'];
export const LEVELS={
 jungle:{scenes:['jungle-watervallen','jungle-tempel','jungle-avond'],night:scene=>scene==='jungle-avond',shoulder:'grass',sky:['#83d4db','#082936'],rays:true,dust:'#d9c39b',
  obstacles:{log:'obstacle-log',rock:'obstacle-rock'},card:'collectible-jungle-card',cardId:'jungle-leaf',pebbles:true,flowers:true,dapples:true,
  props:[{name:'scenery-fern',spacing:3.2,x:[1.78,1.98],w:[1.5,2.1]},{name:'scenery-tree',spacing:6.4,offset:.7,x:[3.15,3.65],w:[4.5,5.5]}]},
 stad:{scenes:['city-day'],night:()=>false,shoulder:'pavement',sky:['#9fd0f5'],rays:false,dust:'#c9c9cf',
  obstacles:{log:'obstacle-barrier',rock:'obstacle-cone'},card:'collectible-city-card',cardId:'city-star',pebbles:false,flowers:false,dapples:false,
  props:[{name:'scenery-lamp',spacing:4.8,x:[1.85,1.85],w:[1.4,1.4]},{name:'scenery-building',spacing:5.6,offset:1.1,x:[4.2,5.4],w:[6.5,9]},{name:'scenery-tree-city',spacing:9.6,offset:2.9,x:[2.6,2.9],w:[2.6,3.2]}]},
 lucht:{scenes:['sky-day'],night:()=>false,shoulder:'cloud',sky:['#69b4f2'],rays:true,dust:null,glide:true,
  obstacles:{log:'obstacle-bird',rock:'obstacle-storm'},card:'collectible-sky-card',cardId:'sky-feather',pebbles:false,flowers:false,dapples:false,
  props:[{name:'scenery-cloud',spacing:3.6,x:[2.2,3.4],w:[2.4,4],float:true},{name:'scenery-balloon',spacing:11,offset:3,x:[3.5,5],w:[2.6,3.6],float:true,lift:[1.6,3.2]},{name:'scenery-island',spacing:14,offset:7,x:[4,6],w:[5,7],float:true,lift:[-.4,.4]}]},
};
// Where the sky level lets go of the cloud path (fractions of the run, by distance).
export const GLIDE_WINDOWS=[[.22,.46],[.66,.88]];
export const progress=s=>s.distance/(s.duration*(s.easy?.26:.31));
export const isGliding=(level,s)=>!!LEVELS[level]?.glide&&GLIDE_WINDOWS.some(([a,b])=>progress(s)>=a&&progress(s)<b);

// Every painting a level + hero needs, and what stands in for one that is not
// there yet (the jungle set and the boy always exist).
const FALLBACK={'city-day':'jungle-tempel','sky-day':'jungle-watervallen','obstacle-barrier':'obstacle-log','obstacle-cone':'obstacle-rock','obstacle-bird':'obstacle-log','obstacle-storm':'obstacle-rock','scenery-lamp':'scenery-tree','scenery-building':'scenery-tree','scenery-tree-city':'scenery-tree','scenery-cloud':'scenery-fern','scenery-balloon':'scenery-tree','scenery-island':'scenery-bridge','collectible-city-card':'collectible-jungle-card','collectible-sky-card':'collectible-jungle-card'};
export function assetNames(level,hero){const L=LEVELS[level];const names=new Set([...L.scenes,L.obstacles.log,L.obstacles.rock,L.card,'collectible-coin',...L.props.map(p=>p.name)]);for(const f of ['run-01','run-02','run-03','run-04','jump','flip','glide'])names.add(`hero-${hero}-${f}`);for(const n of [...names])if(FALLBACK[n])names.add(FALLBACK[n]);if(hero!=='boy')for(const f of ['run-01','run-02','run-03','run-04','jump','flip','glide'])names.add(`hero-boy-${f}`);names.add('hero-boy-jump');return [...names];}
// The painting that stands in for a missing one: a girl frame → the boy's, a level prop → its jungle cousin, a glide pose → the jump pose.
export function resolveName(name,cache){if(cache[name])return name;if(FALLBACK[name]&&cache[FALLBACK[name]])return FALLBACK[name];const m=name.match(/^hero-girl-(.+)$/);if(m&&cache['hero-boy-'+m[1]])return 'hero-boy-'+m[1];if(/^hero-.+-glide$/.test(name)){const j=name.replace('glide','jump');return cache[j]?j:'hero-boy-jump';}return name;}
const one=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Afbeelding kon niet laden: '+src));im.src=src;});
// img/manifest.json lists the paintings that exist, so a level whose art is not
// finished asks for nothing that is missing (no 404s) and takes its stand-ins at once.
let manifest=null;
async function present(base){if(manifest)return manifest;try{const r=await fetch(new URL('manifest.json',base).href);manifest=new Set(await r.json());}catch{manifest=null;}return manifest;}
export async function loadAssets(base,names,cache={}){
 const have=await present(base);
 await Promise.all(names.map(async name=>{if(cache[name]!==undefined)return;if(have&&!have.has(name)){cache[name]=null;return;}try{cache[name]=await one(new URL(name+'.png',base).href);}catch{cache[name]=null;}}));
 const images={};for(const name of names){const im=cache[resolveName(name,cache)];if(!im)throw new Error('Afbeelding kon niet laden: '+name);images[name]=im;}
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
 setLevel(level,scene){this.level=LEVELS[level]?level:'jungle';const L=LEVELS[this.level];this.scene=scene&&L.scenes.includes(scene)?scene:L.scenes[0];this.isNight=L.night(this.scene);}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.max(360,Math.round(rect.width*dpr));this.canvas.height=Math.max(540,Math.round(rect.height*dpr));}
 // The track bends: everything at a depth slides sideways by the same amount.
 off(depth){return this.curve*depth*depth;}
 point(l,z){const depth=itemDepth(z),p=project((l-1)*1.04,depth);p.x+=this.off(depth);return p;}
 shoulder(){const L=LEVELS[this.level],key=L.shoulder+(this.isNight?'-night':'');return this.tiles[key]??=tile(L.shoulder,this.isNight);}
 // Trees, plants and obstacles get a moonlit copy for the evening scene (made once).
 night(name){if(!/^(scenery|obstacle)-/.test(name))return this.images[name];this.nightImages??={};if(this.nightImages[name])return this.nightImages[name];const im=this.images[name],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#0a2740';g.globalAlpha=.5;g.fillRect(0,0,c.width,c.height);return this.nightImages[name]=c;}
 image(name,x,y,w,angle=0,alpha=1){const im=this.isNight?this.night(name):this.images[name];if(!im)return;const g=this.g,h=w*im.height/im.width*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.translate(x,y);g.rotate(angle);g.drawImage(im,-w/2,-h,w,h);g.restore();}
 flip(x,bottom,width,remaining,alpha){const g=this.g,im=this.images[`hero-${this.hero}-flip`],frame=flipFrame(remaining),cw=im.width/4,ch=im.height/2;const h=width*ch/cw*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.drawImage(im,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,x-width/2,bottom-h,width,h);g.restore();}
 event(e){const p=this.point(e.lane??1,1);if(['coin','gold','combo','card','clear','magnet','shield','block','double'].includes(e.type)){const label=this.labelFor?.(e)??({coin:`+${e.value??1}`,gold:`+${e.value??5} GOUD!`,combo:`COMBO +5`,card:'Kaart ontdekt!',clear:'Mooie sprong!',magnet:'MAGNEET!',shield:'SCHILD!',block:'Gered!',double:'DUBBELE MUNTEN!'})[e.type];this.labels.push({x:p.x,y:p.y-160,text:label,life:1});if(!this.reduced)for(let i=0;i<9;i++){const a=i*2.4;this.particles.push({x:p.x,y:p.y-55,vx:Math.cos(a)*80,vy:Math.sin(a)*85-50,life:.65,color:e.type==='card'?'#a2f7ff':'#ffe58e'});}}}

 drawWorld(s,dt){const g=this.g,L=LEVELS[this.level],bg=this.images[this.scene],distance=travel(s),night=this.isNight,gliding=isGliding(this.level,s);
 // a new bend every few seconds, eased; the run starts straight
 if(s.time>this.nextBend){this.nextBend=s.time+4+Math.random()*4;this.curveTarget=s.time<2?0:(Math.random()-.5)*.07;}
 this.curve+=(this.curveTarget-this.curve)*(1-Math.exp(-dt*.8));
 this.glideBlend+=((gliding?1:0)-this.glideBlend)*(1-Math.exp(-dt*3));
 const blend=this.glideBlend;
 g.fillStyle=night?L.sky[1]:L.sky[0];g.fillRect(0,0,600,900);
 // the skyline: the top of the painting, drifting with the bend
 g.drawImage(bg,0,0,bg.width,bg.height*.45,-12-Math.sin(distance*.008)*9-this.curve*900,-8,624,338);
 if(blend<1){
  g.save();g.globalAlpha=1-blend;
  const earth=g.createLinearGradient(0,310,0,900);earth.addColorStop(0,night?'#153b32':L.shoulder==='cloud'?'#c9def5':L.shoulder==='pavement'?'#8f8a80':'#648151');earth.addColorStop(1,night?'#102920':L.shoulder==='cloud'?'#a9c8ee':L.shoulder==='pavement'?'#5c5955':'#243f23');g.fillStyle=earth;g.fillRect(0,310,600,590);
  // Floor inverse projection: each row samples the painting's bottom band at the world depth it shows.
  const sh=this.shoulder();
  for(let y=312;y<902;y+=2){const depth=CAMERA.focal*CAMERA.height/(y-CAMERA.horizon),scale=CAMERA.focal/depth,worldZ=depth+distance,off=this.off(depth);
   const phase=((worldZ/10)%2+2)%2,t=phase<1?phase:2-phase,sy=bg.height*(.80+t*.19),left=300-1.50*scale+off,right=300+1.50*scale+off;
   const K=70,ty=((worldZ*K)%512+512)%512,srcH=Math.max(1,Math.min(48,512-ty,(depth-CAMERA.focal*CAMERA.height/(y+2-CAMERA.horizon))*K)),sw=Math.max(200,Math.min(512,512*depth/9)),sx=((worldZ*.9)%(512-sw+1)+(512-sw+1))%(512-sw+1);
   g.globalAlpha=(1-blend)*Math.min(1,(y-312)/90);g.drawImage(sh,sx,ty,sw,srcH,-2,y,left+2,3);g.drawImage(sh,sx,ty,sw,srcH,right,y,602-right,3);
   g.globalAlpha=1-blend;g.drawImage(bg,bg.width*.30,sy,bg.width*.40,1,left,y,right-left,3);
  }
  g.restore();
 }
 if(blend>0){ // gliding: open sky below, with cloud puffs drifting far beneath
  g.save();g.globalAlpha=blend;const deep=g.createLinearGradient(0,310,0,900);deep.addColorStop(0,'#8fc6f3');deep.addColorStop(1,'#d8ecfd');g.fillStyle=deep;g.fillRect(0,310,600,590);
  for(let i=0;i<14;i++){const depth=sceneryDepth(i,5.5,distance*.6,i*1.3);if(depth>60||depth<1)continue;const p=project(Math.sin(i*2.7)*4.5,depth);p.x+=this.off(depth);g.fillStyle='#ffffff';g.globalAlpha=blend*.8*Math.min(1,(62-depth)/12);g.beginPath();g.ellipse(p.x,p.y+p.scale*.9,p.scale*.7,p.scale*.22,0,0,7);g.ellipse(p.x+p.scale*.35,p.y+p.scale*.82,p.scale*.4,p.scale*.2,0,0,7);g.fill();}
  g.restore();
 }
 // Ground dressing in world space: pebbles along the path edge, flowers in the verge, dapples on the track.
 if(blend<1){g.save();g.beginPath();g.rect(0,310,600,590);g.clip();
  if(L.pebbles)for(let i=0;i<40;i++){const depth=sceneryDepth(i,1.45,distance,i%2?.7:0);if(depth>40||depth<.6)continue;const side=i%2?1:-1,p=project(side*(1.42+(i%3)*.05),depth);p.x+=this.off(depth);g.fillStyle=night?'#6b7f86':'#e6cfa2';g.globalAlpha=Math.min(1,(42-depth)/10);g.beginPath();g.ellipse(p.x,p.y-p.scale*.03,p.scale*.055,p.scale*.03,0,0,7);g.fill();}
  if(L.flowers)for(let i=0;i<36;i++){const depth=sceneryDepth(i,2.05,distance,i%2?1.1:.3);if(depth>34||depth<.6)continue;const side=i%2?1:-1,wob=Math.sin(i*5.3)*.5+.5,p=project(side*(1.95+wob*1.6),depth);p.x+=this.off(depth);g.fillStyle=night?['#7fe0ff','#ffe98a','#ff9ad5'][i%3]:['#ff6d8a','#ffd84d','#ff9d3d','#f4f4ff'][i%4];g.globalAlpha=Math.min(1,(36-depth)/8)*(night?.7:.9);g.beginPath();g.arc(p.x,p.y-p.scale*.06,Math.max(1.2,p.scale*.045),0,7);g.fill();}
  g.globalAlpha=1;
  if(L.dapples)for(let i=0;i<9;i++){const depth=sceneryDepth(i,4.4,distance,i*.9);if(depth>30||depth<.8)continue;const p=project(Math.sin(i*2.1)*1.05,depth);p.x+=this.off(depth);g.fillStyle=night?'#a9e2ff':'#fff5b8';g.globalAlpha=(night?.07:.16)*Math.min(1,(32-depth)/8);g.beginPath();g.ellipse(p.x,p.y-p.scale*.02,p.scale*.62,p.scale*.16,0,0,7);g.fill();}
  g.globalAlpha=1;g.restore();}
 // Trackside scenery at fixed world positions, passing the camera.
 const props=[];
 for(const spec of L.props)for(let i=0;i<24;i++)for(const side of[-1,1]){
  const depth=sceneryDepth(i,spec.spacing,distance,(spec.offset||0)+(side===1?spec.spacing*.47:0));
  if(depth>68||depth<.42)continue;
  const v=Math.sin(i*8.17+side+spec.spacing)*.5+.5;
  const lift=spec.float?(spec.lift?spec.lift[0]+v*(spec.lift[1]-spec.lift[0]):0)+Math.sin(s.time*.8+i)*.15:0;
  props.push({depth,x:side*(spec.x[0]+v*(spec.x[1]-spec.x[0])),name:spec.name,width:spec.w[0]+v*(spec.w[1]-spec.w[0]),lift});
 }
 for(const o of props.sort((a,b)=>b.depth-a.depth)){const p=project(o.x,o.depth);p.x+=this.off(o.depth);this.image(o.name,p.x,p.y-o.lift*p.scale,o.width*p.scale,0,Math.min(1,(70-o.depth)/12,(o.depth-.3)/.5));}
 // light: sun shafts by day, moon glow by night; distance haze hides the recycle boundary
 if(night){const moon=g.createRadialGradient(470,70,4,470,70,190);moon.addColorStop(0,'#d8f3ff55');moon.addColorStop(.35,'#7fc6ff1c');moon.addColorStop(1,'#00000000');g.fillStyle=moon;g.fillRect(200,0,400,320);}
 else if(L.rays){g.save();g.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const x0=120+i*95+Math.sin(s.time*.35+i)*10,ray=g.createLinearGradient(0,0,0,560);ray.addColorStop(0,'#fff6c0'+(i%2?'2a':'20'));ray.addColorStop(1,'#fff6c000');g.fillStyle=ray;g.beginPath();g.moveTo(x0,-10);g.lineTo(x0+26,-10);g.lineTo(x0+150,560);g.lineTo(x0+40,560);g.closePath();g.fill();}
  const sun=g.createRadialGradient(560,30,6,560,30,230);sun.addColorStop(0,'#ffffff8c');sun.addColorStop(.3,'#ffe8a044');sun.addColorStop(1,'#ffe8a000');g.fillStyle=sun;g.fillRect(250,0,350,300);g.restore();}
 const fogC=night?'#073e4b':L.shoulder==='pavement'?'#d7e3ee':L.shoulder==='cloud'?'#e6f2ff':'#bdeadd';
 const fog=g.createLinearGradient(0,280,0,440);fog.addColorStop(0,fogC+'00');fog.addColorStop(.22,fogC+'66');fog.addColorStop(1,'#ffffff00');g.fillStyle=fog;g.fillRect(0,280,600,160);
 return {gliding,blend};
 }

 draw(s,dt,active){const g=this.g,L=LEVELS[this.level];g.setTransform(this.canvas.width/600,0,0,this.canvas.height/900,0,0);
 const {gliding,blend}=this.drawWorld(s,dt);
 const shade=g.createLinearGradient(0,0,0,900);shade.addColorStop(0,'#07284266');shade.addColorStop(.2,'#00000000');shade.addColorStop(.8,'#00000000');shade.addColorStop(1,'#082c4833');g.fillStyle=shade;g.fillRect(0,0,600,900);
 if(!this.reduced){for(let i=0;i<14;i++){const t=s.time*.17+i*2.7,x=(Math.sin(t*.8)*.5+.5)*580,y=180+(i*79+s.time*11)%580;g.fillStyle=this.isNight?'#fff3a0':'#ffffc1';g.globalAlpha=.2+.2*Math.sin(t);g.beginPath();g.arc(x,y,this.isNight?2.5:1.6,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
 const hero=this.hero,liftPx=blend*150; // while gliding the hero and the flying obstacles hang above the (missing) path
 const player=()=>{const p=this.point(s.x,1),jump=height(s),land=s.jump>0?0:Math.sin(s.time*19)*(this.reduced||gliding?0:2);
  if(blend<1){g.fillStyle='#2c27143b';g.globalAlpha=1-blend;g.beginPath();g.ellipse(p.x,p.y+4,39-jump*10,10-jump*3,0,0,7);g.fill();g.globalAlpha=1;}
  const step=Math.floor(s.distance*27);if(active&&!this.reduced&&L.dust&&!gliding&&s.jump<=0&&step!==this.lastStep){this.lastStep=step;for(let i=0;i<3;i++)this.particles.push({x:p.x+(Math.random()-.5)*36,y:p.y+2,vx:(Math.random()-.5)*40,vy:20+Math.random()*40,life:.5,r:5+Math.random()*5,color:L.dust});}
  const alpha=s.cooldown>.15?.72:1,bottom=p.y+17-jump*137-liftPx+(gliding?Math.sin(s.time*1.6)*10:0)+land;
  if(gliding){this.image(`hero-${hero}-glide`,p.x,bottom,236,clampTilt(s)*1.6+this.curve*.6,alpha);}
  else if(s.jump>0&&!this.reduced)this.flip(p.x,bottom,211,s.jump,alpha);
  else this.image(s.jump>0?`hero-${hero}-jump`:`hero-${hero}-run-0${1+Math.floor(s.distance*27)%4}`,p.x,bottom,211,clampTilt(s)+this.curve*.4,alpha);
  if(s.shield){g.save();g.strokeStyle='#99f7ff';g.lineWidth=3;g.fillStyle='#3fd9ff22';g.shadowColor='#63dfff';g.shadowBlur=this.reduced?0:15;g.beginPath();g.ellipse(p.x,p.y-85-jump*137-liftPx,68,110,0,0,Math.PI*2);g.fill();g.stroke();g.restore();}
  if(s.magnet>0){g.strokeStyle='#ec9cff';g.lineWidth=2;for(let i=0;i<2;i++){g.globalAlpha=.65-i*.2;g.beginPath();g.ellipse(p.x,p.y-5-liftPx,70+i*28,17+i*8,0,0,Math.PI*2);g.stroke();}g.globalAlpha=1;}};
 let drawn=false;
 for(const o of [...s.items].sort((a,b)=>a.z-b.z)){if(o.z<0||itemDepth(o.z)<.8)continue;if(o.z>1&&!drawn){player();drawn=true;}if(o.resolved&&!['rock','log'].includes(o.kind))continue;
  const p=this.point(o.lane,o.z);const flies=L.glide&&(gliding||o.kind==='log');const raise=flies?(gliding?liftPx:70)*4/itemDepth(o.z):0; // nearer things are lifted more on screen
  if(s.magnet>0&&['coin','gold'].includes(o.kind)&&o.z>.58){const pull=Math.min(1,(o.z-.58)/.21),target=this.point(s.x,1);p.x+=(target.x-p.x)*pull;p.y+=(target.y-45-p.y)*pull;}
  p.y-=raise;
  if(['magnet','shield','gold','double'].includes(o.kind)){badge(g,o.kind,p.x,p.y-p.scale*.2,p.scale*.45,s.time);continue;}
  const width=p.scale*(o.kind==='coin'?.30:o.kind==='card'?.42:.73);const name=o.kind==='coin'?'collectible-coin':o.kind==='card'?L.card:L.obstacles[o.kind];const lift=o.kind==='coin'?p.scale*.24:0;
  if(o.kind==='coin'||o.kind==='card'){g.save();g.shadowColor=o.kind==='coin'?'#ffe590':'#b988ff';g.shadowBlur=this.reduced?0:12;this.image(name,p.x,p.y-lift,width,this.reduced?0:Math.sin(s.time*2+o.z)*.05);g.restore();if(o.kind==='coin'&&!this.reduced&&((s.time*1.6+o.z*7)%1)<.18){const r=width*.55,cx=p.x+width*.28,cy=p.y-lift-width*.95;g.fillStyle='#ffffffd9';g.beginPath();g.moveTo(cx,cy-r);g.quadraticCurveTo(cx,cy,cx+r,cy);g.quadraticCurveTo(cx,cy,cx,cy+r);g.quadraticCurveTo(cx,cy,cx-r,cy);g.quadraticCurveTo(cx,cy,cx,cy-r);g.fill();}}
  else{if(!flies){g.fillStyle='#1f200b40';g.beginPath();g.ellipse(p.x,p.y,width*.43,width*.09,0,0,7);g.fill();}const bob=flies&&!this.reduced?Math.sin(s.time*6+o.lane)*p.scale*.03:0;this.image(name,p.x,p.y+bob,width,flies&&o.kind==='log'?Math.sin(s.time*9)*.06:0);}}
 if(!drawn)player();
 for(const p of this.particles){if(active){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;}g.globalAlpha=Math.max(0,p.life/.65)*(p.r?.55:1);g.fillStyle=p.color;if(p.r){g.beginPath();g.arc(p.x,p.y,p.r*(1.6-p.life),0,7);g.fill();}else g.fillRect(p.x,p.y,4,4);}g.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
 for(const p of this.labels){if(active){p.life-=dt;p.y-=35*dt;}g.globalAlpha=Math.min(1,Math.max(0,p.life*2));g.font='900 23px system-ui';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#63491a';g.strokeText(p.text,p.x,p.y);g.fillStyle='#fff4b4';g.fillText(p.text,p.x,p.y);}g.globalAlpha=1;this.labels=this.labels.filter(p=>p.life>0);
 }
 destroy(){this.particles=[];this.labels=[];}
}
function clampTilt(s){return Math.max(-.08,Math.min(.08,(s.lane-s.x)*.09));}
