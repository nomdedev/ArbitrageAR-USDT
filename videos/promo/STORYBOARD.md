---
workflow: product-launch-video
flow: autonomous
format: 1920x1080
duration: 28.3
fps: 30
music: synthesized ambient pad + musical events (ffmpeg) · mezcla a -14 LUFS
narration: es-AR-TomasNeural (+12%)
captions: kinetic, word-synced
---

# STORYBOARD — ArbitrARS promo

> **Nota (Fase 1).** La coreografía descrita abajo fue **reemplazada**. Hoy cada escena entra
> ya compuesta (entradas sólo de transformación, sin `opacity: 0` en el bloque principal), con
> push-in continuo por escena, cámara dentro de la captura y deriva de la grilla. Las
> mediciones de antes y después están en `review/FASE-1-RESULTADOS.md`, y las causas del
> cambio en `review/consejo/00-SINTESIS.md`.

Composición **standalone** (`index.html`), 7 escenas en clips contiguos sobre una raíz
de 28,30 s. Todos los tiempos de abajo son reales: salen de `audio/timeline.json`
(medidos con ffprobe sobre la voz sintetizada) y de `audio/words.json` (eventos
WordBoundary de la síntesis). Ninguno está escrito a mano.

Generada por `tools/build_index.py` — editar ese archivo, no el HTML.

## Video direction

Superficie oscura `#09090b` con una grilla técnica al 5% y dos hairlines (arriba/abajo)
que encuadran todo el video. Tipografía **Barlow** para display y **IBM Plex Mono** para
el cromo de datos (etiquetas, cifras, pie) — la firma *broadside* del preset, remapeada
por `build-frame.mjs` a los colores de marca del proyecto: el acento naranja del preset
pasó a azul de marca `#3b82f6`, el cyan `#56d4dd` quedó para las etiquetas de sección.
Marca fija arriba a la izquierda, pie con repo y versión abajo. Cada escena entra con
sus elementos en cascada y la caption cinética revela palabra por palabra al ritmo de la
voz. Sin cortes negros: los clips son contiguos y las transiciones son relevos dentro de
la misma escena visual.

## Escena 1 — HOOK · 0.00s +3.52s

- **Voz:** "El dólar oficial y el USDT no valen lo mismo." (0.10 → 3.02)
- **Visual:** `OFICIAL` (Barlow 900, 148px) entra desde la izquierda · `≠` dibujado en
  SVG (dos barras claras + barra diagonal azul, rotada -34°) entra con `back.out` desde
  0.55 de escala y -18° · `USDT` en gris entra desde la derecha · la línea guía
  "LA BRECHA ENTRE LOS DOS PRECIOS ES LA OPORTUNIDAD" aparece a 1.05s.
- **Assets:** ninguno (tipografía + SVG propio).
- **Por qué:** el hook tiene que plantar el concepto sin datos de mercado inventados.

## Escena 2 — PROBLEMA · 3.52s +4.71s

- **Voz:** "Esa diferencia es real. Medirla a tiempo, no." (3.62 → 7.83)
- **Visual:** titular "Medirla a mano **no escala**" · badge `49` (Barlow 900, 128px) en
  azul, arriba a la derecha, con la etiqueta `EXCHANGES` · **muro de 49 chips** con los
  nombres reales de los exchanges del proyecto, en grilla de 7 columnas, revelados con
  un stagger de 21 ms (efecto "lluvia de datos") · nota mono al pie con las tres
  variables del problema.
- **Assets:** los 49 nombres vienen de `src/options.html` del proyecto.
- **Por qué:** el problema no se explica, se muestra: 49 casillas es demasiado para
  resolverlo a mano.

## Escena 3 — FEATURE 01 · COBERTURA · 8.23s +5.10s

- **Voz:** "ArbitrARS la mide sobre 49 exchanges, cada 30 segundos." (8.33 → 12.93)
- **Visual:** marco de teléfono (424×594, radio 26, borde hairline, sombra profunda) con
  la **captura real** `popup-exchanges.png` · línea de escaneo azul que barre el marco
  durante 3,1 s · a la derecha: etiqueta de sección, `49` gigante (176px), "exchanges,
  **cada 30 segundos**", y tres chips (CriptoYA · Bancos · Spot + P2P).
- **Assets:** `capture/assets/popup-exchanges.png` (captura real del producto).
- **Por qué:** mostrar el producto real en vez de una recreación.

## Escena 4 — FEATURE 02 · RUTAS · 13.33s +4.09s

- **Voz:** "Te ordena las rutas por rentabilidad, con la guía paso a paso." (13.43 → 17.02)
- **Visual:** marco con `popup-main.png` · titular "Ordenadas por rentabilidad, **con la
  guía adentro**" · los **4 pasos de la guía real** (01 Comprar dólar oficial · 02
  Convertir a USDT · 03 Vender los USDT · 04 Retirar la ganancia), cada uno con su
  hairline superior y su descripción, en stagger de 220 ms.
- **Assets:** `capture/assets/popup-main.png`.
- **Motivo del paso a paso:** es la diferencia entre "un número" y "una operación".

## Escena 5 — FEATURE 03 · SIMULADOR · 17.42s +3.50s

- **Voz:** "Simulá tu monto y tus comisiones antes de operar." (17.52 → 20.52)
- **Visual:** marco con `popup-sim.png` · titular "Tu monto y tus comisiones, **antes de
  operar**" · cuatro campos: monto (destacado en azul, con cursor que titila — 5
  repeticiones finitas, nunca `repeat: -1`) y las tres comisiones.
- **Assets:** `capture/assets/popup-sim.png`.
- **Decisión de honestidad:** se muestra el lado **entrada** del simulador (monto y
  comisiones). No se muestra ninguna ganancia calculada, porque el cálculo está bajo
  auditoría por el hallazgo F-01.

## Escena 6 — FEATURE 04 · ALERTAS · 20.92s +3.49s

- **Voz:** "Y te avisa solo cuando la brecha supera tu umbral." (21.02 → 24.01)
- **Visual:** titular "Te avisa solo, **cuando supera tu umbral**" · tres chips · pila de
  notificaciones: dos tarjetas fantasma detrás (opacidad 0.28 / 0.55 + blur 1.1 / 0.5 px,
  sin texto para no generar colisión tipográfica) y la tarjeta principal "Brecha
  detectada / Una ruta supera el umbral que configuraste." con el ícono de la extensión y
  el sello `AHORA`, entrando desde la derecha con `power3.out`.
- **Assets:** `capture/assets/icon128.png` (ícono real de la extensión).
- **Decisión de honestidad:** el cuerpo de la notificación describe la condición
  ("supera el umbral"), no una ganancia.

## Escena 7 — CIERRE · 24.41s +2.89s

- **Voz:** "Todo en tu navegador, sin servidores." (24.51 → 26.42)
- **Visual:** el símbolo de marca (`$` fusionado con gráfico de barras y línea de
  tendencia) entra con escala 0.8 → 1 · wordmark `ArbitrARS` con "ARS" en azul · línea de
  stack "MANIFEST V3 · 49 EXCHANGES · 203 TESTS · 0 SERVIDORES" · URL del repo en azul,
  que al final vuelve a blanco para dejar el ojo en el logo.
- **Asset:** `capture/assets/logo-mark.png` — recortado al bounding box del símbolo
  (x 448-1600, y 436-1500 del PNG original de 2048²) y con **transparencia real**
  derivada de la luminancia (56% del área transparente, 43% tinta opaca). El texto
  "Arbitrage Trading" del PNG original queda fuera del recorte.

## Captions

Una caption por escena, en la banda inferior (bottom 118px, separada del pie y del
contenido). Cada palabra es un `<span>` con su tiempo real de entrada; el revelado es
`y: 26 → 0` con opacidad en 260 ms, y la palabra se pinta en azul `#3b82f6` mientras se
pronuncia, volviendo a crema `#f0f6fc` 60 ms después de terminar. 63 palabras
sincronizadas en total.

## Verificación

- `npx hyperframes lint` → 0 errores, 8 warnings (advisories de ergonomía de Studio:
  tamaño del archivo y estructura anidada que sugiere sub-composiciones).
- `npx hyperframes check` → **passed**, 0 errores en runtime, layout, motion y
  contraste (123/123 chequeos de texto pasan WCAG AA).
- Sincronización audio→caption verificada por script: sin huecos ni solapes entre clips,
  todas las palabras dentro de su ventana de voz, y ambos audios cubren los 27,30 s.
