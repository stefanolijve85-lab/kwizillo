#!/usr/bin/env node
// Where does a mouth sit on a pose?
//
// K.FACE_ANCHORS in milo.js says it in fractions of each cut-out. Those numbers
// are easy to get slightly wrong and impossible to check by reading them, so
// this draws them: every pose of a guide side by side, with a percentage grid
// over it and the anchor marked. What the sheet shows is what the app does —
// both read the same table.
//
//   node tools/mouth-anchors.cjs                 → two sheets in the temp dir
//   node tools/mouth-anchors.cjs --out <dir>     → somewhere else
//   node tools/mouth-anchors.cjs --guide luna
//
// It runs on the Chromium that Playwright installs, so it needs no image
// library and no running server.
const fs = require('fs'); const path = require('path'); const os = require('os'); const vm = require('vm');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback };
const OUT = arg('--out', path.join(os.tmpdir(), 'kwizillo-mouth-anchors'));
const ONLY = arg('--guide', null);
// --zoom shows the head close up instead of the whole pose: the anchor sits in
// the middle of the window and the grid is one percent of the image, so a value
// can be read off rather than guessed.
const ZOOM = process.argv.includes('--zoom');
const MEASURE = process.argv.includes('--measure');
const ZOOM_H = 1400;      // the pose is drawn this tall in zoom mode
const WIN = 320;          // the window cut out of it

// The table itself, read out of milo.js so the sheet can never drift from the app.
function faceAnchors() {
  const src = fs.readFileSync(path.join(ROOT, 'milo.js'), 'utf8');
  const start = src.indexOf('K.FACE_ANCHORS={');
  const end = src.indexOf('\n  };', start);
  if (start < 0 || end < 0) throw new Error('K.FACE_ANCHORS not found in milo.js');
  const ctx = { K: {} }; vm.createContext(ctx);
  vm.runInContext(src.slice(start, end + 5), ctx);
  return ctx.K.FACE_ANCHORS;
}
// The pose files, in the order the app names them.
const POSE_FILE = { wave: 'wave.png', talk: 'talk.png', think: 'think.png', cheer: 'cheer.png', point: 'point-right.png', walkA: 'walk-a.png', walkB: 'walk-b.png', jumpA: 'jump-a.png', jumpB: 'jump-b.png' };

// The head close up: the image is drawn ZOOM_H tall and shifted so the current
// anchor lands in the middle of a WIN x WIN window. One grid square is one
// percent of the image, so reading a correction off the picture is arithmetic,
// not taste.
function zoomSheet(guide, cells) {
  const pct = ZOOM_H / 100;                       // pixels per percent of image height
  return `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#101a2c;color:#dce8ff;font:12px/1.3 -apple-system,system-ui,sans-serif}
    h1{font-size:15px;margin:14px 16px 10px}
    .sheet{display:flex;flex-wrap:wrap;gap:14px;padding:0 16px 18px}
    figure{margin:0;width:${WIN}px}
    .win{position:relative;width:${WIN}px;height:${WIN}px;overflow:hidden;background:#1b2942;border-radius:8px}
    .win img{position:absolute;height:${ZOOM_H}px;width:auto}
    .grid{position:absolute;inset:0;pointer-events:none;
      background-image:repeating-linear-gradient(to right,rgba(120,200,255,.28) 0 1px,transparent 1px ${pct}px),
                       repeating-linear-gradient(to bottom,rgba(120,200,255,.28) 0 1px,transparent 1px ${pct}px)}
    .ruler{position:absolute;pointer-events:none;color:#8fd0ff;font:9px/1 ui-monospace,monospace}
    .ruler.x{top:2px}
    .ruler.y{left:2px}
    .cross{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${WIN}px;height:${WIN}px;pointer-events:none;
      background:linear-gradient(to right,transparent calc(50% - .5px),#ff3b6b calc(50% - .5px) calc(50% + .5px),transparent calc(50% + .5px)),
                 linear-gradient(to bottom,transparent calc(50% - .5px),#ff3b6b calc(50% - .5px) calc(50% + .5px),transparent calc(50% + .5px))}
    .box{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:1.5px solid #ffd23b;border-radius:50%;pointer-events:none}
    figcaption{padding:5px 2px 0;color:#9fc0ea}
    figcaption b{color:#fff}
  </style>
  <h1>${guide} — heads at ${ZOOM_H}px tall; one grid square is 1% of the image; red cross = the anchor now, yellow ring = the mouth it draws</h1>
  <div class="sheet">${cells.map(c => {
    const w = ZOOM_H * (c.nat.w / c.nat.h);       // the image's drawn width
    return `<figure>
      <div class="win">
        <img src="${c.url}" style="left:${WIN / 2 - c.m.x * w}px;top:${WIN / 2 - c.m.y * ZOOM_H}px">
        <span class="grid"></span>
        <span class="box" style="width:${c.m.w * w}px;height:${c.m.h * ZOOM_H}px"></span>
        <span class="cross"></span>
        ${[-8, -4, 4, 8].map(d => `<span class="ruler x" style="left:${WIN / 2 + d * (ZOOM_H / 100) * (c.nat.h / c.nat.w) - 6}px">${d > 0 ? '+' : ''}${d}</span>`).join('')}
        ${[-8, -4, 4, 8].map(d => `<span class="ruler y" style="top:${WIN / 2 + d * (ZOOM_H / 100) - 4}px">${d > 0 ? '+' : ''}${d}</span>`).join('')}
      </div>
      <figcaption><b>${c.pose}</b> · x ${c.m.x} · y ${c.m.y} · w ${c.m.w} · h ${c.m.h}</figcaption>
    </figure>`;
  }).join('')}</div>`;
}

// The natural size of a pose, needed to turn a fraction of its width into
// pixels. Read straight from the PNG header: a page on about:blank is not
// allowed to load a file:// image, which quietly gave every pose the size 1x1.
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`not a PNG: ${file}`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// --measure: finds the mouth in the artwork instead of asking an eye to judge
// it. Lips and the inside of a mouth are the reddest thing on a face — redder
// than skin, darker than blush — so the reddest cluster in the head region is
// the mouth. Prints an anchor per pose, ready to paste into K.FACE_ANCHORS.
async function measure(page, cells) {
  return page.evaluate(async list => {
    const out = [];
    for (const c of list) {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = c.url });
      const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      // Only the top half: that is where a head is in every one of these poses.
      const rows = Math.round(cv.height * 0.55);
      const pts = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cv.width; x++) {
        const i = (y * cv.width + x) * 4;
        if (d[i + 3] < 200) continue;
        const r = d[i], gr = d[i + 1], b = d[i + 2];
        // red, but not blush (too light) and not the purple of her clothes (blue high)
        // Hue and saturation, not raw channels: brown hair and warm skin are
        // the same "more red than green" as lips, but far less saturated and a
        // good deal more orange.
        const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b), v = mx / 255, sat = mx ? (mx - mn) / mx : 0;
        if (v < .2 || v > .6 || sat < .45) continue;   // lips and the inside of a mouth are dark and saturated; blush is light
        let h = 0;
        if (mx === mn) h = 0;
        else if (mx === r) h = 60 * (((gr - b) / (mx - mn)) % 6);
        else if (mx === gr) h = 60 * ((b - r) / (mx - mn) + 2);
        else h = 60 * ((r - gr) / (mx - mn) + 4);
        if (h < 0) h += 360;
        if (h > 18 && h < 335) continue;                    // red to pink only
        pts.push([x, y]);
      }
      if (pts.length < 30) { out.push({ pose: c.pose, found: 0 }); continue }
      // The densest band of those pixels: the mouth is a compact cluster, a
      // stray red pixel in the hair is not.
      const ys = pts.map(p => p[1]).sort((a, b) => a - b);
      const med = ys[Math.floor(ys.length / 2)];
      let band = pts.filter(p => Math.abs(p[1] - med) < cv.height * 0.05);
      const mxs = band.map(p => p[0]).sort((a, b) => a - b);
      const medx = mxs[Math.floor(mxs.length / 2)];
      band = band.filter(p => Math.abs(p[0] - medx) < cv.width * 0.12);
      const xs = band.map(p => p[0]).sort((a, b) => a - b);
      const lo = xs[Math.floor(xs.length * 0.04)], hi = xs[Math.floor(xs.length * 0.96)];
      const cx = (lo + hi) / 2, cy = band.reduce((s, p) => s + p[1], 0) / band.length;
      out.push({ pose: c.pose, found: band.length, x: +(cx / cv.width).toFixed(3), y: +(cy / cv.height).toFixed(3), w: +((hi - lo) / cv.width * 1.05).toFixed(3) });
    }
    return out;
  }, cells.map(c => ({ pose: c.pose, url: c.url })));
}

(async () => {
  const ANCHORS = faceAnchors();
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });

  for (const guide of Object.keys(ANCHORS).filter(g => !ONLY || g === ONLY)) {
    const cfg = ANCHORS[guide];
    const cells = [
      ...Object.entries(cfg.poses).map(([pose, m]) => ({ pose, m, file: `assets/mascots/${guide}/${POSE_FILE[pose]}` })),
      { pose: 'portrait', m: cfg.portrait, file: `assets/mascots/${guide}/talk-base.png` }
    ].filter(c => fs.existsSync(path.join(ROOT, c.file)))
     // The sheet is written to a temp directory, so the artwork is referenced
     // by its place on disk rather than relative to that directory.
     .map(c => ({ ...c, url: 'file://' + path.join(ROOT, c.file) }));
    cells.forEach(c => { c.nat = pngSize(path.join(ROOT, c.file)) });

    if (MEASURE) {
      // The pixels are handed over as data URLs: a file:// page may not read
      // another file:// image back out of a canvas.
      const withData = cells.map(c => ({ ...c, url: 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, c.file)).toString('base64') }));
      for (const m of await measure(page, withData)) {
        console.log(m.found ? `${guide} ${m.pose.padEnd(9)} x:${m.x} y:${m.y} w:${m.w}  (${m.found}px)` : `${guide} ${m.pose.padEnd(9)} no mouth found`);
      }
      continue;
    }
    const html = ZOOM ? zoomSheet(guide, cells) : `<!doctype html><meta charset="utf-8"><style>
      body{margin:0;background:#101a2c;color:#dce8ff;font:12px/1.3 -apple-system,system-ui,sans-serif}
      h1{font-size:15px;margin:14px 16px 10px}
      .sheet{display:flex;flex-wrap:wrap;gap:14px;padding:0 16px 18px}
      figure{margin:0;width:230px}
      .box{position:relative;height:300px;background:#1b2942;border-radius:8px;overflow:hidden;display:grid;place-items:center}
      /* The wrapper shrink-wraps the image, so the grid and the marker sit on
         the image's own box — exactly the way the mouth does in the app. */
      .on-image{position:relative;display:inline-block;font-size:0;pointer-events:none}
      .on-image img{display:block;height:290px;width:auto}
      .grid{position:absolute;inset:0;
        background-image:repeating-linear-gradient(to right,rgba(120,200,255,.5) 0 1px,transparent 1px 10%),
                         repeating-linear-gradient(to bottom,rgba(120,200,255,.5) 0 1px,transparent 1px 10%)}
      .mid{position:absolute;inset:0;
        background-image:linear-gradient(to right,transparent calc(50% - .5px),rgba(255,255,255,.55) calc(50% - .5px) calc(50% + .5px),transparent calc(50% + .5px))}
      .mouth{position:absolute;transform:translate(-50%,-50%);border:1.5px solid #ff3b6b;border-radius:50%;
        box-shadow:0 0 0 1px rgba(255,255,255,.65)}
      .cross{position:absolute;transform:translate(-50%,-50%);width:15px;height:15px;
        background:linear-gradient(to right,transparent 46%,#ff3b6b 46% 54%,transparent 54%),
                   linear-gradient(to bottom,transparent 46%,#ff3b6b 46% 54%,transparent 54%)}
      figcaption{padding:5px 2px 0;color:#9fc0ea}
      figcaption b{color:#fff}
    </style>
    <h1>${guide} — mouth anchors (grid lines every 10% of the image, white line = 50% across)</h1>
    <div class="sheet">${cells.map(c => `
      <figure>
        <div class="box"><span class="on-image">
          <img src="${c.url}">
          <span class="grid"></span><span class="mid"></span>
          <span class="mouth" style="left:${c.m.x * 100}%;top:${c.m.y * 100}%;width:${c.m.w * 100}%;height:${c.m.h * 100}%"></span>
          <span class="cross" style="left:${c.m.x * 100}%;top:${c.m.y * 100}%"></span>
        </span></div>
        <figcaption><b>${c.pose}</b> · x ${c.m.x} · y ${c.m.y} · w ${c.m.w} · h ${c.m.h}</figcaption>
      </figure>`).join('')}</div>`;

    const file = path.join(OUT, `anchors-${guide}${ZOOM ? '-zoom' : ''}.html`);
    fs.writeFileSync(file, html);
    await page.goto('file://' + file);
    // The images decide the page height.
    await page.waitForFunction(() => [...document.images].every(i => i.complete));
    await page.waitForTimeout(120);
    const png = path.join(OUT, `anchors-${guide}${ZOOM ? '-zoom' : ''}.png`);
    await page.screenshot({ path: png, fullPage: true });
    console.log(`${guide}: ${cells.length} poses → ${png}`);
  }
  await browser.close();
  console.log(`\nOpen the sheets and read the crosshair against the grid; the numbers live in K.FACE_ANCHORS (milo.js).`);
})();
