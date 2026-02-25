/**
 * Integración real de DataService (sin mocks de implementación interna)
 * Valida contratos actuales contra fetch mockeado y comportamiento de rate limiting.
 */

require('../src/DataService.js');

describe('DataService - Integración real', () => {
  let dataService;

  beforeEach(() => {
    jest.clearAllMocks();
    dataService = global.self?.dataService || global.window?.dataService;
    expect(dataService).toBeDefined();
  });

  describe('fetchDolarOficial', () => {
    it('retorna datos válidos de DolarAPI (compra/venta)', async () => {
      const payload = { compra: 1000.5, venta: 1050.75 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(payload)
      });

      const result = await dataService.fetchDolarOficial();

      expect(result).toEqual(payload);
      expect(fetch).toHaveBeenCalledWith(
        'https://dolarapi.com/v1/dolares/oficial',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('retorna null cuando la API devuelve formato incompatible', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ oficial: { ask: 1100, bid: 1000 } })
      });

      const result = await dataService.fetchDolarOficial();
      expect(result).toBeNull();
    });

    it('retorna null en error HTTP', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({})
      });

      const result = await dataService.fetchDolarOficial();
      expect(result).toBeNull();
    });
  });

  describe('fetchUSDTData y fetchUSDTUsdData', () => {
    it('procesa correctamente respuesta válida de USDT/ARS', async () => {
      const payload = {
        binance: { ask: 1500, bid: 1490 },
        buenbit: { ask: 1510, bid: 1488 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(payload)
      });

      const result = await dataService.fetchUSDTData();

      expect(result).toEqual(payload);
      expect(result.binance.ask).toBeGreaterThan(result.binance.bid);
      expect(fetch).toHaveBeenCalledWith(
        'https://criptoya.com/api/usdt/ars/1',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('procesa correctamente respuesta válida de USDT/USD', async () => {
      const payload = {
        binance: { ask: 1.05, bid: 1.03 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(payload)
      });

      const result = await dataService.fetchUSDTUsdData();

      expect(result).toEqual(payload);
      expect(fetch).toHaveBeenCalledWith(
        'https://criptoya.com/api/usdt/usd/1',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });
  });

  describe('resiliencia y timing', () => {
    it('maneja AbortError retornando null', async () => {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';

      global.fetch.mockRejectedValueOnce(abortError);

      const result = await dataService.fetchWithRateLimit('https://example.test/timeout');
      expect(result).toBeNull();
    });

    it('respeta rate limiting entre llamadas secuenciales', async () => {
      dataService.REQUEST_INTERVAL = 50;
      dataService.lastRequestTime = 0;

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

      const start = Date.now();
      await dataService.fetchWithRateLimit('https://example.test/1');
      await dataService.fetchWithRateLimit('https://example.test/2');
      await dataService.fetchWithRateLimit('https://example.test/3');
      const elapsed = Date.now() - start;

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});
