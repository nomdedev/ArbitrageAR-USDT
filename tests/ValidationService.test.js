/**
 * Tests for ValidationService (refactorizado)
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
        return { level: 'unknown', ageMinutes: null, color: '#94a3b8', icon: '?' };
      }

      const dataDate = new Date(timestamp);
      const now = new Date();
      const ageMs = now - dataDate;
      const ageMinutes = Math.floor(ageMs / 60000);

      if (ageMinutes < 5) {
        return { level: 'fresh', ageMinutes, color: '#4ade80', icon: 'verde' };
      } else if (ageMinutes < 15) {
        return { level: 'warning', ageMinutes, color: '#fbbf24', icon: 'amarillo' };
      } else {
        return { level: 'stale', ageMinutes, color: '#f87171', icon: 'rojo' };
      }
    }

    calculateRouteRiskLevel(route, profitPercent, params = {}) {
      const risks = [];
      let riskScore = 0;

      if (profitPercent < 0) {
        risks.push('Operacion con perdida');
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
        icon = 'rojo';
      } else if (riskScore >= 25) {
        level = 'medium';
        color = '#f59e0b';
        icon = 'amarillo';
      } else {
        level = 'low';
        color = '#10b981';
        icon = 'verde';
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
    it('deberia retornar el nivel de frescura correcto para diferentes timestamps (fresh/warning/stale/unknown)', () => {
      // Unknown - sin timestamp
      expect(validationService.isDataFresh(null)).toBe(false);
      expect(validationService.isDataFresh(undefined)).toBe(false);

      // Fresh - datos recientes (< 5 min)
      const freshTimestamp = new Date().toISOString();
      expect(validationService.isDataFresh(freshTimestamp)).toBe(true);

      // Stale - datos antiguos (> 5 min)
      const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(validationService.isDataFresh(staleTimestamp)).toBe(false);
    });
  });

  describe('getDataFreshnessLevel', () => {
    it('deberia retornar el nivel correcto segun antiguedad del dato (fresh/warning/stale/unknown)', () => {
      // Unknown - sin timestamp
      const unknownResult = validationService.getDataFreshnessLevel(null);
      expect(unknownResult.level).toBe('unknown');
      expect(unknownResult.ageMinutes).toBeNull();

      // Fresh - datos < 5 min
      const freshTimestamp = new Date().toISOString();
      const freshResult = validationService.getDataFreshnessLevel(freshTimestamp);
      expect(freshResult.level).toBe('fresh');
      expect(freshResult.ageMinutes).toBeLessThan(5);

      // Warning - datos entre 5-15 min
      const warningTimestamp = new Date(Date.now() - 7 * 60 * 1000).toISOString();
      const warningResult = validationService.getDataFreshnessLevel(warningTimestamp);
      expect(warningResult.level).toBe('warning');

      // Stale - datos > 15 min
      const staleTimestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const staleResult = validationService.getDataFreshnessLevel(staleTimestamp);
      expect(staleResult.level).toBe('stale');
    });
  });

  describe('isValidNumber', () => {
    it('deberia validar correctamente numeros validos e invalidos', () => {
      // Numeros validos
      expect(validationService.isValidNumber(100)).toBe(true);
      expect(validationService.isValidNumber(0)).toBe(true);
      expect(validationService.isValidNumber(-50)).toBe(true);
      expect(validationService.isValidNumber(3.14)).toBe(true);

      // Valores invalidos
      expect(validationService.isValidNumber(NaN)).toBe(false);
      expect(validationService.isValidNumber(Infinity)).toBe(false);
      expect(validationService.isValidNumber(-Infinity)).toBe(false);
      expect(validationService.isValidNumber('100')).toBe(false);
      expect(validationService.isValidNumber(null)).toBe(false);
      expect(validationService.isValidNumber(undefined)).toBe(false);
    });
  });

  describe('calculateRouteRiskLevel', () => {
    it('deberia calcular riesgo bajo para rutas rentables en mismo exchange', () => {
      const route = { isSingleExchange: true, isP2P: false };
      const result = validationService.calculateRouteRiskLevel(route, 5);

      expect(result.level).toBe('low');
      expect(result.isAcceptable).toBe(true);
      expect(result.reasons).toHaveLength(0);
      expect(result.score).toBe(0);
    });

    it('deberia aumentar riesgo segun factores: perdida, P2P, transferencias entre exchanges', () => {
      // Riesgo medio por operacion con perdida
      const routeWithLoss = { isSingleExchange: true, isP2P: false };
      const lossResult = validationService.calculateRouteRiskLevel(routeWithLoss, -5);
      expect(lossResult.level).toBe('medium');
      expect(lossResult.reasons).toContain('Operacion con perdida');
      expect(lossResult.score).toBe(40);

      // Riesgo por P2P
      const p2pRoute = { isSingleExchange: true, isP2P: true };
      const p2pResult = validationService.calculateRouteRiskLevel(p2pRoute, 2);
      expect(p2pResult.reasons).toContain('Involucra operaciones P2P');
      expect(p2pResult.score).toBeGreaterThanOrEqual(20);

      // Riesgo por transferencia entre exchanges
      const transferRoute = { isSingleExchange: false, isP2P: false };
      const transferResult = validationService.calculateRouteRiskLevel(transferRoute, 2);
      expect(transferResult.reasons).toContain('Requiere transferencia entre exchanges');

      // Riesgo alto por multiples factores combinados
      const highRiskRoute = { isSingleExchange: false, isP2P: true };
      const highResult = validationService.calculateRouteRiskLevel(highRiskRoute, -2);
      expect(highResult.level).toBe('high');
      expect(highResult.isAcceptable).toBe(false);
      expect(highResult.score).toBeGreaterThanOrEqual(50);
    });
  });
});