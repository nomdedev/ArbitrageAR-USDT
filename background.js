// Modo debug: cambiar a true para ver logs detallados en desarrollo
const DEBUG_MODE = true; // ⚠️ Temporalmente activado para diagnosticar

const REQUEST_INTERVAL = 600; // ms (110 req/min max)
let lastRequestTime = 0;

// Comisiones típicas por exchange (en porcentaje)
const EXCHANGE_FEES = {
  'binance': { trading: 0.1, withdrawal: 0 },
  'buenbit': { trading: 0.5, withdrawal: 0 },
  'ripio': { trading: 1.0, withdrawal: 0 },
  'ripioexchange': { trading: 1.0, withdrawal: 0 },
  'letsbit': { trading: 0.5, withdrawal: 0 },
  'satoshitango': { trading: 1.0, withdrawal: 0 },
  'belo': { trading: 0.8, withdrawal: 0 },
  'tiendacrypto': { trading: 0.5, withdrawal: 0 },
  'cryptomkt': { trading: 0.5, withdrawal: 0 },
  'cryptomktpro': { trading: 0.5, withdrawal: 0 },
  'bitso': { trading: 0.5, withdrawal: 0 },
  'bitsoalpha': { trading: 0.5, withdrawal: 0 },
  'lemoncash': { trading: 0.8, withdrawal: 0 },
  'universalcoins': { trading: 0.8, withdrawal: 0 },
  'decrypto': { trading: 0.8, withdrawal: 0 },
  'fiwind': { trading: 0.8, withdrawal: 0 },
  'vitawallet': { trading: 0.8, withdrawal: 0 },
  'saldo': { trading: 0.5, withdrawal: 0 },
  'pluscrypto': { trading: 0.8, withdrawal: 0 },
  'bybit': { trading: 0.1, withdrawal: 0 },
  'eluter': { trading: 0.8, withdrawal: 0 },
  'trubit': { trading: 0.8, withdrawal: 0 },
  'cocoscrypto': { trading: 0.8, withdrawal: 0 },
  'wallbit': { trading: 0.8, withdrawal: 0 },
  // P2P exchanges (fees más altos por spread inherente)
  'binancep2p': { trading: 1.5, withdrawal: 0 },
  'okexp2p': { trading: 1.5, withdrawal: 0 },
  'paxfulp2p': { trading: 2.0, withdrawal: 0 },
  'huobip2p': { trading: 1.5, withdrawal: 0 },
  'bybitp2p': { trading: 1.5, withdrawal: 0 },
  'kucoinp2p': { trading: 1.5, withdrawal: 0 },
  'bitgetp2p': { trading: 1.5, withdrawal: 0 },
  'paydecep2p': { trading: 1.5, withdrawal: 0 },
  'eldoradop2p': { trading: 2.0, withdrawal: 0 },
  'bingxp2p': { trading: 1.5, withdrawal: 0 },
  'lemoncashp2p': { trading: 1.5, withdrawal: 0 },
  'coinexp2p': { trading: 1.5, withdrawal: 0 },
  'mexcp2p': { trading: 1.5, withdrawal: 0 },
  'default': { trading: 0.5, withdrawal: 0 } // Valores por defecto conservadores
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

  // 🔴 FIX CRÍTICO: Cache si APIs fallan
  if (!oficial || !usdt || !usdtUsd) {
    console.error('Error fetching data');
    const cached = await chrome.storage.local.get(['optimizedRoutes', 'lastUpdate']);
    if (cached.optimizedRoutes && cached.optimizedRoutes.length > 0) {
      if (DEBUG_MODE) console.warn('⚠️ APIs caídas, usando datos en cache');
      await chrome.storage.local.set({ 
        error: '⚠️ Datos desactualizados (APIs no disponibles)',
        lastUpdate: cached.lastUpdate || Date.now(),
        usingCache: true
      });
      return; // Mantener datos anteriores
    }
    await chrome.storage.local.set({ 
      error: 'No se pudieron obtener los datos de las APIs',
      lastUpdate: Date.now(),
      usingCache: false
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
    
    // Si no hay USD/USDT rate para este exchange, usar ratio por defecto de 1.05
    // Esto permite calcular arbitrajes incluso sin datos específicos de USD/USDT
    const DEFAULT_USD_USDT_RATE = 1.05;
    let usdToUsdtRate = DEFAULT_USD_USDT_RATE;
    
    if (exchangeUsdRate && typeof exchangeUsdRate === 'object') {
      usdToUsdtRate = parseFloat(exchangeUsdRate.totalAsk) || parseFloat(exchangeUsdRate.ask) || DEFAULT_USD_USDT_RATE;
    } else if (DEBUG_MODE) {
      console.log(`⚠️ ${exchangeName}: Usando USD/USDT rate por defecto (${DEFAULT_USD_USDT_RATE})`);
    }
    
    // Precios USDT/ARS
    const usdtArsAsk = parseFloat(exchange.totalAsk) || parseFloat(exchange.ask) || 0; // Comprar USDT con ARS
    const usdtArsBid = parseFloat(exchange.totalBid) || parseFloat(exchange.bid) || 0; // Vender USDT por ARS
    
    // Validaciones estrictas
    if (usdtArsBid <= 0 || usdToUsdtRate <= 0) {
      if (DEBUG_MODE) {
        console.log(`❌ ${exchangeName}: Precios inválidos (USDT/ARS=${usdtArsBid}, USD/USDT=${usdToUsdtRate})`);
      }
      return;
    }
    if (officialSellPrice <= 0) return;
    
    // Filtrar spreads muy altos en ARS (posible P2P)
    const spreadArs = ((usdtArsAsk - usdtArsBid) / usdtArsBid) * 100;
    // 🔧 Relajado de 10% a 50% para incluir P2P
    if (Math.abs(spreadArs) > 50) {
      if (DEBUG_MODE) console.warn(`${exchangeName} spread ARS extremo (${spreadArs.toFixed(2)}%), omitiendo`);
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
      if (DEBUG_MODE) {
        console.error(`Cálculo inválido para ${exchangeName}`);
      }
      return;
    }
    
    // Mostrar TODOS los arbitrajes incluso NEGATIVOS (para análisis de mercado)
    // Usuario pidió ver incluso cuando son pérdidas
    // Solo notificaremos los que superen 1% en la función showNotification
    if (netProfitPercent >= -5.0) {
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

  // Calcular salud del mercado
  const marketHealth = calculateMarketHealth(top20);

  // NUEVO: Calcular rutas multi-exchange optimizadas
  const optimizedRoutes = calculateOptimizedRoutes(oficial, usdt, usdtUsd);

  await chrome.storage.local.set({ 
    official: oficial, 
    usdt: usdt, 
    arbitrages: top20,
    optimizedRoutes: optimizedRoutes, // NUEVO: Rutas multi-exchange
    marketHealth: marketHealth,
    lastUpdate: Date.now(),
    error: null // Limpiar errores previos
  });
  
  // Verificar si debe enviar notificaciones
  await checkAndNotify(top20);
}

// Calcular salud del mercado basado en oportunidades
function calculateMarketHealth(arbitrages) {
  if (!arbitrages || arbitrages.length === 0) {
    return {
      status: 'SIN DATOS',
      color: 'gray',
      icon: '⚪',
      message: 'No hay datos de mercado disponibles'
    };
  }

  const best = arbitrages[0];
  const profitable = arbitrages.filter(a => a.profitPercent > 0).length;
  const good = arbitrages.filter(a => a.profitPercent > 2).length;
  const excellent = arbitrages.filter(a => a.profitPercent > 5).length;

  if (excellent > 0) {
    return {
      status: 'EXCELENTE',
      color: '#10b981',
      icon: '🟢',
      message: `${excellent} oportunidad${excellent > 1 ? 'es' : ''} >5% - ¡Momento ideal!`,
      bestProfit: best.profitPercent,
      bestExchange: best.broker
    };
  }

  if (good > 0) {
    return {
      status: 'BUENO',
      color: '#10b981',
      icon: '🟢',
      message: `${good} oportunidad${good > 1 ? 'es' : ''} >2% - Rentable`,
      bestProfit: best.profitPercent,
      bestExchange: best.broker
    };
  }

  if (profitable > 0) {
    return {
      status: 'REGULAR',
      color: '#f59e0b',
      icon: '🟡',
      message: `${profitable} oportunidad${profitable > 1 ? 'es' : ''} <2% - Margen bajo`,
      bestProfit: best.profitPercent,
      bestExchange: best.broker
    };
  }

  return {
    status: 'MALO',
    color: '#ef4444',
    icon: '🔴',
    message: `Todas las opciones negativas - Mejor: ${best.broker} (${best.profitPercent.toFixed(2)}%)`,
    bestProfit: best.profitPercent,
    bestExchange: best.broker
  };
}

// NUEVO v5.0.0: Calcular TODAS las rutas (single + multi-exchange)
function calculateOptimizedRoutes(oficial, usdt, usdtUsd) {
  if (DEBUG_MODE) console.log('🔀 Iniciando calculateOptimizedRoutes...');
  
  if (!oficial || !usdt || !usdtUsd) {
    if (DEBUG_MODE) console.warn('⚠️ Datos faltantes en calculateOptimizedRoutes');
    return [];
  }

  const officialSellPrice = parseFloat(oficial.venta) || 0;
  const initialAmount = 100000; // $100,000 ARS base
  const excludedKeys = ['time', 'timestamp', 'fecha', 'date', 'p2p', 'total'];
  
  // 🔴 FIX CRÍTICO: Validar precio oficial
  if (!officialSellPrice || officialSellPrice <= 0) {
    if (DEBUG_MODE) console.warn('⚠️ Precio oficial inválido');
    return [];
  }
  
  if (DEBUG_MODE) console.log(`   Precio oficial: $${officialSellPrice} ARS`);
  
  // Fees de transferencia entre exchanges (en USD)
  const TRANSFER_FEES = {
    'TRC20': 1,      // USDT Tron - más barato
    'ERC20': 15,     // USDT Ethereum - caro
    'BEP20': 0.8,    // USDT BSC - barato
    'default': 1     // Por defecto
  };

  const routes = [];

  // Obtener todos los exchanges válidos
  const buyExchanges = Object.keys(usdt).filter(key => {
    return typeof usdt[key] === 'object' && 
           usdt[key] !== null && 
           !excludedKeys.includes(key.toLowerCase());
  });

  const sellExchanges = [...buyExchanges];
  
  // 🔴 FIX CRÍTICO: Validar que hay exchanges
  if (buyExchanges.length === 0 || sellExchanges.length === 0) {
    if (DEBUG_MODE) console.warn('⚠️ No hay exchanges disponibles');
    return [];
  }
  
  if (DEBUG_MODE) console.log(`   Exchanges disponibles: ${buyExchanges.length}`);

  // Para cada combinación de exchange de compra y venta
  buyExchanges.forEach(buyExchange => {
    const buyData = usdt[buyExchange];
    const buyUsdRate = usdtUsd[buyExchange];
    
    if (!buyData || !buyUsdRate) return;

    sellExchanges.forEach(sellExchange => {
      const sellData = usdt[sellExchange];
      if (!sellData) return;
      
      // ✅ CAMBIO: Permitir rutas single-exchange (mismo broker)
      const isSingleExchange = (buyExchange === sellExchange);
      
      // 🔴 FIX CRÍTICO: Validar precios razonables (100-10000 ARS)
      const sellBid = parseFloat(sellData.totalBid) || parseFloat(sellData.bid) || 0;
      if (sellBid < 100 || sellBid > 10000) {
        if (DEBUG_MODE) console.warn(`⚠️ Precio inválido en ${sellExchange}: ${sellBid}`);
        return;
      }

      // PASO 1: Comprar USD oficial (sin fees, ya incluido en el precio oficial)
      const usdPurchased = initialAmount / officialSellPrice;

      // PASO 2: Comprar USDT en buyExchange con USD
      const usdToUsdtRate = parseFloat(buyUsdRate.totalAsk) || parseFloat(buyUsdRate.ask) || 1.05;
      
      // 🔴 FIX CRÍTICO: Validar división por cero
      if (!usdToUsdtRate || usdToUsdtRate <= 0) {
        if (DEBUG_MODE) console.warn(`⚠️ USD/USDT rate inválido para ${buyExchange}: ${usdToUsdtRate}`);
        return;
      }
      
      // Calcular USDT obtenidos (USD ÷ rate)
      const usdtPurchased = usdPurchased / usdToUsdtRate;
      
      // Aplicar fee de compra (solo una vez)
      const buyFees = EXCHANGE_FEES[buyExchange.toLowerCase()] || EXCHANGE_FEES['default'];
      const usdtAfterBuyFee = usdtPurchased * (1 - buyFees.trading / 100);

      // PASO 3: Transferir USDT (o $0 si es mismo exchange)
      const transferFeeUSD = isSingleExchange ? 0 : TRANSFER_FEES['TRC20'];
      
      // Convertir fee USD a USDT para restar
      const transferFeeUSDT = transferFeeUSD / usdToUsdtRate;
      const usdtAfterTransfer = usdtAfterBuyFee - transferFeeUSDT;

      if (usdtAfterTransfer <= 0) return; // No vale la pena

      // PASO 4: Vender USDT por ARS en sellExchange
      const usdtArsBid = parseFloat(sellData.totalBid) || parseFloat(sellData.bid) || 0;
      
      if (usdtArsBid <= 0) return;

      // Vender USDT directo (USDT × precio_ARS)
      const arsFromSale = usdtAfterTransfer * usdtArsBid;
      
      // Aplicar fees de venta y retiro
      const sellFees = EXCHANGE_FEES[sellExchange.toLowerCase()] || EXCHANGE_FEES['default'];
      const arsAfterSellFee = arsFromSale * (1 - sellFees.trading / 100);
      const finalAmount = arsAfterSellFee * (1 - sellFees.withdrawal / 100);

      // Calcular ganancia neta
      const netProfit = finalAmount - initialAmount;
      const netProfitPercent = (netProfit / initialAmount) * 100;

      // DEBUG: Log de ejemplo para verificar cálculo
      if (DEBUG_MODE && routes.length === 0) {
        console.log('📊 EJEMPLO DE CÁLCULO:');
        console.log(`   1. Inversión: $${initialAmount.toLocaleString()} ARS`);
        console.log(`   2. Comprar USD: ${initialAmount} / ${officialSellPrice} = ${usdPurchased.toFixed(2)} USD`);
        console.log(`   3. Comprar USDT: ${usdPurchased.toFixed(2)} / ${usdToUsdtRate} = ${usdtPurchased.toFixed(2)} USDT`);
        console.log(`   4. Fee compra (${buyFees.trading}%): ${usdtAfterBuyFee.toFixed(2)} USDT`);
        console.log(`   5. Fee transfer: -${transferFeeUSDT.toFixed(2)} USDT = ${usdtAfterTransfer.toFixed(2)} USDT`);
        console.log(`   6. Vender USDT: ${usdtAfterTransfer.toFixed(2)} × ${usdtArsBid} = $${arsFromSale.toFixed(2)} ARS`);
        console.log(`   7. Fee venta (${sellFees.trading}%): $${arsAfterSellFee.toFixed(2)} ARS`);
        console.log(`   8. Fee retiro (${sellFees.withdrawal}%): $${finalAmount.toFixed(2)} ARS`);
        console.log(`   ✅ GANANCIA: $${netProfit.toFixed(2)} ARS (${netProfitPercent.toFixed(2)}%)`);
      }

      // Solo guardar si es >= -5% para análisis
      if (netProfitPercent >= -5) {
        routes.push({
          buyExchange: buyExchange.replace(/[<>\"']/g, ''), // 🔒 Sanitizar XSS
          sellExchange: sellExchange.replace(/[<>\"']/g, ''),
          profitPercent: netProfitPercent,
          officialPrice: officialSellPrice,
          usdToUsdtRate: usdToUsdtRate,
          usdtArsBid: usdtArsBid,
          transferFeeUSD: transferFeeUSD,
          transferFeeUSDT: transferFeeUSDT,
          isSingleExchange: isSingleExchange, // ✅ Flag para UI
          network: isSingleExchange ? 'N/A' : 'TRC20',
          calculation: {
            initial: initialAmount,
            usdPurchased: usdPurchased,
            usdtPurchased: usdtPurchased,
            usdtAfterBuyFee: usdtAfterBuyFee,
            usdtAfterTransfer: usdtAfterTransfer,
            arsFromSale: arsFromSale,
            finalAmount: finalAmount,
            netProfit: netProfit
          },
          fees: {
            buy: buyFees.trading,
            sell: sellFees.trading,
            transfer: transferFeeUSD,
            withdrawal: sellFees.withdrawal,
            total: buyFees.trading * 2 + sellFees.trading * 2 + sellFees.withdrawal
          }
        });
      }
    });
  });

  // Ordenar por ganancia y devolver top 20 (incluye single + multi-exchange)
  routes.sort((a, b) => b.profitPercent - a.profitPercent);
  
  if (DEBUG_MODE) {
    console.log(`🔀 calculateOptimizedRoutes: ${routes.length} rutas calculadas`);
    if (routes.length > 0) {
      console.log(`   Mejor ruta: ${routes[0].buyExchange} → ${routes[0].sellExchange} (${routes[0].profitPercent.toFixed(2)}%)`);
    }
  }
  
  return routes.slice(0, 20);
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
    // 🔴 FIX CRÍTICO: Enviar optimizedRoutes y marketHealth al popup
    chrome.storage.local.get([
      'official', 
      'usdt', 
      'arbitrages', 
      'optimizedRoutes', 
      'marketHealth', 
      'lastUpdate', 
      'error',
      'usingCache'
    ], (data) => {
      if (DEBUG_MODE) {
        console.log('📤 Enviando al popup:', {
          optimizedRoutes: data.optimizedRoutes?.length || 0,
          arbitrages: data.arbitrages?.length || 0,
          marketHealth: data.marketHealth?.status
        });
      }
      sendResponse(data);
    });
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
