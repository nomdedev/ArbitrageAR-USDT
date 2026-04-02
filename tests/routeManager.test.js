/**
 * Tests para RouteManager
 *
 * RouteManager gestiona el estado de las rutas filtradas
 * y provee funciones puras usadas por FilterManager y la UI.
 * Los bugs en isP2PRoute o sortRoutes afectan los filtros visibles.
 *
 * Patron: IIFE que expone window.RouteManager (jsdom).
 *
 * Tests consolidados: 6 tests cubriendo toda la funcionalidad.
 */

beforeAll(() => {
  // Stub de dependencias opcionales antes de cargar el modulo
  globalThis.window.Logger = { debug: () => {}, warn: () => {}, error: () => {} };
  globalThis.window.Formatters = { formatNumber: String };
  require('../src/modules/routeManager.js');
});

describe('RouteManager', () => {
  let RM;

  const ROUTES = [
    { broker: 'Binance',    buyExchange: 'Binance',    sellExchange: 'Binance',    profitPercentage: 5.5,  requiresP2P: false, calculation: { initialAmount: 500000 } },
    { broker: 'Buenbit',   buyExchange: 'Buenbit',    sellExchange: 'Buenbit',    profitPercentage: 2.1,  requiresP2P: false, calculation: { initialAmount: 100000 } },
    { broker: 'Lemon P2P', buyExchange: 'Lemon P2P',  sellExchange: 'Lemon P2P', profitPercentage: 9,  requiresP2P: true,  calculation: { initialAmount: 200000 } },
    { broker: 'Ripio',     buyExchange: 'Ripio',      sellExchange: 'Binance',    profitPercentage: -2.5, requiresP2P: false, calculation: { initialAmount: 300000 } },
  ];

  beforeAll(() => {
    RM = globalThis.window?.RouteManager;
    if (!RM) throw new Error('RouteManager no fue expuesto en window');
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // TEST 1: Constantes
  // ============================================================
  describe('constantes', () => {
    it('expone ROUTE_TYPES y ROUTE_CATEGORIES con todos los valores esperados', () => {
      // ROUTE_TYPES
      expect(RM.ROUTE_TYPES.ARBITRAGE).toBe('arbitrage');
      expect(RM.ROUTE_TYPES.DIRECT_USDT_ARS).toBe('direct_usdt_ars');
      expect(RM.ROUTE_TYPES.USD_TO_USDT).toBe('usd_to_usdt');

      // ROUTE_CATEGORIES
      expect(RM.ROUTE_CATEGORIES.PROFIT_HIGH).toBe('profit-high');
      expect(RM.ROUTE_CATEGORIES.PROFIT_NEGATIVE).toBe('profit-negative');
      expect(RM.ROUTE_CATEGORIES.SINGLE_EXCHANGE).toBe('single-exchange');
      expect(RM.ROUTE_CATEGORIES.MULTI_EXCHANGE).toBe('multi-exchange');
    });
  });

  // ============================================================
  // TEST 2: isP2PRoute - Deteccion de rutas P2P
  // ============================================================
  describe('isP2PRoute', () => {
    it('detecta correctamente rutas P2P usando requiresP2P, nombre de broker o exchange', () => {
      // Deteccion por campo requiresP2P (fuente de verdad)
      expect(RM.isP2PRoute({ requiresP2P: true })).toBe(true);
      expect(RM.isP2PRoute({ requiresP2P: false })).toBe(false);

      // Campo requiresP2P tiene prioridad sobre el nombre
      expect(RM.isP2PRoute({ requiresP2P: false, broker: 'Binance P2P' })).toBe(false);

      // Deteccion por nombre del broker cuando no hay requiresP2P
      expect(RM.isP2PRoute({ broker: 'Lemon p2p' })).toBe(true);
      expect(RM.isP2PRoute({ broker: 'Binance P2P' })).toBe(true);

      // Deteccion por nombre de exchange
      expect(RM.isP2PRoute({ buyExchange: 'Bitget P2P' })).toBe(true);
      expect(RM.isP2PRoute({ sellExchange: 'Paxful p2p' })).toBe(true);

      // Sin indicadores P2P retorna false
      expect(RM.isP2PRoute({ broker: 'Binance', buyExchange: 'Binance' })).toBe(false);

      // Casos edge: null y undefined
      expect(RM.isP2PRoute(null)).toBe(false);
      expect(RM.isP2PRoute(undefined)).toBe(false);
    });
  });

  // ============================================================
  // TEST 3: sortRoutes - Ordenamiento de rutas
  // ============================================================
  describe('sortRoutes', () => {
    it('ordena rutas correctamente por profit (desc/asc), exchange e investment', () => {
      // profit-desc: mayor a menor
      const byProfitDesc = RM.sortRoutes([...ROUTES], 'profit-desc');
      expect(byProfitDesc[0].profitPercentage).toBe(9);
      expect(byProfitDesc[byProfitDesc.length - 1].profitPercentage).toBe(-2.5);

      // profit-asc: menor a mayor
      const byProfitAsc = RM.sortRoutes([...ROUTES], 'profit-asc');
      expect(byProfitAsc[0].profitPercentage).toBe(-2.5);
      expect(byProfitAsc[byProfitAsc.length - 1].profitPercentage).toBe(9);

      // exchange-asc: orden alfabetico por buyExchange
      const byExchange = RM.sortRoutes([...ROUTES], 'exchange-asc');
      const exchanges = byExchange.map(r => (r.buyExchange || '').toLowerCase());
      for (let i = 0; i < exchanges.length - 1; i++) {
        expect(exchanges[i].localeCompare(exchanges[i + 1])).toBeLessThanOrEqual(0);
      }

      // investment-desc: mayor a menor por initialAmount
      const byInvestment = RM.sortRoutes([...ROUTES], 'investment-desc');
      expect(byInvestment[0].calculation.initialAmount).toBe(500000);
      expect(byInvestment[byInvestment.length - 1].calculation.initialAmount).toBe(100000);
    });

    it('maneja criterios desconocidos, arrays vacios y no modifica el original', () => {
      // Criterio desconocido usa profit-desc como fallback
      const unknownSort = RM.sortRoutes([...ROUTES], 'criterio-desconocido');
      const defaultSort = RM.sortRoutes([...ROUTES], 'profit-desc');
      expect(unknownSort.map(r => r.broker)).toEqual(defaultSort.map(r => r.broker));

      // Array vacio retorna array vacio
      expect(RM.sortRoutes([], 'profit-desc')).toEqual([]);

      // No modifica el array original
      const original = [...ROUTES];
      RM.sortRoutes(original, 'profit-asc');
      expect(original[0]).toBe(ROUTES[0]); // misma referencia en mismo indice
    });
  });

  // ============================================================
  // TEST 4: Gestion de rutas (updateData, getAllRoutes, setFilteredRoutes, getFilteredRoutes)
  // ============================================================
  describe('gestion de rutas (updateData/getAllRoutes/setFilteredRoutes/getFilteredRoutes)', () => {
    beforeEach(() => {
      RM.updateData({ optimizedRoutes: ROUTES });
    });

    it('gestiona correctamente el ciclo de vida de rutas: cargar, obtener, filtrar y limpiar', () => {
      // getAllRoutes retorna las rutas cargadas
      expect(RM.getAllRoutes()).toHaveLength(ROUTES.length);

      // setFilteredRoutes y getFilteredRoutes guardan y devuelven rutas filtradas
      const filtered = ROUTES.slice(0, 2);
      RM.setFilteredRoutes(filtered);
      expect(RM.getFilteredRoutes()).toHaveLength(2);
      expect(RM.getFilteredRoutes()[0].broker).toBe('Binance');

      // setFilteredRoutes acepta null y retorna []
      RM.setFilteredRoutes(null);
      expect(RM.getFilteredRoutes()).toEqual([]);

      // updateData con array vacio deja allRoutes en []
      RM.updateData({ optimizedRoutes: [] });
      expect(RM.getAllRoutes()).toEqual([]);

      // updateData con objeto sin optimizedRoutes deja allRoutes en []
      RM.updateData({});
      expect(RM.getAllRoutes()).toEqual([]);
    });
  });

  // ============================================================
  // TEST 5: updateSettings
  // ============================================================
  describe('updateSettings', () => {
    it('acepta configuracion valida y valores nulos sin lanzar errores', () => {
      // Configuracion valida
      expect(() => RM.updateSettings({ interfaceCompactView: true })).not.toThrow();

      // Null aceptado
      expect(() => RM.updateSettings(null)).not.toThrow();

      // Undefined aceptado
      expect(() => RM.updateSettings(undefined)).not.toThrow();
    });
  });
});