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
  // ESTADO INICIAL
  // ============================================================
  describe('Estado inicial', () => {
    it('expone constantes FILTER_TYPES y SORT_OPTIONS con valores correctos', () => {
      expect(FM.FILTER_TYPES.ALL).toBe('all');
      expect(FM.FILTER_TYPES.P2P).toBe('p2p');
      expect(FM.FILTER_TYPES.NO_P2P).toBe('no-p2p');
      expect(FM.SORT_OPTIONS.PROFIT_DESC).toBe('profit-desc');
      expect(FM.SORT_OPTIONS.PROFIT_ASC).toBe('profit-asc');
    });
  });

  // ============================================================
  // FILTROS P2P
  // ============================================================
  describe('Filtros P2P', () => {
    it('activa filtro P2P y retorna solo rutas que requieren P2P', () => {
      FM.setCurrentFilter('p2p');
      const result = FM.applyAllFilters();
      expect(result.every(r => r.requiresP2P)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].broker).toBe('Lemon P2P');
    });

    it('desactiva filtro P2P (no-p2p o all) y excluye o incluye rutas P2P segun corresponda', () => {
      // Filtro "no-p2p" excluye rutas P2P
      FM.setCurrentFilter('no-p2p');
      const resultNoP2P = FM.applyAllFilters();
      expect(resultNoP2P.every(r => !r.requiresP2P)).toBe(true);
      expect(resultNoP2P).toHaveLength(4);

      // Filtro "all" incluye todas las rutas
      FM.setCurrentFilter('all');
      const resultAll = FM.applyAllFilters();
      expect(resultAll).toHaveLength(ROUTES.length);
    });
  });

  // ============================================================
  // FILTROS EXCHANGE
  // ============================================================
  describe('Filtros Exchange', () => {
    it('setAdvancedFilters guarda filtros avanzados correctamente', () => {
      FM.setAdvancedFilters({ exchange: 'Binance', profitMin: 3 });
      const filters = FM.getAdvancedFilters();
      expect(filters.exchange).toBe('Binance');
      expect(filters.profitMin).toBe(3);
    });

    it('applyUserPreferences filtra por preferredExchanges desde userSettings', () => {
      // Configurar userSettings con preferredExchanges
      FM.updateSettings({ preferredExchanges: ['Binance'] });
      const result = FM.applyUserPreferences([...ROUTES]);
      // Verificar que solo quedan rutas con Binance
      expect(result.every(r =>
        r.buyExchange === 'Binance' || r.sellExchange === 'Binance'
      )).toBe(true);
    });
  });

  // ============================================================
  // APPLY ALL FILTERS
  // ============================================================
  describe('applyAllFilters', () => {
    it('aplica filtro P2P correctamente', () => {
      FM.setCurrentFilter('p2p');
      const result = FM.applyAllFilters();
      expect(result.every(r => r.requiresP2P)).toBe(true);
    });

    it('maneja casos edge: array vacío, null, y profitMin desde userSettings', () => {
      // Array vacío
      FM.updateRoutes([]);
      expect(FM.applyAllFilters()).toEqual([]);

      // Null/undefined tratado como array vacío
      FM.updateRoutes(null);
      expect(() => FM.applyAllFilters()).not.toThrow();

      // profitMin desde userSettings
      FM.init({ interfaceMinProfitDisplay: 2 }, ROUTES);
      FM.setCurrentFilter('all');
      const result = FM.applyAllFilters();
      expect(result.every(r => r.profitPercentage >= 2)).toBe(true);
    });
  });

  // ============================================================
  // GET ACTIVE FILTERS
  // ============================================================
  describe('getActiveFilters', () => {
    it('getAdvancedFilters devuelve copia independiente y resetAdvancedFilters restaura valores por defecto', () => {
      // Verificar que getAdvancedFilters devuelve copia independiente
      const a = FM.getAdvancedFilters();
      const b = FM.getAdvancedFilters();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);

      // Modificar filtros avanzados
      FM.setAdvancedFilters({ exchange: 'Binance', profitMin: 5, hideNegative: true });
      const modified = FM.getAdvancedFilters();
      expect(modified.exchange).toBe('Binance');
      expect(modified.profitMin).toBe(5);
      expect(modified.hideNegative).toBe(true);

      // Resetear filtros
      FM.resetAdvancedFilters();
      const reset = FM.getAdvancedFilters();
      expect(reset.exchange).toBe('all');
      expect(reset.profitMin).toBe(0);
      expect(reset.hideNegative).toBe(false);
      expect(reset.sortBy).toBe('profit-desc');
    });
  });
});