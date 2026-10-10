// Mike & Mia: Jump & Slide — drawing. Everything on one canvas: the world's
// soft background layers (parallax), the level (crisp, high-contrast
// foreground), the child, and a small pool of effects. The renderer only reads
// the run; it never changes it.
//
// Scale: the world is scaled by the height of the screen, but never so far that
// fewer than MIN_VIEW world units are visible ahead — a phone held upright sees
// the same distance to the next obstacle as a wide screen.
import { PLAYER, POWER, pose } from './engine.js';

const LAYERS = [['far', .2], ['mid', .5]];   // background layers and how fast they move
const DESIGN_H = 540, MIN_VIEW = 760, LOOK = 0.25;   // the child stands at 25% from the left
// portrait (a phone held upright): a closer view so the children and the world are bigger
// (Stefan, 2026-10-10: "too small"); the child stands further left so about 1.2 s of the
// track still shows ahead (about 400 world units instead of 570)
const MIN_VIEW_TALL = 470, LOOK_TALL = 0.14;
const VISUAL_H = 112;                                // the drawn child, standing (hair included), in world units
const POOL = 96;

export function createRenderer(canvas, { level, world, sprites, hero, art = null, reducedMotion = false }) {
  const g = canvas.getContext('2d', { alpha: false });
  const C = world.colors;
  let W = 1, H = 1, dpr = 1, scale = 1, look = LOOK, viewW = MIN_VIEW, viewH = DESIGN_H, groundY = 400;
  const cam = { x: 0, y: 0, ref: 0, init: false };
  let time = 0;
  // effects: one fixed pool, nothing allocated while playing
  const parts = Array.from({ length: POOL }, () => ({ on: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, color: '', rot: 0 }));
  const spawn = (kind, x, y, vx, vy, life, size, color) => {
    for (const p of parts) if (!p.on) { p.on = true; p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.max = life; p.size = size; p.color = color; p.rot = (x * 7 + y * 3) % 6.28; return p }
    return null;
  };
  const DUST = 1, RING = 2, SPARK = 3, MINISTAR = 4, CONFETTI = 5, POP = 6, FLAME = 7;
  let squash = 0, padHit = { x: -1, t: 0 }, hurtRing = 0;

  // A star, drawn once and stamped (a gradient glow plus the five points).
  const starSprite = document.createElement('canvas');
  const drawStarShape = (c, cx, cy, R, r) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) } c.closePath() };
  const makeStar = () => {
    const S = 96; starSprite.width = starSprite.height = S; const c = starSprite.getContext('2d');
    const glow = c.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2); glow.addColorStop(0, 'rgba(255,230,120,.75)'); glow.addColorStop(1, 'rgba(255,230,120,0)');
    c.fillStyle = glow; c.fillRect(0, 0, S, S);
    drawStarShape(c, S / 2, S / 2 + 2, 30, 13); c.fillStyle = '#e09a00'; c.fill();
    drawStarShape(c, S / 2, S / 2, 30, 13); const fill = c.createLinearGradient(0, 18, 0, 78); fill.addColorStop(0, '#fff3a6'); fill.addColorStop(.5, '#ffd23f'); fill.addColorStop(1, '#ffae00'); c.fillStyle = fill; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#fff8d6'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(S / 2 - 8, S / 2 - 9, 6, 3.5, -.6, 0, 7); c.fill();
  };
  makeStar();

  // Background layers are painted once per size into tiles and scrolled.
  const tiles = { far: document.createElement('canvas'), mid: document.createElement('canvas') };
  const TILE = 1600;   // world units per background tile
  let seedN = 1; const rnd = () => (seedN = (seedN * 16807) % 2147483647) / 2147483647;
  function paintTiles() {
    const k = scale * dpr, tw = Math.ceil(TILE * k * .5), th = Math.ceil(H * dpr * .75);   // half resolution, and half a screen of extra sky on top   // the far layers are soft: half resolution is plenty
    for (const name of ['far', 'mid']) {
      const t = tiles[name]; t.width = tw; t.height = th; const c = t.getContext('2d'); c.clearRect(0, 0, tw, th);
      c.setTransform(tw / TILE, 0, 0, th / (1.5 * H / scale), 0, th / 3);   // world units across, 1.5 view heights down, the view starting a third in
      seedN = name === 'far' ? 11 : 29;
      (BG[world.id] || BG.underwater)[name](c, TILE, H / scale, groundY / scale);
    }
  }
  const BG = {
    underwater: {
      far(c, w, h, gy) {
        // coral reef silhouettes and a sunken ship, soft and blue
        c.fillStyle = 'rgba(10,70,110,.55)';
        for (let i = 0; i < 9; i++) { const x = rnd() * w, r = 60 + rnd() * 110; c.beginPath(); c.ellipse(x, gy - 20, r, r * (.5 + rnd() * .5), 0, Math.PI, 0); c.fill() }
        c.fillStyle = 'rgba(20,60,90,.55)'; c.beginPath(); const sx = w * .55, sy = gy - 40;
        c.moveTo(sx - 260, sy); c.lineTo(sx - 200, sy - 120); c.lineTo(sx + 200, sy - 130); c.lineTo(sx + 280, sy - 10); c.closePath(); c.fill();
        c.fillRect(sx - 60, sy - 330, 14, 210); c.fillRect(sx + 80, sy - 290, 12, 170); c.fillRect(sx - 120, sy - 300, 260, 8);
        c.fillStyle = 'rgba(255,140,120,.35)';
        for (let i = 0; i < 14; i++) { const x = rnd() * w, hh = 30 + rnd() * 70; c.beginPath(); c.moveTo(x, gy - 10); c.quadraticCurveTo(x - 20, gy - hh, x + 5, gy - hh - 20); c.quadraticCurveTo(x + 25, gy - hh, x + 14, gy - 10); c.fill() }
      },
      mid(c, w, h, gy) {
        // the glass tunnel: ribs, a glass shine, and coral pressed against it
        for (let i = 0; i < 4; i++) {
          const x = i * w / 4 + 40;
          c.strokeStyle = 'rgba(40,90,120,.9)'; c.lineWidth = 26; c.beginPath(); c.moveTo(x, gy + 10); c.lineTo(x, gy - 330); c.quadraticCurveTo(x + 10, gy - 470, x + 200, gy - 520); c.stroke();
          c.strokeStyle = 'rgba(160,230,255,.35)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 7, gy + 10); c.lineTo(x - 7, gy - 330); c.stroke();
          c.fillStyle = 'rgba(255,214,107,.9)'; for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(x, gy - 90 - j * 110, 5, 0, 7); c.fill() }
        }
        c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(0, gy - 470); c.lineTo(w, gy - 520); c.lineTo(w, gy - 470); c.lineTo(0, gy - 420); c.fill();
        const pal = ['#ff7a8a', '#ffb347', '#c86bff', '#4fe3c1'];
        for (let i = 0; i < 18; i++) { const x = rnd() * w, r = 14 + rnd() * 26; c.fillStyle = pal[i % 4]; c.globalAlpha = .55; c.beginPath(); c.arc(x, gy - 6 - rnd() * 14, r, Math.PI, 0); c.fill() }
        c.globalAlpha = 1;
      }
    },
    candy: {
      far(c, w, h, gy) {
        // pastel toy-block towers and lollipops
        const pal = ['#ffd6ec', '#d9ccff', '#c8f1ff', '#fff1b8', '#ffc9b3'];
        for (let i = 0; i < 16; i++) { const x = rnd() * w, bw = 60 + rnd() * 80, bh = 80 + rnd() * 260; c.fillStyle = pal[i % 5]; c.fillRect(x, gy - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x + 6, gy - bh + 6, bw - 12, 10); c.fillStyle = pal[(i + 2) % 5]; c.beginPath(); c.moveTo(x - 6, gy - bh); c.lineTo(x + bw / 2, gy - bh - 50); c.lineTo(x + bw + 6, gy - bh); c.fill() }
        for (let i = 0; i < 5; i++) { const x = rnd() * w, y = gy - 160 - rnd() * 140; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x - 3, y, 6, gy - y); c.lineWidth = 9; for (let j = 0; j < 4; j++) { c.strokeStyle = j % 2 ? '#ff8fc4' : '#ffffff'; c.beginPath(); c.arc(x, y, 12 + j * 9, 0, 7); c.stroke() } }
      },
      mid(c, w, h, gy) {
        // gumdrop hills and clouds
        const pal = ['rgba(120,220,140,.7)', 'rgba(255,140,190,.7)', 'rgba(170,140,255,.7)', 'rgba(255,200,90,.7)'];
        for (let i = 0; i < 9; i++) { const x = rnd() * w, r = 50 + rnd() * 60; c.fillStyle = pal[i % 4]; c.beginPath(); c.ellipse(x, gy + 6, r, r * .9, 0, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x - r * .3, gy - r * .55, r * .2, r * .12, -.5, 0, 7); c.fill() }
        c.fillStyle = 'rgba(255,255,255,.85)';
        for (let i = 0; i < 6; i++) { const x = rnd() * w, y = 60 + rnd() * 160; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x + j * 34, y - (j % 2) * 14, 30, 0, 7); c.fill() } }
      }
    },
    space: {
      far(c, w, h, gy) {
        // stars, a ringed planet and a moon
        for (let i = 0; i < 300; i++) { const x = rnd() * w, y = rnd() * (gy + 200 + h * .5) - h * .5, r = rnd() < .9 ? .8 + rnd() * 1.2 : 2 + rnd() * 1.5; c.fillStyle = `rgba(255,255,255,${.35 + rnd() * .6})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill() }
        const neb = c.createRadialGradient(w * .3, gy - 300, 10, w * .3, gy - 300, 360); neb.addColorStop(0, 'rgba(200,90,255,.35)'); neb.addColorStop(1, 'rgba(200,90,255,0)'); c.fillStyle = neb; c.fillRect(0, 0, w, h);
        const px = w * .7, py = gy - 330, pr = 110, pg = c.createLinearGradient(px - pr, py - pr, px + pr, py + pr); pg.addColorStop(0, '#9b7bff'); pg.addColorStop(1, '#3b2a8f');
        c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill();
        c.strokeStyle = 'rgba(200,180,255,.7)'; c.lineWidth = 10; c.beginPath(); c.ellipse(px, py, pr * 1.7, pr * .35, -.25, 0, 7); c.stroke();
        c.fillStyle = '#7fb6ff'; c.beginPath(); c.arc(w * .15, gy - 400, 36, 0, 7); c.fill();
      },
      mid(c, w, h, gy) {
        // drifting asteroids and a distant station
        for (let i = 0; i < 12; i++) { const x = rnd() * w, y = gy - 120 - rnd() * 380, r = 14 + rnd() * 30; c.fillStyle = 'rgba(70,60,110,.85)'; c.beginPath(); for (let j = 0; j < 7; j++) { const a = j / 7 * 6.28, rr = r * (.75 + rnd() * .35); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) } c.fill() }
        c.fillStyle = 'rgba(150,170,230,.5)'; const sx = w * .45, sy = gy - 150;
        c.fillRect(sx - 6, sy - 160, 12, 160); c.fillRect(sx - 60, sy - 120, 120, 14); c.beginPath(); c.ellipse(sx, sy - 160, 70, 16, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(51,225,255,.8)'; for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(sx - 48 + j * 24, sy - 113, 3, 0, 7); c.fill() }
      }
    }
  };

  let sky = null;
  // reserve: CSS px at the bottom kept for the buttons (and the safe area)
  function resize(cssW, cssH, ratio, reserve = 110) {
    W = Math.max(1, cssW); H = Math.max(1, cssH); dpr = Math.min(2, ratio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    scale = Math.min(H / DESIGN_H, W / (H > W ? MIN_VIEW_TALL : MIN_VIEW));
    look = H > W ? LOOK_TALL : LOOK;
    viewW = W / scale; viewH = H / scale;
    // the floor line: low on the screen, but on a tall screen not so low that the play is squeezed to the top
    // the floor line: on a tall (portrait) screen just above the buttons, so the ground under
    // the feet is a thin band and the rest of the screen shows air and scenery; on a wide
    // screen as before.
    groundY = H > W ? H - Math.max(reserve, H * .12) : Math.min(H - Math.max(96, H * .18), 90 + 700 * scale);
    pic.bg = (H > W && pic.bgTall) ? pic.bgTall : pic.bgWide;
    sky = g.createLinearGradient(0, 0, 0, H * dpr); sky.addColorStop(0, C.skyTop); sky.addColorStop(1, C.skyBottom);
    paintTiles(); cam.init = false;
  }

  function camera(s, a, px, py) {
    const p = s.p;
    if (!cam.init) { cam.ref = p.y; cam.init = true }
    // follow the floor the child stands on; in the air only when climbing high or falling far
    // flying with the jetpack: the view keeps the floor it left (the line below lifts it only as far as the HUD needs)
    const target = p.ground ? p.y : (p.jet > 0 || p.sinking) ? cam.ref : Math.min(cam.ref + 140, Math.max(p.y, Math.min(cam.ref, p.y + 260)));
    cam.ref += (target - cam.ref) * Math.min(1, a * (p.ground ? 6 : 3));
    cam.x = px - viewW * look;
    // and never let the child rise under the HUD: the view lifts with a high jump
    cam.y = Math.min(cam.ref - groundY / scale, py - VISUAL_H - 78 / scale);
  }

  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255, m = v => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))); return `rgb(${m(r)},${m(gg)},${m(b)})` };
  const dark = { floor: shade(C.floor, -.25), floorTop: shade(C.floorTop, .2), crate: shade(C.crate, -.3), low: shade(C.low, -.3) };

  function roundRect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath() }

  // ---------- the art pack (tools/jump-art.cjs): a skin over the collision boxes ----------
  const A = n => art && art.images[n] ? { img: art.images[n], m: art.ART[n] } : null;
  const P = { underwater: 'uw', candy: 'cd', space: 'sp' }[world.id];
  const pic = { bgWide: A(P + '-bg'), bgTall: A(P + '-bg-tall'), urchin: A('uw-urchin'), crystals: A('sp-crystals'), plat: A(P + '-plat'), gate: A(P + '-gate'), crate: A('uw-crate'), crate2: A('uw-crate2'), rock: A('sp-rock'), pad: A('cd-pad'), windows: A('uw-windows'), star: (world.id === 'underwater' && A('star-uw')) || A('star'), shield: A('shield'), jetpack: A('jetpack'), energy: A('energy'), finish: A('finish'), blocks: ['cd-block-y', 'cd-block-c', 'cd-block-r'].map(A) };
  pic.bg = pic.bgWide;
  // a soft white glow behind the light-blue stars, so they stand out against the water
  let glow = null;
  if (world.id === 'underwater') { glow = document.createElement('canvas'); glow.width = glow.height = 64; const c = glow.getContext('2d'), gr = c.createRadialGradient(32, 32, 6, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64) }
  const SPARK_COL = world.id === 'underwater' ? '#a8ecff' : '#ffec8c';   // the star sparkle in the star's own colour
  // the band of a platform, its caps kept, its middle repeated to any width
  function slice(a, x, y, w, h) {
    const m = a.m, sl = m.slice, k = h / m.h;
    let cl = sl.capL * k, cr = sl.capR * k;
    if (cl + cr > w) { const q = w / (cl + cr); cl *= q; cr *= q }
    g.drawImage(a.img, 0, 0, sl.capL, m.h, x, y, cl, h);
    g.drawImage(a.img, m.w - sl.capR, 0, sl.capR, m.h, x + w - cr, y, cr, h);
    const tw = sl.midW * k; let xx = x + cl; const end = x + w - cr;
    // only the visible part is drawn: a long floor is thousands of units wide
    const from = Math.max(xx, visL - tw), to = Math.min(end, visR + tw);
    if (from > xx) xx += Math.floor((from - xx) / tw) * tw;
    for (; xx < to; xx += tw) { const part = Math.min(tw, end - xx); if (part <= 0) break; g.drawImage(a.img, sl.midX, 0, sl.midW * part / tw, m.h, xx, y, part + .5, h) }
  }
  const VEIL = { underwater: 'rgba(8,58,96,.2)', candy: 'rgba(255,244,250,.18)', space: 'rgba(12,8,44,.32)' };
  const BAND = { underwater: 40, candy: 48, space: 36 };
  const BODY = { underwater: ['#1d4f63', '#143a4b'], candy: ['#e8b06d', '#d99a5b'], space: ['#2e3048', '#23253a'] };
  function artFloor(b, x0, x1) {
    const left = Math.max(b.x, x0 - 10), right = Math.min(b.x + b.w, x1 + 10), bottom = Math.min(b.y + b.h, cam.y + viewH + 20), band = BAND[world.id];
    if (right <= left) return;
    // the body under the band, plain and darker, so the walking line stays the brightest thing
    const [c1, c2] = BODY[world.id], top = b.y + band * .7;
    g.fillStyle = c1; g.fillRect(left, top, right - left, bottom - top);
    g.fillStyle = c2;
    if (world.id === 'candy') for (let y = top + 34; y < bottom; y += 46) g.fillRect(left, y, right - left, 6);
    else if (world.id === 'space') for (let x = Math.ceil(left / 90) * 90; x < right; x += 90) { g.beginPath(); g.arc(x + 30, top + 50 + (x % 50), 12 + (x % 9), 0, 7); g.fill() }
    else for (let x = Math.ceil(left / 96) * 96; x < right; x += 96) g.fillRect(x, top, 4, bottom - top);
    // a soft edge where the floor ends at a gap
    g.fillStyle = 'rgba(0,0,0,.18)'; if (b.x >= left) g.fillRect(b.x, top, 6, bottom - top); if (b.x + b.w <= right) g.fillRect(b.x + b.w - 6, top, 6, bottom - top);
    slice(pic.plat, b.x - 4, b.y - 3, b.w + 8, band);
  }
  function artBlock(b) {
    if (b.kind === 'toy') {
      const n = Math.max(1, Math.round(b.w / 56)), w = b.w / n;
      for (let i = 0; i < n; i++) { const a = pic.blocks[(i + Math.round(b.x / 7)) % 3]; g.drawImage(a.img, b.x + i * w - 1, b.y - 2, w + 2, b.h + 2) }
      return;
    }
    if (b.kind === 'module') { g.drawImage(pic.rock.img, b.x - 10, b.y - 6, b.w + 20, b.h + 7); return }
    const a = b.w > 72 ? pic.crate2 : pic.crate; g.drawImage(a.img, b.x - 2, b.y - 2, b.w + 4, b.h + 3);
  }
  // The high tower (a jetpack is needed to pass it): the world's own blocks stacked high, a
  // beacon light on top so it reads as a landmark from far away.
  function drawTower(b) {
    const rows = 3, rh = b.h / rows;
    if (world.id === 'candy' && pic.blocks[0]) {
      const cols = Math.max(1, Math.round(b.w / 64)), bw = b.w / cols, n = Math.round(b.h / bw), bh = b.h / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < cols; i++) g.drawImage(pic.blocks[(i + j * 2) % 3].img, b.x + i * bw - 1, b.y + j * bh - 1, bw + 2, bh + 2);
    } else if (world.id === 'space' && pic.rock) {
      for (let i = 0; i < rows; i++) g.drawImage(pic.rock.img, b.x - 14 + (i % 2 ? 8 : -4), b.y + b.h - (i + 1) * rh - 8, b.w + 24, rh + 14);
    } else if (pic.crate) {
      for (let i = 0; i < rows; i++) { const a = i % 2 ? pic.crate : pic.crate2; g.drawImage(a.img, b.x - 4 + (i % 2 ? 6 : -4), b.y + b.h - (i + 1) * rh - 2, b.w + 8, rh + 4) }
    } else { for (let i = 0; i < rows; i++) drawBlock({ x: b.x, y: b.y + i * rh, w: b.w, h: rh, kind: 'crate' }) }
    const cx = b.x + b.w / 2, pulse = reducedMotion ? .7 : .55 + .35 * Math.sin(time * 4);
    g.fillStyle = C.accent; g.globalAlpha = pulse * .45; g.beginPath(); g.arc(cx, b.y - 14, 22, 0, 7); g.fill();
    g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, b.y - 14, 7, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - 3, b.y - 8, 6, 10);
  }
  function artOneway(b) { slice(pic.plat, b.x - 3, b.y - 3, b.w + 6, world.id === 'candy' ? 32 : 28) }
  function artLow(b) {
    const a = pic.gate, m = a.m, under = b.y + b.h, floor = b.floor ?? b.y + 520, gap = floor - under;
    const k = gap / (m.h - m.open), dh = m.h * k, dw = b.w + 56, top = floor - dh;
    // the part above the bar reaches up out of view: it is a wall, not something to jump over
    const colTop = Math.max(b.y, cam.y - 20), cx = b.x + 20, cw = b.w - 40;
    if (world.id === 'candy') {
      for (let y = top + m.open * k * .2 - 56, i = 0; y > colTop - 56; y -= 56, i++) { const blk = pic.blocks[i % 3]; g.drawImage(blk.img, cx + (i % 2) * 6, y, cw - 6, 58) }
    } else {
      g.fillStyle = world.id === 'space' ? '#3a3f63' : '#1f5a6e'; g.fillRect(cx, colTop, cw, top + 10 - colTop);
      g.fillStyle = world.id === 'space' ? '#33e1ff' : '#7ff0ff'; g.globalAlpha = .55; g.fillRect(cx + cw / 2 - 3, colTop, 6, top + 10 - colTop); g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(cx, colTop, 6, top + 10 - colTop); g.fillRect(cx + cw - 6, colTop, 6, top + 10 - colTop);
    }
    g.drawImage(a.img, b.x - 28, top, dw, dh);
  }
  function artPad(b) {
    const a = pic.pad, hit = padHit.x === b.x ? Math.max(0, padHit.t) : 0, sq = reducedMotion ? 0 : hit * Math.sin(hit * 30) * .22;
    const w = b.w + 24, h = w * a.m.h / a.m.w * (1 - sq);
    g.drawImage(a.img, b.x - 12, b.y + 8 - h, w, h);
  }
  // The finish gate in two layers: all of it behind the child, then its left pillar again in
  // front, so the child runs in behind the near pillar and comes out under the arch. Its feet
  // stand on the ground line; the opening (about 150 units) is well above the child (112).
  // the finish line is under the near pillar; the child slows down and stops under the middle of the arch
  const GATE_H = 236, GATE_FRONT = .27, GATE_SHIFT = 110;
  function artFinish(x, y) { const a = pic.finish, w = GATE_H * a.m.w / a.m.h; g.drawImage(a.img, x + GATE_SHIFT - w / 2, y - GATE_H + 2, w, GATE_H) }
  function artFinishFront(x, y) { const a = pic.finish, w = GATE_H * a.m.w / a.m.h, sw = a.m.w * GATE_FRONT; g.drawImage(a.img, 0, 0, sw, a.m.h, x + GATE_SHIFT - w / 2, y - GATE_H + 2, w * GATE_FRONT, GATE_H) }
  // the far layer: a portrait painting on a tall screen when the world has one, else the wide one
  function artBackground(lift) {
    const a = pic.bg, dh = canvas.height * 1.15, dw = a.m.w * dh / a.m.h, f = .15;
    const y = canvas.height - dh + Math.max(0, Math.min(dh - canvas.height, lift * scale * dpr * .15));
    let x = -((cam.x * f * scale * dpr) % (dw * 2));
    // mirror-tiled: every second copy is flipped, so each join meets the same edge
    for (let i = 0; x < canvas.width; i++, x += dw) {
      if (i % 2 === 0) g.drawImage(a.img, x, y, dw + 1, dh);
      else { g.save(); g.translate(x + dw, y); g.scale(-1, 1); g.drawImage(a.img, 0, 0, dw + 1, dh); g.restore() }
    }
    // a veil in the world's colour pushes the painting back, so platforms, stars and the child stand out
    g.fillStyle = VEIL[world.id]; g.fillRect(0, 0, canvas.width, canvas.height);
  }
  function artWindows(lift) {
    const a = pic.windows, gy = groundY * dpr, dh = gy * .96, dw = a.m.w * dh / a.m.h, f = .55;
    const y = gy - dh + 6 * dpr + lift * scale * dpr * .3;
    let x = -((cam.x * f * scale * dpr) % dw);
    for (; x < canvas.width; x += dw - 2) g.drawImage(a.img, x, y, dw, dh);
  }

  function drawFloor(b, x0, x1) {
    const left = Math.max(b.x, x0 - 10), right = Math.min(b.x + b.w, x1 + 10), bottom = Math.min(b.y + b.h, cam.y + viewH + 20);
    if (right <= left) return;
    const w = right - left, top = b.y;
    if (world.id === 'candy') {
      g.fillStyle = '#e8b06d'; g.fillRect(left, top + 14, w, bottom - top - 14);
      g.fillStyle = 'rgba(160,90,40,.25)'; for (let y = top + 50; y < bottom; y += 46) g.fillRect(left, y, w, 6);
      g.fillStyle = C.floorTop; roundRect(b.x, top - 4, b.w, 26, 10); g.fill();
      // frosting drips (fixed by position, so they never shimmer)
      for (let x = Math.ceil(left / 38) * 38; x < right; x += 38) { const d = 10 + ((x * 13) % 17); g.beginPath(); g.ellipse(x + 19, top + 20, 9, d, 0, 0, Math.PI); g.fill() }
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(b.x + 8, top, b.w - 16, 4);
      const sp = ['#ffffff', '#5cc8ff', '#ffd23f', '#7ee08a'];
      for (let x = Math.ceil(left / 23) * 23; x < right; x += 23) { g.fillStyle = sp[(x / 23) % 4 | 0]; g.fillRect(x, top + 6 + (x * 7) % 9, 7, 3) }
      return;
    }
    if (world.id === 'space') {
      g.fillStyle = C.floor; g.beginPath(); g.moveTo(left, top);
      for (let x = left; x <= right; x += 40) g.lineTo(x, top + 30 + ((x * 31) % 23));
      g.lineTo(right, top); g.closePath(); g.fill();
      g.fillRect(left, top + 30, w, Math.max(0, bottom - top - 30));
      g.fillStyle = dark.floor; for (let x = Math.ceil(left / 90) * 90; x < right; x += 90) { g.beginPath(); g.arc(x + 30, top + 70 + (x % 50), 12 + (x % 9), 0, 7); g.fill() }
      g.fillStyle = C.floorTop; g.fillRect(b.x, top, b.w, 14);
      g.fillStyle = C.floorEdge; g.globalAlpha = .9; g.fillRect(b.x, top, b.w, 4); g.globalAlpha = .3; g.fillRect(b.x, top - 3, b.w, 3); g.globalAlpha = 1;
      return;
    }
    // underwater: the tunnel floor, stone tiles with lights
    g.fillStyle = C.floor; g.fillRect(left, top, w, bottom - top);
    g.fillStyle = dark.floor; for (let x = Math.ceil(left / 96) * 96; x < right; x += 96) g.fillRect(x, top + 18, 3, bottom - top);
    g.fillStyle = C.floorTop; g.fillRect(b.x, top, b.w, 18);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(b.x, top, b.w, 3);
    g.fillStyle = C.floorEdge; for (let x = Math.ceil((left - b.x) / 120) * 120 + b.x + 30; x < right; x += 120) { roundRect(x, top + 7, 26, 5, 2.5); g.fill() }
  }
  function drawBlock(b) {
    if (b.kind === 'toy') {
      const pal = ['#5cc8ff', '#ff7ab8', '#ffd23f', '#7ee08a'], col = pal[(b.x / 7 | 0) % 4];
      g.fillStyle = shade(col, -.25); roundRect(b.x, b.y + 4, b.w, b.h - 4, 10); g.fill();
      g.fillStyle = col; roundRect(b.x, b.y, b.w, b.h - 6, 10); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; roundRect(b.x + 6, b.y + 5, b.w - 12, 7, 3.5); g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)'; drawStarShape(g, b.x + b.w / 2, b.y + b.h / 2, 13, 6); g.fill();
      return;
    }
    if (b.kind === 'module') {
      g.fillStyle = C.crate; roundRect(b.x, b.y, b.w, b.h, 8); g.fill();
      g.strokeStyle = C.crateEdge; g.lineWidth = 3; roundRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3, 7); g.stroke();
      g.fillStyle = C.accent; g.fillRect(b.x + 12, b.y + b.h / 2 - 3, b.w - 24, 6);
      return;
    }
    // a crate: wood with metal corners (underwater) — the same shape anywhere else
    g.fillStyle = dark.crate; roundRect(b.x, b.y, b.w, b.h, 6); g.fill();
    g.fillStyle = C.crate; roundRect(b.x + 3, b.y + 3, b.w - 6, b.h - 8, 5); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = b.y + 16; y < b.y + b.h - 8; y += 14) g.fillRect(b.x + 6, y, b.w - 12, 3);
    g.fillStyle = C.crateEdge; const k = 12;
    g.fillRect(b.x, b.y, k, 6); g.fillRect(b.x, b.y, 6, k); g.fillRect(b.x + b.w - k, b.y, k, 6); g.fillRect(b.x + b.w - 6, b.y, 6, k);
    g.fillRect(b.x, b.y + b.h - 6, k, 6); g.fillRect(b.x + b.w - k, b.y + b.h - 6, k, 6);
  }
  function drawOneway(b) {
    if (world.id === 'candy') {
      g.fillStyle = '#e8b06d'; roundRect(b.x, b.y + 6, b.w, b.h + 8, 10); g.fill();
      g.fillStyle = '#fff4fb'; roundRect(b.x - 3, b.y - 3, b.w + 6, 16, 8); g.fill();
      g.fillStyle = C.floorTop; for (let x = b.x + 10; x < b.x + b.w - 10; x += 30) { g.beginPath(); g.ellipse(x + 10, b.y + 13, 7, 8 + (x % 7), 0, 0, Math.PI); g.fill() }
      return;
    }
    if (world.id === 'space') {
      g.fillStyle = C.floor; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + b.w, b.y); g.lineTo(b.x + b.w - 20, b.y + 34); g.lineTo(b.x + b.w * .5, b.y + 56); g.lineTo(b.x + 20, b.y + 34); g.closePath(); g.fill();
      g.fillStyle = C.floorTop; g.fillRect(b.x, b.y, b.w, 10); g.fillStyle = C.floorEdge; g.fillRect(b.x, b.y, b.w, 4);
      return;
    }
    // underwater deck: a metal walkway with a yellow edge
    g.fillStyle = '#4b5d7d'; g.fillRect(b.x, b.y, b.w, b.h);
    g.fillStyle = '#2f3d58'; for (let x = b.x + 6; x < b.x + b.w - 6; x += 18) g.fillRect(x, b.y + 8, 9, b.h - 12);
    g.fillStyle = C.floorEdge; g.fillRect(b.x, b.y, b.w, 5);
    g.fillStyle = '#2f3d58'; g.fillRect(b.x, b.y + b.h, 8, 24); g.fillRect(b.x + b.w - 8, b.y + b.h, 8, 24);
  }
  function drawLow(b) {
    const top = Math.max(b.y, cam.y - 20), bottom = b.y + b.h;
    if (world.id === 'candy') {
      // a striped toy bar on two candy posts
      g.fillStyle = '#ffffff'; roundRect(b.x, bottom - 40, b.w, 40, 18); g.fill();
      g.save(); roundRect(b.x, bottom - 40, b.w, 40, 18); g.clip(); g.fillStyle = C.low;
      for (let x = b.x - 40; x < b.x + b.w + 40; x += 30) { g.beginPath(); g.moveTo(x, bottom); g.lineTo(x + 15, bottom); g.lineTo(x + 45, bottom - 40); g.lineTo(x + 30, bottom - 40); g.fill() }
      g.restore();
      g.fillStyle = 'rgba(255,170,210,.9)'; g.fillRect(b.x + 10, top, 20, bottom - 40 - top); g.fillRect(b.x + b.w - 30, top, 20, bottom - 40 - top);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(b.x + 14, top, 5, bottom - 40 - top); g.fillRect(b.x + b.w - 26, top, 5, bottom - 40 - top);
      return;
    }
    g.fillStyle = dark.low; g.fillRect(b.x, top, b.w, bottom - top);
    g.fillStyle = C.low; g.fillRect(b.x + 8, top, b.w - 16, bottom - top - 8);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(b.x + 8, top, 8, bottom - top - 8);
    // the warning glow along the bottom edge: this is what you slide under
    g.fillStyle = C.lowGlow; roundRect(b.x + 4, bottom - 12, b.w - 8, 10, 5); g.fill();
    g.globalAlpha = .35 + .15 * Math.sin(time * 5); g.fillRect(b.x + 4, bottom - 2, b.w - 8, 6); g.globalAlpha = 1;
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = b.x + 20; x < b.x + b.w - 20; x += 34) { g.beginPath(); g.arc(x, bottom - 26, 4, 0, 7); g.fill() }
  }
  // the urchin and the crystals as painted: bigger than their hitbox (the spikes are decoration), standing on the floor
  function artHazard(h) {
    const a = h.kind === 'urchin' ? pic.urchin : h.kind === 'crystal' ? pic.crystals : null;
    if (!a) return false;
    const w = h.kind === 'urchin' ? 70 : 82, ht = w * a.m.h / a.m.w, cx = h.x + h.w / 2, bottom = h.y + h.h + (h.kind === 'urchin' ? 6 : 3);
    const wob = reducedMotion || h.kind !== 'urchin' ? 0 : Math.sin(time * 2 + h.x) * .04;
    g.save(); g.translate(cx, bottom); g.scale(1 + wob, 1 - wob); g.drawImage(a.img, -w / 2, -ht, w, ht); g.restore();
    return true;
  }
  function drawHazard(h) {
    if (artHazard(h)) return;
    const cx = h.x + h.w / 2, cy = h.y + h.h / 2;
    if (h.kind === 'crystal') {
      g.fillStyle = 'rgba(209,76,255,.25)'; g.beginPath(); g.arc(cx, cy + 6, 34 + 3 * Math.sin(time * 4), 0, 7); g.fill();
      const pal = ['#ff7af5', '#d14cff', '#8ad8ff'];
      for (let i = -1; i <= 1; i++) { g.fillStyle = pal[i + 1]; g.beginPath(); g.moveTo(cx + i * 13 - 9, h.y + h.h); g.lineTo(cx + i * 13, h.y + (i ? 12 : -4)); g.lineTo(cx + i * 13 + 9, h.y + h.h); g.fill() }
      return;
    }
    if (h.kind === 'gummy') {
      g.fillStyle = '#7e57ff'; g.beginPath(); g.ellipse(cx, h.y + h.h - 12, h.w / 2 + 4, 14, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#b39dff';
      for (let i = 0; i < 4; i++) { const x = h.x - 2 + i * (h.w + 4) / 3.4; g.beginPath(); g.moveTo(x, h.y + h.h - 12); g.lineTo(x + 6, h.y + 2); g.lineTo(x + 13, h.y + h.h - 12); g.fill() }
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx - 8, h.y + h.h - 18, 6, 3, 0, 0, 7); g.fill();
      return;
    }
    // a sea urchin: a dark purple ball with soft spines
    g.strokeStyle = '#4a1f6b'; g.lineWidth = 4; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + Math.sin(time * 2) * .05, r1 = 14, r2 = 25; g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + 2 + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * r2, cy + 2 + Math.sin(a) * r2); g.stroke() }
    g.fillStyle = C.hazard; g.beginPath(); g.arc(cx, cy + 4, 16, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(cx - 5, cy - 2, 5, 0, 7); g.fill();
  }
  function drawPad(b) {
    const hit = padHit.x === b.x ? Math.max(0, padHit.t) : 0, sq = hit * Math.sin(hit * 30) * .25;
    const h = 30 * (1 - sq), w = b.w * (1 + sq * .4);
    g.fillStyle = 'rgba(255,60,140,.35)'; g.beginPath(); g.ellipse(b.x + b.w / 2, b.y + 4, w / 2 + 6, 10, 0, 0, 7); g.fill();
    g.fillStyle = '#ff4f9a'; g.beginPath(); g.ellipse(b.x + b.w / 2, b.y + 2, w / 2, h, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(b.x + b.w / 2 - w * .18, b.y - h * .55, w * .14, h * .16, -.4, 0, 7); g.fill();
    g.fillStyle = '#ffd23f'; g.fillRect(b.x + 6, b.y, b.w - 12, 6);
  }
  function drawFinish(x, y) {
    // a gate with a chequered banner (no words: it reads in every language)
    g.fillStyle = '#ffffff'; g.fillRect(x - 6, y - 230, 12, 230); g.fillRect(x + 154, y - 230, 12, 230);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#1b1b3a' : '#ffffff'; g.fillRect(x + i * 20, y - 230 + j * 20, 20, 20) }
    g.fillStyle = C.accent; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + i * 32, y - 186, 5, 0, 7); g.fill() }
  }

  // The child. Mike's power poses come from his power atlas (tools/jump-sprites.cjs); a child
  // without them (Mia, until her drawings come) borrows a pose from the main atlas and gets the
  // jetpack picture on her back and the flames in code (Stefan, 2026-10-11).
  const TRAIL = { mike: '#2fb8ff', mia: '#ffb21e' };
  function drawPlayer(s, px, py) {
    const p = s.p, S = sprites[hero], img = sprites.images[hero], PW = S.power, pimg = sprites.images[hero + '-power'];
    let state = still ? 'idle' : pose(s);
    const turbo = !still && p.boost > 0 && s.phase === 'run';
    // the first half second of a turbo is the dash pose (when drawn), then the run cycle with the trail
    const dash = turbo && p.ground && state === 'run' && POWER.boost - p.boost < .55;
    const power = state === 'fly' || state === 'grab' ? state : dash ? 'boost' : null;
    const own = power && PW && pimg && PW.states[power];
    lastPose = power || state;
    let A2 = S, im = img, list;
    if (own) { A2 = PW; im = pimg; list = PW.states[power] }
    else if (power === 'fly') list = S.states.jump.slice(-1);
    else if (power === 'grab') list = S.states.doubleJump.slice(0, 1);
    else if (power === 'boost') list = S.states.run;
    else list = S.states[state];
    if (power === 'boost' && !own) state = 'run';
    let i = 0;
    if (state === 'run' && !own) i = Math.floor(time * (turbo ? 19 : 14)) % list.length;   // 8 poses: about two strides a second at 14 per second
    else if (state === 'idle') i = (time % 3) > 2.85 ? 1 : 0;
    else if (state === 'jump') i = p.vy < -420 ? 0 : 1;
    else if (state === 'doubleJump') i = p.doubleT > .25 ? 0 : 1;
    else if (state === 'fall') i = Math.floor(time * 4) % list.length;
    else if (state === 'celebrate') i = Math.floor(time * 6) % list.length;
    const f = list[Math.min(i, list.length - 1)], box = A2.boxes[f];
    let k = VISUAL_H / S.height;
    // a slide is drawn no taller than the gap it slides through
    if (state === 'slide') k = Math.min(k, 60 / -box[1]);
    const cw = A2.cell[0], ch = A2.cell[1], sx = (f % A2.cols) * cw, sy = Math.floor(f / A2.cols) * ch;
    const ax = px + PLAYER.w / 2, ay = py;
    const flyNow = !still && (state === 'fly' || state === 'grab');
    if (turbo) speedTrail(ax, ay, A2, im, sx, sy, cw, ch, k);
    let sxk = 1, syk = 1;
    if (squash > 0 && !reducedMotion) { const q = Math.sin(squash / .14 * Math.PI) * .1; syk = 1 - q; sxk = 1 + q * .8 }
    g.save();
    if (p.inv > 0 && s.phase === 'run') g.globalAlpha = .55 + .45 * (0.5 + 0.5 * Math.cos(p.inv * 18));   // a soft pulse, never a flash
    g.translate(ax, ay); g.scale(sxk, syk);
    // flying: a gentle hover bob; the borrowed pose leans forward into the flight
    if (flyNow) { g.translate(0, reducedMotion ? 0 : Math.sin(time * 6) * 3); if (!own) { g.translate(0, -50); g.rotate(.2); g.translate(0, 50) } }
    if (flyNow && !own) backpack();
    if (flyNow && !own) flames();
    g.drawImage(im, sx, sy, cw, ch, -A2.anchor[0] * k, -A2.anchor[1] * k, cw * k, ch * k);
    g.restore();
    if (hurtRing > 0) { g.globalAlpha = Math.min(1, hurtRing * 1.6); g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.arc(ax, ay - 50, 70 - hurtRing * 60, 0, 7); g.stroke(); g.globalAlpha = 1 }
    // flame particles from the nozzles, left behind in the world
    if (flyNow && !reducedMotion && (time * 60 | 0) % 3 === 0) { const [nx, ny] = own ? NOZZLE[hero] || NOZZLE.pack : NOZZLE.pack; spawn(FLAME, ax + nx, ay + ny, s.world.speed * .3, 160 + (time * 997 % 60), .28, 6, '') }
  }
  // where the flames end, from the child's feet point (world units): on each child's flying
  // drawing (its own flames point back-down-left), and on the jetpack picture drawn on a back
  const NOZZLE = { mike: [-62, -34], mia: [-62, -34], pack: [-30, -40] };
  function backpack() {
    const a = pic.jetpack; if (!a) return;
    const w = 58, h = w * a.m.h / a.m.w;
    g.drawImage(a.img, -18 - w / 2, -82 - h / 2, w, h);
  }
  function flames() {
    const [nx, ny] = NOZZLE.pack, fl = reducedMotion ? 1 : .8 + .35 * Math.sin(time * 41) + .15 * Math.sin(time * 67);
    for (const dx of [-12, 12]) {
      const x = nx + dx, y = ny, len = 34 * fl;
      const gr = g.createLinearGradient(x, y, x - len * .35, y + len); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.3, 'rgba(255,214,90,.9)'); gr.addColorStop(1, 'rgba(255,110,40,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 8, y); g.quadraticCurveTo(x - len * .3, y + len * .6, x - len * .35, y + len); g.quadraticCurveTo(x + 2, y + len * .5, x + 8, y); g.closePath(); g.fill();
    }
  }
  // turbo: a glow round the child, two fading copies behind and speed streaks (a white core in
  // the child's colour, so they read on the dark sea as well as on the pastel candy sky)
  function speedTrail(ax, ay, A2, im, sx, sy, cw, ch, k) {
    const col = TRAIL[hero] || TRAIL.mike, pul = reducedMotion ? 0 : .08 * Math.sin(time * 12);
    g.save();
    const gl = g.createRadialGradient(ax, ay - 56, 8, ax, ay - 56, 74); gl.addColorStop(0, col + 'aa'); gl.addColorStop(1, col + '00');
    g.globalAlpha = .75 + pul; g.fillStyle = gl; g.beginPath(); g.ellipse(ax, ay - 56, 74, 74, 0, 0, 7); g.fill();
    for (let j = 1; j <= 2 && !reducedMotion; j++) { g.globalAlpha = .3 / j; g.drawImage(im, sx, sy, cw, ch, ax - 30 * j - A2.anchor[0] * k, ay - A2.anchor[1] * k, cw * k, ch * k) }
    g.lineCap = 'round';
    for (let j = 0; j < 5; j++) {
      const ph = reducedMotion ? .5 : (time * 3.2 + j * .37) % 1, len = 50 + (j * 23) % 40, x1 = ax - 30 - ph * 70, y = ay - 16 - j * 19;
      g.globalAlpha = .9 * (1 - ph);
      g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.moveTo(x1, y); g.lineTo(x1 - len, y); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x1, y); g.lineTo(x1 - len * .8, y); g.stroke();
    }
    g.restore();
  }

  function drawParts(dt) {
    for (const p of parts) {
      if (!p.on) continue;
      p.life -= dt; if (p.life <= 0) { p.on = false; continue }
      const a = p.life / p.max;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === DUST) { p.vy -= 30 * dt; g.globalAlpha = a * .7; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(p.x, p.y, p.size * (1.6 - a * .6), 0, 7); g.fill(); g.globalAlpha = 1 }
      else if (p.kind === FLAME) { p.vy -= 200 * dt; g.globalAlpha = a * .85; g.fillStyle = a > .6 ? '#ffe28a' : a > .3 ? '#ff9a3c' : 'rgba(150,150,170,.6)'; g.beginPath(); g.arc(p.x, p.y, p.size * (1.3 - a * .6), 0, 7); g.fill(); g.globalAlpha = 1 }
      else if (p.kind === RING) { g.globalAlpha = a * .9; g.strokeStyle = p.color || '#46aaff'; g.lineWidth = 5 * a + 1; g.beginPath(); g.arc(p.x, p.y, p.size + (1 - a) * 70, 0, 7); g.stroke(); g.globalAlpha = a * .7; g.strokeStyle = '#beebff'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, Math.max(1, p.size + (1 - a) * 70 - 7), 0, 7); g.stroke(); g.globalAlpha = 1 }
      else if (p.kind === SPARK) { p.vy += 240 * dt; g.globalAlpha = a; g.fillStyle = SPARK_COL; g.beginPath(); g.arc(p.x, p.y, p.size * a + 1, 0, 7); g.fill(); g.globalAlpha = 1 }
      else if (p.kind === MINISTAR) { p.vy += 160 * dt; p.rot += dt * 5; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = a; g.fillStyle = p.color; drawStarShape(g, 0, 0, p.size, p.size * .45); g.fill(); g.restore() }
      else if (p.kind === CONFETTI) { p.vy += 300 * dt; p.vx *= .99; p.rot += dt * 8; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, a * 2); g.fillStyle = p.color; g.fillRect(-5, -3, 10, 6); g.restore() }
      else if (p.kind === POP) { g.globalAlpha = a; g.drawImage(pic.star ? pic.star.img : starSprite, p.x - p.size * (2 - a), p.y - p.size * (2 - a), p.size * 2 * (2 - a), p.size * 2 * (2 - a)); g.globalAlpha = 1 }
    }
  }

  // What the engine reported this frame becomes effects.
  const many = reducedMotion ? .4 : 1;
  function effects(s, e) {
    for (let i = 0; i < e.n; i++) {
      const ev = e.list[i];
      if (ev.type === 'jump' || ev.type === 'land') for (let j = 0; j < 5 * many; j++) spawn(DUST, ev.x + (j - 2) * 8, ev.y - 4, (j - 2) * 30, -20 - j * 6, .35, 6, '');
      if (ev.type === 'land') squash = .14;
      if (ev.type === 'double') {
        // the ring and the stars travel along with the child
        const v = s.world.speed;
        if (hero === 'mike') { spawn(RING, ev.x, ev.y, v, 0, .45, 16, ''); if (!reducedMotion) spawn(RING, ev.x, ev.y, v, 0, .6, 4, '') }
        else for (let j = 0; j < 9 * many; j++) { const a = j / 9 * Math.PI * 2; spawn(MINISTAR, ev.x, ev.y, v + Math.cos(a) * 170, Math.sin(a) * 170, .55, 10, j % 2 ? '#ffd23f' : '#7ff5d2') }
      }
      if (ev.type === 'star') { spawn(POP, ev.x, ev.y, 0, 0, .3, 22, ''); for (let j = 0; j < 6 * many; j++) { const a = j / 6 * Math.PI * 2; spawn(SPARK, ev.x, ev.y, Math.cos(a) * 140, Math.sin(a) * 140 - 60, .45, 3.5, '') } }
      if (ev.type === 'bounce') { padHit.x = -1; for (const b of level.bounces) if (Math.abs(b.x + b.w / 2 - ev.x) < b.w) padHit.x = b.x; padHit.t = .5 }
      if (ev.type === 'hit') hurtRing = .5;
      if (ev.type === 'shield' || ev.type === 'shieldHit') { spawn(RING, ev.x, ev.y, s.world.speed, 0, .5, 20, ''); for (let j = 0; j < 8 * many; j++) { const a = j / 8 * Math.PI * 2; spawn(SPARK, ev.x, ev.y, s.world.speed + Math.cos(a) * 150, Math.sin(a) * 150, .4, 3.5, '') } }
      if (ev.type === 'respawn') cam.init = false;
      // the power-ups: a gold ring for the jetpack, a blue-and-yellow zap for the energy
      if (ev.type === 'jetpack' || ev.type === 'energy') {
        const v = s.world.speed, gold = ev.type === 'jetpack';
        spawn(RING, ev.x, ev.y, v, 0, .55, 24, gold ? '#ffd23f' : '#46d8ff');
        for (let j = 0; j < 10 * many; j++) { const a = j / 10 * Math.PI * 2; spawn(MINISTAR, ev.x, ev.y, v + Math.cos(a) * 190, Math.sin(a) * 190, .6, 9, j % 2 ? '#ffd23f' : gold ? '#ffffff' : '#7fe3ff') }
      }
      if (ev.type === 'puff' && !reducedMotion) for (let j = 0; j < 4; j++) spawn(FLAME, ev.x - 30 + j * 4, ev.y - 40, s.world.speed * .3, 220 + j * 30, .3, 10, '');
      if (ev.type === 'jetLand') { squash = .14; for (let j = 0; j < 7 * many; j++) spawn(DUST, ev.x + (j - 3) * 10, ev.y - 4, (j - 3) * 40, -30 - j * 5, .45, 7, '') }
      if (ev.type === 'finish') { const n = reducedMotion ? 14 : 40, pal = ['#ffd23f', '#ff5fa2', '#33e1ff', '#7ee08a', '#ffffff']; for (let j = 0; j < n; j++) spawn(CONFETTI, s.p.x + 60 + (j % 10) * 22, cam.y + 30, ((j * 37) % 200) - 100, 60 + (j * 13) % 140, 2.2, 1, pal[j % 5]) }
    }
  }

  function drawTile(name, f, k) { const t = tiles[name], tw = TILE * k, off = -((cam.x * f * k) % tw), yoff = -(cam.y - (cam.ref - groundY / scale)) * k; for (let x = off; x < canvas.width; x += tw) g.drawImage(t, x, Math.min(canvas.height * .5, yoff * f) - canvas.height * .5, tw, canvas.height * 1.5) }
  let visL = 0, visR = 0; const vis = o => o.x + (o.w || 0) > visL && o.x < visR;
  // still: before "Go", while paused — the child stands in the idle pose and nothing in the scene moves
  let still = false, lastPose = 'idle';
  function frame(s, a, dt, interp, isStill = false) {
    still = isStill; if (still) dt = 0;
    time += dt; squash = Math.max(0, squash - dt); padHit.t = Math.max(0, padHit.t - dt); hurtRing = Math.max(0, hurtRing - dt);
    const px = interp ? interp.x : s.p.x, py = interp ? interp.y : s.p.y;
    camera(s, dt, px, py);
    // sky
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = sky; g.fillRect(0, 0, canvas.width, canvas.height);
    if (world.id === 'underwater' && !reducedMotion && !pic.bg) {
      // light rays from the surface
      g.globalAlpha = .1; g.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) { const x = ((i * 380 - cam.x * .05 + Math.sin(time * .3 + i) * 30) % (W * dpr + 400)) - 200; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 120 * dpr, 0); g.lineTo(x + 260 * dpr, canvas.height); g.lineTo(x + 160 * dpr, canvas.height); g.fill() }
      g.globalAlpha = 1;
    }
    // the two background layers (far moves slowest); with the art pack: the painted far layer
    const k = scale * dpr, lift = (cam.ref - groundY / scale) - cam.y;
    if (pic.bg) { artBackground(lift); if (!reducedMotion || world.id !== 'underwater') ambient(dt); if (pic.windows && world.id === 'underwater') artWindows(lift) }
    else for (const [name, f] of LAYERS) {
      const t = tiles[name], tw = TILE * k, off = -((cam.x * f * k) % tw), yoff = -(cam.y - (cam.ref - groundY / scale)) * k;
      for (let x = off; x < canvas.width; x += tw) g.drawImage(t, x, Math.min(canvas.height * .5, yoff * f) - canvas.height * .5, tw, canvas.height * 1.5);
    }
    // swimmers / drifters, drawn in screen space with their own parallax (with the art: behind the tunnel windows)
    if (!pic.bg) ambient(dt);
    // the world
    g.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
    const x0 = cam.x, x1 = cam.x + viewW;
    const L = level; visL = x0 - 60; visR = x1 + 60;
    const useArt = !!pic.plat;
    for (const d of L.deco) if (d.kind === 'finish' && d.x > x0 - 240 && d.x < x1 + 240) (pic.finish ? artFinish : drawFinish)(d.x, d.y);
    for (const b of L.lows) if (vis(b)) (useArt && pic.gate ? artLow : drawLow)(b);
    for (const b of L.solids) if (vis(b)) { if (b.kind === 'tower') drawTower(b); else if (b.h > 400) (useArt ? artFloor : drawFloor)(b, x0, x1); else (useArt ? artBlock : drawBlock)(b) }
    for (const b of L.oneway) if (vis(b)) (useArt ? artOneway : drawOneway)(b);
    for (const b of L.bounces) if (vis(b)) (pic.pad ? artPad : drawPad)(b);
    for (const h of L.hazards) if (vis(h)) drawHazard(h);
    for (const c of L.cps) if (c.x > x0 - 40 && c.x < x1 + 40) { const lit = s.cp.x >= c.x; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(c.x - 2, c.y - 46, 4, 46); g.fillStyle = lit ? C.accent : 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(c.x, c.y - 50, 7, 0, 7); g.fill() }
    const bob = reducedMotion ? 0 : Math.sin(time * 4) * 3;
    const sw = pic.star ? 46 : 48, sh = pic.star ? 46 * pic.star.m.h / pic.star.m.w : 48, simg = pic.star ? pic.star.img : starSprite;
    for (let i = 0; i < L.stars.length; i++) { const st = L.stars[i]; if (s.got[i] || st.x < x0 - 40 || st.x > x1 + 40) continue; if (glow) g.drawImage(glow, st.x - 40, st.y - 40 + bob, 80, 80); g.drawImage(simg, st.x - sw / 2, st.y - sh / 2 + bob, sw, sh) }
    if (pic.shield) for (let i = 0; i < (L.shields || []).length; i++) { const it = L.shields[i]; if (s.gotShield[i] || it.x < x0 - 60 || it.x > x1 + 60) continue; const h2 = 52, w2 = h2 * pic.shield.m.w / pic.shield.m.h; g.globalAlpha = .35; g.fillStyle = '#7ff0ff'; g.beginPath(); g.arc(it.x, it.y + bob, 34, 0, 7); g.fill(); g.globalAlpha = 1; g.drawImage(pic.shield.img, it.x - w2 / 2, it.y - h2 / 2 + bob, w2, h2) }
    // the power-ups float and glow (the jetpack higher up: only a jump reaches it)
    const items = (list, got, a, w, glowCol, bobK) => { if (!a) return; for (let i = 0; i < (list || []).length; i++) { const it = list[i]; if (got[i] || it.x < x0 - 80 || it.x > x1 + 80) continue; const h2 = w * a.m.h / a.m.w, y = it.y + bob * bobK; g.globalAlpha = .3 + (reducedMotion ? 0 : .12 * Math.sin(time * 5 + i)); g.fillStyle = glowCol; g.beginPath(); g.arc(it.x, y, w * .62, 0, 7); g.fill(); g.globalAlpha = 1; g.drawImage(a.img, it.x - w / 2, y - h2 / 2, w, h2) } };
    items(L.jetpacks, s.gotJet, pic.jetpack, 78, '#ffe27a', 2.2);
    items(L.energies, s.gotEnergy, pic.energy, 70, '#7fe3ff', 1.4);
    drawPlayer(s, px, py);
    if (pic.finish) for (const d of L.deco) if (d.kind === 'finish' && d.x > x0 - 240 && d.x < x1 + 240) artFinishFront(d.x, d.y);
    // the shield while it lasts: a soft blue bubble round the child
    if (s.shield) { const cx = px + PLAYER.w / 2, cy = py - 56, rr = 66 + (reducedMotion ? 0 : Math.sin(time * 5) * 3); g.globalAlpha = .22; g.fillStyle = '#7fd8ff'; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill(); g.globalAlpha = .8; g.strokeStyle = '#bff0ff'; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1 }
    drawParts(dt);
  }

  // Fish, jellyfish, bubbles (underwater), sparkles (candy), shooting stars (space):
  // fixed slots that drift and wrap, no allocation.
  function ambient(dt) {
    const k = scale * dpr; g.setTransform(1, 0, 0, 1, 0, 0);
    if (reducedMotion) return;
    const Wd = canvas.width, Hd = canvas.height, gyD = groundY * dpr;
    if (world.id === 'underwater') {
      for (let i = 0; i < 7; i++) {
        const sp = 22 + i * 7, y = gyD * (.12 + (i * .11) % .6), x = Wd - (((time * sp * dpr) + i * 397 * dpr + cam.x * .35 * k) % (Wd + 200 * dpr)) + 100 * dpr;
        g.fillStyle = ['#ffd23f', '#ff8a5c', '#7ff0ff', '#ff6fa8'][i % 4]; g.globalAlpha = .75;
        g.beginPath(); g.ellipse(x, y, 14 * dpr, 7 * dpr, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 12 * dpr, y); g.lineTo(x + 24 * dpr, y - 7 * dpr); g.lineTo(x + 24 * dpr, y + 7 * dpr); g.fill();
      }
      for (let i = 0; i < 3; i++) {
        const x = ((i * 700 * dpr - cam.x * .3 * k) % (Wd + 400 * dpr) + Wd + 400 * dpr) % (Wd + 400 * dpr) - 200 * dpr, y = gyD * (.2 + i * .12) + Math.sin(time * .9 + i) * 18 * dpr;
        g.globalAlpha = .45; g.fillStyle = '#ffc7f2'; g.beginPath(); g.ellipse(x, y, 22 * dpr, 16 * dpr, 0, Math.PI, 0); g.fill();
        g.strokeStyle = '#ffc7f2'; g.lineWidth = 2 * dpr; for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(x - 14 * dpr + j * 9 * dpr, y); g.quadraticCurveTo(x - 18 * dpr + j * 9 * dpr + Math.sin(time * 2 + j) * 5 * dpr, y + 20 * dpr, x - 12 * dpr + j * 9 * dpr, y + 36 * dpr); g.stroke() }
      }
      g.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 14; i++) { const x = (i * 157 * dpr - cam.x * .6 * k) % Wd, xx = x < 0 ? x + Wd : x, y = Hd - ((time * (30 + i * 4) * dpr + i * 90 * dpr) % Hd); g.beginPath(); g.arc(xx, y, (2 + i % 3) * dpr, 0, 7); g.fill() }
      g.globalAlpha = 1;
    } else if (world.id === 'space') {
      const t = time % 6; if (t < .8) { const x = Wd * (.3 + .4 * ((Math.floor(time / 6) * .37) % 1)), y = Hd * .12; g.strokeStyle = `rgba(255,255,255,${.8 - t})`; g.lineWidth = 2 * dpr; g.beginPath(); g.moveTo(x + t * 300 * dpr, y + t * 80 * dpr); g.lineTo(x + t * 300 * dpr - 70 * dpr, y + t * 80 * dpr - 18 * dpr); g.stroke() }
    } else {
      g.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 10; i++) { const x = (i * 211 * dpr - cam.x * .4 * k) % Wd, xx = x < 0 ? x + Wd : x, y = gyD * (.1 + (i * .13) % .7), a = .4 + .4 * Math.sin(time * 3 + i); g.globalAlpha = a; g.beginPath(); g.arc(xx, y, 2.5 * dpr, 0, 7); g.fill() }
      g.globalAlpha = 1;
    }
  }

  function reset() { for (const p of parts) p.on = false; cam.init = false; squash = 0; hurtRing = 0; padHit.x = -1 }

  return {
    resize, frame, reset, get pose() { return lastPose }, effects: s => effects(s, s.events),
    get scale() { return scale }, get view() { return { w: viewW, h: viewH, groundY, scale } }, get camera() { return { ...cam } },
    activeParticles: () => parts.reduce((n, p) => n + (p.on ? 1 : 0), 0)
  };
}
