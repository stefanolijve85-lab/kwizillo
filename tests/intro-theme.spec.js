const { test, expect } = require('@playwright/test');

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

// The intro theme (music + children calling "Kwizillo!") is the only music
// source during the cinematic and hands over to the game loop on Home. Chromium
// is launched without the autoplay gate so the theme can actually start.
test('plays in step with the video, alone, and yields to the Home loop', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const themeRequests = [];
  page.on('request', r => { if (r.url().includes('intro_theme')) themeRequests.push(r.url()); });
  await page.addInitScript(() => {
    localStorage.setItem('kwizillo-state', JSON.stringify({ schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil', musicOn: true, musicVolume: .3, soundOn: false, progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] } }));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.motion')).toBeVisible({ timeout: 8000 });
  await expect.poll(() => themeRequests.length, { timeout: 8000 }).toBeGreaterThanOrEqual(1);

  // Under the intro no loop track may be running: one music source at a time.
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.KWIZILLO_M1.audio.currentId)).toBeNull();
  expect(await page.evaluate(() => window.KWIZILLO_M1.audio.stingLive), 'theme is playing').toBe(true);

  // A tap ends the intro; the loop then takes over.
  await page.locator('.motion').click();
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.currentId), { timeout: 5000 }).toBe('magical');
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.stingLive), { timeout: 3000 }).toBe(false);
  expect(errors).toEqual([]);
});
