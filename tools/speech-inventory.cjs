#!/usr/bin/env node
// Counts every line the app can ever say, per language and per voice, and how
// much of it the voice proxy already has in .tts-cache. Once the production
// server runs cache-only, a line that is not on this list is a line the child
// never hears, so this is the list to warm.
//
//   node tools/speech-inventory.cjs                       # the table
//   node tools/speech-inventory.cjs --json                # also writes audio-qa-output/speech-inventory.json
//   node tools/speech-inventory.cjs --json lines.json     # ... or to a file of your choice
//   node tools/speech-inventory.cjs --lang nl,en          # only these languages
//
// Read-only: it never calls ElevenLabs or the proxy, it only looks at the files
// in .tts-cache. Rekenen (games-math.js) says its sums in pieces from a closed
// set; that list comes from tools/math-speech.cjs.
//
// The cache key, model, voices and settings come from speech-config.js, the
// same module server.js uses:
//   sha256(`${MODEL}|${lang}|${voiceId}|${JSON.stringify(settings)}|${text}`)
// where text is what the client sent (K.core.spellNumbers already applied, see
// m1-runtime.js fetchVoiceBlobNow / speechUrl), trimmed and cut to 2500
// characters by the /api/tts route, and stripped of [audio tags] for every
// model except eleven_v3. MODEL and VOICE_SETTINGS are replicated below from
// server.js (lines ~45 and ~415), the voice ids come from
// .voice-selection-v35.json. server.js itself is not required: it would start
// listening. If either changes there, change it here too.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const core = require('../quiz-core-v2.js');
const { LANGS, ROOT } = require('../tests/langs.js');
const { linesFor, banks, i18n: K, t } = require('./warm-speech.cjs');
const { mathLines } = require('./math-speech.cjs');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const langs = String(opt('lang', LANGS.join(','))).split(',').map(s => s.trim()).filter(l => LANGS.includes(l));
const jsonOut = argv.includes('--json') ? opt('json', path.join(ROOT, 'audio-qa-output', 'speech-inventory.json')) : null;
// --files <path>: the cache file names the app needs (one per line), for
// rsync --files-from, so the server gets this set and not every old take.
const filesOut = argv.includes('--files') ? opt('files', path.join(ROOT, 'audio-qa-output', 'speech-files.txt')) : null;
const VOICES = ['Milo', 'Luna'];

/* ---------------- the server's key, replicated ---------------- */

// server.js loadEnvFile(): KEY=value lines from .env, the environment wins.
// Only the settings that change the key are read; the rest is speech-config.js.
const env = { ...process.env };
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.trim().match(/^(ELEVENLABS_MODEL|MILO_SPEED|LUNA_SPEED)\s*=\s*(.*)$/);
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (e) { /* no .env: defaults */ }
const SPEECH = require('../speech-config.js').speechConfig(env);
const MODEL = SPEECH.model, VOICE_SETTINGS = SPEECH.settings;
const CACHE_DIR = path.join(ROOT, '.tts-cache');
const cached = new Set(fs.existsSync(CACHE_DIR) ? fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : []);

// What the server ends up sending to ElevenLabs for what the app asks.
const spoken = (text, lang) => SPEECH.spoken(SPEECH.clean(core.spellNumbers(String(text), lang).trim().slice(0, 2500)), lang);
const keyFor = (text, lang, voice) => SPEECH.voiceId(lang, voice) ? SPEECH.cacheKey(text, lang, voice) : null;

/* ---------------- the app's data, as the browser has it ---------------- */

// Worlds and topics live in m1-runtime.js, which needs a DOM; the two literals are lifted out.
const runtime = fs.readFileSync(path.join(ROOT, 'm1-runtime.js'), 'utf8');
const lift = re => vm.runInNewContext(`(${runtime.match(re)[1]})`);
const WORLDS = lift(/K\.WORLDS=(\[[^\]]*\]);/);
const TOPIC_KEYS = lift(/K\.TOPIC_KEYS=(\{[^;]*\});/);
// m1-runtime.js K.playableWorlds: every topic of the world has questions.
const playableWorlds = lang => {
  const have = new Set((banks[lang] || []).map(q => `${q.world}/${q.topic}`));
  return WORLDS.filter(w => (TOPIC_KEYS[w] || []).every(tp => have.has(`${w}/${tp}`)));
};

// answer-art.js decides which questions Memo, Wat ben ik? and Fotozoom may use.
const art = { window: { KWIZILLO_M1: { banks } } };
vm.createContext(art);
for (const f of ['question-art.js', 'answer-art.js', 'facts.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), art);
const answerArtFor = art.window.KWIZILLO_M1.answerArtFor;
const FACTS = art.window.KWIZILLO_FACTS;

/* ---------------- every line ---------------- */

// inventory[lang][voice] = Map(text -> {sources:Set})
const inventory = {};
const add = (lang, voices, raw, source) => {
  if (!raw) return;
  const text = spoken(raw, lang);
  if (!text) return;
  for (const voice of voices) {
    const m = inventory[lang][voice];
    if (!m.has(text)) m.set(text, { sources: new Set() });
    m.get(text).sources.add(source);
  }
};
const BOTH = VOICES;            // K.speak: the voice the child chose
const MILO = ['Milo'], LUNA = ['Luna'];

// games-whoami.js / games-fotozoom.js: the same filters, word for word.
const articles = answer => answer.replace(/^(de|het|een|the|a|an|o|a|os|as|um|uma)\s+/i, '');
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, m => '\\' + m);
const wordRe = answer => new RegExp('(^|[^\\p{L}])' + escapeRe(articles(answer)) + '(?=$|[^\\p{L}])', 'giu');
const mask = (text, answer) => { const out = text.replace(wordRe(answer), (m, pre) => pre + '…'); return out.replace(/…/g, '').trim().length >= 6 ? out : null };
const cluesFor = q => [q.hint, q.fact, q.explanation].map(c => c && mask(c, q.answer)).filter(Boolean).slice(0, 3);
const NOT_YESNO = /^(ja|nee|yes|no|sim|não|waar|niet waar|true|false)$/i;
const whoamiCandidates = qs => qs.filter(q => answerArtFor(q) && /^\D{2,}$/.test(q.answer) && q.answer.split(' ').length <= 2 && q.hint && q.explanation && wordRe(q.answer).test(q.explanation) && !NOT_YESNO.test(q.answer));
const fotozoomCandidates = qs => qs.filter(q => answerArtFor(q) && /^\D{2,}$/.test(q.answer) && q.answer.split(' ').length <= 2 && q.explanation && wordRe(q.answer).test(q.explanation) && !NOT_YESNO.test(q.answer));

for (const lang of langs) {
  inventory[lang] = { Milo: new Map(), Luna: new Map() };
  const T = (key, params) => t(lang, key, params);
  const qs = banks[lang] || [];
  const worlds = playableWorlds(lang);

  // Quiz (quiz-visual-v2.js readQuestion / showHint / feedback), the lists warm-speech.cjs warms.
  for (const line of linesFor(lang, 1)) add(lang, BOTH, line, 'quiz: question, hint, verdicts, explanation, praise');
  for (const line of linesFor(lang, 2)) add(lang, BOTH, line, 'quiz: answers A-D');

  // Gold card on mastering a world (quiz-visual-v2.js goldUnlock).
  for (const w of worlds) add(lang, BOTH, T('result.goldCardSpeech', { world: T(`world.${w}.title`) }), 'quiz: gold card');

  // Weetjes (facts-ui.js factSpeech): every fact plain ("next fact") and with
  // the kicker (the first fact on the screen, the result screen's bonus fact,
  // the fact warmed on Home).
  const facts = FACTS[lang] || FACTS.nl || {};
  for (const w of WORLDS) for (const f of facts[w] || []) {
    add(lang, BOTH, f.t, 'facts: fact');
  }
  add(lang, BOTH, T('facts.kicker'), 'facts: kicker');

  // World entry (m1-ui.js enterWorld).
  for (const w of worlds) add(lang, BOTH, T('world.speech.enter', { title: T(`world.${w}.title`) }), 'world: enter');

  // Memo (games-memo.js): a turned card says its answer; any question with an
  // answer picture can be on the board (the "fill" pairs have no further filter).
  for (const q of qs) if (answerArtFor(q)) add(lang, BOTH, core.answerText(q.answer), 'memo: card');
  for (const k of ['done', 'time', 'tie', 'win']) add(lang, BOTH, T(`memo.speech.${k}`), 'memo: result');

  // Wat ben ik? (games-whoami.js): clues one by one, "Wat ben ik?", the four names, then yes/almost + explanation.
  const whoPool = whoamiCandidates(qs).filter(q => cluesFor(q).length >= 2);
  for (const q of whoPool) {
    for (const c of cluesFor(q)) add(lang, BOTH, c, 'whoami: clue');
    add(lang, BOTH, core.answerText(q.answer), 'whoami/fotozoom: option');
    for (const k of ['whoami.speech.yes', 'whoami.speech.almost']) for (const s of core.answerSegments(T(k), q.answer)) add(lang, BOTH, s.text, 'whoami: verdict pieces');
    add(lang, BOTH, q.explanation, 'whoami/fotozoom: explanation');
  }
  for (const k of ['whoami.speech.great', 'whoami.speech.done']) add(lang, BOTH, T(k), 'whoami: fixed');
  add(lang, ['Milo'], T('whoami.speech.ask'), 'whoami: fixed');
  add(lang, ['Luna'], T('whoami.speech.askLuna'), 'whoami: fixed');   // Luna has her own take (games-whoami.js askLine)

  // Fotozoom (games-fotozoom.js).
  for (const q of fotozoomCandidates(qs)) {
    add(lang, BOTH, core.answerText(q.answer), 'whoami/fotozoom: option');
    for (const k of ['fotozoom.speech.yes', 'fotozoom.speech.almost']) for (const s of core.answerSegments(T(k), q.answer)) add(lang, BOTH, s.text, 'fotozoom: verdict pieces');
    add(lang, BOTH, q.explanation, 'whoami/fotozoom: explanation');
  }
  for (const k of ['fotozoom.speech.ask', 'fotozoom.speech.great', 'fotozoom.speech.done']) add(lang, BOTH, T(k), 'fotozoom: fixed');

  // Each guide's hello is only ever said in that guide's own voice
  // (m1-ui.js sound panel, onboarding.js takeOver via K.guideSay).
  add(lang, MILO, T('voice.milo.hello'), 'voice: hello');
  add(lang, LUNA, T('voice.luna.hello'), 'voice: hello');

  // Onboarding (onboarding.js shell -> host.say -> K.guideSay). Steps 1-4 are
  // hosted by Milo whatever voice is set; the guide step and the welcome by the
  // active guide (Milo, or Luna once she was picked). Where a lip-synced clip
  // exists (guide-talks.js) the clip plays instead, but the line is still
  // prefetched and is the fallback when the clip fails, so it is counted.
  for (const k of ['language', 'name', 'age', 'group']) add(lang, MILO, T(`onboarding.speech.${k}`), 'onboarding');
  for (const k of ['voice', 'welcome']) add(lang, BOTH, T(`onboarding.speech.${k}`), 'onboarding');

  // Home tour (milo.js TOUR_KEYS / startTour), by the active guide.
  for (const k of ['mega', 'worlds', 'games', 'hud', 'nav', 'done']) add(lang, BOTH, T(`tour.${k}`), 'tour');

  // Rekenen: numbers, operators and the fixed words of its lines, in pieces.
  for (const line of mathLines(lang, k => T(k))) add(lang, BOTH, line, 'math: pieces');
}

/* ---------------- self-check: did a call site appear that this list does not know? ---------------- */

// The speaking call sites per file when this tool was written (2026-10-01).
// A different count means the app gained or lost a line source: re-read that
// file and update the inventory above.
const CALL_RE = /\bK\.(speak|speakSequence|prefetchSpeech|guideSay|guidePrefetch|miloSay|miloPrefetch|warmTour)\b\??\.?\s*\(|\bhost\.say\(/g;
const EXPECTED = {
  'facts-ui.js': 2, 'games-fotozoom.js': 4, 'games-memo.js': 5, 'games-whoami.js': 4,
  'm1-ui.js': 11, 'milo.js': 9, 'onboarding.js': 8, 'quiz-visual-v2.js': 7,
};
const SKIP = new Set(['server.js', 'games-math.js', 'm1-runtime.js', 'playwright.config.js']);
const drift = [];
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.js') && !SKIP.has(f) && !/^(questions|strings-)/.test(f)).sort()) {
  const n = (fs.readFileSync(path.join(ROOT, f), 'utf8').match(CALL_RE) || []).length;
  if (n !== (EXPECTED[f] || 0)) drift.push(`${f}: ${n} speech call(s), the inventory was written for ${EXPECTED[f] || 0}`);
}

/* ---------------- report ---------------- */

const fmt = n => n.toLocaleString('en-US');
const pad = (s, n, left = false) => left ? String(s).padEnd(n) : String(s).padStart(n);
const row = cells => cells.map((c, i) => pad(c, i < 2 ? 5 : 11, i < 2)).join(' ');
console.log(`model ${MODEL}, settings Milo ${JSON.stringify(VOICE_SETTINGS.Milo)} Luna ${JSON.stringify(VOICE_SETTINGS.Luna)}`);
console.log(`.tts-cache: ${fmt(cached.size)} clip(s). Rekenen (games-math.js) not included.\n`);
console.log(row(['lang', 'voice', 'lines', 'chars', 'cached ln', 'cached ch', 'missing ln', 'missing ch']));
const total = { lines: 0, chars: 0, cl: 0, cc: 0 };
const bySource = new Map();
const dump = { model: MODEL, generated: new Date().toISOString(), settings: VOICE_SETTINGS, langs: {} };
for (const lang of langs) {
  dump.langs[lang] = {};
  for (const voice of VOICES) {
    let lines = 0, chars = 0, cl = 0, cc = 0;
    const list = [];
    for (const [text, info] of inventory[lang][voice]) {
      const key = keyFor(text, lang, voice);
      const hit = !!key && cached.has(key);
      lines++; chars += text.length;
      if (hit) { cl++; cc += text.length }
      const src = [...info.sources][0];
      const s = bySource.get(src) || { lines: 0, chars: 0, missing: 0 };
      s.lines++; s.chars += text.length; if (!hit) s.missing += text.length;
      bySource.set(src, s);
      list.push({ text, chars: text.length, key, cached: hit, sources: [...info.sources] });
    }
    dump.langs[lang][voice] = list;
    total.lines += lines; total.chars += chars; total.cl += cl; total.cc += cc;
    console.log(row([lang, voice, fmt(lines), fmt(chars), fmt(cl), fmt(cc), fmt(lines - cl), fmt(chars - cc)]));
  }
}
console.log(row(['all', '', fmt(total.lines), fmt(total.chars), fmt(total.cl), fmt(total.cc), fmt(total.lines - total.cl), fmt(total.chars - total.cc)]));

console.log('\nBy source (a line shared by two sources counts under the first; all languages and voices):');
for (const [src, s] of [...bySource].sort((a, b) => b[1].chars - a[1].chars)) {
  console.log(`  ${pad(src, 52, true)} ${pad(fmt(s.lines), 8)} lines ${pad(fmt(s.chars), 11)} chars ${pad(fmt(s.missing), 11)} missing`);
}

console.log('\nUNBOUNDED (lines with a parameter that cannot be listed):');
console.log('  none. The child\'s name is never spoken (onboarding.welcome.title and the');
console.log('  Memo duel winner stay on screen only); every other parameter is a world title or a question\'s answer.');
console.log('  Rekenen (games-math.js) speaks only pieces from the closed set in tools/math-speech.cjs.');

if (drift.length) {
  console.log('\nWARNING, speech call sites changed since this inventory was written:');
  for (const d of drift) console.log(`  ${d}`);
}

if (jsonOut) {
  fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
  fs.writeFileSync(jsonOut, JSON.stringify(dump, null, 1));
  console.log(`\nLine lists written to ${path.relative(process.cwd(), jsonOut) || jsonOut}`);
}

if (filesOut) {
  const names = new Set();
  for (const lang of Object.keys(dump.langs || {})) for (const voice of Object.keys(dump.langs[lang])) for (const l of dump.langs[lang][voice]) if (l.cached) names.add(`${l.key}.mp3`);
  fs.mkdirSync(path.dirname(filesOut), { recursive: true });
  fs.writeFileSync(filesOut, [...names].join('\n') + '\n');
  console.log(`\n${names.size} cache file(s) listed in ${path.relative(process.cwd(), filesOut) || filesOut}`);
}
