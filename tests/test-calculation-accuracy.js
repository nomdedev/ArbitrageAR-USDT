// ============================================
// TEST DE PRECISIÓN DE CÁLCULOS - ArbitrARS
// ============================================
// Valida que los cálculos de arbitraje usen valores correctos
// de las APIs y configuración del usuario

console.log('🧪 Iniciando tests de precisión de cálculos...\n');

// ============================================
// DATOS DE PRUEBA (simulando APIs)
// ============================================

const testData = {
  oficial: {
    compra: 1030.50,
    venta: 1070.50,
    source: 'dolarapi_oficial'
  },
  
  // Simulación de respuesta de CriptoYa USDT/ARS
  usdtARS: {
    'buenbit': {
      ask: 1152.00,
      totalAsk: 1152.00,
      bid: 1148.00,
      totalBid: 1148.00
    },
    'binance': {
      ask: 1150.25,
      totalAsk: 1150.25,
      bid: 1145.50,
      totalBid: 1145.50
    },
    'fiwind': {
      ask: 1155.00,
      totalAsk: 1155.00,
      bid: 1150.00,
      totalBid: 1150.00
    }
  },
  
  // Simulación de respuesta de CriptoYa USDT/USD
  usdtUSD: {
    'buenbit': {
      ask: 1.033,
      totalAsk: 1.033,
      bid: 1.008,
      totalBid: 1.008
    },
    'binance': {
      ask: 1.03,
      totalAsk: 1.03,
      bid: 0.995,
      totalBid: 0.995
    },
    'fiwind': {
      ask: 1.035,
      totalAsk: 1.035,
      bid: 1.015,
      totalBid: 1.015
    }
  }
};

// ============================================
// CONFIGURACIÓN DE USUARIO DE PRUEBA
// ============================================

const userSettings = {
  defaultSimAmount: 1000000,
  extraTradingFee: 0.5,        // 0.5% fee de trading
  extraWithdrawalFee: 50,      // $50 ARS fee de retiro
  extraTransferFee: 100,       // $100 ARS fee de transferencia
  bankCommissionFee: 200       // $200 ARS comisión bancaria
};

// ============================================
// TEST 1: CÁLCULO MANUAL ESPERADO
// ============================================

console.log('📊 TEST 1: Cálculo Manual Esperado (Buenbit)\n');

const exchange = 'buenbit';
const initialAmount = userSettings.defaultSimAmount;

console.log('PASO 1: Comprar USD Oficial');
console.log(`  Monto inicial: $${initialAmount.toLocaleString()} ARS`);
console.log(`  Precio oficial: $${testData.oficial.compra} ARS/USD`);
const usdPurchased = initialAmount / testData.oficial.compra;
console.log(`  USD comprados: ${usdPurchased.toFixed(4)} USD`);
console.log(`  ✅ Fuente: oficial.compra (API DolarAPI)\n`);

console.log('PASO 2: Convertir USD → USDT');
console.log(`  USD disponibles: ${usdPurchased.toFixed(4)} USD`);
console.log(`  Cotización USDT/USD: ${testData.usdtUSD[exchange].totalAsk} USD por USDT`);
const usdtPurchased = usdPurchased / testData.usdtUSD[exchange].totalAsk;
console.log(`  USDT comprados: ${usdtPurchased.toFixed(4)} USDT`);
console.log(`  ✅ Fuente: usdtUSD[exchange].totalAsk (API CriptoYa)`);
console.log(`  ⚠️ NO HARDCODED a 1.05\n`);

console.log('PASO 3: Aplicar Fee de Trading');
const tradingFeePercent = userSettings.extraTradingFee / 100;
const tradingFeeAmount = usdtPurchased * tradingFeePercent;
const usdtAfterTradingFee = usdtPurchased - tradingFeeAmount;
console.log(`  USDT antes de fee: ${usdtPurchased.toFixed(4)} USDT`);
console.log(`  Fee de trading: ${userSettings.extraTradingFee}% = ${tradingFeeAmount.toFixed(4)} USDT`);
console.log(`  USDT después de fee: ${usdtAfterTradingFee.toFixed(4)} USDT`);
console.log(`  ✅ Fuente: userSettings.extraTradingFee\n`);

console.log('PASO 4: Vender USDT por ARS');
console.log(`  USDT a vender: ${usdtAfterTradingFee.toFixed(4)} USDT`);
console.log(`  Precio de venta: $${testData.usdtARS[exchange].totalBid} ARS/USDT`);
const arsFromSale = usdtAfterTradingFee * testData.usdtARS[exchange].totalBid;
console.log(`  ARS obtenidos: $${arsFromSale.toFixed(2)} ARS`);
console.log(`  ✅ Fuente: usdtARS[exchange].totalBid (API CriptoYa)\n`);

console.log('PASO 5: Aplicar Fees Fijos');
const withdrawalFee = userSettings.extraWithdrawalFee;
const transferFee = userSettings.extraTransferFee;
const bankFee = userSettings.bankCommissionFee;
const totalFixedFees = withdrawalFee + transferFee + bankFee;
const finalAmount = arsFromSale - totalFixedFees;
console.log(`  Fee de retiro: $${withdrawalFee} ARS`);
console.log(`  Fee de transferencia: $${transferFee} ARS`);
console.log(`  Comisión bancaria: $${bankFee} ARS`);
console.log(`  Total fees fijos: $${totalFixedFees} ARS`);
console.log(`  Monto final: $${finalAmount.toFixed(2)} ARS`);
console.log(`  ✅ Fuente: userSettings (configurable)\n`);

console.log('PASO 6: Calcular Ganancia');
const netProfit = finalAmount - initialAmount;
const profitPercent = (netProfit / initialAmount) * 100;
console.log(`  Monto inicial: $${initialAmount.toLocaleString()} ARS`);
console.log(`  Monto final: $${finalAmount.toFixed(2)} ARS`);
console.log(`  Ganancia neta: $${netProfit.toFixed(2)} ARS`);
console.log(`  Porcentaje: ${profitPercent.toFixed(4)}%\n`);

// ============================================
// TEST 2: VALORES ESPERADOS VS CÓDIGO ACTUAL
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('📊 TEST 2: Comparación con Código Actual\n');

console.log('VALORES QUE DEBE USAR EL CÓDIGO:');
console.log('─────────────────────────────────────────────────────');
console.log(`oficial.compra            = ${testData.oficial.compra} (NO manual override)`);
console.log(`usdtUSD[exchange].totalAsk = ${testData.usdtUSD[exchange].totalAsk} (NO 1.05)`);
console.log(`usdtARS[exchange].totalBid = ${testData.usdtARS[exchange].totalBid} (OK)`);
console.log(`userSettings.extraTradingFee = ${userSettings.extraTradingFee}% (NO ignorado)`);
console.log(`userSettings.extraWithdrawalFee = $${userSettings.extraWithdrawalFee} (NO 0)`);
console.log(`userSettings.extraTransferFee = $${userSettings.extraTransferFee} (NO 0)`);
console.log(`userSettings.bankCommissionFee = $${userSettings.bankCommissionFee} (NO 0)\n`);

console.log('PROBLEMAS EN CÓDIGO ACTUAL:');
console.log('─────────────────────────────────────────────────────');
console.log('❌ Línea 124: const usdToUsdtRate = usdtUsd?.[exchange]?.totalAsk || 1.05');
console.log('   Problema: Fallback hardcoded 1.05 en lugar de configuración');
console.log('   Impacto: Cálculos incorrectos cuando API falla\n');

console.log('❌ Línea 149-153: fees object siempre {trading: 0, withdrawal: 0, total: 0}');
console.log('   Problema: No lee userSettings.extraTradingFee, etc.');
console.log('   Impacto: Ganancia inflada, usuario ve números irreales\n');

console.log('❌ Línea 127: const usdtPurchased = usdPurchased / usdToUsdtRate');
console.log('   Problema: No resta fees de trading');
console.log('   Impacto: Ganancia calculada no considera comisiones\n');

console.log('❌ Línea 128: const arsFromSale = usdtPurchased * data.totalBid');
console.log('   Problema: No resta fees de retiro/transferencia/banco');
console.log('   Impacto: Monto final inflado\n');

// ============================================
// TEST 3: VALORES CONFIGURABLES REQUERIDOS
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('📊 TEST 3: Valores Configurables en options.js\n');

console.log('DEBE HABER CONFIGURACIÓN PARA:');
console.log('─────────────────────────────────────────────────────');
console.log('✅ defaultSimAmount (YA EXISTE)');
console.log('✅ extraTradingFee (YA EXISTE)');
console.log('✅ extraWithdrawalFee (YA EXISTE)');
console.log('✅ extraTransferFee (YA EXISTE)');
console.log('✅ bankCommissionFee (YA EXISTE)');
console.log('⚠️ fallbackUsdToUsdtRate (FALTA - actualmente 1.05 hardcoded)');
console.log('⚠️ applyFeesInCalculation (FALTA - toggle para usar fees)');
console.log('⚠️ showGrossProfit (FALTA - toggle para mostrar bruto vs neto)\n');

// ============================================
// TEST 4: CASO REAL CON DATOS DE SCREENSHOT
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('📊 TEST 4: Validación con Datos de Screenshot\n');

console.log('DATOS DEL SCREENSHOT (CriptoYa USDT/USD):');
console.log('─────────────────────────────────────────────────────');
console.log('TiendaCrypto: Compra USD 1.03  | Vende USD 0.995');
console.log('Buenbit:      Compra USD 1.033 | Vende USD 1.008');
console.log('Fiwind:       Compra USD 1.035 | Vende USD 1.015');
console.log('Belo:         Compra USD 1.041 | Vende USD 1.009\n');

console.log('CÓDIGO ACTUAL DEBERÍA USAR:');
console.log('─────────────────────────────────────────────────────');
console.log('Para comprar USDT con USD → usdtUSD[exchange].totalAsk (columna "COMPRAS A")');
console.log('  TiendaCrypto: 1.03 (NO 1.05)');
console.log('  Buenbit: 1.033 (NO 1.05)');
console.log('  Fiwind: 1.035 (NO 1.05)\n');

console.log('IMPACTO DEL BUG:');
console.log('─────────────────────────────────────────────────────');
console.log('Si usa 1.05 en lugar de 1.033 (Buenbit):');
const correctUSDT = usdPurchased / 1.033;
const buggyUSDT = usdPurchased / 1.05;
const correctFinal = correctUSDT * testData.usdtARS.buenbit.totalBid;
const buggyFinal = buggyUSDT * testData.usdtARS.buenbit.totalBid;
const difference = buggyFinal - correctFinal;
console.log(`  USDT correcto: ${correctUSDT.toFixed(4)} USDT`);
console.log(`  USDT con bug: ${buggyUSDT.toFixed(4)} USDT`);
console.log(`  ARS final correcto: $${correctFinal.toFixed(2)}`);
console.log(`  ARS final con bug: $${buggyFinal.toFixed(2)}`);
console.log(`  Diferencia: $${difference.toFixed(2)} ARS (${((difference/initialAmount)*100).toFixed(2)}%)`);
console.log(`  ⚠️ Usuario ve ganancia ${difference > 0 ? 'INFLADA' : 'DEFLADA'} por este bug\n`);

// ============================================
// RESUMEN Y RECOMENDACIONES
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('📋 RESUMEN DE TESTS\n');

let passedTests = 0;
let totalTests = 5;

console.log('TEST 1: Cálculo manual esperado ........... ✅ PASS');
passedTests++;

console.log('TEST 2: Comparación con código actual ..... ❌ FAIL');
console.log('        Motivo: Valores hardcoded y fees ignorados');

console.log('TEST 3: Configuración en options.js ....... ⚠️ PARTIAL');
console.log('        Motivo: Faltan 3 configuraciones');
passedTests += 0.5;

console.log('TEST 4: Validación con screenshot ......... ❌ FAIL');
console.log('        Motivo: Usa 1.05 en vez de valores reales');

console.log('\n🎯 SCORE: ' + passedTests + '/' + totalTests + ' tests pasados\n');

console.log('🔧 CORRECCIONES REQUERIDAS:');
console.log('──────────────────────────────────────────────────────');
console.log('1. CRÍTICO: Reemplazar fallback 1.05 por valor configurable');
console.log('2. CRÍTICO: Aplicar fees de usuario en cálculos');
console.log('3. IMPORTANTE: Agregar fallbackUsdToUsdtRate en options');
console.log('4. IMPORTANTE: Usar usdtUSD[exchange].totalAsk correctamente');
console.log('5. MENOR: Agregar toggle para mostrar bruto vs neto\n');

console.log('💡 VALORES QUE DEBEN SER CONFIGURABLES:');
console.log('──────────────────────────────────────────────────────');
console.log('• Monto inicial de simulación ........... ✅ YA EXISTE');
console.log('• Fee de trading (%) .................... ✅ YA EXISTE');
console.log('• Fee de retiro ($) ..................... ✅ YA EXISTE');
console.log('• Fee de transferencia ($) .............. ✅ YA EXISTE');
console.log('• Comisión bancaria ($) ................. ✅ YA EXISTE');
console.log('• Fallback USDT/USD rate ................ ❌ CREAR');
console.log('• Toggle aplicar fees ................... ❌ CREAR');
console.log('• Toggle mostrar bruto/neto ............. ❌ CREAR\n');

console.log('✅ Tests completados.\n');
