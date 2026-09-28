#!/usr/bin/env node
// Bouwt review.html: elke nieuwe vraag uit content/ met plaat, antwoorden,
// hint, uitleg en weetje, per onderwerp in blokken van twintig, in alle tien
// talen. Goedkeuren of afkeuren gebeurt in de pagina zelf; de beslissingen
// staan in localStorage en zijn als JSON te downloaden.
//
//   node tools/review-page.cjs
//
// De pagina staat bewust in de hoofdmap: de server geeft alleen bestanden uit
// de hoofdmap en uit assets/ door, dus content/ blijft onbereikbaar. Daarom
// wordt alle inhoud in de pagina zelf gebakken.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'review.html');

const LANGS = ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'da', 'ru', 'ar'];
const LANG_NAMES = { nl: 'Nederlands', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español',
  it: 'Italiano', pt: 'Português', da: 'Dansk', ru: 'Русский', ar: 'العربية' };
const RTL = new Set(['ar']);

const topics = [];
for (const world of fs.readdirSync(CONTENT).sort()) {
  const dir = path.join(CONTENT, world);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    topics.push({
      world: data.world,
      topic: data.topic,
      questions: data.questions.map(q => ({
        id: q.id,
        difficulty: q.difficulty,
        art: q.art === 'own' ? `assets/questions/q/${q.id}.jpg` : null,
        brief: q.artBrief || '',
        text: q.text,
      })),
    });
  }
}
const total = topics.reduce((n, t) => n + t.questions.length, 0);
const withArt = topics.reduce((n, t) => n + t.questions.filter(q => q.art).length, 0);

const html = `<!doctype html>
<html lang="nl">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kwizillo — nieuwe vragen nakijken</title>
<style>
  :root {
    --bg: #0d1030; --card: #191d4a; --line: #2b3170; --ink: #f2f4ff; --dim: #a8afdd;
    --good: #35c98a; --bad: #ff6b81; --gold: #ffc65c; --blue: #5b8bff;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink);
    font: 16px/1.5 -apple-system, "Segoe UI", system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 5; padding: 12px 16px;
    background: rgba(13,16,48,.94); border-bottom: 1px solid var(--line);
    backdrop-filter: blur(8px); display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  h1 { font-size: 18px; margin: 0 8px 0 0; }
  select, button { font: inherit; color: var(--ink); background: var(--card);
    border: 1px solid var(--line); border-radius: 10px; padding: 7px 12px; cursor: pointer; }
  button:hover, select:hover { border-color: var(--blue); }
  .count { color: var(--dim); font-size: 14px; margin-left: auto; }
  main { max-width: 1100px; margin: 0 auto; padding: 16px; }
  section { margin: 0 0 32px; }
  h2 { font-size: 20px; margin: 24px 0 4px; }
  h2 small { color: var(--dim); font-weight: 400; font-size: 14px; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); }
  article { background: var(--card); border: 1px solid var(--line); border-radius: 16px;
    overflow: hidden; display: flex; flex-direction: column; }
  article.ok { border-color: var(--good); }
  article.no { border-color: var(--bad); }
  .shot { aspect-ratio: 16/9; background: #10143a; display: grid; place-items: center;
    color: var(--dim); font-size: 13px; text-align: center; padding: 12px; }
  .shot.none { aspect-ratio: auto; padding: 16px 18px; }
  .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .meta { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--dim); }
  .pill { border: 1px solid var(--line); border-radius: 999px; padding: 2px 9px; }
  .prompt { font-size: 17px; font-weight: 600; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  li { border: 1px solid var(--line); border-radius: 10px; padding: 7px 11px; font-size: 15px; }
  li.answer { border-color: var(--good); background: rgba(53,201,138,.12); }
  .line { font-size: 14px; color: var(--dim); }
  .line b { color: var(--ink); font-weight: 600; }
  .acts { display: flex; gap: 8px; margin-top: auto; padding-top: 4px; }
  .acts button { flex: 1; }
  .acts .yes.on { background: var(--good); color: #05210f; border-color: var(--good); }
  .acts .nope.on { background: var(--bad); color: #2b0008; border-color: var(--bad); }
  textarea { width: 100%; min-height: 34px; resize: vertical; background: #10143a;
    color: var(--ink); border: 1px solid var(--line); border-radius: 10px; padding: 7px 10px; font: inherit; font-size: 14px; }
  [dir=rtl] .prompt, [dir=rtl] li, [dir=rtl] .line { text-align: right; }
</style>
<header>
  <h1>Kwizillo — nieuwe vragen</h1>
  <select id="lang"></select>
  <select id="jump"></select>
  <button id="only">Alleen nog niet beoordeeld</button>
  <button id="save">Beslissingen downloaden</button>
  <button id="reset">Wissen</button>
  <span class="count" id="count"></span>
</header>
<main id="main"></main>
<script>
const DATA = ${JSON.stringify(topics)};
const LANGS = ${JSON.stringify(LANGS)};
const NAMES = ${JSON.stringify(LANG_NAMES)};
const RTL = ${JSON.stringify([...RTL])};
const KEY = 'kwizillo-review-v1';
let verdicts = {};
try { verdicts = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
let lang = 'nl', onlyOpen = false;

const store = () => { try { localStorage.setItem(KEY, JSON.stringify(verdicts)); } catch {} };
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

function render() {
  const rtl = RTL.includes(lang);
  const main = document.getElementById('main');
  main.innerHTML = DATA.map(t => {
    const cards = t.questions.filter(q => !onlyOpen || !verdicts[q.id]).map(q => {
      const x = q.text[lang]; if (!x) return '';
      const v = verdicts[q.id] || {};
      const opts = [x.answer, ...x.wrong];
      return \`<article class="\${v.ok === true ? 'ok' : v.ok === false ? 'no' : ''}" data-id="\${q.id}">
        <div class="shot\${q.art ? '' : ' none'}">\${q.art ? \`<img loading="lazy" src="\${q.art}" alt="">\` : \`nog geen eigen plaat<br><span style="opacity:.7">\${esc(q.brief)}</span>\`}</div>
        <div class="body"\${rtl ? ' dir="rtl"' : ''}>
          <div class="meta"><span class="pill">\${q.id.slice(-2)}</span><span class="pill">niveau \${q.difficulty}</span>\${q.art ? '' : '<span class="pill">plaat volgt</span>'}</div>
          <div class="prompt">\${esc(x.prompt)}</div>
          <ul>\${opts.map((o, i) => \`<li class="\${i === 0 ? 'answer' : ''}">\${esc(o)}</li>\`).join('')}</ul>
          <div class="line"><b>Hint:</b> \${esc(x.hint)}</div>
          <div class="line"><b>Uitleg:</b> \${esc(x.explanation)}</div>
          <div class="line"><b>Weetje:</b> \${esc(x.fact)}</div>
          <textarea placeholder="opmerking">\${esc(v.note || '')}</textarea>
          <div class="acts">
            <button class="yes \${v.ok === true ? 'on' : ''}">Goed</button>
            <button class="nope \${v.ok === false ? 'on' : ''}">Aanpassen</button>
          </div>
        </div>
      </article>\`;
    }).join('');
    if (!cards) return '';
    return \`<section id="\${t.world}-\${t.topic}"><h2>\${t.world} / \${t.topic} <small>\${t.questions.length} vragen</small></h2><div class="grid">\${cards}</div></section>\`;
  }).join('') || '<p style="color:var(--dim)">Alles is beoordeeld.</p>';
  tally();
}

function tally() {
  const all = DATA.flatMap(t => t.questions.map(q => q.id));
  const ok = all.filter(id => verdicts[id]?.ok === true).length;
  const no = all.filter(id => verdicts[id]?.ok === false).length;
  document.getElementById('count').textContent =
    \`\${ok} goed · \${no} aanpassen · \${all.length - ok - no} te gaan van \${all.length}\`;
}

document.getElementById('main').addEventListener('click', e => {
  const card = e.target.closest('article'); if (!card) return;
  const id = card.dataset.id;
  if (e.target.classList.contains('yes') || e.target.classList.contains('nope')) {
    const ok = e.target.classList.contains('yes');
    const cur = verdicts[id] || {};
    verdicts[id] = { ...cur, ok: cur.ok === ok ? null : ok };
    if (verdicts[id].ok === null && !verdicts[id].note) delete verdicts[id];
    store();
    card.classList.toggle('ok', verdicts[id]?.ok === true);
    card.classList.toggle('no', verdicts[id]?.ok === false);
    card.querySelector('.yes').classList.toggle('on', verdicts[id]?.ok === true);
    card.querySelector('.nope').classList.toggle('on', verdicts[id]?.ok === false);
    tally();
  }
});
document.getElementById('main').addEventListener('input', e => {
  if (e.target.tagName !== 'TEXTAREA') return;
  const id = e.target.closest('article').dataset.id;
  verdicts[id] = { ...(verdicts[id] || {}), note: e.target.value };
  store();
});

const langSel = document.getElementById('lang');
langSel.innerHTML = LANGS.map(l => \`<option value="\${l}">\${NAMES[l]}</option>\`).join('');
langSel.onchange = () => { lang = langSel.value; render(); };

const jump = document.getElementById('jump');
jump.innerHTML = '<option value="">Spring naar…</option>' +
  DATA.map(t => \`<option value="\${t.world}-\${t.topic}">\${t.world} / \${t.topic}</option>\`).join('');
jump.onchange = () => { const el = document.getElementById(jump.value); if (el) el.scrollIntoView({ behavior: 'smooth' }); };

document.getElementById('only').onclick = e => {
  onlyOpen = !onlyOpen;
  e.target.textContent = onlyOpen ? 'Alles tonen' : 'Alleen nog niet beoordeeld';
  render();
};
document.getElementById('save').onclick = () => {
  const blob = new Blob([JSON.stringify(verdicts, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kwizillo-review.json';
  a.click();
};
document.getElementById('reset').onclick = () => {
  if (!confirm('Alle beoordelingen wissen?')) return;
  verdicts = {}; store(); render();
};
render();
</script>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`review.html: ${total} vragen uit ${topics.length} onderwerpen, ${withArt} met eigen plaat, ${(html.length / 1048576).toFixed(1)} MB`);
