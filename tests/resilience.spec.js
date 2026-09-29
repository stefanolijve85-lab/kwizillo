// Foutsituaties (CLAUDE.md §16): no internet, slow or broken speech, a server
// that never answers, rapid and double taps, leaving a screen mid-sentence, a
// language change mid-quiz and the app going to the background. In none of them
// may the game throw, get stuck behind an overlay, count an answer twice or
// keep talking on a screen that is gone.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = {
  schemaVersion: 3, language: 'nl', name: 'Wolkje', onboardingComplete: true, tourDone: true,
  voice: 'Milo', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

// `speech` decides what the speech proxy does: 'down' (no network), 'broken'
// (200 with garbage), 'error' (500), 'hang' (never answers), or a delay in ms.
async function boot(page, speech) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, async r => {
    if (speech === 'down') return r.abort('internetdisconnected');
    if (speech === 'broken') return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: 'not audio at all' });
    if (speech === 'error') return r.fulfill({ status: 500, body: '{}' });
    if (speech === 'hang') return;                                    // never fulfilled
    await new Promise(res => setTimeout(res, speech));
    return r.fulfill({ status: 500, body: '{}' });
  });
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-state', JSON.stringify(s)); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', store: 'dev', expiresAt: new Date(Date.now() + 3e10).toISOString() })); }, SAVED);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
  return errors;
}

// Plays one question through: answer, feedback, next.
async function answerOne(page) {
  await page.locator('.answer').first().click();
  await expect(page.locator('#feedbackNext')).toBeVisible({ timeout: 8000 });
  await page.locator('#feedbackNext').click();
}

for (const speech of ['down', 'broken', 'error', 'hang', 4000]) {
  test(`speech ${speech}: the quiz still plays from start to finish`, async ({ page }) => {
    test.setTimeout(90000);
    const errors = await boot(page, speech);
    await page.evaluate(() => window.KWIZILLO_M1.startQuiz('dieren', 0));
    await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
    for (let i = 0; i < 10; i++) {
      await expect(page.locator('.answer').first()).toBeEnabled({ timeout: 8000 });
      await answerOne(page);
    }
    // The result screen, not a quiz stuck on a question.
    await expect(page.locator('#againBtn, #retryBtn').first()).toBeVisible({ timeout: 10000 });
    expect(errors, 'no script errors').toEqual([]);
  });
}

test('rapid and double taps count one answer once', async ({ page }) => {
  const errors = await boot(page, 'error');
  await page.evaluate(() => window.KWIZILLO_M1.startQuiz('ruimte', 0));
  await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
  const before = await page.evaluate(() => window.KWIZILLO_M1.quiz.score);
  // A double tap on one answer, then a tap on another before the first settled.
  await page.locator('.answer').nth(1).dblclick();
  await page.locator('.answer').nth(2).click({ force: true, noWaitAfter: true }).catch(() => {});
  await page.locator('.answer').nth(0).click({ force: true, noWaitAfter: true }).catch(() => {});
  const answered = await page.evaluate(() => Object.keys(window.KWIZILLO_M1.quiz.answeredById || {}).length);
  expect(answered).toBe(1);
  const after = await page.evaluate(() => window.KWIZILLO_M1.quiz.score);
  expect(after - before).toBeLessThanOrEqual(1);
  // Hammering "next" moves on one question, not several.
  await expect(page.locator('#feedbackNext')).toBeVisible({ timeout: 8000 });
  const idx = await page.evaluate(() => window.KWIZILLO_M1.quiz.index);
  await page.locator('#feedbackNext').click({ clickCount: 3 }).catch(() => {});
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.KWIZILLO_M1.quiz.index)).toBe(idx + 1);
  expect(errors).toEqual([]);
});

test('leaving the quiz mid-sentence leaves nothing talking', async ({ page }) => {
  const errors = await boot(page, 3000);                                   // a slow line is still on its way
  await page.evaluate(() => window.KWIZILLO_M1.startQuiz('aarde', 0));
  await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
  await page.locator('#qBack').click();
  await expect(page.locator('.native-world, .home').first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(3500);                                         // the late answer from the proxy arrives
  const playing = await page.evaluate(() => [...document.querySelectorAll('audio,video')].filter(m => !m.paused && !m.muted).length);
  expect(playing, 'no media plays on the next screen').toBe(0);
  await expect(page.locator('.feedback-card, .simple-modal')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('changing the language mid-quiz keeps the game playable', async ({ page }) => {
  const errors = await boot(page, 'error');
  await page.evaluate(() => window.KWIZILLO_M1.startQuiz('wetenschap', 0));
  await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
  await answerOne(page);
  await page.evaluate(() => { window.KWIZILLO_M1.setLanguage('en'); window.KWIZILLO_M1.showHome(); });
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('.home')).toContainText(/World|Games|Play/i);
  await page.evaluate(() => window.KWIZILLO_M1.startQuiz('wetenschap', 0));
  await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
  const q = await page.evaluate(() => window.KWIZILLO_M1.quiz.questions[0].prompt);
  expect(q).toMatch(/[a-z]/i);
  await answerOne(page);
  expect(errors).toEqual([]);
});

test('going to the background and back resumes the quiz', async ({ page }) => {
  const errors = await boot(page, 'error');
  await page.evaluate(() => window.KWIZILLO_M1.startQuiz('geschiedenis', 0));
  await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
  const hide = state => page.evaluate(s => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => s === 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await hide('hidden'); await page.waitForTimeout(600); await hide('visible');
  await expect(page.locator('.answer').first()).toBeEnabled();
  await answerOne(page);
  await expect(page.locator('.answer')).toHaveCount(4);
  expect(errors).toEqual([]);
});
