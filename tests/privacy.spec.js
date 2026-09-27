// The privacy promises of a Kids Category app, checked at the network boundary
// rather than in prose: App Review 1.3 and 5.1.4 forbid sending personal or
// device information to a third party, and Google Play's Families policy and the
// amended COPPA Rule say the same. These tests fail the moment the app talks to
// anyone but its own server, or puts something the child typed in a request.
const { test, expect } = require('@playwright/test');

const CHILD = 'Wolkje', FRIEND = 'Sterretje';
const SAVED = {
  schemaVersion: 2, language: 'nl', name: CHILD, memoPlayer2: FRIEND, onboardingComplete: true, tourDone: true,
  voice: 'Milo', group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }
};

test('a whole session talks to nobody but its own server, and never sends a name', async ({ page, baseURL }) => {
  const seen = [], spoken = [], violations = [];
  page.on('request', r => seen.push({ url: r.url(), body: r.postData() || '' }));
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/api/tts', r => { try { spoken.push(JSON.parse(r.request().postData() || '{}').text || '') } catch {} r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }); });
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 3e10).toISOString(), store: 'dev' }));
  }, SAVED);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click();
  await page.locator('.motion').click().catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 10000 });          // the greeting shows the name
  await expect(page.locator('.home')).toContainText(CHILD);

  await page.locator('[data-world="ruimte"]').first().click();                   // a quiz: question and answers are read aloud
  await page.locator('[data-topic]').first().click();
  await expect(page.locator('.quiz-v2')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(1200);
  await page.locator('.answer').first().click();
  await page.waitForTimeout(1200);

  await page.evaluate(() => window.KWIZILLO_M1.showFacts?.() ?? window.KWIZILLO_M1.showHome());
  await page.waitForTimeout(600);
  await page.evaluate(() => window.KWIZILLO_M1.showParent());                    // the parent zone
  await page.waitForTimeout(400);

  expect(spoken.length, 'the guide really spoke').toBeGreaterThan(2);
  const origin = new URL(baseURL).origin;
  const strangers = seen.filter(r => !r.url.startsWith(origin) && !r.url.startsWith('data:') && !r.url.startsWith('blob:'));
  expect(strangers.map(r => r.url)).toEqual([]);                                 // nothing leaves for a third party
  const leaks = seen.filter(r => new RegExp(`${CHILD}|${FRIEND}`).test(r.url + r.body));
  expect(leaks.map(r => r.url)).toEqual([]);                                     // and no request carries either name
  expect(spoken.filter(t => new RegExp(`${CHILD}|${FRIEND}`).test(t))).toEqual([]);
  expect(violations).toEqual([]);                                                // the content policy is not in the way
  expect(await page.evaluate(() => document.cookie)).toBe('');                   // no cookies at all
});

test('the page may only load and talk to itself', async ({ page }) => {
  await page.route('**/*.mp4', r => r.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const csp = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || '');
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");     // no inline script, so no snippet can be pasted in
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain("frame-src 'none'");
  // and no script, style, image or font in the page comes from somewhere else
  const remote = await page.evaluate(() => [...document.querySelectorAll('script[src],link[href],img[src]')]
    .map(e => e.src || e.href).filter(u => !u.startsWith(location.origin)));
  expect(remote).toEqual([]);
});
