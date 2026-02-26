/* global importScripts */

function log(...args) {
  if (globalThis.__ARBITRAGE_DEBUG__ === true) {
    console.info(...args);
  }
}

// ============================================
// MAIN BACKGROUND SCRIPT - ArbitrageAR v5.0.84
// Service Worker para Chrome Extension
// REFACTORIZADO v5.0.84: Eliminado código no utilizado
// - fetchDollarTypes() - función legacy no referenciada
// - getCachedData() - función no utilizada
// ============================================

log('🔧 [BACKGROUND] Iniciando service worker...');

// ============================================
// IMPORTAR MÓDULOS (compatibilidad con service worker)
// ============================================
try {
  importScripts('apiClient.js', 'arbitrageCalculator.js', '../DataService.js', 'cacheManager.js');
  log('✅ [BACKGROUND] Módulos importados correctamente');
} catch (e) {
  console.warn('⚠️ [BACKGROUND] No se pudieron importar módulos:', e.message);
  log('📝 [BACKGROUND] Usando implementación inline como fallback');
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
    const data = await fetchWithRateLimit('https://criptoya.com/api/USDT/USD/1');
    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inválida de API USDT/USD');
    }

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

    log('💰 USDT/USD procesados:', Object.keys(processedData).length, 'exchanges válidos');
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
    const data = await fetchWithRateLimit('https://criptoya.com/api/USDT/ARS/1');
    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inválida de API USDT/ARS');
    }

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

    log('💎 USDT/ARS procesados:', Object.keys(processedData).length, 'exchanges válidos');
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

    log('✅ Datos de bancos actualizados');
  } catch (error) {
    log('❌ Error actualizando datos de bancos:', error);
  }
}

// Variables globales para cache de datos de bancos
let cachedDollarTypes = {};
let cachedUsdtUsdData = {};
let cachedUsdtData = {};

// Variables globales de configuración
let REQUEST_INTERVAL = 100; // ms - OPTIMIZADO v5.0.61: Reducido de 600ms a 100ms
let REQUEST_TIMEOUT = 10000; // ms - valor por defecto
const ENABLE_RATE_LIMIT = false; // NUEVO v5.0.61: Desactivar rate limit por defecto

let lastRequestTime = 0;

async function getUserSettings() {
  try {
    const result = await chrome.storage.local.get('notificationSettings');
    return result.notificationSettings || {};
  } catch (error) {
    log('⚠️ Error obteniendo configuración de usuario:', error);
    return {};
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
  log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - INICIANDO para URL:', url);

  // OPTIMIZADO v5.0.61: Rate limit opcional para mejorar performance
  if (ENABLE_RATE_LIMIT) {
    const now = Date.now();
    const delay = REQUEST_INTERVAL - (now - lastRequestTime);
    if (delay > 0) {
      log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Rate limit activo, esperando', delay, 'ms');
      await new Promise(r => setTimeout(r, delay));
    }
    lastRequestTime = Date.now();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Iniciando fetch, timeout:', REQUEST_TIMEOUT, 'ms');

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    log(
      '🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Respuesta recibida, status:',
      res.status,
      'ok:',
      res.ok
    );

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const json = await res.json();
    log('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - ✅ JSON parseado exitosamente');
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
  log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - INICIANDO');
  const url = userSettings.criptoyaDolarOficialUrl || 'https://criptoya.com/api/dolar';
  log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - URL:', url);

  const data = await fetchWithRateLimit(url);
  log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - Datos recibidos:', data);

  if (data?.oficial) {
    log(
      '🔍 [DIAGNÓSTICO] fetchDolarOficial() - data.oficial.ask:',
      data.oficial.ask,
      'tipo:',
      typeof data.oficial.ask
    );
    log(
      '🔍 [DIAGNÓSTICO] fetchDolarOficial() - data.oficial.bid:',
      data.oficial.bid,
      'tipo:',
      typeof data.oficial.bid
    );
  }

  if (
    data?.oficial &&
    typeof data.oficial.ask === 'number' &&
    typeof data.oficial.bid === 'number'
  ) {
    // Mapeo correcto según API de CriptoYa:
    // - compra = bid (lo que el usuario RECIBE al vender)
    // - venta = ask (lo que el usuario PAGA al comprar)
    const result = {
      compra: data.oficial.bid,
      venta: data.oficial.ask,
      source: 'criptoya_oficial',
      timestamp: Date.now()
    };
    log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - ✅ Devolviendo datos válidos:', result);
    return result;
  }

  log('🔍 [DIAGNÓSTICO] fetchDolarOficial() - ❌ Datos inválidos o nulos, devolviendo NULL');
  return null;
}

async function fetchAllDollarTypes(userSettings) {
  log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - INICIANDO');
  const url = userSettings.criptoyaDolarUrl || 'https://criptoya.com/api/bancostodos';
  log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - URL:', url);
  log('[BACKGROUND] 🔄 Fetching bancos from:', url);
  log('[FETCH] 🔄 Iniciando fetchAllDollarTypes desde:', url);

  const data = await fetchWithRateLimit(url);
  log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - Datos recibidos:', data);
  log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - Tipo de datos:', typeof data);

  log(
    '[BACKGROUND] 📊 Bancos data received:',
    data ? Object.keys(data).length + ' bancos' : 'null'
  );
  log('[FETCH] 📊 Datos crudos recibidos:', data);

  if (data && typeof data === 'object') {
    log('🔍 [DIAGNÓSTICO] fetchAllDollarTypes() - Datos son objeto válido, procesando...');
    // Los datos de CriptoYa ya vienen en formato objeto
    const dollarTypes = {};
    const invalidBanks = [];
    const suspiciousBanks = [];
    const spreads = [];

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
          console.error('   Esto es IMPOSIBLE: el banco vende más barato de lo que compra');
          console.error(`   Spread negativo: ${(bid - ask).toFixed(2)}`);
          invalidBanks.push({
            bankCode: key,
            ask,
            bid,
            error: 'Spread negativo - ask debe ser mayor que bid'
          });
          return; // NO incluir este banco
        }

        // Validar spread razonable (0.1% - 5%)
        const spread = ask - bid;
        const spreadPercent = (spread / ask) * 100;
        spreads.push({ bankCode: key, spread, spreadPercent });

        if (spreadPercent < 0.1) {
          console.warn(
            `⚠️ [VALIDACIÓN] ${key}: Spread ${spreadPercent.toFixed(2)}% muy bajo (sospechoso)`
          );
          suspiciousBanks.push({
            bankCode: key,
            spreadPercent,
            warning: 'Spread muy bajo - posible error en datos'
          });
        } else if (spreadPercent > 5) {
          console.warn(
            `⚠️ [VALIDACIÓN] ${key}: Spread ${spreadPercent.toFixed(2)}% muy alto (sospechoso)`
          );
          suspiciousBanks.push({
            bankCode: key,
            spreadPercent,
            warning: 'Spread muy alto - posible error en datos'
          });
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
      console.error(
        `❌ [VALIDACIÓN] ${invalidBanks.length} bancos con datos inválidos:`,
        invalidBanks
      );
      console.error('   Estos bancos serán excluidos de los cálculos');
    }

    if (suspiciousBanks.length > 0) {
      console.warn(
        `⚠️ [VALIDACIÓN] ${suspiciousBanks.length} bancos con spreads anómalos:`,
        suspiciousBanks
      );
    }

    const avgSpread = spreads.reduce((sum, s) => sum + s.spreadPercent, 0) / spreads.length;
    log(`📊 [VALIDACIÓN] Spread promedio: ${avgSpread.toFixed(2)}%`);

    log(
      '[BACKGROUND] 📤 Processed bancos data:',
      Object.keys(dollarTypes).length + ' bancos procesados'
    );
    log('[FETCH] 📤 Datos procesados:', Object.keys(dollarTypes).length + ' bancos');
    return dollarTypes;
  }
  log('[BACKGROUND] ❌ No data received from bancos API');
  log('[FETCH] ❌ No se pudieron procesar datos de bancos');
  return null;
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
  log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - INICIANDO');
  const configuredUrl = userSettings.criptoyaBanksUrl;
  const defaultBanksUrl = 'https://criptoya.com/api/bancostodos';
  const hasLegacyDolarApiBankUrl =
    typeof configuredUrl === 'string' && configuredUrl.includes('/v1/bancos/');

  const url = hasLegacyDolarApiBankUrl ? defaultBanksUrl : configuredUrl || defaultBanksUrl;

  if (hasLegacyDolarApiBankUrl) {
    console.warn(
      '⚠️ [BANKS] URL legacy detectada en configuración (DolarAPI /v1/bancos/*). Se usa fallback a CriptoYa bancostodos.'
    );
  }

  log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - URL:', url);

  const data = await fetchWithRateLimit(url);
  log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - Datos recibidos:', data);
  log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - Tipo de datos:', typeof data);

  if (data && typeof data === 'object') {
    const result = {
      ...data,
      source: 'criptoya_banks',
      timestamp: Date.now()
    };
    log(
      '🔍 [DIAGNÓSTICO] fetchBankDollarRates() - ✅ Devolviendo datos válidos, keys:',
      Object.keys(data)
    );
    return result;
  }

  log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - ❌ Datos inválidos o nulos, devolviendo NULL');
  return null;
}

// ============================================
// FUNCIONES DE CÁLCULO ESTADÍSTICO PARA PRECIOS DE BANCOS
// ============================================

// Funciones centralizadas - eliminadas duplicaciones
// Usar BANK_CALCULATIONS.calculateBankConsensus, etc.

// ============================================
// UTILIDADES COMPARTIDAS DE CÁLCULO
// ============================================

/**
 * Resuelve la tasa USDT/USD para un exchange.
 * Intenta primero la API directa; si no, calcula indirectamente desde precios ARS.
 * @returns {{ rate: number, usingFallback: boolean } | null}
 */
function resolveUsdToUsdtRate(usdtUsd, exchange, data, officialVenta) {
  if (usdtUsd?.[exchange]?.totalAsk) {
    return { rate: usdtUsd[exchange].totalAsk, usingFallback: false };
  }
  if (data?.totalAsk && officialVenta) {
    const calculatedRate = data.totalAsk / officialVenta;
    if (calculatedRate >= 0.95 && calculatedRate <= 1.15) {
      return { rate: calculatedRate, usingFallback: true };
    }
  }
  return null;
}

/**
 * Resuelve el porcentaje de fee de un broker para un tipo de operación.
 * Para 'buyFee': usa fee específico del broker o extraTradingFee como fallback.
 * Para 'sellFee': usa fee específico del broker o 0.
 * @returns {number} Fee en porcentaje (ej: 1.5 para 1.5%)
 */
function resolveBrokerFee(userSettings, exchange, feeType) {
  const config = (userSettings.brokerFees || []).find(
    fee => fee.broker.toLowerCase() === exchange.toLowerCase()
  );
  if (config && config[feeType] > 0) return config[feeType];
  if (feeType === 'buyFee') return userSettings.extraTradingFee || 0;
  return 0;
}

/**
 * Filtra el mapa de exchanges USDT según la lista de brokers seleccionados.
 * Si no hay selección activa, retorna el mapa completo sin modificar.
 */
function filterExchangesBySelection(usdt, selectedBrokers) {
  if (!selectedBrokers || !Array.isArray(selectedBrokers) || selectedBrokers.length === 0) {
    return usdt;
  }
  const filtered = {};
  selectedBrokers.forEach(broker => {
    if (usdt[broker]) filtered[broker] = usdt[broker];
  });
  return filtered;
}

/**
 * Calcula ganancias brutas y netas a partir de los montos de la operación.
 */
function calculateProfits(initialAmount, arsFromSale, finalAmount) {
  const grossProfit = arsFromSale - initialAmount;
  const netProfit = finalAmount - initialAmount;
  return {
    grossProfit,
    netProfit,
    grossPercent: (grossProfit / initialAmount) * 100,
    netPercent: (netProfit / initialAmount) * 100
  };
}

// ============================================
// CÁLCULO DE RUTAS INTER-BROKER (entre diferentes exchanges)
// ============================================

function buildFilteredUsdtMap(usdt, userSettings) {
  // 1. Filtrar por brokers seleccionados
  const base = filterExchangesBySelection(usdt, userSettings.selectedUsdtBrokers);
  const p2pUsdtArsExchanges = userSettings.p2pUsdtArsExchanges || [];
  const p2pUsdUsdtExchanges = userSettings.p2pUsdUsdtExchanges || [];
  const p2pSyncExchanges = userSettings.p2pSyncExchanges || [];
  const disabledP2pUsdtArs = userSettings.disabledP2pUsdtArs || [];
  const disabledP2pUsdUsdt = userSettings.disabledP2pUsdUsdt || [];
  const disabledP2pSync = userSettings.disabledP2pSync || [];

  // Todos los exchanges P2P explícitamente desactivados (en cualquier categoría)
  const allDisabled = new Set([...disabledP2pUsdtArs, ...disabledP2pUsdUsdt, ...disabledP2pSync]);

  // Todos los exchanges P2P seleccionados (unión de todas las categorías)
  const allEnabled = new Set([
    ...p2pUsdtArsExchanges,
    ...p2pUsdUsdtExchanges,
    ...p2pSyncExchanges
  ]);

  const result = {};
  for (const [exchange, data] of Object.entries(base)) {
    if (allDisabled.has(exchange)) continue;
    const isP2p = exchange.toLowerCase().includes('p2p');
    if (isP2p && allEnabled.size > 0 && !allEnabled.has(exchange)) continue;
    result[exchange] = data;
  }
  return result;
}

function tryCalculateInterBrokerPair(buyExchange, sellExchange, { buyData, sellData, initialAmount, officialPrice, usdtUsd, applyFees, userSettings }) {
  if (!buyData?.totalAsk || !sellData?.totalBid) return null;

  const usdPurchased = initialAmount / officialPrice;
  const rateResult = resolveUsdToUsdtRate(usdtUsd, buyExchange, buyData, officialPrice);
  if (!rateResult) return null;
  const { rate: usdToUsdtRate, usingFallback } = rateResult;

  const usdtPurchased = usdPurchased / usdToUsdtRate;

  let usdtAfterFees = usdtPurchased;
  let tradingFeeAmount = 0;
  if (applyFees) {
    const tradingFeePercent = resolveBrokerFee(userSettings, buyExchange, 'buyFee');
    if (tradingFeePercent > 0) {
      tradingFeeAmount = usdtPurchased * (tradingFeePercent / 100);
      usdtAfterFees = usdtPurchased - tradingFeeAmount;
    }
  }

  const sellPrice = sellData.totalBid;
  const arsFromSale = usdtAfterFees * sellPrice;

  let arsAfterSellFee = arsFromSale;
  let sellFeeAmount = 0;
  if (applyFees) {
    const sellFeePercent = resolveBrokerFee(userSettings, sellExchange, 'sellFee');
    if (sellFeePercent > 0) {
      sellFeeAmount = arsFromSale * (sellFeePercent / 100);
      arsAfterSellFee = arsFromSale - sellFeeAmount;
    }
  }

  let finalAmount = arsAfterSellFee;
  let withdrawalFee = 0;
  let transferFee = 0;
  let bankFee = 0;
  if (applyFees) {
    withdrawalFee = userSettings.extraWithdrawalFee || 0;
    transferFee = userSettings.extraTransferFee || 0;
    bankFee = userSettings.bankCommissionFee || 0;
    finalAmount = arsAfterSellFee - (withdrawalFee + transferFee + bankFee);
  }

  const grossProfit = arsFromSale - initialAmount;
  const netProfit = finalAmount - initialAmount;
  const grossPercent = (grossProfit / initialAmount) * 100;
  const netPercent = (netProfit / initialAmount) * 100;
  const totalFees = tradingFeeAmount * sellPrice + sellFeeAmount + withdrawalFee + transferFee + bankFee;

  return {
    broker: `${buyExchange}→${sellExchange}`,
    buyExchange,
    sellExchange,
    isSingleExchange: false,
    requiresP2P: buyExchange.toLowerCase().includes('p2p') || sellExchange.toLowerCase().includes('p2p'),
    profitPercent: netPercent,
    profitPercentage: netPercent,
    grossProfitPercent: grossPercent,
    grossProfit,
    officialPrice,
    usdToUsdtRate,
    usdtArsBid: sellPrice,
    calculation: {
      initialAmount, usdPurchased, usdtPurchased, usdtAfterFees,
      arsFromSale, arsAfterSellFee, finalAmount, netProfit, grossProfit
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
      brokerSpecificFees: (userSettings.brokerFees || []).some(
        fee =>
          fee.broker.toLowerCase() === buyExchange.toLowerCase() ||
          fee.broker.toLowerCase() === sellExchange.toLowerCase()
      ),
      usdtUsdSource: usdtUsd?.[buyExchange]?.totalAsk ? 'api' : 'calculated',
      usdtUsdWarning: usingFallback ? `Tasa USDT/USD calculada para ${buyExchange}` : null
    }
  };
}

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

  // Filtrar exchanges según selección del usuario (incluyendo reglas P2P)
  const filteredUsdt = buildFilteredUsdtMap(usdt, userSettings);

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
      if (buyExchange === sellExchange) continue;
      processedCount++;
      try {
        const route = tryCalculateInterBrokerPair(buyExchange, sellExchange, {
          buyData: usdt[buyExchange],
          sellData: usdt[sellExchange],
          initialAmount,
          officialPrice,
          usdtUsd,
          applyFees,
          userSettings
        });
        if (!route) { skippedCount++; continue; }
        routes.push(route);
        log(`✅ [INTER-BROKER] ${buyExchange}→${sellExchange}: ${route.profitPercentage.toFixed(2)}%`);
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
// CÁLCULO DE RUTA DE UN SOLO EXCHANGE
// ============================================

function calculateSingleExchangeRoute(exchange, data, { initialAmount, officialPrice, usdtUsd, applyFees, userSettings }) {
  if (!data || typeof data !== 'object' || !data.totalAsk || !data.totalBid) return null;
  if (exchange === 'time' || exchange === 'timestamp') return null;

  const usdPurchased = initialAmount / officialPrice;
  const rateResult = resolveUsdToUsdtRate(usdtUsd, exchange, data, officialPrice);
  if (!rateResult) return null;
  const { rate: usdToUsdtRate, usingFallback } = rateResult;

  const usdtPurchased = usdPurchased / usdToUsdtRate;

  let usdtAfterFees = usdtPurchased;
  let tradingFeeAmount = 0;
  if (applyFees) {
    const tradingFeePercent = resolveBrokerFee(userSettings, exchange, 'buyFee');
    if (tradingFeePercent > 0) {
      tradingFeeAmount = usdtPurchased * (tradingFeePercent / 100);
      usdtAfterFees = usdtPurchased - tradingFeeAmount;
    }
  }

  const sellPrice = data.totalBid;
  const arsFromSale = usdtAfterFees * sellPrice;

  let arsAfterSellFee = arsFromSale;
  let sellFeeAmount = 0;
  if (applyFees) {
    const sellFeePercent = resolveBrokerFee(userSettings, exchange, 'sellFee');
    if (sellFeePercent > 0) {
      sellFeeAmount = arsFromSale * (sellFeePercent / 100);
      arsAfterSellFee = arsFromSale - sellFeeAmount;
    }
  }

  let finalAmount = arsAfterSellFee;
  let withdrawalFee = 0;
  let transferFee = 0;
  let bankFee = 0;
  if (applyFees) {
    withdrawalFee = userSettings.extraWithdrawalFee || 0;
    transferFee = userSettings.extraTransferFee || 0;
    bankFee = userSettings.bankCommissionFee || 0;
    finalAmount = arsFromSale - (withdrawalFee + transferFee + bankFee);
  }

  const grossProfit = arsFromSale - initialAmount;
  const netProfit = finalAmount - initialAmount;
  const grossPercent = (grossProfit / initialAmount) * 100;
  const netPercent = (netProfit / initialAmount) * 100;
  const totalFees = tradingFeeAmount * sellPrice + sellFeeAmount + withdrawalFee + transferFee + bankFee;

  return {
    broker: exchange,
    buyExchange: exchange,
    sellExchange: exchange,
    isSingleExchange: true,
    requiresP2P: exchange.toLowerCase().includes('p2p'),
    profitPercent: netPercent,
    profitPercentage: netPercent,
    grossProfitPercent: grossPercent,
    grossProfit,
    officialPrice,
    usdToUsdtRate,
    usdtArsBid: sellPrice,
    calculation: {
      initialAmount, usdPurchased, usdtPurchased, usdtAfterFees,
      arsFromSale, arsAfterSellFee, finalAmount, netProfit, grossProfit
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
      brokerSpecificFees: (userSettings.brokerFees || []).some(f => f.broker.toLowerCase() === exchange.toLowerCase()),
      usdtUsdSource: usdtUsd?.[exchange]?.totalAsk ? 'api' : 'calculated',
      usdtUsdWarning: usingFallback ? 'Tasa USDT/USD calculada indirectamente. Verificar en CriptoYa.' : null
    }
  };
}

// ============================================
// CÁLCULO DE RUTAS SIMPLIFICADO
// ============================================

async function calculateSimpleRoutes(oficial, usdt, usdtUsd, userSettings = {}) {
  log('🔍 [CALC] Iniciando cálculo de rutas...');
  log('🔍 [CALC] oficial:', oficial);
  log('🔍 [CALC] usdt:', usdt ? Object.keys(usdt).length + ' exchanges' : 'null');
  log('🔍 [CALC] usdtUsd:', usdtUsd ? Object.keys(usdtUsd).length + ' exchanges' : 'null');

  // DIAGNÓSTICO: Verificar datos de entrada
  log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Datos de entrada:', {
    oficial: oficial ? { compra: oficial.compra, venta: oficial.venta } : null,
    usdtExchanges: usdt ? Object.keys(usdt).filter(k => k !== 'time' && k !== 'timestamp') : [],
    usdtUsdExchanges: usdtUsd
      ? Object.keys(usdtUsd).filter(k => k !== 'time' && k !== 'timestamp')
      : []
  });

  if (!oficial || !usdt) {
    console.error('❌ [DIAGNÓSTICO] calculateSimpleRoutes() - Faltan datos básicos:', {
      oficial: !!oficial,
      usdt: !!usdt
    });
    log('❌ [CALC] Faltan datos básicos');
    return [];
  }

  const initialAmount = userSettings.defaultSimAmount || 1000000;

  const routes = [];
  const officialPrice = oficial.venta; // CORREGIDO: Usar precio de venta (lo que pagan los usuarios)
  const applyFees = userSettings.applyFeesInCalculation || false; // false por defecto

  log(`🔍 [CALC] Precio oficial USD (venta): $${officialPrice} ARS`);
  log(`🔍 [CALC] Monto inicial: $${initialAmount.toLocaleString()} ARS`);
  log(`🔍 [CALC] Aplicar fees: ${applyFees ? 'SÍ' : 'NO'}`);
  log(`🔍 [CALC] Procesando ${Object.keys(usdt).length} exchanges...`);

  // Filtrar exchanges según selección del usuario
  const selectedUsdtBrokers = userSettings.selectedUsdtBrokers;
  const filteredUsdt = filterExchangesBySelection(usdt, selectedUsdtBrokers);

  // Iterar exchanges
  let processedCount = 0;
  let skippedCount = 0;

  for (const [exchange, data] of Object.entries(filteredUsdt)) {
    const route = calculateSingleExchangeRoute(exchange, data, {
      initialAmount,
      officialPrice,
      usdtUsd,
      applyFees,
      userSettings
    });
    if (!route) {
      skippedCount++;
      continue;
    }
    processedCount++;
    routes.push(route);
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
  routes.sort(
    (a, b) =>
      (b.profitPercentage || b.profitPercent || 0) - (a.profitPercentage || a.profitPercent || 0)
  );

  // DIAGNÓSTICO: Loggear resultado final del cálculo
  log('🔍 [DIAGNÓSTICO] calculateSimpleRoutes() - Resultado final:', {
    totalRoutes: routes.length,
    intraBroker: processedCount,
    skippedIntraBroker: skippedCount,
    interBroker: interBrokerRoutes.length,
    top3Routes: routes.slice(0, 3).map(r => ({
      broker: r.broker,
      profitPercentage: r.profitPercentage || r.profitPercent,
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

    // PASO 1: Vender USDT directamente por ARS
    const sellPrice = data.totalBid; // Precio de venta USDT/ARS
    const arsFromSale = initialUsdtAmount * sellPrice;

    log(
      `💰 [${exchange}] Venta directa: ${initialUsdtAmount} USDT × ${sellPrice} = $${arsFromSale.toFixed(2)} ARS`
    );

    // PASO 2 y 3: Aplicar fees (venta + fijos)
    let sellFeeAmount = 0;
    let withdrawalFee = 0;
    let transferFee = 0;
    let bankFee = 0;

    if (userSettings.applyFeesInCalculation) {
      const sellFeePercent = resolveBrokerFee(userSettings, exchange, 'sellFee');
      if (sellFeePercent > 0) {
        sellFeeAmount = arsFromSale * (sellFeePercent / 100);
      }
      withdrawalFee = userSettings.extraWithdrawalFee || 0;
      transferFee = userSettings.extraTransferFee || 0;
      bankFee = userSettings.bankCommissionFee || 0;
    }

    const totalFees = sellFeeAmount + withdrawalFee + transferFee + bankFee;
    const arsAfterFee = arsFromSale - sellFeeAmount;
    const finalAmount = arsFromSale - totalFees;

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
        brokerSpecificFees: (userSettings.brokerFees || []).some(f => f.broker.toLowerCase() === exchange.toLowerCase())
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

    // PASO 1: Calcular tasa USDT/USD
    const rateResult = resolveUsdToUsdtRate(usdtUsd, exchange, data, oficial.venta);
    if (!rateResult) {
      log(`❌ [${exchange}] No se puede calcular tasa USDT/USD`);
      continue;
    }
    const usdToUsdtRate = rateResult.rate;
    const rateSource = rateResult.usingFallback ? 'calculated' : 'direct_api';

    // PASO 2: Comprar USDT con USD
    const usdtPurchased = initialUsdAmount / usdToUsdtRate;
    log(`💎 [${exchange}] Compra: ${initialUsdAmount} USD → ${usdtPurchased.toFixed(4)} USDT`);

    // PASO 3: Aplicar fee de compra si está configurado
    let usdtAfterFee = usdtPurchased;
    let buyFeeAmount = 0;

    if (userSettings.applyFeesInCalculation) {
      const buyFeePercent = resolveBrokerFee(userSettings, exchange, 'buyFee');
      if (buyFeePercent > 0) {
        buyFeeAmount = usdtPurchased * (buyFeePercent / 100);
        usdtAfterFee = usdtPurchased - buyFeeAmount;
        log(`💸 [${exchange}] Fee compra ${buyFeePercent}% = ${buyFeeAmount.toFixed(4)} USDT`);
      }
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
        brokerSpecificFees: (userSettings.brokerFees || []).some(f => f.broker.toLowerCase() === exchange.toLowerCase())
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
function tryCalculateCryptoPair(symbol, buyExchange, sellExchange, { buyData, sellData, initialAmount, applyFees, userSettings }) {
  if (!buyData?.totalAsk || !sellData?.totalBid) return null;

  const buyPriceARS = buyData.totalAsk;
  const cryptoPurchased = initialAmount / buyPriceARS;

  // Network fee
  let networkFee = 0;
  if (globalThis.self?.dataService) {
    networkFee = globalThis.self.dataService.getNetworkFee(buyExchange, symbol);
  } else {
    const defaultFees = {
      BTC: 0.0002, ETH: 0.003, USDC: 1, USDT: 1, DAI: 1,
      BNB: 0.001, SOL: 0.01, ADA: 1, XRP: 0.25, MATIC: 0.1, DOGE: 5
    };
    networkFee = defaultFees[symbol] || 0;
  }
  const networkFeeARS = networkFee * buyPriceARS;

  // Buy fee
  let cryptoAfterBuyFee = cryptoPurchased;
  let buyFeeAmount = 0;
  let buyFeeARS = 0;
  if (applyFees) {
    const buyFeePercent = resolveBrokerFee(userSettings, buyExchange, 'buyFee');
    if (buyFeePercent > 0) {
      buyFeeAmount = cryptoPurchased * (buyFeePercent / 100);
      cryptoAfterBuyFee = cryptoPurchased - buyFeeAmount;
      buyFeeARS = buyFeeAmount * buyPriceARS;
    }
  }

  const cryptoAfterNetworkFee = cryptoAfterBuyFee - networkFee;
  if (cryptoAfterNetworkFee <= 0) return null;

  // Sell
  const sellPriceARS = sellData.totalBid;
  const arsFromSale = cryptoAfterNetworkFee * sellPriceARS;

  let arsAfterSellFee = arsFromSale;
  let sellFeeAmount = 0;
  if (applyFees) {
    const sellFeePercent = resolveBrokerFee(userSettings, sellExchange, 'sellFee');
    if (sellFeePercent > 0) {
      sellFeeAmount = arsFromSale * (sellFeePercent / 100);
      arsAfterSellFee = arsFromSale - sellFeeAmount;
    }
  }

  const finalAmount = arsAfterSellFee;
  const netProfit = finalAmount - initialAmount;
  const netProfitPercent = (netProfit / initialAmount) * 100;
  const grossProfit = arsFromSale - initialAmount;
  const grossProfitPercent = (grossProfit / initialAmount) * 100;

  const buyIsP2P = buyExchange.toLowerCase().includes('p2p') || buyExchange.toLowerCase().includes('peer');
  const sellIsP2P = sellExchange.toLowerCase().includes('p2p') || sellExchange.toLowerCase().includes('peer');
  let operationType = 'DIRECT';
  let speed = 'FAST';
  let difficulty = 'EASY';
  if (buyIsP2P || sellIsP2P) {
    operationType = 'P2P'; speed = 'MEDIUM'; difficulty = 'HARD';
  } else if (buyExchange !== sellExchange) {
    operationType = 'TRANSFER'; speed = 'MEDIUM'; difficulty = 'MEDIUM';
  }

  return {
    crypto: symbol,
    broker: `${buyExchange}→${sellExchange}`,
    buyExchange,
    sellExchange,
    isSingleExchange: false,
    operationType,
    speed,
    difficulty,
    requiresP2P: buyIsP2P || sellIsP2P,
    profitPercent: netProfitPercent,
    profitPercentage: netProfitPercent,
    grossProfitPercent,
    grossProfit,
    netProfit,
    buyPriceARS,
    sellPriceARS,
    spread: sellPriceARS - buyPriceARS,
    spreadPercent: ((sellPriceARS - buyPriceARS) / buyPriceARS) * 100,
    calculation: {
      initialAmount, cryptoPurchased, cryptoAfterBuyFee,
      networkFee, networkFeeARS, cryptoAfterNetworkFee,
      arsFromSale, arsAfterSellFee, finalAmount, netProfit, grossProfit
    },
    fees: {
      buy: buyFeeARS,
      sell: sellFeeAmount,
      network: networkFeeARS,
      total: buyFeeARS + sellFeeAmount + networkFeeARS
    },
    config: {
      applyFees,
      brokerSpecificFees: (userSettings.brokerFees || []).some(
        fee =>
          fee.broker.toLowerCase() === buyExchange.toLowerCase() ||
          fee.broker.toLowerCase() === sellExchange.toLowerCase()
      )
    },
    metadata: {
      symbol,
      buyVolume: buyData.volume || 0,
      sellVolume: sellData.volume || 0,
      timestamp: Date.now()
    }
  };
}

function getValidCryptoExchanges(data) {
  return Object.keys(data).filter(
    ex =>
      ex !== 'time' && ex !== 'timestamp' && ex !== 'symbol' && ex !== 'fiatCurrency' &&
      data[ex] && typeof data[ex] === 'object' && data[ex].totalAsk && data[ex].totalBid
  );
}

function calculateCryptoSymbolRoutes(symbol, data, { initialAmount, applyFees, userSettings }) {
  if (!data || typeof data !== 'object') return [];
  const exchanges = getValidCryptoExchanges(data);
  if (exchanges.length < 2) return [];

  const routes = [];
  for (const buyExchange of exchanges) {
    for (const sellExchange of exchanges) {
      if (buyExchange === sellExchange) continue;
      try {
        const route = tryCalculateCryptoPair(symbol, buyExchange, sellExchange, {
          buyData: data[buyExchange],
          sellData: data[sellExchange],
          initialAmount,
          applyFees,
          userSettings
        });
        if (!route) continue;
        routes.push(route);
        log(`✅ [CRYPTO-ARB] ${symbol} ${buyExchange}→${sellExchange}: ${route.profitPercentage.toFixed(2)}% (${route.operationType})`);
      } catch (error) {
        log(`❌ [CRYPTO-ARB] Error calculando ${symbol} ${buyExchange}→${sellExchange}:`, error.message);
      }
    }
  }
  return routes;
}

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
    const symbolRoutes = calculateCryptoSymbolRoutes(symbol, data, {
      initialAmount,
      applyFees,
      userSettings
    });
    routes.push(...symbolRoutes);
  }

  // Ordenar por ganancia neta (mejores primero)
  routes.sort(
    (a, b) =>
      (b.profitPercentage || b.profitPercent || 0) - (a.profitPercentage || a.profitPercent || 0)
  );

  log(`✅ [CRYPTO-ARB] Completado: ${routes.length} rutas de arbitraje crypto-to-crypto generadas`);
  log('🏆 [CRYPTO-ARB] Top 3 oportunidades:');
  routes.slice(0, 3).forEach((route, i) => {
    const profitPct = route.profitPercentage || route.profitPercent || 0;
    log(
      `   ${i + 1}. ${route.crypto} ${route.broker}: ${profitPct.toFixed(2)}% - $${route.netProfit.toFixed(0)} ARS (${route.operationType})`
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
    results.arbitrage = await calculateSimpleRoutes(oficial, usdt, usdtUsd, userSettings);
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
        return (
          (b.profitPercentage || b.profitPercent || b.efficiency || 0) -
          (a.profitPercentage || a.profitPercent || a.efficiency || 0)
        );
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
    log('[NOTIF] ❌ Notificaciones deshabilitadas');
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
        log('[NOTIF] ❌ Horario silencioso activo');
        return false;
      }
    } else if (currentTime >= start && currentTime <= end) {
      log('[NOTIF] ❌ Horario silencioso activo');
      return false;
    }
  }

  // 3. Verificar frecuencia de notificaciones
  const now = Date.now();
  const frequencies = {
    always: 0,
    '1min': 1 * 60 * 1000,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    once: Infinity
  };

  const minInterval = frequencies[settings.notificationFrequency] || frequencies['1min'];
  if (now - lastNotificationTime < minInterval) {
    log(
      `[NOTIF] ❌ Intervalo mínimo no cumplido (${Math.round((minInterval - (now - lastNotificationTime)) / 1000)}s restantes)`
    );
    return false;
  }

  // 4. Verificar umbral de ganancia usando alertThreshold (configurado en options)
  // CORREGIDO: Usar alertThreshold directamente en lugar del sistema de tipos
  const threshold = settings.alertThreshold ?? 1;
  const profitPct = arbitrage.profitPercentage || arbitrage.profitPercent || 0;

  if (profitPct < threshold) {
    log(`[NOTIF] ❌ Ganancia ${profitPct.toFixed(2)}% < umbral ${threshold}%`);
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
      log(`[NOTIF] ❌ Exchange ${exchangeName} no está en la lista de notificaciones`);
      return false;
    }
  }

  // 6. Verificar si ya notificamos este arbitraje recientemente
  const arbKey = `${arbitrage.broker}_${Math.floor(profitPct)}`; // Redondear para evitar spam
  if (notifiedArbitrages.has(arbKey)) {
    log(`[NOTIF] ❌ Arbitraje ya notificado recientemente: ${arbKey}`);
    return false;
  }

  log(`[NOTIF] ✅ Notificación aprobada: ${arbitrage.broker} ${profitPct.toFixed(2)}%`);
  return true;
}

async function sendNotification(arbitrage, settings) {
  try {
    const notificationId = `arbitrage_${Date.now()}`;
    const broker = arbitrage.broker || arbitrage.exchange || 'Exchange';
    const profit = arbitrage.profitPercentage || arbitrage.profitPercent || 0;

    // Determinar el nivel de urgencia según la ganancia
    let iconLevel;
    if (profit >= 15) {
      iconLevel = 'extreme';
    } else if (profit >= 10) {
      iconLevel = 'high';
    } else if (profit >= 5) {
      iconLevel = 'moderate';
    } else {
      iconLevel = 'normal';
    }

    // Emojis y textos amigables según nivel
    const levelConfig = {
      extreme: { icon: '🚀', label: '¡OPORTUNIDAD EXCEPCIONAL!' },
      high: { icon: '💎', label: '¡Gran oportunidad!' },
      moderate: { icon: '💰', label: 'Oportunidad interesante' },
      normal: { icon: '📊', label: 'Oportunidad detectada' }
    };

    const config = levelConfig[iconLevel];

    // Formatear nombre del exchange de forma amigable
    const brokerName = broker.charAt(0).toUpperCase() + broker.slice(1).toLowerCase();

    // Construir mensaje amigable y legible
    let message = `Ganancia neta estimada: +${profit.toFixed(2)}%`;

    // Agregar información de precios si está disponible
    if (arbitrage.usdtArsBid) {
      message += `\nPrecio USDT: $${arbitrage.usdtArsBid.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS`;
    }
    if (arbitrage.usdToUsdtRate) {
      message += `\nTasa USD/USDT: ${Number.parseFloat(arbitrage.usdToUsdtRate).toFixed(4)}`;
    }

    // Agregar contexto temporal
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    message += `\n⏰ Detectado a las ${timeStr}`;

    log(`[NOTIF] 🔔 Enviando notificación: ${brokerName} - ${profit.toFixed(2)}%`);

    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `${config.icon} ${config.label} en ${brokerName}`,
      message: message,
      priority: profit >= 10 ? 2 : 1,
      requireInteraction: profit >= 10, // Requiere interacción para ganancias >= 10%
      silent: false // Asegurar que suene
    });

    // Actualizar tiempo de última notificación
    lastNotificationTime = Date.now();

    // Agregar a notificados (limpiar después de 1 hora)
    const arbKey = `${arbitrage.broker}_${profit.toFixed(2)}`;
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
      log('🔔 Notificación con sonido enviada');
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
      log('[NOTIF] ⏭️ Saltando notificación en inicialización (isFirstUpdate = true)');
      return;
    }

    const result = await chrome.storage.local.get('notificationSettings');
    const settings = result.notificationSettings || {
      notificationsEnabled: true,
      alertThreshold: 1, // CORREGIDO: Usar alertThreshold
      notificationFrequency: '1min',
      soundEnabled: true,
      notificationExchanges: [], // CORREGIDO: Usar notificationExchanges
      quietHoursEnabled: false,
      quietStart: '22:00',
      quietEnd: '08:00'
    };

    log('[NOTIF] 🔍 Verificando notificaciones...', {
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

async function resolveDollarPrice(userSettings) {
  if (userSettings.dollarPriceSource === 'manual') {
    const manualPrice = userSettings.manualDollarPrice || 1400;
    log(`💵 [BACKGROUND] MODO MANUAL: Usando precio manual: $${manualPrice}`);
    return { compra: manualPrice, venta: manualPrice, source: 'manual', timestamp: Date.now() };
  }

  const bankMethod = userSettings.preferredBank;
  if (bankMethod && bankMethod !== 'oficial') {
    log(`🏦 Obteniendo precio usando método: ${bankMethod}`);
    const bankData = await fetchBankDollarRates(userSettings);
    const selectedBanks =
      userSettings.selectedBanks && userSettings.selectedBanks.length > 0
        ? userSettings.selectedBanks
        : ['bna', 'galicia', 'santander', 'bbva', 'icbc'];

    if (bankData) {
      const calculatedPrice = BANK_CALCULATIONS.calculateDollarPrice(
        bankData,
        bankMethod,
        selectedBanks
      );
      if (calculatedPrice) {
        log(
          `💵 Precio calculado (${calculatedPrice.method}): $${calculatedPrice.price} (${calculatedPrice.banksCount} bancos)`
        );
        return {
          compra: calculatedPrice.price,
          venta: calculatedPrice.price,
          source: calculatedPrice.source,
          method: calculatedPrice.method,
          banksCount: calculatedPrice.banksCount,
          timestamp: Date.now()
        };
      }
      log('⚠️ [BACKGROUND] No se pudo calcular precio de bancos, usando API oficial como fallback...');
    } else {
      log('⚠️ [BACKGROUND] No se pudieron obtener datos de bancos, usando API oficial como fallback...');
    }

    // Fallback: API oficial
    const oficialFallback = await fetchDolarOficial(userSettings);
    if (oficialFallback) return oficialFallback;

    // Último fallback: manual
    const manualFallback = userSettings.manualDollarPrice || 1400;
    log('⚠️ [BACKGROUND] API oficial también falló, usando precio manual como último fallback');
    return {
      compra: manualFallback,
      venta: manualFallback,
      source: 'manual_fallback',
      timestamp: Date.now()
    };
  }

  // Precio oficial estándar
  log('🌐 Obteniendo precio oficial desde DolarAPI...');
  return await fetchDolarOficial(userSettings);
}

async function updateData() {
  log('🔍 [DIAGNÓSTICO] updateData() - INICIANDO función de actualización de datos');
  log('� Actualizando datos...');

  try {
    // NUEVO v5.0.48: Leer configuración del usuario ANTES de obtener datos
    const settingsResult = await chrome.storage.local.get('notificationSettings');
    const userSettings = settingsResult.notificationSettings || {};

    // DIAGNÓSTICO: Loggear configuración leída
    log('🔍 [DIAGNÓSTICO] updateData() - Configuración leída:', {
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
    const oficial = await resolveDollarPrice(userSettings);

    // Obtener precios de USDT en paralelo
    const [usdt, usdtUsd] = await Promise.all([fetchUSDT(), fetchUSDTtoUSD()]);

    log('📊 Datos obtenidos:', { oficial: !!oficial, usdt: !!usdt, usdtUsd: !!usdtUsd });

    // DIAGNÓSTICO: Loggear detalles de datos obtenidos
    log('🔍 [DIAGNÓSTICO] updateData() - Datos obtenidos:', {
      oficial: oficial
        ? { compra: oficial.compra, venta: oficial.venta, source: oficial.source }
        : null,
      usdt: usdt ? Object.keys(usdt).length + ' exchanges' : null,
      usdtUsd: usdtUsd ? Object.keys(usdtUsd).length + ' exchanges' : null
    });

    if (!oficial || !usdt) {
      console.error('❌ [DIAGNÓSTICO] updateData() - Faltan datos básicos:', {
        oficial: !!oficial,
        usdt: !!usdt
      });
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
    log('🔍 [DIAGNÓSTICO] updateData() - Rutas calculadas:', {
      routeType: userSettings.routeType || 'arbitrage',
      totalRoutes: optimizedRoutes.length,
      firstRoute: optimizedRoutes[0]
        ? {
            broker: optimizedRoutes[0].broker,
            profitPercentage:
              optimizedRoutes[0].profitPercentage || optimizedRoutes[0].profitPercent
          }
        : null
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
    log('🔍 [DIAGNÓSTICO] updateData() - VERIFICACIÓN FINAL:', {
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
      console.error(
        '🔍 [DIAGNÓSTICO] Esto significa que NO se pudo obtener precio del dólar oficial'
      );
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

function handleGetArbitrages(request, sendResponse) {
  log('[BACKGROUND] 📥 Mensaje getArbitrages recibido');
  if (currentData) {
    log('[BACKGROUND] 📤 Enviando datos CACHEADOS al popup:', {
      rutasCount: currentData.optimizedRoutes?.length || 0
    });
    sendResponse(currentData);
    return false;
  }

  const MESSAGE_TIMEOUT_MS = 12000;
  let hasResponded = false;
  const safeSendResponse = payload => {
    if (hasResponded) return;
    hasResponded = true;
    sendResponse(payload);
  };

  const responseTimeoutId = setTimeout(() => {
    console.error(`⏰ [BACKGROUND] TIMEOUT: getArbitrages excedió ${MESSAGE_TIMEOUT_MS}ms`);
    safeSendResponse({
      timeout: true,
      backgroundUnhealthy: true,
      error: `Timeout interno del background (${MESSAGE_TIMEOUT_MS}ms)`,
      optimizedRoutes: [],
      arbitrages: []
    });
  }, MESSAGE_TIMEOUT_MS);

  updateData()
    .then(data => {
      clearTimeout(responseTimeoutId);
      safeSendResponse(data || { error: 'Error obteniendo datos', optimizedRoutes: [], arbitrages: [] });
    })
    .catch(error => {
      clearTimeout(responseTimeoutId);
      console.error('❌ [BACKGROUND] Error:', error);
      safeSendResponse({ error: error.message, optimizedRoutes: [], arbitrages: [] });
    });
  return true;
}

function handleRefresh(request, sendResponse) {
  updateData().then(data => {
    sendResponse(data || { optimizedRoutes: [], arbitrages: [] });
  });
  return true;
}

function handleSettingsUpdated(request, sendResponse) {
  log('[BACKGROUND] 📥 Recibido mensaje settingsUpdated');
  currentData = null;
  isFirstUpdate = false;
  updateData()
    .then(data => {
      sendResponse({ success: true, data });
    })
    .catch(error => {
      console.error('[BACKGROUND] ❌ Error recalculando datos:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true;
}

function handleNotImplemented(request, sendResponse) {
  log('[BACKGROUND] Acción no implementada en versión simplificada:', request.action);
  sendResponse({
    error: 'Función no disponible en esta versión',
    message: 'Esta funcionalidad requiere la versión modular del background'
  });
  return false;
}

function handleGetBanksData(request, sendResponse) {
  log('[BACKGROUND] 📥 Mensaje getBanksData recibido');
  chrome.storage.local
    .get('notificationSettings')
    .then(result => {
      const userSettings = result.notificationSettings || {};
      return Promise.all([
        fetchBankDollarRates(userSettings),
        fetchAllDollarTypes(userSettings),
        fetchUSDT(),
        fetchUSDTtoUSD(),
        fetchUSDT_USD_Brokers(userSettings),
        fetchBinanceP2P_USDT_ARS(userSettings),
        fetchBinanceP2P_USDT_USD(userSettings)
      ]);
    })
    .then(([banksData, dollarTypes, usdtData, usdtUsdData, usdtUsdBrokers, binanceP2PArs, binanceP2PUsd]) => {
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
    })
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
  return true;
}

function handleGetCryptoArbitrage(request, sendResponse) {
  log('[CRYPTO-ARB] 📥 Solicitud de crypto arbitrage recibida');
  const dataService = globalThis.self?.dataService ?? null;
  if (!dataService) {
    console.error('[CRYPTO-ARB] ❌ DataService no disponible en background');
    sendResponse({ routes: [], error: 'DataService no disponible' });
    return false;
  }
  if (!currentData?.oficial) {
    log('[CRYPTO-ARB] ⚠️ No hay datos disponibles (currentData es null)');
    sendResponse({ routes: [] });
    return false;
  }
  Promise.all([chrome.storage.local.get('notificationSettings'), dataService.getActiveCryptos()])
    .then(async ([settingsResult, activeCryptos]) => {
      try {
        const userSettings = settingsResult.notificationSettings || {};
        const cryptoData = await dataService.fetchAllCryptos(activeCryptos, 'ARS');
        if (!cryptoData || Object.keys(cryptoData).length === 0) {
          sendResponse({ routes: [] });
          return;
        }
        const routes = await calculateCryptoArbitrageRoutes(
          cryptoData,
          currentData.oficial,
          userSettings
        );
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
  return true;
}

const MESSAGE_HANDLERS = {
  getArbitrages: handleGetArbitrages,
  refresh: handleRefresh,
  settingsUpdated: handleSettingsUpdated,
  getBankRates: handleNotImplemented,
  recalculateWithCustomPrice: handleNotImplemented,
  getBanksData: handleGetBanksData,
  GET_CRYPTO_ARBITRAGE: handleGetCryptoArbitrage
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('[BACKGROUND] Mensaje recibido:', request.action);
  const action = request.type || request.action;
  const handler = MESSAGE_HANDLERS[action];
  if (!handler) {
    log('[BACKGROUND] Mensaje desconocido:', action);
    return false;
  }
  return handler(request, sendResponse);
});

log('[BACKGROUND] Listener registrado');

// ============================================
// LISTENER DE CAMBIOS EN CONFIGURACIÓN
// ============================================

function handleNotificationSettingsChange(oldSettings, newSettings) {
  log('⚙️ [STORAGE] Configuración cambió');

  const dollarSourceChanged = oldSettings.dollarPriceSource !== newSettings.dollarPriceSource;
  const manualPriceChanged = oldSettings.manualDollarPrice !== newSettings.manualDollarPrice;
  const bankMethodChanged = oldSettings.preferredBank !== newSettings.preferredBank;
  const defaultSimAmountChanged = oldSettings.defaultSimAmount !== newSettings.defaultSimAmount;
  const updateIntervalChanged =
    oldSettings.updateIntervalMinutes !== newSettings.updateIntervalMinutes;
  const requestTimeoutChanged =
    oldSettings.requestTimeoutSeconds !== newSettings.requestTimeoutSeconds;

  const requiresDataRefresh =
    dollarSourceChanged || manualPriceChanged || bankMethodChanged || defaultSimAmountChanged;

  if (requiresDataRefresh) {
    log('🔄 [STORAGE] Cambios relevantes detectados, forzando actualización...');
    log('   - Fuente dólar:', oldSettings.dollarPriceSource, '→', newSettings.dollarPriceSource);
    log('   - Precio manual:', oldSettings.manualDollarPrice, '→', newSettings.manualDollarPrice);
    log('   - Método banco:', oldSettings.preferredBank, '→', newSettings.preferredBank);
    log('   - Monto simulador:', oldSettings.defaultSimAmount, '→', newSettings.defaultSimAmount);

    updateData()
      .then(() => {
        log('✅ [STORAGE] Datos actualizados con nueva configuración');
      })
      .catch(error => {
        console.error('❌ [STORAGE] Error actualizando datos:', error);
      });
  }

  if (updateIntervalChanged) {
    log(
      `⏰ Intervalo cambió: ${oldSettings.updateIntervalMinutes}min → ${newSettings.updateIntervalMinutes}min`
    );
    log('🔄 Reiniciando actualizaciones periódicas...');
    startPeriodicUpdates();
  }

  if (updateIntervalChanged || requestTimeoutChanged) {
    if (requestTimeoutChanged) {
      log(
        `⏱️ Timeout cambió: ${oldSettings.requestTimeoutSeconds}s → ${newSettings.requestTimeoutSeconds}s`
      );
    }
    updateGlobalConfig();
  }
}

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
        headers: { Accept: 'application/vnd.github.v3+json' }
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

      log('✅ [UPDATE] Nueva versión disponible:', latestVersion);
    } else {
      log('✅ [UPDATE] Versión actualizada');
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
  const parse = v => v.replace('v', '').split('.').map(Number);
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
            log('🏦 Datos de bancos inicializados correctamente');

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

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'checkUpdates') {
    checkForUpdatesInBackground();
  }
});

// Listener unificado para cambios en configuración del usuario
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.notificationSettings) {
    const oldSettings = changes.notificationSettings.oldValue || {};
    const newSettings = changes.notificationSettings.newValue || {};

    handleNotificationSettingsChange(oldSettings, newSettings);
  }
});

log('[BACKGROUND] Listener de storage registrado');

log('[BACKGROUND] Background completamente inicializado');
