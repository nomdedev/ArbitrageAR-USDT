/**
 * API Client Module - ArbitrageAR v5.0
 * Cliente centralizado para todas las llamadas a APIs externas
 */

const ApiClient = (() => {
  const debugLog = (...args) => {
    if (typeof self !== 'undefined' && self.__ARBITRAGE_DEBUG__ === true) {
      console.info(...args);
    }
  };

  // Configuración
  const config = {
    timeout: 8000, // CORREGIDO v6.0.2: Reducido de 12s a 8s (M-03)
    rateLimit: 600, // ms entre requests
    enableRateLimit: true, // Habilitado por defecto para evitar rate limiting de APIs
    headers: {
      Accept: 'application/json'
      // CORREGIDO v6.0.2: Eliminado User-Agent spoofing (M-04)
    }
  };

  // Estado
  let lastRequestTime = 0;

  // Endpoints
  const ENDPOINTS = {
    CRIPTOYA_USDT_ARS: 'https://criptoya.com/api/usdt/ars/1',
    CRIPTOYA_USDT_USD: 'https://criptoya.com/api/usdt/usd/1',
    CRIPTOYA_BANKS: 'https://criptoya.com/api/bancostodos',
    CRIPTOYA_DOLLAR: 'https://criptoya.com/api/dolar',
    DOLARAPI_OFICIAL: 'https://dolarapi.com/v1/dolares/oficial'
  };

  /**
   * Aplicar rate limiting si está habilitado
   */
  const applyRateLimit = async () => {
    if (!config.enableRateLimit) return;

    const now = Date.now();
    const delay = config.rateLimit - (now - lastRequestTime);
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }
    lastRequestTime = Date.now();
  };

  /**
   * Realizar fetch con timeout y manejo de errores
   */
  const fetchWithTimeout = async (url, options = {}) => {
    await applyRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { ...config.headers, ...options.headers }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout en ${url}`);
      }
      throw error;
    }
  };

  /**
   * Obtener cotizaciones USDT/ARS de CriptoYa
   */
  const getUsdtArs = async () => {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.CRIPTOYA_USDT_ARS);
      debugLog('✅ [ApiClient] USDT/ARS obtenido:', Object.keys(data).length, 'exchanges');
      return { success: true, data, source: 'criptoya' };
    } catch (error) {
      console.error('❌ [ApiClient] Error USDT/ARS:', error.message);
      return { success: false, error: error.message, data: null };
    }
  };

  /**
   * Obtener cotizaciones USDT/USD de CriptoYa
   */
  const getUsdtUsd = async () => {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.CRIPTOYA_USDT_USD);
      debugLog('✅ [ApiClient] USDT/USD obtenido:', Object.keys(data).length, 'exchanges');
      return { success: true, data, source: 'criptoya' };
    } catch (error) {
      console.error('❌ [ApiClient] Error USDT/USD:', error.message);
      return { success: false, error: error.message, data: null };
    }
  };

  /**
   * Obtener cotizaciones de bancos de CriptoYa
   */
  const getBankRates = async () => {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.CRIPTOYA_BANKS);
      debugLog('✅ [ApiClient] Bancos obtenido:', Object.keys(data).length, 'bancos');
      return { success: true, data, source: 'criptoya_banks' };
    } catch (error) {
      console.error('❌ [ApiClient] Error Bancos:', error.message);
      return { success: false, error: error.message, data: null };
    }
  };

  /**
   * Obtener tipos de dólar de CriptoYa
   */
  const getDollarTypes = async () => {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.CRIPTOYA_DOLLAR);
      debugLog('✅ [ApiClient] Tipos de dólar obtenido');
      return { success: true, data, source: 'criptoya_dollar' };
    } catch (error) {
      console.error('❌ [ApiClient] Error Tipos de dólar:', error.message);
      return { success: false, error: error.message, data: null };
    }
  };

  /**
   * Obtener dólar oficial de DolarAPI (fallback)
   */
  const getDolarApiOficial = async () => {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.DOLARAPI_OFICIAL);
      debugLog('✅ [ApiClient] DolarAPI oficial obtenido');
      return { success: true, data, source: 'dolarapi' };
    } catch (error) {
      console.error('❌ [ApiClient] Error DolarAPI:', error.message);
      return { success: false, error: error.message, data: null };
    }
  };

  /**
   * Obtener todos los datos necesarios en paralelo
   */
  const fetchAllData = async () => {
    debugLog('📡 [ApiClient] Obteniendo todos los datos...');

    const [usdtArs, usdtUsd, banks, dollarTypes] = await Promise.all([
      getUsdtArs(),
      getUsdtUsd(),
      getBankRates(),
      getDollarTypes()
    ]);

    return {
      usdtArs,
      usdtUsd,
      banks,
      dollarTypes,
      timestamp: Date.now()
    };
  };

  // CORREGIDO v6.0.2: Validar propiedades permitidas en setConfig (M-08)
  const ALLOWED_CONFIG_KEYS = ['timeout', 'rateLimit', 'enableRateLimit'];
  const setConfig = newConfig => {
    if (!newConfig || typeof newConfig !== 'object') return;
    const filtered = {};
    for (const key of ALLOWED_CONFIG_KEYS) {
      if (key in newConfig) {
        filtered[key] = newConfig[key];
      }
    }
    Object.assign(config, filtered);
  };

  // API pública
  return {
    // Métodos individuales
    getUsdtArs,
    getUsdtUsd,
    getBankRates,
    getDollarTypes,
    getDolarApiOficial,

    // Método combinado
    fetchAllData,

    // Configuración
    setConfig,
    ENDPOINTS
  };
})();

// Exponer globalmente para service worker
if (typeof self !== 'undefined') {
  self.ApiClient = ApiClient;
}
