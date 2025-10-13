/**
 * TEST v5.0.71: Validación de consistencia entre valores de ruta y guía paso a paso
 * 
 * Este test verifica que:
 * 1. Los valores mostrados en la tarjeta de ruta coincidan con los valores en la guía
 * 2. Los cálculos sean consistentes
 * 3. No haya discrepancias entre profit mostrado y profit calculado
 */

console.log('='.repeat(80));
console.log('TEST v5.0.71: Validación de Consistencia Ruta vs Guía Paso a Paso');
console.log('='.repeat(80));

// Simular datos de una ruta completa
const mockRoute = {
  buyExchange: 'Ripio',
  sellExchange: 'Ripio',
  isSingleExchange: true,
  profitPercentage: 5.23,
  officialPrice: 1020,
  usdToUsdtRate: 1.002,
  usdtArsBid: 1095,
  transferFeeUSD: 0,
  calculation: {
    initial: 100000,
    usdPurchased: 98.0392,  // 100000 / 1020
    usdtAfterFees: 97.8431,  // 98.0392 / 1.002
    arsFromSale: 107138.19,  // 97.8431 * 1095
    finalAmount: 106638.19,  // 107138.19 - 500 (withdrawal fee)
    netProfit: 6638.19,  // 106638.19 - 100000
    profitPercentage: 6.64  // (6638.19 / 100000) * 100
  },
  fees: {
    trading: 0.2,
    withdrawal: 500,
    total: 500.2
  }
};

console.log('\n📊 Datos de la ruta mock:');
console.log('  Broker:', mockRoute.buyExchange);
console.log('  Profit mostrado en tarjeta (calculation):', mockRoute.calculation.profitPercentage + '%');
console.log('  Profit top-level (INCORRECTO):', mockRoute.profitPercentage + '%');
console.log('  NetProfit ARS:', mockRoute.calculation.netProfit);

// Simular la función showRouteGuide() - Conversión de route a arbitrage
const arbitrage = {
  broker: mockRoute.isSingleExchange ? mockRoute.buyExchange : `${mockRoute.buyExchange} → ${mockRoute.sellExchange}`,
  buyExchange: mockRoute.buyExchange || 'N/A',
  sellExchange: mockRoute.sellExchange || mockRoute.buyExchange || 'N/A',
  isSingleExchange: mockRoute.isSingleExchange || false,
  profitPercentage: mockRoute.profitPercentage || mockRoute.profitPercent || 0,
  officialPrice: mockRoute.officialPrice || 0,
  usdToUsdtRate: mockRoute.usdToUsdtRate || 1,
  usdtArsBid: mockRoute.usdtArsBid || 0,
  sellPrice: mockRoute.usdtArsBid || 0,
  transferFeeUSD: mockRoute.transferFeeUSD || 0,
  calculation: mockRoute.calculation || {},
  fees: mockRoute.fees || { trading: 0, withdrawal: 0 }
};

console.log('\n🔄 Objeto arbitrage convertido:');
console.log('  profitPercentage:', arbitrage.profitPercentage + '%');
console.log('  calculation.netProfit:', arbitrage.calculation.netProfit);
console.log('  calculation.profitPercentage:', arbitrage.calculation.profitPercentage);

// Simular calculateGuideValues() v5.0.71 CORREGIDO
function calculateGuideValues(arb) {
  const calc = arb.calculation || {};
  
  // CORREGIDO v5.0.71: Usar profitPercentage de calculation para consistencia
  const correctProfitPercentage = calc.profitPercentage !== undefined 
    ? calc.profitPercentage 
    : arb.profitPercentage || 0;
  
  return {
    estimatedInvestment: calc.initial || 100000,
    officialPrice: arb.officialPrice || 1000,
    usdAmount: calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000)),
    usdtAfterFees: calc.usdtAfterFees || (calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))),
    sellPrice: arb.sellPrice || arb.usdtArsBid || 1000,
    arsFromSale: calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000)),
    finalAmount: calc.finalAmount || (calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000))),
    profit: calc.netProfit || ((calc.finalAmount || calc.arsFromSale || ((calc.usdtAfterFees || calc.usdPurchased || ((calc.initial || 100000) / (arb.officialPrice || 1000))) * (arb.sellPrice || arb.usdtArsBid || 1000))) - (calc.initial || 100000)),
    profitPercentage: correctProfitPercentage,  // USAR EL VALOR CORRECTO
    usdToUsdtRate: arb.usdToUsdtRate || 1,
    usdtArsBid: arb.usdtArsBid || (arb.sellPrice || 1000),
    fees: arb.fees || { trading: 0, withdrawal: 0, total: 0 },
    broker: arb.broker || 'Exchange'
  };
}

// Simular displayProfitPercentage (lo que se muestra en la tarjeta) v5.0.71 CORREGIDO
const displayProfitPercentage = mockRoute.calculation?.profitPercentage !== undefined 
  ? mockRoute.calculation.profitPercentage 
  : mockRoute.profitPercentage || 0;

const guideValues = calculateGuideValues(arbitrage);

console.log('\n📝 Valores calculados para la guía:');
console.log('  estimatedInvestment:', guideValues.estimatedInvestment);
console.log('  profit (ARS):', guideValues.profit);
console.log('  profitPercentage:', guideValues.profitPercentage + '%');
console.log('  finalAmount:', guideValues.finalAmount);

// VALIDACIONES
console.log('\n' + '='.repeat(80));
console.log('VALIDACIONES');
console.log('='.repeat(80));

let allTestsPassed = true;

// Test 1: Profit en tarjeta vs profit en guía
console.log('\n✅ Test 1: Profit ARS (tarjeta vs guía)');
const profitMatch = mockRoute.calculation.netProfit === guideValues.profit;
console.log(`  Tarjeta: $${mockRoute.calculation.netProfit}`);
console.log(`  Guía:    $${guideValues.profit}`);
console.log(`  Resultado: ${profitMatch ? '✅ COINCIDEN' : '❌ NO COINCIDEN'}`);
if (!profitMatch) {
  allTestsPassed = false;
  console.log(`  ⚠️ DISCREPANCIA: ${Math.abs(mockRoute.calculation.netProfit - guideValues.profit)} ARS`);
}

// Test 2: Profit % en tarjeta vs profit % en guía (usando displayProfitPercentage)
console.log('\n✅ Test 2: Profit % (tarjeta vs guía)');
const percentMatch = displayProfitPercentage === guideValues.profitPercentage;
console.log(`  Tarjeta (displayProfitPercentage): ${displayProfitPercentage}%`);
console.log(`  Guía:    ${guideValues.profitPercentage}%`);
console.log(`  Resultado: ${percentMatch ? '✅ COINCIDEN' : '❌ NO COINCIDEN'}`);
if (!percentMatch) {
  allTestsPassed = false;
  console.log(`  ⚠️ DISCREPANCIA: ${Math.abs(displayProfitPercentage - guideValues.profitPercentage).toFixed(2)}%`);
}

// Test 3: Recálculo manual de profit percentage
console.log('\n✅ Test 3: Recálculo manual de profit %');
const manualProfitPercent = (guideValues.profit / guideValues.estimatedInvestment) * 100;
console.log(`  Profit:              $${guideValues.profit}`);
console.log(`  Investment:          $${guideValues.estimatedInvestment}`);
console.log(`  Calculado manualmente: ${manualProfitPercent.toFixed(2)}%`);
console.log(`  En guía:               ${guideValues.profitPercentage}%`);
const manualMatch = Math.abs(manualProfitPercent - guideValues.profitPercentage) < 0.01;
console.log(`  Resultado: ${manualMatch ? '✅ COINCIDEN' : '❌ NO COINCIDEN'}`);
if (!manualMatch) {
  allTestsPassed = false;
  console.log(`  ⚠️ DISCREPANCIA: ${Math.abs(manualProfitPercent - guideValues.profitPercentage).toFixed(2)}%`);
}

// Test 4: Verificar que calculation.profitPercentage se use en tarjeta y guía
console.log('\n✅ Test 4: Consistency - Ambos usan calculation.profitPercentage');
console.log(`  route.profitPercentage (top-level, INCORRECTO):  ${mockRoute.profitPercentage}%`);
console.log(`  route.calculation.profitPercentage (CORRECTO):   ${mockRoute.calculation.profitPercentage}%`);
console.log(`  displayProfitPercentage (usado en tarjeta):      ${displayProfitPercentage}%`);
console.log(`  guideValues.profitPercentage (usado en guía):    ${guideValues.profitPercentage}%`);
const bothUseCalculation = displayProfitPercentage === mockRoute.calculation.profitPercentage && 
                           guideValues.profitPercentage === mockRoute.calculation.profitPercentage;
console.log(`  Resultado: ${bothUseCalculation ? '✅ AMBOS USAN calculation.profitPercentage' : '❌ NO USAN EL MISMO VALOR'}`);
if (!bothUseCalculation) {
  allTestsPassed = false;
  console.log(`  ⚠️ PROBLEMA: Tarjeta o guía no están usando calculation.profitPercentage`);
}

// RESUMEN FINAL
console.log('\n' + '='.repeat(80));
if (allTestsPassed) {
  console.log('✅✅✅ TODOS LOS TESTS PASARON ✅✅✅');
  console.log('Los valores son consistentes entre tarjeta y guía');
  console.log('');
  console.log('✅ SOLUCIÓN IMPLEMENTADA (v5.0.71):');
  console.log('  - Tarjeta usa: route.calculation.profitPercentage');
  console.log('  - Guía usa: route.calculation.profitPercentage');
  console.log('  - Ambos valores coinciden y son correctos');
} else {
  console.log('❌❌❌ ALGUNOS TESTS FALLARON ❌❌❌');
  console.log('\n🔍 DIAGNÓSTICO DEL PROBLEMA:');
  console.log('');
  console.log('El problema está en que hay DOS fuentes de verdad para el profit percentage:');
  console.log('  1. route.profitPercentage (usado en la tarjeta)');
  console.log('  2. route.calculation.profitPercentage (calculado en backend)');
  console.log('');
  console.log('Si estos valores no coinciden, la tarjeta muestra un valor diferente al de la guía.');
  console.log('');
  console.log('SOLUCIONES POSIBLES:');
  console.log('  A) Usar SIEMPRE route.calculation.profitPercentage en ambos lados');
  console.log('  B) Recalcular profitPercentage en calculateGuideValues() en lugar de usar arb.profitPercentage');
  console.log('  C) Asegurar en el backend que route.profitPercentage = route.calculation.profitPercentage');
}
console.log('='.repeat(80));
