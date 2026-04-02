---
hookName: post-edit
description: Hook que se ejecuta después de cada edición de archivo
triggers: [Edit, Write]
---

# Post-Edit Hook

## Acciones después de editar

### 1. Formatear con Prettier
```bash
if [[ "$FILE_PATH" == *.js ]] || [[ "$FILE_PATH" == *.css ]] || [[ "$FILE_PATH" == *.html ]]; then
  npx prettier --write "$FILE_PATH" 2>/dev/null
  echo "✅ Formateado: $FILE_PATH"
fi
```

### 2. Lint con ESLint (para JS)
```bash
if [[ "$FILE_PATH" == *.js ]]; then
  npx eslint "$FILE_PATH" --fix 2>/dev/null
  echo "✅ Lint aplicado: $FILE_PATH"
fi
```

### 3. Verificar imports
```bash
if [[ "$FILE_PATH" == src/**/*.js ]]; then
  echo "🔍 Verificando imports..."
  grep -E "^import|^require" "$FILE_PATH" | while read -r line; do
    echo "  - $line"
  done
fi
```

### 4. Actualizar métricas
```bash
echo "📊 Archivo modificado: $(date +%Y-%m-%d\ %H:%M:%S)" >> .claude/metrics/edits.log
```