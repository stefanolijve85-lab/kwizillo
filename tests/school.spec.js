// Kwizillo voor scholen, end to end: a teacher activates the account through the
// invite, makes a class and adds pupils, the login cards show their pictures; a
// pupil logs in on the school site with the class code, the name and the three
// pictures, plays with Premium from the licence, the progress reaches the
// teacher's overview, comes back after a reload, and the pupil logs out. Runs
// its own server (port 8131) with a temporary database.
const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');

const PORT = 8131, BASE = `http://127.0.0.1:${PORT}`;
const DB = path.join(os.tmpdir(), `kwizillo-school-test-${process.pid}.db`);
let server, invite;

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => {
  for (const f of [DB, DB + '-wal', DB + '-shm']) fs.rmSync(f, { force: true });
  const store = require('../school/store.cjs').open(DB);
  const school = store.createSchool('Montessorischool Emmen', 30, '2099-07-31');
  invite = store.inviteTeacher(school, 'juf@school.nl', 'Juf Anna');
  store.db.close();
  server = spawn(process.execPath, ['--no-warnings', 'server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(PORT), SCHOOL_DB: DB, SCHOOL_INSECURE_COOKIES: '1', TTS_CACHE_ONLY: '1' }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { if ((await fetch(BASE + '/')).ok) return } catch (e) {} await new Promise(r => setTimeout(r, 200)) }
  throw new Error('school test server did not start');
});
test.afterAll(() => { server?.kill(); for (const f of [DB, DB + '-wal', DB + '-shm']) fs.rmSync(f, { force: true }) });

let code, sam;
test('a teacher activates the account, makes a class and adds pupils with login cards', async ({ page }) => {
  await page.goto(`${BASE}/leraar/#uitnodiging=${invite}`);
  await page.locator('#pw').fill('een-goed-wachtwoord');
  await page.locator('#pw2').fill('een-goed-wachtwoord');
  await page.getByRole('button', { name: 'Account activeren' }).click();
  await expect(page.locator('h1')).toHaveText('Jouw klassen');
  await expect(page.locator('.licence')).toContainText('0 van 30 leerlingplaatsen');
  await page.locator('#cn').fill('Groep 5');
  await page.getByRole('button', { name: 'Klas maken' }).click();
  await expect(page.locator('h1')).toHaveText('Groep 5');
  code = (await page.locator('.bigcode').textContent()).trim();
  expect(code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
  await page.locator('#names').fill('Sam B.\nNoor K.');
  await page.getByRole('button', { name: /Toevoegen/ }).click();
  await expect(page.locator('.login-card')).toHaveCount(2);
  const card = page.locator('.login-card', { hasText: 'Sam B.' });
  sam = (await card.getAttribute('data-pictures')).split(',').map(Number);
  await expect(card.locator('figure img')).toHaveCount(3);
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody tr', { hasText: 'Sam B.' })).toContainText('nog niet');
});

test('a pupil logs in with code, name and pictures, plays with the school licence, and the teacher sees the progress', async ({ page, browser }) => {
  await page.addInitScript(() => localStorage.setItem('kwizillo-fresh-start', '0'));
  await page.route('**/*.mp4', r => r.abort());
  await page.goto(`${BASE}/?school=1`);
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await expect(page.locator('.school-login[data-step="code"]')).toBeVisible({ timeout: 8000 });
  await page.locator('#schoolCode').fill('XXXXXX');
  await page.locator('#schoolNext').click();
  await expect(page.locator('.school-error')).toContainText('klascode');
  await page.locator('#schoolCode').fill(code.toLowerCase());
  await page.locator('#schoolNext').click();
  await expect(page.locator('.school-names button')).toHaveCount(2);
  await page.locator('.school-names button', { hasText: 'Sam B.' }).click();
  // a wrong code first
  for (const i of sam.map(x => (x + 1) % 9)) await page.locator(`[data-pic="${i}"]`).click();
  await expect(page.locator('.school-error')).toContainText('niet jouw plaatjes');
  for (const i of sam) await page.locator(`[data-pic="${i}"]`).click();
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  await page.locator('.milo-tour-skip').click({ timeout: 4000 }).catch(() => {});
  expect(await page.evaluate(() => [window.KWIZILLO_M1.state.name, window.KWIZILLO_M1.state.onboardingComplete, window.KWIZILLO_M1.premium.isPremium()])).toEqual(['Sam B.', true, true]);
  // play: the progress is sent two seconds after the last save
  await page.evaluate(() => { const K = window.KWIZILLO_M1; K.state.answered = 7; K.state.correct = 5; K.state.quizzesPlayed = 1; K.save() });
  const teacher = await browser.newPage();
  await teacher.goto(`${BASE}/leraar/`);
  await teacher.locator('#em').fill('juf@school.nl'); await teacher.locator('#pw').fill('een-goed-wachtwoord');
  await teacher.getByRole('button', { name: 'Inloggen' }).click();
  await teacher.locator('.class-tile').first().click();
  await expect.poll(async () => { await teacher.locator('#back').click(); await teacher.locator('.class-tile').first().click(); return teacher.locator('tbody tr', { hasText: 'Sam B.' }).innerText() }, { timeout: 15000 })
    .toMatch(/\t7\t71%\t1\t/);
  // after a reload the child is still logged in and gets the progress from the server
  await page.evaluate(() => localStorage.removeItem('kwizillo-state'));
  await page.reload();
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.answered)).toBe(7);
  // log out in the profile: the next child gets the login
  await page.evaluate(() => window.KWIZILLO_M1.showProfile());
  await expect(page.locator('.school-out')).toContainText('Sam B. · Groep 5');
  await page.locator('#schoolLogout').click();
  await expect(page.locator('.school-login[data-step="code"]')).toBeVisible();
  expect(await page.evaluate(() => [localStorage.getItem('kwizillo-school'), window.KWIZILLO_M1.state.name])).toEqual([null, '']);
});

test('the parent zone hides what the school arranges; the normal site has no school mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kwizillo-fresh-start', '0'));
  await page.goto(`${BASE}/?school=1`);
  await page.evaluate(() => window.KWIZILLO_M1.showParent());
  for (const sel of ['#premiumOpen', '.players-card', '#logoutOpen', '#deleteOpen', '#resetOpen']) await expect(page.locator(sel)).toBeHidden();
  await page.goto(`${BASE}/?school=0`);
  expect(await page.evaluate(() => [window.KWIZILLO_M1.school.on, document.documentElement.dataset.school || null])).toEqual([false, null]);
});
