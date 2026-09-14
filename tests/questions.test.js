// Validates every language bank against the contract in CLAUDE.md section 3:
// 6 worlds, 4 topics per world, 20 questions per topic (10 base + 10 advanced), 480 per language,
// and full parity of ids between languages so progress survives a language switch.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['questions-extra.js', 'questions-extra-en.js', 'questions-extra-pt.js', 'questions.js', 'questions-en.js', 'questions-pt.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
}

const BANKS = { nl: ctx.window.KWIZILLO_QUESTIONS_NL, en: ctx.window.KWIZILLO_QUESTIONS_EN, pt: ctx.window.KWIZILLO_QUESTIONS_PT };
const WORLDS = ['ruimte', 'geschiedenis', 'wetenschap', 'mysterie', 'dieren', 'aarde'];

for (const [lang, bank] of Object.entries(BANKS)) {
  assert.ok(Array.isArray(bank), `${lang}: bank missing`);
  assert.strictEqual(bank.length, 480, `${lang}: expected 480 questions, got ${bank.length}`);

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
    assert.strictEqual(n, 80, `${lang}: ${world} must have 80 questions, got ${n}`);
  }
  const topics = Object.keys(byTopic);
  assert.strictEqual(topics.length, 24, `${lang}: expected 24 topics, got ${topics.length}`);
  for (const [topic, n] of Object.entries(byTopic)) {
    assert.strictEqual(n, 20, `${lang}: ${topic} must have 20 questions, got ${n}`);
  }

  // A mixed world quiz must be able to serve eight unique batches of ten.
  for (const world of WORLDS) {
    assert.strictEqual(bank.filter(q => q.world === world).length, 80,
      `${lang}: ${world} cannot supply eight unique batches of ten`);
  }
  // The base set is difficulty 1-2, the advanced set (ids 11-20) 3-4.
  for (const q of bank) {
    const n = Number(q.id.slice(-2));
    assert.ok(n <= 10 ? q.difficulty <= 2 : q.difficulty >= 3, `${lang}: ${q.id} has difficulty ${q.difficulty}`);
  }

  // Questions carry no display copy for topics; that belongs to i18n.
  assert.ok(!bank.some(q => 'topicLabel' in q), `${lang}: questions must not carry topicLabel`);
}

// Cross-language parity: every bank covers the same ids with the same metadata.
const LANGS = Object.keys(BANKS);
const nlIds = BANKS.nl.map(q => q.id).sort();
const nlById = new Map(BANKS.nl.map(q => [q.id, q]));
for (const lang of LANGS.filter(l => l !== 'nl')) {
  assert.deepStrictEqual(BANKS[lang].map(q => q.id).sort(), nlIds, `${lang}: banks must cover exactly the same question ids`);
  for (const q of BANKS[lang]) {
    const nl = nlById.get(q.id);
    assert.strictEqual(q.world, nl.world, `${q.id}: world differs between languages`);
    assert.strictEqual(q.topic, nl.topic, `${q.id}: topic differs between languages`);
    assert.strictEqual(q.groupMin, nl.groupMin, `${q.id}: groupMin differs between languages`);
    assert.strictEqual(q.xp, nl.xp, `${q.id}: xp differs between languages`);
    assert.notStrictEqual(q.prompt, nl.prompt, `${q.id}: ${lang} prompt is still the Dutch text`);
  }
}

// Every topic key used by the banks must have a label in every language.
const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
const topicKeys = [...new Set(BANKS.nl.map(q => q.topic))];
assert.strictEqual(topicKeys.length, 24, 'expected 24 distinct topic keys');
for (const key of topicKeys) {
  const hits = i18n.split(`'topic.${key}'`).length - 1;
  assert.strictEqual(hits, LANGS.length, `topic.${key} must be translated in every language (found ${hits})`);
}

console.log(`Kwizillo question banks: OK (${LANGS.map(l => `${l} ${BANKS[l].length}`).join(', ')}, 24 topics, ids in parity)`);

// Every question must resolve to a subject or topic illustration. Falling back to
// the world background was AUDIT.md finding 4.11: the card showed the same picture
// as the blurred backdrop behind it.
{
  const worldAssets = fs.readFileSync(path.join(ROOT, 'world-assets.js'), 'utf8');
  const K = { MASTER: {}, QUESTION_ART: {}, TOPIC_ART: {} };
  vm.runInNewContext(worldAssets, { window: { KWIZILLO_M1: K } });

  assert.strictEqual(Object.keys(K.TOPIC_ART).length, 24, 'every topic needs an illustration');
  for (const [topic, src] of Object.entries(K.TOPIC_ART)) {
    assert.ok(fs.existsSync(path.join(ROOT, src)), `${topic}: missing art file ${src}`);
    assert.ok(!/^https?:/.test(src), `${topic}: art must be local, got ${src}`);
  }
  for (const [kind, src] of Object.entries(K.QUESTION_ART)) {
    assert.ok(fs.existsSync(path.join(ROOT, src)), `${kind}: missing art file ${src}`);
  }

  const core = require('../quiz-core-v2.js');
  const OWN_TOPIC = { body: 'lichaam', castle: 'ridders_kastelen', dissolve: 'slimme_proefjes', light: 'slimme_proefjes' };
  // The astronaut muscle questions legitimately reach for the anatomy picture;
  // the mirror-writing question mentions light. All three have their own art,
  // so the subject fallback is never shown for them anyway.
  const ALLOWED_CROSS = new Set(['ruimte-astronauten-07', 'ruimte-astronauten-17', 'mysterie-speurtocht-20']);

  for (const [lang, bank] of Object.entries(BANKS)) {
    const unresolved = bank.filter(q => !K.QUESTION_ART[core.questionArtKind(q)] && !K.TOPIC_ART[q.topic]);
    assert.strictEqual(unresolved.length, 0,
      `${lang}: ${unresolved.length} questions fall back to world art, e.g. ${unresolved[0]?.id}`);

    // Subject matching must not pull a question into an unrelated illustration.
    const stray = bank.filter(q => {
      const kind = core.questionArtKind(q);
      return kind && q.topic !== OWN_TOPIC[kind] && !ALLOWED_CROSS.has(q.id);
    });
    assert.strictEqual(stray.length, 0,
      `${lang}: subject art mismatched ${stray.length} question(s), e.g. ${stray[0]?.id} "${stray[0]?.prompt}"`);
  }
  // Every question has its own illustration; the manifest must match the files
  // on disk and cover both banks (ids are shared between NL and EN).
  const manifest = fs.readFileSync(path.join(ROOT, 'question-art.js'), 'utf8');
  vm.runInNewContext(manifest, { window: { KWIZILLO_M1: K } });
  const onDisk = fs.readdirSync(path.join(ROOT, 'assets/questions/q')).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4));
  assert.deepStrictEqual([...K.QUESTION_ART_IDS].sort(), onDisk.sort(), 'question-art.js is stale: run node tools/question-art-manifest.js');
  for (const [lang, bank] of Object.entries(BANKS)) {
    const missing = bank.filter(q => !K.questionArtFor(q.id));
    assert.strictEqual(missing.length, 0, `${lang}: ${missing.length} question(s) without their own illustration, e.g. ${missing[0]?.id}`);
  }
  for (const id of K.QUESTION_ART_IDS) {
    const size = fs.statSync(path.join(ROOT, K.questionArtFor(id))).size;
    assert.ok(size > 5000 && size < 400000, `${id}: illustration is ${size} bytes`);
  }
  console.log(`Kwizillo question art: OK (${K.QUESTION_ART_IDS.size} per-question illustrations, 24 topic illustrations, 0 subject mismatches)`);
}
