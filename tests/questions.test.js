// Validates every language bank against the contract in CLAUDE.md section 3:
// 6 worlds, 4 topics per world, at least 20 questions per topic (10 base + 10
// advanced) and full parity of ids between languages so progress survives a
// language switch. A topic may hold more than twenty — content/ fills topics up
// to ten questions per difficulty — but every language must hold exactly the
// same ones, so the sizes are compared between languages rather than to a fixed
// number.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { ROOT, loadBanks, LANGS, i18n } = require('./langs.js');

// The worlds and their topics as the app registers them (m1-runtime.js). The
// counts used to be written out here; they are read now, so adding a world is a
// change in one place.
const { TOPIC_KEYS } = require('./levels.js');
const WORLDS = Object.keys(TOPIC_KEYS);
const TOPICS = Object.values(TOPIC_KEYS).flat();
const { ctx, banks: BANKS } = loadBanks();
const countBy = (bank, key) => bank.reduce((m, q) => (m[q[key]] = (m[q[key]] || 0) + 1, m), {});
// Questions that come from content/ carry their own difficulty in the row.
const fromContent = new Set();
{
  const dir = path.join(ROOT, 'content');
  for (const world of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const wdir = path.join(dir, world);
    if (!fs.statSync(wdir).isDirectory()) continue;
    for (const file of fs.readdirSync(wdir).filter(f => f.endsWith('.json')))
      for (const q of JSON.parse(fs.readFileSync(path.join(wdir, file), 'utf8')).questions) fromContent.add(q.id);
  }
}
const nlWorlds = countBy(BANKS.nl, 'world');
// The worlds the app shows: every registered topic of them has questions.
const complete = Object.keys(TOPIC_KEYS).filter(w =>
  TOPIC_KEYS[w].every(t => BANKS.nl.some(q => q.world === w && q.topic === t)));
const nlTopics = BANKS.nl.reduce((m, q) => (m[`${q.world}/${q.topic}`] = true, m), {});

for (const [lang, bank] of Object.entries(BANKS)) {
  assert.ok(Array.isArray(bank), `${lang}: bank missing`);
  assert.strictEqual(bank.length, BANKS.nl.length, `${lang}: has ${bank.length} questions, Dutch has ${BANKS.nl.length}`);

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

  assert.deepStrictEqual(Object.keys(byWorld).sort(), Object.keys(nlWorlds).sort(), `${lang}: other worlds than Dutch`);
  for (const world of Object.keys(byWorld)) assert.ok(WORLDS.includes(world), `${lang}: ${world} is not registered in m1-runtime.js`);
  for (const [world, n] of Object.entries(byWorld)) {
    if (!complete.includes(world)) continue;   // still being written, and hidden
    assert.ok(n >= 80, `${lang}: ${world} must have at least 80 questions, got ${n}`);
  }
  const topics = Object.keys(byTopic);
  assert.deepStrictEqual(topics.sort(), Object.keys(nlTopics).sort(), `${lang}: other topics than Dutch`);
  for (const key of topics) assert.ok(TOPICS.includes(key.split('/')[1]), `${lang}: ${key} is not registered in m1-runtime.js`);
  for (const [topic, n] of Object.entries(byTopic)) {
    assert.ok(n >= 20, `${lang}: ${topic} must have at least 20 questions, got ${n}`);
  }

  // A mixed world quiz must be able to serve eight unique batches of ten. A
  // world whose four topics are not all written yet is hidden from the child
  // (K.playableWorlds), so it is held to this only once it is complete.
  for (const world of Object.keys(byWorld)) {
    if (!complete.includes(world)) continue;
    assert.ok(byWorld[world] >= 80,
      `${lang}: ${world} cannot supply eight unique batches of ten`);
  }
  // In the hand-written layers the difficulty comes from the position: ids 01-10
  // are the base set (1-2) and 11-20 the advanced one (3-4). Everything that
  // comes from content/ states its own difficulty in the row, so there the only
  // rule is that it must be one of the four.
  for (const q of bank) {
    const n = Number(q.id.slice(-2));
    if (fromContent.has(q.id)) assert.ok(q.difficulty >= 1 && q.difficulty <= 4, `${lang}: ${q.id} has difficulty ${q.difficulty}`);
    else if (n <= 10) assert.ok(q.difficulty <= 2, `${lang}: ${q.id} has difficulty ${q.difficulty}`);
    else if (n <= 20) assert.ok(q.difficulty >= 3, `${lang}: ${q.id} has difficulty ${q.difficulty}`);
    else assert.ok(q.difficulty >= 1 && q.difficulty <= 4, `${lang}: ${q.id} has difficulty ${q.difficulty}`);
  }

  // No topic may ask the same thing twice. A child who works up to level 5 and
  // meets a question from level 1 again learns nothing and notices at once, so
  // this is a failure, not a remark. tools/content-lint.cjs also reports the
  // softer case: two questions with one answer, asked differently.
  const asked = new Map();
  for (const q of bank) {
    const key = `${q.world}/${q.topic}/` + q.prompt.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
    assert.ok(!asked.has(key), `${lang}: ${q.id} asks the same as ${asked.get(key)}: "${q.prompt}"`);
    asked.set(key, q.id);
  }

  // Questions carry no display copy for topics; that belongs to i18n.
  assert.ok(!bank.some(q => 'topicLabel' in q), `${lang}: questions must not carry topicLabel`);
}

// Cross-language parity: every bank covers the same ids with the same metadata.
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
const S = i18n().strings;
const topicKeys = [...new Set(BANKS.nl.map(q => q.topic))];
// A registered world whose questions are still being written is hidden by
// K.playableWorlds, so it is work in progress and not a failure — but the run
// says how much of it is still missing.
const unfinished = WORLDS.filter(w => !complete.includes(w));
const emptyTopics = TOPICS.filter(t => !topicKeys.includes(t));
for (const key of topicKeys) {
  for (const lang of LANGS) assert.ok(S[lang][`topic.${key}`], `topic.${key} has no ${lang} label`);
}

console.log(`Kwizillo question banks: OK (${LANGS.map(l => `${l} ${BANKS[l].length}`).join(', ')}, ${complete.length}/${WORLDS.length} worlds, ${topicKeys.length}/${TOPICS.length} topics, ids in parity)`);
if (emptyTopics.length) console.log(`Kwizillo question banks: ${unfinished.length} world(s) still being written (${unfinished.join(', ')}), ${emptyTopics.length} topic(s) without questions: ${emptyTopics.join(', ')}`);

// Every question must resolve to a subject or topic illustration. Falling back to
// the world background was AUDIT.md finding 4.11: the card showed the same picture
// as the blurred backdrop behind it.
{
  const worldAssets = fs.readFileSync(path.join(ROOT, 'world-assets.js'), 'utf8');
  const K = { MASTER: {}, QUESTION_ART: {}, TOPIC_ART: {} };
  vm.runInNewContext(worldAssets, { window: { KWIZILLO_M1: K } });

  // De paden dragen een versiemerk (?v21) tegen oude browsercache; op schijf
  // heet het bestand zonder dat merk.
  const artPath = src => src.split('?')[0];

  assert.deepStrictEqual(Object.keys(K.TOPIC_ART).sort(), [...TOPICS].sort(),
    'every registered topic needs exactly one illustration');
  for (const [topic, src] of Object.entries(K.TOPIC_ART)) {
    assert.ok(fs.existsSync(path.join(ROOT, artPath(src))), `${topic}: missing art file ${src}`);
    assert.ok(!/^https?:/.test(src), `${topic}: art must be local, got ${src}`);
  }
  for (const [kind, src] of Object.entries(K.QUESTION_ART)) {
    assert.ok(fs.existsSync(path.join(ROOT, artPath(src))), `${kind}: missing art file ${src}`);
  }
  // Elke wereldplaat moet er ook echt staan: dit ving de kapotte kunst- en
  // sportplaat niet, omdat alleen onderwerpen werden nagelopen.
  for (const [world, src] of Object.entries(K.MASTER)) {
    assert.ok(fs.existsSync(path.join(ROOT, artPath(src))), `${world}: missing world art ${src}`);
    assert.ok(/\?v\d+$/.test(src), `${world}: world art needs a cache-busting mark, got ${src}`);
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
  // Every question has its own illustration. The only ones allowed to fall back
  // to the subject or topic picture are the ones content/ openly marks as still
  // waiting for art ("art": "todo"); they are counted out loud, so the debt
  // cannot quietly grow. Everything else is a failure.
  const waiting = new Set();
  const contentDir = path.join(ROOT, 'content');
  if (fs.existsSync(contentDir)) {
    for (const dir of fs.readdirSync(contentDir, { withFileTypes: true }).filter(d => d.isDirectory())) {
      for (const file of fs.readdirSync(path.join(contentDir, dir.name)).filter(f => f.endsWith('.json'))) {
        for (const q of JSON.parse(fs.readFileSync(path.join(contentDir, dir.name, file), 'utf8')).questions || []) {
          if (q.art === 'todo') waiting.add(q.id);
        }
      }
    }
  }
  for (const [lang, bank] of Object.entries(BANKS)) {
    const missing = bank.filter(q => !K.questionArtFor(q.id) && !waiting.has(q.id));
    assert.strictEqual(missing.length, 0, `${lang}: ${missing.length} question(s) without their own illustration, e.g. ${missing[0]?.id}`);
  }
  const owed = [...waiting].filter(id => !K.questionArtFor(id));
  if (owed.length) console.log(`Kwizillo question art: ${owed.length} question(s) still on the topic picture, waiting for their own (content/ says so)`);
  for (const id of K.QUESTION_ART_IDS) {
    const size = fs.statSync(path.join(ROOT, K.questionArtFor(id))).size;
    assert.ok(size > 5000 && size < 400000, `${id}: illustration is ${size} bytes`);
  }
  // Pictures that tools/placeholder-art.cjs made because the real render does
  // not exist yet. They are valid files, so nothing breaks; the count is here so
  // that a run always says how much art is still owed.
  {
    const listFile = path.join(ROOT, 'assets', 'placeholder-art.json');
    if (fs.existsSync(listFile)) {
      const { files } = JSON.parse(fs.readFileSync(listFile, 'utf8'));
      for (const f of files) assert.ok(fs.existsSync(path.join(ROOT, f)), `placeholder art missing: ${f}`);
      if (files.length) console.log(`Kwizillo art: ${files.length} temporary picture(s) waiting to be repainted (assets/placeholder-art.json)`);
    }
  }
  console.log(`Kwizillo question art: OK (${K.QUESTION_ART_IDS.size} per-question illustrations, ${TOPICS.length} topic illustrations, 0 subject mismatches)`);
}
