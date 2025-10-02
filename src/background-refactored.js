// ============================================
// ARBITRAGE ARBITRAGE - MAIN COORDINATOR
// Coordinador principal que usa servicios separados (SOLID)
// ============================================

// Importar servicios usando importScripts (requerido para service workers)
try {
  importScripts(
    'DataService.js',
    'StorageManager.js',
    'ArbitrageCalculator.js',
    'NotificationManager.js',
    'ScrapingService.js'
  );
  console.log('✅ Todos los servicios importados correctamente');
} catch (error) {
  console.error('❌ Error al importar servicios:', error);
}

// Inicializar servicios
// Los servicios DataService y StorageManager ya están disponibles como singletons
// Crear instancias de servicios que requieren inyección de dependencias
const arbitrageCalculator = new ArbitrageCalculator(storageManager);
const notificationManager = new NotificationManager(storageManager);
const scrapingService = new ScrapingService(dataService);

console.log('✅ Servicios inicializados:', {
  dataService: !!dataService,
  storageManager: !!storageManager,
  arbitrageCalculator: !!arbitrageCalculator,
  notificationManager: !!notificationManager,
  scrapingService: !!scrapingService
});

// ============================================
// FUNCIONES PRINCIPALES - Usando servicios
// ============================================

const DEBUG_MODE = true;

async function updateData() {
  try {
    console.log('🔄 Iniciando actualización de datos...');

    // Obtener datos usando DataService
    const [official, usdt, usdtUsd] = await Promise.all([
      dataService.fetchDolarOficial(),
      dataService.fetchUSDTData(),
      dataService.fetchUSDTUsdData()
    ]);

    if (!official || !usdt || !usdtUsd) {
      console.warn('⚠️ Datos faltantes, omitiendo actualización');
      return;
    }

    // Calcular rutas usando ArbitrageCalculator
    const optimizedRoutes = await arbitrageCalculator.calculateRoutes(official, usdt, usdtUsd);

    // Preparar datos para UI
    const currentData = {
      optimizedRoutes,
      arbitrages: optimizedRoutes, // Para compatibilidad
      official,
      usdt,
      usdtUsd,
      marketHealth: calculateMarketHealth(optimizedRoutes),
      timestamp: Date.now()
    };

    // Guardar usando StorageManager
    await storageManager.saveArbitrages(currentData);

    // Enviar notificaciones si corresponde
    if (optimizedRoutes.length > 0) {
      const bestRoute = optimizedRoutes[0];
      if (bestRoute.profitPercent > 2) { // Umbral mínimo
        await notificationManager.sendNotification(bestRoute);
      }
    }

    console.log(`✅ Datos actualizados: ${optimizedRoutes.length} rutas calculadas`);

  } catch (error) {
    console.error('❌ Error en updateData:', error);
  }
}

async function updateBanksData() {
  try {
    console.log('🏦 Actualizando datos de bancos...');

    // Scrape bancos usando ScrapingService
    const result = await scrapingService.scrapeBanksData();

    // Guardar usando StorageManager
    await storageManager.saveBanks(result.banks, result.lastUpdate);

    const dolaritoCount = result.sources.dolarito || 0;
    const dolarApiCount = result.sources.dolarApi || 0;
    const sourceInfo = dolaritoCount > 0 
      ? `${dolaritoCount} de Dolarito + ${dolarApiCount} de DolarAPI` 
      : `${dolarApiCount} de DolarAPI (Dolarito no disponible)`;

    console.log(`✅ Bancos actualizados: ${result.banks.length} bancos (${sourceInfo})`);

  } catch (error) {
    console.error('❌ Error en updateBanksData:', error);
  }
}

function calculateMarketHealth(routes) {
  if (!routes || routes.length === 0) {
    return { status: 'Sin datos', message: 'No hay rutas disponibles', color: '#666', icon: '❓' };
  }

  const avgProfit = routes.reduce((sum, r) => sum + r.profitPercent, 0) / routes.length;
  const bestProfit = routes[0].profitPercent;

  if (bestProfit >= 5) {
    return {
      status: 'Excelente',
      message: `Oportunidades de alto rendimiento (+${bestProfit.toFixed(1)}%)`,
      color: '#10b981',
      icon: '🚀'
    };
  } else if (avgProfit >= 1) {
    return {
      status: 'Bueno',
      message: `Mercado favorable (${avgProfit.toFixed(1)}% promedio)`,
      color: '#3b82f6',
      icon: '📈'
    };
  } else if (avgProfit >= -1) {
    return {
      status: 'Estable',
      message: 'Condiciones normales de mercado',
      color: '#f59e0b',
      icon: '⚖️'
    };
  } else {
    return {
      status: 'Desfavorable',
      message: 'Pérdidas potenciales, esperar mejor momento',
      color: '#ef4444',
      icon: '📉'
    };
  }
}

// ============================================
// EVENT LISTENERS - Chrome Extension
// ============================================

// Actualización periódica
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'update') {
    updateData();
  }
  if (alarm.name === 'updateBanks') {
    updateBanksData();
  }
});

// Manejar mensajes del popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getArbitrages') {
    console.log('📤 Background: Recibida solicitud getArbitrages');
    storageManager.getArbitrages().then(data => {
      console.log('📤 Background: Enviando datos al popup:', {
        hasData: !!data,
        optimizedRoutes: data?.optimizedRoutes?.length || 0,
        arbitrages: data?.arbitrages?.length || 0
      });
      sendResponse(data);
    });
    return true; // Mantener conexión abierta para respuesta async
  }

  if (message.action === 'getBanks') {
    storageManager.getBanks().then(banks => {
      const lastUpdate = Date.now(); // Simplificado
      sendResponse({ banks, lastUpdate });
    });
    return true;
  }

  if (message.action === 'updateData') {
    updateData().then(() => sendResponse({ success: true }));
    return true;
  }
});

// Inicialización
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎯 ArbitrageAR Extension instalada');

  // Configurar alarmas
  chrome.alarms.create('update', { periodInMinutes: 2 });
  chrome.alarms.create('updateBanks', { periodInMinutes: 5 });

  // Primera actualización
  updateData();
  updateBanksData();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 ArbitrageAR Extension iniciada');
  updateData();
  updateBanksData();
});