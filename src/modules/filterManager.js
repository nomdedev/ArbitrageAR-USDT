/**
 * Filter Manager Module
 * Módulo para la gestión de filtros de rutas de arbitraje
 * @module FilterManager
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  // ==========================================
  // ESTADO DEL MÓDULO
  // ==========================================

  let currentFilter = 'no-p2p';
  let allRoutes = [];
  let userSettings = null;
  let advancedFilters = {
    exchange: 'all',
    profitMin: 0,
    hideNegative: false,
    sortBy: 'profit-desc'
  };

  // ==========================================
  // CONSTANTES
  // ==========================================

  const FILTER_TYPES = {
    ALL: 'all',
    P2P: 'p2p',
    NO_P2P: 'no-p2p'
  };

  const SORT_OPTIONS = {
    PROFIT_DESC: 'profit-desc',
    PROFIT_ASC: 'profit-asc',
    EXCHANGE_ASC: 'exchange-asc',
    INVESTMENT_DESC: 'investment-desc'
  };

  // ==========================================
  // FUNCIONES PRIVADAS
  // ==========================================

  /**
   * Verificar si una ruta usa P2P
   * @private
   * @param {Object} route - Datos de la ruta
   * @returns {boolean} True si usa P2P
   */
  function isP2PRoute(route) {
    if (!route) return false;

    // Usar RouteManager si está disponible
    if (window.RouteManager?.isP2PRoute) {
      return window.RouteManager.isP2PRoute(route);
    }

    // Implementación fallback
    if (typeof route.requiresP2P === 'boolean') {
      return route.requiresP2P;
    }

    const brokerName = route.broker?.toLowerCase() || '';
    if (brokerName.includes('p2p')) {
      return true;
    }

    const buyName = route.buyExchange?.toLowerCase() || '';
    const sellName = route.sellExchange?.toLowerCase() || '';
    if (buyName.includes('p2p') || sellName.includes('p2p')) {
      return true;
    }

    return false;
  }

  /**
   * Aplicar filtro de ganancia mínima
   * @private
   * @param {Array} routes - Rutas a filtrar
   * @param {number} minProfit - Ganancia mínima
   * @returns {Array} Rutas filtradas
   */
  function applyMinProfitFilter(routes, minProfit) {
    const filterMinProfit = minProfit ?? -10.0;
    const beforeCount = routes.length;
    const filtered = routes.filter(r => r.profitPercentage >= filterMinProfit);
    
    if (window.Logger?.debug) {
      window.Logger.debug(
        `Filtradas por ganancia mínima ${filterMinProfit}%: ${beforeCount} → ${filtered.length} rutas`
      );
    }
    
    return filtered;
  }

  /**
   * Aplicar filtro de exchanges preferidos
   * @private
   * @param {Array} routes - Rutas a filtrar
   * @param {Array} preferredExchanges - Exchanges preferidos
   * @returns {Array} Rutas filtradas
   */
  function applyPreferredExchangesFilter(routes, preferredExchanges) {
    if (!preferredExchanges || !Array.isArray(preferredExchanges) || preferredExchanges.length === 0) {
      return routes;
    }

    const beforeCount = routes.length;
    const filtered = routes.filter(route => {
      return (
        preferredExchanges.includes(route.buyExchange) ||
        (route.sellExchange && preferredExchanges.includes(route.sellExchange))
      );
    });

    if (window.Logger?.debug) {
      window.Logger.debug(
        `Exchanges preferidos (${preferredExchanges.join(', ')}): ${beforeCount} → ${filtered.length} rutas`
      );
    }

    return filtered;
  }

  /**
   * Aplicar ordenamiento
   * @private
   * @param {Array} routes - Rutas a ordenar
   * @param {boolean} preferSingleExchange - Priorizar mismo exchange
   * @param {boolean} sortByProfit - Ordenar por profit
   * @returns {Array} Rutas ordenadas
   */
  function applySorting(routes, preferSingleExchange, sortByProfit) {
    if (preferSingleExchange === true) {
      routes.sort((a, b) => {
        if (a.isSingleExchange !== b.isSingleExchange) {
          return b.isSingleExchange - a.isSingleExchange;
        }
        return b.profitPercentage - a.profitPercentage;
      });
    } else if (sortByProfit === true) {
      routes.sort((a, b) => b.profitPercentage - a.profitPercentage);
    }
    return routes;
  }

  /**
   * Aplicar límite de cantidad
   * @private
   * @param {Array} routes - Rutas a limitar
   * @param {number} maxDisplay - Cantidad máxima
   * @returns {Array} Rutas limitadas
   */
  function applyLimit(routes, maxDisplay) {
    if (routes.length > maxDisplay) {
      const limited = routes.slice(0, maxDisplay);
      if (window.Logger?.debug) {
        window.Logger.debug(`Limitadas a ${maxDisplay} rutas`);
      }
      return limited;
    }
    return routes;
  }

  /**
   * Obtener exchanges únicos de las rutas
   * @private
   * @returns {Array} Lista de exchanges únicos
   */
  function getUniqueExchanges() {
    const exchangesSet = new Set();
    allRoutes.forEach(route => {
      if (route.buyExchange) exchangesSet.add(route.buyExchange);
      if (route.sellExchange) exchangesSet.add(route.sellExchange);
    });
    return Array.from(exchangesSet).sort();
  }

  // ==========================================
  // FUNCIONES PÚBLICAS
  // ==========================================

  /**
   * Inicializar el módulo de filtros
   * @public
   * @param {Object} settings - Configuración del usuario
   * @param {Array} routes - Rutas disponibles
   */
  function init(settings, routes) {
    userSettings = settings;
    allRoutes = routes || [];
    console.log('✅ [FilterManager] Módulo inicializado con', allRoutes.length, 'rutas');
  }

  /**
   * Actualizar las rutas disponibles
   * @public
   * @param {Array} routes - Nuevas rutas
   */
  function updateRoutes(routes) {
    allRoutes = routes || [];
    console.log('✅ [FilterManager] Rutas actualizadas:', allRoutes.length);
    
    // Auto-ajustar filtro por defecto si no hay rutas del tipo actual
    autoAdjustDefaultFilter();
  }

  /**
   * Ajustar automáticamente el filtro por defecto según las rutas disponibles
   * @private
   */
  function autoAdjustDefaultFilter() {
    if (!allRoutes || allRoutes.length === 0) return;

    const p2pCount = allRoutes.filter(route => isP2PRoute(route)).length;
    const noP2pCount = allRoutes.filter(route => !isP2PRoute(route)).length;

    console.log(`🔍 [FilterManager] Auto-ajuste: ${p2pCount} P2P, ${noP2pCount} No-P2P`);

    // Si el filtro actual no tiene rutas, cambiar a uno que sí tenga
    if (currentFilter === 'no-p2p' && noP2pCount === 0 && p2pCount > 0) {
      console.log('🔄 [FilterManager] Cambiando filtro de "no-p2p" a "all" (no hay rutas no-P2P)');
      currentFilter = 'all';
      
      // Actualizar botones visualmente
      document.querySelectorAll('.filter-btn, .filter-btn-footer').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('[data-filter="all"]').forEach(btn => {
        btn.classList.add('active');
      });
    } else if (currentFilter === 'p2p' && p2pCount === 0 && noP2pCount > 0) {
      console.log('🔄 [FilterManager] Cambiando filtro de "p2p" a "all" (no hay rutas P2P)');
      currentFilter = 'all';
      
      // Actualizar botones visualmente
      document.querySelectorAll('.filter-btn, .filter-btn-footer').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('[data-filter="all"]').forEach(btn => {
        btn.classList.add('active');
      });
    }
  }

  /**
   * Actualizar la configuración del usuario
   * @public
   * @param {Object} settings - Nueva configuración
   */
  function updateSettings(settings) {
    userSettings = settings;
  }

  /**
   * Obtener el filtro actual
   * @public
   * @returns {string} Filtro actual
   */
  function getCurrentFilter() {
    return currentFilter;
  }

  /**
   * Establecer el filtro actual
   * @public
   * @param {string} filter - Nuevo filtro
   */
  function setCurrentFilter(filter) {
    currentFilter = filter;
    
    // Sincronizar con StateManager si está disponible
    if (window.StateManager?.setFilter) {
      window.StateManager.setFilter(filter);
    }
  }

  /**
   * Obtener filtros avanzados
   * @public
   * @returns {Object} Filtros avanzados actuales
   */
  function getAdvancedFilters() {
    return { ...advancedFilters };
  }

  /**
   * Establecer filtros avanzados
   * @public
   * @param {Object} filters - Nuevos filtros avanzados
   */
  function setAdvancedFilters(filters) {
    advancedFilters = { ...advancedFilters, ...filters };
  }

  /**
   * Aplicar todos los filtros (P2P + Avanzados + Preferencias)
   * @public
   * @returns {Array} Rutas filtradas
   */
  function applyAllFilters() {
    if (!allRoutes || allRoutes.length === 0) {
      console.warn('⚠️ [FilterManager] No hay rutas para filtrar');
      return [];
    }

    const interfaceSettings = userSettings || {};

    // Paso 1: Filtro P2P
    let filteredRoutes;
    switch (currentFilter) {
      case FILTER_TYPES.P2P:
        filteredRoutes = allRoutes.filter(route => isP2PRoute(route));
        break;
      case FILTER_TYPES.NO_P2P:
        filteredRoutes = allRoutes.filter(route => !isP2PRoute(route));
        break;
      case FILTER_TYPES.ALL:
      default:
        filteredRoutes = [...allRoutes];
        break;
    }

    // Paso 2: Filtro por profit mínimo de interfaz
    const minProfit = interfaceSettings.interfaceMinProfitDisplay || -10;
    if (minProfit > -100) {
      filteredRoutes = applyMinProfitFilter(filteredRoutes, minProfit);
    }

    // Paso 3: Mostrar solo rentables
    if (interfaceSettings.interfaceShowOnlyProfitable) {
      const antesFiltro = filteredRoutes.length;
      filteredRoutes = filteredRoutes.filter(route => route.profitPercentage >= 0);
      console.log(`🔍 [FilterManager] Después de filtro solo rentables: ${antesFiltro} → ${filteredRoutes.length}`);
    }

    // Paso 4: Aplicar preferencias de usuario
    filteredRoutes = applyUserPreferences(filteredRoutes);

    // Paso 5: Ordenar según configuración
    const sortBy = interfaceSettings.interfaceSortByProfit ? SORT_OPTIONS.PROFIT_DESC : SORT_OPTIONS.PROFIT_ASC;
    filteredRoutes = sortRoutes(filteredRoutes, sortBy);

    // Paso 6: Limitar cantidad máxima
    const maxRoutes = interfaceSettings.interfaceMaxRoutesDisplay || 20;
    if (filteredRoutes.length > maxRoutes) {
      filteredRoutes = filteredRoutes.slice(0, maxRoutes);
    }

    console.log(`✅ [FilterManager] Filtros aplicados: ${filteredRoutes.length} rutas finales`);

    return filteredRoutes;
  }

  /**
   * Aplicar preferencias del usuario
   * @public
   * @param {Array} routes - Rutas a filtrar
   * @returns {Array} Rutas filtradas
   */
  function applyUserPreferences(routes) {
    if (!Array.isArray(routes) || routes.length === 0) {
      return routes;
    }

    let filtered = [...routes];

    // Filtro unificado por ganancia mínima
    filtered = applyMinProfitFilter(filtered, userSettings?.filterMinProfit);

    // Filtrar por exchanges preferidos
    filtered = applyPreferredExchangesFilter(filtered, userSettings?.preferredExchanges);

    // Ordenar rutas
    filtered = applySorting(filtered, userSettings?.preferSingleExchange, userSettings?.sortByProfit);

    // Limitar cantidad
    const maxDisplay = userSettings?.maxRoutesDisplay || 20;
    filtered = applyLimit(filtered, maxDisplay);

    return filtered;
  }

  /**
   * Ordenar rutas según criterio
   * @public
   * @param {Array} routes - Rutas a ordenar
   * @param {string} sortBy - Criterio de ordenamiento
   * @returns {Array} Rutas ordenadas
   */
  function sortRoutes(routes, sortBy = SORT_OPTIONS.PROFIT_DESC) {
    // Usar RouteManager si está disponible
    if (window.RouteManager?.sortRoutes) {
      return window.RouteManager.sortRoutes(routes, sortBy);
    }

    // Implementación fallback
    const sorted = [...routes];

    switch (sortBy) {
      case SORT_OPTIONS.PROFIT_DESC:
        sorted.sort((a, b) => b.profitPercentage - a.profitPercentage);
        break;
      case SORT_OPTIONS.PROFIT_ASC:
        sorted.sort((a, b) => a.profitPercentage - b.profitPercentage);
        break;
      case SORT_OPTIONS.EXCHANGE_ASC:
        sorted.sort((a, b) => {
          const nameA = (a.buyExchange || '').toLowerCase();
          const nameB = (b.buyExchange || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case SORT_OPTIONS.INVESTMENT_DESC:
        sorted.sort((a, b) => {
          const investA = a.calculation?.initialAmount || 0;
          const investB = b.calculation?.initialAmount || 0;
          return investB - investA;
        });
        break;
      default:
        sorted.sort((a, b) => b.profitPercentage - a.profitPercentage);
    }

    return sorted;
  }

  /**
   * Actualizar contadores de filtros en la UI
   * @public
   */
  function updateFilterCounts() {
    const allCount = allRoutes.length;
    const p2pCount = allRoutes.filter(route => isP2PRoute(route)).length;
    const noP2pCount = allRoutes.filter(route => !isP2PRoute(route)).length;

    const countAll = document.getElementById('count-all');
    const countP2P = document.getElementById('count-p2p');
    const countNoP2P = document.getElementById('count-no-p2p');

    if (countAll) countAll.textContent = allCount;
    if (countP2P) countP2P.textContent = p2pCount;
    if (countNoP2P) countNoP2P.textContent = noP2pCount;

    console.log(`📊 [FilterManager] Contadores actualizados - Total: ${allCount}, P2P: ${p2pCount}, No P2P: ${noP2pCount}`);
  }

  /**
   * Poblar select de exchanges con opciones únicas
   * @public
   */
  function populateExchangeFilter() {
    const select = document.getElementById('filter-exchange');
    if (!select || !allRoutes) return;

    const exchanges = getUniqueExchanges();

    // Limpiar opciones existentes
    select.innerHTML = '<option value="all">Todos los exchanges</option>';

    // Agregar opciones
    exchanges.forEach(exchange => {
      const option = document.createElement('option');
      option.value = exchange;
      option.textContent = exchange.charAt(0).toUpperCase() + exchange.slice(1);
      select.appendChild(option);
    });

    console.log(`📊 [FilterManager] Filtro de exchanges poblado con ${exchanges.length} opciones`);
  }

  /**
   * Resetear filtros avanzados a valores por defecto
   * @public
   */
  function resetAdvancedFilters() {
    advancedFilters = {
      exchange: 'all',
      profitMin: 0,
      hideNegative: false,
      sortBy: SORT_OPTIONS.PROFIT_DESC
    };

    // Resetear UI
    const exchangeSelect = document.getElementById('filter-exchange');
    const profitRange = document.getElementById('filter-profit-min');
    const profitValue = document.getElementById('filter-profit-value');
    const hideNegative = document.getElementById('filter-hide-negative');
    const sortSelect = document.getElementById('filter-sort');

    if (exchangeSelect) exchangeSelect.value = 'all';
    if (profitRange) profitRange.value = '0';
    if (profitValue) profitValue.textContent = '0%';
    if (hideNegative) hideNegative.checked = false;
    if (sortSelect) sortSelect.value = SORT_OPTIONS.PROFIT_DESC;

    console.log('🔄 [FilterManager] Filtros avanzados reseteados');

    // CORREGIDO: Reaplicar filtros y actualizar la UI con los resultados
    const filteredRoutes = applyAllFilters();
    if (filteredRoutes && filteredRoutes.length > 0) {
      if (window.RouteManager?.displayRoutes) {
        window.RouteManager.displayRoutes(filteredRoutes, 'optimized-routes');
      }
    }
  }

  /**
   * Configurar botones de filtro P2P
   * @public
   */
  function setupFilterButtons() {
    console.log('🔧 [FilterManager] Configurando botones de filtro P2P...');

    // Buscar botones tanto en el panel como en el footer
    const filterButtons = document.querySelectorAll('.filter-btn, .filter-btn-footer');
    console.log(`🔍 [FilterManager] Encontrados ${filterButtons.length} botones de filtro`);

    if (filterButtons.length === 0) {
      console.error('❌ [FilterManager] No se encontraron botones de filtro');
      return;
    }

    filterButtons.forEach((btn, index) => {
      const filter = btn.dataset.filter;
      console.log(`🔍 [FilterManager] Botón ${index + 1}: data-filter="${filter}"`);

      if (!filter) {
        console.warn(`⚠️ [FilterManager] Botón ${index + 1} no tiene atributo data-filter`);
        return;
      }

      btn.addEventListener('click', () => {
        console.log(`🖱️ [FilterManager] Click en botón con filtro: ${filter}`);

        // Actualizar estado activo en todos los botones de filtro (incluyendo footer)
        document.querySelectorAll('.filter-btn, .filter-btn-footer').forEach(b => b.classList.remove('active'));
        // Marcar todos los botones con el mismo filtro como activos
        document.querySelectorAll(`[data-filter="${filter}"]`).forEach(b => b.classList.add('active'));

        // Aplicar filtro
        setCurrentFilter(filter);
        const filteredRoutes = applyAllFilters();
        
        // Actualizar UI con rutas filtradas
        if (window.RouteManager && window.RouteManager.displayRoutes) {
          window.RouteManager.displayRoutes(filteredRoutes, 'optimized-routes');
          console.log(`✅ [FilterManager] UI actualizada con ${filteredRoutes.length} rutas`);
        }
        
        // Actualizar contadores
        updateFilterCounts();
      });

      console.log(`✅ [FilterManager] Event listener adjuntado al botón ${index + 1}`);
    });

    // Limpiar cualquier clase active previa del HTML
    document.querySelectorAll('.filter-btn, .filter-btn-footer').forEach(b => b.classList.remove('active'));

    // Auto-ajustar filtro por defecto si es necesario
    autoAdjustDefaultFilter();

    // Marcar filtro actual como activo (solo uno)
    const defaultButtons = document.querySelectorAll(`[data-filter="${currentFilter}"]`);
    defaultButtons.forEach(btn => btn.classList.add('active'));
    if (defaultButtons.length > 0) {
      console.log(`✅ [FilterManager] Filtro activo: ${currentFilter}`);
    }

    console.log('✅ [FilterManager] Botones de filtro configurados correctamente');
  }

  /**
   * Configurar filtros avanzados
   * @public
   */
  function setupAdvancedFilters() {
    // Toggle panel
    const toggleBtn = document.getElementById('toggle-advanced-filters');
    const panel = document.getElementById('advanced-filters-panel');

    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        const arrow = toggleBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = isVisible ? '▼' : '▲';
      });
    }

    // Poblar exchanges
    populateExchangeFilter();

    // Filtro de profit mínimo
    const profitRange = document.getElementById('filter-profit-min');
    const profitValue = document.getElementById('filter-profit-value');

    if (profitRange && profitValue) {
      profitRange.addEventListener('input', e => {
        const value = parseFloat(e.target.value);
        profitValue.textContent = `${value}%`;
        advancedFilters.profitMin = value;
      });
    }

    // Toggle ocultar negativas
    const hideNegative = document.getElementById('filter-hide-negative');
    if (hideNegative) {
      hideNegative.addEventListener('change', e => {
        advancedFilters.hideNegative = e.target.checked;
      });
    }

    // Filtro de exchange
    const exchangeSelect = document.getElementById('filter-exchange');
    if (exchangeSelect) {
      exchangeSelect.addEventListener('change', e => {
        advancedFilters.exchange = e.target.value;
      });
    }

    // Ordenar por
    const sortSelect = document.getElementById('filter-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        advancedFilters.sortBy = e.target.value;
      });
    }

    // Botones de acción
    const applyBtn = document.getElementById('apply-filters');
    const resetBtn = document.getElementById('reset-filters');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => applyAllFilters());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => resetAdvancedFilters());
    }
  }

  // ==========================================
  // EXPORTAR MÓDULO
  // ==========================================

  const FilterManager = {
    // Constantes
    FILTER_TYPES,
    SORT_OPTIONS,

    // Inicialización
    init,
    updateRoutes,
    updateSettings,

    // Estado
    getCurrentFilter,
    setCurrentFilter,
    getAdvancedFilters,
    setAdvancedFilters,

    // Filtros
    applyAllFilters,
    applyUserPreferences,
    sortRoutes,

    // UI
    updateFilterCounts,
    populateExchangeFilter,
    resetAdvancedFilters,
    setupFilterButtons,
    setupAdvancedFilters
  };

  // Exportar para uso global
  window.FilterManager = FilterManager;

  console.log('✅ [FilterManager] Módulo cargado correctamente');

})(window);
