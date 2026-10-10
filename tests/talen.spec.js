// Talen, phase 1: the passport and "Hoor en tik" (talen-data.js, games-talen.js).
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Milo',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte', learnLang: 'en',
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

test('Home: "Speel ook" is four tiles like the worlds — Talen, Rekenen, Runner, Spellenkist — and the Spellenkist holds Memo, Weetjes, Fotozoom, Wat ben ik? and Blokkenpret', async ({ page }) => {
  await boot(page, { state: SAVED({ progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], games: { jungle: { best: 42 } } } }) });
  const tiles = await page.locator('.home-play > button').evaluateAll(els => els.map(e => e.id));
  expect(tiles).toEqual(['homeTalen', 'homeMath', 'homeJungle', 'homeChest']);
  await expect(page.locator('#homeJungle')).toContainText('Runner');
  await expect(page.locator('#homeJungle .home-world-level')).toContainText('42');
  await expect(page.locator('#homeChest')).toContainText('Spellenkist');
  // the same size as a world tile, under the worlds
  const [w, p] = [await page.locator('.home-world[data-world]').last().boundingBox(), await page.locator('#homeChest').boundingBox()];
  expect(Math.abs(w.width - p.width)).toBeLessThan(2); expect(Math.abs(w.height - p.height)).toBeLessThan(2); expect(p.y).toBeGreaterThan(w.y);
  await page.locator('#homeChest').click();
  await expect(page.locator('.chest-pick h1.game-name')).toHaveText('Spellenkist');
  expect(await page.locator('.chest-pick .math-pick-tile').evaluateAll(els => els.map(e => e.id))).toEqual(['homeMemo', 'homeFacts', 'homeFotozoom', 'homeWhoAmI', 'homeBlokken']);
  await page.locator('#homeFotozoom').click();
  await page.locator('.panel-back').click();                       // back to the Spellenkist, not to Home
  await expect(page.locator('.chest-pick')).toBeVisible();
  await page.locator('.panel-back').click();
  await expect(page.locator('.home')).toBeVisible();
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
  await page.locator('[data-cat="words"]').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  // the first round opens with the intro, then the word in English
  await expect.poll(() => clips.slice(0, 2)).toEqual(['nl/_intro.mp3', `en/${await current(page)}.mp3`]);
  const first = await current(page);
  clips.length = 0;
  await page.locator(`.talen-tile[data-pick="${first}"]`).click();
  await expect.poll(() => clips.slice(0, 4), { timeout: 8000 }).toEqual([expect.stringMatching(/^nl\/_goed([1-9]|1[0-6])\.mp3$/), `en/${first}.mp3`, 'nl/_betekent.mp3', `nl/${first}.mp3`]);
  await expect(page.locator('.talen-tile.correct .talen-label')).toContainText('betekent');
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.talen.round), { timeout: 15000 }).toBe(1);
  // the rest, with one wrong tap in round 4
  for (let round = 1; round < 8; round++) {
    const id = await current(page);
    if (round === 3) { clips.length = 0; await page.locator(`.talen-tile:not([data-pick="${id}"])`).first().click(); await expect.poll(() => clips.slice(0, 2)).toEqual([expect.stringMatching(/^nl\/_bijna[1-6]\.mp3$/), `en/${id}.mp3`]); }
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
  await expect(page.locator('#homeTalen .home-world-level')).toHaveText('★ 1/18');
});

test('progress is per player: Sara does not get Mike\'s stars', async ({ page }) => {
  test.setTimeout(150000);
  await boot(page);
  await page.evaluate(() => {
    localStorage.setItem('kwizillo-players', JSON.stringify({ sara: { savedAt: Date.now() - 1000, state: { ...window.KWIZILLO_M1.state, name: 'Sara', progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], talen: { themes: { dieren: { stars: 1, played: 1 } }, words: {} } } } } }));
  });
  await page.locator('#homeTalen').click();
  await page.locator('[data-cat="words"]').click();
  await page.locator('[data-theme="dieren"]').click();
  await playLesson(page);
  expect(await page.evaluate(() => window.KWIZILLO_M1.progress().talen.themes['en:dieren'].stars)).toBe(3);
  await page.evaluate(() => { window.KWIZILLO_M1.players.stash(); window.KWIZILLO_M1.showPlayerPicker(); });
  await page.locator('[data-player="Sara"]').click();
  await expect(page.locator('.home')).toBeVisible();
  // Sara's record from phase 1 (per theme only) is read as her English one
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.name, window.KWIZILLO_M1.talenSummary().themes[0].stars])).toEqual(['Sara', 1]);
});

test('eighteen themes and a mix, all playable: animals free, the rest and the mix with a Premium lock that opens the teaser; the passport opens on wide tiles per kind', async ({ page }) => {
  await boot(page);
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-pass .panel-head h1.game-name')).toHaveText('Talen');
  // Wide tiles: Woordjes and Zinnetjes, each with three of its pictures
  // since 2026-10-10 also Gesprekjes and Spreken (tested further down)
  await expect(page.locator('.talen-cat')).toHaveText([/Woordjes.*14 thema's/, /Zinnetjes.*4 thema's/, /Gesprekjes/, /Spreken/]);
  await expect(page.locator('.talen-cat .talen-cat-fan img')).toHaveCount(6);
  const cat = await page.locator('.talen-cat').first().boundingBox();
  expect(cat.width / cat.height).toBeGreaterThan(2);
  // Woordjes: the mix as the wide tile on top, then fourteen word themes
  await page.locator('[data-cat="words"]').click();
  await expect(page.locator('.talen-cat-title')).toHaveCount(0);                // no "Woordjes" heading once chosen
  await expect(page.locator('.talen-pass .panel-scroll > .memo-pick.mix[data-theme="mix"]')).toHaveCount(1);
  await expect(page.locator('.talen-picks .talen-pick')).toHaveCount(14);
  await expect(page.locator('.talen-pick.soon')).toHaveCount(0);
  // Getallen shows its own cover (1 2 3), not the "one" word picture with its star.
  await expect(page.locator('[data-theme="getallen"] .talen-pick-art')).toHaveAttribute('src', /cover-getallen\.jpg/);
  await expect(page.locator('[data-theme].locked')).toHaveCount(14);
  await expect(page.locator('[data-theme="mix"]')).toHaveText(/Mix/);
  await expect(page.locator('[data-theme="dieren"]')).not.toHaveClass(/locked/);
  // back to the wide tiles, then Zinnetjes: four themes and their own sentence mix (mixzin)
  await page.locator('.panel-back').click();
  await expect(page.locator('.talen-cat')).toHaveCount(4);
  await page.locator('[data-cat="sentences"]').click();
  await expect(page.locator('.talen-picks.zinnen .talen-pick.zin')).toHaveCount(4);
  await expect(page.locator('[data-theme="mix"]')).toHaveCount(0);
  await expect(page.locator('[data-theme].locked')).toHaveCount(5);   // the four themes and, since 2026-10-10, the sentence mix bar
  // the last tile is reachable and keeps its shape (not squeezed into the screen)
  await page.locator('[data-theme="samen"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-theme="samen"]')).toBeInViewport({ ratio: 1 });
  const box = await page.locator('[data-theme="samen"]').boundingBox();
  expect(box.width / box.height).toBeLessThan(2);
  await page.locator('[data-theme="samen"]').click();
  await expect(page.locator('.premium-teaser p')).toContainText('Premium');
  expect(await page.evaluate(() => window.KWIZILLO_M1.talen?.theme)).toBeFalsy();
});

test('the child picks the language they speak too: meanings and praise in that one, the app stays in its own language; a lesson goes back to its themes', async ({ page }) => {
  const clips = [];
  await boot(page, { premium: true, clips });
  await page.locator('#homeTalen').click();
  await page.locator('#talenLang').click();
  await expect(page.locator('.talen-ask-bubble').first()).toHaveText('Ik spreek');
  await expect(page.locator('.talen-speaks [data-speak]')).toHaveCount(10);
  await expect(page.locator('.talen-speaks [data-speak]').first()).toHaveAttribute('data-speak', 'nl');
  await expect(page.locator('[data-speak="nl"]')).toHaveClass(/active/);
  // speaking German: German is no longer a language to learn, English still is
  clips.length = 0;
  await page.locator('[data-speak="de"]').click();
  await expect.poll(() => clips).toEqual(['de/hello.mp3']);
  await expect(page.locator('[data-speak="de"]')).toHaveClass(/active/);
  await expect(page.locator('.talen-flags [data-learn]')).toHaveCount(9);
  await expect(page.locator('[data-learn="de"]')).toHaveCount(0);
  await expect(page.locator('[data-learn="nl"]')).toHaveCount(1);
  await page.locator('[data-learn="fr"]').click();
  await page.locator('#talenGo').click();
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.talenSpeak, window.KWIZILLO_M1.state.learnLang, window.KWIZILLO_M1.state.language])).toEqual(['de', 'fr', 'nl']);
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Leer Frans met Milo');
  clips.length = 0;
  await page.locator('[data-cat="words"]').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect.poll(() => clips.slice(0, 2)).toEqual(['de/_intro.mp3', `fr/${await current(page)}.mp3`]);
  // back from the lesson: the word themes, not the wide tiles
  await page.evaluate(() => window.KWIZILLO_M1.stopSpeech());
  await page.locator('#talenBack').click();
  await expect(page.locator('.talen-picks .talen-pick')).toHaveCount(14);
  // speaking the app language again stores nothing extra
  await page.evaluate(() => window.KWIZILLO_M1.showTalenPick());
  await page.locator('[data-speak="nl"]').click();
  await page.locator('[data-learn="en"]').click();
  await page.locator('#talenGo').click();
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.talenSpeak)).toBeNull();
});

test('with Premium the other themes open', async ({ page }) => {
  await boot(page, { premium: true });
  await page.evaluate(() => window.KWIZILLO_M1.showTalenCat('words'));
  await expect(page.locator('[data-theme].locked')).toHaveCount(0);
  await expect(page.locator('[data-theme="kleuren"]')).not.toHaveClass(/locked/);
  await page.locator('[data-theme="kleuren"]').click();
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  // the mix: eight words from all themes, the pictures on the tiles from any of them
  await page.evaluate(() => { window.KWIZILLO_M1.stopSpeech(); window.KWIZILLO_M1.startTalen('mix'); });
  await expect(page.locator('.talen-tile')).toHaveCount(4);
  const g = await page.evaluate(() => ({ theme: window.KWIZILLO_M1.talen.theme, pool: window.KWIZILLO_M1.talen.pool.length, words: window.KWIZILLO_M1.talen.words.length }));
  expect(g).toEqual({ theme: 'mix', pool: 140, words: 8 });   // fourteen word themes; sentences stay out of the mix
});

test('every app language learns: English for a Dutch child and Dutch for an English one by default, English for the rest; the child picks any of the other nine in Talen', async ({ page }) => {
  const clips = [];
  await boot(page, { state: SAVED({ language: 'en' }), clips });
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Learn Dutch with Milo');
  await page.locator('[data-cat="words"]').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect.poll(() => clips.slice(0, 2)).toEqual(['en/_intro.mp3', `nl/${await current(page)}.mp3`]);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.stopSpeech(); K.setLanguage('de'); K.useBank(); K.showTalen(); });
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Lerne Englisch mit Milo');
  await expect(page.locator('.talen-soon-lang')).toHaveCount(0);
  // the parents' menu has the app language, not the learning language any more
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.setLanguage('nl'); K.useBank(); K.showParent(); });
  await expect(page.locator('[data-setlang]').first()).toBeVisible();
  await expect(page.locator('[data-learn]')).toHaveCount(0);
  // in Talen: the flag above the passport opens the choice, the current one marked
  await page.evaluate(() => window.KWIZILLO_M1.showTalen());
  await expect(page.locator('#talenLang')).toContainText('Engels');
  await page.locator('#talenLang').click();
  await expect(page.locator('.talen-flags [data-learn]')).toHaveCount(9);
  await expect(page.locator('[data-learn="en"]')).toHaveClass(/active/);
  // a Dutch child learning German: "hallo" in German, then German words, Dutch around them, and a fresh stamp
  clips.length = 0;
  await page.locator('[data-learn="de"]').click();
  await expect.poll(() => clips).toEqual(['de/hello.mp3']);
  await expect(page.locator('#talenGo')).toHaveText(/Leer Duits!/);
  await page.locator('#talenGo').click();
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Leer Duits met Milo');
  clips.length = 0;
  await page.locator('[data-cat="words"]').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect.poll(() => clips.slice(0, 2)).toEqual(['nl/_intro.mp3', `de/${await current(page)}.mp3`]);
});

test('eighteen themes of ten: every word or sentence, picture or emoji, line and closing line exists in all ten languages', async () => {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'talen-data.js'), 'utf8'), ctx);
  const T = ctx.window.KWIZILLO_M1.TALEN, dir = path.join(__dirname, '..', 'assets', 'talen', 'audio');
  expect(T.langs).toHaveLength(10);
  expect(T.themes.map(t => t.words.length)).toEqual(Array(18).fill(10));
  // Milo's clips in <lang>/, Luna's in <lang>/luna/: a child who chose Luna hears only Luna.
  for (const l of T.langs) for (const g of ['', 'luna']) {
    for (const th of T.themes) for (const w of th.words) { expect(w.text[l], `${w.id} in ${l}`).toBeTruthy(); expect(fs.existsSync(path.join(dir, l, g, `${w.id}.mp3`)), `${l}/${g}/${w.id}`).toBe(true); if (w.emoji) expect(w.img).toBeUndefined(); else expect(fs.existsSync(path.join(__dirname, '..', w.img)), w.img).toBe(true); }
    for (let i = 1; i <= T.praise; i++) expect(fs.existsSync(path.join(dir, l, g, `_goed${i}.mp3`)), `${l}/${g} _goed${i}`).toBe(true);
    for (let i = 1; i <= T.almost; i++) expect(fs.existsSync(path.join(dir, l, g, `_bijna${i}.mp3`)), `${l}/${g} _bijna${i}`).toBe(true);
    for (const k of ['_intro', '_intro_zin', '_betekent']) expect(fs.existsSync(path.join(dir, l, g, `${k}.mp3`)), `${l}/${g} ${k}`).toBe(true);
  }
  for (const l of T.langs) {
    for (const g of ['milo', 'luna']) for (const th of T.themes) expect(fs.existsSync(path.join(dir, l, g, `_klaar_${th.id}.mp3`)), `${l}/${g}/_klaar_${th.id}`).toBe(true);
  }
});

test('works without a network: every clip and picture comes from the app itself', async ({ page }) => {
  test.setTimeout(150000);
  const external = [];
  await boot(page);
  page.on('request', r => { const u = new URL(r.url()); if (u.host !== '127.0.0.1:8080' || u.pathname.startsWith('/api/')) external.push(r.url()); });
  await page.locator('#homeTalen').click();
  await page.locator('[data-cat="words"]').click();
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
  await expect(page.locator('.game-stat', { hasText: 'Talen' })).toContainText('1/18');
  await page.evaluate(() => window.KWIZILLO_M1.showAchievements());
  await expect(page.getByText('Eerste les in Talen')).toBeVisible();
  await expect(page.getByText('10 woordjes geleerd', { exact: true })).toBeVisible();
});

test('a child who chose Luna hears only Luna in Talen, never Milo', async ({ page }) => {
  const now = Date.now(), w = id => [`en:${id}`, { seen: 1, firstTryOk: 1, lastSeen: now, box: 2 }];
  const talen = { themes: { dieren: { stars: 2, played: 3 } }, words: Object.fromEntries(['shark'].map(w)) };
  const clips = [];
  await boot(page, { state: SAVED({ voice: 'Luna', progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], talen } }), clips });
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('words'));
  await page.locator('.talen-chip[data-hear="shark"]').click();
  await expect.poll(() => clips).toEqual(['en/luna/shark.mp3', 'nl/luna/_betekent.mp3', 'nl/luna/shark.mp3']);
  // and the lesson itself: the intro, the words and the praise all from luna/
  clips.length = 0;
  await page.evaluate(() => window.KWIZILLO_M1.showHome());
  await page.locator('#homeTalen').click();
  await page.locator('[data-cat="words"]').click();
  await page.locator('[data-theme="dieren"]').click();
  await expect(page.locator('.talen-tile').first()).toBeVisible({ timeout: 10000 });
  const id = await current(page);
  await page.locator(`.talen-tile[data-pick="${id}"]`).click();
  await expect.poll(() => clips.length, { timeout: 10000 }).toBeGreaterThan(2);
  expect(clips.filter(c => !/^[a-z]{2}\/luna\//.test(c)), 'clips outside luna/').toEqual([]);
});

test('the first time in Talen the child chooses the language: a flag per language with hello in it, one big button to the passport', async ({ page }) => {
  const clips = [];
  await boot(page, { state: SAVED({ learnLang: null, voice: 'Luna' }), clips });
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-ask-bubble').last()).toHaveText('Welke taal wil je leren?');
  await expect(page.locator('.talen-flags [data-learn]')).toHaveCount(9);   // all but the app language
  await expect(page.locator('[data-learn="nl"]')).toHaveCount(0);
  await expect(page.locator('[data-learn="fr"]')).toContainText('Frans');
  await expect(page.locator('[data-learn="fr"]')).toContainText('salut!');
  await expect(page.locator('#talenGo')).toBeHidden();                      // nothing chosen yet
  await page.locator('[data-learn="fr"]').click();
  await expect.poll(() => clips).toEqual(['fr/luna/hello.mp3']);            // in the chosen guide's voice
  await page.locator('#talenGo').click();
  await expect(page.locator('.talen-pass .panel-head p')).toHaveText('Leer Frans met Luna');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.learnLang)).toBe('fr');
  // the next time straight to the passport
  await page.evaluate(() => { window.KWIZILLO_M1.showHome(); });
  await page.locator('#homeTalen').click();
  await expect(page.locator('#talenLang')).toContainText('Frans');
  // back from a first choice goes home, nothing saved
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.learnLang = null; K.save(); K.showTalen(); });
  await page.locator('.panel-back').click();
  await expect(page.locator('.home')).toBeVisible();
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.learnLang)).toBe(null);
});

test('a child who played Talen before the choice moved there keeps the language without being asked', async ({ page }) => {
  const now = Date.now();
  await boot(page, { state: SAVED({ learnLang: null, progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], talen: { themes: { 'en:dieren': { stars: 2, played: 1 } }, words: { 'en:shark': { seen: 1, firstTryOk: 1, lastSeen: now, box: 2 } } } } }) });
  await page.locator('#homeTalen').click();
  await expect(page.locator('#talenLang')).toContainText('Engels');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.learnLang)).toBe('en');
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
  await page.locator('[data-cat="words"]').click();
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
  await page.locator('[data-cat="words"]').click();
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
  await page.locator('[data-cat="words"]').click();
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

test('a sentence theme: four cards with an emoji and the meaning, the sentence appears once found; the lesson opens with the sentence intro', async ({ page }) => {
  const clips = [];
  await boot(page, { premium: true, clips });
  await page.locator('#homeTalen').click();
  await page.locator('[data-cat="sentences"]').click();
  await page.locator('[data-theme="gevoel"]').click();
  await expect(page.locator('.talen-tile.zin')).toHaveCount(4);
  await expect(page.locator('.talen-tile.zin .talen-emoji')).toHaveCount(4);
  expect(clips[0]).toBe('nl/_intro_zin.mp3');
  const id = await current(page);
  const w = await page.evaluate(i => window.KWIZILLO_M1.talenWord(i), id);
  const card = page.locator(`.talen-tile[data-pick="${id}"]`);
  await expect(card.locator('.talen-meaning')).toHaveText(w.text.nl);
  await expect(card.locator('.talen-label')).toBeHidden();
  await page.screenshot({ path: 'test-results/talen-zin-round.png' });
  await card.click();
  await expect(card.locator('.talen-label')).toHaveText(w.text.en);
  await expect(card.locator('.talen-meaning')).toBeHidden();
});

/* ---------------- Gesprekjes and Spreken (2026-10-10) ---------------- */
// A fake microphone: a real MediaStream (an oscillator, silent unless asked), counted,
// so a test can see when it was asked for and that every track was stopped.
const MIC = mode => {
  window.__gum = { calls: 0, streams: [] };
  if (mode === 'none') { try { Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true }) } catch (e) {} return }
  navigator.mediaDevices.getUserMedia = async () => {
    window.__gum.calls++;
    if (mode === 'deny') throw new DOMException('Permission denied', 'NotAllowedError');
    const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain(), dest = ctx.createMediaStreamDestination();
    gain.gain.value = 0; osc.connect(gain);
    if (mode === 'loud') { let on = false; setInterval(() => { on = !on; gain.gain.value = on ? 0.6 : 0 }, 160) }   // syllables: sound, a pause, sound
    gain.connect(dest); osc.start();
    window.__gum.streams.push(dest.stream);
    return dest.stream;
  };
};
const ES = SAVED({ learnLang: 'es' });

test('the passport has four parts — Woordjes, Zinnetjes, Gesprekjes, Spreken — in the app language, the painted words never shown', async ({ page }) => {
  await boot(page, { state: ES });
  await page.locator('#homeTalen').click();
  await expect(page.locator('.talen-cat')).toHaveCount(4);
  expect(await page.locator('.talen-cat').evaluateAll(els => els.map(e => e.dataset.cat))).toEqual(['words', 'sentences', 'conversations', 'speaking']);
  await expect(page.locator('[data-cat="conversations"]')).toContainText('Gesprekjes');
  await expect(page.locator('[data-cat="conversations"]')).toContainText('Luister en begrijp');
  await expect(page.locator('[data-cat="speaking"]')).toContainText('Spreken');
  await expect(page.locator('[data-cat="speaking"] .talen-cat-art')).toHaveAttribute('src', /cat-speaking\.jpg/);   // the art only: the title is text
  // the same tiles as the others
  const [w, c] = [await page.locator('[data-cat="words"]').boundingBox(), await page.locator('[data-cat="conversations"]').boundingBox()];
  expect(Math.abs(w.width - c.width)).toBeLessThan(2); expect(Math.abs(w.height - c.height)).toBeLessThan(2);
  // Woordjes and Zinnetjes still open
  await page.locator('[data-cat="words"]').click();
  await expect(page.locator('.talen-picks .talen-pick')).toHaveCount(14);
  await page.locator('.panel-back').click();
  await page.locator('[data-cat="sentences"]').click();
  await expect(page.locator('.talen-picks.zinnen .talen-pick.zin')).toHaveCount(4);
  // English app: the English names; Arabic app: no key left untranslated
  for (const [lang, name] of [['en', 'Conversations'], ['ar', 'حوارات']]) {
    await page.evaluate(l => { const K = window.KWIZILLO_M1; K.setLanguage(l); K.state.learnLang = 'es'; K.showTalen(); }, lang);
    await expect(page.locator('[data-cat="conversations"]')).toContainText(name);
    expect(await page.locator('.talen-pass').innerText()).not.toMatch(/talen\.|measure\./);
  }
});

test('Gesprekjes: the lines are in the language learned, the question and answers in the child’s own; a right answer goes on, progress is kept per learning language', async ({ page }) => {
  test.setTimeout(90000);
  const clips = [];
  await boot(page, { state: ES, clips });
  await page.evaluate(() => window.KWIZILLO_M1.showTalenConv());
  await expect(page.locator('[data-conv]')).toHaveCount(7);   // the Mix bar and six situations
  await expect(page.locator('[data-conv="mix"]')).toHaveClass(/locked/);
  await expect(page.locator('[data-conv="intro"]')).not.toHaveClass(/locked/);    // Kennismaken is free
  await expect(page.locator('[data-conv="school"]')).toHaveClass(/locked/);
  await page.locator('[data-conv="intro"]').click();
  await expect(page.locator('.conv-line')).toHaveCount(2);
  await expect(page.locator('.conv-chat')).toHaveAttribute('lang', 'es');
  await expect(page.locator('.conv-line.a .conv-text')).toHaveText('¡Hola! ¿Cómo te llamas?');
  await expect(page.locator('.conv-ask')).toBeVisible({ timeout: 15000 });           // after the conversation
  await expect(page.locator('.conv-q')).toHaveText('Hoe heet het meisje?');
  await expect.poll(() => clips.filter(c => /^es\/c_intro1_/.test(c))).toEqual(['es/c_intro1_1.mp3', 'es/c_intro1_2.mp3']);
  expect(clips).toContain('nl/_q_intro1.mp3');
  // a wrong answer first: marked, not the end; then the right one
  await page.locator('.conv-opt[data-right="0"]').first().click();
  await expect(page.locator('.conv-opt.wrong')).toHaveCount(1);
  await page.locator('.conv-opt[data-right="1"]').click();
  await expect(page.locator('.conv-opt.correct')).toHaveCount(1);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Gesprekje 2 van 4', { timeout: 15000 });
  const rec = await page.evaluate(() => window.KWIZILLO_M1.progress().talen.conversations);
  expect(rec['es:intro']).toMatchObject({ answered: 1, correct: 0 });                 // the wrong tap first: answered, not right first time
  // another learning language starts empty and leaves Spanish alone
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.learnLang = 'de'; K.showTalenConv(); });
  await expect(page.locator('[data-conv="intro"] .talen-stars i.on')).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(window.KWIZILLO_M1.progress().talen.conversations))).toEqual(['es:intro']);
});

test('Gesprekjes in Luna’s voice plays only Luna’s clips, in Milo’s only Milo’s; a whole round ends on the result with stars', async ({ page }) => {
  test.setTimeout(120000);
  const clips = [];
  await boot(page, { state: SAVED({ learnLang: 'es', voice: 'Luna' }), clips });
  await page.evaluate(() => window.KWIZILLO_M1.startTalenConv('intro'));
  await expect(page.locator('.conv-ask')).toBeVisible({ timeout: 15000 });
  expect(clips.length).toBeGreaterThan(0);
  expect(clips.filter(c => !/^[a-z]{2}\/luna\//.test(c)), 'clips outside luna/').toEqual([]);
  for (let i = 0; i < 4; i++) {
    await page.locator('.conv-opt[data-right="1"]').click();
    if (i < 3) await expect(page.locator('.quiz-progress strong')).toHaveText(`Gesprekje ${i + 2} van 4`, { timeout: 15000 });
  }
  await expect(page.locator('.talen-result h1')).toHaveText('Jij begrijpt het al!', { timeout: 15000 });
  await expect(page.locator('.result-stars i.on')).toHaveCount(3);
  expect(await page.evaluate(() => window.KWIZILLO_M1.progress().talen.conversations['es:intro'])).toMatchObject({ played: 1, answered: 4, correct: 4, stars: 3 });
  // Milo
  clips.length = 0;
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.voice = 'Milo'; K.startTalenConv('intro'); });
  await expect(page.locator('.conv-ask')).toBeVisible({ timeout: 15000 });
  expect(clips.filter(c => /\/luna\//.test(c))).toEqual([]);
});

test('Spreken: the microphone is not asked for before Spreken is opened; the reason comes first; while listening it says so; leaving stops every track', async ({ page }) => {
  await page.addInitScript(MIC, 'ok');
  await boot(page, { state: ES });
  await page.locator('#homeTalen').click();
  await page.locator('[data-cat="speaking"]').click();
  expect(await page.evaluate(() => window.__gum.calls)).toBe(0);
  await page.locator('[data-speak-set="basics"]').click();
  await expect(page.locator('.speak-ask h2')).toHaveText('Spreken met de microfoon');
  await expect(page.locator('.speak-ask')).toContainText('Je stem wordt niet opgeslagen.');
  expect(await page.evaluate(() => window.__gum.calls)).toBe(0);                     // still nothing: the child decides
  await page.locator('#micEnable').click();
  await expect(page.locator('#speakMic')).toBeVisible();
  expect(await page.evaluate(() => window.__gum.calls)).toBe(1);
  expect(await page.evaluate(() => window.__gum.streams.every(s => s.getTracks().every(t => t.readyState === 'ended')))).toBe(true);   // the permission stream is closed at once
  await expect(page.locator('.speak-word b')).toHaveText('hola');
  await page.locator('#speakMic').click();
  await expect(page.locator('#speakStatus')).toContainText('Ik luister…');
  await expect(page.locator('#speakMic')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.KWIZILLO_M1.speechPractice.active())).toBe(true);
  await page.locator('#speakBack').click();                                           // leave while listening
  expect(await page.evaluate(() => window.KWIZILLO_M1.speechPractice.active())).toBe(false);
  expect(await page.evaluate(() => window.__gum.streams.length >= 2 && window.__gum.streams.every(s => s.getTracks().every(t => t.readyState === 'ended')))).toBe(true);
});

test('Spreken: a refused microphone and a browser without one both lead to practising without it; nothing of the voice is sent or stored', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(MIC, 'deny');
  const posts = [];
  // Anything but a GET, and anything that is not the speech server's text-in request, would be a leak.
  page.on('request', r => { if (r.method() === 'GET') return; const body = r.postData() || ''; let ok = false; try { const j = JSON.parse(body); ok = /\/api\/tts$/.test(r.url()) && Object.keys(j).sort().join() === 'lang,text,voice' && typeof j.text === 'string' } catch (e) {} if (!ok) posts.push(`${r.method()} ${r.url()} ${body.slice(0, 60)}`) });
  await boot(page, { state: ES });
  await page.evaluate(() => window.KWIZILLO_M1.startTalenSpeak('basics'));
  await page.locator('#micEnable').click();
  await expect(page.locator('.speak-off h2')).toHaveText('De microfoon staat uit.');
  await expect(page.locator('#micRetry')).toBeVisible();
  await expect(page.locator('#micBack')).toBeVisible();
  await page.locator('#micSkip').click();
  for (let i = 0; i < 6; i++) {
    await page.locator('#speakSaid').click();
    await expect(page.locator('#speakStatus')).toContainText('Goed geoefend!');
    await page.locator('#speakNext').click();
  }
  await expect(page.locator('.talen-result h1')).toHaveText('Goed geoefend, knap gedaan!');
  const rec = await page.evaluate(() => window.KWIZILLO_M1.progress().talen.speaking);
  expect(Object.keys(rec)).toEqual(['es']);
  expect(Object.keys(rec.es).sort()).toEqual(['completed', 'lastPlayed', 'practised']);
  expect(rec.es).toMatchObject({ practised: 6, completed: 1 });
  const stored = await page.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k)).join(''));
  expect(stored).not.toMatch(/blob:|data:audio|base64/);
  expect(posts).toEqual([]);                                                          // no sound, no upload: at most a line of text to the speech server
  // no getUserMedia at all: straight to practising without it, no retry offered
  await page.addInitScript(MIC, 'none');
  await page.reload();
  await page.waitForFunction(() => window.KWIZILLO_M1 && window.KWIZILLO_M1.startTalenSpeak);
  await page.evaluate(() => window.KWIZILLO_M1.startTalenSpeak('basics'));
  await expect(page.locator('.speak-off h2')).toHaveText('De microfoon staat uit.');
  await expect(page.locator('#micRetry')).toHaveCount(0);
  await page.locator('#micSkip').click();
  await expect(page.locator('#speakSaid')).toBeVisible();
});

test('Spreken and Gesprekjes follow Premium: the first set and Kennismaken are free, the rest opens with Premium (a school licence included)', async ({ page }) => {
  await boot(page, { state: ES });
  expect(await page.evaluate(() => { const P = window.KWIZILLO_M1.premium; return [P.can('talen', 'conv:intro'), P.can('talen', 'conv:food'), P.can('talen', 'speak:basics'), P.can('talen', 'speak:sentences'), P.can('talen', 'dieren'), P.can('talen', 'kleuren')] })).toEqual([true, false, true, false, true, false]);
  await boot(page, { state: ES, premium: true });
  expect(await page.evaluate(() => { const P = window.KWIZILLO_M1.premium; return [P.can('talen', 'conv:food'), P.can('talen', 'speak:sentences')] })).toEqual([true, true]);
});

test('Spreken: say it, then hear the guide and yourself one after the other; the child decides "sounds the same"; the take lives in memory only', async ({ page }) => {
  await page.addInitScript(MIC, 'loud');
  const posts = [];
  page.on('request', r => { if (r.method() !== 'GET' && !/\/api\/tts$/.test(r.url())) posts.push(r.url()) });
  await boot(page, { state: SAVED({ learnLang: 'es', talenMicOk: true }) });
  await page.evaluate(() => {
    // count what is played back: the child's own take goes through a fresh AudioBufferSourceNode
    window.__takes = 0; const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.numberOfChannels === 1 && this.buffer.duration > .3) window.__takes++; return st.apply(this, a) };
    return window.KWIZILLO_M1.startTalenSpeak('basics');
  });
  await page.locator('#speakMic').click();
  await expect(page.locator('#speakStatus')).toContainText('Ik luister…');
  await page.waitForTimeout(900);
  await page.locator('#speakMic').click();                                            // a second tap: done talking
  await expect(page.locator('.speak-compare')).toBeVisible();
  await expect(page.locator('#speakStatus')).toContainText('Klonk het hetzelfde?', { timeout: 10000 });
  expect(await page.evaluate(() => window.__takes)).toBeGreaterThan(0);              // the child's own voice was played back
  await expect(page.locator('#speakStatus')).not.toContainText(/goed gezegd|%/i);      // no judgement by the app
  expect(await page.evaluate(() => window.KWIZILLO_M1.progress().talen.speaking?.es?.practised || 0)).toBe(0);   // not before the child says so
  await page.locator('#speakSame').click();
  await expect(page.locator('#speakStatus')).toContainText('Goed geoefend!');
  expect(await page.evaluate(() => window.KWIZILLO_M1.progress().talen.speaking.es.practised)).toBe(1);
  expect(await page.evaluate(() => window.KWIZILLO_M1.speechPractice.hasTake())).toBe(false);   // dropped at once
  expect(await page.evaluate(() => window.__gum.streams.every(s => s.getTracks().every(t => t.readyState === 'ended')))).toBe(true);
  const stored = await page.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k)).join(''));
  expect(stored).not.toMatch(/blob:|data:audio|base64/);
  expect(posts).toEqual([]);
  // "Nog een keer": the take is gone, the guide speaks again, record anew
  await page.locator('#speakNext').click();
  await page.locator('#speakMic').click(); await page.waitForTimeout(900); await page.locator('#speakMic').click();
  await expect(page.locator('.speak-compare')).toBeVisible();
  await page.locator('#speakRedo').click();
  await expect(page.locator('.speak-compare')).toBeHidden();
  expect(await page.evaluate(() => window.KWIZILLO_M1.speechPractice.hasTake())).toBe(false);
});

