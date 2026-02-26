/**
 * Tests para CommonUtils
 *
 * CommonUtils provee funciones puras usadas en toda la app:
 * formatting, validación, throttle/debounce, memoize, retry.
 *
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
  describe('constantes', () => {
    it('PROFIT_THRESHOLDS tiene HIGH=2, POSITIVE=0, LOW_NEGATIVE=-2', () => {
      expect(CU.PROFIT_THRESHOLDS.HIGH).toBe(2);
      expect(CU.PROFIT_THRESHOLDS.POSITIVE).toBe(0);
      expect(CU.PROFIT_THRESHOLDS.LOW_NEGATIVE).toBe(-2);
    });

    it('MAX_RETRIES es 3', () => {
      expect(CU.MAX_RETRIES).toBe(3);
    });

    it('TOAST_DURATION_MS es 3000', () => {
      expect(CU.TOAST_DURATION_MS).toBe(3000);
    });
  });

  // ============================================================
  // formatNumber
  // ============================================================
  describe('formatNumber', () => {
    it('formatea número entero con separador de miles (es-AR)', () => {
      const result = CU.formatNumber(1000);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('formatea decimales cuando se pide', () => {
      const result = CU.formatNumber(1234.5, 2);
      expect(result).toContain('1.234');
    });

    it('retorna "0" para Number.NaN', () => {
      expect(CU.formatNumber(Number.NaN)).toBe('0');
    });

    it('retorna "0" para string', () => {
      expect(CU.formatNumber('abc')).toBe('0');
    });
  });

  // ============================================================
  // formatPercent
  // ============================================================
  describe('formatPercent', () => {
    it('formatea porcentaje positivo con 2 decimales por defecto', () => {
      expect(CU.formatPercent(5)).toBe('5.00%');
    });

    it('formatea porcentaje negativo', () => {
      expect(CU.formatPercent(-3.5)).toBe('-3.50%');
    });

    it('retorna "0%" para Number.NaN', () => {
      expect(CU.formatPercent(Number.NaN)).toBe('0%');
    });

    it('acepta cantidad de decimales personalizada', () => {
      expect(CU.formatPercent(1.23456, 4)).toBe('1.2346%');
    });
  });

  // ============================================================
  // capitalizeFirst
  // ============================================================
  describe('capitalizeFirst', () => {
    it('capitaliza la primera letra', () => {
      expect(CU.capitalizeFirst('binance')).toBe('Binance');
    });

    it('no modifica el resto del string', () => {
      expect(CU.capitalizeFirst('hello WORLD')).toBe('Hello WORLD');
    });

    it('retorna "" para null', () => {
      expect(CU.capitalizeFirst(null)).toBe('');
    });

    it('retorna "" para string vacío', () => {
      expect(CU.capitalizeFirst('')).toBe('');
    });
  });

  // ============================================================
  // getProfitClasses
  // ============================================================
  describe('getProfitClasses', () => {
    it('≥ 2% → profit-high / badge-high', () => {
      const r = CU.getProfitClasses(2.5);
      expect(r.profitClass).toBe('profit-high');
      expect(r.profitBadgeClass).toBe('badge-high');
      expect(r.isNegative).toBe(false);
    });

    it('0 a 1.99% → profit-positive / badge-positive', () => {
      const r = CU.getProfitClasses(1.5);
      expect(r.profitClass).toBe('profit-positive');
      expect(r.profitBadgeClass).toBe('badge-positive');
    });

    it('-1.99% a 0 → profit-low-negative / badge-low-negative', () => {
      const r = CU.getProfitClasses(-1);
      expect(r.profitClass).toBe('profit-low-negative');
      expect(r.isNegative).toBe(true);
    });

    it('< -2% → profit-negative / badge-negative', () => {
      const r = CU.getProfitClasses(-5);
      expect(r.profitClass).toBe('profit-negative');
      expect(r.profitBadgeClass).toBe('badge-negative');
    });
  });

  // ============================================================
  // getDataFreshnessLevel
  // ============================================================
  describe('getDataFreshnessLevel', () => {
    it('retorna "stale" cuando timestamp es null/undefined', () => {
      expect(CU.getDataFreshnessLevel(null).level).toBe('stale');
      expect(CU.getDataFreshnessLevel(undefined).level).toBe('stale');
    });

    it('retorna "fresh" para timestamp de hace 1 minuto', () => {
      const ts = Date.now() - 60000;
      const result = CU.getDataFreshnessLevel(ts);
      expect(result.level).toBe('fresh');
    });

    it('retorna "moderate" para timestamp de hace 4 minutos', () => {
      const ts = Date.now() - 4 * 60000;
      const result = CU.getDataFreshnessLevel(ts);
      expect(result.level).toBe('moderate');
    });

    it('retorna "stale" para timestamp de hace 10 minutos', () => {
      const ts = Date.now() - 10 * 60000;
      const result = CU.getDataFreshnessLevel(ts);
      expect(result.level).toBe('stale');
    });

    it('incluye ageMinutes en el resultado', () => {
      const ts = Date.now() - 90000; // 1.5 minutos
      const result = CU.getDataFreshnessLevel(ts);
      expect(result.ageMinutes).toBe(1);
    });
  });

  // ============================================================
  // isValidNumber / isPositiveNumber
  // ============================================================
  describe('isValidNumber', () => {
    it('retorna true para número válido', () => {
      expect(CU.isValidNumber(42)).toBe(true);
      expect(CU.isValidNumber(-3.14)).toBe(true);
      expect(CU.isValidNumber(0)).toBe(true);
    });

    it('retorna false para Number.NaN, Infinity, string, null', () => {
      expect(CU.isValidNumber(Number.NaN)).toBe(false);
      expect(CU.isValidNumber(Infinity)).toBe(false);
      expect(CU.isValidNumber('42')).toBe(false);
      expect(CU.isValidNumber(null)).toBe(false);
      expect(CU.isValidNumber(undefined)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('retorna true solo para números positivos y finitos', () => {
      expect(CU.isPositiveNumber(1)).toBe(true);
      expect(CU.isPositiveNumber(0.001)).toBe(true);
    });

    it('retorna false para cero y negativos', () => {
      expect(CU.isPositiveNumber(0)).toBe(false);
      expect(CU.isPositiveNumber(-1)).toBe(false);
    });

    it('retorna false para Number.NaN e Infinity', () => {
      expect(CU.isPositiveNumber(Number.NaN)).toBe(false);
      expect(CU.isPositiveNumber(Infinity)).toBe(false);
    });
  });

  // ============================================================
  // hasRequiredProperties
  // ============================================================
  describe('hasRequiredProperties', () => {
    it('retorna true cuando el objeto tiene todas las propiedades', () => {
      const obj = { a: 1, b: 'x', c: true };
      expect(CU.hasRequiredProperties(obj, ['a', 'b'])).toBe(true);
    });

    it('retorna false cuando falta una propiedad', () => {
      const obj = { a: 1 };
      expect(CU.hasRequiredProperties(obj, ['a', 'b'])).toBe(false);
    });

    it('retorna false para null/undefined', () => {
      expect(CU.hasRequiredProperties(null, ['a'])).toBe(false);
      expect(CU.hasRequiredProperties(undefined, ['a'])).toBe(false);
    });

    it('retorna false si el valor de una propiedad es undefined', () => {
      const obj = { a: undefined };
      expect(CU.hasRequiredProperties(obj, ['a'])).toBe(false);
    });
  });

  // ============================================================
  // debounce
  // ============================================================
  describe('debounce', () => {
    it('no llama la función inmediatamente', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = CU.debounce(fn, 100);
      debounced();
      expect(fn).not.toHaveBeenCalled();
    });

    it('llama la función después del delay', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = CU.debounce(fn, 100);
      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancela llamadas previas si se llama múltiples veces', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = CU.debounce(fn, 100);
      debounced();
      debounced();
      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // throttle
  // ============================================================
  describe('throttle', () => {
    it('llama la función la primera vez de inmediato', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const throttled = CU.throttle(fn, 200);
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('ignora llamadas subsiguientes dentro del período', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const throttled = CU.throttle(fn, 200);
      throttled();
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('permite otra llamada después del período', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const throttled = CU.throttle(fn, 200);
      throttled();
      jest.advanceTimersByTime(200);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // memoize
  // ============================================================
  describe('memoize', () => {
    it('retorna el mismo resultado para los mismos argumentos', () => {
      const fn = jest.fn(x => x * 2);
      const memoized = CU.memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1); // solo una vez
    });

    it('llama la función para argumentos distintos', () => {
      const fn = jest.fn(x => x * 3);
      const memoized = CU.memoize(fn);

      memoized(2);
      memoized(4);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // retryAsync
  // ============================================================
  describe('retryAsync', () => {
    it('retorna el resultado si la función tiene éxito a la primera', async () => {
      const fn = jest.fn().mockResolvedValue(42);
      const result = await CU.retryAsync(fn, 3, 0);
      expect(result).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('reintenta cuando la función falla y eventualmente tiene éxito', async () => {
      let attempts = 0;
      const fn = jest.fn(() => {
        attempts++;
        if (attempts < 3) throw new Error('fallo');
        return Promise.resolve('ok');
      });
      const result = await CU.retryAsync(fn, 3, 0);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('lanza el error si se agotan los reintentos', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('siempre falla'));
      await expect(CU.retryAsync(fn, 2, 0)).rejects.toThrow('siempre falla');
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  // ============================================================
  // getMinutesAgo
  // ============================================================
  describe('getMinutesAgo', () => {
    it('retorna la diferencia en minutos correctamente', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60000;
      expect(CU.getMinutesAgo(fiveMinutesAgo)).toBe(5);
    });

    it('retorna null para timestamp falsy', () => {
      expect(CU.getMinutesAgo(null)).toBeNull();
      expect(CU.getMinutesAgo(0)).toBeNull();
    });
  });

  // ============================================================
  // formatTimestamp / formatTime
  // ============================================================
  describe('formatTimestamp / formatTime', () => {
    it('formatTimestamp retorna "N/A" para null', () => {
      expect(CU.formatTimestamp(null)).toBe('N/A');
    });

    it('formatTimestamp retorna string no vacío para timestamp válido', () => {
      const result = CU.formatTimestamp(Date.now());
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe('N/A');
    });

    it('formatTime retorna "N/A" para null', () => {
      expect(CU.formatTime(null)).toBe('N/A');
    });

    it('formatTime retorna string de hora para timestamp válido', () => {
      const result = CU.formatTime(Date.now());
      expect(typeof result).toBe('string');
      expect(result).not.toBe('N/A');
    });
  });

  // ============================================================
  // sanitizeHTML (requiere jsdom)
  // ============================================================
  describe('sanitizeHTML', () => {
    it('escapa etiquetas HTML', () => {
      const result = CU.sanitizeHTML('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('retorna "" para argumentos no string', () => {
      expect(CU.sanitizeHTML(null)).toBe('');
      expect(CU.sanitizeHTML(42)).toBe('');
      expect(CU.sanitizeHTML(undefined)).toBe('');
    });

    it('texto sin HTML permanece sin cambios', () => {
      expect(CU.sanitizeHTML('hola mundo')).toBe('hola mundo');
    });
  });
});
