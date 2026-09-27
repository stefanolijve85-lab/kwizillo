// Points, coins and the shop, driven through the screens a child uses.
// scores.test.js checks the rules themselves; this checks that the game really
// books them: a question pays once at full value and afterwards as practice,
// the runner cannot pay forever, and coins buy something that stays bought.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = {
  schemaVersion: 3, language: 'nl', name: 'Wolkje', onboardingComplete: true, tourDone: true,
  voice: 'Stil', group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

async function boot(page, state = {}) {
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, r => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }));
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
  }, { ...SAVED, ...state });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
}

// Opens the first topic of Space and answers its first question correctly.
async function answerFirstCorrectly(page) {
  await page.evaluate(() => window.KWIZILLO_M1.enterWorld('ruimte'));
  await page.locator('[data-topic]').first().click();
  await expect(page.locator('.quiz-v2')).toBeVisible({ timeout: 8000 });
  const shown = await page.evaluate(() => {
    const q = window.KWIZILLO_M1.quiz, cur = q.questions[q.index];
    return { id: cur.id, worth: Number(cur.xp || 10), index: [...document.querySelectorAll('.answer')].findIndex(b => decodeURIComponent(b.dataset.a) === cur.answer) };
  });
  await page.locator('.answer').nth(shown.index).click();
  await expect(page.locator('.feedback-reward')).toBeVisible({ timeout: 5000 });
  return { ...shown, badge: (await page.locator('.feedback-reward').innerText()).trim(), award: await page.evaluate(() => window.KWIZILLO_M1.quiz.lastAward) };
}

test('a question pays its points once, and practice points after that', async ({ page }) => {
  await boot(page);
  const first = await answerFirstCorrectly(page);
  expect(first.award.points).toBe(first.worth);            // full value the first time
  expect(first.award.repeat).toBe(false);
  expect(first.badge).toContain(`+${first.worth}`);
  expect(first.badge).toContain('punten');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.xp)).toBe(first.worth);
  // Questions pay points, never coins: coins are what the games are for.
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.coins)).toBe(0);

  // The same question again — the next quiz is a fresh batch, so this is the
  // path a child takes by replaying a topic once its batches have come round.
  const again = await page.evaluate(id => {
    const K = window.KWIZILLO_M1;
    return K.recordAnswerProgress(K.questions.find(q => q.id === id), true);
  }, first.id);
  expect(again.repeat).toBe(true);
  expect(again.points).toBeLessThan(first.worth);
  expect(again.points).toBeGreaterThan(0);                 // practice still pays
});

test('the day has a ceiling for points and for coins', async ({ page }) => {
  await boot(page);
  const rules = await page.evaluate(() => window.KWIZILLO_M1.scoreRules);

  // One point short of the ceiling: the next answer gets that one point only.
  const left = await page.evaluate(cap => {
    const K = window.KWIZILLO_M1;
    K.awardPoints(cap - 1);
    return K.awardPoints(50);
  }, rules.dayPoints);
  expect(left).toMatchObject({ granted: 1, capped: true });
  expect(await page.evaluate(() => window.KWIZILLO_M1.awardPoints(10))).toMatchObject({ granted: 0, capped: true });

  // A quiz answer still counts as answered, it just no longer pays.
  const capped = await answerFirstCorrectly(page);
  expect(capped.award.points).toBe(0);
  expect(capped.badge).toContain('dagmaximum');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.answered)).toBe(1);

  // Coins: one runner run is capped, and the day is capped over all runs.
  const runs = await page.evaluate(() => {
    const K = window.KWIZILLO_M1, out = [];
    for (let i = 0; i < 4; i++) out.push(K.jungleReward({ game: 'jungle-runner', completed: true, runId: `run-${i}`, coins: 999 }));
    out.push(K.jungleReward({ game: 'jungle-runner', completed: true, runId: 'run-0', coins: 999 }));   // a replayed callback
    return { out, coins: K.state.coins };
  });
  expect(runs.out[0].coins).toBe(rules.runCoins);
  expect(runs.coins).toBe(rules.dayCoins);
  expect(runs.out[4]).toMatchObject({ coins: 0, duplicate: true });
});

test('coins buy a golden card and a buddy, and what is bought stays bought', async ({ page }) => {
  await boot(page, { coins: 200 });
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('shop'));
  await expect(page.locator('.shop-wallet b')).toHaveText('200');

  // Too few coins: the shop says how many are missing instead of failing.
  await page.locator('[data-buy^="mascot:"]').last().click();
  await expect(page.locator('.simple-modal')).toContainText('coins nodig');
  await page.locator('.simple-modal .simple-ok').click();
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.coins)).toBe(200);

  // Enough coins: the card is paid for, owned, and shows up in the collection.
  await page.locator('[data-buy="gold:ruimte"]').click();
  await expect(page.locator('.simple-modal')).toContainText('150 coins');
  await page.locator('.simple-modal .buy').click();
  await expect(page.locator('[data-buy="gold:ruimte"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.coins)).toBe(50);
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.shop.owned)).toEqual(['gold:ruimte']);
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('cards'));
  await expect(page.locator('.kcard.gold')).toHaveCount(1);

  // A bought buddy is unlocked without a single correct answer.
  await page.evaluate(() => { window.KWIZILLO_M1.state.coins = 999; window.KWIZILLO_M1.save(); window.KWIZILLO_M1.showCollection('shop') });
  const buddy = page.locator('[data-buy^="mascot:"]').first();
  const id = await buddy.getAttribute('data-buy');
  await buddy.click();
  await page.locator('.simple-modal .buy').click();
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('mascots'));
  await expect(page.locator(`[data-mascot="${id.split(':')[1]}"]`)).not.toHaveAttribute('disabled', '');

  // And it is in the saved state, not only on screen, so it survives a restart.
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kwizillo-state')).shop.owned)).toContain(id);
});

test('the record book keeps the best exercise, day, week, month and year', async ({ page }) => {
  await boot(page);
  const book = await page.evaluate(() => {
    const K = window.KWIZILLO_M1;
    K.startScoreRun(); K.awardPoints(120);          // one exercise
    K.startScoreRun(); K.awardPoints(40);           // a weaker one
    return K.scoreSummary();
  });
  expect(book.run.points).toBe(40);
  expect(book.run.best).toBe(120);
  for (const row of book.rows) expect(row.points).toBe(160);
  expect(book.allTime).toBe(160);

  await page.evaluate(() => window.KWIZILLO_M1.showStats());
  const board = page.locator('.record-board');
  await expect(board).toBeVisible();
  await expect(board.locator('article')).toHaveCount(6);      // exercise, day, week, month, year, all time
  await expect(board.locator('.all-time b')).toHaveText('160');
  await expect(page.locator('.stats-screen')).toContainText('van 1500 punten vandaag');
});
