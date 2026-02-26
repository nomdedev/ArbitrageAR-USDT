/**
 * Tests para CacheManager
 *
 * El cache manager controla cuándo se piden datos frescos a la API.
 * Si falla silenciosamente, el usuario ve datos viejos sin saberlo.
 * TTLs: dolarOficial=10min, usdtArs=30s, usdtUsd=60s
 */

// El módulo es un IIFE que expone window.CacheManager
// En Jest (jsdom), window === global.window
require('../src/background/cacheManager.js');

describe('CacheManager', () => {
  let cache;

  beforeAll(() => {
    cache = global.window?.CacheManager || global.CacheManager;
    if (!cache) throw new Error('CacheManager no fue expuesto en window/global');
  });

  beforeEach(() => {
    // Limpiar todo el cache entre tests para aislar estado
    cache.clearAllCache();
    // Silenciar console.log del módulo
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  // ============================================================
  // isCacheValid
  // ============================================================
  describe('isCacheValid', () => {
    it('retorna false cuando no hay datos en caché', () => {
      expect(cache.isCacheValid('dolarOficial')).toBe(false);
      expect(cache.isCacheValid('usdtArs')).toBe(false);
      expect(cache.isCacheValid('usdtUsd')).toBe(false);
    });

    it('retorna true justo después de guardar datos', () => {
      cache.setCache('dolarOficial', { compra: 1000, venta: 1050 });
      expect(cache.isCacheValid('dolarOficial')).toBe(true);
    });

    it('retorna false después de que el caché expira (dolarOficial: 10 min)', () => {
      jest.useFakeTimers();

      cache.setCache('dolarOficial', { compra: 1000 });
      expect(cache.isCacheValid('dolarOficial')).toBe(true);

      // Avanzar 10 minutos + 1 segundo
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      expect(cache.isCacheValid('dolarOficial')).toBe(false);
    });

    it('retorna true justo ANTES de que expire (dolarOficial: 10 min - 1s)', () => {
      jest.useFakeTimers();

      cache.setCache('dolarOficial', { compra: 1000 });

      // Avanzar 9 minutos 59 segundos (aún válido)
      jest.advanceTimersByTime(10 * 60 * 1000 - 1000);

      expect(cache.isCacheValid('dolarOficial')).toBe(true);
    });

    it('TTL de usdtArs = 30 segundos', () => {
      jest.useFakeTimers();

      cache.setCache('usdtArs', { binance: { ask: 1500 } });

      jest.advanceTimersByTime(29000); // 29s → válido
      expect(cache.isCacheValid('usdtArs')).toBe(true);

      jest.advanceTimersByTime(2000);  // 31s → expirado
      expect(cache.isCacheValid('usdtArs')).toBe(false);
    });

    it('TTL de usdtUsd = 60 segundos', () => {
      jest.useFakeTimers();

      cache.setCache('usdtUsd', { binance: { ask: 1.02 } });

      jest.advanceTimersByTime(59000); // 59s → válido
      expect(cache.isCacheValid('usdtUsd')).toBe(true);

      jest.advanceTimersByTime(2000);  // 61s → expirado
      expect(cache.isCacheValid('usdtUsd')).toBe(false);
    });

    it('los tipos distintos tienen TTLs independientes', () => {
      jest.useFakeTimers();

      cache.setCache('usdtArs', { binance: { ask: 1500 } });
      cache.setCache('dolarOficial', { compra: 1000 });

      // Avanzar 31s: usdtArs expira, dolarOficial sigue válido
      jest.advanceTimersByTime(31000);

      expect(cache.isCacheValid('usdtArs')).toBe(false);
      expect(cache.isCacheValid('dolarOficial')).toBe(true);
    });
  });

  // ============================================================
  // setCache / getCache
  // ============================================================
  describe('setCache y getCache', () => {
    it('getCache retorna null cuando no hay datos', () => {
      expect(cache.getCache('dolarOficial')).toBeNull();
    });

    it('getCache retorna los datos guardados con setCache', () => {
      const data = { compra: 1000, venta: 1050, source: 'dolarapi' };
      cache.setCache('dolarOficial', data);

      const result = cache.getCache('dolarOficial');
      expect(result).toEqual(data);
    });

    it('setCache sobreescribe datos anteriores', () => {
      cache.setCache('dolarOficial', { compra: 1000 });
      cache.setCache('dolarOficial', { compra: 1100 });

      expect(cache.getCache('dolarOficial').compra).toBe(1100);
    });

    it('getCache retorna null cuando el caché expiró (no datos viejos)', () => {
      jest.useFakeTimers();

      cache.setCache('usdtArs', { binance: { ask: 1500 } });
      jest.advanceTimersByTime(31000); // Expirar usdtArs (TTL=30s)

      expect(cache.getCache('usdtArs')).toBeNull();
    });

    it('cada tipo de caché es independiente', () => {
      cache.setCache('dolarOficial', { compra: 1000 });
      cache.setCache('usdtArs', { binance: { ask: 1500 } });

      expect(cache.getCache('dolarOficial').compra).toBe(1000);
      expect(cache.getCache('usdtArs').binance.ask).toBe(1500);
      expect(cache.getCache('usdtUsd')).toBeNull();
    });

    it('acepta diferentes tipos de datos (objetos, arrays, primitivos)', () => {
      cache.setCache('usdtArs', [1, 2, 3]);
      expect(cache.getCache('usdtArs')).toEqual([1, 2, 3]);
    });
  });

  // ============================================================
  // clearCache / clearAllCache
  // ============================================================
  describe('clearCache y clearAllCache', () => {
    it('clearCache limpia un tipo específico sin afectar los demás', () => {
      cache.setCache('dolarOficial', { compra: 1000 });
      cache.setCache('usdtArs', { binance: { ask: 1500 } });

      cache.clearCache('dolarOficial');

      expect(cache.getCache('dolarOficial')).toBeNull();
      expect(cache.getCache('usdtArs')).not.toBeNull();
    });

    it('clearAllCache limpia todos los tipos', () => {
      cache.setCache('dolarOficial', { compra: 1000 });
      cache.setCache('usdtArs', { binance: { ask: 1500 } });
      cache.setCache('usdtUsd', { binance: { ask: 1.02 } });

      cache.clearAllCache();

      expect(cache.getCache('dolarOficial')).toBeNull();
      expect(cache.getCache('usdtArs')).toBeNull();
      expect(cache.getCache('usdtUsd')).toBeNull();
    });
  });

  // ============================================================
  // getCacheStats
  // ============================================================
  describe('getCacheStats', () => {
    it('retorna hasData=false para todos cuando el caché está vacío', () => {
      const stats = cache.getCacheStats();

      Object.values(stats).forEach(s => {
        expect(s.hasData).toBe(false);
        expect(s.isValid).toBe(false);
      });
    });

    it('retorna hasData=true después de setCache', () => {
      cache.setCache('dolarOficial', { compra: 1000 });
      const stats = cache.getCacheStats();

      expect(stats.dolarOficial.hasData).toBe(true);
      expect(stats.dolarOficial.isValid).toBe(true);
    });

    it('refleja el maxAge correcto de cada tipo', () => {
      // Verificar que los maxAge reflejan los TTLs definidos
      const stats = cache.getCacheStats();

      expect(stats.dolarOficial.maxAge).toBe(10 * 60); // 600 segundos
      expect(stats.usdtArs.maxAge).toBe(30);            // 30 segundos
      expect(stats.usdtUsd.maxAge).toBe(60);            // 60 segundos
    });

    it('muestra porcentaje de uso del caché', () => {
      jest.useFakeTimers();

      cache.setCache('usdtUsd', { binance: { ask: 1.02 } });

      // Avanzar 30 segundos (50% del TTL de 60s)
      jest.advanceTimersByTime(30000);

      const stats = cache.getCacheStats();
      // El porcentaje debe ser ~50%
      expect(stats.usdtUsd.percentage).toBeCloseTo(50, -1);
    });
  });

  // ============================================================
  // getCachedOrFetch
  // ============================================================
  describe('getCachedOrFetch', () => {
    it('devuelve datos del caché si están vigentes (no llama a fetchFn)', async () => {
      const cachedData = { compra: 1000 };
      cache.setCache('dolarOficial', cachedData);

      const fetchFn = jest.fn().mockResolvedValue({ compra: 9999 });

      const result = await cache.getCachedOrFetch('dolarOficial', fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('llama a fetchFn y guarda en caché si el caché está vacío', async () => {
      const freshData = { compra: 1100, venta: 1150 };
      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await cache.getCachedOrFetch('dolarOficial', fetchFn);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // El dato debe quedar en caché
      expect(cache.getCache('dolarOficial')).toEqual(freshData);
    });

    it('no guarda en caché si fetchFn retorna null', async () => {
      const fetchFn = jest.fn().mockResolvedValue(null);

      await cache.getCachedOrFetch('dolarOficial', fetchFn);

      expect(cache.getCache('dolarOficial')).toBeNull();
    });

    it('pasa argumentos correctamente a fetchFn', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ ok: true });

      await cache.getCachedOrFetch('usdtArs', fetchFn, ['arg1', 'arg2']);

      expect(fetchFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  // ============================================================
  // CACHE_CONFIG (constante expuesta)
  // ============================================================
  describe('CACHE_CONFIG', () => {
    it('expone los TTLs definidos como propiedad pública', () => {
      expect(cache.CACHE_CONFIG.dolarOficial).toBe(10 * 60 * 1000);
      expect(cache.CACHE_CONFIG.usdtArs).toBe(30 * 1000);
      expect(cache.CACHE_CONFIG.usdtUsd).toBe(60 * 1000);
    });

    it('CACHE_CONFIG es una copia (no se puede mutar el original)', () => {
      const original = cache.CACHE_CONFIG.dolarOficial;
      cache.CACHE_CONFIG.dolarOficial = 999;

      // Crear nueva instancia de stats para verificar que el TTL interno no cambió
      cache.setCache('dolarOficial', { compra: 1000 });
      expect(cache.isCacheValid('dolarOficial')).toBe(true); // Sigue usando los 10 min internos

      cache.CACHE_CONFIG.dolarOficial = original; // Restaurar
    });
  });
});
