// Blokkenpret suite on its own port (8096), so it can run next to the other
// checkouts' servers (8080, 8097, 8099).
//   npx playwright test -c tests/playwright.blokken.config.js
//   npx playwright test -c tests/playwright.blokken.config.js --project=webkit
const { defineConfig, devices } = require('@playwright/test');
const base = require('../playwright.config.js');
const PORT = Number(process.env.BLOKKEN_PORT || 8096);
module.exports = defineConfig({
  ...base,
  testDir: '.',
  testMatch: /blokken\.spec\.js$/,
  use: { ...base.use, baseURL: `http://127.0.0.1:${PORT}` },
  webServer: { command: `PORT=${PORT} node server.js`, cwd: require('path').join(__dirname, '..'), url: `http://127.0.0.1:${PORT}`, reuseExistingServer: true, timeout: 15000 },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
    { name: 'firefox', use: { browserName: 'firefox' } }
  ]
});
