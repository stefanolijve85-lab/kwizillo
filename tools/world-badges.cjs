#!/usr/bin/env node
// Square world badges (assets/worlds/badge-<world>.jpg, 240x240): each world's
// painting cropped so its island sits in the middle at about the same size, for
// the round and rounded badges (Ouderzone "Niveau per wereld", statistics,
// collection). A crop of the full painting with object-position could not do
// that: the islands are at different places and of different sizes.
//
//   node tools/world-badges.cjs
//
// Per world: the island's centre (cx of the width, cy of the height) and the
// side of the square as a part of the width, read off a contact sheet.
const path = require('path'); const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), FF = path.join(__dirname, 'bin', 'ffmpeg');
const W = 752, H = 1344;   // every master is 752x1344
const CROPS = {
  ruimte: [0.36, 0.42, 0.82], dieren: [0.53, 0.42, 0.88], aarde: [0.42, 0.52, 0.98], geschiedenis: [0.50, 0.57, 1.0],
  wetenschap: [0.50, 0.54, 1.0], mysterie: [0.50, 0.42, 1.0], kunst: [0.48, 0.52, 1.0], sport: [0.50, 0.53, 1.0]
};
for (const [w, [cx, cy, side]] of Object.entries(CROPS)) {
  const s = Math.round(Math.min(side * W, W));
  const x = Math.max(0, Math.min(W - s, Math.round(cx * W - s / 2))), y = Math.max(0, Math.min(H - s, Math.round(cy * H - s / 2)));
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', path.join(ROOT, 'assets', 'worlds', `${w}.jpg`), '-vf', `crop=${s}:${s}:${x}:${y},scale=240:240:flags=lanczos`, '-q:v', '3', path.join(ROOT, 'assets', 'worlds', `badge-${w}.jpg`)]);
}
console.log(`${Object.keys(CROPS).length} badges written to assets/worlds/`);
