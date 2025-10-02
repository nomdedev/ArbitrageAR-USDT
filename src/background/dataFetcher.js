// ============================================
// DATA FETCHER MODULE - ArbitrageAR Background
// ============================================

import { REQUEST_INTERVAL, log } from './config.js';

// Estado local para rate limiting
let lastRequestTime = 0;

// Función de rate limiting para requests HTTP
async function fetchWithRateLimit(url) {
  const now = Date.now();
  const delay = REQUEST_INTERVAL - (now - lastRequestTime);
  if (delay > 0) {
    await new Promise(r => setTimeout(r, delay));
  }
  lastRequestTime = Date.now();

  try {
    // Añadir timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
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
  const data = await fetchWithRateLimit('https://criptoya.com/api/usdt/usd/1');

  if (data && typeof data === 'object') {
    log('✅ USD/USDT rates obtenidos');
    return data;
  }

  log('❌ Error obteniendo USD/USDT rates');
  return null;
}

export {
  fetchWithRateLimit,
  fetchDolaritoOficial,
  fetchCriptoyaUSDT,
  fetchCriptoyaUSDTtoUSD
};