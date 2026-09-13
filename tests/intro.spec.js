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

    localStorage.setItem('kwizillo-v4-state', JSON.stringify({
      voice:'Stil', soundOn:false, musicOn:false, group:5, lastWorld:'ruimte'
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
  await expect(page.locator('video')).toHaveCount(1);
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

test('the skip button is present and exits the cinematic', async ({ page }) => {
  await boot(page);
  const skip = page.getByRole('button', { name: 'Intro overslaan' });
  await expect(skip).toBeVisible();
  await skip.click();
  await expect(page.getByRole('button', { name: 'Aardewereld' })).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.motion')).toHaveCount(0);
});

test('tapping anywhere on the cinematic continues to Home immediately', async ({ page }) => {
  await boot(page);
  await page.locator('.motion').click({ position: { x: 40, y: 300 } });
  // Must be a direct response to the tap, not the video eventually giving up.
  await expect(page.getByRole('button', { name: 'Aardewereld' })).toBeVisible({ timeout: 2000 });
  await expect(page.locator('.motion')).toHaveCount(0);
});

test('skipping the cinematic clears its pending sound-design timers', async ({ page }) => {
  await boot(page);
  await page.locator('.motion').click({ position: { x: 40, y: 300 } });
  await expect(page.getByRole('button', { name: 'Aardewereld' })).toBeVisible();

  await page.getByRole('button', { name: 'Wetenschapwereld' }).click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.quiz-v2')).toBeVisible();

  // Longer than the last scheduled intro cue (10850ms) would have needed.
  await page.waitForTimeout(11500);
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await expect(page.locator('.motion')).toHaveCount(0);
});
