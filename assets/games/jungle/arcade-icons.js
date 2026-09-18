// Pickup badges drawn on the canvas: a glossy sphere with a soft glow, a
// floating bob and a glyph — no generated image quota or external dependencies.
export function badge(g,kind,x,y,size,time=0){g.save();g.translate(x,y-size*.52-Math.sin(time*3+x*.01)*size*.06);const r=size*.5;
const colors=kind==='magnet'?['#ffb3f2','#e15bd4','#6b2fb8']:kind==='shield'?['#c8fbff','#3dd2ff','#0b6fc2']:kind==='speed'?['#fff0b0','#ff9a2e','#c4361c']:['#fff6b3','#ffcf3a','#d98a0f'];
// soft outer glow (gradient, no hard edge)
const glow=g.createRadialGradient(0,0,r*.6,0,0,r*1.7);glow.addColorStop(0,colors[1]+'66');glow.addColorStop(.6,colors[1]+'22');glow.addColorStop(1,colors[1]+'00');g.fillStyle=glow;g.beginPath();g.arc(0,0,r*1.7,0,Math.PI*2);g.fill();
// glossy sphere
const fill=g.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r);fill.addColorStop(0,colors[0]);fill.addColorStop(.45,colors[1]);fill.addColorStop(1,colors[2]);g.fillStyle=fill;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();
const rim=g.createRadialGradient(0,0,r*.82,0,0,r);rim.addColorStop(0,'#ffffff00');rim.addColorStop(1,'#ffffff55');g.fillStyle=rim;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();
g.fillStyle='#ffffffaa';g.beginPath();g.ellipse(-r*.32,-r*.45,r*.26,r*.16,-.6,0,Math.PI*2);g.fill();
g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=size*.12;g.lineCap='round';g.lineJoin='round';g.shadowColor='#00000055';g.shadowBlur=size*.06;g.shadowOffsetY=size*.03;
if(kind==='magnet'){g.beginPath();g.moveTo(-r*.4,-r*.35);g.lineTo(-r*.4,r*.1);g.arc(0,r*.1,r*.4,Math.PI,0,true);g.lineTo(r*.4,-r*.35);g.stroke();g.shadowBlur=0;g.strokeStyle='#ff6b6b';g.lineWidth=size*.12;for(const sign of[-1,1]){g.beginPath();g.moveTo(sign*r*.4,-r*.36);g.lineTo(sign*r*.4,-r*.16);g.stroke();}}
else if(kind==='shield'){g.beginPath();g.moveTo(0,-r*.58);g.lineTo(r*.48,-r*.33);g.lineTo(r*.39,r*.26);g.quadraticCurveTo(r*.2,r*.52,0,r*.65);g.quadraticCurveTo(-r*.2,r*.52,-r*.39,r*.26);g.lineTo(-r*.48,-r*.33);g.closePath();g.fill();g.shadowBlur=0;g.strokeStyle='#1575c9';g.lineWidth=size*.055;g.beginPath();g.moveTo(-r*.2,0);g.lineTo(-r*.03,r*.17);g.lineTo(r*.25,-r*.19);g.stroke();}
else if(kind==='speed'){g.fillStyle='#fff';g.beginPath();g.moveTo(r*.12,-r*.62);g.lineTo(-r*.34,r*.06);g.lineTo(-r*.02,r*.06);g.lineTo(-r*.14,r*.62);g.lineTo(r*.36,-r*.1);g.lineTo(r*.04,-r*.1);g.closePath();g.fill();}
else{g.shadowBlur=0;g.fillStyle='#7a4a08';g.font=`1000 ${size*.4}px system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillText(kind==='double'?'×2':'+5',0,r*.02);}
g.restore();}

// The shield around the hero: a soft bubble made of gradients only (no outlines), breathing slowly.
export function shieldAura(g,x,y,rx,ry,time,reduced){g.save();g.translate(x,y);const k=reduced?1:1+Math.sin(time*2.4)*.03;g.scale(k,k);
const bubble=g.createRadialGradient(0,0,ry*.45,0,0,ry);bubble.addColorStop(0,'#7fe6ff08');bubble.addColorStop(.6,'#7fe6ff2a');bubble.addColorStop(.86,'#9df0ffb4');bubble.addColorStop(.95,'#e8fcffd0');bubble.addColorStop(1,'#e8fcff00');
g.fillStyle=bubble;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
g.globalCompositeOperation='lighter';const hi=g.createRadialGradient(-rx*.35,-ry*.45,2,-rx*.35,-ry*.45,rx*.55);hi.addColorStop(0,'#ffffff80');hi.addColorStop(1,'#ffffff00');g.fillStyle=hi;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
g.restore();}

// The magnet at work: soft pink pulses that ripple in towards the hero's feet.
export function magnetAura(g,x,y,time,reduced){g.save();g.translate(x,y);g.globalCompositeOperation='lighter';
const n=reduced?1:3;for(let k=0;k<n;k++){const phase=reduced?.35:((time*1.3+k/n)%1);const r=40+(1-phase)*120,a=Math.min(1,Math.max(0,phase)*(1-phase*.3)*1.6);
const ring=g.createRadialGradient(0,0,r*.8,0,0,r);ring.addColorStop(0,'#ff8cf000');ring.addColorStop(.55,`rgba(255,110,235,${a.toFixed(3)})`);ring.addColorStop(1,'#ff8cf000');
g.fillStyle=ring;g.beginPath();g.ellipse(0,0,r*1.5,r*.5,0,0,Math.PI*2);g.fill();}
const core=g.createRadialGradient(0,0,4,0,0,70);core.addColorStop(0,'#ff9df0aa');core.addColorStop(1,'#ffb3f200');g.fillStyle=core;g.beginPath();g.ellipse(0,0,110,36,0,0,Math.PI*2);g.fill();
g.restore();}
