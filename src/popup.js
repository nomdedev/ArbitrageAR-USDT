// Estado global
let currentData = null;
let selectedArbitrage = null;
let userSettings = null; // NUEVO v5.0: Configuración del usuario
let currentFilter = 'no-p2p'; // CORREGIDO v5.0.12: Volver a 'no-p2p' pero con debug forzado
let allRoutes = []; // NUEVO: Cache de todas las rutas sin filtrar

// Modo debug para reducir logs excesivos
const DEBUG_MODE = true;

console.log('🚀 Popup.js cargado correctamente');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  log('📄 DOM Content Loaded - Iniciando setup...');
  setupTabNavigation();
  setupRefreshButton();
  setupFilterButtons(); // NUEVO: Configurar filtros P2P
  setupDollarPriceControls(); // NUEVO: Configurar controles del precio del dólar
  setupAdvancedSimulator(); // NUEVO v5.0.31: Configurar simulador sin rutas
  checkForUpdates(); // NUEVO: Verificar actualizaciones disponibles
  loadUserSettings(); // NUEVO v5.0.28: Cargar configuración del usuario
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

// NUEVO: Formateo específico para ratios USD/USDT con 3 decimales
function formatUsdUsdtRatio(num) {
  if (num === undefined || num === null || isNaN(num)) {
    console.warn('formatUsdUsdtRatio recibió valor inválido:', num);
    return '1.000';
  }
  return num.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
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
// FUNCIONES DE VALIDACIÓN Y SEGURIDAD v5.0.28
// ============================================

/**
 * Cargar configuración del usuario
 */
function loadUserSettings() {
  chrome.storage.local.get([
    'dataFreshnessWarning',
    'riskAlertsEnabled',
    'requireConfirmHighAmount',
    'minProfitWarning'
  ], (result) => {
    userSettings = {
      dataFreshnessWarning: result.dataFreshnessWarning !== false, // default true
      riskAlertsEnabled: result.riskAlertsEnabled !== false, // default true
      requireConfirmHighAmount: result.requireConfirmHighAmount !== false, // default true
      minProfitWarning: result.minProfitWarning || 0.5
    };
    console.log('⚙️ Configuración de seguridad cargada:', userSettings);
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
  const freshness = window.validationService.getDataFreshnessLevel(data.officialPrice?.timestamp);
  
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
    route.profitPercent,
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
function applyP2PFilter() {
  if (DEBUG_MODE) console.log('🔍 applyP2PFilter() llamado con filtro:', currentFilter);
  if (DEBUG_MODE) console.log('🔍 allRoutes:', allRoutes?.length);

  if (!allRoutes || allRoutes.length === 0) {
    console.warn('⚠️ No hay rutas disponibles para filtrar');
    return;
  }

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
    displayOptimizedRoutes(filteredRoutes, currentData.official);
  } else {
    console.warn('⚠️ currentData es null, no se puede mostrar rutas');
  }

  // Actualizar contadores en los botones
  updateFilterCounts();
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
            <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
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
              <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
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
            <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
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
            <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
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
            <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
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
          <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
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
  
  // 1. Filtrar rutas negativas si el usuario no quiere verlas (default: mostrar)
  filtered = applyNegativeFilter(filtered, userSettings?.showNegativeRoutes);
  
  // 2. Filtrar por exchanges preferidos del usuario
  filtered = applyPreferredExchangesFilter(filtered, userSettings?.preferredExchanges);
  
  // 3. Ordenar priorizando rutas single-exchange si el usuario lo prefiere
  filtered = applySorting(filtered, userSettings.preferSingleExchange);
  
  // 3. Limitar cantidad de rutas mostradas
  const maxDisplay = userSettings.maxRoutesDisplay || 20;
  filtered = applyLimit(filtered, maxDisplay);
  
  if (DEBUG_MODE) console.log('🔍 [POPUP] applyUserPreferences retornando', filtered.length, 'rutas');
  return filtered;
}

// Funciones helper para reducir complejidad de applyUserPreferences
function applyNegativeFilter(routes, showNegative) {
  if (showNegative === false) {
    const beforeCount = routes.length;
    const filtered = routes.filter(r => r.profitPercent >= 0);
    if (DEBUG_MODE) console.log(`🔧 [POPUP] Filtradas ${beforeCount - filtered.length} rutas negativas, quedan ${filtered.length}`);
    return filtered;
  }
  if (DEBUG_MODE) console.log('🔍 [POPUP] No se filtran rutas negativas');
  return routes;
}

function applyPreferredExchangesFilter(routes, preferredExchanges) {
  if (!preferredExchanges || !Array.isArray(preferredExchanges) || preferredExchanges.length === 0) {
    if (DEBUG_MODE) console.log('🔍 [POPUP] No hay exchanges preferidos configurados');
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

function applySorting(routes, preferSingleExchange) {
  if (preferSingleExchange === true) {
    routes.sort((a, b) => {
      if (a.isSingleExchange !== b.isSingleExchange) {
        return b.isSingleExchange - a.isSingleExchange;
      }
      return b.profitPercent - a.profitPercent;
    });
    if (DEBUG_MODE) console.log('🔧 [POPUP] Rutas ordenadas priorizando mismo broker');
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
    const { isNegative, profitClass, profitBadgeClass } = getProfitClasses(arb.profitPercent);
    
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
  console.log('🔍 [POPUP] displayOptimizedRoutes() llamado con', routes?.length, 'rutas');
  const container = document.getElementById('optimized-routes');
  console.log('🔍 [POPUP] container encontrado:', !!container);
  
  if (!routes || routes.length === 0) {
    console.log('🔍 [POPUP] No hay rutas para mostrar, mostrando mensaje vacío');
    container.innerHTML = '<p class="info">📊 No hay rutas disponibles en este momento.</p>';
    return;
  }

  console.log('🔍 [POPUP] Generando HTML para', routes.length, 'rutas');
  let html = '';
  
  routes.forEach((route, index) => {
    const { isNegative, profitClass, profitBadgeClass } = getProfitClasses(route.profitPercent);
    
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
  
  console.log('✅ [POPUP] displayOptimizedRoutes() completado - HTML generado y aplicado');
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
  const { estimatedInvestment, officialPrice, usdAmount, usdToUsdtRate, usdtAfterFees, usdtArsBid, arsFromSale, finalAmount, profit, profitPercent, broker } = values;

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
          ${usdToUsdtRate > 1.005 ? `
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

// NUEVO: Cargar datos de bancos desde dolarito.ar
async function loadBankRates() {
  const refreshBtn = document.getElementById('refresh-banks');
  const timestampEl = document.getElementById('banks-last-update');
  
  try {
    // Deshabilitar botón durante la carga
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '⏳ Cargando...';
    }
    
    // Solicitar datos al background con configuración de usuario
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        action: 'getBankRates',
        userSettings: {
          selectedBanks: userSettings?.selectedBanks || []
        }
      }, resolve);
    });
    
    if (response && response.bankRates) {
      // NUEVO v5.0.37: Guardar datos de bancos en currentData para usar en matriz
      if (!currentData) currentData = {};
      currentData.banks = response.bankRates;
      
      displayBanks(response.bankRates);
    } else {
      throw new Error('No se pudieron obtener datos de bancos');
    }
    
  } catch (error) {
    console.error('Error cargando datos de bancos:', error);
    const container = document.getElementById('banks-list');
    container.innerHTML = `
      <div class="select-prompt">
        <p>❌ Error al cargar datos de bancos</p>
        <p style="margin-top: 8px; font-size: 0.85em;">Intenta nuevamente en unos momentos</p>
      </div>
    `;
  } finally {
    // Re-habilitar botón
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
    container.textContent = '⏰ Sin datos de actualización';
    return;
  }
  
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('es-AR');
  
  // NUEVO v5.0.28: Agregar indicador de frescura
  if (window.validationService) {
    const freshness = window.validationService.getDataFreshnessLevel(timestamp);
    container.innerHTML = `
      <span style="color: ${freshness.color}">${freshness.icon}</span>
      <span>Última actualización: ${timeStr}</span>
      ${freshness.ageMinutes !== null ? `<span class="age-info">(hace ${freshness.ageMinutes} min)</span>` : ''}
    `;
  } else {
    container.textContent = `⏰ Última actualización: ${timeStr}`;
  }
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
    .filter(([key, el]) => !el)
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
async function generateRiskMatrix() {
  const amountInput = document.getElementById('sim-amount');
  const amount = parseFloat(amountInput?.value) || 1000000;

  // Validar monto
  if (!amount || amount < 1000) {
    alert('⚠️ Ingresa un monto válido (mínimo $1,000 ARS)');
    return;
  }

  // NUEVO v5.0.36: Obtener datos dinámicos de bancos y exchanges
  // En lugar de usar inputs fijos, usar datos reales de bancos principales y exchanges USDT

  // Obtener datos de bancos principales (compra de dólar)
  let usdPrices = [];
  let usdtPrices = [];

  // Intentar obtener datos de bancos del consenso actual
  if (!currentData || !currentData.banks || Object.keys(currentData.banks).length === 0) {
    // Si no hay datos de bancos, intentar cargarlos
    console.log('💵 [MATRIZ] No hay datos de bancos, cargando...');
    try {
      await loadBankRates();
      // Pequeña pausa para asegurar que los datos se guarden
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.warn('💵 [MATRIZ] Error cargando bancos para matriz:', error);
    }
  }

  if (currentData && currentData.banks) {
    // Usar precios de compra de bancos principales (corregidos después del fix)
    const bankCompraPrices = Object.values(currentData.banks)
      .filter(bank => bank.compra && bank.compra > 0)
      .map(bank => bank.compra)
      .sort((a, b) => a - b);

    if (bankCompraPrices.length >= 1) {
      // NUEVO v5.0.39: Lógica específica del usuario
      // USD mínimo = menor precio de compra de bancos principales
      // USD máximo = mínimo + 50%
      const usdMin = Math.min(...bankCompraPrices);
      const usdMax = usdMin * 1.5; // +50% sobre el mínimo

      // Generar 5 puntos equidistantes entre min y max
      usdPrices = [];
      for (let i = 0; i < 5; i++) {
        usdPrices.push(usdMin + (usdMax - usdMin) * i / 4);
      }

      console.log('💵 [MATRIZ] USD - Mínimo de bancos:', usdMin.toFixed(2), 'Máximo (min+50%):', usdMax.toFixed(2));
      console.log('💵 [MATRIZ] Precios USD generados:', usdPrices.map(p => p.toFixed(2)));
    }
  }

  // Si no hay datos de bancos, usar valores por defecto
  if (usdPrices.length === 0) {
    const usdMin = parseFloat(document.getElementById('matrix-usd-min')?.value) || 940;
    const usdMax = parseFloat(document.getElementById('matrix-usd-max')?.value) || 980;
    for (let i = 0; i < 5; i++) {
      usdPrices.push(usdMin + (usdMax - usdMin) * i / 4);
    }
    console.log('💵 [MATRIZ] Usando precios USD por defecto:', usdPrices.map(p => p.toFixed(2)));
  }

  // Obtener datos de exchanges USDT (venta)
  if (currentData && currentData.usdt) {
    // Usar precios de venta de exchanges USDT más grandes
    const usdtSellPrices = Object.values(currentData.usdt)
      .filter(exchange => exchange.venta && exchange.venta > 0)
      .map(exchange => exchange.venta)
      .sort((a, b) => b - a); // Orden descendente para tomar los más altos primero

    if (usdtSellPrices.length >= 5) {
      // NUEVO v5.0.39: Tomar exactamente los 5 precios más altos
      usdtPrices = usdtSellPrices.slice(0, 5);
      console.log('💰 [MATRIZ] Usando los 5 precios USDT venta más altos:', usdtPrices.map(p => p.toFixed(2)));
    } else if (usdtSellPrices.length >= 1) {
      // Si hay menos de 5, usar todos los disponibles
      usdtPrices = usdtSellPrices;
      console.log('💰 [MATRIZ] Usando todos los precios USDT disponibles:', usdtPrices.map(p => p.toFixed(2)));
    }
  }

  // Si no hay datos de exchanges, usar valores por defecto
  if (usdtPrices.length === 0) {
    const usdtMin = parseFloat(document.getElementById('matrix-usdt-min')?.value) || 1000;
    const usdtMax = parseFloat(document.getElementById('matrix-usdt-max')?.value) || 1040;
    for (let i = 0; i < 5; i++) {
      usdtPrices.push(usdtMin + (usdtMax - usdtMin) * i / 4);
    }
    console.log('💰 [MATRIZ] Usando precios USDT por defecto:', usdtPrices.map(p => p.toFixed(2)));
  }

  // Validaciones de rangos
  const usdMin = Math.min(...usdPrices);
  const usdMax = Math.max(...usdPrices);
  const usdtMin = Math.min(...usdtPrices);
  const usdtMax = Math.max(...usdtPrices);

  if (usdMin >= usdMax) {
    alert('⚠️ Error: Los precios USD no son válidos');
    return;
  }
  if (usdtMin >= usdtMax) {
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
  
  console.log('📊 Generando matriz con parámetros:', {
    amount,
    usdPrices: usdPrices.map(p => p.toFixed(2)),
    usdtPrices: usdtPrices.map(p => p.toFixed(2)),
    fees: { buy: buyFeePercent, sell: sellFeePercent, transfer: transferFeeUSD, bank: bankCommissionPercent }
  });

  // Tasa USD a USDT (normalmente 1:1, pero puede variar ligeramente)
  const usdToUsdtRate = 1.0;
  
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
      
      // Paso 2: Comprar USDT con USD
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

// Mostrar diálogo para recalcular con precio personalizado
async function showRecalculateDialog() {
  const customPrice = prompt(
    '💵 Ingresa el precio del dólar para recalcular:\n\n' +
    'Este será usado temporalmente para esta sesión.\n' +
    'Para cambiar permanentemente, usa el botón de configuración.',
    '950'
  );

  if (customPrice && !isNaN(customPrice) && parseFloat(customPrice) > 0) {
    const price = parseFloat(customPrice);
    console.log(`🔄 Recalculando con precio personalizado: $${price}`);
    
    // Enviar precio personalizado al background para recálculo temporal
    chrome.runtime.sendMessage({
      action: 'recalculateWithCustomPrice',
      customPrice: price
    }, (data) => {
      if (chrome.runtime.lastError) {
        console.error('Error recalculando:', chrome.runtime.lastError);
        return;
      }
      
      if (data && data.optimizedRoutes) {
        console.log('✅ Recálculo completado con precio personalizado');
        currentData = data;
        displayDataFromBackground(data);
        displayDollarInfo(data.oficial);
      }
    });
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
