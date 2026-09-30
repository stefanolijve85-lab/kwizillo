#!/usr/bin/env node
// Applies a content patch (tools/patches/*.json) to the question bank in all
// ten languages: replaced questions, rewritten fields, one swapped wrong option.
//
//   node tools/content-patch.cjs tools/patches/2026-09-30-kids-4plus.json [--dry]
//
// Where a question lives depends on its number: 01-10 in questions*.js, 11-20 in
// questions-extra*.js (one line per question, in topic order), 21-40 in
// content/<world>/<topic>.json with every language side by side. The line files
// are edited one line at a time, so their layout and comments stay as they are.
// Afterwards run `node tools/content-build.cjs` for the 21-40 layer.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const LANGS = ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'da', 'ru', 'ar'];
const FIELD = { p: 'prompt', a: 'answer', w: 'wrong', h: 'hint', e: 'explanation', f: 'fact' };
const IDX = { p: 0, a: 1, w: 2, h: 3, e: 4, f: 5 };   // position in a line-file question

const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file) { console.error('usage: node tools/content-patch.cjs <patch.json> [--dry]'); process.exit(2); }
const patch = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')).questions;

const lineFile = (lang, n) => n <= 10
  ? (lang === 'nl' ? 'questions.js' : `questions-${lang}.js`)
  : (lang === 'nl' ? 'questions-extra.js' : `questions-extra-${lang}.js`);

// The line of question `n` (1-based within its file) of world/topic.
function findLine(lines, world, topic, n) {
  const w = lines.findIndex(l => new RegExp(`^\\s{4}${world}: \\{`).test(l));
  if (w < 0) throw new Error(`world ${world} not found`);
  let t = -1;
  for (let i = w + 1; i < lines.length; i++) {
    if (/^\s{4}[a-z_]+: \{/.test(lines[i])) break;             // next world
    if (new RegExp(`^\\s{6}${topic}: \\[`).test(lines[i])) { t = i; break; }
  }
  if (t < 0) throw new Error(`topic ${world}/${topic} not found`);
  let k = 0;
  for (let i = t + 1; i < lines.length; i++) {
    if (/^\s{6}\]/.test(lines[i])) break;
    if (/^\s{8}\[/.test(lines[i]) && ++k === n) return i;
  }
  throw new Error(`question ${n} of ${world}/${topic} not found`);
}
const parseLine = line => {
  const body = line.trim().replace(/,$/, '');
  return vm.runInNewContext(`(${body})`);
};
const writeLine = (orig, arr) => orig.match(/^\s*/)[0] + JSON.stringify(arr) + (orig.trim().endsWith(',') ? ',' : '');

// The English text of every question, to find a swapped option by its English wording.
const { banks } = require(path.join(ROOT, 'tests', 'langs.js')).loadBanks();
const enById = new Map(banks.en.map(q => [q.id, q]));

const log = [];
const jsonDocs = new Map();
for (const [id, spec] of Object.entries(patch)) {
  const m = id.match(/^([a-z]+)-([a-z_]+)-(\d\d)$/);
  const [, world, topic] = m; const n = Number(m[3]);
  let swapIndex = -1;
  if (spec.swap) {
    const en = enById.get(id);
    const wrong = en.options.filter(o => o !== en.answer);
    swapIndex = wrong.indexOf(spec.swap.from);
    if (swapIndex < 0) swapIndex = wrong.indexOf(spec.swap.en);   // applied before: same slot again
    if (swapIndex < 0) throw new Error(`${id}: wrong option "${spec.swap.from}" not found in ${JSON.stringify(wrong)}`);
  }
  const hasText = LANGS.some(l => spec[l]) || spec.swap;
  if (!hasText) continue;                                        // art only

  if (n <= 20) {
    for (const lang of LANGS) {
      const f = path.join(ROOT, lineFile(lang, n));
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      const i = findLine(lines, world, topic, n <= 10 ? n : n - 10);
      const q = parseLine(lines[i]);
      const before = JSON.stringify(q);
      for (const [k, v] of Object.entries(spec[lang] || {})) q[IDX[k]] = v;
      if (swapIndex >= 0) q[2][swapIndex] = spec.swap[lang];
      if (JSON.stringify(q) !== before) { lines[i] = writeLine(lines[i], q); log.push(`${id} ${lang} ${path.basename(f)}:${i + 1}`); }
      if (!dry) fs.writeFileSync(f, lines.join('\n'));
    }
  } else {
    const f = path.join(ROOT, 'content', world, `${topic}.json`);
    const doc = jsonDocs.get(f) || JSON.parse(fs.readFileSync(f, 'utf8'));
    jsonDocs.set(f, doc);
    const q = doc.questions.find(x => x.id === id);
    if (!q) throw new Error(`${id} not in ${f}`);
    for (const lang of LANGS) {
      const t = q.text[lang];
      if (!t) throw new Error(`${id}: no ${lang} text`);
      for (const [k, v] of Object.entries(spec[lang] || {})) t[FIELD[k]] = v;
      if (swapIndex >= 0) t.wrong[swapIndex] = spec.swap[lang];
    }
    if (spec.replace) { q.source = 'Vervangen 30-09-2026 (Kids 4+)'; if (spec.art && spec.art !== 'keep') q.artBrief = spec.art; }
    log.push(`${id} content/${world}/${topic}.json`);
  }
}
if (!dry) for (const [f, doc] of jsonDocs) fs.writeFileSync(f, JSON.stringify(doc, null, 2) + '\n');
console.log(`${dry ? '[dry] ' : ''}${log.length} edits`);
for (const l of log) console.log('  ' + l);
