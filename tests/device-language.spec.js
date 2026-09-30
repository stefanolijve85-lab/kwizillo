// A new player starts in the language of the device when Kwizillo has it, and
// in English otherwise; a player who already chose keeps that choice.
const { test, expect } = require('@playwright/test');

for (const [locale, lang, ask] of [['de-DE', 'de', /Sprache/i], ['pt-BR', 'pt', /idioma/i], ['ja-JP', 'en', /language/i], ['nl-BE', 'nl', /taal/i]]) {
  test(`a fresh ${locale} device starts in ${lang}`, async ({ browser }) => {
    const ctx = await browser.newContext({ locale });
    const page = await ctx.newPage();
    await page.route('**/*.mp4', r => r.abort());
    await page.route('**/api/tts**', r => r.fulfill({ status: 503, body: '{}' }));
    await page.addInitScript(() => localStorage.setItem('kwizillo-fresh-start', '0'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 4 && !(await page.locator('.onboarding').count()); i++) {
      await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
    await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
    expect(await page.evaluate(() => window.KWIZILLO_M1.state.language)).toBe(lang);
    await expect(page.locator('.onboarding')).toContainText(ask);
    await ctx.close();
  });
}

test('a saved language wins over the device language', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'de-DE' });
  const page = await ctx.newPage();
  await page.route('**/*.mp4', r => r.abort());
  await page.addInitScript(() => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-state', JSON.stringify({ schemaVersion: 3, language: 'fr', onboardingComplete: false })); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.language)).toBe('fr');
  await ctx.close();
});
