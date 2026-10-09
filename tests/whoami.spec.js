// "Wat ben ik?": clues one at a time, four picture tiles, 100/75/50 points by
// how many clues were needed, a miss still teaches, rewards at the end.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' })); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
const answer = page => page.evaluate(() => { const g = window.KWIZILLO_M1.whoami; return g.rounds[g.index].q.answer; });

test('five rounds of clues and pictures; earlier guesses earn more; a wrong pick shows the answer and explanation; the result rewards XP and coins', async ({ page }) => {
  await boot(page);
  await page.locator('#homeWhoAmI').click();
  // The game asks which world first; these tests play them all mixed.
  await page.locator('.game-picker [data-pick="mix"]').click();
  await expect(page.locator('.whoami')).toBeVisible();
  await expect(page.locator('.whoami-tile')).toHaveCount(4);
  await expect(page.locator('#whoClues p')).toHaveCount(2);           // one clue + "Wat ben ik?"
  await expect(page.locator('#whoPoints')).toHaveText('Nu 100 punten');
  // The answer word never appears in a clue, and the tiles are four different things.
  const a1 = await answer(page);
  const clueText = await page.locator('#whoClues').innerText();
  expect(clueText.toLowerCase()).not.toContain(a1.replace(/^(de|het|een)\s+/i, '').toLowerCase());
  const labels = await page.locator('.whoami-tile b').allInnerTexts();
  expect(new Set(labels).size).toBe(4);
  // Round 1: guess right after the first clue → 100.
  await page.locator(`.whoami-tile[aria-label="${a1}"]`).click();
  await expect(page.locator('.whoami-verdict h2')).toContainText('+100');
  await page.locator('#whoNext').click();
  // Round 2: ask for a second clue, then guess right → 75.
  await page.locator('#whoMore').click();
  await expect(page.locator('#whoPoints')).toHaveText('Nu 75 punten');
  await expect(page.locator('#whoClues p')).toHaveCount(3);
  const a2 = await answer(page);
  await page.locator(`.whoami-tile[aria-label="${a2}"]`).click();
  await expect(page.locator('.whoami-verdict h2')).toContainText('+75');
  await page.locator('#whoNext').click();
  // Round 3: a wrong pick — the right tile lights up, the card names the answer and explains.
  const a3 = await answer(page);
  const wrong = page.locator('.whoami-tile').filter({ hasNot: page.locator(`[aria-label="${a3}"]`) }).first();
  const wrongLabel = (await page.locator('.whoami-tile b').allInnerTexts()).find(l => l !== a3);
  await page.locator(`.whoami-tile[aria-label="${wrongLabel}"]`).click();
  await expect(page.locator('.whoami-verdict h2')).toContainText(`Bijna! Het was ${a3}.`);
  await expect(page.locator(`.whoami-tile[aria-label="${a3}"]`)).toHaveClass(/correct/);
  await expect(page.locator('.whoami-verdict p')).not.toBeEmpty();
  await page.locator('#whoNext').click();
  for (let i = 0; i < 2; i++) { const a = await answer(page); await page.locator(`.whoami-tile[aria-label="${a}"]`).click(); await page.locator('#whoNext').click(); }
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-v2 h1')).toHaveText('4 van 5 geraden!');
  await expect(page.locator('.result-rule')).toContainText('375 van 500 punten');
  const s = await page.evaluate(() => ({ xp: window.KWIZILLO_M1.state.xp, coins: window.KWIZILLO_M1.state.coins, best: window.KWIZILLO_M1.progress().games.whoami.best }));
  expect(s.xp).toBeGreaterThan(0); expect(s.coins).toBeGreaterThan(0); expect(s.best).toBe(375);
});

test('the clue, the question and the four tile names are read out (tiles light up in turn), and every line of the game is requested up front', async ({ page }) => {
  const spoken = [];
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => { try { spoken.push(ttsPayload(route.request()).text || ''); } catch {} route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }); });
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' })); localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, SAVED({ voice: 'Milo' }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await page.locator('#homeWhoAmI').click();
  // The game asks which world first; these tests play them all mixed.
  await page.locator('.game-picker [data-pick="mix"]').click();
  await expect(page.locator('.whoami')).toBeVisible();
  const g = await page.evaluate(() => { const g = window.KWIZILLO_M1.whoami; return { clue: g.rounds[0].clues[0], tiles: g.rounds[0].options.map(o => o.answer), lastClue: g.rounds[4].clues[0] }; });
  await expect.poll(() => spoken.includes(g.clue)).toBe(true);
  // asked playfully: the audio tag is acted out by the voice, not read
  await expect.poll(() => spoken.includes('[playful] Wat ben ik?')).toBe(true);
  for (const name of g.tiles) await expect.poll(() => spoken.includes(name + '.')).toBe(true);
  // Round 5's clue is on its way ahead of time; the warm queue runs two at a
  // time, so on a loaded machine it needs longer than the default six seconds.
  await expect.poll(() => spoken.includes(g.lastClue), { timeout: 30000 }).toBe(true);
});

test('every world has enough material in every language', async ({ page }) => {
  await boot(page);
  const counts = await page.evaluate(() => {
    const K = window.KWIZILLO_M1; const out = {};
    for (const lang of ['nl', 'en', 'pt']) { K.setLanguage(lang); K.useBank(); for (const w of ['ruimte', 'dieren', 'aarde', 'geschiedenis', 'wetenschap', 'mysterie']) { K.startWhoAmI(w); out[`${lang}:${w}`] = K.whoami.rounds.length; } }
    return out;
  });
  for (const [k, n] of Object.entries(counts)) expect(n, k).toBe(5);
});

test('Wat ben ik? plays in every world, Sport too', async ({ page }) => {
  await boot(page);
  for (const w of ['sport', 'kunst']) {
    await page.evaluate(() => window.KWIZILLO_M1.showGamePicker('whoami'));
    await page.locator(`.game-picker [data-pick="${w}"]`).click();
    await expect(page.locator('.whoami')).toBeVisible();
    await expect(page.locator('.whoami-tile')).toHaveCount(4);
  }
});

test('a right guess opens with one of thirty praise lines before "Dit is …", and the next round does not repeat it', async ({ page }) => {
  await boot(page);
  await page.locator('#homeWhoAmI').click();
  await page.locator('.game-picker [data-pick="mix"]').click();
  await expect(page.locator('.whoami')).toBeVisible();
  const said = [];
  await page.exposeFunction('__said', s => said.push(s));
  await page.evaluate(() => { const K = window.KWIZILLO_M1, real = K.speakSequence; K.speakSequence = (segs, o) => { window.__said(segs.map(s => s.text)); return real(segs, o); }; });
  const praise = await page.evaluate(() => Array.from({ length: window.KWIZILLO_M1.core.FEEDBACK_VARIANTS.good }, (_, i) => window.KWIZILLO_M1.t(`feedback.speech.good.${i + 1}`)));
  expect(praise).toHaveLength(30);
  expect(praise).toContain('Lekker bezig!');
  const picks = await page.evaluate(() => window.KWIZILLO_M1.whoami.rounds.map(r => r.praise));
  for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
  await page.locator(`.whoami-tile[aria-label="${await answer(page)}"]`).click();
  await expect.poll(() => said.find(s => s[1] === 'Dit is')).toBeTruthy();
  const line = said.find(s => s[1] === 'Dit is');
  expect(praise).toContain(line[0]);
  expect(line[0]).toBe(picks[0]);
});
