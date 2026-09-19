/**
 * Verifica en vivo lo que arreglo el reapuntado de los tests con skip: que el boton X del modal de
 * detalles de ruta lo cierre de verdad.
 *
 * Contexto del bug: el modal es un <dialog> que el popup abre con showModal(). Su boton #modal-close y
 * el click en el overlay llaman a ModalManager.closeModal(), que arrancaba con
 *   if (!activeModal) { warn; return; }
 * y activeModal no se asignaba nunca al abrir (solo al desapilar el historial), asi que esa salida se
 * llevaba SIEMPRE la ejecucion: el X no cerraba nada. Ademas, el resto de la funcion escondia con
 * display:none el id fijo #route-details-modal, que en un <dialog> no cierra nada.
 *
 *   npx playwright test --config=playwright.capturas.config.js -g "cierre"
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');

test('el boton X cierra el modal de detalles de ruta', async () => {
  test.setTimeout(180000);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-cierre-'));
  const context = await chromium.launchPersistentContext(dir, {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 440, height: 780 },
  });

  try {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
    const id = sw.url().match(/^chrome-extension:\/\/([a-p]{32})\//)[1];

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${id}/src/popup.html`, { waitUntil: 'domcontentloaded' });
    await popup.waitForTimeout(9000);

    const card = popup.locator('.route-card').first();
    if (!(await card.count())) {
      test.skip(true, 'no hay tarjetas de ruta en esta corrida');
      return;
    }

    await card.click();
    await popup.waitForTimeout(1200);

    const estado = () =>
      popup.evaluate(() => {
        const d = document.getElementById('route-details-modal');
        if (!d) return { existe: false };
        // El popup no usa showModal(): abre con display:flex + .active
        const cs = getComputedStyle(d);
        return {
          existe: true,
          tag: d.tagName,
          atributoOpen: d.open,
          claseActive: d.classList.contains('active'),
          display: cs.display,
          // offsetParent es null en position:fixed (los modales lo son): no sirve como señal de visibilidad
          visible: cs.display !== 'none' && cs.visibility !== 'hidden',
        };
      });

    const abiertoAntes = await estado();
    console.log('\nmodal antes del click en X:', JSON.stringify(abiertoAntes));
    expect(abiertoAntes.visible, 'el modal no se abrio al clicar la tarjeta').toBe(true);

    // El boton X del modal
    const x = popup.locator('#modal-close').first();
    expect(await x.count(), 'no encontre #modal-close').toBeGreaterThan(0);
    await x.click();
    await popup.waitForTimeout(800);

    const abiertoDespues = await estado();
    console.log('modal despues del click en X:', JSON.stringify(abiertoDespues), '\n');

    expect(abiertoDespues.visible, 'el boton X no cerro el modal').toBe(false);

    // Y que se pueda volver a abrir (que no quede en un estado raro)
    await card.click();
    await popup.waitForTimeout(1000);
    const reabierto = await estado();
    expect(reabierto.visible, 'el modal no se pudo volver a abrir').toBe(true);
  } finally {
    await context.close();
  }
});
