---
skillName: background-dev
description: Agente especializado en desarrollo del Service Worker
tags: [background, service-worker, main-simple, alarms, runtime]
---

# Background Development Skill

## Descripción
Agente especializado en desarrollo del Service Worker (background).

## Capacidades

### Service Worker Components
- Mensajes runtime (popup ↔ background)
- Alarms para actualizaciones automáticas
- Cache de datos en memoria
- Fetch de APIs externas

### Componentes Clave
- `src/background/main-simple.js`: Service Worker principal
- `src/background/apiClient.js`: Cliente de APIs
- `src/background/arbitrageCalculator.js`: Motor de cálculo
- `src/background/cacheManager.js`: Cache de datos

### Service Worker Pattern
```javascript
// main-simple.js

// Estado global (memoria del service worker)
let currentData = null;
let lastUpdate = null;

// Inicialización
console.log('🔧 [BACKGROUND] Service worker iniciado');

// Listener de mensajes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getData') {
    // Async response
    getData().then(data => sendResponse(data));
    return true; // Keep channel open
  }

  if (message.action === 'forceUpdate') {
    updateData().then(data => sendResponse(data));
    return true;
  }
});

// Alarms para actualizaciones automáticas
chrome.alarms.create('updateData', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateData') {
    updateData();
  }
});

// Función principal de actualización
async function updateData() {
  try {
    // Fetch APIs en paralelo
    const [oficial, usdt, banks] = await Promise.all([
      apiClient.fetchDolarOficial(),
      apiClient.fetchUSDT(),
      apiClient.fetchBanks()
    ]);

    // Calcular rutas
    const routes = arbitrageCalculator.calculateAll(oficial, usdt, banks);

    // Actualizar estado
    currentData = {
      oficial,
      usdt,
      banks,
      optimizedRoutes: routes,
      lastUpdate: Date.now()
    };

    // Verificar notificaciones
    notificationManager.checkThresholds(routes);

    return currentData;
  } catch (error) {
    console.error('[BG] Error updating data:', error);
    return { error: error.message };
  }
}
```

### Message Handlers
```javascript
const MESSAGE_HANDLERS = {
  getData: async () => currentData,
  forceUpdate: async () => await updateData(),
  getConfig: async () => await chrome.storage.local.get('notificationSettings'),
  saveConfig: async (data) => {
    await chrome.storage.local.set({ notificationSettings: data });
    return { success: true };
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = MESSAGE_HANDLERS[message.action];

  if (handler) {
    // Si hay handler, ejecutar
    if (message.action === 'saveConfig') {
      handler(message.data).then(sendResponse);
      return true;
    } else {
      handler().then(sendResponse);
      return true;
    }
  }

  return false;
});
```

### Cache Management
```javascript
// Cache con TTL
const cacheManager = {
  cache: new Map(),
  TTL: 60000, // 1 minuto

  get: (key) => {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < TTL) {
      return entry.data;
    }
    return null;
  },

  set: (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
  },

  clear: () => {
    cache.clear();
  }
};
```

### Storage Listener
```javascript
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.notificationSettings) {
    const newSettings = changes.notificationSettings.newValue;
    // Re-calcular con nuevos settings
    updateData();
  }
});
```

### Instrucciones de Uso

1. **Nuevo mensaje**: Añadir action y handler
2. **Nuevo alarm**: Crear con chrome.alarms.create()
3. **Nuevo cache**: Añadir key y TTL
4. **Nuevo listener**: Añadir a storage.onChanged

### Consideraciones Service Worker
- Puede terminar entre requests
- Estado global se pierde al terminar
- Usar chrome.storage para persistencia
- Return true para async responses

---

## Notas Importantes

- Service Worker puede terminarse
- Estado global temporal, usar storage
- Return true en async message handlers
- Alarms para actualizaciones periódicas