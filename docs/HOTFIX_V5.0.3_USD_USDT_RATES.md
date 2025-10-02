# 🔧 HOTFIX v5.0.3 - Corrección USD/USDT Rates

**Fecha:** 2 de octubre de 2025  
**Tipo:** Critical Bugfix  
**Versión:** 5.0.3

## 🐛 Problema Identificado

### Descripción
La extensión estaba **asumiendo incorrectamente una tasa 1:1 para USD/USDT** en algunos exchanges como "cocoscrypto", cuando en realidad CriptoYA proporciona tasas de compra/venta diferentes.

### Datos Reales de CriptoYA
Según la API `/api/usdt/usd/1`, los exchanges tienen spreads significativos:

| Exchange | Compra (Ask) | Vende (Bid) | Spread |
|----------|--------------|-------------|--------|
| SatoshiTango | US$ 1.049 | US$ 1.017 | 3.18% |
| Buenbit | US$ 1.053 | US$ 1.027 | 2.53% |
| belo | US$ 1.051 | US$ 1.026 | 2.44% |
| Fiwind | US$ 1.053 | US$ 1.025 | 2.73% |

### Impacto
- ❌ Cálculos de rentabilidad **incorrectos**
- ❌ Algunos exchanges (como cocoscrypto) mostraban tasas 1:1 **irreales**
- ❌ Las rutas calculadas no reflejaban la realidad del mercado

## ✅ Solución Implementada

### 1. Corrección en `dataFetcher.js`
**Archivo:** `src/background/dataFetcher.js`

**Cambios:**
- ✅ Agregado logging detallado de estructura USD/USDT
- ✅ Muestra valores de `ask`, `totalAsk`, `bid`, `totalBid` para debugging

```javascript
// Log de ejemplo de estructura para verificar
const sampleExchange = Object.keys(data)[0];
if (sampleExchange && data[sampleExchange]) {
  log(`✅ USD/USDT rates obtenidos. Ejemplo ${sampleExchange}:`, {
    ask: data[sampleExchange].ask,
    totalAsk: data[sampleExchange].totalAsk,
    bid: data[sampleExchange].bid,
    totalBid: data[sampleExchange].totalBid
  });
}
```

### 2. Corrección en `routeCalculator.js`
**Archivo:** `src/background/routeCalculator.js`

#### Cambio 1: Usar `totalAsk` / `ask` en lugar de `.usd`
**ANTES:**
```javascript
let usdToUsdtRate = 1;
if (usdtUsd[buyExchange]?.usd) {
  usdToUsdtRate = parseFloat(usdtUsd[buyExchange].usd);
}
```

**DESPUÉS:**
```javascript
let usdToUsdtRate = 1;
if (usdtUsd[buyExchange]) {
  const askPrice = parseFloat(usdtUsd[buyExchange].totalAsk || usdtUsd[buyExchange].ask);
  if (askPrice && askPrice > 0) {
    usdToUsdtRate = askPrice;
    log(`💱 ${buyExchange} USD/USDT compra: ${usdToUsdtRate}`);
  } else {
    log(`⚠️ ${buyExchange} no tiene precio USD/USDT válido, usando 1:1`);
  }
}
```

**Explicación:**
- `totalAsk` / `ask` = **Precio de COMPRA** de USDT en USD
- Representa **cuántos USD necesito para comprar 1 USDT**
- Ejemplo: Si `totalAsk = 1.049`, necesito **1.049 USD para comprar 1 USDT**

#### Cambio 2: Validación de exchanges con datos válidos
**ANTES:**
```javascript
function getValidExchanges(usdt) {
  const buyExchanges = Object.keys(usdt).filter(key => {
    return typeof usdt[key] === 'object' &&
           usdt[key] !== null &&
           !excludedKeys.includes(key.toLowerCase());
  });
  // ...
}
```

**DESPUÉS:**
```javascript
function getValidExchanges(usdt, usdtUsd) {
  const buyExchanges = Object.keys(usdt).filter(key => {
    // ... validaciones previas ...
    
    // NUEVO: Validar que tenga datos válidos en USD/USDT
    if (usdtUsd?.[key]) {
      const askPrice = parseFloat(usdtUsd[key].totalAsk || usdtUsd[key].ask);
      if (!askPrice || askPrice <= 0 || askPrice === 1) {
        log(`⚠️ ${key} tiene USD/USDT inválido: ${askPrice}, excluyendo...`);
        return false;
      }
    } else {
      log(`⚠️ ${key} no tiene datos USD/USDT, excluyendo...`);
      return false;
    }
    
    return true;
  });
  // ...
}
```

**Explicación:**
- ✅ Filtra exchanges **sin datos USD/USDT**
- ✅ Filtra exchanges con tasas **1:1 exactas** (probablemente incorrectos)
- ✅ Filtra exchanges con tasas **≤ 0** (datos inválidos)

## 📊 Estructura de Datos CriptoYA

### Endpoint: `/api/usdt/usd/1`
```json
{
  "buenbit": {
    "ask": 1.053,
    "totalAsk": 1.053,
    "bid": 1.027,
    "totalBid": 1.027,
    "time": 1727894400
  },
  "satoshitango": {
    "ask": 1.049,
    "totalAsk": 1.049,
    "bid": 1.017,
    "totalBid": 1.017,
    "time": 1727894400
  }
}
```

### Significado de los campos:
- **`ask` / `totalAsk`**: Precio de **COMPRA** de USDT (lo que pago en USD por 1 USDT)
- **`bid` / `totalBid`**: Precio de **VENTA** de USDT (lo que recibo en USD al vender 1 USDT)
- **Spread**: Diferencia entre ask y bid (ganancia del exchange)

## 🎯 Resultados Esperados

### Antes del Fix
```
cocoscrypto: USD/USDT = 1.0 (incorrecto)
Cálculo: 100 USD → 100 USDT (irreal)
```

### Después del Fix
```
buenbit: USD/USDT = 1.053 (correcto)
Cálculo: 100 USD → 95.06 USDT (real)
Exchange sin datos válidos → EXCLUIDO
```

## 🔍 Testing Requerido

### 1. Verificar Logs en Console
```javascript
✅ USD/USDT rates obtenidos. Ejemplo buenbit: {
  ask: 1.053,
  totalAsk: 1.053,
  bid: 1.027,
  totalBid: 1.027
}

💱 buenbit USD/USDT compra: 1.053
⚠️ cocoscrypto tiene USD/USDT inválido: 1, excluyendo...
```

### 2. Verificar Rutas Calculadas
- ✅ No deben aparecer exchanges con tasa 1:1 exacta
- ✅ Los cálculos deben reflejar spreads reales
- ✅ La rentabilidad debe ser más precisa

### 3. Comparar con CriptoYA
- ✅ Los valores deben coincidir con https://criptoya.com
- ✅ Los spreads deben ser consistentes

## 📝 Archivos Modificados

1. **`src/background/dataFetcher.js`**
   - Agregado logging detallado de estructura USD/USDT

2. **`src/background/routeCalculator.js`**
   - Cambiado `.usd` por `.totalAsk` / `.ask`
   - Agregada validación de tasas USD/USDT válidas
   - Mejorada función `getValidExchanges` con segundo parámetro

## 🚀 Próximos Pasos

1. ✅ Recargar extensión en Chrome
2. ✅ Verificar logs en console del service worker
3. ✅ Confirmar que exchanges inválidos sean excluidos
4. ✅ Validar que cálculos sean más precisos
5. 🔄 Monitorear por 24-48 horas para confirmar estabilidad

## ⚠️ Notas Importantes

- **Exchanges sin datos USD/USDT serán EXCLUIDOS automáticamente**
- **Exchanges con tasa 1:1 exacta serán considerados INVÁLIDOS**
- Los logs ahora muestran **qué exchanges fueron excluidos y por qué**
- El spread real de cada exchange ahora se refleja en los cálculos

---

**Versión:** 5.0.3  
**Estado:** ✅ Implementado  
**Testing:** 🔄 Pendiente validación en producción
