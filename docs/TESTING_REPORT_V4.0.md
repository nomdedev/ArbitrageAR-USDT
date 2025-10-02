# 🧪 REPORTE DE TESTING - ArbitrageAR v4.0.0

**Fecha**: 2 de octubre de 2025  
**Versión analizada**: 4.0.0  
**Tipo**: Análisis exhaustivo de bugs, edge cases y vulnerabilidades

---

## 🔴 **BUGS CRÍTICOS ENCONTRADOS**

### 1. **calculateOptimizedRoutes() no valida si hay exchanges disponibles**
**Archivo**: `background.js` línea 349  
**Problema**: 
```javascript
// Si buyExchanges está vacío, el forEach no hace nada
// pero retorna array vacío sin avisar al usuario
buyExchanges.forEach(buyExchange => {
  // ...
});
```

**Impacto**: Si todas las APIs fallan, el usuario ve "No hay rutas optimizadas" sin saber por qué.

**Solución**:
```javascript
if (buyExchanges.length === 0) {
  console.warn('No hay exchanges disponibles para calcular rutas');
  return [];
}
```

---

### 2. **División por cero en calculateOptimizedRoutes()**
**Archivo**: `background.js` línea 383  
**Problema**:
```javascript
const usdtPurchased = usdPurchased / usdToUsdtRate;
// Si usdToUsdtRate es 0, da Infinity
```

**Edge case**: Si `usdToUsdtRate` es 0 o undefined, genera Infinity.

**Solución**: Validar antes de dividir.

---

### 3. **Rutas optimizadas pueden generar 1,296+ combinaciones**
**Archivo**: `background.js` línea 363  
**Problema**:
```javascript
// 36 exchanges × 36 exchanges = 1,296 iteraciones
buyExchanges.forEach(buyExchange => {
  sellExchanges.forEach(sellExchange => {
    // Cálculos complejos aquí
  });
});
```

**Impacto**: 
- ⚠️ Puede tardar 2-5 segundos en calcular
- ⚠️ Bloquea el service worker
- ⚠️ Usuario percibe lag al abrir popup

**Solución**: 
- Limitar a top 20 exchanges para compra/venta
- Mover a Web Worker
- Mostrar loading spinner

---

### 4. **No hay validación de USDT negativo después de transfer**
**Archivo**: `background.js` línea 388  
**Código actual**:
```javascript
const usdtAfterTransfer = usdtAfterBuyFee - transferFeeUSDT;
if (usdtAfterTransfer <= 0) return; // ✅ Existe
```
**Status**: ✅ Ya está validado, pero podría loggear el motivo en DEBUG_MODE.

---

### 5. **Spread P2P puede omitir exchanges legítimos**
**Archivo**: `background.js` línea 158  
**Problema**:
```javascript
const spreadArs = ((usdtArsAsk - usdtArsBid) / usdtArsBid) * 100;
if (Math.abs(spreadArs) > 10) {
  console.warn(`${exchangeName} spread muy alto (${spreadArs.toFixed(1)}%), omitiendo`);
  return;
}
```

**Edge case**: Exchanges P2P legítimos como Binance P2P tienen spreads >10% por diseño.

**Impacto**: Se pierden oportunidades reales.

**Solución**: Marcar como "P2P" en lugar de omitir completamente.

---

## 🟡 **BUGS MENORES**

### 6. **marketHealth puede ser undefined si no hay datos**
**Archivo**: `popup.js` línea 91  
**Código**:
```javascript
displayMarketHealth(data.marketHealth);
```

**Edge case**: Si `calculateMarketHealth()` falla, `data.marketHealth` es undefined.

**Fix**: Validar antes de mostrar.

---

### 7. **displayOptimizedRoutes() no maneja routes vacías correctamente**
**Archivo**: `popup.js` línea 188  
**Problema**:
```javascript
if (!routes || routes.length === 0) {
  container.innerHTML = '<p class="info">📊 No hay rutas optimizadas disponibles...</p>';
  return;
}
```

**Issue**: No explica POR QUÉ no hay rutas (¿APIs caídas? ¿Mercado malo?).

---

### 8. **Los tabs cambian pero el contenido puede estar desactualizado**
**Archivo**: `popup.js` líneas 45-57  
**Problema**: Al cambiar de tab, no hay re-fetch de datos.

**Edge case**: 
1. Usuario ve "Single Exchange"
2. Espera 5 minutos (datos desactualizados)
3. Cambia a "Rutas Optimizadas"
4. Ve datos viejos sin saberlo

**Solución**: Mostrar timestamp en cada tab.

---

## ⚠️ **EDGE CASES CRÍTICOS**

### 9. **APIs caídas simultáneamente**
**Escenario**:
```
DolarAPI: ❌ Error 503
CriptoYA USDT/ARS: ❌ Timeout
CriptoYA USDT/USD: ❌ Error
```

**Comportamiento actual**:
```javascript
if (!oficial || !usdt || !usdtUsd) {
  await chrome.storage.local.set({ 
    error: 'No se pudieron obtener los datos de las APIs',
    lastUpdate: Date.now() 
  });
  return; // ❌ No muestra datos anteriores
}
```

**Problema**: Usuario pierde TODO, incluso datos de hace 5 minutos.

**Solución**: Usar datos en cache si existen:
```javascript
if (!oficial || !usdt || !usdtUsd) {
  const cached = await chrome.storage.local.get(['arbitrages', 'official', 'usdt']);
  if (cached.arbitrages) {
    console.warn('Usando datos en cache...');
    return; // Mantener datos viejos
  }
}
```

---

### 10. **Exchange con nombre duplicado o cambiado**
**Escenario**: CriptoYA cambia "binancep2p" a "binance_p2p".

**Impacto**:
- EXCHANGE_FEES no encuentra el exchange
- Usa fees por defecto (1% + 0.5%)
- Cálculos incorrectos

**Solución**: Normalizar nombres:
```javascript
const normalizedName = exchangeName.toLowerCase().replace(/[_-]/g, '');
```

---

### 11. **Transferencias entre mismo exchange**
**Archivo**: `background.js` línea 369  
**Código actual**:
```javascript
if (buyExchange === sellExchange) return; // ✅ Ya está
```
**Status**: ✅ Cubierto correctamente.

---

### 12. **Usuario tiene popup abierto cuando actualiza el background**
**Escenario**:
1. Usuario abre popup
2. Background actualiza datos (5 min)
3. Popup NO se refresca automáticamente

**Problema**: Usuario ve datos desactualizados hasta que cierra/abre popup.

**Solución**: Implementar listener de cambios en storage:
```javascript
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.arbitrages) {
    fetchAndDisplay(); // Re-render automático
  }
});
```

---

### 13. **Precios con valores extremos o inválidos**
**Escenario**: API retorna:
```json
{
  "buenbit": {
    "ask": 999999999,  // Error de API
    "bid": 0.0001      // Precio absurdo
  }
}
```

**Problema**: El código los acepta como válidos.

**Solución**: Agregar validación de rangos:
```javascript
function isValidPrice(price, min = 100, max = 5000) {
  return price > min && price < max;
}
```

---

### 14. **Overflow en cálculos con montos grandes**
**Escenario**: Usuario mental hace cálculo con $10,000,000 ARS.

**JavaScript limitation**: Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991

**Con $10M ARS**: ✅ Seguro  
**Con $10B ARS**: ⚠️ Puede perder precisión

**Solución**: Usar BigInt o limitar a $1M ARS máximo.

---

### 15. **Fees de transferencia hardcodeadas**
**Archivo**: `background.js` línea 354  
**Problema**:
```javascript
const TRANSFER_FEES = {
  'TRC20': 1,      // $1 USD - ¿siempre?
  'ERC20': 15,     // $15 USD - puede ser $50+ en high gas
  'BEP20': 0.8,    // $0.8 USD
  'default': 1
};
```

**Edge case**: Gas fees de Ethereum pueden variar de $5 a $200.

**Solución**: 
- Agregar disclaimer "Fees aproximados"
- Permitir al usuario ajustar en settings

---

## 🐛 **BUGS DE UI/UX**

### 16. **Tabs muy estrechos en móvil**
**Archivo**: `popup.html` línea 30  
**Problema**: 4 tabs en 420px puede ser cramped.

**Solución**: Scroll horizontal o iconos más pequeños.

---

### 17. **Loading spinner no se ve en rutas optimizadas**
**Archivo**: `popup.html`  
**Problema**: Tab "Rutas Optimizadas" no tiene loading state.

**Fix**:
```html
<section id="tab-optimized" class="tab-content">
  <div id="loading-routes" class="loading">
    <div class="spinner"></div>
    <p>Calculando 1,296 combinaciones...</p>
  </div>
  <div id="optimized-routes"></div>
</section>
```

---

### 18. **No hay indicador de última actualización por tab**
**Problema**: Usuario no sabe si los datos son frescos.

**Solución**: Timestamp individual por tab.

---

## 🔒 **PROBLEMAS DE SEGURIDAD**

### 19. **APIs externas sin HTTPS validation**
**Archivo**: `background.js`  
**URLs**:
```javascript
'https://dolarapi.com/v1/dolares/oficial'
'https://criptoya.com/api/usdt/ars/1'
'https://criptoya.com/api/usdt/usd/1'
```

**Risk**: Man-in-the-middle (MITM) si el certificado es inválido.

**Solución**: Chrome ya valida HTTPS, pero agregar try-catch robusto.

---

### 20. **XSS en nombres de exchanges**
**Archivo**: `popup.js` línea 216  
**Código**:
```javascript
<span class="step-label">USD → USDT en <strong>${route.buyExchange}</strong></span>
```

**Edge case**: Si CriptoYA retorna exchange name con script:
```json
{
  "<script>alert('xss')</script>": { ... }
}
```

**Solución**: Sanitizar o escapar:
```javascript
const sanitize = (str) => str.replace(/[<>]/g, '');
```

---

## ⚡ **PROBLEMAS DE PERFORMANCE**

### 21. **1,296 iteraciones en cada update (cada 5 min)**
**Impacto**: CPU spike cada 5 minutos.

**Solución**:
- Cache de resultados si precios no cambian >1%
- Calcular solo si usuario abre tab "Rutas Optimizadas"

---

### 22. **Sin debounce en refresh button**
**Archivo**: `popup.js` línea 60  
**Problema**: Usuario puede hacer spam click en refresh.

**Solución**:
```javascript
let isRefreshing = false;
document.getElementById('refresh').addEventListener('click', async () => {
  if (isRefreshing) return;
  isRefreshing = true;
  await fetchAndDisplay();
  setTimeout(() => isRefreshing = false, 2000);
});
```

---

### 23. **Animaciones pueden causar lag en dispositivos lentos**
**Archivo**: `popup.css` línea 172  
**Animaciones**: pulseGlow, slideDown, fadeIn

**Solución**: Agregar `prefers-reduced-motion` media query.

---

## 📊 **TESTS RECOMENDADOS**

### Test 1: **APIs caídas**
```javascript
// Simular timeout
fetchWithRateLimit = () => new Promise((_, reject) => 
  setTimeout(() => reject('timeout'), 11000)
);
```

### Test 2: **Datos malformados**
```javascript
// Simular respuesta rota
fetchCriptoyaUSDT = () => Promise.resolve({ error: "Malformed JSON" });
```

### Test 3: **Exchange sin fees conocidas**
```javascript
// Agregar exchange fake
usdt['exchangeDesconocido'] = { bid: 1500, ask: 1520 };
// Debería usar EXCHANGE_FEES.default
```

### Test 4: **Montos extremos**
```javascript
// Calcular con $1 ARS
// Calcular con $999,999,999 ARS
```

### Test 5: **Spreads negativos (error de API)**
```javascript
// bid > ask (imposible)
exchange.bid = 1600;
exchange.ask = 1500;
```

---

## 🎯 **PRIORIDADES DE FIX**

### 🔴 **CRÍTICO (Fix ahora)**
1. ✅ Validar división por cero en rutas optimizadas
2. ✅ Agregar timeout/loading para cálculo de 1,296 rutas
3. ✅ Cache de datos si APIs fallan
4. ✅ Validar rangos de precios

### 🟡 **IMPORTANTE (Fix esta semana)**
5. Sanitizar nombres de exchanges (XSS)
6. Debounce en refresh button
7. Loading spinner en rutas optimizadas
8. Indicador de datos desactualizados

### 🟢 **MEJORA (Futuro)**
9. Normalizar nombres de exchanges
10. Optimizar cálculo de rutas (limitar a top 20)
11. Timestamps por tab
12. Animaciones responsive

---

## 📋 **CHECKLIST DE VALIDACIÓN**

### Antes de cada release:
- [ ] Probar con APIs caídas
- [ ] Probar con datos malformados
- [ ] Probar con 0 exchanges disponibles
- [ ] Probar spam click en refresh
- [ ] Verificar console.errors en background
- [ ] Testear con valores extremos ($1 y $1M)
- [ ] Validar que rutas optimizadas terminan < 3 segundos
- [ ] Verificar memoria no crece indefinidamente

---

## 🚀 **SIGUIENTES PASOS**

1. **Implementar fixes críticos** (bugs 1-4)
2. **Agregar tests unitarios** para edge cases
3. **Monitoreo de errores** con Sentry o similar
4. **Documentar assumptions** en código
5. **User testing** con 5-10 usuarios reales

---

**Conclusión**: La extensión es funcional pero tiene **4 bugs críticos** y **10+ edge cases** que deben abordarse antes de considerarla production-ready para escala.
