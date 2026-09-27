// The rules that keep points and coins finite, and the record book that makes
// them worth chasing. Pure logic, so it is checked here rather than through a
// browser.
const assert = require('assert');
const S = require('../scores.js');

// --- the windows a moment falls in -----------------------------------------
const k = S.periodKeys(new Date(2026, 8, 27, 10, 0));        // Sunday 27 September 2026
assert.deepStrictEqual(k, { day: '2026-09-27', week: '2026-W39', month: '2026-09', year: '2026' });
// A Monday starts a new week, a day later.
assert.strictEqual(S.periodKeys(new Date(2026, 8, 28)).week, '2026-W40');
// 1 January 2027 is a Friday and still belongs to week 53 of 2026.
assert.strictEqual(S.periodKeys(new Date(2027, 0, 1)).week, '2026-W53');
assert.strictEqual(S.periodKeys(new Date(2027, 0, 1)).year, '2027');

// --- a repeated question pays practice, never nothing ----------------------
assert.strictEqual(S.answerPoints(18), 18);
assert.strictEqual(S.answerPoints(18, { repeat: true }), 7);
assert.strictEqual(S.answerPoints(1, { repeat: true }), S.RULES.minRepeat);
assert.strictEqual(S.answerPoints(0, { repeat: true }), 0);

// --- points: every window counts, the day has a ceiling --------------------
let s = S.emptyScores();
let r = S.addPoints(s, 18, { keys: k }); s = r.scores;
assert.strictEqual(r.granted, 18);
for (const u of S.UNITS) assert.strictEqual(s.periods[u].points, 18, `${u} counted`);
assert.strictEqual(s.allTime, 18);
assert.strictEqual(s.run.points, 18);

r = S.addPoints(s, 99999, { keys: k }); s = r.scores;
assert.strictEqual(r.granted, S.RULES.dayPoints - 18, 'the day fills up exactly');
assert.ok(r.capped);
assert.strictEqual(S.addPoints(s, 50, { keys: k }).granted, 0, 'and stays full');

// --- coins: one run is capped, the day is capped too -----------------------
let c = S.emptyScores();
let cr = S.addCoins(c, 900, { keys: k, runCap: S.RULES.runCoins }); c = cr.scores;
assert.strictEqual(cr.granted, S.RULES.runCoins, 'one run cannot pay more than a run');
cr = S.addCoins(c, 900, { keys: k, runCap: S.RULES.runCoins }); c = cr.scores;
assert.strictEqual(c.coins.earned, S.RULES.dayCoins, 'the day cannot pay more than a day');
assert.ok(cr.capped);

// --- a finished window becomes a record ------------------------------------
const next = S.periodKeys(new Date(2026, 8, 28));            // the next day, and a new week
const rolled = S.roll(s, next);
assert.strictEqual(rolled.periods.day.points, 0, 'today starts at zero');
assert.strictEqual(rolled.best.day, S.RULES.dayPoints, 'yesterday is the record');
assert.strictEqual(rolled.periods.month.points, S.RULES.dayPoints, 'the month runs on');
assert.strictEqual(rolled.coins.earned, 0, 'the coin ceiling is a daily one');

// --- an exercise is counted apart ------------------------------------------
let e = S.emptyScores();
e = S.addPoints(e, 120, { keys: k }).scores;
e = S.startRun(e, k);
assert.strictEqual(e.run.points, 0, 'a new exercise starts at zero');
assert.strictEqual(e.best.run, 120, 'the one before it is the record');
e = S.addPoints(e, 60, { keys: k }).scores;
const sum = S.summary(e, k);
assert.strictEqual(sum.run.best, 120, 'a weaker exercise does not beat the record');
assert.strictEqual(sum.rows.find(x => x.unit === 'day').points, 180);
assert.strictEqual(sum.rows.find(x => x.unit === 'day').best, 180, 'the open day counts as its own best');
assert.strictEqual(sum.pointsRoom, S.RULES.dayPoints - 180);

// --- an old save is read without crashing ----------------------------------
const fromNothing = S.normalise(undefined);
assert.strictEqual(fromNothing.allTime, 0);
assert.strictEqual(S.normalise({ allTime: -5, best: { day: 'x' } }).best.day, 0, 'nonsense reads as zero');

console.log('scores: windows, ceilings, practice share and records ✔');
