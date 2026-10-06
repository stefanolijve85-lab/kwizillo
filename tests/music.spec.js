// Background music: one loop per world, the hub theme on Home, the games theme
// in Memo and Rekenen. Loops are mp3 with a run-in, so the manager must loop a
// window inside the file, not the whole file.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: true, musicVolume: .2,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' }));  if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
const current = page => page.evaluate(() => window.KWIZILLO_M1.audio.currentId);

test('Home plays the island theme; a world switches to its own loop; Memo and Rekenen share the games loop', async ({ page }) => {
  await boot(page);
  await expect.poll(() => current(page), { timeout: 8000 }).toBe('home');

  await page.locator('[data-world="dieren"]').first().click();
  await expect.poll(() => current(page), { timeout: 8000 }).toBe('jungle');
  await page.locator('#worldBack').click();
  await expect.poll(() => current(page), { timeout: 8000 }).toBe('home');

  await page.locator('[data-world="mysterie"]').first().click();
  await expect.poll(() => current(page), { timeout: 8000 }).toBe('mystery');

  await page.evaluate(() => window.KWIZILLO_M1.showHome());
  await page.locator('#homeMemo').click();
  await expect.poll(() => current(page), { timeout: 8000 }).toBe('play');
  await page.evaluate(() => window.KWIZILLO_M1.startMath('ruimte'));
  await expect.poll(() => current(page), { timeout: 8000 }).toBe('play');

  // Every track is a real file the server hands out, and the loop window sits inside it.
  const check = await page.evaluate(async () => {
    const K = window.KWIZILLO_M1, out = [];
    for (const t of Object.values(K.audio.tracks)) {
      const r = await fetch(t.src, { method: 'HEAD' });
      out.push({ id: t.id, status: r.status, type: r.headers.get('content-type'), loop: t.loop, lead: t.lead });
    }
    return out;
  });
  expect(check).toHaveLength(8);
  for (const t of check) {
    expect(t.status, t.id).toBe(200);
    expect(t.type, t.id).toContain('audio/mpeg');
    expect(t.loop, t.id).toBeGreaterThan(45);
    expect(t.lead, t.id).toBeGreaterThan(0);
  }
});

test('old track ids resolve to the new loops and the sound sheet lists all eight', async ({ page }) => {
  await boot(page, SAVED({ musicTrack: 'adventure', musicOn: false }));
  const mapped = await page.evaluate(async () => {
    const K = window.KWIZILLO_M1, out = {};
    for (const id of ['magical', 'adventure', 'calm', 'space', 'nonsense']) { await K.audio.setTrack(id); out[id] = K.state.musicTrack; }
    return out;
  });
  expect(mapped).toEqual({ magical: 'home', adventure: 'history', calm: 'earth', space: 'space', nonsense: 'home' });
  await page.evaluate(() => window.KWIZILLO_M1.showSoundSettings());
  await expect(page.locator('.music-choice')).toHaveCount(8);
  await expect(page.locator('.music-choice.selected')).toHaveText(/Eilanden/);
  await expect(page.locator('.music-choice')).toContainText(['Eilanden', 'Ruimte', 'Jungle', 'Aarde', 'Geschiedenis', 'Wetenschap', 'Mysterie', 'Spelletjes']);
});

// An interruption (swiping the app away, a call, the lock screen) leaves iOS
// contexts "interrupted", and after a longer background the context is thrown
// away altogether. Both cases must end with music playing again, not with a
// silent app that only a reload fixes.
test('music and voice come back after the app is interrupted', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page);
  await expect.poll(() => current(page), { timeout: 8000 }).toBe('home');
  // A voice context exists once the child has tapped; the intro sting may still
  // be fading, so the healthy start is polled rather than asserted at once.
  await page.evaluate(() => window.KWIZILLO_M1.audio.wake());
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.health), { timeout: 8000 })
    .toMatchObject({ music: 'running', playing: true });

  const hide = () => page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const show = () => page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // 1. Parked like iOS parks it: suspended contexts must be resumed.
  await hide();
  await page.evaluate(async () => { await window.KWIZILLO_M1.audio.ctx.suspend(); await window.KWIZILLO_M1.audio.voiceCtx?.suspend(); });
  await show();
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.health), { timeout: 25000 })
    .toMatchObject({ music: 'running', playing: true });

  // 2. The iOS zombie: the context still says "running" but its clock stands
  //    still, so nothing is heard. It must be replaced, together with the source
  //    and the buffers that belong to it, and the same track must start again.
  await hide();
  await page.evaluate(() => {
    for (const c of [window.KWIZILLO_M1.audio.ctx, window.KWIZILLO_M1.audio.voiceCtx]) {
      if (c) Object.defineProperty(c, 'currentTime', { get: () => 4.2, configurable: true });
    }
  });
  await show();
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.health), { timeout: 25000 })
    .toMatchObject({ music: 'running', playing: true });
  expect(await page.evaluate(() => window.KWIZILLO_M1.audio.ctx.currentTime)).toBeGreaterThan(0.001);
  expect(await current(page)).toBe('home');

  // 3. Thrown away altogether: a new context, and the voice context is alive too.
  await hide();
  await page.evaluate(async () => { await window.KWIZILLO_M1.audio.ctx.close(); await window.KWIZILLO_M1.audio.voiceCtx?.close(); });
  await show();
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.health), { timeout: 25000 })
    .toMatchObject({ music: 'running', playing: true });
  expect(await current(page)).toBe('home');
  expect(await page.evaluate(() => window.KWIZILLO_M1.audio.voiceCtx.state)).not.toBe('closed');

  // 4. Build 1.0 (9) on a real iPhone: back from the home screen both contexts
  //    say "running" and their clocks move, yet the app's audio session is gone
  //    and nothing is heard, not even after a tap. A return from the background
  //    therefore never trusts the old contexts: both are new and the music runs.
  await page.evaluate(() => { window.__oldMusic = window.KWIZILLO_M1.audio.ctx; window.__oldVoice = window.KWIZILLO_M1.audio.voiceCtx });
  await hide();
  await show();
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.health), { timeout: 25000 })
    .toMatchObject({ music: 'running', playing: true });
  expect(await page.evaluate(() => window.KWIZILLO_M1.audio.ctx !== window.__oldMusic)).toBe(true);
  expect(await page.evaluate(() => window.KWIZILLO_M1.audio.voiceCtx !== window.__oldVoice)).toBe(true);
  // The old context is closed only after the new one runs: closing it first let
  // WebKit switch the app's audio session off under the new one (build 17).
  await expect.poll(() => page.evaluate(() => window.__oldMusic.state), { timeout: 5000 }).toBe('closed');
  expect(await current(page)).toBe('home');
});

// Build 18/19: at launch the native side asked the page to rebuild its audio
// (sceneDidBecomeActive also fires then), which threw away the context playing
// the intro theme: the music started and stopped a moment later. While the
// intro holds the music, a "fresh" wake keeps the context.
test('a wake during the intro keeps the context that plays the intro theme', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.KWIZILLO_M1.audio.wake());
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.audio.health.music), { timeout: 8000 }).toBe('running');
  const same = await page.evaluate(async () => {
    const A = window.KWIZILLO_M1.audio, before = A.ctx;
    A.holdMusic = true;
    await A.wake(true, true);
    const kept = A.ctx === before && before.state !== 'closed';
    A.holdMusic = false;
    return kept;
  });
  expect(same).toBe(true);
});
