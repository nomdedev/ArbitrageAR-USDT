# 📡 COMUNICACIÓN ENTRE COMPONENTES - ArbitrageAR-USDT

**Fecha:** 25 de Febrero de 2026  
**Nivel:** Intermedio  
**Objetivo:** Dominar la comunicación entre Service Worker, Popup y Módulos

---

## 🎯 ¿POR QUÉ ES LA COMUNICACIÓN ENTRE COMPONENTES?

En una extensión Chrome, los componentes no pueden llamarse directamente entre sí debido al **aislamiento de contextos**. Usan un sistema de **mensajería** provisto por Chrome.

**Analogía:** Piensa en el sistema de comunicación de una oficina:
- **Service Worker**: El "cerebro" que procesa solicitudes
- **Popup**: La "ventanita" que muestra información
- **Mensajería**: El "sistema de intercomunicadores" que conecta todo

---

## 🔄 CROMO RUNTIME MENSAJERÍA

### 1. **Conceptos Fundamentales**

```javascript
// chrome.runtime - El sistema de comunicación de Chrome
chrome.runtime = {
  // Enviar mensaje
  sendMessage: (message, callback) => {
    // Envía mensaje al Service Worker
  },
  
  // Recibir mensaje
  onMessage: {
    addListener: (callback) => {
      // Escucha mensajes de otros contextos
    }
  },
  
  // Obtener URL de la extensión
  getURL: (path) => {
    // Obtiene URL completa de recursos
  },
  
  // Conectar a puerto externo
  connect: (extensionId) => {
    // Para comunicación con otras extensiones
  }
};
```

### 2. **Flujo Básico de Comunicación**

```javascript
// En popup.js - Enviar mensaje
chrome.runtime.sendMessage(
  { action: 'getData', type: 'prices' },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      return;
    }
    
    console.log('Respuesta recibida:', response);
    // Procesar respuesta
  }
);

// En background.js - Recibir y responder
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mensaje recibido:', request);
  console.log('Remitente:', sender);
  
  if (request.action === 'getData') {
    // Procesar solicitud
    processData(request.type)
      .then(data => {
        sendResponse({ 
          success: true, 
          data: data 
        });
      })
      .catch(error => {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      });
    
    // Importante: return true para respuesta asíncrona
    return true;
  }
});
```

---

## 📦 PATRONES DE COMUNICACIÓN

### 1. **Request-Response Pattern**

```javascript
// Estructura estándar de mensaje
const standardMessage = {
  action: 'nombreDeAccion',    // Obligatorio: qué hacer
  payload: { /* datos */ },      // Opcional: datos para la acción
  timestamp: Date.now(),        // Opcional: cuándo se envió
  id: 'unique-id'            // Opcional: identificar mensaje
};

// Ejemplo de uso
const sendMessage = async (action, payload = {}) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action,
      payload,
      timestamp: Date.now(),
      id: generateUniqueId()
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

// Enviar y esperar respuesta
try {
  const result = await sendMessage('getArbitrages', {
    exchanges: ['buenbit', 'lemon']
  });
  console.log('Datos obtenidos:', result);
} catch (error) {
  console.error('Error en comunicación:', error);
}
```

### 2. **Event-Driven Communication**

```javascript
// Sistema de eventos personalizado
class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  // Emitir evento
  emit(eventName, data) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now()
    };
    
    chrome.runtime.sendMessage({
      action: 'event',
      event
    });
  }
  
  // Escuchar eventos
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }
  
  // Procesar eventos entrantes
  processEvent(event) {
    if (event.event && this.listeners.has(event.event.name)) {
      const callbacks = this.listeners.get(event.event.name);
      callbacks.forEach(callback => callback(event.event.data));
    }
  }
}

// Uso
const eventManager = new EventManager();

// En popup.js - Escuchar eventos
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'event') {
    eventManager.processEvent(request);
  }
  return true;
});

// En background.js - Emitir eventos
eventManager.on('dataUpdated', (data) => {
  updateUI(data);
});

// Emitir evento cuando cambian los datos
eventManager.emit('dataUpdated', { 
  exchanges: newData, 
  timestamp: Date.now() 
});
```

### 3. **Broadcast Pattern**

```javascript
// Enviar mensaje a todos los componentes abiertos
const broadcastMessage = (message) => {
  chrome.runtime.sendMessage({
    action: 'broadcast',
    message,
    timestamp: Date.now()
  });
};

// Recibir broadcast
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'broadcast') {
    // Procesar broadcast
    handleBroadcast(request.message);
  }
  
  // Responder solo si no es broadcast
  if (request.action !== 'broadcast') {
    sendResponse({ received: true });
  }
  
  return true;
});
```

---

## 🔧 COMUNICACIÓN AVANZADA

### 1. **Message Queue System**

```javascript
// Sistema de cola para manejar múltiples mensajes
class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
  }
  
  // Agregar mensaje a la cola
  enqueue(message) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        message,
        resolve,
        reject,
        retries: 0,
        timestamp: Date.now()
      });
      
      this.processQueue();
    });
  }
  
  // Procesar cola
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        const response = await this.sendMessage(item.message);
        item.resolve(response);
      } catch (error) {
        item.retries++;
        
        if (item.retries < this.maxRetries) {
          // Re-encolar para reintentar
          this.queue.unshift(item);
          
          // Esperar antes de reintentar
          await new Promise(resolve => 
            setTimeout(resolve, 1000 * item.retries)
          );
        } else {
          item.reject(error);
        }
      }
    }
    
    this.processing = false;
  }
  
  // Enviar mensaje con cola
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Uso
const messageQueue = new MessageQueue();

// Encolar mensaje en lugar de enviar directamente
const result = await messageQueue.enqueue({
  action: 'calculateArbitrage',
  payload: { amount: 1000 }
});
```

### 2. **State Synchronization**

```javascript
// Sincronizar estado entre componentes
class StateSyncManager {
  constructor() {
    this.state = {};
    this.subscribers = new Map();
    this.syncInProgress = false;
  }
  
  // Suscribir a cambios de estado
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);
  }
  
  // Actualizar estado
  async setState(key, value) {
    this.state[key] = value;
    
    // Notificar a suscriptores locales
    if (this.subscribers.has(key)) {
      const callbacks = this.subscribers.get(key);
      callbacks.forEach(callback => callback(value, key));
    }
    
    // Sincronizar con otros contextos
    await this.syncWithOtherContexts(key, value);
  }
  
  // Sincronizar con otros contextos
  async syncWithOtherContexts(key, value) {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      // Enviar mensaje de sincronización
      await chrome.runtime.sendMessage({
        action: 'syncState',
        key,
        value,
        timestamp: Date.now()
      });
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // Recibir sincronización
  handleSyncMessage(request) {
    if (request.action === 'syncState') {
      this.state[request.key] = request.value;
      
      // Notificar a suscriptores locales
      if (this.subscribers.has(request.key)) {
        const callbacks = this.subscribers.get(request.key);
        callbacks.forEach(callback => callback(request.value, request.key));
      }
    }
  }
}

// Uso
const stateSync = new StateSyncManager();

// Suscribir a cambios
stateSync.subscribe('userPreferences', (newValue, key) => {
  console.log(`Estado ${key} cambió a:`, newValue);
  updateUI();
});

// Actualizar estado
await stateSync.setState('theme', 'dark');
```

---

## 🎨 COMUNICACIÓN CON LA UI

### 1. **DOM Events vs Runtime Messages**

```javascript
// popup.js - Comunicación con el Service Worker
class PopupCommunication {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  // Enviar solicitud al Service Worker
  async sendToBackground(action, data = {}) {
    const requestId = this.generateRequestId();
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      chrome.runtime.sendMessage({
        action,
        data,
        requestId,
        timestamp: Date.now()
      });
      
      // Timeout para solicitud
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Timeout en comunicación'));
        }
      }, 10000);
    });
  }
  
  // Manejar respuestas
  handleResponse(response) {
    if (response.requestId && this.pendingRequests.has(response.requestId)) {
      const { resolve, reject } = this.pendingRequests.get(response.requestId);
      this.pendingRequests.delete(response.requestId);
      
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.data);
      }
    }
  }
  
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Uso en popup.js
const comm = new PopupCommunication();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await comm.sendToBackground('getArbitrages', {
      exchanges: ['buenbit', 'lemon']
    });
    
    renderArbitrages(data);
  } catch (error) {
    showError('Error obteniendo datos:', error);
  }
});
```

### 2. **Event Delegation en el Popup**

```javascript
// Manejar eventos eficientemente
class UIEventController {
  constructor() {
    this.eventHandlers = new Map();
    this.setupEventDelegation();
  }
  
  setupEventDelegation() {
    // Delegar eventos al contenedor principal
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('change', this.handleChange.bind(this), true);
    document.addEventListener('submit', this.handleSubmit.bind(this), true);
  }
  
  handleClick(event) {
    const target = event.target;
    const action = target.dataset.action;
    
    if (action && this.eventHandlers.has(action)) {
      event.preventDefault();
      
      const handler = this.eventHandlers.get(action);
      handler(target, event);
    }
  }
  
  // Registrar manejador de eventos
  registerHandler(action, handler) {
    this.eventHandlers.set(action, handler);
  }
}

// Uso en popup.js
const eventController = new UIEventController();

// Registrar manejadores
eventController.registerHandler('refresh-data', async (element, event) => {
  element.disabled = true;
  
  try {
    await refreshData();
    showSuccess('Datos actualizados');
  } catch (error) {
    showError('Error actualizando:', error);
  } finally {
    element.disabled = false;
  }
});

eventController.registerHandler('filter-routes', (element, event) => {
  const filterType = element.dataset.filterType;
  applyFilter(filterType);
});

// En HTML
<button data-action="refresh-data">Actualizar</button>
<select data-action="filter-routes" data-filter-type="profitable">
  <option value="all">Todas</option>
  <option value="profitable">Rentables</option>
</select>
```

---

## 🛡️ SEGURIDAD EN LA COMUNICACIÓN

### 1. **Validación de Mensajes**

```javascript
const validateMessage = (message) => {
  // Estructura básica de validación
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Mensaje inválido' };
  }
  
  if (!message.action || typeof message.action !== 'string') {
    return { valid: false, error: 'Acción requerida' };
  }
  
  // Lista blanca de acciones permitidas
  const allowedActions = [
    'getArbitrages',
    'updateSettings',
    'refreshData',
    'syncState',
    'calculateArbitrage'
  ];
  
  if (!allowedActions.includes(message.action)) {
    return { valid: false, error: 'Acción no permitida' };
  }
  
  // Validar payload según acción
  if (message.action === 'calculateArbitrage') {
    if (!message.payload || !message.payload.amount) {
      return { valid: false, error: 'Monto requerido para cálculo' };
    }
    
    if (message.payload.amount <= 0) {
      return { valid: false, error: 'Monto debe ser positivo' };
    }
  }
  
  return { valid: true };
};

// En el Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const validation = validateMessage(request);
  
  if (!validation.valid) {
    console.error('❌ Mensaje inválido:', validation.error);
    sendResponse({ error: validation.error });
    return;
  }
  
  // Procesar mensaje válido
  processValidMessage(request, sendResponse);
  return true;
});
```

### 2. **Sanitización de Datos**

```javascript
const sanitizeMessageData = (data) => {
  if (typeof data !== 'object') return data;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    switch (typeof value) {
      case 'string':
        // Limpiar strings
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
        break;
        
      case 'number':
        // Validar rangos
        sanitized[key] = Math.max(0, Math.min(999999999, value));
        break;
        
      case 'object':
        // Sanitizar recursivamente
        sanitized[key] = sanitizeMessageData(value);
        break;
        
      default:
        sanitized[key] = value;
    }
  }
  
  return sanitized;
};
```

---

## 🧪 EJERCICIOS PRÁCTICOS

### Ejercicio 1: Sistema de Mensajería Completo

**Objetivo:** Implementar un sistema de comunicación bidireccional con validación.

```javascript
// communication-exercise.js
class RobustCommunication {
  constructor() {
    this.messageHandlers = new Map();
    this.setupMessageListener();
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        // Validar mensaje
        const validation = this.validateMessage(request);
        if (!validation.valid) {
          sendResponse({ 
            error: validation.error,
            code: 'INVALID_MESSAGE'
          });
          return;
        }
        
        // Verificar si hay manejador para esta acción
        if (this.messageHandlers.has(request.action)) {
          const handler = this.messageHandlers.get(request.action);
          
          // Ejecutar manejador
          const result = await handler(request.payload, sender);
          
          sendResponse({ 
            success: true,
            data: result,
            timestamp: Date.now()
          });
        } else {
          sendResponse({ 
            error: 'Acción no implementada',
            code: 'ACTION_NOT_FOUND'
          });
        }
        
      } catch (error) {
        console.error('Error procesando mensaje:', error);
        sendResponse({ 
          error: error.message,
          code: 'PROCESSING_ERROR'
        });
      }
      
      return true; // Mensaje asíncrono
    });
  }
  
  validateMessage(message) {
    // Implementar validación robusta
    if (!message || typeof message !== 'object') {
      return { valid: false, error: 'Formato inválido' };
    }
    
    if (!message.action) {
      return { valid: false, error: 'Acción requerida' };
    }
    
    return { valid: true };
  }
  
  registerHandler(action, handler) {
    this.messageHandlers.set(action, handler);
  }
}

// Uso
const comm = new RobustCommunication();

// Registrar manejadores
comm.registerHandler('getUserData', async (payload, sender) => {
  // Obtener datos del usuario
  return await chrome.storage.local.get(['userData']);
});

comm.registerHandler('updateUserPreferences', async (payload, sender) => {
  // Actualizar preferencias
  await chrome.storage.local.set({ userPreferences: payload });
  return { success: true };
});
```

### Ejercicio 2: Comunicación con Timeout y Retry

**Objetivo:** Implementar comunicación con reintento automático.

```javascript
// retry-communication.js
class RetryCommunication {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.pendingMessages = new Map();
  }
  
  async sendMessageWithRetry(message) {
    const messageId = this.generateMessageId();
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${this.maxRetries} para ${message.action}`);
        
        const response = await this.sendMessageOnce(message, messageId);
        
        // Éxito - limpiar mensaje pendiente
        this.pendingMessages.delete(messageId);
        return response;
        
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt} falló:`, error.message);
        
        if (attempt < this.maxRetries) {
          // Esperar con backoff exponencial
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Último intento falló
          this.pendingMessages.delete(messageId);
          throw new Error(`Fallaron todos los intentos: ${error.message}`);
        }
      }
    }
  }
  
  async sendMessageOnce(message, messageId) {
    return new Promise((resolve, reject) => {
      this.pendingMessages.set(messageId, { resolve, reject });
      
      const timeout = setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error('Timeout en comunicación'));
        }
      }, 5000);
      
      chrome.runtime.sendMessage({ ...message, messageId }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Uso
const retryComm = new RetryCommunication();

try {
  const response = await retryComm.sendMessageWithRetry({
    action: 'getArbitrages',
    payload: { exchanges: ['buenbit', 'lemon'] }
  });
  
  console.log('✅ Comunicación exitosa:', response);
} catch (error) {
  console.error('❌ Error en comunicación:', error);
}
```

---

## 📋 RESUMEN DEL MÓDULO

### ✅ Conceptos Aprendidos

1. **Chrome Runtime API**: Sistema de mensajería de extensiones
2. **Request-Response Pattern**: Comunicación síncrona estructurada
3. **Event-Driven Communication**: Sistema de eventos personalizado
4. **Message Queue**: Cola para manejar múltiples mensajes
5. **State Synchronization**: Sincronización de estado entre contextos
6. **Event Delegation**: Manejo eficiente de eventos en UI
7. **Seguridad**: Validación y sanitización de mensajes

### 🎯 Próximos Pasos

En el siguiente módulo vamos a ver:
- **Sistema de Cálculo de Arbitraje**: Matemáticas financieras
- **Interfaz de Usuario**: Manipulación avanzada del DOM
- **Estado y Almacenamiento**: Chrome Storage y state management
- **Buenas Prácticas**: Patrones de diseño avanzados

---

**¿Listo para continuar con el sistema de cálculo de arbitraje?**