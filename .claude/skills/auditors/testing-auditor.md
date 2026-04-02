# Testing Auditor Skill

## Responsabilidad
Auditar la suite de tests y verificar cobertura adecuada.

## Archivos Bajo Auditoría
- `tests/*.test.js`
- `tests/e2e/*.spec.js`
- `jest.config.js`
- `playwright.config.js`

## Cobertura Objetivo

| Métrica | Objetivo |
|---------|----------|
| Statements | > 80% |
| Branches | > 75% |
| Functions | > 80% |
| Lines | > 80% |

## Checklist de Auditoría

### 1. Tests Unitarios
- [ ] Verificar tests para cada módulo
- [ ] Comprobar mocks de Chrome APIs
- [ ] Validar edge cases
- [ ] Revisar asserts significativos

### 2. Tests E2E
- [ ] Verificar tests de popup
- [ ] Comprobar tests de options
- [ ] Validar flujos completos

### 3. Configuración
- [ ] Verificar jest.config.js
- [ ] Comprobar playwright.config.js
- [ ] Validar CI/CD

### 4. Mocks
- [ ] Verificar chrome.runtime mocks
- [ ] Comprobar chrome.storage mocks
- [ ] Validar fetch mocks

## Tests Requeridos por Componente

### Background
- `main-simple.js` → Manejo de mensajes, alarms
- `apiClient.js` → Fetch, timeout, rate limiting
- `arbitrageCalculator.js` → Cálculos, edge cases

### Popup
- `popup.js` → Renderizado, eventos
- `routeRenderer.js` → Generación de HTML
- `filterController.js` → Aplicación de filtros

### Modules
- `filterManager.js` → Filtros
- `routeManager.js` → Gestión rutas
- `simulator.js` → Cálculos

## Comandos de Testing

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests E2E
npm run test:e2e
```

## Output de Auditoría
```
📊 AUDITORÍA TESTING
====================
✅/⚠️ Coverage statements > 80%
✅/⚠️ Coverage branches > 75%
✅/⚠️ Mocks de Chrome APIs OK
✅/⚠️ Tests E2E configurados
✅/⚠️ Jest configurado correctamente
```