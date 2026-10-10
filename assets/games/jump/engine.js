// Mike & Mia: Jump & Slide — the simulation. No DOM, no clock, no randomness:
// the same inputs on the same level always give the same run, which is what
// lets tests/jump.test.js prove every level can be finished.
//
// World units are pixels of a 540-high design view; y grows downwards and the
// player's (x, y) is the left edge and the soles of the feet. The game steps it
// at a fixed 120 Hz (STEP); input arrives as presses between steps.
export const STEP = 1 / 120;
export const PLAYER = { w: 40, h: 88, slideH: 40 };   // one hitbox for both children, whatever the pose, hair or backpack
export const TIMING = { coyote: 0.09, jumpBuffer: 0.1, slideBuffer: 0.12, slide: 0.62, invulnerable: 1.3, respawnInvulnerable: 1.6, hurt: 0.35, land: 0.12 };
export const HEARTS = 3;
const EPS = 0.01;
// The level split into 256-wide columns, so a step only looks at what is near
// the child (built once per level; an object is in every column it reaches, plus a margin).
const CELL = 256, KINDS = ['solids', 'oneway', 'lows', 'hazards', 'bounces', 'stars'];
function grid(L) {
  if (L._grid) return L._grid;
  const g = {};
  for (const k of KINDS) {
    const cols = [];
    L[k].forEach((o, i) => {
      const w = o.w || 0, a = Math.max(0, Math.floor((o.x - 64) / CELL)), b = Math.max(0, Math.floor((o.x + w + 64) / CELL));
      for (let c = a; c <= b; c++) (cols[c] ||= []).push(k === 'stars' ? i : o);
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
  const p = { x: level.start.x, y: level.start.y, vx: world.speed, vy: 0, w: PLAYER.w, h: PLAYER.h, ground: true, jumps: 0, coyote: 0, jumpBuf: 0, slideBuf: 0, sliding: false, slideT: 0, inv: 0, hurtT: 0, landT: 0, airT: 0, blocked: false, doubleT: 0, bounceT: 0 };
  const events = { n: 0, list: Array.from({ length: 48 }, () => ({ type: '', x: 0, y: 0 })) };
  return {
    level, world, p, events, grid: grid(level),
    phase: 'run',          // run → finish | over; the two ends can never both happen
    t: 0,                  // active play time (only while running)
    after: 0,              // time since the finish or the game over
    hearts: HEARTS, stars: 0, got: new Uint8Array(level.stars.length),
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
  s.hearts--; s.hits++; p.inv = TIMING.invulnerable; p.hurtT = TIMING.hurt;
  emit(s, 'hit', x, y);
  if (s.hearts <= 0) end(s, 'over');
  return true;
}
function end(s, how) {
  if (s.phase !== 'run') return;       // whichever comes first wins; the other is never processed
  s.phase = how; s.endedBy = how; s.after = 0;
  emit(s, how, s.p.x, s.p.y);
}

function land(s, top) {
  const p = s.p;
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
  if (ended) { p.jumpBuf = 0; p.slideBuf = 0 }

  // --- jump: on the ground (or just off it) a jump, in the air one more ---
  if (p.jumpBuf > 0) {
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
  if (p.slideBuf > 0 && p.ground && !p.sliding) { setSlide(s, true); p.slideBuf = 0 }
  if (p.sliding) {
    p.slideT = Math.max(0, p.slideT - dt);
    // the slide ends when its time is up — but never under a low ceiling
    if ((p.slideT <= 0 || !p.ground) && headRoom(s)) setSlide(s, false);
  }

  // --- horizontal: run forward; a wall stops the child (no damage), a low beam bumps ---
  const speed = ended ? Math.max(0, p.vx - 520 * dt) : W.speed;
  p.vx = speed;
  const prevX = p.x;
  p.x += p.vx * dt; p.blocked = false;
  const top = () => p.y - p.h;
  for (const b of near(s, 'lows', p.x)) {
    if (!overlap(p.x, top(), p.w, p.h, b)) continue;
    // standing into a low beam: it costs a heart and ducks the child under it
    if (p.ground) { hurt(s, b.x, b.y + b.h); setSlide(s, true); p.slideT = TIMING.slide }
    if (overlap(p.x, top(), p.w, p.h, b)) { p.x = Math.min(p.x, b.x - p.w); p.blocked = true }
  }
  for (const b of near(s, 'solids', p.x)) {
    if (!overlap(p.x, top(), p.w, p.h, b)) continue;
    // a step of a few pixels is walked up, anything higher is a wall
    if (p.ground && p.y - b.y <= 10 && headRoomAt(s, b.y)) { p.y = b.y; continue }
    if (prevX + p.w <= b.x + 2) { p.x = b.x - p.w; p.blocked = true }
  }

  // --- vertical: gravity, landing (sub-stepped so nothing is passed through) ---
  const wasGround = p.ground;
  p.vy = Math.min(W.maxFall, p.vy + W.gravity * dt);
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
  if (!p.ground && p.vy >= 0 && supported(s)) { p.ground = true; p.vy = 0; p.jumps = 0 }
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
  p.x = s.cp.x; p.y = s.cp.y; p.vy = 0; p.ground = true; p.jumps = 0; p.coyote = 0; p.jumpBuf = 0; p.slideBuf = 0;
  setSlide(s, false); p.inv = TIMING.respawnInvulnerable; p.hurtT = 0;
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
  if (!p.ground) { if (p.doubleT > 0) return 'doubleJump'; return p.vy < -60 ? 'jump' : 'fall' }
  if (p.landT > 0) return 'land';
  if (p.vx < 1) return 'idle';
  return 'run';
}

// A plain copy of the moving parts, for the solver's backtracking.
export function snapshot(s) { return { p: { ...s.p }, phase: s.phase, t: s.t, after: s.after, hearts: s.hearts, stars: s.stars, got: s.got.slice(), hits: s.hits, falls: s.falls, cp: { ...s.cp }, endedBy: s.endedBy, jumpsMade: s.jumpsMade, doublesMade: s.doublesMade, slidesMade: s.slidesMade, bounces: s.bounces } }
export function restore(s, snap) { Object.assign(s.p, snap.p); s.phase = snap.phase; s.t = snap.t; s.after = snap.after; s.hearts = snap.hearts; s.stars = snap.stars; s.got.set(snap.got); s.hits = snap.hits; s.falls = snap.falls; s.cp = { ...snap.cp }; s.endedBy = snap.endedBy; s.jumpsMade = snap.jumpsMade; s.doublesMade = snap.doublesMade; s.slidesMade = snap.slidesMade; s.bounces = snap.bounces }
