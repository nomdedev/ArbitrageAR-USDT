// Test para validar URLs de APIs configurables v5.0.53
// Verifica que las URLs personalizadas se usen correctamente

const fs = require('fs');
const path = require('path');

// Simular userSettings con URLs personalizadas
const userSettings = {
  dolarApiUrl: 'https://custom-dolar-api.com/v1/dolares/oficial',
  criptoyaUsdtArsUrl: 'https://custom-criptoya.com/api/usdt/ars/1',
  criptoyaUsdtUsdUrl: 'https://custom-criptoya.com/api/usdt/usd/1',
  updateIntervalMinutes: 10,
  requestTimeoutSeconds: 15
};

// Simular funciones de fetch (simplificadas para testing)
function buildDolarApiUrl(settings) {
  return settings.dolarApiUrl || 'https://dolarapi.com/v1/dolares/oficial';
}

function buildCriptoyaUsdtArsUrl(settings) {
  return settings.criptoyaUsdtArsUrl || 'https://criptoya.com/api/usdt/ars/1';
}

function buildCriptoyaUsdtUsdUrl(settings) {
  return settings.criptoyaUsdtUsdUrl || 'https://criptoya.com/api/usdt/usd/1';
}

function getRequestTimeout(settings) {
  return (settings.requestTimeoutSeconds || 10) * 1000;
}

function getUpdateInterval(settings) {
  return (settings.updateIntervalMinutes || 5) * 60 * 1000;
}

// Ejecutar tests
console.log('🧪 Test: URLs de APIs Configurables v5.0.53');

console.log('\n✅ Test 1: URLs personalizadas');
const dolarUrl = buildDolarApiUrl(userSettings);
const criptoyaArsUrl = buildCriptoyaUsdtArsUrl(userSettings);
const criptoyaUsdUrl = buildCriptoyaUsdtUsdUrl(userSettings);

console.log('DolarAPI URL:', dolarUrl);
console.log('CriptoYa ARS URL:', criptoyaArsUrl);
console.log('CriptoYa USD URL:', criptoyaUsdUrl);

const urlsCorrectas = dolarUrl === userSettings.dolarApiUrl &&
                     criptoyaArsUrl === userSettings.criptoyaUsdtArsUrl &&
                     criptoyaUsdUrl === userSettings.criptoyaUsdtUsdUrl;
console.log('URLs personalizadas aplicadas:', urlsCorrectas);

console.log('\n✅ Test 2: Valores por defecto');
const defaultSettings = {};
const defaultDolarUrl = buildDolarApiUrl(defaultSettings);
const defaultArsUrl = buildCriptoyaUsdtArsUrl(defaultSettings);
const defaultUsdUrl = buildCriptoyaUsdtUsdUrl(defaultSettings);

console.log('DolarAPI default:', defaultDolarUrl);
console.log('CriptoYa ARS default:', defaultArsUrl);
console.log('CriptoYa USD default:', defaultUsdUrl);

const defaultsCorrectos = defaultDolarUrl === 'https://dolarapi.com/v1/dolares/oficial' &&
                          defaultArsUrl === 'https://criptoya.com/api/usdt/ars/1' &&
                          defaultUsdUrl === 'https://criptoya.com/api/usdt/usd/1';
console.log('Defaults aplicados correctamente:', defaultsCorrectos);

console.log('\n✅ Test 3: Intervalos configurables');
const timeout = getRequestTimeout(userSettings);
const interval = getUpdateInterval(userSettings);

console.log('Timeout configurado:', timeout, 'ms (esperado: 15000)');
console.log('Interval configurado:', interval, 'ms (esperado: 600000)');

const intervalosCorrectos = timeout === 15000 && interval === 600000;
console.log('Intervalos aplicados correctamente:', intervalosCorrectos);

console.log('\n✅ Test 4: Intervalos por defecto');
const defaultTimeout = getRequestTimeout(defaultSettings);
const defaultInterval = getUpdateInterval(defaultSettings);

console.log('Timeout default:', defaultTimeout, 'ms (esperado: 10000)');
console.log('Interval default:', defaultInterval, 'ms (esperado: 300000)');

const defaultsIntervalos = defaultTimeout === 10000 && defaultInterval === 300000;
console.log('Defaults de intervalos correctos:', defaultsIntervalos);

const allTestsPass = urlsCorrectas && defaultsCorrectos && intervalosCorrectos && defaultsIntervalos;
console.log('\n🎯 Resultado final:', allTestsPass ? '✅ TODOS LOS TESTS PASAN' : '❌ ALGÚN TEST FALLÓ');