// Kwizillo voor leerkrachten (docs/SCHOLENPORTAAL.md): log in, make classes,
// add pupils, print their login cards and follow their progress. Talks only to
// /api/school on this site; the session is an HttpOnly cookie.
(() => {
  const PICS = window.KWIZILLO_SCHOOL_PICTURES || [];
  const app = document.getElementById('app'), who = document.getElementById('who');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const api = async (method, path, body) => {
    const r = await fetch('/api/school' + path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    let json = null; try { json = await r.json() } catch (e) {}
    return { status: r.status, json };
  };
  const render = html => { app.innerHTML = html; window.scrollTo(0, 0) };
  const on = (sel, ev, fn) => app.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn));
  const date = ms => ms ? new Date(ms).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nog niet';
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
  let me = null;

  function setWho() {
    who.innerHTML = me ? `${esc(me.teacher.name)} <button class="secondary" id="logout">Uitloggen</button>` : '';
    who.querySelector('#logout')?.addEventListener('click', async () => { await api('POST', '/teacher/logout'); me = null; setWho(); showLogin() });
  }

  /* ---------------- inloggen en uitnodiging ---------------- */

  function showLogin(error = '') {
    render(`<div class="card narrow"><h1>Inloggen</h1><p class="lead">Voor leerkrachten van scholen met Kwizillo.</p>
      <form id="f"><label for="em">E-mailadres</label><input id="em" type="email" autocomplete="username" required>
      <label for="pw">Wachtwoord</label><input id="pw" type="password" autocomplete="current-password" required>
      <p class="error" role="alert">${esc(error)}</p><div class="row"><button type="submit">Inloggen</button><button type="button" class="link" id="forgot">Wachtwoord vergeten?</button></div></form></div>`);
    on('#f', 'submit', async e => {
      e.preventDefault();
      const r = await api('POST', '/teacher/login', { email: app.querySelector('#em').value.trim(), password: app.querySelector('#pw').value });
      if (r.status === 200) return start();
      showLogin(r.json?.error || 'Inloggen lukt niet');
    });
    on('#forgot', 'click', () => showForgot(app.querySelector('#em').value.trim()));
  }
  // The answer never says whether the address has an account.
  function showForgot(email = '', error = '') {
    render(`<div class="card narrow"><h1>Wachtwoord vergeten</h1><p class="lead">Vul het e-mailadres van je account in. Je krijgt een e-mail met een link om een nieuw wachtwoord te kiezen.</p>
      <form id="f"><label for="em">E-mailadres</label><input id="em" type="email" autocomplete="username" required value="${esc(email)}">
      <p class="error" role="alert">${esc(error)}</p><div class="row"><button type="submit">Stuur de link</button><button type="button" class="link" id="back">Terug naar inloggen</button></div></form></div>`);
    on('#back', 'click', () => showLogin());
    on('#f', 'submit', async e => {
      e.preventDefault();
      const r = await api('POST', '/teacher/forgot', { email: app.querySelector('#em').value.trim() });
      if (r.status !== 200) return showForgot(app.querySelector('#em').value.trim(), r.json?.error || 'Dat lukte niet');
      render(`<div class="card narrow"><h1>Kijk in je mail</h1><p class="lead">Als dit e-mailadres bij Kwizillo bekend is, krijg je binnen een paar minuten een e-mail met een link. De link is een uur geldig.</p>
        <p class="note">Geen e-mail gekregen? Kijk ook bij de ongewenste e-mail, of vraag het aan Kwizillo.</p><button class="secondary" id="back">Terug naar inloggen</button></div>`);
      on('#back', 'click', () => showLogin());
    });
  }
  function showInvite(token, error = '', reset = false) {
    render(`<div class="card narrow"><h1>${reset ? 'Nieuw wachtwoord' : 'Welkom bij Kwizillo'}</h1><p class="lead">Kies ${reset ? 'een nieuw' : 'een'} wachtwoord voor je account (minstens 10 tekens).</p>
      <form id="f"><label for="pw">Wachtwoord</label><input id="pw" type="password" autocomplete="new-password" minlength="10" required>
      <label for="pw2">Nog een keer</label><input id="pw2" type="password" autocomplete="new-password" minlength="10" required>
      <p class="error" role="alert">${esc(error)}</p><button type="submit">${reset ? 'Wachtwoord opslaan' : 'Account activeren'}</button></form></div>`);
    on('#f', 'submit', async e => {
      e.preventDefault();
      const a = app.querySelector('#pw').value, b = app.querySelector('#pw2').value;
      if (a !== b) return showInvite(token, 'De twee wachtwoorden zijn niet gelijk', reset);
      const r = await api('POST', '/teacher/invite/accept', { token, password: a });
      if (r.status !== 200) return showInvite(token, r.json?.error || 'Dat lukte niet', reset);
      history.replaceState(null, '', location.pathname);
      start();
    });
  }

  /* ---------------- overzicht van de klassen ---------------- */

  async function start() {
    const r = await api('GET', '/teacher/me');
    if (r.status !== 200) { me = null; setWho(); return showLogin() }
    me = r.json; setWho(); view();
  }
  function licenceLine(l) {
    const until = l.validUntil ? new Date(l.validUntil).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '–';
    return `<div class="licence"><span>${esc(l.school)}</span><span>${l.used} van ${l.seats} leerlingplaatsen</span><span class="${l.active ? '' : 'bad'}">Licentie ${l.active ? 'geldig t/m' : 'verlopen op'} ${esc(until)}</span></div>`;
  }
  function showHome(error = '') {
    render(`<h1>Jouw klassen</h1>${licenceLine(me.licence)}
      <h2>Klassen</h2>
      ${me.classes.length ? `<div class="classes">${me.classes.map(c => `<button class="class-tile" data-class="${c.id}"><b>${esc(c.name)}</b><span class="code">${esc(c.code)}</span> · ${c.pupils} leerlingen</button>`).join('')}</div>` : '<p class="note">Nog geen klassen. Maak er hieronder een.</p>'}
      <h2>Nieuwe klas</h2>
      <form id="nc" class="card"><label for="cn">Naam van de klas</label><input id="cn" placeholder="bijvoorbeeld Groep 5b" maxlength="60" required>
      <label for="cl">Taal van het spel</label><select id="cl"><option value="nl">Nederlands</option><option value="en">Engels</option></select>
      <p class="error" role="alert">${esc(error)}</p><button type="submit">Klas maken</button></form>`);
    on('[data-class]', 'click', e => go(`klas=${e.currentTarget.dataset.class}`));
    on('#nc', 'submit', async e => {
      e.preventDefault();
      const r = await api('POST', '/classes', { name: app.querySelector('#cn').value, language: app.querySelector('#cl').value });
      if (r.status !== 201) return showHome(r.json?.error || 'Dat lukte niet');
      await refreshMe(); go(`klas=${r.json.id}`);
    });
  }
  async function refreshMe() { const r = await api('GET', '/teacher/me'); if (r.status === 200) me = r.json }

  /* ---------------- één klas ---------------- */

  async function showClass(id, { cards = [], error = '' } = {}) {
    const r = await api('GET', `/classes/${id}/overview`);
    if (r.status === 401) return showLogin();
    if (r.status !== 200) return showHome('Klas niet gevonden');
    const { class: c, pupils } = r.json;
    render(`<p class="no-print"><button class="link" id="back">← Alle klassen</button></p>
      <h1>${esc(c.name)}</h1>
      <p class="lead">Klascode <span class="code bigcode">${esc(c.code)}</span><br><span class="note">De kinderen gaan naar <b>${esc(location.host)}</b>, typen deze code, tikken hun naam aan en hun drie plaatjes.</span></p>
      ${cards.length ? cardsBlock(c, cards) : ''}
      <h2 class="no-print">Voortgang</h2>
      ${pupils.length ? `<div class="no-print scroll-x"><table><thead><tr><th>Naam</th><th>Laatst gespeeld</th><th class="num">Vragen</th><th class="num">Goed</th><th class="num">Quizzen</th><th class="num">Niveau</th><th class="num">Rekenen</th><th class="num">Talen-woordjes</th><th></th></tr></thead><tbody>
        ${pupils.map(p => `<tr class="pupil-row" data-pupil="${p.id}"><td><a class="pupil-link" href="#leerling=${p.id}">${esc(p.name)}</a></td><td>${esc(date(p.playedAt))}</td><td class="num">${p.answered}</td><td class="num">${pct(p.correct, p.answered)}</td><td class="num">${p.quizzes}</td><td class="num">${p.level}</td><td class="num">${p.math.won}/${p.math.played}</td><td class="num">${p.talen.words}</td>
          <td><button class="secondary" data-reset="${p.id}">Nieuwe plaatjes</button> <button class="danger" data-delete="${p.id}" data-name="${esc(p.name)}">Verwijderen</button></td></tr>`).join('')}
      </tbody></table></div><p class="note no-print">Klik op een leerling voor meer: per wereld en onderwerp, Rekenen en Talen.</p>` : '<p class="note no-print">Nog geen leerlingen in deze klas.</p>'}
      <h2 class="no-print">Leerlingen toevoegen</h2>
      <form id="ap" class="card no-print"><label for="names">Eén naam per regel: voornaam en de eerste letter van de achternaam (bijvoorbeeld <i>Sam B.</i>). Geen volledige namen nodig.</label>
      <textarea id="names" placeholder="Sam B.&#10;Noor K.&#10;Daan V."></textarea>
      <p class="error" role="alert">${esc(error)}</p><button type="submit">Toevoegen en inlogkaartjes maken</button></form>`);
    app.querySelector('#back').addEventListener('click', () => go(''));
    on('#ap', 'submit', async e => {
      e.preventDefault();
      const names = app.querySelector('#names').value.split('\n').map(s => s.trim()).filter(Boolean);
      if (!names.length) return;
      const r = await api('POST', `/classes/${id}/pupils`, { names });
      if (r.status !== 201) return showClass(id, { error: r.json?.error || 'Dat lukte niet' });
      showClass(id, { cards: r.json.pupils });
    });
    on('.pupil-row', 'click', e => { if (!e.target.closest('button,a')) go(`leerling=${e.currentTarget.dataset.pupil}`) });
    on('[data-reset]', 'click', async e => {
      if (!confirm('Een nieuwe plaatjescode maken? De oude werkt dan niet meer.')) return;
      const r = await api('POST', `/pupils/${e.currentTarget.dataset.reset}/reset-code`);
      if (r.status === 200) showClass(id, { cards: [r.json] });
    });
    on('[data-delete]', 'click', async e => {
      const name = e.currentTarget.dataset.name;
      if (!confirm(`${name} verwijderen? Alle voortgang van ${name} wordt gewist. Dit kan niet ongedaan worden.`)) return;
      await api('DELETE', `/pupils/${e.currentTarget.dataset.delete}`);
      showClass(id);
    });
    app.querySelector('#print')?.addEventListener('click', () => window.print());
  }
  /* ---------------- één leerling ---------------- */

  const bar = (a, b) => { const v = b ? Math.round(a / b * 100) : 0; return `<span class="bar" title="${v}%"><i style="width:${v}%" class="${!b ? '' : v >= 80 ? 'good' : v < 60 ? 'low' : ''}"></i></span>` };
  async function showPupil(id) {
    const r = await api('GET', `/pupils/${id}`);
    if (r.status === 401) return showLogin();
    if (r.status !== 200) return go('');
    const p = r.json, played = p.worlds.filter(w => w.answered), unplayed = p.worlds.filter(w => !w.answered);
    const topics = p.worlds.flatMap(w => w.topics.map(t => ({ ...t, world: w.title })));
    const passed = topics.filter(t => t.passed).length;
    // At least 5 questions before a topic counts as going well or needing practice.
    const rated = topics.filter(t => t.answered >= 5).map(t => ({ ...t, score: t.correct / t.answered }));
    const practise = rated.filter(t => t.score < .6).sort((a, b) => a.score - b.score);
    const strong = rated.filter(t => t.score >= .85).sort((a, b) => b.score - a.score);
    const chips = list => list.map(t => `<span class="chip">${esc(t.label)} <small>${esc(t.world)} · ${pct(t.correct, t.answered)}</small></span>`).join('');
    const best = Object.entries(p.math.best).filter(([, v]) => v).map(([lv, v]) => `niveau ${esc(lv)}: ${v}`).join(', ');
    render(`<p><button class="link" id="back">← ${esc(p.class.name)}</button></p>
      <h1>${esc(p.name)}</h1>
      <p class="lead">Laatst gespeeld: ${esc(date(p.playedAt))} · Niveau ${p.level}</p>
      <div class="stats">
        <div class="stat"><b>${p.answered}</b><span>vragen beantwoord</span></div>
        <div class="stat"><b>${pct(p.correct, p.answered)}</b><span>goed</span></div>
        <div class="stat"><b>${p.quizzes}</b><span>quizzen gespeeld</span></div>
        <div class="stat"><b>${passed}/${topics.length}</b><span>onderwerpen gehaald</span></div>
      </div>
      ${p.answered ? '' : '<p class="note">Nog niets gespeeld. Zodra het kind speelt, verschijnt hier de voortgang.</p>'}
      ${practise.length || strong.length ? `<div class="insight">
        ${practise.length ? `<div class="card"><h3>Oefent nog</h3><p class="note">Minder dan 60% goed (vanaf 5 vragen).</p>${chips(practise)}</div>` : ''}
        ${strong.length ? `<div class="card"><h3>Gaat goed</h3><p class="note">85% of meer goed (vanaf 5 vragen).</p>${chips(strong)}</div>` : ''}
      </div>` : ''}
      ${played.length ? `<h2>Werelden</h2>${played.map(w => `<div class="card world">
        <div class="world-head"><b>${esc(w.title)}</b><span>${w.answered} vragen · ${pct(w.correct, w.answered)} goed</span>${bar(w.correct, w.answered)}</div>
        <table class="topics"><colgroup><col class="c-name"><col class="c-n"><col class="c-ok"><col class="c-pass"></colgroup>
          <thead><tr><th>Onderwerp</th><th class="num">Vragen</th><th>Goed</th><th class="pass">Quiz gehaald</th></tr></thead><tbody>
          ${w.topics.map(t => `<tr><td>${esc(t.label)}</td><td class="num">${t.answered}</td><td class="ok"><span class="pc">${pct(t.correct, t.answered)}</span>${t.answered ? bar(t.correct, t.answered) : ''}</td><td class="pass">${t.passed ? '<span class="tick" title="Quiz gehaald">✓</span>' : ''}</td></tr>`).join('')}
        </tbody></table></div>`).join('')}` : ''}
      ${unplayed.length && played.length ? `<p class="note">Nog niet gespeeld: ${unplayed.map(w => esc(w.title)).join(', ')}.</p>` : ''}
      <h2>Rekenen</h2>
      <div class="card">${p.math.played ? `${p.math.played} keer gespeeld, ${p.math.won} keer gehaald.${best ? ` Beste score: ${best}.` : ''}` : '<span class="note">Nog niet gespeeld.</span>'}</div>
      <h2>Talen</h2>
      ${p.talen.length ? p.talen.map(l => `<div class="card"><b>${esc(l.name)}</b> · ${l.words} woordjes geleerd${l.conversations?.played ? ` · ${l.conversations.played}× gesprekjes, ${pct(l.conversations.correct, l.conversations.answered)} goed` : ''}${l.speaking?.practised ? ` · ${l.speaking.practised}× gesproken${l.speaking.lastPlayed ? ` (laatst ${esc(date(l.speaking.lastPlayed))})` : ''}` : ''}
        ${l.themes.length ? `<div class="chips">${l.themes.map(t => `<span class="chip">${esc(t.label)} <small>${'★'.repeat(t.stars)}${'☆'.repeat(Math.max(0, 3 - t.stars))} · ${t.played}× gespeeld</small></span>`).join('')}</div>` : ''}</div>`).join('') : '<div class="card"><span class="note">Nog niet gespeeld.</span></div>'}`);
    app.querySelector('#back').addEventListener('click', () => go(`klas=${p.class.id}`));
  }

  // The picture codes are shown once, right after they are made: print them now.
  function cardsBlock(c, cards) {
    return `<div class="card"><div class="row no-print"><b>Inlogkaartjes</b><span class="note">Alleen nu te zien: print ze of schrijf ze over. Kwijt? Maak later een nieuwe plaatjescode.</span><button id="print">Printen</button></div>
      <div class="cards">${cards.map(p => `<div class="login-card" data-card="${p.id}" data-pictures="${p.pictures.join(',')}"><div class="lc-head"><span class="lc-name">${esc(p.name)}</span><span class="code">${esc(c.code)}</span></div>
        <div class="lc-pics">${p.pictures.map((i, n) => `<figure><img src="/${esc(PICS[i]?.img || '')}" alt=""><span>${n + 1}. ${esc(PICS[i]?.nl || '')}</span></figure>`).join('')}</div>
        <div class="lc-foot">${esc(c.name)} · ${esc(location.host)}</div></div>`).join('')}</div></div>`;
  }

  // Where a teacher is lives in the address (#klas=3, #leerling=12): the browser's
  // back button goes back a page, and a reload stays on it.
  function go(hash) { if (location.hash.slice(1) === hash) view(); else location.hash = hash }
  function view() {
    if (!me) return start();
    const m = /^#(klas|leerling)=(\d+)$/.exec(location.hash);
    if (!m) return refreshMe().then(() => showHome());   // the pupil counts may have changed
    return m[1] === 'klas' ? showClass(Number(m[2])) : showPupil(Number(m[2]));
  }
  // also when the link is opened in a tab that already shows the portal
  const route = () => { const link = /[#&](uitnodiging|herstel)=([A-Za-z0-9_-]+)/.exec(location.hash); if (link) showInvite(link[2], '', link[1] === 'herstel'); else return true };
  window.addEventListener('hashchange', () => { if (route()) view() });
  if (route()) start();
})();
