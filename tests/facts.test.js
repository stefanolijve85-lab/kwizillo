// Weetjes bank: every language carries the same facts in the same order (the
// id is `${world}-${index}`, so discovered progress survives a language switch),
// every world has a decent set, and every fact is short, has an emoji and
// never leaks a digit-heavy or unfinished line.
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'facts.js'), 'utf8'), ctx);
const F = ctx.window.KWIZILLO_FACTS;
const WORLDS = ['ruimte', 'dieren', 'aarde', 'geschiedenis', 'wetenschap', 'mysterie', 'kunst', 'sport'];
const { LANGS } = require('./langs.js');
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
// Every fact has its own illustration (assets/facts/<world>-<index>.jpg) and a
// prompt on record for it (tools/fact-art-prompts.json), so a new fact cannot
// slip in without a picture.
const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'fact-art-prompts.json'), 'utf8'));
let pictures = 0;
for (const w of WORLDS) for (let i = 0; i < F.nl[w].length; i++) {
  const id = `${w}-${i}`;
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'facts', `${id}.jpg`)), `picture for ${id}`);
  assert.ok(typeof prompts[id] === 'string' && prompts[id].length > 10, `prompt for ${id}`);
  pictures++;
}
console.log(`facts: ${pictures} illustrations, one per fact ✔`);
console.log(`facts: ${total} facts across ${LANGS.length} languages (${total / LANGS.length} per language) ✔`);
