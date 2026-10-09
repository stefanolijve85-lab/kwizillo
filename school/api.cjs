// /api/school/*: the school portal's API (docs/SCHOLENPORTAAL.md). Mounted by
// server.js when SCHOOL_DB is set. Teachers use a cookie (same origin only);
// pupils a bearer token, so the game can also log in from the iOS app later.
const A = require('./auth.cjs');
const { detail } = require('./detail.cjs');

const COOKIE = 'kws';
const BODY_MAX = 512 * 1024;          // a pupil's game state is well under 100 KB
const NAME_MAX = 40, CLASS_MAX = 60, PUPILS_MAX = 60;

// A small in-memory limiter: `limit` hits per `ms` per key.
function limiter() {
  const hits = new Map();
  setInterval(() => { const t = Date.now(); for (const [k, v] of hits) if (v.reset < t) hits.delete(k) }, 60e3).unref();
  return (key, limit, ms) => {
    const t = Date.now(); let v = hits.get(key);
    if (!v || v.reset < t) { v = { n: 0, reset: t + ms }; hits.set(key, v) }
    return ++v.n <= limit;
  };
}

// The link in the e-mail always points at this address, never at the Host of the
// request (that could be made to point elsewhere).
const SITE = (process.env.SCHOOL_URL || 'https://school.kwizillo.nl').replace(/\/$/, '');
const resetMail = (name, link) => `Hallo ${name},

Je hebt gevraagd om een nieuw wachtwoord voor Kwizillo voor leerkrachten.
Kies een nieuw wachtwoord via deze link (een uur geldig):

${link}

Heb je dit niet zelf gevraagd? Dan hoef je niets te doen: je wachtwoord blijft
zoals het was.

Groeten,
Kwizillo
`;

function create(store, { secureCookies = true, mailer = null, logLinks = false } = {}) {
  const allow = limiter();
  const locks = new Map();            // pupil id -> { fails, first, until }

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
    res.end(JSON.stringify(body));
  };
  const fail = (res, status, error, headers) => send(res, status, { error }, headers);
  const body = req => new Promise((ok, no) => {
    let n = 0; const parts = [];
    req.on('data', c => { n += c.length; if (n > BODY_MAX) { no(Object.assign(new Error('too large'), { status: 413 })); req.destroy() } else parts.push(c) });
    req.on('end', () => { try { ok(parts.length ? JSON.parse(Buffer.concat(parts).toString('utf8')) : {}) } catch (e) { no(Object.assign(new Error('bad json'), { status: 400 })) } });
    req.on('error', no);
  });
  const ip = req => String(req.headers['x-real-ip'] || req.socket.remoteAddress || '');
  const cookie = req => { const m = /(?:^|;\s*)kws=([^;]+)/.exec(req.headers.cookie || ''); return m ? decodeURIComponent(m[1]) : null };
  const bearer = req => { const m = /^Bearer\s+(\S+)$/.exec(req.headers.authorization || ''); return m ? m[1] : null };
  const setCookie = (token, maxAge) => `${COOKIE}=${token ? encodeURIComponent(token) : ''}; Path=/api/school; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureCookies ? '; Secure' : ''}`;
  // A change by a teacher must come from this site itself.
  const sameOrigin = req => { const o = req.headers.origin; if (!o) return false; try { return new URL(o).host === req.headers.host } catch { return false } };
  // Pupil endpoints may be called by the app (another origin) with a bearer token, never with cookies.
  const cors = req => req.headers.origin ? { 'Access-Control-Allow-Origin': req.headers.origin, Vary: 'Origin' } : {};
  const cleanName = (s, max) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

  function teacherOf(req) { const s = store.session('teacher', cookie(req)); return s ? store.teacher(s.subject_id) : null }
  function pupilOf(req) { const s = store.session('pupil', bearer(req)); return s ? store.pupil(s.subject_id) : null }
  const licence = schoolId => { const s = store.school(schoolId); return { school: s?.name, validUntil: s?.valid_until || null, active: store.licenseOk(s), seats: s?.seats || 0, used: store.seatsUsed(schoolId) } };

  return async function handle(req, res, url) {
    const p = url.pathname;
    if (!p.startsWith('/api/school/')) return false;
    const m = req.method;
    try {
      /* ---------------- pupils ---------------- */
      if (p.startsWith('/api/school/join/') || p.startsWith('/api/school/pupil/')) {
        if (m === 'OPTIONS') { res.writeHead(204, { ...cors(req), 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400' }); res.end(); return true }
        const h = cors(req);
        if (p.startsWith('/api/school/join/') && m === 'GET') {
          if (!allow('join:' + ip(req), 30, 60e3)) return fail(res, 429, 'Even wachten', h), true;
          const c = store.classByCode(decodeURIComponent(p.slice('/api/school/join/'.length)));
          if (!c) return fail(res, 404, 'Deze klascode bestaat niet', h), true;
          return send(res, 200, { className: c.name, language: c.language, pupils: store.pupilsOf(c.id) }, h), true;
        }
        if (p === '/api/school/pupil/login' && m === 'POST') {
          const b = await body(req);
          if (!allow('login:' + ip(req), 40, 60e3)) return fail(res, 429, 'Even wachten', h), true;
          const c = store.classByCode(b.code), pupil = c && store.pupil(Number(b.pupilId));
          if (!c || !pupil || pupil.class_id !== c.id || !A.validPictures(b.pictures)) return fail(res, 400, 'Probeer het nog eens', h), true;
          if (!allow('class:' + c.id, 120, 60e3)) return fail(res, 429, 'Even wachten', h), true;
          const lock = locks.get(pupil.id);
          if (lock && lock.until > Date.now()) return fail(res, 423, 'Even wachten, probeer het straks nog eens', { ...h, 'Retry-After': String(Math.ceil((lock.until - Date.now()) / 1000)) }), true;
          if (!store.checkPictures(pupil, b.pictures)) {
            // five wrong codes within 15 minutes lock this pupil for 5 minutes
            const t0 = Date.now(), l = lock && lock.first > t0 - 15 * 60e3 ? lock : { fails: 0, first: t0, until: 0 };
            l.fails++; if (l.fails >= 5) { l.until = t0 + 5 * 60e3; l.fails = 0; l.first = t0 }
            locks.set(pupil.id, l);
            return fail(res, 401, 'Dat zijn niet jouw plaatjes', h), true;
          }
          locks.delete(pupil.id);
          const s = store.school(c.school_id);
          return send(res, 200, { token: store.startSession('pupil', pupil.id), name: pupil.display_name, className: c.name, language: c.language, premium: store.licenseOk(s) }, h), true;
        }
        const pupil = pupilOf(req);
        if (!pupil) return fail(res, 401, 'Log opnieuw in', h), true;
        if (p === '/api/school/pupil/state' && m === 'GET') return send(res, 200, store.state(pupil.id), h), true;
        if (p === '/api/school/pupil/state' && m === 'PUT') {
          const b = await body(req);
          if (!b || typeof b.state !== 'object' || b.state === null || Array.isArray(b.state) || !Number.isInteger(b.version)) return fail(res, 400, 'Ongeldige voortgang', h), true;
          // the child's display name is the school's; the game keeps no other name there
          b.state.name = pupil.display_name;
          const v = store.saveState(pupil.id, b.state, b.version);
          if (v === null) return send(res, 409, { error: 'Nieuwere voortgang op de server', ...store.state(pupil.id) }, h), true;
          return send(res, 200, { version: v }, h), true;
        }
        if (p === '/api/school/pupil/logout' && m === 'POST') { store.endSession(bearer(req)); return send(res, 200, { ok: true }, h), true }
        return fail(res, 404, 'Niet gevonden', h), true;
      }

      /* ---------------- teachers ---------------- */
      if (m !== 'GET' && !sameOrigin(req)) return fail(res, 403, 'Niet toegestaan'), true;
      if (p === '/api/school/teacher/login' && m === 'POST') {
        const b = await body(req);
        if (!allow('tlogin:' + ip(req), 10, 15 * 60e3) || !allow('tlogin:' + String(b.email || '').toLowerCase(), 10, 15 * 60e3)) return fail(res, 429, 'Te veel pogingen, probeer het over een kwartier opnieuw'), true;
        const t = store.teacherByLogin(b.email, b.password);
        if (!t) return fail(res, 401, 'E-mailadres of wachtwoord klopt niet'), true;
        return send(res, 200, { ok: true }, { 'Set-Cookie': setCookie(store.startSession('teacher', t.id), 30 * 86400) }), true;
      }
      if (p === '/api/school/teacher/invite/accept' && m === 'POST') {
        const b = await body(req);
        if (!allow('invite:' + ip(req), 10, 15 * 60e3)) return fail(res, 429, 'Te veel pogingen'), true;
        if (typeof b.password !== 'string' || b.password.length < 10) return fail(res, 400, 'Kies een wachtwoord van minstens 10 tekens'), true;
        const id = store.acceptInvite(String(b.token || ''), b.password);
        if (!id) return fail(res, 400, 'Deze link is verlopen of al gebruikt'), true;
        return send(res, 200, { ok: true }, { 'Set-Cookie': setCookie(store.startSession('teacher', id), 30 * 86400) }), true;
      }
      if (p === '/api/school/teacher/forgot' && m === 'POST') {
        const b = await body(req), email = String(b.email || '').trim().toLowerCase().slice(0, 200);
        if (!allow('forgot:' + ip(req), 5, 15 * 60e3)) return fail(res, 429, 'Te veel pogingen, probeer het over een kwartier opnieuw'), true;
        // The answer is the same whether the address is known or not, and it does not
        // wait for the mail, so it cannot tell who has an account.
        if (/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(email) && allow('forgot:' + email, 3, 60 * 60e3)) {
          const r = store.resetToken(email);
          if (r) {
            const link = `${SITE}/leraar/#herstel=${r.token}`;
            if (logLinks) console.log(`Kwizillo school: link voor een nieuw wachtwoord (alleen lokaal): ${link}`);
            if (mailer) mailer({ to: r.teacher.email, subject: 'Nieuw wachtwoord voor Kwizillo', text: resetMail(r.teacher.name, link) })
              .catch(e => console.error('Kwizillo school: e-mail niet verstuurd:', e?.message || e));
            else if (!logLinks) console.error(`Kwizillo school: wachtwoord vergeten voor leerkracht ${r.teacher.id}, maar er is geen SMTP ingesteld (tools/school-admin.cjs reset)`);
          }
        }
        return send(res, 200, { ok: true }), true;
      }
      if (p === '/api/school/teacher/logout' && m === 'POST') { const c = cookie(req); if (c) store.endSession(c); return send(res, 200, { ok: true }, { 'Set-Cookie': setCookie(null, 0) }), true }

      const t = teacherOf(req);
      if (!t) return fail(res, 401, 'Log opnieuw in'), true;
      if (p === '/api/school/teacher/me' && m === 'GET') return send(res, 200, { teacher: { name: t.name, email: t.email }, licence: licence(t.school_id), classes: store.classesOf(t.id) }), true;
      if (p === '/api/school/classes' && m === 'POST') {
        const b = await body(req), name = cleanName(b.name, CLASS_MAX);
        if (!name) return fail(res, 400, 'Geef de klas een naam'), true;
        const language = ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'da', 'ru', 'ar'].includes(b.language) ? b.language : 'nl';
        return send(res, 201, store.createClass(t.school_id, t.id, name, language)), true;
      }
      let r;
      if ((r = /^\/api\/school\/classes\/(\d+)\/pupils$/.exec(p)) && m === 'POST') {
        const c = store.classOwned(Number(r[1]), t.id); if (!c) return fail(res, 404, 'Klas niet gevonden'), true;
        const b = await body(req);
        const names = (Array.isArray(b.names) ? b.names : []).map(n => cleanName(n, NAME_MAX)).filter(Boolean).slice(0, PUPILS_MAX);
        if (!names.length) return fail(res, 400, 'Geen namen'), true;
        const lic = licence(t.school_id);
        if (lic.used + names.length > lic.seats) return fail(res, 402, `De licentie heeft ${lic.seats} plaatsen; er zijn er nog ${Math.max(0, lic.seats - lic.used)} vrij`), true;
        return send(res, 201, { pupils: store.addPupils(c.id, names) }), true;
      }
      if ((r = /^\/api\/school\/classes\/(\d+)\/overview$/.exec(p)) && m === 'GET') {
        const c = store.classOwned(Number(r[1]), t.id); if (!c) return fail(res, 404, 'Klas niet gevonden'), true;
        return send(res, 200, { class: { id: c.id, name: c.name, code: c.code, language: c.language }, pupils: store.overview(c.id) }), true;
      }
      if ((r = /^\/api\/school\/pupils\/(\d+)$/.exec(p)) && m === 'GET') {
        const pu = store.pupilOwned(Number(r[1]), t.id); if (!pu) return fail(res, 404, 'Leerling niet gevonden'), true;
        const c = store.classOwned(pu.class_id, t.id);
        return send(res, 200, { id: pu.id, name: pu.display_name, playedAt: pu.played_at, class: { id: c.id, name: c.name }, ...detail(pu.state ? JSON.parse(pu.state) : null) }), true;
      }
      if ((r = /^\/api\/school\/pupils\/(\d+)\/reset-code$/.exec(p)) && m === 'POST') {
        const pu = store.pupilOwned(Number(r[1]), t.id); if (!pu) return fail(res, 404, 'Leerling niet gevonden'), true;
        locks.delete(pu.id);
        return send(res, 200, { id: pu.id, name: pu.display_name, pictures: store.resetPictures(pu.id) }), true;
      }
      if ((r = /^\/api\/school\/pupils\/(\d+)$/.exec(p)) && m === 'DELETE') {
        const pu = store.pupilOwned(Number(r[1]), t.id); if (!pu) return fail(res, 404, 'Leerling niet gevonden'), true;
        store.deletePupil(pu.id); locks.delete(pu.id);
        return send(res, 200, { ok: true }), true;
      }
      return fail(res, 404, 'Niet gevonden'), true;
    } catch (e) {
      if (e.status) return fail(res, e.status, e.status === 413 ? 'Te groot' : 'Ongeldig verzoek'), true;
      console.error('Kwizillo school:', e?.message || e);
      return fail(res, 500, 'Serverfout'), true;
    }
  };
}

module.exports = { create };
