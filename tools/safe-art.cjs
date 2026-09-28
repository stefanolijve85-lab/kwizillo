#!/usr/bin/env node
// Zet een verse render klaar als vraag-only plaat.
//
//   node tools/safe-art.cjs <id> <url|bestand> [<id> <url|bestand> …]
//
// Sommige vragen verraden zichzelf: een plaat bij "welke planeet is het
// dichtst bij de zon?" die Mercurius laat zien, geeft het antwoord weg. Voor
// die vragen (answer-art.js, K.artRevealsAnswer) staat er een tweede plaat in
// assets/questions/s/: dezelfde stijl en hetzelfde formaat, maar getekend bij
// de vráág — het toneel en het moment van je afvragen, zonder het antwoord.
// De opdrachten staan in tools/safe-art-prompts.json.
//
// Verder gelijk aan tools/question-art.cjs, met twee verschillen: de plaat gaat
// naar assets/questions/s/ en content/ blijft ongemoeid — de vraag heeft haar
// eigen plaat in q/ al, deze komt er alleen naast.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'questions', 's');
const W = 800, H = 450, QUALITY = 78;

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error('gebruik: node tools/safe-art.cjs <id> <url|bestand> [<id> <url|bestand> …]');
  process.exit(2);
}
const sips = (...a) => execFileSync('sips', a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const sizeOf = file => {
  const out = sips('-g', 'pixelWidth', '-g', 'pixelHeight', file);
  return { w: Number(out.match(/pixelWidth: (\d+)/)[1]), h: Number(out.match(/pixelHeight: (\d+)/)[1]) };
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kwizillo-safe-'));
for (let i = 0; i < args.length; i += 2) {
  const id = args[i], src = args[i + 1];
  let file = src;
  if (/^https?:/.test(src)) {
    file = path.join(tmp, `${id}.src`);
    execFileSync('curl', ['-sfL', '-o', file, src]);
  }
  if (!fs.existsSync(file)) { console.error(`${id}: ${src} kon niet gelezen worden`); continue }

  const { w, h } = sizeOf(file);
  const work = path.join(tmp, `${id}.work.png`);
  fs.copyFileSync(file, work);
  if (Math.abs(w / h - W / H) > 0.01) {
    const cw = Math.min(w, Math.round(h * W / H)), ch = Math.min(h, Math.round(w * H / W));
    sips('-c', String(ch), String(cw), work);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, `${id}.jpg`);
  sips('-z', String(H), String(W), '-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY), work, '--out', out);
  console.log(`${id}: ${w}x${h} → ${W}x${H} (${(fs.statSync(out).size / 1024).toFixed(0)} kB)`);
}
fs.rmSync(tmp, { recursive: true, force: true });
execFileSync('node', [path.join(__dirname, 'question-art-manifest.js')], { stdio: 'inherit' });
