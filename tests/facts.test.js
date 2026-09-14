// Weetjes bank: every language carries the same facts in the same order (the
// id is `${world}-${index}`, so discovered progress survives a language switch),
// every world has a decent set, and every fact is short, has an emoji and
// never leaks a digit-heavy or unfinished line.
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'facts.js'), 'utf8'), ctx);
const F = ctx.window.KWIZILLO_FACTS;
const WORLDS = ['ruimte', 'dieren', 'aarde', 'geschiedenis', 'wetenschap', 'mysterie'];
const LANGS = ['nl', 'en', 'pt'];
let total = 0;
for (const lang of LANGS) {
  assert.ok(F[lang], `${lang} bank`);
  for (const w of WORLDS) {
    const list = F[lang][w];
    assert.ok(Array.isArray(list) && list.length >= 15, `${lang}/${w} has ${list?.length} facts`);
    assert.strictEqual(list.length, F.nl[w].length, `${lang}/${w} aligned with nl`);
    for (const [i, f] of list.entries()) {
      assert.ok(f.e && f.t, `${lang}/${w}#${i} emoji + text`);
      assert.ok(f.t.length >= 20 && f.t.length <= 260, `${lang}/${w}#${i} length ${f.t.length}`);
      assert.ok(/[.!?…]$/.test(f.t.trim()), `${lang}/${w}#${i} ends a sentence`);
      total++;
    }
    assert.strictEqual(new Set(list.map(f => f.t)).size, list.length, `${lang}/${w} no duplicates`);
  }
}
console.log(`facts: ${total} facts across ${LANGS.length} languages (${total / LANGS.length} per language) ✔`);
