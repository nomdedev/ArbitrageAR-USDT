/**
 * Cálculo del dólar a partir de los bancos (BANK_CALCULATIONS del service worker real).
 *
 * Estos números alimentan TODAS las rutas. Reemplaza al test de `utils/bankCalculations.js`,
 * un módulo que nadie cargaba: la copia que corre en producción es la inline de main-simple.js
 * y no tenía ninguna cobertura.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'background', 'main-simple.js'),
  'utf8'
);

function extraerObjeto(nombre) {
  const inicio = SRC.indexOf(`const ${nombre} = {`);
  if (inicio === -1) throw new Error(`No se encontró ${nombre}`);
  let i = SRC.indexOf('{', inicio);
  let profundidad = 0;
  for (; i < SRC.length; i++) {
    if (SRC[i] === '{') profundidad++;
    else if (SRC[i] === '}' && --profundidad === 0) break;
  }
  return SRC.slice(inicio, i + 1);
}

const ctx = vm.createContext({ Math, Object, Array, Number, Infinity });
vm.runInContext(`${extraerObjeto('BANK_CALCULATIONS')};\nthis.B = BANK_CALCULATIONS;`, ctx);
const B = ctx.B;

const BANCOS = {
  bna: { ask: 1050, bid: 980 },
  galicia: { ask: 1060, bid: 990 },
  santander: { ask: 1040, bid: 970 },
  bbva: { ask: 1070, bid: 1000 },
  icbc: { ask: 1080, bid: 1010 }
};

describe('BANK_CALCULATIONS (producción)', () => {
  test('consenso = mediana, y respeta la selección de bancos', () => {
    expect(B.calculateBankConsensus(BANCOS)).toMatchObject({
      price: 1060,
      method: 'consenso',
      banksCount: 5,
      source: 'criptoya_banks'
    });
    expect(B.calculateBankConsensus(BANCOS, ['bna', 'galicia']).price).toBe(1055);
  });

  test('ignora cotizaciones inválidas y devuelve null si no queda ninguna', () => {
    const sucios = { bna: { ask: 1050 }, a: { ask: null }, b: { ask: 0 }, c: { ask: 'x' }, d: null };
    expect(B.calculateBankConsensus(sucios)).toMatchObject({ price: 1050, banksCount: 1 });
    expect(B.calculateBankConsensus({})).toBeNull();
    expect(B.calculateBankConsensus(BANCOS, ['inexistente'])).toBeNull();
  });

  test('promedio, mejor compra (mínimo) y mejor venta (máximo)', () => {
    expect(B.calculateBankAverage(BANCOS).price).toBe(1060);
    expect(B.calculateBestBuy(BANCOS).price).toBe(1040);
    expect(B.calculateBestSell(BANCOS).price).toBe(1080);
    expect(B.calculateBestBuy(BANCOS, ['bna', 'bbva']).price).toBe(1050);
    expect(B.calculateBestSell(BANCOS, ['bna', 'galicia']).price).toBe(1060);
  });

  test('calculateDollarPrice delega por método y acepta un banco puntual', () => {
    ['consenso', 'promedio', 'mejor-compra', 'mejor-venta'].forEach(m =>
      expect(B.calculateDollarPrice(BANCOS, m).method).toBe(m)
    );
    expect(B.calculateDollarPrice(BANCOS, 'bna')).toMatchObject({ price: 1050, method: 'solo-bna' });
    expect(B.calculateDollarPrice(BANCOS, 'inexistente')).toBeNull();
    expect(B.calculateDollarPrice(BANCOS, '')).toBeNull();
  });
});
