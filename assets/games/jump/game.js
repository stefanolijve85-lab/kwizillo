// Mike & Mia: Jump & Slide — the game: screens, loop and the glue between the
// engine (engine.js), the levels (levels.js), the drawing (render.js) and the
// input (input.js). Mounted by the host (games-jump.js) into the app frame:
//
//   const game = mountJump(el, { text, hero, world, ... });  game.destroy();
//
// Screens: loading → pick (child + world) → countdown → play ⇄ pause → result.
// The host decides about music, sound effects and rewards; this file never
// touches the app's state itself.
import { STEP, createRun, step, pressJump, pressSlide, score, PLAYER, HEARTS } from './engine.js';
import { WORLDS, WORLD_ORDER, level as getLevel } from './levels.js';
import { SPRITES } from './sprites.js';
import { createRenderer } from './render.js';
import { createInput, live } from './input.js';
import { ART } from './art/art.js';

const HEROES = ['mike', 'mia'];
const BASE = new URL('./', import.meta.url).href;
const MAX_FRAME = 0.1;        // a longer frame (tab switch, debugger) never becomes a jump in time
const SVG = {
  heart: '<svg class="kj-heart" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21s-9-5.6-9-12A5 5 0 0 1 12 6a5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill="#ff4f6d" stroke="#fff" stroke-width="2"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" fill="#ffd23f" stroke="#fff" stroke-width="1.6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="2" fill="#fff"/><rect x="14" y="4" width="5" height="16" rx="2" fill="#fff"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l8 9h-5v7H9v-7H4z" fill="#fff"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c5 0 7-1 9-5h3c-1 5-5 8-12 8z" fill="#fff"/><circle cx="17" cy="7" r="3" fill="#fff"/><path d="M3 20h18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
let runSeq = 0;
// The game's root is its own element: when any other screen replaces it (the
// bottom bar, the Android back button, a reload of the frame), the browser
// tells it, and everything it started stops — loop, listeners, observer.
if (!customElements.get('kwizillo-jump')) customElements.define('kwizillo-jump', class extends HTMLElement { disconnectedCallback() { this.kjDestroy?.() } });

export function mountJump(host, opts = {}) {
  const T = (k, p) => (opts.text ? opts.text(k, p) : k);
  // sounds: the hero's own set for the character sounds; the same sound never
  // stacks (rapid stars, a bounce and its landing) — at most one per 70 ms
  const lastSfx = new Map();
  const sfx = k => { const now = performance.now(); const id = hero + k; if (now - (lastSfx.get(id) || -1e9) < 70) return; lastSfx.set(id, now); try { opts.sfx?.(k, hero) } catch { } };
  const reduced = !!opts.reducedMotion;
  let hero = HEROES.includes(opts.hero) ? opts.hero : 'mike';
  let worldId = WORLD_ORDER.includes(opts.world) ? opts.world : 'underwater';
  const seen = { ...(opts.hintsSeen || {}) };

  // ---------- DOM ----------
  const root = document.createElement('kwizillo-jump');
  // The app shows its screens in a tall card; a side-scroller needs the whole
  // screen, so the game lies over the app (`overlay`) while its host element
  // stays in the card. When that card is replaced, the game goes with it.
  root.className = opts.overlay ? 'kj kj-fixed' : 'kj'; root.dir = opts.dir || 'ltr';
  root.innerHTML = `<link rel="stylesheet" href="${BASE}style.css">
    <canvas class="kj-canvas" aria-hidden="true"></canvas>
    <div class="kj-field" role="img"></div>
    <div class="kj-hud" hidden>
      <button class="kj-icon-btn kj-pause" data-act="pause" aria-label="${esc(T('pause'))}">${SVG.pause}</button>
      <span class="kj-pill kj-hearts" role="img"></span><img class="kj-shield-on" src="${BASE}art/shield.webp" alt="" hidden>
      <span class="kj-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(T('progress'))}"><i></i><b></b></span>
      <span class="kj-pill kj-stars" role="status"><img src="${BASE}art/star.webp" alt=""><span class="kj-star-n">0</span></span>
    </div>
    <div class="kj-controls" hidden aria-label="${esc(T('controls'))}">
      <button class="kj-btn kj-slide" id="kjSlide" data-act="slide" aria-label="${esc(T('slide'))}"><small>${esc(T('slide'))}</small></button>
      <button class="kj-btn kj-jump" id="kjJump" data-act="jump" aria-label="${esc(T('jump'))}"><small>${esc(T('jump'))}</small></button>
    </div>
    <div class="kj-hint" aria-live="polite"></div>
    <div class="kj-count" aria-live="assertive"></div>
    <div class="kj-layer"></div>`;
  (opts.overlay ? document.body : host).appendChild(root);
  root.kjDestroy = () => destroy();
  const watch = opts.overlay ? new MutationObserver(() => { if (!host.isConnected) destroy() }) : null;
  if (watch) { watch.observe(opts.watch || document.body, { childList: true, subtree: !opts.watch }); live.observers++ }
  const $ = sel => root.querySelector(sel);
  const canvas = $('.kj-canvas'), field = $('.kj-field'), hud = $('.kj-hud'), controls = $('.kj-controls'), hint = $('.kj-hint'), count = $('.kj-count'), layer = $('.kj-layer');
  const jumpBtn = $('#kjJump'), slideBtn = $('#kjSlide');
  const shieldOn = $('.kj-shield-on'), heartsEl = $('.kj-hearts'), starN = $('.kj-star-n'), bar = $('.kj-progress i'), progress = $('.kj-progress');

  // ---------- assets ----------
  const images = {};
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = BASE + src });
  const preload = () => Promise.all([
    ...HEROES.map(h => loadImg(SPRITES[h].src).then(i => { images[h] = i })),
    ...WORLD_ORDER.map(w => loadImg(`world-${w}.jpg`)),
    ...Object.entries(ART).map(([n, a]) => loadImg(a.src).then(i => { artImages[n] = i }))
  ]);
  const artImages = {};

  // ---------- run state ----------
  let screen = 'loading', run = null, renderer = null, L = null, W = null, runId = '', booked = null, resultShown = false;
  let acc = 0, last = 0, raf = 0, countT = 0, countN = -1, blockedT = 0, hintT = 0, hintKind = '', lastInput = 'touch';
  const prev = { x: 0, y: 0 };
  const interp = { x: 0, y: 0 };

  const playing = () => screen === 'play';
  const input = createInput({ root, jumpBtn, slideBtn, field }, {
    enabled: playing,
    jump: how => { lastInput = how; if (run) pressJump(run) },
    slide: how => { lastInput = how; if (run) pressSlide(run) },
    pause: () => { if (screen === 'play' || screen === 'count') pause(); else if (screen === 'pause') resume() }
  });
  // leaving the app or the tab pauses the run
  input.on(document, 'visibilitychange', () => { if (document.hidden && (screen === 'play' || screen === 'count')) pause() });
  input.on(window, 'blur', () => { if (screen === 'play' || screen === 'count') pause() });
  input.on(root, 'click', e => {
    const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
    const act = b.dataset.act;
    if (act === 'jump' || act === 'slide') return;   // pointer events handle these
    e.preventDefault(); actions[act]?.(b);
  });

  // the bottom safe area in px (the CSS variable holds env(), which only a laid-out box resolves)
  const sabProbe = document.createElement('div'); sabProbe.style.cssText = 'position:absolute;left:0;bottom:0;width:0;height:var(--sab,0px);visibility:hidden;pointer-events:none'; root.appendChild(sabProbe);
  const ro = new ResizeObserver(() => fit()); ro.observe(root); live.observers++;
  function fit() {
    const r = root.getBoundingClientRect();
    if (renderer && r.width && r.height) {
      // what the buttons take at the bottom: their size (as in style.css) + margin + the safe area
      const sab = sabProbe.offsetHeight || 0, btn = Math.min(116, Math.max(88, .135 * Math.min(r.width, r.height)));
      renderer.resize(r.width, r.height, window.devicePixelRatio || 1, btn + 14 + sab + 14);
      if (run) draw(0);
    }
  }

  // ---------- screens ----------
  function show(html, cls = '') { layer.innerHTML = html ? `<div class="kj-panel ${cls}">${html}</div>` : ''; }
  function setPlayUI(on) { hud.hidden = !on; controls.hidden = !on }

  function face(canvasEl, h, size) {
    const S = SPRITES[h], img = images[h]; if (!img || !canvasEl) return;
    const r = canvasEl.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(40, r.width || size), ht = Math.max(40, r.height || size);
    canvasEl.width = w * dpr; canvasEl.height = ht * dpr;
    const c = canvasEl.getContext('2d'), k = Math.min(ht * dpr * .98 / S.cell[1], w * dpr / S.cell[0]), f = S.states.idle[0];
    c.drawImage(img, (f % S.cols) * S.cell[0], Math.floor(f / S.cols) * S.cell[1], S.cell[0], S.cell[1], (w * dpr - S.cell[0] * k) / 2, ht * dpr - S.cell[1] * k, S.cell[0] * k, S.cell[1] * k);
  }

  function showLoading() {
    screen = 'loading';
    show(`<div class="kj-loading"><span class="kj-spin"></span><b>${esc(T('loading'))}</b></div>`);
  }
  function showError() {
    screen = 'error';
    show(`<div class="kj-top"><button class="kj-icon-btn" data-act="exit" aria-label="${esc(T('back'))}">${SVG.back}</button></div>
      <h1>${esc(T('loadErrorTitle'))}</h1><h2>${esc(T('loadError'))}</h2>
      <div class="kj-row"><button class="kj-go" data-act="retry">${esc(T('retry'))}</button></div>`);
  }
  function showPick() {
    screen = 'pick'; setPlayUI(false); stopLoop(); hideHint();
    show(`<div class="kj-top"><button class="kj-icon-btn" data-act="exit" aria-label="${esc(T('back'))}">${SVG.back}</button></div>
      <h1>${esc(T('pickTitle'))}</h1>
      <div class="kj-heroes" role="group" aria-label="${esc(T('pickTitle'))}">
        ${HEROES.map(h => `<button class="kj-hero" data-act="hero" data-hero="${h}" aria-pressed="${h === hero}"><span class="kj-check">${SVG.check}</span><canvas class="kj-face" data-face="${h}"></canvas><b>${esc(T('hero.' + h))}</b></button>`).join('')}
      </div>
      <div class="kj-pick-right">
        <h2>${esc(T('pickWorld'))}</h2>
        <div class="kj-worlds" role="group" aria-label="${esc(T('pickWorld'))}">
          ${WORLD_ORDER.map(w => { const b = opts.best?.(w) || 0; return `<button class="kj-world" data-act="world" data-world="${w}" aria-pressed="${w === worldId}"><img src="${BASE}world-${w}.jpg" alt=""><span>${esc(T('world.' + w))}${b ? `<small>${esc(T('best', { n: b }))}</small>` : ''}</span></button>` }).join('')}
        </div>
        <button class="kj-go" data-act="start">${esc(T('start'))}</button>
      </div>`, 'kj-pick');
    requestAnimationFrame(() => root.querySelectorAll('[data-face]').forEach(c => face(c, c.dataset.face, 150)));
  }

  function newRun() {
    W = WORLDS[worldId]; L = getLevel(worldId); autoPlan = null; hideHint();
    root.querySelector('.kj-stars img').src = BASE + (worldId === 'underwater' ? 'art/star-uw.webp' : 'art/star.webp');
    run = createRun(L, W); runId = `jump-${worldId}-${Date.now().toString(36)}-${++runSeq}`; booked = null; resultShown = false;
    prev.x = run.p.x; prev.y = run.p.y; acc = 0; blockedT = 0;
    renderer = createRenderer(canvas, { level: L, world: W, sprites: { ...SPRITES, images }, hero, art: { ART, images: artImages }, reducedMotion: reduced });
    fit();
    canvas.setAttribute('aria-label', T('canvas', { world: T('world.' + worldId) }));
    field.setAttribute('aria-label', T('canvas', { world: T('world.' + worldId) }));
    renderHud(true);
  }

  function startRun() {
    newRun();
    opts.onStart?.(worldId, hero);
    show(''); setPlayUI(true);
    screen = 'count'; countT = 0; countN = -1;
    if (!seen.keys && lastInput === 'key') showHint('keys', 2.6);
    else if (!seen.keys && matchMedia('(hover:hover) and (pointer:fine)').matches) showHint('keys', 2.6);
    startLoop();
  }

  function pause() {
    if (screen !== 'play' && screen !== 'count') return;
    const was = screen; screen = 'pause'; pausedFrom = was;
    show(`<h1>${esc(T('paused'))}</h1>
      <div class="kj-row"><button class="kj-go" data-act="resume">${esc(T('resume'))}</button></div>
      <div class="kj-row"><button class="kj-go alt" data-act="restart">${esc(T('restart'))}</button><button class="kj-go alt" data-act="exit">${esc(T('exit'))}</button></div>`, 'dim');
    root.querySelector('[data-act=resume]')?.focus({ preventScroll: true });
  }
  let pausedFrom = 'play';
  function resume() {
    if (screen !== 'pause') return;
    show(''); screen = pausedFrom === 'count' ? 'count' : 'play';
    if (screen === 'count') { countT = 0; countN = -1 }
    last = 0; acc = 0;
  }

  function finishRun() {
    if (resultShown) return; resultShown = true;
    const completed = run.endedBy === 'finish';
    const reward = { game: 'jump', runId, world: worldId, hero, completed, stars: run.stars, total: L.stars.length, score: score(run), hearts: run.hearts, time: +run.t.toFixed(2) };
    // the host books it once per run id; asking again (a replayed callback) pays nothing
    if (!booked) { try { booked = opts.onComplete?.(reward) || { coins: 0, xp: 0 } } catch (e) { booked = { coins: 0, xp: 0, error: true } } }
    lastReward = reward;
    screen = 'result'; setPlayUI(false); hideHint();
    const idx = WORLD_ORDER.indexOf(worldId), next = completed && idx < WORLD_ORDER.length - 1 ? WORLD_ORDER[idx + 1] : null;
    const best = opts.best?.(worldId) || reward.score;
    const earned = [booked.coins ? T('coins', { n: booked.coins }) : '', booked.xp ? T('xp', { n: booked.xp }) : ''].filter(Boolean).join(' · ');
    show(`<div class="kj-card" role="dialog" aria-live="polite">
        <div class="kj-row kj-medal-row"><canvas class="kj-face" data-face="${hero}"></canvas>${completed ? `<img class="kj-medal" src="${BASE}art/medal.webp" alt="">` : ''}</div>
        <h1>${esc(completed ? T('done') : T('tryAgain'))}</h1>
        <h2>${esc(T('world.' + worldId))}</h2>
        <div class="kj-stats">
          <div class="kj-stat"><b>${run.stars}<small>/${L.stars.length}</small></b><small>${esc(T('stars'))}</small></div>
          <div class="kj-stat"><b>${reward.score}</b><small>${esc(T('score'))}</small></div>
          <div class="kj-stat"><b class="${booked.newBest ? 'kj-new' : ''}">${best}</b><small>${esc(booked.newBest ? T('newBest') : T('bestLabel'))}</small></div>
        </div>
        ${earned ? `<div class="kj-earned">${esc(earned)}</div>` : ''}${booked.note ? `<div class="kj-earned">${esc(booked.note)}</div>` : ''}
        <div class="kj-row">
          <button class="kj-go" data-act="again">${esc(T('again'))}</button>
          ${next ? `<button class="kj-go alt" data-act="next" data-world="${next}">${esc(T('next'))}</button>` : ''}
        </div>
        <div class="kj-row"><button class="kj-go alt" data-act="exit">${esc(T('toChest'))}</button></div>
      </div>`, 'dim');
    requestAnimationFrame(() => root.querySelectorAll('[data-face]').forEach(c => face(c, c.dataset.face, 120)));
  }
  let lastReward = null;

  const actions = {
    exit: () => { sfx('tap'); destroy(); opts.onExit?.() },
    retry: () => boot(),
    hero: b => { hero = b.dataset.hero; sfx('tap'); opts.onHero?.(hero); root.querySelectorAll('[data-act=hero]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.hero === hero))) },
    world: b => { worldId = b.dataset.world; sfx('tap'); opts.onWorld?.(worldId); root.querySelectorAll('[data-act=world]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.world === worldId))) },
    start: () => { sfx('tap'); startRun() },
    pause: () => pause(),
    resume: () => { sfx('tap'); resume() },
    restart: () => { sfx('tap'); startRun() },
    again: () => { sfx('tap'); startRun() },
    next: b => { sfx('tap'); worldId = b.dataset.world; opts.onWorld?.(worldId); startRun() }
  };

  // ---------- HUD ----------
  let hudHearts = -1, hudStars = -1, hudPct = -1, hudShield = null;
  function renderHud(force) {
    if (!run) return;
    if (force || run.hearts !== hudHearts) {
      hudHearts = run.hearts;
      heartsEl.innerHTML = Array.from({ length: HEARTS }, (_, i) => SVG.heart.replace('class="kj-heart"', `class="kj-heart ${i < run.hearts ? '' : 'lost'}"`)).join('');
      heartsEl.setAttribute('aria-label', T('hearts', { n: run.hearts }));
    }
    if (force || run.stars !== hudStars) { hudStars = run.stars; starN.textContent = run.stars }
    if (force || run.shield !== hudShield) { hudShield = run.shield; shieldOn.hidden = !run.shield }
    const pct = Math.max(0, Math.min(100, Math.round((run.p.x - L.start.x) / (L.finish - L.start.x) * 100)));
    if (force || pct !== hudPct) { hudPct = pct; bar.style.width = pct + '%'; progress.setAttribute('aria-valuenow', pct) }
  }

  // ---------- hints (first runs only, short) ----------
  function showHint(kind, sec = 2.4) {
    hintKind = kind; hintT = sec;
    hint.textContent = T('hint.' + kind); hint.classList.toggle('left', false); hint.classList.add('on');
    seen[kind] = true; opts.onHintSeen?.(kind);
  }
  function hideHint() { hint.classList.remove('on'); hintT = 0; hintKind = '' }

  // ---------- loop ----------
  function startLoop() { if (raf) return; last = 0; raf = requestAnimationFrame(tick); live.raf++ }
  function stopLoop() { if (!raf) return; cancelAnimationFrame(raf); raf = 0; live.raf-- }
  function tick(now) {
    if (!host.isConnected) { destroy(); return }
    raf = requestAnimationFrame(tick);
    let dt = last ? (now - last) / 1000 : 1 / 60; last = now;
    if (dt > MAX_FRAME) dt = 1 / 60;          // a long gap counts as one ordinary frame
    advance(dt);
    draw(dt);
  }

  function advance(dt) {
    if (!run) return;
    if (screen === 'count') {
      countT += dt;
      const n = Math.floor(countT / .6);
      if (n !== countN) { countN = n; if (n < 3) { count.innerHTML = `<span>${3 - n}</span>`; sfx('count') } else if (n === 3) { count.innerHTML = `<span>${esc(T('go'))}</span>`; sfx('go') } }
      if (countT >= 2.0) { screen = 'play'; acc = 0; setTimeout(() => { if (screen !== 'count') count.innerHTML = '' }, 350) }
      return;
    }
    if (screen === 'play' || screen === 'result' || screen === 'ending') {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 16) {
        prev.x = run.p.x; prev.y = run.p.y;
        if (autoPlan) planPress();
        step(run); n++; acc -= STEP;
        handleEvents();
      }
      const a = acc / STEP;
      // a respawn jumps the child back: no smoothing across it
      if (Math.abs(run.p.x - prev.x) > 50) { prev.x = run.p.x; prev.y = run.p.y }
      interp.x = prev.x + (run.p.x - prev.x) * a; interp.y = prev.y + (run.p.y - prev.y) * a;
      if (screen === 'play') {
        renderHud(false);
        // stopped by a wall for a moment: the jump button asks for a press
        blockedT = run.p.blocked ? blockedT + dt : 0;
        jumpBtn.classList.toggle('nudge', blockedT > .8);
        if (hintT > 0) { hintT -= dt; if (hintT <= 0) hideHint() }
        for (const h of L.hints) if (!seen[h.kind] && run.p.x >= h.x && run.p.x < h.x + 400) showHint(h.kind);
      }
      if (run.phase !== 'run' && screen === 'play') { screen = 'ending'; setPlayUI(false); hideHint(); jumpBtn.classList.remove('nudge') }
      if (screen === 'ending' && run.after > (run.endedBy === 'finish' ? 1.6 : 1.1)) finishRun();
    }
  }
  // tests only: a solver plan pressed by the loop itself (decision k = step 6k)
  let autoPlan = null;
  function planPress() { const sc = Math.round(run.t / STEP); if (sc % 6) return; const a = autoPlan.get(sc / 6); if (a === 'jump') pressJump(run); else if (a === 'slide') pressSlide(run) }
  function handleEvents() {
    const e = run.events;
    renderer?.effects(run);   // every step's events become effects (a frame holds about two steps)
    for (let i = 0; i < e.n; i++) {
      const t = e.list[i].type;
      if (t === 'jump' || t === 'double' || t === 'land' || t === 'star' || t === 'hit' || t === 'bounce' || t === 'slide' || t === 'shield' || t === 'shieldHit') sfx(t);
      else if (t === 'fall') sfx('fall');
      else if (t === 'finish') { sfx('finish'); setTimeout(() => { if (!destroyed) sfx('celebrate') }, 650) }
      else if (t === 'over') sfx('over');
    }
  }
  function draw(dt) {
    if (!renderer || !run) return;
    const still = screen === 'count' || screen === 'loading' || screen === 'pause' || screen === 'pick';
    renderer.frame(run, 0, dt, screen === 'count' || screen === 'loading' ? null : interp, still);
  }

  // ---------- life cycle ----------
  let destroyed = false;
  async function boot() {
    showLoading();
    try { await preload() } catch (e) { if (!destroyed) showError(); return }
    if (destroyed) return;
    opts.onReady?.();
    if (opts.autostart) startRun(); else showPick();
  }
  function destroy() {
    if (destroyed) return; destroyed = true;
    stopLoop(); input.destroy(); ro.disconnect(); live.observers--;
    if (watch) { watch.disconnect(); live.observers-- }
    root.remove(); run = null; renderer = null;
  }
  boot();

  // A small handle for the host and the tests (K.jumpForTest).
  return {
    element: root, destroy,
    get screen() { return screen }, get run() { return run }, get level() { return L }, get hero() { return hero }, get world() { return worldId }, get runId() { return runId },
    get reward() { return lastReward }, get booked() { return booked }, get renderer() { return renderer },
    pause, resume,
    start(w = worldId, h = hero) { worldId = w; hero = h; startRun(); countT = 2; screen = 'play'; count.innerHTML = '' },
    // runs the simulation ahead without drawing (presses at decision k of 1/20 s)
    fastForward(sec, plan = null) {
      if (!run) return null;
      const at = plan ? new Map(plan.map(a => [a.k, a.a])) : autoPlan;
      const steps = Math.round(sec / STEP);
      for (let i = 0; i < steps && run.phase === 'run'; i++) {
        const sc = Math.round(run.t / STEP);
        if (at && sc % 6 === 0) { const a = at.get(sc / 6); if (a === 'jump') pressJump(run); else if (a === 'slide') pressSlide(run) }
        prev.x = run.p.x; prev.y = run.p.y; step(run); handleEvents();
      }
      if (run.phase !== 'run' && screen === 'play') { screen = 'ending'; setPlayUI(false); hideHint(); jumpBtn.classList.remove('nudge') }
      return { phase: run.phase, t: run.t, x: run.p.x };
    },
    autoplay(plan) { autoPlan = plan ? new Map(plan.map(a => [a.k, a.a])) : null },
    press(kind) { if (!run) return; if (kind === 'jump') pressJump(run); else pressSlide(run) },
    tick(sec) { const n = Math.round(sec / STEP); for (let i = 0; i < n; i++) { step(run); handleEvents() } },
    showResults() { finishRun() },
    debug() { return { screen, pose: renderer?.pose, camera: renderer?.camera, live: { ...live }, raf: !!raf, particles: renderer?.activeParticles() ?? 0, player: run ? { x: run.p.x, y: run.p.y, h: run.p.h, sliding: run.p.sliding, jumps: run.p.jumps, ground: run.p.ground } : null } }
  };
}
export { live };
