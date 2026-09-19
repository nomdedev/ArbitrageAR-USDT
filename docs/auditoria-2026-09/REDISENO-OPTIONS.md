# Rediseño de la página de configuración — sistema Vercel Geist

Fecha: 2026-09-19 · Página: `src/options.html` + `src/options.css` · Extensión: ArbitrARS v6.0.0

---

## 1. De dónde sale el diseño

No es invención propia: se implementó el DESIGN.md de Vercel de la colección
`awesome-design-md`, en `design-md/vercel/DESIGN.md` (54 marcas disponibles en esa skill).
Los principios que se aplicaron textualmente:

| Principio del DESIGN.md | Cómo quedó en la página |
|---|---|
| "Sombra como borde": `rgba(0,0,0,.08) 0 0 0 1px` en lugar de `border` | `.card`, inputs, botones y grupos: `border: none` + box-shadow. Medido: `cardBorde: "none"` |
| Blanco puro de fondo y `#171717` como texto (no negro puro) | `bodyFondo: rgb(255,255,255)` · `bodyTexto: rgb(23,23,23)` |
| Pila de sombras de tarjeta (borde + elevación + ambiente + brillo interno `#fafafa`) | `.card` usa los 4 valores exactos del DESIGN.md |
| Solo tres pesos: 400 lectura, 500 UI, 600 títulos | Ningún 700 en toda la hoja (el anterior tenía `h1 { font-weight: 700 }`) |
| Tracking negativo escalado | h1 32px/-1.28px · h2 19px/-0.5px · labels 13px/-0.1px |
| Etiquetas técnicas en monoespaciada MAYÚSCULA con tracking positivo | `PRINCIPALES / REGIONALES / OTROS / FEES POR BROKER`: mono 11px, `letter-spacing .06em`, `text-transform: uppercase` |
| Color solo funcional, nunca decorativo | Paleta completa en grises; los únicos colores son estado (ok/error/warning) y el focus ring `hsla(212,100%,48%,1)` |
| Escala de radios 4/6/8/12 y píldoras 9999px solo para badges | Inputs y botones 6px, tarjetas y grupos 8px, chips de estado píldora |
| Espacio en blanco generoso, ancho máximo de contenido | `.container` pasó de `max-width: 1400px` a **1080px**, con 56px arriba y 140px abajo |

Fuente tipográfica: la pila de Geist con sus fallbacks oficiales
(`-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`) y
`ui-monospace, SFMono-Regular, ...` para las etiquetas técnicas. No se cargan webfonts
externas: una extensión no debe depender de una red para verse bien.

---

## 2. Qué estaba mal antes

Captura previa: `docs/auditoria-2026-09/rediseno/antes-01-arriba.png`

- **Tema GitHub Dark** (`#0d1117`) con 4 niveles de gris azulado y bordes de 1px en todo.
- **Emoji decorativo en cada título y botón** (💵 🔄 🏛️ 💎 🎨 💸 🔔 🔧 💾 ➕): ruido visual
  compitiendo con el texto en cada encabezado.
- **Contenido estirado a 1400px**: las líneas de texto cruzaban toda la pantalla y las
  grillas de 3 columnas quedaban enormes y desbalanceadas.
- **Checkboxes y radios nativos** con `accent-color` azul: los tildes salían cuadrados de
  color según el tema del sistema, sin relación con la paleta.
- **Interruptor azul** de 36×20 con el pulgar gris, apagado casi invisible.
- **Botón Guardar al final de la página**: con 8 secciones abiertas había que scrollear
  ~5000px para guardar, y no había ninguna señal de que existiera.
- El título "Configuración" estaba **centrado** con una línea inferior de 2px.

---

## 3. Qué se hizo

### 3.1 Hoja de estilos reescrita (`src/options.css`, 845 → 900 líneas)

Reescritura completa, no parches. Se mantuvieron **todos** los nombres de clase y de id que
usa `options.js`, para que el rediseño no pueda romper la funcionalidad. Inventario verificado
antes de empezar: 48 clases en el HTML + `.collapsed` (el único estado que el JS agrega o
quita) + las clases que el JS genera por su cuenta (`.broker-fee-item`, `.status success/error`).

Componentes nuevos o cambiados:

- **Tarjetas**: sin borde, con la pila de sombras de Vercel; el header tiene una hairline
  inferior (`inset 0 -1px 0 #ebebeb`) en lugar de fondo gris.
- **Checkboxes y radios personalizados** (`appearance: none`): 16px, radio 4px, borde por
  sombra; encendidos, fondo `#171717` con tilde blanco dibujado en CSS. Los radios son círculo
  completo con punto blanco.
- **Interruptor**: píldora 34×19, gris `#e5e5e5` apagado y **`#171717` encendido**, con el
  pulgar blanco y sombra propia. Es el conmutador negro de Vercel.
- **Botones**: 6px de radio, 13px/500, sombra-como-borde; `.primary` fondo `#171717` con hover
  a `#383838`; `.secondary` blanco con borde por sombra. Se eliminó el `translateY(-1px)` en
  hover (efecto de juguete, ajeno al sistema).
- **Footer pegajoso**: `position: fixed` con `backdrop-filter: blur(12px)` y hairline superior.
  **Guardar** queda siempre a la vista, sin scrollear 5000px.
- **Scrollbar y selección de texto** estilizadas (12px, pulgar `#e5e5e5`, selección `#ebebeb`).
- **`:has()` para los avisos largos**: `.field:has(.info)` ocupa la fila completa, para que un
  aviso de 3 líneas no quede apilado en una columna angosta dejando huecos al lado.

### 3.2 Emoji decorativo fuera de títulos y botones (`src/options.html`)

Se quitaron 19 textos, con un script que imprime cada reemplazo (no a mano, no a ciegas):

```
h1  "⚙️ Configuración"                        ->  "Configuración"
h2  "💵 Precio del Dólar"                     ->  "Precio del Dólar"
h2  "🔄 Exchanges P2P"                        ->  "Exchanges P2P"
h3  "💵 Paso 2: USD → USDT (Compra USDT)"     ->  "Paso 2: USD → USDT (Compra USDT)"
h3  "💰 Paso 3: USDT → ARS (Venta USDT)"      ->  "Paso 3: USDT → ARS (Venta USDT)"
h3  "🔄 Sincronización (Paso 2 y 3)"          ->  "Sincronización (Paso 2 y 3)"
h2  "🏛️ Exchanges Tradicionales"              ->  "Exchanges Tradicionales"
h2  "💎 Exchanges USDT para Rutas"            ->  "Exchanges USDT para Rutas"
h2  "🎨 Interfaz"                             ->  "Interfaz"
h2  "💸 Fees y Comisiones"                    ->  "Fees y Comisiones"
h2  "🔔 Notificaciones"                       ->  "Notificaciones"
h2  "🔧 Avanzado"                             ->  "Avanzado"
button  "✅ Seleccionar todos" / "❌ Deseleccionar todos" / "➕ Agregar" ×2
button  "🔔 Probar" / "💾 Guardar" / "🔄 Reset"
```

**Lo que NO se tocó**: los emoji de los avisos y descripciones (⚠️ en la advertencia de
comisiones, ℹ️ en las notas, 🚫 en el estado vacío) y los que están dentro de etiquetas de
opciones (🔥 Consenso, 🧭 Automático, ✏️ Manual, banderas de exchanges). Ahí el emoji es
semántico o parte de una opción concreta, no decoración de encabezado. Si el usuario quiere
una página 100% monocroma, es un paso más que queda pendiente de su decisión.

---

## 4. Verificación — con números, no a ojo

Se cargó la extensión real en un Chromium propio (Playwright, mismo id
`eekjnnmknnmdieggifdakabaonghfakl` que en Brave) y se midieron los estilos computados sobre la
página en vivo:

```json
{
  "desbordeHorizontal": 0,
  "anchoContenido": 1080,
  "bodyFondo": "rgb(255, 255, 255)",
  "bodyTexto": "rgb(23, 23, 23)",
  "cardSombra": "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 2px 0px, rgba(0, 0, 0, 0.04) 0px 8px 8px -8px, rgb(250, 250, 250) 0px 0px 0px 1px",
  "cardBorde": "none",
  "footerPosicion": "fixed",
  "h2Tracking": "-0.5px",
  "h4Fuente": "ui-monospace, SFMono-Regular, \"Geist Mono\", ...",
  "h4Transform": "uppercase",
  "inputSombra": "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
  "switchEncendido": "rgb(23, 23, 23)",
  "legacyDisplay": "none",
  "tarjetas": 8,
  "estilosCargados": 1,
  "reglas": 131
}
```

Lectura de los números:

- `desbordeHorizontal: 0` → no hay scroll horizontal en 1440px.
- `cardBorde: "none"` + `cardSombra` con los cuatro valores de Vercel → se cumple el
  "sombra como borde", no es sólo una aspiración del documento.
- `bodyTexto: rgb(23,23,23)` = `#171717`, el negro cálido de Vercel, no `#000000`.
- `legacyDisplay: "none"` → la tabla vieja de fees por broker sigue oculta. Sospeché que había
  **dos interfaces duplicadas** visibles en la captura y lo medí en vez de confiar en el ojo:
  no hay duplicado.

**Regresión**: la suite completa y la verificación en vivo de los fixes se corren después del
rediseño. `tests/options.settings-persistence.test.js` carga el `options.html` real en jsdom,
así que un id roto o un control movido hace fallar el test, no el usuario.

### 4.1 Verificación en vivo de los arreglos SOBRE la página rediseñada

El rediseño toca el `options.html` donde viven los controles de varios hallazgos, así que la
verificación en vivo se corrió **después** del rediseño, con la extensión real cargada en un
Chromium propio (mismo id `eekjnnmknnmdieggifdakabaonghfakl` que en Brave, con `chrome.*` real):

```
P-01  display antes=none · despues=block · visible=true
O-02  #apply-fees existe: 1
F-10  "Fee de retiro ($ ARS)" · "Fee de transferencia ($ ARS)" · "Comisión bancaria ($ ARS)"
O-05  lemoncash=1 · lemon-cash(vieja)=0
O-01  interruptor antes de guardar=true
O-01  items antes de Guardar=1 · tras recargar=1
O-01  interruptor tras recargar=true
O-01  en storage: {"brokerFees":[{"broker":"lemoncash","buyFee":0.5,"label":"Lemon","sellFee":1.5}],
                   "applyFeesInCalculation":true}
P-03  25 celdas · peor desvio=-1.56 pp (exactamente las comisiones aplicadas)
P-02  filas USD de la matriz en vivo: ["$1400","$1575","$1750","$1925","$2100"]
consola: SW=2 · popup=0 · options=0
1 passed (48.1s)
```

**El caso O-01 es la prueba que importa**: cargo un fee de Lemon, aprieto **Guardar** y
**recargo la página**. El fee sigue en la lista, el interruptor sigue encendido y el storage lo
confirma. Antes del arreglo, ese mismo Guardar dejaba `brokerFees` en `[]` y el interruptor
volvía a `false`: guardar apagaba las comisiones.

Dos observaciones honestas de esta corrida:

1. **P-03 en vivo**: la verificación no usa la celda del informe (USD 1000 / USDT 1050 =
   +2,91%) porque **esa fila no existe en la matriz real**, que arranca en USD 1400. Se comprobó
   la propiedad matemática que sí discrimina: las 25 celdas cumplen
   `mostrado ≈ USDT_venta / USD_compra − 1` con un desvío máximo de 1,56 pp explicado por las
   comisiones. Con la conversión invertida el desvío sería de decenas de puntos y con el signo
   cambiado. El criterio exacto del informe (+2,91%) sí se verifica en
   `tests/simulator.profit-conversion.test.js`, sobre la función real y con su tabla completa.
2. Las filas `USD 1400…2100` de la matriz en vivo son, a su vez, evidencia de **P-02**: la
   matriz se calcula con precios fijos que no salen del mercado.
3. Los 2 errores de consola del service worker son de la API de notificaciones
   (`Unable to download all specified images`): intenta bajar imágenes de notificación en este
   entorno. No son del rediseño ni de los arreglos; el popup y la página de configuración
   cierran con **0 errores**.

### Reproducir las capturas

```bash
PREFIJO=despues npx playwright test --config=playwright.capturas.config.js
```

Salida en `docs/auditoria-2026-09/rediseno/`:

| Archivo | Qué muestra |
|---|---|
| `antes-01-arriba.png` / `despues-01-arriba.png` | La cabecera y la primera tarjeta, comparables |
| `antes-02-full.png` / `despues-02-full.png` | Página completa con todas las secciones desplegadas |
| `despues-03-fees.png` / `despues-04-interfaz.png` | Sección de fees y de interfaz a tamaño real |
| `despues-metricas.json` | Las mediciones de arriba |

---

## 5. Lo que queda como decisión del usuario

1. **Emoji en etiquetas de opciones** (🔥 Consenso, 🧭 Automático, ✏️ Manual, banderas de
   exchanges): se conservan porque identifican opciones concretas. Se pueden sacar.
2. **Estado inicial de las 8 tarjetas**: hoy vienen **todas desplegadas**, o sea ~5000px de
   scroll. Lo natural en un panel de este tamaño es dejar abierta sólo la primera (o ninguna)
   y que el usuario abra lo que necesita. Es un cambio de una línea en `options.js`, pero
   altera cómo se usa la página, así que no lo decidí solo.
3. **Densidad**: la página pasó a ser clara y espaciosa. Si en Brave se prefiere el tema oscuro
   para trabajar de noche, el sistema Vercel tiene su modo oscuro (`#000000` de fondo, `#ededed`
   de texto, sombras con borde blanco al 0.15) y se puede implementar como variante con
   `prefers-color-scheme` sin tocar la estructura.

---

## 6. Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/options.css` | Reescritura completa con el sistema Vercel (845 → ~900 líneas) |
| `src/options.html` | 19 textos sin emoji decorativo (títulos y botones) |
| `tests/e2e/playwright/captura-options.spec.js` | Nuevo: capturas + mediciones de la extensión real |
| `playwright.capturas.config.js` | Nuevo: configuración de Playwright para las capturas |

Sin cambios en `options.js`: la lógica de guardado, la carga de settings y el armado de la
lista de fees siguen intactos.
