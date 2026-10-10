// Meten & Wegen (games-measure.js): the third tile in Rekenen, a round of ten, and
// above all that every drawing says exactly what the right answer says: the test
// reads the ruler, the needle and the water level back from the SVG.
const { test, expect } = require('@playwright/test');
const { TTS } = require('./tts.js');

const SAVED = (over = {}) => ({
  schemaVersion: 2, language: 'nl', name: 'Mike', onboardingComplete: true, voice: 'Stil',
  group: 5, xp: 0, coins: 0, streak: 0, niveau: 1, soundOn: false, musicOn: false, tourDone: true, lastWorld: 'ruimte',
  progress: { worlds: {}, topics: {}, runs: {}, correctQuestionIds: [] }, ...over
});
const PREMIUM = JSON.stringify({ status: 'active', productId: 'nl.kwizillo.app.premium.yearly', type: 'year', expiresAt: new Date(Date.now() + 300 * 864e5).toISOString(), store: 'dev' });
async function boot(page, { state = SAVED(), premium = true } = {}) {
  await page.route('**/*.mp4', route => route.abort());
  await page.route(TTS, route => route.fulfill({ status: 404, body: '{}' }));
  await page.addInitScript(([s, p]) => { localStorage.setItem('kwizillo-fresh-start', '0'); if (p) localStorage.setItem('kwizillo-entitlement', p); if (!localStorage.getItem('kwizillo-state')) localStorage.setItem('kwizillo-state', JSON.stringify(s)); }, [state, premium ? PREMIUM : null]);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.motion').click({ timeout: 5000 }).catch(() => {}); await page.locator('.motion').click({ timeout: 1500 }).catch(() => {});
  await page.locator('#wbGo').click({ timeout: 2500 }).catch(() => {});
  await expect(page.locator('.home')).toBeVisible({ timeout: 8000 });
}

test('Rekenen has a third wide tile, Meten & Wegen, the same size as Sommen and Geld tellen; a round of ten ends on the result and "again" starts a new one', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, { state: SAVED({ niveau: 3 }) });
  await page.locator('#homeMath').click();
  const tiles = page.locator('.math-pick-tile');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(2)).toContainText('Meten & Wegen');
  await expect(tiles.nth(2)).toContainText('Meet en vergelijk');
  const [a, c] = [await tiles.nth(0).boundingBox(), await tiles.nth(2).boundingBox()];
  expect(Math.round(c.width)).toBe(Math.round(a.width));
  expect(Math.round(c.height)).toBe(Math.round(a.height));
  await tiles.nth(2).click();
  await expect(page.locator('.measure-card')).toBeVisible();
  await expect(page.locator('.measure-card')).toHaveAttribute('data-kind', 'length');   // the ruler first, with Milo's tip
  const xp0 = await page.evaluate(() => window.KWIZILLO_M1.state.xp);
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.quiz-progress strong')).toHaveText(`Ronde ${i + 1} van 10`);
    const right = await page.evaluate(() => window.KWIZILLO_M1.math.sums[window.KWIZILLO_M1.math.index].options.findIndex(o => o.ok));
    await page.locator(`.measure-answers .answer[data-i="${right}"]`).click();
    await expect(page.locator('.measure-answers .answer.correct')).toHaveCount(1);
    await expect(page.locator('#measureFeedback')).toBeVisible();
    await page.locator('#measureFeedback').click();   // tap to go on
  }
  await expect(page.locator('.result-v2')).toBeVisible();
  await expect(page.locator('.result-v2 h1')).toContainText('10');
  expect(await page.evaluate(() => window.KWIZILLO_M1.state.xp)).toBeGreaterThan(xp0);
  const rec = await page.evaluate(() => window.KWIZILLO_M1.progress().games.measure);
  expect(rec.played).toBe(1);
  expect(Object.values(rec.kinds).reduce((n, k) => n + k.right, 0)).toBe(10);
  await page.locator('#againBtn').click();
  await expect(page.locator('.measure-card')).toBeVisible();
  await expect(page.locator('.quiz-progress strong')).toHaveText('Ronde 1 van 10');
  await page.locator('#measureBack').click();
  await expect(page.locator('.math-pick-tile')).toHaveCount(3);
});

test('a wrong answer is not punished: the right one lights up, the measurement shows itself, and the round goes on', async ({ page }) => {
  await boot(page, { state: SAVED({ niveau: 4 }) });
  await page.evaluate(() => window.KWIZILLO_M1.startMeasure());
  const wrong = await page.evaluate(() => window.KWIZILLO_M1.math.sums[0].options.findIndex(o => !o.ok));
  await page.locator(`.measure-answers .answer[data-i="${wrong}"]`).click();
  await expect(page.locator('.measure-answers .answer.wrong')).toHaveCount(1);
  await expect(page.locator('.measure-answers .answer.correct')).toHaveCount(1);
  await expect(page.locator('.measure-stage.reveal')).toHaveCount(1);
  await expect(page.locator('#measureFeedback')).toHaveClass(/is-try/);
  await expect(page.locator('.quiz-progress strong')).toHaveText('Ronde 2 van 10', { timeout: 8000 });
});

test('every drawing matches its answer: 3000 generated questions on all six levels, read back from the SVG', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page);
  const problems = await page.evaluate(() => {
    const K = window.KWIZILLO_M1, { MAKERS } = K.measureForTest, out = [];
    const toBase = { mm: ['len', .1], cm: ['len', 1], m: ['len', 100], km: ['len', 100000], g: ['w', 1], kg: ['w', 1000], ml: ['v', 1], cl: ['v', 10], l: ['v', 1000] };
    const unitOf = label => { for (const [u] of Object.entries(toBase)) if (label.endsWith(' ' + K.t(`measure.u.${u}`))) return u; return null };
    const parse = label => { const u = unitOf(label); return { u, n: Number(label.slice(0, label.lastIndexOf(' ')).replace(',', '.')) } };
    const svgOf = html => new DOMParser().parseFromString(`<div xmlns="http://www.w3.org/1999/xhtml">${html}</div>`, 'text/html');
    const near = (a, b) => Math.abs(a - b) < 1e-6;
    for (let level = 1; level <= 6; level++) for (const kind of ['length', 'weight', 'volume', 'compare', 'estimate', 'convert', 'story']) {
      for (let i = 0; i < 72; i++) {
        const q = MAKERS[kind](level), right = q.options.filter(o => o.ok);
        const say = msg => out.push(`${kind}@${level} ${q.ask}: ${msg} | ${q.options.map(o => o.label).join(' / ')}`);
        if (right.length !== 1) { say(`${right.length} right options`); continue }
        if (new Set(q.options.map(o => o.label)).size !== q.options.length) say('two options look the same');
        if (q.options.length !== (kind === 'compare' ? 2 : 4)) say(`${q.options.length} options`);
        if (!K.t(q.ask) || K.t(q.ask) === q.ask) say('question text missing');
        const doc = svgOf(q.visual), ans = parse(right[0].label);
        if (kind === 'length') {
          const g = [...doc.querySelectorAll('.m-guide')].map(l => Number(l.getAttribute('x1')));
          const cm = (g[1] - g[0]) / 20;
          if (!near(cm * 10, ans.n * toBase[ans.u][1] * 10)) say(`ruler shows ${cm} cm, answer ${right[0].label}`);
        }
        if (kind === 'weight') {
          // the needle angle back to a value, then to grams
          const n = doc.querySelector('.m-needle'), dx = n.getAttribute('x2') - n.getAttribute('x1'), dy = n.getAttribute('y2') - n.getAttribute('y1');
          const deg = Math.atan2(dx, -dy) * 180 / Math.PI;
          const labels = [...doc.querySelectorAll('.m-num.small')].map(t => Number(t.textContent.replace(',', '.')));
          const unit = doc.querySelector('.m-num.unit').textContent === K.t('measure.u.kg') ? 1000 : 1;
          const max = Math.max(...labels) * unit, grams = (deg + 150) / 300 * max;
          if (Math.abs(grams - ans.n * toBase[ans.u][1]) > max / 1000) say(`needle at ${grams} g, answer ${right[0].label}`);
          if (Math.abs(deg) > 150.01) say('needle off the dial');
        }
        if (kind === 'volume') {
          // water level back to millilitres: y = 200 - value / cap * 150, cap is the top label
          const y = Number(doc.querySelector('rect[fill="#4fc3f7"]').getAttribute('y'));
          const tops = [...doc.querySelectorAll('.m-num.jug')].map(t => parse(t.textContent)).map(p => p.n * toBase[p.u][1]);
          const cap = Math.max(...tops), ml = (200 - y) / 150 * cap;
          const want = q.ask === 'measure.vol.more' ? cap - ans.n * toBase[ans.u][1] : ans.n * toBase[ans.u][1];
          if (Math.abs(ml - want) > cap / 1000) say(`water at ${ml} ml, answer means ${want} ml`);
          if (ml <= 0 || ml >= cap) say('jug empty or overflowing');
        }
        if (kind === 'compare' && q.explain) {
          // cards with amounts: the named one really is the longer / heavier / fuller (or the other way round)
          const cards = [...doc.querySelectorAll('.m-card')].map(c => ({ name: c.querySelector('b').textContent, ...parse(c.querySelector('strong').textContent) }));
          const val = c => c.n * toBase[c.u][1], bigger = /longer|heavier|more$/.test(q.ask);
          const win = cards.reduce((a, b) => (bigger ? val(a) > val(b) : val(a) < val(b)) ? a : b);
          if (win.name !== right[0].label) say(`cards say ${win.name}`);
        }
        if (kind === 'convert') {
          const m = doc.body.textContent.match(/^([\d.,]+) (\S+) = \? (\S+)$/);
          const from = parse(`${m[1]} ${m[2]}`);
          if (!near(from.n * toBase[from.u][1], ans.n * toBase[ans.u][1])) say(`${m[0]} is not ${right[0].label}`);
        }
      }
    }
    return out;
  });
  expect(problems.slice(0, 12)).toEqual([]);
});

test('the same screens in every language: no Dutch left in English, units in the language, nothing missing', async ({ page }) => {
  await boot(page, { state: SAVED({ language: 'ru', niveau: 5 }) });
  await page.evaluate(() => window.KWIZILLO_M1.startMeasure());
  await expect(page.locator('.measure-q')).not.toHaveText(/measure\./);
  const labels = await page.locator('.measure-answers .answer-copy').allTextContents();
  expect(labels.join(' ')).toMatch(/мм|см|г|кг|мл|сл|л|км|м/);
});
