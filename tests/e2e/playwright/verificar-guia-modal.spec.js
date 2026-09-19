/**
 * Verifica en vivo la guia del modal de detalle (la parte de "como hacer el arbitraje").
 *
 * Debe cumplir: pasos verticales numerados, CERO emoji, CERO desborde horizontal dentro del modal
 * y los importes en es-AR. Imprime el texto visible para poder leerlo tal cual lo ve el usuario.
 *
 *   npx playwright test --config=playwright.capturas.config.js -g "guia"
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');
const SALIDA = path.join(EXT, 'docs', 'auditoria-2026-09', 'rediseno');
fs.mkdirSync(SALIDA, { recursive: true });

test('la guia se entiende: pasos verticales, sin emoji, sin cortes', async () => {
  test.setTimeout(240000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-guia-'));
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

    const tarjeta = popup.locator('.route-card, .crypto-route-card').first();
    await tarjeta.waitFor({ state: 'visible', timeout: 20000 });
    await tarjeta.click();
    await popup.waitForTimeout(1500);

    const m = await popup.evaluate(() => {
      const modal = document.querySelector('#route-details-modal, dialog[open]');
      if (!modal) return { error: 'no se abrio el modal' };

      const pasos = Array.from(modal.querySelectorAll('.guide-step')).map((li) => ({
        numero: li.querySelector('.guide-step-num')?.textContent?.trim(),
        titulo: li.querySelector('.guide-step-title')?.textContent?.trim(),
        resultado: li.querySelector('.guide-step-result')?.textContent?.trim() || null,
      }));

      // desborde horizontal en cualquier parte del modal
      const desbordes = [];
      modal.querySelectorAll('*').forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          desbordes.push(`${el.className || el.tagName}: ${el.scrollWidth}>${el.clientWidth}`);
        }
      });

      const guia = modal.querySelector('.guide-steps, .guide-result');
      const textoGuia = Array.from(modal.querySelectorAll('.guide-steps, .guide-result'))
        .map((n) => n.innerText)
        .join(' ');
      const emojiEnGuia = (textoGuia.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).join(' ');
      const nodoEmoji = Array.from(modal.querySelectorAll('*')).find(
        (el) => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(el.textContent) && !el.children.length
      );

      return {
        pasos,
        resultado: Array.from(modal.querySelectorAll('.guide-result-row')).map((r) =>
          r.textContent.replace(/\s+/g, ' ').trim()
        ),
        emojiEnGuia,
        emojiEnModal: (modal.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).join(' '),
        nodoEmojiFueraDeLaGuia: nodoEmoji
          ? `${nodoEmoji.parentElement?.className || '?'} > ${nodoEmoji.outerHTML.slice(0, 120)}`
          : null,
        hayGuia: !!guia,
        desbordes,
        filaHorizontalVieja: !!modal.querySelector('.route-visualization'),
        textoDelModal: modal.innerText.replace(/\n{2,}/g, '\n').trim(),
      };
    });

    console.log('\n===== GUIA DEL MODAL (en vivo) =====');
    console.log(JSON.stringify(m, null, 2));
    console.log('====================================\n');

    await popup.screenshot({ path: path.join(SALIDA, 'guia-despues.png') });

    expect(m.error).toBeUndefined();
    expect(m.filaHorizontalVieja).toBe(false); // la fila que se cortaba ya no existe
    expect(m.pasos.length).toBeGreaterThanOrEqual(3); // 3 pasos en un solo exchange, 4 con transferencia
    expect(m.emojiEnGuia).toBe(''); // la guía no lleva emoji
    expect(m.desbordes).toEqual([]);
    expect(m.resultado.some((r) => /\$[\d.]+,\d{2}/.test(r))).toBe(true); // importes en es-AR
  } finally {
    await context.close();
  }
});

test('guia crypto: pasos verticales, sin emoji, sin cortes', async () => {
  test.setTimeout(240000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-guia-crypto-'));
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

    const tabCripto = popup.locator('.tab', { hasText: /cripto|crypto/i }).first();
    if (await tabCripto.count()) {
      await tabCripto.click();
      await popup.waitForTimeout(1500);
    }

    const tarjeta = popup.locator('.crypto-route-card').first();
    if (!(await tarjeta.count())) {
      console.log('SIN DATOS: no hay tarjetas de ruta crypto ahora mismo -> no se puede medir ese modal');
      test.skip(true, 'no hay rutas crypto disponibles');
      return;
    }
    await tarjeta.waitFor({ state: 'visible', timeout: 20000 });
    await tarjeta.click();
    await popup.waitForTimeout(1500);

    const m = await popup.evaluate(() => {
      const modal = document.querySelector('#route-details-modal, dialog[open]');
      if (!modal) return { error: 'no se abrio el modal' };
      const textoGuia = Array.from(modal.querySelectorAll('.guide-steps, .guide-result'))
        .map((n) => n.innerText)
        .join(' ');
      const desbordes = [];
      modal.querySelectorAll('*').forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          desbordes.push(`${el.className || el.tagName}: ${el.scrollWidth}>${el.clientWidth}`);
        }
      });
      return {
        pasos: Array.from(modal.querySelectorAll('.guide-step')).map((li) => ({
          numero: li.querySelector('.guide-step-num')?.textContent?.trim(),
          titulo: li.querySelector('.guide-step-title')?.textContent?.trim(),
          resultado: li.querySelector('.guide-step-result')?.textContent?.trim() || null,
        })),
        resultado: Array.from(modal.querySelectorAll('.guide-result-row')).map((r) =>
          r.textContent.replace(/\s+/g, ' ').trim()
        ),
        emojiEnGuia: (textoGuia.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).join(' '),
        desbordes,
        jergaVieja: !!modal.querySelector('.breakdown-section, .final-summary'),
        textoDelModal: modal.innerText.replace(/\n{2,}/g, '\n').trim(),
      };
    });

    console.log('\n===== GUIA DEL MODAL CRYPTO (en vivo) =====');
    console.log(JSON.stringify(m, null, 2));
    console.log('==========================================\n');
    await popup.screenshot({ path: path.join(SALIDA, 'guia-crypto-despues.png') });

    expect(m.error).toBeUndefined();
    expect(m.jergaVieja).toBe(false);
    expect(m.pasos.length).toBeGreaterThanOrEqual(2);
    expect(m.pasos.map((p) => p.numero)).toEqual(
      Array.from({ length: m.pasos.length }, (_, k) => String(k + 1))
    );
    expect(m.emojiEnGuia).toBe('');
    expect(m.desbordes).toEqual([]);
  } finally {
    await context.close();
  }
});

/**
 * OJO: las pestanas reales del popup son Fiat / Cripto / Simular / Exchanges (medido en vivo): NO
 * existe una pestana "Guia". El contenedor #selected-arbitrage-guide (generateGuideSteps +
 * displayStepByStepGuide) no se alcanza desde esas pestanas, y "Ver mas detalles" abre el modal de
 * detalle (que si esta verificado arriba). Queda como fixme hasta confirmar por donde se llega:
 * si nunca se llega, es codigo muerto y hay que borrarlo en vez de mantenerlo.
 */
test.fixme('guia interna (#selected-arbitrage-guide): mismo lenguaje y sin emoji', async () => {
  test.setTimeout(240000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-guia-tab-'));
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

    // seleccionar una ruta y abrir la pestaña de la guia
    const tarjeta = popup.locator('.route-card').first();
    if (await tarjeta.count()) {
      await tarjeta.click();
      await popup.waitForTimeout(1200);
    }
    // La guia no vive en una pestana: se abre con "Ver mas detalles"
    const verMas = popup.locator('button', { hasText: /ver m[aá]s detalles/i }).first();
    if (!(await verMas.count())) {
      console.log('SIN BOTON "Ver más detalles": no se puede abrir la guia (ver lista de arriba)');
      test.skip(true, 'no se encontro el acceso a la guia');
      return;
    }
    await verMas.click();
    await popup.waitForTimeout(1800);

    const g = await popup.evaluate(() => {
      const c = document.getElementById('selected-arbitrage-guide');
      if (!c || !c.innerText.trim()) return { error: 'la pestana guia no tiene contenido' };
      const desbordes = [];
      c.querySelectorAll('*').forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          desbordes.push(`${el.className || el.tagName}: ${el.scrollWidth}>${el.clientWidth}`);
        }
      });
      return {
        titulos: Array.from(c.querySelectorAll('.step-simple h4')).map((h) => h.textContent.trim()),
        numeros: Array.from(c.querySelectorAll('.step-number')).map((n) => n.textContent.trim()),
        emoji: (c.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).join(' '),
        desbordes,
        texto: c.innerText.replace(/\n{2,}/g, '\n').trim().slice(0, 1200),
      };
    });

    console.log('\n===== PESTANA GUIA (en vivo) =====');
    console.log(JSON.stringify(g, null, 2));
    console.log('==================================\n');
    await popup.screenshot({ path: path.join(SALIDA, 'guia-pestana-despues.png') });

    expect(g.error).toBeUndefined();
    expect(g.titulos.length).toBeGreaterThanOrEqual(3);
    expect(g.emoji).toBe('');
    expect(g.desbordes).toEqual([]);
  } finally {
    await context.close();
  }
});
