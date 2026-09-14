// Milo as host: every onboarding step shows him with a bubble that carries the
// question; the Home tour flies him past the worlds, the games, the HUD and the
// nav, one spoken line each, and never returns on its own.
const { test, expect } = require('@playwright/test');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Milo',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED(), tts) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/api/tts', tts || (route => route.fulfill({ status: 503, body: '{}' })));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}

test('onboarding is hosted by Milo: a pose and a bubble on every step, spoken in his own voice', async ({ page }) => {
  const spoken = [];
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/api/tts', route => { spoken.push(route.request().postDataJSON()); route.fulfill({ status: 503, body: '{}' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  const host = page.locator('.onboarding .milo-host');
  await expect(host).toHaveAttribute('data-pose', 'wave');
  await expect(host.locator('.milo-figure')).toHaveAttribute('src', /milo\/wave\.png/);
  await expect(host.locator('.milo-bubble h1')).toHaveText('Kies je taal');
  await page.getByRole('button', { name: /Nederlands/ }).click();
  await expect(host).toHaveAttribute('data-pose', 'think');
  await expect(page.locator('.milo-bubble h1')).toHaveText('Hoe heet je?');
  await page.locator('#obName').fill('Sam'); await page.locator('#obNext').click();
  await page.locator('[data-age="6"]').click();
  await expect(page.locator('[data-age="6"]')).toHaveClass(/selected/);
  await page.locator('#obNext').click();
  await expect(page.locator('.milo-host')).toHaveAttribute('data-pose', 'pointDown');
  await expect(page.locator('[data-group="3"]')).toHaveClass(/selected/);   // six years old → groep 3
  await page.locator('#obNext').click();
  await page.locator('#obNext').click();
  await expect(page.locator('.milo-host')).toHaveAttribute('data-pose', 'cheer');
  await expect(page.locator('.milo-bubble h1')).toHaveText('Welkom, Sam!');
  // Every request so far asked for Milo's voice, and none carried the child's name.
  expect(spoken.length).toBeGreaterThan(0);
  for (const r of spoken) { expect(r.voice).toBe('Milo'); expect(JSON.stringify(r)).not.toContain('Sam'); }
});

test('the tour visits worlds, games, HUD and nav with a spotlight, then Milo flies off; a tap moves on', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.milo-tour')).toHaveCount(0);   // never on its own for a returning player
  await page.evaluate(() => { window.KWIZILLO_M1.startTour(); });
  const tour = page.locator('.milo-tour');
  await expect(tour).toBeVisible();
  const bubble = tour.locator('.milo-bubble');
  await expect(bubble).toContainText('zes werelden', { timeout: 5000 });
  const spot = tour.locator('.milo-tour-spot');
  const worlds = await page.locator('.home-worlds').boundingBox();
  const s1 = await spot.boundingBox();
  expect(Math.abs(s1.y - worlds.y)).toBeLessThan(12);
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('Memo', { timeout: 5000 });
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('munten', { timeout: 5000 });
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('verzameling', { timeout: 5000 });
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('Veel plezier', { timeout: 5000 });
  await expect(page.locator('.milo-host')).toHaveAttribute('data-pose', 'cheer');
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(tour).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.home')).not.toHaveClass(/touring/);
  // Home is fully usable again.
  await page.locator('[data-world="ruimte"]').first().click();
  await expect(page.locator('.native-world-bg')).toBeVisible();
});

test('the parent zone can replay the tour', async ({ page }) => {
  await boot(page);
  await page.locator('[data-nav="parent"]').click();
  await page.locator('#tourOpen').click();
  await expect(page.locator('.home .milo-tour')).toBeVisible({ timeout: 5000 });
  await page.locator('.milo-tour-skip').click();
  await expect(page.locator('.milo-tour')).toHaveCount(0, { timeout: 5000 });
});

test('a lip-synced clip replaces the still and the live voice; without a clip the still + voice take over', async ({ page }) => {
  const tts = [];
  await page.route('**/*.mp4', r => r.request().url().includes('intro') ? r.abort() : r.continue());
  await page.route('**/api/tts', r => { tts.push(r.request().postDataJSON().text); r.fulfill({ status: 503, body: '{}' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  const host = page.locator('.onboarding .milo-host');
  await expect(host).toHaveClass(/video-mode/, { timeout: 5000 });
  await expect(host.locator('.milo-video')).toHaveAttribute('src', /milo\/talk\/nl\/language\.mp4/);
  await expect.poll(() => page.evaluate(() => { const v = document.querySelector('.milo-video'); return v && !v.paused && v.currentTime > 0; }), { timeout: 5000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => document.querySelector('.milo-video').ended), { timeout: 10000 }).toBe(true);
  expect(tts).toEqual([]);   // the clip carries the voice; no live request was made
  // A line without a clip (a language that has none) falls back to the still pose and a voice request.
  await page.evaluate(() => { window.KWIZILLO_MILO_TALKS.nl = {}; });
  await page.getByRole('button', { name: /Nederlands/ }).click();
  await expect(page.locator('.onboarding .milo-host')).not.toHaveClass(/video-mode/);
  await expect(page.locator('.onboarding .milo-figure')).toBeVisible();
  await expect.poll(() => tts.length).toBeGreaterThan(0);
});
