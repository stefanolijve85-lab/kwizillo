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
  await expect(page.locator('.talen-pass h1.game-name')).toHaveText('Talen');
});

test('a lesson of 8 rounds with one wrong tap: 7 right first time = 3 stars, kept per theme with Leitner boxes; sound order after a right answer', async ({ page }) => {
  test.setTimeout(150000);
  const clips = [];
  await boot(page, { clips });
  await page.locator('#homeTalen').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  // the first round opens with the intro, then the word in English
  await expect.poll(() => clips.slice(0, 2)).toEqual(['nl/_intro.mp3', `en/${await current(page)}.mp3`]);
  const first = await current(page);
  clips.length = 0;
  await page.locator(`.talen-tile[data-pick="${first}"]`).click();
  await expect.poll(() => clips.slice(0, 4), { timeout: 8000 }).toEqual([expect.stringMatching(/^nl\/_goed([1-9]|10)\.mp3$/), `en/${first}.mp3`, 'nl/_betekent.mp3', `nl/${first}.mp3`]);
  await expect(page.locator('.talen-tile.correct .talen-label')).toContainText('betekent');
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.talen.round), { timeout: 15000 }).toBe(1);
  // the rest, with one wrong tap in round 4
  for (let round = 1; round < 8; round++) {
    const id = await current(page);
    if (round === 3) { clips.length = 0; await page.locator(`.talen-tile:not([data-pick="${id}"])`).first().click(); await expect.poll(() => clips.slice(0, 2)).toEqual([expect.stringMatching(/^nl\/_bijna[1-4]\.mp3$/), `en/${id}.mp3`]); }
    await page.locator(`.talen-tile[data-pick="${id}"]`).click();
    if (round < 7) await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.talen.round), { timeout: 15000 }).toBe(round + 1);
  }
  await expect(page.locator('.talen-result')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.talen-result .result-stars i.on')).toHaveCount(3);
  await expect(page.locator('.talen-result h1')).toHaveText('Je kent de dieren!');
  await expect(page.locator('.talen-result .talen-chip')).toHaveCount(8);
  const st = await page.evaluate(() => { const T = window.KWIZILLO_M1.progress().talen; return { stars: T.themes['en:dieren'].stars, words: T.words }; });
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
  await expect(page.locator('#homeTalen .home-world-level')).toHaveText('★ 1/8');
});

test('progress is per player: Sara does not get Mike\'s stars', async ({ page }) => {
  test.setTimeout(150000);
  await boot(page);
  await page.evaluate(() => {
    localStorage.setItem('kwizillo-players', JSON.stringify({ sara: { savedAt: Date.now() - 1000, state: { ...window.KWIZILLO_M1.state, name: 'Sara', progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], talen: { themes: { dieren: { stars: 1, played: 1 } }, words: {} } } } } }));
  });
  await page.locator('#homeTalen').click();
  await page.locator('[data-theme="dieren"]').click();
  await playLesson(page);
  expect(await page.evaluate(() => window.KWIZILLO_M1.progress().talen.themes['en:dieren'].stars)).toBe(3);
  await page.evaluate(() => { window.KWIZILLO_M1.players.stash(); window.KWIZILLO_M1.showPlayerPicker(); });
  await page.locator('[data-player="Sara"]').click();
  await expect(page.locator('.home')).toBeVisible();
  // Sara's record from phase 1 (per theme only) is read as her English one
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.name, window.KWIZILLO_M1.talenSummary().themes[0].stars])).toEqual(['Sara', 1]);
});

test('eight themes and a mix, all playable: animals free, the other seven and the mix with a Premium lock that opens the teaser; the picker does not scroll', async ({ page }) => {
  await boot(page);
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-pass .panel-head h1.game-name')).toHaveText('Talen');
  // Like the other game pickers: the mix as the wide tile on top, the eight themes below it.
  await expect(page.locator('.talen-pass .panel-scroll > .memo-pick.mix[data-theme="mix"]')).toHaveCount(1);
  await expect(page.locator('.talen-picks .talen-pick')).toHaveCount(8);
  await expect(page.locator('.talen-pick.soon')).toHaveCount(0);
  // Getallen shows its own cover (1 2 3), not the "one" word picture with its star.
  await expect(page.locator('[data-theme="getallen"] .talen-pick-art')).toHaveAttribute('src', /cover-getallen\.jpg/);
  await expect(page.locator('[data-theme].locked')).toHaveCount(8);
  await expect(page.locator('[data-theme="mix"]')).toHaveText(/Mix/);
  expect(await page.locator('.talen-pass .panel-scroll').evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-theme="dieren"]')).not.toHaveClass(/locked/);
  await page.locator('[data-theme="vervoer"]').click();
  await expect(page.locator('.premium-teaser p')).toContainText('Premium');
  expect(await page.evaluate(() => window.KWIZILLO_M1.talen?.theme)).toBeFalsy();
});

test('with Premium the other themes open', async ({ page }) => {
  await boot(page, { premium: true });
  await page.evaluate(() => window.KWIZILLO_M1.showTalen());
  await expect(page.locator('[data-theme].locked')).toHaveCount(0);
  await expect(page.locator('[data-theme="kleuren"]')).not.toHaveClass(/locked/);
  await page.locator('[data-theme="kleuren"]').click();
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  // the mix: eight words from all themes, the pictures on the tiles from any of them
  await page.evaluate(() => { window.KWIZILLO_M1.stopSpeech(); window.KWIZILLO_M1.startTalen('mix'); });
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  const g = await page.evaluate(() => ({ theme: window.KWIZILLO_M1.talen.theme, pool: window.KWIZILLO_M1.talen.pool.length, words: window.KWIZILLO_M1.talen.words.length }));
  expect(g).toEqual({ theme: 'mix', pool: 80, words: 8 });
});

test('every app language learns: English for a Dutch child and Dutch for an English one by default, English for the rest; the parent picks any of the other nine', async ({ page }) => {
  const clips = [];
  await boot(page, { state: SAVED({ language: 'en' }), clips });
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Learn Dutch with Milo');
  await page.locator('[data-theme="dieren"]').click();
  await expect.poll(() => clips.slice(0, 2)).toEqual(['en/_intro.mp3', `nl/${await current(page)}.mp3`]);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.stopSpeech(); K.setLanguage('de'); K.useBank(); K.showTalen(); });
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Lerne Englisch mit Milo');
  await expect(page.locator('.talen-soon-lang')).toHaveCount(0);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.setLanguage('nl'); K.useBank(); K.showParent(); });
  await expect(page.locator('.learn-card [data-learn]')).toHaveCount(9);
  await expect(page.locator('.learn-card [data-learn="en"]')).toHaveClass(/active/);
  // a Dutch child learning German: German words, Dutch around them, and a fresh stamp
  await page.locator('.learn-card [data-learn="de"]').click();
  await page.evaluate(() => window.KWIZILLO_M1.showTalen());
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Leer Duits met Milo');
  clips.length = 0;
  await page.locator('[data-theme="dieren"]').click();
  await expect.poll(() => clips.slice(0, 2)).toEqual(['nl/_intro.mp3', `de/${await current(page)}.mp3`]);
});

test('eight themes of ten words: every word, picture, line and closing line exists in all ten languages', async () => {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'talen-data.js'), 'utf8'), ctx);
  const T = ctx.window.KWIZILLO_M1.TALEN, dir = path.join(__dirname, '..', 'assets', 'talen', 'audio');
  expect(T.langs).toHaveLength(10);
  expect(T.themes.map(t => t.words.length)).toEqual([10, 10, 10, 10, 10, 10, 10, 10]);
  for (const l of T.langs) {
    for (const th of T.themes) for (const w of th.words) { expect(w.text[l], `${w.id} in ${l}`).toBeTruthy(); expect(fs.existsSync(path.join(dir, l, `${w.id}.mp3`)), `${l}/${w.id}`).toBe(true); expect(fs.existsSync(path.join(__dirname, '..', w.img)), w.img).toBe(true); }
    for (let i = 1; i <= T.praise; i++) expect(fs.existsSync(path.join(dir, l, `_goed${i}.mp3`)), `${l} _goed${i}`).toBe(true);
    for (let i = 1; i <= T.almost; i++) expect(fs.existsSync(path.join(dir, l, `_bijna${i}.mp3`)), `${l} _bijna${i}`).toBe(true);
    for (const g of ['milo', 'luna']) for (const th of T.themes) expect(fs.existsSync(path.join(dir, l, g, `_klaar_${th.id}.mp3`)), `${l}/${g}/_klaar_${th.id}`).toBe(true);
  }
});

test('works without a network: every clip and picture comes from the app itself', async ({ page }) => {
  test.setTimeout(150000);
  const external = [];
  await boot(page);
  page.on('request', r => { const u = new URL(r.url()); if (u.host !== '127.0.0.1:8080' || u.pathname.startsWith('/api/')) external.push(r.url()); });
  await page.locator('#homeTalen').click();
  await page.locator('[data-theme="dieren"]').click();
  await playLesson(page, { wrongAt: 2 });
  expect(external).toEqual([]);
});

test('Talen in the overviews: a Woordjes tab in the collection, a line in the statistics, two achievements', async ({ page }) => {
  const now = Date.now(), w = id => [`en:${id}`, { seen: 1, firstTryOk: 1, lastSeen: now, box: 2 }];
  const talen = { themes: { dieren: { stars: 2, played: 3 } }, words: Object.fromEntries(['dolphin', 'octopus', 'whale', 'seal', 'parrot', 'frog', 'snake', 'gorilla', 'shark', 'chicken'].map(w)) };
  const clips = [];
  await boot(page, { state: SAVED({ progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], talen } }), clips });
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('words'));
  await expect(page.locator('[data-tab="words"]')).toHaveClass(/active/);
  await expect(page.locator('.talen-words-grid .talen-chip')).toHaveCount(10);
  await expect(page.locator('.talen-msg')).toHaveText('10 woordjes in het Engels. Tik om ze te horen.');
  await page.locator('.talen-chip[data-hear="shark"]').click();
  await expect.poll(() => clips).toEqual(['en/shark.mp3', 'nl/_betekent.mp3', 'nl/shark.mp3']);
  await page.evaluate(() => window.KWIZILLO_M1.showStats());
  await expect(page.locator('.game-stat', { hasText: 'Talen' })).toContainText('10 woordjes geleerd · 3 lessen');
  await expect(page.locator('.game-stat', { hasText: 'Talen' })).toContainText('1/8');
  await page.evaluate(() => window.KWIZILLO_M1.showAchievements());
  await expect(page.getByText('Eerste les in Talen')).toBeVisible();
  await expect(page.getByText('10 woordjes geleerd', { exact: true })).toBeVisible();
});

test('a new player sees an empty Woordjes tab that leads to Talen', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('words'));
  await expect(page.locator('.empty-state h2')).toHaveText('Nog geen woordjes');
  await page.locator('#toTalen').click();
  await expect(page.locator('.talen-pass h1.game-name')).toHaveText('Talen');
});

test('Talen strings the answer together as one sentence: the clips are joined into ONE sound played like every spoken line (one buffer through Web Audio, no <audio> element), silent ends cut, never on top of each other', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.KWIZILLO_M1 && window.KWIZILLO_M1.playClips);
  await page.mouse.click(5, 5);   // a gesture, so the audio context may run
  const r = await page.evaluate(async () => {
    const K = window.KWIZILLO_M1, started = [], elements = [];
    const st = AudioBufferSourceNode.prototype.start, ap = HTMLMediaElement.prototype.play;
    AudioBufferSourceNode.prototype.start = function (...a) { started.push(this.buffer.duration); return st.apply(this, a) };
    HTMLMediaElement.prototype.play = function () { elements.push(this.src); return ap.call(this) };
    const done = K.playClips(['assets/talen/audio/nl/_goed1.mp3', 'assets/talen/audio/en/shark.mp3', 'assets/talen/audio/nl/_betekent.mp3', 'assets/talen/audio/nl/shark.mp3'], { gap: [60, 0, 0] });
    await new Promise(ok => { const t = setInterval(() => { if (started.length) { clearInterval(t); ok() } }, 20); setTimeout(ok, 5000) });
    AudioBufferSourceNode.prototype.start = st; HTMLMediaElement.prototype.play = ap;
    K.stopSpeech(); await done;
    return { started, elements };
  });
  expect(r.started).toHaveLength(1);
  expect(r.started[0]).toBeGreaterThan(1.5);   // the four clips, end to end
  expect(r.elements).toEqual([]);
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'games-talen.js'), 'utf8');
  expect(src).toMatch(/gap:\[\d+,\d+,\d+\]/);   // no overlap: a negative gap put the next word over the end of the one before
});

test('the hint sits beside "Nog een keer": it fades one wrong picture (two at most) and the word no longer counts as right first time', async ({ page }) => {
  await boot(page);
  await page.locator('#homeTalen').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect(page.locator('.talen-actions .action')).toHaveCount(2);
  const [a, b] = await page.locator('.talen-actions .action').evaluateAll(els => els.map(e => e.getBoundingClientRect().width));
  expect(Math.abs(a - b)).toBeLessThan(2);
  await page.locator('#talenHint').click();
  await expect(page.locator('.talen-tile.hinted')).toHaveCount(1);
  await page.locator('#talenHint').click();
  await expect(page.locator('.talen-tile.hinted')).toHaveCount(2);
  await expect(page.locator('#talenHint')).toBeDisabled();
  const id = await current(page);
  await expect(page.locator(`.talen-tile.hinted[data-pick="${id}"]`)).toHaveCount(0);
  await page.locator(`.talen-tile[data-pick="${id}"]`).click();
  expect(await page.evaluate(() => window.KWIZILLO_M1.talen.firstTry)).toBe(0);
});

test('a right answer writes out "shark betekent haai" in the bubble, piece by piece as it is said', async ({ page }) => {
  await boot(page);
  await page.locator('#homeTalen').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  const id = await current(page);
  await page.locator(`.talen-tile[data-pick="${id}"]`).click();
  await expect(page.locator('.talen-say .talen-piece')).toHaveCount(3);
  await expect(page.locator('.talen-say .talen-piece.on')).toHaveCount(3, { timeout: 8000 });
  const [en, nl] = await page.evaluate(i => { const w = window.KWIZILLO_M1.talenWord(i); return [w.text.en, w.text.nl]; }, id);
  await expect(page.locator('.talen-say')).toHaveText(`${en} betekent ${nl}`);
});

test('the lesson result fits a small phone without scrolling: both buttons in view, every learned word with its translation', async ({ page }) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 375, height: 667 });
  await boot(page);
  await page.locator('#homeTalen').click();
  await page.locator('[data-theme="dieren"]').click();
  await playLesson(page);
  for (const sel of ['#againBtn', '#passBtn']) {
    const b = await page.locator(sel).boundingBox();
    expect(b.y + b.height).toBeLessThanOrEqual(667);
    await expect(page.locator(sel)).toBeInViewport({ ratio: 1 });
  }
  expect(await page.locator('.talen-result .result-v2-card').evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.locator('.talen-learned .talen-chip')).toHaveCount(8);
  // under each word only its translation ("dolfijn 🔊"), so it is never cut off after "betekent"
  const smalls = await page.locator('.talen-learned .talen-chip small').allInnerTexts();
  for (const x of smalls) { expect(x).toMatch(/ 🔊$/); expect(x).not.toContain('betekent'); }
});
