---
skillName: modules-dev
description: Agente especializado en desarrollo de módulos especializados
tags: [modules, filterManager, routeManager, simulator, modalManager]
---

# Modules Development Skill

## Descripción
Agente especializado en desarrollo de módulos especializados del proyecto.

## Capacidades

### Módulos del Sistema
- **FilterManager**: Sistema de filtros de rutas
- **RouteManager**: Gestión y visualización de rutas
- **Simulator**: Calculadora de ganancias
- **ModalManager**: Control de modales
- **NotificationManager**: Sistema de alertas

### Ubicación
Todos los módulos en: `src/modules/`

### Patrón Module (IIFE)
```javascript
const FilterManager = (() => {
  // Estado privado
  let activeFilters = {};
  let userSettings = null;

  // Métodos privados
  const applyMinProfitFilter = (routes, minProfit) => {
    return routes.filter(route => route.profitPercentage >= minProfit);
  };

  // Interfaz pública
  return {
    init: (settings, routes) => {
      userSettings = settings;
      activeFilters = { minProfit: settings.filterMinProfit || 0 };
    },

    applyFilters: (routes) => {
      let filtered = [...routes];
      for (const [key, value] of Object.entries(activeFilters)) {
        filtered = applyFilterByKey(key, filtered, value);
      }
      return filtered;
    },

    updateFilter: (key, value) => {
      activeFilters[key] = value;
    }
  };
})();
```

### FilterManager
```javascript
// Filtros disponibles
const FILTER_TYPES = {
  MIN_PROFIT: 'minProfit',
  EXCHANGES: 'preferredExchanges',
  P2P: 'hideP2P',
  TYPE: 'routeType'
};

// Uso
window.FilterManager.init(userSettings, allRoutes);
const filtered = window.FilterManager.applyFilters(allRoutes);
```

### RouteManager
```javascript
const RouteManager = (() => {
  let routes = [];
  let selectedIndex = null;

  return {
    init: (data, settings) => {
      routes = data?.optimizedRoutes || [];
    },

    getRouteById: (id) => routes.find(r => r.id === id),

    selectRoute: (index) => {
      selectedIndex = index;
      // Emit event
      document.dispatchEvent(new CustomEvent('routeSelected', {
        detail: routes[index]
      }));
    },

    sortRoutes: (by = 'profit') => {
      routes.sort((a, b) => b.profitPercentage - a.profitPercentage);
    }
  };
})();
```

### Simulator
```javascript
const Simulator = (() => {
  let currentRoute = null;
  let customAmount = 1000000;

  return {
    init: (data, settings) => {
      customAmount = settings?.defaultSimAmount || 1000000;
    },

    calculate: (amount, route) => {
      // Cálculo con fees personalizados
      const result = arbitrageCalculator.calculate({
        initialAmount: amount,
        ...route
      });
      return result;
    },

    setAmount: (amount) => {
      customAmount = amount;
    }
  };
})();
```

### ModalManager
```javascript
const ModalManager = (() => {
  let activeModal = null;

  return {
    init: (settings) => {},

    show: (modalId, content) => {
      const modal = document.getElementById(modalId);
      modal.innerHTML = content;
      modal.classList.add('active');
      activeModal = modalId;
    },

    hide: () => {
      if (activeModal) {
        document.getElementById(activeModal).classList.remove('active');
        activeModal = null;
      }
    }
  };
})();
```

### NotificationManager
```javascript
const NotificationManager = (() => {
  let settings = null;

  return {
    init: (userSettings) => {
      settings = userSettings;
    },

    checkThreshold: (route) => {
      if (route.profitPercentage >= settings.profitThreshold) {
        this.sendNotification(route);
      }
    },

    sendNotification: (route) => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Oportunidad de Arbitraje!',
        message: `${route.exchange}: ${route.profitPercentage.toFixed(2)}%`
      });
    }
  };
})();
```

### Instrucciones de Uso

1. **Nuevo módulo**: Crear archivo en `src/modules/`
2. **Nueva función**: Añadir a interfaz pública
3. **Nuevo filtro**: Añadir tipo y handler
4. **Nuevo evento**: Usar CustomEvent

---

## Notas Importantes

- Usar IIFE para encapsulamiento
- Estado privado, interfaz pública
- Inicializar con settings y data
- Emitir eventos para comunicación