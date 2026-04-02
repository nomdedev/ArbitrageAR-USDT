/**
 * Tests para CommonUtils
 *
 * CommonUtils provee funciones puras usadas en toda la app:
 * formatting, validacion, throttle/debounce, memoize, retry.
 *
 * NOTA: formatNumber y formatPercent ya estan cubiertos en formatters.test.js
 * Patrón: IIFE que expone window.CommonUtils (jsdom disponible).
 */

// Cargar el módulo: ejecuta el IIFE y expone window.CommonUtils
require('../src/utils/commonUtils.js');

describe('CommonUtils', () => {
  let CU;

  beforeAll(() => {
    CU = globalThis.window?.CommonUtils || globalThis.CommonUtils;
    if (!CU) throw new Error('CommonUtils no fue expuesto en window');
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  // ============================================================
  // Constantes expuestas
  // ============================================================
  describe('PROFIT_THRESHOLDS', () => {
    it('define umbrales HIGH=2, POSITIVE=0, LOW_NEGATIVE=-2', () => {
      expect(CU.PROFIT_THRESHOLDS.HIGH).toBe(2);
      expect(CU.PROFIT_THRESHOLDS.POSITIVE).toBe(0);
      expect(CU.PROFIT_THRESHOLDS.LOW_NEGATIVE).toBe(-2);
    });
  });

  describe('constantes adicionales', () => {
    it('define MAX_RETRIES=3 y TOAST_DURATION_MS=3000', () => {
      expect(CU.MAX_RETRIES).toBe(3);
      expect(CU.TOAST_DURATION_MS).toBe(3000);
    });
  });

  // ============================================================
  // getProfitClasses - clasificacion de ganancias
  // ============================================================
  describe('getProfitClasses', () => {
    it('retorna clases correctas para los 4 niveles de ganancia', () => {
      // HIGH: >= 2%
      const high = CU.getProfitClasses(2.5);
      expect(high.profitClass).toBe('profit-high');
      expect(high.profitBadgeClass).toBe('badge-high');
      expect(high.isNegative).toBe(false);

      // POSITIVE: 0 a 1.99%
      const positive = CU.getProfitClasses(1.5);
      expect(positive.profitClass).toBe('profit-positive');
      expect(positive.profitBadgeClass).toBe('badge-positive');
      expect(positive.isNegative).toBe(false);

      // LOW_NEGATIVE: -1.99% a 0%
      const lowNegative = CU.getProfitClasses(-1);
      expect(lowNegative.profitClass).toBe('profit-low-negative');
      expect(lowNegative.isNegative).toBe(true);

      // NEGATIVE: < -2%
      const negative = CU.getProfitClasses(-5);
      expect(negative.profitClass).toBe('profit-negative');
      expect(negative.profitBadgeClass).toBe('badge-negative');
      expect(negative.isNegative).toBe(true);
    });
  });

  // ============================================================
  // getDataFreshnessLevel - frescura de datos
  // ============================================================
  describe('getDataFreshnessLevel', () => {
    it('retorna niveles correctos segun antiguedad: fresh, moderate, stale', () => {
      // Stale para null/undefined
      expect(CU.getDataFreshnessLevel(null).level).toBe('stale');
      expect(CU.getDataFreshnessLevel(undefined).level).toBe('stale');

      // Fresh: < 2 minutos
      const freshTs = Date.now() - 60000;
      expect(CU.getDataFreshnessLevel(freshTs).level).toBe('fresh');

      // Moderate: 2-5 minutos
      const moderateTs = Date.now() - 4 * 60000;
      expect(CU.getDataFreshnessLevel(moderateTs).level).toBe('moderate');

      // Stale: > 5 minutos
      const staleTs = Date.now() - 10 * 60000;
      expect(CU.getDataFreshnessLevel(staleTs).level).toBe('stale');

      // Incluye ageMinutes en el resultado
      const ts15min = Date.now() - 90000;
      expect(CU.getDataFreshnessLevel(ts15min).ageMinutes).toBe(1);
    });
  });

  // ============================================================
  // Validacion de numeros
  // ============================================================
  describe('Validacion', () => {
    it('isValidNumber e isPositiveNumber validan correctamente', () => {
      // isValidNumber: acepta numeros finitos
      expect(CU.isValidNumber(42)).toBe(true);
      expect(CU.isValidNumber(-3.14)).toBe(true);
      expect(CU.isValidNumber(0)).toBe(true);
      expect(CU.isValidNumber(Number.NaN)).toBe(false);
      expect(CU.isValidNumber(Infinity)).toBe(false);
      expect(CU.isValidNumber('42')).toBe(false);
      expect(CU.isValidNumber(null)).toBe(false);
      expect(CU.isValidNumber(undefined)).toBe(false);

      // isPositiveNumber: solo positivos
      expect(CU.isPositiveNumber(1)).toBe(true);
      expect(CU.isPositiveNumber(0.001)).toBe(true);
      expect(CU.isPositiveNumber(0)).toBe(false);
      expect(CU.isPositiveNumber(-1)).toBe(false);
      expect(CU.isPositiveNumber(Number.NaN)).toBe(false);
      expect(CU.isPositiveNumber(Infinity)).toBe(false);
    });
  });

  // ============================================================
  // capitalizeFirst y hasRequiredProperties
  // ============================================================
  describe('capitalizeFirst y hasRequiredProperties', () => {
    it('capitalizeFirst capitaliza la primera letra y maneja edge cases', () => {
      expect(CU.capitalizeFirst('binance')).toBe('Binance');
      expect(CU.capitalizeFirst('hello WORLD')).toBe('Hello WORLD');
      expect(CU.capitalizeFirst(null)).toBe('');
      expect(CU.capitalizeFirst('')).toBe('');
    });

    it('hasRequiredProperties valida existencia de propiedades', () => {
      expect(CU.hasRequiredProperties({ a: 1, b: 'x' }, ['a', 'b'])).toBe(true);
      expect(CU.hasRequiredProperties({ a: 1 }, ['a', 'b'])).toBe(false);
      expect(CU.hasRequiredProperties(null, ['a'])).toBe(false);
      expect(CU.hasRequiredProperties(undefined, ['a'])).toBe(false);
      expect(CU.hasRequiredProperties({ a: undefined }, ['a'])).toBe(false);
    });
  });

  // ============================================================
  // debounce y throttle
  // ============================================================
  describe('debounce y throttle', () => {
    it('debounce retrasa ejecucion y cancela llamadas previas', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = CU.debounce(fn, 100);

      // No llama inmediatamente
      debounced();
      expect(fn).not.toHaveBeenCalled();

      // Multiples llamadas cancelan las previas
      debounced();
      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throttle limita ejecucion a una por periodo', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const throttled = CU.throttle(fn, 200);

      // Primera llamada inmediata
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      // Ignora llamadas dentro del periodo
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      // Permite otra llamada despues del periodo
      jest.advanceTimersByTime(200);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // memoize
  // ============================================================
  describe('memoize', () => {
    it('cachea resultados para argumentos identicos', () => {
      const fn = jest.fn(x => x * 2);
      const memoized = CU.memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);

      memoized(4);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // retryAsync
  // ============================================================
  describe('retryAsync', () => {
    it('reintenta hasta exito o agotar intentos', async () => {
      // Exito inmediato
      const fn1 = jest.fn().mockResolvedValue(42);
      const result1 = await CU.retryAsync(fn1, 3, 0);
      expect(result1).toBe(42);
      expect(fn1).toHaveBeenCalledTimes(1);

      // Exito despues de reintentos
      let attempts = 0;
      const fn2 = jest.fn(() => {
        attempts++;
        if (attempts < 3) throw new Error('fallo');
        return Promise.resolve('ok');
      });
      const result2 = await CU.retryAsync(fn2, 3, 0);
      expect(result2).toBe('ok');
      expect(fn2).toHaveBeenCalledTimes(3);

      // Agota reintentos
      const fn3 = jest.fn().mockRejectedValue(new Error('siempre falla'));
      await expect(CU.retryAsync(fn3, 2, 0)).rejects.toThrow('siempre falla');
      expect(fn3).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  // ============================================================
  // Formateo de tiempo
  // ============================================================
  describe('Formateo de tiempo', () => {
    it('formatTimestamp, formatTime y getMinutesAgo formatean correctamente', () => {
      // formatTimestamp
      expect(CU.formatTimestamp(null)).toBe('N/A');
      const tsResult = CU.formatTimestamp(Date.now());
      expect(typeof tsResult).toBe('string');
      expect(tsResult.length).toBeGreaterThan(0);
      expect(tsResult).not.toBe('N/A');

      // formatTime
      expect(CU.formatTime(null)).toBe('N/A');
      const timeResult = CU.formatTime(Date.now());
      expect(typeof timeResult).toBe('string');
      expect(timeResult).not.toBe('N/A');

      // getMinutesAgo
      const fiveMinAgo = Date.now() - 5 * 60000;
      expect(CU.getMinutesAgo(fiveMinAgo)).toBe(5);
      expect(CU.getMinutesAgo(null)).toBeNull();
      expect(CU.getMinutesAgo(0)).toBeNull();
    });
  });

  // ============================================================
  // sanitizeHTML
  // ============================================================
  describe('sanitizeHTML', () => {
    it('escapa etiquetas HTML y maneja inputs invalidos', () => {
      // Escapa tags
      const escaped = CU.sanitizeHTML('<script>alert("xss")</script>');
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');

      // Texto sin HTML permanece igual
      expect(CU.sanitizeHTML('hola mundo')).toBe('hola mundo');

      // Inputs invalidos retornan string vacio
      expect(CU.sanitizeHTML(null)).toBe('');
      expect(CU.sanitizeHTML(42)).toBe('');
      expect(CU.sanitizeHTML(undefined)).toBe('');
    });
  });
});