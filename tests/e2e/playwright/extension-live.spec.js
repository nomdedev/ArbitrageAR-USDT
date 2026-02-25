const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

function getExtensionId(serviceWorkerUrl) {
  const match = serviceWorkerUrl.match(/^chrome-extension:\/\/([a-p]{32})\//);
  return match ? match[1] : null;
}

async function waitUntilPopupSettles(popup, timeoutMs = 45000) {
  await popup.waitForFunction(() => {
    const loading = document.getElementById('loading');
    const routes = document.getElementById('optimized-routes');

    if (!loading || !routes) return false;

    const loadingStyles = window.getComputedStyle(loading);
    const loadingVisible =
      loadingStyles.display !== 'none' &&
      loadingStyles.visibility !== 'hidden' &&
      loadingStyles.opacity !== '0';

    if (loadingVisible) return false;

    const terminalSelectors = [
      '.route-card',
      '.arbitrage-card',
      '.error-container',
      '.error-state',
      '.empty-state',
      '.warning',
      '.info',
      '.btn-retry'
    ];

    const hasTerminalNode = terminalSelectors.some(selector => routes.querySelector(selector));
    const hasTerminalText = routes.textContent && routes.textContent.trim().length > 0;

    return Boolean(hasTerminalNode || hasTerminalText);
  }, { timeout: timeoutMs });
}

async function assertSettledState(popup) {
  const settledState = await popup.evaluate(() => {
    const loading = document.getElementById('loading');
    const routes = document.getElementById('optimized-routes');
    const loadingStyles = loading ? window.getComputedStyle(loading) : null;

    return {
      loadingDisplay: loadingStyles ? loadingStyles.display : null,
      loadingVisibility: loadingStyles ? loadingStyles.visibility : null,
      routesText: routes ? (routes.textContent || '').trim().slice(0, 200) : null,
      routeCards: routes ? routes.querySelectorAll('.route-card, .arbitrage-card').length : 0,
      hasRetry: routes ? Boolean(routes.querySelector('.btn-retry')) : false,
      hasErrorContainer: routes ? Boolean(routes.querySelector('.error-container, .error-state')) : false,
      hasInfoOrWarning: routes ? Boolean(routes.querySelector('.info, .warning, .empty-state')) : false
    };
  });

  expect(settledState.loadingDisplay).toBe('none');
  expect(
    settledState.routeCards > 0 ||
      settledState.hasRetry ||
      settledState.hasErrorContainer ||
      settledState.hasInfoOrWarning ||
      (settledState.routesText && settledState.routesText.length > 0)
  ).toBe(true);
}

test.describe('Extension MV3 Live', () => {
  test.setTimeout(90000);

  test('carga service worker y el popup no queda calculando rutas indefinidamente', async () => {
    const extensionPath = path.resolve(__dirname, '../../../');
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-arbitrars-'));

    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });

    try {
      let [serviceWorker] = context.serviceWorkers();
      if (!serviceWorker) {
        serviceWorker = await context.waitForEvent('serviceworker', { timeout: 30000 });
      }

      expect(serviceWorker).toBeTruthy();
      const extensionId = getExtensionId(serviceWorker.url());
      expect(extensionId).toBeTruthy();

      const popup = await context.newPage();
      await popup.goto(`chrome-extension://${extensionId}/src/popup.html`, {
        waitUntil: 'domcontentloaded'
      });

      await expect(popup.locator('body')).toBeVisible();
      await expect(popup.locator('.app-title, h1').first()).toBeVisible();
      await expect(popup.locator('#refresh, [aria-label*="Actualizar"]').first()).toBeVisible();
      await expect(popup.locator('#settings, [aria-label*="configuración"]').first()).toBeVisible();
      await expect(popup.locator('.filter-btn-footer')).toHaveCount(3);
      await expect(popup.locator('text=Error al cargar la extensión')).toHaveCount(0);

      await waitUntilPopupSettles(popup, 45000);
      await assertSettledState(popup);

      const refreshButton = popup.locator('#refresh, [aria-label*="Actualizar"]').first();
      for (let attempt = 1; attempt <= 3; attempt++) {
        await refreshButton.click();
        await waitUntilPopupSettles(popup, 45000);
        await assertSettledState(popup);
      }
    } finally {
      await context.close();
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {
      }
    }
  });
});
