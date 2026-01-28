/**
 * Script de prueba para verificar los módulos utils
 * Prueba de funcionalidad y disponibilidad
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('PRUEBA DE MÓDULOS UTILS - ArbitrageAR');
console.log('='.repeat(60));

// Test 1: Verificar existencia de archivos
console.log('\n📋 TEST 1: Verificar Existencia de Archivos');
console.log('-'.repeat(60));

const utilsFiles = [
  'src/utils/stateManager.js',
  'src/utils/formatters.js',
  'src/utils/logger.js',
  'src/ui/routeRenderer.js'
];

utilsFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const size = exists ? fs.statSync(filePath).size : 0;

  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (exists) {
    console.log(`   Tamaño: ${size} bytes`);
  }
});

// Test 2: Verificar contenido de los archivos
console.log('\n📋 TEST 2: Verificar Contenido de los Archivos');
console.log('-'.repeat(60));

const checkFileContent = (filePath, patterns) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results = [];

  patterns.forEach(pattern => {
    const found = content.includes(pattern);
    results.push({ pattern, found });
  });

  return results;
};

// Verificar StateManager
const stateManagerPath = path.join(__dirname, 'src/utils/stateManager.js');
const stateManagerChecks = checkFileContent(stateManagerPath, [
  'const StateManager',
  'window.StateManager = StateManager',
  'get',
  'set',
  'subscribe'
]);

console.log('\n📁 StateManager.js:');
stateManagerChecks.forEach(check => {
  console.log(`  ${check.found ? '✅' : '❌'} Contiene "${check.pattern}"`);
});

// Verificar Formatters
const formattersPath = path.join(__dirname, 'src/utils/formatters.js');
const formattersChecks = checkFileContent(formattersPath, [
  'window.Formatters = {',
  'formatARS',
  'formatUSD',
  'formatProfitPercent'
]);

console.log('\n📁 Formatters.js:');
formattersChecks.forEach(check => {
  console.log(`  ${check.found ? '✅' : '❌'} Contiene "${check.pattern}"`);
});

// Verificar Logger
const loggerPath = path.join(__dirname, 'src/utils/logger.js');
const loggerChecks = checkFileContent(loggerPath, [
  'const Logger',
  'window.Logger',
  'info',
  'warn',
  'error',
  'debug'
]);

console.log('\n📁 Logger.js:');
loggerChecks.forEach(check => {
  console.log(`  ${check.found ? '✅' : '❌'} Contiene "${check.pattern}"`);
});

// Verificar RouteRenderer
const routeRendererPath = path.join(__dirname, 'src/ui/routeRenderer.js');
const routeRendererChecks = checkFileContent(routeRendererPath, [
  'const RouteRenderer',
  'window.RouteRenderer',
  'renderRouteCard',
  'renderRoutes',
  'getProfitClasses'
]);

console.log('\n📁 RouteRenderer.js:');
routeRendererChecks.forEach(check => {
  console.log(`  ${check.found ? '✅' : '❌'} Contiene "${check.pattern}"`);
});

// Test 3: Verificar exportaciones globales
console.log('\n📋 TEST 3: Verificar Exportaciones Globales');
console.log('-'.repeat(60));

const checkGlobalExports = (filePath, globalName) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const hasWindowCheck = content.includes('if (typeof window !== \'undefined\')');
  // Verificar si exporta a window (puede ser window.Nombre = Nombre o window.Nombre = {...})
  const hasWindowAssignment = content.includes(`window.${globalName} = `);
  return hasWindowCheck && hasWindowAssignment;
};

console.log('\nVerificación de exportaciones a window:');
console.log(`  ${checkGlobalExports(stateManagerPath, 'StateManager') ? '✅' : '❌'} StateManager exporta a window.StateManager`);
console.log(`  ${checkGlobalExports(formattersPath, 'Formatters') ? '✅' : '❌'} Formatters exporta a window.Formatters`);
console.log(`  ${checkGlobalExports(loggerPath, 'Logger') ? '✅' : '❌'} Logger exporta a window.Logger`);
console.log(`  ${checkGlobalExports(routeRendererPath, 'RouteRenderer') ? '✅' : '❌'} RouteRenderer exporta a window.RouteRenderer`);

// Test 4: Verificar referencias en popup.html
console.log('\n📋 TEST 4: Verificar Referencias en popup.html');
console.log('-'.repeat(60));

const popupHtmlPath = path.join(__dirname, 'src/popup.html');
const popupContent = fs.readFileSync(popupHtmlPath, 'utf-8');

const scriptReferences = [
  'utils/stateManager.js',
  'utils/formatters.js',
  'utils/logger.js',
  'ui/routeRenderer.js'
];

console.log('\nVerificación de etiquetas <script> en popup.html:');
scriptReferences.forEach(scriptRef => {
  const found = popupContent.includes(`<script src="${scriptRef}">`);
  console.log(`  ${found ? '✅' : '❌'} Contiene <script src="${scriptRef}">`);
});

// Test 5: Verificar orden de carga de scripts
console.log('\n📋 TEST 5: Verificar Orden de Carga de Scripts');
console.log('-'.repeat(60));

const scriptRegex = /<script src="([^"]+)">/g;
const scripts = [];
let match;

while ((match = scriptRegex.exec(popupContent)) !== null) {
  scripts.push(match[1]);
}

console.log('\nScripts encontrados en popup.html (en orden):');
scripts.forEach((script, index) => {
  console.log(`  ${index + 1}. ${script}`);
});

// Verificar que los scripts utils estén en el orden correcto
const stateManagerIdx = scripts.indexOf('utils/stateManager.js');
const formattersIdx = scripts.indexOf('utils/formatters.js');
const loggerIdx = scripts.indexOf('utils/logger.js');
const routeRendererIdx = scripts.indexOf('ui/routeRenderer.js');
const popupJsIdx = scripts.indexOf('popup.js');

console.log('\nVerificación de orden de carga:');
console.log(`  ${stateManagerIdx !== -1 ? '✅' : '❌'} stateManager.js cargado (índice: ${stateManagerIdx})`);
console.log(`  ${formattersIdx !== -1 ? '✅' : '❌'} formatters.js cargado (índice: ${formattersIdx})`);
console.log(`  ${loggerIdx !== -1 ? '✅' : '❌'} logger.js cargado (índice: ${loggerIdx})`);
console.log(`  ${routeRendererIdx !== -1 ? '✅' : '❌'} routeRenderer.js cargado (índice: ${routeRendererIdx})`);
console.log(`  ${popupJsIdx !== -1 ? '✅' : '❌'} popup.js cargado (índice: ${popupJsIdx})`);

// Verificar que popup.js se cargue después de los utils
const correctOrder = popupJsIdx > Math.max(stateManagerIdx, formattersIdx, loggerIdx, routeRendererIdx);
console.log(`  ${correctOrder ? '✅' : '❌'} popup.js se carga después de los módulos utils`);

// Test 6: Verificar dependencias de RouteRenderer
console.log('\n📋 TEST 6: Verificar Dependencias de RouteRenderer');
console.log('-'.repeat(60));

const routeRendererContent = fs.readFileSync(routeRendererPath, 'utf-8');

console.log('\nVerificación de dependencias en RouteRenderer:');
console.log(`  ${routeRendererContent.includes('window.Formatters') ? '✅' : '❌'} Hace referencia a window.Formatters`);
console.log(`  ${routeRendererContent.includes('window.StateManager') ? '✅' : '❌'} Hace referencia a window.StateManager`);

// Test 7: Verificar sintaxis de los archivos
console.log('\n📋 TEST 7: Verificar Sintaxis de los Archivos');
console.log('-'.repeat(60));

const checkSyntax = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Verificar balance de paréntesis y llaves
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;

    const parensBalanced = openParens === closeParens;
    const bracesBalanced = openBraces === closeBraces;

    return parensBalanced && bracesBalanced;
  } catch (error) {
    return false;
  }
};

console.log('\nVerificación de sintaxis:');
console.log(`  ${checkSyntax(stateManagerPath) ? '✅' : '❌'} stateManager.js tiene sintaxis válida`);
console.log(`  ${checkSyntax(formattersPath) ? '✅' : '❌'} formatters.js tiene sintaxis válida`);
console.log(`  ${checkSyntax(loggerPath) ? '✅' : '❌'} logger.js tiene sintaxis válida`);
console.log(`  ${checkSyntax(routeRendererPath) ? '✅' : '❌'} routeRenderer.js tiene sintaxis válida`);

// Resumen
console.log('\n' + '='.repeat(60));
console.log('RESUMEN DE PRUEBAS');
console.log('='.repeat(60));

const allFilesExist = utilsFiles.every(file => fs.existsSync(path.join(__dirname, file)));
const allScriptsInHtml = scriptReferences.every(ref => popupContent.includes(`<script src="${ref}"></script>`));
const allModulesExported = [
  checkGlobalExports(stateManagerPath, 'StateManager'),
  checkGlobalExports(formattersPath, 'Formatters'),
  checkGlobalExports(loggerPath, 'Logger'),
  checkGlobalExports(routeRendererPath, 'RouteRenderer')
].every(Boolean);
const correctLoadOrder = correctOrder;
const allSyntaxValid = [
  checkSyntax(stateManagerPath),
  checkSyntax(formattersPath),
  checkSyntax(loggerPath),
  checkSyntax(routeRendererPath)
].every(Boolean);

const checks = [
  { name: 'Archivos existen', passed: allFilesExist },
  { name: 'Scripts en popup.html', passed: allScriptsInHtml },
  { name: 'Módulos exportados a window', passed: allModulesExported },
  { name: 'Orden de carga correcto', passed: correctLoadOrder },
  { name: 'Sintaxis válida', passed: allSyntaxValid }
];

checks.forEach(check => {
  console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
});

const passedCount = checks.filter(c => c.passed).length;
const totalCount = checks.length;

console.log(`\nTotal de verificaciones: ${totalCount}`);
console.log(`✅ Pasadas: ${passedCount}`);
console.log(`❌ Fallidas: ${totalCount - passedCount}`);

if (passedCount === totalCount) {
  console.log('\n🎉 TODAS LAS VERIFICACIONES PASARON');
} else {
  console.log('\n⚠️ ALGUNAS VERIFICACIONES FALLARON');
}

console.log('='.repeat(60));
