#!/usr/bin/env node
// Een gegenereerde render tot onderwerpkaart maken.
//
//   node tools/topic-art.cjs <onderwerp> <url|bestand> [<onderwerp> <url|bestand> …]
//
// Elk van de 32 onderwerpen heeft één liggende kaart van 1024 bij 576
// (assets/topics/<onderwerp>.jpg): op het wereldscherm de vier kaarten onder de
// held, en in de quiz de terugvalplaat voor een vraag die nog geen eigen plaat
// heeft. Generatoren leveren 16:9 PNG's van ruim een megabyte; dit haalt ze op,
// snijdt zo nodig naar 16:9 en schrijft een JPEG van een paar honderd kilobyte.
//
// sips zit in macOS, dus er is niets te installeren. Daarna:
//   node tools/art-adopt.cjs assets/topics/<onderwerp>.jpg
const fs = require('fs'); const path = require('path'); const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'topics');
const W = 1024, H = 576, QUALITY = 82;

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error('gebruik: node tools/topic-art.cjs <onderwerp> <url|bestand> […]');
  process.exit(2);
}
const sips = (...a) => execFileSync('sips', a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const sizeOf = f => {
  const o = sips('-g', 'pixelWidth', '-g', 'pixelHeight', f);
  return { w: Number(o.match(/pixelWidth: (\d+)/)[1]), h: Number(o.match(/pixelHeight: (\d+)/)[1]) };
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kwizillo-topic-'));
for (let i = 0; i < args.length; i += 2) {
  const topic = args[i], src = args[i + 1];
  let file = src;
  if (/^https?:/.test(src)) {
    file = path.join(tmp, `${topic}.src`);
    execFileSync('curl', ['-sfL', '-o', file, src]);
  }
  const work = path.join(tmp, `${topic}.work`);
  fs.copyFileSync(file, work);
  // Kwam de render in een andere verhouding terug, dan eerst een band van 16:9
  // uit het midden; anders zou sips hem platdrukken.
  const s = sizeOf(work);
  if (Math.abs(s.w / s.h - W / H) > 0.01) {
    const cw = Math.min(s.w, Math.round(s.h * W / H));
    const ch = Math.min(s.h, Math.round(s.w * H / W));
    sips('-c', String(ch), String(cw), work);
  }
  sips('-z', String(H), String(W), '-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY), work,
       '--out', path.join(OUT, `${topic}.jpg`));
  const kb = Math.round(fs.statSync(path.join(OUT, `${topic}.jpg`)).size / 1024);
  console.log(`assets/topics/${topic}.jpg: ${W}×${H}, ${kb} kB — bron ${s.w}×${s.h}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log('\nDaarna: node tools/art-adopt.cjs ' + args.filter((_, i) => !(i % 2)).map(t => `assets/topics/${t}.jpg`).join(' '));
