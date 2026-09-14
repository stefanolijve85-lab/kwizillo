#!/usr/bin/env node
// Bakes the intro logo's shadow into the PNG (assets/brand/logo-shadow.png).
// iOS Safari renders a CSS drop-shadow() on an animated element as a dark
// rectangle now and then; a shadow that is part of the image never can.
//   node tools/logo-shadow.cjs
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'assets/brand/logo.png')).toString('base64');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const png = await p.evaluate(async src => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const pad = 48, dy = 10, blur = 18;
    const c = document.createElement('canvas'); c.width = img.width + pad * 2; c.height = img.height + pad * 2 + dy;
    const ctx = c.getContext('2d');
    ctx.shadowColor = 'rgba(0,25,94,.55)'; ctx.shadowBlur = blur; ctx.shadowOffsetY = dy;
    ctx.drawImage(img, pad, pad);
    return c.toDataURL('image/png').split(',')[1];
  }, src);
  const dst = path.join(ROOT, 'assets/brand/logo-shadow.png');
  fs.writeFileSync(dst, Buffer.from(png, 'base64'));
  console.log(dst, fs.statSync(dst).size, 'bytes');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
