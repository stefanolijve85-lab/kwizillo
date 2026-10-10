// The languages the app offers, read from the one place that defines them, plus
// the question files that belong to each. A language in the registry without its
// bank, its facts or its strings must fail the tests, so this list is the gate
// for every new language.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

const stringsFiles = () => fs.readdirSync(ROOT).filter(f => /^strings-[a-z]{2,4}\.js$/.test(f)).sort();

function i18n() {
  const ctx = { window: {}, document: { documentElement: {} } };
  vm.createContext(ctx);
  ctx.window.KWIZILLO_M1 = { state: { language: 'nl' }, save() {} };
  // The languages added after the first three bring their own table.
  for (const f of stringsFiles()) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8'), ctx);
  return ctx.window.KWIZILLO_M1;
}

const LANGS = i18n().LANGUAGES.map(l => l.id);
// Dutch was first and kept the plain names; every other language is suffixed.
// questions-more*.js is the layer tools/content-build.cjs writes from content/;
// it only exists once a question has been translated into every language, so it
// is loaded when it is there and skipped while it is not.
const moreFile = lang => lang === 'nl' ? 'questions-more.js' : `questions-more-${lang}.js`;
const bankFiles = lang => [
  lang === 'nl' ? 'questions-extra.js' : `questions-extra-${lang}.js`,
  ...(fs.existsSync(path.join(ROOT, moreFile(lang))) ? [moreFile(lang)] : []),
  lang === 'nl' ? 'questions.js' : `questions-${lang}.js`,
];

// All banks in one context, extras before the base files that consume them.
function loadBanks() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of LANGS.flatMap(bankFiles)) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  const banks = {};
  for (const lang of LANGS) banks[lang] = ctx.window[`KWIZILLO_QUESTIONS_${lang.toUpperCase()}`];
  return { ctx, banks };
}

module.exports = { LANGS, i18n, loadBanks, bankFiles, moreFile, stringsFiles, ROOT };
