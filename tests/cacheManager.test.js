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
    it('retorna false cuando no hay datos en caché para cualquier tipo', () => {
      expect(cache.isCacheValid('dolarOficial')).toBe(false);
      expect(cache.isCacheValid('usdtArs')).toBe(false);
      expect(cache.isCacheValid('usdtUsd')).toBe(false);
    });

    it('retorna true mientras no haya expirado según TTL, false después', () => {
      jest.useFakeTimers();

      // dolarOficial: TTL = 10 minutos
      cache.setCache('dolarOficial', { compra: 1000 });

      // Justo después de guardar: válido
      expect(cache.isCacheValid('dolarOficial')).toBe(true);

      // Justo antes de expirar (9min 59s): aún válido
      jest.advanceTimersByTime(10 * 60 * 1000 - 1000);
      expect(cache.isCacheValid('dolarOficial')).toBe(true);

      // Después de expirar (10min + 1s): inválido
      jest.advanceTimersByTime(2000);
      expect(cache.isCacheValid('dolarOficial')).toBe(false);
    });
  });

  // ============================================================
  // setCache / getCache
  // ============================================================
  describe('setCache y getCache', () => {
    it('guarda y recupera datos correctamente (objetos, arrays, sobreescribe)', () => {
      // Guardar objeto
      const data = { compra: 1000, venta: 1050, source: 'dolarapi' };
      cache.setCache('dolarOficial', data);
      expect(cache.getCache('dolarOficial')).toEqual(data);

      // Guardar array
      cache.setCache('usdtArs', [1, 2, 3]);
      expect(cache.getCache('usdtArs')).toEqual([1, 2, 3]);

      // Sobreescribir
      cache.setCache('dolarOficial', { compra: 1100 });
      expect(cache.getCache('dolarOficial').compra).toBe(1100);

      // Tipos independientes
      cache.setCache('usdtUsd', { binance: { ask: 1.02 } });
      expect(cache.getCache('dolarOficial').compra).toBe(1100);
      expect(cache.getCache('usdtArs')).toEqual([1, 2, 3]);
      expect(cache.getCache('usdtUsd').binance.ask).toBe(1.02);
    });

    it('retorna null cuando no hay datos o el caché expiró', () => {
      // Sin datos
      expect(cache.getCache('dolarOficial')).toBeNull();

      // Datos expirados
      jest.useFakeTimers();
      cache.setCache('usdtArs', { binance: { ask: 1500 } });
      jest.advanceTimersByTime(31000); // Expirar usdtArs (TTL=30s)

      expect(cache.getCache('usdtArs')).toBeNull();
    });
  });

  // ============================================================
  // TTLs por tipo
  // ============================================================
  describe('TTLs por tipo', () => {
    it('cada tipo tiene su TTL específico independiente', () => {
      jest.useFakeTimers();

      cache.setCache('dolarOficial', { compra: 1000 });
      cache.setCache('usdtArs', { binance: { ask: 1500 } });
      cache.setCache('usdtUsd', { binance: { ask: 1.02 } });

      // Avanzar 31s: usdtArs expira, otros siguen válidos
      jest.advanceTimersByTime(31000);
      expect(cache.isCacheValid('usdtArs')).toBe(false);
      expect(cache.isCacheValid('usdtUsd')).toBe(true);
      expect(cache.isCacheValid('dolarOficial')).toBe(true);

      // Avanzar hasta 61s total: usdtUsd expira
      jest.advanceTimersByTime(30000); // 61s total
      expect(cache.isCacheValid('usdtUsd')).toBe(false);
      expect(cache.isCacheValid('dolarOficial')).toBe(true);
    });

    it('CACHE_CONFIG expone los TTLs correctamente', () => {
      expect(cache.CACHE_CONFIG.dolarOficial).toBe(10 * 60 * 1000);
      expect(cache.CACHE_CONFIG.usdtArs).toBe(30 * 1000);
      expect(cache.CACHE_CONFIG.usdtUsd).toBe(60 * 1000);
    });
  });

  // ============================================================
  // clearCache / clearAllCache
  // ============================================================
  describe('clearCache y clearAllCache', () => {
    it('clearCache limpia un tipo específico sin afectar los demás', () => {
      cache.setCache('dolarOficial', { compra: 1000 });
      cache.setCache('usdtArs', { binance: { ask: 1500 } });
      cache.setCache('usdtUsd', { binance: { ask: 1.02 } });

      cache.clearCache('dolarOficial');

      expect(cache.getCache('dolarOficial')).toBeNull();
      expect(cache.getCache('usdtArs')).not.toBeNull();
      expect(cache.getCache('usdtUsd')).not.toBeNull();
    });

    it('clearAllCache limpia todos los tipos y getCacheStats refleja el estado', () => {
      cache.setCache('dolarOficial', { compra: 1000 });
      cache.setCache('usdtArs', { binance: { ask: 1500 } });
      cache.setCache('usdtUsd', { binance: { ask: 1.02 } });

      // Verificar stats antes de limpiar
      const statsBefore = cache.getCacheStats();
      expect(statsBefore.dolarOficial.hasData).toBe(true);
      expect(statsBefore.usdtArs.hasData).toBe(true);

      cache.clearAllCache();

      // Verificar que todos quedaron vacíos
      expect(cache.getCache('dolarOficial')).toBeNull();
      expect(cache.getCache('usdtArs')).toBeNull();
      expect(cache.getCache('usdtUsd')).toBeNull();

      // Verificar stats después de limpiar
      const statsAfter = cache.getCacheStats();
      Object.values(statsAfter).forEach(s => {
        expect(s.hasData).toBe(false);
        expect(s.isValid).toBe(false);
      });
    });
  });

  // ============================================================
  // getCachedOrFetch
  // ============================================================
  describe('getCachedOrFetch', () => {
    it('retorna datos del caché si están vigentes sin llamar a fetchFn', async () => {
      const cachedData = { compra: 1000 };
      cache.setCache('dolarOficial', cachedData);

      const fetchFn = jest.fn().mockResolvedValue({ compra: 9999 });

      const result = await cache.getCachedOrFetch('dolarOficial', fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('llama a fetchFn y guarda en caché cuando está vacío o expirado', async () => {
      // Caso 1: caché vacío
      const freshData = { compra: 1100, venta: 1150 };
      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result1 = await cache.getCachedOrFetch('dolarOficial', fetchFn);
      expect(result1).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(cache.getCache('dolarOficial')).toEqual(freshData);

      // Caso 2: fetchFn retorna null (no guarda en caché)
      fetchFn.mockResolvedValueOnce(null);
      await cache.getCachedOrFetch('usdtArs', fetchFn);
      expect(cache.getCache('usdtArs')).toBeNull();

      // Caso 3: pasa argumentos a fetchFn
      fetchFn.mockResolvedValueOnce({ ok: true });
      await cache.getCachedOrFetch('usdtUsd', fetchFn, ['arg1', 'arg2']);
      expect(fetchFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});