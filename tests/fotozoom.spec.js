// Fotozoom: a question picture zoomed in on a detail, four names, 100/75/50
// points by how far the child had to zoom out; a miss reveals and explains.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' })); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
const answer = page => page.evaluate(() => { const g = window.KWIZILLO_M1.fotozoom; return g.rounds[g.index].q.answer; });
const scale = page => page.evaluate(() => { const m = getComputedStyle(document.querySelector('#fzStage img')).transform.match(/matrix\(([^,]+)/); return m ? Number(m[1]) : 1; });

test('five rounds: zoomed-in picture, four names, fewer zoom-outs earn more, a miss zooms out and explains, the result pays XP', async ({ page }) => {
  await boot(page);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.locator('#homeFotozoom').click();
  await expect(page.locator('.fotozoom')).toBeVisible();
  await expect(page.locator('.fotozoom-answers .answer')).toHaveCount(4);
  await expect(page.locator('#fzPoints')).toHaveText('Nu 100 punten');
  await page.waitForTimeout(800);
  expect(await scale(page)).toBeGreaterThan(2.5);              // starts right in on a detail
  const labels = await page.locator('.fotozoom-answers .answer-copy').allInnerTexts();
  expect(new Set(labels).size).toBe(4);
  // Round 1: right at the first zoom → 100.
  const a1 = await answer(page);
  await page.locator(`.fotozoom-answers .answer[aria-label="${a1}"]`).click();
  await expect(page.locator('.fotozoom-verdict h2')).toContainText('+100', { timeout: 4000 });
  await expect(page.locator('.fotozoom-reveal')).toBeVisible();
  await page.locator('#fzNext').click();
  // Round 2: zoom out twice, then right → 50; the button is spent after the last step.
  await page.locator('#fzOut').click();
  await expect(page.locator('#fzPoints')).toHaveText('Nu 75 punten');
  await page.locator('#fzOut').click();
  await expect(page.locator('#fzPoints')).toHaveText('Nu 50 punten');
  await expect(page.locator('#fzOut')).toBeDisabled();
  await page.waitForTimeout(800);
  expect(await scale(page)).toBeLessThan(1.5);
  const a2 = await answer(page);
  await page.locator(`.fotozoom-answers .answer[aria-label="${a2}"]`).click();
  await expect(page.locator('.fotozoom-verdict h2')).toContainText('+50', { timeout: 4000 });
  await page.locator('#fzNext').click();
  // Round 3: wrong → the answer is named, the picture is fully shown, the explanation is there.
  const a3 = await answer(page);
  // `hasNot` looks at descendants, and the label sits on the card itself, so the
  // correct card was not excluded and the "miss" sometimes hit the right answer.
  const wrongIndex = await page.evaluate(a => [...document.querySelectorAll('.fotozoom-answers .answer')].findIndex(b => b.getAttribute('aria-label') !== a), a3);
  await page.locator('.fotozoom-answers .answer').nth(wrongIndex).click();
  await expect(page.locator('.fotozoom-verdict h2')).toContainText(a3, { timeout: 4000 });
  await expect(page.locator('.fotozoom-verdict p')).not.toHaveText('');
  await page.waitForTimeout(800);
  expect(await scale(page)).toBeCloseTo(1, 1);
  await expect(page.locator('.fotozoom-answers .answer.correct')).toHaveCount(1);
  await page.locator('#fzNext').click();
  // Rounds 4 and 5 quickly.
  for (let i = 0; i < 2; i++) {
    const a = await answer(page);
    await page.locator(`.fotozoom-answers .answer[aria-label="${a}"]`).click();
    await page.locator('#fzNext').click({ timeout: 6000 });
  }
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-kicker')).toHaveText('FOTOZOOM');
  await expect(page.locator('.result-v2 h1')).toHaveText('4 van 5 herkend!');
  const s = await page.evaluate(() => ({ xp: window.KWIZILLO_M1.state.xp, coins: window.KWIZILLO_M1.state.coins, g: window.KWIZILLO_M1.progress().games.fotozoom }));
  expect(s.g.played).toBe(1); expect(s.g.best).toBe(350);
  expect(s.xp).toBeGreaterThan(0); expect(s.coins).toBeGreaterThan(0);
  await page.locator('#homeBtn').click();
  await expect(page.locator('.home')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the timer follows the level; running out counts as a miss', async ({ page }) => {
  await boot(page, SAVED({ niveau: 6 }));
  await page.locator('#homeFotozoom').click();
  await expect(page.locator('#fzTimer')).toBeVisible();
  await page.evaluate(() => { window.KWIZILLO_M1.core.questionSeconds = () => 1; });
  await page.locator('#fzRepeat').click();                     // restarts the read-out; with a stubbed voice the timer starts at once
  await expect(page.locator('.fotozoom-verdict h2')).toContainText('De tijd is om', { timeout: 15000 });
});

test('Fotozoom in a locked world shows the Premium teaser for a free player', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, SAVED({ lastWorld: 'dieren' }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => window.KWIZILLO_M1.startFotozoom('dieren'));
  await expect(page.locator('.premium-teaser p')).toContainText('Fotozoom');
});
