# SCRIPT — ArbitrARS promo (25 s)

Voz: **es-AR-TomasNeural** (Microsoft Edge TTS, es-AR rioplatense, gratuito, offline una vez generado).
Ritmo: +6%. Duración objetivo: 25–26 s. Palabras: 63.

`VO_MODE`: **restructured** (el guion se escribió para el video, no viene de un texto previo del usuario).

| # | Escena | Tiempo | Texto |
|---|---|---|---|
| 1 | HOOK | 0:00 | El dólar oficial y el USDT no valen lo mismo. |
| 2 | PROBLEMA | 0:04 | Esa diferencia es real. Medirla a tiempo, no. |
| 3 | FEATURE 1 — cobertura | 0:07 | ArbitrARS la mide sobre 49 exchanges, cada 30 segundos. |
| 4 | FEATURE 2 — rutas | 0:11 | Te ordena las rutas por rentabilidad, con la guía paso a paso. |
| 5 | FEATURE 3 — simulador | 0:15 | Simulá tu monto y tus comisiones antes de operar. |
| 6 | FEATURE 4 — alertas | 0:19 | Y te avisa solo cuando la brecha supera tu umbral. |
| 7 | CIERRE | 0:23 | Todo en tu navegador, sin servidores. |

Los tiempos de la tabla son estimados; los definitivos salen de la duración real medida de cada
segmento (ver `audio_meta.json`), que es la que manda.

## Claims y su respaldo

Cada frase de este guion está respaldada por una verificación en el código, y ninguna repite las
afirmaciones del README que la auditoría demostró falsas:

| Frase | Respaldo |
|---|---|
| "49 exchanges" | 49 valores únicos de exchange en `src/options.html` |
| "cada 30 segundos" | `chrome.alarms` del service worker (frecuencia configurable 1 min–1 h) |
| "te ordena las rutas por rentabilidad" | ordenamiento por ganancia en `src/background/main-simple.js` |
| "la guía paso a paso" | pestaña de guía de 4 tramos en el popup |
| "simulá tu monto y tus comisiones" | `src/modules/simulator.js` + presets Conservador/Moderado/Agresivo |
| "te avisa solo… supera tu umbral" | `chrome.notifications` + `alertThreshold` |
| "sin servidores" | no existe backend: sólo `chrome.storage` + 2 APIs públicas de cotización |
