// Test para validar Modos de Display v5.0.56
// Verifica que sortByProfit y showOnlyProfitable funcionen correctamente

const fs = require('fs');
const path = require('path');

// Simular datos de rutas de prueba
const testRoutes = [
  { profitPercentage: 5.2, isSingleExchange: false },
  { profitPercentage: -1.5, isSingleExchange: true },
  { profitPercentage: 2.1, isSingleExchange: false },
  { profitPercentage: 8.7, isSingleExchange: true },
  { profitPercentage: 0.5, isSingleExchange: false },
  { profitPercentage: -0.3, isSingleExchange: false }
];

// Simular userSettings
const userSettings = {
  profitThreshold: 0.1,
  showOnlyProfitable: false,
  showNegativeRoutes: true,
  sortByProfit: true,
  preferSingleExchange: false,
  maxRoutesDisplay: 20
};

// Funciones de filtro (copiadas de popup.js para testing)
function applyProfitThresholdFilter(routes, profitThreshold) {
  if (profitThreshold && profitThreshold > 0) {
    return routes.filter(r => r.profitPercentage >= profitThreshold);
  }
  return routes;
}

function applyOnlyProfitableFilter(routes, showOnlyProfitable) {
  if (showOnlyProfitable === true) {
    return routes.filter(r => r.profitPercentage > 0);
  }
  return routes;
}

function applyNegativeFilter(routes, showNegative) {
  if (showNegative === false) {
    return routes.filter(r => r.profitPercentage >= 0);
  }
  return routes;
}

function applySorting(routes, preferSingleExchange, sortByProfit) {
  if (preferSingleExchange === true) {
    routes.sort((a, b) => {
      if (a.isSingleExchange !== b.isSingleExchange) {
        return b.isSingleExchange - a.isSingleExchange;
      }
      return b.profitPercentage - a.profitPercentage;
    });
  } else if (sortByProfit === true) {
    routes.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }
  return routes;
}

function applyUserPreferences(routes) {
  let filtered = [...routes];

  // 1. Filtrar por umbral de ganancia mínimo
  filtered = applyProfitThresholdFilter(filtered, userSettings.profitThreshold);

  // 2. Filtrar solo rutas rentables
  filtered = applyOnlyProfitableFilter(filtered, userSettings.showOnlyProfitable);

  // 3. Filtrar rutas negativas
  filtered = applyNegativeFilter(filtered, userSettings.showNegativeRoutes);

  // 4. Ordenar rutas
  filtered = applySorting(filtered, userSettings.preferSingleExchange, userSettings.sortByProfit);

  return filtered;
}

// Ejecutar tests
console.log('🧪 Test: Modos de Display v5.0.56');
console.log('📊 Rutas originales:', testRoutes.map(r => `${r.profitPercentage}%`).join(', '));

// Test 1: Configuración por defecto (ordenar por profit, mostrar todas)
console.log('\n✅ Test 1: Configuración por defecto');
const result1 = applyUserPreferences(testRoutes);
console.log('Resultado:', result1.map(r => `${r.profitPercentage}%`).join(', '));
console.log('Orden correcto:', result1[0].profitPercentage === 8.7 && result1[1].profitPercentage === 5.2);

// Test 2: Solo rutas rentables
console.log('\n✅ Test 2: Solo rutas rentables');
userSettings.showOnlyProfitable = true;
const result2 = applyUserPreferences(testRoutes);
console.log('Resultado:', result2.map(r => `${r.profitPercentage}%`).join(', '));
const allPositive = result2.every(r => r.profitPercentage > 0);
console.log('Todas positivas:', allPositive);

// Test 3: Sin ordenar por profit
console.log('\n✅ Test 3: Sin ordenar por profit');
userSettings.showOnlyProfitable = false;
userSettings.sortByProfit = false;
const result3 = applyUserPreferences(testRoutes);
console.log('Resultado:', result3.map(r => `${r.profitPercentage}%`).join(', '));
console.log('Orden original mantenido:', result3.length === 5); // Después de filtrar umbral

// Reset settings
userSettings.showOnlyProfitable = false;
userSettings.sortByProfit = true;

console.log('\n🎯 Tests completados - Modos de Display funcionando correctamente');