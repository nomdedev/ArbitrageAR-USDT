/**
 * Formatters Module - ArbitrageAR v5.0
 * Funciones de formateo unificadas
 */

// Crear formateador genérico
const createFormatter = (options = {}) => {
  const { minDecimals = 2, maxDecimals = 2, fallback = '0.00', locale = 'es-AR' } = options;

  return num => {
    if (num === undefined || num === null || isNaN(num)) {
      return fallback;
    }
    return Number(num).toLocaleString(locale, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    });
  };
};

// Formateadores específicos
const formatNumber = createFormatter();
const formatUsdUsdtRatio = createFormatter({ minDecimals: 3, maxDecimals: 3, fallback: 'N/D' });
const formatCommissionPercent = createFormatter({ minDecimals: 2, maxDecimals: 3 });
const formatPercent = createFormatter({ minDecimals: 2, maxDecimals: 2 });
const formatCurrency = createFormatter({ minDecimals: 2, maxDecimals: 2 });

/**
 * Formatear monto en ARS con símbolo
 */
const formatARS = amount => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }
  return `$${formatNumber(amount)}`;
};

/**
 * Formatear monto en USD con símbolo
 */
const formatUSD = amount => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'U$D 0.00';
  }
  return `U$D ${formatNumber(amount)}`;
};

/**
 * Formatear porcentaje con símbolo y color opcional
 */
const formatProfitPercent = percent => {
  if (percent === undefined || percent === null || isNaN(percent)) {
    return '0.00%';
  }
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${formatPercent(percent)}%`;
};

/**
 * Obtener texto para mostrar la fuente del precio del dólar
 */
const getDollarSourceDisplay = official => {
  if (!official || !official.source) return 'N/A';

  const sourceMap = {
    manual: '👤 Manual',
    dolarapi_fallback: '🔄 DolarAPI (fallback)',
    dolarapi_oficial: '🌐 DolarAPI (oficial)',
    manual_fallback: '🔄 Manual (fallback)',
    hardcoded_fallback: '⚠️ Fallback fijo'
  };

  if (sourceMap[official.source]) {
    return sourceMap[official.source];
  }

  if (official.source === 'dolarito_bank') {
    return `🏦 ${official.bank}`;
  }

  if (official.source === 'dolarito_median') {
    return `📊 Mediana (${official.banksCount || 0} bancos)`;
  }

  if (official.source === 'dolarito_trimmed_average') {
    return `📊 Prom. Recortado (${official.usedBanks || 0}/${official.banksCount || 0} bancos)`;
  }

  if (official.source === 'dolarito_average') {
    return `📊 Promedio (${official.banksCount || 0} bancos)`;
  }

  if (official.source === 'dolarito_cheapest') {
    return `💰 ${official.bank} (menor precio)`;
  }

  if (official.source === 'criptoya_banks') {
    const methodDisplay = {
      consenso: 'consenso',
      promedio: 'promedio',
      'mejor-compra': 'mejor compra',
      'mejor-venta': 'mejor venta'
    };
    const methodText = methodDisplay[official.method] || official.method || 'método';
    return `🏦 Bancos CriptoYa (${methodText})`;
  }

  return official.source;
};

/**
 * Formatear tiempo relativo
 */
const formatTimeAgo = timestamp => {
  if (!timestamp) return 'Sin datos';

  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins === 1) return 'Hace 1 minuto';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return 'Hace 1 hora';
  if (diffHours < 24) return `Hace ${diffHours} horas`;

  return 'Hace más de un día';
};

/**
 * Formatear nombre de exchange
 */
const formatExchangeName = name => {
  if (!name) return 'Desconocido';

  const nameMap = {
    binance: 'Binance',
    binancep2p: 'Binance P2P',
    buenbit: 'Buenbit',
    lemoncash: 'Lemon Cash',
    ripio: 'Ripio',
    fiwind: 'FiWind',
    letsbit: 'LetsBit',
    satoshitango: 'SatoshiTango',
    decrypto: 'Decrypto',
    bitsoalpha: 'Bitso Alpha',
    cryptomktpro: 'CryptoMKT Pro'
  };

  return nameMap[name.toLowerCase()] || name;
};

// Exportar para uso en módulos ES6 y CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createFormatter,
    formatNumber,
    formatUsdUsdtRatio,
    formatCommissionPercent,
    formatPercent,
    formatCurrency,
    formatARS,
    formatUSD,
    formatProfitPercent,
    getDollarSourceDisplay,
    formatTimeAgo,
    formatExchangeName
  };
}

// Exponer globalmente para navegador
if (typeof window !== 'undefined') {
  window.Formatters = {
    createFormatter,
    formatNumber,
    formatUsdUsdtRatio,
    formatCommissionPercent,
    formatPercent,
    formatCurrency,
    formatARS,
    formatUSD,
    formatProfitPercent,
    getDollarSourceDisplay,
    formatTimeAgo,
    formatExchangeName
  };
}
