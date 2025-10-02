# 🧪 Instrucciones para Testing de la Extensión

## 📋 Pasos para Probar la Extensión

### 1. Recargar la Extensión en Chrome
1. Abre Chrome/Brave
2. Ve a `chrome://extensions/`
3. Busca "ArbitrageAR Oficial a USDT Broker"
4. Haz clic en el botón de **recargar** (icono de flecha circular)

### 2. Verificar la Consola del Service Worker
1. En la página de extensiones, haz clic en **"service worker"** (texto azul)
2. Se abrirá DevTools con la consola del background
3. Deberías ver:
   ```
   ✅ Todos los servicios importados correctamente
   ✅ Servicios inicializados: {dataService: true, storageManager: true, ...}
   🔄 Iniciando actualización de datos...
   ```

### 3. Verificar la Consola del Popup
1. Haz clic derecho en el ícono de la extensión
2. Selecciona **"Inspeccionar popup"**
3. Se abrirá DevTools con la consola del popup
4. Haz clic en el ícono de la extensión para abrir el popup
5. Deberías ver:
   ```
   📥 Popup recibió datos: {hasData: true, optimizedRoutes: X, ...}
   ```

### 4. Qué Buscar en la Consola

#### ✅ **Consola del Service Worker (Background):**
```javascript
✅ Todos los servicios importados correctamente
✅ Servicios inicializados: {
  dataService: true,
  storageManager: true,
  arbitrageCalculator: true,
  notificationManager: true,
  scrapingService: true
}
🔄 Iniciando actualización de datos...
📊 Datos actualizados correctamente
```

#### ✅ **Consola del Popup:**
```javascript
📥 Popup recibió datos: {
  hasData: true,
  optimizedRoutes: 4,
  arbitrages: 4,
  marketHealth: "Bueno"
}
```

### 5. Errores Comunes y Soluciones

#### ❌ Error: "Cannot find module"
- **Solución:** Verificar que todos los archivos estén en la carpeta `src/`
- Recargar la extensión completamente (deshabilitarla y habilitarla)

#### ❌ Error: "dataService is not defined"
- **Solución:** Los imports no se cargaron correctamente
- Verificar que `importScripts` esté en la primera línea de `background-refactored.js`

#### ❌ El popup se queda en "Calculando rutas optimizadas..."
- **Problema:** El service worker no está respondiendo
- **Solución:** 
  1. Verificar la consola del service worker para errores
  2. Verificar que las APIs estén respondiendo (DolarAPI y CriptoYA)
  3. Comprobar permisos en manifest.json

### 6. Testing Manual Completo

1. **Test de Datos:**
   - Abrir el popup
   - Verificar que muestre rutas de arbitraje
   - Verificar que los precios sean números válidos

2. **Test de Pestañas:**
   - Hacer clic en "Rutas" ✅
   - Hacer clic en "Simulador" ✅
   - Hacer clic en "Guía" ✅
   - Hacer clic en "Bancos" ✅

3. **Test de Actualización:**
   - Hacer clic en el botón de actualizar (↻)
   - Verificar que los datos se actualicen

4. **Test de Configuración:**
   - Hacer clic en el botón de configuración (⚙️)
   - Verificar que abra la página de opciones

### 7. Verificación de APIs

Puedes probar las APIs manualmente en la consola del DevTools:

```javascript
// Test DolarAPI
fetch('https://dolarapi.com/v1/dolares/oficial')
  .then(r => r.json())
  .then(console.log);

// Test CriptoYA USDT/ARS
fetch('https://criptoya.com/api/usdt/ars/1')
  .then(r => r.json())
  .then(console.log);

// Test CriptoYA USDT/USD
fetch('https://criptoya.com/api/usdt/usd/1')
  .then(r => r.json())
  .then(console.log);
```

### 8. Comandos de Testing desde Terminal

```bash
# Verificar sintaxis de todos los archivos
node -c src/DataService.js
node -c src/StorageManager.js
node -c src/ArbitrageCalculator.js
node -c src/NotificationManager.js
node -c src/ScrapingService.js
node -c src/background-refactored.js

# Ejecutar tests de integración
cd tests
node --experimental-modules test-refactored-services.js
```

### 9. Checklist de Verificación

- [ ] La extensión carga sin errores
- [ ] La consola del service worker muestra "✅ Servicios inicializados"
- [ ] El popup muestra datos de arbitraje
- [ ] Las 4 pestañas funcionan correctamente
- [ ] El botón de actualizar funciona
- [ ] No hay errores en ninguna consola
- [ ] Los precios se muestran correctamente formateados

### 10. Reportar Problemas

Si encuentras un error, incluye:
1. Mensaje de error completo de la consola
2. Pasos para reproducir el error
3. Screenshot del error
4. Versión de Chrome/Brave

## 🎯 Resultado Esperado

La extensión debería:
- Cargar inmediatamente al hacer clic
- Mostrar rutas de arbitraje en segundos
- Actualizar datos cada 2 minutos automáticamente
- No mostrar errores en consola (excepto warnings esperados de APIs)

---

**Última actualización:** 2 de octubre de 2025
**Versión:** 5.0.0
