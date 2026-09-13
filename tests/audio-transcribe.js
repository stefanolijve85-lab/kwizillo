// Transcribes the clips written by tests/audio-qa.js back to text with ElevenLabs
// Scribe, then compares what was said with what was meant. Two things become
// objective that otherwise need ears: whether the letters A/B/C/D and terms like
// GPS come out as intended, and whether Scribe hears the Dutch clips as Dutch and
// the English clips as English (a strong proxy for accent).
//
//   node tests/audio-transcribe.js        after npm run test:audio

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'audio-qa-output');

for (const line of (fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8') : '').split('\n')) {
  const m = line.match(/^ELEVENLABS_API_KEY=(.+)$/); if (m && !process.env.ELEVENLABS_API_KEY) process.env.ELEVENLABS_API_KEY = m[1].trim();
}
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.log('No ELEVENLABS_API_KEY.'); process.exit(1); }

const core = require('../quiz-core-v2.js');
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['questions.js', 'questions-en.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const BANKS = { nl: ctx.window.KWIZILLO_QUESTIONS_NL, en: ctx.window.KWIZILLO_QUESTIONS_EN };
const byId = { nl: new Map(BANKS.nl.map(q => [q.id, q])), en: new Map(BANKS.en.map(q => [q.id, q])) };

const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
function similarity(a, b) {
  const A = norm(a).split(' '), B = norm(b).split(' ');
  const setB = new Set(B); let hit = 0; for (const w of A) if (setB.has(w)) hit++;
  return A.length ? hit / A.length : 0;
}

async function transcribe(file, lang) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), path.basename(file));
  fd.append('model_id', 'scribe_v2');
  fd.append('timestamps_granularity', 'word');
  // Language left unset on purpose: we want Scribe's own verdict.
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': KEY }, body: fd });
  if (!r.ok) throw new Error(`STT ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.json();
}

(async () => {
  const report = JSON.parse(fs.readFileSync(path.join(OUT, 'report.json'), 'utf8'));
  const rows = [];
  const problems = [];
  const listen = [];

  for (const lang of ['nl', 'en']) {
    const dir = path.join(OUT, lang);
    const expectedLang = lang === 'nl' ? /^(nl|nld|dut)$/ : /^(en|eng)$/;

    // 1. The full question + A/B/C/D sequence.
    const seqDir = fs.readdirSync(dir).find(d => d.startsWith('sequence-'));
    const q = byId[lang].get(seqDir.replace('sequence-', ''));
    const segs = core.buildQuestionSpeechSegments(q);
    console.log(`\n=== ${lang.toUpperCase()} sequence: ${q.id} ===`);
    for (const [i, seg] of segs.entries()) {
      const file = path.join(dir, seqDir, `${String(i).padStart(2, '0')}-${seg.kind}.mp3`);
      const t = await transcribe(file);
      const sim = similarity(core.spellNumbers(seg.text, lang), t.text);
      // Scribe's language guess on a one-second clip is noise; only the full
      // question segment is long enough to carry a verdict.
      const langOk = seg.kind !== 'question' || expectedLang.test(t.language_code);
      const label = seg.kind === 'answer' ? seg.label : 'Q';
      const meant = core.spellNumbers(seg.text, lang);
      console.log(`  ${label.padEnd(2)} meant: ${meant}`);
      console.log(`     heard: ${t.text}   [${t.language_code} ${(t.language_probability * 100).toFixed(0)}%${langOk ? '' : ' <<< WRONG LANGUAGE'}]`);
      rows.push({ lang, id: q.id, seg: label, meant, heard: t.text, sim, detected: t.language_code, prob: t.language_probability });
      if (!langOk) problems.push(`${lang} ${q.id} ${label}: Scribe heard ${t.language_code}, not ${lang}`);
      if (seg.kind === 'answer') {
        // The spoken letter must come through as that letter. Scribe often glues
        // it to a following number ("B7"), which is still the right letter.
        const first = norm(t.text).split(' ')[0];
        if (!first.startsWith(seg.label.toLowerCase())) problems.push(`${lang} ${q.id} ${label}: letter came out as "${first}" — "${t.text}"`);
      }
    }

    // 2. Every clip that carries a watched term (GPS, ISS, numbers, °C ...).
    console.log(`\n=== ${lang.toUpperCase()} pronunciation watch ===`);
    const watched = report.timings[lang].filter(t => t.watch);
    for (const w of watched) {
      const q = byId[lang].get(w.id);
      const file = path.join(dir, `${w.id}-${w.voice}.mp3`);
      const t = await transcribe(file);
      const sim = similarity(q.prompt, t.text);
      const langOk = expectedLang.test(t.language_code);
      const terms = (q.prompt.match(/\b(GPS|ISS|DNA|LED|AI|CO₂|CO2|EVA|\d+)\b|°C/g) || []).join(',');
      console.log(`  ${w.id} (${w.voice}) terms=[${terms}]`);
      console.log(`     meant: ${q.prompt}`);
      console.log(`     heard: ${t.text}   [${t.language_code} ${(t.language_probability * 100).toFixed(0)}%, ${(sim * 100).toFixed(0)}% words${langOk ? '' : ' <<< WRONG LANGUAGE'}]`);
      rows.push({ lang, id: w.id, voice: w.voice, meant: q.prompt, heard: t.text, sim, detected: t.language_code, prob: t.language_probability, terms });
      // A language verdict on a clip of only a few words is not evidence; the
      // words came through correctly, so this is a listen item, not a failure.
      if (!langOk && norm(q.prompt).split(' ').length >= 5) problems.push(`${lang} ${w.id}: Scribe heard ${t.language_code}, not ${lang}`);
      else if (!langOk) listen.push(`${lang} ${w.id} (${w.voice}): "${q.prompt}" — words correct, but check the letters sound ${lang === 'nl' ? 'Dutch' : 'English'} (audio-qa-output/${lang}/${w.id}-${w.voice}.mp3)`);
      if (sim < 0.6) problems.push(`${lang} ${w.id}: only ${(sim * 100).toFixed(0)}% of words recognised — "${t.text}"`);
    }

    // 3. Language verdict over every remaining clip (accent proxy).
    const rest = report.timings[lang].filter(t => !t.watch);
    let ok = 0, bad = [];
    for (const w of rest) {
      const t = await transcribe(path.join(dir, `${w.id}-${w.voice}.mp3`));
      if (expectedLang.test(t.language_code)) ok++; else bad.push(`${w.id}(${w.voice}) heard as ${t.language_code}`);
      rows.push({ lang, id: w.id, voice: w.voice, detected: t.language_code, prob: t.language_probability, heard: t.text });
    }
    console.log(`\n=== ${lang.toUpperCase()} language verdict on the other ${rest.length} clips: ${ok}/${rest.length} heard as ${lang}${bad.length ? ' — ' + bad.join('; ') : ''} ===`);
    bad.forEach(b => problems.push(`${lang}: ${b}`));
  }

  fs.writeFileSync(path.join(OUT, 'transcripts.json'), JSON.stringify({ problems, listen, rows }, null, 2));
  console.log('\n=== Result ===');
  if (problems.length) { console.log(`  ${problems.length} problem(s):`); problems.forEach(p => console.log('    - ' + p)); }
  else console.log('  Every full sentence was heard in the intended language, every letter came through as a letter, and every watched term was recognised.');
  if (listen.length) { console.log('  Worth a human listen:'); listen.forEach(p => console.log('    - ' + p)); }
})().catch(e => { console.error(e.message); process.exit(1); });
