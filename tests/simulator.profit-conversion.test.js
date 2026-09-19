/**
 * P-03 · La conversión USD→USDT del simulador estaba invertida y sobreestimaba la ganancia.
 *
 * El simulador fabricaba la tasa con los dos precios en pesos:
 *
 *     const usdToUsdtRate = usdPrice / usdtPrice;   // recíproco de la tasa del motor
 *     const step2_usdt = step1_usd / usdToUsdtRate;
 *
 * Como `step2_usdt = step1_usd × (usdtPrice / usdPrice)`, cuanto MÁS caro estaba el USDT en
 * pesos, MÁS USDT decía que compraba el usuario: la economía al revés. Sobreestimaba la
 * ganancia entre 2,5 y 10,8 puntos porcentuales (en el rango que importa, la duplicaba).
 *
 * El motor real (`main-simple.js` → `resolveUsdToUsdtRate`) usa la cotización USDT/USD
 * (~1:1 para un stablecoin del dólar), no la relación entre dos precios en pesos.
 *
 * Los valores esperados de este test son la columna "Conversión 1:1 (real)" de la tabla del
 * informe — verificados a mano además de con el test.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FUENTE = path.join(__dirname, '..', 'src', 'modules', 'simulator.js');

/** Extrae una función con nombre del módulo real (salta parámetros con destructuring). */
function extraerFuncion(src, nombre) {
  const cabecera = `function ${nombre}`;
  const inicio = src.indexOf(`${cabecera}(`);
  if (inicio < 0) throw new Error(`No se encontró ${nombre} en ${FUENTE}`);
  let parens = 0;
  let i = inicio + cabecera.length;
  for (; i < src.length; i++) {
    if (src[i] === '(') parens++;
    else if (src[i] === ')') {
      parens--;
      if (parens === 0) {
        i++;
        break;
      }
    }
  }
  if (parens !== 0) throw new Error(`Paréntesis sin cerrar en ${nombre}`);
  let depth = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(inicio, j + 1);
    }
  }
  throw new Error(`${nombre} no cierra sus llaves`);
}

describe('P-03 · conversión USD→USDT del simulador', () => {
  let calcular;

  beforeAll(() => {
    const src = fs.readFileSync(FUENTE, 'utf8');
    const cuerpo = extraerFuncion(src, 'calculateProfitPercent');
    const ctx = vm.createContext({ console });
    vm.runInContext(`${cuerpo}\nthis.__f = calculateProfitPercent;`, ctx);
    calcular = ctx.__f;
  });

  test('la función se extrae completa del módulo real', () => {
    const cuerpo = extraerFuncion(fs.readFileSync(FUENTE, 'utf8'), 'calculateProfitPercent');
    expect(cuerpo.startsWith('function calculateProfitPercent(')).toBe(true);
    expect(cuerpo).toContain('step2_usdt');
    expect(cuerpo.split('\n').length).toBeGreaterThan(20);
  });

  test('criterio de aceptación del informe: USD 1000 / USDT 1050 / fees 1%+1% → +2,91%', () => {
    // Antes daba +8,06%: la celda mostraba como claramente rentable una operación casi neutra.
    expect(calcular(1000000, 1000, 1050, 1, 1, 0, 0)).toBeCloseTo(2.91, 1);
  });

  test('toda la columna "real" de la tabla del informe', () => {
    const esperado = { 1000: -1.99, 1025: 0.46, 1050: 2.91, 1075: 5.36, 1100: 7.81 };
    Object.entries(esperado).forEach(([usdtPrice, porcentaje]) => {
      const r = calcular(1000000, 1000, Number(usdtPrice), 1, 1, 0, 0);
      expect(r).toBeCloseTo(porcentaje, 1);
    });
  });

  test('el precio del USDT ya no multiplica la cantidad comprada (economía al derecho)', () => {
    // Con el bug, el resultado crecía como (usdtPrice/usdPrice)^2 respecto de la 1:1.
    // Con el fix, la diferencia entre 1000 y 1100 es el spread puro: 10% menos fees.
    const a1000 = calcular(1000000, 1000, 1000, 0, 0, 0, 0);
    const a1100 = calcular(1000000, 1000, 1100, 0, 0, 0, 0);
    expect(a1000).toBeCloseTo(0, 6); // paridad exacta sin fees
    expect(a1100).toBeCloseTo(10, 6); // 1100/1000 - 1 = 10%
  });

  test('sin fees y con USDT al mismo precio que el dólar, no hay ganancia', () => {
    expect(calcular(1000000, 1000, 1000, 0, 0, 0, 0)).toBeCloseTo(0, 6);
  });
});
