// ============================================
// TEST v5.0.73: Validación de exchanges con/sin datos USD/USDT
// ============================================

console.log('🧪 TEST v5.0.73: Filtrado de exchanges sin USD/USDT\n');

// Simular función getValidExchanges() simplificada
function getValidExchanges(usdt, usdtUsd) {
  const excludedKeys = ['time', 'timestamp', 'fecha', 'date', 'p2p', 'total'];
  
  const buyExchanges = Object.keys(usdt).filter(key => {
    // Validar que tenga datos en USDT/ARS
    if (typeof usdt[key] !== 'object' || usdt[key] === null) {
      console.log(`❌ ${key}: Sin datos USDT/ARS válidos`);
      return false;
    }
    
    if (excludedKeys.includes(key.toLowerCase())) {
      console.log(`🚫 ${key}: Clave excluida`);
      return false;
    }

    // NUEVO v5.0.73: Solo usar exchanges con datos USD/USDT reales
    if (!usdtUsd?.[key]) {
      console.log(`❌ ${key}: Sin datos USD/USDT en API, excluyendo (no usar fallbacks)`);
      return false;
    }

    const askPrice = parseFloat(usdtUsd[key].totalAsk || usdtUsd[key].ask);
    
    // Validar que el precio USD/USDT sea válido y realista
    if (!askPrice || isNaN(askPrice) || askPrice <= 0) {
      console.log(`❌ ${key}: Precio USD/USDT inválido (${askPrice}), excluyendo`);
      return false;
    }

    // Rechazar si es exactamente 1.0 (sin spread, sospechoso)
    if (askPrice === 1.0) {
      console.log(`⚠️ ${key}: USD/USDT = 1.0 exacto (sin spread real), excluyendo`);
      return false;
    }
    
    // Rechazar si está fuera del rango esperado (0.95 - 1.15)
    if (askPrice < 0.95 || askPrice > 1.15) {
      console.log(`⚠️ ${key}: USD/USDT fuera de rango (${askPrice}), excluyendo`);
      return false;
    }

    console.log(`✅ ${key}: USD/USDT = ${askPrice.toFixed(4)} (válido)`);
    return true;
  });

  return {
    buyExchanges,
    sellExchanges: [...buyExchanges]
  };
}

// ============================================
// TEST 1: Exchanges SIN datos USD/USDT deben ser rechazados
// ============================================

console.log('📊 TEST 1: Rechazar exchanges sin USD/USDT\n');

const mockUsdtArs1 = {
  'buenbit': { ask: 1180, totalAsk: 1180, bid: 1150, totalBid: 1150 },
  'ripio': { ask: 1190, totalAsk: 1190, bid: 1160, totalBid: 1160 },    // ❌ Sin USD/USDT
  'lemon': { ask: 1185, totalAsk: 1185, bid: 1155, totalBid: 1155 },    // ❌ Sin USD/USDT
  'belo': { ask: 1175, totalAsk: 1175, bid: 1145, totalBid: 1145 }      // ✅ Tiene USD/USDT
};

const mockUsdtUsd1 = {
  'buenbit': { ask: 1.03, totalAsk: 1.03, bid: 1.005, totalBid: 1.005 },
  // 'ripio': NO EXISTE en API
  // 'lemon': NO EXISTE en API
  'belo': { ask: 1.04, totalAsk: 1.04, bid: 1.02, totalBid: 1.02 }
};

const result1 = getValidExchanges(mockUsdtArs1, mockUsdtUsd1);

console.log('\n📋 Resultado TEST 1:');
console.log('Exchanges válidos:', result1.buyExchanges);
console.log('Total:', result1.buyExchanges.length);

// Validaciones
const test1_buenbit = result1.buyExchanges.includes('buenbit');
const test1_belo = result1.buyExchanges.includes('belo');
const test1_ripio = !result1.buyExchanges.includes('ripio');
const test1_lemon = !result1.buyExchanges.includes('lemon');

console.log('\n✅ Validaciones TEST 1:');
console.log(test1_buenbit ? '✅' : '❌', 'Buenbit incluido (tiene USD/USDT)');
console.log(test1_belo ? '✅' : '❌', 'Belo incluido (tiene USD/USDT)');
console.log(test1_ripio ? '✅' : '❌', 'Ripio excluido (sin USD/USDT)');
console.log(test1_lemon ? '✅' : '❌', 'Lemon excluido (sin USD/USDT)');

const test1_passed = test1_buenbit && test1_belo && test1_ripio && test1_lemon;

// ============================================
// TEST 2: Precios USD/USDT inválidos deben ser rechazados
// ============================================

console.log('\n\n📊 TEST 2: Rechazar precios USD/USDT inválidos\n');

const mockUsdtArs2 = {
  'exchange1': { ask: 1180, totalAsk: 1180, bid: 1150, totalBid: 1150 },
  'exchange2': { ask: 1180, totalAsk: 1180, bid: 1150, totalBid: 1150 },
  'exchange3': { ask: 1180, totalAsk: 1180, bid: 1150, totalBid: 1150 },
  'exchange4': { ask: 1180, totalAsk: 1180, bid: 1150, totalBid: 1150 },
  'exchange5': { ask: 1180, totalAsk: 1180, bid: 1150, totalBid: 1150 }
};

const mockUsdtUsd2 = {
  'exchange1': { ask: 1.03, totalAsk: 1.03 },      // ✅ Válido
  'exchange2': { ask: 0, totalAsk: 0 },            // ❌ Precio = 0
  'exchange3': { ask: 1.0, totalAsk: 1.0 },        // ❌ Exactamente 1.0 (sin spread)
  'exchange4': { ask: 0.90, totalAsk: 0.90 },      // ❌ Fuera de rango (<0.95)
  'exchange5': { ask: 1.20, totalAsk: 1.20 }       // ❌ Fuera de rango (>1.15)
};

const result2 = getValidExchanges(mockUsdtArs2, mockUsdtUsd2);

console.log('\n📋 Resultado TEST 2:');
console.log('Exchanges válidos:', result2.buyExchanges);
console.log('Total:', result2.buyExchanges.length);

// Validaciones
const test2_valid = result2.buyExchanges.includes('exchange1');
const test2_zero = !result2.buyExchanges.includes('exchange2');
const test2_one = !result2.buyExchanges.includes('exchange3');
const test2_low = !result2.buyExchanges.includes('exchange4');
const test2_high = !result2.buyExchanges.includes('exchange5');

console.log('\n✅ Validaciones TEST 2:');
console.log(test2_valid ? '✅' : '❌', 'Exchange1 incluido (precio válido 1.03)');
console.log(test2_zero ? '✅' : '❌', 'Exchange2 excluido (precio = 0)');
console.log(test2_one ? '✅' : '❌', 'Exchange3 excluido (precio = 1.0 exacto)');
console.log(test2_low ? '✅' : '❌', 'Exchange4 excluido (precio < 0.95)');
console.log(test2_high ? '✅' : '❌', 'Exchange5 excluido (precio > 1.15)');

const test2_passed = test2_valid && test2_zero && test2_one && test2_low && test2_high;

// ============================================
// TEST 3: Simulación con datos reales de CriptoYa
// ============================================

console.log('\n\n📊 TEST 3: Simulación con estructura real de CriptoYa\n');

const mockUsdtArs3 = {
  'buenbit': { ask: 1180.5, totalAsk: 1180.5, bid: 1150.2, totalBid: 1150.2 },
  'satoshitango': { ask: 1185.3, totalAsk: 1192.4, bid: 1155.8, totalBid: 1148.7 },
  'decrypto': { ask: 1182.0, totalAsk: 1193.3, bid: 1152.5, totalBid: 1135.8 },
  'letsbit': { ask: 1177.2, totalAsk: 1177.2, bid: 1147.3, totalBid: 1147.3 },
  'binancep2p': { ask: 1190.0, totalAsk: 1190.0, bid: 1170.5, totalBid: 1170.5 },
  'belo': { ask: 1175.8, totalAsk: 1175.8, bid: 1145.4, totalBid: 1145.4 },
  'ripio': { ask: 1188.3, totalAsk: 1188.3, bid: 1158.7, totalBid: 1158.7 },
  'lemon': { ask: 1183.5, totalAsk: 1183.5, bid: 1153.2, totalBid: 1153.2 }
};

// Simular respuesta real de CriptoYa API (sin ripio ni lemon)
const mockUsdtUsd3 = {
  'buenbit': { ask: 1.03, totalAsk: 1.03, bid: 1.005, totalBid: 1.005, time: 1760371853 },
  'satoshitango': { ask: 1.052, totalAsk: 1.0573, bid: 1.03, totalBid: 1.0249, time: 1760371878 },
  'decrypto': { ask: 1.053, totalAsk: 1.0567, bid: 1.025, totalBid: 1.0092, time: 1760371879 },
  'letsbit': { ask: 1.0263, totalAsk: 1.0263, bid: 0.994, totalBid: 0.994, time: 1760371850 },
  'binancep2p': { ask: 1.045, totalAsk: 1.045, bid: 1.027, totalBid: 1.027, time: 1760371872 },
  'belo': { ask: 1.04, totalAsk: 1.04, bid: 1.02, totalBid: 1.02, time: 1760371875 }
  // ripio: NO EXISTE
  // lemon: NO EXISTE
};

const result3 = getValidExchanges(mockUsdtArs3, mockUsdtUsd3);

console.log('\n📋 Resultado TEST 3:');
console.log('Exchanges válidos:', result3.buyExchanges);
console.log('Total:', result3.buyExchanges.length);

// Validaciones
const expectedIncluded = ['buenbit', 'satoshitango', 'decrypto', 'letsbit', 'binancep2p', 'belo'];
const expectedExcluded = ['ripio', 'lemon'];

const test3_included = expectedIncluded.every(ex => result3.buyExchanges.includes(ex));
const test3_excluded = expectedExcluded.every(ex => !result3.buyExchanges.includes(ex));

console.log('\n✅ Validaciones TEST 3:');
console.log(test3_included ? '✅' : '❌', 'Todos los exchanges con USD/USDT incluidos');
console.log(test3_excluded ? '✅' : '❌', 'Ripio y Lemon excluidos (sin USD/USDT)');
console.log(result3.buyExchanges.length === 6 ? '✅' : '❌', 'Total correcto: 6 exchanges');

const test3_passed = test3_included && test3_excluded && result3.buyExchanges.length === 6;

// ============================================
// TEST 4: Edge cases
// ============================================

console.log('\n\n📊 TEST 4: Edge cases\n');

const mockUsdtArs4 = {
  'exchange_null': null,
  'exchange_string': 'invalid',
  'exchange_number': 123,
  'exchange_valid': { ask: 1180, totalAsk: 1180, bid: 1150, totalBid: 1150 },
  'time': 1234567890,
  'timestamp': 1234567890
};

const mockUsdtUsd4 = {
  'exchange_valid': { ask: 1.03, totalAsk: 1.03 }
};

const result4 = getValidExchanges(mockUsdtArs4, mockUsdtUsd4);

console.log('\n📋 Resultado TEST 4:');
console.log('Exchanges válidos:', result4.buyExchanges);
console.log('Total:', result4.buyExchanges.length);

// Validaciones
const test4_valid = result4.buyExchanges.includes('exchange_valid');
const test4_null = !result4.buyExchanges.includes('exchange_null');
const test4_string = !result4.buyExchanges.includes('exchange_string');
const test4_number = !result4.buyExchanges.includes('exchange_number');
const test4_time = !result4.buyExchanges.includes('time');
const test4_timestamp = !result4.buyExchanges.includes('timestamp');

console.log('\n✅ Validaciones TEST 4:');
console.log(test4_valid ? '✅' : '❌', 'Exchange válido incluido');
console.log(test4_null ? '✅' : '❌', 'Exchange null excluido');
console.log(test4_string ? '✅' : '❌', 'Exchange string excluido');
console.log(test4_number ? '✅' : '❌', 'Exchange number excluido');
console.log(test4_time ? '✅' : '❌', 'Clave "time" excluida');
console.log(test4_timestamp ? '✅' : '❌', 'Clave "timestamp" excluida');

const test4_passed = test4_valid && test4_null && test4_string && test4_number && test4_time && test4_timestamp;

// ============================================
// RESUMEN FINAL
// ============================================

console.log('\n\n' + '='.repeat(60));
console.log('📊 RESUMEN FINAL DE TESTS v5.0.73');
console.log('='.repeat(60));

const allPassed = test1_passed && test2_passed && test3_passed && test4_passed;

console.log('\nResultados:');
console.log(test1_passed ? '✅' : '❌', 'TEST 1: Filtrado de exchanges sin USD/USDT');
console.log(test2_passed ? '✅' : '❌', 'TEST 2: Validación de precios USD/USDT');
console.log(test3_passed ? '✅' : '❌', 'TEST 3: Simulación datos reales CriptoYa');
console.log(test4_passed ? '✅' : '❌', 'TEST 4: Edge cases y validaciones');

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ TODOS LOS TESTS PASARON - v5.0.73 VÁLIDO');
} else {
  console.log('❌ ALGUNOS TESTS FALLARON - REVISAR IMPLEMENTACIÓN');
}
console.log('='.repeat(60) + '\n');

// Exportar para otros tests si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getValidExchanges };
}
