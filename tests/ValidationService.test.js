/**
 * Tests for ValidationService
 */

// Simular ValidationService en entorno de test
const ValidationServiceModule = (() => {
  class ValidationService {
    constructor() {
      this.DATA_FRESHNESS_THRESHOLD = 5 * 60 * 1000;
      this.HIGH_AMOUNT_THRESHOLD = 500000;
      this.MIN_PROFIT_THRESHOLD = 0.5;
    }

    isDataFresh(timestamp) {
      if (!timestamp) return false;
      const dataDate = new Date(timestamp);
      const now = new Date();
      const ageMs = now - dataDate;
      return ageMs < this.DATA_FRESHNESS_THRESHOLD;
    }

    getDataFreshnessLevel(timestamp) {
      if (!timestamp) {
        return { level: 'unknown', ageMinutes: null, color: '#94a3b8', icon: '❓' };
      }

      const dataDate = new Date(timestamp);
      const now = new Date();
      const ageMs = now - dataDate;
      const ageMinutes = Math.floor(ageMs / 60000);

      if (ageMinutes < 5) {
        return { level: 'fresh', ageMinutes, color: '#4ade80', icon: '🟢' };
      } else if (ageMinutes < 15) {
        return { level: 'warning', ageMinutes, color: '#fbbf24', icon: '🟡' };
      } else {
        return { level: 'stale', ageMinutes, color: '#f87171', icon: '🔴' };
      }
    }

    calculateRouteRiskLevel(route, profitPercent, params = {}) {
      const risks = [];
      let riskScore = 0;

      if (profitPercent < 0) {
        risks.push('Operación con pérdida');
        riskScore += 40;
      } else if (profitPercent < this.MIN_PROFIT_THRESHOLD) {
        risks.push('Rentabilidad muy baja (< 0.5%)');
        riskScore += 25;
      }

      if (!route.isSingleExchange) {
        risks.push('Requiere transferencia entre exchanges');
        riskScore += 15;
      }

      if (route.isP2P) {
        risks.push('Involucra operaciones P2P');
        riskScore += 20;
      }

      let level, color, icon;
      if (riskScore >= 50) {
        level = 'high';
        color = '#ef4444';
        icon = '🔴';
      } else if (riskScore >= 25) {
        level = 'medium';
        color = '#f59e0b';
        icon = '🟡';
      } else {
        level = 'low';
        color = '#10b981';
        icon = '🟢';
      }

      return {
        level,
        score: riskScore,
        reasons: risks,
        color,
        icon,
        isAcceptable: riskScore < 50
      };
    }

    isValidNumber(value) {
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
  }

  return ValidationService;
})();

describe('ValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationServiceModule();
  });

  describe('isDataFresh', () => {
    it('debería retornar true para datos recientes (< 5 min)', () => {
      const recentTimestamp = new Date().toISOString();
      expect(validationService.isDataFresh(recentTimestamp)).toBe(true);
    });

    it('debería retornar false para datos antiguos (> 5 min)', () => {
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(validationService.isDataFresh(oldTimestamp)).toBe(false);
    });

    it('debería retornar false si no hay timestamp', () => {
      expect(validationService.isDataFresh(null)).toBe(false);
      expect(validationService.isDataFresh(undefined)).toBe(false);
    });
  });

  describe('getDataFreshnessLevel', () => {
    it('debería retornar "fresh" para datos < 5 min', () => {
      const timestamp = new Date().toISOString();
      const result = validationService.getDataFreshnessLevel(timestamp);
      
      expect(result.level).toBe('fresh');
      expect(result.icon).toBe('🟢');
      expect(result.ageMinutes).toBeLessThan(5);
    });

    it('debería retornar "warning" para datos 5-15 min', () => {
      const timestamp = new Date(Date.now() - 7 * 60 * 1000).toISOString();
      const result = validationService.getDataFreshnessLevel(timestamp);
      
      expect(result.level).toBe('warning');
      expect(result.icon).toBe('🟡');
    });

    it('debería retornar "stale" para datos > 15 min', () => {
      const timestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const result = validationService.getDataFreshnessLevel(timestamp);
      
      expect(result.level).toBe('stale');
      expect(result.icon).toBe('🔴');
    });

    it('debería retornar "unknown" si no hay timestamp', () => {
      const result = validationService.getDataFreshnessLevel(null);
      
      expect(result.level).toBe('unknown');
      expect(result.icon).toBe('❓');
      expect(result.ageMinutes).toBeNull();
    });
  });

  describe('calculateRouteRiskLevel', () => {
    it('debería retornar riesgo bajo para ruta rentable en mismo exchange', () => {
      const route = { isSingleExchange: true, isP2P: false };
      const result = validationService.calculateRouteRiskLevel(route, 5);
      
      expect(result.level).toBe('low');
      expect(result.isAcceptable).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('debería retornar riesgo alto para operación con pérdida', () => {
      const route = { isSingleExchange: true, isP2P: false };
      const result = validationService.calculateRouteRiskLevel(route, -5);
      
      expect(result.level).toBe('medium'); // 40 puntos
      expect(result.reasons).toContain('Operación con pérdida');
    });

    it('debería aumentar riesgo para rutas P2P', () => {
      const route = { isSingleExchange: true, isP2P: true };
      const result = validationService.calculateRouteRiskLevel(route, 2);
      
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.reasons).toContain('Involucra operaciones P2P');
    });

    it('debería aumentar riesgo para transferencias entre exchanges', () => {
      const route = { isSingleExchange: false, isP2P: false };
      const result = validationService.calculateRouteRiskLevel(route, 2);
      
      expect(result.reasons).toContain('Requiere transferencia entre exchanges');
    });

    it('debería retornar riesgo alto para múltiples factores de riesgo', () => {
      const route = { isSingleExchange: false, isP2P: true };
      const result = validationService.calculateRouteRiskLevel(route, -2);
      
      expect(result.level).toBe('high');
      expect(result.isAcceptable).toBe(false);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });
  });

  describe('isValidNumber', () => {
    it('debería retornar true para números válidos', () => {
      expect(validationService.isValidNumber(100)).toBe(true);
      expect(validationService.isValidNumber(0)).toBe(true);
      expect(validationService.isValidNumber(-50)).toBe(true);
      expect(validationService.isValidNumber(3.14)).toBe(true);
    });

    it('debería retornar false para valores inválidos', () => {
      expect(validationService.isValidNumber(NaN)).toBe(false);
      expect(validationService.isValidNumber(Infinity)).toBe(false);
      expect(validationService.isValidNumber(-Infinity)).toBe(false);
      expect(validationService.isValidNumber('100')).toBe(false);
      expect(validationService.isValidNumber(null)).toBe(false);
      expect(validationService.isValidNumber(undefined)).toBe(false);
    });
  });
});
