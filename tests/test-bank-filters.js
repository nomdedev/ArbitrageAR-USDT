// Test para validar Filtros de Bancos v5.0.23
// Verifica que la selección de bancos funcione correctamente

const fs = require('fs');
const path = require('path');

// Simular datos de bancos
const bankRates = {
  'nacion': { compra: 950, venta: 970 },
  'galicia': { compra: 955, venta: 975 },
  'santander': { compra: 960, venta: 980 },
  'bbva': { compra: 945, venta: 965 },
  'icbc': { compra: 952, venta: 972 }
};

// Simular userSettings
const userSettings = {
  selectedBanks: ['nacion', 'bbva'], // Solo estos dos bancos
  showBestBankPrice: false
};

// Función para filtrar bancos (copiada de popup.js)
function filterBanks(bankRates, selectedBanks) {
  let banks = Object.entries(bankRates);

  // Filtrar bancos seleccionados si hay selección específica
  if (selectedBanks.length > 0) {
    banks = banks.filter(([bankCode]) => selectedBanks.includes(bankCode));
  }

  return banks;
}

// Ejecutar tests
console.log('🧪 Test: Filtros de Bancos v5.0.23');

console.log('\n📊 Bancos disponibles:', Object.keys(bankRates).join(', '));

console.log('\n✅ Test 1: Filtro con bancos seleccionados');
const filteredBanks = filterBanks(bankRates, userSettings.selectedBanks);
console.log('Bancos seleccionados:', userSettings.selectedBanks.join(', '));
console.log('Bancos filtrados:', filteredBanks.map(([code]) => code).join(', '));

const filtroCorrecto = filteredBanks.length === 2 &&
                       filteredBanks.some(([code]) => code === 'nacion') &&
                       filteredBanks.some(([code]) => code === 'bbva');
console.log('Filtro aplicado correctamente:', filtroCorrecto);

console.log('\n✅ Test 2: Sin filtro (todos los bancos)');
const allBanks = filterBanks(bankRates, []);
console.log('Bancos sin filtro:', allBanks.map(([code]) => code).join(', '));
console.log('Todos los bancos incluidos:', allBanks.length === Object.keys(bankRates).length);

console.log('\n✅ Test 3: Banco no existente en selección');
const invalidSelection = ['nacion', 'banco_inexistente'];
const filteredInvalid = filterBanks(bankRates, invalidSelection);
console.log('Selección con banco inválido:', invalidSelection.join(', '));
console.log('Bancos filtrados:', filteredInvalid.map(([code]) => code).join(', '));
console.log('Solo banco válido incluido:', filteredInvalid.length === 1 && filteredInvalid[0][0] === 'nacion');

console.log('\n✅ Test 4: Ordenamiento por precio de compra');
const sortedBanks = [...filteredBanks].sort((a, b) => a[1].compra - b[1].compra);
console.log('Bancos ordenados por precio compra:');
sortedBanks.forEach(([code, rates]) => {
  console.log(`  ${code}: $${rates.compra}`);
});
const ordenCorrecto = sortedBanks[0][1].compra <= sortedBanks[1][1].compra;
console.log('Orden correcto (ascendente):', ordenCorrecto);

const allTestsPass = filtroCorrecto && allBanks.length === 5 && filteredInvalid.length === 1 && ordenCorrecto;
console.log('\n🎯 Resultado final:', allTestsPass ? '✅ TODOS LOS TESTS PASAN' : '❌ ALGÚN TEST FALLÓ');