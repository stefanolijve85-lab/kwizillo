// What a teacher sees on the page of one pupil (leraar/, "Leerling"): per world
// and per topic how many questions were answered and how many right, which
// topics were passed, Rekenen and Talen. Read from the game state the pupil's
// own game saved (state.js); nothing is stored for this page.
//
// The names of the worlds, topics and Talen themes come from the game itself
// (i18n.js, m1-runtime.js), in Dutch, read once at start: a world or topic added
// to the game shows up here without a change in this file.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

function loadGame() {
  const ctx = { document: { documentElement: {} }, navigator: { language: 'nl' }, localStorage: { getItem: () => null, setItem() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext('window.KWIZILLO_M1={state:{language:"nl"},save(){}};', ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8'), ctx);
  const K = ctx.KWIZILLO_M1;
  const src = fs.readFileSync(path.join(ROOT, 'm1-runtime.js'), 'utf8');
  const worlds = vm.runInNewContext(/K\.WORLDS=(\[[^\]]*\]);/.exec(src)[1]);
  const topics = vm.runInNewContext('(' + /K\.TOPIC_KEYS=(\{[^;]*\});/.exec(src)[1] + ')');
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'talen-data.js'), 'utf8'), ctx);
  const label = (key, fallback) => { const s = K.t(key); return s && s !== key ? s : fallback };
  return {
    worlds: worlds.map(w => ({ id: w, title: label(`world.${w}.title`, w), topics: (topics[w] || []).map(t => ({ key: t, label: label(`topic.${t}`, t) })) })),
    talen: (K.TALEN?.themes || []).map(t => ({ id: t.id, label: label(`talen.theme.${t.id}`, t.id), words: t.words.length })),
  };
}
let GAME = null;
const game = () => GAME || (GAME = loadGame());

const LANGS = { nl: 'Nederlands', en: 'Engels', de: 'Duits', fr: 'Frans', es: 'Spaans', it: 'Italiaans', pt: 'Portugees', da: 'Deens', ru: 'Russisch', ar: 'Arabisch' };
const n = v => Number(v || 0);

function detail(s) {
  const G = game(), p = s?.progress || {};
  const passedAny = key => Object.values(p.passed || {}).some(level => level && level[key]);
  const worlds = G.worlds.map(w => {
    const ws = p.worlds?.[w.id] || {};
    const topics = w.topics.map(t => {
      const ts = p.topics?.[t.key] || {};
      return { key: t.key, label: t.label, answered: n(ts.answered), correct: n(ts.correct), passed: passedAny(`${w.id}:${t.key}`) };
    });
    return { id: w.id, title: w.title, answered: n(ws.answered), correct: n(ws.correct), quizzes: n(ws.quizzes), topics };
  });
  // Talen: stars per theme are kept per language learned ("en:dieren"), words as "en:shark"
  const talen = p.talen || {}, learnt = {};
  for (const [k, rec] of Object.entries(talen.themes || {})) {
    const [lang, id] = k.includes(':') ? k.split(':') : ['', k];
    (learnt[lang] ||= { themes: {}, words: 0 }).themes[id] = { stars: n(rec?.stars), played: n(rec?.played) };
  }
  for (const k of Object.keys(talen.words || {})) { const lang = k.includes(':') ? k.split(':')[0] : ''; (learnt[lang] ||= { themes: {}, words: 0 }).words++ }
  // Gesprekjes per situation ("es:intro") and Spreken per language: counts and dates only.
  // Spreken never holds sound, a transcript or anything of the voice (games-talen-talk.js).
  for (const [k, rec] of Object.entries(talen.conversations || {})) {
    const [lang] = k.split(':'), x = (learnt[lang] ||= { themes: {}, words: 0 });
    x.conv ||= { played: 0, answered: 0, correct: 0 };
    x.conv.played += n(rec?.played); x.conv.answered += n(rec?.answered); x.conv.correct += n(rec?.correct);
  }
  for (const [lang, rec] of Object.entries(talen.speaking || {})) {
    (learnt[lang] ||= { themes: {}, words: 0 }).speaking = { practised: n(rec?.practised), completed: n(rec?.completed), lastPlayed: n(rec?.lastPlayed) };
  }
  const math = p.games?.math || {};
  return {
    answered: n(s?.answered), correct: n(s?.correct), quizzes: n(s?.quizzesPlayed), level: 1 + Math.floor(n(s?.xp) / 100),
    worlds,
    math: { played: n(math.played), won: n(math.won), best: Object.fromEntries(Object.entries(math.best || {}).map(([k, v]) => [k, n(v)])) },
    talen: Object.entries(learnt).map(([lang, x]) => ({
      lang, name: LANGS[lang] || 'Onbekende taal', words: x.words,
      conversations: x.conv || { played: 0, answered: 0, correct: 0 },
      speaking: x.speaking || { practised: 0, completed: 0, lastPlayed: 0 },
      themes: G.talen.filter(t => x.themes[t.id]).map(t => ({ id: t.id, label: t.label, ...x.themes[t.id] })),
    })),
  };
}

module.exports = { detail };
