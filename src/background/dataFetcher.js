// ============================================
// DATA FETCHER MODULE - ArbitrageAR Background
// ============================================

console.log('🔧 [DATAFETCHER] dataFetcher.js se está cargando en:', new Date().toISOString());

import { REQUEST_INTERVAL, log } from './config.js';

console.log('✅ [DATAFETCHER] Imports completados exitosamente');

// Estado local para rate limiting (específico de este módulo)
let lastRequestTime = 0;

// Función de rate limiting para requests HTTP
async function fetchWithRateLimit(url) {
  const now = Date.now();
  const delay = REQUEST_INTERVAL - (now - lastRequestTime);
  if (delay > 0) {
    log(`⏳ Rate limiting: esperando ${delay}ms para ${url}`);
    await new Promise(r => setTimeout(r, delay));
  }
  lastRequestTime = Date.now();

  try {
    log(`🌐 Iniciando fetch para: ${url}`);
    // Añadir timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    log(`📡 Respuesta HTTP para ${url}: ${res.status} ${res.statusText}`);

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    log(`✅ Datos parseados exitosamente para ${url}:`, data ? 'objeto recibido' : 'null');
    return data;
  } catch(e) {
    if (e.name === 'AbortError') {
      log('⏱️ Fetch timeout:', url);
    } else {
      log('❌ Fetch error:', url, e);
    }
    return null;
  }
}

// TEST: Función para verificar conectividad básica
async function testBasicConnectivity() {
  log('🧪 [TEST] Verificando conectividad básica...');

  try {
    // Test 1: URL simple de prueba
    log('🌐 [TEST] Probando fetch a httpbin.org...');
    const testRes = await fetch('https://httpbin.org/get', { method: 'GET' });
    log(`📡 [TEST] httpbin.org response: ${testRes.status}`);

    // Test 2: Verificar que podemos hacer JSON parsing
    if (testRes.ok) {
      const testData = await testRes.json();
      log('✅ [TEST] JSON parsing funciona');
    }

    // Test 3: Intentar la URL problemática
    log('🌐 [TEST] Probando fetch directo a criptoya.com...');
    const criptoyaRes = await fetch('https://criptoya.com/api/usdt/usd/1');
    log(`📡 [TEST] criptoya.com response: ${criptoyaRes.status}`);

    if (criptoyaRes.ok) {
      const criptoyaData = await criptoyaRes.json();
      log('✅ [TEST] CriptoYA API funciona:', criptoyaData ? 'datos recibidos' : 'null');
      return criptoyaData;
    } else {
      log('❌ [TEST] CriptoYA API falló con status:', criptoyaRes.status);
      return null;
    }

  } catch (error) {
    log('❌ [TEST] Error en conectividad básica:', error);
    return null;
  }
}

// Fetch precio dólar oficial
async function fetchDolaritoOficial() {
  log('📊 Fetching dólar oficial...');
  const data = await fetchWithRateLimit('https://dolarapi.com/v1/dolares/oficial');

  // Validar estructura de respuesta
  if (data && typeof data.compra === 'number' && typeof data.venta === 'number') {
    log('✅ Dólar oficial obtenido:', data.venta);
    return data;
  }

  log('❌ Estructura de datos inválida de Dolarito:', data);
  return null;
}

// Fetch precios USDT de CriptoYA
async function fetchCriptoyaUSDT() {
  log('📊 Fetching USDT prices...');
  const data = await fetchWithRateLimit('https://criptoya.com/api/usdt/ars/1');

  // Validar que la respuesta sea un objeto válido
  if (data && typeof data === 'object') {
    log('✅ USDT prices obtenidos, exchanges:', Object.keys(data).length);
    return data;
  }

  log('❌ Estructura de datos inválida de CriptoYA:', data);
  return null;
}

// Fetch ratio USD/USDT
async function fetchCriptoyaUSDTtoUSD() {
  log('📊 Fetching USD/USDT rates...');
  const url = 'https://criptoya.com/api/usdt/usd/1';
  log('📡 [USDT/USD] Iniciando fetch:', url);

  const data = await fetchWithRateLimit(url);
  log('📡 [USDT/USD] Respuesta de fetchWithRateLimit:', data ? 'datos recibidos' : 'null/undefined');

  if (data && typeof data === 'object') {
    const exchangeCount = Object.keys(data).length;
    log(`✅ [USDT/USD] USD/USDT rates obtenidos: ${exchangeCount} exchanges`);

    // Log de ejemplo de estructura para verificar
    const sampleExchange = Object.keys(data)[0];
    if (sampleExchange && data[sampleExchange]) {
      log(`✅ [USDT/USD] Ejemplo ${sampleExchange}:`, {
        ask: data[sampleExchange].ask,
        totalAsk: data[sampleExchange].totalAsk,
        bid: data[sampleExchange].bid,
        totalBid: data[sampleExchange].totalBid
      });
    }
    return data;
  }

  log('❌ [USDT/USD] Error obteniendo USD/USDT rates - retornando null');
  return null;
}

export {
  fetchWithRateLimit,
  fetchDolaritoOficial,
  fetchCriptoyaUSDT,
  fetchCriptoyaUSDTtoUSD,
  fetchCriptoyaUSDTtoUSD_NoRateLimit,
  testBasicConnectivity
};