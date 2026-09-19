# Auditoría CONFIGURACIÓN (options) — ArbitrageAR-USDT

Fecha: 2026-09-19 · Commit `5fdfa9e` · Página auditada: `src/options.html` (1243 líneas),
`src/options.js` (957 líneas), `src/options.css` (845 líneas).
Objetivo doble: (A) catálogo exhaustivo de los 191 controles como insumo del rediseño y
(B) hallazgos verificables del comportamiento de la página.

---

## Alcance

**Leído completo:**

| Archivo | Líneas | Qué se usó |
|---|---|---|
| `src/options.html` | 1243 | inventario de controles, etiquetas, defaults del HTML, textos de ayuda |
| `src/options.js` | 957 | carga/guardado, claves de storage, defaults, listeners, bugs |
| `src/options.css` | 845 | tokens, tipografías, layout, responsive, estados (insumo del rediseño) |
| `src/utils/commonUtils.js` | 557 | `sanitizeHTML` y el export `window.CommonUtils` (F-01 del lint) |
| `.eslintrc.json` | completo | globals declaradas, regla `no-undef` |
| `manifest.json` | host permissions + `options_page` | contexto de ejecución |

**Leído parcial (sólo las partes que consumen claves de options):** `src/background/main-simple.js`
(fetch de bancos, `resolveBrokerFee`, filtrado de exchanges, umbral de alerta, onChanged,
`checkForUpdatesInBackground`), `src/popup.js` (carga de settings, filtros, fetch de APIs,
`storage.sync`, onChanged), `src/modules/filterManager.js`, `src/modules/routeManager.js`,
`src/modules/simulator.js`, `src/ValidationService.js`, `src/DataService.js`.

**No leído (confesión):** `src/popup.css` (4564 líneas) y `src/options.css` más allá de las
reglas relevantes a controles/layout; `tests/**` (no se ejecutó ningún test — prohibido por el
brief); `src/ui/filterController.js` (no se carga desde ningún HTML, según el brief);
`src/modules/{notificationManager,modalManager,routeManager}.js` completos.

**Método de verificación usado:** lectura de código + dos verificaciones ejecutadas:
1. Harness Node con `vm` que carga `src/options.js` real con un DOM y `chrome.storage` falsos y
   ejecuta `loadSettings()`, `getCurrentSettings()` y `saveSettings()` (resultados citados como
   *harness CASO x*).
2. Chromium real (vía CDP) para el comportamiento de `input[type=number]` y de un selector CSS
   con comilla (*verificado en Chromium*).
3. `curl` a las APIs reales para los identificadores de exchange y para los headers CORS.

---

## Resumen

| ID | Severidad | Título | Archivo:línea |
|---|---|---|---|
| O-01 | CRÍTICO | "Guardar" borra silenciosamente todos los fees por broker | `src/options.js:794`, `:742` |
| O-02 | CRÍTICO | La sección Fees no tiene efecto: no existe control para `applyFeesInCalculation` (default `false`) | `src/options.js:63`, `src/background/main-simple.js:1006` |
| O-03 | ALTO | 53 de 191 controles (27,7%) no cambian ningún comportamiento | (tabla en el hallazgo) |
| O-04 | ALTO | "Exchanges Tradicionales": 36 checkboxes idénticos a "Exchanges USDT" pero inertes | `src/options.html:411-562`, `src/options.js:861` |
| O-05 | ALTO | El fee cargado para Lemon nunca se aplica: la UI guarda `lemon-cash`, el motor compara contra `lemoncash` | `src/options.html:925`, `src/background/main-simple.js:635-642` |
| O-06 | ALTO | Unidades contradictorias en los fees: la UI dice % / USD y el motor resta ARS | `src/options.html:893-905`, `src/background/main-simple.js:914-919` |
| O-07 | ALTO | "Horario silencioso": los selectores de hora son inalcanzables (`#quiet-config` nunca se muestra) | `src/options.html:1055` |
| O-08 | ALTO | El botón "🔔 Probar" no hace nada (sin listener) | `src/options.html:1136` |
| O-09 | ALTO | "Umbral monto alto" se guarda en una clave ajena y el umbral real es una constante fija | `src/options.js:220`, `:891-892`, `src/ValidationService.js:13` |
| O-10 | ALTO | Validación inexistente: no hay `<form>` ni `checkValidity()`; URLs custom sin whitelist (pendiente previo sigue abierto) | `src/options.html:1148-1170`, `src/options.js:872-879` |
| O-11 | ALTO | Los 16 checkboxes de bancos no afectan el filtrado del popup (lee `storage.sync`, options escribe `local`) | `src/popup.js:3609`, `src/options.js:742` |
| O-12 | ALTO | "Paso 2: USD → USDT": los 13 checkboxes se guardan en una clave que nadie lee y se pierden al recargar | `src/options.js:842` vs `:251`, `src/background/main-simple.js:670` |
| O-13 | MEDIO | Guardar pisa 18 claves que la UI no conoce (estado de otros componentes) | `src/options.js:794`, `:87-91` |
| O-14 | MEDIO | Los checkboxes de notificaciones pre-marcados en el HTML nunca se desmarcan al cargar (la UI miente) | `src/options.js:159-167`, `src/options.html:1075-1113` |
| O-15 | MEDIO | "Umbral monto alto" arranca en `0.5` (un `%`) en un campo que pide ARS con `min=10000` | `src/options.js:52`, `:220` |
| O-16 | MEDIO | `0` y vacío se reemplazan por defaults en silencio; números negativos se aceptan | `src/options.js:798-884` |
| O-17 | MEDIO | La subdivisión P2P "por paso" es cosmética: el motor une las tres listas | `src/background/main-simple.js:680` |
| O-18 | MEDIO | Reset: puede reportar éxito sobre un guardado fallido; la lista de brokers no se refresca; muta `DEFAULT_SETTINGS` | `src/options.js:486-496`, `:725` |
| O-19 | MEDIO | Deshabilitar notificaciones no deshabilita sus campos hasta recargar la página | `src/options.js:457`, `:945-957` |
| O-20 | MEDIO | Único punto de guardado al final de 5808 px, sin indicador de cambios sin guardar, feedback de 3 s fuera de viewport | `src/options.html:1232-1236`, `src/options.js:898-910` |
| O-21 | MEDIO | Dos escritores del mismo objeto de settings sin listeners cruzados → actualización perdida | `src/options.js:742`, `src/popup.js:3145-3154` |
| O-22 | BAJO | Crash del botón "Agregar" si el nombre del broker contiene comilla (`SyntaxError` verificado) | `src/options.js:569`, `:638` |
| O-23 | BAJO | Código y markup muertos (selector inexistente, tabla legacy oculta, claves fantasma) | `src/options.js:151`, `src/options.html:981-994` |
| O-24 | BAJO | ESLint: `CommonUtils` es un falso positivo; el problema real es la configuración de globals | `.eslintrc.json:15-21`, `src/options.js:661` |
| O-25 | BAJO | Accesibilidad: 0 atributos `aria`/`role`/`tabindex`, encabezados no operables por teclado, 3 labels huérfanos | `src/options.html:19-22`, `src/options.js:923-942` |
| O-26 | COSMÉTICO | Emojis en todas las etiquetas, 2 textos de ayuda para 191 controles, estado colapsado no persistido | `src/options.html:12-13`, `src/options.js:923-942` |

---

## PARTE A — Catálogo exhaustivo de controles

### A.0 Reconciliación de conteos (verificable)

```
$ python3 (parser sobre src/options.html, tags <input|select|button>)
TOTAL CONTROLES: 191  →  INPUTS: 180   SELECTS: 4   BOTONES: 7
Por tipo de input:   checkbox 156 | number 15 | url 4 | text 1 | time 2 | radio 2
Agrupables: 142 con atributo `name` (140 checkboxes + 2 radios) | 16 switches con id
Por sección:  💵 21 | 🔄 40 | 🏛️ 36 | 💎 38 | 🎨 13 | 💸 10 | 🔔 21 | 🔧 12
```

Coincide exactamente con el inventario del brief (180 inputs / 4 selects / 7 botones).

### A.1 Controles con `id` (49) — clave de storage, default y validación

`HTML` = valor del atributo en el HTML · `Efecto` = si el valor cambia algo en runtime
(verificado por grep de consumidores, no por inspección visual).

| Sección | Etiqueta visible | id | Tipo | Clave en `chrome.storage.local.notificationSettings` | Default (HTML / efectivo) | ¿Valida? | Efecto |
|---|---|---|---|---|---|---|---|
| 💵 Precio del Dólar | Precio manual (ARS) | `manual-dollar-price` | number 100–5000 | `manualDollarPrice` | 1400 / 1400 | ninguna | sí (sólo si el radio = Manual) |
| 💵 Precio del Dólar | Método de cálculo | `dollar-method` | select (9 opc.) | `preferredBank` | `consenso` | ninguna | sí (`main-simple.js:1830-1839`) |
| 💵 Precio del Dólar | Solo mejor precio bancario | `best-bank-only` | switch | — | sin clave | — | **INERTE** |
| 🔄 Exchanges P2P | Filtrar precios anómalos | `filter-p2p-outliers` | switch | `filterP2POutliers` | checked / true | ninguna | **INERTE** (0 consumidores) |
| 💎 Exchanges USDT | ✅ Seleccionar todos | `select-all-usdt-brokers` | button | (marca 36 en DOM; requiere Guardar) | — | — | sí |
| 💎 Exchanges USDT | ❌ Deseleccionar todos | `deselect-all-usdt-brokers` | button | ídem | — | — | sí |
| 🎨 Interfaz | Monto simulador (ARS) | `simulator-amount` | number 1000–1e7 | `defaultSimAmount` | 100000 / **1000000** | ninguna | sí (`popup.js:688`, `:444`) |
| 🎨 Interfaz | Ganancia mínima (%) | `min-profit` | number −10–20 | `filterMinProfit` | −10 / −10 | ninguna | sí (`popup.js:1096`) |
| 🎨 Interfaz | Máximo rutas | `max-routes` | number 1–50 | `maxRoutesDisplay` | 20 / 20 | ninguna | sí (`popup.js:1105`) |
| 🎨 Interfaz | Modo bancos | `bank-display` | select (3 opc.) | — | `top-3` | ninguna | **INERTE** |
| 🎨 Interfaz | Actualización bancos (min) | `bank-interval` | number 1–60 | — | 10 | ninguna | **INERTE** |
| 🎨 Interfaz | Ordenar por ganancia | `sort-profit` | switch | `sortByProfit` | checked / true | ninguna | sí (`popup.js:1102`) |
| 🎨 Interfaz | Solo rentables | `show-profitable` | switch | — | sin clave | — | **INERTE** |
| 🎨 Interfaz | Colores ganancia | `profit-colors` | switch | — | sin clave | — | **INERTE** |
| 🎨 Interfaz | Vista compacta | `compact-view` | switch | — | sin clave | — | **INERTE** |
| 🎨 Interfaz | Íconos | `show-icons` | switch | — | sin clave | — | **INERTE** |
| 🎨 Interfaz | Timestamps | `show-timestamps` | switch | — | sin clave | — | **INERTE** |
| 🎨 Interfaz | Precios bancarios | `show-bank-prices` | switch | — | sin clave | — | **INERTE** |
| 🎨 Interfaz | Priorizar mismo broker | `prefer-same-exchange` | switch | — | sin clave | — | **INERTE** |
| 💸 Fees | Fee trading (%) | `trading-fee` | number 0–10 | `extraTradingFee` | 0 / 0 | ninguna | condicionado (O-02) |
| 💸 Fees | Fee retiro (%) | `withdrawal-fee` | number 0–10 | `extraWithdrawalFee` | 0 / 0 | ninguna | condicionado + unidades mal (O-06) |
| 💸 Fees | Fee transferencia (USD) | `transfer-fee` | number 0–50 | `extraTransferFee` | 0 / 0 | ninguna | condicionado + unidades mal (O-06) |
| 💸 Fees | Comisión bancaria (%) | `bank-fee` | number 0–10 | `bankCommissionFee` | 0 / 0 | ninguna | condicionado + unidades (O-06) |
| 💸 Fees | Broker | `broker-select` | select (6 opc.) | `brokerFees[].broker` | `''` | `disabled` del botón | sí, con O-01/O-05 |
| 💸 Fees | Nombre | `custom-broker-name` | text | `brokerFees[].label` | vacío | `disabled` del botón | sí (O-22) |
| 💸 Fees | Fee Compra | `broker-buy-fee` | number 0–10 | `brokerFees[].buyFee` | vacío | `disabled` del botón | sí |
| 💸 Fees | Fee Venta | `broker-sell-fee` | number 0–10 | `brokerFees[].sellFee` | vacío | `disabled` del botón | sí |
| 💸 Fees | ➕ Agregar | `add-broker-improved` | button | guarda `brokerFees` por su cuenta | `disabled` | sí (marca disabled) | sí |
| 💸 Fees | ➕ Agregar (tabla legacy) | `add-broker` | button | — | — | — | **markup muerto** (`display:none`) |
| 🔔 Notificaciones | Habilitar notificaciones | `notify-enabled` | switch | `notificationsEnabled` | checked / true | ninguna | sí (`main-simple.js:1655`) |
| 🔔 Notificaciones | Umbral alerta (%) | `alert-threshold` | number 0.1–20 | `alertThreshold` | 1.0 / 1.0 | ninguna | sí (`main-simple.js:1646`) |
| 🔔 Notificaciones | Frecuencia | `notify-frequency` | select (6 opc.) | `notificationFrequency` | `1min` | ninguna | sí (`main-simple.js:1636`) |
| 🔔 Notificaciones | Sonido | `sound-enabled` | switch | `soundEnabled` | checked / true | ninguna | sí (`main-simple.js:1753`) |
| 🔔 Notificaciones | Horario silencioso | `quiet-hours` | switch | `quietHoursEnabled` | false / false | ninguna | switch sí (`main-simple.js:1606`); horas inalcanzables (O-07) |
| 🔔 Notificaciones | Inicio | `quiet-start` | time | `quietStart` | 22:00 | ninguna | inalcanzable |
| 🔔 Notificaciones | Fin | `quiet-end` | time | `quietEnd` | 08:00 | ninguna | inalcanzable |
| 🔔 Notificaciones | 🔔 Probar | `test-notification` | button | — | — | — | **INERTE** (sin listener) |
| 🔧 Avanzado | API Dólar | `dolarapi-url` | url | `dolarApiUrl` | `https://dolarapi.com/v1/dolares/oficial` | **ninguna** | sólo popup (`popup.js:2443`) |
| 🔧 Avanzado | API USDT/ARS | `criptoya-ars-url` | url | `criptoyaUsdtArsUrl` | `https://criptoya.com/api/usdt/ars/1` | **ninguna** | sólo popup (`popup.js:2444`) |
| 🔧 Avanzado | API USDT/USD | `criptoya-usd-url` | url | `criptoyaUsdtUsdUrl` | `https://criptoya.com/api/usdt/usd/1` | **ninguna** | sólo popup (`popup.js:2445`) |
| 🔧 Avanzado | API Bancos | `criptoya-banks-url` | url | `criptoyaBanksUrl` | `https://criptoya.com/api/bancostodos` | **ninguna** | bg (`main-simple.js:564`) |
| 🔧 Avanzado | Intervalo actualización (min) | `update-interval` | number 1–60 | `updateIntervalMinutes` | 5 / 5 | ninguna | sí (`main-simple.js:2274-2288`) |
| 🔧 Avanzado | Timeout (seg) | `request-timeout` | number 5–120 | `requestTimeoutSeconds` | 10 / 10 | ninguna | sí (ídem) |
| 🔧 Avanzado | Advertir datos obsoletos | `freshness-warning` | switch | `dataFreshnessWarning` | checked / true | ninguna | **INERTE** (asignada, 0 usos) |
| 🔧 Avanzado | Alertas riesgo | `risk-alerts` | switch | `riskAlertsEnabled` | checked / true | ninguna | **INERTE** (asignada, 0 usos) |
| 🔧 Avanzado | Confirmar montos altos | `confirm-high-amount` | switch | `requireConfirmHighAmount` | checked / true | ninguna | **INERTE** (`ValidationService` sin callers) |
| 🔧 Avanzado | Umbral monto alto (ARS) | `high-threshold` | number 10000–1e7 | `minProfitWarning` ← nombre ajeno | 500000 / **0.5** | ninguna | **INERTE** (O-09) |
| 🔧 Avanzado | 💾 Guardar | `save-settings` | button | escribe las 54 claves | — | — | sí |
| 🔧 Avanzado | 🔄 Reset | `reset-settings` | button | escribe `DEFAULT_SETTINGS` | — | — | sí, con O-18 |

### A.2 Grupos de controles por `name` (142 controles, 8 grupos)

| Sección | `name` | Cantidad | Etiqueta de la sección | Clave | Default (si la clave es `undefined`/`[]`) | Valores |
|---|---|---|---|---|---|---|
| 💵 | `dollar-price-source` | 2 (radio) | Fuente del precio | `dollarPriceSource` | `auto` | `auto`, `manual` |
| 💵 | `bank` | 16 | Bancos a consultar | `selectedBanks` | `bna, galicia, santander, bbva, icbc` | 16 bancos (5 principales / 5 regionales / 6 otros) |
| 🔄 | `p2p-usdt-usdt-exchange` | 13 | Paso 2: USD → USDT | `p2pUsdtUsdtExchanges` (escrito) / `p2pUsdUsdtExchanges` (leído) | 8 de 13 | 13 (+ `huobip2p`, `mexcp2p`, `weexp2p`, `coinexp2p`, `lemoncashp2p` fuera del default) |
| 🔄 | `p2p-usdt-ars-exchange` | 13 | Paso 3: USDT → ARS | `p2pUsdtArsExchanges` | 8 de 13 | idénticos a la lista anterior |
| 🔄 | `p2p-sync-exchange` | 13 | Sincronización | `p2pSyncExchanges` | 8 de 13 | idénticos |
| 🏛️ | `traditional-exchange` | 36 | Exchanges Tradicionales | `selectedTraditionalExchanges` | los 36 | lista de 36 exchanges |
| 💎 | `usdt-broker` | 36 | Exchanges USDT para Rutas | `selectedUsdtBrokers` | los 36 | **exactamente los mismos 36 valores** (verificado: listas idénticas) |
| 🔔 | `notify-exchange` | 13 | Exchanges (notificaciones) | `notificationExchanges` | 10 marcados en el HTML | 10 directos + 3 P2P |

Conteo de repetición: los 140 checkboxes con `name` representan **65 valores distintos**
(16 bancos + 13 P2P + 36 exchanges) → **75 casillas son repeticiones literales (53,6%)**.

### A.3 Claves que se escriben al guardar (54) y cuáles no tienen control

`getCurrentSettings()` devuelve 54 claves (harness: `Object.keys(...).length = 54`). 36 provienen
de un control de la UI; **18 se escriben siempre con su valor de fábrica**, sin ningún control que
las pueda cambiar desde esta página:

```
preferredExchanges, preferSingleExchange, fallbackUsdToUsdtRate, applyFeesInCalculation,
brokerFees, showBestBankPrice, selectedP2PExchanges, paso1_ars_usd_banco,
paso2_usd_usdt_exchange, paso3_usdt_ars_exchange, disabledExchanges, validateBankSpreads,
validateExchangeData, logValidationErrors, disabledP2pUsdtArs, disabledP2pUsdUsdt,
disabledP2pSync, p2pUsdtUsdtExchanges
```

Consecuencia directa: cada clic en "Guardar" **sobrescribe** esas 18 claves con el default,
borrando lo que haya escrito cualquier otro componente (O-01 y O-13).

### A.4 Ayuda visible y unidad declarada por campo

| Ayuda en la página | Línea | Qué dice |
|---|---|---|
| `field-hint` | `options.html:55` | "Solo se usa si seleccionas 'Manual'" |
| `field-hint` | `options.html:389` | "Excluye precios más del 15% alejados del promedio" (control inerte) |
| `field-hint` | `options.html:580-583` | "Si no seleccionas ninguno, se usarán todos" |
| `info` | `options.html:916` | "Estos fees se suman a los predeterminados" (**falso** en la práctica, ver O-02) |
| `section-description` | 8 secciones | una frase genérica por sección |

Total: **3 ayudas contextuales para 191 controles** (1,6%).

---

## Hallazgos

### O-01 — CRÍTICO — "Guardar" borra silenciosamente todos los fees por broker

**Evidencia** — `src/options.js:793-795` y `:64`:

```js
793|function getCurrentSettings() {
794|  const settings = { ...DEFAULT_SETTINGS };
```
```js
64|  brokerFees: [], // Array de {broker: string, buyFee: number, sellFee: number}
```

`getCurrentSettings()` nunca escribe `brokerFees` (grep: la única escritura de esa clave está en
`saveBrokerFees()`, `options.js:714-731`), y el guardado reemplaza el objeto entero
(`src/options.js:742`):

```js
742|    await chrome.storage.local.set({ notificationSettings: settingsToSave });
```

**Reproducción ejecutada (harness, con el `src/options.js` real):**

```
CASO 3 · getCurrentSettings().brokerFees = []
CASO 4 · storage tras Guardar: brokerFees = [] | extraTradingFee = 0.5 | minProfitWarning = 500000
```

**Qué está mal:** los fees por broker viven en su propio flujo de guardado (se persisten al
agregarlos, `options.js:596`), pero el botón principal guarda un objeto construido desde
`DEFAULT_SETTINGS`, donde `brokerFees` es `[]`. Un clic en "Guardar" borra todo lo configurado en
la sección Fees → y la lista en pantalla sigue mostrando los brokers.

**Impacto:** el usuario carga "Fiwind: compra 0,5% / venta 0,75%", después guarda cualquier otro
cambio, y el motor vuelve a usar 0% para ese broker (con F-01/F-03 encima, la ganancia mostrada
queda sobreestimada). No hay ningún aviso: el borrado es silencioso y la UI queda mintiendo.

**Fix propuesto:** que `getCurrentSettings()` incluya los fees desde el DOM, o que
`saveSettings()` haga *merge* en vez de reemplazo:

```js
settings.brokerFees = Array.from(
  document.querySelectorAll('#broker-fees-list .broker-fee-item')
).map(el => ({
  broker: el.dataset.broker,
  label: el.querySelector('.broker-fee-name').textContent,
  buyFee: parseFloat(el.dataset.buyFee) || 0,
  sellFee: parseFloat(el.dataset.sellFee) || 0
}));
```

**Cómo verificar:** agregar un broker con fees ≠ 0, pulsar "Guardar", y leer
`chrome.storage.local.get('notificationSettings')` → `brokerFees` debe conservar el broker.

---

### O-02 — CRÍTICO — La sección "Fees y Comisiones" no tiene efecto y no hay forma de activarla desde la UI

**Evidencia** — `src/options.js:63` (default) y `src/background/main-simple.js:1006`:

```js
63|  applyFeesInCalculation: false, // CORREGIDO: false por defecto = sin fees
```
```js
1006|  const applyFees = userSettings.applyFeesInCalculation || false; // false por defecto
```

`grep -rn "applyFeesInCalculation" src/` devuelve **exactamente esas dos líneas**: no hay ningún
`input`/`select` en `options.html` que escriba la clave (0 ocurrencias en el HTML). Todas las
restas de fees están dentro de `if (applyFees)` (`main-simple.js:902`, `:914`).

**Qué está mal:** la página ofrece 4 inputs de fees + el gestor de "fees por broker" y un texto que
afirma "Estos fees se suman a los predeterminados" (`options.html:916`), pero el interruptor que
los activa no existe en la interfaz y su default es `false`. F-02 describe el síntoma (se muestra
ganancia sin comisiones); acá está la causa desde la página de configuración: **el usuario no puede
corregirlo desde ningún lugar de la UI.**

**Impacto:** todas las comisiones que el usuario carga con cuidado son decorativas. El número que
ve sigue siendo bruto, sin ninguna indicación en pantalla de que lo es.

**Fix propuesto:** agregar el control explícito en la sección Fees ("Aplicar comisiones al
cálculo", default `true` para una herramienta de arbitraje) y, mientras esté en `false`, mostrar
sobre las rutas del popup la etiqueta "sin comisiones".

**Cómo verificar:** `grep -rn "applyFeesInCalculation" src/` debe incluir una lectura desde el DOM
en `options.js`; y en la UI, apagado el interruptor, el popup debe decir que el número es bruto.

---

### O-03 — ALTO — 53 de 191 controles (27,7%) no cambian ningún comportamiento

**Evidencia** — grep de consumidores por clave (`grep -rn "<clave>" src/`), con el archivo donde
aparece cada una:

| Bloque | Cantidad | Control | Prueba |
|---|---|---|---|
| 💵 | 1 | `best-bank-only` | el id no aparece en `options.js` ni en ningún otro archivo (grep = 0) |
| 🔄 | 1 | `filter-p2p-outliers` | `filterP2POutliers` sólo existe en `options.js:79,325,855`; 0 consumidores |
| 🏛️ | 36 | `traditional-exchange` | `selectedTraditionalExchanges` sólo en `options.js:77,329,373-378,861`; 0 consumidores (ver O-04) |
| 🎨 | 9 | `bank-display`, `bank-interval`, `show-profitable`, `profit-colors`, `compact-view`, `show-icons`, `show-timestamps`, `show-bank-prices`, `prefer-same-exchange` | los ids no aparecen en `options.js` (grep = 0). El popup y los módulos leen **otras** claves: `interfaceBankDisplayMode`, `interfaceBankUpdateInterval`, `interfaceShowOnlyProfitable`, `interfaceShowProfitColors`, `interfaceCompactView`, `interfaceShowExchangeIcons`, `interfaceShowTimestamps`, `interfaceShowBankPrices`, `interfacePreferSingleExchange` (`popup.js:470-481`, `filterManager.js:337,361,398`, `routeManager.js:350-351`) — y **ninguna de esas claves se escribe en ningún archivo del repo** |
| 💸 | 1 | `add-broker` (tabla legacy dentro de `.broker-fees{display:none}`, `options.html:981-994`) | sin listener en `options.js` (grep = 0) |
| 🔔 | 1 | `test-notification` | id sin referencia en ningún `.js` (ver O-08) |
| 🔧 | 4 | `freshness-warning`, `risk-alerts`, `confirm-high-amount`, `high-threshold` | las claves se leen en `popup.js:426-430` pero no tienen ningún uso posterior; `ValidationService` no tiene callers (ver O-09) |
| **Total** | **53** | | |

**Qué está mal:** un cuarto de la página no hace nada. La causa raíz es doble: (a) controles que
nunca se conectaron a ninguna clave; (b) controles conectados a claves que el popup dejó de leer
cuando se migró a las claves `interface*` (que la página de opciones nunca escribe).

**Impacto:** el usuario configura 53 veces "algo" que no cambia nada, sin manera de distinguirlo de
un control que sí funciona. Es la causa más probable de que el usuario perciba la herramienta como
"no respeta lo que configuro". Para el rediseño: **estos 53 controles no deben existir** (o deben
conectarse antes de rediseñar su apariencia).

**Fix propuesto:** decidir por control: (1) borrar del HTML (los que no tienen consumidor), o
(2) unificar la clave con la que lee el popup (`compact-view` → `interfaceCompactView`, etc.).

**Cómo verificar:** para cada id del bloque 🎨, `grep -rn "<id>" src/` debe devolver al menos una
lectura en `options.js` **y** una en el archivo que consume la clave.

---

### O-04 — ALTO — "Exchanges Tradicionales": 36 checkboxes idénticos a "Exchanges USDT" pero inertes

**Evidencia** — `src/options.html:402-403` (texto de la sección) y `src/options.js:861`:

```js
402|              Selecciona los exchanges tradicionales (no P2P) a incluir en cálculos. Por defecto
403|              todos están seleccionados.
```
```js
861|  settings.selectedTraditionalExchanges = Array.from(selectedTraditionalCheckboxes).map(
862|    cb => cb.value
863|  );
```

Verificación programática de la lista de valores: `traditional-exchange` y `usdt-broker` tienen
**los mismos 36 valores en el mismo orden** (`traditional == usdt-broker? True`).
`grep -rn "selectedTraditionalExchanges" src/` sólo devuelve `options.js` (escritura y lectura
propias): **ningún consumidor**.

**Qué está mal:** dos secciones consecutivas de 36 checkboxes con la misma lista. La primera
(Tradicionales) no afecta el cálculo; la segunda (USDT para Rutas) sí lo hace, vía
`filterExchangesBySelection(usdt, userSettings.selectedUsdtBrokers)` (`main-simple.js:668`,
`:1014-1015`).

**Impacto:** el usuario desmarca exchanges en la sección equivocada, no pasa nada, y concluye que
la herramienta ignora su configuración.

**Fix propuesto:** eliminar la sección "Exchanges Tradicionales" (72 casillas menos) o, si el
motor va a distinguir tradicionales de P2P, hacer que el filtro lea
`selectedTraditionalExchanges` — pero nunca dejar las dos listas activas.

**Cómo verificar:** `grep -rn "selectedTraditionalExchanges" src/ --include=*.js | grep -v options.js`
debe devolver al menos una línea de `main-simple.js`, o la sección no debe existir.

---

### O-05 — ALTO — El fee de Lemon nunca se aplica: `lemon-cash` vs `lemoncash`

**Evidencia** — `src/options.html:925` (valor que guarda la UI) y `src/background/main-simple.js:635-642`:

```html
925|                    <option value="lemon-cash">🍋 Lemon</option>
```
```js
635|function resolveBrokerFee(userSettings, exchange, feeType) {
636|  const config = (userSettings.brokerFees || []).find(
637|    fee => fee.broker.toLowerCase() === exchange.toLowerCase()
638|  );
639|  if (config && config[feeType] > 0) return config[feeType];
```

El identificador de exchange que usa el motor viene de las claves de la API. Verificado con
`curl https://criptoya.com/api/usdt/ars/1`:

```
keys: ['buenbit','ripio','ripioexchange','satoshitango',... 'lemoncash','okexp2p',...]
lemon? ['lemoncash', 'lemoncashp2p']
```

`grep -rn "lemon-cash" src/ --include=*.js` → **0 resultados** (sólo existe en el HTML). La
comparación es de igualdad estricta (`===`) sin normalizar guiones.

**Qué está mal:** el `<option>` de Lemon guarda `lemon-cash`; el motor busca `lemoncash`. Nunca
matchea, en ninguna de las 4 llamadas a `resolveBrokerFee` (`:903`, `:964`, `:1167`, `:785`).

**Impacto:** el usuario configura el fee de Lemon y el cálculo lo ignora (0%), sobreestimando la
ganancia. Los otros 3 brokers del select (`fiwind`, `buenbit`, `letsbit`) sí coinciden con las
claves de la API; `other` depende de que el usuario escriba el id exacto, cosa que no se le indica.

**Fix propuesto:** cambiar el value a `lemoncash` y documentar en la UI que el nombre libre debe
coincidir con el id del exchange (o normalizar en `resolveBrokerFee`:
`fee.broker.toLowerCase().replace(/[-\s]/g, '')`).

**Cómo verificar:** con `brokerFees=[{broker:'lemoncash',sellFee:1}]`, la ruta de Lemon debe
mostrar `fees.sell > 0`.

---

### O-06 — ALTO — Unidades contradictorias: la UI dice % y USD, el motor resta ARS

**Evidencia** — `src/options.html:893-905` (etiquetas y sufijos de la UI):

```html
893|              <label for="withdrawal-fee">Fee retiro (%)</label>
897|                <span>%</span>
901|              <label for="transfer-fee">Fee transferencia (USD)</label>
904|                <span>USD</span>
```

y `src/background/main-simple.js:914-919` (mismas claves, unidades ARS):

```js
914|  if (applyFees) {
915|    withdrawalFee = userSettings.extraWithdrawalFee || 0;
916|    transferFee = userSettings.extraTransferFee || 0;
917|    bankFee = userSettings.bankCommissionFee || 0;
918|    finalAmount = arsFromSale - (withdrawalFee + transferFee + bankFee);
```

El propio default dice ARS (`src/options.js:59-60`): `extraWithdrawalFee: 0, // $0 ARS - ...`,
`extraTransferFee: 0, // $0 ARS - ...`.

**Qué está mal:** tres etiquetas declaran una unidad distinta de la que el motor aplica. `fee
retiro` se rotula **%** pero se resta como **pesos**; `transferencia` se rotula **USD** pero se resta
como **pesos** (mezcla 1 USD ≈ 1400 ARS con ARS); `comisión bancaria` dice % y también se resta como
pesos.

**Impacto:** el usuario cree estar poniendo "1%" y el motor resta 1 ARS (la ganancia queda
sobreestimada); o cree poner "5 USD" de transferencia y el motor resta 5 ARS (error del orden de
1400×). La corrección pedida tampoco es visible: el número final no se desglosa en la UI.

**Fix propuesto:** una sola semántica por campo, explícita en la etiqueta y en el sufijo:
`Fee retiro (ARS fijos)` / `Fee retiro (%)` como dos campos distintos, o convertir el porcentaje a
ARS antes de restar. Documentar la unidad junto al campo y aplicarla en `main-simple.js`.

**Cómo verificar:** con `applyFeesInCalculation=true`, `extraWithdrawalFee=1` debe restar el 1% de
`arsFromSale` (no 1 ARS).

---

### O-07 — ALTO — "Horario silencioso": las horas son inalcanzables

**Evidencia** — `src/options.html:1055`:

```html
1055|            <div class="quiet-config hidden" id="quiet-config">
```

`grep -rn "quiet-config" src/` → sólo dos resultados: esa línea y `.quiet-config` en
`options.css:549`. **Ninguna línea de `options.js`** muestra u oculta el bloque, y el switch
`quiet-hours` no tiene listener (`options.js:945-957` tampoco lo toca).

**Qué está mal:** el contenedor de `#quiet-start` / `#quiet-end` arranca con la clase `hidden`
(`options.css:575`) y nunca se quita; el switch "Horario silencioso" se guarda (`quietHoursEnabled`)
pero no puede configurarse el rango.

**Impacto:** la ventana silenciosa queda clavada en 22:00–08:00 sin forma de cambiarla: el usuario
que trabaja de noche no puede recibir alertas 00:00–08:00. Dos controles de la página son
inalcanzables.

**Fix propuesto:** listener de `change` en `#quiet-hours` que haga
`quietConfigEl.classList.toggle('hidden', !checked)` (y llamarlo también desde `loadSettings`).

**Cómo verificar:** activar el switch y comprobar que aparecen los dos campos `time`; recargar la
página y que sigan visibles si el switch estaba activo.

---

### O-08 — ALTO — El botón "🔔 Probar" no hace nada

**Evidencia** — `src/options.html:1136`:

```html
1136|            <button id="test-notification" class="btn">🔔 Probar</button>
```

`grep -rn "test-notification\|testNotification" src/` → **0 resultados** en todo `src/`.
No hay listener, ni mensaje al background, ni notificación de prueba.

**Qué está mal:** el único control de la página que permitiría comprobar que las notificaciones
funcionan es un botón muerto.

**Impacto:** el usuario configura umbral, frecuencia y sonido y no tiene manera de validar que algo
llegue. Si no recibe alertas, no puede distinguir "no hubo oportunidad" de "el permiso está
denegado" o "el sonido está roto". Confianza y soporte.

**Fix propuesto:**

```js
document.getElementById('test-notification')?.addEventListener('click', () => {
  chrome.notifications.create(`test-${Date.now()}`, {
    type: 'basic', iconUrl: '../icons/icon128.png',
    title: 'ArbitrARS', message: 'Notificación de prueba'
  });
});
```

**Cómo verificar:** clic en el botón → debe aparecer una notificación del sistema.

---

### O-09 — ALTO — "Umbral monto alto" se guarda en una clave ajena y el umbral real es una constante

**Evidencia** — `src/options.js:219-220` (carga) y `:891-892` (guardado):

```js
219|    const highThresholdEl = document.getElementById('high-threshold');
220|    if (highThresholdEl) highThresholdEl.value = settings.minProfitWarning ?? 500000;
```
```js
891|  settings.minProfitWarning =
892|    parseFloat(document.getElementById('high-threshold')?.value) || 500000;
```

y el único consumidor real de la confirmación, `src/ValidationService.js:13` y `:218-224`:

```js
13|    this.HIGH_AMOUNT_THRESHOLD = 500000; // $500,000 ARS
...
224|    if (amount > this.HIGH_AMOUNT_THRESHOLD) {
```

`grep -rn "requiresConfirmation" src/ tests/` → sólo la definición (`ValidationService.js:218`):
el método no tiene callers. `grep -rn "ValidationService" src/ --include=*.js` (excluyendo su propio
archivo) → **0 usos**, aunque el script se carga en `popup.html`.

**Qué está mal:** (a) el campo se persiste bajo `minProfitWarning` —clave que el popup interpreta
como un porcentaje (`popup.js:431`, `|| 0.5`)—, no bajo un `highThreshold`/`highAmountThreshold` que
es lo que el popup intenta leer (`popup.js:430`); (b) el valor configurado no llega a ninguna
comparación, porque la validación usa una constante hardcodeada y encima está desconectada.

**Impacto:** el usuario sube el umbral a 2.000.000 para no confirmar operaciones chicas (o lo baja
para que le pregunten antes) y no cambia nada: no existe ninguna confirmación de monto alto en la
app. Además, quedan dos claves con el mismo nombre semántico y unidades distintas (0,5% vs 500.000 ARS).

**Fix propuesto:** renombrar la clave a `highAmountThreshold`, hacer que
`ValidationService.requiresConfirmation(amount, profit, settings)` use
`settings.highAmountThreshold` en vez de la constante, y llamarlo desde el flujo del simulador; si
la funcionalidad no se va a implementar, borrar los 3 controles (switch + campo, y la clave).

**Cómo verificar:** `grep -rn "highAmountThreshold" src/` debe mostrar una escritura en
`options.js` y una lectura en el servicio de validación que efectivamente se invoque.

---

### O-10 — ALTO — Validación inexistente y URLs custom sin whitelist (pendiente previo: SIGUE ABIERTO)

**Evidencia** — `grep -c "<form" src/options.html` → `0`; y
`grep -rn "checkValidity\|reportValidity\|setCustomValidity" src/options.js src/options.html` → **0**.

Por lo tanto los atributos `min`/`max`/`step`/`type="url"` son decorativos. Verificado en Chromium
real:

```
Valores del input type=number con min=0 max=10:
{"negativo_aceptado":"-5","notacion_e":"1e3","texto":"","fuera_de_rango":"999","valid":false}
```
(el navegador bloquea letras sueltas, pero acepta `-5`, `1e3` y `999`; `valid:false` sólo importa si
algo llamara a `checkValidity()` o hubiera un `<form>` — no hay ninguno de los dos).

Reproducción sobre el guardado real (harness):

```
CASO B · fee negativa → extraTradingFee = -5 | URL basura → dolarApiUrl = "no-es-una-url"
       | max-routes=0 → maxRoutesDisplay = 20 | umbral=0 → alertThreshold = 1
```

El fetch tampoco valida el host: `src/background/main-simple.js:564` usa la URL configurada
directamente:

```js
564|  const configuredUrl = userSettings.criptoyaBanksUrl;
...
582|  const data = await fetchWithRateLimit(url);
```
y `fetchWithRateLimit` traga el error (`main-simple.js:354-360`):
```js
354|  } catch (e) {
...
359|    console.warn('Fetch error:', url, e.message);
360|    return null;
```

**Qué está mal:** (1) nada valida formato ni rango antes de persistir; (2) para las otras 3 URLs el
consumidor es el popup (`popup.js:2437-2445`, `fetchExchangeRatesFromAPIs()`, llamada en `:2923`),
donde el fallo lo absorbe `Promise.allSettled` y sólo desaparecen datos; (3) no hay ninguna
comprobación de que el host de la URL custom esté cubierto por `host_permissions` (el manifest
declara sólo `dolarapi.com`, `criptoya.com`, `dolarito.ar`, `api.github.com` — `manifest.json:13-18`).
El pendiente de auditorías previas **"validación de URLs con whitelist" sigue abierto en `5fdfa9e`**.

**Impacto:** (a) un fee negativo (`-5`) *sube* artificialmente la ganancia calculada; (b) una URL
malformada o de un host sin permiso deja la app sin datos y sin un mensaje de error visible en
Options (el valor queda guardado y "verde"); (c) `0` en un campo se reemplaza en silencio, así que
el usuario no puede distinguir "guardé 0" de "esto ignoró lo que puse". Nota de precisión: los
hosts por defecto sí mandan `Access-Control-Allow-Origin: *` (verificado con `curl`), así que la
whitelist importa para hosts custom; para el service worker un host fuera de `host_permissions`
depende de los headers CORS del tercero y falla con `null` silencioso.

**Fix propuesto:**

```js
const urlInputs = ['dolarapi-url', 'criptoya-ars-url', 'criptoya-usd-url', 'criptoya-banks-url'];
for (const id of urlInputs) {
  const el = document.getElementById(id);
  if (!el.checkValidity()) { showNotification(`${id}: URL inválida`, 'error'); return false; }
  if (!ALLOWED_HOSTS.includes(new URL(el.value).host)) {
    showNotification(`Host no permitido: ${new URL(el.value).host}`, 'error'); return false;
  }
}
```

con `ALLOWED_HOSTS = ['dolarapi.com','criptoya.com']` (o `optional_host_permissions` +
`chrome.permissions.request`), más un `min`/`max` explícito en JS (no confiar en el atributo) y
rechazo de negativos en los campos de fees.

**Cómo verificar:** `grep -rn "checkValidity" src/options.js` debe devolver al menos una llamada;
en la UI, guardar `no-es-una-url` debe mostrar error y no persistir.

---

### O-11 — ALTO — Los 16 checkboxes de bancos no afectan el filtrado del popup (sync vs local)

**Evidencia** — `src/popup.js:3607-3619` (única lectura de `storage.sync` en todo `src/`):

```js
3607|async function getUserSettings() {
3608|  return new Promise(resolve => {
3609|    chrome.storage.sync.get(
3610|      {
3611|        selectedBanks: undefined,
3612|        preferredExchanges: [],
3613|        notificationExchanges: ['binance', 'buenbit', 'lemoncash', 'ripio', 'fiwind', 'letsbit']
3614|      },
```
consumida en `popup.js:3379` (`dollarTypes = filterBanksBySelection(dollarTypes, userSettings.selectedBanks)`),
mientras que la página de opciones escribe **sólo en local** (`options.js:742`) en `selectedBanks`
(`options.js:835`).

**Qué está mal:** `chrome.storage.sync` nunca recibe escrituras
(`grep -rn "storage.sync" src/` → 1 solo resultado, esa lectura). La ruta del popup que filtra
bancos recibe siempre `undefined` y cae al default hardcodeado (`popup.js:3626-3630`, los 5
principales).

**Impacto:** el usuario desmarca bancos (o selecciona los 16) para acotar el consenso y el popup
sigue mostrando/filtrando con los 5 principales. El background sí respeta la selección
(`main-simple.js:1830-1839`), así que además **el popup y el motor pueden estar calculando sobre
conjuntos de bancos distintos** — dos números distintos para el mismo dólar.

**Fix propuesto:** que `getUserSettings()` lea `chrome.storage.local` (la misma clave
`notificationSettings`) o que la página de opciones escriba también `selectedBanks` en `sync`
(decisión explícita: una sola fuente de verdad).

**Cómo verificar:** desmarcar todos los bancos menos uno, guardar, y comprobar que el popup usa ese
banco (log de `filterBanksBySelection`).

---

### O-12 — ALTO — "Paso 2: USD → USDT": los 13 checkboxes se guardan en una clave que nadie lee

**Evidencia** — escritura (`src/options.js:839-842`) y lectura (`src/options.js:251`):

```js
842|  settings.p2pUsdtUsdtExchanges = Array.from(p2pUsdtUsdtCheckboxes).map(cb => cb.value);
```
```js
251|    const p2pUsdtUsdtExchanges = settings.p2pUsdUsdtExchanges;   // ← otra clave
```
y el default que sí existe (`src/options.js:100`): `p2pUsdUsdtExchanges: undefined,`.
El motor lee la otra grafía (`src/background/main-simple.js:670`):
```js
670|  const p2pUsdUsdtExchanges = userSettings.p2pUsdUsdtExchanges || [];
```

`grep -rn "p2pUsdtUsdtExchanges" src/` → sólo `options.js` (251, 265, 266, 270 = lectura de la otra
clave; 842 = escritura huérfana). `grep -rn "p2pUsdUsdtExchanges" src/` → `main-simple.js:670`,
`options.js:100` y `:251`: **nadie la escribe**.

**Qué está mal:** error de tipeo entre las dos grafías consecuentes: el valor elegido se guarda bajo
una clave que no se lee en ninguna parte, y la clave que se lee siempre está vacía.

**Impacto:** la selección del paso 2 no llega al motor (que la trata como "sin restricción") y
además **se pierde visualmente al recargar**: `loadSettings` vuelve a marcar las 8 de fábrica
(`options.js:252-272`). El usuario desmarca un exchange de P2P para USD y al recargar reaparece
desmarcado/marcado según el default, no según lo que eligió.

**Fix propuesto:** una grafía: `p2pUsdUsdtExchanges` en el default (`:100`), en la carga (`:251`) y
en el guardado (`:842`) — o `p2pUsdtUsdtExchanges` en los tres lugares.

**Cómo verificar:** desmarcar un exchange del paso 2, guardar, recargar y comprobar que sigue
desmarcado y que `chrome.storage.local.get('notificationSettings')` contiene la misma clave que lee
`main-simple.js:670`.

---

### O-13 — MEDIO — Guardar pisa 18 claves que la UI no conoce

**Evidencia** — `src/options.js:794` + defaults `undefined`/`[]` en `:75-91`, `:100-106`;
reproducción (harness):

```
CASO 3 · storage = { disabledExchanges: {paso1:['bna'],…}, selectedUsdtBrokers:['binance'], … }
        getCurrentSettings().disabledExchanges = {"paso1":[],"paso2":[],"paso3":[]}
CASO 4 · storage tras Guardar: brokerFees = [] …
```

**Qué está mal:** `saveSettings` escribe el objeto completo. Toda clave de
`notificationSettings` que la página no lee (las 18 de A.3) vuelve a su default en cada guardado.

**Impacto:** hoy el daño visible es O-01 (los fees). El mismo mecanismo borra `disabledExchanges`,
`disabledP2p*`, `validate*`, `fallbackUsdToUsdtRate` y `selectedP2PExchanges`, así que cualquier
funcionalidad futura que escriba esas claves (o cualquier configuración cargada por otra vía) se
pierde en el próximo clic en "Guardar", sin aviso.

**Fix propuesto:** guardar con `chrome.storage.local.get` + merge explícito de las claves que la UI
controla:

```js
const prev = (await chrome.storage.local.get('notificationSettings')).notificationSettings || {};
await chrome.storage.local.set({ notificationSettings: { ...prev, ...uiKeys } });
```

**Cómo verificar:** escribir `disabledExchanges.paso1=['bna']` en storage, guardar desde la página
y comprobar que sigue ahí.

---

### O-14 — MEDIO — Los checkboxes de notificaciones pre-marcados nunca se desmarcan al cargar

**Evidencia** — `src/options.js:159-167` (sólo marca `true`, nunca `false`):

```js
159|    if (settings.notificationExchanges && settings.notificationExchanges.length > 0) {
160|      settings.notificationExchanges.forEach(exchange => {
161|        const checkbox = document.querySelector(
162|          `input[name="notify-exchange"][value="${exchange}"]`
163|        );
164|        if (checkbox) {
165|          checkbox.checked = true;
166|        }
```

y los 10 checkboxes marcados *en el HTML* (`src/options.html:1075-1113`):
```html
1075|                      <input type="checkbox" name="notify-exchange" value="binance" checked />
```

Reproducción (harness, con los defaults del HTML replicados):

```
CASO A · storage=[ripio] | checkbox Binance (el HTML lo deja marcado) → checked = true
```

**Qué está mal:** el estado guardado sólo puede *agregar* marcas; las 10 casillas que el HTML deja
marcadas quedan marcadas siempre, sin importar lo que diga el storage.

**Impacto:** el usuario desmarca "Binance", guarda, recarga y ve Binance marcado otra vez: cree que
su cambio no se guardó (sí se guardó — el storage es correcto; la pantalla es la que miente). Si
en cambio vuelve a guardar sin tocar nada, la lista de 10 vuelve al storage y la desmarcación se
pierde de verdad.

**Fix propuesto:** asignación bidireccional:
```js
document.querySelectorAll('input[name="notify-exchange"]').forEach(cb => {
  cb.checked = list.includes(cb.value);
});
```

**Cómo verificar:** desmarcar Binance → Guardar → recargar la página de opciones → debe seguir
desmarcado.

---

### O-15 — MEDIO — "Umbral monto alto" arranca en `0.5` (porcentaje) dentro de un campo de ARS

**Evidencia** — `src/options.js:52` y `:220`:

```js
52|  minProfitWarning: 0.5, // Alertar si ganancia < 0.5%
```
```js
220|    if (highThresholdEl) highThresholdEl.value = settings.minProfitWarning ?? 500000;
```
Contra el HTML (`src/options.html:1217-1224`): `min="10000" max="10000000" step="10000" value="500000"`.

Reproducción (harness, storage vacío):

```
CASO 1 · storage vacío → #high-threshold queda en 0.5
CASO 1 · DEFAULT_SETTINGS.minProfitWarning = 0.5 | HTML min=10000 value=500000
```

**Qué está mal:** en una instalación limpia el campo muestra `0.5` —valor inválido para su propio
`min=10000`— porque se carga con el default de una clave semánticamente distinta.

**Impacto:** el usuario ve `0.5 ARS` donde esperaba `500000`; con flechas el stepper salta de 10000
en 10000. Genera desconfianza y un valor que, si se guarda tal cual, contradice el significado de la
clave. (Nota: la captura de baseline `docs/auditoria-2026-09/baseline-visual/00-pagina-completa.png`
muestra 500000 porque ese perfil ya tenía un guardado previo con ese número — el caso limpio es el
del harness.)

**Fix propuesto:** clave propia (`highAmountThreshold`) con default 500000, o `?? 500000` sobre la
clave correcta; nunca reutilizar `minProfitWarning`.

**Cómo verificar:** en un perfil nuevo (`chrome.storage.local.clear()`), abrir la página de opciones
y leer el campo: debe decir 500000.

---

### O-16 — MEDIO — `0` y vacío se reemplazan por defaults en silencio; los negativos se aceptan

**Evidencia** — `src/options.js:798`, `:816-817`, `:829-830`, `:882-884`, `:892`:

```js
798|  settings.alertThreshold = parseFloat(document.getElementById('alert-threshold')?.value) || 1.0;
816|  settings.maxRoutesDisplay = parseInt(document.getElementById('max-routes')?.value) || 20;
829|  settings.manualDollarPrice =
830|    parseFloat(document.getElementById('manual-dollar-price')?.value) || 1400;
```

Reproducción (harness):
```
CASO B · fee negativa → extraTradingFee = -5 | URL basura → dolarApiUrl = "no-es-una-url"
       | max-routes=0 → maxRoutesDisplay = 20 | umbral=0 → alertThreshold = 1
```

**Qué está mal:** `||` (en lugar de `??`) convierte `0` en el default, y no hay ninguna comprobación
de rango ni de signo: `-5` se guarda tal cual.

**Impacto:** (a) un fee negativo *aumenta* la ganancia mostrada; (b) un usuario que quiere
`alertThreshold = 0` (alertar con cualquier spread) no puede; (c) el usuario no recibe ninguna
señal de que su valor fue descartado.

**Fix propuesto:** `Number.parseFloat(v)` + validación explícita con rango, y mensaje de error en
`#save-status` cuando el valor esté fuera de rango; usar `??` donde `0` sea legítimo.

**Cómo verificar:** intentar guardar `-5` en "Fee trading" debe mostrar error de validación y no
escribir la clave.

---

### O-17 — MEDIO — La subdivisión P2P "por paso" es cosmética: el motor une las tres listas

**Evidencia** — `src/background/main-simple.js:669-687`:

```js
669|  const p2pUsdtArsExchanges = userSettings.p2pUsdtArsExchanges || [];
670|  const p2pUsdUsdtExchanges = userSettings.p2pUsdUsdtExchanges || [];
671|  const p2pSyncExchanges = userSettings.p2pSyncExchanges || [];
...
679|  // Todos los exchanges P2P seleccionados (unión de todas las categorías)
680|  const allEnabled = new Set([...p2pUsdtArsExchanges, ...p2pUsdUsdtExchanges, ...p2pSyncExchanges]);
...
686|    if (isP2p && allEnabled.size > 0 && !allEnabled.has(exchange)) continue;
```

**Qué está mal:** el filtro se aplica **globalmente** al mapa de exchanges (unión de las tres
listas), no por paso. La descripción de la sección promete lo contrario
(`options.html:170-171`: "Puedes elegir diferentes exchanges para comprar USD, convertir a USDT, y
vender USDT").

**Impacto:** marcar Binance sólo en "Paso 2" lo habilita también para el Paso 3. Si el usuario
armó una ruta por liquidez de cada exchange, la herramienta puede proponer una combinación que no
quería. Dos secciones (26 checkboxes) sugieren una granularidad que no existe.

**Fix propuesto:** aplicar los filtros por paso en cada llamada de armado de ruta, o simplificar la
UI a una sola lista (decisión de producto; hoy la UI miente en la dirección más costosa).

**Cómo verificar:** marcar un exchange sólo en sincronización y comprobar que no aparece en las
rutas de los pasos 2/3.

---

### O-18 — MEDIO — Reset: puede reportar éxito sobre un guardado fallido, no refresca la lista de brokers y muta `DEFAULT_SETTINGS`

**Evidencia** — `src/options.js:486-496`:

```js
488|    resetButton.addEventListener('click', async () => {
489|      if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
490|        log('🔄 Reseteando configuración...');
491|        await saveSettings(DEFAULT_SETTINGS);
492|        await loadSettings();
493|        showNotification('Configuración restaurada', 'success');
```

`saveSettings` ya notifica por su cuenta (`:787`: `showNotification('Error al guardar configuración', 'error')`)
pero su valor de retorno se ignora acá; y `showNotification` escribe **un solo** elemento
(`:898-909`), así que el mensaje de éxito pisa al de error en el mismo nodo.

Además `saveBrokerFees()` puede mutar el objeto de defaults (`:724-725`):
```js
724|    chrome.storage.local.get('notificationSettings', result => {
725|      const settings = result.notificationSettings || DEFAULT_SETTINGS;
726|      settings.brokerFees = brokerFees;
```

**Qué está mal:** tres defectos en el mismo camino: (1) mensaje de éxito incondicional; (2)
`loadBrokerFees()` no se vuelve a llamar después del reset, así que si había brokers en pantalla
siguen mostrándose aunque el storage ya tenga `brokerFees: []`; (3) si el storage está vacío, el
reset/alta de fees trabaja sobre la referencia literal de `DEFAULT_SETTINGS`.

**Impacto:** el usuario ve "Configuración restaurada" y la lista de brokers sigue poblada: no puede
saber si el reset funcionó. Si el guardado falló (p. ej. cuota), ve un éxito falso.

**Fix propuesto:**
```js
const ok = await saveSettings(DEFAULT_SETTINGS);
await loadSettings();
loadBrokerFees();                       // refrescar la lista
showNotification(ok ? 'Configuración restaurada' : 'Error al restaurar', ok ? 'success' : 'error');
```
y en `saveBrokerFees`: `const settings = { ...(result.notificationSettings || DEFAULT_SETTINGS) };`.

**Cómo verificar:** con brokers cargados, pulsar Reset → la lista debe quedar vacía y el mensaje
debe reflejar el resultado real.

---

### O-19 — MEDIO — Deshabilitar notificaciones no deshabilita sus campos hasta recargar

**Evidencia** — `src/options.js:945-957` (la función) y su única llamada, `:457` (dentro de `loadSettings`):

```js
945|function updateUIState() {
946|  const notifyEnabled = document.getElementById('notify-enabled')?.checked ?? true;
949|  const notificationElements = ['alert-threshold', 'notify-frequency', 'sound-enabled'];
```
`grep -n "notify-enabled" src/options.js` → 134, 797, 946: no hay listener de `change`.

**Qué está mal:** el estado deshabilitado se calcula sólo al cargar la página, nunca al togglear el
switch.

**Impacto:** el usuario apaga "Habilitar notificaciones" y sigue viendo (y pudiendo editar) umbral,
frecuencia y sonido como si estuvieran activos: no hay señal visual de que estén sin efecto.

**Fix propuesto:** `notifyEnabledEl.addEventListener('change', updateUIState);` en
`setupMainEventListeners()`.

**Cómo verificar:** togglear el switch sin recargar → los tres campos deben cambiar de estado.

---

### O-20 — MEDIO — Un solo punto de guardado al final de 5808 px, sin indicador de cambios, feedback de 3 s fuera de viewport

**Evidencia** — `src/options.html:1232-1236` (el footer es el último bloque del documento, después
de 8 tarjetas) y `src/options.js:898-910` (feedback con `setTimeout(..., 3000)` en `#save-status`,
que vive dentro de ese footer). Captura de baseline medida:
`docs/auditoria-2026-09/baseline-visual/00-pagina-completa.png` = **1249 × 5808 px** (≈8 pantallas
de 720 px), con las 8 secciones expandidas y el botón "💾 Guardar" al final.

**Qué está mal:** no hay barra de guardado sticky, ni indicador de "cambios sin guardar", ni
`beforeunload`, ni autosave. El único botón está al fondo del documento, y el mensaje de resultado
aparece y desaparece en 3 s en ese mismo lugar.

**Impacto (medido en acciones del usuario):**

| Tarea típica | Acciones mínimas |
|---|---|
| Cambiar el "Umbral alerta (%)" (sección 7 de 8) | scroll ≈4400 px + foco + tipear + scroll al fondo + clic en Guardar = **5** |
| Desactivar un exchange (sección 4 de 8) | scroll + buscar 1 casilla entre 156 + clic + scroll al fondo + Guardar = **5** |
| Cargar un fee por broker (sección 6) | scroll + elegir broker + nombre + 2 fees + "Agregar" + (guardado propio) + Guardar = **7** |
| Cambiar el precio manual (sección 1) | 1 clic en el radio + tipear + scroll 5808 px + Guardar = **4** |

Si el usuario guarda y no está mirando el footer, **no ve ninguna confirmación**. No hay buscador
(0 coincidencias de `type="search"`/placeholder "buscar" en el HTML) ni índice de secciones.

**Fix propuesto:** barra sticky inferior (o superior) con Guardar/Reset y estado persistente,
badge de "cambios sin guardar" (`input`/`change` global → dirty flag), y anclas/índice lateral por
sección. Si se conserva el guardado explícito, mantener el estado visible ≥5 s y usar `aria-live`.

**Cómo verificar:** editar cualquier campo en la sección 1 y comprobar que se ve un aviso de
cambios sin guardar y que Guardar está alcanzable sin scroll.

---

### O-21 — MEDIO — Dos escritores del mismo objeto sin listeners cruzados (actualización perdida)

**Evidencia** — la página de opciones escribe el objeto completo (`src/options.js:742`) y no escucha
cambios: `grep -n "onChanged" src/options.js` → **0**. El popup sí escucha
(`src/popup.js:745`) pero sólo reacciona a una lista fija:

```js
760|      const relevantChanges = [
761|        'dollarPriceSource',
762|        'manualDollarPrice',
763|        'preferredBank',
764|        'selectedBanks',
765|        'routeType',
766|        'profitThreshold'
767|      ];
```
y otro punto del popup escribe settings por su cuenta (`src/popup.js:3145-3154`):
```js
3154|    await chrome.storage.local.set({ notificationSettings: newSettings });
```

**Qué está mal:** (1) si el usuario cambia el precio desde el diálogo del popup, la página de
opciones abierta sigue mostrando el valor viejo y, al pulsar Guardar, lo revierte (gana el último
escritor porque se reemplaza el objeto entero); (2) cambios en `filterMinProfit`, `maxRoutesDisplay`,
`notificationExchanges`, fees, etc. no disparan refresco del popup abierto: hay que cerrarlo y
abrirlo.

**Impacto:** el usuario cambia algo y "no se aplica"; o descubre que un cambio suyo desapareció
porque tenía la página de opciones abierta en otra pestaña. Es la misma clase de bug que O-01/O-13.

**Fix propuesto:** (a) en `options.js`, escuchar `chrome.storage.onChanged` y marcar el formulario
como "modificado externamente" (o recargar si no hay cambios locales), y (b) hacer *merge* por clave
en las dos vías en lugar de reemplazar el objeto.

**Cómo verificar:** abrir opciones y popup a la vez, cambiar el precio en el popup, y comprobar que
la página de opciones refleja el nuevo valor (o avisa) y no lo pisa al guardar.

---

### O-22 — BAJO — Crash del botón "Agregar" si el nombre del broker tiene comilla

**Evidencia** — `src/options.js:569` (normalización del nombre) y `:638` (selector armado con el valor):

```js
569|      brokerName = customBrokerName.value.trim().toLowerCase().replace(/\s+/g, '-');
```
```js
638|    const existingItem = feesList.querySelector(`[data-broker="${broker}"]`);
```

Verificado en Chromium real:
```
SyntaxError: Failed to execute 'querySelector' on 'Document':
'[data-broker="a"b"]' is not a valid selector.
```

**Qué está mal:** el valor libre del usuario se interpola sin escapar en un selector CSS. Con una
comilla doble, `querySelector` lanza y como el handler del clic no tiene `try/catch`, la ejecución
se corta antes de `addBrokerFeeToList`.

**Impacto:** el botón "➕ Agregar" no hace nada (sin mensaje de error) si el usuario escribe un
nombre con `"`. Sólo afecta brokers personalizados; el nombre no se sanitiza en HTML (eso sí está
cubierto: `sanitizeHTML` en `:661`, que devuelve HTML escapado desde `textContent`).

**Fix propuesto:** no usar selector para datos del usuario:
```js
const existingItem = [...feesList.querySelectorAll('.broker-fee-item')]
  .find(el => el.dataset.broker === broker);
```

**Cómo verificar:** agregar un broker "Otro" llamado `a"b` → debe agregarse igual que cualquier otro.

---

### O-23 — BAJO — Código y markup muertos en la página

**Evidencia:**
- `src/options.js:151`: `document.querySelector(\`input[name="exchange"][value="${exchange}"]\`)` —
  ningún control de `options.html` tiene `name="exchange"` (los grupos reales son `notify-exchange`,
  `traditional-exchange`, `usdt-broker`): bloque inalcanzable dentro de `loadSettings` (`:149-156`),
  que sólo puede leer `preferredExchanges`, clave que nada escribe (A.3).
- `src/options.html:981-994`: tabla legacy de brokers con `style="display: none"` y botón
  `#add-broker` sin listener; el CSS conserva `.broker-dropdown`, `.add-broker-form` y
  `#broker-table` (`options.css:624-625`, `:3` coincidencias de `add-broker`).
- Claves fantasma declaradas y nunca usadas: `selectedP2PExchanges`, `paso1_ars_usd_banco`,
  `paso2_usd_usdt_exchange`, `paso3_usdt_ars_exchange` (`options.js:76,82-84`).

**Impacto:** ruido para quien lee/mantiene la página y para el rediseño (markup que se puede borrar
sin riesgo). Ningún impacto funcional sobre el usuario.

**Fix propuesto:** borrar los tres bloques.

**Cómo verificar:** `grep -rn "name=\"exchange\"" src/options.html` → 0 líneas.

---

### O-24 — BAJO — ESLint `'CommonUtils' is not defined` (`src/options.js:661`): falso positivo, pero la config está mal

**Evidencia** — `src/options.js:658-661`:

```js
658|    // CORREGIDO v6.0.2: Unificado con CommonUtils.sanitizeHTML (R-02)
659|    item.innerHTML = `
660|      <div class="broker-fee-info">
661|        <span class="broker-fee-name">${CommonUtils.sanitizeHTML(label)}</span>
```

`src/utils/commonUtils.js:557`: `window.CommonUtils = CommonUtils;` (IIFE con `window` como
parámetro, `:7`: `(function (window) {`), y `src/options.html:1239-1241`:

```html
1239|    <!-- CORREGIDO v6.0.2: Agregado commonUtils.js para unificar sanitizeHTML (R-02) -->
1240|    <script src="utils/commonUtils.js"></script>
1241|    <script src="options.js"></script>
```

y `.eslintrc.json:15-21` / `:34`:

```json
15|  "globals": {
16|    "chrome": "readonly",
17|    "DataService": "readonly",
18|    "ValidationService": "readonly",
19|    "getProfitClasses": "readonly"
20|  },
...
34|    "no-undef": "warn"
```

**Respuestas concretas a lo pedido:**
1. **Funciona en runtime?** Sí. `commonUtils.js` se carga por `<script src>` **antes** que
   `options.js`, es un script clásico (no módulo) y asigna `window.CommonUtils`, así que la global
   existe cuando corre el handler de "Agregar" (`options.js:563`). Verificado además que el orden es
   el correcto (1240 antes de 1241) y que no hay `type="module"` en ninguno de los dos `<script>`.
2. **El config de ESLint declara las globals?** No: declara `chrome`, `DataService`,
   `ValidationService`, `getProfitClasses` — las tres que el repo usa vía `<script src>` en el
   popup — y se olvidó `CommonUtils` (y `Logger`, que se accede con optional chaining y por eso no
   avisa).
3. **Es síntoma de algo peor?** No de un bug en runtime, sí de **deriva de configuración**: el
   patrón de globals está mantenido a mano archivo por archivo, y `no-undef` está en `warn`, así que
   una referencia realmente inexistente (p. ej. un rename a medias, o `interfaceX` mal escrito)
   también quedaría en amarillo y nadie la vería. Además `"sourceType": "module"` en un repo sin
   módulos hace que ESLint no pueda marcar usos de sintaxis ESM en scripts clásicos. El error real
   latente: si alguien borra el `<script src="utils/commonUtils.js">` de `options.html`, el fallo
   aparece sólo al agregar un broker (TypeError dentro del handler, sin feedback al usuario).

**Fix propuesto:** `.eslintrc.json` → agregar `"CommonUtils": "readonly"` y `"Logger": "readonly"`;
cambiar `"no-undef"` a `"error"`; `"sourceType": "script"`. Alternativa robusta: declarar
`/* global CommonUtils */` en el encabezado de `options.js`, junto a la dependencia comentada.

**Cómo verificar:** `npm run lint` sin warnings de `no-undef` (hoy: 1 warning).

---

### O-25 — BAJO — Accesibilidad: 0 `aria`, encabezados no operables por teclado, 3 labels huérfanos

**Evidencia** — conteos sobre `src/options.html`: `grep -c "aria-"` → **0**; `grep -c "tabindex"` →
**0**; `grep -c "role="` → **0**. Encabezados de sección interactivos como `div`
(`options.html:19-22`: `<div class="card-header" data-action="toggle-section">` con
`cursor: pointer` en `options.css:121`) y el listener en `options.js:923-942` sobre ese `div`.
Análisis de labels: 187 `<label>` totales, 160 con el `<input>` adentro (asociación implícita), 24
con `for=`, y **3 huérfanos** que no hacen nada al clic: `options.html:29` ("Fuente del precio"),
`:74` ("Bancos a consultar"), `:1069` ("Exchanges").

**Qué está mal:** el único mecanismo de plegado (usado para navegar 191 controles) no es alcanzable
ni operable por teclado; no hay roles/estados anunciados; los tres labels huérfanos no están
asociados a ningún control (el de bancos etiquetaría a un grupo de 16).

**Impacto:** la página es inoperable por teclado más allá de los campos: Tab no llega a los
encabezados, así que no se puede colapsar una sección sin mouse. Un lector de pantalla anuncia los
controles sin relación con su etiqueta de grupo.

**Fix propuesto:** `<button class="card-header" aria-expanded="true" aria-controls="...">`; `fieldset`/`legend`
(`role="group"` + `aria-labelledby`) para los 8 grupos de checkboxes; `aria-live="polite"` en
`#save-status`; `for` en los 3 labels huérfanos.

**Cómo verificar:** recorrer la página sólo con Tab/Enter y plegar una sección; `axe`/Lighthouse sin
violaciones de "form elements must have labels".

---

### O-26 — COSMÉTICO — Emojis en todas las etiquetas, 3 ayudas para 191 controles, plegado no persistido

**Evidencia** — `options.html:12-13` (`<h1>⚙️ Configuración</h1>`), emojis en los 8 `<h2>`, los 3
`<h3>` y decenas de etiquetas de control (`🌐 Automático`, `🔥 Consenso (recomendado)`, `🔧 Otro`,
`🗑️`/`✏️` en los botones de la lista de fees); 3 textos de ayuda en total (A.4); el estado colapsado
no se persiste (no hay ninguna `chrome.storage` ni `localStorage` para eso en `options.js:923-942`;
la única `localStorage` de la página es el flag de debug, `options.js:8`).

**Impacto:** ruido visual que compite con la información, y ayuda insuficiente justo donde más falta
(las 36+36 casillas y los 9 controles muertos). Al recargar, las 8 secciones vuelven a estar todas
abiertas: con 5808 px de alto, el usuario no puede "cerrar y dejar cerrado" lo que no usa.

**Fix propuesto:** mover los emojis a la decoración, no al texto de las etiquetas; una línea de
ayuda por control y no por sección; persistir el estado de plegado en `chrome.storage.local` (clave
propia, fuera de `notificationSettings`).

**Cómo verificar:** colapsar 3 secciones, recargar y comprobar que siguen colapsadas.

---

## Verificación de auditorías previas (afirmaciones que tocan esta área)

| Afirmación previa | ¿Sigue siendo cierta en `5fdfa9e`? | Evidencia |
|---|---|---|
| F-07: `npm run lint` → 1 warning `src/options.js:661 'CommonUtils' is not defined` (`no-undef`) | **Sí**, pero es un falso positivo de configuración, no un bug de runtime (ver O-24) | `src/options.html:1240-1241`, `commonUtils.js:557`, `.eslintrc.json:15-21` |
| F-02: "por defecto la extensión muestra ganancia sin comisiones" (`applyFeesInCalculation: false`) | **Sí**, y acá se agrega la causa desde options: no existe control en la UI para activarla (O-02) | `src/options.js:63` (única aparición en options), `main-simple.js:1006` |
| F-03: `extraTradingFee` sólo cae en la rama `buyFee` | **Sí** | `main-simple.js:640-641` |
| F-05: el aviso de "nueva versión" se extrae del mensaje de commit | **Sí** (no lo toqué; confirmado que `checkForUpdatesInBackground` no depende de options) | `main-simple.js:2300-2328` |
| Pendiente de auditorías previas: "validación de URLs con whitelist" (`dolarApiUrl`, `criptoyaUsdtArsUrl`, `criptoyaUsdtUsdUrl`, `criptoyaBanksUrl`) | **SIGUE ABIERTO** — sin whitelist de host, sin validación de formato, sin `checkValidity`; el consumidor en el service worker es sólo `criptoyaBanksUrl` (`main-simple.js:564`), las otras 3 las consume el popup (`popup.js:2437-2445`). El fallo se traga: `fetchWithRateLimit` devuelve `null` (`main-simple.js:354-360`) | O-10 |
| Auditorías previas: "0 XSS activos en el código actual" | **Se sostiene en esta área**: el único `innerHTML` con dato del usuario pasa por `CommonUtils.sanitizeHTML` (`options.js:661`), que escapa vía `textContent`→`innerHTML` (`commonUtils.js:40-46`). Lo que sí encontré es una inyección de **selector CSS** (O-22), que no es XSS pero rompe el handler | `options.js:659-677` |
| Auditorías previas: "onclick inline eliminados" | **Sí**: 0 handlers inline; el único `style=` inline es `display:none` en dos contenedores (`options.html:932`, `:981`) | grep `onclick` = 0 |
| "Validación de origen en mensajes" (otras áreas) | `options.js:763` envía `{action:'settingsUpdated'}` sin validar la respuesta más allá de `response?.success`; el background tiene handler (`main-simple.js:2087`, registrado en `:2213`) | O-21 |

---

## Parte B — Hallazgos ya cubiertos por el orquestador que NO repito

F-01 (comisión de venta descartada), F-02 (default sin fees), F-03 (`extraTradingFee` sólo compra),
F-04 (motor duplicado/muerto), F-05 (falso positivo de versión), F-06 (`.backup` en `src/`), F-08
(deriva de documentación). Este informe los cita sólo cuando la página de configuración es el punto
de entrada del mismo problema (O-02 = causa desde options de F-02; O-05/O-06 = causas desde options
de F-01/F-03).

---

## Lo que NO pude verificar

1. **La página renderizada dentro de Brave con la extensión cargada.** No pude abrir
   `chrome-extension://eekjnnmknnmdieggifdakabaonghfakl/src/options.html` desde mi sesión de
   navegador (no es el perfil del usuario). El comportamiento de carga/guardado lo verifiqué con un
   harness Node que ejecuta el `options.js` real contra un DOM y un `chrome.storage` falsos — fiel
   para la lógica, pero **no** para el layout ni para lo que el navegador hace con `input.value`
   inválido. Las mediciones visuales salen de la captura de baseline que ya existía
   (`baseline-visual/00-pagina-completa.png`, 1249×5808).
2. **El estado real del perfil del usuario.** La captura muestra "Umbral monto alto = 500000"
   mientras el caso limpio del harness da 0.5: no sé qué había guardado ese perfil, así que no pude
   determinar si el usuario ya sufrió O-01 (fees borrados) en la práctica. Haría falta leer
   `chrome.storage.local` del perfil real.
3. **`npm run lint` / `npx jest`**: prohibido ejecutarlos en este trabajo. Tomo el warning de
   `src/options.js:661` del brief (F-07) y lo analicé por código. No ejecuté el linter con mis
   posibles cambios de config.
4. **Consumo real de `dataFreshnessWarning` y `riskAlertsEnabled`**: `grep` sobre `src/` da una
   sola ocurrencia cada uno (`popup.js:427-428`, la asignación a `userSettings`). Marqué ambos como
   inertes, pero no descarto que un componente no cargado (o una build futura) los lea; con el
   código de `5fdfa9e` no hay consumidor.
5. **Las rutas P2P por paso (O-17)**: verifiqué que el filtro de exchanges se aplica como unión
   (`main-simple.js:680-687`), pero no seguí todas las ramas de armado de ruta P2P en
   `main-simple.js` (2400+ líneas) para confirmar si algún camino posterior vuelve a filtrar por
   paso. Si existiera, O-17 bajaría a BAJO.
6. **El icono/permiso de notificaciones en runtime** (relevante para O-08): no verifiqué que
   `chrome.notifications` esté concedido en el perfil; el manifest declara el permiso, no lo probé.

---

## Anexo R — Insumo medido para el rediseño visual (Apple)

Todo lo de esta sección es dato medido o citado, para que el rediseño se trace contra números.

**R.1 Volumen y forma del contenido**

| Métrica | Valor | Fuente |
|---|---|---|
| Controles totales | **191** (180 inputs + 4 selects + 7 botones) | parser sobre `options.html` |
| Checkboxes | **156** (81,7% de los controles) | ídem |
| Inputs numéricos | 15 (7,9%) | ídem |
| Secciones (`.card`) | 8, todas expandidas por defecto | `options.html:16-1229` |
| Alto de la página | **5808 px** a 1249 px de ancho (≈8 pantallas) | `baseline-visual/00-pagina-completa.png` (ancho medido en el IHDR del PNG; `ANEXO-B-LINEA-BASE-UX-OPTIONS.md` informa 1264 px de viewport — la diferencia es de 15 px de scrollbar) |
| Controles por sección | 21 / 40 / 36 / 38 / 13 / 10 / 21 / 12 | parser |
| Casillas repetidas | 75 de 140 (53,6%): 65 valores distintos en 140 casillas | A.2 |
| Ayuda por control | 3 textos de ayuda / 191 controles (1,6%) | A.4 |
| Controles sin efecto | 53 (27,7%) + 13 de "Paso 2" + 9 dependientes de `applyFeesInCalculation` = **75 (39,3%)** | O-03, O-12, O-02 |
| Puntos de guardado | 1 explícito (footer al final) + 1 implícito (lista de fees) | `options.js:475`, `:596` |
| Buscador / índice | **ninguno** | 0 coincidencias en `options.html` |

**R.2 Sistema visual actual (a reemplazar) — `src/options.css`**

| Aspecto | Hoy | Referencia Apple (`DESIGN-REFERENCIA-APPLE.md`) |
|---|---|---|
| Tema | GitHub Dark: `#0d1117` fondo, `#161b22` tarjeta, `#21262d`/`#30363d` terciario | `#f5f5f7` / `#000000` / `#272729` |
| Acento | `#58a6ff` + semánticos `#3fb950`, `#d29922`, `#f85149` (`options.css:25-29`) | un único `#0071e3` |
| Bordes | `1px solid var(--color-border-default)` en tarjeta y header (`:117`) y en `.footer` (`:766`) | sin bordes en tarjetas |
| Radios | 4 / 6 / 8 px (`:40-42`) | 8 / 11 / 12 / 980 px |
| Tipografía base | **13 px** (`:59`); etiquetas 12 px (`:319`); casillas de exchanges **11 px** (`:412`); h2 de tarjeta 16 px (`:131`) | cuerpo 17 px, micro 12 px, título de tarjeta 21 px |
| Layout | `.container{max-width:1400px}` (`:66`), columna única de tarjetas (`.grid` flex column, `:71-76`) | 980 px centrado, aire externo |
| Grillas | `.banks-grid` 3 columnas fijas (`:418`); `.checkbox-grid` `auto-fill minmax(130px)` (`:309`) y `minmax(120px)` dentro de grupos (`:406`) | control de filtro 11 px de radio, densidad interna |
| Foco | `input:focus, select:focus` (`:227`) — sin regla para botones, switches, ni encabezados | `2px solid #0071e3` en **todos** los interactivos |
| Responsive | 3 breakpoints: 1200 / 800 / 500 px (`:777`, `:787`, `:833`) | 1 columna en angosto, títulos 40→28 |
| Switches | `.switch` con `slider` (`:336-379`), `accent-color` en checkboxes (`:332`) | píldora/44×44 de toque |
| Colores declarados | 12 hex en `:root` | prohibido agregar acentos |

**R.3 Interacciones que el rediseño debe resolver sí o sí** (todas con evidencia en O-*)

1. Un solo punto de guardado al final de 5808 px y sin indicador de cambios (O-20).
2. 156 checkboxes en 8 grupos, 75 repetidos, 36 de ellos inertes (O-03, O-04).
3. El mismo vocabulario visual para un control que funciona y para uno que no (O-03).
4. Ayuda al 1,6% de los controles (O-26).
5. Plegado no persistido y no operable por teclado (O-25, O-26).
6. Errores de validación inexistentes (O-10, O-16): no hay estados de error ni de éxito por campo,
   sólo un `#save-status` de 3 s.

**R.4 Qué se puede borrar sin tocar la lógica** (insumo directo para el rediseño)

- Sección completa "🏛️ Exchanges Tradicionales": 36 casillas + título + descripción (O-04).
- `#add-broker` y la tabla legacy `.broker-fees{display:none}` (`options.html:981-994`).
- 9 switches de "🎨 Interfaz" sin consumidor (O-03, bloque 🎨).
- `best-bank-only` (O-03), `filter-p2p-outliers` (O-03), `test-notification` (O-08), `bank-interval`
  y `bank-display` (O-03).
- En total: **53 controles borrables** (27,7% de la página) y ~110 líneas de markup asociadas, sin
  que ninguna ruta de cálculo cambie de resultado.
