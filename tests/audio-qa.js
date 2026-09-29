// Audio QA harness. Requires a working ELEVENLABS_API_KEY (put it in .env).
//
//   node tests/audio-qa.js            20 questions per language
//   node tests/audio-qa.js --n 5      shorter run
//
// Writes mp3 samples to audio-qa-output/ so you can listen, and prints an
// objective report: which voice was chosen per language, whether it is native and
// non-Flemish, byte sizes, speech rate, and cache behaviour. It cannot judge how
// something sounds; it checks everything that can be checked without ears and
// tells you exactly what to listen for.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'audio-qa-output');
const PORT = Number(process.env.AUDIO_QA_PORT || 8131);
const BASE = `http://127.0.0.1:${PORT}`;
const N = Number(process.argv.includes('--n') ? process.argv[process.argv.indexOf('--n') + 1] : 20);

const core = require('../quiz-core-v2.js');
// The whole bank (1280 per language, all eight worlds), loaded the way the other tests load it.
const { banks: BANKS } = require('./langs.js').loadBanks();

// Terms CLAUDE.md section 9 calls out for a pronunciation audit.
// Questions whose text carries abbreviations or numbers CLAUDE.md section 9 wants audited.
const PRONUNCIATION_WATCH = /\b(GPS|ISS|DNA|LED|AI|CO₂|CO2|EVA|\d+)\b|°C/;

const say = (...a) => console.log(...a);
const kb = n => `${(n / 1024).toFixed(0)}KB`;

async function waitForServer() {
  for (let i = 0; i < 80; i++) {
    try { await fetch(BASE + '/'); return; } catch { await new Promise(r => setTimeout(r, 150)); }
  }
  throw new Error('server did not start');
}

// Mirrors the client: digits are spoken as words at the voice boundary.
async function speak(text, voice, lang) {
  text = core.spellNumbers(text, lang);
  const started = Date.now();
  const r = await fetch(BASE + '/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, lang })
  });
  const ms = Date.now() - started;
  if (!r.ok) return { ok: false, status: r.status, ms, detail: await r.text().catch(() => '') };
  const buf = Buffer.from(await r.arrayBuffer());
  return { ok: true, status: r.status, ms, bytes: buf.length, buf, voiceName: r.headers.get('x-kwizillo-voice'), lang: r.headers.get('x-kwizillo-language') };
}

(async () => {
  if (!fs.existsSync(path.join(ROOT, '.env')) && !process.env.ELEVENLABS_API_KEY) {
    say('No ELEVENLABS_API_KEY found. Copy .env.example to .env and add your key.');
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe']
  });
  const serverLog = [];
  server.stdout.on('data', d => serverLog.push(String(d)));
  server.stderr.on('data', d => serverLog.push(String(d)));

  const problems = [];
  try {
    await waitForServer();

    /* ---- 1. voice selection per language ---- */
    say('\n=== Voice selection ===');
    for (const lang of ['nl', 'en']) {
      const r = await fetch(`${BASE}/api/voice-status?lang=${lang}`);
      const s = await r.json();
      if (s.mode !== 'elevenlabs') {
        problems.push(`${lang}: voice-status returned mode="${s.mode}" — check the key and its voices_read permission`);
        say(`  ${lang}: FAILED (mode=${s.mode})`);
        continue;
      }
      for (const guide of ['milo', 'luna']) {
        const m = s[guide] || {};
        const flags = [];
        if (m.native === false) flags.push('NOT NATIVE');
        if (/flemish|belgian|vlaams/i.test(String(m.accent || ''))) flags.push('FLEMISH — rejected by the product brief');
        if (m.source === 'fallback-non-native') flags.push('fallback');
        say(`  ${lang} ${guide.padEnd(5)} ${String(m.name).padEnd(30)} id=${m.voice_id} accent=${m.accent || '-'} source=${m.source} ${flags.length ? '<<< ' + flags.join(', ') : 'ok'}`);
        flags.forEach(f => problems.push(`${lang} ${guide}: ${f}`));
      }
    }

    /* ---- 2. speech segments per question ---- */
    say(`\n=== Generating ${N} questions per language ===`);
    const timings = { nl: [], en: [] };
    for (const lang of ['nl', 'en']) {
      const bank = BANKS[lang];
      // Take every question that carries a watched term first, then spread the rest.
      const watched = bank.filter(q => PRONUNCIATION_WATCH.test(q.prompt + ' ' + q.options.join(' ')));
      const rest = bank.filter(q => !watched.includes(q));
      // Half the sample carries a watched term (spread over the bank, not the first
      // few of one world), the other half is spread over every world.
      const half = Math.ceil(N / 2);
      const spread = (list, n) => Array.from({ length: Math.min(n, list.length) }, (_, i) => list[Math.floor(i * list.length / Math.min(n, list.length))]);
      const worlds = [...new Set(rest.map(q => q.world))];
      const perWorld = worlds.map(w => rest.filter(q => q.world === w));
      const plain = Array.from({ length: N - Math.min(half, watched.length) }, (_, i) => perWorld[i % worlds.length][Math.floor(i / worlds.length) * 7 % perWorld[i % worlds.length].length]);
      const picks = [...spread(watched, half), ...plain].filter(Boolean);
      const dir = path.join(OUT, lang);
      fs.mkdirSync(dir, { recursive: true });

      for (const q of picks) {
        const segments = core.buildQuestionSpeechSegments(q);

        for (const seg of segments) {
          if (/\b(antwoord|answer)\s+[A-D]\b/i.test(seg.text)) {
            problems.push(`${lang} ${q.id}: segment announces the letter — "${seg.text}"`);
          }
        }

        const voice = picks.indexOf(q) % 2 === 0 ? 'Milo' : 'Luna';
        const out = await speak(segments[0].text, voice, lang);
        if (!out.ok) {
          problems.push(`${lang} ${q.id}: TTS ${out.status}`);
          say(`  ${lang} ${q.id} FAILED ${out.status}`);
          continue;
        }
        const file = path.join(dir, `${q.id}-${voice}.mp3`);
        fs.writeFileSync(file, out.buf);
        timings[lang].push({ id: q.id, chars: segments[0].text.length, bytes: out.bytes, ms: out.ms, voice, watch: PRONUNCIATION_WATCH.test(q.prompt + ' ' + q.options.join(' ')) });
      }

      // One full question-plus-answers run, so you can hear the pacing.
      const sample = picks[0];
      const full = core.buildQuestionSpeechSegments(sample);
      const seqDir = path.join(dir, `sequence-${sample.id}`);
      fs.mkdirSync(seqDir, { recursive: true });
      for (const [i, seg] of full.entries()) {
        const out = await speak(seg.text, 'Milo', lang);
        if (out.ok) fs.writeFileSync(path.join(seqDir, `${String(i).padStart(2, '0')}-${seg.kind}.mp3`), out.buf);
      }
      say(`  ${lang}: ${timings[lang].length}/${picks.length} generated, full sequence in ${path.relative(ROOT, seqDir)}`);
    }

    /* ---- 3. perceived length and loudness proxy ---- */
    say('\n=== Bytes per character (a rough speech-rate proxy; lower = faster) ===');
    for (const lang of ['nl', 'en']) {
      for (const voice of ['Milo', 'Luna']) {
        const rows = timings[lang].filter(t => t.voice === voice);
        if (!rows.length) continue;
        const bpc = rows.reduce((a, t) => a + t.bytes / Math.max(1, t.chars), 0) / rows.length;
        say(`  ${lang} ${voice.padEnd(5)} ${rows.length} clips, ${bpc.toFixed(0)} bytes/char, avg ${kb(rows.reduce((a, t) => a + t.bytes, 0) / rows.length)}`);
      }
    }

    /* ---- 4. cache ---- */
    say('\n=== Cache ===');
    const probe = `Cachetest ${Date.now()}.`;
    const cold = await speak(probe, 'Milo', 'nl');
    const warm = await speak(probe, 'Milo', 'nl');
    say(`  new sentence: ${cold.ms}ms upstream, then ${warm.ms}ms from cache`);
    if (cold.ok && warm.ok && warm.ms > Math.max(50, cold.ms / 4)) problems.push('Second identical request was not served from cache');

    // The same sentence in two languages must not collide in the cache. Compare
    // content, not length: ElevenLabs returns constant-bitrate mp3, so two clips of
    // equal duration are equal in bytes even from different voices.
    const crypto = require('crypto');
    const sameText = `Kwizillo ${Date.now()}.`;
    const nlClip = await speak(sameText, 'Milo', 'nl');
    const enClip = await speak(sameText, 'Milo', 'en');
    const h = b => crypto.createHash('sha1').update(b).digest('hex').slice(0, 10);
    if (nlClip.ok && enClip.ok && h(nlClip.buf) === h(enClip.buf)) {
      problems.push('Identical text in nl and en returned identical audio — cache key may ignore language');
    }
    say(`  same text nl vs en: ${nlClip.ok && enClip.ok ? (h(nlClip.buf) === h(enClip.buf) ? 'IDENTICAL' : 'different audio') : 'n/a'} (${nlClip.voiceName} vs ${enClip.voiceName})`);

    /* ---- 5. report ---- */
    say('\n=== What you still have to judge by ear ===');
    say(`  Samples: ${path.relative(ROOT, OUT)}`);
    say('  1. Is Dutch Netherlands Dutch, with no Flemish or English colouring?');
    say('  2. Is English a consistent native accent?');
    say('  3. Do A, B, C and D sound like spoken letters, not words?');
    const watched = [...timings.nl, ...timings.en].filter(t => t.watch).map(t => t.id);
    say(`  4. Abbreviations and letters appear in: ${watched.length ? watched.join(', ') : 'none of this sample'}`);
    say('  5. Do Milo and Luna sound equally loud?');
    say('  6. Is the pacing calm enough for a child?');

    say('\n=== Result ===');
    if (problems.length) {
      say(`  ${problems.length} problem(s) found:`);
      problems.forEach(p => say(`    - ${p}`));
    } else {
      say('  No automated problems found. The six points above still need a listen.');
    }
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ problems, timings }, null, 2));
  } catch (e) {
    say('\nHarness error:', e.message);
    say(serverLog.join('').split('\n').slice(0, 12).join('\n'));
    process.exitCode = 1;
  } finally {
    server.kill();
  }
})();
