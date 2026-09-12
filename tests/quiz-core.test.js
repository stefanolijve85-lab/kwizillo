const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const core = require('../quiz-core.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'questions.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);
const questions = context.window.KWIZILLO_QUESTIONS;

assert.strictEqual(questions.length, 240, 'Expected 240 questions');
const counts = core.topicCounts(questions);
for (const [world, topics] of Object.entries(counts)) {
  assert.strictEqual(Object.keys(topics).length, 4, `${world} must have 4 topics`);
  for (const [topic, count] of Object.entries(topics)) assert.strictEqual(count, 10, `${world}/${topic} must have 10 questions`);
}

const sample = questions.find(q => q.world === 'wetenschap' && q.topic === 'lichaam');
const selected = core.selectQuestions({ questions, world: 'wetenschap', topicKey: 'lichaam', grade: 5, limit: 10, rng: () => 0.5 });
assert(selected.length > 0, 'Topic selection should return questions');
assert(selected.every(q => q.world === 'wetenschap' && q.topic === 'lichaam'), 'Topic routing leaked another topic');

const speech = core.buildQuestionSpeech(sample);
assert(speech.startsWith(sample.prompt), 'Speech must start with the question');
sample.options.forEach((option, index) => assert(speech.includes(`Antwoord ${['A','B','C','D'][index]}: ${option}.`), 'Speech must include every answer option'));

const session = core.createSession({ world: sample.world, topicKey: sample.topic, questions: [sample] });
const first = core.recordAnswer(session, sample, sample.answer);
const second = core.recordAnswer(session, sample, sample.answer);
assert.strictEqual(first.accepted, true, 'First answer should be accepted');
assert.strictEqual(second.accepted, false, 'Second click must not record twice');
assert.strictEqual(session.score, 1, 'Score must increment exactly once');

console.log('Kwizillo quiz-core tests: OK');
