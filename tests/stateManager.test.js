/**
 * Tests para StateManager
 *
 * StateManager es el unico punto de verdad del estado de la aplicacion.
 * Bugs aqui afectan silenciosamente a toda la UI (filtros, tabs, rutas).
 *
 * Patron de exportacion: module.exports = StateManager (IIFE con CommonJS)
 *
 * Tests consolidados: 10 tests que cubren toda la funcionalidad
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
  // getState/setState - Lectura y escritura de estado
  // ============================================================
  describe('getState/setState', () => {
    it('get retorna estado completo o propiedades especificas con notacion de punto', () => {
      // Estado completo
      const state = StateManager.get();
      expect(state).toBeInstanceOf(Object);
      expect(state).toHaveProperty('currentFilter');
      expect(state).toHaveProperty('routes');
      expect(state).toHaveProperty('ui');

      // Propiedades simples
      expect(StateManager.get('currentFilter')).toBe('no-p2p');

      // Propiedades anidadas con notacion de punto
      expect(StateManager.get('ui.isLoading')).toBe(false);
      expect(StateManager.get('ui.activeTab')).toBe('routes');
      expect(StateManager.get('advancedFilters.exchange')).toBe('all');
      expect(StateManager.get('advancedFilters.profitMin')).toBe(0);

      // Propiedad inexistente retorna undefined
      expect(StateManager.get('noExiste')).toBeUndefined();

      // get retorna copia, no referencia
      const state1 = StateManager.get();
      const state2 = StateManager.get();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('set actualiza propiedades simples y anidadas, incluyendo valores null', () => {
      // Propiedad simple
      StateManager.set('currentFilter', 'p2p');
      expect(StateManager.get('currentFilter')).toBe('p2p');

      // Propiedad anidada existente
      StateManager.set('ui.isLoading', true);
      expect(StateManager.get('ui.isLoading')).toBe(true);

      // Crear propiedad anidada nueva
      StateManager.set('nueva.propiedad', 42);
      expect(StateManager.get('nueva.propiedad')).toBe(42);

      // Actualizar selectedArbitrage con objeto
      const ruta = { broker: 'Binance', profitPercentage: 5.5 };
      StateManager.set('selectedArbitrage', ruta);
      expect(StateManager.get('selectedArbitrage')).toEqual(ruta);

      // Permitir null explicito
      StateManager.set('currentData', null);
      expect(StateManager.get('currentData')).toBeNull();

      // update para multiples propiedades
      StateManager.update({ currentFilter: 'all', lastUpdate: 12345 });
      expect(StateManager.get('currentFilter')).toBe('all');
      expect(StateManager.get('lastUpdate')).toBe(12345);
      expect(StateManager.get('ui.isLoading')).toBe(true); // No modificado por update
    });
  });

  // ============================================================
  // Subscribe/Notify - Sistema de observadores
  // ============================================================
  describe('Subscribe/Notify', () => {
    it('subscribe registra callbacks que se ejecutan al cambiar la clave', () => {
      const callback = jest.fn();
      const unsubscribe = StateManager.subscribe('currentFilter', callback);

      // Cambio dispara callback
      StateManager.set('currentFilter', 'all');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('all', 'no-p2p', 'currentFilter');

      // Unsubscribe funciona
      unsubscribe();
      StateManager.set('currentFilter', 'p2p');
      expect(callback).toHaveBeenCalledTimes(1); // No aumenta
    });

    it('callbacks globales y multiples subscriptores funcionan correctamente', () => {
      // Callback global "*" para cualquier cambio
      const globalCallback = jest.fn();
      StateManager.subscribe('*', globalCallback);

      // Multiples callbacks para misma clave
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      StateManager.subscribe('ui.error', cb1);
      StateManager.subscribe('ui.error', cb2);

      // Cambios disparan todos los callbacks
      StateManager.set('ui.error', 'algo');
      StateManager.set('lastUpdate', Date.now());

      expect(globalCallback).toHaveBeenCalledTimes(2);
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);

      // Callback con excepcion no propaga error
      StateManager.subscribe('currentFilter', () => {
        throw new Error('Error en listener');
      });
      expect(() => StateManager.set('currentFilter', 'all')).not.toThrow();
    });
  });

  // ============================================================
  // resetState/clearState - Restauracion y limpieza
  // ============================================================
  describe('resetState/clearState', () => {
    it('reset restaura todos los valores a su estado inicial', () => {
      // Modificar estado
      StateManager.set('currentFilter', 'p2p');
      StateManager.set('ui.isLoading', true);
      StateManager.set('selectedArbitrage', { broker: 'Test' });
      StateManager.setRoutes([{ broker: 'A' }], []);

      // Reset
      StateManager.reset();

      // Valores restaurados
      expect(StateManager.get('currentFilter')).toBe('no-p2p');
      expect(StateManager.get('ui.isLoading')).toBe(false);
      expect(StateManager.get('selectedArbitrage')).toBeNull();
      expect(StateManager.get('routes.all')).toEqual([]);
      expect(StateManager.get('routes.filtered')).toEqual([]);
    });

    it('helpers de conveniencia actualizan estado correctamente', () => {
      // setLoading
      StateManager.setLoading(true);
      expect(StateManager.get('ui.isLoading')).toBe(true);
      StateManager.setLoading(false);
      expect(StateManager.get('ui.isLoading')).toBe(false);

      // setError
      StateManager.setError('Error de red');
      expect(StateManager.get('ui.error')).toBe('Error de red');
      StateManager.setError(null);
      expect(StateManager.get('ui.error')).toBeNull();

      // setActiveTab
      StateManager.setActiveTab('simulator');
      expect(StateManager.get('ui.activeTab')).toBe('simulator');

      // setFilter
      StateManager.setFilter('p2p');
      expect(StateManager.get('currentFilter')).toBe('p2p');

      // setRoutes con y sin filtradas
      const rutas = [
        { broker: 'Binance', profitPercentage: 5 },
        { broker: 'Buenbit', profitPercentage: 3 }
      ];
      StateManager.setRoutes(rutas, [rutas[0]]);
      expect(StateManager.get('routes.all')).toHaveLength(2);
      expect(StateManager.get('routes.filtered')).toHaveLength(1);

      StateManager.setRoutes([{ broker: 'Test' }]);
      expect(StateManager.get('routes.filtered')).toEqual([{ broker: 'Test' }]);
    });
  });

  // ============================================================
  // Persistencia - Estado inicial y valores por defecto
  // ============================================================
  describe('Persistencia', () => {
    it('estado inicial tiene todos los valores por defecto correctos', () => {
      // Filtro principal
      expect(StateManager.get('currentFilter')).toBe('no-p2p');

      // Filtros avanzados
      const filters = StateManager.get('advancedFilters');
      expect(filters.exchange).toBe('all');
      expect(filters.profitMin).toBe(0);
      expect(filters.hideNegative).toBe(false);
      expect(filters.sortBy).toBe('profit-desc');

      // UI state
      expect(StateManager.get('ui.isLoading')).toBe(false);
      expect(StateManager.get('ui.error')).toBeNull();
      expect(StateManager.get('ui.activeTab')).toBe('routes');

      // Rutas vacias
      expect(StateManager.get('routes.all')).toEqual([]);
      expect(StateManager.get('routes.filtered')).toEqual([]);

      // Datos nulos
      expect(StateManager.get('selectedArbitrage')).toBeNull();
    });

    it('el estado se mantiene entre operaciones pero se aísla entre tests', () => {
      // Modificar estado
      StateManager.set('currentFilter', 'all');
      StateManager.set('ui.isLoading', true);
      StateManager.set('advancedFilters.profitMin', 5);

      // Verificar persistencia
      expect(StateManager.get('currentFilter')).toBe('all');
      expect(StateManager.get('ui.isLoading')).toBe(true);
      expect(StateManager.get('advancedFilters.profitMin')).toBe(5);

      // El reset del beforeEach del siguiente test limpiara el estado
    });
  });

  // ============================================================
  // Edge cases - Casos límite y comportamiento defensivo
  // ============================================================
  describe('Edge cases', () => {
    it('maneja claves inexistentes y estructuras anidadas complejas', () => {
      // Clave inexistente retorna undefined
      expect(StateManager.get('claveInexistente')).toBeUndefined();
      expect(StateManager.get('objeto.inexistente.anidado')).toBeUndefined();

      // Crear estructura anidada profunda
      StateManager.set('a.b.c.d', 'valor profundo');
      expect(StateManager.get('a.b.c.d')).toBe('valor profundo');

      // Sobrescribir objeto con primitivo
      StateManager.set('test', { nested: true });
      expect(StateManager.get('test.nested')).toBe(true);
      StateManager.set('test', 'primitivo');
      expect(StateManager.get('test')).toBe('primitivo');
      expect(StateManager.get('test.nested')).toBeUndefined();
    });

    it('maneja tipos de datos variados y objetos complejos', () => {
      // Arrays
      StateManager.set('miArray', [1, 2, 3]);
      expect(StateManager.get('miArray')).toEqual([1, 2, 3]);

      // Objetos anidados
      const complejo = {
        nivel1: {
          nivel2: {
            nivel3: 'profundo'
          }
        }
      };
      StateManager.set('objComplejo', complejo);
      expect(StateManager.get('objComplejo.nivel1.nivel2.nivel3')).toBe('profundo');

      // Numeros y strings
      StateManager.set('numero', 42);
      StateManager.set('string', 'texto');
      StateManager.set('booleano', true);
      expect(StateManager.get('numero')).toBe(42);
      expect(StateManager.get('string')).toBe('texto');
      expect(StateManager.get('booleano')).toBe(true);

      // Actualizacion parcial con update
      StateManager.set('parcial', { a: 1, b: 2, c: 3 });
      StateManager.update({ 'parcial.b': 99 });
      expect(StateManager.get('parcial.a')).toBe(1);
      expect(StateManager.get('parcial.b')).toBe(99);
      expect(StateManager.get('parcial.c')).toBe(3);
    });
  });
});