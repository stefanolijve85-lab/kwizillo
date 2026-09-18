// Kwizillo Runner: the runner mounts inside the game frame in the app language
// with a level and a hero to pick (art that is not there yet falls back to the
// jungle set without a single 404), a finished run pays coins once per run id,
// and leaving it returns to Home with the runner torn down.
const { test, expect } = require('@playwright/test');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/api/tts', route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
const runner = page => page.locator('kwizillo-jungle');
const inRunner = (page, sel) => page.locator(`kwizillo-jungle ${sel}`);

test('the Home tile opens the runner in Dutch; a run ends at the finish, coins are booked once, "take my loot" goes back to Home', async ({ page }) => {
  await boot(page);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await expect(page.locator('#homeJungle')).toBeVisible();
  await page.locator('#homeJungle').click();
  await expect(runner(page)).toBeVisible({ timeout: 10000 });
  await expect(inRunner(page, '[data-act=start]')).toHaveText('Op avontuur →', { timeout: 10000 });
  await expect(inRunner(page, '.eyebrow')).toHaveText('KWIZILLO • ARCADE');
  await expect(inRunner(page, '[data-act=exit]')).toHaveText('Terug naar Kwizillo');
  // three levels and two heroes; the choice is remembered; missing art falls back silently
  const bad = []; page.on('response', r => { if (r.status() >= 400 && !r.url().includes('/api/')) bad.push(r.url()); });
  await expect(inRunner(page, '.levels button')).toHaveCount(3);
  await inRunner(page, '[data-act=level-stad]').click();
  await inRunner(page, '[data-act=hero-girl]').click();
  await expect(inRunner(page, '[data-act=level-stad]')).toHaveAttribute('aria-pressed', 'true');
  await expect(inRunner(page, '[data-act=hero-girl]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.runnerLevel, window.KWIZILLO_M1.state.runnerHero])).toEqual(['stad', 'girl']);
  await page.waitForTimeout(600);
  expect(bad).toEqual([]);
  // Kwizillo's own music manager is in charge; the runner's loop is off.
  expect(await page.evaluate(() => window.KWIZILLO_M1.jungle.game.element.audio.musicEnabled)).toBe(false);
  await expect(inRunner(page, '[data-act=music]')).toHaveText('Muziek: uit ♫');

  await inRunner(page, '[data-act=start]').click();
  await expect(inRunner(page, '.count')).toBeVisible();
  // Skip the countdown and the 40 s ride: the engine is stepped straight to the finish.
  await page.evaluate(() => {
    const el = window.KWIZILLO_M1.jungle.game.element;
    el.count = 0.001; el.run.coins = 23; el.run.time = el.run.duration - 0.02;
  });
  await expect(inRunner(page, '.finish-panel')).toBeVisible({ timeout: 8000 });
  await expect(inRunner(page, '.save-status')).toHaveText('Je munten zijn erbij gedaan.', { timeout: 8000 });
  await expect(inRunner(page, '[data-act=exit]')).toHaveText('Neem mijn buit mee');
  const booked = await page.evaluate(() => ({ coins: window.KWIZILLO_M1.state.coins, jungle: window.KWIZILLO_M1.progress().games.jungle, reward: window.KWIZILLO_M1.jungle.game.element.reward }));
  expect(booked.reward.completed).toBe(true);
  expect(booked.reward.theme).toBe('stad');
  expect(booked.reward.cardId === null || booked.reward.cardId === 'city-star').toBe(true);
  expect(booked.coins).toBe(booked.reward.coins);
  expect(booked.coins).toBeGreaterThanOrEqual(23);
  expect(booked.jungle.played).toBe(1);
  expect(booked.jungle.runs).toEqual([booked.reward.runId]);
  // The same reward again (a retried save, a replay) pays nothing.
  const again = await page.evaluate(() => { const K = window.KWIZILLO_M1; const r = K.jungleReward(K.jungle.game.element.reward); return { r, coins: K.state.coins, played: K.progress().games.jungle.played }; });
  expect(again.r.duplicate).toBe(true);
  expect(again.coins).toBe(booked.coins);
  expect(again.played).toBe(1);
  // A forged reward is refused.
  expect(await page.evaluate(() => window.KWIZILLO_M1.jungleReward({ game: 'jungle-runner', coins: 999 }))).toBeNull();

  await inRunner(page, '[data-act=exit]').click();
  await expect(page.locator('.home')).toBeVisible();
  await expect(runner(page)).toHaveCount(0);
  await expect(page.locator('.hud-chip[data-stats]').first()).toContainText(String(booked.coins));
  expect(errors).toEqual([]);
});

test('the runner speaks the app language (English), and leaving from the start panel returns Home without a reward', async ({ page }) => {
  await boot(page, SAVED({ language: 'en' }));
  await page.locator('#homeJungle').click();
  await expect(inRunner(page, '[data-act=start]')).toHaveText('Go adventure →', { timeout: 10000 });
  await expect(inRunner(page, '.levels button span').first()).toHaveText('Jungle');
  await expect(inRunner(page, '[data-act=hero-boy] span')).toHaveText('Boy');
  await expect(inRunner(page, '.pick-label').first()).toHaveText('PICK YOUR LEVEL');
  await inRunner(page, '[data-act=exit]').click();
  await expect(page.locator('.home')).toBeVisible();
  await expect(runner(page)).toHaveCount(0);
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.coins, window.KWIZILLO_M1.progress().games.jungle?.played || 0])).toEqual([0, 0]);
});

test('every jungle string exists in nl, en and pt (no silent Dutch fallback)', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const K = window.KWIZILLO_M1; const out = [];
    const SAME = new Set(['brand', 'eyebrow', 'title', 'titleA', 'titleB', 'powerDouble', 'powerMagnet', 'labelCombo', 'finish', 'jump', 'levelJungle']);
    const keys = Object.keys(K.jungleText()).filter(k => k !== 'savedNoHost' && k !== 'loadError').map(k => 'jungle.' + k).concat(['jungle.title', 'jungle.tileSub', 'jungle.loadError', 'jungle.loadErrorBody']);
    const nl = {}; K.state.language = 'nl'; for (const k of keys) { nl[k] = K.t(k); if (nl[k] === k) out.push('nl:' + k); }
    for (const lang of ['en', 'pt']) { K.state.language = lang; for (const k of keys) { if (SAME.has(k.slice(7))) continue; if (K.t(k) === nl[k]) out.push(lang + ':' + k); } }
    K.state.language = 'nl';
    return { count: keys.length, out };
  });
  expect(result.count).toBeGreaterThan(80);
  expect(result.out).toEqual([]);
});

test('the sky level lets go of the cloud path twice: the hero glides, then lands again', async ({ page }) => {
  await boot(page, SAVED({ runnerLevel: 'lucht' }));
  await page.locator('#homeJungle').click();
  await expect(inRunner(page, '[data-act=level-lucht]')).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });
  await inRunner(page, '[data-act=start]').click();
  await page.evaluate(() => { const el = window.KWIZILLO_M1.jungle.game.element; el.count = 0.001; });
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.jungle.game.element.phase)).toBe('playing');
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.jungle.game.element.run.time)).toBeGreaterThan(1.05);
  const glidingAt = async frac => page.evaluate(f => { const el = window.KWIZILLO_M1.jungle.game.element; el.run.distance = el.run.duration * (el.run.easy ? .26 : .31) * f; return new Promise(r => setTimeout(() => r(el.wasGliding), 250)); }, frac);
  expect(await glidingAt(.1)).toBe(false);
  expect(await glidingAt(.3)).toBe(true);
  await expect(inRunner(page, '.toast')).toHaveText('Vlieg!');
  expect(await glidingAt(.55)).toBe(false);
  await expect(inRunner(page, '.toast')).toHaveText('Rennen!');
  expect(await glidingAt(.75)).toBe(true);
  expect(await glidingAt(.95)).toBe(false);
});
