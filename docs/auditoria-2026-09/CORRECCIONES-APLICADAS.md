# Correcciones aplicadas — auditoría 2026-09

Registro de los hallazgos **corregidos** de `CONSOLIDADO-HALLAZGOS.md`, con la evidencia
medida antes y después, y el comando exacto para volver a comprobarlo.

Regla que se siguió: nada se da por corregido sin una prueba que se pueda ejecutar. Los
tests nuevos no copian la lógica del código auditado — **extraen las funciones reales del
archivo y las ejecutan**, para que un cambio posterior en el código haga fallar el test.

Estado del repo al cerrar este documento: 4 archivos de `src/` modificados, 2 tests nuevos,
ningún commit.

---

## Resumen

| Hallazgo | Sev. | Dónde | Qué pasaba | Test |
|---|---|---|---|---|
| **F-01** | Crítico | `main-simple.js:937` | la ganancia neta no descontaba la comisión de venta | `tests/background.netProfit-fees.test.js` |
| **O-01 / O-13** | Crítico | `options.js:131,138,743,759,812` | "Guardar" borraba fees y apagaba las comisiones | `tests/options.settings-persistence.test.js` |
| **F-09** | Crítico | `popup.js:1191,1199,1265,2035,4187` + `main-simple.js:1738` | el rótulo "Ganancia Neta" mentía | idem |
| **O-02** | Crítico | `options.html:886` + `options.js:216,845` | no existía control para descontar comisiones | idem |
| **O-05** | Alto | `options.html:943` + `main-simple.js:638` | el fee de Lemon nunca se aplicaba | `background.netProfit-fees` |
| **F-03** | Alto | `main-simple.js:659` | el "Fee trading" se cobraba en una sola pata | idem |
| **F-10 / O-06** | Medio | `options.html:907,915,923` + `popup.js:1263` | unidades falsas: decía % y USD, el motor resta ARS | (revisión de UI) |

---

## 1. F-01 (crítico) · La ganancia neta ignoraba la comisión de venta

**Qué decía el informe.** La ruta de un solo exchange calculaba la comisión de venta, la
informaba en `fees.total`, y después **no la restaba**.

**Causa.** Una línea, contra su rama hermana 180 líneas más arriba:

    :756  finalAmount = arsAfterSellFee - (withdrawalFee + transferFee + bankFee);   ← dos exchanges (correcta)
    :937  finalAmount = arsFromSale    - (withdrawalFee + transferFee + bankFee);   ← un exchange (BUG)

Que la versión correcta ya existiera en el mismo archivo es lo que hace el fix
inequívoco: no es una decisión de diseño, es una divergencia entre dos ramas del mismo
cálculo.

**Evidencia medida.** Ejecutando las funciones **reales** extraídas de `src/background/main-simple.js`
en un sandbox, escenario B (spread 2%, compra 0,5%, venta 1,5%, sobre 1.000.000 ARS):

| | antes | después |
|---|---|---|
| venta bruta | 1.014.900 ARS | 1.014.900 ARS |
| comisión de venta calculada | 15.223,50 ARS | 15.223,50 ARS |
| `finalAmount` | **1.014.900** (se ignoraba) | **999.676,50** |
| ganancia neta | **+14.900 ARS (+1,490% RENTABLE)** | **−323,50 ARS (−0,032%, PÉRDIDA)** |

El signo se invertía: la extensión mostraba como ganancia una operación que da pérdida.

**Cambio.** `src/background/main-simple.js:937`

    -    finalAmount = arsFromSale - (withdrawalFee + transferFee + bankFee);
    +    finalAmount = arsAfterSellFee - (withdrawalFee + transferFee + bankFee);

**Verificación.**

    node docs/auditoria-2026-09/verificar-f01-real.mjs     # exit 0 = los 3 escenarios cumplen el invariante

El invariante se evalúa **sólo con el objeto que devuelve la función**, sin mirar internos:

    finalAmount === arsFromSale − fees.sell − fees.withdrawal − fees.transfer − fees.bank

**Test.** `tests/background.netProfit-fees.test.js` (8 tests). Incluye un caso que documenta
**lo que ve el usuario con las comisiones apagadas**: el mismo escenario devuelve +20.000 ARS
(spread bruto del 2%) y eso es exactamente el engaño que describe F-02.

---

## 2. O-01 / O-13 (crítico) · "Guardar" borraba datos en silencio

**Qué decía el informe.** Guardar la configuración pisaba las claves que la página no maneja.

**Causa.** `getCurrentSettings()` construía el objeto a guardar desde `{ ...DEFAULT_SETTINGS }`
y sólo sobreescribía los controles presentes en la página. Toda clave que la UI no lee
—`brokerFees` y otras 17— volvía al default **y se escribía así en storage**.

**Evidencia medida.** El fallo no es "se pierde la clave", es peor:

| clave | valor guardado por el usuario | tras apretar "Guardar" (antes) |
|---|---|---|
| `brokerFees` | `[{ broker: 'ripio', buyFee: 0.5, sellFee: 1.5 }]` | **`[]`** (borrado) |
| `applyFeesInCalculation` | `true` | **`false`** (apagado) |
| clave desconocida | `{ raro: true }` | borrada |

Es decir: agregar un fee por broker y después apretar Guardar **lo borraba**, y como el
default de `applyFeesInCalculation` es `false`, **cada guardado apagaba las comisiones**.
O-01 y F-02 se refuerzan: no era sólo que no hubiera control, es que el guardado lo apagaba.

**Cambio.** `src/options.js`

- `:131` — caché de lo persistido: `let persistedSettings = null;`
- `:138` — `loadSettings()` la llena, y su base pasa a ser `{ ...DEFAULT_SETTINGS, ...(guardado) }`
  (además deja de mutar `DEFAULT_SETTINGS`, que era O-18)
- `:812` — `getCurrentSettings()` construye desde `{ ...DEFAULT_SETTINGS, ...(persistedSettings || {}) }`
- `:759` — `saveSettings()` refresca la caché tras escribir
- `:743` — el camino propio de los fees por broker también la refresca (si no, el siguiente
  "Guardar" borraría el fee recién agregado)

**Verificación.** `tests/options.settings-persistence.test.js` (6 tests), en dos capas:

- **A) el mecanismo aislado** — la función real extraída del archivo, con y sin base
  persistida. El segundo caso documenta el bug: con base nula, `brokerFees` → `[]` y
  `applyFeesInCalculation` → `false`.
- **B) end-to-end** — se carga `src/options.js` completo en jsdom con el **HTML real** de la
  página y un `chrome.storage.local` con almacén de verdad (promesa y callback). `loadSettings()`
  → `saveSettings()` → los fees siguen ahí.

---

## 3. F-09 (crítico) · El rótulo "Ganancia Neta" mentía

**Qué decía el informe.** El popup rotulaba "✅ Ganancia Neta" un número que, con las
comisiones apagadas, es el spread bruto.

**Cambio.** Dos helpers nuevos en `src/popup.js:1191` y `:1199`:

- `feesAreIncluded(route)` — el motor expone el ajuste de dos formas según el tipo de ruta
  (`config.applyFees` en la de un exchange, `applyFees` suelto en las demás); el helper acepta
  las dos y además considera `fees.total > 0`.
- `getProfitLabel(route, isProfitable)` — devuelve "✅ Ganancia Neta" **sólo** si se descontaron
  comisiones; si no, "⚠️ Ganancia bruta — sin comisiones".

Aplicado en los **cuatro** sitios donde aparecía el rótulo (el informe anotaba dos):

| Sitio | Antes | Ahora |
|---|---|---|
| `popup.js:1265` (tarjeta) | `✅ Ganancia Neta` fijo | `${getProfitLabel(arb, true)}` |
| `popup.js:2035` (modal de arbitraje) | ternario ✅/❌ | `${getProfitLabel(route, isProfitable)}` |
| `popup.js:4187` (modal de ruta cripto) | ternario ✅/❌ | idem |
| `main-simple.js:1738` (**notificación**) | "Ganancia neta estimada: +X%" | "Ganancia BRUTA estimada (sin comisiones)" cuando corresponde |

El cuarto no estaba en el informe: es el texto que recibe el usuario en el sistema operativo,
y afirmaba "neta" igual que el popup.

---

## 4. O-02 (crítico) · No existía forma de pedir que se descontaran

**Cambio.**

- `src/options.html:886` — interruptor nuevo `#apply-fees` ("Descontar comisiones del cálculo"),
  con el patrón `switch` que ya usa la página, y una advertencia que explica qué implica
  dejarlo apagado.
- `src/options.js:216` — `loadSettings()` lo enciende/apaga según lo guardado.
- `src/options.js:845` — `getCurrentSettings()` lo lee. **Sólo pisa el valor si el control
  existe**: si faltara, sobrevive lo persistido (si no, sería el mismo patrón de O-01).

**El default quedó en `false` (`options.js:63`) y eso es una decisión pendiente, no un
descuido.** Con O-02 y F-09 corregidos, el engaño desapareció (el popup avisa que es bruto),
pero qué muestra la extensión *de fábrica* cambia todos los números que ve el usuario. Es una
línea, cuando lo decidas.

---

## 5. O-05 (alto) · El fee de Lemon nunca se aplicaba

**Causa.** El desplegable "Fees por broker" usaba el código `lemon-cash` mientras el resto del
sistema (checkboxes, defaults, nombres para mostrar) usa `lemoncash`. El motor compara por
igualdad exacta, así que ese fee guardado **no coincidía nunca**: el usuario creía estar
descontando una comisión que el motor ignoraba.

**Cambio.**

- `options.html:943` — `value="lemon-cash"` → `value="lemoncash"`
- `main-simple.js:638` — `normalizarBroker()`: minúsculas y sin espacios ni guiones. Se usa en
  `resolveBrokerFee` y en las 4 comprobaciones `brokerSpecificFees`. Normalizar en vez de
  comparar en crudo es lo que hace que **los fees ya guardados con el código viejo sigan
  funcionando**: renombrar sólo la opción del desplegable habría dejado rotos los datos
  existentes.

---

## 6. F-03 (alto) · El "Fee trading" se cobraba en una sola pata

**Causa.** `resolveBrokerFee` devolvía el fee global `extraTradingFee` sólo para `buyFee`; para
`sellFee` devolvía 0. El mismo fee, llamado "fee trading" (comisión por operación), se cobraba
en una sola de las dos operaciones.

**Cambio.** `main-simple.js:659` — el fallback aplica a compra y a venta, salvo que el broker
tenga un fee explícito para esa pata.

**Esto es un juicio de valor, y lo tomé porque el informe lo recomendaba (F-03).** El efecto es
que los resultados quedan más conservadores (se descuenta más). Si tu criterio es que ese fee
es único por ronda, revertirlo es una línea.

---

## 7. F-10 / O-06 (medio) · Unidades falsas en los fees

**Causa.** El motor resta `extraWithdrawalFee`, `extraTransferFee` y `bankCommissionFee` como
**montos fijos en pesos** (`finalAmount = ... - (withdrawalFee + transferFee + bankFee)`), pero
la UI los pedía como "(%)", "(USD)" y "(%)". Quien escribía 1 creyendo 1% provocaba que se
restara 1 peso; quien escribía 5 creyendo 5 USD, 5 pesos. Por eso los números no cerraban.

**Cambio.**

| Campo | Antes | Ahora |
|---|---|---|
| `options.html:907` | `Fee retiro (%)` + `<span>%</span>` | `Fee de retiro ($ ARS)` + `ARS` |
| `options.html:915` | `Fee transferencia (USD)` + `USD` | `Fee de transferencia ($ ARS)` + `ARS` |
| `options.html:923` | `Comisión bancaria (%)` + `%` | `Comisión bancaria ($ ARS)` + `ARS` |
| `popup.js:1263` | `fees.total` (ARS) mostrado con `%` | `$… ARS` |

Se ajustaron también `max` y `step` (los topes de 10 y 50 no tienen sentido en pesos), y el
texto de ayuda ahora dice explícitamente cuál es porcentaje y cuáles son montos fijos.

---

## Segunda tanda — F-04 (refutado), P-03 y P-01

Antes de tocar cada cosa verifiqué el hallazgo en el código. Uno no se sostuvo.

### F-04 (alto) · El hallazgo es incorrecto en su parte central; la trampa que lo originó, real

- El informe afirma que la fórmula de `calculateInterBrokerRoute` mezcla unidades y cita "los
  valores de ejemplo del propio test (`buyPrice = 1080`)". **`1080` no aparece en el test**:
  los `buyPrice` reales son `1`, `1300`, `1400`, `1500`, `1600`.
- Con los valores reales (`buyPrice = 1`, una tasa USDT/USD, que es lo que el parámetro
  significa) la fórmula es correcta y **coincide con el motor vivo**: `usdPurchased /
  usdToUsdtRate` (`main-simple.js:723`) es exactamente `usdAvailable / buyPrice`
  (`arbitrageCalculator.js:95`).
- El aviso numérico del informe —"corrido por un factor ≈ `dollarPrice`"— es correcto **como
  demostración**: si se pasa el precio en pesos (1080) en ese lugar, la salida se hunde a
  1.018,52 ARS. Lo verifiqué ejecutando el módulo. Pero describe un uso incorrecto, no el
  código tal como está escrito.

Lo que sí es real y grave: **nadie lo ejecuta**. Cero usos de `ArbitrageCalculator.` en `src/`,
se carga en cada arranque del worker (`main-simple.js:23`) y es **el módulo mejor cubierto de
la suite (90,8%)** — cubrir código que no corre (Q-05).

Qué hice: desactivé la trampa (tabla de unidades explícita en el JSDoc y en cada parámetro,
`arbitrageCalculator.js:66-95`, ligada a la implementación viva) y agregué un test que **fija
las unidades** — da 1.100.000 ARS con el uso correcto y 1.018,52 ARS con el confundido, con los
números del propio informe. Queda pendiente la decisión de borrar el módulo con su test.

### P-03 (medio) · La conversión USD→USDT del simulador estaba invertida

`src/modules/simulator.js:700` hacía `usdToUsdtRate = usdPrice / usdtPrice` — el recíproco de
la tasa del motor — y después dividía. Como `step2_usdt = step1_usd × (usdtPrice / usdPrice)`,
cuanto más caro estaba el USDT en pesos **más USDT** decía que compraba: la economía al revés.

Cambio: conversión 1:1, documentada en el código (USDT es un stablecoin del dólar; lo que
cotiza en pesos es su **venta**, que se aplica recién en el paso 6).

Verificación: el criterio de aceptación del propio informe y su tabla completa.

| USDT/ARS | antes (simulador) | ahora | informe ("real") |
|---|---|---|---|
| 1000 | −1,99% | **−1,99%** | −1,99% |
| 1025 | +2,97% | **+0,46%** | +0,46% |
| 1050 | +8,06% | **+2,91%** | +2,91% |
| 1075 | +13,26% | **+5,36%** | +5,36% |
| 1100 | +18,59% | **+7,81%** | +7,81% |

`tests/simulator.profit-conversion.test.js` (5 tests) ejecuta la función real extraída del
módulo y verifica toda la columna.

### P-01 (alto) · El botón "Configuración avanzada" no abría nunca

`popup.js` llama a `Sim.init()` dos veces (`:116` y `:3059`, vía `setupAdvancedSimulator()`), y
`init()` registraba los listeners sin guarda de idempotencia (`simulator.js:198-203`). El
handler del toggle quedaba dos veces sobre el mismo botón y, como decide según el estado del
panel, un click lo abría y lo volvía a cerrar: el panel no se abría nunca. Parecía un botón roto.

Cambio: `init()` es idempotente. La segunda llamada actualiza los datos sin re-registrar.

Verificación: `tests/simulator.advanced-config-toggle.test.js` reproduce el escenario del
informe (init dos veces → un click debe abrir el panel) y **comprobé que el test falla si se
desactiva la guarda**, así que no pasa por casualidad.

---

## Tercera tanda — baja del módulo muerto (decidida por el usuario)

Se eliminaron `src/background/arbitrageCalculator.js` (251 líneas) y
`tests/arbitrageCalculator.test.js` (16 tests), y se sacó el archivo del `importScripts` de
`main-simple.js:23`.

Por qué: cero usos en producción, se evaluaba en cada arranque del service worker, y era **el
módulo mejor cubierto de la suite (90,8%)** — la métrica de calidad estaba premiando código
que nunca corre (Q-05). Se actualizaron además las dos menciones que quedaban en documentación
(`README.md`, la cabecera de `tests/bankCalculations.test.js`), que si no habrían quedado
describiendo un módulo inexistente.

Efecto medido: la suite pasa de 225 a **209 tests** y de 20 a **19 suites**. Baja el número y
sube la honestidad: esos 16 tests daban cobertura sobre una copia que nadie ejecutaba.

**La cobertura medida antes (17,58% statements) queda desactualizada por esta baja**: al
eliminar un archivo con 90,8% de cobertura, el porcentaje global tiene que caer. No lo volví a
medir; el número del cuadro de abajo corresponde a antes de esta baja.

---

## Hallazgos nuevos, encontrados al corregir

**1. La ruta cripto ignora las comisiones fijas.** `main-simple.js` no tiene dos caminos de
cálculo, tiene **cuatro**. Tres restan las comisiones fijas de retiro/transferencia/banco; la
ruta cripto (`~:1368`, `tryCalculateCryptoPair`) aplica la comisión de venta pero **no** las
fijas. No lo "arreglé": en una ruta P2P puede ser intencional. Queda anotado para que lo
definas, no para que lo descubras por un número mal.

**2. `finalAmount` se asigna en 4 lugares con 3 formas distintas** de escribir lo mismo
(`arsAfterSellFee - extras`, `arsFromSale - totalFees`, y el bug corregido). Es la causa raíz
de que el bug de F-01 pasara desapercibido: no hay una función única de resultado final que
todas las rutas usen. Consolidarla es refactor, no fix puntual.

---

## Estado del proyecto antes y después

| | antes | después |
|---|---|---|
| tests | 203 / 16 suites | **225 / 20 suites** |
| lint | 1 warning (`options.js`, `CommonUtils`) | igual — sin cambios |
| cobertura | ~17,6% (la cifra del informe de auditoría) | **17,58% statements · 13,38% branches · 17,51% lines** (medida hoy con `--coverage`) |

La cobertura quedó **plana a propósito**, y conviene decirlo con precisión: no hay una
medición previa hecha con este mismo comando para comparar, así que lo único afirmable es que
hoy da 17,58% y que el informe había medido ~17,6%. Se agregaron 15 tests, pero los dos
archivos que cubren suman ~3.500 líneas, así que el porcentaje casi no se mueve. El valor de
los tests nuevos no es el porcentaje: es que los tres bugs críticos que la suite de 203 tests
**no detectaba** ahora fallan si vuelven.

Eso confirma Q-04 del consolidado: **la suite tal como estaba (203 tests) no detectaba nada de
esto** — se podía alterar la aritmética del motor y los 203 tests seguían pasando con ESLint en
0. Los tests nuevos cubren esa clase de error a partir de ahora.

---

## Cómo reproducir todo

    cd D:/martin/Proyectos/ArbitrageAR-USDT

    npm run lint                                              # 1 warning preexistente
    npx jest                                                  # 218/218
    node docs/auditoria-2026-09/verificar-f01-real.mjs         # exit 0 = F-01 corregido

    # el caso del informe, sobre el código real:
    npx jest tests/background.netProfit-fees.test.js --verbose
    npx jest tests/options.settings-persistence.test.js --verbose

---

## Lo que queda abierto

**Decisiones tuyas (no las tomo):**
- El default de `applyFeesInCalculation` (`options.js:63`): dejarlo en `false` (bruto de
  fábrica, ahora rotulado como bruto) o pasarlo a `true`.
- La ruta cripto y las comisiones fijas (hallazgo nuevo 1).
- F-03: si el fee de trading global debe cobrarse en las dos patas o en una.

**Corregido en la segunda tanda** (detalle arriba): F-04 (trampa de unidades desactivada — el
hallazgo quedó refutado en su parte central), **P-03** y **P-01**.

**Pendiente de corrección:**
- **P-02 (alto)** — la matriz de riesgo se calcula siempre con precios fijos (USD 1000-1500,
  USDT 1000-1100), nunca con datos de mercado. Es el otro lado de P-01/P-03 en el simulador.
- **B-01** — el antiduplicado de notificaciones nunca coincide.
- **B-05** — un fallo de API se muestra como "0 oportunidades".
- **P-15 (bajo)** — fuga de `MutationObserver` (5 → 15 → 25, sin un solo `disconnect`).
- **Decisión tuya:** borrar `src/background/arbitrageCalculator.js` con su test (el motor real
  es `main-simple.js`; el módulo tiene cero usos).
- Resto de los 91 hallazgos del consolidado.
