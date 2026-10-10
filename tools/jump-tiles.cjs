#!/usr/bin/env node
// Mike & Mia: Jump & Slide — the tile pictures, cut from the approved concept
// art (art-source/jump/worlds-concept.png). Only regions without the baked-in
// lettering are used:
//   assets/games/jump-tile.jpg            the Runners tile: Mike and Mia in the sea tunnel, zoomed out like the
//                                         Runner tile; the lettered top band is replaced by lettering-free glass
//                                         from the right of the same strip, faded in above the children's heads
//   assets/games/jump/world-<id>.jpg      the three world pictures on the world picker
//
//   node tools/jump-tiles.cjs
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'art-source', 'jump', 'worlds-concept.png');
const CUTS = [
  ['assets/games/jump/world-underwater.jpg', 1040, 0, 632, 300],
  ['assets/games/jump/world-candy.jpg', 610, 378, 560, 300],
  ['assets/games/jump/world-space.jpg', 610, 686, 600, 255]
];
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto('about:blank');
  const data = 'data:image/png;base64,' + fs.readFileSync(SRC).toString('base64');
  for (const [out, x, y, w, h] of CUTS) {
    const url = await page.evaluate(async ({ data, x, y, w, h }) => {
      const img = new Image(); await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.drawImage(img, x, y, w, h, 0, 0, w, h); return c.toDataURL('image/jpeg', .86);
    }, { data, x, y, w, h });
    fs.writeFileSync(path.join(ROOT, out), Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${out}  ${w}×${h}  ${(fs.statSync(path.join(ROOT, out)).size / 1024).toFixed(0)} kB`);
  }
  const tile = await page.evaluate(async ({ data }) => {
    const img = new Image(); await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
    const X = 110, W = 580, H = 370, SEAM = 118, F = 26;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.drawImage(img, X, 0, W, H, 0, 0, W, H);
    const t = document.createElement('canvas'); t.width = W; t.height = SEAM; const tg = t.getContext('2d');
    tg.drawImage(img, img.width - W, 0, W, SEAM, 0, 0, W, SEAM);
    const grad = tg.createLinearGradient(0, 0, 0, SEAM);
    grad.addColorStop(0, '#000'); grad.addColorStop((SEAM - F) / SEAM, '#000'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    tg.globalCompositeOperation = 'destination-in'; tg.fillStyle = grad; tg.fillRect(0, 0, W, SEAM);
    g.drawImage(t, 0, 0); return c.toDataURL('image/jpeg', .88);
  }, { data });
  fs.writeFileSync(path.join(ROOT, 'assets/games/jump-tile.jpg'), Buffer.from(tile.split(',')[1], 'base64'));
  console.log('assets/games/jump-tile.jpg  580×370');
  await browser.close();
})();
