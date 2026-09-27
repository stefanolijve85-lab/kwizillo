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
