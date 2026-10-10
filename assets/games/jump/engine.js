// Mike & Mia: Jump & Slide — the simulation. No DOM, no clock, no randomness:
// the same inputs on the same level always give the same run, which is what
// lets tests/jump.test.js prove every level can be finished.
//
// World units are pixels of a 540-high design view; y grows downwards and the
// player's (x, y) is the left edge and the soles of the feet. The game steps it
// at a fixed 120 Hz (STEP); input arrives as presses between steps.
export const STEP = 1 / 120;
export const PLAYER = { w: 40, h: 88, slideH: 40 };   // one hitbox for both children, whatever the pose, hair or backpack
export const TIMING = { respawnFreeze: 0.6, coyote: 0.09, jumpBuffer: 0.1, slideBuffer: 0.12, slide: 0.62, invulnerable: 1.3, respawnInvulnerable: 1.6, hurt: 0.35, land: 0.12 };
export const HEARTS = 3;
// The two power-ups (Stefan, 2026-10-11). A jetpack floats out of running reach (only a jump
// grabs it) and flies the child for 7 s: the pack holds the child at the cruise height the
// level gives it (above the high tower), a jump press is a puff upwards (stars higher up), and
// when the time is up the child sinks gently and lands safely (no hazard hurts while flying or
// sinking, and a moment after the landing). Energy is 7 s of turbo: faster, and nothing that
// stings hurts (falls still count). Both are plain numbers counted down per step, so runs stay
// deterministic and the solver can model them.
export const POWER = { jet: 7, boost: 7, boostSpeed: 1.4, puff: 620, spring: 4, damp: 4, rise: 620, sink: 260, sinkGravity: .25, landSafe: .9, towerRetry: 1.1, reachJet: 30, reachEnergy: 30 };
const EPS = 0.01;
// The level split into 256-wide columns, so a step only looks at what is near
// the child (built once per level; an object is in every column it reaches, plus a margin).
const CELL = 256, KINDS = ['solids', 'oneway', 'lows', 'hazards', 'bounces', 'stars', 'shields', 'jetpacks', 'energies'], ITEMS = new Set(['stars', 'shields', 'jetpacks', 'energies']);
function grid(L) {
  if (L._grid) return L._grid;
  const g = {};
  for (const k of KINDS) {
    const cols = [];
    (L[k] || []).forEach((o, i) => {
      const w = o.w || 0, a = Math.max(0, Math.floor((o.x - 64) / CELL)), b = Math.max(0, Math.floor((o.x + w + 64) / CELL));
      for (let c = a; c <= b; c++) (cols[c] ||= []).push(ITEMS.has(k) ? i : o);
    });
    g[k] = cols;
  }
  Object.defineProperty(L, '_grid', { value: g, enumerable: false });
  return g;
}
const NONE = [];
// what lies in the column of x (the margin of 64 covers the width of the child and the reach for a star)
const near = (s, k, x) => s.grid[k][Math.max(0, Math.floor(x / CELL))] || NONE;

// One run on one level. `world` holds the physics of that world (levels.js).
export function createRun(level, world) {
  const p = { freeze: 0, x: level.start.x, y: level.start.y, vx: 0, vy: 0, w: PLAYER.w, h: PLAYER.h, ground: true, jumps: 0, coyote: 0, jumpBuf: 0, slideBuf: 0, sliding: false, slideT: 0, inv: 0, hurtT: 0, landT: 0, airT: 0, blocked: false, doubleT: 0, bounceT: 0, jet: 0, jetY: 0, sinking: false, boost: 0, towerT: 0, blockedBy: '', grabT: 0 };
  const events = { n: 0, list: Array.from({ length: 48 }, () => ({ type: '', x: 0, y: 0 })) };
  return {
    level, world, p, events, grid: grid(level),
    phase: 'run',          // run → finish | over; the two ends can never both happen
    t: 0,                  // active play time (only while running)
    after: 0,              // time since the finish or the game over
    hearts: HEARTS, stars: 0, got: new Uint8Array(level.stars.length),
    // a shield picked up takes the next hit instead of a heart (not a fall)
    shield: false, gotShield: new Uint8Array((level.shields || []).length), absorbed: 0,
    // power-ups taken (a jetpack comes back after a respawn behind it, see respawn)
    gotJet: new Uint8Array((level.jetpacks || []).length), gotEnergy: new Uint8Array((level.energies || []).length), jetsTaken: 0, energiesTaken: 0, flights: 0, retries: 0,
    hits: 0, falls: 0, jumpsMade: 0, doublesMade: 0, slidesMade: 0, bounces: 0,
    cp: { x: level.start.x, y: level.start.y },
    endedBy: null
  };
}

function emit(s, type, x, y) { const e = s.events; if (e.n < e.list.length) { const o = e.list[e.n++]; o.type = type; o.x = x; o.y = y } }

// Presses from the input layer. Only the press counts: holding a button never
// repeats it (the keyboard's own auto-repeat is filtered out before this).
export function pressJump(s) { s.p.jumpBuf = TIMING.jumpBuffer }
export function pressSlide(s) { s.p.slideBuf = TIMING.slideBuffer }

const overlap = (ax, ay, aw, ah, b) => ax < b.x + b.w - EPS && ax + aw > b.x + EPS && ay < b.y + b.h - EPS && ay + ah > b.y + EPS;
// Is there room to stand up here? (the standing box against everything solid above)
function headRoom(s) {
  const p = s.p, L = s.level, top = p.y - PLAYER.h;
  for (const b of near(s, 'solids', p.x)) if (overlap(p.x, top, p.w, PLAYER.h - 1, b)) return false;
  for (const b of near(s, 'lows', p.x)) if (overlap(p.x, top, p.w, PLAYER.h - 1, b)) return false;
  return true;
}
function setSlide(s, on) {
  const p = s.p;
  if (on && !p.sliding) { p.sliding = true; p.slideT = TIMING.slide; p.h = PLAYER.slideH; s.slidesMade++; emit(s, 'slide', p.x + p.w / 2, p.y) }
  else if (!on && p.sliding) { p.sliding = false; p.slideT = 0; p.h = PLAYER.h }
}

function hurt(s, x, y) {
  const p = s.p;
  if (p.inv > 0 || s.phase !== 'run') return false;
  if (p.boost > 0 || flying(p)) return false;   // turbo and the jetpack ride through anything that stings
  if (s.shield) { s.shield = false; s.absorbed++; p.inv = TIMING.invulnerable; emit(s, 'shieldHit', x, y); return true }
  s.hearts--; s.hits++; p.inv = TIMING.invulnerable; p.hurtT = TIMING.hurt;
  emit(s, 'hit', x, y);
  if (s.hearts <= 0) end(s, 'over');
  return true;
}
export const flying = p => p.jet > 0 || p.sinking;
function end(s, how) {
  if (s.phase !== 'run') return;       // whichever comes first wins; the other is never processed
  s.phase = how; s.endedBy = how; s.after = 0;
  emit(s, how, s.p.x, s.p.y);
}

function land(s, top) {
  const p = s.p;
  if (p.sinking) { p.sinking = false; p.inv = Math.max(p.inv, POWER.landSafe); emit(s, 'jetLand', p.x + p.w / 2, top) }
  p.y = top; if (p.vy > 420) { p.landT = TIMING.land; emit(s, 'land', p.x + p.w / 2, top) }
  p.vy = 0; p.ground = true; p.jumps = 0; p.coyote = 0; p.airT = 0;
}

export function step(s, dt = STEP) {
  s.events.n = 0;
  const p = s.p, L = s.level, W = s.world;
  if (s.phase === 'run') s.t += dt; else s.after += dt;
  p.jumpBuf = Math.max(0, p.jumpBuf - dt); p.slideBuf = Math.max(0, p.slideBuf - dt);
  p.inv = Math.max(0, p.inv - dt); p.hurtT = Math.max(0, p.hurtT - dt); p.landT = Math.max(0, p.landT - dt);
  p.doubleT = Math.max(0, p.doubleT - dt); p.bounceT = Math.max(0, p.bounceT - dt);
  const ended = s.phase !== 'run';
  // back at a checkpoint after a fall: a short moment standing still, presses wait
  const frozen = p.freeze > 0; if (frozen) { p.freeze = Math.max(0, p.freeze - dt); p.jumpBuf = 0; p.slideBuf = 0 }
  if (ended) { p.jumpBuf = 0; p.slideBuf = 0 }

  p.grabT = Math.max(0, p.grabT - dt);
  // --- jetpack: a press is a puff upwards; slides wait for the ground ---
  if (p.jet > 0) {
    if (p.jumpBuf > 0) { p.vy = Math.min(p.vy, -POWER.puff); p.jumpBuf = 0; s.jumpsMade++; emit(s, 'puff', p.x + p.w / 2, p.y) }
    p.slideBuf = 0;
  }
  // --- jump: on the ground (or just off it) a jump, in the air one more ---
  if (p.jumpBuf > 0 && !p.sinking) {
    const fromGround = p.ground || (p.coyote > 0 && p.jumps === 0);
    if (p.sliding && !headRoom(s)) { /* no room to stand: the press waits in the buffer */ }
    else if (fromGround) {
      setSlide(s, false);
      p.vy = -W.jump; p.jumps = 1; p.ground = false; p.coyote = 0; p.jumpBuf = 0; s.jumpsMade++;
      emit(s, 'jump', p.x + p.w / 2, p.y);
    } else if (!p.ground && p.jumps < 2) {
      p.vy = -W.double; p.jumps = 2; p.jumpBuf = 0; p.doubleT = 0.45; s.doublesMade++;
      emit(s, 'double', p.x + p.w / 2, p.y - p.h / 2);
    }
  }
  // --- slide: only on the ground, from a press, for a bounded time ---
  if (p.slideBuf > 0 && p.ground && !p.sliding && !flying(p)) { setSlide(s, true); p.slideBuf = 0 }
  if (p.sliding) {
    p.slideT = Math.max(0, p.slideT - dt);
    // the slide ends when its time is up — but never under a low ceiling
    if ((p.slideT <= 0 || !p.ground) && headRoom(s)) setSlide(s, false);
  }

  // --- horizontal: run forward; a wall stops the child (no damage), a low beam bumps ---
  if (p.boost > 0 && !ended) { p.boost = Math.max(0, p.boost - dt); if (p.boost === 0) emit(s, 'boostEnd', p.x + p.w / 2, p.y) }
  const speed = ended ? Math.max(0, p.vx - 520 * dt) : frozen ? 0 : W.speed * (p.boost > 0 ? POWER.boostSpeed : 1);
  p.vx = speed;
  const prevX = p.x;
  p.x += p.vx * dt; p.blocked = false; p.blockedBy = '';
  const top = () => p.y - p.h;
  for (const b of near(s, 'lows', p.x)) {
    if (!overlap(p.x, top(), p.w, p.h, b)) continue;
    // standing into a low beam: it costs a heart and ducks the child under it
    if (p.ground && !flying(p)) { hurt(s, b.x, b.y + b.h); setSlide(s, true); p.slideT = TIMING.slide }
    if (overlap(p.x, top(), p.w, p.h, b)) { p.x = Math.min(p.x, b.x - p.w); p.blocked = true }
  }
  for (const b of near(s, 'solids', p.x)) {
    if (!overlap(p.x, top(), p.w, p.h, b)) continue;
    // a step of a few pixels is walked up, anything higher is a wall
    if (p.ground && p.y - b.y <= 10 && headRoomAt(s, b.y)) { p.y = b.y; continue }
    if (prevX + p.w <= b.x + 2) { p.x = b.x - p.w; p.blocked = true; p.blockedBy = b.kind || '' }
  }

  // --- vertical: gravity, landing (sub-stepped so nothing is passed through) ---
  const wasGround = p.ground;
  if (p.jet > 0 && !ended) {
    // the pack: a soft spring towards the cruise height (critically damped, so it never bobs wildly)
    p.vy += (POWER.spring * (p.jetY - p.y) - POWER.damp * p.vy) * dt;
    p.vy = Math.max(-POWER.rise, Math.min(POWER.sink, p.vy));
    if (p.y < p.jetY - 200 && p.vy < 0) p.vy = 0;   // never out of the top of the view
    const before = Math.ceil(p.jet); p.jet = Math.max(0, p.jet - dt);
    if (p.jet === 0) { p.sinking = true; p.jumps = 2; emit(s, 'jetEnd', p.x + p.w / 2, p.y) }
    else if (Math.ceil(p.jet) !== before) emit(s, 'jetHum', p.x + p.w / 2, p.y);   // once a second: the engine sound goes on
  } else if (p.sinking) p.vy = Math.min(POWER.sink, p.vy + W.gravity * POWER.sinkGravity * dt);
  else p.vy = Math.min(W.maxFall, p.vy + W.gravity * dt);
  const dy = p.vy * dt, n = Math.max(1, Math.ceil(Math.abs(dy) / 8));
  p.ground = false;
  for (let i = 0; i < n; i++) {
    const prevBottom = p.y, prevTop = p.y - p.h;
    p.y += dy / n;
    let landed = false;
    if (p.vy >= 0) {
      for (const b of near(s, 'bounces', p.x)) if (prevBottom <= b.y + EPS && p.y >= b.y && p.x + p.w > b.x + 2 && p.x < b.x + b.w - 2) {
        // a bounce pad: always the same launch, and the double jump is back
        p.y = b.y; p.vy = -b.power; p.jumps = 1; p.ground = false; p.coyote = 0; p.bounceT = 0.4; s.bounces++;
        setSlide(s, false); emit(s, 'bounce', p.x + p.w / 2, b.y); landed = 'bounce'; break;
      }
      if (landed) break;
      for (const b of near(s, 'solids', p.x)) if (prevBottom <= b.y + EPS && p.y >= b.y && p.x + p.w > b.x + EPS && p.x < b.x + b.w - EPS) { land(s, b.y); landed = true; break }
      if (!landed) for (const b of near(s, 'oneway', p.x)) if (prevBottom <= b.y + EPS && p.y >= b.y && p.x + p.w > b.x + EPS && p.x < b.x + b.w - EPS) { land(s, b.y); landed = true; break }
      if (landed) break;
    } else {
      for (const b of near(s, 'solids', p.x)) if (prevTop >= b.y + b.h - EPS && p.y - p.h < b.y + b.h && p.x + p.w > b.x + EPS && p.x < b.x + b.w - EPS) { p.y = b.y + b.h + p.h; p.vy = 0; break }
      for (const b of near(s, 'lows', p.x)) if (prevTop >= b.y + b.h - EPS && p.y - p.h < b.y + b.h && p.x + p.w > b.x + EPS && p.x < b.x + b.w - EPS) { p.y = b.y + b.h + p.h; p.vy = 0; break }
    }
  }
  // still standing on something? (running on, the floor is checked just below the feet)
  if (!p.ground && p.vy >= 0 && p.jet <= 0 && supported(s)) { if (p.sinking) land(s, p.y); p.ground = true; p.vy = 0; p.jumps = 0 }
  if (wasGround && !p.ground && p.vy >= 0) p.coyote = TIMING.coyote;   // ran off an edge
  else if (!p.ground) {
    p.airT += dt;
    if (p.coyote > 0) { p.coyote = Math.max(0, p.coyote - dt); if (p.coyote === 0 && p.jumps === 0) p.jumps = 1 }   // too late for a ground jump: one air jump is left
  }

  if (s.phase === 'run') {
    // --- hazards ---
    const inset = 6;
    for (const h of near(s, 'hazards', p.x)) if (overlap(p.x + inset, p.y - p.h + inset, p.w - inset * 2, p.h - inset * 2, h)) { hurt(s, h.x + h.w / 2, h.y + h.h / 2); break }
    // --- stars ---
    const cx = p.x + p.w / 2, cy = p.y - p.h / 2;
    for (const i of near(s, 'stars', cx)) {
      if (s.got[i]) continue; const st = L.stars[i];
      if (Math.abs(st.x - cx) < p.w / 2 + 22 && Math.abs(st.y - cy) < p.h / 2 + 22) { s.got[i] = 1; s.stars++; emit(s, 'star', st.x, st.y) }
    }
    for (const i of near(s, 'shields', cx)) {
      if (s.gotShield[i]) continue; const sh = L.shields[i];
      if (Math.abs(sh.x - cx) < p.w / 2 + 26 && Math.abs(sh.y - cy) < p.h / 2 + 26) { s.gotShield[i] = 1; s.shield = true; emit(s, 'shield', sh.x, sh.y) }
    }
    for (const i of near(s, 'jetpacks', cx)) {
      if (s.gotJet[i]) continue; const it = L.jetpacks[i], r = POWER.reachJet;
      if (Math.abs(it.x - cx) < p.w / 2 + r && Math.abs(it.y - cy) < p.h / 2 + r) {
        s.gotJet[i] = 1; s.jetsTaken++; s.flights++;
        setSlide(s, false); p.jet = POWER.jet; p.jetY = it.cruise; p.sinking = false; p.ground = false; p.jumps = 2; p.grabT = .45; p.jumpBuf = 0;
        emit(s, 'jetpack', it.x, it.y);
      }
    }
    for (const i of near(s, 'energies', cx)) {
      if (s.gotEnergy[i]) continue; const it = L.energies[i], r = POWER.reachEnergy;
      if (Math.abs(it.x - cx) < p.w / 2 + r && Math.abs(it.y - cy) < p.h / 2 + r) { s.gotEnergy[i] = 1; s.energiesTaken++; p.boost = POWER.boost; emit(s, 'energy', it.x, it.y) }
    }
    // --- the high tower: missed the jetpack? after a moment against it, back to the checkpoint
    // before the jetpack to try again — no heart lost (a child is never stuck there) ---
    p.towerT = p.blocked && p.blockedBy === 'tower' ? p.towerT + dt : 0;
    if (p.towerT > POWER.towerRetry) { s.retries++; emit(s, 'retry', p.x, p.y); respawn(s) }
    // --- checkpoints: the last one passed is where a fall starts again ---
    for (const c of L.cps) if (c.x <= p.x && c.x > s.cp.x) { s.cp.x = c.x; s.cp.y = c.y }
    // --- falling out of the world ---
    if (p.y > L.killY) {
      s.hearts--; s.falls++; emit(s, 'fall', p.x, L.killY);
      if (s.hearts <= 0) end(s, 'over');
      else respawn(s);
    }
    if (p.x >= L.finish) end(s, 'finish');
  } else if (p.y > L.killY) { p.y = L.killY; p.vy = 0 }
}

function headRoomAt(s, feet) { const p = s.p; for (const b of near(s, 'solids', p.x)) if (overlap(p.x, feet - p.h, p.w, p.h - 1, b) && b.y < feet - EPS) return false; return true }
function supported(s) {
  const p = s.p, y = p.y;
  for (const b of near(s, 'solids', p.x)) if (Math.abs(b.y - y) < 0.5 && p.x + p.w > b.x + EPS && p.x < b.x + b.w - EPS) return true;
  for (const b of near(s, 'oneway', p.x)) if (Math.abs(b.y - y) < 0.5 && p.x + p.w > b.x + EPS && p.x < b.x + b.w - EPS) return true;
  return false;
}
function respawn(s) {
  const p = s.p;
  if (p.boost > 0) emit(s, 'boostEnd', p.x, p.y);
  p.jet = 0; p.sinking = false; p.boost = 0; p.towerT = 0; p.grabT = 0;
  // the power-ups ahead of the checkpoint lie there again
  (s.level.jetpacks || []).forEach((it, i) => { if (it.x > s.cp.x) s.gotJet[i] = 0 });
  (s.level.energies || []).forEach((it, i) => { if (it.x > s.cp.x) s.gotEnergy[i] = 0 });
  p.x = s.cp.x; p.y = s.cp.y; p.vy = 0; p.ground = true; p.jumps = 0; p.coyote = 0; p.jumpBuf = 0; p.slideBuf = 0;
  setSlide(s, false); p.inv = TIMING.respawnInvulnerable; p.hurtT = 0; p.freeze = TIMING.respawnFreeze; p.vx = 0;
  emit(s, 'respawn', p.x, p.y);
}

// Points: every star counts, a finish counts more, and every heart kept on top.
export function score(s) { return s.stars * 10 + (s.endedBy === 'finish' ? 100 + s.hearts * 50 : 0) }

// Which animation state the child is in (the renderer turns it into a frame).
export function pose(s) {
  const p = s.p;
  if (s.phase === 'finish' && p.ground && p.vx < 60) return 'celebrate';
  if (p.hurtT > 0) return 'hurt';
  if (p.sliding) return 'slide';
  if (flying(p)) return p.grabT > 0 ? 'grab' : 'fly';
  if (!p.ground) { if (p.doubleT > 0) return 'doubleJump'; return p.vy < -60 ? 'jump' : 'fall' }
  if (p.landT > 0) return 'land';
  if (p.vx < 1) return 'idle';
  return 'run';
}

// A plain copy of the moving parts, for the solver's backtracking.
export function snapshot(s) { return { p: { ...s.p }, phase: s.phase, t: s.t, after: s.after, hearts: s.hearts, stars: s.stars, got: s.got.slice(), shield: s.shield, gotShield: s.gotShield.slice(), absorbed: s.absorbed, gotJet: s.gotJet.slice(), gotEnergy: s.gotEnergy.slice(), jetsTaken: s.jetsTaken, energiesTaken: s.energiesTaken, flights: s.flights, retries: s.retries, hits: s.hits, falls: s.falls, cp: { ...s.cp }, endedBy: s.endedBy, jumpsMade: s.jumpsMade, doublesMade: s.doublesMade, slidesMade: s.slidesMade, bounces: s.bounces } }
export function restore(s, snap) { Object.assign(s.p, snap.p); s.phase = snap.phase; s.t = snap.t; s.after = snap.after; s.hearts = snap.hearts; s.stars = snap.stars; s.got.set(snap.got); s.shield = snap.shield; s.gotShield.set(snap.gotShield); s.absorbed = snap.absorbed; s.gotJet.set(snap.gotJet); s.gotEnergy.set(snap.gotEnergy); s.jetsTaken = snap.jetsTaken; s.energiesTaken = snap.energiesTaken; s.flights = snap.flights; s.retries = snap.retries; s.hits = snap.hits; s.falls = snap.falls; s.cp = { ...snap.cp }; s.endedBy = snap.endedBy; s.jumpsMade = snap.jumpsMade; s.doublesMade = snap.doublesMade; s.slidesMade = snap.slidesMade; s.bounces = snap.bounces }
