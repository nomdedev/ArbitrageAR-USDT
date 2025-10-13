# HOTFIX_V5.0.58_ARSFROMSALE_UNDEFINED

## 📅 Fecha: 12 de octubre de 2025

## 🐛 Problema Crítico
**Error:** `ReferenceError: arsFromSale is not defined` en `main-simple.js:212`

### Descripción del Error
El service worker de background no respondía correctamente al popup debido a un error crítico en la función `calculateSimpleRoutes`. La variable `arsFromSale` se estaba utilizando en múltiples lugares (líneas 212, 242, etc.) sin haber sido definida previamente.

### Síntomas
```
popup.js:491 ⏰ [POPUP] TIMEOUT: El callback del background nunca se ejecutó (15 segundos)
main-simple.js:395 ❌ Error en updateData: ReferenceError: arsFromSale is not defined
```

## ✅ Solución Implementada

### Cambio en `src/background/main-simple.js`
Agregado **PASO 3.5** faltante que calcula la venta de USDT por ARS:

```javascript
// PASO 3.5: Vender USDT por ARS (CORREGIDO v5.0.58)
const sellPrice = data.totalBid; // Precio de venta USDT/ARS
const arsFromSale = usdtAfterFees * sellPrice;
log(`💰 [${exchange}] PASO 3.5: Vender ${usdtAfterFees.toFixed(4)} USDT × ${sellPrice} = $${arsFromSale.toFixed(2)} ARS`);
```

### Ubicación del Fix
- **Archivo**: `src/background/main-simple.js`
- **Líneas**: 211-214 (nuevo código insertado)
- **Contexto**: Entre aplicación de fees de compra (PASO 3) y fees de venta (PASO 4)

## 🧪 Validación
Creado test `test-arsfromsale-fix.js` que valida:
- ✅ Variable `arsFromSale` se define correctamente
- ✅ Cálculo usa `totalBid` (precio de venta) del exchange
- ✅ Resultado es un número válido > 0
- ✅ Ganancia bruta se calcula correctamente (7.35% en test)

**Resultado del test:** ✅ TODAS LAS VALIDACIONES PASAN

## 📊 Impacto
- **Severidad**: CRÍTICA - La extensión no funcionaba
- **Alcance**: Todos los cálculos de arbitraje
- **Usuarios afectados**: 100% (extensión inoperable)

## 🔧 Archivos Modificados
1. `src/background/main-simple.js` - Agregado cálculo de arsFromSale
2. `manifest.json` - Actualizado a v5.0.58
3. `tests/test-arsfromsale-fix.js` - Test de validación

## 🚀 Despliegue
1. Recargar extensión en `chrome://extensions/`
2. Abrir popup para verificar que los datos carguen correctamente
3. Confirmar que no aparezcan errores de timeout

## 📝 Notas Técnicas
Este error probablemente fue introducido durante refactorings previos donde se reorganizó el flujo de cálculo. La variable `sellPrice` también se definía más tarde pero se usaba antes, lo cual fue corregido simultáneamente.

---
*Hotfix crítico aplicado - La extensión ahora funciona correctamente*