---
skillName: utils-dev
description: Agente especializado en desarrollo de utilidades
tags: [utils, formatters, stateManager, logger, helpers]
---

# Utils Development Skill

## Descripción
Agente especializado en desarrollo de utilidades del proyecto.

## Capacidades

### Utilidades del Sistema
- **StateManager**: Gestión de estado global
- **Formatters**: Formateo de números, monedas, fechas
- **Logger**: Sistema de logs estructurados
- **CommonUtils**: Funciones auxiliares

### Ubicación
Todos los utils en: `src/utils/`

### StateManager
```javascript
const StateManager = (() => {
  const state = new Map();
  const listeners = new Map();

  return {
    get: (key) => state.get(key),

    set: (key, value) => {
      state.set(key, value);
      // Notify listeners
      if (listeners.has(key)) {
        listeners.get(key).forEach(fn => fn(value));
      }
    },

    subscribe: (key, callback) => {
      if (!listeners.has(key)) {
        listeners.set(key, []);
      }
      listeners.get(key).push(callback);
    },

    unsubscribe: (key, callback) => {
      if (listeners.has(key)) {
        listeners.set(key, listeners.get(key).filter(fn => fn !== callback));
      }
    }
  };
})();

// Alias corto
window.State = StateManager;
```

### Formatters
```javascript
const Formatters = (() => {
  const formatCurrency = (amount, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-AR');
  };

  return {
    currency: formatCurrency,
    percent: formatPercent,
    number: formatNumber,
    date: formatDate
  };
})();

// Uso
Fmt.currency(1000000);    // "$1.000.000,00"
Fmt.percent(15.5);        // "15.50%"
Fmt.date(Date.now());     // "25/02/2026, 14:32:15"
```

### Logger
```javascript
const Logger = (() => {
  const DEBUG_MODE = false;

  const PREFIXES = {
    POPUP: '[POPUP]',
    BG: '[BACKGROUND]',
    API: '[API]',
    CALC: '[CALC]',
    UI: '[UI]'
  };

  const log = (prefix, ...args) => {
    if (DEBUG_MODE) {
      console.log(`${PREFIXES[prefix] || ''}`, ...args);
    }
  };

  const error = (prefix, ...args) => {
    console.error(`${PREFIXES[prefix] || ''}`, ...args);
  };

  const warn = (prefix, ...args) => {
    console.warn(`${PREFIXES[prefix] || ''}`, ...args);
  };

  return {
    log,
    error,
    warn,
    setDebug: (mode) => { DEBUG_MODE = mode; }
  };
})();
```

### CommonUtils
```javascript
const CommonUtils = (() => {
  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };

  const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const isEmpty = (obj) => {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  };

  return {
    debounce,
    throttle,
    sleep,
    clamp,
    isEmpty
  };
})();
```

### Instrucciones de Uso

1. **Nuevo formatter**: Añadir función a Formatters
2. **Nuevo log prefix**: Añadir a PREFIXES
3. **Nueva utilidad**: Añadir a CommonUtils
4. **Nuevo state key**: Usar State.set/get

---

## Notas Importantes

- StateManager para estado global
- Formatters con Intl.NumberFormat
- Logger con prefijos estructurados
- CommonUtils con debounce/throttle