// ============================================
// MAIN BACKGROUND MODULE - ArbitrageAR
// ============================================

console.log('🔧 [BACKGROUND] main.js se está cargando en:', new Date().toISOString());

import { log, CACHE_CONFIG } from './config.js';
import {
  fetchDolaritoOficial,
  fetchCriptoyaUSDT,
  fetchCriptoyaUSDTtoUSD
} from './dataFetcher.js';
import { calculateOptimizedRoutes } from './routeCalculator.js';
import { checkAndNotify } from './notifications.js';
import { dollarPriceManager } from './dollarPriceManager.js';
import { updateChecker } from './updateChecker.js';

console.log('✅ [BACKGROUND] Todos los imports completados exitosamente en:', new Date().toISOString());
console.log('🚀 [BACKGROUND] Iniciando inicialización del service worker...');

// Estado global del background
let currentData = null;
let lastUpdate = null;
let backgroundHealthy = true;
let lastHealthCheck = 0;

// NUEVO: Health check del background
async function performHealthCheck() {
  console.log('🏥 [HEALTH] Iniciando health check...');
  const now = Date.now();
  
  // Solo hacer health check cada 5 minutos
  if (now - lastHealthCheck < 5 * 60 * 1000) {
    return backgroundHealthy;
  }
  
  try {
    // Test básico: verificar que las APIs responden
    const testPromises = [
      fetch('https://dolarapi.com/v1/dolares/oficial').then(r => r.ok),
      fetch('https://criptoya.com/api/usdt/ars/1').then(r => r.ok)
    ];
    
    const results = await Promise.allSettled(testPromises);
    const healthyApis = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    backgroundHealthy = healthyApis >= 1; // Al menos 1 API funcionando
    lastHealthCheck = now;
    
    console.log(`🏥 [HEALTH] Health check completado: ${healthyApis}/2 APIs funcionando`);
    return backgroundHealthy;
    
  } catch (error) {
    console.error('🏥 [HEALTH] Error en health check:', error);
    backgroundHealthy = false;
    lastHealthCheck = now;
    return backgroundHealthy;
  }
}

// NUEVO: Función para recalcular con precio personalizado del dólar
async function recalculateWithCustomDollarPrice(customPrice) {
  console.log(`🔄 [DEBUG] recalculateWithCustomDollarPrice() INICIO con precio $${customPrice}`);

  try {
    // Obtener datos actuales de USDT (sin refrescar el dólar)
    console.log('📡 [DEBUG] Consultando APIs para recálculo...');
    const [usdt, usdtUsd] = await Promise.all([
      fetchCriptoyaUSDT(),
      fetchCriptoyaUSDTtoUSD()
    ]);

    // Crear objeto oficial con precio personalizado
    const oficial = {
      compra: customPrice,
      venta: customPrice * 1.02, // Spread estimado del 2%
      source: 'manual_temp',
      bank: 'Temporal',
      timestamp: new Date().toISOString()
    };

    console.log(`📊 [DEBUG] Datos preparados - Custom: $${customPrice}, USDT: ${!!usdt}, USDT/USD: ${!!usdtUsd}`);

    if (!usdt) {
      console.log('❌ [DEBUG] Error obteniendo datos de USDT para recálculo');
      return null;
    }

    // Calcular rutas optimizadas con precio personalizado
    console.log('🧮 [DEBUG] Iniciando calculateOptimizedRoutes con precio personalizado...');
    const startTime = Date.now();
    const optimizedRoutes = await calculateOptimizedRoutes(oficial, usdt, usdtUsd);
    const calcTime = Date.now() - startTime;
    console.log(`✅ [DEBUG] calculateOptimizedRoutes completado en ${calcTime}ms - ${optimizedRoutes.length} rutas`);

    // Crear objeto de respuesta
    const data = {
      oficial,
      usdt,
      usdtUsd,
      optimizedRoutes,
      lastUpdate: Date.now(),
      error: null,
      usingCache: false,
      isTemporaryRecalc: true
    };

    console.log(`✅ [DEBUG] recalculateWithCustomDollarPrice() COMPLETADO - ${optimizedRoutes.length} rutas calculadas`);
    return data;

  } catch (error) {
    console.error('❌ [DEBUG] Error en recalculateWithCustomDollarPrice:', error);
    return {
      error: error.message,
      isTemporaryRecalc: true,
      lastUpdate: Date.now()
    };
  }
}

// Función principal de actualización de datos
async function updateData() {
  console.log('🔄 [DEBUG] updateData() INICIO en', new Date().toISOString());

  try {
    // Fetch de datos en paralelo, usando el nuevo sistema para el precio del dólar
    console.log('📡 [DEBUG] Consultando APIs...');
    
    // Agregar timeout de 8 segundos para getDollarPrice (puede ser lento por scraping)
    const getDollarPriceWithTimeout = Promise.race([
      dollarPriceManager.getDollarPrice(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout obteniendo precio del dólar (8s)')), 8000)
      )
    ]);
    
    const [oficial, usdt, usdtUsd] = await Promise.all([
      getDollarPriceWithTimeout.catch(async (error) => {
        console.error('❌ [DOLLAR] Error/timeout obteniendo precio:', error);
        // Fallback rápido con precio fijo
        return {
          compra: 950,
          venta: 1000,
          source: 'fallback_timeout',
          bank: 'Fallback',
          timestamp: new Date().toISOString()
        };
      }),
      fetchCriptoyaUSDT(),
      fetchCriptoyaUSDTtoUSD()
    ]);

    console.log(`📊 [DEBUG] Datos obtenidos - Oficial: ${!!oficial}, USDT: ${!!usdt}, USDT/USD: ${!!usdtUsd}`);
    console.log(`💵 [DEBUG] Precio dólar: $${oficial?.compra} (${oficial?.source}) - ${oficial?.bank}`);

    if (!oficial || !usdt) {
      console.log('❌ [DEBUG] Error obteniendo datos básicos');
      return null;
    }

    // Calcular rutas optimizadas
    console.log('🧮 [DEBUG] Iniciando calculateOptimizedRoutes...');
    const startTime = Date.now();
    const optimizedRoutes = await calculateOptimizedRoutes(oficial, usdt, usdtUsd);
    const calcTime = Date.now() - startTime;
    console.log(`✅ [DEBUG] calculateOptimizedRoutes completado en ${calcTime}ms - ${optimizedRoutes.length} rutas`);

    // Crear objeto de respuesta
    const data = {
      oficial,
      usdt,
      usdtUsd,
      optimizedRoutes,
      lastUpdate: Date.now(),
      error: null,
      usingCache: false
    };

    currentData = data;
    lastUpdate = data.lastUpdate;

    console.log(`✅ [DEBUG] updateData() COMPLETADO - ${optimizedRoutes.length} rutas calculadas`);

    // Verificar y enviar notificaciones (NO BLOQUEAR - ejecutar en background)
    if (optimizedRoutes.length > 0) {
      console.log('🔔 [DEBUG] Iniciando checkAndNotify en background...');
      // NO usar await - dejar que corra asíncrono para no bloquear
      checkAndNotify(optimizedRoutes)
        .then(() => console.log('✅ [DEBUG] checkAndNotify completado'))
        .catch(notifyError => console.error('❌ [DEBUG] Error en checkAndNotify (no crítico):', notifyError));
    }

    console.log('📤 [DEBUG] updateData() a punto de retornar data:', {
      hasData: !!data,
      routesCount: data.optimizedRoutes?.length || 0,
      hasOficial: !!data.oficial,
      hasUsdt: !!data.usdt
    });

    return data;

  } catch (error) {
    console.error('❌ [DEBUG] Error en updateData:', error);
    console.error('❌ [DEBUG] Stack trace:', error.stack);
    return {
      error: error.message,
      usingCache: true,
      lastUpdate: lastUpdate
    };
  }
}

// Función para calcular salud del mercado
function calculateMarketHealth(arbitrages) {
  if (!arbitrages || arbitrages.length === 0) {
    return {
      status: 'Sin datos',
      message: 'No hay información disponible',
      color: '#6b7280',
      icon: '❓'
    };
  }

  const maxProfit = Math.max(...arbitrages.map(arb => arb.profitPercent));
  const profitableCount = arbitrages.filter(arb => arb.profitPercent > 0).length;

  let status, message, color, icon;

  if (maxProfit >= 15) {
    status = 'Excelente';
    message = `¡Oportunidades excepcionales! Máximo: ${maxProfit.toFixed(1)}%`;
    color = '#10b981';
    icon = '🚀';
  } else if (maxProfit >= 10) {
    status = 'Muy Bueno';
    message = `Gran oportunidad de arbitraje. Máximo: ${maxProfit.toFixed(1)}%`;
    color = '#059669';
    icon = '💰';
  } else if (maxProfit >= 5) {
    status = 'Bueno';
    message = `Buenas oportunidades disponibles. Máximo: ${maxProfit.toFixed(1)}%`;
    color = '#0d9488';
    icon = '📈';
  } else if (maxProfit >= 2) {
    status = 'Regular';
    message = `Oportunidades limitadas. Máximo: ${maxProfit.toFixed(1)}%`;
    color = '#f59e0b';
    icon = '⚖️';
  } else if (profitableCount > 0) {
    status = 'Bajo';
    message = `Muy pocas oportunidades rentables`;
    color = '#ef4444';
    icon = '📉';
  } else {
    status = 'Negativo';
    message = 'No hay oportunidades rentables en este momento';
    color = '#dc2626';
    icon = '❌';
  }

  return { status, message, color, icon };
}

// Función para obtener datos actuales con timeout
async function getCurrentData() {
  console.log('🔍 [DEBUG] getCurrentData() INICIO');

  // Promise con timeout de 12 segundos para evitar que el popup haga timeout
  return Promise.race([
    getCurrentDataInternal(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout interno del background (12s)')), 12000)
    )
  ]);
}

// Función interna para obtener datos
async function getCurrentDataInternal() {
  console.log('🔍 [DEBUG] getCurrentDataInternal() INICIO');
  const now = Date.now();
  
  // Verificar salud del background
  const isHealthy = await performHealthCheck();
  if (!isHealthy) {
    console.warn('⚠️ [HEALTH] Background no está saludable, usando datos cached si están disponibles');
    if (currentData) {
      return {
        ...currentData,
        error: 'APIs externas no disponibles. Usando datos en cache.',
        usingCache: true,
        unhealthy: true
      };
    }
  }
  
  // Si tenemos datos cacheados y son recientes, usarlos
  if (currentData && lastUpdate) {
    const cacheAge = (now - lastUpdate) / (1000 * 60); // en minutos
    const isCacheValid = cacheAge < CACHE_CONFIG.maxCacheAge;
    
    if (isCacheValid && !CACHE_CONFIG.forceRefreshOnPopupOpen) {
      console.log(`📊 [DEBUG] Usando datos cacheados (${cacheAge.toFixed(1)} min antiguos)`);
      console.log('📊 [DEBUG] Cache data:', {
        hasCurrentData: !!currentData,
        routesInCache: currentData?.optimizedRoutes?.length || 0
      });
      
      // Calcular salud del mercado
      console.log('🔧 [DEBUG] Calculando marketHealth para cache...');
      const marketHealth = calculateMarketHealth(currentData.optimizedRoutes);
      console.log('🔧 [DEBUG] marketHealth calculado:', marketHealth?.status);
      
      const result = {
        ...currentData,
        marketHealth,
        arbitrages: currentData.optimizedRoutes || [],
        usingCache: true
      };
      
      console.log('🔍 [DEBUG] getCurrentData() RETORNA (cache):', {
        routesCount: result.optimizedRoutes?.length || 0,
        arbitragesCount: result.arbitrages?.length || 0,
        hasError: !!result.error,
        hasMarketHealth: !!result.marketHealth
      });
      
      console.log('📤 [DEBUG] Retornando result de cache...');
      return result;
    }
  }
  
  // Si no hay cache válido, intentar actualizar
  console.log('📊 No hay cache válido, intentando actualizar...');
  try {
    console.log('🔄 [DEBUG] Llamando updateData()...');
    const freshData = await updateData();
    console.log('🔍 [DEBUG] updateData() retornó:', {
      hasFreshData: !!freshData,
      type: typeof freshData,
      routesCount: freshData?.optimizedRoutes?.length || 0,
      keys: freshData ? Object.keys(freshData) : []
    });
    
    if (freshData) {
      console.log('🔧 [DEBUG] Construyendo resultado con freshData...');
      
      const marketHealth = calculateMarketHealth(freshData.optimizedRoutes);
      console.log('🔧 [DEBUG] marketHealth calculado:', marketHealth?.status);
      
      const result = {
        ...freshData,
        marketHealth,
        arbitrages: freshData.optimizedRoutes || []
      };
      
      console.log('🔍 [DEBUG] getCurrentData() RETORNA (fresh):', {
        routesCount: result.optimizedRoutes?.length || 0,
        arbitragesCount: result.arbitrages?.length || 0,
        hasError: !!result.error,
        hasMarketHealth: !!result.marketHealth
      });
      
      return result;
    } else {
      console.log('⚠️ [DEBUG] freshData es null/undefined, continuando al final...');
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error en updateData():', error);
    console.error('❌ [DEBUG] Stack trace:', error.stack);
    log('❌ Error al actualizar datos:', error);
    
    // Si hay cache antiguo disponible, devolverlo con una advertencia
    if (currentData && CACHE_CONFIG.showCacheWhileUpdating) {
      const cacheAge = lastUpdate ? (now - lastUpdate) / (1000 * 60) : 0;
      log(`⚠️ Usando cache antiguo (${cacheAge.toFixed(1)} min) por error en actualización`);
      
      const marketHealth = calculateMarketHealth(currentData.optimizedRoutes);
      
      return {
        ...currentData,
        marketHealth,
        arbitrages: currentData.optimizedRoutes || [],
        usingCache: true,
        error: `Datos antiguos (${cacheAge.toFixed(1)} min). Error al actualizar.`
      };
    }
  }

  // Si no hay nada, devolver mensaje de espera
  console.log('🔍 [DEBUG] getCurrentData() FIN - retornando mensaje de inicialización');
  return {
    error: 'Inicializando datos... Espera unos segundos e intenta de nuevo.',
    usingCache: false,
    optimizedRoutes: [],
    arbitrages: []
  };
}

// Función para obtener datos de bancos (placeholder - implementar después)
async function getBanksData() {
  // Futura implementación: fetching de datos de bancos
  return { banks: [] };
}

// Inicialización del background script
async function initialize() {
  log('🚀 [BACKGROUND] Inicializando background script en:', new Date().toISOString());

  try {
    log('📦 [BACKGROUND] Verificando imports...');
    // Verificar que las funciones importadas existen
    log('✅ [BACKGROUND] log function:', typeof log);
    log('✅ [BACKGROUND] fetchDolaritoOficial function:', typeof fetchDolaritoOficial);
    log('✅ [BACKGROUND] calculateOptimizedRoutes function:', typeof calculateOptimizedRoutes);

    // Primera actualización de datos
    log('📡 [BACKGROUND] Intentando primera actualización de datos...');
    await updateData();
    log('✅ [BACKGROUND] Primera actualización completada');
  } catch (error) {
    console.error('❌ [BACKGROUND] Error en inicialización:', error);
    console.error('❌ [BACKGROUND] Stack trace:', error.stack);
  }

  // Configurar actualización periódica cada X minutos
  setInterval(async () => {
    try {
      await updateData();
    } catch (error) {
      console.error('❌ [BACKGROUND] Error en actualización periódica:', error);
    }
  }, CACHE_CONFIG.autoUpdateInterval * 60 * 1000);

  log('✅ [BACKGROUND] Background script inicializado completamente');
}

// Event listeners para mensajes del popup/options
console.log('🔧 [BACKGROUND] Registrando chrome.runtime.onMessage listener...');
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 [BACKGROUND] Mensaje recibido:', request, 'de sender:', sender);
  console.log('📨 [BACKGROUND] Action:', request.action, 'en', new Date().toISOString());

  if (request.action === 'getArbitrages') {
    console.log('🔄 [BACKGROUND] Procesando getArbitrages...');
    console.log('🔄 [BACKGROUND] Iniciando getCurrentData() para getArbitrages...');

    // Añadir timeout de seguridad para garantizar respuesta
    const safetyTimeout = setTimeout(() => {
      console.error('🚨 [BACKGROUND] Safety timeout - forzando respuesta');
      try {
        sendResponse({ 
          error: 'Background timeout interno. Reinicia la extensión.',
          optimizedRoutes: [], 
          arbitrages: [],
          timeout: true
        });
      } catch (e) {
        console.error('❌ [BACKGROUND] Error en safety timeout:', e);
      }
    }, 10000);
    
    // Manejar de forma asíncrona pero responder inmediatamente
    getCurrentData()
      .then(data => {
        clearTimeout(safetyTimeout);
        console.log('✅ [BACKGROUND] getCurrentData() resuelto exitosamente');
        console.log('📤 [BACKGROUND] Preparando respuesta con', data?.optimizedRoutes?.length || 0, 'rutas');
        console.log('📤 [BACKGROUND] Respuesta completa:', {
          hasError: !!data?.error,
          routesCount: data?.optimizedRoutes?.length || 0,
          arbitragesCount: data?.arbitrages?.length || 0,
          usingCache: data?.usingCache,
          timestamp: new Date().toISOString()
        });
        
        console.log('📤 [BACKGROUND] Llamando sendResponse()...');
        try {
          sendResponse(data);
          console.log('✅ [BACKGROUND] sendResponse() ejecutado correctamente');
        } catch (error) {
          console.error('❌ [BACKGROUND] Error al ejecutar sendResponse():', error);
        }
      })
      .catch(error => {
        clearTimeout(safetyTimeout);
        console.error('❌ [BACKGROUND] Error en getCurrentData():', error);
        console.error('❌ [BACKGROUND] Stack trace:', error.stack);
        try {
          const errorResponse = {
            error: error.message || 'Error interno del service worker',
            optimizedRoutes: [], 
            arbitrages: [],
            isTimeout: error.message?.includes('Timeout'),
            backgroundUnhealthy: !backgroundHealthy
          };
          sendResponse(errorResponse);
          console.log('✅ [BACKGROUND] sendResponse() de error ejecutado');
        } catch (sendError) {
          console.error('❌ [BACKGROUND] Error al ejecutar sendResponse() de error:', sendError);
        }
      });

    // Mantener el canal abierto para respuestas asíncronas
    console.log('🔄 [BACKGROUND] Retornando true para mantener canal abierto');
    return true;
  } else if (request.action === 'getBanks') {
    // Manejar de forma asíncrona pero responder inmediatamente
    getBanksData().then(data => {
      sendResponse(data);
    }).catch(error => {
      console.error('❌ [BACKGROUND] Error en getBanks:', error);
      sendResponse({ banks: [] });
    });
  } else if (request.action === 'getBankRates') {
    // NUEVO: Obtener cotizaciones bancarias desde dolarito.ar
    console.log('📡 [BACKGROUND] Solicitando cotizaciones bancarias...');
    dollarPriceManager.getBankRates().then(bankRates => {
      console.log('✅ [BACKGROUND] Cotizaciones bancarias obtenidas:', Object.keys(bankRates || {}).length, 'bancos');
      sendResponse({ bankRates: bankRates || {} });
    }).catch(error => {
      console.error('❌ [BACKGROUND] Error obteniendo cotizaciones bancarias:', error);
      sendResponse({ bankRates: {}, error: error.message });
    });
  } else if (request.action === 'refresh') {
    // Manejar de forma asíncrona pero responder inmediatamente
    updateData().then(data => {
      sendResponse(data);
    }).catch(error => {
      console.error('❌ [BACKGROUND] Error en refresh:', error);
      sendResponse({ error: 'Error al actualizar datos', optimizedRoutes: [] });
    });
  } else if (request.action === 'recalculateWithCustomPrice') {
    // NUEVO: Recalcular con precio personalizado del dólar
    const customPrice = request.customPrice;
    console.log(`🔄 [BACKGROUND] Recalculando con precio personalizado: $${customPrice}`);
    
    recalculateWithCustomDollarPrice(customPrice).then(data => {
      sendResponse(data);
    }).catch(error => {
      console.error('❌ [BACKGROUND] Error en recálculo personalizado:', error);
      sendResponse({ error: 'Error al recalcular con precio personalizado', optimizedRoutes: [] });
    });
  }

  // Mantener el canal abierto para respuestas asíncronas
  return true;
});

console.log('✅ [BACKGROUND] Listener registrado exitosamente');

// NUEVO: Listener para cambios en configuración
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('🔧 [STORAGE] Cambios detectados en storage:', changes);
  
  if (namespace === 'local' && changes.notificationSettings) {
    const newSettings = changes.notificationSettings.newValue;
    const oldSettings = changes.notificationSettings.oldValue;
    
    // Verificar si cambió la configuración del precio del dólar
    if (newSettings?.dollarPriceSource !== oldSettings?.dollarPriceSource ||
        newSettings?.manualDollarPrice !== oldSettings?.manualDollarPrice ||
        newSettings?.preferredBank !== oldSettings?.preferredBank) {
      
      console.log('💵 [STORAGE] Configuración del dólar cambió, refrescando datos...');
      console.log('💵 [STORAGE] Fuente:', oldSettings?.dollarPriceSource, '→', newSettings?.dollarPriceSource);
      console.log('💵 [STORAGE] Precio manual:', oldSettings?.manualDollarPrice, '→', newSettings?.manualDollarPrice);
      
      // Invalidar cache y actualizar datos
      currentData = null;
      lastUpdate = null;
      
      // CRÍTICO: También invalidar cache del dollarPriceManager
      dollarPriceManager.invalidateCache();
      
      updateData().then(freshData => {
        if (freshData) {
          console.log('✅ [STORAGE] Datos refrescados por cambio de configuración');
        }
      }).catch(error => {
        console.error('❌ [STORAGE] Error refrescando datos por cambio de configuración:', error);
      });
    }
  }
});


console.log('✅ [BACKGROUND] Storage listener registrado exitosamente');

// Inicializar cuando se carga el service worker
console.log('🚀 [BACKGROUND] Llamando initialize()...');
initialize();

// Inicializar checker de actualizaciones
console.log('🔄 [BACKGROUND] Inicializando update checker...');
updateChecker.initialize().catch(error => {
  console.error('❌ [BACKGROUND] Error inicializando update checker:', error);
});


// Inicializar cuando se carga el service worker
console.log('🚀 [BACKGROUND] Llamando initialize()...');
initialize();