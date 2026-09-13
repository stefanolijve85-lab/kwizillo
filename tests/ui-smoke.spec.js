const { test, expect } = require('@playwright/test');

// Functional coverage for the flow in CLAUDE.md section 4 and the QA list in section 16.

const WORLDS = [
  ['ruimte', 'Ruimtewereld', 'Space World'],
  ['dieren', 'Dierenwereld', 'Animal World'],
  ['aarde', 'Aardewereld', 'Earth World'],
  ['geschiedenis', 'Geschiedeniswereld', 'History World'],
  ['wetenschap', 'Wetenschapwereld', 'Science World'],
  ['mysterie', 'Mysteriewereld', 'Mystery World']
];

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, lastPlayedDate: null,
  answered: 0, correct: 0, quizzesPlayed: 0, lastWorld: 'ruimte', selectedMascot: 'milo',
  soundOn: false, musicOn: false, sfxVolume: .7, musicVolume: .2, musicTrack: 'magical',
  timeLimitOn: true, timeLimit: 45,
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] },
  ...over
});

async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  // Seed only on the first navigation. addInitScript runs on every navigation, so
  // an unconditional write would wipe what the app saved whenever a test reloads.
  await page.addInitScript(s => {
    if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s));
  }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}

async function answerAll(page, n = 10) {
  for (let i = 0; i < n; i++) {
    await expect(page.locator('.answer')).toHaveCount(4);
    await page.locator('.answer').first().click();
    await expect(page.locator('.feedback-float')).toBeVisible();
    await page.locator('#feedbackNext').click();
  }
}

test('onboarding runs once and collects language, name and voice', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: /English/ }).click();
  await expect(page.getByRole('heading', { name: 'What is your name?' })).toBeVisible();

  await expect(page.locator('#obNext')).toBeDisabled();
  await page.locator('#obName').fill('Sam');
  await expect(page.locator('#obNext')).toBeEnabled();
  await page.locator('#obNext').click();

  await page.getByRole('button', { name: /Luna/ }).click();
  await page.locator('#obNext').click();
  await expect(page.locator('.onboarding h1')).toHaveText('Welcome, Sam!');
  await page.locator('#obStart').click();

  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('.hud-id b')).toHaveText('Hi Sam!');

  // A returning player never sees onboarding again.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.onboarding')).toHaveCount(0);
});

test('a brand new player starts at zero, not on seeded progress', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Nederlands/ }).click();
  await page.locator('#obName').fill('Nieuw');
  await page.locator('#obNext').click();
  await page.getByRole('button', { name: /Stil/ }).click();
  await page.locator('#obNext').click();
  await page.locator('#obStart').click();

  await expect(page.locator('.hud-right')).toContainText('🪙 0');
  await expect(page.locator('.hud-right')).toContainText('🔥 0');
  await expect(page.locator('.hud-id small')).toHaveText('Level 1');

  await page.locator('.native-bottom-nav button[data-nav="achievements"]').click();
  await expect(page.locator('.achievement-card.done')).toHaveCount(0);
});

test('all six worlds open with local art and four topics', async ({ page }) => {
  await boot(page);
  for (const [key, nl] of WORLDS) {
    await page.locator(`[data-world="${key}"]`).click();
    await expect(page.locator('.native-world')).toBeVisible();
    await expect(page.locator('.world-title-wrap h1')).toHaveText(nl);
    await expect(page.locator('.world-topic')).toHaveCount(4);
    await expect(page.locator('#worldMix')).toBeVisible();

    const src = await page.locator('.native-world-bg').getAttribute('src');
    expect(src).toBe(`assets/worlds/${key}.jpg`);
    expect(src).not.toMatch(/^https?:/);

    await page.getByRole('button', { name: 'Terug naar home' }).click();
    await expect(page.locator('.home')).toBeVisible();
  }
});

test('no screen loads art from an external host', async ({ page }) => {
  const external = [];
  page.on('request', r => { if (/^https?:\/\//.test(r.url()) && !r.url().includes('127.0.0.1')) external.push(r.url()); });
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  expect(external).toEqual([]);
});

test('quiz 1 and quiz 2 of a world never repeat a question', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();

  const seen = new Set();
  await page.locator('#worldMix').click();
  for (let quiz = 1; quiz <= 2; quiz++) {
    await expect(page.locator('.quiz-brand small')).toContainText(`Quiz ${quiz}`);
    for (let i = 0; i < 10; i++) {
      const prompt = await page.locator('.quiz-card h1').textContent();
      expect(seen.has(prompt), `Quiz ${quiz} repeated: ${prompt}`).toBe(false);
      seen.add(prompt);
      await page.locator('.answer').first().click();
      await page.locator('#feedbackNext').click();
    }
    await expect(page.locator('.result-v2')).toBeVisible();
    await expect(page.locator('#againBtn')).toHaveText(`Start quiz ${quiz + 1}`);
    // "Start quiz N" goes straight into the next quiz, no detour via the world screen.
    if (quiz === 1) await page.locator('#againBtn').click();
  }
  expect(seen.size).toBe(20);
});

test('hint, feedback and progress bar behave inside a quiz', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="wetenschap"]').click();
  await page.locator('.world-topic').first().click();

  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 1 van 10');
  await expect(page.locator('.quiz-art img')).toBeVisible();

  await page.getByRole('button', { name: /Hint/ }).click();
  await expect(page.locator('.hint-float')).toBeVisible();
  await page.getByRole('button', { name: 'Hint sluiten' }).click();
  await expect(page.locator('.hint-float')).toHaveCount(0);

  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await expect(page.locator('.answer.correct')).toHaveCount(1);
  await page.locator('#feedbackNext').click();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 2 van 10');
});

test('a second answer tap on the same question is ignored', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('.world-topic').first().click();
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  for (const b of await page.locator('.answer').all()) await expect(b).toBeDisabled();
});

test('every navigation destination is dynamic and interactive', async ({ page }) => {
  await boot(page, SAVED({ answered: 12, correct: 9, quizzesPlayed: 2, xp: 90, coins: 18, streak: 3,
    progress: { worlds: { ruimte: { answered: 12, correct: 9, quizzes: 2, xp: 90 } }, topics: {}, runs: {},
      correctQuestionIds: ['ruimte-zonnestelsel-01', 'ruimte-zonnestelsel-02'] } }));

  await page.locator('.native-bottom-nav button[data-nav="achievements"]').click();
  await expect(page.locator('.achievement-card')).toHaveCount(6);

  await page.locator('.native-bottom-nav button[data-nav="collection"]').click();
  await expect(page.locator('.collection-tabs')).toBeVisible();
  await expect(page.locator('.progress-world')).toHaveCount(6);
  await page.getByRole('button', { name: /Kaarten/ }).click();
  await expect(page.locator('.knowledge-card')).toHaveCount(2);
  await page.getByRole('button', { name: /Mascottes/ }).click();
  await expect(page.locator('.mascot-card')).toHaveCount(6);
  await page.locator('.mascot-card:not([disabled])').first().click();

  await page.locator('.native-bottom-nav button[data-nav="stats"]').click();
  await expect(page.locator('.stat-ring b')).toHaveText('75%');
  await expect(page.locator('.world-stat-list article')).toHaveCount(6);

  await page.locator('.native-bottom-nav button[data-nav="parent"]').click();
  await expect(page.locator('.settings-list')).toBeVisible();
});

test('parent controls, language toggle and audio panel all operate', async ({ page }) => {
  await boot(page);
  await page.locator('.native-bottom-nav button[data-nav="parent"]').click();
  await expect(page.getByText('Groep 5')).toBeVisible();
  await page.locator('[data-group="plus"]').click();
  await expect(page.getByText('Groep 6')).toBeVisible();

  await page.locator('#timeToggle').click();
  await expect(page.locator('#timeRange')).toBeDisabled();

  await page.locator('[data-setlang="en"]').click();
  await expect(page.locator('.panel-head h1')).toHaveText('Parent zone');
  await expect(page.getByText('Year 6')).toBeVisible();
  await page.locator('[data-setlang="nl"]').click();

  await page.locator('#soundOpen').click();
  await expect(page.locator('.sound-settings-overlay')).toBeVisible();
  for (const sel of ['[data-toggle="sfx"]', '[data-toggle="music"]', '[data-guide="Milo"]', '[data-guide="Luna"]', '[data-guide="Stil"]']) {
    await expect(page.locator(sel)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Sluiten' }).click();

  await page.locator('#privacyOpen').click();
  await expect(page.locator('.simple-modal')).toContainText('nooit naar een andere dienst');
  await page.getByRole('button', { name: 'Begrepen' }).click();
});

test('switching language translates the whole app and swaps the question bank', async ({ page }) => {
  await boot(page);
  await page.locator('[data-lang="en"]').click();

  await expect(page.locator('.home-section')).toHaveText('Pick your world');
  await expect(page.locator('.native-bottom-nav')).toContainText('Awards');
  await expect(page.locator('.native-bottom-nav')).toContainText('Collection');

  await page.locator('[data-world="ruimte"]').click();
  await expect(page.locator('.world-title-wrap h1')).toHaveText('Space World');
  await expect(page.locator('.world-topic').first()).toContainText('Solar system');

  await page.locator('.world-topic').first().click();
  const prompt = await page.locator('.quiz-card h1').textContent();
  expect(prompt).toMatch(/^(Which|What|How|Why)\b/);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Question 1 of 10');
});

test('progress and settings survive a reload', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="aarde"]').click();
  await page.locator('.world-topic').first().click();
  await answerAll(page, 3);
  await page.locator('#qBack').click();
  await page.getByRole('button', { name: 'Terug naar home' }).click();

  const before = await page.locator('.hud-right').innerText();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  expect(await page.locator('.hud-right').innerText()).toBe(before);
  await expect(page.locator('.hud-id b')).toHaveText('Hoi Mike!');
});

test('finishing a quiz counts one quiz, one streak day and real stats', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('#worldMix').click();
  await answerAll(page, 10);
  await expect(page.locator('.result-v2')).toBeVisible();

  await page.locator('#collectionBtn').click();
  await page.locator('.native-bottom-nav button[data-nav="stats"]').click();
  await expect(page.locator('.stat-hero p')).toContainText('10 vragen beantwoord');
  await expect(page.locator('.stat-hero p')).toContainText('1 quiz gespeeld');
  await expect(page.locator('.stat-cards')).toContainText('Dagen op rij');
});

test('the app stays playable with no speech backend', async ({ page }) => {
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  await boot(page, SAVED({ voice: 'Milo' }));
  await page.route('**/api/tts', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"x"}' }));

  await page.locator('[data-world="mysterie"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  expect(failures).toEqual([]);
});

test('rapid taps and navigation during a quiz never break the screen', async ({ page }) => {
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  await boot(page);
  await page.locator('[data-world="geschiedenis"]').click();
  await page.locator('.world-topic').first().click();

  const first = page.locator('.answer').first();
  await first.click();
  await first.click({ force: true }).catch(() => {});
  await expect(page.locator('.feedback-float')).toHaveCount(1);

  await page.locator('#feedbackNext').click();
  await page.locator('#qBack').click();
  await expect(page.locator('.native-world')).toBeVisible();
  expect(failures).toEqual([]);
});

test('resetting progress sits behind a parental gate', async ({ page }) => {
  await boot(page, SAVED({ coins: 40, xp: 120 }));
  await page.locator('.native-bottom-nav button[data-nav="parent"]').click();
  await page.locator('#resetOpen').click();

  const card = page.locator('.simple-modal-card');
  await expect(card).toContainText('volwassene');
  const question = await card.locator('p').textContent();
  const [a, b] = question.match(/\d+/g).map(Number);

  // A wrong answer must not get through.
  await page.locator('#gateInput').fill(String(a * b + 1));
  await page.locator('.gate-form button').click();
  await expect(page.locator('.gate-error')).toBeVisible();
  await expect(page.getByText('Voortgang resetten?')).toHaveCount(0);

  await page.locator('#gateInput').fill(String(a * b));
  await page.locator('.gate-form button').click();
  await expect(page.getByRole('heading', { name: 'Voortgang resetten?' })).toBeVisible();
});

test('the result card shows score, stars and stats above the buttons', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await answerAll(page);
  await expect(page.locator('.result-v2 h1')).toBeVisible();
  await expect(page.locator('.result-stars i')).toHaveCount(3);
  await expect(page.locator('.result-stats span')).toHaveCount(3);
  // Nothing may sit on top of the stats row (a legacy rule once floated the buttons over it).
  const covered = await page.locator('.result-stats').evaluate(el => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(el === hit || el.contains(hit));
  });
  expect(covered, 'result stats hidden behind another element').toBe(false);
});

test('statistics never print "undefined" for a world without counters', async ({ page }) => {
  await boot(page, SAVED({ progress: { worlds: { ruimte: { answered: 4, correct: 3 } }, topics: {}, runs: {}, correctQuestionIds: [] } }));
  await page.locator('.native-bottom-nav [data-nav="stats"]').click();
  await expect(page.locator('.world-stat-list')).toBeVisible();
  const text = await page.locator('.world-stat-list').textContent();
  expect(text).not.toContain('undefined');
  expect(text).not.toContain('NaN');
});

test('"another question" swaps in a genuinely new question', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();

  const before = await page.locator('.quiz-card h1').textContent();
  await page.locator('#skipBtn').click();
  const after = await page.locator('.quiz-card h1').textContent();
  expect(after).not.toBe(before);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 1 van 10');

  // A single 10-question topic has nothing spare, so the button says so instead
  // of silently dropping the question.
  await page.locator('#qBack').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('#skipBtn')).toBeDisabled();
});

for (const [label, width, height] of [['iPhone SE', 375, 667], ['iPhone 14', 390, 844], ['Pro Max', 430, 932]]) {
  test(`layout holds on ${label} without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await boot(page);

    const overflow = async () => page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth);

    await expect(page.locator('.home-world')).toHaveCount(6);
    expect(await overflow(), 'home overflows horizontally').toBe(false);

    // The longest world title ("Geschiedeniswereld") used to push the settings
    // button past the right edge of the screen.
    await page.locator('[data-world="geschiedenis"]').click();
    await expect(page.locator('.world-topic')).toHaveCount(4);
    expect(await overflow(), 'world overflows horizontally').toBe(false);
    const gear = await page.locator('#worldGear').boundingBox();
    expect(gear.x + gear.width, 'settings button clipped on the right').toBeLessThanOrEqual(width);
    expect(gear.width, 'settings button squashed').toBeGreaterThanOrEqual(40);
    for (const b of await page.locator('.world-topic b').all()) {
      const clipped = await b.evaluate(el => el.scrollWidth > el.clientWidth + 1);
      expect(clipped, `topic title clipped: ${await b.textContent()}`).toBe(false);
    }
    await page.locator('#worldBack').click();

    await page.locator('[data-world="ruimte"]').click();
    await expect(page.locator('.world-topic')).toHaveCount(4);

    await page.locator('.world-topic').first().click();
    await expect(page.locator('.answer')).toHaveCount(4);
    expect(await overflow(), 'quiz overflows horizontally').toBe(false);

    // Every answer tile stays a comfortable touch target.
    for (const b of await page.locator('.answer').all()) {
      const box = await b.boundingBox();
      expect(box.height, 'answer tile too small to tap').toBeGreaterThanOrEqual(44);
    }
    const actions = await page.locator('.quiz-actions .action').all();
    for (const b of actions) {
      const box = await b.boundingBox();
      expect(box.height, 'action button too small to tap').toBeGreaterThanOrEqual(40);
    }
  });
}

test('finishing a topic quiz leads to the next topic, not a reshuffle of the same ten', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();

  // Topic 1 of 4.
  await page.locator('.world-topic').first().click();
  const firstRun = new Set();
  for (let i = 0; i < 10; i++) {
    firstRun.add(await page.locator('.quiz-card h1').textContent());
    await page.locator('.answer').first().click();
    await page.locator('#feedbackNext').click();
  }
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('#againBtn')).toHaveText(/^Volgende: /);
  await expect(page.locator('#retryBtn')).toBeVisible();

  // The primary action opens the NEXT topic: none of its questions were in the first run.
  await page.locator('#againBtn').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await expect(page.locator('.quiz-brand small')).toContainText('Quiz 1');
  for (let i = 0; i < 10; i++) {
    const prompt = await page.locator('.quiz-card h1').textContent();
    expect(firstRun.has(prompt), `next topic repeated: ${prompt}`).toBe(false);
    await page.locator('.answer').first().click();
    await page.locator('#feedbackNext').click();
  }
  await expect(page.locator('.result-v2')).toBeVisible();
});

test('after the fourth topic the result offers the mixed quiz', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('.world-topic').nth(3).click();
  await answerAll(page, 10);
  await expect(page.locator('#againBtn')).toHaveText('Start gemengde quiz');
  await page.locator('#againBtn').click();
  await expect(page.locator('.quiz-brand small')).toContainText('Gemengde quiz');
});

test('a mixed quiz result still numbers the next quiz', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="aarde"]').click();
  await page.locator('#worldMix').click();
  await answerAll(page, 10);
  await expect(page.locator('#againBtn')).toHaveText('Start quiz 2');
  await expect(page.locator('#retryBtn')).toHaveCount(0);
});
