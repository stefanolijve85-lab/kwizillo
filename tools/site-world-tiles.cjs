#!/usr/bin/env node
// The eight world tiles on the website (3:4), cut from the world plates so that
// every island sits in the same place: centred across, at 37% of the height
// (above the name and topics that lie over the bottom of the tile), about 80%
// of the tile wide. The plates put their islands anywhere — top left for Space,
// low for Earth and History — so a plain centre crop made eight different tiles.
// Where an island sits too low, the plate runs on under it with its own bottom
// strip mirrored and softened; that part lies under the dark caption.
//
//   node tools/site-world-tiles.cjs      → site/assets/worlds/<world>.jpg (540 x 720)
const { execFileSync } = require('child_process');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const FF = fs.existsSync(path.join(__dirname, 'bin', 'ffmpeg')) ? path.join(__dirname, 'bin', 'ffmpeg') : 'ffmpeg';
const OUT = path.join(ROOT, 'site', 'assets', 'worlds');
const IW = 752, IH = 1344, EXT = 420;
// The island (with what stands on it) in plate pixels: x0, x1, y0, y1.
const ISLAND = {
  ruimte: [10, 450, 330, 800], dieren: [120, 640, 280, 860], aarde: [0, 660, 640, 1180],
  geschiedenis: [20, 730, 540, 1140], wetenschap: [50, 720, 460, 1040], mysterie: [80, 720, 180, 760],
  kunst: [20, 740, 330, 1140], sport: [20, 740, 430, 1120]
};
fs.mkdirSync(OUT, { recursive: true });
for (const [w, [x0, x1, y0, y1]] of Object.entries(ISLAND)) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const W = Math.round(Math.min(IW, (x1 - x0) / 0.8)), H = Math.round(W * 4 / 3);
  const X = Math.round(Math.min(Math.max(0, cx - W / 2), IW - W));
  const Y = Math.round(Math.min(Math.max(0, cy - 0.37 * H), IH + EXT - H));
  const f = `[0]split[a][b];[b]crop=${IW}:${EXT}:0:${IH - EXT},vflip,gblur=sigma=6[m];[a][m]vstack,crop=${W}:${H}:${X}:${Y},scale=540:720:flags=lanczos`;
  execFileSync(FF, ['-v', 'error', '-y', '-i', path.join(ROOT, 'assets', 'worlds', `${w}.jpg`), '-filter_complex', f, '-q:v', '4', path.join(OUT, `${w}.jpg`)]);
  console.log(`${w}.jpg  crop ${W}x${H} at ${X},${Y}`);
}
