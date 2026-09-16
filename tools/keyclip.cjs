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

  const b = await chromium.launch(); const p = await b.newPage(); if (process.env.KEYCLIP_DEBUG) p.on('console', m => console.error('[page]', m.text()));
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
          // The screen's bottom is read off its side columns: a dark mouth the model
          // paints on the rim under the screen joins the blob in the middle and
          // would pull the bottom edge down.
          { const w0 = best.x1 - best.x0; let lows = []; for (const xs of [[best.x0 + w0 * .12, best.x0 + w0 * .22], [best.x1 - w0 * .22, best.x1 - w0 * .12]]) for (let x = Math.round(xs[0]); x <= Math.round(xs[1]); x += 2) { let low = -1; for (let y = best.y0; y <= best.y1; y++) if (ok(y * W + x)) low = y; if (low >= 0) lows.push(low); }
            if (lows.length) { lows.sort((a, b) => a - b); best.y1 = Math.min(best.y1, lows[lows.length >> 1] + 1); } }
          const sw = best.x1 - best.x0, sh = best.y1 - best.y0; let cx = best.x0 + sw * .5, cy = best.y0 + sh * .76;
          // Frame 1 of every clip is the mouthless base itself (omnihuman starts
          // from the still), so it is the reference for "what the screen and the
          // rim look like without a mouth". Everything the model paints — a glowing
          // mouth on the screen, teeth on the rim, a lip line, a whole open mouth
          // under the screen — is replaced by the reference's own pixels, mapped
          // through the screen box (the head only shifts and scales a little).
          for (let y = best.y0; y <= best.y1; y++) for (let x = best.x0; x <= best.x1; x++) d[4 * (y * W + x) + 3] = 255;   // the key bites into cyan glows on solid glass
          const src = new Uint8ClampedArray(d);
          if (!window.__ref) { let dk = [0, 0, 0], dn = 0; for (let y = Math.round(best.y0 + sh * .55); y < best.y0 + sh * .9; y++) for (let x = Math.round(best.x0 + sw * .4); x < best.x0 + sw * .6; x++) { const k = 4 * (y * W + x); if (src[k] * .3 + src[k + 1] * .59 + src[k + 2] * .11 < 60) { dk[0] += src[k]; dk[1] += src[k + 1]; dk[2] += src[k + 2]; dn++; } } window.__ref = { d: src, box: { ...best }, sw, sh, dark: dn ? dk.map(v => v / dn) : [8, 20, 50] }; }
          const ref = window.__ref, rsx = ref.sw / sw, rsy = ref.sh / sh;
          let refAt = (x, y) => { const xx = Math.round(ref.box.x0 + (x - best.x0) * rsx); const yy = Math.round(y <= best.y1 ? ref.box.y0 + (y - best.y0) * rsy : ref.box.y1 + (y - best.y1) * rsy); if (xx < 0 || xx >= W || yy < 0 || yy >= H) return null; return 4 * (yy * W + xx); };
          const lumOf = k => src[k] * .3 + src[k + 1] * .59 + src[k + 2] * .11, satOf = k => Math.max(src[k], src[k + 1], src[k + 2]) - Math.min(src[k], src[k + 1], src[k + 2]);
          const rlum = k => ref.d[k] * .3 + ref.d[k + 1] * .59 + ref.d[k + 2] * .11, rsat = k => Math.max(ref.d[k], ref.d[k + 1], ref.d[k + 2]) - Math.min(ref.d[k], ref.d[k + 1], ref.d[k + 2]);
          const toRef = (k, kr, w) => { for (let i = 0; i < 3; i++) d[k + i] = src[k + i] + (ref.d[kr + i] - src[k + i]) * w; if (w > .5) d[k + 3] = 255; };
          // The eye rings: on frame 1 (open eyes) the two largest bright-cyan
          // blobs; afterwards each eye is tracked to the blob nearest its previous
          // position, so a blink (a flat arc) or the model's glowing mouth never
          // takes over. The mouth is fixed to the line between the eyes: position,
          // scale and tilt — screwed to the face while the head moves.
          const cyan = new Uint8Array(W * H), blobs = [];
          for (let y = best.y0; y < best.y0 + sh * .85; y++) for (let x = best.x0; x <= best.x1; x++) { const k = 4 * (y * W + x); if (lumOf(k) > 110 && src[k + 2] > src[k] + 40) cyan[y * W + x] = 1; }
          for (let y = best.y0; y < best.y0 + sh * .85; y++) for (let x = best.x0; x <= best.x1; x++) { const i0 = y * W + x; if (cyan[i0] !== 1) continue; const q = [i0]; cyan[i0] = 2; let sx = 0, sy = 0, n2 = 0, by0 = H, by1 = 0;
            while (q.length) { const j = q.pop(); const jx = j % W, jy = (j / W) | 0; sx += jx; sy += jy; n2++; if (jy < by0) by0 = jy; if (jy > by1) by1 = jy; for (const t of [j - 1, j + 1, j - W, j + W]) { if (t < 0 || t >= W * H || cyan[t] !== 1) continue; if ((t === j - 1 && jx === 0) || (t === j + 1 && jx === W - 1)) continue; cyan[t] = 2; q.push(t); } }
            blobs.push({ x: sx / n2, y: sy / n2, n: n2, h: by1 - by0 + 1 }); }
          blobs.sort((a, b) => b.n - a.n);
          let eyes = window.__eyes;
          if (!eyes) { if (blobs.length >= 2 && Math.abs(blobs[0].x - blobs[1].x) > sw * .15) { const [A, B] = blobs[0].x < blobs[1].x ? [blobs[0], blobs[1]] : [blobs[1], blobs[0]]; eyes = window.__eyes = { lx: A.x, ly: A.y, rx: B.x, ry: B.y }; window.__ring = { h: (A.h + B.h) / 2, n: (A.n + B.n) / 2 }; } }
          else {
            // the pair of blobs that moves like a rigid pair of eyes: near their previous
            // spots, with the same distance and tilt (a blink is an arc in the same place;
            // the model's glowing mouth is a blob that would change the geometry)
            const ed0 = Math.hypot(eyes.rx - eyes.lx, eyes.ry - eyes.ly), t0 = Math.atan2(eyes.ry - eyes.ly, eyes.rx - eyes.lx);
            // at 24 fps an eye never jumps more than a sixth of the eye distance between frames, and never down to the mouth
            // and only a whole ring may move an eye: a blink or a happy squint is a half arc
            // whose centroid sits low and to one side — then the eyes simply stay put
            const ring = window.__ring || { h: 0, n: 0 };
            const cand = (px0, py0) => blobs.filter(bl => bl.h >= ring.h * .82 && bl.n >= ring.n * .7 && Math.hypot(bl.x - px0, bl.y - py0) < ed0 * .18 && bl.y < py0 + ed0 * .12);
            let bestPair = null, bestCost = ed0 * .5;
            for (const A of cand(eyes.lx, eyes.ly)) for (const B of cand(eyes.rx, eyes.ry)) { if (A === B) continue; const e1 = Math.hypot(B.x - A.x, B.y - A.y), t1 = Math.atan2(B.y - A.y, B.x - A.x);
              const cost = Math.hypot(A.x - eyes.lx, A.y - eyes.ly) * .5 + Math.hypot(B.x - eyes.rx, B.y - eyes.ry) * .5 + Math.abs(e1 - ed0) * 2 + Math.abs(t1 - t0) * ed0 * 2; if (cost < bestCost) { bestCost = cost; bestPair = [A, B]; } }
            if (bestPair) { const [nl, nr] = bestPair; eyes = window.__eyes = { lx: eyes.lx * .3 + nl.x * .7, ly: eyes.ly * .3 + nl.y * .7, rx: eyes.rx * .3 + nr.x * .7, ry: eyes.ry * .3 + nr.y * .7 }; window.__lost = 0; }
            else {
              // the head moved on during a blink: once two whole rings with the right
              // spacing are back anywhere near, snap to them
              window.__lost = (window.__lost || 0) + 1;
              const rings = blobs.filter(bl => bl.h >= ring.h * .82 && bl.n >= ring.n * .7).slice(0, 2);
              if (rings.length === 2) { const [A, B] = rings[0].x < rings[1].x ? [rings[0], rings[1]] : [rings[1], rings[0]]; const e1 = Math.hypot(B.x - A.x, B.y - A.y), t1 = Math.atan2(B.y - A.y, B.x - A.x);
                if (Math.abs(e1 - ed0) < ed0 * .25 && Math.abs(t1 - t0) < .35 && Math.hypot(A.x - eyes.lx, A.y - eyes.ly) < ed0 * .6) { eyes = window.__eyes = { lx: A.x, ly: A.y, rx: B.x, ry: B.y }; window.__lost = 0; } }
            }
          }
          let ed = sw * .45, tilt = 0, eyeLine = y => best.y0 + sh * .45;
          if (eyes && !ref.eyes) ref.eyes = { ...eyes };
          if (eyes && ref.eyes) {
            // map through the eyes instead of the screen box: shift, scale and tilt of the head
            const re = ref.eyes, rmx = (re.lx + re.rx) / 2, rmy = (re.ly + re.ry) / 2, rtilt = Math.atan2(re.ry - re.ly, re.rx - re.lx), red = Math.hypot(re.rx - re.lx, re.ry - re.ly);
            const mx0 = (eyes.lx + eyes.rx) / 2, my0 = (eyes.ly + eyes.ry) / 2, t0 = Math.atan2(eyes.ry - eyes.ly, eyes.rx - eyes.lx), sc = red / Math.hypot(eyes.rx - eyes.lx, eyes.ry - eyes.ly), dt = (rtilt - t0) * .5;
            const cs = Math.cos(dt), sn = Math.sin(dt);
            refAt = (x, y) => { const px0 = x - mx0, py0 = y - my0; const xx = Math.round(rmx + (px0 * cs - py0 * sn) * sc), yy = Math.round(rmy + (px0 * sn + py0 * cs) * sc); if (xx < 0 || xx >= W || yy < 0 || yy >= H) return null; return 4 * (yy * W + xx); };
          }
          if (eyes) { const dx = eyes.rx - eyes.lx, dy = eyes.ry - eyes.ly; ed = Math.hypot(dx, dy); tilt = Math.atan2(dy, dx); const mx = (eyes.lx + eyes.rx) / 2, my = (eyes.ly + eyes.ry) / 2; cx = mx; cy = my + ed * .35; eyeLine = x => my + (x - mx) * Math.tan(tilt) * .5; }   // a 3D head turn also drops one eye: only half the tilt is roll
          // distance (px) to the nearest bright pixel ABOVE the eye line + a bit (the rings and brows), so their glow is never touched
          const FAR = 1e4, dist = new Float32Array(W * H).fill(FAR);
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = 4 * (y * W + x); if (src[k + 3] >= 250 && lumOf(k) > 95 && (eyes ? Math.min(Math.hypot(x - eyes.lx, y - eyes.ly), Math.hypot(x - eyes.rx, y - eyes.ry)) < ed * .36 : y < eyeLine(x) + ed * .22)) dist[y * W + x] = 0; }
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let v = dist[i]; if (x) v = Math.min(v, dist[i - 1] + 1); if (y) { v = Math.min(v, dist[i - W] + 1); if (x) v = Math.min(v, dist[i - W - 1] + 1.4); if (x < W - 1) v = Math.min(v, dist[i - W + 1] + 1.4); } dist[i] = v; }
          for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; let v = dist[i]; if (x < W - 1) v = Math.min(v, dist[i + 1] + 1); if (y < H - 1) { v = Math.min(v, dist[i + W] + 1); if (x < W - 1) v = Math.min(v, dist[i + W + 1] + 1.4); if (x) v = Math.min(v, dist[i + W - 1] + 1.4); } dist[i] = v; }
          const ringGap = ed * .12;
          // 1. the screen under the eyes becomes the reference outright (it is flat
          //    dark glass there); between the eyes only what is lit up more than the
          //    reference goes back. Fades out towards the screen's own edges.
          const ex = cx, ey = cy + ed * .03, rx = ed * .5, ry = ed * .2;
          for (let y = Math.round(best.y0 + sh * .3); y <= Math.min(H - 1, Math.round(best.y1 + sh * .12)); y++) for (let x = best.x0; x <= best.x1; x++) {
            const k = 4 * (y * W + x), kr = refAt(x, y);
            const g2 = Math.min(1, dist[y * W + x] / ringGap); if (!g2) continue;
            const below = (y - eyeLine(x)) / ed;   // in eye distances under the eye line
            const gate = g2 * g2 * (3 - 2 * g2);
            if (below > .2) {
              // dark glass in the reference → dark glass; where the mapping runs off the
              // reference screen (head looking up/down) a lit pixel becomes the reference's dark
              if (lumOf(k) >= 200) continue;                                          // never over the current rim
              if (kr !== null && rlum(kr) < 70) toRef(k, kr, gate);
              else if (y <= best.y1 && lumOf(k) > 30) { const w = gate * Math.min(1, (lumOf(k) - 30) / 15); for (let i = 0; i < 3; i++) d[k + i] = src[k + i] + (ref.dark[i] - src[k + i]) * w; d[k + 3] = 255; }
            } else if (kr !== null) { const w = Math.max(0, Math.min(1, (lumOf(k) - rlum(kr) - 2) / 10)) * gate; if (w > 0) toRef(k, kr, w); }   // between the eyes: only what is lit up
          }
          // 2. the rim under the screen: whatever differs from the reference there
          //    (teeth, a lip line, an orange open mouth) is the reference again
          for (let y = best.y1 + 1; y <= Math.min(H - 1, Math.round(best.y1 + sh * .4)); y++) for (let x = Math.round(ex - sw * .45); x <= Math.round(ex + sw * .45); x++) {
            const k = 4 * (y * W + x), kr = refAt(x, y); if (kr === null) continue;
            const off = src[k + 3] < 250 ? 1 : Math.max((Math.abs(lumOf(k) - rlum(kr)) - 10) / 20, (Math.abs(satOf(k) - rsat(kr)) - 14) / 20);
            const hx = Math.min(1, (sw * .45 - Math.abs(x - ex)) / (sw * .08)), vy = Math.min(1, (best.y1 + sh * .4 - y) / (sh * .08));
            const w = Math.max(0, Math.min(1, Math.min(off, hx, vy))); if (w > 0) toRef(k, kr, w);
          }
          if (debug) console.log('eyes', JSON.stringify(eyes), 'ring', JSON.stringify(window.__ring), 'blobs', blobs.slice(0, 4).map(b => [Math.round(b.x), Math.round(b.y), b.n, b.h].join('/')).join(' '));
          g.putImageData(new ImageData(d, W, H), 0, 0);
          // the robot mouth: an arc when quiet that fills into an "O" when loud
          if (debug === 2) open = -1;
          const glow = "#5fd8ff", r = ed * .185, o = Math.max(0, Math.min(1, open));
          g.save(); g.translate(cx, cy); g.rotate(tilt * .5);   // the mouth tilts with the head (half: a head turn is not a roll)
          g.shadowColor = 'rgba(80,200,255,.95)'; g.shadowBlur = ed * .16; g.lineCap = 'round';
          g.strokeStyle = glow; g.lineWidth = ed * .095;
          if (open < 0) {} else if (o < .18) { g.beginPath(); g.arc(0, -r * .35, r, Math.PI * .12, Math.PI * .88); g.stroke(); }
          else { const hh = r * (.8 + o * .2); g.beginPath(); g.ellipse(0, 0, r, hh, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(95,216,255,.95)'; g.fill(); g.stroke(); }
          g.restore();
          if (debug) { g.save(); g.lineWidth = 1; if (eyes) { g.strokeStyle = 'yellow'; g.beginPath(); g.arc(eyes.lx, eyes.ly, 4, 0, 7); g.stroke(); g.beginPath(); g.arc(eyes.rx, eyes.ry, 4, 0, 7); g.stroke(); g.beginPath(); g.moveTo(eyes.lx, eyes.ly); g.lineTo(eyes.rx, eyes.ry); g.stroke(); } g.strokeStyle = 'red'; g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'lime'; g.strokeRect(best.x0, best.y0, sw, sh); g.restore(); }
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
