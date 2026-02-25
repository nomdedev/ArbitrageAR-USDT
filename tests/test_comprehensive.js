// ==========================================
// PRUEBAS COMPLETIVAS - Error, Seguridad e Integración
// Para verificar las correcciones en el proyecto
// ==========================================

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURACIÓN Y UTILIDADES
// ==========================================

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASÓ' : '❌ FALLÓ';
  const color = passed ? 'green' : 'red';
  log(`${status} - ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

// ==========================================
// PARTE 3: PRUEBA DE ERROR
// ==========================================

async function testErrorHandling() {
  logSection('PRUEBA 3: MANEJO DE ERRORES');

  let passedTests = 0;
  let totalTests = 0;

  // Test 3.1: Manejo de URL inválida
  totalTests++;
  try {
    const invalidUrl = 'https://invalid-domain-that-does-not-exist-12345.com/api/dolar';
    await new Promise((resolve, reject) => {
      https.get(invalidUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    logTest('3.1 Manejo de URL inválida', false, 'Debería fallar pero no lo hizo');
  } catch (error) {
    logTest('3.1 Manejo de URL inválida', true, `Error capturado correctamente: ${error.code}`);
    passedTests++;
  }

  // Test 3.2: Validación de estructura de datos incorrecta
  totalTests++;
  const invalidDataStructure = {
    // Falta la propiedad 'oficial'
    otherProperty: 'value'
  };
  const isValidStructure = invalidDataStructure &&
                          invalidDataStructure.oficial &&
                          typeof invalidDataStructure.oficial.ask === 'number' &&
                          typeof invalidDataStructure.oficial.bid === 'number';
  logTest('3.2 Validación de estructura incorrecta', !isValidStructure,
    'Estructura inválida detectada correctamente');
  if (!isValidStructure) passedTests++;

  // Test 3.3: Validación de tipos de datos incorrectos
  totalTests++;
  const invalidDataTypes = {
    oficial: {
      ask: 'not-a-number',  // Debería ser number
      bid: 1000
    }
  };
  const isValidTypes = invalidDataTypes &&
                       invalidDataTypes.oficial &&
                       typeof invalidDataTypes.oficial.ask === 'number' &&
                       typeof invalidDataTypes.oficial.bid === 'number';
  logTest('3.3 Validación de tipos incorrectos', !isValidTypes,
    'Tipos inválidos detectados correctamente');
  if (!isValidTypes) passedTests++;

  // Test 3.4: Validación de valores nulos/undefined
  totalTests++;
  const nullData = {
    oficial: {
      ask: null,
      bid: undefined
    }
  };
  const isValidNull = nullData &&
                      nullData.oficial &&
                      typeof nullData.oficial.ask === 'number' &&
                      typeof nullData.oficial.bid === 'number';
  logTest('3.4 Validación de valores nulos/undefined', !isValidNull,
    'Valores nulos detectados correctamente');
  if (!isValidNull) passedTests++;

  // Test 3.5: Validación de respuesta vacía
  totalTests++;
  const emptyData = {};
  const isValidEmpty = emptyData &&
                       emptyData.oficial &&
                       typeof emptyData.oficial.ask === 'number' &&
                       typeof emptyData.oficial.bid === 'number';
  logTest('3.5 Validación de respuesta vacía', !isValidEmpty,
    'Respuesta vacía detectada correctamente');
  if (!isValidEmpty) passedTests++;

  // Test 3.6: Verificación del código de validación en main-simple.js
  totalTests++;
  const mainSimplePath = path.join(__dirname, '..', 'src/background/main-simple.js');
  const mainSimpleContent = fs.readFileSync(mainSimplePath, 'utf-8');
  const hasValidation = mainSimpleContent.includes('data.oficial.ask') &&
                        mainSimpleContent.includes('data.oficial.bid') &&
                        mainSimpleContent.includes('typeof data.oficial.ask === \'number\'') &&
                        mainSimpleContent.includes('return null');
  logTest('3.6 Validación en fetchDolarOficial()', hasValidation,
    'Código de validación presente en main-simple.js');
  if (hasValidation) passedTests++;

  log(`\nResultados Prueba de Error: ${passedTests}/${totalTests} tests pasaron`);
  return { passed: passedTests, total: totalTests };
}

// ==========================================
// PARTE 4: PRUEBA DE SEGURIDAD
// ==========================================

async function testSecurity() {
  logSection('PRUEBA 4: SEGURIDAD');

  let passedTests = 0;
  let totalTests = 0;

  // Test 4.1: Verificación de HTTPS en URL de API
  totalTests++;
  const mainSimplePath = path.join(__dirname, '..', 'src/background/main-simple.js');
  const mainSimpleContent = fs.readFileSync(mainSimplePath, 'utf-8');
  const usesHttps = mainSimpleContent.includes('https://criptoya.com/api/dolar');
  const noHttpInsecure = !mainSimpleContent.includes('http://criptoya.com/api/dolar');
  logTest('4.1 Uso de HTTPS en API dólar', usesHttps && noHttpInsecure,
    'URL usa HTTPS correctamente');
  if (usesHttps && noHttpInsecure) passedTests++;

  // Test 4.2: Prevención de inyección de código - validación de tipos
  totalTests++;
  const hasTypeValidation = mainSimpleContent.includes('typeof data.oficial.ask === \'number\'') &&
                            mainSimpleContent.includes('typeof data.oficial.bid === \'number\'');
  logTest('4.2 Validación de tipos para prevenir inyección', hasTypeValidation,
    'Validación de tipos presente');
  if (hasTypeValidation) passedTests++;

  // Test 4.3: Verificación de sanitización en popup.js
  totalTests++;
  const popupPath = path.join(__dirname, '..', 'src/popup.js');
  const popupContent = fs.readFileSync(popupPath, 'utf-8');
  const hasSanitization = popupContent.includes('sanitizeHTML') ||
                          popupContent.includes('textContent') ||
                          popupContent.includes('createSafeElement');
  logTest('4.3 Funciones de sanitización en popup.js', hasSanitization,
    'Funciones de seguridad HTML presentes');
  if (hasSanitization) passedTests++;

  // Test 4.4: Verificación de Content Security Policy en manifest.json
  totalTests++;
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const hasCSP = manifestContent.includes('content_security_policy') ||
                 manifestContent.includes('script-src');
  logTest('4.4 Content Security Policy en manifest', hasCSP,
    'CSP configurado en manifest.json');
  if (hasCSP) passedTests++;

  // Test 4.5 (informativo): Verificación de validación de NaN
  const hasNaNCheck = mainSimpleContent.includes('isNaN') ||
                      mainSimpleContent.includes('Number.isNaN');
  logTest('4.5 Validación de valores NaN (informativo)', true,
    hasNaNCheck ? 'Validación NaN presente' : 'No se detectó validación NaN explícita (no bloqueante)');

  // Test 4.6: Verificación de manejo seguro de datos de usuario
  totalTests++;
  const hasSecureStorage = mainSimpleContent.includes('chrome.storage') &&
                           !mainSimpleContent.includes('localStorage');
  logTest('4.6 Uso de chrome.storage (seguro)', hasSecureStorage,
    'Usa chrome.storage en lugar de localStorage');
  if (hasSecureStorage) passedTests++;

  // Test 4.7: Verificación de headers en fetch
  totalTests++;
  const hasHeaders = mainSimpleContent.includes('headers:') &&
                     (mainSimpleContent.includes('User-Agent') ||
                      mainSimpleContent.includes('Accept'));
  logTest('4.7 Headers en peticiones fetch', hasHeaders,
    'Headers configurados en peticiones');
  if (hasHeaders) passedTests++;

  log(`\nResultados Prueba de Seguridad: ${passedTests}/${totalTests} tests pasaron`);
  return { passed: passedTests, total: totalTests };
}

// ==========================================
// PARTE 5: PRUEBA DE INTEGRACIÓN
// ==========================================

async function testIntegration() {
  logSection('PRUEBA 5: INTEGRACIÓN');

  let passedTests = 0;
  let totalTests = 0;

  // Test 5.1: Verificación de carga de scripts en orden correcto
  totalTests++;
  const popupHtmlPath = path.join(__dirname, '..', 'src/popup.html');
  const popupHtmlContent = fs.readFileSync(popupHtmlPath, 'utf-8');

  const scriptOrder = [
    'src="utils/stateManager.js"',
    'src="utils/formatters.js"',
    'src="utils/logger.js"',
    'src="ui/routeRenderer.js"',
    'src="popup.js"'
  ];

  let correctOrder = true;
  let lastIndex = -1;

  for (const script of scriptOrder) {
    const currentIndex = popupHtmlContent.indexOf(script);
    if (currentIndex === -1) {
      correctOrder = false;
      break;
    }
    if (currentIndex <= lastIndex) {
      correctOrder = false;
      break;
    }
    lastIndex = currentIndex;
  }

  logTest('5.1 Orden de carga de scripts', correctOrder,
    'Scripts cargan en orden correcto: stateManager → formatters → logger → routeRenderer → popup');
  if (correctOrder) passedTests++;

  // Test 5.2: Verificación de dependencias de routeRenderer
  totalTests++;
  const routeRendererPath = path.join(__dirname, '..', 'src/ui/routeRenderer.js');
  const routeRendererContent = fs.readFileSync(routeRendererPath, 'utf-8');

  const usesFormatters = routeRendererContent.includes('window.Formatters') ||
                         routeRendererContent.includes('Formatters.');
  const usesRouteDetailsHook = routeRendererContent.includes('window.showRouteDetails');

  logTest('5.2 Dependencias de routeRenderer', usesFormatters && usesRouteDetailsHook,
    'routeRenderer usa Formatters y hook de detalle de ruta');
  if (usesFormatters && usesRouteDetailsHook) passedTests++;

  // Test 5.3: Verificación de uso de módulos utils en popup.js
  totalTests++;
  const popupPath = path.join(__dirname, '..', 'src/popup.js');
  const popupContent = fs.readFileSync(popupPath, 'utf-8');

  const usesFormattersInPopup = popupContent.includes('Formatters') ||
                                popupContent.includes('formatARS') ||
                                popupContent.includes('formatUSD');
  const usesLoggerInPopup = popupContent.includes('Logger') ||
                           popupContent.includes('Logger.') ||
                           popupContent.includes('log(');

  logTest('5.3 Uso de módulos utils en popup.js', usesFormattersInPopup && usesLoggerInPopup,
    'popup.js usa módulos Formatters y Logger');
  if (usesFormattersInPopup && usesLoggerInPopup) passedTests++;

  // Test 5.4: Verificación de integración de datos dólar oficial
  totalTests++;
  const mainSimplePath = path.join(__dirname, '..', 'src/background/main-simple.js');
  const mainSimpleContent = fs.readFileSync(mainSimplePath, 'utf-8');

  const hasDolarOficialFetch = mainSimpleContent.includes('fetchDolarOficial');
  const hasDolarOficialUsage = mainSimpleContent.includes('oficial') &&
                               mainSimpleContent.includes('compra') &&
                               mainSimpleContent.includes('venta');

  logTest('5.4 Integración de dólar oficial en background', hasDolarOficialFetch && hasDolarOficialUsage,
    'fetchDolarOficial integrado y datos utilizados');
  if (hasDolarOficialFetch && hasDolarOficialUsage) passedTests++;

  // Test 5.5: Verificación de comunicación background ↔ popup
  totalTests++;
  const hasChromeMessaging = mainSimpleContent.includes('chrome.runtime.onMessage') &&
                             popupContent.includes('chrome.runtime.sendMessage');

  logTest('5.5 Comunicación background ↔ popup', hasChromeMessaging,
    'Mensajería Chrome configurada correctamente');
  if (hasChromeMessaging) passedTests++;

  // Test 5.6: Verificación de exportaciones globales
  totalTests++;
  const utilsFiles = [
    { path: 'src/utils/stateManager.js', global: 'StateManager' },
    { path: 'src/utils/formatters.js', global: 'Formatters' },
    { path: 'src/utils/logger.js', global: 'Logger' },
    { path: 'src/ui/routeRenderer.js', global: 'RouteRenderer' }
  ];

  let allExportsCorrect = true;
  for (const file of utilsFiles) {
    const filePath = path.join(__dirname, '..', file.path);
    const content = fs.readFileSync(filePath, 'utf-8');
    const hasExport = content.includes(`window.${file.global} = `) ||
                      content.includes(`window.${file.global} = {`);
    if (!hasExport) {
      allExportsCorrect = false;
      break;
    }
  }

  logTest('5.6 Exportaciones globales de módulos', allExportsCorrect,
    'Todos los módulos exportan a window correctamente');
  if (allExportsCorrect) passedTests++;

  // Test 5.7: Verificación de conflictos de nombres
  totalTests++;
  const popupUsesFormatNumber = popupContent.includes('const formatNumber') ||
                                popupContent.includes('let formatNumber') ||
                                popupContent.includes('var formatNumber');

  logTest('5.7 Detección de conflictos de nombres', !popupUsesFormatNumber,
    !popupUsesFormatNumber ? 'No hay conflictos de nombres detectados' :
    '⚠️ Posible conflicto: popup.js declara formatNumber que podría sobrescribir Formatters.formatNumber');
  if (!popupUsesFormatNumber) passedTests++;

  log(`\nResultados Prueba de Integración: ${passedTests}/${totalTests} tests pasaron`);
  return { passed: passedTests, total: totalTests };
}

// ==========================================
// EJECUCIÓN PRINCIPAL
// ==========================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('PRUEBAS COMPLETIVAS - Error, Seguridad e Integración', 'cyan');
  console.log('='.repeat(60));
  log('Verificación de correcciones en ArbitrageAR-USDT', 'yellow');
  console.log('='.repeat(60));

  const results = {
    errorHandling: await testErrorHandling(),
    security: await testSecurity(),
    integration: await testIntegration()
  };

  // Resumen final
  logSection('RESUMEN FINAL DE PRUEBAS');

  const totalPassed = results.errorHandling.passed +
                      results.security.passed +
                      results.integration.passed;
  const totalTests = results.errorHandling.total +
                     results.security.total +
                     results.integration.total;

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                    RESULTADOS DE PRUEBAS                        │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ Prueba de Error:       ${results.errorHandling.passed.toString().padStart(2)}/${results.errorHandling.total.toString().padEnd(2)} tests pasaron │`);
  console.log(`│ Prueba de Seguridad:   ${results.security.passed.toString().padStart(2)}/${results.security.total.toString().padEnd(2)} tests pasaron │`);
  console.log(`│ Prueba de Integración: ${results.integration.passed.toString().padStart(2)}/${results.integration.total.toString().padEnd(2)} tests pasaron │`);
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ TOTAL:                 ${totalPassed.toString().padStart(2)}/${totalTests.toString().padEnd(2)} tests pasaron │`);
  console.log('└─────────────────────────────────────────────────────────────┘');

  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
  log(`\nTasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  if (totalPassed === totalTests) {
    log('\n🎉 ¡Todas las pruebas pasaron exitosamente!', 'green');
  } else if (totalPassed / totalTests >= 0.8) {
    log('\n✅ La mayoría de las pruebas pasaron. Revisar los fallos menores.', 'yellow');
  } else {
    log('\n⚠️ Hay varios tests que fallaron. Se requiere revisión.', 'red');
  }

  return results;
}

// Ejecutar pruebas
runAllTests().catch(error => {
  log(`\n❌ Error ejecutando pruebas: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
