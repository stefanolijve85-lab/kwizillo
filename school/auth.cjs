// Secrets for the school portal: passwords, picture codes, session and invite
// tokens, class codes. Everything that is checked later is stored only as a
// hash; nothing here leaves the server.
const crypto = require('crypto');

const SCRYPT = { N: 16384, r: 8, p: 1 };
function hashSecret(secret, salt = crypto.randomBytes(16)) {
  const key = crypto.scryptSync(String(secret), salt, 32, SCRYPT);
  return `s1$${salt.toString('base64')}$${key.toString('base64')}`;
}
function checkSecret(secret, stored) {
  const [v, salt, key] = String(stored || '').split('$');
  if (v !== 's1' || !salt || !key) return false;
  const want = Buffer.from(key, 'base64');
  const got = crypto.scryptSync(String(secret), Buffer.from(salt, 'base64'), want.length, SCRYPT);
  return crypto.timingSafeEqual(want, got);
}

// A token is handed out once and kept by the client; the database only has its SHA-256.
const newToken = () => crypto.randomBytes(32).toString('base64url');
const tokenHash = t => crypto.createHash('sha256').update(String(t)).digest('hex');

// Class codes are typed by children: six characters without 0/O, 1/I/L.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function classCode() {
  let s = ''; const b = crypto.randomBytes(6);
  for (const x of b) s += CODE_CHARS[x % CODE_CHARS.length];
  return s;
}
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

// A picture code: three of the nine pictures, in order (729 codes). Weak on its
// own; the login is protected by a lockout per pupil and a rate limit per class
// and address (api.cjs).
const PICTURES = 9, CODE_LEN = 3;
const pictureCode = () => Array.from({ length: CODE_LEN }, () => crypto.randomInt(PICTURES));
const validPictures = p => Array.isArray(p) && p.length === CODE_LEN && p.every(x => Number.isInteger(x) && x >= 0 && x < PICTURES);
const pictureSecret = p => p.join('-');

module.exports = { hashSecret, checkSecret, newToken, tokenHash, classCode, normCode, CODE_CHARS, pictureCode, validPictures, pictureSecret, PICTURES, CODE_LEN };
