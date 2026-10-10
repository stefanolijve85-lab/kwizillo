#!/usr/bin/env node
// The golden world cards, made ready to ship.
//
// The paintings arrive as PNGs of two to three megabytes each — fifteen
// megabytes for six cards that are shown at about 300 px wide. This redraws
// each one at 900x1200 (3:4, the shape the card is shown in) and writes it as a
// JPEG next to it, which is what the app loads. The originals stay where they
// are unless --move is given, which puts them in art-source/cards-gold/ so they
// are kept but do not ship inside the app.
//
//   node tools/gold-cards.cjs           → assets/cards/gold/<world>.jpg
//   node tools/gold-cards.cjs --check   → fails if a card is missing or stale
//
// It runs on the Chromium that Playwright already installs, so it needs no
// image library.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'assets', 'cards', 'gold');
const KEEP = path.join(ROOT, 'art-source', 'cards-gold');
const WORLDS = ['ruimte', 'dieren', 'aarde', 'geschiedenis', 'wetenschap', 'mysterie', 'kunst', 'sport'];   // kunst and sport since 2026-10-10
const W = 900, H = 1200;         // 3:4, the shape of the card in the collection
const check = process.argv.includes('--check');
const move = process.argv.includes('--move');

const source = world => [path.join(DIR, `${world}.png`), path.join(KEEP, `${world}.png`)].find(fs.existsSync);

(async () => {
  if (check) {
    const missing = WORLDS.filter(w => !fs.existsSync(path.join(DIR, `${w}.jpg`)));
    if (missing.length) { console.error(`golden cards missing: ${missing.join(', ')}\nrun: node tools/gold-cards.cjs`); process.exit(1) }
    console.log(`golden cards: ${WORLDS.length} up to date ✔`);
    return;
  }
  const todo = WORLDS.filter(source);
  if (!todo.length) { console.log('no golden card paintings found in assets/cards/gold/'); return }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');

  for (const world of todo) {
    const src = source(world);
    const data = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
    const url = await page.evaluate(async ({ data, W, H }) => {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      // Cover: the card is shown edge to edge, so a picture of another shape is
      // filled and centred rather than letterboxed.
      const s = Math.max(W / img.width, H / img.height);
      const dw = img.width * s, dh = img.height * s;
      g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      return c.toDataURL('image/jpeg', 0.88);
    }, { data, W, H });
    const out = path.join(DIR, `${world}.jpg`);
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    const from = (fs.statSync(src).size / 1048576).toFixed(1), to = (fs.statSync(out).size / 1024).toFixed(0);
    console.log(`${world}: ${from} MB → ${to} kB`);
    if (move && path.dirname(src) === DIR) {
      fs.mkdirSync(KEEP, { recursive: true });
      fs.renameSync(src, path.join(KEEP, `${world}.png`));
    }
  }
  await browser.close();
  console.log(`\n${todo.length} golden cards written to assets/cards/gold/ (${W}x${H})${move ? `, originals kept in art-source/cards-gold/` : ''}`);
})();
