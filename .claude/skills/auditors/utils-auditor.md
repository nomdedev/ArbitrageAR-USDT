# Utils Auditor Skill

## Responsabilidad
Auditar las utilidades y helpers del proyecto.

## Archivos Bajo Auditoría
- `src/utils/stateManager.js`
- `src/utils/formatters.js`
- `src/utils/logger.js`
- `src/utils/commonUtils.js`
- `src/utils/bankCalculations.js`

## Checklist de Auditoría

### 1. StateManager
- [ ] Verificar get/set funciona
- [ ] Comprobar subscribe/unsubscribe
- [ ] Validar persistencia
- [ ] Revisar cleanup de listeners

### 2. Formatters
- [ ] Verificar currency format
- [ ] Comprobar percent format
- [ ] Validar number format
- [ ] Revisar date format

### 3. Logger
- [ ] Verificar niveles de log
- [ ] Comprobar prefijos
- [ ] Validar debug mode
- [ ] Revisar performance

### 4. CommonUtils
- [ ] Verificar debounce
- [ ] Comprobar throttle
- [ ] Validar sleep
- [ ] Revisar helpers

## Tests de Verificación

```javascript
// StateManager tests
StateManager.set('test', 'value');
expect(StateManager.get('test')).toBe('value');

// Formatters tests
expect(Fmt.currency(1000000)).toMatch(/1.000.000/);
expect(Fmt.percent(15.5)).toBe('15.50%');
```

## Output de Auditoría
```
📊 AUDITORÍA UTILS
=================
✅/⚠️ StateManager funciona
✅/⚠️ Formatters correctos
✅/⚠️ Logger configurado
✅/⚠️ CommonUtils útiles
```