/**
 * Filter Controller Module - ArbitrageAR v5.0
 * Gestiona la lógica de filtros de rutas
 */

const FilterController = (() => {
  // Estado del filtro
  let currentFilter = 'no-p2p';
  let advancedFilters = {
    exchange: 'all',
    profitMin: 0,
    hideNegative: false,
    sortBy: 'profit-desc'
  };

  // Cache de rutas
  let allRoutes = [];
  let filteredRoutes = [];

  // Callbacks para notificar cambios
  const onFilterChangeCallbacks = [];

  /**
   * Determinar si una ruta es P2P
   */
  const isP2PRoute = route => {
    if (!route) return false;

    // Usar campo del backend si existe
    if (typeof route.requiresP2P === 'boolean') {
      return route.requiresP2P;
    }

    if (typeof route.isP2P === 'boolean') {
      return route.isP2P;
    }

    // Fallback: verificar nombre
    const brokerName = (route.broker || '').toLowerCase();
    const buyName = (route.buyExchange || '').toLowerCase();
    const sellName = (route.sellExchange || '').toLowerCase();

    return brokerName.includes('p2p') || buyName.includes('p2p') || sellName.includes('p2p');
  };

  /**
   * Aplicar filtro P2P
   */
  const applyP2PFilter = (routes, filter) => {
    switch (filter) {
      case 'p2p':
        return routes.filter(r => isP2PRoute(r));
      case 'no-p2p':
        return routes.filter(r => !isP2PRoute(r));
      case 'all':
      default:
        return routes;
    }
  };

  /**
   * Aplicar filtros avanzados
   */
  const applyAdvancedFilters = (routes, filters) => {
    let result = [...routes];

    // Filtrar por exchange
    if (filters.exchange && filters.exchange !== 'all') {
      result = result.filter(r => {
        const broker = (r.broker || '').toLowerCase();
        return broker.includes(filters.exchange.toLowerCase());
      });
    }

    // Filtrar por profit mínimo
    if (filters.profitMin !== undefined && filters.profitMin !== null) {
      result = result.filter(r => {
        const profit = r.profitPercentage || r.profit || 0;
        return profit >= filters.profitMin;
      });
    }

    // Ocultar rutas negativas
    if (filters.hideNegative) {
      result = result.filter(r => {
        const profit = r.profitPercentage || r.profit || 0;
        return profit >= 0;
      });
    }

    // Ordenar
    result = sortRoutes(result, filters.sortBy);

    return result;
  };

  /**
   * Ordenar rutas
   */
  const sortRoutes = (routes, sortBy) => {
    const sorted = [...routes];

    switch (sortBy) {
      case 'profit-desc':
        sorted.sort((a, b) => (b.profitPercentage || 0) - (a.profitPercentage || 0));
        break;
      case 'profit-asc':
        sorted.sort((a, b) => (a.profitPercentage || 0) - (b.profitPercentage || 0));
        break;
      case 'exchange-asc':
        sorted.sort((a, b) => (a.broker || '').localeCompare(b.broker || ''));
        break;
      case 'risk-asc':
        sorted.sort((a, b) => {
          const riskA = isP2PRoute(a) ? 1 : 0;
          const riskB = isP2PRoute(b) ? 1 : 0;
          return riskA - riskB;
        });
        break;
      default:
        // Sin ordenamiento adicional
        break;
    }

    return sorted;
  };

  /**
   * Aplicar todos los filtros
   */
  const applyAllFilters = () => {
    let result = [...allRoutes];

    // Aplicar filtro P2P
    result = applyP2PFilter(result, currentFilter);

    // Aplicar filtros avanzados
    result = applyAdvancedFilters(result, advancedFilters);

    filteredRoutes = result;

    // Notificar cambios
    notifyFilterChange();

    return filteredRoutes;
  };

  /**
   * Notificar cambio de filtros
   */
  const notifyFilterChange = () => {
    onFilterChangeCallbacks.forEach(callback => {
      try {
        callback(filteredRoutes, allRoutes);
      } catch (e) {
        console.error('Error en callback de filtro:', e);
      }
    });
  };

  /**
   * Configurar botones de filtro P2P
   */
  const setupFilterButtons = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Actualizar estado activo
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Aplicar filtro
        currentFilter = filter;
        applyAllFilters();
      });
    });

    // Marcar filtro inicial como activo
    const defaultButton = document.querySelector(`[data-filter="${currentFilter}"]`);
    if (defaultButton) {
      defaultButton.classList.add('active');
    }
  };

  /**
   * Configurar filtros avanzados
   */
  const setupAdvancedFilters = () => {
    // Exchange selector
    const exchangeSelect = document.getElementById('filter-exchange');
    if (exchangeSelect) {
      exchangeSelect.addEventListener('change', e => {
        advancedFilters.exchange = e.target.value;
        applyAllFilters();
      });
    }

    // Profit mínimo
    const profitMinInput = document.getElementById('filter-profit-min');
    if (profitMinInput) {
      profitMinInput.addEventListener('input', e => {
        advancedFilters.profitMin = parseFloat(e.target.value) || 0;
        applyAllFilters();
      });
    }

    // Hide negative
    const hideNegativeCheckbox = document.getElementById('filter-hide-negative');
    if (hideNegativeCheckbox) {
      hideNegativeCheckbox.addEventListener('change', e => {
        advancedFilters.hideNegative = e.target.checked;
        applyAllFilters();
      });
    }

    // Sort by
    const sortSelect = document.getElementById('filter-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        advancedFilters.sortBy = e.target.value;
        applyAllFilters();
      });
    }
  };

  // API pública
  return {
    // Getters
    getCurrentFilter: () => currentFilter,
    getAdvancedFilters: () => ({ ...advancedFilters }),
    getAllRoutes: () => [...allRoutes],
    getFilteredRoutes: () => [...filteredRoutes],

    // Setters
    setRoutes: routes => {
      allRoutes = routes || [];
      applyAllFilters();
    },

    setFilter: filter => {
      currentFilter = filter;
      applyAllFilters();
    },

    setAdvancedFilters: filters => {
      advancedFilters = { ...advancedFilters, ...filters };
      applyAllFilters();
    },

    // Acciones
    applyAllFilters,
    isP2PRoute,
    sortRoutes,

    // Setup
    setup: () => {
      setupFilterButtons();
      setupAdvancedFilters();
    },

    // Eventos
    onFilterChange: callback => {
      onFilterChangeCallbacks.push(callback);
    }
  };
})();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterController;
}

// Exponer globalmente para navegador
if (typeof window !== 'undefined') {
  window.FilterController = FilterController;
}
