/**
 * Arbitrage Calculator Module - ArbitrageAR v5.0
 * Cálculos centralizados de rutas de arbitraje
 */

const ArbitrageCalculator = (() => {
  // Configuración por defecto
  const config = {
    defaultFees: {
      trading: 0.001, // 0.1%
      withdrawal: 0.0005, // 0.05%
      bank: 0.0 // Sin comisión bancaria por defecto
    },
    minProfit: -10, // Porcentaje mínimo para mostrar
    sortByProfit: true
  };

  /**
   * Calcular ganancia de una ruta de arbitraje simple
   * ARS -> USD (banco) -> USDT -> ARS
   */
  const calculateSimpleArbitrage = params => {
    const {
      initialAmount, // Monto inicial en ARS
      dollarBuyPrice, // Precio de compra del dólar (ej: 1050)
      usdtSellPrice, // Precio de venta USDT en ARS (ej: 1080)
      fees = {}
    } = params;

    if (!initialAmount || !dollarBuyPrice || !usdtSellPrice) {
      return null;
    }

    // Calcular comisiones
    const tradingFee = fees.trading ?? config.defaultFees.trading;
    const withdrawalFee = fees.withdrawal ?? config.defaultFees.withdrawal;
    const bankFee = fees.bank ?? config.defaultFees.bank;

    // Paso 1: Comprar USD con ARS
    const usdBought = initialAmount / dollarBuyPrice;
    const usdAfterBankFee = usdBought * (1 - bankFee);

    // Paso 2: Comprar USDT con USD (asumiendo 1:1 para simplificar)
    const usdtBought = usdAfterBankFee * (1 - tradingFee);

    // Paso 3: Vender USDT por ARS
    const arsBeforeFees = usdtBought * usdtSellPrice;
    const finalAmount = arsBeforeFees * (1 - tradingFee);

    // Calcular ganancia
    const profit = finalAmount - initialAmount;
    const profitPercentage = (profit / initialAmount) * 100;

    return {
      initialAmount,
      finalAmount: Math.round(finalAmount * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercentage: Math.round(profitPercentage * 1000) / 1000,
      steps: {
        usdBought: Math.round(usdBought * 100) / 100,
        usdtBought: Math.round(usdtBought * 100) / 100,
        arsReceived: Math.round(finalAmount * 100) / 100
      }
    };
  };

  /**
   * Calcular ruta inter-broker (comprar en un exchange, vender en otro)
   */
  const calculateInterBrokerRoute = params => {
    const {
      buyExchange,
      sellExchange,
      buyPrice, // Precio ask del exchange de compra
      sellPrice, // Precio bid del exchange de venta
      dollarPrice, // Precio del dólar oficial
      initialAmount = 1000000,
      fees = {}
    } = params;

    if (!buyPrice || !sellPrice || !dollarPrice) {
      return null;
    }

    // No tiene sentido si compramos más caro de lo que vendemos
    if (buyPrice >= sellPrice) {
      return null;
    }

    const tradingFee = fees.trading ?? config.defaultFees.trading;

    // Calcular USD disponibles
    const usdAvailable = initialAmount / dollarPrice;

    // Comprar USDT
    const usdtBought = (usdAvailable / buyPrice) * (1 - tradingFee);

    // Vender USDT
    const arsReceived = usdtBought * sellPrice * (1 - tradingFee);

    const profit = arsReceived - initialAmount;
    const profitPercentage = (profit / initialAmount) * 100;

    return {
      buyExchange,
      sellExchange,
      buyPrice,
      sellPrice,
      dollarPrice,
      initialAmount,
      finalAmount: Math.round(arsReceived * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercentage: Math.round(profitPercentage * 1000) / 1000,
      spread: Math.round((sellPrice - buyPrice) * 100) / 100,
      spreadPercent: Math.round(((sellPrice - buyPrice) / buyPrice) * 10000) / 100
    };
  };

  /**
   * Determinar si una ruta requiere P2P
   */
  const isP2PRoute = route => {
    if (!route) return false;

    // Si tiene el flag explícito, usarlo
    if (typeof route.requiresP2P === 'boolean') {
      return route.requiresP2P;
    }

    // Detectar por nombre
    const brokerName = (route.broker || '').toLowerCase();
    const buyName = (route.buyExchange || '').toLowerCase();
    const sellName = (route.sellExchange || '').toLowerCase();

    const p2pPatterns = ['p2p', 'peer', 'c2c', 'person'];

    return p2pPatterns.some(
      pattern =>
        brokerName.includes(pattern) || buyName.includes(pattern) || sellName.includes(pattern)
    );
  };

  /**
   * Filtrar rutas por criterios
   */
  const filterRoutes = (routes, filters = {}) => {
    const {
      minProfit = config.minProfit,
      hideNegative = false,
      hideP2P = false,
      onlyP2P = false,
      exchange = 'all'
    } = filters;

    return routes.filter(route => {
      // Filtro de ganancia mínima
      if (route.profitPercentage < minProfit) return false;

      // Filtro de rutas negativas
      if (hideNegative && route.profitPercentage < 0) return false;

      // Filtro P2P
      const isP2P = isP2PRoute(route);
      if (hideP2P && isP2P) return false;
      if (onlyP2P && !isP2P) return false;

      // Filtro de exchange
      if (exchange !== 'all') {
        const matchesExchange =
          route.broker === exchange ||
          route.buyExchange === exchange ||
          route.sellExchange === exchange;
        if (!matchesExchange) return false;
      }

      return true;
    });
  };

  /**
   * Ordenar rutas
   */
  const sortRoutes = (routes, sortBy = 'profit-desc') => {
    const sorted = [...routes];

    switch (sortBy) {
      case 'profit-desc':
        sorted.sort((a, b) => b.profitPercentage - a.profitPercentage);
        break;
      case 'profit-asc':
        sorted.sort((a, b) => a.profitPercentage - b.profitPercentage);
        break;
      case 'spread-desc':
        sorted.sort((a, b) => (b.spread || 0) - (a.spread || 0));
        break;
      case 'name-asc':
        sorted.sort((a, b) => (a.broker || '').localeCompare(b.broker || ''));
        break;
      default:
        break;
    }

    return sorted;
  };

  /**
   * Obtener resumen estadístico de rutas
   */
  const getRoutesStats = routes => {
    if (!routes || routes.length === 0) {
      return {
        count: 0,
        profitable: 0,
        avgProfit: 0,
        maxProfit: 0,
        minProfit: 0
      };
    }

    const profits = routes.map(r => r.profitPercentage || 0);
    const profitable = routes.filter(r => (r.profitPercentage || 0) > 0).length;

    return {
      count: routes.length,
      profitable,
      avgProfit: Math.round((profits.reduce((a, b) => a + b, 0) / profits.length) * 100) / 100,
      maxProfit: Math.round(Math.max(...profits) * 100) / 100,
      minProfit: Math.round(Math.min(...profits) * 100) / 100
    };
  };

  // Configuración
  const setConfig = newConfig => {
    Object.assign(config, newConfig);
  };

  // API pública
  return {
    calculateSimpleArbitrage,
    calculateInterBrokerRoute,
    isP2PRoute,
    filterRoutes,
    sortRoutes,
    getRoutesStats,
    setConfig
  };
})();

// Exponer globalmente para service worker
if (typeof self !== 'undefined') {
  self.ArbitrageCalculator = ArbitrageCalculator;
}
