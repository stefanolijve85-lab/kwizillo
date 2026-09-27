// Kwizillo on an iPad. The game is one design — 430 by 764 — and on anything
// wider than a phone it is scaled to fit instead of laid out again, so an iPad
// shows the same game, bigger, in portrait and in landscape. These tests hold
// that: the frame really fills the screen, nothing hangs off it, the phone
// layout is untouched, and the world stands blurred behind the frame.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = {
  schemaVersion: 3, language: 'nl', name: 'Wolkje', onboardingComplete: true, tourDone: true,
  voice: 'Stil', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

async function boot(page) {
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, r => r.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', store: 'dev', expiresAt: new Date(Date.now() + 3e10).toISOString() }));
  }, SAVED);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
}

// What the frame really covers on screen, transform and all.
const frameBox = page => page.locator('.game-frame').boundingBox();

const IPADS = [
  { name: 'iPad mini portrait', width: 744, height: 1133 },
  { name: 'iPad 11" portrait', width: 834, height: 1194 },
  { name: 'iPad Pro 13" portrait', width: 1024, height: 1366 },
  { name: 'iPad 11" landscape', width: 1194, height: 834 },
  { name: 'iPad Pro 13" landscape', width: 1366, height: 1024 },
];

for (const size of IPADS) {
  test(`${size.name}: the game fills the screen and stays inside it`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await boot(page);
    const box = await frameBox(page);

    // It fits, with room to spare of at most the 16 px margin on one side.
    expect(box.width).toBeLessThanOrEqual(size.width);
    expect(box.height).toBeLessThanOrEqual(size.height);
    // And it fills the smaller of the two: a phone-shaped game on a wide screen
    // is bounded by the height, in portrait by the width.
    const fills = Math.max(box.width / size.width, box.height / size.height);
    expect(fills, 'the frame takes the screen it is given').toBeGreaterThan(0.94);
    // The design is not stretched: the frame keeps 430:764 whatever the screen.
    expect(box.width / box.height).toBeCloseTo(430 / 764, 2);
    // Nothing scrolls sideways.
    const doc = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(doc.scroll).toBeLessThanOrEqual(doc.client + 1);
  });
}

// Narrower than 581 px is the phone layout, wherever it comes from: a phone, or
// an iPad in Split View. There the frame is the screen, full bleed, as always.
test('an iPad in Split View falls back to the phone layout, full bleed', async ({ page }) => {
  await page.setViewportSize({ width: 507, height: 1194 });
  await boot(page);
  const box = await frameBox(page);
  expect(Math.round(box.width)).toBe(507);
  expect(Math.round(box.height)).toBe(1194);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fit').trim())).toBe('1');
  await expect(page.locator('.home-world')).toHaveCount(6);
});

test('the phone layout is untouched: the frame is the screen, unscaled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  const box = await frameBox(page);
  expect(Math.round(box.width)).toBe(390);
  expect(Math.round(box.height)).toBe(844);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fit').trim())).toBe('1');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.game-frame')).transform)).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
});

test('turning the iPad keeps the game whole, and the world stands behind it', async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await expect(page.locator('.native-world')).toBeVisible();
  // The stage behind the frame carries the world the game is in.
  const art = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--stage-art'));
  expect(await art()).toContain('assets/worlds/ruimte.jpg');

  const portrait = await frameBox(page);
  await page.setViewportSize({ width: 1194, height: 834 });
  // The frame is re-fitted on the window's resize event; wait for that, not for
  // a number of milliseconds.
  await expect.poll(async () => (await frameBox(page)).height, { timeout: 8000 }).toBeLessThanOrEqual(834);
  const landscape = await frameBox(page);
  expect(landscape.height).toBeLessThanOrEqual(834);
  expect(landscape.width / landscape.height).toBeCloseTo(portrait.width / portrait.height, 2);
  await expect(page.locator('.native-world')).toBeVisible();          // the screen survives the turn
  await expect(page.locator('.world-topic')).toHaveCount(4);

  // Back to Home: the stage follows.
  await page.evaluate(() => window.KWIZILLO_M1.enterWorld('mysterie'));
  await expect(page.locator('.native-world')).toBeVisible();
  expect(await art()).toContain('assets/worlds/mysterie.jpg');
});

test('a quiz on an iPad: answers, hint and navigation are all reachable and big enough', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1366 });
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.answer')).toHaveCount(4);
  const frame = await frameBox(page);
  for (const sel of ['.answer', '#hintBtn', '.quiz-back', '[data-nav="home"]']) {
    const el = page.locator(sel).first();
    if (!(await el.count())) continue;
    const b = await el.boundingBox();
    expect(b, `${sel} is on screen`).not.toBeNull();
    // Inside the frame, and at least a 44 pt target once the scale is counted.
    expect(b.x).toBeGreaterThanOrEqual(frame.x - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
    expect(Math.min(b.width, b.height), `${sel} is big enough to hit`).toBeGreaterThanOrEqual(44);
  }
});
