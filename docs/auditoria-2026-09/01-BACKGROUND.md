# Auditoría BACKGROUND (service worker) — ArbitrageAR-USDT

Fecha: 2026-09-19 · Commit `5fdfa9e` (`docs: sync claude notes and analysis`) · Árbol limpio (único cambio sin
trackear: `docs/auditoria-2026-09/`).

Los hallazgos F-01 a F-08 del orquestador **no se repiten** como propios; se verifican aparte en la sección
"Veredicto sobre F-01..F-08". Los hallazgos de este informe son **B-01 a B-14**, todos nuevos, cada uno con
`archivo:línea` y la línea citada.

---

## Alcance

**Leídos completos**

| Archivo | Líneas |
|---|---|
| `src/background/main-simple.js` | 2475 |
| `src/background/apiClient.js` | 207 |
| `src/background/cacheManager.js` | 209 |
| `manifest.json` | 40 |
| `src/utils/bankCalculations.js` | 262 |
| `tests/background.messageHandler.test.js` | 199 |
| `.claude/auditorias/BACKGROUND_AUDIT_2026-03-31.md` | 489 |

**Leídos parcialmente (con `grep` sobre el resto)**

- `src/options.js` (líneas 30-150, 730-800, 838-880 + grep de claves de config).
- `src/options.html` (grep de `update-interval`, `request-timeout`).
- `src/popup.js` (líneas 975-1065 + grep de `sendMessage`/`setInterval`).
- `src/modules/notificationManager.js` (líneas 140-170, 255-325).
- `src/DataService.js` (grep de `rateLimit`, `lastRequestTime`; **no leído completo**).
- `src/background/arbitrageCalculator.js` (**no leído completo**: lo cubre F-04).
- `.claude/auditorias/CONSOLIDATED_AUDIT_2026-04-01.md` (grep de la sección Background).

**No leídos (confesión)**: `src/popup.js` completo (4697 líneas), `src/DataService.js` completo, el resto de
`tests/`, `docs/` (más allá de los documentos exigidos). Nada de lo que afirmo depende de ellos, salvo donde
lo indico.

**No ejecutado**: no corrí `npx jest` (escribe caché) ni el service worker en Brave. Las conclusiones sobre
temporización del worker son inferencias sobre el modelo de eventos documentado por Chrome, y están marcadas
como tales. Sí ejecuté `node -e` (sin escribir archivos) para las reproducciones que indico.

---

## Resumen

| ID | Severidad | Título | Archivo:línea |
|---|---|---|---|
| B-01 | ALTO | El antiduplicado de notificaciones usa dos claves distintas y nunca coincide | `src/background/main-simple.js:1670` vs `:1743` |
| B-02 | ALTO | Todo el estado de control de notificaciones vive en memoria y muere con el worker | `src/background/main-simple.js:1595-1596`, `:1813` |
| B-03 | ALTO | Cada arranque del worker dispara `updateData()` duplicados y concurrentes, sin guard | `src/background/main-simple.js:2379`, `:2032`, `:2439`, `:2265` |
| B-04 | ALTO | El rate limiting real está desactivado en el camino de producción | `src/background/main-simple.js:281`, `:324` |
| B-05 | ALTO | Un fallo de API se presenta como "0 oportunidades" (`{}` es truthy, `error: null`) | `src/background/main-simple.js:241`, `:1927`, `:1966` |
| B-06 | MEDIO | `MESSAGE_TIMEOUT_MS = 12000` fijo vs. timeout configurable 5-120 s | `src/background/main-simple.js:2040` vs `src/options.html:1184` |
| B-07 | MEDIO | Las alarmas se borran y recrean en cada arranque (reinician el contador); sin guard de solapamiento | `src/background/main-simple.js:2422-2427`, `:2446`, `:2453` |
| B-08 | MEDIO | Tres módulos se importan en cada arranque y no se usan: no existe caché real | `src/background/main-simple.js:23` + `apiClient.js`, `cacheManager.js` |
| B-09 | MEDIO | Las URLs de API que el usuario edita no se usan; el background lee claves que nadie escribe | `src/background/main-simple.js:184`, `:217`, `:366-560` vs `src/options.js:874-879` |
| B-10 | MEDIO | El badge `!` y `pendingUpdate` son permanentes: no hay forma de limpiarlos | `src/background/main-simple.js:2344`, `:2332` |
| B-11 | MEDIO | El test que dice cubrir el background no carga el background; 2475 líneas sin cobertura | `tests/background.messageHandler.test.js:2` vs `:30-187` |
| B-12 | BAJO | Estado/funciones muertas y listas de bancos triplicadas | `src/background/main-simple.js:36`, `:263`, `:2215` |
| B-13 | BAJO | `console.error`/`console.warn` no gateados: el background escribe en la consola del usuario | `src/background/main-simple.js:355-359`, `:445-506` |
| B-14 | COSMÉTICO | Carácter de reemplazo U+FFFD incrustado en un log | `src/background/main-simple.js:1885` |

No encontré ningún hallazgo **CRÍTICO** propio. Los dos CRÍTICOS de esta área (`F-01`, `F-02`) son los ya
verificados por el orquestador y los confirmo abajo.

---

## Hallazgos

### B-01 — ALTO — El antiduplicado de notificaciones usa dos claves distintas y nunca coincide

**Evidencia** — `src/background/main-simple.js:1669-1674` (comprobación) y `:1742-1750` (alta):

```js
1669|  // 6. Verificar si ya notificamos este arbitraje recientemente
1670|  const arbKey = `${arbitrage.broker}_${Math.floor(profitPct)}`; // Redondear para evitar spam
1671|  if (notifiedArbitrages.has(arbKey)) {
1672|    log(`[NOTIF] ❌ Arbitraje ya notificado recientemente: ${arbKey}`);
1673|    return false;
1674|  }
```

```js
1742|    // Agregar a notificados (limpiar después de 1 hora)
1743|    const arbKey = `${arbitrage.broker}_${profit.toFixed(2)}`;
1744|    notifiedArbitrages.add(arbKey);
1745|    setTimeout(
1746|      () => {
1747|        notifiedArbitrages.delete(arbKey);
1748|      },
1749|      60 * 60 * 1000
1750|    ); // 1 hora
```

Reproducción ejecutada (`node -e`, sin tocar el repo):

```
checkKey= binance_3  addKey= binance_3.42  iguales= false
```

**Qué está mal**: la comprobación busca `broker_<entero>` y el alta inserta `broker_<2 decimales>`. Los dos
strings nunca son iguales, así que `notifiedArbitrages.has()` **siempre** devuelve `false`. El propio
`docs/CHANGELOG.md:239` documenta el fix ("`arbKey` ahora usa `Math.floor()` para evitar spam de
notificaciones") aplicado sólo en la mitad del código.

**Impacto**: el usuario recibe la misma notificación de forma repetida (cada ciclo de actualización, con
`periodInMinutes=5` por defecto), con sonido y con `requireInteraction` si la ganancia supera 10 %
(`:1735`). Además el `setTimeout` de limpieza de 1 hora **nunca se ejecuta**: cuando el worker se duerme
(circunstancia normal, ver B-02) los timers pendientes se pierden.

**Fix propuesto**: una única función de clave, usada en los dos sitios:

```js
function arbitrageKey(a) {
  const pct = a.profitPercentage || a.profitPercent || 0;
  return `${a.broker || a.exchange}_${Math.floor(pct)}`;
}
```

Y llevar el estado de throttle a un almacén que sobreviva al worker (`chrome.storage.session`), o al menos
guardar `lastNotifiedAt` por clave en `chrome.storage.local`.

**Cómo verificar que quedó bien**:
`node -e "const k=a=>a.broker+'_'+Math.floor(a.profitPercentage||0); console.log(k({broker:'binance',profitPercentage:3.42})===k({broker:'binance',profitPercentage:3.42}))"`
debe imprimir `true`, y en `main-simple.js` debe existir **una sola** construcción de `arbKey`
(`grep -c "arbKey = " src/background/main-simple.js` → `1`).

---

### B-02 — ALTO — Todo el estado de control de notificaciones vive en memoria y muere con el worker

**Evidencia** — `src/background/main-simple.js:1595-1596`, `:1637`, `:1767`, `:1813`:

```js
1595|let lastNotificationTime = 0;
1596|const notifiedArbitrages = new Set(); // Para evitar notificar el mismo arbitraje repetidamente
```

```js
1636|  const minInterval = frequencies[settings.notificationFrequency] || frequencies['1min'];
1637|  if (now - lastNotificationTime < minInterval) {
```

```js
1767|    if (isFirstUpdate) {
1768|      log('[NOTIF] ⏭️ Saltando notificación en inicialización (isFirstUpdate = true)');
```

```js
1813|let isFirstUpdate = true; // NUEVO: Bandera para evitar notificaciones en inicialización
```

Contexto documentado (Chrome, "The extension service worker lifecycle"): *"the service worker terminates
after 30 seconds of inactivity. Receiving an event or calling an extension API resets this timer."*

**Qué está mal**: los tres valores que gobiernan las notificaciones (`lastNotificationTime`,
`notifiedArbitrages`, `isFirstUpdate`) son globales de módulo. El worker se reinicia como mínimo **una vez por
cada disparo de alarma** (la alarma es justamente lo que lo despierta), así que en el momento de decidir una
notificación los tres vuelven a su valor inicial: `lastNotificationTime = 0` (el filtro de frecuencia
`notificationFrequency` de `1min`…`1hour` no se aplica) y `notifiedArbitrages` vacío (el antiduplicado tampoco,
ver B-01). Y `isFirstUpdate` vuelve a `true`, con lo que el guard de "no notificar en la inicialización" se
aplica **a la primera actualización de cada arranque del worker** — es decir, a la que dispara la alarma.

**Impacto**: las opciones de notificación que el usuario configura (frecuencia, y de hecho el umbral de "sólo
una vez por oportunidad") se comportan de forma no determinista: la notificación puede llegar en cada ciclo (5
min por defecto) o no llegar nunca, según quién gane la carrera de B-03. El usuario percibe una herramienta que
"avisa cuando quiere".

**Marcado**: el hecho de código (globales que se reinician en cada evaluación del script) está verificado;
la consecuencia observable **no la reproduje en un navegador** (ver "Lo que NO pude verificar").

**Fix propuesto**: mover el estado a `chrome.storage.session` (sobrevive al worker, no sobrevive al navegador —
es el alcance correcto para un throttle) y eliminar `isFirstUpdate` usando un dato persistido
(`lastUpdateTimestamp`) o un `installTime` en `chrome.storage.local`.

**Cómo verificar que quedó bien**: `grep -n "let lastNotificationTime\|const notifiedArbitrages\|let isFirstUpdate" src/background/main-simple.js`
no debe devolver nada, y con `notificationFrequency = '1hour'` no debe llegar más de una notificación por hora
(se comprueba en `chrome://extensions` → service worker → consola, o contando notificaciones del SO).

---

### B-03 — ALTO — Cada arranque del worker dispara `updateData()` duplicados y concurrentes, sin guard

**Evidencia** — cuatro disparadores distintos de la misma función:

```js
2378|log('[BACKGROUND] Cargando configuración global...');
2379|updateGlobalConfig()
2380|  .then(() => {
2381|    log('[BACKGROUND] Iniciando primera actualización...');
2382|    updateData()
```

```js
2032|  if (currentData) {
...
2059|  updateData()
2060|    .then(data => {
```

```js
2436|chrome.alarms.onAlarm.addListener(async alarm => {
2437|  if (alarm.name === ALARM_NAME) {
2438|    log('⏰ Actualización periódica (desde alarma)...');
2439|    await updateData();
2440|    // Actualizar también datos de bancos
2441|    await updateBanksData();
2442|  }
2443|});
```

```js
2265|    updateData()
2266|      .then(() => {                  // ← disparado por chrome.storage.onChanged
...
2088|  currentData = null;
2089|  isFirstUpdate = false;
2090|  updateData()                       // ← disparado por el mensaje settingsUpdated
```

No existe ningún guard de "ya hay una actualización en curso": `grep -n "isUpdating|inFlight|isRefreshing"`
en `src/` devuelve **0 coincidencias**.

**Qué está mal**: no hay un único dueño de `updateData()`. Casos concretos:

1. **Despertar del worker (el normal)**: el worker se inicia → el código de nivel superior lanza `updateData()`
   (`:2382`) **y** el evento que despertó al worker ejecuta su handler: la alarma → `updateData()` (`:2439`), o
   el popup → `handleGetArbitrages` → `currentData` todavía es `null` (la actualización del arranque no
   terminó) → `updateData()` otra vez (`:2059`). Resultado: **dos rondas completas de fetch en paralelo**.
2. **Guardar en Ajustes**: `src/options.js:742` escribe `notificationSettings` (dispara
   `chrome.storage.onChanged` → `:2265` → `updateData`) y a continuación `src/options.js:763` envía el mensaje
   `settingsUpdated` (→ `:2090` → `updateData`). **Dos actualizaciones por un clic.**
3. Cada `updateData()` hace 3 fetches (`fetchBankDollarRates` en `:1829` + `Promise.all(fetchUSDT, fetchUSDTtoUSD)`
   en `:1914`), y `updateBanksData()` otros 3 (`:256-260`). Sumando el chequeo de versión a GitHub (`:2392`) y
   `handleGetBanksData` (7 fetches en paralelo, `:2116-2124`), un "abrir el popup después de 30 s de
   inactividad" puede llegar a ~10-13 requests, varios de ellos duplicados y simultáneos.

**Impacto**: latencia visible en el popup, CPU/batería y —lo importante— exposición a `429 Too Many Requests`
de CriptoYa sin ningún backoff (ver B-04). Además `currentData` se escribe dos veces con dos instantáneas
distintas de precios: el popup muestra la que termine última, sin que ninguna sea "la correcta".

**Fix propuesto**: single-flight.

```js
let updateInFlight = null;
function updateData() {
  if (updateInFlight) return updateInFlight;
  updateInFlight = doUpdateData().finally(() => { updateInFlight = null; });
  return updateInFlight;
}
```

Y quitar la llamada incondicional de `:2382` (dejar que la haga el handler que corresponda), o hacer que los
handlers esperen `updateInFlight`.

**Cómo verificar que quedó bien**: `grep -n "updateInFlight" src/background/main-simple.js` debe existir; en
runtime, abrir el service worker y contar entradas `fetchWithRateLimit() - INICIANDO` con
`__ARBITRAGE_DEBUG__ = true` al abrir el popup tras 1 minuto de inactividad: deben ser 3, no 6.

---

### B-04 — ALTO — El rate limiting real está desactivado en el camino de producción

**Evidencia** — `src/background/main-simple.js:279-283`, `:320-332`:

```js
279|let REQUEST_INTERVAL = 100; // ms - OPTIMIZADO v5.0.61: Reducido de 600ms a 100ms
280|let REQUEST_TIMEOUT = 10000; // ms - valor por defecto
281|const ENABLE_RATE_LIMIT = false; // NUEVO v5.0.61: Desactivar rate limit por defecto
```

```js
323|  // OPTIMIZADO v5.0.61: Rate limit opcional para mejorar performance
324|  if (ENABLE_RATE_LIMIT) {
325|    const now = Date.now();
326|    const delay = REQUEST_INTERVAL - (now - lastRequestTime);
```

Con `ENABLE_RATE_LIMIT = false`, todo el bloque 325-332 es inalcanzable y `REQUEST_INTERVAL`/`lastRequestTime`
son variables muertas. Los dos módulos que **sí** implementan un limitador no se usan:

- `src/background/apiClient.js:17` → `enableRateLimit: true, // Habilitado por defecto para evitar rate limiting de APIs`,
  pero `ApiClient` sólo aparece en su propio archivo (`grep -rn "ApiClient" src/` → `apiClient.js:6,206`). Nunca se invoca.
- `src/DataService.js:38` → `async fetchWithRateLimit(url) {` con `REQUEST_INTERVAL = 600` real (`:34`), pero
  DataService sólo se usa para el arbitraje cripto (`main-simple.js:1300`, `:2187`), no para el camino
  principal (dólar/USDT/ARS).

**Qué está mal**: el camino que hace el 100 % de los fetches de precios (`fetchWithRateLimit` inline) no tiene
throttling, y hay un endpoint que lanza 7 fetches en paralelo sin límite:

```js
2116|      return Promise.all([
2117|        fetchBankDollarRates(userSettings),
2118|        fetchAllDollarTypes(userSettings),
2119|        fetchUSDT(),
2120|        fetchUSDTtoUSD(),
2121|        fetchUSDT_USD_Brokers(userSettings),
2122|        fetchBinanceP2P_USDT_ARS(userSettings),
2123|        fetchBinanceP2P_USDT_USD(userSettings)
2124|      ]);
```

**Impacto**: ráfagas de 3 a 7 requests simultáneos a `criptoya.com` cada ciclo (multiplicadas por B-03). Si la
API responde 429, `fetchWithRateLimit` devuelve `null` (`:360`) y el usuario ve "no hay oportunidades" (B-05).
El síntoma es una herramienta que "a veces no encuentra nada" sin ningún mensaje de error.

**Marcado**: la hipótesis del 429 **no está reproducida** (no llamé a la API). El hecho verificado es la
ausencia total de throttling en el camino real.

**Fix propuesto**: dos opciones, la primera preferible:
1. Usar `self.dataService.fetchWithRateLimit()` (ya tiene 600 ms + timeout) para todos los fetches del
   background; o
2. `const ENABLE_RATE_LIMIT = true;` y, en lugar de `Promise.all` en `handleGetBanksData`, una cola secuencial.

**Cómo verificar que quedó bien**: `grep -n "ENABLE_RATE_LIMIT = true" src/background/main-simple.js` o
`grep -c "fetchWithRateLimit(" src/DataService.js` con todas las llamadas del background delegadas. En
runtime: Network del service worker, con `Request blocking` de 429 no debe haber más de 1 request simultáneo al
mismo host.

---

### B-05 — ALTO — Un fallo de API se presenta como "0 oportunidades"

**Evidencia** — `src/background/main-simple.js:206-210` y `:239-242`:

```js
206|  } catch (error) {
207|    log('❌ Error obteniendo USDT/USD:', error);
208|    return cachedUsdtUsdData || {};
209|  }
```

```js
239|  } catch (error) {
240|    log('❌ Error obteniendo USDT/ARS:', error);
241|    return cachedUsdtData || {};
242|  }
```

y el consumidor en `updateData`:

```js
1927|    if (!oficial || !usdt) {
```

más el objeto que finalmente recibe el popup:

```js
1959|    const data = {
...
1966|      error: null,
1967|      usingCache: false
1968|    };
```

Reproducción ejecutada:

```
{} es truthy: true
guard !oficial||!usdt con usdt={}: true      ← el valor calculado es el de "faltan datos básicos"
```

(el `true` de la última línea es el resultado de la expresión `!oficial || !usdt` con `usdt = {}`; ver
`node -e "console.log(!{} )"` → `false`, es decir el guard **no** se activa)

**Qué está mal**: `cachedUsdtData` arranca como `{}` (`:276`) y el worker se reinicia constantemente (B-02),
así que el fallback en un error de red es casi siempre `{}`. El objeto vacío es *truthy*, por lo que el guard
de `:1927` no se activa; `updateData` continúa, calcula 0 rutas, y devuelve a propósito `error: null` y
`usingCache: false`. El popup no tiene forma de distinguir "la API falló" de "no hay arbitraje".

**Impacto**: falso negativo silencioso en la única función del producto. Si CriptoYa está caído (o responde
429/500, que `fetchWithRateLimit` convierte a `null` en `:349-360` sin distinguir el motivo), el usuario cierra
la conclusión "hoy no hay oportunidad" con datos que en realidad nunca llegaron.

**Fix propuesto**: distinguir "sin datos" de "datos vacíos".

```js
} catch (error) {
  log('❌ Error obteniendo USDT/ARS:', error);
  return cachedUsdtData && Object.keys(cachedUsdtData).length > 0 ? cachedUsdtData : null; // null, no {}
}
```

y en `updateData`, propagar el motivo (`degraded: true, apiError: 'USDT/ARS'`) para que el popup muestre el
estado "sin datos" que ya sabe renderizar (`src/popup.js:1039` `data.backgroundUnhealthy`).

**Cómo verificar que quedó bien**: test unitario que llame a `fetchUSDT()` con `fetch` rechazando y compruebe
que devuelve `null` (no `{}`); y en runtime, bloquear `criptoya.com` desde DevTools → Network debe verse el
mensaje de error, no la lista vacía.

---

### B-06 — MEDIO — `MESSAGE_TIMEOUT_MS = 12000` fijo contra un timeout configurable de 5 a 120 s

**Evidencia** — `src/background/main-simple.js:2040`:

```js
2040|  const MESSAGE_TIMEOUT_MS = 12000;
```

contra el timeout que sí se configura — `src/options.html:1184`:

```html
1184|                <input type="number" id="request-timeout" min="5" max="120" step="5" value="10" />
```

y `src/background/main-simple.js:303` y `:336`:

```js
303|    REQUEST_TIMEOUT = (userSettings.requestTimeoutSeconds || 10) * 1000; // Convertir segundos a ms
...
336|    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
```

**Qué está mal**: el timeout de cada request es configurable hasta 120 s, pero el plazo interno para responder
al popup está fijo en 12 s. Peor: la secuencia de `resolveDollarPrice` puede encadenar **dos** fetches
(`fetchBankDollarRates` `:1829` y, si falla, `fetchDolarOficial` `:1864`), así que con el default de 10 s el
camino normal ya alcanza 20 s > 12 s. El evento vencido responde `{timeout:true, backgroundUnhealthy:true}`
(`:2050-2056`), el popup muestra "⏰ Timeout del Background" (`src/popup.js:1015-1025`)… y la actualización
**sigue corriendo**, con lo que la próxima apertura del popup vuelve a lanzar otra (B-03).

Contexto documentado (Chrome, lifecycle): *"the service worker terminates if ... a `fetch()` response takes
more than 30 seconds to arrive"*. Con `request-timeout` en 60 o 120 s el usuario configura un valor que no sólo
garantiza el error del popup, sino que puede hacer que Chrome termine el worker a mitad del fetch.

**Impacto**: configurar "Timeout = 30 s" produce siempre la pantalla de timeout; el usuario cree que la
extensión está rota y no hay ninguna pista de que el problema lo causó su propia configuración.

**Fix propuesto**: derivar el presupuesto del mensaje de la configuración, con techo, y no abortar el trabajo:

```js
const budget = Math.min(20000, (userSettings.requestTimeoutSeconds || 10) * 1000 + 2000);
const MESSAGE_TIMEOUT_MS = budget;
```

Además, capar `max` de `request-timeout` a 8 s en `options.html` (el fetch más lento medido de una API de
cotizaciones no necesita más).

**Cómo verificar que quedó bien**: con `request-timeout = 30` y una API lenta simulada (DevTools → Network
throttling "Slow 3G"), el popup **no** debe mostrar el error de timeout interno antes de que lleguen los datos.

---

### B-07 — MEDIO — Las alarmas se borran y recrean en cada arranque del worker; no hay guard de solapamiento

**Evidencia** — `src/background/main-simple.js:2409-2433` y `:2446`:

```js
2420|  try {
2421|    // Limpiar alarmas existentes
2422|    await chrome.alarms.clear(ALARM_NAME);
2423|
2424|    // Crear nueva alarma periódica
2425|    await chrome.alarms.create(ALARM_NAME, {
2426|      periodInMinutes: intervalMinutes
2427|    });
```

```js
2445|// Iniciar actualizaciones periódicas
2446|startPeriodicUpdates();
```

y la alarma horaria, también a nivel superior:

```js
2453|chrome.alarms.create('checkUpdates', {
2454|  periodInMinutes: 60 // Verificar cada hora
2455|});
```

Documentación de `chrome.alarms.create` (Chrome for Developers): *"If there is another alarm with the same name
... it will be cancelled and replaced by this alarm"* y *"If neither `when` or `delayInMinutes` is set for a
repeating alarm, `periodInMinutes` is used as the default for `delayInMinutes`"*.

**Qué está mal**: `startPeriodicUpdates()` se ejecuta en el nivel superior del script, es decir **en cada
arranque del worker** (`:2446`), y hace `clear` + `create`. Como `create` cancela y reemplaza la alarma
existente y el primer disparo se recalcula desde el momento de creación, **cada despertar del worker reinicia
el contador**. El worker se despierta por el popup, por el mensaje `settingsUpdated`, por la propia alarma y por
`chrome.storage.onChanged`; si el usuario abre el popup con más frecuencia que `updateIntervalMinutes`, la
actualización periódica **nunca** ocurre.

Segunda parte: el handler de la alarma no tiene guard —

```js
2437|  if (alarm.name === ALARM_NAME) {
2439|    await updateData();
2441|    await updateBanksData();
```

Si una actualización dura más que el período (posible: `request-timeout` hasta 120 s, B-06), el siguiente
disparo arranca otra en paralelo sobre la anterior (esto es B-03 visto desde el otro lado).

**Lo que está bien (verificado, para no inflar)**: el mínimo de Chrome no se viola. Chrome ≥120 limita las
alarmas a 1 disparo cada 30 s (`developer.chrome.com/docs/extensions/reference/api/alarms`) y el input del
usuario permite 1-60 minutos (`src/options.html:1176` `min="1" max="60"`). Y la recomendación oficial de
verificar la alarma en cada arranque del worker se cumple — pero se implementa con `clear` + `create`
incondicional en lugar de `get` + `create` condicional.

**Impacto**: el intervalo configurado por el usuario es un límite superior, no un valor real; la aplicación
puede pasar horas sin actualizar datos en segundo plano mientras el badge muestra datos viejos. La alarma
horaria de GitHub se recrea con la misma mecánica en cada arranque (aunque `checkForUpdatesInBackground()`
también corre en `:2392`, lo que enmascara el defecto).

**Fix propuesto**:

```js
const existing = await chrome.alarms.get(ALARM_NAME);
if (existing && existing.periodInMinutes === intervalMinutes) return;
await chrome.alarms.clear(ALARM_NAME);
await chrome.alarms.create(ALARM_NAME, { delayInMinutes: intervalMinutes, periodInMinutes: intervalMinutes });
```

y en el handler, reusar el guard de B-03 (`if (updateInFlight) return;`).

**Cómo verificar que quedó bien**: en `chrome://extensions` → service worker, ejecutar
`chrome.alarms.getAll().then(console.log)` dos veces separadas por la apertura del popup: el `scheduledTime` de
`updateDataAlarm` **no** debe cambiar si el intervalo no cambió.

---

### B-08 — MEDIO — Tres módulos se importan en cada arranque y no se usan: no existe caché real

**Evidencia** — `src/background/main-simple.js:22-28`:

```js
22|try {
23|  importScripts('apiClient.js', 'arbitrageCalculator.js', '../DataService.js', 'cacheManager.js');
24|  log('✅ [BACKGROUND] Módulos importados correctamente');
25|} catch (e) {
26|  console.warn('⚠️ [BACKGROUND] No se pudieron importar módulos:', e.message);
27|  log('📝 [BACKGROUND] Usando implementación inline como fallback');
28|}
```

Recuento de referencias reales (`grep -rn` sobre `src/`) — cada nombre aparece **únicamente en su propio
archivo**:

- `ApiClient` → `apiClient.js:6`, `:206` (definición y export). **0 usos.**
- `CacheManager` → `cacheManager.js:176` (definición). **0 usos.**
- `ArbitrageCalculator` → `arbitrageCalculator.js:6`, `:250` (ya reportado como F-04).

Y el módulo de caché que sí se importa nunca se consulta — `src/background/cacheManager.js:10-21`, `:176`:

```js
10|  const CACHE_CONFIG = {
11|    dolarOficial: 10 * 60 * 1000, // 10 minutos
12|    usdtArs: 30 * 1000, // 30 segundos
13|    usdtUsd: 60 * 1000 // 1 minuto
14|  };
...
17|  const cacheStorage = {
```

**Qué está mal**: tres de los cuatro módulos que `importScripts` carga en cada arranque del worker son código
muerto. En concreto, **no hay ninguna caché operativa**: los TTLs de `cacheManager` (30 s / 1 min / 10 min) no
se aplican, y las tres variables "caché" que sí existen en `main-simple.js` (`cachedDollarTypes`,
`cachedUsdtUsdData`, `cachedUsdtData`) tampoco tienen TTL y se borran cuando el worker se duerme. El único
estado que se conserva entre arranques es `currentData`, que también es en memoria y por lo tanto se pierde
igual (de ahí B-03).

**Impacto**: no es un bug visible para el usuario, pero (a) carga ~450 líneas de código inerte en cada arranque
del worker, y (b) es la razón por la que los fixes de auditorías anteriores no tienen efecto (ver la sección de
verificación: "timeout reducido a 8 s", "rate limiting habilitado", "validación de `setConfig`" están todos en
`apiClient.js`, que nunca corre). Elegir el módulo equivocado como fuente de verdad ya pasó una vez con
`arbitrageCalculator.js` (F-04) y puede volver a pasar.

**Fix propuesto**: borrar `apiClient.js` y `cacheManager.js` (o cablearlos de verdad: reemplazar
`fetchWithRateLimit` inline por `self.ApiClient`/`self.dataService`), y reducir `importScripts` a lo que se usa.
Si se quiere caché real, usar `chrome.storage.session` con `timestamp` y TTL.

**Cómo verificar que quedó bien**: `grep -rn "self.CacheManager\|self.ApiClient" src/` debe devolver al menos un
uso real en `main-simple.js`, o los archivos no deben existir.

---

### B-09 — MEDIO — Las URLs de API que el usuario edita no se usan; el background lee claves que nadie escribe

**Evidencia** — el usuario puede editar las URLs en Ajustes; `src/options.js:874-879`:

```js
874|  settings.criptoyaUsdtArsUrl =
875|    document.getElementById('criptoya-ars-url')?.value || 'https://criptoya.com/api/usdt/ars/1';
876|  settings.criptoyaUsdtUsdUrl =
877|    document.getElementById('criptoya-usd-url')?.value || 'https://criptoya.com/api/usdt/usd/1';
878|  settings.criptoyaBanksUrl =
879|    document.getElementById('criptoya-banks-url')?.value || 'https://criptoya.com/api/bancostodos';
```

Y el background, en el camino de precios, **hardcodea** los literales — `src/background/main-simple.js:184`,
`:217`:

```js
184|    const data = await fetchWithRateLimit('https://criptoya.com/api/USDT/USD/1');
...
217|    const data = await fetchWithRateLimit('https://criptoya.com/api/USDT/ARS/1');
```

`grep -n "criptoyaUsdtArsUrl\|criptoyaUsdtUsdUrl\|dolarApiUrl" src/background/main-simple.js` → **0 coincidencias**.

En sentido inverso, el background lee claves de configuración que no existen en ningún lado — `:366`, `:411`,
`:524`, `:537`, `:550`:

```js
366|  const url = userSettings.criptoyaDolarOficialUrl || 'https://criptoya.com/api/dolar';
411|  const url = userSettings.criptoyaDolarUrl || 'https://criptoya.com/api/bancostodos';
524|  const url = userSettings.criptoyaUsdtUsdBrokersUrl || 'https://criptoya.com/api/USDT/USD/1';
537|  const url = userSettings.binanceP2pUsdtArsUrl || 'https://criptoya.com/api/binancep2p/usdt/ars/1';
550|  const url = userSettings.binanceP2pUsdtUsdUrl || 'https://criptoya.com/api/binancep2p/usdt/usd/1';
```

Ninguna de esas cinco claves está en `DEFAULT_SETTINGS` (`src/options.js:30-107`) ni se escribe desde
`getCurrentSettings()` (`src/options.js:793-886`).

**Qué está mal**: la configuración de URLs es asimétrica y en su mayor parte inerte. `criptoyaBanksUrl`
**sí** se respeta (`:564` `const configuredUrl = userSettings.criptoyaBanksUrl;`), lo que hace el
comportamiento todavía más confuso: una URL funciona y las otras no. Las cinco claves "fantasma" (dólar
oficial, tipos de dólar, brokers USDT/USD, Binance P2P ARS y USD) siempre usan el default y no hay ninguna UI
que las produzca.

**Impacto**: el usuario que apunta la extensión a otro endpoint (proxy, espejo, API propia) no obtiene ningún
efecto ni ningún error: los precios siguen viniendo del mismo host. Y la mitad de `fetch*` del background tiene
una rama de configuración que es código muerto.

**Marcado**: no verifiqué si esas claves se escriben desde fuera (por ejemplo a mano en `chrome.storage`);
afirmo lo que vi: no se escriben desde `options.js` ni están en los defaults.

**Fix propuesto**: un helper único y usarlo en las seis funciones:

```js
const getApiUrl = (s, key, fallback) =>
  typeof s[key] === 'string' && s[key].startsWith('https://') ? s[key] : fallback;
```

**Cómo verificar que quedó bien**: `grep -n "https://criptoya.com/api/USDT" src/background/main-simple.js`
debe devolver 0 líneas (todo debe salir de `userSettings`); y cambiando la URL en Ajustes debe verse el host
nuevo en el panel Network del service worker.

---

### B-10 — MEDIO — El badge `!` y `pendingUpdate` son permanentes: no hay forma de limpiarlos

**Evidencia** — `src/background/main-simple.js:2330-2345`:

```js
2330|    if (hasUpdate) {
2331|      // Guardar en storage
2332|      await chrome.storage.local.set({
2333|        pendingUpdate: {
...
2343|      // Actualizar badge
2344|      chrome.action.setBadgeText({ text: '!' });
2345|      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
```

El `else` (`:2348-2350`) sólo loguea. `grep -rn "setBadgeText\|storage.local.remove" src/` → la **única**
llamada a `setBadgeText` de toda la extensión es la de `:2344` (el resto de las coincidencias son mocks de
tests), y **no existe ningún `chrome.storage.local.remove`** en `src/`.

El popup, cuando el usuario descarta el aviso, escribe otra clave — `src/modules/notificationManager.js:145`,
`:516-520`:

```js
145|    const { dismissedUpdate } = await chrome.storage.local.get('dismissedUpdate');
...
517|          dismissedUpdate: {
518|            version: updateInfo.latestVersion,
```

**Qué está mal**: el descarte sólo silencia el banner del popup, con vencimiento a 7 días. Nadie borra
`pendingUpdate` ni limpia el texto del badge. Una vez que la detección (a menudo falsa, ver F-05) se dispara,
el `!` azul queda fijo para siempre: sólo desaparece recargando la extensión.

**Impacto**: señal de alerta permanente e inapagable en la barra del navegador. Después de unos días el usuario
aprende a ignorarla, justo la actitud que un detector de oportunidades no quiere provocar. Amplifica F-05.

**Fix propuesto**: en el `else` de `:2348`, y al descartar, limpiar el estado:

```js
} else {
  await chrome.storage.local.remove('pendingUpdate');
  chrome.action.setBadgeText({ text: '' });
}
```

**Cómo verificar que quedó bien**: `grep -n "setBadgeText({ text: '' })" src/background/main-simple.js` debe
devolver una línea; en runtime, tras un chequeo sin actualización el badge debe quedar vacío (probable con
`chrome.runtime.getManifest().version` igual a la última versión mencionada en un commit).

---

### B-11 — MEDIO — El test que dice cubrir el background no carga el background; 2475 líneas sin cobertura

**Evidencia** — `tests/background.messageHandler.test.js:2` y `:29-52`:

```js
2| * Tests del handler de mensajes del background (main-simple.js)
```

```js
29|      // Handler con cache - respuesta sincrona
30|      function handlerWithCache(request, sendResponse) {
31|        sendResponse(cachedData);
32|        return false;
33|      }
...
43|      function handlerWithoutCache(request, sendResponse) {
44|        Promise.resolve(freshData).then(data => sendResponse(data));
45|        return true;
46|      }
```

Lo mismo en `:64`, `:94-103`, `:126-140`, `:160-164`, `:187-191`: cada "handler" es una función definida
**dentro del test**. No hay ningún `require`/`import` de `main-simple.js` en el archivo, y
`grep -rn "main-simple" tests/` sólo devuelve ese comentario de la línea 2.

**Qué está mal**: el único test del área reimplementa el código que dice auditar y prueba su propia copia. Lo
que el test llama "timeout" es un `setTimeout` local (`:134-136`), y la "función log segura" (`:160`) es una
copia, no `main-simple.js:3`. Los 203 tests en verde no aportan ninguna señal sobre el motor de cálculo ni
sobre el ciclo de vida del worker.

**Impacto**: todos los defectos de este informe (F-01/F-02 incluidos) son indetectables por la suite. Es la
misma clase de falsa confianza que F-04 describió en `tests/arbitrageCalculator.test.js`, pero sobre el archivo
central: la observación "203 tests pasan" no dice nada sobre si la matemática del producto está bien.

**Fix propuesto**: cargar el archivo real en un sandbox con el mock de `chrome` que ya existe
(`tests/setup.js:57` mockea `setBadgeText`):

```js
const src = fs.readFileSync('src/background/main-simple.js', 'utf8');
const sandbox = { chrome: globalThis.chrome, importScripts: () => {}, console };
vm.runInNewContext(src, sandbox); // exportar MESSAGE_HANDLERS al final del archivo para poder testear
```

Empezar por dos tests con valor real: (1) `applyFees=true` + `sellFee=1%` + comisiones extra en 0 →
`finalAmount === arsFromSale * 0.99` (esto es F-01); (2) `fetchUSDT` con `fetch` rechazando → debe devolver
`null` (esto es B-05).

**Cómo verificar que quedó bien**: `grep -c "runInNewContext\|require.*main-simple" tests/background.messageHandler.test.js`
> 0, y romper a propósito `finalAmount` (`:918`) debe hacer fallar un test.

---

### B-12 — BAJO — Estado/funciones muertas y listas de bancos triplicadas

**Evidencia**

1. `cachedDollarTypes` se asigna y nunca se lee — `src/background/main-simple.js:263`, `:274`:

```js
263|    cachedDollarTypes = dollarTypes.status === 'fulfilled' ? dollarTypes.value : cachedDollarTypes;
...
274|let cachedDollarTypes = {};
```

   (las únicas apariciones de `cachedDollarTypes` en el archivo son `:263` y `:274`; `:275-276` declaran las
   variables hermanas `cachedUsdtUsdData`/`cachedUsdtData`, que sí se leen). Es
   decir: `updateBanksData()` hace 3 fetches por ciclo **cuyo resultado se descarta**.

2. Lista de bancos por defecto triplicada — `:36` vs `:1833` vs `src/utils/bankCalculations.js:195`:

```js
36|  DEFAULT_BANKS: ['bna', 'galicia', 'santander', 'bbva', 'icbc'],
```
```js
1833|        : ['bna', 'galicia', 'santander', 'bbva', 'icbc'];
```

   `DEFAULT_BANKS` no se usa en ningún lado (`grep -n DEFAULT_BANKS src/background/main-simple.js` → sólo `:36`).

3. Handler muerto — `:2215`:

```js
2215|  recalculateWithCustomPrice: handleNotImplemented,
```

   `grep -rn "recalculateWithCustomPrice" src/` sólo devuelve esa línea en `main-simple.js` (y
   `docs/AUDITORIA_COMPLETA_2026.md:637`): el popup nunca envía esa acción, así que el stub
   "Función no disponible en esta versión" es inalcanzable.

**Qué está mal**: tres fuentes de verdad para lo mismo y trabajo de red descartado. Ninguno rompe nada hoy.

**Impacto**: deuda de mantenimiento con costo real medido: 3 fetches extra por ciclo (los de `updateBanksData`)
que no alimentan a ningún consumidor; editar `DEFAULT_BANKS` no cambiaría el comportamiento de la extensión
(la lista que se usa es el literal de `:1833`).

**Fix propuesto**: borrar `cachedDollarTypes` y `updateBanksData()` si nada los usa; usar
`BANK_CALCULATIONS.DEFAULT_BANKS` en `:1833`; quitar `recalculateWithCustomPrice` del mapa de handlers.

**Cómo verificar que quedó bien**: `grep -n "cachedDollarTypes\|recalculateWithCustomPrice" src/background/main-simple.js`
→ 0 líneas; `grep -c "bna', 'galicia'" src/background/main-simple.js` → 1 (hoy devuelve 2: `:36` y `:1833`).

---

### B-13 — BAJO — `console.error`/`console.warn` no están gateados: el background escribe en la consola del usuario

**Evidencia** — el logger sí está gateado (`src/background/main-simple.js:3-7`):

```js
3|function log(...args) {
4|  if (globalThis.__ARBITRAGE_DEBUG__ === true) {
```

pero varios lugares no lo usan — `:355-359`:

```js
355|    console.error('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - ❌ ERROR en fetch:', url);
...
358|    console.error('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - Error stack:', e.stack);
```

y `:445-447`, `:494-506` (validación de bancos), `:1759`, `:1803`, `:2014`, `:2352`.

**Qué está mal**: `__ARBITRAGE_DEBUG__` se define en el mundo de la página (`src/popup.js:73`,
`src/options.js:5` usan `window.__ARBITRAGE_DEBUG__`), mientras que el background consulta
`globalThis.__ARBITRAGE_DEBUG__` (`:4`), un scope distinto. Aun si el flag estuviera activo en el popup, el
background no lo hereda; y las líneas `console.error` no lo consultan en absoluto, así que **siempre** escriben.

**Impacto**: ruido y stack traces en la consola del service worker para cualquier usuario que abra
`chrome://extensions`. No es un problema de datos, es cosmético/ruido, pero hace más difícil diagnosticar los
defectos reales de este informe.

**Fix propuesto**: reemplazar esos `console.error`/`console.warn` por `log(...)` (o por un `logError` gateado) y
documentar cómo activar el flag del background (no hay forma hoy desde la UI).

**Cómo verificar que quedó bien**: `grep -c "console.error\|console.warn" src/background/main-simple.js` debe
bajar a ~2 (los del `catch` de importación y uno de arranque).

---

### B-14 — COSMÉTICO — Carácter de reemplazo U+FFFD incrustado en un log

**Evidencia** — `src/background/main-simple.js:1885` (bytes verificados con `cat -A`, el emoji quedó
corrompido como `EF BF BD` = U+FFFD):

```js
1885|  log('� Actualizando datos...');
```

**Qué está mal**: un emoji mal codificado quedó guardado como carácter de reemplazo.

**Impacto**: ninguno funcional; aparece un `�` en los logs cada vez que corre `updateData`.

**Fix propuesto**: `log('🔄 Actualizando datos...');` o sacar el emoji.

**Cómo verificar que quedó bien**: `grep -c $'\xef\xbf\xbd' src/background/main-simple.js` → 0.

---

## Verificación independiente de F-01..F-08

Coincido en todos. Detalle de la verificación propia:

| ID | ¿Coincido? | Evidencia independiente / matiz nuevo |
|---|---|---|
| **F-01** | **Sí** | Confirmo `src/background/main-simple.js:918` (`finalAmount = arsFromSale - (withdrawalFee + transferFee + bankFee);`) descartando `arsAfterSellFee` de `:906`. **Matiz nuevo y relevante**: el mismo cálculo en la ruta inter-broker **sí** es correcto — `:737` `finalAmount = arsAfterSellFee - (withdrawalFee + transferFee + bankFee);`. Es decir, la ruta de un solo exchange (`calculateSingleExchangeRoute`) y la ruta entre exchanges (`tryCalculateInterBrokerPair`) aplican el `sellFee` de forma distinta ante la misma configuración. Consecuencia adicional: como `:1055-1058` ordena **todas** las rutas juntas por `profitPercentage`, las rutas de un solo exchange quedan sistemáticamente mejor rankeadas que las inter-broker por un monto igual al `sellFee`. El fix de F-01 debe hacerse en `:918` (y comprobarse que `:737` siga igual). |
| **F-02** | **Sí** | Confirmo `src/options.js:63` y `src/background/main-simple.js:1006`. Agrego que el mismo default gobierna los otros dos motores de cálculo: `:1120` (USDT→ARS) y `:1223` (USD→USDT) también leen `userSettings.applyFeesInCalculation`. Es decir, con la configuración de fábrica **ninguno** de los cuatro tipos de ruta aplica comisiones. |
| **F-03** | **Sí** | Confirmo `src/background/main-simple.js:635-642`. Nota de alcance: `resolveBrokerFee` se llama 4 veces para `buyFee` (`:709`, `:890`, `:1224`, `:1324`) y 4 para `sellFee` (`:722`, `:903`, `:1121`, `:1342`); la asimetría está sólo en el valor devuelto (`:640` vs `:641`). |
| **F-04** | **Sí** | Confirmo que `ArbitrageCalculator` aparece sólo en `arbitrageCalculator.js:6` y `:250`. Agrego: se importa en `main-simple.js:23` y se carga en cada arranque del worker para no ejecutarse nunca — igual que `ApiClient` y `CacheManager` (B-08). |
| **F-05** | **Sí** | Confirmo el mecanismo (`:2319-2328`). Agrego dos hechos: (a) el repo consultado es el correcto — `git remote -v` → `https://github.com/nomdedev/ArbitrageAR-USDT.git`, igual al literal de `:2305`; (b) el falso positivo es **permanente**: el badge `!` (`:2344`) y `pendingUpdate` (`:2332`) no se limpian nunca (B-10). |
| F-06 | Sí (no es mi área) | Los `.backup`: confirmo `src/utils/formatters.js.backup` en el árbol. |
| F-07 | Sí (no es mi área) | No re-ejecuté lint/format (escriben caché). |
| F-08 | Sí (parcial) | Confirmo `src/background/main-simple.js:10` → `// MAIN BACKGROUND SCRIPT - ArbitrageAR v5.0.84`, contra `manifest.json:4` `"version": "6.0.0"`. |

---

## Verificación de auditorías previas

| Afirmación previa | ¿Sigue siendo cierta? | Evidencia |
|---|---|---|
| `.claude/auditorias/BACKGROUND_AUDIT_2026-03-31.md` (resumen): "APIs Fetching ✅ OK — Timeout y rate limiting habilitado" | **NO** | El limitador vive en `apiClient.js:17`, módulo que nunca se ejecuta (0 usos, B-08). El camino real tiene `main-simple.js:281` `const ENABLE_RATE_LIMIT = false;` y el bloque `:324-332` inalcanzable. |
| Idem: "Cache Manager ✅ CORREGIDO | Compatible con Service Worker" | **Literalmente sí, efectivamente no** | El fix existe (`cacheManager.js:196-208` usa `self`), pero `CacheManager` no se usa en ninguna parte (B-08): no hay caché operativa. La auditoría marcó el checklist "TTL configurado / limpieza de cache / estadísticas" como OK sin notar que nada lo llama. |
| Idem: "Alarms ✅ OK — Alarmas configuradas, intervalo configurable, limpieza de alarmas existentes" | **NO** | La "limpieza de alarmas" (`:2422`) es exactamente el defecto: se ejecuta en cada arranque del worker y reinicia el contador (B-07). Además el `intervalMinutes || 2` que cita la auditoría (línea 109 de ese documento) ya no existe: hoy es `|| 5` (`:2413`, `options.js:69`), o sea que sus referencias de línea ya estaban desactualizadas cuando se escribió. |
| Idem: "Intervalo actualización: 2 minutos" (métricas) | **NO** | Default real: 5 minutos (`src/options.js:69`, `main-simple.js:2413`), configurable 1-60 (`options.html:1176`). |
| Idem: "Mensajería Runtime ✅ OK / return true para async / return false para sync" | **Sí, con una excepción** | Los handlers devuelven correctamente (`:2037`, `:2076`, `:2083`, `:2098` no aplica — `handleNotImplemented` responde síncrono, `:2107`, `:2167`, `:2207`). Excepción: `handleRefresh` (`:2079-2084`) no tiene `.catch`, único handler sin red de seguridad si la promesa rechazara. |
| Idem (recomendaciones pendientes): "Añadir validación de origen en mensajes" | **Resuelto desde entonces** | `main-simple.js:2223-2226`: `if (sender.id && sender.id !== chrome.runtime.id) { ... return false; }`. |
| Idem: "Storage listener ✅ implementado" | **Sí, pero genera duplicación** | Existe (`:2464-2471`) y **sumado** al mensaje `settingsUpdated` de `options.js:763` produce dos `updateData()` por guardado (B-03). La auditoría lo listó como logro sin ver el solapamiento. |
| `.claude/auditorias/CONSOLIDATED_AUDIT_2026-04-01.md` (sección Background): "Timeout reducido a 8s" (M-03) | **Sin efecto** | Verdadero en `apiClient.js:15` (`timeout: 8000`), pero el timeout real del background es `REQUEST_TIMEOUT = requestTimeoutSeconds * 1000` (`main-simple.js:303`, `:336`), default 10 000 ms. |
| Idem: "Rate limiting habilitado por defecto" | **Sin efecto** | `apiClient.js:17` `enableRateLimit: true` — módulo muerto (B-04/B-08). |
| `docs/CHANGELOG.md:239` (v5.0.85): "`arbKey` ahora usa `Math.floor()` para evitar spam de notificaciones" | **NO** | El `Math.floor()` quedó sólo en la comprobación (`:1670`); el alta sigue con `toFixed(2)` (`:1743`) → el antiduplicado nunca coincide (B-01). |
| Idem: "Corregido filtro de exchanges a `notificationExchanges`" | **Sí** | `:1656` `const allowedExchanges = settings.notificationExchanges || settings.preferredExchanges || [];`. |
| `docs/AUDITORIA_COMPLETA_2026.md` (línea 535-556): logging migrado a `log()` condicionado por el flag de debug | **Parcial** | Cierto en su mayoría, pero quedan `console.error`/`console.warn` incondicionales (`:355-359`, `:445-506`) y el flag del background (`globalThis.__ARBITRAGE_DEBUG__`, `:4`) nunca se activa desde la UI (B-13). |
| `docs/AUDITORIA_COMPLETA_2026.md:637`: existe `recalculateWithCustomPrice` | **Sí el nombre, muerto el handler** | `main-simple.js:2215` lo mapea a `handleNotImplemented` y ninguna parte de `src/` envía esa acción (B-12). |

---

## Lo que NO pude verificar

1. **Comportamiento en runtime del service worker real** (B-02, B-03, B-07). No ejecuté la extensión en Brave ni
   observé el ciclo de sueño/despertar. Los hechos de código están verificados (variables globales, cuatro
   disparadores de `updateData`, `clear`+`create` en el nivel superior) y la semántica de plataforma está citada
   de la documentación de Chrome, pero **el orden real de los eventos y el efecto visible para el usuario son
   inferencia, no medición**. Para cerrarlo haría falta: cargar la extensión descomprimida, abrir el service
   worker en DevTools y observar los logs con `__ARBITRAGE_DEBUG__` activado a mano durante ~15 minutos.
2. **La hipótesis del 429 de CriptoYa** (B-04). No llamé a la API externa. Lo verificado es la ausencia de
   throttling, no la respuesta del servidor.
3. **La suite de tests**. No corrí `npx jest` (escribe caché en el repo). No sé si algún test falla hoy; el
   baseline del brief dice que los 203 pasan y mi análisis de B-11 es estático (grep), no de ejecución.
4. **Si las cinco claves de configuración "fantasma" de B-09 se escriben desde fuera de `options.js`** (por
   ejemplo edición manual de `chrome.storage` o un cliente externo). Verifiqué que no están en
   `DEFAULT_SETTINGS` ni en `getCurrentSettings()`; no descarto un escritor externo, pero no hay ninguno en el
   repo.
5. **`src/background/arbitrageCalculator.js` y `src/DataService.js` línea por línea**. Del primero sólo verifiqué
   el no-uso (lo demás es F-04); del segundo, su rate limiter (`:34-44`) y su export (`:650-653`). No audité sus
   cálculos ni su caché interna.
6. **El valor real del clamp de alarmas en Brave**. La documentación dice que las builds descomprimidas están
   exentas del mínimo de 30 s y que las instaladas lo aplican; no lo medí. Es irrelevante para B-07 porque el
   input del usuario admite 1 minuto como mínimo.
