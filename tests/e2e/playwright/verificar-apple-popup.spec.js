/**
 * Verificacion EN VIVO del rediseno Apple del popup, sobre la extension real.
 *
 * Mide con getComputedStyle contra los valores del DESIGN.md de Apple y falla si no coinciden.
 * Tambien guarda la captura "despues" para comparar a ojo.
 *
 *   npx playwright test --config=playwright.capturas.config.js -g "apple"
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');
const SALIDA = path.join(EXT, 'docs', 'auditoria-2026-09', 'rediseno');
fs.mkdirSync(SALIDA, { recursive: true });

test('metricas Apple en el popup en vivo', async () => {
  test.setTimeout(240000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-apple-'));
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
    await popup.waitForTimeout(8000); // esperar datos reales

    const m = await popup.evaluate(() => {
      const cs = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el) : null;
      };
      // ¿queda paleta vieja en las hojas CARGADAS?
      let azulTailwind = 0;
      let violeta = 0;
      let verdeDoble = 0;
      for (const hoja of document.styleSheets) {
        let reglas = '';
        try {
          reglas = Array.from(hoja.cssRules || []).map((r) => r.cssText).join('\n');
        } catch {
          continue;
        }
        azulTailwind += (reglas.match(/#3b82f6|#2563eb|59, ?130, ?246/gi) || []).length;
        violeta += (reglas.match(/#8b5cf6|#818cf8|139, ?92, ?246/gi) || []).length;
        verdeDoble += (reglas.match(/#10b981|#059669|16, ?185, ?129/gi) || []).length;
      }
      const tab = cs('.tab');
      const tabActivo = cs('.tab.active');
      const main = cs('main');
      return {
        bodyFuente: cs('body').fontFamily.slice(0, 90),
        bodyTamano: cs('body').fontSize,
        htmlTamano: cs('html').fontSize,
        tabTamano: tab ? tab.fontSize : '(sin .tab)',
        tabPadreFuente: cs('.tabs') ? cs('.tabs').fontSize : '-',
        zoomRaiz: getComputedStyle(document.documentElement).zoom,
        zoomBody: getComputedStyle(document.body).zoom,
        tabActivoFondo: tabActivo ? tabActivo.backgroundColor : '-',
        tabsRadio: cs('.tabs') ? cs('.tabs').borderRadius : '-',
        lienzoAlto: Math.round(document.body.getBoundingClientRect().height),
        ventanaAlto: window.innerHeight,
        mainPaddingAbajo: main ? main.paddingBottom : '-',
        fuentesExternas: performance
          .getEntriesByType('resource')
          .filter((r) => /fonts\.(googleapis|gstatic)/.test(r.name)).length,
        azulTailwind,
        violeta,
        verdeDoble,
      };
    });

    console.log('\n===== METRICAS APPLE (popup en vivo) =====');
    Object.entries(m).forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`));
    console.log('==========================================\n');

    await popup.screenshot({ path: path.join(SALIDA, 'popup-despues-01-arriba.png') });
    await popup.screenshot({ path: path.join(SALIDA, 'popup-despues-02-full.png'), fullPage: true });

    // ── Aserciones del sistema Apple ──
    expect(m.htmlTamano).toBe('16px'); // la raiz ya no encoge los rem
    expect(m.bodyTamano).toBe('14px'); // antes 10.5625px
    expect(m.bodyFuente).not.toMatch(/Inter/);
    expect(m.bodyFuente).toMatch(/SF Pro|system-ui/);
    expect(m.fuentesExternas).toBe(0); // sin descarga de Google Fonts
    expect(m.lienzoAlto).toBeGreaterThanOrEqual(m.ventanaAlto - 2); // sin area muerta
    expect(parseInt(m.mainPaddingAbajo, 10)).toBeGreaterThanOrEqual(24); // ultima tarjeta sin cortar
    // Apple reserva el azul para la accion primaria: el segmento activo usa superficie elevada.
    // (Si se prefiere el azul lleno estilo iOS tab bar, es una linea en .tab.active y este
    //  assert pasa a esperar rgb(0, 113, 227).)
    expect(m.tabActivoFondo).toBe('rgb(58, 58, 61)'); // #3a3a3d, segmento seleccionado
    expect(m.tabsRadio).toBe('11px'); // control segmentado, no pestanas sueltas
    expect(parseFloat(m.tabTamano)).toBeGreaterThanOrEqual(12); // etiquetas legibles
    expect(m.azulTailwind).toBe(0);
    expect(m.violeta).toBe(0);
    expect(m.verdeDoble).toBe(0);
  } finally {
    await context.close();
  }
});
