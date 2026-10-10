// Mike & Mia: Jump & Slide — the three worlds: their physics, their look, and
// their level. One builder makes every level out of the same pieces (floors,
// gaps, crates, hazards, low beams, platforms, bounce pads, stars), so the
// engine never needs to know which world it is in.
//
// Every level follows the same fixed rhythm (no randomness):
//   0–5 s  a safe start         5–15 s easy jumps and stars
//   15–25 s double jumps and slides   25–35 s mixed combinations
//   35–40 s a clear run-up and the finish
// Gap widths are worked out from each world's own jump (single = how far one
// jump carries), so a tuned world never gets a gap its physics cannot clear.
// tests/jump.test.js drives the real engine through every level to prove it.

const DEPTH = 900;   // floors reach far down, so the bottom of the screen is never empty

export const WORLDS = {
  underwater: {
    id: 'underwater', speed: 330, gravity: 2700, jump: 980, double: 900, maxFall: 1500, bounce: 1350,
    music: 'earth', title: 'jump.world.underwater',
    colors: { skyTop: '#0b5d8f', skyBottom: '#38c6d9', far: '#1785a8', mid: '#0f6b8c', floorTop: '#5d6f8f', floor: '#384a6b', floorEdge: '#ffd166', crate: '#8a5a33', crateEdge: '#f0b35c', glass: 'rgba(210,250,255,.22)', rib: '#2e5a78', low: '#3b6386', lowGlow: '#ffd36b', hazard: '#7b3fa0', star: '#ffd23f', accent: '#7ff0ff' }
  },
  candy: {
    id: 'candy', speed: 340, gravity: 2700, jump: 980, double: 900, maxFall: 1500, bounce: 1350,
    music: 'play', title: 'jump.world.candy',
    colors: { skyTop: '#ffb5d8', skyBottom: '#fff0c9', far: '#f7c6e6', mid: '#c9b6ff', floorTop: '#ff86b8', floor: '#d99a5b', floorEdge: '#fff4fb', crate: '#5cc8ff', crateEdge: '#ffffff', glass: 'rgba(255,255,255,.3)', rib: '#ff9ccf', low: '#ff6fa8', lowGlow: '#ffffff', hazard: '#7e57ff', star: '#ffd23f', accent: '#ff5fa2' }
  },
  space: {
    id: 'space', speed: 320, gravity: 2000, jump: 860, double: 790, maxFall: 1150, bounce: 1200,
    music: 'space', title: 'jump.world.space',
    colors: { skyTop: '#0b0b2e', skyBottom: '#3a1f72', far: '#2b2468', mid: '#4a2d8a', floorTop: '#5b5f7a', floor: '#2e3048', floorEdge: '#33e1ff', crate: '#46506e', crateEdge: '#33e1ff', glass: 'rgba(120,200,255,.2)', rib: '#5d4aa8', low: '#3d4466', lowGlow: '#ff9f43', hazard: '#d14cff', star: '#ffd23f', accent: '#33e1ff' }
  }
};
export const WORLD_ORDER = ['underwater', 'candy', 'space'];

// How far one jump carries on flat ground, in world units.
export const reach = W => W.speed * 2 * W.jump / W.gravity;

function builder(W) {
  const L = { world: W.id, solids: [], oneway: [], lows: [], hazards: [], bounces: [], stars: [], cps: [], deco: [], hints: [], start: { x: 150, y: 0 }, finish: 0, killY: 0, end: 0 };
  let x = 0, fy = 0;
  const one = reach(W);
  // The centre of the child over one jump from (x0, floor y0): the real
  // physics, sampled. `dbl` = the second press, in seconds after the first.
  const path = (x0, y0, { dbl = null, power = W.jump, until = 0 } = {}) => {
    const pts = []; let t = 0, y = 0, vy = -power, used = false; const dt = 1 / 120;
    while (t < 3) {
      if (dbl !== null && !used && t >= dbl) { vy = -W.double; used = true }
      vy = Math.min(W.maxFall, vy + W.gravity * dt); y += vy * dt; t += dt;
      pts.push({ x: x0 + W.speed * t, y: y0 + y - 44 });
      if (vy > 0 && y >= until) break;
    }
    return pts;
  };
  const B = {
    W, L, one,
    get x() { return x }, get fy() { return fy },
    easy: Math.round(one * .55), mid: Math.round(one * .78), wide: Math.round(one + 105),
    floor(len, kind = 'floor') { L.solids.push({ x, y: fy, w: len, h: DEPTH, kind }); const s = x; x += len; return s },
    gap(len, dy = 0) { const s = x; x += len; fy += dy; return s },
    step(dy) { fy += dy },   // the next floor starts higher (a wall to jump up) or lower
    // a low deck you can jump through from below, over a safe lower floor
    deck(len, holes, drop = 140, kind = 'deck') {
      const s = x; L.solids.push({ x: s, y: fy + drop, w: len, h: DEPTH, kind: 'lowerFloor' });
      let px = s;
      for (const [hx, hw] of holes) { L.oneway.push({ x: px, y: fy, w: s + hx - px, h: 24, kind }); px = s + hx + hw }
      L.oneway.push({ x: px, y: fy, w: s + len - px, h: 24, kind });
      x += len; return s;
    },
    crate(ax, w = 64, h = 56, kind = 'crate') { L.solids.push({ x: ax, y: fy - h, w, h, kind }) },
    block(ax, y, w, h, kind = 'block') { L.solids.push({ x: ax, y, w, h, kind }) },
    hazard(ax, kind = 'hazard', w = 44, h = 38, lift = 0) { L.hazards.push({ x: ax, y: fy - h - lift, w, h, kind }) },
    // a low beam to slide under: open below `gap`, closed far above the jump
    low(ax, w, kind = 'low', gap = 64) { L.lows.push({ x: ax, y: fy - 520, w, h: 520 - gap, kind }) },
    plat(ax, dy, w, kind = 'plat') { L.oneway.push({ x: ax, y: fy + dy, w, h: 24, kind }) },
    pad(ax, w = 92, kind = 'pad') { L.bounces.push({ x: ax, y: fy, w, h: 26, power: W.bounce, kind }) },
    cp(ax, y = fy) { L.cps.push({ x: ax, y }) },
    hint(ax, kind) { L.hints.push({ x: ax, kind }) },
    deco(ax, kind, y = fy) { L.deco.push({ x: ax, y, kind }) },
    star(sx, sy) { L.stars.push({ x: Math.round(sx), y: Math.round(sy) }) },
    // stars in a row at running height (or `dy` above the floor)
    line(x0, x1, n, dy = -44) { for (let i = 0; i < n; i++) B.star(x0 + (x1 - x0) * (n === 1 ? .5 : i / (n - 1)), fy + dy) },
    // stars on the arc of a jump that takes off at x0 (the child's middle), from floor y0
    arc(x0, n, opts = {}) {
      const y0 = opts.y0 ?? fy, pts = path(x0, y0, opts), a = Math.round(pts.length * (opts.from ?? .12)), b = Math.round(pts.length * (opts.to ?? .88));
      for (let i = 0; i < n; i++) { const p = pts[Math.round(a + (b - a) * (n === 1 ? .5 : i / (n - 1)))]; B.star(p.x, p.y) }
    },
    finish(at) { L.finish = at; L.deco.push({ x: at, y: fy, kind: 'finish' }) },
    done() {
      L.end = x; L.killY = Math.max(...L.solids.map(s => s.y)) + 380;
      L.solids.sort((a, b) => a.x - b.x); L.oneway.sort((a, b) => a.x - b.x); L.stars.sort((a, b) => a.x - b.x);
      return L;
    }
  };
  return B;
}

// ---------------------------------------------------------------- Onderwaterwereld
// The reference level: a dry glass tunnel through the sea.
function underwater() {
  const b = builder(WORLDS.underwater), W = b.W, v = W.speed;
  b.cp(150);
  // 0–5 s: the tunnel opens, a row of stars to run through
  b.floor(2300); b.line(700, 1450, 6);
  // 5–15 s: easy jumps
  b.hint(1560, 'jump'); b.crate(1820); b.arc(1700, 5);
  b.gap(b.easy); b.arc(2300 - 70, 4);
  let s = b.floor(900); b.hazard(s + 380, 'urchin'); b.arc(s + 260, 5);
  b.step(-90); b.cp(s + 120, 0);
  s = b.floor(720); b.arc(s - 120, 4, { y0: 0, until: -90 }); b.line(s + 200, s + 600, 4);   // up a step
  b.gap(b.easy, 90); b.arc(s + 720 - 70, 3, { y0: -90, until: 90 });
  s = b.floor(1150); b.crate(s + 380, 64, 56); b.arc(s + 260, 5); b.crate(s + 800, 96, 56); b.arc(s + 680, 5);
  b.cp(s + 150);
  // 15–25 s: the double jump and the slide
  b.hint(s + 1150 - 380, 'double');
  b.gap(b.wide); b.arc(s + 1150 - 60, 7, { dbl: .3, to: .92 });
  s = b.floor(950); b.cp(s + 60); b.hint(s + 230, 'slide'); b.low(s + 520, 170, 'arch'); b.line(s + 530, s + 670, 3, -26);
  // the deck: openings to jump, a safe tunnel floor below them
  s = b.deck(1150, [[330, 150], [700, 150]]); b.cp(s + 60); b.arc(s + 330 - 90, 4); b.arc(s + 700 - 90, 4);
  b.deco(s, 'deckDown', b.fy); b.deco(s + 1150, 'deckUp', b.fy);
  s = b.floor(1000); b.low(s + 300, 170, 'arch'); b.line(s + 310, s + 450, 3, -26);
  b.hazard(s + 820, 'urchin'); b.plat(s + 700, -140, 300); b.arc(s + 640, 5, { until: -140, to: .99 });
  // 25–35 s: everything together
  s = b.floor(1200); b.cp(s + 40); b.crate(s + 260, 64, 56); b.arc(s + 140, 4); b.low(s + 680, 170, 'arch'); b.line(s + 690, s + 830, 3, -26);
  b.gap(b.easy); b.arc(s + 1200 - 70, 4);
  s = b.floor(700); b.hazard(s + 330, 'urchin'); b.arc(s + 210, 4);
  b.gap(b.wide, -60); b.arc(s + 700 - 60, 7, { y0: 0, dbl: .3, until: -60, to: .95 });
  s = b.floor(900); b.cp(s + 80); b.low(s + 400, 180, 'arch'); b.line(s + 410, s + 560, 3, -26);
  b.gap(b.mid, 60); b.arc(s + 900 - 60, 5, { y0: -60, until: 60 });
  s = b.floor(700); b.hazard(s + 220, 'urchin'); b.arc(s + 100, 4); b.hazard(s + 520, 'urchin'); b.arc(s + 400, 4);
  // 35–40 s: run-up and the finish
  s = b.floor(2100); b.cp(s + 60); b.line(s + 200, s + 1000, 6);
  b.finish(s + 900);
  return b.done();
}

// ---------------------------------------------------------------- Snoep & Speelgoed
// Toy blocks and frosted cake, jelly bounce pads, toy passages to slide under.
function candy() {
  const b = builder(WORLDS.candy), W = b.W;
  b.cp(150);
  b.floor(2300, 'cake'); b.line(700, 1450, 6);
  // 5–15 s
  b.hint(1560, 'jump'); b.crate(1820, 64, 60, 'toy'); b.arc(1700, 5);
  b.gap(b.easy); b.arc(2300 - 70, 4);
  let s = b.floor(1500, 'cake'); b.cp(s + 60); b.hint(s + 200, 'pad');
  // a jelly pad: it bounces you by itself; a star trail shows the arc, and a high cake ledge with stars
  b.pad(s + 420); b.arc(s + 400, 7, { power: W.bounce, until: 0, to: .9 });
  b.plat(s + 760, -280, 360, 'frosting'); b.line(s + 800, s + 1080, 4, -280 - 44);
  b.hazard(s + 1180, 'gummy'); b.arc(s + 1060, 4);
  b.step(-100);
  s = b.floor(800, 'cake'); b.arc(s - 120, 4, { y0: 0, until: -100 }); b.line(s + 250, s + 600, 3);
  b.gap(b.easy, 100); b.arc(s + 800 - 70, 3, { y0: -100, until: 100 });
  s = b.floor(1000, 'cake'); b.cp(s + 80); b.crate(s + 400, 96, 60, 'toy'); b.arc(s + 280, 5);
  // 15–25 s: double jump, toy passage, bounce + double
  b.hint(s + 1000 - 380, 'double');
  b.gap(b.wide); b.arc(s + 1000 - 60, 7, { dbl: .3, to: .92 });
  s = b.floor(1100, 'cake'); b.cp(s + 60); b.hint(s + 230, 'slide'); b.low(s + 520, 170, 'toybar'); b.line(s + 530, s + 670, 3, -26);
  // the pad at the end of the cake throws you up; the jelly gives the double jump back for the far side
  b.pad(s + 1100 - 92); b.gap(330); b.arc(s + 1100 - 92, 6, { power: W.bounce, dbl: .5, to: .95 });
  s = b.floor(1000, 'cake'); b.cp(s + 120); b.hazard(s + 420, 'gummy'); b.arc(s + 300, 4);
  b.low(s + 720, 170, 'toybar'); b.line(s + 730, s + 870, 3, -26);
  // 25–35 s
  b.gap(b.easy); b.arc(s + 1000 - 70, 4);
  s = b.floor(1250, 'cake'); b.cp(s + 40); b.crate(s + 250, 64, 60, 'toy'); b.arc(s + 130, 4);
  b.pad(s + 640); b.plat(s + 900, -260, 320, 'frosting'); b.line(s + 940, s + 1180, 4, -260 - 44); b.arc(s + 620, 6, { power: W.bounce, until: 0, to: .9 });
  b.gap(b.wide, -60); b.arc(s + 1250 - 60, 7, { y0: 0, dbl: .3, until: -60, to: .95 });
  s = b.floor(1100, 'cake'); b.cp(s + 80); b.low(s + 400, 180, 'toybar'); b.line(s + 410, s + 560, 3, -26);
  b.hazard(s + 850, 'gummy'); b.arc(s + 730, 4);
  b.gap(b.mid, 60); b.arc(s + 1100 - 60, 5, { y0: -60, until: 60 });
  s = b.floor(900, 'cake'); b.cp(s + 80); b.crate(s + 260, 64, 60, 'toy'); b.arc(s + 140, 4); b.hazard(s + 620, 'gummy'); b.arc(s + 500, 4);
  b.gap(b.easy); b.arc(s + 900 - 70, 4);
  s = b.floor(2300, 'cake'); b.cp(s + 120); b.line(s + 300, s + 1100, 6);
  b.finish(s + 1200);
  return b.done();
}

// ---------------------------------------------------------------- Ruimte
// Floating rocks with glowing edges, lighter gravity: longer, floatier jumps.
function space() {
  const b = builder(WORLDS.space), W = b.W;
  b.cp(150);
  b.floor(2200, 'rock'); b.line(650, 1400, 6);
  // 5–15 s: rock to rock
  b.hint(1500, 'jump'); b.hazard(1760, 'crystal', 40, 46); b.arc(1640, 5);
  b.gap(b.easy); b.arc(2200 - 70, 4);
  let s = b.floor(700, 'rock'); b.gap(b.easy); b.arc(s + 700 - 70, 4);
  s = b.floor(450, 'rock'); b.cp(s + 80); b.step(-110);
  s = b.floor(800, 'rock'); b.arc(s - 130, 4, { y0: 0, until: -110 }); b.hazard(s + 420, 'crystal', 40, 46); b.arc(s + 300, 4);
  b.gap(b.mid, 110); b.arc(s + 800 - 70, 4, { y0: -110, until: 110 });
  s = b.floor(850, 'rock'); b.cp(s + 80); b.crate(s + 380, 72, 56, 'module'); b.arc(s + 260, 5);
  // 15–25 s
  b.hint(s + 850 - 380, 'double');
  b.gap(b.wide); b.arc(s + 850 - 60, 7, { dbl: .3, to: .92 });
  s = b.floor(1100, 'rock'); b.cp(s + 60); b.hint(s + 230, 'slide'); b.low(s + 520, 170, 'beam'); b.line(s + 530, s + 670, 3, -26);
  b.gap(b.easy); b.arc(s + 1100 - 70, 4);
  s = b.floor(500, 'rock'); b.plat(s + 380, -170, 260, 'float'); b.arc(s + 330, 4, { until: -170, to: .99 });
  b.gap(b.mid); b.arc(s + 500 - 60, 4);
  s = b.floor(1000, 'rock'); b.cp(s + 80); b.low(s + 300, 170, 'beam'); b.line(s + 310, s + 450, 3, -26);
  b.hazard(s + 760, 'crystal', 40, 46); b.arc(s + 640, 4);
  // 25–35 s
  b.gap(b.easy); b.arc(s + 1000 - 70, 4);
  s = b.floor(1200, 'rock'); b.cp(s + 40); b.crate(s + 240, 72, 56, 'module'); b.arc(s + 120, 4); b.low(s + 700, 170, 'beam'); b.line(s + 710, s + 850, 3, -26);
  b.gap(b.wide, -60); b.arc(s + 1200 - 60, 7, { y0: 0, dbl: .3, until: -60, to: .95 });
  s = b.floor(900, 'rock'); b.cp(s + 80); b.hazard(s + 380, 'crystal', 40, 46); b.arc(s + 260, 4);
  b.gap(b.mid, 60); b.arc(s + 900 - 60, 5, { y0: -60, until: 60 });
  s = b.floor(800, 'rock'); b.low(s + 260, 180, 'beam'); b.line(s + 270, s + 420, 3, -26); b.hazard(s + 640, 'crystal', 40, 46); b.arc(s + 520, 4);
  s = b.floor(1700, 'rock'); b.cp(s + 60); b.line(s + 200, s + 800, 5);
  b.finish(s + 700);
  return b.done();
}

const BUILT = {};
export function level(id) { return BUILT[id] ||= ({ underwater, candy, space })[id](); }
