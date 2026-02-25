/**
 * Logger Module - ArbitrageAR v5.0
 * Sistema de logging centralizado
 */

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const Logger = (() => {
  const isDebugEnvironment = (() => {
    const isNodeDev = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
    if (isNodeDev) return true;

    if (typeof window === 'undefined') return false;

    const isLocalhost = window.location?.hostname === 'localhost';
    const globalDebugFlag = window.__ARBITRAGE_DEBUG__ === true;

    let storageDebugFlag = false;
    try {
      storageDebugFlag = window.localStorage?.getItem('arb_debug_logs') === 'true';
    } catch (_) {
      storageDebugFlag = false;
    }

    return isLocalhost || globalDebugFlag || storageDebugFlag;
  })();

  let currentLevel = isDebugEnvironment ? LogLevel.DEBUG : LogLevel.WARN;
  let prefix = '[ArbitrageAR]';

  // Historial de logs para debugging
  const history = [];
  const MAX_HISTORY = 100;

  /**
   * Agregar entrada al historial
   */
  const addToHistory = (level, message, args) => {
    history.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      args
    });

    // Mantener tamaño máximo
    if (history.length > MAX_HISTORY) {
      history.shift();
    }
  };

  /**
   * Formatear mensaje con timestamp
   */
  const formatMessage = (icon, message) => {
    return `${icon} ${prefix} ${message}`;
  };

  return {
    // Configuración
    setLevel: level => {
      currentLevel = level;
    },
    setPrefix: p => {
      prefix = p;
    },
    getHistory: () => [...history],
    clearHistory: () => {
      history.length = 0;
    },

    // Métodos de logging
    error: (message, ...args) => {
      addToHistory('ERROR', message, args);
      console.error(formatMessage('❌', message), ...args);
    },

    warn: (message, ...args) => {
      if (currentLevel >= LogLevel.WARN) {
        addToHistory('WARN', message, args);
        console.warn(formatMessage('⚠️', message), ...args);
      }
    },

    info: (message, ...args) => {
      if (currentLevel >= LogLevel.INFO) {
        addToHistory('INFO', message, args);
        console.log(formatMessage('ℹ️', message), ...args);
      }
    },

    debug: (message, ...args) => {
      if (currentLevel >= LogLevel.DEBUG) {
        addToHistory('DEBUG', message, args);
        console.log(formatMessage('🔍', message), ...args);
      }
    },

    // Helpers
    success: (message, ...args) => {
      if (currentLevel >= LogLevel.INFO) {
        addToHistory('SUCCESS', message, args);
        console.log(formatMessage('✅', message), ...args);
      }
    },

    group: label => {
      if (currentLevel >= LogLevel.DEBUG) {
        console.group(formatMessage('📁', label));
      }
    },

    groupEnd: () => {
      if (currentLevel >= LogLevel.DEBUG) {
        console.groupEnd();
      }
    },

    time: label => {
      if (currentLevel >= LogLevel.DEBUG) {
        console.time(`${prefix} ${label}`);
      }
    },

    timeEnd: label => {
      if (currentLevel >= LogLevel.DEBUG) {
        console.timeEnd(`${prefix} ${label}`);
      }
    },

    // Constantes
    Level: LogLevel
  };
})();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, LogLevel };
}

// Exponer globalmente para navegador
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.LogLevel = LogLevel;
}
