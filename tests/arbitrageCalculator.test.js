/**
 * Tests para ArbitrageCalculator
 *
 * Motor central de cálculo de rutas de arbitraje.
 * Estos tests son los más críticos: un bug aquí significa
 * que el usuario ve profits incorrectos y pierde dinero.
 *
 * Tests consolidados: 48 → 15
 */

// El módulo asigna a `self.ArbitrageCalculator` (jsdom provee `self`)
require('../src/background/arbitrageCalculator.js');

describe('arbitrageCalculator', () => {
  let calc;

  beforeAll(() => {
    calc = globalThis.self?.ArbitrageCalculator || globalThis.window?.ArbitrageCalculator;
    if (!calc) throw new Error('ArbitrageCalculator no fue expuesto en self/window');
  });

  // ============================================================
  // calculateSimpleArbitrage
  // Ruta: ARS → USD (banco) → USDT → ARS
  // ============================================================
  describe('calculateSimpleArbitrage', () => {
    it('calcula profit positivo correctamente con fees', () => {
      // Dólar a $1000, USDT a $1050 → se puede comprar barato y vender caro
      const result = calc.calculateSimpleArbitrage({
        initialAmount: 100000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 1050
      });

      expect(result).not.toBeNull();
      expect(result.profitPercentage).toBeGreaterThan(0);
      expect(result.profit).toBeGreaterThan(0);
      expect(result.finalAmount).toBeGreaterThan(result.initialAmount);
      expect(result.steps.usdBought).toBeCloseTo(100, 2);

      // Verificar que las comisiones reducen el profit
      const sinComision = calc.calculateSimpleArbitrage({
        initialAmount: 100000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 1050,
        fees: { trading: 0, bank: 0 }
      });

      const conComision = calc.calculateSimpleArbitrage({
        initialAmount: 100000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 1050,
        fees: { trading: 0.01, bank: 0.005 }
      });

      expect(conComision.profitPercentage).toBeLessThan(sinComision.profitPercentage);
      expect(conComision.finalAmount).toBeLessThan(sinComision.finalAmount);
    });

    it('calcula profit negativo cuando USDT está por debajo del dólar', () => {
      const result = calc.calculateSimpleArbitrage({
        initialAmount: 100000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 950
      });

      expect(result).not.toBeNull();
      expect(result.profitPercentage).toBeLessThan(0);
      expect(result.profit).toBeLessThan(0);
      expect(result.finalAmount).toBeLessThan(result.initialAmount);
    });

    it('retorna null para inputs inválidos', () => {
      // initialAmount inválido
      expect(calc.calculateSimpleArbitrage({ initialAmount: 0, dollarBuyPrice: 1000, usdtSellPrice: 1050 })).toBeNull();
      expect(calc.calculateSimpleArbitrage({ dollarBuyPrice: 1000, usdtSellPrice: 1050 })).toBeNull();

      // dollarBuyPrice inválido
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, usdtSellPrice: 1050 })).toBeNull();
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, dollarBuyPrice: 0, usdtSellPrice: 1050 })).toBeNull();

      // usdtSellPrice inválido
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, dollarBuyPrice: 1000 })).toBeNull();
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, dollarBuyPrice: 1000, usdtSellPrice: 0 })).toBeNull();
    });
  });

  // ============================================================
  // calculateInterBrokerRoute
  // Ruta: comprar USDT en exchange A, vender en exchange B
  // ============================================================
  describe('calculateInterBrokerRoute', () => {
    it('calcula profit positivo cuando sellPrice > dollarPrice × buyPrice', () => {
      const result = calc.calculateInterBrokerRoute({
        buyExchange: 'binance',
        sellExchange: 'buenbit',
        buyPrice: 1,
        sellPrice: 1100,
        dollarPrice: 1000,
        initialAmount: 1000000
      });

      expect(result).not.toBeNull();
      expect(result.profitPercentage).toBeGreaterThan(0);
      expect(result.buyExchange).toBe('binance');
      expect(result.sellExchange).toBe('buenbit');
      expect(result).toHaveProperty('spread');
      expect(result).toHaveProperty('profit');
      expect(result).toHaveProperty('finalAmount');
      expect(result).toHaveProperty('spreadPercent');
    });

    it('retorna null cuando buyPrice >= sellPrice o faltan parámetros', () => {
      // Sin oportunidad de arbitraje
      expect(calc.calculateInterBrokerRoute({
        buyPrice: 1500,
        sellPrice: 1500,
        dollarPrice: 1000
      })).toBeNull();

      expect(calc.calculateInterBrokerRoute({
        buyPrice: 1600,
        sellPrice: 1500,
        dollarPrice: 1000
      })).toBeNull();

      // Faltan parámetros fundamentales
      expect(calc.calculateInterBrokerRoute({ sellPrice: 1500, dollarPrice: 1000 })).toBeNull();
      expect(calc.calculateInterBrokerRoute({ buyPrice: 1400, dollarPrice: 1000 })).toBeNull();
      expect(calc.calculateInterBrokerRoute({ buyPrice: 1400, sellPrice: 1500 })).toBeNull();
    });

    it('mayor dollarPrice reduce el profitPercentage', () => {
      const dolarBarato = calc.calculateInterBrokerRoute({
        buyPrice: 1,
        sellPrice: 1300,
        dollarPrice: 1000
      });

      const dolarCaro = calc.calculateInterBrokerRoute({
        buyPrice: 1,
        sellPrice: 1300,
        dollarPrice: 1100
      });

      expect(dolarCaro.profitPercentage).toBeLessThan(dolarBarato.profitPercentage);
      expect(dolarBarato.profitPercentage).toBeGreaterThan(0);
      expect(dolarCaro.profitPercentage).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // isP2PRoute
  // ============================================================
  describe('isP2PRoute', () => {
    it('retorna false para null y undefined', () => {
      expect(calc.isP2PRoute(null)).toBe(false);
      expect(calc.isP2PRoute(undefined)).toBe(false);
    });

    it('usa el flag explícito requiresP2P cuando está presente', () => {
      expect(calc.isP2PRoute({ requiresP2P: true })).toBe(true);
      expect(calc.isP2PRoute({ requiresP2P: false })).toBe(false);
      expect(calc.isP2PRoute({ broker: 'binance', requiresP2P: true })).toBe(true);
    });

    it('detecta P2P por nombre del broker (case-insensitive) y en exchanges', () => {
      // Por nombre de broker
      expect(calc.isP2PRoute({ broker: 'binancep2p' })).toBe(true);
      expect(calc.isP2PRoute({ broker: 'BinanceP2P' })).toBe(true);
      expect(calc.isP2PRoute({ broker: 'some-p2p-exchange' })).toBe(true);
      expect(calc.isP2PRoute({ broker: 'c2c-market' })).toBe(true);
      expect(calc.isP2PRoute({ broker: 'peer-exchange' })).toBe(true);

      // Brokers normales NO son P2P
      expect(calc.isP2PRoute({ broker: 'binance' })).toBe(false);
      expect(calc.isP2PRoute({ broker: 'buenbit' })).toBe(false);
      expect(calc.isP2PRoute({ broker: 'ripio' })).toBe(false);

      // Por buyExchange o sellExchange
      expect(calc.isP2PRoute({ buyExchange: 'p2p-exchange', sellExchange: 'binance' })).toBe(true);
      expect(calc.isP2PRoute({ buyExchange: 'binance', sellExchange: 'c2c-market' })).toBe(true);
    });
  });

  // ============================================================
  // filterRoutes
  // ============================================================
  describe('filterRoutes', () => {
    const routes = [
      { broker: 'binance',    profitPercentage: 5,   requiresP2P: false },
      { broker: 'buenbit',    profitPercentage: 1.5, requiresP2P: false },
      { broker: 'binancep2p', profitPercentage: 3,    requiresP2P: true  },
      { broker: 'ripio',      profitPercentage: -2,  requiresP2P: false },
      { broker: 'fiwind',     profitPercentage: -15, requiresP2P: false },
    ];

    it('aplica filtros básicos: minProfit por defecto (-10%), hideNegative, hideP2P', () => {
      // Sin filtros: excluye rutas bajo -10%
      const resultDefault = calc.filterRoutes(routes);
      expect(resultDefault).toHaveLength(4);
      expect(resultDefault.every(r => r.profitPercentage >= -10)).toBe(true);

      // hideNegative: excluye profit < 0
      const resultNegative = calc.filterRoutes(routes, { hideNegative: true });
      expect(resultNegative.every(r => r.profitPercentage >= 0)).toBe(true);
      expect(resultNegative).toHaveLength(3);

      // hideP2P: excluye rutas P2P
      const resultP2P = calc.filterRoutes(routes, { hideP2P: true });
      expect(resultP2P.some(r => r.requiresP2P || r.broker.includes('p2p'))).toBe(false);
    });

    it('filtra por exchange específico y onlyP2P', () => {
      // exchange específico
      const resultExchange = calc.filterRoutes(routes, { exchange: 'binance' });
      expect(resultExchange).toHaveLength(1);
      expect(resultExchange[0].broker).toBe('binance');

      // exchange="all" no aplica filtro de exchange
      const resultAll = calc.filterRoutes(routes, { exchange: 'all' });
      expect(resultAll).toHaveLength(4);

      // onlyP2P
      const resultOnlyP2P = calc.filterRoutes(routes, { onlyP2P: true });
      expect(resultOnlyP2P.length).toBeGreaterThan(0);
      expect(resultOnlyP2P.every(r => r.requiresP2P || r.broker.includes('p2p'))).toBe(true);
    });

    it('minProfit personalizado y no muta el array original', () => {
      const original = [...routes];

      // minProfit personalizado
      const result = calc.filterRoutes(routes, { minProfit: 0 });
      expect(result.every(r => r.profitPercentage >= 0)).toBe(true);

      // No muta el array original
      calc.filterRoutes(routes, { hideNegative: true });
      expect(routes).toHaveLength(original.length);
    });
  });

  // ============================================================
  // sortRoutes
  // ============================================================
  describe('sortRoutes', () => {
    const routes = [
      { broker: 'ripio',   profitPercentage: 2  },
      { broker: 'buenbit', profitPercentage: 5  },
      { broker: 'binance', profitPercentage: -1 },
    ];

    it('ordena por profit-desc y profit-asc correctamente', () => {
      const desc = calc.sortRoutes(routes, 'profit-desc');
      expect(desc[0].profitPercentage).toBe(5);
      expect(desc[1].profitPercentage).toBe(2);
      expect(desc[2].profitPercentage).toBe(-1);

      const asc = calc.sortRoutes(routes, 'profit-asc');
      expect(asc[0].profitPercentage).toBe(-1);
      expect(asc[asc.length - 1].profitPercentage).toBe(5);
    });

    it('ordena por name-asc y spread-desc correctamente', () => {
      const nameAsc = calc.sortRoutes(routes, 'name-asc');
      expect(nameAsc[0].broker).toBe('binance');
      expect(nameAsc[1].broker).toBe('buenbit');
      expect(nameAsc[2].broker).toBe('ripio');

      const withSpread = [
        { profitPercentage: 1, spread: 50 },
        { profitPercentage: 5, spread: 10 },
        { profitPercentage: 3, spread: 30 },
      ];
      const spreadDesc = calc.sortRoutes(withSpread, 'spread-desc');
      expect(spreadDesc[0].spread).toBe(50);
    });

    it('sortBy desconocido no modifica el orden y no muta el original', () => {
      const copy = routes.map(r => ({ ...r }));

      const sorted = calc.sortRoutes(routes, 'unknown-sort');
      expect(sorted[0].broker).toBe(routes[0].broker);

      // No muta el array original
      calc.sortRoutes(routes, 'profit-desc');
      routes.forEach((r, i) => expect(r.broker).toBe(copy[i].broker));
    });
  });
});