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
  // A picker first: all worlds or one of the six.
  await expect(page.locator('.memo-picker')).toBeVisible();
  await expect(page.locator('[data-memo]')).toHaveCount(7);
  await page.locator('[data-memo="mix"]').click();
  await expect(page.locator('.memo-board')).toBeVisible();
  await expect(page.locator('.memo-card')).toHaveCount(16);
  await expect(page.locator('.memo-front.word')).toHaveCount(0);
  await expect(page.locator('#memoTimer b')).toHaveText('160');   // 8 pairs x 20 s
  // From Home the board mixes every world; back goes to Home.
  const worlds = await page.evaluate(() => new Set(window.KWIZILLO_M1.memo.cards.map(c => c.q.world)).size);
  expect(worlds).toBeGreaterThan(1);
  await page.locator('#memoBack').click();
  await expect(page.locator('.memo-picker')).toBeVisible();
  await page.locator('[data-memo="dieren"]').click();
  await expect(page.locator('.memo-card')).toHaveCount(16);
  expect(await page.evaluate(() => new Set(window.KWIZILLO_M1.memo.cards.map(c => c.q.world)).size)).toBe(1);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  expect(errors).toEqual([]);
});

test('a mismatch flips back, a match stays; solving the board rewards XP, coins and a gift', async ({ page }) => {
  await boot(page);
  await page.locator('#homeMemo').click();
  await page.locator('[data-memo="dieren"]').click();
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
  await page.locator('#homeMemo').click();
  await page.locator('[data-memo="aarde"]').click();
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
  await page.locator('#homeMemo').click();
  await page.locator('[data-memo="ruimte"]').click();
  await expect(page.locator('.memo-board')).toBeVisible();
  await page.evaluate(() => window.KWIZILLO_M1.memoFinishForTest(false));   // the interval calls this at zero
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-v2')).toHaveClass(/is-fail/);
  await expect(page.locator('.result-kicker')).toHaveText('TIJD IS OM!');
  await expect(page.locator('#resultGift')).toHaveCount(0);
  await expect(page.locator('#againBtn')).toHaveText('Probeer opnieuw');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.xp)).toBe(0);
});

test('a tile whose picture fails to load retries it, and shows the word when it keeps failing', async ({ page }) => {
  // Every question picture fails the first time; one of them fails for good.
  const tried = new Map(); let doomed = null;
  await page.route(/\/assets\/questions\/q\/[^/]+\.jpg(\?.*)?$/, route => {
    const url = route.request().url().split('?')[0];
    const n = (tried.get(url) || 0) + 1; tried.set(url, n);
    if (n === 1) return route.abort();
    if (!doomed) doomed = url;               // the first retry is a board tile: doom it
    if (url === doomed) return route.abort();
    return route.continue();
  });
  await boot(page);
  await page.locator('#homeMemo').click();
  await page.locator('[data-memo="mix"]').click();
  await expect(page.locator('.memo-board')).toBeVisible();
  // The retried pictures come back (each URL was asked for at least twice)…
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.memo-front img')].filter(i => i.complete && i.naturalWidth > 0).length), { timeout: 8000 }).toBe(14);
  // …and the tile that never loads shows its word instead of a broken image.
  await expect(page.locator('.memo-front.word b')).toHaveCount(2, { timeout: 8000 });
  expect([...tried.values()].every(n => n >= 2)).toBe(true);
  const broken = await page.evaluate(() => [...document.querySelectorAll('.memo-front img')].filter(i => i.complete && i.naturalWidth === 0).length);
  expect(broken).toBe(0);
});

test('head-to-head: two players alternate every two cards, scores are kept, the higher score wins', async ({ page }) => {
  await boot(page);
  await page.locator('#homeMemo').click();
  await expect(page.locator('[data-mode="solo"]')).toHaveClass(/active/);
  await page.locator('[data-mode="duel"]').click();
  await expect(page.locator('[data-mode="duel"]')).toHaveClass(/active/);
  await page.locator('[data-memo="dieren"]').click();
  await expect(page.locator('.memo-board')).toBeVisible();
  // No clock in a duel; two score chips, player 1 (the child's name) is up.
  await expect(page.locator('#memoTimer')).toHaveCount(0);
  await expect(page.locator('.memo-player')).toHaveCount(2);
  await expect(page.locator('.memo-player.active b')).toHaveText('Mike');
  await expect(page.locator('#memoHint')).toHaveText('Mike is aan de beurt');

  const pairs = await page.evaluate(() => { const m = window.KWIZILLO_M1.memo; const by = {}; for (const c of m.cards) (by[c.pair] ||= []).push(c.id); return Object.values(by); });
  // Mike finds a pair → 1 point and, as in classic Memory, another turn.
  await page.locator(`[data-card="${pairs[0][0]}"]`).click(); await page.locator(`[data-card="${pairs[0][1]}"]`).click();
  await expect(page.locator('[data-player="0"] em')).toHaveText('1');
  await page.waitForTimeout(700);
  await expect(page.locator('.memo-player.active b')).toHaveText('Mike');
  // Mike misses (two cards of different pairs) → Speler 2's turn, no point.
  await page.locator(`[data-card="${pairs[1][0]}"]`).click(); await page.locator(`[data-card="${pairs[2][0]}"]`).click();
  await expect(page.locator('.memo-player.active b')).toHaveText('Speler 2', { timeout: 3000 });
  await expect(page.locator('#memoHint')).toHaveText('Speler 2 is aan de beurt');
  // Speler 2 takes every remaining pair: the turn never leaves a player who scores.
  for (let i = 1; i < pairs.length; i++) {
    await page.locator(`[data-card="${pairs[i][0]}"]`).click(); await page.locator(`[data-card="${pairs[i][1]}"]`).click();
    await page.waitForTimeout(650);
  }
  await expect(page.locator('.result-v2')).toBeVisible({ timeout: 5000 });
  const [s1, s2] = await page.evaluate(() => window.KWIZILLO_M1.memo.scores);
  expect([s1, s2]).toEqual([1, pairs.length - 1]);
  await expect(page.locator('.result-v2 h1')).toHaveText('Speler 2 wint!');
  await expect(page.locator('#againBtn')).toHaveText('Revanche');
  // The choice is remembered for next time.
  await page.locator('#worldBtn').click();
  await expect(page.locator('[data-mode="duel"]')).toHaveClass(/active/);
});

test('on a small phone the "all worlds" tile keeps its full height; the world grid never overlaps it', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await boot(page);
  await page.locator('#homeMemo').click();
  await expect(page.locator('.memo-pick.mix')).toBeVisible();
  const [mixBottom, gridTop, mixHeight] = await page.evaluate(() => { const a = document.querySelector('.memo-pick.mix').getBoundingClientRect(), g = document.querySelector('.memo-pick-grid').getBoundingClientRect(); return [a.bottom, g.top, a.height]; });
  expect(gridTop).toBeGreaterThanOrEqual(mixBottom);
  expect(mixHeight).toBeGreaterThan(140);
});
