// ============================================
// UTILIDADES DE CÁLCULO BANCARIO
// Funciones centralizadas para cálculo de precios bancarios
// ============================================

/**
 * Calcula el precio del dólar usando método de consenso bancario
 * @param {Object} bankData - Datos bancarios con precios
 * @param {Array} selectedBanks - Array de códigos de bancos seleccionados (opcional)
 * @returns {Object|null} Resultado del cálculo o null si no hay datos
 */
export function calculateBankConsensus(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  // Extraer precios de venta (ask/compra) de bancos válidos
  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
    .map(bank => bank.ask)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  // Calcular mediana (más robusta que promedio)
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

  return {
    price: Math.round(median * 100) / 100, // Redondear a 2 decimales
    method: 'consenso',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

/**
 * Calcula el precio del dólar usando promedio simple
 * @param {Object} bankData - Datos bancarios con precios
 * @param {Array} selectedBanks - Array de códigos de bancos seleccionados (opcional)
 * @returns {Object|null} Resultado del cálculo o null si no hay datos
 */
export function calculateBankAverage(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
    .map(bank => bank.ask);

  if (prices.length === 0) return null;

  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return {
    price: Math.round(average * 100) / 100,
    method: 'promedio',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

/**
 * Calcula el mejor precio de compra (más bajo)
 * @param {Object} bankData - Datos bancarios con precios
 * @param {Array} selectedBanks - Array de códigos de bancos seleccionados (opcional)
 * @returns {Object|null} Resultado del cálculo o null si no hay datos
 */
export function calculateBestBuy(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
    .map(bank => bank.ask);

  if (prices.length === 0) return null;

  const bestPrice = Math.min(...prices);

  return {
    price: Math.round(bestPrice * 100) / 100,
    method: 'mejor-compra',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

/**
 * Calcula el mejor precio de venta (más alto)
 * @param {Object} bankData - Datos bancarios con precios
 * @param {Array} selectedBanks - Array de códigos de bancos seleccionados (opcional)
 * @returns {Object|null} Resultado del cálculo o null si no hay datos
 */
export function calculateBestSell(bankData, selectedBanks = null) {
  // Filtrar bancos seleccionados si se especifican
  let filteredBanks = bankData;
  if (selectedBanks && Array.isArray(selectedBanks) && selectedBanks.length > 0) {
    filteredBanks = {};
    selectedBanks.forEach(bankName => {
      if (bankData[bankName]) {
        filteredBanks[bankName] = bankData[bankName];
      }
    });
  }

  const prices = Object.values(filteredBanks)
    .filter(bank => bank && typeof bank.ask === 'number' && bank.ask > 0)
    .map(bank => bank.ask);

  if (prices.length === 0) return null;

  const bestPrice = Math.max(...prices);

  return {
    price: Math.round(bestPrice * 100) / 100,
    method: 'mejor-venta',
    banksCount: prices.length,
    source: 'criptoya_banks'
  };
}

/**
 * Obtiene el precio de un banco específico
 * @param {Object} bankData - Datos bancarios con precios
 * @param {string} bankCode - Código del banco
 * @returns {Object|null} Resultado del cálculo o null si no hay datos
 */
export function calculateSingleBank(bankData, bankCode) {
  const bank = bankData[bankCode];
  if (!bank || typeof bank.ask !== 'number' || bank.ask <= 0) {
    return null;
  }

  return {
    price: Math.round(bank.ask * 100) / 100,
    method: `solo-${bankCode}`,
    banksCount: 1,
    source: 'criptoya_banks'
  };
}

/**
 * Calcula precio del dólar usando el método especificado
 * @param {Object} bankData - Datos bancarios con precios
 * @param {string} method - Método de cálculo ('consenso', 'promedio', 'mejor-compra', 'mejor-venta', o código de banco)
 * @param {Array} selectedBanks - Array de códigos de bancos seleccionados
 * @returns {Object|null} Resultado del cálculo o null si no hay datos
 */
export function calculateDollarPrice(bankData, method, selectedBanks = null) {
  switch (method) {
    case 'consenso':
      return calculateBankConsensus(bankData, selectedBanks);
    case 'promedio':
      return calculateBankAverage(bankData, selectedBanks);
    case 'mejor-compra':
      return calculateBestBuy(bankData, selectedBanks);
    case 'mejor-venta':
      return calculateBestSell(bankData, selectedBanks);
    default:
      // Verificar si es un código de banco específico
      if (typeof method === 'string' && method.length > 0) {
        return calculateSingleBank(bankData, method);
      }
      return null;
  }
}

/**
 * Bancos principales por defecto
 */
export const DEFAULT_BANKS = ['bna', 'galicia', 'santander', 'bbva', 'icbc'];

/**
 * Mapeo de nombres completos a códigos de banco
 */
export const BANK_CODE_MAPPING = {
  'Banco Nación': 'bna',
  'BBVA Banco Francés': 'bbva',
  BBVA: 'bbva',
  'Banco Piano': 'piano',
  'Banco Hipotecario': 'hipotecario',
  'Banco Galicia': 'galicia',
  'Banco Santander Río': 'santander',
  'Banco Santander': 'santander',
  'Banco Ciudad': 'ciudad',
  'Banco Supervielle': 'supervielle',
  'Banco Patagonia': 'patagonia',
  'Banco Comafi': 'comafi',
  ICBC: 'icbc',
  Bind: 'bind',
  Bancor: 'bancor',
  'Nuevo Banco del Chaco': 'chaco',
  'Banco Chaco': 'chaco',
  'Banco de la Pampa': 'pampa',
  'Banco Pampa': 'pampa',
  'Banco Provincia': 'provincia',
  'Banco de la Provincia de Buenos Aires': 'provincia',
  'Banco Columbia': 'columbia',
  'Banco Macro': 'macro'
};

/**
 * Convierte nombre completo de banco a código
 * @param {string} fullName - Nombre completo del banco
 * @returns {string} Código del banco
 */
export function getBankCode(fullName) {
  return BANK_CODE_MAPPING[fullName] || fullName.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Normaliza nombres de bancos de CriptoYa
 * @param {string} code - Código del banco
 * @returns {string} Nombre normalizado del banco
 */
export function normalizeBankName(code) {
  const bankNames = {
    bna: 'Banco Nación',
    bbva: 'BBVA',
    piano: 'Banco Piano',
    hipotecario: 'Banco Hipotecario',
    galicia: 'Banco Galicia',
    santander: 'Banco Santander',
    ciudad: 'Banco Ciudad',
    supervielle: 'Banco Supervielle',
    patagonia: 'Banco Patagonia',
    comafi: 'Banco Comafi',
    icbc: 'ICBC',
    bind: 'Bind',
    bancor: 'Bancor',
    chaco: 'Banco Chaco',
    pampa: 'Banco Pampa',
    provincia: 'Banco Provincia',
    columbia: 'Banco Columbia'
  };

  return bankNames[code] || code.charAt(0).toUpperCase() + code.slice(1);
}
