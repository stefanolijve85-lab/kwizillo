#!/usr/bin/env node
// Reads every question in content/ and holds it against the rules a children's
// quiz has to keep, then says what is still missing per topic and difficulty.
//
//   node tools/content-lint.cjs               → report over content/ + the live bank
//   node tools/content-lint.cjs --coverage    → only the coverage table
//   node tools/content-lint.cjs --quiet       → only errors (exit 1) and the totals
//
// Writing questions is cheap and checking them is not, so everything a machine
// can decide is decided here: the same question twice, the answer given away in
// its own hint, three distractors that nobody would ever pick, a sentence too
// long for a phone or for a five-year-old, a number nobody sourced. What is left
// over is what a person actually has to read.
//
// The live bank is loaded too, so a new question is compared against all 480 that
// already exist, not only against its own file.
const fs = require('fs');
const path = require('path');
const { loadBanks, LANGS } = require('../tests/langs.js');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'content');
const args = process.argv.slice(2);
const only = f => args.includes(f);
const NEED_PER_DIFFICULTY = 10;   // a full quiz of ten, on every difficulty

// What fits on a phone and does not outstay its welcome when read aloud.
const CAP = { prompt: 90, answer: 28, hint: 90, explanation: 120, fact: 140 };
// Easier bands are read to the child, so they get shorter sentences and shorter words.
const BAND = { easy: { prompt: 70, word: 13 }, hard: { prompt: 90, word: 20 } };
const NEVER = /\b(alle bovenstaande|geen van (de )?bovenstaande|all of the above|none of the above)\b/i;

const errors = [], warnings = [];
const err = (id, what) => errors.push(`${id}: ${what}`);
const warn = (id, what) => warnings.push(`${id}: ${what}`);

const norm = s => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const trigrams = s => { const t = ` ${norm(s)} `, out = new Set(); for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3)); return out };
const overlap = (a, b) => { let n = 0; for (const g of a) if (b.has(g)) n++; return n / Math.max(1, Math.min(a.size, b.size)) };

// ── what is already live ────────────────────────────────────────────────────
const { banks } = loadBanks();
const bank = banks.nl || [];
const known = bank.map(q => ({ id: q.id, world: q.world, topic: q.topic, difficulty: q.difficulty, prompt: q.prompt, answer: q.answer, tri: trigrams(q.prompt) }));

// ── what is in content/ ─────────────────────────────────────────────────────
const files = fs.existsSync(DIR)
  ? fs.readdirSync(DIR, { withFileTypes: true }).filter(d => d.isDirectory())
      .flatMap(d => fs.readdirSync(path.join(DIR, d.name)).filter(f => f.endsWith('.json')).map(f => path.join(DIR, d.name, f)))
  : [];
if (!files.length) { console.error('content/ is empty — nothing to lint'); process.exit(1) }

const fresh = [];
for (const file of files) {
  const rel = path.relative(ROOT, file);
  let doc;
  try { doc = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) { errors.push(`${rel}: not valid JSON — ${e.message}`); continue }
  const { world, topic } = doc;
  if (!world || !topic) { errors.push(`${rel}: needs "world" and "topic"`); continue }
  for (const q of doc.questions || []) {
    const id = q.id || `${rel}?`;
    if (!/^[a-z_]+-[a-z_]+-\d\d$/.test(q.id || '')) err(id, 'id must read <world>-<topic>-NN');
    else if (!q.id.startsWith(`${world}-${topic}-`)) err(id, `id does not match ${world}/${topic}`);
    if (!(q.difficulty >= 1 && q.difficulty <= 4)) err(id, 'difficulty must be 1, 2, 3 or 4');
    if (!q.text || !q.text.nl) { err(id, 'no Dutch text'); continue }
    fresh.push({ ...q, world, topic, rel, nl: q.text.nl });
  }
}

// ── per question ────────────────────────────────────────────────────────────
const seenId = new Map();
for (const q of fresh) {
  const { id, nl } = q;
  if (seenId.has(id)) err(id, `id used twice (${seenId.get(id)} and ${q.rel})`);
  seenId.set(id, q.rel);
  if (known.some(k => k.id === id)) err(id, 'this id is already in the live bank');

  // shape
  for (const field of ['prompt', 'answer', 'hint', 'explanation', 'fact']) {
    if (!String(nl[field] || '').trim()) err(id, `missing ${field}`);
    else if (nl[field].length > CAP[field]) err(id, `${field} is ${nl[field].length} characters, cap is ${CAP[field]}`);
  }
  const wrong = Array.isArray(nl.wrong) ? nl.wrong : [];
  if (wrong.length !== 3) err(id, `needs three wrong answers, has ${wrong.length}`);
  if (!nl.prompt?.trim().endsWith('?') && !/^(wat|wie|waar|welke|hoe|waarom|hoeveel)/i.test(nl.prompt || '')) warn(id, 'the prompt is not phrased as a question');

  // the answer must not be given away
  const a = norm(nl.answer);
  const words = a.split(' ').filter(w => w.length >= 5);
  for (const where of ['prompt', 'hint']) {
    const text = norm(nl[where]);
    if (a && text.includes(a)) err(id, `the answer is inside the ${where}`);
    else if (words.some(w => text.includes(w))) warn(id, `a word of the answer ("${words.find(w => text.includes(w))}") is inside the ${where}`);
  }
  if (norm(nl.fact) && norm(nl.explanation) && overlap(trigrams(nl.fact), trigrams(nl.explanation)) > 0.7) warn(id, 'the fact says nearly the same thing as the explanation');

  // the distractors
  const all = [nl.answer, ...wrong].map(s => String(s || ''));
  if (new Set(all.map(norm)).size !== all.length) err(id, 'two options say the same thing');
  for (const w of wrong) {
    if (NEVER.test(w)) err(id, `"${w}" is not an answer a child can weigh`);
    if (String(w).length > CAP.answer) err(id, `the wrong answer "${w}" is longer than ${CAP.answer} characters`);
  }
  const lens = all.map(s => s.length);
  if (Math.max(...lens) > Math.max(14, Math.min(...lens) * 3)) warn(id, `the options are lopsided (${lens.join('/')} characters): the odd one out is easy to spot`);
  const numeric = all.map(s => /^[\d.,%\s]+$/.test(s.replace(/\b(jaar|dagen|procent|km|m)\b/g, '')));
  if (numeric.some(Boolean) && !numeric.every(Boolean)) warn(id, 'a number stands between words, or the other way round');

  // reading level for its band
  const band = q.difficulty <= 2 ? BAND.easy : BAND.hard;
  if ((nl.prompt || '').length > band.prompt) warn(id, `prompt is ${nl.prompt.length} characters; difficulty ${q.difficulty} reads better under ${band.prompt}`);
  const longest = (nl.prompt + ' ' + nl.answer).split(/\s+/).reduce((m, w) => Math.max(m, w.replace(/[^\wÀ-ÿ]/g, '').length), 0);
  if (longest > band.word) warn(id, `a word of ${longest} letters is long for difficulty ${q.difficulty}`);

  // anything checkable needs somewhere it was checked
  const factual = [nl.prompt, nl.answer, nl.explanation, nl.fact].join(' ');
  const needsCheck = /\d/.test(factual) || /\b[A-Z][a-zà-ÿ]{2,}/.test(factual.replace(/^[^a-z]*/, ''));
  if (needsCheck && !String(q.source || '').trim()) err(id, 'has a number or a name but no source');
  if (!String(q.artBrief || '').trim()) warn(id, 'no artBrief, so the illustration has nothing to go on');

  // translations
  const missing = LANGS.filter(l => !q.text[l]);
  if (missing.length) warn(id, `not translated yet: ${missing.join(' ')}`);
}

// ── the same question twice, anywhere ───────────────────────────────────────
const pool = [...known.map(k => ({ ...k, where: 'bank' })),
              ...fresh.map(q => ({ id: q.id, world: q.world, topic: q.topic, difficulty: q.difficulty, prompt: q.nl.prompt, answer: q.nl.answer, tri: trigrams(q.nl.prompt), where: q.rel }))];
const byPrompt = new Map();
for (const q of pool) {
  const key = norm(q.prompt);
  if (byPrompt.has(key)) err(q.id, `asks the same as ${byPrompt.get(key)}: "${q.prompt}"`);
  else byPrompt.set(key, q.id);
}
for (const q of fresh) {
  const mine = trigrams(q.nl.prompt);
  for (const other of pool) {
    if (other.id === q.id) continue;
    const o = overlap(mine, other.tri);
    if (o > 0.75) {
      const sameAnswer = norm(other.answer) === norm(q.nl.answer);
      const line = `${Math.round(o * 100)}% like ${other.id} ("${other.prompt}")`;
      sameAnswer ? err(q.id, `${line} — and the same answer`) : warn(q.id, line);
    }
  }
}

// ── the bank against itself ────────────────────────────────────────────────
// Two questions in one topic that carry the same answer and almost the same
// words are one question with two coats on: a child who reaches level 5 gets
// what they already answered on level 1. Same words is a fault; same answer
// asked differently is usually a fair pair, so that one is only listed.
const bankDupes = [], bankPairs = [];
const byTopic = new Map();
for (const q of known) { const k = `${q.world}/${q.topic}`; (byTopic.get(k) || byTopic.set(k, []).get(k)).push(q) }
for (const list of byTopic.values()) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const o = overlap(a.tri, b.tri), same = norm(a.answer) === norm(b.answer);
    if (norm(a.prompt) === norm(b.prompt) || (o > 0.9 && same)) bankDupes.push(`${a.id} en ${b.id} stellen dezelfde vraag: "${a.prompt}"`);
    else if (o > 0.72 && same) bankPairs.push(`${a.id} / ${b.id} — ${Math.round(o * 100)}% hetzelfde, zelfde antwoord (${a.answer}): "${a.prompt}" / "${b.prompt}"`);
  }
}

// ── coverage: can every level fill a quiz of ten? ───────────────────────────
const cover = new Map();
for (const q of pool) {
  const key = `${q.world}/${q.topic}`;
  if (!cover.has(key)) cover.set(key, [0, 0, 0, 0]);
  if (q.difficulty >= 1 && q.difficulty <= 4) cover.get(key)[q.difficulty - 1]++;
}
const short = [];
console.log('\nonderwerp                         d1  d2  d3  d4   nodig');
console.log('─'.repeat(62));
for (const [key, c] of [...cover.entries()].sort()) {
  const gap = c.reduce((n, v) => n + Math.max(0, NEED_PER_DIFFICULTY - v), 0);
  if (gap) short.push([key, gap]);
  console.log(`${key.padEnd(33)} ${c.map(v => String(v).padStart(2)).join('  ')}   ${gap ? `+${gap}` : '✔'}`);
}
const gapTotal = short.reduce((n, [, g]) => n + g, 0);

// ── report ─────────────────────────────────────────────────────────────────
if (!only('--coverage')) {
  if (bankDupes.length) { console.log(`\n${bankDupes.length} vraag(en) staan dubbel in de bank:`); for (const d of bankDupes) console.log(`  ✗ ${d}`); errors.push(...bankDupes) }
  if (bankPairs.length && !only('--quiet')) { console.log(`\n${bankPairs.length} paar in de bank om bij het bijvullen te bekijken:`); for (const d of bankPairs) console.log(`  · ${d}`) }
  if (warnings.length && !only('--quiet')) { console.log(`\n${warnings.length} opmerking(en) om na te kijken:`); for (const w of warnings) console.log(`  · ${w}`) }
  if (errors.length) { console.log(`\n${errors.length} fout(en), deze moeten weg:`); for (const e of errors) console.log(`  ✗ ${e}`) }
}
console.log(`\n${fresh.length} vragen in content/, ${known.length} in de bank, ${gapTotal} nog te schrijven voor volledige dekking.`);
if (errors.length) process.exit(1);
console.log(errors.length ? '' : 'geen blokkerende fouten ✔');
