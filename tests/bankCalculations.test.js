/**
 * Tests para bankCalculations
 *
 * Estas funciones determinan el precio del dolar que se usa en TODOS
 * los calculos de arbitraje. Un error aqui afecta a toda la app.
 * Es el modulo mas critico junto a arbitrageCalculator.
 *
 * Tests consolidados: 12 tests para cobertura completa de:
 * - calculateBankConsensus
 * - calculateBankAverage
 * - calculateBestBuy / calculateBestSell
 * - calculateSingleBank / calculateDollarPrice
 * - getBankCode / normalizeBankName
 */

const {
  calculateBankConsensus,
  calculateBankAverage,
  calculateBestBuy,
  calculateBestSell,
  calculateSingleBank,
  calculateDollarPrice,
  getBankCode,
  normalizeBankName,
  DEFAULT_BANKS,
  BANK_CODE_MAPPING
} = require('../src/utils/bankCalculations.js');

// ────────────────────────────────────────────────────
// Dataset de prueba representativo (estructura real de CriptoYa)
// ────────────────────────────────────────────────────
const BANK_DATA = {
  bna:       { ask: 1050, bid: 980 },
  galicia:   { ask: 1060, bid: 990 },
  santander: { ask: 1040, bid: 970 },
  bbva:      { ask: 1070, bid: 1000 },
  icbc:      { ask: 1080, bid: 1010 },
};

describe('bankCalculations', () => {

  // ============================================================
  // calculateBankConsensus (3 tests)
  // ============================================================
  describe('calculateBankConsensus', () => {
    it('calcula mediana correctamente con datos validos', () => {
      // 5 bancos: [1040, 1050, 1060, 1070, 1080] -> mediana = 1060
      const result = calculateBankConsensus(BANK_DATA);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('price', 1060);
      expect(result).toHaveProperty('method', 'consenso');
      expect(result).toHaveProperty('banksCount', 5);
      expect(result).toHaveProperty('source', 'criptoya_banks');
    });

    it('filtra bancos seleccionados e ignora invalidos', () => {
      // Filtrar solo bna y galicia: [1050, 1060] -> mediana = 1055
      const resultFiltered = calculateBankConsensus(BANK_DATA, ['bna', 'galicia']);
      expect(resultFiltered.price).toBe(1055);
      expect(resultFiltered.banksCount).toBe(2);

      // Ignorar bancos con ask invalido
      const dataConInvalidos = {
        bna:   { ask: 1050 },
        malo1: { ask: null },
        malo2: { ask: 0 },
        malo3: { ask: 'NaN' },
        malo4: null,
      };
      const resultInvalidos = calculateBankConsensus(dataConInvalidos);
      expect(resultInvalidos.banksCount).toBe(1);
      expect(resultInvalidos.price).toBe(1050);
    });

    it('retorna null para datos vacios o bancos inexistentes', () => {
      expect(calculateBankConsensus({})).toBeNull();
      expect(calculateBankConsensus(BANK_DATA, ['banco_inexistente'])).toBeNull();
    });
  });

  // ============================================================
  // calculateBankAverage (3 tests)
  // ============================================================
  describe('calculateBankAverage', () => {
    it('calcula promedio correctamente con datos validos', () => {
      // (1050 + 1060 + 1040 + 1070 + 1080) / 5 = 1060
      const result = calculateBankAverage(BANK_DATA);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('price', 1060);
      expect(result).toHaveProperty('method', 'promedio');
      expect(result).toHaveProperty('banksCount', 5);
    });

    it('filtra bancos seleccionados correctamente', () => {
      // Solo bna y galicia: (1050 + 1060) / 2 = 1055
      const result = calculateBankAverage(BANK_DATA, ['bna', 'galicia']);
      expect(result.price).toBe(1055);
      expect(result.banksCount).toBe(2);
    });

    it('retorna null para datos vacios', () => {
      expect(calculateBankAverage({})).toBeNull();
    });
  });

  // ============================================================
  // calculateBestBuy y calculateBestSell (2 tests)
  // ============================================================
  describe('calculateBestBuy y calculateBestSell', () => {
    it('retorna el mejor precio de compra (mas bajo) y venta (mas alto)', () => {
      const buyResult = calculateBestBuy(BANK_DATA);
      const sellResult = calculateBestSell(BANK_DATA);

      expect(buyResult.price).toBe(1040); // santander es el mas barato
      expect(buyResult.method).toBe('mejor-compra');

      expect(sellResult.price).toBe(1080); // icbc es el mas caro
      expect(sellResult.method).toBe('mejor-venta');
    });

    it('filtra bancos seleccionados y retorna null para datos vacios', () => {
      // BestBuy filtrado
      const buyFiltered = calculateBestBuy(BANK_DATA, ['bna', 'bbva']);
      expect(buyFiltered.price).toBe(1050); // bna mas barato entre los dos

      // BestSell filtrado
      const sellFiltered = calculateBestSell(BANK_DATA, ['bna', 'galicia']);
      expect(sellFiltered.price).toBe(1060); // galicia mas caro entre los dos

      // Datos vacios
      expect(calculateBestBuy({})).toBeNull();
      expect(calculateBestSell({})).toBeNull();
    });
  });

  // ============================================================
  // calculateSingleBank y calculateDollarPrice (2 tests)
  // ============================================================
  describe('calculateSingleBank y calculateDollarPrice', () => {
    it('calculateSingleBank retorna datos del banco especifico', () => {
      const result = calculateSingleBank(BANK_DATA, 'bna');
      expect(result.price).toBe(1050);
      expect(result.method).toBe('solo-bna');
      expect(result.banksCount).toBe(1);
    });

    it('calculateDollarPrice delega correctamente segun metodo', () => {
      // Delegacion a consenso
      expect(calculateDollarPrice(BANK_DATA, 'consenso').method).toBe('consenso');

      // Delegacion a promedio
      expect(calculateDollarPrice(BANK_DATA, 'promedio').method).toBe('promedio');

      // Delegacion a mejor-compra
      expect(calculateDollarPrice(BANK_DATA, 'mejor-compra').method).toBe('mejor-compra');

      // Delegacion a mejor-venta
      expect(calculateDollarPrice(BANK_DATA, 'mejor-venta').method).toBe('mejor-venta');

      // Delegacion a banco especifico
      const singleResult = calculateDollarPrice(BANK_DATA, 'bna');
      expect(singleResult.price).toBe(1050);
      expect(singleResult.method).toBe('solo-bna');

      // Casos invalidos
      expect(calculateDollarPrice(BANK_DATA, null)).toBeNull();
      expect(calculateDollarPrice(BANK_DATA, '')).toBeNull();
      expect(calculateSingleBank(BANK_DATA, 'banco_inexistente')).toBeNull();
    });
  });

  // ============================================================
  // Utilidades: getBankCode y normalizeBankName (2 tests)
  // ============================================================
  describe('Utilidades', () => {
    it('getBankCode convierte nombres completos a codigos', () => {
      expect(getBankCode('Banco Nación')).toBe('bna');
      expect(getBankCode('BBVA Banco Francés')).toBe('bbva');
      expect(getBankCode('BBVA')).toBe('bbva');
      expect(getBankCode('Banco Galicia')).toBe('galicia');
      expect(getBankCode('Banco Nuevo')).toBe('banconuevo'); // no mapeado
    });

    it('normalizeBankName convierte codigos a nombres legibles y round-trip funciona', () => {
      expect(normalizeBankName('bna')).toBe('Banco Nación');
      expect(normalizeBankName('galicia')).toBe('Banco Galicia');
      expect(normalizeBankName('mibanco')).toBe('Mibanco'); // no mapeado

      // Verificar constantes exportadas
      expect(DEFAULT_BANKS).toContain('bna');
      expect(DEFAULT_BANKS).toContain('galicia');
      expect(Object.keys(BANK_CODE_MAPPING).length).toBeGreaterThan(5);

      // Round-trip: getBankCode -> normalizeBankName
      const cases = [
        { input: 'Banco Galicia', expectCode: 'galicia', expectName: 'Banco Galicia' },
        { input: 'Banco Nación', expectCode: 'bna', expectName: 'Banco Nación' },
      ];
      cases.forEach(({ input, expectCode, expectName }) => {
        expect(getBankCode(input)).toBe(expectCode);
        expect(normalizeBankName(expectCode)).toBe(expectName);
      });
    });
  });
});