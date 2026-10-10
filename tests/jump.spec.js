// Mike & Mia: Jump & Slide in the app: the Spellenkist tile, the hero and world
// pick, the controls (buttons and keys), every world played to the finish with
// the solver's plan, the reward booked once, restart, and a clean exit. The
// Runner next to it keeps working and keeps its own progress.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], games: { jungle: { played: 3, best: 42, coins: 80, runs: ['old-run'], cards: [] } } }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
async function openJump(page) {
  await page.locator('#homeJungle').click();   // the Runner tile opens the choice of runners (2026-10-10)
  await page.locator('#homeJump').click();
  await expect(page.locator('.kj-pick')).toBeVisible({ timeout: 10000 });
  await page.evaluate(() => { window.__g = window.KWIZILLO_M1.jumpForTest() });
}
const G = (page, fn, arg) => page.evaluate(([f, a]) => new Function('g', 'a', `return (${f})(g, a)`)(window.__g, a), [fn.toString(), arg]);
const startRun = (page, world = 'underwater', hero = 'mike') => G(page, (g, a) => g.start(a[0], a[1]), [world, hero]);

test('the tile is under the Runner tile, next to the Kwizillo Runner; back returns there; the child picked is remembered', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await boot(page);
  await page.locator('#homeJungle').click();
  expect(await page.locator('.runner-pick .math-pick-tile').evaluateAll(els => els.map(e => e.id))).toEqual(['homeRunnerJungle', 'homeJump']);
  await expect(page.locator('#homeJump')).toContainText('Mike & Mia');
  await page.locator('#homeJump').click();
  await expect(page.locator('.kj-pick h1')).toHaveText('Wie gaat er rennen?');
  await expect(page.locator('.kj-hero')).toHaveCount(2);
  await expect(page.locator('.kj-world')).toHaveCount(3);
  await page.locator('[data-hero=mia]').click();
  await page.locator('[data-world=space]').click();
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.jumpHero, window.KWIZILLO_M1.state.jumpWorld])).toEqual(['mia', 'space']);
  await page.locator('.kj-top [data-act=exit]').click();
  await expect(page.locator('.runner-pick')).toBeVisible();
  await expect(page.locator('kwizillo-jump')).toHaveCount(0);
  await page.reload();
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await openJump(page);
  await expect(page.locator('[data-hero=mia]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-world=space]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('controls: jump, double jump, never a third; key repeat never double-jumps; slide lowers the hitbox', async ({ page }) => {
  await boot(page);
  await openJump(page);
  await page.locator('[data-act=start]').click();
  await expect.poll(() => G(page, g => g.screen), { timeout: 6000 }).toBe('play');
  // three taps on the jump button: one jump, one double jump, nothing more
  await page.locator('#kjJump').dispatchEvent('pointerdown', { pointerId: 1, isPrimary: true });
  await page.locator('#kjJump').dispatchEvent('pointerup', { pointerId: 1 });
  await page.waitForTimeout(150);
  await page.locator('#kjJump').dispatchEvent('pointerdown', { pointerId: 2, isPrimary: true });
  await page.locator('#kjJump').dispatchEvent('pointerup', { pointerId: 2 });
  await page.locator('#kjJump').dispatchEvent('pointerdown', { pointerId: 3, isPrimary: true });
  await page.locator('#kjJump').dispatchEvent('pointerup', { pointerId: 3 });
  expect(await G(page, g => [g.run.jumpsMade, g.run.doublesMade])).toEqual([1, 1]);
  await expect.poll(() => G(page, g => g.run.p.ground), { timeout: 4000 }).toBe(true);
  // the keyboard: one press of Space, then the key's own auto-repeat
  await page.evaluate(() => {
    const k = (repeat) => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', repeat, bubbles: true, cancelable: true }));
    k(false); for (let i = 0; i < 6; i++) k(true);
  });
  await page.waitForTimeout(400);
  expect(await G(page, g => [g.run.jumpsMade, g.run.doublesMade])).toEqual([2, 1]);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })));
  await expect.poll(() => G(page, g => g.run.p.ground), { timeout: 4000 }).toBe(true);
  // slide: ArrowDown, the hitbox goes down
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', key: 'ArrowDown', bubbles: true })));
  await expect.poll(() => G(page, g => g.debug().player.h)).toBe(40);
  // the page itself never scrolls or zooms under the play field
  expect(await page.locator('kwizillo-jump').evaluate(el => getComputedStyle(el).touchAction)).toBe('none');
});

for (const world of ['underwater', 'candy', 'space']) {
  test(`${world}: the solver's plan finishes the level in the app; the reward is booked exactly once`, async ({ page }) => {
    test.setTimeout(90000);
    await boot(page);
    await openJump(page);
    const before = await page.evaluate(() => ({ coins: window.KWIZILLO_M1.state.coins, jungle: JSON.stringify(window.KWIZILLO_M1.progress().games.jungle) }));
    await startRun(page, world, world === 'candy' ? 'mia' : 'mike');
    await page.evaluate(async w => { const m = await import('/assets/games/jump/solver.js'); window.__g.autoplay(m.solve(w).plan) }, world);
    const end = await G(page, g => g.fastForward(60));
    expect(end.phase).toBe('finish');
    expect(end.t).toBeGreaterThan(36); expect(end.t).toBeLessThan(44);
    await expect(page.locator('.kj-card h1')).toHaveText('Gehaald!', { timeout: 8000 });
    await expect(page.locator('.kj-card')).toContainText('munten');
    const after = await page.evaluate(() => ({ coins: window.KWIZILLO_M1.state.coins, jump: window.KWIZILLO_M1.progress().games.jump, jungle: JSON.stringify(window.KWIZILLO_M1.progress().games.jungle) }));
    const reward = await G(page, g => g.reward);
    expect(reward.completed).toBe(true);
    expect(after.coins - before.coins).toBe(reward.stars + 10);
    expect(after.jump.runs).toContain(reward.runId);
    expect(after.jump.best[world]).toBe(reward.score);
    expect(after.jungle).toBe(before.jungle);   // the Runner's progress is untouched
    // a replayed callback, or the result screen asked again, pays nothing
    expect(await page.evaluate(r => window.KWIZILLO_M1.jumpReward(r), reward)).toMatchObject({ duplicate: true, coins: 0 });
    await G(page, g => g.showResults());
    expect(await page.evaluate(() => window.KWIZILLO_M1.state.coins)).toBe(after.coins);
    // "next world" when there is one
    await expect(page.locator('.kj-card [data-act=next]')).toHaveCount(world === 'space' ? 0 : 1);
  });
}

test('nobody runs before Go: during the countdown and while paused the child stands idle and nothing scrolls', async ({ page }) => {
  await boot(page);
  await openJump(page);
  expect(await page.locator('.kj-hero canvas').count()).toBe(2);   // the cards show the idle pose (drawn once, not animated)
  await page.locator('[data-act=start]').click();
  await expect.poll(() => G(page, g => g.screen)).toBe('count');
  await page.waitForTimeout(250);
  const a = await G(page, g => ({ x: g.run.p.x, cam: g.debug().camera.x, pose: g.debug().pose, t: g.run.t }));
  await page.waitForTimeout(700);
  const b = await G(page, g => ({ x: g.run.p.x, cam: g.debug().camera.x, pose: g.debug().pose, t: g.run.t, screen: g.screen }));
  expect(b.screen).toBe('count');
  expect([a.pose, b.pose]).toEqual(['idle', 'idle']);
  expect(b.x).toBe(a.x); expect(b.cam).toBe(a.cam); expect(b.t).toBe(0);
  await expect.poll(() => G(page, g => g.screen), { timeout: 4000 }).toBe('play');
  await expect.poll(() => G(page, g => g.debug().pose)).toBe('run');
  await expect.poll(() => G(page, g => g.run.p.x)).toBeGreaterThan(a.x);
  // paused: idle, frozen
  await page.locator('.kj-pause').click();
  const p1 = await G(page, g => ({ x: g.run.p.x, cam: g.debug().camera.x }));
  await page.waitForTimeout(400);
  expect(await G(page, g => ({ x: g.run.p.x, cam: g.debug().camera.x }))).toEqual(p1);
  expect(await G(page, g => g.debug().pose)).toBe('idle');
});

test('a hit costs one heart; restart resets the child, time, stars and camera; game over shows "try again" and pays nothing', async ({ page }) => {
  await boot(page);
  await openJump(page);
  await startRun(page, 'underwater');
  // no presses: the first crate stops the child, the urchin after... skip ahead with the first press only
  await G(page, g => g.fastForward(4.8));
  await G(page, g => g.press('jump'));
  await G(page, g => g.fastForward(5));
  const mid = await G(page, g => ({ t: g.run.t, stars: g.run.stars, x: g.run.p.x }));
  expect(mid.stars).toBeGreaterThan(0);
  // run into the next things without pressing: hearts go one at a time
  const hearts = [];
  for (let i = 0; i < 40 && hearts.length < 2; i++) { await G(page, g => g.fastForward(.25)); const h = await G(page, g => g.run.hearts); if (h < 3 && !hearts.includes(h)) hearts.push(h) }
  expect(hearts[0]).toBe(2);
  await page.locator('.kj-pause').click();
  await expect(page.locator('[data-act=restart]')).toBeVisible();
  await page.locator('[data-act=restart]').click();
  const fresh = await G(page, g => ({ t: g.run.t, stars: g.run.stars, hearts: g.run.hearts, x: g.run.p.x, start: g.level.start.x, hits: g.run.hits, particles: g.debug().particles }));
  expect(fresh).toMatchObject({ t: 0, stars: 0, hearts: 3, hits: 0, particles: 0 });
  expect(fresh.x).toBe(fresh.start);
  // play on without pressing anything: the run ends as game over or stuck at a wall; force the end
  const coins = await page.evaluate(() => window.KWIZILLO_M1.state.coins);
  await G(page, g => { g.fastForward(.1); g.run.hearts = 1; g.run.p.y = g.level.killY + 10; g.fastForward(.1) });
  expect(await G(page, g => g.run.endedBy)).toBe('over');
  await G(page, g => g.fastForward(2));
  await expect(page.locator('.kj-card h1')).toHaveText('Bijna! Probeer het nog eens', { timeout: 6000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.coins)).toBe(coins);
  expect(await G(page, g => g.run.endedBy)).toBe('over');
});

test('leaving cleans up: no loop, no listeners, no observers — by the back button and by another screen', async ({ page }) => {
  await boot(page);
  await openJump(page);
  await startRun(page, 'candy');
  await page.waitForTimeout(300);
  expect(await G(page, g => g.debug().raf)).toBe(true);
  await page.locator('.kj-pause').click();
  await page.locator('[data-act=exit]').click();
  await expect(page.locator('.runner-pick')).toBeVisible();
  expect(await G(page, g => g.debug())).toMatchObject({ raf: false, live: { raf: 0, listeners: 0, observers: 0 } });
  await expect(page.locator('kwizillo-jump')).toHaveCount(0);
  // again, but leave by replacing the screen (the bottom bar, the Android back button)
  await page.locator('#homeJump').click();
  await expect(page.locator('.kj-pick')).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => { window.__g = window.KWIZILLO_M1.jumpForTest() });
  await startRun(page, 'space');
  await page.waitForTimeout(200);
  await page.evaluate(() => window.KWIZILLO_M1.showHome());
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('kwizillo-jump')).toHaveCount(0);
  expect(await G(page, g => g.debug().live)).toEqual({ raf: 0, listeners: 0, observers: 0 });
});

test('own sounds: a set per child, none from the Runner; the hero set follows the chosen child', async ({ page }) => {
  const asked = []; page.on('request', r => { if (r.url().includes('/sfx/')) asked.push(new URL(r.url()).pathname) });
  await boot(page, SAVED({ soundOn: true }));
  await openJump(page);
  const played = await page.evaluate(() => { const K = window.KWIZILLO_M1, out = [], play = K.sfx; K.sfx = k => { out.push(k); return play(k) }; window.__played = out; return true });
  await startRun(page, 'underwater', 'mia');
  await G(page, g => { g.press('jump'); g.tick(.25); g.press('jump'); g.tick(.1) });
  await startRun(page, 'underwater', 'mike');
  await G(page, g => { g.press('jump'); g.tick(.1) });
  const keys = await page.evaluate(() => window.__played);
  expect(keys).toEqual(expect.arrayContaining(['jmm_mia_jump', 'jmm_mia_double', 'jmm_mike_jump']));
  expect(keys.filter(k => k === 'jmm_mike_jump').length).toBe(1);
  expect(asked.filter(u => u.includes('/jungle/'))).toEqual([]);
  const status = await page.evaluate(async () => (await Promise.all(['mike-jump', 'mia-double', 'star', 'go'].map(n => fetch('/assets/games/jump/sfx/' + n + '.mp3').then(r => r.status)))));
  expect(status).toEqual([200, 200, 200, 200]);
});

test('the Runner tile still opens the Kwizillo Runner (via the choice of runners)', async ({ page }) => {
  await boot(page);
  await page.locator('#homeJungle').click(); await page.locator('#homeRunnerJungle').click();
  await expect(page.locator('kwizillo-jungle')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('kwizillo-jump')).toHaveCount(0);
});

test('Arabic: the menus read right to left, the play field stays left to right', async ({ page }) => {
  await boot(page, SAVED({ language: 'ar' }));
  await openJump(page);
  await expect(page.locator('kwizillo-jump')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.kj-pick h1')).toHaveText('من سيركض؟');
  await startRun(page);
  expect(await page.locator('.kj-controls').evaluate(el => getComputedStyle(el).direction)).toBe('ltr');
  const [slide, jump] = [await page.locator('#kjSlide').boundingBox(), await page.locator('#kjJump').boundingBox()];
  expect(jump.x).toBeGreaterThan(slide.x);   // jump stays the outer button on the right
});
