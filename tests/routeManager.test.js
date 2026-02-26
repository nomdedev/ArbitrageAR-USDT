/**
 * Tests para RouteManager
 *
 * RouteManager gestiona el estado de las rutas filtradas
 * y provee funciones puras usadas por FilterManager y la UI.
 * Los bugs en isP2PRoute o sortRoutes afectan los filtros visibles.
 *
 * Patrón: IIFE que expone window.RouteManager (jsdom).
 */

beforeAll(() => {
  // Stub de dependencias opcionales antes de cargar el módulo
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
  // CONSTANTES
  // ============================================================
  describe('constantes', () => {
    it('ROUTE_TYPES tiene ARBITRAGE, DIRECT_USDT_ARS, USD_TO_USDT', () => {
      expect(RM.ROUTE_TYPES.ARBITRAGE).toBe('arbitrage');
      expect(RM.ROUTE_TYPES.DIRECT_USDT_ARS).toBe('direct_usdt_ars');
      expect(RM.ROUTE_TYPES.USD_TO_USDT).toBe('usd_to_usdt');
    });

    it('ROUTE_CATEGORIES tiene las 4 categorías', () => {
      expect(RM.ROUTE_CATEGORIES.PROFIT_HIGH).toBe('profit-high');
      expect(RM.ROUTE_CATEGORIES.PROFIT_NEGATIVE).toBe('profit-negative');
      expect(RM.ROUTE_CATEGORIES.SINGLE_EXCHANGE).toBe('single-exchange');
      expect(RM.ROUTE_CATEGORIES.MULTI_EXCHANGE).toBe('multi-exchange');
    });
  });

  // ============================================================
  // isP2PRoute
  // ============================================================
  describe('isP2PRoute', () => {
    it('retorna true cuando requiresP2P === true', () => {
      expect(RM.isP2PRoute({ requiresP2P: true })).toBe(true);
    });

    it('retorna false cuando requiresP2P === false', () => {
      expect(RM.isP2PRoute({ requiresP2P: false })).toBe(false);
    });

    it('usa requiresP2P como fuente de verdad (ignora nombre)', () => {
      // Aunque el nombre diga P2P, si el campo booleano dice false → false
      expect(RM.isP2PRoute({ requiresP2P: false, broker: 'Binance P2P' })).toBe(false);
    });

    it('detecta P2P por nombre del broker cuando no hay requiresP2P', () => {
      expect(RM.isP2PRoute({ broker: 'Lemon p2p' })).toBe(true);
    });

    it('detecta P2P por nombre de exchange', () => {
      expect(RM.isP2PRoute({ buyExchange: 'Bitget P2P' })).toBe(true);
      expect(RM.isP2PRoute({ sellExchange: 'Paxful p2p' })).toBe(true);
    });

    it('retorna false para objeto sin indicadores P2P', () => {
      expect(RM.isP2PRoute({ broker: 'Binance', buyExchange: 'Binance' })).toBe(false);
    });

    it('retorna false para null', () => {
      expect(RM.isP2PRoute(null)).toBe(false);
    });

    it('retorna false para undefined', () => {
      expect(RM.isP2PRoute(undefined)).toBe(false);
    });
  });

  // ============================================================
  // sortRoutes
  // ============================================================
  describe('sortRoutes', () => {
    it('profit-desc ordena de mayor a menor profitPercentage', () => {
      const sorted = RM.sortRoutes([...ROUTES], 'profit-desc');
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].profitPercentage).toBeGreaterThanOrEqual(sorted[i + 1].profitPercentage);
      }
    });

    it('profit-asc ordena de menor a mayor profitPercentage', () => {
      const sorted = RM.sortRoutes([...ROUTES], 'profit-asc');
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].profitPercentage).toBeLessThanOrEqual(sorted[i + 1].profitPercentage);
      }
    });

    it('exchange-asc ordena alfabéticamente por buyExchange', () => {
      const sorted = RM.sortRoutes([...ROUTES], 'exchange-asc');
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = (sorted[i].buyExchange || '').toLowerCase();
        const b = (sorted[i + 1].buyExchange || '').toLowerCase();
        expect(a.localeCompare(b)).toBeLessThanOrEqual(0);
      }
    });

    it('investment-desc ordena por initialAmount descendente', () => {
      const sorted = RM.sortRoutes([...ROUTES], 'investment-desc');
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i].calculation?.initialAmount || 0;
        const b = sorted[i + 1].calculation?.initialAmount || 0;
        expect(a).toBeGreaterThanOrEqual(b);
      }
    });

    it('criterio desconocido usa profit-desc como fallback', () => {
      const sorted = RM.sortRoutes([...ROUTES], 'algo-raro');
      const byDesc = RM.sortRoutes([...ROUTES], 'profit-desc');
      expect(sorted.map(r => r.broker)).toEqual(byDesc.map(r => r.broker));
    });

    it('no modifica el array original', () => {
      const copia = [...ROUTES];
      RM.sortRoutes(copia, 'profit-asc');
      expect(copia[0]).toBe(ROUTES[0]); // misma referencia en mismo índice
    });

    it('retorna array vacío si se pasa vacío', () => {
      expect(RM.sortRoutes([], 'profit-desc')).toEqual([]);
    });
  });

  // ============================================================
  // setFilteredRoutes / getFilteredRoutes / getAllRoutes
  // ============================================================
  describe('gestión de rutas', () => {
    beforeEach(() => {
      // Simular init vía updateData
      RM.updateData({ optimizedRoutes: ROUTES });
    });

    it('getAllRoutes retorna las rutas cargadas', () => {
      expect(RM.getAllRoutes()).toHaveLength(ROUTES.length);
    });

    it('setFilteredRoutes / getFilteredRoutes guardan y devuelven las rutas', () => {
      const filtered = ROUTES.slice(0, 2);
      RM.setFilteredRoutes(filtered);
      expect(RM.getFilteredRoutes()).toHaveLength(2);
      expect(RM.getFilteredRoutes()[0].broker).toBe('Binance');
    });

    it('setFilteredRoutes acepta null/undefined y retorna []', () => {
      RM.setFilteredRoutes(null);
      expect(RM.getFilteredRoutes()).toEqual([]);
    });

    it('updateData con array vacío deja allRoutes en []', () => {
      RM.updateData({ optimizedRoutes: [] });
      expect(RM.getAllRoutes()).toEqual([]);
    });

    it('updateData con objeto sin optimizedRoutes deja allRoutes en []', () => {
      RM.updateData({});
      expect(RM.getAllRoutes()).toEqual([]);
    });
  });

  // ============================================================
  // updateSettings
  // ============================================================
  describe('updateSettings', () => {
    it('no lanza al recibir un objeto de configuración', () => {
      expect(() => RM.updateSettings({ interfaceCompactView: true })).not.toThrow();
    });

    it('acepta null sin lanzar', () => {
      expect(() => RM.updateSettings(null)).not.toThrow();
    });
  });
});
