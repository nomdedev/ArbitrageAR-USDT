// ============================================
// MAIN BACKGROUND MODULE - TEST VERSION
// ============================================

console.log('🔧 [BACKGROUND-TEST] main.js se está cargando...');

// Paso 1: Solo importar config.js
import { log } from './config.js';
console.log('✅ [BACKGROUND-TEST] config.js importado exitosamente');

// Paso 2: Probar dataFetcher.js
import {
  fetchDolaritoOficial,
  fetchCriptoyaUSDT,
  fetchCriptoyaUSDTtoUSD
} from './dataFetcher.js';
console.log('✅ [BACKGROUND-TEST] dataFetcher.js importado exitosamente');

// Paso 3: Probar routeCalculator.js
import { calculateOptimizedRoutes } from './routeCalculator.js';
console.log('✅ [BACKGROUND-TEST] routeCalculator.js importado exitosamente');

// Paso 4: Probar notifications.js
import { checkAndNotify } from './notifications.js';
console.log('✅ [BACKGROUND-TEST] notifications.js importado exitosamente');

console.log('🎯 [BACKGROUND-TEST] Imports completados - inicializando...');

// Función simplificada para testing
function getCurrentData() {
  return {
    optimizedRoutes: [
      {
        broker: 'Test Broker',
        profitPercent: 5.0,
        steps: [],
        calculation: {
          netProfit: 5000,
          initial: 100000
        },
        buyExchange: 'Test Exchange',
        sellExchange: 'Test Exchange',
        isSingleExchange: true
      }
    ],
    lastUpdate: Date.now(),
    error: null,
    usingCache: false
  };
}

// Listener de mensajes simplificado
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 [BACKGROUND-TEST] Mensaje recibido:', request.action);

  if (request.action === 'getArbitrages') {
    const data = getCurrentData();
    console.log('📤 [BACKGROUND-TEST] Enviando datos de test');
    sendResponse(data);
  }

  return true;
});

console.log('✅ [BACKGROUND-TEST] Service worker de test inicializado');