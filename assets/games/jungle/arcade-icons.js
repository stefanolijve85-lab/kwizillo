// Crisp canvas badges; no generated image quota or external dependencies.
export function badge(g,kind,x,y,size,time=0){g.save();g.translate(x,y-size*.52);const r=size*.5;
const colors=kind==='magnet'?['#fd87ea','#874de6']:kind==='shield'?['#88f7ff','#068ed9']:['#ffec87','#efa617'];
const fill=g.createLinearGradient(0,-r,0,r);fill.addColorStop(0,colors[0]);fill.addColorStop(1,colors[1]);g.shadowColor=colors[0];g.shadowBlur=12;g.fillStyle=fill;g.strokeStyle='#ffffffdc';g.lineWidth=Math.max(1,size*.035);g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();g.stroke();g.shadowBlur=0;g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=size*.12;g.lineCap='round';
if(kind==='magnet'){g.beginPath();g.moveTo(-r*.4,-r*.35);g.lineTo(-r*.4,r*.1);g.arc(0,r*.1,r*.4,Math.PI,0,true);g.lineTo(r*.4,-r*.35);g.stroke();g.strokeStyle='#5541a2';g.lineWidth=size*.08;for(const sign of[-1,1]){g.beginPath();g.moveTo(sign*r*.4,-r*.36);g.lineTo(sign*r*.4,-r*.2);g.stroke();}}
else if(kind==='shield'){g.beginPath();g.moveTo(0,-r*.58);g.lineTo(r*.48,-r*.33);g.lineTo(r*.39,r*.26);g.quadraticCurveTo(r*.2,r*.52,0,r*.65);g.quadraticCurveTo(-r*.2,r*.52,-r*.39,r*.26);g.lineTo(-r*.48,-r*.33);g.closePath();g.fill();g.strokeStyle='#1575c9';g.lineWidth=size*.055;g.beginPath();g.moveTo(-r*.2,0);g.lineTo(-r*.03,r*.17);g.lineTo(r*.25,-r*.19);g.stroke();}
else{g.fillStyle='#875516';g.font=`900 ${size*.39}px system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillText(kind==='double'?'×2':'+5',0,0);}
g.restore();}
