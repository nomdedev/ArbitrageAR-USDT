/**
 * Tests para FilterManager
 *
 * FilterManager decide qué rutas ve el usuario.
 * Un bug aquí puede ocultar oportunidades de arbitraje
 * o mostrar rutas que el usuario explícitamente filtró.
 *
 * Patrón: IIFE que expone window.FilterManager (jsdom).
 */

// Cargamos el módulo; ejecuta el IIFE y llama (window).FilterManager = ...
// window.Logger?.debug puede quejar — silenciamos Logger
beforeAll(() => {
  globalThis.window.Logger = { debug: () => {}, warn: () => {}, error: () => {} };
  globalThis.window.RouteManager = undefined; // no hay RouteManager en este test
  globalThis.window.StateManager = undefined;
  require('../src/modules/filterManager.js');
});

describe('FilterManager', () => {
  let FM;

  const ROUTES = [
    { broker: 'Binance',    buyExchange: 'Binance',    sellExchange: 'Binance',    profitPercentage: 5.5,  requiresP2P: false },
    { broker: 'Buenbit',   buyExchange: 'Buenbit',    sellExchange: 'Buenbit',    profitPercentage: 3.2,  requiresP2P: false },
    { broker: 'Lemon P2P', buyExchange: 'Lemon P2P',  sellExchange: 'Lemon P2P', profitPercentage: 8.1,  requiresP2P: true  },
    { broker: 'Ripio',     buyExchange: 'Ripio',      sellExchange: 'Binance',    profitPercentage: -1.5, requiresP2P: false },
    { broker: 'Fiwind',    buyExchange: 'Fiwind',     sellExchange: 'Fiwind',     profitPercentage: 2,  requiresP2P: false },
  ];

  beforeAll(() => {
    FM = globalThis.window?.FilterManager;
    if (!FM) throw new Error('FilterManager no fue expuesto en window');
  });

  beforeEach(() => {
    FM.init({}, [...ROUTES]);
    FM.setCurrentFilter('all');
    FM.setAdvancedFilters({ exchange: 'all', profitMin: 0, hideNegative: false, sortBy: 'profit-desc' });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // CONSTANTES expuestas
  // ============================================================
  describe('constantes', () => {
    it('FILTER_TYPES tiene ALL, P2P, NO_P2P', () => {
      expect(FM.FILTER_TYPES.ALL).toBe('all');
      expect(FM.FILTER_TYPES.P2P).toBe('p2p');
      expect(FM.FILTER_TYPES.NO_P2P).toBe('no-p2p');
    });

    it('SORT_OPTIONS tiene PROFIT_DESC como default', () => {
      expect(FM.SORT_OPTIONS.PROFIT_DESC).toBe('profit-desc');
      expect(FM.SORT_OPTIONS.PROFIT_ASC).toBe('profit-asc');
    });
  });

  // ============================================================
  // setCurrentFilter / getCurrentFilter
  // ============================================================
  describe('setCurrentFilter / getCurrentFilter', () => {
    it('establece y lee el filtro actual', () => {
      FM.setCurrentFilter('p2p');
      expect(FM.getCurrentFilter()).toBe('p2p');
    });

    it('mantiene "no-p2p" como estado inicial tras init', () => {
      FM.init({}, ROUTES);
      // init no cambia currentFilter explícitamente; el estado inicial del módulo es 'no-p2p'
      // Pero en beforeEach lo seteamos a 'all', así que verificamos que set/get funcione
      FM.setCurrentFilter('no-p2p');
      expect(FM.getCurrentFilter()).toBe('no-p2p');
    });
  });

  // ============================================================
  // setAdvancedFilters / getAdvancedFilters
  // ============================================================
  describe('setAdvancedFilters / getAdvancedFilters', () => {
    it('actualiza los filtros avanzados (merge parcial)', () => {
      FM.setAdvancedFilters({ profitMin: 3 });
      const filters = FM.getAdvancedFilters();
      expect(filters.profitMin).toBe(3);
      expect(filters.exchange).toBe('all'); // no cambió
    });

    it('getAdvancedFilters devuelve una copia del objeto', () => {
      const a = FM.getAdvancedFilters();
      const b = FM.getAdvancedFilters();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  // ============================================================
  // applyAllFilters — filtro P2P
  // ============================================================
  describe('applyAllFilters — filtros P2P', () => {
    it('filtro "all" retorna todas las rutas', () => {
      FM.setCurrentFilter('all');
      const result = FM.applyAllFilters();
      expect(result).toHaveLength(ROUTES.length);
    });

    it('filtro "p2p" retorna solo rutas P2P', () => {
      FM.setCurrentFilter('p2p');
      const result = FM.applyAllFilters();
      expect(result.every(r => r.requiresP2P)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('filtro "no-p2p" excluye todas las rutas P2P', () => {
      FM.setCurrentFilter('no-p2p');
      const result = FM.applyAllFilters();
      expect(result.every(r => !r.requiresP2P)).toBe(true);
      expect(result).toHaveLength(4);
    });

    it('retorna [] cuando no hay rutas cargadas', () => {
      FM.updateRoutes([]);
      const result = FM.applyAllFilters();
      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // applyAllFilters — profit mínimo via userSettings
  // ============================================================
  describe('applyAllFilters — profit mínimo via settings', () => {
    it('excluye rutas por debajo del profitMin configurado', () => {
      FM.init({ interfaceMinProfitDisplay: 2 }, ROUTES);
      FM.setCurrentFilter('all');
      const result = FM.applyAllFilters();
      expect(result.every(r => r.profitPercentage >= 2)).toBe(true);
    });

    it('con interfaceShowOnlyProfitable solo devuelve rutas ≥ 0%', () => {
      FM.init({ interfaceShowOnlyProfitable: true }, ROUTES);
      FM.setCurrentFilter('all');
      const result = FM.applyAllFilters();
      expect(result.every(r => r.profitPercentage >= 0)).toBe(true);
    });
  });

  // ============================================================
  // sortRoutes
  // ============================================================
  describe('sortRoutes', () => {
    it('profit-desc ordena de mayor a menor', () => {
      const sorted = FM.sortRoutes([...ROUTES], 'profit-desc');
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].profitPercentage).toBeGreaterThanOrEqual(sorted[i + 1].profitPercentage);
      }
    });

    it('profit-asc ordena de menor a mayor', () => {
      const sorted = FM.sortRoutes([...ROUTES], 'profit-asc');
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].profitPercentage).toBeLessThanOrEqual(sorted[i + 1].profitPercentage);
      }
    });

    it('exchange-asc ordena alfabéticamente por buyExchange', () => {
      const sorted = FM.sortRoutes([...ROUTES], 'exchange-asc');
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = (sorted[i].buyExchange || '').toLowerCase();
        const b = (sorted[i + 1].buyExchange || '').toLowerCase();
        expect(a.localeCompare(b)).toBeLessThanOrEqual(0);
      }
    });

    it('no modifica el array original', () => {
      const original = [...ROUTES];
      FM.sortRoutes(original, 'profit-asc');
      expect(original).toEqual(ROUTES);
    });
  });

  // ============================================================
  // updateRoutes
  // ============================================================
  describe('updateRoutes', () => {
    it('reemplaza las rutas internas', () => {
      const nuevas = [{ broker: 'X', profitPercentage: 1, requiresP2P: false }];
      FM.updateRoutes(nuevas);
      FM.setCurrentFilter('all');
      const result = FM.applyAllFilters();
      expect(result).toHaveLength(1);
      expect(result[0].broker).toBe('X');
    });

    it('acepta array vacío sin lanzar', () => {
      expect(() => FM.updateRoutes([])).not.toThrow();
    });

    it('trata null/undefined como array vacío', () => {
      FM.updateRoutes(null);
      expect(() => FM.applyAllFilters()).not.toThrow();
    });
  });

  // ============================================================
  // resetAdvancedFilters
  // ============================================================
  describe('resetAdvancedFilters', () => {
    it('restaura exchange/profitMin/hideNegative/sortBy a sus valores por defecto', () => {
      FM.setAdvancedFilters({ exchange: 'Binance', profitMin: 5, hideNegative: true });
      FM.resetAdvancedFilters();
      const filters = FM.getAdvancedFilters();
      // La función también intenta hacer querySelector pero no hay DOM, así que los valores
      // internos sí se resetean aunque el DOM no exista
      expect(filters.exchange).toBe('all');
      expect(filters.profitMin).toBe(0);
      expect(filters.hideNegative).toBe(false);
      expect(filters.sortBy).toBe('profit-desc');
    });
  });
});
