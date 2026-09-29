#!/usr/bin/env node
// The App Store screenshots, taken from the real app in the same state as the
// website shots (tools/site-shots.cjs): a child who has played for a while.
//
//   node server.js                     (or npm start, in another terminal)
//   node tools/store-shots.cjs         → store/screenshots/<device>/<lang>/NN-name.png
//   node tools/store-shots.cjs --lang nl --device iphone
//
// Sizes are the ones App Store Connect asks for: 6.9" iPhone 1320 x 2868 and
// 13" iPad 2064 x 2752, both portrait. Smaller devices are scaled down from
// these by Apple. PNG without alpha, as Connect wants.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const { STATE, SHOTS } = require('./site-shots.cjs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'store', 'screenshots');
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const DEVICES = { iphone: { width: 440, height: 956, scale: 3 }, ipad: { width: 1032, height: 1376, scale: 2 } };
const PICK = ['home', 'world', 'quiz', 'feedback', 'cards', 'memo', 'math', 'achievements'];
const arg = k => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1].split(',') : null };
const langs = arg('lang') || ['nl', 'en'];
const devices = arg('device') || Object.keys(DEVICES);

async function shoot(browser, device, lang) {
  const d = DEVICES[device];
  const page = await browser.newPage({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.scale, hasTouch: true, isMobile: device === 'iphone' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*.mp4', r => r.abort());
  await page.route('**/api/tts**', r => r.fulfill({ status: 503, body: '{}' }));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
    localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 3e10).toISOString(), store: 'dev' }));
  }, { ...STATE, language: lang });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "welkom terug"
    await page.waitForTimeout(700);
  }
  await page.waitForSelector('.home');
  await page.evaluate(() => {
    const K = window.KWIZILLO_M1;
    K.progress().correctQuestionIds = K.questions.filter(q => q.world === 'dieren' || q.world === 'ruimte').slice(0, 26).map(q => q.id);
    K.own('gold:dieren');
    K.save();
  });
  const dir = path.join(OUT, device, lang);
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const name of PICK) {
    const go = SHOTS.find(s => s[0] === name)?.[1];
    if (!go) continue;
    try { await go(page) } catch (e) { console.error(`${device}/${lang}/${name}: ${e.message}`); continue }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].filter(i => i.getBoundingClientRect().height > 40).every(i => i.complete), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
    const file = path.join(dir, `${String(++n).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: file, type: 'png', omitBackground: false });
    console.log(`${path.relative(ROOT, file)}  ${d.width * d.scale}x${d.height * d.scale}`);
  }
  if (errors.length) console.error(`JavaScript errors (${device}/${lang}):\n  ${errors.join('\n  ')}`);
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const device of devices) for (const lang of langs) await shoot(browser, device, lang);
  await browser.close();
})();
