// Regression cover for Phase 2.3.
//
// The dev server used to resolve any path under ROOT and serve it. Path traversal
// was blocked, but dotfiles and source were not: `/.git/config`, `/server.js` and
// `/.voice-selection-v35.json` all returned 200, and a `.env` holding the
// ElevenLabs key would have been readable by anyone on the same network.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.STATIC_TEST_PORT || 8123);
const BASE = `http://127.0.0.1:${PORT}`;
const ENV_PROBE = path.join(ROOT, '.env');

const MUST_BLOCK = [
  '/.git/config',
  '/.env',
  '/.gitignore',
  '/.voice-selection-v35.json',
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/playwright.config.js',
  '/start.command',
  '/AUDIT.md',
  '/tests/server-static.test.js',
  '/docs/reference/MILESTONE1.md',
  '/../../etc/passwd',
  '/%2e%2e/%2e%2e/etc/passwd',
  '/assets/../server.js'
];

const MUST_SERVE = [
  '/',
  '/index.html',
  '/intro.js',
  '/m1-ui.js',
  '/base.css',
  '/screens.css',
  '/assets/home.png',
  '/assets/audio/tap.wav'
];

async function waitForServer(){
  for (let i = 0; i < 60; i++) {
    try { await fetch(BASE + '/'); return; } catch { await new Promise(r => setTimeout(r, 100)); }
  }
  throw new Error('Server did not start');
}

(async () => {
  // A real secret file is the case that matters most, so create one for the test.
  fs.writeFileSync(ENV_PROBE, 'ELEVENLABS_API_KEY=sk_probe_value_used_only_by_this_test\n');
  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT), ELEVENLABS_API_KEY: '' }, stdio: 'ignore'
  });

  try {
    await waitForServer();

    for (const p of MUST_BLOCK) {
      const r = await fetch(BASE + p);
      assert.strictEqual(r.status, 404, `${p} must not be served (got ${r.status})`);
      const body = await r.text();
      assert.ok(!body.includes('sk_probe_value'), `${p} leaked secret content`);
    }

    for (const p of MUST_SERVE) {
      const r = await fetch(BASE + p);
      assert.strictEqual(r.status, 200, `${p} must still be served (got ${r.status})`);
    }

    // Errors must not carry upstream or configuration detail to the client.
    const bad = await fetch(BASE + '/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not json'
    });
    const payload = await bad.json();
    assert.ok(!/ELEVENLABS_API_KEY/i.test(JSON.stringify(payload)), 'TTS error leaked configuration detail');

    console.log('Kwizillo static-serving and TTS error-handling tests: OK');
  } finally {
    server.kill();
    fs.rmSync(ENV_PROBE, { force: true });
  }
})().catch(e => { fs.rmSync(ENV_PROBE, { force: true }); console.error(e); process.exit(1); });
