// ============================================
// ROUTE CALCULATOR MODULE - ArbitrageAR Background
// ============================================

import { log, getExchangeFees } from './config.js';

// Función auxiliar para cargar fees personalizados del usuario
async function loadUserFees() {
  try {
    const stored = await chrome.storage.local.get('notificationSettings');
    if (stored.notificationSettings) {
      const fees = {
        extraTradingFee: stored.notificationSettings.extraTradingFee || 0,
        extraWithdrawalFee: stored.notificationSettings.extraWithdrawalFee || 0,
        extraTransferFee: stored.notificationSettings.extraTransferFee || 0,
        bankCommissionFee: stored.notificationSettings.bankCommissionFee || 0
      };

      if (fees.extraTradingFee > 0 || fees.extraWithdrawalFee > 0 ||
          fees.extraTransferFee > 0 || fees.bankCommissionFee > 0) {
        log('💸 Fees personalizados activos:', fees);
      }

      return fees;
    }
  } catch (error) {
    log('⚠️ Error cargando fees personalizados:', error);
  }

  return { extraTradingFee: 0, extraWithdrawalFee: 0, extraTransferFee: 0, bankCommissionFee: 0 };
}

// Función auxiliar para validar datos de entrada
function validateInputData(oficial, usdt, usdtUsd) {
  if (!oficial || !usdt || !usdtUsd) {
    log('⚠️ Datos faltantes en calculateOptimizedRoutes');
    return false;
  }

  const officialSellPrice = parseFloat(oficial.venta) || 0;
  if (!officialSellPrice || officialSellPrice <= 0) {
    log('⚠️ Precio oficial inválido');
    return false;
  }

  return true;
}

// Función auxiliar para obtener exchanges válidos
function getValidExchanges(usdt) {
  const excludedKeys = ['time', 'timestamp', 'fecha', 'date', 'p2p', 'total'];

  const buyExchanges = Object.keys(usdt).filter(key => {
    return typeof usdt[key] === 'object' &&
           usdt[key] !== null &&
           !excludedKeys.includes(key.toLowerCase());
  });

  return {
    buyExchanges,
    sellExchanges: [...buyExchanges]
  };
}

// Función auxiliar para determinar el tipo de red de USDT
function getUsdtNetwork(usdtData) {
  // Lógica para determinar la red (TRC20, ERC20, BEP20, etc.)
  // Por simplicidad, devolver default por ahora
  return 'default';
}

// Función auxiliar para calcular una ruta específica
function calculateRoute(buyExchange, sellExchange, oficial, usdt, usdtUsd, userFees, transferFees) {
  try {
    const buyData = usdt[buyExchange];
    const sellData = usdt[sellExchange];

    if (!buyData || !sellData) return null;

    const officialSellPrice = parseFloat(oficial.venta);
    const initialAmount = 100000; // $100,000 ARS base

    // Paso 1: Aplicar comisión bancaria si existe
    const initialAfterBankFee = initialAmount * (1 - userFees.bankCommissionFee / 100);

    // Paso 2: Comprar USD oficial
    const usdPurchased = initialAfterBankFee / officialSellPrice;

    // Paso 3: Obtener ratio USD/USDT para el exchange comprador
    let usdToUsdtRate = 1;
    if (usdtUsd[buyExchange]?.usd) {
      usdToUsdtRate = parseFloat(usdtUsd[buyExchange].usd);
    }

    // Paso 4: Comprar USDT
    const usdtPurchased = usdPurchased / usdToUsdtRate;

    // Paso 5: Aplicar fees de compra
    const buyFees = getExchangeFees(buyExchange);
    const totalBuyFee = buyFees.trading + userFees.extraTradingFee;
    const usdtAfterBuyFee = usdtPurchased * (1 - totalBuyFee / 100);

    // Paso 6: Fee de transferencia (solo si son exchanges diferentes)
    let usdtAfterTransfer = usdtAfterBuyFee;
    let transferFeeUSD = 0;

    if (buyExchange !== sellExchange) {
      const network = getUsdtNetwork(usdt[buyExchange]);
      transferFeeUSD = transferFees[network] || transferFees.default;
      usdtAfterTransfer = usdtAfterBuyFee - transferFeeUSD / usdToUsdtRate;
    }

    // Paso 7: Vender USDT por ARS
    const usdtArsBid = parseFloat(sellData.totalBid || sellData.bid || 0);
    const arsFromSale = usdtAfterTransfer * usdtArsBid;

    // Paso 8: Aplicar fees de venta
    const sellFees = getExchangeFees(sellExchange);
    const totalSellFee = sellFees.trading + userFees.extraTradingFee;
    const arsAfterSellFee = arsFromSale * (1 - totalSellFee / 100);

    // Paso 9: Aplicar fee de retiro
    const totalWithdrawalFee = sellFees.withdrawal + userFees.extraWithdrawalFee;
    const finalAmount = arsAfterSellFee * (1 - totalWithdrawalFee / 100);

    // Calcular ganancia
    const netProfit = finalAmount - initialAmount;
    const netProfitPercent = (netProfit / initialAmount) * 100;

    return {
      buyExchange,
      sellExchange,
      isSingleExchange: buyExchange === sellExchange,
      profitPercent: netProfitPercent,
      profitPercentage: netProfitPercent, // Para compatibilidad
      calculation: {
        initial: initialAmount,
        usdPurchased,
        usdtPurchased,
        usdtAfterFees: usdtAfterBuyFee,
        arsFromSale,
        finalAmount,
        netProfit
      },
      officialPrice: officialSellPrice,
      usdToUsdtRate,
      usdtArsBid,
      fees: {
        trading: Math.max(buyFees.trading, sellFees.trading) + userFees.extraTradingFee,
        withdrawal: sellFees.withdrawal + userFees.extraWithdrawalFee,
        total: totalBuyFee + totalSellFee + totalWithdrawalFee
      }
    };

  } catch (error) {
    log(`❌ Error calculando ruta ${buyExchange} → ${sellExchange}:`, error);
    return null;
  }
}

// Función principal para calcular rutas optimizadas
async function calculateOptimizedRoutes(oficial, usdt, usdtUsd) {
  log('🔀 Iniciando calculateOptimizedRoutes...');

  if (!validateInputData(oficial, usdt, usdtUsd)) {
    return [];
  }

  // Cargar fees personalizados
  const userFees = await loadUserFees();

  const officialSellPrice = parseFloat(oficial.venta);

  log(`💰 Precio oficial: $${officialSellPrice} ARS`);

  // Fees de transferencia entre exchanges
  const transferFees = {
    'TRC20': 1 + userFees.extraTransferFee,      // USDT Tron - más barato
    'ERC20': 15 + userFees.extraTransferFee,     // USDT Ethereum - caro
    'BEP20': 0.8 + userFees.extraTransferFee,    // USDT BSC - barato
    'default': 1 + userFees.extraTransferFee     // Por defecto
  };

  // Obtener exchanges válidos
  const { buyExchanges, sellExchanges } = getValidExchanges(usdt);

  if (buyExchanges.length === 0 || sellExchanges.length === 0) {
    log('⚠️ No hay exchanges válidos disponibles');
    return [];
  }

  log(`🏦 Exchanges disponibles: ${buyExchanges.length}`);

  const routes = [];

  // Calcular todas las combinaciones posibles
  for (const buyExchange of buyExchanges) {
    for (const sellExchange of sellExchanges) {
      const route = calculateRoute(buyExchange, sellExchange, oficial, usdt, usdtUsd, userFees, transferFees);

      if (route && route.profitPercent > 0.1) { // Solo rutas rentables (> 0.1%)
        routes.push(route);
      }
    }
  }

  // Ordenar por rentabilidad
  routes.sort((a, b) => b.profitPercent - a.profitPercent);

  // Limitar a las mejores 50 rutas para evitar sobrecarga
  const limitedRoutes = routes.slice(0, 50);

  log(`✅ ${limitedRoutes.length} rutas calculadas`);

  if (limitedRoutes.length > 0) {
    log(`🏆 Mejor ruta: ${limitedRoutes[0].buyExchange} → ${limitedRoutes[0].sellExchange} (${limitedRoutes[0].profitPercent.toFixed(2)}%)`);
  }

  return limitedRoutes;
}

export {
  calculateOptimizedRoutes,
  loadUserFees,
  validateInputData,
  getValidExchanges,
  calculateRoute
};