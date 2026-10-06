// Arabic reads right to left, so the game does too. The layout itself mirrors
// because it is built from grids, flex rows and logical properties; these tests
// hold that line: the page really flips, the navigation runs the other way, the
// answer badges move to the other side, nothing hangs off the screen, and
// switching back to Dutch puts everything where it was.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = {
  schemaVersion: 3, language: 'ar', name: 'نور', onboardingComplete: true, tourDone: true,
  voice: 'Stil', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

async function boot(page, state = {}) {
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, r => r.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
  }, { ...SAVED, ...state });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
    await page.waitForTimeout(700);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
}

const box = locator => locator.boundingBox();

test('the page turns around for Arabic and back again for Dutch', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => [document.documentElement.dir, document.documentElement.lang])).toEqual(['rtl', 'ar']);

  // Home in Arabic: the greeting and the worlds come from the Arabic tables.
  await expect(page.locator('.home')).toContainText('نور');
  await expect(page.locator('[data-world="ruimte"]')).toContainText('عالم الفضاء');

  // The bottom navigation runs the other way: Home sits on the right.
  const home = await box(page.locator('[data-nav="home"]'));
  const more = await box(page.locator('[data-nav="parent"]'));
  expect(home.x).toBeGreaterThan(more.x);

  // Switching to Dutch turns the page back.
  await page.evaluate(() => { window.KWIZILLO_M1.setLanguage('nl'); window.KWIZILLO_M1.useBank(); window.KWIZILLO_M1.showHome() });
  expect(await page.evaluate(() => [document.documentElement.dir, document.documentElement.lang])).toEqual(['ltr', 'nl']);
  const homeNL = await box(page.locator('[data-nav="home"]'));
  const moreNL = await box(page.locator('[data-nav="parent"]'));
  expect(homeNL.x).toBeLessThan(moreNL.x);
});

test('the quiz mirrors: answers run right to left and their letters sit on the right', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.answer')).toHaveCount(4);

  // A is the first answer, so in Arabic it is the right-hand tile of the top row.
  const a = await box(page.locator('.answer').nth(0));
  const b = await box(page.locator('.answer').nth(1));
  expect(a.y).toBeCloseTo(b.y, -1);
  expect(a.x).toBeGreaterThan(b.x);

  // The letter badge sits at the start of the card, which in Arabic is the right.
  const letter = await box(page.locator('.answer').nth(0).locator('.answer-letter'));
  expect(letter.x + letter.width / 2).toBeGreaterThan(a.x + a.width / 2);
  // Arabic numbers its choices with Arabic letters, the ones the voice says.
  await expect(page.locator('.answer-letter')).toHaveText(['أ', 'ب', 'ج', 'د']);

  // The question is Arabic, and the back arrow points the other way.
  await expect(page.locator('.quiz-card h1')).toHaveText(/[؀-ۿ]/);
  const flip = await page.locator('.quiz-back .ki').evaluate(el => getComputedStyle(el).transform);
  expect(flip).toContain('-1');                       // scaleX(-1)
});

test('nothing hangs off the screen in Arabic, on a small phone or a big one', async ({ page }) => {
  for (const size of [{ width: 320, height: 568 }, { width: 430, height: 932 }]) {
    await page.setViewportSize(size);
    await boot(page);
    for (const open of [() => page.evaluate(() => window.KWIZILLO_M1.showHome()),
                        () => page.evaluate(() => window.KWIZILLO_M1.showParent()),
                        () => page.evaluate(() => window.KWIZILLO_M1.showCollection('shop')),
                        () => page.evaluate(() => window.KWIZILLO_M1.showStats())]) {
      await open();
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => {
        const d = document.documentElement;
        return { scroll: d.scrollWidth, client: d.clientWidth };
      });
      expect(overflow.scroll, `${size.width}px wide`).toBeLessThanOrEqual(overflow.client + 1);
    }
  }
});

test('Arabic speaks Arabic: the guide asks for the Arabic voice and numbers are read as words', async ({ page }) => {
  const asked = [];
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, route => {
    asked.push(ttsPayload(route.request()));       // streamed or fetched whole, the same shape
    route.fulfill({ status: 503, body: '{}' });
  });
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
  }, { ...SAVED, voice: 'Milo' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
    await page.waitForTimeout(700);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
  await expect.poll(() => asked.length, { timeout: 8000 }).toBeGreaterThan(0);
  expect(asked.every(a => a.lang === 'ar'), 'every line is asked for in Arabic').toBe(true);

  // The speller turns digits into Arabic words before they are ever spoken.
  const spoken = await page.evaluate(() => window.KWIZILLO_M1.core.spellNumbers('ارتفاع إفرست 8849 مترًا و71%.', 'ar'));
  expect(spoken).toContain('ثمانية آلاف');
  expect(spoken).toContain('بالمئة');
  expect(spoken).not.toMatch(/\d/);
});
