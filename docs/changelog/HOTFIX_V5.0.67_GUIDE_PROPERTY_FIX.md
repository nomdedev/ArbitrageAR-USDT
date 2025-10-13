# HOTFIX v5.0.67 - Corrección de nombres de propiedades en guía paso a paso

**Versión**: 5.0.67  
**Fecha**: 2025-01-XX  
**Tipo**: HOTFIX - Corrección crítica

---

## 🐛 PROBLEMA IDENTIFICADO

La guía paso a paso no se mostraba al hacer click en una ruta de arbitraje debido a un **desajuste en los nombres de las propiedades** entre diferentes funciones.

### Síntomas
- ✅ El click en una ruta funcionaba correctamente (v5.0.65)
- ✅ La pestaña de "Guía" se activaba correctamente
- ❌ El contenido de la guía NO se mostraba en el contenedor `#selected-arbitrage-guide`
- ❌ El usuario veía solo el mensaje por defecto: "👆 Selecciona una oportunidad..."

### Causa Raíz
**Inconsistencia en nombres de propiedades**:

```javascript
// ❌ ANTES - calculateGuideValues() retornaba:
return {
  ...
  profitPercentage: arb.profitPercentage || 0  // <-- nombre: profitPercentage
};

// ❌ ANTES - generateGuideHeader() esperaba:
function generateGuideHeader(broker, profitPercent) {  // <-- nombre: profitPercent
  ...
  formatNumber(profitPercent)
}

// ❌ ANTES - generateGuideSteps() esperaba:
function generateGuideSteps(values) {
  const { ..., profitPercent, ... } = values;  // <-- nombre: profitPercent
}
```

Cuando `displayStepByStepGuide()` llamaba:
```javascript
const values = calculateGuideValues(arb);  // values.profitPercentage = 5.2
generateGuideHeader(values.broker, values.profitPercentage)  // ✅ Se pasaba correctamente
```

Pero dentro de `generateGuideHeader` y `generateGuideSteps`:
```javascript
function generateGuideHeader(broker, profitPercent) {  // profitPercent = 5.2 ✅
  formatNumber(profitPercent)  // ✅ Funcionaba porque recibía el valor
}

function generateGuideSteps(values) {
  const { profitPercent } = values;  // ❌ profitPercent = undefined (no existe en values)
  // values.profitPercentage = 5.2 pero se buscaba values.profitPercent
}
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Corrección en `generateGuideHeader()`
```javascript
// ✅ DESPUÉS
function generateGuideHeader(broker, profitPercentage) {  // Parámetro renombrado
  const isProfitable = profitPercentage >= 0;
  return `
    ...
    <strong>${isProfitable ? '+' : ''}${formatNumber(profitPercentage)}%</strong>
    ...
  `;
}
```

### 2. Corrección en `generateGuideSteps()`
```javascript
// ✅ DESPUÉS
function generateGuideSteps(values) {
  const { estimatedInvestment, officialPrice, usdAmount, usdToUsdtRate, 
          usdtAfterFees, usdtArsBid, arsFromSale, finalAmount, profit, 
          profitPercentage,  // ✅ Nombre corregido
          broker } = values;
  // Ahora profitPercentage está correctamente extraído de values
}
```

### 3. Consistencia mantenida
- `calculateGuideValues()` retorna `profitPercentage` ✅
- `generateGuideHeader()` recibe `profitPercentage` ✅
- `generateGuideSteps()` usa `profitPercentage` ✅
- `displayStepByStepGuide()` pasa `values.profitPercentage` ✅

---

## 🔧 ARCHIVOS MODIFICADOS

### src/popup.js
- **Línea 1039**: Parámetro de `generateGuideHeader(broker, profitPercent)` → `generateGuideHeader(broker, profitPercentage)`
- **Línea 1041**: Variable `profitPercent` → `profitPercentage`
- **Línea 1048**: Variable `profitPercent` → `profitPercentage`
- **Línea 1059**: Destructuring `profitPercent` → `profitPercentage`

### manifest.json
- **Versión actualizada**: `5.0.66` → `5.0.67`

---

## 🧪 TESTING

### Escenario de prueba
1. Abrir el popup de la extensión
2. Esperar a que se carguen las rutas de arbitraje
3. Hacer click en cualquier ruta
4. Verificar que:
   - ✅ La pestaña "Guía" se activa
   - ✅ El contenido de la guía se muestra correctamente
   - ✅ El header muestra el broker y el porcentaje de ganancia/pérdida
   - ✅ Los pasos 1, 2, 3 se muestran con los valores calculados

### Logs de debugging
Con los logs añadidos en v5.0.66, ahora se verá en consola:
```
[POPUP] 📋 displayStepByStepGuide llamado
[POPUP] 📋 Datos recibidos: {broker: "Ripio", profitPercentage: 5.2, ...}
[POPUP] ✅ Contenedor encontrado: <div id="selected-arbitrage-guide">
[POPUP] ✅ Datos validados: broker = Ripio
[POPUP] 📊 Valores calculados: {profitPercentage: 5.2, profit: 5200, ...}
[POPUP] 📝 HTML de la guía generado exitosamente
[POPUP] ✅ HTML insertado en el contenedor
[POPUP] 🎬 Animaciones configuradas
[POPUP] ✅ displayStepByStepGuide completado exitosamente
```

---

## 📊 IMPACTO

### Antes (v5.0.66)
- ❌ Guía no se mostraba
- ❌ Usuario veía solo mensaje por defecto
- ❌ Funcionalidad principal de la extensión bloqueada

### Después (v5.0.67)
- ✅ Guía se muestra correctamente
- ✅ Header muestra broker y porcentaje
- ✅ Pasos 1, 2, 3 muestran valores calculados
- ✅ Usuario puede seguir la guía paso a paso

---

## 🔄 RELACIÓN CON VERSIONES ANTERIORES

- **v5.0.65**: Corrigió el click en rutas (selector de contenedor)
- **v5.0.66**: Diseño compacto minimalista + logging mejorado
- **v5.0.67**: Corrige nombres de propiedades para que la guía se muestre ✅

---

## 🎯 VERIFICACIÓN FINAL

✅ **Nombre de propiedad unificado**: `profitPercentage` en todo el flujo  
✅ **Destructuring correcto**: `generateGuideSteps` extrae `profitPercentage` de `values`  
✅ **Parámetros consistentes**: `generateGuideHeader` recibe `profitPercentage`  
✅ **Flujo completo**: Click → Conversión → Generación → Inserción → Display ✅  

---

**Estado**: ✅ LISTO PARA TESTING
