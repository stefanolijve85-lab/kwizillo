#!/usr/bin/env node
// Takes a freshly generated illustration and makes it a question picture.
//
//   node tools/question-art.cjs <id> <url|file> [<id> <url|file> …]
//
// The bank shows one 16:9 illustration per question at 800x450. Generators hand
// back 1280x720 PNGs of a megabyte and a half; this downloads them, centre-crops
// to 16:9 if they came back some other shape, writes a JPEG of about sixty
// kilobytes into assets/questions/q/, marks the question in content/ as no
// longer waiting for art, and regenerates the manifest the app reads.
//
// sips ships with macOS, so there is nothing to install.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'questions', 'q');
const W = 800, H = 450, QUALITY = 78;

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error('usage: node tools/question-art.cjs <id> <url|file> [<id> <url|file> …]');
  process.exit(2);
}
const sips = (...a) => execFileSync('sips', a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const sizeOf = file => {
  const out = sips('-g', 'pixelWidth', '-g', 'pixelHeight', file);
  return { w: Number(out.match(/pixelWidth: (\d+)/)[1]), h: Number(out.match(/pixelHeight: (\d+)/)[1]) };
};

const done = [];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kwizillo-art-'));
for (let i = 0; i < args.length; i += 2) {
  const id = args[i], src = args[i + 1];
  let file = src;
  if (/^https?:/.test(src)) {
    file = path.join(tmp, `${id}.src`);
    execFileSync('curl', ['-sfL', '-o', file, src]);
  }
  if (!fs.existsSync(file)) { console.error(`${id}: ${src} could not be read`); continue }

  const { w, h } = sizeOf(file);
  const work = path.join(tmp, `${id}.work.png`);
  fs.copyFileSync(file, work);
  // Centre-crop to 16:9 first, so nothing is ever squashed.
  if (Math.abs(w / h - W / H) > 0.01) {
    const cw = Math.min(w, Math.round(h * W / H)), ch = Math.min(h, Math.round(w * H / W));
    sips('-c', String(ch), String(cw), work);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, `${id}.jpg`);
  sips('-z', String(H), String(W), '-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY), work, '--out', out);
  const kb = fs.statSync(out).size / 1024;
  console.log(`${id}: ${w}x${h} → ${W}x${H} (${kb.toFixed(0)} kB)`);
  done.push(id);
}
fs.rmSync(tmp, { recursive: true, force: true });

// content/ keeps the record of which questions still owe a picture.
const dir = path.join(ROOT, 'content');
if (fs.existsSync(dir)) {
  for (const sub of fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory())) {
    for (const f of fs.readdirSync(path.join(dir, sub.name)).filter(f => f.endsWith('.json'))) {
      const file = path.join(dir, sub.name, f);
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
      let touched = false;
      for (const q of doc.questions || []) if (done.includes(q.id) && q.art !== 'own') { q.art = 'own'; touched = true }
      if (touched) fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
    }
  }
}
execFileSync('node', [path.join(__dirname, 'question-art-manifest.js')], { stdio: 'inherit' });
