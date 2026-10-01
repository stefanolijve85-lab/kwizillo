// Every recording Rekenen (games-math.js) can ask for, per language. The game
// says its sums in pieces from a closed set (numberParts / speechParts in
// quiz-core-v2.js), so this list is complete: warm it once and the game never
// needs ElevenLabs again.
//
//   const { mathLines } = require('./math-speech.cjs');
//   mathLines('nl', t)   // t(key) → the raw template for that language
//
// Numbers: the game never says anything above 2000 (level 5 adds within 1000;
// a near-miss option can double that), and every number up to there breaks into
// pieces that all come from 0–99, the round hundreds and thousands, and the
// hundreds prefixes.
const core = require('../quiz-core-v2.js');

const MAX = 2000;
const OPS = ['math.op.plus', 'math.op.minus', 'math.op.times', 'math.op.divided'];
const TEMPLATES = ['math.speech.twoStep', 'math.speech.half', 'math.speech.quarter', 'math.speech.percent', 'math.speech.wrong',
  'math.hint.plus', 'math.hint.minus', 'math.hint.times', 'math.hint.divided', 'math.hint.generic'];
const FIXED = ['math.speech.done', 'math.speech.fail', ...Array.from({ length: 8 }, (_, i) => `feedback.speech.good.${i + 1}`)];

function mathLines(lang, t) {
  const out = new Set();
  for (let n = 0; n <= MAX; n++) for (const p of core.numberParts(n, lang)) out.add(p);
  for (const k of OPS) out.add(t(k));
  for (const k of TEMPLATES) for (const p of core.speechParts(t(k), {}, lang)) out.add(p);
  for (const k of FIXED) out.add(t(k));
  return [...out].map(s => s.trim()).filter(Boolean);
}

module.exports = { mathLines, MAX };
