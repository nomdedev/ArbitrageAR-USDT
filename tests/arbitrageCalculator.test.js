/**
 * Tests para ArbitrageCalculator
 *
 * Motor central de cálculo de rutas de arbitraje.
 * Estos tests son los más críticos: un bug aquí significa
 * que el usuario ve profits incorrectos y pierde dinero.
 */

// El módulo asigna a `self.ArbitrageCalculator` (jsdom provee `self`)
require('../src/background/arbitrageCalculator.js');

describe('ArbitrageCalculator', () => {
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
    it('calcula profit positivo: USDT cuesta más que el dólar oficial', () => {
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
    });

    it('calcula profit negativo: USDT está por debajo del dólar', () => {
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

    it('calcula el profitPercentage correctamente para caso simple', () => {
      // Sin fees (trading=0, bank=0): initialAmount=1000, dólar=1000, USDT=1000
      // → 1000 ARS → 1 USD → 1 USDT → 1000 ARS, profit = 0%
      const result = calc.calculateSimpleArbitrage({
        initialAmount: 1000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 1000,
        fees: { trading: 0, bank: 0 }
      });

      expect(result.profitPercentage).toBeCloseTo(0, 4);
    });

    it('comisión de trading reduce el profit', () => {
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
        fees: { trading: 0.01 } // 1% de fee
      });

      expect(conComision.profitPercentage).toBeLessThan(sinComision.profitPercentage);
      expect(conComision.finalAmount).toBeLessThan(sinComision.finalAmount);
    });

    it('comisión bancaria reduce el profit', () => {
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
        fees: { trading: 0, bank: 0.005 } // 0.5% de fee bancario
      });

      expect(conComision.profitPercentage).toBeLessThan(sinComision.profitPercentage);
    });

    it('retorna null cuando initialAmount es 0 o undefined', () => {
      expect(calc.calculateSimpleArbitrage({ initialAmount: 0, dollarBuyPrice: 1000, usdtSellPrice: 1050 })).toBeNull();
      expect(calc.calculateSimpleArbitrage({ dollarBuyPrice: 1000, usdtSellPrice: 1050 })).toBeNull();
    });

    it('retorna null cuando falta dollarBuyPrice', () => {
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, usdtSellPrice: 1050 })).toBeNull();
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, dollarBuyPrice: 0, usdtSellPrice: 1050 })).toBeNull();
    });

    it('retorna null cuando falta usdtSellPrice', () => {
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, dollarBuyPrice: 1000 })).toBeNull();
      expect(calc.calculateSimpleArbitrage({ initialAmount: 100000, dollarBuyPrice: 1000, usdtSellPrice: 0 })).toBeNull();
    });

    it('el resultado incluye los pasos intermedios correctos', () => {
      const result = calc.calculateSimpleArbitrage({
        initialAmount: 100000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 1000,
        fees: { trading: 0, bank: 0 }
      });

      // Con 100000 ARS y dólar a 1000, se compran 100 USD
      expect(result.steps.usdBought).toBeCloseTo(100, 2);
      // Con fee 0, USDT = USD
      expect(result.steps.usdtBought).toBeCloseTo(100, 2);
      // USDT × precio = ARS recibidos
      expect(result.steps.arsReceived).toBeCloseTo(100000, 0);
    });

    it('profitPercentage redondeado a máximo 3 decimales', () => {
      const result = calc.calculateSimpleArbitrage({
        initialAmount: 100000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 1050
      });

      const strVal = result.profitPercentage.toString();
      const decimals = (strVal.split('.')[1] || '').length;
      expect(decimals).toBeLessThanOrEqual(3);
    });

    it('profit = finalAmount - initialAmount (consistencia interna)', () => {
      const result = calc.calculateSimpleArbitrage({
        initialAmount: 100000,
        dollarBuyPrice: 1000,
        usdtSellPrice: 1080
      });

      // Verificar coherencia: profit debe ser aproximadamente finalAmount - initialAmount
      // (puede diferir en centavos por redondeo)
      expect(Math.abs(result.profit - (result.finalAmount - result.initialAmount))).toBeLessThan(1);
    });
  });

  // ============================================================
  // calculateInterBrokerRoute
  // Ruta: comprar USDT en exchange A, vender en exchange B
  // ============================================================
  describe('calculateInterBrokerRoute', () => {
    it('calcula profit positivo cuando sellPrice > buyPrice', () => {
      // La función: ARS → USD (dollarPrice) → USDT (buyPrice en USD/USDT) → ARS (sellPrice en ARS/USDT)
      // Para profit positivo necesitamos: sellPrice > dollarPrice × buyPrice
      // sellPrice(1100) > dollarPrice(1000) × buyPrice(1) = 1000 → +10% bruto
      const result = calc.calculateInterBrokerRoute({
        buyExchange: 'binance',
        sellExchange: 'buenbit',
        buyPrice: 1,    // 1 USD por USDT (tasa de exchange)
        sellPrice: 1100,  // 1100 ARS por USDT (precio de mercado)
        dollarPrice: 1000, // 1000 ARS por USD (dólar oficial)
        initialAmount: 1000000
      });

      expect(result).not.toBeNull();
      expect(result.profitPercentage).toBeGreaterThan(0);
      expect(result.buyExchange).toBe('binance');
      expect(result.sellExchange).toBe('buenbit');
    });

    it('retorna null cuando buyPrice >= sellPrice (sin oportunidad de arbitraje)', () => {
      // Comprar igual que vender = sin profit
      expect(calc.calculateInterBrokerRoute({
        buyPrice: 1500,
        sellPrice: 1500,
        dollarPrice: 1000
      })).toBeNull();

      // Comprar más caro que vender = pérdida garantizada
      expect(calc.calculateInterBrokerRoute({
        buyPrice: 1600,
        sellPrice: 1500,
        dollarPrice: 1000
      })).toBeNull();
    });

    it('retorna null cuando faltan precios fundamentales', () => {
      expect(calc.calculateInterBrokerRoute({ sellPrice: 1500, dollarPrice: 1000 })).toBeNull();
      expect(calc.calculateInterBrokerRoute({ buyPrice: 1400, dollarPrice: 1000 })).toBeNull();
      expect(calc.calculateInterBrokerRoute({ buyPrice: 1400, sellPrice: 1500 })).toBeNull();
    });

    it('spread = sellPrice - buyPrice', () => {
      const result = calc.calculateInterBrokerRoute({
        buyPrice: 1480,
        sellPrice: 1520,
        dollarPrice: 1000
      });

      expect(result.spread).toBeCloseTo(40, 1);
    });

    it('spreadPercent ≈ (sellPrice - buyPrice) / buyPrice * 100', () => {
      const result = calc.calculateInterBrokerRoute({
        buyPrice: 1480,
        sellPrice: 1520,
        dollarPrice: 1000
      });

      const expectedSpreadPct = ((1520 - 1480) / 1480) * 100;
      expect(result.spreadPercent).toBeCloseTo(expectedSpreadPct, 1);
    });

    it('mayor dollarPrice reduce el profitPercentage', () => {
      // profit% = sellPrice/(dollarPrice × buyPrice) - 1
      // Con más caro el dólar, el ratio baja → menos profit
      const dolarBarato = calc.calculateInterBrokerRoute({
        buyPrice: 1,
        sellPrice: 1300,
        dollarPrice: 1000 // sellPrice/dollarPrice = 1.3 → +30% bruto
      });

      const dolarCaro = calc.calculateInterBrokerRoute({
        buyPrice: 1,
        sellPrice: 1300,
        dollarPrice: 1100 // sellPrice/dollarPrice = 1.18 → +18% bruto
      });

      // Con dólar más caro, la oportunidad de arbitraje es menor
      expect(dolarCaro.profitPercentage).toBeLessThan(dolarBarato.profitPercentage);
      // Ambas deben seguir siendo positivas (sellPrice > dollarPrice × buyPrice en ambos casos)
      expect(dolarBarato.profitPercentage).toBeGreaterThan(0);
      expect(dolarCaro.profitPercentage).toBeGreaterThan(0);
    });

    it('incluye todos los campos requeridos en el resultado', () => {
      const result = calc.calculateInterBrokerRoute({
        buyExchange: 'X',
        sellExchange: 'Y',
        buyPrice: 1480,
        sellPrice: 1520,
        dollarPrice: 1000
      });

      expect(result).toHaveProperty('profitPercentage');
      expect(result).toHaveProperty('profit');
      expect(result).toHaveProperty('finalAmount');
      expect(result).toHaveProperty('spread');
      expect(result).toHaveProperty('spreadPercent');
      expect(result).toHaveProperty('initialAmount');
      expect(result).toHaveProperty('dollarPrice');
      expect(result).toHaveProperty('buyPrice');
      expect(result).toHaveProperty('sellPrice');
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
    });

    it('detecta P2P por nombre del broker (case-insensitive)', () => {
      expect(calc.isP2PRoute({ broker: 'binancep2p' })).toBe(true);
      expect(calc.isP2PRoute({ broker: 'BinanceP2P' })).toBe(true);
      expect(calc.isP2PRoute({ broker: 'some-p2p-exchange' })).toBe(true);
    });

    it('detecta patrones c2c y peer', () => {
      expect(calc.isP2PRoute({ broker: 'c2c-market' })).toBe(true);
      expect(calc.isP2PRoute({ broker: 'peer-exchange' })).toBe(true);
    });

    it('NO detecta P2P en brokers normales', () => {
      expect(calc.isP2PRoute({ broker: 'binance' })).toBe(false);
      expect(calc.isP2PRoute({ broker: 'buenbit' })).toBe(false);
      expect(calc.isP2PRoute({ broker: 'ripio' })).toBe(false);
    });

    it('detecta P2P en buyExchange o sellExchange', () => {
      expect(calc.isP2PRoute({ buyExchange: 'p2p-exchange', sellExchange: 'binance' })).toBe(true);
      expect(calc.isP2PRoute({ buyExchange: 'binance', sellExchange: 'c2c-market' })).toBe(true);
    });
  });

  // ============================================================
  // filterRoutes
  // ============================================================
  describe('filterRoutes', () => {
    const routes = [
      { broker: 'binance',    profitPercentage: 5,  requiresP2P: false },
      { broker: 'buenbit',    profitPercentage: 1.5,  requiresP2P: false },
      { broker: 'binancep2p', profitPercentage: 3,  requiresP2P: true  },
      { broker: 'ripio',      profitPercentage: -2, requiresP2P: false },
      { broker: 'fiwind',     profitPercentage: -15, requiresP2P: false }, // < minProfit defecto -10
    ];

    it('sin filtros excluye sólo rutas bajo el minProfit por defecto (-10%)', () => {
      const result = calc.filterRoutes(routes);
      expect(result).toHaveLength(4); // Excluye -15%
    });

    it('hideNegative=true excluye todas las rutas con profit < 0', () => {
      const result = calc.filterRoutes(routes, { hideNegative: true });
      expect(result.every(r => r.profitPercentage >= 0)).toBe(true);
      expect(result).toHaveLength(3); // 5, 1.5, 3
    });

    it('hideP2P=true excluye rutas P2P', () => {
      const result = calc.filterRoutes(routes, { hideP2P: true });
      expect(result.some(r => r.requiresP2P || r.broker.includes('p2p'))).toBe(false);
    });

    it('onlyP2P=true incluye sólo rutas P2P', () => {
      const result = calc.filterRoutes(routes, { onlyP2P: true });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(r => r.requiresP2P || r.broker.includes('p2p'))).toBe(true);
    });

    it('filtro por exchange específico (match exacto)', () => {
      const result = calc.filterRoutes(routes, { exchange: 'binance' });
      expect(result).toHaveLength(1);
      expect(result[0].broker).toBe('binance');
    });

    it('exchange="all" no aplica filtro de exchange', () => {
      const result = calc.filterRoutes(routes, { exchange: 'all' });
      expect(result).toHaveLength(4); // Sigue excluyendo -15%
    });

    it('minProfit personalizado filtra correctamente', () => {
      const result = calc.filterRoutes(routes, { minProfit: 0 });
      expect(result.every(r => r.profitPercentage >= 0)).toBe(true);
    });

    it('no muta el array original', () => {
      const original = [...routes];
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

    it('profit-desc: mayor profit primero', () => {
      const sorted = calc.sortRoutes(routes, 'profit-desc');
      expect(sorted[0].profitPercentage).toBe(5);
      expect(sorted[1].profitPercentage).toBe(2);
      expect(sorted[2].profitPercentage).toBe(-1);
    });

    it('profit-asc: menor profit primero', () => {
      const sorted = calc.sortRoutes(routes, 'profit-asc');
      expect(sorted[0].profitPercentage).toBe(-1);
      expect(sorted[sorted.length - 1].profitPercentage).toBe(5);
    });

    it('name-asc: orden alfabético por broker', () => {
      const sorted = calc.sortRoutes(routes, 'name-asc');
      expect(sorted[0].broker).toBe('binance');
      expect(sorted[1].broker).toBe('buenbit');
      expect(sorted[2].broker).toBe('ripio');
    });

    it('spread-desc: mayor spread primero', () => {
      const withSpread = [
        { profitPercentage: 1, spread: 50 },
        { profitPercentage: 5, spread: 10 },
        { profitPercentage: 3, spread: 30 },
      ];
      const sorted = calc.sortRoutes(withSpread, 'spread-desc');
      expect(sorted[0].spread).toBe(50);
    });

    it('sortBy desconocido no modifica el orden', () => {
      const sorted = calc.sortRoutes(routes, 'unknown-sort');
      expect(sorted[0].broker).toBe(routes[0].broker);
    });

    it('no muta el array original', () => {
      const copy = routes.map(r => ({ ...r }));
      calc.sortRoutes(routes, 'profit-desc');
      routes.forEach((r, i) => expect(r.broker).toBe(copy[i].broker));
    });
  });

  // ============================================================
  // getRoutesStats
  // ============================================================
  describe('getRoutesStats', () => {
    it('retorna stats vacías para array vacío', () => {
      const stats = calc.getRoutesStats([]);
      expect(stats.count).toBe(0);
      expect(stats.profitable).toBe(0);
      expect(stats.avgProfit).toBe(0);
      expect(stats.maxProfit).toBe(0);
      expect(stats.minProfit).toBe(0);
    });

    it('retorna stats vacías para null', () => {
      const stats = calc.getRoutesStats(null);
      expect(stats.count).toBe(0);
    });

    it('retorna stats vacías para undefined', () => {
      const stats = calc.getRoutesStats(undefined);
      expect(stats.count).toBe(0);
    });

    it('calcula count correctamente', () => {
      const routes = [
        { profitPercentage: 3.5 },
        { profitPercentage: -1 },
        { profitPercentage: 2 },
      ];
      expect(calc.getRoutesStats(routes).count).toBe(3);
    });

    it('cuenta sólo rutas profitable (profitPercentage > 0)', () => {
      const routes = [
        { profitPercentage: 3.5 },
        { profitPercentage: 0   }, // 0 no es "profitable"
        { profitPercentage: -1 },
        { profitPercentage: 2 },
      ];
      expect(calc.getRoutesStats(routes).profitable).toBe(2);
    });

    it('calcula maxProfit y minProfit correctamente', () => {
      const routes = [
        { profitPercentage: 3.5 },
        { profitPercentage: -1 },
        { profitPercentage: 2 },
      ];
      const stats = calc.getRoutesStats(routes);
      expect(stats.maxProfit).toBe(3.5);
      expect(stats.minProfit).toBe(-1);
    });

    it('calcula avgProfit como promedio de todos (incluyendo negativos)', () => {
      const routes = [
        { profitPercentage: 4 },
        { profitPercentage: 2 },
      ];
      expect(calc.getRoutesStats(routes).avgProfit).toBeCloseTo(3, 2);
    });

    it('statscon una sola ruta', () => {
      const stats = calc.getRoutesStats([{ profitPercentage: 7.5 }]);
      expect(stats.count).toBe(1);
      expect(stats.maxProfit).toBe(7.5);
      expect(stats.minProfit).toBe(7.5);
      expect(stats.avgProfit).toBe(7.5);
    });
  });
});
