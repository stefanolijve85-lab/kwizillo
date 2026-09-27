// How fast the guide starts talking. The line a child is waiting for is asked
// for first and streamed, so playback can start on the first chunk instead of
// after the whole clip; every other line of the sequence is fetched at the same
// moment and is ready long before its turn.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = {
  schemaVersion: 3, language: 'nl', name: 'Wolkje', onboardingComplete: true, tourDone: true,
  voice: 'Milo', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

async function boot(page, onTts) {
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, onTts);
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
  }, SAVED);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
}

test('the question is streamed and goes out first; the answers follow as ordinary requests', async ({ page }) => {
  const asked = [];
  await boot(page, route => {
    const r = route.request();
    asked.push({ method: r.method(), text: ttsPayload(r).text || '' });
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) });
  });

  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('.answer')).toHaveCount(4);
  const prompt = await page.evaluate(() => window.KWIZILLO_M1.quiz.questions[0].prompt);

  await expect.poll(() => asked.length, { timeout: 8000 }).toBeGreaterThanOrEqual(5);
  // The question streams; the four answers are fetched whole, in parallel, and
  // are ready long before their turn. (Which request the proxy sees first is
  // not asserted: an intercepted media load and an intercepted fetch do not
  // reach the handler in the order the browser started them.)
  expect(asked.filter(a => a.text === prompt).map(a => a.method), 'the question is streamed').toContain('GET');
  const answers = asked.filter(a => /^[A-D]\. /.test(a.text));
  expect(answers.length, 'four answers').toBeGreaterThanOrEqual(4);
  expect(answers.every(a => a.method === 'POST'), 'the answers are fetched whole').toBe(true);

  // A line already in hand is never streamed: the next question was warmed
  // while this one was on screen, so it plays without a new request.
  const next = await page.evaluate(() => window.KWIZILLO_M1.quiz.questions[1].prompt);
  await expect.poll(() => asked.some(a => a.text === next), { timeout: 8000 }).toBe(true);
  const before = asked.length;
  await page.locator('.answer').first().click();
  await page.locator('#feedbackNext').click();
  await expect(page.locator('.quiz-card h1')).toHaveText(next);
  await page.waitForTimeout(600);
  expect(asked.slice(before).filter(a => a.text === next && a.method === 'GET'), 'a warmed line is not streamed again').toEqual([]);
});

test('a stream that fails is fetched whole instead, so the line is still spoken', async ({ page }) => {
  const asked = [];
  await boot(page, route => {
    const r = route.request();
    asked.push({ method: r.method(), text: ttsPayload(r).text || '' });
    if (r.method() === 'GET') return route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"x"}' });
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) });
  });

  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('.answer')).toHaveCount(4);
  const prompt = await page.evaluate(() => window.KWIZILLO_M1.quiz.questions[0].prompt);

  await expect.poll(() => asked.filter(a => a.text === prompt && a.method === 'POST').length, { timeout: 8000 }).toBe(1);
  expect(asked.filter(a => a.text === prompt && a.method === 'GET').length).toBe(1);
  // The quiz carries on as usual after the failed stream.
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
});

test('changing screen stops a streaming line at once', async ({ page }) => {
  await boot(page, route => route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) }));
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await page.evaluate(() => window.KWIZILLO_M1.showHome());
  await page.waitForTimeout(400);
  // Nothing is playing and nothing is left behind to start playing later.
  expect(await page.evaluate(() => window.KWIZILLO_M1.voiceProgress())).toBeNull();
  expect(await page.evaluate(() => [...document.querySelectorAll('audio')].some(a => !a.paused))).toBe(false);
});
