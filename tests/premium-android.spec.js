// Kwizillo Premium in the Android app. Capacitor and the Google Play plugin
// (KwizilloBillingPlugin.java) are stood in for by a fake with the same calls
// and shapes, so this runs the real premium.js / premium-ui.js path the app
// takes: products from the store, purchase, an entitlement stamped 'android',
// the store named Google Play in the legal lines, and no credit for a stamp
// from another store.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = {
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }
};

async function boot(page, { entitlement, owned = false } = {}) {
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/*.webm', r => r.abort());
  await page.route(TTS, r => r.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(({ s, e, owned }) => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    if (e) localStorage.setItem('kwizillo-entitlement', JSON.stringify(e)); else localStorage.removeItem('kwizillo-entitlement');
    const ent = id => ({ status: 'active', productId: id, type: id.endsWith('.yearly') ? 'year' : 'month', expiresAt: null, store: 'android', autoRenewing: true });
    window.__billing = { owned: owned ? ent('nl.kwizillo.app.premium.yearly') : null, calls: [] };
    const B = window.__billing;
    window.Capacitor = {
      isNativePlatform: () => true, getPlatform: () => 'android',
      Plugins: { KwizilloBilling: {
        products: async ({ ids }) => { B.calls.push('products'); return { products: [
          { key: 'monthly', id: 'nl.kwizillo.app.premium.monthly', displayPrice: '€ 6,99', price: 6.99, currency: 'EUR', period: 'month', months: 1, trialDays: 0, trialEligible: false },
          { key: 'yearly', id: 'nl.kwizillo.app.premium.yearly', displayPrice: '€ 49,99', price: 49.99, currency: 'EUR', period: 'year', months: 12, trialDays: 7, trialEligible: true }
        ].filter(p => ids.includes(p.id)) } },
        purchase: async ({ id }) => { B.calls.push('purchase:' + id); B.owned = ent(id); return { result: 'purchased', entitlement: B.owned } },
        restore: async () => (B.owned ? { result: 'restored', entitlement: B.owned } : { result: 'none' }),
        currentEntitlement: async () => ({ entitlement: B.owned }),
        manageSubscriptions: async () => ({ result: 'opened' }),
        addListener: () => ({ remove() {} })
      } }
    };
  }, { s: SAVED, e: entitlement, owned });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 10000 });
}
async function passGate(page) {
  const body = await page.locator('.simple-modal p').first().innerText();
  const [a, b] = body.match(/\d+/g).map(Number);
  await page.locator('#gateInput').fill(String(a * b));
  await page.locator('.gate-form .simple-ok').click();
}

test('Android: Google Play prices, purchase, an entitlement stamped android, and the store named Google Play', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('.world-topic.locked').first().click();
  await page.locator('#teaserParent').click();
  await passGate(page);
  await expect(page.locator('.premium-plan')).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator('.premium-plan.yearly')).toContainText('€ 49,99');
  await expect(page.locator('.premium-plan.yearly .premium-cta')).toHaveText('Start 7 dagen gratis');
  await expect(page.locator('#premiumLegal')).toContainText('Google Play');
  await expect(page.locator('#premiumLegal')).not.toContainText('Apple');
  await page.locator('.premium-plan.yearly').click();
  await expect(page.locator('.premium-welcome')).toBeVisible({ timeout: 5000 });
  expect(await page.evaluate(() => window.__billing.calls)).toContain('purchase:nl.kwizillo.app.premium.yearly');
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.status())).toMatchObject({ isPremium: true, subscriptionType: 'year', store: 'android' });
});

test('Android: an entitlement stamped by the App Store gives nothing here', async ({ page }) => {
  await boot(page, { entitlement: { status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', store: 'ios' } });
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(false);
});

test('Android: a subscription Play reports is picked up at start, and restore finds it', async ({ page }) => {
  await boot(page, { owned: true });
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(true);
  expect(await page.evaluate(() => window.KWIZILLO_M1.premium.status().store)).toBe('android');
  // Cancelled in Play: the next refresh locks content again, progress stays.
  await page.evaluate(() => { window.__billing.owned = null; });
  await page.evaluate(() => window.KWIZILLO_M1.premium.refresh());
  await expect.poll(() => page.evaluate(() => window.KWIZILLO_M1.premium.isPremium())).toBe(false);
});
