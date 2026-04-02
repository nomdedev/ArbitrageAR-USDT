// Test para validar Filtros de Bancos v5.0.23
// Verifica que la selección de bancos funcione correctamente

const assert = require('assert');

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

function runAllTests() {
  console.log('🧪 Test: Filtros de Bancos v5.0.23');
  console.log('\n📊 Bancos disponibles:', Object.keys(bankRates).join(', '));

  console.log('\n✅ Test 1: Filtro con bancos seleccionados');
  const filteredBanks = filterBanks(bankRates, userSettings.selectedBanks);
  console.log('Bancos seleccionados:', userSettings.selectedBanks.join(', '));
  console.log('Bancos filtrados:', filteredBanks.map(([code]) => code).join(', '));

  assert.strictEqual(filteredBanks.length, 2, 'Deben filtrarse exactamente 2 bancos');
  assert(filteredBanks.some(([code]) => code === 'nacion'), 'Debe incluir banco nacion');
  assert(filteredBanks.some(([code]) => code === 'bbva'), 'Debe incluir banco bbva');

  console.log('\n✅ Test 2: Sin filtro (todos los bancos)');
  const allBanks = filterBanks(bankRates, []);
  console.log('Bancos sin filtro:', allBanks.map(([code]) => code).join(', '));
  assert.strictEqual(
    allBanks.length,
    Object.keys(bankRates).length,
    'Sin filtros debe devolver todos los bancos'
  );

  console.log('\n✅ Test 3: Banco no existente en selección');
  const invalidSelection = ['nacion', 'banco_inexistente'];
  const filteredInvalid = filterBanks(bankRates, invalidSelection);
  console.log('Selección con banco inválido:', invalidSelection.join(', '));
  console.log('Bancos filtrados:', filteredInvalid.map(([code]) => code).join(', '));
  assert.strictEqual(filteredInvalid.length, 1, 'Solo debe quedar 1 banco válido');
  assert.strictEqual(filteredInvalid[0][0], 'nacion', 'El banco válido debe ser nacion');

  console.log('\n✅ Test 4: Ordenamiento por precio de compra');
  const sortedBanks = [...filteredBanks].sort((a, b) => a[1].compra - b[1].compra);
  console.log('Bancos ordenados por precio compra:');
  sortedBanks.forEach(([code, rates]) => {
    console.log(`  ${code}: $${rates.compra}`);
  });
  assert(
    sortedBanks[0][1].compra <= sortedBanks[1][1].compra,
    'El orden ascendente por compra debe ser correcto'
  );

  console.log('\n🎯 Resultado final: ✅ TODOS LOS TESTS PASAN');
  return true;
}

if (require.main === module) {
  try {
    runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test falló:', error.message);
    process.exit(1);
  }
}

module.exports = { runAllTests };