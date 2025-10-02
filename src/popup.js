// Estado global
let currentData = null;
let selectedArbitrage = null;
let userSettings = null; // NUEVO v5.0: Configuración del usuario

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupRefreshButton();
  fetchAndDisplay();
  loadBanksData();
});

// Formateo de números
function formatNumber(num) {
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
    
    // NUEVO v5.0: Aplicar preferencias del usuario antes de mostrar
    const filteredRoutes = applyUserPreferences(data.optimizedRoutes);
    console.log(`🔧 Rutas después de aplicar preferencias: ${filteredRoutes.length} de ${data.optimizedRoutes.length}`);
    
    // Mostrar rutas optimizadas (incluye single + multi-exchange)
    displayOptimizedRoutes(filteredRoutes, data.official);
    
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
    
    // Ruta simplificada (comprar → transferir → vender)
    const routeDescription = route.isSingleExchange
      ? `<strong>${route.buyExchange}</strong>`
      : `<strong>${route.buyExchange}</strong> → <strong>${route.sellExchange}</strong>`;
    
    html += `
      <div class="route-card ${profitClass}" data-index="${index}">
        <div class="route-header">
          <div class="route-title">
            <h3>${route.isSingleExchange ? '🎯' : '🔀'} Ruta ${index + 1}</h3>
            ${singleExchangeBadge}
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
  console.log('📖 Mostrando guía para ruta:', route.buyExchange, '→', route.sellExchange);
  
  // Convertir ruta a formato de arbitraje para la guía
  const arbitrage = {
    broker: route.isSingleExchange ? route.buyExchange : `${route.buyExchange} → ${route.sellExchange}`,
    buyExchange: route.buyExchange,
    sellExchange: route.sellExchange,
    isSingleExchange: route.isSingleExchange,
    profitPercent: route.profitPercent,
    officialPrice: route.officialPrice,
    usdToUsdtRate: route.usdToUsdtRate,
    usdtArsBid: route.usdtArsBid,
    sellPrice: route.usdtArsBid,
    transferFeeUSD: route.transferFeeUSD,
    calculation: route.calculation,
    fees: route.fees
  };
  
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
  
  // Usar cálculos reales del backend si están disponibles
  const calc = arb.calculation || {};
  const estimatedInvestment = calc.initial || 100000;
  const usdAmount = calc.usdPurchased || (estimatedInvestment / arb.officialPrice);
  const usdtAfterFees = calc.usdtAfterFees || usdAmount;
  const arsFromSale = calc.arsFromSale || (usdtAfterFees * arb.sellPrice);
  const finalAmount = calc.finalAmount || arsFromSale;
  const profit = calc.netProfit || (finalAmount - estimatedInvestment);
  
  const html = `
    <div class="step-container">
      <div class="arbitrage-summary">
        <h3>📊 ${arb.broker}</h3>
        <div class="profit-display">+${formatNumber(arb.profitPercent)}%</div>
        <p style="text-align: center; font-size: 0.9em;">Ganancia estimada por operación</p>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">1</div>
          <div class="step-title">Comprar Dólares Oficiales</div>
        </div>
        <div class="step-content">
          <p>Compra dólares al tipo de cambio oficial en tu banco habilitado.</p>
          <div class="step-detail">
            <strong>Precio:</strong> $${formatNumber(arb.officialPrice)} ARS por USD<br>
            <strong>Dónde:</strong> Bancos autorizados (ver pestaña "Bancos")<br>
            <strong>Límite:</strong> USD 200 mensuales por persona<br>
            <strong>Requisitos:</strong> CBU, cuenta bancaria, CUIT/CUIL
          </p>
          <a href="#" class="platform-link" data-action="show-banks">
            🏦 Ver bancos disponibles
          </a>
        </div>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">2</div>
          <div class="step-title">Depositar USD y Comprar USDT</div>
        </div>
        <div class="step-content">
          <p>Deposita tus USD en ${arb.broker} y cómpralos por USDT.</p>
          <div class="step-detail">
            <strong>Exchange:</strong> ${arb.broker}<br>
            <strong>Ratio conversión:</strong> ${formatNumber(arb.usdToUsdtRate)} USD por 1 USDT<br>
            <strong>Precio USDT:</strong> $${formatNumber(arb.usdtArsBid)} ARS (venta)<br>
            ${arb.fees ? `<strong>Comisión trading:</strong> ${formatNumber(arb.fees.trading)}%<br>` : ''}
            <strong>⚠️ Importante:</strong> El exchange cobra ~${formatNumber((arb.usdToUsdtRate - 1) * 100)}% para convertir USD a USDT
          </div>
        </div>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">3</div>
          <div class="step-title">Vender USDT por Pesos</div>
        </div>
        <div class="step-content">
          <p>Vende tus USDT en ${arb.broker} por pesos argentinos (ARS).</p>
          <div class="step-detail">
            <strong>Precio de venta:</strong> $${formatNumber(arb.usdtArsBid)} ARS por USDT<br>
            ${arb.fees ? `<strong>Comisión venta:</strong> ${formatNumber(arb.fees.trading)}%<br>` : ''}
            <strong>Método:</strong> Venta directa en el exchange (NO P2P)<br>
            <strong>Retiro:</strong> Transferencia bancaria a tu cuenta
          </div>
        </div>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">4</div>
          <div class="step-title">Retirar Ganancias</div>
        </div>
        <div class="step-content">
          <p>Retira tus pesos a tu cuenta bancaria.</p>
          <div class="step-detail">
            <strong>Método:</strong> Transferencia bancaria<br>
            <strong>Tiempo:</strong> 24-48 horas hábiles<br>
            ${arb.fees && arb.fees.withdrawal > 0 ? `<strong>Comisión retiro:</strong> ${formatNumber(arb.fees.withdrawal)}%<br>` : ''}
            <strong>Total comisiones:</strong> ${arb.fees ? formatNumber(arb.fees.total) : '~2-3'}%
          </div>
        </div>
      </div>
      
      <div class="calculation-box">
        <h4>💰 Ejemplo con $${formatNumber(estimatedInvestment)} ARS</h4>
        <div class="calculation-line">
          <span>1️⃣ Inversión inicial:</span>
          <span>$${formatNumber(estimatedInvestment)} ARS</span>
        </div>
        <div class="calculation-line">
          <span>2️⃣ Compras USD oficial:</span>
          <span>$${formatNumber(usdAmount)} USD</span>
        </div>
        <div class="calculation-line">
          <span>3️⃣ Compras USDT con USD (${formatNumber(arb.usdToUsdtRate)} USD/USDT):</span>
          <span>${formatNumber(calc.usdtPurchased || usdAmount / arb.usdToUsdtRate)} USDT</span>
        </div>
        <div class="calculation-line">
          <span>   Después fee trading (${arb.fees ? formatNumber(arb.fees.trading) : '0'}%):</span>
          <span>${formatNumber(usdtAfterFees)} USDT</span>
        </div>
        <div class="calculation-line">
          <span>4️⃣ Vendes USDT por ARS ($${formatNumber(arb.usdtArsBid)}):</span>
          <span>$${formatNumber(arsFromSale)} ARS</span>
        </div>
        ${arb.fees ? `
        <div class="calculation-line fees-line">
          <span>📊 Total comisiones (${formatNumber(arb.fees.total)}%):</span>
          <span>-$${formatNumber(arsFromSale - finalAmount)} ARS</span>
        </div>
        ` : ''}
        <div class="calculation-line">
          <span>5️⃣ Retiras a tu cuenta:</span>
          <span>$${formatNumber(finalAmount)} ARS</span>
        </div>
        <div class="calculation-line final-line">
          <span>✅ Ganancia neta:</span>
          <span class="profit-highlight">$${formatNumber(profit)} ARS (+${formatNumber(arb.profitPercent)}%)</span>
        </div>
        ${arb.grossProfitPercent ? `
        <div class="calculation-note">
          <small>💡 Ganancia bruta sin comisiones: ${formatNumber(arb.grossProfitPercent)}%</small>
        </div>
        ` : ''}
      </div>
      
      <div class="warning" style="margin-top: 15px;">
        ⚠️ <strong>Consideraciones importantes:</strong><br>
        • <strong>Comisiones incluidas:</strong> El cálculo ya considera fees de trading y retiro<br>
        • Las comisiones varían según el exchange (${arb.fees ? formatNumber(arb.fees.total) : '~2-3'}% total)<br>
        • Los precios fluctúan constantemente - verifica antes de operar<br>
        • Respeta el límite de USD 200 mensuales por persona<br>
        • Considera tiempos de transferencia bancaria (24-48hs)<br>
        • Algunos exchanges cobran fees adicionales por depósito USD
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
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
