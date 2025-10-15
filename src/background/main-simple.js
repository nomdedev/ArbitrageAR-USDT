// ============================================
// MAIN BACKGROUND SCRIPT - VERSIÓN SIMPLIFICADA (SIN MÓDULOS)
// Solo usar si "type": "module" no funciona en tu navegador
// ============================================

console.log('🔧 [BACKGROUND] Iniciando service worker...');

// ============================================
// CONFIGURACIÓN INLINE
// ============================================

const DEBUG_MODE = false; // PRODUCCIÓN: Desactivado después de diagnosticar problema
// NUEVO v5.0.54: Configuraciones dinámicas (se cargan desde userSettings)
let REQUEST_INTERVAL = 100; // ms - OPTIMIZADO v5.0.61: Reducido de 600ms a 100ms
let REQUEST_TIMEOUT = 10000; // ms - valor por defecto
let ENABLE_RATE_LIMIT = false; // NUEVO v5.0.61: Desactivar rate limit por defecto

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
    REQUEST_INTERVAL = Math.max(100, (userSettings.updateIntervalMinutes || 5) * 60 * 1000 / 50); // Dividido por 50 en lugar de 10
    REQUEST_TIMEOUT = (userSettings.requestTimeoutSeconds || 10) * 1000; // Convertir segundos a ms
    
    log(`⚙️ Configuración global actualizada: intervalo=${REQUEST_INTERVAL}ms, timeout=${REQUEST_TIMEOUT}ms`);
  } catch (error) {
    log('⚠️ Error actualizando configuración global:', error);
    // Mantener valores por defecto
    REQUEST_INTERVAL = 600;
    REQUEST_TIMEOUT = 10000;
  }
}

let lastRequestTime = 0;

// ============================================
// FUNCIONES DE FETCH INLINE
// ============================================

async function fetchWithRateLimit(url) {
  // OPTIMIZADO v5.0.61: Rate limit opcional para mejorar performance
  if (ENABLE_RATE_LIMIT) {
    const now = Date.now();
    const delay = REQUEST_INTERVAL - (now - lastRequestTime);
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }
    lastRequestTime = Date.now();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return await res.json();
  } catch(e) {
    console.warn('Fetch error:', url, e.message);
    return null;
  }
}

async function fetchDolarOficial(userSettings) {
  const url = userSettings.dolarApiUrl || 'https://dolarapi.com/v1/dolares/oficial';
  const data = await fetchWithRateLimit(url);
  if (data && typeof data.compra === 'number' && typeof data.venta === 'number') {
    // NUEVO v5.0.45: Agregar información de fuente para mostrar en UI
    return {
      ...data,
      source: 'dolarapi_oficial',
      timestamp: Date.now()
    };
  }
  return null;
}

async function fetchUSDT(userSettings) {
  const url = userSettings.criptoyaUsdtArsUrl || 'https://criptoya.com/api/usdt/ars/1';
  return await fetchWithRateLimit(url);
}

async function fetchUSDTtoUSD(userSettings) {
  const url = userSettings.criptoyaUsdtUsdUrl || 'https://criptoya.com/api/usdt/usd/1';
  return await fetchWithRateLimit(url);
}

// ============================================
// CÁLCULO DE RUTAS SIMPLIFICADO
// ============================================

async function calculateSimpleRoutes(oficial, usdt, usdtUsd) {
  log('🔍 [CALC] Iniciando cálculo de rutas...');
  log('🔍 [CALC] oficial:', oficial);
  log('🔍 [CALC] usdt:', usdt ? Object.keys(usdt).length + ' exchanges' : 'null');
  log('🔍 [CALC] usdtUsd:', usdtUsd ? Object.keys(usdtUsd).length + ' exchanges' : 'null');
  
  if (!oficial || !usdt) {
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
    
    log(`⚙️ [CALC] Configuración cargada:`, {
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
  const officialPrice = oficial.compra;
  const applyFees = userSettings.applyFeesInCalculation || false; // false por defecto
  
  log(`🔍 [CALC] Precio oficial USD: $${officialPrice} ARS`);
  log(`🔍 [CALC] Monto inicial: $${initialAmount.toLocaleString()} ARS`);
  log(`🔍 [CALC] Aplicar fees: ${applyFees ? 'SÍ' : 'NO'}`);
  log(`🔍 [CALC] Procesando ${Object.keys(usdt).length} exchanges...`);
  
  // Iterar exchanges
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const [exchange, data] of Object.entries(usdt)) {
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
    const brokerFeeConfig = brokerFees.find(fee => 
      fee.broker.toLowerCase() === exchange.toLowerCase()
    );
    
    // ============================================
    // CÁLCULO CORRECTO PASO A PASO
    // ============================================
    
    // PASO 1: Comprar USD con ARS (oficial)
    const usdPurchased = initialAmount / officialPrice;
    log(`💵 [${exchange}] PASO 1: $${initialAmount} ARS / ${officialPrice} = ${usdPurchased.toFixed(4)} USD`);
    
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
        log(`🧮 [${exchange}] PASO 2: Calculando USDT/USD = ${usdtArsPrice} ARS / ${officialPrice} ARS = ${usdToUsdtRate.toFixed(4)}`);
        log(`📊 [${exchange}] Tasa calculada: ${usdToUsdtRate.toFixed(4)} (rango válido: 0.95-1.15)`);
      } else {
        // El cálculo dio un valor fuera de rango razonable
        log(`❌ [${exchange}] SALTANDO: Tasa calculada ${calculatedRate.toFixed(4)} fuera de rango válido (0.95-1.15)`);
        log(`   USDT/ARS: ${usdtArsPrice}, USD/ARS: ${officialPrice}`);
        skippedCount++;
        continue; // Saltar este exchange
      }
    } else {
      // Caso 3: No tenemos datos suficientes para calcular
      log(`❌ [${exchange}] SALTANDO: Sin datos para calcular USDT/USD`);
      log(`   API USDT/USD: No disponible`);
      log(`   Fallback calculado: Datos insuficientes (USDT/ARS o USD/ARS faltante)`);
      skippedCount++;
      continue; // Saltar este exchange
    }
    
    // Convertir USD → USDT
    const usdtPurchased = usdPurchased / usdToUsdtRate;
    log(`💎 [${exchange}] PASO 2: ${usdPurchased.toFixed(4)} USD / ${usdToUsdtRate.toFixed(4)} = ${usdtPurchased.toFixed(4)} USDT`);
    
    // PASO 3: Aplicar fee de trading (%)
    let usdtAfterFees = usdtPurchased;
    let tradingFeeAmount = 0;
    
    if (applyFees) {
      // NUEVO v5.0.52: Usar fee específico por broker (ya definido arriba)
      let tradingFeePercent = userSettings.extraTradingFee || 0;
      
      if (brokerFeeConfig) {
        // Usar fee específico del broker para compra (buyFee)
        tradingFeePercent = brokerFeeConfig.buyFee || 0;
        log(`💸 [${exchange}] PASO 3: Usando fee específico del broker: ${tradingFeePercent}% (buy)`);
      } else if (userSettings.extraTradingFee) {
        log(`💸 [${exchange}] PASO 3: Usando fee general: ${tradingFeePercent}%`);
      }
      
      if (tradingFeePercent > 0) {
        tradingFeeAmount = usdtPurchased * (tradingFeePercent / 100);
        usdtAfterFees = usdtPurchased - tradingFeeAmount;
        log(`💸 [${exchange}] PASO 3: Fee trading ${tradingFeePercent}% = ${tradingFeeAmount.toFixed(4)} USDT`);
        log(`💎 [${exchange}] PASO 3: USDT después de fee = ${usdtAfterFees.toFixed(4)} USDT`);
      }
    }
    
    // PASO 3.5: Vender USDT por ARS (CORREGIDO v5.0.58)
    const sellPrice = data.totalBid; // Precio de venta USDT/ARS
    const arsFromSale = usdtAfterFees * sellPrice;
    log(`💰 [${exchange}] PASO 3.5: Vender ${usdtAfterFees.toFixed(4)} USDT × ${sellPrice} = $${arsFromSale.toFixed(2)} ARS`);
    
    // PASO 4: Aplicar fee de venta específico del broker (si existe)
    let arsAfterSellFee = arsFromSale;
    let sellFeeAmount = 0;
    
    if (applyFees) {
      // Usar brokerFeeConfig ya definido arriba
      if (brokerFeeConfig && brokerFeeConfig.sellFee > 0) {
        const sellFeePercent = brokerFeeConfig.sellFee / 100;
        sellFeeAmount = arsFromSale * sellFeePercent;
        arsAfterSellFee = arsFromSale - sellFeeAmount;
        log(`💸 [${exchange}] PASO 4b: Fee venta específico ${brokerFeeConfig.sellFee}% = $${sellFeeAmount.toFixed(2)} ARS`);
        log(`💰 [${exchange}] PASO 4b: ARS después de fee venta = $${arsAfterSellFee.toFixed(2)} ARS`);
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
        log(`💸 [${exchange}] PASO 5: Fees fijos = $${totalFixedFees} ARS (retiro: $${withdrawalFee}, transfer: $${transferFee}, banco: $${bankFee})`);
        log(`💰 [${exchange}] PASO 5: Final = $${finalAmount.toFixed(2)} ARS`);
      }
    }
    
    // PASO 6: Calcular ganancia
    const grossProfit = arsFromSale - initialAmount;
    const netProfit = finalAmount - initialAmount;
    const grossPercent = (grossProfit / initialAmount) * 100;
    const netPercent = (netProfit / initialAmount) * 100;
    
    log(`📊 [${exchange}] RESULTADO: Ganancia neta = $${netProfit.toFixed(2)} (${netPercent.toFixed(4)}%)`);
    
    // MEJORADO v5.0.64: Removido filtro hardcodeado -10% para permitir que usuario controle desde configuración
    // Ahora el filtro de visualización se controla en popup.js con filterMinProfit (configurable -10% a +20%)
    
    // Calcular total de fees
    const totalFees = tradingFeeAmount * sellPrice + sellFeeAmount + withdrawalFee + transferFee + bankFee;
    
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
        usdtUsdWarning: usingFallback ? 'Tasa USDT/USD calculada indirectamente. Verificar en CriptoYa.' : null
      }
    });
  }
  
  // Ordenar por rentabilidad neta
  routes.sort((a, b) => b.profitPercent - a.profitPercent);
  
  log(`✅ [CALC] Procesados: ${processedCount}, Saltados: ${skippedCount}, Rutas generadas: ${routes.length}`);
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
    const brokerFeeConfig = brokerFees.find(fee =>
      fee.broker.toLowerCase() === exchange.toLowerCase()
    );

    // PASO 1: Vender USDT directamente por ARS
    const sellPrice = data.totalBid; // Precio de venta USDT/ARS
    const arsFromSale = initialUsdtAmount * sellPrice;

    log(`💰 [${exchange}] Venta directa: ${initialUsdtAmount} USDT × ${sellPrice} = $${arsFromSale.toFixed(2)} ARS`);

    // PASO 2: Aplicar fee de venta si está configurado
    let arsAfterFee = arsFromSale;
    let sellFeeAmount = 0;

    if (userSettings.applyFeesInCalculation && brokerFeeConfig?.sellFee > 0) {
      const sellFeePercent = brokerFeeConfig.sellFee / 100;
      sellFeeAmount = arsFromSale * sellFeePercent;
      arsAfterFee = arsFromSale - sellFeeAmount;
      log(`💸 [${exchange}] Fee venta ${brokerFeeConfig.sellFee}% = $${sellFeeAmount.toFixed(2)} ARS`);
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
    const profitArs = finalAmount - (initialUsdtAmount * sellPrice); // Negativo porque aplicamos fees
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
    const brokerFeeConfig = brokerFees.find(fee =>
      fee.broker.toLowerCase() === exchange.toLowerCase()
    );

    // PASO 1: Calcular tasa USDT/USD
    let usdToUsdtRate;
    let rateSource = 'unknown';

    if (usdtUsd?.[exchange]?.totalAsk) {
      // Caso 1: Cotización directa
      usdToUsdtRate = usdtUsd[exchange].totalAsk;
      rateSource = 'direct_api';
      log(`💱 [${exchange}] Tasa USDT/USD directa: ${usdToUsdtRate}`);
    } else if (data.totalAsk && oficial.compra) {
      // Caso 2: Calcular indirectamente
      const usdtArsPrice = data.totalAsk;
      const calculatedRate = usdtArsPrice / oficial.compra;

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
      log(`💸 [${exchange}] Fee compra ${brokerFeeConfig.buyFee}% = ${buyFeeAmount.toFixed(4)} USDT`);
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

  log(`✅ [CALC] Cálculo completado:`, {
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
  return results[routeType.replace('direct_usdt_ars', 'directUsdtArs').replace('usd_to_usdt', 'usdToUsdt')] || [];
}

// ============================================
// ESTADO GLOBAL
// ============================================

let currentData = null;
let lastUpdate = null;

// ============================================
// ACTUALIZACIÓN DE DATOS
// ============================================

async function updateData() {
  log('🔄 Actualizando datos...');
  
  try {
    // NUEVO v5.0.48: Leer configuración del usuario ANTES de obtener datos
    const settingsResult = await chrome.storage.local.get('notificationSettings');
    const userSettings = settingsResult.notificationSettings || {};
    
    log('⚙️ Configuración del usuario:', {
      dollarPriceSource: userSettings.dollarPriceSource,
      manualDollarPrice: userSettings.manualDollarPrice,
      preferredBank: userSettings.preferredBank
    });
    
    // Decidir cómo obtener el precio del dólar oficial
    let oficial;
    if (userSettings.dollarPriceSource === 'manual') {
      // Usar precio manual configurado por el usuario
      const manualPrice = userSettings.manualDollarPrice || 950;
      log(`💵 Usando precio manual: $${manualPrice}`);
      oficial = {
        compra: manualPrice,
        venta: manualPrice,
        source: 'manual',
        timestamp: Date.now()
      };
    } else {
      // Usar API automática
      log('🌐 Obteniendo precio desde DolarAPI...');
      oficial = await fetchDolarOficial(userSettings);
    }
    
    // Obtener precios de USDT en paralelo
    const [usdt, usdtUsd] = await Promise.all([
      fetchUSDT(userSettings),
      fetchUSDTtoUSD(userSettings)
    ]);
    
    log('📊 Datos obtenidos:', { oficial: !!oficial, usdt: !!usdt, usdtUsd: !!usdtUsd });
    
    if (!oficial || !usdt) {
      log('❌ Faltan datos básicos');
      return null;
    }
    
    // CORREGIDO v5.0.47: Usar await porque calculateAllRoutes es async
    // MEJORADO v5.0.75: Calcular todos los tipos de rutas según configuración
    const routeType = userSettings.routeType || 'arbitrage'; // 'arbitrage', 'direct_usdt_ars', 'usd_to_usdt', 'all'
    const optimizedRoutes = await calculateAllRoutes(oficial, usdt, usdtUsd, { ...userSettings, routeType });
    
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
    log('[BACKGROUND] Procesando getArbitrages...');
    
    // Si hay datos en cache, devolverlos inmediatamente
    if (currentData) {
      log('[BACKGROUND] Enviando datos cacheados:', currentData.optimizedRoutes?.length || 0, 'rutas');
      sendResponse(currentData);
      return false; // CORREGIDO: Respuesta síncrona, no mantener canal
    } else {
      // Actualizar datos de forma asíncrona
      updateData().then(data => {
        log('[BACKGROUND] Enviando datos frescos:', data?.optimizedRoutes?.length || 0, 'rutas');
        sendResponse(data || {
          error: 'Error obteniendo datos',
          optimizedRoutes: [],
          arbitrages: []
        });
      }).catch(error => {
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
  
  // NUEVO v5.0.46: Manejar mensajes no implementados
  if (request.action === 'getBankRates' || request.action === 'recalculateWithCustomPrice') {
    log('[BACKGROUND] Acción no implementada en versión simplificada:', request.action);
    sendResponse({ 
      error: 'Función no disponible en esta versión',
      message: 'Esta funcionalidad requiere la versión modular del background'
    });
    return false; // Respuesta síncrona
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
      updateData().then(() => {
        log('✅ [STORAGE] Datos actualizados con nueva configuración');
      }).catch(error => {
        console.error('❌ [STORAGE] Error actualizando datos:', error);
      });
    }
  }
});

log('[BACKGROUND] Listener de storage registrado');

// ============================================
// INICIALIZACIÓN
// ============================================

log('[BACKGROUND] Cargando configuración global...');
updateGlobalConfig().then(() => {
  log('[BACKGROUND] Iniciando primera actualización...');
  updateData().then(() => {
    log('[BACKGROUND] Primera actualización completada');
  }).catch(error => {
    console.error('❌ [BACKGROUND] Error en inicialización:', error);
  });
}).catch(error => {
  console.error('❌ [BACKGROUND] Error cargando configuración:', error);
});

// Actualización periódica (se actualizará dinámicamente)
let updateIntervalId = null;

async function startPeriodicUpdates() {
  // Limpiar intervalo anterior si existe
  if (updateIntervalId) {
    clearInterval(updateIntervalId);
  }
  
  // Obtener configuración actual
  const result = await chrome.storage.local.get('notificationSettings');
  const userSettings = result.notificationSettings || {};
  const intervalMinutes = userSettings.updateIntervalMinutes || 5;
  const intervalMs = intervalMinutes * 60 * 1000;
  
  log(`⏰ Configurando actualización periódica cada ${intervalMinutes} minutos (${intervalMs}ms)`);
  
  updateIntervalId = setInterval(() => {
    log('⏰ Actualización periódica...');
    updateData();
  }, intervalMs);
}

// Iniciar actualizaciones periódicas
startPeriodicUpdates();

// Listener para cambios en configuración del usuario
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.notificationSettings) {
    const oldSettings = changes.notificationSettings.oldValue || {};
    const newSettings = changes.notificationSettings.newValue || {};
    
    // Si cambió el monto por defecto, recalcular rutas
    if (oldSettings.defaultSimAmount !== newSettings.defaultSimAmount) {
      log(`💰 Monto por defecto cambió: $${oldSettings.defaultSimAmount} → $${newSettings.defaultSimAmount}`);
      log('🔄 Recalculando rutas con nuevo monto...');
      updateData().then(() => {
        log('✅ Rutas recalculadas con nuevo monto');
      });
    }
    
    // NUEVO v5.0.54: Si cambió el intervalo de actualización, reiniciar el timer
    if (oldSettings.updateIntervalMinutes !== newSettings.updateIntervalMinutes) {
      log(`⏰ Intervalo cambió: ${oldSettings.updateIntervalMinutes}min → ${newSettings.updateIntervalMinutes}min`);
      log('🔄 Reiniciando actualizaciones periódicas...');
      startPeriodicUpdates();
    }
    
    // Si cambió el timeout, actualizar configuración global
    if (oldSettings.requestTimeoutSeconds !== newSettings.requestTimeoutSeconds) {
      log(`⏱️ Timeout cambió: ${oldSettings.requestTimeoutSeconds}s → ${newSettings.requestTimeoutSeconds}s`);
      updateGlobalConfig();
    }
  }
});

log('[BACKGROUND] Background completamente inicializado');
