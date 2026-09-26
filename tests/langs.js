// The languages the app offers, read from the one place that defines them, plus
// the question files that belong to each. A language in the registry without its
// bank, its facts or its strings must fail the tests, so this list is the gate
// for every new language.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function i18n() {
  const ctx = { window: {}, document: { documentElement: {} } };
  vm.createContext(ctx);
  ctx.window.KWIZILLO_M1 = { state: { language: 'nl' }, save() {} };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8'), ctx);
  return ctx.window.KWIZILLO_M1;
}

const LANGS = i18n().LANGUAGES.map(l => l.id);
// Dutch was first and kept the plain names; every other language is suffixed.
const bankFiles = lang => lang === 'nl'
  ? ['questions-extra.js', 'questions.js']
  : [`questions-extra-${lang}.js`, `questions-${lang}.js`];

// All banks in one context, extras before the base files that consume them.
function loadBanks() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of LANGS.flatMap(bankFiles)) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  const banks = {};
  for (const lang of LANGS) banks[lang] = ctx.window[`KWIZILLO_QUESTIONS_${lang.toUpperCase()}`];
  return { ctx, banks };
}

module.exports = { LANGS, i18n, loadBanks, bankFiles, ROOT };
