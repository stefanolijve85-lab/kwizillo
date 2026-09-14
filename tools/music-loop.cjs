#!/usr/bin/env node
// Turns a generated music track (mp3/wav) into a seamless background loop for
// the audio manager and writes it as mp3 into assets/audio/music/<id>.mp3.
//
//   node tools/music-loop.cjs <id> <source-file> [--min 48] [--max 82] [--head 3] [--tail 4] [--fade 2.5] [--window 12]
//
// How the loop is built (Web Audio in headless Chromium does the decoding, so
// the result matches what the game itself will hear):
//   1. skip the first `head` seconds (intro) and keep `tail` seconds spare at the end;
//   2. pick the loop length L in [min, max] for which the onsets (beats) of the
//      first `window` seconds line up best with the onsets L seconds later, so the
//      crossfaded join keeps the beat;
//   3. equal-power crossfade the material after the loop end into the loop start
//      over `fade` seconds, so the join sits inside continuous music;
//   4. wrap the loop in a LEAD (0.6 s) of the loop's own tail and a matching
//      trail of its head. The player loops [LEAD, LEAD + L]: any decoder delay an
//      mp3 decoder adds just shifts the window along a continuous signal, so the
//      loop stays click-free on every browser without gapless metadata.
// The manager needs L, printed at the end as `loop=<seconds>`; copy it into the
// tracks table in m1-runtime.js.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
// lamejs 1.2.1 forgets to import three of its own modules when required from Node.
global.MPEGMode = require('lamejs/src/js/MPEGMode.js'); global.Lame = require('lamejs/src/js/Lame.js'); global.BitStream = require('lamejs/src/js/BitStream.js');
const lamejs = require('lamejs');

const ROOT = path.join(__dirname, '..');
const [id, source] = process.argv.slice(2);
if (!id || !source) { console.error('usage: node tools/music-loop.cjs <id> <source-file> [--min 48] [--max 82] [--head 3] [--tail 4] [--fade 2.5] [--window 12]'); process.exit(1); }
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? +process.argv[i + 1] : d; };
const MIN = opt('min', 48), MAX = opt('max', 82), HEAD = opt('head', 3), TAIL = opt('tail', 4), FADE = opt('fade', 2.5), WINDOW = opt('window', 12);
const LEAD = 0.6, PEAK = 0.89, SR = 44100, KBPS = 160;

const PAGE = `<script>
window.build = async (b64, o) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const ctx = new OfflineAudioContext(2, 1, ${SR});
  const buf = await ctx.decodeAudioData(bytes.buffer);
  const sr = buf.sampleRate, ch = Math.min(2, buf.numberOfChannels);
  const L = [buf.getChannelData(0), buf.getChannelData(ch - 1)];
  const n = buf.length;
  // Loudness envelope, ~23 ms hops.
  const hop = 1024, frames = Math.floor(n / hop), env = new Float32Array(frames);
  for (let f = 0; f < frames; f++) { let s = 0; for (let i = f * hop; i < (f + 1) * hop; i++) { const v = (L[0][i] + L[1][i]) / 2; s += v * v; } env[f] = Math.sqrt(s / hop); }
  // Onsets (rising loudness) mark the beat; the join must land where the beats
  // of the crossfaded tail line up with the beats of the loop start.
  const on = new Float32Array(frames); for (let f = 1; f < frames; f++) on[f] = Math.max(0, env[f] - env[f - 1]);
  const head = Math.floor(o.head * sr / hop), spare = Math.ceil((o.tail + o.fade) * sr / hop);
  const minLag = Math.floor(o.min * sr / hop), maxLag = Math.floor(o.max * sr / hop);
  const W = Math.floor(o.window * sr / hop);
  let best = { lag: minLag, c: -Infinity };
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (head + W + lag > frames - spare) break;
    let num = 0, a = 0, b = 0;
    for (let i = head; i < head + W; i++) { num += on[i] * on[i + lag]; a += on[i] * on[i]; b += on[i + lag] * on[i + lag]; }
    const c = num / Math.sqrt(a * b || 1); if (c > best.c) best = { lag, c };
  }
  const s = head * hop, len = best.lag * hop, fade = Math.floor(o.fade * sr), lead = Math.floor(o.lead * sr);
  const out = [new Float32Array(lead + len + lead), new Float32Array(lead + len + lead)];
  for (let c = 0; c < 2; c++) {
    const x = L[c], loop = new Float32Array(len);
    for (let i = 0; i < len; i++) loop[i] = x[s + i];
    for (let i = 0; i < fade; i++) { const w = (i / fade) * Math.PI / 2; loop[i] = loop[i] * Math.sin(w) + x[s + len + i] * Math.cos(w); }
    // lead = loop tail (fading in), trail = loop head (fading out); never played, only there so the window can slide.
    for (let i = 0; i < lead; i++) { const g = Math.min(1, i / (lead / 2)); out[c][i] = loop[len - lead + i] * g; }
    for (let i = 0; i < len; i++) out[c][lead + i] = loop[i];
    for (let i = 0; i < lead; i++) { const g = Math.min(1, (lead - i) / (lead / 2)); out[c][lead + len + i] = loop[i] * g; }
  }
  let peak = 0; for (let c = 0; c < 2; c++) for (let i = 0; i < out[c].length; i++) peak = Math.max(peak, Math.abs(out[c][i]));
  const gain = o.peak / (peak || 1);
  const pcm = [new Int16Array(out[0].length), new Int16Array(out[1].length)];
  for (let c = 0; c < 2; c++) for (let i = 0; i < out[c].length; i++) pcm[c][i] = Math.max(-32768, Math.min(32767, Math.round(out[c][i] * gain * 32767)));
  const b64of = a => { const u = new Uint8Array(a.buffer); let str = ''; for (let i = 0; i < u.length; i += 0x8000) str += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(str); };
  return { sr, sourceSeconds: n / sr, loopSeconds: len / sr, corr: best.c, peak, left: b64of(pcm[0]), right: b64of(pcm[1]) };
};
</script>`;

(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(PAGE);
  const r = await p.evaluate(([b64, o]) => window.build(b64, o), [fs.readFileSync(source).toString('base64'), { min: MIN, max: MAX, head: HEAD, tail: TAIL, fade: FADE, lead: LEAD, peak: PEAK, window: WINDOW }]);
  await b.close();
  const left = new Int16Array(Buffer.from(r.left, 'base64').buffer), right = new Int16Array(Buffer.from(r.right, 'base64').buffer);
  const enc = new lamejs.Mp3Encoder(2, r.sr, KBPS), chunks = [];
  for (let i = 0; i < left.length; i += 1152) { const d = enc.encodeBuffer(left.subarray(i, i + 1152), right.subarray(i, i + 1152)); if (d.length) chunks.push(Buffer.from(d)); }
  const end = enc.flush(); if (end.length) chunks.push(Buffer.from(end));
  const outDir = path.join(ROOT, 'assets', 'audio', 'music'); fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${id}.mp3`); fs.writeFileSync(out, Buffer.concat(chunks));
  console.log(`${id}: source ${r.sourceSeconds.toFixed(2)}s → loop=${r.loopSeconds.toFixed(4)} (beat match ${r.corr.toFixed(3)}, source peak ${r.peak.toFixed(2)}) → ${path.relative(ROOT, out)} ${(fs.statSync(out).size / 1e6).toFixed(2)} MB, lead=${LEAD}`);
})().catch(e => { console.error(e); process.exit(1); });
