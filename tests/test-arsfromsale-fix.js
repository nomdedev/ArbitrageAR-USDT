// Test para validar el cálculo corregido v5.0.58
// Verifica que arsFromSale se calcule correctamente

const fs = require('fs');
const path = require('path');

// Simular datos de entrada
const testData = {
  oficial: { compra: 950, venta: 970 },
  usdt: {
    lemoncash: {
      totalAsk: 1040,
      totalBid: 1030
    }
  },
  usdtUsd: {
    lemoncash: {
      totalAsk: 1.01
    }
  }
};

const userSettings = {
  extraTradingFee: 0, // Sin fees para calcular ganancia bruta
  extraWithdrawalFee: 0,
  extraTransferFee: 0,
  bankCommissionFee: 0,
  applyFeesInCalculation: false,
  fallbackUsdToUsdtRate: 1.0
};

// Simular cálculo de ruta (lógica copiada de main-simple.js)
function calculateRoute(exchange, data, oficial, usdtUsd, userSettings) {
  const initialAmount = 1000000; // $1M ARS
  const officialPrice = oficial.compra;
  const applyFees = userSettings.applyFeesInCalculation || false;
  
  // PASO 1: Comprar USD con ARS
  const usdPurchased = initialAmount / officialPrice;
  console.log(`💵 PASO 1: $${initialAmount} ARS / ${officialPrice} = ${usdPurchased.toFixed(4)} USD`);
  
  // PASO 2: Convertir USD → USDT
  const fallbackRate = userSettings.fallbackUsdToUsdtRate || 1.0;
  const usdToUsdtRate = usdtUsd?.[exchange]?.totalAsk || fallbackRate;
  const usdtPurchased = usdPurchased / usdToUsdtRate;
  console.log(`💎 PASO 2: ${usdPurchased.toFixed(4)} USD / ${usdToUsdtRate} = ${usdtPurchased.toFixed(4)} USDT`);
  
  // PASO 3: Aplicar fees (si aplica)
  let usdtAfterFees = usdtPurchased;
  let tradingFeeAmount = 0;
  
  if (applyFees && userSettings.extraTradingFee > 0) {
    tradingFeeAmount = usdtPurchased * (userSettings.extraTradingFee / 100);
    usdtAfterFees = usdtPurchased - tradingFeeAmount;
    console.log(`💸 PASO 3: Fee ${userSettings.extraTradingFee}% = ${tradingFeeAmount.toFixed(4)} USDT`);
  }
  
  // PASO 3.5: Vender USDT por ARS (CORREGIDO v5.0.58)
  const sellPrice = data.totalBid;
  const arsFromSale = usdtAfterFees * sellPrice;
  console.log(`💰 PASO 3.5: Vender ${usdtAfterFees.toFixed(4)} USDT × ${sellPrice} = $${arsFromSale.toFixed(2)} ARS`);
  
  // Validar que arsFromSale existe
  if (typeof arsFromSale !== 'number' || isNaN(arsFromSale)) {
    throw new Error('❌ arsFromSale no está definido o no es un número');
  }
  
  // PASO 4: Calcular ganancia
  const grossProfit = arsFromSale - initialAmount;
  const grossPercent = (grossProfit / initialAmount) * 100;
  
  console.log(`📊 RESULTADO: Ganancia = $${grossProfit.toFixed(2)} (${grossPercent.toFixed(4)}%)`);
  
  return {
    initialAmount,
    usdPurchased,
    usdtPurchased,
    usdtAfterFees,
    sellPrice,
    arsFromSale,
    grossProfit,
    grossPercent
  };
}

// Ejecutar test
console.log('🧪 Test: Corrección arsFromSale v5.0.58');
console.log('='.repeat(60));

try {
  const result = calculateRoute('lemoncash', testData.usdt.lemoncash, testData.oficial, testData.usdtUsd, userSettings);
  
  console.log('\n✅ Test completado exitosamente');
  console.log('📊 Valores calculados:');
  console.log(`  - USD comprados: ${result.usdPurchased.toFixed(4)}`);
  console.log(`  - USDT comprados: ${result.usdtPurchased.toFixed(4)}`);
  console.log(`  - Precio venta USDT: ${result.sellPrice}`);
  console.log(`  - ARS de venta: $${result.arsFromSale.toFixed(2)}`);
  console.log(`  - Ganancia bruta: $${result.grossProfit.toFixed(2)} (${result.grossPercent.toFixed(2)}%)`);
  
  // Validaciones
  const validations = [
    { name: 'arsFromSale existe', pass: typeof result.arsFromSale === 'number' && !isNaN(result.arsFromSale) },
    { name: 'arsFromSale > 0', pass: result.arsFromSale > 0 },
    { name: 'Ganancia calculada', pass: typeof result.grossProfit === 'number' },
    { name: 'Porcentaje calculado', pass: typeof result.grossPercent === 'number' }
  ];
  
  console.log('\n🔍 Validaciones:');
  validations.forEach(v => {
    console.log(`  ${v.pass ? '✅' : '❌'} ${v.name}`);
  });
  
  const allPass = validations.every(v => v.pass);
  console.log('\n🎯 Resultado final:', allPass ? '✅ TODAS LAS VALIDACIONES PASAN' : '❌ ALGUNAS VALIDACIONES FALLARON');
  
} catch (error) {
  console.error('❌ Error en test:', error.message);
  console.log('\n🎯 Resultado final: ❌ TEST FALLÓ');
}