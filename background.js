
const REQUEST_INTERVAL = 600; // ms (110 req/min max)
let lastRequestTime = 0;

// Comisiones típicas por exchange (en porcentaje)
const EXCHANGE_FEES = {
  'binance': { trading: 0.1, withdrawal: 0.5 },
  'buenbit': { trading: 0.5, withdrawal: 0 },
  'ripio': { trading: 1.0, withdrawal: 0 },
  'letsbit': { trading: 0.9, withdrawal: 0 },
  'satoshitango': { trading: 1.5, withdrawal: 0 },
  'belo': { trading: 1.0, withdrawal: 0 },
  'tiendacrypto': { trading: 0.8, withdrawal: 0 },
  'cryptomkt': { trading: 0.8, withdrawal: 0 },
  'bitso': { trading: 0.5, withdrawal: 0 },
  'lemoncash': { trading: 1.0, withdrawal: 0 },
  'default': { trading: 1.0, withdrawal: 0.5 } // Valores por defecto
};

async function fetchWithRateLimit(url) {
  const now = Date.now();
  const delay = REQUEST_INTERVAL - (now - lastRequestTime);
  if (delay > 0) {
    await new Promise(r => setTimeout(r, delay));
  }
  lastRequestTime = Date.now();
  try {
    // Añadir timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    return data;
  } catch(e) {
    if (e.name === 'AbortError') {
      console.error('Fetch timeout:', url);
    } else {
      console.error('Fetch error:', url, e);
    }
    return null;
  }
}

async function fetchDolaritoOficial() {
  // Endpoint corregido de Dolarito
  const data = await fetchWithRateLimit('https://dolarapi.com/v1/dolares/oficial');
  // Validar estructura de respuesta
  if (data && typeof data.compra === 'number' && typeof data.venta === 'number') {
    return data;
  }
  console.error('Estructura de datos inválida de Dolarito:', data);
  return null;
}

async function fetchCriptoyaUSDT() {
  // Endpoint CriptoYA para USDT en pesos y brokers
  const data = await fetchWithRateLimit('https://criptoya.com/api/usdt/ars/1');
  // Validar que la respuesta sea un objeto válido
  if (data && typeof data === 'object') {
    return data;
  }
  console.error('Estructura de datos inválida de CriptoYA:', data);
  return null;
}

async function fetchCriptoyaUSDTtoUSD() {
  // Endpoint CriptoYA para conversión USD/USDT por exchange
  // ¡CRÍTICO! Este ratio NO es 1:1, sino ~1.049 (cuesta más USD comprar USDT)
  const data = await fetchWithRateLimit('https://criptoya.com/api/usdt/usd/1');
  // Validar que la respuesta sea un objeto válido
  if (data && typeof data === 'object') {
    return data;
  }
  console.error('Estructura de datos inválida de CriptoYA USD/USDT:', data);
  return null;
}

async function updateData() {
  const oficial = await fetchDolaritoOficial();
  const usdt = await fetchCriptoyaUSDT();
  const usdtUsd = await fetchCriptoyaUSDTtoUSD(); // ¡CRÍTICO! Obtener ratio USD/USDT

  if (!oficial || !usdt || !usdtUsd) {
    console.error('Error fetching data');
    // Guardar estado de error
    await chrome.storage.local.set({ 
      error: 'No se pudieron obtener los datos de las APIs',
      lastUpdate: Date.now() 
    });
    return;
  }

  // Calcular arbitrajes posibles
  const arbitrages = [];

  // Declarar variables correctamente
  const officialBuyPrice = parseFloat(oficial.compra) || 0; // Precio de compra del dólar oficial
  const officialSellPrice = parseFloat(oficial.venta) || 0; // Precio de venta del dólar oficial
  
  // Validar que el precio oficial sea válido
  if (officialSellPrice <= 0 || officialBuyPrice <= 0) {
    console.error('Precio oficial inválido:', oficial);
    await chrome.storage.local.set({ 
      error: 'Precio oficial inválido o no disponible',
      lastUpdate: Date.now() 
    });
    return;
  }
  
  // CriptoYA devuelve un objeto con brokers como keys
  // Filtrar solo exchanges válidos y excluir claves no deseadas
  const excludedKeys = ['time', 'timestamp', 'fecha', 'date', 'p2p', 'total'];
  const exchanges = Object.keys(usdt).filter(key => {
    return typeof usdt[key] === 'object' && 
           usdt[key] !== null && 
           !excludedKeys.includes(key.toLowerCase());
  });

  const skippedExchanges = [];

  exchanges.forEach(exchangeName => {
    const exchange = usdt[exchangeName];
    const exchangeUsdRate = usdtUsd[exchangeName];
    
    // Validar que existan los precios en ambas APIs
    if (!exchange || typeof exchange !== 'object') return;
    if (!exchangeUsdRate || typeof exchangeUsdRate !== 'object') {
      skippedExchanges.push(exchangeName);
      return;
    }
    
    // Precios USDT/ARS
    const usdtArsAsk = parseFloat(exchange.totalAsk) || parseFloat(exchange.ask) || 0; // Comprar USDT con ARS
    const usdtArsBid = parseFloat(exchange.totalBid) || parseFloat(exchange.bid) || 0; // Vender USDT por ARS
    
    // Precios USD/USDT (¡CRÍTICO para el arbitraje!)
    const usdToUsdtRate = parseFloat(exchangeUsdRate.totalAsk) || parseFloat(exchangeUsdRate.ask) || 0; // Cuántos USD necesito para comprar 1 USDT
    const usdtToUsdRate = parseFloat(exchangeUsdRate.totalBid) || parseFloat(exchangeUsdRate.bid) || 0; // Cuántos USD recibo si vendo 1 USDT
    
    // Validaciones estrictas
    if (usdtArsBid <= 0 || usdToUsdtRate <= 0) return;
    if (officialSellPrice <= 0) return;
    
    // Filtrar spreads muy altos en ARS (posible P2P)
    const spreadArs = ((usdtArsAsk - usdtArsBid) / usdtArsBid) * 100;
    if (Math.abs(spreadArs) > 10) {
      console.warn(`${exchangeName} tiene spread ARS muy alto (${spreadArs.toFixed(2)}%), posible P2P`);
      return;
    }
    
    // Filtrar spreads absurdos en USD/USDT
    if (usdToUsdtRate > 1.15 || usdToUsdtRate < 0.95) {
      console.warn(`${exchangeName} tiene ratio USD/USDT anormal (${usdToUsdtRate}), omitiendo`);
      return;
    }

    // Obtener comisiones del exchange
    const exchangeNameLower = exchangeName.toLowerCase();
    const fees = EXCHANGE_FEES[exchangeNameLower] || EXCHANGE_FEES['default'];
    
    if (!EXCHANGE_FEES[exchangeNameLower]) {
      console.info(`Exchange ${exchangeName} no encontrado en DB de fees, usando valores por defecto`);
    }
    
    // ============================================
    // CÁLCULO CORRECTO DEL ARBITRAJE
    // ============================================
    // Flujo: ARS → USD (oficial) → USDT (exchange) → ARS (venta)
    
    const initialAmount = 100000; // ARS
    
    // PASO 1: Comprar USD en banco oficial
    const usdPurchased = initialAmount / officialSellPrice;
    // Ej: $100,000 / $1,050 = 95.24 USD
    
    // PASO 2: Depositar USD en exchange y comprar USDT
    // CRÍTICO: El exchange cobra para convertir USD → USDT
    const usdtPurchased = usdPurchased / usdToUsdtRate;
    // Ej: 95.24 USD / 1.049 = 90.79 USDT
    
    // PASO 2b: Fee de trading al comprar USDT
    const usdtAfterBuyFee = usdtPurchased * (1 - fees.trading / 100);
    // Ej: 90.79 × (1 - 0.001) = 90.70 USDT
    
    // PASO 3: Vender USDT por ARS
    const arsFromUsdtSale = usdtAfterBuyFee * usdtArsBid;
    // Ej: 90.70 USDT × $1,529.66 = $138,740 ARS
    
    // PASO 3b: Fee de trading al vender USDT
    const arsAfterSellFee = arsFromUsdtSale * (1 - fees.trading / 100);
    // Ej: $138,740 × (1 - 0.001) = $138,601 ARS
    
    // PASO 4: Fee de retiro
    const finalAmount = arsAfterSellFee * (1 - fees.withdrawal / 100);
    // Ej: $138,601 × (1 - 0.005) = $137,908 ARS
    
    // GANANCIA NETA
    const netProfit = finalAmount - initialAmount;
    const netProfitPercent = (netProfit / initialAmount) * 100;
    // Ej: ($137,908 - $100,000) / $100,000 = 37.91%
    
    // GANANCIA BRUTA (sin fees, para comparación)
    // Precio efectivo del USDT en USD: usdtArsBid / officialSellPrice
    const effectiveUsdtPriceInUsd = usdtArsBid / officialSellPrice;
    const grossProfitPercent = ((effectiveUsdtPriceInUsd / usdToUsdtRate - 1)) * 100;
    
    // Validar que los números sean finitos y razonables
    if (!isFinite(netProfitPercent) || !isFinite(grossProfitPercent)) {
      console.error(`Cálculo inválido para ${exchangeName}`);
      return;
    }
    
    // Mostrar TODOS los arbitrajes (incluso <1%) en el popup
    // Solo notificaremos los que superen 1% en la función showNotification
    if (netProfitPercent >= 0.1) {
      arbitrages.push({
        broker: exchangeName,
        officialPrice: officialSellPrice,
        usdToUsdtRate: usdToUsdtRate, // NUEVO: Ratio de conversión USD → USDT
        usdtArsBid: usdtArsBid, // Precio de venta USDT por ARS
        usdtArsAsk: usdtArsAsk, // Precio de compra USDT con ARS
        profitPercent: netProfitPercent, // Ganancia NETA
        grossProfitPercent: grossProfitPercent, // Ganancia bruta
        fees: {
          trading: fees.trading,
          withdrawal: fees.withdrawal,
          total: fees.trading * 2 + fees.withdrawal
        },
        calculation: {
          initial: initialAmount,
          usdPurchased: usdPurchased,
          usdtPurchased: usdtPurchased,
          usdtAfterBuyFee: usdtAfterBuyFee,
          arsFromSale: arsFromUsdtSale,
          arsAfterSellFee: arsAfterSellFee,
          finalAmount: finalAmount,
          netProfit: netProfit
        }
      });
    }
  });

  // Logging resumido
  if (skippedExchanges.length > 0) {
    console.log(`ℹ️ ${skippedExchanges.length} exchanges omitidos (sin USD/USDT): ${skippedExchanges.slice(0, 5).join(', ')}${skippedExchanges.length > 5 ? '...' : ''}`);
  }
  console.log(`✅ ${arbitrages.length} oportunidades de arbitraje encontradas`);

  arbitrages.sort((a, b) => b.profitPercent - a.profitPercent);
  const top20 = arbitrages.slice(0, 20); // Guardar hasta 20 oportunidades

  await chrome.storage.local.set({ 
    official: oficial, 
    usdt: usdt, 
    arbitrages: top20, 
    lastUpdate: Date.now(),
    error: null // Limpiar errores previos
  });
  
  // Verificar si debe enviar notificaciones
  await checkAndNotify(top5);
}

// Actualización periódica
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'update') {
    updateData();
  }
  if (alarm.name === 'updateBanks') {
    updateBanksData();
  }
});

// Arranque de la extension
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('update', { periodInMinutes: 1 });
  chrome.alarms.create('updateBanks', { periodInMinutes: 30 });
  updateData();
  updateBanksData();
});

// Helper: Formatear nombre de banco/tipo de dólar
function formatBankName(name) {
  const nameMap = {
    'oficial': 'Dólar Oficial',
    'blue': 'Dólar Blue',
    'tarjeta': 'Dólar Tarjeta',
    'mayorista': 'Dólar Mayorista',
    'mep': 'Dólar MEP',
    'ccl': 'Dólar CCL'
  };
  return nameMap[name?.toLowerCase()] || name;
}

// Helper: Datos de fallback si la API falla
function getBanksDataFallback() {
  return [
    {
      name: 'Dólar Oficial',
      compra: 0,
      venta: 0,
      timestamp: new Date().toISOString(),
      note: 'Datos no disponibles. Intente actualizar más tarde.'
    }
  ];
}

// Función para obtener datos de bancos mediante API
async function fetchBanksData() {
  try {
    // Obtener todos los tipos de dólar desde DolarAPI
    const dolares = await fetchWithRateLimit('https://dolarapi.com/v1/dolares');
    
    if (!dolares || !Array.isArray(dolares)) {
      console.warn('No se pudieron obtener datos de DolarAPI');
      return getBanksDataFallback();
    }

    const banks = [];
    
    // Mapear tipos de dólar relevantes
    const relevantTypes = ['oficial', 'blue', 'tarjeta', 'mayorista'];
    
    dolares
      .filter(d => relevantTypes.includes(d.casa?.toLowerCase()))
      .forEach(dolar => {
        if (dolar.compra && dolar.venta) {
          banks.push({
            name: formatBankName(dolar.casa || dolar.nombre),
            compra: parseFloat(dolar.compra),
            venta: parseFloat(dolar.venta),
            timestamp: dolar.fechaActualizacion || new Date().toISOString()
          });
        }
      });

    // Si no hay datos, usar fallback
    if (banks.length === 0) {
      return getBanksDataFallback();
    }

    return banks;
  } catch (error) {
    console.error('Error fetching banks data:', error);
    return [];
  }
}

// Actualizar datos de bancos periódicamente
async function updateBanksData() {
  const banks = await fetchBanksData();
  await chrome.storage.local.set({ 
    banks: banks,
    banksLastUpdate: Date.now()
  });
}

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

let lastNotificationTime = 0;
let notifiedArbitrages = new Set(); // Para evitar notificar el mismo arbitraje repetidamente

async function shouldSendNotification(settings, arbitrage) {
  // 1. Verificar si las notificaciones están habilitadas
  if (!settings.notificationsEnabled) {
    return false;
  }
  
  // 2. Verificar horario silencioso
  if (settings.quietHoursEnabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = settings.quietStart;
    const end = settings.quietEnd;
    
    // Si el horario atraviesa medianoche (ej: 22:00 - 08:00)
    if (start > end) {
      if (currentTime >= start || currentTime <= end) {
        return false; // Está en horario silencioso
      }
    } else {
      if (currentTime >= start && currentTime <= end) {
        return false; // Está en horario silencioso
      }
    }
  }
  
  // 3. Verificar frecuencia de notificaciones
  const now = Date.now();
  const frequencies = {
    'always': 0,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    'once': Infinity
  };
  
  const minInterval = frequencies[settings.notificationFrequency] || frequencies['15min'];
  if (now - lastNotificationTime < minInterval) {
    return false;
  }
  
  // 4. Verificar umbral mínimo de 1% para notificaciones (mostrar todos en popup)
  // Solo notificamos arbitrajes > 1%, pero en el popup se ven todos
  if (arbitrage.profitPercent < 1.0) {
    return false; // No notificar arbitrajes menores a 1%
  }
  
  // 5. Verificar umbral según tipo de alerta configurado
  const thresholds = {
    'all': 1.0, // Notificar desde 1%
    'moderate': 5,
    'high': 10,
    'extreme': 15,
    'custom': settings.customThreshold || 5
  };
  
  const threshold = thresholds[settings.alertType] || 1.0;
  if (arbitrage.profitPercent < threshold) {
    return false;
  }
  
  // 5. Verificar si es un exchange preferido (si hay filtros)
  if (settings.preferredExchanges && settings.preferredExchanges.length > 0) {
    const exchangeName = arbitrage.broker.toLowerCase();
    const isPreferred = settings.preferredExchanges.some(pref => 
      exchangeName.includes(pref.toLowerCase())
    );
    if (!isPreferred) {
      return false;
    }
  }
  
  // 6. Verificar si ya notificamos este arbitraje recientemente
  const arbKey = `${arbitrage.broker}_${arbitrage.profitPercent.toFixed(2)}`;
  if (notifiedArbitrages.has(arbKey)) {
    return false;
  }
  
  return true;
}

async function sendNotification(arbitrage, settings) {
  try {
    const notificationId = `arbitrage_${Date.now()}`;
    
    // Determinar el ícono según la ganancia
    const iconLevel = arbitrage.profitPercent >= 15 ? 'extreme' : 
                      arbitrage.profitPercent >= 10 ? 'high' : 
                      arbitrage.profitPercent >= 5 ? 'moderate' : 'normal';
    
    const icons = {
      extreme: '🚀',
      high: '💎',
      moderate: '💰',
      normal: '📊'
    };
    
    const icon = icons[iconLevel];
    
    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `${icon} Oportunidad de Arbitraje: ${arbitrage.broker}`,
      message: `Ganancia: ${arbitrage.profitPercent.toFixed(2)}% neto\nUSD→USDT: ${arbitrage.usdToUsdtRate}\nUSDT: $${arbitrage.usdtArsBid.toFixed(2)} ARS`,
      priority: arbitrage.profitPercent >= 10 ? 2 : 1,
      requireInteraction: arbitrage.profitPercent >= 15,
      buttons: [
        { title: '👀 Ver Detalles' },
        { title: '⚙️ Configuración' }
      ]
    });
    
    // Actualizar tiempo de última notificación
    lastNotificationTime = Date.now();
    
    // Agregar a notificados (limpiar después de 1 hora)
    const arbKey = `${arbitrage.broker}_${arbitrage.profitPercent.toFixed(2)}`;
    notifiedArbitrages.add(arbKey);
    setTimeout(() => {
      notifiedArbitrages.delete(arbKey);
    }, 60 * 60 * 1000); // 1 hora
    
    // Reproducir sonido si está habilitado
    if (settings.soundEnabled) {
      // Chrome no permite reproducir audio desde background, 
      // pero podemos usar la API de notificaciones que tiene sonido por defecto
      console.log('🔔 Notificación con sonido enviada');
    }
    
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}

// Manejar clicks en notificaciones
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Ver detalles - abrir popup
    chrome.action.openPopup();
  } else if (buttonIndex === 1) {
    // Configuración - abrir página de opciones
    chrome.runtime.openOptionsPage();
  }
  chrome.notifications.clear(notificationId);
});

chrome.notifications.onClicked.addListener((notificationId) => {
  // Click en la notificación - abrir popup
  chrome.action.openPopup();
  chrome.notifications.clear(notificationId);
});

// Verificar y enviar notificaciones después de actualizar datos
async function checkAndNotify(arbitrages) {
  try {
    const result = await chrome.storage.local.get('notificationSettings');
    const settings = result.notificationSettings || {
      notificationsEnabled: true,
      alertType: 'all',
      customThreshold: 5,
      notificationFrequency: '15min',
      soundEnabled: true,
      preferredExchanges: [],
      quietHoursEnabled: false,
      quietStart: '22:00',
      quietEnd: '08:00'
    };
    
    if (!arbitrages || arbitrages.length === 0) {
      return;
    }
    
    // Tomar la mejor oportunidad
    const bestArbitrage = arbitrages[0];
    
    // Verificar si debe notificar
    if (await shouldSendNotification(settings, bestArbitrage)) {
      await sendNotification(bestArbitrage, settings);
    }
    
  } catch (error) {
    console.error('Error en checkAndNotify:', error);
  }
}

// Solicitud desde popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getArbitrages') {
    chrome.storage.local.get(['official', 'usdt', 'arbitrages', 'lastUpdate', 'error'], sendResponse);
    return true;
  }
  
  if (message.action === 'getBanks') {
    chrome.storage.local.get(['banks', 'banksLastUpdate'], (data) => {
      // Si no hay datos o son muy antiguos (más de 30 minutos), actualizar
      const thirtyMinutes = 30 * 60 * 1000;
      if (!data.banks || !data.banksLastUpdate || (Date.now() - data.banksLastUpdate > thirtyMinutes)) {
        updateBanksData().then(() => {
          chrome.storage.local.get(['banks', 'banksLastUpdate'], sendResponse);
        });
      } else {
        sendResponse(data);
      }
    });
    return true;
  }
  
  if (message.action === 'forceUpdate') {
    updateData();
    updateBanksData();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'settingsUpdated') {
    console.log('✅ Configuración de notificaciones actualizada');
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'sendTestNotification') {
    // Enviar notificación de prueba
    const testArbitrage = {
      broker: 'Buenbit (PRUEBA)',
      profitPercent: 38.5,
      usdToUsdtRate: 1.049,
      usdtArsBid: 1529.66
    };
    sendNotification(testArbitrage, message.settings)
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Error enviando notificación de prueba:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
