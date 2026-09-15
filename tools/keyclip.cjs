#!/usr/bin/env node
// Green-screen talking clip → transparent clips for the app:
//   node tools/keyclip.cjs <green.mp4> <out-basename>
// writes <out>.webm (VP9 + alpha, Chrome/Android) and <out>.mp4 (HEVC + alpha, Safari/iOS).
// Keying is done here, once, with ffmpeg's chromakey + despill, cropped to the
// character (union of the alpha box over sampled frames + 4 % margin, like the
// cut-outs), so the browser plays a real transparent video and does no keying.
// Needs ffmpeg (static build in tools/bin/ffmpeg, git-ignored — evermeet.cx/ffmpeg).
const { execFileSync } = require('child_process'); const fs = require('fs'); const path = require('path'); const os = require('os');
const FF = fs.existsSync(path.join(__dirname, 'bin', 'ffmpeg')) ? path.join(__dirname, 'bin', 'ffmpeg') : 'ffmpeg';
// No despill: it pulls green out of Milo's golden helmet too; the key alone leaves no visible fringe.
const KEY = 'chromakey=0x00B140:0.12:0.08';
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: keyclip <green.mp4> <out-basename>'); process.exit(1); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'keyclip-'));
// 1. sample frames, keyed, to find the character's box
execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-vf', `${KEY},fps=2`, path.join(tmp, 'f%03d.png')]);
const frames = fs.readdirSync(tmp).filter(f => f.endsWith('.png')).map(f => path.join(tmp, f));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const box = await p.evaluate(async files => {
    let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0, W = 0, H = 0;
    for (const b64 of files) { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); W = i.width; H = i.height;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, W, H).data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    const pad = Math.round((y1 - y0) * .04); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    const w = (x1 - x0 + 1) & ~1, h = (y1 - y0 + 1) & ~1; return { x: x0 & ~1, y: y0 & ~1, w, h, W, H };
  }, frames.map(f => fs.readFileSync(f).toString('base64')));
  await b.close();
  const crop = `crop=${box.w}:${box.h}:${box.x}:${box.y}`;
  // 2. VP9 + alpha (WebM) and HEVC + alpha (MP4, VideoToolbox)
  execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-vf', `${crop},${KEY},format=yuva420p`, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '1200k', '-crf', '30', '-deadline', 'good', '-cpu-used', '2', '-c:a', 'libopus', '-b:a', '64k', `${out}.webm`]);
  execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-vf', `${crop},${KEY},format=bgra`, '-c:v', 'hevc_videotoolbox', '-alpha_quality', '0.7', '-b:v', '1300k', '-tag:v', 'hvc1', '-pix_fmt', 'bgra', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', `${out}.mp4`]);
  fs.rmSync(tmp, { recursive: true, force: true });
  const kb = f => Math.round(fs.statSync(f).size / 1024) + ' KB';
  console.log(`${path.basename(out)}: ${box.w}x${box.h} (of ${box.W}x${box.H}) → webm ${kb(out + '.webm')}, mp4 ${kb(out + '.mp4')}`);
})();
