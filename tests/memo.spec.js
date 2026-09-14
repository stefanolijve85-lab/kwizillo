const { test, expect } = require('@playwright/test');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/api/tts', route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
// Solve the board by reading the pairs from the game state.
async function solve(page) {
  const pairs = await page.evaluate(() => { const m = window.KWIZILLO_M1.memo; const by = {}; for (const c of m.cards) (by[c.pair] ||= []).push(c.id); return Object.values(by); });
  for (const [a, b] of pairs) {
    await page.locator(`[data-card="${a}"]`).click();
    await page.locator(`[data-card="${b}"]`).click();
  }
}

test('Memo opens from Home and from a world, lays out a level-1 board of 8 picture pairs', async ({ page }) => {
  await boot(page);
  await page.locator('#homeMemo').click();
  await expect(page.locator('.memo-board')).toBeVisible();
  await expect(page.locator('.memo-card')).toHaveCount(16);
  await expect(page.locator('.memo-front.word')).toHaveCount(0);
  await expect(page.locator('#memoTimer b')).toHaveText('160');   // 8 pairs x 20 s
  // From Home the board mixes every world; back goes to Home.
  const worlds = await page.evaluate(() => new Set(window.KWIZILLO_M1.memo.cards.map(c => c.q.world)).size);
  expect(worlds).toBeGreaterThan(1);
  await page.locator('#memoBack').click();
  await expect(page.locator('.home')).toBeVisible();
  await page.locator('[data-world="dieren"]').click();
  await page.locator('#worldMemo').click();
  await expect(page.locator('.memo-card')).toHaveCount(16);
  expect(await page.evaluate(() => new Set(window.KWIZILLO_M1.memo.cards.map(c => c.q.world)).size)).toBe(1);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  expect(errors).toEqual([]);
});

test('a mismatch flips back, a match stays; solving the board rewards XP, coins and a gift', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('#worldMemo').click();
  const pairs = await page.evaluate(() => { const m = window.KWIZILLO_M1.memo; const by = {}; for (const c of m.cards) (by[c.pair] ||= []).push(c.id); return Object.values(by); });
  // Mismatch: one card of pair 0 and one of pair 1.
  await page.locator(`[data-card="${pairs[0][0]}"]`).click();
  await page.locator(`[data-card="${pairs[1][0]}"]`).click();
  await expect(page.locator('.memo-card.is-open')).toHaveCount(2);
  await expect(page.locator('.memo-card.is-open')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('#memoMovesFoot')).toHaveText('1 beurten');
  // Match.
  await page.locator(`[data-card="${pairs[0][0]}"]`).click();
  await page.locator(`[data-card="${pairs[0][1]}"]`).click();
  await expect(page.locator('.memo-card.is-matched')).toHaveCount(2);
  await expect(page.locator('#memoPairs')).toHaveText('1 van 8 paren');
  for (const [a, b] of pairs.slice(1)) { await page.locator(`[data-card="${a}"]`).click(); await page.locator(`[data-card="${b}"]`).click(); }
  await expect(page.locator('.result-v2')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.result-v2')).toHaveClass(/is-pass/);
  await expect(page.locator('.result-kicker')).toHaveText('MEMO KLAAR!');
  await expect(page.locator('#resultGift')).toHaveCount(1);
  await expect(page.locator('.result-stars i.on')).toHaveCount(3);   // 9 moves for 8 pairs
  const st = await page.evaluate(() => { const K = window.KWIZILLO_M1; return { xp: K.state.xp, coins: K.state.coins, memo: K.progress().games.memo }; });
  expect(st.xp).toBe(55); expect(st.coins).toBe(8);
  expect(st.memo.played).toBe(1); expect(st.memo.won).toBe(1); expect(st.memo.best.dieren).toBe(9);
  await page.locator('#againBtn').click();
  await expect(page.locator('.memo-board')).toBeVisible();
});

test('every level pairs identical pictures; a level-6 board has 14 pairs and 9 s per pair', async ({ page }) => {
  await boot(page, SAVED({ niveau: 3 }));
  await page.locator('[data-world="aarde"]').click();
  await page.locator('#worldMemo').click();
  await expect(page.locator('.memo-card')).toHaveCount(20);
  await expect(page.locator('.memo-front.word')).toHaveCount(0);
  // Each pair shows the same picture twice, and every pair a different one.
  const srcs = await page.evaluate(() => { const m = window.KWIZILLO_M1.memo; const by = {}; for (const c of m.cards) (by[c.pair] ||= []).push(window.KWIZILLO_M1.questionArt(c.q)); return Object.values(by); });
  for (const [a, b] of srcs) expect(a).toBe(b);
  expect(new Set(srcs.map(p => p[0])).size).toBe(srcs.length);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.niveau = 6; K.save(); K.startMemo('geschiedenis'); });
  await expect(page.locator('.memo-card')).toHaveCount(28);
  await expect(page.locator('#memoTimer b')).toHaveText('126');
});

test('running out of time ends the game without reward and offers a retry', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMemo').click();
  await expect(page.locator('.memo-board')).toBeVisible();
  await page.evaluate(() => window.KWIZILLO_M1.memoFinishForTest(false));   // the interval calls this at zero
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-v2')).toHaveClass(/is-fail/);
  await expect(page.locator('.result-kicker')).toHaveText('TIJD IS OM!');
  await expect(page.locator('#resultGift')).toHaveCount(0);
  await expect(page.locator('#againBtn')).toHaveText('Probeer opnieuw');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.xp)).toBe(0);
});
