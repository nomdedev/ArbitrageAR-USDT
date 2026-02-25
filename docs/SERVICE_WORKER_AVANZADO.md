# 🔧 SERVICE WORKER AVANZADO - El Cerebro de la Extensión

**Fecha:** 25 de Febrero de 2026  
**Nivel:** Intermedio  
**Objetivo:** Dominar el Service Worker en extensiones Chrome

---

## 🎯 ¿QUÉ ES UN SERVICE WORKER?

Un Service Worker es un **script que corre en un contexto aislado** para manejar tareas en segundo plano.

**Analogía:** Es como tener un **asistente personal invisible** que trabaja para ti mientras navegas.

### Características Clave:

1. **Event-Driven**: Se activa por eventos, no corre continuamente
2. **Sin acceso al DOM**: No puede manipular páginas directamente
3. **Ciclo de vida controlado**: Se inicia, trabaja, y se termina
4. **Acceso a APIs privilegiadas**: Puede usar APIs que no puede usar el contenido

---

## 🔄 CICLO DE VIDA DEL SERVICE WORKER

### 1. **Instalación y Activación**

```javascript
// main-simple.js
console.log('🔧 Service Worker iniciando...');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 Extensión instalada:', details);
  
  // Inicialización única
  if (details.reason === 'install') {
    // Primera instalación
    chrome.storage.local.set({
      firstInstall: true,
      installDate: Date.now()
    });
  }
  
  // Configurar alarmas para actualización periódica
  chrome.alarms.create('updateData', {
    periodInMinutes: 1 // Cada minuto
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Chrome iniciado, Service Worker activado');
  // Se ejecuta cada vez que Chrome inicia
});
```

### 2. **Manejo de Eventos**

```javascript
// Eventos de comunicación
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📥 Mensaje recibido:', request.action);
  
  switch (request.action) {
    case 'getArbitrages':
      handleGetArbitrages(request, sendResponse);
      break;
    case 'updateSettings':
      handleUpdateSettings(request, sendResponse);
      break;
    default:
      console.warn('Acción desconocida:', request.action);
  }
  
  // Importante: return true para respuesta asíncrona
  return true;
});

// Eventos de alarmas
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('⏰ Alarma activada:', alarm.name);
  
  if (alarm.name === 'updateData') {
    updateDataPeriodically();
  }
});

// Eventos de cambios en storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('💾 Cambios en storage:', changes);
    handleStorageChanges(changes);
  }
});
```

### 3. **Procesamiento en Background**

```javascript
// Tarea periódica de actualización
async function updateDataPeriodically() {
  console.log('🔄 Iniciando actualización automática...');
  
  try {
    // 1. Obtener datos de APIs
    const [dolarData, exchangesData] = await Promise.all([
      fetchDolarAPI(),
      fetchExchangesAPI()
    ]);
    
    // 2. Procesar y calcular
    const processedData = await processData(dolarData, exchangesData);
    
    // 3. Guardar en storage
    await saveToStorage(processedData);
    
    // 4. Notificar si hay oportunidades
    await checkForOpportunities(processedData);
    
  } catch (error) {
    console.error('❌ Error en actualización:', error);
    await handleUpdateError(error);
  }
}
```

---

## 📡 COMUNICACIÓN AVANZADA

### 1. **Mensajería Bidireccional**

```javascript
// Enviar mensaje desde popup
const sendMessageToBackground = (action, data = {}) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

// Uso en popup.js
try {
  const response = await sendMessageToBackground('getArbitrages', {
    exchanges: ['buenbit', 'lemon']
  });
  console.log('Datos recibidos:', response);
} catch (error) {
  console.error('Error de comunicación:', error);
}
```

### 2. **Broadcast a Todos los Componentes**

```javascript
// Enviar mensaje a múltiples componentes
const broadcastUpdate = (data) => {
  chrome.runtime.sendMessage({
    action: 'dataUpdated',
    payload: data,
    broadcast: true // Marcar como broadcast
  });
};

// Recibir en cualquier componente
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.broadcast) {
    // Procesar broadcast
    handleBroadcastUpdate(request.payload);
  }
});
```

### 3. **Comunicación entre Service Workers**

```javascript
// Para extensiones complejas con múltiples SW
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Reenviar a otros Service Workers
  if (request.targetWorker && request.targetWorker !== 'current') {
    chrome.runtime.sendMessage(request, sendResponse);
  }
});
```

---

## 🔄 GESTIÓN DE ESTADO EN SERVICE WORKER

### 1. **Cache Inteligente**

```javascript
// Cache en memoria del Service Worker
let dataCache = {
  data: null,
  timestamp: 0,
  ttl: 60000 // 1 minuto en milisegundos
};

const isCacheValid = () => {
  return dataCache.data && 
         (Date.now() - dataCache.timestamp < dataCache.ttl);
};

const getCachedData = () => {
  if (isCacheValid()) {
    console.log('📦 Usando datos cacheados');
    return dataCache.data;
  }
  return null;
};

const setCachedData = (data) => {
  dataCache = {
    data,
    timestamp: Date.now(),
    ttl: 60000
  };
};
```

### 2. **Estado Persistente**

```javascript
// Estado que sobrevive a reinicios
const STATE_KEYS = {
  USER_PREFERENCES: 'userPreferences',
  LAST_UPDATE: 'lastUpdate',
  CACHED_ROUTES: 'cachedRoutes',
  MARKET_STATUS: 'marketStatus'
};

// Guardar estado
const saveState = async (key, value) => {
  try {
    await chrome.storage.local.set({ [key]: value });
    console.log(`💾 Estado guardado: ${key}`);
  } catch (error) {
    console.error(`❌ Error guardando ${key}:`, error);
  }
};

// Cargar estado
const loadState = async (key) => {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  } catch (error) {
    console.error(`❌ Error cargando ${key}:`, error);
    return null;
  }
};
```

---

## ⚡ TÉCNICAS AVANZADAS

### 1. **Throttling y Rate Limiting**

```javascript
// Evitar sobrecargar APIs
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async makeRequest(url) {
    // Limpiar requests viejos
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.log(`⏳ Rate limit: esperando ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
    return fetch(url);
  }
}

// Uso
const rateLimiter = new RateLimiter(5, 60000); // 5 requests por minuto
```

### 2. **Retry con Backoff Exponencial**

```javascript
class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }
  
  async executeWithRetry(operation, context = '') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${this.maxRetries} ${context}`);
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Intento ${attempt} falló:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Esperando ${delay}ms antes de reintentar`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Todos los intentos fallaron. Último error: ${lastError.message}`);
  }
}

// Uso
const retryManager = new RetryManager();
const data = await retryManager.executeWithRetry(
  () => fetch('https://api.com/data'),
  'obteniendo datos de API'
);
```

### 3. **Batch Processing**

```javascript
// Procesar múltiples operaciones en batch
class BatchProcessor {
  constructor(batchSize = 10, delayMs = 100) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
    this.queue = [];
    this.processing = false;
  }
  
  async add(operation) {
    this.queue.push(operation);
    
    if (!this.processing) {
      this.processBatch();
    }
  }
  
  async processBatch() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      try {
        await Promise.all(batch.map(op => op()));
        console.log(`✅ Batch procesado: ${batch.length} operaciones`);
      } catch (error) {
        console.error('❌ Error en batch:', error);
      }
      
      // Pequeña pausa entre batches
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
    }
    
    this.processing = false;
  }
}
```

---

## 🛡️ SEGURIDAD EN SERVICE WORKER

### 1. **Validación de Entrada**

```javascript
const validateMessage = (message) => {
  const requiredFields = ['action'];
  
  for (const field of requiredFields) {
    if (!message[field]) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }
  
  // Validar acción específica
  const validActions = ['getArbitrages', 'updateSettings', 'refreshData'];
  if (!validActions.includes(message.action)) {
    throw new Error(`Acción inválida: ${message.action}`);
  }
  
  return true;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    validateMessage(request);
    // Procesar mensaje válido
  } catch (error) {
    console.error('❌ Mensaje inválido:', error.message);
    sendResponse({ error: error.message });
  }
});
```

### 2. **Sanitización de Datos**

```javascript
const sanitizeData = (data) => {
  if (typeof data !== 'object') return data;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Eliminar scripts y caracteres peligrosos
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
```

---

## 🧪 EJERCICIOS PRÁCTICOS

### Ejercicio 1: Implementar un Service Worker Básico

**Objetivo:** Crear un Service Worker que responda a mensajes y actualice datos periódicamente.

```javascript
// mi-service-worker.js
console.log('🚀 Mi Service Worker iniciado');

// 1. Manejar instalación
chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extensión instalada');
  chrome.storage.local.set({ 
    message: 'Hola desde el Service Worker',
    counter: 0 
  });
});

// 2. Manejar mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📥 Mensaje recibido:', request);
  
  if (request.action === 'getMessage') {
    chrome.storage.local.get(['message', 'counter'], (result) => {
      sendResponse({
        message: result.message || 'Sin mensaje',
        counter: result.counter || 0
      });
    });
  }
  
  if (request.action === 'updateCounter') {
    chrome.storage.local.get(['counter'], (result) => {
      const newCounter = (result.counter || 0) + 1;
      chrome.storage.local.set({ counter: newCounter });
      sendResponse({ counter: newCounter });
    });
  }
  
  return true;
});

// 3. Alarma periódica
chrome.alarms.create('periodicUpdate', {
  periodInMinutes: 0.5 // Cada 30 segundos
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicUpdate') {
    const timestamp = new Date().toLocaleTimeString();
    chrome.storage.local.set({ lastUpdate: timestamp });
    console.log('⏰ Actualización periódica:', timestamp);
  }
});
```

**manifest.json correspondiente:**
```json
{
  "manifest_version": 3,
  "name": "Mi Service Worker",
  "version": "1.0.0",
  "background": {
    "service_worker": "mi-service-worker.js"
  },
  "permissions": ["storage", "alarms"],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### Ejercicio 2: Debugging de Service Worker

**Objetivo:** Añadir logging avanzado para debugear problemas.

```javascript
// Añadir a tu Service Worker
class ServiceWorkerLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
  }
  
  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Mantener solo los últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Enviar a popup si está abierto
    this.sendToPopup(logEntry);
  }
  
  sendToPopup(logEntry) {
    chrome.runtime.sendMessage({
      action: 'log',
      payload: logEntry
    }).catch(() => {
      // El popup puede no estar abierto, no hay problema
      console.log('📝 Log:', logEntry);
    });
  }
  
  getLogs() {
    return [...this.logs];
  }
  
  clearLogs() {
    this.logs = [];
  }
}

const logger = new ServiceWorkerLogger();

// Reemplazar console.log por logger.log
logger.log('info', 'Service Worker iniciado');
logger.log('error', 'Error en API', { error: 'timeout' });
```

---

## 📋 RESUMEN DEL MÓDULO

### ✅ Conceptos Aprendidos

1. **Ciclo de vida**: Instalación → Activación → Procesamiento → Término
2. **Eventos**: onMessage, onAlarm, onStorageChanged, onInstalled
3. **Comunicación**: Mensajería bidireccional con manejo de errores
4. **Estado**: Cache en memoria + estado persistente en storage
5. **Técnicas avanzadas**: Rate limiting, retry con backoff, batch processing
6. **Seguridad**: Validación de entrada y sanitización de datos

### 🎯 Próximos Pasos

En el siguiente módulo vamos a ver:
- **APIs Externas**: Fetch, CORS, manejo de errores
- **Sistema de Obtención de Datos**: Cómo obtiene los precios del dólar y USDT
- **Procesamiento Asíncrono**: Promises, async/await, manejo de concurrencia

---

**¿Listo para continuar con el sistema de obtención de datos y APIs externas?**