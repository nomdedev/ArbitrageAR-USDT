/**
 * Reproducción F-01 — la comisión de venta se descarta al calcular la ganancia neta.
 *
 * Copia LITERALMENTE la aritmética de src/background/main-simple.js:880-926
 * (calculateSingleExchangeRoute) y la compara contra la versión corregida.
 * No importa el módulo porque main-simple.js es un service worker que necesita chrome.*.
 *
 * Uso:  node docs/auditoria-2026-09/repro-f01-sell-fee.mjs
 */

// --- Copia literal de resolveBrokerFee (main-simple.js:635-642) --------------------
function resolveBrokerFee(userSettings, exchange, feeType) {
  const config = (userSettings.brokerFees || []).find(
    fee => fee.broker.toLowerCase() === exchange.toLowerCase()
  );
  if (config && config[feeType] > 0) return config[feeType];
  if (feeType === 'buyFee') return userSettings.extraTradingFee || 0;
  return 0;
}

// --- Copia literal de la aritmética (main-simple.js:880-926) ----------------------
function calcular({ initialAmount, officialPrice, bid, usdToUsdtRate = 1, userSettings, exchange, conFix }) {
  const applyFees = true;
  const data = { totalBid: bid };

  const usdPurchased = initialAmount / officialPrice;
  const usdtPurchased = usdPurchased / usdToUsdtRate;

  let usdtAfterFees = usdtPurchased;
  let tradingFeeAmount = 0;
  const tradingFeePercent = resolveBrokerFee(userSettings, exchange, 'buyFee');
  if (tradingFeePercent > 0) {
    tradingFeeAmount = usdtPurchased * (tradingFeePercent / 100);
    usdtAfterFees = usdtPurchased - tradingFeeAmount;
  }

  const sellPrice = data.totalBid;
  const arsFromSale = usdtAfterFees * sellPrice;

  let arsAfterSellFee = arsFromSale;
  let sellFeeAmount = 0;
  const sellFeePercent = resolveBrokerFee(userSettings, exchange, 'sellFee');
  if (sellFeePercent > 0) {
    sellFeeAmount = arsFromSale * (sellFeePercent / 100);
    arsAfterSellFee = arsFromSale - sellFeeAmount;
  }

  const withdrawalFee = userSettings.extraWithdrawalFee || 0;
  const transferFee = userSettings.extraTransferFee || 0;
  const bankFee = userSettings.bankCommissionFee || 0;
  // :918 del código REAL usa arsFromSale (pierde sellFee) — la versión corregida usa arsAfterSellFee
  const finalAmount = conFix
    ? arsAfterSellFee - (withdrawalFee + transferFee + bankFee)
    : arsFromSale - (withdrawalFee + transferFee + bankFee);

  const netProfit = finalAmount - initialAmount;
  const totalFees =
    tradingFeeAmount * sellPrice + sellFeeAmount + withdrawalFee + transferFee + bankFee;

  return {
    arsFromSale,
    sellFeeAmount,
    finalAmount,
    netProfit,
    netPercent: (netProfit / initialAmount) * 100,
    totalFees
  };
}

const fmt = n => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);
const pct = n => `${n >= 0 ? '+' : ''}${n.toFixed(3)}%`;
const verdict = n => (n > 0 ? 'RENTABLE' : 'PÉRDIDA');

function escenario(nombre, cfg) {
  const malo = calcular({ ...cfg, conFix: false });
  const bien = calcular({ ...cfg, conFix: true });
  console.log(`\n### ${nombre}`);
  console.log(`   Entrada ${fmt(cfg.initialAmount)} ARS · dólar oficial ${cfg.officialPrice} · USDT bid ${cfg.bid}`);
  console.log(
    `   Comisiones del exchange: compra ${cfg.userSettings.brokerFees[0].buyFee}% · venta ${cfg.userSettings.brokerFees[0].sellFee}%`
  );
  console.log(`   Código ACTUAL   → ${fmt(malo.netProfit)} ARS  ${pct(malo.netPercent)}  ${verdict(malo.netPercent)}`);
  console.log(`   Código CORREGIDO→ ${fmt(bien.netProfit)} ARS  ${pct(bien.netPercent)}  ${verdict(bien.netPercent)}`);
  console.log(
    `   Comisión de venta calculada y NO aplicada: ${fmt(malo.sellFeeAmount)} ARS` +
      `  (fees.total informado ${fmt(malo.totalFees)}, descontado real ${fmt(malo.totalFees - malo.sellFeeAmount)})`
  );
  if (malo.netPercent > 0 && bien.netPercent <= 0) {
    console.log('   >>> EL SIGNO SE INVIERTE: la extensión muestra rentable una ruta que pierde plata.');
  }
}

const broker = (buyFee, sellFee) => ({
  extraTradingFee: 0,
  extraWithdrawalFee: 0,
  extraTransferFee: 0,
  bankCommissionFee: 0,
  brokerFees: [{ broker: 'ripio', buyFee, sellFee }]
});

console.log('=== F-01 · Comisión de venta descartada en el cálculo de ganancia neta ===');
console.log('main-simple.js:918 → finalAmount = arsFromSale - (extras)   [arsAfterSellFee se pierde]');

// Escenario A: comisiones chicas, se ve la magnitud del error
escenario('A) Comisiones 1% compra / 1% venta, spread amplio', {
  initialAmount: 1_000_000,
  officialPrice: 1000,
  bid: 1200,
  userSettings: broker(1, 1),
  exchange: 'ripio'
});

// Escenario B: caso realista — la ruta parece rentable y en realidad pierde
escenario('B) Caso realista: spread 2%, comisiones 0,5% compra / 1,5% venta', {
  initialAmount: 1_000_000,
  officialPrice: 1000,
  bid: 1020,
  userSettings: broker(0.5, 1.5),
  exchange: 'ripio'
});

// Escenario C: comisiones de retiro/transferencia/banco cargadas (el usuario las configuró)
escenario('C) Igual que B pero con 3.000 ARS de retiro + 2.000 de transferencia', {
  initialAmount: 1_000_000,
  officialPrice: 1000,
  bid: 1020,
  userSettings: {
    extraTradingFee: 0,
    extraWithdrawalFee: 3000,
    extraTransferFee: 2000,
    bankCommissionFee: 0,
    brokerFees: [{ broker: 'ripio', buyFee: 0.5, sellFee: 1.5 }]
  },
  exchange: 'ripio'
});

console.log('\nNota: en el escenario C la comisión de venta (15.223 ARS) sigue sin descontarse');
console.log('aunque el usuario haya cargado todos los campos de comisiones extra.');
process.exit(0);
