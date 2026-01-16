/**
 * Tests for DataService
 */

// Simular el módulo DataService en entorno de test
const DataServiceModule = (() => {
  class DataService {
    constructor() {
      this.REQUEST_INTERVAL = 600;
      this.lastRequestTime = 0;
    }

    async fetchWithRateLimit(url) {
      const now = Date.now();
      const delay = this.REQUEST_INTERVAL - (now - this.lastRequestTime);
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      this.lastRequestTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return await res.json();
      } catch (e) {
        return null;
      }
    }

    async fetchDolarOficial() {
      const data = await this.fetchWithRateLimit('https://dolarapi.com/v1/dolares/oficial');
      if (data && typeof data.compra === 'number' && typeof data.venta === 'number') {
        return data;
      }
      return null;
    }

    async fetchUSDTData() {
      const data = await this.fetchWithRateLimit('https://criptoya.com/api/usdt/ars/1');
      if (data && typeof data === 'object') {
        return data;
      }
      return null;
    }
  }

  return DataService;
})();

describe('DataService', () => {
  let dataService;

  beforeEach(() => {
    dataService = new DataServiceModule();
    jest.clearAllMocks();
  });

  describe('fetchWithRateLimit', () => {
    it('debería retornar datos cuando fetch es exitoso', async () => {
      const mockData = { test: 'data' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await dataService.fetchWithRateLimit('https://api.test.com');
      
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('debería retornar null cuando fetch falla', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await dataService.fetchWithRateLimit('https://api.test.com');
      
      expect(result).toBeNull();
    });

    it('debería retornar null cuando respuesta no es OK', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await dataService.fetchWithRateLimit('https://api.test.com');
      
      expect(result).toBeNull();
    });
  });

  describe('fetchDolarOficial', () => {
    it('debería retornar datos válidos de dólar oficial', async () => {
      const mockDollar = { compra: 1000, venta: 1050 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDollar)
      });

      const result = await dataService.fetchDolarOficial();
      
      expect(result).toEqual(mockDollar);
      expect(result.compra).toBe(1000);
      expect(result.venta).toBe(1050);
    });

    it('debería retornar null si faltan campos requeridos', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ compra: 1000 }) // Falta venta
      });

      const result = await dataService.fetchDolarOficial();
      
      expect(result).toBeNull();
    });

    it('debería retornar null si los valores no son números', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ compra: '1000', venta: '1050' })
      });

      const result = await dataService.fetchDolarOficial();
      
      expect(result).toBeNull();
    });
  });

  describe('fetchUSDTData', () => {
    it('debería retornar datos de exchanges USDT', async () => {
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
      expect(result.binance.ask).toBe(1100);
    });

    it('debería retornar null si respuesta no es objeto', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null)
      });

      const result = await dataService.fetchUSDTData();
      
      expect(result).toBeNull();
    });
  });
});
