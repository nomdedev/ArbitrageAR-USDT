# MEMORY.md - Memoria Persistente del Proyecto

> Este archivo contiene información importante que debe recordarse entre sesiones.

## Proyecto: ArbitrageAR-USDT

### Información General
- **Tipo**: Extensión Chrome Manifest V3
- **Versión**: 6.0.0
- **Propósito**: Detectar oportunidades de arbitraje entre dólar oficial argentino y USDT

### Arquitectura Principal
```
src/
├── background/     # Service Worker
├── modules/        # Módulos especializados
├── ui/             # Interfaz usuario
├── ui-components/  # Componentes reutilizables
└── utils/          # Utilidades
```

### APIs Externas
- **DolarAPI**: `https://dolarapi.com/v1/dolares/oficial`
- **CriptoYa USDT**: `https://criptoya.com/api/usdt/ars/1`
- **CriptoYa Banks**: `https://criptoya.com/api/bancostodos`

### Patrones de Diseño Usados
1. Module Pattern (IIFE)
2. Observer Pattern (eventos)
3. Factory Pattern (UI components)
4. Strategy Pattern (cálculos)

### Comandos Importantes
```bash
npm run test          # Tests unitarios
npm run test:e2e      # Tests E2E
npm run lint:fix      # Corregir linting
npm run build:prod    # Build producción
npm run validate      # Validación completa
```

### Reglas de Commits
- Usar español
- Formato: `tipo: descripción`
- Tipos: feat, fix, refactor, test, docs, style, chore

### Preferencias del Usuario
- Comunicación en español
- Tests antes de commits
- Validación automática de código

### Notas Técnicas
- Service Worker puede terminar, usar storage para persistencia
- Return true en async message handlers
- Width máximo popup: 350px
- Rate limiting APIs: 600ms mínimo entre requests

---

## Historial de Sesiones

### 2026-03-31
- Creada configuración completa .claude/
- 9 skills especializados creados
- 4 hooks configurados
- 7 comandos personalizados

---

## Archivos Clave
| Archivo | Propósito |
|---------|-----------|
| `src/background/main-simple.js` | Service Worker principal |
| `src/popup.js` | UI principal |
| `src/background/arbitrageCalculator.js` | Motor de cálculo |
| `manifest.json` | Configuración extensión |