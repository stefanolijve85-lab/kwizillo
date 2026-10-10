#!/usr/bin/env node
// Mike & Mia: Jump & Slide — the tile pictures, cut from the approved concept
// art (art-source/jump/worlds-concept.png). Only regions without the baked-in
// lettering are used:
//   assets/games/jump-tile.jpg            the Spellenkist tile: Mike and Mia in the sea tunnel
//   assets/games/jump/world-<id>.jpg      the three world pictures on the world picker
//
//   node tools/jump-tiles.cjs
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'art-source', 'jump', 'worlds-concept.png');
const CUTS = [
  ['assets/games/jump-tile.jpg', 0, 128, 880, 245],
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
  await browser.close();
})();
