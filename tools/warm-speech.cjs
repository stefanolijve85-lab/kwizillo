#!/usr/bin/env node
// Asks the voice proxy for the lines a child is about to hear, once, so they
// are already on disk when the quiz starts.
//
//   node tools/warm-speech.cjs --topic zonnestelsel
//   node tools/warm-speech.cjs --lang nl,en --voice Milo,Luna --answers
//   node tools/warm-speech.cjs --ids ruimte-zonnestelsel-21,…  --url http://127.0.0.1:8080
//
// The proxy keeps every rendered line in .tts-cache, keyed by model, language,
// voice and text, so a warmed line costs nothing the second time and comes back
// in a few hundredths of a second instead of a few tenths. A line is only
// fetched when it is not already there, and the run stops at the proxy's own
// daily character ceiling rather than pushing through it.
//
// The question and the hint are warmed by default. The answer lines are not:
// the app shuffles the options per quiz, so "A. Mars." and "C. Mars." are
// different lines and warming all four positions costs four times as much for
// one line that will be used. Pass --answers to do it anyway.
const path = require('path');
const core = require('../quiz-core-v2.js');
const { loadBanks, LANGS } = require('../tests/langs.js');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const list = (name, fallback) => String(opt(name, fallback)).split(',').map(s => s.trim()).filter(Boolean);

const BASE = opt('url', process.env.KWIZILLO_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const langs = list('lang', 'nl,en').filter(l => LANGS.includes(l));
const voices = list('voice', 'Milo,Luna');
const topic = opt('topic', null);
const ids = list('ids', '');
const withAnswers = argv.includes('--answers');
const LABELS = ['A', 'B', 'C', 'D'];

const { banks } = loadBanks();
const chosen = lang => (banks[lang] || []).filter(q =>
  (!topic || q.topic === topic) && (!ids.length || ids.includes(q.id)));

const linesFor = q => {
  const out = [q.prompt];
  if (q.hint) out.push(q.hint);
  if (withAnswers) for (const o of q.options || []) for (const label of LABELS) out.push(`${label}. ${o}.`);
  return out.filter(Boolean);
};

(async () => {
  let asked = 0, chars = 0, failed = 0, stopped = false;
  for (const lang of langs) {
    const bank = chosen(lang);
    if (!bank.length) { console.error(`${lang}: nothing matched`); continue }
    for (const voice of voices) {
      const t0 = Date.now();
      for (const q of bank) {
        for (const line of linesFor(q)) {
          const text = core.spellNumbers(line, lang);
          let res;
          try {
            res = await fetch(`${BASE}/api/tts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, voice, lang }),
            });
          } catch (e) {
            console.error(`\nthe proxy at ${BASE} did not answer — start it with "npm start" first`);
            process.exit(1);
          }
          if (res.status === 429) { console.error(`\n${lang}/${voice}: the proxy says the daily character budget is used up; stopping here`); stopped = true; break }
          if (!res.ok) { failed++; console.error(`${q.id} (${lang}/${voice}): ${res.status} on "${line.slice(0, 40)}…"`); continue }
          await res.arrayBuffer();
          asked++; chars += text.length;
        }
        if (stopped) break;
      }
      console.log(`${lang}/${voice}: ${bank.length} question(s) warmed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      if (stopped) break;
    }
    if (stopped) break;
  }
  console.log(`\n${asked} line(s), ${chars} characters${failed ? `, ${failed} failed` : ''}. Anything already in .tts-cache cost nothing.`);
  process.exit(failed ? 1 : 0);
})();
