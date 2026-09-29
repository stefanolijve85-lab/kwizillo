// The Android back button (native-back.js). Capacitor is stood in for by a
// small fake with the App plugin, so the handler registers as it does in the
// app; each press is the listener being called.
const { test, expect } = require('@playwright/test');

const SAVED = {
  schemaVersion: 3, language: 'nl', name: 'Wolkje', onboardingComplete: true, tourDone: true,
  voice: 'Stil', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

async function boot(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/api/tts**', r => r.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', store: 'dev', expiresAt: new Date(Date.now() + 3e10).toISOString() }));
    window.__back = null; window.__minimized = 0;
    window.Capacitor = { isNativePlatform: () => true, Plugins: { App: {
      addListener: (ev, fn) => { if (ev === 'backButton') window.__back = fn; return Promise.resolve({ remove() {} }) },
      minimizeApp: () => { window.__minimized++; return Promise.resolve() }
    } } };
  }, SAVED);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
  return errors;
}
const back = page => page.evaluate(() => { window.__back(); });

test('back walks quiz → world → home, then puts the app away', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.enterWorld('dieren'); K.startQuiz('dieren', 0) });
  await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
  await back(page);
  await expect(page.locator('.answer')).toHaveCount(0);
  await expect(page.locator('.native-world, .home').first()).toBeVisible();
  for (let i = 0; i < 3 && !(await page.locator('.home').count()); i++) await back(page);
  await expect(page.locator('.home')).toBeVisible();
  expect(await page.evaluate(() => window.__minimized)).toBe(0);
  await back(page);
  expect(await page.evaluate(() => window.__minimized)).toBe(1);
  await expect(page.locator('.home')).toBeVisible();              // put away, not torn down
  expect(errors).toEqual([]);
});

test('back closes the answer card before it leaves the quiz', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => window.KWIZILLO_M1.startQuiz('ruimte', 0));
  await expect(page.locator('.answer')).toHaveCount(4, { timeout: 8000 });
  await page.locator('.answer').first().click();
  await expect(page.locator('#feedbackNext')).toBeVisible({ timeout: 8000 });
  await back(page);
  await expect(page.locator('.feedback-float')).toHaveCount(0);
  await expect(page.locator('.answer')).toHaveCount(4);           // still on the (answered) question
  expect(errors).toEqual([]);
});

test('back from every main screen reaches Home', async ({ page }) => {
  const errors = await boot(page);
  for (const open of ['showCollection', 'showAchievements', 'showParent']) {
    await page.evaluate(fn => window.KWIZILLO_M1[fn](), open);
    await expect(page.locator('.home')).toHaveCount(0);
    for (let i = 0; i < 3 && !(await page.locator('.home').count()); i++) await back(page);
    await expect(page.locator('.home'), open).toBeVisible();
  }
  expect(await page.evaluate(() => window.__minimized)).toBe(0);
  expect(errors).toEqual([]);
});
