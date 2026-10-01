const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED(), tts = route => route.fulfill({ status: 503, body: '{}' })) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, tts);
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' }));  if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
const currentAnswer = page => page.evaluate(() => { const m = window.KWIZILLO_M1.math; return m.sums[m.index].answer; });

test('Maths opens from Home and a world; level 1 shows small sums with four options and no counting dots', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await boot(page);
  await page.locator('#homeMath').click();
  await expect(page.locator('.math-card')).toBeVisible();
  await expect(page.locator('.math-answers .answer')).toHaveCount(4);
  await expect(page.locator('.math-visual')).toHaveCount(0);   // no dots under the sum, at any level
  const sum = await page.evaluate(() => window.KWIZILLO_M1.math.sums.map(s => s));
  expect(sum.length).toBe(10);
  for (const s of sum) { expect(['+', '-']).toContain(s.op); expect(s.a).toBeGreaterThan(0); expect(s.b).toBeGreaterThan(0); expect(s.answer).toBeGreaterThanOrEqual(0); expect(s.answer).toBeLessThanOrEqual(10); expect(new Set(s.options).size).toBe(4); expect(s.options).toContain(s.answer); }
  // Rekenen wordt vanaf Home gestart, dus terug gaat naar Home — niet naar het
  // wereldscherm van de wereld waar de sommen vandaan kwamen.
  await page.locator('#mathBack').click();
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('#worldMath')).toHaveCount(0);   // games live on Home, not on the world page
  expect(errors).toEqual([]);
});

test('a right answer rewards and moves on; a wrong one shows the answer; the round is passed or failed by the level rule', async ({ page }) => {
  await boot(page);
  await page.locator('#homeMath').click();
  const a = await currentAnswer(page);
  await page.locator(`.answer[data-a="${a}"]`).click();
  // The highlight and the feedback appear together and the round moves on by
  // itself, so the highlight is looked for first: after waiting for the
  // feedback it can already have gone.
  await expect(page.locator('.answer.correct')).toHaveCount(1);
  await expect(page.locator('.math-feedback.is-good')).toBeVisible();
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

test('Back revisits an answered sum with its verdict; the operator sits on the centre line', async ({ page }) => {
  await boot(page);
  await page.locator('#homeMath').click();
  await expect(page.locator('#mathPrev')).toBeDisabled();
  const [centre, screen] = await page.evaluate(() => { const r = document.querySelector('.math-sum em').getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(innerWidth / 2)]; });
  expect(Math.abs(centre - screen)).toBeLessThanOrEqual(2);
  const first = (await page.locator('.math-sum').textContent()).replace(/=.*$/, '');
  const a = await currentAnswer(page);
  await page.locator(`.answer[data-a="${a}"]`).click();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Som 2 van 10', { timeout: 4000 });
  await page.locator('#mathPrev').click();
  expect((await page.locator('.math-sum').textContent()).replace(/=.*$/, '')).toBe(first);
  await expect(page.locator('.answer.correct')).toHaveCount(1);
  await expect(page.locator('.math-eq strong')).toHaveText(String(a));
  await expect(page.locator('#mathTimer')).toHaveCount(0);
  await page.locator('#mathNext').click();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Som 2 van 10');
  await expect(page.locator('#mathTimer')).toBeVisible();
});

test('levels change the kind of sums: tables at level 4, halves and percentages at level 6; level 6 allows no mistakes', async ({ page }) => {
  await boot(page, SAVED({ niveau: 4 }));
  await page.locator('#homeMath').click();
  let sums = await page.evaluate(() => window.KWIZILLO_M1.math.sums);
  expect(sums.some(s => s.op === '×' || s.op === '÷')).toBe(true);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.niveau = 6; K.save(); K.startMath('aarde'); });
  sums = await page.evaluate(() => window.KWIZILLO_M1.math.sums);
  expect(sums.every(s => /½|¼|%|\+ \d+ × \d+/.test(s.text))).toBe(true);
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

test('after an answer the voice names the chosen number, then the feedback line', async ({ page }) => {
  const spoken = [];
  await boot(page, SAVED({ voice: 'Milo' }), route => { spoken.push(ttsPayload(route.request()).text); route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(32) }); });
  await page.locator('#homeMath').click();
  await expect(page.locator('.math-sum')).toBeVisible();
  const btn = page.locator('.answer[data-a]').first();
  const chosen = await btn.getAttribute('data-a');
  // Numbers are spoken as words, in pieces from a closed set ("driehonderd",
  // "zevenenveertig"), so compare with the last piece of the spelled form.
  const word = await page.evaluate(n => window.KWIZILLO_M1.core.numberParts(Number(n), 'nl').at(-1), chosen);
  // The options are warmed two at a time while the sum is read; wait for that to
  // reach this one, so what follows measures the click and not the queue.
  await expect.poll(() => spoken.includes(word), { timeout: 20000 }).toBe(true);
  const before = spoken.length;
  await btn.click();
  await expect(page.locator('#mathFeedback')).toBeVisible();
  // The four options were warmed while the sum was read; the click itself
  // adds no new request for the number, and the feedback line follows.
  expect(spoken.slice(0, before)).toContain(word);
  await expect.poll(() => spoken.slice(before).some(t => /^Bijna\. Het is|!$/.test(t))).toBe(true);
});

test('a round never repeats a sum, and the next rounds do not bring the previous sums straight back', async ({ page }) => {
  await boot(page);
  const texts = async () => page.evaluate(() => { window.KWIZILLO_M1.startMath('ruimte'); return window.KWIZILLO_M1.math.sums.map(s => s.text); });
  let prev = [];
  for (let round = 0; round < 6; round++) {
    const cur = await texts();
    expect(cur.length).toBe(10);
    expect(new Set(cur).size).toBe(10);
    for (const s of cur) expect(prev).not.toContain(s);
    prev = cur;
  }
});

test('leaving right after an answer and opening another game does not pull Rekenen back', async ({ page }) => {
  await boot(page);
  await page.locator('#homeMath').click();
  await expect(page.locator('.math-card')).toBeVisible();
  const answer = await currentAnswer(page);
  await page.locator(`.math-answers .answer[data-a="${answer}"]`).click();
  // Straight back, while the verdict is still showing, then another game.
  await page.locator('#mathBack').click();
  await expect(page.locator('.home')).toBeVisible();
  await page.locator('#homeMemo').click();
  await expect(page.locator('.math-card')).toHaveCount(0);
  await page.waitForTimeout(4000);   // past the 3.4 s the next sum used to wait for
  await expect(page.locator('.math-card')).toHaveCount(0);
  await expect(page.locator('.math')).toHaveCount(0);
});
