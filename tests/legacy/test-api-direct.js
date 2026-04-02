// ============================================
// SCRIPT DE TESTING Y VALIDACIÓN DE API
// Acceso directo a APIs para validar datos y rutas
// ============================================

console.log('🧪 Test: Acceso directo a APIs\n');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  apis: {
    bancos: 'https://criptoya.com/api/bancostodos',
    usdtArs: 'https://criptoya.com/api/USDT/ARS/1',
    usdtUsd: 'https://criptoya.com/api/USDT/USD/1'
  },
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

// ============================================
// UTILIDADES
// ============================================

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: CONFIG.headers
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Timeout al acceder a ${url}`);
    } else {
      console.error(`❌ Error al acceder a ${url}:`, error.message);
    }
    return null;
  }
}

// ============================================
// TEST 1: BANCOS
// ============================================

async function testBancosAPI() {
  console.log('\n🏦 Test 1: API de Bancos');
  console.log('====================================');
  
  const data = await fetchWithTimeout(CONFIG.apis.bancos);
  
  if (!data) {
    console.error('❌ No se pudieron obtener datos de bancos');
    return false;
  }
  
  const bankKeys = Object.keys(data);
  console.log(`✅ API responde correctamente`);
  console.log(`📊 Número total de bancos: ${bankKeys.length}`);
  console.log(`🏦 Primeros 10 bancos:`, bankKeys.slice(0, 10));
  
  // Validar estructura de datos
  console.log('\n🔍 Validando estructura de datos...');
  let validBanks = 0;
  let invalidBanks = 0;
  let suspiciousBanks = 0;
  let spreads = [];
  
  Object.entries(data).forEach(([bankCode, bankData]) => {
    if (!bankData || typeof bankData !== 'object') {
      console.error(`❌ ${bankCode}: Datos inválidos (no es objeto)`);
      invalidBanks++;
      return;
    }
    
    const hasAsk = typeof bankData.ask === 'number' && bankData.ask > 0;
    const hasBid = typeof bankData.bid === 'number' && bankData.bid > 0;
    const hasTotalAsk = typeof bankData.totalAsk === 'number' && bankData.totalAsk > 0;
    const hasTotalBid = typeof bankData.totalBid === 'number' && bankData.totalBid > 0;
    
    if (!hasAsk && !hasTotalAsk) {
      console.error(`❌ ${bankCode}: No tiene precio ask/totalAsk`);
      invalidBanks++;
      return;
    }
    
    if (!hasBid && !hasTotalBid) {
      console.error(`❌ ${bankCode}: No tiene precio bid/totalBid`);
      invalidBanks++;
      return;
    }
    
    const ask = bankData.ask || bankData.totalAsk;
    const bid = bankData.bid || bankData.totalBid;
    
    // VALIDACIÓN FUNDAMENTAL: ask > bid (spread positivo)
    if (ask <= bid) {
      console.error(`❌ ${bankCode}: ask (${ask}) <= bid (${bid}) - CAMPOS INVERTIDOS`);
      console.error(`   Esto es IMPOSIBLE: el banco vende más barato de lo que compra`);
      console.error(`   Spread negativo: ${(bid - ask).toFixed(2)}`);
      invalidBanks++;
      return;
    }
    
    // Validar spread razonable
    const spread = ask - bid;
    const spreadPercent = (spread / ask) * 100;
    spreads.push({ bankCode, ask, bid, spread, spreadPercent });
    
    if (spreadPercent < 0.1) {
      console.warn(`⚠️  ${bankCode}: Spread ${spreadPercent.toFixed(2)}% muy bajo (sospechoso)`);
      suspiciousBanks++;
    } else if (spreadPercent > 5) {
      console.warn(`⚠️ ${bankCode}: Spread ${spreadPercent.toFixed(2)}% muy alto (sospechoso)`);
      suspiciousBanks++;
    } else {
      validBanks++;
      console.log(`✅ ${bankCode}: ask=${ask}, bid=${bid}, spread=${spreadPercent.toFixed(2)}%`);
    }
  });
  
  console.log(`\n📊 Resumen de validación:`);
  console.log(`   • Bancos válidos: ${validBanks}`);
  console.log(`   • Bancos inválidos: ${invalidBanks}`);
  console.log(`   • Bancos sospechosos: ${suspiciousBanks}`);
  
  // Calcular spread promedio
  const avgSpread = spreads.reduce((sum, s) => sum + s.spreadPercent, 0) / spreads.length;
  console.log(`   • Spread promedio: ${avgSpread.toFixed(2)}%`);
  
  if (invalidBanks > 0) {
    console.error(`\n❌ CRÍTICO: ${invalidBanks} bancos tienen datos inválidos`);
    console.error(`   Estos bancos deben ser excluidos de los cálculos`);
  }
  
  if (suspiciousBanks > 0) {
    console.warn(`\n⚠️ ALERTA: ${suspiciousBanks} bancos tienen spreads anómalos`);
    console.warn(`   Se recomienda revisar estos bancos manualmente`);
  }
  
  return {
    success: true,
    totalBanks: bankKeys.length,
    validBanks,
    invalidBanks,
    suspiciousBanks,
    avgSpread,
    spreads
  };
}

// ============================================
// TEST 2: USDT/ARS
// ============================================

async function testUsdtArsAPI() {
  console.log('\n💎 Test 2: API de USDT/ARS');
  console.log('====================================');
  
  const data = await fetchWithTimeout(CONFIG.apis.usdtArs);
  
  if (!data) {
    console.error('❌ No se pudieron obtener datos de USDT/ARS');
    return false;
  }
  
  const exchangeKeys = Object.keys(data);
  console.log(`✅ API responde correctamente`);
  console.log(`📊 Número total de exchanges: ${exchangeKeys.length}`);
  console.log(`💎 Primeros 10 exchanges:`, exchangeKeys.slice(0, 10));
  
  // Validar estructura de datos
  console.log('\n🔍 Validando estructura de datos...');
  let validExchanges = 0;
  let invalidExchanges = 0;
  
  Object.entries(data).forEach(([exchangeCode, exchangeData]) => {
    if (!exchangeData || typeof exchangeData !== 'object') {
      console.error(`❌ ${exchangeCode}: Datos inválidos (no es objeto)`);
      invalidExchanges++;
      return;
    }
    
    const hasAsk = typeof exchangeData.ask === 'number' && exchangeData.ask > 0;
    const hasBid = typeof exchangeData.bid === 'number' && exchangeData.bid > 0;
    const hasTotalAsk = typeof exchangeData.totalAsk === 'number' && exchangeData.totalAsk > 0;
    const hasTotalBid = typeof exchangeData.totalBid === 'number' && exchangeData.totalBid > 0;
    const hasVolume = typeof exchangeData.volume === 'number';
    
    if (!hasAsk || !hasBid) {
      console.error(`❌ ${exchangeCode}: No tiene precios ask/bid`);
      invalidExchanges++;
      return;
    }
    
    const ask = exchangeData.ask || exchangeData.totalAsk;
    const bid = exchangeData.bid || exchangeData.totalBid;
    
    // Validar ask > bid
    if (ask <= bid) {
      console.error(`❌ ${exchangeCode}: ask (${ask}) <= bid (${bid}) - CAMPOS INVERTIDOS`);
      console.error(`   Spread negativo: ${(bid - ask).toFixed(2)}`);
      invalidExchanges++;
      return;
    }
    
    validExchanges++;
    console.log(`✅ ${exchangeCode}: ask=${ask}, bid=${bid}, volume=${exchangeData.volume || 'N/A'}`);
  });
  
  console.log(`\n📊 Resumen de validación:`);
  console.log(`   • Exchanges válidos: ${validExchanges}`);
  console.log(`   • Exchanges inválidos: ${invalidExchanges}`);
  
  return {
    success: true,
    totalExchanges: exchangeKeys.length,
    validExchanges,
    invalidExchanges
  };
}

// ============================================
// TEST 3: USDT/USD
// ============================================

async function testUsdtUsdAPI() {
  console.log('\n💱 Test 3: API de USDT/USD');
  console.log('====================================');
  
  const data = await fetchWithTimeout(CONFIG.apis.usdtUsd);
  
  if (!data) {
    console.error('❌ No se pudieron obtener datos de USDT/USD');
    return false;
  }
  
  const exchangeKeys = Object.keys(data);
  console.log(`✅ API responde correctamente`);
  console.log(`📊 Número total de exchanges: ${exchangeKeys.length}`);
  console.log(`💱 Primeros 10 exchanges:`, exchangeKeys.slice(0, 10));
  
  // Validar estructura de datos
  console.log('\n🔍 Validando estructura de datos...');
  let validExchanges = 0;
  let invalidExchanges = 0;
  
  Object.entries(data).forEach(([exchangeCode, exchangeData]) => {
    if (!exchangeData || typeof exchangeData !== 'object') {
      console.error(`❌ ${exchangeCode}: Datos inválidos (no es objeto)`);
      invalidExchanges++;
      return;
    }
    
    const hasAsk = typeof exchangeData.ask === 'number' && exchangeData.ask > 0;
    const hasBid = typeof exchangeData.bid === 'number' && exchangeData.bid > 0;
    const hasTotalAsk = typeof exchangeData.totalAsk === 'number' && exchangeData.totalAsk > 0;
    const hasTotalBid = typeof exchangeData.totalBid === 'number' && exchangeData.totalBid > 0;
    
    if (!hasAsk || !hasTotalAsk) {
      console.error(`❌ ${exchangeCode}: No tiene precio ask/totalAsk`);
      invalidExchanges++;
      return;
    }
    
    const ask = exchangeData.ask || exchangeData.totalAsk;
    
    validExchanges++;
    console.log(`✅ ${exchangeCode}: ask=${ask}, bid=${exchangeData.bid || 'N/A'}, volume=${exchangeData.volume || 'N/A'}`);
  });
  
  console.log(`\n📊 Resumen de validación:`);
  console.log(`   • Exchanges válidos: ${validExchanges}`);
  console.log(`   • Exchanges inválidos: ${invalidExchanges}`);
  
  return {
    success: true,
    totalExchanges: exchangeKeys.length,
    validExchanges,
    invalidExchanges
  };
}

// ============================================
// TEST 4: VALIDACIÓN DE RUTAS
// ============================================

async function testRouteCalculations() {
  console.log('\n🧮 Test 4: Validación de Cálculos de Rutas');
  console.log('====================================');
  
  // Obtener datos de las APIs
  console.log('\n📥 Obteniendo datos de APIs...');
  const [banksDataResult, usdtArsDataResult, usdtUsdDataResult] = await Promise.allSettled([
    testBancosAPI(),
    testUsdtArsAPI(),
    testUsdtUsdAPI()
  ]);

  const banksData = banksDataResult.status === 'fulfilled' ? banksDataResult.value : null;
  const usdtArsData = usdtArsDataResult.status === 'fulfilled' ? usdtArsDataResult.value : null;
  const usdtUsdData = usdtUsdDataResult.status === 'fulfilled' ? usdtUsdDataResult.value : null;
  
  if (!banksData?.success || !usdtArsData?.success || !usdtUsdData?.success) {
    console.error('❌ Error al obtener datos de APIs');
    return {
      success: false,
      consensusPrice: null,
      averagePrice: null,
      banksUsed: 0
    };
  }
  
  console.log(`\n✅ Datos obtenidos:`);
  console.log(`   • Bancos: ${banksData.validBanks} bancos válidos`);
  console.log(`   • USDT/ARS: ${usdtArsData.validExchanges} exchanges válidos`);
  console.log(`   • USDT/USD: ${usdtUsdData.validExchanges} exchanges válidos`);
  
  // Simular cálculo de consenso bancario
  console.log('\n🏦 Simulando cálculo de consenso bancario...');
  
  const bankPrices = Object.values(banksData.spreads || {})
    .filter(s => s.spreadPercent > 0.1 && s.spreadPercent < 5)
    .map(s => s.ask);
  
  if (bankPrices.length === 0) {
    console.warn('⚠️ No hay precios válidos para calcular consenso');
    return {
      success: false,
      consensusPrice: null,
      averagePrice: null,
      banksUsed: 0
    };
  }
  
  bankPrices.sort((a, b) => a - b);
  const mid = Math.floor(bankPrices.length / 2);
  const median = bankPrices.length % 2 === 0 ? (bankPrices[mid - 1] + bankPrices[mid]) / 2 : bankPrices[mid];
  
  console.log(`   Precio de consenso: $${median.toFixed(2)} ARS`);
  console.log(`   Bancos usados: ${bankPrices.length}`);
  
  // Simular cálculo de promedio bancario
  console.log('\n📊 Simulando cálculo de promedio bancario...');
  const avgPrice = bankPrices.reduce((sum, price) => sum + price, 0) / bankPrices.length;

  if (!Number.isFinite(median) || !Number.isFinite(avgPrice)) {
    console.error('❌ Cálculo inválido de consenso/promedio (NaN o infinito)');
    return {
      success: false,
      consensusPrice: null,
      averagePrice: null,
      banksUsed: bankPrices.length
    };
  }
  console.log(`   Precio promedio: $${avgPrice.toFixed(2)} ARS`);
  console.log(`   Bancos usados: ${bankPrices.length}`);
  
  return {
    success: true,
    consensusPrice: median,
    averagePrice: avgPrice,
    banksUsed: bankPrices.length
  };
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function runAllTests() {
  console.log('\n🚀 Iniciando todos los tests...\n');
  console.log('====================================\n');
  
  const results = {
    bancos: await testBancosAPI(),
    usdtArs: await testUsdtArsAPI(),
    usdtUsd: await testUsdtUsdAPI(),
    routes: await testRouteCalculations()
  };
  
  console.log('\n📊 Resumen General de Tests:');
  console.log('====================================');
  
  console.log(`🏦 Test Bancos:`);
  console.log(`   • Total bancos: ${results.bancos.totalBanks}`);
  console.log(`   • Válidos: ${results.bancos.validBanks}`);
  console.log(`   • Inválidos: ${results.bancos.invalidBanks}`);
  console.log(`   • Sospechosos: ${results.bancos.suspiciousBanks}`);
  console.log(`   • Spread promedio: ${results.bancos.avgSpread.toFixed(2)}%`);
  
  console.log(`\n💎 Test USDT/ARS:`);
  console.log(`   • Total exchanges: ${results.usdtArs.totalExchanges}`);
  console.log(`   • Válidos: ${results.usdtArs.validExchanges}`);
  console.log(`   • Inválidos: ${results.usdtArs.invalidExchanges}`);
  
  console.log(`\n💱 Test USDT/USD:`);
  console.log(`   • Total exchanges: ${results.usdtUsd.totalExchanges}`);
  console.log(`   • Válidos: ${results.usdtUsd.validExchanges}`);
  console.log(`   • Inválidos: ${results.usdtUsd.invalidExchanges}`);
  
  console.log(`\n🧮 Test Rutas:`);
  console.log(`   • Precio consenso: ${results.routes.consensusPrice !== null ? `$${results.routes.consensusPrice.toFixed(2)} ARS` : 'N/A'}`);
  console.log(`   • Precio promedio: ${results.routes.averagePrice !== null ? `$${results.routes.averagePrice.toFixed(2)} ARS` : 'N/A'}`);
  console.log(`   • Bancos usados: ${results.routes.banksUsed}`);
  
  console.log('\n✅ Todos los tests completados');
  
  return results;
}

// ============================================
// EJECUTAR
// ============================================

(async () => {
  try {
    await runAllTests();
    console.log('\n🎯 Tests finalizados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  }
})();
