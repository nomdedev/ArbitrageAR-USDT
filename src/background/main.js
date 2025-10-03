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

console.log('✅ [BACKGROUND] Todos los imports completados exitosamente en:', new Date().toISOString());
console.log('🚀 [BACKGROUND] Iniciando inicialización del service worker...');

// Estado global del background
let currentData = null;
let lastUpdate = null;

// Función principal de actualización de datos
async function updateData() {
  console.log('🔄 [DEBUG] updateData() INICIO en', new Date().toISOString());

  try {
    // Fetch de datos en paralelo
    console.log('📡 [DEBUG] Consultando APIs...');
    const [oficial, usdt, usdtUsd] = await Promise.all([
      fetchDolaritoOficial(),
      fetchCriptoyaUSDT(),
      fetchCriptoyaUSDTtoUSD()
    ]);

    console.log(`📊 [DEBUG] Datos obtenidos - Oficial: ${!!oficial}, USDT: ${!!usdt}, USDT/USD: ${!!usdtUsd}`);

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

    // Verificar y enviar notificaciones
    if (optimizedRoutes.length > 0) {
      console.log('🔔 [DEBUG] Iniciando checkAndNotify...');
      try {
        await checkAndNotify(optimizedRoutes);
        console.log('✅ [DEBUG] checkAndNotify completado');
      } catch (notifyError) {
        console.error('❌ [DEBUG] Error en checkAndNotify (no crítico):', notifyError);
      }
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

// Función para obtener datos actuales
async function getCurrentData() {
  console.log('🔍 [DEBUG] getCurrentData() INICIO');
  const now = Date.now();
  
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 [BACKGROUND] Mensaje recibido:', request.action, 'en', new Date().toISOString());

  if (request.action === 'getArbitrages') {
    console.log('🔄 [BACKGROUND] Iniciando getCurrentData() para getArbitrages...');

    // Manejar de forma asíncrona pero responder inmediatamente
    getCurrentData()
      .then(data => {
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
        console.error('❌ [BACKGROUND] Error en getCurrentData():', error);
        console.error('❌ [BACKGROUND] Stack trace:', error.stack);
        try {
          sendResponse({ error: 'Error interno del service worker', optimizedRoutes: [], arbitrages: [] });
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
  } else if (request.action === 'refresh') {
    // Manejar de forma asíncrona pero responder inmediatamente
    updateData().then(data => {
      sendResponse(data);
    }).catch(error => {
      console.error('❌ [BACKGROUND] Error en refresh:', error);
      sendResponse({ error: 'Error al actualizar datos', optimizedRoutes: [] });
    });
  }

  // Mantener el canal abierto para respuestas asíncronas
  return true;
});

// Inicializar cuando se carga el service worker
initialize();