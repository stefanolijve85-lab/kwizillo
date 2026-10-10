const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');
const { progressAtLevel } = require('./levels.js');

// A buddy earned mid-quiz introduces itself between the explanation and the
// next question. Tap it away and carry on.
async function feedbackNext(page) {
  await page.locator('#feedbackNext').click();
  const hello = page.locator('.mascot-unlock-ok');
  if (await hello.count()) await hello.click();
}

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
    localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' }));  if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s));
  }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}

// The intro waits for one tap (that tap unlocks sound). With the video aborted
// the tap goes straight on to the next screen.
// The film starts by itself; the first tap turns sound on, the second continues.
async function tapThroughIntro(page) {
  const motion = page.locator('.motion');
  await motion.click({ timeout: 8000 }).catch(() => {});   // the intro may already have gone on by itself
  await motion.click({ timeout: 1500 }).catch(() => {});
  // Wie al een naam heeft komt na de film op het terugkeerscherm uit
  // (welcome-back.js); "Verder spelen" brengt hem op Home.
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
}

// Answers n questions. `correct` picks the right tile (needed to pass a level);
// otherwise the first tile, which is right by chance only.
async function answerAll(page, n = 10, { correct = false } = {}) {
  for (let i = 0; i < n; i++) {
    await expect(page.locator('.answer')).toHaveCount(4);
    if (correct) {
      const answer = await page.evaluate(() => { const q = window.KWIZILLO_M1.quiz; return q.questions[q.index].answer; });
      await page.locator(`.answer[data-a="${encodeURIComponent(answer)}"]`).click();
    } else {
      await page.locator('.answer').first().click();
    }
    await expect(page.locator('.feedback-float')).toBeVisible();
    await feedbackNext(page);
  }
}

test('onboarding runs once and collects language, name and voice', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);

  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: /English/ }).click();
  await expect(page.getByRole('heading', { name: 'What is your name?' })).toBeVisible();

  await expect(page.locator('#obNext')).toBeDisabled();
  await page.locator('#obName').fill('Sam');
  await expect(page.locator('#obNext')).toBeEnabled();
  await page.locator('#obNext').click();

  // Milo asks the age; the school year is suggested from it and can be changed.
  await expect(page.getByRole('heading', { name: 'How old are you?' })).toBeVisible();
  await expect(page.locator('#obNext')).toBeDisabled();
  await page.locator('[data-age="8"]').click();
  await page.locator('#obNext').click();
  await expect(page.getByRole('heading', { name: 'Which year are you in?' })).toBeVisible();
  await expect(page.locator('[data-group="5"]')).toHaveClass(/selected/);
  await page.locator('[data-group="6"]').click();
  await page.locator('#obNext').click();

  await page.getByRole('button', { name: /Luna/ }).click();
  await page.locator('#obNext').click();
  await expect(page.locator('.onboarding h1')).toHaveText('Welcome, Sam!');
  await page.locator('#obStart').click();

  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('.hud-id b')).toHaveText('Hi Sam!');
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.age, window.KWIZILLO_M1.state.group])).toEqual([8, 6]);
  // Milo's tour starts on the first Home and can be skipped.
  await expect(page.locator('.milo-tour')).toBeVisible({ timeout: 5000 });
  await page.locator('.milo-tour-skip').click();
  await expect(page.locator('.milo-tour')).toHaveCount(0, { timeout: 5000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.tourDone)).toBe(true);

  // What a child types is kept: a refresh comes back to Home with the name on
  // it, not to the intro. (A development address starts clean by default so the
  // whole opening can be shown again; ?keep=1 is how a test asks for the state
  // to stay, which is what a phone or the app does by itself.)
  await page.goto('/?keep=1', { waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.onboarding')).toHaveCount(0);
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.name)).toBe('Sam');

  // And one clean run on demand, which is also what every launch on a
  // development address does until ?keep=1 says otherwise.
  await page.goto('/?fresh=1', { waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  await expect(page.locator('.onboarding')).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.name)).toBe('');
  expect(new URL(page.url()).search).toBe('');

  // A returning player never sees onboarding again.
  await page.evaluate(() => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-entitlement', JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' }));  localStorage.setItem('kwizillo-state', JSON.stringify({ ...window.KWIZILLO_M1.state, name: 'Sam', onboardingComplete: true, language: 'en' })); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.onboarding')).toHaveCount(0);
  await expect(page.locator('.hud-id b')).toHaveText('Hi Sam!');
});

test('a brand new player starts at zero, not on seeded progress', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  await page.getByRole('button', { name: /Nederlands/ }).click();
  await page.locator('#obName').fill('Nieuw');
  await page.locator('#obNext').click();
  await page.locator('[data-age="7"]').click(); await page.locator('#obNext').click();
  await page.locator('#obNext').click();
  await page.getByRole('button', { name: /Stil/ }).click();
  await page.locator('#obNext').click();
  await page.locator('#obStart').click();
  await page.locator('.milo-tour-skip').click();

  await expect(page.locator('.home .hud-chip')).toHaveCount(0);   // no coin or statistics button on Home: the bar below has Statistieken
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.coins, window.KWIZILLO_M1.state.streak])).toEqual([0, 0]);
  await expect(page.locator('.hud-id small')).toHaveCount(0);   // the level line under the greeting is gone (2026-10-07)
  expect(await page.evaluate(() => window.KWIZILLO_M1.level())).toBe(1);

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
    // Achter het pad hangt een versiemerk (?v20) tegen oude browsercache.
    expect(src.split('?')[0]).toBe(`assets/worlds/${key}.jpg`);
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
      await answerAll(page, 1, { correct: true });   // pass the level so the next quiz is offered
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
  await expect(page.locator('.quiz-art .art-main')).toBeVisible();

  await page.getByRole('button', { name: /Hint/ }).click();
  await expect(page.locator('.hint-float')).toBeVisible();
  await page.getByRole('button', { name: 'Hint sluiten' }).click();
  await expect(page.locator('.hint-float')).toHaveCount(0);

  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await expect(page.locator('.answer.correct')).toHaveCount(1);
  await feedbackNext(page);
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
  await expect(page.locator('.achievement-card')).toHaveCount(10);   // eight, plus two for Talen

  await page.locator('.native-bottom-nav button[data-nav="collection"]').click();
  await expect(page.locator('.collection-tabs')).toBeVisible();
  await expect(page.locator('.progress-world[data-world]')).toHaveCount(8);   // the eight worlds
  await expect(page.locator('#megaProgress')).toBeVisible();                    // and the Mega Quiz
  await page.getByRole('button', { name: /Kaarten/ }).click();
  await expect(page.locator('.kcard')).toHaveCount(2);
  // Every card carries its question's own illustration and opens large on tap.
  for (const img of await page.locator('.kcard-art img').all()) expect(await img.getAttribute('src')).toMatch(/assets\/questions\/q\//);
  await page.locator('.kcard').first().click();
  await expect(page.locator('.kcard-zoom')).toBeVisible();
  await page.locator('.kcard-zoom').click();
  await expect(page.locator('.kcard-zoom')).toHaveCount(0);
  await page.getByRole('button', { name: /Mascottes/ }).click();
  await expect(page.locator('.mascot-card')).toHaveCount(19);   // twelve, plus Mike and six more (shop only)
  await page.locator('.mascot-card:not([disabled])').first().click();

  await page.locator('.native-bottom-nav button[data-nav="stats"]').click();
  await expect(page.locator('.stat-orb b')).toHaveText('75%');
  await expect(page.locator('.world-stat-list article')).toHaveCount(8);

  await page.locator('.native-bottom-nav button[data-nav="parent"]').click();
  await expect(page.locator('.settings-list')).toBeVisible();
});

test('parent controls, language toggle and audio panel all operate', async ({ page }) => {
  await boot(page);
  await page.locator('.native-bottom-nav button[data-nav="parent"]').click();
  // The order a parent reads top to bottom; the school group is set in the onboarding only
  // (it looked like a second difficulty setting next to the play level).
  // language (the Talen learning language is chosen in Talen itself, not here)
  const order = await page.locator('.settings-list > section').evaluateAll(els => els.map(e => e.id || [...e.classList].find(c => c !== 'setting-card' && c !== 'clickable') || ''));
  expect(order.slice(1)).toEqual(['level-card', 'lang-card', 'soundOpen', '', 'world-levels', 'tour-card', 'players-card', 'feedbackOpen', 'shareOpen', 'privacyOpen', 'resetOpen', 'logoutOpen', 'deleteOpen']);
  await expect(page.locator('.settings-list > :first-child')).toContainText('Premium');
  await expect(page.locator('[data-group]')).toHaveCount(0);
  // the eight world levels as a 2×4 grid
  const badges = await page.locator('.world-levels .world-level-row > span').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().top)));
  expect(badges).toHaveLength(8);
  expect(new Set(badges).size).toBe(2);

  await page.locator('#timeToggle').click();
  await expect(page.locator('#timeToggle')).not.toHaveClass(/on/);

  await page.locator('[data-setlang="en"]').click();
  await expect(page.locator('.panel-head h1')).toHaveText('Parent zone');
  await expect(page.locator('.level-card b')).toContainText('Game level');
  await page.locator('[data-setlang="nl"]').click();

  await page.locator('#soundOpen').click();
  await expect(page.locator('.sound-settings-overlay')).toBeVisible();
  for (const sel of ['[data-toggle="sfx"]', '[data-toggle="music"]', '[data-guide="Milo"]', '[data-guide="Luna"]', '[data-guide="Stil"]']) {
    await expect(page.locator(sel)).toBeVisible();
  }
  // Three separate sliders: effects, music and the guide's voice.
  await expect(page.locator('[data-volume="sfx"]')).toBeVisible();
  await expect(page.locator('[data-volume="music"]')).toBeVisible();
  await expect(page.locator('[data-volume="voice"]')).toBeVisible();
  await page.locator('[data-guide="Milo"]').click();
  await page.locator('[data-volume="voice"]').fill('40');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.voiceVolume)).toBeCloseTo(0.4, 5);
  await page.getByRole('button', { name: 'Sluiten' }).click();

  // Privacy is a screen of its own now; tests/privacy.spec.js checks what it says.
  await page.locator('#privacyOpen').click();
  await expect(page.locator('.privacy-screen')).toContainText('Nooit de naam van je kind');
  await page.locator('.panel-back').click();
  await expect(page.locator('.parent-screen')).toBeVisible();
});

test('switching language translates the whole app and swaps the question bank', async ({ page }) => {
  await boot(page);
  // Language lives in the profile (and the parent zone), not on Home.
  await expect(page.locator('.home [data-lang]')).toHaveCount(0);
  await expect(page.locator('.home [data-voice]')).toHaveCount(0);
  await expect(page.locator('#homeCta')).toHaveCount(0);
  await page.locator('#homeProfile').click();
  await page.locator('[data-setlang="en"]').click();
  await page.locator('.panel-back').click();

  await expect(page.locator('.home-section').first()).toHaveText('Pick your world');
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
  await tapThroughIntro(page);
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

  await page.locator('#homeBtn').click();
  await expect(page.locator('.home')).toBeVisible();
  await page.locator('.native-bottom-nav button[data-nav="stats"]').click();
  await expect(page.locator('.stats-hero-copy p')).toContainText('10 vragen beantwoord');
  await expect(page.locator('.stats-hero-copy p')).toContainText('1 quiz gespeeld');
  await expect(page.locator('.stat-tiles')).toContainText('Dagen op rij');
});

test('the app stays playable with no speech backend', async ({ page }) => {
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  await boot(page, SAVED({ voice: 'Milo' }));
  await page.route(TTS, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"x"}' }));

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

  await feedbackNext(page);
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

test('feedback speech is fetched while the question is on screen, not after the answer', async ({ page }) => {
  const requests = [];
  await page.route(TTS, route => {
    requests.push(ttsPayload(route.request()).text);
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) });
  });
  await boot(page, SAVED({ voice: 'Milo' }));
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('.answer')).toHaveCount(4);

  // Question + four answers, then both feedback lines warm the cache.
  await expect.poll(() => requests.length, { timeout: 8000 }).toBeGreaterThanOrEqual(7);
  const before = requests.length;
  // The praise line varies per question; both outcomes are warmed.
  const question = requests[0];
  const extra = requests.filter(t => t !== question && !/^[A-D]\. /.test(t));
  expect(extra.length, 'both feedback lines prefetched').toBeGreaterThanOrEqual(2);
  expect(extra.some(t => /juiste antwoord/.test(t)), 'try-again feedback prefetched').toBe(true);
  expect(extra.some(t => !/juiste antwoord/.test(t)), 'good feedback prefetched').toBe(true);

  const seen = new Set(requests);
  const explanation = await page.evaluate(() => window.KWIZILLO_M1.quiz.questions[0].explanation);
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await page.waitForTimeout(600);
  // The warm-up queue may still be working through the next question's lines
  // (two at a time), but nothing is fetched twice and this question's
  // feedback line is not among the new requests: it came from the cache.
  const after = requests.slice(before);
  expect(after.filter(t => seen.has(t)), 'nothing is fetched twice').toEqual([]);
  expect(after.filter(t => t.includes(explanation)), 'feedback must be served from the warm cache').toEqual([]);
});

test('"next" on the answer card moves on with one tap while the voice plays; "Nog eens" re-reads an answered question and lets the child answer again', async ({ page }) => {
  let release;
  const gate = new Promise(r => { release = r; });
  let n = 0;
  await page.route(TTS, async route => {
    n++;
    // The feedback line (after question + 4 answers + 2 prefetches) is held back
    // until the test releases it, so "listening" state is observable.
    if (n > 7) await gate;
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) });
  });
  await boot(page, SAVED({ voice: 'Milo' }));
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('#repeatBtn')).toBeVisible();
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await expect(page.locator('.feedback-answer b')).not.toBeEmpty();
  // The card is lean: verdict + answer on top, then the explanation, no mascot portrait, no praise title.
  await expect(page.locator('.feedback-card h2')).toHaveCount(0);
  await expect(page.locator('.feedback-card .mascot-face')).toHaveCount(0);
  const order = await page.locator('.feedback-card > *').evaluateAll(els => els.map(e => e.className.split(' ')[0]));
  expect(order.indexOf('feedback-verdict')).toBeLessThan(order.indexOf('feedback-answer'));
  expect(order.indexOf('feedback-answer')).toBeLessThan(order.indexOf('feedback-explain'));
  expect(order.indexOf('feedback-explain')).toBeLessThan(order.indexOf('feedback-next'));
  // The bar shows how far the explanation is, but one tap moves on at any time.
  await expect(page.locator('#feedbackNext')).toBeEnabled();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 1 van 10');
  await feedbackNext(page);
  await expect(page.locator('.feedback-float')).toHaveCount(0);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 2 van 10');
  release();
  // The close button returns to the answered question, whose own Next moves on.
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await page.locator('#feedbackClose').click();
  await expect(page.locator('.feedback-float')).toHaveCount(0);
  // "Nog eens" on an answered question reads it again with clean tiles, and the
  // child can answer once more; the score keeps the first answer.
  const scoreBefore = await page.evaluate(() => window.KWIZILLO_M1.quiz.score);
  await page.locator('#repeatBtn').click();
  await expect(page.locator('.answer.correct, .answer.wrong')).toHaveCount(0);
  await expect(page.locator('.answer').first()).toBeEnabled();
  const right = await page.evaluate(() => { const K = window.KWIZILLO_M1; return K.quiz.questions[K.quiz.index].answer; });
  await page.locator(`.answer[data-a="${encodeURIComponent(right)}"]`).click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await expect(page.locator('.feedback-verdict')).toContainText(/Goed|Juist|Klopt|Yes|Top/i);
  expect(await page.evaluate(() => window.KWIZILLO_M1.quiz.score)).toBe(scoreBefore);
  await feedbackNext(page);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 3 van 10');
});

test('the guide choice lights up the chosen card', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  await page.getByRole('button', { name: /Nederlands/ }).click();
  await page.locator('#obName').fill('Sam');
  await page.locator('#obNext').click();
  await page.locator('[data-age="7"]').click(); await page.locator('#obNext').click();
  await page.locator('#obNext').click();
  await page.getByRole('button', { name: /Luna/ }).click();
  await expect(page.locator('[data-guide="Luna"]')).toHaveClass(/selected/);
  await expect(page.locator('[data-guide="Luna"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-guide="Milo"]')).not.toHaveClass(/selected/);
  await expect(page.locator('[data-guide="Luna"] .choice-check')).toBeVisible();
});

test('closing the feedback card shows the answered question without reading it out', async ({ page }) => {
  const texts = [];
  await page.route(TTS, route => { texts.push(ttsPayload(route.request()).text); route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) }); });
  await boot(page, SAVED({ voice: 'Milo' }));
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect.poll(() => texts.length).toBeGreaterThanOrEqual(5);
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  const before = texts.length;
  await page.locator('#feedbackClose').click();
  await expect(page.locator('.quiz-v2')).toHaveClass(/is-review/);
  await page.waitForTimeout(500);
  expect(texts.length, 'no new speech request after closing the card').toBe(before);
});

test('every line the app can say next is warmed before it is needed', async ({ page }) => {
  const seen = [];
  await page.route(TTS, route => { const b = ttsPayload(route.request()); seen.push(b.voice + '|' + b.text); route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) }); });
  await boot(page, SAVED({ voice: 'Milo' }));
  // Home warms both guides' hello lines.
  await expect.poll(() => seen.filter(t => t.startsWith('Luna|Hoi! Ik ben Luna') || t.startsWith('Milo|Hoi! Ik ben Milo')).length, { timeout: 8000 }).toBe(2);

  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  const [q1, q2, hint1] = await page.evaluate(() => { const K = window.KWIZILLO_M1; const s = K.quiz.questions; return [s[0].prompt, s[1].prompt, s[0].hint]; });
  // Current question + its feedback + its hint + the next question and its feedback.
  await expect.poll(() => seen.some(t => t === 'Milo|' + q2), { timeout: 8000 }).toBe(true);
  expect(seen.some(t => t === 'Milo|' + hint1), 'hint warmed').toBe(true);
  const before = seen.length;

  // Opening the hint and moving to the next question needs no new request.
  await page.locator('#hintBtn').click();
  await page.locator('.hint-close').click();
  await page.locator('.answer').first().click();
  await feedbackNext(page);
  await expect(page.locator('.quiz-card h1')).toHaveText(q2);
  await page.waitForTimeout(500);
  const q2Requests = seen.slice(before).filter(t => t === 'Milo|' + q2).length;
  expect(q2Requests, 'the next question was already fetched').toBe(0);
});

test('without a voice the feedback "next" is live at once and the repeat button is hidden', async ({ page }) => {
  await boot(page);   // voice: Stil
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('#repeatBtn')).toBeHidden();
  await page.locator('.answer').first().click();
  await expect(page.locator('#feedbackNext')).toBeEnabled();
});

test('Brazilian Portuguese: onboarding offers it, the whole UI and the question bank follow', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  // The picker shows every language the app offers; the count comes from the app itself.
  const offered = await page.evaluate(() => window.KWIZILLO_M1.LANGUAGES.length);
  await expect(page.locator('[data-lang]')).toHaveCount(offered);
  await page.getByRole('button', { name: /Português \(Brasil\)/ }).click();
  await expect(page.getByRole('heading', { name: 'Qual é o seu nome?' })).toBeVisible();
  await page.locator('#obName').fill('Ana');
  await page.locator('#obNext').click();
  await expect(page.getByRole('heading', { name: 'Quantos anos você tem?' })).toBeVisible();
  await page.locator('[data-age="9"]').click();
  await page.locator('#obNext').click();
  await expect(page.locator('[data-group="6"]')).toHaveText('6º ano');
  await page.locator('#obNext').click();
  await page.getByRole('button', { name: /Sem voz/ }).click();
  await page.locator('#obNext').click();
  await page.locator('#obStart').click();
  await expect(page.locator('.hud-id b')).toContainText('Oi, Ana!');
  await expect(page.locator('.native-bottom-nav')).toContainText('Início');
  await page.locator('[data-world="dieren"]').click();
  await expect(page.locator('.world-title-wrap h1')).toHaveText('Mundo dos Animais');
  await page.locator('#worldMix').click();
  const prompt = await page.locator('.quiz-card h1').textContent();
  expect(prompt).toMatch(/[?…]$/);
  expect(await page.evaluate(() => window.KWIZILLO_M1.questions.length)).toBeGreaterThanOrEqual(480);
  expect(await page.evaluate(() => window.KWIZILLO_M1.questions[0].prompt)).toMatch(/Sol/);
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('pt');
});

for (const [label, width, height] of [['iPhone SE', 375, 667], ['Pro Max', 430, 932]]) {
  test(`the card collection scrolls only vertically on ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await boot(page, SAVED({ progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: ['ruimte-zonnestelsel-01', 'ruimte-astronauten-03', 'geschiedenis-egyptenaren-07', 'mysterie-verborgen_schatten-08', 'wetenschap-natuur_energie-03'] } }));
    await page.locator('.native-bottom-nav button[data-nav="collection"]').click();
    await page.getByRole('button', { name: /Kaarten/ }).click();
    await expect(page.locator('.kcard')).toHaveCount(5);
    const widest = await page.evaluate(() => Math.max(...[...document.querySelectorAll('*')].map(el => el.getBoundingClientRect().right)));
    expect(widest, 'something sticks out to the right').toBeLessThanOrEqual(width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test('the quiz header has no coin and streak chips (they led to statistics in the middle of a game)', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('.quiz-v2')).toBeVisible();
  await expect(page.locator('.quiz-meta [data-stats], .quiz-meta .meta-chip')).toHaveCount(0);
});

test('the avatar on Home opens the profile, where the name can be changed', async ({ page }) => {
  await boot(page);
  await page.locator('#homeProfile').click();
  await expect(page.locator('.profile-screen h1')).toHaveText('Mijn profiel');
  await page.locator('#profileInput').fill('Noor');
  await page.locator('#profileName button').click();
  await page.locator('.panel-back').click();
  await expect(page.locator('.hud-id b')).toContainText('Noor');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await tapThroughIntro(page);
  await expect(page.locator('.hud-id b')).toContainText('Noor', { timeout: 8000 });
});

test('the row under the answers is Back / Hint / Again; Back revisits an answered question', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('#skipBtn')).toHaveCount(0);
  await expect(page.locator('#prevBtn')).toBeDisabled();
  await expect(page.locator('#hintBtn')).toBeVisible();

  const first = await page.locator('.quiz-card h1').textContent();
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await feedbackNext(page);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 2 van 10');

  // Back: the first question again, in review state with its verdict shown.
  await page.locator('#prevBtn').click();
  await expect(page.locator('.quiz-card h1')).toHaveText(first);
  await expect(page.locator('.quiz-v2')).toHaveClass(/is-review/);
  await expect(page.locator('.answer.correct')).toHaveCount(1);
  await page.locator('.answer').first().click();     // a tile reopens the explanation
  await expect(page.locator('.feedback-float')).toBeVisible();
  await page.locator('#feedbackClose').click();
  await page.locator('#nextBtn').click();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 2 van 10');
  await expect(page.locator('.quiz-v2')).not.toHaveClass(/is-review/);
});

test('closing the feedback card shows the same question again, answered', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('#worldMix').click();
  const first = await page.locator('.quiz-card h1').textContent();
  await page.locator('.answer').nth(1).click();
  await page.locator('#feedbackClose').click();
  await expect(page.locator('.feedback-float')).toHaveCount(0);
  await expect(page.locator('.quiz-card h1')).toHaveText(first);
  await expect(page.locator('.quiz-v2')).toHaveClass(/is-review/);
  await expect(page.locator('#nextBtn')).toBeVisible();
});

test('the question timer runs out into a time-out verdict and gets shorter with level', async ({ page }) => {
  // Level 6 -> 10 seconds per question.
  await boot(page, SAVED({ progress: progressAtLevel(6) }));
  await page.locator('[data-world="aarde"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('#quizTimer b')).toHaveText('10');
  await page.clock?.install?.().catch(() => {});
  await expect(page.locator('.feedback-float')).toBeVisible({ timeout: 17000 });
  await expect(page.locator('.feedback-kicker')).toContainText('TIJD IS OM!');
  await expect(page.locator('.answer.correct')).toHaveCount(1);
});

test('the timer waits until the question has been read out', async ({ page }) => {
  let release; const gate = new Promise(r => { release = r; });
  await page.route(TTS, async route => { await gate; route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(64) }); });
  await boot(page, SAVED({ voice: 'Milo', progress: progressAtLevel(6) }));
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('#quizTimer')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.locator('#quizTimer')).not.toHaveClass(/running/);
  await expect(page.locator('#quizTimer b')).toHaveText('10');
  release();   // the voice "finishes" (dummy bytes fail to decode, which counts as done)
  await expect(page.locator('#quizTimer')).toHaveClass(/running/, { timeout: 8000 });
});

test('the timer can be switched off; the six levels set seconds, allowed mistakes and difficulty', async ({ page }) => {
  await boot(page, SAVED({ timeLimitOn: false }));
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('#worldMix').click();
  await expect(page.locator('#quizTimer')).toHaveCount(0);
  const rules = await page.evaluate(() => {
    const K = window.KWIZILLO_M1;
    return [1, 2, 3, 4, 5, 6].map(n => [K.core.questionSeconds(n), K.core.maxWrong(n), K.core.difficultyCap({ niveau: n })]);
  });
  expect(rules).toEqual([[30, 6, 1], [25, 5, 2], [20, 4, 2], [16, 3, 3], [13, 2, 4], [10, 0, 4]]);
  // The parent zone offers the six levels.
  await page.locator('#qBack').click();
  await page.locator('.native-bottom-nav button[data-nav="parent"]').click();   // the gear top right is gone; "Meer" below opens the parent zone
  await expect(page.locator('[data-level]')).toHaveCount(6);
  await page.locator('[data-level="3"]').click();
  await expect(page.locator('.level-card b')).toContainText('Spelniveau 3');   // the dial is the sums game's level; worlds climb on their own
  await expect(page.locator('.level-card small')).toContainText('20 s per vraag · max. 4 fouten');
});

test('too many mistakes fail the level: the result demands the same topic again', async ({ page }) => {
  await boot(page, SAVED({ progress: progressAtLevel(6) }));   // level 6: no mistakes allowed
  await page.locator('[data-world="dieren"]').click();
  await page.locator('.world-topic').first().click();
  const topic = await page.locator('.quiz-brand small').textContent();
  await answerAll(page, 10);                  // first tile: wrong most of the time
  await expect(page.locator('.result-v2')).toHaveClass(/is-fail/);
  await expect(page.locator('.result-kicker')).toHaveText('NOG NIET GEHAALD');
  await expect(page.locator('#resultGift')).toHaveCount(0);
  await expect(page.locator('#againBtn')).toHaveText('Probeer opnieuw');
  await expect(page.locator('#retryBtn')).toHaveCount(0);
  await page.locator('#againBtn').click();
  await expect(page.locator('.quiz-brand small')).toHaveText(topic.replace(/Quiz \d+/, 'Quiz 2'));
});

test('a review question keeps Back / Hint / Again; a tile reopens the explanation', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="aarde"]').click();
  await page.locator('#worldMix').click();
  await page.locator('.answer').first().click();
  await page.locator('#feedbackClose').click();
  await expect(page.locator('.quiz-actions .action')).toHaveText([/Terug/, /Hint/, /Nog eens/]);
  await expect(page.locator('#nextBtn')).toBeVisible();
  await page.locator('.answer').nth(2).click();
  await expect(page.locator('.feedback-float')).toBeVisible();
});

for (const [label, width, height] of [['iPhone SE', 375, 667], ['iPhone 14', 390, 844], ['Pro Max', 430, 932]]) {
  test(`layout holds on ${label} without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await boot(page);

    const overflow = async () => page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth);

    await expect(page.locator('.home-world[data-world]')).toHaveCount(8);
    expect(await overflow(), 'home overflows horizontally').toBe(false);

    // The longest world title ("Geschiedeniswereld") used to push the settings
    // button past the right edge of the screen.
    await page.locator('[data-world="geschiedenis"]').click();
    await expect(page.locator('.world-topic')).toHaveCount(4);
    expect(await overflow(), 'world overflows horizontally').toBe(false);
    const back = await page.locator('#worldBack, .world-round').first().boundingBox();
    expect(back.x, 'back button clipped on the left').toBeGreaterThanOrEqual(0);
    expect(back.width, 'back button squashed').toBeGreaterThanOrEqual(40);
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
    const actions = await page.locator('.quiz-actions .action:visible').all();
    expect(actions.length).toBeGreaterThanOrEqual(2);
    for (const b of actions) {
      const box = await b.boundingBox();
      expect(box.height, 'action button too small to tap').toBeGreaterThanOrEqual(40);
      const clipped = await b.evaluate(el => el.scrollWidth > el.clientWidth + 1);
      expect(clipped, `action label clipped: ${await b.textContent()}`).toBe(false);
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
    await answerAll(page, 1, { correct: true });
  }
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-v2')).toHaveClass(/is-pass/);
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
    await feedbackNext(page);
  }
  await expect(page.locator('.result-v2')).toBeVisible();
});

test('after the fourth topic the result offers the mixed quiz', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('.world-topic').nth(3).click();
  await answerAll(page, 10, { correct: true });
  await expect(page.locator('#againBtn')).toHaveText('Start gemengde quiz');
  await page.locator('#againBtn').click();
  await expect(page.locator('.quiz-brand small')).toContainText('Gemengde quiz');
});

test('a mixed quiz result still numbers the next quiz', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="aarde"]').click();
  await page.locator('#worldMix').click();
  await answerAll(page, 10, { correct: true });
  await expect(page.locator('#againBtn')).toHaveText('Start quiz 2');
  await expect(page.locator('#retryBtn')).toHaveCount(0);
});

test('level 5 gives one hint per quiz; level 6 none; level 1 shows no counter', async ({ page }) => {
  await boot(page, SAVED({ progress: progressAtLevel(5) }));
  await page.locator('[data-world="wetenschap"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('#hintBtn .hint-count')).toHaveText('1');
  await page.locator('#hintBtn').click();
  await expect(page.locator('.hint-float')).toBeVisible();
  await page.locator('.hint-close').click();
  await expect(page.locator('#hintBtn .hint-count')).toHaveText('0');
  await expect(page.locator('#hintBtn')).toHaveClass(/spent/);
  // Reopening the same question's hint stays free; a new question has none left.
  await page.locator('#hintBtn').click();
  await expect(page.locator('.hint-float')).toBeVisible();
  await page.locator('.hint-close').click();
  await page.locator('.answer').first().click();
  await page.locator('.feedback-next').click();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Vraag 2 van 10');
  await page.locator('#hintBtn').click();
  await expect(page.locator('.hint-float')).toHaveCount(0);
  await expect(page.locator('.toast')).toHaveText('Je hints zijn op voor deze quiz.');

  await page.evaluate(() => { const K = window.KWIZILLO_M1; const P = K.progress().passed; for (let n = 1; n < 6; n++) { P[n] ||= {}; for (const k of K.TOPIC_KEYS.wetenschap) P[n]['wetenschap:' + k] = true } K.save(); K.showHome(); });
  await page.locator('[data-world="wetenschap"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('#hintBtn')).toHaveClass(/spent/);
  await page.locator('#hintBtn').click();
  await expect(page.locator('.toast')).toHaveText('Op niveau 6 zijn er geen hints.');

  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.progress().passed = {}; K.save(); K.showHome(); });
  await page.locator('[data-world="wetenschap"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('#hintBtn .hint-count')).toHaveCount(0);
});

test('on level 4 the voice still reads the question and the answers; the parent zone explains each level', async ({ page }) => {
  const spoken = [];
  // Routed before boot: Home already warms the world names, and a 503 there would switch speech off for the session.
  await page.route(TTS, route => { spoken.push(ttsPayload(route.request()).text); route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(32) }); });
  await boot(page, SAVED({ progress: progressAtLevel(4), voice: 'Milo' }));
  await page.locator('[data-world="dieren"]').click();
  // Entering the world calls out its name (after the fanfare's first beat).
  await expect.poll(() => spoken.includes('[excited] Dierenwereld!')).toBe(true);
  await page.locator('.world-topic').first().click();
  // The voice gets numbers written out ("1500" → "vijftienhonderd"), so compare with what is spoken.
  const said = await page.evaluate(() => { const K = window.KWIZILLO_M1; return K.core.spellNumbers(K.quiz.questions[0].prompt, 'nl'); });
  await expect.poll(() => spoken.includes(said)).toBe(true);
  await expect.poll(() => spoken.some(s => /^([A-D]|Aa|Bee|Cee|Dee)\.$/.test(s)), { message: 'the answers are read on level 4 too' }).toBe(true);

  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.niveau = 4; K.save(); K.showParent() });
  await expect(page.locator('.level-card small')).toHaveText('16 s per vraag · max. 3 fouten · 2 hints');
  await page.locator('[data-level="1"]').click();
  await expect(page.locator('.level-card small')).toHaveText('30 s per vraag · max. 6 fouten · hints vrij');
});

test('mascot tiles show the whole character on the name band, not zoomed in', async ({ page }) => {
  await boot(page, SAVED({ correct: 12 }));
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('mascots'));
  await expect(page.locator('.mascot-card')).toHaveCount(19);   // twelve, plus Mike and six more (shop only)
  await expect(page.locator('.mascot-card .mascot-fill')).toHaveCount(19);
  // 12 right under the old ladder (Comet 5, Pootje 12): a player from before keeps them
  await expect(page.locator('.mascot-card.unlocked')).toHaveCount(3);        // Milo, Comet, Pootje
  await expect(page.locator('.mascot-card.unlocked .mascot-name').nth(1)).toHaveText('Comet');
  await expect(page.locator('.mascot-card.locked .mascot-lock')).toHaveCount(16);
  const fill = await page.locator('.mascot-card .mascot-fill').first().boundingBox();
  const card = await page.locator('.mascot-card').first().boundingBox();
  expect(Math.abs(fill.width - card.width)).toBeLessThan(2);
  // the figure stands on the name band at 80% of the tile, with air above its head (not zoomed in)
  expect(fill.height).toBeLessThan(card.height * 0.85);
  expect(fill.height).toBeGreaterThan(card.height * 0.6);
});

test('a question whose picture would show the answer gets a related picture instead; the feedback card shows its own', async ({ page }) => {
  await boot(page);
  await page.locator('[data-world="dieren"]').click();
  await page.locator('.world-topic').first().click();
  // "Welke haai staat bekend als een snelle zwemmer?" → Makohaai: its own picture is a shark.
  await page.evaluate(() => { const K = window.KWIZILLO_M1; const q = K.quiz; q.index = q.questions.findIndex(x => x.id === 'dieren-snelle_dieren-07'); if (q.index < 0) { q.questions[0] = K.questions.find(x => x.id === 'dieren-snelle_dieren-07'); q.index = 0; } K.showQuiz(); });
  const shown = await page.locator('.quiz-art .art-main').getAttribute('src');
  const own = await page.evaluate(() => window.KWIZILLO_M1.questionArtFor('dieren-snelle_dieren-07'));
  expect(shown).not.toBe(own);
  // …maar zijn eigen vraag-only plaat: getekend bij de vraag, zonder het
  // antwoord erin (assets/questions/s/, zie answer-art.js en tools/safe-art.cjs).
  // Vóór die platen er waren leende de vraag de plaat van een buurvraag.
  expect(shown).toContain('assets/questions/s/dieren-snelle_dieren-07');
  await page.getByRole('button', { name: /Hint/ }).click();
  expect(await page.locator('.hint-visual img').getAttribute('src')).toBe(shown);
  await page.getByRole('button', { name: 'Hint sluiten' }).click();
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-art img')).toHaveAttribute('src', own);
  // An explanatory answer keeps its own picture: "Waarom zwemmen haaien altijd door?"
  await page.locator('#feedbackClose').click();
  await page.evaluate(() => { const K = window.KWIZILLO_M1; const q = K.quiz; q.questions[q.index] = K.questions.find(x => x.id === 'dieren-waterdieren-18'); delete q.answeredById[q.questions[q.index].id]; K.showQuiz(); });
  await expect(page.locator('.quiz-art .art-main')).toHaveAttribute('src', /dieren-waterdieren-18\.jpg/);
});

test('a passed quiz is worth 25 world points: four passed topics make 100, shown in statistics and the collection', async ({ page }) => {
  await boot(page, SAVED({ progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [], passed: { 1: { 'ruimte:zonnestelsel': true, 'ruimte:sterren_planeten': true }, 2: { 'ruimte:astronauten': true, 'dieren:jungle': true } } } }));
  await page.locator('.native-bottom-nav [data-nav="stats"]').click();
  const rows = page.locator('.world-stat-list article');
  await expect(rows.first()).toContainText('3 van 4 quizzen gehaald · 75 punten');
  await expect(rows.first().locator('.world-stat-best b')).toHaveText('0/10');   // best quiz, none played here
  await expect(rows.nth(1)).toContainText('1 van 4 quizzen gehaald · 25 punten');
  await page.locator('.native-bottom-nav [data-nav="collection"]').click();
  await expect(page.locator('.progress-overall')).toContainText('Totaal 100 van 800 punten');
  await expect(page.locator('.progress-world').first().locator('em')).toHaveText('75');
  // Passing the fourth space topic completes the world.
  await page.locator('.native-bottom-nav [data-nav="home"]').click();
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('.world-topic').nth(3).click();
  await answerAll(page, 10, { correct: true });
  await expect(page.locator('.result-v2')).toBeVisible();
  await page.locator('#homeBtn').click();
  await page.locator('.native-bottom-nav [data-nav="collection"]').click();
  await expect(page.locator('.progress-overall')).toContainText('Totaal 125 van 800 punten');
  await expect(page.locator('.progress-world').first()).toContainText('4 van 4 quizzen gehaald · 100 punten');
});

test('a buddy earned mid-quiz is introduced there and then, and the quiz carries on', async ({ page }) => {
  // 114 different questions right so far: the next one opens Comet, who needs 115.
  const ids = await (async () => { const { loadBanks } = require('./langs.js'); return loadBanks().banks.nl.filter(q => q.world !== 'ruimte').slice(0, 114).map(q => q.id); })();
  await boot(page, SAVED({ correct: 114, answered: 120, mascotLadder: 1280, progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: ids } }));
  await page.locator('[data-world="ruimte"]').click();
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.answer')).toHaveCount(4);
  const idx = await page.evaluate(() => {
    const q = window.KWIZILLO_M1.quiz, cur = q.questions[q.index];
    return [...document.querySelectorAll('.answer')].findIndex(b => decodeURIComponent(b.dataset.a) === cur.answer);
  });
  await page.locator('.answer').nth(idx).click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await page.locator('#feedbackNext').click();

  // The buddy comes first, with its name and how it was earned.
  await expect(page.locator('.mascot-unlock')).toBeVisible();
  await expect(page.locator('.mascot-unlock-card b')).toHaveText('Comet');
  await expect(page.locator('.mascot-unlock')).toContainText('115 goede antwoorden');

  // Tapping it away goes on to the next question, and it is not shown twice.
  await page.locator('.mascot-unlock-ok').click();
  await expect(page.locator('.mascot-unlock')).toHaveCount(0);
  await expect(page.locator('.answer')).toHaveCount(4);
  expect(await page.evaluate(() => window.KWIZILLO_M1.quiz.index)).toBe(1);
  expect(await page.evaluate(() => (window.KWIZILLO_M1.pendingUnlocks || []).length)).toBe(0);
});

// Every picture tile in the quiz is filled to its edges: no blurred copy behind
// it and no dark or faded bars above, below or beside it (build 17 still showed
// them on the phone). Checked on a phone and on an iPad-sized screen.
for (const [w, h] of [[390, 844], [820, 1180]]) {
  test(`question, hint and feedback pictures fill their whole tile (${w}×${h})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await boot(page);
    await page.locator('[data-world="dieren"]').click();
    await page.locator('#worldMix').click();
    const fills = async sel => page.locator(sel).first().evaluate(img => {
      // layout sizes, so an entrance animation's scale does not count; the frame's border does not either
      const box = img.parentElement;
      return { fit: getComputedStyle(img).objectFit, w: Math.abs(img.offsetWidth - box.clientWidth) < 2, h: Math.abs(img.offsetHeight - box.clientHeight) < 2 };
    });
    await expect(page.locator('.quiz-art img')).toHaveCount(1);
    await expect(page.locator('.quiz-art .art-main')).toBeVisible();
    expect(await fills('.quiz-art .art-main')).toEqual({ fit: 'cover', w: true, h: true });
    await page.getByRole('button', { name: /Hint/ }).click();
    expect(await fills('.hint-visual img')).toEqual({ fit: 'cover', w: true, h: true });
    await page.getByRole('button', { name: 'Hint sluiten' }).click();
    await page.locator('.answer').first().click();
    expect(await fills('.feedback-art img')).toEqual({ fit: 'cover', w: true, h: true });
  });
}

// The buddies are spread over all 1280 questions: twelve right answers no longer
// open three of them for a new player, the same question twice counts once.
test('a new player earns buddies by different questions answered right, spread up to 1280', async ({ page }) => {
  await boot(page, SAVED({ correct: 60, mascotLadder: 1280 }));
  await page.evaluate(() => window.KWIZILLO_M1.showCollection('mascots'));
  await expect(page.locator('.mascot-card.unlocked')).toHaveCount(1);        // only Milo
  await expect(page.locator('.mascot-card.locked').first()).toContainText('Nog 115 goede antwoorden');
});

// Every question's picture was checked by eye (tools/art-audit, tools/art-plan.cjs).
// The tennis-ball question used to show the topic picture (a rugby ball): its own
// picture shows the tennis ball and gives nothing away. A question whose own
// picture shows the answer gets its question-only picture or, until a new one is
// drawn, the topic picture — never a neighbour's picture.
test('the quiz shows the picture chosen for each question by eye', async ({ page }) => {
  await boot(page);
  const shown = await page.evaluate(() => {
    const K = window.KWIZILLO_M1, q = id => K.questions.find(x => x.id === id);
    return { tennis: K.quizArt(q('sport-balsporten-26')), racket: K.quizArt(q('sport-balsporten-05')), astronaut: K.quizArt(q('ruimte-astronauten-01')), topicRacket: K.TOPIC_ART[q('sport-balsporten-05').topic] };
  });
  expect(shown.tennis).toContain('assets/questions/q/sport-balsporten-26');
  expect(shown.racket).toContain('assets/questions/s/sport-balsporten-05');   // own picture shows the racket: its question-only picture (drawn 2026-10-07)
  expect(shown.racket).not.toBe(shown.topicRacket);
  expect(shown.astronaut).toContain('assets/questions/s/ruimte-astronauten-01');
});

test('Home: the worlds stand apart, "Speel ook" has its own four tiles; the game pickers carry the game name as their title', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.home')).toBeVisible();
  const order = await page.evaluate(() => [...document.querySelectorAll('.home-section, .home-worlds')].map(e => e.classList.contains('home-play') ? 'home-play' : e.className.split(' ')[0]));
  expect(order).toEqual(['home-section', 'home-worlds', 'home-section', 'home-play']);
  for (const [game, name] of [['whoami', 'Wat ben ik?'], ['fotozoom', 'Fotozoom'], ['facts', 'Weetjes']]) {
    await page.evaluate(g => window.KWIZILLO_M1.showGamePicker(g), game);
    await expect(page.locator('.panel-head h1.game-name')).toHaveText(name);
    await expect(page.locator('.panel-head .panel-kicker')).toHaveCount(0);
  }
  await page.evaluate(() => window.KWIZILLO_M1.showMemoPicker());
  await expect(page.locator('.panel-head h1.game-name')).toHaveText('Memo');
});
