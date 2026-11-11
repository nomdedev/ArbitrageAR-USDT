# 07 · Alertas y notificaciones — probadas en vivo

Qué se midió, cómo, qué estaba roto y qué se arregló. La promesa del producto («te avisa solo
cuando la brecha supera tu umbral») es verificable, así que se verificó en un navegador real.

## Cómo se prueba

| instrumento | qué cubre | corre en |
|---|---|---|
| `tests/e2e/playwright/alertas-notificacion.spec.js` | la extensión cargada en Chromium: funciones reales del service worker, envío real, alarma real | local (necesita navegador) |
| `tests/background.notification-gate.test.js` | la compuerta `shouldSendNotification` extraída del fuente, con dependencias inyectadas | CI, sin navegador, estable en cualquier zona horaria |

```bash
npm run test:e2e:alertas          # en vivo (abre Chromium con la extensión)
npx jest tests/background.notification-gate.test.js   # la compuerta, en 1,2 s
```

En vivo se capturan los envíos con un stub de `chrome.notifications.create` —para no llenar el
escritorio de avisos— y al final se hace un envío **sin** stub para comprobar que Chrome lo acepta.

## Lo que anda (medido)

| control | resultado |
|---|---|
| 7,5 % con umbral 5 % | avisa: «Oportunidad interesante en Binance», `Ganancia neta estimada: +7.50%` |
| 12 % | prioridad 2 y `requireInteraction: true` |
| 7,5 % sin comisiones descontadas | dice **BRUTA** (regla F-09, verificada en vivo) |
| 2 % con umbral 5 % | no avisa |
| notificaciones deshabilitadas | no avisa |
| horario silencioso 00:00–23:59 | no avisa |
| solo ripio habilitado, oportunidad en binance | no avisa |
| mismo broker, misma banda (7,5 % y 7,9 %) | avisa una sola vez; clave `binance_7` (B-01) |
| alarma `updateDataAlarm` | existe, cada 5 min, y despierta al service worker |
| notificación real (sin stub) | Chrome la acepta y devuelve id |

## Los tres defectos que estaban, con la causa medida

### 1. La alerta disparaba pero Chrome no la mostraba (iconUrl relativa)

`sendNotification` usaba `iconUrl: 'icons/icon128.png'`. Chrome resuelve esa ruta relativa
**contra el script del service worker** (`/src/background/`), no contra la raíz de la extensión:
busca `/src/background/icons/icon128.png`, no lo encuentra y `create()` **rechaza** con
`Unable to download all specified images`. Se probaron las cinco variantes en vivo:

| ruta probada | resultado |
|---|---|
| `icons/icon128.png` (lo que usaba el código) | ❌ *Unable to download all specified images* |
| `../../icons/icon128.png` (relativa desde el script) | ✅ confirma cómo resuelve Chrome |
| `chrome.runtime.getURL('icons/icon128.png')` | ✅ |
| `chrome.runtime.getURL('icons/no-existe.png')` (control) | ❌ mismo error ⇒ el mensaje es «no encontré el recurso» |
| sin `iconUrl` | ✅ |

Arreglado: `iconUrl: chrome.runtime.getURL('icons/icon128.png')` (`src/background/main-simple.js`).
De paso se sacó el espacio inicial del título: los íconos de nivel son cadenas vacías, así que el
título arrancaba con un blanco (« ⭕ Oportunidad interesante…»).

### 2. El aviso automático no llegaba después de cada reinicio del service worker

`checkAndNotify` salía temprano si `isFirstUpdate` estaba en `true`. Esa bandera es **del proceso**,
y en Manifest V3 el service worker se apaga y la alarma lo vuelve a crear: cada despertar la deja en
`true`, así que el aviso automático sólo podía salir con el popup abierto y el worker vivo.

Medido en vivo: `checkAndNotify` con la bandera en `true` → **0 avisos**; con la bandera en `false`
→ 1 aviso. Arreglado: la siembra queda anotada en `storage` (`notificacionSembrada`), así que se
salta **una vez en la vida de la instalación**, no una vez por arranque. La prueba en vivo lo mide
en los dos sentidos: primera actualización 0 avisos, reinicio del service worker 1 aviso.

### 3. La opción «Sin límite» esperaba un minuto

```js
const minInterval = frequencies[settings.notificationFrequency] || frequencies['1min'];
```
`frequencies['always']` es `0` y `0` es falsy ⇒ la opción **Sin límite** caía en el default de 1
minuto. Arreglado con `??`. Lo encontró la prueba de la compuerta (en vivo no se veía, porque ahí el
reloj se reinicia entre casos); quedó como test de regresión.

### Trampa latente (sin arreglar, documentada)

`frequencies.once = Infinity` hace que `now - lastNotificationTime < Infinity` sea **siempre**
verdadero: si algún día se agrega «una sola vez» al selector de frecuencia, no avisaría nunca. Hoy
no está en la interfaz (`src/options.html` ofrece sin límite / 1 / 5 / 15 / 30 / 60 min). Si se
agrega, hay que implementarla con una marca persistida, no con `Infinity`.

## Corrección de un diagnóstico propio

En la primera corrida la alarma `updateDataAlarm` no existía al entrar al service worker, y lo
atribuí a un defecto. Verificado en un perfil limpio **sin CDP** (Chromium solo, con
`Extension State/000003.log`), la alarma **sí** existe: era una carrera de la prueba, que miraba
antes de que terminara la cadena asíncrona del arranque. La prueba ahora espera 2,5 s y vuelve a
mirar. No era un defecto del producto.

## Qué NO queda cubierto

- **El dibujo del aviso en el sistema operativo.** Está probado que Chrome lo acepta (devuelve id);
  que Windows lo muestre en pantalla es del sistema, no del código.
- **El camino con datos reales de red.** Los casos usan oportunidades controladas: se prueba la
  compuerta y el envío, no la obtención de precios (eso lo cubren `apiClient.test.js` y el e2e live).
- **Nightly/CI en vivo.** La prueba en vivo necesita navegador y no corre en CI; la de la compuerta sí.
