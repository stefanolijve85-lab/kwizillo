#!/usr/bin/env node
// Every buddy cut out of its own picture, at one size, centred.
//
// The renders each came on their own backdrop — lavender, peach, mint, a dark
// vignette, a grass scene, a painted frame — so a row of them in the collection
// was a row of coloured boxes, each cropped differently. This cuts the
// character out, centres it and draws it on a transparent 640x512 canvas, the
// shape the tiles are shown in. The tile then carries the character and nothing
// else; the card behind it supplies the colour.
//
//   node tools/mascot-tiles.cjs            → assets/mascots/tile/<id>.png
//   node tools/mascot-tiles.cjs --check    → fails if a tile is missing or stale
//
// The cutting is done by tools/cutout.swift, which asks macOS for the same
// subject mask that Preview's "Remove Background" uses: it knows what a
// character is, which a colour rule does not — one backdrop is a flat tint and
// the next one is a scene. Nothing leaves this machine. The centring and the
// scaling happen here, on the Chromium that Playwright already installs.
const fs = require('fs'); const path = require('path'); const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'mascots');
const OUT = path.join(SRC, 'tile');
const W = 640, H = 512;          // 5:4, the shape of the tiles in the collection
const FILL = 0.94;               // how much of the height the character takes
const check = process.argv.includes('--check');

const sources = () => fs.readdirSync(SRC).filter(f => /\.jpg$/.test(f)).sort();
const tileOf = file => path.join(OUT, file.replace(/\.jpg$/, '.png'));

(async () => {
  const stale = sources().filter(f => {
    const out = tileOf(f);
    return !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(path.join(SRC, f)).mtimeMs;
  });
  if (check) {
    if (stale.length) { console.error(`mascot tiles missing or stale: ${stale.join(', ')}\nrun: node tools/mascot-tiles.cjs`); process.exit(1) }
    console.log(`mascot tiles: ${sources().length} up to date ✔`);
    return;
  }

  // 1. Cut every buddy out of its backdrop.
  const cutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kwizillo-cutout-'));
  const files = sources();
  try {
    execFileSync('swift', [path.join(__dirname, 'cutout.swift'), ...files.map(f => path.join(SRC, f)), cutDir], { stdio: 'inherit' });
  } catch (e) {
    console.error('\nCutting out failed. tools/cutout.swift needs macOS 14 or newer and the Xcode command line tools.');
    process.exit(1);
  }

  // 2. Centre each cut-out on the tile, every buddy at the same size.
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');
  console.log('');
  for (const file of files) {
    const cut = path.join(cutDir, file.replace(/\.jpg$/, '.png'));
    if (!fs.existsSync(cut)) { console.error(`${file}: no cut-out, skipped`); continue }
    const data = 'data:image/png;base64,' + fs.readFileSync(cut).toString('base64');
    const result = await page.evaluate(async ({ data, W, H, FILL }) => {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      // Where the character actually is: the box around everything that is not
      // see-through. A stray half-transparent pixel does not count.
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (px[(y * c.width + x) * 4 + 3] < 24) continue;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 < 0) return null;
      const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
      const tile = document.createElement('canvas'); tile.width = W; tile.height = H;
      const tg = tile.getContext('2d');
      tg.imageSmoothingQuality = 'high';
      const scale = Math.min((H * FILL) / sh, (W * 0.92) / sw);
      const dw = sw * scale, dh = sh * scale;
      tg.drawImage(c, x0, y0, sw, sh, (W - dw) / 2, (H - dh) / 2, dw, dh);
      return { url: tile.toDataURL('image/png'), box: [sw, sh] };
    }, { data, W, H, FILL });
    if (!result) { console.error(`${file}: the cut-out came back empty, skipped`); continue }
    const out = tileOf(file);
    fs.writeFileSync(out, Buffer.from(result.url.split(',')[1], 'base64'));
    console.log(`${file}: character ${result.box[0]}x${result.box[1]} → ${path.basename(out)} (${(fs.statSync(out).size / 1024).toFixed(0)} kB)`);
  }
  await browser.close();
  // The old boxed JPEG tiles are replaced by these cut-outs.
  for (const f of fs.readdirSync(OUT).filter(f => /\.jpg$/.test(f))) fs.unlinkSync(path.join(OUT, f));
  fs.rmSync(cutDir, { recursive: true, force: true });
  console.log(`\n${files.length} tiles written to assets/mascots/tile/ (${W}x${H}, transparent)`);
})();
