#!/usr/bin/env node
// Every buddy cut out of its own picture, at one size.
//
// The renders each came on their own backdrop — lavender, peach, mint, a dark
// vignette, and two with a painted frame around the picture — so a row of them
// in the collection was a row of coloured boxes. This cuts the character out of
// that backdrop, centres it and draws it on a transparent 640x512 canvas, the
// shape the tiles are shown in. The tile then shows the character and nothing
// else; the card behind it supplies the colour.
//
//   node tools/mascot-tiles.cjs            → assets/mascots/tile/<id>.png
//   node tools/mascot-tiles.cjs --check    → fails if a tile is missing or stale
//
// How the backdrop is found: the picture is flooded from its four edges, and a
// neighbouring pixel joins the flood when it is close in colour to the pixel it
// came from. That follows a smooth gradient or a vignette all the way round the
// character and stops at its edge, where the colour jumps. A picture with a
// painted frame is flooded twice: once to take the frame off, then again from
// the new edge. Whatever is left is the character; its border is softened by a
// pixel so it does not look scissored.
//
// It runs on the Chromium that Playwright already installs (canvas, pixels, PNG
// encoding), so it needs no image library.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'mascots');
const OUT = path.join(SRC, 'tile');
const W = 640, H = 512;          // 5:4, the shape of the tiles in the collection
const FILL = 0.94;               // how much of the height the character takes
const TOL = Number(process.env.TOL || 34);   // how far a pixel may differ from the modelled backdrop
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

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');

  for (const file of sources()) {
    const data = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(SRC, file)).toString('base64');
    const result = await page.evaluate(async ({ data, W, H, FILL, TOL }) => {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      const w = c.width, h = c.height;
      const P = (x, y) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2]] };

      // A model of the backdrop: these renders sit on a flat tint, a soft
      // gradient or a vignette, so the colour anywhere in the background can be
      // guessed by mixing the four edge pixels of that row and column. A pixel
      // that matches its guess is backdrop; a character does not match.
      const top = [], bottom = [], left = [], right = [];
      for (let x = 0; x < w; x++) { top.push(P(x, 0)); bottom.push(P(x, h - 1)) }
      for (let y = 0; y < h; y++) { left.push(P(0, y)); right.push(P(w - 1, y)) }
      const model = (x, y) => {
        const fy = y / (h - 1), fx = x / (w - 1);
        const v = [0, 0, 0];
        for (let ch = 0; ch < 3; ch++) {
          const vert = top[x][ch] * (1 - fy) + bottom[x][ch] * fy;
          const horiz = left[y][ch] * (1 - fx) + right[y][ch] * fx;
          v[ch] = (vert + horiz) / 2;
        }
        return v;
      };
      const isBackdrop = (x, y, tol) => {
        const i = (y * w + x) * 4, m = model(x, y);
        return Math.abs(px[i] - m[0]) + Math.abs(px[i + 1] - m[1]) + Math.abs(px[i + 2] - m[2]) <= tol;
      };

      // Only backdrop that hangs together with the edge counts, so a patch of
      // sky-coloured jumper inside the character stays part of the character.
      const flood = (x0, y0, x1, y1, tol) => {
        const seen = new Uint8Array(w * h);
        const stack = [];
        const push = (x, y) => { const k = y * w + x; if (!seen[k] && isBackdrop(x, y, tol)) { seen[k] = 1; stack.push(k) } };
        for (let x = x0; x <= x1; x++) { push(x, y0); push(x, y1) }
        for (let y = y0; y <= y1; y++) { push(x0, y); push(x1, y) }
        while (stack.length) {
          const k = stack.pop(), x = k % w, y = (k / w) | 0;
          if (x > x0) push(x - 1, y);
          if (x < x1) push(x + 1, y);
          if (y > y0) push(x, y - 1);
          if (y < y1) push(x, y + 1);
        }
        return seen;
      };

      // What the flood did not reach, inside the rectangle, is the subject.
      const boxOf = (seen, x0, y0, x1, y1) => {
        let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1, n = 0;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!seen[y * w + x]) {
          n++; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
        }
        return { bx0, by0, bx1, by1, n };
      };

      // How far a pixel may stray from the model differs per picture: a flat
      // tint gives itself away at once, a vignette needs more room. The
      // tolerance is raised until the backdrop stops growing quickly — the
      // point where it has taken the background and would start on the
      // character.
      let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1;
      let seen = null, box = null, tol = TOL, share = 0;
      for (const t of [30, 45, 60, 75, 90, 105, 120, 140, 160]) {
        const s2 = flood(x0, y0, x1, y1, t);
        const b2 = boxOf(s2, x0, y0, x1, y1);
        const bgShare = 1 - b2.n / (w * h);
        // Stop as soon as most of the picture is backdrop, or when a step gains
        // almost nothing any more (the flood has met the character's edge).
        if (seen && bgShare - share < 0.02 && share > 0.25) break;
        seen = s2; box = b2; tol = t; share = bgShare;
        if (bgShare > 0.62) break;
      }
      // A painted frame leaves a subject that fills almost the whole picture:
      // step inside it and look again from there.
      let framed = false;
      if (box.n > 0.9 * w * h) {
        framed = true;
        const inset = Math.round(Math.min(w, h) * 0.08);
        x0 += inset; y0 += inset; x1 -= inset; y1 -= inset;
        seen = flood(x0, y0, x1, y1, tol);
        box = boxOf(seen, x0, y0, x1, y1);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < x0 || x > x1 || y < y0 || y > y1) seen[y * w + x] = 1;
      }
      // Close pinholes: a background pixel with subject on both sides is shading,
      // not backdrop.
      for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) {
        const k = y * w + x;
        if (!seen[k]) continue;
        const open = (seen[k - 1] ? 1 : 0) + (seen[k + 1] ? 1 : 0) + (seen[k - w] ? 1 : 0) + (seen[k + w] ? 1 : 0);
        if (open <= 1) seen[k] = 0;
      }

      // The cut-out, with a one-pixel soft edge so it does not look scissored.
      const cut = document.createElement('canvas'); cut.width = w; cut.height = h;
      const cg = cut.getContext('2d');
      const out = cg.createImageData(w, h);
      const alphaOf = k => seen[k] ? 0 : 255;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = y * w + x, i = k * 4;
        let a = alphaOf(k);
        if (a === 255 && x > 0 && x < w - 1 && y > 0 && y < h - 1) {
          const n = (alphaOf(k - 1) + alphaOf(k + 1) + alphaOf(k - w) + alphaOf(k + w)) / 4;
          a = Math.round(255 * 0.45 + n * 0.55);
        }
        out.data[i] = px[i]; out.data[i + 1] = px[i + 1]; out.data[i + 2] = px[i + 2]; out.data[i + 3] = a;
      }
      cg.putImageData(out, 0, 0);

      // Centred on the tile, every buddy at the same share of the height.
      const sw = box.bx1 - box.bx0 + 1, sh = box.by1 - box.by0 + 1;
      const tile = document.createElement('canvas'); tile.width = W; tile.height = H;
      const tg = tile.getContext('2d');
      tg.imageSmoothingQuality = 'high';
      const scale = Math.min((H * FILL) / sh, (W * 0.92) / sw);
      const dw = sw * scale, dh = sh * scale;
      tg.drawImage(cut, box.bx0, box.by0, sw, sh, (W - dw) / 2, (H - dh) / 2, dw, dh);
      return { url: tile.toDataURL('image/png'), box: [box.bx0, box.by0, sw, sh], framed, tol, backdrop: Math.round(100 * (1 - box.n / (w * h))) };
    }, { data, W, H, FILL, TOL });

    const out = tileOf(file);
    fs.writeFileSync(out, Buffer.from(result.url.split(',')[1], 'base64'));
    console.log(`${file}: subject ${result.box[2]}x${result.box[3]}, backdrop ${result.backdrop}% removed at tolerance ${result.tol}${result.framed ? ', frame removed' : ''} → ${(fs.statSync(out).size / 1024).toFixed(0)} kB`);
  }
  // The old boxed JPEG tiles are replaced by these cut-outs.
  for (const f of fs.readdirSync(OUT).filter(f => /\.jpg$/.test(f))) fs.unlinkSync(path.join(OUT, f));
  await browser.close();
  console.log(`\n${sources().length} tiles written to assets/mascots/tile/ (${W}x${H}, transparent)`);
})();
