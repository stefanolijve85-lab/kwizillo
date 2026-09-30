const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  timeout: 45000,
  expect: { timeout: 6000 },
  use: {
    baseURL: 'http://127.0.0.1:8080',
    // A new player starts in the device language (state.js); the suite is
    // written against a Dutch device, like the product's first market.
    locale: 'nl-NL',
    viewport: { width: 430, height: 932 },
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 15000
  }
});
