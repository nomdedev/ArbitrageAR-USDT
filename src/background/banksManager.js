// ============================================
// BANKS MANAGER MODULE - ArbitrageAR
// ============================================

import { log } from './config.js';

// Configuración de bancos disponibles
const BANKS_CONFIG = {
  'Banco Nación': {
    name: 'Banco Nación',
    shortName: 'BN',
    color: '#1e40af',
    icon: '🏛️',
    enabled: true,
    fee: 0.006, // 0.6%
    minAmount: 1000,
    maxAmount: 500000
  },
  'Banco Provincia': {
    name: 'Banco Provincia',
    shortName: 'BP',
    color: '#dc2626',
    icon: '🏦',
    enabled: true,
    fee: 0.008, // 0.8%
    minAmount: 500,
    maxAmount: 300000
  },
  'Banco Ciudad': {
    name: 'Banco Ciudad',
    shortName: 'BC',
    color: '#059669',
    icon: '🏪',
    enabled: true,
    fee: 0.005, // 0.5%
    minAmount: 2000,
    maxAmount: 1000000
  },
  'Mercado Pago': {
    name: 'Mercado Pago',
    shortName: 'MP',
    color: '#fbbf24',
    icon: '📱',
    enabled: true,
    fee: 0.012, // 1.2%
    minAmount: 100,
    maxAmount: 100000
  },
  'Brubank': {
    name: 'Brubank',
    shortName: 'BR',
    color: '#7c3aed',
    icon: '💜',
    enabled: true,
    fee: 0.004, // 0.4%
    minAmount: 500,
    maxAmount: 200000
  }
};

// Estado de bancos
let banksData = {};
let lastBanksUpdate = null;

// Función para obtener configuración de bancos
function getBanksConfig() {
  return Object.values(BANKS_CONFIG).filter(bank => bank.enabled);
}

// Función para validar montos por banco
function validateBankAmount(bankName, amount) {
  const bank = BANKS_CONFIG[bankName];
  if (!bank) {
    return { valid: false, error: 'Banco no encontrado' };
  }

  if (amount < bank.minAmount) {
    return {
      valid: false,
      error: `Monto mínimo: $${bank.minAmount.toLocaleString()}`
    };
  }

  if (amount > bank.maxAmount) {
    return {
      valid: false,
      error: `Monto máximo: $${bank.maxAmount.toLocaleString()}`
    };
  }

  return { valid: true };
}

// Función para calcular fee de banco
function calculateBankFee(bankName, amount) {
  const bank = BANKS_CONFIG[bankName];
  if (!bank) return 0;

  return amount * bank.fee;
}

// Función para obtener datos de bancos (simulado por ahora)
async function fetchBanksData() {
  log('🏦 Obteniendo datos de bancos...');

  try {
    // Simulación de fetching de datos de bancos
    // En una implementación real, esto haría requests a APIs de bancos
    const mockBanksData = {
      'Banco Nación': {
        buyRate: 890.50,
        sellRate: 910.25,
        volume24h: 1500000,
        lastUpdate: Date.now()
      },
      'Banco Provincia': {
        buyRate: 885.30,
        sellRate: 915.80,
        volume24h: 800000,
        lastUpdate: Date.now()
      },
      'Banco Ciudad': {
        buyRate: 892.15,
        sellRate: 907.90,
        volume24h: 600000,
        lastUpdate: Date.now()
      },
      'Mercado Pago': {
        buyRate: 895.00,
        sellRate: 905.00,
        volume24h: 2000000,
        lastUpdate: Date.now()
      },
      'Brubank': {
        buyRate: 888.75,
        sellRate: 912.50,
        volume24h: 400000,
        lastUpdate: Date.now()
      }
    };

    banksData = mockBanksData;
    lastBanksUpdate = Date.now();

    log(`✅ Datos de ${Object.keys(mockBanksData).length} bancos obtenidos`);
    return mockBanksData;

  } catch (error) {
    log('❌ Error obteniendo datos de bancos:', error);
    return null;
  }
}

// Función para obtener mejores bancos para compra/venta
function getBestBanksForOperation(operation, amount = 10000) {
  if (!banksData || Object.keys(banksData).length === 0) {
    return [];
  }

  const banks = Object.entries(banksData)
    .map(([name, data]) => ({
      ...BANKS_CONFIG[name],
      ...data,
      spread: data.sellRate - data.buyRate,
      feeAmount: calculateBankFee(name, amount)
    }))
    .filter(bank => bank.enabled);

  if (operation === 'buy') {
    // Mejor tasa de compra (más baja)
    return banks.sort((a, b) => a.buyRate - b.buyRate);
  } else if (operation === 'sell') {
    // Mejor tasa de venta (más alta)
    return banks.sort((a, b) => b.sellRate - a.sellRate);
  }

  return banks;
}

// Función para calcular costo total incluyendo fees
function calculateTotalCost(bankName, amount, operation) {
  const bank = BANKS_CONFIG[bankName];
  if (!bank) return null;

  const fee = calculateBankFee(bankName, amount);
  const bankData = banksData[bankName];

  if (!bankData) return null;

  let exchangeRate, totalCost;

  if (operation === 'buy') {
    // Comprando: costo = amount + fee
    exchangeRate = bankData.buyRate;
    totalCost = amount + fee;
  } else {
    // Vendiendo: costo = amount - fee (recibes menos)
    exchangeRate = bankData.sellRate;
    totalCost = amount - fee;
  }

  return {
    bankName,
    amount,
    fee,
    exchangeRate,
    totalCost,
    effectiveRate: totalCost / amount
  };
}

// Función para obtener estadísticas de bancos
function getBanksStats() {
  if (!banksData || Object.keys(banksData).length === 0) {
    return {
      totalBanks: 0,
      avgSpread: 0,
      bestBuyRate: null,
      bestSellRate: null,
      totalVolume: 0
    };
  }

  const banks = Object.values(banksData);
  const spreads = banks.map(b => b.sellRate - b.buyRate);
  const buyRates = banks.map(b => b.buyRate);
  const sellRates = banks.map(b => b.sellRate);
  const volumes = banks.map(b => b.volume24h);

  return {
    totalBanks: banks.length,
    avgSpread: spreads.reduce((a, b) => a + b, 0) / spreads.length,
    bestBuyRate: Math.min(...buyRates),
    bestSellRate: Math.max(...sellRates),
    totalVolume: volumes.reduce((a, b) => a + b, 0),
    lastUpdate: lastBanksUpdate
  };
}

// Función para actualizar datos de bancos periódicamente
async function updateBanksData() {
  const now = Date.now();
  const timeSinceLastUpdate = lastBanksUpdate ? now - lastBanksUpdate : Infinity;

  // Actualizar cada 5 minutos
  if (timeSinceLastUpdate > 5 * 60 * 1000) {
    await fetchBanksData();
  }
}

// Exportar funciones públicas
export {
  getBanksConfig,
  validateBankAmount,
  calculateBankFee,
  fetchBanksData,
  getBestBanksForOperation,
  calculateTotalCost,
  getBanksStats,
  updateBanksData,
  BANKS_CONFIG
};