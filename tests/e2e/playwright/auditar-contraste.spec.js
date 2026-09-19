/**
 * Auditoría de contraste medida en vivo (no estimada leyendo CSS).
 *
 * Recorre las cuatro pestañas del popup, el modal de detalle (con la guía en pasos) y la página de
 * configuración; para cada texto visible calcula el ratio real de contraste WCAG contra su fondo
 * efectivo (subiendo por los ancestros hasta encontrar un background-color opaco) y lista los peores.
 *
 * También diagnostica el bug reportado: los números de paso invisibles ("1. 1" en pantalla), volcando
 * los estilos computados de .guide-step-num y .guide-steps.
 *
 *   npx playwright test --config=playwright.capturas.config.js -g "contraste"
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');
const SALIDA = path.join(EXT, 'docs', 'auditoria-2026-09', 'rediseno');

/** Se ejecuta en la página: devuelve los peores contrastes del subárbol indicado. */
const MEDIR = ([selectorRaiz, limite]) => {
  const raiz = selectorRaiz ? document.querySelector(selectorRaiz) : document.body;
  if (!raiz) return [{ error: `no existe ${selectorRaiz}` }];

  const luminancia = ([r, g, b]) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const aRgb = (color) => (color.match(/[\d.]+/g) || []).map(Number);

  const fondoEfectivo = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      const c = aRgb(bg);
      if (c.length >= 3 && (c[3] === undefined || c[3] >= 0.95)) return bg;
      n = n.parentElement;
    }
    return 'rgb(0, 0, 0)';
  };

  const ruta = (el) => {
    const p = [];
    let n = el;
    for (let i = 0; i < 3 && n && n !== raiz.parentElement; i++) {
      p.unshift(n.tagName.toLowerCase() + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
      n = n.parentElement;
    }
    return p.join(' > ');
  };

  const resultados = [];
  raiz.querySelectorAll('*').forEach((el) => {
    if (!el.getClientRects().length) return;
    const propio = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    if (!propio) return; // antes exigia 2 caracteres y se salteaba iconos como el del par (⇄)

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.35) return;

    const fg = aRgb(cs.color);
    if (fg.length < 3) return;
    const bg = fondoEfectivo(el);
    const bgC = aRgb(bg);
    if (bgC.length < 3) return;

    const l1 = luminancia(fg);
    const l2 = luminancia(bgC);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const tamano = parseFloat(cs.fontSize);
    const grande = tamano >= 24 || (tamano >= 18.66 && Number(cs.fontWeight) >= 700);
    const minimo = grande ? 3 : 4.5;

    if (ratio < minimo) {
      resultados.push({
        ruta: ruta(el),
        texto: propio.slice(0, 40),
        color: cs.color,
        fondo: bg,
        ratio: Number(ratio.toFixed(2)),
        tamano: `${cs.fontSize}/${cs.fontWeight}`,
        minimo,
        gravedad: ratio < 3 ? 'CRITICO' : 'alto',
      });
    }
  });

  resultados.sort((a, b) => a.ratio - b.ratio);
  return resultados.slice(0, limite);
};

async function abrir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-contraste-'));
  const context = await chromium.launchPersistentContext(dir, {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 440, height: 780 },
  });
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
  const id = sw.url().match(/^chrome-extension:\/\/([a-p]{32})\//)[1];
  return { context, id };
}

test('contraste medido: pestañas, modales y configuración', async () => {
  test.setTimeout(300000);
  const { context, id } = await abrir();
  const informe = {};

  try {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${id}/src/popup.html`, { waitUntil: 'domcontentloaded' });
    await popup.waitForTimeout(9000);

    for (const tab of ['routes', 'crypto-arbitrage', 'simulator', 'banks']) {
      const b = popup.locator(`[data-tab="${tab}"]`).first();
      if (!(await b.count())) continue;
      await b.click();
      await popup.waitForTimeout(1500);
      informe[`pestana:${tab}`] = await popup.evaluate(MEDIR, ['body', 20]); // body y no #main-content: las pestañas y el encabezado quedaban afuera

      // La matriz de riesgo se genera al hacer clic: se mide el fondo real de cada celda, porque el
      // tinte verde/ambar/rojo se perdia por especificidad (.sim-matrix-table td le ganaba a
      // .matrix-cell-*) y eso no es texto: no aparece en la medicion de contraste.
      if (tab === 'simulator') {
        const generar = popup.locator('#generate-risk-matrix').first();
        if (await generar.count()) {
          await generar.click().catch(() => {});
          await popup.waitForTimeout(1500);
          informe['matriz:celdas'] = await popup.evaluate(() => {
            const leer = (sel) => {
              const el = document.querySelector(sel);
              if (!el) return null;
              const cs = getComputedStyle(el);
              return { fondo: cs.backgroundColor, texto: (el.textContent || '').trim().slice(0, 12), color: cs.color };
            };
            return {
              positive: leer('.matrix-cell-positive'),
              neutral: leer('.matrix-cell-neutral'),
              negative: leer('.matrix-cell-negative'),
            };
          });
          await popup.screenshot({ path: path.join(SALIDA, 'contraste-matriz.png') });
        }
      }
    }

    // modal de detalle + diagnóstico de la insignia de paso
    await popup.locator('[data-tab="routes"]').first().click();
    await popup.waitForTimeout(1200);
    const card = popup.locator('.route-card').first();
    if (await card.count()) {
      await card.click();
      await popup.waitForTimeout(1500);
      informe['modal:detalle'] = await popup.evaluate(MEDIR, ['body', 14]);
      informe['diagnostico:insignia-de-paso'] = await popup.evaluate(() => {
        const ol = document.querySelector('.guide-steps');
        const num = document.querySelector('.guide-step-num');
        if (!ol || !num) return { error: 'no encontre la guia en el modal' };
        const csOl = getComputedStyle(ol);
        const csNum = getComputedStyle(num);
        return {
          olListStyle: csOl.listStyleType + ' / ' + csOl.listStyle,
          olPaddingLeft: csOl.paddingLeft,
          numTexto: num.textContent.trim(),
          numFondo: csNum.backgroundColor,
          numColor: csNum.color,
          numAnchoAlto: csNum.width + 'x' + csNum.height,
          numRadio: csNum.borderRadius,
          numDisplay: csNum.display,
          numFontSize: csNum.fontSize,
        };
      });
      await popup.screenshot({ path: path.join(SALIDA, 'contraste-modal.png') });
    }

    // configuración
    const opt = await context.newPage();
    await opt.goto(`chrome-extension://${id}/src/options.html`, { waitUntil: 'domcontentloaded' });
    await opt.waitForTimeout(3000);
    informe['pagina:configuracion'] = await opt.evaluate(MEDIR, ['body', 20]);
    await opt.screenshot({ path: path.join(SALIDA, 'contraste-options.png'), fullPage: false });

    console.log('\n===== CONTRASTE (medido en vivo) =====');
    console.log(JSON.stringify(informe, null, 1));
    console.log('======================================\n');

    fs.writeFileSync(
      path.join(SALIDA, 'contraste-informe.json'),
      JSON.stringify(informe, null, 2)
    );

    // No falla por cantidad: es un diagnóstico. Falla solo si no pudo medir nada.
    expect(Object.keys(informe).length).toBeGreaterThan(2);
  } finally {
    await context.close();
  }
});
