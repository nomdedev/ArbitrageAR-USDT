// ============================================
// CONFIG MODULE - ArbitrageAR Background
// ============================================

// Sistema de logging unificado
const DEBUG_MODE = false; // ⚠️ Cambiado a false para producción - mejora rendimiento

function log(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// Configuración de rate limiting
const REQUEST_INTERVAL = 600; // ms (110 req/min max)
let lastRequestTime = 0;

// Comisiones típicas por exchange (en porcentaje)
// IMPORTANTE: Los fees de trading (compra/venta) generalmente YA ESTÁN INCLUIDOS en el spread (bid/ask)
// Solo se agregan fees explícitos si el exchange los cobra ADEMÁS del spread
const EXCHANGE_FEES = {
  'binance': { trading: 0, withdrawal: 0 },
  'buenbit': { trading: 0, withdrawal: 0 },
  'ripio': { trading: 0, withdrawal: 0 },
  'ripioexchange': { trading: 0, withdrawal: 0 },
  'letsbit': { trading: 0, withdrawal: 0 },
  'satoshitango': { trading: 0, withdrawal: 0 },
  'belo': { trading: 0, withdrawal: 0 },
  'tiendacrypto': { trading: 0, withdrawal: 0 },
  'cryptomkt': { trading: 0, withdrawal: 0 },
  'cryptomktpro': { trading: 0, withdrawal: 0 },
  'bitso': { trading: 0, withdrawal: 0 },
  'bitsoalpha': { trading: 0, withdrawal: 0 },
  'lemoncash': { trading: 0, withdrawal: 0 },
  'universalcoins': { trading: 0, withdrawal: 0 },
  'decrypto': { trading: 0, withdrawal: 0 },
  'fiwind': { trading: 0, withdrawal: 0 },
  'vitawallet': { trading: 0, withdrawal: 0 },
  'saldo': { trading: 0, withdrawal: 0 },
  'pluscrypto': { trading: 0, withdrawal: 0 },
  'bybit': { trading: 0, withdrawal: 0 },
  'eluter': { trading: 0, withdrawal: 0 },
  'trubit': { trading: 0, withdrawal: 0 },
  'cocoscrypto': { trading: 0, withdrawal: 0 },
  'wallbit': { trading: 0, withdrawal: 0 },
  // P2P exchanges (spread ya incluye los fees, pero tienen mayor volatilidad)
  'binancep2p': { trading: 0, withdrawal: 0 },
  'okexp2p': { trading: 0, withdrawal: 0 },
  'paxfulp2p': { trading: 0, withdrawal: 0 },
  'huobip2p': { trading: 0, withdrawal: 0 },
  'bybitp2p': { trading: 0, withdrawal: 0 },
  'kucoinp2p': { trading: 0, withdrawal: 0 },
  'bitgetp2p': { trading: 0, withdrawal: 0 },
  'paydecep2p': { trading: 0, withdrawal: 0 },
  'eldoradop2p': { trading: 0, withdrawal: 0 },
  'bingxp2p': { trading: 0, withdrawal: 0 },
  'lemoncashp2p': { trading: 0, withdrawal: 0 },
  'coinexp2p': { trading: 0, withdrawal: 0 },
  'mexcp2p': { trading: 0, withdrawal: 0 },
  'default': { trading: 0, withdrawal: 0 } // Por defecto: fees ya incluidos en spread
};

// Función para obtener fees de un exchange
function getExchangeFees(exchangeName) {
  return EXCHANGE_FEES[exchangeName.toLowerCase()] || EXCHANGE_FEES.default;
}

export {
  DEBUG_MODE,
  REQUEST_INTERVAL,
  lastRequestTime,
  EXCHANGE_FEES,
  log,
  getExchangeFees
};