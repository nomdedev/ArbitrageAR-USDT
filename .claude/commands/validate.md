---
commandName: /validate
description: Ejecuta validación completa del proyecto
---

# Comando: /validate

## Ejecución
```bash
npm run validate
```

## Checklist de validación
- [ ] ESLint sin errores
- [ ] Prettier formato correcto
- [ ] Tests unitarios pasando
- [ ] manifest.json válido
- [ ] package.json válido
- [ ] Sin dependencias vulnerables

## Validaciones detalladas

### 1. Linting
```bash
npm run lint
```

### 2. Formato
```bash
npm run format:check
```

### 3. Tests
```bash
npm run test
```

### 4. Auditoría de seguridad
```bash
npm audit --audit-level=moderate
```

### 5. Validar manifest
```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json'))"
```

### 6. Validar package
```bash
node -e "JSON.parse(require('fs').readFileSync('package.json'))"
```

## Output
```
✅ All validations passed!
```

## Si falla
```
❌ Validation failed!
- Fix linting errors
- Fix formatting
- Fix failing tests
```