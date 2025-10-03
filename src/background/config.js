// ============================================
// CONFIG MODULE - ArbitrageAR Background
// ============================================

// Sistema de logging unificado
const DEBUG_MODE = false; // ⚠️ Temporalmente true para debug

function log(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// Configuración de rate limiting
const REQUEST_INTERVAL = 600; // ms (110 req/min max)
let lastRequestTime = 0;

// Configuración de cache y actualización automática
const CACHE_CONFIG = {
  // Tiempo máximo que los datos cacheados se consideran válidos (en minutos)
  maxCacheAge: 5, // 5 minutos
  
  // Mostrar datos cacheados inmediatamente mientras se actualiza
  showCacheWhileUpdating: true,
  
  // Forzar actualización al abrir popup (false = usar cache si está disponible)
  forceRefreshOnPopupOpen: false, // ⚠️ Temporalmente true para debug
  
  // Intervalo de actualización automática en background (en minutos)
  autoUpdateInterval: 2
};

// Comisiones típicas por exchange (en porcentaje)
// IMPORTANTE: Los fees de trading (compra/venta) generalmente YA ESTÁN INCLUIDOS en el spread (bid/ask)
// Solo se agregan fees explícitos si el exchange los cobra ADEMÁS del spread
const EXCHANGE_FEES = {
  'binance': { trading: 0, withdrawal: 0, requiresP2P: false },
  'buenbit': { trading: 0, withdrawal: 0, requiresP2P: false },
  'ripio': { trading: 0, withdrawal: 0, requiresP2P: false },
  'ripioexchange': { trading: 0, withdrawal: 0, requiresP2P: false },
  'letsbit': { trading: 0, withdrawal: 0, requiresP2P: false },
  'satoshitango': { trading: 0, withdrawal: 0, requiresP2P: false },
  'belo': { trading: 0, withdrawal: 0, requiresP2P: false },
  'tiendacrypto': { trading: 0, withdrawal: 0, requiresP2P: false },
  'cryptomkt': { trading: 0, withdrawal: 0, requiresP2P: false },
  'cryptomktpro': { trading: 0, withdrawal: 0, requiresP2P: false },
  'bitso': { trading: 0, withdrawal: 0, requiresP2P: false },
  'bitsoalpha': { trading: 0, withdrawal: 0, requiresP2P: false },
  'lemoncash': { trading: 0, withdrawal: 0, requiresP2P: false },
  'universalcoins': { trading: 0, withdrawal: 0, requiresP2P: false },
  'decrypto': { trading: 0, withdrawal: 0, requiresP2P: false },
  'fiwind': { trading: 0, withdrawal: 0, requiresP2P: false },
  'vitawallet': { trading: 0, withdrawal: 0, requiresP2P: false },
  'saldo': { trading: 0, withdrawal: 0, requiresP2P: false },
  'pluscrypto': { trading: 0, withdrawal: 0, requiresP2P: false },
  'bybit': { trading: 0, withdrawal: 0, requiresP2P: false },
  'eluter': { trading: 0, withdrawal: 0, requiresP2P: false },
  'trubit': { trading: 0, withdrawal: 0, requiresP2P: false },
  'cocoscrypto': { trading: 0, withdrawal: 0, requiresP2P: false },
  'wallbit': { trading: 0, withdrawal: 0, requiresP2P: false },
  // P2P exchanges (spread ya incluye los fees, pero tienen mayor volatilidad)
  'binancep2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'okexp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'paxfulp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'huobip2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'bybitp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'kucoinp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'bitgetp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'paydecep2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'eldoradop2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'bingxp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'lemoncashp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'coinexp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'mexcp2p': { trading: 0, withdrawal: 0, requiresP2P: true },
  'default': { trading: 0, withdrawal: 0, requiresP2P: false } // Por defecto: fees ya incluidos en spread
};

// Función para obtener fees de un exchange
function getExchangeFees(exchangeName) {
  return EXCHANGE_FEES[exchangeName.toLowerCase()] || EXCHANGE_FEES.default;
}

export {
  DEBUG_MODE,
  REQUEST_INTERVAL,
  lastRequestTime,
  CACHE_CONFIG,
  EXCHANGE_FEES,
  log,
  getExchangeFees
};