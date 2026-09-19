# Auditoría SEGURIDAD — ArbitrageAR-USDT

Fecha: 2026-09-19 · Commit base `5fdfa9e` (= `origin/main`) · Árbol de trabajo: sólo `docs/auditoria-2026-09/` y
`videos/` sin trackear (verificado con `git status --porcelain`).

Este informe cubre **la superficie de inyección en la UI, la mensajería entre contextos, los permisos y la CSP,
el código remoto, los datos guardados y lo que la extensión envía a terceros**. No repite F-01..F-10
(orquestador), B-01..B-14 (background) ni O-01..O-26 (options): los usa como contexto y los referencia por ID.

Regla respetada: **sólo lectura sobre `src/`, `manifest.json` y `scripts/`**. Los scripts de prueba y las
reproducciones viven en `C:\Users\epic\AppData\Local\Temp\audit-seg\`. No se ejecutó `npm`, no se abrió `.env`
(verificación aparte: **no existe** `.env` en el árbol, ver SEG-09), no se instaló nada.

---

## Alcance

**Leídos completos**

| Archivo | Líneas | Para qué |
|---|---|---|
| `manifest.json` | 40 | permisos, host_permissions, CSP, superficies declaradas |
| `src/utils/commonUtils.js` | 558 | el sanitizador "oficial" del proyecto |
| `src/renderHelpers.js` | 202 | escapeHtml + plantillas de tarjetas |
| `src/modules/routeManager.js` | 684 | escapeHtml local + sinks de tarjetas |
| `src/modules/modalManager.js` | 609 | sanitizeHTML propio + `showInfo(content)` |
| `src/ui/routeRenderer.js` | 273 | escapeHtml propio + sink en atributo |
| `src/ui/tooltipSystem.js` | 607 | "sanitizador" de `updateContent` |
| `src/ui-components/arbitrage-panel.js` | 313 | sanitizeHTML duplicado + `window.sanitizeHTML` |
| `src/DataService.js` | 653 | fetch de dolarito.ar (HTML remoto) y URLs fijas |

**Leídos por regiones + `grep` exhaustivo** (los 74 puntos de `innerHTML`/`insertAdjacentHTML` se recorrieron
uno por uno con un script propio, ver "Superficie de inyección"): `src/popup.js` (regiones 40-100, 150-230,
780-1100, 1200-1300, 1400-1500, 1600-2110, 2380-2820, 2900-3000, 3250-3520, 3690-3710, 3860-4290),
`src/options.js` (30-110, 420-500, 590-760, 790-900, 920-960), `src/background/main-simple.js` (1-60,
180-600, 620-700, 890-1010, 1100-1250, 1580-1900, 2020-2475), `src/modules/simulator.js` (580-700),
`src/modules/filterManager.js` (470-500), `src/modules/notificationManager.js` (120-600),
`src/ui-components/tabs.js` (220-290), `src/utils.js` (31), `src/background/apiClient.js` (207).

**Auditorías previas leídas para la tabla de verificación**: `.claude/AUDITORIA_COMPLETA.md`,
`.claude/auditorias/SECURITY_AUDIT_2026-03-31.md`, `.claude/auditorias/AUDITORIA_POST_FIX_2026-04-01.md`,
`.claude/auditorias/CONSOLIDATED_AUDIT_2026-04-01.md`, `.claude/auditorias/BACKGROUND_AUDIT_2026-03-31.md`.

**No leídos (confesión)**: `src/popup.css` (4564 líneas) y `src/options.css`; `tests/**` (no ejecuté Jest:
escribe caché en el repo); `src/ui/filterController.js` (no se carga desde ningún HTML, confirmado);
`.claude/hooks/**` y `.claude/settings.json` (entorno del asistente de desarrollo, fuera del alcance de la
extensión). Nada de lo que afirmo depende de ellos.

**Ejecutado**: tres scripts en `%LOCALAPPDATA%\Temp\audit-seg\` (`classify-sinks2.mjs`, `interps.mjs`,
`repro-escape.js`) + una prueba en un Chromium real por CDP. Detalle de cada uno en la sección que corresponda.

---

## Resumen

| ID | Severidad | Título | Archivo:línea |
|---|---|---|---|
| SEG-01 | **MEDIO** | `sanitizeHTML()` no escapa comillas y se usa en contexto de atributo: inyección de atributos verificada en `data-name` | `src/utils/commonUtils.js:40-45` → `src/popup.js:2662`, `src/popup.js:2785` |
| SEG-02 | **MEDIO** | El listener `onMessage` acepta cualquier remitente sin `sender.id` y no valida la forma del payload | `src/background/main-simple.js:2221-2233` |
| SEG-03 | **MEDIO** | URL de API configurable → petición a host arbitrario desde el service worker (SSRF ciega) y redirecciones seguidas sin validar el host final | `src/background/main-simple.js:564-582`, `:320-362` |
| SEG-04 | **MEDIO** | Cuatro implementaciones distintas de escape con tres semánticas incompatibles | `commonUtils.js:40`, `routeManager.js:12`, `renderHelpers.js:152`, `routeRenderer.js:11`, `tooltipSystem.js:529` |
| SEG-05 | **BAJO** | El "sanitizado" de `TooltipSystem.updateContent` es una identidad: `replace(a, a)` cuatro veces | `src/ui/tooltipSystem.js:527-530` |
| SEG-06 | **BAJO** | `error.message` se interpola sin escapar en 3 `innerHTML` (el resto del archivo sí escapa) | `src/popup.js:1071`, `:2948`, `:3294` |
| SEG-07 | **BAJO** | Permisos de más: `activeTab` sin ningún consumidor y `dolarito.ar` sólo usado por código sin callers | `manifest.json:7-11`, `:13-18` |
| SEG-08 | **BAJO** | `getRouteDescription()` devuelve `route.broker` sin escapar y ese valor entra en un atributo (`aria-label`) | `src/renderHelpers.js:180` → `:99` |
| SEG-09 | **BAJO** | Las URLs de API se guardan, se muestran y se loguean en claro (y `setSafeHTML` escribe HTML sin sanear) | `src/options.html:1150-1169`, `main-simple.js:355`, `commonUtils.js:66-73` |

**Cero hallazgos CRÍTICO y cero ALTO propios.** Explico por qué en cada caso: la CSP de la extensión
(`script-src 'self'`, sin `unsafe-inline`) impide la ejecución de código a partir de las inyecciones que sí
verifiqué, y no encontré ningún camino que permita escribir JS ejecutable ni exfiltrar credenciales (no existen
credenciales en la extensión). Los dos CRÍTICOS del área siguen siendo los del orquestador (F-01, F-02), que son
de cálculo, no de seguridad.

---

## Hallazgos

### SEG-01 — MEDIO — `sanitizeHTML()` no escapa comillas y se usa en contexto de atributo

**Evidencia 1** — el sanitizador "oficial" del proyecto, `src/utils/commonUtils.js:35-45`:

```js
40|  function sanitizeHTML(text) {
41|    if (typeof text !== 'string') return '';
42|    const div = document.createElement('div');
43|    div.textContent = text;
44|    return div.innerHTML;
45|  }
```

**Evidencia 2** — el único consumidor de esta función dentro de un **valor de atributo**,
`src/popup.js:2662` y `src/popup.js:2785` (misma línea en dos renders distintos):

```js
2662|          <div class="exchange-card" data-type="${type}" data-name="${sanitizeHTML(name.toLowerCase())}">
```

**Qué está mal:** `div.textContent = text; return div.innerHTML` escapa `&`, `<` y `>` —y **nada más**. No escapa
`"`, ni `'`, ni el backtick (verificado ejecutando el código exacto bajo jsdom, ver el anexo de reproducciones). En el sink
`data-name="..."` el valor está delimitado por comillas dobles, así que un `"` en el dato cierra el atributo y
todo lo que venga después se parsea como **atributos nuevos del mismo elemento**. `sanitizeHTML` se diseñó para
contexto de texto y se está usando en contexto de atributo: es la clase de bug de la que habla la propia
documentación de la función ("Sanitizar HTML para prevenir XSS") sin advertirlo.

**Origen del dato (por qué es externo):** `name` sale de `getExchangeDisplayName(exchange)`
(`src/popup.js:2815`), y `exchange` es la **clave del JSON** de la API:

```js
2470|          name: getExchangeDisplayName(exchange),      // Object.entries(usdtArsData)
...
2495|            name: getExchangeDisplayName(exchange),      // Object.entries(usdtUsdData)
```

y el fallback de esa función es el identificador crudo de la API:

```js
2873|  return (
2874|    exchangeNames[exchangeCode] || exchangeCode.charAt(0).toUpperCase() + exchangeCode.slice(1)
2875|  );
```

Las tres respuestas vienen de URLs que el usuario puede editar (`src/popup.js:2432-2446`, ver SEG-03) o de
`criptoya.com` si se compromete / se suplanta por DNS. Un JSON como
`{"x\" style=\"position:fixed;inset:0\" z\"": {"bid":1,"ask":1}}` produce un `data-name` que rompe el atributo.

**Reproducción ejecutada** — `%LOCALAPPDATA%\Temp\audit-seg\repro-escape.js` (jsdom ya instalado en
`node_modules` del repo, sólo lectura):

```
=== A. sanitizeHTML (CommonUtils / popup / modalManager / arbitrage-panel) ===
entrada : "x\" onmouseover=\"alert(1)\" style=\"position:fixed;inset:0;background:#fff\" data-x=\""
salida  : "x\" onmouseover=\"alert(1)\" style=\"position:fixed;inset:0;background:#fff\" data-x=\""
comilla doble escapada?  false
comilla simple escapada? false
backtick escapado?       false
tag escapado?            &lt;img src=x onerror=alert(1)&gt;

=== E. Reproduccion del sink real: popup.js:2662 data-name="..." ===
HTML generado:
<div class="exchange-card" data-type="usdt_ars" data-name="x" onmouseover="alert(1)" style="position:fixed;inset:0;background:#fff" data-x="">contenido</div>

atributos del div parseado por el navegador:
[ 'class="exchange-card"', 'data-type="usdt_ars"', 'data-name="x"',
  'onmouseover="alert(1)"', 'style="position:fixed;inset:0;background:#fff"', 'data-x=""' ]
```

**Qué NO se puede hacer (medido, no supuesto)**: en la misma corrida, el escape de `<` y `>` impide crear
elementos nuevos (el payload `<img src=x onerror=...>` queda como texto: `hijos del contenedor: 0`), y **la CSP
de la extensión bloquea los handlers inline**. Verificado en un Chromium real por CDP con `script-src 'self'`
(idéntico a `manifest.json:34-36`) y con el control sin CSP:

```
con CSP script-src 'self':  {'handlerRan': False, 'styleApplied': 'color:red', 'count': 1}
                            {'ctrlRan': False}          ← atributo onclick seteado y evento disparado
sin CSP:                    {'ctrlRan_sinCSP': True, 'handlerInnerHTML_sinCSP': True}   ← control válido
```

**Impacto:** un tercero que controle cualquiera de las 4 URLs configurables (o comprometa `criptoya.com`) puede
reescribir atributos de las tarjetas de exchange: `style` (posicionamiento/overlay sobre la UI real), `class`,
`id` (clobbering de `document.getElementById`, que el popup usa en decenas de lugares) y cualquier `data-*`.
Hoy no hay ejecución de código (CSP) y el proyecto no lee `data-name` en ninguna parte
(`grep -rn "dataset.name|data-name" src/` → sólo las dos escrituras), así que el daño es **manipulación de la
interfaz y datos del DOM de la extensión**, no robo de datos. La calificación es MEDIO y no ALTO por eso mismo: la
inyección es real y verificada, pero el paso a ejecución está cortado por la CSP. Es exactamente el tipo de
"fix incompleto" que la auditoría previa declaró cerrado (ver "Verificación de auditorías previas": `name`
líneas 2656/2779 marcadas ✅).

**Fix propuesto:** separar los dos contextos de escape. Para texto, `sanitizeHTML` está bien (aunque conviene
escapar también `'`); para atributos, usar un escape que cubra comillas **o, mejor, no construir atributos por
concatenación**:

```js
// opción A (mínima): escapar para atributo
function escapeAttr(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// opción B (preferible): construir la tarjeta con DOM API
card.dataset.name = name.toLowerCase();   // nunca pasa por un parser de HTML
```

Además: agregar en `commonUtils.js` un comentario/enforcement de que `sanitizeHTML` **no** es válido para
atributos, y borrar el `data-name` si nadie lo lee (las 2 escrituras no tienen lectura: `data-name` es hoy
peso muerto que sólo aporta superficie).

**Cómo verificar que quedó bien:** `node %LOCALAPPDATA%\Temp\audit-seg\repro-escape.js` debe imprimir
`comilla doble escapada? true` para el escape usado en atributos, y con el payload de prueba el `div` parseado
debe seguir teniendo exactamente 3 atributos (`class`, `data-type`, `data-name`).

---

### SEG-02 — MEDIO — El listener `onMessage` acepta cualquier remitente sin `sender.id` y no valida la forma del payload

**Evidencia** — `src/background/main-simple.js:2221-2233`:

```js
2221| chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
2222|   // Validar que el mensaje proviene de la propia extensión
2223|   if (sender.id && sender.id !== chrome.runtime.id) {
2224|     console.warn('[BACKGROUND] Mensaje rechazado de origen no autorizado:', sender.id);
2225|     return false;
2226|   }
2227|   log('[BACKGROUND] Mensaje recibido:', request.action);
2228|   const action = request.type || request.action;
2229|   const handler = MESSAGE_HANDLERS[action];
2230|   if (!handler) {
2231|     log('[BACKGROUND] Mensaje desconocido:', action);
2232|     return false;
2233|   }
```

**Qué está mal (dos cosas distintas, y hay que separarlas):**

1. **La guarda es `sender.id && …`.** El `&&` hace que la condición sea *falsa* (pasa el filtro) cuando
   `sender.id` es `undefined`. Según el modelo de mensajería de Chrome, `sender.id` sólo está presente para
   remitentes que son extensiones; los mensajes externos llegan sin `id` (con `sender.url`/`sender.origin`). La
   recomendación que la auditoría de marzo había dejado escrita era justamente la variante **sin** `&&`:
   `if (sender.id !== chrome.runtime.id) { … return false; }` (`SECURITY_AUDIT_2026-03-31.md:199`). Se
   implementó con `&&`, es decir una guarda que no cubre el caso para el que fue escrita. Tampoco se mira
   `sender.url`, `sender.origin` ni `sender.tab`.
2. **No se valida la forma del payload.** `request.action` (línea 2227) se lee antes de comprobar que `request`
   sea un objeto: `chrome.runtime.sendMessage(null)` desde un remitente admitido hace lanzar un `TypeError`
   dentro del listener. Y `action` se resuelve con `request.type || request.action` sobre datos arbitrarios: si
   `request.type` es un objeto, `MESSAGE_HANDLERS[【objeto】]` coerciona a la clave `"[object Object]"`, sin
   consecuencias hoy pero sin ninguna defensa.

**Qué SÍ está bien (verificado, para no inflar):** ninguna página web ni iframe inyectado puede hablarle a la
extensión. Confirmado en el manifest y por grep:

- `grep -n "externally_connectable" manifest.json` → **0 resultados**.
- `manifest.json` no tiene `content_scripts` ni `web_accessible_resources` (verificado por grep).
- `grep -rn "onMessageExternal|runtime.connect|postMessage" src/` → **0 resultados**.
- El único `chrome.runtime.onMessage` de todo `src/` es el del service worker (`main-simple.js:2221`): el popup
  y la página de opciones **no** registran listeners.

**¿Hay un handler que haga algo destructivo o escriba storage sólo con lo que llega en el mensaje?** No. Los
siete handlers del mapa (`:2210-2218`) son: `getArbitrages`, `refresh`, `settingsUpdated`, `getBankRates` y
`getBanksData` (todos disparan `updateData()`/fetches y responden), `GET_CRYPTO_ARBITRAGE` (fetch + cálculo) y
`recalculateWithCustomPrice` (`handleNotImplemented`, stub). Ninguno lee campos del payload: `handleGetBanksData`
y `handleGetCryptoArbitrage` sacan la configuración de `chrome.storage.local.get('notificationSettings')`
(`:2112-2115`, `:2183`), no del mensaje. Los únicos `chrome.storage.local.set` de producción están en
`main-simple.js:2332` (resultado del chequeo de GitHub) y `DataService.js:443` (criptos activas) — ninguno
alimentado por un mensaje. La conclusión es: **el payload no puede escribir estado**, pero **sí puede provocar
trabajo de red** (hasta 7 fetches por `getBanksData`, `:2116-2124`).

**Impacto:** hoy, ninguno explotable (no hay remitente externo posible: sin `externally_connectable` y sin
content scripts, la guarda es redundante). El riesgo es de **regresión dirigida**: el día que alguien agregue un
content script o `externally_connectable` (o que el usuario instale una segunda extensión con permiso sobre
esta), la guarda no filtra lo que dice filtrar y hay tres handlers que disparan tráfico de red sin validar nada
más. Es la misma familia que B-03 (amplificación de fetches) vista desde el lado del protocolo de mensajes.

**Fix propuesto:**

```js
const ALLOWED_ACTIONS = new Set([
  'getArbitrages', 'refresh', 'settingsUpdated',
  'getBankRates', 'getBanksData', 'GET_CRYPTO_ARBITRAGE'
]);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {           // sin el &&
    console.warn('[BACKGROUND] Mensaje de origen no autorizado:', sender.id, sender.origin);
    return false;
  }
  if (!request || typeof request !== 'object') return false;
  const action = request.type || request.action;
  if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) return false;
  return MESSAGE_HANDLERS[action](request, sendResponse);
});
```

(Es, literalmente, la remediación que `SECURITY_AUDIT_2026-03-31.md:197-227` había propuesto y que se aplicó a
medias.)

**Cómo verificar que quedó bien:** `grep -n "sender.id" src/background/main-simple.js` no debe contener `&&`;
y desde la consola del popup, `chrome.runtime.sendMessage(null)` no debe producir un `TypeError` en la consola
del service worker (`chrome://extensions` → Service worker → Console).

---

### SEG-03 — MEDIO — URL configurable → petición a host arbitrario desde el service worker (SSRF ciega) y redirecciones seguidas sin validar el host final

> Este hallazgo **no repite O-10**. O-10 documenta el problema desde la página de opciones (no hay `checkValidity`,
> no hay whitelist, el valor se persiste igual). Lo que agrego acá es el **lado red**: qué se envía, qué no, y
> qué queda del otro lado cuando el host es arbitrario. El cruzado está marcado en "Matices".

**Evidencia 1** — el service worker usa la URL configurable tal cual, `src/background/main-simple.js:562-579`:

```js
562| async function fetchBankDollarRates(userSettings) {
563|   log('🔍 [DIAGNÓSTICO] fetchBankDollarRates() - INICIANDO');
564|   const configuredUrl = userSettings.criptoyaBanksUrl;
565|   const defaultBanksUrl = 'https://criptoya.com/api/bancostodos';
...
569|   const url = hasLegacyDolarApiBankUrl ? defaultBanksUrl : configuredUrl || defaultBanksUrl;
...
579|   const data = await fetchWithRateLimit(url);
```

**Evidencia 2** — no hay validación de esquema, host ni destino de redirección en el fetch,
`src/background/main-simple.js:334-339`:

```js
334|   try {
335|     const controller = new AbortController();
336|     const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
...
339|     const res = await fetch(url, { signal: controller.signal });
```

`fetch` sin opciones usa `redirect: "follow"` y `credentials: "same-origin"` (por lo tanto **no** manda cookies
en cross-origin) y no se le agrega ningún header. El destino de la redirección no se comprueba: el JSON que se
parsea en `:351` es el del **host final**, no el del host configurado.

**Evidencia 3** — la misma URL configurable se consume además desde el popup, sin pasar por el background,
`src/popup.js:2432-2447`:

```js
2443|       fetch(urls.dolarApiUrl).then(r => r.json()),
2444|       fetch(urls.criptoyaUsdtArsUrl).then(r => r.json()),
2445|       fetch(urls.criptoyaUsdtUsdUrl).then(r => r.json())
```

**Evidencia 4** — los cuatro campos que alimentan esto son `<input type="url">` sin `pattern` ni validación
posible en el guardado (`src/options.html:1150`, `:1155`, `:1160`, `:1167`; y `src/options.js:872-879`, donde el
valor entra crudo al objeto de settings):

```html
1150|              <input type="url" id="dolarapi-url" value="https://dolarapi.com/v1/dolares/oficial" />
```

`type="url"` acepta `http://` (texto plano) y **no** acepta puertos internos inválidos para un host externo: nada
impide `http://192.168.0.1/…` o `http://localhost:8080/…`. Y aunque el atributo fuese restrictivo, O-10 ya
verificó que nunca se llama a `checkValidity()`.

**Qué se filtra realmente al host elegido (respuesta a la pregunta 7 del encargo):**

| Cosa | ¿Se envía? | Evidencia |
|---|---|---|
| Claves de API de exchanges/brokers | **No existen en la extensión** | `grep -rn -i "apikey|api_key|secret|token|password|privatekey|mnemonic" src/` → 0 resultados (ver SEG-09) |
| Cookies | No (`credentials: "same-origin"` por default, cross-origin) | `:339` (`fetch(url, { signal })`, sin `credentials`) |
| Headers propios / identificadores de usuario | No (no hay `headers:` en ningún fetch del background) | `:339` |
| `Origin: chrome-extension://eekjnnmknnmdieggifdakabaonghfakl` | **NO VERIFICADO** (depende del navegador, no del código) | ver "Lo que NO pude verificar" |
| El propio dato de configuración (la URL con sus query params) | Sí, es el destino: si el usuario pegó una URL con token embebido, el token viaja al host que él eligió | `:564-579` |
| Cadencia de actividad del usuario (timings de los fetches) | Sí, por la frecuencia de las peticiones | `:2436-2447`, B-03/B-07 |
| El contenido de las respuestas de las otras APIs | **No** (cada fetch va directo a su host; no se re-postea nada) | grep de `fetch(` en `src/` |

**Riesgo de SSRF (por qué es "ciega" y no lectura libre):** la petición **sale** hacia el host arbitrario, pero
para un host que no esté en `host_permissions` (`dolarapi.com`, `criptoya.com`, `dolarito.ar`, `api.github.com`)
la respuesta sólo es legible si el destino manda `Access-Control-Allow-Origin` acorde; si no, el `fetch` del
background/popup rechaza y `fetchWithRateLimit` devuelve `null` (`:354-360`) sin distinguir el motivo.
Consecuencia concreta: (a) se puede **provocar una petición GET** a un servicio interno del usuario (router,
panel de administración, servicio en `localhost`) — SSRF de una sola petición, sin lectura; (b) si el host
responde con CORS abierto (trivial para un atacante), la respuesta **sí** se lee y se convierte en datos que se
renderizan en el popup, que es la cadena de SEG-01/SEG-04.

**Impacto:** para que esto se dispare hace falta que el usuario pegue una URL bajo control ajeno en Ajustes →
Avanzado (ingeniería social, típica de un "usá este espejo de la API que anda más rápido" en un grupo de
Telegram) o que el dominio legítimo (`criptoya.com`) sea comprometido o suplantado por DNS. Con la configuración
de fábrica, el único riesgo real es el tercero legítimo. Sin credenciales en la extensión, el peor caso medido
es: SSRF ciega + manipulación de la UI del popup con datos falsos (precios inyectados).

**Fix propuesto:** validar en el punto de uso, no sólo en la UI (la UI no es una frontera de seguridad):

```js
const ALLOWED_HOSTS = ['dolarapi.com', 'criptoya.com'];
function safeApiUrl(raw, fallback) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return fallback;                   // fuerza TLS
    if (!ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) return fallback;
    return u.toString();
  } catch { return fallback; }
}
// en el fetch, además, no seguir redirecciones a otros hosts:
const res = await fetch(safeApiUrl(url, DEFAULT_URL), { signal: controller.signal, redirect: 'error' });
```

`redirect: 'error'` convierte el caso "criptoya redirige a un tercero" en un fallo explícito en vez de un JSON
ajeno silencioso. Si se quiere conservar la flexibilidad de proxies del usuario, la alternativa correcta es
`optional_host_permissions` + `chrome.permissions.request()` cuando agregue un host nuevo (la propuesta que ya
figura en O-10).

**Cómo verificar que quedó bien:** guardar `http://localhost:9/noexiste` en "API Bancos" y forzar una
actualización: el panel Network del service worker no debe mostrar ninguna petición a `localhost` (hoy sí la
muestra). Y con un servidor propio que haga `302` a otro host, la petición debe fallar en lugar de parsear el
JSON del destino.

---

### SEG-04 — MEDIO — Cuatro implementaciones distintas de escape, con tres semánticas incompatibles

**Evidencia** — las cinco funciones de "sanitización/escape" que conviven en `src/`:

```js
// 1) utils/commonUtils.js:40-45 — textContent -> innerHTML. NO escapa comillas. (3 copias)
//    copias literales: modules/modalManager.js:251-256, ui-components/arbitrage-panel.js:276-283
40|  function sanitizeHTML(text) {
41|    if (typeof text !== 'string') return '';
42|    const div = document.createElement('div');
43|    div.textContent = text;
44|    return div.innerHTML;
45|  }
```

```js
// 2) modules/routeManager.js:12-22 — replace manual. SÍ escapa comillas. (correcto para atributos)
12|  const escapeHtml = text => {
...
19|      .replace(/"/g, '&quot;')
20|      .replace(/'/g, '&#039;');
```

```js
// 3) renderHelpers.js:152-160 — replace manual, escapa comillas, PERO devuelve el valor tal cual
//    si no es string (y `getRouteDescription` la evita en su fallback, ver SEG-08)
152|  function escapeHtml(text) {
153|    if (typeof text !== 'string') return text;
```

```js
// 4) ui/routeRenderer.js:11-15 — textContent -> innerHTML (NO escapa comillas) ... y se usa en un atributo
11|  const escapeHtml = text => {
12|    if (typeof text !== 'string') return String(text || '');
13|    const div = document.createElement('div');
14|    div.textContent = text;
15|    return div.innerHTML;
16|  };
```

```js
// 5) ui/tooltipSystem.js:527-530 — "sanitiza" reemplazando cada carácter por sí mismo (ver SEG-05)
529|          ? content.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
```

Y el export duplicado, que crea una **quinta** global con el mismo nombre que la del popup:

```js
// ui-components/arbitrage-panel.js:312
312|    window.sanitizeHTML = sanitizeHTML;
```

**Qué está mal:** el proyecto tiene tres semánticas de escape distintas (`texto` no escapa comillas / `atributo`
sí lo hace / identidad) y ningún criterio escrito de cuál usar dónde. El resultado medido es que el caso
"correcto" (routeManager) es la excepción, y el equivocado (textContent→innerHTML) es el que se usa en el sink
de atributo (SEG-01) y el que se exporta como global. Además, `sanitizeHTML` es el nombre de dos funciones
distintas en el mismo runtime (la del popup, alias de `CommonUtils.sanitizeHTML`, y `window.sanitizeHTML`, la de
`arbitrage-panel.js`), con la misma implementación pero resolución por alcance distinta.

**Impacto:** cada nuevo sink es una moneda al aire, y la auditoría previa ya lo vivió: la tabla de
`CONSOLIDATED_AUDIT_2026-04-01.md:40-65` marca "✅ aplicado" por variable, no por contexto, y por eso
`name`/`source` (`popup.js:2656,2779` en esa numeración = 2662/2785 hoy) figuran como resueltos cuando el
contexto del atributo los deja abiertos. Para el usuario final, esto se traduce en que los "0 XSS activos" que
declara el repo no son un invariante del código, sino el resultado accidental de qué función tocó cada línea.

**Fix propuesto:** una sola fuente de verdad con dos funciones explícitas, y una regla en el lint:

```js
// utils/escape.js
export const escapeText  = t => String(t ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export const escapeAttr  = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
```

Regla: si la interpolación está entre comillas de un atributo (`atributo="${…}"`), va `escapeAttr`; si está en el
cuerpo del
elemento, va `escapeText`. Prohibir `innerHTML` con interpolación salvo que el valor salga de `Fmt.formatNumber`
o de un literal, y agregar una regla ESLint (`no-restricted-syntax`) para que el próximo sink no dependa de la
memoria de quien lo escriba. Borrar las copias 1, 3, 4 y 5 y el global `window.sanitizeHTML`.

**Cómo verificar que quedó bien:** `grep -rn "function sanitizeHTML\|function escapeHtml\|escapeHtml =" src/`
debe devolver **una** definición; y `grep -rn '="\${' src/ | grep -v escapeAttr` no debe devolver
interpolaciones de datos externos sin `escapeAttr`.

---

### SEG-05 — BAJO — El "sanitizado" de `TooltipSystem.updateContent` es una identidad

**Evidencia** — `src/ui/tooltipSystem.js:525-532`:

```js
525|    updateContent(content) {
526|      // Convertir &#10; a <br> para multi-línea, sanitizando primero
527|      const sanitized =
528|        typeof content === 'string'
529|          ? content.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"')
530|          : '';
531|      const formattedContent = sanitized.replace(/&#10;/g, '<br>');
532|      this.container.innerHTML = `
```

**Qué está mal:** los cuatro `replace` del "sanitizado" reemplazan cada carácter por **sí mismo**: `&`→`&`,
`<`→`<`, `>`→`>`, `"`→`"`. La línea 529 es una identidad. Probablemente nació de una versión anterior con
entidades HTML (`&amp;`, `&lt;`…) que se corrompió al pasar por un escape de entidades, y quedó así. Todo lo que
llega a `updateContent` va directo al `innerHTML` de `:532`.

**Reproducción ejecutada** (`repro-escape.js`, bloque D del anexo):

```
  "<img src=x onerror=alert(1)>" -> "<img src=x onerror=alert(1)>"  identidad=true
  "x\" onmouseover=\"alert(1)\" …" -> idem                          identidad=true
  "a&b" -> "a&b"  identidad=true
  "a<b>c" -> "a<b>c"  identidad=true
```

**Alcance real hoy (medido, no inferido):** **no encontré ningún camino por el que datos externos lleguen a
`updateContent`**. El contenido sale de `getContent(element)` (`:359-371`), que lee atributos `data-tooltip`
—presentes sólo 7 veces en `popup.html:873, :898, :906, :1369, :1379, :1389, :1414`, todos literales escritos a
mano— o `data-tooltip-dynamic`, y **`data-tooltip-dynamic` no aparece en ningún archivo del proyecto** salvo en
la propia función que lo lee (`grep -rn "tooltip-dynamic" src/` → 1 archivo, `ui/tooltipSystem.js`). Por eso la
severidad es BAJO: es una mina sin pisar, no un XSS activo.

**Impacto:** el día que alguien use la API pública `window.showTooltip(element, texto)` (`:587-591`) con un texto
que venga de una API, o agregue un `data-tooltip-dynamic` con datos de exchange, el `innerHTML` de `:532` inserta
tags reales (bloque F del anexo: con `sanitizeHTML` el tag queda texto, con esta función se crea el
elemento). Es el punto del código con la peor relación entre "lo que promete el nombre" y "lo que hace".

**Fix propuesto:** eliminar el `replace` identidad y usar `textContent` para el texto, reservando `<br>` para los
saltos:

```js
updateContent(content) {
  const text = typeof content === 'string' ? content : '';
  this.container.innerHTML = '';
  const div = document.createElement('div');
  div.id = 'tooltip-content';
  div.className = 'tooltip-content';
  text.split('&#10;').forEach((line, i) => {
    if (i) div.appendChild(document.createElement('br'));
    div.appendChild(document.createTextNode(line));
  });
  this.container.appendChild(div);
  const arrow = document.createElement('div');
  arrow.className = 'tooltip-arrow';
  this.container.appendChild(arrow);
}
```

**Cómo verificar que quedó bien:** `grep -c "replace(/&/g, '&')" src/ui/tooltipSystem.js` → 0; y
`showTooltip(document.body, '<img src=x onerror=alert(1)>')` desde la consola del popup debe mostrar el texto
literal, no crear ninguna imagen.

---

### SEG-06 — BAJO — `error.message` se interpola sin escapar en 3 `innerHTML`

**Evidencia** — los tres sinks, todos con el mismo patrón `catch (error) { … innerHTML = \`… ${error.message} …\` }`:

```js
// src/popup.js:1071
1071|        container.innerHTML = `
...
1074|          <p>No se pudo comunicar con el background: ${error.message}</p>
```

```js
// src/popup.js:2948
2948|      container.innerHTML = `
...
2952|          ${error.message || 'Error desconocido'}
```

```js
// src/popup.js:3294
3294|    banksList.innerHTML = `
...
3297|        <p>${error.message}</p>
```

**Qué está mal:** el archivo escapa `data.error` (`:821`), `chrome.runtime.lastError.message` (`:999`), el error
del `catch` externo (`:1083`) y los mensajes de estado (`:4213`, `:4239`, `:4265`) con `sanitizeHTML`, pero en
estos tres lugares interpoló `error.message` directamente. Es incoherencia, no un descuido aislado: el mismo
archivo demuestra que la intención era escapar.

**Impacto:** hoy no encontré forma de que un tercero meta HTML dentro de un `Error.message` generado por el
motor: los mensajes de este código son literales (`throw new Error('Error generando HTML de pestañas')`,
`popup.js:3285`) o de Chrome (`Could not establish connection…`). Por eso la severidad es BAJO y no más: es un
sink abierto sin vector demostrado, exactamente el tipo de línea que se convierte en hallazgo ALTO cuando alguien
agrega un `throw new Error(\`… ${nombreDeExchange} …\`)`. En la dirección contraria, el usuario que abre
DevTools y ve su pila de errores no gana nada con que el texto esté sin escapar.

**Fix propuesto:** `sanitizeHTML(error.message)` en las tres, o mejor un helper `showErrorState(container, msg)`
que escape siempre y sea el único camino para pintar errores.

**Cómo verificar que quedó bien:** `grep -n '${error.message' src/popup.js` no debe devolver resultados sin
`sanitizeHTML` delante.

---

### SEG-07 — BAJO — Permisos de más: `activeTab` sin consumidor y `dolarito.ar` sólo usado por código sin callers

**Evidencia 1** — el bloque de permisos, `manifest.json:6-11`:

```json
  "permissions": [
    "storage",
    "alarms",
    "notifications",
    "activeTab"
  ],
```

**Evidencia 2** — `activeTab` no tiene ningún consumidor. El único uso de la familia `tabs` en todo `src/` es
`chrome.tabs.create` (`src/modules/notificationManager.js:389`, `:501`, `src/popup.js:3171`), que **no requiere
ningún permiso**. `activeTab` sólo sirve para acceder al contenido de la pestaña activa tras un gesto del usuario,
y no hay `chrome.scripting`, ni content scripts, ni `chrome.cookies` (`grep -rn "chrome.scripting|chrome.cookies|chrome.webNavigation|declarativeNetRequest" src/` → 0 resultados).

**Evidencia 3** — `dolarito.ar` (`manifest.json:17`) tiene un solo consumidor en el código,
`src/DataService.js:454-456`:

```js
454|  async fetchDolaritoBankRates() {
455|    try {
456|      const html = await this.fetchHTML('https://www.dolarito.ar/cotizacion/bancos');
```

y ese método sólo se llama desde `fetchCombinedBankRates` (`:601`, `:604`, `:638`), que **no tiene ningún
caller** en el repo (grep sobre `src/` → sólo su definición y sus llamadas internas). El camino vivo del
service worker (`fetchBankDollarRates`, `main-simple.js:562`) va a `criptoya.com` y a ninguna otra parte.

**Qué está bien (verificado):** `storage` (usado en 45 lugares), `alarms` (`main-simple.js:2422`, `:2425`,
`:2436`, `:2453`, `:2457`), `notifications` (`:1729`) y las tres host permissions de las APIs vivas
(`dolarapi.com` en `popup.js:2432`/`DataService.js:96`, `criptoya.com` en múltiples, `api.github.com` en
`main-simple.js:2305`) están justificadas una por una. **No hay `content_scripts`, `web_accessible_resources` ni
`externally_connectable`** — las tres ausencias clave que hacen que la extensión no tenga superficie pasiva
(ver SEG-02).

**Impacto:** con `activeTab`, un compromiso de la extensión (por ejemplo vía SEG-01 + una CSP relajada en el
futuro) tendría un permiso dormido listo para leer la pestaña activa del usuario; hoy no hay ningún código que lo
use, así que es superficie sin beneficio. Con `dolarito.ar`, la extensión puede hablarle a un host que ninguna
ruta viva necesita. El costo de quitarlos es cero; el de dejarlos es que el próximo revisor tiene que volver a
hacer este análisis.

**Fix propuesto:** borrar `"activeTab"` de `permissions` y `"https://dolarito.ar/*"` de `host_permissions` (o,
si el scraping de Dolarito se va a reactivar, dejarlos y documentar en el manifest por qué). Revisar además si el
`.env` del proyecto de desarrollo no termina nunca en el paquete (`npm run package` sólo archiva `dist/`, que es
una copia de `src/` + iconos + manifest: verificado en `scripts/build.js:61-62` y `scripts/package.js:51-52`).

**Cómo verificar que quedó bien:** con la extensión recargada, `chrome://extensions` → "Detalles" →
"Permisos" no debe listar "Leer tu historial de navegación y pestañas" ni el permiso de host de `dolarito.ar`, y
`fetchDolaritoBankRates` no debe tener callers o debe tenerlos documentados.

---

### SEG-08 — BAJO — `getRouteDescription()` devuelve `route.broker` sin escapar y ese valor entra en un atributo

**Evidencia** — `src/renderHelpers.js:178-183` (la rama fallback, la única que no escapa):

```js
178|    // Fallback: usar el campo broker si existe
179|    if (route.broker && !route.broker.includes('→')) {
180|      return route.broker;
181|    }
```

y su destino, un valor de atributo delimitado por comillas dobles — `src/renderHelpers.js:99`:

```js
99|             role="button" tabindex="0" aria-label="Ruta: ${routeDescription}, ganancia ${profitSymbol}${formatNumber(displayMetrics.percentage)} por ciento">
```

**Qué está mal:** las dos ramas anteriores de la misma función **sí** escapan
(`:167-176`, `escapeHtml(route.buyExchange)` etc., que es la corrección que declara S-22 de la auditoría
post-fix), pero el fallback devuelve el valor crudo. Con un `route.broker` que contenga `"` y no contenga `→`,
el `aria-label` se rompe y se inyectan atributos en el `<div class="route-card">`, con la misma mecánica que
SEG-01.

**Alcance real hoy:** `renderHelpers.renderRouteCard` y `renderArbitrageCard` **no se usan en producción**:
`grep -rn "renderRouteCard|renderArbitrageCard" src/` sólo devuelve el propio archivo (los demás resultados
están en `coverage/`, `dist/` y la documentación). El popup usa su propia copia (`popup.js:1583`, que sí escapa
en `:1587-1594`) y `modules/routeManager.js:174` (que también escapa). O sea: es una copia muerta… salvo que
alguien la "reutilice" por parecer el lugar correcto — el mismo riesgo de propagación que F-04 describió para
`arbitrageCalculator.js`.

**Impacto:** ninguno hoy (código no invocado). Mañana, el mismo agujero que SEG-01 en la ruta que parezca la
canónica. Y hay un efecto colateral de este archivo que sí es relevante y sí está vivo:
`renderHelpers.js:95` serializa la ruta entera en un atributo:

```js
95|    const routeData = JSON.stringify({ ...route, displayMetrics }).replace(/'/g, '&apos;');
98|      <div class="route-card …" data-index="${index}" data-route='${routeData}' 
```

Está **bien resuelto** (atributo con comillas simples + `'` → `&apos;`, y `"` ya vienen escapadas por
`JSON.stringify`); lo verifico por ejecución porque es el patrón que suele estar mal:
`repro-escape.js` bloque G del anexo → `atributo data-route leido: "{\"broker\":\"a' onclick='x\"}"` y
`JSON.parse` funciona. Lo dejo asentado para que nadie lo "arregle" y lo rompa.

**Fix propuesto:** `return escapeHtml(route.broker);` en `:180` (la función `escapeHtml` de este archivo escapa
las cinco entidades, incluidas las comillas). O, si el archivo es realmente código muerto, borrar
`renderArbitrageCard`/`renderRouteCard` y quedarse con lo que usan los tests, como se propone en F-04 para el
motor duplicado.

**Cómo verificar que quedó bien:** `grep -n "return route.broker" src/renderHelpers.js` debe estar dentro de un
`escapeHtml(...)`, o no debe existir.

---

### SEG-09 — BAJO — Las URLs de API se guardan, se muestran y se loguean en claro; `setSafeHTML` escribe HTML sin sanear

Tres cosas chicas del mismo tema ("lo que se escribe y lo que se muestra"), con evidencia cada una.

**(a) La configuración de URLs viaja en claro y se puede loguear.** Se persiste sin cifrar (`chrome.storage.local`,
`src/options.js:742`) y el service worker imprime la URL completa cuando el fetch falla —
`src/background/main-simple.js:355` y `:359`:

```js
355|    console.error('🔍 [DIAGNÓSTICO] fetchWithRateLimit() - ❌ ERROR en fetch:', url);
359|    console.warn('Fetch error:', url, e.message);
```

El `console.error` de `:355` **no está gateado** por ningún flag (B-13) así que se escribe siempre. Si un usuario
pega una URL con token (`https://mi-proxy.local/api?token=abc123`, patrón habitual para "APIs propias"), ese
token queda en la consola del service worker y en la pantalla de la página de opciones (el `<input type="url">`
no es `type="password"`, `options.html:1150-1169`). No hay ninguna clave de exchange que proteger (ver (c)), pero
un token de proxy sí es plausible. `chrome.storage.local` tampoco tiene cifrado en reposo: cualquiera con acceso
al perfil del navegador lo lee. Es el estado normal de una extensión, y por eso es BAJO — lo que corresponde es
que el usuario lo sepa, no un fix de seguridad.

**(b) `setSafeHTML` escribe HTML sin sanear.** El nombre promete lo contrario;
`src/utils/commonUtils.js:61-73`:

```js
66|  function setSafeHTML(element, html) {
67|    if (typeof html !== 'string') {
68|      console.warn('⚠️ [CommonUtils] setSafeHTML recibió contenido no string:', html);
69|      element.innerHTML = '';
70|      return;
71|    }
72|    element.innerHTML = html;
73|  }
```

La única "seguridad" del nombre es descartar lo que no sea string. Único consumidor real:
`src/popup.js:895` (`setSafeHTML(container, \`<p class="${errorClass}">❌ ${sanitizeHTML(data.error)}</p>\`)`), donde
el valor sí viene sanitizado. Con el nombre que tiene, invita a pasarle datos sin escapar.

**(c) No hay secretos en el repositorio ni en el storage (verificado, no asumido).**
`grep -rn -iE "apikey|api_key|secret|token|password|privatekey|mnemonic|seed" src/ --include=*.js` → **0
resultados**. `ls -a | grep -iE "env|secret|key"` → **0** (no existe `.env`, y `.gitignore` ya lo cubre con
`.env`, `.env.local`, `.env.production`). `git ls-files | grep -iE "\.env|secret|credential"` → **0**. No leí el
`.env` como pedía la consigna; tampoco hizo falta, porque no está. Y la única dependencia de runtime declarada
(`node-fetch`, `package.json:60-62`) no se usa en ningún archivo del repo (`grep -rn "node-fetch" --include=*.js .`
excluyendo `node_modules/`, `dist/`, `coverage/` → 0 resultados): la extensión no ejecuta una sola línea de código
de terceros.

**Fix propuesto:** renombrar `setSafeHTML` a `setHTML` (o hacerlo sanitizar de verdad: `element.textContent = html`
no sirve porque recibe markup legítimo de plantillas, así que el nombre es el fix), y mover el log de URL a
`log()` gateado, con la URL truncada en el query string.

**Cómo verificar que quedó bien:** `grep -rn "setSafeHTML" src/` debe mostrar un nombre que no prometa
sanitización; y con `__ARBITRAGE_DEBUG__` apagado, un fetch fallido no debe imprimir la URL completa en la consola
del service worker.

---

## Superficie de inyección en la UI (pregunta 1 del encargo)

### Cómo se hizo el barrido (reproducible)

```
$ grep -rn -E "innerHTML|insertAdjacentHTML|outerHTML" src/ --include=*.js | wc -l
74                      ← coincidencias totales (incluye lecturas y comentarios)
$ node %LOCALAPPDATA%\Temp\audit-seg\classify-sinks2.mjs …/src   → TOTAL asignaciones: 64
$ grep -rn -E "new Function|[^a-zA-Z]eval\(|document\.write" src/ --include=*.js   → 0
```

De las 74 coincidencias, **64 son líneas que asignan directamente** (`x.innerHTML = …`, `x.innerHTML += …`,
`insertAdjacentHTML`) y 10 son lecturas, limpiezas con `''` o comentarios: `return div.innerHTML` en
`commonUtils.js:44`, `modalManager.js:255`, `routeRenderer.js:15`, `arbitrage-panel.js:282`,
`element.innerHTML = ''` en `notificationManager.js:449`, `options.js:612`, `routeManager.js:538`,
`popup.js:573/936/3868` y el comentario `popup.js:2129`.

**Cuidado metodológico (importante para leer las tablas):** el barrido por asignación directa **no ve** las
plantillas que se construyen por partes y se asignan después, del estilo `html += \`…\`` dentro de una función y
`container.innerHTML = html` al final. El caso más relevante del informe —`popup.js:2662` y `popup.js:2785`— está
exactamente ahí: son interpolaciones del `renderExchanges`/`applyFilters` que terminan asignándose en los sinks
`popup.js:2679` y `popup.js:2735`. Para cada asignación extraje el bloque de template completo (balanceando
backticks) y la lista de interpolaciones, y marqué las que están en **contexto de atributo** (interpolación
inmediatamente después de `="` o `='`); las plantillas construidas por partes se revisaron a mano una por una.
La salida cruda del barrido se reproduce con `interps.mjs` y `classify-sinks2.mjs`.

### Tabla A — Sinks que reciben datos de una fuente externa

Fuente externa = respuesta de `criptoya.com`/`dolarapi.com`/`dolarito.ar`, JSON de `api.github.com`, o el payload
que el service worker manda al popup. "Contexto" = texto (cuerpo del elemento) o atributo.

| # | Archivo:línea | Dato | Contexto | Escape aplicado | Veredicto |
|---|---|---|---|---|---|
| 1 | `popup.js:2662` | `name` (clave JSON de la API) | **atributo** | `sanitizeHTML` (no escapa `"`) | **INYECTABLE — SEG-01** |
| 2 | `popup.js:2785` | ídem (segundo render, `applyFilters`) | **atributo** | ídem | **INYECTABLE — SEG-01** |
| 3 | `popup.js:1071` | `error.message` | texto | ninguno | sink abierto, sin vector — SEG-06 |
| 4 | `popup.js:2948` | `error.message` | texto | ninguno | ídem |
| 5 | `popup.js:3294` | `error.message` | texto | ninguno | ídem |
| 6 | `popup.js:2664/2670/3453/3499` | `name`, `source`, `exchangeName` | texto | `sanitizeHTML` | OK (texto) |
| 7 | `popup.js:814/837/895/996/1082/4213/4239/4265` | `data.error`, `error.message`, `chrome.runtime.lastError.message` | texto | `sanitizeHTML` | OK |
| 8 | `popup.js:1207`, `1409-1450`, `1587-1594` | `arb.broker`, `route.*` | texto | `sanitizeHTML` | OK |
| 9 | `popup.js:1421-1425` | ruta completa serializada | **atributo** | `encodeURIComponent(JSON.stringify(…))` | OK (verificado: `repro-escape.js` G) |
| 10 | `popup.js:1727/1756/1827/1849` | `usdtAmount`/`usdAmount` | texto | ninguno | OK: salen de campos numéricos de la ruta (`route.usdtSold \|\| route.calculation?.…`), nunca de texto de API |
| 11 | `popup.js:3912/4064` (tarjetas y modal cripto) | `route.crypto`, `route.buyExchange`, `route.sellExchange` | texto | `sanitizeHTML(capitalizeFirst(…))` | OK |
| 12 | `popup.js:2413` (guía paso a paso), `popup.js:1659` (cuerpo de los modales) | `values.broker` derivado de `route.buyExchange`; `modalContent` de `generateArbitrageModal`/`generateDirectUsdtArsModal`/`generateUsdToUsdtModal` | texto | `sanitizeHTML` en `generateGuideHeader:2203`, en los pasos y en los generadores de modal (1690-2010) | OK |
| 13 | `modules/routeManager.js:381` | `route.broker`, `route.buyExchange/sellExchange` | texto | `escapeHtml` local (escapa comillas) | OK |
| 14 | `modules/routeManager.js:434/624/643` | lista vacía, `message` de error | texto | `escapeHtml` | OK |
| 15 | `modules/modalManager.js:425/485/531` | `title`, `message` | texto | `sanitizeHTML` | OK — pero `${content}` de `showInfo:531` es HTML crudo por contrato y **no tiene llamadores** (`grep` → sólo la definición) |
| 16 | `modules/simulator.js:599` | tabla de la matriz | texto/atributo | sólo números (`toFixed`, `Fmt.formatNumber`) | OK |
| 17 | `ui-components/arbitrage-panel.js:173` | `data.title/fromExchange/toExchange/…` | texto | `sanitizeHTML` (copia local) | OK |
| 18 | `options.js:659` | `label` de un broker cargado por el usuario | texto | `CommonUtils.sanitizeHTML` | OK (texto) — el mismo valor se usa en `querySelector` en `:638`, que es el bug de selector de O-22 |
| 19 | `ui/tooltipSystem.js:532` | contenido de `data-tooltip` | texto | "sanitizador" identidad | **INYECTABLE si algún día se le pasa dato externo — SEG-05** (hoy inalcanzable) |
| 20 | `renderHelpers.js:98` (muerto) | ruta serializada | **atributo** | `JSON.stringify` + `'`→`&apos;` | OK (verificado) |
| 21 | `renderHelpers.js:180` → `:99` (muerto) | `route.broker` (rama fallback de `getRouteDescription`) | **atributo** (`aria-label`) | ninguno en esa rama | **INYECTABLE — SEG-08** (código sin llamadores). Nota: la otra rama del mismo archivo, `:37` (`aria-label="… ${escapeHtml(arb.broker)}"`), **sí** escapa comillas y está bien |
| 22 | `ui/routeRenderer.js:127` (muerto) | `exchangeName` | **atributo** | `escapeHtml` local = `textContent→innerHTML` (no escapa `"`) | **INYECTABLE — mismo defecto que SEG-01**, en código sin llamadores |

### Tabla B — Sinks sin datos externos (el resto)

| Archivo | Líneas | Qué contienen |
|---|---|---|
| `popup.js` | 18 de las 40 asignaciones de ese archivo: `175`, `573`, `791`, `905`, `912`, `936`, `962`, `981`, `1016`, `1028`, `1040`, `1285`, `2525`, `2550`, `2908`, `2934`, `2988`, `3868` | estados de carga/error/vacío con textos literales, flags `!!chrome.runtime`, `new Date().toISOString()`, contadores numéricos (`ageMinutes`) y limpiezas con `''` |
| `modules/filterManager.js` | 1 (`483`) | `<option value="all">Todos los exchanges</option>` literal |
| `modules/notificationManager.js` | 1 (`449`) | `innerHTML = ''` + `createElement`/`textContent` |
| `options.js` | 3 (`612`, `615`, `701`) | limpieza de listas y filas con literales |
| `utils/commonUtils.js` | 2 (`69`, `72`) | `setSafeHTML` (SEG-09b) |
| `modules/routeManager.js:538`, `popup.js:1659` | 2 | limpieza / reasignación de contenido ya auditado en la Tabla A |

**Recuento final, sin ambigüedad:** 64 asignaciones directas + 2 interpolaciones en plantillas construidas por
función (`popup.js:2662`, `popup.js:2785`, que se materializan en los sinks `2679` y `2735`). Los puntos que
reciben dato de una fuente externa están enumerados línea por línea en la Tabla A (22 filas); todo lo demás son
literales, números, flags del navegador o limpiezas con `''`.
**Con defecto de escape: 4 líneas** — 2 vivas (`popup.js:2662` y `:2785`, el mismo JSON sin escapar en dos renders)
y 2 en código sin llamadores (`renderHelpers.js:37` vía `:180`/`:99`, y `ui/routeRenderer.js:127`).
**Con ejecución de código posible: 0**, por la CSP.

### El subconjunto explotable, en una frase

**Dos líneas vivas (`popup.js:2662` y `popup.js:2785`) permiten inyectar atributos** en las tarjetas de exchange a
partir de la clave de un JSON de API (URL configurable por el usuario o API legítima comprometida/suplantada), y
**dos líneas en código muerto (`renderHelpers.js:180`, `ui/routeRenderer.js:127`) tienen el mismo defecto**.
**Ninguna permite ejecutar JavaScript**: la CSP `script-src 'self'` bloquea los handlers inline — verificado en un
Chromium real (sección SEG-01) con control negativo y positivo. No hay `eval`, `new Function`, `document.write`
ni `import()` en `src/` (grep = 0), y `innerHTML` no ejecuta `<script>` (verificado: `hijos del contenedor: 0`).

---

## Mensajería entre contextos (pregunta 2 del encargo)

Además de lo verificado en SEG-02, estas son las respuestas puntuales:

| Pregunta | Respuesta | Evidencia |
|---|---|---|
| ¿Se valida el sender? | Parcialmente: hay guarda, pero con `&&` que admite remitentes sin `id` | `main-simple.js:2223` |
| ¿Se valida el origen (`sender.url`/`origin`)? | **No** | `main-simple.js:2221-2233` no menciona `sender.url` ni `sender.origin` |
| ¿Se valida la forma del payload? | **No** | `:2227-2229` usa `request.action` y `request.type` crudos |
| ¿Algún handler escribe storage con lo que llega? | **No**. Los únicos `chrome.storage.local.set` de producción son `main-simple.js:2332` (pendingUpdate del chequeo de GitHub) y `DataService.js:443` (criptos activas), ninguno alimentado por un mensaje | grep de `storage.local.set` |
| ¿Algún handler ejecuta algo destructivo? | El peor caso es **trabajo de red**: `getBanksData` dispara 7 fetches en paralelo (`:2116-2124`), `getArbitrages`/`refresh`/`settingsUpdated` disparan `updateData()`. Sumado a B-03 (sin single-flight) es amplificación, no destrucción | `:2030-2168` |
| ¿Puede una página web hablarle a la extensión? | **No** | Sin `externally_connectable`, sin `content_scripts`, sin `web_accessible_resources`, sin `onMessageExternal` |
| ¿Y un iframe inyectado? | **No**, por lo mismo: la extensión no expone ningún mensaje aceptable desde un contexto web. El único `onMessage` es el del SW y los mensajes externos no se le entregan sin `externally_connectable` | ídem |
| ¿Y otra extensión? | **No** en la configuración actual (misma razón). Si se agregara `externally_connectable.ids`, la guarda de `:2223` no la frenaría por el `&&` | `:2223` |
| ¿El popup/options validan la respuesta del background? | No validan forma: `popup.js:988` pasa `data` a `handleSuccessfulData` que lee `data.backgroundUnhealthy`, `data.error`, `data.optimizedRoutes` con optional chaining/guards; `options.js:763` sólo mira `response?.success` | `popup.js:988-1060`, `options.js:763` |

---

## `manifest.json`: permisos, CSP y superficies declaradas (pregunta 3)

| Clave | Valor | Veredicto |
|---|---|---|
| `manifest_version` | 3 | — |
| `permissions` | `storage`, `alarms`, `notifications`, `activeTab` | 3 de 4 justificados; `activeTab` sin consumidor — SEG-07 |
| `host_permissions` | `dolarapi.com`, `criptoya.com`, `dolarito.ar`, `api.github.com` | 3 vivos; `dolarito.ar` sólo por código sin callers — SEG-07 |
| `content_scripts` | **ausente** | ✅ no hay superficie pasiva |
| `web_accessible_resources` | **ausente** | ✅ ninguna página puede cargar recursos de la extensión |
| `externally_connectable` | **ausente** | ✅ ninguna web/iframes/otras extensiones pueden mandarle mensajes |
| `content_security_policy.extension_pages` | `script-src 'self'; object-src 'self';` | ✅ lo más estricto posible para este código: sin `'unsafe-inline'`, `'unsafe-eval'`, `'wasm-unsafe-eval'` ni remotos. Verificado que bloquea handlers inline (Chromium real) |
| `options_page` / `action.default_popup` / `background.service_worker` | `src/options.html`, `src/popup.html`, `src/background/main-simple.js` | ✅ coinciden con el código |

**Qué NO tiene la CSP** (y no es un problema, pero conviene saberlo): no hay `connect-src`, así que la restricción
de hosts admisibles la dan las `host_permissions` (CORS) y, para un host arbitrario, los headers del tercero
—exactamente el caso de SEG-03—. Tampoco hay `frame-src`/`child-src`: ningún código de `src/` crea un `iframe`
(grep de `createElement('iframe')` → 0), así que no aplica hoy.

---

## Código remoto y contenido remoto (pregunta 5)

| Chequeo | Resultado | Evidencia |
|---|---|---|
| `eval`, `new Function`, `document.write`, `import()` | **0** | grep sobre `src/` |
| `<script>` inyectado dinámicamente | **0** (y `innerHTML` no ejecuta `<script>`, verificado) | bloque F del anexo |
| `importScripts` remoto | No: sólo módulos locales | `main-simple.js:23` (`apiClient.js`, `arbitrageCalculator.js`, `../DataService.js`, `cacheManager.js`) |
| Código de `node_modules` dentro de la extensión | **0**: no hay bundler, `scripts/build.js:61-62` copia `src/` + `manifest.json` + iconos; `scripts/package.js:51-52` archiva `dist/`. La única dependencia de runtime (`node-fetch`) no se referencia en ningún archivo | grep `node-fetch` = 0 |
| Chequeo de updates (~2300-2372): ¿trae y ejecuta contenido remoto? | **No. Sólo lee strings.** `main-simple.js:2304-2328`: GET a `api.github.com/.../commits/main`, `data.commit.message.match(/v?(\d+\.\d+\.\d+)/)`, `compareVersions(currentVersion, latestVersion)` y a lo sumo guarda `{currentVersion, latestVersion, message, url, date, sha}` en `chrome.storage.local` (`:2332-2341`) y pone el badge (`:2344-2345`) | lectura de `:2300-2354` |
| ¿Ese contenido remoto se renderiza sin escapar? | **No**: el modal de actualización usa `textContent` para el mensaje (`notificationManager.js:437-439`), `setAttribute` para el tooltip (`:354`) y un `<li>` con `textContent` por feature (`:448-455`) | verificado |
| `chrome.tabs.create` con URL remota | `notificationManager.js:501` abre `updateInfo?.url \|\| releasesUrl`, y `updateInfo.url` es `data.html_url` de GitHub (guardado en storage). No hay validación de esquema, pero `chrome.tabs.create` rechaza `javascript:`/`data:`, así que el peor caso es abrir una pestaña a un `https://` ajeno con el falso positivo de F-05 | `main-simple.js:2337`, `notificationManager.js:382-390`, `:501` |

**Conclusión del punto:** la extensión **no descarga ni ejecuta código remoto**. El chequeo de actualizaciones es
comparación de strings (y su problema es el falso positivo de F-05, no ejecución). El contenido remoto que sí se
incorpora es **datos** de las APIs, y ahí es donde aplica toda la sección de inyección.

---

## Datos guardados (pregunta 6 del encargo)

**Todo el estado vive en `chrome.storage.local`; no hay nada en `chrome.storage.sync`.**

| Clave | Escrito en | Contenido | Sensibilidad |
|---|---|---|---|
| `notificationSettings` | `options.js:742` (objeto completo), `popup.js:3154` | configuración: precios, bancos, exchanges, fees, umbrales, `brokerFees[]`, y **las 4 URLs de API** (incluido cualquier query string que el usuario pegue) | Configuración. Sin PII. Sin credenciales. Es la clave que puede llevar un token si el usuario lo pega (SEG-09a) |
| `pendingUpdate` | `main-simple.js:2332-2341` | `{currentVersion, latestVersion, message, url, date, sha}` — texto del commit de GitHub y `html_url` | Público (repo público de GitHub) |
| `dismissedUpdate` | `notificationManager.js:517-524` | versión descartada + `expiresAt` (7 días) | Irrelevante |
| `activeCryptos` | `DataService.js:443` | lista de criptos activas para el arbitraje cripto | Irrelevante |

Comprobaciones específicas pedidas:

- **Claves de API de brokers/exchanges en claro: no hay ninguna**, porque no existen en la extensión
  (`grep -rn -iE "apikey|api_key|secret|token|password|privatekey|mnemonic|seed" src/` → 0). La extensión no se
  autentica contra ningún servicio: sólo lee cotizaciones públicas.
- **Datos personales: ninguno.** No hay login, no hay cuenta, no hay correo, ni nombre, ni identificadores de
  usuario. Las únicas claves persistidas son las cuatro de la tabla.
- **¿Algo se sincroniza?** No. `chrome.storage.sync` se lee **una sola vez** en todo `src/`
  (`popup.js:3609`, con defaults) y **nunca se escribe** (`grep -rn "storage.sync" src/` → 1 resultado, esa
  lectura). Es la causa funcional de O-11; en seguridad, es un punto a favor: nada sale del equipo por esa vía.
- `localStorage` se usa sólo para el flag de debug (`arb_debug_logs`) y para recordar el ordenamiento de la
  pestaña de bancos (`banksActiveSort`, `banksSort*Direction`, `popup.js:3339-3572`). Sin datos sensibles, y es
  estado del propio documento de la extensión, no de páginas web (la extensión no inyecta nada en páginas).

---

## Qué envía la extensión a sitios de terceros (pregunta 7 del encargo)

| Endpoint | Desde | Método y headers |
|---|---|---|
| `criptoya.com/api/usdt/ars/1`, `/api/usdt/usd/1`, `/api/USDT/ARS/1`, `/api/USDT/USD/1`, `/api/bancostodos`, `/api/dolar`, `/api/binancep2p/usdt/{ars,usd}/1`, `/api/{symbol}/{fiat}/1` | SW (`main-simple.js:184/217/366/411/524/537/550/564`, `DataService.js:105/114/133/162/508`) y popup (`popup.js:2443-2445`) | `GET`, sin headers propios |
| `dolarapi.com/v1/dolares/oficial` | popup (`popup.js:2443`), `DataService.js:96`, `apiClient.js:33` (muerto) | `GET`, sin headers |
| `api.github.com/repos/nomdedev/ArbitrageAR-USDT/commits/main` | SW (`main-simple.js:2304-2308`) | `GET` con **un** header: `Accept: application/vnd.github.v3+json` |
| `www.dolarito.ar/cotizacion/bancos` | `DataService.js:456` (**sin callers**) | `GET` del HTML que se parsea con regex (`:464-470`), sin insertarlo en el DOM |
| `github.com/nomdedev/ArbitrageAR-USDT/releases[/latest]` | `notificationManager.js:382/499` | No es un `fetch`: es `chrome.tabs.create` (abre pestaña) |

- **8 sitios de llamada a `fetch` en total** (`grep -c`), todos `GET`; el único `headers:` del camino vivo es el
  `Accept` de GitHub. No hay `method: 'POST'`, ni `body:`, ni `credentials: 'include'`, ni tokens en headers.
- **No se envía contenido de la extensión a ningún tercero**: cada request va a su host y no se re-postea nada
  (por eso, un host bajo control ajeno sólo recibe *la propia petición*; ver la tabla de SEG-03).
- **Lo que un tercero aprende:** la IP del usuario, el `User-Agent` del navegador, que existe una extensión
  haciendo esas consultas cada N minutos (cadencia = rutina del usuario), y —**NO VERIFICADO**— eventualmente
  `Origin: chrome-extension://eekjnnmknnmdieggifdakabaonghfakl`. No le llega ninguna credencial ni dato personal.
- **Nota de privacidad que no es un bug:** el `fetch` del popup/`DataService` no manda cookies cross-origin
  (`credentials: "same-origin"` por default), así que la extensión no arrastra la sesión del usuario en
  `criptoya.com`/`dolarapi.com` (sitios donde podría estar logueado). Verificado por lectura de los 8 call sites.

---

## Matices sobre hallazgos ya registrados

| Hallazgo previo | Matiz nuevo (verificado en este trabajo) |
|---|---|
| **O-10** (URLs sin whitelist) | Desde el lado red: de las 4 URLs, **sólo `criptoyaBanksUrl` llega al service worker** (`main-simple.js:564`, `:579`); las otras 3 las consume el popup (`popup.js:2443-2445`). El `fetch` no lleva `credentials` ni headers propios (`:339`), así que el riesgo no es fuga de credenciales (no existen) sino (a) SSRF ciega y (b) que la respuesta de un host bajo control ajeno se convierte en datos renderizados (SEG-01/SEG-04). Y `redirect` no está fijado: el host final del JSON puede no ser el configurado. Ver SEG-03. |
| **O-22** (crash por comilla en `querySelector`) | Es el hermano del mismo defecto de SEG-01: dato de usuario concatenado en una cadena que otro parser interpreta (allí CSS, aquí HTML). Los dos juntos muestran que el patrón "escapar por un solo contexto" atraviesa el proyecto. |
| **F-05** (aviso de versión falso) | El texto del commit de GitHub se guarda en `pendingUpdate` y se muestra con `textContent` (`notificationManager.js:437-439`) → **sin riesgo de inyección**. El contenido remoto que sí viaja a una API de navegación es `updateInfo.url` (el `html_url` de GitHub) en `chrome.tabs.create` (`:501`), sin validación de esquema: `javascript:`/`data:` los rechaza Chrome, así que queda en "abre una pestaña ajena", no en ejecución. |
| **B-13** (console no gateada) | Matiz de datos, no de ruido: lo que se imprime incluye la **URL de configuración completa** (`main-simple.js:355/359`), así que un token embebido por el usuario queda en la consola del service worker. Ver SEG-09a. |
| **B-09** (URLs editables que no se usan / claves fantasma) | Coincido, y agrego un detalle que refuerza el diagnóstico: en `handleGetBanksData` (`main-simple.js:2116-2124`) `fetchUSDT()` y `fetchUSDTtoUSD()` se llaman **sin** `userSettings` (`:2119-2120`) mientras las otras cinco sí lo reciben — son justamente las dos que hardcodean la URL. Desde seguridad: la única URL editable que realmente ejecuta tráfico de red es `criptoyaBanksUrl`. |
| **F-04** (motor duplicado y muerto) | El mismo patrón, en clave de seguridad: `renderHelpers.js` y `ui/routeRenderer.js` son copias muertas con **el defecto de escape** (SEG-08 y fila 22 de la Tabla A). Un "arreglo" que se haga en la copia viva y no en la muerta (o al revés) reproduce la confusión de F-04, pero con consecuencia de seguridad. |
| **O-11** (popup lee `storage.sync`, options escribe `local`) | Además del bug funcional, es el motivo de que **nada se sincronice** con la cuenta del usuario: no hay fuga por esa vía. Punto a favor que conviene no romper al arreglar O-11 (si se empieza a escribir `sync`, `notificationSettings` —con las URLs— saldría del equipo). |

---

## Verificación de auditorías previas

Afirmaciones de `.claude/AUDITORIA_COMPLETA.md` y `.claude/auditorias/*.md` contrastadas contra el código de
`5fdfa9e`:

| Afirmación previa | ¿Sigue siendo cierta? | Evidencia |
|---|---|---|
| `SECURITY_AUDIT_2026-03-31.md:36` — "64 instancias de innerHTML… muchas insertan datos de APIs externas sin sanitización" | **Parcialmente**: hoy siguen existiendo 64 asignaciones (métrica idéntica, casualidad), pero la mayoría ya escapa. Queda el subconjunto de contexto de atributo | Tabla A del informe |
| `SECURITY_AUDIT_2026-03-31.md:197-199` — remediación propuesta: `if (sender.id !== chrome.runtime.id) { … }` | **NO, se implementó distinto**: la versión en el código agrega `&&`, que admite remitentes sin `id` | `main-simple.js:2223` vs el snippet de la auditoría |
| `SECURITY_AUDIT_2026-03-31.md:311-333` — "Permisos Mínimos 9/10 … sin permisos innecesarios" | **NO del todo**: `activeTab` sin consumidor; `dolarito.ar` sólo por código sin callers | SEG-07 |
| `SECURITY_AUDIT_2026-03-31.md:335-339` — "Sin Código Peligroso: no `eval()`, no `document.write()`" | **SÍ** (verificado con grep, y agrego `new Function`/`import()` = 0) | "Código remoto", pregunta 5 |
| `AUDITORIA_POST_FIX_2026-04-01.md:65` — S-23 "`ui/tooltipSystem.js` — Sanitización en `updateContent`" | **NO**: el "sanitizado" reemplaza cada carácter por sí mismo (identidad) | `tooltipSystem.js:527-530` + bloque D del anexo |
| `AUDITORIA_POST_FIX_2026-04-01.md:64` — S-22 "`renderHelpers.js` — `escapeHtml()` en `getRouteDescription`" | **INCOMPLETO**: el fallback `return route.broker;` (`:180`) no escapa y va a un atributo (`:99`) | SEG-08 |
| `AUDITORIA_POST_FIX_2026-04-01.md:63` — S-21 "`ui/routeRenderer.js` — `escapeHtml()` en exchange names" | **INCOMPLETO**: ese `escapeHtml` es `textContent→innerHTML` (no escapa `"`) y se usa en `data-exchange="…"` (`:127`). Mitigado porque `renderRoutes` no tiene callers | SEG-08/Tabla A fila 22 |
| `AUDITORIA_POST_FIX_2026-04-01.md:77` y `:187` — "No hay vectores XSS explotables restantes" / "0 vectores XSS críticos restantes" | **NO en el sentido estricto**: hay inyección de atributos verificada por ejecución en dos líneas vivas (`popup.js:2662`, `:2785`) y dos muertas. No hay ejecución de JS gracias a la CSP | SEG-01 + reproducción en Chromium real |
| `AUDITORIA_POST_FIX_2026-04-01.md:85` — CSP "sin `unsafe-eval`, `wasm-unsafe-eval` ni `unsafe-inline`" | **SÍ** | `manifest.json:34-36` |
| `AUDITORIA_POST_FIX_2026-04-01.md:96` — "Permisos… sin permisos innecesarios" | **NO** por `activeTab`/`dolarito.ar` | SEG-07 |
| `CONSOLIDATED_AUDIT_2026-04-01.md:30` — "Validación origen mensajes ✅ IMPLEMENTADO (`main-simple.js:2128`)" | **Implementado, pero defectuoso** (`&&`); y la línea citada hoy es 2223 (deriva de numeración) | SEG-02 |
| `CONSOLIDATED_AUDIT_2026-04-01.md:31-33` — "escapeHtml en renderHelpers / routeRenderer / options ✅" | **Matizado**: en los tres casos la función elegida **no escapa comillas** y en dos de ellos el sink es un atributo | SEG-08, SEG-04 |
| `CONSOLIDATED_AUDIT_2026-04-01.md:62-65` — `modalManager.js:534` `${content}` crudo "⚠️ DOCUMENTADO … No hay llamadas actuales" | **SÍ**: sigue crudo y sigue sin llamadores (`grep` de `showInfo` → sólo definición y export) | `modalManager.js:527-537` |
| `CONSOLIDATED_AUDIT_2026-04-01.md:118` — "CSP Fix: convertidos 11 `onclick` inline a event listeners" | **SÍ en lo esencial**: 0 atributos `on...="` generados por código (`grep` = 0). Matiz: quedan asignaciones de propiedad (`versionIndicator.onclick = …`, `notificationManager.js:361`), que la CSP permite y no son el patrón eliminado | grep + `notificationManager.js:361` |
| `CONSOLIDATED_AUDIT_2026-04-01.md:179` — "Vulnerabilidades XSS activas: 0" | **NO en el sentido de "0 inyecciones"**; sí en el de "0 ejecuciones posibles" | SEG-01 |
| `SECURITY_AUDIT_2026-03-31.md:268-289` — VULN-005 "dependencias de desarrollo con vulnerabilidades (npm audit)" | **No re-verificado** (ver "Lo que NO pude verificar"). Lo que sí verifiqué: **ninguna dependencia se empaqueta ni se ejecuta en la extensión** | `scripts/build.js:61-62`, `scripts/package.js:51-52`, grep `node-fetch` = 0 |
| `AUDITORIA_COMPLETA.md:40, :159, :302-310` — "Posible XSS en `innerHTML`, `popup.js:1177-1227` (`${exchangeFormatted}` sin sanitizar)" | **Las líneas ya no corresponden** (hoy 1177-1227 es la guía paso a paso, sanitizada) pero **la clase de bug sigue existiendo**, desplazada a `popup.js:2662/2785` | Tabla A |

---

## Lo que NO pude verificar

1. **La cabecera `Origin` en las peticiones del service worker.** Depende del navegador, no del código. Haría
   falta: cargar la extensión en Brave, apuntar `criptoyaBanksUrl` a un servidor propio que loguee headers y mirar
   qué llega (mi hipótesis, sin confirmar, es que aparece `Origin: chrome-extension://eekjnnmknnmdieggifdakabaonghfakl`
   y ningún `Referer`). Lo único que sé con certeza es que **el código no agrega headers ni credenciales**.
2. **El comportamiento real de la CSP dentro de la extensión.** Verifiqué el mecanismo (handlers inline bloqueados
   por `script-src 'self'`) en un Chromium real con una página `data:` que declara la misma política, con control
   positivo sin CSP. No lo verifiqué con la extensión cargada, porque eso exige reiniciar el navegador con
   `--load-extension` sobre el perfil del usuario (fuera de las reglas de este trabajo). El hecho de código
   (`manifest.json:34-36`) y el comportamiento del navegador son sólidos, pero es una inferencia sobre el contexto
   `chrome-extension://`, no una medición dentro de la extensión.
3. **`npm audit` / CVEs de las dependencias de desarrollo.** No lo corrí: `npm audit` puede escribir
   `package-lock.json` dentro del repo y la regla es sólo lectura. Del resto de VULN-005 lo único que puedo
   afirmar es lo verificado: ninguna dependencia se empaqueta ni se ejecuta en la extensión.
4. **Runtime del popup con la extensión cargada.** No abrí `chrome-extension://eekjnnmknnmdieggifdakabaonghfakl/src/popup.html`
   en el perfil del usuario. Las reproducciones de escape/parseo las hice con jsdom (parser HTML real, mismas
   reglas) y con Chromium sobre páginas de prueba, no sobre la extensión. En particular, **no confirmé con
   tráfico real** que un JSON hostil llegue a `popup.js:2662` desde una URL configurada: la cadena que describo
   está verificada eslabón por eslabón (origen del dato → función → template → parseo), pero no end-to-end en la
   UI.
5. **El estado real del `chrome.storage.local` del perfil del usuario** (si ya tiene una URL custom guardada o un
   token embebido). No leí el perfil de Brave; sólo el código.
6. **`src/background/arbitrageCalculator.js` y `src/background/apiClient.js` línea por línea.** De `apiClient.js`
   sólo verifiqué lo que la auditoría previa declara y su no-uso (`ApiClient` aparece sólo en su archivo, B-08);
   de `arbitrageCalculator.js`, su no-uso (F-04). No audité su seguridad interna porque no ejecutan en producción;
   si alguien los cablea, hay que revisarlos (tienen `fetch` propio y opciones de `headers`, `apiClient.js:18`).
7. **`scripts/**` y `.claude/**`** más allá de `build.js`/`package.js` (usados para SEG-07/SEG-09): no revisé el
   entorno de desarrollo (hooks, settings, MCP) porque no forma parte del artefacto que corre en el navegador.

---

## Anexo — Reproducciones ejecutadas (bloques A–G)

Salida literal de `node %LOCALAPPDATA%\Temp\audit-seg\repro-escape.js` en el equipo donde se hizo la auditoría
(jsdom ya presente en `node_modules` del repo; no se instaló nada y no se tocó ningún archivo del repo). El script
no forma parte del repo: vive en el temporal de Windows y se puede re-ejecutar tal cual. Todas las referencias
"bloque X del anexo" de este informe apuntan a esta salida.

```
=== A. sanitizeHTML (CommonUtils / popup / modalManager / arbitrage-panel) ===
entrada : "x\" onmouseover=\"alert(1)\" style=\"position:fixed;inset:0;background:#fff\" data-x=\""
salida  : "x\" onmouseover=\"alert(1)\" style=\"position:fixed;inset:0;background:#fff\" data-x=\""
comilla doble escapada?  false
comilla simple escapada? false
backtick escapado?       false
tag escapado?            &lt;img src=x onerror=alert(1)&gt;

=== B. escapeHtml de routeManager/renderHelpers (replace manual) ===
comilla doble escapada?  true
comilla simple escapada? true

=== C. escapeHtml de ui/routeRenderer.js (textContent->innerHTML) ===
entrada : "a'b\"c"
salida  : "a'b\"c"
comilla doble escapada?  false

=== D. tooltipSystem.updateContent: el "sanitizador" es una identidad? ===
  "<img src=x onerror=alert(1)>" -> "<img src=x onerror=alert(1)>"  identidad=true
  "x\" onmouseover=\"alert(1)\" style=\"position:fixed;inset:0;background:#fff\" data-x=\"\"" -> "x\" onmouseover=\"alert(1)\" style=\"position:fixed;inset:0;background:#fff\" data-x=\"\""  identidad=true
  "a&b" -> "a&b"  identidad=true
  "a<b>c" -> "a<b>c"  identidad=true

=== E. Reproduccion del sink real: popup.js:2662 data-name="..." ===
HTML generado:
<div class="exchange-card" data-type="usdt_ars" data-name="x" onmouseover="alert(1)" style="position:fixed;inset:0;background:#fff" data-x="">contenido</div>

atributos del div parseado por el navegador:
[
  'class="exchange-card"',
  'data-type="usdt_ars"',
  'data-name="x"',
  'onmouseover="alert(1)"',
  'style="position:fixed;inset:0;background:#fff"',
  'data-x=""'
]

=== F. Reproduccion: innerHTML NO ejecuta <script>, pero el div queda inyectado ===
hijos del contenedor: 0 (0 = el tag no se creo, quedo texto escapado)

=== G. data-route con JSON.stringify + &apos; (renderHelpers.js:95-98) ===
atributo data-route leido: "{\"broker\":\"a' onclick='x\"}"
JSON.parse funciona tras decodeURIComponent? si
```

Para el bloque de la CSP (handlers inline bloqueados por `script-src 'self'`) la verificación se hizo en un
Chromium real vía CDP, no con jsdom (jsdom no implementa CSP); el resultado está transcripto en SEG-01.

