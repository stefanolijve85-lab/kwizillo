#!/usr/bin/env node
// Verifies a rendered guide clip before it is installed:
//   node tools/clipcheck.cjs <clip.mp4|.webm> "<expected line>" [--lang nl]
//
//  1. text    — the clip's audio is transcribed (ElevenLabs Scribe, key from .env at
//               runtime, never printed) and compared word for word with the line;
//  2. timing  — speech must end before the video ends (≥ 0.4 s of quiet at the end)
//               and must start within the first second;
//  3. body    — the last frame must look like the first (the still): the figure
//               ends where it began, no lifted arm or turned head frozen on screen.
// Exit code 0 = all pass, 1 = a check failed (the reasons are printed).
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const FF = fs.existsSync(path.join(__dirname, 'bin', 'ffmpeg')) ? path.join(__dirname, 'bin', 'ffmpeg') : 'ffmpeg';
try { for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const i = t.indexOf('='); if (i < 0) continue; const k = t.slice(0, i).trim(); if (!(k in process.env)) process.env[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, ''); } } catch {}

const args = process.argv.slice(2); const src = args[0], expected = args[1]; const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'nl';
if (!src || !expected) { console.error('usage: clipcheck <clip> "<expected line>" [--lang nl]'); process.exit(2); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clipcheck-'));
const ff = a => execFileSync(FF, ['-y', '-loglevel', 'error', ...a], { stdio: ['ignore', 'pipe', 'inherit'] });
const norm = s => s.toLowerCase().replace(/\[[^\]]*\]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const fails = [];

(async () => {
  // audio + duration
  const wav = path.join(tmp, 'a.wav'); ff(['-i', src, '-vn', '-ac', '1', '-ar', '16000', '-f', 'wav', wav]);
  const buf = fs.readFileSync(wav).subarray(44); const n = buf.length >> 1, step = 160; const env = [];
  for (let s = 0; s < n; s += step) { let sum = 0, c = 0; for (let i = s; i < Math.min(n, s + step); i++) { const v = buf.readInt16LE(i * 2) / 32768; sum += v * v; c++; } env.push(Math.sqrt(sum / Math.max(1, c))); }
  const ref = [...env].sort((a, b) => a - b)[Math.floor(env.length * .95)] || 1; const loud = env.map(v => v / ref > .12);
  const first = loud.indexOf(true), last = loud.lastIndexOf(true); const dur = n / 16000, start = first / 100, end = (last + 1) / 100;
  console.log(`duration ${dur.toFixed(2)} s · speech ${start.toFixed(2)} → ${end.toFixed(2)} s · quiet tail ${(dur - end).toFixed(2)} s`);
  if (first < 0) fails.push('no speech found');
  if (start > 1.0) fails.push(`speech starts late (${start.toFixed(2)} s)`);
  if (dur - end < 0.4) fails.push(`speech runs to the end (only ${(dur - end).toFixed(2)} s of quiet after it) — the last word would be cut or the mouth left open`);

  // body: the figure's silhouette (keyed alpha, 96 px wide) at the start and at the end — its
  // centre, height and shape must match, so the child never sees a lifted arm or a turned head frozen on the last frame
  // a green-screen source is keyed here; a finished .webm carries its own alpha
  const keyed = /\.webm$/i.test(src); const dec = keyed ? ['-c:v', 'libvpx-vp9'] : []; const alphaVf = keyed ? 'format=yuva420p,alphaextract' : 'format=yuva420p,chromakey=0x00B140:0.12:0.08,format=yuva420p,alphaextract';
  const W = 96; const raw = execFileSync(FF, ['-loglevel', 'error', ...dec, '-i', src, '-vf', `${alphaVf},scale=${W}:-2`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 28 });
  const probe = execFileSync(FF, ['-loglevel', 'error', ...dec, '-i', src, '-vf', `scale=${W}:-2`, '-vframes', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-']); const H = probe.length / W;
  const frames = Math.floor(raw.length / (W * H));
  const stats = k => { let n = 0, sx = 0, sy = 0, y0 = H, y1 = 0, x0 = W, x1 = 0; const o = k * W * H; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (raw[o + y * W + x] > 128) { n++; sx += x; sy += y; if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; } return { n, cx: sx / n, cy: sy / n, h: y1 - y0, w: x1 - x0, o }; };
  const s0 = stats(0), s1 = stats(frames - 1); let dm = 0; for (let i = 0; i < W * H; i++) dm += (raw[s0.o + i] > 128) !== (raw[s1.o + i] > 128) ? 1 : 0; const shape = dm / Math.max(1, s0.n);
  const shift = Math.hypot(s1.cx - s0.cx, s1.cy - s0.cy) / s0.h, grow = Math.abs(s1.h - s0.h) / s0.h;
  console.log(`silhouette first→last: centre shift ${(shift * 100).toFixed(1)} % of height · height change ${(grow * 100).toFixed(1)} % · shape difference ${(shape * 100).toFixed(1)} %`);
  if (shift > .04) fails.push(`the figure ends somewhere else than it began (moved ${(shift * 100).toFixed(1)} % of its height)`);
  if (grow > .05) fails.push(`the figure ends bigger/smaller than it began (${(grow * 100).toFixed(1)} %)`);
  if (shape > .12) fails.push(`the figure's pose at the end differs from the start (${(shape * 100).toFixed(1)} % of the silhouette)`);
  // and the overall wobble: how far the centre strays during the clip
  let maxShift = 0; for (let k = 1; k < frames; k += 3) { const t = stats(k); maxShift = Math.max(maxShift, Math.hypot(t.cx - s0.cx, t.cy - s0.cy) / s0.h); }
  console.log(`largest excursion during the clip ${(maxShift * 100).toFixed(1)} % of height`);
  if (maxShift > .10) fails.push(`the figure wanders too much while talking (${(maxShift * 100).toFixed(1)} % of its height)`);

  // transcription
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) fails.push('no ELEVENLABS_API_KEY in .env — text not verified');
  else {
    const mp3 = path.join(tmp, 'a.mp3'); ff(['-i', src, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', mp3]);
    const form = new FormData(); form.append('model_id', 'scribe_v1'); form.append('language_code', lang); form.append('file', new Blob([fs.readFileSync(mp3)], { type: 'audio/mpeg' }), 'a.mp3');
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: form });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) fails.push(`transcription failed (HTTP ${r.status}${j?.detail?.status ? ': ' + j.detail.status : ''}) — text not verified`);
    else {
      const heard = norm(j.text || ''), want = norm(expected);
      console.log(`expected: ${want}\nheard:    ${heard}`);
      if (heard !== want) {
        const a = want.split(' '), b = heard.split(' '); const missing = a.filter(w => !b.includes(w)), extra = b.filter(w => !a.includes(w));
        fails.push(`text differs${missing.length ? ' — missing: ' + missing.join(' ') : ''}${extra.length ? ' — extra: ' + extra.join(' ') : ''}`);
      }
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (fails.length) { console.log('FAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('PASS');
})().catch(e => { console.error(e.message); process.exit(1); });
