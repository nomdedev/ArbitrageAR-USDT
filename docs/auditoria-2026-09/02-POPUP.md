# Auditoría POPUP / UI — ArbitrageAR-USDT

Fecha: 2026-09-19 · Commit `5fdfa9e` (`docs: sync claude notes and analysis`) · Árbol limpio salvo
`docs/auditoria-2026-09/`.

Los hallazgos F-01..F-10 (orquestador), B-01..B-14 (background) y O-01..O-26 (options) **no se repiten**.
Los matices sobre ellos están en la sección "Matices sobre hallazgos ya registrados".

---

## Alcance

**Leídos completos**

| Archivo | Líneas |
|---|---|
| `src/modules/simulator.js` | 824 |
| `src/modules/filterManager.js` | 717 |
| `src/utils/formatters.js` | 194 |
| `src/renderHelpers.js` | 202 |

**Leídos por bloques (con `grep` sobre el resto)**

- `src/popup.js` (4697 líneas): 1-320, 405-534, 560-800, 854-1130, 1183-1706, 1876-2030, 2148-2200,
  2660-2820, 2903-2990, 3025-3090, 3891-3980, 4321-4465, 4680-4697.
- `src/popup.html` (1449): 960-1015, 1100-1340, 1355-1400 + grep de ids/aria/roles.
- `src/ui/tooltipSystem.js` (607): 1-130, 350-560.
- `src/modules/notificationManager.js` (672): 400-520.
- `src/modules/routeManager.js` (684): 210-245, 330-530, 650-684 + grep.
- `src/background/main-simple.js`: 736-800, 1895-1985, 2170-2216, 2036-2078 (contrato de mensajería
  y forma exacta de los objetos que consume el popup).

**No leídos (confesión)**: `src/popup.css` (4564 líneas) — sólo por `grep` (ids/clases citadas);
`src/modules/modalManager.js` completo; `src/ui/routeRenderer.js`; `src/ui-components/*` (los tres por
`grep`, son código muerto, ver P-16); `src/DataService.js`; `src/ValidationService.js`.

**Método de verificación**: 9 harnesses Node+jsdom (7 heredados del agente anterior, en
`C:\Users\epic\AppData\Local\Temp\arb-audit\probe*.js`, más `probe8.js` y `probe9.js` escritos en esta
sesión) que cargan el `popup.html` real con los 18 `<script>` reales, un `chrome` falso y fixtures de
datos; más **un test de comportamiento de plataforma en Chromium real** (vía CDP) para `<dialog>`.
Todas las corridas son de sólo lectura sobre el repo. Lo que no pude reproducir está marcado.

---

## Resumen

| ID | Severidad | Título | Archivo:línea |
|---|---|---|---|
| P-01 | ALTO | El botón "Configuración avanzada" del simulador no abre nunca: `Sim.init()` se llama dos veces y el toggle se cancela a sí mismo | `src/popup.js:116`, `:136`, `:3036` → `src/modules/simulator.js:198-219` |
| P-02 | ALTO | La matriz de riesgo se calcula siempre con precios fijos (USD 1000-1500, USDT 1000-1100), nunca con datos de mercado | `src/popup.js:116` → `src/modules/simulator.js:53`, `:512-537` |
| P-03 | MEDIO | La conversión USD→USDT del simulador está fabricada y sobreestima la ganancia entre 2,5 y 10,8 puntos porcentuales | `src/modules/simulator.js:700-701` |
| P-04 | MEDIO | El simulador usa el precio de **compra** del dólar; el motor usa el de **venta** | `src/modules/simulator.js:66`, `:469`, `:500`, `:512` vs `src/background/main-simple.js:805`, `:1005` |
| P-05 | MEDIO | "Aplicar filtro" de la matriz ignora los dos inputs del usuario y filtra siempre con `-5..10` | `src/modules/simulator.js:249-255` vs `:731` |
| P-06 | MEDIO | El modal de detalles no se cierra con Escape ni recibe el foco: usa `display:flex` en vez de `showModal()` | `src/popup.js:1662` vs `src/modules/notificationManager.js:461` |
| P-07 | MEDIO | El popup no puede distinguir "la API falló" de "no hay oportunidades"; la única pantalla que lo diría es inalcanzable | `src/popup.js:910-915`, `:1039-1049`, `src/background/main-simple.js:2052` |
| P-08 | MEDIO | Toda la UI de "datos cacheados / datos obsoletos" es inalcanzable | `src/popup.js:856-869`, `src/background/main-simple.js:1967`, `src/popup.html:977`, `:980` |
| P-09 | MEDIO | Accesibilidad: 0 `role`/ARIA de estado en todo el popup; las tarjetas de ruta no se pueden abrir con teclado | `src/modules/routeManager.js:375-378`, `src/popup.html:1016-1031`, `src/popup.js:268-299` |
| P-10 | MEDIO | "Resetear" del simulador no resetea nada: sale por un `return` porque busca 3 ids que no existen | `src/modules/simulator.js:412-424` |
| P-11 | BAJO | El estado vacío informa "Umbral: 1%" siempre: lee una clave que nadie escribe | `src/modules/routeManager.js:431`, `:481`, `src/popup.js:437` |
| P-12 | BAJO | El "Monto del simulador" configurado en Ajustes nunca llega al popup | `src/options.js:814` vs `src/popup.js:470`, `:688`, `src/popup.html:1122` |
| P-13 | BAJO | Números con formato inconsistente: punto decimal y sin separador de miles en la matriz, el modal de detalle y las tarjetas cripto | `src/modules/simulator.js:633-661`, `src/popup.js:1901`, `:1976`, `:3919` |
| P-14 | BAJO | El "sanitizador" del sistema de tooltips no hace nada y el contenido se inyecta con `innerHTML` (latente) | `src/ui/tooltipSystem.js:527-534` |
| P-15 | BAJO | `initMagneticButtons()` acumula 1 `MutationObserver` y 2 listeners por tarjeta en cada re-render, sin `disconnect()` | `src/popup.js:4394-4404`, `:1466` |
| P-16 | COSMÉTICO | ~1500 líneas de código muerto en el popup, 35 de 52 iconos del sprite sin usar y un archivo SVG que nadie referencia | (tabla en el hallazgo) |
| P-17 | BAJO | "Recalcular con precio personalizado" usa `prompt`/`alert` nativos y con un valor inválido no hace nada ni avisa | `src/popup.js:3141-3166` |

Resumen cuantitativo: **2 ALTO, 8 MEDIO, 6 BAJO, 1 COSMÉTICO**. De los 17, **5 (P-01, P-02, P-03,
P-05, P-10) están dentro del simulador** y **4 (P-07, P-08, P-16, M-01/M-02) son consecuencia de
código muerto o de datos que el background nunca envía**. Los dos ALTO son ambos alcanzables por el
usuario final en dos clicks (pestaña Simulador → engranaje / → Calcular).

Método: cada hallazgo tiene una reproducción ejecutable (`probe*.js`) o un `grep` de una línea;
ninguno se apoya en "podría ser". Los que dependen de inferencia están en la última sección.

---

## Hallazgos

### P-01 — ALTO — El botón "Configuración avanzada" del simulador no abre nunca: `Sim.init()` se llama dos veces y el toggle se cancela a sí mismo

**Evidencia** — `src/popup.js:113-136` (inicialización):

```js
116|    Sim.init(currentData, userSettings);
...
136|    setupAdvancedSimulator();
```

y `src/popup.js:3034-3037`:

```js
3034|function setupAdvancedSimulator() {
3035|  // Delegar configuración completa al módulo Simulator
3036|  return Sim.init(currentData, userSettings);
3037|}
```

`Simulator.init()` llama a `setupEventListeners()` **sin ninguna guarda de idempotencia** —
`src/modules/simulator.js:198-203`:

```js
198|  function init(data, settings) {
199|    currentData = data;
200|    userSettings = settings;
201|    setupEventListeners();
```

y el handler del toggle tiene lógica de alternancia basada en el estado actual
(`src/modules/simulator.js:213-219`):

```js
213|    if (toggleAdvanced && advancedConfig) {
214|      toggleAdvanced.addEventListener('click', () => {
215|        const isHidden = advancedConfig.style.display === 'none';
216|        advancedConfig.style.display = isHidden ? 'block' : 'none';
```

Como el listener está registrado **dos veces** en el mismo elemento, un click ejecuta el handler
dos veces: el primero pone `display:block`, el segundo lee `'block'` (ya no es `'none'`), concluye
`isHidden = false` y lo vuelve a poner en `'none'`. Resultado neto: **el panel no se abre jamás**.

**Reproducción ejecutada** (`node probe7.js`, jsdom con el `popup.html` real):

```
#toggle-advanced: {"click":2}
#btn-reset-config: {"click":2}
#btn-calculate-matrix: {"click":2}
#generate-risk-matrix: {"click":2}
#apply-matrix-filter: {"click":2}
#reset-matrix-filter: {"click":2}
== toggle de configuracion avanzada ==
display inicial (inline): "none"
tras 1 click: "none"
tras 2 clicks: "none"
```

Los otros seis botones también quedan con el handler duplicado (cada click ejecuta el cálculo o el
reset dos veces), pero en ellos el efecto es sólo trabajo duplicado. En el toggle el efecto es que la
función no existe para el usuario.

**Qué está mal**: `setupEventListeners()` no es idempotente y `init()` se invoca dos veces desde el
mismo `DOMContentLoaded` (línea 116 y, indirectamente, línea 136).

**Impacto**: el único acceso a los 6 campos de configuración del simulador (precios USD de compra y
venta, fees de compra y venta, transferencia, comisión bancaria) y a los botones "Calcular" y
"Resetear" es el engranaje `#toggle-advanced` (`src/popup.html:1128`). El usuario hace click y **no
pasa nada**: cree que la extensión está rota y que el simulador "no se puede configurar". Los
controles de la matriz (rango USD/USDT, filtro) sí están visibles, así que la pantalla parece
funcional.

**Fix propuesto**: una sola llamada y una guarda en el módulo:

```js
// popup.js: eliminar la línea 116 (o la 136), dejar una sola.
// simulator.js:
let listenersReady = false;
function setupEventListeners() {
  if (listenersReady) return;
  listenersReady = true;
  ...
}
```

**Cómo verificar que quedó bien**: `node probe7.js` debe imprimir `{"click":1}` para los 7 botones y
`tras 1 click: "block"` / `tras 2 clicks: "none"`. En runtime: abrir el popup, pestaña Simulador,
click en el engranaje → aparecen los 6 campos.

---

### P-02 — ALTO — La matriz de riesgo se calcula siempre con precios fijos (USD 1000-1500, USDT 1000-1100), nunca con datos de mercado

**Evidencia** — el simulador guarda su propio `currentData` (`src/modules/simulator.js:53-54`) y lo
único que lo escribe es `init()`:

```js
53|  let currentData = null;
54|  let userSettings = null;
```

```js
198|  function init(data, settings) {
199|    currentData = data;
```

Las dos llamadas a `Sim.init()` pasan `currentData` **cuando todavía vale `null`**
(`src/popup.js:65` `let currentData = null;`, y el popup lo asigna recién en
`handleSuccessfulData`, `src/popup.js:877`):

```js
116|    Sim.init(currentData, userSettings);
```

```js
3036|  return Sim.init(currentData, userSettings);
```

`grep -rn "Sim\.updateData\|Simulator\.updateData" src/` → **0 coincidencias**: el módulo exporta
`updateData` (`src/modules/simulator.js:803`) y **nadie lo llama nunca**. Tampoco `updateSettings`.
Consecuencia: todas las lecturas de datos reales del simulador caen al fallback —
`src/modules/simulator.js:495-537`:

```js
495|      const banksData = getBanksData();          // currentData?.banks → siempre undefined
...
511|      if (usdPrices.length === 0) {
512|        const usdMin = currentData?.oficial?.compra || 1000;
513|        const usdMax = usdMin * 1.5;
514|        usdPrices.push(...generateEquidistantPrices(usdMin, usdMax, 5));
...
518|      const usdtData = getUSDTData();            // currentData?.usdt → siempre undefined
...
533|      if (usdtPrices.length === 0) {
534|        const usdtMin = 1000;
535|        const usdtMax = 1100;
536|        usdtPrices.push(...generateEquidistantPrices(usdtMin, usdtMax, 5));
```

**Reproducción ejecutada** (`node probe8.js`, fixture con `oficial.compra = 1400`,
`oficial.venta = 1450`, USDT/ARS real de 5 exchanges entre 1470 y 1490):

```
=== (a) matriz de riesgo en modo AUTOMATICO con datos reales cargados ===
   encabezados de la matriz (precios USDT): ["USD Compra \\ USDT Venta","$1000","$1025","$1050","$1075","$1100"]
   eje USD de la matriz: ["$1000","$1125","$1250","$1375","$1500"]
   primera fila (precio USD usado): ["$1000","-1.99%","2.97%","8.06%","13.26%","18.59%"]
   >> oficial.compra real = 1400, oficial.venta real = 1450
```

El popup tenía los datos reales cargados en `#optimized-routes` y en el dólar oficial; la matriz
igual usa el eje fijo 1000→1500 y USDT 1000→1100. El propio código del simulador lo declara en el
log (`src/modules/simulator.js:494` `// MODO AUTOMÁTICO con datos reales`).

**Qué está mal**: el botón "Calcular" (`#btn-calculate-matrix`, `useCustomParams = false`, o sea el
"modo automático con datos reales") nunca recibe datos. La desconexión es de una línea: nadie llama a
`Sim.updateData(data)`.

**Impacto**: la matriz le muestra al usuario combinaciones de precios que **no existen** (USDT a
1000-1100 ARS cuando el mercado está en ~1490) y le calcula ganancias en esas celdas (hasta
**+18,59%** en el ejemplo). Es el único instrumento "de análisis" de la herramienta: un usuario que
lo use para decidir el momento de entrar está mirando escenarios inventados, sin ningún cartel que
lo advierta. Con el dólar a 1450, el eje 1000-1500 hace además que 4 de las 5 filas sean
inalcanzables.

**Fix propuesto**:

```js
// popup.js, en handleSuccessfulData(data, container) después de `currentData = data;`
Sim.updateData(data);
RteMgr.updateData(data);      // mismo problema en RouteManager (init con null)

// y en loadUserSettings(), al final:
Sim.updateSettings(userSettings);
```

Y en `generateRiskMatrix`, si `!currentData` y `!useCustomParams`, no calcular: mostrar
`showSimulatorMessage(null, '⚠️ Sin datos de mercado todavía', 'warning')` en lugar de inventar el
rango.

**Cómo verificar que quedó bien**: `node probe8.js` con el fixture de 1400/1490 debe imprimir
`eje USD de la matriz: ["$1400",...]` y encabezados USDT alrededor de 1470-1490. En runtime: abrir el
popup con datos cargados y comprobar que la primera fila de la matriz coincide con el dólar real.

---

### P-03 — MEDIO — La conversión USD→USDT del simulador está fabricada y sobreestima la ganancia entre 2,5 y 10,8 puntos porcentuales

**Evidencia** — `src/modules/simulator.js:697-712`:

```js
697|    const step1_usd = amountAfterBankCommission / usdPrice;
698|
699|    // Paso 3: Comprar USDT con USD
700|    const usdToUsdtRate = usdPrice / usdtPrice;
701|    const step2_usdt = step1_usd / usdToUsdtRate;
```

La tasa de conversión se **fabrica** dividiendo los dos precios en pesos. Como
`step2_usdt = step1_usd · (usdtPrice / usdPrice)`, cuanto más caro está el USDT en pesos, **más USDT**
dice el simulador que recibe el usuario: la economía está invertida.

**Reproducción ejecutada** (aritmética del código copiada literal vs. el mismo camino con conversión
1:1, que es lo que usa el motor real vía `resolveUsdToUsdtRate(usdtUsd, …)` en
`src/background/main-simple.js:700`, `:881`; 1.000.000 ARS, USD 1000, fees 1% + 1%):

| USDT/ARS | Simulador (`usdPrice/usdtPrice`) | Conversión 1:1 (real) | Diferencia |
|---|---|---|---|
| 1000 | −1,99% | −1,99% | 0 |
| 1025 | **+2,97%** | +0,46% | +2,51 pp |
| 1050 | **+8,06%** | +2,91% | +5,15 pp |
| 1075 | **+13,26%** | +5,36% | +7,90 pp |
| 1100 | **+18,59%** | +7,81% | +10,78 pp |

Los valores de la columna "simulador" son exactamente las celdas que imprimió `probe8.js` sobre el
código real. Cuando `usdtPrice === usdPrice` (tasa 1) las dos columnas coinciden, lo que confirma que
el factor extra es exactamente `(usdtPrice / usdPrice)`.

**Qué está mal**: la app **tiene** una fuente real de USD→USDT (`usdtUsd`, de CriptoYa, consumida por
el motor) y el simulador no la usa: inventa una tasa a partir del spread en pesos y la aplica en el
sentido equivocado.

**Impacto**: combinado con P-02 (donde el rango es fijo), cualquier usuario que suba el USDT de la
matriz ve crecer la ganancia a un ritmo que no corresponde a la operación real: en el rango que
importa (1-5%) el simulador **duplica** el resultado y muestra como rentable (2,97%) una operación
que es casi neutra (0,46%). Es la misma clase de error que F-01 (sobreestimar la ganancia) pero en el
módulo del simulador.

**Fix propuesto**: usar la tasa real cuando exista, y si no, conversión 1:1 (que es la aproximación
correcta para USD→USDT), nunca la relación entre dos precios en pesos:

```js
const usdToUsdtRate = currentData?.usdtUsd?.[buyExchange]?.compra || 1;
const step2_usdt = step1_usd / usdToUsdtRate;
```

**Cómo verificar que quedó bien**: con `usdPrice = 1000`, `usdtPrice = 1050`, fees 1%/1% y monto
1.000.000, la celda debe dar ≈ +2,91% (no +8,06%).

---

### P-04 — MEDIO — El simulador usa el precio de **compra** del dólar; el motor usa el de **venta**

**Evidencia** — `src/modules/simulator.js:65-67`, `:500`, `:512`:

```js
65|  function getCurrentDollarPrice() {
66|    return currentData?.dollarPrice || currentData?.oficial?.compra || 950;
67|  }
```

```js
499|          .filter(bank => bank.compra && bank.compra > 0)
500|          .map(bank => bank.compra)
```

```js
512|        const usdMin = currentData?.oficial?.compra || 1000;
```

Mientras que el motor de rutas, que es el que produce los números del producto, usa el **venta**
(`src/background/main-simple.js:805` y `:1005`):

```js
805|  const officialPrice = oficial.venta;
```

```js
1005|  const officialPrice = oficial.venta; // CORREGIDO: Usar precio de venta (lo que pagan los usuarios)
```

El popup, en el otro camino que sí está vivo, también usa venta — `src/popup.js:3130`
`const currentPrice = currentData?.oficial?.venta || 1000;`.

**Qué está mal**: la ruta objetivo es "ARS → USD (banco oficial)", es decir el usuario **compra**
dólares: paga el precio de **venta** del banco. `compra` es el precio al que el banco *le compra* los
dólares al cliente. El simulador usa ese lado del spread.

**Impacto**: con la configuración típica (compra 1400 / venta 1450) el simulador asume que el usuario
consigue los dólares **3,4% más baratos** de lo posible; como el resultado es proporcional a
`usdtPrice / usdPrice`, ese solo error mueve la ganancia por varios puntos porcentuales en la misma
dirección que P-03. Y produce una inconsistencia visible dentro de la misma app: la tarjeta de la
ruta dice "Precio dólar oficial $1.450,00" y el simulador evalúa el escenario a 1400. (Marcado:
hoy el impacto está contenido por P-02, porque `currentData` es `null` y siempre cae al 1000 fijo;
se materializa en cuanto se arregle P-02.)

**Fix propuesto**: usar `oficial.venta` en las tres líneas (66, 500, 512), igual que
`main-simple.js:1005` y `popup.js:3130`.

**Cómo verificar que quedó bien**: `grep -n "oficial?.compra\|bank.compra" src/modules/simulator.js`
→ 0 líneas; en runtime, con dólar oficial 1400/1450, la fila "Auto" de la matriz debe partir de 1450.

---

### P-05 — MEDIO — "Aplicar filtro" de la matriz ignora los dos inputs del usuario y filtra siempre con `-5..10`

**Evidencia** — el handler del botón llama a la función **sin argumentos**
(`src/modules/simulator.js:249-255`):

```js
249|    const btnApplyFilter = document.getElementById('apply-matrix-filter');
250|    if (btnApplyFilter) {
251|      btnApplyFilter.addEventListener('click', () => {
252|        window.Logger?.debug('🔍 [Simulator] Aplicando filtro de matriz');
253|        applyMatrixFilter();
254|      });
```

y la función tiene defaults hardcodeados que son los que rigen
(`src/modules/simulator.js:731`):

```js
731|  function applyMatrixFilter(minProfit = -5, maxProfit = 10) {
```

Los dos controles que el usuario sí ve en pantalla son `#filter-min-profit` y `#filter-max-profit`
(`src/popup.html:1279-1297`, con `value="-5"` y `value="10"`), y la función **nunca los lee**:
`grep -n "filter-min-profit" src/modules/simulator.js` → 0 coincidencias.

**Reproducción ejecutada** (`probe8.js`, se cargan `5` y `5,5` en los dos inputs y se hace click):

```
   con #filter-min-profit=5 y #filter-max-profit=5.5 -> celdas atenuadas: 22 de 30
   #filter-count dice: 3
   rango de valores en la matriz: -56.44 a 18.59
```

Con el rango pedido (5 a 5,5) **todas** las celdas deberían quedar atenuadas y el contador en 0. El
resultado real (8 celdas resaltadas, contador 3, o sea 3 en el rango −5..10 del código) prueba que se
usó el default.

**Impacto**: el usuario escribe "Filtrar: 5% a 5,5%", clickea y la app le resalta otro rango (de −5% a
10%). El contador "3 combinaciones" no corresponde a lo que pidió. En una matriz de 25 celdas con
valores de −56% a +18%, filtrar es la única forma de leerla; el control está puesto en la pantalla y
no hace nada de lo que promete.

**Fix propuesto**:

```js
btnApplyFilter.addEventListener('click', () => {
  const min = parseFloat(document.getElementById('filter-min-profit')?.value);
  const max = parseFloat(document.getElementById('filter-max-profit')?.value);
  applyMatrixFilter(Number.isFinite(min) ? min : -5, Number.isFinite(max) ? max : 10);
});
```

**Cómo verificar que quedó bien**: con 5 y 5,5 en los inputs y una matriz como la del fixture, el
contador debe decir `0` y todas las celdas deben quedar atenuadas.

---

### P-06 — MEDIO — El modal de detalles no se cierra con Escape ni recibe el foco: usa `display:flex` en vez de `showModal()`

**Evidencia** — el elemento es un `<dialog>` (`src/popup.html:1400-1403`):

```html
1400|        class="modal-overlay"
1401|        id="route-details-modal"
```

y se muestra por estilo inline, sin abrir el diálogo (`src/popup.js:1661-1668`):

```js
1661|  // Mostrar modal con animación
1662|  modal.style.display = 'flex';
1663|  requestAnimationFrame(() => {
1664|    modal.classList.add('active');
1665|  });
1666|
1667|  // Configurar botón de cerrar
1668|  setupModalCloseButton(modal);
```

El mismo repo usa el API correcto en el otro modal del popup
(`src/modules/notificationManager.js:460-461`):

```js
460|    // Mostrar modal usando el API nativo de dialog
461|    modal.showModal();
```

**Verificación en Chromium real** (vía CDP, página con
`<dialog id="d" style="display:flex">`, instrumentada y observada):

```
{attrOpen:false, elOpen:false, computedDisplay:"flex", inTopLayer:1, active:"BODY"}
tras ESC:      {elOpen:false, computedDisplay:"flex", inlineStyle:"flex"}   ← Escape no cierra
--- ahora con showModal() ---
{elOpen:true, display:"block"}
tras ESC (showModal): {elOpen:false, display:"none"}                        ← Escape sí cierra
```

Y sobre el popup real, en jsdom (`probe8.js` / `probe4.js`):

```
   display del modal: flex | dialog.open: false
   aria-modal: (vacío)
   foco tras abrir modal: BODY
   tras ESC: style.display = flex          ← no se cierra
```

**Qué está mal**: al no usar `showModal()`, el `<dialog>` no entra en el *top layer* ni en el estado
"modal": el navegador no aporta cierre con Escape, ni trampa de foco, ni `inert` sobre el resto del
popup, ni semántica `aria-modal`. El cierre por backdrop y por la X está implementado a mano
(`src/popup.js:1674-1695`) y funciona, pero el teclado queda afuera.

**Impacto**:
- Un usuario de teclado que abre "Ver detalles" de una ruta (o cualquiera que pulse Escape por
  costumbre) **no puede cerrar el modal con Escape**: el panel tapado por el overlay a pantalla
  completa (`.modal-overlay` con `position:fixed; background:rgba(1,4,9,.85)`, `src/popup.css:3428`)
  sólo se cierra con el mouse en la X o en el borde.
- El foco queda en `<body>` al abrir: el usuario de teclado tiene que tabular desde el principio del
  popup para llegar al contenido del modal, y si tabula sale del modal hacia los controles de atrás.
- Para un lector de pantalla, el contenido del popup que quedó atrás sigue siendo navegable.

**Fix propuesto**:

```js
modal.showModal();            // reemplaza modal.style.display = 'flex'
modal.classList.add('active');
// y en los dos caminos de cierre:
modal.close();                // en vez de modal.style.display = 'none'
```

Si se mantiene el estilo inline por el layout, el mínimo es: un `keydown` con `Escape` que cierre,
`modal.setAttribute('aria-modal','true')` + `role="dialog"` y `closeBtn.focus()` al abrir.

**Cómo verificar que quedó bien**: con el popup abierto, click en una ruta y luego Escape → el modal
debe cerrarse; `document.activeElement` al abrir debe estar dentro del modal;
`document.getElementById('route-details-modal').open === true`.

---

### P-07 — MEDIO — El popup no puede distinguir "la API falló" de "no hay oportunidades"; la única pantalla que lo diría es inalcanzable

**Evidencia** — el mensaje que ve el usuario cuando no hay rutas
(`src/popup.js:910-914`):

```js
910|  if (data.optimizedRoutes.length === 0) {
911|    console.warn('⚠️ optimizedRoutes está vacío');
912|    container.innerHTML =
913|      '<p class="info">📊 No se encontraron rutas rentables en este momento.</p>';
914|    return;
```

La pantalla que **sí** habla de APIs caídas existe (`src/popup.js:1039-1048`):

```js
1039|        if (data.backgroundUnhealthy) {
1040|          container.innerHTML = `
1041|          <div class="error-container">
1042|            <h3>🏥 Background No Saludable</h3>
1043|            <p>Las APIs externas no están disponibles.</p>
```

pero `backgroundUnhealthy` se emite en **un solo lugar de todo el background**, y no es un fallo de
API sino el timeout interno de 12 s (`src/background/main-simple.js:2048-2057`):

```js
2048|  const responseTimeoutId = setTimeout(() => {
2049|    console.error(`⏰ [BACKGROUND] TIMEOUT: getArbitrages excedió ${MESSAGE_TIMEOUT_MS}ms`);
2050|    safeSendResponse({
2051|      timeout: true,
2052|      backgroundUnhealthy: true,
2053|      error: `Timeout interno del background (${MESSAGE_TIMEOUT_MS}ms)`,
```

Cuando las APIs fallan de verdad, el background responde con `error` y `optimizedRoutes: []`
(`src/background/main-simple.js:2062-2063`), y el popup lo trata así: `data.error` no contiene
`'Inicializando'` (línea 1052) y `retryCount` es 0 (línea 1058), así que cae en
`handleSuccessfulData`, que para las rutas vacías **nunca llega a la línea 893** (`if (data.error && …`)
porque la 910 corta antes — es decir que **el mensaje de error del background se descarta** y el
usuario ve "No se encontraron rutas rentables en este momento".

Las 5 pantallas de "sin datos" que el popup sabe renderizar están en `src/popup.js:789`
(`handleNoData`, "Sin conexión"), `:814` (reintentos), `:837` (máximo de reintentos), `:912` (vacío) y
`:1040` (background no saludable). La única alcanzable ante un fallo real de API es la de "vacío".

**Qué está mal**: el orden de los `if` en `fetchAndDisplay`/`handleSuccessfulData` descarta el `error`
que el background sí manda, y el estado "background no saludable" quedó atado al timeout interno. No
hay ninguna pantalla para "las APIs fallaron, no sabemos si hay oportunidades".

**Impacto**: falso negativo silencioso en la única función del producto, visto desde el popup. Si
CriptoYa está caído (o devuelve 429), el usuario lee "No se encontraron rutas rentables en este
momento" y concluye que hoy no hay oportunidad — con datos que nunca llegaron. Nota de relación:
B-05 documenta la causa en el background (`cachedUsdtData || {}` y `error: null`); este hallazgo es el
lado del popup: **aun cuando el background informe el error, esta pantalla lo tapa**.

**Fix propuesto**: invertir el orden y contemplar el caso "datos incompletos":

```js
if (data.error && !data.usingCache) {          // mover ANTES del chequeo de rutas vacías
  mostrarErrorConReintento(container, data.error);
  return;
}
if (data.optimizedRoutes.length === 0) {
  container.innerHTML = data.degraded
    ? '<p class="warning">⚠️ No se pudieron leer los precios de todas las fuentes: no podemos saber si hay oportunidades.</p>'
    : '<p class="info">📊 No se encontraron rutas rentables en este momento.</p>';
  return;
}
```

y en el background devolver `degraded: true` cuando `usdt` o `usdtUsd` vengan del fallback (B-05).

**Cómo verificar que quedó bien**: bloquear `criptoya.com` en DevTools → Network con el popup abierto
debe verse el aviso de datos incompletos (y no la lista vacía); `node probe.js` con el fixture
`{error:'Error interno al obtener arbitrajes. Intenta nuevamente.'}` debe imprimir ese texto.

---

### P-08 — MEDIO — Toda la UI de "datos cacheados / datos obsoletos" es inalcanzable

**Evidencia** — `src/popup.js:856-869`:

```js
856|function handleCacheIndicator(data, retryCount) {
857|  const cacheIndicator = document.getElementById('cache-indicator');
858|  if (!cacheIndicator) return;
859|
860|  if (data.usingCache) {
861|    cacheIndicator.style.display = 'block';
```

y el otro bloque de frescura, `src/popup.js:2972` (`updateTimestampWithFreshness`) y `:2984`
(`showDataFreshnessWarning`, que escribe `#data-warning`, `src/popup.html:980`).

`usingCache` está **hardcodeado en `false`** en el background — única aparición en el archivo
(`src/background/main-simple.js:1967`):

```js
1967|      usingCache: false
```

Por lo tanto `#cache-indicator` (`src/popup.html:977`, `style="display: none"`) nunca se muestra y
`#data-warning` (`:980`, ídem) tampoco. Las tres funciones que alimentarían esos avisos son código
muerto: `grep -rn "showDataFreshnessWarning\|updateTimestampWithFreshness\|getDataFreshnessLevel" src/`
devuelve sólo sus definiciones, su export en `window.PopupLegacyApi` (`src/popup.js:4409`, `:4427`,
`:4428`) y **cero llamadas**.

**Lo que sí funciona (para no inflar el hallazgo)**: el punto de estado del footer cambia a *stale*
cuando `data.lastUpdate` tiene más de 5 minutos (`src/popup.js:517` `if (ageMinutes > 5) {`), y
`.connection-status.stale .status-dot` existe en el CSS (`src/popup.css:4186`). Es el único indicador
de antigüedad real, y es un punto de color sin texto ("el usuario ve `--:--:--` o una hora, no un
aviso").

**Impacto**: el popup tiene construida una UI para avisar "estos datos son viejos", el switch
"Advertir datos obsoletos" existe en Ajustes (`src/options.js:49`, `:887`, `:209`) y el popup lee la
clave (`src/popup.js:427`) — pero **nada de eso puede producir un aviso**, porque el flag que
dispara el camino está fijo en `false` y las funciones consumidoras no tienen callers. El usuario que
activa ese switch (o que confía en que existe) nunca verá una advertencia de datos viejos: sólo un
punto que cambia de color en el borde inferior.

**Fix propuesto**: decidir una sola semántica de frescura y una sola señal visible:

1. En el background, `usingCache: !!cachedDataUsed` (con el flag real que ya se calcula al elegir el
   fallback), en vez del literal `false`.
2. Llamar `updateConnectionStatus`/`showDataFreshnessWarning` desde `handleSuccessfulData` cuando
   `ageMinutes > 5` y `userSettings.dataFreshnessWarning` esté activo (y borrar las dos funciones
   duplicadas que quedaron sin callers).

**Cómo verificar que quedó bien**: dejar el popup cerrado 10 minutos, reabrirlo y comprobar que
aparece el banner de datos obsoletos (`#data-warning` visible) con la hora real de la última
actualización.

---

### P-09 — MEDIO — Accesibilidad: 0 `role`/ARIA de estado en todo el popup; las tarjetas de ruta no se pueden abrir con teclado

**Evidencia** — `src/modules/routeManager.js:375-378` (renderizador **vivo** de las tarjetas):

```js
375|    const card = document.createElement('div');
376|    card.className = `route-card ${profitClass} ${routeType} ${compactClass}`;
377|    card.dataset.index = index;
378|    card.dataset.route = escapedRouteData;
```

No hay `tabindex`, ni `role="button"`, ni `aria-label`; el click se maneja en `:586-610`. El
renderizador **muerto** (`src/renderHelpers.js:98-99`) sí los tiene, lo que prueba que era la
intención:

```js
98|      <div class="route-card ${profitClass} ${isP2P ? 'is-p2p' : 'is-direct'}" data-index="${index}" data-route='${routeData}'
99|           role="button" tabindex="0" aria-label="Ruta: ${routeDescription}, ganancia ${profitSymbol}...
```

Pestañas (`src/popup.html:1016-1031`): cuatro `<button class="tab" ... aria-label>` con un estado
`active` que **sólo es una clase CSS** — sin `role="tablist"` en el contenedor, sin `role="tab"`, sin
`aria-selected`, sin navegación con flechas; el manejador (`src/popup.js:271-299`) sólo escucha
`click`.

Mediciones sobre el HTML real (`node probe9.js`):

```
  <svg> sin aria-hidden: 25      <svg> totales: 27
  <button> totales: 22           <button> con aria-label: 14   con title: 8
  <button> con solo <svg> dentro (sin texto): 14
  role= presentes: []            tabindex en html: 0
```

y sobre el DOM renderizado (`probe2.js` / `probe8.js`):

```
  role=tablist en .tabs?: false
  aria-selected en .tab?: false
  .route-card tabindex: (vacío) | role: (vacío)
```

**Qué está mal**: (a) los elementos más importantes de la pantalla (las tarjetas de ruta, que son
botones de facto y abren el modal de detalle) no son alcanzables ni activables por teclado: no
aparecen en el orden de tabulación y no hay handler de `keydown`; (b) el widget de pestañas no expone
su semántica a los lectores de pantalla; (c) 14 botones sólo-icono dependen del atributo `title` para
tener nombre accesible y sus `<svg>` no están marcados `aria-hidden`, así que el lector puede anunciar
ruido.

**Impacto**: la extensión es inoperable con teclado más allá de los 4 botones de pestaña y los
inputs: para ver el paso a paso de una ruta (el contenido que la hace útil) hace falta mouse. Un
usuario con lector de pantalla escucha "botón" en las pestañas sin saber cuál está seleccionada, y no
recibe las tarjetas.

**Fix propuesto**:

```js
// routeManager.js, createRouteElement
card.setAttribute('role', 'button');
card.setAttribute('tabindex', '0');
card.setAttribute('aria-label', `Ruta ${route.buyExchange} → ${route.sellExchange}, ganancia ${displayMetrics.percentage.toFixed(2)}%`);
card.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
});
```

y en el HTML de pestañas: `role="tablist"` en `.tabs`, `role="tab"` + `aria-selected` en cada botón,
`role="tabpanel"` + `aria-labelledby` en las secciones, y `aria-hidden="true"` en los `<svg>`
decorativos.

**Cómo verificar que quedó bien**: recorrer el popup sólo con Tab/Enter y abrir el detalle de una
ruta; `axe`/Lighthouse sin violaciones de "interactive controls must be focusable" y "ARIA tab
required".

---

### P-10 — MEDIO — "Resetear" del simulador no resetea nada: sale por un `return` porque busca 3 ids que no existen

**Evidencia** — `src/modules/simulator.js:404-438`:

```js
405|    const elements = {
406|      usdBuy: document.getElementById('sim-usd-buy-price'),
...
412|      matrixMin: document.getElementById('matrix-min-percent'),
413|      matrixMax: document.getElementById('matrix-max-percent'),
414|      matrixStep: document.getElementById('matrix-step-percent')
415|    };
416|
417|    const missingElements = Object.entries(elements)
418|      .filter(([_key, value]) => !value)
419|      .map(([key]) => key);
420|
421|    if (missingElements.length > 0) {
422|      console.warn('⚠️ [Simulator] Elementos faltantes en reset:', missingElements);
423|      return;
424|    }
```

Los tres ids no existen en el documento: `grep -o 'id="sim-[a-z-]*"' src/popup.html` devuelve
`sim-amount`, `sim-bank-commission`, `sim-buy-fee`, `sim-sell-fee`, `sim-transfer-fee-usd`,
`sim-usd-buy-price`, `sim-usd-sell-price`, y ninguno empieza con `matrix-` salvo los cuatro del rango
(`matrix-usd-min|max`, `matrix-usdt-min|max`, `src/popup.html:1230-1267`). El guard de "faltan
elementos" **aborta la función completa** (línea 423) antes de las asignaciones de `:427-435` y de
`loadDefaultValues()` de `:438`.

**Reproducción ejecutada** (`node probe6.js`, valores sucios y click en el botón):

```
  == click en #btn-reset-config ==
  despues del click: sim-usd-buy-price = 9999 | sim-sell-fee = 7.5
  mensajes de consola: ["WARN ⚠️ [Simulator] Elementos faltantes en reset: matrixMin,matrixMax,matrixStep", ...x2]
```

**Qué está mal**: el guard trata como "faltan elementos críticos" a tres inputs de la vieja matriz de
porcentajes que ya no existen, y en lugar de resetear lo que sí está, no hace nada. (El `x2` del
warning es P-01: el handler corre dos veces.)

**Impacto**: el usuario carga precios/fees "de prueba" (9999 y 7,5%), clickea la flecha de reset y los
valores quedan igual; toda la matriz posterior se calcula con esos números, sin ninguna señal de que
el reset falló. Hoy el botón vive en el panel que P-01 mantiene cerrado, así que el defecto se
materializa en cuanto se arregle P-01 — y es exactamente el caso de uso "volver a valores por
defecto después de un escenario".

**Fix propuesto**: separar lo obligatorio de lo opcional:

```js
const requeridos = { usdBuy, usdSell, buyFee, sellFee, transferFee, bankCommission };
const faltantes = Object.entries(requeridos).filter(([, el]) => !el).map(([k]) => k);
if (faltantes.length > 0) { console.warn('…', faltantes); return; }
// los matrixMin/Max/Step se resetean sólo si existen:
if (matrixMin) matrixMin.value = '0';
```

**Cómo verificar que quedó bien**: con el panel abierto, poner `sim-sell-fee = 7.5`, click en reset y
comprobar que el campo vuelve a `1.00`; `node probe6.js` debe imprimir
`despues del click: sim-sell-fee = 1.00`.

---

### P-11 — BAJO — El estado vacío informa "Umbral: 1%" siempre: lee una clave que nadie escribe

**Evidencia** — `src/modules/routeManager.js:429-432` y `:478-482` (renderizador vivo del estado vacío):

```js
429|    if (!routes || routes.length === 0) {
430|      const threshold = interfaceSettings.profitThreshold || 1.0;
431|      const routeType = interfaceSettings.routeType || 'arbitrage';
```

```html
478|          <div class="empty-state-config">
479|            <span class="config-badge">
480|              <span class="config-icon">⚙️</span>
481|              Umbral: ${threshold}% · Tipo: ${routeType}
```

`profitThreshold` sólo se **lee** en el repo: `grep -rn "profitThreshold" src/` devuelve cuatro
coincidencias y todas son lecturas (`routeManager.js:431`, `popup.js:437`, `:766`, `:1282`).
Ninguna escritura existe: la página de opciones persiste el umbral con la clave `filterMinProfit`
(`src/options.js:800-802`, control `#min-profit`) y **no** escribe `profitThreshold`.

**Qué está mal**: el cartel que resume la configuración aplicada muestra un valor que no es el que se
aplicó, y siempre el mismo (1% fijo).

**Impacto**: el usuario configuró "Ganancia mínima: −5%" (o 3%), ve la lista vacía y el cartel dice
"Umbral: 1%" justo debajo del ítem "🎯 Umbral muy alto / Prueba bajar el umbral mínimo". El mensaje lo
manda a ajustar un valor y le muestra un número que no existe en ningún control de la app: no puede
saber cuál es el umbral real ni cuánto bajarlo. Es el peor momento para dar información incorrecta
(el usuario ya no ve resultados).

**Fix propuesto**: usar la clave que el motor sí aplica:

```js
const threshold = interfaceSettings.interfaceMinProfitDisplay ?? userSettings?.filterMinProfit ?? -10;
```

**Cómo verificar que quedó bien**: con `filterMinProfit = 3` en `chrome.storage.local` y la lista
vacía, el cartel debe decir "Umbral: 3%".

---

### P-12 — BAJO — El "Monto del simulador" configurado en Ajustes nunca llega al popup

**Evidencia** — la página de opciones guarda el monto en `defaultSimAmount`
(`src/options.js:813-815`):

```js
814|  settings.defaultSimAmount =
815|    parseInt(document.getElementById('simulator-amount')?.value) || 1000000;
```

y lo carga con la misma clave (`src/options.js:196`), pero el popup **nunca** lee esa clave: mapea
otra (`src/popup.js:470`):

```js
470|        simulatorDefaultAmount: settings.simulatorDefaultAmount || 100000,
```

La única lectura de `defaultSimAmount` en el popup está en una función sin callers
(`src/popup.js:686-692`, `handleTabChange`, exportada en `:4421` y llamada en ningún lado):

```js
688|  if (tabId === 'simulator' && userSettings?.defaultSimAmount) {
689|    const amountInput = document.getElementById('sim-amount');
690|    if (amountInput && !amountInput.value) {
```

y el input nace con un valor fijo en el HTML (`src/popup.html:1119-1126`):

```html
1122|                  value="1000000"
```

**Comprobación ejecutada** (`probe8.js`, con datos cargados):

```
     sim-amount = "1000000"
```

`grep -rn "simulatorDefaultAmount" src/` → sólo `popup.js:470` (mapa) y `simulator.js:378-379`
(`loadDefaultValues`, que a su vez sólo se llama desde `resetConfig`, ver P-10). Es decir: la clave
que el popup escribe en memoria con el nombre `simulatorDefaultAmount` no la produce nadie (nadie
escribe `simulatorDefaultAmount`), y la que produce la UI (`defaultSimAmount`) no se lee.

**Impacto**: el usuario pone "Monto simulador: 200000" en Ajustes y el simulador le sigue mostrando
$1.000.000 al abrirlo; tiene que reescribirlo cada vez. El control existe, guarda correctamente y
está documentado en el propio `options.html`, pero no tiene efecto.

**Fix propuesto**: unificar la clave. Lo más barato: en `popup.js:470`,
`simulatorDefaultAmount: settings.defaultSimAmount || 1000000`, y usarla al inicializar el input:

```js
// en el DOMContentLoaded, después de loadUserSettings():
const amountInput = document.getElementById('sim-amount');
if (amountInput) amountInput.value = userSettings.simulatorDefaultAmount;
```

**Cómo verificar que quedó bien**: guardar 200000 en Ajustes, reabrir el popup, pestaña Simulador →
el campo "Monto" debe decir 200000.

---

### P-13 — BAJO — Números con formato inconsistente: punto decimal y sin separador de miles en la matriz, el modal de detalle y las tarjetas cripto

**Evidencia** — la app tiene un formateador `es-AR` único (`src/utils/formatters.js:11-21`):

```js
11|    const { minDecimals = 2, maxDecimals = 2, fallback = '0.00', locale = 'es-AR' } = options;
...
17|      return Number(num).toLocaleString(locale, {
```

pero varios puntos de la UI escriben con `toFixed()`:

- Matriz de riesgo — `src/modules/simulator.js:633`, `:639`, `:661`:

```js
633|      tableHTML += `<th>$${price.toFixed(0)}</th>`;
639|      tableHTML += `<tr><td><strong>$${usdPrice.toFixed(0)}</strong></td>`;
661|        tableHTML += `<td class="${cellClass}" title="Ganancia: $${Fmt.formatNumber(profit)} ARS (${profitPercentage.toFixed(2)}%)">${profitPercentage.toFixed(2)}%</td>`;
```

  (el mismo template usa `Fmt.formatNumber` en el `title` y `toFixed` en el texto: "Ganancia:
  $80.560,25 ARS (8.06%)")

- Modal de detalle de arbitraje — `src/popup.js:1901`, `:1976`:

```js
1901|          <span class="profit-value">${isProfitable ? '+' : ''}${profitPercentage?.toFixed(2) || 0}%</span>
```

```js
1976|            <span class="value">${usdToUsdtRate.toFixed(4)} USD = 1 USDT</span>
```

- Tarjeta y modal cripto — `src/popup.js:3919`, `:4119`, `:4127`, `:4135`.

**Comprobación ejecutada** (`probe8.js`, texto real del `#modal-body` tras abrir una ruta):

```
   numeros crudos hallados: ["1.75","$1.450,00","$1.000.000,00","$1.450,00","689,66","0,00","$1.490,00","$1.017.500,00",...]
```

La tarjeta que el usuario clickeó muestra `+1,75%` (vía `Fmt`, `routeManager.js:388`) y el modal que
se abre encima del mismo click muestra `+1.75%`.

**Qué está mal**: el mismo número se presenta con dos convenciones distintas en la misma pantalla, y
los encabezados de la matriz pierden el separador de miles (`$1500` en vez de `$1.500`).

**Impacto**: en una herramienta donde el usuario compara porcentajes entre tarjeta, modal y matriz,
la mezcla de `1.75` y `1,75` invita a confundir decimales y miles (peor con montos: `$1500` puede
leerse como 1,5). Es cosmético en el sentido de que el valor es correcto, pero rompe la lectura.

**Fix propuesto**: usar `Fmt.formatNumber` / `Fmt.formatPercent` en esas líneas (ya está importado en
`simulator.js:629`) y, si hace falta, agregar un `formatInteger` a `formatters.js` para los
encabezados (`$1.500`). Ojo: `applyMatrixFilter` parsea el texto de las celdas con `parseFloat`
(`simulator.js:744`), así que si se formatea la celda hay que leer el valor desde un `data-value` en
vez del texto.

**Cómo verificar que quedó bien**: abrir el detalle de una ruta y comprobar que el porcentaje coincide
carácter por carácter con el de la tarjeta (`+1,75%`), y que los encabezados de la matriz dicen
`$1.500`.

---

### P-14 — BAJO — El "sanitizador" del sistema de tooltips no hace nada y el contenido se inyecta con `innerHTML` (latente)

**Evidencia** — `src/ui/tooltipSystem.js:525-537`:

```js
525|  updateContent(content) {
526|    // Convertir &#10; a <br> para multi-línea, sanitizando primero
527|    const sanitized =
528|      typeof content === 'string'
529|        ? content.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
530|        : '';
531|    const formattedContent = sanitized.replace(/&#10;/g, '<br>');
532|    this.container.innerHTML = `
533|      <div id="tooltip-content" class="tooltip-content">
534|        ${formattedContent}
```

Cada `.replace(/&/g, '&')` reemplaza un carácter por **sí mismo**: la expresión es un no-op. El
comentario "sanitizando primero" describe un escape que no existe, y el resultado va a `innerHTML`.

**Alcance verificado hoy**: el sistema sólo se dispara sobre elementos con `[data-tooltip]`
(`tooltipSystem.js:78`, `:90`), y en `src/popup.html` hay **7** atributos `data-tooltip`, todos con
texto literal del HTML ("Rutas Directas", "Rutas P2P", "Todas las Rutas", …);
`grep -c "data-tooltip-dynamic" src/popup.html` → **0**. Es decir: **hoy no es explotable**, porque
ninguna ruta de datos externos llega a un tooltip.

**Qué está mal**: el sanitizador es falso y todas las funciones "dinámicas"
(`getProfitTooltip`, `getSpreadTooltip`, `getBadgeTooltip`, `getCounterTooltip` — `:404-502`) toman
`element.textContent` / `getAttribute('data-counter-type')` y devuelven el string para ese
`innerHTML`. Alcanza con que alguien agregue `data-tooltip-dynamic="badge"` a una tarjeta que muestre
un nombre de exchange para que el nombre que venga de la API se ejecute como HTML. La convención del
resto del popup es `sanitizeHTML(...)`/`textContent`, así que este punto es una excepción silenciosa.

**Impacto**: ninguno hoy. Es un footgun documentado como "sanitizado" (y las auditorías previas lo
listan como corregido, ver la tabla final), lo que es peor que no tener nada: quien lo lea va a
confiar en un escape inexistente.

**Fix propuesto**:

```js
const formattedContent = String(content || '').replace(/&#10;/g, '\n');
this.container.replaceChildren();
const div = document.createElement('div');
div.id = 'tooltip-content';
div.className = 'tooltip-content';
div.style.whiteSpace = 'pre-line';
div.textContent = formattedContent;
this.container.append(div, document.createElement('div')).lastChild.className = 'tooltip-arrow';
```

**Cómo verificar que quedó bien**: `grep -n "innerHTML" src/ui/tooltipSystem.js` → 0 líneas; y un test
que llame `updateContent('<img src=x onerror=1>')` debe dejar el texto escapado y no crear el `<img>`.

---

### P-15 — BAJO — `initMagneticButtons()` acumula 1 `MutationObserver` y 2 listeners por tarjeta en cada re-render, sin `disconnect()`

**Evidencia** — `src/popup.js:4393-4405`:

```js
4394|    const observer = new MutationObserver(mutations => {
4395|      mutations.forEach(mutation => {
4396|        if (mutation.type === 'childList' || mutation.type === 'removedNodes') {
4397|          if (animationFrameId && !document.contains(button)) {
4398|            cancelAnimationFrame(animationFrameId);
4399|          }
4400|        }
4401|      });
4402|    });
4403|
4404|    observer.observe(button.parentNode, { childList: true, subtree: true });
```

`observer.disconnect()` no aparece en ninguna parte: `grep -c "disconnect" src/popup.js` → 0.

La función se llama en **cada render** de rutas: `src/popup.js:1466-1468` (render del popup) y
`src/modules/routeManager.js:546-564`, donde cada tarjeta recibe `.magnetic-btn`:

```js
550|        'magnetic-btn',
...
562|    if (typeof window.initMagneticButtons === 'function') {
563|      window.initMagneticButtons();
```

Además del `DOMContentLoaded` inicial (`src/popup.js:4693-4697`).

**Reproducción ejecutada** (`node probe3.js`):

```
== despues de la carga inicial ==
  cards en DOM: 5
  MutationObserver creados: 5 | observe(): 5 | disconnect() llamados: 0 | vivos: 5
  listeners 'mousemove' agregados: 5 | 'mouseleave': 5
== despues de 3 clicks en filtros ==
  MutationObserver creados: 15 | observe(): 15 | disconnect(): 0 | vivos: 15
  listeners 'mousemove' agregados: 15 | 'mouseleave': 15
== despues de 2 llamadas manuales a initMagneticButtons ==
  MutationObserver creados: 25 | observe(): 25 | disconnect(): 0 | vivos: 25
```

**Qué está mal**: los `mousemove`/`mouseleave` cuelgan de los nodos de la tarjeta, que se destruyen en
el siguiente render (esos se liberan), pero los `MutationObserver` se registran sobre
`button.parentNode`, que es **`#optimized-routes` y sobrevive**, con `subtree: true`. Cada observer
queda vivo, retiene su closure con la tarjeta vieja y recibe **todas** las mutaciones del contenedor.
Los re-render son frecuentes: cada click en los botones de filtro del footer y cada actualización
automática (P-02/B-03) vuelven a llamar a `displayRoutes`.

**Impacto**: una sesión de popup en la que el usuario cambia filtros y recibe 2-3 actualizaciones
termina con decenas de observers activos sobre el mismo contenedor, cada uno disparando su callback
en cada mutación del DOM. Es degradación progresiva de memoria/CPU; en el popup (vida corta, ~10-30
s) lo más probable es que no se note, pero se acumula en la misma sesión y ensucia cualquier perfil.

**Fix propuesto**: guardar los observers y desconectarlos, o —más simple— inicializar los efectos una
sola vez por delegación sobre el contenedor (los handlers de `mousemove` ya calculan `rect` en cada
evento, así que no necesitan estar atados a la tarjeta):

```js
let activeObservers = [];
function initMagneticButtons() {
  activeObservers.forEach(o => o.disconnect());
  activeObservers = [];
  ...
  activeObservers.push(observer);
}
```

**Cómo verificar que quedó bien**: `node probe3.js` después de 3 renders debe imprimir
`disconnect(): 15 | vivos: 5` (o `vivos: 0` entre renders).

---

### P-16 — COSMÉTICO — ~1500 líneas de código muerto en el popup, 35 de 52 iconos del sprite sin usar y un SVG que nadie referencia

**Evidencia** — funciones de `src/popup.js` sin ningún caller (cada una verificada con
`grep -rn "<nombre>" src/`, donde el único resultado es su definición y/o su export en
`window.PopupLegacyApi`):

| Función | Líneas | Prueba |
|---|---|---|
| `displayArbitrages` | 1183-1269 | sólo `popup.js:4422` (export); su contenedor `#arbitrages` no existe en el HTML (`probe2.js`: `displayArbitrages() THROWS TypeError: Cannot set properties of null`) |
| `displayOptimizedRoutes` | 1272-1501 | único call site `popup.js:898`, dentro de `if (data.usingCache)` anidado en `if (data.error && !data.usingCache)` → **contradicción, inalcanzable** |
| `fetchExchangeRatesFromAPIs` | 2422-2514 | llamado sólo desde `loadBankRates:2923` |
| `displayExchangeRates` | 2515-2706 | llamado sólo desde `loadBankRates:2931` |
| `setupExchangeFilters` | 2709-2814 | llamado sólo desde `displayExchangeRates:2700` |
| `loadBankRates` | 2903-2966 | **0 callers** (sólo el export `:4426`) |
| `handleTabChange` | 686-700 | 0 callers (sólo export `:4421`) |
| `updateDataStatusIndicator` | 533-540 | 0 callers, marcada `@deprecated` |
| `updateTimestampWithFreshness` | 2972-2983 | 0 callers (sólo export) |
| `showDataFreshnessWarning` | 2984-… | 0 callers (sólo export) |
| `showRouteGuideFromData`, `showRouteGuide`, `getBankDisplayName`, `selectArbitrage`, `setProgressRing`, `smoothScrollTo` | — | sólo export en `PopupLegacyApi` |

Suma conservadora de las seis primeras: **≈ 840 líneas**, más las funciones auxiliares que sólo ellas
usan (`getExchangeDisplayName` `:2815`, `createSafeElement` `:2120`).

Scripts completos cargados desde el HTML que no encuentran ningún elemento al que aplicarse:

```html
30|    <link rel="stylesheet" href="ui-components/arbitrage-panel.css" />
1430|    <script src="ui-components/arbitrage-panel.js"></script>
```

`grep -c "arbitrage-panel" src/popup.html` → 2 (las dos de arriba): **no hay ningún elemento con clase
`.arbitrage-panel`** (`probe.js`: `.arbitrage-panel en DOM: 0`), así que `initUIComponents()`
(`popup.js:213-221`) itera una lista vacía. Lo mismo con `.tabs-nav`
(`grep -c "tabs-nav" src/popup.html` → 0), así que `TabSystem` (`ui-components/tabs.js`, 315 líneas)
nunca se instancia. `.counter-animate` y `.stagger-container` tampoco existen en el HTML (0
coincidencias), así que dos ramas de `initMicroInteractions` (`popup.js:4544-4570`) y de
`initUIComponents` (`:245-257`) son inertes.

Iconos — `node probe9.js`:

```
  <symbol> definidos: 52 | <use href="#...">: 25 | unicos: 17
  ICONOS REFERENCIADOS PERO NO DEFINIDOS (0): []
  <symbol> definidos y NUNCA usados en este HTML (35): ["icon-arbitrage","icon-btc","icon-guide",...]
```

Ningún icono está roto (buena noticia, y responde a la sospecha del agente anterior): los 25 `<use>`
resuelven. Pero 35 de los 52 símbolos del sprite inline (que se parsea en cada apertura del popup) no
se usan, y `src/icons.svg` (9753 bytes, 52 símbolos) **no está referenciado desde ningún HTML/JS**
(`grep -rn "icons.svg" src/` → 0).

**Impacto**: ninguno funcional. Costo de mantenimiento y de lectura: dos versiones del mismo
renderizador de tarjetas (`popup.js:1272` + `renderHelpers.js:16` vs `routeManager.js:345`), dos
listas de presets (`popup.js:3025` y `simulator.js:19`), y un `window.getRouteDescription` que
`popup.js:1583` pisa al de `renderHelpers.js:162` (`probe.js`: `window.getRouteDescription.length
(nro de args): 2`). Cualquier persona que toque el render del popup tiene ~50% de probabilidad de
editar el archivo que no corre.

**Fix propuesto**: borrar las funciones de la tabla y los tres `<script>`/`<link>` sin contenedor;
borrar `src/icons.svg` y los 35 símbolos sin uso; quedarse con un solo renderizador (el vivo es
`routeManager.js`). El beneficio inmediato no es de performance sino de que las auditorías dejen de
encontrar "bugs" en código que no se ejecuta (ver la sección de matices).

**Cómo verificar que quedó bien**: `grep -rn "displayArbitrages\|displayOptimizedRoutes\|loadBankRates\|displayExchangeRates\|fetchExchangeRatesFromAPIs" src/`
debe quedar vacío; `node probe.js` debe seguir mostrando 5 tarjetas si hay rutas.

---

### P-17 — BAJO — El "Recalcular con precio personalizado" usa `prompt`/`alert` nativos y con un valor inválido no hace nada ni avisa

**Evidencia** — `src/popup.js:3141-3166`:

```js
3141|  const customPrice = prompt(message, currentPrice.toFixed(2));
3142|
3143|  if (customPrice && !isNaN(customPrice) && parseFloat(customPrice) > 0) {
...
3157|    alert(
3158|      `✅ Precio actualizado a $${price.toFixed(2)}\n\nLas rutas se recalcularán automáticamente.`
3159|    );
...
3163|  } else if (!customPrice) {
3164|    // Usuario canceló, solo refrescar datos actuales
3165|    fetchAndDisplay(true);
3166|  }
```

El botón que abre este camino es `#recalculate-dollar` (`src/popup.html:993-999`), visible siempre que
haya datos (`displayDollarInfo` pone `#dollar-info` en `display:block`, `src/popup.js:3121`).

**Qué está mal**: el bloque tiene dos ramas —valor válido y "canceló"— pero **no hay rama para valor
inválido**. Si el usuario escribe `0`, `-5`, `abc` o deja un espacio, `customPrice` es truthy pero
falla la validación, y el `else if (!customPrice)` tampoco entra: la función termina sin hacer nada,
sin cerrar el diálogo de forma visible, sin mensaje.

**Impacto**: el usuario escribe un precio equivocado, acepta, y **no pasa nada** (ni error ni
recálculo). Lo más probable es que repita la acción, o que crea que la app guardó un precio que en
realidad no se guardó. Además mezcla dos lenguajes visuales: el popup tiene su propio sistema de
aviso (`NotificationManager.showToast`, `#save-status` en Ajustes) y este único flujo abre un
`prompt()` y un `alert()` nativos del navegador, que en el popup de una extensión oscura aparecen como
ventanas blancas del sistema. (La migración de `alert()` a mensajes inline está hecha en
`simulator.js` —6 comentarios "Migrado de alert() a inline message (R-04)", 0 `alert()` reales— pero
no en `popup.js`.)

**Fix propuesto**:

```js
const raw = prompt(message, currentPrice.toFixed(2));
if (raw === null) { fetchAndDisplay(true); return; }            // canceló
const price = parseFloat(raw);
if (!Number.isFinite(price) || price <= 0) {
  NotifMgr.showToast('⚠️ Precio inválido: ingresá un número mayor a 0', 'warning');
  return;
}
// ... y reemplazar el alert() final por NotifMgr.showToast(..., 'success')
```

**Cómo verificar que quedó bien**: click en el botón de recálculo, escribir `0` → debe verse un aviso
de error; escribir `1500` → debe verse el toast de confirmación y `chrome.storage.local` debe tener
`manualDollarPrice: 1500`.

---

## Matices sobre hallazgos ya registrados

Matices que **no contradicen** los informes previos pero cambian el alcance del fix. No los repito.

### M-01 (sobre F-09) — El bloque "✅ Ganancia Neta" de F-09 está en código que no se ejecuta; el que sí ve el usuario rotula sin condición

F-09 cita `src/popup.js:1202` y `:1234-1247`, que están dentro de `displayArbitrages`. Esa función
**no tiene callers** (sólo el export `popup.js:4422`) y su contenedor `#arbitrages` no existe en
`popup.html`: `probe2.js` da `displayArbitrages() THROWS TypeError: Cannot set properties of null
(setting 'innerHTML')`. El mismo bloque duplicado en `src/renderHelpers.js:31` y `:62-67` también
está muerto (nadie importa `RenderHelpers`).

El caso **visible** es otro y es equivalente: `src/popup.js:2012` (modal de detalle de arbitraje) y
`:4164` (modal cripto) rotulan

```js
2012|          <span class="label">${isProfitable ? '✅ Ganancia Neta' : '❌ Pérdida Neta'}</span>
```

**sin ninguna condición sobre comisiones**. Con la configuración de fábrica
(`applyFeesInCalculation = false`, F-02) el número que acompaña ese ✅ es bruto: el usuario ve un
tick de verificación sobre una ganancia sin comisiones. El `hasFees` que F-09 propone usar no existe
en este camino. Fix sugerido para F-09: aplicarlo también (y primero) en `popup.js:2012` y `:4164`.

### M-02 (sobre F-10) — El `%` sobre un valor en pesos sólo existe en código muerto; el camino vivo no muestra fees

F-10 cita `popup.js:1239` (dentro de `displayArbitrages`, muerta — ver M-01) y
`renderHelpers.js:66` (muerta). `grep -rn "fees.total" src/` → 4 líneas, las 4 en esos dos bloques
muertos, más `src/popup.js:1789` que **sí** está bien:

```js
1789|            <span>$${Fmt.formatNumber(fees.total)}</span>
```

El renderizador vivo de la tarjeta (`routeManager.js:381-409`) **no muestra fees en absoluto**: no
hay fila de comisiones ni en la tarjeta ni en `mainValue`. Conclusión para el fix: corregir F-10 es
cambiar dos plantillas que no corren; si se quiere que el usuario vea el desglose hay que agregar la
fila al renderizador vivo.

### M-03 (sobre O-03) — Las 9 claves `interface*` del popup están declaradas con defaults en memoria: los controles son inertes, pero el popup no se rompe

O-03 afirma que el popup lee claves `interface*` que nadie escribe. Es exacto **en el storage**, pero
`loadUserSettings()` las construye siempre con defaults (`src/popup.js:471-482`):

```js
471|        interfaceMinProfitDisplay: settings.interfaceMinProfitDisplay || -10,
473|        interfaceSortByProfit: settings.interfaceSortByProfit !== false,
```

Consecuencia práctica (verificada leyendo `filterManager.js:337-364`): los filtros del popup operan
con `-10%` / 20 rutas / orden descendente, y el límite de ganancia real lo pone
`filterMinProfit` (el de Ajustes) dentro de `applyUserPreferences` (`filterManager.js:387`). Es
decir: **el control de Ajustes "Ganancia mínima" sí funciona** (se aplica el más restrictivo de los
dos), pero los 9 controles de la sección "🎨 Interfaz" no tienen ningún efecto porque su clave nunca
llega al storage. Conviene no "arreglar" el lado del popup borrando los defaults: sin ellos los
filtros quedarían en `undefined` (`filterManager.js:337` `|| -10`, `:355` ternario,
`:361` `|| 20`).

### M-04 (sobre O-03 / B-13) — Los 4 controles "🔧 Avanzado" inertes tienen funciones muertas que los implementarían

O-03 marca `dataFreshnessWarning`, `riskAlertsEnabled`, `requireConfirmHighAmount` y `high-threshold`
como inertes. Matiz nuevo: el popup **sí** tiene el código que los usaría, y está desconectado —
`updateTimestampWithFreshness` (`popup.js:2972`), `showDataFreshnessWarning` (`:2984`, escribe
`#data-warning`) y `getDataFreshnessLevel` (`:317`) no tienen callers (P-08). O sea: no falta
implementación, falta la llamada.

### M-05 (sobre B-05) — El lado popup de B-05: el error que el background manda se descarta antes de mostrarse

B-05 describe el `{}` truthy y el `error: null` del background. El complemento verificado en esta
auditoría (P-07): cuando el background **sí** manda `error` (rama `.catch`,
`main-simple.js:2070-2072`), el popup no lo muestra porque `handleSuccessfulData` corta en
`optimizedRoutes.length === 0` (`popup.js:910`) antes del `if (data.error && !data.usingCache)`
(`popup.js:893`). Arreglar sólo el background (como propone B-05) no alcanza: hay que reordenar esos
dos `if` en el popup.

### M-06 (sobre B-13) — El ruido de consola del popup no viene de los `ui-components` (que no loguean nada) sino de `src/modules/`

El agente anterior dejó la pista "los ui-components no usan `window.Logger`". Es cierto pero el
efecto es nulo: `grep -c "console\." src/ui-components/*.js` → **0, 0, 0** (no escriben nada en
consola). Los 17 `console.warn`/`console.error` **no gateados** del popup están en
`src/modules/` (`filterManager.js` 3, `modalManager.js` 4, `notificationManager.js` 3,
`routeManager.js` 3, `simulator.js` 4) y varios de ellos se disparan en el camino normal de uso
(`routeManager.js:423`, `filterManager.js:315`). El flag que los silenciaría
(`verboseLogsEnabled`, `popup.js:73-79`) sólo afecta a `log()`, no a esos `console.*`.

---

## Verificación de auditorías previas

Contrastado contra `.claude/AUDITORIA_COMPLETA.md`, `.claude/auditorias/*.md` y las afirmaciones que
este informe toca.

| Afirmación previa | ¿Sigue siendo cierta hoy (`5fdfa9e`)? | Evidencia |
|---|---|---|
| `CONSOLIDATED_AUDIT_2026-04-01.md:160` — "innerHTML vulnerables: 64 → **0** ✅" | **NO** | Hay **74** ocurrencias de `innerHTML` en `src/` (12 archivos). La mayoría sanitiza, pero `src/ui/tooltipSystem.js:527-534` "sanitiza" con `replace(/&/g,'&')` (no-op) y lo inyecta por `innerHTML` (P-14). La tabla de esa auditoría cuenta "vulnerables", no instancias: hoy hay al menos una ruta con escape inexistente. |
| `CONSOLIDATED_AUDIT_2026-04-01.md:161` — "onclick inline (CSP): 11 → **0** ✅" | **Sí** | `grep -c "onclick=" src/popup.html src/options.html` → `0` y `0` (probe9: `onclick inline: 0`). Las únicas asignaciones son de propiedad desde JS (`popup.js:1689`, `notificationManager.js:361`), que el CSP no bloquea. |
| `CONSOLIDATED_AUDIT_2026-04-01.md:40` y `:54` — "XSS en `popup.js` y `routeManager.js`: ✅ CORREGIDAS (v6.0.2)" | **Sí en esas instancias, con dos excepciones** | Confirmado: `getRouteDescription` (`popup.js:1583-1597`) y `routeManager.js:366` escapan con `sanitizeHTML` (45 llamadas en `popup.js`); `displayMarketHealth` usa DOM API. Excepciones: `tooltipSystem.js` (P-14) y los `innerHTML` de `src/popup.js:3148-3157`… no aplica; la otra es que `float` de datos numéricos usa `toFixed` (P-13), que no es XSS. |
| `AUDITORIA_POST_FIX_2026-04-01.md:50` (S-08) — "XSS sanitizado en `displayMarketHealth` (DOM API), Crítica" | **Sí, pero la función nunca se ejecuta** | `displayMarketHealth` (`popup.js:560-582`) usa `createElement`/`textContent` correctamente; `handleSuccessfulData` la llama con `data.marketHealth` (`:886`) y el background **no envía esa clave**: el objeto de datos (`main-simple.js:1959-1968`) tiene `oficial, usdt, usdtUsd, optimizedRoutes, arbitrages, lastUpdate, error, usingCache`. `health` es `undefined` → early return en `:563-566` → `#marketHealth` (`popup.html:974`) queda vacío y oculto para siempre. |
| `AUDITORIA_POST_FIX_2026-04-01.md:166` (R-04) — "`simulator.js` usa `alert()` para validación → migrar a toasts/inline" | **Sí en `simulator.js`; NO en el popup** | `simulator.js`: 0 `alert()` reales (sólo 6 comentarios en `:111`, `:455`, `:478`, `:546`, `:565`, `:593`). `popup.js:3157` **sí** tiene un `alert()` real y `:3141` un `prompt()` (P-17). |
| `AUDITORIA_POST_FIX_2026-04-01.md:153` (S-21) — "`tooltipSystem.js`: 1 fix (XSS updateContent) ✅" | **NO** | El "fix" es `tooltipSystem.js:527-530`, un `replace` que devuelve el mismo string (P-14). |
| `AUDITORIA_POST_FIX_2026-04-01.md:118` — "Tabs: routes, crypto-arbitrage, simulator, banks presentes" | **Sí, pero sin semántica de pestañas** | Las 4 existen (`popup.html:1016-1031`) y `setupTabNavigation` las conecta; `role`/`aria-selected`/flechas: 0 (P-09). |
| `SECURITY_AUDIT_2026-03-31.md:30` (VULN-001) — "64 instancias de innerHTML… muchas insertan datos de APIs externas sin sanitización" | **Parcialmente** | El conteo subió a 74 y las del camino de rutas están sanitizadas; la afirmación general ("muchas sin sanitización") hoy es **falsa para el camino vivo** y **cierta** en `tooltipSystem.js` (P-14). |
| `AUDITORIA_COMPLETA.md:40` / `:302` — "Posible XSS en `popup.js` líneas 1177-1227" | **NO** (esa instancia está corregida) | `popup.js:1207`, `:1214`, `:1221`, `:1232`, `:1239`, `:1243` usan `sanitizeHTML`/`Fmt`. Matiz: toda la función es código muerto (M-01, P-16). |
| `AUDITORIA_POST_FIX_2026-04-01.md:110` (B-05 del doc de UI) — "`showRecalculateDialog` con warning claro sobre cambio permanente" | **Sí** | `popup.js:3133-3139` incluye "⚠️ ATENCIÓN: Esto cambiará permanentemente a modo manual…". Matiz: sólo aparece en el caso automático, y la función tiene la rama faltante de P-17. |
| `CONSOLIDATED_AUDIT_2026-04-01.md:190` — "Sanitizar innerHTML restantes ✅ COMPLETADO" | **NO** | Ver primera fila y P-14. |
| `docs/AUDITORIA_COMPLETA_2026.md:535-556` — "logging migrado a `log()` condicionado por el flag de debug" | **Parcial** | El `log()` del popup está gateado (`popup.js:85-94`), pero quedan 17 `console.warn/error` incondicionales en `src/modules/` que el flag no toca (M-06). |
| Pendiente previo: "validación de origen en mensajes" | **N/A en esta área** | El popup no valida la forma de la respuesta (sólo `chrome.runtime.lastError`, `popup.js:993`); el chequeo de `sender` vive en el background (`main-simple.js:2223-2226`, verificado en 01-BACKGROUND). Los objetos que consume el popup no se validan campo por campo: de ahí que `data.marketHealth` (ausente) pase inadvertido. |

---

## Lo que NO pude verificar

1. **El popup corriendo en Brave con la extensión cargada.** No pude abrir
   `chrome-extension://eekjnnmknnmdieggifdakabaonghfakl/src/popup.html` (es el perfil del usuario, no
   el de mi sesión de navegador). Todo el comportamiento del popup está verificado con jsdom sobre el
   HTML y los scripts reales, y todo lo visual con reglas CSS leídas + un test de plataforma en
   Chromium. **Nada está medido sobre la pantalla real del usuario**, incluidas las capturas del
   `baseline-visual` (no las usé).
2. **P-03/P-04/P-05 en runtime con datos reales.** Los números salen de replicar la aritmética del
   código y de correr `generateRiskMatrix` en jsdom con un fixture; no corrí la matriz en un navegador
   con la extensión cargada. En jsdom `matrixResult.scrollIntoView` no existe y la promesa rechaza
   después de escribir la tabla (`probe8.js`: `THROW matrixResult.scrollIntoView is not a function`) —
   eso es una limitación del harness, **no** un bug: en un navegador `scrollIntoView` existe.
3. **P-06 en el popup real.** La semántica de `<dialog>` sin `open` (display visible por estilo
   inline, Escape sin efecto, foco que no se mueve) la verifiqué en **Chromium real vía CDP sobre una
   página plana**. No verifiqué que dentro del popup de la extensión no haya alguna diferencia
   (z-index del top layer, `::backdrop`), así que la afirmación es sobre el mecanismo, no sobre el
   pixel del popup.
4. **Si `prompt()`/`alert()` funcionan en el popup de una extensión MV3 en la versión de Brave del
   usuario** (P-17). No lo probé; si estuvieran bloqueados, P-17 subiría de severidad (el botón
   "Recalcular con precio personalizado" no haría nada).
5. **El impacto real de P-15 (fuga de observers).** Medí la acumulación (probe3: 5→15→25 sin
   disconnects) pero no medí memoria/CPU en un navegador. La consecuencia "degrada la sesión" es
   inferencia.
6. **`src/popup.css` completo (4564 líneas).** Sólo lo consulté por `grep` para las reglas que cito
   (`.modal-overlay`, `.connection-status`, `.market-health`). No audité el CSS como tal: no sé si hay
   reglas que apunten a elementos inexistentes (mismo tipo de problema que P-16, pero del lado del
   estilo) ni si hay conflictos de especificidad en el popup oscuro.
7. **`src/modules/modalManager.js`, `src/ui/routeRenderer.js`, `src/ui-components/{tabs,animations,arbitrage-panel}.js`
   línea por línea.** De los tres últimos verifiqué que no se instancian (0 elementos en el DOM);
   de `modalManager.js` sólo leí los bloques que el popup invoca (`:320-370`, `:89-170` por `grep`).
   No puedo afirmar que no haya hallazgos ahí.
8. **El estado real del perfil del usuario** (qué settings tiene guardados). Varios hallazgos
   (P-11, P-12, P-13) dependen de la configuración: no sé si el usuario alguna vez configuró el monto
   del simulador o el umbral mínimo, así que no sé si ya sufrió estos efectos en la práctica.

