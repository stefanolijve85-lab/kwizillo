// Every world climbs on its own: it is at level n once its four topic quizzes
// have been passed at every level below n (state.js, K.worldLevel). Tests that
// want a world at a given level seed the passed topics rather than a setting,
// because there is no setting any more.
const fs = require('fs'); const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'm1-runtime.js'), 'utf8');
const TOPIC_KEYS = eval('(' + src.match(/K\.TOPIC_KEYS=(\{[^;]*\});/)[1] + ')');

function atLevel(world, level, passed = {}) {
  for (let n = 1; n < level; n++) {
    passed[n] ||= {};
    for (const key of TOPIC_KEYS[world] || []) passed[n][`${world}:${key}`] = true;
  }
  return passed;
}
// Every world at the same level, for a test that does not care which world.
const allAtLevel = level => Object.keys(TOPIC_KEYS).reduce((p, w) => atLevel(w, level, p), {});
// A whole progress object at that level, ready to drop into a saved state.
const progressAtLevel = level => ({ worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: allAtLevel(level), games: {}, factsSeen: {} });

module.exports = { TOPIC_KEYS, atLevel, allAtLevel, progressAtLevel };
