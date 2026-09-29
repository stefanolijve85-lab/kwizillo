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

// Mouth opening per frame from the clip's own audio, at syllable rate: the
// 16 kHz mono wav is measured in 10 ms slices (RMS), followed with a fast
// attack and a ~70 ms release so the dips between syllables survive, averaged
// per 1/FPS frame, and scaled against the loudest sound of the surrounding
// 0.6 s — a soft phrase opens the mouth as far as a loud one, and every
// syllable pulses instead of one long "O" over a whole sentence.
function envelope(wav) {
  const buf = fs.readFileSync(wav); const data = buf.subarray(44); const n = data.length >> 1; const step = 160; const rms = [];
  for (let s = 0; s < n; s += step) { let sum = 0, c = 0; for (let i = s; i < Math.min(n, s + step); i++) { const v = data.readInt16LE(i * 2) / 32768; sum += v * v; c++; } rms.push(Math.sqrt(sum / Math.max(1, c))); }
  const ref = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * .95)] || 1;
  const gate = ref * .07;   // room noise never twitches the mouth
  let f = 0; const fol = rms.map(v => { v = v > gate ? v : 0; f = v > f ? v : f * .87 + v * .13; return f; });
  const per = 100 / FPS, frames = Math.ceil(fol.length / per), env = [];
  for (let k = 0; k < frames; k++) { const a = Math.floor(k * per), b = Math.min(fol.length, Math.ceil((k + 1) * per)); let s = 0; for (let i = a; i < b; i++) s += fol[i]; env.push(s / Math.max(1, b - a)); }
  const win = Math.round(FPS * .3), out = env.map((v, i) => { let m = 0; for (let j = Math.max(0, i - win); j <= Math.min(env.length - 1, i + win); j++) m = Math.max(m, env[j]); m = Math.max(m, ref * .35); return Math.pow(Math.min(1, v / m), .85); });
  return out;
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
  // the canvas is padded to a multiple of 16 (transparent), so no encoder pads it
  // itself and the HEVC alpha layer lines up with the colour on iOS
  const scale = OUT_H / box.h, drawW = Math.round(box.w * scale), outW = Math.ceil(drawW / 16) * 16, padX = (outW - drawW) >> 1;
  for (let i = 0; i < frames.length; i++) {
    const png = await p.evaluate(async ([b64, box, outW, outH, open, mouth, debug, drawW, padX]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = box.w; c.height = box.h; const g = c.getContext('2d'); g.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      if (mouth) {
        const W = box.w, H = box.h, d = g.getImageData(0, 0, W, H).data;
        // the face screen: largest dark opaque blob in the upper 60 %
        const lum = i => d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11;
        // navy glass only (dark AND blue): the black helmet band, ears and gloves are not part of it
        const ok = i => d[i * 4 + 3] > 200 && lum(i) < 70 && d[i * 4 + 2] > d[i * 4] + 15 && d[i * 4 + 2] > d[i * 4 + 1] + 4;
        const lab = new Int32Array(W * H); let best = null, n = 0; const limit = Math.round(H * .6) * W;
        for (let i = 0; i < limit; i++) { if (lab[i] || !ok(i)) continue; n++; const q = [i]; lab[i] = n; let x0 = W, y0 = H, x1 = 0, y1 = 0, cnt = 0;
          while (q.length) { const j = q.pop(); cnt++; const x = j % W, y = (j / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; for (const k of [j - 1, j + 1, j - W, j + W]) { if (k < 0 || k >= limit || lab[k] || !ok(k)) continue; if ((k === j - 1 && x === 0) || (k === j + 1 && x === W - 1)) continue; lab[k] = n; q.push(k); } }
          if (!best || cnt > best.cnt) best = { x0, y0, x1, y1, cnt, lab: n }; }
        if (best) {
          const bestLab = best.lab;
          const sw = best.x1 - best.x0, sh = best.y1 - best.y0; let cx = best.x0 + sw * .5, cy = best.y0 + sh * .76;
          // Frame 1 of every clip is the mouthless base itself (omnihuman starts
          // from the still), so it is the reference for "what the screen and the
          // rim look like without a mouth". Everything the model paints — a glowing
          // mouth on the screen, teeth on the rim, a lip line, a whole open mouth
          // under the screen — is replaced by the reference's own pixels, mapped
          // through the screen box (the head only shifts and scales a little).
          for (let y = best.y0; y <= best.y1; y++) for (let x = best.x0; x <= best.x1; x++) d[4 * (y * W + x) + 3] = 255;   // the key bites into cyan glows on solid glass
          const src = new Uint8ClampedArray(d);
          // Frame 1 is the mouthless base itself. It is measured once: where the
          // eye rings sit inside the glass (largest two cyan blobs) and so where
          // the mouth belongs, all as fractions of the glass box. Every later
          // frame only needs its own glass box — the glass never blinks, so the
          // mouth follows the head's shifts and zoom without ever jumping.
          if (!window.__ref) {
            const cyan = new Uint8Array(W * H), blobs = [];
            for (let y = best.y0; y <= best.y1; y++) for (let x = best.x0; x <= best.x1; x++) { const k = 4 * (y * W + x); if (src[k] * .3 + src[k + 1] * .59 + src[k + 2] * .11 > 110 && src[k + 2] > src[k] + 40) cyan[y * W + x] = 1; }
            for (let y = best.y0; y <= best.y1; y++) for (let x = best.x0; x <= best.x1; x++) { const i0 = y * W + x; if (cyan[i0] !== 1) continue; const q = [i0]; cyan[i0] = 2; let sx = 0, sy = 0, n2 = 0;
              while (q.length) { const j = q.pop(); sx += j % W; sy += (j / W) | 0; n2++; for (const t of [j - 1, j + 1, j - W, j + W]) { if (t < 0 || t >= W * H || cyan[t] !== 1) continue; if ((t === j - 1 && j % W === 0) || (t === j + 1 && j % W === W - 1)) continue; cyan[t] = 2; q.push(t); } }
              blobs.push({ x: sx / n2, y: sy / n2, n: n2 }); }
            blobs.sort((a, b) => b.n - a.n);
            const [A, B] = blobs.length >= 2 && blobs[0].x < blobs[1].x ? [blobs[0], blobs[1]] : [blobs[1] || { x: best.x0 + sw * .3, y: best.y0 + sh * .45 }, blobs[0] || { x: best.x0 + sw * .7, y: best.y0 + sh * .45 }];
            const ed0 = Math.hypot(B.x - A.x, B.y - A.y), my0 = (A.y + B.y) / 2;
            let dk = [0, 0, 0], dn = 0; for (let y = Math.round(my0 + ed0 * .2); y < best.y1; y++) for (let x = Math.round(best.x0 + sw * .4); x < best.x0 + sw * .6; x++) { const k = 4 * (y * W + x); if (src[k] * .3 + src[k + 1] * .59 + src[k + 2] * .11 < 60) { dk[0] += src[k]; dk[1] += src[k + 1]; dk[2] += src[k + 2]; dn++; } }
            window.__ref = { d: src, box: { ...best }, sw, sh, dark: dn ? dk.map(v => v / dn) : [8, 20, 50],
              eyeL: { fx: (A.x - best.x0) / sw, fy: (A.y - best.y0) / sh }, eyeR: { fx: (B.x - best.x0) / sw, fy: (B.y - best.y0) / sh },
              edF: ed0 / sw, mouth: { fx: ((A.x + B.x) / 2 - best.x0) / sw, fy: (my0 + ed0 * .31 - best.y0) / sh } };
            // where the mouth sits relative to the glass's centre line on its own row in the base (usually ~0)
            { const row = Math.round(best.y0 + window.__ref.mouth.fy * sh); let l = -1, rr = -1; for (let x = best.x0; x <= best.x1; x++) if (lab[row * W + x] === bestLab) { if (l < 0) l = x; rr = x; } window.__ref.mouthShift = l >= 0 ? (A.x + B.x) / 2 - (l + rr) / 2 : 0; }
          }
          // the glass's own extent per row in this frame (its rounded corners
          // included): nothing outside it is ever repainted
          const glassL = new Int32Array(H).fill(-1), glassR = new Int32Array(H).fill(-1);
          for (let y = best.y0; y <= best.y1; y++) for (let x = best.x0; x <= best.x1; x++) { if (lab[y * W + x] === bestLab) { if (glassL[y] < 0) glassL[y] = x; glassR[y] = x; } }
          const inGlass = (x, y) => glassL[y] >= 0 && x >= glassL[y] + 1 && x <= glassR[y] - 1;
          const ref = window.__ref, rsx = ref.sw / sw, rsy = ref.sh / sh;
          const refAt = (x, y) => { const xx = Math.round(ref.box.x0 + (x - best.x0) * rsx); const yy = Math.round(y <= best.y1 ? ref.box.y0 + (y - best.y0) * rsy : ref.box.y1 + (y - best.y1) * rsy); if (xx < 0 || xx >= W || yy < 0 || yy >= H) return null; return 4 * (yy * W + xx); };
          const lumOf = k => src[k] * .3 + src[k + 1] * .59 + src[k + 2] * .11, satOf = k => Math.max(src[k], src[k + 1], src[k + 2]) - Math.min(src[k], src[k + 1], src[k + 2]);
          const rlum = k => ref.d[k] * .3 + ref.d[k + 1] * .59 + ref.d[k + 2] * .11, rsat = k => Math.max(ref.d[k], ref.d[k + 1], ref.d[k + 2]) - Math.min(ref.d[k], ref.d[k + 1], ref.d[k + 2]);
          const toRef = (k, kr, w) => { for (let i = 0; i < 3; i++) d[k + i] = src[k + i] + (ref.d[kr + i] - src[k + i]) * w; d[k + 3] = Math.round(src[k + 3] + (ref.d[kr + 3] - src[k + 3]) * w); };   // alpha too: copying the reference's empty background as opaque black left dark notches under the helmet
          const eyes = { lx: best.x0 + ref.eyeL.fx * sw, ly: best.y0 + ref.eyeL.fy * sh, rx: best.x0 + ref.eyeR.fx * sw, ry: best.y0 + ref.eyeR.fy * sh };
          const ed = ref.edF * sw, tilt = 0;
          cx = best.x0 + ref.mouth.fx * sw; cy = best.y0 + ref.mouth.fy * sh;
          // Are the rings whole in this frame (eyes open)? Then the mouth sits under
          // the midpoint between them — that follows a head turn better than the
          // glass box does — and that offset is kept through a blink.
          let eyesOpen = false;
          { const cy2 = new Uint8Array(W * H), bl = []; const yA = Math.round(eyeY0()), yB = Math.round(eyeY0() + ed * .45);
            function eyeY0() { return (eyes.ly + eyes.ry) / 2 - ed * .45; }
            for (let y = Math.max(best.y0, yA); y <= Math.min(best.y1, yB); y++) for (let x = best.x0; x <= best.x1; x++) { const k = 4 * (y * W + x); if (lumOf(k) > 110 && src[k + 2] > src[k] + 40) cy2[y * W + x] = 1; }
            for (let y = Math.max(best.y0, yA); y <= Math.min(best.y1, yB); y++) for (let x = best.x0; x <= best.x1; x++) { const i0 = y * W + x; if (cy2[i0] !== 1) continue; const q = [i0]; cy2[i0] = 2; let sx = 0, sy = 0, n2 = 0, y0b = H, y1b = 0;
              while (q.length) { const j = q.pop(); const jy = (j / W) | 0; sx += j % W; sy += jy; n2++; if (jy < y0b) y0b = jy; if (jy > y1b) y1b = jy; for (const t of [j - 1, j + 1, j - W, j + W]) { if (t < 0 || t >= W * H || cy2[t] !== 1) continue; if ((t === j - 1 && j % W === 0) || (t === j + 1 && j % W === W - 1)) continue; cy2[t] = 2; q.push(t); } }
              bl.push({ x: sx / n2, y: sy / n2, n: n2, h: y1b - y0b + 1 }); }
            bl.sort((a, b) => b.n - a.n);
            if (!ref.ring && bl.length >= 2) ref.ring = { h: (bl[0].h + bl[1].h) / 2, n: (bl[0].n + bl[1].n) / 2 };
            if (ref.ring && bl.length >= 2 && bl[0].h >= ref.ring.h * .8 && bl[1].h >= ref.ring.h * .8 && bl[1].n >= ref.ring.n * .6 && Math.abs(bl[0].x - bl[1].x) > ed * .6) {
              eyesOpen = true; const mid = (bl[0].x + bl[1].x) / 2; window.__dx = mid - (best.x0 + ref.mouth.fx * sw); eyes.lx = Math.min(bl[0].x, bl[1].x); eyes.rx = Math.max(bl[0].x, bl[1].x); eyes.ly = eyes.ry = (bl[0].y + bl[1].y) / 2;
            }
            }
          { const row = Math.round(cy); if (glassL[row] >= 0) cx = (glassL[row] + glassR[row]) / 2 + ref.mouthShift; }
          const eyeY = (eyes.ly + eyes.ry) / 2;
          // the eyes' own glow (bright, near where the rings are) is never touched
          const FAR = 1e4, dist = new Float32Array(W * H).fill(FAR);
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = 4 * (y * W + x); if (src[k + 3] >= 250 && lumOf(k) > 95 && Math.min(Math.hypot(x - eyes.lx, y - eyes.ly), Math.hypot(x - eyes.rx, y - eyes.ry)) < ed * .36) dist[y * W + x] = 0; }
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let v = dist[i]; if (x) v = Math.min(v, dist[i - 1] + 1); if (y) { v = Math.min(v, dist[i - W] + 1); if (x) v = Math.min(v, dist[i - W - 1] + 1.4); if (x < W - 1) v = Math.min(v, dist[i - W + 1] + 1.4); } dist[i] = v; }
          for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; let v = dist[i]; if (x < W - 1) v = Math.min(v, dist[i + 1] + 1); if (y < H - 1) { v = Math.min(v, dist[i + W] + 1); if (x < W - 1) v = Math.min(v, dist[i + W + 1] + 1.4); if (x) v = Math.min(v, dist[i + W - 1] + 1.4); } dist[i] = v; }
          const ringGap = ed * .12;
          // 1. the glass under the eyes becomes the reference outright (flat dark
          //    glass, mapped through the glass box); between the eyes only what the
          //    model lit up goes back. Nothing of the model's mouth survives.
          const ex = cx, ey = cy, rx = ed * .5, ry = ed * .2;
          for (let y = Math.round(best.y0 + sh * .3); y <= Math.min(H - 1, Math.round(best.y1 + sh * .12)); y++) for (let x = best.x0; x <= best.x1; x++) {
            const k = 4 * (y * W + x), kr = refAt(x, y);
            const below = (y - eyeY) / ed;
            // under the rings (they end ~0.25 eye distances below their centres) the
            // glass is restored outright; beside the rings their own glow is kept
            const g2 = Math.min(1, dist[y * W + x] / ringGap);   // a smooth gap around the rings, never a hard line
            // right beside a ring the reference may not line up pixel-perfectly, so
            // there a lit-up halo is simply pulled down to the glass's dark colour
            // only down in the mouth zone: at eye height this cut notches into the rings' own glow
            if (g2 < 1 && below > .12) { const k0 = 4 * (y * W + x), l0 = lumOf(k0); if (l0 < 75) { const w = Math.max(0, Math.min(1, (l0 - 22) / 25)) * (1 - g2); if (w > 0) { for (let i = 0; i < 3; i++) d[k0 + i] = src[k0 + i] + (ref.dark[i] - src[k0 + i]) * w; } } }
            if (!g2) continue;
            const gate = g2 * g2 * (3 - 2 * g2);
            if (below > .12) {
              const fade = Math.min(1, (below - .12) / .14);   // eases in over a band instead of a hard line
              if (y <= best.y1 && !inGlass(x, y)) continue;                             // the glass's rounded corners / the rim beside it: untouched
              if (y > best.y1 && lumOf(k) >= 200) continue;                           // below the glass: never over the rim
              if (kr !== null && rlum(kr) < 70) toRef(k, kr, gate * fade);             // inside the glass: everything, teeth included
              else if (y <= best.y1 && lumOf(k) > 30) { const w = gate * fade * Math.min(1, (lumOf(k) - 30) / 15); for (let i = 0; i < 3; i++) d[k + i] = src[k + i] + (ref.dark[i] - src[k + i]) * w; d[k + 3] = 255; }
            }
            // At eye height nothing is repainted any more. That band used to pull
            // whatever was brighter than frame 1 back to frame 1, but as soon as the
            // head turns a little the two sets of rings do not line up, and it cut a
            // shifted ring into the eye (a halo) and left a seam across the glass.
            // The model draws its mouth below the eyes, which the branch above covers.
          }
          // 2. the rim under the screen: whatever differs from the reference there
          //    (teeth, a lip line, an orange open mouth) is the reference again
          for (let y = Math.round(best.y1 + sh * .05); y <= Math.min(H - 1, Math.round(best.y1 + sh * .4)); y++) for (let x = Math.round(ex - sw * .24); x <= Math.round(ex + sw * .24); x++) {   // a strip under the mouth only, clear of the glass's own lower edge: wider, it redrew the rim from frame 1 wherever the head had moved (a dark line, a sheared edge)
            const k = 4 * (y * W + x), kr = refAt(x, y); if (kr === null) continue;
            if (src[k + 3] < 250) continue;   // the silhouette's edge and the background stay the model's own: frame 1's rim sits elsewhere once the head moves (ghost edge, black notches)
            const off = Math.max((Math.abs(lumOf(k) - rlum(kr)) - 10) / 20, (Math.abs(satOf(k) - rsat(kr)) - 14) / 20);
            const hx = Math.min(1, (sw * .24 - Math.abs(x - ex)) / (sw * .06)), vy = Math.min(1, (best.y1 + sh * .4 - y) / (sh * .08), (y - best.y1 - sh * .05) / (sh * .05));
            const w = Math.max(0, Math.min(1, Math.min(off, hx, vy))); if (w > 0) toRef(k, kr, w);
          }
          if (debug) console.log('glass', best.x0, best.y0, sw, sh, 'mouth', Math.round(cx), Math.round(cy));
          g.putImageData(new ImageData(d, W, H), 0, 0);
          // the robot mouth: an arc when quiet that fills into an "O" when loud
          if (debug === 2) open = -1;
          // The mouth in the eyes' own look: a glowing cyan ring — a smile arc when
          // quiet, a full ring (with a faint fill) when the voice is loud.
          const glow = '#62dcff', r = ed * .19, o = Math.max(0, Math.min(1, open));
          g.save(); g.translate(cx, cy);
          g.lineCap = 'round'; g.strokeStyle = glow; g.lineWidth = ed * .075;
          // the same glow in every clip: a wide soft halo, a tighter one, then the crisp line
          const stroke = path => { g.shadowColor = 'rgba(70,190,255,.95)'; g.shadowBlur = ed * .4; path(); g.stroke(); g.shadowBlur = ed * .16; path(); g.stroke(); g.shadowBlur = ed * .05; path(); g.stroke(); };
          // The mouth opens with the voice, continuously: the smile arc when quiet,
          // a flat "o" for a soft sound, a tall "O" for a loud one — the two
          // shapes cross-fade around the threshold so the mouth never pops.
          const mix = Math.max(0, Math.min(1, (o - .05) / .12));
          if (open < 0) {}
          else {
            if (mix < 1) { g.globalAlpha = 1 - mix; stroke(() => { g.beginPath(); g.arc(0, -r * .4, r, Math.PI * .12, Math.PI * .88); }); }
            if (mix > 0) { g.globalAlpha = mix; const hh = r * (.16 + o * .94), rw = r * (.78 + o * .22); g.shadowBlur = 0; g.fillStyle = `rgba(98,220,255,${(.12 + o * .2).toFixed(3)})`; g.beginPath(); g.ellipse(0, 0, rw, hh, 0, 0, Math.PI * 2); g.fill(); stroke(() => { g.beginPath(); g.ellipse(0, 0, rw, hh, 0, 0, Math.PI * 2); }); }
            g.globalAlpha = 1;
          }
          g.restore();
          if (debug) { g.save(); g.lineWidth = 1; if (eyes) { g.strokeStyle = 'yellow'; g.beginPath(); g.arc(eyes.lx, eyes.ly, 4, 0, 7); g.stroke(); g.beginPath(); g.arc(eyes.rx, eyes.ry, 4, 0, 7); g.stroke(); g.beginPath(); g.moveTo(eyes.lx, eyes.ly); g.lineTo(eyes.rx, eyes.ry); g.stroke(); } g.strokeStyle = 'red'; g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'lime'; g.strokeRect(best.x0, best.y0, sw, sh); g.restore(); }
        }
      }
      const o = document.createElement('canvas'); o.width = outW; o.height = outH; const og = o.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(c, padX, 0, drawW, outH);
      return o.toDataURL('image/png').split(',')[1];
    }, [fs.readFileSync(frames[i]).toString('base64'), box, outW, OUT_H, env[i] ?? 0, screenMouth, +(process.env.KEYCLIP_DEBUG||0), drawW, padX]);
    fs.writeFileSync(path.join(outDir, `f${String(i + 1).padStart(4, '0')}.png`), Buffer.from(png, 'base64'));
  }
  // 5. settle tail: the model's last pose dissolves back into frame 1 (the still) over SETTLE s with the mouth closed —
  // the clip ends where it began, and the voice, which runs to the last frame, is never cut off
  const SETTLE = .7, tailN = Math.round(FPS * SETTLE), lastPng = path.join(outDir, `f${String(frames.length).padStart(4, '0')}.png`), firstPng = path.join(outDir, 'f0001.png');
  for (let k = 1; k <= tailN; k++) {
    const t = k / tailN, e = t * t * (3 - 2 * t);
    const png = await p.evaluate(async ([a, b, e]) => { const A = new Image(); A.src = 'data:image/png;base64,' + a; const B = new Image(); B.src = 'data:image/png;base64,' + b; await A.decode(); await B.decode();
      const c = document.createElement('canvas'); c.width = A.width; c.height = A.height; const g = c.getContext('2d'); g.globalAlpha = 1 - e; g.drawImage(A, 0, 0); g.globalAlpha = e; g.drawImage(B, 0, 0); return c.toDataURL('image/png').split(',')[1]; }, [fs.readFileSync(lastPng).toString('base64'), fs.readFileSync(firstPng).toString('base64'), e]);
    fs.writeFileSync(path.join(outDir, `f${String(frames.length + k).padStart(4, '0')}.png`), Buffer.from(png, 'base64'));
  }
  // the audio gets the same tail of silence, so the container is not cut at the shorter stream
  // The voice is levelled like the app's live speech (m1-runtime: RMS to about
  // -16 dBFS, 4:1 compression, a limiter): the video model hands back the plain
  // tts track, noticeably thinner and quieter than a live line, so a clip after
  // a live line sounded far away. loudnorm to -14 LUFS / -1.5 dBTP, then the
  // settle tail of silence.
  const padded = path.join(tmp, 'padded.wav'); ff(['-i', path.join(tmp, 'audio.wav'), '-af', `loudnorm=I=-14:TP=-1.5:LRA=6,apad=pad_dur=${SETTLE}`, padded]);
  await b.close();

  // 4. encode: WebM VP9+alpha from the frames; ProRes 4444 → Apple HEVC with alpha
  const seq = path.join(outDir, 'f%04d.png'), audio = path.join(tmp, 'audio.wav');
  ff(['-framerate', String(FPS), '-i', seq, '-i', padded, '-map', '0:v', '-map', '1:a', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '1200k', '-crf', '30', '-deadline', 'good', '-cpu-used', '2', '-c:a', 'libopus', '-b:a', '64k', '-shortest', `${out}.webm`]);
  const prores = path.join(tmp, 'prores.mov');
  ff(['-framerate', String(FPS), '-i', seq, '-i', padded, '-map', '0:v', '-map', '1:a', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-c:a', 'pcm_s16le', '-shortest', prores]);
  execFileSync('avconvert', ['--preset', 'PresetHEVC1920x1080WithAlpha', '--source', prores, '--output', `${out}.mp4`, '--replace'], { stdio: 'ignore' });
  if (process.env.KEYCLIP_KEEP) console.log('kept', tmp); else fs.rmSync(tmp, { recursive: true, force: true });
  const kb = f => Math.round(fs.statSync(f).size / 1024) + ' KB';
  console.log(`${path.basename(out)}: ${outW}x${OUT_H} from ${box.w}x${box.h}${screenMouth ? ', robot mouth' : ''} → webm ${kb(out + '.webm')}, mp4 ${kb(out + '.mp4')}`);
})();
