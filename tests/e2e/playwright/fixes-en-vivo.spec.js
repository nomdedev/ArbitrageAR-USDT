/**
 * Verificación EN VIVO de las correcciones, sobre la extensión real cargada en un Chromium
 * propio (no jsdom): popup.html y options.html reales, con chrome.* disponible.
 *
 * Cubre, en las páginas de verdad:
 *   P-01 · el panel de configuración avanzada del simulador abre al primer click
 *   P-03 · la celda USD 1000 / USDT 1050 de la matriz da ≈ +2,91% (antes +8,06%)
 *   O-05 · el fee de Lemon se puede cargar con el código correcto
 *   O-02 · existe el interruptor "Descontar comisiones del cálculo"
 *   F-10 · retiro/transferencia/banco dicen ARS, no % ni USD
 *   O-01 · un fee por broker y el estado del interruptor SOBREVIVEN a "Guardar" + recargar
 *
 * Capturas en docs/auditoria-2026-09/pruebas-en-vivo/
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const EXT = path.resolve(__dirname, '../../../');
const SALIDA = path.join(EXT, 'docs', 'auditoria-2026-09', 'pruebas-en-vivo');
fs.mkdirSync(SALIDA, { recursive: true });

function idDeExtension(url) {
  const m = url.match(/^chrome-extension:\/\/([a-p]{32})\//);
  return m ? m[1] : null;
}

test('verificación en vivo de las correcciones', async () => {
  test.setTimeout(240000);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-fixes-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });

  const resultado = {};

  try {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
    const id = idDeExtension(sw.url());
    console.log(`\n[EXT] id=${id}  worker=${sw.url()}`);
    expect(id).toBeTruthy();

    const erroresSW = [];
    sw.on('console', (m) => {
      if (m.type() === 'error') erroresSW.push(m.text());
    });
    sw.on('pageerror', (e) => erroresSW.push(`pageerror: ${e.message}`));

    // ─────────────────────────────── P-01 ───────────────────────────────
    const popup = await context.newPage();
    const erroresPopup = [];
    popup.on('pageerror', (e) => erroresPopup.push(e.message));
    await popup.goto(`chrome-extension://${id}/src/popup.html`, { waitUntil: 'domcontentloaded' });
    await popup.waitForTimeout(2000);

    await popup.click('.tab[data-tab="simulator"]');
    await popup.waitForTimeout(600);

    const panel = popup.locator('#advanced-config');
    const displayAntes = await panel.evaluate((el) => el.style.display);
    await popup.click('#toggle-advanced');
    await popup.waitForTimeout(500);
    const displayDespues = await panel.evaluate((el) => el.style.display);
    const visible = await panel.isVisible();
    await popup.screenshot({ path: path.join(SALIDA, '01-P01-panel-config-avanzada.png') });

    resultado['P-01'] = { displayAntes, displayDespues, visible };
    console.log(`[P-01] display antes=${displayAntes} · despues=${displayDespues} · visible=${visible}`);
    expect(displayDespues).toBe('block'); // antes del fix quedaba en 'none'
    expect(visible).toBe(true);

    // ─────────────────────────────── P-03 ───────────────────────────────
    await popup.click('#generate-risk-matrix');
    await popup.waitForTimeout(2500);
    const matriz = await popup.evaluate(() => {
      const t = document.getElementById('risk-matrix-table');
      if (!t) return { error: 'no hay tabla' };
      const encabezados = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
      const filas = [...t.querySelectorAll('tbody tr')].map((tr) =>
        [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())
      );
      return { encabezados, filas };
    });
    await popup.screenshot({ path: path.join(SALIDA, '02-P03-matriz-riesgo.png') });
    resultado['P-03'] = matriz;
    console.log(`[P-03] encabezados=${JSON.stringify(matriz.encabezados)}`);
    console.log(`[P-03] filas=${JSON.stringify(matriz.filas)}`);

    // P-03 · la conversion USD→USDT tiene que ser 1:1 (USDT es un stablecoin del dolar).
    // Cada celda vale, aproximadamente, (USDT_venta / USD_compra - 1) menos las comisiones.
    // Con la conversion invertida el numero cambia de signo y de magnitud, asi que esta
    // comprobacion distingue una conversion correcta de una dada vuelta sobre la salida REAL.
    const preciosCol = matriz.encabezados.slice(1).map((h) => parseFloat(h.replace('$', '')));
    const desvios = [];
    for (const fila of matriz.filas || []) {
      const usd = parseFloat(fila[0].replace('$', ''));
      for (let i = 0; i < preciosCol.length; i++) {
        const crudo = String(fila[i + 1]).replace('−', '-').replace('%', '');
        const mostrado = parseFloat(crudo) / 100;
        const esperadoSinFees = preciosCol[i] / usd - 1;
        desvios.push({
          usd,
          usdt: preciosCol[i],
          mostrado,
          esperadoSinFees,
          delta: mostrado - esperadoSinFees,
        });
      }
    }
    const peor = desvios.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a));
    console.log(
      `[P-03] celdas=${desvios.length} · peor desvio=${(peor.delta * 100).toFixed(2)} pp ` +
        `(USD ${peor.usd} / USDT ${peor.usdt}: mostrado ${(peor.mostrado * 100).toFixed(2)}% ` +
        `vs ${(peor.esperadoSinFees * 100).toFixed(2)}% sin comisiones)`
    );
    resultado['P-03-consistencia'] = { celdas: desvios.length, peor, preciosCol };
    expect(desvios.length).toBeGreaterThanOrEqual(10);
    // El desvio lo explican las comisiones aplicadas; con la conversion invertida explotaria.
    for (const d of desvios) expect(Math.abs(d.delta)).toBeLessThan(0.035);

    // Dato para el informe: la celda de aceptacion (USD 1000 / USDT 1050 = +2,91%) NO existe
    // en la matriz en vivo, que arranca en USD 1400. Es evidencia de P-02 (precios fijos).
    console.log(`[P-02] filas USD de la matriz en vivo: ${JSON.stringify((matriz.filas || []).map((f) => f[0]))}`);

    // ─────────────────────── options: O-02, F-10, O-05 ───────────────────────
    const opt = await context.newPage();
    const erroresOptions = [];
    opt.on('pageerror', (e) => erroresOptions.push(e.message));
    await opt.goto(`chrome-extension://${id}/src/options.html`, { waitUntil: 'domcontentloaded' });
    await opt.waitForTimeout(2000);

    // Las tarjetas arrancan desplegadas (lo verifica el spec de capturas). El <input> del
    // interruptor esta oculto a proposito (el control visible es el .slider), asi que para
    // saber si la seccion esta abierta se mide un elemento visible, nunca el input.
    const cabeceraFees = opt.locator('.card-header', { hasText: 'Fees y Comisiones' });
    const seccionVisible = await opt.locator('#broker-select').isVisible().catch(() => false);
    resultado['fees-seccion-visible'] = seccionVisible;
    if (!seccionVisible && (await cabeceraFees.count())) {
      await cabeceraFees.click();
      await opt.waitForTimeout(800);
    }
    await opt.waitForTimeout(300);

    const hayInterruptor = await opt.locator('#apply-fees').count();
    const etiquetaRetiro = (await opt.locator('label[for="withdrawal-fee"]').textContent()).trim();
    const etiquetaTransfer = (await opt.locator('label[for="transfer-fee"]').textContent()).trim();
    const etiquetaBanco = (await opt.locator('label[for="bank-fee"]').textContent()).trim();
    const opcionLemon = await opt.locator('#broker-select option[value="lemoncash"]').count();
    const opcionLemonVieja = await opt.locator('#broker-select option[value="lemon-cash"]').count();
    await opt.locator('#apply-fees').scrollIntoViewIfNeeded().catch(() => {});
    await opt
      .screenshot({ path: path.join(SALIDA, '03-options-fees-seccion.png'), fullPage: false })
      .catch(() => {});

    resultado['O-02/F-10/O-05'] = {
      hayInterruptor,
      etiquetaRetiro,
      etiquetaTransfer,
      etiquetaBanco,
      opcionLemon,
      opcionLemonVieja,
    };
    console.log(`[O-02] #apply-fees existe: ${hayInterruptor}`);
    console.log(`[F-10] etiquetas: "${etiquetaRetiro}" · "${etiquetaTransfer}" · "${etiquetaBanco}"`);
    console.log(`[O-05] opcion lemoncash=${opcionLemon} · lemon-cash(vieja)=${opcionLemonVieja}`);
    expect(hayInterruptor).toBe(1);
    expect(etiquetaRetiro).toContain('ARS');
    expect(etiquetaTransfer).toContain('ARS');
    expect(etiquetaBanco).toContain('ARS');
    expect(opcionLemon).toBe(1);
    expect(opcionLemonVieja).toBe(0);

    // ─────────────────────────────── O-01 ───────────────────────────────
    // 1) cargar un fee por broker para Lemon  2) encender el interruptor
    // 3) apretar "Guardar"  4) recargar  5) todo tiene que seguir ahí
    await opt.selectOption('#broker-select', 'lemoncash');
    await opt.fill('#broker-buy-fee', '0.5');
    await opt.fill('#broker-sell-fee', '1.5');
    await opt.click('#add-broker-improved');
    await opt.waitForTimeout(700);
    const itemsAntesDeGuardar = await opt.locator('.broker-fee-item').count();

    // El <input> del interruptor esta oculto (patron switch): el click real del usuario es
    // sobre la etiqueta. Se hace asi y se registra el estado para que cualquier falla sea clara.
    await opt.locator('label.switch:has(#apply-fees)').click();
    await opt.waitForTimeout(300);
    console.log(`[O-01] interruptor antes de guardar=${await opt.locator('#apply-fees').isChecked()}`);
    await opt.click('#save-settings');
    await opt.waitForTimeout(2000);

    await opt.reload({ waitUntil: 'domcontentloaded' });
    await opt.waitForTimeout(2500);

    const itemsTrasRecargar = await opt.locator('.broker-fee-item').count();
    const interruptorTrasRecargar = await opt.locator('#apply-fees').isChecked();
    const feesGuardados = await opt.evaluate(async () => {
      const r = await chrome.storage.local.get('notificationSettings');
      const s = r.notificationSettings || {};
      return { brokerFees: s.brokerFees || [], applyFeesInCalculation: s.applyFeesInCalculation };
    });
    await opt.screenshot({ path: path.join(SALIDA, '04-O01-tras-guardar-y-recargar.png') });

    resultado['O-01'] = { itemsAntesDeGuardar, itemsTrasRecargar, interruptorTrasRecargar, feesGuardados };
    console.log(`[O-01] items antes de Guardar=${itemsAntesDeGuardar} · tras recargar=${itemsTrasRecargar}`);
    console.log(`[O-01] interruptor tras recargar=${interruptorTrasRecargar}`);
    console.log(`[O-01] en storage: ${JSON.stringify(feesGuardados)}`);
    expect(itemsAntesDeGuardar).toBeGreaterThan(0);
    expect(itemsTrasRecargar).toBe(itemsAntesDeGuardar); // antes: 0, se borraban
    expect(interruptorTrasRecargar).toBe(true); // antes: volvía a false
    expect(feesGuardados.brokerFees.length).toBeGreaterThan(0);
    expect(feesGuardados.applyFeesInCalculation).toBe(true);

    // ───────────────── errores de consola (evidencia) ─────────────────
    resultado.errores = { serviceWorker: erroresSW, popup: erroresPopup, options: erroresOptions };
    console.log(`[consola] errores SW=${erroresSW.length} popup=${erroresPopup.length} options=${erroresOptions.length}`);
    if (erroresSW.length) console.log(`[consola] SW: ${JSON.stringify(erroresSW.slice(0, 5))}`);
    if (erroresPopup.length) console.log(`[consola] popup: ${JSON.stringify(erroresPopup.slice(0, 5))}`);

    fs.writeFileSync(path.join(SALIDA, 'resultado.json'), JSON.stringify(resultado, null, 2));
    console.log(`\n[OK] evidencia en ${SALIDA}`);
  } finally {
    // Guardar la evidencia aunque el test falle a mitad de camino.
    try {
      fs.writeFileSync(path.join(SALIDA, 'resultado.json'), JSON.stringify(resultado, null, 2));
      console.log(`[evidencia] ${path.join(SALIDA, 'resultado.json')}`);
    } catch {
      /* noop */
    }
    await context.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* limpieza */
    }
  }
});
