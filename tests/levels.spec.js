// Every world climbs on its own. A new player starts at level 1 everywhere;
// passing all four topic quizzes of a world — its forty questions — takes that
// world, and only that world, one level up. The tile says where each one stands.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');
const { atLevel, TOPIC_KEYS } = require('./levels.js');

// A buddy earned mid-quiz introduces itself between the explanation and the
// next question. Tap it away and carry on.
async function feedbackNext(page) {
  await page.locator('#feedbackNext').click();
  const hello = page.locator('.mascot-unlock-ok');
  if (await hello.count()) await hello.click();
}

const SAVED = {
  schemaVersion: 3, language: 'nl', name: 'Wolkje', onboardingComplete: true, tourDone: true,
  voice: 'Stil', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

async function boot(page, state = {}) {
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, r => r.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', store: 'dev', expiresAt: new Date(Date.now() + 3e10).toISOString() }));
  }, { ...SAVED, ...state });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
    await page.waitForTimeout(700);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
}

const levels = page => page.evaluate(() => Object.fromEntries(window.KWIZILLO_M1.WORLDS.map(w => [w, window.KWIZILLO_M1.worldLevel(w)])));

// Answers a whole ten-question quiz correctly.
async function playPerfectQuiz(page) {
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.answer').first()).toBeEnabled({ timeout: 8000 });
    const idx = await page.evaluate(() => {
      const q = window.KWIZILLO_M1.quiz, cur = q.questions[q.index];
      return [...document.querySelectorAll('.answer')].findIndex(b => decodeURIComponent(b.dataset.a) === cur.answer);
    });
    await page.locator('.answer').nth(idx).click();
    await expect(page.locator('.feedback-float')).toBeVisible({ timeout: 8000 });
    await feedbackNext(page);
  }
  await expect(page.locator('.result-v2')).toBeVisible({ timeout: 8000 });
}

test('a new player starts at level 1 in every world, and the tile says so', async ({ page }) => {
  await boot(page);
  expect(await levels(page)).toEqual({ ruimte: 1, dieren: 1, aarde: 1, geschiedenis: 1, wetenschap: 1, mysterie: 1, kunst: 1, sport: 1 });
  await expect(page.locator('.home-world[data-world] .home-world-level')).toHaveCount(8);   // the Mega Quiz tile carries one too
  await expect(page.locator('[data-world="ruimte"] .home-world-level')).toHaveText('Niveau 1');
  // The quiz really runs at level 1: thirty seconds and every hint free.
  await page.locator('[data-world="ruimte"]').click();
  await expect(page.locator('.world-kicker')).toContainText('Niveau 1');
});

test('passing the fourth topic takes that world — and only that world — up a level', async ({ page }) => {
  // Three of Space's four topics are already passed at level 1.
  const passed = { 1: {} };
  for (const key of TOPIC_KEYS.ruimte.slice(0, 3)) passed[1][`ruimte:${key}`] = true;
  await boot(page, { progress: { ...SAVED.progress, passed } });
  expect((await levels(page)).ruimte).toBe(1);

  await page.locator('[data-world="ruimte"]').click();
  await page.locator('.world-topic').nth(3).click();          // the fourth topic
  await playPerfectQuiz(page);

  await expect(page.locator('.result-unlock')).toHaveText('🎉 Ruimtewereld gaat naar niveau 2!');
  const after = await levels(page);
  expect(after.ruimte).toBe(2);
  expect(after.dieren).toBe(1);                                // the other worlds stay put
  await page.evaluate(() => window.KWIZILLO_M1.showHome());
  await expect(page.locator('[data-world="ruimte"] .home-world-level')).toHaveText('Niveau 2');
  await expect(page.locator('[data-world="dieren"] .home-world-level')).toHaveText('Niveau 1');
});

test('a world at level 6 plays by level 6 rules while its neighbour still plays level 1', async ({ page }) => {
  await boot(page, { progress: { ...SAVED.progress, passed: atLevel('dieren', 6) } });
  expect((await levels(page))).toMatchObject({ dieren: 6, ruimte: 1 });

  await page.locator('[data-world="dieren"]').click();
  await expect(page.locator('.world-kicker')).toContainText('Niveau 6');
  await page.locator('.world-topic').first().click();
  await expect(page.locator('#hintBtn')).toHaveClass(/spent/);     // level 6: no hints
  await page.evaluate(() => window.KWIZILLO_M1.showHome());

  await page.locator('[data-world="ruimte"]').click();
  await expect(page.locator('.world-kicker')).toContainText('Niveau 1');
  await page.locator('.world-topic').first().click();
  await expect(page.locator('#hintBtn .hint-count')).toHaveCount(0);  // level 1: hints are free
});

test('the parent zone shows where every world stands', async ({ page }) => {
  await boot(page, { progress: { ...SAVED.progress, passed: atLevel('aarde', 3) } });
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  const row = page.locator('.world-levels .world-level-row span');
  await expect(row).toHaveCount(8);
  expect(await row.allInnerTexts()).toEqual(['1', '1', '3', '1', '1', '1', '1', '1']);
});

test('finishing a world at all six levels earns its golden card, with a celebration', async ({ page }) => {
  // Space is through levels 1-5 and needs one last topic at level 6.
  const passed = atLevel('ruimte', 6);
  for (const key of TOPIC_KEYS.ruimte.slice(0, 3)) (passed[6] ||= {})[`ruimte:${key}`] = true;
  await boot(page, { progress: { ...SAVED.progress, passed } });
  expect(await page.evaluate(() => [window.KWIZILLO_M1.worldLevel('ruimte'), window.KWIZILLO_M1.worldMastered('ruimte'), window.KWIZILLO_M1.owned('gold:ruimte')])).toEqual([6, false, false]);

  await page.locator('[data-world="ruimte"]').click();
  await page.locator('.world-topic').nth(3).click();
  await playPerfectQuiz(page);

  await expect(page.locator('.result-unlock.is-gold')).toHaveText('🏆 Ruimtewereld helemaal voltooid!');
  await expect(page.locator('.gold-unlock')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('.gold-unlock-sub')).toHaveText('Je hebt de gouden kaart van Ruimtewereld verdiend!');
  expect(await page.evaluate(() => [window.KWIZILLO_M1.worldMastered('ruimte'), window.KWIZILLO_M1.owned('gold:ruimte')])).toEqual([true, true]);

  // It is put away with one tap, and the card is in the collection.
  await page.locator('.gold-unlock-ok').click();
  await expect(page.locator('.gold-unlock')).toHaveCount(0);
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('cards'));
  await expect(page.locator('.kcard.gold')).toHaveCount(1);
  await expect(page.locator('.kcard.gold .kcard-own')).toHaveText('Verdiend');
  // Another quiz in that world does not hand out a second one.
  const before = await page.evaluate(() => window.KWIZILLO_M1.cardCount());
  await page.evaluate(() => window.KWIZILLO_M1.own('gold:ruimte'));
  expect(await page.evaluate(() => window.KWIZILLO_M1.cardCount())).toBe(before);
});

test('the world menu says what has been played there, and a golden card carries the name in the language being read', async ({ page }) => {
  const passed = { 1: { 'dieren:snelle_dieren': true, 'dieren:baby_dieren': true } };
  await boot(page, { progress: { ...SAVED.progress, passed,
    topics: { snelle_dieren: { answered: 20, correct: 18 }, waterdieren: { answered: 10, correct: 5 } },
    runs: { 'dieren:snelle_dieren': { quizNumber: 2, usedIds: [] }, 'dieren:waterdieren': { quizNumber: 1, usedIds: [] }, dieren: { quizNumber: 3, usedIds: [] } } } });
  await page.locator('[data-world="dieren"]').click();
  await expect(page.locator('.native-world')).toBeVisible();

  // Two of the four topics are done, one was played but not passed, one untouched.
  await expect(page.locator('.world-topic-done')).toHaveCount(2);
  await expect(page.locator('.world-topic-done').first()).toHaveText('Gehaald');
  await expect(page.locator('.world-topic-played')).toHaveCount(1);
  await expect(page.locator('.world-topic-played')).toHaveText('Quiz 1 gespeeld · 5/10 goed');
  await expect(page.locator('.world-progress-line')).toHaveText('2 van de 4 onderwerpen gehaald');
  await expect(page.locator('#worldMix small')).toContainText('3 gespeeld');

  // The painted banner on the card is Dutch, so Dutch shows no band over it…
  await page.evaluate(() => { window.KWIZILLO_M1.own('gold:dieren'); window.KWIZILLO_M1.showCollection('cards') });
  await expect(page.locator('.kcard.gold')).toHaveCount(1);
  await expect(page.locator('.gold-band')).toHaveCount(0);

  // …and every other language does, with the name it reads elsewhere.
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.setLanguage('en'); K.useBank(); K.showCollection('cards') });
  await expect(page.locator('.gold-band')).toHaveText('Animal World');
  const band = await page.locator('.gold-band').boundingBox();
  const card = await page.locator('.kcard.gold').boundingBox();
  // It sits over the painted banner, two thirds down the card, and spans it.
  expect((band.y - card.y) / card.height).toBeGreaterThan(0.6);
  expect((band.y - card.y) / card.height).toBeLessThan(0.75);
  expect(band.width / card.width).toBeGreaterThan(0.8);
});

test('the bar under a world tile is that whole world: four quizzes at each of six levels', async ({ page }) => {
  // Space is at level 4 with two of its four topics done there: three whole
  // levels plus two, so fourteen of twenty-four.
  const passed = atLevel('ruimte', 4);
  passed[4] = { ...(passed[4] || {}), 'ruimte:zonnestelsel': true, 'ruimte:sterren_planeten': true };
  await boot(page, { progress: { ...SAVED.progress, passed } });

  expect(await page.evaluate(() => window.KWIZILLO_M1.worldProgress('ruimte'))).toEqual({ done: 14, total: 24, pct: 58 });
  const width = w => page.locator(`[data-world="${w}"] .home-world-bar i`).evaluate(el => el.style.width);
  expect(await width('ruimte')).toBe('58%');
  // A world nobody has played shows an empty bar, not a full one: it used to be
  // the share of answers that were right, so two right answers filled it.
  expect(await width('mysterie')).toBe('0%');
  expect(await page.evaluate(() => window.KWIZILLO_M1.worldProgress('mysterie').done)).toBe(0);

  // A world finished at all six levels is full, which is when its card is earned.
  await page.evaluate(() => {
    const K = window.KWIZILLO_M1, P = K.progress().passed;
    for (let n = 1; n <= 6; n++) for (const k of K.TOPIC_KEYS.dieren) (P[n] ||= {})[`dieren:${k}`] = true;
    K.save(); K.showHome();
  });
  expect(await page.evaluate(() => window.KWIZILLO_M1.worldProgress('dieren'))).toEqual({ done: 24, total: 24, pct: 100 });
  expect(await width('dieren')).toBe('100%');
  expect(await page.evaluate(() => window.KWIZILLO_M1.worldMastered('dieren'))).toBe(true);
});
