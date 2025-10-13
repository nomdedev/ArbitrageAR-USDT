/**
 * TEST: Validación de Fallback USDT/USD con Rango de Seguridad
 * Verifica que se saltan exchanges con datos inválidos o insuficientes
 * 
 * Relacionado con: HOTFIX v5.0.63
 */

console.log('🧪 TEST: Validación de Fallback USDT/USD (v5.0.63)\n');

// ============================================
// DATOS DE PRUEBA
// ============================================

const officialPrice = 1000; // USD oficial = 1000 ARS
const MIN_RATE = 0.95;
const MAX_RATE = 1.15;

// ============================================
// FUNCIÓN DE VALIDACIÓN (simulando el código real)
// ============================================

function processExchange(exchangeName, usdtUsdApi, usdtArsPrice) {
  console.log(`\n📊 Procesando: ${exchangeName}`);
  console.log('─'.repeat(60));
  
  let usdToUsdtRate;
  let usingFallback = false;
  let shouldSkip = false;
  let reason = '';
  
  if (usdtUsdApi) {
    // Caso 1: Tenemos cotización directa
    usdToUsdtRate = usdtUsdApi;
    console.log(`✅ Cotización directa de API: ${usdToUsdtRate}`);
  } else if (usdtArsPrice && officialPrice) {
    // Caso 2: Calculamos USDT/USD
    const calculatedRate = usdtArsPrice / officialPrice;
    
    if (calculatedRate >= MIN_RATE && calculatedRate <= MAX_RATE) {
      usdToUsdtRate = calculatedRate;
      usingFallback = true;
      console.log(`⚠️  No hay cotización directa en API`);
      console.log(`🧮 Calculando: ${usdtArsPrice} ARS / ${officialPrice} ARS = ${calculatedRate.toFixed(4)}`);
      console.log(`📊 Tasa calculada: ${calculatedRate.toFixed(4)} (rango válido: ${MIN_RATE}-${MAX_RATE})`);
    } else {
      shouldSkip = true;
      reason = `Tasa calculada ${calculatedRate.toFixed(4)} fuera de rango válido (${MIN_RATE}-${MAX_RATE})`;
      console.log(`❌ SALTANDO: ${reason}`);
      console.log(`   USDT/ARS: ${usdtArsPrice}, USD/ARS: ${officialPrice}`);
    }
  } else {
    // Caso 3: No hay datos suficientes
    shouldSkip = true;
    reason = 'Sin datos para calcular USDT/USD';
    console.log(`❌ SALTANDO: ${reason}`);
    console.log(`   API USDT/USD: No disponible`);
    console.log(`   USDT/ARS: ${usdtArsPrice || 'Faltante'}`);
  }
  
  return {
    exchange: exchangeName,
    usdToUsdtRate,
    usingFallback,
    shouldSkip,
    reason,
    source: usdtUsdApi ? 'api' : (usingFallback ? 'calculated' : null),
    warning: usingFallback ? 'Tasa USDT/USD calculada indirectamente. Verificar en CriptoYa.' : null
  };
}

// ============================================
// TEST CASES
// ============================================

console.log('🧪 CASOS DE PRUEBA');
console.log('='.repeat(60));

// Caso 1: Exchange con API directa (Buenbit)
const case1 = processExchange('Buenbit', 1.034, 1034);

// Caso 2: Exchange sin API, cálculo válido (RipioExchange)
const case2 = processExchange('RipioExchange', null, 1050);

// Caso 3: Exchange sin API, cálculo en límite inferior (válido)
const case3 = processExchange('CheapExchange', null, 950); // 0.95

// Caso 4: Exchange sin API, cálculo en límite superior (válido)
const case4 = processExchange('ExpensiveExchange', null, 1150); // 1.15

// Caso 5: Exchange sin API, cálculo DEMASIADO BAJO (inválido)
const case5 = processExchange('TooLowExchange', null, 500); // 0.50

// Caso 6: Exchange sin API, cálculo DEMASIADO ALTO (inválido)
const case6 = processExchange('TooHighExchange', null, 2000); // 2.00

// Caso 7: Exchange sin API y sin datos de USDT/ARS
const case7 = processExchange('NoDataExchange', null, null);

// ============================================
// VALIDACIONES
// ============================================

console.log('\n\n✅ VALIDACIONES FINALES');
console.log('='.repeat(60));

let allTestsPassed = true;

// Test 1: Buenbit debe usar API directa sin skip
if (case1.source === 'api' && !case1.shouldSkip && !case1.warning) {
  console.log('✅ TEST 1 PASA: Buenbit usa API directa (sin skip, sin warning)');
} else {
  console.log('❌ TEST 1 FALLA: Buenbit no usa API correctamente');
  allTestsPassed = false;
}

// Test 2: RipioExchange debe calcular fallback con warning
if (case2.source === 'calculated' && !case2.shouldSkip && case2.warning) {
  console.log('✅ TEST 2 PASA: RipioExchange calcula fallback válido con warning');
} else {
  console.log('❌ TEST 2 FALLA: RipioExchange no calcula correctamente');
  allTestsPassed = false;
}

// Test 3: Límite inferior (0.95) debe ser VÁLIDO
if (case3.usdToUsdtRate === 0.95 && !case3.shouldSkip) {
  console.log('✅ TEST 3 PASA: Límite inferior 0.95 es VÁLIDO (no se salta)');
} else {
  console.log('❌ TEST 3 FALLA: Límite inferior no funciona correctamente');
  allTestsPassed = false;
}

// Test 4: Límite superior (1.15) debe ser VÁLIDO
if (case4.usdToUsdtRate === 1.15 && !case4.shouldSkip) {
  console.log('✅ TEST 4 PASA: Límite superior 1.15 es VÁLIDO (no se salta)');
} else {
  console.log('❌ TEST 4 FALLA: Límite superior no funciona correctamente');
  allTestsPassed = false;
}

// Test 5: Valor demasiado bajo (0.50) debe ser RECHAZADO
if (case5.shouldSkip && case5.reason.includes('fuera de rango')) {
  console.log('✅ TEST 5 PASA: Valor 0.50 es RECHAZADO correctamente');
} else {
  console.log('❌ TEST 5 FALLA: Valor demasiado bajo no se rechaza');
  allTestsPassed = false;
}

// Test 6: Valor demasiado alto (2.00) debe ser RECHAZADO
if (case6.shouldSkip && case6.reason.includes('fuera de rango')) {
  console.log('✅ TEST 6 PASA: Valor 2.00 es RECHAZADO correctamente');
} else {
  console.log('❌ TEST 6 FALLA: Valor demasiado alto no se rechaza');
  allTestsPassed = false;
}

// Test 7: Sin datos debe ser RECHAZADO
if (case7.shouldSkip && case7.reason.includes('Sin datos')) {
  console.log('✅ TEST 7 PASA: Exchange sin datos es RECHAZADO correctamente');
} else {
  console.log('❌ TEST 7 FALLA: Exchange sin datos no se rechaza');
  allTestsPassed = false;
}

// Test 8: Solo 4 exchanges de 7 deben procesarse
const processedCount = [case1, case2, case3, case4, case5, case6, case7].filter(c => !c.shouldSkip).length;
if (processedCount === 4) {
  console.log(`✅ TEST 8 PASA: Solo ${processedCount}/7 exchanges procesados (3 saltados correctamente)`);
} else {
  console.log(`❌ TEST 8 FALLA: ${processedCount}/7 procesados (esperado: 4)`);
  allTestsPassed = false;
}

// Test 9: Solo 3 deben tener warning
const warningCount = [case1, case2, case3, case4, case5, case6, case7].filter(c => c.warning).length;
if (warningCount === 3) {
  console.log(`✅ TEST 9 PASA: ${warningCount} exchanges con warning (los que usan fallback)`);
} else {
  console.log(`❌ TEST 9 FALLA: ${warningCount} warnings (esperado: 3)`);
  allTestsPassed = false;
}

// ============================================
// RESUMEN
// ============================================

console.log('\n' + '='.repeat(60));
if (allTestsPassed) {
  console.log('🎉 TODOS LOS TESTS PASARON');
  console.log('✅ La validación de fallback funciona correctamente');
  console.log('✅ Exchanges con datos inválidos se saltan');
  console.log('✅ Exchanges sin datos se saltan');
  console.log('✅ Exchanges con fallback válido muestran warning');
} else {
  console.log('❌ ALGUNOS TESTS FALLARON');
  console.log('⚠️  Revisar la implementación de validación');
}
console.log('='.repeat(60));

// ============================================
// TABLA RESUMEN
// ============================================

console.log('\n📋 TABLA RESUMEN DE RESULTADOS');
console.log('='.repeat(60));

const cases = [case1, case2, case3, case4, case5, case6, case7];

console.log('Exchange           | Source     | Rate   | Skip | Warning');
console.log('-'.repeat(60));

cases.forEach(c => {
  const exchange = c.exchange.padEnd(18);
  const source = (c.source || 'N/A').padEnd(10);
  const rate = c.usdToUsdtRate ? c.usdToUsdtRate.toFixed(4).padEnd(6) : 'N/A   ';
  const skip = c.shouldSkip ? '✅' : '❌';
  const warning = c.warning ? '⚠️' : '  ';
  
  console.log(`${exchange} | ${source} | ${rate} | ${skip}  | ${warning}`);
});

console.log('-'.repeat(60));
console.log(`Total procesados: ${processedCount}/7`);
console.log(`Total saltados: ${7 - processedCount}/7`);
console.log(`Total con warning: ${warningCount}/7`);
console.log('='.repeat(60));

// ============================================
// EJEMPLO DE UI
// ============================================

console.log('\n📱 EJEMPLO DE UI PARA RIPIOEXCHANGE (con fallback)');
console.log('='.repeat(60));
console.log(`
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Convertir USD a USDT                                    │
│                                                             │
│ Tasa: 1,050 USD = 1 USDT → 952.38 USDT                     │
│                                                             │
│ ╔═══════════════════════════════════════════════════════╗  │
│ ║ ℹ️ Tasa USDT/USD calculada indirectamente.           ║  │
│ ║ Verificar en CriptoYa.                                ║  │
│ ╚═══════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────┘
`);

console.log('📱 EJEMPLO DE UI PARA BUENBIT (con API directa)');
console.log('='.repeat(60));
console.log(`
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Convertir USD a USDT                                    │
│                                                             │
│ Tasa: 1,034 USD = 1 USDT → 967.12 USDT                     │
│                                                             │
│ (Sin advertencia - datos de API oficial)                   │
└─────────────────────────────────────────────────────────────┘
`);
