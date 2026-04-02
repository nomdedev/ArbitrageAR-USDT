# ArbitrageAR-USDT - Configuration for Claude Code

## Project Overview

**ArbitrageAR-USDT** es una extensión de navegador Chromium (Chrome/Edge/Brave) basada en Manifest V3 que detecta oportunidades de arbitraje entre el Dólar Oficial argentino y USDT en exchanges locales de criptomonedas.

### Ruta de Arbitraje
```
ARS → USD (Banco oficial) → USDT → ARS (Exchange)
```

---

## Project Structure

```
ArbitrageAR-USDT/
├── manifest.json              # Configuración Manifest V3
├── package.json               # Dependencias npm
├── src/
│   ├── background/           # Service Worker
│   │   ├── main-simple.js    # Background principal
│   │   ├── apiClient.js      # Cliente de APIs
│   │   ├── arbitrageCalculator.js  # Motor de cálculo
│   │   └── cacheManager.js   # Cache de datos
│   ├── modules/              # Módulos especializados
│   │   ├── filterManager.js  # Gestor de filtros
│   │   ├── modalManager.js   # Gestor de modales
│   │   ├── notificationManager.js # Sistema de alertas
│   │   ├── routeManager.js   # Gestor de rutas
│   │   └── simulator.js      # Calculadora
│   ├── ui/                   # Interfaz de usuario
│   │   ├── popup.js          # Controlador principal
│   │   ├── routeRenderer.js  # Renderizador de rutas
│   │   └── filterController.js # Control de filtros
│   ├── ui-components/        # Componentes reutilizables
│   ├── utils/                # Utilidades
│   │   ├── stateManager.js   # Estado global
│   │   ├── formatters.js     # Formateo de datos
│   │   └── logger.js         # Sistema de logs
│   ├── popup.html            # UI principal
│   ├── popup.css             # Estilos popup
│   ├── options.html          # UI de configuración
│   └── options.js            # Lógica de opciones
├── tests/                    # Tests (Jest + Playwright)
├── docs/                     # Documentación completa
├── icons/                    # Iconos de la extensión
└── scripts/                  # Scripts de build
```

---

## Key Technical Details

### APIs Externas
- **DolarAPI**: `https://dolarapi.com/v1/dolares/oficial` - Dólar oficial
- **CriptoYa USDT/ARS**: `https://criptoya.com/api/usdt/ars/1` - Precios USDT
- **CriptoYa Banks**: `https://criptoya.com/api/bancostodos` - Bancos argentinos

### Patrón de Comunicación
```javascript
// Popup → Background
chrome.runtime.sendMessage({ action: 'getData' }, (response) => { ... });

// Background escucha
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getData') {
    sendResponse(currentData);
  }
});
```

### Sistema de Estado
- **StateManager**: Gestión centralizada de estado
- **Chrome Storage API**: Persistencia de configuración
- **Cache Manager**: Cache de datos con TTL

### Patrones de Diseño Usados
1. **Module Pattern**: Módulos encapsulados (IIFE)
2. **Observer Pattern**: Eventos y listeners
3. **Factory Pattern**: Creación de componentes UI
4. **Strategy Pattern**: Algoritmos de cálculo intercambiables

---

## Development Guidelines

### Commits
- Usar **ESPAÑOL** para todos los mensajes
- Formato: `tipo: descripción breve`
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`
- Ejemplo: `fix: corregir cálculo de fees en arbitrageCalculator`

### Testing
- **Jest** para tests unitarios: `npm run test`
- **Playwright** para tests E2E: `npm run test:e2e`
- Coverage: `npm run test:coverage`

### Linting & Formatting
- ESLint: `npm run lint`
- Prettier: `npm run format`
- Validación completa: `npm run validate`

---

## Extension Architecture

### Service Worker (main-simple.js)
- Obtiene datos de APIs externas
- Calcula rutas de arbitraje
- Gestiona cache en memoria
- Responde a mensajes del popup
- Ejecuta actualizaciones automáticas (alarms)

### Popup (popup.js)
- Renderiza UI de rutas
- Aplica filtros del usuario
- Muestra detalles en modales
- Gestiona simulaciones
- Maneja interacciones

### Options (options.js)
- Configuración persistente
- Validación de inputs
- Sincronización con popup

---

## Common Commands

### Build & Package
```bash
npm run build          # Build desarrollo
npm run build:prod     # Build producción
npm run package        # Crear ZIP para Chrome Store
```

### Development
```bash
npm run lint:fix       # Corregir errores de linting
npm run format         # Formatear código
npm run validate       # Validación completa
```

### Testing
```bash
npm run test           # Tests unitarios
npm run test:watch     # Tests en modo watch
npm run test:e2e       # Tests E2E
```

---

## Security Considerations

### CSP (Content Security Policy)
```json
{
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
}
```

### Permisos mínimos
- `storage`: Persistencia de datos
- `alarms`: Actualizaciones automáticas
- `notifications`: Alertas de oportunidades
- `activeTab`: Interacción con tabs activos

### Host Permissions
- Solo dominios de APIs: `dolarapi.com`, `criptoya.com`, `dolarito.ar`

---

## Important Files

### Core Files to Know
| File | Purpose |
|------|---------|
| `src/background/main-simple.js` | Service Worker principal |
| `src/background/arbitrageCalculator.js` | Motor de cálculo |
| `src/background/apiClient.js` | Cliente de APIs |
| `src/popup.js` | UI principal |
| `src/modules/filterManager.js` | Sistema de filtros |
| `src/utils/stateManager.js` | Estado global |
| `manifest.json` | Configuración extensión |

### Documentation
| File | Content |
|------|---------|
| `docs/ARQUITECTURA_PROYECTO.md` | Arquitectura general |
| `docs/ARQUITECTURA_TECNICA.md` | Detalles técnicos |
| `docs/COMO_FUNCIONA_TODO.md` | Flujo completo |
| `docs/BUENAS_PRACTICAS_Y_PATRONES.md` | Patrones de diseño |
| `docs/SEGURIDAD_Y_VULNERABILIDADES.md` | Seguridad |
| `docs/TESTING_INSTRUCTIONS.md` | Testing |

---

## Extension Version
- **Version**: 6.0.0
- **Manifest Version**: 3
- **Target Browsers**: Chrome >= 88, Edge >= 88, Brave

---

## Notes for Development

1. **Siempre usar async/await** para operaciones con Chrome APIs
2. **Validar datos** antes de procesar (inputs de APIs)
3. **Evitar innerHTML** sin sanitización (seguridad XSS)
4. **Rate limiting** para APIs (evitar baneos)
5. **Timeouts** configurados (12s default)
6. **Logs estructurados** con prefijos: `[POPUP]`, `[BG]`, `[API]`

---

## Configuration Summary

Este archivo configura Claude Code para:
- Entender la arquitectura de extensión Chromium
- Seguir patrones de diseño específicos del proyecto
- Usar español para commits y comunicación
- Conocer APIs externas y estructura de datos
- Aplicar medidas de seguridad relevantes
- Ejecutar tests y validaciones apropiadas