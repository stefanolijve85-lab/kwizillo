// Blokkenpret (games-blokken.js, blokken-levels.js) in the real app.
//   npx playwright test -c tests/playwright.blokken.config.js [--project=chromium|webkit|firefox]
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], games: {} }, ...over
});
const withBlokken = (blokken, over = {}) => SAVED({ progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], games: { blokken } }, ...over });

async function boot(page, { state = SAVED(), all = false } = {}) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto(all ? '/?blokkenAll=1' : '/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
async function openLevels(page) {
  await page.locator('#homeChest').click();
  await page.locator('#homeBlokken').click();
  await expect(page.locator('.bk-levels')).toBeVisible();
}
async function startLevel(page, n) {
  await page.locator(`.bk-level-tile[data-level="${n}"]`).click();
  await expect(page.locator('.bk-play')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.blokken.state?.level)).toBe(n);
  await page.locator('.bk-coach .bk-close').click({ timeout: 800 }).catch(() => {});
}
const S = page => page.evaluate(() => window.KWIZILLO_M1.blokken.state);
const level = (page, n) => page.evaluate(n => window.KWIZILLO_M1.blokkenData.level(n), n);
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem('kwizillo-state')).progress.games.blokken);

// Screen points: where to grab a piece (the middle of its first cell) and
// where that cell must go for the piece to land at board (x,y).
async function geometry(page, id) {
  // a piece that is still gliding home (FLIP) has an inline transform: wait until it is in place
  await page.waitForFunction(() => ![...document.querySelectorAll('.bk-piece')].some(e => e.style.transform));
  await page.evaluate(() => new Promise(done => {   // and until nothing moves for a few frames
    let last = '', same = 0, n = 0;
    const tick = () => { const now = [...document.querySelectorAll('.bk-piece')].map(e => { const r = e.getBoundingClientRect(); return `${r.x|0},${r.y|0}`; }).join(';'); same = now === last ? same + 1 : 0; last = now; if (same >= 3 || ++n > 100) done(); else setTimeout(tick, 20); };
    setTimeout(tick, 20);
  }));
  return page.evaluate(id => {
    const K = window.KWIZILLO_M1, D = K.blokkenData, s = K.blokken.state, lv = D.level(s.level), p = D.pieceById(lv, id);
    const rot = s.placements[id] ? s.placements[id].rot : (s.trayRot[id] || 0);
    const cells = D.rotate(p.cells, rot), { w, h } = D.dims(cells), [gx, gy] = cells[0];
    const el = document.querySelector(`.bk-piece[data-piece="${id}"]`).getBoundingClientRect();
    const b = document.querySelector('.bk-board').getBoundingClientRect();
    const root = document.querySelector('.blokken-root');
    return { from: { x: el.left + (gx + .5) * el.width / w, y: el.top + (gy + .5) * el.height / h }, gx, gy, board: { left: b.left, top: b.top, cw: b.width / lv.cols, ch: b.height / lv.rows }, scale: root.getBoundingClientRect().width / root.offsetWidth, cell: s.cell };
  }, id);
}
const target = (g, x, y) => ({ x: g.board.left + (x + g.gx + .5) * g.board.cw, y: g.board.top + (y + g.gy + .5) * g.board.ch });

async function mouseDrag(page, id, x, y, { to } = {}) {
  const g = await geometry(page, id);
  const end = to || target(g, x, y);
  await page.mouse.move(g.from.x, g.from.y);
  await page.mouse.down();
  await page.mouse.move(g.from.x + 12, g.from.y + 6, { steps: 2 });
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
}
// Touch through Pointer Events (pointerType "touch"): the piece floats above
// the finger, so the finger ends lower than the cell it aims at.
async function touchDrag(page, id, x, y, { cancel = false, to } = {}) {
  const g = await geometry(page, id);
  const lift = (g.cell * .75 + 22) * g.scale;
  const end = to || target(g, x, y);
  await page.evaluate(([from, end, lift, cancel]) => {
    const root = document.querySelector('.blokken-root');
    const fire = (el, type, p) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 41, pointerType: 'touch', isPrimary: true, clientX: p.x, clientY: p.y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
    fire(document.elementFromPoint(from.x, from.y), 'pointerdown', from);
    const to = { x: end.x, y: end.y + lift };
    for (let i = 1; i <= 8; i++) fire(root, 'pointermove', { x: from.x + (to.x - from.x) * i / 8, y: from.y + (to.y - from.y) * i / 8 });
    fire(root, cancel ? 'pointercancel' : 'pointerup', to);
  }, [g.from, end, lift, cancel]);
}
// No piece is ever lost or doubled: each id is exactly once on the screen, on the board or in the tray.
async function piecesIntact(page) {
  const r = await page.evaluate(() => {
    const K = window.KWIZILLO_M1, s = K.blokken.state, lv = K.blokkenData.level(s.level);
    return lv.pieces.map(p => ({ id: p.id, n: document.querySelectorAll(`.bk-piece[data-piece="${p.id}"]`).length, onBoard: !!document.querySelector(`.bk-on .bk-piece[data-piece="${p.id}"]`), placed: !!s.placements[p.id] }));
  });
  for (const p of r) { expect(p.n, p.id).toBe(1); expect(p.onBoard, p.id).toBe(p.placed); }
  await expect(page.locator('.bk-ghost')).toHaveCount(0);
}
async function solveBy(page, how = mouseDrag, solution) {
  const lv = await level(page, (await S(page)).level);
  for (const m of solution || lv.solution) {
    if (lv.rotate) {   // turn the tray piece to the needed orientation first
      for (let i = 0; i < 4 && ((await S(page)).trayRot[m.id] || 0) !== m.rot; i++) {
        if ((await S(page)).selected !== m.id) await page.locator(`.bk-piece[data-piece="${m.id}"]`).click();
        await page.locator('#bkRotate').click();
      }
      expect((await S(page)).trayRot[m.id] || 0).toBe(m.rot);
    }
    await how(page, m.id, m.x, m.y);
    await expect.poll(async () => !!(await S(page))?.placements?.[m.id] || (await S(page))?.phase !== 'play', { timeout: 12000, message: `level ${lv.n}: ${m.id} at ${m.x},${m.y} r${m.rot}` }).toBe(true);
  }
}

test.describe('Blokkenpret', () => {
  test('in the Spellenkist next to the other games; 10 levels, only level 1 open; back goes to the chest', async ({ page }) => {
    await boot(page);
    await page.locator('#homeChest').click();
    expect(await page.locator('.chest-pick .math-pick-tile').evaluateAll(els => els.map(e => e.id))).toEqual(['homeMemo', 'homeFacts', 'homeFotozoom', 'homeWhoAmI', 'homeBlokken']);
    await expect(page.locator('#homeBlokken')).toContainText('Blokkenpret');
    await page.locator('#homeBlokken').click();
    await expect(page.locator('.bk-level-tile')).toHaveCount(10);
    await expect(page.locator('.bk-level-tile.locked')).toHaveCount(9);
    await expect(page.locator('.bk-title')).toHaveAttribute('aria-label', 'Blokkenpret');
    await page.locator('.bk-level-tile[data-level="2"]').click({ force: true });          // locked: stays on the overview
    await expect(page.locator('.bk-levels')).toBeVisible();
    await page.locator('#bkBack').click();
    await expect(page.locator('.chest-pick')).toBeVisible();
    // the other games still open
    await page.locator('#homeMemo').click();
    await expect(page.locator('.memo-picker')).toBeVisible();
    await page.locator('.panel-back').click();
    await page.locator('.panel-back').click();
    await expect(page.locator('#homeJungle')).toBeVisible();
    await expect(page.locator('#homeChest .home-chest-mosaic img')).toHaveCount(4);
  });

  test('level 1 with the mouse: guided first piece, counter, MEGA ZET!, result, reward booked once', async ({ page }) => {
    await boot(page);
    await openLevels(page);
    await startLevel(page, 1);
    await expect(page.locator('.bk-count')).toHaveText('0 van 3 geplaatst');
    await expect(page.locator('.bk-banner')).toContainText('lichtende plek');     // guided first placement
    await expect(page.locator('.bk-hint-cell')).toHaveCount(4);
    await expect(page.locator('#bkRotate')).toBeHidden();                           // no turning before level 6
    const before = await page.evaluate(() => ({ xp: window.KWIZILLO_M1.state.xp, coins: window.KWIZILLO_M1.state.coins }));
    const lv = await level(page, 1);
    await mouseDrag(page, lv.solution[0].id, lv.solution[0].x, lv.solution[0].y);
    await expect(page.locator('.bk-count')).toHaveText('1 van 3 geplaatst');
    await expect(page.locator('.bk-hint-cell')).toHaveCount(0);
    await piecesIntact(page);
    await solveBy(page, mouseDrag, lv.solution.slice(1));
    await expect(page.locator('.bk-mega-text img.bk-emblem')).toHaveAttribute('alt', 'MEGA ZET!');   // Dutch: the drawn emblem
    await expect(page.locator('.bk-result-card')).toContainText('Level gehaald!', { timeout: 4000 });
    await expect(page.locator('#bkNext')).toBeVisible();
    await expect(page.locator('#bkAgain')).toContainText('Opnieuw spelen');
    const after = await page.evaluate(() => ({ xp: window.KWIZILLO_M1.state.xp, coins: window.KWIZILLO_M1.state.coins }));
    expect(after.xp - before.xp).toBe(13);
    expect(after.coins - before.coins).toBe(3);
    const st = await store(page);
    expect(st.done).toEqual([1]);
    expect(st.booked).toHaveLength(1);
    expect(st.attempts['1']).toBeUndefined();
    // the same attempt again never pays twice
    const again = await page.evaluate(id => window.KWIZILLO_M1.blokkenReward({ level: 1, attemptId: id, completed: true }), st.booked[0]);
    expect(again.duplicate).toBe(true);
    await page.reload();
    await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
    await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
    expect(await page.evaluate(() => window.KWIZILLO_M1.state.xp)).toBe(after.xp);
    await openLevels(page);
    await expect(page.locator('.bk-level-tile.done')).toHaveCount(1);
    await expect(page.locator('.bk-level-tile[data-level="2"]')).not.toHaveClass(/locked/);
    // replay: a new attempt, a small reward, still booked once
    await startLevel(page, 1);
    await solveBy(page, mouseDrag);
    await expect(page.locator('.bk-result-card')).toBeVisible({ timeout: 10000 });
    expect(await page.evaluate(() => window.KWIZILLO_M1.state.xp)).toBe(after.xp + 4);
    expect((await store(page)).booked).toHaveLength(2);
  });

  test('any valid full cover counts, not only the stored solution', async ({ page }) => {
    await boot(page);
    await openLevels(page);
    await startLevel(page, 1);
    const alt = await page.evaluate(() => {
      const D = window.KWIZILLO_M1.blokkenData, lv = D.level(1);
      const all = D.countSolutions(lv, 20).solutions;
      return all.find(s => s.some(m => { const o = lv.solution.find(x => x.id === m.id); return o.x !== m.x || o.y !== m.y; }));
    });
    expect(alt).toBeTruthy();
    await solveBy(page, mouseDrag, alt);
    await expect(page.locator('.bk-result-card')).toBeVisible({ timeout: 10000 });
  });

  test('invalid drops go back; placed pieces can be moved, put back and undone', async ({ page }) => {
    await boot(page, { all: true });
    await openLevels(page);
    await startLevel(page, 3);
    const lv = await level(page, 3);
    const [a, b] = lv.solution;
    await mouseDrag(page, a.id, a.x, a.y);
    expect((await S(page)).placements[a.id]).toEqual({ x: a.x, y: a.y, rot: 0 });
    // onto the piece that is already there: refused, back to the tray
    await mouseDrag(page, b.id, a.x, a.y);
    expect((await S(page)).placements[b.id]).toBeUndefined();
    await piecesIntact(page);
    // outside the figure: refused
    await mouseDrag(page, b.id, lv.cols - 1, 0);
    expect((await S(page)).placements[b.id]).toBeUndefined();
    await piecesIntact(page);
    // pick a placed piece up again and move it to another spot that fits
    const spot = await page.evaluate(([id]) => { const K = window.KWIZILLO_M1, D = K.blokkenData, lv = D.level(3), s = K.blokken.state; const rest = { ...s.placements }; delete rest[id]; const c = lv.board.find(([x, y]) => (x || y) && D.canPlace(lv, rest, id, x, y, 0)); return c; }, [a.id]);
    await mouseDrag(page, a.id, spot[0], spot[1]);
    expect((await S(page)).placements[a.id]).toEqual({ x: spot[0], y: spot[1], rot: 0 });
    await piecesIntact(page);
    // undo restores the previous spot
    await page.locator('#bkUndo').click();
    expect((await S(page)).placements[a.id]).toEqual({ x: a.x, y: a.y, rot: 0 });
    // dragged onto the tray: back in the tray
    const tray = await page.locator('.bk-tray').boundingBox();
    await mouseDrag(page, a.id, 0, 0, { to: { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 } });
    expect((await S(page)).placements[a.id]).toBeUndefined();
    await expect(page.locator('.bk-count')).toHaveText('0 van 4 geplaatst');
    await page.locator('#bkUndo').click();
    expect((await S(page)).placements[a.id]).toEqual({ x: a.x, y: a.y, rot: 0 });
    await piecesIntact(page);
  });

  test('turning from level 6: button at the piece, R key, tap again; undo restores the orientation', async ({ page }) => {
    await boot(page, { all: true });
    await openLevels(page);
    await page.locator('.bk-level-tile[data-level="6"]').click();
    await expect(page.locator('.bk-coach.rotate')).toBeVisible();                   // short intro the first time
    await page.locator('.bk-coach .bk-close').click();
    const id = (await level(page, 6)).pieces[2].id;
    const r0 = (await S(page)).trayRot[id] || 0;
    await page.locator(`.bk-piece[data-piece="${id}"]`).click();                   // select
    await expect(page.locator('#bkRotate')).toBeVisible();
    await page.locator('#bkRotate').click();
    expect((await S(page)).trayRot[id]).toBe((r0 + 1) % 4);
    await page.keyboard.press('r');
    expect((await S(page)).trayRot[id]).toBe((r0 + 2) % 4);
    await page.locator(`.bk-piece[data-piece="${id}"]`).click();                   // tap on the selected piece turns it
    expect((await S(page)).trayRot[id]).toBe((r0 + 3) % 4);
    await page.locator('#bkUndo').click();
    expect((await S(page)).trayRot[id]).toBe((r0 + 2) % 4);
    // the whole level by turning and dragging
    await page.locator('#bkRestart').click();
    await solveBy(page, mouseDrag);
    await expect(page.locator('.bk-result-card')).toBeVisible({ timeout: 10000 });
  });

  test('keyboard: select a piece, arrows, Enter places, Escape cancels', async ({ page }) => {
    await boot(page);
    await openLevels(page);
    await startLevel(page, 1);
    const lv = await level(page, 1);
    const m = lv.solution[1];
    await page.locator(`.bk-piece[data-piece="${m.id}"]`).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.bk-board.kb')).toBeVisible();
    await expect(page.locator('.bk-pv')).not.toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('.bk-board.kb')).toHaveCount(0);
    expect((await S(page)).placements[m.id]).toBeUndefined();
    await page.locator(`.bk-piece[data-piece="${m.id}"]`).focus();
    await page.keyboard.press('Enter');
    const c = await S(page);
    // move to the target with the arrow keys
    const start = await page.evaluate(() => { const b = document.querySelector('.bk-board.kb'); return !!b; });
    expect(start).toBe(true);
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
    for (let i = 0; i < m.x; i++) await page.keyboard.press('ArrowRight');
    for (let i = 0; i < m.y; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect((await S(page)).placements[m.id]).toEqual({ x: m.x, y: m.y, rot: 0 });
    await expect(page.locator(`.bk-piece[data-piece="${m.id}"]`)).toHaveAttribute('aria-label', /op het bord/);
    await piecesIntact(page);
  });

  test('touch (pointer events): drag places; pointercancel and a resize mid-drag leave every piece intact', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await boot(page, { all: true });
    await openLevels(page);
    await startLevel(page, 2);
    const lv = await level(page, 2);
    const [a, b] = lv.solution;
    await touchDrag(page, a.id, a.x, a.y);
    expect((await S(page)).placements[a.id]).toEqual({ x: a.x, y: a.y, rot: 0 });
    await touchDrag(page, b.id, b.x, b.y, { cancel: true });
    expect((await S(page)).placements[b.id]).toBeUndefined();
    await piecesIntact(page);
    // a resize in the middle of a drag: the drag is reverted, nothing is lost or doubled
    const g = await geometry(page, b.id);
    await page.mouse.move(g.from.x, g.from.y); await page.mouse.down(); await page.mouse.move(g.from.x + 30, g.from.y - 40, { steps: 4 });
    await expect(page.locator('.bk-ghost')).toHaveCount(1);
    await page.setViewportSize({ width: 430, height: 900 });
    await expect(page.locator('.bk-ghost')).toHaveCount(0);
    await page.mouse.up();
    await piecesIntact(page);
    expect(Object.keys((await S(page)).placements)).toEqual([a.id]);
    // blur in the middle of a drag
    const g2 = await geometry(page, b.id);
    await page.mouse.move(g2.from.x, g2.from.y); await page.mouse.down(); await page.mouse.move(g2.from.x + 30, g2.from.y - 40, { steps: 4 });
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.mouse.up();
    await piecesIntact(page);
    await solveBy(page, touchDrag, lv.solution.slice(1));
    await expect(page.locator('.bk-result-card')).toBeVisible({ timeout: 10000 });
  });

  test('help reads the current board: a dead end gets a take-back step, then a spot that leads to a full figure', async ({ page }) => {
    await boot(page, { all: true });
    await openLevels(page);
    await startLevel(page, 5);
    // a placement that cannot be finished (found by the solver)
    const dead = await page.evaluate(() => {
      const D = window.KWIZILLO_M1.blokkenData, lv = D.level(5);
      for (const p of lv.pieces) for (const [x, y] of lv.board) if (D.canPlace(lv, {}, p.id, x, y, 0) && !D.solve(lv, { [p.id]: { x, y, rot: 0 } }).ok) return { id: p.id, x, y };
    });
    expect(dead).toBeTruthy();
    await mouseDrag(page, dead.id, dead.x, dead.y);
    expect((await S(page)).placements[dead.id]).toBeTruthy();
    await page.locator('#bkHelp').click();
    await expect(page.locator('.bk-banner.take')).toBeVisible();
    expect((await S(page)).hint).toMatchObject({ kind: 'takeBack', id: dead.id });
    await expect(page.locator(`.bk-on .bk-piece.take[data-piece="${dead.id}"]`)).toBeVisible();
    await page.locator('.bk-banner [data-act="takeBack"]').click();
    expect((await S(page)).placements[dead.id]).toBeUndefined();
    await page.locator('#bkHelp').click();
    const h = (await S(page)).hint;
    expect(h.kind).toBe('place');
    const ok = await page.evaluate(h => { const K = window.KWIZILLO_M1, D = K.blokkenData, lv = D.level(5), s = K.blokken.state; return D.canPlace(lv, s.placements, h.id, h.x, h.y, h.rot) && D.solve(lv, { ...s.placements, [h.id]: { x: h.x, y: h.y, rot: h.rot } }).ok; }, h);
    expect(ok).toBe(true);
    await expect(page.locator('.bk-hint-cell')).toHaveCount((await level(page, 5)).pieces.find(p => p.id === h.id).cells.length);
    // placing the hinted piece clears the hint
    await mouseDrag(page, h.id, h.x, h.y);
    expect((await S(page)).hint).toBeNull();
  });

  test('BONUS BOOST!: earned by three different own placements, not farmable by re-placing or reload, used once', async ({ page }) => {
    await boot(page, { all: true });
    await openLevels(page);
    await page.locator('.bk-level-tile[data-level="4"]').click();
    await expect(page.locator('.bk-coach.boost')).toBeVisible();
    await page.locator('.bk-coach .bk-close').click();
    const lv = await level(page, 4);
    const [a, b, c, d] = lv.solution;
    await mouseDrag(page, a.id, a.x, a.y);
    // the same piece out and in again counts once
    const tray = await page.locator('.bk-tray').boundingBox();
    await mouseDrag(page, a.id, 0, 0, { to: { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 } });
    expect((await S(page)).placements[a.id]).toBeUndefined();
    await mouseDrag(page, a.id, a.x, a.y);
    expect((await S(page)).placements[a.id]).toBeTruthy();
    await mouseDrag(page, b.id, b.x, b.y);
    expect((await S(page)).boost).toMatchObject({ credited: [a.id, b.id], earned: false, available: false });
    await expect(page.locator('#bkBoost')).toBeHidden();
    // undo does not take a counted piece away from the count either
    await page.locator('#bkUndo').click();
    expect((await S(page)).boost.credited).toEqual([a.id, b.id]);
    await mouseDrag(page, b.id, b.x, b.y);
    await mouseDrag(page, c.id, c.x, c.y);
    await expect(page.locator('.bk-boost-toast img.bk-boost-art')).toHaveAttribute('alt', 'BONUS BOOST!');
    expect((await S(page)).boost).toMatchObject({ earned: true, available: true, used: false });
    await expect(page.locator('#bkBoost')).toBeVisible();
    expect(Object.keys((await S(page)).placements).sort()).toEqual([a.id, b.id, c.id].sort());
    // reload: still one boost, not two
    await page.reload();
    await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
    await openLevels(page);
    await startLevel(page, 4);
    expect((await S(page)).boost).toMatchObject({ earned: true, available: true, used: false });
    expect(Object.keys((await S(page)).placements).sort()).toEqual([a.id, b.id, c.id].sort());
    // move a piece away and back again: no second boost
    await mouseDrag(page, c.id, 0, 0, { to: { x: (await page.locator('.bk-tray').boundingBox()).x + 30, y: (await page.locator('.bk-tray').boundingBox()).y + 30 } });
    await mouseDrag(page, c.id, c.x, c.y);
    expect((await S(page)).boost.credited).toHaveLength(3);
    // use it: a spot that fits in a full continuation, shown until placed
    await page.locator('#bkBoost').click();
    const h = (await S(page)).hint;
    expect(h).toMatchObject({ kind: 'place', id: d.id, source: 'boost' });
    expect((await S(page)).boost).toMatchObject({ available: false, used: true });
    await expect(page.locator('.bk-banner.boost')).toContainText('Deze plek past!');
    await expect(page.locator('.bk-hint-cell.boost')).toHaveCount(4);
    await expect(page.locator('#bkBoost')).toBeHidden();
    // reload keeps the hint and does not give the boost back
    await page.reload();
    await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
    await openLevels(page);
    await startLevel(page, 4);
    expect((await S(page)).boost).toMatchObject({ available: false, used: true });
    expect((await S(page)).hint).toMatchObject({ kind: 'place', id: d.id });
    // restart keeps the boost state of this attempt (no new boost by restarting)
    await page.locator('#bkRestart').click();
    await page.locator('.bk-modal [data-yes]').click();
    expect((await S(page)).placements).toEqual({});
    expect((await S(page)).boost).toMatchObject({ earned: true, used: true, available: false });
    for (const m of [a, b, c]) await mouseDrag(page, m.id, m.x, m.y);
    expect((await S(page)).boost.available).toBe(false);
  });

  test('a boost on a dead end is not used up: it asks to take a piece back first', async ({ page }) => {
    const n = 5;
    await boot(page, { all: true });
    await openLevels(page);
    await startLevel(page, n);
    const lv = await level(page, n);
    // earn the boost with three own placements that lead nowhere
    const plan = await page.evaluate(n => {
      const D = window.KWIZILLO_M1.blokkenData, lv = D.level(n);
      const ids = lv.pieces.map(p => p.id);
      // search three placements with a dead end
      const rec = (pl, k) => { if (k === 3) return D.solve(lv, pl).ok ? null : pl; for (const id of ids) { if (pl[id]) continue; for (const [x, y] of lv.board) if (D.canPlace(lv, pl, id, x, y, 0)) { const r = rec({ ...pl, [id]: { x, y, rot: 0 } }, k + 1); if (r) return r; } } return null; };
      return rec({}, 0);
    }, n);
    expect(plan).toBeTruthy();
    for (const [id, p] of Object.entries(plan)) await mouseDrag(page, id, p.x, p.y);
    expect((await S(page)).boost.available).toBe(true);
    await page.locator('#bkBoost').click();
    expect((await S(page)).hint.kind).toBe('takeBack');
    expect((await S(page)).boost).toMatchObject({ available: true, used: false });
    await expect(page.locator('.bk-banner.take')).toContainText(/eerst/i);
    await page.locator('.bk-banner [data-act="takeBack"]').click();
    // still a dead end? the boost tells again; once finishable the boost shows a spot and is used
    for (let i = 0; i < 3 && (await S(page)).boost.available; i++) {
      await page.locator('#bkBoost').click();
      const h = (await S(page)).hint;
      if (h.kind === 'takeBack') await page.locator('.bk-banner [data-act="takeBack"]').click();
    }
    expect((await S(page)).boost).toMatchObject({ available: false, used: true });
    expect((await S(page)).hint.kind).toBe('place');
  });

  test('save, resume, restart and a changed level version', async ({ page }) => {
    await boot(page, { all: true });
    await openLevels(page);
    await startLevel(page, 3);
    const lv = await level(page, 3);
    await mouseDrag(page, lv.solution[0].id, lv.solution[0].x, lv.solution[0].y);
    await mouseDrag(page, lv.solution[1].id, lv.solution[1].x, lv.solution[1].y);
    const attempt = (await S(page)).attemptId;
    await page.locator('#bkBack').click();                                          // back to the games
    await expect(page.locator('.chest-pick')).toBeVisible();
    expect(await page.evaluate(() => window.KWIZILLO_M1.blokken.state)).toBeNull();  // cleaned up
    await page.keyboard.press('r');                                                 // no listener left behind
    await page.locator('#homeBlokken').click();
    await startLevel(page, 3);
    expect((await S(page)).attemptId).toBe(attempt);
    expect(Object.keys((await S(page)).placements)).toHaveLength(2);
    await expect(page.locator('.bk-count')).toHaveText('2 van 4 geplaatst');
    // restart asks first when the board is partly filled
    await page.locator('#bkRestart').click();
    await expect(page.locator('.bk-modal')).toBeVisible();
    await page.locator('.bk-modal [data-no]').click();
    expect(Object.keys((await S(page)).placements)).toHaveLength(2);
    await page.locator('#bkRestart').click();
    await page.locator('.bk-modal [data-yes]').click();
    expect((await S(page)).placements).toEqual({});
    expect((await S(page)).attemptId).toBe(attempt);
    // a saved attempt of another level version, or one with overlapping pieces, is never restored
    await page.evaluate(() => {
      const K = window.KWIZILLO_M1, b = K.progress().games.blokken;
      b.attempts['2'] = { v: 999, id: 'x1', placements: { 'b2-a': { x: 0, y: 0, rot: 0 } } };
      b.attempts['3'] = { v: K.blokkenData.LEVEL_DATA_VERSION, id: 'x2', placements: { 'b3-a': { x: 0, y: 0, rot: 0 }, 'b3-b': { x: 0, y: 0, rot: 0 } } };
      K.save();
    });
    await page.locator('#bkLevels').click();
    await startLevel(page, 2);
    expect((await S(page)).placements).toEqual({});
    expect((await S(page)).attemptId).not.toBe('x1');
    await page.locator('#bkLevels').click();
    await startLevel(page, 3);
    expect((await S(page)).placements).toEqual({});
    expect((await S(page)).attemptId).not.toBe('x2');
  });

  test('the same level is the same puzzle on a phone and a tablet, and turning the screen keeps the state', async ({ page }) => {
    const snap = () => page.evaluate(() => {
      const s = window.KWIZILLO_M1.blokken.state;
      return { cells: [...document.querySelectorAll('.bk-cell')].map(c => c.dataset.cell), pieces: [...document.querySelectorAll('.bk-piece')].map(p => p.dataset.piece).sort(), colors: [...document.querySelectorAll('.bk-piece .bk-svg path:first-child')].map(p => p.getAttribute('fill')).sort(), placements: s.placements, trayRot: s.trayRot };
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await boot(page, { all: true });
    await openLevels(page);
    await startLevel(page, 10);
    const lv = await level(page, 10);
    await mouseDrag(page, lv.pieces[0].id, 0, 0, { to: { x: 5, y: 5 } });   // a drop outside: nothing changes
    await page.locator(`.bk-piece[data-piece="${lv.pieces[1].id}"]`).click();
    await page.locator('#bkRotate').click();
    const phone = await snap();
    const phoneCell = (await S(page)).cell;
    await page.setViewportSize({ width: 1366, height: 768 });                 // the wide frame: board left, tray right
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.shape)).toBe('wide');
    const wide = await snap();
    expect(wide).toEqual(phone);
    const boxes = await page.evaluate(() => ({ b: document.querySelector('.bk-board-panel').getBoundingClientRect().toJSON(), t: document.querySelector('.bk-tray-panel').getBoundingClientRect().toJSON() }));
    expect(boxes.t.left).toBeGreaterThan(boxes.b.left + boxes.b.width - 2);    // side by side
    await page.setViewportSize({ width: 820, height: 1180 });                  // iPad upright: board on top
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.shape)).toBe('tall');
    expect(await snap()).toEqual(phone);
    const tall = await page.evaluate(() => ({ b: document.querySelector('.bk-board-panel').getBoundingClientRect().toJSON(), t: document.querySelector('.bk-tray-panel').getBoundingClientRect().toJSON() }));
    expect(tall.t.top).toBeGreaterThan(tall.b.top + tall.b.height - 2);
    expect(phoneCell).toBeGreaterThan(20);
  });

  for (const vp of [{ width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1366, height: 768 }, { width: 320, height: 568 }]) {
    test(`no horizontal overflow, tappable controls, nothing cut off at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await boot(page, { all: true });
      await openLevels(page);
      await startLevel(page, 10);
      const r = await page.evaluate(() => {
        const root = document.querySelector('.blokken-root'), R = root.getBoundingClientRect(), s = R.width / root.offsetWidth;
        const scrolls = root.querySelector('.bk-tray').classList.contains('scrolls');
        const out = [...root.querySelectorAll((scrolls ? '.bk-piece.on,' : '.bk-piece,') + '.bk-btn:not([hidden]),.bk-round,.bk-cell')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.left < R.left - 1 || b.right > R.right + 1 || b.top < R.top - 1 || b.bottom > R.bottom + 1); }).map(e => e.className);
        const small = [...root.querySelectorAll('.bk-btn:not([hidden]),.bk-round')].filter(e => { const b = e.getBoundingClientRect(); return b.height / s < 40; }).map(e => e.id || e.className);
        const tray = root.querySelector('.bk-tray'), trayCut = tray.scrollHeight > tray.clientHeight + 1 && !tray.classList.contains('scrolls');
        return { sw: document.documentElement.scrollWidth, w: innerWidth, out, small, trayCut, scale: s };
      });
      expect(r.sw).toBeLessThanOrEqual(r.w);
      expect(r.out).toEqual([]);
      expect(r.small).toEqual([]);
      expect(r.trayCut).toBe(false);
    });
  }

  test('all 10 levels: finale, golden star and the overview shows every level done', async ({ page }) => {
    test.setTimeout(300000);
    await boot(page);
    await openLevels(page);
    for (let n = 1; n <= 10; n++) {
      await startLevel(page, n);
      await solveBy(page, mouseDrag);
      await expect(page.locator('.bk-result-card')).toBeVisible({ timeout: 10000 });
      if (n < 10) { await expect(page.locator('#bkNext')).toBeVisible(); await page.locator('#bkToLevels').click(); }
    }
    await expect(page.locator('.bk-result-card.final')).toContainText('Alle 10 levels gehaald!');
    await expect(page.locator('.bk-badge-line')).toBeVisible();
    await expect(page.locator('#bkAgain')).toContainText('Speel opnieuw');
    await expect(page.locator('#bkGames')).toContainText('Terug naar spellen');
    const st = await store(page);
    expect(st.done).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(st.badge).toBe(true);
    expect(st.booked).toHaveLength(10);
    await page.locator('#bkGames').click();
    await expect(page.locator('.chest-pick')).toBeVisible();
  });

  test('sound: synthesised through the app audio context, silent when sound is off, stopped when the tab hides or the game closes', async ({ page }) => {
    await boot(page, { state: SAVED({ soundOn: true, musicOn: false }) });
    await openLevels(page);
    await startLevel(page, 1);
    await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.ctx?.state)).toBe('running');
    const lv = await level(page, 1);
    await mouseDrag(page, lv.solution[0].id, lv.solution[0].x, lv.solution[0].y);
    expect(await page.evaluate(() => window.KWIZILLO_M1.blokken.sounds)).toBeGreaterThan(0);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; });
    expect(await page.evaluate(() => window.KWIZILLO_M1.blokken.sounds)).toBe(0);
    await page.locator('.bk-sound').click();                                        // speaker: everything off
    expect(await page.evaluate(() => [window.KWIZILLO_M1.state.soundOn, window.KWIZILLO_M1.state.musicOn])).toEqual([false, false]);
    await mouseDrag(page, lv.solution[1].id, lv.solution[1].x, lv.solution[1].y);
    expect(await page.evaluate(() => window.KWIZILLO_M1.blokken.sounds)).toBe(0);
    await page.locator('.bk-sound').click();
    await page.locator('#bkUndo').click();
    expect(await page.evaluate(() => window.KWIZILLO_M1.blokken.sounds)).toBeGreaterThan(0);
    await page.locator('#bkBack').click();
    expect(await page.evaluate(() => window.KWIZILLO_M1.blokken.sounds)).toBe(0);
  });

  test('reduced motion: no animations needed, the level still completes and pays once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page);
    await openLevels(page);
    await startLevel(page, 1);
    await solveBy(page, mouseDrag);
    await expect(page.locator('.bk-result-card')).toBeVisible({ timeout: 10000 });
    expect((await store(page)).booked).toHaveLength(1);
  });

  test('Arabic: the board stays left to right, the texts are translated', async ({ page }) => {
    await boot(page, { state: SAVED({ language: 'ar' }) });
    await openLevels(page);
    await startLevel(page, 1);
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');
    expect(await page.locator('.bk-board').evaluate(e => getComputedStyle(e).direction)).toBe('ltr');
    await expect(page.locator('.bk-count')).toContainText('وضعت');
    const lv = await level(page, 1);
    await solveBy(page, mouseDrag);
    await expect(page.locator('.bk-result-card')).toContainText('MEGA ZET!', { timeout: 10000 });
  });
});
