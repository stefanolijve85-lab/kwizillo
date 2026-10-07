#!/usr/bin/env node
// Records the sound of Talen into assets/talen/audio/ (it ships with the app).
//
//   node tools/talen-audio.cjs            records what is missing, then checks every clip with Scribe
//   node tools/talen-audio.cjs --check    only checks that every clip exists (for npm test)
//   node tools/talen-audio.cjs --redo shark,haai   records those again
//   node tools/talen-audio.cjs --trim     only trims the silence off every clip again
//
// The voices, the model and the settings are the app's own (speech-config.js),
// so Milo sounds in Talen as he does everywhere else. One recording per word:
// cutting a list of words out of one take left clipped edges in the prototype.
// Words are said by Milo; the lines around them by Milo in the child's own
// language; the closing line per theme by the guide the child chose (Milo or Luna).
// The ElevenLabs key is read from .env at run time and never printed.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'talen', 'audio');
try { for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ''); } } catch {}
const { speechConfig } = require('../speech-config.js');
const SPEECH = speechConfig(process.env);

const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'talen-data.js'), 'utf8'), ctx);
const T = ctx.window.KWIZILLO_M1.TALEN;

// What Milo says around the words, in the child's own language. The closing
// line names the language being learned: in phase 1 that is always the other one.
const LINES = {
  nl: { intro: 'Luister goed, en tik op het juiste plaatje!', goedzo: 'Goed zo!', super: 'Super!', bijna: 'Bijna! Luister nog een keer.', betekent: 'betekent', klaar_dieren: 'Wauw, je kent alle dieren in het Engels!' },
  en: { intro: 'Listen carefully, and tap the right picture!', goedzo: 'Well done!', super: 'Super!', bijna: 'Almost! Listen again.', betekent: 'means', klaar_dieren: 'Wow, you know all the animals in Dutch!' }
};

const clips = [];
for (const lang of T.langs) {
  // A word on its own gave the model too little to go on ("haai" came out as English "hi"):
  // it is recorded after a short sentence in its language, as context that is not spoken.
  for (const th of T.themes) for (const w of th.words) clips.push({ file: `${lang}/${w.id}.mp3`, text: w.text[lang], lang, guide: 'Milo', word: true });
  for (const [k, text] of Object.entries(LINES[lang])) {
    if (k.startsWith('klaar_')) for (const g of ['Milo', 'Luna']) clips.push({ file: `${lang}/${g.toLowerCase()}/_${k}.mp3`, text, lang, guide: g });
    else clips.push({ file: `${lang}/_${k}.mp3`, text, lang, guide: 'Milo' });
  }
}

const missing = clips.filter(c => !fs.existsSync(path.join(OUT, c.file)));
if (process.argv.includes('--check')) {
  if (missing.length) { console.error(`talen audio: ${missing.length} clips missing, e.g. ${missing.slice(0, 4).map(c => c.file).join(', ')}\nrun: node tools/talen-audio.cjs`); process.exit(1); }
  console.log(`talen audio: ${clips.length} clips present ✔`); process.exit(0);
}
const redo = (process.argv[process.argv.indexOf('--redo') + 1] || '').split(',').filter(Boolean);
const todo = clips.filter(c => !fs.existsSync(path.join(OUT, c.file)) || redo.includes(c.text) || redo.includes(path.basename(c.file, '.mp3')));

async function record(c) {
  const CONTEXT = { nl: 'In het Nederlands heet dit dier', en: 'In English this animal is called' };
  const body = { text: c.text, model_id: SPEECH.model, voice_settings: SPEECH.settings[c.guide], language_code: c.lang, ...(c.word ? { previous_text: CONTEXT[c.lang] } : {}) };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${SPEECH.voiceId(c.lang, c.guide)}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${c.file}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  const out = path.join(OUT, c.file); fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  trim(out);
}
// The answer is heard as one sentence ("shark ... betekent ... haai"), in two voices:
// ElevenLabs leaves up to a fifth of a second of silence at both ends of a clip, and
// strung together that sounded like separate words. Each clip keeps 20 ms in front
// and 40 ms behind (tools/bin/ffmpeg, the copy the repo already uses).
const FFMPEG = path.join(ROOT, 'tools', 'bin', 'ffmpeg');
function trim(file) {
  const tmp = file + '.trim.mp3';
  execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse',
    '-c:a', 'libmp3lame', '-b:a', '128k', tmp]);
  fs.renameSync(tmp, file);
}
if (process.argv.includes('--trim')) {
  for (const c of clips) trim(path.join(OUT, c.file));
  console.log(`trimmed ${clips.length} clips`); process.exit(0);
}
const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
async function hear(c) {
  const form = new FormData(); form.append('model_id', 'scribe_v1'); form.append('language_code', c.lang);
  form.append('file', new Blob([fs.readFileSync(path.join(OUT, c.file))], { type: 'audio/mpeg' }), 'a.mp3');
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, body: form });
  return (await r.json()).text || '';
}

(async () => {
  for (const c of todo) { await record(c); console.log(`recorded ${c.file}  "${c.text}"`); }
  let off = 0;
  for (const c of clips) {
    const heard = await hear(c);
    const ok = norm(heard) === norm(c.text);
    if (!ok) off++;
    console.log(`${ok ? '✔' : '✘'} ${c.file.padEnd(28)} "${c.text}"${ok ? '' : `  heard: "${heard}"`}`);
  }
  console.log(`\n${clips.length} clips, ${todo.length} recorded now, ${off} heard differently`);
})();
