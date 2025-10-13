// Test Maestro: Configurabilidad Completa v5.0.57
// Ejecuta todos los tests de configurabilidad

console.log('🧪 SUITE DE TESTS: Configurabilidad Completa v5.0.57');
console.log('='.repeat(60));

const tests = [
  'test-display-modes.js',
  'test-api-urls-config.js',
  'test-bank-filters.js',
  'test-security-options.js'
];

let passed = 0;
let total = tests.length;

tests.forEach(test => {
  console.log(`\n▶️ Ejecutando ${test}...`);
  try {
    require('./' + test);
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
} else {
  console.log('⚠️ Algunos tests fallaron - revisar implementaciones');
}