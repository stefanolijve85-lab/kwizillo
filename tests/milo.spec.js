// The guide as host: every onboarding step shows Milo with a bubble that carries
// the question; picking Luna hands the stage to her; the Home tour flies the
// chosen guide past the worlds, the games, the HUD and the nav, one spoken line
// each, and never returns on its own.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Milo',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED(), tts) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, tts || (route => route.fulfill({ status: 503, body: '{}' })));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' }));  if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}

test('onboarding is hosted by Milo: a pose and a bubble on every step, spoken in his own voice', async ({ page }) => {
  const spoken = [];
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => { spoken.push(ttsPayload(route.request())); route.fulfill({ status: 503, body: '{}' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
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

test('the tour visits the Mega Quiz, worlds, games, HUD and nav with a spotlight, then Milo flies off; a tap moves on', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.milo-tour')).toHaveCount(0);   // never on its own for a returning player
  // The walk in lasts under a second, so whether it happened is recorded as it
  // happens rather than asked for afterwards: on a loaded machine the guide is
  // already talking by the time a query arrives.
  // What the bubble says is collected the same way, and both observers go in
  // before the tour starts: installed afterwards, a fast stop can be over
  // before the first mutation is seen.
  await page.evaluate(() => {
    window.__walked = false; window.__said = [];
    new MutationObserver(() => {
      if (document.querySelector('.milo-tour .milo-host.walking')) window.__walked = true;
      const t = document.querySelector('.milo-tour .milo-bubble')?.textContent?.trim();
      if (t && window.__said[window.__said.length - 1] !== t) window.__said.push(t);
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true, characterData: true });
    window.KWIZILLO_M1.startTour();
  });
  const tour = page.locator('.milo-tour');
  await expect(tour).toBeVisible();
  // The guide is a full-body figure (no portrait window) that walks in, and its mouth sits on the figure.
  await expect(tour.locator('.milo-host')).toHaveClass(/figure-mode/);
  await expect.poll(() => page.evaluate(() => window.__walked), { timeout: 6000 }).toBe(true);
  await expect(tour.locator('.milo-host video, .milo-host .milo-still')).toHaveCount(0);
  // The only chrome during the tour is the small Skip button at the bottom.
  await expect(tour.locator('.milo-tour-hint > *')).toHaveCount(1);
  await expect(tour.locator('.milo-tour-skip')).toHaveText('Overslaan');
  const bubble = tour.locator('.milo-bubble');
  // It opens at the top, on the Mega Quiz…
  await expect.poll(() => page.evaluate(() => window.__said.some(t => t.includes('Mega Quiz'))), { timeout: 15000 }).toBe(true);
  { const mega = await page.locator('#homeMega').boundingBox(), sp = await tour.locator('.milo-tour-spot').boundingBox(); expect(Math.abs(sp.y - mega.y)).toBeLessThan(12) }
  await expect.poll(() => page.evaluate(() => window.__said.some(t => t.includes('acht werelden'))), { timeout: 25000 }).toBe(true);
  await expect(tour.locator('.milo-host')).not.toHaveClass(/walking/);
  // In the tour the figure stays and gestures: a lip-synced clip would replace
  // it with a video of the guide standing still, and here it has things to
  // point at. The clips are for onboarding, up close.
  await expect(tour.locator('.milo-host')).not.toHaveClass(/clip-playing/);
  await expect(tour.locator('.milo-host video.milo-clip')).toHaveCount(0);
  await expect(tour.locator('.milo-figure')).toBeVisible();
  const spot = tour.locator('.milo-tour-spot');
  const worlds = await page.locator('.home-worlds').boundingBox();
  const s1 = await spot.boundingBox();
  expect(Math.abs(s1.y - worlds.y)).toBeLessThan(12);
  // A tap on the screen does nothing: only Skip ends the tour, the guide moves on by itself.
  await tour.click({ position: { x: 10, y: 300 } });
  await page.waitForTimeout(300);
  await expect(bubble).toContainText('acht werelden');
  // "Straks": during the tour a tap does nothing, so no line tells the child to tap now.
  await expect(bubble).toContainText('Straks tik je');
  await expect(tour.locator('.milo-host')).not.toHaveClass(/hopping/);
  await expect(bubble).toContainText('de Runner, Talen', { timeout: 25000 });
  const games = await spot.boundingBox(), runner = await page.locator('#homeJungle').boundingBox(), first = await page.locator('.home-games .home-game').first().boundingBox(), last = await page.locator('.home-games .home-game').last().boundingBox();
  expect(Math.abs(games.y - runner.y)).toBeLessThan(12);   // the Runner banner and…
  expect(games.x).toBeLessThan(first.x + 8); expect(games.y + games.height).toBeGreaterThan(last.y + last.height - 8);   // …every game tile, at once
  // every bubble of the tour stays inside the frame
  { const bb = await bubble.boundingBox(), fb = await page.locator('.game-frame').boundingBox(); expect(bb.y).toBeGreaterThanOrEqual(fb.y); expect(bb.y + bb.height).toBeLessThanOrEqual(fb.y + fb.height); }
  // No lonely last word: the last two words are tied together.
  expect(await bubble.innerText()).toMatch(/allemaal\u00a0proberen!$/);
  await expect(bubble).toContainText('munten', { timeout: 25000 });
  await expect(bubble).toContainText('collectie', { timeout: 25000 });
  await expect(bubble).toContainText('Nu ben jij aan de beurt', { timeout: 25000 });
  // the closing line has a clip too (rendered from the talk pose)
  await expect(page.locator('.milo-host')).toHaveAttribute('data-pose', 'talk');
  await expect(tour).toHaveCount(0, { timeout: 25000 });
  await expect(page.locator('.home')).not.toHaveClass(/touring/);
  // Home is fully usable again.
  await page.locator('[data-world="ruimte"]').first().click();
  await expect(page.locator('.native-world-bg')).toBeVisible();
});

test('tapping Luna on the guide step brings her on stage; she says hello, hosts the welcome and the tour in her own voice', async ({ page }) => {
  const spoken = [];
  await page.route('**/*.mp4', route => route.abort());
  // A 500 (unlike 503) keeps speech "available", so every line is still asked for.
  await page.route(TTS, route => { spoken.push(ttsPayload(route.request())); route.fulfill({ status: 500, body: '{}' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
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
  // Her hello has a clip now (rendered from the talk pose), like Milo's lines.
  await expect(host).toHaveAttribute('data-pose', 'talk');
  await expect(host.locator('.milo-figure')).toHaveAttribute('src', /luna\/talk\.png/);
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
  await expect.poll(() => spoken.some(r => r.voice === 'Luna' && /acht werelden/.test(r.text)), { timeout: 8000 }).toBe(true);
  // The welcome and the tour are hers. Tapping the guide that is already chosen
  // goes on to the welcome, the same as "Verder".
  await page.locator('[data-guide="Luna"]').click();
  await expect(page.locator('.onboarding .milo-host')).toHaveAttribute('data-guide', 'luna');
  await expect(page.locator('.milo-bubble h1')).toHaveText('Welkom, Sam!');
  const before = spoken.length;
  await page.locator('#obStart').click();
  const tour = page.locator('.home .milo-tour');
  await expect(tour).toBeVisible({ timeout: 5000 });
  await expect(tour.locator('.milo-host')).toHaveAttribute('data-guide', 'luna');
  await expect(tour.locator('.milo-bubble')).toContainText('Mega Quiz', { timeout: 5000 });
  // The tour lines are hers alone (lines warmed earlier for Milo may still drain from the queue).
  await expect.poll(() => spoken.some(r => r.voice === 'Luna' && /Mega Quiz/.test(r.text))).toBe(true);
  expect(spoken.filter(r => r.voice === 'Milo' && /werelden|Memo|munten|collectie|plezier|Mega Quiz/.test(r.text))).toEqual([]);
  for (const r of spoken.slice(before)) expect(JSON.stringify(r)).not.toContain('Sam');
  await page.locator('.milo-tour-skip').click();
  await expect(tour).toHaveCount(0, { timeout: 5000 });
  // The parent zone offers the tour with either guide, side by side.
  await page.locator('[data-nav="parent"]').click();
  await expect(page.locator('.tour-guides button')).toHaveText(['Milo', 'Luna']);
});

test('the parent zone can replay the tour, with Milo or with Luna', async ({ page }) => {
  await boot(page);
  await page.locator('[data-nav="parent"]').click();
  await page.locator('[data-tour="milo"]').click();
  await expect(page.locator('.home .milo-tour')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.milo-tour .milo-host')).toHaveAttribute('data-guide', 'milo');
  await page.locator('.milo-tour-skip').click();
  await expect(page.locator('.milo-tour')).toHaveCount(0, { timeout: 5000 });
});

test('a transparent talking clip takes the figure\'s place (no drawn mouth); a line without a clip keeps the figure and the drawn mouth', async ({ page }) => {
  const manifest = require('fs').readFileSync(require('path').join(__dirname, '..', 'guide-talks.js'), 'utf8');
  test.skip(!/milo\/talk\/nl\/name\.webm/.test(manifest), 'no Dutch Milo clip for the name step in the manifest');
  const tts = [];
  await page.route(TTS, r => { tts.push(ttsPayload(r.request()).text); r.fulfill({ status: 500, body: '{}' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: /Nederlands/ }).click();
  const host = page.locator('.onboarding .milo-host');
  const clip = host.locator('video.milo-clip');
  await expect(clip).toHaveAttribute('src', /milo\/talk\/nl\/name\.webm/);
  await expect(host).toHaveClass(/clip-playing/);
  await expect(host.locator('.milo-mouth')).toHaveCount(0);           // nothing can draw a second mouth
  await expect(host.locator('.milo-figure')).toHaveClass(/behind-clip/);   // the still is out of the flow
  // Once the voice is done the figure stays where the clip left it: paused on
  // the handover frame (the model's own end pose, mouth at rest), before
  // keyclip's settle dissolve (a ghost arm). Swapping to the cut-out there was
  // a visible jump, because the clip ends in another pose than it starts in.
  await expect(clip).toHaveAttribute('data-held', '1', { timeout: 10000 });
  const at = await clip.evaluate(v => ({ paused: v.paused, t: v.currentTime, d: v.duration }));
  expect(at.paused).toBe(true);
  expect(at.d - at.t).toBeGreaterThan(0.45);                          // not in the settle tail
  await expect(host).not.toHaveClass(/clip-playing/);
  await expect(host.locator('.milo-mouth')).toHaveCount(0);           // still one mouth: the clip's own
  await expect(host.locator('.milo-figure')).toHaveClass(/behind-clip/);
  // The next step has no clip either: the voice is asked live.
  await page.locator('#obName').fill('Sam'); await page.locator('#obNext').click();
  await expect(page.locator('.onboarding .milo-host video.milo-clip')).toHaveCount(0);
  await expect(page.locator('.onboarding .milo-host .milo-mouth')).toHaveCount(1);
  await expect.poll(() => tts.some(t => /hoe oud/i.test(t))).toBe(true);
});

test('while it explains, the guide points at what it is explaining and hops on the spot', async ({ page }) => {
  // The speech request is left hanging, which is what a line being spoken looks
  // like from here: the stop stays put while the guide talks through it.
  await boot(page, SAVED(), () => {});
  // Poses and hops as they happen: a query afterwards lands wherever the loop is.
  await page.evaluate(() => {
    window.__poses = []; window.__hops = 0;
    new MutationObserver(() => {
      const h = document.querySelector('.milo-tour .milo-host');
      if (!h) return;
      const p = h.dataset.pose;
      if (p && window.__poses[window.__poses.length - 1] !== p) window.__poses.push(p);
      if (h.classList.contains('nudge')) window.__hops++;
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'data-pose'] });
    window.KWIZILLO_M1.startTour();
  });
  await expect(page.locator('.milo-tour .milo-figure')).toBeVisible();
  // The first stop is the Mega Quiz; the second is the worlds.
  // A tap does not move the tour on; a line that never finishes moves on by itself after 12 s.
  // Wait until the spotlight has arrived on the worlds.
  await expect.poll(async () => {
    const spot = await page.locator('.milo-tour-spot').boundingBox();
    const games = await page.locator('.home-worlds').boundingBox();
    return Math.abs(spot.y - games.y);
  }, { timeout: 20000 }).toBeLessThan(14);
  await expect.poll(() => page.evaluate(() => window.__poses.filter(p => /point|cheer/.test(p)).length), { timeout: 15000 }).toBeGreaterThan(0);
  const seen = await page.evaluate(() => ({ poses: [...new Set(window.__poses)], hops: window.__hops }));
  // It does not stand still: it points, it talks, it thinks, and it hops.
  expect(seen.poses.length, `poses seen: ${seen.poses.join(', ')}`).toBeGreaterThanOrEqual(3);
  expect(seen.poses.some(p => /point|cheer/.test(p)), 'it points at what it explains').toBe(true);
  await expect.poll(() => page.evaluate(() => window.__hops), { timeout: 10000 }).toBeGreaterThan(0);
});
