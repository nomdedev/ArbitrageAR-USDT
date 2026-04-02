---
commandName: /lint
description: Ejecuta linting y formateo del código
---

# Comando: /lint

## Ejecución
```bash
# Verificar errores
npm run lint

# Auto-corregir errores
npm run lint:fix

# Verificar formato
npm run format:check

# Aplicar formato
npm run format
```

## Reglas ESLint configuradas
- `no-unused-vars`: Variables no usadas
- `no-console`: Warnings para console.log
- `prefer-const`: Preferir const sobre let
- `no-var`: No usar var
- `eqeqeq`: Usar === en lugar de ==

## Configuración Prettier
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Output esperado
```
✅ X problems fixed
⚠️ X warnings
❌ X errors
```