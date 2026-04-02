---
hookName: pre-commit
description: Hook que se ejecuta antes de cada commit
triggers: [git commit]
---

# Pre-Commit Hook

## Validaciones antes de commit

### 1. Ejecutar linting
```bash
echo "🔍 Ejecutando ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting falló. Corrige los errores antes de commit."
  npm run lint:fix
fi
```

### 2. Ejecutar tests unitarios
```bash
echo "🧪 Ejecutando tests unitarios..."
npm run test -- --passWithNoTests
if [ $? -ne 0 ]; then
  echo "❌ Tests fallaron. Revisa los errores."
  exit 1
fi
```

### 3. Verificar formato
```bash
echo "📐 Verificando formato..."
npm run format:check
if [ $? -ne 0 ]; then
  echo "⚠️ Formato incorrecto. Ejecutando auto-format..."
  npm run format
fi
```

### 4. Verificar que no hay console.log en producción
```bash
echo "🔍 Verificando console.log..."
if grep -r "console\.log" src/*.js --quiet; then
  echo "⚠️ Encontrado console.log en código. ¿Continuar? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    exit 1
  fi
fi
```

### 5. Verificar que manifest.json es válido
```bash
echo "📋 Verificando manifest.json..."
node -e "JSON.parse(require('fs').readFileSync('manifest.json'))"
if [ $? -ne 0 ]; then
  echo "❌ manifest.json inválido"
  exit 1
fi
```

### 6. Mensaje de commit en español
```bash
echo "📝 Verificando formato de commit..."
# Validar que el mensaje esté en español y tenga formato correcto
# Formato: tipo: descripción
# Tipos: feat, fix, refactor, test, docs, style, chore
```