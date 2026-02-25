# 📋 BUENAS PRÁCTICAS Y PATRONES DE DISEÑO - ArbitrageAR-USDT

**Fecha:** 25 de Febrero de 2026  
**Nivel:** Intermedio  
**Objetivo:** Entender las buenas prácticas y patrones de diseño utilizados en ArbitrageAR

---

## 🎯 FUNDAMENTOS DE DISEÑO DE SOFTWARE

### 1. **Principios SOLID**

#### **S - Single Responsibility Principle**
Cada módulo debe tener **una sola razón de cambio**:
```javascript
// ✅ Bueno - Cada módulo hace una cosa bien
class ExchangeRateManager {
  calculateRates(exchanges) { /* ... */ }
}

// ❌ Malo - Módulo con múltiples responsabilidades
class ExchangeRateManager {
  calculateRates(exchanges) { /* ... */ }
  renderUI(exchanges) { /* ... */ }
  saveToStorage() { /* ... */ }
  sendNotifications() { /* ... */
}
```

#### **O - Open/Closed Principle**
Las clases deben estar **abiertas para extensión pero cerradas para modificación:

```javascript
// ✅ Abierto para extensión
class FilterManager {
  constructor() {
    this.filters = {};
  }
  
  addFilter(name, filterFunction) {
    this.filters[name] = filterFunction;
  }
  
  applyFilters(routes) {
    Object.values(this.filters).forEach(filter => filter(routes));
  }
}

// ❌ Cerrado para modificación
class InternalCalculator {
  constructor() {
    this.internalData = {};
  }
  
  // No se puede modificar desde afuera
  calculate() { /* ... */ }
}
```

#### **L - Liskov Substitution Principle**
Las clases deben ser fáciles de extender:

```javascript
// ✅ Fácil de extender
class BaseCalculator {
  calculate(base, rates) {
    return base * rates;
  }
}

class AdvancedCalculator extends BaseCalculator {
  calculateAdvanced(base, rates, fees) {
    return super.calculate(base, rates) - fees;
  }
}

// ❌ Difícil de extender (acoplamiento fuerte)
class MonolithicCalculator {
  constructor() {
    this.internalLogic = {};
  }
  
  calculate() {
    // Lógica compleja y acoplada
    return this.internalLogic.calculate();
  }
}
```

---

## 🏗️ PATRONES DE DISEÑO UTILIZADOS EN ARBITRAGEAR

### 1. **Module Pattern**

```javascript
// ✅ Implementación modular
const ArbitrageCalculator = (() => {
  const config = { /* ... */ };
  
  const calculateArbitrage = (params) => {
    return { /* cálculo de arbitraje */ };
  };
  
  return { calculateArbitrage };
})();

// Uso en background.js
const calculator = ArbitrageCalculator;
const result = calculator.calculateArbitrage({
  montoInicial: 1000000,
  precioCompra: 1050,
  precioVenta: 1080
});
```

### 2. **Factory Pattern**

```javascript
// ✅ Fábrica de componentes
const RouteCardFactory = {
  create(type, data) {
    switch (type) {
      case 'simple':
        return createSimpleCard(data);
      case 'detailed':
        return createDetailedCard(data);
      case 'compact':
        return createCompactCard(data);
      default:
        return createDefaultCard(data);
    }
  }
  }
};

// Uso
const card = RouteCardFactory.create('detailed', routeData);
const container = document.getElementById('routes-container');
container.appendChild(card);
```

### 3. **Observer Pattern**

```javascript
// ✅ Sistema de eventos reactivos
class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }
}

// Uso en popup.js
const eventManager = new EventManager();
eventManager.subscribe('routeSelected', (route) => {
  showRouteDetails(route);
});
```

### 4. **Strategy Pattern**

```javascript
// ✅ Algoritmos intercambiables
class ArbitrageStrategy {
  constructor() {
    this.strategies = new Map();
  }
  
  addStrategy(name, strategy) {
    this.strategies.set(name, strategy);
  }
  
  calculate(data, strategyName) {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Estrategia ${strategyName} no encontrada`);
    }
    return strategy.calculate(data);
  }
}

// Implementación de estrategias
const strategies = new ArbitrageStrategy();
strategies.addStrategy('conservative', {
  calculate: (data) => {
    return { /* cálculo conservador */ };
  }
});

strategies.addStrategy('aggressive', {
  calculate: (data) => {
    return { /* cálculo agresivo */ };
  }
});
```

### 5. **Decorator Pattern**

```javascript
// ✅ Añadir funcionalidades sin modificar clases existentes
const withLogging = (fn) => {
  return function(...args) {
    console.log(`🔄 Iniciando: ${fn.name}`);
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();
    console.log(`✅ Completado: ${fn.name} en ${end - start}ms`);
    return result;
  };
};

// Uso
const calculateArbitrageWithLogging = withLogging(calculateArbitrage);
const result = calculateArbitrageWithLogging(params);
```

---

## 🔧 PATRONES ARQUITECTÓNICOS ESPECÍFICOS

### 1. **Nombres Descriptivos**

```javascript
// ✅ Claros y descriptivos
class ExchangeRateManager {
  // Buen nombre: describe lo que hace
  calculateRates(exchanges) { /* ... */ }
}

class DataProcessor {
  // Buen nombre: procesa datos
  processData(rawData) { /* ... */ }
}

// ❌ Confusos o genéricos
class Manager {
  // Nombre poco descriptivo
  doStuff() { /* ... */ }
}

// ✅ Nombres específicos del dominio
class DollarPriceService {
  // Específico para precios del dólar
  fetchOfficialRate() { /* ... */ }
}

class CryptoPriceService {
  // Específico para precios de criptomonedas
  fetchBTCPrice() { /* ... */ }
}
```

### 2. **Funciones Puras**

```javascript
// ✅ Una responsabilidad por función
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    minimumFractionDigits: 2
  }).format(amount);
}

// ✅ Sin efectos secundarios
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.value, 0);
};

// ❌ Múltiples responsabilidades
function processDataAndSaveAndNotify(data) {
  // Procesar, guardar y notificar - todo en una función
}
```

---

## 🎨 PATRONES DE ESTRUCTURA DE CÓDIGO

### 1. **Separación de Capas**

```javascript
// ✅ Capa de presentación (UI)
class UIRenderer {
  render(routes) {
    // Solo renderizado, sin lógica de negocio
  }
}

// ✅ Capa de negocio (lógica)
class BusinessLogic {
  calculateArbitrage(routes) {
    return routes.filter(route => route.profitPercentage > 0);
  }
}

// ✅ Capa de datos (acceso a APIs)
class DataAccessObject {
  fetchExchangeData() {
    // Solo obtiene datos de APIs
  }
}

// ❌ Mezclar capas
class GodObject {
  render() {
    // Renderiza, procesa y hace todo
  }
}
```

### 2. **Inyección de Dependencias**

```javascript
// ✅ Inyección explícita
const stateManager = (() => {
  // ...
  return { getState, setState, subscribe };
})();

// ❌ Acoplamiento implícito
const uiController = (() => {
  const state = stateManager.getState();
  
  const updateUI = () => {
    // Acceso directo al estado global
  document.getElementById('routes-container').innerHTML = generateRoutesHTML(state.routes);
  }
  
  return { updateUI };
})();
```

---

## 🔧 PATRONES DE OPTIMIZACIÓN

### 1. **Lazy Loading**

```javascript
// ✅ Cargar solo cuando se necesita
class LazyLoader {
  constructor() {
    this.loadedModules = new Set();
  }
  
  async loadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }
    
    try {
      const module = await import(`./modules/${moduleName}.js`);
      this.loadedModules.add(moduleName);
      return module;
    } catch (error) {
      console.error(`❌ Error cargando módulo ${moduleName}:`, error);
      throw error;
    }
  }
}

// Uso
const loader = new LazyLoader();
const filterModule = await loader.loadModule('filterManager');
```

### 2. **Memoización**

```javascript
// ✅ Cache de resultados costosos
class MemoCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.value;
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Eliminar entrada más antigua
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}

// Uso
const cache = new MemoCache();
const cachedResult = cache.get('exchangeRates');
if (cachedResult) {
  console.log('📦 Usando cache de tasas');
} else {
  console.log('🔄 Obteniendo tasas frescas...');
  const freshData = await fetchExchangeRates();
  cache.set('exchangeRates', freshData);
}
```

---

## 🛡️ PATRONES DE SEGURIDAD

### 1. **Validación de Entrada**

```javascript
// ✅ Validación en múltiples capas
class InputValidator {
  validateAmount(amount) {
    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      throw new Error('Monto inválido');
    }
    return true;
  }
  
  validateExchange(exchange) {
    if (!change || typeof change !== 'string') {
      throw new Error('Exchange inválido');
    }
    return true;
  }
}

// Uso en capas de validación
const validator = new InputValidator();
validator.validateAmount(1000); // ✅
validator.validateExchange('Buenbit'); // ✅
```

### 2. **Sanitización de Datos**

```javascript
// ✅ Sanitización de HTML
const sanitizeHTML = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

const sanitizeText = (text) => {
  return text.replace(/<script[^<]*?<\/script>/gi, '');
};
```

### 3. **Principio de Menor Privilegio**

```javascript
// ✅ Validar permisos antes de operaciones sensibles
const checkPermissions = async (permissions) => {
  const hasPermissions = await chrome.permissions.contains(permissions);
  
  if (!hasPermissions) {
    throw new Error('Permisos denegados');
  }
};

// ✅ Usar APIs seguras
const secureFetch = async (url, options = {}) => {
  await checkPermissions(['site']);
  return fetch(url, {
    ...options,
    headers: {
      'Content-Security-Policy': "script-src 'self'"
    }
  });
};
```

---

## 🎨 PATRONES DE TESTING

### 1. **Test Driven Development**

```javascript
// ✅ Tests que guían el desarrollo
describe('ArbitrageCalculator', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new ArbitrageCalculator();
  });
  
  it('debe calculate profit with valid parameters', () => {
    const result = calculator.calculate({
      montoInicial: 1000000,
      precioCompra: 1050,
      precioVenta: 1080
    });
    
    expect(result.gananciaNeta).toBeGreaterThan(0);
    expect(result.porcentajeGanancia).toBeLessThan(10);
  });
});
```

### 2. **AAA: Arrange-Act-Assert-Assert**

```javascript
// ✅ Tests claros y mantenibles
describe('ExchangeRateManager', () => {
  let rateManager;
  
  beforeEach(() => {
    rateManager = new ExchangeRateManager();
  });
  
  it('should return rates for valid exchanges', () => {
    const exchanges = [
      { exchange: 'buenbit', ask: 1050, bid: 1080 },
      { exchange: 'lemon', ask: 1052, bid: 1082 }
    ];
    
    const rates = rateManager.calculateRates(exchanges);
    
    expect(rates).toHaveProperty('buenbit');
    expect(rates).toHaveProperty('lemon');
  });
});
```

---

## 📋 EJERCICIOS DE REFACTORING

### Ejercicio 1: Extraer una Clase Reutilizable

**Objetivo:** Identificar código duplicado y extraerlo a una clase reutilizable.

**Instrucciones:**
1. Busca código duplicado en `popup.js`
2. Identifica patrones repetidos
3. Extrae la lógica común a una clase base
4. Crea una clase base reutilizable

```javascript
// Código duplicado en popup.js
function createRouteCard(route) {
  // Lógica para crear tarjeta
  const card = document.createElement('div');
  card.className = 'route-card';
  card.innerHTML = `
    <h3>${route.exchange}</h3>
    <div class="profit">${route.profitPercentage}%</div>
    <button class="details-btn">Ver detalles</button>
  `;
  
  return card;
}

function createDetailedCard(route) {
  // Lógica más detallada
  const card = document.createElement('div');
  card.className = 'route-card detailed';
  card.innerHTML = `
    <h3>${route.exchange}</h3>
    <div class="profit-details">
      <div>Compra: $${route.buyPrice}</div>
      <div>Venta: $${route.sellPrice}</div>
      <div>Ganancia: ${route.profitPercentage}%</div>
    </div>
    <button class="details-btn">Ver detalles</button>
  `;
  
  return card;
}

// Clase base reutilizable
class BaseRouteCard {
  createHeader(exchange) {
    const header = document.createElement('div');
    header.className = 'route-header';
    header.innerHTML = `
      <h3>${change.exchange}</h3>
      <span class="timestamp">${new Date(change.timestamp).toLocaleString()}</span>
    `;
    return header;
  }
  
  createContent(content) {
    const content = document.createElement('div');
    content.className = 'route-content';
    content.innerHTML = content;
    return content;
  }
  
  createFooter(exchange) {
    const footer = document.createElement('div');
    footer.className = 'route-footer';
    footer.innerHTML = `
      <button class="action-btn">Operar</button>
    `;
    return footer;
  }
  
  render(route) {
    const card = document.createElement('div');
    card.className = 'route-card';
    
    card.appendChild(this.createHeader(route));
    card.appendChild(this.createContent(route.details));
    card.appendChild(this.createFooter(route));
    
    return card;
  }
}

// Refactorizar funciones usando la clase base
function createSimpleCard(route) {
  const card = new BaseRouteCard();
  return card.render(route);
}

function createDetailedCard(route) {
  const card = new BaseRouteCard();
  return card.render({
    ...route,
    details: `
      <div class="profit-breakdown">
        <div>Comisión: $${route.comisiones.total}</div>
        <div>Tiempo: ${route.duration}ms</div>
      </div>
    `
  });
}
```

---

## 🎯 MEJORAS CONTINUAS

### 1. **Declaración de Constantes**

```javascript
// ✅ Constantes descriptivas al inicio del archivo
const EXCHANGES = {
  BUENBIT: 'bna',
  LEMON: 'lemon',
  RIPIO: 'ripio',
  BUENBIT_CRIPTOYA: 'buenbit-criptoya',
  DOLARAPI: 'dolarapi.com'
};

// ✅ Configuración centralizada
const CONFIG = {
  API_TIMEOUT: 12000,
  DEFAULT_MIN_PROFIT: -10.0,
  MAX_ROUTES_DISPLAY: 20,
  UPDATE_INTERVAL: 60000 // 1 minuto
};
```

### 2. **Eliminación de Código Muerto**

```javascript
// ❌ Código comentado en lugar de eliminar
// function oldCalculate() {
//   return { profit: 0 };
// }

// ✅ Código limpio
function newCalculate() {
  return { profit: calculateArbitrage(params) };
}
```

---

## 📋 RESUMEN DEL MÓDULO

### ✅ Patrones Identificados

1. **Module Pattern**: Para modularidad y reutilización
2. **Factory Pattern**: Para creación de componentes
3. **Observer Pattern**: Para sistemas de eventos reactivos
4. **Strategy Pattern**: Para algoritmos intercambiables
5. **Singleton Pattern**: Para estado global
6. **Decorator Pattern**: Para añadir funcionalidades
7. **Repository Pattern**: Para abstracción de acceso a datos

### 🎯 Beneficios de Estos Patrones

1. **Mantenibilidad**: Código más fácil de modificar y extender
2. **Testeabilidad**: Cada componente se puede probar independientemente
3. **Reutilización**: Componentes pueden usarse en múltiples lugares
4. **Claridad**: Cada componente tiene una responsabilidad clara
5. **Colaboración**: Equipos pueden trabajar en paralelo

---

**¿Listo para implementar estos patrones en tus propios proyectos?**