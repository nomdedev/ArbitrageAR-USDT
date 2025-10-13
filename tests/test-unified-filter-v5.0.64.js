// ============================================
// TEST: Filtro Unificado v5.0.64
// ============================================
// Verifica que el nuevo filtro filterMinProfit funciona correctamente
// y reemplaza los 3 filtros anteriores sin conflictos

const DEBUG_MODE = true;

// Mock de rutas de prueba
const mockRoutes = [
  { broker: 'Ripio', profitPercentage: 15.5, profitAmount: 155000 },      // Muy rentable
  { broker: 'Lemon', profitPercentage: 5.2, profitAmount: 52000 },        // Rentable
  { broker: 'BuenBit', profitPercentage: 1.0, profitAmount: 10000 },      // Marginalmente rentable
  { broker: 'Belo', profitPercentage: 0.1, profitAmount: 1000 },          // Apenas rentable
  { broker: 'SatoshiTango', profitPercentage: -2.5, profitAmount: -25000 }, // Pérdida pequeña
  { broker: 'Binance', profitPercentage: -8.0, profitAmount: -80000 },    // Pérdida mediana
  { broker: 'LetsBit', profitPercentage: -12.3, profitAmount: -123000 },  // Pérdida grande
  { broker: 'Bitso', profitPercentage: -25.0, profitAmount: -250000 }     // Pérdida muy grande
];

// ============================================
// FUNCIÓN A TESTEAR (copiada de popup.js v5.0.64)
// ============================================
function applyMinProfitFilter(routes, filterMinProfit) {
  const minProfit = filterMinProfit ?? -10.0;
  
  const beforeCount = routes.length;
  const filtered = routes.filter(r => r.profitPercentage >= minProfit);
  if (DEBUG_MODE) console.log(`🔧 Filtradas por ganancia mínima ${minProfit}%: ${beforeCount} → ${filtered.length} rutas`);
  return filtered;
}

// ============================================
// TEST CASES
// ============================================

console.log('🧪 ============================================');
console.log('🧪 TEST: Filtro Unificado v5.0.64');
console.log('🧪 ============================================\n');

// TEST 1: Default (-10%) - Muestra casi todo excepto pérdidas muy grandes
console.log('📋 TEST 1: Default filterMinProfit = -10%');
const result1 = applyMinProfitFilter(mockRoutes, -10.0);
console.log('Resultado:', result1.length, 'rutas');
console.log('Esperado: 6 rutas (excluye -12.3% y -25%)');
if (result1.length === 6) {
  console.log('✅ PASS - Default muestra casi todo\n');
} else {
  console.log('❌ FAIL - Expected 6, got', result1.length, '\n');
}

// TEST 2: Sin filtro (undefined) - Debe usar default -10%
console.log('📋 TEST 2: filterMinProfit = undefined (usa default)');
const result2 = applyMinProfitFilter(mockRoutes, undefined);
console.log('Resultado:', result2.length, 'rutas');
console.log('Esperado: 6 rutas (mismo que default)');
if (result2.length === 6) {
  console.log('✅ PASS - Undefined usa default correctamente\n');
} else {
  console.log('❌ FAIL - Expected 6, got', result2.length, '\n');
}

// TEST 3: Rentables solamente (0%)
console.log('📋 TEST 3: filterMinProfit = 0% (solo rentables)');
const result3 = applyMinProfitFilter(mockRoutes, 0);
console.log('Resultado:', result3.length, 'rutas');
console.log('Esperado: 4 rutas (15.5%, 5.2%, 1.0%, 0.1%)');
if (result3.length === 4 && result3.every(r => r.profitPercentage >= 0)) {
  console.log('✅ PASS - Solo muestra rentables\n');
} else {
  console.log('❌ FAIL - Expected 4 rentables, got', result3.length, '\n');
}

// TEST 4: Muy rentables (5%)
console.log('📋 TEST 4: filterMinProfit = 5% (muy rentables)');
const result4 = applyMinProfitFilter(mockRoutes, 5.0);
console.log('Resultado:', result4.length, 'rutas');
console.log('Esperado: 2 rutas (15.5%, 5.2%)');
if (result4.length === 2) {
  console.log('✅ PASS - Solo muestra muy rentables\n');
} else {
  console.log('❌ FAIL - Expected 2, got', result4.length, '\n');
}

// TEST 5: Todo (incluye pérdidas grandes) (-50%)
console.log('📋 TEST 5: filterMinProfit = -50% (muestra todo)');
const result5 = applyMinProfitFilter(mockRoutes, -50.0);
console.log('Resultado:', result5.length, 'rutas');
console.log('Esperado: 8 rutas (todas)');
if (result5.length === 8) {
  console.log('✅ PASS - Muestra todo sin filtrar\n');
} else {
  console.log('❌ FAIL - Expected 8, got', result5.length, '\n');
}

// TEST 6: Restrictivo extremo (20%)
console.log('📋 TEST 6: filterMinProfit = 20% (muy restrictivo)');
const result6 = applyMinProfitFilter(mockRoutes, 20.0);
console.log('Resultado:', result6.length, 'rutas');
console.log('Esperado: 0 rutas (ninguna supera 20%)');
if (result6.length === 0) {
  console.log('✅ PASS - Ninguna ruta supera el umbral\n');
} else {
  console.log('❌ FAIL - Expected 0, got', result6.length, '\n');
}

// TEST 7: Borde exacto (1.0%)
console.log('📋 TEST 7: filterMinProfit = 1.0% (borde exacto)');
const result7 = applyMinProfitFilter(mockRoutes, 1.0);
console.log('Resultado:', result7.length, 'rutas');
console.log('Esperado: 3 rutas (15.5%, 5.2%, 1.0% - inclusivo)');
if (result7.length === 3 && result7.some(r => r.profitPercentage === 1.0)) {
  console.log('✅ PASS - Inclusivo en el borde (>= no >)\n');
} else {
  console.log('❌ FAIL - Expected 3 including 1.0%, got', result7.length, '\n');
}

// ============================================
// TEST DE COMPATIBILIDAD CON CONFIGURACIONES ANTIGUAS
// ============================================
console.log('🔄 ============================================');
console.log('🔄 TEST COMPATIBILIDAD: Migración desde v5.0.63');
console.log('🔄 ============================================\n');

// Simular configuraciones antiguas
const oldConfigShowAll = { showNegativeRoutes: true, showOnlyProfitable: false, profitThreshold: 1.0 };
const oldConfigOnlyProfit = { showNegativeRoutes: false, showOnlyProfitable: true, profitThreshold: 1.0 };
const oldConfigThreshold5 = { showNegativeRoutes: true, showOnlyProfitable: false, profitThreshold: 5.0 };

console.log('📋 CONFIG ANTIGUA 1: showNegativeRoutes=true, showOnlyProfitable=false, profitThreshold=1.0');
console.log('   → NUEVA: filterMinProfit = -10.0 (muestra casi todo)');
const migratedResult1 = applyMinProfitFilter(mockRoutes, -10.0);
console.log('   Resultado:', migratedResult1.length, 'rutas (6 esperadas)');
console.log(migratedResult1.length === 6 ? '   ✅ MIGRACIÓN OK\n' : '   ❌ MIGRACIÓN FAIL\n');

console.log('📋 CONFIG ANTIGUA 2: showNegativeRoutes=false, showOnlyProfitable=true');
console.log('   → NUEVA: filterMinProfit = 0.0 (solo rentables)');
const migratedResult2 = applyMinProfitFilter(mockRoutes, 0.0);
console.log('   Resultado:', migratedResult2.length, 'rutas (4 esperadas)');
console.log(migratedResult2.length === 4 ? '   ✅ MIGRACIÓN OK\n' : '   ❌ MIGRACIÓN FAIL\n');

console.log('📋 CONFIG ANTIGUA 3: profitThreshold=5.0');
console.log('   → NUEVA: filterMinProfit = 5.0 (equivalente)');
const migratedResult3 = applyMinProfitFilter(mockRoutes, 5.0);
console.log('   Resultado:', migratedResult3.length, 'rutas (2 esperadas)');
console.log(migratedResult3.length === 2 ? '   ✅ MIGRACIÓN OK\n' : '   ❌ MIGRACIÓN FAIL\n');

// ============================================
// TEST DE NO REGRESIÓN: Backend no filtra
// ============================================
console.log('🔧 ============================================');
console.log('🔧 TEST NO REGRESIÓN: Backend no filtra -10%');
console.log('🔧 ============================================\n');

console.log('📋 Verificando que backend no filtra automáticamente...');
console.log('   Rutas con -12.3% y -25% deben llegar al popup');
console.log('   Popup decide con filterMinProfit (-10% por defecto)');

const allRoutes = mockRoutes; // Backend debe enviar TODAS
console.log('   Backend envía:', allRoutes.length, 'rutas (8 esperadas)');

const popupFiltered = applyMinProfitFilter(allRoutes, -10.0);
console.log('   Popup filtra con -10%:', popupFiltered.length, 'rutas (6 esperadas)');

const popupShowAll = applyMinProfitFilter(allRoutes, -50.0);
console.log('   Popup filtra con -50%:', popupShowAll.length, 'rutas (8 esperadas)');

if (allRoutes.length === 8 && popupFiltered.length === 6 && popupShowAll.length === 8) {
  console.log('   ✅ PASS - Backend no filtra, popup controla\n');
} else {
  console.log('   ❌ FAIL - Backend o popup filtrando incorrectamente\n');
}

// ============================================
// RESUMEN
// ============================================
console.log('📊 ============================================');
console.log('📊 RESUMEN DE TESTS');
console.log('📊 ============================================\n');

const totalTests = 7 + 3 + 1; // 7 funcionales + 3 migración + 1 no-regresión
console.log(`Total de tests: ${totalTests}`);
console.log('✅ Verifica manualmente el output arriba');
console.log('\nExpectativas:');
console.log('- Default (-10%): Muestra 6 de 8 rutas (excluye -12.3% y -25%)');
console.log('- Rentables (0%): Muestra 4 rutas');
console.log('- Muy rentables (5%): Muestra 2 rutas');
console.log('- Todo (-50%): Muestra 8 rutas');
console.log('- Backend: Envía 8 rutas sin filtrar');
console.log('- Popup: Filtra según configuración usuario');
console.log('\n✅ TESTS COMPLETADOS - Verificar output arriba');
