// The mouth belongs to the face.
//
// Milo and Luna are drawn as one picture with a mouth laid over it, and the
// mouth only opens and closes — the lip-sync never moves it. What used to move
// it was the talking animation: it ran on the body image, and the mouth, its
// sibling, stayed behind and slid across the face twice a second. These tests
// measure the mouth against the face while the character is moving, for both
// guides, at several sizes.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = {
  schemaVersion: 3, language: 'nl', name: 'Wolkje', onboardingComplete: true, tourDone: true,
  voice: 'Milo', group: 5, niveau: 1, soundOn: false, musicOn: false, timeLimitOn: false,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: {}, games: {}, factsSeen: {} }
};

async function boot(page, state = {}) {
  await page.route('**/*.mp4', r => r.abort());               // no clips: the drawn mouth is what we measure
  // Speech requests are left hanging rather than refused: a refusal switches the
  // voice off for the whole session, and then a guide never enters its talking
  // state at all. Hanging is what a line being spoken looks like from here.
  await page.route(TTS, () => { /* never answered */ });
  await page.addInitScript(s => {
    localStorage.setItem('kwizillo-fresh-start', '0');
    localStorage.setItem('kwizillo-state', JSON.stringify(s));
  }, { ...SAVED, ...state });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4 && !(await page.locator('.home').count()); i++) {
    await page.locator('.motion').click({ timeout: 4000 }).catch(() => {});
    await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
    await page.waitForTimeout(700);
  }
  await expect(page.locator('.home')).toBeVisible({ timeout: 15000 });
}

// Puts a guide on screen as a full-body figure and starts a line.
async function showGuide(page, guide, pose = 'talk') {
  await page.evaluate(({ guide, pose }) => {
    const K = window.KWIZILLO_M1;
    document.querySelector('.milo-host')?.remove();
    const host = K.guideHost({ guide, pose, size: 'md', figure: true });
    host.el.style.cssText = 'position:absolute;left:20px;bottom:20px;z-index:99';
    document.querySelector('.game-frame').appendChild(host.el);
    window.__host = host;
  }, { guide, pose });
  await expect(page.locator('.milo-host')).toBeVisible();
  await expect(page.locator('.milo-mouth')).toBeVisible();
}
// Starts a line; the request hangs, so the guide stays in its talking state.
const talk = page => page.evaluate(() => { window.__host.say('Hallo, ik praat even.') });

// Where the mouth sits on the face — measured in the character's own frame, so
// the answer does not depend on how the character happens to be turned or
// scaled at that instant. Both the face and the mouth are centred exactly by
// the transform, so the vector between their centres, mapped back through that
// transform and divided by the image's own layout size, is the anchor itself.
// If the two ever stopped sharing the movement, this number would wander.
const anchorNow = page => page.evaluate(() => {
  const img = document.querySelector('.milo-figure'), mouth = document.querySelector('.milo-mouth');
  const f = img.getBoundingClientRect(), m = mouth.getBoundingClientRect();
  // Everything that moves the character — the talking bob on the wrapper, the
  // float on the body, a pose turn, the tour's walk — is somewhere above these
  // two elements, so the whole chain is collected and undone. Both boxes are
  // centred exactly by their transforms, so what is left is the anchor itself.
  let M = new DOMMatrix();
  for (let el = img.parentElement; el && el !== document.body; el = el.parentElement) {
    const t = getComputedStyle(el).transform;
    if (t && t !== 'none') M = new DOMMatrix(t).multiply(M);
  }
  const inv = M.inverse();
  const a = inv.transformPoint(new DOMPoint(m.x + m.width / 2, m.y + m.height / 2));
  const b = inv.transformPoint(new DOMPoint(f.x + f.width / 2, f.y + f.height / 2));
  return {
    x: (a.x - b.x) / img.offsetWidth + .5,
    y: (a.y - b.y) / img.offsetHeight + .5,
    fx: f.x, fy: f.y, fw: f.width
  };
});
async function sample(page, n = 24, everyMs = 25) {
  const out = [];
  for (let i = 0; i < n; i++) { out.push(await anchorNow(page)); await page.waitForTimeout(everyMs) }
  return out;
}
const spread = (rows, key) => Math.max(...rows.map(r => r[key])) - Math.min(...rows.map(r => r[key]));

for (const guide of ['milo', 'luna']) {
  test(`${guide}: the mouth and the body are one object`, async ({ page }) => {
    await boot(page, { voice: guide === 'luna' ? 'Luna' : 'Milo' });
    await showGuide(page, guide);
    // Both are children of the same wrapper, and that wrapper is what moves.
    const dom = await page.evaluate(() => {
      const mouth = document.querySelector('.milo-mouth'), fig = document.querySelector('.milo-figure');
      const css = el => getComputedStyle(el);
      return {
        sameParent: mouth.parentElement === fig.parentElement,
        wrapper: fig.parentElement.className,
        mouthOffsetParent: mouth.offsetParent === fig.parentElement,
        figureAnimation: css(fig).animationName,
        figureTransform: css(fig).transform,
        // Where the mouth is placed, against where the picture actually is: the
        // wrapper may be wider or narrower than the drawing (the tour lays the
        // figure out by height), so a percentage of the wrapper would miss.
        placed: parseFloat(mouth.style.left),
        expected: fig.offsetLeft + window.KWIZILLO_M1.FACE_ANCHORS[document.querySelector('.milo-host').dataset.guide].poses.talk.x * fig.offsetWidth
      };
    });
    expect(dom.sameParent, 'body and mouth share one wrapper').toBe(true);
    expect(dom.wrapper).toContain('milo-char');
    expect(dom.mouthOffsetParent, 'the mouth is positioned against that wrapper').toBe(true);
    expect(dom.figureAnimation, 'nothing animates the body image on its own').toBe('none');
    expect(dom.figureTransform === 'none' || dom.figureTransform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
    expect(Math.abs(dom.placed - dom.expected), 'the mouth is measured from the picture, not from the box around it').toBeLessThan(0.6);
  });

  test(`${guide}: the mouth stays on the face while the character moves and talks`, async ({ page }) => {
    await boot(page, { voice: guide === 'luna' ? 'Luna' : 'Milo' });
    await showGuide(page, guide);

    const still = await sample(page, 6);
    await talk(page);
    await expect(page.locator('.milo-host.talking')).toBeVisible();
    const moving = await sample(page, 24);

    // The character really is moving: the face is somewhere else from frame to frame.
    expect(spread(moving, 'fx'), 'the figure moves while talking').toBeGreaterThan(0.5);
    // And the mouth moves exactly with it.
    expect(spread(moving, 'x'), 'the mouth does not slide across the face').toBeLessThan(0.004);
    expect(spread(moving, 'y'), 'the mouth does not drift up or down the face').toBeLessThan(0.004);
    // Starting and stopping do not jump it either.
    const after = await sample(page, 6);
    expect(Math.abs(still[0].x - moving[0].x)).toBeLessThan(0.004);
    expect(Math.abs(still[0].y - after[5].y)).toBeLessThan(0.004);
  });

  test(`${guide}: the anchor holds at every size, and after a resize`, async ({ page }) => {
    await boot(page, { voice: guide === 'luna' ? 'Luna' : 'Milo' });
    const seen = [];
    for (const width of [320, 390, 430, 820]) {
      await page.setViewportSize({ width, height: 800 });
      await showGuide(page, guide);
      await page.waitForTimeout(150);
      seen.push({ width, ...(await anchorNow(page)) });
    }
    // Different widths, the same spot on the face.
    expect(spread(seen, 'x'), 'the same anchor at every width').toBeLessThan(0.004);
    expect(spread(seen, 'y')).toBeLessThan(0.004);
    // And resizing an already placed guide moves the mouth with it.
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(200);
    const resized = await anchorNow(page);
    expect(Math.abs(resized.x - seen[0].x)).toBeLessThan(0.004);
    expect(Math.abs(resized.y - seen[0].y)).toBeLessThan(0.004);
  });

  test(`${guide}: every pose puts the mouth somewhere on the head`, async ({ page }) => {
    await boot(page, { voice: guide === 'luna' ? 'Luna' : 'Milo' });
    await showGuide(page, guide);
    for (const pose of ['wave', 'talk', 'think', 'cheer', 'pointRight', 'walkA', 'walkB', 'jumpA', 'jumpB']) {
      const placed = await page.evaluate(async p => {
        window.__host.pose(p);
        await new Promise(r => setTimeout(r, 120));
        const mouth = document.querySelector('.milo-mouth');
        const f = document.querySelector('.milo-figure').getBoundingClientRect();
        const m = mouth.getBoundingClientRect();
        return { hidden: mouth.hidden, x: (m.x + m.width / 2 - f.x) / f.width, y: (m.y + m.height / 2 - f.y) / f.height };
      }, pose);
      expect(placed.hidden, `${pose} has a mouth`).toBe(false);
      // Inside the picture, and in its upper half where a head is.
      expect(placed.x, `${pose} x`).toBeGreaterThan(0.05);
      expect(placed.x, `${pose} x`).toBeLessThan(0.95);
      expect(placed.y, `${pose} y`).toBeGreaterThan(0.05);
      expect(placed.y, `${pose} y`).toBeLessThan(0.6);
    }
  });
}

test('switching guide swaps the face and its anchor together', async ({ page }) => {
  await boot(page);
  await showGuide(page, 'milo');
  const milo = await anchorNow(page);
  await showGuide(page, 'luna');
  const luna = await anchorNow(page);
  // Two different characters, two different anchors, each on its own face.
  expect(Math.abs(milo.y - luna.y)).toBeGreaterThan(0.05);
  await showGuide(page, 'milo');
  const again = await anchorNow(page);
  expect(Math.abs(again.x - milo.x)).toBeLessThan(0.004);
  expect(Math.abs(again.y - milo.y)).toBeLessThan(0.004);
});

// The tour lays the guide out by height, so the box around the picture is a
// fifth wider or narrower than the picture itself. That is where a mouth placed
// in percent of the box ended up beside the head.
for (const guide of ['milo', 'luna']) {
  test(`${guide}: the mouth is on the face in the tour, where the box is not the picture`, async ({ page }) => {
    await boot(page, { voice: guide === 'luna' ? 'Luna' : 'Milo', tourDone: false });
    await page.evaluate(g => { window.KWIZILLO_M1.startTour({ guide: g }) }, guide);   // the tour's promise only settles when it ends
    await expect(page.locator('.milo-tour .milo-figure')).toBeVisible();
    await page.waitForFunction(() => { const i = document.querySelector('.milo-tour .milo-figure'); return i && i.getBoundingClientRect().x > 10 });
    // Measured on the cut-out: not while the guide walks in on video (tekenfilmbeweging).
    await page.waitForFunction(() => !document.querySelector('.milo-tour .milo-host.motion-playing'));
    const seen = await page.evaluate(() => {
      const img = document.querySelector('.milo-tour .milo-figure'), mouth = document.querySelector('.milo-tour .milo-mouth');
      const f = img.getBoundingClientRect(), m = mouth.getBoundingClientRect(), box = img.parentElement.getBoundingClientRect();
      return {
        boxDiffers: Math.abs(box.width - f.width),               // how far the box is from the picture
        x: (m.x + m.width / 2 - f.x) / f.width,                  // where the mouth sits on the picture
        y: (m.y + m.height / 2 - f.y) / f.height,
        anchor: window.KWIZILLO_M1.FACE_ANCHORS[document.querySelector('.milo-tour .milo-host').dataset.guide].poses[document.querySelector('.milo-tour .milo-host').dataset.pose]
      };
    });
    expect(Math.abs(seen.x - seen.anchor.x), 'the mouth is on the anchor, not on the box').toBeLessThan(0.01);
    expect(Math.abs(seen.y - seen.anchor.y)).toBeLessThan(0.01);
    expect(seen.x).toBeGreaterThan(0.1);
    expect(seen.x).toBeLessThan(0.9);                            // and so: on the head, not next to it
  });
}
