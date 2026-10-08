// The school portal's data: one SQLite file (node:sqlite, Node >= 22.13).
// Per pupil only a display name (first name + initial), a hashed picture code
// and the game state the app already keeps locally (docs/SCHOLENPORTAAL.md).
const { DatabaseSync } = require('node:sqlite');
const A = require('./auth.cjs');

const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, seats INTEGER NOT NULL DEFAULT 0,
  valid_until TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, password TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS invites (
  token_hash TEXT PRIMARY KEY, teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY, school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, language TEXT NOT NULL DEFAULT 'nl',
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS pupils (
  id INTEGER PRIMARY KEY, class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL, picture_code TEXT NOT NULL,
  state TEXT, version INTEGER NOT NULL DEFAULT 0, played_at INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('teacher','pupil')),
  subject_id INTEGER NOT NULL, created_at INTEGER NOT NULL, seen_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS pupils_class ON pupils(class_id);
CREATE INDEX IF NOT EXISTS sessions_subject ON sessions(kind, subject_id);
`;

// Teacher sessions last 30 days at most and lapse after 7 idle days; a pupil
// session lapses after 12 idle hours (shared Chromebooks).
const LIFE = { teacher: { max: 30 * 864e5, idle: 7 * 864e5 }, pupil: { max: 30 * 864e5, idle: 12 * 36e5 } };

function open(file) {
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  const q = sql => db.prepare(sql);
  const now = () => Date.now();
  const tx = fn => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r } catch (e) { db.exec('ROLLBACK'); throw e } };

  const S = {
    db,
    /* ---- beheer (tools/school-admin.cjs) ---- */
    createSchool: (name, seats, validUntil) => Number(q('INSERT INTO schools(name,seats,valid_until) VALUES (?,?,?)').run(name, seats, validUntil).lastInsertRowid),
    setLicense: (schoolId, seats, validUntil) => q('UPDATE schools SET seats=?, valid_until=? WHERE id=?').run(seats, validUntil, schoolId),
    school: id => q('SELECT * FROM schools WHERE id=?').get(id),
    schools: () => q('SELECT s.*, (SELECT COUNT(*) FROM pupils p JOIN classes c ON c.id=p.class_id WHERE c.school_id=s.id) AS pupils FROM schools s ORDER BY id').all(),
    licenseOk: school => !!school && school.valid_until && new Date(school.valid_until + 'T23:59:59Z').getTime() >= now(),
    // A teacher is created without a password and gets an invite link (7 days).
    inviteTeacher(schoolId, email, name) {
      return tx(() => {
        let t = q('SELECT * FROM teachers WHERE email=?').get(email);
        if (!t) t = { id: Number(q('INSERT INTO teachers(school_id,email,name) VALUES (?,?,?)').run(schoolId, email, name).lastInsertRowid) };
        const token = A.newToken();
        q('INSERT INTO invites(token_hash,teacher_id,expires_at) VALUES (?,?,?)').run(A.tokenHash(token), t.id, now() + 7 * 864e5);
        return token;
      });
    },
    acceptInvite(token, password) {
      return tx(() => {
        const inv = q('SELECT * FROM invites WHERE token_hash=?').get(A.tokenHash(token));
        if (!inv || inv.expires_at < now()) return null;
        q('UPDATE teachers SET password=? WHERE id=?').run(A.hashSecret(password), inv.teacher_id);
        q('DELETE FROM invites WHERE teacher_id=?').run(inv.teacher_id);
        q("DELETE FROM sessions WHERE kind='teacher' AND subject_id=?").run(inv.teacher_id);
        return inv.teacher_id;
      });
    },
    teacherByLogin(email, password) {
      const t = q('SELECT * FROM teachers WHERE email=?').get(String(email || ''));
      // the hash is always computed, so a wrong address takes as long as a wrong password
      const ok = A.checkSecret(password, t?.password || A.hashSecret('x'));
      return t && t.password && ok ? t : null;
    },
    teacher: id => q('SELECT id, school_id, email, name FROM teachers WHERE id=?').get(id),

    /* ---- sessies ---- */
    startSession(kind, subjectId) {
      const token = A.newToken(), t = now();
      q('INSERT INTO sessions(token_hash,kind,subject_id,created_at,seen_at) VALUES (?,?,?,?,?)').run(A.tokenHash(token), kind, subjectId, t, t);
      return token;
    },
    session(kind, token) {
      if (!token) return null;
      const h = A.tokenHash(token), s = q('SELECT * FROM sessions WHERE token_hash=? AND kind=?').get(h, kind);
      if (!s) return null;
      const t = now(), L = LIFE[kind];
      if (t - s.created_at > L.max || t - s.seen_at > L.idle) { q('DELETE FROM sessions WHERE token_hash=?').run(h); return null }
      if (t - s.seen_at > 60e3) q('UPDATE sessions SET seen_at=? WHERE token_hash=?').run(t, h);
      return s;
    },
    endSession: token => q('DELETE FROM sessions WHERE token_hash=?').run(A.tokenHash(token)),

    /* ---- klassen en leerlingen ---- */
    createClass(schoolId, teacherId, name, language = 'nl') {
      for (let i = 0; i < 20; i++) {
        const code = A.classCode();
        try { const id = Number(q('INSERT INTO classes(school_id,teacher_id,name,code,language) VALUES (?,?,?,?,?)').run(schoolId, teacherId, name, code, language).lastInsertRowid); return { id, name, code, language } }
        catch (e) { if (!/UNIQUE/.test(e.message)) throw e }
      }
      throw new Error('no free class code');
    },
    classesOf: teacherId => q('SELECT c.*, (SELECT COUNT(*) FROM pupils p WHERE p.class_id=c.id) AS pupils FROM classes c WHERE c.teacher_id=? ORDER BY c.name').all(teacherId),
    classOwned: (classId, teacherId) => q('SELECT * FROM classes WHERE id=? AND teacher_id=?').get(classId, teacherId),
    classByCode: code => q('SELECT * FROM classes WHERE code=?').get(A.normCode(code)),
    seatsUsed: schoolId => q('SELECT COUNT(*) AS n FROM pupils p JOIN classes c ON c.id=p.class_id WHERE c.school_id=?').get(schoolId).n,
    // Returns the new pupils with their picture codes: shown once, for the login cards.
    addPupils(classId, names) {
      return tx(() => names.map(name => {
        const code = A.pictureCode();
        const id = Number(q('INSERT INTO pupils(class_id,display_name,picture_code) VALUES (?,?,?)').run(classId, name, A.hashSecret(A.pictureSecret(code))).lastInsertRowid);
        return { id, name, pictures: code };
      }));
    },
    pupilsOf: classId => q('SELECT id, display_name AS name FROM pupils WHERE class_id=? ORDER BY display_name COLLATE NOCASE').all(classId),
    pupil: id => q('SELECT * FROM pupils WHERE id=?').get(id),
    pupilOwned: (pupilId, teacherId) => q('SELECT p.* FROM pupils p JOIN classes c ON c.id=p.class_id WHERE p.id=? AND c.teacher_id=?').get(pupilId, teacherId),
    resetPictures(pupilId) {
      const code = A.pictureCode();
      q('UPDATE pupils SET picture_code=? WHERE id=?').run(A.hashSecret(A.pictureSecret(code)), pupilId);
      q("DELETE FROM sessions WHERE kind='pupil' AND subject_id=?").run(pupilId);
      return code;
    },
    deletePupil(pupilId) {
      return tx(() => { q("DELETE FROM sessions WHERE kind='pupil' AND subject_id=?").run(pupilId); return q('DELETE FROM pupils WHERE id=?').run(pupilId).changes });
    },
    checkPictures: (pupil, pictures) => A.checkSecret(A.pictureSecret(pictures), pupil.picture_code),

    /* ---- voortgang ---- */
    state(pupilId) { const p = q('SELECT state, version FROM pupils WHERE id=?').get(pupilId); return p ? { state: p.state ? JSON.parse(p.state) : null, version: p.version } : null },
    // Optimistic: a write must name the version it was based on; an older one is refused.
    saveState(pupilId, state, version) {
      const r = q('UPDATE pupils SET state=?, version=version+1, played_at=? WHERE id=? AND version=?').run(JSON.stringify(state), now(), pupilId, version);
      return r.changes ? version + 1 : null;
    },
    overview: classId => q('SELECT id, display_name AS name, state, played_at FROM pupils WHERE class_id=? ORDER BY display_name COLLATE NOCASE').all(classId).map(p => ({ id: p.id, name: p.name, playedAt: p.played_at, ...summarise(p.state ? JSON.parse(p.state) : null) })),
  };
  return S;
}

// What a teacher sees of a pupil, read from the game state (state.js).
function summarise(s) {
  if (!s) return { answered: 0, correct: 0, quizzes: 0, level: 1, worlds: 0, math: { played: 0, won: 0 }, talen: { words: 0, lessons: 0 } };
  const p = s.progress || {}, talen = p.talen || {};
  return {
    answered: Number(s.answered || 0), correct: Number(s.correct || 0), quizzes: Number(s.quizzesPlayed || 0),
    level: 1 + Math.floor(Number(s.xp || 0) / 100),
    worlds: Object.keys(p.worlds || {}).length,
    math: { played: Number(p.games?.math?.played || 0), won: Number(p.games?.math?.won || 0) },
    talen: { words: Object.keys(talen.words || {}).length, lessons: Object.values(talen.themes || {}).reduce((n, x) => n + Number(x?.played || 0), 0) },
  };
}

module.exports = { open, summarise, LIFE };
