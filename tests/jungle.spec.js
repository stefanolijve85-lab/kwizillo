// Jungle Runner: the arcade runner mounts inside the game frame in the app
// language, a finished run pays coins once per run id, and leaving it returns
// to Home with the runner torn down.
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
  await expect(inRunner(page, '.themes button span').first()).toHaveText('Waterfalls');
  await expect(inRunner(page, '.legend span').first()).toHaveText('🧲 Magnet');
  await inRunner(page, '[data-act=exit]').click();
  await expect(page.locator('.home')).toBeVisible();
  await expect(runner(page)).toHaveCount(0);
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.coins, window.KWIZILLO_M1.progress().games.jungle?.played || 0])).toEqual([0, 0]);
});

test('every jungle string exists in nl, en and pt (no silent Dutch fallback)', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(() => {
    const K = window.KWIZILLO_M1; const out = [];
    const SAME = new Set(['brand', 'eyebrow', 'title', 'titleA', 'titleB', 'powerDouble', 'powerMagnet', 'labelCombo', 'finish', 'jump']);
    const keys = Object.keys(K.jungleText()).filter(k => k !== 'savedNoHost' && k !== 'loadError').map(k => 'jungle.' + k).concat(['jungle.title', 'jungle.tileSub', 'jungle.loadError', 'jungle.loadErrorBody']);
    const nl = {}; K.state.language = 'nl'; for (const k of keys) { nl[k] = K.t(k); if (nl[k] === k) out.push('nl:' + k); }
    for (const lang of ['en', 'pt']) { K.state.language = lang; for (const k of keys) { if (SAME.has(k.slice(7))) continue; if (K.t(k) === nl[k]) out.push(lang + ':' + k); } }
    K.state.language = 'nl';
    return { count: keys.length, out };
  });
  expect(result.count).toBeGreaterThan(80);
  expect(result.out).toEqual([]);
});
