// Helpers puros para generar HTML de las cards (útiles para testing sin DOM)
// v6.0.0 - Diseño mejorado según plan estético

// Universal Module Definition (UMD) pattern simplificado
(function (root) {
  // Obtener dependencia getProfitClasses
  let getProfitClasses;
  if (typeof require !== 'undefined') {
    // Node.js
    getProfitClasses = require('./utils.js').getProfitClasses;
  } else {
    // Browser (asume que utils.js se cargó antes)
    getProfitClasses = root.getProfitClasses;
  }

  function renderArbitrageCard(arb, index) {
    const { isNegative, profitClass, profitBadgeClass } = getProfitClasses(
      arb.profitPercentage || 0
    );
    const profitSymbol = isNegative ? '' : '+';

    // Indicadores de estado
    const statusIndicator = isNegative
      ? '<span class="status-indicator loss" title="Pérdida">⚠️</span>'
      : arb.profitPercentage >= 2
        ? '<span class="status-indicator high" title="Alta ganancia">🔥</span>'
        : arb.profitPercentage >= 0.5
          ? '<span class="status-indicator ok" title="Ganancia moderada">✓</span>'
          : '<span class="status-indicator low" title="Ganancia baja">👁️</span>';

    const hasFees = arb.fees && arb.fees.total > 0;
    const spread = arb.spread
      ? `<span class="card-spread">Spread: ${formatNumber(arb.spread)}%</span>`
      : '';

    return `
      <div class="arbitrage-card ${profitClass}" data-index="${index}" role="article" aria-label="Oportunidad de arbitraje en ${escapeHtml(arb.broker || 'exchange')}">
        <div class="card-indicator ${isNegative ? 'negative' : arb.profitPercentage >= 2 ? 'high' : 'normal'}"></div>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <span class="exchange-icon">🏦</span>
              <h3>${escapeHtml(arb.broker || 'Desconocido')}</h3>
              ${statusIndicator}
            </div>
            <div class="profit-badge ${profitBadgeClass}" aria-label="Ganancia ${profitSymbol}${formatNumber(arb.profitPercentage)} por ciento">
              ${profitSymbol}${formatNumber(arb.profitPercentage)}%
            </div>
          </div>
          <div class="card-body">
            <div class="price-grid">
              <div class="price-item">
                <span class="price-label">💵 Compra USD</span>
                <span class="price-value">$${formatNumber(arb.officialPrice)}</span>
              </div>
              <div class="price-item highlight">
                <span class="price-label">💸 Venta USDT</span>
                <span class="price-value">$${formatNumber(arb.usdtArsBid)}</span>
              </div>
            </div>
            ${
              hasFees
                ? `
            <div class="card-fees">
              <span class="fee-label">📊 Fees totales:</span>
              <span class="fee-value">${formatNumber(arb.fees.total)}%</span>
            </div>`
                : ''
            }
            ${spread ? `<div class="card-meta">${spread}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderRouteCard(route, index, displayMetrics) {
    const { isNegative, profitClass, profitBadgeClass } = getProfitClasses(
      displayMetrics.percentage || 0
    );
    const profitSymbol = isNegative ? '' : '+';

    // Indicadores visuales
    const profitLevel = isNegative
      ? 'loss'
      : displayMetrics.percentage >= 2
        ? 'high'
        : displayMetrics.percentage >= 0.5
          ? 'medium'
          : 'low';

    // Información adicional
    const routeDescription = getRouteDescription(route);
    const hasVolume = route.volume && route.volume > 0;
    const volumeDisplay = hasVolume ? `Vol: ${formatVolume(route.volume)}` : '';

    // Determinar tipo de operación
    const isP2P =
      route.requiresP2P || (route.buyExchange && route.buyExchange.toLowerCase().includes('p2p'));
    const operationType = isP2P ? 'P2P' : 'DIRECT';
    const operationBadgeClass = isP2P ? 'p2p' : 'direct';

    // Data para el click handler
    const routeData = JSON.stringify({ ...route, displayMetrics }).replace(/'/g, '&apos;');

    return `
      <div class="route-card ${profitClass} ${isP2P ? 'is-p2p' : 'is-direct'}" data-index="${index}" data-route='${routeData}' 
           role="button" tabindex="0" aria-label="Ruta: ${routeDescription}, ganancia ${profitSymbol}${formatNumber(displayMetrics.percentage)} por ciento">
        <div class="fiat-card-header">
          <div class="fiat-info">
            <span class="fiat-icon">💵</span>
            <span class="fiat-name">USDT/ARS</span>
          </div>
          <div class="profit-badge ${profitBadgeClass}">
            ${profitSymbol}${formatNumber(displayMetrics.percentage)}%
          </div>
        </div>
        
        <div class="fiat-card-body">
          <div class="route-path-display">
            <span class="exchange-badge">${escapeHtml(route.buyExchange || 'Compra')}</span>
            <span class="arrow">→</span>
            <span class="exchange-badge">${escapeHtml(route.sellExchange || 'Venta')}</span>
          </div>
          
          <div class="operation-meta">
            <span class="operation-badge ${operationBadgeClass}">${operationType}</span>
            ${hasVolume ? `<span class="volume-indicator">📊 ${volumeDisplay}</span>` : ''}
          </div>
        </div>
        
        <div class="fiat-card-footer">
          <div class="profit-details">
            <span class="label">Ganancia estimada:</span>
            <span class="value ${isNegative ? 'negative' : ''}">${displayMetrics.mainValue} ARS</span>
          </div>
          <button class="btn-details" data-route-index="${index}">
            Ver detalles
          </button>
        </div>
      </div>
    `;
  }

  // Helpers de formato reutilizados
  function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatVolume(volume) {
    if (!volume || volume <= 0) return 'N/A';
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getRouteDescription(route) {
    if (!route) return '---';

    // Manejar rutas inter-broker (buyExchange !== sellExchange)
    if (route.buyExchange && route.sellExchange && route.buyExchange !== route.sellExchange) {
      return `${route.buyExchange} → ${route.sellExchange}`;
    }

    // Ruta intra-broker o rutas antiguas con steps
    if (route.steps) {
      return route.steps.map(s => `${s.exchange || s.from}->${s.to}`).join(' → ');
    }

    // Fallback: usar el campo broker si existe
    if (route.broker && !route.broker.includes('→')) {
      return route.broker;
    }

    return '---';
  }

  // Exportar
  const exports = {
    renderArbitrageCard,
    renderRouteCard,
    formatNumber,
    formatVolume,
    escapeHtml,
    getRouteDescription
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  } else {
    // Exponer globalmente en navegador
    Object.assign(root, exports);
  }
})(typeof window !== 'undefined' ? window : this);
