# HOTFIX_V5.0.60_APPLYNEGATIVEFILTER_UNDEFINED

## 📅 Fecha: 12 de octubre de 2025

## 🐛 Problema Crítico
**Error:** `ReferenceError: applyNegativeFilter is not defined` en `popup.js:644`

### Descripción del Error
Tercer error crítico en la cadena de hotfixes. Durante la implementación del hotfix v5.0.56 (Modos de Display), la función `applyNegativeFilter` fue **reemplazada accidentalmente** por `applyOnlyProfitableFilter` en lugar de **agregar** la nueva función.

### Síntomas
```
popup.html:1 Error handling response: ReferenceError: applyNegativeFilter is not defined
    at applyUserPreferences (popup.js:644:3)
    at applyP2PFilter (popup.js:302:20)
```

## 🔍 Análisis del Problema

### Contexto del Error
En v5.0.56 se implementaron dos nuevos filtros:
1. **showOnlyProfitable**: Mostrar solo rutas con ganancia > 0
2. **sortByProfit**: Ordenar rutas por ganancia descendente

Al implementar `applyOnlyProfitableFilter`, se **sobrescribió** incorrectamente la función `applyNegativeFilter` que ya existía.

### Diferencia entre las Funciones
- **`applyNegativeFilter`**: Filtra rutas negativas si `showNegativeRoutes = false`
  - Filtro: `r.profitPercentage >= 0` (incluye 0)
  - Control: `showNegativeRoutes` (mostrar/ocultar negativas)
  
- **`applyOnlyProfitableFilter`**: Muestra solo rutas rentables si `showOnlyProfitable = true`
  - Filtro: `r.profitPercentage > 0` (excluye 0)
  - Control: `showOnlyProfitable` (solo rentables)

**Ambas son necesarias** para diferentes casos de uso.

## ✅ Solución Implementada

### Restauración de Función
Agregada de vuelta la función `applyNegativeFilter` que faltaba:

```javascript
function applyOnlyProfitableFilter(routes, showOnlyProfitable) {
  if (showOnlyProfitable === true) {
    const beforeCount = routes.length;
    const filtered = routes.filter(r => r.profitPercentage > 0);
    if (DEBUG_MODE) console.log(`🔧 [POPUP] Filtradas solo rentables: ${beforeCount} → ${filtered.length} rutas`);
    return filtered;
  }
  if (DEBUG_MODE) console.log('🔍 [POPUP] No se filtra solo rentables');
  return routes;
}

// RESTAURADA v5.0.60
function applyNegativeFilter(routes, showNegative) {
  if (showNegative === false) {
    const beforeCount = routes.length;
    const filtered = routes.filter(r => r.profitPercentage >= 0);
    if (DEBUG_MODE) console.log(`🔧 [POPUP] Filtradas ${beforeCount - filtered.length} rutas negativas, quedan ${filtered.length}`);
    return filtered;
  }
  if (DEBUG_MODE) console.log('🔍 [POPUP] No se filtran rutas negativas');
  return routes;
}
```

### Flujo de Filtros Correcto
Ahora `applyUserPreferences` usa ambos filtros en orden:

1. `applyProfitThresholdFilter` - Umbral mínimo configurable
2. **`applyOnlyProfitableFilter`** - Solo rentables (nuevo v5.0.56)
3. **`applyNegativeFilter`** - Ocultar negativas (restaurado v5.0.60)
4. `applyPreferredExchangesFilter` - Exchanges preferidos
5. `applySorting` - Ordenamiento
6. `applyLimit` - Límite de rutas

## 📊 Impacto
- **Severidad**: CRÍTICA - Popup no renderizaba rutas
- **Alcance**: Toda la visualización de rutas de arbitraje
- **Usuarios afectados**: 100% (ninguna ruta se mostraba)

## 🔧 Archivos Modificados
1. `src/popup.js` - Restaurada función applyNegativeFilter
2. `manifest.json` - Actualizado a v5.0.60

## 🧪 Validación
- ✅ Sintaxis verificada con `node -c`
- ✅ Ambas funciones ahora disponibles
- ✅ Flujo de filtros completo restaurado

## 🚀 Despliegue
1. Recargar extensión en `chrome://extensions/`
2. Abrir popup - rutas deberían mostrarse correctamente
3. Probar diferentes configuraciones de filtros

## 📝 Lecciones Aprendidas
- **Siempre agregar, nunca reemplazar** funciones similares
- Validar que nuevas features no eliminen funcionalidad existente
- Tests automatizados habrían detectado esta regresión
- Code review crítico en refactorings de UI

## 🔄 Correlación con Hotfixes Anteriores
Esta es la **tercera corrección crítica consecutiva**:
- v5.0.58: `arsFromSale` no definido (backend)
- v5.0.59: `brokerFeeConfig` scope incorrecto (backend)
- **v5.0.60**: `applyNegativeFilter` eliminado accidentalmente (frontend)

Todos son errores de **variables/funciones no definidas** causados por refactorings incompletos.

---
*Tercer hotfix crítico - Función de filtro restaurada*