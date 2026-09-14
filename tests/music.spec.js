// Background music: one loop per world, the hub theme on Home, the games theme
// in Memo and Rekenen. Loops are mp3 with a run-in, so the manager must loop a
// window inside the file, not the whole file.
const { test, expect } = require('@playwright/test');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: true, musicVolume: .2,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/api/tts', route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
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
