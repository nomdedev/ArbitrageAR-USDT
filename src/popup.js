// ==========================================
// ARBITRAGE AR - POPUP PRINCIPAL v5.0.84
// ==========================================
// Módulos utilizados (cargados en popup.html):
// - window.StateManager (src/utils/stateManager.js)
// - window.Formatters (src/utils/formatters.js)
// - window.Logger (src/utils/logger.js)
// - window.RouteRenderer (src/ui/routeRenderer.js)
// ==========================================
// REFACTORIZADO v5.0.84: Eliminado código duplicado
// - formatNumber, formatUsdUsdtRatio, formatCommissionPercent, getDollarSourceDisplay
//   ahora delegan completamente a módulo Formatters
// - getProfitClasses, getExchangeIcon delegan a RouteRenderer
// ==========================================

// Verificar que los módulos estén cargados
if (typeof window.StateManager === 'undefined') {
  console.error('❌ StateManager no está cargado');
}
if (typeof window.Formatters === 'undefined') {
  console.error('❌ Formatters no está cargado');
}
if (typeof window.Logger === 'undefined') {
  console.error('❌ Logger no está cargado');
}

// Aliases para compatibilidad con código legacy
const State = window.StateManager;
const Fmt = window.Formatters;
const Log = window.Logger;

// Estado global (legacy - sincronizado con StateManager)
let currentData = null;
let selectedArbitrage = null;
let userSettings = null; // NUEVO v5.0: Configuración del usuario
let currentFilter = 'no-p2p'; // CORREGIDO v5.0.12: Volver a 'no-p2p' pero con debug forzado
let allRoutes = []; // NUEVO: Cache de todas las rutas sin filtrar
const filteredRoutes = []; // NUEVO: Cache de rutas filtradas para navegación

// Estado global para filtros avanzados
let advancedFilters = {
  exchange: 'all',
  profitMin: 0,
  hideNegative: false,
  sortBy: 'profit-desc'
};

// Modo debug para reducir logs excesivos
const DEBUG_MODE = false; // PRODUCCIÓN: Desactivado después de diagnosticar problema

console.log('🚀 Popup.js cargado correctamente');

// Importar util para entornos CommonJS (tests Node) y hacer fallback para navegador
try {
  // En Node esto exportará la función
  const utils = require('./utils.js');
  if (utils && typeof utils.getProfitClasses === 'function') {
    global.getProfitClasses = utils.getProfitClasses;
  }
} catch (e) {
  // En navegador 'require' no está definido: dejamos que getProfitClasses esté definido en el scope global cuando se cargue desde <script>
}

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
  setupAdvancedSimulator(); // NUEVO v5.0.31: Configurar simulador sin rutas
  setupRouteDetailsModal(); // NUEVO: Configurar modal de detalles de ruta
  checkForUpdatesOnPopupLoad(); // NUEVO: Verificar actualizaciones al cargar el popup
  loadUserSettings(); // NUEVO v5.0.28: Cargar configuración del usuario
  setupCryptoArbitrageTab(); // NUEVO: Configurar pestaña de arbitraje cripto
  fetchAndDisplay();
  setupStorageListener(); // NUEVO: Escuchar cambios en configuración
  // loadBanksData(); // Ahora se carga solo cuando se activa la pestaña de bancos
});

/**
 * Configurar navegación de tabs principales
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remover clase active de todos los botones y contenidos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Agregar clase active al botón clickeado
      button.classList.add('active');

      // Mostrar contenido correspondiente
      const tabId = button.dataset.tab;
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      // Si es la pestaña de bancos, cargar los datos
      if (tabId === 'banks') {
        loadBanksData();
      }
    });
  });
}

// ==========================================
// FUNCIONES DE FORMATEO (delegadas a Formatters)
// ==========================================
// Nota: Estas funciones utilizan el módulo Formatters cargado globalmente (window.Formatters).
// Se usa directamente Fmt.formatNumber, Fmt.formatUsdUsdtRatio, etc. donde se necesite.
// No se redeclaran aquí para evitar conflictos de scope global.

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
  chrome.storage.local.get('notificationSettings', result => {
    const settings = result.notificationSettings || {};

    log(`⚙️ Cargando configuración: manualDollarPrice = ${settings.manualDollarPrice}`);

    userSettings = {
      // Notificaciones
      notificationsEnabled: settings.notificationsEnabled !== false,
      alertType: settings.alertType || 'all',
      customThreshold: settings.customThreshold || 5,
      notificationFrequency: settings.notificationFrequency || '15min',
      soundEnabled: settings.soundEnabled !== false,
      quietHours: settings.quietHours || false,
      quietStart: settings.quietStart || '22:00',
      quietEnd: settings.quietEnd || '08:00',

      // Exchanges preferidos
      preferredExchanges: settings.preferredExchanges || [],

      // Validación y seguridad
      dataFreshnessWarning: settings.dataFreshnessWarning !== false,
      riskAlertsEnabled: settings.riskAlertsEnabled !== false,
      requireConfirmHighAmount: settings.requireConfirmHighAmount !== false,
      highAmountThreshold: settings.highAmountThreshold || 500000,
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
      brokerFees: settings.brokerFees || [], // Array de fees por broker

      // APIs configurables
      dolarApiUrl: settings.dolarApiUrl || 'https://dolarapi.com/v1/dolares/oficial',
      criptoyaUsdtArsUrl: settings.criptoyaUsdtArsUrl || 'https://criptoya.com/api/usdt/ars/1',
      criptoyaUsdtUsdUrl: settings.criptoyaUsdtUsdUrl || 'https://criptoya.com/api/usdt/usd/1',
      updateIntervalMinutes: settings.updateIntervalMinutes || 5,
      requestTimeoutSeconds: settings.requestTimeoutSeconds || 10,

      // Configuración de precio del dólar
      dollarPriceSource: settings.dollarPriceSource || 'auto',
      manualDollarPrice: settings.manualDollarPrice || 1400,
      preferredBank: settings.preferredBank || 'consenso',

      // Configuración de bancos
      showBestBankPrice: settings.showBestBankPrice || false,
      selectedBanks: settings.selectedBanks || ['nacion', 'galicia', 'santander', 'bbva', 'icbc'],

      // NUEVO v5.0.76: Configuración de interfaz consolidada
      simulatorDefaultAmount: settings.simulatorDefaultAmount || 100000,
      interfaceMinProfitDisplay: settings.interfaceMinProfitDisplay || -10,
      interfaceMaxRoutesDisplay: settings.interfaceMaxRoutesDisplay || 20,
      interfaceSortByProfit: settings.interfaceSortByProfit !== false,
      interfaceShowOnlyProfitable: settings.interfaceShowOnlyProfitable || false,
      interfacePreferSingleExchange: settings.interfacePreferSingleExchange || false,
      interfaceShowProfitColors: settings.interfaceShowProfitColors !== false,
      interfaceCompactView: settings.interfaceCompactView || false,
      interfaceShowExchangeIcons: settings.interfaceShowExchangeIcons !== false,
      interfaceShowTimestamps: settings.interfaceShowTimestamps || false,
      interfaceShowBankPrices: settings.interfaceShowBankPrices !== false,
      interfaceBankDisplayMode: settings.interfaceBankDisplayMode || 'top-3',
      interfaceBankUpdateInterval: settings.interfaceBankUpdateInterval || 10
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
    html += ' <span class="age-text">Datos: Sin timestamp</span>';
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

      // Aplicar filtro y sincronizar con StateManager
      currentFilter = filter;
      if (State) {
        State.setFilter(filter);
      }
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
    if (DEBUG_MODE) {
      console.log(`🔍 ${route.broker}: P2P detectado por exchanges (${buyName}, ${sellName})`);
    }
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
      if (DEBUG_MODE) console.log(`🔍 Filtro P2P: ${filteredRoutes.length} rutas P2P de ${allRoutes.length}`);
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
    console.log('🔍 [DIAGNÓSTICO POPUP] applyAllFilters() - No hay rutas:', {
      allRoutesIsNull: !allRoutes,
      allRoutesLength: allRoutes?.length || 0,
      currentFilter: currentFilter,
      userSettings: userSettings ? {
        interfaceMinProfitDisplay: userSettings.interfaceMinProfitDisplay,
        interfaceMaxRoutesDisplay: userSettings.interfaceMaxRoutesDisplay
      } : null
    });
    return;
  }

  // Usar configuraciones de interfaz centralizadas en lugar de advancedFilters
  const interfaceSettings = userSettings || {};

  // DIAGNÓSTICO: Loggear estado antes de filtrar
  console.log('🔍 [DIAGNÓSTICO POPUP] applyAllFilters() - Estado inicial:', {
    totalRoutes: allRoutes.length,
    currentFilter: currentFilter,
    interfaceSettings: {
      interfaceMinProfitDisplay: interfaceSettings.interfaceMinProfitDisplay,
      interfaceMaxRoutesDisplay: interfaceSettings.interfaceMaxRoutesDisplay,
      interfaceSortByProfit: interfaceSettings.interfaceSortByProfit,
      interfaceShowOnlyProfitable: interfaceSettings.interfaceShowOnlyProfitable,
      interfacePreferSingleExchange: interfaceSettings.interfacePreferSingleExchange
    },
    muestraRutasP2P: allRoutes.filter(r => r.requiresP2P).length,
    muestraRutasNoP2P: allRoutes.filter(r => !r.requiresP2P).length
  });

  log('🔍 Aplicando filtros de interfaz:', {
    minProfit: interfaceSettings.interfaceMinProfitDisplay,
    maxRoutes: interfaceSettings.interfaceMaxRoutesDisplay,
    sortByProfit: interfaceSettings.interfaceSortByProfit,
    showOnlyProfitable: interfaceSettings.interfaceShowOnlyProfitable,
    preferSingleExchange: interfaceSettings.interfacePreferSingleExchange
  });

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

  // DIAGNÓSTICO: Loggar resultado del filtro P2P
  console.log('🔍 [DIAGNÓSTICO POPUP] applyAllFilters() - Después de filtro P2P:', {
    currentFilter: currentFilter,
    rutasDespuesFiltroP2P: filteredRoutes.length,
    muestraP2P: currentFilter === 'p2p' || currentFilter === 'all',
    muestraNoP2P: currentFilter === 'no-p2p' || currentFilter === 'all'
  });

  log(`🔍 Después de filtro P2P: ${filteredRoutes.length} rutas`);

  // Paso 2: Filtro por profit mínimo de interfaz
  const minProfit = interfaceSettings.interfaceMinProfitDisplay || -10;
  if (minProfit > -100) {
    // Solo filtrar si no es un valor muy bajo
    filteredRoutes = filteredRoutes.filter(route => route.profitPercentage >= minProfit);
    log(`🔍 Después de filtro profit mínimo (${minProfit}%): ${filteredRoutes.length} rutas`);
  }

  // DIAGNÓSTICO: Loggar resultado del filtro de profit mínimo
  console.log('🔍 [DIAGNÓSTICO POPUP] applyAllFilters() - Después de filtro profit mínimo:', {
    minProfit: minProfit,
    rutasDespuesFiltroProfit: filteredRoutes.length,
    rutasConProfitNegativo: allRoutes.filter(r => r.profitPercentage < minProfit).length
  });

  // Paso 3: Mostrar solo rentables (si está activado)
  if (interfaceSettings.interfaceShowOnlyProfitable) {
    const antesFiltro = filteredRoutes.length;
    filteredRoutes = filteredRoutes.filter(route => route.profitPercentage >= 0);
    console.log('🔍 [DIAGNÓSTICO POPUP] applyAllFilters() - Después de filtro solo rentables:', {
      rutasAntes: antesFiltro,
      rutasDespues: filteredRoutes.length,
      rutasEliminadas: antesFiltro - filteredRoutes.length
    });
    log(`🔍 Después de mostrar solo rentables: ${filteredRoutes.length} rutas`);
  }

  // Paso 4: Aplicar preferencias de usuario (como antes)
  filteredRoutes = applyUserPreferences(filteredRoutes);
  log(`🔍 Después de preferencias usuario: ${filteredRoutes.length} rutas`);

  // Paso 5: Ordenar según configuración de interfaz
  const sortBy = interfaceSettings.interfaceSortByProfit ? 'profit-desc' : 'profit-asc';
  filteredRoutes = sortRoutes(filteredRoutes, sortBy);
  log(`🔍 Después de ordenar (${sortBy}): ${filteredRoutes.length} rutas`);

  // Paso 6: Limitar cantidad máxima de rutas
  const maxRoutes = interfaceSettings.interfaceMaxRoutesDisplay || 20;
  if (filteredRoutes.length > maxRoutes) {
    filteredRoutes = filteredRoutes.slice(0, maxRoutes);
    log(`🔍 Después de limitar a ${maxRoutes} rutas: ${filteredRoutes.length} rutas`);
  }

  // DIAGNÓSTICO: Loggar resultado final antes de mostrar
  console.log('🔍 [DIAGNÓSTICO POPUP] applyAllFilters() - Resultado final:', {
    rutasFinales: filteredRoutes.length,
    maxRoutes: interfaceSettings.interfaceMaxRoutesDisplay || 20,
    vaAMostrar: filteredRoutes.length > 0,
    currentData: currentData ? {
      tieneOficial: !!currentData.oficial,
      oficialCompra: currentData.oficial?.compra
    } : null
  });

  // Mostrar rutas
  if (currentData) {
    displayOptimizedRoutes(filteredRoutes, currentData.oficial);
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

// Navegación entre tabs (función auxiliar para casos especiales)
function handleTabChange(tabId) {
  // NUEVO v5.0: Si se abre el simulador, aplicar monto default
  if (tabId === 'simulator' && userSettings?.defaultSimAmount) {
    const amountInput = document.getElementById('sim-amount');
    if (amountInput && !amountInput.value) {
      amountInput.value = userSettings.defaultSimAmount;
      log(`🔧 Monto default del simulador: $${userSettings.defaultSimAmount.toLocaleString()}`);
    }
  }

  // NUEVO: Si se abre la pestaña de bancos, cargar datos
  if (tabId === 'banks') {
    loadBanksData();
  }
}

// Botón de actualizar
function setupRefreshButton() {
  document.getElementById('refresh').addEventListener('click', () => {
    fetchAndDisplay();
    loadBanksData();
  });

  // Botón de configuración - Mostrar/ocultar filtros avanzados
  document.getElementById('settings').addEventListener('click', () => {
    const panel = document.getElementById('advanced-filters-panel');
    const toggleBtn = document.getElementById('toggle-advanced-filters');

    if (panel && toggleBtn) {
      // Simular click en el botón de toggle para mostrar/ocultar el panel
      toggleBtn.click();
    } else {
      // Fallback: abrir página de opciones si no hay panel de filtros
      chrome.runtime.openOptionsPage();
    }
  });
}

// ============================================
// CARGA DE DATOS DE BANCOS Y DÓLARES
// ============================================

// ============================================
// LISTENER DE CAMBIOS EN CONFIGURACIÓN
// ============================================

function setupStorageListener() {
  log('👂 Configurando listener de cambios en storage...');

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.notificationSettings) {
      log('⚙️ Configuración cambió - actualizando popup...');

      const oldSettings = changes.notificationSettings.oldValue || {};
      const newSettings = changes.notificationSettings.newValue || {};

      log('📊 Cambio detectado:', {
        old_manualDollarPrice: oldSettings.manualDollarPrice,
        new_manualDollarPrice: newSettings.manualDollarPrice,
        old_dollarPriceSource: oldSettings.dollarPriceSource,
        new_dollarPriceSource: newSettings.dollarPriceSource
      });

      // Verificar qué cambió
      const relevantChanges = [
        'dollarPriceSource',
        'manualDollarPrice',
        'preferredBank',
        'selectedBanks',
        'routeType',
        'profitThreshold'
      ];

      const hasRelevantChange = relevantChanges.some(
        key => JSON.stringify(oldSettings[key]) !== JSON.stringify(newSettings[key])
      );

      if (hasRelevantChange) {
        log('🔄 Cambio relevante detectado - recargando datos...');

        // Recargar configuración del usuario
        loadUserSettings();

        // Forzar actualización de datos
        setTimeout(() => {
          fetchAndDisplay(true);
        }, 200); // Pequeño delay para asegurar que la configuración se actualizó
      }
    }
  });
}

// Funciones helper para reducir complejidad de fetchAndDisplay
function handleNoData(container) {
  console.error('❌ Error: No se recibió respuesta del background');
  container.innerHTML = '<p class="error">❌ No se pudo comunicar con el servicio de fondo.</p>';
}

function handleInitializationError(container, data, retryCount, maxRetries) {
  console.log(
    `⏳ Background inicializando, reintentando en 2 segundos... (${retryCount + 1}/${maxRetries})`
  );
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
  console.log('📊 [SUCCESS] handleSuccessfulData() llamado con data:', {
    tieneOficial: !!data.oficial,
    oficialCompra: data.oficial?.compra,
    oficialSource: data.oficial?.source,
    oficialTimestamp: data.oficial?.timestamp
      ? new Date(data.oficial.timestamp).toLocaleString()
      : 'N/A',
    lastUpdate: data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : 'N/A',
    rutasCount: data.optimizedRoutes?.length || 0
  });

  // Actualizar estado global y sincronizar con StateManager
  currentData = data;
  if (State) {
    State.set('currentData', data);
    State.set('lastUpdate', data.lastUpdate);
  }

  // Actualizar timestamp de última actualización
  const lastUpdateEl = document.getElementById('last-update');
  if (lastUpdateEl && data.lastUpdate) {
    updateTimestampWithFreshness(lastUpdateEl, data.lastUpdate);
  }

  displayMarketHealth(data.marketHealth);

  // NUEVO v5.0.28: Actualizar indicador de estado de datos
  updateDataStatusIndicator(data);

  // NUEVO: Mostrar información del precio del dólar
  if (data.oficial) {
    console.log('📊 [SUCCESS] Llamando displayDollarInfo() con data.oficial');
    displayDollarInfo(data.oficial);
  } else {
    console.log('⚠️ [SUCCESS] No hay data.oficial - no se mostrará precio del dólar');
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
    container.innerHTML =
      '<p class="warning">⏳ No hay rutas disponibles. Espera un momento...</p>';
    return;
  }

  if (data.optimizedRoutes.length === 0) {
    console.warn('⚠️ optimizedRoutes está vacío');
    container.innerHTML =
      '<p class="info">📊 No se encontraron rutas rentables en este momento.</p>';
    return;
  }

  // Guardar todas las rutas en cache global y sincronizar con StateManager
  allRoutes = data.optimizedRoutes || [];
  if (State) {
    State.setRoutes(allRoutes, []);
  }
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

  // Sincronizar con StateManager
  if (State) {
    State.set('userSettings', userSettings);
  }

  try {
    console.log('📤 [POPUP] Solicitando datos al background...');
    console.log('📤 [POPUP] Verificando runtime disponible:', !!chrome.runtime);
    console.log('📤 [POPUP] Verificando sendMessage disponible:', !!chrome.runtime?.sendMessage);

    // Timeout para detectar si el callback nunca se ejecuta
    let responseReceived = false;
    const timeoutId = setTimeout(() => {
      if (!responseReceived) {
        console.error(
          '⏰ [POPUP] TIMEOUT: El callback del background nunca se ejecutó (15 segundos)'
        );
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
      container.innerHTML =
        '<p class="error">❌ Chrome Runtime no disponible. Recarga la extensión.</p>';
      clearTimeout(timeoutId);
      return;
    }

    try {
      chrome.runtime.sendMessage({ action: 'getArbitrages' }, data => {
        responseReceived = true;
        clearTimeout(timeoutId);

        // DIAGNÓSTICO: Loggear recepción completa de datos
        console.log('🔍 [DIAGNÓSTICO POPUP] Datos recibidos del background:', {
          tieneData: !!data,
          oficialCompra: data?.oficial?.compra,
          oficialVenta: data?.oficial?.venta,
          oficialSource: data?.oficial?.source,
          oficialTimestamp: data?.oficial?.timestamp ? new Date(data.oficial.timestamp).toISOString() : 'N/A',
          rutasCount: data?.optimizedRoutes?.length || 0,
          lastUpdate: data?.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : 'N/A',
          error: data?.error,
          usingCache: data?.usingCache,
          dataKeys: data ? Object.keys(data) : [],
          tieneOptimizedRoutes: !!data?.optimizedRoutes,
          optimizedRoutesEsArray: Array.isArray(data?.optimizedRoutes)
        });
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
          console.error('❌ [DIAGNÓSTICO POPUP] No se recibió data del background');
          handleNoData(container);
          return;
        }
        
        // DIAGNÓSTICO: Verificar estructura de datos
        console.log('🔍 [DIAGNÓSTICO POPUP] Estructura de datos recibidos:', {
          tieneOficial: !!data.oficial,
          oficialKeys: data.oficial ? Object.keys(data.oficial) : [],
          tieneOptimizedRoutes: !!data.optimizedRoutes,
          optimizedRoutesLength: data.optimizedRoutes?.length || 0,
          optimizedRoutesEsArray: Array.isArray(data.optimizedRoutes),
          tieneError: !!data.error,
          errorMessage: data.error
        });

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

        // DIAGNÓSTICO: Loggear estado de rutas
        console.log('🔍 [DIAGNÓSTICO POPUP] Estado de rutas antes de procesar:', {
          tieneRutas: !!data.optimizedRoutes,
          cantidadRutas: data.optimizedRoutes?.length || 0,
          esArray: Array.isArray(data.optimizedRoutes),
          primeraRuta: data.optimizedRoutes?.[0] ? {
            broker: data.optimizedRoutes[0].broker,
            profitPercent: data.optimizedRoutes[0].profitPercent,
            isSingleExchange: data.optimizedRoutes[0].isSingleExchange
          } : null
        });

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
    container.innerHTML =
      '<p class="error">❌ Error interno: ' + sanitizeHTML(error.message) + '</p>';
  }
}

// NUEVA FUNCIÓN v5.0: Aplicar preferencias del usuario
function applyUserPreferences(routes) {
  if (DEBUG_MODE) {
    console.log('🔍 [POPUP] applyUserPreferences() llamado con', routes?.length, 'rutas');
  }
  if (DEBUG_MODE) {
    console.log('🔍 [POPUP] userSettings completo:', JSON.stringify(userSettings, null, 2));
  }
  if (!Array.isArray(routes) || routes.length === 0) {
    if (DEBUG_MODE) {
      console.log('🔍 [POPUP] applyUserPreferences: rutas vacías o no array, retornando vacío');
    }
    return routes;
  }

  let filtered = [...routes]; // Copia para no mutar original
  if (DEBUG_MODE) {
    console.log('🔍 [POPUP] applyUserPreferences: copia inicial tiene', filtered.length, 'rutas');
  }

  // MEJORADO v5.0.64: Filtro unificado por ganancia mínima (separa visualización de notificaciones)
  filtered = applyMinProfitFilter(filtered, userSettings?.filterMinProfit);

  // 2. Filtrar por exchanges preferidos del usuario
  filtered = applyPreferredExchangesFilter(filtered, userSettings?.preferredExchanges);

  // 3. Ordenar rutas según preferencias del usuario
  filtered = applySorting(filtered, userSettings.preferSingleExchange, userSettings.sortByProfit);

  // 4. Limitar cantidad de rutas mostradas
  const maxDisplay = userSettings.maxRoutesDisplay || 20;
  filtered = applyLimit(filtered, maxDisplay);

  if (DEBUG_MODE) {
    console.log('🔍 [POPUP] applyUserPreferences retornando', filtered.length, 'rutas finales');
  }
  return filtered;
}

// MEJORADO v5.0.64: Filtro unificado que reemplaza applyProfitThresholdFilter, applyOnlyProfitableFilter y applyNegativeFilter
function applyMinProfitFilter(routes, filterMinProfit) {
  // filterMinProfit por defecto es -10.0% (muestra casi todo)
  // Usuario puede configurar desde -10% hasta +20%
  const minProfit = filterMinProfit ?? -10.0;

  const beforeCount = routes.length;
  const filtered = routes.filter(r => r.profitPercentage >= minProfit);
  if (DEBUG_MODE) {
    console.log(
      `🔧 [POPUP] Filtradas por ganancia mínima ${minProfit}%: ${beforeCount} → ${filtered.length} rutas`
    );
  }
  return filtered;
}

function applyPreferredExchangesFilter(routes, preferredExchanges) {
  // Si no hay exchanges preferidos configurados, mostrar todas las rutas
  if (
    !preferredExchanges ||
    !Array.isArray(preferredExchanges) ||
    preferredExchanges.length === 0
  ) {
    if (DEBUG_MODE) {
      console.log(
        '🔍 [POPUP] No hay exchanges preferidos configurados - mostrando todas las rutas'
      );
    }
    return routes;
  }

  const beforeCount = routes.length;
  const filtered = routes.filter(route => {
    // Una ruta pasa el filtro si al menos uno de sus exchanges está en la lista preferida
    return (
      preferredExchanges.includes(route.buyExchange) ||
      (route.sellExchange && preferredExchanges.includes(route.sellExchange))
    );
  });

  if (DEBUG_MODE) {
    console.log(
      `🔧 [POPUP] Exchanges preferidos (${preferredExchanges.join(', ')}): ${beforeCount} → ${filtered.length} rutas`
    );
  }
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
    const lowProfitIndicator =
      arb.profitPercentage >= 0 && arb.profitPercentage < 1
        ? '<span class="low-profit-tag">👁️ Solo vista</span>'
        : '';
    const negativeIndicator = isNegative ? '<span class="negative-tag">⚠️ Pérdida</span>' : '';

    // Símbolo según ganancia/pérdida
    const profitSymbol = isNegative ? '' : '+';

    // Verificar si hay diferencia entre ganancia bruta y neta
    const hasFees = arb.fees && arb.fees.total > 0;

    html += `
      <div class="arbitrage-card ${profitClass}" data-index="${index}">
        <div class="card-header">
          <h3>🏦 ${arb.broker}</h3>
          ${negativeIndicator ? `<div class="broker-loss-indicator">${negativeIndicator}</div>` : ''}
          <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${Fmt.formatNumber(arb.profitPercentage)}% ${lowProfitIndicator}</div>
        </div>
        <div class="card-body">
          <div class="price-row">
            <span class="price-label">💵 Dólar Oficial</span>
            <span class="price-value">$${Fmt.formatNumber(arb.officialPrice)}</span>
          </div>
          ${
            official?.source
              ? `
          <div class="price-row source-row">
            <span class="price-label">📍 Fuente</span>
            <span class="price-value source-value">${getDollarSourceDisplay(official)}</span>
          </div>
          `
              : ''
          }
          <div class="price-row">
            <span class="price-label">💱 USD → USDT</span>
            <span class="price-value">${formatUsdUsdtRatio(arb.usdToUsdtRate)} USD/USDT</span>
          </div>
          <div class="price-row">
            <span class="price-label">💸 USDT → ARS</span>
            <span class="price-value highlight">$${Fmt.formatNumber(arb.usdtArsBid)}</span>
          </div>
          ${
            hasFees
              ? `
          <div class="price-row fees-row">
            <span class="price-label">📊 Comisiones</span>
            <span class="price-value fee-value">${Fmt.formatNumber(arb.fees.total)}%</span>
          </div>
          <div class="price-row">
            <span class="price-label">✅ Ganancia Neta</span>
            <span class="price-value net-profit">+${Fmt.formatNumber(arb.profitPercentage)}%</span>
          </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Agregar event listeners a las tarjetas
  document.querySelectorAll('.arbitrage-card').forEach(card => {
    card.addEventListener('click', function () {
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

  // DIAGNÓSTICO: Loggear parámetros de entrada
  console.log('🔍 [DIAGNÓSTICO POPUP] displayOptimizedRoutes() - Parámetros:', {
    routes: routes ? {
      esArray: Array.isArray(routes),
      length: routes.length,
      primeraRuta: routes[0] ? {
        broker: routes[0].broker,
        profitPercent: routes[0].profitPercent
      } : null
    } : null,
    official: official ? {
      compra: official.compra,
      venta: official.venta,
      source: official.source
    } : null,
    userSettings: userSettings ? {
      interfaceMinProfitDisplay: userSettings.interfaceMinProfitDisplay,
      interfaceMaxRoutesDisplay: userSettings.interfaceMaxRoutesDisplay,
      interfaceSortByProfit: userSettings.interfaceSortByProfit,
      interfaceShowOnlyProfitable: userSettings.interfaceShowOnlyProfitable
    } : null
  });

  // Obtener configuraciones de interfaz
  const interfaceSettings = userSettings || {};
  const showProfitColors = interfaceSettings.interfaceShowProfitColors !== false;
  const compactView = interfaceSettings.interfaceCompactView || false;
  const showExchangeIcons = interfaceSettings.interfaceShowExchangeIcons !== false;
  const showTimestamps = interfaceSettings.interfaceShowTimestamps || false;

  if (!routes || routes.length === 0) {
    console.log('🔍 [POPUP] No hay rutas para mostrar, mostrando mensaje informativo');
    console.log('🔍 [DIAGNÓSTICO POPUP] displayOptimizedRoutes() - No hay rutas:', {
      routesIsNull: !routes,
      routesLength: routes?.length || 0,
      currentFilter: currentFilter,
      allRoutesLength: allRoutes?.length || 0
    });
    container.innerHTML = `
      <div class="market-status">
        <h3>📊 Estado del Mercado</h3>
        <p>No se encontraron rutas que cumplan con tus criterios de filtrado.</p>
        <div class="market-info">
          <p><strong>Posibles causas:</strong></p>
          <ul>
            <li>🎯 <strong>Umbral de ganancia muy alto:</strong> Prueba bajar el umbral mínimo en Configuración</li>
            <li>🏦 <strong>Exchanges preferidos restrictivos:</strong> Agrega más exchanges en Configuración</li>
            <li>💰 <strong>Tipo de ruta incorrecto:</strong> Cambia el tipo de rutas en Configuración (Arbitraje, USDT→ARS, etc.)</li>
            <li>🔄 <strong>Mercado en equilibrio:</strong> Las tasas están muy cercanas al dólar oficial</li>
            <li>🤝 <strong>Filtro P2P activo:</strong> Cambia a "Todas" o "No P2P" en los filtros</li>
          </ul>
          <p><small>Tu configuración actual: Umbral ${userSettings?.profitThreshold || 1.0}%, Tipo: ${userSettings?.routeType || 'arbitrage'}</small></p>
        </div>
        <button class="retry-btn" data-action="reload" style="margin-top: 15px;">🔄 Actualizar Datos</button>
        <button class="settings-btn" onclick="chrome.runtime.openOptionsPage()" style="margin-top: 10px;">⚙️ Revisar Configuración</button>
      </div>
    `;
    return;
  }

  // Ordenar rutas por relevancia según el tipo
  routes.sort((a, b) => {
    // Para rutas de arbitraje, ordenar por profitPercentage
    if (a.routeCategory === 'arbitrage' || (!a.routeCategory && a.profitPercentage !== undefined)) {
      const profitA = a.profitPercentage || 0;
      const profitB = b.profitPercentage || 0;
      return profitB - profitA;
    }
    // Para rutas directas USDT→ARS, ordenar por arsReceived
    if (a.routeCategory === 'direct_usdt_ars' || a.isDirectSale) {
      const arsA = a.arsReceived || 0;
      const arsB = b.arsReceived || 0;
      return arsB - arsA;
    }
    // Para rutas USD→USDT, ordenar por efficiency
    if (a.routeCategory === 'usd_to_usdt' || a.isPurchaseRoute) {
      const effA = a.efficiency || 0;
      const effB = b.efficiency || 0;
      return effB - effA;
    }
    // Fallback
    return 0;
  });

  console.log('🔍 [POPUP] Generando HTML para', routes.length, 'rutas ordenadas');
  let html = '';

  routes.forEach((route, index) => {
    // Determinar tipo de ruta y métricas de display
    const routeType = getRouteType(route);
    const displayMetrics = getRouteDisplayMetrics(route, routeType);

    const { isNegative, profitClass, profitBadgeClass } = showProfitColors
      ? getProfitClasses(displayMetrics.percentage)
      : { isNegative: false, profitClass: '', profitBadgeClass: '' };

    // Indicadores
    const negativeIndicator = isNegative ? '<span class="negative-tag">⚠️ Pérdida</span>' : '';
    const profitSymbol = isNegative ? '' : '+';

    // Badges según tipo de ruta
    const typeBadge = getRouteTypeBadge(routeType);
    const p2pBadge = getP2PBadge(route);

    // Aplicar vista compacta si está configurada
    const compactClass = compactView ? 'compact-view' : '';

    // Aplicar íconos de exchanges si está configurado
    const exchangeIcon = showExchangeIcons ? getExchangeIcon(route.buyExchange) : '';

    // Timestamps si está configurado
    const timestampInfo =
      showTimestamps && route.timestamp
        ? `<div class="route-timestamp">🕐 ${new Date(route.timestamp).toLocaleTimeString()}</div>`
        : '';

    // Descripción de la ruta según el tipo
    const routeDescription = getRouteDescription(route, routeType);

    // CORREGIDO v5.0.72: Guardar la ruta completa como JSON en data-route
    const routeData = JSON.stringify({
      ...route,
      routeType: routeType,
      displayMetrics: displayMetrics
    });

    html += `
      <div class="route-card ${profitClass} ${routeType} ${compactClass}" data-index="${index}" data-route='${routeData.replace(/'/g, '&apos;')}'>
        <div class="route-header">
          <div class="route-title">
            <h3>${getRouteIcon(routeType, route)} Ruta ${index + 1} ${exchangeIcon}</h3>
            ${negativeIndicator ? `<div class="route-loss-indicator">${negativeIndicator}</div>` : ''}
            <div class="route-badges">
              ${typeBadge}
              ${p2pBadge}
            </div>
          </div>
          <div class="route-profit-section">
            <div class="profit-badge ${profitBadgeClass}">${profitSymbol}${Fmt.formatNumber(displayMetrics.percentage)}%</div>
          </div>
        </div>

        <div class="route-compact">
          <div class="route-summary-line">
            <span class="route-exchanges">🏦 ${routeDescription}</span>
          </div>
          <div class="route-profit-line">
            <span class="profit-amount">${displayMetrics.mainValue}</span>
            <span class="investment-info">${displayMetrics.secondaryInfo}</span>
          </div>
          ${timestampInfo}
          <div class="route-action">
            <span class="click-to-expand">👆 Click para ver detalles</span>
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
    card.addEventListener('click', function (e) {
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
        console.log(
          `🖱️ [POPUP] Click en route-card tipo ${route.routeType}:`,
          route.broker || route.buyExchange
        );

        // Remover selección previa
        container.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');

        // Mostrar detalles según el tipo de ruta
        showRouteDetailsByType(route);
      } catch (error) {
        console.error('❌ [POPUP] Error al parsear data-route:', error);
      }
    });
  });

  console.log('✅ [POPUP] displayOptimizedRoutes() completado - HTML generado y aplicado');
}

// ============================================
// FUNCIONES AUXILIARES PARA TIPOS DE RUTAS
// ============================================

function getRouteType(route) {
  // Determinar tipo de ruta basado en propiedades del objeto
  if (route.routeCategory) {
    return route.routeCategory;
  }
  if (route.routeType) {
    return route.routeType;
  }
  if (route.isDirectSale || route.arsReceived) {
    return 'direct_usdt_ars';
  }
  if (route.isPurchaseRoute || route.efficiency) {
    return 'usd_to_usdt';
  }
  return 'arbitrage'; // default
}

function getRouteDisplayMetrics(route, routeType) {
  switch (routeType) {
    case 'direct_usdt_ars': {
      const arsReceived = route.arsReceived || 0;
      const usdtSold = route.usdtSold || route.calculation?.initialUsdtAmount || 1000;
      const percentage = route.profitPercent || 0;

      return {
        percentage: percentage,
        mainValue: `$${Fmt.formatNumber(arsReceived)} ARS`,
        secondaryInfo: `vendiendo ${usdtSold} USDT`
      };
    }

    case 'usd_to_usdt': {
      const usdtReceived = route.usdtReceived || 0;
      const usdInvested = route.usdInvested || route.calculation?.initialUsdAmount || 1000;
      const efficiency = route.efficiency || 0;

      return {
        percentage: (efficiency - 1) * 100, // Convertir efficiency a porcentaje
        mainValue: `${Fmt.formatNumber(usdtReceived)} USDT`,
        secondaryInfo: `por ${usdInvested} USD invertidos`
      };
    }

    default: {
      // arbitrage
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

function getRouteTypeBadge(routeType) {
  switch (routeType) {
    case 'direct_usdt_ars':
      return '<span class="route-type-badge direct-sale">💰 USDT→ARS</span>';
    case 'usd_to_usdt':
      return '<span class="route-type-badge purchase">💎 USD→USDT</span>';
    default:
      return '<span class="route-type-badge arbitrage">🔄 Arbitraje</span>';
  }
}

function getP2PBadge(route) {
  const isP2P = route.requiresP2P || (route.broker && route.broker.toLowerCase().includes('p2p'));
  return isP2P
    ? '<span class="p2p-badge">🤝 P2P</span>'
    : '<span class="no-p2p-badge">⚡ Directo</span>';
}

function getRouteDescription(route, routeType) {
  switch (routeType) {
    case 'direct_usdt_ars':
      return `<strong>${route.broker}</strong> - Venta directa`;
    case 'usd_to_usdt':
      return `<strong>${route.broker}</strong> - Compra USDT`;
    default: // arbitrage
      if (route.isSingleExchange) {
        return `<strong>${route.buyExchange}</strong>`;
      } else {
        return `<strong>${route.buyExchange}</strong> → <strong>${route.sellExchange}</strong>`;
      }
  }
}

function getRouteIcon(routeType, route) {
  switch (routeType) {
    case 'direct_usdt_ars':
      return '💰';
    case 'usd_to_usdt':
      return '💎';
    default:
      return route?.isSingleExchange ? '🎯' : '🔀';
  }
}

// Función auxiliar para obtener ícono de exchange - Usa RouteRenderer
const getExchangeIcon = exchangeName =>
  window.RouteRenderer?.getExchangeIcon?.(exchangeName) || '🏦';

function showRouteDetailsByType(route) {
  const routeType = getRouteType(route);

  switch (routeType) {
    case 'direct_usdt_ars':
      showDirectUsdtArsDetails(route);
      break;
    case 'usd_to_usdt':
      showUsdToUsdtDetails(route);
      break;
    default:
      showRouteGuideFromData(route);
      break;
  }
}

// ============================================
// FUNCIONES DE DETALLES PARA TIPOS ESPECÍFICOS
// ============================================

function showDirectUsdtArsDetails(route) {
  console.log('💰 Mostrando detalles de venta directa USDT→ARS:', route);

  const modal = document.getElementById('route-details-modal');
  const content = modal.querySelector('.modal-content');

  const usdtAmount = route.usdtSold || route.calculation?.initialUsdtAmount || 1000;
  const arsReceived = route.arsReceived || 0;
  const exchangeRate = route.exchangeRate || 0;
  const fees = route.fees || {};

  content.innerHTML = `
    <div class="modal-header">
      <h2>💰 Venta Directa USDT → ARS</h2>
      <span class="modal-close">&times;</span>
    </div>
    <div class="modal-body">
      <div class="route-summary">
        <div class="summary-item">
          <span class="label">Exchange:</span>
          <span class="value">${route.broker}</span>
        </div>
        <div class="summary-item">
          <span class="label">USDT a vender:</span>
          <span class="value">${usdtAmount} USDT</span>
        </div>
        <div class="summary-item">
          <span class="label">ARS recibidos:</span>
          <span class="value">$${Fmt.formatNumber(arsReceived)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Tasa de cambio:</span>
          <span class="value">$${Fmt.formatNumber(exchangeRate)} ARS/USDT</span>
        </div>
      </div>

      <div class="route-steps">
        <h3>Pasos a seguir:</h3>
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Accede a tu cuenta en ${route.broker}</h4>
            <p>Inicia sesión en la plataforma de ${route.broker}</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Vende ${usdtAmount} USDT por ARS</h4>
            <p>Coloca una orden de venta al precio de $${Fmt.formatNumber(exchangeRate)} ARS por USDT</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Recibe $${Fmt.formatNumber(arsReceived)} ARS</h4>
            <p>Los pesos argentinos estarán disponibles en tu cuenta bancaria</p>
          </div>
        </div>
      </div>

      ${
        fees.total > 0
          ? `
      <div class="fees-info">
        <h4>Comisiones aplicadas:</h4>
        <div class="fee-breakdown">
          ${fees.sell > 0 ? `<div>Comisión de venta: $${Fmt.formatNumber(fees.sell)}</div>` : ''}
          ${fees.withdrawal > 0 ? `<div>Comisión de retiro: $${Fmt.formatNumber(fees.withdrawal)}</div>` : ''}
          ${fees.transfer > 0 ? `<div>Comisión de transferencia: $${Fmt.formatNumber(fees.transfer)}</div>` : ''}
          ${fees.bank > 0 ? `<div>Comisión bancaria: $${Fmt.formatNumber(fees.bank)}</div>` : ''}
          <div class="fee-total">Total fees: $${Fmt.formatNumber(fees.total)}</div>
        </div>
      </div>
      `
          : ''
      }
    </div>
  `;

  modal.style.display = 'block';
}

function showUsdToUsdtDetails(route) {
  console.log('💎 Mostrando detalles de compra USD→USDT:', route);

  const modal = document.getElementById('route-details-modal');
  const content = modal.querySelector('.modal-content');

  const usdAmount = route.usdInvested || route.calculation?.initialUsdAmount || 1000;
  const usdtReceived = route.usdtReceived || 0;
  const exchangeRate = route.exchangeRate || 0;
  const efficiency = route.efficiency || 0;
  const fees = route.fees || {};

  content.innerHTML = `
    <div class="modal-header">
      <h2>💎 Compra USDT con USD</h2>
      <span class="modal-close">&times;</span>
    </div>
    <div class="modal-body">
      <div class="route-summary">
        <div class="summary-item">
          <span class="label">Exchange:</span>
          <span class="value">${route.broker}</span>
        </div>
        <div class="summary-item">
          <span class="label">USD a invertir:</span>
          <span class="value">$${usdAmount} USD</span>
        </div>
        <div class="summary-item">
          <span class="label">USDT recibidos:</span>
          <span class="value">${Fmt.formatNumber(usdtReceived)} USDT</span>
        </div>
        <div class="summary-item">
          <span class="label">Tasa USD/USDT:</span>
          <span class="value">${Fmt.formatNumber(exchangeRate)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Eficiencia:</span>
          <span class="value">${Fmt.formatNumber(efficiency * 100)}%</span>
        </div>
      </div>

      <div class="route-steps">
        <h3>Pasos a seguir:</h3>
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Convierte ARS a USD</h4>
            <p>Compra $${usdAmount} USD usando el dólar oficial o cuevas</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Accede a ${route.broker}</h4>
            <p>Inicia sesión en la plataforma</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Compra USDT con USD</h4>
            <p>Invierte $${usdAmount} USD para recibir ${Fmt.formatNumber(usdtReceived)} USDT</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>Guarda tus USDT</h4>
            <p>Los USDT estarán disponibles en tu wallet para usar en arbitraje o trading</p>
          </div>
        </div>
      </div>

      ${
        fees.total > 0
          ? `
      <div class="fees-info">
        <h4>Comisiones aplicadas:</h4>
        <div class="fee-breakdown">
          ${fees.buy > 0 ? `<div>Comisión de compra: ${Fmt.formatNumber(fees.buy)} USDT</div>` : ''}
          <div class="fee-total">Total fees: ${Fmt.formatNumber(fees.total)} USDT</div>
        </div>
      </div>
      `
          : ''
      }
    </div>
  `;

  modal.style.display = 'block';
}

// NUEVA FUNCIÓN v5.0.72: Mostrar guía desde datos de ruta directos (sin índice)
function showRouteGuideFromData(route) {
  console.log('🔍 [POPUP] showRouteGuideFromData() llamado con ruta:', route);

  if (!route) {
    console.warn('❌ [POPUP] No hay datos de ruta disponibles');
    return;
  }

  // Convertir ruta a formato de arbitraje para la guía
  const arbitrage = {
    broker: route.isSingleExchange
      ? route.buyExchange
      : `${route.buyExchange} → ${route.sellExchange}`,
    buyExchange: route.buyExchange || 'N/A',
    sellExchange: route.sellExchange || route.buyExchange || 'N/A',
    isSingleExchange: route.isSingleExchange || false,
    profitPercentage: route.profitPercentage || 0,
    officialPrice: route.officialPrice || 0,
    usdToUsdtRate:
      typeof route.usdToUsdtRate === 'number' && isFinite(route.usdToUsdtRate)
        ? route.usdToUsdtRate
        : null,
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
  console.log('🔍 [POPUP] currentData existe:', !!currentData);
  console.log('🔍 [POPUP] currentData.optimizedRoutes existe:', !!currentData?.optimizedRoutes);
  console.log(
    '🔍 [POPUP] currentData.optimizedRoutes.length:',
    currentData?.optimizedRoutes?.length
  );

  if (!currentData?.optimizedRoutes?.[index]) {
    console.warn(`❌ [POPUP] No hay ruta disponible para el índice: ${index}`);
    console.warn('   currentData:', currentData);
    return;
  }

  const route = currentData.optimizedRoutes[index];
  console.log(`✅ [POPUP] Ruta encontrada para índice ${index}:`, route);

  // Convertir ruta a formato de arbitraje para la guía
  const arbitrage = {
    broker: route.isSingleExchange
      ? route.buyExchange
      : `${route.buyExchange} → ${route.sellExchange}`,
    buyExchange: route.buyExchange || 'N/A',
    sellExchange: route.sellExchange || route.buyExchange || 'N/A',
    isSingleExchange: route.isSingleExchange || false,
    profitPercentage: route.profitPercentage || route.profitPercent || 0,
    officialPrice: route.officialPrice || 0,
    usdToUsdtRate:
      typeof route.usdToUsdtRate === 'number' && isFinite(route.usdToUsdtRate)
        ? route.usdToUsdtRate
        : null,
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

// Función helper para calcular clases de profit - Usa RouteRenderer
// NOTA: getProfitClasses está definida en utils.js y cargada globalmente en popup.html
// Esta función delega a window.RouteRenderer si está disponible, usa utils.js como fallback

// Calcular valores para la guía paso a paso
function calculateGuideValues(arb) {
  const calc = arb.calculation || {};

  // CORREGIDO v5.0.71: Usar profitPercentage de calculation para consistencia
  // Si existe calculation.profitPercentage, usarlo; sino usar el top-level
  const correctProfitPercentage =
    calc.profitPercentage !== undefined ? calc.profitPercentage : arb.profitPercentage || 0;

  return {
    estimatedInvestment: calc.initial || 100000,
    officialPrice: arb.officialPrice || 1000,
    usdAmount: calc.usdPurchased || (calc.initial || 100000) / (arb.officialPrice || 1000),
    usdtAfterFees:
      calc.usdtAfterFees ||
      calc.usdPurchased ||
      (calc.initial || 100000) / (arb.officialPrice || 1000),
    sellPrice: arb.sellPrice || arb.usdtArsBid || 1000,
    arsFromSale:
      calc.arsFromSale ||
      (calc.usdtAfterFees ||
        calc.usdPurchased ||
        (calc.initial || 100000) / (arb.officialPrice || 1000)) *
        (arb.sellPrice || arb.usdtArsBid || 1000),
    finalAmount:
      calc.finalAmount ||
      calc.arsFromSale ||
      (calc.usdtAfterFees ||
        calc.usdPurchased ||
        (calc.initial || 100000) / (arb.officialPrice || 1000)) *
        (arb.sellPrice || arb.usdtArsBid || 1000),
    profit:
      calc.netProfit ||
      (calc.finalAmount ||
        calc.arsFromSale ||
        (calc.usdtAfterFees ||
          calc.usdPurchased ||
          (calc.initial || 100000) / (arb.officialPrice || 1000)) *
          (arb.sellPrice || arb.usdtArsBid || 1000)) - (calc.initial || 100000),
    profitPercentage: correctProfitPercentage, // USAR EL VALOR CORRECTO
    usdToUsdtRate:
      typeof arb.usdToUsdtRate === 'number' && isFinite(arb.usdToUsdtRate)
        ? arb.usdToUsdtRate
        : null,
    usdtArsBid: arb.usdtArsBid || arb.sellPrice || 1000,
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
          <strong>${isProfitable ? '+' : ''}${Fmt.formatNumber(profitPercentage)}%</strong>
        </span>
      </div>
    </div>
  `;
}

// Generar HTML de los pasos de la guía (SIMPLIFICADO)
function generateGuideSteps(values) {
  const {
    estimatedInvestment,
    officialPrice,
    usdAmount,
    usdToUsdtRate,
    usdtAfterFees,
    usdtArsBid,
    arsFromSale,
    finalAmount,
    profit,
    profitPercentage,
    broker
  } = values;

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
            <span class="calc-value">$${Fmt.formatNumber(officialPrice)}/USD</span>
            <span class="calc-arrow">→</span>
            <span class="calc-result">Obtienes ${Fmt.formatNumber(usdAmount)} USD</span>
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
            <span class="calc-result">${Fmt.formatNumber(usdtAfterFees)} USDT</span>
          </div>
          ${
            typeof usdToUsdtRate === 'number' && isFinite(usdToUsdtRate) && usdToUsdtRate > 1.005
              ? `
          <div class="step-simple-warning">
            ⚠️ El exchange cobra ${formatCommissionPercent((usdToUsdtRate - 1) * 100)}% para esta conversión
          </div>
          `
              : ''
          }
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
            <span class="calc-value big">$${Fmt.formatNumber(usdtArsBid)}/USDT</span>
            <span class="calc-arrow">→</span>
            <span class="calc-result big">$${Fmt.formatNumber(arsFromSale)}</span>
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
            <span class="calc-result">$${Fmt.formatNumber(finalAmount)}</span>
          </div>
          <div class="profit-summary ${profit >= 0 ? 'positive' : 'negative'}">
            <div class="profit-main">
              <span class="profit-icon">${profit >= 0 ? '📈' : '📉'}</span>
              <span class="profit-amount">${profit >= 0 ? '+' : ''}$${Fmt.formatNumber(profit)}</span>
              <span class="profit-percent">(${profit >= 0 ? '+' : ''}${Fmt.formatNumber(profitPercentage)}%)</span>
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
          <span class="summary-value">$${Fmt.formatNumber(estimatedInvestment)}</span>
        </div>
        <span class="summary-arrow">→</span>
        <div class="summary-item">
          <span class="summary-label">USD Oficial</span>
          <span class="summary-value">${Fmt.formatNumber(usdAmount)} USD</span>
        </div>
        <span class="summary-arrow">→</span>
        <div class="summary-item">
          <span class="summary-label">USDT</span>
          <span class="summary-value">${Fmt.formatNumber(usdtAfterFees)} USDT</span>
        </div>
        <span class="summary-arrow">→</span>
        <div class="summary-item highlight">
          <span class="summary-label">Resultado</span>
          <span class="summary-value big">$${Fmt.formatNumber(finalAmount)}</span>
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
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(animateStep);
      },
      { threshold: 0.5 }
    );

    const stepItems = container.querySelectorAll('.step-item');
    stepItems.forEach(step => observer.observe(step));
  }, 100);

  // Agregar event listener al link de bancos (sin onclick inline)
  const bankLink = container.querySelector('[data-action="show-banks"]');
  if (bankLink) {
    bankLink.addEventListener('click', e => {
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

// Cargar datos de bancos (FUNCIÓN ANTIGUA ELIMINADA - botón refresh-banks removido)
// function loadBanksDataOld() {
//   // Configurar event listener para el botón de refresh
//   const refreshBtn = document.getElementById('refresh-banks');
//   if (refreshBtn) {
//     refreshBtn.addEventListener('click', loadBankRates);
//   }
//
//   // Cargar datos iniciales automáticamente cuando se abre la pestaña
//   loadBankRates();
// }

// Obtener datos de exchanges desde las APIs configuradas
async function fetchExchangeRatesFromAPIs() {
  try {
    // Obtener configuración de usuario para las URLs de APIs
    const settings = await chrome.storage.local.get('notificationSettings');
    const userSettings = settings.notificationSettings || {};

    // URLs por defecto
    const defaultUrls = {
      dolarApiUrl: 'https://dolarapi.com/v1/dolares/oficial',
      criptoyaUsdtArsUrl: 'https://criptoya.com/api/usdt/ars/1',
      criptoyaUsdtUsdUrl: 'https://criptoya.com/api/usdt/usd/1'
    };

    // Usar URLs configuradas o por defecto
    const urls = {
      dolarApiUrl: userSettings.dolarApiUrl || defaultUrls.dolarApiUrl,
      criptoyaUsdtArsUrl: userSettings.criptoyaUsdtArsUrl || defaultUrls.criptoyaUsdtArsUrl,
      criptoyaUsdtUsdUrl: userSettings.criptoyaUsdtUsdUrl || defaultUrls.criptoyaUsdtUsdUrl
    };

    console.log('[POPUP] 📡 Obteniendo datos de APIs:', urls);

    // Obtener datos de las 3 APIs en paralelo
    const [dolarResponse, usdtArsResponse, usdtUsdResponse] = await Promise.allSettled([
      fetch(urls.dolarApiUrl).then(r => r.json()),
      fetch(urls.criptoyaUsdtArsUrl).then(r => r.json()),
      fetch(urls.criptoyaUsdtUsdUrl).then(r => r.json())
    ]);

    const exchangeRates = {};

    // Procesar dólar oficial
    if (dolarResponse.status === 'fulfilled') {
      const dolarData = dolarResponse.value;
      exchangeRates['oficial'] = {
        name: 'Dólar Oficial',
        type: 'oficial',
        rates: {
          compra: dolarData.compra,
          venta: dolarData.venta
        },
        source: 'dolarapi.com',
        timestamp: new Date(dolarData.fechaActualizacion || Date.now()).getTime()
      };
    }

    // Procesar USDT/ARS exchanges
    if (usdtArsResponse.status === 'fulfilled') {
      const usdtArsData = usdtArsResponse.value;
      Object.entries(usdtArsData).forEach(([exchange, data]) => {
        exchangeRates[exchange] = {
          name: getExchangeDisplayName(exchange),
          type: 'usdt_ars',
          rates: {
            compra: data.bid, // bid = precio de compra para el exchange
            venta: data.ask // ask = precio de venta para el exchange
          },
          source: 'criptoya.com',
          timestamp: data.time * 1000
        };
      });
    }

    // Procesar USDT/USD exchanges
    if (usdtUsdResponse.status === 'fulfilled') {
      const usdtUsdData = usdtUsdResponse.value;
      Object.entries(usdtUsdData).forEach(([exchange, data]) => {
        // Si el exchange ya existe (de USDT/ARS), agregar rates USD
        if (exchangeRates[exchange]) {
          exchangeRates[exchange].usdRates = {
            compra: data.bid,
            venta: data.ask
          };
        } else {
          // Nuevo exchange solo con USD
          exchangeRates[exchange] = {
            name: getExchangeDisplayName(exchange),
            type: 'usdt_usd',
            usdRates: {
              compra: data.bid,
              venta: data.ask
            },
            source: 'criptoya.com',
            timestamp: data.time * 1000
          };
        }
      });
    }

    console.log('[POPUP] ✅ Datos obtenidos de', Object.keys(exchangeRates).length, 'exchanges');
    return exchangeRates;
  } catch (error) {
    console.error('[POPUP] ❌ Error obteniendo datos de APIs:', error);
    throw error;
  }
}

// Mostrar lista de exchanges con sus rates
async function displayExchangeRates(exchangeRates) {
  const container = document.getElementById('banks-list');

  // Obtener configuraciones de interfaz
  const interfaceSettings = userSettings || {};
  const showBankPrices = interfaceSettings.interfaceShowBankPrices !== false;
  const bankDisplayMode = interfaceSettings.interfaceBankDisplayMode || 'top-3';

  // Si no se deben mostrar precios bancarios, ocultar la sección
  if (!showBankPrices) {
    container.innerHTML = `
      <div class="select-prompt">
        <p>🏦 Los precios bancarios están ocultos</p>
        <p style="margin-top: 8px; font-size: 0.85em;">Puedes activarlos en Configuración → Interfaz → Bancos en Popup</p>
      </div>
    `;
    return;
  }

  if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
    container.innerHTML = `
      <div class="select-prompt">
        <p>📊 No hay datos de exchanges disponibles</p>
        <p style="margin-top: 8px; font-size: 0.85em;">Presiona el botón "Actualizar" para cargar las cotizaciones</p>
      </div>
    `;
    return;
  }

  // Controles de filtro
  const filterControls = `
    <div class="exchange-filters">
      <div class="filter-section">
        <input type="text" id="exchange-search" placeholder="Buscar exchange..." class="filter-input">
        <div class="filter-buttons">
          <button class="filter-btn active" data-filter="all">Todos</button>
          <button class="filter-btn" data-filter="oficial">Oficial</button>
          <button class="filter-btn" data-filter="usdt_ars">USDT/ARS</button>
          <button class="filter-btn" data-filter="usdt_usd">USDT/USD</button>
        </div>
      </div>
    </div>
  `;

  // Preparar datos para mostrar
  let exchanges = Object.entries(exchangeRates);

  // Aplicar modo de display bancario
  if (bankDisplayMode === 'best-only') {
    // Encontrar el exchange con el mejor precio de compra (ARS/USD oficial)
    const oficialExchanges = exchanges.filter(([code, data]) => data.type === 'oficial');
    if (oficialExchanges.length > 0) {
      const bestExchange = oficialExchanges.reduce((best, current) => {
        const [code, data] = current;
        return !best || data.rates.compra < best[1].rates.compra ? current : best;
      });
      exchanges = [bestExchange];
    }
  } else if (bankDisplayMode === 'top-3') {
    // Mostrar solo los top 3 exchanges oficiales por precio de compra
    const oficialExchanges = exchanges
      .filter(([code, data]) => data.type === 'oficial')
      .sort((a, b) => a[1].rates.compra - b[1].rates.compra)
      .slice(0, 3);
    exchanges = oficialExchanges;
  }
  // Para 'all', mostrar todos los exchanges (comportamiento actual)

  // Función para renderizar exchanges
  const renderExchanges = filteredExchanges => {
    let html = '';

    filteredExchanges.forEach(([exchangeCode, exchangeData]) => {
      const { name, type, rates, usdRates, source } = exchangeData;

      // Determinar qué rates mostrar
      let displayRates = '';
      let rateType = '';

      if (type === 'oficial' && rates) {
        displayRates = `
          <div class="exchange-rate">
            <span class="rate-label">ARS/USD:</span>
            <span class="rate-value">$${Fmt.formatNumber(rates.compra)} / $${Fmt.formatNumber(rates.venta)}</span>
          </div>
        `;
        rateType = 'Oficial';
      } else if (type === 'usdt_ars' && rates) {
        displayRates = `
          <div class="exchange-rate">
            <span class="rate-label">USDT/ARS:</span>
            <span class="rate-value">$${Fmt.formatNumber(rates.compra)} / $${Fmt.formatNumber(rates.venta)}</span>
          </div>
        `;
        rateType = 'USDT/ARS';
      } else if (type === 'usdt_usd' && usdRates) {
        displayRates = `
          <div class="exchange-rate">
            <span class="rate-label">USDT/USD:</span>
            <span class="rate-value">$${Fmt.formatNumber(usdRates.compra)} / $${Fmt.formatNumber(usdRates.venta)}</span>
          </div>
        `;
        rateType = 'USDT/USD';
      }

      // Si tiene ambos rates, mostrar ambos
      if (rates && usdRates) {
        displayRates = `
          <div class="exchange-rate">
            <span class="rate-label">USDT/ARS:</span>
            <span class="rate-value">$${Fmt.formatNumber(rates.compra)} / $${Fmt.formatNumber(rates.venta)}</span>
          </div>
          <div class="exchange-rate">
            <span class="rate-label">USDT/USD:</span>
            <span class="rate-value">$${Fmt.formatNumber(usdRates.compra)} / $${Fmt.formatNumber(usdRates.venta)}</span>
          </div>
        `;
        rateType = 'USDT/ARS + USD';
      }

      html += `
        <div class="exchange-card" data-type="${type}" data-name="${name.toLowerCase()}">
          <div class="exchange-header">
            <div class="exchange-name">${name}</div>
            <div class="exchange-type">${rateType}</div>
          </div>
          <div class="exchange-rates">
            ${displayRates}
          </div>
          <div class="exchange-source">Fuente: ${source}</div>
        </div>
      `;
    });

    return html;
  };

  // HTML completo
  container.innerHTML = `
    ${filterControls}
    <div class="exchanges-list">
      ${renderExchanges(exchanges)}
    </div>
  `;

  // Configurar event listeners para filtros
  setupExchangeFilters(exchanges);
}

// Configurar filtros de exchanges
function setupExchangeFilters(allExchanges) {
  const searchInput = document.getElementById('exchange-search');
  const filterButtons = document.querySelectorAll('[data-filter]');

  const applyFilters = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('[data-filter].active')?.dataset.filter || 'all';

    let filtered = allExchanges;

    // Filtrar por tipo
    if (activeFilter !== 'all') {
      filtered = filtered.filter(([code, data]) => data.type === activeFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        ([code, data]) =>
          data.name.toLowerCase().includes(searchTerm) || code.toLowerCase().includes(searchTerm)
      );
    }

    // Renderizar resultados filtrados
    const exchangesList = document.querySelector('.exchanges-list');
    if (exchangesList) {
      exchangesList.innerHTML =
        filtered.length > 0
          ? filtered
              .map(([code, data]) => {
                const { name, type, rates, usdRates, source } = data;

                let displayRates = '';
                let rateType = '';

                if (type === 'oficial' && rates) {
                  displayRates = `
              <div class="exchange-rate">
                <span class="rate-label">ARS/USD:</span>
                <span class="rate-value">$${Fmt.formatNumber(rates.compra)} / $${Fmt.formatNumber(rates.venta)}</span>
              </div>
            `;
                  rateType = 'Oficial';
                } else if (type === 'usdt_ars' && rates) {
                  displayRates = `
              <div class="exchange-rate">
                <span class="rate-label">USDT/ARS:</span>
                <span class="rate-value">$${Fmt.formatNumber(rates.compra)} / $${Fmt.formatNumber(rates.venta)}</span>
              </div>
            `;
                  rateType = 'USDT/ARS';
                } else if (type === 'usdt_usd' && usdRates) {
                  displayRates = `
              <div class="exchange-rate">
                <span class="rate-label">USDT/USD:</span>
                <span class="rate-value">$${Fmt.formatNumber(usdRates.compra)} / $${Fmt.formatNumber(usdRates.venta)}</span>
              </div>
            `;
                  rateType = 'USDT/USD';
                }

                if (rates && usdRates) {
                  displayRates = `
              <div class="exchange-rate">
                <span class="rate-label">USDT/ARS:</span>
                <span class="rate-value">$${Fmt.formatNumber(rates.compra)} / $${Fmt.formatNumber(rates.venta)}</span>
              </div>
              <div class="exchange-rate">
                <span class="rate-label">USDT/USD:</span>
                <span class="rate-value">$${Fmt.formatNumber(usdRates.compra)} / $${Fmt.formatNumber(usdRates.venta)}</span>
              </div>
            `;
                  rateType = 'USDT/ARS + USD';
                }

                return `
            <div class="exchange-card" data-type="${type}" data-name="${name.toLowerCase()}">
              <div class="exchange-header">
                <div class="exchange-name">${name}</div>
                <div class="exchange-type">${rateType}</div>
              </div>
              <div class="exchange-rates">
                ${displayRates}
              </div>
              <div class="exchange-source">Fuente: ${source}</div>
            </div>
          `;
              })
              .join('')
          : '<div class="no-results">No se encontraron exchanges que coincidan con los filtros</div>';
    }
  };

  // Event listeners
  searchInput?.addEventListener('input', applyFilters);

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      applyFilters();
    });
  });
}

// Obtener nombre legible del exchange
function getExchangeDisplayName(exchangeCode) {
  const exchangeNames = {
    // Exchanges principales (ordenados alfabéticamente)
    astropay: 'AstroPay',
    belo: 'Belo',
    binance: 'Binance',
    binancep2p: 'Binance P2P',
    bingxp2p: 'BingX P2P',
    bitfinex: 'Bitfinex',
    bitget: 'Bitget',
    bitgetp2p: 'Bitget P2P',
    bitstamp: 'Bitstamp',
    bitso: 'Bitso',
    bitsoalpha: 'Bitso Alpha',
    buenbit: 'Buenbit',
    bybit: 'Bybit',
    bybitp2p: 'Bybit P2P',
    cexio: 'CEX.IO',
    cocoscrypto: "Coco's Crypto",
    coinbase: 'Coinbase',
    coinexp2p: 'CoinEx P2P',
    cryptomktpro: 'CryptoMKT Pro',
    decrypto: 'DeCrypto',
    eldoradop2p: 'Eldorado P2P',
    eluter: 'Eluter',
    fiwind: 'FiWind',
    gateio: 'Gate.io',
    gemini: 'Gemini',
    huobi: 'Huobi',
    huobip2p: 'Huobi P2P',
    kraken: 'Kraken',
    kucoin: 'KuCoin',
    kucoinp2p: 'KuCoin P2P',
    lemoncash: 'Lemon Cash',
    lemoncashp2p: 'Lemon Cash P2P',
    letsbit: 'LetsBit',
    mexc: 'MEXC',
    mexcp2p: 'MEXC P2P',
    okx: 'OKX',
    okexp2p: 'OKX P2P',
    paydecep2p: 'PayDece P2P',
    pluscrypto: 'PlusCrypto',
    poloniex: 'Poloniex',
    ripio: 'Ripio',
    ripioexchange: 'Ripio Exchange',
    saldo: 'Saldo',
    satoshitango: 'SatoshiTango',
    tiendacrypto: 'TiendaCrypto',
    trubit: 'Trubit',
    universalcoins: 'Universal Coins',
    vitawallet: 'VitaWallet',
    wallbit: 'Wallbit',
    weexp2p: 'WeeX P2P',
    // Legacy/otros
    banexcoin: 'Banexcoin',
    xapo: 'Xapo',
    x4t: 'X4T'
  };

  return (
    exchangeNames[exchangeCode] || exchangeCode.charAt(0).toUpperCase() + exchangeCode.slice(1)
  );
}
function getBankDisplayName(bankCode) {
  const bankNames = {
    nacion: 'Banco Nación',
    bbva: 'BBVA',
    piano: 'Banco Piano',
    hipotecario: 'Banco Hipotecario',
    galicia: 'Banco Galicia',
    santander: 'Banco Santander',
    ciudad: 'Banco Ciudad',
    supervielle: 'Banco Supervielle',
    patagonia: 'Banco Patagonia',
    comafi: 'Banco Comafi',
    icbc: 'ICBC',
    bind: 'Bind',
    bancor: 'Bancor',
    chaco: 'Banco Chaco',
    pampa: 'Banco Pampa',
    promedio: 'Promedio Bancos',
    menor_valor: 'Menor Valor'
  };

  return bankNames[bankCode] || bankCode.charAt(0).toUpperCase() + bankCode.slice(1);
}

// CORREGIDO v5.0.69: Función para cargar cotizaciones bancarias reales
async function loadBankRates() {
  const container = document.getElementById('banks-list');
  // Botón de refresh eliminado - funcionalidad ahora en botón principal del popup

  // Mostrar loading
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando cotizaciones de exchanges...</p>
    </div>
  `;

  // Deshabilitar botón mientras carga (comentado - botón eliminado)
  // if (refreshBtn) {
  //   refreshBtn.disabled = true;
  //   refreshBtn.textContent = '⏳ Cargando...';
  // }

  try {
    // Obtener datos directamente de las APIs configuradas
    const exchangeRates = await fetchExchangeRatesFromAPIs();

    if (exchangeRates && Object.keys(exchangeRates).length > 0) {
      console.log(
        '[POPUP] 📊 Cotizaciones de exchanges obtenidas:',
        Object.keys(exchangeRates).length,
        'exchanges'
      );
      await displayExchangeRates(exchangeRates);
    } else {
      // Sin datos disponibles
      container.innerHTML = `
        <div class="select-prompt">
          <p>📊 No hay cotizaciones disponibles</p>
          <p style="margin-top: 8px; font-size: 0.85em;">
            Los datos se obtienen de <strong>dolarapi.com</strong>, <strong>criptoya.com</strong>
          </p>
          <p style="margin-top: 8px; font-size: 0.85em; color: #94a3b8;">
            Intenta actualizar nuevamente en unos momentos
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[POPUP] ❌ Error al cargar cotizaciones:', error);
    container.innerHTML = `
      <div class="select-prompt">
        <p>⚠️ Error al cargar cotizaciones</p>
        <p style="margin-top: 8px; font-size: 0.85em; color: #ef4444;">
          ${error.message || 'Error desconocido'}
        </p>
        <p style="margin-top: 8px; font-size: 0.85em; color: #94a3b8;">
          Intenta actualizar nuevamente
        </p>
      </div>
    `;
  } finally {
    // Rehabilitar botón (comentado - botón eliminado)
    // if (refreshBtn) {
    //   refreshBtn.disabled = false;
    //   refreshBtn.textContent = '🔄 Actualizar';
    // }
  }
}

/**
 * Actualizar timestamp con indicador de frescura
 */
function updateTimestampWithFreshness(container, timestamp) {
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

// PRESETS DEL SIMULADOR v5.0.82
const SIMULATOR_PRESETS = {
  conservative: {
    name: 'Conservador',
    description: 'Fees altos, comisiones máximas - Escenario pesimista',
    buyFee: 1.5,
    sellFee: 1.5,
    transferFee: 5.0,
    bankCommission: 1.0,
    spreadMultiplier: 1.03 // 3% spread en USD
  },
  moderate: {
    name: 'Moderado',
    description: 'Configuración balanceada - Escenario realista',
    buyFee: 1.0,
    sellFee: 1.0,
    transferFee: 2.0,
    bankCommission: 0.5,
    spreadMultiplier: 1.02 // 2% spread en USD
  },
  aggressive: {
    name: 'Agresivo',
    description: 'Fees mínimos - Escenario optimista',
    buyFee: 0.5,
    sellFee: 0.5,
    transferFee: 0,
    bankCommission: 0,
    spreadMultiplier: 1.01 // 1% spread en USD
  }
};

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

  // NUEVO v5.0.82: Configurar presets
  setupSimulatorPresets();

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

// NUEVO v5.0.82: Configurar botones de presets
function setupSimulatorPresets() {
  const presetButtons = document.querySelectorAll('.btn-preset');

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetName = btn.dataset.preset;
      applySimulatorPreset(presetName);

      // Actualizar estado activo de botones
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  console.log('✅ Presets del simulador configurados');
}

// NUEVO v5.0.82: Aplicar preset al simulador
function applySimulatorPreset(presetName) {
  const preset = SIMULATOR_PRESETS[presetName];
  if (!preset) {
    console.warn(`⚠️ Preset desconocido: ${presetName}`);
    return;
  }

  const officialPrice = currentData?.dollarPrice || 950;

  // Obtener elementos
  const elements = {
    usdBuy: document.getElementById('sim-usd-buy-price'),
    usdSell: document.getElementById('sim-usd-sell-price'),
    buyFee: document.getElementById('sim-buy-fee'),
    sellFee: document.getElementById('sim-sell-fee'),
    transferFee: document.getElementById('sim-transfer-fee-usd'),
    bankCommission: document.getElementById('sim-bank-commission')
  };

  // Verificar elementos
  const missing = Object.entries(elements)
    .filter(([, el]) => !el)
    .map(([k]) => k);
  if (missing.length > 0) {
    console.warn('⚠️ Elementos faltantes para preset:', missing);
    return;
  }

  // Aplicar valores del preset
  elements.usdBuy.value = officialPrice.toFixed(2);
  elements.usdSell.value = (officialPrice * preset.spreadMultiplier).toFixed(2);
  elements.buyFee.value = preset.buyFee.toFixed(2);
  elements.sellFee.value = preset.sellFee.toFixed(2);
  elements.transferFee.value = preset.transferFee.toFixed(2);
  elements.bankCommission.value = preset.bankCommission.toFixed(2);

  console.log(`✅ Preset "${preset.name}" aplicado:`, preset);

  // Mostrar tooltip de confirmación
  showPresetTooltip(preset.name, preset.description);
}

// Mostrar tooltip temporal del preset
function showPresetTooltip(name, description) {
  // Remover tooltip existente
  const existing = document.querySelector('.preset-tooltip');
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'preset-tooltip';
  tooltip.innerHTML = `<strong>${name}</strong>: ${description}`;
  tooltip.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(59, 130, 246, 0.95);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.85em;
    z-index: 9999;
    animation: fadeInUp 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(tooltip);

  setTimeout(() => {
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s ease';
    setTimeout(() => tooltip.remove(), 300);
  }, 2500);
}

function loadDefaultSimulatorValues() {
  // Cargar valores desde la configuración del usuario y datos actuales
  const officialPrice = currentData?.dollarPrice || 950;

  // Verificar que los elementos existan antes de asignar valores
  const simAmountInput = document.getElementById('sim-amount');
  const usdBuyInput = document.getElementById('sim-usd-buy-price');
  const usdSellInput = document.getElementById('sim-usd-sell-price');
  const buyFeeInput = document.getElementById('sim-buy-fee');
  const sellFeeInput = document.getElementById('sim-sell-fee');
  const transferFeeInput = document.getElementById('sim-transfer-fee-usd');
  const bankCommissionInput = document.getElementById('sim-bank-commission');

  if (
    !usdBuyInput ||
    !usdSellInput ||
    !buyFeeInput ||
    !sellFeeInput ||
    !transferFeeInput ||
    !bankCommissionInput
  ) {
    console.warn('⚠️ No se encontraron todos los inputs del simulador');
    return;
  }

  // Monto por defecto desde configuración de interfaz
  if (simAmountInput && userSettings?.simulatorDefaultAmount) {
    simAmountInput.value = userSettings.simulatorDefaultAmount;
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
    defaultAmount: userSettings?.simulatorDefaultAmount,
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
  console.log(
    '🔍 [MATRIZ] Iniciando generateRiskMatrix...',
    useCustomParams ? 'con parámetros personalizados' : 'con datos automáticos'
  );
  console.log('🔍 [MATRIZ] currentData:', currentData ? 'existe' : 'null');
  console.log(
    '🔍 [MATRIZ] currentData.banks:',
    currentData?.banks ? Object.keys(currentData.banks).length + ' bancos' : 'no existe'
  );
  console.log(
    '🔍 [MATRIZ] currentData.usdt:',
    currentData?.usdt ? Object.keys(currentData.usdt).length + ' exchanges' : 'no existe'
  );

  const amountInput = document.getElementById('sim-amount');
  const amount = parseFloat(amountInput?.value) || 1000000;

  // Validar monto
  if (!amount || amount < 1000) {
    alert('⚠️ Ingresa un monto válido (mínimo $1,000 ARS)');
    return;
  }

  const usdPrices = [];
  let usdtPrices = [];

  if (useCustomParams) {
    // MODO PERSONALIZADO: Usar valores de los inputs
    log('[MATRIZ] Usando parámetros personalizados del usuario');
    const usdMinInput =
      parseFloat(document.getElementById('matrix-usd-min')?.value) ||
      currentData?.oficial?.compra ||
      1000;
    const usdMaxInput =
      parseFloat(document.getElementById('matrix-usd-max')?.value) ||
      currentData?.oficial?.compra * 1.5 ||
      1500;
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
      usdPrices.push(usdMinInput + ((usdMaxInput - usdMinInput) * i) / 4);
      usdtPrices.push(usdtMinInput + ((usdtMaxInput - usdtMinInput) * i) / 4);
    }

    log(
      '[MATRIZ] Parámetros personalizados - USD:',
      usdPrices.map(p => p.toFixed(2)),
      'USDT:',
      usdtPrices.map(p => p.toFixed(2))
    );
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
        log(
          '[MATRIZ] Datos de bancos cargados:',
          currentData?.banks ? Object.keys(currentData.banks).length + ' bancos' : 'falló'
        );
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
          usdPrices.push(usdMin + ((usdMax - usdMin) * i) / 4);
        }

        log(
          '[MATRIZ] USD - Mínimo de bancos:',
          usdMin.toFixed(2),
          'Máximo (min+50%):',
          usdMax.toFixed(2)
        );
        log('[MATRIZ] Precios USD generados:', usdPrices.length, 'valores');
      }
    }

    // Si no hay datos de bancos, usar precio oficial o fallback
    if (usdPrices.length === 0) {
      const usdMin =
        currentData?.oficial?.compra ||
        parseFloat(document.getElementById('matrix-usd-min')?.value) ||
        1000;
      const usdMax = usdMin * 1.5;
      for (let i = 0; i < 5; i++) {
        usdPrices.push(usdMin + ((usdMax - usdMin) * i) / 4);
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
        usdtPrices.push(usdtMin + ((usdtMax - usdtMin) * i) / 4);
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
  const bankCommissionPercent =
    parseFloat(document.getElementById('sim-bank-commission')?.value) || 0;

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

      tableHTML += `<td class="${cellClass}" title="Ganancia: $${Fmt.formatNumber(profit)} ARS (${profitPercent.toFixed(2)}%)">${profitPercent.toFixed(2)}%</td>`;
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
  const configureBtn = document.getElementById('configure-dollar');

  if (configureBtn) {
    configureBtn.addEventListener('click', openDollarConfiguration);
  }
}

/**
 * Configurar modal de detalles de ruta
 */
function setupRouteDetailsModal() {
  console.log('📱 [POPUP] Configurando modal de detalles de ruta');

  // Event listener para cerrar modal
  const modalClose = document.getElementById('modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closeRouteDetailsModal);
  }

  // Event listener para cerrar modal al hacer click en el overlay
  const modalOverlay = document.getElementById('route-details-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) {
        closeRouteDetailsModal();
      }
    });
  }

  // Event listener para cerrar modal con tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
      closeRouteDetailsModal();
    }
  });

  console.log('✅ [POPUP] Modal de detalles configurado');
}

// Mostrar información del precio del dólar
function displayDollarInfo(officialData) {
  console.log('💵 [DISPLAY] displayDollarInfo() llamado con:', {
    officialData: officialData,
    compra: officialData?.compra,
    source: officialData?.source,
    timestamp: officialData?.timestamp ? new Date(officialData.timestamp).toLocaleString() : 'N/A'
  });

  const dollarInfo = document.getElementById('dollar-info');
  const dollarPrice = document.getElementById('dollar-current-price');
  const dollarSource = document.getElementById('dollar-source-text');

  if (!dollarInfo || !officialData) {
    console.log('❌ [DISPLAY] No hay dollarInfo o officialData - ocultando elemento');
    if (dollarInfo) dollarInfo.style.display = 'none';
    return;
  }

  console.log(
    `💵 [DISPLAY] Actualizando display del dólar: $${officialData.compra} (${officialData.source})`
  );

  // CORREGIDO v5.0.35: Después del fix de campos API, mostrar precio de COMPRA (lo que pagamos por comprar USD)
  dollarPrice.textContent = `$${Fmt.formatNumber(officialData.compra)}`;
  dollarSource.textContent = `Fuente: ${getDollarSourceDisplay(officialData)}`;

  console.log('✅ [DISPLAY] Display actualizado:', {
    precioMostrado: dollarPrice.textContent,
    fuenteMostrada: dollarSource.textContent
  });

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

/**
 * Verificar actualizaciones al cargar el popup
 */
async function checkForUpdatesOnPopupLoad() {
  const { pendingUpdate } = await chrome.storage.local.get('pendingUpdate');
  
  if (!pendingUpdate) {
    console.log('✅ [UPDATE] No hay actualizaciones pendientes');
    return;
  }
  
  // Verificar si la versión descartada expiró
  const { dismissedUpdate } = await chrome.storage.local.get('dismissedUpdate');
  if (dismissedUpdate && dismissedUpdate.expiresAt > Date.now()) {
    if (dismissedUpdate.version === pendingUpdate.latestVersion) {
      console.log('✅ [UPDATE] Actualización ya descartada');
      return;
    }
  }
  
  // Mostrar banner
  showUpdateBanner(pendingUpdate);
}

/**
 * Mostrar banner de actualización con información de versión
 */
function showUpdateBanner(updateInfo) {
  const banner = document.getElementById('update-banner');
  const currentVersionEl = document.getElementById('current-version');
  const newVersionEl = document.getElementById('new-version');
  const messageEl = document.getElementById('update-message');
  const typeBadgeEl = document.getElementById('update-type');
  
  if (!banner) return;
  
  currentVersionEl.textContent = `v${updateInfo.currentVersion}`;
  newVersionEl.textContent = `v${updateInfo.latestVersion}`;
  messageEl.textContent = updateInfo.message || 'Nueva versión disponible';
  
  // Determinar tipo de actualización
  const current = updateInfo.currentVersion.split('.').map(Number);
  const latest = updateInfo.latestVersion.split('.').map(Number);
  
  let updateType = 'PATCH';
  if (latest[0] > current[0]) updateType = 'MAJOR';
  else if (latest[1] > current[1]) updateType = 'MINOR';
  
  typeBadgeEl.textContent = updateType;
  banner.className = `update-banner type-${updateType.toLowerCase()}`;
  banner.style.display = 'flex';
  
  // Configurar botones
  setupUpdateBannerButtons(updateInfo);
}

/**
 * Configurar botones del banner de actualización
 */
async function setupUpdateBannerButtons(updateInfo) {
  const viewBtn = document.getElementById('view-update');
  const dismissBtn = document.getElementById('dismiss-update');
  
  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: updateInfo.url });
    });
  }
  
  if (dismissBtn) {
    dismissBtn.addEventListener('click', async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      await chrome.storage.local.set({
        dismissedUpdate: {
          version: updateInfo.latestVersion,
          dismissedAt: Date.now(),
          expiresAt: expiryDate.getTime()
        }
      });
      
      hideUpdateBanner();
    });
  }
}

/**
 * Ocultar banner de actualización
 */
function hideUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}

// ==========================================
// FUNCIONES DE MODAL Y UI
// ==========================================

/**
 * Abrir modal con detalles de la ruta
 */
function openRouteDetailsModal(arbitrage) {
  console.log('📱 [POPUP] Abriendo modal de detalles para:', arbitrage);

  // Calcular valores usando función auxiliar
  const values = calculateGuideValues(arbitrage);
  console.log('📊 [POPUP] Valores calculados para el modal:', values);

  // Actualizar título del modal
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) {
    modalTitle.textContent = `Ruta: ${values.broker}`;
  }

  // Generar HTML del modal usando funciones auxiliares
  const modalHtml = `
    <div class="guide-container-simple">
      ${generateGuideHeader(values.broker, values.profitPercentage)}
      ${generateGuideSteps(values)}
    </div>
  `;

  // Insertar contenido en el modal
  const modalBody = document.getElementById('modal-body');
  if (modalBody) {
    modalBody.innerHTML = modalHtml;
    console.log('✅ [POPUP] Contenido insertado en el modal');

    // Configurar animaciones
    setupGuideAnimations(modalBody);
  } else {
    console.error('❌ [POPUP] No se encontró el body del modal');
  }

  // Mostrar modal
  const modal = document.getElementById('route-details-modal');
  if (modal) {
    modal.style.display = 'flex';
    console.log('✅ [POPUP] Modal mostrado');
  } else {
    console.error('❌ [POPUP] No se encontró el modal');
  }
}

/**
 * Cerrar modal de detalles de ruta
 */
function closeRouteDetailsModal() {
  console.log('📱 [POPUP] Cerrando modal de detalles');

  const modal = document.getElementById('route-details-modal');
  if (modal) {
    modal.style.display = 'none';
    console.log('✅ [POPUP] Modal cerrado');
  }
}

/**
 * Función global para resetear todos los filtros
 */
function resetAllFilters() {
  // Resetear filtro P2P
  currentFilter = 'no-p2p';
  const defaultButton = document.querySelector('[data-filter="no-p2p"]');
  if (defaultButton) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    defaultButton.classList.add('active');
  }

  // Resetear filtros avanzados
  resetAdvancedFilters();
}

// Función auxiliar para mostrar notificaciones toast
function showToast(message, type = 'info') {
  // Crear elemento toast si no existe
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: toastSlideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background =
    type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

  // Auto-remover después de 3 segundos
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 3000);
}

// Event listener global para botones de retry
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('retry-btn') && event.target.dataset.action === 'reload') {
    location.reload();
  }
});

/**
 * Cargar datos de bancos con sistema de tabs
 */
async function loadBanksData() {
  const banksList = document.getElementById('banks-list');
  if (!banksList) {
    console.error('❌ ERROR: No se encontró el elemento banks-list');
    return;
  }

  console.log('🚀 Iniciando loadBanksData...');

  try {
    // Mostrar loading
    banksList.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Cargando cotizaciones de exchanges...</p>
      </div>
    `;

    console.log('📡 Enviando mensaje getBanksData al background...');

    // Obtener datos de background
    const response = await chrome.runtime.sendMessage({ action: 'getBanksData' });
    console.log('📨 Respuesta del background:', response);

    if (!response) {
      throw new Error('No se recibió respuesta del background');
    }

    if (!response.success) {
      throw new Error(response?.error || 'No se pudieron obtener los datos de bancos');
    }

    const { dollarTypes, usdtUsdData, usdtData } = response.data;
    console.log('📊 Datos procesados:', {
      dollarTypes: dollarTypes ? Object.keys(dollarTypes).length + ' bancos' : 'null/undefined',
      usdtUsdData: usdtUsdData
        ? Object.keys(usdtUsdData).length + ' exchanges USD/USDT'
        : 'null/undefined',
      usdtData: usdtData ? Object.keys(usdtData).length + ' exchanges USDT/ARS' : 'null/undefined'
    });

    // Verificar que tenemos datos
    if (!dollarTypes || Object.keys(dollarTypes).length === 0) {
      console.warn('⚠️ WARNING: dollarTypes está vacío o undefined');
    }
    if (!usdtUsdData || Object.keys(usdtUsdData).length === 0) {
      console.warn('⚠️ WARNING: usdtUsdData está vacío o undefined');
    }
    if (!usdtData || Object.keys(usdtData).length === 0) {
      console.warn('⚠️ WARNING: usdtData está vacío o undefined');
    }

    // Obtener configuraciones del usuario
    const userSettings = await getUserSettings();
    console.log('🔍 User settings:', userSettings);

    // Almacenar datos globalmente para actualizaciones de ordenamiento
    window.currentBanksData = { dollarTypes, usdtUsdData, usdtData, userSettings };
    console.log('💾 Datos almacenados en window.currentBanksData');

    // Generar HTML con tabs
    const html = generateBanksTabsHTML(dollarTypes, usdtUsdData, usdtData, userSettings);
    console.log('📄 HTML generado, longitud:', html.length);

    if (!html || html.length < 100) {
      console.error('❌ ERROR: HTML generado es demasiado corto o vacío');
      throw new Error('Error generando HTML de pestañas');
    }

    banksList.innerHTML = html;
    console.log('✅ HTML asignado al DOM');

    // Inicializar funcionalidad de tabs
    initializeBanksTabs();
    console.log('✅ Pestañas inicializadas');
  } catch (error) {
    console.error('❌ Error cargando datos de bancos:', error);
    banksList.innerHTML = `
      <div class="error-message">
        <p>❌ Error al cargar cotizaciones</p>
        <p>${error.message}</p>
        <button onclick="loadBanksData()" class="retry-btn">Reintentar</button>
      </div>
    `;
  }
}

/**
 * Generar HTML para los tabs de bancos
 */
function generateBanksTabsHTML(dollarTypes, usdtUsdData, usdtData, userSettings = null) {
  let html = `
    <div class="banks-tabs">
      <button class="banks-tab-btn active" data-tab="usd-oficial">USD Oficial</button>
      <button class="banks-tab-btn" data-tab="usd-usdt">USD/USDT</button>
      <button class="banks-tab-btn" data-tab="usdt-ars">USDT/ARS</button>
    </div>

    <div class="banks-sort-controls">
      <button class="sort-btn active" data-sort="name" data-direction="asc" title="Ordenar por empresa">
        🏢 Empresa ↑
      </button>
      <button class="sort-btn" data-sort="buy" data-direction="desc" title="Ordenar por precio de compra">
        💰 Compra ↓
      </button>
      <button class="sort-btn" data-sort="sell" data-direction="desc" title="Ordenar por precio de venta">
        💸 Venta ↓
      </button>
    </div>

    <div class="banks-column-headers">
      <div class="column-header">Empresa</div>
      <div class="column-header">Compra</div>
      <div class="column-header">Venta</div>
    </div>
  `;

  // Obtener preferencia de ordenamiento
  const activeSort = localStorage.getItem('banksActiveSort') || 'sell';
  const sortDirection = localStorage.getItem(`banksSort${activeSort}Direction`) || 'desc';
  const sortPreference = `${activeSort}-${sortDirection}`;

  // 1. USD Oficial (bancos tradicionales)
  html += `
    <div class="banks-tab-content usd-oficial-content active">
  `;
  html += generateUSDOfficialTab(dollarTypes, sortPreference, userSettings);
  html += `
    </div>
  `;

  // 2. USD/USDT por exchange
  html += `
    <div class="banks-tab-content usd-usdt-content">
  `;
  html += generateUSDTUSDTTab(usdtUsdData, sortPreference, userSettings);
  html += `
    </div>
  `;

  // 3. USDT/ARS por exchange
  html += `
    <div class="banks-tab-content usdt-ars-content">
  `;
  html += generateUSDTARSTab(usdtData, sortPreference, userSettings);
  html += `
    </div>
  `;

  return html;
}

/**
 * Generar HTML para la pestaña USD Oficial
 */
function generateUSDOfficialTab(dollarTypes, sortPreference, userSettings = null) {
  // Filtrar bancos según selección del usuario
  if (userSettings && dollarTypes) {
    dollarTypes = filterBanksBySelection(dollarTypes, userSettings.selectedBanks);
  }

  if (!dollarTypes || Object.keys(dollarTypes).length === 0) {
    return `
      <div class="banks-section">
        <div class="no-data">
          <p>No hay datos disponibles para bancos oficiales</p>
        </div>
      </div>
    `;
  }

  let html = `
    <div class="banks-section">
  `;

  // Ordenar bancos según preferencia
  const sortedBanks = applySortingToData(Object.entries(dollarTypes), sortPreference).slice(0, 12); // Mostrar hasta 12 bancos

  sortedBanks.forEach(([bankName, bankData]) => {
    const buyPrice = bankData.compra || bankData.bid || bankData.price || 0;
    const sellPrice = bankData.venta || bankData.ask || bankData.price || 0;

    html += `
      <div class="bank-row">
        <div class="bank-name">${bankName.toUpperCase()}</div>
        <div class="bank-buy">$${Fmt.formatNumber(buyPrice)}</div>
        <div class="bank-sell">$${Fmt.formatNumber(sellPrice)}</div>
      </div>
    `;
  });

  html += `
      </div>
  `;

  return html;
}

/**
 * Generar HTML para la pestaña USD/USDT
 */
function generateUSDTUSDTTab(usdtUsdData, sortPreference, userSettings = null) {
  // Filtrar exchanges según selección del usuario
  if (userSettings && usdtUsdData) {
    usdtUsdData = filterExchangesBySelection(usdtUsdData, userSettings.notificationExchanges);
  }

  if (!usdtUsdData || Object.keys(usdtUsdData).length === 0) {
    return `
      <div class="banks-section">
        <div class="no-data">
          <p>No hay datos disponibles para exchanges USD/USDT</p>
        </div>
      </div>
    `;
  }

  console.log('✅ Generando sección USD/USDT con', Object.keys(usdtUsdData).length, 'exchanges');

  let html = `
    <div class="banks-section">
  `;

  // Ordenar exchanges según preferencia
  const sortedExchanges = applySortingToData(Object.entries(usdtUsdData), sortPreference).slice(
    0,
    12
  ); // Mostrar hasta 12 exchanges

  sortedExchanges.forEach(([exchangeName, exchangeData]) => {
    const bidPrice = exchangeData.bid || exchangeData.price || 0;
    const askPrice = exchangeData.ask || exchangeData.price || 0;

    html += `
      <div class="bank-row">
        <div class="bank-name">${exchangeName}</div>
        <div class="bank-buy">$${Fmt.formatNumber(bidPrice)}</div>
        <div class="bank-sell">$${Fmt.formatNumber(askPrice)}</div>
      </div>
    `;
  });

  html += `
      </div>
  `;

  return html;
}

/**
 * Generar HTML para la pestaña USDT/ARS
 */
function generateUSDTARSTab(usdtData, sortPreference, userSettings = null) {
  // Filtrar exchanges según selección del usuario
  if (userSettings && usdtData) {
    usdtData = filterExchangesBySelection(usdtData, userSettings.notificationExchanges);
  }

  if (!usdtData || Object.keys(usdtData).length === 0) {
    return `
      <div class="banks-section">
        <div class="no-data">
          <p>No hay datos disponibles para exchanges USDT/ARS</p>
        </div>
      </div>
    `;
  }

  let html = `
    <div class="banks-section">
  `;

  // Ordenar exchanges según preferencia
  const sortedExchanges = applySortingToData(Object.entries(usdtData), sortPreference).slice(0, 12); // Mostrar hasta 12 exchanges

  sortedExchanges.forEach(([exchangeName, exchangeData]) => {
    const bidPrice = exchangeData.bid || exchangeData.price || 0;
    const askPrice = exchangeData.ask || exchangeData.price || 0;

    html += `
      <div class="bank-row">
        <div class="bank-name">${exchangeName}</div>
        <div class="bank-buy">$${Fmt.formatNumber(bidPrice)}</div>
        <div class="bank-sell">$${Fmt.formatNumber(askPrice)}</div>
      </div>
    `;
  });

  html += `
      </div>
  `;

  return html;
}

/**
 * Inicializar funcionalidad de tabs para bancos
 */
function initializeBanksTabs() {
  const tabButtons = document.querySelectorAll('.banks-tab-btn');
  const tabContents = document.querySelectorAll('.banks-tab-content');
  const sortSelect = document.getElementById('banks-sort-select');

  // Configurar botones de tabs
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remover clase active de todos los botones
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // Agregar clase active al botón clickeado
      button.classList.add('active');

      // Ocultar todos los contenidos
      tabContents.forEach(content => content.classList.remove('active'));
      // Mostrar contenido correspondiente
      const tabId = button.dataset.tab;
      const targetContent = document.querySelector(`.${tabId}-content`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // Configurar botones de ordenamiento
  const sortButtons = document.querySelectorAll('.sort-btn');
  sortButtons.forEach(button => {
    const sortType = button.dataset.sort;
    const currentDirection =
      localStorage.getItem(`banksSort${sortType}Direction`) || button.dataset.direction;

    // Establecer estado inicial
    button.dataset.direction = currentDirection;
    button.textContent = getSortButtonText(sortType, currentDirection);

    // Si es el botón activo guardado, marcarlo como active
    const activeSort = localStorage.getItem('banksActiveSort') || 'sell';
    if (sortType === activeSort) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      // Remover clase active de todos los botones
      sortButtons.forEach(btn => btn.classList.remove('active'));
      // Agregar clase active al botón clickeado
      button.classList.add('active');

      // Cambiar dirección
      const currentDirection = button.dataset.direction;
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      button.dataset.direction = newDirection;

      // Actualizar texto del botón
      button.textContent = getSortButtonText(sortType, newDirection);

      // Guardar preferencias
      localStorage.setItem(`banksSort${sortType}Direction`, newDirection);
      localStorage.setItem('banksActiveSort', sortType);

      // Actualizar solo la pestaña activa con nueva ordenación
      updateActiveTabSorting();
    });
  });
}

/**
 * Obtener texto para botón de ordenamiento
 */
function getSortButtonText(sortType, direction) {
  const icons = {
    name: '🏢',
    buy: '💰',
    sell: '💸'
  };

  const labels = {
    name: 'Empresa',
    buy: 'Compra',
    sell: 'Venta'
  };

  const arrows = {
    asc: '↑',
    desc: '↓'
  };

  return `${icons[sortType]} ${labels[sortType]} ${arrows[direction]}`;
}

/**
 * Obtener configuraciones de usuario desde chrome.storage
 */
async function getUserSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(
      {
        selectedBanks: undefined,
        preferredExchanges: [],
        notificationExchanges: ['binance', 'buenbit', 'lemoncash', 'ripio', 'fiwind', 'letsbit']
      },
      settings => {
        resolve(settings);
      }
    );
  });
}

/**
 * Filtrar bancos según selección del usuario
 */
function filterBanksBySelection(dollarTypes, selectedBanks) {
  if (!selectedBanks || selectedBanks.length === 0) {
    // Si no hay selección, usar bancos por defecto
    const defaultBanks = ['bna', 'galicia', 'santander', 'bbva', 'icbc'];
    selectedBanks = defaultBanks;
  }

  const filtered = {};
  selectedBanks.forEach(bankKey => {
    if (dollarTypes[bankKey]) {
      filtered[bankKey] = dollarTypes[bankKey];
    }
  });

  return filtered;
}

/**
 * Filtrar exchanges según selección del usuario
 */
function filterExchangesBySelection(exchangeData, notificationExchanges) {
  if (!notificationExchanges || notificationExchanges.length === 0) {
    // Si no hay exchanges de notificación, mostrar todos
    return exchangeData;
  }

  const filtered = {};
  notificationExchanges.forEach(exchangeKey => {
    if (exchangeData[exchangeKey]) {
      filtered[exchangeKey] = exchangeData[exchangeKey];
    }
  });

  return filtered;
}

/**
 * Actualizar ordenamiento de todas las pestañas manteniendo la activa
 */
function updateActiveTabSorting() {
  // Obtener la pestaña actualmente activa
  const activeTabButton = document.querySelector('.banks-tab-btn.active');
  const activeTab = activeTabButton ? activeTabButton.dataset.tab : 'usd-oficial';

  console.log(
    '🔄 Actualizando ordenamiento para todas las pestañas, manteniendo activa:',
    activeTab
  );

  // Obtener preferencia de ordenamiento actual
  const activeSort = localStorage.getItem('banksActiveSort') || 'sell';
  const sortDirection = localStorage.getItem(`banksSort${activeSort}Direction`) || 'desc';
  const sortPreference = `${activeSort}-${sortDirection}`;

  // Si no tenemos datos almacenados, recargar todo
  if (!window.currentBanksData) {
    loadBanksData();
    return;
  }

  const { dollarTypes, usdtUsdData, usdtData, userSettings } = window.currentBanksData;

  // Regenerar todo el HTML del contenedor de bancos
  const banksList = document.getElementById('banks-list');
  if (banksList) {
    const html = generateBanksTabsHTML(dollarTypes, usdtUsdData, usdtData, userSettings);
    banksList.innerHTML = html;

    // Re-inicializar los event listeners después de regenerar el HTML
    initializeBanksTabs();

    // Asegurar que la pestaña correcta esté activa (tanto botones como contenido)
    const activeTabButton = document.querySelector(`.banks-tab-btn[data-tab="${activeTab}"]`);
    const activeTabContent = document.querySelector(`.${activeTab}-content`);

    if (activeTabButton && activeTabContent) {
      // Remover clase active de todos los botones y contenidos
      document.querySelectorAll('.banks-tab-btn').forEach(btn => btn.classList.remove('active'));
      document
        .querySelectorAll('.banks-tab-content')
        .forEach(content => content.classList.remove('active'));

      // Agregar clase active al botón y contenido correctos
      activeTabButton.classList.add('active');
      activeTabContent.classList.add('active');
    }
  }

  console.log('✅ Todas las pestañas actualizadas con nuevo ordenamiento, navegación intacta');
}

/**
 * Aplicar ordenamiento a datos de bancos
 */
function applySortingToData(dataArray, sortPreference) {
  const [sortType, direction] = sortPreference.split('-');

  return dataArray.sort((a, b) => {
    const [nameA, dataA] = a;
    const [nameB, dataB] = b;

    let valueA, valueB;

    if (sortType === 'name') {
      // Ordenar alfabéticamente por nombre
      valueA = nameA.toLowerCase();
      valueB = nameB.toLowerCase();
      return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    } else if (sortType === 'buy') {
      // Ordenar por precio de compra
      valueA = dataA.compra || dataA.bid || dataA.price || 0;
      valueB = dataB.compra || dataB.bid || dataB.price || 0;
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    } else if (sortType === 'sell') {
      // Ordenar por precio de venta
      valueA = dataA.venta || dataA.ask || dataA.price || 0;
      valueB = dataB.venta || dataB.ask || dataB.price || 0;
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    }

    return 0;
  });
}

// ============================================
// CRYPTO ARBITRAGE TAB - NUEVO v6.0
// ============================================

// Estado global para crypto arbitrage
let cryptoRoutes = [];
let filteredCryptoRoutes = [];
let currentCryptoFilter = 'all'; // all, BTC, ETH, etc.
let currentOperationFilter = 'all'; // all, direct, p2p

/**
 * Configurar pestaña de arbitraje cripto
 */
function setupCryptoArbitrageTab() {
  console.log('🔄 Configurando pestaña de Arbitraje Cripto...');

  // Event listener para el selector de criptos
  const cryptoSelector = document.getElementById('crypto-filter');
  if (cryptoSelector) {
    cryptoSelector.addEventListener('change', e => {
      currentCryptoFilter = e.target.value;
      console.log(`💎 Filtro de cripto cambiado a: ${currentCryptoFilter}`);
      filterAndRenderCryptoRoutes();
    });
  }

  // Event listeners para los filtros de operación
  const operationFilters = document.querySelectorAll('.filter-btn-operation');
  operationFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Actualizar estado activo
      operationFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Aplicar filtro
      currentOperationFilter = filter;
      console.log(`⚡ Filtro de operación cambiado a: ${currentOperationFilter}`);
      filterAndRenderCryptoRoutes();
    });
  });

  // Intentar cargar datos iniciales
  fetchAndRenderCryptoRoutes();
}

/**
 * Obtener datos de crypto arbitrage desde el background
 */
function fetchAndRenderCryptoRoutes() {
  console.log('📡 Solicitando datos de crypto arbitrage al background...');

  // Enviar mensaje al background script para obtener crypto routes
  chrome.runtime.sendMessage({ type: 'GET_CRYPTO_ARBITRAGE' }, response => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error comunicándose con background:', chrome.runtime.lastError);
      showCryptoError('Error de comunicación con el servicio');
      return;
    }

    if (response && response.routes) {
      console.log(`✅ Crypto routes recibidas: ${response.routes.length} rutas`);
      cryptoRoutes = response.routes;
      filterAndRenderCryptoRoutes();
    } else {
      console.warn('⚠️ No se recibieron crypto routes del background');
      showCryptoEmpty('No hay datos de arbitraje crypto disponibles');
    }
  });
}

/**
 * Filtrar y renderizar crypto routes según filtros actuales
 */
function filterAndRenderCryptoRoutes() {
  let filtered = [...cryptoRoutes];

  // Filtro por criptomoneda
  if (currentCryptoFilter !== 'all') {
    filtered = filtered.filter(route => route.crypto === currentCryptoFilter);
    console.log(`🔍 Después de filtro crypto (${currentCryptoFilter}): ${filtered.length} rutas`);
  }

  // Filtro por tipo de operación
  if (currentOperationFilter !== 'all') {
    filtered = filtered.filter(route => {
      const opType = route.operationType?.toLowerCase();
      if (currentOperationFilter === 'direct') {
        return opType === 'direct';
      } else if (currentOperationFilter === 'p2p') {
        return opType === 'p2p';
      }
      return true;
    });
    console.log(
      `🔍 Después de filtro operación (${currentOperationFilter}): ${filtered.length} rutas`
    );
  }

  filteredCryptoRoutes = filtered;
  renderCryptoRoutes(filtered);
}

/**
 * Renderizar crypto routes en el contenedor
 */
function renderCryptoRoutes(routes) {
  const container = document.getElementById('crypto-routes-container');
  if (!container) {
    console.error('❌ Contenedor crypto-routes-container no encontrado');
    return;
  }

  // Limpiar contenedor
  container.innerHTML = '';

  if (!routes || routes.length === 0) {
    showCryptoEmpty('No se encontraron oportunidades con los filtros seleccionados');
    return;
  }

  // Renderizar cada ruta
  routes.forEach((route, index) => {
    const card = createCryptoRouteCard(route, index);
    container.appendChild(card);
  });

  console.log(`✅ Renderizadas ${routes.length} crypto routes`);
}

/**
 * Crear card HTML para una ruta de crypto arbitrage
 */
function createCryptoRouteCard(route, index) {
  const card = document.createElement('div');
  card.className = 'crypto-route-card';

  // Agregar clase de profit
  if (route.profitPercent > 2) {
    card.classList.add('profit-high');
  } else if (route.profitPercent < 0) {
    card.classList.add('profit-negative');
  }

  // Data attributes
  card.dataset.crypto = route.crypto;
  card.dataset.operationType = route.operationType;
  card.dataset.index = index;

  // Construir HTML
  card.innerHTML = `
    <div class="crypto-card-header">
      <div class="crypto-info">
        <span class="crypto-icon">${getCryptoIcon(route.crypto)}</span>
        <span class="crypto-name">${route.crypto}</span>
      </div>
      <div class="profit-badge ${route.profitPercent >= 0 ? 'profit-positive' : 'profit-negative'}">
        ${route.profitPercent >= 0 ? '+' : ''}${route.profitPercent.toFixed(2)}%
      </div>
    </div>
    
    <div class="crypto-card-body">
      <div class="route-path">
        <span class="exchange-badge">${capitalizeFirst(route.buyExchange)}</span>
        <span class="arrow">→</span>
        <span class="exchange-badge">${capitalizeFirst(route.sellExchange)}</span>
      </div>
      
      <div class="operation-meta">
        ${getOperationBadge(route.operationType)}
        ${getSpeedIndicator(route.speed)}
        ${getDifficultyIndicator(route.difficulty)}
      </div>
    </div>
    
    <div class="crypto-card-footer">
      <div class="profit-details">
        <span class="label">Ganancia estimada:</span>
        <span class="value ${route.netProfit >= 0 ? '' : 'negative'}">
          $${Fmt.formatNumber(Math.abs(route.netProfit))} ARS
        </span>
      </div>
      <button class="btn-details" data-route-index="${index}">
        Ver detalles
      </button>
    </div>
  `;

  // Agregar event listener al botón de detalles
  const detailsBtn = card.querySelector('.btn-details');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => {
      showCryptoRouteDetails(route);
    });
  }

  return card;
}

/**
 * Obtener icono emoji para cada criptomoneda
 */
function getCryptoIcon(symbol) {
  const icons = {
    BTC: '₿',
    ETH: 'Ξ',
    USDC: '💵',
    USDT: '💲',
    DAI: '◈',
    BNB: '🔶',
    SOL: '◎',
    ADA: '₳',
    XRP: '✕',
    MATIC: '🔷',
    DOGE: '🐕'
  };
  return icons[symbol] || '💎';
}

/**
 * Capitalizar primera letra
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Obtener badge HTML para tipo de operación
 */
function getOperationBadge(operationType) {
  const type = operationType?.toLowerCase() || 'direct';
  const badges = {
    direct: '<span class="operation-badge direct">DIRECT</span>',
    p2p: '<span class="operation-badge p2p">P2P</span>',
    transfer: '<span class="operation-badge transfer">TRANSFER</span>'
  };
  return badges[type] || badges['direct'];
}

/**
 * Obtener indicador de velocidad
 */
function getSpeedIndicator(speed) {
  const speedLower = speed?.toLowerCase() || 'medium';
  const indicators = {
    fast: '<span class="speed-indicator fast">⚡ Rápido</span>',
    medium: '<span class="speed-indicator medium">⏱️ Medio</span>',
    slow: '<span class="speed-indicator slow">🐌 Lento</span>'
  };
  return indicators[speedLower] || indicators['medium'];
}

/**
 * Obtener indicador de dificultad
 */
function getDifficultyIndicator(difficulty) {
  const diffLower = difficulty?.toLowerCase() || 'medium';
  const indicators = {
    easy: '<span class="difficulty-indicator easy">✅ Fácil</span>',
    medium: '<span class="difficulty-indicator medium">⚠️ Medio</span>',
    hard: '<span class="difficulty-indicator hard">🔴 Difícil</span>'
  };
  return indicators[diffLower] || indicators['medium'];
}

/**
 * Mostrar detalles de una ruta crypto en un modal o expandiendo la card
 */
function showCryptoRouteDetails(route) {
  console.log('📊 Mostrando detalles de ruta crypto:', route);

  // Por ahora, mostrar en console.log
  // TODO: Implementar modal similar al de rutas fiat
  const details = `
    🔄 Arbitraje ${route.crypto}
    📍 Ruta: ${route.buyExchange} → ${route.sellExchange}
    💰 Tipo: ${route.operationType}
    ⚡ Velocidad: ${route.speed}
    🎯 Dificultad: ${route.difficulty}
    
    💵 Inversión inicial: $${Fmt.formatNumber(route.calculation?.initialAmount || 0)} ARS
    🛒 Comprar: ${route.calculation?.cryptoPurchased?.toFixed(8) || 0} ${route.crypto}
    💸 Precio compra: $${Fmt.formatNumber(route.buyPriceARS)} ARS
    
    📤 Transferir (después de fees): ${route.calculation?.cryptoAfterNetworkFee?.toFixed(8) || 0} ${route.crypto}
    🌐 Network fee: ${route.calculation?.networkFee?.toFixed(8) || 0} ${route.crypto} ($${Fmt.formatNumber(route.calculation?.networkFeeARS || 0)} ARS)
    
    💰 Vender por: $${Fmt.formatNumber(route.calculation?.arsFromSale || 0)} ARS
    💵 Precio venta: $${Fmt.formatNumber(route.sellPriceARS)} ARS
    
    ✅ Ganancia bruta: $${Fmt.formatNumber(route.grossProfit)} ARS (${route.grossProfitPercent?.toFixed(2)}%)
    💎 Ganancia neta: $${Fmt.formatNumber(route.netProfit)} ARS (${route.profitPercent?.toFixed(2)}%)
    💸 Total fees: $${Fmt.formatNumber(route.fees?.total || 0)} ARS
  `;

  alert(details);
}

/**
 * Mostrar mensaje de error en el contenedor
 */
function showCryptoError(message) {
  const container = document.getElementById('crypto-routes-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">❌</div>
      <div class="empty-state-text">${message}</div>
    </div>
  `;
}

/**
 * Mostrar mensaje de "sin datos" en el contenedor
 */
function showCryptoEmpty(message) {
  const container = document.getElementById('crypto-routes-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-text">${message || 'No hay oportunidades de arbitraje disponibles'}</div>
    </div>
  `;
}
