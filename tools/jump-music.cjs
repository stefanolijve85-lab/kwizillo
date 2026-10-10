#!/usr/bin/env node
// Mike & Mia: Jump & Slide — the game's own arcade music (Stefan, 2026-10-11:
// "more arcade music"). An upbeat chiptune track is composed with the
// ElevenLabs Music API (instrumental only), kept as a source in
// art-source/jump/music/ (not shipped), and turned into a seamless loop by
// tools/music-loop.cjs (beat-matched crossfade, run-in lead) as
// assets/audio/music/arcade.mp3. games-jump.js registers it as the 'arcade'
// track with the loop length printed here.
//
//   node tools/jump-music.cjs            → composes a new source (spends credits) and loops it
//   node tools/jump-music.cjs --loop     → only re-loops the kept source
//   node tools/jump-music.cjs --check    → fails if the loop file is missing
//
// The key comes from the gitignored .env at runtime and is never printed.
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'audio', 'music', 'arcade.mp3');
const SRC = path.join(ROOT, 'art-source', 'jump', 'music', 'arcade-src.mp3');

if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) { console.error('jump music missing: assets/audio/music/arcade.mp3'); process.exit(1) }
  console.log('jump music: arcade loop ✔'); process.exit(0);
}

// One steady groove from start to end, no intro, no breakdown, no ending: the
// loop window is cut out of the middle, so the whole track must sound alike.
const PROMPT = 'Instrumental upbeat 8-bit chiptune arcade music for a cheerful kids platformer game where two children run, jump and fly with a jetpack. '
  + 'Retro video game sound: bright square-wave lead melody, bubbly arpeggios, punchy chip bass, crisp noise-channel drums. '
  + 'Happy, energetic, catchy, 150 bpm, major key, steady groove and constant energy the whole time, no intro, no breakdown, no fade-out, no ending. No vocals.';

async function compose() {
  try { for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const i = t.indexOf('='); if (i < 1) continue; const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); if (!(k in process.env)) process.env[k] = v } } catch { }
  const KEY = process.env.ELEVENLABS_API_KEY;
  if (!KEY) { console.error('ELEVENLABS_API_KEY missing (put it in .env)'); process.exit(1) }
  const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ prompt: PROMPT, music_length_ms: 80000, force_instrumental: true })
  });
  if (!r.ok) throw new Error(`music: HTTP ${r.status} ${(await r.text()).slice(0, 300).split(KEY).join('***')}`);
  fs.mkdirSync(path.dirname(SRC), { recursive: true });
  fs.writeFileSync(SRC, Buffer.from(await r.arrayBuffer()));
  console.log(`composed ${path.relative(ROOT, SRC)} (${(fs.statSync(SRC).size / 1e6).toFixed(2)} MB)`);
}

(async () => {
  if (!process.argv.includes('--loop')) await compose();
  // a loop of 40–60 s keeps the file near 1 MB, like the other tracks
  execFileSync(process.execPath, [path.join(__dirname, 'music-loop.cjs'), 'arcade', SRC, '--min', '40', '--max', '60', '--head', '4', '--tail', '4'], { stdio: 'inherit' });
})().catch(e => { console.error(String(e.message || e)); process.exit(1) });
