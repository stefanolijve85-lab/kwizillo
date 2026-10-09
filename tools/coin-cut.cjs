#!/usr/bin/env node
// Cuts the single coins out of a sheet (a transparent PNG with the coins in rows,
// as Stefan had them made, 2026-10-10) into assets/geld/<currency>/<value>.webp (WebP with alpha: a twentieth of the PNG).
//
//   node tools/coin-cut.cjs            every sheet in SHEETS below
//   node tools/coin-cut.cjs --list     only prints what it finds per sheet (no files)
//
// A coin is a connected area of the alpha channel; the coins are numbered in reading
// order (row by row, left to right) and named after VALUES. The sheets carry a
// coloured fringe where the background was cut away (red on the copper and gold
// coins): the alpha is made hard and the edge pulled in by two pixels, then given
// a one-pixel soft edge again. Values are in the smallest unit (cents, pence,
// kopeks, øre, centavos, fils), so the game counts in whole numbers.
const fs = require('fs'); const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FFMPEG = path.join(ROOT, 'tools', 'bin', 'ffmpeg');
const RAW = path.join(ROOT, 'incoming', 'geld', 'raw');
const OUT = path.join(ROOT, 'assets', 'geld');
const SIZE = 256;   // longest side of a cut coin

// sheet file (in incoming/geld/raw) → currency folder and the value of each coin in reading order (null: skipped)
const SHEETS = [
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_03-1.png', cur: 'eur-nl', values: [1, 2, 5, 10, 20, 50, 100, 200] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_06-3.png', cur: 'eur-de', values: [1, 2, 5, 10, 20, 50, 100, 200] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_11-6.png', cur: 'eur-it', values: [1, 2, 5, 10, 20, 50, 100, 200] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_09-5.png', cur: 'eur-es', values: [1, 2, 5, 10, 20, 50, 100, 200] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_08-4.png', cur: 'eur-fr', values: [1, 2, 5, 10, 20, 50, 100, 200] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_05-2.png', cur: 'gbp', values: [1, 2, 5, 10, 20, 50, 100, 200] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_15-9.png', cur: 'rub', values: [null, null, null, 10, 50, 1000] },   // the top row touches: those three come from the spaced sheet below
  { file: 'hf-rub-spaced.png', cur: 'rub', values: [100, 200, 500] },
  // made with Higgsfield in the same style (2026-10-10): dollars and dirhams had no sheet of single coins
  { file: 'hf-usd.png', cur: 'usd', values: [1, 5, 10, 25, 50, 100] },
  { file: 'hf-aed.png', cur: 'aed', values: [5, 10, 25, 50, 100] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_16-10.png', cur: 'pln', values: [1, 2, 5, 10, 20, 50, 100, 200, 500] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_14-8.png', cur: 'dkk', values: [50, 100, 200, 500, 1000, 2000] },
  { file: 'ChatGPT-afbeelding 10 okt 2026, 00_43_12-7.png', cur: 'brl', values: [5, 10, 25, 50, 100] },
];

function readRGBA(file) {
  const probe = execFileSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return probe;
}
function decode(file) {
  let info = '';
  try { execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) { info = String(e.stderr); }
  const [, w, h] = info.match(/, (\d+)x(\d+)/);
  const buf = execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1e9 });
  return { w: +w, h: +h, px: buf };
}
function encode(dest, w, h, px) {
  execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`, '-i', '-',
    '-vf', `scale=${w >= h ? SIZE : -2}:${w >= h ? -2 : SIZE}:flags=lanczos`, '-c:v', 'libwebp', '-quality', '88', '-pix_fmt', 'yuva420p', dest], { input: px });
}

// Coins that touch come out as one wide area (the rouble sheet's top row): it is cut
// into round(width/height) coins at the columns where the fewest pixels are solid.
const SEAM = 10;
function split(img, c) {
  const W = c.x1 - c.x0 + 1, H = c.y1 - c.y0 + 1, k = Math.round(W / H);
  if (k < 2) return [c];
  const col = x => { let n = 0; for (let y = c.y0; y <= c.y1; y++) if (img.px[(y * img.w + x) * 4 + 3] > 128) n++; return n; };
  const cuts = [c.x0 - 1];
  for (let i = 1; i < k; i++) {
    const guess = c.x0 + Math.round(W * i / k), r = Math.round(W / k / 4);
    let best = guess, min = Infinity;
    for (let x = guess - r; x <= guess + r; x++) { const n = col(x); if (n < min) { min = n; best = x; } }
    cuts.push(best);
  }
  cuts.push(c.x1);
  return cuts.slice(1).map((x1, i) => {
    const x0 = cuts[i] + 1; let y0 = c.y1, y1 = c.y0;
    for (let x = x0; x <= x1; x++) for (let y = c.y0; y <= c.y1; y++) if (img.px[(y * img.w + x) * 4 + 3] > 128) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
    // a coin is round: its own circle (diameter = its height) from the side that was not cut
    const D = y1 - y0 + 1, left = i > 0, right = i < k - 1;
    const ccx = left && !right ? x1 - D / 2 : right && !left ? x0 + D / 2 : (x0 + x1) / 2;
    return { x0: Math.round(ccx - D / 2), y0, x1: Math.round(ccx + D / 2), y1, n: 0, cx: ccx, cy: (y0 + y1) / 2, circle: { cx: ccx, cy: (y0 + y1) / 2, r: D / 2 + 0.5 }, own: [left ? x0 + SEAM : -1, right ? x1 - SEAM : 1e9] };   // SEAM px on a cut side are mirrored too: the touching edge is dark
  });
}
function components(img) {
  const { w, h, px } = img, seen = new Uint8Array(w * h), found = [];
  const solid = i => px[i * 4 + 3] > 128;
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !solid(start)) continue;
    const stack = [start]; seen[start] = 1;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
    while (stack.length) {
      const i = stack.pop(), x = i % w, y = (i / w) | 0; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx; if (!seen[j] && solid(j)) { seen[j] = 1; stack.push(j); }
      }
    }
    if (n > w * h * 0.004) found.push(...split(img, { x0, y0, x1, y1, n, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }));
  }
  // reading order: a new row starts when a coin's centre is below the previous row's bottom half
  found.sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const c of found) { const r = rows[rows.length - 1]; if (r && c.cy < r.top + (r.bottom - r.top) * 0.75) { r.items.push(c); r.bottom = Math.max(r.bottom, c.y1); } else rows.push({ top: c.y0, bottom: c.y1, items: [c] }); }
  return rows.flatMap(r => r.items.sort((a, b) => a.cx - b.cx));
}

// hard alpha, edge pulled in by ERODE px, one soft pixel at the new edge
const ERODE = 2;
function cut(img, c) {
  const pad = 2, x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad), x1 = Math.min(img.w - 1, c.x1 + pad), y1 = Math.min(img.h - 1, c.y1 + pad);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = Buffer.alloc(w * h * 4);
  const a = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = ((y + y0) * img.w + (x + x0)) * 4, d = (y * w + x) * 4;
    const inside = !c.circle || Math.hypot(x + x0 - c.circle.cx, y + y0 - c.circle.cy) <= c.circle.r;   // a split coin is its own circle
    // beyond the cut the neighbour lies on top: the rim there is this coin's own rim, mirrored
    const X = x + x0, mirrored = c.own && (X < c.own[0] || X > c.own[1]) ? Math.round(2 * c.circle.cx - X) : X;
    const m = ((y + y0) * img.w + mirrored) * 4;
    img.px.copy(out, d, m, m + 4); a[y * w + x] = inside && img.px[m + 3] > 128 ? 1 : 0;
  }
  // keep only this coin: a flood fill from its centre (a neighbour's edge may sit in the box)
  const keep = new Uint8Array(w * h), st = [];
  // seeded on the centre row from the left edge inwards: a coin with a hole (the Danish krone) has nothing at its centre
  const row = ((c.cy - y0) | 0) * w; for (let x = 0; x < w; x++) if (a[row + x]) { keep[row + x] = 1; st.push(row + x); break; }
  while (st.length) { const i = st.pop(), x = i % w, y = (i / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (a[j] && !keep[j]) { keep[j] = 1; st.push(j); } } }
  // distance to the outside (chessboard, enough for a few pixels)
  const dist = new Uint8Array(w * h).fill(0);
  for (let i = 0; i < w * h; i++) dist[i] = keep[i] ? 255 : 0;
  for (let pass = 1; pass <= ERODE + 1; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (dist[i] !== 255) continue;
    let edge = false; for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || dist[ny * w + nx] === pass - 1) { edge = true; break; } }
    if (edge) dist[i] = pass;
  }
  for (let i = 0; i < w * h; i++) out[i * 4 + 3] = dist[i] === 255 || dist[i] > ERODE + 1 ? 255 : dist[i] === ERODE + 1 ? 128 : 0;
  return { w, h, px: out };
}

const list = process.argv.includes('--list');
for (const s of SHEETS) {
  const file = path.join(RAW, s.file);
  if (!fs.existsSync(file)) { console.log(`${s.cur}: sheet missing (${s.file})`); continue; }
  const img = decode(file), coins = components(img);
  const ok = coins.length === s.values.length;
  console.log(`${s.cur}: ${coins.length} coins found, ${s.values.length} expected ${ok ? '✔' : '✘'}  ${coins.map(c => `${c.x1 - c.x0 + 1}px`).join(' ')}`);
  if (list || !ok) continue;
  const dir = path.join(OUT, s.cur); fs.mkdirSync(dir, { recursive: true });
  coins.forEach((c, i) => { if (s.values[i] == null) return; const o = cut(img, c); encode(path.join(dir, `${s.values[i]}.webp`), o.w, o.h, o.px); });
}
