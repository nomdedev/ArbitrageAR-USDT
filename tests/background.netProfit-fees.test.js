/**
 * F-01 · La ganancia neta de una ruta de un solo exchange no descontaba la comisión de venta.
 *
 * `calculateSingleExchangeRoute` calculaba `fees.sell` (y lo informaba en `fees.total`) pero
 * restaba sólo las comisiones fijas, así que el resultado era la venta BRUTA menos el retiro:
 * la comisión de venta se ignoraba. Efecto medido: en un caso de spread 2% con 0,5%/1,5% el
 * motor informaba +14.900 ARS (+1,490% RENTABLE) cuando la operación daba −323,50 ARS
 * (−0,032%, pérdida). El signo se invertía.
 *
 * La misma rama hermana (`tryCalculateInterBrokerPair`, la de dos exchanges) ya usaba la
 * fórmula correcta: el fix hace que las dos coincidan.
 *
 * Invariante verificado SÓLO con el objeto devuelto por la función, sin mirar sus internos:
 *
 *     finalAmount === arsFromSale − fees.sell − fees.withdrawal − fees.transfer − fees.bank
 *
 * Se extraen las funciones REALES del service worker y se ejecutan en un sandbox, porque el
 * archivo es un service worker (necesita chrome.*, importScripts) y no exporta nada.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FUENTE = path.join(__dirname, '..', 'src', 'background', 'main-simple.js');

/** Extrae una función por nombre (salta la lista de parámetros: tiene destructuring). */
function extraerFuncion(src, nombre) {
  const cabecera = `function ${nombre}`;
  const inicio = src.indexOf(`${cabecera}(`);
  if (inicio < 0) throw new Error(`No se encontró ${nombre}`);
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

const src = fs.readFileSync(FUENTE, 'utf8');
const NOMBRES = [
  'normalizarBroker',
  'resolveUsdToUsdtRate',
  'resolveBrokerFee',
  'calculateSingleExchangeRoute',
];

describe('F-01 · la comisión de venta se descuenta del resultado', () => {
  let calcular;
  let resolverFee;

  beforeAll(() => {
    const codigo = NOMBRES.map((n) => extraerFuncion(src, n)).join('\n\n');
    if (!codigo.includes('arsAfterSellFee')) throw new Error('Extracción inválida');
    const ctx = vm.createContext({ console });
    vm.runInContext(
      `${codigo}\nthis.__calc = calculateSingleExchangeRoute;\nthis.__fee = resolveBrokerFee;`,
      ctx
    );
    calcular = ctx.__calc;
    resolverFee = ctx.__fee;
  });

  test('las funciones se extraen completas del service worker real', () => {
    NOMBRES.forEach((n) => {
      const c = extraerFuncion(src, n);
      expect(c.startsWith(`function ${n}(`)).toBe(true);
      expect(c.split('\n').length).toBeGreaterThanOrEqual(3);
    });
  });

  /** Configuración de fees por broker, como la escribe la página de opciones. */
  const broker = (buyFee, sellFee, extras = {}) => ({
    extraTradingFee: 0,
    extraWithdrawalFee: extras.retiro || 0,
    extraTransferFee: extras.transferencia || 0,
    bankCommissionFee: 0,
    brokerFees: [{ broker: 'ripio', buyFee, sellFee }],
  });

  const escenarios = [
    {
      nombre: 'comisiones 1%/1%, spread amplio',
      data: { totalAsk: 1000, totalBid: 1200 },
      esperado: { final: 1176120, neto: 176120 },
      settings: broker(1, 1),
    },
    {
      nombre: 'spread 2%, comisiones 0,5%/1,5% (el caso que invertía el signo)',
      data: { totalAsk: 1000, totalBid: 1020 },
      esperado: { final: 999676.5, neto: -323.5 },
      settings: broker(0.5, 1.5),
    },
    {
      nombre: 'spread 2% + 3.000 de retiro + 2.000 de transferencia',
      data: { totalAsk: 1000, totalBid: 1020 },
      esperado: { final: 994676.5, neto: -5323.5 },
      settings: broker(0.5, 1.5, { retiro: 3000, transferencia: 2000 }),
    },
  ];

  escenarios.forEach(({ nombre, data, settings, esperado }) => {
    test(`invariante y números correctos: ${nombre}`, () => {
      const r = calcular('ripio', data, {
        initialAmount: 1000000,
        officialPrice: 1000,
        usdtUsd: { ripio: { totalAsk: 1 } },
        applyFees: true,
        userSettings: settings,
      });
      expect(r).not.toBeNull();
      const { calculation: c, fees } = r;

      // 1) INVARIANTE: lo que se informa como comisión es lo que se descuenta.
      const descontado = fees.sell + fees.withdrawal + fees.transfer + fees.bank;
      expect(c.finalAmount).toBeCloseTo(c.arsFromSale - descontado, 6);

      // 2) los números exactos del informe
      expect(c.finalAmount).toBeCloseTo(esperado.final, 6);
      expect(c.netProfit).toBeCloseTo(esperado.neto, 6);

      // 3) la comisión de venta es > 0 y efectivamente mueve el resultado
      expect(fees.sell).toBeGreaterThan(0);
      expect(c.finalAmount).toBeLessThan(c.arsFromSale);
    });
  });

  test('el caso de spread 2% da PÉRDIDA, no ganancia (el signo ya no se invierte)', () => {
    const r = calcular('ripio', { totalAsk: 1000, totalBid: 1020 }, {
      initialAmount: 1000000,
      officialPrice: 1000,
      usdtUsd: { ripio: { totalAsk: 1 } },
      applyFees: true,
      userSettings: broker(0.5, 1.5),
    });
    expect(r.profitPercent).toBeLessThan(0);
    expect(r.calculation.netProfit).toBeLessThan(0);
  });

  test('sin comisiones el motor muestra el spread bruto (esto es lo que ve el usuario por F-02)', () => {
    const r = calcular('ripio', { totalAsk: 1000, totalBid: 1020 }, {
      initialAmount: 1000000,
      officialPrice: 1000,
      usdtUsd: { ripio: { totalAsk: 1 } },
      applyFees: false,
      userSettings: broker(0.5, 1.5),
    });
    // Sin comisiones no se descuenta NADA: ni compra ni venta. El spread bruto es 2%.
    expect(r.calculation.finalAmount).toBeCloseTo(1020000, 6);
    expect(r.calculation.netProfit).toBeCloseTo(20000, 6);
    // El mismo escenario con comisiones da −323,50 ARS: la diferencia es el engaño de F-02.
    expect(r.calculation.netProfit).toBeGreaterThan(0);
  });

  describe('O-05 · el fee por broker coincide aunque esté guardado con otro código', () => {
    test('"lemon-cash" guardado aplica al broker "lemoncash"', () => {
      const cfg = {
        extraTradingFee: 0,
        brokerFees: [{ broker: 'lemon-cash', buyFee: 1.5, sellFee: 2 }],
      };
      expect(resolverFee(cfg, 'lemoncash', 'buyFee')).toBe(1.5);
      expect(resolverFee(cfg, 'lemoncash', 'sellFee')).toBe(2);
    });

    test('sigue siendo insensible a mayúsculas y espacios', () => {
      const cfg = {
        extraTradingFee: 0,
        brokerFees: [{ broker: ' Lemon Cash ', buyFee: 0.9 }],
      };
      expect(resolverFee(cfg, 'LEMONCASH', 'buyFee')).toBe(0.9);
    });
  });

  describe('F-03 · el fee trading global se cobra en las dos patas', () => {
    test('sin fee por broker, el trading fee aplica a compra y a venta', () => {
      const cfg = { extraTradingFee: 1, brokerFees: [] };
      expect(resolverFee(cfg, 'ripio', 'buyFee')).toBe(1);
      expect(resolverFee(cfg, 'ripio', 'sellFee')).toBe(1); // antes devolvía 0
    });

    test('el fee explícito del broker le gana al global en su pata', () => {
      const cfg = {
        extraTradingFee: 1,
        brokerFees: [{ broker: 'ripio', buyFee: 0.5, sellFee: 2 }],
      };
      expect(resolverFee(cfg, 'ripio', 'buyFee')).toBe(0.5);
      expect(resolverFee(cfg, 'ripio', 'sellFee')).toBe(2);
    });
  });
});
