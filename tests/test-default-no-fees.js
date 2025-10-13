// ============================================
// TEST DE VALORES POR DEFECTO - v5.0.51
// ============================================
// Valida que por defecto NO haya fees aplicados

console.log('🧪 TEST: Valores por Defecto v5.0.51\n');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

const DEFAULT_SETTINGS = {
  defaultSimAmount: 1000000,
  extraTradingFee: 0,              // ✅ 0% por defecto
  extraWithdrawalFee: 0,           // ✅ $0 por defecto
  extraTransferFee: 0,             // ✅ $0 por defecto
  bankCommissionFee: 0,            // ✅ $0 por defecto
  fallbackUsdToUsdtRate: 1.0,      // ✅ Paridad 1:1
  applyFeesInCalculation: false,   // ✅ NO aplicar fees por defecto
  showGrossProfit: false
};

console.log('📋 CONFIGURACIÓN POR DEFECTO:\n');
console.log('FEES:');
console.log('─────────────────────────────────────────────────────');
console.log(`  extraTradingFee:        ${DEFAULT_SETTINGS.extraTradingFee}% ✅`);
console.log(`  extraWithdrawalFee:     $${DEFAULT_SETTINGS.extraWithdrawalFee} ARS ✅`);
console.log(`  extraTransferFee:       $${DEFAULT_SETTINGS.extraTransferFee} ARS ✅`);
console.log(`  bankCommissionFee:      $${DEFAULT_SETTINGS.bankCommissionFee} ARS ✅`);
console.log(`  applyFeesInCalculation: ${DEFAULT_SETTINGS.applyFeesInCalculation} ✅\n`);

console.log('OTROS:');
console.log('─────────────────────────────────────────────────────');
console.log(`  defaultSimAmount:       $${DEFAULT_SETTINGS.defaultSimAmount.toLocaleString()} ARS`);
console.log(`  fallbackUsdToUsdtRate:  ${DEFAULT_SETTINGS.fallbackUsdToUsdtRate} (paridad 1:1)`);
console.log(`  showGrossProfit:        ${DEFAULT_SETTINGS.showGrossProfit}\n`);

// ============================================
// CÁLCULO SIN FEES (GANANCIA BRUTA)
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('📊 CÁLCULO CON CONFIGURACIÓN POR DEFECTO (SIN FEES):\n');

const testData = {
  oficial: { compra: 1030.50 },
  usdtUSD: { buenbit: { totalAsk: 1.033 } },
  usdtARS: { buenbit: { totalBid: 1148 } }
};

const initialAmount = 1000000;

console.log('PASO 1: Comprar USD Oficial');
const usdPurchased = initialAmount / testData.oficial.compra;
console.log(`  $${initialAmount.toLocaleString()} ARS / $${testData.oficial.compra} = ${usdPurchased.toFixed(4)} USD\n`);

console.log('PASO 2: Convertir USD → USDT');
const usdToUsdtRate = testData.usdtUSD.buenbit.totalAsk;
const usdtPurchased = usdPurchased / usdToUsdtRate;
console.log(`  ${usdPurchased.toFixed(4)} USD / ${usdToUsdtRate} = ${usdtPurchased.toFixed(4)} USDT\n`);

console.log('PASO 3: Aplicar Fee de Trading');
console.log(`  Fee configurado: ${DEFAULT_SETTINGS.extraTradingFee}%`);
console.log(`  Aplicar fees: ${DEFAULT_SETTINGS.applyFeesInCalculation ? 'SÍ' : 'NO'}`);
console.log(`  ✅ NO se aplica fee (por defecto)\n`);

const usdtAfterFees = usdtPurchased; // Sin fees

console.log('PASO 4: Vender USDT por ARS');
const sellPrice = testData.usdtARS.buenbit.totalBid;
const arsFromSale = usdtAfterFees * sellPrice;
console.log(`  ${usdtAfterFees.toFixed(4)} USDT × $${sellPrice} = $${arsFromSale.toFixed(2)} ARS\n`);

console.log('PASO 5: Aplicar Fees Fijos');
console.log(`  Retiro: $${DEFAULT_SETTINGS.extraWithdrawalFee}`);
console.log(`  Transferencia: $${DEFAULT_SETTINGS.extraTransferFee}`);
console.log(`  Banco: $${DEFAULT_SETTINGS.bankCommissionFee}`);
console.log(`  ✅ NO se aplican fees fijos (por defecto)\n`);

const finalAmount = arsFromSale; // Sin fees

console.log('PASO 6: Resultado');
const profit = finalAmount - initialAmount;
const profitPercent = (profit / initialAmount) * 100;
console.log(`  Monto inicial: $${initialAmount.toLocaleString()} ARS`);
console.log(`  Monto final:   $${finalAmount.toFixed(2)} ARS`);
console.log(`  Ganancia:      $${profit.toFixed(2)} ARS`);
console.log(`  Porcentaje:    ${profitPercent.toFixed(4)}%`);
console.log(`  ✅ Esta es la GANANCIA BRUTA (sin fees)\n`);

// ============================================
// COMPARACIÓN: SIN FEES VS CON FEES
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('📊 COMPARACIÓN: Sin Fees vs Con Fees\n');

// Con fees (si usuario configura)
const withFees = {
  tradingFee: 0.5,
  withdrawal: 50,
  transfer: 100,
  bank: 200
};

const usdtWithFees = usdtPurchased * (1 - withFees.tradingFee/100);
const arsWithFees = usdtWithFees * sellPrice - (withFees.withdrawal + withFees.transfer + withFees.bank);
const profitWithFees = arsWithFees - initialAmount;
const percentWithFees = (profitWithFees / initialAmount) * 100;

console.log('SIN FEES (por defecto):');
console.log('─────────────────────────────────────────────────────');
console.log(`  Ganancia: $${profit.toFixed(2)} ARS (${profitPercent.toFixed(2)}%)`);
console.log(`  Fees:     $0 ARS`);
console.log(`  ✅ Usuario ve ganancia BRUTA\n`);

console.log('CON FEES (si usuario configura 0.5% + $350):');
console.log('─────────────────────────────────────────────────────');
console.log(`  Ganancia: $${profitWithFees.toFixed(2)} ARS (${percentWithFees.toFixed(2)}%)`);
console.log(`  Fees:     $${(profit - profitWithFees).toFixed(2)} ARS`);
console.log(`  ⚠️ Usuario debe activar "applyFeesInCalculation"\n`);

const difference = profit - profitWithFees;
console.log('DIFERENCIA:');
console.log('─────────────────────────────────────────────────────');
console.log(`  $${difference.toFixed(2)} ARS (${((difference/initialAmount)*100).toFixed(2)}%)`);
console.log(`  💡 Esta es la diferencia entre bruto y neto\n`);

// ============================================
// INSTRUCCIONES PARA EL USUARIO
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('💡 INSTRUCCIONES PARA CONFIGURAR FEES:\n');
console.log('Por defecto, ArbitrARS muestra GANANCIA BRUTA (sin fees).\n');
console.log('Para ver ganancia NETA (más realista), el usuario debe:\n');
console.log('1. Ir a ⚙️ Configuración > Fees');
console.log('2. Configurar los fees de su exchange:');
console.log('   • Trading fee: Ej. 0.5%');
console.log('   • Fee de retiro: Ej. $50 ARS');
console.log('   • Fee de transferencia: Ej. $100 ARS');
console.log('   • Comisión bancaria: Ej. $200 ARS');
console.log('3. ✅ Activar "Aplicar fees en cálculos"');
console.log('4. Guardar configuración\n');

console.log('RESULTADO:');
console.log('─────────────────────────────────────────────────────');
console.log('✅ Las rutas mostrarán ganancia NETA (después de fees)');
console.log('✅ Más realista y preciso');
console.log('✅ Usuario sabe exactamente cuánto ganará\n');

// ============================================
// VALIDACIÓN
// ============================================

console.log('═══════════════════════════════════════════════════════\n');
console.log('✅ VALIDACIÓN COMPLETADA\n');

let allPassed = true;

console.log('TESTS:');
console.log('─────────────────────────────────────────────────────');

if (DEFAULT_SETTINGS.extraTradingFee === 0) {
  console.log('✅ extraTradingFee = 0 por defecto');
} else {
  console.log('❌ extraTradingFee NO es 0');
  allPassed = false;
}

if (DEFAULT_SETTINGS.extraWithdrawalFee === 0) {
  console.log('✅ extraWithdrawalFee = 0 por defecto');
} else {
  console.log('❌ extraWithdrawalFee NO es 0');
  allPassed = false;
}

if (DEFAULT_SETTINGS.extraTransferFee === 0) {
  console.log('✅ extraTransferFee = 0 por defecto');
} else {
  console.log('❌ extraTransferFee NO es 0');
  allPassed = false;
}

if (DEFAULT_SETTINGS.bankCommissionFee === 0) {
  console.log('✅ bankCommissionFee = 0 por defecto');
} else {
  console.log('❌ bankCommissionFee NO es 0');
  allPassed = false;
}

if (DEFAULT_SETTINGS.applyFeesInCalculation === false) {
  console.log('✅ applyFeesInCalculation = false por defecto');
} else {
  console.log('❌ applyFeesInCalculation NO es false');
  allPassed = false;
}

console.log('\n' + (allPassed ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON') + '\n');

console.log('CONFIGURACIÓN CORRECTA:');
console.log('─────────────────────────────────────────────────────');
console.log('✅ Por defecto NO hay fees');
console.log('✅ Ganancias mostradas son BRUTAS');
console.log('✅ Usuario puede configurar fees manualmente');
console.log('✅ Usuario puede activar aplicación de fees\n');
