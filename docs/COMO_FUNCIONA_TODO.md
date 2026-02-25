# 🚀 CÓMO FUNCIONA TODO - Guía Completa del Flujo

**Fecha:** 25 de Febrero de 2026  
**Versión:** v6.0.0  
**Propósito:** Explicación detallada del funcionamiento completo

---

## 🎯 FLUJO COMPLETO DESDE EL INICIO

### Paso 1: Haces Clic en el Ícono de la Extensión

```
🖱️ Usuario hace clic → popup.html se abre → popup.js se ejecuta
```

**¿Qué sucede exactamente?**

1. **Se carga [`popup.html`](src/popup.html:1)**:
   - Carga todos los CSS (design system, componentes, etc.)
   - Carga los iconos SVG optimizados (~5KB)
   - Prepara la estructura con pestañas y contenedores

2. **Se ejecuta [`popup.js`](src/popup.js:1)**:
   - Verifica que todos los módulos estén cargados (líneas 25-52)
   - Crea aliases para facilitar el uso (líneas 55-62)
   - Espera a que el DOM esté listo (línea 85)

---

### Paso 2: Inicialización del Sistema

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Cargar configuración del usuario
  await loadUserSettings();
  
  // 2. Inicializar módulos especializados
  Sim.init(currentData, userSettings);     // Simulador
  RteMgr.init(currentData, userSettings);   // Gestor de rutas
  FltMgr.init(userSettings, []);           // Gestor de filtros
  ModMgr.init(userSettings);                // Gestor de modales
  NotifMgr.init(userSettings);             // Gestor de notificaciones
  
  // 3. Configurar UI
  setupTabNavigation();
  setupRefreshButton();
  setupDollarPriceControls();
  
  // 4. Cargar y mostrar datos
  fetchAndDisplay();
});
```

**¿Qué hace cada módulo?**

- **StateManager**: Guarda el estado global de la aplicación
- **Formatters**: Formatea números, monedas y porcentajes
- **Simulator**: Calculadora de ganancias personalizadas
- **RouteManager**: Gestiona y muestra las rutas de arbitraje
- **FilterManager**: Maneja los filtros de rutas
- **ModalManager**: Controla las ventanas emergentes
- **NotificationManager**: Sistema de alertas y notificaciones

---

### Paso 3: Obtención de Datos (fetchAndDisplay)

```javascript
async function fetchAndDisplay(retryCount = 0) {
  // 1. Mostrar spinner de carga
  loading.style.display = 'block';
  
  // 2. Cargar configuración del usuario
  const settings = await chrome.storage.local.get('notificationSettings');
  
  // 3. Enviar mensaje al Service Worker
  chrome.runtime.sendMessage({ action: 'getArbitrages' }, data => {
    // 4. Procesar respuesta
    if (data && data.optimizedRoutes) {
      handleSuccessfulData(data, container);
    } else {
      // Manejar errores
    }
  });
}
```

**¿Qué sucede en el fondo?**

1. **Popup envía mensaje**: `{ action: 'getArbitrages' }`
2. **Service Worker recibe**: [`main-simple.js`](src/background/main-simple.js:1) procesa
3. **Service Worker obtiene datos**:
   - Llama a [`apiClient.js`](src/background/apiClient.js:1) para obtener precios
   - Usa [`arbitrageCalculator.js`](src/background/arbitrageCalculator.js:1) para calcular
   - Devuelve las rutas optimizadas

---

### Paso 4: Procesamiento de Datos en el Background

#### 4.1 Obtención de Precios (apiClient.js)

```javascript
const ENDPOINTS = {
  CRIPTOYA_USDT_ARS: 'https://criptoya.com/api/usdt/ars/1',
  CRIPTOYA_BANKS: 'https://criptoya.com/api/bancostodos',
  DOLARAPI_OFICIAL: 'https://dolarapi.com/v1/dolares/oficial'
};

// Con timeout de 12 segundos y rate limiting
const fetchWithTimeout = async (url, options = {}) => {
  await applyRateLimit();
  // ... lógica de fetch con timeout
};
```

**Fuentes de datos:**
- **Criptoya**: Precios de USDT y exchanges
- **DolarAPI**: Dólar oficial argentino
- **Bancos**: BNA, Galicia, Santander, BBVA, ICBC

#### 4.2 Cálculo de Arbitraje (arbitrageCalculator.js)

```javascript
const calculateSimpleArbitrage = params => {
  const { initialAmount, dollarBuyPrice, usdtSellPrice, fees } = params;
  
  // Paso 1: Comprar USD con ARS
  const usdBought = initialAmount / dollarBuyPrice;
  
  // Paso 2: Aplicar comisión bancaria
  const usdAfterBankFee = usdBought * (1 - bankFee);
  
  // Paso 3: Comprar USDT con USD
  const usdtBought = usdAfterBankFee * (1 - tradingFee);
  
  // Paso 4: Vender USDT por ARS
  const finalAmount = usdtBought * usdtSellPrice * (1 - tradingFee);
  
  return {
    profit: finalAmount - initialAmount,
    profitPercentage: ((finalAmount - initialAmount) / initialAmount) * 100
  };
};
```

**Ruta de arbitraje:** ARS → USD (banco) → USDT → ARS

**Comisiones consideradas:**
- Trading: 0.1% por defecto
- Retiro: 0.05% por defecto
- Bancaria: 0% por defecto (configurable)

---

### Paso 5: Procesamiento de Datos en el Popup

#### 5.1 Manejo de Datos Exitosos (handleSuccessfulData)

```javascript
function handleSuccessfulData(data, container) {
  // 1. Actualizar estado global
  currentData = data;
  State.set('currentData', data);
  
  // 2. Mostrar información del mercado
  updateConnectionStatus(data);
  displayMarketHealth(data.marketHealth);
  displayDollarInfo(data.oficial);
  
  // 3. Procesar rutas
  if (data.optimizedRoutes && data.optimizedRoutes.length > 0) {
    allRoutes = data.optimizedRoutes;
    updateFilterCounts();
    applyP2PFilter();
  }
}
```

#### 5.2 Aplicación de Preferencias del Usuario

```javascript
function applyUserPreferences(routes) {
  let filtered = [...routes];
  
  // 1. Filtrar por ganancia mínima
  filtered = applyMinProfitFilter(filtered, userSettings?.filterMinProfit);
  
  // 2. Filtrar por exchanges preferidos
  filtered = applyPreferredExchangesFilter(filtered, userSettings?.preferredExchanges);
  
  // 3. Ordenar según preferencias
  filtered = applySorting(filtered, userSettings.preferSingleExchange, userSettings.sortByProfit);
  
  // 4. Limitar cantidad mostrada
  const maxDisplay = userSettings.maxRoutesDisplay || 20;
  filtered = applyLimit(filtered, maxDisplay);
  
  return filtered;
}
```

---

### Paso 6: Visualización de Rutas (displayOptimizedRoutes)

#### 6.1 Si no hay rutas disponibles

```html
<div class="empty-state-card">
  <div class="empty-state-header">
    <span class="empty-state-emoji">📊</span>
    <h3>Estado del Mercado</h3>
    <p>No se encontraron oportunidades</p>
  </div>
  
  <div class="empty-state-reasons">
    <div class="reason-item">
      <span class="reason-icon">🎯</span>
      <span class="reason-label">Umbral muy alto</span>
    </div>
    <!-- Más razones... -->
  </div>
</div>
```

#### 6.2 Si hay rutas disponibles

```javascript
// Ordenar por profitPercentage (mayor a menor)
routes.sort((a, b) => {
  const profitA = a.profitPercentage || 0;
  const profitB = b.profitPercentage || 0;
  return profitB - profitA;
});

// Generar HTML para cada ruta
routes.forEach(route => {
  const routeHTML = generateRouteCard(route);
  container.innerHTML += routeHTML;
});
```

---

### Paso 7: Interacción del Usuario

#### 7.1 Click en una Ruta de Arbitraje

```javascript
// Event listener configurado en la inicialización
document.addEventListener('routeSelected', function(e) {
  const route = e.detail;
  showRouteDetailsByType(route);
});

function showRouteDetailsByType(route) {
  // Generar modal con desglose completo
  const modalHTML = generateRouteModal(route);
  
  // Mostrar modal con animación
  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
}
```

#### 7.2 Modal de Detalles

```html
<div class="route-details-modal">
  <h3>📊 Desglose de la Operación</h3>
  
  <div class="breakdown-section">
    <div class="section-header">1. Compra de ${route.crypto}</div>
    <div class="breakdown-row">
      <span class="label">Inversión inicial</span>
      <span class="value">$${initialAmount} ARS</span>
    </div>
    <!-- Más detalles... -->
  </div>
  
  <div class="final-summary profitable">
    <div class="summary-row result">
      <span class="label">✅ Ganancia Neta</span>
      <span class="value profit">+$${netProfit} ARS</span>
    </div>
  </div>
</div>
```

---

## 🔄 FLUJO DE ACTUALIZACIÓN AUTOMÁTICA

### Service Worker en Segundo Plano

```javascript
// En main-simple.js
chrome.alarms.create('updateData', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateData') {
    // Obtener nuevos datos cada minuto
    fetchAllData();
    calculateArbitrages();
    
    // Enviar notificaciones si hay oportunidades
    checkProfitThresholds();
  }
});
```

### Notificaciones Inteligentes

```javascript
// Si hay机会 con ganancia > umbral configurado
if (route.profitPercentage >= userSettings.profitThreshold) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '¡Oportunidad de Arbitraje!',
    message: `${route.broker}: ${route.profitPercentage.toFixed(2)}% de ganancia`
  });
}
```

---

## 🎛️ SISTEMA DE CONFIGURACIÓN

### Options Page (options.html)

```javascript
// Guardar configuración
function saveSettings() {
  const settings = {
    profitThreshold: parseFloat(document.getElementById('profit-threshold').value),
    preferredExchanges: getSelectedExchanges(),
    maxRoutesDisplay: parseInt(document.getElementById('max-routes').value),
    enableNotifications: document.getElementById('enable-notifications').checked
  };
  
  chrome.storage.local.set({ notificationSettings: settings });
}
```

### Sincronización con Popup

```javascript
// El popup carga la configuración al iniciar
const settings = await chrome.storage.local.get('notificationSettings');
userSettings = settings.notificationSettings || {};

// Y escucha cambios en tiempo real
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.notificationSettings) {
    userSettings = changes.notificationSettings.newValue;
    // Aplicar cambios inmediatamente
    applyUserPreferences(allRoutes);
  }
});
```

---

## 🔧 SISTEMA DE FILTROS

### Tipos de Filtros Disponibles

1. **Por Ganancia Mínima**: Solo muestra rutas con X% o más
2. **Por Exchanges**: Filtra por exchanges preferidos
3. **Por Tipo**: Single-exchange vs Multi-exchange
4. **P2P**: Incluir/excluir rutas P2P
5. **Por Criptomoneda**: BTC, ETH, USDC, etc.

### Aplicación de Filtros

```javascript
function applyFilters(routes) {
  return routes.filter(route => {
    // Filtro de ganancia mínima
    if (route.profitPercentage < userSettings.filterMinProfit) {
      return false;
    }
    
    // Filtro de exchanges preferidos
    if (userSettings.preferredExchanges.length > 0) {
      if (!userSettings.preferredExchanges.includes(route.broker)) {
        return false;
      }
    }
    
    // Filtro P2P
    if (userSettings.hideP2P && route.isP2P) {
      return false;
    }
    
    return true;
  });
}
```

---

## 📊 SIMULADOR DE GANANCIAS

### Cálculo Personalizado

```javascript
function calculateSimulation(amount, route) {
  // Aplicar comisiones personalizadas
  const tradingFee = userSettings.customTradingFee || route.tradingFee;
  const bankFee = userSettings.customBankFee || route.bankFee;
  
  // Calcular con el monto específico
  const result = calculateArbitrage({
    initialAmount: amount,
    dollarBuyPrice: route.dollarBuyPrice,
    usdtSellPrice: route.usdtSellPrice,
    fees: { trading: tradingFee, bank: bankFee }
  });
  
  return {
    investment: amount,
    return: result.finalAmount,
    profit: result.profit,
    profitPercentage: result.profitPercentage,
    fees: {
      trading: amount * tradingFee,
      bank: amount * bankFee,
      total: amount * (tradingFee + bankFee)
    }
  };
}
```

---

## 🛡️ SISTEMA DE SEGURIDAD

### Validación de Datos

```javascript
function validateRouteData(route) {
  // Verificar que todos los campos necesarios existan
  const requiredFields = ['broker', 'profitPercentage', 'dollarBuyPrice', 'usdtSellPrice'];
  
  for (const field of requiredFields) {
    if (route[field] === undefined || route[field] === null) {
      console.warn(`Campo faltante: ${field}`);
      return false;
    }
  }
  
  // Verificar que los precios sean racionales
  if (route.dollarBuyPrice <= 0 || route.usdtSellPrice <= 0) {
    console.warn('Precios inválidos detectados');
    return false;
  }
  
  return true;
}
```

### Sanitización de HTML

```javascript
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Uso seguro
container.innerHTML = `<p>${sanitizeHTML(userInput)}</p>`;
```

---

## 🔄 CICLO COMPLETO RESUMIDO

```
1. Usuario hace clic → popup.html + popup.js
2. popup.js inicializa módulos
3. fetchAndDisplay() → chrome.runtime.sendMessage()
4. Service Worker recibe → obtiene datos de APIs
5. Calcula arbitraje → devuelve rutas optimizadas
6. popup.js recibe → aplica filtros del usuario
7. displayOptimizedRoutes() → muestra en UI
8. Usuario interactúa → muestra detalles en modal
9. Service Worker continúa → actualiza cada minuto
10. Si hay oportunidad → envía notificación
```

---

## 🎯 PUNTOS CLAVE DEL FUNCIONAMIENTO

### 1. Arquitectura Separada
- **Popup**: Interfaz de usuario
- **Service Worker**: Procesamiento en background
- **APIs Externas**: Fuentes de datos

### 2. Flujo de Datos Unidireccional
```
APIs → Service Worker → Popup → UI
```

### 3. Estado Centralizado
- **StateManager**: Mantiene el estado global
- **Chrome Storage**: Persistencia de configuración
- **Eventos**: Comunicación entre componentes

### 4. Sistema de Filtros en Tiempo Real
- Los cambios se aplican inmediatamente
- No requiere recargar datos
- Respuesta instantánea al usuario

### 5. Actualización Automática
- Cada minuto sin intervención del usuario
- Notificaciones inteligentes
- Cache para respuesta rápida

---

## 🔍 DIAGNÓSTICO Y DEBUGGING

### Sistema de Logs

```javascript
// Modo debug configurable
const DEBUG_MODE = false;

function log(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// Logs estructurados
console.log('🔄 [POPUP] Iniciando fetchAndDisplay');
console.error('❌ [API] Error obteniendo datos:', error);
console.warn('⚠️ [FILTER] Sin rutas después de filtrar');
```

### Manejo de Errores

```javascript
try {
  const data = await fetchAPIData();
  processSuccess(data);
} catch (error) {
  console.error('Error en fetchAPIData:', error);
  
  // Mostrar mensaje amigable al usuario
  showErrorState({
    title: 'Error de Conexión',
    message: 'No se pudieron obtener los datos',
    action: 'Reintentar'
  });
  
  // Opcional: reintentar automáticamente
  if (retryCount < maxRetries) {
    setTimeout(() => fetchAndDisplay(retryCount + 1), 2000);
  }
}
```

---

## 📈 MÉTRICAS Y MONITOREO

### Tiempos de Carga

```javascript
// Medición de rendimiento
const startTime = performance.now();

await loadAndProcessData();

const endTime = performance.now();
console.log(`Tiempo de procesamiento: ${endTime - startTime}ms`);

// Enviar a analytics si está habilitado
if (userSettings.enableAnalytics) {
  sendMetric('processing_time', endTime - startTime);
}
```

### Contadores de Uso

```javascript
// Estadísticas de uso
const usageStats = {
  routesDisplayed: 0,
  filtersApplied: 0,
  simulationsRun: 0,
  notificationsSent: 0
};

// Actualizar contadores
usageStats.routesDisplayed = routes.length;
usageStats.filtersApplied = activeFilters.length;

// Guardar periódicamente
chrome.storage.local.set({ usageStats });
```

---

**Esta guía completa explica cómo funciona cada parte del sistema ArbitrageAR-USDT, desde el momento en que haces clic en la extensión hasta que se muestran las oportunidades de arbitraje, incluyendo todo el procesamiento intermedio, sistemas de seguridad y mecanismos de actualización automática.**