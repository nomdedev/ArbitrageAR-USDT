/**
 * Reproduce el modal de detalle de una ruta sobre la extension REAL y saca la evidencia:
 *  - el texto exacto de los valores (para saber si el decimal de USD usa coma o punto)
 *  - las medidas de la fila de pasos (si se corta por scroll o por overflow oculto)
 *  - una captura del modal
 *
 *   npx playwright test --config=playwright.capturas.config.js -g "modal"
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');
const SALIDA = path.join(EXT, 'docs', 'auditoria-2026-09', 'rediseno');
fs.mkdirSync(SALIDA, { recursive: true });

test('estado real del modal de detalle', async () => {
  test.setTimeout(240000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-modal-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 420, height: 760 },
  });

  try {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
    const id = sw.url().match(/^chrome-extension:\/\/([a-p]{32})\//)[1];

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${id}/src/popup.html`, { waitUntil: 'domcontentloaded' });
    await popup.waitForTimeout(9000);

    // Abrir el detalle de la primera ruta disponible
    const tarjeta = popup.locator('.route-card, .crypto-route-card').first();
    await tarjeta.waitFor({ state: 'visible', timeout: 20000 });
    await tarjeta.click();
    await popup.waitForTimeout(1500);

    const m = await popup.evaluate(() => {
      const modal = document.querySelector('#route-details-modal, dialog[open]');
      if (!modal) return { error: 'no se abrio el modal' };
      const fila = modal.querySelector('.route-visualization');
      const pasos = fila ? Array.from(fila.children).map((c) => c.className) : [];
      const primerPaso = fila ? fila.querySelector('.route-step') : null;
      const texto = modal.innerText;
      const interesantes = texto
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /USD obtenidos|Inversión|Precio dólar|Obtienes|USDT/i.test(l));
      return {
        fila: fila
          ? {
              scrollWidth: fila.scrollWidth,
              clientWidth: fila.clientWidth,
              overflowX: getComputedStyle(fila).overflowX,
              display: getComputedStyle(fila).display,
              pasos,
              primerPasoIzquierda: primerPaso
                ? Math.round(primerPaso.getBoundingClientRect().left)
                : null,
            }
          : '(sin .route-visualization)',
        lineasDeValores: interesantes,
        emojiEnPasos: (modal.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).join(' '),
        anchoModal: Math.round(modal.getBoundingClientRect().width),
      };
    });

    console.log('\n===== MODAL DE DETALLE (en vivo) =====');
    console.log(JSON.stringify(m, null, 2));
    console.log('======================================\n');

    await popup.screenshot({ path: path.join(SALIDA, 'modal-ruta-actual.png') });
    expect(m.error).toBeUndefined();
  } finally {
    await context.close();
  }
});
