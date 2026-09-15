// Mouthless Milo renders → cut-outs (alpha box + 4 % pad, 720 px tall) and, per pose,
// where the mouth goes on the screen (fractions of the cut-out), printed as JSON.
const {chromium}=require('playwright');const fs=require('fs');
const I='incoming',OUT='assets/mascots/milo';
const jobs=[['milo-voorzijde.png','talk'],['milo-zwaaien.png','wave'],['milo-wijzen.png','point-right'],['milo-nadenken.png','think'],['milo-juichen.png','cheer']];
(async()=>{const b=await chromium.launch();const p=await b.newPage();const mouths={};
for(const [src,name] of jobs){const b64=fs.readFileSync(`${I}/${src}`).toString('base64');
 const r=await p.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const W=img.width,H=img.height;
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,W,H).data;
  let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(d[(y*W+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
  const pad=Math.round((y1-y0)*.04);x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(W-1,x1+pad);y1=Math.min(H-1,y1+pad);
  const w=x1-x0+1,h=y1-y0+1,TH=720,scale=TH/h;const o=document.createElement('canvas');o.width=Math.round(w*scale);o.height=TH;const og=o.getContext('2d');og.imageSmoothingQuality='high';og.drawImage(c,x0,y0,w,h,0,0,o.width,o.height);
  // the face screen: largest dark opaque blob in the upper half of the cut-out
  const ow=o.width,oh=o.height,dd=og.getImageData(0,0,ow,oh).data;const lum=i=>dd[i*4]*.3+dd[i*4+1]*.59+dd[i*4+2]*.11;const ok=i=>dd[i*4+3]>200&&lum(i)<70;
  const lab=new Int32Array(ow*oh);let best=null,n=0;const limit=Math.round(oh*.5)*ow;
  for(let i=0;i<limit;i++){if(lab[i]||!ok(i))continue;n++;const q=[i];lab[i]=n;let sx0=ow,sy0=oh,sx1=0,sy1=0,cnt=0;
   while(q.length){const j=q.pop();cnt++;const x=j%ow,y=(j/ow)|0;if(x<sx0)sx0=x;if(x>sx1)sx1=x;if(y<sy0)sy0=y;if(y>sy1)sy1=y;for(const k of [j-1,j+1,j-ow,j+ow]){if(k<0||k>=limit||lab[k]||!ok(k))continue;if((k===j-1&&x===0)||(k===j+1&&x===ow-1))continue;lab[k]=n;q.push(k)}}
   if(!best||cnt>best.cnt)best={x0:sx0,y0:sy0,x1:sx1,y1:sy1,cnt}}
  const sw=best.x1-best.x0,sh=best.y1-best.y0;
  const mouth={x:+((best.x0+sw*.5)/ow).toFixed(3),y:+((best.y0+sh*.74)/oh).toFixed(3),w:+((sw*.2)/ow).toFixed(3),h:+((sh*.14)/oh).toFixed(3)};
  return {w:ow,h:oh,mouth,png:o.toDataURL('image/png').split(',')[1]}},b64);
 fs.writeFileSync(`${OUT}/${name}.png`,Buffer.from(r.png,'base64'));mouths[name]=r.mouth;console.log(name,r.w+'x'+r.h,Math.round(fs.statSync(`${OUT}/${name}.png`).size/1024)+'KB',JSON.stringify(r.mouth))}
await b.close()})();
