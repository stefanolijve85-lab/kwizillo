// Mike & Mia: Jump & Slide — the engine and the levels, without a browser.
// The physics rules (jump, double jump, buffer, coyote time, slide, bounce
// pads, hits, falls, the two ends of a run) on small test levels, and proof
// that each of the three real levels can be finished with the real physics.
import assert from 'assert';
import { createRun, step, pressJump, pressSlide, STEP, PLAYER, TIMING, score, pose } from '../assets/games/jump/engine.js';
import { WORLDS, WORLD_ORDER, level, reach } from '../assets/games/jump/levels.js';
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
  assert.ok(r.time > 36 && r.time < 44, `${id}: about 40 s of play (${r.time.toFixed(1)} s)`);
  const again = play(id, r.plan);
  assert.strictEqual(again.phase, 'finish', `${id}: the plan replays to the finish`);
  assert.strictEqual(again.hits + again.falls, 0);
  assert.strictEqual(L.shields.length, 1, `${id}: one shield`); assert.ok(again.s.gotShield[0], `${id}: the shield lies on the way and is picked up`);
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
