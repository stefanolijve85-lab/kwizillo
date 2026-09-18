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
export const LEVELS={
 jungle:{scenes:['jungle-watervallen','jungle-tempel','jungle-avond'],night:scene=>scene==='jungle-avond',shoulder:'grass',sky:['#83d4db','#082936'],rays:false,sun:true,dust:'#d9c39b',air:{kind:'swing',windows:[[.30,.41],[.70,.81]]},extras:['jungle-ravine','jungle-ravine-edge','scenery-liana'],
  obstacles:{log:'obstacle-log',rock:'obstacle-rock'},card:'collectible-jungle-card',cardId:'jungle-leaf',pebbles:true,flowers:true,dapples:true,
  props:[{name:'scenery-fern',spacing:3.2,x:[1.78,1.98],w:[1.5,2.1]},{name:'scenery-tree',spacing:6.4,offset:.7,x:[3.15,3.65],w:[4.5,5.5]}]},
 stad:{scenes:['city-day'],night:()=>false,shoulder:'pavement',sky:['#9fd0f5'],rays:false,dust:'#c9c9cf',
  obstacles:{log:'obstacle-barrier',rock:'obstacle-cone'},card:'collectible-city-card',cardId:'city-star',pebbles:false,flowers:false,dapples:false,
  props:[{name:'scenery-lamp',spacing:4.8,x:[1.85,1.85],w:[1.4,1.4]},{name:'scenery-building',spacing:5.6,offset:1.1,x:[4.2,5.4],w:[6.5,9]},{name:'scenery-tree-city',spacing:9.6,offset:2.9,x:[2.6,2.9],w:[2.6,3.2]}]},
 lucht:{scenes:['sky-day'],night:()=>false,shoulder:'cloud',sky:['#69b4f2'],rays:true,sun:true,dust:null,glide:true,air:{kind:'glide',windows:[[.22,.46],[.66,.88]]},
  obstacles:{log:'obstacle-bird',rock:'obstacle-storm'},card:'collectible-sky-card',cardId:'sky-feather',pebbles:false,flowers:false,dapples:false,
  props:[{name:'scenery-cloud',spacing:3.6,x:[2.2,3.4],w:[2.4,4],float:true},{name:'scenery-balloon',spacing:15,offset:3,x:[3.6,5.2],w:[2.1,2.9],float:true,lift:[1.8,3.4]},{name:'scenery-island',spacing:14,offset:7,x:[4,6],w:[5,7],float:true,lift:[-.4,.4]}]},
};
// Stretches where the path lets go (fractions of the run, by distance): the sky
// level hands the child a glider, the jungle a liana to swing on.
export const progress=s=>s.distance/(s.duration*(s.easy?.26:.31));
export const airborne=(level,s)=>{const air=LEVELS[level]?.air;if(!air)return null;const p=progress(s);return air.windows.some(([a,b])=>p>=a&&p<b)?air.kind:null;};
export const isGliding=(level,s)=>!!airborne(level,s);

// Every painting a level + hero needs, and what stands in for one that is not
// there yet (the jungle set and the boy always exist).
const FALLBACK={'city-day':'jungle-tempel','sky-day':'jungle-watervallen','obstacle-barrier':'obstacle-log','obstacle-cone':'obstacle-rock','obstacle-bird':'obstacle-log','obstacle-storm':'obstacle-rock','scenery-lamp':'scenery-tree','scenery-building':'scenery-tree','scenery-tree-city':'scenery-tree','scenery-cloud':'scenery-fern','scenery-balloon':'scenery-tree','scenery-island':'scenery-bridge','collectible-city-card':'collectible-jungle-card','collectible-sky-card':'collectible-jungle-card'};
export function assetNames(level,hero){const L=LEVELS[level];const names=new Set([...L.scenes,L.obstacles.log,L.obstacles.rock,L.card,'collectible-coin',...L.props.map(p=>p.name),...(L.extras||[])]);for(const f of ['run-01','run-02','run-03','run-04','jump','flip','glide','swing'])names.add(`hero-${hero}-${f}`);for(const n of [...names])if(FALLBACK[n])names.add(FALLBACK[n]);if(hero!=='boy')for(const f of ['run-01','run-02','run-03','run-04','jump','flip','glide','swing'])names.add(`hero-boy-${f}`);names.add('hero-boy-jump');names.add('hero-boy-run-02');names.add('hero-girl-run-02');for(const l of Object.values(LEVELS))names.add(l.scenes[0]);names.add('hero-boy-portrait');names.add('hero-girl-portrait');return [...names];}
// The painting that stands in for a missing one: a girl frame → the boy's, a level prop → its jungle cousin, a glide pose → the jump pose.
export function resolveName(name,cache){if(cache[name]||(manifest&&manifest.has(name)))return name;if(FALLBACK[name]&&cache[FALLBACK[name]])return FALLBACK[name];const m=name.match(/^hero-girl-(.+)$/);if(m&&cache['hero-boy-'+m[1]])return 'hero-boy-'+m[1];if(/^hero-.+-(glide|swing)$/.test(name)){const j=name.replace(/glide|swing/,'jump');return cache[j]?j:'hero-boy-jump';}if(/^hero-.+-portrait$/.test(name)){const j=name.replace('portrait','run-02');return cache[j]?j:'hero-boy-run-02';}return name;}
const one=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Afbeelding kon niet laden: '+src));im.src=src;});
// img/manifest.json lists the paintings that exist, so a level whose art is not
// finished asks for nothing that is missing (no 404s) and takes its stand-ins at once.
let manifest=null;export let stamp='';
export const versioned=url=>stamp?url+(url.includes('?')?'&':'?')+'v='+stamp:url;
async function present(base){if(manifest)return manifest;try{const r=await fetch(new URL('manifest.json',base).href,{cache:'no-cache'});const j=await r.json();const list=Array.isArray(j)?j:j.files;stamp=Array.isArray(j)?'':String(j.v||'');manifest=new Set(list);}catch{manifest=null;}return manifest;}
export async function loadAssets(base,names,cache={}){
 const have=await present(base);
 await Promise.all(names.map(async name=>{if(cache[name]!==undefined)return;if(have&&!have.has(name)){cache[name]=null;return;}try{cache[name]=await one(versioned(new URL(name+'.png',base).href));}catch{cache[name]=null;}}));
 const optional=/^(jungle-ravine|jungle-ravine-edge|scenery-liana)$/;
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
 setLevel(level,scene){this.level=LEVELS[level]?level:'jungle';const L=LEVELS[this.level];this.scene=scene&&L.scenes.includes(scene)?scene:L.scenes[0];this.isNight=L.night(this.scene);}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.max(360,Math.round(rect.width*dpr));this.canvas.height=Math.max(540,Math.round(rect.height*dpr));}
 // The track bends: everything at a depth slides sideways by the same amount.
 off(depth){return this.curve*depth*depth;}
 point(l,z){const depth=itemDepth(z),p=project((l-1)*1.04,depth);p.x+=this.off(depth);return p;}
 // The canyon painting scrolled (ping-pong, so no seam) into a device-sized buffer once per frame; the floor rows copy from it 1:1.
 canyon(im,distance){const ky=this.canvas.height/900,W=Math.round(this.canvas.width/2),H=Math.round(588*ky);if(!this.canyonBuf||this.canyonBuf.width!==W||this.canyonBuf.height!==H){this.canyonBuf=document.createElement('canvas');this.canyonBuf.width=W;this.canyonBuf.height=H;}const c=this.canyonBuf,g=c.getContext('2d');if(this.canyonAt===distance)return c;this.canyonAt=distance;const segH=W*im.height/im.width*1.45,sc=distance*.045*(590/.85*ky)/segH,k0=Math.floor(sc);g.clearRect(0,0,W,H);for(let k=k0;k<=k0+Math.ceil(H/segH)+1;k++){const top=(k-sc)*segH;if(top>H||top+segH<0)continue;g.save();if(((k%2)+2)%2){g.translate(0,top+segH);g.scale(1,-1);g.drawImage(im,0,0,W,segH);}else g.drawImage(im,0,top,W,segH);g.restore();}return c;}
 // The cliff-edge painting with its foreground path fading out at the bottom, so it melts into the track (made once).
 faded(im){if(this.fadedEdge)return this.fadedEdge;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='destination-out';const grad=g.createLinearGradient(0,im.height*.68,0,im.height);grad.addColorStop(0,'#0000');grad.addColorStop(1,'#000');g.fillStyle=grad;g.fillRect(0,0,im.width,im.height);return this.fadedEdge=c;}
 shoulder(){const L=LEVELS[this.level],key=L.shoulder+(this.isNight?'-night':'');return this.tiles[key]??=tile(L.shoulder,this.isNight);}
 // Trees, plants and obstacles get a moonlit copy for the evening scene (made once).
 night(name){if(!/^(scenery|obstacle)-/.test(name))return this.images[name];this.nightImages??={};if(this.nightImages[name])return this.nightImages[name];const im=this.images[name],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#0a2740';g.globalAlpha=.5;g.fillRect(0,0,c.width,c.height);return this.nightImages[name]=c;}
 image(name,x,y,w,angle=0,alpha=1){const im=this.isNight?this.night(name):this.images[name];if(!im)return;const g=this.g,h=w*im.height/im.width*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.translate(x,y);g.rotate(angle);g.drawImage(im,-w/2,-h,w,h);g.restore();}
 flip(x,bottom,width,remaining,alpha){const g=this.g,im=this.images[`hero-${this.hero}-flip`],frame=flipFrame(remaining),cw=im.width/4,ch=im.height/2;const h=width*ch/cw*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.drawImage(im,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,x-width/2,bottom-h,width,h);g.restore();}
 event(e){const p=this.point(e.lane??1,1);if(['coin','gold','combo','card','clear','magnet','shield','block','double','speed'].includes(e.type)){const label=this.labelFor?.(e)??({coin:`+${e.value??1}`,gold:`+${e.value??5} GOUD!`,combo:`COMBO +5`,card:'Kaart ontdekt!',clear:'Mooie sprong!',magnet:'MAGNEET!',shield:'SCHILD!',block:'Gered!',double:'DUBBELE MUNTEN!',speed:'TURBO!'})[e.type];this.labels.push({x:p.x,y:p.y-160,text:label,life:1});if(!this.reduced)for(let i=0;i<9;i++){const a=i*2.4;this.particles.push({x:p.x,y:p.y-55,vx:Math.cos(a)*80,vy:Math.sin(a)*85-50,life:.65,color:e.type==='card'?'#a2f7ff':'#ffe58e'});}}}

 drawWorld(s,dt){const g=this.g,L=LEVELS[this.level],bg=this.images[this.scene],distance=travel(s),night=this.isNight,air=airborne(this.level,s),gliding=!!air;
 // a new bend every few seconds, eased; the run starts straight
 if(s.time>this.nextBend){this.nextBend=s.time+4+Math.random()*4;this.curveTarget=s.time<2?0:(Math.random()-.5)*.045;}
 this.curve+=(this.curveTarget-this.curve)*(1-Math.exp(-dt*.8));
 this.glideBlend+=((gliding?1:0)-this.glideBlend)*(1-Math.exp(-dt*3));
 const blend=this.glideBlend;
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
 const earthTop=night?'#173d33':L.shoulder==='cloud'?'#d9e9f9':L.shoulder==='pavement'?'#b4afa4':'#6a9a4a',earthMid=night?'#123327':L.shoulder==='cloud'?'#c3daf3':L.shoulder==='pavement'?'#a19c91':'#4f8a3a',earthBot=night?'#0d2a20':L.shoulder==='cloud'?'#aecbee':L.shoulder==='pavement'?'#7f7a70':'#3a6f2c';
 const earth=g.createLinearGradient(0,310,0,900);earth.addColorStop(0,earthTop);earth.addColorStop(.5,earthMid);earth.addColorStop(1,earthBot);g.fillStyle=earth;g.fillRect(0,310,600,590);
 const deep=g.createLinearGradient(0,310,0,900);deep.addColorStop(0,chasm[0]);deep.addColorStop(.35,chasm[1]);deep.addColorStop(1,chasm[2]);
 let prevGap=false;this.gapRows=null;this.gapEdges=null;
 for(let y=312;y<902;y+=2){const depth=CAMERA.focal*CAMERA.height/(y-CAMERA.horizon),scale=CAMERA.focal/depth,worldZ=depth+distance,off=this.off(depth);
  const gap=gapAt(depth);
  if(gap){if(ravine){g.fillStyle=deep;g.fillRect(0,y,600,2);if(!this.gapRows)this.gapRows=[];this.gapRows.push([y,Math.min(600,220+scale*2.1),off]);}else{g.fillStyle=deep;g.fillRect(0,y,600,3);const wall=night?'#1c2f22':'#5f7a45';g.fillStyle=wall;g.fillRect(300-1.9*scale,y,.4*scale,3);g.fillRect(300+1.5*scale,y,.4*scale,3);}
   if(!prevGap){if(edge){}else{g.fillStyle=night?'#0a1f16':L.air?.kind==='swing'?'#24462a':'#9fc9ee';g.fillRect(0,y-4,600,5);}}prevGap=true;continue;}
  if(prevGap){if(edge){(this.gapEdges??=[]).push([y,scale,off]);}else if(L.air?.kind==='swing'){g.fillStyle=night?'#0a1f16':'#3a2a18';g.fillRect(300-1.6*scale,y-2,3.2*scale,4);}else{g.fillStyle=L.air?.kind==='swing'?'#2b4a2a':'#c9def5';g.fillRect(0,y,600,3);}}prevGap=false;
  const phase=((worldZ/10)%2+2)%2,t=phase<1?phase:2-phase,sy=bg.height*(.80+t*.19),left=300-1.50*scale+off,right=300+1.50*scale+off;
  g.drawImage(bg,bg.width*.30,sy,bg.width*.40,1,left,y,right-left,3);
 }
 if(this.gapRows&&this.gapRows.length){/* the canyon is one image, clipped to the gap's trapezoid: the walls widen as they come nearer and nothing is resampled row by row */const rows=this.gapRows;const buf=this.canyon(ravine,distance);g.save();g.beginPath();let first=true;for(const [ry,rw,ro] of rows){const x=300-rw/2+ro;if(first){g.moveTo(x,ry);first=false;}else g.lineTo(x,ry);}for(let i=rows.length-1;i>=0;i--){const [ry,rw,ro]=rows[i];g.lineTo(300+rw/2+ro,ry+2);}g.closePath();g.clip();const ky=this.canvas.height/900;g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(buf,0,0,buf.width,buf.height,0,Math.round(312*ky),this.canvas.width,buf.height);g.restore();g.restore();this.gapRows=null;if(edge&&this.gapEdges){for(const [ey,es,eo] of this.gapEdges){/* the painting shows the path breaking off: its foreground path sits on the first path row, the cliff hangs into the canyon above */const w=Math.min(600,300+es*1.7),h=w*edge.height/edge.width;g.drawImage(this.faded(edge),300-w/2+eo,ey-h*.72,w,h);}}this.gapEdges=null;}
 if(blend>0&&L.air?.kind==='glide'){ // cloud puffs drifting far beneath the glide
  g.save();for(let i=0;i<14;i++){const depth=sceneryDepth(i,5.5,distance*.6,i*1.3);if(depth>60||depth<1||!gapAt(depth))continue;const p=project(Math.sin(i*2.7)*4.5,depth);p.x+=this.off(depth);g.fillStyle='#ffffff';g.globalAlpha=.8*Math.min(1,(62-depth)/12);g.beginPath();g.ellipse(p.x,p.y+p.scale*.9,p.scale*.7,p.scale*.22,0,0,7);g.ellipse(p.x+p.scale*.35,p.y+p.scale*.82,p.scale*.4,p.scale*.2,0,0,7);g.fill();}g.restore();
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
  props.push({depth,x:side*(spec.x[0]+v*(spec.x[1]-spec.x[0])),name:spec.name,width:spec.w[0]+v*(spec.w[1]-spec.w[0]),lift});
 }
 for(const o of props.sort((a,b)=>b.depth-a.depth)){const p=project(o.x,o.depth);p.x+=this.off(o.depth);this.image(o.name,p.x,p.y-o.lift*p.scale,o.width*p.scale,0,Math.min(1,(70-o.depth)/12,(o.depth-.3)/.5));}
 // light: sun shafts by day, moon glow by night; distance haze hides the recycle boundary
 if(night){const moon=g.createRadialGradient(470,70,4,470,70,190);moon.addColorStop(0,'#d8f3ff55');moon.addColorStop(.35,'#7fc6ff1c');moon.addColorStop(1,'#00000000');g.fillStyle=moon;g.fillRect(200,0,400,320);}
 else if(L.rays||L.sun){g.save();g.globalCompositeOperation='lighter';if(L.rays)for(let i=0;i<4;i++){const x0=120+i*95+Math.sin(s.time*.35+i)*10,ray=g.createLinearGradient(0,0,0,560);ray.addColorStop(0,'#fff6c0'+(i%2?'2a':'20'));ray.addColorStop(1,'#fff6c000');g.fillStyle=ray;g.beginPath();g.moveTo(x0,-10);g.lineTo(x0+26,-10);g.lineTo(x0+150,560);g.lineTo(x0+40,560);g.closePath();g.fill();}
  if(L.sun){const sun=g.createRadialGradient(560,30,6,560,30,230);sun.addColorStop(0,'#ffffff8c');sun.addColorStop(.3,'#ffe8a044');sun.addColorStop(1,'#ffe8a000');g.fillStyle=sun;g.fillRect(250,0,350,300);}g.restore();}
 const fogC=night?'#073e4b':L.shoulder==='pavement'?'#d7e3ee':L.shoulder==='cloud'?'#e6f2ff':'#bdeadd';
 const fog=g.createLinearGradient(0,280,0,440);fog.addColorStop(0,fogC+'00');fog.addColorStop(.22,fogC+'66');fog.addColorStop(1,'#ffffff00');g.fillStyle=fog;g.fillRect(0,280,600,160);
 return {gliding,blend,air};
 }

 draw(s,dt,active){const g=this.g,L=LEVELS[this.level];g.setTransform(this.canvas.width/600,0,0,this.canvas.height/900,0,0);
 const {gliding,blend,air}=this.drawWorld(s,dt);
 const shade=g.createLinearGradient(0,0,0,900);shade.addColorStop(0,'#07284266');shade.addColorStop(.2,'#00000000');shade.addColorStop(.8,'#00000000');shade.addColorStop(1,'#082c4833');g.fillStyle=shade;g.fillRect(0,0,600,900);
 if(!this.reduced){for(let i=0;i<14;i++){const t=s.time*.17+i*2.7,x=(Math.sin(t*.8)*.5+.5)*580,y=180+(i*79+s.time*11)%580;g.fillStyle=this.isNight?'#fff3a0':'#ffffc1';g.globalAlpha=.2+.2*Math.sin(t);g.beginPath();g.arc(x,y,this.isNight?2.5:1.6,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
 const hero=this.hero,liftPx=blend*150; // while gliding the hero and the flying obstacles hang above the (missing) path
 const player=()=>{const p=this.point(s.x,1),jump=height(s),land=s.jump>0?0:Math.sin(s.time*19)*(this.reduced||gliding?0:2);
  if(blend<1){g.fillStyle='#2c27143b';g.globalAlpha=1-blend;g.beginPath();g.ellipse(p.x,p.y+4,39-jump*10,10-jump*3,0,0,7);g.fill();g.globalAlpha=1;}
  const step=Math.floor(s.distance*27);if(active&&!this.reduced&&L.dust&&!gliding&&s.jump<=0&&step!==this.lastStep){this.lastStep=step;for(let i=0;i<3;i++)this.particles.push({x:p.x+(Math.random()-.5)*36,y:p.y+2,vx:(Math.random()-.5)*40,vy:20+Math.random()*40,life:.5,r:5+Math.random()*5,color:L.dust});}
  const sway=air==='swing'?Math.sin(s.time*2.1)*.22:0;
  const alpha=s.cooldown>.15?.72:1,bottom=p.y+17-jump*137-liftPx+(gliding?Math.sin(s.time*1.6)*10:0)+land;
  const mix=blend; // 0 = on the ground, 1 = fully airborne; poses cross-fade in between
  if(air==='swing'||(mix>0&&L.air?.kind==='swing')){ // the liana: the painted pose holds its own vine; the stand-in (jump pose) gets a drawn one from high above
   const sw=this.images[`hero-${hero}-swing`],spriteH=211*sw.height/sw.width*(this.canvas.width/600)/(this.canvas.height/900);const hx=p.x+Math.sin(s.time*2.1)*26,top={x:p.x-Math.sin(s.time*2.1)*60,y:-40},hh=spriteH*(1-(hero==="girl"?.316:.209))-34,hand={x:hx+Math.sin(sway)*hh,y:bottom-Math.cos(sway)*hh};/* the fists sit this far below the sprite's top edge */const liana=this.images['scenery-liana'];
   if(liana){const ang=Math.atan2(hand.x-top.x,hand.y-top.y),len=Math.hypot(hand.x-top.x,hand.y-top.y)+8,w=len*liana.width/liana.height;g.save();g.globalAlpha=alpha*mix;g.translate(top.x,top.y);g.rotate(-ang);g.drawImage(liana,-w/2,0,w,len);g.restore();}
   else if(!manifest?.has(`hero-${hero}-swing`)){g.save();g.strokeStyle=this.isNight?'#3c5a2a':'#5c7a2f';g.lineWidth=9;g.lineCap='round';g.beginPath();g.moveTo(top.x,top.y);g.quadraticCurveTo(top.x+(hand.x-top.x)*.4,top.y+(hand.y-top.y)*.55,hand.x,hand.y);g.stroke();g.strokeStyle=this.isNight?'#5a7d3a':'#8fb23f';g.lineWidth=4;g.stroke();g.restore();}
   if(mix<1)this.image(s.jump>0?`hero-${hero}-jump`:`hero-${hero}-run-0${1+Math.floor(s.distance*27)%4}`,p.x,bottom,211,clampTilt(s),alpha*(1-mix));
   this.image(`hero-${hero}-swing`,hx,bottom,211,sway,alpha*mix);}
  else if(gliding||(mix>0&&L.air?.kind==='glide')){if(mix<1)this.image(s.jump>0?`hero-${hero}-jump`:`hero-${hero}-run-0${1+Math.floor(s.distance*27)%4}`,p.x,bottom,211,clampTilt(s),alpha*(1-mix));this.image(`hero-${hero}-glide`,p.x,bottom,236,clampTilt(s)*1.6+this.curve*.6,alpha*mix);}
  else if(s.jump>0&&!this.reduced)this.flip(p.x,bottom,211,s.jump,alpha);
  else this.image(s.jump>0?`hero-${hero}-jump`:`hero-${hero}-run-0${1+Math.floor(s.distance*27)%4}`,p.x,bottom,211,clampTilt(s)+this.curve*.4,alpha);
  if(s.shield)shieldAura(g,p.x,p.y-85-jump*137-liftPx,74,116,s.time,this.reduced);
  if(s.magnet>0)magnetAura(g,p.x,p.y-85-jump*137-liftPx,86,130,s.time,this.reduced);};
 let drawn=false;
 for(const o of [...s.items].sort((a,b)=>a.z-b.z)){if(o.z<0||itemDepth(o.z)<.8)continue;if(o.z>1&&!drawn){player();drawn=true;}if(o.resolved&&!['rock','log'].includes(o.kind))continue;
  const p=this.point(o.lane,o.z);const flies=gliding||(L.glide&&o.kind==='log');const raise=flies?(gliding?liftPx:70)*4/itemDepth(o.z):0; // nearer things are lifted more on screen
  if(s.magnet>0&&['coin','gold'].includes(o.kind)&&o.z>.58){const pull=Math.min(1,(o.z-.58)/.21),target=this.point(s.x,1);p.x+=(target.x-p.x)*pull;p.y+=(target.y-45-p.y)*pull;}
  p.y-=raise;
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
