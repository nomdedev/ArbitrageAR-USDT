# Performance Auditor Skill

## Responsabilidad
Auditar el rendimiento del proyecto y proponer optimizaciones.

## Archivos Bajo Auditoría
- `src/popup.js` (4556 líneas - crítico)
- `src/background/arbitrageCalculator.js`
- `src/ui/routeRenderer.js`
- Todos los archivos CSS

## Métricas Objetivo

| Métrica | Objetivo |
|---------|----------|
| Tiempo carga popup | < 300ms |
| Renderizado 50 items | < 100ms |
| Renderizado 100 items | < 200ms |
| Memoria popup | < 30MB |
| Memoria total | < 50MB |
| CPU inactivo | < 1% |
| CPU actualizando | < 5% |

## Checklist de Auditoría

### 1. Tiempos de Carga
- [ ] Medir tiempo de parseo JS
- [ ] Verificar lazy loading
- [ ] Comprobar critical CSS

### 2. Renderizado
- [ ] Verificar virtual scrolling
- [ ] Comprobar layout thrashing
- [ ] Validar repaints innecesarios
- [ ] Revisar animaciones GPU

### 3. Memoria
- [ ] Detectar memory leaks
- [ ] Verificar cleanup de listeners
- [ ] Comprobar cache size
- [ ] Revisar referencias circulares

### 4. CPU
- [ ] Medir uso en cálculos
- [ ] Verificar throttling/debouncing
- [ ] Comprobar Web Workers

### 5. Bundle Size
- [ ] Medir tamaño total
- [ ] Verificar tree shaking
- [ ] Comprobar code splitting

## Problemas Comunes

### PERF-001: popup.js muy grande
**Tamaño:** 4556 líneas
**Impacto:** Alto
**Solución:** Refactorizar en módulos

### PERF-002: Sin virtual scrolling
**Impacto:** Alto
**Solución:** Implementar para listas > 20 items

### PERF-003: Sin memoización
**Impacto:** Medio
**Solución:** Memoizar cálculos repetitivos

## Herramientas de Medición

```javascript
// Performance timing
performance.mark('start');
// ... código ...
performance.mark('end');
performance.measure('myFunction', 'start', 'end');

// Memory usage
console.log('Memory:', performance.memory);
```

## Output de Auditoría
```
📊 AUDITORÍA PERFORMANCE
========================
✅/⚠️ Tiempo carga popup
✅/⚠️ Tamaño archivos OK
✅/⚠️ Virtual scrolling implementado
✅/⚠️ Memoización aplicada
✅/⚠️ Memory OK
✅/⚠️ CPU OK
```