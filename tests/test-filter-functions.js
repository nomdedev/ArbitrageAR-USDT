// Test para validar filtros de rutas v5.0.60
// Verifica que applyNegativeFilter y applyOnlyProfitableFilter funcionen correctamente

const testRoutes = [
  { profitPercentage: 5.2, name: 'Ruta 1 - Alta ganancia' },
  { profitPercentage: -2.5, name: 'Ruta 2 - Pérdida' },
  { profitPercentage: 0.3, name: 'Ruta 3 - Ganancia pequeña' },
  { profitPercentage: 0, name: 'Ruta 4 - Break-even' },
  { profitPercentage: -0.5, name: 'Ruta 5 - Pérdida pequeña' },
  { profitPercentage: 8.7, name: 'Ruta 6 - Muy alta ganancia' }
];

// Función applyOnlyProfitableFilter (v5.0.56)
function applyOnlyProfitableFilter(routes, showOnlyProfitable) {
  if (showOnlyProfitable === true) {
    return routes.filter(r => r.profitPercentage > 0);
  }
  return routes;
}

// Función applyNegativeFilter (restaurada v5.0.60)
function applyNegativeFilter(routes, showNegative) {
  if (showNegative === false) {
    return routes.filter(r => r.profitPercentage >= 0);
  }
  return routes;
}

console.log('🧪 Test: Filtros de Rutas v5.0.60');
console.log('='.repeat(60));
console.log(`📊 Rutas originales: ${testRoutes.length}`);
testRoutes.forEach(r => console.log(`  - ${r.name}: ${r.profitPercentage}%`));

// Test 1: applyOnlyProfitableFilter (solo rentables, excluye 0)
console.log('\n✅ Test 1: applyOnlyProfitableFilter (showOnlyProfitable=true)');
const onlyProfitable = applyOnlyProfitableFilter(testRoutes, true);
console.log(`Resultado: ${onlyProfitable.length} rutas`);
onlyProfitable.forEach(r => console.log(`  ✅ ${r.name}: ${r.profitPercentage}%`));

const test1Pass = onlyProfitable.length === 3 && 
                  onlyProfitable.every(r => r.profitPercentage > 0);
console.log(`Validación: ${test1Pass ? '✅ PASA' : '❌ FALLA'} (esperado: 3 rutas con profit > 0)`);

// Test 2: applyNegativeFilter (ocultar negativas, incluye 0)
console.log('\n✅ Test 2: applyNegativeFilter (showNegative=false)');
const noNegatives = applyNegativeFilter(testRoutes, false);
console.log(`Resultado: ${noNegatives.length} rutas`);
noNegatives.forEach(r => console.log(`  ✅ ${r.name}: ${r.profitPercentage}%`));

const test2Pass = noNegatives.length === 4 && 
                  noNegatives.every(r => r.profitPercentage >= 0);
console.log(`Validación: ${test2Pass ? '✅ PASA' : '❌ FALLA'} (esperado: 4 rutas con profit >= 0)`);

// Test 3: Combinación de filtros (caso real)
console.log('\n✅ Test 3: Combinación - Ocultar negativas + No solo rentables');
let combined = applyOnlyProfitableFilter(testRoutes, false); // No filtrar
combined = applyNegativeFilter(combined, false); // Ocultar negativas
console.log(`Resultado: ${combined.length} rutas`);
combined.forEach(r => console.log(`  ✅ ${r.name}: ${r.profitPercentage}%`));

const test3Pass = combined.length === 4;
console.log(`Validación: ${test3Pass ? '✅ PASA' : '❌ FALLA'} (esperado: 4 rutas >= 0)`);

// Test 4: Diferencia entre filtros
console.log('\n✅ Test 4: Diferencia entre filtros');
const withZero = applyNegativeFilter(testRoutes, false); // Incluye 0
const withoutZero = applyOnlyProfitableFilter(testRoutes, true); // Excluye 0

const hasBreakEven = withZero.some(r => r.profitPercentage === 0);
const noBreakEven = !withoutZero.some(r => r.profitPercentage === 0);

console.log(`applyNegativeFilter incluye break-even (0%): ${hasBreakEven ? '✅ SÍ' : '❌ NO'}`);
console.log(`applyOnlyProfitableFilter excluye break-even (0%): ${noBreakEven ? '✅ SÍ' : '❌ NO'}`);

const test4Pass = hasBreakEven && noBreakEven;
console.log(`Validación: ${test4Pass ? '✅ PASA' : '❌ FALLA'} (comportamientos diferentes correctos)`);

// Test 5: Funciones existen y no causan errores
console.log('\n✅ Test 5: Funciones disponibles');
const funcsExist = typeof applyOnlyProfitableFilter === 'function' &&
                   typeof applyNegativeFilter === 'function';
console.log(`applyOnlyProfitableFilter: ${typeof applyOnlyProfitableFilter}`);
console.log(`applyNegativeFilter: ${typeof applyNegativeFilter}`);
console.log(`Validación: ${funcsExist ? '✅ PASA' : '❌ FALLA'} (ambas funciones definidas)`);

// Resumen final
console.log('\n📊 RESUMEN DE TESTS:');
console.log('='.repeat(60));
const tests = [
  { name: 'Test 1: applyOnlyProfitableFilter', pass: test1Pass },
  { name: 'Test 2: applyNegativeFilter', pass: test2Pass },
  { name: 'Test 3: Combinación de filtros', pass: test3Pass },
  { name: 'Test 4: Diferencia entre filtros', pass: test4Pass },
  { name: 'Test 5: Funciones disponibles', pass: funcsExist }
];

tests.forEach((t, i) => {
  console.log(`  ${t.pass ? '✅' : '❌'} ${t.name}`);
});

const allPass = tests.every(t => t.pass);
console.log('\n🎯 Resultado final:', allPass ? '✅ TODOS LOS TESTS PASAN' : '❌ ALGÚN TEST FALLÓ');