#!/usr/bin/env node
// Builds the raw ingredients of the intro sting with the ElevenLabs API:
//   music   : a 12 s instrumental jingle (Music API)
//   kids    : several child voices calling "Kwizillo!" (Text to Speech, v3)
// Everything lands in the output directory as mp3; tools/intro-mix.cjs then
// lays them out in time and renders the final asset. The API key comes from
// the gitignored .env exactly as server.js reads it and is never printed.
//
// Usage: node tools/intro-audio.js <outdir> [music|kids|voices]
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
(function loadEnvFile() {
  let raw; try { raw = fs.readFileSync(path.join(ROOT, '.env'), 'utf8'); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq < 1) continue;
    const key = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(key in process.env)) process.env[key] = v;
  }
})();
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY missing (put it in .env)'); process.exit(1); }

const OUT = process.argv[2] || path.join(ROOT, 'build', 'intro-audio');
const WHAT = process.argv[3] || 'all';
fs.mkdirSync(OUT, { recursive: true });

async function api(pathname, body, accept = 'audio/mpeg') {
  const r = await fetch('https://api.elevenlabs.io' + pathname, {
    method: body ? 'POST' : 'GET',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: accept },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(`${pathname}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return accept === 'application/json' ? r.json() : Buffer.from(await r.arrayBuffer());
}

const MUSIC_PROMPTS = [
  'Playful, magical orchestral-pop jingle for the opening logo of a children\'s quiz game. Starts with a sparkling chime whoosh, bright ukulele and pizzicato strings build with excitement, glockenspiel and a cheerful brass hit as the grand finale at the very end, short shimmering tail. Uplifting, wholesome, premium, no vocals. Exactly 12 seconds.',
  'Short cinematic logo sting for a kids\' adventure game: soft magical bells rising, then a bouncy playful beat with claps and marimba, swelling strings, one big joyful triumphant hit right at the end with a sparkle tail. No vocals. 12 seconds.'
];

async function music() {
  for (let i = 0; i < MUSIC_PROMPTS.length; i++) {
    const buf = await api('/v1/music', { prompt: MUSIC_PROMPTS[i], music_length_ms: 12000, force_instrumental: true, model_id: 'music_v2' });
    const file = path.join(OUT, `music-${i + 1}.mp3`);
    fs.writeFileSync(file, buf);
    console.log(`music ${i + 1}: ${buf.length} bytes -> ${file}`);
  }
}

// Child voices from the shared library. The labels are what we trust: age
// "young" is a young adult on ElevenLabs, so we look for explicit child terms.
async function voices() {
  const found = new Map();
  for (const q of ['child', 'kid', 'boy', 'girl', 'kind']) {
    const j = await api(`/v1/shared-voices?page_size=40&search=${encodeURIComponent(q)}`, null, 'application/json');
    for (const v of j.voices || []) {
      const text = `${v.name} ${v.description || ''} ${v.descriptive || ''} ${v.age || ''}`.toLowerCase();
      if (/\b(child|kid|boy|girl|kinder|teen)\b/.test(text) && !/adult|mature|old|deep/.test(text)) found.set(v.voice_id, v);
    }
  }
  const list = [...found.values()].map(v => ({ id: v.voice_id, name: v.name, age: v.age, gender: v.gender, accent: v.accent, language: v.language, desc: (v.description || '').slice(0, 90), uses: v.cloned_by_count }));
  list.sort((a, b) => (b.uses || 0) - (a.uses || 0));
  fs.writeFileSync(path.join(OUT, 'voices.json'), JSON.stringify(list, null, 1));
  console.log(list.slice(0, 25).map(v => `${v.id} | ${v.name} | ${v.age}/${v.gender}/${v.accent} | ${v.desc}`).join('\n'));
}

// Shared-library voices must be added to the workspace before use.
async function ensureAdded(v) {
  try { await api('/v1/voices/add/' + v.public_owner_id + '/' + v.id, { new_name: 'Kwizillo kid ' + v.name }, 'application/json'); } catch (e) { /* already added or not needed */ }
}

async function kids() {
  const picks = JSON.parse(fs.readFileSync(path.join(OUT, 'picks.json'), 'utf8'));
  let n = 0;
  for (const v of picks) {
    if (v.public_owner_id) await ensureAdded(v);
    for (const [tag, text] of [['a', '[excited] Kwizillo!'], ['b', '[laughs] Kwizillo!']]) {
      const buf = await api(`/v1/text-to-speech/${v.id}?output_format=mp3_44100_128`, {
        text, model_id: 'eleven_v3', language_code: undefined,
        voice_settings: { stability: 0.35, similarity_boost: 0.8, use_speaker_boost: true }
      });
      const file = path.join(OUT, `kid-${++n}-${v.name.replace(/\W+/g, '_')}-${tag}.mp3`);
      fs.writeFileSync(file, buf);
      console.log(`kid: ${file} (${buf.length} bytes)`);
    }
  }
}

(async () => {
  if (WHAT === 'music' || WHAT === 'all') await music();
  if (WHAT === 'voices') await voices();
  if (WHAT === 'kids' || WHAT === 'all') await kids();
})().catch(e => { console.error(String(e.message || e).replace(KEY, '***')); process.exit(1); });
