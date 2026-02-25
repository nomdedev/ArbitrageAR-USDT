/**
 * Common Utilities Module
 * Módulo con funciones utilitarias comunes para toda la aplicación
 * @module CommonUtils
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  // ==========================================
  // CONSTANTES
  // ==========================================

  const ANIMATION_DELAY_MS = 50;
  const TOAST_DURATION_MS = 3000;
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  const PROFIT_THRESHOLDS = {
    HIGH: 2,
    POSITIVE: 0,
    LOW_NEGATIVE: -2
  };

  const FRESHNESS_LEVELS = {
    FRESH_MINUTES: 3,
    MODERATE_MINUTES: 5
  };

  // ==========================================
  // FUNCIONES DE SANITIZACIÓN
  // ==========================================

  /**
   * Sanitizar HTML para prevenir XSS
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  function sanitizeHTML(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Crear elemento HTML de manera segura
   * @param {string} tag - Etiqueta HTML
   * @param {string} content - Contenido de texto
   * @param {string} className - Clase CSS opcional
   * @returns {HTMLElement} Elemento creado
   */
  function createSafeElement(tag, content, className = '') {
    const element = document.createElement(tag);
    element.textContent = content;
    if (className) element.className = className;
    return element;
  }

  /**
   * Establecer innerHTML de manera segura
   * @param {HTMLElement} element - Elemento a modificar
   * @param {string} html - HTML a insertar
   */
  function setSafeHTML(element, html) {
    if (typeof html !== 'string') {
      console.warn('⚠️ [CommonUtils] setSafeHTML recibió contenido no string:', html);
      element.innerHTML = '';
      return;
    }
    element.innerHTML = html;
  }

  // ==========================================
  // FUNCIONES DE FORMATO
  // ==========================================

  /**
   * Formatear número con separadores de miles
   * @param {number} value - Valor a formatear
   * @param {number} decimals - Cantidad de decimales
   * @returns {string} Número formateado
   */
  function formatNumber(value, decimals = 0) {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Formatear moneda
   * @param {number} value - Valor a formatear
   * @param {string} currency - Código de moneda
   * @returns {string} Moneda formateada
   */
  function formatCurrency(value, currency = 'ARS') {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Formatear porcentaje
   * @param {number} value - Valor a formatear
   * @param {number} decimals - Cantidad de decimales
   * @returns {string} Porcentaje formateado
   */
  function formatPercent(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Capitalizar primera letra
   * @param {string} str - String a capitalizar
   * @returns {string} String capitalizado
   */
  function capitalizeFirst(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ==========================================
  // FUNCIONES DE CLASIFICACIÓN
  // ==========================================

  /**
   * Obtener clases CSS de profit
   * @param {number} percentage - Porcentaje de ganancia
   * @returns {Object} Objeto con clases CSS
   */
  function getProfitClasses(percentage) {
    const isNegative = percentage < 0;
    let profitClass = 'profit-neutral';
    let profitBadgeClass = 'badge-neutral';

    if (percentage >= PROFIT_THRESHOLDS.HIGH) {
      profitClass = 'profit-high';
      profitBadgeClass = 'badge-high';
    } else if (percentage >= PROFIT_THRESHOLDS.POSITIVE) {
      profitClass = 'profit-positive';
      profitBadgeClass = 'badge-positive';
    } else if (percentage >= PROFIT_THRESHOLDS.LOW_NEGATIVE) {
      profitClass = 'profit-low-negative';
      profitBadgeClass = 'badge-low-negative';
    } else {
      profitClass = 'profit-negative';
      profitBadgeClass = 'badge-negative';
    }

    return { isNegative, profitClass, profitBadgeClass };
  }

  /**
   * Obtener nivel de frescura de datos
   * @param {number} timestamp - Timestamp de los datos
   * @returns {Object} Información de frescura
   */
  function getDataFreshnessLevel(timestamp) {
    if (!timestamp) {
      return {
        level: 'stale',
        icon: '🔴',
        color: '#dc3545',
        ageMinutes: null,
        message: 'Sin timestamp'
      };
    }

    const now = Date.now();
    const dataTime = new Date(timestamp).getTime();
    const ageMs = now - dataTime;
    const ageMinutes = Math.floor(ageMs / 60000);

    if (ageMinutes < FRESHNESS_LEVELS.FRESH_MINUTES) {
      return {
        level: 'fresh',
        icon: '🟢',
        color: '#28a745',
        ageMinutes,
        message: 'Datos frescos'
      };
    } else if (ageMinutes < FRESHNESS_LEVELS.MODERATE_MINUTES) {
      return {
        level: 'moderate',
        icon: '🟡',
        color: '#ffc107',
        ageMinutes,
        message: 'Datos recientes'
      };
    } else {
      return {
        level: 'stale',
        icon: '🔴',
        color: '#dc3545',
        ageMinutes,
        message: 'Datos desactualizados'
      };
    }
  }

  // ==========================================
  // FUNCIONES DE VALIDACIÓN
  // ==========================================

  /**
   * Validar si un valor es un número válido
   * @param {*} value - Valor a validar
   * @returns {boolean} True si es un número válido
   */
  function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Validar si un valor es un número positivo
   * @param {*} value - Valor a validar
   * @returns {boolean} True si es un número positivo
   */
  function isPositiveNumber(value) {
    return isValidNumber(value) && value > 0;
  }

  /**
   * Validar si un objeto tiene propiedades requeridas
   * @param {Object} obj - Objeto a validar
   * @param {string[]} requiredProps - Propiedades requeridas
   * @returns {boolean} True si tiene todas las propiedades
   */
  function hasRequiredProperties(obj, requiredProps) {
    if (!obj || typeof obj !== 'object') return false;
    return requiredProps.every(prop => prop in obj && obj[prop] !== undefined);
  }

  // ==========================================
  // FUNCIONES DE THROTTLE/DEBOUNCE
  // ==========================================

  /**
   * Crear función debounce
   * @param {Function} func - Función a debouncear
   * @param {number} wait - Tiempo de espera en ms
   * @returns {Function} Función debounceda
   */
  function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Crear función throttle
   * @param {Function} func - Función a throttlear
   * @param {number} limit - Límite de tiempo en ms
   * @returns {Function} Función throttleda
   */
  function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ==========================================
  // FUNCIONES DE DOM
  // ==========================================

  /**
   * Esperar a que un elemento esté disponible en el DOM
   * @param {string} selector - Selector CSS
   * @param {number} timeout - Tiempo máximo de espera en ms
   * @returns {Promise<HTMLElement>} Promise que resuelve con el elemento
   */
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Scroll suave hacia un elemento
   * @param {string|HTMLElement} target - Selector o elemento
   * @param {number} offset - Offset desde el top
   */
  function smoothScrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

    if (prefersReducedMotion) {
      window.scrollTo(0, targetPosition);
    } else {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  // ==========================================
  // FUNCIONES DE ASYNC/RETRY
  // ==========================================

  /**
   * Reintentar una función async con retraso
   * @param {Function} fn - Función a reintentar
   * @param {number} retries - Cantidad de reintentos
   * @param {number} delay - Delay entre reintentos en ms
   * @returns {Promise} Promise de la función
   */
  async function retryAsync(fn, retries = MAX_RETRIES, delay = RETRY_DELAY_MS) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      console.warn(`⚠️ [CommonUtils] Reintentando... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryAsync(fn, retries - 1, delay);
    }
  }

  /**
   * Ejecutar funciones en paralelo con límite de concurrencia
   * @param {Array<Function>} tasks - Array de funciones a ejecutar
   * @param {number} concurrency - Límite de concurrencia
   * @returns {Promise<Array>} Promise con resultados
   */
  async function parallel(tasks, concurrency = 5) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });

      results.push(promise);
      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  // ==========================================
  // FUNCIONES DE MEMOIZATION
  // ==========================================

  /**
   * Crear función memoizada
   * @param {Function} fn - Función a memoizar
   * @returns {Function} Función memoizada
   */
  function memoize(fn) {
    const cache = new Map();

    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }

  // ==========================================
  // FUNCIONES DE FECHA/HORA
  // ==========================================

  /**
   * Formatear timestamp a fecha local
   * @param {number} timestamp - Timestamp a formatear
   * @returns {string} Fecha formateada
   */
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-AR');
  }

  /**
   * Formatear timestamp a hora local
   * @param {number} timestamp - Timestamp a formatear
   * @returns {string} Hora formateada
   */
  function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('es-AR');
  }

  /**
   * Obtener diferencia en minutos desde timestamp
   * @param {number} timestamp - Timestamp a comparar
   * @returns {number} Minutos de diferencia
   */
  function getMinutesAgo(timestamp) {
    if (!timestamp) return null;
    const now = Date.now();
    const diff = now - timestamp;
    return Math.floor(diff / 60000);
  }

  // ==========================================
  // FUNCIONES DE DEBUG/LOGGING
  // ==========================================

  /**
   * Crear logger con niveles
   * @param {string} prefix - Prefijo para los logs
   * @returns {Object} Objeto con funciones de log
   */
  function createLogger(prefix) {
    const isDevelopment = process?.env?.NODE_ENV === 'development' ||
                          window.location?.hostname === 'localhost';

    let debugLogsEnabled = isDevelopment || window.__ARBITRAGE_DEBUG__ === true;
    try {
      debugLogsEnabled = debugLogsEnabled || window.localStorage?.getItem('arb_debug_logs') === 'true';
    } catch (_) {
      // Ignorar errores de acceso a localStorage
    }

    return {
      debug: (...args) => {
        if (debugLogsEnabled && window.Logger?.debug) {
          window.Logger.debug(`[${prefix}]`, ...args);
        }
      },
      info: (...args) => {
        if (debugLogsEnabled && window.Logger?.info) {
          window.Logger.info(`[${prefix}]`, ...args);
        }
      },
      warn: (...args) => {
        if (window.Logger?.warn) {
          window.Logger.warn(`[${prefix}]`, ...args);
        } else {
          console.warn(`[${prefix}]`, ...args);
        }
      },
      error: (...args) => {
        if (window.Logger?.error) {
          window.Logger.error(`[${prefix}]`, ...args);
        } else {
          console.error(`[${prefix}]`, ...args);
        }
      }
    };
  }

  // ==========================================
  // EXPORTAR MÓDULO
  // ==========================================

  const CommonUtils = {
    // Constantes
    ANIMATION_DELAY_MS,
    TOAST_DURATION_MS,
    MAX_RETRIES,
    RETRY_DELAY_MS,
    PROFIT_THRESHOLDS,
    FRESHNESS_LEVELS,

    // Sanitización
    sanitizeHTML,
    createSafeElement,
    setSafeHTML,

    // Formato
    formatNumber,
    formatCurrency,
    formatPercent,
    capitalizeFirst,

    // Clasificación
    getProfitClasses,
    getDataFreshnessLevel,

    // Validación
    isValidNumber,
    isPositiveNumber,
    hasRequiredProperties,

    // Throttle/Debounce
    debounce,
    throttle,

    // DOM
    waitForElement,
    smoothScrollTo,

    // Async/Retry
    retryAsync,
    parallel,

    // Memoization
    memoize,

    // Fecha/Hora
    formatTimestamp,
    formatTime,
    getMinutesAgo,

    // Debug/Logging
    createLogger
  };

  // Exportar para uso global
  window.CommonUtils = CommonUtils;

})(window);
