
const REQUEST_INTERVAL = 600; // ms (110 req/min max)
let lastRequestTime = 0;

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

async function updateData() {
  const oficial = await fetchDolaritoOficial();
  const usdt = await fetchCriptoyaUSDT();

  if (!oficial || !usdt) {
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
  
  // CriptoYA devuelve un objeto con brokers como keys
  const exchanges = Object.keys(usdt).filter(key => typeof usdt[key] === 'object' && usdt[key] !== null);

  exchanges.forEach(exchangeName => {
    const exchange = usdt[exchangeName];
    
    // Validar que existan los precios
    if (!exchange || typeof exchange !== 'object') return;
    
    const usdtBuyPrice = parseFloat(exchange.totalAsk) || parseFloat(exchange.ask) || 0; // Precio para comprar USDT en pesos
    const usdtSellPrice = parseFloat(exchange.totalBid) || parseFloat(exchange.bid) || 0; // Precio para vender USDT en pesos
    
    if (usdtBuyPrice === 0 || usdtSellPrice === 0 || officialBuyPrice === 0) return;

    // Lógica de arbitraje: 
    // 1. Comprar USD oficial a officialSellPrice pesos
    // 2. Usar esos USD para comprar USDT
    // 3. Vender USDT por pesos a usdtSellPrice
    // Ganancia = (usdtSellPrice - officialSellPrice) / officialSellPrice * 100
    
    const profitPercent = ((usdtSellPrice - officialSellPrice) / officialSellPrice) * 100;
    
    // Umbral mínimo de rentabilidad del 2%
    if (profitPercent > 2) {
      arbitrages.push({
        broker: exchangeName,
        officialPrice: officialSellPrice,
        buyPrice: usdtBuyPrice,
        sellPrice: usdtSellPrice,
        profitPercent: profitPercent
      });
    }
  });

  arbitrages.sort((a, b) => b.profitPercent - a.profitPercent);
  const top5 = arbitrages.slice(0, 5);

  await chrome.storage.local.set({ 
    official: oficial, 
    usdt: usdt, 
    arbitrages: top5, 
    lastUpdate: Date.now(),
    error: null // Limpiar errores previos
  });
  
  // Notificar si hay oportunidades muy buenas (>5%)
  if (top5.length > 0 && top5[0].profitPercent > 5) {
    sendNotification(top5[0]);
  }
}

function sendNotification(arbitrage) {
  chrome.notifications.create(`arb_${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: `Oportunidad Arbitraje en ${arbitrage.broker}`,
    message: `Ganancia estimada: ${arbitrage.profitPercent.toFixed(2)}%`
  });
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

// Función para obtener datos de bancos mediante web scraping/API
async function fetchBanksData() {
  try {
    // Intentar obtener datos de múltiples bancos desde DolarAPI
    const bankEndpoints = [
      'https://dolarapi.com/v1/dolares/oficial',
      'https://dolarapi.com/v1/bancos/nacion',
      'https://dolarapi.com/v1/bancos/bbva',
      'https://dolarapi.com/v1/bancos/galicia',
      'https://dolarapi.com/v1/bancos/santander',
      'https://dolarapi.com/v1/bancos/ciudad',
      'https://dolarapi.com/v1/bancos/supervielle',
      'https://dolarapi.com/v1/bancos/patagonia',
      'https://dolarapi.com/v1/bancos/comafi',
      'https://dolarapi.com/v1/bancos/industrial'
    ];

    const banks = [];
    
    // Obtener datos de cada banco
    for (const endpoint of bankEndpoints) {
      const data = await fetchWithRateLimit(endpoint);
      if (data?.compra && data?.venta) {
        const bankName = data.nombre || endpoint.split('/').pop().toUpperCase();
        banks.push({
          name: bankName === 'oficial' ? 'Banco Central (Oficial)' : `Banco ${bankName.charAt(0).toUpperCase() + bankName.slice(1)}`,
          compra: parseFloat(data.compra),
          venta: parseFloat(data.venta),
          timestamp: data.fechaActualizacion || new Date().toISOString()
        });
      }
    }

    // Si no hay datos de bancos específicos, usar datos de Dolarito
    if (banks.length === 0) {
      const dolaritoData = await fetchWithRateLimit('https://dolarapi.com/v1/dolares');
      if (dolaritoData && Array.isArray(dolaritoData)) {
        dolaritoData.forEach(dolar => {
          if (dolar.casa && dolar.compra && dolar.venta) {
            banks.push({
              name: dolar.casa,
              compra: parseFloat(dolar.compra),
              venta: parseFloat(dolar.venta),
              timestamp: dolar.fechaActualizacion || new Date().toISOString()
            });
          }
        });
      }
    }

    // Filtrar solo bancos (no incluir blue, MEP, etc.)
    const validBanks = banks.filter(bank => 
      bank.name.toLowerCase().includes('banco') || 
      bank.name.toLowerCase().includes('oficial') ||
      bank.name.toLowerCase().includes('nacion') ||
      bank.name.toLowerCase().includes('bbva') ||
      bank.name.toLowerCase().includes('galicia')
    );

    return validBanks.length > 0 ? validBanks : banks.slice(0, 10);
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
});
