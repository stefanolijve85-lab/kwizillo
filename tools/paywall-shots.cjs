#!/usr/bin/env node
// The review screenshot App Store Connect wants on each subscription: the
// paywall as the reviewer sees it, for a free player, in iPhone 6.9" size.
//
//   node server.js                     (or npm start, in another terminal)
//   node tools/paywall-shots.cjs       → store/screenshots/subscription/<lang>.png
//
// Prices come from the development simulator in premium.js; they are the same
// tiers as the products in App Store Connect.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const { STATE } = require('./site-shots.cjs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'store', 'screenshots', 'subscription');
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const LANGS = ['nl', 'en', 'pt'];

(async () => {
  const browser = await chromium.launch();
  fs.mkdirSync(OUT, { recursive: true });
  for (const lang of LANGS) {
    const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*.mp4', r => r.abort());
    await page.route('**/api/tts**', r => r.fulfill({ status: 503, body: '{}' }));
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(s => {
      localStorage.setItem('kwizillo-fresh-start', '0');
      localStorage.setItem('kwizillo-state', JSON.stringify(s));
      localStorage.removeItem('kwizillo-entitlement');
    }, { ...STATE, language: lang });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
      await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
      await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
      await page.waitForTimeout(700);
    }
    await page.waitForSelector('.home');
    await page.evaluate(() => window.KWIZILLO_M1.showPremium({ from: 'parent' }));
    await page.waitForSelector('#premiumPlans .premium-loading', { state: 'detached', timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every(i => i.complete), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const file = path.join(OUT, `${lang}.png`);
    await page.screenshot({ path: file, type: 'png' });
    console.log(`${path.relative(ROOT, file)}  1320x2868`);
    if (errors.length) console.error(`JavaScript errors (${lang}):\n  ${errors.join('\n  ')}`);
    await page.close();
  }
  await browser.close();
})();
