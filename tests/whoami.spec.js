// "Wat ben ik?": clues one at a time, four picture tiles, 100/75/50 points by
// how many clues were needed, a miss still teaches, rewards at the end.
const { test, expect } = require('@playwright/test');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/api/tts', route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' })); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
const answer = page => page.evaluate(() => { const g = window.KWIZILLO_M1.whoami; return g.rounds[g.index].q.answer; });

test('five rounds of clues and pictures; earlier guesses earn more; a wrong pick shows the answer and explanation; the result rewards XP and coins', async ({ page }) => {
  await boot(page);
  await page.locator('#homeWhoAmI').click();
  await expect(page.locator('.whoami')).toBeVisible();
  await expect(page.locator('.whoami-tile')).toHaveCount(4);
  await expect(page.locator('#whoClues p')).toHaveCount(2);           // one clue + "Wat ben ik?"
  await expect(page.locator('#whoPoints')).toHaveText('Nu 100 punten');
  // The answer word never appears in a clue, and the tiles are four different things.
  const a1 = await answer(page);
  const clueText = await page.locator('#whoClues').innerText();
  expect(clueText.toLowerCase()).not.toContain(a1.replace(/^(de|het|een)\s+/i, '').toLowerCase());
  const labels = await page.locator('.whoami-tile b').allInnerTexts();
  expect(new Set(labels).size).toBe(4);
  // Round 1: guess right after the first clue → 100.
  await page.locator(`.whoami-tile[aria-label="${a1}"]`).click();
  await expect(page.locator('.whoami-verdict h2')).toContainText('+100');
  await page.locator('#whoNext').click();
  // Round 2: ask for a second clue, then guess right → 75.
  await page.locator('#whoMore').click();
  await expect(page.locator('#whoPoints')).toHaveText('Nu 75 punten');
  await expect(page.locator('#whoClues p')).toHaveCount(3);
  const a2 = await answer(page);
  await page.locator(`.whoami-tile[aria-label="${a2}"]`).click();
  await expect(page.locator('.whoami-verdict h2')).toContainText('+75');
  await page.locator('#whoNext').click();
  // Round 3: a wrong pick — the right tile lights up, the card names the answer and explains.
  const a3 = await answer(page);
  const wrong = page.locator('.whoami-tile').filter({ hasNot: page.locator(`[aria-label="${a3}"]`) }).first();
  const wrongLabel = (await page.locator('.whoami-tile b').allInnerTexts()).find(l => l !== a3);
  await page.locator(`.whoami-tile[aria-label="${wrongLabel}"]`).click();
  await expect(page.locator('.whoami-verdict h2')).toContainText(`Bijna! Het was ${a3}.`);
  await expect(page.locator(`.whoami-tile[aria-label="${a3}"]`)).toHaveClass(/correct/);
  await expect(page.locator('.whoami-verdict p')).not.toBeEmpty();
  await page.locator('#whoNext').click();
  for (let i = 0; i < 2; i++) { const a = await answer(page); await page.locator(`.whoami-tile[aria-label="${a}"]`).click(); await page.locator('#whoNext').click(); }
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-v2 h1')).toHaveText('4 van 5 geraden!');
  await expect(page.locator('.result-rule')).toContainText('375 van 500 punten');
  const s = await page.evaluate(() => ({ xp: window.KWIZILLO_M1.state.xp, coins: window.KWIZILLO_M1.state.coins, best: window.KWIZILLO_M1.progress().games.whoami.best }));
  expect(s.xp).toBeGreaterThan(0); expect(s.coins).toBeGreaterThan(0); expect(s.best).toBe(375);
});

test('every world has enough material in every language', async ({ page }) => {
  await boot(page);
  const counts = await page.evaluate(() => {
    const K = window.KWIZILLO_M1; const out = {};
    for (const lang of ['nl', 'en', 'pt']) { K.setLanguage(lang); K.useBank(); for (const w of ['ruimte', 'dieren', 'aarde', 'geschiedenis', 'wetenschap', 'mysterie']) { K.startWhoAmI(w); out[`${lang}:${w}`] = K.whoami.rounds.length; } }
    return out;
  });
  for (const [k, n] of Object.entries(counts)) expect(n, k).toBe(5);
});
