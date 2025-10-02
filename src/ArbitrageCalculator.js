// ============================================
// CALCULADOR DE ARBITRAJE - ArbitrageCalculator.js
// Responsabilidad: Realizar cálculos de arbitraje
// ============================================

class ArbitrageCalculator {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.EXCHANGE_FEES = {
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
      'default': { trading: 0, withdrawal: 0 }
    };

    this.TRANSFER_FEES = {
      'TRC20': 1, 'ERC20': 15, 'BEP20': 0.8, 'default': 1
    };
  }

  async calculateRoutes(official, usdt, usdtUsd) {
    if (!official || !usdt || !usdtUsd) {
      console.warn('Datos faltantes en calculateRoutes');
      return [];
    }

    // Cargar fees personalizados
    const userFees = await this._loadUserFees();
    const officialSellPrice = parseFloat(official.venta) || 0;
    const initialAmount = 100000;
    const excludedKeys = ['time', 'timestamp', 'fecha', 'date', 'p2p', 'total'];

    if (!officialSellPrice || officialSellPrice <= 0) {
      console.warn('Precio oficial inválido');
      return [];
    }

    const routes = [];
    const buyExchanges = Object.keys(usdt).filter(key =>
      typeof usdt[key] === 'object' &&
      usdt[key] !== null &&
      !excludedKeys.includes(key.toLowerCase())
    );

    const sellExchanges = [...buyExchanges];

    if (buyExchanges.length === 0 || sellExchanges.length === 0) {
      console.warn('No hay exchanges disponibles');
      return [];
    }

    // Para cada combinación de exchange
    buyExchanges.forEach(buyExchange => {
      const buyData = usdt[buyExchange];
      const buyUsdRate = usdtUsd[buyExchange];

      if (!buyData || !buyUsdRate) return;

      sellExchanges.forEach(sellExchange => {
        const sellData = usdt[sellExchange];
        if (!sellData) return;

        const isSingleExchange = (buyExchange === sellExchange);
        const sellBid = parseFloat(sellData.totalBid) || parseFloat(sellData.bid) || 0;

        if (sellBid < 100 || sellBid > 10000) return;

        // Calcular ruta
        const route = this._calculateSingleRoute({
          buyExchange,
          sellExchange,
          isSingleExchange,
          officialSellPrice,
          initialAmount,
          buyData,
          buyUsdRate,
          sellData,
          sellBid,
          userFees
        });

        if (route && route.profitPercent >= -5) {
          routes.push(route);
        }
      });
    });

    // Ordenar y devolver top 20
    routes.sort((a, b) => b.profitPercent - a.profitPercent);
    return routes.slice(0, 20);
  }

  _calculateSingleRoute(params) {
    const {
      buyExchange, sellExchange, isSingleExchange,
      officialSellPrice, initialAmount, buyUsdRate,
      sellBid, userFees
    } = params;

    // PASO 1: Comprar USD oficial + comisión bancaria
    const bankFeeMultiplier = 1 - (userFees.bankCommissionFee / 100);
    const initialAfterBankFee = initialAmount * bankFeeMultiplier;
    const usdPurchased = initialAfterBankFee / officialSellPrice;

    // PASO 2: Comprar USDT
    const usdToUsdtRate = parseFloat(buyUsdRate.totalAsk) || parseFloat(buyUsdRate.ask) || 1.05;
    if (!usdToUsdtRate || usdToUsdtRate <= 0) return null;

    const usdtPurchased = usdPurchased / usdToUsdtRate;

    // Aplicar fee de compra
    const buyFees = this.EXCHANGE_FEES[buyExchange.toLowerCase()] || this.EXCHANGE_FEES['default'];
    const totalBuyFee = buyFees.trading + userFees.extraTradingFee;
    const usdtAfterBuyFee = usdtPurchased * (1 - totalBuyFee / 100);

    // PASO 3: Transferir USDT
    const transferFeeUSD = isSingleExchange ? 0 : this.TRANSFER_FEES['TRC20'];
    const transferFeeUSDT = transferFeeUSD / usdToUsdtRate;
    const usdtAfterTransfer = usdtAfterBuyFee - transferFeeUSDT;

    if (usdtAfterTransfer <= 0) return null;

    // PASO 4: Vender USDT por ARS
    const arsFromSale = usdtAfterTransfer * sellBid;

    // Aplicar fees de venta
    const sellFees = this.EXCHANGE_FEES[sellExchange.toLowerCase()] || this.EXCHANGE_FEES['default'];
    const totalSellFee = sellFees.trading + userFees.extraTradingFee;
    const arsAfterSellFee = arsFromSale * (1 - totalSellFee / 100);

    // Aplicar fee de retiro
    const totalWithdrawalFee = sellFees.withdrawal + userFees.extraWithdrawalFee;
    const finalAmount = arsAfterSellFee * (1 - totalWithdrawalFee / 100);

    // Calcular ganancia
    const netProfit = finalAmount - initialAmount;
    const netProfitPercent = (netProfit / initialAmount) * 100;

    return {
      buyExchange: buyExchange.replace(/[<>"']/g, ''),
      sellExchange: sellExchange.replace(/[<>"']/g, ''),
      profitPercent: netProfitPercent,
      officialPrice: officialSellPrice,
      usdToUsdtRate: usdToUsdtRate,
      usdtArsBid: sellBid,
      transferFeeUSD: transferFeeUSD,
      transferFeeUSDT: transferFeeUSDT,
      isSingleExchange: isSingleExchange,
      network: isSingleExchange ? 'N/A' : 'TRC20',
      calculation: {
        initial: initialAmount,
        usdPurchased: usdPurchased,
        usdtPurchased: usdtPurchased,
        usdtAfterBuyFee: usdtAfterBuyFee,
        usdtAfterTransfer: usdtAfterTransfer,
        arsFromSale: arsFromSale,
        finalAmount: finalAmount,
        netProfit: netProfit
      },
      fees: {
        buy: buyFees.trading,
        sell: sellFees.trading,
        transfer: transferFeeUSD,
        withdrawal: sellFees.withdrawal,
        total: buyFees.trading * 2 + sellFees.trading * 2 + sellFees.withdrawal
      }
    };
  }

  async _loadUserFees() {
    try {
      const settings = await this.storageManager.getSettings();
      return {
        extraTradingFee: settings.extraTradingFee || 0,
        extraWithdrawalFee: settings.extraWithdrawalFee || 0,
        extraTransferFee: settings.extraTransferFee || 0,
        bankCommissionFee: settings.bankCommissionFee || 0
      };
    } catch (error) {
      console.warn('Error cargando fees personalizados:', error);
      return {
        extraTradingFee: 0,
        extraWithdrawalFee: 0,
        extraTransferFee: 0,
        bankCommissionFee: 0
      };
    }
  }
}

// Exportar clase
// Exportar clase
export default ArbitrageCalculator;