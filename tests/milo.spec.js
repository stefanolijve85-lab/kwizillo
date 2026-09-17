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
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' }));  if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
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
  // A step with a talking clip stands in the clip's base pose; without one, in the step's own pose.
  await expect(host).toHaveAttribute('data-pose', /think|wave|talk/);
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
  // The welcome line has a clip (rendered from the talk pose), so the host takes
  // that pose and the clip plays in the figure's place.
  await expect(page.locator('.milo-host')).toHaveAttribute('data-pose', 'talk');
  await expect(page.locator('.milo-host')).toHaveClass(/clip-playing/);
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
  // The guide is a full-body figure (no portrait window) that walks in, and its mouth sits on the figure.
  await expect(tour.locator('.milo-host')).toHaveClass(/figure-mode/);
  await expect(tour.locator('.milo-host')).toHaveClass(/walking/);
  await expect(tour.locator('.milo-host video, .milo-host .milo-still')).toHaveCount(0);
  // The only chrome during the tour is the small Skip button at the bottom.
  await expect(tour.locator('.milo-tour-hint > *')).toHaveCount(1);
  await expect(tour.locator('.milo-tour-skip')).toHaveText('Overslaan');
  const bubble = tour.locator('.milo-bubble');
  await expect(bubble).toContainText('zes werelden', { timeout: 5000 });
  await expect(tour.locator('.milo-host')).not.toHaveClass(/walking/);
  // The worlds line has a clip: the figure hands over to the transparent video.
  await expect(tour.locator('.milo-host')).toHaveClass(/clip-playing/);
  await expect(tour.locator('.milo-host video.milo-clip')).toHaveCount(1);
  const spot = tour.locator('.milo-tour-spot');
  const worlds = await page.locator('.home-worlds').boundingBox();
  const s1 = await spot.boundingBox();
  expect(Math.abs(s1.y - worlds.y)).toBeLessThan(12);
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(tour.locator('.milo-host')).toHaveClass(/hopping/);   // hops to the next stop
  await expect(bubble).toContainText('Memo', { timeout: 5000 });
  const games = await spot.boundingBox(), memo = await page.locator('#homeMemo').boundingBox(), math = await page.locator('#homeMath').boundingBox(), facts = await page.locator('#homeFacts').boundingBox();
  expect(games.x).toBeLessThan(memo.x + 8); expect(games.x + games.width).toBeGreaterThan(math.x + math.width - 8);   // Memo + Rekenen together…
  expect(games.y + games.height).toBeLessThan(facts.y + 8);                 // …but not the Weetjes tile on the next row
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('Weetjes', { timeout: 5000 });         // which get their own stop
  const s3 = await spot.boundingBox();
  expect(Math.abs(s3.x - facts.x)).toBeLessThan(12);
  // No lonely last word: the last two words are tied together.
  expect(await bubble.innerText()).toMatch(/te\u00a0ontdekken!$/);
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('munten', { timeout: 5000 });
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('verzameling', { timeout: 5000 });
  await tour.click({ position: { x: 10, y: 300 } });
  await expect(bubble).toContainText('Veel plezier', { timeout: 5000 });
  // the closing line has a clip too (rendered from the talk pose)
  await expect(page.locator('.milo-host')).toHaveAttribute('data-pose', 'talk');
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

test('a transparent talking clip takes the figure\'s place (no drawn mouth); a line without a clip keeps the figure and the drawn mouth', async ({ page }) => {
  const manifest = require('fs').readFileSync(require('path').join(__dirname, '..', 'guide-talks.js'), 'utf8');
  test.skip(!/milo\/talk\/nl\/name\.webm/.test(manifest), 'no Dutch Milo clip for the name step in the manifest');
  const tts = [];
  await page.route('**/api/tts', r => { tts.push(r.request().postDataJSON().text); r.fulfill({ status: 500, body: '{}' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: /Nederlands/ }).click();
  const host = page.locator('.onboarding .milo-host');
  const clip = host.locator('video.milo-clip');
  await expect(clip).toHaveAttribute('src', /milo\/talk\/nl\/name\.webm/);
  await expect(host).toHaveClass(/clip-playing/);
  await expect(host.locator('.milo-mouth')).toHaveCount(0);           // nothing can draw a second mouth
  await expect(host.locator('.milo-figure')).toHaveClass(/behind-clip/);   // the still is out of the flow
  await expect.poll(() => page.evaluate(() => document.querySelector('.onboarding video.milo-clip')?.ended), { timeout: 10000 }).toBe(true);
  await expect(clip).toBeAttached();                                       // the last frame stays…
  // …until the next step: no clip there, so the figure and the drawn mouth are back and the voice is asked live.
  await page.locator('#obName').fill('Sam'); await page.locator('#obNext').click();
  await expect(page.locator('.onboarding .milo-host video.milo-clip')).toHaveCount(0);
  await expect(page.locator('.onboarding .milo-host .milo-mouth')).toHaveCount(1);
  await expect.poll(() => tts.some(t => /hoe oud/i.test(t))).toBe(true);
});
