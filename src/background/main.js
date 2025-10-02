// ============================================
// MAIN BACKGROUND MODULE - ArbitrageAR
// ============================================

import { log } from './config.js';
import {
  fetchDolaritoOficial,
  fetchCriptoyaUSDT,
  fetchCriptoyaUSDTtoUSD
} from './dataFetcher.js';
import { calculateOptimizedRoutes } from './routeCalculator.js';
import { checkAndNotify } from './notifications.js';

// Estado global del background
let currentData = null;
let lastUpdate = null;

// Función principal de actualización de datos
async function updateData() {
  log('🔄 Iniciando actualización de datos...');

  try {
    // Fetch de datos en paralelo
    const [oficial, usdt, usdtUsd] = await Promise.all([
      fetchDolaritoOficial(),
      fetchCriptoyaUSDT(),
      fetchCriptoyaUSDTtoUSD()
    ]);

    if (!oficial || !usdt) {
      log('❌ Error obteniendo datos básicos');
      return null;
    }

    // Calcular rutas optimizadas
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
function getCurrentData() {
  if (!currentData) {
    return {
      error: 'No hay datos disponibles. Espera a la próxima actualización.',
      usingCache: false
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
  log('🚀 Inicializando background script...');

  // Primera actualización de datos
  await updateData();

  // Configurar actualización periódica cada 2 minutos
  setInterval(updateData, 2 * 60 * 1000);

  log('✅ Background script inicializado');
}

// Event listeners para mensajes del popup/options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getArbitrages') {
    sendResponse(getCurrentData());
  } else if (request.action === 'getBanks') {
    getBanksData().then(data => sendResponse(data));
  } else if (request.action === 'refresh') {
    updateData().then(data => sendResponse(data));
  }

  // Mantener el canal abierto para respuestas asíncronas
  return true;
});

// Inicializar cuando se carga el service worker
initialize();