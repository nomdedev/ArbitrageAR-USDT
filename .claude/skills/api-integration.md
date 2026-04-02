---
skillName: api-integration
description: Agente especializado en integración con APIs externas
tags: [api, fetch, dolarapi, criptoya, rate-limiting]
---

# API Integration Skill

## Descripción
Agente especializado en integración con APIs externas del proyecto.

## Capacidades

### APIs Integradas
- **DolarAPI**: Dólar oficial argentino
- **CriptoYa USDT/ARS**: Precios de exchanges
- **CriptoYa Banks**: Bancos argentinos
- **CriptoYa USDT/USD**: Paridad USDT/USD

### Componentes Clave
- `src/background/apiClient.js`: Cliente principal
- `src/DataService.js`: Servicio de datos
- `src/background/cacheManager.js`: Cache de respuestas

### Endpoints
```javascript
const ENDPOINTS = {
  DOLARAPI_OFICIAL: 'https://dolarapi.com/v1/dolares/oficial',
  CRIPTOYA_USDT_ARS: 'https://criptoya.com/api/usdt/ars/1',
  CRIPTOYA_BANKS: 'https://criptoya.com/api/bancostodos',
  CRIPTOYA_USDT_USD: 'https://criptoya.com/api/usdt/usd/1'
};
```

### Rate Limiting
```javascript
// Intervalo mínimo entre requests: 600ms
const RATE_LIMIT_INTERVAL = 600;
let lastRequestTime = 0;

async function applyRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_INTERVAL) {
    await sleep(RATE_LIMIT_INTERVAL - elapsed);
  }
  lastRequestTime = Date.now();
}
```

### Timeout Configuration
```javascript
const TIMEOUT = 12000; // 12 segundos

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

### Response Validation
```javascript
function validateApiResponse(data, schema) {
  // Validar estructura
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response structure');
  }

  // Validar campos requeridos
  for (const field of schema.required) {
    if (data[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return true;
}
```

### Schemas Esperados
```javascript
const SCHEMAS = {
  dolarapi: {
    required: ['compra', 'venta', 'fechaActualizacion'],
    types: { compra: 'number', venta: 'number' }
  },
  criptoya_usdt: {
    required: ['bid', 'ask'],
    types: { bid: 'number', ask: 'number' }
  }
};
```

### Cache TTL
```javascript
const CACHE_TTL = {
  dolarapi: 60000,      // 1 minuto
  criptoya: 30000,      // 30 segundos
  banks: 120000         // 2 minutos
};
```

### Instrucciones de Uso

1. **Nuevo endpoint**: Añadir a ENDPOINTS con validación
2. **Nuevo schema**: Definir campos requeridos y tipos
3. **Ajustar timeout**: Modificar TIMEOUT según endpoint
4. **Nuevo cache TTL**: Añadir a CACHE_TTL

---

## Notas Importantes

- Rate limiting para evitar baneos de APIs
- Timeout siempre configurado
- Validar responses antes de usar
- Manejar errores con retry logic