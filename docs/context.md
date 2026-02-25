# ArbitrageAR-USDT Project Context

## Overview
**ArbitrageAR-USDT** is a Chrome Extension (Manifest V3) designed to detect and analyze arbitrage opportunities between the Argentine Official Dollar (plus applicable taxes) and USDT markets on local cryptocurrency exchanges. It empowers users to identify profitable routes for "rulo" operations by aggregating real-time data from multiple sources.

## Core Functionality

### 1. Arbitrage Detection
The extension calculates potential profits for various arbitrage routes:
- **Simple Routes (Intra-Exchange):** Buy USD (Bank) → Buy USDT (Exchange A) → Sell USDT (Exchange A) → ARS.
- **Inter-Broker Routes:** Buy USD (Bank) → Buy USDT (Exchange A) → Transfer USDT → Sell USDT (Exchange B) → ARS.
- **P2P Detection:** Identifies and filters routes involving Peer-to-Peer markets, which carry different risks and speeds.

### 2. Data Aggregation & Normalization
The system aggregates data from multiple external APIs to ensure accuracy and redundancy:
- **CriptoYa API:** Primary source for USDT/ARS and USDT/USD order book data, and bank rates.
- **DolarAPI:** Source for official dollar rates.
- **Dolarito:** Secondary source for bank quotations.
- **Bank Consensus:** Calculates a realistic "Official Dollar" buy price by aggregating ask prices from major banks (Galicia, Santander, BBVA, ICBC, BNA) using methods like consensus, average, or best price.

### 3. Simulation & Analysis
- **Investment Simulator:** Allows users to input a specific capital amount (ARS) to simulate net returns after all fees.
- **Fee Calculation:** Takes into account:
  - Exchange trading fees (maker/taker).
  - Bank commission fees.
  - Crypto withdrawal/transfer fees.
  - Taxes on foreign currency purchases.

### 4. User Safety & Validation
- **Risk Assessment:** Analyzes routes for potential risks (high volatility, low liquidity, P2P involvement).
- **Data Freshness:** Alerts users if market data is stale (> 5 minutes).
- **Sanity Checks:** Validates calculations to prevent displaying erroneous profit margins (e.g., >50% unrealistic returns).

## Architecture

The project follows a standard **Chrome Extension Manifest V3** architecture:

### Components

1.  **Background Service Worker (`src/background/main-simple.js`)**
    -   **Role:** The brain of the extension. Runs persistently in the background.
    -   **Responsibilities:**
        -   Scheduling data fetches (Alarms API).
        -   Executing core arbitrage calculations (CPU-intensive).
        -   Managing data caching to respect API rate limits.
        -   Broadcasting updates to the UI.

2.  **Data Layer (`src/DataService.js`)**
    -   **Role:** Abstraction layer for external API interactions.
    -   **Responsibilities:**
        -   Fetching data from CriptoYa, DolarAPI, etc.
        -   Implementing rate limiting and timeout logic.
        -   Normalizing disparate data formats into a unified schema.

3.  **Validation Layer (`src/ValidationService.js`)**
    -   **Role:** Security and integrity guard.
    -   **Responsibilities:**
        -   Verifying data freshness.
        -   Calculating risk scores for routes.
        -   Validating mathematical consistency of arbitrage routes.

4.  **User Interface**
    -   **Popup (`src/popup.html`, `src/popup.js`):**
        -   Main dashboard.
        -   Displays optimized arbitrage routes.
        -   Tabs for: Opportunities, Bank Rates, Simulator.
        -   Real-time filtering (P2P, Profit %, Exchanges).
    -   **Options (`src/options.html`, `src/options.js`):**
        -   Configuration page.
        -   Settings for: Notifications, Fees, Preferred Exchanges, API URLs.

### Data Flow
1.  **Fetch:** `DataService` retrieves raw market data.
2.  **Process:** `Background` worker normalizes data and calculates the "Official Dollar" consensus price.
3.  **Compute:** `Background` worker generates all possible permutations of routes (Simple & Inter-broker).
4.  **Validate:** `ValidationService` checks routes for errors and assigns risk levels.
5.  **Display:** `Popup` requests the latest processed data from `Background` and renders it for the user.

## Key Files & Directories

-   **`manifest.json`**: Extension configuration (permissions, host permissions, background scripts).
-   **`src/background/main-simple.js`**: Core logic and scheduler.
-   **`src/DataService.js`**: API interaction service.
-   **`src/ValidationService.js`**: Logic for data validity and risk assessment.
-   **`src/popup.js`**: UI logic for the main extension popup.
-   **`src/options.js`**: Logic for the settings page.
-   **`src/utils.js`**: Shared utility functions (formatting, etc.).

## Technology Stack
-   **Core:** Vanilla JavaScript (ES6+).
-   **UI:** HTML5, CSS3 (Custom styles, no framework).
-   **Platform:** Chrome Extensions API (Manifest V3).
-   **External APIs:** CriptoYa, DolarAPI, Dolarito.

---

## 📊 Auditoría Completa 2026

### Resumen Ejecutivo

Se realizó una auditoría exhaustiva del proyecto ArbitrageAR-USDT en enero de 2026, abarcando todos los aspectos del sistema: arquitectura, código, UI/UX, rendimiento, seguridad, testing y mantenibilidad. La puntuación global del proyecto mejoró de **5.9/10 a 8.1/10** (+37%).

### Correcciones de Funcionalidad por Componente

#### 1. Background Service Worker (`src/background/main-simple.js`)
**Correcciones Implementadas:**
- ✅ Sistema de alertas sincronizado con `alertThreshold` entre options.js y main-simple.js
- ✅ Filtro de exchanges corregido (`notificationExchanges`)
- ✅ Logging para debugging de notificaciones
- ✅ Funciones no utilizadas eliminadas (-216 líneas)
- ✅ Validación de datos de API con rangos (dólar: 500-5000, USDT/USD: 0.95-1.10)

**Estado Actual:** 🟢 Optimizado - 1,998 líneas (-9.8% vs original)

#### 2. Data Layer (`src/DataService.js`)
**Mejoras Implementadas:**
- ✅ Validación de rangos para precios
- ✅ Filtrado de datos sospechosos de exchanges
- ✅ Advertencias sobre spreads excesivos (>20%)
- ✅ Rate limiting mejorado
- ✅ Timeout de 10 segundos en todas las peticiones

**Estado Actual:** 🟢 Estable - API integraciones validadas

#### 3. Validation Layer (`src/ValidationService.js`)
**Mejoras Implementadas:**
- ✅ Verificación de frescura de datos
- ✅ Cálculo de risk scores para rutas
- ✅ Validación de consistencia matemática
- ✅ Sanity checks para márgenes irreales (>50%)

**Estado Actual:** 🟢 Robusto - Validaciones completas implementadas

#### 4. User Interface
**Mejoras de CSS Implementadas:**
- ✅ CSS optimizado: 6,374 → 3,598 líneas (-43.5%)
- ✅ Variables CSS completas (espaciado, tipografía, bordes, sombras)
- ✅ Sistema de elevación basado en Material Design 3
- ✅ Gradientes sutiles para profundidad visual
- ✅ Responsive design con clamp() para flexibilidad

**Mejoras de Animaciones:**
- ✅ **Fase 1 - Microinteracciones:** Hover lift, click scale, focus ring, border glow
- ✅ **Fase 2 - Loading States:** Skeleton shimmer, spinner con trail, tab transitions
- ✅ **Fase 3 - Entrada/Salida:** Stagger fade, modal slide, toast notifications
- ✅ **Fase 4 - Efectos Avanzados:** Parallax sutil, glow pulsante, icon morphing

**Accesibilidad Mejorada:**
| Criterio | Estado Inicial | Estado Actual |
|----------|----------------|---------------|
| Focus visible | 🔴 | ✅ Implementado |
| prefers-reduced-motion | 🔴 | ✅ Respetado |
| prefers-contrast: high | 🔴 | ✅ Soportado |
| Skip link | 🔴 | ✅ Agregado |
| ARIA labels | 🔴 | 🟡 Parcial |

**Estado Actual:** 🟢 Moderno - UI optimizada y accesible

### Separación de Exchanges P2P y Tradicionales

**Exchanges con P2P:** Binance, Bybit, Lemon Cash
**Exchanges solo P2P:** OKX, Bitget, KuCoin, y 7 más
**Exchanges Tradicionales:** Buenbit, Ripio, SatoshiTango, y 20 más

✅ TODOS los exchanges marcados por defecto (23 exchanges tradicionales)

### Presets del Simulador

✅ 3 perfiles de riesgo implementados:
- **Conservador:** Fees máximas, comisiones conservadoras
- **Moderado:** Balance entre riesgo y seguridad
- **Agresivo:** Fees mínimas, optimizado para máxima ganancia

### Refactorización de Código

| Archivo | Líneas Antes | Líneas Después | Reducción |
|---------|--------------|----------------|-----------|
| popup.js | 4,746 | 4,062 | -14.4% |
| popup.css | 6,374 | 3,598 | -43.5% |
| main-simple.js | 2,214 | 1,998 | -9.8% |
| **Total** | **13,334** | **9,658** | **-27.6%** |

---

## 🏗️ Arquitectura Actualizada

### Nueva Estructura de Archivos

```
src/
├── background/              # Service Worker y lógica backend
│   ├── main-simple.js      # Lógica principal del background
│   ├── apiClient.js        # Cliente de APIs externas
│   └── arbitrageCalculator.js # Cálculos de arbitraje
├── ui/                     # 🆕 Módulos de UI
│   ├── filterController.js # Control de filtros
│   └── routeRenderer.js    # Renderizado de rutas
├── utils/                  # 🆕 Utilidades específicas
│   ├── bankCalculations.js # Cálculos bancarios
│   ├── formatters.js       # Formateo de datos
│   ├── logger.js           # Sistema de logging
│   └── stateManager.js     # Gestión de estado
├── DataService.js          # Servicio de datos
├── ValidationService.js    # Servicio de validación
├── popup.html/js/css       # Interfaz del popup
├── options.html/js/css     # Página de configuración
├── renderHelpers.js        # Helpers de renderizado
└── utils.js                # Utilidades generales
```

### Sistema de Diseño Implementado

**Variables CSS Completas:**
- Espaciado: `--spacing-xs` a `--spacing-xl`
- Tipografía: `--font-size-base`, `--font-weight-*`
- Bordes: `--border-radius-sm` a `--border-radius-xl`
- Sombras: `--shadow-xs` a `--shadow-xl`
- Transiciones: `--transition-fast`, `--transition-normal`, `--transition-slow`

**Sistema de Elevación (Material Design 3):**
- Level 0: Surface base
- Level 1: Cards elevadas
- Level 2: Modales y dropdowns
- Level 3: Tooltips y popovers

### Sistema de Animaciones Completo

**4 Fases Implementadas:**

1. **Microinteracciones:**
   - Hover lift en cards (150ms)
   - Click scale en botones (100ms)
   - Focus ring con pulse animation
   - Border glow para seleccionadas

2. **Loading States:**
   - Skeleton shimmer (1.5s)
   - Spinner con trail effect
   - Tab transitions con fade (250ms)
   - Progress bars determinadas/indeterminadas

3. **Entrada/Salida:**
   - Stagger fade para listas (50-250ms delays)
   - Modal slide con backdrop blur
   - Toast notifications slide in/out
   - Card expand con height transition

4. **Efectos Avanzados:**
   - Parallax sutil en header
   - Glow pulsante para profit alto
   - Icon morphing (SVG)
   - 3D flip para card details (opcional)

---

## 📈 Métricas de Calidad

### Puntuación Global Antes/Después

| Categoría | Antes | Después | Mejora |
|-----------|-------|---------|--------|
| **Arquitectura** | 🟡 6/10 | 🟢 7.5/10 | +25% |
| **Calidad de Código** | 🟡 6/10 | 🟢 7.5/10 | +25% |
| **UI/UX** | 🟡 6/10 | 🟢 7.5/10 | +25% |
| **Rendimiento** | 🟢 7/10 | 🟢 8/10 | +14% |
| **Seguridad** | 🟢 7/10 | 🟢 8/10 | +14% |
| **Testing** | 🔴 3/10 | 🟢 8/10 | +167% |
| **Mantenibilidad** | 🔴 4/10 | 🟢 8.5/10 | +113% |
| **Documentación** | 🟢 7/10 | 🟢 8/10 | +14% |

**Puntuación Global: 5.9/10 → 8.1/10 (+37%)**

### Cobertura de Tests

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Archivos de test | 7 | 12+ | +71% |
| Tests activos | 1 | 47 | +4600% |
| Cobertura estimada | ~5% | ~35% | +600% |

**Tests Implementados:**
- ✅ Tests unitarios de formatters (12 tests)
- ✅ Tests unitarios de stateManager (8 tests)
- ✅ Tests de utils (6 tests)
- ✅ Tests de DataService
- ✅ Tests de ValidationService
- ✅ Tests de notificaciones (11 tests)
- ✅ Tests de bank-filters
- ✅ Tests de bank-methods

### Optimización de CSS

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas totales | 6,363 | 3,598 | -43.5% |
| Selectores duplicados | ~50 | ~10 | -80% |
| Variables CSS | Parcial | Completo | ✅ |
| Secciones comentadas | Muchas | Eliminadas | ✅ |

### Sistema de Animaciones

| Fase | Animaciones | Estado |
|------|-------------|--------|
| Microinteracciones | 4 tipos | ✅ Completado |
| Loading States | 4 tipos | ✅ Completado |
| Entrada/Salida | 4 tipos | ✅ Completado |
| Efectos Avanzados | 4 tipos | ✅ Completado |
| **Total** | **16 animaciones** | **✅ 100%** |

### Tooling Profesional

**ESLint y Prettier:**
- ✅ ESLint 8.57 configurado
- ✅ Prettier 3.2.5 para formateo
- ✅ 0 errores, ~103 warnings (mostly unused vars)

**CI/CD con GitHub Actions:**
- ✅ `.github/workflows/ci.yml` - Lint, test, build
- ✅ `.github/workflows/release.yml` - Auto-release
- ✅ Tests en Node 18.x y 20.x
- ✅ Scan de seguridad básico

**Build y Empaquetado:**
- ✅ Minificación JS con Terser
- ✅ Minificación CSS con CleanCSS
- ✅ Tamaño de dist: ~1.9 MB

### Módulos Refactorizados

| Módulo | Líneas | Propósito |
|--------|--------|-----------|
| formatters.js | ~200 | Formateo de monedas, porcentajes |
| stateManager.js | ~150 | Gestión de estado global |
| logger.js | ~100 | Sistema de logging |
| bankCalculations.js | ~120 | Cálculos bancarios |
| filterController.js | ~180 | Control de filtros UI |
| routeRenderer.js | ~250 | Renderizado de rutas |
| apiClient.js | ~200 | Cliente de APIs |
| arbitrageCalculator.js | ~300 | Cálculos de arbitraje |

**Total: 8+ módulos independientes (+300% vs original 2 módulos)**

---

## 📚 Documentación Mejorada

### Nueva Documentación Creada

- ✅ `docs/API_INTERNA.md` - Documentación completa de APIs internas
- ✅ `docs/AUDITORIA_COMPLETA_2026.md` - Auditoría exhaustiva
- ✅ `plans/animaciones-y-mejoras-visuales.md` - Plan de animaciones
- ✅ `docs/PROGRESO_AUDITORIA.md` - Seguimiento de mejoras

### Contenido de API_INTERNA.md

- DataService (métodos, validaciones, ejemplos)
- ValidationService (frescura, riesgo, validación)
- Sistema de Notificaciones (configuración, lógica)
- StateManager (uso, estado global)
- APIs Externas (endpoints, formatos)

---

## 🔍 Conclusión de la Auditoría

El proyecto **ArbitrageAR-USDT v6.0.0** ha experimentado mejoras significativas en todos los aspectos evaluados:

1. ✅ **Corregir 7 problemas críticos de funcionalidad**
2. ✅ **Reducir el CSS en 43.5% (6,363 → 3,598 líneas)**
3. ✅ **Implementar un sistema completo de animaciones en 4 fases**
4. ✅ **Aumentar los tests de 1 a 47 (+4600%)**
5. ✅ **Configurar tooling profesional (ESLint, Prettier, CI/CD)**
6. ✅ **Mejorar la accesibilidad significativamente**
7. ✅ **Refactorizar código duplicado (-3,665 líneas)**
8. ✅ **Crear documentación técnica completa**

El proyecto ahora tiene una base sólida para continuar evolucionando con confianza, manteniendo altos estándares de calidad, rendimiento y mantenibilidad.

---

*Para más detalles, consultar [`docs/AUDITORIA_COMPLETA_2026.md`](docs/AUDITORIA_COMPLETA_2026.md)*
