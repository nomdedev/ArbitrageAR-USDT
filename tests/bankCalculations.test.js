/**
 * Tests para bankCalculations
 *
 * Estas funciones determinan el precio del dólar que se usa en TODOS
 * los cálculos de arbitraje. Un error aquí afecta a toda la app.
 * Es el módulo más crítico junto a arbitrageCalculator.
 *
 * Importación directa del módulo ES6 (transformado por babel-jest).
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
  bna:       { ask: 1050.0, bid: 980.0 },
  galicia:   { ask: 1060.0, bid: 990.0 },
  santander: { ask: 1040.0, bid: 970.0 },
  bbva:      { ask: 1070.0, bid: 1000.0 },
  icbc:      { ask: 1080.0, bid: 1010.0 },
};

// Dataset mínimo para tests de casos borde
const SINGLE_BANK_DATA = {
  bna: { ask: 1050.0, bid: 980.0 }
};

describe('bankCalculations', () => {

  // ============================================================
  // calculateBankConsensus
  // ============================================================
  describe('calculateBankConsensus', () => {
    it('retorna object con price, method, banksCount, source', () => {
      const result = calculateBankConsensus(BANK_DATA);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('method', 'consenso');
      expect(result).toHaveProperty('banksCount');
      expect(result).toHaveProperty('source', 'criptoya_banks');
    });

    it('calcula la mediana correctamente con número impar de bancos (5)', () => {
      // Precios ordenados: [1040, 1050, 1060, 1070, 1080]
      // Mediana (índice 2) = 1060
      const result = calculateBankConsensus(BANK_DATA);
      expect(result.price).toBe(1060.0);
    });

    it('calcula la mediana correctamente con número par de bancos (4)', () => {
      // Con 4 bancos: [1040, 1050, 1060, 1070] → (1050+1060)/2 = 1055
      const fourBanks = {
        santander: { ask: 1040 },
        bna:       { ask: 1050 },
        galicia:   { ask: 1060 },
        bbva:      { ask: 1070 }
      };
      const result = calculateBankConsensus(fourBanks);
      expect(result.price).toBe(1055.0);
    });

    it('banksCount refleja el número de bancos con datos válidos', () => {
      const result = calculateBankConsensus(BANK_DATA);
      expect(result.banksCount).toBe(5);
    });

    it('filtra correctamente los bancos seleccionados', () => {
      // Solo usar bna y galicia
      const result = calculateBankConsensus(BANK_DATA, ['bna', 'galicia']);
      // Precios: [1050, 1060] → (1050+1060)/2 = 1055
      expect(result.price).toBe(1055.0);
      expect(result.banksCount).toBe(2);
    });

    it('ignora bancos en selectedBanks que no existen en bankData', () => {
      const result = calculateBankConsensus(BANK_DATA, ['bna', 'banco_inexistente']);
      expect(result.banksCount).toBe(1);
      expect(result.price).toBe(1050.0);
    });

    it('retorna null cuando todos los bancos filtrados quedan vacíos', () => {
      const result = calculateBankConsensus(BANK_DATA, ['banco_inexistente']);
      expect(result).toBeNull();
    });

    it('retorna null cuando bankData está vacío', () => {
      expect(calculateBankConsensus({})).toBeNull();
    });

    it('ignora bancos con ask inválido (null, 0, string)', () => {
      const dataConInvalidos = {
        bna:   { ask: 1050 },
        malo1: { ask: null },
        malo2: { ask: 0 },
        malo3: { ask: 'NaN' },
        malo4: null,
      };
      const result = calculateBankConsensus(dataConInvalidos);
      expect(result.banksCount).toBe(1);
      expect(result.price).toBe(1050.0);
    });
  });

  // ============================================================
  // calculateBankAverage
  // ============================================================
  describe('calculateBankAverage', () => {
    it('retorna method="promedio"', () => {
      expect(calculateBankAverage(BANK_DATA).method).toBe('promedio');
    });

    it('calcula el promedio simple correcto', () => {
      // (1050 + 1060 + 1040 + 1070 + 1080) / 5 = 5300/5 = 1060
      const result = calculateBankAverage(BANK_DATA);
      expect(result.price).toBe(1060.0);
    });

    it('promedio con 2 bancos', () => {
      const data = { a: { ask: 1000 }, b: { ask: 1100 } };
      expect(calculateBankAverage(data).price).toBe(1050.0);
    });

    it('filtra bancos seleccionados correctamente', () => {
      const result = calculateBankAverage(BANK_DATA, ['bna', 'galicia']);
      // (1050 + 1060) / 2 = 1055
      expect(result.price).toBe(1055.0);
    });

    it('retorna null si bankData está vacío', () => {
      expect(calculateBankAverage({})).toBeNull();
    });
  });

  // ============================================================
  // calculateBestBuy
  // ============================================================
  describe('calculateBestBuy', () => {
    it('retorna el precio ASK más bajo (mejor para comprar dólar)', () => {
      // Precio más bajo = santander con $1040
      const result = calculateBestBuy(BANK_DATA);
      expect(result.price).toBe(1040.0);
    });

    it('retorna method="mejor-compra"', () => {
      expect(calculateBestBuy(BANK_DATA).method).toBe('mejor-compra');
    });

    it('filtra bancos seleccionados', () => {
      // Entre bna(1050) y bbva(1070), el más barato es bna
      const result = calculateBestBuy(BANK_DATA, ['bna', 'bbva']);
      expect(result.price).toBe(1050.0);
    });

    it('retorna null para bankData vacío', () => {
      expect(calculateBestBuy({})).toBeNull();
    });
  });

  // ============================================================
  // calculateBestSell
  // ============================================================
  describe('calculateBestSell', () => {
    it('retorna el precio ASK más alto (mejor para vender)', () => {
      // Precio más alto = icbc con $1080
      const result = calculateBestSell(BANK_DATA);
      expect(result.price).toBe(1080.0);
    });

    it('retorna method="mejor-venta"', () => {
      expect(calculateBestSell(BANK_DATA).method).toBe('mejor-venta');
    });

    it('filtra bancos seleccionados', () => {
      // Entre bna(1050) y galicia(1060), el más caro es galicia
      const result = calculateBestSell(BANK_DATA, ['bna', 'galicia']);
      expect(result.price).toBe(1060.0);
    });

    it('retorna null para bankData vacío', () => {
      expect(calculateBestSell({})).toBeNull();
    });
  });

  // ============================================================
  // calculateSingleBank
  // ============================================================
  describe('calculateSingleBank', () => {
    it('retorna datos del banco específico', () => {
      const result = calculateSingleBank(BANK_DATA, 'bna');
      expect(result.price).toBe(1050.0);
      expect(result.method).toBe('solo-bna');
      expect(result.banksCount).toBe(1);
    });

    it('retorna null cuando el banco no existe', () => {
      expect(calculateSingleBank(BANK_DATA, 'banco_inexistente')).toBeNull();
    });

    it('retorna null cuando el ask del banco es 0 o inválido', () => {
      const data = { malo: { ask: 0 }, nulo: null };
      expect(calculateSingleBank(data, 'malo')).toBeNull();
      expect(calculateSingleBank(data, 'nulo')).toBeNull();
    });
  });

  // ============================================================
  // calculateDollarPrice (delegador central)
  // ============================================================
  describe('calculateDollarPrice', () => {
    it('delega a calculateBankConsensus para method="consenso"', () => {
      const result = calculateDollarPrice(BANK_DATA, 'consenso');
      expect(result.method).toBe('consenso');
    });

    it('delega a calculateBankAverage para method="promedio"', () => {
      const result = calculateDollarPrice(BANK_DATA, 'promedio');
      expect(result.method).toBe('promedio');
    });

    it('delega a calculateBestBuy para method="mejor-compra"', () => {
      const result = calculateDollarPrice(BANK_DATA, 'mejor-compra');
      expect(result.method).toBe('mejor-compra');
    });

    it('delega a calculateBestSell para method="mejor-venta"', () => {
      const result = calculateDollarPrice(BANK_DATA, 'mejor-venta');
      expect(result.method).toBe('mejor-venta');
    });

    it('delega a calculateSingleBank para código de banco', () => {
      const result = calculateDollarPrice(BANK_DATA, 'bna');
      expect(result.price).toBe(1050.0);
      expect(result.method).toBe('solo-bna');
    });

    it('retorna null para method vacío o null', () => {
      expect(calculateDollarPrice(BANK_DATA, null)).toBeNull();
      expect(calculateDollarPrice(BANK_DATA, '')).toBeNull();
    });
  });

  // ============================================================
  // getBankCode
  // ============================================================
  describe('getBankCode', () => {
    it('convierte "Banco Nación" a "bna"', () => {
      expect(getBankCode('Banco Nación')).toBe('bna');
    });

    it('convierte "BBVA Banco Francés" a "bbva"', () => {
      expect(getBankCode('BBVA Banco Francés')).toBe('bbva');
    });

    it('convierte "Banco Galicia" a "galicia"', () => {
      expect(getBankCode('Banco Galicia')).toBe('galicia');
    });

    it('para nombres no mapeados, convierte a lowercase sin caracteres especiales', () => {
      const code = getBankCode('Banco Nuevo');
      expect(code).toBe('banconuevo');
    });
  });

  // ============================================================
  // normalizeBankName
  // ============================================================
  describe('normalizeBankName', () => {
    it('convierte "bna" a "Banco Nación"', () => {
      expect(normalizeBankName('bna')).toBe('Banco Nación');
    });

    it('convierte "galicia" a "Banco Galicia"', () => {
      expect(normalizeBankName('galicia')).toBe('Banco Galicia');
    });

    it('capitaliza nombres desconocidos', () => {
      expect(normalizeBankName('mibanco')).toBe('Mibanco');
    });

    it('round-trip: getBankCode → normalizeBankName produce nombre legible', () => {
      // Para bancos con nombre completo, el round-trip debe dar un nombre legible
      const cases = [
        { input: 'Banco Galicia',   expectCode: 'galicia',   expectName: 'Banco Galicia'  },
        { input: 'Banco Nación',    expectCode: 'bna',       expectName: 'Banco Nación'   },
        { input: 'Banco Santander', expectCode: 'santander', expectName: 'Banco Santander' },
      ];
      cases.forEach(({ input, expectCode, expectName }) => {
        const code = getBankCode(input);
        expect(code).toBe(expectCode);
        const name = normalizeBankName(code);
        expect(name).toBe(expectName);
      });
    });
  });

  // ============================================================
  // DEFAULT_BANKS y BANK_CODE_MAPPING (constantes)
  // ============================================================
  describe('Constantes exportadas', () => {
    it('DEFAULT_BANKS contiene al menos los 5 bancos principales', () => {
      expect(DEFAULT_BANKS).toContain('bna');
      expect(DEFAULT_BANKS).toContain('galicia');
      expect(DEFAULT_BANKS).toContain('santander');
      expect(DEFAULT_BANKS).toContain('bbva');
      expect(DEFAULT_BANKS).toContain('icbc');
    });

    it('BANK_CODE_MAPPING tiene entradas para Banco Nación', () => {
      expect(BANK_CODE_MAPPING['Banco Nación']).toBe('bna');
    });

    it('BANK_CODE_MAPPING no está vacío', () => {
      expect(Object.keys(BANK_CODE_MAPPING).length).toBeGreaterThan(5);
    });
  });
});
