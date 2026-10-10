#!/usr/bin/env node
// Mike & Mia: Jump & Slide — the two runners, cut from their animation sheets.
//
// The sheets (art-source/jump/mike-anim.png 4×8 poses, mia-anim.png 4×9) come
// with real alpha but with a faint red/orange halo around every figure. This
// script, reproducibly:
//   1. finds every figure (connected shapes on the alpha, sorted into rows and
//      columns; the plain grid is the fallback),
//   2. drops the faint haze (alpha ramp) and cleans the fringe: edge pixels that
//      are redder than the figure just inside them take the inside colour, and
//      the outermost pixel ring is softened,
//   3. scales both children to the same standing height, puts every pose on one
//      foot line (the lowest pixel) and one body line (the middle of the torso),
//      so frames never jitter against each other,
//   4. writes one atlas per child: assets/games/jump/<hero>.webp plus the frame
//      table in assets/games/jump/sprites.js (cell size, foot anchor, frames per
//      animation state).
//
//   node tools/jump-sprites.cjs            → writes the atlases
//   node tools/jump-sprites.cjs --sheet    → also writes a labelled contact sheet of
//                                             every cleaned pose to art-source/jump/
//
// It runs on the Chromium that Playwright installs (no image library needed).
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'art-source', 'jump');
const OUT = path.join(ROOT, 'assets', 'games', 'jump');
const sheet = process.argv.includes('--sheet');

// Which pose (row, column on the sheet) plays which animation state. Rows on
// both sheets: 0 idle/blink, 1 run, 2 take-off/jump, 3 jump/double jump,
// 4 fall/arms out, 5 land/crouch, 6 hurt/react, 7 celebrate, (Mia) 8 slide.
// `rot` turns a pose (degrees, around its middle) — used only for Mike's
// temporary slide, see TEMPORARY below.
const MAP = {
  mike: {
    idle: [[0, 0], [0, 1]],
    run: [[1, 0], [1, 1], [1, 2], [1, 3]],
    jump: [[2, 1], [2, 2]],
    doubleJump: [[3, 1], [3, 0]],
    fall: [[4, 2], [4, 3]],
    land: [[5, 0]],
    slide: [[4, 1, -42]],
    hurt: [[6, 1]],
    celebrate: [[7, 0], [7, 1], [7, 2], [7, 3]]
  },
  mia: {
    idle: [[0, 0], [0, 1]],
    run: [[1, 0], [1, 1], [1, 2], [1, 3]],
    jump: [[2, 1], [2, 2]],
    doubleJump: [[3, 1], [3, 0]],
    fall: [[4, 2], [4, 3]],
    land: [[5, 0]],
    slide: [[8, 1]],
    hurt: [[6, 1]],
    celebrate: [[7, 0], [7, 1], [7, 2], [7, 3]]
  }
};
// Frames that stand in for a pose the sheet does not have.
const TEMPORARY = {
  mike: { slide: 'Mike has no slide pose on his sheet: his "leaning back, legs forward" air pose (row 5, column 2) is turned 42° backwards as a stand-in. Replace with a real slide frame when it is drawn.' }
};
const ROWS = { mike: 8, mia: 9 };
const TARGET = 200;   // standing height of both children in the atlas, px

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');
  const table = {};
  for (const hero of ['mike', 'mia']) {
    const data = 'data:image/png;base64,' + fs.readFileSync(path.join(SRC, `${hero}-anim.png`)).toString('base64');
    const res = await page.evaluate(async ({ data, rows, map, TARGET, sheet }) => {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
      const W = img.width, H = img.height;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const id = g.getImageData(0, 0, W, H), d = id.data;
      // 1. the faint haze goes: alpha below 48 is nothing, above 210 is solid
      for (let i = 3; i < d.length; i += 4) { const a = d[i]; d[i] = a < 48 ? 0 : a >= 210 ? 255 : Math.round((a - 48) / 162 * 255) }
      // 2. figures: connected shapes on alpha > 90 (4-neighbour flood fill)
      const lab = new Int32Array(W * H).fill(-1); const comps = [];
      const stack = new Int32Array(W * H);
      for (let p = 0; p < W * H; p++) {
        if (lab[p] !== -1 || d[p * 4 + 3] <= 90) continue;
        const k = comps.length; let n = 0, sp = 0, x0 = W, y0 = H, x1 = 0, y1 = 0, sx = 0, sy = 0;
        stack[sp++] = p; lab[p] = k;
        while (sp) {
          const q = stack[--sp], x = q % W, y = (q / W) | 0; n++; sx += x; sy += y;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          const nb = [x > 0 ? q - 1 : -1, x < W - 1 ? q + 1 : -1, y > 0 ? q - W : -1, y < H - 1 ? q + W : -1];
          for (const r of nb) if (r >= 0 && lab[r] === -1 && d[r * 4 + 3] > 90) { lab[r] = k; stack[sp++] = r }
        }
        comps.push({ k, n, x0, y0, x1, y1, cx: sx / n, cy: sy / n });
      }
      const big = comps.filter(o => o.n > 1500);
      const cellW = W / 4, cellH = H / rows;
      // every big shape belongs to the grid cell of its centre; small bits join the cell they sit in
      const cells = Array.from({ length: rows * 4 }, () => []);
      for (const o of comps) {
        const col = Math.min(3, Math.floor(o.cx / cellW)), row = Math.min(rows - 1, Math.floor(o.cy / cellH));
        if (o.n > 1500 || o.n > 12) cells[row * 4 + col].push(o);
      }
      const owner = new Int32Array(comps.length).fill(-1);
      // a shape that runs over two rows (hair touching the feet of the pose above) is cut at its narrowest point near the row line
      const split = new Map();
      for (const o of comps) if (o.n > 1500 && o.y1 - o.y0 > cellH * 1.25) {
        const line = Math.round(Math.round(o.cy / cellH) * cellH); let best = line, least = Infinity;
        for (let y = line - 30; y <= line + 30; y++) { let n = 0; for (let x = o.x0; x <= o.x1; x++) if (lab[y * W + x] === o.k) n++; if (n < least) { least = n; best = y } }
        const col = Math.min(3, Math.floor(o.cx / cellW)), lower = Math.min(rows - 1, Math.round(best / cellH));
        split.set(o.k, { y: best, up: (lower - 1) * 4 + col, down: lower * 4 + col });
      }
      const ownerAt = sp => { const l = lab[sp]; if (l === -1) return -1; const sv = split.get(l); return sv ? ((sp / W | 0) < sv.y ? sv.up : sv.down) : owner[l] };
      cells.forEach((list, ci) => { const main = list.filter(o => o.n > 1500); if (!main.length) return;
        // a small bit only counts when it touches the main shape's box (hair strands), never stray sparkles
        const bx0 = Math.min(...main.map(o => o.x0)) - 6, by0 = Math.min(...main.map(o => o.y0)) - 6, bx1 = Math.max(...main.map(o => o.x1)) + 6, by1 = Math.max(...main.map(o => o.y1)) + 6;
        for (const o of list) if (o.n > 1500 || (o.x0 >= bx0 && o.x1 <= bx1 && o.y0 >= by0 && o.y1 <= by1)) owner[o.k] = ci });
      const report = { shapes: big.length, split: split.size, cells: cells.map(l => l.filter(o => o.n > 1500).length) };
      // 3. per figure: its own pixels only, the fringe cleaned
      const frame = ci => {
        let x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (const o of comps) { const sv = split.get(o.k); if (sv) { if (sv.up !== ci && sv.down !== ci) continue; const top = sv.up === ci; x0 = Math.min(x0, o.x0); x1 = Math.max(x1, o.x1); y0 = Math.min(y0, top ? o.y0 : sv.y); y1 = Math.max(y1, top ? sv.y : o.y1) } else if (owner[o.k] === ci) { x0 = Math.min(x0, o.x0); y0 = Math.min(y0, o.y0); x1 = Math.max(x1, o.x1); y1 = Math.max(y1, o.y1) } }
        if (x1 < x0) return null;
        x0 = Math.max(0, x0 - 4); y0 = Math.max(0, y0 - 4); x1 = Math.min(W - 1, x1 + 4); y1 = Math.min(H - 1, y1 + 4);
        const w = x1 - x0 + 1, h = y1 - y0 + 1, px = new Uint8ClampedArray(w * h * 4);
        // the soft edge pixels (alpha ≤ 90) belong to the figure they are nearest to
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const sp = (y + y0) * W + x + x0, s = sp * 4, t = (y * w + x) * 4;
          let mine = ownerAt(sp) === ci;
          if (lab[sp] === -1 && d[s + 3] > 0) { mine = false; for (let r = 1; r <= 3 && !mine; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const xx = x + x0 + dx, yy = y + y0 + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) { if (ownerAt(yy * W + xx) === ci) { mine = true; break } } } }
          if (!mine) continue;
          px[t] = d[s]; px[t + 1] = d[s + 1]; px[t + 2] = d[s + 2]; px[t + 3] = d[s + 3];
        }
        // distance (in px, up to 4) from the outside
        const dist = new Uint8Array(w * h).fill(9);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (px[(y * w + x) * 4 + 3] < 200) dist[y * w + x] = 0 }
        for (let pass = 1; pass <= 4; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x; if (dist[i] !== 9) continue;
          if ((x > 0 && dist[i - 1] === pass - 1) || (x < w - 1 && dist[i + 1] === pass - 1) || (y > 0 && dist[i - w] === pass - 1) || (y < h - 1 && dist[i + w] === pass - 1)) dist[i] = pass;
        }
        const redness = (r, g2, b) => r - (g2 + b) / 2;
        const out = new Uint8ClampedArray(px);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x, t = i * 4; if (!px[t + 3] || dist[i] > 3) continue;
          // the colour just inside: solid pixels 4–7 px in
          let r = 0, g2 = 0, b = 0, n = 0;
          for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (dist[j] >= 4) { const u = j * 4; r += px[u]; g2 += px[u + 1]; b += px[u + 2]; n++ } }
          let k = 0;
          if (n) { r /= n; g2 /= n; b /= n; const ex = redness(px[t], px[t + 1], px[t + 2]) - redness(r, g2, b); if (ex > 12) k = Math.min(1, (ex - 12) / 60) }
          // a red rim with nothing solid behind it (thin bits) is simply turned down
          else if (redness(px[t], px[t + 1], px[t + 2]) > 70) { out[t + 3] = px[t + 3] * .35; continue }
          if (k) { out[t] = px[t] + (r - px[t]) * k; out[t + 1] = px[t + 1] + (g2 - px[t + 1]) * k; out[t + 2] = px[t + 2] + (b - px[t + 2]) * k }
          if (dist[i] === 0) out[t + 3] = px[t + 3] * (k > .3 ? .45 : .8);
          else if (dist[i] === 1 && k > .3) out[t + 3] = px[t + 3] * .85;
        }
        // measures: the lowest pixel (feet) and the middle of the torso
        let fy = 0, ty = h, minx = w, maxx = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (out[(y * w + x) * 4 + 3] > 60) { if (y > fy) fy = y; if (y < ty) ty = y; if (x < minx) minx = x; if (x > maxx) maxx = x }
        let sx = 0, n2 = 0;
        for (let y = Math.round(ty + (fy - ty) * .38); y < ty + (fy - ty) * .62; y++) for (let x = 0; x < w; x++) if (out[(y * w + x) * 4 + 3] > 160) { sx += x; n2++ }
        const fc = document.createElement('canvas'); fc.width = w; fc.height = h; fc.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
        return { c: fc, w, h, foot: fy, top: ty, left: minx, right: maxx, body: n2 ? sx / n2 : (minx + maxx) / 2 };
      };
      const frames = {};
      for (let ci = 0; ci < rows * 4; ci++) frames[ci] = frame(ci);
      const idle = frames[0], scale = TARGET / (idle.foot - idle.top);
      // a turned pose: drawn into a bigger canvas around its middle, then measured again
      const turned = (f, deg) => {
        const R = Math.ceil(Math.hypot(f.w, f.h)), c2 = document.createElement('canvas'); c2.width = c2.height = R;
        const g2 = c2.getContext('2d'); g2.translate(R / 2, R / 2); g2.rotate(deg * Math.PI / 180); g2.drawImage(f.c, -f.w / 2, -f.h / 2);
        const dd = g2.getImageData(0, 0, R, R).data; let fy = 0, ty = R, minx = R, maxx = 0;
        for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) if (dd[(y * R + x) * 4 + 3] > 60) { if (y > fy) fy = y; if (y < ty) ty = y; if (x < minx) minx = x; if (x > maxx) maxx = x }
        return { c: c2, w: R, h: R, foot: fy, top: ty, left: minx, right: maxx, body: (minx + maxx) / 2 };
      };
      // 4. one atlas: every used pose in a cell of one size, the foot line and body line shared
      const used = []; const states = {};
      for (const [state, list] of Object.entries(map)) states[state] = list.map(([r, col, rot]) => {
        let f = frames[r * 4 + col]; if (rot) f = turned(f, rot);
        // a slide is anchored on the middle of its whole shape (there is no upright torso to find)
        if (state === 'slide') f = { ...f, body: (f.left + f.right) / 2 };
        used.push({ f, name: `${state}${r}${col}` }); return used.length - 1;
      });
      let L = 0, Rt = 0, Up = 0;
      for (const { f } of used) { L = Math.max(L, (f.body - f.left) * scale); Rt = Math.max(Rt, (f.right - f.body) * scale); Up = Math.max(Up, (f.foot - f.top) * scale) }
      const pad = 3, cw = Math.ceil(L + Rt + pad * 2), ch = Math.ceil(Up + pad * 2), ax = Math.ceil(L + pad), ay = ch - pad;
      const cols = 6, rowsOut = Math.ceil(used.length / cols);
      const atlas = document.createElement('canvas'); atlas.width = cols * cw; atlas.height = rowsOut * ch;
      const ag = atlas.getContext('2d'); ag.imageSmoothingQuality = 'high';
      used.forEach(({ f }, i) => {
        const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
        ag.save(); ag.beginPath(); ag.rect(ox, oy, cw, ch); ag.clip();
        ag.drawImage(f.c, ox + ax - f.body * scale, oy + ay - f.foot * scale, f.w * scale, f.h * scale); ag.restore();
      });
      // the frame's own box inside its cell, for the debug outline
      let contact = null;
      if (sheet) {
        const s = document.createElement('canvas'), cw2 = 240, ch2 = 250; s.width = cw2 * 4; s.height = ch2 * rows; const sg = s.getContext('2d');
        for (let ci = 0; ci < rows * 4; ci++) { const x = (ci % 4) * cw2, y = Math.floor(ci / 4) * ch2; sg.fillStyle = (ci + Math.floor(ci / 4)) % 2 ? '#7fd3e6' : '#f6e7c8'; sg.fillRect(x, y, cw2, ch2); const f = frames[ci]; if (!f) continue; const k = Math.min(1, 220 / f.h, 220 / f.w); sg.drawImage(f.c, x + 10, y + 4, f.w * k, f.h * k); sg.fillStyle = '#000'; sg.font = 'bold 14px sans-serif'; sg.fillText(`r${Math.floor(ci / 4)} c${ci % 4}`, x + 6, y + ch2 - 8) }
        contact = s.toDataURL('image/png');
      }
      // each frame's box around the foot anchor (atlas px: left, top as negatives, right), for fitting a pose under a beam
      const boxes = used.map(({ f }) => [Math.round((f.left - f.body) * scale), Math.round((f.top - f.foot) * scale), Math.round((f.right - f.body) * scale)]);
      return { report, url: atlas.toDataURL('image/webp', 0.9), preview: atlas.toDataURL('image/png'), cell: [cw, ch], anchor: [ax, ay], cols, count: used.length, states, boxes, contact };
    }, { data, rows: ROWS[hero], map: MAP[hero], TARGET, sheet });
    console.log(`${hero}: ${res.report.shapes} figures found (${res.report.split} split), per cell ${res.report.cells.join('')}`);
    fs.writeFileSync(path.join(OUT, `${hero}.webp`), Buffer.from(res.url.split(',')[1], 'base64'));
    if (sheet) {
      fs.writeFileSync(path.join(SRC, `${hero}-cleaned.png`), Buffer.from(res.contact.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(SRC, `${hero}-atlas-preview.png`), Buffer.from(res.preview.split(',')[1], 'base64'));
    }
    table[hero] = { src: `${hero}.webp`, cell: res.cell, anchor: res.anchor, cols: res.cols, height: TARGET, states: res.states, boxes: res.boxes, temporary: Object.keys(TEMPORARY[hero] || {}) };
    console.log(`  atlas ${res.cols}×${Math.ceil(res.count / res.cols)} cells of ${res.cell.join('×')}, ${res.count} frames → assets/games/jump/${hero}.webp (${(fs.statSync(path.join(OUT, `${hero}.webp`)).size / 1024).toFixed(0)} kB)`);
  }
  const notes = Object.entries(TEMPORARY).flatMap(([h, m]) => Object.entries(m).map(([s, why]) => `//   ${h}.${s}: ${why}`)).join('\n');
  fs.writeFileSync(path.join(OUT, 'sprites.js'), `// Written by tools/jump-sprites.cjs — do not edit by hand.\n// Per child: the atlas, the size of one cell, the foot anchor inside a cell\n// (every pose stands on it), and the cells that play each animation state.\n// Temporary frames:\n${notes}\nexport const SPRITES = {\n${Object.entries(table).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join(",\n")}\n};\n`);
  await browser.close();
})();
