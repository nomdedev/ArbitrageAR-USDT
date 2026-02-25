/**
 * DataService (implementación real)
 * Verifica contratos actuales sin simular internamente la clase.
 */

require('../src/DataService.js');

describe('DataService (Real Implementation)', () => {
  let dataService;

  beforeEach(() => {
    jest.clearAllMocks();
    dataService = global.self?.dataService || global.window?.dataService;
    expect(dataService).toBeDefined();
  });

  describe('fetchDolarOficial', () => {
    it('usa endpoint de DolarAPI y retorna compra/venta válidos', async () => {
      const mockData = { compra: 1000, venta: 1050 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await dataService.fetchDolarOficial();

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        'https://dolarapi.com/v1/dolares/oficial',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('retorna null si la respuesta no trae compra/venta numéricos', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ oficial: { ask: 1050, bid: 1000 } })
      });

      const result = await dataService.fetchDolarOficial();
      expect(result).toBeNull();
    });
  });

  describe('fetchUSDTData', () => {
    it('retorna datos de exchanges cuando la respuesta es objeto con contenido', async () => {
      const mockUSDT = {
        binance: { ask: 1100, bid: 1095 },
        buenbit: { ask: 1105, bid: 1090 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUSDT)
      });

      const result = await dataService.fetchUSDTData();

      expect(result).toEqual(mockUSDT);
      expect(fetch).toHaveBeenCalledWith(
        'https://criptoya.com/api/usdt/ars/1',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('retorna null cuando la respuesta es vacía', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const result = await dataService.fetchUSDTData();
      expect(result).toBeNull();
    });
  });

  describe('fetchWithRateLimit', () => {
    it('maneja AbortError devolviendo null', async () => {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      global.fetch.mockRejectedValueOnce(abortError);

      const result = await dataService.fetchWithRateLimit('https://api.test.com');
      expect(result).toBeNull();
    });

    it('respeta intervalo entre llamadas secuenciales', async () => {
      dataService.REQUEST_INTERVAL = 50;
      dataService.lastRequestTime = 0;

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

      const start = Date.now();
      await dataService.fetchWithRateLimit('https://api.test.com/1');
      await dataService.fetchWithRateLimit('https://api.test.com/2');
      await dataService.fetchWithRateLimit('https://api.test.com/3');
      const elapsed = Date.now() - start;

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});
