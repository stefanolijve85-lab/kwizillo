// Transparent full-body render → 3:4 frame on a flat chroma green, for the talking-video model.
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [src,out]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage();const b64=fs.readFileSync(src).toString('base64');
const r=await p.evaluate(async b64=>{const i=new Image();i.src='data:image/png;base64,'+b64;await i.decode();const W=i.width,H=i.height;
 const c0=document.createElement('canvas');c0.width=W;c0.height=H;const g0=c0.getContext('2d');g0.drawImage(i,0,0);const d=g0.getImageData(0,0,W,H).data;
 let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(d[(y*W+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
 // character fills 84% of the frame height, centred, with room above for gestures
 const fh=1536,fw=1152,ch=Math.round(fh*.84),s=ch/(y1-y0+1),cw=Math.round((x1-x0+1)*s);
 const c=document.createElement('canvas');c.width=fw;c.height=fh;const g=c.getContext('2d');g.fillStyle='#00b140';g.fillRect(0,0,fw,fh);g.imageSmoothingQuality='high';
 g.drawImage(c0,x0,y0,x1-x0+1,y1-y0+1,Math.round((fw-cw)/2),Math.round(fh*.10),cw,ch);
 return {png:c.toDataURL('image/png').split(',')[1]}},b64);
fs.writeFileSync(out,Buffer.from(r.png,'base64'));console.log(out,fs.statSync(out).size);await b.close()})();
