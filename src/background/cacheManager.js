// ==========================================
// SISTEMA DE CACHÉ INTELIGENTE - ArbitrageAR-USDT
// ==========================================

(function(window) {
  'use strict';

  // Configuración de tiempos de caché (en milisegundos)
  const CACHE_CONFIG = {
    dolarOficial: 10 * 60 * 1000,      // 10 minutos
    usdtArs: 30 * 1000,                // 30 segundos
    usdtUsd: 60 * 1000                 // 1 minuto
  };

  // Almacenamiento en memoria para el caché
  const cacheStorage = {
    dolarOficial: null,
    usdtArs: null,
    usdtUsd: null
  };

  /**
   * Verifica si los datos en caché están vigentes
   * @param {string} cacheType - Tipo de caché a verificar
   * @returns {boolean} - true si está vigente, false si expiró
   */
  function isCacheValid(cacheType) {
    const cached = cacheStorage[cacheType];
    if (!cached || !cached.timestamp) {
      return false;
    }

    const now = Date.now();
    const age = now - cached.timestamp;
    const maxAge = CACHE_CONFIG[cacheType];

    return age < maxAge;
  }

  /**
   * Almacena datos en caché con timestamp
   * @param {string} cacheType - Tipo de caché
   * @param {any} data - Datos a almacenar
   */
  function setCache(cacheType, data) {
    cacheStorage[cacheType] = {
      data: data,
      timestamp: Date.now(),
      source: 'api'
    };

    console.log(`🗄️ [CACHE] Datos guardados en caché ${cacheType}:`, {
      timestamp: new Date().toISOString(),
      dataType: typeof data,
      dataSize: data ? (typeof data === 'object' ? Object.keys(data).length : 'primitive') : 'null'
    });
  }

  /**
   * Obtiene datos del caché si están vigentes
   * @param {string} cacheType - Tipo de caché
   * @returns {any|null} - Datos del caché o null si expiró
   */
  function getCache(cacheType) {
    if (!isCacheValid(cacheType)) {
      console.log(`🕒 [CACHE] Caché ${cacheType} expirado o inexistente`);
      return null;
    }

    const cached = cacheStorage[cacheType];
    const age = Date.now() - cached.timestamp;
    const maxAge = CACHE_CONFIG[cacheType];

    console.log(`✅ [CACHE] Usando datos de caché ${cacheType} (${Math.round(age/1000)}s/${Math.round(maxAge/1000)}s)`);
    return cached.data;
  }

  /**
   * Función inteligente que obtiene datos: del caché si es válido, o de la API si no
   * @param {string} cacheType - Tipo de caché
   * @param {Function} fetchFunction - Función para obtener datos de API
   * @param {Array} args - Argumentos para la función fetch
   * @returns {Promise<any>} - Datos (del caché o frescos)
   */
  async function getCachedOrFetch(cacheType, fetchFunction, args = []) {
    // Intentar obtener del caché primero
    const cachedData = getCache(cacheType);
    if (cachedData !== null) {
      return cachedData;
    }

    // Si no hay caché válido, obtener de API
    console.log(`🌐 [CACHE] Obteniendo datos frescos para ${cacheType}...`);
    const freshData = await fetchFunction(...args);

    // Guardar en caché si los datos son válidos
    if (freshData !== null && freshData !== undefined) {
      setCache(cacheType, freshData);
    }

    return freshData;
  }

  /**
   * Limpia el caché de un tipo específico
   * @param {string} cacheType - Tipo de caché a limpiar
   */
  function clearCache(cacheType) {
    cacheStorage[cacheType] = null;
    console.log(`🧹 [CACHE] Caché ${cacheType} limpiado`);
  }

  /**
   * Limpia todo el caché
   */
  function clearAllCache() {
    Object.keys(cacheStorage).forEach(cacheType => {
      clearCache(cacheType);
    });
    console.log('🧹 [CACHE] Todo el caché limpiado');
  }

  /**
   * Obtiene estadísticas del caché
   * @returns {Object} - Estadísticas actuales
   */
  function getCacheStats() {
    const stats = {};
    const now = Date.now();

    Object.keys(CACHE_CONFIG).forEach(cacheType => {
      const cached = cacheStorage[cacheType];
      if (cached && cached.timestamp) {
        const age = now - cached.timestamp;
        const maxAge = CACHE_CONFIG[cacheType];
        stats[cacheType] = {
          hasData: true,
          age: Math.round(age / 1000),
          maxAge: Math.round(maxAge / 1000),
          isValid: age < maxAge,
          percentage: Math.round((age / maxAge) * 100),
          timestamp: new Date(cached.timestamp).toISOString()
        };
      } else {
        stats[cacheType] = {
          hasData: false,
          age: 0,
          maxAge: Math.round(CACHE_CONFIG[cacheType] / 1000),
          isValid: false,
          percentage: 0,
          timestamp: null
        };
      }
    });

    return stats;
  }

  /**
   * Forza la actualización de un tipo de caché específico
   * @param {string} cacheType - Tipo de caché a forzar
   * @param {Function} fetchFunction - Función para obtener datos frescos
   * @param {Array} args - Argumentos para la función fetch
   * @returns {Promise<any>} - Datos frescos
   */
  async function forceRefresh(cacheType, fetchFunction, args = []) {
    console.log(`🔄 [CACHE] Forzando actualización de ${cacheType}...`);
    clearCache(cacheType);
    return await getCachedOrFetch(cacheType, fetchFunction, args);
  }

  // Exponer la API del Cache Manager
  window.CacheManager = {
    // Funciones principales
    getCachedOrFetch,
    getCache,
    setCache,

    // Funciones de mantenimiento
    clearCache,
    clearAllCache,
    forceRefresh,

    // Funciones de información
    isCacheValid,
    getCacheStats,

    // Configuración (solo lectura)
    CACHE_CONFIG: { ...CACHE_CONFIG }
  };

  console.log('🗄️ [CACHE] CacheManager inicializado');

})(typeof window !== 'undefined' ? window : global);
