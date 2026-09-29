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
if(kind==='magnet'){g.shadowColor='transparent';magnet3d(g,r);}
else if(kind==='shield'){g.beginPath();g.moveTo(0,-r*.58);g.lineTo(r*.48,-r*.33);g.lineTo(r*.39,r*.26);g.quadraticCurveTo(r*.2,r*.52,0,r*.65);g.quadraticCurveTo(-r*.2,r*.52,-r*.39,r*.26);g.lineTo(-r*.48,-r*.33);g.closePath();g.fill();g.shadowBlur=0;g.strokeStyle='#1575c9';g.lineWidth=size*.055;g.beginPath();g.moveTo(-r*.2,0);g.lineTo(-r*.03,r*.17);g.lineTo(r*.25,-r*.19);g.stroke();}
else if(kind==='speed'){g.shadowColor='transparent';bolt3d(g,r);}
else{g.shadowBlur=0;g.fillStyle='#7a4a08';g.font=`1000 ${size*.4}px system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillText(kind==='double'?'×2':'+5',0,r*.02);}
g.restore();}

// The shield around the hero: a soft bubble made of gradients only (no outlines), breathing slowly.
export function shieldAura(g,x,y,rx,ry,time,reduced){g.save();g.translate(x,y);const k=reduced?1:1+Math.sin(time*2.4)*.03;g.scale(k,k);
const bubble=g.createRadialGradient(0,0,ry*.45,0,0,ry);bubble.addColorStop(0,'#7fe6ff08');bubble.addColorStop(.6,'#7fe6ff2a');bubble.addColorStop(.86,'#9df0ffb4');bubble.addColorStop(.95,'#e8fcffd0');bubble.addColorStop(1,'#e8fcff00');
g.fillStyle=bubble;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
g.globalCompositeOperation='lighter';const hi=g.createRadialGradient(-rx*.35,-ry*.45,2,-rx*.35,-ry*.45,rx*.55);hi.addColorStop(0,'#ffffff80');hi.addColorStop(1,'#ffffff00');g.fillStyle=hi;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
g.restore();}

// The magnet at work: a soft pink halo around the hero, breathing, no outlines — the sister of the shield bubble.
export function magnetAura(g,x,y,rx,ry,time,reduced){g.save();g.translate(x,y);const k=reduced?1:1+Math.sin(time*3.1)*.04;g.scale(k,k);
const halo=g.createRadialGradient(0,0,ry*.3,0,0,ry);halo.addColorStop(0,'#ff8ff000');halo.addColorStop(.55,'#ff8ff01c');halo.addColorStop(.82,'#ffa6f27a');halo.addColorStop(.94,'#ffd6fbb0');halo.addColorStop(1,'#ffd6fb00');
g.fillStyle=halo;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
g.globalCompositeOperation='lighter';const hi=g.createRadialGradient(rx*.3,-ry*.4,2,rx*.3,-ry*.4,rx*.5);hi.addColorStop(0,'#ffffff66');hi.addColorStop(1,'#ffffff00');g.fillStyle=hi;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
g.restore();}

// Symbols with body: the magnet and the lightning bolt used to be flat white
// strokes on the sphere. Each is now drawn as a solid object — a darker side
// stacked a few pixels down-right for thickness, a lit face with a gradient
// on top, and a thin highlight along the upper edge.
const DEPTH=[.035,.07,.1];
function magnetPath(g,r){g.beginPath();g.moveTo(-r*.38,-r*.4);g.lineTo(-r*.38,r*.06);g.arc(0,r*.06,r*.38,Math.PI,0,true);g.lineTo(r*.38,-r*.4);}
function magnet3d(g,r){g.lineCap='butt';g.lineJoin='round';const w=r*.3;
 for(const d of DEPTH){g.save();g.translate(r*d,r*d);g.strokeStyle='#6d0f1f';g.lineWidth=w;magnetPath(g,r);g.stroke();g.restore();}
 const body=g.createLinearGradient(0,-r*.45,0,r*.5);body.addColorStop(0,'#ff8f97');body.addColorStop(.45,'#f0303f');body.addColorStop(1,'#a8121f');
 g.strokeStyle=body;g.lineWidth=w;magnetPath(g,r);g.stroke();
 // silver poles, with their own side
 for(const sx of[-1,1]){const x=sx*r*.38-w/2,y=-r*.52,h=r*.2;
  for(const d of DEPTH){g.fillStyle='#4b5566';g.fillRect(x+r*d,y+r*d,w,h);}
  const m=g.createLinearGradient(x,0,x+w,0);m.addColorStop(0,'#ffffff');m.addColorStop(.5,'#d6dde6');m.addColorStop(1,'#8e9aab');g.fillStyle=m;g.fillRect(x,y,w,h);
  g.fillStyle='#ffffffcc';g.fillRect(x,y,w,h*.22);}
 // shine down the lit left arm
 g.strokeStyle='#ffffffb0';g.lineWidth=w*.18;g.lineCap='round';g.beginPath();g.moveTo(-r*.38-w*.26,-r*.3);g.lineTo(-r*.38-w*.26,r*.06);g.stroke();}
function boltPath(g,r){g.beginPath();g.moveTo(r*.16,-r*.74);g.lineTo(-r*.43,r*.09);g.lineTo(-r*.05,r*.09);g.lineTo(-r*.18,r*.74);g.lineTo(r*.45,-r*.13);g.lineTo(r*.07,-r*.13);g.closePath();}
function bolt3d(g,r){g.lineJoin='round';
 for(const d of DEPTH){g.save();g.translate(r*d,r*d);g.fillStyle='#8a2c05';boltPath(g,r);g.fill();g.restore();}
 const face=g.createLinearGradient(-r*.3,-r*.6,r*.3,r*.6);face.addColorStop(0,'#fffbe0');face.addColorStop(.35,'#ffe45a');face.addColorStop(1,'#ff9d0a');
 g.fillStyle=face;boltPath(g,r);g.fill();
 g.strokeStyle='#7a2500';g.lineWidth=r*.07;boltPath(g,r);g.stroke();
 g.fillStyle=face;boltPath(g,r);g.fill();
 g.strokeStyle='#ffffffd0';g.lineWidth=r*.06;g.lineCap='round';g.beginPath();g.moveTo(r*.11,-r*.58);g.lineTo(-r*.27,r*.02);g.stroke();}
