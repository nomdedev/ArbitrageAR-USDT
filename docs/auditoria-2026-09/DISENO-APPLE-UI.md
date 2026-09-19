# Rediseño Apple de la UI — auditoría, cambios y verificación

Fecha: 2026-09-19. Alcance: **toda la UI** del popup (el panel de configuración ya se había pasado a
Vercel Geist en `REDISENO-OPTIONS.md`). Fuente de verdad del estilo: `awesome-design-md/design-md/apple/DESIGN.md`
(SF Pro, `#1d1d1f`/`#f5f5f7`/`#000000`, Apple Blue `#0071e3` como **único** acento, radios 5/8/11/12/980,
line-height 1.07–1.14, tracking negativo en todos los tamaños, sin bordes en tarjetas).

---

## 1. Cómo se auditó

Tres agentes expertos en paralelo, **solo lectura** sobre el código (ninguno editó archivos), cada uno con
un mandato acotado:

| Agente | Alcance | Resultado |
|---|---|---|
| A | Popup vs. sistema Apple (`popup.html`, `popup.css`, 8 hojas de `ui-components/`) | 33 hallazgos, 5 estructurales |
| B | Patrones de selección del panel de configuración (`options.html/js/css`) | diagnóstico medido + 2 propuestas |
| C | Superficie de animación completa (todas las hojas + JS) | inventario con línea + spec de movimiento |

Cada afirmación de los agentes se revisó contra el archivo real antes de tocar nada; dos afirmaciones
**mías** quedaron refutadas por esa revisión (sección 4).

---

## 2. Lo que se implementó (con medición en vivo, no a ojo)

Verificación automática: `npx playwright test --config=playwright.capturas.config.js -g "apple"`
(`tests/e2e/playwright/verificar-apple-popup.spec.js`) carga la **extensión real** en Chromium, mide con
`getComputedStyle` y falla si un valor no es el del sistema Apple.

| Qué | Antes (medido) | Ahora (medido) | Archivo |
|---|---|---|---|
| Tamaño base del popup | **10,5625 px** | **14 px** | `popup.css` |
| Pestañas (Fiat/Cripto/…) | **8,978 px** | **12 px** | `popup.css` |
| Tipografía | `Inter` (fuente web) | stack del sistema (`-apple-system`, `SF Pro Text`, …) | `design-system.css` |
| Descarga de fuentes | `@import` a Google Fonts | **0** pedidos externos | `design-system.css` |
| Acento | `#3b82f6` (Tailwind) en ~25 lugares | `#0071e3` (Apple Blue), **0** restos | `design-system.css` + script |
| Acento secundario | violeta `#8b5cf6`/`#818cf8` | **0** ocurrencias | varias |
| Verdes de "éxito" | 2 distintos (`#22c55e` y `#10b981`) | **0** restos, 1 solo `#30d158` | varias |
| Cuarta paleta (GitHub Primer) | `#e6edf3` / `#58a6ff` / `#3fb950` / `#f85149` | **0** restos | `popup.css` |
| Superficies | zinc Tailwind (`#09090b`, `#18181b`) + gradientes | `#000000` / `#272729` / `#2a2a3d` planos | `design-system.css` |
| Barras laterales de estado | 4 `border-left: 3px solid` + 8 `border-left-color` | **0** | `popup.css`, `exchange-card.css` |
| Rótulo inyectado por CSS | `content: 'Click para ver detalles →'` | eliminado | `popup.css` |
| Pestañas | sueltas, con borde inferior, activa azul llena | control segmentado (radio 11 px, activo `#3a3a3d`) | `popup.css` |
| Caja del número de versión | píldora azul con borde | texto `12px/400` atenuado, tabular | `header.css` |
| Lienzo | alto fijo **600 px** → ~160 px muertos | **760 px = viewport** (sin área muerta) | `popup.css` |
| Aire inferior de `main` | 12 px parejos (última tarjeta cortada) | 24 px + `scroll-padding-bottom` | `popup.css` |
| Comentarios de tarjeta | `📊/🔄 Arbitraje` (emoji decorativo) | texto limpio | `popup.js` |
| Colores en JS | `#3b82f6` (badge), 4 colores de toast, botón de reintento | tokens Apple | `main-simple.js`, `notificationManager.js`, `ValidationService.js`, `popup.js` |

### 2.1 La causa del texto diminuto (hallazgo crítico del agente A)

```css
/* ANTES */
html, body { font-size: var(--font-size-base); }   /* 0.8125rem */
```
Al compartir la regla, el rem se resolvía **dos veces**: 13 px en `html` y `0.8125 × 13 = 10,5625 px` en
`body`. Ése es exactamente el `bodyTamano` medido. Ahora `html` fija 16 px y `body` usa el token una sola
vez (14 px), con la escala redefinida (`--font-size-xs` = 12 px como mínimo de la UI).

### 2.2 El 11,9 px de las pestañas (no se supuso: se midió)

Con la base ya en 14 px, las pestañas seguían midiendo **11,9 px**. La causa está en
`popup.css:2881` — un `@media (max-width: 500px)` que **siempre** se cumple (el popup mide 430 px) y que
hacía `.tab { font-size: 0.85em }`: 0,85 × 14 = 11,9. Reemplazado por el token de la escala.

### 2.3 Unificar la paleta con evidencia

`node $LOCALAPPDATA/Temp/unificar-paleta-apple.cjs` reemplaza solo colores inequívocos y **imprime cada
grupo**: 58 grupos en 10 hojas. Después, el spec en vivo cuenta ocurrencias de la paleta vieja dentro de
las hojas **cargadas** (`azulTailwind`, `violeta`, `verdeDoble`) y exige que sean 0.

---

## 3. Lo que falta y las decisiones que necesito

### 3.1 Hallazgos pendientes (medidos, no corregidos)

- **P-02** — la matriz de riesgo se calcula con precios **fijos** (filas USD 1400…2100) y nunca con datos
  de mercado. Evidencia en vivo: la celda "USD 1000 / USDT 1050" del informe es inalcanzable en la UI.
- **Animaciones rotas (agente C)** — 7 declaraciones CSS apuntan a keyframes **inexistentes**
  (`slideDown` en `popup.css:1164, 2224, 2798, 2909, 3370`; `stepSlideIn` en `3854`; `loadingShimmer` en
  `1228`) y 2 más desde JS (`notificationManager.js:95-96`): el acordeón de configuración avanzada y el
  shimmer de carga **no animan**. Además hay 4 clases que el JS aplica y solo existen en una hoja que
  **ningún HTML carga** (`animations.css`, 1231 líneas, 45 keyframes).
- **`prefers-reduced-motion` invertido** — `arbitrage-panel.css:381-383` y `tabs.css:236-238` **vuelven a
  activar** el movimiento dentro del bloque que debería desactivarlo; y `options.css` **no tiene ninguno**
  de los dos.
- **57 @keyframes → 8** — 43 nombres únicos con duplicados (`fadeIn` ×3, `fadeInUp` ×4, `shimmer` ×4,
  `spin` ×4, `scaleIn` ×3, `pulse` ×2 con cuerpos distintos) donde gana la hoja que se cargue última.
- **`transition: all` ×36** en `popup.css` (y 90 declaraciones de transición en total en las hojas
  cargadas), más 6 transiciones sin curva y 1 inválida (`var(--input-transition)` no existe en ningún archivo).
- **Tokens pisados entre hojas** — `animations-minimal.css:10-21` redefine duraciones y gana por orden de
  carga, así que lo que documenta `design-system.css` (250/350 ms) era ficción en runtime.
- **El control de selección miente (agente B)** — "Deseleccionar todos" + Guardar **no desactiva nada**:
  `options.js:386-393/439-446` y `main-simple.js:667-676` tratan la lista vacía como "usar todos".
- **`options.css` tiene el layout roto en 5 de 7 listas** — `.exchange-group label` nunca recibía
  `display:flex`, así que **111 de 140 casillas** se dibujaban como texto corrido con el cuadradito entre
  palabras. **Corregido hoy**: `display:flex`, `gap:8px`, `min-height:32px`.

### 3.2 Decisiones de producto (no las tomo yo)

1. **¿Cómo se selecciona en la configuración?** El agente B midió que el problema no es el cuadradito
   (eso era el layout roto, ya arreglado) sino: 140 casillas para ~40 entidades, solo 36 de 140 con
   control de "todos", 5213 px de scroll y ninguna vista de resumen. Propone **(a)** chips tipo Apple
   (cápsula de 44 px + maestro tri-state + contador + búsqueda) para las listas cortas y **(b)** una
   **matriz** entidad × contexto (140 casillas → ~40 filas, con columna maestra) para las listas largas y
   duplicadas. Ambas conservan los `name`/`value` que ya lee `options.js`, así que no tocan el contrato.
2. **Pestaña activa**: quedó **superficie elevada** (`#3a3a3d`) reservando el azul para la acción primaria.
   Si preferís el azul lleno estilo iOS tab bar, es una línea en `.tab.active` (y el assert del spec).
3. **Objetivo de toque en las casillas**: puse **32 px** (cumple el mínimo 24×24 de WCAG 2.2 SC 2.5.8 sin
   triplicar el scroll). Apple pide 44 px: si querés 44, se cambia el `min-height` y la página crece.
4. **Tamaños en `em`**: quedan varios (`0.85em`/`0.9em` en `popup.css:1179, 1453, 1475, 1496, 1505, 1848,
   1992, 2012, 3244`) calibrados contra la base vieja. Conviene pasarlos a tokens de la escala.

---

## 4. Correcciones a mis propias afirmaciones

- **"La tercera tarjeta se corta porque la barra inferior es fija"** → **falso**. El pie no declara
  `position` (el único `position:fixed` real es `.modal-overlay`). El corte era falta de aire de scroll en
  `main`. Corregido con `padding-bottom` de 24 px.
- **"El texto es ilegible por el tamaño de fuente"** → correcto, pero el mecanismo no era "el CSS es viejo":
  era el **mismo token aplicado a `html` y a `body`**, que resuelve el rem dos veces.
- **Barras laterales**: yo había dicho 4 px; son **3 px** (los 4 px son solo del estado `best` en
  `exchange-card.css:42`). El script solo matcheaba `3px solid`, así que quedó documentado para no repetir
  el error de generalizar un valor medido.
- **"El emoji 📊 está en el título de las tarjetas"**: lo que se veía era el **badge con un icono SVG**;
  el único emoji real del título era `🔄` (ya quitado).

---

## 5. Cómo reproducir

```bash
# capturas antes / después del popup y del panel de configuración
PREFIJO=popup-antes   npx playwright test --config=playwright.capturas.config.js -g "popup"
npx playwright test --config=playwright.capturas.config.js -g "apple"     # mide y AFIRMA el sistema Apple
npx playwright test --config=playwright.fixes.config.js                    # P-01, P-03, O-01, O-02, F-10, O-05
npx jest                                                                   # 217 tests
```

Capturas: `docs/auditoria-2026-09/rediseno/popup-antes-*.png` y `popup-despues-*.png`.

## 6. Segunda tanda — ejecución de las recomendaciones de los agentes

Todo lo de abajo se aplicó con scripts que **imprimen cada cambio** (`$LOCALAPPDATA/Temp/*.cjs`), para que
el diff sea auditable, y se re-verificó en vivo.

### 6.1 Del agente C (movimiento)

| Qué | Antes | Ahora |
|---|---|---|
| `transition: all` | 54 declaraciones | lista cerrada de propiedades (transform, opacity, background-color, border-color, color, box-shadow) |
| Bucles decorativos | 19 `animation: … infinite` | 0 (sólo se permiten el spinner y un shimmer) |
| Transiciones sin curva | 2 | 0 (`--ease-out` explícita) |
| Bloques universales de `prefers-reduced-motion` | 5 copias (+2 que lo **invertían**) | **1** en `design-system.css`; los invertidos pasan a `transition: none !important` |
| `@keyframes` | 57 definiciones, 43 nombres, duplicados (`fadeIn` ×3, `fadeInUp` ×4, `shimmer` ×4…) | **8 canónicos** (`hf-*`) en una sola hoja + clases utilitarias únicas |
| Animaciones rotas | 7 apuntaban a keyframes inexistentes (`slideDown`, `stepSlideIn`, `loadingShimmer`) | usan `hf-fade-in-up` / `hf-shimmer` (el acordeón y el shimmer ahora sí animan) |
| `animations-minimal.css` | pisaba las duraciones por orden de carga (200/300 en vez de 250/350) | su `:root` eliminado: las duraciones viven sólo en `design-system.css` |
| Panel expandible | animaba `max-height` (reflow por frame) | anima `opacity`; el alto cambia de una |

### 6.2 Del agente A (popup)

- `--card-bg` era un degradado slate: ahora **superficie plana** `#272729` (`#2a2a2d` al elevarse).
- `backdrop-filter` fuera de tarjetas y paneles (el vidrio queda para header/footer).
- Fondos de estado con degradado de color → planos: el estado lo comunica **el dato en color**.
- Hover de tarjeta con `translateY(-4px) scale(1.01)` + sombras + brillo diagonal → **tarjeta estática**.
- Los botones de filtro del pie, de 36×32 → **44×44** (objetivo táctil).
- Los emoji decorativos del título de tarjeta, fuera.
- **15 custom properties que se usaban y no existían** (el navegador descartaba esas declaraciones en
  silencio: focus de inputs, separador del pie de tarjeta, tipografía del tooltip, hovers) → definidas con
  valores del sistema.

> **Error propio corregido en el camino**: el script de "fondos planos" reemplazó también rellenos
> **semánticos** — las celdas de la matriz de riesgo y su leyenda quedaron todas del mismo color. Se
> detectó con un control (`awk` sobre el diff) y se restauraron como tintes planos
> (`rgba(48,209,88,0.15)` / `rgba(255,69,58,0.12)`, leyenda sólida).

### 6.3 Del agente B (panel de configuración)

| Recomendación | Estado |
|---|---|
| (a) Arreglar el layout roto de las etiquetas | **hecho**: `display:flex` + `gap` + `min-height` (111 de 140 casillas se dibujaban como texto corrido) |
| (b) Objetivo de toque | **hecho**: cápsulas de 44 px |
| (c) Que el control no mienta | **hecho**: el resumen avisa "0 de N · se usarán todos" cuando la lista queda vacía (el motor la interpreta así: `main-simple.js:667-676`) |
| (d) Cabeceras operables con teclado | **hecho**: `role="button"`, `tabindex="0"`, `aria-expanded` y Enter/Espacio (`options.selection-summary.js`) |
| (e) Ver el estado sin recorrer 5213 px | **hecho**: resumen "x de y activos" por tarjeta, con `aria-live` por `change` |
| Propuesta 1 — chips tipo Apple | **hecho** (`options.chips.css`): la etiqueta es la cápsula (980 px), el cuadradito es un círculo de estado con tilde (forma **y** color, WCAG 1.4.1) y el acento reemplaza al negro, no se suma |
| Propuesta 2 — matriz entidad × contexto | **pendiente** (ver 6.4) |
| Búsqueda en las listas largas | **pendiente** |

**Desvío declarado**: el agente recomendaba chips sólo para listas cortas y matriz para las largas. Los chips
se aplicaron a **todas** las listas porque no requieren tocar el HTML (la etiqueta ya envuelve al input) y el
estado seleccionado es inequívoco (azul lleno + tilde), así que el riesgo de "leer palabra por palabra" que
mencionaba se mitiga. La matriz sigue siendo necesaria para el problema de fondo (el mismo dato decidido 2 y
3 veces).

### 6.4 Lo que queda de las recomendaciones

1. **Matriz de entidad × contexto** (propuesta 2): 140 casillas → ~40 filas, con columna maestra tri-state
   por contexto. Es un rediseño **estructural** del markup (400 líneas escritas a mano) y no lo hice a
   ciegas; el camino seguro es generarlo desde datos manteniendo `name`/`value` y verificando con un test que
   los 140 inputs siguen existiendo con los mismos nombres y valores.
2. **Búsqueda** en las dos listas de 36.
3. **P-02**: la matriz de riesgo sigue calculándose con precios fijos (1400…2100).
4. **Tamaños en `em`** (`popup.css:1179, 1453, 1475, 1496, 1505, 1848, 1992, 2012, 3244`) calibrados contra
   la base vieja: conviene pasarlos a tokens.
5. **Coherencia claro/oscuro**: la configuración quedó en el tema claro de Vercel y el popup en oscuro
   Apple. Son dos sistemas restringidos con un solo acento cada uno, y es decisión del usuario si la
   configuración debe pasar también a oscuro.

### Estado al cierre de esta tanda

    217/217 tests en 22 suites            lint: 1 warning preexistente
    popup en vivo: 1 passed (11 s)        arreglos funcionales en vivo: 1 passed (48 s)
    scripts/verify-css-syntax.js exit 0   scripts/check-ids.js exit 0

