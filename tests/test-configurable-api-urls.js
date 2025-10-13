// ============================================
// TEST: URLs de APIs Configurables v5.0.53
// ============================================

const fs = require('fs');

// Simular configuración con URLs personalizadas
const mockSettings = {
  dolarApiUrl: 'https://dolarapi.com/v1/dolares/oficial',
  criptoyaUsdtArsUrl: 'https://criptoya.com/api/usdt/ars/1',
  criptoyaUsdtUsdUrl: 'https://criptoya.com/api/usdt/usd/1'
};

// Función de fetch simplificada (simula la respuesta)
function mockFetch(url) {
  console.log(`🌐 Fetching: ${url}`);

  if (url.includes('dolarapi.com')) {
    return Promise.resolve({
      compra: 950,
      venta: 960,
      source: 'dolarapi_oficial',
      timestamp: Date.now()
    });
  } else if (url.includes('criptoya.com/api/usdt/ars')) {
    return Promise.resolve({
      'Lemon Cash': { totalAsk: 950, totalBid: 940 },
      'Ripio': { totalAsk: 952, totalBid: 942 }
    });
  } else if (url.includes('criptoya.com/api/usdt/usd')) {
    return Promise.resolve({
      'Lemon Cash': { totalAsk: 1.02 },
      'Ripio': { totalAsk: 1.01 }
    });
  }

  return Promise.resolve(null);
}

// Funciones de fetch actualizadas (simuladas)
async function fetchDolarOficial(userSettings) {
  const url = userSettings.dolarApiUrl || 'https://dolarapi.com/v1/dolares/oficial';
  return await mockFetch(url);
}

async function fetchUSDT(userSettings) {
  const url = userSettings.criptoyaUsdtArsUrl || 'https://criptoya.com/api/usdt/ars/1';
  return await mockFetch(url);
}

async function fetchUSDTtoUSD(userSettings) {
  const url = userSettings.criptoyaUsdtUsdUrl || 'https://criptoya.com/api/usdt/usd/1';
  return await mockFetch(url);
}

// Ejecutar test
console.log('🧪 TEST: URLs de APIs Configurables v5.0.53');
console.log('=' .repeat(50));

async function runTest() {
  try {
    console.log('🔧 Probando con configuración por defecto...');
    const oficial = await fetchDolarOficial(mockSettings);
    const usdt = await fetchUSDT(mockSettings);
    const usdtUsd = await fetchUSDTtoUSD(mockSettings);

    console.log('✅ Resultados:');
    console.log(`   Dólar oficial: ${oficial ? 'OK' : 'FAIL'} (${oficial?.compra || 'N/A'})`);
    console.log(`   USDT/ARS: ${usdt ? 'OK' : 'FAIL'} (${Object.keys(usdt || {}).length} exchanges)`);
    console.log(`   USDT/USD: ${usdtUsd ? 'OK' : 'FAIL'} (${Object.keys(usdtUsd || {}).length} exchanges)`);

    // Test con URLs personalizadas
    console.log('\n🔧 Probando con URLs personalizadas...');
    const customSettings = {
      dolarApiUrl: 'https://custom-dolar-api.com/v1/oficial',
      criptoyaUsdtArsUrl: 'https://custom-criptoya.com/usdt-ars',
      criptoyaUsdtUsdUrl: 'https://custom-criptoya.com/usdt-usd'
    };

    const oficial2 = await fetchDolarOficial(customSettings);
    const usdt2 = await fetchUSDT(customSettings);
    const usdtUsd2 = await fetchUSDTtoUSD(customSettings);

    console.log('✅ Resultados con URLs personalizadas:');
    console.log(`   Dólar oficial: ${oficial2 ? 'OK' : 'FAIL'}`);
    console.log(`   USDT/ARS: ${usdt2 ? 'OK' : 'FAIL'}`);
    console.log(`   USDT/USD: ${usdtUsd2 ? 'OK' : 'FAIL'}`);

    // Validaciones
    const allDefaultOk = oficial && usdt && usdtUsd;
    const allCustomOk = oficial2 && usdt2 && usdtUsd2;

    console.log('\n🎯 VALIDACIONES:');
    console.log(`URLs por defecto funcionan: ${allDefaultOk ? 'PASS' : 'FAIL'}`);
    console.log(`URLs personalizadas funcionan: ${allCustomOk ? 'PASS' : 'FAIL'}`);
    console.log(`Configuración es flexible: ${allDefaultOk && allCustomOk ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

runTest().then(() => {
  console.log('\n🎯 TEST COMPLETADO');
});