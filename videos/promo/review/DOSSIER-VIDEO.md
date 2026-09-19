# DOSSIER PARA EL CONSEJO — video promocional de ArbitrARS

Este documento es el contexto común del consejo. Todo lo que dice acá está verificado:
los tiempos salen de los eventos de la síntesis de voz, y las descripciones visuales de
una inspección real de los fotogramas renderizados.

---

## 1. Qué es el producto (hechos, no marketing)

**ArbitrARS — Detector de Arbitraje**. Extensión para navegadores Chromium (Manifest V3,
JavaScript sin frameworks, sin backend).

- Compara, en tiempo real, el **Dólar Oficial** argentino con el precio del **USDT** (el
  dólar cripto) en **49 exchanges** locales, más los **bancos** que publican cotización.
- Ordena las **rutas de arbitraje** (dónde comprar, dónde vender) por rentabilidad y
  explica cada ruta en **4 pasos** operables.
- Tiene un **simulador** para cargar monto y comisiones antes de operar.
- **Notifica** cuando la brecha supera el umbral que el usuario configura.
- Todo corre local: no hay servidores, no hay cuentas, no se cargan datos personales.
- Datos de dos APIs públicas y gratuitas (CriptoYA y DolarAPI).
- Repositorio: https://github.com/nomdedev/ArbitrageAR-USDT

El usuario del producto es una persona en Argentina que quiere capturar la diferencia
entre el dólar oficial y el USDT, y necesita saber **cuánto le queda** después de
comisiones y **cómo** hacer la operación, sin calcularlo a mano.

---

## 2. El video actual

| Dato | Valor |
|---|---|
| Archivo | `videos/promo/output/arbitrars-promo-1920x1080.mp4` |
| Duración | **27,300 s** exactos |
| Formato | 1920×1080 horizontal · 30 fps · H.264 · AAC 48 kHz estéreo |
| Peso | 5,4 MB (1,66 Mbps) |
| Voz | es-AR-TomasNeural (español rioplatense, TTS) — 63 palabras, +12% de ritmo |
| Música | lecho sintetizado (menor con novena), duckeado −5,7 dB bajo la voz |
| Captions | cinéticas, sincronizadas palabra por palabra (63 palabras) |
| Render | HyperFrames (HTML + GSAP) · 819 fotogramas · 34,9 s de render |

### Estructura real, escena por escena

| # | Entrada (s) | Duración | Voz | Qué se ve |
|---|---|---|---|---|
| 1 | 0,00 | 3,52 | "El dólar oficial y el USDT no valen lo mismo." | Dos palabras gigantes `OFICIAL` y `USDT` separadas por un `≠` azul dibujado en SVG; entran desde los costados; debajo una línea monoespaciada en cyan: "LA BRECHA ENTRE LOS DOS PRECIOS ES LA OPORTUNIDAD". |
| 2 | 3,52 | 4,71 | "Esa diferencia es real. Medirla a tiempo, no." | Titular "Medirla a mano **no escala**"; un `49` de 128 px en azul arriba a la derecha; debajo, un muro de **49 casillas** con los nombres reales de los exchanges (binance, buenbit, lemoncash, ripio, fiwind…) entrando en cascada; al pie, una nota mono con las tres variables del problema. |
| 3 | 8,23 | 5,10 | "ArbitrARS la mide sobre 49 exchanges, cada 30 segundos." | A la izquierda, un marco de teléfono con la **captura real** del popup de la extensión (tabla de bancos con compra/venta) y una línea azul que lo barre; a la derecha, `49` de 176 px, "exchanges, **cada 30 segundos**" y tres chips (CRIPTOYA · USDT/ARS, BANCOS · DÓLAR OFICIAL, SPOT + P2P). |
| 4 | 13,33 | 4,09 | "Te ordena las rutas por rentabilidad, con la guía paso a paso." | Marco con la captura del popup principal + los **4 pasos** de la guía (01 Comprar dólar oficial · 02 Convertir a USDT · 03 Vender los USDT · 04 Retirar la ganancia), cada uno con su hairline y su descripción, en cascada. |
| 5 | 17,42 | 3,50 | "Simulá tu monto y tus comisiones antes de operar." | Marco con la captura del simulador + cuatro campos (MONTO A INVERTIR destacado en azul con cursor que titila, y las tres comisiones). |
| 6 | 20,92 | 3,49 | "Y te avisa solo cuando la brecha supera tu umbral." | Titular "Te avisa solo, **cuando supera tu umbral**" + tres chips + una pila de notificaciones: dos tarjetas fantasma detrás y la tarjeta principal "Brecha detectada / Una ruta supera el umbral que configuraste" con el ícono de la extensión y el sello `AHORA`, entrando desde la derecha. |
| 7 | 24,41 | 2,89 | "Todo en tu navegador, sin servidores." | El símbolo de marca (`$` fusionado con gráfico de barras y línea de tendencia) entra con escala; wordmark `ArbitrARS` con "ARS" en azul; línea de stack "MANIFEST V3 · 49 EXCHANGES · 203 TESTS · 0 SERVIDORES"; URL del repo en azul. |

### Lenguaje visual

- Fondo `#09090b` (casi negro) con una grilla técnica azul al 5,5% y dos hairlines
  horizontales (arriba y abajo) que encuadran todo el cuadro.
- **Barlow** (display, hasta 900 de peso) para titulares y números; **IBM Plex Mono** para
  todo el cromo de datos (etiquetas, pie, chips). Ambas locales, licencia OFL.
- Azul de marca `#3b82f6` como único color de acento; cyan `#56d4dd` para etiquetas de
  sección; texto `#f0f6fc`.
- Marca fija arriba a la izquierda (`ArbitrARS · Detector de Arbitraje`) y pie fijo con
  repo, versión y cantidad de tests.
- Los clips son **contiguos**: no hay cortes a negro entre escenas; el pasaje es un relevo.
- Origen del estilo: preset editorial *broadside* del framework, remapeado a los colores
  de marca del proyecto. No se diseñó desde cero: se heredó una estética de "revista
  técnica densa".

### Restricción de honestidad (importante para el consejo)

La extensión está bajo auditoría: hay dos hallazgos abiertos que muestran que **hoy el
cálculo de ganancia descarta la comisión de venta** (F-01) y que **las comisiones vienen
desactivadas por defecto** (F-02). Por eso el guion **no dice en ningún momento cuánto se
gana** ni muestra una cifra de rentabilidad, y la escena del simulador muestra sólo el
lado *entrada* (monto y comisiones).

**Un consejo que proponga "mostrá la ganancia neta en grande" contradice el estado real
del producto.** Si el consejo considera que ese es el camino, la propuesta tiene que
venir con la condición explícita: primero corregir F-01/F-02.

Además, las capturas del producto que aparecen son reales y muestran la interfaz tal como
la dibuja la extensión hoy (incluido el badge verde de rentabilidad que la auditoría
cuestiona).

---

## 3. Cómo inspeccionar el video

```bash
cd videos/promo

# fotogramas ya extraídos (23, uno cada 1,2 s, a 1280 px de ancho)
ls review/frames/

# extraer más, o a otro ritmo:
ffmpeg -v error -i output/arbitrars-promo-1920x1080.mp4 -vf "fps=2,scale=1280:-1" -y review/frames-detalle/f-%02d.png

# datos técnicos
ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 output/arbitrars-promo-1920x1080.mp4

# ver los niveles de audio
ffmpeg -hide_banner -i output/arbitrars-promo-1920x1080.mp4 -af volumedetect -f null -
```

- Guion con tiempos por escena: `guion-narracion.txt`
- Plan de escena por escena con decisiones: `STORYBOARD.md`
- Análisis del proyecto para el brief: `video-brief.md`
- Referencia de estilo Apple ya extraída por el proyecto:
  `docs/auditoria-2026-09/DESIGN-REFERENCIA-APPLE.md`
- La composición es editable: `index.html` (generado por `tools/build_index.py`).

---

## 4. Qué se le pide al consejo

El usuario quiere un **video mejorado**, y explícitamente pidió que la app se muestre
**como Apple muestra sus productos**. Es decir: no se trata de retocar el video actual,
sino de decidir si su enfoque —muro de datos, densidad, estética de revista técnica— es
el camino, o si hay que ir hacia la presentación de producto: un plano por idea, el
objeto como protagonista, ritmo más lento y seguro, menos texto, más silencio.

Lo que necesito de cada experto:

1. **Juicio sobre el video actual**, con evidencia: qué funciona y qué no, y por qué.
2. **Qué cambiaría concretamente** para acercarlo a una presentación de producto de
   primer nivel, con el orden de importancia.
3. **Precauciones**: qué NO conviene hacer, y qué clichés evitar.
4. **Riesgo de la recomendación**: qué se pierde si se implementa.

Las recomendaciones tienen que ser implementables en este stack (HTML + GSAP +
HyperFrames, sin After Effects, sin filmación real, sin banco de imágenes de pago). Si una
idea requiere algo que el stack no puede, hay que decirlo.
