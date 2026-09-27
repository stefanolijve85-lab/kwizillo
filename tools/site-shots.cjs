#!/usr/bin/env node
// The screenshots on kwizillo.nl, taken from the real app.
//
// The site shows the game in a phone mock-up, so the shots are 554x1200 — the
// width the phone frames on the site are drawn at. They are taken at twice that
// and drawn down again, which is what keeps the type crisp, and written as JPEG
// next to the ones they replace:
//
//   node server.js                    (or npm start, in another terminal)
//   node tools/site-shots.cjs         → site/assets/shots/*.jpg
//   node tools/site-shots.cjs --only home,quiz
//
// The profile below is a child who has played for a while: a name, a level, some
// coins and a streak, worlds in progress, cards collected. Nothing is faked in
// the pictures — the app is really in that state.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'site', 'assets', 'shots');
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const W = 554, H = 1200, SCALE = 2, QUALITY = 0.86;
const only = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1].split(',') : null })();

const STATE = {
  schemaVersion: 3, language: 'nl', name: 'Noor', onboardingComplete: true, tourDone: true,
  voice: 'Milo', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: true,
  xp: 460, coins: 136, streak: 5, answered: 214, correct: 181, quizzesPlayed: 12,
  bestScores: { ruimte: 9, dieren: 10, aarde: 7, geschiedenis: 8 },
  selectedMascot: 'milo',
  progress: {
    worlds: { ruimte: { answered: 80, correct: 68, quizzes: 5 }, dieren: { answered: 70, correct: 63, quizzes: 4 }, aarde: { answered: 40, correct: 31, quizzes: 2 }, geschiedenis: { answered: 24, correct: 19, quizzes: 1 } },
    topics: {}, runs: {}, correctQuestionIds: [], passed: {}, factsSeen: {},
    games: { memo: { played: 6, won: 5, best: { dieren: 14 } }, math: { played: 5, won: 4, best: { 1: 10, 2: 9 } }, jungle: { played: 3, best: 120, coins: 240, runs: ['a', 'b', 'c'], cards: ['jungle-leaf'] } }
  }
};

// Every shot: what it is called, and how to get the app there.
const SHOTS = [
  ['home', async p => { await p.evaluate(() => window.KWIZILLO_M1.showHome()); await p.waitForSelector('.home-world'); }],
  ['world', async p => { await p.evaluate(() => window.KWIZILLO_M1.enterWorld('dieren')); await p.waitForSelector('.world-topic'); }],
  ['quiz', async p => {
    await p.evaluate(() => { const K = window.KWIZILLO_M1; K.enterWorld('dieren'); K.startQuiz('dieren', 3) });
    await p.waitForSelector('.answer');
    await p.waitForFunction(() => [...document.querySelectorAll('.quiz-art img, .quiz-v2 img')].some(i => i.complete && i.naturalWidth > 2));
  }],
  ['feedback', async p => {
    // A correct answer, so the card shows the explanation rather than a miss.
    await p.evaluate(() => { const K = window.KWIZILLO_M1; K.enterWorld('dieren'); K.startQuiz('dieren', 3) });
    await p.waitForSelector('.answer');
    const idx = await p.evaluate(() => {
      const q = window.KWIZILLO_M1.quiz, cur = q.questions[q.index];
      return [...document.querySelectorAll('.answer')].findIndex(b => decodeURIComponent(b.dataset.a) === cur.answer);
    });
    await p.locator('.answer').nth(idx).click();
    await p.waitForSelector('.feedback-float');
    await p.waitForTimeout(420);                       // the confetti is still in the air
  }],
  ['cards', async p => { await p.evaluate(() => window.KWIZILLO_M1.showCollection('cards')); await p.waitForSelector('.kcard'); await p.waitForTimeout(500) }],
  ['mascots', async p => { await p.evaluate(() => window.KWIZILLO_M1.showCollection('mascots')); await p.waitForSelector('.mascot-card'); await p.waitForTimeout(400) }],
  ['achievements', async p => { await p.evaluate(() => window.KWIZILLO_M1.showAchievements()); await p.waitForSelector('.achievement-card') }],
  ['parent', async p => { await p.evaluate(() => window.KWIZILLO_M1.showParent()); await p.waitForSelector('.setting-card') }],
  ['math', async p => { await p.evaluate(() => window.KWIZILLO_M1.startMath('mix')); await p.waitForSelector('.math-screen, .quiz-v2'); await p.waitForTimeout(700) }],
  ['memo', async p => {
    await p.evaluate(() => window.KWIZILLO_M1.startMemo('dieren'));
    await p.waitForSelector('.memo-card');
    // Two pairs found and one card turned: the board shows what it is made of
    // instead of sixteen backs.
    const pairs = await p.evaluate(() => {
      const seen = {}, out = [];
      for (const c of window.KWIZILLO_M1.memo.cards) { (seen[c.pair] ||= []).push(c.id) }
      for (const ids of Object.values(seen)) if (ids.length === 2) out.push(ids);
      return out.slice(0, 3);
    });
    for (const [a, b] of pairs.slice(0, 2)) {
      await p.locator(`[data-card="${a}"]`).click(); await p.waitForTimeout(260);
      await p.locator(`[data-card="${b}"]`).click(); await p.waitForTimeout(700);
    }
    if (pairs[2]) { await p.locator(`[data-card="${pairs[2][0]}"]`).click(); await p.waitForTimeout(500) }
  }],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  await page.route('**/*.mp4', r => r.abort());          // no intro film in a still
  await page.route('**/api/tts**', r => r.fulfill({ status: 503, body: '{}' }));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 3e10).toISOString(), store: 'dev' }));
  }, STATE);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
  await page.waitForSelector('.home');

  // The cards in the collection are real: the questions this child answered.
  await page.evaluate(() => {
    const K = window.KWIZILLO_M1;
    const ids = K.questions.filter(q => q.world === 'dieren' || q.world === 'ruimte').slice(0, 26).map(q => q.id);
    K.progress().correctQuestionIds = ids;
    K.own('gold:dieren');
    K.save();
  });

  // The shot is taken at twice the size and drawn down again: sharper type and
  // artwork than a JPEG straight out of the browser at 554 px.
  const shrinker = await browser.newPage();
  await shrinker.goto('about:blank');
  const shrink = async buf => shrinker.evaluate(async ({ data, W, H, QUALITY }) => {
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = data });
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, W, H);
    return c.toDataURL('image/jpeg', QUALITY);
  }, { data: 'data:image/png;base64,' + buf.toString('base64'), W, H, QUALITY });

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const [name, go] of SHOTS) {
    if (only && !only.includes(name)) continue;
    try { await go(page) } catch (e) { console.error(`${name}: ${e.message}`); continue }
    await page.waitForTimeout(250);
    const url = await shrink(await page.screenshot({ type: 'png' }));
    const file = path.join(OUT, `${name}.jpg`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${name}.jpg  ${W}x${H}  ${(fs.statSync(file).size / 1024).toFixed(0)} kB`);
  }
  if (errors.length) console.error(`\nJavaScript errors while shooting:\n  ${errors.join('\n  ')}`);
  await browser.close();
})();
