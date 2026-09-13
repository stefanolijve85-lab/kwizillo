// Validates every language bank against the contract in CLAUDE.md section 3:
// 6 worlds, 4 topics per world, 10 questions per topic, 240 per language,
// and full parity of ids between languages so progress survives a language switch.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['questions.js', 'questions-en.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
}

const BANKS = { nl: ctx.window.KWIZILLO_QUESTIONS_NL, en: ctx.window.KWIZILLO_QUESTIONS_EN };
const WORLDS = ['ruimte', 'geschiedenis', 'wetenschap', 'mysterie', 'dieren', 'aarde'];

for (const [lang, bank] of Object.entries(BANKS)) {
  assert.ok(Array.isArray(bank), `${lang}: bank missing`);
  assert.strictEqual(bank.length, 240, `${lang}: expected 240 questions, got ${bank.length}`);

  const byWorld = {}, byTopic = {}, ids = new Set();
  for (const q of bank) {
    assert.ok(!ids.has(q.id), `${lang}: duplicate id ${q.id}`);
    ids.add(q.id);

    assert.ok(WORLDS.includes(q.world), `${lang}: unknown world ${q.world} on ${q.id}`);
    assert.ok(Array.isArray(q.options) && q.options.length === 4, `${lang}: ${q.id} must have 4 options`);
    assert.ok(q.options.includes(q.answer), `${lang}: ${q.id} answer is not among its options`);
    assert.strictEqual(new Set(q.options).size, 4, `${lang}: ${q.id} has duplicate option text`);
    for (const field of ['prompt', 'hint', 'explanation', 'fact']) {
      assert.ok(typeof q[field] === 'string' && q[field].trim(), `${lang}: ${q.id} is missing ${field}`);
    }
    assert.ok(q.groupMin >= 1 && q.groupMax <= 8 && q.groupMin <= q.groupMax, `${lang}: ${q.id} has invalid group range`);
    assert.ok(Number(q.xp) > 0, `${lang}: ${q.id} has no xp`);

    byWorld[q.world] = (byWorld[q.world] || 0) + 1;
    byTopic[`${q.world}/${q.topic}`] = (byTopic[`${q.world}/${q.topic}`] || 0) + 1;
  }

  assert.strictEqual(Object.keys(byWorld).length, 6, `${lang}: expected 6 worlds`);
  for (const [world, n] of Object.entries(byWorld)) {
    assert.strictEqual(n, 40, `${lang}: ${world} must have 40 questions, got ${n}`);
  }
  const topics = Object.keys(byTopic);
  assert.strictEqual(topics.length, 24, `${lang}: expected 24 topics, got ${topics.length}`);
  for (const [topic, n] of Object.entries(byTopic)) {
    assert.strictEqual(n, 10, `${lang}: ${topic} must have 10 questions, got ${n}`);
  }

  // A mixed world quiz must be able to serve four unique batches of ten.
  for (const world of WORLDS) {
    assert.strictEqual(bank.filter(q => q.world === world).length, 40,
      `${lang}: ${world} cannot supply four unique batches of ten`);
  }

  // Questions carry no display copy for topics; that belongs to i18n.
  assert.ok(!bank.some(q => 'topicLabel' in q), `${lang}: questions must not carry topicLabel`);
}

// Cross-language parity.
const nlIds = BANKS.nl.map(q => q.id).sort();
const enIds = BANKS.en.map(q => q.id).sort();
assert.deepStrictEqual(enIds, nlIds, 'Language banks must cover exactly the same question ids');

const nlById = new Map(BANKS.nl.map(q => [q.id, q]));
for (const q of BANKS.en) {
  const nl = nlById.get(q.id);
  assert.strictEqual(q.world, nl.world, `${q.id}: world differs between languages`);
  assert.strictEqual(q.topic, nl.topic, `${q.id}: topic differs between languages`);
  assert.strictEqual(q.groupMin, nl.groupMin, `${q.id}: groupMin differs between languages`);
  assert.strictEqual(q.xp, nl.xp, `${q.id}: xp differs between languages`);
  assert.notStrictEqual(q.prompt, nl.prompt, `${q.id}: English prompt is still the Dutch text`);
}

// Every topic key used by the banks must have a label in both languages.
const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
const topicKeys = [...new Set(BANKS.nl.map(q => q.topic))];
assert.strictEqual(topicKeys.length, 24, 'expected 24 distinct topic keys');
for (const key of topicKeys) {
  const hits = i18n.split(`'topic.${key}'`).length - 1;
  assert.strictEqual(hits, 2, `topic.${key} must be translated in both languages (found ${hits})`);
}

console.log(`Kwizillo question banks: OK (nl ${BANKS.nl.length}, en ${BANKS.en.length}, 24 topics, ids in parity)`);
