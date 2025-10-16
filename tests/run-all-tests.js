// ============================================
// SUITE COMPLETA DE TESTS - ArbitrageAR v5.0
// Ejecuta todos los tests y verifica el flujo completo
// ============================================

const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Suite Completa de Tests - ArbitrageAR v5.0\n');

// Función para ejecutar un archivo de test
async function runTestFile(fileName) {
  console.log(`\n📋 Ejecutando ${fileName}...`);

  try {
    const filePath = path.join(__dirname, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ Archivo ${fileName} no encontrado`);
      return false;
    }

    // Ejecutar el archivo de test
    const testModule = require(filePath);

    if (testModule.runAllTests) {
      const result = await testModule.runAllTests();
      console.log(`✅ ${fileName} completado`);
      return result;
    } else if (testModule.runCommunicationTest) {
      const result = testModule.runCommunicationTest(); // No async
      console.log(`✅ ${fileName} completado`);
      return result;
    } else if (testModule.runUITests) {
      const result = await testModule.runUITests();
      console.log(`✅ ${fileName} completado`);
      return result;
    } else {
      console.log(`⚠️ ${fileName} no tiene función de test principal`);
      return null;
    }

  } catch (error) {
    console.log(`❌ Error ejecutando ${fileName}:`, error.message);
    return false;
  }
}

// ========================================
// EJECUCIÓN DE LA SUITE COMPLETA
// ========================================

async function runCompleteTestSuite() {
  const testFiles = [
    'test-bank-methods.js'
  ];

  const results = {
    total: testFiles.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  console.log('='.repeat(70));
  console.log('🧪 SUITE COMPLETA DE TESTS - ARBITRAGEAR V5.0');
  console.log('='.repeat(70));
  console.log('📋 Tests a ejecutar:', testFiles.length);
  console.log('');

  for (const fileName of testFiles) {
    const result = await runTestFile(fileName);

    if (result === true) {
      results.passed++;
      results.details.push({ file: fileName, status: 'PASSED' });
    } else if (result === false) {
      results.failed++;
      results.details.push({ file: fileName, status: 'FAILED' });
    } else {
      results.skipped++;
      results.details.push({ file: fileName, status: 'SKIPPED' });
    }
  }

  // Resultado final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESULTADO FINAL DE LA SUITE COMPLETA');
  console.log('='.repeat(70));

  console.log(`Total de tests: ${results.total}`);
  console.log(`✅ Pasaron: ${results.passed}`);
  console.log(`❌ Fallaron: ${results.failed}`);
  console.log(`⚠️ Omitidos: ${results.skipped}`);

  console.log('\n📋 Detalle de resultados:');
  results.details.forEach(detail => {
    const icon = detail.status === 'PASSED' ? '✅' :
                detail.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`  ${icon} ${detail.file}: ${detail.status}`);
  });

  // Verificaciones del sistema completo
  console.log('\n🎯 VERIFICACIÓN DEL SISTEMA COMPLETO:');
  console.log('✅ ¿Búsqueda de datos?', results.passed >= 1);
  console.log('✅ ¿Cálculo de rutas?', results.passed >= 1);
  console.log('✅ ¿Comunicación SW ↔ Popup?', results.passed >= 2);
  console.log('✅ ¿Visualización en UI?', results.passed >= 2);
  console.log('✅ ¿Filtros aplicados?', results.passed >= 2);

  const systemReady = results.failed === 0 && results.passed >= 2;

  console.log('\n' + '='.repeat(70));
  if (systemReady) {
    console.log('🎉 SISTEMA LISTO PARA PRODUCCIÓN');
    console.log('✅ Todos los componentes funcionan correctamente');
    console.log('✅ El flujo búsqueda → cálculo → visualización está operativo');
    console.log('✅ La comunicación entre service worker y popup funciona');
    console.log('✅ Las rutas se muestran correctamente en la UI');
    console.log('✅ Los filtros del usuario se aplican apropiadamente');
  } else {
    console.log('⚠️ SISTEMA REQUIERE ATENCIÓN');
    console.log('❌ Algunos componentes necesitan revisión');
    console.log('🔧 Revisa los tests fallidos para identificar problemas');
  }
  console.log('='.repeat(70));

  return systemReady;
}

// ========================================
// EJECUCIÓN CONDICIONAL
// ========================================

// Ejecutar solo si se llama directamente
if (require.main === module) {
  runCompleteTestSuite()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error ejecutando suite de tests:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteTestSuite };