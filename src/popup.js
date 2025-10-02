// Estado global
let currentData = null;
let selectedArbitrage = null;
let userSettings = null; // NUEVO v5.0: Configuración del usuario
let currentFilter = 'no-p2p'; // NUEVO: Filtro P2P activo ('all', 'p2p', 'no-p2p') - Por defecto Sin P2P
let allRoutes = []; // NUEVO: Cache de todas las rutas sin filtrar

console.log('🚀 Popup.js cargado correctamente');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  log('📄 DOM Content Loaded - Iniciando setup...');
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

// NUEVO: Configurar botones de filtro P2P
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Actualizar estado activo
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Aplicar filtro
      currentFilter = filter;
      applyP2PFilter();
    });
  });

  // NUEVO: Marcar el filtro por defecto como activo visualmente
  const defaultButton = document.querySelector(`[data-filter="${currentFilter}"]`);
  if (defaultButton) {
    defaultButton.classList.add('active');
  }
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
  
  // Contar rutas P2P vs no-P2P sin logs individuales
  const p2pCount = allRoutes.filter(route => isP2PRoute(route)).length;
  const nonP2pCount = allRoutes.length - p2pCount;
  
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
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      // Remover active de todos
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activar el seleccionado
      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${tabId}`);
      
      if (targetContent) {
        targetContent.classList.add('active');
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
  console.log('🔄 Cargando datos de arbitraje...');
  
  const container = document.getElementById('optimized-routes');
  const loading = document.getElementById('loading');
  
  loading.style.display = 'block';
  container.innerHTML = '';
  
  // NUEVO v5.0: Cargar preferencias del usuario
  const settings = await chrome.storage.local.get('notificationSettings');
  userSettings = settings.notificationSettings || {};
  
  try {
    console.log('📤 Solicitando datos al background...');
    chrome.runtime.sendMessage({ action: 'getArbitrages' }, data => {
      console.log('📥 Datos recibidos del background');
      
      loading.style.display = 'none';
      
      if (!data) {
        console.error('❌ Error: No se recibió respuesta del background');
        container.innerHTML = '<p class="error">❌ No se pudo comunicar con el servicio de fondo.</p>';
        return;
      }
    
    currentData = data;
    updateLastUpdateTimestamp(data.lastUpdate);
    
    // Mostrar indicador de salud del mercado
    displayMarketHealth(data.marketHealth);
    
    // NUEVO: Mostrar indicador si son datos cacheados
    if (data.usingCache) {
      const cacheIndicator = document.getElementById('cache-indicator');
      if (cacheIndicator) {
        cacheIndicator.style.display = 'block';
        cacheIndicator.textContent = data.error ? `⚠️ ${data.error}` : '📱 Datos cacheados';
        
        // Si hay error en cache, intentar actualizar automáticamente
        if (data.error) {
          setTimeout(() => {
            console.log('🔄 Intentando actualizar datos automáticamente...');
            fetchAndDisplay();
          }, 2000); // Esperar 2 segundos antes de intentar actualizar
        }
      }
    } else {
      // Ocultar indicador si no son datos cacheados
      const cacheIndicator = document.getElementById('cache-indicator');
      if (cacheIndicator) {
        cacheIndicator.style.display = 'none';
      }
    }
    
    if (data.error && !data.usingCache) {
      const errorClass = data.usingCache ? 'warning' : 'error';
      setSafeHTML(container, `<p class="${errorClass}">❌ ${sanitizeHTML(data.error)}</p>`);
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
    
    // NUEVO: Actualizar contadores de filtros
    updateFilterCounts();
    
    // NUEVO: Aplicar filtro P2P activo (esto internamente llama a displayOptimizedRoutes)
    applyP2PFilter();
    
    // Poblar selector del simulador (con todas las rutas)
    populateSimulatorRoutes(data.optimizedRoutes);
    });
  } catch (error) {
    console.error('❌ Error en fetchAndDisplay:', error);
    loading.style.display = 'none';
    container.innerHTML = '<p class="error">❌ Error interno: ' + sanitizeHTML(error.message) + '</p>';
  }
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
  
  routeCards.forEach((card, idx) => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const index = parseInt(this.dataset.index);
      
      // Remover selección previa
      document.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      
      // Mostrar guía paso a paso
      showRouteGuide(index);
    });
  });
}

// NUEVA FUNCIÓN v5.0.5: Mostrar guía de una ruta optimizada
function showRouteGuide(index) {
  if (!currentData?.optimizedRoutes?.[index]) {
    console.warn('No hay ruta disponible para el índice:', index);
    return;
  }
  
  const route = currentData.optimizedRoutes[index];
  
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

// Sistema de logging condicional para desarrollo
const DEBUG_MODE = true; // Cambiar a false en producción
function log(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// Función para crear elementos HTML de manera segura
function createSafeElement(tag, content, className = '') {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
}

// Función para sanitizar HTML (previene XSS)
function sanitizeHTML(text) {
  if (typeof text !== 'string') {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Función para actualizar innerHTML de manera segura
function setSafeHTML(element, html) {
  if (typeof html !== 'string') {
    log('⚠️ setSafeHTML recibió contenido no string:', html);
    element.innerHTML = '';
    return;
  }
  element.innerHTML = html;
}

// Calcular valores para la guía paso a paso
function calculateGuideValues(arb) {
  const calc = arb.calculation || {};
  return {
    estimatedInvestment: calc.initial || 100000,
    officialPrice: arb.officialPrice || 1000,
    usdAmount: calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000)),
    usdtAfterFees: calc.usdtAfterFees || (calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))),
    sellPrice: arb.sellPrice || arb.usdtArsBid || 1000,
    arsFromSale: calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000)),
    finalAmount: calc.finalAmount || (calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000))),
    profit: calc.netProfit || ((calc.finalAmount || calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000))) - (calc.initial || 100000)),
    profitPercent: arb.profitPercent || 0,
    usdToUsdtRate: arb.usdToUsdtRate || 1,
    usdtArsBid: arb.usdtArsBid || (arb.sellPrice || 1000),
    fees: arb.fees || { trading: 0, withdrawal: 0, total: 0 },
    broker: arb.broker || 'Exchange'
  };
}

// Generar HTML del header de la guía
function generateGuideHeader(broker, profitPercent) {
  const isProfitable = profitPercent >= 0;
  return `
    <div class="guide-header-simple">
      <div class="guide-title">
        <h3>📋 Cómo hacer el arbitraje en <span class="broker-name">${sanitizeHTML(broker)}</span></h3>
      </div>
      <div class="profit-badge ${isProfitable ? 'profit-positive' : 'profit-negative'}">
        <span class="profit-icon">${isProfitable ? '📈' : '📉'}</span>
        <span class="profit-text">
          ${isProfitable ? 'Ganancia' : 'Pérdida'}: 
          <strong>${isProfitable ? '+' : ''}${formatNumber(profitPercent)}%</strong>
        </span>
      </div>
    </div>
  `;
}

// Generar HTML de los pasos de la guía (SIMPLIFICADO)
function generateGuideSteps(values) {
  const { estimatedInvestment, officialPrice, usdAmount, usdToUsdtRate, usdtAfterFees, usdtArsBid, arsFromSale, finalAmount, profit, profitPercent, fees, broker } = values;

  return `
    <div class="steps-simple">
      <!-- Paso 1: Comprar USD -->
      <div class="step-simple" data-step="1">
        <div class="step-number">1</div>
        <div class="step-simple-content">
          <h4>💵 Comprar Dólares Oficiales</h4>
          <p class="step-simple-text">Ve a tu banco y compra USD al precio oficial</p>
          <div class="step-simple-calc">
            <span class="calc-label">Precio:</span>
            <span class="calc-value">$${formatNumber(officialPrice)}/USD</span>
            <span class="calc-arrow">→</span>
            <span class="calc-result">Obtienes ${formatNumber(usdAmount)} USD</span>
          </div>
          <div class="step-simple-note">
            💡 Límite mensual: USD 200 por persona
          </div>
        </div>
      </div>

      <!-- Paso 2: USD → USDT -->
      <div class="step-simple" data-step="2">
        <div class="step-number">2</div>
        <div class="step-simple-content">
          <h4>🔄 Convertir USD a USDT</h4>
          <p class="step-simple-text">Deposita tus USD en <strong>${sanitizeHTML(broker)}</strong> y cómpralos por USDT</p>
          <div class="step-simple-calc">
            <span class="calc-label">Tasa:</span>
            <span class="calc-value">${formatNumber(usdToUsdtRate)} USD = 1 USDT</span>
            <span class="calc-arrow">→</span>
            <span class="calc-result">${formatNumber(usdtAfterFees)} USDT</span>
          </div>
          ${usdToUsdtRate > 1.01 ? `
          <div class="step-simple-warning">
            ⚠️ El exchange cobra ${formatNumber((usdToUsdtRate - 1) * 100)}% para esta conversión
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Paso 3: USDT → ARS -->
      <div class="step-simple" data-step="3">
        <div class="step-number">3</div>
        <div class="step-simple-content">
          <h4>💸 Vender USDT por Pesos</h4>
          <p class="step-simple-text">Vende tus USDT en <strong>${sanitizeHTML(broker)}</strong> y recibe pesos</p>
          <div class="step-simple-calc highlight-profit">
            <span class="calc-label">Precio:</span>
            <span class="calc-value big">$${formatNumber(usdtArsBid)}/USDT</span>
            <span class="calc-arrow">→</span>
            <span class="calc-result big">$${formatNumber(arsFromSale)}</span>
          </div>
          <div class="step-simple-success">
            ✅ Aquí está la ganancia: diferencia entre dólar oficial y USDT
          </div>
        </div>
      </div>

      <!-- Paso 4: Retirar -->
      <div class="step-simple" data-step="4">
        <div class="step-number">4</div>
        <div class="step-simple-content">
          <h4>🏦 Retirar a tu Banco</h4>
          <p class="step-simple-text">Transfiere los pesos a tu cuenta bancaria</p>
          <div class="step-simple-calc final">
            <span class="calc-label">Después de comisiones:</span>
            <span class="calc-result final-amount">$${formatNumber(finalAmount)}</span>
          </div>
          <div class="profit-summary ${profit >= 0 ? 'positive' : 'negative'}">
            <div class="profit-main">
              <span class="profit-icon">${profit >= 0 ? '📈' : '📉'}</span>
              <span class="profit-amount">${profit >= 0 ? '+' : ''}$${formatNumber(profit)}</span>
              <span class="profit-percent">(${profit >= 0 ? '+' : ''}${formatNumber(profitPercent)}%)</span>
            </div>
            <div class="profit-subtitle">
              ${profit >= 0 ? 'Ganancia neta' : 'Pérdida neta'}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen Rápido -->
    <div class="quick-summary">
      <h4>📊 Resumen Rápido</h4>
      <div class="summary-flow">
        <div class="summary-item">
          <span class="summary-label">Inversión</span>
          <span class="summary-value">$${formatNumber(estimatedInvestment)}</span>
        </div>
        <span class="summary-arrow">→</span>
        <div class="summary-item">
          <span class="summary-label">USD Oficial</span>
          <span class="summary-value">${formatNumber(usdAmount)} USD</span>
        </div>
        <span class="summary-arrow">→</span>
        <div class="summary-item">
          <span class="summary-label">USDT</span>
          <span class="summary-value">${formatNumber(usdtAfterFees)} USDT</span>
        </div>
        <span class="summary-arrow">→</span>
        <div class="summary-item highlight">
          <span class="summary-label">Resultado</span>
          <span class="summary-value big">$${formatNumber(finalAmount)}</span>
        </div>
      </div>
    </div>
  `;
}

/* FUNCIONES ANTIGUAS COMENTADAS - Calculadora y Consideraciones detalladas
// Generar HTML de la calculadora
function generateCalculatorHTML(values) {
  // ... código comentado ...
}

// Generar HTML de consideraciones importantes
function generateConsiderationsHTML(fees) {
  // ... código comentado ...
}
*/

// Configurar animaciones y event listeners para la guía
function setupGuideAnimations(container) {
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

// Función principal refactorizada para mostrar guía paso a paso
function displayStepByStepGuide(arb) {
  log('📝 Generando guía paso a paso para:', arb);

  const container = document.getElementById('selected-arbitrage-guide');
  if (!container) {
    log('❌ No se encontró el contenedor selected-arbitrage-guide');
    return;
  }

  log('✅ Contenedor de guía encontrado');

  // Validar datos mínimos necesarios
  if (!arb.broker) {
    log('❌ Datos incompletos del arbitraje:', arb);
    container.innerHTML = '<p class="error">❌ Error: Datos incompletos del arbitraje</p>';
    return;
  }

  // Calcular valores usando función auxiliar
  const values = calculateGuideValues(arb);
  log('📊 Valores calculados para la guía:', values);

  // Generar HTML completo usando funciones auxiliares (SIMPLIFICADO)
  const html = `
    <div class="guide-container-simple">
      ${generateGuideHeader(values.broker, values.profitPercent)}
      ${generateGuideSteps(values)}
    </div>
  `;

  container.innerHTML = html;

  // Configurar animaciones y event listeners
  setupGuideAnimations(container);
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
