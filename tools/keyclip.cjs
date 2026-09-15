#!/usr/bin/env node
// Green-screen talking clip → transparent clips for the app:
//   node tools/keyclip.cjs <green.mp4> <out-basename> [--screen-mouth]   (KEYCLIP_KEEP=1 keeps the frames, KEYCLIP_DEBUG=1 draws the erase ellipses)
// writes <out>.webm (VP9 + alpha, Chrome/Android/Firefox) and <out>.mp4 (HEVC +
// alpha, Safari/iOS, made by Apple's own encoder so Safari honours the alpha).
//
// Keying happens here, once: ffmpeg chromakey (no despill — it discolours the
// golden helmet), cropped to the character (union alpha box over sampled frames
// + 4 %, like the cut-outs). With --screen-mouth (Milo) the video model is only
// trusted for the body: its mouth on the face screen is painted over and a
// simple robot mouth is drawn per frame from the voice loudness — a glowing arc
// when quiet, an "O" when loud — so it is always one clean mouth.
//
// Needs ffmpeg (static build in tools/bin/ffmpeg, git-ignored — evermeet.cx) and
// macOS avconvert (HEVC with alpha).
const { execFileSync } = require('child_process'); const fs = require('fs'); const path = require('path'); const os = require('os');
const FF = fs.existsSync(path.join(__dirname, 'bin', 'ffmpeg')) ? path.join(__dirname, 'bin', 'ffmpeg') : 'ffmpeg';
const KEY = 'chromakey=0x00B140:0.12:0.08';
const FPS = 25, OUT_H = 704;
const args = process.argv.slice(2); const screenMouth = args.includes('--screen-mouth');
const [src, out] = args.filter(a => !a.startsWith('--'));
if (!src || !out) { console.error('usage: keyclip <green.mp4> <out-basename> [--screen-mouth]'); process.exit(1); }
const ff = a => execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', ...a], { stdio: 'inherit' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'keyclip-'));
const { chromium } = require('playwright');

// Loudness per frame from the clip's own audio (16 kHz mono wav → RMS per 1/FPS s, scaled to the loud parts).
function envelope(wav) {
  const buf = fs.readFileSync(wav); const data = buf.subarray(44); const n = data.length >> 1; const step = Math.round(16000 / FPS); const env = [];
  for (let s = 0; s < n; s += step) { let sum = 0, c = 0; for (let i = s; i < Math.min(n, s + step); i++) { const v = data.readInt16LE(i * 2) / 32768; sum += v * v; c++; } env.push(Math.sqrt(sum / Math.max(1, c))); }
  const ref = [...env].sort((a, b) => a - b)[Math.floor(env.length * .95)] || 1;
  return env.map(v => Math.min(1, v / ref));
}

(async () => {
  // 1. keyed frames at the source resolution + the audio
  const fr = path.join(tmp, 'f'); fs.mkdirSync(fr);
  ff(['-i', src, '-vf', KEY, path.join(fr, 'f%04d.png')]);
  ff(['-i', src, '-vn', '-ac', '1', '-ar', '16000', '-f', 'wav', path.join(tmp, 'audio.wav')]);
  const frames = fs.readdirSync(fr).filter(f => f.endsWith('.png')).sort().map(f => path.join(fr, f));
  const env = envelope(path.join(tmp, 'audio.wav'));

  const b = await chromium.launch(); const p = await b.newPage();
  // 2. the character's box (union over every 12th frame)
  const box = await p.evaluate(async files => {
    let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0, W = 0, H = 0;
    for (const b64 of files) { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); W = i.width; H = i.height;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, W, H).data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    const pad = Math.round((y1 - y0) * .04); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    return { x: x0 & ~1, y: y0 & ~1, w: (x1 - x0 + 1) & ~1, h: (y1 - y0 + 1) & ~1, W, H };
  }, frames.filter((_, i) => i % 12 === 0).map(f => fs.readFileSync(f).toString('base64')));

  // 3. per frame: crop (+ robot mouth), scale to OUT_H, back to PNG
  const outDir = path.join(tmp, 'o'); fs.mkdirSync(outDir);
  const scale = OUT_H / box.h, outW = Math.round(box.w * scale) & ~1;
  for (let i = 0; i < frames.length; i++) {
    const png = await p.evaluate(async ([b64, box, outW, outH, open, mouth, debug]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = box.w; c.height = box.h; const g = c.getContext('2d'); g.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      if (mouth) {
        const W = box.w, H = box.h, d = g.getImageData(0, 0, W, H).data;
        // the face screen: largest dark opaque blob in the upper 60 %
        const lum = i => d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11; const ok = i => d[i * 4 + 3] > 200 && lum(i) < 70;
        const lab = new Int32Array(W * H); let best = null, n = 0; const limit = Math.round(H * .6) * W;
        for (let i = 0; i < limit; i++) { if (lab[i] || !ok(i)) continue; n++; const q = [i]; lab[i] = n; let x0 = W, y0 = H, x1 = 0, y1 = 0, cnt = 0;
          while (q.length) { const j = q.pop(); cnt++; const x = j % W, y = (j / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; for (const k of [j - 1, j + 1, j - W, j + W]) { if (k < 0 || k >= limit || lab[k] || !ok(k)) continue; if ((k === j - 1 && x === 0) || (k === j + 1 && x === W - 1)) continue; lab[k] = n; q.push(k); } }
          if (!best || cnt > best.cnt) best = { x0, y0, x1, y1, cnt }; }
        if (best) {
          const sw = best.x1 - best.x0, sh = best.y1 - best.y0, cx = best.x0 + sw * .5, cy = best.y0 + sh * .76;
          // screen colour from a quiet corner of the screen; glow colour of the eyes
          const px = (x, y) => { const k = 4 * (Math.round(y) * W + Math.round(x)); return [d[k], d[k + 1], d[k + 2]]; };
          // paint the model's mouth away. The screen itself is nearly flat dark
          // (lum 12–17) while the model mouth's halo lights the whole lower
          // screen (30–60), so an ellipse over the mouth is replaced by the
          // screen's own dark colour on that row (darkest quarter of the row,
          // left and right kept apart), and around it the halo is faded back
          // to the original over a wide soft band — no edge, no lighter patch.
          // Bright pixels (eye rings, the glass reflection) are left alone.
          const ex = cx, ey = cy + sh * .04, rx = sw * .25, ry = sh * .17, feather = 2.4;
          const rows = new Map();
          const side = (y, xa, xb) => { const c = []; for (let x = Math.round(xa); x <= Math.round(xb); x++) { if (x < 0 || x >= W) continue; const k = 4 * (y * W + x); if (d[k + 3] < 200) continue; const p = [d[k], d[k + 1], d[k + 2]]; c.push([p[0] * .3 + p[1] * .59 + p[2] * .11, p]); } if (c.length < 4) return null; c.sort((a, b) => a[0] - b[0]); const h = c.slice(0, Math.max(1, c.length >> 2)); return [0, 1, 2].map(i => h.reduce((t, e) => t + e[1][i], 0) / h.length); };
          const yA = Math.max(0, Math.round(ey - ry * feather)), yB = Math.min(best.y1 - 2, Math.round(ey + ry * feather));
          for (let y = yA; y <= yB; y++) rows.set(y, { l: side(y, best.x0 + sw * .08, ex - 1), r: side(y, ex + 1, best.x1 - sw * .08) });
          let pl = null, pr = null; for (let y = yA; y <= yB; y++) { const o = rows.get(y); o.l = o.l || pl || o.r || [8, 20, 50]; o.r = o.r || pr || o.l; pl = o.l; pr = o.r; }
          const sm = (y, k) => { let o = [0, 0, 0], n2 = 0; for (let j = Math.max(yA, y - 2); j <= Math.min(yB, y + 2); j++) { const v = rows.get(j)[k]; o[0] += v[0]; o[1] += v[1]; o[2] += v[2]; n2++; } return o.map(v => v / n2); };
          // the chroma key bites into every cyan glow on the screen (eye rings, the
          // model mouth) leaving half-transparent pixels on what is solid glass:
          // the whole screen box is made opaque again (their colour is intact)
          for (let y = best.y0; y <= best.y1; y++) for (let x = best.x0; x <= best.x1; x++) d[4 * (y * W + x) + 3] = 255;
          const src = new Uint8ClampedArray(d);
          // bright pixels (eye rings, reflections) and a 3 px rim around them are never touched
          const bright = new Uint8Array(W * H);
          for (let y = yA; y <= yB; y++) for (let x = 0; x < W; x++) { const k = 4 * (y * W + x); if (src[k + 3] >= 250 && src[k] * .3 + src[k + 1] * .59 + src[k + 2] * .11 > 95) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const yy = y + j, xx = x + i; if (yy >= 0 && yy < H && xx >= 0 && xx < W) bright[yy * W + xx] = 1; } }
          for (let y = yA; y <= yB; y++) {
            const l = sm(y, 'l'), r = sm(y, 'r'), xA = Math.max(0, Math.round(ex - rx * feather)), xB = Math.min(W - 1, Math.round(ex + rx * feather));
            for (let x = xA; x <= xB; x++) {
              const e = Math.sqrt(((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2); if (e >= feather) continue;
              const k = 4 * (y * W + x);
              // the chroma key bites into the model mouth's cyan glow (alpha < 255
              // on an opaque screen): those pixels are garbage and get the fill
              const keyed = src[k + 3] < 250;
              const lum = src[k] * .3 + src[k + 1] * .59 + src[k + 2] * .11;
              let w = e <= 1 ? 1 : 1 - (e - 1) / (feather - 1); w = w * w * (3 - 2 * w);
              if (keyed) w = e <= 1.3 ? 1 : Math.max(w, .6);
              else if (e > 1) { if (bright[y * W + x]) continue; const m = 1 - Math.max(0, Math.min(1, (lum - 50) / 45)); if (!m) continue; w *= m * m * (3 - 2 * m); }
              const f = (x - ex) / (2 * rx * feather) + .5, fill = [0, 1, 2].map(i => l[i] + (r[i] - l[i]) * f);
              for (let i = 0; i < 3; i++) d[k + i] = src[k + i] + (fill[i] - src[k + i]) * w;
              if (debug === 3 && e <= 1) { d[k] = 255; d[k + 1] = 0; d[k + 2] = 255; }
              d[k + 3] = 255;
            }
          }
          g.putImageData(new ImageData(d, W, H), 0, 0);
          // the robot mouth: an arc when quiet that fills into an "O" when loud
          if (debug === 2) open = -1;
          const glow = '#4fd0ff', r = sw * .085, o = Math.max(0, Math.min(1, open));
          g.save(); g.shadowColor = 'rgba(70,190,255,.85)'; g.shadowBlur = sw * .05; g.lineCap = 'round';
          g.strokeStyle = glow; g.lineWidth = sw * .035;
          if (open < 0) {} else if (o < .18) { g.beginPath(); g.arc(cx, cy - r * .35, r, Math.PI * .12, Math.PI * .88); g.stroke(); }
          else { const hh = r * (.35 + o * .75); g.beginPath(); g.ellipse(cx, cy, r, hh, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(79,208,255,.92)'; g.fill(); g.stroke(); }
          g.restore();
          if (debug) { g.save(); g.lineWidth = 1; g.strokeStyle = 'red'; g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'yellow'; g.beginPath(); g.ellipse(ex, ey, rx * feather, ry * feather, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'lime'; g.strokeRect(best.x0, best.y0, sw, sh); g.restore(); }
        }
      }
      const o = document.createElement('canvas'); o.width = outW; o.height = outH; const og = o.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(c, 0, 0, outW, outH);
      return o.toDataURL('image/png').split(',')[1];
    }, [fs.readFileSync(frames[i]).toString('base64'), box, outW, OUT_H, env[i] ?? 0, screenMouth, +(process.env.KEYCLIP_DEBUG||0)]);
    fs.writeFileSync(path.join(outDir, `f${String(i + 1).padStart(4, '0')}.png`), Buffer.from(png, 'base64'));
  }
  await b.close();

  // 4. encode: WebM VP9+alpha from the frames; ProRes 4444 → Apple HEVC with alpha
  const seq = path.join(outDir, 'f%04d.png'), audio = path.join(tmp, 'audio.wav');
  ff(['-framerate', String(FPS), '-i', seq, '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '1200k', '-crf', '30', '-deadline', 'good', '-cpu-used', '2', '-c:a', 'libopus', '-b:a', '64k', '-shortest', `${out}.webm`]);
  const prores = path.join(tmp, 'prores.mov');
  ff(['-framerate', String(FPS), '-i', seq, '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-c:a', 'pcm_s16le', '-shortest', prores]);
  execFileSync('avconvert', ['--preset', 'PresetHEVC1920x1080WithAlpha', '--source', prores, '--output', `${out}.mp4`, '--replace'], { stdio: 'ignore' });
  if (process.env.KEYCLIP_KEEP) console.log('kept', tmp); else fs.rmSync(tmp, { recursive: true, force: true });
  const kb = f => Math.round(fs.statSync(f).size / 1024) + ' KB';
  console.log(`${path.basename(out)}: ${outW}x${OUT_H} from ${box.w}x${box.h}${screenMouth ? ', robot mouth' : ''} → webm ${kb(out + '.webm')}, mp4 ${kb(out + '.mp4')}`);
})();
