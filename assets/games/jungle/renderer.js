import {flipFrame} from './flip.js';
import {height} from './engine.js';
import {badge} from './arcade-icons.js';
import {CAMERA,travel,project,itemDepth,sceneryDepth} from './world.js';
export const assetNames=['jungle-watervallen','jungle-tempel','jungle-avond','runner-run-01','runner-run-02','runner-run-03','runner-run-04','runner-jump','runner-flip-atlas','obstacle-log','obstacle-rock','collectible-coin','collectible-jungle-card','scenery-tree','scenery-fern'];
export async function loadAssets(base){const images={};await Promise.all(assetNames.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;resolve();};im.onerror=()=>reject(new Error('Afbeelding kon niet laden: '+name));im.src=new URL(name+'.png',base).href;})));return images;}
export class Renderer{
 constructor(canvas,images){this.canvas=canvas;this.g=canvas.getContext('2d',{alpha:false});if(!this.g)throw Error('Canvas niet beschikbaar');this.images=images;this.particles=[];this.labels=[];this.reduced=false;this.resize();}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.max(360,Math.round(rect.width*dpr));this.canvas.height=Math.max(540,Math.round(rect.height*dpr));}
 point(l,z){return project((l-1)*1.04,itemDepth(z));}
 image(name,x,y,w,angle=0,alpha=1){const im=this.images[name];if(!im)return;const g=this.g,h=w*im.height/im.width*(this.canvas.width/600)/(this.canvas.height/900);g.save();g.globalAlpha=alpha;g.translate(x,y);g.rotate(angle);g.drawImage(im,-w/2,-h,w,h);g.restore();}
 flip(x,bottom,width,remaining,alpha){const g=this.g,im=this.images['runner-flip-atlas'],frame=flipFrame(remaining),cw=im.width/4,ch=im.height/2;
 const h=width*ch/cw*(this.canvas.width/600)/(this.canvas.height/900);
 g.save();g.globalAlpha=alpha;
 g.drawImage(im,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,x-width/2,bottom-h,width,h);g.restore();}
 event(e){const p=this.point(e.lane??1,1);if(['coin','gold','combo','card','clear','magnet','shield','block','double'].includes(e.type)){const label=this.labelFor?.(e)??({coin:`+${e.value??1}`,gold:`+${e.value??5} GOUD!`,combo:`COMBO +5`,card:'Kaart ontdekt!',clear:'Mooie sprong!',magnet:'MAGNEET!',shield:'SCHILD!',block:'Gered!',double:'DUBBELE MUNTEN!'})[e.type];this.labels.push({x:p.x,y:p.y-160,text:label,life:1});if(!this.reduced)for(let i=0;i<9;i++){const a=i*2.4;this.particles.push({x:p.x,y:p.y-55,vx:Math.cos(a)*80,vy:Math.sin(a)*85-50,life:.65,color:e.type==='card'?'#a2f7ff':'#ffe58e'});}}}
 // A continuous floor and world-space scenery replace the old full-screen still.
 drawWorld(s,theme){const g=this.g,bg=this.images['jungle-'+theme],distance=travel(s);
 const night=theme==='avond';
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
 // Trackside trees and plants live at fixed world positions and pass the camera.
 const props=[];
 for(let i=0;i<24;i++)for(const side of[-1,1]){
 const depth=sceneryDepth(i,3.2,distance,side===1?1.5:0);
 if(depth>68||depth<.7)continue;
 const variation=Math.sin(i*8.17+side)*.5+.5;
 props.push({depth,side,x:side*(1.78+variation*.20),kind:'scenery-fern',width:1.5+variation*.6});
 if(i%2===0)props.push({depth:depth+.7,side,x:side*(3.15+variation*.5),kind:'scenery-tree',width:4.5+variation});
 }
 for(const o of props.sort((a,b)=>b.depth-a.depth)){
 const p=project(o.x,o.depth);this.image(o.kind,p.x,p.y,o.width*p.scale,0,Math.min(1,(70-o.depth)/12));
 }
 // Distance haze hides the recycle boundary, never the foreground.
 const fog=g.createLinearGradient(0,280,0,440);fog.addColorStop(0,night?'#073e4b00':'#bdeadd00');fog.addColorStop(.22,night?'#073e4b66':'#bdeadd66');fog.addColorStop(1,'#ffffff00');g.fillStyle=fog;g.fillRect(0,280,600,160);
 }
 draw(s,theme,dt,active){const g=this.g;g.setTransform(this.canvas.width/600,0,0,this.canvas.height/900,0,0);
 this.drawWorld(s,theme);
 const shade=g.createLinearGradient(0,0,0,900);shade.addColorStop(0,'#07284266');shade.addColorStop(.2,'#00000000');shade.addColorStop(.8,'#00000000');shade.addColorStop(1,'#082c4833');g.fillStyle=shade;g.fillRect(0,0,600,900);
 if(!this.reduced){for(let i=0;i<14;i++){const t=s.time*.17+i*2.7,x=(Math.sin(t*.8)*.5+.5)*580,y=180+(i*79+s.time*11)%580;g.fillStyle=theme==='avond'?'#fff3a0':'#ffffc1';g.globalAlpha=.2+.2*Math.sin(t);g.beginPath();g.arc(x,y,theme==='avond'?2.5:1.6,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
 const player=()=>{const p=this.point(s.x,1),jump=height(s),land=s.jump>0?0:Math.sin(s.time*19)* (this.reduced?0:2);g.fillStyle='#2c27143b';g.beginPath();g.ellipse(p.x,p.y+4,39-jump*10,10-jump*3,0,0,7);g.fill();const frame=s.jump>0?'runner-jump':`runner-run-0${1+Math.floor(s.distance*27)%4}`;if(s.jump>0&&!this.reduced)this.flip(p.x,p.y+17-jump*137,211,s.jump,s.cooldown>.15?.72:1);else this.image(frame,p.x,p.y+17-jump*137+land,211,clampTilt(s),s.cooldown>.15?.72:1);if(s.shield){g.save();g.strokeStyle='#99f7ff';g.lineWidth=3;g.fillStyle='#3fd9ff22';g.shadowColor='#63dfff';g.shadowBlur=this.reduced?0:15;g.beginPath();g.ellipse(p.x,p.y-85-jump*137,68,110,0,0,Math.PI*2);g.fill();g.stroke();g.restore();}if(s.magnet>0){g.strokeStyle='#ec9cff';g.lineWidth=2;for(let i=0;i<2;i++){g.globalAlpha=.65-i*.2;g.beginPath();g.ellipse(p.x,p.y-5,70+i*28,17+i*8,0,0,Math.PI*2);g.stroke();}g.globalAlpha=1;}};
 let drawn=false;for(const o of [...s.items].sort((a,b)=>a.z-b.z)){if(o.z<0||itemDepth(o.z)<.8)continue;if(o.z>1&&!drawn){player();drawn=true;}if(o.resolved&&!['rock','log'].includes(o.kind))continue;const p=this.point(o.lane,o.z);if(s.magnet>0&&['coin','gold'].includes(o.kind)&&o.z>.58){const pull=Math.min(1,(o.z-.58)/.21),target=this.point(s.x,1);p.x+=(target.x-p.x)*pull;p.y+=(target.y-45-p.y)*pull;}if(['magnet','shield','gold','double'].includes(o.kind)){badge(g,o.kind,p.x,p.y-p.scale*.2,p.scale*.45,s.time);continue;}const width=p.scale*(o.kind==='coin'?.30:o.kind==='card'?.42:.73);const name=o.kind==='coin'?'collectible-coin':o.kind==='card'?'collectible-jungle-card':'obstacle-'+o.kind;const lift=o.kind==='coin'?p.scale*.24:0;if(o.kind==='coin'||o.kind==='card'){g.save();g.shadowColor=o.kind==='coin'?'#ffe590':'#b988ff';g.shadowBlur=this.reduced?0:12;this.image(name,p.x,p.y-lift,width,this.reduced?0:Math.sin(s.time*2+o.z)*.05);g.restore();}else{g.fillStyle='#1f200b40';g.beginPath();g.ellipse(p.x,p.y,width*.43,width*.09,0,0,7);g.fill();this.image(name,p.x,p.y,width);}}if(!drawn)player();
 for(const p of this.particles){if(active){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;}g.globalAlpha=Math.max(0,p.life/.65);g.fillStyle=p.color;g.fillRect(p.x,p.y,4,4);}g.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
 for(const p of this.labels){if(active){p.life-=dt;p.y-=35*dt;}g.globalAlpha=Math.min(1,Math.max(0,p.life*2));g.font='900 23px system-ui';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#63491a';g.strokeText(p.text,p.x,p.y);g.fillStyle='#fff4b4';g.fillText(p.text,p.x,p.y);}g.globalAlpha=1;this.labels=this.labels.filter(p=>p.life>0);
 }
 destroy(){this.particles=[];this.labels=[];}
}
function clampTilt(s){return Math.max(-.08,Math.min(.08,(s.lane-s.x)*.09));}
