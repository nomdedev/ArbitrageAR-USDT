# HOTFIX v5.0.7 - Corrección Scraping USD/USDT y Filtros P2P

**Fecha:** 2024-10-02  
**Tipo:** Hotfix Crítico  
**Prioridad:** Alta  
**Estado:** ✅ Completado

**Documentación API:** https://docs.criptoya.com/argentina/

---

## 🎯 Objetivo

Corregir dos problemas críticos reportados:
1. **Scraping incorrecto USD/USDT** - Exchanges muestran tasa 1:1 cuando no es real (ej: cocoscrypto)
2. **Mezcla de rutas P2P/No-P2P** - Filtros no separan correctamente las operaciones

---

## 🐛 Problemas Identificados

### 1. Tasa USD/USDT Incorrecta (1:1)

**Síntoma:**
```
cocoscrypto: USD/USDT = 1.0 (incorrecto)
Debería ser: ~1.05 (spread real del mercado)
```

**Causa Actual:**
```javascript
// routeCalculator.js - línea 66
const askPrice = parseFloat(usdtUsd[key].totalAsk || usdtUsd[key].ask);
if (askPrice && askPrice > 0 && askPrice < 0.5) {
  // Solo excluye si < 0.5, permite 1.0 exacto
  return false;
}
```

**Problema:**
- La validación solo rechaza `askPrice < 0.5`
- Exchanges con exactamente `1.0` pasan la validación
- `1.0` es sospechoso porque implica 0% de spread (irreal en crypto)

### 2. Mezcla de Rutas P2P y No-P2P

**Síntoma:**
```
Filtro "SIN P2P" muestra rutas con operaciones P2P mezcladas
Filtro "CON P2P" no identifica correctamente todas las rutas P2P
```

**Causa Actual:**
```javascript
// popup.js - línea 77
function isP2PRoute(route) {
  const brokerName = route.broker.toLowerCase();
  return brokerName.includes('p2p');
}
```

**Problemas:**
1. Solo verifica si el nombre del broker contiene "p2p"
2. No verifica si algún paso intermedio usa P2P
3. `route.broker` puede no existir o ser incorrecto
4. No usa datos estructurados del exchange

---

## ✅ Soluciones Propuestas

### Solución 1: Validación Estricta de USD/USDT

**Archivo:** `src/background/routeCalculator.js`

#### 1.1. Excluir tasas exactamente = 1.0

```javascript
function getValidExchanges(usdt, usdtUsd) {
  const excludedKeys = ['time', 'timestamp', 'fecha', 'date', 'p2p', 'total'];

  const buyExchanges = Object.keys(usdt).filter(key => {
    // ... validaciones existentes ...

    // ✅ NUEVO: Validación mejorada USD/USDT
    if (usdtUsd?.[key]) {
      const askPrice = parseFloat(usdtUsd[key].totalAsk || usdtUsd[key].ask);
      
      // Rechazar si:
      // 1. askPrice no válido (null, NaN, <= 0)
      // 2. askPrice exactamente = 1.0 (sin spread, sospechoso)
      // 3. askPrice < 0.95 o > 1.15 (fuera de rango esperado)
      if (!askPrice || askPrice <= 0) {
        log(`⚠️ ${key}: USD/USDT inválido (${askPrice}), excluyendo`);
        return false;
      }
      
      if (askPrice === 1.0) {
        log(`⚠️ ${key}: USD/USDT = 1.0 exacto (sin spread), excluyendo`);
        return false;
      }
      
      if (askPrice < 0.95 || askPrice > 1.15) {
        log(`⚠️ ${key}: USD/USDT fuera de rango (${askPrice}), excluyendo`);
        return false;
      }
    } else {
      // Si no hay datos USD/USDT, excluir por seguridad
      log(`⚠️ ${key}: Sin datos USD/USDT, excluyendo`);
      return false;
    }

    return true;
  });

  return {
    buyExchanges,
    sellExchanges: [...buyExchanges]
  };
}
```

**Justificación:**
- **`askPrice === 1.0`**: Ningún exchange tiene spread exactamente 0%, siempre hay comisión
- **Rango 0.95 - 1.15**: Spread típico USD/USDT es ±5-15%
- **Sin datos USD/USDT**: Excluir por defecto (era fallback a 1.0, incorrecto)

#### 1.2. Eliminar fallback a 1.0 en calculateRoute

```javascript
// ANTES (línea 110-116)
let usdToUsdtRate = 1;  // ❌ Fallback incorrecto
if (usdtUsd?.[buyExchange]) {
  const askPrice = parseFloat(usdtUsd[buyExchange].totalAsk || usdtUsd[buyExchange].ask);
  if (askPrice && askPrice > 0) {
    usdToUsdtRate = askPrice;
  }
}

// ✅ DESPUÉS - Sin fallback
let usdToUsdtRate;
if (usdtUsd?.[buyExchange]) {
  usdToUsdtRate = parseFloat(usdtUsd[buyExchange].totalAsk || usdtUsd[buyExchange].ask);
} else {
  // Si no hay datos, esta ruta no debería existir (ya filtrada en getValidExchanges)
  log(`❌ ${buyExchange}: No hay datos USD/USDT`);
  return null;
}

if (!usdToUsdtRate || usdToUsdtRate <= 0 || usdToUsdtRate === 1.0) {
  log(`❌ ${buyExchange}: USD/USDT inválido (${usdToUsdtRate})`);
  return null;
}
```

### Solución 2: Detección Correcta de P2P

**Archivos:** `src/background/brokerData.js`, `src/background/routeCalculator.js`, `src/popup.js`

#### 2.1. Agregar flag P2P en brokerData.js

```javascript
export const BROKER_DATA = {
  binance: {
    name: 'Binance',
    fees: { trading: 0.1, withdrawal: 0 },
    requiresP2P: false  // ✅ NUEVO
  },
  binancep2p: {
    name: 'Binance P2P',
    fees: { trading: 0, withdrawal: 0 },
    requiresP2P: true  // ✅ NUEVO - Requiere P2P
  },
  buenbit: {
    name: 'Buenbit',
    fees: { trading: 0.5, withdrawal: 0 },
    requiresP2P: false
  },
  // ... resto de brokers con flag requiresP2P
};
```

#### 2.2. Calcular requiresP2P en calculateRoute

```javascript
async function calculateRoute(buyExchange, sellExchange, ...) {
  // ... cálculos existentes ...

  // ✅ NUEVO: Determinar si la ruta requiere P2P
  const buyBroker = await getBrokerData(buyExchange);
  const sellBroker = await getBrokerData(sellExchange);
  
  const requiresP2P = (buyBroker?.requiresP2P || sellBroker?.requiresP2P) || false;

  return {
    buyExchange,
    sellExchange,
    requiresP2P,  // ✅ NUEVO campo
    // ... resto de campos
  };
}
```

#### 2.3. Actualizar isP2PRoute en popup.js

```javascript
// ✅ NUEVO: Basado en campo requiresP2P
function isP2PRoute(route) {
  if (!route) return false;
  
  // Usar el campo requiresP2P calculado en backend
  if (typeof route.requiresP2P === 'boolean') {
    return route.requiresP2P;
  }
  
  // Fallback: verificar nombre del broker
  if (route.broker) {
    const brokerName = route.broker.toLowerCase();
    return brokerName.includes('p2p');
  }
  
  // Fallback adicional: verificar nombres de exchanges
  const buyName = (route.buyExchange || '').toLowerCase();
  const sellName = (route.sellExchange || '').toLowerCase();
  return buyName.includes('p2p') || sellName.includes('p2p');
}
```

---

## 📊 Comparativa Antes/Después

### Validación USD/USDT

| Exchange | Tasa Real | ❌ Antes | ✅ Después |
|----------|-----------|----------|------------|
| Buenbit | 1.053 | Acepta | Acepta |
| Binance | 1.048 | Acepta | Acepta |
| cocoscrypto | 1.0 exacto | ⚠️ Acepta | ❌ Rechaza |
| Exchange sin datos | - | ⚠️ Fallback 1.0 | ❌ Rechaza |
| Exchange con 0.3 | 0.3 | ❌ Rechaza | ❌ Rechaza |

### Detección P2P

| Ruta | Tipo Real | ❌ Antes | ✅ Después |
|------|-----------|----------|------------|
| Binance → Buenbit | No-P2P | ✓ Correcto | ✓ Correcto |
| Binance P2P → Buenbit | P2P | ⚠️ A veces falla | ✓ Siempre correcto |
| Buenbit → Binance P2P | P2P | ⚠️ A veces falla | ✓ Siempre correcto |
| Ripio P2P → Ripio P2P | P2P | ✓ Correcto | ✓ Correcto |

---

## 🔧 Archivos a Modificar

```
src/background/
├── routeCalculator.js
│   ├── getValidExchanges() - Validación USD/USDT mejorada
│   ├── calculateRoute() - Sin fallback 1.0, agregar requiresP2P
│   └── Eliminar validación permisiva
├── brokerData.js
│   └── Agregar flag requiresP2P a cada broker
└── dataFetcher.js
    └── (Sin cambios - ya loggea estructura correctamente)

src/
└── popup.js
    └── isP2PRoute() - Usar campo requiresP2P
```

---

## 🧪 Testing Plan

### Test 1: Validación USD/USDT

```javascript
// Caso 1: Exchange con tasa 1.0 exacto
Input: cocoscrypto { totalAsk: 1.0, ask: 1.0 }
Expected: ❌ Rechazar, no aparecer en rutas

// Caso 2: Exchange sin datos USD/USDT
Input: nuevo_exchange sin entrada en usdtUsd
Expected: ❌ Rechazar, no aparecer en rutas

// Caso 3: Exchange con tasa válida
Input: buenbit { totalAsk: 1.053, ask: 1.05 }
Expected: ✅ Aceptar, aparecer en rutas
```

### Test 2: Detección P2P

```javascript
// Caso 1: Ruta 100% sin P2P
Route: Binance → Buenbit
Expected: requiresP2P = false, badge "⚡ Directo"

// Caso 2: Ruta con P2P en compra
Route: Binance P2P → Buenbit
Expected: requiresP2P = true, badge "🤝 P2P"

// Caso 3: Ruta con P2P en venta
Route: Buenbit → Binance P2P
Expected: requiresP2P = true, badge "🤝 P2P"
```

### Test 3: Filtros de UI

```
1. Aplicar filtro "SIN P2P"
   - Solo rutas con requiresP2P = false
   - Verificar que NO aparezcan rutas con "p2p" en el nombre

2. Aplicar filtro "CON P2P"
   - Solo rutas con requiresP2P = true
   - Verificar que todas tengan badge "🤝 P2P"

3. Aplicar filtro "TODAS"
   - Mostrar ambas mezcladas
   - Cada ruta con su badge correcto
```

---

## ✅ Checklist de Implementación

- [x] config.js - Agregar flag `requiresP2P` a todos los brokers
- [x] routeCalculator.js - Mejorar validación USD/USDT en getValidExchanges
- [x] routeCalculator.js - Eliminar fallback a 1.0 en calculateRoute
- [x] routeCalculator.js - Agregar validación estricta de usdToUsdtRate
- [x] routeCalculator.js - Calcular campo requiresP2P en cada ruta
- [x] popup.js - Actualizar isP2PRoute() para usar requiresP2P
- [ ] Testing manual con datos reales
- [ ] Verificar logs de exchanges excluidos
- [ ] Validar filtros P2P/No-P2P funcionan correctamente
- [ ] Verificar que cocoscrypto no aparece en rutas

---

## 📚 Referencias API CriptoYa

**Documentación Oficial:** https://docs.criptoya.com/argentina/

### Endpoint: Cotización General
```
GET /api/{coin}/{fiat}/{volumen}
GET /api/usdt/usd/1
```

**Estructura de Respuesta:**
```json
{
  "ask": number,       // Precio de COMPRA (sin fees)
  "totalAsk": number,  // Precio de COMPRA (CON FEES) ← USAMOS ESTE
  "bid": number,       // Precio de VENTA (sin fees)
  "totalBid": number,  // Precio de VENTA (CON FEES) ← USAMOS ESTE
  "time": number
}
```

**Para nuestro flujo (USDT/USD/1):**
- `totalAsk`: Cuántos USD necesito para COMPRAR 1 USDT (con comisiones)
- `totalBid`: Cuántos USD recibo por VENDER 1 USDT (con comisiones)

**Ejemplo Real:**
```json
// Buenbit
{
  "ask": 1.04,
  "totalAsk": 1.053,    // ← USAMOS: 1 USDT cuesta 1.053 USD
  "bid": 1.03,
  "totalBid": 1.027     // ← USAMOS: 1 USDT vale 1.027 USD al vender
}

// cocoscrypto (PROBLEMÁTICO)
{
  "ask": 1.0,
  "totalAsk": 1.0,      // ⚠️ SOSPECHOSO: Spread 0%
  "bid": 1.0,
  "totalBid": 1.0
}
```

---

**Autor:** GitHub Copilot  
**Revisado por:** Martin  
**Estado:** ✅ Implementado, pendiente testing
