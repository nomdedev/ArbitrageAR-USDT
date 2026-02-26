/**
 * Tests para ApiClient
 *
 * ApiClient es el único punto de acceso a datos externos.
 * Fallos aquí dejan la extensión ciega ante el mercado.
 * Testamos: respuestas exitosas, errores HTTP, timeouts,
 * y que fetchAllData combine correctamente los resultados.
 *
 * Patrón: IIFE que expone self.ApiClient (en jsdom: self === window).
 */

// En jsdom self === window, así que self.ApiClient quedará en window.ApiClient
require('../src/background/apiClient.js');

describe('ApiClient', () => {
  let AC;

  beforeAll(() => {
    AC = globalThis.self?.ApiClient || globalThis.window?.ApiClient || globalThis.ApiClient;
    if (!AC) throw new Error('ApiClient no fue expuesto en self/window');
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    // Silenciar debugLog del módulo
    globalThis.self = globalThis.self || {};
    globalThis.self.__ARBITRAGE_DEBUG__ = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  // ============================================================
  // ENDPOINTS — estructura
  // ============================================================
  describe('ENDPOINTS', () => {
    it('contiene todas las URLs necesarias', () => {
      expect(AC.ENDPOINTS).toBeDefined();
      expect(AC.ENDPOINTS.CRIPTOYA_USDT_ARS).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.CRIPTOYA_USDT_USD).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.CRIPTOYA_BANKS).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.CRIPTOYA_DOLLAR).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.DOLARAPI_OFICIAL).toMatch(/^https:\/\//);
    });
  });

  // ============================================================
  // getUsdtArs — respuesta exitosa
  // ============================================================
  describe('getUsdtArs', () => {
    it('retorna { success: true, data, source } en respuesta exitosa', async () => {
      const mockData = { binance: { ask: 1100, bid: 1095 }, buenbit: { ask: 1105, bid: 1100 } };
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await AC.getUsdtArs();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.source).toBe('criptoya');
    });

    it('retorna { success: false, error } en error de red', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

      const result = await AC.getUsdtArs();
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('retorna { success: false } para respuesta HTTP 500', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('no json'))
      });

      const result = await AC.getUsdtArs();
      expect(result.success).toBe(false);
    });

    it('nunca lanza (siempre catch interno)', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('boom'));
      await expect(AC.getUsdtArs()).resolves.toHaveProperty('success', false);
    });
  });

  // ============================================================
  // getUsdtUsd
  // ============================================================
  describe('getUsdtUsd', () => {
    it('retorna { success: true, source: "criptoya" } en respuesta exitosa', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ binance: { ask: 1.001 } })
      });

      const result = await AC.getUsdtUsd();
      expect(result.success).toBe(true);
      expect(result.source).toBe('criptoya');
    });

    it('retorna { success: false } en fallo', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline'));
      const result = await AC.getUsdtUsd();
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // getBankRates
  // ============================================================
  describe('getBankRates', () => {
    it('retorna { success: true, source: "criptoya_banks" } en éxito', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bna: { compra: 1000, venta: 1050 } })
      });

      const result = await AC.getBankRates();
      expect(result.success).toBe(true);
      expect(result.source).toBe('criptoya_banks');
    });

    it('retorna { success: false } en fallo', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('timeout'));
      const result = await AC.getBankRates();
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // getDollarTypes
  // ============================================================
  describe('getDollarTypes', () => {
    it('retorna { success: true, source: "criptoya_dollar" } en éxito', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ oficial: { compra: 1000, venta: 1050 } })
      });

      const result = await AC.getDollarTypes();
      expect(result.success).toBe(true);
      expect(result.source).toBe('criptoya_dollar');
    });
  });

  // ============================================================
  // getDolarApiOficial
  // ============================================================
  describe('getDolarApiOficial', () => {
    it('retorna { success: true, source: "dolarapi" } en éxito', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ compra: 1000, venta: 1050 })
      });

      const result = await AC.getDolarApiOficial();
      expect(result.success).toBe(true);
      expect(result.source).toBe('dolarapi');
    });

    it('retorna { success: false } en error de red', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('no route'));
      const result = await AC.getDolarApiOficial();
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // fetchAllData — agrupación de resultados
  // ============================================================
  describe('fetchAllData', () => {
    it('retorna objeto con usdtArs, usdtUsd, banks, dollarTypes y timestamp', async () => {
      const mockOk = { ok: true, json: () => Promise.resolve({}) };
      globalThis.fetch = jest.fn().mockResolvedValue(mockOk);

      const result = await AC.fetchAllData();
      expect(result).toHaveProperty('usdtArs');
      expect(result).toHaveProperty('usdtUsd');
      expect(result).toHaveProperty('banks');
      expect(result).toHaveProperty('dollarTypes');
      expect(typeof result.timestamp).toBe('number');
    });

    it('todos los sub-resultados tienen la propiedad "success"', async () => {
      const mockOk = { ok: true, json: () => Promise.resolve({}) };
      globalThis.fetch = jest.fn().mockResolvedValue(mockOk);

      const result = await AC.fetchAllData();
      expect(result.usdtArs).toHaveProperty('success');
      expect(result.usdtUsd).toHaveProperty('success');
      expect(result.banks).toHaveProperty('success');
      expect(result.dollarTypes).toHaveProperty('success');
    });

    it('no lanza aunque todas las sub-requests fallen', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('all down'));
      await expect(AC.fetchAllData()).resolves.toHaveProperty('timestamp');
    });
  });

  // ============================================================
  // setConfig
  // ============================================================
  describe('setConfig', () => {
    it('acepta objeto sin lanzar', () => {
      expect(() => AC.setConfig({ timeout: 5000 })).not.toThrow();
    });

    it('no rompe llamadas posteriores tras cambiar configuración', async () => {
      AC.setConfig({ timeout: 3000, enableRateLimit: false });
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });
      const result = await AC.getUsdtArs();
      expect(result.success).toBe(true);
    });
  });
});
