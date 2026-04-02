# Modules Auditor Skill

## Responsabilidad
Auditar los módulos especializados y su integración.

## Archivos Bajo Auditoría
- `src/modules/filterManager.js`
- `src/modules/modalManager.js`
- `src/modules/notificationManager.js`
- `src/modules/routeManager.js`
- `src/modules/simulator.js`

## Checklist de Auditoría

### 1. Patrón Module (IIFE)
- [ ] Verificar encapsulamiento
- [ ] Comprobar estado privado
- [ ] Validar interfaz pública
- [ ] Revisar naming consistente

### 2. Inicialización
- [ ] Verificar `init()` funciona
- [ ] Comprobar parámetros requeridos
- [ ] Validar orden de inicialización
- [ ] Revisar manejo de errores

### 3. Integración
- [ ] Verificar comunicación entre módulos
- [ ] Comprobar eventos emitidos
- [ ] Validar dependencias
- [ ] Revisar cleanup

### 4. Testing
- [ ] Verificar tests unitarios
- [ ] Comprobar mocks correctos
- [ ] Validar cobertura

## Módulos a Verificar

### FilterManager
```javascript
window.FilterManager.init(userSettings, allRoutes);
const filtered = window.FilterManager.applyFilters(allRoutes);
```

### RouteManager
```javascript
window.RouteManager.init(currentData, userSettings);
const route = window.RouteManager.getRouteById(id);
```

### Simulator
```javascript
window.Simulator.init(currentData, userSettings);
const result = window.Simulator.calculate(amount, route);
```

### ModalManager
```javascript
window.ModalManager.init(userSettings);
window.ModalManager.show('route-details', content);
```

### NotificationManager
```javascript
window.NotificationManager.init(userSettings);
window.NotificationManager.checkThreshold(route);
```

## Output de Auditoría
```
📊 AUDITORÍA MÓDULOS
===================
✅/⚠️ FilterManager funciona
✅/⚠️ RouteManager funciona
✅/⚠️ Simulator funciona
✅/⚠️ ModalManager funciona
✅/⚠️ NotificationManager funciona
✅/⚠️ Patrón IIFE correcto
```