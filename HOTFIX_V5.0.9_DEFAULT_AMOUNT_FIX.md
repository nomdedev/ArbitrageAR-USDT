# 🔧 HOTFIX v5.0.9 - defaultSimAmount Aplicado a Todas las Rutas

**Fecha:** 2 de octubre de 2025  
**Problema:** El parámetro `defaultSimAmount` solo se usaba en el simulador, pero las rutas principales usaban un valor hardcodeado de 100,000 ARS

---

## 🐛 PROBLEMA REPORTADO

Usuario reporta: **"tengo configurado que me diga la ganancia con respecto a 10 millones de ARS y me aparece sobre 100 mil. Por lo que no está dependiente de lo que configuramos"**

### Causa raíz:

```javascript
// ❌ ANTES: Valor hardcodeado en routeCalculator.js línea 115
const initialAmount = 100000; // $100,000 ARS base
```

El sistema tenía **DOS montos diferentes**:
1. **Simulador:** Usaba `defaultSimAmount` del usuario ✅
2. **Rutas principales:** Usaba 100,000 ARS hardcodeado ❌

**Consecuencia:** 
- Usuario configura 10,000,000 ARS en opciones
- Las rutas principales mostraban ganancias sobre 100,000 ARS
- Solo el simulador respetaba los 10,000,000 ARS

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Cargar `defaultSimAmount` en `loadUserFees()`

**ANTES:**
```javascript
async function loadUserFees() {
  // ...
  return { 
    extraTradingFee: 0, 
    extraWithdrawalFee: 0, 
    extraTransferFee: 0, 
    bankCommissionFee: 0
    // ❌ Faltaba defaultSimAmount
  };
}
```

**AHORA (v5.0.9):**
```javascript
async function loadUserFees() {
  // ...
  const settings = stored.notificationSettings;
  const fees = {
    extraTradingFee: settings.extraTradingFee || 0,
    extraWithdrawalFee: settings.extraWithdrawalFee || 0,
    extraTransferFee: settings.extraTransferFee || 0,
    bankCommissionFee: settings.bankCommissionFee || 0,
    defaultSimAmount: settings.defaultSimAmount || 100000  // ✅ NUEVO
  };

  if (fees.defaultSimAmount !== 100000) {
    log(`💰 Monto base configurado: $${fees.defaultSimAmount.toLocaleString()} ARS`);
  }

  return fees;
}
```

### 2. Usar `defaultSimAmount` en `calculateRoute()`

**ANTES:**
```javascript
function calculateRoute(buyExchange, sellExchange, oficial, usdt, usdtUsd, userFees, transferFees) {
  const initialAmount = 100000; // ❌ Hardcodeado
  // ...
}
```

**AHORA (v5.0.9):**
```javascript
function calculateRoute(buyExchange, sellExchange, oficial, usdt, usdtUsd, userFees, transferFees) {
  // ✅ Usar monto configurado por el usuario
  const initialAmount = userFees.defaultSimAmount || 100000;
  // ...
}
```

---

## 📊 IMPACTO DEL CAMBIO

### Ejemplo con configuración de 10,000,000 ARS:

| Concepto | ANTES (v5.0.8) | AHORA (v5.0.9) |
|----------|----------------|----------------|
| Monto base rutas | 100,000 ARS (hardcoded) | 10,000,000 ARS (config) |
| Monto simulador | 10,000,000 ARS (config) | 10,000,000 ARS (config) |
| Ganancia mostrada ruta 2% | $2,000 | $200,000 |
| Ganancia simulador 2% | $200,000 | $200,000 |
| **Consistencia** | ❌ INCONSISTENTE | ✅ CONSISTENTE |

---

## 🎯 FLUJO COMPLETO DE CONFIGURACIÓN

### 1. Usuario configura en `options.html`:
```html
<input type="number" id="default-sim-amount" value="10000000">
```

### 2. Se guarda en `chrome.storage`:
```javascript
// options.js
defaultSimAmount: parseInt(document.getElementById('default-sim-amount').value)
// Guarda: 10000000
```

### 3. Se carga en `routeCalculator.js`:
```javascript
// loadUserFees()
defaultSimAmount: settings.defaultSimAmount || 100000
// Carga: 10000000
```

### 4. Se usa en `calculateRoute()`:
```javascript
const initialAmount = userFees.defaultSimAmount || 100000;
// Usa: 10000000 en TODOS los cálculos
```

### 5. Se muestra en popup y simulador:
```javascript
// Ambos usan el mismo monto base
// Ganancias son consistentes en toda la UI
```

---

## 📝 ARCHIVOS MODIFICADOS

### 1. `src/background/routeCalculator.js`

**Líneas 7-37:** Modificar `loadUserFees()`
- Agregar `defaultSimAmount` a la carga de settings
- Agregar log cuando es diferente de 100,000
- Incluir en el return del objeto fees

**Líneas 118-121:** Modificar `calculateRoute()`
- Cambiar valor hardcodeado por `userFees.defaultSimAmount`
- Mantener fallback a 100,000 si no está configurado

---

## 🔍 LOGS MEJORADOS

### Cuando el usuario tiene configurado un monto personalizado:

```javascript
💰 Monto base configurado: $10,000,000 ARS
```

### Cuando usa el valor default:

```javascript
// Sin log (usa 100,000 ARS por defecto)
```

---

## ✅ VALIDACIÓN

### Para verificar que funciona:

1. **Ir a opciones** (`options.html`)
2. **Configurar monto:** 10,000,000 ARS
3. **Guardar configuración**
4. **Recargar extensión**
5. **Abrir popup + F12**
6. **Buscar log:**
   ```
   💰 Monto base configurado: $10,000,000 ARS
   ```
7. **Verificar rutas:** Ganancia de 2% = $200,000 (no $2,000)

---

## 🧪 CASOS DE PRUEBA

### Caso 1: Monto personalizado (10M)
```javascript
// Config: defaultSimAmount = 10000000
// Ruta con 2% ganancia:
// ANTES: Ganancia: $2,000 (sobre 100k)
// AHORA: Ganancia: $200,000 (sobre 10M) ✅
```

### Caso 2: Monto default (100k)
```javascript
// Config: defaultSimAmount = undefined
// Ruta con 2% ganancia:
// ANTES: Ganancia: $2,000
// AHORA: Ganancia: $2,000 ✅ (mismo comportamiento)
```

### Caso 3: Monto pequeño (50k)
```javascript
// Config: defaultSimAmount = 50000
// Ruta con 2% ganancia:
// ANTES: Ganancia: $2,000 (sobre 100k)
// AHORA: Ganancia: $1,000 (sobre 50k) ✅
```

---

## 🎯 BENEFICIOS

1. **Consistencia total:** Mismo monto en rutas y simulador
2. **Flexibilidad:** Usuario controla el monto base de todos los cálculos
3. **Realismo:** Ganancias reflejan capital real del usuario
4. **Escalabilidad:** Fácil ver impacto con diferentes capitales
5. **Sin duplicación:** Un solo setting controla todo

---

## ⚠️ NOTAS IMPORTANTES

### ¿Por qué el fallback a 100,000?

Si el usuario nunca configuró `defaultSimAmount`, el sistema usa 100,000 ARS como valor seguro y conservador.

### ¿Afecta a las notificaciones?

**NO.** Las notificaciones se basan en **porcentaje de ganancia**, no en monto absoluto. Una ruta de 2% es 2% independiente del capital.

### ¿Qué pasa con rutas ya calculadas?

Todas las rutas se recalculan cuando:
- Se actualiza el popup
- Se recarga la extensión
- Cambia la configuración

Por lo tanto, el cambio es **inmediato** al recargar.

---

## 📋 CHECKLIST DE VALIDACIÓN

- [x] Código sin errores de sintaxis
- [x] `defaultSimAmount` cargado en `loadUserFees()`
- [x] Usado en `calculateRoute()`
- [x] Fallback a 100,000 si no está configurado
- [x] Log informativo cuando es personalizado
- [x] Documentación completa creada
- [ ] **PENDIENTE:** Recargar extensión
- [ ] **PENDIENTE:** Configurar 10M en options
- [ ] **PENDIENTE:** Verificar ganancias en popup

---

## 🔗 RELACIÓN CON OTROS HOTFIXES

- **v5.0.5:** Retry automático
- **v5.0.6b:** Header visual mejorado
- **v5.0.7:** Validación USD/USDT estricta
- **v5.0.8:** Validación permisiva con fallback
- **v5.0.9:** ✅ **defaultSimAmount aplicado globalmente**

---

**Versión:** 5.0.9  
**Estado:** ✅ LISTO PARA TESTING  
**Próxima acción:** Recargar extensión y verificar con 10M ARS configurado
