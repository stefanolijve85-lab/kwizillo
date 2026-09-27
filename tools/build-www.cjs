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

const SKIP_JS = new Set(['server.js', 'playwright.config.js', 'capacitor.config.js']);
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
const csp = html.match(/content="(default-src[^"]+)"/);
if (!csp) throw new Error('content security policy not found in index.html');
html = html.replace(csp[1], csp[1].replace("connect-src 'self'", `connect-src 'self' ${API_HOST}`));
if (!html.includes(`connect-src 'self' ${API_HOST}`)) throw new Error('could not point the content policy at the proxy');
fs.writeFileSync(path.join(OUT, 'index.html'), html);

const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`www/: ${fs.readdirSync(OUT).length} entries, ${(size(OUT) / 1048576).toFixed(0)} MB, speech via ${API_HOST}`);
