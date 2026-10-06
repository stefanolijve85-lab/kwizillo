// Kwizillo Premium: what Free can play, what is locked, the child → parent →
// paywall → purchase → back-to-content flow, and that no route or saved state
// gets past the gate. The store is the development simulator (this is a plain
// http page on localhost), which is exactly what a phone on the LAN sees too.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED(), { entitlement } = {}) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/*.webm', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(({ s, e }) => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s));
    if (e) localStorage.setItem('kwizillo-entitlement', JSON.stringify(e)); else localStorage.removeItem('kwizillo-entitlement');
  }, { s: state, e: entitlement });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
// The parental gate asks for a × b; read the numbers from the modal and answer.
async function passGate(page) {
  const body = await page.locator('.simple-modal p').first().innerText();
  const [a, b] = body.match(/\d+/g).map(Number);
  await page.locator('#gateInput').fill(String(a * b));
  await page.locator('.gate-form .simple-ok').click();
}
const DEV_YEARLY = () => ({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' });

test('Free: the starter world is fully open, another world shows locks on its topics but its first mixed quiz plays', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(false);
  await page.locator('[data-world="ruimte"]').click();
  await expect(page.locator('.native-world')).toBeVisible();
  await expect(page.locator('.world-topic.locked')).toHaveCount(0);
  await expect(page.locator('.premium-badge')).toHaveCount(0);
  await page.locator('#worldBack').click();
  await page.locator('[data-world="dieren"]').click();
  await expect(page.locator('.world-topic.locked')).toHaveCount(4);
  await expect(page.locator('#worldMix')).not.toHaveClass(/locked/);
  await page.locator('#worldMix').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  // Every free thing still works with no store at all: nothing here needed one.
});

test('a locked topic opens the teaser, the parental gate and the paywall; a simulated purchase unlocks and reopens that very quiz', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('.world-topic.locked').first().click();
  // The child sees a friendly explanation, not a price.
  await expect(page.locator('.premium-teaser')).toBeVisible();
  await expect(page.locator('.premium-teaser')).not.toContainText('€');
  await page.locator('#teaserParent').click();
  // Parental gate: a wrong answer stays put, the right one goes on.
  await expect(page.locator('#gateInput')).toBeVisible();
  await page.locator('#gateInput').fill('1'); await page.locator('.gate-form .simple-ok').click();
  await expect(page.locator('.gate-error')).toBeVisible();
  await passGate(page);
  // Paywall: both plans with store prices, yearly recommended with its trial.
  await expect(page.locator('.premium-screen')).toBeVisible();
  await expect(page.locator('.premium-plan')).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator('.premium-plan.yearly')).toHaveClass(/recommended/);
  await expect(page.locator('.premium-plan.yearly')).toContainText('€ 49,99');
  await expect(page.locator('.premium-plan.yearly .premium-permonth')).toContainText('per maand');
  await expect(page.locator('.premium-plan.yearly .premium-cta')).toHaveText('Start 7 dagen gratis');
  await expect(page.locator('.premium-plan.monthly')).toContainText('€ 6,99');
  await expect(page.locator('#premiumLegal')).toContainText('verlengt automatisch');
  await page.locator('.premium-plan.yearly').click();
  await expect(page.locator('.premium-welcome')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.premium-welcome h1')).toHaveText('Welkom bij Kwizillo Premium!');
  await page.locator('#premiumGo').click();
  // The pending destination: the locked topic quiz the child chose.
  await expect(page.locator('.quiz-v2')).toBeVisible({ timeout: 5000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.status())).toMatchObject({ isPremium: true, subscriptionType: 'year', store: 'dev', trial: true });
});

test('cancel, pending and error from the store are handled calmly; the UI is never the only lock', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.KWIZILLO_M1.premiumDev.set({ outcome: 'cancel', delay: 10 }));
  await page.evaluate(() => window.KWIZILLO_M1.showPremium({ from: 'parent' }));
  await page.locator('.premium-plan.monthly').click();
  await expect(page.locator('.toast')).toHaveText('Aankoop geannuleerd.');
  await expect(page.locator('.premium-plan')).toHaveCount(2);           // back on the plans, no "failed"
  await page.evaluate(() => window.KWIZILLO_M1.premiumDev.set({ outcome: 'pending' }));
  await page.locator('.premium-plan.monthly').click();
  await expect(page.locator('.premium-status')).toContainText('wacht nog op goedkeuring');
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(false);   // nothing granted before verification
  await page.evaluate(() => window.KWIZILLO_M1.showPremium({ from: 'parent' }));
  await page.evaluate(() => window.KWIZILLO_M1.premiumDev.set({ outcome: 'error' }));
  await page.locator('.premium-plan.monthly').click();
  await expect(page.locator('.premium-status')).toContainText('Dat lukte niet');
  await expect(page.locator('.premium-status')).not.toContainText(/SKError|simulated|Error/);
  // Bypass attempts: calling the start functions directly stays locked.
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.showHome(); K.startQuiz('dieren', 0); });
  await expect(page.locator('.quiz-v2')).toHaveCount(0);
  await expect(page.locator('.premium-teaser')).toBeVisible();
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.startMemo('dieren'); });
  await expect(page.locator('.memo-board')).toHaveCount(0);
  // A forged entitlement in storage is worthless without a store behind it.
  await page.evaluate(() => { localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'x', type: 'year', store: 'ios' })); });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(false);
});

test('restore: none found, then found; the store being unavailable never breaks the app', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.KWIZILLO_M1.premiumDev.set({ delay: 10, restoreHas: false }));
  await page.evaluate(() => window.KWIZILLO_M1.showPremium({ from: 'parent' }));
  await page.locator('#premiumRestore').click();
  await expect(page.locator('.toast').last()).toHaveText('Geen eerdere aankoop gevonden.');
  await page.evaluate(() => window.KWIZILLO_M1.premiumDev.set({ restoreHas: true }));
  await page.locator('#premiumRestore').click();
  await expect(page.locator('.premium-welcome')).toBeVisible({ timeout: 5000 });
  // No store at all: a clear message, the free game untouched.
  await page.evaluate(() => { window.KWIZILLO_M1.premiumDev.revoke(); window.KWIZILLO_M1.premiumDev.set({ storeAvailable: false }); });
  await page.evaluate(() => window.KWIZILLO_M1.showPremium({ from: 'parent' }));
  await expect(page.locator('.premium-status')).toContainText('Premium is momenteel niet beschikbaar');
  await page.evaluate(() => window.KWIZILLO_M1.showHome());
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('[data-topic="0"]').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
});

test('Premium keeps progress, an expired subscription only locks content again, and the parent zone shows the status', async ({ page }) => {
  await boot(page, SAVED({ xp: 340, coins: 55, progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: ['ruimte-1', 'ruimte-2'] } }), { entitlement: DEV_YEARLY() });
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(true);
  await page.locator('[data-world="dieren"]').click();
  await expect(page.locator('.world-topic.locked')).toHaveCount(0);
  await page.locator('.native-bottom-nav button[data-nav="parent"]').click();   // the gear top right is gone; "Meer" below opens the parent zone
  await expect(page.locator('#premiumOpen')).toContainText('Actief · Jaarlijks');
  // Expire it: content locks, everything the child earned stays.
  await page.evaluate(() => window.KWIZILLO_M1.premiumDev.expire());
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  await expect(page.locator('#premiumOpen')).toContainText('Verlopen');
  const s = await page.evaluate(() => ({ xp: window.KWIZILLO_M1.state.xp, coins: window.KWIZILLO_M1.state.coins, cards: window.KWIZILLO_M1.progress().correctQuestionIds.length }));
  expect(s).toEqual({ xp: 340, coins: 55, cards: 2 });
  await page.evaluate(() => window.KWIZILLO_M1.enterWorld('dieren'));
  await expect(page.locator('.world-topic.locked')).toHaveCount(4);
});

test('Free math plays at level 3 at most while the parent setting is kept; memo and facts follow the free rules', async ({ page }) => {
  await boot(page, SAVED({ niveau: 6 }));
  await page.locator('#homeMath').click();
  await expect(page.locator('.math')).toBeVisible();
  expect(await page.evaluate(() => [window.KWIZILLO_M1.math.niveau, window.KWIZILLO_M1.state.niveau])).toEqual([3, 6]);
  await page.evaluate(() => window.KWIZILLO_M1.showMemoPicker());
  await expect(page.locator('.memo-pick.locked')).toHaveCount(7);   // all eight worlds but the starter; "all worlds" stays free
  await expect(page.locator('.memo-pick.mix')).not.toHaveClass(/locked/);
  await page.evaluate(() => window.KWIZILLO_M1.showFacts('dieren'));
  await expect(page.locator('#factPremium')).toContainText('Nog 12 weetjes met Premium');
  await page.evaluate(() => window.KWIZILLO_M1.showFacts('ruimte'));
  await expect(page.locator('#factPremium')).toHaveCount(0);
});

for (const [lang, expected] of [['en', 'Unlock the whole world of Kwizillo'], ['pt', 'Desbloqueie todo o mundo de Kwizillo']]) {
  test(`the paywall speaks ${lang} (prices in the store's currency, no Dutch left over)`, async ({ page }) => {
    await boot(page, SAVED({ language: lang }));
    await page.evaluate(() => window.KWIZILLO_M1.premiumDev.set({ delay: 10 }));
    await page.evaluate(() => window.KWIZILLO_M1.showPremium({ from: 'parent' }));
    await expect(page.locator('.premium-screen h1')).toHaveText(expected);
    await expect(page.locator('.premium-plan')).toHaveCount(2, { timeout: 5000 });
    const text = await page.locator('.premium-screen').innerText();
    expect(text).not.toMatch(/Jaarlijks|Maandelijks|Beste keuze|Herstel aankopen/);
    expect(text).toContain(lang === 'en' ? '$49.99' : 'R$ 249,90');
  });
}

test('no test switch in the parent zone; a development address can still open everything for one device', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  // The switch that opened everything is gone, and so is the bypass behind it.
  await expect(page.locator('#testUnlockToggle')).toHaveCount(0);
  await expect(page.locator('.test-card')).toHaveCount(0);
  expect(await page.evaluate(() => typeof window.KWIZILLO_M1.premium.testUnlock)).toBe('undefined');
  await page.evaluate(() => window.KWIZILLO_M1.enterWorld('dieren'));
  await expect(page.locator('.world-topic.locked')).toHaveCount(4);

  // ?premium=1 on a development host stamps this device and cleans the address.
  await page.goto('/?premium=1', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(true);
  await page.evaluate(() => window.KWIZILLO_M1.enterWorld('dieren'));
  await expect(page.locator('.world-topic.locked')).toHaveCount(0);
  await page.locator('[data-topic="2"]').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();

  // It is written where every entitlement lives, so it survives a restart
  // (this suite's own boot script wipes that key on every navigation, which is
  // why the reload is not done here), and ?premium=0 hands it back.
  const stamped = await page.evaluate(() => JSON.parse(localStorage.getItem('kwizillo-entitlement') || 'null'));
  expect(stamped).toMatchObject({ status: 'active', store: 'dev', type: 'year' });
  await page.goto('/?premium=0', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(false);
  await page.evaluate(() => window.KWIZILLO_M1.enterWorld('dieren'));
  await expect(page.locator('.world-topic.locked')).toHaveCount(4);
});
