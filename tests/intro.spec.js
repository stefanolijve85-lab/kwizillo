const { test, expect } = require('@playwright/test');

// Regression cover for the Phase 2.2 intro consolidation.
//
// Before the fix:
//   - m1-ui.js and boot-intro.js both called showHome(true), so the cinematic was
//     built twice. innerHTML replacement hid this in the DOM, so the bug is only
//     observable by counting how often a .motion node is inserted.
//   - intro-v2.js monkeypatched window.setTimeout to turn the 4700ms fallback into
//     90000ms, and restored it in a 0ms macrotask — so the patch is invisible by the
//     time a test can evaluate. It has to be caught at scheduling time.
//   - The orphaned first cinematic kept that 90s timer alive; when it fired it
//     replaced whatever screen the player was on with Home.
//   - intro-enhance.js removed the skip button and no tap handler existed.

async function boot(page){
  await page.addInitScript(() => {
    const probe = window.__introProbe = { motionsInserted: 0, delays: [], setTimeoutReassigned: false };

    // Record every delay that actually reaches the platform timer, including delays
    // rewritten by a monkeypatch layered on top of us.
    const nativeSetTimeout = window.setTimeout;
    let current = function(fn, delay, ...rest){
      probe.delays.push(Number(delay) || 0);
      return nativeSetTimeout.call(window, fn, delay, ...rest);
    };
    Object.defineProperty(window, 'setTimeout', {
      configurable: true,
      get(){ return current; },
      set(v){ probe.setTimeoutReassigned = true; current = v; }
    });

    const count = node => {
      if (node.nodeType !== 1) return;
      if (node.classList && node.classList.contains('motion')) probe.motionsInserted++;
      else if (node.querySelector && node.querySelector('.motion')) probe.motionsInserted++;
    };
    new MutationObserver(records => {
      for (const r of records) for (const n of r.addedNodes) count(n);
    }).observe(document, { childList: true, subtree: true });

    localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' })); 
    localStorage.setItem('kwizillo-state', JSON.stringify({
      schemaVersion:2, language:'nl', name:'Mike', onboardingComplete:true, voice:'Stil',
      group:5, xp:0, coins:0, streak:0, answered:0, correct:0, quizzesPlayed:0,
      lastWorld:'ruimte', selectedMascot:'milo', soundOn:false, musicOn:false,
      sfxVolume:.7, musicVolume:.2, musicTrack:'magical', timeLimitOn:true, timeLimit:45,
      progress:{worlds:{},topics:{},runs:{},correctQuestionIds:[]}
    }));
  });
  // Never settle the video request: no `ended`, no `error`. The only way out is the user.
  await page.route('**/*.mp4', () => {});
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.motion')).toBeVisible({ timeout: 7000 });
}

test('the cinematic is built exactly once per launch', async ({ page }) => {
  await boot(page);
  const inserted = await page.evaluate(() => window.__introProbe.motionsInserted);
  expect(inserted).toBe(1);
  // One film; the second <video> is its blurred copy behind it (intro.js, intro-bg).
  await expect(page.locator('video.intro-main')).toHaveCount(1);
});

test('window.setTimeout is never reassigned', async ({ page }) => {
  await boot(page);
  const reassigned = await page.evaluate(() => window.__introProbe.setTimeoutReassigned);
  expect(reassigned).toBe(false);
});

test('the intro schedules no long-lived orphan timer', async ({ page }) => {
  await boot(page);
  const delays = await page.evaluate(() => window.__introProbe.delays);
  const longest = Math.max(0, ...delays);
  // The old build scheduled 90000ms. The safety net is 30000ms and is the only
  // timer allowed to outlive the cinematic.
  expect(longest).toBeLessThanOrEqual(30000);
});

test('the cinematic runs at once; the first tap turns sound on, the second continues', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.motion-skip')).toHaveCount(0);
  await expect(page.locator('#introStart')).toHaveCount(0);
  await expect(page.locator('.motion')).toHaveClass(/cinematic-playing/);
  await expect(page.locator('.intro-brand')).toBeVisible();
  await expect(page.locator('#introSound')).toBeVisible();
  await page.locator('.motion').click();
  await expect(page.locator('#introSound')).toHaveCount(0);
  await expect(page.locator('.motion')).toBeVisible();
  await page.locator('.motion').click();
  // Na de intro komt eerst het terugkeerscherm ("Hoi Mike, verder spelen?").
  await expect(page.locator('.welcome-back')).toBeVisible({ timeout: 5000 });
  await page.locator('#wbGo').click();
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('.motion')).toHaveCount(0);
});

test('tapping anywhere on the running cinematic continues to Home immediately', async ({ page }) => {
  await boot(page);
  await page.locator('.motion').click({ position: { x: 40, y: 300 } });
  await page.locator('.motion').click({ position: { x: 40, y: 300 } });
  // Must be a direct response to the tap, not the video eventually giving up.
  // Na de intro komt eerst het terugkeerscherm ("Hoi Mike, verder spelen?").
  await expect(page.locator('.welcome-back')).toBeVisible({ timeout: 2000 });
  await page.locator('#wbGo').click();
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('.motion')).toHaveCount(0);
});

test('skipping the cinematic clears its pending sound-design timers', async ({ page }) => {
  await boot(page);
  await page.locator('.motion').click({ position: { x: 40, y: 300 } });
  await page.locator('.motion').click({ position: { x: 40, y: 300 } });
  // Na de intro komt eerst het terugkeerscherm ("Hoi Mike, verder spelen?").
  await expect(page.locator('.welcome-back')).toBeVisible();
  await page.locator('#wbGo').click();
  await expect(page.locator('.home')).toBeVisible();

  await page.locator('[data-world="wetenschap"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.quiz-v2')).toBeVisible();

  // Longer than the last scheduled intro cue (10850ms) would have needed.
  await page.waitForTimeout(11500);
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await expect(page.locator('.motion')).toHaveCount(0);
});

test('a refused autoplay never asks for a tap: first frame with the logo, then the game by itself', async ({ page }) => {
  // What an iPhone in Low Power Mode does: every play() without a gesture is refused.
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function(){ return Promise.reject(new DOMException('refused', 'NotAllowedError')); };
  });
  await boot(page);
  await expect(page.locator('.motion.poster-only.cinematic-playing')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('.intro-brand-logo')).toBeVisible();
  await expect(page.getByText('Tik om te starten')).toHaveCount(0);
  await expect(page.locator('#introSound')).toHaveCount(0);
  await expect(page.locator('.motion')).toHaveCount(0, { timeout: 6000 });
});

test('a play() that was only interrupted is tried again, so the film still starts', async ({ page }) => {
  await page.addInitScript(() => {
    const real = HTMLMediaElement.prototype.play;
    window.__plays = 0;
    HTMLMediaElement.prototype.play = function(){
      window.__plays++;
      if (this.classList.contains('intro-main') && !window.__aborted) { window.__aborted = true; return Promise.reject(new DOMException('interrupted', 'AbortError')); }
      return real.call(this);
    };
  });
  await boot(page);
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__aborted)).toBe(true);
  await expect(page.locator('.motion.poster-only')).toHaveCount(0);
  await expect(page.locator('#introSound')).not.toHaveText(/Tik om te starten/);
});
