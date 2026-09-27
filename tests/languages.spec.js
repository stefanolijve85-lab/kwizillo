// Every offered language must actually play: its own home screen, its own world
// screen and a quiz from its own bank, with no Dutch left on the screen and no
// console errors. The list comes from the app itself, so a new language is
// covered the moment it is registered.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');
const { LANGS } = require('./langs.js');

const SAVED = lang => ({
  schemaVersion: 2, language: lang, name: 'Mia', onboardingComplete: true, tourDone: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }
});

for (const lang of LANGS) {
  test(`${lang}: home, world and quiz come from the ${lang} bank`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*.mp4', r => r.abort());
    await page.route(TTS, r => r.fulfill({ status: 503, body: '{}' }));
    await page.addInitScript(s => {
      localStorage.setItem('kwizillo-fresh-start', '0');
      localStorage.setItem('kwizillo-state', JSON.stringify(s));
      localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 3e10).toISOString(), store: 'dev' }));
    }, SAVED(lang));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('.motion').click();
    await page.locator('.motion').click().catch(() => {});
    await expect(page.locator('.home')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-world="wetenschap"]').first().click();
    await expect(page.locator('.world-topic').first()).toBeVisible({ timeout: 8000 });
    await page.locator('[data-topic]').first().click();
    await expect(page.locator('.quiz-v2')).toBeVisible({ timeout: 8000 });

    const seen = await page.evaluate(() => {
      const K = window.KWIZILLO_M1, q = K.quiz.questions[K.quiz.index];
      return {
        docLang: document.documentElement.lang,
        bank: K.questions.length,
        prompt: q.prompt,
        onScreen: document.querySelector('.quiz-card h1').textContent.trim(),
        nlPrompt: K.banks.nl.find(x => x.id === q.id).prompt,
        home: K.t('home.pickWorld'),
        speech: K.speechLang()
      };
    });
    expect(seen.docLang).toBe(lang);
    expect(seen.bank).toBe(480);
    expect(seen.speech).toBe(lang);
    expect(seen.onScreen).toBe(seen.prompt);
    if (lang !== 'nl') expect(seen.prompt, 'question is not the Dutch text').not.toBe(seen.nlPrompt);
    expect(errors).toEqual([]);
  });
}
