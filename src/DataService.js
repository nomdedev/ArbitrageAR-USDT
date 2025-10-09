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
        console.warn('⏱️ Timeout en fetch:', url);
      } else if (e instanceof SyntaxError) {
        console.warn('⚠️ Respuesta no es JSON válido:', url, '(probablemente HTML)');
      } else {
        console.warn('⚠️ Error en fetch:', url, e.message);
      }
      return null;
    }
  }

  // NUEVO: Método para obtener HTML sin parsear JSON
  async fetchHTML(url) {
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
      return await res.text();
    } catch(e) {
      if (e.name === 'AbortError') {
        console.warn('⏱️ Timeout en fetch HTML:', url);
      } else {
        console.warn('⚠️ Error en fetch HTML:', url, e.message);
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

  // NUEVO: Obtener precios de dólar por banco desde dolarito.ar
  async fetchDolaritoBankRates() {
    try {
      const html = await this.fetchHTML('https://www.dolarito.ar/cotizacion/bancos');
      
      if (!html) {
        console.warn('⚠️ No se pudo obtener HTML de Dolarito para precios bancarios');
        return null;
      }

      // Buscar el JSON embebido con los datos de bancos
      const jsonMatch = html.match(/"bankQuotations":\s*({[^}]*"quotations":\s*\[[^\]]*\][^}]*})/);
      if (!jsonMatch) {
        console.warn('No se encontró el JSON de precios bancarios en Dolarito');
        return null;
      }

      const bankData = JSON.parse(`{${jsonMatch[1]}}`);
      const quotations = bankData.quotations || [];

      const bankRates = {};
      
      for (const quote of quotations) {
        const bankName = quote.name?.trim();
        const buyPrice = parseFloat(quote.buy);
        const sellPrice = parseFloat(quote.sell);

        if (bankName && !isNaN(buyPrice) && !isNaN(sellPrice) && buyPrice > 0 && sellPrice > 0) {
          bankRates[bankName] = {
            name: bankName,
            compra: buyPrice,
            venta: sellPrice,
            spread: sellPrice - buyPrice,
            timestamp: new Date().toISOString(),
            source: 'dolarito'
          };
        }
      }

      console.log(`💰 Precios bancarios obtenidos: ${Object.keys(bankRates).length} bancos`);
      return bankRates;

    } catch (error) {
      console.error('Error obteniendo precios bancarios de Dolarito:', error);
      return null;
    }
  }
}

// Exportar instancia singleton (compatible con service workers)
const dataService = new DataService();
if (typeof self !== 'undefined') {
  self.dataService = dataService;
}

// Exportar también la clase para poder crear nuevas instancias
export { DataService };