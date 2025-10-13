// ============================================
// TEST: FEES ESPECÍFICOS POR BROKER v5.0.52
// ============================================

const fs = require('fs');

// Simular configuración con fees por broker
const mockSettings = {
  defaultSimAmount: 1000000,
  applyFeesInCalculation: true,
  extraTradingFee: 0, // Fee general desactivado
  extraWithdrawalFee: 0,
  extraTransferFee: 0,
  bankCommissionFee: 0,
  brokerFees: [
    { broker: 'Lemon Cash', buyFee: 1.5, sellFee: 0.8 },
    { broker: 'Ripio', buyFee: 2.0, sellFee: 1.2 },
    { broker: 'Buenbit', buyFee: 0.5, sellFee: 0.3 }
  ]
};

// Datos simulados de APIs
const mockOficial = {
  compra: 950,
  venta: 960,
  source: 'dolarapi_oficial',
  timestamp: Date.now()
};

const mockUsdt = {
  'Lemon Cash': { totalAsk: 950, totalBid: 940 },
  'Ripio': { totalAsk: 952, totalBid: 942 },
  'Buenbit': { totalAsk: 948, totalBid: 938 }
};

const mockUsdtUsd = {
  'Lemon Cash': { totalAsk: 1.02 },
  'Ripio': { totalAsk: 1.01 },
  'Buenbit': { totalAsk: 1.03 }
};

// Función de cálculo simplificada (extraída de main-simple.js)
function calculateSimpleRoutesTest(oficial, usdt, usdtUsd, userSettings) {
  if (!oficial || !usdt) return [];

  const routes = [];
  const officialPrice = oficial.compra;
  const applyFees = userSettings.applyFeesInCalculation;
  const initialAmount = userSettings.defaultSimAmount;

  for (const [exchange, data] of Object.entries(usdt)) {
    if (!data || !data.totalAsk || !data.totalBid) continue;
    if (exchange === 'time' || exchange === 'timestamp') continue;

    // PASO 1: Comprar USD con ARS
    const usdPurchased = initialAmount / officialPrice;

    // PASO 2: Convertir USD → USDT
    const usdToUsdtRate = usdtUsd?.[exchange]?.totalAsk || 1.0;
    const usdtPurchased = usdPurchased / usdToUsdtRate;

    // PASO 3: Aplicar fee de compra específico del broker
    let usdtAfterFees = usdtPurchased;
    let tradingFeeAmount = 0;

    if (applyFees) {
      let tradingFeePercent = userSettings.extraTradingFee || 0;
      const brokerFees = userSettings.brokerFees || [];
      const brokerFeeConfig = brokerFees.find(fee =>
        fee.broker.toLowerCase() === exchange.toLowerCase()
      );

      if (brokerFeeConfig) {
        tradingFeePercent = brokerFeeConfig.buyFee || 0;
      }

      if (tradingFeePercent > 0) {
        tradingFeeAmount = usdtPurchased * (tradingFeePercent / 100);
        usdtAfterFees = usdtPurchased - tradingFeeAmount;
      }
    }

    // PASO 4: Vender USDT por ARS
    const sellPrice = data.totalBid;
    const arsFromSale = usdtAfterFees * sellPrice;

    // PASO 4b: Aplicar fee de venta específico del broker
    let arsAfterSellFee = arsFromSale;
    let sellFeeAmount = 0;

    if (applyFees) {
      const brokerFees = userSettings.brokerFees || [];
      const brokerFeeConfig = brokerFees.find(fee =>
        fee.broker.toLowerCase() === exchange.toLowerCase()
      );

      if (brokerFeeConfig && brokerFeeConfig.sellFee > 0) {
        const sellFeePercent = brokerFeeConfig.sellFee / 100;
        sellFeeAmount = arsFromSale * sellFeePercent;
        arsAfterSellFee = arsFromSale - sellFeeAmount;
      }
    }

    // PASO 5: Fees fijos (todos 0 en este test)
    const finalAmount = arsAfterSellFee;

    // Calcular ganancias
    const grossProfit = arsFromSale - initialAmount;
    const netProfit = finalAmount - initialAmount;
    const grossPercent = (grossProfit / initialAmount) * 100;
    const netPercent = (netProfit / initialAmount) * 100;

    // Total fees
    const totalFees = tradingFeeAmount * sellPrice + sellFeeAmount;

    routes.push({
      broker: exchange,
      profitPercent: netPercent,
      grossProfitPercent: grossPercent,
      fees: {
        trading: tradingFeeAmount * sellPrice,
        sell: sellFeeAmount,
        total: totalFees
      },
      config: {
        brokerSpecificFees: !!userSettings.brokerFees?.find(f =>
          f.broker.toLowerCase() === exchange.toLowerCase()
        )
      }
    });
  }

  return routes;
}

// Ejecutar test
console.log('🧪 TEST: Fees específicos por broker v5.0.52');
console.log('=' .repeat(50));

const routes = calculateSimpleRoutesTest(mockOficial, mockUsdt, mockUsdtUsd, mockSettings);

routes.forEach(route => {
  console.log(`🏦 ${route.broker}:`);
  console.log(`   Profit bruto: ${route.grossProfitPercent.toFixed(4)}%`);
  console.log(`   Profit neto: ${route.profitPercent.toFixed(4)}%`);
  console.log(`   Fees aplicados: ${route.config.brokerSpecificFees ? 'SÍ' : 'NO'}`);
  console.log(`   Fee trading: $${route.fees.trading.toFixed(2)}`);
  console.log(`   Fee venta: $${route.fees.sell.toFixed(2)}`);
  console.log(`   Total fees: $${route.fees.total.toFixed(2)}`);
  console.log('');
});

// Validaciones
const lemonRoute = routes.find(r => r.broker === 'Lemon Cash');
const ripioRoute = routes.find(r => r.broker === 'Ripio');
const buenbitRoute = routes.find(r => r.broker === 'Buenbit');

console.log('✅ VALIDACIONES:');
console.log(`Lemon Cash usa fees específicos: ${lemonRoute?.config.brokerSpecificFees ? 'PASS' : 'FAIL'}`);
console.log(`Ripio usa fees específicos: ${ripioRoute?.config.brokerSpecificFees ? 'PASS' : 'FAIL'}`);
console.log(`Buenbit usa fees específicos: ${buenbitRoute?.config.brokerSpecificFees ? 'PASS' : 'FAIL'}`);

console.log(`\nLemon Cash fee trading > 0: ${lemonRoute?.fees.trading > 0 ? 'PASS' : 'FAIL'}`);
console.log(`Lemon Cash fee venta > 0: ${lemonRoute?.fees.sell > 0 ? 'PASS' : 'FAIL'}`);

console.log(`\nProfit neto < bruto (fees aplicados): ${lemonRoute?.profitPercent < lemonRoute?.grossProfitPercent ? 'PASS' : 'FAIL'}`);

console.log('\n🎯 TEST COMPLETADO');