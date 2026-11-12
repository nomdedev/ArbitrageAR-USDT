/**
 * Cotizaciones viejas y base de precios del motor (service worker real).
 *
 * Medido en vivo (2026-11-12): CriptoYa devolvía 10 de 22 bancos con cotizaciones de hace 150
 * a 480 días, y el "consenso" por defecto daba 1470 cuando el oficial era ~1572 (rutas +7
 * puntos infladas). Además `fetchUSDT*` guardaba el precio crudo (`ask/bid`) bajo el nombre
 * `totalAsk/totalBid`, descartando la comisión que la API ya informa, y `resolveUsdToUsdtRate`
 * estimaba la tasa de forma circular.
 *
 * Se ejecutan las funciones REALES extraídas de main-simple.js con la red simulada.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'background', 'main-simple.js'),
  'utf8'
);

/** Extrae una función (async o no) por nombre, respetando llaves anidadas. */
function extraer(nombre) {
  const inicio = SRC.indexOf(`function ${nombre}(`);
  if (inicio === -1) throw new Error(`No se encontró ${nombre}`);
  const antes = SRC.slice(Math.max(0, inicio - 6), inicio);
  let i = SRC.indexOf('{', SRC.indexOf(')', inicio));
  let profundidad = 0;
  for (; i < SRC.length; i++) {
    if (SRC[i] === '{') profundidad++;
    else if (SRC[i] === '}' && --profundidad === 0) break;
  }
  return (antes === 'async ' ? 'async ' : '') + SRC.slice(inicio, i + 1);
}

const ahoraS = () => Math.floor(Date.now() / 1000);
const hace = segundos => ahoraS() - segundos;
const DIA = 24 * 60 * 60;

function construir(respuesta) {
  const ctx = vm.createContext({ console, Date, Object, Number, Error });
  ctx.log = () => {};
  ctx.fetchWithRateLimit = async () => respuesta;
  vm.runInContext(
    [
      'const MAX_BANK_QUOTE_AGE_S = 3 * 24 * 60 * 60;',
      'const MAX_EXCHANGE_QUOTE_AGE_S = 6 * 60 * 60;',
      'let cachedUsdtUsdData = {};',
      'let cachedUsdtData = null;',
      extraer('isFreshQuote'),
      extraer('fetchUSDT'),
      extraer('fetchUSDTtoUSD'),
      extraer('fetchBankDollarRates'),
      extraer('resolveUsdToUsdtRate'),
      'this.api = { isFreshQuote, fetchUSDT, fetchUSDTtoUSD, fetchBankDollarRates, resolveUsdToUsdtRate };'
    ].join('\n'),
    ctx
  );
  return ctx.api;
}

describe('isFreshQuote', () => {
  const { isFreshQuote } = construir({});

  test('descarta lo más viejo que el máximo y conserva lo vigente', () => {
    expect(isFreshQuote({ time: hace(10) }, 60)).toBe(true);
    expect(isFreshQuote({ time: hace(120) }, 60)).toBe(false);
  });

  test('sin `time` no se puede juzgar: se conserva', () => {
    expect(isFreshQuote({ ask: 1 }, 60)).toBe(true);
    expect(isFreshQuote(null, 60)).toBe(true);
  });
});

describe('bancos', () => {
  test('una cotización de hace meses no entra al cálculo del dólar', async () => {
    const { fetchBankDollarRates } = construir({
      bna: { ask: 1570, bid: 1520, time: hace(60) },
      galicia: { ask: 1470, bid: 1420, time: hace(327 * DIA) },
      bbva: { ask: 1455, bid: 1400, time: hace(153 * DIA) }
    });
    const r = await fetchBankDollarRates({});
    expect(r.bna).toBeDefined();
    expect(r.galicia).toBeUndefined();
    expect(r.bbva).toBeUndefined();
  });
});

describe('exchanges USDT', () => {
  test('usa totalAsk/totalBid (con comisión) y no el precio crudo', async () => {
    const { fetchUSDT } = construir({
      lemoncash: { ask: 1673.45, totalAsk: 1681.82, bid: 1603.52, totalBid: 1595.5, time: hace(5) }
    });
    const r = await fetchUSDT();
    expect(r.lemoncash.totalAsk).toBe(1681.82);
    expect(r.lemoncash.totalBid).toBe(1595.5);
  });

  test('si no hay total usa el crudo', async () => {
    const { fetchUSDT } = construir({ fiwind: { ask: 1665, bid: 1650, time: hace(5) } });
    expect((await fetchUSDT()).fiwind).toMatchObject({ totalAsk: 1665, totalBid: 1650 });
  });

  test('un exchange con la cotización vieja se descarta', async () => {
    const { fetchUSDTtoUSD } = construir({
      ripio: { ask: 1.08, bid: 1.05, time: hace(30) },
      kucoinp2p: { ask: 0.9, bid: 0.87, time: hace(20 * DIA) }
    });
    const r = await fetchUSDTtoUSD();
    expect(r.ripio).toBeDefined();
    expect(r.kucoinp2p).toBeUndefined();
  });

  test('si no queda ninguna vigente y no hay caché devuelve null (no un objeto vacío)', async () => {
    const { fetchUSDT } = construir({ ripio: { ask: 1676, bid: 1633, time: hace(20 * DIA) } });
    expect(await fetchUSDT()).toBeNull();
  });
});

describe('resolveUsdToUsdtRate', () => {
  const { resolveUsdToUsdtRate } = construir({});

  test('con cotización USDT/USD vigente la usa', () => {
    expect(resolveUsdToUsdtRate({ ripio: { totalAsk: 1.0819 } }, 'ripio')).toEqual({
      rate: 1.0819,
      usingFallback: false
    });
  });

  test('sin cotización descarta la ruta en vez de inventar una tasa circular', () => {
    expect(resolveUsdToUsdtRate({}, 'lemoncash', { totalAsk: 1681 }, 1570)).toBeNull();
    expect(resolveUsdToUsdtRate({ lemoncash: { totalAsk: 0 } }, 'lemoncash')).toBeNull();
  });
});

describe('getValidCryptoExchanges (rutas cripto)', () => {
  const ctx = vm.createContext({ Object, Number, Date });
  vm.runInContext(
    [
      'const MAX_EXCHANGE_QUOTE_AGE_S = 6 * 60 * 60;',
      extraer('isFreshQuote'),
      extraer('getValidCryptoExchanges'),
      'this.api = { getValidCryptoExchanges };'
    ].join('\n'),
    ctx
  );

  test('descarta el exchange con cotización vieja: no arma rutas con precios que ya no existen', () => {
    const datos = {
      symbol: 'POL',
      bitso: { totalAsk: 100, totalBid: 130, time: hace(3 * DIA) },
      ripio: { totalAsk: 100, totalBid: 101, time: hace(60) },
      binance: { totalAsk: 100, totalBid: 100.5 } // sin `time`: no se puede juzgar, se conserva
    };
    expect(ctx.api.getValidCryptoExchanges(datos)).toEqual(['ripio', 'binance']);
  });
});
