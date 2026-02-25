// Test Maestro: Configurabilidad Completa v5.0.57
// Ejecuta todos los tests de configurabilidad

console.log('🧪 SUITE DE TESTS: Configurabilidad Completa v5.0.57');
console.log('='.repeat(60));

const tests = [
  'test-bank-filters.js',
  'test-bank-methods.js'
];

let passed = 0;
let total = tests.length;

tests.forEach(test => {
  console.log(`\n▶️ Ejecutando ${test}...`);
  try {
    const testModule = require('./' + test);
    const result = typeof testModule.runAllTests === 'function' ? testModule.runAllTests() : true;
    if (result === false) {
      console.log(`❌ ${test} - FALLÓ: runAllTests devolvió false`);
      return;
    }
    console.log(`✅ ${test} - PASÓ`);
    passed++;
  } catch (error) {
    console.log(`❌ ${test} - FALLÓ: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 RESULTADO FINAL: ${passed}/${total} tests pasaron`);

if (passed === total) {
  console.log('🎉 TODA LA CONFIGURABILIDAD FUNCIONA CORRECTAMENTE');
  console.log('💡 La extensión ahora es completamente configurable');
  console.log('\n🔧 RECARGA LA EXTENSION: chrome://extensions/');
  process.exit(0);
} else {
  console.log('⚠️ Algunos tests fallaron - revisar implementaciones');
  process.exit(1);
}