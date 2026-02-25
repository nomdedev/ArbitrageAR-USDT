# 📁 PLAN DE REORGANIZACIÓN DE ARCHIVOS

**Fecha:** 25 de Febrero de 2026  
**Propósito:** Organizar archivos que están en la raíz inapropiadamente

---

## 🎯 ARCHIVOS A MOVER

### 1. Scripts y Herramientas → `scripts/`

**Archivos que deben moverse a `scripts/`:**

```bash
# Scripts de diagnóstico y reparación
check-api-data.js
diagnose_bytes.py
fix_escaped_route.ps1
fix_escaped_route.py
fix_route_v2.py
fix_route_v3.py
temp_fix.ps1
```

**Comando para mover:**
```bash
mkdir -p scripts
mv check-api-data.js scripts/
mv diagnose_bytes.py scripts/
mv fix_escaped_route.ps1 scripts/
mv fix_escaped_route.py scripts/
mv fix_route_v2.py scripts/
mv fix_route_v3.py scripts/
mv temp_fix.ps1 scripts/
```

### 2. Documentación → `docs/`

**Archivos que deben moverse a `docs/`:**

```bash
# Documentación creada recientemente
context.md
COMO_FUNCIONA_TODO.md
FLUJO_COMPLETO_VISUAL.md
RESUMEN_COMPLETO_ARBITRAJEAR.md
```

**Comando para mover:**
```bash
mv context.md docs/
mv COMO_FUNCIONA_TODO.md docs/
mv FLUJO_COMPLETO_VISUAL.md docs/
mv RESUMEN_COMPLETO_ARBITRAJEAR.md docs/
```

---

## 📁 ESTRUCTURA IDEAL DESPUÉS DE LA REORGANIZACIÓN

```
ArbitrageAR-USDT/
├── 📄 Archivos de Configuración (raíz)
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── .prettierignore
│   ├── .prettierrc
│   ├── jest.config.js
│   ├── LICENSE
│   ├── manifest.json
│   ├── package.json
│   ├── package-lock.json
│   ├── playwright.config.js
│   └── README.md
│
├── 📁 scripts/ (herramientas y diagnóstico)
│   ├── check-api-data.js
│   ├── diagnose_bytes.py
│   ├── fix_escaped_route.ps1
│   ├── fix_escaped_route.py
│   ├── fix_route_v2.py
│   ├── fix_route_v3.py
│   ├── temp_fix.ps1
│   └── ... (otros scripts existentes)
│
├── 📁 docs/ (toda la documentación)
│   ├── context.md
│   ├── COMO_FUNCIONA_TODO.md
│   ├── FLUJO_COMPLETO_VISUAL.md
│   ├── RESUMEN_COMPLETO_ARBITRAJEAR.md
│   └── ... (otros archivos existentes)
│
├── 📁 src/ (código fuente)
│   ├── background/
│   ├── modules/
│   ├── ui/
│   ├── ui-components/
│   ├── utils/
│   └── ...
│
├── 📁 tests/ (pruebas)
│   └── ...
│
└── 📁 [otras carpetas existentes]
    ├── icons/
    ├── screenshots/
    ├── test-results/
    └── ...
```

---

## ✅ BENEFICIOS DE LA REORGANIZACIÓN

### 1. **Claridad**
- Separación clara entre código, configuración, herramientas y documentación
- Más fácil encontrar archivos específicos

### 2. **Mantenimiento**
- Scripts de diagnóstico agrupados y accesibles
- Documentación centralizada

### 3. **Buenas Prácticas**
- Estructura de proyecto estándar
- Más fácil para nuevos desarrolladores

### 4. **Limpieza**
- Raíz solo con archivos esenciales del proyecto
- Menos desorden visual

---

## 🔧 PASOS PARA EJECUTAR LA REORGANIZACIÓN

### Paso 1: Backup (importante)
```bash
# Crear backup antes de mover
git add .
git commit -m "Backup antes de reorganización"
git tag pre-reorganization
```

### Paso 2: Mover scripts
```bash
# Crear carpeta si no existe
mkdir -p scripts

# Mover archivos de script
mv check-api-data.js scripts/
mv diagnose_bytes.py scripts/
mv fix_escaped_route.ps1 scripts/
mv fix_escaped_route.py scripts/
mv fix_route_v2.py scripts/
mv fix_route_v3.py scripts/
mv temp_fix.ps1 scripts/
```

### Paso 3: Mover documentación
```bash
# Mover archivos de documentación
mv context.md docs/
mv COMO_FUNCIONA_TODO.md docs/
mv FLUJO_COMPLETO_VISUAL.md docs/
mv RESUMEN_COMPLETO_ARBITRAJEAR.md docs/
```

### Paso 4: Actualizar referencias
**Archivos que podrían necesitar actualización de rutas:**
- `package.json` (si hay scripts que referencian estos archivos)
- `README.md` (si hay links a los archivos movidos)
- Cualquier script que importe estos archivos

### Paso 5: Verificar
```bash
# Verificar que todo funcione después del movimiento
npm test
npm run build
# Verificar que la extensión cargue correctamente
```

### Paso 6: Commit final
```bash
git add .
git commit -m "Reorganizar archivos: mover scripts y documentación a carpetas apropiadas"
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Scripts movidos a `scripts/`
- [ ] Documentación movida a `docs/`
- [ ] Raíz limpia (solo archivos esenciales)
- [ ] Tests pasan después del movimiento
- [ ] Extensión funciona correctamente
- [ ] No hay referencias rotas
- [ ] Git commit descriptivo

---

## 🎯 RECOMENDACIONES ADICIONALES

### 1. **Script de automatización**
Crear un script `scripts/reorganize.js` que automatice este proceso.

### 2. **.gitignore mejorado**
Asegurar que `scripts/` y `docs/` tengan el tratamiento correcto en `.gitignore`.

### 3. **Documentación de estructura**
Actualizar `README.md` para reflejar la nueva estructura del proyecto.

### 4. **Linting**
Configurar ESLint para que prevenga futuros archivos en lugares incorrectos.

---

**Esta reorganización mejorará significativamente la mantenibilidad y claridad del proyecto.**