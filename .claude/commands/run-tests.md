---
commandName: /run-tests
description: Ejecuta todos los tests del proyecto
---

# Comando: /run-tests

## Ejecución
```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests E2E
npm run test:e2e

# Tests en watch mode
npm run test:watch
```

## Argumentos opcionales
- `--unit`: Solo tests unitarios
- `--e2e`: Solo tests E2E
- `--coverage`: Con coverage report
- `--watch`: Watch mode
- `--fix`: Intentar auto-corregir

## Output esperado
```
Test Suites: X passed, X total
Tests:       X passed, X total
Snapshots:   X total
Time:        X.XXX s
Coverage:    X%
```