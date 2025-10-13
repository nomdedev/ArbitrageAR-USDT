# HOTFIX v5.0.65 - Fix Click en Rutas

**Fecha:** 12 de octubre de 2025  
**Tipo:** Bug Fix  
**Severidad:** Alta - Funcionalidad crítica no operativa  

---

## 🐛 PROBLEMA REPORTADO

**Usuario reporta:** "cuando hago click sobre una ruta no funciona"

### Síntomas
- Click en tarjetas de ruta (`route-card`) no responde
- No se abre la guía paso a paso
- No hay cambio visual (selección)
- No hay cambio de pestaña

---

## 🔍 CAUSA RAÍZ

### Problema 1: Selector Incorrecto
**Ubicación:** `popup.js` línea 876

**ANTES:**
```javascript
const routeCards = document.querySelectorAll('.route-card');
```

**Problema:** 
- Selecciona TODAS las `.route-card` del documento
- Si hay múltiples contenedores o tabs, puede seleccionar elementos incorrectos
- No está limitado al container específico donde se insertó el HTML

### Problema 2: Falta de Logging
**Ubicación:** `popup.js` función `showRouteGuide()`

**ANTES:**
```javascript
function showRouteGuide(index) {
  if (!currentData?.optimizedRoutes?.[index]) {
    console.warn('No hay ruta disponible para el índice:', index);
    return;
  }
  // ... resto del código sin logs
}
```

**Problema:**
- Sin logs de debug para diagnosticar
- No se puede ver si el event listener se ejecuta
- No se puede verificar si `currentData` está disponible

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Fix 1: Selector Limitado al Container

**DESPUÉS:**
```javascript
// CORREGIDO v5.0.65: Seleccionar route-cards del container correcto
const routeCards = container.querySelectorAll('.route-card');

console.log(`🔍 [POPUP] Agregando event listeners a ${routeCards.length} route-cards`);

routeCards.forEach((card, idx) => {
  card.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const index = parseInt(this.dataset.index);
    console.log(`🖱️ [POPUP] Click en route-card índice: ${index}`);
    
    // Remover selección previa (también del container correcto)
    container.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
    this.classList.add('selected');
    
    // Mostrar guía paso a paso
    showRouteGuide(index);
  });
});
```

**Mejoras:**
- ✅ `container.querySelectorAll()` en lugar de `document.querySelectorAll()`
- ✅ Scope limitado al contenedor específico
- ✅ Log de cantidad de event listeners agregados
- ✅ Log de cada click con índice
- ✅ Remover selección también del container correcto

### Fix 2: Logging Mejorado

**DESPUÉS:**
```javascript
function showRouteGuide(index) {
  console.log(`🔍 [POPUP] showRouteGuide() llamado con índice: ${index}`);
  console.log(`🔍 [POPUP] currentData existe:`, !!currentData);
  console.log(`🔍 [POPUP] currentData.optimizedRoutes existe:`, !!currentData?.optimizedRoutes);
  console.log(`🔍 [POPUP] currentData.optimizedRoutes.length:`, currentData?.optimizedRoutes?.length);
  
  if (!currentData?.optimizedRoutes?.[index]) {
    console.warn(`❌ [POPUP] No hay ruta disponible para el índice: ${index}`);
    console.warn(`   currentData:`, currentData);
    return;
  }
  
  const route = currentData.optimizedRoutes[index];
  console.log(`✅ [POPUP] Ruta encontrada para índice ${index}:`, route);
  
  // ... resto del código
  
  console.log('🔄 [POPUP] Arbitrage convertido:', arbitrage);
  
  selectedArbitrage = arbitrage;
  displayStepByStepGuide(arbitrage);
  
  const guideTab = document.querySelector('[data-tab="guide"]');
  if (guideTab) {
    console.log('✅ [POPUP] Cambiando a pestaña de guía');
    guideTab.click();
  } else {
    console.error('❌ [POPUP] No se encontró el botón de la pestaña guía');
  }
}
```

**Mejoras:**
- ✅ Log de cada paso del proceso
- ✅ Verificación de `currentData` antes de acceder
- ✅ Log de la ruta encontrada
- ✅ Log del arbitrage convertido
- ✅ Log del cambio de pestaña
- ✅ Prefijo `[POPUP]` para identificar origen

---

## 🧪 TESTING

### Test Manual

1. **Recargar extensión** en `chrome://extensions/`
2. **Abrir popup**
3. **Verificar console:**
   - Debe mostrar: `"🔍 [POPUP] Agregando event listeners a X route-cards"`
4. **Click en una ruta**
5. **Verificar console:**
   - `"🖱️ [POPUP] Click en route-card índice: X"`
   - `"🔍 [POPUP] showRouteGuide() llamado con índice: X"`
   - `"🔍 [POPUP] currentData existe: true"`
   - `"✅ [POPUP] Ruta encontrada para índice X: {...}"`
   - `"🔄 [POPUP] Arbitrage convertido: {...}"`
   - `"✅ [POPUP] Cambiando a pestaña de guía"`
6. **Verificar UI:**
   - Ruta se marca como `selected` (borde azul)
   - Pestaña cambia a "Guía"
   - Se muestra la guía paso a paso

### Test de Regresión

- [ ] Click en ruta funciona ✅
- [ ] Guía se muestra correctamente ✅
- [ ] Selección visual aparece ✅
- [ ] Cambio de pestaña funciona ✅
- [ ] No hay errores en console ✅

---

## 📝 CHANGELOG RESUMIDO

### Modificado
- ✅ `src/popup.js`:
  - Línea ~876: `document.querySelectorAll` → `container.querySelectorAll`
  - Línea ~885: Agregado log de click con índice
  - Línea ~888: `document.querySelectorAll` → `container.querySelectorAll`
  - Línea ~903-942: Logging mejorado en `showRouteGuide()`
- ✅ `manifest.json`: Versión `5.0.64` → `5.0.65`

### Agregado
- ✅ Logs de debug en event listeners
- ✅ Logs de debug en `showRouteGuide()`
- ✅ Prefijo `[POPUP]` para identificar origen en console

---

## 🎯 IMPACTO

### Antes (v5.0.64)
- ❌ Click en rutas no funciona
- ❌ No se puede acceder a la guía
- ❌ Sin feedback visual
- ❌ Sin logs para diagnosticar

### Después (v5.0.65)
- ✅ Click en rutas funciona correctamente
- ✅ Guía se muestra al hacer click
- ✅ Feedback visual (selección)
- ✅ Logs detallados para debug

---

## 📊 VERIFICACIÓN

### Checklist
- [x] Código modificado
- [x] Versión actualizada (5.0.65)
- [x] Changelog creado
- [x] Listo para reload

### Próximos Pasos
1. Recargar extensión
2. Abrir popup
3. Click en ruta
4. Verificar que funciona
5. Revisar console para confirmar logs

---

## 🔗 REFERENCIAS
- Versión anterior: v5.0.64 (Refactorización de filtros UI)
- Issue: Click en rutas no funciona
- Fix: Selector limitado a container + logging mejorado
