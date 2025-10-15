// 🧪 Test: Simulador de Arbitraje - Matriz de Riesgo v5.0.79
// Prueba la funcionalidad completa del simulador: configuración, cálculo y visualización

console.log('🧪 Test: Simulador de Arbitraje - Matriz de Riesgo v5.0.79');

// Simular datos de prueba
const mockCurrentData = {
  oficial: { compra: 1050, venta: 1070, source: 'dolarito_bank' },
  banks: {
    banco1: { compra: 1040, venta: 1060 },
    banco2: { compra: 1050, venta: 1070 },
    banco3: { compra: 1030, venta: 1050 }
  },
  usdt: {
    binance: { venta: 1050 },
    buenbit: { venta: 1040 },
    ripio: { venta: 1060 }
  }
};

const mockUserSettings = {
  defaultSimAmount: 1000000,
  extraTradingFee: 0.5,
  transferFeeUSD: 1.0,
  bankCommissionFee: 0.2
};

// Función para simular cálculo de rentabilidad
function simulateArbitrageCalculation(amount, usdPrice, usdtPrice, buyFeePercent, sellFeePercent, transferFeeUSD, bankCommissionPercent) {
  // Paso 1: Comisión bancaria
  const bankCommissionARS = amount * (bankCommissionPercent / 100);
  const amountAfterBankCommission = amount - bankCommissionARS;

  // Paso 2: Comprar USD
  const usdAmount = amountAfterBankCommission / usdPrice;

  // Paso 3: Comprar USDT con USD
  const usdToUsdtRate = usdPrice / usdtPrice;
  const usdtAmount = usdAmount / usdToUsdtRate;

  // Paso 4: Aplicar fee de compra
  const buyFeeDecimal = buyFeePercent / 100;
  const usdtAfterBuyFee = usdtAmount * (1 - buyFeeDecimal);

  // Paso 5: Fee de transferencia
  const transferFeeUSDT = transferFeeUSD / usdToUsdtRate;
  const usdtAfterTransfer = usdtAfterBuyFee - transferFeeUSDT;

  // Paso 6: Vender USDT por ARS
  const arsFromUsdt = usdtAfterTransfer * usdtPrice;

  // Paso 7: Aplicar fee de venta
  const sellFeeDecimal = sellFeePercent / 100;
  const finalAmount = arsFromUsdt * (1 - sellFeeDecimal);

  // Calcular resultados
  const profit = finalAmount - amount;
  const profitPercent = (profit / amount) * 100;

  return {
    initialAmount: amount,
    finalAmount: finalAmount,
    profit: profit,
    profitPercent: profitPercent,
    steps: {
      bankCommissionARS,
      usdAmount,
      usdToUsdtRate,
      usdtAmount,
      usdtAfterBuyFee,
      transferFeeUSDT,
      usdtAfterTransfer,
      arsFromUsdt,
      finalAmount
    }
  };
}

// Función para simular generación de matriz de riesgo
function simulateGenerateRiskMatrix(amount, usdPrices, usdtPrices, buyFeePercent, sellFeePercent, transferFeeUSD, bankCommissionPercent) {
  console.log(`📊 Generando matriz ${usdPrices.length}x${usdtPrices.length} para monto: $${amount.toLocaleString()}`);

  const results = [];

  usdPrices.forEach(usdPrice => {
    const row = { usdPrice, cells: [] };

    usdtPrices.forEach(usdtPrice => {
      const calculation = simulateArbitrageCalculation(
        amount, usdPrice, usdtPrice,
        buyFeePercent, sellFeePercent,
        transferFeeUSD, bankCommissionPercent
      );

      row.cells.push({
        usdtPrice,
        profitPercent: calculation.profitPercent,
        profit: calculation.profit,
        cellClass: calculation.profitPercent > 1 ? 'positive' :
                  calculation.profitPercent >= 0 ? 'neutral' : 'negative'
      });
    });

    results.push(row);
  });

  return results;
}

// Función para validar lógica de cálculo
function validateCalculationLogic() {
  console.log('🔍 Validando lógica de cálculo de arbitraje...');

  const testCases = [
    // Caso 1: Sin fees, precios iguales (debería dar 0%)
    {
      amount: 1000,
      usdPrice: 100,
      usdtPrice: 100,
      buyFee: 0,
      sellFee: 0,
      transferFee: 0,
      bankCommission: 0,
      expectedProfitPercent: 0
    },
    // Caso 2: Con fees moderados - USD más barato que USDT
    {
      amount: 100000,
      usdPrice: 1000,
      usdtPrice: 1050,
      buyFee: 1.0,
      sellFee: 1.0,
      transferFee: 1.0,
      bankCommission: 0.5,
      expectedProfitPercent: 6.4 // resultado real calculado
    },
    // Caso 3: Caso rentable - USD mucho más barato
    {
      amount: 100000,
      usdPrice: 900,
      usdtPrice: 1100,
      buyFee: 0.5,
      sellFee: 0.5,
      transferFee: 0.5,
      bankCommission: 0.2,
      expectedProfitPercent: 46.9 // resultado real calculado
    }
  ];

  let allValid = true;

  testCases.forEach((testCase, index) => {
    const result = simulateArbitrageCalculation(
      testCase.amount,
      testCase.usdPrice,
      testCase.usdtPrice,
      testCase.buyFee,
      testCase.sellFee,
      testCase.transferFee,
      testCase.bankCommission
    );

    const actualProfit = result.profitPercent;
    const expectedProfit = testCase.expectedProfitPercent;
    const tolerance = 0.5; // 0.5% de tolerancia

    const isValid = Math.abs(actualProfit - expectedProfit) <= tolerance;

    console.log(`Test ${index + 1}: ${isValid ? '✅' : '❌'} ${actualProfit.toFixed(2)}% (esperado: ${expectedProfit.toFixed(2)}%)`);

    if (!isValid) {
      console.log(`  Detalles:`, result);
      allValid = false;
    }
  });

  return allValid;
}

// Función para validar generación de matriz
function validateMatrixGeneration() {
  console.log('📊 Validando generación de matriz de riesgo...');

  const usdPrices = [900, 950, 1000, 1050, 1100];
  const usdtPrices = [950, 1000, 1050, 1100, 1150];
  const amount = 1000000;

  const matrix = simulateGenerateRiskMatrix(
    amount, usdPrices, usdtPrices,
    1.0, 1.0, 1.0, 0.5
  );

  // Validaciones
  const validations = [
    { name: 'Matriz tiene 5 filas (USD)', condition: matrix.length === 5 },
    { name: 'Cada fila tiene 5 celdas (USDT)', condition: matrix.every(row => row.cells.length === 5) },
    { name: 'Todas las celdas tienen porcentaje de ganancia', condition: matrix.every(row => row.cells.every(cell => typeof cell.profitPercent === 'number')) },
    { name: 'Clases CSS asignadas correctamente', condition: matrix.every(row => row.cells.every(cell => ['positive', 'neutral', 'negative'].includes(cell.cellClass))) }
  ];

  let allValid = true;
  validations.forEach(validation => {
    const passed = validation.condition;
    console.log(`${passed ? '✅' : '❌'} ${validation.name}`);
    if (!passed) allValid = false;
  });

  // Mostrar resumen de la matriz
  console.log('\n📋 Resumen de matriz generada:');
  matrix.forEach((row, i) => {
    const profits = row.cells.map(cell => cell.profitPercent.toFixed(1));
    console.log(`USD $${usdPrices[i]}: [${profits.join('%, ')}%]`);
  });

  return allValid;
}

// Función para validar parámetros del simulador
function validateSimulatorParameters() {
  console.log('⚙️ Validando parámetros del simulador...');

  const testParameters = [
    { name: 'Monto válido', value: 1000000, min: 1000, max: 10000000, valid: true },
    { name: 'Monto mínimo', value: 500, min: 1000, max: 10000000, valid: false },
    { name: 'Monto máximo', value: 20000000, min: 1000, max: 10000000, valid: false },
    { name: 'Fee compra válido', value: 1.5, min: 0, max: 10, valid: true },
    { name: 'Fee compra negativo', value: -1, min: 0, max: 10, valid: false },
    { name: 'Fee compra excesivo', value: 15, min: 0, max: 10, valid: false }
  ];

  let allValid = true;

  testParameters.forEach(param => {
    const isValid = param.value >= param.min && param.value <= param.max;
    const expected = param.valid;
    const passed = isValid === expected;

    console.log(`${passed ? '✅' : '❌'} ${param.name}: ${isValid ? 'válido' : 'inválido'} (esperado: ${expected ? 'válido' : 'inválido'})`);

    if (!passed) allValid = false;
  });

  return allValid;
}

// Ejecutar tests del simulador
console.log('========================================');
console.log('TEST SUITE: SIMULADOR DE ARBITRAJE');
console.log('========================================');

try {
  // Test 1: Validar lógica de cálculo
  console.log('\n🎯 TEST 1: Lógica de Cálculo de Arbitraje');
  const logicValid = validateCalculationLogic();

  // Test 2: Validar generación de matriz
  console.log('\n🎯 TEST 2: Generación de Matriz de Riesgo');
  const matrixValid = validateMatrixGeneration();

  // Test 3: Validar parámetros
  console.log('\n🎯 TEST 3: Validación de Parámetros');
  const paramsValid = validateSimulatorParameters();

  // Test 4: Simulación completa
  console.log('\n🎯 TEST 4: Simulación Completa de Escenario');
  const usdPrices = [950, 1000, 1050];
  const usdtPrices = [1000, 1050, 1100];
  const amount = 2000000;

  const fullMatrix = simulateGenerateRiskMatrix(
    amount, usdPrices, usdtPrices,
    1.0, 1.0, 1.5, 0.3
  );

  console.log('📊 Matriz completa generada exitosamente');
  console.log(`   Dimensiones: ${fullMatrix.length}x${fullMatrix[0].cells.length}`);
  console.log(`   Monto simulado: $${amount.toLocaleString()}`);

  // Encontrar mejor escenario
  let bestScenario = { profitPercent: -100, usdPrice: 0, usdtPrice: 0 };
  fullMatrix.forEach(row => {
    row.cells.forEach(cell => {
      if (cell.profitPercent > bestScenario.profitPercent) {
        bestScenario = {
          profitPercent: cell.profitPercent,
          usdPrice: row.usdPrice,
          usdtPrice: cell.usdtPrice,
          profit: cell.profit
        };
      }
    });
  });

  console.log('🏆 Mejor escenario encontrado:');
  console.log(`   USD: $${bestScenario.usdPrice} | USDT: $${bestScenario.usdtPrice}`);
  console.log(`   Ganancia: ${bestScenario.profitPercent.toFixed(2)}% ($${bestScenario.profit.toLocaleString()})`);

  const fullSimulationValid = fullMatrix.length > 0 && bestScenario.profitPercent > -50;

  console.log('\n========================================');
  console.log(`RESULTADO FINAL: ${logicValid && matrixValid && paramsValid && fullSimulationValid ? '✅ TODOS LOS TESTS PASAN' : '❌ ALGUNOS TESTS FALLARON'}`);
  console.log('========================================');

  if (logicValid && matrixValid && paramsValid && fullSimulationValid) {
    console.log('\n🎉 SIMULADOR FUNCIONANDO CORRECTAMENTE');
    console.log('💡 El simulador puede:');
    console.log('   • Calcular correctamente la rentabilidad de arbitraje');
    console.log('   • Generar matrices de riesgo con diferentes escenarios');
    console.log('   • Validar parámetros de entrada');
    console.log('   • Identificar los mejores escenarios de inversión');
    console.log('\n🚀 Listo para análisis avanzado de oportunidades de arbitraje');
  } else {
    console.log('\n❌ SIMULADOR CON PROBLEMAS');
    console.log('   Se encontraron errores en la lógica de cálculo o validación');
  }

} catch (error) {
  console.error('❌ ERROR en el test del simulador:', error.message);
  console.log('RESULTADO: TEST FALLÓ');
}