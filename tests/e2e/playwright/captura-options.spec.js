/**
 * Capturas de la página de configuración con la extensión REAL cargada.
 * Sirve para antes/después del rediseño. El prefijo se pasa por env: PREFIJO=antes|despues
 *
 *   npx playwright test --config=playwright.fixes.config.js captura-options.spec.js
 */
const { test, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');
const PREFIJO = process.env.PREFIJO || 'captura';
const SALIDA = path.join(EXT, 'docs', 'auditoria-2026-09', 'rediseno');
fs.mkdirSync(SALIDA, { recursive: true });

test('capturas de options.html', async () => {
  test.setTimeout(180000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-cap-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 1440, height: 950 },
  });
  try {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
    const id = sw.url().match(/^chrome-extension:\/\/([a-p]{32})\//)[1];

    const opt = await context.newPage();
    await opt.goto(`chrome-extension://${id}/src/options.html`, { waitUntil: 'domcontentloaded' });
    await opt.waitForTimeout(2500);

    // Arriba de todo, sin tocar nada: así lo ve el usuario al abrir.
    await opt.screenshot({ path: path.join(SALIDA, `${PREFIJO}-01-arriba.png`) });

    // Desplegar las que esten colapsadas (por defecto vienen todas abiertas).
    const colapsadas = await opt.locator('.card-header[data-action="toggle-section"].collapsed').all();
    for (const c of colapsadas) {
      await c.click().catch(() => {});
      await opt.waitForTimeout(150);
    }
    await opt.waitForTimeout(600);
    await opt.screenshot({ path: path.join(SALIDA, `${PREFIJO}-02-full.png`), fullPage: true });

    // Una sección de formulario abierta, a tamaño real.
    const fees = opt.locator('.card-header', { hasText: 'Fees y Comisiones' });
    if (await fees.count()) {
      await fees.scrollIntoViewIfNeeded().catch(() => {});
      await opt.waitForTimeout(400);
      await opt.screenshot({ path: path.join(SALIDA, `${PREFIJO}-03-fees.png`) });
    }

    // La sección de interfaz (switches/selects)
    const ui = opt.locator('.card-header', { hasText: 'Interfaz' });
    if (await ui.count()) {
      await ui.scrollIntoViewIfNeeded().catch(() => {});
      await opt.waitForTimeout(400);
      await opt.screenshot({ path: path.join(SALIDA, `${PREFIJO}-04-interfaz.png`) });
    }

    // ─────────── mediciones automaticas del rediseno (no "a ojo") ───────────
    const metricas = await opt.evaluate(() => {
      const cs = (sel, prop) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el)[prop] : null;
      };
      const legacy = document.querySelector('.broker-fees');
      return {
        desbordeHorizontal: document.documentElement.scrollWidth - window.innerWidth,
        anchoContenido: document.querySelector('.container')?.getBoundingClientRect().width,
        bodyFondo: cs('body', 'backgroundColor'),
        bodyTexto: cs('body', 'color'),
        cardSombra: cs('.card', 'boxShadow'),
        cardBorde: cs('.card', 'borderStyle'),
        footerPosicion: cs('.footer', 'position'),
        h2Tracking: cs('.card-header h2', 'letterSpacing'),
        h4Fuente: cs('.bank-group h4', 'fontFamily'),
        h4Transform: cs('.bank-group h4', 'textTransform'),
        inputSombra: cs('input[type="number"]', 'boxShadow'),
        switchEncendido: cs('.switch input:checked + .slider', 'backgroundColor'),
        legacyDisplay: legacy ? getComputedStyle(legacy).display : 'no existe',
        tarjetas: document.querySelectorAll('.card').length,
        estilosCargados: document.styleSheets.length,
        reglas: (() => {
          try {
            return document.styleSheets[0].cssRules.length;
          } catch {
            return 'sin acceso';
          }
        })(),
      };
    });
    console.log('[metricas] ' + JSON.stringify(metricas, null, 2));
    fs.writeFileSync(path.join(SALIDA, `${PREFIJO}-metricas.json`), JSON.stringify(metricas, null, 2));

    console.log(`[capturas] ${SALIDA} con prefijo ${PREFIJO}`);
  } finally {
    await context.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* limpieza */
    }
  }
});
