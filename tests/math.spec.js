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
const currentAnswer = page => page.evaluate(() => { const m = window.KWIZILLO_M1.math; return m.sums[m.index].answer; });

test('Maths opens from Home and a world; level 1 shows small sums with counting dots and four options', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await boot(page);
  await page.locator('#homeMath').click();
  await expect(page.locator('.math-card')).toBeVisible();
  await expect(page.locator('.math-answers .answer')).toHaveCount(4);
  await expect(page.locator('.math-visual')).toBeVisible();
  const sum = await page.evaluate(() => window.KWIZILLO_M1.math.sums.map(s => s));
  expect(sum.length).toBe(10);
  for (const s of sum) { expect(['+', '-']).toContain(s.op); expect(s.answer).toBeGreaterThanOrEqual(0); expect(s.answer).toBeLessThanOrEqual(10); expect(new Set(s.options).size).toBe(4); expect(s.options).toContain(s.answer); }
  await page.locator('#mathBack').click();
  await expect(page.locator('.native-world')).toBeVisible();
  await page.locator('#worldMath').click();
  await expect(page.locator('.math-card')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a right answer rewards and moves on; a wrong one shows the answer; the round is passed or failed by the level rule', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('#worldMath').click();
  const a = await currentAnswer(page);
  await page.locator(`.answer[data-a="${a}"]`).click();
  await expect(page.locator('.math-feedback.is-good')).toBeVisible();
  await expect(page.locator('.answer.correct')).toHaveCount(1);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Som 2 van 10', { timeout: 4000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.xp)).toBe(10);
  // Wrong answer: the right one is shown.
  const b = await currentAnswer(page);
  const wrong = await page.locator('.math-answers .answer').evaluateAll((els, b) => els.map(e => Number(e.dataset.a)).find(v => v !== b), b);
  await page.locator(`.answer[data-a="${wrong}"]`).click();
  await expect(page.locator('.math-feedback.is-try')).toContainText(String(b));
  await expect(page.locator('.quiz-progress strong')).toHaveText('Som 3 van 10', { timeout: 4000 });
  // Finish the round with correct answers: passed at level 1.
  for (let i = 2; i < 10; i++) {
    const v = await currentAnswer(page);
    await page.locator(`.answer[data-a="${v}"]`).click();
    if (i < 9) await expect(page.locator('.quiz-progress strong')).toHaveText(`Som ${i + 2} van 10`, { timeout: 4000 });
  }
  await expect(page.locator('.result-v2')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.result-v2')).toHaveClass(/is-pass/);
  await expect(page.locator('.result-v2 h1')).toHaveText('9 van 10 sommen goed!');
  const st = await page.evaluate(() => window.KWIZILLO_M1.progress().games.math);
  expect(st.played).toBe(1); expect(st.won).toBe(1); expect(st.best[1]).toBe(9);
});

test('levels change the kind of sums: tables at level 4, halves and percentages at level 6; level 6 allows no mistakes', async ({ page }) => {
  await boot(page, SAVED({ niveau: 4 }));
  await page.locator('#homeMath').click();
  let sums = await page.evaluate(() => window.KWIZILLO_M1.math.sums);
  expect(sums.some(s => s.op === '×' || s.op === '÷')).toBe(true);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.niveau = 6; K.save(); K.startMath('aarde'); });
  sums = await page.evaluate(() => window.KWIZILLO_M1.math.sums);
  expect(sums.every(s => /helft|kwart|%|\+ \d+ × \d+/.test(s.text))).toBe(true);
  await expect(page.locator('#mathTimer b')).toHaveText('10');
  await expect(page.locator('.math-visual')).toHaveCount(0);
  // One wrong answer at level 6 fails the round.
  const a = await currentAnswer(page);
  const wrong = await page.locator('.math-answers .answer').evaluateAll((els, a) => els.map(e => Number(e.dataset.a)).find(v => v !== a), a);
  await page.locator(`.answer[data-a="${wrong}"]`).click();
  await page.evaluate(() => window.KWIZILLO_M1.mathFinishForTest());
  await expect(page.locator('.result-v2')).toHaveClass(/is-fail/);
  await expect(page.locator('#againBtn')).toHaveText('Probeer opnieuw');
});
