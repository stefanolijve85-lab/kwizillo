// Weetjes: a "did you know" screen off Home, one world-art card at a time read
// by the chosen guide, a discovered counter, world chips, and a bonus fact on
// every quiz result that opens the same fact in full.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Luna',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED(), spoken) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => { spoken?.push(ttsPayload(route.request())); route.fulfill({ status: 500, body: '{}' }); });
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' }));  if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}

test('Home opens the Weetjes screen: one fact at a time, read by the chosen guide, counted as discovered', async ({ page }) => {
  const spoken = [];
  await boot(page, SAVED(), spoken);
  await page.locator('#homeFacts').click();
  const screen = page.locator('.facts-screen');
  await expect(screen).toBeVisible();
  await expect(screen.locator('h1')).toHaveText('Weetjes');
  await expect(screen.locator('#factsSub')).toHaveText('1 van 96 ontdekt');
  const card = screen.locator('.fact-card');
  await expect(card).toBeVisible();
  await expect(card.locator('.fact-new')).toHaveText('Nieuw!');
  const first = await card.getAttribute('data-fact');
  const text = await card.locator('.fact-text').textContent();
  // The guide reads the fact in her own voice, never the child's name.
  await expect.poll(() => spoken.some(r => r.text === `Wist je dat… ${text}` && r.voice === 'Luna')).toBe(true);   // the kicker once, on opening
  expect(spoken.map(r => JSON.stringify(r)).join('')).not.toContain('Mike');
  // Next fact: another one, counter up, both remembered.
  await screen.locator('#factNext').click();
  await expect(screen.locator('#factsSub')).toHaveText('2 van 96 ontdekt');
  const second = await screen.locator('.fact-card').getAttribute('data-fact');
  expect(second).not.toBe(first);
  const secondText = await screen.locator('.fact-text').textContent();
  await expect.poll(() => spoken.some(r => r.text === secondText)).toBe(true);   // the next fact is read without the kicker
  const seen = await page.evaluate(() => Object.keys(window.KWIZILLO_M1.progress().factsSeen));
  expect(seen.sort()).toEqual([first, second].sort());
  // Every chip is in view without sideways scrolling.
  const chips = await screen.locator('.fact-chip').all();
  expect(chips.length).toBe(7);
  const vw = page.viewportSize().width;
  for (const c of chips) { const b = await c.boundingBox(); expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.width).toBeLessThanOrEqual(vw); }
  expect(await screen.locator('.fact-chips').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  // A world chip narrows the set to that world's facts.
  await screen.locator('[data-fworld="dieren"]').click();
  await expect(page.locator('.facts-screen [data-fworld="dieren"]')).toHaveClass(/active/);
  await expect(page.locator('.facts-screen #factsSub')).toHaveText(/van 16 ontdekt/);
  await expect(page.locator('.facts-screen .fact-card')).toHaveClass(/fact-dieren/);
  await expect(page.locator('.facts-screen .fact-world')).toContainText('Dierenwereld');
  // Back to Home and the progress survives a reload.
  await page.locator('.facts-screen .panel-back').click();
  await expect(page.locator('.home')).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click(); await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => Object.keys(window.KWIZILLO_M1.progress().factsSeen).length)).toBe(3);
});

test('the next facts are chosen ahead and their lines warmed, so a fact talks the moment it shows', async ({ page }) => {
  const spoken = [];
  await boot(page, SAVED(), spoken);
  const window_facts = await page.evaluate(() => window.KWIZILLO_M1.facts('all').map(f => f.t));
  // Home already warmed the first two facts of the set…
  const isFact = r => window_facts.includes(r.text.replace(/^Wist je dat… /, ''));
  await expect.poll(() => spoken.filter(isFact).length).toBeGreaterThanOrEqual(2);
  const warmed = spoken.filter(isFact).map(r => r.text.replace(/^Wist je dat… /, ''));
  await page.locator('#homeFacts').click();
  const first = await page.locator('.facts-screen .fact-text').textContent();
  expect(warmed).toContain(first);   // …and the one shown is one of them: no new round trip
  // Tapping next shows the other warmed one, and two more are queued behind it.
  await page.locator('#factNext').click();
  const second = await page.locator('.facts-screen .fact-text').textContent();
  expect(warmed).toContain(second);
  await expect.poll(() => spoken.filter(isFact).length).toBeGreaterThanOrEqual(4);
});

test('every fact of a world is served before any repeats, then they come round again', async ({ page }) => {
  await boot(page);
  const ids = await page.evaluate(() => {
    const K = window.KWIZILLO_M1, out = [];
    for (let i = 0; i < 16; i++) { const f = K.pickFact('ruimte', out[out.length - 1]); K.markFactSeen(f); out.push(f.id); }
    const again = K.pickFact('ruimte', out[15]);
    return { out, again: again.id, count: K.factsSeenCount('ruimte'), total: K.facts('ruimte').length };
  });
  expect(new Set(ids.out).size).toBe(16);
  expect(ids.count).toBe(16); expect(ids.total).toBe(16);
  expect(ids.out).toContain(ids.again);
  expect(ids.again).not.toBe(ids.out[15]);
});

test('the quiz result carries a bonus fact of that world, read by the guide; tapping it opens the same fact in full', async ({ page }) => {
  const spoken = [];
  await boot(page, SAVED(), spoken);
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.startQuiz('dieren', null); K.quiz.score = 9; K.quiz.xp = 90; K.showResult(); });
  const bonus = page.locator('#resultFact');
  await expect(bonus).toBeVisible();
  await expect(bonus.locator('small')).toHaveText('Wist je dat…');
  const id = await bonus.getAttribute('data-fact');
  expect(id).toMatch(/^dieren-\d+$/);
  const text = await bonus.locator('b').textContent();
  await expect.poll(() => spoken.some(r => r.voice === 'Luna' && r.text === `Wist je dat… ${text}`), { timeout: 5000 }).toBe(true);
  await bonus.click();
  await expect(page.locator('.facts-screen')).toBeVisible();
  await expect(page.locator('.facts-screen .fact-card')).toHaveAttribute('data-fact', id);
  await expect(page.locator('.facts-screen .fact-text')).toHaveText(text);
  await expect(page.locator('.facts-screen [data-fworld="dieren"]')).toHaveClass(/active/);
});

test('the bank is the same size in every language and switching language keeps discovered ids', async ({ page }) => {
  await boot(page, SAVED({ progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], factsSeen: { 'ruimte-0': true, 'aarde-3': true } } }));
  const r = await page.evaluate(() => {
    const K = window.KWIZILLO_M1, out = {};
    for (const lang of ['nl', 'en', 'pt']) { K.setLanguage(lang); out[lang] = { total: K.facts('all').length, seen: K.factsSeenCount('all'), first: K.facts('ruimte')[0].t }; }
    return out;
  });
  expect(r.nl.total).toBe(96); expect(r.en.total).toBe(96); expect(r.pt.total).toBe(96);
  expect(r.nl.seen).toBe(2); expect(r.en.seen).toBe(2); expect(r.pt.seen).toBe(2);
  expect(r.en.first).toMatch(/Sun/); expect(r.pt.first).toMatch(/Sol/);
});
