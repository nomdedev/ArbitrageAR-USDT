/**
 * Tests for utility functions
 */

// Importar o definir las utilidades
const { getProfitClasses } = require('../src/utils.js');

describe('Utility Functions', () => {
  describe('getProfitClasses', () => {
    it('debería retornar clases para profit negativo', () => {
      const result = getProfitClasses(-5);
      
      expect(result.isNegative).toBe(true);
      expect(result.profitClass).toBe('negative-profit');
      expect(result.profitBadgeClass).toBe('negative');
    });

    it('debería retornar clases para profit alto (> 5%)', () => {
      const result = getProfitClasses(7);
      
      expect(result.isNegative).toBe(false);
      expect(result.profitClass).toBe('high-profit');
      expect(result.profitBadgeClass).toBe('high');
    });

    it('debería retornar clases vacías para profit normal (0-5%)', () => {
      const result = getProfitClasses(3);
      
      expect(result.isNegative).toBe(false);
      expect(result.profitClass).toBe('');
      expect(result.profitBadgeClass).toBe('');
    });

    it('debería manejar profit de exactamente 0', () => {
      const result = getProfitClasses(0);
      
      expect(result.isNegative).toBe(false);
      expect(result.profitClass).toBe('');
    });

    it('debería manejar profit de exactamente 5', () => {
      const result = getProfitClasses(5);
      
      expect(result.isNegative).toBe(false);
      expect(result.profitClass).toBe('');
    });

    it('debería manejar profit justo arriba de 5', () => {
      const result = getProfitClasses(5.01);
      
      expect(result.isNegative).toBe(false);
      expect(result.profitClass).toBe('high-profit');
    });
  });
});

describe('Number Formatting', () => {
  // Función de formateo local para test
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0.00';
    }
    return num.toLocaleString('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  it('debería formatear números positivos correctamente', () => {
    expect(formatNumber(1000)).toMatch(/1[.,]000[.,]00/);
    expect(formatNumber(1234567.89)).toMatch(/1[.,]234[.,]567[.,]89/);
  });

  it('debería formatear números negativos correctamente', () => {
    const result = formatNumber(-500);
    expect(result).toContain('500');
  });

  it('debería retornar "0.00" para valores inválidos', () => {
    expect(formatNumber(null)).toBe('0.00');
    expect(formatNumber(undefined)).toBe('0.00');
    expect(formatNumber(NaN)).toBe('0.00');
  });

  it('debería manejar decimales correctamente', () => {
    expect(formatNumber(100.5)).toMatch(/100[.,]50/);
    expect(formatNumber(100.123)).toMatch(/100[.,]12/);
  });
});

describe('Arbitrage Calculations', () => {
  // Función simplificada de cálculo de arbitraje
  const calculateArbitrage = (dollarBuy, usdtSell, amount) => {
    if (!dollarBuy || !usdtSell || !amount) return null;
    
    const usdAmount = amount / dollarBuy;
    const arsFromSale = usdAmount * usdtSell;
    const profit = arsFromSale - amount;
    const profitPercent = (profit / amount) * 100;
    
    return {
      usdAmount,
      arsFromSale,
      profit,
      profitPercent
    };
  };

  it('debería calcular arbitraje positivo correctamente', () => {
    const result = calculateArbitrage(1000, 1100, 100000);
    
    expect(result.usdAmount).toBe(100);
    expect(result.arsFromSale).toBe(110000);
    expect(result.profit).toBe(10000);
    expect(result.profitPercent).toBe(10);
  });

  it('debería calcular arbitraje negativo correctamente', () => {
    const result = calculateArbitrage(1100, 1000, 100000);
    
    expect(result.profit).toBeLessThan(0);
    expect(result.profitPercent).toBeLessThan(0);
  });

  it('debería retornar null para inputs inválidos', () => {
    expect(calculateArbitrage(0, 1100, 100000)).toBeNull();
    expect(calculateArbitrage(1000, 0, 100000)).toBeNull();
    expect(calculateArbitrage(1000, 1100, 0)).toBeNull();
    expect(calculateArbitrage(null, 1100, 100000)).toBeNull();
  });

  it('debería manejar decimales en precios', () => {
    const result = calculateArbitrage(1050.50, 1100.75, 100000);
    
    expect(result).not.toBeNull();
    expect(result.usdAmount).toBeCloseTo(95.19, 1);
  });
});
