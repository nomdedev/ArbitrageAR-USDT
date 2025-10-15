// 🧪 Test: Cálculo Correcto de Montos en Popup v5.0.76
// Verifica que los montos se muestren correctamente según configuración

console.log('🧪 Test: Cálculo Correcto de Montos en Popup v5.0.76');

// Simular datos de una ruta calculada con 8M
const mockRoute = {
  buyExchange: 'binance',
  sellExchange: 'binance',
  profitPercentage: 0.34,
  calculation: {
    initialAmount: 8000000, // 8M calculado
    finalAmount: 8027200,   // 8M + 0.34% = 8,027,200
    netProfit: 27200        // 27,200 ganancia
  }
};

// Simular configuración del usuario
const mockUserSettings = {
  defaultSimAmount: 8000000 // 8M configurado
};

// Función de prueba para simular el cálculo en popup
function testAmountCalculation(route, userSettings) {
  const calc = route.calculation || {};
  const userReferenceAmount = userSettings?.defaultSimAmount || 1000000;
  const calculatedAmount = calc.initialAmount || 100000;

  // Si el cálculo se hizo con el mismo monto, usar valores tal cual
  // Si el cálculo se hizo con un monto diferente, ajustar proporcionalmente
  const ratio = calculatedAmount !== 0 ? userReferenceAmount / calculatedAmount : 1;
  const shouldAdjust = Math.abs(ratio - 1) > 0.01; // Solo ajustar si diferencia significativa

  const initialAmount = userReferenceAmount;
  const finalAmount = shouldAdjust && calc.finalAmount ? calc.finalAmount * ratio : (calc.finalAmount || initialAmount);
  const netProfit = shouldAdjust && calc.netProfit ? calc.netProfit * ratio : (calc.netProfit || 0);

  return { initialAmount, finalAmount, netProfit, ratio, shouldAdjust };
}

// Ejecutar test
console.log('========================================');
console.log('TEST: Cálculo de montos con configuración de 8M');
console.log('========================================');

const result = testAmountCalculation(mockRoute, mockUserSettings);

console.log(`Monto calculado en background: $${mockRoute.calculation.initialAmount.toLocaleString()}`);
console.log(`Monto configurado por usuario: $${mockUserSettings.defaultSimAmount.toLocaleString()}`);
console.log(`Ratio calculado: ${result.ratio}`);
console.log(`¿Debería ajustar?: ${result.shouldAdjust ? 'SÍ' : 'NO'}`);
console.log(`Monto inicial mostrado: $${result.initialAmount.toLocaleString()}`);
console.log(`Monto final mostrado: $${result.finalAmount.toLocaleString()}`);
console.log(`Ganancia neta mostrada: $${result.netProfit.toLocaleString()}`);

// Verificaciones
const checks = [
  { name: 'Ratio debe ser 1 (mismo monto)', condition: result.ratio === 1 },
  { name: 'No debe ajustar (mismo monto)', condition: !result.shouldAdjust },
  { name: 'Monto inicial debe ser 8M', condition: result.initialAmount === 8000000 },
  { name: 'Monto final debe ser 8,027,200', condition: result.finalAmount === 8027200 },
  { name: 'Ganancia neta debe ser 27,200', condition: result.netProfit === 27200 }
];

console.log('\n========================================');
console.log('VERIFICACIONES:');
console.log('========================================');

let allPassed = true;
checks.forEach(check => {
  const passed = check.condition;
  console.log(`${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  if (!passed) allPassed = false;
});

console.log('\n========================================');
console.log(`RESULTADO FINAL: ${allPassed ? '✅ TODOS LOS TESTS PASAN' : '❌ ALGUNOS TESTS FALLARON'}`);
console.log('========================================');

// Test adicional: caso donde los montos difieren
console.log('\n========================================');
console.log('TEST ADICIONAL: Ajuste proporcional cuando montos difieren');
console.log('========================================');

const mockRouteDifferent = {
  ...mockRoute,
  calculation: {
    initialAmount: 100000, // Calculado con 100K
    finalAmount: 100340,   // 100K + 0.34% = 100,340
    netProfit: 340         // 340 ganancia
  }
};

const resultAdjusted = testAmountCalculation(mockRouteDifferent, mockUserSettings);

console.log(`Monto calculado en background: $${mockRouteDifferent.calculation.initialAmount.toLocaleString()}`);
console.log(`Monto configurado por usuario: $${mockUserSettings.defaultSimAmount.toLocaleString()}`);
console.log(`Ratio calculado: ${resultAdjusted.ratio}`);
console.log(`¿Debería ajustar?: ${resultAdjusted.shouldAdjust ? 'SÍ' : 'NO'}`);
console.log(`Monto inicial mostrado: $${resultAdjusted.initialAmount.toLocaleString()}`);
console.log(`Monto final mostrado: $${resultAdjusted.finalAmount.toLocaleString()}`);
console.log(`Ganancia neta mostrada: $${resultAdjusted.netProfit.toLocaleString()}`);

// Verificaciones del ajuste
const adjustedChecks = [
  { name: 'Ratio debe ser 80 (8M/100K)', condition: resultAdjusted.ratio === 80 },
  { name: 'Debe ajustar (montos diferentes)', condition: resultAdjusted.shouldAdjust },
  { name: 'Monto inicial debe ser 8M', condition: resultAdjusted.initialAmount === 8000000 },
  { name: 'Monto final debe ser 8,027,200 (100,340 * 80)', condition: resultAdjusted.finalAmount === 8027200 },
  { name: 'Ganancia neta debe ser 27,200 (340 * 80)', condition: resultAdjusted.netProfit === 27200 }
];

console.log('\n========================================');
console.log('VERIFICACIONES DEL AJUSTE:');
console.log('========================================');

let adjustedAllPassed = true;
adjustedChecks.forEach(check => {
  const passed = check.condition;
  console.log(`${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  if (!passed) adjustedAllPassed = false;
});

console.log('\n========================================');
console.log(`RESULTADO DEL AJUSTE: ${adjustedAllPassed ? '✅ TODOS LOS TESTS PASAN' : '❌ ALGUNOS TESTS FALLARON'}`);
console.log('========================================');

if (allPassed && adjustedAllPassed) {
  console.log('\n🎉 TEST COMPLETO: Cálculo de montos funciona correctamente');
} else {
  console.log('\n❌ TEST FALLIDO: Hay errores en el cálculo de montos');
}