#!/usr/bin/env node
// The golden world cards, made ready to ship.
//
// The paintings arrive as PNGs of two to three megabytes each — fifteen
// megabytes for six cards that are shown at about 300 px wide. This redraws
// each one at 900x1200 (3:4, the shape the card is shown in), every card cut out
// along its golden frame and set alike on one sky, and writes it as a
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
      // Every card cut the same way (Stefan, 2026-10-10): the paintings came with
      // the card at different sizes, some on a starry sky and some filling the
      // whole picture. The golden frame is found (columns and rows that are
      // mostly gold), cut out, and set at the same height in the middle of one
      // and the same sky, so all eight sit alike in the collection.
      const sw = 360, sh = Math.round(img.height / img.width * sw), m = document.createElement('canvas');
      m.width = sw; m.height = sh; const mg = m.getContext('2d'); mg.drawImage(img, 0, 0, sw, sh);
      const d = mg.getImageData(0, 0, sw, sh).data;
      const gold = (x, y) => { const i = (y * sw + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2]; return r > 150 && g > 95 && b < 110 && r > b + 70 };
      const share = (n, f) => Array.from({ length: n }, (_, k) => f(k));
      const cols = share(sw, x => { let n = 0; for (let y = 0; y < sh; y++) n += gold(x, y); return n / sh });
      const rows = share(sh, y => { let n = 0; for (let x = 0; x < sw; x++) n += gold(x, y); return n / sw });
      const edge = (a, th) => [a.findIndex(v => v > th), a.length - 1 - [...a].reverse().findIndex(v => v > th)];
      const [l, r] = edge(cols, .12), [t, b] = edge(rows, .05);
      const k = img.width / sw, crop = { x: l * k, y: t * k, w: (r - l + 1) * k, h: (b - t + 1) * k };
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      // the sky: deep blue with a soft light in the middle and fixed sparkles
      const sky = g.createRadialGradient(W / 2, H * .45, 40, W / 2, H / 2, H * .75);
      sky.addColorStop(0, '#2f63d8'); sky.addColorStop(.55, '#173a9c'); sky.addColorStop(1, '#0b1c5a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 260; i++) { const x = rnd() * W, y = rnd() * H, s = rnd() < .9 ? rnd() * 1.6 + .4 : rnd() * 3 + 2; g.fillStyle = `rgba(255,${230 + rnd() * 25 | 0},${170 + rnd() * 85 | 0},${.45 + rnd() * .5})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill() }
      // the card: 92% of the height for every card (so the tops and bottoms line up in the grid), never stretched, centred, with a golden glow behind it
      const sc = Math.min(W * .97 / crop.w, H * .92 / crop.h), cw = crop.w * sc, ch = crop.h * sc, cx = (W - cw) / 2, cy = (H - ch) / 2;
      g.save(); g.shadowColor = 'rgba(255,205,80,.85)'; g.shadowBlur = 46; g.fillStyle = 'rgba(255,200,70,.5)'; g.fillRect(cx + 10, cy + 10, cw - 20, ch - 20); g.restore();
      g.drawImage(img, crop.x, crop.y, crop.w, crop.h, cx, cy, cw, ch);
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
