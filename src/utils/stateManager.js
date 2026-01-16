/**
 * State Manager Module - ArbitrageAR v5.0
 * Gestión centralizada del estado de la aplicación
 */

const StateManager = (() => {
  // Estado inicial
  let state = {
    // Datos de mercado
    currentData: null,
    lastUpdate: null,

    // Selección actual
    selectedArbitrage: null,

    // Configuración del usuario
    userSettings: null,

    // Filtros
    currentFilter: 'no-p2p',
    advancedFilters: {
      exchange: 'all',
      profitMin: 0,
      hideNegative: false,
      sortBy: 'profit-desc'
    },

    // Cache de rutas
    routes: {
      all: [],
      filtered: []
    },

    // Estado UI
    ui: {
      isLoading: false,
      activeTab: 'routes',
      error: null
    }
  };

  // Listeners para cambios de estado
  const listeners = new Map();

  /**
   * Obtener estado actual o una propiedad específica
   */
  const get = key => {
    if (!key) return { ...state };

    // Soportar notación de punto para propiedades anidadas
    const keys = key.split('.');
    let value = state;

    for (const k of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[k];
    }

    return value;
  };

  /**
   * Establecer valor de una propiedad
   */
  const set = (key, value) => {
    const keys = key.split('.');
    let target = state;

    // Navegar hasta el penúltimo nivel
    for (let i = 0; i < keys.length - 1; i++) {
      if (target[keys[i]] === undefined) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }

    // Establecer valor
    const lastKey = keys[keys.length - 1];
    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Notificar listeners
    notifyListeners(key, value, oldValue);
  };

  /**
   * Actualizar múltiples propiedades
   */
  const update = partial => {
    Object.entries(partial).forEach(([key, value]) => {
      set(key, value);
    });
  };

  /**
   * Resetear estado a valores iniciales
   */
  const reset = () => {
    state = {
      currentData: null,
      lastUpdate: null,
      selectedArbitrage: null,
      userSettings: null,
      currentFilter: 'no-p2p',
      advancedFilters: {
        exchange: 'all',
        profitMin: 0,
        hideNegative: false,
        sortBy: 'profit-desc'
      },
      routes: {
        all: [],
        filtered: []
      },
      ui: {
        isLoading: false,
        activeTab: 'routes',
        error: null
      }
    };
    notifyListeners('*', state, null);
  };

  /**
   * Suscribirse a cambios de estado
   */
  const subscribe = (key, callback) => {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);

    // Retornar función para desuscribirse
    return () => {
      listeners.get(key).delete(callback);
    };
  };

  /**
   * Notificar a listeners
   */
  const notifyListeners = (key, newValue, oldValue) => {
    // Notificar listeners específicos
    if (listeners.has(key)) {
      listeners.get(key).forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (e) {
          console.error('Error en listener de estado:', e);
        }
      });
    }

    // Notificar listeners globales
    if (listeners.has('*')) {
      listeners.get('*').forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (e) {
          console.error('Error en listener global:', e);
        }
      });
    }
  };

  // API pública
  return {
    get,
    set,
    update,
    reset,
    subscribe,

    // Helpers específicos
    setLoading: isLoading => set('ui.isLoading', isLoading),
    setError: error => set('ui.error', error),
    setActiveTab: tab => set('ui.activeTab', tab),
    setFilter: filter => set('currentFilter', filter),
    setRoutes: (all, filtered) => {
      set('routes.all', all);
      set('routes.filtered', filtered || all);
    }
  };
})();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateManager;
}

// Exponer globalmente para navegador
if (typeof window !== 'undefined') {
  window.StateManager = StateManager;
}
