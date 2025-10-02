// ============================================
// MAIN BACKGROUND MODULE - ArbitrageAR
// ============================================

console.log('🔧 [BACKGROUND] main.js se está cargando en:', new Date().toISOString());

import { log } from './config.js';
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
  log('🔄 Iniciando actualización de datos...');

  try {
    // Fetch de datos en paralelo
    log('📡 Consultando APIs...');
    const [oficial, usdt, usdtUsd] = await Promise.all([
      fetchDolaritoOficial(),
      fetchCriptoyaUSDT(),
      fetchCriptoyaUSDTtoUSD()
    ]);

    log(`📊 Datos obtenidos - Oficial: ${!!oficial}, USDT: ${!!usdt}, USDT/USD: ${!!usdtUsd}`);

    if (!oficial || !usdt) {
      log('❌ Error obteniendo datos básicos');
      return null;
    }

    // Calcular rutas optimizadas
    log('🧮 Calculando rutas optimizadas...');
    const optimizedRoutes = await calculateOptimizedRoutes(oficial, usdt, usdtUsd);

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

    log(`✅ Datos actualizados: ${optimizedRoutes.length} rutas calculadas`);

    // Verificar y enviar notificaciones
    if (optimizedRoutes.length > 0) {
      await checkAndNotify(optimizedRoutes);
    }

    return data;

  } catch (error) {
    log('❌ Error en updateData:', error);
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
  // Si no hay datos, intentar actualizar
  if (!currentData) {
    log('📊 No hay datos en cache, intentando actualizar...');
    try {
      const freshData = await updateData();
      if (freshData) {
        return {
          ...freshData,
          marketHealth: calculateMarketHealth(freshData.optimizedRoutes),
          arbitrages: freshData.optimizedRoutes || []
        };
      }
    } catch (error) {
      log('❌ Error al actualizar datos:', error);
    }

    // Si aún no hay datos, devolver mensaje de espera
    return {
      error: 'Inicializando datos... Espera unos segundos e intenta de nuevo.',
      usingCache: false,
      optimizedRoutes: [],
      arbitrages: []
    };
  }

  // Calcular salud del mercado
  const marketHealth = calculateMarketHealth(currentData.optimizedRoutes);

  return {
    ...currentData,
    marketHealth,
    arbitrages: currentData.optimizedRoutes || [] // Para compatibilidad
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

  // Configurar actualización periódica cada 2 minutos
  setInterval(async () => {
    try {
      await updateData();
    } catch (error) {
      console.error('❌ [BACKGROUND] Error en actualización periódica:', error);
    }
  }, 2 * 60 * 1000);

  log('✅ [BACKGROUND] Background script inicializado completamente');
}

// Event listeners para mensajes del popup/options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 [BACKGROUND] Mensaje recibido:', request.action);

  if (request.action === 'getArbitrages') {
    // Manejar de forma asíncrona pero responder inmediatamente
    getCurrentData().then(data => {
      console.log('📤 [BACKGROUND] Enviando respuesta con', data?.optimizedRoutes?.length || 0, 'rutas');
      sendResponse(data);
    }).catch(error => {
      console.error('❌ [BACKGROUND] Error en getArbitrages:', error);
      sendResponse({ error: 'Error interno del service worker', optimizedRoutes: [] });
    });
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