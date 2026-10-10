// Cuts and cleans the Blokkenpret art (art-source/blokken, not in git) into assets/games/blokken/
// and the Spellenkist tile: transparent fringes removed, one-pixel halo ring taken off, tight crop,
// sized for 2-3x the display size, webp. Needs the source art locally:  node tools/blokken-art.cjs
const { chromium } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'art-source/blokken'), OUT = path.join(ROOT, 'assets/games/blokken');
fs.mkdirSync(OUT, { recursive: true });
const jobs = [];
const COLORS = ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'pink', 'cyan', 'lime'];
COLORS.forEach((c, i) => jobs.push({ src: 'cells.png', out: `cell-${c}.webp`, region: [[60, 455, 830][i % 3], [30, 420, 810][Math.floor(i / 3)], [395, 375, 410][i % 3], [390, 390, 395][Math.floor(i / 3)]], size: [176, 176], clean: true, square: true }));
jobs.push({ src: 'frame.png', out: 'frame.webp', region: [0, 0, 1254, 1254], size: [480, 480], clean: true });
jobs.push({ src: 'btn-yellow.png', out: 'btn-yellow.webp', region: [0, 0, 2168, 725], h: 150, clean: true });
jobs.push({ src: 'btn-blue.png', out: 'btn-blue.webp', region: [0, 0, 2020, 778], h: 150, clean: true });
jobs.push({ src: 'mega-zet-emblem.png', out: 'mega-nl.webp', region: [0, 0, 1254, 1254], w: 640, clean: true });
jobs.push({ src: 'mega-zet-emblem.png', out: 'mega-star.webp', region: [0, 90, 1254, 632], w: 640, clean: true, fadeBottom: 40 });
jobs.push({ src: 'bonus-boost-banner.png', out: 'boost-banner.webp', region: [0, 0, 2135, 737], w: 720, clean: true });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage();
  for (const j of jobs) {
    const b64 = fs.readFileSync(path.join(SRC, j.src)).toString('base64');
    const res = await page.evaluate(async ([b64, j]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const [rx, ry, rw, rh] = j.region;
      const c = document.createElement('canvas'); c.width = rw; c.height = rh; const x = c.getContext('2d');
      x.drawImage(img, rx, ry, rw, rh, 0, 0, rw, rh);
      const d = x.getImageData(0, 0, rw, rh), p = d.data, A = i => p[i * 4 + 3];
      if (j.fadeBottom) for (let yy = rh - j.fadeBottom; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) { const i = (yy * rw + xx) * 4 + 3; p[i] = p[i] * (rh - yy) / j.fadeBottom; }
      if (j.clean) {
        // 1. faint fringe pixels go; 2. one pixel ring around the shape goes (that is where the coloured halo sits)
        for (let i = 0; i < rw * rh; i++) if (A(i) < 110) p[i * 4 + 3] = 0;
        const keep = new Uint8Array(rw * rh);
        for (let yy = 1; yy < rh - 1; yy++) for (let xx = 1; xx < rw - 1; xx++) { const i = yy * rw + xx; if (A(i) && A(i - 1) && A(i + 1) && A(i - rw) && A(i + rw)) keep[i] = 1; }
        for (let i = 0; i < rw * rh; i++) if (!keep[i]) p[i * 4 + 3] = 0;
        // soften the hard edge again: edge pixels at half alpha
        for (let yy = 1; yy < rh - 1; yy++) for (let xx = 1; xx < rw - 1; xx++) { const i = yy * rw + xx; if (keep[i] && (!keep[i - 1] || !keep[i + 1] || !keep[i - rw] || !keep[i + rw])) p[i * 4 + 3] = Math.min(A(i), 150); }
      }
      // bounding box of the main shape: rows/columns with enough opaque pixels (specks are ignored)
      const rows = new Array(rh).fill(0), cols = new Array(rw).fill(0);
      for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) if (A(yy * rw + xx) > 200) { rows[yy]++; cols[xx]++; }
      const rT = Math.max(3, rw * .04), cT = Math.max(3, rh * .04);
      let y0 = rows.findIndex(v => v > rT), y1 = rh - 1 - [...rows].reverse().findIndex(v => v > rT);
      let x0 = cols.findIndex(v => v > cT), x1 = rw - 1 - [...cols].reverse().findIndex(v => v > cT);
      if (j.fadeBottom) y1 = rh - 1;
      for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) if (yy < y0 - 2 || yy > y1 + 2 || xx < x0 - 2 || xx > x1 + 2) p[(yy * rw + xx) * 4 + 3] = 0;
      x.putImageData(d, 0, 0);
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      let W, H; if (j.size) [W, H] = j.size; else if (j.h) { H = j.h; W = Math.round(bw * j.h / bh); } else { W = j.w; H = Math.round(bh * j.w / bw); }
      const o = document.createElement('canvas'); o.width = W; o.height = H; const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high';
      ox.drawImage(c, x0, y0, bw, bh, 0, 0, W, H);
      return { url: o.toDataURL('image/webp', .86), W, H, box: [x0, y0, bw, bh] };
    }, [b64, j]);
    fs.writeFileSync(path.join(OUT, j.out), Buffer.from(res.url.split(',')[1], 'base64'));
    console.log(j.out, res.W + 'x' + res.H, 'box', res.box.join(','));
  }
  // chest tile: the art without its baked-in title, 16:9
  const b64 = fs.readFileSync(path.join(SRC, 'tile-art.png')).toString('base64');
  const url = await page.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = 1024; c.height = 576; c.getContext('2d').drawImage(img, 0, 420, 1254, 705, 0, 0, 1024, 576); return c.toDataURL('image/jpeg', .86); }, b64);
  fs.writeFileSync(path.join(ROOT, 'assets/games/blokken-tile.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
})();
