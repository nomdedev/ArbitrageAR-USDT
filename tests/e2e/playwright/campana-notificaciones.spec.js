// La campana del encabezado enciende/apaga notificationSettings.notificationsEnabled.
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

test('la campana alterna notificationsEnabled y el estado se conserva', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'campana-'));
  const raiz = path.resolve(__dirname, '..', '..', '..');
  const context = await chromium.launchPersistentContext(dir, {
    headless: false,
    args: [`--disable-extensions-except=${raiz}`, `--load-extension=${raiz}`]
  });
  try {
    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
    const id = sw.url().split('/')[2];
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${id}/src/popup.html`, { waitUntil: 'domcontentloaded' });
    const campana = popup.locator('#notifications-toggle');
    await expect(campana).toHaveAttribute('aria-pressed', 'true');

    await campana.click();
    await expect(campana).toHaveAttribute('aria-pressed', 'false');
    const apagada = await popup.evaluate(
      () =>
        new Promise(r =>
          chrome.storage.local.get('notificationSettings', v =>
            r(v.notificationSettings.notificationsEnabled)
          )
        )
    );
    expect(apagada).toBe(false);

    await popup.reload({ waitUntil: 'domcontentloaded' });
    await expect(popup.locator('#notifications-toggle')).toHaveAttribute('aria-pressed', 'false');
    await popup.locator('#notifications-toggle').click();
    await expect(popup.locator('#notifications-toggle')).toHaveAttribute('aria-pressed', 'true');
    await popup.screenshot({
      path: path.join(raiz, 'docs/auditoria-2026-09/rediseno/campana-encabezado.png'),
      clip: { x: 0, y: 0, width: 420, height: 160 }
    });
  } finally {
    await context.close();
  }
});
