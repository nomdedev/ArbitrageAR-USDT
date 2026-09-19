/**
 * Config de Playwright para la verificación en vivo de las correcciones.
 * Corre SOLO `fixes-en-vivo.spec.js`, con la extensión real cargada y ventana visible.
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e/playwright',
  testMatch: ['**/fixes-en-vivo.spec.js'],
  timeout: 240 * 1000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off',
    // Sin esto, una accion sobre un elemento que no aparece espera hasta el timeout del test
    // y falla con "Test timeout" en lugar del motivo real.
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,
  },
  projects: [{ name: 'chromium-fixes-en-vivo', use: { browserName: 'chromium' } }],
});
