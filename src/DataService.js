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
          // NUEVO v5.0.31: Usar código de banco como key para consistencia con selectedBanks
          const bankCode = this.getBankCode(bankName);
          
          bankRates[bankCode] = {
            name: bankName,
            compra: buyPrice,
            venta: sellPrice,
            spread: sellPrice - buyPrice,
            timestamp: new Date().toISOString(),
            source: 'dolarito'
          };
        }
      }

      console.log(`💰 Precios bancarios obtenidos (dolarito): ${Object.keys(bankRates).length} bancos`);
      return bankRates;

    } catch (error) {
      console.error('Error obteniendo precios bancarios de Dolarito:', error);
      return null;
    }
  }

  // NUEVO v5.0.22: Obtener precios de dólar por banco desde CriptoYa
  async fetchCriptoYaBankRates() {
    try {
      const data = await this.fetchWithRateLimit('https://criptoya.com/api/bancostodos');
      
      if (!data || typeof data !== 'object') {
        console.warn('⚠️ No se pudo obtener datos de CriptoYa bancos');
        return null;
      }

      const bankRates = {};
      
      // La API retorna un objeto con bancos como claves
      for (const [bankCode, rates] of Object.entries(data)) {
        const compra = parseFloat(rates.ask);
        const venta = parseFloat(rates.bid);

        if (!isNaN(compra) && !isNaN(venta) && compra > 0 && venta > 0) {
          bankRates[bankCode] = {
            name: this.normalizeBankName(bankCode),
            compra: compra,
            venta: venta,
            spread: venta - compra,
            timestamp: new Date().toISOString(),
            source: 'criptoya'
          };
        }
      }

      console.log(`💰 Precios bancarios obtenidos (criptoya): ${Object.keys(bankRates).length} bancos`);
      return bankRates;

    } catch (error) {
      console.error('Error obteniendo precios bancarios de CriptoYa:', error);
      return null;
    }
  }

  // NUEVO v5.0.22: Normalizar nombres de bancos de CriptoYa
  normalizeBankName(code) {
    const bankNames = {
      'nacion': 'Banco Nación',
      'bbva': 'BBVA',
      'piano': 'Banco Piano',
      'hipotecario': 'Banco Hipotecario',
      'galicia': 'Banco Galicia',
      'santander': 'Banco Santander',
      'ciudad': 'Banco Ciudad',
      'supervielle': 'Banco Supervielle',
      'patagonia': 'Banco Patagonia',
      'comafi': 'Banco Comafi',
      'icbc': 'ICBC',
      'bind': 'Bind',
      'bancor': 'Bancor',
      'chaco': 'Banco Chaco',
      'pampa': 'Banco Pampa',
      'provincia': 'Banco Provincia',
      'columbia': 'Banco Columbia'
    };
    
    return bankNames[code] || code.charAt(0).toUpperCase() + code.slice(1);
  }

  // NUEVO v5.0.31: Convertir nombre completo de banco a código
  getBankCode(fullName) {
    const bankCodes = {
      'Banco Nación': 'nacion',
      'BBVA Banco Francés': 'bbva',
      'BBVA': 'bbva',
      'Banco Piano': 'piano',
      'Banco Hipotecario': 'hipotecario',
      'Banco Galicia': 'galicia',
      'Banco Santander Río': 'santander',
      'Banco Santander': 'santander',
      'Banco Ciudad': 'ciudad',
      'Banco Supervielle': 'supervielle',
      'Banco Patagonia': 'patagonia',
      'Banco Comafi': 'comafi',
      'ICBC': 'icbc',
      'Bind': 'bind',
      'Bancor': 'bancor',
      'Nuevo Banco del Chaco': 'chaco',
      'Banco Chaco': 'chaco',
      'Banco de la Pampa': 'pampa',
      'Banco Pampa': 'pampa',
      'Banco Provincia': 'provincia',
      'Banco de la Provincia de Buenos Aires': 'provincia',
      'Banco Columbia': 'columbia',
      'Banco Macro': 'macro'
    };
    
    return bankCodes[fullName] || fullName.toLowerCase().replace(/[^a-z]/g, '');
  }

  // NUEVO v5.0.22: Combinar datos de ambas fuentes (dolarito + criptoya)
  async fetchCombinedBankRates() {
    try {
      const [dolarito, criptoya] = await Promise.all([
        this.fetchDolaritoBankRates(),
        this.fetchCriptoYaBankRates()
      ]);

      const combined = {};

      // Añadir datos de dolarito
      if (dolarito) {
        Object.entries(dolarito).forEach(([key, data]) => {
          combined[key] = { ...data };
        });
      }

      // Añadir/combinar datos de criptoya
      if (criptoya) {
        Object.entries(criptoya).forEach(([key, data]) => {
          if (combined[key]) {
            // Si ya existe, agregar datos de criptoya como fuente alternativa
            combined[key].criptoya = {
              compra: data.compra,
              venta: data.venta
            };
          } else {
            // Si no existe, añadir directamente
            combined[key] = { ...data };
          }
        });
      }

      console.log(`💰 Precios bancarios combinados: ${Object.keys(combined).length} bancos`);
      return combined;

    } catch (error) {
      console.error('Error combinando precios bancarios:', error);
      // Fallback: intentar cada fuente por separado
      const dolarito = await this.fetchDolaritoBankRates();
      if (dolarito) return dolarito;
      
      const criptoya = await this.fetchCriptoYaBankRates();
      if (criptoya) return criptoya;
      
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