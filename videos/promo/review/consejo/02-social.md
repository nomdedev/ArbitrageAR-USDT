# 02 — Consejo de redes: retención y rendimiento en plataformas

**Rol:** editor de video y especialista en formato corto (YouTube, LinkedIn, Reels, Shorts, TikTok), con foco en retención y en consumo sin sonido.

**Qué medí yo, y con qué.** No puedo ver imágenes; mi evidencia visual son el dossier (`review/DOSSIER-VIDEO.md`) y el análisis medido (`review/ANALISIS-VISUAL-MEDIDO.md`). Pero sí medí el MP4 con ffmpeg. Todo lo que sigue con cifra propia sale de estas cinco mediciones sobre `output/arbitrars-promo-1920x1080.mp4`:

| Medición | Cómo |
|---|---|
| Movimiento por fotograma | `tblend=all_mode=difference` + `signalstats` → YAVG de la diferencia, 818 fotogramas a 30 fps |
| Luminancia por fotograma | `signalstats` YAVG, cuadro completo |
| Vacío de la **banda de escena** | recorte `crop=1920:820:0:108` (y=108..928, la franja que midió el dossier) y YAVG por fotograma |
| Transiciones | `select='gt(scene,T)'` con T de 0,001 a 0,5 |
| Audio | `volumedetect` por ventana, `ebur128` (I, LRA, true peak), `silencedetect` |

Dos correcciones a los datos que ya teníamos:

- **No son 4 huecos negros: son 7.** Con umbral en el valor de fondo puro de la banda de escena (YAVG 26,44) aparecen huecos vacíos en *todas* las fronteras de escena — 3,53 / 8,23 / 13,33 / 17,43 / 20,93 / 24,43 — **más uno en t=0**. Suman 1,63 s. El más largo es el de 20,93 s (0,47 s, 14 fotogramas), como ya decía el dossier. Coinciden exactamente con los tiempos de corte detectados por `select` (3,533 / 8,233 / 13,333 / 17,433 / 20,933 / 24,433): el video no tiene cortes, tiene relevos suaves y un agujero en cada relevo.
- **Medido en movimiento, el problema es mucho más grande de lo que sugería la densidad.** Lo veremos en el punto 1.

---

## 1. Juicio del video actual, desde retención y plataforma

### 1.1 El diagnóstico en una frase

No es un video corto. Es una presentación de diapositivas con locución: siete láminas que entran, se quedan quietas, se apagan y dan paso a la siguiente. Está bien construida como pieza editorial, y **fracasa como pieza de feed porque el feed se gana o se pierde en movimiento, y este video está quieto más de la mitad del tiempo.**

### 1.2 El hallazgo que ordena todo lo demás: 57,6 % del video está muerto

Medí el cambio de píxeles entre fotogramas consecutivos. Un fotograma por debajo de 0,05 de diferencia media es, a efectos prácticos, un fotograma congelado.

| Escena | Duración | Congelado | Vacío (negro) | **Muerto** |
|---|---|---|---|---|
| 1 HOOK | 3,52 s | 2,27 s | 0,07 s | **66,7 %** |
| 2 PROBLEMA | 4,71 s | 3,07 s | 0,07 s | **66,7 %** |
| 3 COBERTURA | 5,10 s | 1,50 s | 0,07 s | **30,7 %** |
| 4 RUTAS | 4,09 s | 2,30 s | 0,07 s | **57,7 %** |
| 5 SIMULADOR | 3,50 s | 2,00 s | 0,07 s | **59,0 %** |
| 6 ALERTAS | 3,49 s | 2,20 s | 0,27 s | **70,5 %** |
| 7 CIERRE | 2,86 s | 1,70 s | 0,07 s | **61,6 %** |
| **Total** | **27,27 s** | **15,03 s** | **0,67 s** | **57,6 %** |

Y hay **nueve tramos de 0,5 s o más en los que literalmente no cambia un píxel** (8,43 s, 30,9 % del video):

```
 2,47 →  3,50 s   1,03 s       16,67 → 17,40 s   0,73 s
 5,03 →  5,83 s   0,80 s       19,83 → 20,90 s   1,07 s
 6,70 →  8,20 s   1,50 s       23,37 → 24,40 s   1,03 s
12,30 → 13,30 s   1,00 s       26,50 → 27,27 s   0,77 s  (final)
```

La estructura de cada escena es siempre la misma: **ráfaga de entrada (~0,5 s) → quietud total (0,7 a 1,5 s) → negro (0,2 a 0,5 s) → ráfaga de la escena siguiente.** El video respira al revés: hace el esfuerzo al principio de cada lámina y después se muere.

**Por qué es fatal en plataforma.** El scroll no lo decide el contenido, lo decide la pregunta "¿está pasando algo?". En un teléfono, un cuadro de solo tipografía sobre fondo plano, sin un solo píxel que se mueva, es indistinguible de un video pausado o trabado. El único tramo que se salva es la escena 3 (30,7 % de muerte) — y es, casualmente, la que el dossier describe como "la más equilibrada". La correlación es total.

### 1.3 El video no tiene un solo corte

`select='gt(scene,0.05)'` encuentra **4 eventos en 27,3 s**. Bajando a 0,01, seis. Un corte real entre planos análogos puntúa 0,3–0,6. **Ninguna transición de este video llega a 0,1.** Es decir: siete escenas y ni un solo corte duro.

El corte duro es la herramienta número uno de retención en formato corto: reinicia la atención y promete información nueva sin costo. Este video la desaprovecha seis veces, y cada vez que la desaprovecha deja además un agujero negro de 0,2–0,5 s en el medio del relevo. En pantalla chica eso no se lee como pausa deliberada: se lee como un video que se cortó.

### 1.4 El arranque es lo más flojo, y el arranque es todo

- **El fotograma 0 está vacío.** Los primeros 4 fotogramas (0,00–0,13 s) tienen la banda de escena en el valor de fondo puro. El fotograma 0 es además **el más oscuro de los 818** (YAVG 26,70 contra una mediana de 31,42). El póster del video —lo que ve alguien antes de decidir si sigue— es un rectángulo gris con la marca arriba y una URL abajo.
- **El gancho es una premisa, no una promesa.** "El dólar oficial y el USDT no valen lo mismo" describe el mundo. No le dice nada al que mira sobre él. El observador del producto (argentino, con cuenta en banco y en exchanges) ya sabe que hay brecha; lo que no sabe es qué hace esta extensión y por qué le conviene. El video tarda **7,9 segundos** en contestarlo.
- **Y justo ahí hay un pozo.** La frase clave termina en "mismo", a 2,38 s. Después: **1,23 s sin una sola palabra**, un cuadro congelado de 2,47 a 3,50 s, 0,13 s de negro, y recién a 3,61 s vuelve la voz. Son **1,45 s de nada** en el momento exacto en que se decide el scroll. Es el peor lugar del video para tener el peor momento del video.
- Las dos escenas que tienen que enganchar son las dos más quietas: hook y problema, 66,7 % de muerte cada una.

### 1.5 El 93 % de cuadro vacío no es un problema de estilo: es un problema de formato

El análisis medido dice que el video es más vacío que la mayoría de las presentaciones de primer nivel, y que la referencia Apple pide un objeto heroico que acá no existe. Agrego la causa mecánica, que es más importante:

**La UI del producto es vertical, y el video la mete en un marco horizontal.** Las cuatro capturas del popup miden **428×599** (ratio 1:1,40 — según el inventario del propio proyecto, `capture/extracted/asset-descriptions.md`, que es la fuente de la que salieron). Medido sobre la composición:

| | Ancho del popup | % del ancho del cuadro | Área del cuadro |
|---|---|---|---|
| Hoy, dentro de la banda de escena (642 px de alto) | 424 px | **22 %** | 12 % |
| Máximo posible llenando los 1080 px de alto, en 16:9 | 771 px | 40 % | 40 % |
| En un lienzo 9:16 (1080 de ancho) llenando el ancho | 1080 px | **100 %** | **79 %** |

En un cuadro de 16:9, la UI retrato del producto **nunca puede pasar del 24 % del ancho** sin romper el diseño de bandas (y del 40 % si dejamos que sangre las hairlines). El "93 % de cuadro vacío" no es una decisión estética: es el resultado geométrico de poner el único material fotográfico del producto, que es vertical, dentro de un marco que es horizontal. En 9:16 el mismo asset ocupa el 79 % del área. **Ese solo cambio resuelve el hallazgo 2 del análisis medido, sin agregar un gramo de decoración.**

### 1.6 En un teléfono, el master horizontal se ve así

Un teléfono de gama alta tiene ~390 pt de ancho lógico. En un feed vertical, un video de 16:9 se muestra a ancho completo y **ocupa el 26 % de la altura de la pantalla** (219 pt de ~844). Todo el contenido se escala ×0,2031. Con los tamaños declarados en `tools/build_index.py`:

| Elemento | px en el master | En el teléfono (horizontal) | En 9:16 relaid out (×0,361) |
|---|---|---|---|
| Caption de la voz (`.caps-in`) | 42 | **8,5 pt** | 15,2 pt |
| Titular de escena 2 (`.s2-title`) | 62 | 12,6 pt | 22,4 pt |
| Titulares de 4/5/6 | 58–64 | 11,8–13,0 pt | 20,9–23,1 pt |
| Número `49` (`.big-num`) | 176 | 35,7 pt | 63,6 pt |
| Chips del muro (`.s2-chip`) | 19 | **3,9 pt** | 6,9 pt |
| Descripción de los 4 pasos (`.step span`) | 18 | **3,7 pt** | 6,5 pt |
| Nota al pie esc. 2 (`.s2-note`) | 15 | **3,0 pt** | 5,4 pt |
| Chips CriptoYA/Bancos/Spot (`.chip`) | 15 | **3,0 pt** | 5,4 pt |
| Línea cyan esc. 1 (`.s1-sub`) | 15 | **3,0 pt** | 5,4 pt |
| Etiquetas del simulador (`.field label`) | 13 | **2,6 pt** | 4,7 pt |
| Pie: repo/versión (`.foot`) | 13 | **2,6 pt** | 4,7 pt |
| Marca, sub-línea (`#brand i`) | 12,5 | **2,5 pt** | 4,5 pt |

Piso de lectura cómoda a un brazo de distancia: ~11 pt; para una caption que se lee mientras se scrollea, 14 pt para arriba. **Todo el cromo de datos del video —nota, chips, descripciones de los pasos, etiquetas, pie— cae por debajo de 4 pt. Y la caption, que es el canal que carga el mensaje para quien mira sin sonido, queda en 8,5 pt: por debajo del piso.**

Dicho al revés: **el video está diseñado para leerse en un monitor de 27 pulgadas y se va a publicar en un teléfono.** Los planos de producto, medidos: el popup aparece a **86 pt de ancho** en un feed vertical. Es una estampilla.

### 1.7 Sonido: el video suena 3,5 LU más bajo que todo lo que lo rodea

| Medición | Valor | Objetivo de plataforma |
|---|---|---|
| Loudness integrado | **−17,5 LUFS** | ≈ −14 LUFS |
| True peak | **−4,1 dBFS** | −1 dBTP |
| Rango (LRA) | 3,8 LU | — |
| Música en los huecos **dentro** de escena | **−42,1 a −45,7 dB** (media) | audible |
| Picos en las fronteras de escena | −4,2 a −6,7 dB | — |
| Último segundo | media −45,1 dB, pico −23,6 dB | tag sonoro |

Las plataformas **solo bajan** el volumen, nunca suben. Un master a −17,5 LUFS se reproduce 3,5 LU por debajo del resto del feed: en un teléfono, eso se percibe como "más chico, más lejos, menos importante". Hay además 3,1 dB de pico sin usar.

Y el lecho musical, que debería ser lo que mantiene la sensación de continuidad cuando la voz calla, está a −42/−45 dB: **es inaudible**. Lo único que se oye en los silencios son los golpes de transición a −5 dB. El resultado sonoro es: voz → silencio → golpe → silencio → voz, seis veces. El rango dinámico es de 3,8 LU —plano— pero la *presencia* de la música es cero.

El último segundo es **silencio** (media −45 dB) sobre un logo congelado de 0,77 s. El video tiene 42 % de su duración sin voz y no tiene nada que ocupe ese espacio.

### 1.8 Lo que sí funciona, y conviene no romper

- **La escena 1 sin audio se entiende.** `OFICIAL` + `≠` + `USDT` es un golpe visual que no depende de la locución. Es el mejor activo del video.
- **El muro de los 49 exchanges** es la mejor idea: comunica la escala del problema sin decirla. Está desaprovechado (19 px, gris sobre negro, llega como textura) pero la idea es correcta.
- **Los 4 pasos numerados** de la escena 4 son el momento más "producto" del video y el más útil: convierten un número en una operación.
- **Todo lo que dice el guion es verificable.** No hay una sola promesa de ganancia. Eso, en un vertical de finanzas, es un activo: da margen para ser agresivo en la forma sin mentir en el contenido. Pero ver 1.9.

### 1.9 Las capturas dicen lo que la voz se cuida de no decir

El guion no afirma ninguna ganancia. Los píxeles sí: las capturas muestran `+0,70 %`, `+0,45 %`, `+0,38 %`, `RESULTADO: +$13.946,63 ARS` y una matriz de escenarios de `−49,99 %` a `+39,49 %`. Es decir, el video pone en primer plano los números sobre los que hay hallazgos abiertos (F-01, F-02, P-03).

Para mi área esto no es solo un problema de honestidad: **es un problema de plataforma.** Un creativo que muestra un resultado en pesos y un porcentaje de rentabilidad entra en la categoría de "promesa financiera", que es la que TikTok, Instagram y YouTube moderan con más agresividad, la que más reportes recibe, y la que en LATAM se asocia inmediatamente con estafa. Un video así se distribuye peor. La solución editorial y la honesta son la misma (ver cambio 6).

### 1.10 Estructura: es un tour de cuatro features, no una historia

Cobertura → rutas → simulador → alertas, una por lámina. Son 27 s repartidos en cuatro ideas, lo que da 6 s por idea: poco para que una se recuerde, suficiente para que ninguna lo haga. El formato corto premia **una** promesa con pruebas, no un índice de funcionalidades. El propio video lo demuestra: su mejor momento (los 4 pasos) es el único en el que una idea se desarrolla en vez de presentarse.

---

## 2. Qué cambiaría, priorizado

Ordenado por impacto sobre lo único que importa en esta pieza: que no la scrolleen y que se entienda sin sonido en pantalla chica. **Los cambios 1, 2, 5 y 8 aplican igual al horizontal y al vertical; el 3, 4, 6 y 7 son específicos del vertical.**

### Cambio 1 — Matar la imagen congelada: ningún plano quieto más de 0,4 s

**Qué hacer.** Dos reglas, ambas baratas de implementar en GSAP:

1. **Cámara global en todos los planos.** Cada escena lleva un `scale` de 1,00 → 1,035 a lo largo de sus 2 a 3 s, con `ease:"none"` y desplazamiento de 8 a 12 px en `y`. Es una línea por escena. Con eso, un plano "quieto" deja de estar quieto: el cuadro entero respira y el ojo detecta vida.
2. **Un elemento que nunca deja de moverse por plano.** Un chip del muro que se enciende en azul cada 250 ms y rota; el reloj `00:30` del refresco corriendo y volviendo a empezar; la línea de barrido azul recirculando sobre la captura cada 3 s; un contador que titila ±0,1.

**Por qué.** Es el hallazgo 1: 57,6 % muerto, nueve tramos sin un solo píxel de cambio, uno de 1,5 s. Ninguna otra mejora rinde tanto en retención como eliminar esto.

**Cómo queda.** El video pasa de "siete láminas que se apagan" a un plano continuo con vida; el push lento además le da la profundidad que hoy no tiene (el análisis medido dice que la baja densidad no está sostenida por nada: esto la sostiene sin agregar contenido).

**Cuidado:** una sola cosa moviéndose con jerarquía por plano. Si todo se mueve a la vez, no se mueve nada y el resultado es ruido.

### Cambio 2 — Cortar, no transicionar: 16 cortes duros y cero negros

**Qué hacer.** Sustituir los seis relevos suaves por **cortes duros**. Cortar en cada frontera de frase de la voz y, dentro de los planos de más de 2,5 s, un corte interno cuando la idea cambia. Total: ~16 cortes en 27 s (uno cada 1,7 s de promedio). Poner el acento visual —un destello de 3 fotogramas (100 ms) del **azul de marca sobre el elemento que se está nombrando**— en el golpe, en lugar del agujero negro. Y **el último corte vuelve al cuadro del segundo 0**, para que el video cierre en loop sin costura.

**Por qué.** Medido: cero cortes duros, seis eventos por debajo de 0,1 de score, y 1,63 s de vacío repartidos en siete agujeros, uno en cada frontera más el de t=0. El corte es la herramienta más eficiente de retención que existe y acá está sin usar. El destello azul reemplaza al negro con información de marca.

**Cómo queda.** El ritmo pasa de "entra, se queda, se apaga" a "corta y sigue". Y el loop le da a Reels/TikTok una segunda vuelta gratis: las repeticiones cuentan como tiempo de visualización.

**Cómo se implementa sin romper nada:** el negro aparece porque el clip saliente se oculta en su límite y el elemento entrante recién arranca ~0,2 s después. La solución no es cambiar el diseño: es **solapar** el clip entrante con el saliente (que el primer elemento de la escena nueva ya esté en el DOM con opacidad 1 en el fotograma del corte) y animar sólo su posición o escala. El relevo deja de tener agujero y el diseño no cambia.

### Cambio 3 — Vertical 9:16 como master principal, con layout real y zona segura

**Qué hacer.**
- **El master pasa a ser 1080×1920.** El horizontal 1920×1080 se conserva, pero como derivado para LinkedIn, YouTube y el README — no como el original.
- **Relayout, no recorte.** Zona de lectura dentro de **x 100→940** y **y 250→1400** (el bloque central que queda libre de la UI de las tres apps; TikTok es la más agresiva con 480 a 660 px abajo y crece si la caption publicada es larga, así que tratar el borde inferior como mínimo, no como objetivo). Fondo y movimiento pueden llenar todo el cuadro; **lo que hay que leer no sale de esa caja.**
- **La caption sube.** Hoy está a `bottom: 118px`; en un lienzo de 1920 eso es y=1802, debajo de la UI de TikTok, Reels y Shorts. Tiene que ir sobre y≈1300 (≈600 px más arriba). Lo mismo el pie de repo/versión y la marca: **en vertical, todo el cromo fijo se reubica dentro de la zona segura.**
- Anclar el gancho en la banda central **1080×1350**, porque el feed de Reels muestra un recorte 4:5 de los 9:16 y se come los ~285 px de arriba y de abajo.

**Por qué.** Tres razones medidas, en orden de peso:
1. Es la única forma de mostrar el producto. La UI es retrato (428×599): en 9:16 pasa del 22 % al 100 % del ancho del cuadro, y del 12 % al 79 % del área. **Eso solo resuelve el "93 % de cuadro vacío".**
2. Ocupación de pantalla: 82 % en vertical contra 26 % en horizontal.
3. Legibilidad: todo escala ×1,78. La caption pasa de 8,5 pt a 15,2 pt.
Y la razón de producto: el pedido es reels. Un 16:9 publicado como Reel se ve pillarboxeado en el medio de la pantalla, con la mitad del alto en barras negras.

**Aviso de implementabilidad, importante.** `tools/build_index.py` tiene `--vertical`, pero **hoy sólo cambia el lienzo y el nombre del archivo**: `W, H = (1080, 1920) if VERTICAL else (1920, 1080)` y nada más. `VERTICAL` aparece en tres líneas del archivo (24, 25, 26) y ninguna toca tipografía, posiciones, el marco del teléfono (424×594), la banda de caption ni las hairlines. **Correr `--vertical` hoy produce un lienzo 1080×1920 con un layout de 1920 px adentro: contenido recortado a la derecha y un vacío enorme abajo.** No está "a medio implementar": está sin implementar. Dos cosas: (a) hasta que exista el layout real, **que el flag falle con un error explícito** en vez de generar algo publicable; (b) el vertical es un segundo pase de layout, no un parámetro.

*(Nota honesta: en un feed vertical, un video horizontal no sufre superposición de UI porque queda letterboxeado en el medio. El vertical es mucho más grande, pero obliga a respetar la zona segura. El 9:16 no es gratis.)*

### Cambio 4 — Piso tipográfico de 40 px y máximo 7 palabras por bloque

**Qué hacer.** En el lienzo 1080×1920, **nada que haya que leer baja de 40 px.** Un piso de 11 pt en un teléfono de 390 pt equivale a 40 px sobre 1080 de ancho (40 × 0,361 = 14,4 pt; 30 px daría 10,8 pt, justo en el límite). Captions a **52 px** (18,8 pt). Y máximo **7 palabras por bloque de texto**: hoy hay notas mono de una línea entera, descripciones de pasos y tres chips apilados.

**Por qué.** Es la tabla de 1.6: el cromo de datos entero —nota del problema, chips, descripciones de los 4 pasos, etiquetas del simulador, pie, sub-marca— cae por debajo de 4 pt. En pantalla chica es una mancha gris. **El video tiene mucho texto y casi todo es ilegible donde se va a ver.**

**Cómo queda.** La regla práctica es que todo lo que hoy está por debajo de 40 px o sube de tamaño o **se convierte en imagen**: la descripción de cada paso pasa a ser el paso y nada más (`01 COMPRAR OFICIAL`, 56 px, mono), la nota al pie del problema se convierte en un número grande, y los tres chips se vuelven tres palabras grandes en vez de tres píldoras de 15 px. Se pierde densidad y se gana que algo entre.

### Cambio 5 — El muro de 49 deja de ser fondo y pasa a ser el plano héroe

**Qué hacer.** El muro es 7×7. Un cuadro 9:16 tiene, dentro de la zona de lectura (840 px de ancho), **exactamente la proporción para una grilla de 7 columnas de ~118 px** con chips a 44 px mono. Ocupa el centro del cuadro, se lee de verdad, y en la escena del problema **llena el cuadro entero**: la escala del problema deja de explicarse y pasa a verse. Un chip se enciende en azul y rota cada 250 ms (esto a la vez cumple el cambio 1).

**Por qué.** Es la mejor idea del video y hoy está a 19 px en gris sobre negro: llega como textura, no como dato. Y es la idea que **mejor aprovecha el formato vertical**, porque 49 casillas en 7×7 es una grilla que en un cuadro retrato se ve entera y jerárquica.

**Cómo queda.** El concepto del video queda en una sola imagen que se entiende sin audio y sin leer una palabra: *cuarenta y nueve*. Ese es el frame que hay que usar de póster y de miniatura.

### Cambio 6 — Las capturas raster se reemplazan por planos de UI dibujados en HTML

**Qué hacer.** Sustituir el `<img>` del popup por **paneles de UI dibujados en HTML** dentro de la composición: la lista de exchanges con sus precios (compra/venta), la tarjeta de la alerta, los campos del simulador, el marco del popup. **Sin cifras de rentabilidad ni de resultado.**

**Por qué, tres razones que apuntan al mismo lugar.**

1. **Legibilidad.** La captura de 428 px se está mostrando a 86 pt de ancho en un teléfono. Dibujada en HTML se muestra al tamaño que yo decido, con el piso de 40 px del cambio 4. Y se termina el problema de la ampliación: escalar un raster de 428 px a 1000 px es ampliar ×2,34 texto sobre fondo plano, que es el peor caso para nitidez.
2. **Honestidad.** Las capturas muestran `+0,70 %`, `+0,45 %`, `+0,38 %`, `+$13.946,63 ARS` y la matriz de `−49,99 %` a `+39,49 %`: exactamente los números bajo auditoría (F-01, F-02, P-03). Un panel dibujado en HTML puede mostrar la **forma** de la interfaz —las filas, los pasos, los campos— sin exponer una cifra que el código todavía no sostiene. El guion ya se cuidó; esto alinea los píxeles con el guion.
3. **Distribución.** Sin un resultado en pesos ni un porcentaje de rentabilidad en pantalla, el creativo sale de la categoría de "promesa financiera", que es la que más reportes y más fricción de moderación recibe.

**Y no requiere ninguna capacidad nueva:** la composición **ya dibuja en HTML** los 4 pasos, los 4 campos del simulador y la tarjeta de notificación. Lo único que falta es la lista de exchanges y el marco del popup. Es la misma técnica que ya está usada tres veces en el archivo.

**Alternativa si se quiere conservar la captura real** (es un asset auténtico y eso vale): re-capturar el popup a `deviceScaleFactor: 3` para obtener 1284×1797 y mostrarlo a 1000 px sin ampliar. El repo ya tiene Playwright con configuración de extensión (`playwright.extension.config.js`), así que técnicamente está a mano — pero **choca con la regla de producción vigente de no ejecutar ni modificar la extensión durante la producción**, así que hay que decidirlo antes (ver punto 6). Y en cualquier caso, la captura real no resuelve el problema 2 ni el 3: seguiría mostrando los números cuestionados. Mi recomendación es el panel dibujado para los planos explicativos y, si se quiere el asset auténtico, usarlo **una sola vez** y como textura (desenfocado, en movimiento, sin cifras legibles), no como el plano donde se lee el producto.

### Cambio 7 — De tour de cuatro features a una promesa con tres pruebas

**Qué hacer.** Un solo mensaje rector para los 27 s —*"la brecha entre el dólar oficial y el USDT, medida sobre 49 exchanges, en tiempo real"*— y las otras capacidades como **pruebas**, no como temas:

| Hoy | Propuesta |
|---|---|
| Escena 3: cobertura (tema) | La prueba de escala: 49 exchanges, cada 30 s |
| Escena 4: rutas (tema) | La prueba de utilidad: la guía de 4 pasos |
| Escena 5: simulador (tema) | La prueba de prudencia: probá antes de operar |
| Escena 6: alertas (tema) | La prueba de que no hay que mirar: te avisa solo |

**Por qué.** Cuatro ideas en 27 s es 6 s por idea: ninguna se recuerda. Además el video ya tiene un mensaje que funciona y no lo usa de eje: **"49 exchanges"** es el dato más repetible y el más difícil de copiar. Es lo que el espectador tiene que poder decirle a otro.

**Cómo queda.** Se puede mantener la misma estructura de escenas y el mismo tiempo total: cambia el rol de cada escena, no su contenido. Es el cambio más barato de la lista en términos de código y el que más cambia lo que la gente retiene. Y si el objetivo es volumen, esta estructura se parte en **tres piezas de 10–12 s** (brecha / guía / alerta) sin volver a diseñar nada.

### Cambio 8 — Audio: −14 LUFS, el lecho audible, tag de cierre, y sacar el +12 %

**Qué hacer.**
- **Masterizar a −14 LUFS integrados y true peak ≤ −1 dBTP.** Hoy: −17,5 LUFS, TP −4,1 dBFS. Hay 3,5 LU de loudness y 3,1 dB de pico sin usar. Un `loudnorm` de dos pasadas lo resuelve. Ojo: **no** es "subir el volumen" a mano; es normalizar, y el pico pasa a quedar a −1 dB en vez de a −4.
- **El lecho musical tiene que estar.** Hoy, en los huecos dentro de escena, la música está a −42/−45 dB. Tiene que quedar a unos **−28/−30 dB** durante la voz (presente pero debajo) y subir a **−18/−20 dB** en los silencios, con los golpes de transición como acentos, no como lo único audible. Hay que revisar el ducking: el compresor no está devolviendo el nivel cuando la voz calla.
- **Sacar el +12 % de ritmo.** El guion es-AR a +12 % suena a locución publicitaria apremiante, y en un video de dinero eso es exactamente el registro que se lee como estafa. A ritmo natural, las mismas 63 palabras ocupan ~17,7 s de articulación; los ~9,6 s restantes los llena la música y el movimiento, no el congelamiento. **No hace falta acelerar la voz: hace falta dejar de hacer silencios.** Regla: ningún hueco de voz de más de 0,4 s entre frases (hoy hay ocho, de los cuales seis son de ~1,2 s, y suman 8,52 s: 31,2 % del video).
- **Tag de cierre.** El último segundo está a −45 dB (silencio) sobre un logo congelado. Poner un golpe musical corto + una textura grave de dos notas que sea la firma de la marca. Se sintetiza con ffmpeg como la música actual.

**Por qué.** En un feed, la mitad de la decisión de mirar se toma con el oído. Un master 3,5 LU abajo se percibe como un video menos importante. Y un lecho musical inaudible desperdicia el único recurso que hace que 27 s se sientan continuos cuando la voz calla 42 % del tiempo.

**Cómo queda.** Mismo guion, misma música, misma cantidad de palabras: el video deja de sonar lejano y deja de tener seis pozos de silencio.

---

## 3. Qué NO hacer

**No perseguir el vacío de Apple.** El análisis medido ya lo demostró y quiero subrayarlo: el video es **más vacío** que las presentaciones de producto de primer nivel. Lo que Apple tiene en esos cuadros y este video no puede tener es un objeto físico, filmado, con luz dramática, profundidad de campo y diseño sonoro. Acá el "objeto" es **datos**, y los datos no brillan: o se leen, o son una mancha gris sobre negro. **Menos contenido sin agregar peso = rectángulo gris.** El camino no es vaciar más: es mostrar el producto más grande y más nítido (cambios 3, 5 y 6).

**No mostrar cifras de ganancia, ni de resultado, ni de rentabilidad.** Ni rediseñadas en HTML, ni grandes, ni "a modo de ejemplo". Además de la restricción de honestidad, es lo que mete el video en la categoría que las plataformas moderan y que el público castiga. Si algún día el consejo quiere "mostrá la ganancia neta en grande", la condición previa explícita es corregir F-01 y F-02 y volver a medir.

**No usar el audio en tendencia de TikTok debajo de una locución.** Se pelean en el mismo rango de frecuencias y el algoritmo del trend no ayuda a un video con voz propia. Si se quiere música de tendencia, que sea el video sin locución (otra pieza, no esta).

**No usar emojis, flechas rojas, círculos dibujados a mano ni captions tipo "kablam".** El público objetivo de este producto ya opera dólar cripto: castiga el estilo de infomercial. La identidad del proyecto (mono, técnica, azul sobre negro) es un activo, y hay que mantenerla incluso a costa de parecer menos "nativo de TikTok".

**No hacer un descargo legal de 3 s.** Un disclaimer a pantalla completa mata el final de un video de 27 s. Si hay que decir algo, que sea una línea mono de 40 px, integrada al diseño: `PROBÁ ANTES DE OPERAR · DATOS DE APIS PÚBLICAS`.

**No imitar cámara sobre las capturas.** Zooms lentos, parallax falso o "paneos" sobre una captura de 428 px se ven como interpolación y quedan baratos. Si el material no aguanta el tamaño, se redibuja (cambio 6).

**No repetir la misma animación de entrada en todas las escenas.** Hoy hay tres cascadas de chips casi idénticas. El cerebro deja de registrarlas como información y las descarta como relleno. Cada escena necesita un movimiento propio.

**No poner los subtítulos en el tercio inferior del vertical.** Quedan debajo de la UI de las tres plataformas. Es el error técnico más común y el más caro.

**No usar "link en la bio" ni "hacete rico operando dólar".** El CTA honesto y verificable para este producto es: **extensión gratuita, código abierto, `github.com/nomdedev/ArbitrageAR-USDT`**. Y nada más.

**No dejar el logo congelado los últimos 0,77 s en silencio.** Es el peor final posible: el video se muere antes de terminar.

---

## 4. Riesgo de mis recomendaciones — qué se pierde

**Priorizar el vertical le cuesta el horizontal.** LinkedIn muestra 9:16 recortado o letterboxeado en el feed; YouTube "a secas" no es Shorts. Si el master es vertical, LinkedIn queda con una pieza de segunda. Mi recomendación es sostener **dos masters**, pero eso significa **dos pases de layout en `build_index.py`, que van a divergir** — es exactamente el problema que ya se insinúa en el flag `--vertical` a medio hacer. Costo real: mantenimiento duplicado y una fuente de bugs. Si hay que elegir un solo formato, aviso de que elegir vertical resigna LinkedIn, que es donde un mensaje técnico (203 tests, Manifest V3, 0 servidores) tiene más valor.

**"Nada quieto más de 0,4 s" puede volverse agotador y banal.** Movimiento constante a 27 s cansa; y si todo se mueve, nada se destaca. Además puede chocar con las verificaciones de accesibilidad/motion que ya corren (`hyperframes check` valida contraste, 123/123 textos en WCAG AA) y con los 8 warnings de ergonomía que ya existen. Se pierde el aire, que es parte de la identidad *broadside* del proyecto, y hay riesgo de parecerse a cualquier reel fintech. Mitigación: un solo movimiento dominante por plano, y los planos de dato (rutas, pasos) con más aire que el hook.

**El piso de 40 px le cuesta información al video.** Desaparecen la nota de contexto, las descripciones de los 4 pasos y los tres chips. Para un público técnico, parte de la credibilidad del producto estaba ahí (49 exchanges · 2 precios por exchange · comisiones distintas por plataforma). Es una pérdida real. Mitigación: esa densidad se mueve al **texto de la publicación** (la caption de LinkedIn y la descripción de YouTube), donde se puede leer con calma y sin piso de tamaño.

**Sacar las cifras de pantalla le cuesta el gancho más fuerte que existe.** Un número concreto para un argentino que mira el dólar es el mejor detente de scroll que hay en este mercado. Sin número, el video pasa a ser sobre un **mecanismo**, y los mecanismos no detienen el pulgar. Es una pérdida grande y real, no hay vuelta: la cambio por no poder ser acusado de prometer lo que el código no hace todavía. **El día que F-01 y F-02 estén corregidos, el número vuelve y hay que hacer otra vez el video** (recomiendo planificarlo como una v2 de 15 s, muy agresiva, sólo con el número real y la fecha).

**Una sola promesa con tres pruebas le cuesta la cobertura.** Al subordinar "cada 30 segundos" a prueba en vez de tema, se pierde el argumento de frescura, que para este producto es diferencial. Mitigación: el "cada 30 s" tiene que estar igual, como cifra grande dentro de la prueba de escala, no como escena propia.

**El loop sin costura le come tiempo al CTA.** Si el último cuadro corta al primero, la URL y el pedido de instalación tienen menos tiempo para leerse. Es una tensión real entre retención compuesta y conversión. Mitigación: mantener el CTA fijo y visible durante toda la última escena (3 s), no sólo al final.

**Todo esto asume que el render aguanta.** Más capas en movimiento, 16 cortes, paneles de UI dibujados y dos formatos = más riesgo de que algo se desincronice. Hoy el proyecto tiene `hyperframes check` en passed y la sincronización audio→caption verificada por script; **esa verificación hay que ampliarla** para cubrir las dos nuevas condiciones que propongo (agujeros negros y fotogramas congelados), o los mismos errores vuelven en la próxima edición sin que nadie se entere.

---

## 5. Cómo contaría yo este producto en 27 segundos

**Decisiones de diseño de mi versión** (todas verificables contra las restricciones del stack: HTML + GSAP + HyperFrames, sin filmación, sin banco de assets, audio sintetizable):

- **1080×1920.** Zona de lectura **x 100→940 · y 250→1400**. Gancho anclado en la banda central 1080×1350 (recorte 4:5 del feed de Reels).
- **10 planos, corte duro en cada frontera.** Ninguno dura más de 3,2 s; los cinco primeros no pasan de 2,6 s.
- **Piso de 40 px.** Caption a 52 px en y≈1300.
- **Voz a ritmo natural** (sin el +12 %): 61 palabras, ~17 s de articulación. **Ningún hueco de voz mayor a 0,4 s.** Los ~9,5 s sin voz son música presente + imagen en movimiento.
- **Cada plano tiene un push global 1,00→1,035 y un elemento que no deja de moverse.**
- **Ningún corte a negro. Ningún cuadro congelado.**
- **Ninguna cifra de ganancia, de resultado ni de rentabilidad.** Las capturas se redibujan como paneles HTML sin números.
- **El último corte vuelve al cuadro del segundo 0** (loop).

| # | s | Qué se ve | Qué dice la voz | Subtítulo (quemado, palabra por palabra) |
|---|---|---|---|---|
| 1 | 0,00–2,10 | **Cuadro lleno desde el fotograma 1.** El muro de 49 chips ocupa el tercio medio a 44 px mono, legible, con un chip encendiéndose en azul cada 250 ms. Encima, `DÓLAR OFICIAL` (56 px mono, blanco) y `USDT` (56 px mono, gris) separados por un `≠` azul de 190 px que se dibuja en 0,28 s. Push global. | "Dólar oficial. USDT. No valen lo mismo." | Dólar oficial. USDT. No valen lo mismo. |
| 2 | 2,10–4,40 | **Corte.** El muro pasa a primer plano y se lee entero (7×7 dentro de la zona de lectura). Arriba a la derecha, un reloj mono de 44 px: `00:30` que corre y vuelve a empezar. Un chip se enciende y queda. | "Cuarenta y nueve exchanges, cuarenta y nueve precios." | idem |
| 3 | 4,40–7,00 | **Corte.** Los 49 chips colapsan al centro y se apagan en 0,4 s. Queda `49` a 200 px azul que cae y se clava. Texto en pantalla `A MANO NO ESCALA` (44 px mono) a los 4,0 s. El reloj sigue corriendo detrás. | "A mano no se puede: cambia cada treinta segundos." | idem |
| 4 | 7,00–9,60 | **Corte.** El panel de la interfaz del producto (dibujado en HTML, sin cifras de resultado) a 1000 px de ancho, dentro de un marco CSS fino, entrando desde abajo. La línea de barrido azul lo cruza en 1,4 s y vuelve a empezar. Este es el plano "producto": la UI es el sujeto. | "ArbitrARS los mira todos por vos." | idem |
| 5 | 9,60–12,20 | **Corte.** El panel sube a la mitad superior. Abajo entran tres tarjetas de ruta con **sólo la forma** (`COMPRAR EN` / `VENDER EN`), cada una con un hairline azul que crece como barra, sin porcentajes. Texto en pantalla `ORDENADAS POR RENTABILIDAD`. | "Y te ordena las rutas por rentabilidad." | idem |
| 6 | 12,20–14,60 | **Corte.** El panel se corre; entran los 4 pasos en mono de 56 px, `01 COMPRAR OFICIAL` · `02 CONVERTIR A USDT` · `03 VENDER USDT` · `04 RETIRAR`, en cascada rápida de 120 ms. El `04` se enciende en azul. | "Con la guía paso a paso." | idem |
| 7 | 14,60–17,40 | **Corte.** Los 4 pasos se comprimen en una columna a la izquierda; a la derecha, dos campos grandes (`MONTO` en azul con cursor que titila, `COMISIONES`) que se llenan solos dígito por dígito. Sin resultado calculado. | "Simulá tu monto y tus comisiones." | idem |
| 8 | 17,40–20,60 | **Corte.** El teléfono/panel se aleja y entra la tarjeta de notificación real del sistema, a ancho completo de la zona de lectura, deslizando desde la derecha con el ícono de la extensión y el sello `AHORA`. Detrás, dos tarjetas fantasma que **sí** se distinguen (subir la opacidad que hoy las deja en 0,28 y 0,55). Un pulso azul late sobre la tarjeta. | "Te avisa cuando la brecha supera tu umbral." | idem |
| 9 | 20,60–23,60 | **Corte.** El logo entra con escala 0,8→1 y un push lento, a 300 px de ancho. `ArbitrARS` con `ARS` en azul a 116 px. Debajo, tres líneas mono de 40 px: `EN TU NAVEGADOR` · `SIN SERVIDORES` · `CÓDIGO ABIERTO`. | "Todo en tu navegador. Sin servidores." | idem |
| 10 | 23,60–27,30 | **Sin voz.** El logo no se congela: sigue el push y un brillo azul lo recorre. Entra el CTA a 44 px mono azul, `EXTENSIÓN GRATUITA · github.com/nomdedev/ArbitrageAR-USDT`, y se queda visible los 3 s completos. Golpe musical de cierre + tag de dos notas. **En el último fotograma, corte al cuadro del segundo 0.** | — | "Extensión gratuita · código abierto" |

**Contabilidad de la voz:** 7+7+9+6+7+5+6+8+6 = **61 palabras**, en los planos 1 a 9, a ritmo natural (~2,6 palabras/s contando las micro-pausas del habla). Plano 10 sin voz, 3,7 s, musical y con movimiento.

---

## 6. Qué me falta saber para tener certeza

**Bloqueantes reales, por orden de importancia:**

1. **Cómo suena.** Medí loudness, picos y nivel de la música, pero **ningún agente de este consejo puede oír el video**. Si la locución a +12 % suena natural o apremiante, y si la música encaja en el tono, **lo tiene que dictaminar el usuario escuchándolo**. Mi recomendación de bajar el ritmo se apoya en el registro (una voz es-AR acelerada sobre un video de dinero se lee como estafa) y en el hecho medible de que hay 8,52 s de hueco que no necesitan velocidad, no en haberlo oído.
2. **Si el producto se puede volver a capturar.** Mi cambio 6 se puede hacer sin ninguna capacidad nueva (paneles HTML), pero la opción de re-capturar el popup a `deviceScaleFactor: 3` —que daría el asset más nítido y más auténtico— **depende de que se levante la regla de "no ejecutar ni modificar la extensión durante la producción"**. El repo tiene el harness (`playwright.extension.config.js`), así que es una decisión de política, no de capacidad. Necesito la respuesta antes de fijar el tamaño al que se muestra la UI.
3. **Cuál es el objetivo real: instalaciones o alcance.** Si el objetivo son instalaciones, el CTA al repo es correcto pero la pieza debería terminar con el nombre del producto limpio y grande. Si el objetivo es alcance (que la vea mucha gente), conviene la versión de 15 s, sólo con la brecha y el número, y el video largo como pieza secundaria. Hoy no sé cuál de las dos se está persiguiendo y eso cambia el final.
4. **Si el flag `--vertical` se puede romper a propósito.** Mi recomendación es que falle con error explícito hasta que exista el layout real. Si alguien ya lo está usando o lo tiene en un script, hay que coordinarlo.
5. **Qué pasa con LinkedIn.** El dossier pide explícitamente mostrar el producto "como Apple lo muestra" y las recomendaciones de Apple apuntan a presentación de producto, que rinde en LinkedIn y en YouTube. Si LinkedIn es un canal de primera línea para el proyecto, quiero saberlo: mi prioridad vertical lo deja en segundo lugar.

**Cosas que no puedo verificar y que asumo:**

6. **Que el póster del video (fotograma 0) importa tanto como el gancho.** Lo asumo y por eso el cambio 3 abre con el cuadro lleno. En un feed con autoplay, el fotograma 0 decide; si el video se publica en un lugar donde siempre arranca solo, el peso relativo cambia.
7. **Que el público es argentino.** Todo mi análisis de plataforma y de zona segura no cambia, pero el registro de la locución sí: una voz rioplatense sobre gráficos en inglés (`SPOT + P2P`, `MANIFEST V3`, `203 TESTS`) es coherente para un público que ya opera, y ruido para uno que no. Si el video va a audiencia no-técnica, ese cromo tiene que irse.
8. **Los números de zona segura de las plataformas.** Los tomé de material de referencia de 2026 que aclara que son **aproximaciones medidas sobre la UI actual, no constantes publicadas**, y que TikTok estrecha el margen inferior a medida que la caption publicada se hace más larga. La caja que propongo (x 100→940 · y 250→1400) es deliberadamente conservadora. **Hay que confirmarla con una vista previa real en cada app antes de publicar**, porque la UI cambia con las versiones.
9. **Las dimensiones de las capturas (428×599).** Las tomé del inventario del propio proyecto (`capture/extracted/asset-descriptions.md` y `video-brief.md`), que es fuente del proyecto y no medición mía. Es un dato central de mi argumento vertical, así que conviene reconfirmarlo con `ffprobe` antes de dimensionar el layout.

**Una última cosa que no es una duda sino un pedido:** si el consejo decide mantener el horizontal como master, mi crítica 1 (57,6 % de muerte), 2 (cero cortes) y 8 (audio) siguen siendo válidas y son las que más rinden. **Esos tres cambios hay que hacerlos igual, en cualquier formato.** El formato decide cuánto se ve; los cambios 1, 2 y 8 deciden si alguien se queda a verlo.
