#!/usr/bin/env node
// One tile size for every buddy.
//
// The mascot art came in two shapes — six square renders with air around the
// character and six tall ones cropped tight to the head — so a tile that cropped
// to fill showed one buddy from head to tail and the next one zoomed into its
// nose. This reads each picture, finds the character against its flat backdrop,
// and redraws it on a 512x640 canvas at the same relative size, on the picture's
// own background colour. Nothing is stretched, nothing is cut off, and the
// originals stay where they are for the round avatars.
//
//   node tools/mascot-tiles.cjs            → assets/mascots/tile/<id>.jpg
//   node tools/mascot-tiles.cjs --check    → fails if a tile is missing or stale
//
// It runs on the Chromium that Playwright already installs (canvas, pixels, JPEG
// encoding), so it needs no image library.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'mascots');
const OUT = path.join(SRC, 'tile');
const W = 512, H = 640;          // 4:5, the shape of the tiles in the collection
const FILL = 0.88;               // how much of the height the character takes
const check = process.argv.includes('--check');

const sources = () => fs.readdirSync(SRC).filter(f => /\.jpg$/.test(f)).sort();

(async () => {
  const stale = sources().filter(f => {
    const out = path.join(OUT, f);
    return !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(path.join(SRC, f)).mtimeMs;
  });
  if (check) {
    if (stale.length) { console.error(`mascot tiles missing or stale: ${stale.join(', ')}\nrun: node tools/mascot-tiles.cjs`); process.exit(1); }
    console.log(`mascot tiles: ${sources().length} up to date ✔`);
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');

  for (const file of sources()) {
    const data = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(SRC, file)).toString('base64');
    const result = await page.evaluate(async ({ data, W, H, FILL }) => {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      const at = (x, y) => { const i = (y * c.width + x) * 4; return [px[i], px[i + 1], px[i + 2]] };

      // The backdrop is found by what it lacks rather than by its colour: these
      // renders all sit on something smooth (a flat tint, a soft gradient, a
      // vignette), while the character is full of edges. Local contrast tells
      // them apart where a colour comparison could not — a purple vignette and a
      // purple-ish fox are the same colour, but only one of them has fur.
      const lum = (x, y) => { const p = at(x, y); return .299 * p[0] + .587 * p[1] + .114 * p[2] };
      const D = 3;
      const busy = (x, y) => {
        if (x < D || y < D || x >= c.width - D || y >= c.height - D) return false;
        return Math.abs(lum(x + D, y) - lum(x - D, y)) + Math.abs(lum(x, y + D) - lum(x, y - D)) > 20;
      };

      // A row or column belongs to the character only when enough of its pixels
      // are busy: film grain and a soft shadow must not stretch the box.
      const step = 2;
      const rows = new Array(c.height).fill(0), cols = new Array(c.width).fill(0);
      for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) {
        if (!busy(x, y)) continue;
        rows[y]++; cols[x]++;
      }
      const edge = (counts, size, other) => {
        const need = Math.max(4, Math.round(other / step * 0.03));
        const hit = counts.map((n, i) => n >= need ? i : -1).filter(i => i >= 0);
        return hit.length ? [hit[0], hit[hit.length - 1]] : [0, size - 1];
      };
      const [y0, y1] = edge(rows, c.height, c.width);
      const [x0, x1] = edge(cols, c.width, c.height);
      const sw = x1 - x0 + 1, sh = y1 - y0 + 1;

      // Draw the character at one size for every buddy: the same share of the
      // canvas height, standing on the same baseline, centred. The whole picture
      // is drawn, not just the crop, and whatever falls outside it is filled by
      // smearing the picture's own edge pixels outwards — the backdrops are flat
      // or a soft gradient, so the join cannot be seen.
      const out = document.createElement('canvas'); out.width = W; out.height = H;
      const o = out.getContext('2d');
      o.imageSmoothingQuality = 'high';
      const scale = Math.min((H * FILL) / sh, (W * 0.92) / sw);
      const dw = c.width * scale, dh = c.height * scale;
      const left = W / 2 - (x0 + sw / 2) * scale;
      // The character stands on the same baseline in every tile, but a picture
      // whose character is already cut off at the bottom is pushed down until
      // its own edge is the tile's edge: stretching a row of fur would streak.
      const top = Math.max(H * 0.96 - (y0 + sh) * scale, H - dh);
      // The four sides, then the four corners.
      // Whatever falls outside the picture takes the colour of the nearest
      // corner of that picture, which is backdrop in every one of these renders.
      // Smearing the edge pixels instead would repeat a wing or an ear down the
      // whole tile, because several characters run off the edge of their frame.
      const patch = (px0, py0) => {
        let r = 0, g2 = 0, b2 = 0, n = 0;
        for (let y = py0; y < py0 + 8; y++) for (let x = px0; x < px0 + 8; x++) { const p = at(x, y); r += p[0]; g2 += p[1]; b2 += p[2]; n++ }
        return `rgb(${Math.round(r / n)},${Math.round(g2 / n)},${Math.round(b2 / n)})`;
      };
      if (left > 0) { o.fillStyle = patch(0, 0); o.fillRect(0, 0, Math.ceil(left), H) }
      if (left + dw < W) { o.fillStyle = patch(c.width - 9, 0); o.fillRect(Math.floor(left + dw), 0, W - left - dw + 1, H) }
      if (top > 0) {
        // The strip above the picture takes the colour of its two top corners,
        // so a pompom or an ear that runs off the top is never smeared upwards.
        const sky = o.createLinearGradient(0, 0, W, 0);
        sky.addColorStop(0, patch(0, 0)); sky.addColorStop(1, patch(c.width - 9, 0));
        o.fillStyle = sky; o.fillRect(0, 0, W, Math.ceil(top) + 1);
      }
      o.drawImage(img, left, top, dw, dh);
      return { url: out.toDataURL('image/jpeg', 0.9), box: [x0, y0, sw, sh], drawn: Math.round(sh * scale) };
    }, { data, W, H, FILL });

    fs.writeFileSync(path.join(OUT, file), Buffer.from(result.url.split(',')[1], 'base64'));
    console.log(`${file}: subject ${result.box[2]}x${result.box[3]} drawn ${result.drawn}px tall`);
  }
  await browser.close();
  console.log(`\n${sources().length} tiles written to assets/mascots/tile/ (${W}x${H})`);
})();
