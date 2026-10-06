// Talen, phase 1: the passport and "Hoor en tik" (talen-data.js, games-talen.js).
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Milo',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
const PREMIUM = JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' });
async function boot(page, { state = SAVED(), premium = false, clips = [] } = {}) {
  await page.route('**/*.mp4', route => route.abort());
  // Talen never asks the speech server: its sound ships with the app. Any call there fails the test.
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(([s, p]) => { localStorage.setItem('kwizillo-fresh-start', '0'); if (p) localStorage.setItem('kwizillo-entitlement', p); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, [state, premium ? PREMIUM : null]);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  // What is really played, in order (a clip heard before comes from memory, not the network).
  await page.exposeFunction('__clip', u => clips.push(u)).catch(() => {});
  await page.evaluate(() => { const K = window.KWIZILLO_M1, play = K.playClips; K.playClips = (urls, o) => { for (const u of urls || []) window.__clip(String(u).replace('assets/talen/audio/', '')); return play(urls, o); }; });
}
const current = page => page.evaluate(() => { const g = window.KWIZILLO_M1.talen; return g && g.words[g.round]?.id; });
// Plays the lesson to the end; `wrongAt` is the round where one wrong picture is tapped first.
async function playLesson(page, { wrongAt = -1 } = {}) {
  for (let round = 0; round < 8; round++) {
    await expect(page.locator('.talen-tile')).toHaveCount(4);
    const id = await current(page);
    if (round === wrongAt) {
      await page.locator(`.talen-tile:not([data-pick="${id}"])`).first().click();
      await expect(page.locator('.talen-tile.wrong')).toHaveCount(1);
    }
    await page.locator(`.talen-tile[data-pick="${id}"]`).click();
    await expect(page.locator('.talen-tile.correct')).toHaveCount(1);
    if (round < 7) await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.talen.round), { timeout: 15000 }).toBe(round + 1);
  }
  await expect(page.locator('.talen-result')).toBeVisible({ timeout: 15000 });
}

test('Home: the Runner is a banner under the worlds, Talen is first in "Speel ook" and Memo last', async ({ page }) => {
  await boot(page, { state: SAVED({ progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], games: { jungle: { best: 42 } } } }) });
  const runner = page.locator('#homeJungle.home-mega');
  await expect(runner).toContainText('Runner');
  await expect(runner).toContainText('Ren, spring en pak munten');
  await expect(runner.locator('.home-world-level')).toContainText('42');
  const [r, w, s] = [await runner.boundingBox(), await page.locator('.home-world').last().boundingBox(), await page.locator('.home-games').boundingBox()];
  expect(r.y).toBeGreaterThan(w.y); expect(r.y).toBeLessThan(s.y);
  const games = await page.locator('.home-games > button').evaluateAll(els => els.map(e => e.id));
  expect(games[0]).toBe('homeTalen');
  expect(games[games.length - 1]).toBe('homeMemo');
  await expect(page.locator('#homeTalen')).toContainText('Talen');
  await expect(page.locator('#homeTalen .home-world-level')).toHaveCount(0);   // no badge before the first lesson
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-pass h1')).toHaveText('Taalpaspoort');
});

test('a lesson of 8 rounds with one wrong tap: 7 right first time = 3 stars, kept per theme with Leitner boxes; sound order after a right answer', async ({ page }) => {
  test.setTimeout(150000);
  const clips = [];
  await boot(page, { clips });
  await page.locator('#homeTalen').click();
  await page.locator('#talenStart').click();
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  // the first round opens with the intro, then the word in English
  await expect.poll(() => clips.slice(0, 2)).toEqual(['nl/_intro.mp3', `en/${await current(page)}.mp3`]);
  const first = await current(page);
  clips.length = 0;
  await page.locator(`.talen-tile[data-pick="${first}"]`).click();
  await expect.poll(() => clips.slice(0, 4), { timeout: 8000 }).toEqual(['nl/_goedzo.mp3', `en/${first}.mp3`, 'nl/_betekent.mp3', `nl/${first}.mp3`]);
  await expect(page.locator('.talen-tile.correct .talen-label')).toContainText('betekent');
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.talen.round), { timeout: 15000 }).toBe(1);
  // the rest, with one wrong tap in round 4
  for (let round = 1; round < 8; round++) {
    const id = await current(page);
    if (round === 3) { clips.length = 0; await page.locator(`.talen-tile:not([data-pick="${id}"])`).first().click(); await expect.poll(() => clips.slice(0, 2)).toEqual(['nl/_bijna.mp3', `en/${id}.mp3`]); }
    await page.locator(`.talen-tile[data-pick="${id}"]`).click();
    if (round < 7) await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.talen.round), { timeout: 15000 }).toBe(round + 1);
  }
  await expect(page.locator('.talen-result')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.talen-result .result-stars i.on')).toHaveCount(3);
  await expect(page.locator('.talen-result h1')).toHaveText('Je kent de dieren!');
  await expect(page.locator('.talen-result .talen-chip')).toHaveCount(8);
  const st = await page.evaluate(() => { const T = window.KWIZILLO_M1.progress().talen; return { stars: T.themes.dieren.stars, words: T.words }; });
  expect(st.stars).toBe(3);
  const boxes = Object.entries(st.words);
  expect(boxes).toHaveLength(8);
  expect(boxes.every(([k]) => k.startsWith('en:'))).toBe(true);
  expect(boxes.filter(([, w]) => w.box === 2)).toHaveLength(7);   // right first time: box 1 → 2
  expect(boxes.filter(([, w]) => w.box === 1)).toHaveLength(1);   // missed once: back to box 1
  // the closing line in the chosen guide's voice
  await expect.poll(() => clips).toContain('nl/milo/_klaar_dieren.mp3');
  // stamp on the Home tile
  await page.evaluate(() => window.KWIZILLO_M1.showHome());
  await expect(page.locator('#homeTalen .home-world-level')).toHaveText('★ 1/5');
});

test('progress is per player: Sara does not get Mike\'s stars', async ({ page }) => {
  test.setTimeout(150000);
  await boot(page);
  await page.evaluate(() => {
    localStorage.setItem('kwizillo-players', JSON.stringify({ sara: { savedAt: Date.now() - 1000, state: { ...window.KWIZILLO_M1.state, name: 'Sara', progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], talen: { themes: { dieren: { stars: 1, played: 1 } }, words: {} } } } } }));
  });
  await page.locator('#homeTalen').click();
  await page.locator('#talenStart').click();
  await playLesson(page);
  expect(await page.evaluate(() => window.KWIZILLO_M1.progress().talen.themes.dieren.stars)).toBe(3);
  await page.evaluate(() => { window.KWIZILLO_M1.players.stash(); window.KWIZILLO_M1.showPlayerPicker(); });
  await page.locator('[data-player="Sara"]').click();
  await expect(page.locator('.home')).toBeVisible();
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.name, window.KWIZILLO_M1.progress().talen.themes.dieren.stars])).toEqual(['Sara', 1]);
});

test('a Premium theme has a lock without Premium and opens with it; unfinished themes say "binnenkort"', async ({ page }) => {
  const addTheme = () => page.evaluate(() => { const T = window.KWIZILLO_M1.TALEN; const k = T.themes.find(x => x.id === 'kleuren'); k.words = T.themes[0].words.slice(0, 6); window.KWIZILLO_M1.showTalen(); });
  await boot(page);
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-stamp.soon')).toHaveCount(4);
  await expect(page.locator('.talen-stamp.soon').first()).toContainText('binnenkort');
  await addTheme();
  await expect(page.locator('[data-theme="kleuren"].locked .premium-badge')).toBeVisible();
  await page.locator('[data-theme="kleuren"]').click();
  await expect(page.locator('.premium-teaser p')).toContainText('Premium');
  expect(await page.evaluate(() => window.KWIZILLO_M1.talen?.theme)).toBeFalsy();
});

test('with Premium the other themes open', async ({ page }) => {
  await boot(page, { premium: true });
  await page.evaluate(() => { const T = window.KWIZILLO_M1.TALEN; T.themes.find(x => x.id === 'kleuren').words = T.themes[0].words.slice(0, 6); window.KWIZILLO_M1.showTalen(); });
  await expect(page.locator('[data-theme="kleuren"]')).not.toHaveClass(/locked/);
  await page.locator('[data-theme="kleuren"]').click();
  await expect(page.locator('.talen-tile')).toHaveCount(4);
});

test('an English child learns Dutch; another app language says "binnenkort"; the parent can set the learning language', async ({ page }) => {
  const clips = [];
  await boot(page, { state: SAVED({ language: 'en' }), clips });
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Learn Dutch with Milo');
  await page.locator('#talenStart').click();
  await expect.poll(() => clips.slice(0, 2)).toEqual(['en/_intro.mp3', `nl/${await current(page)}.mp3`]);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.stopSpeech(); K.setLanguage('de'); K.useBank(); K.showTalen(); });
  await expect(page.locator('.talen-soon-lang')).toContainText('Bald auch in deiner Sprache');
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.setLanguage('nl'); K.useBank(); K.showParent(); });
  await expect(page.locator('.learn-card [data-learn]')).toHaveCount(1);   // phase 1: a Dutch child learns English
  await expect(page.locator('.learn-card [data-learn="en"]')).toHaveClass(/active/);
});

test('works without a network: every clip and picture comes from the app itself', async ({ page }) => {
  test.setTimeout(150000);
  const external = [];
  await boot(page);
  page.on('request', r => { const u = new URL(r.url()); if (u.host !== '127.0.0.1:8080' || u.pathname.startsWith('/api/')) external.push(r.url()); });
  await page.locator('#homeTalen').click();
  await page.locator('#talenStart').click();
  await playLesson(page, { wrongAt: 2 });
  expect(external).toEqual([]);
});
