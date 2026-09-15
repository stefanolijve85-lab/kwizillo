// The guide as host: every onboarding step shows Milo with a bubble that carries
// the question; picking Luna hands the stage to her; the Home tour flies the
// chosen guide past the worlds, the games, the HUD and the nav, one spoken line
// each, and never returns on its own.
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
  await expect(page.locator('#obName')).not.toHaveClass(/filled/);
  await page.locator('#obName').fill('Sam');
  await expect(page.locator('#obName')).toHaveClass(/filled/);   // a typed name is shown darker and bigger
  await page.locator('#obNext').click();
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
  // The only chrome during the tour is the small Skip button at the bottom.
  await expect(tour.locator('.milo-tour-hint > *')).toHaveCount(1);
  await expect(tour.locator('.milo-tour-skip')).toHaveText('Overslaan');
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

test('tapping Luna on the guide step brings her on stage; she says hello, hosts the welcome and the tour in her own voice', async ({ page }) => {
  const spoken = [];
  await page.route('**/*.mp4', route => route.abort());
  // A 500 (unlike 503) keeps speech "available", so every line is still asked for.
  await page.route('**/api/tts', route => { spoken.push(route.request().postDataJSON()); route.fulfill({ status: 500, body: '{}' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: /Nederlands/ }).click();
  await page.locator('#obName').fill('Sam'); await page.locator('#obNext').click();
  await page.locator('[data-age="8"]').click(); await page.locator('#obNext').click();
  await page.locator('#obNext').click();
  // Milo asks who the guide will be…
  const host = page.locator('.onboarding .milo-host:not(.leave)');
  await expect(host).toHaveAttribute('data-guide', 'milo');
  await expect(host.locator('.milo-bubble h1')).toHaveText('Wie helpt je mee?');
  // …and Luna takes over the moment her name is tapped.
  await page.locator('[data-guide="Luna"]').click();
  await expect(host).toHaveAttribute('data-guide', 'luna');
  await expect(host).toHaveAttribute('data-pose', 'wave');
  await expect(host.locator('.milo-figure')).toHaveAttribute('src', /luna\/wave\.png/);
  await expect(host.locator('.milo-bubble')).toContainText('Ik ben Luna');
  // Her hello is asked for in her own voice (it may have been warmed before the tap).
  await expect.poll(() => spoken.some(r => r.voice === 'Luna' && /Ik ben Luna/.test(r.text))).toBe(true);
  await expect(page.locator('.onboarding .milo-host.leave')).toHaveCount(0, { timeout: 3000 });
  // Milo comes back when he is tapped again, Luna when she is.
  await page.locator('[data-guide="Milo"]').click();
  await expect(page.locator('.onboarding .milo-host:not(.leave)')).toHaveAttribute('data-guide', 'milo');
  await page.locator('[data-guide="Luna"]').click();
  await expect(page.locator('.onboarding .milo-host:not(.leave)')).toHaveAttribute('data-guide', 'luna');
  // Her tour lines are already loading, two screens before the tour.
  await expect.poll(() => spoken.some(r => r.voice === 'Luna' && /zes werelden/.test(r.text)), { timeout: 8000 }).toBe(true);
  // The welcome and the tour are hers.
  await page.locator('#obNext').click();
  await expect(page.locator('.onboarding .milo-host')).toHaveAttribute('data-guide', 'luna');
  await expect(page.locator('.milo-bubble h1')).toHaveText('Welkom, Sam!');
  const before = spoken.length;
  await page.locator('#obStart').click();
  const tour = page.locator('.home .milo-tour');
  await expect(tour).toBeVisible({ timeout: 5000 });
  await expect(tour.locator('.milo-host')).toHaveAttribute('data-guide', 'luna');
  await expect(tour.locator('.milo-bubble')).toContainText('zes werelden', { timeout: 5000 });
  // The tour lines are hers alone (lines warmed earlier for Milo may still drain from the queue).
  await expect.poll(() => spoken.some(r => r.voice === 'Luna' && /zes werelden/.test(r.text))).toBe(true);
  expect(spoken.filter(r => r.voice === 'Milo' && /werelden|Memo|munten|verzameling|plezier/.test(r.text))).toEqual([]);
  for (const r of spoken.slice(before)) expect(JSON.stringify(r)).not.toContain('Sam');
  await page.locator('.milo-tour-skip').click();
  await expect(tour).toHaveCount(0, { timeout: 5000 });
  // The parent zone offers her tour by name.
  await page.locator('[data-nav="parent"]').click();
  await expect(page.locator('#tourOpen')).toContainText('Rondleiding van Luna');
});

test('the parent zone can replay the tour', async ({ page }) => {
  await boot(page);
  await page.locator('[data-nav="parent"]').click();
  await page.locator('#tourOpen').click();
  await expect(page.locator('.home .milo-tour')).toBeVisible({ timeout: 5000 });
  await page.locator('.milo-tour-skip').click();
  await expect(page.locator('.milo-tour')).toHaveCount(0, { timeout: 5000 });
});

test('a lip-synced clip replaces the still and the live voice; without a clip the portrait + voice take over', async ({ page }) => {
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
  await page.evaluate(() => { window.KWIZILLO_GUIDE_TALKS.milo.nl = {}; });
  await page.getByRole('button', { name: /Nederlands/ }).click();
  // …spoken from the portrait in the same window, so nothing jumps.
  await expect(page.locator('.onboarding .milo-host video')).toHaveCount(0);
  await expect(page.locator('.onboarding .milo-still .milo-still-face')).toHaveAttribute('src', /milo\/talk-base\.png/);
  await expect.poll(() => tts.length).toBeGreaterThan(0);
});
