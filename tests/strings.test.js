// Every offered language carries exactly the same keys as Dutch. A missing key
// falls back to Dutch at runtime, which looks like a bug in the middle of an
// otherwise translated screen, and a key too many is dead weight.
const assert = require('assert');
const { LANGS, i18n } = require('./langs.js');

const K = i18n();
const S = K.strings;
const base = Object.keys(S.nl).sort();
const identical = {};

assert.strictEqual(K.LANGUAGES.map(l => l.id).join(','), LANGS.join(','), 'registry and test list agree');

for (const lang of LANGS) {
  assert.ok(S[lang], `${lang}: no string table`);
  const keys = Object.keys(S[lang]).sort();
  const missing = base.filter(k => !S[lang][k] && S[lang][k] !== '');
  const extra = keys.filter(k => !(k in S.nl));
  assert.strictEqual(missing.join(','), '', `${lang}: missing ${missing.length} keys, first: ${missing.slice(0, 6)}`);
  assert.strictEqual(extra.join(','), '', `${lang}: unknown keys ${extra.slice(0, 6)}`);

  // The speech locale must be the language itself: a Dutch voice reading German is the bug
  // this catches.
  assert.strictEqual(S[lang]['lang.speech'], lang, `${lang}: lang.speech is ${S[lang]['lang.speech']}`);
  // Placeholders must survive translation, or a screen shows "{name}" or loses a number.
  for (const key of base) {
    const holders = t => [...String(t).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
    assert.strictEqual(holders(S[lang][key]).join(','), holders(S.nl[key]).join(','), `${lang}/${key}: placeholders differ`);
  }
  // A table that was copied instead of translated must fail. Single strings may
  // legitimately match — Dutch and German share words like "Astronauten" and
  // "Salto", and Dutch borrows "Hint" and "coins" from English — so the check is on
  // the share of the table, not on individual keys.
  if (lang === 'nl') continue;
  const same = base.filter(k => S[lang][k] === S.nl[k]);
  const share = same.length / base.length;
  assert.ok(share < 0.15, `${lang}: ${Math.round(share * 100)}% of the strings are still identical to Dutch (${same.slice(0, 8)})`);
  identical[lang] = same.length;
}

console.log(`strings: ${LANGS.length} languages × ${base.length} keys, in parity ✔`);
console.log('strings: keys identical to Dutch — ' + Object.entries(identical).map(([l, n]) => `${l} ${n}`).join(', '));
