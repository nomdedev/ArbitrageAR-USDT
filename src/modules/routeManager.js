/**
 * Route Manager Module
 * Módulo para la gestión y visualización de rutas de arbitraje
 * @module RouteManager
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  // ==========================================
  // ESTADO DEL MÓDULO
  // ==========================================

  let allRoutes = [];
  let filteredRoutes = [];
  let userSettings = null;

  // ==========================================
  // CONSTANTES
  // ==========================================

  const ROUTE_TYPES = {
    ARBITRAGE: 'arbitrage',
    DIRECT_USDT_ARS: 'direct_usdt_ars',
    USD_TO_USDT: 'usd_to_usdt'
  };

  const ROUTE_CATEGORIES = {
    PROFIT_HIGH: 'profit-high',
    PROFIT_NEGATIVE: 'profit-negative',
    SINGLE_EXCHANGE: 'single-exchange',
    MULTI_EXCHANGE: 'multi-exchange'
  };

  // ==========================================
  // FUNCIONES PRIVADAS
  // ==========================================

  /**
   * Obtener clase de profit según porcentaje
   * @private
   * @param {number} percentage - Porcentaje de ganancia
   * @returns {Object} Objeto con clases CSS
   */
  function getProfitClasses(percentage) {
    const isNegative = percentage < 0;
    let profitClass = 'profit-neutral';
    let profitBadgeClass = 'badge-neutral';

    if (percentage >= 2) {
      profitClass = 'profit-high';
      profitBadgeClass = 'badge-high';
    } else if (percentage >= 0) {
      profitClass = 'profit-positive';
      profitBadgeClass = 'badge-positive';
    } else if (percentage >= -2) {
      profitClass = 'profit-low-negative';
      profitBadgeClass = 'badge-low-negative';
    } else {
      profitClass = 'profit-negative';
      profitBadgeClass = 'badge-negative';
    }

    return { isNegative, profitClass, profitBadgeClass };
  }

  /**
   * Obtener tipo de ruta
   * @private
   * @param {Object} route - Datos de la ruta
   * @returns {string} Tipo de ruta
   */
  function getRouteType(route) {
    if (route.routeCategory) return route.routeCategory;
    if (route.routeType) return route.routeType;
    if (route.isDirectSale || route.arsReceived) return ROUTE_TYPES.DIRECT_USDT_ARS;
    if (route.isPurchaseRoute || route.efficiency) return ROUTE_TYPES.USD_TO_USDT;
    return ROUTE_TYPES.ARBITRAGE;
  }

  /**
   * Obtener métricas de display para una ruta
   * @private
   * @param {Object} route - Datos de la ruta
   * @param {string} routeType - Tipo de ruta
   * @returns {Object} Métricas formateadas
   */
  function getRouteDisplayMetrics(route, routeType) {
    const Fmt = window.Formatters || { formatNumber: n => n?.toLocaleString('es-AR') || '0' };

    switch (routeType) {
      case ROUTE_TYPES.DIRECT_USDT_ARS: {
        const arsReceived = route.arsReceived || 0;
        const usdtSold = route.usdtSold || route.calculation?.initialUsdtAmount || 1000;
        const percentage = route.profitPercentage || 0;

        return {
          percentage,
          mainValue: `$${Fmt.formatNumber(arsReceived)} ARS`,
          secondaryInfo: `vendiendo ${usdtSold} USDT`
        };
      }

      case ROUTE_TYPES.USD_TO_USDT: {
        const usdtReceived = route.usdtReceived || 0;
        const usdInvested = route.usdInvested || route.calculation?.initialUsdAmount || 1000;
        const efficiency = route.efficiency || 0;

        return {
          percentage: (efficiency - 1) * 100,
          mainValue: `${Fmt.formatNumber(usdtReceived)} USDT`,
          secondaryInfo: `por ${usdInvested} USD invertidos`
        };
      }

      default: {
        const profitPercentage = route.profitPercentage || route.calculation?.profitPercentage || 0;
        const netProfit = Math.abs(route.calculation?.netProfit || 0);
        const initial = route.calculation?.initialAmount || route.calculation?.initial || 100000;

        return {
          percentage: profitPercentage,
          mainValue: `${profitPercentage >= 0 ? '+' : ''}$${Fmt.formatNumber(netProfit)} ARS`,
          secondaryInfo: `sobre $${Fmt.formatNumber(initial)} ARS`
        };
      }
    }
  }

  function getRouteTypeName(routeType) {
    switch (routeType) {
      case ROUTE_TYPES.DIRECT_USDT_ARS:
        return 'USDT → ARS';
      case ROUTE_TYPES.USD_TO_USDT:
        return 'USD → USDT';
      default:
        return 'Arbitraje';
    }
  }

  /**
   * Obtener badge P2P
   * @private
   * @param {Object} route - Datos de la ruta
   * @returns {string} HTML del badge
   */
  function getP2PBadge(route) {
    const isP2P = route.requiresP2P || (route.broker && route.broker.toLowerCase().includes('p2p'));
    return isP2P
      ? '<span class="p2p-badge">🤝 P2P</span>'
      : '<span class="no-p2p-badge">⚡ Directo</span>';
  }

  /**
   * Obtener descripción de la ruta
   * @private
   * @param {Object} route - Datos de la ruta
   * @param {string} routeType - Tipo de ruta
   * @returns {string} Descripción HTML
   */
  function getRouteDescription(route, routeType) {
    switch (routeType) {
      case ROUTE_TYPES.DIRECT_USDT_ARS:
        return `<strong>${route.broker}</strong> - Venta directa`;
      case ROUTE_TYPES.USD_TO_USDT:
        return `<strong>${route.broker}</strong> - Compra USDT`;
      default:
        if (route.isSingleExchange) {
          return `<strong>${route.buyExchange}</strong>`;
        } else {
          return `<strong>${route.buyExchange}</strong> → <strong>${route.sellExchange}</strong>`;
        }
    }
  }

  /**
   * Obtener icono de ruta
   * @private
   * @param {string} routeType - Tipo de ruta
   * @param {Object} route - Datos de la ruta
   * @returns {string} Icono emoji
   */
  function getRouteIcon(routeType, route) {
    switch (routeType) {
      case ROUTE_TYPES.DIRECT_USDT_ARS:
        return '💰';
      case ROUTE_TYPES.USD_TO_USDT:
        return '💎';
      default:
        return route?.isSingleExchange ? '🎯' : '🔀';
    }
  }

  // ==========================================
  // FUNCIONES PÚBLICAS
  // ==========================================

  /**
   * Inicializar el módulo de gestión de rutas
   * @public
   * @param {Object} data - Datos actuales de la aplicación
   * @param {Object} settings - Configuración del usuario
   */
  function init(data, settings) {
    userSettings = settings;
    allRoutes = data?.optimizedRoutes || [];
    window.Logger?.debug('✅ [RouteManager] Módulo inicializado con', allRoutes.length, 'rutas');
  }

  /**
   * Actualizar los datos de rutas
   * @public
   * @param {Object} data - Nuevos datos
   */
  function updateData(data) {
    allRoutes = data?.optimizedRoutes || [];
    window.Logger?.debug('✅ [RouteManager] Datos actualizados:', allRoutes.length, 'rutas');
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
   * Establecer las rutas filtradas
   * @public
   * @param {Array} routes - Rutas filtradas
   */
  function setFilteredRoutes(routes) {
    filteredRoutes = routes || [];
  }

  /**
   * Obtener todas las rutas
   * @public
   * @returns {Array} Todas las rutas
   */
  function getAllRoutes() {
    return allRoutes;
  }

  /**
   * Obtener rutas filtradas
   * @public
   * @returns {Array} Rutas filtradas
   */
  function getFilteredRoutes() {
    return filteredRoutes;
  }

  /**
   * Verificar si una ruta usa P2P
   * @public
   * @param {Object} route - Datos de la ruta
   * @returns {boolean} True si usa P2P
   */
  function isP2PRoute(route) {
    if (!route) return false;

    // Prioridad 1: Usar el campo requiresP2P calculado en backend
    if (typeof route.requiresP2P === 'boolean') {
      return route.requiresP2P;
    }

    // Fallback 1: Verificar nombre del broker
    const brokerName = route.broker?.toLowerCase() || '';
    if (brokerName.includes('p2p')) {
      return true;
    }

    // Fallback 2: Verificar nombres de exchanges
    const buyName = route.buyExchange?.toLowerCase() || '';
    const sellName = route.sellExchange?.toLowerCase() || '';
    if (buyName.includes('p2p') || sellName.includes('p2p')) {
      return true;
    }

    return false;
  }

  /**
   * Ordenar rutas según criterio
   * @public
   * @param {Array} routes - Rutas a ordenar
   * @param {string} sortBy - Criterio de ordenamiento
   * @returns {Array} Rutas ordenadas
   */
  function sortRoutes(routes, sortBy = 'profit-desc') {
    const sorted = [...routes];

    switch (sortBy) {
      case 'profit-desc':
        sorted.sort((a, b) => b.profitPercentage - a.profitPercentage);
        break;
      case 'profit-asc':
        sorted.sort((a, b) => a.profitPercentage - b.profitPercentage);
        break;
      case 'exchange-asc':
        sorted.sort((a, b) => {
          const nameA = (a.buyExchange || '').toLowerCase();
          const nameB = (b.buyExchange || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'investment-desc':
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
   * Crear elemento HTML para una ruta
   * @public
   * @param {Object} route - Datos de la ruta
   * @param {number} index - Índice de la ruta
   * @returns {HTMLElement} Elemento de la tarjeta de ruta
   */
  function createRouteElement(route, index) {
    const Fmt = window.Formatters || { formatNumber: n => n?.toLocaleString('es-AR') || '0' };
    const interfaceSettings = userSettings || {};

    const showProfitColors = interfaceSettings.interfaceShowProfitColors !== false;
    const compactView = interfaceSettings.interfaceCompactView || false;
    const showTimestamps = interfaceSettings.interfaceShowTimestamps || false;

    const routeType = getRouteType(route);
    const displayMetrics = getRouteDisplayMetrics(route, routeType);

    const { profitClass, profitBadgeClass } = showProfitColors
      ? getProfitClasses(displayMetrics.percentage)
      : { isNegative: false, profitClass: '', profitBadgeClass: '' };

    const profitSymbol = displayMetrics.percentage >= 0 ? '+' : '';
    const p2pBadge = getP2PBadge(route);
    const compactClass = compactView ? 'compact-view' : '';

    const timestampInfo = showTimestamps && route.timestamp;

    const routeDescription = getRouteDescription(route, routeType);

    const routeData = JSON.stringify({
      ...route,
      routeType,
      displayMetrics
    });
    const escapedRouteData = encodeURIComponent(routeData);

    const card = document.createElement('div');
    card.className = `route-card ${profitClass} ${routeType} ${compactClass}`;
    card.dataset.index = index;
    card.dataset.route = escapedRouteData;

    // Estructura unificada con crypto cards
    card.innerHTML = `
      <div class="fiat-card-header">
        <div class="fiat-info">
          <span class="fiat-icon">${getRouteIcon(routeType, route)}</span>
          <span class="fiat-name">${getRouteTypeName(routeType)}</span>
        </div>
        <div class="profit-badge ${profitBadgeClass} text-underline-animated glow-pulse">
          ${profitSymbol}${Fmt.formatNumber(displayMetrics.percentage)}%
        </div>
      </div>
      
      <div class="fiat-card-body">
        <div class="route-path">
          ${routeDescription}
        </div>
        
        <div class="operation-meta">
          ${p2pBadge}
          ${timestampInfo ? `<span class="time-indicator">🕐 ${new Date(route.timestamp).toLocaleTimeString()}</span>` : ''}
        </div>
      </div>
      
      <div class="fiat-card-footer">
        <div class="profit-details">
          <span class="label">Resultado:</span>
          <span class="value ${displayMetrics.percentage >= 0 ? '' : 'negative'}">${displayMetrics.mainValue}</span>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Renderizar rutas en el contenedor
   * @public
   * @param {Array} routes - Rutas a renderizar
   * @param {string} containerId - ID del contenedor (default: 'optimized-routes')
   */
  function displayRoutes(routes, containerId = 'optimized-routes') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ [RouteManager] Contenedor #${containerId} no encontrado`);
      return;
    }

    const interfaceSettings = userSettings || {};

    // Verificar si hay rutas para mostrar
    if (!routes || routes.length === 0) {
      const threshold = interfaceSettings.profitThreshold || 1.0;
      const routeType = interfaceSettings.routeType || 'arbitrage';

      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-header">
            <div class="empty-state-icon-wrapper">
              <span class="empty-state-emoji">📊</span>
            </div>
            <h3 class="empty-state-title">Estado del Mercado</h3>
            <p class="empty-state-subtitle">No se encontraron oportunidades</p>
          </div>
          
          <div class="empty-state-reasons">
            <p class="reasons-title">Posibles causas:</p>
            <div class="reasons-list">
              <div class="reason-item">
                <span class="reason-icon">🎯</span>
                <div class="reason-content">
                  <span class="reason-label">Umbral muy alto</span>
                  <span class="reason-hint">Prueba bajar el umbral mínimo</span>
                </div>
              </div>
              <div class="reason-item">
                <span class="reason-icon">🏦</span>
                <div class="reason-content">
                  <span class="reason-label">Exchanges restrictivos</span>
                  <span class="reason-hint">Agrega más exchanges</span>
                </div>
              </div>
              <div class="reason-item">
                <span class="reason-icon">🔄</span>
                <div class="reason-content">
                  <span class="reason-label">Mercado en equilibrio</span>
                  <span class="reason-hint">Tasas cercanas al oficial</span>
                </div>
              </div>
              <div class="reason-item">
                <span class="reason-icon">🤝</span>
                <div class="reason-content">
                  <span class="reason-label">Filtro P2P activo</span>
                  <span class="reason-hint">Cambia a "Todas" o "No P2P"</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="empty-state-config">
            <span class="config-badge">
              <span class="config-icon">⚙️</span>
              Umbral: ${threshold}% · Tipo: ${routeType}
            </span>
          </div>
          
          <div class="empty-state-actions">
            <button class="btn-action btn-primary-action" data-action="reload">
              <span class="btn-icon">🔄</span>
              Actualizar
            </button>
            <button class="btn-action btn-secondary-action" onclick="chrome.runtime.openOptionsPage()">
              <span class="btn-icon">⚙️</span>
              Configuración
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Ordenar rutas por relevancia
    routes.sort((a, b) => {
      if (a.routeCategory === 'arbitrage' || (!a.routeCategory && a.profitPercentage !== undefined)) {
        const profitA = a.profitPercentage || 0;
        const profitB = b.profitPercentage || 0;
        return profitB - profitA;
      }
      if (a.routeCategory === 'direct_usdt_ars' || a.isDirectSale) {
        const arsA = a.arsReceived || 0;
        const arsB = b.arsReceived || 0;
        return arsB - arsA;
      }
      if (a.routeCategory === 'usd_to_usdt' || a.isPurchaseRoute) {
        const effA = a.efficiency || 0;
        const effB = b.efficiency || 0;
        return effB - effA;
      }
      return 0;
    });

    // Limpiar contenedor
    container.innerHTML = '';

    // Crear y agregar tarjetas
    const fragment = document.createDocumentFragment();
    routes.forEach((route, index) => {
      const card = createRouteElement(route, index);

      // Agregar clases de animación
      card.classList.add('stagger-in', 'hover-lift', 'click-shrink', 'magnetic-btn', 'ripple-btn', 'hover-scale-rotate');
      card.style.animationDelay = `${index * 50}ms`;

      fragment.appendChild(card);
    });

    container.appendChild(fragment);

    // Inicializar micro-interacciones
    if (typeof window.initMagneticButtons === 'function') {
      window.initMagneticButtons();
    }

    // Agregar event listeners a las tarjetas
    attachRouteListeners(container);

    window.Logger?.debug(`✅ [RouteManager] Renderizadas ${routes.length} rutas`);
  }

  /**
   * Adjuntar event listeners a las tarjetas de ruta
   * @private
   * @param {HTMLElement} container - Contenedor de rutas
   * @param {Array} routes - Rutas renderizadas
   */
  function attachRouteListeners(container) {
    const routeCards = container.querySelectorAll('.route-card');

    routeCards.forEach((card) => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const routeData = this.dataset.route;
        if (!routeData) {
          console.error('❌ [RouteManager] No se encontró data-route en la tarjeta');
          return;
        }

        try {
          const route = JSON.parse(decodeURIComponent(routeData));
          window.Logger?.debug('🖱️ [RouteManager] Click en ruta:', route.broker || route.buyExchange);

          // Remover selección previa
          container.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');

          // Emitir evento personalizado
          const event = new CustomEvent('routeSelected', { detail: route });
          document.dispatchEvent(event);

        } catch (error) {
          console.error('❌ [RouteManager] Error al parsear data-route:', error);
        }
      });
    });
  }

  /**
   * Mostrar mensaje de "sin datos"
   * @public
   * @param {string} containerId - ID del contenedor
   * @param {string} message - Mensaje a mostrar
   */
  function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">${message || 'No hay oportunidades de arbitraje disponibles'}</div>
      </div>
    `;
  }

  /**
   * Mostrar mensaje de error
   * @public
   * @param {string} containerId - ID del contenedor
   * @param {string} message - Mensaje de error
   */
  function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="error-message">
        <p>❌ ${message || 'Error al cargar los datos'}</p>
      </div>
    `;
  }

  // ==========================================
  // EXPORTAR MÓDULO
  // ==========================================

  const RouteManager = {
    // Constantes
    ROUTE_TYPES,
    ROUTE_CATEGORIES,

    // Inicialización
    init,
    updateData,
    updateSettings,

    // Gestión de rutas
    setFilteredRoutes,
    getAllRoutes,
    getFilteredRoutes,

    // Utilidades
    isP2PRoute,
    sortRoutes,
    createRouteElement,

    // Renderizado
    displayRoutes,
    showEmptyState,
    showError
  };

  // Exportar para uso global
  window.RouteManager = RouteManager;

  window.Logger?.debug('✅ [RouteManager] Módulo cargado correctamente');

})(window);
