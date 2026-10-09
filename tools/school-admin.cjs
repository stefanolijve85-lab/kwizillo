#!/usr/bin/env node
// Beheer van Kwizillo voor scholen, op de server zelf (docs/SCHOLENPORTAAL.md).
// Er is geen open aanmelding: Kwizillo maakt de school, de licentie en de eerste
// leerkracht aan; de leerkracht kiest zelf een wachtwoord via de uitnodigingslink.
//
//   SCHOOL_DB=/var/lib/kwizillo/kwizillo-school.db node tools/school-admin.cjs <opdracht>
//
//   schools                                              alle scholen met licentie en aantal leerlingen
//   add-school "Montessorischool Emmen" 120 2027-08-31   school met 120 plaatsen tot en met die datum
//   licence <schoolId> <plaatsen> <tot-en-met>           licentie aanpassen
//   invite <schoolId> <e-mail> "<naam>"                  uitnodigingslink voor een leerkracht (7 dagen geldig)
//   reset <e-mail>                                       link voor een nieuw wachtwoord (24 uur geldig), als de e-mail niet aankomt
//
// SCHOOL_URL (standaard https://school.kwizillo.nl) bepaalt het adres in de link.
const path = require('path');
const file = process.env.SCHOOL_DB;
if (!file) { console.error('Zet SCHOOL_DB op het pad van de database.'); process.exit(1) }
const store = require(path.join(__dirname, '..', 'school', 'store.cjs')).open(file);
const BASE = (process.env.SCHOOL_URL || 'https://school.kwizillo.nl').replace(/\/$/, '');
const [cmd, ...a] = process.argv.slice(2);
const date = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) { console.error('Datum als JJJJ-MM-DD'); process.exit(1) } return s };
const int = s => { const n = Number(s); if (!Number.isInteger(n) || n < 0) { console.error('Geen geldig getal: ' + s); process.exit(1) } return n };

if (cmd === 'schools') {
  for (const s of store.schools()) console.log(`${s.id}  ${s.name}  ${s.pupils}/${s.seats} leerlingen  licentie t/m ${s.valid_until || '-'}${store.licenseOk(s) ? '' : '  (verlopen)'}`);
} else if (cmd === 'add-school' && a.length === 3) {
  console.log('school', store.createSchool(a[0], int(a[1]), date(a[2])), 'aangemaakt');
} else if (cmd === 'licence' && a.length === 3) {
  store.setLicense(int(a[0]), int(a[1]), date(a[2])); console.log('licentie bijgewerkt');
} else if (cmd === 'invite' && a.length === 3) {
  if (!store.school(int(a[0]))) { console.error('School bestaat niet'); process.exit(1) }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a[1])) { console.error('Geen geldig e-mailadres'); process.exit(1) }
  const token = store.inviteTeacher(int(a[0]), a[1], a[2]);
  console.log(`Uitnodiging voor ${a[2]} (7 dagen geldig):\n${BASE}/leraar/#uitnodiging=${token}`);
} else if (cmd === 'reset' && a.length === 1) {
  const r = store.resetToken(a[0].toLowerCase(), 24 * 36e5);
  if (!r) { console.error('Geen leerkracht met dit e-mailadres'); process.exit(1) }
  console.log(`Link voor een nieuw wachtwoord voor ${r.teacher.name} (24 uur geldig):\n${BASE}/leraar/#herstel=${r.token}`);
} else {
  console.log(require('fs').readFileSync(__filename, 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n'));
  process.exit(cmd ? 1 : 0);
}
