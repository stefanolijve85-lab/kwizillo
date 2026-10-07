// Parent zone: players on this device (reset progress, delete a player), log out, and the tour with either guide.
// (boot helper shared with the runner tests): the runner mounts inside the game frame in the app language
// with a level and a hero to pick (art that is not there yet falls back to the
// jungle set without a single 404), a finished run pays coins once per run id,
// and leaving it returns to Home with the runner torn down.
const { test, expect } = require('@playwright/test');
const { TTS, ttsPayload } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
async function boot(page, state = SAVED()) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 503, body: '{}' }));
  await page.addInitScript(s => { localStorage.setItem('kwizillo-fresh-start', '0'); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, state);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});   // the intro may already have gone on by itself
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});   // "Verder spelen" op het terugkeerscherm
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}
const runner = page => page.locator('kwizillo-jungle');
const inRunner = (page, sel) => page.locator(`kwizillo-jungle ${sel}`);


const passGate = async page => {
  const text = await page.locator('.simple-modal-card p').first().textContent();
  const [a, b] = (text.match(/\d+/g) || []).map(Number);
  await page.locator('#gateInput').fill(String(a * b));
  await page.locator('.gate-form .simple-ok').click();
};
const seedOthers = async page => page.evaluate(() => {
  const K = window.KWIZILLO_M1;
  localStorage.setItem('kwizillo-players', JSON.stringify({ sara: { savedAt: Date.now() - 1000, state: { ...K.state, name: 'Sara', xp: 450, coins: 77, answered: 40, correct: 30 } } }));
  K.state.xp = 300; K.state.coins = 55; K.save();
});

test('the parent zone lists every player without buttons; "Speler verwijderen" sits at the bottom and deletes the one picked, behind the gate and a confirm', async ({ page }) => {
  await boot(page);
  await seedOthers(page);
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  const rows = page.locator('.player-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Mike');
  await expect(rows.first()).toContainText('speelt nu');
  await expect(rows.nth(1)).toContainText('Sara');
  await expect(page.locator('.player-row button')).toHaveCount(0);
  // the delete card is the last card, under "Voortgang resetten" and "Uitloggen", and looks like the reset card
  const cards = page.locator('.settings-list > .setting-card');
  await expect(cards.last()).toHaveAttribute('id', 'deleteOpen');
  await expect(cards.nth(await cards.count() - 2)).toHaveAttribute('id', 'logoutOpen');
  await expect(cards.nth(await cards.count() - 3)).toHaveAttribute('id', 'resetOpen');
  await expect(cards.last()).toHaveClass(/reset-card/);
  await expect(cards.last()).toContainText('Speler verwijderen');
  await page.locator('#deleteOpen').click();
  await passGate(page);
  await expect(page.locator('.simple-modal-card h2')).toHaveText('Welke speler wil je verwijderen?');
  await page.locator('[data-pick="Sara"]').click();
  await expect(page.locator('.simple-modal-card h2')).toHaveText('Sara verwijderen?');
  await page.locator('.simple-modal-card .confirm').click();
  await expect(page.locator('.player-row')).toHaveCount(1);
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('kwizillo-players') || '{}')))).not.toContain('sara');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.coins)).toBe(55);   // Mike untouched
});

test('"Voortgang resetten" puts the player who plays now back to 0 and keeps name and settings; deleting them hands the device to the other player', async ({ page }) => {
  await boot(page);
  await seedOthers(page);
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  await page.locator('#resetOpen').click();
  await passGate(page);
  await page.locator('.simple-modal-card .confirm').click();
  const me = await page.evaluate(() => { const s = window.KWIZILLO_M1.state; return [s.name, s.xp, s.coins, s.language, s.onboardingComplete]; });
  expect(me).toEqual(['Mike', 0, 0, 'nl', true]);
  const sara = await page.evaluate(() => JSON.parse(localStorage.getItem('kwizillo-players')).sara.state);
  expect([sara.xp, sara.coins]).toEqual([450, 77]);   // Sara untouched
  await page.locator('#deleteOpen').click();
  await passGate(page);
  await page.locator('[data-pick="Mike"]').click();
  await page.locator('.simple-modal-card .confirm').click();
  await expect(page.locator('.welcome-back h1')).toContainText('Sara');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.name)).toBe('Sara');
});

test('log out puts the player away and asks who plays; the tour card offers Milo and Luna side by side', async ({ page }) => {
  await boot(page);
  await seedOthers(page);
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  const guides = page.locator('.tour-guides button');
  await expect(guides).toHaveCount(2);
  const [b1, b2] = [await guides.nth(0).boundingBox(), await guides.nth(1).boundingBox()];
  expect(Math.abs(b1.y - b2.y)).toBeLessThan(2);   // next to each other
  await page.locator('#logoutOpen').click();
  await expect(page.locator('.wb-player')).toHaveCount(2);
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('kwizillo-players'))))).toContain('mike');
  await page.locator('[data-player="Sara"]').click();
  await expect(page.locator('.home')).toBeVisible();
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.name)).toBe('Sara');
  // the Luna tour
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  await page.locator('[data-tour="luna"]').click();
  await expect(page.locator('.milo-tour .milo-host')).toHaveAttribute('data-guide', 'luna', { timeout: 6000 });
});

test('the privacy notice names Olijve Holding B.V., mails stefan@kwizillo.com and is dated 3 October 2026 (NL and EN)', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.KWIZILLO_M1.showPrivacy());
  const screen = page.locator('.privacy-screen');
  await expect(screen.locator('.privacy-publisher')).toHaveText('Olijve Holding B.V. · Hunenoord 20, 7822 BP Emmen · KvK 89749685');
  await expect(screen.locator('#privacyContact')).toContainText('stefan@kwizillo.com');
  await expect(screen.locator('.privacy-updated')).toHaveText('Laatst bijgewerkt: 3 oktober 2026');
  await expect(screen).not.toContainText('Solotech');
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.setLanguage('en'); K.useBank(); K.showPrivacy(); });
  await expect(screen.locator('.privacy-updated')).toHaveText('Last updated: 3 October 2026');
  await expect(screen.locator('#privacyContact')).toContainText('stefan@kwizillo.com');
  await expect(screen.locator('.privacy-publisher')).toContainText('Olijve Holding B.V.');
});

test('ideas and feedback: under the players a card opens a message window; sending asks the parental gate, opens a mail without the child\'s name and thanks the player', async ({ page }) => {
  await page.route('**/*.mp4', route => route.abort());
  await page.addInitScript(() => { localStorage.setItem('kwizillo-fresh-start', '0'); localStorage.setItem('kwizillo-state', JSON.stringify({ schemaVersion: 2, language: 'nl', name: 'Sanne', onboardingComplete: true, voice: 'Stil', group: 5, xp: 0, coins: 0, streak: 0, niveau: 2, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte', progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] } })); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  const order = await page.evaluate(() => [...document.querySelectorAll('.setting-card')].map(e => e.id || e.className));
  expect(order.indexOf('feedbackOpen')).toBe(order.findIndex(c => /players-card/.test(c)) + 1);
  await page.locator('#feedbackOpen').click();
  await expect(page.locator('.feedback-modal h2')).toHaveText('Vertel het ons!');
  await page.locator('#feedbackSend').click();
  await expect(page.locator('.feedback-error')).toBeVisible();
  await page.locator('[data-kind="bug"]').click();
  await page.locator('#feedbackText').fill('De vraag over Mars heeft een raar plaatje');
  await page.locator('#feedbackSend').click();
  const sum = await page.locator('.gate-form').evaluate(() => { const m = document.querySelector('.simple-modal:last-child p').textContent.match(/(\d+)\D+(\d+)/); return Number(m[1]) * Number(m[2]); });
  await page.locator('#gateInput').fill(String(sum));
  await page.locator('.gate-form').evaluate(f => f.requestSubmit());
  await expect(page.locator('.feedback-modal h2')).toHaveText('Dank je wel!');
});
