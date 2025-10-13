# 🔍 GUÍA DE DEBUGGING - Filtro de Bancos v5.0.32

**Fecha**: 11 de Octubre 2025  
**Versión**: 5.0.32  
**Propósito**: Verificar que el filtro de bancos seleccionados se aplique correctamente

---

## 🎯 PROBLEMA REPORTADO

El usuario indica que **sigue obteniendo valores de bancos NO seleccionados** en los cálculos de arbitraje.

**Ejemplo**:
- Bancos seleccionados: Nación, Galicia, Santander (~$1470)
- Banco NO seleccionado: Columbia ($1249)
- Resultado incorrecto: Sistema usa Columbia en cálculos

---

## 🔧 LOGS IMPLEMENTADOS

### 1. **Logs de Configuración Recibida**

Al inicio de `getAutomaticDollarPrice()`:

```javascript
log(`💵 [CONFIG] preferredBank: ${preferredBank}`);
log(`💵 [CONFIG] selectedBanks: ${userSettings.selectedBanks ? `[${userSettings.selectedBanks.join(', ')}]` : 'TODOS (no especificado)'}`);
```

**Salida esperada**:
```
💵 [CONFIG] preferredBank: mediana
💵 [CONFIG] selectedBanks: [nacion, galicia, santander]
```

**Si aparece**:
```
💵 [CONFIG] selectedBanks: TODOS (no especificado)
```
👉 **PROBLEMA**: La configuración no se está cargando correctamente.

---

### 2. **Logs de Filtro en getBankRates()**

Dentro de `getBankRates()`:

```javascript
log(`🔍 [FILTRO] Bancos seleccionados: [${userSettings.selectedBanks.join(', ')}]`);
log(`🔍 [FILTRO] ${Object.keys(filteredRates).length} de ${Object.keys(bankRates).length} bancos después del filtro`);
```

**Salida esperada** (si tienes 3 bancos seleccionados de 16 disponibles):
```
🔍 [FILTRO] Bancos seleccionados: [nacion, galicia, santander]
🔍 [FILTRO] 3 de 16 bancos después del filtro
```

**Si aparece**:
```
🔍 [FILTRO] Sin filtro de bancos, usando todos los 16 bancos
```
👉 **PROBLEMA**: No hay bancos seleccionados en la configuración.

---

### 3. **Logs de Bancos Filtrados**

Después de `getBankRates()`:

```javascript
log(`💵 [FILTRADO] Bancos obtenidos: ${Object.keys(bankRates).length} - [${Object.keys(bankRates).join(', ')}]`);
```

**Salida esperada**:
```
💵 [FILTRADO] Bancos obtenidos: 3 - [nacion, galicia, santander]
```

**Si aparece**:
```
💵 [FILTRADO] Bancos obtenidos: 16 - [nacion, bbva, galicia, santander, ciudad, ..., columbia, ...]
```
👉 **PROBLEMA**: El filtro NO se aplicó correctamente.

---

### 4. **Logs Específicos por Método de Cálculo**

#### **MEDIANA**:
```javascript
log(`💵 [MEDIANA] Bancos disponibles para cálculo: [${bankNames}]`);
log(`💵 [MEDIANA] Usando MEDIANA del dólar: $${medianaVenta.toFixed(2)} VENTA (${banks.length} bancos)`);
log(`💵 [MEDIANA] Rango de precios: $${Math.min(...ventaValues).toFixed(2)} - $${Math.max(...ventaValues).toFixed(2)}`);
```

**Salida esperada** (3 bancos seleccionados):
```
💵 [MEDIANA] Bancos disponibles para cálculo: [Banco Nación ($1020), Banco Galicia ($1025), Banco Santander Río ($1022)]
💵 [MEDIANA] Usando MEDIANA del dólar: $1470.50 VENTA (3 bancos)
💵 [MEDIANA] Rango de precios: $1468.00 - $1473.00
```

**Si aparece Columbia ($1249) en la lista**:
```
💵 [MEDIANA] Bancos disponibles para cálculo: [..., Banco Columbia ($900), ...]
```
👉 **PROBLEMA**: Columbia NO debería aparecer si no está seleccionado.

---

#### **PROMEDIO RECORTADO**:
```javascript
log(`💵 [PROM.RECORTADO] Bancos disponibles: [${bankNames}]`);
log(`💵 [PROM.RECORTADO] Usando PROMEDIO RECORTADO del dólar: $${avgVenta.toFixed(2)} VENTA (${trimmedVenta.length}/${banks.length} bancos)`);
```

---

#### **MENOR VALOR**:
```javascript
log(`💵 [MENOR_VALOR] Bancos disponibles: [${bankNames}]`);
log(`💵 [MENOR_VALOR] Usando banco con menor precio: ${cheapestBank.name} - $${cheapestBank.compra.toFixed(2)} COMPRA / $${cheapestBank.venta.toFixed(2)} VENTA`);
```

**Salida esperada** (3 bancos: Nación $1020, Galicia $1025, Santander $1022):
```
💵 [MENOR_VALOR] Bancos disponibles: [Banco Nación ($1020), Banco Galicia ($1025), Banco Santander Río ($1022)]
💵 [MENOR_VALOR] Usando banco con menor precio: Banco Nación - $1020.00 COMPRA / $1470.00 VENTA
```

**Si aparece**:
```
💵 [MENOR_VALOR] Usando banco con menor precio: Banco Columbia - $900.00 COMPRA / $1249.00 VENTA
```
👉 **PROBLEMA CRÍTICO**: Está usando Columbia que NO está seleccionado.

---

## 📋 PASOS PARA DEBUGGING

### 1. **Abrir Consola del Service Worker**

1. Abrir Chrome/Brave
2. Ir a `chrome://extensions`
3. Activar "Modo de desarrollador"
4. En tu extensión "arbitrarARS", click en "Service worker"
5. Se abre DevTools del service worker

**Alternativa**:
- F12 → Pestaña "Application" → Service Workers → "Inspect" en arbitrarARS

---

### 2. **Recargar Extensión**

1. En `chrome://extensions`, click en botón de recargar (🔄)
2. Esperar 5-10 segundos
3. Ver logs en consola del service worker

---

### 3. **Verificar Configuración Guardada**

En la consola del service worker, ejecutar:

```javascript
chrome.storage.local.get('notificationSettings', (result) => {
  console.log('📋 Configuración guardada:', result.notificationSettings);
  console.log('🏦 Bancos seleccionados:', result.notificationSettings.selectedBanks);
  console.log('💰 Método de precio:', result.notificationSettings.preferredBank);
});
```

**Salida esperada**:
```javascript
📋 Configuración guardada: {
  selectedBanks: ["nacion", "galicia", "santander"],
  preferredBank: "mediana",
  ...
}
🏦 Bancos seleccionados: ["nacion", "galicia", "santander"]
💰 Método de precio: "mediana"
```

**Si aparece**:
```javascript
🏦 Bancos seleccionados: []  // ❌ VACÍO
```
👉 **SOLUCIÓN**: Ir a opciones de extensión y seleccionar bancos.

---

### 4. **Forzar Actualización de Datos**

En la consola del service worker:

```javascript
// Invalidar cache
dollarPriceManager.invalidateCache();

// Forzar nueva consulta
dollarPriceManager.getDollarPrice().then(price => {
  console.log('💵 Precio obtenido:', price);
});
```

---

### 5. **Verificar Logs en Tiempo Real**

Buscar en consola los siguientes patrones:

✅ **CORRECTO**:
```
💵 [CONFIG] selectedBanks: [nacion, galicia, santander]
🔍 [FILTRO] Bancos seleccionados: [nacion, galicia, santander]
🔍 [FILTRO] 3 de 16 bancos después del filtro
💵 [FILTRADO] Bancos obtenidos: 3 - [nacion, galicia, santander]
💵 [MEDIANA] Bancos disponibles para cálculo: [Banco Nación ($1020), Banco Galicia ($1025), Banco Santander Río ($1022)]
💵 [MEDIANA] Usando MEDIANA del dólar: $1470.50 VENTA (3 bancos)
```

❌ **INCORRECTO**:
```
💵 [CONFIG] selectedBanks: TODOS (no especificado)  // ❌
🔍 [FILTRO] Sin filtro de bancos, usando todos los 16 bancos  // ❌
💵 [FILTRADO] Bancos obtenidos: 16 - [nacion, bbva, ..., columbia, ...]  // ❌
💵 [MENOR_VALOR] Usando banco con menor precio: Banco Columbia - $900.00  // ❌❌
```

---

## 🐛 PROBLEMAS COMUNES

### Problema 1: selectedBanks = []

**Síntoma**:
```
💵 [CONFIG] selectedBanks: TODOS (no especificado)
```

**Causa**: No hay bancos seleccionados en configuración.

**Solución**:
1. Ir a opciones de extensión (click derecho en ícono → Opciones)
2. Sección "🏦 Configuración de Bancos"
3. Seleccionar al menos 1 banco
4. Click en "💾 Guardar Configuración"
5. Recargar extensión

---

### Problema 2: selectedBanks existe pero filtro no aplica

**Síntoma**:
```
💵 [CONFIG] selectedBanks: [nacion, galicia, santander]
💵 [FILTRADO] Bancos obtenidos: 16 - [nacion, bbva, ..., columbia, ...]  // ❌
```

**Causa**: El filtro en `getBankRates()` no se está ejecutando.

**Solución**: 
- Verificar que `userSettings` se pase correctamente
- Ver si hay error en consola
- Verificar que keys de `bankRates` coincidan con códigos seleccionados

---

### Problema 3: Keys no coinciden

**Síntoma**:
```
🔍 [FILTRO] Bancos seleccionados: [nacion, galicia, santander]
🔍 [FILTRO] 0 de 16 bancos después del filtro  // ❌ 0 bancos!
```

**Causa**: Las keys de `bankRates` no coinciden con los códigos en `selectedBanks`.

**Ejemplo**:
- `selectedBanks = ["nacion"]`
- `bankRates = { "Banco Nación": {...} }`  // ❌ Key diferente

**Solución**: Ya implementada en v5.0.32 con `getBankCode()`.

---

## 🎬 ESCENARIO DE PRUEBA COMPLETO

### Configuración:
- Seleccionar: Nación, Galicia, Santander
- Método: Mediana
- Guardar

### Logs Esperados:

```
1. Al cargar configuración:
   💵 [CONFIG] preferredBank: mediana
   💵 [CONFIG] selectedBanks: [nacion, galicia, santander]

2. Al obtener tasas bancarias:
   💰 Cache de tasas bancarias actualizado: 16 bancos
   🔍 [FILTRO] Bancos seleccionados: [nacion, galicia, santander]
   🔍 [FILTRO] 3 de 16 bancos después del filtro

3. Al calcular mediana:
   💵 [FILTRADO] Bancos obtenidos: 3 - [nacion, galicia, santander]
   💵 [MEDIANA] Bancos disponibles para cálculo: [Banco Nación ($1020), Banco Galicia ($1025), Banco Santander Río ($1022)]
   💵 [MEDIANA] Usando MEDIANA del dólar: $1470.50 VENTA (3 bancos)
   💵 [MEDIANA] Rango de precios: $1468.00 - $1473.00
```

### ❌ Si ves Columbia ($1249) en cualquiera de estos logs:
```
💵 [MEDIANA] Bancos disponibles para cálculo: [..., Banco Columbia ($900), ...]
```

👉 **REPORTAR**: Tomar screenshot y compartir logs completos.

---

## 📸 CAPTURA DE EVIDENCIA

Si el problema persiste:

1. **Screenshot de configuración**:
   - Opciones → Configuración de Bancos
   - Mostrar qué bancos están checkeados

2. **Logs de consola**:
   - Service Worker → Console
   - Copiar todos los logs con prefijo `💵` y `🔍`

3. **Datos de storage**:
   ```javascript
   chrome.storage.local.get('notificationSettings', console.log);
   ```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Bancos seleccionados en UI (✅ checkboxes)
- [ ] Configuración guardada (mensaje "✅ Configuración guardada correctamente")
- [ ] Extensión recargada después de guardar
- [ ] Log `[CONFIG] selectedBanks` muestra bancos correctos
- [ ] Log `[FILTRO]` muestra filtrado correcto
- [ ] Log `[FILTRADO]` muestra solo bancos seleccionados
- [ ] Log `[MEDIANA]` NO incluye bancos no seleccionados
- [ ] Precio del dólar es razonable (~$1450-$1500, no $1249)

---

**Autor**: GitHub Copilot  
**Versión**: 5.0.32  
**Estado**: 🔍 Debugging en proceso
