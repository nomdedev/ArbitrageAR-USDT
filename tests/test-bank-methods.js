// ============================================
// TEST PARA MÉTODOS ESTADÍSTICOS DE BANCOS
// ============================================

const assert = require('assert');

// Simular datos de bancos como los que vendría de CriptoYa
const mockBankData = {
  "bna": {"ask": 1415, "bid": 1365, "time": 1760634607},
  "galicia": {"ask": 1410, "bid": 1360, "time": 1760637600},
  "bbva": {"ask": 1415, "bid": 1360, "time": 1760634516},
  "macro": {"ask": 1415, "bid": 1345, "time": 1760637600},
  "patagonia": {"ask": 1420, "bid": 1370, "time": 1760634602},
  "santander": {"ask": 1420, "bid": 1370, "time": 1760637600},
  "supervielle": {"ask": 1412, "bid": 1372, "time": 1760634587},
  "icbc": {"ask": 1415, "bid": 1355, "time": 1760634606}
};

// Funciones de cálculo (copiadas del background script)
function calculateBankConsensus(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
    .map(bank => bank.ask)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0
    ? (prices[mid - 1] + prices[mid]) / 2
    : prices[mid];

  return {
    price: Math.round(median * 100) / 100,
    method: 'consenso',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

function calculateBankAverage(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
    .map(bank => bank.ask);

  if (prices.length === 0) return null;

  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return {
    price: Math.round(average * 100) / 100,
    method: 'promedio',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

function calculateBestBuy(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.bid === 'number' && bank.bid > 0)
    .map(bank => bank.bid);

  if (prices.length === 0) return null;

  const bestBuy = Math.min(...prices);

  return {
    price: bestBuy,
    method: 'mejor-compra',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

function calculateBestSell(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
    .map(bank => bank.ask);

  if (prices.length === 0) return null;

  const bestSell = Math.min(...prices);

  return {
    price: bestSell,
    method: 'mejor-venta',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

// Tests
console.log('🧪 Iniciando tests de métodos estadísticos de bancos...\n');

// Test 1: Consenso (mediana)
const consensus = calculateBankConsensus(mockBankData);
console.log('📊 Test 1 - Consenso (mediana):');
console.log('   Precios ordenados:', Object.values(mockBankData).map(b => b.ask).sort((a,b) => a-b));
console.log('   Resultado:', consensus);
assert(consensus.price === 1415, `Consenso debería ser 1415, fue ${consensus.price}`);
assert(consensus.method === 'consenso', 'Método debería ser consenso');
assert(consensus.banksCount === 8, 'Debería haber 8 bancos');
console.log('   ✅ PASSED\n');

// Test 2: Promedio
const average = calculateBankAverage(mockBankData);
console.log('📊 Test 2 - Promedio:');
console.log('   Precios:', Object.values(mockBankData).map(b => b.ask));
const expectedAvg = Object.values(mockBankData).map(b => b.ask).reduce((a,b) => a+b, 0) / 8;
console.log('   Resultado:', average);
assert(Math.abs(average.price - expectedAvg) < 0.01, `Promedio debería ser ~${expectedAvg}, fue ${average.price}`);
assert(average.method === 'promedio', 'Método debería ser promedio');
console.log('   ✅ PASSED\n');

// Test 3: Mejor compra
const bestBuy = calculateBestBuy(mockBankData);
console.log('📊 Test 3 - Mejor compra:');
console.log('   Precios de compra:', Object.values(mockBankData).map(b => b.bid));
console.log('   Resultado:', bestBuy);
assert(bestBuy.price === 1345, `Mejor compra debería ser 1345, fue ${bestBuy.price}`);
assert(bestBuy.method === 'mejor-compra', 'Método debería ser mejor-compra');
console.log('   ✅ PASSED\n');

// Test 4: Mejor venta
const bestSell = calculateBestSell(mockBankData);
console.log('📊 Test 4 - Mejor venta:');
console.log('   Precios de venta:', Object.values(mockBankData).map(b => b.ask));
console.log('   Resultado:', bestSell);
assert(bestSell.price === 1410, `Mejor venta debería ser 1410, fue ${bestSell.price}`);
assert(bestSell.method === 'mejor-venta', 'Método debería ser mejor-venta');
console.log('   ✅ PASSED\n');

console.log('🎉 Todos los tests de métodos estadísticos pasaron correctamente!');
console.log('\n📋 Resumen de resultados:');
console.log(`   • Consenso: $${consensus.price} (mediana de ${consensus.banksCount} bancos)`);
console.log(`   • Promedio: $${average.price} (promedio de ${average.banksCount} bancos)`);
console.log(`   • Mejor compra: $${bestBuy.price} (mínimo de ${bestBuy.banksCount} bancos)`);
console.log(`   • Mejor venta: $${bestSell.price} (mínimo de ${bestSell.banksCount} bancos)`);

// Export para run-all-tests.js
function runAllTests() {
  return true; // Si llegamos aquí, todos los tests pasaron
}

module.exports = { runAllTests };