// Mike & Mia: Jump & Slide — the engine and the levels, without a browser.
// The physics rules (jump, double jump, buffer, coyote time, slide, bounce
// pads, hits, falls, the two ends of a run) on small test levels, and proof
// that each of the three real levels can be finished with the real physics.
import assert from 'assert';
import { createRun, step, pressJump, pressSlide, STEP, PLAYER, TIMING, POWER, score, pose } from '../assets/games/jump/engine.js';
import { WORLDS, WORLD_ORDER, FLIGHT, level, reach } from '../assets/games/jump/levels.js';
import { solve, play, windows } from '../assets/games/jump/solver.js';

const W = WORLDS.underwater;
const run = (sec, s) => { for (let i = 0; i < Math.round(sec / STEP); i++) step(s) };
// A test level: a long floor, plus whatever a test adds.
const flat = (extra = {}) => ({ start: { x: 100, y: 0 }, finish: 1e6, killY: 600, solids: [{ x: 0, y: 0, w: 1e5, h: 900 }], oneway: [], lows: [], hazards: [], bounces: [], stars: [], cps: [], deco: [], hints: [], ...extra });
const fresh = extra => createRun(flat(extra), W);

/* ---- jump, double jump, never a third ---- */
{
  const s = fresh(); run(.1, s);
  pressJump(s); step(s);
  assert.strictEqual(s.p.jumps, 1); assert.ok(s.p.vy < 0 && !s.p.ground, 'a jump leaves the ground');
  run(.2, s); pressJump(s); step(s);
  assert.strictEqual(s.p.jumps, 2, 'a press in the air is the double jump');
  assert.ok(Math.abs(s.p.vy + W.double) < W.gravity * STEP * 2, 'the double jump always launches at the same speed');
  const vy = s.p.vy; run(.05, s); pressJump(s); step(s);
  assert.strictEqual(s.doublesMade, 1, 'no third jump'); assert.ok(s.p.vy > vy, 'a third press changes nothing');
  run(2, s); assert.ok(s.p.ground && s.p.jumps === 0, 'landing gives both jumps back');
}
/* ---- the double jump is the same however late it comes ---- */
{
  const lift = delay => { const s = fresh(); pressJump(s); step(s); run(delay, s); pressJump(s); step(s); return s.p.vy };
  assert.strictEqual(lift(.1).toFixed(3), lift(.5).toFixed(3));
}
/* ---- jump buffer: a press just before landing jumps on landing; too early does nothing ---- */
{
  const land = early => {
    const s = fresh(); pressJump(s); step(s); pressJump(s); step(s);   // both jumps used
    const t0 = s.t; let air = 0; const probe = fresh(); pressJump(probe); step(probe); pressJump(probe); step(probe);
    while (!probe.p.ground) { step(probe); air += STEP }
    run(air - early, s); pressJump(s); run(early + 2 * STEP, s);
    return s.jumpsMade;
  };
  assert.strictEqual(land(.08), 2, 'a press 80 ms before landing becomes a jump');
  assert.strictEqual(land(.25), 1, 'a press 250 ms before landing is forgotten');
}
/* ---- coyote time: just off an edge it is still a ground jump ---- */
{
  const edge = after => {
    const s = createRun(flat({ solids: [{ x: 0, y: 0, w: 400, h: 900 }, { x: 2000, y: 0, w: 1000, h: 900 }] }), W);
    while (s.p.ground) step(s);
    run(after, s); pressJump(s); step(s); return s.p.jumps;
  };
  assert.strictEqual(edge(.05), 1, '50 ms off the edge: a ground jump, the double jump still to come');
  assert.strictEqual(edge(.2), 2, '200 ms off the edge: this press is the air jump');
}
/* ---- slide: lower hitbox, bounded, one press is one slide, never under a ceiling ---- */
{
  const s = fresh(); pressSlide(s); step(s);
  assert.ok(s.p.sliding && s.p.h === PLAYER.slideH && PLAYER.slideH < 64, 'a slide lowers the hitbox under a 64-high gap');
  run(TIMING.slide + .05, s); assert.ok(!s.p.sliding && s.p.h === PLAYER.h, 'a slide ends by itself');
  run(2, s); assert.strictEqual(s.slidesMade, 1, 'one press, one slide — holding never repeats it');
  // under a low ceiling the child stays down until there is room
  const c = fresh({ lows: [{ x: 160, y: -520, w: 600, h: 456 }] });
  pressSlide(c); step(c); run(TIMING.slide + .3, c);
  assert.ok(c.p.sliding && c.p.x > 160 && c.p.x < 760, 'still sliding under the ceiling after the slide time');
  assert.strictEqual(c.hits, 0);
  pressJump(c); step(c); assert.ok(c.p.ground && c.p.jumps === 0, 'no jump without head room');
  run(2, c); assert.ok(!c.p.sliding && c.hits === 0, 'up again once past it');
  // in the air a slide press does nothing
  const a = fresh(); pressJump(a); step(a); run(.15, a); pressSlide(a); run(.2, a); assert.ok(!a.p.sliding && a.slidesMade === 0);
  // standing into a low beam: one heart, and the child is ducked under it
  const b = fresh({ lows: [{ x: 300, y: -520, w: 170, h: 456 }] }); run(2, b);
  assert.strictEqual(b.hits, 1); assert.ok(b.p.x > 470, 'bumped under, not stopped');
}
/* ---- bounce pad: automatic, always the same, and the double jump comes back ---- */
{
  const s = fresh({ bounces: [{ x: 600, y: 0, w: 92, h: 26, power: W.bounce }] });
  // jump and double jump so that the landing is on the pad
  while (s.p.x < 330) step(s);
  pressJump(s); step(s); run(.25, s); pressJump(s); step(s);
  assert.strictEqual(s.p.jumps, 2);
  while (!s.bounces && s.t < 5) step(s);
  assert.strictEqual(s.bounces, 1, 'the pad bounced');
  assert.strictEqual(s.p.jumps, 1, 'a bounce pad gives the double jump back');
  assert.ok(Math.abs(s.p.vy + W.bounce) < W.gravity * STEP * 2, 'the launch is the same every time');
  pressJump(s); step(s); assert.strictEqual(s.doublesMade, 2, 'and it can be used');
  // running onto a pad bounces too (no press needed)
  const r = fresh({ bounces: [{ x: 400, y: 0, w: 92, h: 26, power: W.bounce }] }); run(1.5, r); assert.strictEqual(r.bounces >= 1, true);
}
/* ---- hits: one heart, a short safe time, the run goes on ---- */
{
  const s = fresh({ hazards: [{ x: 300, y: -38, w: 44, h: 38 }, { x: 420, y: -38, w: 44, h: 38 }] });
  run(2, s);
  assert.strictEqual(s.hearts, 2, 'two hazards close together cost one heart (invulnerable in between)');
  assert.ok(s.p.x > 100 + W.speed * 2 - 5, 'a hit does not slow the child down');
}
/* ---- falls: one heart, back at the last checkpoint ---- */
{
  const s = createRun(flat({ solids: [{ x: 0, y: 0, w: 800, h: 900 }, { x: 1400, y: 0, w: 1000, h: 900 }], cps: [{ x: 300, y: 0 }] }), W);
  run(3, s);
  assert.strictEqual(s.falls, 1); assert.strictEqual(s.hearts, 2);
  assert.ok(s.p.x < 1400 && s.p.inv > 0, 'back at the checkpoint, safe for a moment');
}
/* ---- standing still: before the first step, and for a moment after a respawn ---- */
{
  const s = fresh(); assert.strictEqual(pose(s), 'idle', 'idle before the run starts'); assert.strictEqual(s.p.vx, 0);
  step(s); assert.strictEqual(pose(s), 'run');
  const f = createRun(flat({ solids: [{ x: 0, y: 0, w: 800, h: 900 }, { x: 1400, y: 0, w: 1000, h: 900 }], cps: [{ x: 300, y: 0 }] }), W);
  while (!f.falls) step(f);
  const x = f.p.x; assert.strictEqual(pose(f), 'idle');
  pressJump(f); run(TIMING.respawnFreeze - .05, f);
  assert.strictEqual(f.p.x, x, 'stands still at the checkpoint'); assert.strictEqual(f.jumpsMade, 0, 'a press during the pause is not kept');
  run(.2, f); assert.ok(f.p.x > x && pose(f) === 'run', 'and runs on');
}
/* ---- the two ends of a run: whichever comes first, never both ---- */
{
  const s = createRun(flat({ finish: 600, hazards: [{ x: 700, y: -38, w: 44, h: 38 }] }), W);
  run(3, s);
  assert.strictEqual(s.endedBy, 'finish'); assert.strictEqual(s.hearts, 3, 'nothing hurts after the finish');
  const o = createRun(flat({ finish: 2000, solids: [{ x: 0, y: 0, w: 400, h: 900 }], cps: [] }), W);
  run(8, o);
  assert.strictEqual(o.endedBy, 'over'); assert.strictEqual(o.hearts, 0);
  o.p.x = 5000; run(.5, o); assert.strictEqual(o.endedBy, 'over', 'a finish after the game over is not processed');
  assert.strictEqual(score(o), 0);
}
/* ---- shield: picked up once, takes the next hit instead of a heart; a fall still costs one ---- */
{
  const s = fresh({ shields: [{ x: 300, y: -44 }], hazards: [{ x: 600, y: -38, w: 44, h: 38 }, { x: 1400, y: -38, w: 44, h: 38 }] });
  run(1, s); assert.ok(s.shield, 'picked up');
  run(1.5, s); assert.strictEqual(s.hearts, 3); assert.strictEqual(s.absorbed, 1); assert.ok(!s.shield, 'used up');
  run(3, s); assert.strictEqual(s.hearts, 2, 'the next hit costs a heart again');
  const f = createRun(flat({ shields: [{ x: 200, y: -44 }], solids: [{ x: 0, y: 0, w: 600, h: 900 }, { x: 1400, y: 0, w: 1000, h: 900 }], cps: [{ x: 120, y: 0 }] }), W);
  run(3, f); assert.ok(f.falls >= 1 && f.hearts < 3, 'a shield does not catch a fall');
}
/* ---- jetpack: floats out of running reach, a jump grabs it (Stefan, 2026-10-11) ---- */
const jetLevel = (extra = {}) => flat({ jetpacks: [{ x: 700, y: -FLIGHT.jetUp, cruise: -FLIGHT.cruise }], ...extra });
const jumpAt = (s, x) => { while (s.p.x + PLAYER.w / 2 < x) step(s); pressJump(s) };
{
  const r = createRun(jetLevel(), W); run(4, r);
  assert.strictEqual(r.jetsTaken, 0, 'running under the jetpack does not take it');
  const sl = createRun(jetLevel(), W); while (sl.p.x < 560) step(sl); pressSlide(sl); run(3, sl);
  assert.strictEqual(sl.jetsTaken, 0, 'sliding under it does not take it either');
  // a jump anywhere in a wide window takes it (the margin a child has)
  let ok = 0; for (let x = 450; x <= 720; x += 15) { const j = createRun(jetLevel(), W); jumpAt(j, x); run(1, j); if (j.jetsTaken) ok++ }
  assert.ok(ok >= 8, `a jump grabs it from a wide range of take-off points (${ok} of 19)`);
}
/* ---- jetpack: 7 s of flight at the cruise height, a press puffs up, then a gentle safe landing ---- */
{
  const hz = [{ x: 1200, y: -38, w: 44, h: 38 }, { x: 2400, y: -38, w: 44, h: 38 }];
  const s = createRun(jetLevel({ hazards: hz }), W); jumpAt(s, 600);
  while (!s.jetsTaken) step(s);
  const t0 = s.t; assert.strictEqual(pose(s), 'grab', 'the grab pose first');
  run(2, s); assert.ok(Math.abs(s.p.y + FLIGHT.cruise) < 40, `flying at the cruise height after 2 s (${s.p.y.toFixed(0)})`); assert.strictEqual(pose(s), 'fly');
  const y = s.p.y; pressJump(s); run(.25, s); assert.ok(s.p.y < y - 50, 'a press puffs the child up');
  run(2, s); assert.ok(s.p.y > -FLIGHT.cruise - 40, 'and the pack brings it back to the cruise height');
  while (s.p.jet > 0) step(s);
  assert.ok(Math.abs(s.t - t0 - POWER.jet) < .02, `the flight lasts 7 s (${(s.t - t0).toFixed(2)})`);
  assert.ok(s.p.sinking && !s.p.ground);
  let maxV = 0; while (!s.p.ground) { step(s); maxV = Math.max(maxV, s.p.vy) }
  assert.ok(maxV <= POWER.sink + 1, `it sinks gently (${maxV.toFixed(0)} per s at most)`);
  assert.ok(s.p.inv > 0, 'a short safe moment after landing'); assert.strictEqual(s.hits, 0, 'no hazard hurt while flying or landing');
  assert.ok(!s.p.sinking && s.p.jumps === 0, 'landed: both jumps back');
  run(.2, s); pressJump(s); step(s); assert.ok(s.p.vy < 0 && s.jumpsMade > 1, 'and jumping again as usual');
}
/* ---- the high tower: without the jetpack the child is sent back to try again, no heart lost ---- */
{
  const lv = flat({ solids: [{ x: 0, y: 0, w: 1e5, h: 900 }, { x: 900, y: -FLIGHT.tower, w: FLIGHT.towerW, h: FLIGHT.tower, kind: 'tower' }], cps: [{ x: 300, y: 0 }], jetpacks: [{ x: 600, y: -FLIGHT.jetUp, cruise: -FLIGHT.cruise }] });
  const s = createRun(lv, W); while (!s.retries && s.t < 6) step(s); run(.1, s);
  assert.ok(s.retries >= 1 && s.hearts === 3, 'back to the checkpoint, every heart kept'); assert.ok(s.p.x < 900);
  jumpAt(s, 590); run(6, s); assert.ok(s.jetsTaken === 1 && s.p.x > 900 + FLIGHT.towerW, 'the jetpack is there again, and flies over the tower');
  for (const id of WORLD_ORDER) { const Wd = WORLDS[id], hi = Wd.jump ** 2 / (2 * Wd.gravity) + Wd.double ** 2 / (2 * Wd.gravity); assert.ok(FLIGHT.tower > hi + 25, `${id}: no jump and double jump clears a tower (${hi.toFixed(0)} < ${FLIGHT.tower})`) }
}
/* ---- energy: 7 s of turbo, nothing that stings hurts, then back to normal ---- */
{
  const s = fresh({ energies: [{ x: 300, y: -100 }], hazards: [{ x: 900, y: -38, w: 44, h: 38 }, { x: 1500, y: -38, w: 44, h: 38 }], lows: [{ x: 2200, y: -520, w: 170, h: 456 }] });
  while (!s.energiesTaken) step(s);
  const x0 = s.p.x; run(1, s); assert.ok(Math.abs(s.p.x - x0 - W.speed * POWER.boostSpeed) < 2, 'faster for the boost');
  run(5.9, s); assert.strictEqual(s.hits, 0, 'two hazards and a low beam: no heart lost');
  run(.2, s); assert.strictEqual(s.p.boost, 0);
  const x1 = s.p.x; run(1, s); assert.ok(Math.abs(s.p.x - x1 - W.speed) < 2, 'back to the normal speed after 7 s');
}
/* ---- no tunnelling: a fall at full speed onto a thin platform lands ---- */
{
  const s = createRun(flat({ start: { x: 100, y: -1500 }, solids: [], oneway: [{ x: 0, y: 0, w: 1e5, h: 24 }] }), W);
  s.p.ground = false; run(2, s);
  assert.ok(s.p.ground && s.p.y === 0, 'landed on a 24-high platform after falling 1500');
}

/* ---- the three levels ---- */
for (const id of WORLD_ORDER) {
  const L = level(id), Wd = WORLDS[id], one = reach(Wd);
  const r = solve(id);
  assert.ok(r.ok, `${id}: the solver finds a clean run (no hit, no fall, no wall)`);
  // about 40 s of obstacles plus the high tower stretch (about 12 s), less what the turbo saves
  assert.ok(r.time > 44 && r.time < 58, `${id}: about 50 s of play (${r.time.toFixed(1)} s)`);
  const again = play(id, r.plan);
  assert.strictEqual(again.phase, 'finish', `${id}: the plan replays to the finish`);
  assert.strictEqual(again.hits + again.falls, 0);
  assert.strictEqual(L.shields.length, 1, `${id}: one shield`); assert.ok(again.s.gotShield[0], `${id}: the shield lies on the way and is picked up`);
  // the high tower stretch: a jetpack out of running reach, inside a jump's, before towers that need it
  assert.ok(L.jetpacks.length >= 1 && L.energies.length >= 1, `${id}: a jetpack and an energy`);
  for (const j of L.jetpacks) {
    const fl = L.solids.find(b => b.h > 400 && b.x <= j.x && b.x + b.w > j.x), up = fl.y - j.y;
    assert.ok(up > PLAYER.h / 2 + POWER.reachJet + 10, `${id}: the jetpack cannot be taken running (${up})`);
    assert.ok(up < Wd.jump ** 2 / (2 * Wd.gravity) + PLAYER.h / 2 + POWER.reachJet - 30, `${id}: one jump reaches it`);
    const towers = L.solids.filter(b => b.kind === 'tower' && b.x > j.x && b.x < j.x + 2000);
    assert.ok(towers.length >= 1 && towers.every(t => fl.y - t.y >= FLIGHT.tower), `${id}: high towers after the jetpack`);
    assert.ok(L.cps.some(c => c.x < j.x && c.x > j.x - 800), `${id}: a checkpoint just before the jetpack (a miss starts there again)`);
    assert.ok(!L.bounces.some(b => b.x > j.x - 1500 && b.x < j.x + 2000), `${id}: no bounce pad near the towers`);
  }
  assert.strictEqual(again.s.jetsTaken, 1, `${id}: the solver's run takes the jetpack`); assert.strictEqual(again.s.energiesTaken, 1, `${id}: and the energy`);
  // without the jetpack nobody gets past the first tower
  const firstTower = L.solids.find(b => b.kind === 'tower');
  const nojet = solve(id, { level: { ...L, jetpacks: [] }, budget: 120000 });
  assert.ok(!nojet.ok && nojet.far < firstTower.x, `${id}: the tower cannot be passed without the jetpack`);
  // rhythm: a safe start, no double jump or slide needed before 15 s, a clear run-up
  const t = a => a.k * 6 * STEP;
  assert.ok(t(r.plan[0]) > 4.4, `${id}: nothing to do in the first seconds`);
  const firstSlide = r.plan.find(a => a.a === 'slide');
  assert.ok(firstSlide && t(firstSlide) >= 15, `${id}: the first slide comes after 15 s`);
  assert.ok(r.time - t(r.plan[r.plan.length - 1]) > 2, `${id}: a free run-up to the finish`);
  // every press of the plan has room around it, for a child's timing
  const w = windows(id, r.plan);
  const tight = w.filter(x => x.width < .15);
  assert.strictEqual(tight.length, 0, `${id}: presses with less than 150 ms of margin: ${JSON.stringify(tight)}`);
  // gaps fit the physics of the world: an "easy" gap is easy, a wide one needs the double jump
  assert.ok(Wd.speed * 2 * Wd.jump / Wd.gravity === one);
  // a hit on the way never makes the finish impossible: skip one press before a hazard and play on
  const hazardPress = r.plan.findIndex(a => L.hazards.some(h => { const x = L.start.x + t(a) * Wd.speed; return h.x > x && h.x - x < 260 }));
  assert.ok(hazardPress >= 0, `${id}: has a hazard to test with`);
  const hurt = play(id, r.plan.filter((_, i) => i !== hazardPress));
  assert.strictEqual(hurt.phase, 'finish', `${id}: still finished after a hit`); assert.ok(hurt.hits >= 1 && hurt.hearts >= 1);
  // doing nothing at all never ends in a crash or an endless run: the child stops at a wall or loses hearts
  const idle = play(id, [], { maxTime: 60 });
  assert.notStrictEqual(idle.phase, 'finish', `${id}: cannot be finished without pressing anything`);
  // stars are reachable: a good share is collected on the solver's plain run
  assert.ok(r.stars > L.stars.length * .4, `${id}: ${r.stars}/${L.stars.length} stars on the way`);
  console.log(`jump: ${id} finished in ${r.time.toFixed(1)} s with ${r.plan.length} presses, ${r.stars}/${L.stars.length} stars, narrowest margin ${Math.min(...w.map(x => x.width)).toFixed(2)} s ✔`);
}
/* ---- determinism: the same plan gives the same run ---- */
{
  const r = solve('candy'), a = play('candy', r.plan), b = play('candy', r.plan);
  assert.deepStrictEqual([a.time, a.stars, a.s.p.x], [b.time, b.stars, b.s.p.x]);
}
console.log('jump: engine rules ✔');
