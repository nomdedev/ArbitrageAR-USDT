const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e/playwright',
  testMatch: ['**/extension-live.spec.js'],
  timeout: 90 * 1000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium-extension-live',
      use: {
        browserName: 'chromium'
      }
    }
  ]
});
