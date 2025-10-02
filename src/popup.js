// Estado global
let currentData = null;
let selectedArbitrage = null;
let userSettings = null; // NUEVO v5.0: Configuración del usuario
let currentFilter = 'all'; // TEMPORAL: Cambiar a 'all' para debug - luego volver a 'no-p2p'
let allRoutes = []; // NUEVO: Cache de todas las rutas sin filtrar

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupRefreshButton();
  setupFilterButtons(); // NUEVO: Configurar filtros P2P
  fetchAndDisplay();
  loadBanksData();
});

// Formateo de números
function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) {
    console.warn('formatNumber recibió valor inválido:', num);
    return '0.00';
  }
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Mostrar indicador de salud del mercado
function displayMarketHealth(health) {
  const container = document.getElementById('marketHealth');
  
  if (!health) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.style.backgroundColor = `${health.color}15`; // 15 = opacity
  container.style.borderColor = `${health.color}40`;
  
  container.innerHTML = `
    <span class="market-icon">${health.icon}</span>
    <div class="market-info">
      <span class="market-status">Mercado: <strong>${health.status}</strong></span>
      <span class="market-message">${health.message}</span>
    </div>
  `;
}

// Navegación entre tabs
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab');
  console.log(`📑 Configurando ${tabs.length} pestañas de navegación`);
  
  tabs.forEach(tab => {

// NUEVO: Configurar botones de filtro P2P
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  console.log(`🔍 Configurando ${filterButtons.length} botones de filtro P2P`);
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      console.log(`🔍 Filtro seleccionado: ${filter}`);
      
      // Actualizar estado activo
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Aplicar filtro
      currentFilter = filter;
      applyP2PFilter();
    });
  });
}

// NUEVO: Determinar si una ruta usa P2P
function isP2PRoute(route) {
  if (!route || !route.broker) return false;
  
  const brokerName = route.broker.toLowerCase();
  // Los brokers P2P terminan en "p2p" o contienen "p2p" en el nombre
  return brokerName.includes('p2p');
}

// NUEVO: Aplicar filtro P2P a las rutas
function applyP2PFilter() {
  if (!allRoutes || allRoutes.length === 0) {
    console.warn('⚠️ No hay rutas disponibles para filtrar');
    return;
  }
  
  console.log(`🔍 Aplicando filtro: ${currentFilter} sobre ${allRoutes.length} rutas`);
  
  // DEBUG: Mostrar clasificación de rutas
  allRoutes.forEach((route, index) => {
    const isP2P = isP2PRoute(route);
    console.log(`📊 Ruta ${index + 1}: ${route.broker || route.sellExchange} - P2P: ${isP2P}`);
  });
  
  let filteredRoutes = [];
  
  switch(currentFilter) {
    case 'all':
      filteredRoutes = [...allRoutes];
      break;
      
    case 'p2p':
      filteredRoutes = allRoutes.filter(route => isP2PRoute(route));
      break;
      
    case 'no-p2p':
      filteredRoutes = allRoutes.filter(route => !isP2PRoute(route));
      break;
      
    default:
      filteredRoutes = [...allRoutes];
  }
  
  console.log(`✅ Rutas filtradas: ${filteredRoutes.length}/${allRoutes.length}`);
  
  // Actualizar contadores en los botones
  updateFilterCounts();
  
  // Mostrar rutas filtradas
  if (currentData) {
    displayOptimizedRoutes(filteredRoutes, currentData.official);
  }
}

// NUEVO: Actualizar contadores de rutas en filtros
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
  
  console.log(`📊 Contadores actualizados - Total: ${allCount}, P2P: ${p2pCount}, No P2P: ${noP2pCount}`);
}

// Navegación entre tabs
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab');
  console.log(`📑 Configurando ${tabs.length} pestañas de navegación`);
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      console.log(`🔄 Cambiando a pestaña: ${tabId}`);
      
      // Remover active de todos
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activar el seleccionado
      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${tabId}`);
      
      if (targetContent) {
        targetContent.classList.add('active');
        console.log(`✅ Pestaña ${tabId} activada correctamente`);
      } else {
        console.error(`❌ No se encontró el contenido para tab-${tabId}`);
      }
      
      // NUEVO v5.0: Si se abre el simulador, aplicar monto default
      if (tabId === 'simulator' && userSettings?.defaultSimAmount) {
        const amountInput = document.getElementById('sim-amount');
        if (amountInput && !amountInput.value) {
          amountInput.value = userSettings.defaultSimAmount;
          console.log(`🔧 Monto default del simulador: $${userSettings.defaultSimAmount.toLocaleString()}`);
        }
      }
    });
  });
}

// Botón de actualizar
function setupRefreshButton() {
  document.getElementById('refresh').addEventListener('click', () => {
    fetchAndDisplay();
    loadBanksData();
  });
  
  // Botón de configuración
  document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Obtener y mostrar datos de arbitraje
async function fetchAndDisplay() {
  const container = document.getElementById('optimized-routes');
  const loading = document.getElementById('loading');
  
  loading.style.display = 'block';
  container.innerHTML = '';
  
  // NUEVO v5.0: Cargar preferencias del usuario
  const settings = await chrome.storage.local.get('notificationSettings');
  userSettings = settings.notificationSettings || {};
  
  chrome.runtime.sendMessage({ action: 'getArbitrages' }, data => {
    loading.style.display = 'none';
    
    console.log('📥 Popup recibió datos:', {
      hasData: !!data,
      optimizedRoutes: data?.optimizedRoutes?.length || 0,
      arbitrages: data?.arbitrages?.length || 0,
      marketHealth: data?.marketHealth?.status,
      error: data?.error,
      userSettings: userSettings
    });
    
    if (!data) {
      container.innerHTML = '<p class="error">❌ No se pudo comunicar con el servicio de fondo.</p>';
      return;
    }
    
    currentData = data;
    updateLastUpdateTimestamp(data.lastUpdate);
    
    // Mostrar indicador de salud del mercado
    displayMarketHealth(data.marketHealth);
    
    if (data.error) {
      const errorClass = data.usingCache ? 'warning' : 'error';
      container.innerHTML = `<p class="${errorClass}">❌ ${data.error}</p>`;
      if (data.usingCache) {
        // NUEVO v5.0: Aplicar preferencias antes de mostrar
        const filteredRoutes = applyUserPreferences(data.optimizedRoutes || []);
        displayOptimizedRoutes(filteredRoutes);
      }
      return;
    }
    
    if (!data.optimizedRoutes || !Array.isArray(data.optimizedRoutes)) {
      console.warn('⚠️ optimizedRoutes no es array:', typeof data.optimizedRoutes);
      container.innerHTML = '<p class="warning">⏳ No hay rutas disponibles. Espera un momento...</p>';
      return;
    }
    
    if (data.optimizedRoutes.length === 0) {
      console.warn('⚠️ optimizedRoutes está vacío');
      container.innerHTML = '<p class="info">📊 No se encontraron rutas rentables en este momento.</p>';
      return;
    }
    
    // NUEVO: Guardar todas las rutas en cache global para filtrado P2P
    allRoutes = data.optimizedRoutes || [];
    console.log(`💾 Guardadas ${allRoutes.length} rutas en cache para filtrado`);
    
    // NUEVO: Actualizar contadores de filtros
    updateFilterCounts();
    
    // NUEVO: Aplicar filtro P2P activo (esto internamente llama a displayOptimizedRoutes)
    applyP2PFilter();
    
    // Poblar selector del simulador (con todas las rutas)
    populateSimulatorRoutes(data.optimizedRoutes);
  });
}

// NUEVA FUNCIÓN v5.0: Aplicar preferencias del usuario
function applyUserPreferences(routes) {
  if (!Array.isArray(routes) || routes.length === 0) {
    return routes;
  }
  
  let filtered = [...routes]; // Copia para no mutar original
  
  // 1. Filtrar rutas negativas si el usuario no quiere verlas
  if (userSettings.showNegativeRoutes === false) {
    filtered = filtered.filter(r => r.profitPercent >= 0);
    console.log(`🔧 Filtradas ${routes.length - filtered.length} rutas negativas`);
  }
  
  // 2. Ordenar priorizando rutas single-exchange si el usuario lo prefiere
  if (userSettings.preferSingleExchange === true) {
    filtered.sort((a, b) => {
      // Primero ordenar por tipo de ruta
      if (a.isSingleExchange !== b.isSingleExchange) {
        return b.isSingleExchange - a.isSingleExchange; // Single primero
      }
      // Luego por rentabilidad
      return b.profitPercent - a.profitPercent;
    });
    console.log('🔧 Rutas ordenadas priorizando mismo broker');
  }
  
  // 3. Limitar cantidad de rutas mostradas
  const maxDisplay = userSettings.maxRoutesDisplay || 20;
  if (filtered.length > maxDisplay) {
    filtered = filtered.slice(0, maxDisplay);
    console.log(`🔧 Limitadas a ${maxDisplay} rutas`);
  }
  
  return filtered;
}

// Mostrar tarjetas de arbitraje
function displayArbitrages(arbitrages, official) {
  const container = document.getElementById('arbitrages');
  let html = '';
  
  arbitrages.forEach((arb, index) => {
    // Determinar si es ganancia o pérdida
    const isNegative = arb.profitPercent < 0;
    const profitClass = isNegative ? 'negative-profit' : (arb.profitPercent > 5 ? 'high-profit' : '');
    const profitBadgeClass = isNegative ? 'negative' : (arb.profitPercent > 5 ? 'high' : '');
    
    // Indicadores especiales
    const lowProfitIndicator = arb.profitPercent >= 0 && arb.profitPercent < 1 ? '<span class="low-profit-tag">👁️ Solo vista</span>' : '';
    const negativeIndicator = isNegative ? '<span class="negative-tag">⚠️ Pérdida</span>' : '';
    
    // Símbolo según ganancia/pérdida
    const profitSymbol = isNegative ? '' : '+';
    
    // Verificar si hay diferencia entre ganancia bruta y neta
    const hasFees = arb.fees && arb.fees.total > 0;
    
    html += `
      <div class="arbitrage-card ${profitClass}" data-index="${index}">
        <div class="card-header">
          <h3>🏦 ${arb.broker}</h3>
          <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${formatNumber(arb.profitPercent)}% ${lowProfitIndicator}${negativeIndicator}</div>
        </div>
        <div class="card-body">
          <div class="price-row">
            <span class="price-label">💵 Dólar Oficial</span>
            <span class="price-value">$${formatNumber(arb.officialPrice)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">� USD → USDT</span>
            <span class="price-value">${formatNumber(arb.usdToUsdtRate)} USD/USDT</span>
          </div>
          <div class="price-row">
            <span class="price-label">💸 USDT → ARS</span>
            <span class="price-value highlight">$${formatNumber(arb.usdtArsBid)}</span>
          </div>
          ${hasFees ? `
          <div class="price-row fees-row">
            <span class="price-label">📊 Comisiones</span>
            <span class="price-value fee-value">${formatNumber(arb.fees.total)}%</span>
          </div>
          <div class="price-row">
            <span class="price-label">✅ Ganancia Neta</span>
            <span class="price-value net-profit">+${formatNumber(arb.profitPercent)}%</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Agregar event listeners a las tarjetas
  document.querySelectorAll('.arbitrage-card').forEach(card => {
    card.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      selectArbitrage(index);
      
      // Remover selección previa
      document.querySelectorAll('.arbitrage-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      
      // Cambiar a la pestaña de guía
      document.querySelector('[data-tab="guide"]').click();
    });
  });
}

// NUEVO v5.0.0: Mostrar rutas (single + multi-exchange) - Vista compacta
function displayOptimizedRoutes(routes, official) {
  const container = document.getElementById('optimized-routes');
  
  if (!routes || routes.length === 0) {
    container.innerHTML = '<p class="info">📊 No hay rutas disponibles en este momento.</p>';
    return;
  }

  let html = '';
  
  routes.forEach((route, index) => {
    const isNegative = route.profitPercent < 0;
    const profitClass = isNegative ? 'negative-profit' : (route.profitPercent > 5 ? 'high-profit' : '');
    const profitBadgeClass = isNegative ? 'negative' : (route.profitPercent > 5 ? 'high' : '');
    
    // Indicadores
    const negativeIndicator = isNegative ? '<span class="negative-tag">⚠️ Pérdida</span>' : '';
    const profitSymbol = isNegative ? '' : '+';
    
    // Badge especial para single-exchange
    const singleExchangeBadge = route.isSingleExchange 
      ? '<span class="single-exchange-badge">🎯 Mismo Broker</span>' 
      : '';
    
    // NUEVO: Badge P2P
    const isP2P = isP2PRoute(route);
    const p2pBadge = isP2P 
      ? '<span class="p2p-badge">🤝 P2P</span>' 
      : '<span class="no-p2p-badge">⚡ Directo</span>';
    
    // Ruta simplificada (comprar → transferir → vender)
    const routeDescription = route.isSingleExchange
      ? `<strong>${route.buyExchange}</strong>`
      : `<strong>${route.buyExchange}</strong> → <strong>${route.sellExchange}</strong>`;
    
    html += `
      <div class="route-card ${profitClass} ${isP2P ? 'is-p2p' : 'is-direct'}" data-index="${index}">
        <div class="route-header">
          <div class="route-title">
            <h3>${route.isSingleExchange ? '🎯' : '🔀'} Ruta ${index + 1}</h3>
            <div class="route-badges">
              ${singleExchangeBadge}
              ${p2pBadge}
            </div>
            <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${formatNumber(route.profitPercent)}% ${negativeIndicator}</div>
          </div>
        </div>
        
        <div class="route-compact">
          <div class="route-summary-line">
            <span class="route-exchanges">🏦 ${routeDescription}</span>
          </div>
          <div class="route-profit-line">
            <span class="profit-amount">${profitSymbol}$${formatNumber(Math.abs(route.calculation.netProfit))} ARS</span>
            <span class="investment-info">sobre $${formatNumber(route.calculation.initial)} ARS</span>
          </div>
          <div class="route-action">
            <span class="click-to-expand">👆 Click para ver guía paso a paso</span>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Agregar event listeners a las tarjetas - Click va directo a la guía
  const routeCards = document.querySelectorAll('.route-card');
  console.log(`🎯 Agregando event listeners a ${routeCards.length} tarjetas de ruta`);
  
  routeCards.forEach((card, idx) => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const index = parseInt(this.dataset.index);
      console.log(`🖱️ Click en tarjeta ${idx}, index: ${index}`);
      
      // Remover selección previa
      document.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      console.log(`✅ Tarjeta ${index} marcada como seleccionada`);
      
      // Mostrar guía paso a paso
      showRouteGuide(index);
    });
  });
  
  console.log(`✅ Event listeners agregados a ${routeCards.length} tarjetas`);
}

// NUEVA FUNCIÓN v5.0.5: Mostrar guía de una ruta optimizada
function showRouteGuide(index) {
  if (!currentData?.optimizedRoutes?.[index]) {
    console.warn('No hay ruta disponible para el índice:', index);
    return;
  }
  
  const route = currentData.optimizedRoutes[index];
  console.log('📖 Mostrando guía para ruta completa:', route);
  console.log('📊 Datos de la ruta:', {
    buyExchange: route.buyExchange,
    sellExchange: route.sellExchange,
    profitPercent: route.profitPercent,
    profitPercentage: route.profitPercentage,
    calculation: route.calculation
  });
  
  // Convertir ruta a formato de arbitraje para la guía
  const arbitrage = {
    broker: route.isSingleExchange ? route.buyExchange : `${route.buyExchange} → ${route.sellExchange}`,
    buyExchange: route.buyExchange || 'N/A',
    sellExchange: route.sellExchange || route.buyExchange || 'N/A',
    isSingleExchange: route.isSingleExchange || false,
    profitPercent: route.profitPercent || route.profitPercentage || 0,
    officialPrice: route.officialPrice || 0,
    usdToUsdtRate: route.usdToUsdtRate || 1,
    usdtArsBid: route.usdtArsBid || 0,
    sellPrice: route.usdtArsBid || 0,
    transferFeeUSD: route.transferFeeUSD || 0,
    calculation: route.calculation || {},
    fees: route.fees || { trading: 0, withdrawal: 0 }
  };
  
  console.log('🔄 Arbitrage convertido:', arbitrage);
  
  selectedArbitrage = arbitrage;
  displayStepByStepGuide(arbitrage);
  
  // Cambiar a la pestaña de guía
  const guideTab = document.querySelector('[data-tab="guide"]');
  if (guideTab) {
    console.log('✅ Cambiando a pestaña de guía');
    guideTab.click();
  } else {
    console.error('❌ No se encontró el botón de la pestaña guía');
  }
}

// Seleccionar un arbitraje y mostrar guía
function selectArbitrage(index) {
  if (!currentData?.arbitrages?.[index]) {
    return;
  }
  
  selectedArbitrage = currentData.arbitrages[index];
  displayStepByStepGuide(selectedArbitrage);
}

// Mostrar guía paso a paso
function displayStepByStepGuide(arb) {
  console.log('📝 Generando guía paso a paso para:', arb);
  
  const container = document.getElementById('selected-arbitrage-guide');
  if (!container) {
    console.error('❌ No se encontró el contenedor selected-arbitrage-guide');
    return;
  }
  
  console.log('✅ Contenedor de guía encontrado');
  
  // Validar datos mínimos necesarios
  if (!arb.broker) {
    console.error('❌ Datos incompletos del arbitraje:', arb);
    container.innerHTML = '<p class="error">❌ Error: Datos incompletos del arbitraje</p>';
    return;
  }
  
  // Usar cálculos reales del backend si están disponibles
  const calc = arb.calculation || {};
  const estimatedInvestment = calc.initial || 100000;
  const officialPrice = arb.officialPrice || 1000;
  const usdAmount = calc.usdPurchased || (estimatedInvestment / officialPrice);
  const usdtAfterFees = calc.usdtAfterFees || usdAmount;
  const sellPrice = arb.sellPrice || arb.usdtArsBid || 1000;
  const arsFromSale = calc.arsFromSale || (usdtAfterFees * sellPrice);
  const finalAmount = calc.finalAmount || arsFromSale;
  const profit = calc.netProfit || (finalAmount - estimatedInvestment);
  const profitPercent = arb.profitPercent || 0;
  const usdToUsdtRate = arb.usdToUsdtRate || 1;
  const usdtArsBid = arb.usdtArsBid || sellPrice;
  const fees = arb.fees || { trading: 0, withdrawal: 0, total: 0 };
  const broker = arb.broker || 'Exchange';
  
  console.log('📊 Valores calculados para la guía:', {
    estimatedInvestment,
    officialPrice,
    usdAmount,
    sellPrice,
    finalAmount,
    profit,
    profitPercent,
    usdToUsdtRate,
    usdtArsBid,
    fees,
    broker
  });
  
  const html = `
    <div class="step-container">
      <!-- Header mejorado con información del broker -->
      <div class="arbitrage-summary-enhanced">
        <div class="broker-badge">
          <div class="broker-icon">🏦</div>
          <div class="broker-info">
            <h3>${broker}</h3>
            <span class="broker-tag">Ruta seleccionada</span>
          </div>
        </div>
        <div class="profit-display-enhanced">
          <div class="profit-percentage">+${formatNumber(profitPercent)}%</div>
          <div class="profit-label">Ganancia neta</div>
        </div>
      </div>

      <!-- Barra de progreso -->
      <div class="progress-bar-container">
        <div class="progress-step active" data-step="1">
          <div class="progress-dot"></div>
          <span>Compra USD</span>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step" data-step="2">
          <div class="progress-dot"></div>
          <span>USD → USDT</span>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step" data-step="3">
          <div class="progress-dot"></div>
          <span>USDT → ARS</span>
        </div>
        <div class="progress-line"></div>
        <div class="progress-step" data-step="4">
          <div class="progress-dot"></div>
          <span>Retiro</span>
        </div>
      </div>
      
      <!-- Timeline de pasos -->
      <div class="steps-timeline">
        <div class="step-item" data-step="1">
          <div class="step-timeline-connector"></div>
          <div class="step-icon-wrapper">
            <div class="step-icon">💵</div>
            <div class="step-number-badge">1</div>
          </div>
          <div class="step-content-card">
            <div class="step-header-enhanced">
              <h4>Comprar Dólares Oficiales</h4>
              <div class="step-status">Paso inicial</div>
            </div>
            <p class="step-description">Compra dólares al tipo de cambio oficial en tu banco habilitado.</p>
            <div class="step-details-grid">
              <div class="detail-item">
                <span class="detail-icon">💰</span>
                <div class="detail-content">
                  <span class="detail-label">Precio oficial</span>
                  <span class="detail-value highlight">$${formatNumber(officialPrice)}</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🏦</span>
                <div class="detail-content">
                  <span class="detail-label">Dónde comprar</span>
                  <span class="detail-value">Bancos autorizados</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">📊</span>
                <div class="detail-content">
                  <span class="detail-label">Límite mensual</span>
                  <span class="detail-value">USD 200</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">📋</span>
                <div class="detail-content">
                  <span class="detail-label">Requisitos</span>
                  <span class="detail-value">CBU + CUIT/CUIL</span>
                </div>
              </div>
            </div>
            <div class="step-action">
              <a href="#" data-action="show-banks" class="action-link">
                <span>Ver bancos disponibles</span>
                <span class="arrow">→</span>
              </a>
            </div>
          </div>
          <a href="#" class="platform-link" data-action="show-banks">
            🏦 Ver bancos disponibles
          </a>
        </div>
      </div>
      
        <div class="step-item" data-step="2">
          <div class="step-timeline-connector"></div>
          <div class="step-icon-wrapper">
            <div class="step-icon">🔄</div>
            <div class="step-number-badge">2</div>
          </div>
          <div class="step-content-card">
            <div class="step-header-enhanced">
              <h4>Depositar USD y Comprar USDT</h4>
              <div class="step-status">En ${broker}</div>
            </div>
            <p class="step-description">Deposita tus USD en ${broker} y cómpralos por USDT.</p>
            <div class="step-details-grid">
              <div class="detail-item">
                <span class="detail-icon">🏢</span>
                <div class="detail-content">
                  <span class="detail-label">Exchange</span>
                  <span class="detail-value">${broker}</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">⚖️</span>
                <div class="detail-content">
                  <span class="detail-label">Ratio conversión</span>
                  <span class="detail-value">${formatNumber(usdToUsdtRate)} USD/USDT</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">💵</span>
                <div class="detail-content">
                  <span class="detail-label">Precio USDT</span>
                  <span class="detail-value highlight">$${formatNumber(usdtArsBid)}</span>
                </div>
              </div>
              ${fees.trading > 0 ? `
              <div class="detail-item">
                <span class="detail-icon">💳</span>
                <div class="detail-content">
                  <span class="detail-label">Comisión trading</span>
                  <span class="detail-value fee">${formatNumber(fees.trading)}%</span>
                </div>
              </div>
              ` : ''}
            </div>
            <div class="step-warning">
              <span class="warning-icon">⚠️</span>
              <span>El exchange cobra ~${formatNumber((usdToUsdtRate - 1) * 100)}% para convertir USD a USDT</span>
            </div>
          </div>
        </div>
      
        <div class="step-item" data-step="3">
          <div class="step-timeline-connector"></div>
          <div class="step-icon-wrapper">
            <div class="step-icon">💸</div>
            <div class="step-number-badge">3</div>
          </div>
          <div class="step-content-card">
            <div class="step-header-enhanced">
              <h4>Vender USDT por Pesos</h4>
              <div class="step-status step-status-success">Ganancia aquí</div>
            </div>
            <p class="step-description">Vende tus USDT en ${broker} por pesos argentinos (ARS).</p>
            <div class="step-details-grid">
              <div class="detail-item">
                <span class="detail-icon">🎯</span>
                <div class="detail-content">
                  <span class="detail-label">Precio de venta</span>
                  <span class="detail-value highlight">$${formatNumber(usdtArsBid)}</span>
                </div>
              </div>
              ${fees.trading > 0 ? `
              <div class="detail-item">
                <span class="detail-icon">💳</span>
                <div class="detail-content">
                  <span class="detail-label">Comisión venta</span>
                  <span class="detail-value fee">${formatNumber(fees.trading)}%</span>
                </div>
              </div>
              ` : ''}
              <div class="detail-item">
                <span class="detail-icon">🔒</span>
                <div class="detail-content">
                  <span class="detail-label">Método</span>
                  <span class="detail-value">Venta directa (NO P2P)</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🏦</span>
                <div class="detail-content">
                  <span class="detail-label">Retiro</span>
                  <span class="detail-value">Transferencia bancaria</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <div class="step-item" data-step="4">
          <div class="step-timeline-connector last"></div>
          <div class="step-icon-wrapper">
            <div class="step-icon">✅</div>
            <div class="step-number-badge">4</div>
          </div>
          <div class="step-content-card">
            <div class="step-header-enhanced">
              <h4>Retirar Ganancias</h4>
              <div class="step-status step-status-final">Paso final</div>
            </div>
            <p class="step-description">Retira tus pesos a tu cuenta bancaria.</p>
            <div class="step-details-grid">
              <div class="detail-item">
                <span class="detail-icon">🏦</span>
                <div class="detail-content">
                  <span class="detail-label">Método</span>
                  <span class="detail-value">Transferencia bancaria</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">⏱️</span>
                <div class="detail-content">
                  <span class="detail-label">Tiempo estimado</span>
                  <span class="detail-value">24-48 horas hábiles</span>
                </div>
              </div>
              ${fees.withdrawal > 0 ? `
              <div class="detail-item">
                <span class="detail-icon">💳</span>
                <div class="detail-content">
                  <span class="detail-label">Comisión retiro</span>
                  <span class="detail-value fee">${formatNumber(fees.withdrawal)}%</span>
                </div>
              </div>
              ` : ''}
              <div class="detail-item">
                <span class="detail-icon">📊</span>
                <div class="detail-content">
                  <span class="detail-label">Total comisiones</span>
                  <span class="detail-value fee-total">${fees.total > 0 ? formatNumber(fees.total) : '~2-3'}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Calculadora mejorada -->\n      <div class="calculation-box-enhanced">
        <div class="calculation-header">
          <span class="calculation-icon">💰</span>
          <h4>Simulación con $${formatNumber(estimatedInvestment)} ARS</h4>
        </div>
        
        <div class="calculation-flow">
          <div class="calc-step">
            <div class="calc-step-number">1</div>
            <div class="calc-step-content">
              <span class="calc-label">Inversión inicial</span>
              <span class="calc-value initial">$${formatNumber(estimatedInvestment)} ARS</span>
            </div>
          </div>
          
          <div class="calc-arrow">↓</div>
          
          <div class="calc-step">
            <div class="calc-step-number">2</div>
            <div class="calc-step-content">
              <span class="calc-label">Compras USD oficial</span>
              <span class="calc-value">$${formatNumber(usdAmount)} USD</span>
            </div>
          </div>
          
          <div class="calc-arrow">↓</div>
          
          <div class="calc-step">
            <div class="calc-step-number">3</div>
            <div class="calc-step-content">
              <span class="calc-label">Compras USDT (${formatNumber(usdToUsdtRate)} USD/USDT)</span>
              <span class="calc-value">${formatNumber(calc.usdtPurchased || usdAmount / usdToUsdtRate)} USDT</span>
              ${fees.trading > 0 ? `<span class="calc-fee">Después fee: ${formatNumber(usdtAfterFees)} USDT</span>` : ''}
            </div>
          </div>
          
          <div class="calc-arrow">↓</div>
          
          <div class="calc-step">
            <div class="calc-step-number">4</div>
            <div class="calc-step-content">
              <span class="calc-label">Vendes USDT por ARS ($${formatNumber(usdtArsBid)})</span>
              <span class="calc-value">$${formatNumber(arsFromSale)} ARS</span>
            </div>
          </div>
          
          ${fees.total > 0 ? `
          <div class="calc-fees-summary">
            <span class="fees-icon">📊</span>
            <span class="fees-text">Total comisiones (${formatNumber(fees.total)}%)</span>
            <span class="fees-value">-$${formatNumber(arsFromSale - finalAmount)} ARS</span>
          </div>
          ` : ''}
          
          <div class="calc-arrow final">↓</div>
          
          <div class="calc-step final">
            <div class="calc-step-number">5</div>
            <div class="calc-step-content">
              <span class="calc-label">Retiras a tu cuenta</span>
              <span class="calc-value final">$${formatNumber(finalAmount)} ARS</span>
            </div>
          </div>
        </div>
        
        <div class="calculation-result">
          <div class="result-icon">✅</div>
          <div class="result-content">
            <span class="result-label">Ganancia neta</span>
            <span class="result-value">$${formatNumber(profit)} ARS</span>
            <span class="result-percentage">+${formatNumber(profitPercent)}%</span>
          </div>
        </div>
        
        ${arb.grossProfitPercent ? `
        <div class="calculation-note-enhanced">
          <span class="note-icon">💡</span>
          <span>Ganancia bruta sin comisiones: ${formatNumber(arb.grossProfitPercent)}%</span>
        </div>
        ` : ''}
      </div>
      
      <!-- Consideraciones importantes mejoradas -->
      <div class="important-considerations">
        <div class="considerations-header">
          <span class="considerations-icon">⚠️</span>
          <h4>Consideraciones importantes</h4>
        </div>
        <div class="considerations-list">
          <div class="consideration-item">
            <span class="item-icon">💳</span>
            <div class="item-content">
              <strong>Comisiones incluidas:</strong>
              <span>El cálculo ya considera fees de trading y retiro</span>
            </div>
          </div>
          <div class="consideration-item">
            <span class="item-icon">📊</span>
            <div class="item-content">
              <strong>Comisiones variables:</strong>
              <span>Según el exchange (${fees.total > 0 ? formatNumber(fees.total) : '~2-3'}% total)</span>
            </div>
          </div>
          <div class="consideration-item">
            <span class="item-icon">📈</span>
            <div class="item-content">
              <strong>Precios fluctuantes:</strong>
              <span>Verifica antes de operar - los valores cambian constantemente</span>
            </div>
          </div>
          <div class="consideration-item">
            <span class="item-icon">💰</span>
            <div class="item-content">
              <strong>Límite mensual:</strong>
              <span>USD 200 por persona según BCRA</span>
            </div>
          </div>
          <div class="consideration-item">
            <span class="item-icon">⏱️</span>
            <div class="item-content">
              <strong>Tiempos de espera:</strong>
              <span>Transferencias bancarias: 24-48 horas hábiles</span>
            </div>
          </div>
          <div class="consideration-item">
            <span class="item-icon">⚡</span>
            <div class="item-content">
              <strong>Fees adicionales:</strong>
              <span>Algunos exchanges cobran por depósito USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Activar animaciones de progreso al hacer scroll
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('active');
          }, index * 100);
        }
      });
    }, { threshold: 0.5 });
    
    const stepItems = container.querySelectorAll('.step-item');
    stepItems.forEach((step) => observer.observe(step));
  }, 100);
  
  // Agregar event listener al link de bancos (sin onclick inline)
  const bankLink = container.querySelector('[data-action="show-banks"]');
  if (bankLink) {
    bankLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('[data-tab="banks"]').click();
    });
  }
}

// Cargar datos de bancos
function loadBanksData() {
  const container = document.getElementById('banks-list');
  
  chrome.runtime.sendMessage({ action: 'getBanks' }, data => {
    if (!data?.banks || data.banks.length === 0) {
      container.innerHTML = '<p class="info">📋 Información de bancos no disponible en este momento.</p>';
      return;
    }
    
    displayBanks(data.banks);
  });
}

// Mostrar lista de bancos
function displayBanks(banks) {
  const container = document.getElementById('banks-list');
  let html = '';
  
  banks.forEach(bank => {
    // Usar logo si está disponible, sino usar emoji
    const logoHtml = bank.logo ? 
      `<img src="${bank.logo}" alt="${bank.name}" class="bank-logo" onerror="this.style.display='none'">` : 
      '🏦';
    
    // Mostrar spread si está disponible
    const spreadHtml = bank.spread ? 
      `<div class="bank-spread">Spread: $${bank.spread}</div>` : '';
    
    // Mostrar fuente si está disponible
    const sourceHtml = bank.source ? 
      `<div class="bank-source">Fuente: ${bank.source}</div>` : '';
    
    html += `
      <div class="bank-card">
        <div class="bank-header">
          <div class="bank-logo-container">${logoHtml}</div>
          <div class="bank-name">${bank.name}</div>
          ${spreadHtml}
        </div>
        <div class="bank-prices">
          <div class="bank-price">
            <div class="bank-price-label">Compra</div>
            <div class="bank-price-value">$${formatNumber(bank.compra)}</div>
          </div>
          <div class="bank-price">
            <div class="bank-price-label">Venta</div>
            <div class="bank-price-value">$${formatNumber(bank.venta)}</div>
          </div>
        </div>
        ${sourceHtml}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Actualizar timestamp
function updateLastUpdateTimestamp(timestamp) {
  const container = document.getElementById('last-update');
  if (timestamp) {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('es-AR');
    container.textContent = `⏰ Última actualización: ${timeStr}`;
  }
}

// NUEVO v5.0.0: Simulador con monto personalizado
function populateSimulatorRoutes(routes) {
  const select = document.getElementById('sim-route');
  if (!routes || routes.length === 0) {
    select.innerHTML = '<option value="">-- No hay rutas disponibles --</option>';
    return;
  }
  
  let options = '<option value="">-- Selecciona una ruta --</option>';
  routes.forEach((route, index) => {
    const badge = route.isSingleExchange ? '🎯' : '🔀';
    const profitSymbol = route.profitPercent >= 0 ? '+' : '';
    options += `<option value="${index}">${badge} Ruta ${index + 1}: ${profitSymbol}${route.profitPercent.toFixed(2)}% (${route.buyExchange} → ${route.sellExchange})</option>`;
  });
  
  select.innerHTML = options;
  
  // Setup event listeners
  document.getElementById('sim-calculate').addEventListener('click', calculateSimulation);
}

function calculateSimulation() {
  const amountInput = document.getElementById('sim-amount');
  const routeSelect = document.getElementById('sim-route');
  const resultsDiv = document.getElementById('sim-results');
  
  const amount = parseFloat(amountInput.value);
  const routeIndex = parseInt(routeSelect.value);
  
  if (!amount || amount < 1000) {
    alert('⚠️ Ingresa un monto válido (mínimo $1,000 ARS)');
    return;
  }
  
  if (isNaN(routeIndex) || !currentData || !currentData.optimizedRoutes[routeIndex]) {
    alert('⚠️ Selecciona una ruta válida');
    return;
  }
  
  const route = currentData.optimizedRoutes[routeIndex];
  
  // Calcular paso a paso
  const step1_usd = amount / route.officialPrice;
  const step2_usdt = step1_usd / route.usdToUsdtRate;
  
  // Aplicar fees de compra
  const buyFees = 0.01; // 1% promedio
  const step2_usdtAfterFee = step2_usdt * (1 - buyFees);
  
  // Transfer fee
  const transferFeeUSDT = route.transferFeeUSD / route.usdToUsdtRate;
  const step3_usdtAfterTransfer = step2_usdtAfterFee - transferFeeUSDT;
  
  // Vender USDT
  const step4_ars = step3_usdtAfterTransfer * route.usdtArsBid;
  
  // Apply sell fees
  const sellFees = 0.01; // 1% promedio
  const finalAmount = step4_ars * (1 - sellFees);
  
  // Calcular ganancia
  const profit = finalAmount - amount;
  const profitPercent = (profit / amount) * 100;
  
  // Mostrar resultados
  const isNegative = profit < 0;
  const profitClass = isNegative ? 'negative' : 'positive';
  const profitEmoji = isNegative ? '📉' : '📈';
  
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = `
    <div class="sim-result-card ${profitClass}">
      <h3>${profitEmoji} Resultado de Simulación</h3>
      
      <div class="sim-breakdown">
        <div class="sim-row">
          <span>1️⃣ Inversión inicial:</span>
          <strong>$${formatNumber(amount)} ARS</strong>
        </div>
        <div class="sim-row">
          <span>2️⃣ USD comprados (oficial):</span>
          <strong>${formatNumber(step1_usd)} USD</strong>
        </div>
        <div class="sim-row">
          <span>3️⃣ USDT comprados en ${route.buyExchange}:</span>
          <strong>${formatNumber(step2_usdt)} USDT</strong>
        </div>
        <div class="sim-row">
          <span>4️⃣ Después de fees de compra:</span>
          <strong>${formatNumber(step2_usdtAfterFee)} USDT</strong>
        </div>
        ${!route.isSingleExchange ? `
        <div class="sim-row warning">
          <span>⚠️ Fee de transferencia:</span>
          <strong>-${formatNumber(transferFeeUSDT)} USDT</strong>
        </div>
        <div class="sim-row">
          <span>5️⃣ USDT después de transfer:</span>
          <strong>${formatNumber(step3_usdtAfterTransfer)} USDT</strong>
        </div>
        ` : ''}
        <div class="sim-row">
          <span>6️⃣ ARS de venta en ${route.sellExchange}:</span>
          <strong>$${formatNumber(step4_ars)} ARS</strong>
        </div>
        <div class="sim-row">
          <span>7️⃣ Después de fees de venta:</span>
          <strong>$${formatNumber(finalAmount)} ARS</strong>
        </div>
      </div>
      
      <div class="sim-final">
        <div class="sim-profit ${profitClass}">
          <span>Ganancia/Pérdida:</span>
          <strong>${profit >= 0 ? '+' : ''}$${formatNumber(profit)} ARS (${profitPercent.toFixed(2)}%)</strong>
        </div>
      </div>
      
      <div class="sim-note">
        <small>⚠️ Los fees reales pueden variar según el exchange. Esta es una estimación aproximada.</small>
      </div>
    </div>
  `;
}
