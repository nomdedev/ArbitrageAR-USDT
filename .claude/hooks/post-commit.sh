---
hookName: post-commit
description: Hook que se ejecuta después de cada commit
triggers: [git commit]
---

# Post-Commit Hook

## Acciones después de commit

### 1. Actualizar métricas
```bash
COMMIT_COUNT=$(git rev-list --count HEAD)
echo "📊 Total commits: $COMMIT_COUNT"
echo "$(date +%Y-%m-%d\ %H:%M:%S) - Commit: $(git rev-parse HEAD)" >> .claude/metrics/commits.log
```

### 2. Verificar si hay cambios en manifest.json
```bash
if git diff-tree --no-commit-id --name-only -r HEAD | grep -q "manifest.json"; then
  echo "⚠️ manifest.json modificado. Recuerda actualizar la versión en Chrome Web Store."
fi
```

### 3. Verificar si hay cambios en package.json
```bash
if git diff-tree --no-commit-id --name-only -r HEAD | grep -q "package.json"; then
  echo "📦 package.json modificado. Considera actualizar dependencias."
fi
```

### 4. Sugerir push si estamos en main
```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "💡 Tip: Ejecuta 'git push' para subir los cambios."
fi
```