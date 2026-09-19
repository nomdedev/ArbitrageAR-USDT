# Auditoría ArbitrageAR-USDT — Brief de trabajo para agentes expertos

Fecha: 2026-09-19
Repo auditado: `D:\martin\Proyectos\ArbitrageAR-USDT`
Commit base: `5fdfa9e` (= `origin/main`, árbol limpio)
Versión en manifest: 6.0.0 (nota: el número de versión del repo es inconsistente, ver área CALIDAD)

## Qué es esto

Extensión Chromium Manifest V3 que detecta arbitraje entre el dólar oficial argentino y
USDT en exchanges locales. Ruta objetivo: `ARS → USD (banco oficial) → USDT → ARS (exchange)`.

Está cargada **descomprimida en Brave** directamente desde esta carpeta
(extension ID `eekjnnmknnmdieggifdakabaonghfakl`, `location: 4`, verificado en
`Brave-Browser/User Data/Default/Secure Preferences`). Es decir: **el código de esta carpeta
es exactamente lo que corre en el navegador**. No hay copia aparte.

## Arquitectura real (verificada)

- `manifest.json` → MV3, `background.service_worker = src/background/main-simple.js`,
  `action.default_popup = src/popup.html`, `options_page = src/options.html`.
- Permisos: `storage`, `alarms`, `notifications`, `activeTab`.
- Host permissions: `dolarapi.com`, `criptoya.com`, `dolarito.ar`, `api.github.com`.
- CSP: `script-src 'self'; object-src 'self';` (nota: `.claude/CLAUDE.md` afirma que incluye
  `'wasm-unsafe-eval'` — no coincide con el manifest).
- **No hay bundler ni módulos ES**: todo son scripts clásicos cargados por `<script src>` en
  orden de aparición en el HTML, comunicados por **globales** (`window.X`) y por
  `chrome.runtime.sendMessage`. El service worker usa `importScripts()`.
- Orden de carga del popup (`src/popup.html`): `utils.js`, `utils/logger.js`,
  `utils/formatters.js`, `utils/stateManager.js`, `utils/commonUtils.js`, `ValidationService.js`,
  `renderHelpers.js`, `ui/routeRenderer.js`, `ui/tooltipSystem.js`, `ui-components/animations.js`,
  `ui-components/arbitrage-panel.js`, `ui-components/tabs.js`, `modules/filterManager.js`,
  `modules/routeManager.js`, `modules/modalManager.js`, `modules/notificationManager.js`,
  `modules/simulator.js`, `popup.js`.
- Página de opciones (`src/options.html`): `utils/commonUtils.js`, `options.js`.
- `src/ui/filterController.js` existe en el repo pero **no se carga desde ningún HTML**.

## Tamaños (líneas reales)

```
4697  src/popup.js                 2475  src/background/main-simple.js
4564  src/popup.css                971   src/ui-components (varios)
1449  src/popup.html               957   src/options.js
845   src/options.css              824   src/modules/simulator.js
717   src/modules/filterManager.js 684   src/modules/routeManager.js
672   src/modules/notificationManager.js  653 src/DataService.js
609   src/modules/modalManager.js  607   src/ui/tooltipSystem.js
558   src/utils/commonUtils.js     512   src/base.css
435   src/ui-components/animations.js    419 src/ui-components/arbitrage-panel.css
313   src/ui-components/arbitrage-panel.js  315 src/ui-components/tabs.js
305   src/ValidationService.js     279   src/ui/filterController.js (NO cargado)
273   src/ui/routeRenderer.js      262   src/utils/bankCalculations.js
251   src/background/arbitrageCalculator.js  209 src/background/cacheManager.js
207   src/background/apiClient.js  202   src/renderHelpers.js
194   src/utils/formatters.js      195   src/utils/stateManager.js
150   src/utils/logger.js          31    src/utils.js
```

Backups muertos en el repo: `src/ui-components/{animations,design-system,exchange-card,header}.css.backup`,
`src/utils/formatters.js.backup`.

## Estado medido del baseline (2026-09-19)

- `npm run lint` → 1 warning: `src/options.js:661 'CommonUtils' is not defined` (no-undef).
- `npx jest` → 16 suites, 203 tests, **todos pasan**. (Un `tests/e2e` con Playwright aparte.)
- `npm run format:check` → no verificado aún.

## Reglas del trabajo

1. **SOLO LECTURA sobre el repo.** No edites, muevas ni borres ningún archivo fuera de tu
   propio informe. Nada de `git add`, `git commit`, `npm install`, `npm run build`
   (el build escribe en `dist/`).
2. **Nada de supuestos.** Cada hallazgo necesita `archivo:línea` y la línea citada como
   evidencia. Si no pudiste verificarlo, marcalo explícitamente como `NO VERIFICADO` y
   explicá qué falta.
3. **Verificá las afirmaciones de auditorías previas, no las repitas.** Hay auditorías
   anteriores en `.claude/AUDITORIA_COMPLETA.md` y `.claude/auditorias/*.md` (marzo/abril 2026)
   que afirman cosas como "0 XSS activos", "onclick inline eliminados", "validación de origen
   en mensajes". Tu trabajo es comprobar si eso sigue siendo cierto en el código actual y
   detectar lo que quedó afuera.
4. **Distinguí bug real de estilo.** Un bug real: comportamiento incorrecto, crash, fuga,
   condición de carrera, dato mal calculado, algo que el usuario final nota. Estilo: nombres,
   orden, tamaño de archivo. Reportá ambos pero separados y con severidad honesta.
5. **Toda severidad se justifica**: ¿qué le pasa al usuario si esto no se arregla?
6. Escribí en **español**, tono técnico, sin relleno.

## Formato del informe

Un archivo markdown por área, en `docs/auditoria-2026-09/`.

1. `# Auditoría <ÁREA> — ArbitrageAR-USDT`
2. `## Alcance` — qué archivos leíste y cuáles no (no leídos = confesar)
3. `## Resumen` — tabla: `ID | Severidad | Título | Archivo:línea`
   Severidades: `CRÍTICO`, `ALTO`, `MEDIO`, `BAJO`, `COSMÉTICO`
4. `## Hallazgos` — uno por uno:
   - `### <ID> — <título>` + severidad
   - **Evidencia**: `archivo:línea` + bloque de código citado
   - **Qué está mal**: en una o dos frases
   - **Impacto**: qué le pasa al usuario/herramienta
   - **Fix propuesto**: concreto, con el código o el cambio exacto
   - **Cómo verificar que quedó bien**: comando o pasos
5. `## Verificación de auditorías previas` — tabla: afirmación previa | ¿sigue siendo cierta? | evidencia
6. `## Lo que NO pude verificar` — y por qué
