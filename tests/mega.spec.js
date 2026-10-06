// The Mega Quiz: a big button on Home, Premium, twenty questions from every
// world taking turns, its own quiz number and a result that offers the next one.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
const PREMIUM = JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' });
async function boot(page, { premium = true, state = SAVED() } = {}) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(([s, p]) => { localStorage.setItem('kwizillo-fresh-start', '0'); if (p) localStorage.setItem('kwizillo-entitlement', p); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, [state, premium ? PREMIUM : null]);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
async function answerAll(page, n) {
  for (let i = 0; i < n; i++) {
    await expect(page.locator('.answer')).toHaveCount(4);
    const answer = await page.evaluate(() => { const q = window.KWIZILLO_M1.quiz; return q.questions[q.index].answer; });
    await page.locator(`.answer[data-a="${encodeURIComponent(answer)}"]`).click();
    await page.locator('#feedbackNext').click();
    const hello = page.locator('.mascot-unlock-ok');
    if (await hello.count()) await hello.click();
  }
}

test('free: the Mega Quiz button is on Home with a lock and opens the Premium teaser', async ({ page }) => {
  await boot(page, { premium: false });
  const mega = page.locator('#homeMega');
  await expect(mega).toBeVisible();
  await expect(mega).toContainText('Mega Quiz');
  await expect(mega).toContainText('80 vragen uit alle werelden');
  await expect(mega).toHaveClass(/locked/);
  await expect(mega.locator('.premium-badge')).toBeVisible();
  await expect(mega.locator('.home-world-level')).toHaveText('Niveau 1');   // like the world tiles
  await expect(mega.locator('.home-mega-go')).toHaveCount(0);
  // it sits above the worlds
  const [m, w] = [await mega.boundingBox(), await page.locator('.home-world').first().boundingBox()];
  expect(m.y).toBeLessThan(w.y);
  await mega.click();
  await expect(page.locator('.premium-teaser p')).toContainText('Mega Quiz');
  expect(await page.evaluate(() => window.KWIZILLO_M1.quiz?.mega)).toBeFalsy();
});

test('Premium: eighty questions, ten from every world, taking turns; the result offers the next Mega Quiz with new questions; back goes Home', async ({ page }) => {
  test.setTimeout(300000);
  await boot(page);
  await expect(page.locator('#homeMega .premium-badge')).toHaveCount(0);
  await page.locator('#homeMega').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 1 van 80');
  await expect(page.locator('.quiz-brand small')).toHaveText('Mega Quiz · Quiz 1');
  const first = await page.evaluate(() => window.KWIZILLO_M1.quiz.questions.map(q => ({ id: q.id, world: q.world })));
  expect(first).toHaveLength(80);
  const worlds = await page.evaluate(() => window.KWIZILLO_M1.playableWorlds());
  const per = {}; for (const q of first) per[q.world] = (per[q.world] || 0) + 1;
  expect(Object.keys(per).sort()).toEqual([...worlds].sort());
  expect(Object.values(per).every(n => n === 10)).toBe(true);
  for (let i = 1; i < 80; i++) expect(first[i].world).not.toBe(first[i - 1].world);
  // the background follows the world of the question
  await expect(page.locator('.quiz-v2')).toHaveClass(new RegExp(`quiz-world-${first[0].world}`));

  await answerAll(page, 80);
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-v2 h1')).toContainText('80');
  await expect(page.locator('.result-rule')).toContainText(`Vragen uit alle ${worlds.length} werelden`);
  await expect(page.locator('#againBtn')).toHaveText('Nog een Mega Quiz');
  // every answer counted for the world it came from; the per-world best scores (out of 10) are left alone
  const st = await page.evaluate(() => { const K = window.KWIZILLO_M1; return { answered: K.state.answered, correct: K.state.correct, best: K.state.bestScores || {}, run: K.progress().runs.mega }; });
  expect([st.answered, st.correct]).toEqual([80, 80]);
  expect(st.best.mega).toBeUndefined();
  expect([st.run.best, st.run.played, st.run.total]).toEqual([80, 1, 80]);

  // the collection and the statistics show it
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('worlds'));
  await expect(page.locator('#megaProgress')).toContainText('Mega Quiz');
  await expect(page.locator('#megaProgress')).toContainText('1 keer gespeeld · beste 80 van 80');
  await page.evaluate(() => window.KWIZILLO_M1.showStats());
  await expect(page.locator('.game-stat', { hasText: 'Mega Quiz' })).toContainText('80/80');
  // and the collection row starts the next one
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('worlds'));
  await page.locator('#megaProgress').click();

  await expect(page.locator('.quiz-brand small')).toHaveText('Mega Quiz · Quiz 2');
  const second = await page.evaluate(() => window.KWIZILLO_M1.quiz.questions.map(q => q.id));
  expect(second.filter(id => first.some(q => q.id === id))).toEqual([]);
  await page.locator('#qBack').click();
  await expect(page.locator('.home')).toBeVisible();
});
