# ANEXO A — Mapa de arquitectura real (verificado en código)

Generado: 2026-09-19 · Commit `5fdfa9e` · Evidencia: lectura directa de los archivos citados.

Este anexo es la base de los diagramas archify y el punto de partida para verificar
cualquier afirmación de los agentes auditores.

## 1. Naturaleza del proyecto

Extensión Chromium **Manifest V3**, sin bundler, sin módulos ES, sin framework.
Tres contextos de ejecución separados y aislados entre sí:

| Contexto | Archivo(s) | Entrada declarada en manifest |
|---|---|---|
| Service Worker (background) | `src/background/main-simple.js` + `importScripts()` | `background.service_worker` |
| Popup (página de extensión) | `src/popup.html` + 18 `<script src>` | `action.default_popup` |
| Options (página de extensión) | `src/options.html` + 2 `<script src>` | `options_page` |

Consecuencia estructural: **los tres contextos no comparten memoria**. Toda comunicación es
por `chrome.runtime.sendMessage`, `chrome.storage.*` o `chrome.runtime.onMessage`. Cualquier
variable global existe por separado en cada contexto.

## 2. Superficie global exportada por cada archivo (extraída del código)

Los módulos no usan `export`; se comunican por globales asignadas en tiempo de carga.

| Archivo | Globales que define |
|---|---|
| `src/utils/logger.js` | `Logger`, `LogLevel`, `__ARBITRAGE_DEBUG__` |
| `src/utils/formatters.js` | `Formatters` |
| `src/utils/stateManager.js` | `StateManager` |
| `src/utils/commonUtils.js` | `CommonUtils`, `__ARBITRAGE_DEBUG__` |
| `src/ValidationService.js` | `ValidationService`, `validationService` |
| `src/DataService.js` | `__ARBITRAGE_DEBUG__` (clase interna, instancia en el SW) |
| `src/renderHelpers.js` | (funciones sueltas, sin objeto global) |
| `src/ui/routeRenderer.js` | `RouteRenderer`, `fetchAndDisplay` |
| `src/ui/tooltipSystem.js` | `TooltipSystem`, `getTooltipSystem`, `showTooltip`, `hideTooltip`, `initTooltips` |
| `src/ui/filterController.js` | `FilterController` — **no se carga desde ningún HTML (código no usado)** |
| `src/ui-components/animations.js` | `AnimationController`, `AnimationUtils`, `initAnimations` |
| `src/ui-components/arbitrage-panel.js` | `ArbitragePanel`, `createArbitragePanel`, `initArbitragePanels`, `sanitizeHTML` |
| `src/ui-components/tabs.js` | `TabSystem`, `createTabSystem`, `initTabSystems` |
| `src/modules/filterManager.js` | `FilterManager` |
| `src/modules/routeManager.js` | `RouteManager`, `initMagneticButtons` |
| `src/modules/modalManager.js` | `ModalManager` |
| `src/modules/notificationManager.js` | `NotificationManager` |
| `src/modules/simulator.js` | `Simulator` |
| `src/popup.js` | `PopupLegacyApi`, `SIMULATOR_PRESETS`, `currentBanksData` + **reasigna** `CommonUtils`, `FilterManager`, `Formatters`, `Logger`, `ModalManager`, `NotificationManager`, `RouteManager`, `Simulator`, `StateManager` |
| `src/options.js` | `DEFAULT_SETTINGS`, `__ARBITRAGE_DEBUG__` |
| `src/background/main-simple.js` | `MESSAGE_HANDLERS`, `BANK_CALCULATIONS`, `__ARBITRAGE_DEBUG__` |

Nota: que `popup.js` reasigne las mismas globales que ya definen los módulos es una señal de
acoplamiento a revisar (¿es defensivo o es una segunda definición que puede pisar la primera?).

## 3. API de mensajería del service worker (verificada)

`chrome.runtime.onMessage.addListener` en `src/background/main-simple.js:2221`, con
validación de origen en `:2223` (`sender.id !== chrome.runtime.id` → rechaza).

Tabla de ruteo `MESSAGE_HANDLERS` (`:2210`), resuelta por `request.type || request.action`:

| Acción | Handler | Línea del handler |
|---|---|---|
| `getArbitrages` | `handleGetArbitrages` | 2030 |
| `refresh` | `handleRefresh` | 2079 |
| `settingsUpdated` | `handleSettingsUpdated` | 2086 |
| `getBankRates` | `handleGetBanksData` | 2110 |
| `getBanksData` | `handleGetBanksData` | 2110 |
| `GET_CRYPTO_ARBITRAGE` | `handleGetCryptoArbitrage` | 2170 |
| `recalculateWithCustomPrice` | `handleNotImplemented` | 2101 (**stub: no implementado**) |

Acciones que el popup efectivamente envía: `getArbitrages`, `getBanksData`.
`options.js` envía `settingsUpdated`.

## 4. Estructura de la UI del popup

5 pestañas, declaradas como `<section class="tab-content">` en `src/popup.html`:

| Pestaña | id | Contenido |
|---|---|---|
| Guía | `tab-guide` | `#selected-arbitrage-guide` |
| Rutas | `tab-routes` | `#loading`, `#optimized-routes` |
| Arbitraje cripto | `tab-crypto-arbitrage` | `#crypto-routes-container` |
| Simulador | `tab-simulator` | `.simulator-container`, `#advanced-config`, `#risk-matrix-result`, `#filter-results` |
| Bancos | `tab-banks` | `#banks-list`, `#connection-status` |

Bloques globales del popup: `#marketHealth`, `#cache-indicator`, `#data-warning`,
`#dollar-info`, modal de actualización (`.update-modal`), modal genérico (`#modal-body`).

## 5. Estructura de la página de opciones

8 tarjetas (`.card`) en `src/options.html`:

| # | Sección | Línea de inicio |
|---|---|---|
| 1 | 💵 Precio del Dólar | 18 |
| 2 | 🔄 Exchanges P2P | 163 |
| 3 | 🏛️ Exchanges Tradicionales | 395 |
| 4 | 💎 Exchanges USDT para Rutas | 570 |
| 5 | 🎨 Interfaz | 758 |
| 6 | 💸 Fees y Comisiones | 876 |
| 7 | 🔔 Notificaciones | 998 |
| 8 | 🔧 Avanzado | 1141 |

Cantidad de controles: **180 `<input>`** (156 checkbox, 15 number, 4 url, 1 text, 2 radio),
**4 `<select>`**, **7 `<button>`**, 57 `id`. Sin buscador, sin pestañas, sin resumen de cambios.

## 6. Fuentes de datos externas (declaradas en manifest y usadas en código)

`dolarapi.com`, `criptoya.com`, `dolarito.ar` (APIs de cotización) y `api.github.com`
(chequeo de actualizaciones por commit de GitHub).

## 7. Flujo de datos de alto nivel

```
APIs externas ──fetch──> service worker (apiClient/DataService)
                             │  calcula rutas (arbitrageCalculator) + comisiones bancarias
                             │  cachea en memoria (cacheManager, TTL)
                             ▼
                      chrome.storage / sendMessage
                             ▼
                   popup: render de rutas, filtros, simulador
                   options: configuración → chrome.storage → onChanged → SW refresca datos
```
