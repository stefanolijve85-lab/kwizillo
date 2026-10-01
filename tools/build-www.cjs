#!/usr/bin/env node
// Builds `www/` — the exact set of files the iOS app ships — from the repository
// root: the page, the game's scripts and styles, and `assets/`. Nothing else
// (server, tools, tests, docs, incoming renders) gets in. The page's config block
// is rewritten so the app talks to the production speech proxy over HTTPS; the
// ElevenLabs key never leaves that server.
//
//   node tools/build-www.cjs                 → www/  (API_HOST default https://app.kwizillo.nl)
//   API_HOST=https://app.kwizillo.com node tools/build-www.cjs
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'www');
const API_HOST = (process.env.API_HOST || 'https://app.kwizillo.nl').replace(/\/$/, '');

const SKIP_JS = new Set(['server.js', 'speech-config.js', 'playwright.config.js', 'capacitor.config.js']);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });

// scripts and styles the page references, plus the generated manifests
for (const f of fs.readdirSync(ROOT)) {
  if ((f.endsWith('.js') && !SKIP_JS.has(f)) || f.endsWith('.css')) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
// assets, whole tree
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
// the configuration, pointed at the production proxy
let cfg = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
cfg = cfg.replace(/elevenLabsProxyUrl:\s*'[^']*'/, `elevenLabsProxyUrl: '${API_HOST}/api/tts'`)
         .replace(/voiceStatusUrl:\s*'[^']*'/, `voiceStatusUrl: '${API_HOST}/api/voice-status'`);
if (!cfg.includes(`${API_HOST}/api/tts`)) throw new Error('config block not found in config.js');
fs.writeFileSync(path.join(OUT, 'config.js'), cfg);

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// The bundled page runs on capacitor://localhost, so the speech proxy is cross-origin:
// it is the one host the content policy may reach, and it is named explicitly.
// Both directives are widened: the lines fetched ahead of time are connections,
// and the line that streams is played straight from that host by an <audio>.
const csp = html.match(/content="(default-src[^"]+)"/);
if (!csp) throw new Error('content security policy not found in index.html');
html = html.replace(csp[1], csp[1]
  .replace("connect-src 'self'", `connect-src 'self' ${API_HOST}`)
  .replace("media-src 'self' data: blob:", `media-src 'self' data: blob: ${API_HOST}`));
for (const need of [`connect-src 'self' ${API_HOST}`, `media-src 'self' data: blob: ${API_HOST}`]) {
  if (!html.includes(need)) throw new Error('could not point the content policy at the proxy');
}
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// Pictures for the app: the JPEGs in assets/ are kept in the repository at a high
// quality (they are the masters every picture is regenerated from). The app gets
// them re-encoded at JPEG quality q:v 5 — on 800x450 question art that is about
// half the size with no difference to see (SSIM ≈ .975, checked side by side at
// 2x). A file is only replaced when the result is smaller. Needs ffmpeg
// (tools/bin/ffmpeg or on the PATH); without it the masters ship as they are.
// Loose development files never ship.
const { execFile } = require('child_process');
const FF = fs.existsSync(path.join(__dirname, 'bin', 'ffmpeg')) ? path.join(__dirname, 'bin', 'ffmpeg') : 'ffmpeg';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(path.join(OUT, 'assets'));
// app-icon-1024.png is the master for the Xcode asset catalog, not a game asset.
// The tour clips (worlds, hud, nav, done) are never played: the Home tour speaks
// with the drawn mouth on purpose (milo.js). About 16 MB the store limits need.
const UNUSED = /(\.DS_Store|\.md|\.keep|app-icon-1024\.png|\/talk\/[a-z]{2}\/(worlds|hud|nav|done|games)\.(mp4|webm))$/;
for (const f of files) if (UNUSED.test(f)) fs.rmSync(f);
const jpgs = files.filter(f => /\.jpe?g$/i.test(f) && fs.existsSync(f));
const recompress = f => new Promise(res => {
  const tmp = f + '.q5.jpg';
  execFile(FF, ['-y', '-loglevel', 'error', '-i', f, '-q:v', '5', tmp], err => {
    if (err) { try { fs.rmSync(tmp, { force: true }) } catch {} return res(err.code === 'ENOENT' ? 'noffmpeg' : 0) }
    const a = fs.statSync(f).size, b = fs.statSync(tmp).size;
    if (b < a) { fs.renameSync(tmp, f); res(a - b) } else { fs.rmSync(tmp); res(0) }
  });
});

const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
(async () => {
  let saved = 0, noFF = false;
  for (let i = 0; i < jpgs.length; i += 8) {
    const r = await Promise.all(jpgs.slice(i, i + 8).map(recompress));
    for (const x of r) { if (x === 'noffmpeg') noFF = true; else saved += x }
    if (noFF) break;
  }
  if (noFF) console.warn('ffmpeg not found: pictures ship at their master quality');
  else console.log(`pictures: ${jpgs.length} JPEGs re-encoded, ${(saved / 1048576).toFixed(0)} MB saved`);
  console.log(`www/: ${fs.readdirSync(OUT).length} entries, ${(size(OUT) / 1048576).toFixed(0)} MB, speech via ${API_HOST}`);
})();
