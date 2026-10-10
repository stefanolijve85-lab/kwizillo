// Blokkenpret: the ten levels and the puzzle rules (blokken-levels.js), without a browser.
//   node tests/blokken.test.js
const assert = require('assert');
const D = require('../blokken-levels.js');

const PIECES = [3, 3, 4, 4, 5, 5, 6, 7, 8, 9];
assert.strictEqual(D.LEVELS.length, 10, 'exactly ten levels');
assert.ok(Number.isInteger(D.LEVEL_DATA_VERSION) && D.LEVEL_DATA_VERSION >= 1, 'level data version');

// A tiny seeded random, so a failure can be replayed.
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = a => a[Math.floor(rnd() * a.length)];

let alternatives = 0, deadEnds = 0, worstHint = 0;
for (const lv of D.LEVELS) {
  const tag = `level ${lv.n}`;
  // every rule of the validator: area, connectivity, unique ids/colours/symbols, sizes 2-5, a solution
  assert.deepStrictEqual(D.validateLevel(lv), [], tag);
  assert.strictEqual(lv.pieces.length, PIECES[lv.n - 1], `${tag}: piece count`);
  for (const p of lv.pieces) {
    assert.ok(p.cells.length >= 2 && p.cells.length <= 5, `${tag}: ${p.id} size`);
    assert.ok(D.connected(p.cells), `${tag}: ${p.id} edge-connected`);
    assert.ok(/^b\d+-[a-i]$/.test(p.id), `${tag}: stable id ${p.id}`);
  }
  assert.strictEqual(new Set(lv.pieces.map(p => p.color)).size, lv.pieces.length, `${tag}: one colour per piece`);
  assert.strictEqual(new Set(lv.pieces.map(p => p.symbol)).size, lv.pieces.length, `${tag}: one symbol per piece`);
  assert.ok(D.connected(lv.board), `${tag}: figure connected`);
  assert.strictEqual(lv.pieces.reduce((s, p) => s + p.cells.length, 0), lv.board.length, `${tag}: area`);

  // rotation: none up to level 5 (pieces already lie right), from level 6 it is needed
  if (lv.n <= 5) {
    assert.ok(!lv.rotate && lv.pieces.every(p => p.rotations.join() === '0'), `${tag}: no turning`);
    assert.ok(lv.solution.every(m => m.rot === 0), `${tag}: stored solution uses the tray orientation`);
  } else {
    assert.ok(lv.rotate && lv.pieces.every(p => p.rotations.join() === '0,1,2,3'), `${tag}: turning allowed`);
    const fixed = { ...lv, pieces: lv.pieces.map(p => ({ ...p, rotations: [0] })) };
    assert.ok(!D.solve(fixed, {}).ok, `${tag}: cannot be solved without turning`);
  }
  assert.strictEqual(lv.boost, lv.n >= 4, `${tag}: BONUS BOOST from level 4`);

  // the stored solution and every solution the solver finds are complete covers
  const stored = Object.fromEntries(lv.solution.map(m => [m.id, { x: m.x, y: m.y, rot: m.rot }]));
  assert.ok(D.isComplete(lv, stored), `${tag}: stored solution complete`);
  const all = D.countSolutions(lv, 40);
  assert.ok(all.count >= 1, `${tag}: solvable`);
  for (const s of all.solutions) {
    const map = Object.fromEntries(s.map(m => [m.id, m]));
    assert.ok(D.isComplete(lv, map), `${tag}: solver solution complete`);
    if (JSON.stringify(map) !== JSON.stringify(Object.fromEntries(lv.solution.map(m => [m.id, m])))) {
      // ANY full cover is accepted, not only the stored one
      const differs = lv.solution.some(m => map[m.id].x !== m.x || map[m.id].y !== m.y || map[m.id].rot !== m.rot);
      if (differs) alternatives++;
    }
  }
  // not complete: one piece missing, or a piece out of the figure
  const missing = { ...stored }; delete missing[lv.pieces[0].id];
  assert.ok(!D.isComplete(lv, missing), `${tag}: incomplete is not complete`);

  // bounds and overlap
  const p0 = lv.pieces[0];
  assert.ok(!D.canPlace(lv, {}, p0.id, -1, 0, 0), `${tag}: out of bounds left`);
  assert.ok(!D.canPlace(lv, {}, p0.id, lv.cols, 0, 0), `${tag}: out of bounds right`);
  assert.ok(!D.canPlace(lv, {}, p0.id, 0.5, 0, 0), `${tag}: fractional position`);
  const s0 = lv.solution[0], s1 = lv.solution[1];
  const one = { [s0.id]: { x: s0.x, y: s0.y, rot: s0.rot } };
  assert.ok(D.canPlace(lv, {}, s0.id, s0.x, s0.y, s0.rot), `${tag}: solution spot fits on an empty board`);
  assert.ok(!D.canPlace(lv, one, s1.id, s0.x, s0.y, s0.rot) || D.cellsAt(D.pieceById(lv, s1.id), s0.x, s0.y, s0.rot).every(c => !D.cellsAt(D.pieceById(lv, s0.id), s0.x, s0.y, s0.rot).some(d => d[0] === c[0] && d[1] === c[1])), `${tag}: overlap refused`);
  assert.ok(D.canPlace(lv, one, s0.id, s0.x, s0.y, s0.rot), `${tag}: a piece does not block its own old spot`);
  if (!lv.rotate) assert.ok(!D.canPlace(lv, {}, s0.id, s0.x, s0.y, 1), `${tag}: turning refused before level 6`);
  assert.ok(D.validPlacements(lv, stored) && !D.validPlacements(lv, { ...stored, [p0.id]: { x: 99, y: 0, rot: 0 } }), `${tag}: validPlacements`);

  // hints follow the CURRENT board: every partial board on the way to a
  // solution gets a 'place' hint that keeps the figure finishable
  for (let k = 0; k < lv.solution.length; k++) {
    const part = Object.fromEntries(lv.solution.slice(0, k).map(m => [m.id, { x: m.x, y: m.y, rot: m.rot }]));
    const h = D.hint(lv, part, Object.keys(part));
    assert.strictEqual(h.kind, 'place', `${tag}: hint after ${k} pieces`);
    assert.ok(!part[h.id], `${tag}: hint names a free piece`);
    assert.ok(D.canPlace(lv, part, h.id, h.x, h.y, h.rot), `${tag}: hint fits`);
    assert.ok(D.solve(lv, { ...part, [h.id]: { x: h.x, y: h.y, rot: h.rot } }).ok, `${tag}: hint leads to a full figure`);
  }
  assert.strictEqual(D.hint(lv, stored, []).kind, 'done', `${tag}: hint on a full board`);

  // dead ends: random valid layouts that cannot be finished get a take-back
  // step that really makes the figure finishable again
  for (let tries = 0; tries < 60; tries++) {
    const pl = {}, order = [];
    for (const p of lv.pieces.slice().sort(() => rnd() - .5).slice(0, 1 + Math.floor(rnd() * Math.min(4, lv.pieces.length - 1)))) {
      const spots = [];
      for (const r of p.rotations) for (const [x, y] of lv.board) if (D.canPlace(lv, pl, p.id, x, y, r)) spots.push({ x, y, rot: r });
      if (!spots.length) continue;
      pl[p.id] = pick(spots); order.push(p.id);
    }
    if (!Object.keys(pl).length || D.solve(lv, pl).ok) continue;
    deadEnds++;
    const t0 = Date.now();
    const h = D.hint(lv, pl, order);
    worstHint = Math.max(worstHint, Date.now() - t0);
    assert.strictEqual(h.kind, 'takeBack', `${tag}: dead end gets a take-back`);
    assert.ok(pl[h.id] && h.ids.includes(h.id), `${tag}: take-back names a placed piece`);
    const rest = { ...pl }; for (const id of h.ids) delete rest[id];
    assert.ok(D.solve(lv, rest).ok, `${tag}: after the take-back the figure can be finished`);
    // the smallest set: no single piece of a bigger set would do
    if (h.ids.length > 1) for (const id of Object.keys(pl)) { const r = { ...pl }; delete r[id]; assert.ok(!D.solve(lv, r).ok, `${tag}: minimal take-back`) }
  }
}
assert.ok(alternatives > 0, 'some level has a second valid solution (and it is accepted)');
assert.ok(deadEnds >= 20, `enough dead ends tried (${deadEnds})`);
assert.ok(worstHint < 400, `hint on a dead end is quick (${worstHint} ms)`);

// the same data every time it is built (phone, tablet, desktop all load this file)
delete require.cache[require.resolve('../blokken-levels.js')];
const again = require('../blokken-levels.js');
assert.strictEqual(JSON.stringify(again.LEVELS), JSON.stringify(D.LEVELS), 'level data is deterministic');

// solver timing from an empty board
let worst = 0;
for (const lv of D.LEVELS) { const t0 = Date.now(); assert.ok(D.solve(lv, {}).ok); worst = Math.max(worst, Date.now() - t0) }
assert.ok(worst < 200, `solver is quick (${worst} ms)`);

console.log(`blokken: 10 levels valid and solvable; ${alternatives} alternative solutions accepted; ${deadEnds} dead ends get a working take-back (worst ${worstHint} ms) ✔`);
