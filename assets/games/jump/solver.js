// Mike & Mia: Jump & Slide — proof that a level can be finished.
//
// A depth-first search over the real engine: every 1/20 s the "player" may do
// nothing, press jump or press slide; a branch dies as soon as the child is
// hit, falls, or is stopped by a wall. The first branch that reaches the
// finish is a clean run, with its presses as the input plan. `windows` then
// measures, for each press of that plan, how much earlier or later it could
// have come and still give a clean run (the margin a child has).
// The jetpack and the energy are part of the search like any other state: a
// branch that runs into a high tower without the jetpack is stopped by it
// (blocked), so a plan that finishes has grabbed the jetpack in time.
// Used by tests/jump.test.mjs and by the in-game test hook; never in play.
import { createRun, step, pressJump, pressSlide, snapshot, restore, STEP } from './engine.js';
import { level as getLevel, WORLDS } from './levels.js';

const EVERY = 6;   // engine steps per decision (120 Hz / 6 = 20 decisions a second)
const bad = s => s.hits > 0 || s.falls > 0 || s.p.blocked;
// The power-ups in a state's key: two branches at the same moment and height are only the same
// when they fly, sink and run turbo alike (and, with turbo, stand at the same place).
const power = s => { const p = s.p; return `${Math.ceil(p.jet * 20)}${p.sinking ? 's' : ''}|${Math.ceil(p.boost * 20)}|${p.boost > 0 || s.energiesTaken ? Math.round(p.x / 4) : ''}` };

// `level` replaces the world's level (the test takes the jetpack away to show the tower needs it).
export function solve(id, { budget = 400000, level = null } = {}) {
  const L = level || getLevel(id), W = WORLDS[id], s = createRun(L, W);
  const seen = new Set(), stack = [{ snap: snapshot(s), k: 0, choice: 0 }], plan = [];
  let tries = 0, farthest = 0;
  while (stack.length && tries < budget) {
    const top = stack[stack.length - 1];
    if (top.choice > 2) { stack.pop(); plan.pop(); continue }
    restore(s, top.snap);
    const choice = top.choice++;
    if (choice === 1) pressJump(s); else if (choice === 2) pressSlide(s);
    let dead = false;
    for (let i = 0; i < EVERY; i++) { step(s); if (bad(s)) { dead = true; break } if (s.phase === 'finish') break }
    tries++;
    if (dead) continue;
    const p = s.p, key = `${top.k}|${Math.round(p.y)}|${Math.round(p.vy / 40)}|${p.jumps}|${p.sliding ? Math.ceil(p.slideT * 20) : -1}|${p.ground ? 1 : 0}|${power(s)}`;
    if (seen.has(key)) continue;
    seen.add(key); if (p.x > farthest) farthest = p.x;
    plan.length = stack.length - 1; if (choice) plan.push({ k: top.k, a: choice === 1 ? 'jump' : 'slide' }); else plan.push(null);
    if (s.phase === 'finish') return { ok: true, plan: plan.filter(Boolean), time: s.t, stars: s.stars, tries };
    stack.push({ snap: snapshot(s), k: top.k + 1, choice: 0 });
  }
  return { ok: false, tries, reached: Math.round(Math.max(...[...seen].map(k => Number(k.split('|')[0])))) * EVERY * STEP, far: farthest };
}

// Plays a plan (presses at decision k) and reports how the run went.
export function play(id, plan, { stopOnBad = false, maxTime = 90 } = {}) {
  const L = getLevel(id), W = WORLDS[id], s = createRun(L, W);
  const at = new Map(); for (const a of plan) at.set(a.k, a.a);
  let blocked = 0;
  for (let k = 0; s.phase === 'run' && s.t < maxTime; k++) {
    const a = at.get(k); if (a === 'jump') pressJump(s); else if (a === 'slide') pressSlide(s);
    for (let i = 0; i < EVERY; i++) { step(s); if (s.p.blocked) blocked++; if (s.phase !== 'run') break }
    if (stopOnBad && bad(s)) break;
  }
  return { s, phase: s.phase, time: s.t, hits: s.hits, falls: s.falls, hearts: s.hearts, stars: s.stars, blocked };
}

// Can the child still get through the next `depth` decisions without a hit,
// a fall or a wall, whatever they press? (the same search, from a snapshot)
function survives(s, depth) {
  const seen = new Set(), stack = [{ snap: snapshot(s), d: 0, choice: 0 }];
  while (stack.length) {
    const top = stack[stack.length - 1];
    if (top.choice > 2) { stack.pop(); continue }
    restore(s, top.snap);
    const choice = top.choice++;
    if (choice === 1) pressJump(s); else if (choice === 2) pressSlide(s);
    let dead = false;
    for (let n = 0; n < EVERY; n++) { step(s); if (bad(s)) { dead = true; break } if (s.phase !== 'run') return true }
    if (dead) continue;
    if (top.d + 1 >= depth) return true;
    const p = s.p, key = `${top.d}|${Math.round(p.y)}|${Math.round(p.vy / 40)}|${p.jumps}|${p.sliding ? Math.ceil(p.slideT * 20) : -1}|${power(s)}`;
    if (seen.has(key)) continue; seen.add(key);
    stack.push({ snap: snapshot(s), d: top.d + 1, choice: 0 });
  }
  return false;
}

// For each press of a plan: how much earlier and later (seconds) it could come
// and the child could still get through the next two seconds cleanly — with
// any presses after it, not only the plan's (a double jump moves with its
// first jump). This is the margin a child has at every obstacle.
export function windows(id, plan, reach = 12) {
  const L = getLevel(id), W = WORLDS[id], s = createRun(L, W), snaps = [];
  const at = new Map(); for (const a of plan) at.set(a.k, a.a);
  for (let k = 0; s.phase === 'run' && k < 2400; k++) {
    snaps[k] = snapshot(s);
    const a = at.get(k); if (a === 'jump') pressJump(s); else if (a === 'slide') pressSlide(s);
    for (let n = 0; n < EVERY; n++) { step(s); if (s.phase !== 'run') break }
  }
  // the plan up to k0, then nothing until the press at k, then any presses
  const ok = (k0, k, a) => {
    if (!snaps[k0]) return false;
    restore(s, snaps[k0]);
    for (let j = k0; j <= k; j++) {
      if (j === k) { if (a === 'jump') pressJump(s); else pressSlide(s) }
      for (let n = 0; n < EVERY; n++) { step(s); if (bad(s)) return false; if (s.phase !== 'run') return true }
    }
    return survives(s, 40);
  };
  const dt = EVERY * STEP;
  return plan.map((a, i) => {
    const prev = i ? plan[i - 1].k : -1;
    let early = 0, late = 0;
    for (let d = 1; d <= reach && a.k - d > prev; d++) { if (!ok(a.k - d, a.k - d, a.a)) break; early = d }
    for (let d = 1; d <= reach; d++) { if (!ok(a.k, a.k + d, a.a)) break; late = d }
    return { a: a.a, t: +(a.k * dt).toFixed(2), early: +(early * dt).toFixed(2), late: +(late * dt).toFixed(2), width: +((early + late + 1) * dt).toFixed(2) };
  });
}
