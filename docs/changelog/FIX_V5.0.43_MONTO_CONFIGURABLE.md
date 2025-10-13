# ✅ FIX v5.0.43 - Monto Configurable en Rutas

**Fecha:** 12 de octubre de 2025  
**Tipo:** Mejora - Configuración de Usuario  
**Severidad:** Media  

---

## 🐛 PROBLEMA RESUELTO

Las rutas de arbitraje mostraban ganancias calculadas sobre un monto **hardcodeado de $1,000,000**, sin respetar el monto configurado por el usuario en las opciones.

### ❌ Antes:
```javascript
const initialAmount = 1000000; // Siempre fijo
```

### ✅ Ahora:
```javascript
// Lee el monto configurado por el usuario
const result = await chrome.storage.local.get('notificationSettings');
const userSettings = result.notificationSettings || {};
const initialAmount = userSettings.defaultSimAmount || 1000000;
```

---

## 🛠️ CAMBIOS APLICADOS

### 1. Lectura de Configuración del Usuario

**Archivo:** `src/background/main-simple.js`  
**Función:** `calculateSimpleRoutes()`

Ahora la función:
1. ✅ Lee `defaultSimAmount` del storage del usuario
2. ✅ Usa ese monto para calcular las ganancias
3. ✅ Si no hay configuración, usa $1,000,000 por defecto
4. ✅ Muestra en logs qué monto se está usando

### 2. Recálculo Automático al Cambiar Configuración

**Archivo:** `src/background/main-simple.js`  
**Listener:** `chrome.storage.onChanged`

Cuando el usuario cambia el monto en la configuración:
1. ✅ Detecta el cambio automáticamente
2. ✅ Recalcula todas las rutas con el nuevo monto
3. ✅ Actualiza los datos en cache
4. ✅ El popup muestra las ganancias actualizadas

---

## 📊 CÓMO FUNCIONA AHORA

### Flujo Completo:

```
1. Usuario configura monto en Opciones
   └─ Guarda en chrome.storage.local.notificationSettings.defaultSimAmount

2. Background lee la configuración
   └─ calculateSimpleRoutes() obtiene el monto del storage

3. Calcula rutas con ese monto
   └─ Todas las rutas usan el mismo monto base

4. Usuario ve ganancias consistentes
   └─ Basadas en su monto configurado

5. Si usuario cambia el monto
   └─ Listener detecta cambio
   └─ Recalcula automáticamente
   └─ Popup se actualiza
```

---

## 🎯 EJEMPLO

### Configuración del Usuario:
```javascript
{
  defaultSimAmount: 5000000  // $5 millones
}
```

### Resultado en las Rutas:
```javascript
{
  calculation: {
    initial: 5000000,           // ✅ Usa monto configurado
    usdPurchased: 5000,         // Basado en $5M
    netProfit: 117500,          // Ganancia sobre $5M
    profitPercent: 2.35         // % sobre $5M
  }
}
```

### Mostrado en Popup:
```
🎯 Ruta 1               +2.35%
🏦 Binance
+$117,500 sobre $5,000,000  ✅ Correcto
```

---

## ✅ VERIFICACIÓN

### Paso 1: Configurar Monto
1. Click en ⚙️ (Configuración)
2. Ir a pestaña "Simulador" u "General"
3. Cambiar "Monto por defecto" a, por ejemplo, **$5,000,000**
4. Guardar

### Paso 2: Verificar Logs del Background
Deberías ver:
```
💰 Monto por defecto cambió: $1000000 → $5000000
🔄 Recalculando rutas con nuevo monto...
💰 Usando monto configurado: $5,000,000 ARS
✅ Calculadas XX rutas con monto base $5,000,000
✅ Rutas recalculadas con nuevo monto
```

### Paso 3: Verificar Popup
Las ganancias ahora deberían estar calculadas sobre $5,000,000

---

## 🔧 CONFIGURACIÓN DEL MONTO

El monto se configura en **Opciones → General → Simulador**:

- **Valor mínimo:** $100,000
- **Valor máximo:** $100,000,000
- **Valor por defecto:** $1,000,000
- **Se guarda automáticamente**

---

## 📝 ARCHIVOS MODIFICADOS

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/background/main-simple.js` | ✅ Lectura de `defaultSimAmount` | ~57-67 |
| `src/background/main-simple.js` | ✅ Listener de cambios | ~217-230 |

---

## 🚀 PRÓXIMOS PASOS

1. **Recarga la extensión:**
   - `chrome://extensions/`
   - Click en ⟳

2. **Configura tu monto preferido:**
   - Click en ⚙️
   - Cambiar monto
   - Guardar

3. **Verifica que las ganancias se actualizan**

---

## 💡 NOTA IMPORTANTE

El monto configurado afecta:
- ✅ Ganancias mostradas en las rutas
- ✅ Cálculos del simulador
- ✅ Notificaciones de alertas

**NO afecta:**
- El precio del dólar oficial
- Las tasas de los exchanges
- Los porcentajes de ganancia (solo los montos absolutos)

---

**Versión:** 5.0.43  
**Status:** ✅ Implementado  
**Testing:** Recarga extensión y prueba cambiando el monto en opciones
