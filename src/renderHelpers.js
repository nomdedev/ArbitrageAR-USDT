// Helpers puros para generar HTML de las cards (útiles para testing sin DOM)

function renderArbitrageCard(arb, index) {
  const { isNegative, profitClass, profitBadgeClass } = require('./utils.js').getProfitClasses(arb.profitPercentage || 0);
  const lowProfitIndicator = (arb.profitPercentage >= 0 && arb.profitPercentage < 1) ? '<span class="low-profit-tag">👁️ Solo vista</span>' : '';
  const negativeIndicator = isNegative ? '<span class="negative-tag">⚠️ Pérdida</span>' : '';
  const profitSymbol = isNegative ? '' : '+';

  const hasFees = arb.fees && arb.fees.total > 0;

  return `
    <div class="arbitrage-card ${profitClass}" data-index="${index}">
      <div class="card-header">
        <h3>🏦 ${escapeHtml(arb.broker || 'Desconocido')}</h3>
        ${negativeIndicator ? `<div class="broker-loss-indicator">${negativeIndicator}</div>` : ''}
        <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${formatNumber(arb.profitPercentage)}% ${lowProfitIndicator}</div>
      </div>
      <div class="card-body">
        <div class="price-row"><span class="price-label">💵 Dólar Oficial</span><span class="price-value">$${formatNumber(arb.officialPrice)}</span></div>
        <div class="price-row"><span class="price-label">💸 USDT → ARS</span><span class="price-value highlight">$${formatNumber(arb.usdtArsBid)}</span></div>
        ${hasFees ? `<div class="price-row fees-row"><span class="price-label">📊 Comisiones</span><span class="price-value fee-value">${formatNumber(arb.fees.total)}%</span></div>` : ''}
      </div>
    </div>
  `;
}

function renderRouteCard(route, index, displayMetrics) {
  const { isNegative, profitClass, profitBadgeClass } = require('./utils.js').getProfitClasses(displayMetrics.percentage || 0);
  const profitSymbol = isNegative ? '' : '+';
  const negativeIndicator = isNegative ? '<span class="negative-tag">⚠️ Pérdida</span>' : '';

  const routeData = JSON.stringify({ ...route, displayMetrics }).replace(/'/g, "&apos;");

  return `
    <div class="route-card ${profitClass}" data-index="${index}" data-route='${routeData}'>
      <div class="route-header">
        <div class="route-title">
          <h3>🔀 Ruta ${index + 1}</h3>
          ${negativeIndicator ? `<div class="route-loss-indicator">${negativeIndicator}</div>` : ''}
          <div class="route-badges"></div>
        </div>
        <div class="route-profit-section">
          <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${formatNumber(displayMetrics.percentage)}%</div>
        </div>
      </div>
      <div class="route-compact">
        <div class="route-summary-line"><span class="route-exchanges">🏦 ${escapeHtml(getRouteDescription(route))}</span></div>
        <div class="route-profit-line"><span class="profit-amount">${displayMetrics.mainValue}</span></div>
      </div>
    </div>
  `;
}

// Helpers de formato reutilizados
function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getRouteDescription(route) {
  if (!route || !route.steps) return '---';
  return route.steps.map(s => `${s.exchange || s.from}->${s.to}`).join(' → ');
}

module.exports = { renderArbitrageCard, renderRouteCard, formatNumber, escapeHtml, getRouteDescription };
