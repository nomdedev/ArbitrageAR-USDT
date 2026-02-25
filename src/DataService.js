// ============================================
// SERVICIO DE DATOS - DataService.js
// Responsabilidad: Obtener datos de APIs externas
// ============================================

function debugLog(...args) {
  const logger = (typeof window !== 'undefined' ? window.Logger : undefined)
    || (typeof self !== 'undefined' ? self.Logger : undefined);

  if (logger?.debug) {
    logger.debug(...args);
    return;
  }

  const workerDebug = typeof self !== 'undefined' && self.__ARBITRAGE_DEBUG__ === true;
  const browserDebug = (() => {
    if (typeof window === 'undefined') return false;
    if (window.__ARBITRAGE_DEBUG__ === true) return true;
    try {
      return window.localStorage?.getItem('arb_debug_logs') === 'true';
    } catch (_) {
      return false;
    }
  })();

  if (workerDebug || browserDebug) {
    console.info(...args);
  }
}

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
    } catch (e) {
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
    } catch (e) {
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
    console.warn('⚠️ Sin datos de DolarAPI disponibles');
    return null;
  }

  async fetchUSDTData() {
    const data = await this.fetchWithRateLimit('https://criptoya.com/api/usdt/ars/1');
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      return data;
    }
    console.warn('⚠️ Sin datos USDT/ARS disponibles');
    return null;
  }

  async fetchUSDTUsdData() {
    const data = await this.fetchWithRateLimit('https://criptoya.com/api/usdt/usd/1');
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      return data;
    }
    console.warn('⚠️ Sin datos USDT/USD disponibles');
    return null;
  }

  // ============================================
  // NUEVO: MÉTODOS PARA MÚLTIPLES CRIPTOMONEDAS
  // ============================================

  /**
   * Método genérico para obtener datos de cualquier criptomoneda
   * @param {string} symbol - Símbolo de la cripto (BTC, ETH, etc.)
   * @param {string} fiatCurrency - Moneda fiat (ARS, USD, etc.)
   * @returns {Object|null} Datos de la criptomoneda
   */
  async fetchCryptoData(symbol, fiatCurrency = 'ARS') {
    const url = `https://criptoya.com/api/${symbol}/${fiatCurrency}/1`;
    const data = await this.fetchWithRateLimit(url);

    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      debugLog(
        `💎 Datos ${symbol}/${fiatCurrency} obtenidos:`,
        Object.keys(data).length,
        'exchanges'
      );
      return {
        ...data,
        symbol: symbol,
        fiatCurrency: fiatCurrency,
        timestamp: Date.now()
      };
    }

    // No es un error crítico - la API puede no tener datos para algunas criptos
    console.warn(`⚠️ Sin datos disponibles para ${symbol}/${fiatCurrency}`);
    return null;
  }

  /**
   * Obtener datos de crypto-to-crypto (ej: BTC/ETH)
   * @param {string} symbolFrom - Cripto origen
   * @param {string} symbolTo - Cripto destino
   * @returns {Object|null} Datos del par
   */
  async fetchCryptoToCrypto(symbolFrom, symbolTo) {
    const url = `https://criptoya.com/api/${symbolFrom}/${symbolTo}/1`;
    const data = await this.fetchWithRateLimit(url);

    if (data && typeof data === 'object') {
      debugLog(
        `🔄 Datos ${symbolFrom}/${symbolTo} obtenidos:`,
        Object.keys(data).length,
        'exchanges'
      );
      return {
        ...data,
        symbolFrom: symbolFrom,
        symbolTo: symbolTo,
        timestamp: Date.now()
      };
    }

    console.warn(`⚠️ No hay datos para el par ${symbolFrom}/${symbolTo}`);
    return null;
  }

  // Métodos específicos para cada criptomoneda (Top 10)

  async fetchBTCData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('BTC', fiatCurrency);
  }

  async fetchETHData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('ETH', fiatCurrency);
  }

  async fetchUSDCData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('USDC', fiatCurrency);
  }

  async fetchDAIData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('DAI', fiatCurrency);
  }

  async fetchBNBData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('BNB', fiatCurrency);
  }

  async fetchSOLData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('SOL', fiatCurrency);
  }

  async fetchADAData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('ADA', fiatCurrency);
  }

  async fetchXRPData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('XRP', fiatCurrency);
  }

  async fetchMATICData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('MATIC', fiatCurrency);
  }

  async fetchDOGEData(fiatCurrency = 'ARS') {
    return await this.fetchCryptoData('DOGE', fiatCurrency);
  }

  /**
   * Obtener datos de todas las criptos configuradas
   * @param {Array<string>} cryptoList - Lista de símbolos de criptos a obtener
   * @param {string} fiatCurrency - Moneda fiat
   * @returns {Object} Objeto con todos los datos indexados por símbolo
   */
  async fetchAllCryptos(cryptoList = null, fiatCurrency = 'ARS') {
    // Default: Top 10 criptos
    const defaultCryptos = [
      'BTC',
      'ETH',
      'USDC',
      'DAI',
      'BNB',
      'SOL',
      'ADA',
      'XRP',
      'MATIC',
      'DOGE',
      'USDT'
    ];
    const cryptos = cryptoList || defaultCryptos;

    debugLog(`🔄 Obteniendo datos para ${cryptos.length} criptomonedas...`);

    const promises = cryptos.map(symbol =>
      this.fetchCryptoData(symbol, fiatCurrency)
        .then(data => ({ symbol, data }))
        .catch(error => {
          console.warn(`⚠️ Error obteniendo ${symbol}:`, error.message);
          return { symbol, data: null };
        })
    );

    const results = await Promise.allSettled(promises);
    const cryptoData = {};

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data) {
        cryptoData[result.value.symbol] = result.value.data;
      }
    });

    debugLog(
      `✅ Datos obtenidos para ${Object.keys(cryptoData).length}/${cryptos.length} criptomonedas`
    );
    return cryptoData;
  }

  // ============================================
  // NETWORK FEES (Comisiones de retiro de cripto)
  // ============================================

  /**
   * Base de datos de network fees predeterminados
   * Valores en unidades de la criptomoneda
   */
  getDefaultNetworkFees() {
    return {
      BTC: {
        binance: 0.0005,
        binancep2p: 0.0005,
        lemon: 0.0001,
        ripio: 0.0002,
        buenbit: 0.0003,
        satoshitango: 0.0002,
        belo: 0.0003,
        default: 0.0002
      },
      ETH: {
        binance: 0.005,
        binancep2p: 0.005,
        lemon: 0.003,
        ripio: 0.004,
        buenbit: 0.004,
        satoshitango: 0.003,
        belo: 0.004,
        default: 0.003
      },
      USDC: {
        binance: 1.0,
        binancep2p: 1.0,
        lemon: 0.5,
        ripio: 1.5,
        buenbit: 1.0,
        satoshitango: 1.0,
        belo: 1.0,
        default: 1.0
      },
      USDT: {
        binance: 1.0,
        binancep2p: 1.0,
        lemon: 0.5,
        ripio: 1.5,
        buenbit: 1.0,
        satoshitango: 1.0,
        belo: 1.0,
        default: 1.0
      },
      DAI: {
        binance: 1.0,
        binancep2p: 1.0,
        lemon: 0.8,
        ripio: 1.2,
        buenbit: 1.0,
        satoshitango: 1.0,
        belo: 1.0,
        default: 1.0
      },
      BNB: {
        binance: 0.0005,
        binancep2p: 0.0005,
        lemon: 0.001,
        ripio: 0.001,
        buenbit: 0.001,
        default: 0.001
      },
      SOL: {
        binance: 0.01,
        binancep2p: 0.01,
        lemon: 0.008,
        ripio: 0.01,
        buenbit: 0.01,
        default: 0.01
      },
      ADA: {
        binance: 1.0,
        binancep2p: 1.0,
        lemon: 0.8,
        ripio: 1.2,
        buenbit: 1.0,
        default: 1.0
      },
      XRP: {
        binance: 0.25,
        binancep2p: 0.25,
        lemon: 0.2,
        ripio: 0.3,
        buenbit: 0.25,
        default: 0.25
      },
      MATIC: {
        binance: 0.1,
        binancep2p: 0.1,
        lemon: 0.08,
        ripio: 0.12,
        buenbit: 0.1,
        default: 0.1
      },
      DOGE: {
        binance: 5.0,
        binancep2p: 5.0,
        lemon: 4.0,
        ripio: 6.0,
        buenbit: 5.0,
        default: 5.0
      }
    };
  }

  /**
   * Obtener network fee para un exchange y cripto específicos
   * @param {string} exchange - Nombre del exchange (normalizado a lowercase)
   * @param {string} symbol - Símbolo de la cripto
   * @returns {number} Network fee en unidades de la cripto
   */
  getNetworkFee(exchange, symbol) {
    const fees = this.getDefaultNetworkFees();
    const exchangeLower = exchange.toLowerCase();

    if (fees[symbol]) {
      return fees[symbol][exchangeLower] || fees[symbol]['default'] || 0;
    }

    return 0;
  }

  /**
   * Intentar obtener network fees dinámicos desde API (con fallback)
   * Por ahora usa valores predeterminados, pero permite extensión futura
   * @param {string} exchange - Nombre del exchange
   * @param {string} symbol - Símbolo de la cripto
   * @returns {Promise<number>} Network fee
   */
  async fetchNetworkFee(exchange, symbol) {
    // TODO: Implementar fetch desde API si hay endpoint disponible
    // Por ahora retornar valores predeterminados
    return this.getNetworkFee(exchange, symbol);
  }

  /**
   * Obtener configuración de criptos activas desde storage
   * @returns {Promise<Array<string>>} Lista de símbolos de criptos activas
   */
  async getActiveCryptos() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get('activeCryptos');
        if (result.activeCryptos && Array.isArray(result.activeCryptos)) {
          return result.activeCryptos;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error leyendo criptos activas desde storage:', error);
    }

    // Default: Top 10 + USDT
    return ['BTC', 'ETH', 'USDC', 'DAI', 'BNB', 'SOL', 'ADA', 'XRP', 'MATIC', 'DOGE', 'USDT'];
  }

  /**
   * Guardar configuración de criptos activas
   * @param {Array<string>} cryptoList - Lista de símbolos de criptos
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  async setActiveCryptos(cryptoList) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ activeCryptos: cryptoList });
        debugLog('✅ Criptos activas guardadas:', cryptoList);
        return true;
      }
    } catch (error) {
      console.error('❌ Error guardando criptos activas:', error);
    }
    return false;
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
            compra: sellPrice, // FIX v5.0.35: Usar sellPrice (precio que pagamos al banco)
            venta: buyPrice, // FIX v5.0.35: Usar buyPrice (precio que recibimos del banco)
            spread: sellPrice - buyPrice,
            timestamp: new Date().toISOString(),
            source: 'dolarito'
          };
        }
      }

      debugLog(
        `💰 Precios bancarios obtenidos (dolarito): ${Object.keys(bankRates).length} bancos`
      );
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

      debugLog(
        `💰 Precios bancarios obtenidos (criptoya): ${Object.keys(bankRates).length} bancos`
      );
      return bankRates;
    } catch (error) {
      console.error('Error obteniendo precios bancarios de CriptoYa:', error);
      return null;
    }
  }

  // NUEVO v5.0.22: Normalizar nombres de bancos de CriptoYa
  normalizeBankName(code) {
    const bankNames = {
      bna: 'Banco Nación',
      bbva: 'BBVA',
      piano: 'Banco Piano',
      hipotecario: 'Banco Hipotecario',
      galicia: 'Banco Galicia',
      santander: 'Banco Santander',
      ciudad: 'Banco Ciudad',
      supervielle: 'Banco Supervielle',
      patagonia: 'Banco Patagonia',
      comafi: 'Banco Comafi',
      icbc: 'ICBC',
      bind: 'Bind',
      bancor: 'Bancor',
      chaco: 'Banco Chaco',
      pampa: 'Banco Pampa',
      provincia: 'Banco Provincia',
      columbia: 'Banco Columbia'
    };

    return bankNames[code] || code.charAt(0).toUpperCase() + code.slice(1);
  }

  // NUEVO v5.0.31: Convertir nombre completo de banco a código
  getBankCode(fullName) {
    const bankCodes = {
      'Banco Nación': 'bna',
      'BBVA Banco Francés': 'bbva',
      BBVA: 'bbva',
      'Banco Piano': 'piano',
      'Banco Hipotecario': 'hipotecario',
      'Banco Galicia': 'galicia',
      'Banco Santander Río': 'santander',
      'Banco Santander': 'santander',
      'Banco Ciudad': 'ciudad',
      'Banco Supervielle': 'supervielle',
      'Banco Patagonia': 'patagonia',
      'Banco Comafi': 'comafi',
      ICBC: 'icbc',
      Bind: 'bind',
      Bancor: 'bancor',
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

      debugLog(`💰 Precios bancarios combinados: ${Object.keys(combined).length} bancos`);
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
