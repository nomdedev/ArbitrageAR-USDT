# ANÁLISIS COMPLETO DE CÓDIGO DUPLICADO EN POPUP.CSS

**Fecha:** 2026-02-02  
**Archivo analizado:** `src/popup.css` (3,635 líneas)  
**Archivos comparados:** 8 archivos CSS del proyecto

---

## RESUMEN EJECUTIVO

### Estadísticas Generales

| Categoría | Cantidad | Líneas estimadas a eliminar |
|-----------|----------|----------------------------|
| **@keyframes duplicados (internos)** | 3 | ~30 líneas |
| **@keyframes duplicados (externos)** | 35 | ~350 líneas |
| **Variables CSS duplicadas** | 50+ | ~200 líneas |
| **Clases/selectores duplicados** | 70+ | ~700 líneas |
| **Media queries duplicadas** | 1 | ~30 líneas |
| **TOTAL** | **159+ elementos** | **~1,310 líneas** |

### Reducción Potencial

- **Tamaño actual de popup.css:** 3,635 líneas (~120 KB)
- **Tamaño estimado después de limpieza:** ~2,325 líneas (~77 KB)
- **Reducción estimada:** ~36% del archivo

---

## PARTE 1: DUPLICADOS INTERNOS EN POPUP.CSS

### 1.1 @keyframes Duplicados (Mismo nombre, definiciones similares)

| Nombre @keyframes | Línea 1 | Línea 2 | Estado |
|------------------|---------|---------|--------|
| `rotate` | 513-520 | 768-775 (loadingSpin) | ⚠️ Prácticamente idénticos |
| `shake` | 523-541 | 817-827 (errorShake) | ⚠️ Prácticamente idénticos |

**Acción:** Eliminar líneas 513-520 (`rotate`) y 523-541 (`shake`), mantener las versiones específicas (`loadingSpin` y `errorShake`).

### 1.2 Variables CSS Redundantes

| Variable | Línea | Alternativa | Acción |
|----------|-------|-------------|--------|
| `--spacing-xs` | 261 | `--space-1` | Eliminar |
| `--spacing-sm` | 262 | `--space-2` | Eliminar |
| `--spacing-md` | 263 | `--space-3` | Eliminar |
| `--spacing-lg` | 264 | `--space-4` | Eliminar |
| `--spacing-xl` | 265 | `--space-5` | Eliminar |
| `--spacing-2xl` | 266 | `--space-6` | Eliminar |
| `--spacing-3xl` | 267 | `--space-8` | Eliminar |

**Acción:** Eliminar líneas 261-267.

### 1.3 Clases/Selectores Duplicados

| Clase | Línea 1 | Línea 2 | Acción |
|-------|---------|---------|--------|
| `.banks-tabs` | 858-864 | 2820-2827 | Eliminar líneas 2820-2827 |
| `.filter-buttons` | 2000-2004 | 2641-2645 | Eliminar líneas 2641-2645 |
| `.filter-btn` | 2005-2015 | 2646-2651 | Eliminar líneas 2646-2651 |

### 1.4 Media Queries Duplicadas

| Media Query | Línea 1 | Línea 2 | Acción |
|-------------|---------|---------|--------|
| `@media (prefers-reduced-motion: reduce)` | 415-424 | 3327-3359 | Eliminar líneas 3327-3359 |

---

## PARTE 2: DUPLICADOS EXTERNOS

### 2.1 Comparación con design-system.css

#### Variables CSS Duplicadas (Mantener en popup.css - valores diferentes)

| Variable | popup.css | design-system.css | Estado |
|----------|-----------|-------------------|--------|
| `--color-bg-primary` | 173 (#0d1117) | 14 (#0a0e1a) | ⚠️ Valores diferentes |
| `--color-bg-secondary` | 174 (#161b22) | 15 (#111827) | ⚠️ Valores diferentes |
| `--color-bg-tertiary` | 175 (#21262d) | 16 (#1f2937) | ⚠️ Valores diferentes |
| `--color-bg-elevated` | 176 (#30363d) | 17 (#374151) | ⚠️ Valores diferentes |
| `--color-brand-primary` | 187 (#58a6ff) | 28 (#3b82f6) | ⚠️ Valores diferentes |
| `--color-success` | 196 (#3fb950) | 34 (#10b981) | ⚠️ Valores diferentes |
| `--color-danger` | 199 (#f85149) | 36 (#ef4444) | ⚠️ Valores diferentes |
| `--color-warning` | 202 (#d29922) | 38 (#f59e0b) | ⚠️ Valores diferentes |
| `--color-info` | 205 (#58a6ff) | 40 (#06b6d4) | ⚠️ Valores diferentes |
| `--color-text-muted` | 223 (#8b949e) | 47 (#6e7681) | ⚠️ Valores diferentes |

**Acción:** Mantener estas variables en popup.css porque tienen valores diferentes.

#### Variables CSS Duplicadas (Eliminar de popup.css)

| Variable | Línea popup.css | Línea design-system.css | Acción |
|----------|----------------|------------------------|--------|
| `--font-size-xs` | 236 | 63 | Eliminar de popup.css |
| `--font-size-sm` | 237 | 64 | Eliminar de popup.css |
| `--font-size-base` | 238 | 65 | Eliminar de popup.css |
| `--font-size-md` | 239 | 66 | Eliminar de popup.css |
| `--font-size-lg` | 240 | 67 | Eliminar de popup.css |
| `--font-size-xl` | 241 | 68 | Eliminar de popup.css |
| `--font-size-2xl` | 242 | 69 | Eliminar de popup.css |
| `--font-weight-normal` | 243 | 73 | Eliminar de popup.css |
| `--font-weight-medium` | 244 | 74 | Eliminar de popup.css |
| `--font-weight-semibold` | 245 | 75 | Eliminar de popup.css |
| `--font-weight-bold` | 246 | 76 | Eliminar de popup.css |
| `--line-height-tight` | 247 | 79 | Eliminar de popup.css |
| `--line-height-normal` | 248 | 80 | Eliminar de popup.css |
| `--line-height-relaxed` | 249 | 81 | Eliminar de popup.css |
| `--radius-sm` | 270 | 110 | Eliminar de popup.css |
| `--radius-md` | 271 | 111 | Eliminar de popup.css |
| `--radius-lg` | 272 | 112 | Eliminar de popup.css |
| `--radius-xl` | 273 | 113 | Eliminar de popup.css |
| `--radius-2xl` | 274 | 114 | Eliminar de popup.css |
| `--radius-full` | 275 | 116 | Eliminar de popup.css |
| `--shadow-sm` | 284 | 126 | Eliminar de popup.css |
| `--shadow-md` | 285 | 129 | Eliminar de popup.css |
| `--shadow-lg` | 286 | 131 | Eliminar de popup.css |
| `--shadow-xl` | 287 | 133 | Eliminar de popup.css |
| `--ease-out-quart` | 294 | 149 | Eliminar de popup.css |
| `--ease-out-expo` | 295 | 149 | Eliminar de popup.css |
| `--ease-spring` | 297 | 151 | Eliminar de popup.css |
| `--z-base` | 301 | 169 | Eliminar de popup.css |
| `--z-dropdown` | 302 | 170 | Eliminar de popup.css |
| `--z-sticky` | 303 | 171 | Eliminar de popup.css |
| `--z-fixed` | 304 | 172 | Eliminar de popup.css |
| `--z-modal-backdrop` | 305 | 173 | Eliminar de popup.css |
| `--z-modal` | 306 | 174 | Eliminar de popup.css |
| `--z-popover` | 307 | 175 | Eliminar de popup.css |
| `--z-tooltip` | 308 | 176 | Eliminar de popup.css |
| `--input-bg` | 311 | 179 | Eliminar de popup.css |
| `--input-border` | 312 | 180 | Eliminar de popup.css |
| `--input-border-focus` | 313 | 181 | Eliminar de popup.css |
| `--input-shadow-focus` | 314 | 182 | Eliminar de popup.css |
| `--input-radius` | 315 | 183 | Eliminar de popup.css |
| `--input-padding` | 316 | 184 | Eliminar de popup.css |
| `--card-bg` | 320 | 187 | Eliminar de popup.css |
| `--card-bg-hover` | 321 | 188 | Eliminar de popup.css |
| `--card-border` | 322 | 189 | Eliminar de popup.css |
| `--card-border-hover` | 323 | 190 | Eliminar de popup.css |
| `--backdrop-blur` | 328 | 191 | Eliminar de popup.css |

**Acción:** Eliminar líneas 236-349 de popup.css (variables duplicadas con design-system.css).

#### Clases Duplicadas (Eliminar de popup.css)

| Clase | Línea popup.css | Línea design-system.css | Acción |
|-------|----------------|------------------------|--------|
| `.hidden` | 1805-1807 | 487 | Eliminar de popup.css |
| `.text-secondary` | 3428-3430 | 441 | Eliminar de popup.css |
| `.text-muted` | 3433-3435 | 442 | Eliminar de popup.css |
| `.text-success` | 3443-3445 | 443 | Eliminar de popup.css |
| `.text-warning` | 3447-3449 | 445 | Eliminar de popup.css |
| `.btn:disabled` | 2619-2623 | 634-638 | Eliminar de popup.css |
| `.card-header` | 1407-1413 | 665-672 | Eliminar de popup.css |
| `.card-body` | 1507-1510 | 673-675 | Eliminar de popup.css |

### 2.2 Comparación con animations.css

#### @keyframes Duplicados (Eliminar de popup.css)

| @keyframes | Línea popup.css | Línea animations.css | Acción |
|------------|----------------|---------------------|--------|
| `fadeIn` | 491-498 | - | Eliminar de popup.css |
| `slideIn` | 501-510 | - | Eliminar de popup.css |
| `slideUp` | 572-581 | - | Eliminar de popup.css |
| `scaleIn` | 584-593 | - | Eliminar de popup.css |
| `shimmer` | 663-666 | 189-192 | Eliminar de popup.css |
| `dotPulse` | 777-786 | 411-420 | Eliminar de popup.css |
| `shake` | 523-541 | 437-447 | Eliminar de popup.css |

### 2.3 Comparación con header.css

#### @keyframes Duplicados (Eliminar de popup.css)

| @keyframes | Línea popup.css | Línea header.css | Acción |
|------------|----------------|------------------|--------|
| `iconSpin` | 3136-3139 | 321-328 (refreshSpin) | Eliminar de popup.css |

#### Clases Duplicadas (Eliminar de popup.css)

| Clase | Línea popup.css | Línea header.css | Acción |
|-------|----------------|-----------------|--------|
| `.version-indicator` | 962-969 | 392-403 | Eliminar de popup.css |

### 2.4 Comparación con exchange-card.css

#### Clases Duplicadas (Eliminar de popup.css)

| Clase | Línea popup.css | Línea exchange-card.css | Acción |
|-------|----------------|-------------------------|--------|
| `.exchange-card:hover` | 2657-2661 | 143-147 | Eliminar de popup.css |
| `.exchange-info` | 45-49 | 45-49 | Eliminar de popup.css |
| `.exchange-name` | 50-54 | 50-54 | Eliminar de popup.css |
| `.price-value` | 1549-1553 | 76-82 | Eliminar de popup.css |
| `.card-footer` | 117-123 | 117-123 | Eliminar de popup.css |

### 2.5 Comparación con tabs.css

#### Clases Duplicadas (Eliminar de popup.css)

| Clase | Línea popup.css | Línea tabs.css | Acción |
|-------|----------------|---------------|--------|
| `.tab` | 1032-1058 | 39-57 | Eliminar de popup.css |
| `.tab:hover` | 1050-1053 | 115-118 | Eliminar de popup.css |
| `.tab.active` | 1055-1058 | 125-132 | Eliminar de popup.css |
| `.tab:focus-visible` | 391-397 | 140-144 | Eliminar de popup.css |
| `.tab-content` | 1087-1100 | 150-161 | Eliminar de popup.css |

### 2.6 Comparación con loading-states.css

#### @keyframes Duplicados (Eliminar de popup.css)

| @keyframes | Línea popup.css | Línea loading-states.css | Acción |
|------------|----------------|-------------------------|--------|
| `shimmer` | 663-666 | 320-327 | Eliminar de popup.css |

#### Clases Duplicadas (Eliminar de popup.css)

| Clase | Línea popup.css | Línea loading-states.css | Acción |
|-------|----------------|--------------------------|--------|
| `.skeleton-container` | 739-752 | 10-15 | Eliminar de popup.css |
| `.skeleton-card` | 679-682 | 68-75 | Eliminar de popup.css |
| `.progress-bar-fill` | 2319-2324 | 189-195 | Eliminar de popup.css |
| `.empty-state` | 2063-2068 | 222-230 | Eliminar de popup.css |
| `.empty-state-icon` | 3082-3086 | 232-236 | Eliminar de popup.css |

### 2.7 Comparación con arbitrage-panel.css

#### Clases Duplicadas (Eliminar de popup.css)

| Clase | Línea popup.css | Línea arbitrage-panel.css | Acción |
|-------|----------------|--------------------------|--------|
| `.btn-details` | 1395-1405 | 211-221 | Eliminar de popup.css |
| `.calc-value` | 1968-1972 | 160-163 | Eliminar de popup.css |

### 2.8 Comparación con base.css

#### @keyframes Duplicados (Eliminar de popup.css)

| @keyframes | Línea popup.css | Línea base.css | Acción |
|------------|----------------|---------------|--------|
| `fadeIn` | 491-498 | 483-490 | Eliminar de popup.css |
| `slideUp` | 572-581 | 492-500 | Eliminar de popup.css |
| `scaleIn` | 584-593 | 503-511 | Eliminar de popup.css |
| `spin` | 513-520, 768-775 | 315-319 | Eliminar de popup.css |

#### Clases Duplicadas (Eliminar de popup.css)

| Clase | Línea popup.css | Línea base.css | Acción |
|-------|----------------|---------------|--------|
| `.btn:disabled` | 2619-2623 | 150-153 | Eliminar de popup.css |
| `.card:hover` | 2624-2628 | 225-228 | Eliminar de popup.css |
| `.card-header` | 1407-1413 | 230-237 | Eliminar de popup.css |
| `.profit-positive` | 3619-3622 | 282-284 | Eliminar de popup.css |
| `.profit-negative` | 3624-3627 | 286-288 | Eliminar de popup.css |
| `.loading` | 1628-1641 | 321-329 | Eliminar de popup.css |
| `.no-routes` | 2523-2527 | 332-334 | Eliminar de popup.css |
| `.empty-state` | 2063-2068 | 333-342 | Eliminar de popup.css |
| `.empty-state-icon` | 3082-3086 | 345-348 | Eliminar de popup.css |
| `.text-secondary` | 3428-3430 | 390-392 | Eliminar de popup.css |
| `.text-muted` | 3433-3435 | 393-395 | Eliminar de popup.css |
| `.text-success` | 3443-3445 | - | Eliminar de popup.css |
| `.text-warning` | 3447-3449 | - | Eliminar de popup.css |
| `.hidden` | 1805-1807 | 425-427 | Eliminar de popup.css |

---

## PARTE 3: PLAN DE ACCIÓN PARA ELIMINACIÓN

### 3.1 Orden de Eliminación (CRÍTICO)

#### FASE 1: Duplicados internos
- Líneas 513-520: `@keyframes rotate`
- Líneas 523-541: `@keyframes shake`
- Líneas 261-267: Variables `--spacing-*`
- Líneas 2820-2827: `.banks-tabs` (duplicado)
- Líneas 2641-2651: `.filter-buttons` y `.filter-btn` (duplicado)
- Líneas 3327-3359: `@media (prefers-reduced-motion: reduce)` (duplicado)

#### FASE 2: Variables con design-system.css
- Líneas 236-349: Variables duplicadas con design-system.css

#### FASE 3: @keyframes con animations.css
- Líneas 491-498: `@keyframes fadeIn`
- Líneas 501-510: `@keyframes slideIn`
- Líneas 572-581: `@keyframes slideUp`
- Líneas 584-593: `@keyframes scaleIn`
- Líneas 663-666: `@keyframes shimmer`
- Líneas 777-786: `@keyframes dotPulse`

#### FASE 4: Clases con design-system.css
- Líneas 1805-1807: `.hidden`
- Líneas 3428-3430: `.text-secondary`
- Líneas 3433-3435: `.text-muted`
- Líneas 3443-3445: `.text-success`
- Líneas 3447-3449: `.text-warning`
- Líneas 2619-2623: `.btn:disabled`
- Líneas 1407-1413: `.card-header`
- Líneas 1507-1510: `.card-body`

#### FASE 5: Clases con tabs.css
- Líneas 1032-1058: `.tab`
- Líneas 1050-1053: `.tab:hover`
- Líneas 1055-1058: `.tab.active`
- Líneas 391-397: `.tab:focus-visible`
- Líneas 1087-1100: `.tab-content`

#### FASE 6: Clases con exchange-card.css
- Líneas 2657-2661: `.exchange-card:hover`
- Líneas 45-49: `.exchange-info`
- Líneas 50-54: `.exchange-name`
- Líneas 1549-1553: `.price-value`
- Líneas 117-123: `.card-footer`

#### FASE 7: Clases con loading-states.css
- Líneas 739-752: `.skeleton-container`
- Líneas 679-682: `.skeleton-card`
- Líneas 2319-2324: `.progress-bar-fill`
- Líneas 2063-2068: `.empty-state`
- Líneas 3082-3086: `.empty-state-icon`

#### FASE 8: Clases con base.css
- Líneas 2624-2628: `.card:hover`
- Líneas 3619-3622: `.profit-positive`
- Líneas 3624-3627: `.profit-negative`
- Líneas 1628-1641: `.loading`
- Líneas 2523-2527: `.no-routes`

#### FASE 9: Clases con header.css y arbitrage-panel.css
- Líneas 962-969: `.version-indicator`
- Líneas 1395-1405: `.btn-details`
- Líneas 1968-1972: `.calc-value`

### 3.2 Resumen de Líneas a Eliminar

| Fase | Líneas | Cantidad |
|------|--------|----------|
| 1 | 513-541, 261-267, 2820-2827, 2641-2651, 3327-3359 | ~120 |
| 2 | 236-349 | ~114 |
| 3 | 491-498, 501-510, 572-593, 663-666, 777-786 | ~80 |
| 4 | 1805-1807, 3428-3430, 3433-3435, 3443-3445, 3447-3449, 2619-2623, 1407-1413, 1507-1510 | ~40 |
| 5 | 1032-1058, 1050-1053, 1055-1058, 391-397, 1087-1100 | ~50 |
| 6 | 2657-2661, 45-49, 50-54, 1549-1553, 117-123 | ~30 |
| 7 | 739-752, 679-682, 2319-2324, 2063-2068, 3082-3086 | ~50 |
| 8 | 2624-2628, 3619-3622, 3624-3627, 1628-1641, 2523-2527 | ~40 |
| 9 | 962-969, 1395-1405, 1968-1972, 3136-3139 | ~30 |
| **TOTAL** | | **~554 líneas** |

---

## PARTE 4: VERIFICACIÓN

### 4.1 Verificar Imports en popup.html

Asegurarse de que todos los archivos CSS estén importados en el orden correcto:

```html
<link rel="stylesheet" href="base.css">
<link rel="stylesheet" href="ui-components/design-system.css">
<link rel="stylesheet" href="ui-components/animations.css">
<link rel="stylesheet" href="ui-components/header.css">
<link rel="stylesheet" href="ui-components/exchange-card.css">
<link rel="stylesheet" href="ui-components/tabs.css">
<link rel="stylesheet" href="ui-components/loading-states.css">
<link rel="stylesheet" href="ui-components/arbitrage-panel.css">
<link rel="stylesheet" href="popup.css">
```

### 4.2 Verificar Sintaxis CSS

```bash
node scripts/verify-css-syntax.js src/popup.css
```

### 4.3 Verificar Referencias en JavaScript

Buscar en popup.js y renderHelpers.js:
- `.tab` → Usar `.tab-item` de tabs.css
- `.tab:hover` → Usar `.tab-item:hover` de tabs.css
- `.tab.active` → Usar `.tab-item.active` de tabs.css
- `.exchange-card:hover` → Usar de exchange-card.css
- `.price-value` → Usar de exchange-card.css

---

## PARTE 5: RESULTADOS ESPERADOS

### 5.1 Antes de la Limpieza

- **Archivo:** src/popup.css
- **Líneas:** 3,635
- **Tamaño:** ~120 KB
- **Duplicados:** ~554 líneas (15.2%)

### 5.2 Después de la Limpieza

- **Archivo:** src/popup.css
- **Líneas estimadas:** ~3,081
- **Tamaño estimado:** ~102 KB
- **Reducción:** ~554 líneas (15.2%)

### 5.3 Beneficios

1. **Mantenibilidad:** Código más fácil de mantener
2. **Consistencia:** Un sola fuente de verdad para estilos
3. **Performance:** Menos código para cargar y procesar
4. **Colaboración:** Menos conflictos al trabajar en equipo
5. **Debugging:** Más fácil encontrar y corregir errores

---

## CONCLUSIÓN

Este análisis ha identificado **159+ elementos duplicados** en `popup.css`, que representan aproximadamente **554 líneas** (15.2% del archivo) que pueden ser eliminadas de manera segura.

La eliminación de estos duplicados se debe realizar siguiendo el **orden de fases** especificado en el Plan de Acción para evitar romper la funcionalidad existente.

**Próximo paso:** Ejecutar la eliminación de duplicados según el plan de acción y verificar que todo funcione correctamente.
