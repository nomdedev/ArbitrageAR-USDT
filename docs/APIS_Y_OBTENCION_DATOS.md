# 🌐 APIS Y OBTENCIÓN DE DATOS - ArbitrageAR-USDT

**Fecha:** 25 de Febrero de 2026  
**Nivel:** Intermedio  
**Objetivo:** Entender cómo obtener datos de APIs externas en extensiones Chrome

---

## 🎯 ¿QUÉ SON LAS APIS?

Una API (Application Programming Interface) es un **contrato** que permite que diferentes programas se comuniquen entre sí.

**Analogía:** Piensa en una API como un **menú de restaurante**:
- **Cliente**: Tú (el que pide el menú)
- **API**: El restaurante (expone lo que ofrece)
- **Endpoints**: Las secciones del menú (entradas, platos principales, postres)

---

## 📡 FETCH API: El Cliente Universal

### Conceptos Fundamentales

Fetch es la API moderna del navegador para hacer peticiones HTTP:

```javascript
// Sintaxis básica
fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Con async/await (más moderno)
async function obtenerDatos() {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MiExtensión/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    throw error;
  }
}
```

### Options Avanzadas de Fetch

```javascript
const options = {
  method: 'POST', // GET, POST, PUT, DELETE
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'valor-personalizado'
  },
  body: JSON.stringify({ key: 'value' }), // Para POST/PUT
  mode: 'cors', // Manejo de CORS
  credentials: 'include', // Incluir cookies
  cache: 'no-cache', // Control de caché
  redirect: 'follow', // Seguir redirecciones
  referrer: 'no-referrer', // Política de referer
  integrity: 'sha384-abc123', // Verificar integridad
  keepalive: true, // Mantener conexión viva
  signal: abortController.signal // Para cancelar petición
};
```

---

## 🔧 API CLIENT DE ARBITRAGEAR

### Arquitectura del Cliente

El proyecto usa un **cliente centralizado** para todas las APIs externas:

```javascript
// apiClient.js
const ApiClient = (() => {
  // Configuración global
  const config = {
    timeout: 12000, // 12 segundos
    rateLimit: 600, // 10 minutos entre requests
    retries: 3,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ArbitrageAR/6.0.0'
    }
  };
  
  // Estado para rate limiting
  let lastRequestTime = 0;
  
  // Endpoints configurados
  const ENDPOINTS = {
    CRIPTOYA_USDT_ARS: 'https://criptoya.com/api/usdt/ars/1',
    CRIPTOYA_BANKS: 'https://criptoya.com/api/bancostodos',
    DOLARAPI_OFICIAL: 'https://dolarapi.com/v1/dolares/oficial',
    BNA_OFICIAL: 'https://api.bna.com.ar/v1/precios'
  };
  
  return {
    // Métodos principales
  fetchDolarAPI,
    fetchCriptoyaAPI,
    fetchAllData
  };
})();
```

### Rate Limiting Inteligente

```javascript
const applyRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < config.rateLimit) {
    const waitTime = config.rateLimit - timeSinceLastRequest;
    console.log(`⏳ Rate limit: esperando ${waitTime}ms`);
    
    await new Promise(resolve => 
      setTimeout(resolve, waitTime)
    );
  }
  
  lastRequestTime = Date.now();
};
```

### Fetch con Timeout y Retry

```javascript
const fetchWithTimeout = async (url, options = {}) => {
  // Aplicar rate limiting
  await applyRateLimit();
  
  // Configurar timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Timeout después de ${config.timeout}ms`);
    }
    
    throw error;
  }
};
```

---

## 🏦 APIS UTILIZADAS EN ARBITRAGEAR

### 1. **DolarAPI - Precio del Dólar Oficial**

```javascript
const fetchDolarAPI = async () => {
  try {
    console.log('💵 Obteniendo dólar oficial desde DolarAPI...');
    
    const response = await fetchWithTimeout(ENDPOINTS.DOLARAPI_OFICIAL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DolarAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ DolarAPI response:', {
      compra: data.compra,
      venta: data.venta,
      fecha: data.fechaActualizacion
    });
    
    return {
      compra: parseFloat(data.compra),
      venta: parseFloat(data.venta),
      fecha: data.fechaActualizacion,
      fuente: 'dolarapi.com'
    };
    
  } catch (error) {
    console.error('❌ Error en DolarAPI:', error);
    throw error;
  }
};
```

### 2. **Criptoya - Datos de Exchanges y Bancos**

```javascript
const fetchCriptoyaAPI = async () => {
  try {
    console.log('🪙 Obteniendo datos desde Criptoya...');
    
    // Obtener múltiples endpoints en paralelo
    const [usdtResponse, banksResponse] = await Promise.all([
      fetchWithTimeout(ENDPOINTS.CRIPTOYA_USDT_ARS),
      fetchWithTimeout(ENDPOINTS.CRIPTOYA_BANKS)
    ]);
    
    // Procesar respuesta de USDT
    const usdtData = await usdtResponse.json();
    const usdtExchanges = Object.entries(usdtData)
      .filter(([exchange, data]) => data.ask && data.bid)
      .map(([exchange, data]) => ({
        exchange,
        ask: parseFloat(data.ask),  // Precio de compra
        bid: parseFloat(data.bid),  // Precio de venta
        spread: parseFloat(data.bid) - parseFloat(data.ask)
      }));
    
    // Procesar respuesta de bancos
    const banksData = await banksResponse.json();
    const banks = Object.entries(banksData)
      .filter(([bank, data]) => data.ask && data.bid)
      .map(([bank, data]) => ({
        bank,
        ask: parseFloat(data.ask),  // Precio de compra
        bid: parseFloat(data.bid),  // Precio de venta
        spread: parseFloat(data.bid) - parseFloat(data.ask)
      }));
    
    console.log('✅ Criptoya response:', {
      usdtExchanges: usdtExchanges.length,
      banks: banks.length
    });
    
    return {
      usdtExchanges,
      banks,
      fuente: 'criptoya.com'
    };
    
  } catch (error) {
    console.error('❌ Error en Criptoya:', error);
    throw error;
  }
};
```

### 3. **BNA API - Banco Central**

```javascript
const fetchBNAData = async () => {
  try {
    console.log('🏦 Obteniendo datos desde BNA...');
    
    const response = await fetchWithTimeout(ENDPOINTS.BNA_OFICIAL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`BNA API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ BNA response:', {
      oficial: data.oficial,
      blue: data.blue
    });
    
    return {
      oficial: {
        compra: parseFloat(data.oficial.compra),
        venta: parseFloat(data.oficial.venta)
      },
      blue: {
        compra: parseFloat(data.blue.compra),
        venta: parseFloat(data.blue.venta)
      },
      fuente: 'bna.gob.ar'
    };
    
  } catch (error) {
    console.error('❌ Error en BNA:', error);
    throw error;
  }
};
```

---

## 🔄 MANEJO DE ERRORES AVANZADO

### 1. **Clasificación de Errores**

```javascript
class APIError extends Error {
  constructor(message, code, source, originalError = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.source = source;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

const ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  HTTP_ERROR: 'HTTP_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_RESPONSE: 'INVALID_RESPONSE'
};

// Manejo centralizado de errores
const handleAPIError = (error, source) => {
  if (error.name === 'AbortError') {
    return new APIError(
      `Timeout en ${source}`,
      ERROR_CODES.TIMEOUT,
      source,
      error
    );
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new APIError(
      `Error de red en ${source}`,
      ERROR_CODES.NETWORK_ERROR,
      source,
      error
    );
  }
  
  if (error.message.includes('JSON')) {
    return new APIError(
      `Error parseando respuesta de ${source}`,
      ERROR_CODES.PARSE_ERROR,
      source,
      error
    );
  }
  
  return new APIError(
    `Error desconocido en ${source}`,
    ERROR_CODES.INVALID_RESPONSE,
    source,
    error
  );
};
```

### 2. **Circuit Breaker Pattern**

```javascript
class CircuitBreaker {
  constructor(failureThreshold = 5, timeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation) {
    // Verificar si el circuito está abierto
    if (this.state === 'OPEN') {
      return await operation();
    }
    
    // Verificar si debemos abrir el circuito
    const now = Date.now();
    if (now - this.lastFailureTime > this.timeout) {
      this.state = 'OPEN';
      this.failureCount = 0;
    }
    
    if (this.state === 'CLOSED') {
      throw new Error('Circuit breaker está cerrado');
    }
    
    try {
      const result = await operation();
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = now;
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'CLOSED';
        console.warn('⚠️ Circuit breaker cerrado por fallos');
      }
      
      throw error;
    }
  }
}

// Uso
const circuitBreaker = new CircuitBreaker();
const data = await circuitBreaker.execute(() => fetchAPI());
```

---

## 📊 PROCESAMIENTO Y TRANSFORMACIÓN DE DATOS

### 1. **Normalización de Datos**

```javascript
const normalizePrice = (price) => {
  const num = parseFloat(price);
  return isNaN(num) ? 0 : num;
};

const normalizeExchangeData = (rawData) => {
  return {
    exchange: rawData.exchange || 'unknown',
    ask: normalizePrice(rawData.ask),
    bid: normalizePrice(rawData.bid),
    spread: normalizePrice(rawData.bid) - normalizePrice(rawData.ask),
    timestamp: rawData.timestamp || Date.now(),
    source: rawData.source || 'unknown'
  };
};

const normalizeBankData = (rawData) => {
  return {
    bank: rawData.bank || 'unknown',
    ask: normalizePrice(rawData.ask),
    bid: normalizePrice(rawData.bid),
    spread: normalizePrice(rawData.bid) - normalizePrice(rawData.ask),
    timestamp: rawData.timestamp || Date.now(),
    source: rawData.source || 'unknown'
  };
};
```

### 2. **Validación de Datos**

```javascript
const validateExchangeData = (data) => {
  const errors = [];
  
  if (!data.exchange || typeof data.exchange !== 'string') {
    errors.push('Nombre de exchange inválido');
  }
  
  if (!data.ask || data.ask <= 0) {
    errors.push('Precio de compra inválido');
  }
  
  if (!data.bid || data.bid <= 0) {
    errors.push('Precio de venta inválido');
  }
  
  if (data.spread > data.ask * 0.1) {
    errors.push('Spread demasiado alto (posible error)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 3. **Agregación de Múltiples Fuentes**

```javascript
const aggregateMultipleSources = async () => {
  try {
    // Obtener datos de múltiples fuentes en paralelo
    const [dolarapiData, criptoyaData, bnaData] = await Promise.all([
      fetchDolarAPI(),
      fetchCriptoyaAPI(),
      fetchBNAData()
    ]);
    
    // Calcular consenso de precios
    const dollarPrices = [
      dolarapiData.venta,
      criptoyaData.banks.find(b => b.bank === 'nacion')?.bid,
      bnaData.oficial.venta
    ].filter(price => price > 0);
    
    const consensusDollar = dollarPrices.length > 0 
      ? dollarPrices.reduce((sum, price) => sum + price, 0) / dollarPrices.length
      : 1050; // Valor por defecto
    
    // Combinar datos de exchanges
    const allExchanges = [
      ...criptoyaData.usdtExchanges,
      ...criptoyaData.banks
    ];
    
    // Eliminar duplicados y ordenar
    const uniqueExchanges = allExchanges
      .filter((exchange, index, arr) => 
        arr.findIndex(e => e.exchange === exchange.exchange) === index
      )
      .sort((a, b) => a.ask - b.ask);
    
    return {
      oficial: {
        compra: consensusDollar,
        venta: consensusDollar * 1.01, // Peño margen
        fuentes: [dolarapiData.fuente, criptoyaData.fuente, bnaData.fuente]
      },
      exchanges: uniqueExchanges,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Error agregando fuentes:', error);
    throw error;
  }
};
```

---

## 🧪 EJERCICIOS PRÁCTICOS

### Ejercicio 1: Cliente API Básico

**Objetivo:** Crear un cliente API simple con retry y timeout.

```javascript
// mi-api-client.js
class SimpleAPIClient {
  constructor(baseURL, timeout = 5000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    
    // Timeout
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout después de ${this.timeout}ms`);
      }
      
      throw error;
    }
  }
  
  // Método con retry
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${maxRetries} para ${endpoint}`);
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Intento ${attempt} falló:`, error.message);
        
        if (attempt < maxRetries) {
          // Esperar exponencial antes de reintentar
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Todos los intentos fallaron. Último error: ${lastError.message}`);
  }
}

// Uso
const apiClient = new SimpleAPIClient('https://api.example.com');

// Obtener datos con retry
const data = await apiClient.requestWithRetry('/users', {
  method: 'GET'
});
```

### Ejercicio 2: Procesador de Múltiples APIs

**Objetivo:** Crear un sistema que obtenga y combine datos de múltiples fuentes.

```javascript
// multi-source-processor.js
class MultiSourceProcessor {
  constructor(sources) {
    this.sources = sources;
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutos
  }
  
  async getAllData() {
    const results = {};
    const errors = [];
    
    // Obtener datos de todas las fuentes en paralelo
    const promises = this.sources.map(async (source) => {
      try {
        // Verificar cache primero
        const cached = this.getCachedData(source.name);
        if (cached) {
          console.log(`📦 Usando cache para ${source.name}`);
          return { source: source.name, data: cached, cached: true };
        }
        
        // Obtener datos frescos
        console.log(`🌐 Obteniendo datos frescos de ${source.name}`);
        const data = await source.fetcher();
        
        // Guardar en cache
        this.setCachedData(source.name, data);
        
        return { source: source.name, data, cached: false };
        
      } catch (error) {
        console.error(`❌ Error en ${source.name}:`, error);
        errors.push({ source: source.name, error });
        return { source: source.name, error: true };
      }
    });
    
    const allResults = await Promise.all(promises);
    
    // Procesar resultados exitosos
    allResults.forEach(result => {
      if (!result.error) {
        results[result.source] = result.data;
      }
    });
    
    return {
      data: results,
      errors,
      hasErrors: errors.length > 0,
      successCount: allResults.length - errors.length
    };
  }
  
  getCachedData(sourceName) {
    const cached = this.cache.get(sourceName);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached.data;
    }
    return null;
  }
  
  setCachedData(sourceName, data) {
    this.cache.set(sourceName, {
      data,
      timestamp: Date.now()
    });
  }
}

// Configuración de fuentes
const sources = [
  {
    name: 'dolarapi',
    fetcher: () => fetch('https://dolarapi.com/v1/dolares/oficial').then(r => r.json())
  },
  {
    name: 'criptoya',
    fetcher: () => fetch('https://criptoya.com/api/usdt/ars/1').then(r => r.json())
  }
];

// Uso
const processor = new MultiSourceProcessor(sources);
const result = await processor.getAllData();

if (result.hasErrors) {
  console.error('❌ Errores en algunas fuentes:', result.errors);
}

console.log('✅ Datos obtenidos:', result.data);
```

---

## 📋 RESUMEN DEL MÓDULO

### ✅ Conceptos Aprendidos

1. **Fetch API**: Cliente universal para peticiones HTTP
2. **Configuración avanzada**: Timeout, headers, retries
3. **Rate Limiting**: Control de frecuencia de peticiones
4. **Manejo de errores**: Clasificación y circuit breaker
5. **Procesamiento paralelo**: Promise.all para múltiples APIs
6. **Normalización**: Estandarización de datos de diferentes fuentes
7. **Caching**: Cache inteligente con TTL

### 🎯 Próximos Pasos

En el siguiente módulo vamos a ver:
- **Comunicación entre Componentes**: Mensajería avanzada
- **Sistema de Cálculo de Arbitraje**: Matemáticas financieras
- **Interfaz de Usuario**: Manipulación del DOM y eventos

---

**¿Listo para continuar con el flujo de comunicación entre componentes?**