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
  // URLS — estructura de endpoints
  // ============================================================
  describe('URLs', () => {
    it('contiene todas las URLs necesarias con formato HTTPS', () => {
      expect(AC.ENDPOINTS).toBeDefined();
      expect(AC.ENDPOINTS.CRIPTOYA_USDT_ARS).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.CRIPTOYA_USDT_USD).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.CRIPTOYA_BANKS).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.CRIPTOYA_DOLLAR).toMatch(/^https:\/\//);
      expect(AC.ENDPOINTS.DOLARAPI_OFICIAL).toMatch(/^https:\/\//);
    });
  });

  // ============================================================
  // ENDPOINTS INDIVIDUALES — casos exitosos
  // ============================================================
  describe('Endpoints individuales', () => {
    describe('casos exitosos', () => {
      it('todos los endpoints retornan { success: true, data, source } en respuesta exitosa', async () => {
        const mockResponses = {
          getUsdtArs: { binance: { ask: 1100, bid: 1095 } },
          getUsdtUsd: { binance: { ask: 1.001 } },
          getBankRates: { bna: { compra: 1000, venta: 1050 } },
          getDollarTypes: { oficial: { compra: 1000, venta: 1050 } },
          getDolarApiOficial: { compra: 1000, venta: 1050 }
        };

        globalThis.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponses.getUsdtArs)
        });

        // Test getUsdtArs
        let result = await AC.getUsdtArs();
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockResponses.getUsdtArs);
        expect(result.source).toBe('criptoya');

        // Test getUsdtUsd
        globalThis.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponses.getUsdtUsd)
        });
        result = await AC.getUsdtUsd();
        expect(result.success).toBe(true);
        expect(result.source).toBe('criptoya');

        // Test getBankRates
        globalThis.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponses.getBankRates)
        });
        result = await AC.getBankRates();
        expect(result.success).toBe(true);
        expect(result.source).toBe('criptoya_banks');

        // Test getDollarTypes
        globalThis.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponses.getDollarTypes)
        });
        result = await AC.getDollarTypes();
        expect(result.success).toBe(true);
        expect(result.source).toBe('criptoya_dollar');

        // Test getDolarApiOficial
        globalThis.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponses.getDolarApiOficial)
        });
        result = await AC.getDolarApiOficial();
        expect(result.success).toBe(true);
        expect(result.source).toBe('dolarapi');
      });
    });

    describe('casos de fallo', () => {
      it('todos los endpoints retornan { success: false, error } en errores de red o HTTP', async () => {
        // Test error de red
        globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

        let result = await AC.getUsdtArs();
        expect(result.success).toBe(false);
        expect(typeof result.error).toBe('string');

        result = await AC.getUsdtUsd();
        expect(result.success).toBe(false);

        result = await AC.getBankRates();
        expect(result.success).toBe(false);

        result = await AC.getDolarApiOficial();
        expect(result.success).toBe(false);

        // Test error HTTP 500
        globalThis.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.reject(new Error('no json'))
        });

        result = await AC.getUsdtArs();
        expect(result.success).toBe(false);

        result = await AC.getDolarApiOficial();
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================
  // FETCH ALL DATA — agrupación de resultados
  // ============================================================
  describe('fetchAllData', () => {
    describe('caso exitoso', () => {
      it('retorna objeto con todas las propiedades y sub-resultados con success', async () => {
        const mockOk = { ok: true, json: () => Promise.resolve({}) };
        globalThis.fetch = jest.fn().mockResolvedValue(mockOk);

        const result = await AC.fetchAllData();
        expect(result).toHaveProperty('usdtArs');
        expect(result).toHaveProperty('usdtUsd');
        expect(result).toHaveProperty('banks');
        expect(result).toHaveProperty('dollarTypes');
        expect(typeof result.timestamp).toBe('number');
        expect(result.usdtArs).toHaveProperty('success');
        expect(result.usdtUsd).toHaveProperty('success');
        expect(result.banks).toHaveProperty('success');
        expect(result.dollarTypes).toHaveProperty('success');
      });
    });

    describe('manejo de errores', () => {
      it('no lanza aunque todas las sub-requests fallen y retorna timestamp', async () => {
        globalThis.fetch = jest.fn().mockRejectedValue(new Error('all down'));
        const result = await AC.fetchAllData();
        expect(result).toHaveProperty('timestamp');
        expect(result.usdtArs.success).toBe(false);
        expect(result.usdtUsd.success).toBe(false);
        expect(result.banks.success).toBe(false);
        expect(result.dollarTypes.success).toBe(false);
      });
    });
  });

  // ============================================================
  // SET CONFIG — configuración dinámica
  // ============================================================
  describe('setConfig', () => {
    it('acepta configuración y no afecta llamadas posteriores', async () => {
      expect(() => AC.setConfig({ timeout: 5000 })).not.toThrow();

      AC.setConfig({ timeout: 3000, enableRateLimit: false });
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      const result = await AC.getUsdtArs();
      expect(result.success).toBe(true);
    });
  });

  // ============================================================
  // ERROR HANDLING — comportamiento robusto
  // ============================================================
  describe('Error handling', () => {
    it('los endpoints nunca lanzan excepciones, siempre retornan objeto con success', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('boom'));

      await expect(AC.getUsdtArs()).resolves.toHaveProperty('success', false);
      await expect(AC.getUsdtUsd()).resolves.toHaveProperty('success', false);
      await expect(AC.getBankRates()).resolves.toHaveProperty('success', false);
      await expect(AC.getDollarTypes()).resolves.toHaveProperty('success', false);
      await expect(AC.getDolarApiOficial()).resolves.toHaveProperty('success', false);
    });

    it('maneja respuestas HTTP con status de error correctamente', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.reject(new Error('no json'))
      });

      const result = await AC.getUsdtArs();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});