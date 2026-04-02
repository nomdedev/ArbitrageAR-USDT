---
hookName: pre-edit
description: Hook que se ejecuta antes de cada edición de archivo
triggers: [Edit, Write]
---

# Pre-Edit Hook

## Validaciones antes de editar

### 1. Verificar que el archivo existe (para Edit)
```bash
if [ -f "$FILE_PATH" ]; then
  echo "✅ Archivo existe: $FILE_PATH"
else
  echo "⚠️ Archivo nuevo: $FILE_PATH"
fi
```

### 2. Verificar sintaxis JS (para archivos .js)
```bash
if [[ "$FILE_PATH" == *.js ]]; then
  node -c "$FILE_PATH" 2>&1 || echo "❌ Error de sintaxis"
fi
```

### 3. Backup automático
```bash
BACKUP_DIR=".claude/backups"
mkdir -p "$BACKUP_DIR"
cp "$FILE_PATH" "$BACKUP_DIR/$(basename $FILE_PATH).$(date +%Y%m%d_%H%M%S).bak"
```

### 4. Verificar permisos de escritura
```bash
if [ -w "$FILE_PATH" ]; then
  echo "✅ Permisos de escritura OK"
else
  echo "❌ Sin permisos de escritura"
  exit 1
fi
```