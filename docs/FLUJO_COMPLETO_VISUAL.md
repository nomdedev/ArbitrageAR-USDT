# 🚀 FLUJO COMPLETO VISUAL - Cómo Funciona ArbitrageAR

**Fecha:** 25 de Febrero de 2026  
**Versión:** v6.0.0  
**Propósito:** Guía visual paso a paso con código real

---

## 🎯 PASO 1: ABRES LA EXTENSIÓN

### 1.1 Haces clic en el ícono
```
🖱️ Usuario hace clic → Chrome abre popup.html
```

### 1.2 Se carga la interfaz HTML
**Archivo:** [`src/popup.html`](src/popup.html:1)

```html
<!doctype html>
<html lang="es">
  <head>
    <title>arbitrarARS</title>
    <!-- Se cargan 7 archivos CSS -->
    <link rel="stylesheet" href="ui-components/design-system.css" />
    <link rel="stylesheet" href="ui-components/header.css" />
    <link rel="stylesheet" href="ui-components/exchange-card.css" />
    <!-- ... más CSS ... -->
  </head>
  <body>
    <header>
      <h1>arbitrarARS</h1>
      <span class="subtitle">ARS → USDT</span>
      <button id="refresh">🔄</button>
    </header>
    
    <div class="tabs">
      <button class="tab active" data-tab="routes">Fiat</button>
      <button class="tab" data-tab="crypto-arbitrage">Cripto</button>
      <button class="tab" data-tab="simulator">Simular</button>
      <button class="tab" data-tab="banks">Exchanges</button>
    </div>
    
    <main id="main-content">
      <section id="tab-routes" class="tab-content active">
        <div id="loading" class="loading">
          <div class="spinner">🔄</div>
          <p>Calculando rutas optimizadas...</p>
        </div>
        <div id="optimized-routes"></div>
      </section>
    </main>
  </body>
</html>
```

### 1.3 Se ejecuta el JavaScript
**Archivo:** [`src/popup.js`](src/popup.js:1)

```javascript
// Cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [POPUP] Iniciando popup...');
  
  // 1. Verificar elementos críticos
  const mainContent = document.getElementById('main-content');
  const optimizedRoutes = document.getElementById('optimized-routes');
  const loading = document.getElementById('loading');
  
  // 2. Cargar configuración del usuario
  await loadUserSettings();
  
  // 3. Inicializar 9 módulos especializados
  Sim.init(currentData, userSettings);     // Simulador
  RteMgr.init(currentData, userSettings);   // Gestor de rutas
  FltMgr.init(userSettings, []);           // Gestor de filtros
  ModMgr.init(userSettings);                // Gestor de modales
  NotifMgr.init(userSettings);             // Gestor de notificaciones
  
  // 4. Configurar la interfaz
  setupTabNavigation();
  setupRefreshButton();
  
  // 5. Cargar y mostrar datos
  fetchAndDisplay();
});
```

---

## 🔄 PASO 2: OBTENCIÓN DE DATOS

### 2.1 Función fetchAndDisplay() se ejecuta
**Archivo:** [`src/popup.js`](src/popup.js:875)

```javascript
async function fetchAndDisplay(retryCount = 0) {
  // 1. Mostrar spinner de carga
  loading.style.display = 'block';
  container.innerHTML = '';
  
  // 2. Cargar configuración del usuario
  const settings = await chrome.storage.local.get('notificationSettings');
  userSettings = settings.notificationSettings || {};
  
  // 3. Enviar mensaje al Service Worker
  chrome.runtime.sendMessage({ action: 'getArbitrages' }, data => {
    // 4. Procesar respuesta cuando llegue
    if (data && data.optimizedRoutes) {
      handleSuccessfulData(data, container);
    } else {
      // Manejar errores
    }
  });
}
```

### 2.2 El Service Worker recibe el mensaje
**Archivo:** [`src/background/main-simple.js`](src/background/main-simple.js:2299)

```javascript
// Listener de mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📥 [BACKGROUND] Mensaje recibido:', request.action);
  
  if (request.action === 'getArbitrages') {
    // Si hay datos en cache, devolverlos inmediatamente
    if (currentData) {
      console.log('📤 [BACKGROUND] Enviando datos CACHEADOS');
      sendResponse(currentData);
      return;
    } else {
      // Si no hay cache, obtener datos frescos
      console.log('🔄 [BACKGROUND] Obteniendo datos frescos...');
      updateData().then(data => {
        sendResponse(data || { error: 'Error obteniendo datos' });
      });
    }
  }
});
```

---

## 📊 PASO 3: OBTENCIÓN DE DATOS FRESCOS

### 3.1 Función updateData() obtiene precios
**Archivo:** [`src/background/main-simple.js`](src/background/main-simple.js:2026)

```javascript
async function updateData() {
  console.log('🔄 [BACKGROUND] Actualizando datos...');
  
  try {
    // 1. Leer configuración del usuario
    const settingsResult = await chrome.storage.local.get('notificationSettings');
    const userSettings = settingsResult.notificationSettings || {};
    
    // 2. Decidir cómo obtener el dólar oficial
    let oficial;
    if (userSettings.dollarPriceSource === 'manual') {
      // Modo manual: usar precio configurado
      oficial = {
        compra: userSettings.manualDollarPrice || 1400,
        venta: userSettings.manualDollarPrice || 1400,
        source: 'manual',
        timestamp: Date.now()
      };
    } else {
      // Modo automático: obtener de APIs
      oficial = await getOficialDollarPrice(userSettings);
    }
    
    // 3. Obtener datos de exchanges
    const exchangesData = await getExchangesData(userSettings);
    
    // 4. Calcular rutas de arbitraje
    const optimizedRoutes = await calculateArbitrageRoutes(oficial, exchangesData, userSettings);
    
    // 5. Guardar en cache y devolver
    currentData = {
      oficial,
      optimizedRoutes,
      lastUpdate: Date.now(),
      marketHealth: calculateMarketHealth(exchangesData)
    };
    
    return currentData;
    
  } catch (error) {
    console.error('❌ [BACKGROUND] Error en updateData:', error);
    return { error: error.message, optimizedRoutes: [] };
  }
}
```

### 3.2 Obtención de precios de APIs
**Archivo:** [`src/background/apiClient.js`](src/background/apiClient.js:1)

```javascript
const ApiClient = (() => {
  // Endpoints de APIs
  const ENDPOINTS = {
    CRIPTOYA_USDT_ARS: 'https://criptoya.com/api/usdt/ars/1',
    CRIPTOYA_BANKS: 'https://criptoya.com/api/bancostodos',
    DOLARAPI_OFICIAL: 'https://dolarapi.com/v1/dolares/oficial'
  };
  
  // Función para obtener datos con timeout
  const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  // Obtener precio del dólar oficial
  const getOficialDollar = async () => {
    const data = await fetchWithTimeout(ENDPOINTS.DOLARAPI_OFICIAL);
    return {
      compra: data.compra,
      venta: data.venta,
      source: 'dolarapi.com',
      timestamp: Date.now()
    };
  };
  
  // Obtener datos de exchanges
  const getExchangesData = async () => {
    const [usdtData, banksData] = await Promise.all([
      fetchWithTimeout(ENDPOINTS.CRIPTOYA_USDT_ARS),
      fetchWithTimeout(ENDPOINTS.CRIPTOYA_BANKS)
    ]);
    
    return {
      usdt: usdtData,
      banks: banksData
    };
  };
  
  return {
    getOficialDollar,
    getExchangesData
  };
})();
```

---

## 💰 PASO 4: CÁLCULO DE ARBITRAJE

### 4.1 Motor de cálculo
**Archivo:** [`src/background/arbitrageCalculator.js`](src/background/arbitrageCalculator.js:22)

```javascript
const calculateSimpleArbitrage = params => {
  const {
    initialAmount,      // $1,000,000 ARS
    dollarBuyPrice,     // $1,050 por dólar
    usdtSellPrice,      // $1,080 por USDT
    fees = {}
  } = params;
  
  // Comisiones
  const tradingFee = fees.trading ?? 0.001;  // 0.1%
  const bankFee = fees.bank ?? 0.0;         // 0%
  
  // PASO 1: Comprar USD con ARS
  const usdBought = initialAmount / dollarBuyPrice;
  // Ejemplo: 1,000,000 / 1,050 = 952.38 USD
  
  const usdAfterBankFee = usdBought * (1 - bankFee);
  // Ejemplo: 952.38 * (1 - 0) = 952.38 USD
  
  // PASO 2: Comprar USDT con USD
  const usdtBought = usdAfterBankFee * (1 - tradingFee);
  // Ejemplo: 952.38 * (1 - 0.001) = 951.43 USDT
  
  // PASO 3: Vender USDT por ARS
  const arsBeforeFees = usdtBought * usdtSellPrice;
  // Ejemplo: 951.43 * 1,080 = 1,027,544 ARS
  
  const finalAmount = arsBeforeFees * (1 - tradingFee);
  // Ejemplo: 1,027,544 * (1 - 0.001) = 1,026,516 ARS
  
  // Cálculo de ganancia
  const profit = finalAmount - initialAmount;
  // Ejemplo: 1,026,516 - 1,000,000 = 26,516 ARS
  
  const profitPercentage = (profit / initialAmount) * 100;
  // Ejemplo: (26,516 / 1,000,000) * 100 = 2.65%
  
  return {
    initialAmount,
    finalAmount,
    profit,
    profitPercentage,
    fees: {
      trading: initialAmount * tradingFee * 2, // Compra y venta
      bank: initialAmount * bankFee,
      total: (initialAmount * tradingFee * 2) + (initialAmount * bankFee)
    }
  };
};
```

### 4.2 Ejemplo real de cálculo

```javascript
// Datos reales del mercado
const ejemplo = {
  initialAmount: 1000000,           // $1,000,000 ARS
  dollarBuyPrice: 1050,             // Dólar oficial a $1,050
  usdtSellPrice: 1080,              // USDT a $1,080
  fees: {
    trading: 0.001,                 // 0.1% de trading
    bank: 0.0                      // Sin comisión bancaria
  }
};

const resultado = calculateSimpleArbitrage(ejemplo);
console.log(resultado);
/*
{
  initialAmount: 1000000,
  finalAmount: 1026516,
  profit: 26516,
  profitPercentage: 2.65,
  fees: {
    trading: 2000,      // $1,000 compra + $1,000 venta
    bank: 0,
    total: 2000
  }
}
*/
```

---

## 🎨 PASO 5: VISUALIZACIÓN EN LA INTERFAZ

### 5.1 Procesamiento de datos exitosos
**Archivo:** [`src/popup.js`](src/popup.js:820)

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
    applyP2PFilter();  // Aplicar filtros activos
  }
}
```

### 5.2 Aplicación de filtros de usuario
**Archivo:** [`src/popup.js`](src/popup.js:1027)

```javascript
function applyUserPreferences(routes) {
  let filtered = [...routes];
  
  // 1. Filtrar por ganancia mínima
  const minProfit = userSettings?.filterMinProfit ?? -10.0;
  filtered = routes.filter(r => r.profitPercentage >= minProfit);
  
  // 2. Filtrar por exchanges preferidos
  if (userSettings.preferredExchanges?.length > 0) {
    filtered = filtered.filter(r => 
      userSettings.preferredExchanges.includes(r.broker)
    );
  }
  
  // 3. Ordenar por ganancia (mayor a menor)
  filtered.sort((a, b) => b.profitPercentage - a.profitPercentage);
  
  // 4. Limitar cantidad mostrada
  const maxDisplay = userSettings.maxRoutesDisplay || 20;
  filtered = filtered.slice(0, maxDisplay);
  
  return filtered;
}
```

### 5.3 Generación de tarjetas de rutas
**Archivo:** [`src/popup.js`](src/popup.js:1213)

```javascript
function displayOptimizedRoutes(routes) {
  const container = document.getElementById('optimized-routes');
  
  if (!routes || routes.length === 0) {
    // Mostrar estado vacío
    container.innerHTML = `
      <div class="empty-state-card">
        <h3>📊 Estado del Mercado</h3>
        <p>No se encontraron oportunidades</p>
        <div class="reasons-list">
          <div class="reason-item">
            <span>🎯</span>
            <span>Umbral muy alto</span>
          </div>
          <div class="reason-item">
            <span>🏦</span>
            <span>Exchanges restrictivos</span>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  // Generar HTML para cada ruta
  let routesHTML = '';
  routes.forEach(route => {
    const profitClass = route.profitPercentage >= 0 ? 'profit' : 'loss';
    const profitColor = route.profitPercentage >= 2 ? 'green' : 
                      route.profitPercentage >= 0 ? 'yellow' : 'red';
    
    routesHTML += `
      <div class="route-card ${profitClass}" data-route-id="${route.id}">
        <div class="route-header">
          <h3 class="route-broker">${route.broker}</h3>
          <span class="route-profit ${profitColor}">
            ${route.profitPercentage >= 0 ? '+' : ''}${route.profitPercentage.toFixed(2)}%
          </span>
        </div>
        
        <div class="route-details">
          <div class="route-row">
            <span class="label">Compra:</span>
            <span class="value">$${route.dollarBuyPrice}</span>
          </div>
          <div class="route-row">
            <span class="label">Venta:</span>
            <span class="value">$${route.usdtSellPrice}</span>
          </div>
          <div class="route-row">
            <span class="label">Ganancia:</span>
            <span class="value ${profitColor}">
              $${route.profit?.toLocaleString()}
            </span>
          </div>
        </div>
        
        <button class="route-details-btn" onclick="showRouteDetails('${route.id}')">
          Ver detalles →
        </button>
      </div>
    `;
  });
  
  container.innerHTML = routesHTML;
}
```

---

## 🖱️ PASO 6: INTERACCIÓN DEL USUARIO

### 6.1 Click en una ruta
**Archivo:** [`src/popup.js`](src/popup.js:132)

```javascript
// Event listener configurado en la inicialización
document.addEventListener('routeSelected', function(e) {
  const route = e.detail;
  console.log('🖱️ [POPUP] Ruta seleccionada:', route.broker);
  showRouteDetailsByType(route);
});

function showRouteDetailsByType(route) {
  // Generar modal con desglose completo
  const modalHTML = generateRouteModal(route);
  
  // Crear y mostrar modal
  const modal = document.createElement('div');
  modal.className = 'route-details-modal';
  modal.innerHTML = modalHTML;
  document.body.appendChild(modal);
  
  // Animación de entrada
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
}
```

### 6.2 Modal de detalles
```javascript
function generateRouteModal(route) {
  return `
    <div class="modal-content">
      <div class="modal-header">
        <h3>📊 Desglose de ${route.broker}</h3>
        <button class="close-btn" onclick="closeModal()">✕</button>
      </div>
      
      <div class="breakdown-section">
        <h4>1. Compra de USD</h4>
        <div class="breakdown-row">
          <span>Inversión inicial:</span>
          <span>$${route.initialAmount?.toLocaleString()} ARS</span>
        </div>
        <div class="breakdown-row">
          <span>Precio dólar:</span>
          <span>$${route.dollarBuyPrice}</span>
        </div>
        <div class="breakdown-row highlight">
          <span>USD obtenidos:</span>
          <span>${(route.initialAmount / route.dollarBuyPrice).toFixed(2)}</span>
        </div>
      </div>
      
      <div class="breakdown-section">
        <h4>2. Compra de USDT</h4>
        <div class="breakdown-row">
          <span>USDT comprados:</span>
          <span>${route.usdtAmount?.toFixed(6)}</span>
        </div>
        <div class="breakdown-row fee">
          <span>Fee trading:</span>
          <span>-$${route.fees?.trading?.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="breakdown-section">
        <h4>3. Venta por ARS</h4>
        <div class="breakdown-row">
          <span>Precio USDT:</span>
          <span>$${route.usdtSellPrice}</span>
        </div>
        <div class="breakdown-row">
          <span>Total recibido:</span>
          <span>$${route.finalAmount?.toLocaleString()} ARS</span>
        </div>
      </div>
      
      <div class="final-summary ${route.profit >= 0 ? 'profitable' : 'loss'}">
        <div class="summary-row result">
          <span>💰 Ganancia Neta:</span>
          <span class="${route.profit >= 0 ? 'profit' : 'loss'}">
            ${route.profit >= 0 ? '+' : ''}$${route.profit?.toLocaleString()} ARS
          </span>
        </div>
      </div>
    </div>
  `;
}
```

---

## 🔄 PASO 7: ACTUALIZACIÓN AUTOMÁTICA

### 7.1 Alarms para actualización periódica
**Archivo:** [`src/background/main-simple.js`](src/background/main-simple.js)

```javascript
// Configurar alarmas al iniciar el Service Worker
chrome.runtime.onStartup.addListener(() => {
  // Crear alarma para actualizar cada minuto
  chrome.alarms.create('updateData', { 
    periodInMinutes: 1 
  });
  
  // Crear alarma para verificar notificaciones cada 30 segundos
  chrome.alarms.create('checkNotifications', { 
    periodInMinutes: 0.5 
  });
});

// Listener de alarmas
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('⏰ [BACKGROUND] Alarma activada:', alarm.name);
  
  if (alarm.name === 'updateData') {
    // Actualizar datos cada minuto
    updateData().then(data => {
      console.log('📊 [BACKGROUND] Datos actualizados automáticamente');
    });
  }
  
  if (alarm.name === 'checkNotifications') {
    // Verificar oportunidades rentables
    checkProfitThresholds();
  }
});
```

### 7.2 Sistema de notificaciones
```javascript
async function checkProfitThresholds() {
  if (!currentData || !currentData.optimizedRoutes) return;
  
  const settings = await chrome.storage.local.get('notificationSettings');
  const userSettings = settings.notificationSettings || {};
  const threshold = userSettings.profitThreshold || 2.0; // 2% por defecto
  
  // Buscar rutas que superen el umbral
  const profitableRoutes = currentData.optimizedRoutes.filter(
    route => route.profitPercentage >= threshold
  );
  
  if (profitableRoutes.length > 0) {
    // Enviar notificación
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '¡Oportunidad de Arbitraje!',
      message: `${profitableRoutes[0].broker}: ${profitableRoutes[0].profitPercentage.toFixed(2)}% de ganancia`,
      buttons: [
        { title: 'Ver Detalles' },
        { title: 'Abrir Extensión' }
      ]
    });
  }
}
```

---

## 🎯 FLUJO COMPLETO RESUMIDO

```mermaid
graph TD
    A[Usuario hace clic] --> B[popup.html se carga]
    B --> C[popup.js se ejecuta]
    C --> D[fetchAndDisplay()]
    D --> E[chrome.runtime.sendMessage]
    E --> F[Service Worker recibe]
    F --> G{Hay cache?}
    G -->|Sí| H[Devolver datos cache]
    G -->|No| I[updateData()]
    I --> J[Obtener precios de APIs]
    J --> K[Calcular arbitraje]
    K --> L[Guardar en cache]
    L --> M[Devolver datos frescos]
    H --> N[popup.js recibe datos]
    M --> N
    N --> O[handleSuccessfulData]
    O --> P[Aplicar filtros]
    P --> Q[displayOptimizedRoutes]
    Q --> R[Mostrar tarjetas]
    R --> S[Usuario interactúa]
    S --> T[Mostrar modal detalles]
    
    U[Alarma cada minuto] --> I
    V[Alarma de notificaciones] --> W[Verificar umbrales]
    W --> X[Enviar notificación]
```

---

## 🔍 EJEMPLO REAL COMPLETO

### Escenario: Mercado favorable

1. **Usuario abre extensión** → Ve loading spinner
2. **Background obtiene datos**:
   ```javascript
   {
     oficial: { compra: 1050, venta: 1060, source: 'dolarapi.com' },
     exchanges: {
       buenbit: { ask: 1085, bid: 1075 },
       lemon: { ask: 1082, bid: 1072 },
       ripio: { ask: 1088, bid: 1078 }
     }
   }
   ```
3. **Se calculan rutas**:
   ```javascript
   [
     {
       broker: 'Buenbit',
       dollarBuyPrice: 1050,
       usdtSellPrice: 1085,
       profitPercentage: 2.8,
       profit: 28000,
       initialAmount: 1000000,
       finalAmount: 1028000
     },
     {
       broker: 'Lemon Cash',
       dollarBuyPrice: 1050,
       usdtSellPrice: 1082,
       profitPercentage: 2.3,
       profit: 23000,
       initialAmount: 1000000,
       finalAmount: 1023000
     }
   ]
   ```
4. **Se muestran en UI**:
   - Tarjeta verde para Buenbit: +2.8%
   - Tarjeta verde para Lemon: +2.3%
   - Usuario hace clic en Buenbit
5. **Se abre modal** con desglose completo
6. **Notificación automática** si ganancia > 2%

---

## 🛡️ SEGURIDAD EN EL FLUJO

### Validación de datos
```javascript
function validateRouteData(route) {
  const requiredFields = ['broker', 'profitPercentage', 'dollarBuyPrice', 'usdtSellPrice'];
  
  for (const field of requiredFields) {
    if (route[field] === undefined || route[field] === null) {
      console.warn(`❌ Campo faltante: ${field}`);
      return false;
    }
  }
  
  if (route.dollarBuyPrice <= 0 || route.usdtSellPrice <= 0) {
    console.warn('❌ Precios inválidos');
    return false;
  }
  
  return true;
}
```

### Manejo de errores
```javascript
try {
  const data = await fetchAPIData();
  processSuccess(data);
} catch (error) {
  console.error('❌ Error obteniendo datos:', error);
  
  // Mostrar mensaje amigable
  showErrorState({
    title: 'Error de Conexión',
    message: 'No se pudieron obtener los datos',
    action: 'Reintentar'
  });
  
  // Reintentar automáticamente
  if (retryCount < maxRetries) {
    setTimeout(() => fetchAndDisplay(retryCount + 1), 2000);
  }
}
```

---

**Este flujo completo muestra cómo funciona ArbitrageAR desde que haces clic hasta que ves las oportunidades de arbitraje, incluyendo todo el procesamiento, cálculos, visualización y actualización automática.**