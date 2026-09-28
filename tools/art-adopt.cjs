#!/usr/bin/env node
// Een tijdelijke plaat vervangen door een echte.
//
//   node tools/art-adopt.cjs assets/worlds/kunst.jpg assets/worlds/sport.jpg
//   node tools/art-adopt.cjs --all        → alles wat niet meer tijdelijk is
//   node tools/art-adopt.cjs --check      → alleen kijken, niets wijzigen
//
// tools/placeholder-art.cjs zet kleurverloopjes neer voor een wereld die nog
// geen geschilderde kunst heeft, en houdt in assets/placeholder-art.json bij
// welke dat zijn; npm test noemt dat aantal bij elke run. Zodra de echte plaat
// er staat moet hij uit die lijst, anders blijft de test een schuld melden die
// er niet meer is.
//
// Dit script controleert eerst of de nieuwe plaat klopt — bestaat hij, is het
// een JPEG, en heeft hij de maat die het spel voor dat soort plaat gebruikt —
// en haalt hem dan pas uit de lijst.
const fs = require('fs'); const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIST = path.join(ROOT, 'assets', 'placeholder-art.json');
const check = process.argv.includes('--check');
const all = process.argv.includes('--all');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));

// Wat het spel van elk soort plaat verwacht. De maten komen van de platen die
// er al zijn: de zes oude werelden, de 24 oude onderwerpen.
const KIND = [
  { dir: 'assets/worlds', w: 752, h: 1344, what: 'wereldplaat (staand, ook de tegel op Home)' },
  { dir: 'assets/topics', w: 1024, h: 576, what: 'onderwerpkaart (liggend)' },
  { dir: 'assets/questions/q', w: 800, h: 450, what: 'vraagplaat' },
];

// Genoeg van een JPEG lezen om de maat te weten: door de segmenten lopen tot
// de SOF-marker, daar staan hoogte en breedte in.
function jpegSize(file) {
  const b = fs.readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;            // geen JPEG
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const list = JSON.parse(fs.readFileSync(LIST, 'utf8'));
const files = args.length ? args.map(a => a.replace(/^\.\//, '')) : (all ? [...list.files] : []);
if (!files.length) {
  console.log('Niets te doen. Geef de platen op, of gebruik --all.');
  console.log(`Nog tijdelijk: ${list.files.length}`);
  for (const f of list.files) console.log('  ' + f);
  process.exit(0);
}

let adopted = 0, problems = 0;
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const kind = KIND.find(k => rel.startsWith(k.dir));
  const say = (mark, msg) => console.log(`  ${mark} ${rel} — ${msg}`);
  if (!list.files.includes(rel)) { say('·', 'stond niet in de lijst met tijdelijke platen'); continue }
  if (!fs.existsSync(abs)) { say('✗', 'bestaat niet'); problems++; continue }
  const size = jpegSize(abs);
  if (!size) { say('✗', 'is geen JPEG'); problems++; continue }
  if (kind && (size.w !== kind.w || size.h !== kind.h)) {
    say('✗', `is ${size.w}×${size.h}, de ${kind.what} moet ${kind.w}×${kind.h} zijn`);
    problems++; continue;
  }
  const kb = Math.round(fs.statSync(abs).size / 1024);
  if (kb < 40) { say('✗', `is maar ${kb} kB — dat is nog de tijdelijke plaat`); problems++; continue }
  say('✔', `${size.w}×${size.h}, ${kb} kB — echte plaat`);
  if (!check) { list.files = list.files.filter(f => f !== rel); adopted++ }
}

if (!check && adopted) {
  fs.writeFileSync(LIST, JSON.stringify(list, null, 2) + '\n');
  console.log(`\n${adopted} plaat/platen uit de lijst gehaald, ${list.files.length} nog tijdelijk.`);
  if (!list.files.length) console.log('Alle tijdelijke platen zijn vervangen.');
} else if (check) {
  console.log('\n--check: er is niets gewijzigd.');
}
process.exit(problems ? 1 : 0);
