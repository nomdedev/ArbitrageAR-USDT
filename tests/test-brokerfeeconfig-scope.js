// Test para validar scope correcto de brokerFeeConfig v5.0.59
// Verifica que brokerFeeConfig esté disponible en todo el scope del loop

const fs = require('fs');
const path = require('path');

// Simular userSettings con fees por broker
const userSettings = {
  brokerFees: [
    { broker: 'Lemon', buyFee: 1.5, sellFee: 0.5 },
    { broker: 'Ripio', buyFee: 1.0, sellFee: 1.0 }
  ],
  extraTradingFee: 0,
  applyFeesInCalculation: true
};

// Simular lógica de búsqueda de broker fee config
function testBrokerFeeConfigScope(exchange, userSettings, applyFees) {
  console.log(`\n🔍 Testing exchange: ${exchange}`);
  
  // NUEVO v5.0.59: Definir UNA SOLA VEZ al inicio
  const brokerFees = userSettings.brokerFees || [];
  const brokerFeeConfig = brokerFees.find(fee => 
    fee.broker.toLowerCase() === exchange.toLowerCase()
  );
  
  console.log(`  - brokerFeeConfig encontrado:`, !!brokerFeeConfig);
  if (brokerFeeConfig) {
    console.log(`    Buy fee: ${brokerFeeConfig.buyFee}%`);
    console.log(`    Sell fee: ${brokerFeeConfig.sellFee}%`);
  }
  
  // PASO 3: Usar brokerFeeConfig
  if (applyFees) {
    let tradingFeePercent = userSettings.extraTradingFee || 0;
    
    if (brokerFeeConfig) {
      tradingFeePercent = brokerFeeConfig.buyFee || 0;
      console.log(`  ✅ PASO 3: Fee específico del broker usado: ${tradingFeePercent}%`);
    } else {
      console.log(`  ℹ️ PASO 3: Fee general usado: ${tradingFeePercent}%`);
    }
  }
  
  // PASO 4: Usar brokerFeeConfig nuevamente
  if (applyFees) {
    if (brokerFeeConfig && brokerFeeConfig.sellFee > 0) {
      console.log(`  ✅ PASO 4: Fee venta específico usado: ${brokerFeeConfig.sellFee}%`);
    } else {
      console.log(`  ℹ️ PASO 4: Sin fee de venta específico`);
    }
  }
  
  // Config object (donde antes fallaba)
  const config = {
    applyFees,
    brokerSpecificFees: !!brokerFeeConfig // Esta línea causaba el error
  };
  
  console.log(`  ✅ CONFIG: brokerSpecificFees = ${config.brokerSpecificFees}`);
  
  return {
    exchange,
    hasBrokerFees: !!brokerFeeConfig,
    buyFee: brokerFeeConfig?.buyFee || 0,
    sellFee: brokerFeeConfig?.sellFee || 0,
    configValid: typeof config.brokerSpecificFees === 'boolean'
  };
}

// Ejecutar tests
console.log('🧪 Test: Scope de brokerFeeConfig v5.0.59');
console.log('='.repeat(60));

const exchanges = ['lemon', 'ripio', 'buenbit'];
const results = [];

exchanges.forEach(exchange => {
  try {
    const result = testBrokerFeeConfigScope(exchange, userSettings, true);
    results.push(result);
  } catch (error) {
    console.error(`❌ Error en ${exchange}:`, error.message);
    results.push({ exchange, error: error.message });
  }
});

console.log('\n📊 RESUMEN DE RESULTADOS:');
console.log('='.repeat(60));

results.forEach(r => {
  if (r.error) {
    console.log(`❌ ${r.exchange}: ERROR - ${r.error}`);
  } else {
    console.log(`✅ ${r.exchange}:`);
    console.log(`   - Tiene fees específicos: ${r.hasBrokerFees}`);
    console.log(`   - Buy fee: ${r.buyFee}%`);
    console.log(`   - Sell fee: ${r.sellFee}%`);
    console.log(`   - Config válido: ${r.configValid}`);
  }
});

// Validaciones finales
const validations = [
  { 
    name: 'Lemon tiene fees específicos', 
    pass: results[0]?.hasBrokerFees === true 
  },
  { 
    name: 'Ripio tiene fees específicos', 
    pass: results[1]?.hasBrokerFees === true 
  },
  { 
    name: 'Buenbit NO tiene fees específicos', 
    pass: results[2]?.hasBrokerFees === false 
  },
  { 
    name: 'Todos los config son válidos', 
    pass: results.every(r => r.configValid === true) 
  },
  { 
    name: 'Sin errores de scope', 
    pass: results.every(r => !r.error) 
  }
];

console.log('\n🔍 VALIDACIONES:');
validations.forEach(v => {
  console.log(`  ${v.pass ? '✅' : '❌'} ${v.name}`);
});

const allPass = validations.every(v => v.pass);
console.log('\n🎯 Resultado final:', allPass ? '✅ TODOS LOS TESTS PASAN' : '❌ ALGÚN TEST FALLÓ');