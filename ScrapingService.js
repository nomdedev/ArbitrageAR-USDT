// ============================================
// SERVICIO DE SCRAPING - ScrapingService.js
// Responsabilidad: Web scraping de datos externos
// ============================================

class ScrapingService {
  constructor(dataService) {
    this.dataService = dataService;
  }

  async scrapeBanksData() {
    try {
      // Obtener datos de ambas fuentes en paralelo
      const [dolarApiBanks, dolaritoBanks] = await Promise.all([
        this._fetchBanksFromDolarApi(),
        this._fetchBanksFromDolarito()
      ]);

      // Combinar resultados
      const combinedBanks = [];

      // Agregar bancos de Dolarito (con logos)
      combinedBanks.push(...dolaritoBanks);

      // Agregar tipos de dólar de DolarAPI que no estén ya incluidos
      const dolaritoBankNames = new Set(dolaritoBanks.map(b => b.name.toLowerCase()));
      const additionalDolarTypes = dolarApiBanks.filter(bank =>
        !dolaritoBankNames.has(bank.name.toLowerCase())
      );
      combinedBanks.push(...additionalDolarTypes);

      // Usar fallback si no hay datos
      const finalBanks = combinedBanks.length > 0 ? combinedBanks : this._getBanksFallback();

      return {
        banks: finalBanks,
        lastUpdate: Date.now(),
        sources: {
          dolarito: dolaritoBanks.length,
          dolarApi: additionalDolarTypes.length
        }
      };

    } catch (error) {
      console.error('Error en scraping de bancos:', error);
      return {
        banks: this._getBanksFallback(),
        lastUpdate: Date.now(),
        sources: { error: true }
      };
    }
  }

  async _fetchBanksFromDolarApi() {
    try {
      const data = await this.dataService.fetchWithRateLimit('https://dolarapi.com/v1/dolares');
      if (!Array.isArray(data)) return [];

      return data.map(dolar => ({
        name: dolar.nombre || dolar.name || 'Dólar',
        compra: parseFloat(dolar.compra) || 0,
        venta: parseFloat(dolar.venta) || 0,
        spread: 0,
        timestamp: new Date().toISOString(),
        source: 'dolarapi'
      })).filter(bank => bank.compra > 0 && bank.venta > 0);

    } catch (error) {
      console.error('Error scraping DolarAPI:', error);
      return [];
    }
  }

  async _fetchBanksFromDolarito() {
    try {
      const response = await this.dataService.fetchWithRateLimit('https://www.dolarito.ar/cotizacion/bancos');

      if (!response) {
        console.warn('No se pudo obtener respuesta de Dolarito');
        return [];
      }

      const html = await response.text();
      const banks = [];

      // Buscar el JSON embebido con los datos de bancos
      const jsonMatch = html.match(/"bankQuotations":\s*({[^}]*"quotations":\s*\[[^\]]*\][^}]*})/);
      if (!jsonMatch) {
        console.warn('No se encontró el JSON de bancos en la página');
        return [];
      }

      const bankData = JSON.parse(`{${jsonMatch[1]}}`);
      const quotations = bankData.quotations || [];

      for (const quote of quotations) {
        const bankName = quote.name?.trim();
        const buyPrice = parseFloat(quote.buy);
        const sellPrice = parseFloat(quote.sell);

        if (bankName && !isNaN(buyPrice) && !isNaN(sellPrice) && buyPrice > 0 && sellPrice > 0) {
          const logoUrl = this._generateBankLogoUrl(bankName);

          banks.push({
            name: bankName,
            logo: logoUrl,
            compra: buyPrice,
            venta: sellPrice,
            spread: sellPrice - buyPrice,
            timestamp: new Date().toISOString(),
            source: 'dolarito'
          });
        }
      }

      console.log(`📊 Dolarito scraping: ${banks.length} bancos encontrados`);
      return banks;

    } catch (error) {
      console.error('Error scraping Dolarito:', error);
      return [];
    }
  }

  _generateBankLogoUrl(bankName) {
    const logoMap = {
      'Banco Nación': 'https://www.bna.com.ar/Imagenes/logo-banco-nacion.png',
      'Banco Provincia': 'https://www.bancoprovincia.com.ar/logo.png',
      'BBVA Banco Francés': 'https://www.bbva.com.ar/content/dam/public-web/global/images/logos/bbva-logo.svg',
      'Banco Galicia': 'https://www.bancogalicia.com/logo.svg',
      'Banco Santander Río': 'https://www.santander.com.ar/logo.png',
      'Banco Macro': 'https://www.macro.com.ar/logo.png',
      'ICBC': 'https://www.icbc.com.ar/logo.svg',
      'Banco Ciudad': 'https://www.bancociudad.com.ar/logo.png',
      'Banco Patagonia': 'https://www.bancopatagonia.com.ar/logo.svg',
      'Banco Supervielle': 'https://www.supervielle.com.ar/logo.png',
      'Banco Columbia': 'https://www.bancocolumbia.com.ar/logo.png',
      'Banco Piano': 'https://www.piano.com.ar/logo.png',
      'Banco Provincia del Neuquén': 'https://www.bpn.com.ar/logo.png',
      'Plus Cambio': 'https://www.plus.com.ar/logo.png'
    };

    return logoMap[bankName] || null;
  }

  _getBanksFallback() {
    return [
      {
        name: 'Banco Nación',
        compra: 900,
        venta: 950,
        spread: 50,
        timestamp: new Date().toISOString(),
        source: 'fallback'
      },
      {
        name: 'Banco Provincia',
        compra: 895,
        venta: 955,
        spread: 60,
        timestamp: new Date().toISOString(),
        source: 'fallback'
      }
    ];
  }
}

// Exportar clase
// Exportar clase
export default ScrapingService;