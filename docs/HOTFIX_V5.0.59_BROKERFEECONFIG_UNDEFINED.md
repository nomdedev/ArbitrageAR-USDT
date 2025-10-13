# HOTFIX_V5.0.59_BROKERFEECONFIG_UNDEFINED

## 📅 Fecha: 12 de octubre de 2025

## 🐛 Problema Crítico
**Error:** `ReferenceError: brokerFeeConfig is not defined` en `main-simple.js:308`

### Descripción del Error
Segundo error crítico detectado inmediatamente después del hotfix v5.0.58. La variable `brokerFeeConfig` se definía dentro de bloques `if (applyFees)` en dos lugares diferentes (PASO 3 y PASO 4), pero se intentaba usar fuera de esos bloques en la línea 308 donde se construye el objeto de configuración de la ruta.

### Síntomas
```
popup.js:491 ⏰ [POPUP] TIMEOUT: El callback del background nunca se ejecutó (15 segundos)
main-simple.js:400 ❌ Error en updateData: ReferenceError: brokerFeeConfig is not defined
    at calculateSimpleRoutes (main-simple.js:308:31)
```

## ✅ Solución Implementada

### Problema de Scope
La variable `brokerFeeConfig` tenía **scope limitado** a los bloques `if (applyFees)`:
- **Línea 191**: Definida en PASO 3 (fees de compra)
- **Línea 222**: Re-definida en PASO 4 (fees de venta)
- **Línea 308**: Usada fuera de ambos bloques → ❌ ERROR

### Solución: Definición Única al Inicio
Movida la búsqueda de `brokerFeeConfig` **una sola vez** al inicio del loop, antes de todos los pasos de cálculo:

```javascript
processedCount++;

// NUEVO v5.0.59: Buscar configuración de fees del broker UNA SOLA VEZ
const brokerFees = userSettings.brokerFees || [];
const brokerFeeConfig = brokerFees.find(fee => 
  fee.broker.toLowerCase() === exchange.toLowerCase()
);

// Ahora brokerFeeConfig está disponible en todo el scope del loop
```

### Cambios en PASO 3 y PASO 4
- **PASO 3**: Eliminada definición duplicada de `brokerFees` y `brokerFeeConfig`
- **PASO 4**: Eliminada definición duplicada de `brokerFees` y `brokerFeeConfig`
- Ambos pasos ahora usan la variable definida al inicio

## 🧪 Validación
- ✅ Sintaxis verificada con `node -c`
- ✅ Variable `brokerFeeConfig` ahora tiene scope correcto
- ✅ Optimización: Se busca el broker fee config solo una vez por exchange

## 📊 Impacto
- **Severidad**: CRÍTICA - La extensión no funcionaba
- **Alcance**: Todos los cálculos de arbitraje con fees por broker
- **Usuarios afectados**: 100% (extensión inoperable)

## 🔧 Archivos Modificados
1. `src/background/main-simple.js` - Movida definición de brokerFeeConfig
2. `manifest.json` - Actualizado a v5.0.59

## 🎯 Beneficios Adicionales
- **Performance**: Se busca el fee config del broker 1 vez en lugar de 2
- **Mantenibilidad**: Variable definida en un solo lugar, más fácil de mantener
- **Legibilidad**: Código más claro y lógico

## 🚀 Despliegue
1. Recargar extensión en `chrome://extensions/`
2. Abrir popup para verificar carga de datos
3. Confirmar ausencia de errores

## 📝 Lecciones Aprendidas
- Siempre definir variables fuera de bloques condicionales si se necesitan en múltiples lugares
- Evitar definiciones duplicadas que complican el debugging
- Validar scope de variables antes de refactorizar código

---
*Segundo hotfix crítico aplicado - Scope de variables corregido*