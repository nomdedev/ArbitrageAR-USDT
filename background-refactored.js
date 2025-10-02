// ============================================
// ARBITRAGE ARBITRAGE - MAIN COORDINATOR
// Coordinador principal que usa servicios separados (SOLID)
// ============================================

// Importar servicios
// import { DataService } from './DataService.js';
// import { StorageManager } from './StorageManager.js';
// import { ArbitrageCalculator } from './ArbitrageCalculator.js';
// import { NotificationManager } from './NotificationManager.js';
// import { ScrapingService } from './ScrapingService.js';

// Para Chrome Extension, usamos archivos separados pero importamos aquí
// Como estamos en un service worker, creamos las instancias directamente

// Inicializar servicios
const dataService = typeof DataService !== 'undefined' ? new DataService() : {
  fetchDolarOficial: async () => {
    const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
    return res.ok ? await res.json() : null;
  },
  fetchUSDTData: async () => {
    const res = await fetch('https://criptoya.com/api/usdt/ars/1');
    return res.ok ? await res.json() : null;
  },
  fetchUSDTUsdData: async () => {
    const res = await fetch('https://criptoya.com/api/usdt/usd/1');
    return res.ok ? await res.json() : null;
  }
};

const storageManager = typeof StorageManager !== 'undefined' ? new StorageManager() : {
  getSettings: async () => await chrome.storage.local.get('notificationSettings').then(r => r.notificationSettings || {}),
  saveSettings: async (settings) => await chrome.storage.local.set({ notificationSettings: settings }),
  getArbitrages: async () => await chrome.storage.local.get('currentData').then(r => r.currentData || {}),
  saveArbitrages: async (data) => await chrome.storage.local.set({ currentData: data }),
  getBanks: async () => await chrome.storage.local.get('banks').then(r => r.banks || []),
  saveBanks: async (banks, lastUpdate) => {
    await chrome.storage.local.set({ banks, banksLastUpdate: lastUpdate });
  }
};

const arbitrageCalculator = typeof ArbitrageCalculator !== 'undefined'
  ? new ArbitrageCalculator(storageManager)
  : {
    calculateRoutes: async (official, usdt, usdtUsd) => {
      // Lógica simplificada - en producción usaríamos la clase completa
      console.log('Calculando rutas con datos:', { official, usdt, usdtUsd });
      return [];
    }
  };

const notificationManager = typeof NotificationManager !== 'undefined'
  ? new NotificationManager(storageManager)
  : {
    sendNotification: async (arbitrage) => {
      console.log('Enviando notificación:', arbitrage);
    }
  };

const scrapingService = typeof ScrapingService !== 'undefined'
  ? new ScrapingService(dataService)
  : {
    scrapeBanksData: async () => {
      console.log('Scraping bancos...');
      return { banks: [], lastUpdate: Date.now() };
    }
  };

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

    console.log(`✅ Bancos actualizados: ${result.banks.length} bancos (${result.sources.dolarito || 0} de Dolarito, ${result.sources.dolarApi || 0} de DolarAPI)`);

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
    storageManager.getArbitrages().then(data => sendResponse(data));
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