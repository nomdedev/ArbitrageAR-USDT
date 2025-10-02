# 🚨 HOTFIX CRÍTICO v5.0.2

**Problema**: "247 rutas calculadas pero no aparecen en el popup"

---

## 🐛 **BUG IDENTIFICADO**

**Línea problemática**: `background.js:832`

```javascript
// ❌ ANTES (v5.0.1)
chrome.storage.local.get(['official', 'usdt', 'arbitrages', 'lastUpdate', 'error'], sendResponse);
```

**Problema**: 
- `optimizedRoutes` NO estaba en la lista de keys
- Popup pedía `data.optimizedRoutes` pero recibía `undefined`
- Consola mostraba "247 rutas calculadas" ✅
- Popup mostraba "No hay rutas disponibles" ❌

---

## ✅ **FIX APLICADO**

```javascript
// ✅ AHORA (v5.0.2)
chrome.storage.local.get([
  'official', 
  'usdt', 
  'arbitrages', 
  'optimizedRoutes',  // ✅ AGREGADO
  'marketHealth',     // ✅ AGREGADO
  'lastUpdate', 
  'error',
  'usingCache'        // ✅ AGREGADO
], (data) => {
  if (DEBUG_MODE) {
    console.log('📤 Enviando al popup:', {
      optimizedRoutes: data.optimizedRoutes?.length || 0,
      arbitrages: data.arbitrages?.length || 0,
      marketHealth: data.marketHealth?.status
    });
  }
  sendResponse(data);
});
```

---

## 📊 **LOGS AGREGADOS**

### Background Console:
```
📤 Enviando al popup: {optimizedRoutes: 247, arbitrages: 30, marketHealth: 'MALO'}
```

### Popup Console:
```
📥 Popup recibió datos: {optimizedRoutes: 247, arbitrages: 30, marketHealth: 'MALO'}
```

---

## 🔧 **PASOS PARA VERIFICAR**

### 1. **Reload Extension**
```
chrome://extensions/ → ⟳ Refresh
```

### 2. **Abrir Consola Background**
```
chrome://extensions/
→ ArbitrageAR
→ "Inspeccionar vistas: service worker"
```

Deberías ver:
```
🔀 calculateOptimizedRoutes: 247 rutas calculadas
   Mejor ruta: buenbit → buenbit (-0.36%)
📤 Enviando al popup: {optimizedRoutes: 247}
```

### 3. **Abrir Popup**
Click en el ícono → Right-click → Inspect

Deberías ver en Console:
```
📥 Popup recibió datos: {optimizedRoutes: 247}
```

### 4. **Verificar UI**
Tab "Rutas" debe mostrar **20 rutas** (top 20 de las 247).

---

## ✅ **RESULTADO ESPERADO**

### Popup muestra:
```
🎯 Ruta 1: -0.36%  [🎯 Mismo Broker]
1️⃣ USD Oficial: $1,450 ARS
2️⃣ USD→USDT en buenbit (1.05)
⬇️ Sin transfer
3️⃣ USDT→ARS en buenbit ($1,XXX)

🔀 Ruta 2: -0.42%
...
(18 rutas más)
```

**Nota**: Las rutas actuales son negativas porque el mercado está en "MALO" (todas las opciones dan pérdida).

---

## 🎯 **POR QUÉ PASA ESTO**

El dólar oficial está muy bajo vs USDT. Ejemplo:

```
Oficial: $1,450 ARS
USDT mercado: ~$1,400-1,430 ARS
→ Es más barato comprar USDT directamente que pasar por oficial
→ Todas las rutas dan pérdida
```

**Pero ahora las VES** (antes estaban ocultas por el bug).

---

## 📝 **ARCHIVOS MODIFICADOS**

- `background.js`:
  - Agregado `optimizedRoutes`, `marketHealth`, `usingCache` al get()
  - Log de envío al popup
  
- `popup.js`:
  - Log de recepción de datos
  - Warnings si optimizedRoutes es undefined/vacío

---

**Versión**: 5.0.2  
**Commit**: 2361caa  
**Estado**: ✅ Pushed

---

## 🚀 **SIGUIENTE PASO**

**¡Reload la extensión ahora!**

Si ves las rutas (incluso negativas), el bug está resuelto. 

Si sigues sin ver nada, comparte screenshot de:
1. Consola background
2. Consola popup
3. El popup mismo
