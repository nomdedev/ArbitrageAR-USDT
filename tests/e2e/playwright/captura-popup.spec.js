/**
 * Captura y relevamiento del POPUP real (no del panel de configuración).
 * Imprime la estructura (pestanias, botones, filtros) y guarda imagenes para poder mirarlas.
 *
 *   PREFIJO=popup-antes npx playwright test --config=playwright.capturas.config.js
 */
const { test, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');
const PREFIJO = process.env.PREFIJO || 'popup';
const SALIDA = path.join(EXT, 'docs', 'auditoria-2026-09', 'rediseno');
fs.mkdirSync(SALIDA, { recursive: true });

test('capturas del popup', async () => {
  test.setTimeout(240000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-popup-'));
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
    const errores = [];

    const popup = await context.newPage();
    popup.on('pageerror', (e) => errores.push(e.message));
    await popup.goto(`chrome-extension://${id}/src/popup.html`, { waitUntil: 'domcontentloaded' });
    await popup.waitForTimeout(8000); // dar tiempo a que lleguen datos de las APIs

    // ─── relevamiento de la estructura ───
    const estructura = await popup.evaluate(() => {
      const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
      };
      const medir = (el) => {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        return {
          clase: el.className && typeof el.className === 'string' ? el.className.trim() : '',
          texto: txt(el),
          ancho: Math.round(r.width),
          alto: Math.round(r.height),
          radio: st.borderRadius,
          fondo: st.backgroundColor,
          color: st.color,
          fuente: st.fontSize + '/' + st.fontWeight,
          transicion: st.transitionProperty,
        };
      };
      return {
        tamanoDocumento: {
          ancho: document.documentElement.scrollWidth,
          alto: document.documentElement.scrollHeight,
        },
        pestanias: [...document.querySelectorAll('.tab, [data-tab]')].map((el) => ({
          texto: txt(el),
          tab: el.dataset.tab || null,
          activa: el.classList.contains('active'),
        })),
        botonesVisibles: [...document.querySelectorAll('button')].filter(visible).map(medir).slice(0, 24),
        selects: [...document.querySelectorAll('select')].map((s) => ({
          id: s.id,
          opciones: [...s.options].map((o) => o.textContent.trim()).slice(0, 8),
        })),
        filtros: [...document.querySelectorAll('.filter-btn, .filter-btn-footer, [class*="filter"]')]
          .slice(0, 12)
          .map((el) => ({ clase: el.className, texto: txt(el) })),
        secciones: [...document.querySelectorAll('section, .panel, .card')].slice(0, 14).map((el) => ({
          clase: typeof el.className === 'string' ? el.className : '',
          visible: visible(el),
          alto: Math.round(el.getBoundingClientRect().height),
        })),
      };
    });
    console.log('[popup] estructura = ' + JSON.stringify(estructura, null, 1));

    await popup.screenshot({ path: path.join(SALIDA, `${PREFIJO}-01-top.png`) });
    await popup.screenshot({
      path: path.join(SALIDA, `${PREFIJO}-02-full.png`),
      fullPage: true,
    });

    // ─── recorrer las pestanias ───
    const tabs = await popup.locator('.tab[data-tab]').all();
    for (let i = 0; i < tabs.length; i++) {
      const etiqueta = ((await tabs[i].getAttribute('data-tab')) || `tab${i}`).replace(/[^\w-]/g, '');
      await tabs[i].click().catch(() => {});
      await popup.waitForTimeout(2500);
      await popup.screenshot({ path: path.join(SALIDA, `${PREFIJO}-tab-${etiqueta}.png`) });
      console.log(`[popup] capturada pestania ${etiqueta}`);
    }

    // ─── linea base de estilos (para comparar despues del rediseno) ───
    const estilos = await popup.evaluate(() => {
      const cs = (sel, prop) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el)[prop] : null;
      };
      return {
        bodyFondo: cs('body', 'backgroundColor'),
        bodyFuente: cs('body', 'fontFamily'),
        bodyTamano: cs('body', 'fontSize'),
        tabFondo: cs('.tab', 'backgroundColor'),
        tabRadio: cs('.tab', 'borderRadius'),
        tabActivaFondo: cs('.tab.active', 'backgroundColor'),
        tabActivaTexto: cs('.tab.active', 'color'),
        tabTransicion: cs('.tab', 'transition'),
        botonFondo: cs('button', 'backgroundColor'),
        botonRadio: cs('button', 'borderRadius'),
        keyframesEnUso: [...document.styleSheets]
          .flatMap((s) => {
            try {
              return [...s.cssRules];
            } catch {
              return [];
            }
          })
          .filter((r) => r.type === 7).length,
        hojas: [...document.styleSheets].map((s) => (s.href || 'inline').split('/').slice(-2).join('/')),
      };
    });
    console.log('[popup] estilos = ' + JSON.stringify(estilos, null, 1));
    console.log('[popup] errores js = ' + JSON.stringify(errores.slice(0, 5)));
    fs.writeFileSync(
      path.join(SALIDA, `${PREFIJO}-relevamiento.json`),
      JSON.stringify({ estructura, estilos, errores }, null, 2)
    );
    console.log(`[popup] capturas en ${SALIDA} con prefijo ${PREFIJO}`);
  } finally {
    await context.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* limpieza */
    }
  }
});
