#!/usr/bin/env node
// Mike & Mia: Jump & Slide — the two runners, cut from their animation sheets.
//
// Three sources per child, all in art-source/jump/ (not shipped):
//   <hero>-anim.png   4×8 (Mike) / 4×9 (Mia) poses: jump, fall, land, hurt, celebrate, slide
//   <hero>-run8.png   4×2: an eight-pose run cycle
//   <hero>-stand.png  one side-view standing pose: idle, and the character cards
// They come with real alpha but with a soft red/orange/blue/grey halo around
// every figure. This script, reproducibly:
//   1. finds every figure (connected shapes on the alpha, sorted into rows and
//      columns; the plain grid is the fallback),
//   2. drops the faint haze (alpha ramp) and cleans the fringe: edge pixels that
//      are redder than the figure just inside them take the inside colour, and
//      the outermost pixel ring is softened,
//   3. scales every source to one size (the standing height of the anim sheet's
//      idle; the run cycle to the anim sheet's own run; the stand pose to the
//      same standing height), puts every pose on one
//      foot line (the lowest pixel) and one body line (the middle of the torso),
//      so frames never jitter against each other,
//   4. Mike only: his eyes are blue-green, but every drawing gives him brown
//      eyes. The brown iris pixels (inside the whites of the eyes, in the upper
//      face) are shifted to teal, keeping the pupil and the highlights. The
//      contact sheet art-source/jump/mike-eyes.png shows every face at 3× to check.
//   5. writes one atlas per child: assets/games/jump/<hero>.webp plus the frame
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
    idle: [['stand', 0, 0]],
    run: [['run8', 0, 0], ['run8', 0, 1], ['run8', 0, 2], ['run8', 0, 3], ['run8', 1, 0], ['run8', 1, 1], ['run8', 1, 2], ['run8', 1, 3]],
    jump: [['anim', 2, 1], ['anim', 2, 2]],
    doubleJump: [['anim', 3, 1], ['anim', 3, 0]],
    fall: [['anim', 4, 2], ['anim', 4, 3]],
    land: [['anim', 5, 0]],
    slide: [['anim', 4, 1, -42]],
    hurt: [['anim', 6, 1]],
    celebrate: [['anim', 7, 0], ['anim', 7, 1], ['anim', 7, 2], ['anim', 7, 3]]
  },
  mia: {
    idle: [['stand', 0, 0]],
    run: [['run8', 0, 0], ['run8', 0, 1], ['run8', 0, 2], ['run8', 0, 3], ['run8', 1, 0], ['run8', 1, 1], ['run8', 1, 2], ['run8', 1, 3]],
    jump: [['anim', 2, 1], ['anim', 2, 2]],
    doubleJump: [['anim', 3, 1], ['anim', 3, 0]],
    fall: [['anim', 4, 2], ['anim', 4, 3]],
    land: [['anim', 5, 0]],
    slide: [['anim', 8, 1]],
    hurt: [['anim', 6, 1]],
    celebrate: [['anim', 7, 0], ['anim', 7, 1], ['anim', 7, 2], ['anim', 7, 3]]
  }
};
// The grid of each source (rows × columns) per child.
const SOURCES = { anim: { mike: [8, 4], mia: [9, 4] }, run8: { mike: [2, 4], mia: [2, 4] }, stand: { mike: [1, 1], mia: [1, 1] } };
// Which file each source is, per child (Mike's run cycle was redrawn with his blue-green eyes and a thin white outline).
const FILES = { mike: { run8: 'run8-v2' } };
// Sources drawn with a white outline that has to go (not elsewhere: the white of an eye at the edge of a face must stay).
const WHITE_OUTLINE = { mike: ['run8'] };
// Mike's eyes are recoloured on these sources only (the redrawn run cycle has them already).
const TEAL_EYES = { mike: ['stand'] };
// Frames that stand in for a pose the sheet does not have.
const TEMPORARY = {
  mike: { slide: 'Mike has no slide pose on his sheet: his "leaning back, legs forward" air pose (row 5, column 2) is turned 42° backwards as a stand-in. Replace with a real slide frame when it is drawn.', eyes: 'Mike\'s run cycle (mike-run8-v2.png) is drawn with his blue-green eyes; the stand pose is recoloured to blue-green in this tool; the jump, double jump, fall, land, slide, hurt and celebrate poses from mike-anim.png still have the brown eyes as drawn (too small to recolour cleanly) until those poses are redrawn.' }
};
const TARGET = 200;   // standing height of both children in the atlas, px

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  if (process.env.DEBUG) page.on('console', m => console.log('  [page]', m.text()));
  await page.goto('about:blank');
  const table = {};
  for (const hero of ['mike', 'mia']) {
   await page.evaluate(() => { window.__F = {} });
   for (const [srcName, grids] of Object.entries(SOURCES)) {
    const [rows, cols] = grids[hero];
    const data = 'data:image/png;base64,' + fs.readFileSync(path.join(SRC, `${hero}-${FILES[hero]?.[srcName] || srcName}.png`)).toString('base64');
    const rep = await page.evaluate(async ({ data, rows, cols, srcName, teal, sheet, cleanWhite }) => {
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
        const k = comps.length; let n = 0, sp = 0, x0 = W, y0 = H, x1 = 0, y1 = 0, sx = 0, sy = 0, lo = 0;
        stack[sp++] = p; lab[p] = k;
        while (sp) {
          const q = stack[--sp], x = q % W, y = (q / W) | 0; n++; sx += x; sy += y; lo += Math.min(d[q * 4], d[q * 4 + 1], d[q * 4 + 2]);
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          const nb = [x > 0 ? q - 1 : -1, x < W - 1 ? q + 1 : -1, y > 0 ? q - W : -1, y < H - 1 ? q + W : -1];
          for (const r of nb) if (r >= 0 && lab[r] === -1 && d[r * 4 + 3] > 90) { lab[r] = k; stack[sp++] = r }
        }
        comps.push({ k, n, x0, y0, x1, y1, cx: sx / n, cy: sy / n, whiteBit: n < 1500 && lo / n > 185 });
      }
      const big = comps.filter(o => o.n > 1500);
      const cellW = W / cols, cellH = H / rows;
      // every big shape belongs to the grid cell of its centre; small bits join the cell they sit in
      const cells = Array.from({ length: rows * cols }, () => []);
      for (const o of comps) {
        const col = Math.min(cols - 1, Math.floor(o.cx / cellW)), row = Math.min(rows - 1, Math.floor(o.cy / cellH));
        if (o.n > 12) cells[row * cols + col].push(o);
      }
      const owner = new Int32Array(comps.length).fill(-1);
      // a shape that runs over two rows (hair touching the feet of the pose above) is cut at its narrowest point near the row line
      const split = new Map();
      if (rows > 1) for (const o of comps) if (o.n > 1500 && o.y1 - o.y0 > cellH * 1.25) {
        const line = Math.round(Math.round(o.cy / cellH) * cellH); let best = line, least = Infinity;
        for (let y = line - 30; y <= line + 30; y++) { let n = 0; for (let x = o.x0; x <= o.x1; x++) if (lab[y * W + x] === o.k) n++; if (n < least) { least = n; best = y } }
        const col = Math.min(cols - 1, Math.floor(o.cx / cellW)), lower = Math.min(rows - 1, Math.round(best / cellH));
        split.set(o.k, { y: best, up: (lower - 1) * cols + col, down: lower * cols + col });
      }
      const ownerAt = sp => { const l = lab[sp]; if (l === -1) return -1; const sv = split.get(l); return sv ? ((sp / W | 0) < sv.y ? sv.up : sv.down) : owner[l] };
      cells.forEach((list, ci) => { const main = list.filter(o => o.n > 1500); if (!main.length) return;
        // a small bit only counts when it touches the main shape's box (hair strands), never stray sparkles
        const bx0 = Math.min(...main.map(o => o.x0)) - 6, by0 = Math.min(...main.map(o => o.y0)) - 6, bx1 = Math.max(...main.map(o => o.x1)) + 6, by1 = Math.max(...main.map(o => o.y1)) + 6;
        // a loose white speck (paint left from an outline) never counts
        for (const o of list) if (o.n > 1500 || (!o.whiteBit && o.x0 >= bx0 && o.x1 <= bx1 && o.y0 >= by0 && o.y1 <= by1)) owner[o.k] = ci });
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
        // A drawn white outline (and the white it fills into the hollows between curls) goes:
        // from the outside inwards, up to 12 px deep, every pixel that is white or light grey
        // with next to no colour. A white surface of the figure itself (the hoodie, a sole) has
        // a little warmth in it and is separated from the outline by a darker line, so it stays.
        if (cleanWhite) {
          const grey = t => { const mx = Math.max(px[t], px[t + 1], px[t + 2]), mn = Math.min(px[t], px[t + 1], px[t + 2]); return px[t + 3] > 0 && mn > 110 && (mx - mn) / mx < .06 };
          const depth = new Uint8Array(w * h).fill(255), q = [];
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (px[i * 4 + 3] < 40) { depth[i] = 0; q.push(i) } }
          for (let k = 0; k < q.length; k++) { const u = q[k], ux = u % w; if (depth[u] >= 12) continue;
            for (const v of [u - 1, u + 1, u - w, u + w]) { if (v < 0 || v >= w * h || Math.abs(v % w - ux) > 1 || depth[v] !== 255) continue; if (!grey(v * 4)) continue; depth[v] = depth[u] + 1; px[v * 4 + 3] = 0; q.push(v) } }
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
          let k = 0, whiteRim = false;
          if (n) { r /= n; g2 /= n; b /= n; const ex = redness(px[t], px[t + 1], px[t + 2]) - redness(r, g2, b); if (ex > 12) k = Math.min(1, (ex - 12) / 60);
            // a white outline: much lighter than the inside, and the inside is not white itself (a white hoodie keeps its edge)
            const lo1 = Math.min(px[t], px[t + 1], px[t + 2]), lo2 = Math.min(r, g2, b), wx = lo1 - lo2;
            if (cleanWhite && lo1 > 170 && lo2 < 175 && wx > 40) { k = Math.max(k, Math.min(1, (wx - 40) / 50)); if (dist[i] <= 1) whiteRim = true } }
          // a red rim with nothing solid behind it (thin bits) is simply turned down
          else if (redness(px[t], px[t + 1], px[t + 2]) > 70) { out[t + 3] = px[t + 3] * .35; continue }
          // any coloured glow in a half-transparent edge pixel: take the inside colour as far as the pixel is see-through
          if (n && px[t + 3] < 250 && dist[i] <= 2) k = Math.max(k, Math.min(1, (1 - px[t + 3] / 255) * 1.6));
          if (k) { out[t] = px[t] + (r - px[t]) * k; out[t + 1] = px[t + 1] + (g2 - px[t + 1]) * k; out[t + 2] = px[t + 2] + (b - px[t + 2]) * k }
          if (whiteRim && k > .5) out[t + 3] = px[t + 3] * (dist[i] === 0 ? .15 : .55);
          else if (dist[i] === 0) out[t + 3] = px[t + 3] * (k > .3 ? .45 : .8);
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
      for (let ci = 0; ci < rows * cols; ci++) frames[ci] = frame(ci);
      // Mike's eyes: brown irises → blue-green (see the header)
      const eyeLog = [];
      // only the run cycle and the stand pose: on the small poses of the anim sheet the
      // irises are a few pixels of near-black, and recolouring left brown eyes with a teal
      // rim (checked at 2.4x on every frame, 2026-10-10) — those keep the drawn eyes
      if (teal) for (const [ci, f] of Object.entries(frames)) { if (f) eyeLog.push([ci, recolourEyes(f)]) }
      function recolourEyes(f) {
        const g2 = f.c.getContext('2d'), im = g2.getImageData(0, 0, f.w, f.h), p = im.data, w = f.w, h = f.h;
        const top = f.top, bottom = Math.round(f.top + (f.foot - f.top) * .45), R = Math.max(3, Math.round((f.foot - f.top) / 55));
        const hsv = i => { const r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let hu = 0; if (d) hu = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hu = (hu * 60 + 360) % 360; return [hu, mx ? d / mx : 0, mx] };
        const white = i => p[i + 3] > 200 && p[i] > 195 && p[i + 1] > 185 && p[i + 2] > 170 && Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2]) < 60;
        const skin = i => { if (p[i + 3] < 200) return false; const [hu, sa, v] = hsv(i); return hu >= 14 && hu <= 38 && sa > .35 && sa < .8 && v > .86 };
        const brown = i => { if (p[i + 3] < 180) return false; const [hu, sa, v] = hsv(i); return hu >= 0 && hu <= 45 && v >= .08 && v <= .7 && (sa > .3 || v < .25) };
        // The eye opening is where the white of the eye is: the iris lies between its
        // whites, left and right and above and below. So: the white pieces in the upper
        // face are grouped per eye; inside each group's white span (in its row and in its
        // column) the brown-orange pixels are the iris. The pupil (dark) and the
        // highlight (white) are kept. A group needs a dark pupil inside it, so teeth
        // in an open smile are never touched; skin is too light to count as iris.
        const dark = i => p[i + 3] > 180 && Math.max(p[i], p[i + 1], p[i + 2]) < 60;
        const span = f.foot - f.top, eyeR = Math.max(4, span / 16);
        const seen = new Uint8Array(w * h), whites = [];
        for (let y = top; y < bottom; y++) for (let x = 0; x < w; x++) {
          const q = y * w + x; if (seen[q] || !white(q * 4)) continue;
          const list = [q], st = [q]; seen[q] = 1;
          while (st.length) { const u = st.pop(), ux = u % w; for (const v of [u - 1, u + 1, u - w, u + w]) { const vy = (v / w) | 0; if (vy < top || vy >= bottom || Math.abs(v % w - ux) > 1 || seen[v] || !white(v * 4)) continue; seen[v] = 1; list.push(v); st.push(v) } }
          if (list.length < 2 || list.length > eyeR * eyeR * 3) continue;
          let sx = 0, sy = 0; for (const u of list) { sx += u % w; sy += (u / w) | 0 }
          whites.push({ list, cx: sx / list.length, cy: sy / list.length });
        }
        // white pieces closer than an eye's size belong to the same eye
        const groups = [];
        for (const wp of whites) { let g = groups.find(g => Math.hypot(g.cx - wp.cx, g.cy - wp.cy) < eyeR * .55); if (!g) { g = { cx: wp.cx, cy: wp.cy, px: [] }; groups.push(g) } g.px.push(...wp.list) }
        let changed = 0, rejected = 0, irises = 0, cxs = 0, cys = 0, cn = 0;
        // the far eye seen from the side is a sliver against the hair: left as drawn
        const accepted = [];
        for (const g of groups) {
          if (g.cy > f.top + span * .4) { rejected++; continue }
          let x0 = w, x1 = 0, y0 = h, y1 = 0;
          for (const u of g.px) { const x = u % w, y = (u / w) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
          // the iris sits next to the white (seen from the side the white is only on one side),
          // never above the top of the white (that is the brow), and the pupil is near
          // a small white (the far eye, seen from the side) reaches only a little way
          const Rw = Math.max(2, Math.round(Math.min(eyeR * .75, Math.sqrt(g.px.length) * .8))), near = new Uint8Array(w * h);
          for (const u of g.px) { const ux = u % w, uy = (u / w) | 0; for (let dy = -Rw; dy <= Rw; dy++) for (let dx = -Rw; dx <= Rw; dx++) { if (dx * dx + dy * dy > Rw * Rw) continue; const xx = ux + dx, yy = uy + dy; if (xx >= 0 && xx < w && yy >= y0 - 1 && yy <= y1 + 1) near[yy * w + xx] = 1 } }
          const inside = [], cand = new Uint8Array(w * h); let pupil = 0, ring = 0, skinRing = 0;
          for (let y = Math.max(0, y0 - 1); y <= Math.min(h - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - Rw); x <= Math.min(w - 1, x1 + Rw); x++) {
            const q = y * w + x; if (!near[q]) continue; const i = q * 4;
            ring++; if (skin(i)) skinRing++;
            if (dark(i)) { pupil++; continue } if (white(i)) continue;
            const [hu, sa, v] = hsv(i); if (hu >= 14 && hu <= 40 && sa > .55 && v < .84 && p[i + 3] > 200) cand[q] = 1;
          }
          // the iris grows from the pixels right beside the white, through iris colours only:
          // the black outline of the eye stops it before the hair or the brow
          const st = [];
          for (const u of g.px) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const v = u + dy * w + dx; if (v >= 0 && v < w * h && cand[v] === 1) { cand[v] = 2; st.push(v) } }
          while (st.length) { const u = st.pop(); inside.push(u * 4); for (const v of [u - 1, u + 1, u - w, u + w, u - w - 1, u - w + 1, u + w - 1, u + w + 1]) if (v >= 0 && v < w * h && cand[v] === 1) { cand[v] = 2; st.push(v) } }
          // an eye: a dark pupil, and skin around it (a highlight in the hair or a white sleeve has neither)
          if (pupil < Math.max(3, ring * .04) || skinRing < ring * .12 || inside.length < 3) { rejected++; continue }
          accepted.push({ g, inside });
        }
        // the far eye seen from the side is a sliver against the hair: left as drawn
        const biggest = Math.max(0, ...accepted.map(a => a.g.px.length));
        for (const { g, inside } of accepted) {
          if (g.px.length < biggest * .3) { rejected++; continue }
          irises++;
          for (const i of inside) { const [hu, sa, v] = hsv(i), q = i / 4; cxs += q % w; cys += (q / w) | 0; cn++;
            const H2 = 176, S2 = Math.min(.9, Math.max(.5, sa)), V2 = Math.min(1, v * 1.05);
            const c = V2 * S2, X = c * (1 - Math.abs(((H2 / 60) % 2) - 1)), m = V2 - c;
            p[i] = m * 255; p[i + 1] = (c + m) * 255; p[i + 2] = (X + m) * 255; changed++ }
        }
        g2.putImageData(im, 0, 0);
        f.eye = cn ? [cxs / cn, cys / cn] : null;
        return { irises, changed, rejected };
      }
      window.__F[srcName] = frames;
      let contact = null;
      if (sheet) {
        const s = document.createElement('canvas'), cw2 = 240, ch2 = 250; s.width = cw2 * cols; s.height = ch2 * rows; const sg = s.getContext('2d');
        for (let ci = 0; ci < rows * cols; ci++) { const x = (ci % cols) * cw2, y = Math.floor(ci / cols) * ch2; sg.fillStyle = (ci + Math.floor(ci / cols)) % 2 ? '#7fd3e6' : '#f6e7c8'; sg.fillRect(x, y, cw2, ch2); const f = frames[ci]; if (!f) continue; const k = Math.min(1, 220 / f.h, 220 / f.w); sg.drawImage(f.c, x + 10, y + 4, f.w * k, f.h * k); sg.fillStyle = '#000'; sg.font = 'bold 14px sans-serif'; sg.fillText(`r${Math.floor(ci / cols)} c${ci % cols}`, x + 6, y + ch2 - 8) }
        contact = s.toDataURL('image/png');
      }
      const heights = Object.values(frames).map(f => f ? f.foot - f.top : 0);
      return { report, eyeLog, contact, heights, first: sheet && frames[0] ? frames[0].c.toDataURL('image/png') : null };
    }, { data, rows, cols, srcName, teal: !!TEAL_EYES[hero]?.includes(srcName), sheet, cleanWhite: !!WHITE_OUTLINE[hero]?.includes(srcName) });
    console.log(`${hero}/${srcName}: ${rep.report.shapes} figures (${rep.report.split} split), per cell ${rep.report.cells.join('')}${rep.eyeLog.length ? ', eyes ' + rep.eyeLog.map(([ci, e]) => `${ci}:${e.irises}/${e.changed}/${e.rejected}`).join(' ') : ''}`);
    if (sheet && rep.first) fs.writeFileSync(path.join(SRC, `${hero}-${srcName}-first.png`), Buffer.from(rep.first.split(',')[1], 'base64'));
    if (sheet && rep.contact) fs.writeFileSync(path.join(SRC, `${hero}-${srcName}-cleaned.png`), Buffer.from(rep.contact.split(',')[1], 'base64'));
   }
    // compose: one scale for all sources, one foot line, one body line
    const res = await page.evaluate(({ map, TARGET, sheet, teal }) => {
      const F = window.__F, H = f => f.foot - f.top, mean = a => a.reduce((x, y) => x + y, 0) / a.length;
      const animRun = [4, 5, 6, 7].map(i => F.anim[i]).filter(Boolean);
      const sAnim = TARGET / H(F.anim[0]);
      const SCALE = {
        anim: sAnim,
        run8: mean(animRun.map(H)) * sAnim / mean(Object.values(F.run8).filter(Boolean).map(H)),
        stand: TARGET / H(F.stand[0])
      };
      const turned = (f, deg) => {
        const R = Math.ceil(Math.hypot(f.w, f.h)), c2 = document.createElement('canvas'); c2.width = c2.height = R;
        const g2 = c2.getContext('2d'); g2.translate(R / 2, R / 2); g2.rotate(deg * Math.PI / 180); g2.drawImage(f.c, -f.w / 2, -f.h / 2);
        const dd = g2.getImageData(0, 0, R, R).data; let fy = 0, ty = R, minx = R, maxx = 0;
        for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) if (dd[(y * R + x) * 4 + 3] > 60) { if (y > fy) fy = y; if (y < ty) ty = y; if (x < minx) minx = x; if (x > maxx) maxx = x }
        return { c: c2, w: R, h: R, foot: fy, top: ty, left: minx, right: maxx, body: (minx + maxx) / 2 };
      };
      const used = []; const states = {};
      for (const [state, list] of Object.entries(map)) states[state] = list.map(([src, r, col, rot]) => {
        const cols = src === 'anim' ? 4 : src === 'run8' ? 4 : 1;
        let f = F[src][r * cols + col]; if (rot) f = turned(f, rot);
        if (state === 'slide') f = { ...f, body: (f.left + f.right) / 2 };
        used.push({ f, k: SCALE[src], name: `${state} ${src} r${r}c${col}` }); return used.length - 1;
      });
      let L = 0, Rt = 0, Up = 0;
      for (const { f, k } of used) { L = Math.max(L, (f.body - f.left) * k); Rt = Math.max(Rt, (f.right - f.body) * k); Up = Math.max(Up, (f.foot - f.top) * k) }
      const pad = 3, cw = Math.ceil(L + Rt + pad * 2), ch = Math.ceil(Up + pad * 2), ax = Math.ceil(L + pad), ay = ch - pad;
      const cols = 6, rowsOut = Math.ceil(used.length / cols);
      const atlas = document.createElement('canvas'); atlas.width = cols * cw; atlas.height = rowsOut * ch;
      const ag = atlas.getContext('2d'); ag.imageSmoothingQuality = 'high';
      used.forEach(({ f, k }, i) => {
        const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
        ag.save(); ag.beginPath(); ag.rect(ox, oy, cw, ch); ag.clip();
        ag.drawImage(f.c, ox + ax - f.body * k, oy + ay - f.foot * k, f.w * k, f.h * k); ag.restore();
      });
      const boxes = used.map(({ f, k }) => [Math.round((f.left - f.body) * k), Math.round((f.top - f.foot) * k), Math.round((f.right - f.body) * k)]);
      // the head (top fifth of the figure) as drawn: its width should match across sources, or a switch of state looks like a jump in size
      const head = used.map(({ f, k, name }) => { const c = f.c.getContext('2d').getImageData(0, 0, f.w, f.h).data; let mn = f.w, mx = 0; const y1 = f.top + (f.foot - f.top) * .2; for (let y = f.top; y < y1; y++) for (let x = 0; x < f.w; x++) if (c[(y * f.w + x) * 4 + 3] > 120) { if (x < mn) mn = x; if (x > mx) mx = x } return [name, Math.round((mx - mn) * k)] });
      // eyes at 3×: every used frame's face, for checking the recolour
      let eyes = null;
      if (sheet && teal) {
        const fw = 260, fh = 200, s = document.createElement('canvas'); s.width = fw * 6; s.height = fh * Math.ceil(used.length / 6); const sg = s.getContext('2d'); sg.imageSmoothingEnabled = false;
        used.forEach(({ f }, i) => { const x = (i % 6) * fw, y = Math.floor(i / 6) * fh; sg.fillStyle = '#ddd'; sg.fillRect(x, y, fw, fh);
          const z = 2.4 * 200 / (f.foot - f.top), [cx, cy] = f.eye || [f.left + (f.right - f.left) * .62, f.top + (f.foot - f.top) * .3], sw = fw / z, sh = fh / z;
          if (!f.eye) { sg.fillStyle = '#f00'; sg.fillRect(x, y, 8, 8) }
          sg.drawImage(f.c, cx - sw / 2, cy - sh / 2, sw, sh, x, y, fw, fh); if (!f.eye) { sg.fillStyle = '#f00'; sg.fillRect(x, y, 10, 10) } });
        eyes = s.toDataURL('image/png');
      }
      return { url: atlas.toDataURL('image/webp', 0.9), preview: atlas.toDataURL('image/png'), cell: [cw, ch], anchor: [ax, ay], cols, count: used.length, states, boxes, head, scale: SCALE, eyes };
    }, { map: MAP[hero], TARGET, sheet, teal: !!TEAL_EYES[hero] });
    console.log(`  scale anim ${res.scale.anim.toFixed(3)} run8 ${res.scale.run8.toFixed(3)} stand ${res.scale.stand.toFixed(3)}; head widths ${res.head.filter((_, i) => [0, 1, 9, 13].includes(i)).map(([n, w]) => n.split(' ')[0] + ' ' + w).join(', ')}`);
    fs.writeFileSync(path.join(OUT, `${hero}.webp`), Buffer.from(res.url.split(',')[1], 'base64'));
    if (sheet) {
      if (res.eyes) fs.writeFileSync(path.join(SRC, `${hero}-eyes.png`), Buffer.from(res.eyes.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(SRC, `${hero}-atlas-preview.png`), Buffer.from(res.preview.split(',')[1], 'base64'));
    }
    table[hero] = { src: `${hero}.webp`, cell: res.cell, anchor: res.anchor, cols: res.cols, height: TARGET, states: res.states, boxes: res.boxes, temporary: Object.keys(TEMPORARY[hero] || {}) };
    console.log(`  atlas ${res.cols}×${Math.ceil(res.count / res.cols)} cells of ${res.cell.join('×')}, ${res.count} frames → assets/games/jump/${hero}.webp (${(fs.statSync(path.join(OUT, `${hero}.webp`)).size / 1024).toFixed(0)} kB)`);
  }
  const notes = Object.entries(TEMPORARY).flatMap(([h, m]) => Object.entries(m).map(([s, why]) => `//   ${h}.${s}: ${why}`)).join('\n');
  fs.writeFileSync(path.join(OUT, 'sprites.js'), `// Written by tools/jump-sprites.cjs — do not edit by hand.\n// Per child: the atlas, the size of one cell, the foot anchor inside a cell\n// (every pose stands on it), and the cells that play each animation state.\n// Temporary frames:\n${notes}\nexport const SPRITES = {\n${Object.entries(table).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join(",\n")}\n};\n`);
  await browser.close();
})();
