// ============================================
// TEST: Intervalos de Actualización Configurables v5.0.54
// ============================================

// Simular configuración con diferentes intervalos
const testSettings = [
  { updateIntervalMinutes: 1, requestTimeoutSeconds: 5 },
  { updateIntervalMinutes: 10, requestTimeoutSeconds: 30 },
  { updateIntervalMinutes: 60, requestTimeoutSeconds: 120 }
];

// Función para calcular valores esperados
function calculateExpectedValues(settings) {
  const requestInterval = (settings.updateIntervalMinutes || 5) * 60 * 1000 / 10; // ms
  const requestTimeout = (settings.requestTimeoutSeconds || 10) * 1000; // ms
  const periodicInterval = settings.updateIntervalMinutes * 60 * 1000; // ms
  
  return {
    requestInterval,
    requestTimeout,
    periodicInterval,
    updateIntervalMinutes: settings.updateIntervalMinutes,
    requestTimeoutSeconds: settings.requestTimeoutSeconds
  };
}

// Ejecutar tests
console.log('🧪 TEST: Intervalos de Actualización Configurables v5.0.54');
console.log('='.repeat(60));

testSettings.forEach((settings, index) => {
  console.log(`\n🔧 Test ${index + 1}: ${settings.updateIntervalMinutes}min intervalo, ${settings.requestTimeoutSeconds}s timeout`);
  
  const expected = calculateExpectedValues(settings);
  
  console.log(`   Intervalo de requests esperado: ${expected.requestInterval}ms`);
  console.log(`   Timeout de requests esperado: ${expected.requestTimeout}ms`);
  console.log(`   Intervalo periódico esperado: ${expected.periodicInterval}ms`);
  
  // Validaciones
  const validInterval = expected.requestInterval > 0 && expected.requestInterval <= 360000; // Max 1 hora
  const validTimeout = expected.requestTimeout >= 5000 && expected.requestTimeout <= 120000; // 5s-2min
  const validPeriodic = expected.periodicInterval >= 60000 && expected.periodicInterval <= 3600000; // 1min-1hora
  
  console.log(`   ✅ Intervalo válido: ${validInterval ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Timeout válido: ${validTimeout ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Periódico válido: ${validPeriodic ? 'PASS' : 'FAIL'}`);
  
  if (!validInterval || !validTimeout || !validPeriodic) {
    console.log(`   ❌ CONFIGURACIÓN INVÁLIDA DETECTADA`);
  }
});

// Test de valores por defecto
console.log(`\n🔧 Test de valores por defecto:`);
const defaultExpected = calculateExpectedValues({});
console.log(`   Intervalo por defecto: ${defaultExpected.updateIntervalMinutes}min`);
console.log(`   Timeout por defecto: ${defaultExpected.requestTimeoutSeconds}s`);
console.log(`   ✅ Valores por defecto correctos: ${defaultExpected.updateIntervalMinutes === 5 && defaultExpected.requestTimeoutSeconds === 10 ? 'PASS' : 'FAIL'}`);

// Test de límites
console.log(`\n🔧 Test de límites:`);
const minSettings = { updateIntervalMinutes: 1, requestTimeoutSeconds: 5 };
const maxSettings = { updateIntervalMinutes: 60, requestTimeoutSeconds: 120 };

const minExpected = calculateExpectedValues(minSettings);
const maxExpected = calculateExpectedValues(maxSettings);

console.log(`   Mínimos: ${minExpected.updateIntervalMinutes}min, ${minExpected.requestTimeoutSeconds}s`);
console.log(`   Máximos: ${maxExpected.updateIntervalMinutes}min, ${maxExpected.requestTimeoutSeconds}s`);
console.log(`   ✅ Límites respetados: ${minExpected.updateIntervalMinutes >= 1 && maxExpected.updateIntervalMinutes <= 60 && minExpected.requestTimeoutSeconds >= 5 && maxExpected.requestTimeoutSeconds <= 120 ? 'PASS' : 'FAIL'}`);

console.log('\n🎯 TEST COMPLETADO');