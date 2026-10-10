#!/usr/bin/env node
// Mike & Mia: Jump & Slide — the game's own sound effects, synthesised here
// (no recordings, no voices) and written as small mp3 files to
// assets/games/jump/sfx/. Each child has an own set for the character sounds;
// the rest is shared.
//
//   node tools/jump-sfx.cjs           → writes the files
//   node tools/jump-sfx.cjs --check   → fails if one is missing
//
// Mike: bright synth — "boing" glides on a soft square/triangle, a blue airy
//       whoosh with the double jump.
// Mia:  soft bells and chimes — a bell for the jump, a twinkle of three bells
//       with the double jump.
// Every sound is normalised to the same loudness (RMS), with its peak kept
// under -5 dBFS, a 4 ms fade-in and a smooth tail, so nothing clicks or blares
// and Mike's and Mia's sets are equally loud.
const fs = require('fs'); const path = require('path');
global.MPEGMode = require('lamejs/src/js/MPEGMode.js'); global.Lame = require('lamejs/src/js/Lame.js'); global.BitStream = require('lamejs/src/js/BitStream.js');
const lamejs = require('lamejs');
const OUT = path.join(__dirname, '..', 'assets', 'games', 'jump', 'sfx');
const SR = 44100, TAU = Math.PI * 2;

// ---- building blocks: each returns a Float32Array of `sec` seconds ----
const buf = sec => new Float32Array(Math.round(sec * SR));
// a tone whose frequency follows f(t) (t from 0 to 1 over the sound), with a wave shape and an envelope
function tone(sec, f, { wave = 'sine', env = expEnv(8), gain = 1, vib = 0, vibRate = 6, start = 0 } = {}) {
  const b = buf(start + sec), n = Math.round(sec * SR), o = Math.round(start * SR); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n, hz = f(t) * (1 + vib * Math.sin(TAU * vibRate * i / SR)); ph += hz / SR;
    const p = ph % 1;
    const w = wave === 'sine' ? Math.sin(TAU * p) : wave === 'tri' ? 1 - 4 * Math.abs(p - .5) : wave === 'square' ? (p < .5 ? .6 : -.6) + .4 * Math.sin(TAU * p) : Math.sin(TAU * p);
    b[o + i] = w * env(t, i / SR) * gain;
  }
  return b;
}
// a bell: a few inharmonic partials, the higher ones dying faster
function bell(sec, hz, { gain = 1, start = 0, glide = 1 } = {}) {
  const parts = [[1, 1, 6], [2.76, .45, 10], [5.4, .18, 16], [8.93, .07, 24]];
  return mix(...parts.map(([m, a, d]) => tone(sec, t => hz * m * (1 + (glide - 1) * t), { env: (t, s) => Math.min(1, s / .003) * Math.exp(-d * s), gain: gain * a, start })));
}
// filtered noise (one-pole low-pass that sweeps), for whooshes and swishes
function noise(sec, { from = 3000, to = 800, env = humpEnv(.3), gain = 1, high = 0, start = 0, seed = 7 } = {}) {
  const b = buf(start + sec), n = Math.round(sec * SR), o = Math.round(start * SR); let y = 0, hp = 0, x0 = 0, s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 16807) % 2147483647; const x = s / 1073741823.5 - 1, t = i / n, fc = from * Math.pow(to / from, t), a = 1 - Math.exp(-TAU * fc / SR);
    y += a * (x - y);
    let v = y; if (high) { hp = .97 * (hp + y - x0); x0 = y; v = hp }
    b[o + i] = v * env(t, i / SR) * gain;
  }
  return b;
}
const expEnv = k => (t, s) => Math.min(1, s / .004) * Math.exp(-k * t);
const flatEnv = edge => (t, sec, n = 1) => Math.min(1, t / edge, (1 - t) / edge);
const humpEnv = peak => t => t < peak ? t / peak : Math.pow(1 - (t - peak) / (1 - peak), 2);
function mix(...bs) { const n = Math.max(...bs.map(b => b.length)), o = new Float32Array(n); for (const b of bs) for (let i = 0; i < b.length; i++) o[i] += b[i]; return o }
const note = n => 440 * Math.pow(2, (n - 69) / 12);   // MIDI note → Hz

// ---- the sounds ----
const SOUNDS = {
  // Mike: bright synth
  'mike-jump': () => tone(.18, t => 330 + 360 * Math.pow(t, .6), { wave: 'square', env: expEnv(5), gain: .7, vib: .01 }),
  'mike-double': () => mix(tone(.24, t => 440 * Math.pow(3, t), { wave: 'tri', env: expEnv(4) }), noise(.3, { from: 6000, to: 1500, env: humpEnv(.35), gain: .9, high: 1 })),
  'mike-land': () => mix(tone(.09, t => 150 - 70 * t, { env: expEnv(6) }), noise(.06, { from: 1500, to: 400, gain: .4, env: expEnv(10) })),
  'mike-slide': () => noise(.26, { from: 3200, to: 700, env: humpEnv(.2), gain: 1 }),
  'mike-hurt': () => tone(.25, t => 392 * Math.pow(.5, t), { wave: 'tri', env: expEnv(3.5), vib: .02, vibRate: 9 }),
  'mike-celebrate': () => mix(...[72, 76, 79, 84].map((n, i) => tone(.16, () => note(n), { wave: 'square', env: expEnv(4), gain: .55, start: i * .075 }))),
  // Mia: soft bells
  'mia-jump': () => bell(.24, note(81), { glide: 1.06 }),
  'mia-double': () => mix(...[88, 93, 98].map((n, i) => bell(.2, note(n), { gain: .7, start: i * .045 })), noise(.28, { from: 9000, to: 5000, gain: .25, high: 1, env: humpEnv(.2) })),
  'mia-land': () => mix(tone(.08, () => 247, { env: expEnv(9) }), tone(.06, () => 494, { wave: 'tri', env: expEnv(12), gain: .4 })),
  'mia-slide': () => mix(noise(.26, { from: 7000, to: 2500, env: humpEnv(.25), gain: .55, high: 1 }), bell(.26, note(88), { gain: .35, glide: .8 })),
  'mia-hurt': () => mix(bell(.16, note(79), { gain: .8 }), bell(.2, note(76), { gain: .8, start: .1 })),
  'mia-celebrate': () => mix(...[76, 80, 83, 88].map((n, i) => bell(.2, note(n), { gain: .7, start: i * .075 }))),
  // shared
  'star': () => mix(bell(.1, note(91), { gain: .6 }), bell(.13, note(96), { gain: .6, start: .045 })),
  'bounce': () => tone(.3, t => 200 + 300 * t, { env: expEnv(4), vib: .12, vibRate: 18 }),
  'shield': () => mix(tone(.3, t => 523 * Math.pow(2, t), { wave: 'tri', env: humpEnv(.4), gain: .6 }), tone(.3, t => 528 * Math.pow(2, t), { wave: 'tri', env: humpEnv(.4), gain: .6 })),
  'shieldhit': () => mix(bell(.25, note(79), { gain: .8 }), bell(.25, note(86), { gain: .5 })),
  'tick': () => tone(.07, () => 880, { env: expEnv(7) }),
  'go': () => mix(tone(.18, () => note(88), { wave: 'tri', env: expEnv(4) }), tone(.18, () => note(93), { wave: 'tri', env: expEnv(4), gain: .8 })),
  'finish': () => mix(...[67, 72, 76, 79, 84].map((n, i) => tone(.2, () => note(n), { wave: 'tri', env: expEnv(3.5), gain: .7, start: i * .05 }))),
  'over': () => mix(...[67, 64, 60].map((n, i) => tone(.18, () => note(n), { wave: 'tri', env: expEnv(4), gain: .8, start: i * .1 }))),
  // the power-ups (Stefan, 2026-10-11): you hear the jetpack when you grab it, its engine
  // while it flies, and a zap for the energy
  // ignite: a click-whoosh that swells into a roar, with a rising whistle on top
  'jetpack': () => mix(noise(.7, { from: 500, to: 2600, env: humpEnv(.45), gain: 1.1 }), noise(.12, { from: 7000, to: 2000, env: expEnv(9), gain: .7, high: 1 }), tone(.6, t => 160 + 420 * t, { wave: 'square', env: humpEnv(.6), gain: .25, vib: .03, vibRate: 22 }), tone(.55, t => 55 + 30 * t, { wave: 'tri', env: humpEnv(.5), gain: .8 })),
  // the engine, played once a second during the flight: a flat roar (rumble + soft hiss with a
  // fast flutter) that fades in and out over 50 ms, so back to back it sounds continuous
  'jethum': () => mix(noise(1.05, { from: 900, to: 900, env: flatEnv(.05), gain: 1.2, seed: 11 }), tone(1.05, () => 62, { wave: 'tri', env: (t, sec) => flatEnv(.05)(t, sec) * (.75 + .25 * Math.sin(TAU * 21 * sec)), gain: .7 })),
  // out of fuel: a falling sputter
  'jetoff': () => mix(noise(.5, { from: 1800, to: 300, env: (t, sec) => Math.pow(1 - t, 1.5) * (.6 + .4 * (Math.sin(TAU * 13 * sec) > 0)), gain: 1 }), tone(.45, t => 300 * Math.pow(.4, t), { wave: 'tri', env: expEnv(3), gain: .4 })),
  // a puff upwards: a short soft whoosh
  'jetpuff': () => noise(.2, { from: 1200, to: 3200, env: humpEnv(.3), gain: 1 }),
  // energy: an electric zap and a fast rising arpeggio
  'energy': () => mix(noise(.16, { from: 9000, to: 3000, env: expEnv(7), gain: .6, high: 1 }), ...[72, 76, 79, 84, 88].map((n, i) => tone(.12, () => note(n), { wave: 'square', env: expEnv(5), gain: .5, start: i * .045 })), tone(.4, t => 200 * Math.pow(6, t), { wave: 'sine', env: humpEnv(.3), gain: .35, vib: .08, vibRate: 30 }))
};

const TARGET_RMS = .11, PEAK = .56;   // the same loudness for every sound; peak under -5 dBFS
function finish(b) {
  const fadeIn = Math.round(.004 * SR), fadeOut = Math.min(b.length, Math.round(.03 * SR));
  for (let i = 0; i < fadeIn && i < b.length; i++) b[i] *= i / fadeIn;
  for (let i = 0; i < fadeOut; i++) b[b.length - 1 - i] *= i / fadeOut;
  // loudness over the part that is heard (above -40 dB of the peak)
  let peak = 0; for (const v of b) peak = Math.max(peak, Math.abs(v));
  let sum = 0, n = 0; for (const v of b) if (Math.abs(v) > peak * .01) { sum += v * v; n++ }
  const rms = Math.sqrt(sum / Math.max(1, n)); let k = TARGET_RMS / rms;
  if (peak * k > PEAK) k = PEAK / peak;
  for (let i = 0; i < b.length; i++) b[i] *= k;
  return { b, rms: rms * k, peak: peak * k };
}
function mp3(b) {
  const enc = new lamejs.Mp3Encoder(1, SR, 64), pcm = new Int16Array(b.length), out = [];
  for (let i = 0; i < b.length; i++) pcm[i] = Math.max(-32767, Math.min(32767, Math.round(b[i] * 32767)));
  for (let i = 0; i < pcm.length; i += 1152) { const c = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (c.length) out.push(Buffer.from(c)) }
  const e = enc.flush(); if (e.length) out.push(Buffer.from(e));
  return Buffer.concat(out);
}

if (process.argv.includes('--check')) {
  const missing = Object.keys(SOUNDS).filter(k => !fs.existsSync(path.join(OUT, `${k}.mp3`)));
  if (missing.length) { console.error('jump sfx missing:', missing.join(', ')); process.exit(1) }
  console.log(`jump sfx: ${Object.keys(SOUNDS).length} files ✔`); process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [name, make] of Object.entries(SOUNDS)) {
  const { b, rms, peak } = finish(make());
  const data = mp3(b); fs.writeFileSync(path.join(OUT, `${name}.mp3`), data); total += data.length;
  console.log(`${name.padEnd(15)} ${(b.length / SR * 1000).toFixed(0).padStart(4)} ms  rms ${(20 * Math.log10(rms)).toFixed(1)} dB  peak ${(20 * Math.log10(peak)).toFixed(1)} dB  ${(data.length / 1024).toFixed(1)} kB`);
}
console.log(`total ${(total / 1024).toFixed(0)} kB in ${Object.keys(SOUNDS).length} files`);
