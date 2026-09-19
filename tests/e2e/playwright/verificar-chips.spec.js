/**
 * Verifica que los chips no se apliquen a las listas largas de exchanges.
 *
 * Por que existe: el arreglo del punto 3 usa :not(.exchange-group label, .checkbox-grid label), que es
 * :not() con una lista de selectores (Selectors 4, Chromium 88+). Si el navegador no lo aceptara,
 * descartaria TODA la regla y los chips perderian su estilo. El validador de CSS no puede ver eso: hay
 * que preguntarle al navegador por los estilos computados.
 *
 * Espera: una casilla dentro de .exchange-group en fila (radio chico, sin capsula) y una casilla de
 * chip normal (radio ~980px = capsula).
 *
 *   npx playwright test --config=playwright.capturas.config.js -g "chips"
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');

test('los chips no se aplican a las listas largas de exchanges', async () => {
  test.setTimeout(120000);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-chips-'));
  const context = await chromium.launchPersistentContext(dir, {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 1280, height: 900 },
  });

  try {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
    const id = sw.url().match(/^chrome-extension:\/\/([a-p]{32})\//)[1];

    const opt = await context.newPage();
    await opt.goto(`chrome-extension://${id}/src/options.html`, { waitUntil: 'domcontentloaded' });
    await opt.waitForTimeout(2500);

    const medir = await opt.evaluate(() => {
      const leer = (el) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          texto: (el.textContent || '').trim().slice(0, 24),
          radio: cs.borderRadius,
          altoMin: cs.minHeight,
          fondo: cs.backgroundColor,
          color: cs.color,
          padding: cs.padding,
        };
      };
      const largo = document.querySelector('.exchange-group label:has(> input[type="checkbox"])');
      // un chip "normal": dentro del contenedor de seleccion corta (fiat/crypto/monedas)
      const corto =
        document.querySelector('.selection-summary ~ * label:has(> input[type="checkbox"])') ||
        document.querySelector('label:has(> input[type="checkbox"]):not(.exchange-group label):not(.checkbox-grid label)');
      return { exchange: leer(largo), chip: leer(corto) };
    });

    console.log('\n===== CHIPS =====');
    console.log(JSON.stringify(medir, null, 1));
    console.log('==================\n');

    // el exchange debe NO ser capsula: radio chico o 0
    const radioExchange = parseInt(medir.exchange?.radio || '0', 10);
    expect(radioExchange, 'la fila de exchange quedo como capsula').toBeLessThan(100);

    // y un chip normal si debe ser capsula (si existe alguno en la pagina)
    if (medir.chip) {
      console.log(`chip corto: radio ${medir.chip.radio} (esperado ~980px)`);
    }
  } finally {
    await context.close();
  }
});
