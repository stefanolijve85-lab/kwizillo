import {flipFrame} from './flip.js';
import {height} from './engine.js';
import {badge} from './arcade-icons.js';
import {CAMERA,travel,project,itemDepth,sceneryDepth} from './world.js';
export const assetNames=['jungle-watervallen','jungle-tempel','jungle-avond','runner-run-01','runner-run-02','runner-run-03','runner-run-04','runner-jump','runner-flip-atlas','obstacle-log','obstacle-rock','collectible-coin','collectible-jungle-card','scenery-tree','scenery-fern'];
export async function loadAssets(base){const images={};await Promise.all(assetNames.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;resolve();};im.onerror=()=>reject(new Error('Afbeelding kon niet laden: '+name));im.src=new URL(name+'.png',base).href;})));return images;}
// A tile of jungle grass (blades, clumps, a little ground colour) drawn once;
// the floor samples it row by row in perspective so it streams past like the path.
function grassTile(night){const S=512;const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
 g.fillStyle=night?'#14382e':'#4f8d36';g.fillRect(0,0,S,S);
 let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 // Round clumps and short dashes in every direction: the floor magnifies the
 // near rows a lot, and this kind of texture stays leafy when it is enlarged.
 const day=['#3f7a2c','#5c9f3f','#72b64d','#3a6f27','#86c95a','#a5da6b','#2f6222'],dark=['#0f2d25','#1a4437','#23533f','#0c2620','#2c6a50','#0a1f19'];
 for(let i=0;i<900;i++){g.fillStyle=(night?dark:day)[i%(night?6:7)];g.globalAlpha=.55;const r=3+rnd()*rnd()*26;g.beginPath();g.ellipse(rnd()*S,rnd()*S,r,r*(.5+rnd()*.5),rnd()*3.2,0,7);g.fill();}
 g.globalAlpha=.9;g.lineCap='round';
 for(let i=0;i<2200;i++){const x=rnd()*S,y=rnd()*S,l=2+rnd()*5,a=rnd()*6.3;g.strokeStyle=(night?dark:day)[(i*3)%(night?6:7)];g.lineWidth=1.5+rnd()*2;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
 g.globalAlpha=1;
 return c;}
export class Renderer{
 constructor(canvas,images){this.grass={day:grassTile(false),night:grassTile(true)};this.canvas=canvas;this.g=canvas.getContext('2d',{alpha:false});if(!this.g)throw Error('Canvas niet beschikbaar');this.images=images;this.particles=[];this.labels=[];this.reduced=false;this.resize();}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.max(360,Math.round(rect.width*dpr));this.canvas.height=Math.max(540,Math.round(rect.height*dpr));}
 point(l,z){return project((l-1)*1.04,itemDepth(z));}
 // Trees, plants and obstacles get a moonlit copy for the evening theme (made once).
 night(name){if(!['scenery-tree','scenery-fern','obstacle-log','obstacle-rock'].includes(name))return this.images[name];this.nightImages??={};if(this.nightImages[name])return this.nightImages[name];const im=this.images[name],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#0a2740';g.globalAlpha=.5;g.fillRect(0,0,c.width,c.height);return this.nightImages[name]=c;}
 image(name,x,y,w,angle=0,alpha=1){const im=this.isNight?this.night(name):this.images[name];if(!im)return;const g=this.g,h=w*im.height/im.width*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.translate(x,y);g.rotate(angle);g.drawImage(im,-w/2,-h,w,h);g.restore();}
 flip(x,bottom,width,remaining,alpha){const g=this.g,im=this.images['runner-flip-atlas'],frame=flipFrame(remaining),cw=im.width/4,ch=im.height/2;
 const h=width*ch/cw*(this.canvas.width/600)/(this.canvas.height/900);
 g.save();g.globalAlpha=alpha;
 g.drawImage(im,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,x-width/2,bottom-h,width,h);g.restore();}
 event(e){const p=this.point(e.lane??1,1);if(['coin','gold','combo','card','clear','magnet','shield','block','double'].includes(e.type)){const label=this.labelFor?.(e)??({coin:`+${e.value??1}`,gold:`+${e.value??5} GOUD!`,combo:`COMBO +5`,card:'Kaart ontdekt!',clear:'Mooie sprong!',magnet:'MAGNEET!',shield:'SCHILD!',block:'Gered!',double:'DUBBELE MUNTEN!'})[e.type];this.labels.push({x:p.x,y:p.y-160,text:label,life:1});if(!this.reduced)for(let i=0;i<9;i++){const a=i*2.4;this.particles.push({x:p.x,y:p.y-55,vx:Math.cos(a)*80,vy:Math.sin(a)*85-50,life:.65,color:e.type==='card'?'#a2f7ff':'#ffe58e'});}}}
 // A continuous floor and world-space scenery replace the old full-screen still.
 drawWorld(s,theme){const g=this.g,bg=this.images['jungle-'+theme],distance=travel(s);
 const night=theme==='avond';this.isNight=night;
 g.fillStyle=night?'#082936':'#83d4db';g.fillRect(0,0,600,900);
 // Only the distant skyline uses the illustration; no fixed road or near trees.
 g.drawImage(bg,0,0,bg.width,bg.height*.45,-12-Math.sin(distance*.008)*9,-8,624,338);
 const earth=g.createLinearGradient(0,310,0,900);earth.addColorStop(0,night?'#153b32':'#648151');earth.addColorStop(1,night?'#102920':'#243f23');g.fillStyle=earth;g.fillRect(0,310,600,590);
 // Floor inverse projection. The sampled world coordinates advance with camera Z.
 for(let y=312;y<902;y+=2){const depth=CAMERA.focal*CAMERA.height/(y-CAMERA.horizon),scale=CAMERA.focal/depth;
 const worldZ=depth+distance,phase=((worldZ/10)%2+2)%2,t=phase<1?phase:2-phase;
 const sy=bg.height*(.80+t*.19),left=300-1.50*scale,right=300+1.50*scale;
 // Moving ground/vegetation shoulders, not stationary artwork.
 
 
 g.drawImage(bg,bg.width*.30,sy,bg.width*.40,1,left,y,right-left,3);
 }
 // Ground dressing, all in world space so it streams past with the camera:
 // mown bands on the grass shoulders, pebbles along the path edge, flowers
 // in the verge and dapples of sunlight on the track.
 g.save();g.beginPath();g.rect(0,310,600,590);g.clip();
 const grass=night?this.grass.night:this.grass.day;
 for(let y=312;y<902;y+=2){const depth=CAMERA.focal*CAMERA.height/(y-CAMERA.horizon),scale=CAMERA.focal/depth,worldZ=depth+distance;
 const left=300-1.50*scale,right=300+1.50*scale,K=70,ty=((worldZ*K)%512+512)%512,sh=Math.max(1,Math.min(48,512-ty,(depth-CAMERA.focal*CAMERA.height/(y+2-CAMERA.horizon))*K)),sw=Math.max(200,Math.min(512,512*depth/9)),sx=((worldZ*.9)%(512-sw+1)+(512-sw+1))%(512-sw+1);
 // the source rect grows with the depth covered by this row, so far rows average many texture rows instead of picking one
 g.globalAlpha=Math.min(1,(y-312)/90);g.drawImage(grass,sx,ty,sw,sh,-2,y,left+2,3);g.drawImage(grass,sx,ty,sw,sh,right,y,602-right,3);}
 g.globalAlpha=1;
 for(let i=0;i<40;i++){const depth=sceneryDepth(i,1.45,distance,i%2?.7:0);if(depth>40||depth<.6)continue;const side=i%2?1:-1,p=project(side*(1.42+(i%3)*.05),depth);
 g.fillStyle=night?'#6b7f86':'#e6cfa2';g.globalAlpha=Math.min(1,(42-depth)/10);g.beginPath();g.ellipse(p.x,p.y-p.scale*.03,p.scale*.055,p.scale*.03,0,0,7);g.fill();}
 for(let i=0;i<36;i++){const depth=sceneryDepth(i,2.05,distance,i%2?1.1:.3);if(depth>34||depth<.6)continue;const side=i%2?1:-1,wob=Math.sin(i*5.3)*.5+.5,p=project(side*(1.95+wob*1.6),depth);
 g.fillStyle=night?['#7fe0ff','#ffe98a','#ff9ad5'][i%3]:['#ff6d8a','#ffd84d','#ff9d3d','#f4f4ff'][i%4];g.globalAlpha=Math.min(1,(36-depth)/8)*(night?.7:.9);
 g.beginPath();g.arc(p.x,p.y-p.scale*.06,Math.max(1.2,p.scale*.045),0,7);g.fill();}
 g.globalAlpha=1;
 for(let i=0;i<9;i++){const depth=sceneryDepth(i,4.4,distance,i*.9);if(depth>30||depth<.8)continue;const p=project(Math.sin(i*2.1)*1.05,depth);
 g.fillStyle=night?'#a9e2ff':'#fff5b8';g.globalAlpha=(night?.07:.16)*Math.min(1,(32-depth)/8);g.beginPath();g.ellipse(p.x,p.y-p.scale*.02,p.scale*.62,p.scale*.16,0,0,7);g.fill();}
 g.globalAlpha=1;g.restore();
 // Trackside trees and plants live at fixed world positions and pass the camera.
 const props=[];
 for(let i=0;i<24;i++)for(const side of[-1,1]){
 const depth=sceneryDepth(i,3.2,distance,side===1?1.5:0);
 if(depth>68||depth<.42)continue;
 const variation=Math.sin(i*8.17+side)*.5+.5;
 props.push({depth,side,x:side*(1.78+variation*.20),kind:'scenery-fern',width:1.5+variation*.6});
 if(i%2===0)props.push({depth:depth+.7,side,x:side*(3.15+variation*.5),kind:'scenery-tree',width:4.5+variation});
 }
 for(const o of props.sort((a,b)=>b.depth-a.depth)){
 const p=project(o.x,o.depth);this.image(o.kind,p.x,p.y,o.width*p.scale,0,Math.min(1,(70-o.depth)/12,(o.depth-.3)/.5));
 }
 // Distance haze hides the recycle boundary, never the foreground.
 if(night){const moon=g.createRadialGradient(470,70,4,470,70,190);moon.addColorStop(0,'#d8f3ff55');moon.addColorStop(.35,'#7fc6ff1c');moon.addColorStop(1,'#00000000');g.fillStyle=moon;g.fillRect(200,0,400,320);}
 else{g.save();g.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const x0=120+i*95+Math.sin(s.time*.35+i)*10,ray=g.createLinearGradient(0,0,0,560);ray.addColorStop(0,'#fff6c0'+(i%2?'2a':'20'));ray.addColorStop(1,'#fff6c000');g.fillStyle=ray;g.beginPath();g.moveTo(x0,-10);g.lineTo(x0+26,-10);g.lineTo(x0+150,560);g.lineTo(x0+40,560);g.closePath();g.fill();}
 const sun=g.createRadialGradient(560,30,6,560,30,230);sun.addColorStop(0,'#ffffff8c');sun.addColorStop(.3,'#ffe8a044');sun.addColorStop(1,'#ffe8a000');g.fillStyle=sun;g.fillRect(250,0,350,300);g.restore();}
 const fog=g.createLinearGradient(0,280,0,440);fog.addColorStop(0,night?'#073e4b00':'#bdeadd00');fog.addColorStop(.22,night?'#073e4b66':'#bdeadd66');fog.addColorStop(1,'#ffffff00');g.fillStyle=fog;g.fillRect(0,280,600,160);
 }
 draw(s,theme,dt,active){const g=this.g;g.setTransform(this.canvas.width/600,0,0,this.canvas.height/900,0,0);
 this.drawWorld(s,theme);
 const shade=g.createLinearGradient(0,0,0,900);shade.addColorStop(0,'#07284266');shade.addColorStop(.2,'#00000000');shade.addColorStop(.8,'#00000000');shade.addColorStop(1,'#082c4833');g.fillStyle=shade;g.fillRect(0,0,600,900);
 if(!this.reduced){for(let i=0;i<14;i++){const t=s.time*.17+i*2.7,x=(Math.sin(t*.8)*.5+.5)*580,y=180+(i*79+s.time*11)%580;g.fillStyle=theme==='avond'?'#fff3a0':'#ffffc1';g.globalAlpha=.2+.2*Math.sin(t);g.beginPath();g.arc(x,y,theme==='avond'?2.5:1.6,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
 const player=()=>{const p=this.point(s.x,1),jump=height(s),land=s.jump>0?0:Math.sin(s.time*19)* (this.reduced?0:2);g.fillStyle='#2c27143b';g.beginPath();g.ellipse(p.x,p.y+4,39-jump*10,10-jump*3,0,0,7);g.fill();const step=Math.floor(s.distance*27);if(active&&!this.reduced&&s.jump<=0&&step!==this.lastStep){this.lastStep=step;for(let i=0;i<3;i++)this.particles.push({x:p.x+(Math.random()-.5)*36,y:p.y+2,vx:(Math.random()-.5)*40,vy:20+Math.random()*40,life:.5,r:5+Math.random()*5,color:'#d9c39b'});}const frame=s.jump>0?'runner-jump':`runner-run-0${1+Math.floor(s.distance*27)%4}`;if(s.jump>0&&!this.reduced)this.flip(p.x,p.y+17-jump*137,211,s.jump,s.cooldown>.15?.72:1);else this.image(frame,p.x,p.y+17-jump*137+land,211,clampTilt(s),s.cooldown>.15?.72:1);if(s.shield){g.save();g.strokeStyle='#99f7ff';g.lineWidth=3;g.fillStyle='#3fd9ff22';g.shadowColor='#63dfff';g.shadowBlur=this.reduced?0:15;g.beginPath();g.ellipse(p.x,p.y-85-jump*137,68,110,0,0,Math.PI*2);g.fill();g.stroke();g.restore();}if(s.magnet>0){g.strokeStyle='#ec9cff';g.lineWidth=2;for(let i=0;i<2;i++){g.globalAlpha=.65-i*.2;g.beginPath();g.ellipse(p.x,p.y-5,70+i*28,17+i*8,0,0,Math.PI*2);g.stroke();}g.globalAlpha=1;}};
 let drawn=false;for(const o of [...s.items].sort((a,b)=>a.z-b.z)){if(o.z<0||itemDepth(o.z)<.8)continue;if(o.z>1&&!drawn){player();drawn=true;}if(o.resolved&&!['rock','log'].includes(o.kind))continue;const p=this.point(o.lane,o.z);if(s.magnet>0&&['coin','gold'].includes(o.kind)&&o.z>.58){const pull=Math.min(1,(o.z-.58)/.21),target=this.point(s.x,1);p.x+=(target.x-p.x)*pull;p.y+=(target.y-45-p.y)*pull;}if(['magnet','shield','gold','double'].includes(o.kind)){badge(g,o.kind,p.x,p.y-p.scale*.2,p.scale*.45,s.time);continue;}const width=p.scale*(o.kind==='coin'?.30:o.kind==='card'?.42:.73);const name=o.kind==='coin'?'collectible-coin':o.kind==='card'?'collectible-jungle-card':'obstacle-'+o.kind;const lift=o.kind==='coin'?p.scale*.24:0;if(o.kind==='coin'||o.kind==='card'){g.save();g.shadowColor=o.kind==='coin'?'#ffe590':'#b988ff';g.shadowBlur=this.reduced?0:12;this.image(name,p.x,p.y-lift,width,this.reduced?0:Math.sin(s.time*2+o.z)*.05);g.restore();if(o.kind==='coin'&&!this.reduced&&((s.time*1.6+o.z*7)%1)<.18){const r=width*.55,cx=p.x+width*.28,cy=p.y-lift-width*.95;g.fillStyle='#ffffffd9';g.beginPath();g.moveTo(cx,cy-r);g.quadraticCurveTo(cx,cy,cx+r,cy);g.quadraticCurveTo(cx,cy,cx,cy+r);g.quadraticCurveTo(cx,cy,cx-r,cy);g.quadraticCurveTo(cx,cy,cx,cy-r);g.fill();}}else{g.fillStyle='#1f200b40';g.beginPath();g.ellipse(p.x,p.y,width*.43,width*.09,0,0,7);g.fill();this.image(name,p.x,p.y,width);}}if(!drawn)player();
 for(const p of this.particles){if(active){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;}g.globalAlpha=Math.max(0,p.life/.65)*(p.r?.55:1);g.fillStyle=p.color;if(p.r){g.beginPath();g.arc(p.x,p.y,p.r*(1.6-p.life),0,7);g.fill();}else g.fillRect(p.x,p.y,4,4);}g.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
 for(const p of this.labels){if(active){p.life-=dt;p.y-=35*dt;}g.globalAlpha=Math.min(1,Math.max(0,p.life*2));g.font='900 23px system-ui';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#63491a';g.strokeText(p.text,p.x,p.y);g.fillStyle='#fff4b4';g.fillText(p.text,p.x,p.y);}g.globalAlpha=1;this.labels=this.labels.filter(p=>p.life>0);
 }
 destroy(){this.particles=[];this.labels=[];}
}
function clampTilt(s){return Math.max(-.08,Math.min(.08,(s.lane-s.x)*.09));}
