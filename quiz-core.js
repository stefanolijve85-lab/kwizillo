(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KWIZILLO_CORE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function shuffle(items, rng = Math.random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function selectQuestions({ questions, world, topicKey = null, grade = 5, limit = 10, rng = Math.random }) {
    let pool = (questions || []).filter(q => q.world === world && (!topicKey || q.topic === topicKey));
    const gradePool = pool.filter(q => (q.groupMin || 1) <= grade && (q.groupMax || 8) >= grade);
    if (gradePool.length >= Math.min(6, limit)) pool = gradePool;
    return shuffle(pool, rng).slice(0, Math.min(limit, pool.length));
  }

  function buildQuestionSpeech(question) {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const options = (question.options || []).map((option, index) => `Antwoord ${labels[index] || index + 1}: ${option}.`).join(' ');
    return `${question.prompt} ${options}`.trim();
  }

  function evaluateAnswer(question, value) {
    return { correct: value === question.answer, answer: question.answer, selected: value };
  }

  function createSession({ world, topicKey = null, topicLabel = 'Gemengde quiz', questions = [] }) {
    return { world, topicKey, topicLabel, questions, index: 0, score: 0, xp: 0, answeredById: {}, hint: false };
  }

  function recordAnswer(session, question, value) {
    if (!session || !question) return { accepted: false, reason: 'invalid' };
    if (session.answeredById && session.answeredById[question.id]) return { accepted: false, reason: 'already-answered' };
    session.answeredById = session.answeredById || {};
    session.answeredById[question.id] = true;
    const result = evaluateAnswer(question, value);
    if (result.correct) {
      session.score += 1;
      session.xp += question.xp || 10;
    }
    return { accepted: true, ...result };
  }

  function topicCounts(questions) {
    const counts = {};
    for (const q of questions || []) {
      counts[q.world] ||= {};
      counts[q.world][q.topic] = (counts[q.world][q.topic] || 0) + 1;
    }
    return counts;
  }

  return { shuffle, selectQuestions, buildQuestionSpeech, evaluateAnswer, createSession, recordAnswer, topicCounts };
});
