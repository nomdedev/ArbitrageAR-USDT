// Estado global
let currentData = null;
let selectedArbitrage = null;
let userSettings = null; // NUEVO v5.0: Configuración del usuario
let currentFilter = 'no-p2p'; // CORREGIDO v5.0.12: Volver a 'no-p2p' pero con debug forzado
let allRoutes = []; // NUEVO: Cache de todas las rutas sin filtrar

// Modo debug para reducir logs excesivos
const DEBUG_MODE = false; // PRODUCCIÓN: Desactivado después de diagnosticar problema

console.log('🚀 Popup.js cargado correctamente');

// Función de logging condicional
function log(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  log('📄 DOM Content Loaded - Iniciando setup...');
  setupTabNavigation();
  setupRefreshButton();
  setupFilterButtons(); // NUEVO: Configurar filtros P2P
  setupAdvancedFilters(); // NUEVO v5.0.75: Configurar filtros avanzados
  setupDollarPriceControls(); // NUEVO: Configurar controles del precio del dólar
  setupAdvancedSimulator(); // NUEVO v5.0.31: Configurar simulador sin rutas
  checkForUpdates(); // NUEVO: Verificar actualizaciones disponibles
  loadUserSettings(); // NUEVO v5.0.28: Cargar configuración del usuario
  fetchAndDisplay();
  // CORREGIDO v5.0.46: No cargar bancos automáticamente ya que no está soportado en versión simplificada
  // loadBanksData(); // Deshabilitado - funcionalidad no disponible
});

// Formateo de números
function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) {
    console.warn('formatNumber recibió valor inválido:', num);
    return '0.00';
  }
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// NUEVO: Formateo específico para ratios USD/USDT con 3 decimales
function formatUsdUsdtRatio(num) {
  // No mostrar valores por fallback. Si no hay dato real, devolver 'N/D'.
  if (num === undefined || num === null || isNaN(num)) {
    // No usar fallback 1.000 porque puede inducir a error
    return 'N/D';
  }
  return Number(num).toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

// NUEVO: Formateo específico para porcentajes de comisión con mayor precisión
function formatCommissionPercent(num) {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.00';
  }
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

// NUEVO: Obtener texto para mostrar la fuente del precio del dólar
function getDollarSourceDisplay(official) {
  if (!official || !official.source) return 'N/A';
  
  switch (official.source) {
    case 'manual':
      return '👤 Manual';
    case 'dolarito_bank':
      return `🏦 ${official.bank}`;
    case 'dolarito_median':
      return `📊 Mediana (${official.banksCount || 0} bancos)`;
    case 'dolarito_trimmed_average':
      return `📊 Prom. Recortado (${official.usedBanks || 0}/${official.banksCount || 0} bancos)`;
    case 'dolarito_average':
      return `📊 Promedio (${official.banksCount || 0} bancos)`;
    case 'dolarito_cheapest':
      return `💰 ${official.bank} (menor precio)`;
    case 'dolarapi_fallback':
      return '🔄 DolarAPI (fallback)';
    case 'hardcoded_fallback':
      return '⚠️ Fallback fijo';
    default:
      return official.source;
  }
}

// ============================================
// FUNCIONES DE VALIDACIÓN DE DATOS v5.0.74
// ============================================

/**
 * Calcular nivel de frescura de los datos
 */
function getDataFreshnessLevel(timestamp) {
  if (!timestamp) {
    return {
      level: 'stale',
      icon: '🔴',
      color: '#dc3545',
      ageMinutes: null,
      message: 'Sin timestamp'
    };
  }

  const now = Date.now();
  const dataTime = new Date(timestamp).getTime();
  const ageMs = now - dataTime;
  const ageMinutes = Math.floor(ageMs / 60000);

  if (ageMinutes < 3) {
    return {
      level: 'fresh',
      icon: '🟢',
      color: '#28a745',
      ageMinutes,
      message: 'Datos frescos'
    };
  } else if (ageMinutes < 5) {
    return {
      level: 'moderate',
      icon: '🟡',
      color: '#ffc107',
      ageMinutes,
      message: 'Datos recientes'
    };
  } else {
    return {
      level: 'stale',
      icon: '🔴',
      color: '#dc3545',
      ageMinutes,
      message: 'Datos desactualizados'
    };
  }
}

/**
 * Validar coherencia de cálculos de una ruta
 */
function validateRouteCalculations(route) {
  const warnings = [];
  
  // Validar profit razonable
  if (route.profitPercentage > 50) {
    warnings.push('Profit extremadamente alto (>50%), verificar datos');
  }
  
  if (route.profitPercentage < -90) {
    warnings.push('Pérdida extrema (<-90%), verificar datos');
  }
  
  // Validar USD/USDT ratio
  if (route.calculation?.usdToUsdtRate) {
    const ratio = route.calculation.usdToUsdtRate;
    if (ratio < 0.95 || ratio > 1.15) {
      warnings.push(`Ratio USD/USDT fuera de rango (${ratio.toFixed(4)})`);
    }
  }
  
  // Validar montos
  if (route.calculation?.initialAmount <= 0) {
    warnings.push('Monto inicial inválido');
  }
  
  if (route.calculation?.finalAmount < 0) {
    warnings.push('Monto final negativo');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}

// ============================================
// FUNCIONES DE VALIDACIÓN Y SEGURIDAD v5.0.28
// ============================================

/**
 * Cargar configuración del usuario
 */
function loadUserSettings() {
  chrome.storage.local.get('notificationSettings', (result) => {
    const settings = result.notificationSettings || {};

    userSettings = {
      // Notificaciones
      notificationsEnabled: settings.notificationsEnabled !== false,
      alertType: settings.alertType || 'all',
      customThreshold: settings.customThreshold || 5,
      soundEnabled: settings.soundEnabled !== false,

      // Exchanges preferidos
      preferredExchanges: settings.preferredExchanges || [],

      // Validación y seguridad
      dataFreshnessWarning: settings.dataFreshnessWarning !== false,
      riskAlertsEnabled: settings.riskAlertsEnabled !== false,
      requireConfirmHighAmount: settings.requireConfirmHighAmount !== false,
      minProfitWarning: settings.minProfitWarning || 0.5,

      // Preferencias de rutas
      showNegativeRoutes: settings.showNegativeRoutes !== false, // Por defecto MOSTRAR rutas negativas
      preferSingleExchange: settings.preferSingleExchange || false,
      maxRoutesDisplay: settings.maxRoutesDisplay || 20,
      profitThreshold: settings.profitThreshold || 1.0, // Por defecto 1% - configurable en options

      // NUEVO v5.0.56: Modos de display adicionales
      sortByProfit: settings.sortByProfit !== false, // Por defecto ordenar por profit
      showOnlyProfitable: settings.showOnlyProfitable || false, // Por defecto mostrar todas
      
      // Simulador
      defaultSimAmount: settings.defaultSimAmount || 1000000,

      // Fees personalizados
      extraTradingFee: settings.extraTradingFee || 0,
      extraWithdrawalFee: settings.extraWithdrawalFee || 0,
      extraTransferFee: settings.extraTransferFee || 0,
      bankCommissionFee: settings.bankCommissionFee || 0,

      // Configuración de precio del dólar
      dollarPriceSource: settings.dollarPriceSource || 'auto',
      manualDollarPrice: settings.manualDollarPrice || 950,
      preferredBank: settings.preferredBank || 'mediana',

      // Configuración de bancos
      showBestBankPrice: settings.showBestBankPrice || false,
      selectedBanks: settings.selectedBanks || []
    };

    console.log('⚙️ Configuración completa del usuario cargada desde storage:', userSettings);
  });
}

/**
 * Actualizar indicador de estado de datos con información de frescura
 */
function updateDataStatusIndicator(data) {
  const statusEl = document.getElementById('dataStatus');
  if (!statusEl || !window.validationService) return;

  // Verificar salud del sistema
  const health = window.validationService.generateSystemHealthReport(data);
  
  // Obtener frescura del precio oficial
  const freshness = window.validationService.getDataFreshnessLevel(data.oficial?.timestamp);
  
  // Construir HTML del indicador
  let html = `<span class="freshness-indicator" style="color: ${freshness.color}">${freshness.icon}</span>`;
  
  if (freshness.ageMinutes !== null) {
    html += ` <span class="age-text">Datos: hace ${freshness.ageMinutes} min</span>`;
  } else {
    html += ` <span class="age-text">Datos: Sin timestamp</span>`;
  }
  
  // Mostrar advertencias si hay
  if (health.warnings.length > 0) {
    html += ` <span class="health-warning" title="${health.warnings.join(', ')}">⚠️</span>`;
  }
  
  statusEl.innerHTML = html;
  statusEl.className = `data-status ${freshness.level}`;
}

/**
 * Agregar indicador de riesgo a una ruta
 */
function addRiskIndicatorToRoute(route, params) {
  if (!window.validationService) return '';
  
  const risk = window.validationService.calculateRouteRiskLevel(
    route,
    route.profitPercentage,
    params
  );
  
  return `
    <div class="risk-indicator risk-${risk.level}" title="Nivel de riesgo: ${risk.level}">
      ${risk.icon} <span class="risk-text">${risk.level === 'low' ? 'Bajo' : risk.level === 'medium' ? 'Medio' : 'Alto'}</span>
      ${risk.reasons.length > 0 ? `<div class="risk-reasons">${risk.reasons.join(', ')}</div>` : ''}
    </div>
  `;
}

// Mostrar indicador de salud del mercado (versión compacta)
function displayMarketHealth(health) {
  const container = document.getElementById('marketHealth');
  
  if (!health) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.style.backgroundColor = `${health.color}15`; // 15 = opacity
  container.style.borderColor = `${health.color}40`;
  
  // Versión compacta: solo icono + status en una línea
  container.innerHTML = `
    <span class="market-icon">${health.icon}</span>
    <span class="market-status-compact">${health.status}</span>
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

// CORREGIDO v5.0.7: Determinar si una ruta usa P2P basándose en datos del backend
function isP2PRoute(route) {
  if (!route) return false;

  const brokerName = route.broker?.toLowerCase() || '';
  const buyName = route.buyExchange?.toLowerCase() || '';
  const sellName = route.sellExchange?.toLowerCase() || '';

  // Prioridad 1: Usar el campo requiresP2P calculado en backend
  if (typeof route.requiresP2P === 'boolean') {
    if (DEBUG_MODE) console.log(`🔍 ${route.broker}: requiresP2P=${route.requiresP2P} (backend)`);
    return route.requiresP2P;
  }

  // Fallback 1: Verificar nombre del broker
  if (brokerName.includes('p2p')) {
    if (DEBUG_MODE) console.log(`🔍 ${route.broker}: P2P detectado por nombre del broker`);
    return true;
  }

  // Fallback 2: Verificar nombres de exchanges
  if (buyName.includes('p2p') || sellName.includes('p2p')) {
    if (DEBUG_MODE) console.log(`🔍 ${route.broker}: P2P detectado por exchanges (${buyName}, ${sellName})`);
    return true;
  }

  if (DEBUG_MODE) console.log(`🔍 ${route.broker}: Clasificado como NO-P2P`);
  return false;
}

// CORREGIDO v5.0.12: Aplicar filtro P2P según selección del usuario
// ACTUALIZADO v5.0.75: Ahora usa applyAllFilters para incluir filtros avanzados
function applyP2PFilter() {
  if (DEBUG_MODE) console.log('🔍 applyP2PFilter() llamado con filtro:', currentFilter);
  if (DEBUG_MODE) console.log('🔍 allRoutes:', allRoutes?.length);

  if (!allRoutes || allRoutes.length === 0) {
    console.warn('⚠️ No hay rutas disponibles para filtrar');
    return;
  }
  
  // NUEVO v5.0.75: Poblar exchanges y usar filtros avanzados
  populateExchangeFilter();
  applyAllFilters();
  updateFilterCounts();
  return;
  
  // --- CÓDIGO ANTERIOR COMENTADO PARA REFERENCIA ---
  /*

  // Aplicar filtro P2P según selección
  let filteredRoutes;
  switch (currentFilter) {
    case 'p2p':
      filteredRoutes = allRoutes.filter(route => isP2PRoute(route));
      if (DEBUG_MODE) console.log(`� Filtro P2P: ${filteredRoutes.length} rutas P2P de ${allRoutes.length}`);
      break;
    case 'no-p2p':
      filteredRoutes = allRoutes.filter(route => !isP2PRoute(route));
      if (DEBUG_MODE) console.log(`🔍 Filtro No-P2P: ${filteredRoutes.length} rutas directas de ${allRoutes.length}`);
      break;
    case 'all':
    default:
      filteredRoutes = [...allRoutes];
      if (DEBUG_MODE) console.log(`🔍 Filtro Todas: ${filteredRoutes.length} rutas totales`);
      break;
  }

  // Aplicar filtros adicionales del usuario (negativas, max rutas, exchanges preferidos, etc.)
  filteredRoutes = applyUserPreferences(filteredRoutes);
  if (DEBUG_MODE) console.log('🔍 Después de applyUserPreferences:', filteredRoutes.length, 'rutas');

  // Mostrar rutas filtradas
  if (currentData) {
    if (DEBUG_MODE) console.log('🔍 Llamando displayOptimizedRoutes con', filteredRoutes.length, 'rutas');
    displayOptimizedRoutes(filteredRoutes, currentData.oficial);
  } else {
    console.warn('⚠️ currentData es null, no se puede mostrar rutas');
  }

  // Actualizar contadores en los botones
  updateFilterCounts();
  */
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
  
  log(`📊 Contadores actualizados - Total: ${allCount}, P2P: ${p2pCount}, No P2P: ${noP2pCount}`);
}

// ============================================
// FILTROS AVANZADOS v5.0.75
// ============================================

// Estado de filtros avanzados
let advancedFilters = {
  exchange: 'all',
  profitMin: 0,
  hideNegative: false,
  sortBy: 'profit-desc'
};

/**
 * Configurar filtros avanzados
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

  // Filtro de exchange - Poblar con exchanges únicos
  populateExchangeFilter();

  // Filtro de profit mínimo - Actualizar valor mostrado
  const profitRange = document.getElementById('filter-profit-min');
  const profitValue = document.getElementById('filter-profit-value');
  
  if (profitRange && profitValue) {
    profitRange.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      profitValue.textContent = `${value}%`;
      advancedFilters.profitMin = value;
    });
  }

  // Toggle ocultar negativas
  const hideNegative = document.getElementById('filter-hide-negative');
  if (hideNegative) {
    hideNegative.addEventListener('change', (e) => {
      advancedFilters.hideNegative = e.target.checked;
    });
  }

  // Filtro de exchange
  const exchangeSelect = document.getElementById('filter-exchange');
  if (exchangeSelect) {
    exchangeSelect.addEventListener('change', (e) => {
      advancedFilters.exchange = e.target.value;
    });
  }

  // Ordenar por
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      advancedFilters.sortBy = e.target.value;
    });
  }

  // Botón aplicar
  const applyBtn = document.getElementById('apply-filters');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyAllFilters();
    });
  }

  // Botón resetear
  const resetBtn = document.getElementById('reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetAdvancedFilters();
    });
  }
}

/**
 * Poblar select de exchanges con opciones únicas
 */
function populateExchangeFilter() {
  const select = document.getElementById('filter-exchange');
  if (!select || !allRoutes) return;

  // Obtener exchanges únicos
  const exchangesSet = new Set();
  allRoutes.forEach(route => {
    if (route.buyExchange) exchangesSet.add(route.buyExchange);
    if (route.sellExchange) exchangesSet.add(route.sellExchange);
  });

  const exchanges = Array.from(exchangesSet).sort();

  // Limpiar opciones existentes (excepto "Todos")
  select.innerHTML = '<option value="all">Todos los exchanges</option>';

  // Agregar opciones
  exchanges.forEach(exchange => {
    const option = document.createElement('option');
    option.value = exchange;
    option.textContent = exchange.charAt(0).toUpperCase() + exchange.slice(1);
    select.appendChild(option);
  });

  log(`📊 Filtro de exchanges poblado con ${exchanges.length} opciones`);
}

/**
 * Aplicar todos los filtros (P2P + Avanzados)
 */
function applyAllFilters() {
  if (!allRoutes || allRoutes.length === 0) {
    console.warn('⚠️ No hay rutas para filtrar');
    return;
  }

  log('🔍 Aplicando filtros avanzados:', advancedFilters);

  // Paso 1: Filtro P2P (como antes)
  let filteredRoutes;
  switch (currentFilter) {
    case 'p2p':
      filteredRoutes = allRoutes.filter(route => isP2PRoute(route));
      break;
    case 'no-p2p':
      filteredRoutes = allRoutes.filter(route => !isP2PRoute(route));
      break;
    case 'all':
    default:
      filteredRoutes = [...allRoutes];
      break;
  }

  log(`🔍 Después de filtro P2P: ${filteredRoutes.length} rutas`);

  // Paso 2: Filtro por exchange
  if (advancedFilters.exchange !== 'all') {
    filteredRoutes = filteredRoutes.filter(route => 
      route.buyExchange === advancedFilters.exchange ||
      route.sellExchange === advancedFilters.exchange
    );
    log(`🔍 Después de filtro exchange (${advancedFilters.exchange}): ${filteredRoutes.length} rutas`);
  }

  // Paso 3: Filtro por profit mínimo
  if (advancedFilters.profitMin !== 0) {
    filteredRoutes = filteredRoutes.filter(route => 
      route.profitPercentage >= advancedFilters.profitMin
    );
    log(`🔍 Después de filtro profit mínimo (${advancedFilters.profitMin}%): ${filteredRoutes.length} rutas`);
  }

  // Paso 4: Ocultar negativas
  if (advancedFilters.hideNegative) {
    filteredRoutes = filteredRoutes.filter(route => route.profitPercentage >= 0);
    log(`🔍 Después de ocultar negativas: ${filteredRoutes.length} rutas`);
  }

  // Paso 5: Aplicar preferencias de usuario (como antes)
  filteredRoutes = applyUserPreferences(filteredRoutes);
  log(`🔍 Después de preferencias usuario: ${filteredRoutes.length} rutas`);

  // Paso 6: Ordenar
  filteredRoutes = sortRoutes(filteredRoutes, advancedFilters.sortBy);
  log(`🔍 Después de ordenar (${advancedFilters.sortBy}): ${filteredRoutes.length} rutas`);

  // Mostrar rutas
  if (currentData) {
    displayOptimizedRoutes(filteredRoutes, currentData.oficial);
  }

  // Cerrar panel después de aplicar
  const panel = document.getElementById('advanced-filters-panel');
  const toggleBtn = document.getElementById('toggle-advanced-filters');
  if (panel) panel.style.display = 'none';
  if (toggleBtn) {
    const arrow = toggleBtn.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = '▼';
  }
}

/**
 * Ordenar rutas según criterio
 */
function sortRoutes(routes, sortBy) {
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
      // Por defecto: profit descendente
      sorted.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  return sorted;
}

/**
 * Resetear filtros avanzados a valores por defecto
 */
function resetAdvancedFilters() {
  advancedFilters = {
    exchange: 'all',
    profitMin: 0,
    hideNegative: false,
    sortBy: 'profit-desc'
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
  if (sortSelect) sortSelect.value = 'profit-desc';

  log('🔄 Filtros avanzados reseteados');

  // Reaplicar filtros
  applyAllFilters();
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
          log(`🔧 Monto default del simulador: $${userSettings.defaultSimAmount.toLocaleString()}`);
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

// Funciones helper para reducir complejidad de fetchAndDisplay
function handleNoData(container) {
  console.error('❌ Error: No se recibió respuesta del background');
  container.innerHTML = '<p class="error">❌ No se pudo comunicar con el servicio de fondo.</p>';
}

function handleInitializationError(container, data, retryCount, maxRetries) {
  console.log(`⏳ Background inicializando, reintentando en 2 segundos... (${retryCount + 1}/${maxRetries})`);
  container.innerHTML = `<p class="info">⏳ ${sanitizeHTML(data.error)} (reintentando automáticamente...)</p>`;
  setTimeout(() => {
    fetchAndDisplay(retryCount + 1);
  }, 2000);
}

function handleMaxRetriesError(container, data) {
  console.error('❌ Máximo de reintentos alcanzado');
  container.innerHTML = `<p class="error">❌ ${sanitizeHTML(data.error)}<br><br>⚠️ Intenta actualizar manualmente en unos segundos.</p>`;
}

function handleCacheIndicator(data, retryCount) {
  const cacheIndicator = document.getElementById('cache-indicator');
  if (!cacheIndicator) return;

  if (data.usingCache) {
    cacheIndicator.style.display = 'block';
    cacheIndicator.textContent = data.error ? `⚠️ ${data.error}` : '📱 Datos cacheados';

    // Si hay error en cache, intentar actualizar automáticamente (solo 1 vez)
    if (data.error && retryCount === 0) {
      setTimeout(() => {
        console.log('🔄 Intentando actualizar datos automáticamente...');
        fetchAndDisplay(1);
      }, 2000);
    }
  } else {
    cacheIndicator.style.display = 'none';
  }
}

function handleSuccessfulData(data, container) {
  currentData = data;
  updateLastUpdateTimestamp(data.lastUpdate);
  displayMarketHealth(data.marketHealth);
  
  // NUEVO v5.0.28: Actualizar indicador de estado de datos
  updateDataStatusIndicator(data);
  
  // NUEVO: Mostrar información del precio del dólar
  if (data.oficial) {
    displayDollarInfo(data.oficial);
  }

  if (data.error && !data.usingCache) {
    const errorClass = data.usingCache ? 'warning' : 'error';
    setSafeHTML(container, `<p class="${errorClass}">❌ ${sanitizeHTML(data.error)}</p>`);
    if (data.usingCache) {
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

  // Guardar todas las rutas en cache global para filtrado P2P
  allRoutes = data.optimizedRoutes || [];
  console.log('🔍 [POPUP] allRoutes guardadas:', allRoutes.length, 'rutas');

  // Actualizar contadores de filtros
  updateFilterCounts();

  // Aplicar filtro P2P activo
  console.log('🔍 [POPUP] Llamando applyP2PFilter()...');
  applyP2PFilter();
}

// Obtener y mostrar datos de arbitraje (con retry automático)
async function fetchAndDisplay(retryCount = 0) {
  console.log(`🔄 Cargando datos de arbitraje... (intento ${retryCount + 1})`);
  
  const container = document.getElementById('optimized-routes');
  const loading = document.getElementById('loading');
  const maxRetries = 3;
  
  loading.style.display = 'block';
  container.innerHTML = '';
  
  // NUEVO v5.0: Cargar preferencias del usuario
  const settings = await chrome.storage.local.get('notificationSettings');
  userSettings = settings.notificationSettings || {};
  
  try {
    console.log('📤 [POPUP] Solicitando datos al background...');
    console.log('📤 [POPUP] Verificando runtime disponible:', !!chrome.runtime);
    console.log('� [POPUP] Verificando sendMessage disponible:', !!chrome.runtime?.sendMessage);
    
    // Timeout para detectar si el callback nunca se ejecuta
    let responseReceived = false;
    const timeoutId = setTimeout(() => {
      if (!responseReceived) {
        console.error('⏰ [POPUP] TIMEOUT: El callback del background nunca se ejecutó (15 segundos)');
        loading.style.display = 'none';
        container.innerHTML = `
          <div class="error-container">
            <h3>⏰ Timeout de Conexión</h3>
            <p>El background no respondió en 15 segundos.</p>
            <button class="retry-btn" data-action="reload">🔄 Reintentar</button>
            <details style="margin-top: 10px;">
              <summary>Información de Debug</summary>
              <p><small>Runtime disponible: ${!!chrome.runtime}</small></p>
              <p><small>SendMessage disponible: ${!!chrome.runtime?.sendMessage}</small></p>
              <p><small>Timestamp: ${new Date().toISOString()}</small></p>
            </details>
          </div>
        `;
      }
    }, 15000); // Aumentado a 15 segundos
    
    console.log('📤 [POPUP] Enviando mensaje { action: "getArbitrages" }...');
    
    // Verificar que chrome.runtime está disponible antes de enviar
    if (!chrome.runtime) {
      console.error('❌ [POPUP] chrome.runtime no está disponible');
      loading.style.display = 'none';
      container.innerHTML = '<p class="error">❌ Chrome Runtime no disponible. Recarga la extensión.</p>';
      clearTimeout(timeoutId);
      return;
    }
    
    try {
      chrome.runtime.sendMessage({ action: 'getArbitrages' }, data => {
        responseReceived = true;
        clearTimeout(timeoutId);
        
        console.log('📥 [POPUP] Callback ejecutado - Datos recibidos:', data);
        console.log('📥 [POPUP] chrome.runtime.lastError:', chrome.runtime.lastError);
        
        if (chrome.runtime.lastError) {
          console.error('❌ Error en chrome.runtime:', chrome.runtime.lastError);
          loading.style.display = 'none';
          container.innerHTML = `
            <div class="error-container">
              <h3>❌ Error de Comunicación</h3>
              <p>Error: ${chrome.runtime.lastError.message}</p>
              <button class="retry-btn" data-action="reload">🔄 Reintentar</button>
            </div>
          `;
          return;
        }
      
      console.log('📥 Procesando respuesta del background...');
      
      loading.style.display = 'none';
      
      if (!data) {
        console.error('❌ No se recibió data del background');
        handleNoData(container);
        return;
      }

      // NUEVO: Manejar errores específicos del background
      if (data.timeout) {
        container.innerHTML = `
          <div class="error-container">
            <h3>⏰ Timeout del Background</h3>
            <p>El procesamiento tomó demasiado tiempo.</p>
            <button class="retry-btn" data-action="reload">🔄 Reintentar</button>
            <p><small>Si el problema persiste, recarga la extensión.</small></p>
          </div>
        `;
        return;
      }

      if (data.isTimeout) {
        container.innerHTML = `
          <div class="error-container">
            <h3>⏰ Timeout de APIs</h3>
            <p>Las APIs externas no responden.</p>
            <button class="retry-btn" data-action="reload">🔄 Reintentar</button>
            <p><small>Verifica tu conexión a internet.</small></p>
          </div>
        `;
        return;
      }

      if (data.backgroundUnhealthy) {
        container.innerHTML = `
          <div class="error-container">
            <h3>🏥 Background No Saludable</h3>
            <p>Las APIs externas no están disponibles.</p>
            <button class="retry-btn" data-action="reload">🔄 Reintentar</button>
            <p><small>Esto puede ser temporal. Intenta de nuevo en unos minutos.</small></p>
          </div>
        `;
        return;
      }

      console.log('📥 Data válida recibida, procesando...');
      
      // Si está inicializando y aún no hay rutas, hacer retry automático
      if (data.error?.includes('Inicializando') && retryCount < maxRetries) {
        handleInitializationError(container, data, retryCount, maxRetries);
        return;
      }

      // Si alcanzamos el límite de reintentos
      if (data.error && retryCount >= maxRetries) {
        handleMaxRetriesError(container, data);
        return;
      }
    
      handleCacheIndicator(data, retryCount);
      handleSuccessfulData(data, container);
      });
    } catch (error) {
      console.error('❌ Error enviando mensaje al background:', error);
      responseReceived = true;
      clearTimeout(timeoutId);
      loading.style.display = 'none';
      container.innerHTML = `
        <div class="error-container">
          <h3>❌ Error de Envío</h3>
          <p>No se pudo comunicar con el background: ${error.message}</p>
          <button class="retry-btn" data-action="reload">🔄 Reintentar</button>
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error en fetchAndDisplay:', error);
    loading.style.display = 'none';
    container.innerHTML = '<p class="error">❌ Error interno: ' + sanitizeHTML(error.message) + '</p>';
  }
}

// NUEVA FUNCIÓN v5.0: Aplicar preferencias del usuario
function applyUserPreferences(routes) {
  if (DEBUG_MODE) console.log('🔍 [POPUP] applyUserPreferences() llamado con', routes?.length, 'rutas');
  if (DEBUG_MODE) console.log('🔍 [POPUP] userSettings completo:', JSON.stringify(userSettings, null, 2));
  if (!Array.isArray(routes) || routes.length === 0) {
    if (DEBUG_MODE) console.log('🔍 [POPUP] applyUserPreferences: rutas vacías o no array, retornando vacío');
    return routes;
  }

  let filtered = [...routes]; // Copia para no mutar original
  if (DEBUG_MODE) console.log('🔍 [POPUP] applyUserPreferences: copia inicial tiene', filtered.length, 'rutas');

  // MEJORADO v5.0.64: Filtro unificado por ganancia mínima (separa visualización de notificaciones)
  filtered = applyMinProfitFilter(filtered, userSettings?.filterMinProfit);

  // 2. Filtrar por exchanges preferidos del usuario
  filtered = applyPreferredExchangesFilter(filtered, userSettings?.preferredExchanges);

  // 3. Ordenar rutas según preferencias del usuario
  filtered = applySorting(filtered, userSettings.preferSingleExchange, userSettings.sortByProfit);

  // 4. Limitar cantidad de rutas mostradas
  const maxDisplay = userSettings.maxRoutesDisplay || 20;
  filtered = applyLimit(filtered, maxDisplay);

  if (DEBUG_MODE) console.log('🔍 [POPUP] applyUserPreferences retornando', filtered.length, 'rutas finales');
  return filtered;
}

// MEJORADO v5.0.64: Filtro unificado que reemplaza applyProfitThresholdFilter, applyOnlyProfitableFilter y applyNegativeFilter
function applyMinProfitFilter(routes, filterMinProfit) {
  // filterMinProfit por defecto es -10.0% (muestra casi todo)
  // Usuario puede configurar desde -10% hasta +20%
  const minProfit = filterMinProfit ?? -10.0;
  
  const beforeCount = routes.length;
  const filtered = routes.filter(r => r.profitPercentage >= minProfit);
  if (DEBUG_MODE) console.log(`🔧 [POPUP] Filtradas por ganancia mínima ${minProfit}%: ${beforeCount} → ${filtered.length} rutas`);
  return filtered;
}

function applyPreferredExchangesFilter(routes, preferredExchanges) {
  // Si no hay exchanges preferidos configurados, mostrar todas las rutas
  if (!preferredExchanges || !Array.isArray(preferredExchanges) || preferredExchanges.length === 0) {
    if (DEBUG_MODE) console.log('🔍 [POPUP] No hay exchanges preferidos configurados - mostrando todas las rutas');
    return routes;
  }

  const beforeCount = routes.length;
  const filtered = routes.filter(route => {
    // Una ruta pasa el filtro si al menos uno de sus exchanges está en la lista preferida
    return preferredExchanges.includes(route.buyExchange) ||
           (route.sellExchange && preferredExchanges.includes(route.sellExchange));
  });

  if (DEBUG_MODE) console.log(`🔧 [POPUP] Exchanges preferidos (${preferredExchanges.join(', ')}): ${beforeCount} → ${filtered.length} rutas`);
  return filtered;
}

function applySorting(routes, preferSingleExchange, sortByProfit) {
  if (preferSingleExchange === true) {
    routes.sort((a, b) => {
      if (a.isSingleExchange !== b.isSingleExchange) {
        return b.isSingleExchange - a.isSingleExchange;
      }
      return b.profitPercentage - a.profitPercentage;
    });
    if (DEBUG_MODE) console.log('🔧 [POPUP] Rutas ordenadas priorizando mismo broker');
  } else if (sortByProfit === true) {
    routes.sort((a, b) => b.profitPercentage - a.profitPercentage);
    if (DEBUG_MODE) console.log('🔧 [POPUP] Rutas ordenadas por ganancia descendente');
  }
  return routes;
}

function applyLimit(routes, maxDisplay) {
  if (routes.length > maxDisplay) {
    const limited = routes.slice(0, maxDisplay);
    if (DEBUG_MODE) console.log(`🔧 [POPUP] Limitadas a ${maxDisplay} rutas`);
    return limited;
  }
  return routes;
}

// Mostrar tarjetas de arbitraje
function displayArbitrages(arbitrages, official) {
  const container = document.getElementById('arbitrages');
  let html = '';
  
  arbitrages.forEach((arb, index) => {
    // Determinar si es ganancia o pérdida
    const { isNegative, profitClass, profitBadgeClass } = getProfitClasses(arb.profitPercentage);
    
    // Indicadores especiales
    const lowProfitIndicator = arb.profitPercentage >= 0 && arb.profitPercentage < 1 ? '<span class="low-profit-tag">👁️ Solo vista</span>' : '';
    const negativeIndicator = isNegative ? '<span class="negative-tag">⚠️ Pérdida</span>' : '';
    
    // Símbolo según ganancia/pérdida
    const profitSymbol = isNegative ? '' : '+';
    
    // Verificar si hay diferencia entre ganancia bruta y neta
    const hasFees = arb.fees && arb.fees.total > 0;
    
    html += `
      <div class="arbitrage-card ${profitClass}" data-index="${index}">
        <div class="card-header">
          <h3>🏦 ${arb.broker}</h3>
          <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${formatNumber(arb.profitPercentage)}% ${lowProfitIndicator}${negativeIndicator}</div>
        </div>
        <div class="card-body">
          <div class="price-row">
            <span class="price-label">💵 Dólar Oficial</span>
            <span class="price-value">$${formatNumber(arb.officialPrice)}</span>
          </div>
          ${official?.source ? `
          <div class="price-row source-row">
            <span class="price-label">📍 Fuente</span>
            <span class="price-value source-value">${getDollarSourceDisplay(official)}</span>
          </div>
          ` : ''}
          <div class="price-row">
            <span class="price-label">� USD → USDT</span>
            <span class="price-value">${formatUsdUsdtRatio(arb.usdToUsdtRate)} USD/USDT</span>
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
            <span class="price-value net-profit">+${formatNumber(arb.profitPercentage)}%</span>
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
  console.log('🔍 [POPUP] displayOptimizedRoutes() llamado con', routes?.length, 'rutas');
  const container = document.getElementById('optimized-routes');
  console.log('🔍 [POPUP] container encontrado:', !!container);

  if (!routes || routes.length === 0) {
    console.log('🔍 [POPUP] No hay rutas para mostrar, mostrando mensaje informativo');
    container.innerHTML = `
      <div class="market-status">
        <h3>📊 Estado del Mercado</h3>
        <p>No se encontraron rutas de arbitraje que cumplan con tus criterios de filtrado.</p>
        <div class="market-info">
          <p><strong>Posibles causas:</strong></p>
          <ul>
            <li>🎯 <strong>Umbral de ganancia muy alto:</strong> Prueba bajar el umbral mínimo en Configuración</li>
            <li>🏦 <strong>Exchanges preferidos restrictivos:</strong> Agrega más exchanges en Configuración</li>
            <li>� <strong>Mercado en equilibrio:</strong> Las tasas están muy cercanas al dólar oficial</li>
            <li>🔄 <strong>Filtro P2P activo:</strong> Cambia a "Todas" o "No P2P" en los filtros</li>
          </ul>
          <p><small>Tu configuración actual: Umbral ${userSettings?.profitThreshold || 1.0}%, Exchanges: ${userSettings?.preferredExchanges?.length ? userSettings.preferredExchanges.join(', ') : 'Todos'}</small></p>
        </div>
        <button class="retry-btn" data-action="reload" style="margin-top: 15px;">🔄 Actualizar Datos</button>
        <button class="settings-btn" onclick="chrome.runtime.openOptionsPage()" style="margin-top: 10px;">⚙️ Revisar Configuración</button>
      </div>
    `;
    return;
  }

  // Ordenar rutas por rentabilidad (de mayor a menor ganancia)
  // CORREGIDO v5.0.71: Usar calculation.profitPercentage para consistencia
  routes.sort((a, b) => {
    const profitA = a.calculation?.profitPercentage !== undefined ? a.calculation.profitPercentage : (a.profitPercentage || 0);
    const profitB = b.calculation?.profitPercentage !== undefined ? b.calculation.profitPercentage : (b.profitPercentage || 0);
    return profitB - profitA;
  });

  console.log('🔍 [POPUP] Generando HTML para', routes.length, 'rutas ordenadas por rentabilidad');
  let html = '';
  
  routes.forEach((route, index) => {
    // CORREGIDO v5.0.71: Usar calculation.profitPercentage para consistencia con la guía
    const displayProfitPercentage = route.calculation?.profitPercentage !== undefined 
      ? route.calculation.profitPercentage 
      : route.profitPercentage || 0;
    
    const { isNegative, profitClass, profitBadgeClass } = getProfitClasses(displayProfitPercentage);
    
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
    
    // CORREGIDO v5.0.72: Guardar la ruta completa como JSON en data-route para evitar problemas de índices
    const routeData = JSON.stringify({
      buyExchange: route.buyExchange,
      sellExchange: route.sellExchange,
      isSingleExchange: route.isSingleExchange,
      profitPercentage: displayProfitPercentage,
      officialPrice: route.officialPrice,
      usdToUsdtRate: route.usdToUsdtRate,
      usdtArsBid: route.usdtArsBid,
      transferFeeUSD: route.transferFeeUSD,
      calculation: route.calculation,
      fees: route.fees
    });
    
    html += `
      <div class="route-card ${profitClass} ${isP2P ? 'is-p2p' : 'is-direct'}" data-index="${index}" data-route='${routeData.replace(/'/g, "&apos;")}'>
        <div class="route-header">
          <div class="route-title">
            <h3>${route.isSingleExchange ? '🎯' : '🔀'} Ruta ${index + 1}</h3>
            <div class="route-badges">
              ${singleExchangeBadge}
              ${p2pBadge}
            </div>
            <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${formatNumber(displayProfitPercentage)}% ${negativeIndicator}</div>
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
  
  // CORREGIDO v5.0.64: Seleccionar route-cards del container correcto
  const routeCards = container.querySelectorAll('.route-card');
  
  console.log(`🔍 [POPUP] Agregando event listeners a ${routeCards.length} route-cards`);
  
  routeCards.forEach((card, idx) => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // CORREGIDO v5.0.72: Usar data-route en lugar de índice para obtener la ruta exacta
      const routeData = this.dataset.route;
      if (!routeData) {
        console.error('❌ [POPUP] No se encontró data-route en la tarjeta');
        return;
      }
      
      try {
        const route = JSON.parse(routeData);
        console.log(`🖱️ [POPUP] Click en route-card:`, route.buyExchange, '→', route.sellExchange);
        
        // Remover selección previa
        container.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        
        // Mostrar guía paso a paso con la ruta exacta
        showRouteGuideFromData(route);
      } catch (error) {
        console.error('❌ [POPUP] Error al parsear data-route:', error);
      }
    });
  });
  
  console.log('✅ [POPUP] displayOptimizedRoutes() completado - HTML generado y aplicado');
}

// NUEVA FUNCIÓN v5.0.72: Mostrar guía desde datos de ruta directos (sin índice)
function showRouteGuideFromData(route) {
  console.log(`🔍 [POPUP] showRouteGuideFromData() llamado con ruta:`, route);
  
  if (!route) {
    console.warn(`❌ [POPUP] No hay datos de ruta disponibles`);
    return;
  }
  
  // Convertir ruta a formato de arbitraje para la guía
  const arbitrage = {
    broker: route.isSingleExchange ? route.buyExchange : `${route.buyExchange} → ${route.sellExchange}`,
    buyExchange: route.buyExchange || 'N/A',
    sellExchange: route.sellExchange || route.buyExchange || 'N/A',
    isSingleExchange: route.isSingleExchange || false,
    profitPercentage: route.profitPercentage || 0,
    officialPrice: route.officialPrice || 0,
  usdToUsdtRate: (typeof route.usdToUsdtRate === 'number' && isFinite(route.usdToUsdtRate)) ? route.usdToUsdtRate : null,
    usdtArsBid: route.usdtArsBid || 0,
    sellPrice: route.usdtArsBid || 0,
    transferFeeUSD: route.transferFeeUSD || 0,
    calculation: route.calculation || {},
    fees: route.fees || { trading: 0, withdrawal: 0 }
  };
  
  console.log('🔄 [POPUP] Arbitrage convertido:', arbitrage);
  
  selectedArbitrage = arbitrage;
  displayStepByStepGuide(arbitrage);
  
  // Cambiar a la pestaña de guía
  const guideTab = document.querySelector('[data-tab="guide"]');
  if (guideTab) {
    console.log('✅ [POPUP] Cambiando a pestaña de guía');
    guideTab.click();
  } else {
    console.error('❌ [POPUP] No se encontró el botón de la pestaña guía');
  }
}

// FUNCIÓN LEGACY v5.0.5: Mostrar guía de una ruta optimizada (POR ÍNDICE - DEPRECADO en v5.0.72)
// Mantener para compatibilidad pero ya no se usa
function showRouteGuide(index) {
  console.log(`🔍 [POPUP] showRouteGuide() llamado con índice: ${index}`);
  console.log(`🔍 [POPUP] currentData existe:`, !!currentData);
  console.log(`🔍 [POPUP] currentData.optimizedRoutes existe:`, !!currentData?.optimizedRoutes);
  console.log(`🔍 [POPUP] currentData.optimizedRoutes.length:`, currentData?.optimizedRoutes?.length);
  
  if (!currentData?.optimizedRoutes?.[index]) {
    console.warn(`❌ [POPUP] No hay ruta disponible para el índice: ${index}`);
    console.warn(`   currentData:`, currentData);
    return;
  }
  
  const route = currentData.optimizedRoutes[index];
  console.log(`✅ [POPUP] Ruta encontrada para índice ${index}:`, route);
  
  // Convertir ruta a formato de arbitraje para la guía
  const arbitrage = {
    broker: route.isSingleExchange ? route.buyExchange : `${route.buyExchange} → ${route.sellExchange}`,
    buyExchange: route.buyExchange || 'N/A',
    sellExchange: route.sellExchange || route.buyExchange || 'N/A',
    isSingleExchange: route.isSingleExchange || false,
    profitPercentage: route.profitPercentage || route.profitPercent || 0,
    officialPrice: route.officialPrice || 0,
  usdToUsdtRate: (typeof route.usdToUsdtRate === 'number' && isFinite(route.usdToUsdtRate)) ? route.usdToUsdtRate : null,
    usdtArsBid: route.usdtArsBid || 0,
    sellPrice: route.usdtArsBid || 0,
    transferFeeUSD: route.transferFeeUSD || 0,
    calculation: route.calculation || {},
    fees: route.fees || { trading: 0, withdrawal: 0 }
  };
  
  console.log('🔄 [POPUP] Arbitrage convertido:', arbitrage);
  
  selectedArbitrage = arbitrage;
  displayStepByStepGuide(arbitrage);
  
  // Cambiar a la pestaña de guía
  const guideTab = document.querySelector('[data-tab="guide"]');
  if (guideTab) {
    console.log('✅ [POPUP] Cambiando a pestaña de guía');
    guideTab.click();
  } else {
    console.error('❌ [POPUP] No se encontró el botón de la pestaña guía');
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

// Función helper para calcular clases de profit
function getProfitClasses(profitPercent) {
  const isNegative = profitPercent < 0;
  const isHighProfit = profitPercent > 5;
  
  let profitClass;
  if (isNegative) {
    profitClass = 'negative-profit';
  } else if (isHighProfit) {
    profitClass = 'high-profit';
  } else {
    profitClass = '';
  }
  
  let profitBadgeClass;
  if (isNegative) {
    profitBadgeClass = 'negative';
  } else if (isHighProfit) {
    profitBadgeClass = 'high';
  } else {
    profitBadgeClass = '';
  }
  
  return { isNegative, profitClass, profitBadgeClass };
}

// Calcular valores para la guía paso a paso
function calculateGuideValues(arb) {
  const calc = arb.calculation || {};
  
  // CORREGIDO v5.0.71: Usar profitPercentage de calculation para consistencia
  // Si existe calculation.profitPercentage, usarlo; sino usar el top-level
  const correctProfitPercentage = calc.profitPercentage !== undefined 
    ? calc.profitPercentage 
    : arb.profitPercentage || 0;
  
  return {
    estimatedInvestment: calc.initial || 100000,
    officialPrice: arb.officialPrice || 1000,
    usdAmount: calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000)),
    usdtAfterFees: calc.usdtAfterFees || (calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))),
    sellPrice: arb.sellPrice || arb.usdtArsBid || 1000,
    arsFromSale: calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000)),
    finalAmount: calc.finalAmount || (calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000))),
    profit: calc.netProfit || ((calc.finalAmount || calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000))) - (calc.initial || 100000)),
    profitPercentage: correctProfitPercentage,  // USAR EL VALOR CORRECTO
  usdToUsdtRate: (typeof arb.usdToUsdtRate === 'number' && isFinite(arb.usdToUsdtRate)) ? arb.usdToUsdtRate : null,
    usdtArsBid: arb.usdtArsBid || (arb.sellPrice || 1000),
    fees: arb.fees || { trading: 0, withdrawal: 0, total: 0 },
    broker: arb.broker || 'Exchange'
  };
}

// Generar HTML del header de la guía
function generateGuideHeader(broker, profitPercentage) {
  const isProfitable = profitPercentage >= 0;
  return `
    <div class="guide-header-simple">
      <div class="guide-title">
        <h3>📋 Cómo hacer el arbitraje en <span class="broker-name">${sanitizeHTML(broker)}</span></h3>
      </div>
      <div class="profit-badge ${isProfitable ? 'profit-positive' : 'profit-negative'}">
        <span class="profit-icon">${isProfitable ? '📈' : '📉'}</span>
        <span class="profit-text">
          ${isProfitable ? 'Ganancia' : 'Pérdida'}: 
          <strong>${isProfitable ? '+' : ''}${formatNumber(profitPercentage)}%</strong>
        </span>
      </div>
    </div>
  `;
}

// Generar HTML de los pasos de la guía (SIMPLIFICADO)
function generateGuideSteps(values) {
  const { estimatedInvestment, officialPrice, usdAmount, usdToUsdtRate, usdtAfterFees, usdtArsBid, arsFromSale, finalAmount, profit, profitPercentage, broker } = values;

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
            💡 Verifica los límites actuales con tu banco
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
            <span class="calc-value">${formatUsdUsdtRatio(usdToUsdtRate)} USD = 1 USDT</span>
            <span class="calc-arrow">→</span>
            <span class="calc-result">${formatNumber(usdtAfterFees)} USDT</span>
          </div>
          ${ (typeof usdToUsdtRate === 'number' && isFinite(usdToUsdtRate) && usdToUsdtRate > 1.005) ? `
          <div class="step-simple-warning">
            ⚠️ El exchange cobra ${formatCommissionPercent((usdToUsdtRate - 1) * 100)}% para esta conversión
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
            <span class="calc-result">$${formatNumber(finalAmount)}</span>
          </div>
          <div class="profit-summary ${profit >= 0 ? 'positive' : 'negative'}">
            <div class="profit-main">
              <span class="profit-icon">${profit >= 0 ? '📈' : '📉'}</span>
              <span class="profit-amount">${profit >= 0 ? '+' : ''}$${formatNumber(profit)}</span>
              <span class="profit-percent">(${profit >= 0 ? '+' : ''}${formatNumber(profitPercentage)}%)</span>
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
  // Función helper para animar elementos
  function animateStep(entry, index) {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('active');
      }, index * 100);
    }
  }

  // Activar animaciones de progreso al hacer scroll
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(animateStep);
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
  console.log('📝 [POPUP] displayStepByStepGuide() llamado con:', arb);

  const container = document.getElementById('selected-arbitrage-guide');
  if (!container) {
    console.error('❌ [POPUP] No se encontró el contenedor selected-arbitrage-guide');
    return;
  }

  console.log('✅ [POPUP] Contenedor de guía encontrado:', container);

  // Validar datos mínimos necesarios
  if (!arb.broker) {
    console.error('❌ [POPUP] Datos incompletos del arbitraje:', arb);
    container.innerHTML = '<p class="error">❌ Error: Datos incompletos del arbitraje</p>';
    return;
  }

  // Calcular valores usando función auxiliar
  const values = calculateGuideValues(arb);
  console.log('📊 [POPUP] Valores calculados para la guía:', values);

  // Generar HTML completo usando funciones auxiliares (SIMPLIFICADO)
  const html = `
    <div class="guide-container-simple">
      ${generateGuideHeader(values.broker, values.profitPercentage)}
      ${generateGuideSteps(values)}
    </div>
  `;

  console.log('📄 [POPUP] HTML generado, insertando en container...');
  container.innerHTML = html;
  console.log('✅ [POPUP] HTML insertado correctamente');

  // Configurar animaciones y event listeners
  setupGuideAnimations(container);
  console.log('✅ [POPUP] Guía paso a paso mostrada correctamente');
}

// Cargar datos de bancos
function loadBanksData() {
  // Configurar event listener para el botón de refresh
  const refreshBtn = document.getElementById('refresh-banks');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadBankRates);
  }
  
  // Cargar datos iniciales automáticamente cuando se abre la pestaña
  loadBankRates();
}

// Mostrar lista de bancos desde dolarito.ar + criptoya
async function displayBanks(bankRates) {
  const container = document.getElementById('banks-list');
  
  if (!bankRates || Object.keys(bankRates).length === 0) {
    container.innerHTML = `
      <div class="select-prompt">
        <p>📊 No hay datos de bancos disponibles</p>
        <p style="margin-top: 8px; font-size: 0.85em;">Presiona el botón "Actualizar" para cargar las cotizaciones desde dolarito.ar y CriptoYa</p>
      </div>
    `;
    return;
  }
  
  // Obtener configuración de usuario
  const showBestOnly = userSettings?.showBestBankPrice ?? false;
  const selectedBanks = userSettings?.selectedBanks ?? [];
  
  let banks = Object.entries(bankRates);
  
  // Filtrar bancos seleccionados si hay selección específica
  if (selectedBanks.length > 0) {
    banks = banks.filter(([bankCode]) => selectedBanks.includes(bankCode));
  }
  
  // Ordenar por precio de compra más bajo
  banks.sort((a, b) => a[1].compra - b[1].compra);
  
  // Si solo mostrar mejor precio, mostrar solo el primero
  if (showBestOnly && banks.length > 0) {
    const [bestBankCode, bestRates] = banks[0];
    const bestBankName = getBankDisplayName(bestBankCode);
    
    container.innerHTML = `
      <div class="best-bank-highlight">
        <div class="best-bank-header">
          <div class="best-bank-icon">🏆</div>
          <div class="best-bank-title">Mejor Precio de Compra</div>
        </div>
        <div class="best-bank-content">
          <div class="best-bank-name">${bestBankName}</div>
          <div class="best-bank-price">$${formatNumber(bestRates.compra)}</div>
          <div class="best-bank-source">Fuente: ${bestRates.source === 'dolarito' ? 'dolarito.ar' : 'CriptoYa'}</div>
        </div>
      </div>
    `;
    updateBanksTimestamp();
    return;
  }
  
  // Mostrar todos los bancos (modo normal compacto)
  let html = '';
  
  banks.forEach(([bankCode, rates]) => {
    const bankName = getBankDisplayName(bankCode);
    const spread = rates.venta - rates.compra;
    const spreadPercent = ((spread / rates.compra) * 100).toFixed(2);
    
    // Determinar fuente(s)
    let sourceText = rates.source === 'dolarito' ? 'dolarito.ar' : 'CriptoYa';
    let hasCriptoya = rates.criptoya ? true : false;
    
    html += `
      <div class="bank-card compact">
        <div class="bank-header-compact">
          <div class="bank-name">${bankName}</div>
          <div class="bank-source-compact">${sourceText}${hasCriptoya ? '+C' : ''}</div>
        </div>
        <div class="bank-prices-compact">
          <div class="bank-price-compact">
            <span class="price-label">Compra:</span>
            <span class="price-value">$${formatNumber(rates.compra)}</span>
            ${hasCriptoya ? `<span class="price-alt">(C:$${formatNumber(rates.criptoya.compra)})</span>` : ''}
          </div>
          <div class="bank-price-compact">
            <span class="price-label">Venta:</span>
            <span class="price-value">$${formatNumber(rates.venta)}</span>
            ${hasCriptoya ? `<span class="price-alt">(C:$${formatNumber(rates.criptoya.venta)})</span>` : ''}
          </div>
          <div class="bank-spread-compact">Spread: ${spreadPercent}%</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Actualizar timestamp
  updateBanksTimestamp();
}

// Obtener nombre legible del banco
function getBankDisplayName(bankCode) {
  const bankNames = {
    'nacion': 'Banco Nación',
    'bbva': 'BBVA',
    'piano': 'Banco Piano',
    'hipotecario': 'Banco Hipotecario',
    'galicia': 'Banco Galicia',
    'santander': 'Banco Santander',
    'ciudad': 'Banco Ciudad',
    'supervielle': 'Banco Supervielle',
    'patagonia': 'Banco Patagonia',
    'comafi': 'Banco Comafi',
    'icbc': 'ICBC',
    'bind': 'Bind',
    'bancor': 'Bancor',
    'chaco': 'Banco Chaco',
    'pampa': 'Banco Pampa',
    'promedio': 'Promedio Bancos',
    'menor_valor': 'Menor Valor'
  };
  
  return bankNames[bankCode] || bankCode.charAt(0).toUpperCase() + bankCode.slice(1);
}

// Actualizar timestamp de bancos
function updateBanksTimestamp() {
  const timestampEl = document.getElementById('banks-last-update');
  if (timestampEl) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-AR');
    timestampEl.textContent = `Actualizado: ${timeStr}`;
  }
}

// CORREGIDO v5.0.69: Función para cargar cotizaciones bancarias reales
async function loadBankRates() {
  const container = document.getElementById('banks-list');
  const refreshBtn = document.getElementById('refresh-banks');
  
  // Mostrar loading
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando cotizaciones bancarias...</p>
    </div>
  `;
  
  // Deshabilitar botón mientras carga
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⏳ Cargando...';
  }
  
  try {
    // Solicitar datos al background
    const response = await chrome.runtime.sendMessage({ action: 'getBankRates' });
    
    if (response && response.bankRates) {
      console.log('[POPUP] 🏦 Cotizaciones bancarias recibidas:', Object.keys(response.bankRates).length, 'bancos');
      await displayBanks(response.bankRates);
    } else {
      // Sin datos disponibles
      container.innerHTML = `
        <div class="select-prompt">
          <p>📊 No hay cotizaciones bancarias disponibles</p>
          <p style="margin-top: 8px; font-size: 0.85em;">
            Los datos se obtienen automáticamente de <strong>dolarito.ar</strong> y <strong>CriptoYa</strong>
          </p>
          <p style="margin-top: 8px; font-size: 0.85em; color: #94a3b8;">
            Intenta actualizar nuevamente en unos momentos
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[POPUP] ❌ Error al cargar cotizaciones bancarias:', error);
    container.innerHTML = `
      <div class="select-prompt">
        <p>⚠️ Error al cargar cotizaciones bancarias</p>
        <p style="margin-top: 8px; font-size: 0.85em; color: #ef4444;">
          ${error.message || 'Error desconocido'}
        </p>
        <p style="margin-top: 8px; font-size: 0.85em; color: #94a3b8;">
          Intenta actualizar nuevamente
        </p>
      </div>
    `;
  } finally {
    // Rehabilitar botón
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Actualizar';
    }
  }
}

// Actualizar timestamp con indicador de frescura
function updateLastUpdateTimestamp(timestamp) {
  const container = document.getElementById('last-update');
  if (!timestamp) {
    container.innerHTML = '<span class="status-stale">🔴 Sin datos de actualización</span>';
    return;
  }
  
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('es-AR');
  
  // NUEVO v5.0.74: Indicador de frescura mejorado
  const freshness = getDataFreshnessLevel(timestamp);
  
  container.innerHTML = `
    <span class="freshness-indicator" style="color: ${freshness.color}">${freshness.icon}</span>
    <span class="timestamp-text">${timeStr}</span>
    ${freshness.ageMinutes !== null ? `<span class="age-text">(hace ${freshness.ageMinutes} min)</span>` : ''}
  `;
  
  // Agregar clase CSS según nivel de frescura
  container.className = `last-update-container ${freshness.level}`;
  
  // NUEVO v5.0.74: Mostrar advertencia si datos muy desactualizados
  if (freshness.level === 'stale' && freshness.ageMinutes > 5) {
    showDataFreshnessWarning(freshness.ageMinutes);
  }
}

/**
 * Mostrar advertencia de datos desactualizados
 */
function showDataFreshnessWarning(ageMinutes) {
  const warningContainer = document.getElementById('data-warning');
  if (!warningContainer) return;
  
  warningContainer.innerHTML = `
    <div class="warning-banner stale-data">
      <span class="warning-icon">⚠️</span>
      <span class="warning-text">Los datos tienen más de ${ageMinutes} minutos. Actualiza para ver precios frescos.</span>
      <button class="warning-refresh-btn" onclick="fetchAndDisplay()">🔄 Actualizar</button>
    </div>
  `;
  warningContainer.style.display = 'block';
}

// NUEVO v5.0.31: Configuración del simulador (sin rutas)
function setupAdvancedSimulator() {
  const toggleBtn = document.getElementById('toggle-advanced');
  const advancedConfig = document.getElementById('advanced-config');
  const resetConfigBtn = document.getElementById('btn-reset-config');
  
  // Toggle configuración avanzada
  toggleBtn.addEventListener('click', () => {
    const isVisible = advancedConfig.style.display !== 'none';
    advancedConfig.style.display = isVisible ? 'none' : 'block';
    toggleBtn.textContent = isVisible ? '⚙️ Parámetros de Cálculo' : '🔽 Parámetros de Cálculo';
  });
  
  // Generar matriz de riesgo
  const generateRiskMatrixBtn = document.getElementById('generate-risk-matrix');
  if (generateRiskMatrixBtn) {
    generateRiskMatrixBtn.addEventListener('click', generateRiskMatrix);
  }
  
  // Filtros de la matriz
  const applyFilterBtn = document.getElementById('apply-matrix-filter');
  const resetFilterBtn = document.getElementById('reset-matrix-filter');
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', applyMatrixFilter);
  }
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', resetMatrixFilter);
  }
  
  // Reset configuración
  resetConfigBtn.addEventListener('click', resetSimulatorConfig);
  
  // Cargar valores por defecto al iniciar
  loadDefaultSimulatorValues();
}

function loadDefaultSimulatorValues() {
  // Cargar valores desde la configuración del usuario y datos actuales
  const officialPrice = currentData?.dollarPrice || 950;
  
  // Verificar que los elementos existan antes de asignar valores
  const usdBuyInput = document.getElementById('sim-usd-buy-price');
  const usdSellInput = document.getElementById('sim-usd-sell-price');
  const buyFeeInput = document.getElementById('sim-buy-fee');
  const sellFeeInput = document.getElementById('sim-sell-fee');
  const transferFeeInput = document.getElementById('sim-transfer-fee-usd');
  const bankCommissionInput = document.getElementById('sim-bank-commission');
  
  if (!usdBuyInput || !usdSellInput || !buyFeeInput || !sellFeeInput || !transferFeeInput || !bankCommissionInput) {
    console.warn('⚠️ No se encontraron todos los inputs del simulador');
    return;
  }
  
  // Precios del dólar
  usdBuyInput.value = officialPrice.toFixed(2);
  usdSellInput.value = (officialPrice * 1.02).toFixed(2);
  
  // Fees desde configuración
  const buyFee = (userSettings?.extraTradingFee || 0) + 1.0; // 1% base + extra
  const sellFee = (userSettings?.extraTradingFee || 0) + 1.0;
  const transferFee = userSettings?.transferFeeUSD || 0;
  const bankCommission = userSettings?.bankCommissionFee || 0;
  
  buyFeeInput.value = buyFee.toFixed(2);
  sellFeeInput.value = sellFee.toFixed(2);
  transferFeeInput.value = transferFee.toFixed(2);
  bankCommissionInput.value = bankCommission.toFixed(2);
  
  console.log('✅ Valores por defecto cargados en simulador:', {
    usdPrice: officialPrice,
    buyFee,
    sellFee,
    transferFee,
    bankCommission
  });
}

function resetSimulatorConfig() {
  // Verificar que los elementos existan
  const elements = {
    usdBuy: document.getElementById('sim-usd-buy-price'),
    usdSell: document.getElementById('sim-usd-sell-price'),
    buyFee: document.getElementById('sim-buy-fee'),
    sellFee: document.getElementById('sim-sell-fee'),
    transferFee: document.getElementById('sim-transfer-fee-usd'),
    bankCommission: document.getElementById('sim-bank-commission'),
    matrixMin: document.getElementById('matrix-min-percent'),
    matrixMax: document.getElementById('matrix-max-percent'),
    matrixStep: document.getElementById('matrix-step-percent')
  };
  
  // Verificar que todos existan
  const missingElements = Object.entries(elements)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missingElements.length > 0) {
    console.warn('⚠️ Elementos faltantes en resetSimulatorConfig:', missingElements);
    return;
  }
  
  // Reset a valores por defecto
  elements.usdBuy.value = '';
  elements.usdSell.value = '';
  elements.buyFee.value = '1.0';
  elements.sellFee.value = '1.0';
  elements.transferFee.value = '0';
  elements.bankCommission.value = '0';
  elements.matrixMin.value = '0';
  elements.matrixMax.value = '2';
  elements.matrixStep.value = '0.5';
  
  // Recargar valores desde configuración
  loadDefaultSimulatorValues();
  
  console.log('✅ Configuración del simulador reseteada');
}

// NUEVO v5.0.31: Generar Matriz de Riesgo mejorada (sin rutas)
async function generateRiskMatrix(useCustomParams = false) {
  console.log('🔍 [MATRIZ] Iniciando generateRiskMatrix...', useCustomParams ? 'con parámetros personalizados' : 'con datos automáticos');
  console.log('🔍 [MATRIZ] currentData:', currentData ? 'existe' : 'null');
  console.log('🔍 [MATRIZ] currentData.banks:', currentData?.banks ? Object.keys(currentData.banks).length + ' bancos' : 'no existe');
  console.log('🔍 [MATRIZ] currentData.usdt:', currentData?.usdt ? Object.keys(currentData.usdt).length + ' exchanges' : 'no existe');

  const amountInput = document.getElementById('sim-amount');
  const amount = parseFloat(amountInput?.value) || 1000000;

  // Validar monto
  if (!amount || amount < 1000) {
    alert('⚠️ Ingresa un monto válido (mínimo $1,000 ARS)');
    return;
  }

  let usdPrices = [];
  let usdtPrices = [];

  if (useCustomParams) {
    // MODO PERSONALIZADO: Usar valores de los inputs
    log('[MATRIZ] Usando parámetros personalizados del usuario');
    const usdMinInput = parseFloat(document.getElementById('matrix-usd-min')?.value) || (currentData?.oficial?.compra || 1000);
    const usdMaxInput = parseFloat(document.getElementById('matrix-usd-max')?.value) || (currentData?.oficial?.compra * 1.5 || 1500);
    const usdtMinInput = parseFloat(document.getElementById('matrix-usdt-min')?.value) || 1000;
    const usdtMaxInput = parseFloat(document.getElementById('matrix-usdt-max')?.value) || 1100;

    // Validaciones de rangos para modo personalizado
    if (usdMinInput >= usdMaxInput) {
      alert('⚠️ El USD mínimo debe ser menor que el USD máximo');
      return;
    }
    if (usdtMinInput >= usdtMaxInput) {
      alert('⚠️ El USDT mínimo debe ser menor que el USDT máximo');
      return;
    }

    // Generar valores equidistantes para modo personalizado
    for (let i = 0; i < 5; i++) {
      usdPrices.push(usdMinInput + (usdMaxInput - usdMinInput) * i / 4);
      usdtPrices.push(usdtMinInput + (usdtMaxInput - usdtMinInput) * i / 4);
    }

    log('[MATRIZ] Parámetros personalizados - USD:', usdPrices.map(p => p.toFixed(2)), 'USDT:', usdtPrices.map(p => p.toFixed(2)));
  } else {
    // MODO AUTOMÁTICO: Usar lógica dinámica con datos reales
    log('[MATRIZ] Usando modo automático con datos dinámicos');

    // Intentar obtener datos de bancos del consenso actual
    if (!currentData || !currentData.banks || Object.keys(currentData.banks).length === 0) {
      log('[MATRIZ] No hay datos de bancos, intentando cargar...');
      try {
        await loadBankRates();
        // Pequeña pausa para asegurar que los datos se guarden
        await new Promise(resolve => setTimeout(resolve, 500));
        log('[MATRIZ] Datos de bancos cargados:', currentData?.banks ? Object.keys(currentData.banks).length + ' bancos' : 'falló');
      } catch (error) {
        console.warn('[MATRIZ] Error cargando bancos:', error);
      }
    }

    // Procesar datos de bancos para USD
    if (currentData && currentData.banks) {
      log('[MATRIZ] Procesando datos de bancos...');
      const bankCompraPrices = Object.values(currentData.banks)
        .filter(bank => bank.compra && bank.compra > 0)
        .map(bank => bank.compra)
        .sort((a, b) => a - b);

      log('[MATRIZ] Precios de compra encontrados:', bankCompraPrices.length, 'bancos');

      if (bankCompraPrices.length >= 1) {
        // USD mínimo = menor precio de compra de bancos principales
        // USD máximo = mínimo + 50%
        const usdMin = Math.min(...bankCompraPrices);
        const usdMax = usdMin * 1.5; // +50% sobre el mínimo

        // Generar 5 puntos equidistantes entre min y max
        for (let i = 0; i < 5; i++) {
          usdPrices.push(usdMin + (usdMax - usdMin) * i / 4);
        }

        log('[MATRIZ] USD - Mínimo de bancos:', usdMin.toFixed(2), 'Máximo (min+50%):', usdMax.toFixed(2));
        log('[MATRIZ] Precios USD generados:', usdPrices.length, 'valores');
      }
    }

    // Si no hay datos de bancos, usar precio oficial o fallback
    if (usdPrices.length === 0) {
      const usdMin = currentData?.oficial?.compra || parseFloat(document.getElementById('matrix-usd-min')?.value) || 1000;
      const usdMax = usdMin * 1.5;
      for (let i = 0; i < 5; i++) {
        usdPrices.push(usdMin + (usdMax - usdMin) * i / 4);
      }
      log('[MATRIZ] Usando precio oficial o fallback para USD:', usdMin.toFixed(2));
    }

    // Procesar datos de exchanges USDT
    if (currentData && currentData.usdt) {
      log('[MATRIZ] Procesando datos de USDT...');
      const usdtSellPrices = Object.values(currentData.usdt)
        .filter(exchange => exchange.venta && exchange.venta > 0)
        .map(exchange => exchange.venta)
        .sort((a, b) => b - a); // Orden descendente para tomar los más altos primero

      log('[MATRIZ] Precios de venta USDT encontrados:', usdtSellPrices.length, 'exchanges');

      if (usdtSellPrices.length >= 5) {
        // Tomar exactamente los 5 precios más altos
        usdtPrices = usdtSellPrices.slice(0, 5);
        log('[MATRIZ] Usando los 5 precios USDT venta más altos');
      } else if (usdtSellPrices.length >= 1) {
        // Si hay menos de 5, usar todos los disponibles
        usdtPrices = usdtSellPrices;
        log('[MATRIZ] Usando todos los precios USDT disponibles:', usdtPrices.length);
      }
    }

    // Si no hay datos de exchanges, usar valores por defecto
    if (usdtPrices.length === 0) {
      const usdtMin = parseFloat(document.getElementById('matrix-usdt-min')?.value) || 1000;
      const usdtMax = parseFloat(document.getElementById('matrix-usdt-max')?.value) || 1100;
      for (let i = 0; i < 5; i++) {
        usdtPrices.push(usdtMin + (usdtMax - usdtMin) * i / 4);
      }
      log('[MATRIZ] Usando precios USDT por defecto');
    }
  }

  // Validaciones finales de rangos
  const finalUsdMin = Math.min(...usdPrices);
  const finalUsdMax = Math.max(...usdPrices);
  const finalUsdtMin = Math.min(...usdtPrices);
  const finalUsdtMax = Math.max(...usdtPrices);

  if (finalUsdMin >= finalUsdMax) {
    alert('⚠️ Error: Los precios USD no son válidos');
    return;
  }
  if (finalUsdtMin >= finalUsdtMax) {
    alert('⚠️ Error: Los precios USDT no son válidos');
    return;
  }

  // Obtener parámetros configurables
  const buyFeePercent = parseFloat(document.getElementById('sim-buy-fee')?.value) || 1.0;
  const sellFeePercent = parseFloat(document.getElementById('sim-sell-fee')?.value) || 1.0;
  const transferFeeUSD = parseFloat(document.getElementById('sim-transfer-fee-usd')?.value) || 0;
  const bankCommissionPercent = parseFloat(document.getElementById('sim-bank-commission')?.value) || 0;

  // Validaciones de parámetros
  if (buyFeePercent < 0 || buyFeePercent > 10) {
    alert('⚠️ El fee de compra debe estar entre 0% y 10%');
    return;
  }
  if (sellFeePercent < 0 || sellFeePercent > 10) {
    alert('⚠️ El fee de venta debe estar entre 0% y 10%');
    return;
  }

  // Crear tabla HTML
  let tableHTML = '<thead><tr><th>USD Compra \\ USDT Venta</th>';
  usdtPrices.forEach(price => {
    tableHTML += `<th>$${price.toFixed(0)}</th>`;
  });
  tableHTML += '</tr></thead><tbody>';

  // Calcular rentabilidad para cada combinación
  usdPrices.forEach(usdPrice => {
    tableHTML += `<tr><td><strong>$${usdPrice.toFixed(0)}</strong></td>`;

    usdtPrices.forEach(usdtPrice => {
      // Calcular ganancia con estos precios
      const bankCommissionARS = amount * (bankCommissionPercent / 100);
      const amountAfterBankCommission = amount - bankCommissionARS;

      // Paso 1: Comprar USD
      const step1_usd = amountAfterBankCommission / usdPrice;

      // Paso 2: Comprar USDT con USD (usando tasa de conversión)
      const usdToUsdtRate = usdPrice / usdtPrice; // Tasa USD/USDT
      const step2_usdt = step1_usd / usdToUsdtRate;

      // Paso 3: Aplicar fee de compra
      const buyFeeDecimal = buyFeePercent / 100;
      const step2_usdtAfterFee = step2_usdt * (1 - buyFeeDecimal);

      // Paso 4: Fee de transferencia (si aplica)
      const transferFeeUSDT = transferFeeUSD / usdToUsdtRate;
      const step3_usdtAfterTransfer = step2_usdtAfterFee - transferFeeUSDT;

      // Paso 5: Vender USDT por ARS
      const step4_ars = step3_usdtAfterTransfer * usdtPrice;

      // Paso 6: Aplicar fee de venta
      const sellFeeDecimal = sellFeePercent / 100;
      const finalAmount = step4_ars * (1 - sellFeeDecimal);

      // Calcular ganancia
      const profit = finalAmount - amount;
      const profitPercent = (profit / amount) * 100;

      // Determinar clase CSS según rentabilidad
      let cellClass = 'matrix-cell-negative';
      if (profitPercent > 1.0) {
        cellClass = 'matrix-cell-positive';
      } else if (profitPercent >= 0) {
        cellClass = 'matrix-cell-neutral';
      }

      tableHTML += `<td class="${cellClass}" title="Ganancia: $${formatNumber(profit)} ARS (${profitPercent.toFixed(2)}%)">${profitPercent.toFixed(2)}%</td>`;
    });

    tableHTML += '</tr>';
  });

  tableHTML += '</tbody>';

  // Mostrar matriz
  const matrixTable = document.getElementById('risk-matrix-table');
  const matrixResult = document.getElementById('risk-matrix-result');

  if (!matrixTable || !matrixResult) {
    alert('⚠️ Error: elementos de la matriz no encontrados');
    return;
  }

  matrixTable.innerHTML = tableHTML;
  matrixResult.style.display = 'block';

  // Scroll hacia la matriz
  matrixResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// NUEVO v5.0.31: Funciones de filtrado de matriz
function applyMatrixFilter() {
  const minProfit = parseFloat(document.getElementById('filter-min-profit').value) || -5;
  const maxProfit = parseFloat(document.getElementById('filter-max-profit').value) || 10;
  
  const matrixTable = document.getElementById('risk-matrix-table');
  if (!matrixTable) return;
  
  const cells = matrixTable.querySelectorAll('td');
  let visibleCount = 0;
  let totalCells = 0;
  
  cells.forEach(cell => {
    // Skip header cells
    if (cell.tagName === 'TH' || cell.querySelector('strong')) return;
    
    const text = cell.textContent.trim();
    if (text.endsWith('%')) {
      totalCells++;
      const profitValue = parseFloat(text.replace('%', ''));
      
      if (profitValue >= minProfit && profitValue <= maxProfit) {
        cell.style.opacity = '1';
        cell.style.backgroundColor = '';
        visibleCount++;
      } else {
        cell.style.opacity = '0.2';
        cell.style.backgroundColor = '#333';
      }
    }
  });
  
  // Mostrar contador
  const filterResults = document.getElementById('filter-results');
  const filterCount = document.getElementById('filter-count');
  if (filterResults && filterCount) {
    filterCount.textContent = visibleCount;
    filterResults.style.display = 'block';
  }
}

function resetMatrixFilter() {
  const matrixTable = document.getElementById('risk-matrix-table');
  if (!matrixTable) return;
  
  const cells = matrixTable.querySelectorAll('td');
  cells.forEach(cell => {
    cell.style.opacity = '1';
    cell.style.backgroundColor = '';
  });
  
  // Ocultar contador
  const filterResults = document.getElementById('filter-results');
  if (filterResults) {
    filterResults.style.display = 'none';
  }
  
  // Reset valores de filtro
  document.getElementById('filter-min-profit').value = '-5';
  document.getElementById('filter-max-profit').value = '10';
}

// NUEVO: Configurar controles del precio del dólar
function setupDollarPriceControls() {
  const recalculateBtn = document.getElementById('recalculate-with-custom');
  const configureBtn = document.getElementById('configure-dollar');

  if (recalculateBtn) {
    recalculateBtn.addEventListener('click', showRecalculateDialog);
  }

  if (configureBtn) {
    configureBtn.addEventListener('click', openDollarConfiguration);
  }
}

// Mostrar información del precio del dólar
function displayDollarInfo(officialData) {
  const dollarInfo = document.getElementById('dollar-info');
  const dollarPrice = document.getElementById('dollar-current-price');
  const dollarSource = document.getElementById('dollar-source-text');

  if (!dollarInfo || !officialData) {
    if (dollarInfo) dollarInfo.style.display = 'none';
    return;
  }

  // CORREGIDO v5.0.35: Después del fix de campos API, mostrar precio de COMPRA (lo que pagamos por comprar USD)
  dollarPrice.textContent = `$${formatNumber(officialData.compra)}`;
  dollarSource.textContent = `Fuente: ${getDollarSourceDisplay(officialData)}`;

  // Mostrar la información
  dollarInfo.style.display = 'block';
}

// MEJORADO v5.0.48: Recálculo funcional con opción de cambiar precio
async function showRecalculateDialog() {
  // Obtener configuración actual
  const settings = await chrome.storage.local.get('notificationSettings');
  const userSettings = settings.notificationSettings || {};
  
  const currentPrice = currentData?.oficial?.compra || 1000;
  const isManual = userSettings.dollarPriceSource === 'manual';
  
  const message = isManual 
    ? `💵 Precio manual actual: $${currentPrice.toFixed(2)}\n\n` +
      'Puedes cambiarlo en Configuración o ingresa un nuevo valor temporal:'
    : `💵 Precio automático actual: $${currentPrice.toFixed(2)}\n\n` +
      'Para usar un precio personalizado, activa "Precio manual" en Configuración.\n\n' +
      'Por ahora, ¿quieres cambiar temporalmente a modo manual?';
  
  const customPrice = prompt(message, currentPrice.toFixed(2));

  if (customPrice && !isNaN(customPrice) && parseFloat(customPrice) > 0) {
    const price = parseFloat(customPrice);
    
    // Actualizar a modo manual con el nuevo precio
    const newSettings = {
      ...userSettings,
      dollarPriceSource: 'manual',
      manualDollarPrice: price
    };
    
    // Guardar en storage (esto disparará el listener en background)
    await chrome.storage.local.set({ notificationSettings: newSettings });
    
    // Mostrar confirmación
    alert(`✅ Precio actualizado a $${price.toFixed(2)}\n\nRecalculando rutas...`);
    
    // Esperar un momento para que el background procese
    setTimeout(() => {
      fetchAndDisplay(true); // Forzar actualización
    }, 500);
  } else if (!customPrice) {
    // Usuario canceló, solo refrescar datos actuales
    fetchAndDisplay(true);
  }
}

// Abrir configuración del precio del dólar
function openDollarConfiguration() {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/options.html') });
}

// ==========================================
// SISTEMA DE NOTIFICACIÓN DE ACTUALIZACIONES
// ==========================================

// Verificar si hay actualizaciones disponibles
async function checkForUpdates() {
  try {
    const result = await chrome.storage.local.get('updateAvailable');
    const updateInfo = result.updateAvailable;
    
    if (updateInfo && updateInfo.available) {
      showUpdateBanner(updateInfo);
    }
  } catch (error) {
    console.error('Error verificando actualizaciones:', error);
  }
}

// Mostrar banner de actualización
function showUpdateBanner(updateInfo) {
  const banner = document.getElementById('update-banner');
  const messageEl = document.getElementById('update-message');
  const newVersionEl = document.getElementById('new-version');
  
  if (!banner || !messageEl) return;
  
  // Obtener versión actual del manifest
  const currentVersion = chrome.runtime.getManifest().version;
  
  // Actualizar mensaje del commit
  const message = updateInfo.message || 'Nueva versión disponible';
  messageEl.textContent = message.substring(0, 80) + (message.length > 80 ? '...' : '');
  
  // Mostrar versión nueva (primeros 7 caracteres del SHA)
  if (newVersionEl && updateInfo.version) {
    const shortSha = updateInfo.version.substring(0, 7);
    newVersionEl.textContent = `commit ${shortSha}`;
  }
  
  // Mostrar banner
  banner.style.display = 'flex';
  
  // Configurar botones
  setupUpdateBannerButtons(updateInfo);
}

// Configurar botones del banner de actualización
function setupUpdateBannerButtons(updateInfo) {
  const viewBtn = document.getElementById('view-update');
  const dismissBtn = document.getElementById('dismiss-update');
  
  if (viewBtn) {
    viewBtn.onclick = () => {
      // Abrir URL del commit en GitHub
      if (updateInfo.url) {
        chrome.tabs.create({ url: updateInfo.url });
      }
    };
  }
  
  if (dismissBtn) {
    dismissBtn.onclick = async () => {
      // Ocultar banner
      const banner = document.getElementById('update-banner');
      if (banner) {
        banner.style.display = 'none';
      }
      
      // Marcar como visto en storage
      try {
        await chrome.storage.local.set({
          updateInfo: {
            dismissedVersion: updateInfo.version,
            lastCommitSha: updateInfo.version,
            dismissedAt: Date.now()
          },
          updateAvailable: {
            available: false
          }
        });
        
        console.log('✅ Actualización marcada como vista');
      } catch (error) {
        console.error('Error descartando actualización:', error);
      }
    };
  }
}

// Event listener global para botones de retry
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('retry-btn') && event.target.dataset.action === 'reload') {
    location.reload();
  }
});
