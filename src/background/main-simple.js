// ============================================
// MAIN BACKGROUND SCRIPT - ArbitrageAR v5.0.84
// Service Worker para Chrome Extension
// REFACTORIZADO v5.0.84: Eliminado código no utilizado
// - fetchDollarTypes() - función legacy no referenciada
// - getCachedData() - función no utilizada
// ============================================

console.log('🔧 [BACKGROUND] Iniciando service worker...');

// ============================================
// IMPORTAR MÓDULOS (compatibilidad con service worker)
// ============================================
try {
  importScripts('apiClient.js', 'arbitrageCalculator.js', '../DataService.js');
  console.log('✅ [BACKGROUND] Módulos importados correctamente');
} catch (e) {
  console.warn('⚠️ [BACKGROUND] No se pudieron importar módulos:', e.message);
  console.log('📝 [BACKGROUND] Usando implementación inline como fallback');
}

// ============================================
// IMPORTACIONES INLINE DE UTILIDADES (fallback)
// ============================================

// Funciones de cálculo bancario centralizadas (inline para compatibilidad)
const BANK_CALCULATIONS = {
  DEFAULT_BANKS: ['bna', 'galicia', 'santander', 'bbva', 'icbc'],

  calculateBankConsensus(bankData, selectedBanks = null) {
    let filteredBanks = bankData;
    if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
      filteredBanks = {};
      selectedBanks.forEach(bankName => {
        if (bankData[bankName]) {
          filteredBanks[bankName] = bankData[bankName];
        }
      });
    }

    const prices = Object.values(filteredBanks)
      .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
      .map(bank => bank.ask)
      .sort((a, b) => a - b);

    if (prices.length === 0) return null;

    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

    return {
      price: Math.round(median * 100) / 100,
      method: 'consenso',
      banksCount: prices.length,
      source: 'criptoya_banks'
    };
  },

  calculateBankAverage(bankData, selectedBanks = null) {
    let filteredBanks = bankData;
    if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
      filteredBanks = {};
      selectedBanks.forEach(bankName => {
        if (bankData[bankName]) {
          filteredBanks[bankName] = bankData[bankName];
        }
      });
    }

    const prices = Object.values(filteredBanks)
      .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
      .map(bank => bank.ask);

    if (prices.length === 0) return null;

    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return {
      price: Math.round(average * 100) / 100,
      method: 'promedio',
      banksCount: prices.length,
      source: 'criptoya_banks'
    };
  },

  calculateBestBuy(bankData, selectedBanks = null) {
    let filteredBanks = bankData;
    if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
      filteredBanks = {};
      selectedBanks.forEach(bankName => {
        if (bankData[bankName]) {
          filteredBanks[bankName] = bankData[bankName];
        }
      });
    }

    const prices = Object.values(filteredBanks)
      .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
      .map(bank => bank.ask);

    if (prices.length === 0) return null;

    const bestPrice = Math.min(...prices);

    return {
      price: Math.round(bestPrice * 100) / 100,
      method: 'mejor-compra',
      banksCount: prices.length,
      source: 'criptoya_banks'
    };
  },

  calculateBestSell(bankData, selectedBanks = null) {
    let filteredBanks = bankData;
    if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
      filteredBanks = {};
      selectedBanks.forEach(bankName => {
        if (bankData[bankName]) {
          filteredBanks[bankName] = bankData[bankName];
        }
      });
    }

    const prices = Object.values(filteredBanks)
      .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
      .map(bank => bank.ask);

    if (prices.length === 0) return null;

    const bestPrice = Math.max(...prices);

    return {
      price: Math.round(bestPrice * 100) / 100,
      method: 'mejor-venta',
      banksCount: prices.length,
      source: 'criptoya_banks'
    };
  },

  calculateDollarPrice(bankData, method, selectedBanks = null) {
    switch (method) {
      case 'consenso':
        return this.calculateBankConsensus(bankData, selectedBanks);
      case 'promedio':
        return this.calculateBankAverage(bankData, selectedBanks);
      case 'mejor-compra':
        return this.calculateBestBuy(bankData, selectedBanks);
      case 'mejor-venta':
        return this.calculateBestSell(bankData, selectedBanks);
      default:
        if (typeof method === 'string' && method.length > 0 && bankData[method]) {
          const bank = bankData[method];
          if (bank && typeof bank.ask === 'number' && bank.ask > 0) {
            return {
              price: Math.round(bank.ask * 100) / 100,
              method: `solo-${method}`,
              banksCount: 1,
              source: 'criptoya_banks'
            };
          }
        }
        return null;
    }
  }
};

// ============================================
// FUNCIONES DE FETCH PARA BANCOS
// ============================================

/**
 * Fetch datos de USDT/USD desde CriptoYa
 */
async function fetchUSDTtoUSD() {
  try {
    const response = await fetch('https://criptoya.com/api/USDT/USD/1', {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('💰 Datos USDT/USD obtenidos:', Object.keys(data).length, 'exchanges');

    // Procesar datos
    const processedData = {};
    Object.entries(data).forEach(([exchange, info]) => {
      if (info && typeof info === 'object' && (info.ask > 0 || info.bid > 0)) {
        processedData[exchange] = {
          totalBid: info.bid || info.totalBid || 0,
          totalAsk: info.ask || info.totalAsk || 0,
          volume: info.volume || 0
        };
      }
    });

    console.log('💰 USDT/USD procesados:', Object.keys(processedData).length, 'exchanges válidos');
    cachedUsdtUsdData = processedData;
    return processedData;
  } catch (error) {
    log('❌ Error obteniendo USDT/USD:', error);
    return cachedUsdtUsdData || {};
  }
}

/**
 * Fetch datos de USDT/ARS desde CriptoYa
 */
async function fetchUSDT() {
  try {
    const response = await fetch('https://criptoya.com/api/USDT/ARS/1', {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    log('💎 Datos USDT/ARS obtenidos:', Object.keys(data).length, 'exchanges');

    // Procesar datos
    const processedData = {};
    Object.entries(data).forEach(([exchange, info]) => {
      if (info && typeof info === 'object' && (info.ask > 0 || info.bid > 0)) {
        processedData[exchange] = {
          totalBid: info.bid || info.totalBid || 0,
          totalAsk: info.ask || info.totalAsk || 0,
          volume: info.volume || 0
        };
      }
    });

    console.log('💎 USDT/ARS procesados:', Object.keys(processedData).length, 'exchanges válidos');
    cachedUsdtData = processedData;
    return processedData;
  } catch (error) {
    log('❌ Error obteniendo USDT/ARS:', error);
    return cachedUsdtData || {};
  }
}

/**
 * Actualizar todos los datos de bancos
 */
async function updateBanksData() {
  try {
    log('🏦 Actualizando datos de bancos...');

    // Obtener configuración del usuario
    const userSettings = await getUserSettings();

    // Fetch datos en paralelo
    const [dollarTypes, usdtUsdData, usdtData] = await Promise.allSettled([
      fetchAllDollarTypes(userSettings),
      fetchUSDTtoUSD(),
      fetchUSDT()
    ]);

    // Actualizar cache
    cachedDollarTypes = dollarTypes.status === 'fulfilled' ? dollarTypes.value : cachedDollarTypes;
    cachedUsdtUsdData = usdtUsdData.status === 'fulfilled' ? usdtUsdData.value : cachedUsdtUsdData;
    cachedUsdtData = usdtData.status === 'fulfilled' ? usdtData.value : cachedUsdtData;

    lastDataUpdate = new Date();

    log('✅ Datos de bancos actualizados');
  } catch (error) {
    log('❌ Error actualizando datos de bancos:', error);
  }
}

const DEBUG_MODE = false; // PRODUCCIÓN: Desactivado después de diagnosticar problema
// Variables globales para cache de datos de bancos
let cachedDollarTypes = {};
let cachedUsdtUsdData = {};
let cachedUsdtData = {};
let lastDataUpdate = null;

// Variables globales de configuración
let REQUEST_INTERVAL = 100; // ms - OPTIMIZADO v5.0.61: Reducido de 600ms a 100ms
let REQUEST_TIMEOUT = 10000; // ms - valor por defecto
const ENABLE_RATE_LIMIT = false; // NUEVO v5.0.61: Desactivar rate limit por defecto

let lastRequestTime = 0;

function log(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// NUEVO v5.0.54: Función para actualizar configuraciones globales
async function updateGlobalConfig() {
  try {
    const result = await chrome.storage.local.get('notificationSettings');
    const userSettings = result.notificationSettings || {};

    // OPTIMIZADO v5.0.61: Intervalo más rápido para mejor UX
    REQUEST_INTERVAL = Math.max(100, ((userSettings.updateIntervalMinutes || 5) * 60 * 1000) / 50); // Dividido por 50 en lugar de 10
    REQUEST_TIMEOUT = (userSettings.requestTimeoutSeconds || 10) * 1000; // Convertir segundos a ms

    log(
      `⚙️ Configuración global actualizada: intervalo=${REQUEST_INTERVAL}ms, timeout=${REQUEST_TIMEOUT}ms`
    );
  } catch (error) {
    log('⚠️ Error actualizando configuración global:', error);
    // Mantener valores por defecto
    REQUEST_INTERVAL = 600;
    REQUEST_TIMEOUT = 10000;
  }
}

// ============================================
// FUNCIONES DE FETCH INLINE
// ============================================

async function fetchWithRateLimit(url) {
  console.log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - INICIANDO para URL:', url);
  
  // OPTIMIZADO v5.0.61: Rate limit opcional para mejorar performance
  if (ENABLE_RATE_LIMIT) {
    const now = Date.now();
    const delay = REQUEST_INTERVAL - (now - lastRequestTime);
    if (delay > 0) {
      console.log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Rate limit activo, esperando', delay, 'ms');
      await new Promise(r => setTimeout(r, delay));
    }
    lastRequestTime = Date.now();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    console.log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Iniciando fetch, timeout:', REQUEST_TIMEOUT, 'ms');
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Respuesta recibida, status:', res.status, 'ok:', res.ok);

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    
    const json = await res.json();
    console.log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - ✅ JSON parseado exitosamente');
    return json;
  } catch (e) {
    console.error('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - ❌ ERROR en fetch:', url);
    console.error('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Error message:', e.message);
    console.error('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Error name:', e.name);
    console.error('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Error stack:', e.stack);
    console.warn('Fetch error:', url, e.message);
    return null;
  }
}

async function fetchDolarOficial(userSettings) {
  console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - INICIANDO');
  const url = userSettings.criptoyaDolarOficialUrl || 'https://criptoya.com/api/dolar';
  console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - URL:', url);
  
  const data = await fetchWithRateLimit(url);
  console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - Datos recibidos:', data);
  
  if (data && data.oficial) {
    console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - data.oficial.ask:', data.oficial.ask, 'tipo:', typeof data.oficial.ask);
    console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - data.oficial.bid:', data.oficial.bid, 'tipo:', typeof data.oficial.bid);
  }
  
  if (data && data.oficial && typeof data.oficial.ask === 'number' && typeof data.oficial.bid === 'number') {
    // Mapeo correcto según API de CriptoYa:
    // - compra = bid (lo que el usuario RECIBE al vender)
    // - venta = ask (lo que el usuario PAGA al comprar)
    const result = {
      compra: data.oficial.bid,
      venta: data.oficial.ask,
      source: 'criptoya_oficial',
      timestamp: Date.now()
    };
    console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - ✅ Devolviendo datos válidos:', result);
    return result;
  }
  
  console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - ❌ Datos inválidos o nulos, devolviendo NULL');
  return null;
}

async function fetchAllDollarTypes(userSettings) {
  console.log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - INICIANDO');
  const url = userSettings.criptoyaDolarUrl || 'https://criptoya.com/api/bancostodos';
  console.log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - URL:', url);
  log('[BACKGROUND] 🔄 Fetching bancos from:', url);
  console.log('[FETCH] 🔄 Iniciando fetchAllDollarTypes desde:', url);
  
  const data = await fetchWithRateLimit(url);
  console.log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - Datos recibidos:', data);
  console.log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - Tipo de datos:', typeof data);
  
  log(
    '[BACKGROUND] 📊 Bancos data received:',
    data ? Object.keys(data).length + ' bancos' : 'null'
  );
  console.log('[FETCH] 📊 Datos crudos recibidos:', data);
  
  if (data && typeof data === 'object') {
    console.log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - Datos son objeto válido, procesando...');
    // Los datos de CriptoYa ya vienen en formato objeto
    const dollarTypes = {};
    let invalidBanks = [];
    let suspiciousBanks = [];
    let spreads = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (
          value &&
          typeof value === 'object' &&
          (typeof value.bid === 'number' || typeof value.ask === 'number')
        ) {
        const ask = value.ask || value.totalAsk;
        const bid = value.bid || value.totalBid;
        
        // VALIDACIÓN FUNDAMENTAL: ask > bid (spread positivo)
        if (ask <= bid) {
          console.error(`❌ [VALIDACIÓN] ${key}: ask (${ask}) <= bid (${bid}) - CAMPOS INVERTIDOS`);
          console.error(`   Esto es IMPOSIBLE: el banco vende más barato de lo que compra`);
          console.error(`   Spread negativo: ${(bid - ask).toFixed(2)}`);
          invalidBanks.push({ bankCode: key, ask, bid, error: 'Spread negativo - ask debe ser mayor que bid' });
          return; // NO incluir este banco
        }
        
        // Validar spread razonable (0.1% - 5%)
        const spread = ask - bid;
        const spreadPercent = (spread / ask) * 100;
        spreads.push({ bankCode: key, spread, spreadPercent });
        
        if (spreadPercent < 0.1) {
          console.warn(`⚠️ [VALIDACIÓN] ${key}: Spread ${spreadPercent.toFixed(2)}% muy bajo (sospechoso)`);
          suspiciousBanks.push({ bankCode: key, spreadPercent, warning: 'Spread muy bajo - posible error en datos' });
        } else if (spreadPercent > 5) {
          console.warn(`⚠️ [VALIDACIÓN] ${key}: Spread ${spreadPercent.toFixed(2)}% muy alto (sospechoso)`);
          suspiciousBanks.push({ bankCode: key, spreadPercent, warning: 'Spread muy alto - posible error en datos' });
        }
        
        dollarTypes[key] = {
          nombre: key.charAt(0).toUpperCase() + key.slice(1), // Capitalizar nombre
          compra: bid,
          venta: ask,
          source: 'criptoya_bancostodos',
          timestamp: Date.now()
        };
      }
    });
    
    // Loggear resumen de validación
    if (invalidBanks.length > 0) {
      console.error(`❌ [VALIDACIÓN] ${invalidBanks.length} bancos con datos inválidos:`, invalidBanks);
      console.error('   Estos bancos serán excluidos de los cálculos');
    }
    
    if (suspiciousBanks.length > 0) {
      console.warn(`⚠️ [VALIDACIÓN] ${suspiciousBanks.length} bancos con spreads anómalos:`, suspiciousBanks);
    }
    
    const avgSpread = spreads.reduce((sum, s) => sum + s.spreadPercent, 0) / spreads.length;
    console.log(`📊 [VALIDACIÓN] Spread promedio: ${avgSpread.toFixed(2)}%`);
    
    log(
      '[BACKGROUND] 📤 Processed bancos data:',
      Object.keys(dollarTypes).length + ' bancos procesados'
    );
    console.log('[FETCH] 📤 Datos procesados:', Object.keys(dollarTypes).length + ' bancos');
    return dollarTypes;
  }
  log('[BACKGROUND] ❌ No data received from bancos API');
  console.log('[FETCH] ❌ No se pudieron procesar datos de bancos');
  return null;
}

async function fetchUSDTWithSettings(userSettings) {
  const url = userSettings.criptoyaUsdtArsUrl || 'https://criptoya.com/api/USDT/ARS/1';
  log('[BACKGROUND] 🔄 Fetching USDT/ARS from:', url);
  console.log('[FETCH] 🔄 Iniciando fetchUSDT desde:', url);
  const data = await fetchWithRateLimit(url);
  log(
    '[BACKGROUND] 📊 USDT/ARS data received:',
    data ? Object.keys(data).length + ' exchanges' : 'null'
  );
  console.log('[FETCH] 📊 Datos USDT/ARS crudos:', data);
  return data;
}

async function fetchUSDTtoUSDWithSettings(userSettings) {
  const url = userSettings.criptoyaUsdtUsdUrl || 'https://criptoya.com/api/USDT/USD/1';
  log('[BACKGROUND] 🔄 Fetching USDT/USD from:', url);
  console.log('[FETCH] 🔄 Iniciando fetchUSDTtoUSD desde:', url);
  const data = await fetchWithRateLimit(url);
  log(
    '[BACKGROUND] 📊 USDT/USD data received:',
    data ? Object.keys(data).length + ' exchanges' : 'null'
  );
  console.log('[FETCH] 📊 Datos USDT/USD crudos:', data);
  return data;
}

async function fetchUSDT_USD_Brokers(userSettings) {
  const url = userSettings.criptoyaUsdtUsdBrokersUrl || 'https://criptoya.com/api/USDT/USD/1';
  const data = await fetchWithRateLimit(url);
  if (data && typeof data === 'object') {
    return {
      ...data,
      source: 'criptoya_usdt_usd_brokers',
      timestamp: Date.now()
    };
  }
  return null;
}

async function fetchBinanceP2P_USDT_ARS(userSettings) {
  const url = userSettings.binanceP2pUsdtArsUrl || 'https://criptoya.com/api/binancep2p/usdt/ars/1';
  const data = await fetchWithRateLimit(url);
  if (data && typeof data === 'object') {
    return {
      ...data,
      source: 'binance_p2p_usdt_ars',
      timestamp: Date.now()
    };
  }
  return null;
}

async function fetchBinanceP2P_USDT_USD(userSettings) {
  const url = userSettings.binanceP2pUsdtUsdUrl || 'https://criptoya.com/api/binancep2p/usdt/usd/1';
  const data = await fetchWithRateLimit(url);
  if (data && typeof data === 'object') {
    return {
      ...data,
      source: 'binance_p2p_usdt_usd',
      timestamp: Date.now()
    };
  }
  return null;
}

async function fetchBankDollarRates(userSettings) {
  console.log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - INICIANDO');
  const url = userSettings.criptoyaBanksUrl || 'https://criptoya.com/api/bancostodos';
  console.log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - URL:', url);
  
  const data = await fetchWithRateLimit(url);
  console.log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - Datos recibidos:', data);
  console.log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - Tipo de datos:', typeof data);
  
  if (data && typeof data === 'object') {
    const result = {
      ...data,
      source: 'criptoya_banks',
      timestamp: Date.now()
    };
    console.log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - ✅ Devolviendo datos válidos, keys:', Object.keys(data));
    return result;
  }
  
  console.log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - ❌ Datos inválidos o nulos, devolviendo NULL');
  return null;
}

// ============================================
// FUNCIONES DE CÁLCULO ESTADÍSTICO PARA PRECIOS DE BANCOS
// ============================================

// Funciones centralizadas - eliminadas duplicaciones
// Usar BANK_CALCULATIONS.calculateBankConsensus, etc.

// ============================================
// CÁLCULO DE RUTAS INTER-BROKER (entre diferentes exchanges)
// ============================================

async function calculateInterBrokerRoutes(
  oficial,
  usdt,
  usdtUsd,
  userSettings,
  initialAmount,
  applyFees
) {
  log('🔄 [INTER-BROKER] Iniciando cálculo de rutas inter-broker...');

  const routes = [];
  const officialPrice = oficial.venta;

  // NUEVO: Filtrar exchanges según configuración del usuario
  let filteredUsdt = usdt;
  const selectedUsdtBrokers = userSettings.selectedUsdtBrokers;

  // NUEVO: Subdivisión de exchanges P2P por función
  const p2pUsdtArsExchanges = userSettings.p2pUsdtArsExchanges || [];
  const p2pUsdUsdtExchanges = userSettings.p2pUsdUsdtExchanges || [];
  const p2pSyncExchanges = userSettings.p2pSyncExchanges || [];
  
  const disabledP2pUsdtArs = userSettings.disabledP2pUsdtArs || [];
  const disabledP2pUsdUsdt = userSettings.disabledP2pUsdUsdt || [];
  const disabledP2pSync = userSettings.disabledP2pSync || [];

  // Si el usuario seleccionó exchanges específicos, filtrar
  if (selectedUsdtBrokers && Array.isArray(selectedUsdtBrokers) && selectedUsdtBrokers.length > 0) {
    filteredUsdt = {};
    selectedUsdtBrokers.forEach(broker => {
      if (usdt[broker]) {
        filteredUsdt[broker] = usdt[broker];
      }
    });
    log(`🔄 [INTER-BROKER] Filtrando exchanges: ${selectedUsdtBrokers.length} seleccionados`);
  }
  
  // NUEVO: Filtrar exchanges P2P por función (USDT/ARS para paso 3)
  let filteredP2pUsdtArs = filteredUsdt;
  if (p2pUsdtArsExchanges && Array.isArray(p2pUsdtArsExchanges) && p2pUsdtArsExchanges.length > 0) {
    filteredP2pUsdtArs = {};
    p2pUsdtArsExchanges.forEach(exchange => {
      if (filteredUsdt[exchange] && exchange.toLowerCase().includes('p2p')) {
        filteredP2pUsdtArs[exchange] = filteredUsdt[exchange];
      }
    });
    log(`🔄 [INTER-BROKER] Filtrando P2P USDT/ARS: ${p2pUsdtArsExchanges.length} seleccionados`);
  }
  
  // Excluir exchanges P2P desactivados para USDT/ARS
  if (disabledP2pUsdtArs && Array.isArray(disabledP2pUsdtArs) && disabledP2pUsdtArs.length > 0) {
    filteredP2pUsdtArs = Object.entries(filteredP2pUsdtArs)
      .filter(([exchange]) => !disabledP2pUsdtArs.includes(exchange))
      .reduce((acc, [exchange, data]) => {
        acc[exchange] = data;
        return acc;
      }, {});
    log(`🔄 [INTER-BROKER] Excluyendo P2P USDT/ARS desactivados: ${disabledP2pUsdtArs.length}`);
  }
  
  // NUEVO: Filtrar exchanges P2P por función (USD/USDT para paso 2)
  let filteredP2pUsdUsdt = filteredUsdt;
  if (p2pUsdUsdtExchanges && Array.isArray(p2pUsdUsdtExchanges) && p2pUsdUsdtExchanges.length > 0) {
    filteredP2pUsdUsdt = {};
    p2pUsdUsdtExchanges.forEach(exchange => {
      if (filteredUsdt[exchange] && exchange.toLowerCase().includes('p2p')) {
        filteredP2pUsdUsdt[exchange] = filteredUsdt[exchange];
      }
    });
    log(`🔄 [INTER-BROKER] Filtrando P2P USD/USDT: ${p2pUsdUsdtExchanges.length} seleccionados`);
  }
  
  // Excluir exchanges P2P desactivados para USD/USDT
  if (disabledP2pUsdUsdt && Array.isArray(disabledP2pUsdUsdt) && disabledP2pUsdUsdt.length > 0) {
    filteredP2pUsdUsdt = Object.entries(filteredP2pUsdUsdt)
      .filter(([exchange]) => !disabledP2pUsdUsdt.includes(exchange))
      .reduce((acc, [exchange, data]) => {
        acc[exchange] = data;
        return acc;
      }, {});
    log(`🔄 [INTER-BROKER] Excluyendo P2P USD/USDT desactivados: ${disabledP2pUsdUsdt.length}`);
  }
  
  // NUEVO: Sincronizar exchanges P2P seleccionados para ambos pasos
  let filteredP2pSync = filteredUsdt;
  if (p2pSyncExchanges && Array.isArray(p2pSyncExchanges) && p2pSyncExchanges.length > 0) {
    filteredP2pSync = {};
    p2pSyncExchanges.forEach(exchange => {
      if (filteredUsdt[exchange] && exchange.toLowerCase().includes('p2p')) {
        filteredP2pSync[exchange] = filteredUsdt[exchange];
      }
    });
    log(`🔄 [INTER-BROKER] Sincronizando P2P: ${p2pSyncExchanges.length} seleccionados`);
  }
  
  // Excluir exchanges P2P desactivados para sincronización
  if (disabledP2pSync && Array.isArray(disabledP2pSync) && disabledP2pSync.length > 0) {
    filteredP2pSync = Object.entries(filteredP2pSync)
      .filter(([exchange]) => !disabledP2pSync.includes(exchange))
      .reduce((acc, [exchange, data]) => {
        acc[exchange] = data;
        return acc;
      }, {});
    log(`🔄 [INTER-BROKER] Excluyendo P2P sincronización desactivados: ${disabledP2pSync.length}`);
  }
  
  // NUEVO: Combinar todos los exchanges filtrados
  const combinedFilteredUsdt = {
    ...filteredUsdt,
    ...filteredP2pUsdtArs,
    ...filteredP2pUsdUsdt,
    ...filteredP2pSync
  };
  
  // Usar el combinedFilteredUsdt para el cálculo
  filteredUsdt = combinedFilteredUsdt;

  // Obtener exchanges válidos
  const exchanges = Object.keys(filteredUsdt).filter(
    ex =>
      ex !== 'time' &&
      ex !== 'timestamp' &&
      usdt[ex] &&
      typeof usdt[ex] === 'object' &&
      usdt[ex].totalAsk &&
      usdt[ex].totalBid
  );

  log(`🔄 [INTER-BROKER] Exchanges válidos: ${exchanges.length} (${exchanges.join(', ')})`);

  if (exchanges.length < 2) {
    log('⚠️ [INTER-BROKER] Menos de 2 exchanges válidos, saltando cálculo inter-broker');
    return routes;
  }

  let processedCount = 0;
  let skippedCount = 0;

  // Calcular todas las combinaciones posibles entre exchanges diferentes
  for (const buyExchange of exchanges) {
    for (const sellExchange of exchanges) {
      if (buyExchange === sellExchange) continue; // Saltar rutas intra-broker

      processedCount++;

      try {
        const buyData = usdt[buyExchange];
        const sellData = usdt[sellExchange];

        // Validar que ambos exchanges tengan datos válidos
        if (!buyData?.totalAsk || !sellData?.totalBid) {
          skippedCount++;
          continue;
        }

        // PASO 1: ARS → USD (igual para todas las rutas)
        const usdPurchased = initialAmount / officialPrice;

        // PASO 2: Obtener cotización USDT/USD del exchange de COMPRA
        let usdToUsdtRate;
        let usingFallback = false;

        if (usdtUsd?.[buyExchange]?.totalAsk) {
          usdToUsdtRate = usdtUsd[buyExchange].totalAsk;
        } else if (buyData.totalAsk && officialPrice) {
          usdToUsdtRate = buyData.totalAsk / officialPrice;
          usingFallback = true;
        } else {
          skippedCount++;
          continue;
        }

        // PASO 3: USD → USDT en exchange de COMPRA
        const usdtPurchased = usdPurchased / usdToUsdtRate;

        // PASO 4: Aplicar fee de trading en exchange de COMPRA
        let usdtAfterFees = usdtPurchased;
        let tradingFeeAmount = 0;

        if (applyFees) {
          const buyBrokerFeeConfig = userSettings.brokerFees?.find(
            fee => fee.broker.toLowerCase() === buyExchange.toLowerCase()
          );

          let tradingFeePercent = userSettings.extraTradingFee || 0;

          if (buyBrokerFeeConfig) {
            tradingFeePercent = buyBrokerFeeConfig.buyFee || 0;
          }

          if (tradingFeePercent > 0) {
            tradingFeeAmount = usdtPurchased * (tradingFeePercent / 100);
            usdtAfterFees = usdtPurchased - tradingFeeAmount;
          }
        }

        // PASO 5: Vender USDT por ARS en exchange de VENTA
        const sellPrice = sellData.totalBid;
        const arsFromSale = usdtAfterFees * sellPrice;

        // PASO 6: Aplicar fee de venta en exchange de VENTA
        let arsAfterSellFee = arsFromSale;
        let sellFeeAmount = 0;

        if (applyFees) {
          const sellBrokerFeeConfig = userSettings.brokerFees?.find(
            fee => fee.broker.toLowerCase() === sellExchange.toLowerCase()
          );

          if (sellBrokerFeeConfig && sellBrokerFeeConfig.sellFee > 0) {
            const sellFeePercent = sellBrokerFeeConfig.sellFee / 100;
            sellFeeAmount = arsFromSale * sellFeePercent;
            arsAfterSellFee = arsFromSale - sellFeeAmount;
          }
        }

        // PASO 7: Aplicar fees fijos
        let finalAmount = arsAfterSellFee;
        let withdrawalFee = 0;
        let transferFee = 0;
        let bankFee = 0;

        if (applyFees) {
          withdrawalFee = userSettings.extraWithdrawalFee || 0;
          transferFee = userSettings.extraTransferFee || 0;
          bankFee = userSettings.bankCommissionFee || 0;
          const totalFixedFees = withdrawalFee + transferFee + bankFee;
          finalAmount = arsAfterSellFee - totalFixedFees;
        }

        // PASO 8: Calcular ganancia
        const grossProfit = arsFromSale - initialAmount;
        const netProfit = finalAmount - initialAmount;
        const grossPercent = (grossProfit / initialAmount) * 100;
        const netPercent = (netProfit / initialAmount) * 100;

        // Calcular total de fees
        const totalFees =
          tradingFeeAmount * sellPrice + sellFeeAmount + withdrawalFee + transferFee + bankFee;

        // Crear objeto de ruta INTER-BROKER
        const route = {
          broker: `${buyExchange}→${sellExchange}`,
          buyExchange: buyExchange,
          sellExchange: sellExchange,
          isSingleExchange: false,
          requiresP2P:
            buyExchange.toLowerCase().includes('p2p') || sellExchange.toLowerCase().includes('p2p'),
          profitPercent: netPercent,
          profitPercentage: netPercent,
          grossProfitPercent: grossPercent,
          grossProfit: grossProfit,
          officialPrice,
          usdToUsdtRate,
          usdtArsBid: sellPrice,
          calculation: {
            initialAmount: initialAmount,
            usdPurchased,
            usdtPurchased,
            usdtAfterFees,
            arsFromSale,
            arsAfterSellFee,
            finalAmount,
            netProfit,
            grossProfit
          },
          fees: {
            trading: tradingFeeAmount * sellPrice,
            sell: sellFeeAmount,
            withdrawal: withdrawalFee,
            transfer: transferFee,
            bank: bankFee,
            total: totalFees
          },
          config: {
            applyFees,
            tradingFeePercent: userSettings.extraTradingFee || 0,
            brokerSpecificFees: !!userSettings.brokerFees?.find(
              fee =>
                fee.broker.toLowerCase() === buyExchange.toLowerCase() ||
                fee.broker.toLowerCase() === sellExchange.toLowerCase()
            ),
            usdtUsdSource: usdtUsd?.[buyExchange]?.totalAsk ? 'api' : 'calculated',
            usdtUsdWarning: usingFallback ? `Tasa USDT/USD calculada para ${buyExchange}` : null
          }
        };

        routes.push(route);

        log(`✅ [INTER-BROKER] ${buyExchange}→${sellExchange}: ${netPercent.toFixed(2)}%`);
      } catch (error) {
        log(`❌ [INTER-BROKER] Error calculando ${buyExchange}→${sellExchange}:`, error.message);
        skippedCount++;
      }
    }
  }

  log(
    `✅ [INTER-BROKER] Completado: ${processedCount} procesadas, ${skippedCount} saltadas, ${routes.length} rutas generadas`
  );

  return routes;
}

// ============================================
// CÁLCULO DE RUTAS SIMPLIFICADO
// ============================================

async function calculateSimpleRoutes(oficial, usdt, usdtUsd) {
  log('🔍 [CALC] Iniciando cálculo de rutas...');
  log('🔍 [CALC] oficial:', oficial);
  log('🔍 [CALC] usdt:', usdt ? Object.keys(usdt).length + ' exchanges' : 'null');
  log('🔍 [CALC] usdtUsd:', usdtUsd ? Object.keys(usdtUsd).length + ' exchanges' : 'null');

  // DIAGNÓSTICO: Verificar datos de entrada
  console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Datos de entrada:', {
    oficial: oficial ? { compra: oficial.compra, venta: oficial.venta } : null,
    usdtExchanges: usdt ? Object.keys(usdt).filter(k => k !== 'time' && k !== 'timestamp') : [],
    usdtUsdExchanges: usdtUsd ? Object.keys(usdtUsd).filter(k => k !== 'time' && k !== 'timestamp') : []
  });

  if (!oficial || !usdt) {
    console.error('❌ [DIAGNÓSTICO] calculateSimpleRoutes() - Faltan datos básicos:', { oficial: !!oficial, usdt: !!usdt });
    log('❌ [CALC] Faltan datos básicos');
    return [];
  }

  // Obtener configuración del usuario desde storage
  let userSettings = {};
  let initialAmount = 1000000; // Valor por defecto

  try {
    const result = await chrome.storage.local.get('notificationSettings');
    userSettings = result.notificationSettings || {};

    // Leer configuraciones
    initialAmount = userSettings.defaultSimAmount || 1000000;

    log('⚙️ [CALC] Configuración cargada:', {
      initialAmount,
      extraTradingFee: userSettings.extraTradingFee || 0,
      extraWithdrawalFee: userSettings.extraWithdrawalFee || 0,
      extraTransferFee: userSettings.extraTransferFee || 0,
      bankCommissionFee: userSettings.bankCommissionFee || 0,
      fallbackUsdToUsdtRate: userSettings.fallbackUsdToUsdtRate || 1.0,
      applyFeesInCalculation: userSettings.applyFeesInCalculation || false
    });
  } catch (error) {
    log('⚠️ Error leyendo configuración, usando valores por defecto:', error);
  }

  const routes = [];
  const officialPrice = oficial.venta; // CORREGIDO: Usar precio de venta (lo que pagan los usuarios)
  const applyFees = userSettings.applyFeesInCalculation || false; // false por defecto

  log(`🔍 [CALC] Precio oficial USD (venta): $${officialPrice} ARS`);
  log(`🔍 [CALC] Monto inicial: $${initialAmount.toLocaleString()} ARS`);
  log(`🔍 [CALC] Aplicar fees: ${applyFees ? 'SÍ' : 'NO'}`);
  log(`🔍 [CALC] Procesando ${Object.keys(usdt).length} exchanges...`);

  // NUEVO: Filtrar exchanges según configuración del usuario
  let filteredUsdt = usdt;
  const selectedUsdtBrokers = userSettings.selectedUsdtBrokers;

  // DIAGNÓSTICO: Loggear exchanges disponibles en usdt
  const availableExchanges = Object.keys(usdt).filter(k => k !== 'time' && k !== 'timestamp');
  console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Exchanges disponibles en usdt:', availableExchanges);
  console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Exchanges en selectedUsdtBrokers:', selectedUsdtBrokers || []);

  // DIAGNÓSTICO: Loggear filtro de exchanges
  console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Filtro de exchanges:', {
    totalExchanges: availableExchanges.length,
    selectedUsdtBrokers: selectedUsdtBrokers || [],
    hasSelection: !!(selectedUsdtBrokers && Array.isArray(selectedUsdtBrokers) && selectedUsdtBrokers.length > 0)
  });

  // Si el usuario seleccionó exchanges específicos, filtrar
  if (selectedUsdtBrokers && Array.isArray(selectedUsdtBrokers) && selectedUsdtBrokers.length > 0) {
    filteredUsdt = {};
    selectedUsdtBrokers.forEach(broker => {
      if (usdt[broker]) {
        filteredUsdt[broker] = usdt[broker];
      }
    });
    log(`🔍 [CALC] Filtrando exchanges USDT: ${selectedUsdtBrokers.length} seleccionados`);
    
    // DIAGNÓSTICO: Loggear exchanges encontrados y no encontrados
    const foundExchanges = selectedUsdtBrokers.filter(b => usdt[b]);
    const notFoundExchanges = selectedUsdtBrokers.filter(b => !usdt[b]);
    console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Exchanges ENCONTRADOS:', foundExchanges);
    console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Exchanges NO encontrados:', notFoundExchanges);
    
    // DIAGNÓSTICO: Loggear resultado del filtro
    const filteredExchanges = Object.keys(filteredUsdt).filter(k => k !== 'time' && k !== 'timestamp');
    console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Resultado del filtro (filteredUsdt):', filteredExchanges);
    console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Después del filtro:', {
      filteredExchanges: filteredExchanges,
      found: foundExchanges,
      notFound: notFoundExchanges,
      filteredCount: filteredExchanges.length
    });
  }

  // Iterar exchanges
  let processedCount = 0;
  let skippedCount = 0;

  for (const [exchange, data] of Object.entries(filteredUsdt)) {
    // Validación básica
    if (!data || typeof data !== 'object' || !data.totalAsk || !data.totalBid) {
      log(`⚠️ [CALC] Exchange ${exchange} sin datos válidos:`, data);
      skippedCount++;
      continue;
    }
    if (exchange === 'time' || exchange === 'timestamp') {
      skippedCount++;
      continue;
    }

    processedCount++;

    // NUEVO v5.0.58: Buscar configuración de fees del broker UNA SOLA VEZ
    const brokerFees = userSettings.brokerFees || [];
    const brokerFeeConfig = brokerFees.find(
      fee => fee.broker.toLowerCase() === exchange.toLowerCase()
    );

    // ============================================
    // CÁLCULO CORRECTO PASO A PASO
    // ============================================

    // PASO 1: Comprar USD con ARS (oficial)
    const usdPurchased = initialAmount / officialPrice;
    log(
      `💵 [${exchange}] PASO 1: $${initialAmount} ARS / ${officialPrice} = ${usdPurchased.toFixed(4)} USD`
    );

    // PASO 2: Obtener cotización USDT/USD del exchange
    // ✅ CORREGIDO v5.0.62: Fallback inteligente usando precios en ARS
    let usdToUsdtRate;
    let usingFallback = false;

    if (usdtUsd?.[exchange]?.totalAsk) {
      // Caso 1: Tenemos cotización directa de USDT/USD desde API ✅
      usdToUsdtRate = usdtUsd[exchange].totalAsk;
      log(`💱 [${exchange}] PASO 2: Cotización USDT/USD = ${usdToUsdtRate} (desde API CriptoYa)`);
    } else if (data.totalAsk && officialPrice) {
      // Caso 2: Calculamos USDT/USD de forma indirecta usando precios en ARS
      // USDT/USD = USDT_ARS / USD_ARS
      const usdtArsPrice = data.totalAsk; // Precio de compra de USDT en ARS
      const calculatedRate = usdtArsPrice / officialPrice;

      // Validar que el cálculo sea razonable (USDT/USD típicamente entre 0.95 y 1.15)
      if (calculatedRate >= 0.95 && calculatedRate <= 1.15) {
        usdToUsdtRate = calculatedRate;
        usingFallback = true;
        log(`⚠️ [${exchange}] No hay cotización USDT/USD directa en API`);
        log(
          `🧮 [${exchange}] PASO 2: Calculando USDT/USD = ${usdtArsPrice} ARS / ${officialPrice} ARS = ${usdToUsdtRate.toFixed(4)}`
        );
        log(
          `📊 [${exchange}] Tasa calculada: ${usdToUsdtRate.toFixed(4)} (rango válido: 0.95-1.15)`
        );
      } else {
        // El cálculo dio un valor fuera de rango razonable
        log(
          `❌ [${exchange}] SALTANDO: Tasa calculada ${calculatedRate.toFixed(4)} fuera de rango válido (0.95-1.15)`
        );
        log(`   USDT/ARS: ${usdtArsPrice}, USD/ARS: ${officialPrice}`);
        skippedCount++;
        continue; // Saltar este exchange
      }
    } else {
      // Caso 3: No tenemos datos suficientes para calcular
      log(`❌ [${exchange}] SALTANDO: Sin datos para calcular USDT/USD`);
      log('   API USDT/USD: No disponible');
      log('   Fallback calculado: Datos insuficientes (USDT/ARS o USD/ARS faltante)');
      skippedCount++;
      continue; // Saltar este exchange
    }

    // Convertir USD → USDT
    const usdtPurchased = usdPurchased / usdToUsdtRate;
    log(
      `💎 [${exchange}] PASO 2: ${usdPurchased.toFixed(4)} USD / ${usdToUsdtRate.toFixed(4)} = ${usdtPurchased.toFixed(4)} USDT`
    );

    // PASO 3: Aplicar fee de trading (%)
    let usdtAfterFees = usdtPurchased;
    let tradingFeeAmount = 0;

    if (applyFees) {
      // NUEVO v5.0.52: Usar fee específico por broker (ya definido arriba)
      let tradingFeePercent = userSettings.extraTradingFee || 0;

      if (brokerFeeConfig) {
        // Usar fee específico del broker para compra (buyFee)
        tradingFeePercent = brokerFeeConfig.buyFee || 0;
        log(
          `💸 [${exchange}] PASO 3: Usando fee específico del broker: ${tradingFeePercent}% (buy)`
        );
      } else if (userSettings.extraTradingFee) {
        log(`💸 [${exchange}] PASO 3: Usando fee general: ${tradingFeePercent}%`);
      }

      if (tradingFeePercent > 0) {
        tradingFeeAmount = usdtPurchased * (tradingFeePercent / 100);
        usdtAfterFees = usdtPurchased - tradingFeeAmount;
        log(
          `💸 [${exchange}] PASO 3: Fee trading ${tradingFeePercent}% = ${tradingFeeAmount.toFixed(4)} USDT`
        );
        log(`💎 [${exchange}] PASO 3: USDT después de fee = ${usdtAfterFees.toFixed(4)} USDT`);
      }
    }

    // PASO 3.5: Vender USDT por ARS (CORREGIDO v5.0.58)
    const sellPrice = data.totalBid; // Precio de venta USDT/ARS
    const arsFromSale = usdtAfterFees * sellPrice;
    log(
      `💰 [${exchange}] PASO 3.5: Vender ${usdtAfterFees.toFixed(4)} USDT × ${sellPrice} = $${arsFromSale.toFixed(2)} ARS`
    );

    // PASO 4: Aplicar fee de venta específico del broker (si existe)
    let arsAfterSellFee = arsFromSale;
    let sellFeeAmount = 0;

    if (applyFees) {
      // Usar brokerFeeConfig ya definido arriba
      if (brokerFeeConfig && brokerFeeConfig.sellFee > 0) {
        const sellFeePercent = brokerFeeConfig.sellFee / 100;
        sellFeeAmount = arsFromSale * sellFeePercent;
        arsAfterSellFee = arsFromSale - sellFeeAmount;
        log(
          `💸 [${exchange}] PASO 4b: Fee venta específico ${brokerFeeConfig.sellFee}% = $${sellFeeAmount.toFixed(2)} ARS`
        );
        log(
          `💰 [${exchange}] PASO 4b: ARS después de fee venta = $${arsAfterSellFee.toFixed(2)} ARS`
        );
      }
    }

    // PASO 5: Aplicar fees fijos
    let finalAmount = arsAfterSellFee;
    let withdrawalFee = 0;
    let transferFee = 0;
    let bankFee = 0;

    if (applyFees) {
      withdrawalFee = userSettings.extraWithdrawalFee || 0;
      transferFee = userSettings.extraTransferFee || 0;
      bankFee = userSettings.bankCommissionFee || 0;
      const totalFixedFees = withdrawalFee + transferFee + bankFee;
      finalAmount = arsFromSale - totalFixedFees;

      if (totalFixedFees > 0) {
        log(
          `💸 [${exchange}] PASO 5: Fees fijos = $${totalFixedFees} ARS (retiro: $${withdrawalFee}, transfer: $${transferFee}, banco: $${bankFee})`
        );
        log(`💰 [${exchange}] PASO 5: Final = $${finalAmount.toFixed(2)} ARS`);
      }
    }

    // PASO 6: Calcular ganancia
    const grossProfit = arsFromSale - initialAmount;
    const netProfit = finalAmount - initialAmount;
    const grossPercent = (grossProfit / initialAmount) * 100;
    const netPercent = (netProfit / initialAmount) * 100;

    log(
      `📊 [${exchange}] RESULTADO: Ganancia neta = $${netProfit.toFixed(2)} (${netPercent.toFixed(4)}%)`
    );

    // MEJORADO v5.0.64: Removido filtro hardcodeado -10% para permitir que usuario controle desde configuración
    // Ahora el filtro de visualización se controla en popup.js con filterMinProfit (configurable -10% a +20%)

    // Calcular total de fees
    const totalFees =
      tradingFeeAmount * sellPrice + sellFeeAmount + withdrawalFee + transferFee + bankFee;

    // Crear objeto de ruta
    routes.push({
      broker: exchange,
      buyExchange: exchange,
      sellExchange: exchange,
      isSingleExchange: true,
      requiresP2P: exchange.toLowerCase().includes('p2p'),
      profitPercent: netPercent,
      profitPercentage: netPercent,
      grossProfitPercent: grossPercent,
      grossProfit: grossProfit,
      officialPrice,
      usdToUsdtRate,
      usdtArsBid: sellPrice,
      calculation: {
        initialAmount: initialAmount,
        usdPurchased,
        usdtPurchased,
        usdtAfterFees,
        arsFromSale,
        arsAfterSellFee,
        finalAmount,
        netProfit,
        grossProfit
      },
      fees: {
        trading: tradingFeeAmount * sellPrice, // Convertido a ARS
        sell: sellFeeAmount, // Fee de venta específico del broker
        withdrawal: withdrawalFee,
        transfer: transferFee,
        bank: bankFee,
        total: totalFees
      },
      config: {
        applyFees,
        tradingFeePercent: userSettings.extraTradingFee || 0,
        brokerSpecificFees: !!brokerFeeConfig,
        usdtUsdSource: usdtUsd?.[exchange]?.totalAsk ? 'api' : 'calculated',
        usdtUsdWarning: usingFallback
          ? 'Tasa USDT/USD calculada indirectamente. Verificar en CriptoYa.'
          : null
      }
    });
  }

  // ============================================
  // NUEVO: CALCULAR RUTAS INTER-BROKER (entre diferentes exchanges)
  // ============================================

  log('🔄 [CALC] Calculando rutas INTER-BROKER...');
  const interBrokerRoutes = await calculateInterBrokerRoutes(
    oficial,
    usdt,
    usdtUsd,
    userSettings,
    initialAmount,
    applyFees
  );

  // Combinar rutas intra-broker e inter-broker
  routes.push(...interBrokerRoutes);

  // Ordenar TODAS las rutas por rentabilidad neta
  routes.sort((a, b) => b.profitPercent - a.profitPercent);

  // DIAGNÓSTICO: Loggear resultado final del cálculo
  console.log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Resultado final:', {
    totalRoutes: routes.length,
    intraBroker: processedCount,
    interBroker: interBrokerRoutes.length,
    top3Routes: routes.slice(0, 3).map(r => ({
      broker: r.broker,
      profitPercent: r.profitPercent,
      isSingleExchange: r.isSingleExchange
    }))
  });

  log(
    `✅ [CALC] Rutas totales: ${routes.length} (Intra: ${processedCount}, Inter: ${interBrokerRoutes.length})`
  );
  log(`✅ Calculadas ${routes.length} rutas con monto base $${initialAmount.toLocaleString()}`);
  return routes.slice(0, 50);
}

// ============================================
// CÁLCULO DE RUTAS DIRECTAS USDT → ARS
// ============================================

async function calculateDirectUsdtToArsRoutes(usdt, userSettings = {}) {
  log('🔍 [CALC] Calculando rutas directas USDT → ARS...');

  if (!usdt) {
    log('❌ [CALC] No hay datos de USDT disponibles');
    return [];
  }

  const routes = [];
  const initialUsdtAmount = userSettings.defaultUsdtAmount || 1000; // 1000 USDT por defecto

  log(`💎 [CALC] Monto inicial: ${initialUsdtAmount} USDT`);
  log(`🔍 [CALC] Procesando ${Object.keys(usdt).length} exchanges...`);

  for (const [exchange, data] of Object.entries(usdt)) {
    // Validación básica
    if (!data || typeof data !== 'object' || !data.totalBid) {
      log(`⚠️ [CALC] Exchange ${exchange} sin datos válidos para venta`);
      continue;
    }
    if (exchange === 'time' || exchange === 'timestamp') continue;

    // Obtener configuración de fees del broker
    const brokerFees = userSettings.brokerFees || [];
    const brokerFeeConfig = brokerFees.find(
      fee => fee.broker.toLowerCase() === exchange.toLowerCase()
    );

    // PASO 1: Vender USDT directamente por ARS
    const sellPrice = data.totalBid; // Precio de venta USDT/ARS
    const arsFromSale = initialUsdtAmount * sellPrice;

    log(
      `💰 [${exchange}] Venta directa: ${initialUsdtAmount} USDT × ${sellPrice} = $${arsFromSale.toFixed(2)} ARS`
    );

    // PASO 2: Aplicar fee de venta si está configurado
    let arsAfterFee = arsFromSale;
    let sellFeeAmount = 0;

    if (userSettings.applyFeesInCalculation && brokerFeeConfig?.sellFee > 0) {
      const sellFeePercent = brokerFeeConfig.sellFee / 100;
      sellFeeAmount = arsFromSale * sellFeePercent;
      arsAfterFee = arsFromSale - sellFeeAmount;
      log(
        `💸 [${exchange}] Fee venta ${brokerFeeConfig.sellFee}% = $${sellFeeAmount.toFixed(2)} ARS`
      );
    }

    // PASO 3: Aplicar fees fijos si están configurados
    let finalAmount = arsAfterFee;
    let withdrawalFee = 0;
    let transferFee = 0;
    let bankFee = 0;

    if (userSettings.applyFeesInCalculation) {
      withdrawalFee = userSettings.extraWithdrawalFee || 0;
      transferFee = userSettings.extraTransferFee || 0;
      bankFee = userSettings.bankCommissionFee || 0;
      const totalFixedFees = withdrawalFee + transferFee + bankFee;
      finalAmount = arsAfterFee - totalFixedFees;

      if (totalFixedFees > 0) {
        log(`💸 [${exchange}] Fees fijos = $${totalFixedFees} ARS`);
      }
    }

    // Calcular "ganancia" (en realidad es el monto recibido en ARS)
    const profitArs = finalAmount - initialUsdtAmount * sellPrice; // Negativo porque aplicamos fees
    const profitPercent = (profitArs / (initialUsdtAmount * sellPrice)) * 100;

    // Crear objeto de ruta directa
    routes.push({
      broker: exchange,
      routeType: 'direct_usdt_ars',
      description: `Vender ${initialUsdtAmount} USDT por ARS en ${exchange}`,
      isDirectSale: true,
      requiresP2P: exchange.toLowerCase().includes('p2p'),
      profitPercent: profitPercent, // Será negativo si hay fees
      profitPercentage: profitPercent,
      arsReceived: finalAmount,
      usdtSold: initialUsdtAmount,
      exchangeRate: sellPrice,
      calculation: {
        initialUsdtAmount,
        arsFromSale,
        arsAfterFee,
        finalAmount,
        feesApplied: sellFeeAmount + withdrawalFee + transferFee + bankFee
      },
      fees: {
        sell: sellFeeAmount,
        withdrawal: withdrawalFee,
        transfer: transferFee,
        bank: bankFee,
        total: sellFeeAmount + withdrawalFee + transferFee + bankFee
      },
      config: {
        applyFees: userSettings.applyFeesInCalculation || false,
        brokerSpecificFees: !!brokerFeeConfig
      }
    });
  }

  // Ordenar por mejor precio recibido (ARS más altos primero)
  routes.sort((a, b) => b.arsReceived - a.arsReceived);

  log(`✅ [CALC] Calculadas ${routes.length} rutas directas USDT→ARS`);
  return routes.slice(0, 20); // Top 20
}

// ============================================
// CÁLCULO DE RUTAS USD → USDT
// ============================================

async function calculateUsdToUsdtRoutes(oficial, usdt, usdtUsd, userSettings = {}) {
  log('🔍 [CALC] Calculando rutas USD → USDT...');

  if (!oficial || !usdt) {
    log('❌ [CALC] Faltan datos básicos para calcular USD→USDT');
    return [];
  }

  const routes = [];
  const initialUsdAmount = userSettings.defaultUsdAmount || 1000; // 1000 USD por defecto

  log(`💵 [CALC] Monto inicial: ${initialUsdAmount} USD`);
  log(`🔍 [CALC] Procesando ${Object.keys(usdt).length} exchanges...`);

  for (const [exchange, data] of Object.entries(usdt)) {
    // Validación básica
    if (!data || typeof data !== 'object') {
      log(`⚠️ [CALC] Exchange ${exchange} sin datos válidos`);
      continue;
    }
    if (exchange === 'time' || exchange === 'timestamp') continue;

    // Obtener configuración de fees del broker
    const brokerFees = userSettings.brokerFees || [];
    const brokerFeeConfig = brokerFees.find(
      fee => fee.broker.toLowerCase() === exchange.toLowerCase()
    );

    // PASO 1: Calcular tasa USDT/USD
    let usdToUsdtRate;
    let rateSource = 'unknown';

    if (usdtUsd?.[exchange]?.totalAsk) {
      // Caso 1: Cotización directa
      usdToUsdtRate = usdtUsd[exchange].totalAsk;
      rateSource = 'direct_api';
      log(`💱 [${exchange}] Tasa USDT/USD directa: ${usdToUsdtRate}`);
    } else if (data.totalAsk && oficial.venta) {
      // Caso 2: Calcular indirectamente
      const usdtArsPrice = data.totalAsk;
      const calculatedRate = usdtArsPrice / oficial.venta;

      if (calculatedRate >= 0.95 && calculatedRate <= 1.15) {
        usdToUsdtRate = calculatedRate;
        rateSource = 'calculated';
        log(`🧮 [${exchange}] Tasa USDT/USD calculada: ${usdToUsdtRate.toFixed(4)}`);
      } else {
        log(`❌ [${exchange}] Tasa calculada fuera de rango: ${calculatedRate.toFixed(4)}`);
        continue;
      }
    } else {
      log(`❌ [${exchange}] No se puede calcular tasa USDT/USD`);
      continue;
    }

    // PASO 2: Comprar USDT con USD
    const usdtPurchased = initialUsdAmount / usdToUsdtRate;
    log(`💎 [${exchange}] Compra: ${initialUsdAmount} USD → ${usdtPurchased.toFixed(4)} USDT`);

    // PASO 3: Aplicar fee de compra si está configurado
    let usdtAfterFee = usdtPurchased;
    let buyFeeAmount = 0;

    if (userSettings.applyFeesInCalculation && brokerFeeConfig?.buyFee > 0) {
      const buyFeePercent = brokerFeeConfig.buyFee / 100;
      buyFeeAmount = usdtPurchased * buyFeePercent;
      usdtAfterFee = usdtPurchased - buyFeeAmount;
      log(
        `💸 [${exchange}] Fee compra ${brokerFeeConfig.buyFee}% = ${buyFeeAmount.toFixed(4)} USDT`
      );
    }

    // Calcular eficiencia (USDT recibidos por USD invertido)
    const efficiency = usdtAfterFee / initialUsdAmount;

    // Crear objeto de ruta de compra
    routes.push({
      broker: exchange,
      routeType: 'usd_to_usdt',
      description: `Comprar USDT con ${initialUsdAmount} USD en ${exchange}`,
      isPurchaseRoute: true,
      requiresP2P: exchange.toLowerCase().includes('p2p'),
      usdToUsdtRate,
      usdtReceived: usdtAfterFee,
      usdInvested: initialUsdAmount,
      efficiency, // USDT por USD (más alto = mejor)
      exchangeRate: usdToUsdtRate,
      calculation: {
        initialUsdAmount,
        usdToUsdtRate,
        usdtPurchased,
        usdtAfterFee,
        rateSource
      },
      fees: {
        buy: buyFeeAmount,
        total: buyFeeAmount
      },
      config: {
        applyFees: userSettings.applyFeesInCalculation || false,
        brokerSpecificFees: !!brokerFeeConfig,
        rateSource
      }
    });
  }

  // Ordenar por mejor eficiencia (más USDT por USD)
  routes.sort((a, b) => b.efficiency - a.efficiency);

  log(`✅ [CALC] Calculadas ${routes.length} rutas USD→USDT`);
  return routes.slice(0, 20); // Top 20
}

// ============================================
// NUEVO: CÁLCULO DE RUTAS CRYPTO-ARBITRAGE
// ============================================

/**
 * Calcular arbitraje entre criptomonedas en diferentes exchanges
 * Ejemplo: Comprar BTC en Lemon → Transferir → Vender BTC en Binance P2P
 * @param {Object} cryptoData - Datos de criptos indexados por símbolo { 'BTC': {...}, 'ETH': {...} }
 * @param {Object} fiatRef - Precio de referencia fiat (dolar oficial)
 * @param {Object} userSettings - Configuración del usuario
 * @returns {Array} Rutas de arbitraje crypto-to-crypto
 */
async function calculateCryptoArbitrageRoutes(cryptoData, fiatRef, userSettings = {}) {
  log('🔄 [CRYPTO-ARB] Iniciando cálculo de rutas crypto-arbitrage...');

  if (!cryptoData || Object.keys(cryptoData).length === 0) {
    log('❌ [CRYPTO-ARB] No hay datos de criptomonedas disponibles');
    return [];
  }

  const routes = [];
  const initialAmount = userSettings.defaultSimAmount || 1000000; // ARS
  const applyFees = userSettings.applyFeesInCalculation || false;

  log(`💰 [CRYPTO-ARB] Monto inicial: $${initialAmount.toLocaleString()} ARS`);
  log(`⚙️ [CRYPTO-ARB] Aplicar fees: ${applyFees ? 'SÍ' : 'NO'}`);
  log(`💎 [CRYPTO-ARB] Procesando ${Object.keys(cryptoData).length} criptomonedas...`);

  // Procesar cada criptomoneda
  for (const [symbol, data] of Object.entries(cryptoData)) {
    if (!data || typeof data !== 'object') {
      log(`⚠️ [CRYPTO-ARB] ${symbol}: datos inválidos`);
      continue;
    }

    // Filtrar exchanges válidos para esta cripto
    const exchanges = Object.keys(data).filter(
      ex =>
        ex !== 'time' &&
        ex !== 'timestamp' &&
        ex !== 'symbol' &&
        ex !== 'fiatCurrency' &&
        data[ex] &&
        typeof data[ex] === 'object' &&
        data[ex].totalAsk &&
        data[ex].totalBid
    );

    log(
      `💎 [CRYPTO-ARB] ${symbol}: ${exchanges.length} exchanges válidos (${exchanges.join(', ')})`
    );

    if (exchanges.length < 2) {
      log(`⚠️ [CRYPTO-ARB] ${symbol}: Se necesitan al menos 2 exchanges para arbitraje`);
      continue;
    }

    // Calcular todas las combinaciones de arbitraje (compra en A, venta en B)
    for (const buyExchange of exchanges) {
      for (const sellExchange of exchanges) {
        if (buyExchange === sellExchange) continue; // Saltar same-exchange

        try {
          const buyData = data[buyExchange];
          const sellData = data[sellExchange];

          // Validar datos
          if (!buyData?.totalAsk || !sellData?.totalBid) continue;

          // PASO 1: Convertir ARS a cripto en exchange de COMPRA
          const buyPriceARS = buyData.totalAsk; // Precio ask (compra)
          const cryptoPurchased = initialAmount / buyPriceARS;

          // PASO 2: Obtener network fee para transferencia
          let networkFee = 0;
          let networkFeeARS = 0;

          // Usar DataService para obtener network fee
          if (typeof self !== 'undefined' && self.dataService) {
            networkFee = self.dataService.getNetworkFee(buyExchange, symbol);
            networkFeeARS = networkFee * buyPriceARS; // Convertir fee a ARS
          } else {
            // Fallback: usar valores predeterminados
            const defaultFees = {
              BTC: 0.0002,
              ETH: 0.003,
              USDC: 1.0,
              USDT: 1.0,
              DAI: 1.0,
              BNB: 0.001,
              SOL: 0.01,
              ADA: 1.0,
              XRP: 0.25,
              MATIC: 0.1,
              DOGE: 5.0
            };
            networkFee = defaultFees[symbol] || 0;
            networkFeeARS = networkFee * buyPriceARS;
          }

          // PASO 3: Aplicar fees de trading en compra
          let cryptoAfterBuyFee = cryptoPurchased;
          let buyFeeAmount = 0;
          let buyFeeARS = 0;

          if (applyFees) {
            const buyBrokerFeeConfig = userSettings.brokerFees?.find(
              fee => fee.broker.toLowerCase() === buyExchange.toLowerCase()
            );

            const buyFeePercent = buyBrokerFeeConfig?.buyFee || userSettings.extraTradingFee || 0;

            if (buyFeePercent > 0) {
              buyFeeAmount = cryptoPurchased * (buyFeePercent / 100);
              cryptoAfterBuyFee = cryptoPurchased - buyFeeAmount;
              buyFeeARS = buyFeeAmount * buyPriceARS;
            }
          }

          // PASO 4: Restar network fee de la transferencia
          const cryptoAfterNetworkFee = cryptoAfterBuyFee - networkFee;

          if (cryptoAfterNetworkFee <= 0) {
            // Network fee mayor que la cantidad comprada (poco común pero posible)
            continue;
          }

          // PASO 5: Aplicar fees de trading en venta
          const sellPriceARS = sellData.totalBid; // Precio bid (venta)
          const arsFromSale = cryptoAfterNetworkFee * sellPriceARS;

          let arsAfterSellFee = arsFromSale;
          let sellFeeAmount = 0;

          if (applyFees) {
            const sellBrokerFeeConfig = userSettings.brokerFees?.find(
              fee => fee.broker.toLowerCase() === sellExchange.toLowerCase()
            );

            const sellFeePercent = sellBrokerFeeConfig?.sellFee || 0;

            if (sellFeePercent > 0) {
              sellFeeAmount = arsFromSale * (sellFeePercent / 100);
              arsAfterSellFee = arsFromSale - sellFeeAmount;
            }
          }

          // PASO 6: Calcular ganancia
          const finalAmount = arsAfterSellFee;
          const netProfit = finalAmount - initialAmount;
          const netProfitPercent = (netProfit / initialAmount) * 100;
          const grossProfit = arsFromSale - initialAmount;
          const grossProfitPercent = (grossProfit / initialAmount) * 100;

          // PASO 7: Determinar tipo de operación
          const buyIsP2P =
            buyExchange.toLowerCase().includes('p2p') || buyExchange.toLowerCase().includes('peer');
          const sellIsP2P =
            sellExchange.toLowerCase().includes('p2p') ||
            sellExchange.toLowerCase().includes('peer');

          let operationType = 'DIRECT';
          let speed = 'FAST';
          let difficulty = 'EASY';

          if (buyIsP2P || sellIsP2P) {
            operationType = 'P2P';
            speed = 'MEDIUM';
            difficulty = 'HARD';
          } else if (buyExchange !== sellExchange) {
            operationType = 'TRANSFER';
            speed = 'MEDIUM';
            difficulty = 'MEDIUM';
          }

          // PASO 8: Crear objeto de ruta
          const route = {
            crypto: symbol,
            broker: `${buyExchange}→${sellExchange}`,
            buyExchange: buyExchange,
            sellExchange: sellExchange,
            isSingleExchange: false,
            operationType: operationType,
            speed: speed,
            difficulty: difficulty,
            requiresP2P: buyIsP2P || sellIsP2P,
            profitPercent: netProfitPercent,
            profitPercentage: netProfitPercent, // Alias para compatibilidad
            grossProfitPercent: grossProfitPercent,
            grossProfit: grossProfit,
            netProfit: netProfit,
            buyPriceARS: buyPriceARS,
            sellPriceARS: sellPriceARS,
            spread: sellPriceARS - buyPriceARS,
            spreadPercent: ((sellPriceARS - buyPriceARS) / buyPriceARS) * 100,
            calculation: {
              initialAmount: initialAmount,
              cryptoPurchased: cryptoPurchased,
              cryptoAfterBuyFee: cryptoAfterBuyFee,
              networkFee: networkFee,
              networkFeeARS: networkFeeARS,
              cryptoAfterNetworkFee: cryptoAfterNetworkFee,
              arsFromSale: arsFromSale,
              arsAfterSellFee: arsAfterSellFee,
              finalAmount: finalAmount,
              netProfit: netProfit,
              grossProfit: grossProfit
            },
            fees: {
              buy: buyFeeARS,
              sell: sellFeeAmount,
              network: networkFeeARS,
              total: buyFeeARS + sellFeeAmount + networkFeeARS
            },
            config: {
              applyFees: applyFees,
              brokerSpecificFees: !!userSettings.brokerFees?.find(
                fee =>
                  fee.broker.toLowerCase() === buyExchange.toLowerCase() ||
                  fee.broker.toLowerCase() === sellExchange.toLowerCase()
              )
            },
            metadata: {
              symbol: symbol,
              buyVolume: buyData.volume || 0,
              sellVolume: sellData.volume || 0,
              timestamp: Date.now()
            }
          };

          routes.push(route);

          log(
            `✅ [CRYPTO-ARB] ${symbol} ${buyExchange}→${sellExchange}: ${netProfitPercent.toFixed(2)}% (${operationType})`
          );
        } catch (error) {
          log(
            `❌ [CRYPTO-ARB] Error calculando ${symbol} ${buyExchange}→${sellExchange}:`,
            error.message
          );
        }
      }
    }
  }

  // Ordenar por ganancia neta (mejores primero)
  routes.sort((a, b) => b.profitPercent - a.profitPercent);

  log(`✅ [CRYPTO-ARB] Completado: ${routes.length} rutas de arbitraje crypto-to-crypto generadas`);
  log('🏆 [CRYPTO-ARB] Top 3 oportunidades:');
  routes.slice(0, 3).forEach((route, i) => {
    log(
      `   ${i + 1}. ${route.crypto} ${route.broker}: ${route.profitPercent.toFixed(2)}% - $${route.netProfit.toFixed(0)} ARS (${route.operationType})`
    );
  });

  return routes;
}

// ============================================
// FUNCIÓN PRINCIPAL UNIFICADA DE CÁLCULO
// ============================================

async function calculateAllRoutes(oficial, usdt, usdtUsd, userSettings = {}) {
  log('🚀 [CALC] Iniciando cálculo unificado de todas las rutas...');

  const routeType = userSettings.routeType || 'arbitrage'; // 'arbitrage', 'direct_usdt_ars', 'usd_to_usdt', 'all'

  const results = {
    arbitrage: [],
    directUsdtArs: [],
    usdToUsdt: [],
    timestamp: Date.now()
  };

  // Calcular rutas según el tipo solicitado
  if (routeType === 'arbitrage' || routeType === 'all') {
    log('🔄 Calculando rutas de arbitraje ARS→USD→USDT→ARS...');
    results.arbitrage = await calculateSimpleRoutes(oficial, usdt, usdtUsd);
  }

  if (routeType === 'direct_usdt_ars' || routeType === 'all') {
    log('🔄 Calculando rutas directas USDT→ARS...');
    results.directUsdtArs = await calculateDirectUsdtToArsRoutes(usdt, userSettings);
  }

  if (routeType === 'usd_to_usdt' || routeType === 'all') {
    log('🔄 Calculando rutas USD→USDT...');
    results.usdToUsdt = await calculateUsdToUsdtRoutes(oficial, usdt, usdtUsd, userSettings);
  }

  log('✅ [CALC] Cálculo completado:', {
    arbitrage: results.arbitrage.length,
    directUsdtArs: results.directUsdtArs.length,
    usdToUsdt: results.usdToUsdt.length
  });

  // Combinar todas las rutas si se pidió 'all', manteniendo el tipo identificado
  if (routeType === 'all') {
    const allRoutes = [
      ...results.arbitrage.map(r => ({ ...r, routeCategory: 'arbitrage' })),
      ...results.directUsdtArs.map(r => ({ ...r, routeCategory: 'direct_usdt_ars' })),
      ...results.usdToUsdt.map(r => ({ ...r, routeCategory: 'usd_to_usdt' }))
    ];

    // Para rutas combinadas, ordenar por relevancia según el tipo
    allRoutes.sort((a, b) => {
      if (a.routeCategory === 'arbitrage' && b.routeCategory !== 'arbitrage') return -1;
      if (b.routeCategory === 'arbitrage' && a.routeCategory !== 'arbitrage') return 1;

      // Dentro de cada categoría, ordenar por rentabilidad
      if (a.routeCategory === b.routeCategory) {
        return (b.profitPercent || b.efficiency || 0) - (a.profitPercent || a.efficiency || 0);
      }

      return 0;
    });

    return allRoutes.slice(0, 50);
  }

  // Si se pidió un tipo específico, devolver solo ese
  return (
    results[
      routeType.replace('direct_usdt_ars', 'directUsdtArs').replace('usd_to_usdt', 'usdToUsdt')
    ] || []
  );
}

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

let lastNotificationTime = 0;
const notifiedArbitrages = new Set(); // Para evitar notificar el mismo arbitraje repetidamente

async function shouldSendNotification(settings, arbitrage) {
  // 1. Verificar si las notificaciones están habilitadas
  if (!settings.notificationsEnabled) {
    console.log('[NOTIF] ❌ Notificaciones deshabilitadas');
    return false;
  }

  // 2. Verificar horario silencioso
  if (settings.quietHoursEnabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = settings.quietStart || '22:00';
    const end = settings.quietEnd || '08:00';

    // Si el horario atraviesa medianoche (ej: 22:00 - 08:00)
    if (start > end) {
      if (currentTime >= start || currentTime <= end) {
        console.log('[NOTIF] ❌ Horario silencioso activo');
        return false;
      }
    } else {
      if (currentTime >= start && currentTime <= end) {
        console.log('[NOTIF] ❌ Horario silencioso activo');
        return false;
      }
    }
  }

  // 3. Verificar frecuencia de notificaciones
  const now = Date.now();
  const frequencies = {
    always: 0,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    once: Infinity
  };

  const minInterval = frequencies[settings.notificationFrequency] || frequencies['15min'];
  if (now - lastNotificationTime < minInterval) {
    console.log(
      `[NOTIF] ❌ Intervalo mínimo no cumplido (${Math.round((minInterval - (now - lastNotificationTime)) / 1000)}s restantes)`
    );
    return false;
  }

  // 4. Verificar umbral de ganancia usando alertThreshold (configurado en options)
  // CORREGIDO: Usar alertThreshold directamente en lugar del sistema de tipos
  const threshold = settings.alertThreshold ?? 1.0;

  if (arbitrage.profitPercent < threshold) {
    console.log(
      `[NOTIF] ❌ Ganancia ${arbitrage.profitPercent.toFixed(2)}% < umbral ${threshold}%`
    );
    return false;
  }

  // 5. Verificar si es un exchange habilitado para notificaciones
  // CORREGIDO: Usar notificationExchanges (configurado en options) en lugar de preferredExchanges
  const allowedExchanges = settings.notificationExchanges || settings.preferredExchanges || [];
  if (allowedExchanges.length > 0) {
    const exchangeName = (arbitrage.broker || arbitrage.exchange || '').toLowerCase();
    const isAllowed = allowedExchanges.some(
      allowed =>
        exchangeName.includes(allowed.toLowerCase()) || allowed.toLowerCase().includes(exchangeName)
    );
    if (!isAllowed) {
      console.log(`[NOTIF] ❌ Exchange ${exchangeName} no está en la lista de notificaciones`);
      return false;
    }
  }

  // 6. Verificar si ya notificamos este arbitraje recientemente
  const arbKey = `${arbitrage.broker}_${Math.floor(arbitrage.profitPercent)}`; // Redondear para evitar spam
  if (notifiedArbitrages.has(arbKey)) {
    console.log(`[NOTIF] ❌ Arbitraje ya notificado recientemente: ${arbKey}`);
    return false;
  }

  console.log(
    `[NOTIF] ✅ Notificación aprobada: ${arbitrage.broker} ${arbitrage.profitPercent.toFixed(2)}%`
  );
  return true;
}

async function sendNotification(arbitrage, settings) {
  try {
    const notificationId = `arbitrage_${Date.now()}`;
    const broker = arbitrage.broker || arbitrage.exchange || 'Exchange';
    const profit = arbitrage.profitPercent || 0;

    // Determinar el ícono según la ganancia
    const iconLevel =
      profit >= 15 ? 'extreme' : profit >= 10 ? 'high' : profit >= 5 ? 'moderate' : 'normal';

    const icons = {
      extreme: '🚀',
      high: '💎',
      moderate: '💰',
      normal: '📊'
    };

    const icon = icons[iconLevel];

    // Construir mensaje con datos disponibles
    let message = `Ganancia: ${profit.toFixed(2)}% neto`;
    if (arbitrage.usdToUsdtRate) {
      message += `\nUSD→USDT: ${arbitrage.usdToUsdtRate}`;
    }
    if (arbitrage.usdtArsBid) {
      message += `\nUSDT: $${arbitrage.usdtArsBid.toFixed(2)} ARS`;
    }

    console.log(`[NOTIF] 🔔 Enviando notificación: ${broker} - ${profit.toFixed(2)}%`);

    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `${icon} Arbitraje: ${broker} +${profit.toFixed(2)}%`,
      message: message,
      priority: profit >= 10 ? 2 : 1,
      requireInteraction: profit >= 15
    });

    // Actualizar tiempo de última notificación
    lastNotificationTime = Date.now();

    // Agregar a notificados (limpiar después de 1 hora)
    const arbKey = `${arbitrage.broker}_${arbitrage.profitPercent.toFixed(2)}`;
    notifiedArbitrages.add(arbKey);
    setTimeout(
      () => {
        notifiedArbitrages.delete(arbKey);
      },
      60 * 60 * 1000
    ); // 1 hora

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

// Verificar y enviar notificaciones después de actualizar datos
async function checkAndNotify(arbitrages) {
  try {
    // NUEVO: No enviar notificaciones en la primera actualización (inicialización)
    if (isFirstUpdate) {
      console.log('[NOTIF] ⏭️ Saltando notificación en inicialización (isFirstUpdate = true)');
      return;
    }

    const result = await chrome.storage.local.get('notificationSettings');
    const settings = result.notificationSettings || {
      notificationsEnabled: true,
      alertThreshold: 1.0, // CORREGIDO: Usar alertThreshold
      notificationFrequency: '15min',
      soundEnabled: true,
      notificationExchanges: [], // CORREGIDO: Usar notificationExchanges
      quietHoursEnabled: false,
      quietStart: '22:00',
      quietEnd: '08:00'
    };

    console.log('[NOTIF] 🔍 Verificando notificaciones...', {
      enabled: settings.notificationsEnabled,
      threshold: settings.alertThreshold,
      frequency: settings.notificationFrequency,
      exchangesCount: settings.notificationExchanges?.length || 0
    });

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

// ============================================
// ESTADO GLOBAL
// ============================================

let currentData = null;
let lastUpdate = null;
let isFirstUpdate = true; // NUEVO: Bandera para evitar notificaciones en inicialización

// ============================================
// ACTUALIZACIÓN DE DATOS
// ============================================

async function updateData() {
  console.log('🔍 [DIAGNÓSTICO] updateData() - INICIANDO función de actualización de datos');
  log('� Actualizando datos...');

  try {
    // NUEVO v5.0.48: Leer configuración del usuario ANTES de obtener datos
    const settingsResult = await chrome.storage.local.get('notificationSettings');
    const userSettings = settingsResult.notificationSettings || {};
    
    // DIAGNÓSTICO: Loggear configuración leída
    console.log('🔍 [DIAGNÓSTICO] updateData() - Configuración leída:', {
      dollarPriceSource: userSettings.dollarPriceSource,
      manualDollarPrice: userSettings.manualDollarPrice,
      preferredBank: userSettings.preferredBank,
      selectedBanks: userSettings.selectedBanks,
      selectedUsdtBrokers: userSettings.selectedUsdtBrokers,
      routeType: userSettings.routeType
    });

    log('⚙️ [BACKGROUND] Configuración LEÍDA desde storage:', {
      dollarPriceSource: userSettings.dollarPriceSource,
      manualDollarPrice: userSettings.manualDollarPrice,
      preferredBank: userSettings.preferredBank,
      selectedBanks: userSettings.selectedBanks,
      timestamp: new Date().toISOString()
    });

    // Decidir cómo obtener el precio del dólar oficial
    let oficial;
    console.log('🔍 [DIAGNÓSTICO] updateData() - Decidiendo método para obtener dólar oficial...');
    console.log('🔍 [DIAGNÓSTICO] dollarPriceSource:', userSettings.dollarPriceSource);
    console.log('🔍 [DIAGNÓSTICO] preferredBank:', userSettings.preferredBank);
    
    if (userSettings.dollarPriceSource === 'manual') {
      // Usar precio manual configurado por el usuario
      console.log('🔍 [DIAGNÓSTICO] Rama: MODO MANUAL');
      const manualPrice = userSettings.manualDollarPrice || 1400;
      log(`💵 [BACKGROUND] MODO MANUAL: Usando precio manual: $${manualPrice}`);
      oficial = {
        compra: manualPrice,
        venta: manualPrice,
        source: 'manual',
        timestamp: Date.now()
      };
      log('✅ [BACKGROUND] Oficial MANUAL creado:', oficial);
      console.log('🔍 [DIAGNÓSTICO] Oficial MANUAL creado exitosamente:', oficial);
    } else {
      // Usar API automática - verificar si usar método de bancos
      const bankMethod = userSettings.preferredBank;
      console.log('🔍 [DIAGNÓSTICO] Rama: MODO AUTO (dollarPriceSource !== "manual")');
      console.log('🔍 [DIAGNÓSTICO] bankMethod:', bankMethod);
      console.log('🔍 [DIAGNÓSTICO] ¿bankMethod existe y es diferente de "oficial"?:', !!(bankMethod && bankMethod !== 'oficial'));

      if (bankMethod && bankMethod !== 'oficial') {
        // Usar método estadístico de bancos
        console.log('🔍 [DIAGNÓSTICO] Rama: MÉTODO DE BANCOS (bankMethod:', bankMethod, ')');
        log(`🏦 Obteniendo precio usando método: ${bankMethod}`);

        // Obtener datos de bancos y calcular precio según método
        console.log('🔍 [DIAGNÓSTICO] Llamando fetchBankDollarRates()...');
        const bankData = await fetchBankDollarRates(userSettings);
        console.log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() devolvió:', bankData ? 'DATOS' : 'NULL');
        console.log('🔍 [DIAGNÓSTICO] bankData keys:', bankData ? Object.keys(bankData) : 'null');
        
        const selectedBanks =
          userSettings.selectedBanks && userSettings.selectedBanks.length > 0
            ? userSettings.selectedBanks
            : ['bna', 'galicia', 'santander', 'bbva', 'icbc']; // Bancos principales por defecto

        log(`🏦 Usando ${selectedBanks.length} bancos para cálculo:`, selectedBanks);
        console.log('🔍 [DIAGNÓSTICO] selectedBanks:', selectedBanks);

        if (bankData) {
          console.log('🔍 [DIAGNÓSTICO] bankData existe, calculando precio con método:', bankMethod);
          const calculatedPrice = BANK_CALCULATIONS.calculateDollarPrice(
            bankData,
            bankMethod,
            selectedBanks
          );
          console.log('🔍 [DIAGNÓSTICO] calculatedPrice:', calculatedPrice);

          if (calculatedPrice) {
            log(
              `💵 Precio calculado (${calculatedPrice.method}): $${calculatedPrice.price} (${calculatedPrice.banksCount} bancos)`
            );
            oficial = {
              compra: calculatedPrice.price,
              venta: calculatedPrice.price,
              source: calculatedPrice.source,
              method: calculatedPrice.method,
              banksCount: calculatedPrice.banksCount,
              timestamp: Date.now()
            };
            console.log('🔍 [DIAGNÓSTICO] Oficial desde BANCOS creado exitosamente:', oficial);
          } else {
            console.log('🔍 [DIAGNÓSTICO] ❌ ERROR: calculatedPrice es NULL');
            log(
              '⚠️ [BACKGROUND] No se pudo calcular precio de bancos, intentando API oficial como fallback...'
            );
            log('   selectedBanks:', selectedBanks);
            log('   bankData keys:', bankData ? Object.keys(bankData) : 'null');
            
            // ⭐ NUEVO: Intentar API oficial como fallback antes de usar manual
            console.log('🔍 [DIAGNÓSTICO] Llamando fetchDolarOficial() como fallback...');
            oficial = await fetchDolarOficial(userSettings);
            console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() fallback devolvió:', oficial ? 'DATOS' : 'NULL');
            
            if (!oficial) {
              console.log('🔍 [DIAGNÓSTICO] ❌ API oficial también falló, usando manual como último fallback');
              const manualPrice = userSettings.manualDollarPrice || 1400;
              oficial = {
                compra: manualPrice,
                venta: manualPrice,
                source: 'manual_fallback',
                timestamp: Date.now()
              };
              log('⚠️ [BACKGROUND] Oficial MANUAL_FALLBACK creado:', oficial);
              console.log('🔍 [DIAGNÓSTICO] ⚠️ Oficial MANUAL_FALLBACK creado (porque API oficial también falló)');
            } else {
              log('✅ [BACKGROUND] Oficial desde API OFICIAL (fallback) creado:', oficial);
              console.log('🔍 [DIAGNÓSTICO] ✅ Oficial desde API OFICIAL (fallback) creado exitosamente:', oficial);
            }
          }
        } else {
          console.log('🔍 [DIAGNÓSTICO] ❌ ERROR: bankData es NULL');
          log(
            '⚠️ [BACKGROUND] No se pudieron obtener datos de bancos, intentando API oficial como fallback...'
          );
          
          // ⭐ NUEVO: Intentar API oficial como fallback antes de usar manual
          console.log('🔍 [DIAGNÓSTICO] Llamando fetchDolarOficial() como fallback...');
          oficial = await fetchDolarOficial(userSettings);
          console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() fallback devolvió:', oficial ? 'DATOS' : 'NULL');
          
          if (!oficial) {
            console.log('🔍 [DIAGNÓSTICO] ❌ API oficial también falló, usando manual como último fallback');
            const manualPrice = userSettings.manualDollarPrice || 1400;
            oficial = {
              compra: manualPrice,
              venta: manualPrice,
              source: 'manual_fallback',
              timestamp: Date.now()
            };
            log('⚠️ [BACKGROUND] Oficial MANUAL_FALLBACK creado:', oficial);
            console.log('🔍 [DIAGNÓSTICO] ⚠️ Oficial MANUAL_FALLBACK creado (porque API oficial también falló)');
          } else {
            log('✅ [BACKGROUND] Oficial desde API OFICIAL (fallback) creado:', oficial);
            console.log('🔍 [DIAGNÓSTICO] ✅ Oficial desde API OFICIAL (fallback) creado exitosamente:', oficial);
          }
        }
      } else {
        // Usar precio oficial estándar
        console.log('🔍 [DIAGNÓSTICO] Rama: PRECIO OFICIAL ESTÁNDAR (DolarAPI)');
        log('🌐 Obteniendo precio oficial desde DolarAPI...');
        oficial = await fetchDolarOficial(userSettings);
        console.log('🔍 [DIAGNÓSTICO] fetchDolarOficial() devolvió:', oficial ? 'DATOS' : 'NULL');
        console.log('🔍 [DIAGNÓSTICO] oficial:', oficial);
      }
    }

    // Obtener precios de USDT en paralelo
    const [usdt, usdtUsd] = await Promise.all([
      fetchUSDT(userSettings),
      fetchUSDTtoUSD(userSettings)
    ]);

    log('📊 Datos obtenidos:', { oficial: !!oficial, usdt: !!usdt, usdtUsd: !!usdtUsd });

    // DIAGNÓSTICO: Loggear detalles de datos obtenidos
    console.log('🔍 [DIAGNÓSTICO] updateData() - Datos obtenidos:', {
      oficial: oficial ? { compra: oficial.compra, venta: oficial.venta, source: oficial.source } : null,
      usdt: usdt ? Object.keys(usdt).length + ' exchanges' : null,
      usdtUsd: usdtUsd ? Object.keys(usdtUsd).length + ' exchanges' : null
    });

    if (!oficial || !usdt) {
      console.error('❌ [DIAGNÓSTICO] updateData() - Faltan datos básicos:', { oficial: !!oficial, usdt: !!usdt });
      log('❌ Faltan datos básicos');
      return null;
    }

    // CORREGIDO v5.0.47: Usar await porque calculateAllRoutes es async
    // MEJORADO v5.0.75: Calcular todos los tipos de rutas según configuración
    const routeType = userSettings.routeType || 'arbitrage'; // 'arbitrage', 'direct_usdt_ars', 'usd_to_usdt', 'all'
    const optimizedRoutes = await calculateAllRoutes(oficial, usdt, usdtUsd, {
      ...userSettings,
      routeType
    });

    // DIAGNÓSTICO: Loggear resultado del cálculo
    console.log('🔍 [DIAGNÓSTICO] updateData() - Rutas calculadas:', {
      routeType: userSettings.routeType || 'arbitrage',
      totalRoutes: optimizedRoutes.length,
      firstRoute: optimizedRoutes[0] ? {
        broker: optimizedRoutes[0].broker,
        profitPercent: optimizedRoutes[0].profitPercent
      } : null
    });

    log(`✅ Datos actualizados: ${optimizedRoutes.length} rutas`);

    const data = {
      oficial,
      usdt,
      usdtUsd,
      optimizedRoutes,
      arbitrages: optimizedRoutes,
      lastUpdate: Date.now(),
      error: null,
      usingCache: false
    };

    currentData = data;
    lastUpdate = data.lastUpdate;

    // NUEVO: Verificar y enviar notificaciones si hay oportunidades rentables
    if (routeType === 'arbitrage' || routeType === 'all') {
      const arbitrageRoutes =
        routeType === 'all'
          ? optimizedRoutes.filter(r => r.routeCategory === 'arbitrage')
          : optimizedRoutes;
      await checkAndNotify(arbitrageRoutes);
    }

    // NUEVO: Marcar que ya no es la primera actualización
    isFirstUpdate = false;

    // DIAGNÓSTICO FINAL: Verificar estado de oficial antes de retornar
    console.log('🔍 [DIAGNÓSTICO] updateData() - VERIFICACIÓN FINAL:', {
      oficialIsNull: oficial === null,
      oficialExists: !!oficial,
      oficialCompra: oficial?.compra,
      oficialVenta: oficial?.venta,
      oficialSource: oficial?.source,
      oficialMethod: oficial?.method,
      configuracionFinal: {
        dollarPriceSource: userSettings.dollarPriceSource,
        manualDollarPrice: userSettings.manualDollarPrice,
        preferredBank: userSettings.preferredBank
      }
    });

    if (!oficial) {
      console.error('🔍 [DIAGNÓSTICO] ❌ CRÍTICO: oficial es NULL al final de updateData()');
      console.error('🔍 [DIAGNÓSTICO] Esto significa que NO se pudo obtener precio del dólar oficial');
      console.error('🔍 [DIAGNÓSTICO] Configuración actual:', {
        dollarPriceSource: userSettings.dollarPriceSource,
        preferredBank: userSettings.preferredBank,
        manualDollarPrice: userSettings.manualDollarPrice
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Error en updateData:', error);
    return {
      error: error.message,
      optimizedRoutes: [],
      arbitrages: [],
      lastUpdate: lastUpdate
    };
  }
}

// ============================================
// LISTENER DE MENSAJES
// ============================================

log('[BACKGROUND] Registrando listener...');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('[BACKGROUND] Mensaje recibido:', request.action);

  if (request.action === 'getArbitrages') {
    log('[BACKGROUND] 📥 Mensaje getArbitrages recibido');
    
    // DIAGNÓSTICO: Loggear recepción del mensaje
    console.log('🔍 [DIAGNÓSTICO] getArbitrages - Mensaje recibido:', {
      hasCurrentData: !!currentData,
      currentDataKeys: currentData ? Object.keys(currentData) : [],
      optimizedRoutesCount: currentData?.optimizedRoutes?.length || 0,
      oficial: currentData?.oficial ? { compra: currentData.oficial.compra, venta: currentData.oficial.venta } : null
    });

    // Si hay datos en cache, devolverlos inmediatamente
    if (currentData) {
      log('[BACKGROUND] 📤 Enviando datos CACHEADOS al popup:', {
        oficialCompra: currentData.oficial?.compra,
        oficialSource: currentData.oficial?.source,
        rutasCount: currentData.optimizedRoutes?.length || 0,
        lastUpdate: new Date(currentData.lastUpdate).toLocaleString()
      });
      sendResponse(currentData);
      return false; // CORREGIDO: Respuesta síncrona, no mantener canal
    } else {
      // DIAGNÓSTICO: Loggear que no hay datos en cache
      console.log('🔍 [DIAGNÓSTICO] getArbitrages - No hay datos en cache, actualizando...');
      
      // Actualizar datos de forma asíncrona
      updateData()
        .then(data => {
          // DIAGNÓSTICO: Loggear resultado de actualización
          console.log('🔍 [DIAGNÓSTICO] getArbitrages - Datos frescos obtenidos:', {
            hasData: !!data,
            hasOficial: !!data?.oficial,
            oficialCompra: data?.oficial?.compra,
            oficialSource: data?.oficial?.source,
            rutasCount: data?.optimizedRoutes?.length || 0,
            hasError: !!data?.error,
            error: data?.error
          });
          
          log('[BACKGROUND] 📤 Enviando datos FRESCOS al popup:', {
            oficialCompra: data?.oficial?.compra,
            oficialSource: data?.oficial?.source,
            rutasCount: data?.optimizedRoutes?.length || 0,
            lastUpdate: new Date(data?.lastUpdate).toLocaleString()
          });
          sendResponse(
            data || {
              error: 'Error obteniendo datos',
              optimizedRoutes: [],
              arbitrages: []
            }
          );
        })
        .catch(error => {
          console.error('❌ [BACKGROUND] Error:', error);
          sendResponse({
            error: error.message,
            optimizedRoutes: [],
            arbitrages: []
          });
        });
      return true; // CORRECTO: Mantener canal abierto para respuesta asíncrona
    }
  }

  if (request.action === 'refresh') {
    updateData().then(data => {
      sendResponse(data || { optimizedRoutes: [], arbitrages: [] });
    });
    return true; // CORRECTO: Respuesta asíncrona
  }

  // NUEVO: Manejar actualización de configuración
  if (request.action === 'settingsUpdated') {
    log('[BACKGROUND] 📥 Recibido mensaje settingsUpdated');
    log('[BACKGROUND] Configuración NUEVA recibida:', {
      dollarPriceSource: request.settings?.dollarPriceSource,
      manualDollarPrice: request.settings?.manualDollarPrice,
      timestamp: new Date().toISOString()
    });

    // Limpiar cache para forzar recálculo con nueva configuración
    currentData = null;
    log('[BACKGROUND] 🗑️ Cache limpiada (currentData = null)');

    // Actualizar configuración del usuario
    userSettings = request.settings;
    log('[BACKGROUND] 👤 userSettings actualizada con nueva configuración');

    // NUEVO: Restablecer isFirstUpdate para evitar notificaciones al cambiar configuración
    isFirstUpdate = false; // Mantener false para permitir notificaciones después de cambiar configuración

    // Forzar recálculo de datos con nueva configuración
    updateData()
      .then(data => {
        log('[BACKGROUND] ✅ Datos recalculados exitosamente');
        log('[BACKGROUND] 📊 Nuevo oficial generado:', {
          compra: data?.oficial?.compra,
          source: data?.oficial?.source,
          timestamp: new Date(data?.oficial?.timestamp).toISOString()
        });
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('[BACKGROUND] ❌ Error recalculando datos:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Respuesta asíncrona
  }

  // NUEVO v5.0.46: Manejar mensajes no implementados
  if (request.action === 'getBankRates' || request.action === 'recalculateWithCustomPrice') {
    log('[BACKGROUND] Acción no implementada en versión simplificada:', request.action);
    sendResponse({
      error: 'Función no disponible en esta versión',
      message: 'Esta funcionalidad requiere la versión modular del background'
    });
    return false; // Respuesta síncrona
  }

  // NUEVO: Handler para obtener datos de bancos y tipos de dólar
  if (request.action === 'getBanksData') {
    log('[BACKGROUND] 📥 Mensaje getBanksData recibido');

    // Obtener configuración del usuario
    chrome.storage.local
      .get('notificationSettings')
      .then(result => {
        const userSettings = result.notificationSettings || {};

        // Obtener datos en paralelo
        Promise.all([
          fetchBankDollarRates(userSettings),
          fetchAllDollarTypes(userSettings),
          fetchUSDT(userSettings),
          fetchUSDTtoUSD(userSettings),
          fetchUSDT_USD_Brokers(userSettings),
          fetchBinanceP2P_USDT_ARS(userSettings),
          fetchBinanceP2P_USDT_USD(userSettings)
        ])
          .then(
            ([
              banksData,
              dollarTypes,
              usdtData,
              usdtUsdData,
              usdtUsdBrokers,
              binanceP2PArs,
              binanceP2PUsd
            ]) => {
              log('[BACKGROUND] 📤 Enviando datos de bancos y dólar:', {
                banksCount: banksData
                  ? Object.keys(banksData).filter(key => key !== 'source' && key !== 'timestamp')
                      .length
                  : 0,
                dollarTypesCount: dollarTypes ? Object.keys(dollarTypes).length : 0,
                usdtExchanges: usdtData
                  ? Object.keys(usdtData).filter(key => key !== 'source' && key !== 'timestamp')
                      .length
                  : 0,
                usdtUsdExchanges: usdtUsdData
                  ? Object.keys(usdtUsdData).filter(key => key !== 'source' && key !== 'timestamp')
                      .length
                  : 0,
                usdtUsdBrokers: usdtUsdBrokers
                  ? Object.keys(usdtUsdBrokers).filter(
                      key => key !== 'source' && key !== 'timestamp'
                    ).length
                  : 0,
                binanceP2P_ARS: binanceP2PArs ? 'disponible' : 'null',
                binanceP2P_USD: binanceP2PUsd ? 'disponible' : 'null'
              });

              sendResponse({
                success: true,
                data: {
                  banksData: banksData || {},
                  dollarTypes: dollarTypes || {},
                  usdtData: usdtData || {},
                  usdtUsdData: usdtUsdData || {},
                  usdtUsdBrokers: usdtUsdBrokers || {},
                  binanceP2PArs: binanceP2PArs || {},
                  binanceP2PUsd: binanceP2PUsd || {}
                }
              });
            }
          )
          .catch(error => {
            console.error('[BACKGROUND] ❌ Error obteniendo datos de bancos:', error);
            sendResponse({
              success: false,
              error: error.message,
              data: {
                banksData: {},
                dollarTypes: {},
                usdtData: {},
                usdtUsdData: {},
                usdtUsdBrokers: {},
                binanceP2PArs: {},
                binanceP2PUsd: {}
              }
            });
          });
      })
      .catch(storageError => {
        console.error('[BACKGROUND] ❌ Error obteniendo configuración:', storageError);
        sendResponse({
          success: false,
          error: 'Error obteniendo configuración del usuario',
          data: {
            banksData: {},
            dollarTypes: {},
            usdtData: {},
            usdtUsdData: {},
            usdtUsdBrokers: {},
            binanceP2PArs: {},
            binanceP2PUsd: {}
          }
        });
      });

    return true; // Respuesta asíncrona
  }

  // NUEVO v6.0: Handler para crypto arbitrage
  if (request.action === 'GET_CRYPTO_ARBITRAGE' || request.type === 'GET_CRYPTO_ARBITRAGE') {
    log('[CRYPTO-ARB] 📥 Solicitud de crypto arbitrage recibida');

    // Verificar que hayamos datos disponibles
    if (!currentData || !currentData.oficial) {
      log('[CRYPTO-ARB] ⚠️ No hay datos disponibles (currentData es null)');
      sendResponse({ routes: [] });
      return false;
    }

    // Obtener configuración del usuario y lista de criptos activas
    Promise.all([
      chrome.storage.local.get('notificationSettings'),
      dataService.getActiveCryptos()
    ])
      .then(async ([settingsResult, activeCryptos]) => {
        try {
          const userSettings = settingsResult.notificationSettings || {};

          log(`[CRYPTO-ARB] Obteniendo datos para ${activeCryptos.length} criptos activas`);

          // Obtener datos de todas las criptos activas
          const cryptoData = await dataService.fetchAllCryptos(activeCryptos, 'ARS');

          if (!cryptoData || Object.keys(cryptoData).length === 0) {
            log('[CRYPTO-ARB] ⚠️ No se obtuvieron datos de criptos');
            sendResponse({ routes: [] });
            return;
          }

          log(`[CRYPTO-ARB] Datos obtenidos para ${Object.keys(cryptoData).length} criptos`);

          // Calcular rutas de arbitraje crypto-to-crypto
          const routes = await calculateCryptoArbitrageRoutes(
            cryptoData,
            currentData.oficial,
            userSettings
          );

          log(`[CRYPTO-ARB] ✅ ${routes.length} rutas calculadas exitosamente`);

          sendResponse({ routes: routes || [] });
        } catch (error) {
          console.error('[CRYPTO-ARB] ❌ Error calculando crypto arbitrage:', error);
          sendResponse({ routes: [], error: error.message });
        }
      })
      .catch(error => {
        console.error('[CRYPTO-ARB] ❌ Error obteniendo criptos activas:', error);
        sendResponse({ routes: [], error: error.message });
      });

    return true; // Respuesta asíncrona
  }

  // Para mensajes desconocidos, no hacer nada
  log('[BACKGROUND] Mensaje desconocido:', request.action);
  return false; // CORREGIDO: No mantener canal si no hay respuesta
});

log('[BACKGROUND] Listener registrado');

// ============================================
// LISTENER DE CAMBIOS EN CONFIGURACIÓN
// ============================================

// NUEVO v5.0.48: Detectar cuando el usuario cambia configuración y recalcular
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.notificationSettings) {
    const oldSettings = changes.notificationSettings.oldValue || {};
    const newSettings = changes.notificationSettings.newValue || {};

    log('⚙️ [STORAGE] Configuración cambió');

    // Detectar cambios que requieren recálculo de rutas
    const dollarSourceChanged = oldSettings.dollarPriceSource !== newSettings.dollarPriceSource;
    const manualPriceChanged = oldSettings.manualDollarPrice !== newSettings.manualDollarPrice;
    const bankMethodChanged = oldSettings.preferredBank !== newSettings.preferredBank;

    if (dollarSourceChanged || manualPriceChanged || bankMethodChanged) {
      log('🔄 [STORAGE] Cambios críticos detectados, forzando actualización...');
      log('   - Fuente dólar:', oldSettings.dollarPriceSource, '→', newSettings.dollarPriceSource);
      log('   - Precio manual:', oldSettings.manualDollarPrice, '→', newSettings.manualDollarPrice);
      log('   - Método banco:', oldSettings.preferredBank, '→', newSettings.preferredBank);

      // Forzar actualización de datos
      updateData()
        .then(() => {
          log('✅ [STORAGE] Datos actualizados con nueva configuración');
        })
        .catch(error => {
          console.error('❌ [STORAGE] Error actualizando datos:', error);
        });
    }
  }
});

log('[BACKGROUND] Listener de storage registrado');

// ============================================
// SISTEMA DE ALERTAS DE ACTUALIZACIÓN v6.0
// ============================================

/**
 * Verifica si hay una nueva versión disponible en GitHub
 * Compara la versión actual del manifest con la versión del último commit
 */
async function checkForUpdatesInBackground() {
  const currentVersion = chrome.runtime.getManifest().version;
  
  try {
    const response = await fetch(
      'https://api.github.com/repos/nomdedev/ArbitrageAR-USDT/commits/main',
      {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      }
    );
    
    if (!response.ok) {
      console.warn('⚠️ [UPDATE] No se pudo verificar actualizaciones');
      return;
    }
    
    const data = await response.json();
    
    // Extraer versión del commit message
    const versionMatch = data.commit.message.match(/v?(\d+\.\d+\.\d+)/);
    const latestVersion = versionMatch ? versionMatch[1] : null;
    
    if (!latestVersion) {
      console.warn('⚠️ [UPDATE] No se pudo extraer versión del commit');
      return;
    }
    
    // Comparar versiones
    const hasUpdate = compareVersions(currentVersion, latestVersion);
    
    if (hasUpdate) {
      // Guardar en storage
      await chrome.storage.local.set({
        pendingUpdate: {
          currentVersion,
          latestVersion,
          message: data.commit.message,
          url: data.html_url,
          date: data.commit.author.date,
          sha: data.sha.substring(0, 7)
        }
      });
      
      // Actualizar badge
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
      
      console.log('✅ [UPDATE] Nueva versión disponible:', latestVersion);
    } else {
      console.log('✅ [UPDATE] Versión actualizada');
    }
  } catch (error) {
    console.error('❌ [UPDATE] Error verificando actualizaciones:', error);
  }
}

/**
 * Compara dos versiones semánticas (major.minor.patch)
 * @param {string} current - Versión actual
 * @param {string} latest - Versión más reciente
 * @returns {boolean} - true si latest > current
 */
function compareVersions(current, latest) {
  const parse = (v) => v.replace('v', '').split('.').map(Number);
  const [cMajor, cMinor, cPatch] = parse(current);
  const [lMajor, lMinor, lPatch] = parse(latest);
  
  if (lMajor > cMajor) return true;
  if (lMajor < cMajor) return false;
  if (lMinor > cMinor) return true;
  if (lMinor < cMinor) return false;
  return lPatch > cPatch;
}

// ============================================
// INICIALIZACIÓN
// ============================================

log('[BACKGROUND] Cargando configuración global...');
updateGlobalConfig()
  .then(() => {
    log('[BACKGROUND] Iniciando primera actualización...');
    updateData()
      .then(() => {
        log('[BACKGROUND] Primera actualización completada');
        // Inicializar datos de bancos
        updateBanksData()
          .then(() => {
            log('[BACKGROUND] Datos de bancos inicializados');
            console.log('🏦 Datos de bancos inicializados correctamente');
            
            // Verificar actualizaciones al iniciar
            checkForUpdatesInBackground();
          })
          .catch(error => {
            console.error('❌ [BACKGROUND] Error inicializando datos de bancos:', error);
          });
      })
      .catch(error => {
        console.error('❌ [BACKGROUND] Error en inicialización:', error);
      });
  })
  .catch(error => {
    console.error('❌ [BACKGROUND] Error cargando configuración:', error);
  });

// Actualización periódica usando chrome.alarms (Manifest V3 compatible)
const ALARM_NAME = 'updateDataAlarm';

async function startPeriodicUpdates() {
  // Obtener configuración actual
  const result = await chrome.storage.local.get('notificationSettings');
  const userSettings = result.notificationSettings || {};
  const intervalMinutes = userSettings.updateIntervalMinutes || 5;
  const intervalMs = intervalMinutes * 60 * 1000;

  log(`⏰ Configurando actualización periódica cada ${intervalMinutes} minutos (${intervalMs}ms)`);

  // Crear alarma periódica usando chrome.alarms (Manifest V3 compatible)
  // Las alarmas garantizan que el service worker se active incluso cuando está suspendido
  try {
    // Limpiar alarmas existentes
    await chrome.alarms.clear(ALARM_NAME);

    // Crear nueva alarma periódica
    await chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: intervalMinutes
    });

    log(`✅ Alarma creada: ${ALARM_NAME} cada ${intervalMinutes} minutos`);
  } catch (error) {
    console.error('❌ Error creando alarma:', error);
  }
}

// Listener para alarmas - Se ejecuta cuando la alarma se dispara
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === ALARM_NAME) {
    log('⏰ Actualización periódica (desde alarma)...');
    await updateData();
    // Actualizar también datos de bancos
    await updateBanksData();
  }
});

// Iniciar actualizaciones periódicas
startPeriodicUpdates();

// ============================================
// SISTEMA DE ALERTAS DE ACTUALIZACIÓN v6.0
// ============================================

// Crear alarma para verificación de actualizaciones
chrome.alarms.create('checkUpdates', {
  periodInMinutes: 60 // Verificar cada hora
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkUpdates') {
    checkForUpdatesInBackground();
  }
});

// Listener para cambios en configuración del usuario
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.notificationSettings) {
    const oldSettings = changes.notificationSettings.oldValue || {};
    const newSettings = changes.notificationSettings.newValue || {};

    // Si cambió el monto por defecto, recalcular rutas
    if (oldSettings.defaultSimAmount !== newSettings.defaultSimAmount) {
      log(
        `💰 Monto por defecto cambió: $${oldSettings.defaultSimAmount} → $${newSettings.defaultSimAmount}`
      );
      log('🔄 Recalculando rutas con nuevo monto...');
      updateData().then(() => {
        log('✅ Rutas recalculadas con nuevo monto');
      });
    }

    // NUEVO v5.0.54: Si cambió el intervalo de actualización, reiniciar el timer
    if (oldSettings.updateIntervalMinutes !== newSettings.updateIntervalMinutes) {
      log(
        `⏰ Intervalo cambió: ${oldSettings.updateIntervalMinutes}min → ${newSettings.updateIntervalMinutes}min`
      );
      log('🔄 Reiniciando actualizaciones periódicas...');
      startPeriodicUpdates();
    }

    // Si cambió el timeout, actualizar configuración global
    if (oldSettings.requestTimeoutSeconds !== newSettings.requestTimeoutSeconds) {
      log(
        `⏱️ Timeout cambió: ${oldSettings.requestTimeoutSeconds}s → ${newSettings.requestTimeoutSeconds}s`
      );
      updateGlobalConfig();
    }
  }
});

log('[BACKGROUND] Background completamente inicializado');

log('[BACKGROUND] Background completamente inicializado');
