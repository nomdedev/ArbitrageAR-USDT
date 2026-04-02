# Architecture Auditor Skill

## Responsabilidad
Auditar la arquitectura general del proyecto y su organización.

## Archivos Bajo Auditoría
- Estructura de directorios completa
- `manifest.json`
- `package.json`
- Todos los archivos de configuración

## Checklist de Auditoría

### 1. Estructura de Directorios
- [ ] Verificar separación de responsabilidades
- [ ] Comprobar organización por funcionalidad
- [ ] Validar naming de archivos
- [ ] Revisar profundidad de anidación

### 2. Manifest V3
- [ ] Verificar manifest.json válido
- [ ] Comprobar permisos mínimos
- [ ] Validar CSP
- [ ] Revisar host_permissions

### 3. Dependencias
- [ ] Verificar package.json
- [ ] Comprobar dependencias necesarias
- [ ] Validar devDependencies
- [ ] Revisar scripts npm

### 4. Configuración
- [ ] Verificar eslint config
- [ ] Comprobar prettier config
- [ ] Validar jest config
- [ ] Revisar playwright config

### 5. Patrones de Diseño
- [ ] Verificar consistencia de patrones
- [ ] Comprobar separación de capas
- [ ] Validar inyección de dependencias
- [ ] Revisar manejo de estado

## Estructura Esperada

```
ArbitrageAR-USDT/
├── manifest.json
├── package.json
├── src/
│   ├── background/     # Service Worker
│   ├── modules/        # Módulos especializados
│   ├── ui/             # Interfaz usuario
│   ├── ui-components/  # Componentes reutilizables
│   └── utils/          # Utilidades
├── tests/
├── docs/
└── icons/
```

## Métricas de Arquitectura

| Métrica | Objetivo |
|---------|----------|
| Profundidad máxima directorios | 3 |
| Archivos por directorio | < 15 |
| Líneas por archivo | < 500 |
| Dependencias circulares | 0 |

## Output de Auditoría
```
📊 AUDITORÍA ARQUITECTURA
========================
✅/⚠️ Estructura de directorios correcta
✅/⚠️ Manifest V3 válido
✅/⚠️ Permisos mínimos
✅/⚠️ Sin dependencias circulares
✅/⚠️ Patrones consistentes
```