/**
 * Route Renderer Module - ArbitrageAR v5.0
 * Responsable de renderizar las tarjetas de rutas de arbitraje
 */

const RouteRenderer = (() => {
  // Obtener referencias a utilidades
  const getFormatters = () => window.Formatters || {};
  const getState = () => window.StateManager || { get: () => null };

  /**
   * Obtener clases CSS basadas en el porcentaje de ganancia
   */
  const getProfitClasses = profitPercent => {
    const isNegative = profitPercent < 0;
    const isHighProfit = profitPercent > 5;

    let profitClass = '';
    let profitBadgeClass = '';

    if (isNegative) {
      profitClass = 'negative-profit';
      profitBadgeClass = 'negative';
    } else if (isHighProfit) {
      profitClass = 'high-profit';
      profitBadgeClass = 'high';
    }

    return { isNegative, profitClass, profitBadgeClass };
  };

  /**
   * Obtener icono de exchange
   */
  const getExchangeIcon = exchangeName => {
    const icons = {
      binance: '🟡',
      binancep2p: '🟡',
      buenbit: '🔵',
      lemoncash: '🍋',
      ripio: '🟣',
      fiwind: '🌊',
      letsbit: '💜',
      satoshitango: '🟠',
      decrypto: '🔷',
      bitsoalpha: '🔶',
      default: '💱'
    };

    const name = (exchangeName || '').toLowerCase().replace(/\s+/g, '');
    return icons[name] || icons.default;
  };

  /**
   * Crear indicador de riesgo
   */
  const createRiskIndicator = (route, profitPercent) => {
    let riskLevel = 'low';
    let riskIcon = '🟢';
    const riskReasons = [];

    // Calcular riesgo
    if (profitPercent < 0) {
      riskLevel = 'high';
      riskIcon = '🔴';
      riskReasons.push('Operación con pérdida');
    } else if (profitPercent < 0.5) {
      riskLevel = 'medium';
      riskIcon = '🟡';
      riskReasons.push('Rentabilidad muy baja');
    }

    if (route.isP2P || route.requiresP2P) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      riskIcon = riskLevel === 'high' ? '🔴' : '🟡';
      riskReasons.push('Involucra P2P');
    }

    if (!route.isSingleExchange) {
      riskReasons.push('Requiere transferencia');
    }

    return {
      level: riskLevel,
      icon: riskIcon,
      reasons: riskReasons,
      html: `
        <div class="risk-indicator risk-${riskLevel}" title="${riskReasons.join(', ') || 'Bajo riesgo'}">
          ${riskIcon}
        </div>
      `
    };
  };

  /**
   * Renderizar una tarjeta de ruta individual
   */
  const renderRouteCard = (route, index) => {
    const fmt = getFormatters();
    const formatNumber = fmt.formatNumber || (n => n?.toFixed(2) || '0.00');
    const formatARS = fmt.formatARS || (n => `$${formatNumber(n)}`);

    const profitPercent = route.profitPercentage || route.profit || 0;
    const { profitClass, profitBadgeClass, isNegative } = getProfitClasses(profitPercent);

    const exchangeName = route.broker || route.exchange || 'Exchange';
    const exchangeIcon = getExchangeIcon(exchangeName);

    const risk = createRiskIndicator(route, profitPercent);

    // Determinar si es P2P
    const isP2P = route.isP2P || route.requiresP2P || exchangeName.toLowerCase().includes('p2p');
    const p2pBadge = isP2P ? '<span class="p2p-badge">P2P</span>' : '';

    // Tipo de ruta
    const routeType = route.isSingleExchange ? 'Single' : 'Multi-Exchange';
    const routeTypeClass = route.isSingleExchange ? 'single' : 'multi';

    return `
      <div class="route-card ${profitClass}" data-route-id="${route.id || index}" data-exchange="${exchangeName.toLowerCase()}">
        <div class="route-header">
          <div class="exchange-info">
            <span class="exchange-icon">${exchangeIcon}</span>
            <span class="exchange-name">${exchangeName}</span>
            ${p2pBadge}
            <span class="route-type ${routeTypeClass}">${routeType}</span>
          </div>
          <div class="route-profit ${profitBadgeClass}">
            <span class="profit-value">${isNegative ? '' : '+'}${profitPercent.toFixed(2)}%</span>
          </div>
        </div>
        
        <div class="route-details">
          <div class="route-step">
            <span class="step-label">Compra USD:</span>
            <span class="step-value">${formatARS(route.usdBuyPrice || route.calculation?.usdBuyPrice)}</span>
          </div>
          <div class="route-step">
            <span class="step-label">Venta USDT:</span>
            <span class="step-value">${formatARS(route.usdtSellPrice || route.sellPrice)}</span>
          </div>
        </div>
        
        <div class="route-footer">
          ${risk.html}
          <button class="btn-details" data-route-index="${index}" title="Ver detalles">
            📊 Detalles
          </button>
        </div>
      </div>
    `;
  };

  /**
   * Renderizar lista de rutas
   */
  const renderRoutes = (routes, containerId = 'optimized-routes') => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container no encontrado:', containerId);
      return;
    }

    if (!routes || routes.length === 0) {
      container.innerHTML = `
        <div class="no-routes">
          <span class="no-routes-icon">🔍</span>
          <p>No se encontraron rutas de arbitraje</p>
          <small>Intenta ajustar los filtros o espera a la próxima actualización</small>
        </div>
      `;
      return;
    }

    const html = routes.map((route, index) => renderRouteCard(route, index)).join('');
    container.innerHTML = html;

    // Agregar event listeners a los botones de detalles
    container.querySelectorAll('.btn-details').forEach(btn => {
      btn.addEventListener('click', e => {
        const index = e.target.dataset.routeIndex;
        if (window.showRouteDetails) {
          window.showRouteDetails(routes[index]);
        }
      });
    });
  };

  /**
   * Renderizar estado de carga
   */
  const renderLoading = (containerId = 'optimized-routes') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Calculando rutas optimizadas...</p>
      </div>
    `;
  };

  /**
   * Renderizar error
   */
  const renderError = (message, containerId = 'optimized-routes') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="error-state">
        <span class="error-icon">⚠️</span>
        <p>${message}</p>
        <button class="btn-retry" onclick="window.fetchAndDisplay && window.fetchAndDisplay(true)">
          🔄 Reintentar
        </button>
      </div>
    `;
  };

  /**
   * Actualizar contadores de filtros
   */
  const updateFilterCounts = routes => {
    const allCount = routes.length;
    const p2pCount = routes.filter(r => r.isP2P || r.requiresP2P).length;
    const noP2pCount = allCount - p2pCount;

    const countAll = document.getElementById('count-all');
    const countP2p = document.getElementById('count-p2p');
    const countNoP2p = document.getElementById('count-no-p2p');

    if (countAll) countAll.textContent = allCount;
    if (countP2p) countP2p.textContent = p2pCount;
    if (countNoP2p) countNoP2p.textContent = noP2pCount;
  };

  // API pública
  return {
    renderRouteCard,
    renderRoutes,
    renderLoading,
    renderError,
    updateFilterCounts,
    getProfitClasses,
    getExchangeIcon,
    createRiskIndicator
  };
})();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RouteRenderer;
}

// Exponer globalmente para navegador
if (typeof window !== 'undefined') {
  window.RouteRenderer = RouteRenderer;
}
