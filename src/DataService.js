// ============================================
// SERVICIO DE DATOS - DataService.js
// Responsabilidad: Obtener datos de APIs externas
// ============================================

class DataService {
  constructor() {
    this.REQUEST_INTERVAL = 600; // ms
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
    } catch(e) {
      if (e.name === 'AbortError') {
        console.error('Fetch timeout:', url);
      } else {
        console.error('Fetch error:', url, e);
      }
      return null;
    }
  }

  async fetchDolarOficial() {
    const data = await this.fetchWithRateLimit('https://dolarapi.com/v1/dolares/oficial');
    if (data && typeof data.compra === 'number' && typeof data.venta === 'number') {
      return data;
    }
    console.error('Estructura inválida de DolarAPI:', data);
    return null;
  }

  async fetchUSDTData() {
    const data = await this.fetchWithRateLimit('https://criptoya.com/api/usdt/ars/1');
    if (data && typeof data === 'object') {
      return data;
    }
    console.error('Estructura inválida de CriptoYA:', data);
    return null;
  }

  async fetchUSDTUsdData() {
    const data = await this.fetchWithRateLimit('https://criptoya.com/api/usdt/usd/1');
    if (data && typeof data === 'object') {
      return data;
    }
    console.error('Estructura inválida de CriptoYA USD:', data);
    return null;
  }
}

// Exportar instancia singleton
const dataService = new DataService();
export default dataService;