# 🔧 HOTFIX v5.0.1 - Rutas No Aparecían

**Fecha**: 2 de octubre de 2025  
**Problema reportado**: "31 oportunidades encontradas pero no aparecen rutas"

---

## 🐛 **BUGS IDENTIFICADOS**

### 1. **30+ Exchanges Sin Fees Definidos**
```
Exchange ripioexchange no encontrado en DB
Exchange universalcoins no encontrado en DB
Exchange decrypto no encontrado en DB
Exchange binancep2p no encontrado en DB
... +27 más
```

**Causa**: API de CriptoYA retorna muchos exchanges nuevos que no estaban en `EXCHANGE_FEES`.

**Impacto**: Usaba fees por defecto pero generaba 30+ warnings en consola.

---

### 2. **Spread P2P Rechazado Erróneamente**
```javascript
// ANTES
if (Math.abs(spreadArs) > 10) {
  console.warn(`${exchangeName} spread muy alto`);
  return; // ❌ Rechazaba P2P legítimos
}
```

**Problema**: 
- Exchanges P2P (Binance P2P, OKEx P2P, etc.) tienen spreads naturalmente >10%
- Esto es NORMAL en P2P porque son ofertas individuales
- La extensión los rechazaba como "inválidos"

**Ejemplo real**:
```
huobip2p spread: -100% → RECHAZADO
binancep2p spread: 15% → RECHAZADO
```

---

### 3. **Lookup de Fees Case-Sensitive**
```javascript
// ANTES
const buyFees = EXCHANGE_FEES[buyExchange]; // 'Binance' !== 'binance'

// AHORA
const buyFees = EXCHANGE_FEES[buyExchange.toLowerCase()];
```

**Causa**: CriptoYA retorna nombres mixtos: `Binance`, `BuenBit`, `Ripio`.

---

## ✅ **FIXES APLICADOS**

### Fix #1: Agregados 30+ Exchanges
```javascript
const EXCHANGE_FEES = {
  // Exchanges centralizados
  'ripioexchange': { trading: 1.0, withdrawal: 0 },
  'universalcoins': { trading: 1.2, withdrawal: 0 },
  'decrypto': { trading: 1.0, withdrawal: 0 },
  'fiwind': { trading: 1.0, withdrawal: 0 },
  'vitawallet': { trading: 1.0, withdrawal: 0 },
  'saldo': { trading: 0.8, withdrawal: 0 },
  'pluscrypto': { trading: 1.0, withdrawal: 0 },
  'bybit': { trading: 0.1, withdrawal: 0.5 },
  'eluter': { trading: 1.0, withdrawal: 0 },
  'trubit': { trading: 1.0, withdrawal: 0 },
  'cocoscrypto': { trading: 1.0, withdrawal: 0 },
  'wallbit': { trading: 1.0, withdrawal: 0 },
  'cryptomktpro': { trading: 0.8, withdrawal: 0 },
  'bitsoalpha': { trading: 0.5, withdrawal: 0 },
  
  // P2P exchanges (fees más altos por spread)
  'binancep2p': { trading: 2.0, withdrawal: 0 },
  'okexp2p': { trading: 2.0, withdrawal: 0 },
  'paxfulp2p': { trading: 2.5, withdrawal: 0 },
  'huobip2p': { trading: 2.0, withdrawal: 0 },
  'bybitp2p': { trading: 2.0, withdrawal: 0 },
  'kucoinp2p': { trading: 2.0, withdrawal: 0 },
  'bitgetp2p': { trading: 2.0, withdrawal: 0 },
  'paydecep2p': { trading: 2.0, withdrawal: 0 },
  'eldoradop2p': { trading: 2.5, withdrawal: 0 },
  'bingxp2p': { trading: 2.0, withdrawal: 0 },
  'lemoncashp2p': { trading: 2.0, withdrawal: 0 },
  'coinexp2p': { trading: 2.0, withdrawal: 0 },
  'mexcp2p': { trading: 2.0, withdrawal: 0 },
  // ...
};
```

**Nota**: P2P exchanges tienen fees estimados de 2.0-2.5% debido al spread inherente.

---

### Fix #2: Relajar Validación de Spread
```javascript
// ANTES
if (Math.abs(spreadArs) > 10) {
  console.warn(`${exchangeName} spread muy alto`);
  return; // ❌ Rechaza muchos P2P
}

// AHORA v5.0.1
if (Math.abs(spreadArs) > 50) {
  if (DEBUG_MODE) console.warn(`${exchangeName} spread extremo`);
  return; // ✅ Solo rechaza spreads absurdos
}
```

**Justificación**:
- Spread 10-20%: Normal en P2P
- Spread 20-50%: Alto pero válido
- Spread >50%: Probablemente error de API

---

### Fix #3: Case-Insensitive Lookup
```javascript
const buyFees = EXCHANGE_FEES[buyExchange.toLowerCase()] || EXCHANGE_FEES['default'];
const sellFees = EXCHANGE_FEES[sellExchange.toLowerCase()] || EXCHANGE_FEES['default'];
```

---

### Fix #4: Logs de Debug
```javascript
if (DEBUG_MODE) {
  console.log('🔀 Iniciando calculateOptimizedRoutes...');
  console.log(`   Precio oficial: $${officialSellPrice} ARS`);
  console.log(`   Exchanges disponibles: ${buyExchanges.length}`);
  console.log(`🔀 calculateOptimizedRoutes: ${routes.length} rutas calculadas`);
  if (routes.length > 0) {
    console.log(`   Mejor ruta: ${routes[0].buyExchange} → ${routes[0].sellExchange} (${routes[0].profitPercent.toFixed(2)}%)`);
  }
}
```

---

## 🧪 **CÓMO TESTEAR**

### 1. **Reload Extension**
```
chrome://extensions/ → Click en ⟳ (refresh)
```

### 2. **Abrir Consola del Background**
```
chrome://extensions/ 
→ ArbitrageAR 
→ "Inspeccionar vistas: service worker"
```

### 3. **Verificar Logs**
Deberías ver:
```
🔀 Iniciando calculateOptimizedRoutes...
   Precio oficial: $1,020 ARS
   Exchanges disponibles: 45
🔀 calculateOptimizedRoutes: 1,296 rutas calculadas
   Mejor ruta: Binance → DollarApp (+2.8%)
✅ 31 oportunidades de arbitraje encontradas
```

### 4. **Abrir Popup**
- Click en el ícono de la extensión
- Tab "Rutas" debe mostrar 20 rutas
- Verifica que aparezcan rutas con badge "🎯 Mismo Broker"

---

## 📊 **RESULTADOS ESPERADOS**

### Antes del Fix:
```
✅ 31 oportunidades encontradas
❌ 0 rutas mostradas en popup
⚠️ 30+ warnings de exchanges no encontrados
```

### Después del Fix:
```
✅ 31 oportunidades encontradas
✅ 20 rutas mostradas (top 20)
✅ Warnings solo para exchanges realmente raros
✅ P2P exchanges incluidos correctamente
```

---

## 🎯 **EJEMPLO DE RUTA ESPERADA**

Deberías ver algo como:

```
🎯 Ruta 1: +2.8%  [🎯 Mismo Broker]

1️⃣ USD Oficial: $1,020 ARS
2️⃣ USD→USDT en Binance (1.04)
⬇️ Sin transfer
3️⃣ USDT→ARS en Binance ($1,550)
```

o

```
🔀 Ruta 2: +2.5%

1️⃣ USD Oficial: $1,020 ARS
2️⃣ USD→USDT en Ripio (1.03)
🔁 Transfer $1 USD
3️⃣ USDT→ARS en BinanceP2P ($1,580)
```

---

## ⚠️ **DEBUG_MODE ACTIVADO**

**IMPORTANTE**: Activé temporalmente `DEBUG_MODE = true` para diagnosticar.

**Para producción**, una vez que confirmes que funciona:

```javascript
// background.js línea 2
const DEBUG_MODE = false; // Cambiar a false
```

Esto reduce spam en consola.

---

## 📝 **SIGUIENTES PASOS**

1. ✅ Reload extension
2. ✅ Abrir consola background
3. ✅ Verificar logs
4. ✅ Abrir popup y verificar rutas
5. ✅ Probar simulador
6. ⏳ **Confirmar que funciona**
7. ⏳ Desactivar DEBUG_MODE

---

## 🔍 **SI SIGUE SIN FUNCIONAR**

### Qué revisar:
1. **Consola background**: ¿Dice "X rutas calculadas"?
2. **Storage**: Abre DevTools → Application → Storage → Local Storage → chrome-extension://...
   - Busca key `optimizedRoutes`
   - ¿Tiene datos?

3. **Popup DevTools**: 
   - Right-click en popup → Inspect
   - Console: ¿Hay errores?

### Compartir:
- Screenshot de consola background
- Screenshot de popup
- Valor de `chrome.storage.local.get('optimizedRoutes')`

---

**Versión**: 5.0.1  
**Commit**: 369c6ba  
**Estado**: ✅ Pushed
