// Kwizillo voor scholen, the server side (school/): a teacher accepts an invite,
// makes a class with pupils, a pupil logs in with the class code and picture
// code, saves and loads progress, and the teacher sees it in the overview. Plus
// the protections: wrong pictures lock a pupil, other teachers see nothing,
// changes need the same origin, the licence caps the seats.
const assert = require('assert');
const http = require('http');
const { open } = require('../school/store.cjs');
const { create } = require('../school/api.cjs');

(async () => {
  const store = open(':memory:');
  const handle = create(store, { secureCookies: false });
  const server = http.createServer(async (req, res) => { const url = new URL(req.url, 'http://x'); if (!(await handle(req, res, url))) { res.writeHead(404); res.end() } });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const host = `127.0.0.1:${server.address().port}`, base = `http://${host}`;
  const call = async (method, path, { body, cookie, token, origin = base } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (origin) headers.Origin = origin;
    if (cookie) headers.Cookie = cookie;
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, json: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  let n = 0; const ok = (name, fn) => fn().then(() => { n++; console.log('✔', name) });

  const schoolId = store.createSchool('Montessorischool Emmen', 3, '2099-07-31');
  const invite = store.inviteTeacher(schoolId, 'juf@school.nl', 'Juf Anna');
  let cookie, cls, pupils, token, version;

  await ok('a teacher sets a password through the invite and is logged in', async () => {
    let r = await call('POST', '/api/school/teacher/invite/accept', { body: { token: invite, password: 'kort' } });
    assert.strictEqual(r.status, 400);
    r = await call('POST', '/api/school/teacher/invite/accept', { body: { token: invite, password: 'een-goed-wachtwoord' } });
    assert.strictEqual(r.status, 200); cookie = r.cookie; assert.match(cookie, /^kws=/);
    r = await call('POST', '/api/school/teacher/invite/accept', { body: { token: invite, password: 'een-goed-wachtwoord' } });
    assert.strictEqual(r.status, 400, 'an invite works once');
    r = await call('GET', '/api/school/teacher/me', { cookie });
    assert.strictEqual(r.json.teacher.name, 'Juf Anna'); assert.strictEqual(r.json.licence.active, true);
  });

  await ok('login with e-mail and password; a wrong password is refused', async () => {
    assert.strictEqual((await call('POST', '/api/school/teacher/login', { body: { email: 'juf@school.nl', password: 'fout-wachtwoord' } })).status, 401);
    const r = await call('POST', '/api/school/teacher/login', { body: { email: 'JUF@school.nl', password: 'een-goed-wachtwoord' } });
    assert.strictEqual(r.status, 200);
  });

  await ok('a change from another site is refused (same origin only)', async () => {
    assert.strictEqual((await call('POST', '/api/school/classes', { cookie, body: { name: 'Groep 5' }, origin: 'https://evil.example' })).status, 403);
    assert.strictEqual((await call('POST', '/api/school/classes', { cookie, body: { name: 'Groep 5' }, origin: null })).status, 403);
  });

  await ok('a class gets a six-character code; pupils get a picture code once; the licence caps the seats', async () => {
    let r = await call('POST', '/api/school/classes', { cookie, body: { name: 'Groep 5' } });
    assert.strictEqual(r.status, 201); cls = r.json; assert.match(cls.code, /^[A-HJKMNP-Z2-9]{6}$/);
    r = await call('POST', `/api/school/classes/${cls.id}/pupils`, { cookie, body: { names: ['Sam B.', 'Noor <b>K.</b>'] } });
    assert.strictEqual(r.status, 201); pupils = r.json.pupils;
    assert.strictEqual(pupils[1].name, 'Noor bK./b', 'no markup in names');
    for (const p of pupils) assert.strictEqual(p.pictures.length, 3);
    r = await call('POST', `/api/school/classes/${cls.id}/pupils`, { cookie, body: { names: ['Lisa', 'Tim'] } });
    assert.strictEqual(r.status, 402, 'three seats, two used: two more do not fit');
  });

  await ok('a pupil joins with the class code, picks the name and logs in with the pictures', async () => {
    let r = await call('GET', `/api/school/join/${cls.code.toLowerCase()}`, { origin: null });
    assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.json.pupils.map(p => p.name).sort(), ['Noor bK./b', 'Sam B.']);
    assert.ok(!JSON.stringify(r.json).includes('picture'), 'the join list shows names only');
    const sam = pupils[0], wrong = sam.pictures.map(x => (x + 1) % 9);
    assert.strictEqual((await call('POST', '/api/school/pupil/login', { body: { code: cls.code, pupilId: sam.id, pictures: wrong } })).status, 401);
    r = await call('POST', '/api/school/pupil/login', { body: { code: cls.code, pupilId: sam.id, pictures: sam.pictures }, origin: 'capacitor://localhost' });
    assert.strictEqual(r.status, 200); token = r.json.token; assert.strictEqual(r.json.premium, true);
  });

  await ok('progress is saved and loaded with a version; an older version is refused', async () => {
    let r = await call('GET', '/api/school/pupil/state', { token });
    assert.deepStrictEqual(r.json, { state: null, version: 0 });
    const state = { name: 'Iets anders', answered: 20, correct: 15, quizzesPlayed: 2, xp: 250, progress: { worlds: { ruimte: {} }, games: { math: { played: 3, won: 2 } }, talen: { words: { 'en:dog': {}, 'en:cat': {} }, themes: { 'en:dieren': { stars: 2, played: 1 } } } } };
    r = await call('PUT', '/api/school/pupil/state', { token, body: { state, version: 0 } });
    assert.strictEqual(r.status, 200); version = r.json.version; assert.strictEqual(version, 1);
    r = await call('PUT', '/api/school/pupil/state', { token, body: { state, version: 0 } });
    assert.strictEqual(r.status, 409); assert.strictEqual(r.json.version, 1);
    r = await call('GET', '/api/school/pupil/state', { token });
    assert.strictEqual(r.json.state.name, 'Sam B.', 'the name stored is the school\'s display name');
    assert.strictEqual(r.json.state.answered, 20);
  });

  await ok('the teacher sees the pupil\'s progress in the class overview', async () => {
    const r = await call('GET', `/api/school/classes/${cls.id}/overview`, { cookie });
    const sam = r.json.pupils.find(p => p.name === 'Sam B.');
    assert.deepStrictEqual({ answered: sam.answered, correct: sam.correct, quizzes: sam.quizzes, level: sam.level, worlds: sam.worlds, math: sam.math, talen: sam.talen },
      { answered: 20, correct: 15, quizzes: 2, level: 3, worlds: 1, math: { played: 3, won: 2 }, talen: { words: 2, lessons: 1 } });
    assert.ok(sam.playedAt > 0);
  });

  await ok('five wrong picture codes lock the pupil for a while', async () => {
    const noor = pupils[1], wrong = noor.pictures.map(x => (x + 1) % 9);
    for (let i = 0; i < 5; i++) assert.strictEqual((await call('POST', '/api/school/pupil/login', { body: { code: cls.code, pupilId: noor.id, pictures: wrong } })).status, 401);
    assert.strictEqual((await call('POST', '/api/school/pupil/login', { body: { code: cls.code, pupilId: noor.id, pictures: noor.pictures } })).status, 423);
    // the teacher makes a new code, which also lifts the lock
    const r = await call('POST', `/api/school/pupils/${noor.id}/reset-code`, { cookie });
    assert.strictEqual((await call('POST', '/api/school/pupil/login', { body: { code: cls.code, pupilId: noor.id, pictures: r.json.pictures } })).status, 200);
  });

  await ok('another school\'s teacher sees none of it', async () => {
    const other = store.createSchool('Andere school', 10, '2099-07-31');
    const inv = store.inviteTeacher(other, 'meester@elders.nl', 'Meester Bas');
    const c2 = (await call('POST', '/api/school/teacher/invite/accept', { body: { token: inv, password: 'nog-een-wachtwoord' } })).cookie;
    assert.strictEqual((await call('GET', `/api/school/classes/${cls.id}/overview`, { cookie: c2 })).status, 404);
    assert.strictEqual((await call('DELETE', `/api/school/pupils/${pupils[0].id}`, { cookie: c2 })).status, 404);
    assert.deepStrictEqual((await call('GET', '/api/school/teacher/me', { cookie: c2 })).json.classes, []);
  });

  await ok('deleting a pupil removes the progress and ends the session', async () => {
    assert.strictEqual((await call('DELETE', `/api/school/pupils/${pupils[0].id}`, { cookie })).status, 200);
    assert.strictEqual((await call('GET', '/api/school/pupil/state', { token })).status, 401);
    assert.strictEqual(store.pupil(pupils[0].id), undefined);
  });

  await ok('an expired licence: pupils still log in, but without Premium', async () => {
    store.setLicense(schoolId, 3, '2020-01-01');
    const noor = store.pupilsOf(cls.id)[0];
    const pics = store.resetPictures(noor.id);
    const r = await call('POST', '/api/school/pupil/login', { body: { code: cls.code, pupilId: noor.id, pictures: pics } });
    assert.strictEqual(r.json.premium, false);
  });

  await ok('a teacher logs out', async () => {
    assert.strictEqual((await call('POST', '/api/school/teacher/logout', { cookie })).status, 200);
    assert.strictEqual((await call('GET', '/api/school/teacher/me', { cookie })).status, 401);
  });

  server.close();
  console.log(`\nKwizillo school API: ${n} checks OK`);
})().catch(e => { console.error(e); process.exit(1) });
