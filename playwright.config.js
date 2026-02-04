const { defineConfig } = require('@playwright/test');
const path = require('path');

/**
 * Configuración de Playwright para tests E2E de Chrome Extension
 * Los tests cargan el popup.html directamente como archivo local
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e/playwright',
  
  // Timeout de 30 segundos por test
  timeout: 30 * 1000,
  
  // Configuración de expects
  expect: {
    timeout: 5000
  },
  
  // Configuración de reporte
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  // Configuración global
  use: {
    // Capturar screenshot solo en fallos
    screenshot: 'only-on-failure',
    
    // Capturar video solo en fallos
    video: 'retain-on-failure',
    
    // Trace solo en retry de tests fallidos
    trace: 'on-first-retry',
    
    // Headless mode - false para debugging, true para CI
    headless: true,
    
    // Tamaño de viewport (similar al popup de la extensión)
    viewport: { width: 400, height: 600 },
    
    // Base URL para tests locales
    baseURL: `file://${path.resolve(__dirname, 'src')}/`
  },

  // Proyectos de test
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium'
      }
    }
  ]
});
