// Gameplay core contract. Content shape lives in questions.test.js.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const core = require('../quiz-core-v2.js');

const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['questions.js', 'questions-en.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
}
const questions = ctx.window.KWIZILLO_QUESTIONS_NL;

/* ---- topic routing stays isolated ---- */
const topicBatch = core.selectQuizBatch({ questions, world: 'wetenschap', topicKey: 'lichaam', grade: 5, limit: 10, rng: () => 0.37 });
assert.strictEqual(topicBatch.questions.length, 10);
assert.ok(topicBatch.questions.every(q => q.world === 'wetenschap' && q.topic === 'lichaam'), 'Topic routing leaked another pool');

/* ---- a mixed world quiz serves four unique batches before recycling ---- */
{
  let usedIds = [];
  const seen = new Set();
  for (let quiz = 1; quiz <= 4; quiz++) {
    const batch = core.selectQuizBatch({ questions, world: 'ruimte', grade: 5, limit: 10, usedIds });
    assert.strictEqual(batch.questions.length, 10, `quiz ${quiz} must serve 10 questions`);
    assert.strictEqual(batch.recycled, false, `quiz ${quiz} must not recycle; the world holds 40 questions`);
    for (const q of batch.questions) {
      assert.ok(!seen.has(q.id), `quiz ${quiz} repeated question ${q.id} before the pool was exhausted`);
      seen.add(q.id);
    }
    usedIds = batch.usedIds;
  }
  assert.strictEqual(seen.size, 40, 'four quizzes must cover all 40 world questions exactly once');

  // Only after that does the cycle restart.
  const fifth = core.selectQuizBatch({ questions, world: 'ruimte', grade: 5, limit: 10, usedIds });
  assert.strictEqual(fifth.recycled, true, 'the fifth quiz must restart the cycle');
  assert.strictEqual(fifth.questions.length, 10);
}

/* ---- a single topic only holds 10, so it recycles and says so ---- */
{
  const first = core.selectQuizBatch({ questions, world: 'ruimte', topicKey: 'zonnestelsel', grade: 5, limit: 10 });
  assert.strictEqual(first.recycled, false);
  const second = core.selectQuizBatch({ questions, world: 'ruimte', topicKey: 'zonnestelsel', grade: 5, limit: 10, usedIds: first.usedIds });
  assert.strictEqual(second.recycled, true, 'a 10-question topic must report that it recycled');
}

/* ---- answer order is shuffled without mutating the source ---- */
{
  const source = questions.find(q => q.id === 'ruimte-zonnestelsel-01');
  const before = [...source.options];
  core.selectQuizBatch({ questions, world: 'ruimte', topicKey: 'zonnestelsel', grade: 5, limit: 10 });
  // Spread both sides: the bank lives in a vm context, so its arrays carry a
  // different Array.prototype and deepStrictEqual would fail on the realm alone.
  assert.deepStrictEqual([...source.options], [...before], 'Selection must not mutate the source bank');
}

/* ---- speech: no "Antwoord A" / "Answer A" (CLAUDE.md section 9) ---- */
{
  const q = topicBatch.questions[0];
  const segments = core.buildQuestionSpeechSegments(q);
  assert.strictEqual(segments.length, 1 + q.options.length, 'Question and every answer must be separate speech segments');
  assert.strictEqual(segments[0].kind, 'question');
  assert.strictEqual(segments[0].text, q.prompt);
  segments.slice(1).forEach((segment, i) => {
    assert.strictEqual(segment.kind, 'answer');
    assert.strictEqual(segment.index, i);
    assert.strictEqual(segment.text, `${['A', 'B', 'C', 'D'][i]}. ${q.options[i]}.`);
    assert.ok(!/antwoord|answer/i.test(segment.text), `Segment must not announce "${segment.text}"`);
  });
}

/* ---- feedback speech takes its copy from the caller, so it is language-agnostic ---- */
{
  const q = topicBatch.questions[0];
  const nl = core.buildFeedbackSpeech(q, true, { good: 'Goed gedaan.', fact: 'Wist je dat? {fact}' });
  assert.ok(nl.startsWith('Goed gedaan.'), 'Correct feedback must open with the supplied copy');
  assert.ok(nl.includes(q.explanation), 'Correct feedback must narrate the explanation');

  const en = core.buildFeedbackSpeech(q, false, { tryAgain: 'Almost. The right answer is {answer}.' });
  assert.ok(en.includes(q.answer), 'Incorrect feedback must name the right answer');
  assert.ok(!/Goed gedaan/.test(en), 'Feedback must not fall back to hardcoded Dutch');

  const bare = core.buildFeedbackSpeech(q, true, {});
  assert.ok(!/undefined|\{/.test(bare), 'Missing copy must not leak placeholders');
}

/* ---- double submit and cancellation ---- */
{
  const q = topicBatch.questions[0];
  const session = core.createSession({ world: q.world, topicKey: q.topic, questions: [q], quizNumber: 3 });
  assert.strictEqual(session.quizNumber, 3, 'Session must carry its quiz number');
  assert.strictEqual(core.recordAnswer(session, q, q.answer).accepted, true);
  assert.strictEqual(core.recordAnswer(session, q, q.answer).accepted, false, 'Double submit must be ignored');
  assert.strictEqual(session.score, 1);

  const gate = core.createCancellationGate();
  const token = gate.begin();
  assert.strictEqual(gate.isCurrent(token), true);
  gate.cancel();
  assert.strictEqual(gate.isCurrent(token), false, 'Cancelled speech must become stale immediately');
}

/* ---- no display copy is hardcoded outside i18n ---- */
{
  const RUNTIME = ['m1-ui.js', 'quiz-visual-v2.js', 'onboarding.js', 'quiz-core-v2.js'];
  const DUTCH_COPY = /Ruimtewereld|Dierenwereld|Aardewereld|Geschiedeniswereld|Wetenschapwereld|Mysteriewereld|Gemengde quiz|Nog een quiz|Goed gedaan|Bijna goed|Wist je dat|Ouderzone|Prestaties|Statistieken/;
  for (const file of RUNTIME) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(!DUTCH_COPY.test(src), `${file} still contains hardcoded Dutch display copy`);
  }
  const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  assert.ok(/Ruimtewereld/.test(i18n) && /Space World/.test(i18n), 'i18n must hold both languages');
}

/* ---- state schema migration drops the fake seed for untouched players ---- */
{
  const src = fs.readFileSync(path.join(ROOT, 'state.js'), 'utf8');
  assert.ok(!/coins:245|streak:7|level:5|xp:320/.test(src.split('LEGACY_SEED')[1].split('DEFAULTS')[0] ? src.replace(/const LEGACY_SEED=\{[^}]*\};/, '') : src),
    'New players must not be seeded with fake progress');
  assert.ok(/LEGACY_SEED/.test(src), 'Migration must recognise the old seeded values');
  assert.ok(/touchStreak/.test(src), 'Streak must be derived from real play dates');
}

/* ---- digits are spoken as words, per language, display untouched ---- */
{
  assert.strictEqual(core.spellNumbers('B. 7.', 'nl'), 'B. zeven.');
  assert.strictEqual(core.spellNumbers('A. 8.', 'en'), 'A. eight.');
  assert.strictEqual(core.spellNumbers('Ongeveer 71% van de aarde.', 'nl'), 'Ongeveer eenenzeventig procent van de aarde.');
  assert.strictEqual(core.spellNumbers('boven 300 km/u', 'nl'), 'boven driehonderd kilometer per uur');
  assert.strictEqual(core.spellNumbers('Sinds 2006', 'nl'), 'Sinds tweeduizend zes');
  assert.strictEqual(core.spellNumbers('rond 0 °C', 'nl'), 'rond nul graden Celsius');
  assert.strictEqual(core.spellNumbers('about 165 Earth years', 'en'), 'about one hundred and sixty-five Earth years');
  assert.strictEqual(core.spellNumbers('1 cm can mean 1 km', 'en'), 'one centimetre can mean one kilometre');
  assert.strictEqual(core.spellNumbers('Since 2006', 'en'), 'Since two thousand and six');
  assert.strictEqual(core.spellNumbers('Mercurius', 'nl'), 'Mercurius', 'text without digits must pass through unchanged');

  // Every number that actually occurs in either bank must convert cleanly.
  for (const [lang, bank] of Object.entries({ nl: questions, en: ctx.window.KWIZILLO_QUESTIONS_EN })) {
    for (const q of bank) {
      for (const text of [q.prompt, ...q.options, q.explanation, q.fact]) {
        const spoken = core.spellNumbers(text, lang);
        assert.ok(!/\d/.test(spoken), `${lang} ${q.id}: digits survived in "${spoken}"`);
      }
    }
  }
  // The speech builder still emits the display form; conversion is the voice layer's job.
  const numeric = questions.find(q => q.options.some(o => /^\d+$/.test(o)));
  const seg = core.buildQuestionSpeechSegments(numeric).find(s => /^\w\. \d+\.$/.test(s.text));
  assert.ok(seg, 'expected a numeric answer segment in the bank');
  assert.ok(!/\d/.test(core.spellNumbers(seg.text, 'nl')), 'numeric answer segment must be spoken as a word');
}

console.log('Kwizillo core gameplay tests: OK');
