/**
 * Tests para StateManager
 *
 * StateManager es el único punto de verdad del estado de la aplicación.
 * Bugs aquí afectan silenciosamente a toda la UI (filtros, tabs, rutas).
 *
 * Patrón de exportación: module.exports = StateManager (IIFE con CommonJS)
 */

const StateManager = require('../src/utils/stateManager.js');

describe('StateManager', () => {

  beforeEach(() => {
    // Resetear estado antes de cada test para aislamiento total
    StateManager.reset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // get — lectura de estado
  // ============================================================
  describe('get', () => {
    it('retorna todo el estado cuando se llama sin argumentos', () => {
      const state = StateManager.get();
      expect(state).toBeInstanceOf(Object);
      expect(state).toHaveProperty('currentFilter');
      expect(state).toHaveProperty('routes');
      expect(state).toHaveProperty('ui');
    });

    it('retorna la propiedad correcta con clave simple', () => {
      expect(StateManager.get('currentFilter')).toBe('no-p2p');
    });

    it('retorna estado de UI correctamente', () => {
      expect(StateManager.get('ui.isLoading')).toBe(false);
      expect(StateManager.get('ui.activeTab')).toBe('routes');
      expect(StateManager.get('ui.error')).toBeNull();
    });

    it('retorna propiedad anidada con notación de punto', () => {
      expect(StateManager.get('advancedFilters.exchange')).toBe('all');
      expect(StateManager.get('advancedFilters.profitMin')).toBe(0);
    });

    it('retorna undefined para clave inexistente', () => {
      expect(StateManager.get('noExiste')).toBeUndefined();
    });

    it('retorna una copia del estado, no la referencia', () => {
      const state1 = StateManager.get();
      const state2 = StateManager.get();
      expect(state1).not.toBe(state2); // objetos diferentes
      expect(state1).toEqual(state2);  // igual contenido
    });
  });

  // ============================================================
  // set — escritura de propiedades
  // ============================================================
  describe('set', () => {
    it('actualiza una propiedad simple', () => {
      StateManager.set('currentFilter', 'p2p');
      expect(StateManager.get('currentFilter')).toBe('p2p');
    });

    it('actualiza propiedad anidada con notación de punto', () => {
      StateManager.set('ui.isLoading', true);
      expect(StateManager.get('ui.isLoading')).toBe(true);
    });

    it('crea propiedad anidada si no existe', () => {
      StateManager.set('nueva.propiedad', 42);
      expect(StateManager.get('nueva.propiedad')).toBe(42);
    });

    it('actualiza selectedArbitrage', () => {
      const ruta = { broker: 'Binance', profitPercentage: 5.5 };
      StateManager.set('selectedArbitrage', ruta);
      expect(StateManager.get('selectedArbitrage')).toEqual(ruta);
    });

    it('permite establecer null explícitamente', () => {
      StateManager.set('currentData', null);
      expect(StateManager.get('currentData')).toBeNull();
    });
  });

  // ============================================================
  // update — actualización múltiple
  // ============================================================
  describe('update', () => {
    it('actualiza múltiples propiedades a la vez', () => {
      StateManager.update({
        currentFilter: 'all',
        lastUpdate: 12345
      });
      expect(StateManager.get('currentFilter')).toBe('all');
      expect(StateManager.get('lastUpdate')).toBe(12345);
    });

    it('no modifica propiedades no incluidas en el objeto parcial', () => {
      StateManager.update({ currentFilter: 'p2p' });
      // ui.isLoading no debe cambiar
      expect(StateManager.get('ui.isLoading')).toBe(false);
    });
  });

  // ============================================================
  // reset — restaurar estado inicial
  // ============================================================
  describe('reset', () => {
    it('restaura todos los valores a su estado inicial', () => {
      StateManager.set('currentFilter', 'p2p');
      StateManager.set('ui.isLoading', true);
      StateManager.set('selectedArbitrage', { broker: 'Test' });

      StateManager.reset();

      expect(StateManager.get('currentFilter')).toBe('no-p2p');
      expect(StateManager.get('ui.isLoading')).toBe(false);
      expect(StateManager.get('selectedArbitrage')).toBeNull();
    });

    it('restaura rutas al array vacío', () => {
      StateManager.setRoutes([{ broker: 'A' }], []);
      StateManager.reset();
      expect(StateManager.get('routes.all')).toEqual([]);
      expect(StateManager.get('routes.filtered')).toEqual([]);
    });
  });

  // ============================================================
  // subscribe — observadores de cambio
  // ============================================================
  describe('subscribe', () => {
    it('el callback se llama cuando cambia la clave suscrita', () => {
      const callback = jest.fn();
      StateManager.subscribe('currentFilter', callback);

      StateManager.set('currentFilter', 'all');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('all', 'no-p2p', 'currentFilter');
    });

    it('retorna función de desuscripción', () => {
      const callback = jest.fn();
      const unsubscribe = StateManager.subscribe('currentFilter', callback);

      unsubscribe();
      StateManager.set('currentFilter', 'p2p');

      expect(callback).not.toHaveBeenCalled();
    });

    it('el callback global "*" se llama ante cualquier cambio', () => {
      const globalCallback = jest.fn();
      StateManager.subscribe('*', globalCallback);

      StateManager.set('ui.error', 'algo');
      StateManager.set('lastUpdate', Date.now());

      expect(globalCallback).toHaveBeenCalledTimes(2);
    });

    it('no propaga excepciones del callback al llamador', () => {
      StateManager.subscribe('currentFilter', () => {
        throw new Error('Error en listener');
      });
      // No debe lanzar
      expect(() => StateManager.set('currentFilter', 'all')).not.toThrow();
    });

    it('múltiples callbacks para la misma clave se llaman todos', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      StateManager.subscribe('currentFilter', cb1);
      StateManager.subscribe('currentFilter', cb2);

      StateManager.set('currentFilter', 'p2p');

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // helpers de conveniencia
  // ============================================================
  describe('helpers', () => {
    it('setLoading actualiza ui.isLoading', () => {
      StateManager.setLoading(true);
      expect(StateManager.get('ui.isLoading')).toBe(true);
      StateManager.setLoading(false);
      expect(StateManager.get('ui.isLoading')).toBe(false);
    });

    it('setError actualiza ui.error', () => {
      StateManager.setError('Error de red');
      expect(StateManager.get('ui.error')).toBe('Error de red');
      StateManager.setError(null);
      expect(StateManager.get('ui.error')).toBeNull();
    });

    it('setActiveTab actualiza ui.activeTab', () => {
      StateManager.setActiveTab('simulator');
      expect(StateManager.get('ui.activeTab')).toBe('simulator');
    });

    it('setFilter actualiza currentFilter', () => {
      StateManager.setFilter('p2p');
      expect(StateManager.get('currentFilter')).toBe('p2p');
    });

    it('setRoutes actualiza both routes.all y routes.filtered', () => {
      const rutas = [
        { broker: 'Binance', profitPercentage: 5 },
        { broker: 'Buenbit', profitPercentage: 3 }
      ];
      const filtradas = [rutas[0]];
      StateManager.setRoutes(rutas, filtradas);

      expect(StateManager.get('routes.all')).toHaveLength(2);
      expect(StateManager.get('routes.filtered')).toHaveLength(1);
    });

    it('setRoutes usa all como filtered cuando filtered no se provee', () => {
      const rutas = [{ broker: 'Test' }];
      StateManager.setRoutes(rutas);
      expect(StateManager.get('routes.filtered')).toEqual(rutas);
    });
  });

  // ============================================================
  // estado inicial — valores por defecto
  // ============================================================
  describe('estado inicial', () => {
    it('currentFilter empieza en "no-p2p"', () => {
      expect(StateManager.get('currentFilter')).toBe('no-p2p');
    });

    it('advancedFilters tiene valores por defecto correctos', () => {
      const filters = StateManager.get('advancedFilters');
      expect(filters.exchange).toBe('all');
      expect(filters.profitMin).toBe(0);
      expect(filters.hideNegative).toBe(false);
      expect(filters.sortBy).toBe('profit-desc');
    });

    it('ui empieza sin carga ni error', () => {
      expect(StateManager.get('ui.isLoading')).toBe(false);
      expect(StateManager.get('ui.error')).toBeNull();
      expect(StateManager.get('ui.activeTab')).toBe('routes');
    });
  });
});
