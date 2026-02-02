// ==========================================
// ARBITRAGE AR - POPUP PRINCIPAL v6.0.0
// ==========================================
// Módulos utilizados (cargados en popup.html):
// - window.StateManager (src/utils/stateManager.js)
// - window.Formatters (src/utils/formatters.js)
// - window.Logger (src/utils/logger.js)
// - window.RouteRenderer (src/ui/routeRenderer.js)
// - window.Simulator (src/modules/simulator.js)
// - window.RouteManager (src/modules/routeManager.js)
// - window.FilterManager (src/modules/filterManager.js)
// - window.ModalManager (src/modules/modalManager.js)
// - window.NotificationManager (src/modules/notificationManager.js)
// - window.CommonUtils (src/utils/commonUtils.js)
// ==========================================
// REFACTORIZADO v6.0.0: Integración de módulos especializados
// - Simulator: Gestión del simulador y matriz de riesgo
// - RouteManager: Gestión y visualización de rutas
// - FilterManager: Gestión de filtros de rutas
// - ModalManager: Gestión de modales y diálogos
// - NotificationManager: Gestión de notificaciones y banners
// - CommonUtils: Funciones utilitarias comunes
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
if (typeof window.Simulator === 'undefined') {
  console.error('❌ Simulator no está cargado');
}
if (typeof window.RouteManager === 'undefined') {
  console.error('❌ RouteManager no está cargado');
}
if (typeof window.FilterManager === 'undefined') {
  console.error('❌ FilterManager no está cargado');
}
if (typeof window.ModalManager === 'undefined') {
  console.error('❌ ModalManager no está cargado');
}
if (typeof window.NotificationManager === 'undefined') {
  console.error('❌ NotificationManager no está cargado');
}
if (typeof window.CommonUtils === 'undefined') {
  console.error('❌ CommonUtils no está cargado');
}

// Aliases para compatibilidad con código legacy
const State = window.StateManager;
const Fmt = window.Formatters;
const Log = window.Logger;
const Sim = window.Simulator;
const RteMgr = window.RouteManager;
const FltMgr = window.FilterManager;
const ModMgr = window.ModalManager;
const NotifMgr = window.NotificationManager;
const Utils = window.CommonUtils;

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
// REFACTORIZADO v6.0.0: Integración de módulos especializados
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [INIT] DOM Content Loaded - Iniciando setup completo del popup...');
  console.log('🔍 [INIT] document.readyState:', document.readyState);
  
  try {
    // Verificar elementos críticos del DOM
    const mainContent = document.getElementById('main-content');
    const optimizedRoutes = document.getElementById('optimized-routes');
    const loading = document.getElementById('loading');
    
    console.log(`🔍 [INIT] Elementos críticos del DOM:`);
    console.log(`  - #main-content: ${!!mainContent}`);
    console.log(`  - #optimized-routes: ${!!optimizedRoutes}`);
    console.log(`  - #loading: ${!!loading}`);
    
    if (!mainContent || !optimizedRoutes || !loading) {
      console.error('❌ [INIT] Faltan elementos críticos del DOM - el HTML puede estar corrupto');
    }
    
    // Cargar configuración del usuario primero
    console.log('🔧 [INIT] Cargando configuración del usuario...');
    await loadUserSettings();
    console.log('✅ [INIT] Configuración del usuario cargada');
    
    // NUEVO v6.0.0: Inicializar módulos especializados
    console.log('🔧 [INIT] Inicializando módulos especializados...');
    
    // Inicializar Simulator con datos y configuración
    Sim.init(currentData, userSettings);
    console.log('✅ [INIT] Simulator inicializado');
    
    // Inicializar RouteManager (se actualizará cuando lleguen los datos)
    RteMgr.init(currentData, userSettings);
    console.log('✅ [INIT] RouteManager inicializado');
    
    // Inicializar FilterManager (se actualizará cuando lleguen las rutas)
    FltMgr.init(userSettings, []);
    console.log('✅ [INIT] FilterManager inicializado');
    
    // Inicializar ModalManager
    ModMgr.init(userSettings);
    console.log('✅ [INIT] ModalManager inicializado');
    
    // Inicializar NotificationManager
    NotifMgr.init(userSettings);
    console.log('✅ [INIT] NotificationManager inicializado');
    
    // Inicializar navegación de tabs
    console.log('🔧 [INIT] Llamando setupTabNavigation()...');
    setupTabNavigation();
    console.log('✅ [INIT] setupTabNavigation() completado');
    
    // Inicializar botón de refresh
    console.log('🔧 [INIT] Llamando setupRefreshButton()...');
    setupRefreshButton();
    console.log('✅ [INIT] setupRefreshButton() completado');
    
    // REEMPLAZO: Configurar botones de filtro usando FilterManager
    console.log('🔧 [INIT] Configurando botones de filtro (FilterManager)...');
    FltMgr.setupFilterButtons();
    console.log('✅ [INIT] Botones de filtro configurados');
    
    // Configurar filtros avanzados usando FilterManager
    console.log('🔧 [INIT] Configurando filtros avanzados (FilterManager)...');
    FltMgr.setupAdvancedFilters();
    console.log('✅ [INIT] Filtros avanzados configurados');
    
    // REEMPLAZO: Configurar simulador usando Simulator
    console.log('🔧 [INIT] Configurando simulador (Simulator)...');
    setupAdvancedSimulator();
    console.log('✅ [INIT] Simulador configurado');
    
    // REEMPLAZO: ModalManager ya se inicializó arriba
    console.log('✅ [INIT] Modal de detalles configurado por ModalManager');
    
    // REEMPLAZO: Verificar actualizaciones usando NotificationManager
    console.log('🔧 [INIT] Verificando actualizaciones (NotificationManager)...');
    NotifMgr.checkForUpdates();
    console.log('✅ [INIT] Verificación de actualizaciones completada');
    
    // Configurar pestaña de arbitraje cripto
    console.log('🔧 [INIT] Llamando setupCryptoArbitrageTab()...');
    setupCryptoArbitrageTab();
    console.log('✅ [INIT] setupCryptoArbitrageTab() completado');
    
    // Cargar y mostrar datos
    console.log('🔧 [INIT] Llamando fetchAndDisplay()...');
    fetchAndDisplay();
    console.log('✅ [INIT] fetchAndDisplay() iniciado');
    
    // Configurar listener de cambios en storage
    console.log('🔧 [INIT] Llamando setupStorageListener()...');
    setupStorageListener();
    console.log('✅ [INIT] setupStorageListener() completado');
    
    // NUEVO v6.0.0: Inicializar sistema de tooltips
    if (typeof window.initTooltips === 'function') {
      console.log('🔧 [INIT] Llamando window.initTooltips()...');
      window.initTooltips();
      console.log('✅ [INIT] Sistema de tooltips inicializado');
    } else {
      console.warn('⚠️ [INIT] initTooltips no está disponible - tooltipSystem.js no se cargó correctamente');
    }
    
    // NUEVO FASE 8: Inicializar componentes UI del design system
    console.log('🔧 [INIT] Llamando initUIComponents()...');
    initUIComponents();
    console.log('✅ [INIT] initUIComponents() completado');
    
    // NUEVO v6.0.1: Ejecutar diagnóstico de iconos SVG
    console.log('🔧 [INIT] Llamando diagnoseSVGIcons()...');
    diagnoseSVGIcons();
    console.log('✅ [INIT] diagnoseSVGIcons() completado');
    
    console.log('🎉 [INIT] Setup completo del popup finalizado exitosamente');
  } catch (error) {
    console.error('❌ [INIT] Error crítico durante la inicialización del popup:', error);
    console.error('❌ [INIT] Stack trace:', error.stack);
    
    // Mostrar error visual al usuario
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="critical-error" style="padding: 20px; text-align: center;">
          <h2 style="color: #ef4444;">⚠️ Error al cargar la extensión</h2>
          <p>La extensión no pudo inicializarse correctamente.</p>
          <details style="margin-top: 10px; text-align: left;">
            <summary>Detalles técnicos</summary>
            <pre style="background: #1e293b; padding: 10px; border-radius: 4px; overflow: auto;">${error.message}\n${error.stack}</pre>
          </details>
          <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🔄 Reintentar
          </button>
        </div>
      `;
    }
  }
});

/**
 * NUEVO FASE 8: Inicializar componentes UI del design system
 * CORREGIDO v6.0.1: Agregado manejo robusto de errores y logging extensivo
 */
function initUIComponents() {
  console.log('🎨 [INIT UI] Inicializando componentes UI del design system...');
  
  try {
    // Verificar que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      console.warn('⚠️ [INIT UI] DOM aún no está completamente cargado, reintentando...');
      document.addEventListener('DOMContentLoaded', initUIComponents, { once: true });
      return;
    }
    
    // Verificar elementos críticos del DOM
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      console.error('❌ [INIT UI] Elemento crítico #main-content no encontrado');
      return;
    }
    console.log('✅ [INIT UI] Elemento #main-content encontrado');
    
    // Inicializar ArbitragePanel si está disponible
    if (typeof window.ArbitragePanel !== 'undefined') {
      try {
        const panels = document.querySelectorAll('.arbitrage-panel');
        console.log(`🔍 [INIT UI] Encontrados ${panels.length} elementos .arbitrage-panel`);
        panels.forEach((panel, index) => {
          new window.ArbitragePanel(panel);
          console.log(`✅ [INIT UI] ArbitragePanel inicializado para panel ${index + 1}`);
        });
      } catch (error) {
        console.error('❌ [INIT UI] Error inicializando ArbitragePanel:', error);
      }
    } else {
      console.warn('⚠️ [INIT UI] window.ArbitragePanel no está disponible - ui-components/arbitrage-panel.js no se cargó correctamente');
    }
    
    // Inicializar TabSystem si está disponible
    if (typeof window.TabSystem !== 'undefined') {
      try {
        const tabContainers = document.querySelectorAll('.tabs-nav');
        console.log(`🔍 [INIT UI] Encontrados ${tabContainers.length} elementos .tabs-nav`);
        tabContainers.forEach((container, index) => {
          new window.TabSystem(container);
          console.log(`✅ [INIT UI] TabSystem inicializado para contenedor ${index + 1}`);
        });
      } catch (error) {
        console.error('❌ [INIT UI] Error inicializando TabSystem:', error);
      }
    } else {
      console.warn('⚠️ [INIT UI] window.TabSystem no está disponible - ui-components/tabs.js no se cargó correctamente');
    }
    
    // Inicializar AnimationUtils si está disponible
    if (typeof window.AnimationUtils !== 'undefined') {
      try {
        // Aplicar animaciones de entrada a elementos con clase .animate-on-load
        const animatedElements = document.querySelectorAll('.animate-on-load');
        console.log(`🔍 [INIT UI] Encontrados ${animatedElements.length} elementos .animate-on-load`);
        const container = document.querySelector('.stagger-container') || document.body;
        window.AnimationUtils.stagger(container, 'fadeInUp', 100);
        console.log('✅ [INIT UI] AnimationUtils inicializado');
      } catch (error) {
        console.error('❌ [INIT UI] Error inicializando AnimationUtils:', error);
      }
    } else {
      console.warn('⚠️ [INIT UI] window.AnimationUtils no está disponible - ui-components/animations.js no se cargó correctamente');
    }
    
    console.log('✅ [INIT UI] Componentes UI del design system inicializados correctamente');
  } catch (error) {
    console.error('❌ [INIT UI] Error crítico en inicialización de componentes UI:', error);
    console.error('❌ [INIT UI] Stack trace:', error.stack);
  }
}

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

// REEMPLAZO v6.0.0: Configurar botones de filtro usando FilterManager
// Esta función ahora delega a FilterManager.setupFilterButtons()
function setupFilterButtons() {
  // Delegar a FilterManager
  return FltMgr.setupFilterButtons();
}

// REEMPLAZO v6.0.0: Verificar si una ruta usa P2P
// Esta función ahora delega a RouteManager.isP2PRoute()
function isP2PRoute(route) {
  return RteMgr.isP2PRoute(route);
}

// REEMPLAZO v6.0.0: Aplicar filtro P2P según selección del usuario
// Esta función ahora delega a FilterManager
function applyP2PFilter() {
  // Actualizar rutas en FilterManager
  if (allRoutes && allRoutes.length > 0) {
    FltMgr.updateRoutes(allRoutes);
  }
  
  // Aplicar todos los filtros
  const filteredRoutes = FltMgr.applyAllFilters();
  
  // Actualizar contadores
  FltMgr.updateFilterCounts();
  
  // Mostrar rutas filtradas usando RouteManager
  if (filteredRoutes && filteredRoutes.length > 0 && currentData) {
    RteMgr.displayRoutes(filteredRoutes, 'optimized-routes');
  } else if (filteredRoutes && filteredRoutes.length === 0) {
    RteMgr.showEmptyState('optimized-routes', 'No se encontraron rutas que cumplan con tus criterios de filtrado.');
  }
}

// REEMPLAZO v6.0.0: Actualizar contadores de rutas en filtros
// Esta función ahora delega a FilterManager.updateFilterCounts()
function updateFilterCounts() {
  return FltMgr.updateFilterCounts();
}

// ============================================
// FILTROS AVANZADOS v6.0.0 - REFACTORIZADO
// ============================================

/**
 * REEMPLAZO v6.0.0: Configurar filtros avanzados
 * Esta función ahora delega a FilterManager.setupAdvancedFilters()
 */
function setupAdvancedFilters() {
  return FltMgr.setupAdvancedFilters();
}

/**
 * REEMPLAZO v6.0.0: Poblar select de exchanges con opciones únicas
 * Esta función ahora delega a FilterManager.populateExchangeFilter()
 */
function populateExchangeFilter() {
  return FltMgr.populateExchangeFilter();
}

/**
 * REEMPLAZO v6.0.0: Aplicar todos los filtros (P2P + Avanzados)
 * Esta función ahora delega a FilterManager.applyAllFilters()
 */
function applyAllFilters() {
  // Actualizar rutas en FilterManager
  if (allRoutes && allRoutes.length > 0) {
    FltMgr.updateRoutes(allRoutes);
  }
  
  // Aplicar todos los filtros
  const filteredRoutes = FltMgr.applyAllFilters();
  
  // Mostrar rutas filtradas usando RouteManager
  if (currentData) {
    RteMgr.displayRoutes(filteredRoutes, 'optimized-routes');
  }
  
  return filteredRoutes;
}

/**
 * REEMPLAZO v6.0.0: Ordenar rutas según criterio
 * Esta función ahora delega a FilterManager.sortRoutes()
 */
function sortRoutes(routes, sortBy) {
  return FltMgr.sortRoutes(routes, sortBy);
}

/**
 * REEMPLAZO v6.0.0: Resetear filtros avanzados a valores por defecto
 * Esta función ahora delega a FilterManager.resetAdvancedFilters()
 */
function resetAdvancedFilters() {
  return FltMgr.resetAdvancedFilters();
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
            <span class="price-value source-value">${Fmt.getDollarSourceDisplay(official)}</span>
          </div>
          `
              : ''
          }
          <div class="price-row">
            <span class="price-label">💱 USD → USDT</span>
            <span class="price-value">${Fmt.formatUsdUsdtRatio(arb.usdToUsdtRate)} USD/USDT</span>
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

    // Escapar completamente el JSON usando encodeURIComponent para prevenir errores y vulnerabilidades
    const escapedRouteData = encodeURIComponent(routeData);

    html += `
      <div class="route-card ${profitClass} ${routeType} ${compactClass}" data-index="${index}" data-route="${escapedRouteData}">
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
            <div class="profit-badge ${profitBadgeClass} text-underline-animated glow-pulse">${profitSymbol}${Fmt.formatNumber(displayMetrics.percentage)}%</div>
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

  // NUEVO v6.0.0: Aplicar animaciones de entrada a las tarjetas de rutas
  const routeCards = container.querySelectorAll('.route-card');
  routeCards.forEach((card, index) => {
    // Agregar clases de animación y micro-interacciones Fase 5
    card.classList.add('stagger-in', 'hover-lift', 'click-shrink', 'magnetic-btn', 'ripple-btn', 'hover-scale-rotate');
    // Aplicar delay escalonado para efecto stagger
    card.style.animationDelay = `${index * 50}ms`;
  });

  // CORREGIDO v5.0.64: Seleccionar route-cards del container correcto

  console.log(`🔍 [POPUP] Agregando event listeners a ${routeCards.length} route-cards`);

  // NUEVO Fase 5: Inicializar micro-interacciones para las nuevas tarjetas
  if (typeof initMagneticButtons === 'function') {
    initMagneticButtons();
  }

  routeCards.forEach((card, idx) => {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // CORREGIDO v5.0.72: Usar data-route en lugar de índice para obtener la ruta exacta
      // CORREGIDO v6.0.1: Decodificar datos usando decodeURIComponent (Issue #1 - Alta severidad)
      const routeData = this.dataset.route;
      if (!routeData) {
        console.error('❌ [POPUP] No se encontró data-route en la tarjeta');
        return;
      }

      try {
        const route = JSON.parse(decodeURIComponent(routeData));
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

// REEMPLAZO v6.0.0: Función para crear elementos HTML de manera segura delegada a CommonUtils
function createSafeElement(tag, content, className = '') {
  return Utils.createSafeElement(tag, content, className);
}

// REEMPLAZO v6.0.0: Función para sanitizar HTML (previene XSS) delegada a CommonUtils
function sanitizeHTML(text) {
  return Utils.sanitizeHTML(text);
}

// REEMPLAZO v6.0.0: Función para actualizar innerHTML de manera segura delegada a CommonUtils
function setSafeHTML(element, html) {
  return Utils.setSafeHTML(element, html);
}

// Exportar funciones de seguridad para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createSafeElement,
    sanitizeHTML,
    setSafeHTML
  };
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
            <span class="calc-value">${Fmt.formatUsdUsdtRatio(usdToUsdtRate)} USD = 1 USDT</span>
            <span class="calc-arrow">→</span>
            <span class="calc-result">${Fmt.formatNumber(usdtAfterFees)} USDT</span>
          </div>
          ${
            typeof usdToUsdtRate === 'number' && isFinite(usdToUsdtRate) && usdToUsdtRate > 1.005
              ? `
          <div class="step-simple-warning">
            ⚠️ El exchange cobra ${Fmt.formatCommissionPercent((usdToUsdtRate - 1) * 100)}% para esta conversión
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

// Nota: Las funciones generateCalculatorHTML y generateConsiderationsHTML fueron eliminadas
// en v5.0.0 al simplificar la guía paso a paso. Su funcionalidad fue reemplazada por
// generateGuideSteps() que ahora incluye toda la información necesaria de forma más compacta.

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

// Nota: La función loadBanksDataOld() fue eliminada en v5.0.69
// El botón refresh-banks fue removido y la funcionalidad se integró en loadBanksData()

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

  // NUEVO v6.0.0: Aplicar animaciones a las tarjetas de exchanges
  const exchangeCards = container.querySelectorAll('.exchange-card');
  exchangeCards.forEach((card, index) => {
    card.classList.add('stagger-in', 'hover-lift', 'magnetic-btn', 'ripple-btn', 'hover-scale-rotate');
    card.style.animationDelay = `${index * 30}ms`;
  });

  // Configurar event listeners para filtros
  setupExchangeFilters(exchanges);

  // NUEVO Fase 5: Inicializar micro-interacciones para las nuevas tarjetas de exchanges
  if (typeof initMagneticButtons === 'function') {
    initMagneticButtons();
  }
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

// REEMPLAZO v6.0.0: Configuración del simulador delegada a Simulator
function setupAdvancedSimulator() {
  // Delegar configuración completa al módulo Simulator
  return Sim.init(currentData, userSettings);
}

// REEMPLAZO v6.0.0: Configurar botones de presets delegada a Simulator
function setupSimulatorPresets() {
  return Sim.setupPresets();
}

// REEMPLAZO v6.0.0: Aplicar preset al simulador delegada a Simulator
function applySimulatorPreset(presetName) {
  return Sim.applyPreset(presetName);
}

// REEMPLAZO v6.0.0: Mostrar tooltip temporal del preset delegada a Simulator
function showPresetTooltip(name, description) {
  return Sim.showPresetTooltip(name, description);
}

// REEMPLAZO v6.0.0: Cargar valores por defecto del simulador delegada a Simulator
function loadDefaultSimulatorValues() {
  return Sim.loadDefaultValues();
}

// REEMPLAZO v6.0.0: Resetear configuración del simulador delegada a Simulator
function resetSimulatorConfig() {
  return Sim.resetConfig();
}

// REEMPLAZO v6.0.0: Generar Matriz de Riesgo delegada a Simulator
async function generateRiskMatrix(useCustomParams = false) {
  return Sim.generateRiskMatrix(useCustomParams);
}

// REEMPLAZO v6.0.0: Aplicar filtro de matriz delegada a Simulator
function applyMatrixFilter() {
  return Sim.applyMatrixFilter();
}

// REEMPLAZO v6.0.0: Resetear filtro de matriz delegada a Simulator
function resetMatrixFilter() {
  return Sim.resetMatrixFilter();
}

// NUEVO: Configurar controles del precio del dólar
function setupDollarPriceControls() {
  const configureBtn = document.getElementById('configure-dollar');

  if (configureBtn) {
    configureBtn.addEventListener('click', openDollarConfiguration);
  }
}

// REEMPLAZO v6.0.0: Configurar modal de detalles de ruta delegada a ModalManager
function setupRouteDetailsModal() {
  return ModMgr.setupRouteDetailsModal();
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
  dollarSource.textContent = `Fuente: ${Fmt.getDollarSourceDisplay(officialData)}`;

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

// REEMPLAZO v6.0.0: Verificar actualizaciones al cargar el popup delegada a NotificationManager
async function checkForUpdatesOnPopupLoad() {
  return NotifMgr.checkForUpdates();
}

// REEMPLAZO v6.0.0: Mostrar banner de actualización delegada a NotificationManager
function showUpdateBanner(updateInfo) {
  return NotifMgr.showUpdateBanner(updateInfo);
}

// REEMPLAZO v6.0.0: Configurar botones del banner de actualización delegada a NotificationManager
async function setupUpdateBannerButtons(updateInfo) {
  return NotifMgr.setupUpdateBannerButtons(updateInfo);
}

// REEMPLAZO v6.0.0: Ocultar banner de actualización delegada a NotificationManager
function hideUpdateBanner() {
  return NotifMgr.hideUpdateBanner();
}

// ==========================================
// FUNCIONES DE MODAL Y UI
// ==========================================

// REEMPLAZO v6.0.0: Abrir modal con detalles de la ruta delegada a ModalManager
function openRouteDetailsModal(arbitrage) {
  return ModMgr.openRouteDetailsModal(arbitrage);
}

// REEMPLAZO v6.0.0: Cerrar modal de detalles de ruta delegada a ModalManager
function closeRouteDetailsModal() {
  return ModMgr.closeModal();
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

// REEMPLAZO v6.0.0: Función auxiliar para mostrar notificaciones toast delegada a NotificationManager
function showToast(message, type = 'info') {
  return NotifMgr.showToast(message, type);
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

  sortedBanks.forEach(([bankName, bankData], index) => {
    const buyPrice = bankData.compra || bankData.bid || bankData.price || 0;
    const sellPrice = bankData.venta || bankData.ask || bankData.price || 0;

    html += `
      <div class="bank-row stagger-in hover-lift" style="animation-delay: ${index * 30}ms">
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

  sortedExchanges.forEach(([exchangeName, exchangeData], index) => {
    const bidPrice = exchangeData.bid || exchangeData.price || 0;
    const askPrice = exchangeData.ask || exchangeData.price || 0;

    html += `
      <div class="bank-row stagger-in hover-lift" style="animation-delay: ${index * 30}ms">
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

  sortedExchanges.forEach(([exchangeName, exchangeData], index) => {
    const bidPrice = exchangeData.bid || exchangeData.price || 0;
    const askPrice = exchangeData.ask || exchangeData.price || 0;

    html += `
      <div class="bank-row stagger-in hover-lift" style="animation-delay: ${index * 30}ms">
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

  // NUEVO Fase 5: Inicializar micro-interacciones para las nuevas tarjetas crypto
  if (typeof initMagneticButtons === 'function') {
    initMagneticButtons();
  }

  console.log(`✅ Renderizadas ${routes.length} crypto routes`);
}

/**
 * Crear card HTML para una ruta de crypto arbitrage
 */
function createCryptoRouteCard(route, index) {
  const card = document.createElement('div');
  card.className = 'crypto-route-card';

  // NUEVO v6.0.0: Agregar clases de animación y micro-interacciones Fase 5
  card.classList.add('stagger-in', 'hover-lift', 'click-shrink', 'magnetic-btn', 'ripple-btn', 'hover-scale-rotate');
  card.style.animationDelay = `${index * 50}ms`;

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
      <div class="profit-badge ${route.profitPercent >= 0 ? 'profit-positive' : 'profit-negative'} text-underline-animated glow-pulse">
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

// ==========================================
// FASE 5: MICRO-INTERACCIONES AVANZADAS
// ==========================================

/**
 * Efecto Ripple en botones
 * Crea un efecto de onda expansiva al hacer click
 */
function createRipple(event, element) {
  const circle = document.createElement('span');
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;

  const rect = element.getBoundingClientRect();
  
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  // Remover ripple existente si hay uno
  const existingRipple = element.querySelector('.ripple');
  if (existingRipple) {
    existingRipple.remove();
  }

  element.appendChild(circle);

  // Remover el ripple después de la animación
  setTimeout(() => {
    circle.remove();
  }, 600);
}

/**
 * Inicializar botones magnéticos
 * Los botones siguen ligeramente el cursor
 * OPTIMIZADO: Usa requestAnimationFrame y passive event listeners
 */
function initMagneticButtons() {
  // Verificar si es dispositivo táctil
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    // En dispositivos táctiles, no aplicar efecto magnético
    return;
  }

  const magneticButtons = document.querySelectorAll('.magnetic-btn');
  
  // Mapa para almacenar RAF IDs por botón (para cancelar si es necesario)
  const rafIds = new WeakMap();
  
  magneticButtons.forEach(button => {
    // Variables para almacenar la última posición calculada
    let lastX = 0;
    let lastY = 0;
    let animationFrameId = null;
    
    // OPTIMIZACIÓN: Usar passive event listener para mejor rendimiento
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Guardar valores para el próximo frame
      lastX = x;
      lastY = y;
      
      // OPTIMIZACIÓN: Usar requestAnimationFrame para debouncing
      // Cancelar el RAF anterior si existe
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Programar la actualización para el próximo frame de animación
      animationFrameId = requestAnimationFrame(() => {
        // Movimiento sutil (máximo 10px)
        const moveX = lastX * 0.2;
        const moveY = lastY * 0.2;
        
        // Aplicar transformación usando willChange para optimización
        button.style.willChange = 'transform';
        button.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Limpiar RAF ID
        animationFrameId = null;
      });
    }, { passive: true }); // OPTIMIZACIÓN: Event listener pasivo
    
    button.addEventListener('mouseleave', () => {
      // Cancelar cualquier RAF pendiente
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      // Resetear transformación
      button.style.transform = 'translate(0, 0)';
      
      // Limpiar willChange después de la transición
      setTimeout(() => {
        button.style.willChange = '';
      }, 300);
    }, { passive: true }); // OPTIMIZACIÓN: Event listener pasivo
    
    // Limpieza: Cancelar RAF si el elemento se remueve del DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'removedNodes') {
          if (animationFrameId && !document.contains(button)) {
            cancelAnimationFrame(animationFrameId);
          }
        }
      });
    });
    
    observer.observe(button.parentNode, { childList: true, subtree: true });
  });
}

/**
 * Animar contador numérico
 * Anima un valor de 0 al valor final
 */
function animateCounter(element, endValue, duration = 1000, decimals = 0) {
  if (!element) return;
  
  const startValue = 0;
  const startTime = performance.now();
  
  // Verificar prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    element.textContent = endValue.toFixed(decimals);
    return;
  }
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function para suavidad
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = startValue + (endValue - startValue) * easeOutQuart;
    
    element.textContent = currentValue.toFixed(decimals);
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  requestAnimationFrame(updateCounter);
}

/**
 * Establecer progreso en un anillo circular
 * @param {string} elementId - ID del elemento SVG del anillo
 * @param {number} percentage - Porcentaje de progreso (0-100)
 */
function setProgressRing(elementId, percentage) {
  const circle = document.getElementById(elementId);
  if (!circle) return;
  
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clampedPercentage / 100) * circumference;
  
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = offset;
  
  // Agregar clase para animación
  circle.classList.add('progress-ring-animated');
}

/**
 * Scroll suave hacia un elemento
 * @param {string|HTMLElement} target - Selector CSS o elemento DOM
 * @param {number} offset - Offset adicional desde el top
 */
function smoothScrollTo(target, offset = 0) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;
  
  // Verificar prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  
  if (prefersReducedMotion) {
    // Scroll instantáneo si el usuario prefiere reducción de movimiento
    window.scrollTo(0, targetPosition);
  } else {
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
}

/**
 * Inicializar todas las micro-interacciones de la Fase 5
 */
function initMicroInteractions() {
  console.log('🎬 Inicializando micro-interacciones avanzadas...');
  
  // Inicializar botones magnéticos
  initMagneticButtons();
  
  // Agregar efecto ripple a botones con clase ripple-btn
  const rippleButtons = document.querySelectorAll('.ripple-btn');
  rippleButtons.forEach(button => {
    button.addEventListener('click', (e) => createRipple(e, button));
  });
  
  // Inicializar contadores con clase counter-animate
  const counters = document.querySelectorAll('.counter-animate');
  counters.forEach(counter => {
    const targetValue = parseFloat(counter.dataset.target) || 0;
    const decimals = parseInt(counter.dataset.decimals) || 0;
    const duration = parseInt(counter.dataset.duration) || 1000;
    
    // Usar IntersectionObserver para animar solo cuando sea visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target, targetValue, duration, decimals);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(counter);
  });
  
  console.log('✅ Micro-interacciones avanzadas inicializadas');
}

/**
 * DIAGNÓSTICO v6.0.1: Verificar que el sprite sheet SVG esté cargado correctamente
 * PROBLEMA 3: Imágenes/iconos faltantes - Síntoma: Sprites SVG no referenciados correctamente
 */
function diagnoseSVGIcons() {
  console.log('🔍 [SVG DIAGNOSIS] Iniciando diagnóstico de iconos SVG...');
  
  try {
    // 1. Verificar que el SVG sprite sheet existe en el DOM
    const svgSprite = document.querySelector('svg[style*="display: none"]');
    console.log(`🔍 [SVG DIAGNOSIS] Sprite sheet SVG encontrado: ${!!svgSprite}`);
    
    if (!svgSprite) {
      console.error('❌ [SVG DIAGNOSIS] No se encontró el sprite sheet SVG en el DOM');
      return;
    }
    
    // 2. Contar y listar todos los symbol IDs definidos
    const symbols = svgSprite.querySelectorAll('symbol');
    console.log(`🔍 [SVG DIAGNOSIS] Símbolos SVG definidos: ${symbols.length}`);
    
    const symbolIds = [];
    symbols.forEach(symbol => {
      const id = symbol.id;
      if (id) {
        symbolIds.push(id);
      }
    });
    
    console.log('📋 [SVG DIAGNOSIS] IDs de símbolos definidos:', symbolIds);
    
    // 3. Verificar que iconos críticos están definidos
    const criticalIcons = [
      'icon-refresh',
      'icon-settings',
      'icon-close',
      'icon-crypto',
      'icon-p2p',
      'icon-simulator',
      'icon-exchange',
      'icon-guide',
      'icon-info',
      'icon-warning',
      'icon-error',
      'icon-question',
      'icon-bolt',
      'icon-target',
      'icon-reset',
      'icon-dollar',
      'icon-coins',
      'icon-percent',
      'icon-clock',
      'icon-chart',
      'icon-trend',
      'icon-usdt',
      'icon-btc',
      'icon-eth',
      'icon-usdc',
      'icon-dai',
      'icon-arrow-right',
      'icon-arrow-left',
      'icon-arrow-up',
      'icon-arrow-down'
    ];
    
    console.log('🔍 [SVG DIAGNOSIS] Verificando iconos críticos...');
    const missingIcons = [];
    criticalIcons.forEach(iconId => {
      const exists = symbolIds.includes(iconId);
      if (!exists) {
        missingIcons.push(iconId);
        console.warn(`⚠️ [SVG DIAGNOSIS] Icono crítico faltante: ${iconId}`);
      } else {
        console.log(`✅ [SVG DIAGNOSIS] Icono encontrado: ${iconId}`);
      }
    });
    
    if (missingIcons.length > 0) {
      console.error(`❌ [SVG DIAGNOSIS] Faltan ${missingIcons.length} iconos críticos:`, missingIcons);
    } else {
      console.log('✅ [SVG DIAGNOSIS] Todos los iconos críticos están definidos');
    }
    
    // 4. Verificar referencias de iconos en botones de filtro
    console.log('🔍 [SVG DIAGNOSIS] Verificando referencias en botones de filtro...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    console.log(`🔍 [SVG DIAGNOSIS] Botones de filtro encontrados: ${filterButtons.length}`);
    
    filterButtons.forEach((btn, index) => {
      const svgIcon = btn.querySelector('svg use');
      if (svgIcon) {
        const href = svgIcon.getAttribute('href') || svgIcon.getAttribute('xlink:href');
        console.log(`🔍 [SVG DIAGNOSIS] Botón ${index + 1}: referencia SVG = "${href}"`);
        
        if (href) {
          // Extraer el ID del icono (formato: #icon-name o /path/to/sprite.svg#icon-name)
          const iconId = href.includes('#') ? href.split('#').pop() : href.replace('#', '');
          const exists = symbolIds.includes(iconId);
          
          if (!exists) {
            console.error(`❌ [SVG DIAGNOSIS] Botón ${index + 1} referencia icono inexistente: ${iconId}`);
          } else {
            console.log(`✅ [SVG DIAGNOSIS] Botón ${index + 1} referencia válida: ${iconId}`);
          }
        } else {
          console.warn(`⚠️ [SVG DIAGNOSIS] Botón ${index + 1} no tiene referencia SVG`);
        }
      } else {
        console.warn(`⚠️ [SVG DIAGNOSIS] Botón ${index + 1} no tiene elemento SVG use`);
      }
    });
    
    // 5. Verificar referencias en botones de header
    console.log('🔍 [SVG DIAGNOSIS] Verificando referencias en botones de header...');
    const headerButtons = document.querySelectorAll('.btn-settings, .btn-refresh');
    console.log(`🔍 [SVG DIAGNOSIS] Botones de header encontrados: ${headerButtons.length}`);
    
    headerButtons.forEach((btn, index) => {
      const svgIcon = btn.querySelector('svg use');
      if (svgIcon) {
        const href = svgIcon.getAttribute('href') || svgIcon.getAttribute('xlink:href');
        console.log(`🔍 [SVG DIAGNOSIS] Botón header ${index + 1}: referencia SVG = "${href}"`);
        
        if (href) {
          const iconId = href.includes('#') ? href.split('#').pop() : href.replace('#', '');
          const exists = symbolIds.includes(iconId);
          
          if (!exists) {
            console.error(`❌ [SVG DIAGNOSIS] Botón header ${index + 1} referencia icono inexistente: ${iconId}`);
          } else {
            console.log(`✅ [SVG DIAGNOSIS] Botón header ${index + 1} referencia válida: ${iconId}`);
          }
        }
      }
    });
    
    console.log('✅ [SVG DIAGNOSIS] Diagnóstico de iconos SVG completado');
  } catch (error) {
    console.error('❌ [SVG DIAGNOSIS] Error durante el diagnóstico:', error);
    console.error('❌ [SVG DIAGNOSIS] Stack trace:', error.stack);
  }
}

// Inicializar micro-interacciones cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMicroInteractions);
} else {
  initMicroInteractions();
}
