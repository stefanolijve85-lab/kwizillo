#!/usr/bin/env node
// Asks the voice proxy for the lines a child is going to hear, once, so they are
// already on disk when the quiz starts and nobody waits for ElevenLabs.
//
//   node tools/warm-speech.cjs                                  # everything, in priority order
//   node tools/warm-speech.cjs --lang nl,en --voice Milo --tier 1
//   node tools/warm-speech.cjs --topic zonnestelsel --url http://127.0.0.1:8080
//   node tools/warm-speech.cjs --dry                            # count lines and characters only
//   node tools/speech-inventory.cjs --lang nl,en --json inv.json && node tools/warm-speech.cjs --from inv.json --lang nl,en
//                                                               # everything the app can say that is not recorded yet
//
// The proxy keeps every rendered line in .tts-cache, keyed by model, language,
// voice and text, so a line that is already there costs nothing and comes back
// in a millisecond. Lines are the exact text the app sends (numbers spelled out
// as the app does), or the cache would never be hit.
//
// Two tiers, each run for every language before the next tier starts:
//   1  the question, the hint, the verdict ("almost, it is …"), the explanation
//      and the eight praise lines: what every quiz says whatever the child taps
//   2  the answers: the letters "A." … "D." and every option once ("Mars."),
//      which the verdict ("… het juiste antwoord is" + "Mars.") reuses
// The run stops by itself when the proxy's daily budget is spent (503) or when
// ElevenLabs keeps refusing (credits used up): 10 failures in a row.
const path = require('path');
const core = require('../quiz-core-v2.js');
const { loadBanks, LANGS, i18n } = require('../tests/langs.js');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const list = (name, fallback) => String(opt(name, fallback)).split(',').map(s => s.trim()).filter(Boolean);

const BASE = opt('url', process.env.KWIZILLO_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const langs = list('lang', LANGS.join(',')).filter(l => LANGS.includes(l));
const voices = list('voice', 'Milo,Luna');
const tiers = list('tier', '1,2').map(Number);
const topic = opt('topic', null);
const ids = list('ids', '');
const PARALLEL = Number(opt('parallel', 4));
const dry = argv.includes('--dry');
// --from <file>: warm exactly the lines tools/speech-inventory.cjs --json listed
// as missing, per language and voice. That list covers the whole app (minigames,
// facts, Rekenen, onboarding …), not only the quiz.
const from = opt('from', null);
const inventory = from ? JSON.parse(require('fs').readFileSync(from, 'utf8')) : null;
const LABELS = ['A', 'B', 'C', 'D'];

const { banks } = loadBanks();
const K = i18n();
const t = (lang, key, params) => { K.state.language = lang; return K.t(key, params) };

// The same variant choice as quiz-visual-v2.js: the "try again" line is fixed per question.
const tryVariant = q => { let h = 0; for (const ch of q.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return (h % 4) + 1 };

// Also used by tools/speech-inventory.cjs, which needs the very same lines.
function linesFor(lang, tier, { topic = null, ids = [] } = {}) {
  const bank = (banks[lang] || []).filter(q => (!topic || q.topic === topic) && (!ids.length || ids.includes(q.id)));
  const out = [];
  if (tier === 1) {
    for (let i = 1; i <= 8; i++) out.push(t(lang, `feedback.speech.good.${i}`));
    out.push(t(lang, 'hint.fallback'));
    for (const q of bank) {
      const fact = t(lang, 'feedback.speech.fact');
      const segs = [
        ...core.buildFeedbackSegments(q, false, { tryAgain: t(lang, `feedback.speech.try.${tryVariant(q)}`), fact }),
        ...core.buildFeedbackSegments(q, true, { good: '', fact }),
      ];
      out.push(q.prompt, q.hint, ...segs.map(s => s.text));
    }
  } else {
    // The letter and the answer are separate recordings (buildQuestionSpeechSegments).
    out.push(...LABELS.map(l => `${l}.`));
    for (const q of bank) for (const o of q.options || []) out.push(core.answerText(o));
  }
  return [...new Set(out.filter(Boolean).map(line => core.spellNumbers(line, lang).trim()))];
}

module.exports = { linesFor, tryVariant, banks, i18n: K, t };
if (require.main === module) (async () => {
  let asked = 0, chars = 0, failed = 0, inARow = 0, stop = '';
  const started = Date.now();
  for (const tier of inventory ? ['inventory'] : tiers) {
    for (const lang of langs) {
      const quizLines = inventory ? null : linesFor(lang, tier, { topic, ids });
      const linesOf = voice => quizLines || (inventory.langs[lang]?.[voice] || []).filter(l => !l.cached).map(l => l.text);
      if (dry) { for (const v of inventory ? voices : [voices[0]]) { const l = linesOf(v); console.log(`${tier} ${lang}${inventory ? '/' + v : ''}: ${l.length} lines, ${l.reduce((n, x) => n + x.length, 0)} characters${inventory ? '' : ' per voice'}`) } continue }
      for (const voice of voices) {
        const lines = linesOf(voice);
        const t0 = Date.now(); let fresh = 0, next = 0;
        const worker = async () => {
          while (!stop && next < lines.length) {
            const text = lines[next++];
            let res;
            try {
              res = await fetch(`${BASE}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice, lang }) });
            } catch (e) { stop = `the proxy at ${BASE} did not answer — start it with "npm start" first`; return }
            if (res.status === 503) { stop = 'the proxy says the daily character budget is used up'; return }
            if (!res.ok) {
              failed++; inARow++;
              console.error(`${lang}/${voice}: ${res.status} on "${text.slice(0, 50)}"`);
              if (inARow >= 10) stop = 'ten refusals in a row (ElevenLabs credits used up?)';
              continue;
            }
            inARow = 0;
            const cached = res.headers.get('x-kwizillo-cache') === 'hit';
            await res.arrayBuffer();
            asked++;
            if (!cached) { fresh++; chars += text.length }
          }
        };
        await Promise.all(Array.from({ length: PARALLEL }, worker));
        console.log(`tier ${tier} ${lang}/${voice}: ${Math.min(next, lines.length)}/${lines.length} lines in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
        if (stop) break;
      }
      if (stop) break;
    }
    if (stop) break;
  }
  if (stop) console.error(`\nstopped: ${stop}`);
  if (!dry) console.log(`\n${asked} line(s) in ${((Date.now() - started) / 60000).toFixed(1)} min${failed ? `, ${failed} failed` : ''}. Anything already in .tts-cache cost nothing.`);
  process.exit(stop && !/budget|refusals/.test(stop) ? 1 : 0);
})();
