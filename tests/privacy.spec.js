// The privacy promises of a Kids Category app, checked at the network boundary
// rather than in prose: App Review 1.3 and 5.1.4 forbid sending personal or
// device information to a third party, and Google Play's Families policy and the
// amended COPPA Rule say the same. These tests fail the moment the app talks to
// anyone but its own server, or puts something the child typed in a request.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

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
  await page.route(TTS, r => { try { spoken.push(ttsPayload(r.request()).text || '') } catch {} r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }); });
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 3e10).toISOString(), store: 'dev' }));
  }, SAVED);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
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

// The parent portal: the privacy screen is the notice itself (Apple's Kids
// Category and the amended COPPA Rule want what is kept, for how long, and how
// to erase it in the app, not only on a website), and erasing really erases.
test('the parent portal shows what is stored and erases it behind the gate', async ({ page }) => {
  await page.route('**/*.mp4', r => r.abort());
  await page.route(TTS, r => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }));
  // Seeded once, by hand: an init script would put the keys back on the reload
  // that follows erasing, and then the test could never see them gone.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', store: 'dev' }));
    localStorage.setItem('kwizillo-test-unlock', '1');
  }, { ...SAVED, answered: 12, correct: 9 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 10000 });
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  await page.locator('#privacyOpen').click();

  const screen = page.locator('.privacy-screen');
  await expect(screen).toBeVisible();
  await expect(screen.locator('.privacy-block')).toHaveCount(4);                  // on this device, what leaves, never done, how long
  await expect(screen).toContainText(CHILD);                                      // the parent sees the name that is stored
  await expect(screen).toContainText('12');                                       // and the real counts
  await expect(screen).toContainText('ElevenLabs');                               // the only third party is named
  await expect(screen).toContainText(/geen advertenties|Geen advertenties/i);

  await page.locator('#eraseOpen').click();                                        // a child cannot tap through this
  await expect(page.locator('.gate-form')).toBeVisible();
  const [a, b] = (await page.locator('.simple-modal-card p').first().innerText()).match(/\d+/g).map(Number);
  await page.locator('#gateInput').fill(String(a * b + 1));
  await page.locator('.gate-form .simple-ok').click();
  await expect(page.locator('.gate-error')).toBeVisible();
  await page.locator('#gateInput').fill(String(a * b));
  await page.locator('.gate-form .simple-ok').click();
  await expect(page.locator('.simple-modal-card.danger')).toBeVisible();
  await page.locator('.simple-modal-card.danger .confirm').click();

  // The reload lands on the very first run again: no name, no progress, no
  // remembered Premium, and nothing of the child left in storage.
  await expect(page.locator('.motion, .onboarding')).toBeVisible({ timeout: 15000 });
  const left = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[k] = localStorage.getItem(k); }
    return out;
  });
  expect(Object.keys(left).filter(k => k !== 'kwizillo-state')).toEqual([]);       // entitlement cache, test unlock and the fresh-start choice are gone
  expect(left['kwizillo-state'] || '').not.toContain(CHILD);                       // and the fresh state carries no name
  expect(left['kwizillo-state'] || '').not.toContain(FRIEND);
  expect(left['kwizillo-state'] || '').not.toContain('"answered":12');
});
