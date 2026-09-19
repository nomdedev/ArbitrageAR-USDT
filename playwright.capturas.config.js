/**
 * Config de Playwright para capturas de la interfaz en la extensión real.
 *   PREFIJO=antes npx playwright test --config=playwright.capturas.config.js
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e/playwright',
  testMatch: ['**/captura-options.spec.js', '**/captura-popup.spec.js', '**/verificar-apple-popup.spec.js', '**/diagnostico-modal.spec.js', '**/verificar-guia-modal.spec.js', '**/auditar-contraste.spec.js', '**/verificar-chips.spec.js'],
  timeout: 180 * 1000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { screenshot: 'off', video: 'off', trace: 'off' },
  projects: [{ name: 'chromium-capturas', use: { browserName: 'chromium' } }],
});
