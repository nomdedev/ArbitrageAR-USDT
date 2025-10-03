// ============================================
// ROUTE CALCULATOR MODULE - ArbitrageAR Background
// ============================================

import { log, getExchangeFees } from './config.js';

// Función auxiliar para cargar fees personalizados del usuario
// CORREGIDO v5.0.9: Cargar también defaultSimAmount
async function loadUserFees() {
  try {
    const stored = await chrome.storage.local.get('notificationSettings');
    if (stored.notificationSettings) {
      const settings = stored.notificationSettings;
      const fees = {
        extraTradingFee: settings.extraTradingFee || 0,
        extraWithdrawalFee: settings.extraWithdrawalFee || 0,
        extraTransferFee: settings.extraTransferFee || 0,
        bankCommissionFee: settings.bankCommissionFee || 0,
        defaultSimAmount: settings.defaultSimAmount || 100000  // NUEVO v5.0.9
      };

      if (fees.extraTradingFee > 0 || fees.extraWithdrawalFee > 0 ||
          fees.extraTransferFee > 0 || fees.bankCommissionFee > 0) {
        log('💸 Fees personalizados activos:', fees);
      }

      if (fees.defaultSimAmount !== 100000) {
        log(`💰 Monto base configurado: $${fees.defaultSimAmount.toLocaleString()} ARS`);
      }

      return fees;
    }
  } catch (error) {
    log('⚠️ Error cargando fees personalizados:', error);
  }

  return { 
    extraTradingFee: 0, 
    extraWithdrawalFee: 0, 
    extraTransferFee: 0, 
    bankCommissionFee: 0,
    defaultSimAmount: 100000  // NUEVO v5.0.9: Valor default
  };
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
function getValidExchanges(usdt, usdtUsd) {
  const excludedKeys = ['time', 'timestamp', 'fecha', 'date', 'p2p', 'total'];

  log(`🔍 [DEBUG] Analizando ${Object.keys(usdt).length} exchanges en USDT/ARS`);

  const buyExchanges = Object.keys(usdt).filter(key => {
    // Validar que tenga datos en USDT/ARS
    if (typeof usdt[key] !== 'object' || usdt[key] === null) {
      log(`❌ [DEBUG] ${key}: Sin datos USDT/ARS válidos`);
      return false;
    }
    
    if (excludedKeys.includes(key.toLowerCase())) {
      log(`🚫 [DEBUG] ${key}: Clave excluida`);
      return false;
    }

    // CORREGIDO v5.0.8: Validación USD/USDT más permisiva
    if (usdtUsd?.[key]) {
      const askPrice = parseFloat(usdtUsd[key].totalAsk || usdtUsd[key].ask);
      
      // Solo rechazar si el dato existe pero es claramente inválido
      if (askPrice && !isNaN(askPrice) && askPrice > 0) {
        // Rechazar si es exactamente 1.0 (sin spread, sospechoso)
        if (askPrice === 1.0) {
          log(`⚠️ [DEBUG] ${key}: USD/USDT = 1.0 exacto (sin spread real), excluyendo`);
          return false;
        }
        
        // Rechazar si está fuera del rango esperado (0.95 - 1.15)
        if (askPrice < 0.95 || askPrice > 1.15) {
          log(`⚠️ [DEBUG] ${key}: USD/USDT fuera de rango (${askPrice}), excluyendo`);
          return false;
        }
      }
      // Si askPrice es inválido, permitir pero loguear advertencia
      else if (!askPrice || isNaN(askPrice) || askPrice <= 0) {
        log(`ℹ️ [DEBUG] ${key}: Sin datos USD/USDT válidos, usará fallback`);
      }
    } else {
      // Exchange sin datos USD/USDT en la API, permitir con fallback
      log(`ℹ️ [DEBUG] ${key}: Sin datos USD/USDT, usará fallback 1.0 conservador`);
    }

    log(`✅ [DEBUG] ${key}: Exchange válido`);
    return true;
  });

  log(`📊 [DEBUG] Resultado: ${buyExchanges.length} exchanges válidos de ${Object.keys(usdt).length} totales`);

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
    // CORREGIDO v5.0.9: Usar monto configurado por el usuario
    const initialAmount = userFees.defaultSimAmount || 100000;

    // Paso 1: Aplicar comisión bancaria si existe
    const initialAfterBankFee = initialAmount * (1 - userFees.bankCommissionFee / 100);

    // Paso 2: Comprar USD oficial
    const usdPurchased = initialAfterBankFee / officialSellPrice;

    // Paso 3: Obtener ratio USD/USDT para el exchange comprador
    // CORREGIDO v5.0.10: Fallback conservador a 1.05 USD (valor realista)
    // CriptoYA muestra: totalAsk = cuántos USD necesito para comprar 1 USDT
    let usdToUsdtRate;
    if (usdtUsd?.[buyExchange]) {
      usdToUsdtRate = parseFloat(usdtUsd[buyExchange].totalAsk || usdtUsd[buyExchange].ask);
    }

    // Si no hay tasa válida, usar fallback 1.05 (valor realista del mercado)
    if (!usdToUsdtRate || isNaN(usdToUsdtRate) || usdToUsdtRate <= 0) {
      log(`⚠️ ${buyExchange}: Sin USD/USDT válido, usando fallback 1.05 (realista)`);
      usdToUsdtRate = 1.05;  // NUEVO v5.0.10: Valor realista del mercado
    } else if (usdToUsdtRate === 1.0) {
      log(`⚠️ ${buyExchange}: USD/USDT = 1.0 exacto (verificar si es real o placeholder)`);
    } else {
      log(`✅ ${buyExchange}: USD/USDT = ${usdToUsdtRate.toFixed(4)}`);
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

    // CORREGIDO v5.0.12: Calcular porcentaje relativo al monto configurado por el usuario
    // Si el usuario configuró 10M, mostrar el porcentaje como si fuera sobre 10M
    // Esto permite comparar rentabilidades de manera consistente
    const userConfiguredAmount = userFees.defaultSimAmount || 100000;
    const displayProfitPercent = (netProfit / userConfiguredAmount) * 100;

    console.log(`💰 Ruta ${buyExchange}→${sellExchange}:`);
    console.log(`   Monto base: $${initialAmount.toLocaleString()}`);
    console.log(`   Ganancia: $${netProfit.toFixed(2)} (${netProfitPercent.toFixed(4)}%)`);
    console.log(`   Mostrar como: ${displayProfitPercent.toFixed(4)}% sobre $${userConfiguredAmount.toLocaleString()}`);

    return {
      buyExchange,
      sellExchange,
      isSingleExchange: buyExchange === sellExchange,
      requiresP2P,  // NUEVO v5.0.7
      profitPercent: displayProfitPercent,  // CORREGIDO v5.0.12: Usar porcentaje relativo al monto configurado
      profitPercentage: displayProfitPercent, // Para compatibilidad
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
  log('🔀 [DEBUG] Iniciando calculateOptimizedRoutes...');

  if (!validateInputData(oficial, usdt, usdtUsd)) {
    log('❌ [DEBUG] Validación de datos falló');
    return [];
  }

  // Cargar fees personalizados
  const userFees = await loadUserFees();
  log('🔧 [DEBUG] Fees cargados:', userFees);

  const officialSellPrice = parseFloat(oficial.venta);
  log(`💰 [DEBUG] Precio oficial: $${officialSellPrice} ARS`);

  // Fees de transferencia entre exchanges
  const transferFees = {
    'TRC20': 1 + userFees.extraTransferFee,      // USDT Tron - más barato
    'ERC20': 15 + userFees.extraTransferFee,     // USDT Ethereum - caro
    'BEP20': 0.8 + userFees.extraTransferFee,    // USDT BSC - barato
    'default': 1 + userFees.extraTransferFee     // Por defecto
  };

  // Obtener exchanges válidos (filtrar los que no tienen datos USD/USDT válidos)
  const { buyExchanges, sellExchanges } = getValidExchanges(usdt, usdtUsd);
  log(`🏦 [DEBUG] Exchanges encontrados - USDT/ARS: ${Object.keys(usdt).length}, USD/USDT: ${Object.keys(usdtUsd || {}).length}`);
  log(`✅ [DEBUG] Exchanges válidos: ${buyExchanges.length} (${buyExchanges.slice(0, 5).join(', ')}${buyExchanges.length > 5 ? '...' : ''})`);

  if (buyExchanges.length === 0 || sellExchanges.length === 0) {
    log('❌ [DEBUG] No hay exchanges válidos disponibles');
    log('📊 Total exchanges en USDT/ARS:', Object.keys(usdt).length);
    log('📊 Total exchanges en USD/USDT:', Object.keys(usdtUsd || {}).length);
    return [];
  }

  log(`🏦 Exchanges válidos: ${buyExchanges.length} (${buyExchanges.join(', ')})`);

  const routes = [];
  let totalCalculated = 0;
  let nullRoutes = 0;
  let lowProfitRoutes = 0;

  log(`🔄 [DEBUG] Iniciando cálculo de rutas: ${buyExchanges.length} x ${sellExchanges.length} = ${buyExchanges.length * sellExchanges.length} combinaciones`);

  // Calcular todas las combinaciones posibles
  for (const buyExchange of buyExchanges) {
    for (const sellExchange of sellExchanges) {
      totalCalculated++;
      const route = calculateRoute(buyExchange, sellExchange, oficial, usdt, usdtUsd, userFees, transferFees);

      if (!route) {
        nullRoutes++;
        if (totalCalculated <= 5) log(`❌ [DEBUG] Ruta nula: ${buyExchange} → ${sellExchange}`);
        continue;
      }

      if (route.profitPercent <= -10) {
        lowProfitRoutes++;
        if (totalCalculated <= 5) log(`📉 [DEBUG] Rentabilidad muy baja: ${buyExchange} → ${sellExchange} (${route.profitPercent.toFixed(4)}%), excluyendo`);
        continue;
      }

      routes.push(route);
      log(`✅ [DEBUG] Ruta rentable: ${buyExchange} → ${sellExchange} (${route.profitPercent.toFixed(4)}%)`);
    }
  }

  log(`📊 [DEBUG] Análisis de rutas:`);
  log(`   - Total calculadas: ${totalCalculated}`);
  log(`   - Rutas nulas: ${nullRoutes}`);
  log(`   - Rentabilidad muy baja (≤-10%): ${lowProfitRoutes}`);
  log(`   - Rutas rentables: ${routes.length}`);

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