# 🧪 E2E Tests - Filter Buttons

Pruebas end-to-end para verificar el correcto funcionamiento de los botones de filtro en el footer.

## 📋 Tests Implementados

### Archivo: `filter-tests.js`

Script de pruebas que se puede ejecutar directamente en la consola del popup de la extensión.

#### Tests Incluidos:

1. **testButtonsExist** - Verifica que existan los 3 botones de filtro
2. **testDataFilterAttributes** - Verifica atributos `data-filter` correctos
3. **testDefaultActiveState** - Verifica que el filtro "all" esté activo por defecto
4. **testSVGIcons** - Verifica que todos los botones tengan íconos SVG
5. **testClickBehavior** - Simula clicks y verifica cambios de estado
6. **testStateSynchronization** - Verifica que solo un botón esté activo a la vez
7. **testTooltips** - Verifica que todos los botones tengan tooltips
8. **testAccessibility** - Verifica ARIA labels para accesibilidad
9. **testCSSClasses** - Verifica clases CSS aplicadas correctamente
10. **testFullCycle** - Verifica ciclo completo de filtros (all → no-p2p → p2p → all)
11. **testFilterManagerLoaded** - Verifica que FilterManager esté disponible
12. **testEventListeners** - Verifica que los event listeners funcionen

## 🚀 Cómo Ejecutar los Tests

### Método 1: En la Consola del Popup (Recomendado)

1. Abre Chrome y navega a `chrome://extensions`
2. Activa el **Modo de desarrollador** (esquina superior derecha)
3. Click en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta: `d:\martin\Proyectos\ArbitrageAR-USDT`
5. Click en el ícono de la extensión para abrir el popup
6. Abre DevTools en el popup (Click derecho → Inspeccionar o F12)
7. En la consola, ejecuta:
   ```javascript
   filterTests.runAll()
   ```

### Método 2: Navegador Standalone

1. Abre el archivo `tests/e2e/test-filters.html` en Chrome
2. Click en el botón **"Run All Tests"**
3. Observa los resultados en la página

## 📊 Formato de Resultados

Los tests mostrarán resultados en la consola con el siguiente formato:

```
🧪 ================================
🧪 E2E TESTS - FILTER BUTTONS
🧪 ================================

ℹ️ Test 1: Verificar existencia de botones de filtro
✅ PASS: Se encontraron 3 botones de filtro

ℹ️ Test 2: Verificar atributos data-filter
✅ PASS: Todos los filtros correctos: no-p2p, p2p, all

...

📊 ================================
📊 RESUMEN DE PRUEBAS
📊 ================================
✅ Passed: 12
❌ Failed: 0
📈 Total: 12
🎯 Success Rate: 100.0%

🎉 TODOS LOS TESTS PASARON! 🎉
```

## 🎯 Criterios de Éxito

Para que los tests pasen exitosamente:

- ✅ Deben existir exactamente 3 botones con clase `.filter-btn-footer`
- ✅ Los botones deben tener `data-filter` con valores: `no-p2p`, `p2p`, `all`
- ✅ El botón "all" debe estar activo por defecto
- ✅ Todos los botones deben tener íconos SVG
- ✅ Los clicks deben cambiar el estado activo correctamente
- ✅ Solo un botón debe estar activo a la vez
- ✅ Todos los botones deben tener tooltips (`data-tooltip`)
- ✅ Todos los botones deben tener ARIA labels (`aria-label`)
- ✅ FilterManager debe estar cargado y disponible

## 🐛 Debugging

Si algún test falla:

1. **Verifica el HTML**: Asegúrate de que los botones existan en `popup.html`
2. **Verifica FilterManager**: Confirma que `filterManager.js` esté cargado
3. **Verifica CSS**: Asegúrate de que `.filter-btn-footer` tenga estilos aplicados
4. **Verifica Event Listeners**: Confirma que `setupFilterButtons()` se ejecute en `popup.js`

### Verificación Manual en Consola:

```javascript
// Verificar que existen los botones
document.querySelectorAll('.filter-btn-footer')

// Verificar FilterManager
FilterManager

// Verificar filtros
FilterManager.getCurrentFilter()

// Simular click manual
document.querySelector('.filter-btn-footer[data-filter="p2p"]').click()
```

## 📝 Notas

- Los tests son **no destructivos** y restauran el estado original después de cada prueba
- Los tests usan delays de 150-300ms para permitir que las animaciones CSS completen
- El script se carga automáticamente cuando se incluye en `popup.html`
- La variable global `filterTests` está disponible para ejecutar tests manualmente

## 🔧 Mantenimiento

Al agregar nuevos filtros:

1. Actualiza `expectedFilters` en `testDataFilterAttributes()`
2. Actualiza `filters` array en `testFullCycle()`
3. Agrega tests específicos si el nuevo filtro tiene comportamiento único

## 📚 Archivos Relacionados

- **Tests**: `tests/e2e/filter-tests.js`
- **HTML Test Page**: `tests/e2e/test-filters.html`
- **Componente**: `src/modules/filterManager.js`
- **HTML**: `src/popup.html` (footer section)
- **CSS**: `src/popup.css` (`.filter-btn-footer`)

---

**Última actualización**: 3 de febrero de 2026
**Versión**: 8.0.0
