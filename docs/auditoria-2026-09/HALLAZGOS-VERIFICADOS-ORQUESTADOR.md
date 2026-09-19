# HALLAZGOS VERIFICADOS POR EL ORQUESTADOR

Estos hallazgos **no son reportes de agentes**: los verifiqué yo mismo leyendo el código y
ejecutando la lógica. Cada uno tiene `archivo:línea` y la evidencia citada.
Fecha: 2026-09-19 · Commit `5fdfa9e`.

---

## F-01 — CRÍTICO — El motor descarta la comisión de venta y sobreestima la ganancia

**Evidencia** — `src/background/main-simple.js:897-926`:

```js
897|  const sellPrice = data.totalBid;
898|  const arsFromSale = usdtAfterFees * sellPrice;
899|
900|  let arsAfterSellFee = arsFromSale;
901|  let sellFeeAmount = 0;
902|  if (applyFees) {
903|    const sellFeePercent = resolveBrokerFee(userSettings, exchange, 'sellFee');
904|    if (sellFeePercent > 0) {
905|      sellFeeAmount = arsFromSale * (sellFeePercent / 100);
906|      arsAfterSellFee = arsFromSale - sellFeeAmount;   // ← calculado correctamente
907|    }
908|  }
909|
910|  let finalAmount = arsAfterSellFee;
911|  let withdrawalFee = 0;
912|  let transferFee = 0;
913|  let bankFee = 0;
914|  if (applyFees) {
915|    withdrawalFee = userSettings.extraWithdrawalFee || 0;
916|    transferFee = userSettings.extraTransferFee || 0;
917|    bankFee = userSettings.bankCommissionFee || 0;
918|    finalAmount = arsFromSale - (withdrawalFee + transferFee + bankFee);  // ← PISA el valor de 906
919|  }
920|
921|  const grossProfit = arsFromSale - initialAmount;
922|  const netProfit = finalAmount - initialAmount;
```

**Qué está mal:** en la línea 918, `finalAmount` se recalcula **desde `arsFromSale`**, descartando
`arsAfterSellFee` (la única resta de la comisión de venta). Como las comisiones extra por defecto
son 0, el resultado es que el `sellFee` **nunca se descuenta** del resultado cuando
`applyFees === true`.

**Impacto:** `netProfit` y `profitPercentage` (`:922-924`, expuestos como `profitPercent` y
`profitPercentage` en `:934-935`) quedan sobreestimados exactamente en `sellFeeAmount`. El
detector puede mostrar como rentable una ruta que después de comisiones no lo es. Además los
números que se muestran son internamente inconsistentes: `fees.total` (`:925-926` y `:958`)
**sí** incluye `sellFeeAmount`, mientras que `finalAmount` no lo aplica.

**Fix propuesto:** `finalAmount = arsAfterSellFee - (withdrawalFee + transferFee + bankFee);`

**Reproducción ejecutada** — `node docs/auditoria-2026-09/repro-f01-sell-fee.mjs`
(copia literal de la aritmética real contra la versión corregida):

| Escenario (1.000.000 ARS, dólar 1000) | Código ACTUAL | Código CORREGIDO |
|---|---|---|
| A) comisión venta 1%, spread amplio | +188.000 ARS (**+18,800%**) | +176.120 ARS (+17,612%) |
| B) spread 2% realista, compra 0,5% / venta 1,5% | +14.900 ARS (**+1,490%**, "RENTABLE") | −323,50 ARS (**−0,032%**, PÉRDIDA) |
| C) B + 3.000 retiro + 2.000 transferencia | +9.900 ARS (**+0,990%**, "RENTABLE") | −5.323,50 ARS (**−0,532%**, PÉRDIDA) |

En los escenarios B y C **el signo del resultado se invierte**: la extensión le presenta al
usuario como rentable una ruta que pierde plata. En el escenario C la comisión de venta de
15.223 ARS sigue sin descontarse aun con todos los campos de comisiones extra cargados
(se informan 25.323 ARS de comisiones pero el resultado solo descuenta 10.100).

**Cómo verificar:** correr el script de reproducción; después del fix debe imprimir el mismo
resultado para ambas ramas.

---

## F-02 — CRÍTICO — Por defecto la extensión muestra ganancia **sin** comisiones

**Evidencia** — `src/options.js:63`:

```js
63|  applyFeesInCalculation: false, // CORREGIDO: false por defecto = sin fees
```

y `src/background/main-simple.js:1006`:

```js
1006|  const applyFees = userSettings.applyFeesInCalculation || false; // false por defecto
```

**Qué está mal:** con la configuración de fábrica, todas las rutas se calculan sin ninguna
comisión (ni compra, ni venta, ni retiro, ni banco).

**Impacto:** en una herramienta de arbitraje, un spread bruto de 1% puede ser negativo después de
comisiones (0,1% + 0,1%) y del spread real de compra/venta. El usuario ve un número optimista y
decide con esa información. El comentario "false por defecto = sin fees" indica que fue una
decisión deliberada, pero contradice la razón de ser del producto.

**Fix propuesto:** decidir explícitamente con el usuario: (a) `true` por defecto, o (b) mantener
`false` pero **mostrar en la UI, sobre cada ruta, la ganancia bruta y la neta con un aviso**
("sin comisiones — configuralas en Ajustes"). Nunca mostrar un solo número ambiguo.

**Cómo verificar:** con `applyFeesInCalculation=false`, la UI debe decir explícitamente que el
número es bruto.

---

## F-03 — ALTO — La comisión de venta se ignora salvo configuración manual por exchange

**Evidencia** — `src/background/main-simple.js:635-642`:

```js
635|function resolveBrokerFee(userSettings, exchange, feeType) {
636|  const config = (userSettings.brokerFees || []).find(
637|    fee => fee.broker.toLowerCase() === exchange.toLowerCase()
638|  );
639|  if (config && config[feeType] > 0) return config[feeType];
640|  if (feeType === 'buyFee') return userSettings.extraTradingFee || 0;
641|  return 0;   // ← sellFee sin configuración = 0%
642|}
```

**Qué está mal:** la comisión genérica (`extraTradingFee`) solo cae en la rama `buyFee`. Para
`sellFee`, si el exchange no está cargado en `brokerFees`, devuelve **0**.

**Impacto:** el usuario configura "0,1% de comisión de trading" creyendo que aplica a toda la
operación, y en realidad solo se aplica a la mitad (la compra). Refuerza el F-01/F-02.

**Fix propuesto:** que `extraTradingFee` funcione como comisión por operación (se aplica en
compra **y** venta) salvo que exista un `sellFee` explícito para ese exchange.

---

## F-04 — ALTO — Lógica de cálculo duplicada, muerta y con fórmula dimensionalmente incorrecta

**Evidencia 1** — el módulo existe y se importa, pero producción no lo usa:

```
src/background/arbitrageCalculator.js:6    const ArbitrageCalculator = (() => {
src/background/arbitrageCalculator.js:250    self.ArbitrageCalculator = ArbitrageCalculator;
tests/arbitrageCalculator.test.js:18        calc = globalThis.self?.ArbitrageCalculator || ...
```

`grep -rn "ArbitrageCalculator" src/` devuelve **solo** la definición dentro de
`arbitrageCalculator.js`. Ninguna función de ese módulo se invoca desde `main-simple.js`, que
tiene su **propia** implementación duplicada: `calculateInterBrokerRoutes` (`:794`) y
`calculateSingleExchangeRoute` (`:872`).

**Evidencia 2** — la fórmula de `calculateInterBrokerRoute` mezcla unidades
(`src/background/arbitrageCalculator.js:92-98`):

```js
92|    const usdAvailable = initialAmount / dollarPrice;      // ARS / (ARS por USD) = USD ✓
95|    const usdtBought = (usdAvailable / buyPrice) * (1 - tradingFee);  // USD / (ARS por USDT) ✗
98|    const arsReceived = usdtBought * sellPrice * (1 - tradingFee);
```

`buyPrice` está documentado como "Precio ask del exchange de compra" (`:73`), es decir ARS por
USDT. Dividir **USD** por un precio en **ARS** no da USDT. Con los valores de ejemplo del propio
test (`initialAmount = 1.000.000`, `dollarPrice = 1000`, `buyPrice = 1080`, `sellPrice = 1100`)
el resultado es ~1.018 ARS de salida contra 1.000.000 ARS de entrada: el cálculo está corrido por
un factor ≈ `dollarPrice`.

**Impacto:** doble. (1) Hay ~250 líneas de código muerto que parecen ser el motor de cálculo.
(2) Existe una suite de tests (`tests/arbitrageCalculator.test.js`) que **valida una fórmula
incorrecta**, dando falsa confianza: 203 tests en verde no significan que la matemática del
producto esté bien. Si alguien "reutiliza" ese módulo porque parece el lugar correcto, propaga el
error.

**Fix propuesto:** decidir una única fuente de verdad. Si el motor real es `main-simple.js`,
borrar `arbitrageCalculator.js` y su test (o mover el test al código real). Si se quiere el
módulo, corregir la fórmula y hacer que `main-simple.js` lo use (`self.ArbitrageCalculator`)
eliminando la copia local.

**Cómo verificar:** `grep -rn "ArbitrageCalculator" src/` debe tener al menos un uso real en
producción, o el archivo no debe existir.

---

## F-05 — MEDIO — El aviso de "nueva versión disponible" se dispara en falso

**Evidencia** — `src/background/main-simple.js:2300-2328` y `:2362-2372`:

```js
2301|  const currentVersion = chrome.runtime.getManifest().version;   // "6.0.0"
2319|    const versionMatch = data.commit.message.match(/v?(\d+\.\d+\.\d+)/);
2320|    const latestVersion = versionMatch ? versionMatch[1] : null;
2328|    const hasUpdate = compareVersions(currentVersion, latestVersion);
```

El "último número de versión" se **extrae con una expresión regular del mensaje del commit** de
GitHub, no de un release ni del manifest del repo remoto.

**Reproducción ejecutada** (con la función real `compareVersions` copiada del código, contra el
historial real del repo, `currentVersion = "6.0.0"`):

| Commit | Mensaje | Versión extraída | ¿Muestra banner? |
|---|---|---|---|
| `5fdfa9e` (HEAD) | `docs: sync claude notes and analysis` | — | no |
| `6c1e807` | `fix: CSP compliance and XSS vulnerabilities (v6.0.2)` | `6.0.2` | **SÍ** |

**Impacto:** alcanza con que un commit mencione una versión mayor que la del manifest para que el
usuario vea un banner de "hay una actualización" y un badge `!` (`:2344`) — con código que ya está
al día. Este repo ya tiene ese commit en su historia, así que el falso positivo es cuestión de
tiempo, no una hipótesis.

**Fix propuesto:** comparar contra una fuente confiable (tags de git o `package.json` remoto vía
la API de GitHub), o directamente eliminar la funcionalidad si no hay releases publicados.

---

## F-06 — MEDIO — El repo tiene 5 archivos `.backup` dentro de `src/` y se compilan igual

**Evidencia:** `src/ui-components/animations.css.backup`, `design-system.css.backup`,
`exchange-card.css.backup`, `header.css.backup`, `src/utils/formatters.js.backup`.
Los dos últimos se copian a `dist/` en cada build (`scripts/build.js:62`, `copyDir` copia todo
`src/` sin filtrar extensiones).

**Impacto:** se empaqueta basura en el ZIP que se distribuye (`npm run package`), y hay dos
fuentes de verdad para el mismo CSS. Riesgo de que alguien edite el `.backup` por error.

**Fix propuesto:** borrarlos (están en git, recuperables con `git show`).

---

## F-07 — MEDIO — Métricas de CI/desarrollo rotas (3 señales rojas)

| Señal | Estado real | Evidencia |
|---|---|---|
| `npm run lint` | 1 warning | `src/options.js:661 'CommonUtils' is not defined` |
| `npm run format:check` | falla | `src/modules/simulator.js` sin formatear |
| `npm run validate` | **fallaría** | encadena lint + format:check + test (`package.json:30`) |

**Impacto:** el repo tiene un script de validación que no pasa. Cualquier automatización que lo
use (`prepare` en `package.json:32`, workflows de CI) falla o queda deshabilitada.

---

## F-08 — BAJO — Documentación que contradice el código (deriva de documentación)

| Afirmación documentada | Realidad verificada |
|---|---|
| `.claude/CLAUDE.md:170` → CSP `script-src 'self' 'wasm-unsafe-eval'` | `manifest.json:38` → `script-src 'self'` (sin `wasm-unsafe-eval`) |
| `.claude/CLAUDE.md:5-10` → "leer obligatoriamente" el vault en `obsidian/` | El directorio existe pero **está vacío** (0 archivos); sólo hay subcarpetas sin contenido |
| `package.json` y `manifest.json` → versión `6.0.0` | El CHANGELOG llega hasta `6.0.1` (`docs/CHANGELOG.md:5`), un commit dice `(v6.0.2)` y `src/background/main-simple.js:10` dice "ArbitrageAR v5.0.84" |
| `ArbitrageAR-v6.0.0.zip` (raíz) → "v6.0.0" | Contiene el código de `deeeb66`, **anterior** a `1b9c2dc`: le faltan la unificación `CommonUtils.sanitizeHTML` y los mensajes inline del simulador |

**Impacto:** quien lea la documentación se forma un modelo mental falso del sistema; y el ZIP es
una trampa para distribución (mismo número de versión, código distinto).

---

## F-09 — CRÍTICO — La etiqueta "✅ Ganancia Neta" aparece justo cuando el número está mal, y desaparece cuando falta

> **CORRECCIÓN (2026-09-19, al cosechar `02-POPUP.md`) — la ubicación de este hallazgo es incorrecta.**
> El código citado abajo (`popup.js:1202`, `:1234-1247`) **nunca se ejecuta**: `id="arbitrages"` no existe
> en `popup.html` (0 ocurrencias) y `displayArbitrages` sólo aparece una vez en `popup.js:4422`, como
> miembro de una lista de exports, sin ningún call site. Verificado por el orquestador.
>
> El **fondo del hallazgo es real**, pero vive en otro lado: `src/popup.js:2012` y `:4164` (modal de
> detalle de ruta), donde el rótulo `'✅ Ganancia Neta'` / `'❌ Pérdida Neta'` se emite **sin ninguna
> condición sobre comisiones**, sobre `netProfit` / `route.netProfit`. El fix debe aplicarse **ahí**;
> aplicarlo en `:1202` no cambiaría nada visible. Ver `02-POPUP.md` matices M-01 y M-02.
>
> Alcance de la corrección: cambia la **ubicación**, no la severidad ni el impacto descritos abajo.

**Evidencia** — `src/popup.js:1202` y `:1234-1247`:

```js
1202|    const hasFees = arb.fees && arb.fees.total > 0;
...
1234|          ${
1235|            hasFees
1236|              ? `
1237|          <div class="price-row fees-row">
1238|            <span class="price-label">📊 Comisiones</span>
1239|            <span class="price-value fee-value">${Fmt.formatNumber(arb.fees.total)}%</span>
1240|          </div>
1241|          <div class="price-row">
1242|            <span class="price-label">✅ Ganancia Neta</span>
1243|            <span class="price-value net-profit">+${Fmt.formatNumber(arb.profitPercentage)}%</span>
1244|          </div>
1245|          `
1246|              : ''
1247|          }
```

**Qué está mal:** el bloque que rotula el número como **"✅ Ganancia Neta"** se renderiza
únicamente si `fees.total > 0`. El badge de ganancia (`:1209`, `.profit-badge`) se dibuja
**siempre**, con o sin etiqueta.

**Impacto:** el comportamiento es exactamente el inverso del correcto:
- Con la configuración de fábrica (sin comisiones, `fees.total = 0`) el usuario ve un badge
  verde con un porcentaje **sin ninguna indicación de que es bruto**.
- Cuando sí hay comisiones, el rótulo "✅ Ganancia Neta" aparece — y es precisamente el caso
  en que el número está sobreestimado (F-01), con el agravante de llevar un ✅ que lo presenta
  como verificado.

**Fix propuesto:** rotular siempre el número (bruto o neto, explícito) y usar ✅ sólo si las
comisiones están efectivamente aplicadas. Nunca un número sin unidad conceptual.

---

## F-10 — MEDIO — Las comisiones se muestran con signo `%` pero el valor está en pesos

**Evidencia** — `src/popup.js:1239` vs `src/background/main-simple.js:925-926`:

```js
// UI (popup.js)
1239|            <span class="price-value fee-value">${Fmt.formatNumber(arb.fees.total)}%</span>

// Motor de cálculo (main-simple.js) — el total está en ARS, no en porcentaje:
925|  const totalFees =
926|    tradingFeeAmount * sellPrice + sellFeeAmount + withdrawalFee + transferFee + bankFee;
```

`tradingFeeAmount` está en USDT (`:892`), multiplicado por `sellPrice` (ARS por USDT) da ARS;
`sellFeeAmount` (`:905`) sale de `arsFromSale * pct` → ARS; `withdrawalFee`, `transferFee` y
`bankFee` son montos en ARS configurados por el usuario (`:915-917`).

**Qué está mal:** se imprime un monto en pesos con un `%` al lado.

**Impacto:** con la configuración de ejemplo, la tarjeta muestra "📊 Comisiones 25.323,5%".
Es un número imposible que además contradice el propio `profitPercentage`. El usuario que
intenta entender de dónde sale su ganancia se encuentra con una cifra sin sentido — lo opuesto
a "cada error, específico y accionable".

**Fix propuesto:** mostrar `$ ${Fmt.formatNumber(arb.fees.total)}` (o desglosar porcentaje y
monto en filas separadas).

---

# Verificación independiente de los hallazgos de los auditores

Los informes de área (`01-BACKGROUND.md`, `02-POPUP.md`, `03-OPTIONS.md`, `04-SEGURIDAD.md`,
`06-CALIDAD-BUILD.md`) son **auto-reportes de un agente**: describen lo que el agente dice haber
comprobado. Antes de construir el plan de corrección sobre ellos, los puntos críticos se
re-verificaron acá contra el código, con el mecanismo exacto y no sólo el síntoma.

## O-01 — CONFIRMADO, con el mecanismo completo (dos escritores que se pisan)

`03-OPTIONS.md` decía "Guardar borra los fees por broker". El mecanismo real son **dos funciones
que escriben el mismo objeto por caminos distintos**:

```js
// 1) El escritor "correcto": lee lo guardado, cambia SÓLO brokerFees y reescribe.
714|  function saveBrokerFees() {
715|    const items = feesList.querySelectorAll('.broker-fee-item');
724|    chrome.storage.local.get('notificationSettings', result => {
725|      const settings = result.notificationSettings || DEFAULT_SETTINGS;
726|      settings.brokerFees = brokerFees;              // preserva el resto
727|      chrome.storage.local.set({ notificationSettings: settings }, ...);

// 2) El botón Guardar: reconstruye el objeto desde los DEFAULTS y el DOM.
 793|function getCurrentSettings() {
 794|  const settings = { ...DEFAULT_SETTINGS };          // brokerFees: []  ← options.js:64
        // ...asigna ~20 campos que TIENEN control en el DOM...
        // brokerFees NO se menciona en ninguna línea de esta función
 739|    const settingsToSave = settings || getCurrentSettings();
 742|    await chrome.storage.local.set({ notificationSettings: settingsToSave });
```

`brokerFees` se asigna únicamente en `:726` (dentro de `saveBrokerFees`, que termina en `:731`).
`getCurrentSettings()` arranca en `:793` y **nunca** lo asigna, así que hereda `[]` de
`DEFAULT_SETTINGS` (`options.js:64`). Conclusión verificada: **cada click en "Guardar" escribe
`brokerFees: []`**, borrando lo que el usuario haya cargado con el formulario de brokers. No hace
falta un harness: alcanza con ver que la función que arma lo que se guarda no menciona el campo.

El mismo mecanismo explica O-13 (18 claves que la UI no conoce vuelven a su default en cada
guardado) — no son dos bugs, es **uno solo con dos síntomas**: "reconstruir desde los defaults en
lugar de partir de lo guardado".

**Matiz nuevo que no estaba en ningún informe:** hay un **tercer** escritor de
`notificationSettings` en `src/popup.js:3154` (`chrome.storage.local.set`), que también escribe
un objeto parcial. Con `options.js:727`, `options.js:742` y `popup.js:3154` escribiendo la misma
clave sin listeners cruzados, la actualización perdida no es un riesgo teórico (O-21): es la
situación normal con el popup abierto.

## O-05 — CONFIRMADO (identificador inconsistente = fee que nunca se aplica)

```js
// options.html:925  — el <option> del formulario de fees por broker
925|                    <option value="lemon-cash">🍋 Lemon</option>

// Todo el resto del sistema usa "lemoncash":
options.js:39,173,341,388        'lemoncash'
options.html:447,626,1083        value="lemoncash"
popup.js:2848                    lemoncash: 'Lemon Cash'

// Y la comparación es literal, en minúsculas:
main-simple.js:636|  const config = (userSettings.brokerFees || []).find(
main-simple.js:637|    fee => fee.broker.toLowerCase() === exchange.toLowerCase()
```
`'lemon-cash' !== 'lemoncash'` → el fee que el usuario configura para Lemon **nunca** se usa.
Verificado leyendo ambos lados, sin necesidad de ejecutar nada.

## O-02 — CONFIRMADO (no existe el control que activa las comisiones)

`grep -rn "applyFeesInCalculation" src/` → 6 apariciones, **todas de lectura** en
`main-simple.js` (`:1006, :1120, :1165, :1223, :1259, :1484`) más el default en `options.js:63`.
En `src/options.html`: **0 ocurrencias**. Es decir, la sección "Fees y Comisiones" tiene controles
para cargar comisiones que el motor sólo aplica si `applyFeesInCalculation` es `true` — y no hay
ninguna forma de ponerlo en `true` desde la interfaz. Las 9 casillas y campos de esa sección no
pueden tener efecto con la configuración de fábrica.

## F-01 — reproducido (no es lectura de código: ver `repro-f01-sell-fee.mjs`)

Con spread del 2% y comisiones de compra 0,5% / venta 1,5%: el código actual muestra **+1,490%
(rentable)** y el corregido da **−0,032% (pérdida)**. El error es exactamente la comisión de venta.
