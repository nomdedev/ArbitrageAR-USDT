# CONSEJO 03 — Gramática de presentación de producto Apple

**Evaluado:** `videos/promo/output/arbitrars-promo-1920x1080.mp4` (27,300 s · 1920×1080 · 30 fps · 819 fotogramas)
**Rol:** director de marketing de producto, gramática de keynote/film de producto Apple.
**Método:** medición propia del MP4 con ffmpeg/ffprobe (ocupación, bloques de texto simultáneos,
alturas de tipo, movimiento cuadro a cuadro, holds, cortes, LUFS/LRA, silencios) + las capturas
nativas del producto (`capture/assets/`, 4 PNG de ~428×599) + dossier y análisis visual medido.
Todo número de este informe es reproducible sobre el archivo renderizado.

---

## 1. Juicio del video actual contra la gramática de Apple

### 1.1 Veredicto

El video **no falla por feo ni por recargado: falla por gramática.** Está escrito en la
gramática de una revista técnica (7 rótulos, cromo fijo, pie de página, etiquetas de sección,
notas al pie) cuando la consigna pide la gramática de un film de producto (un plano, una idea,
un sujeto). El propio dossier lo admite: el estilo "no se diseñó desde cero: se heredó una
estética de revista técnica densa". Eso es la causa raíz de todo lo demás.

Y tiene un dato llamativo: **el guion ya está más cerca de Apple que la imagen.** La narración
está escrita en segunda persona y orientada a beneficio ("Te ordena las rutas…", "Simulá tu
monto…", "Y te avisa solo cuando…"). La imagen, en cambio, está organizada por características:
chips, etiquetas de sección, cifras duplicadas, hairlines y notas técnicas. **El problema no
es el copy: es que la cámara no existe.** El video no tiene cámara; tiene lienzo.

### 1.2 Auditoría contra los cinco principios que se me piden

| Principio Apple | Estado | Evidencia medida |
|---|---|---|
| **Un plano, una idea** | ✗ Incumplido | Bloques de texto simultáneos por cuadro: **9,4** en el problema (pico **11**), **5,2** en alertas, **4,5** en cobertura y en el cierre, **3,7** en rutas. Apple sostiene 1-2 (título + una línea de apoyo). |
| **El objeto es el protagonista** | ✗ Incumplido | El objeto más grande del film es el marco con la captura real: **424 px de ancho = 22% del ancho** del cuadro (la captura nativa mide 428 px, o sea se muestra ≈1:1). La masa tipográfica más alta de todo el video es **146 px = 13,6% del alto** (el hook). Hay planos donde el **39-41% de las columnas nunca se usa** y queda una franja vertical vacía de **384 px**. |
| **Beneficio antes que característica** | ~ Mitad | El guion sí; las escenas no. El producto recién aparece a los **8,23 s** (30% del metraje), y antes de eso hay 8 s de problema. Además el dato `49` se repite dos veces en 5 s (badge de 128 px en el problema, `49` de 176 px en cobertura). |
| **Restricción tipográfica** | ✗ Incumplido | Rango tipográfico de **8 px a 146 px** (18×) en el mismo plano; Barlow 900 como peso base; **dos acentos** (azul `#3b82f6` + cyan `#56d4dd`); cuatro capas de cromo (marca, etiqueta de sección, caption, pie) alrededor de una de contenido. La referencia Apple que el propio proyecto extrajo prohíbe texturas, grillas visibles, bordes, un segundo acento y pesos 800/900 — y el video hace las cuatro cosas. |
| **Silencio y diseño sonoro** | ✗ Incumplido | **Un solo silencio en 27,3 s**: 0,36 s, en el último medio segundo. Silencio entre frases: **0,30 s exactos, siete veces seguidas** (metronómico). Rango de sonoridad **LRA = 3,8 LU** (un film con dinámica real tiene 8-15). La voz termina **0,04 s antes de que el video termine**: no hay beat final. |

### 1.3 La tensión que hay que resolver: 93% del cuadro vacío y no se siente Apple

Esto es lo que hay que explicar bien, porque la intuición dice "si está vacío y Apple es
minimalista, debería parecerse". No se parece, y hay tres razones medibles.

**(a) El vacío no está alrededor de un sujeto: está en lugar de un sujeto.**
`ANALISIS-VISUAL-MEDIDO.md` midió ocupación media **6,69%**. Mi medición por escena agrega el
dato que falta:

| Escena | Ocupación media | Objeto/texto más alto | Columnas nunca usadas | Bloques de texto a la vez |
|---|---|---|---|---|
| 1 hook | **4,15%** | 146 px (13,6% del alto) | 39,4% | 2,5 |
| 2 problema | **4,14%** | 142 px | 23,8% | **9,4** |
| 3 cobertura | 8,92% | 692 px (marco) | 41,2% | 4,5 |
| 4 rutas | **11,75%** | 661 px (marco) | 32,3% | 3,7 |
| 5 simulador | 8,57% | 696 px (marco) | 30,6% | 3,5 |
| 6 alertas | **4,04%** | 194 px | 19,2% | 5,2 |
| 7 cierre | 4,72% | 356 px (logo) | **66,2%** | 4,5 |

El objeto más grande nunca pasa del 22% del ancho, y lo más grande en el plano que tiene que
enganchar (el hook) ocupa **13,6% del alto**. En un film de Apple el sujeto ocupa 60-100% del
cuadro: el aire es *lo que rodea a algo grande*. Acá el aire es *lo que sobró después de poner
algo chico*. Vacío + objeto chico = diapositiva. Vacío + objeto grande = Apple.

**(b) La geometría es la de una plantilla, no la de una cámara.**
16:9 + marca fija arriba + etiqueta de sección + columna de texto + banda de captions + pie con
repo/versión/tests. Son **cuatro capas de muebles** sostenidas en el 100% de los cuadros
(las captions ocupan su banda en el **89-96% de los fotogramas**). Una diapositiva usa el cuadro
como papel (todo pegado a los márgenes, todo quieto, todo legible de a uno); una cámara lo usa
como ventana (entra, sale, se acerca). El video está pegado al papel: hay planos con 384 px de
ancho vacío porque la composición es una lista de bloques, no un encuadre.

**(c) Nada se mueve y nada suena.**
Medí el movimiento cuadro a cuadro (diferencia media absoluta a 10 fps):

- **50,9% del metraje (13,9 s de 27,3 s) está en holds** con diferencia <0,10, en tramos de
  0,4 s a 1,7 s.
- **45 fotogramas son idénticos** al anterior (pixel a pixel).
- **16 picos de cambio** (>1,5), de los cuales 6 son los cortes de escena (3,50 / 8,20 / 13,30 /
  17,40 / 20,90 / 24,40 s) y 10 son entradas de elementos.
- Audio: **LRA 3,8 LU**, integrado −17,5 LUFS, pico real −4,1 dBFS, **un único silencio** en todo
  el material, y la música nunca se retira (nunca baja de −45 dB salvo los últimos 0,36 s).

Eso es exactamente el patrón de una presentación de diapositivas: **largo quieto, cambio
brusco, largo quieto.** Apple hace lo contrario: **cámara que nunca se detiene** (deriva lenta,
dolly, un zoom del 3-5% a lo largo del plano) y **cortes que caen sobre movimiento**. El vacío
de Apple está *moviéndose* y *sonando*; el vacío de este video está congelado.

**Síntesis en una frase (es la respuesta al problema):** al video no le falta menos contenido,
le falta **peso y cámara**. El minimalismo de Apple no es la ausencia de cosas: es la
**concentración del peso en la única cosa que queda**. Este video retiró cosas pero dejó la que
quedaba chica, plana, inmóvil y muda. Y el sonido —que en Apple es lo que ocupa el lugar del
texto ausente— está reducido a un colchón constante sin eventos ni silencios.

### 1.4 Los dos problemas que además son un riesgo de honestidad

**Sin cámara sobre el producto, el video no puede mostrar de qué se trata** (eso es un problema
de estilo). **Con cámara sobre el producto, queda expuesto lo que la auditoría cuestiona** (eso
es un problema de veracidad). Medido sobre los assets reales:

- Las 4 capturas son **428×599 px** (retrato) y se muestran a ~1:1 dentro de un marco de 424 px.
  El **trazo de tinta mediano** en las capturas es de **6 px (popup-main), 8 px (popup-exchanges)
  y 12 px (popup-sim)** en píxeles nativos. A 1:1 en un cuadro de 1080p, la interfaz del producto
  se ve con tipo de 6-12 px: **no se lee en un teléfono**. Para que la UI sea sujeto hace falta
  escalarla **×2,5 a ×4**, y el PNG es DPR 1 (trazo de 6 px), así que hoy un zoom ×3 sería una
  interpolación ×3. Ese zoom es obligatorio por gramática y por eso trae el problema siguiente.
- Al ampliar ×3 aparecen nítidos, en pantalla grande, los números que la auditoría cuestiona:
  `+0,70% / +0,45% / +0,38% / RESULTADO: +$13.946,63 ARS` (F-01) y la matriz del simulador con
  celdas de **−49,99% a +39,49%** (P-03, conversión invertida que **sobreestima 2,5-10,8 pp**).

**Regla que me pongo:** ninguna recomendación de este informe afirma rentabilidad, y toda
recomendación que agrande la interfaz queda **condicionada a corregir F-01 y F-02 primero** (o,
si el video sale antes, a re-capturar con esas cifras fuera de cuadro). Un zoom sobre una captura
cuyos números están bajo auditoría es peor que una diapositiva: es una diapositiva que miente
más grande.

---

## 2. Qué cambiaría, por orden de impacto

### C1 — Poner el producto en el cuadro a escala de sujeto, con cámara dentro de la UI *(impacto máximo)*

**Qué hacer.** Dejar de mostrar el popup completo dentro de un teléfono y pasar a **encuadrar
el producto**: un contenedor con recorte (clip) sobre la captura real escalada **×3** (≈1284 px),
y una cámara GSAP que **recorra módulos** con deriva continua: encabezado + tabla de bancos →
tabla de exchanges → lista de rutas → los 4 pasos → campos del simulador. Un módulo por beat,
nunca el popup entero.

**Por qué.** Es el cambio que convierte una diapositiva en un film, y no es una opinión: el
objeto más grande del video hoy mide 22% del ancho y su tipo se resuelve en 6-12 px nativos. El
vacío de los planos 1, 3 y 7 (384, 378 y 630 px de franja vertical nunca usada) existe *porque*
el producto es chico: al agrandarlo, el vacío pasa a ser aire alrededor de un sujeto.

**Cómo queda.** En los planos de producto la interfaz ocupa **50-80% del alto** del cuadro y
está siempre en movimiento lento; el texto de apoyo se reduce a una línea corta. Detalle técnico
obligatorio: **re-capturar los PNG a DPR 3** (`deviceScaleFactor: 3`) para que el zoom ×3 sea
nítido; si eso no se puede, el zoom máximo honesto es ×2 y la UI sigue leyéndose floja.

**Condición de honestidad.** Antes de ampliar: corregir F-01/F-02 y re-capturar, o encuadrar
los módulos de modo que las cifras cuestionadas (`+0,70%`, `+$13.946,63`, la matriz de
escenarios) no entren en cuadro. No se enmascara con blur lo que después se afirma con la voz.

### C2 — Un sujeto por plano: pasar de 7 diapositivas a 5 planos

**Qué hacer.** Fusionar cobertura + rutas + simulador en **un solo plano con una sola cámara**,
porque los tres son el mismo sujeto (el popup) y la misma idea ("mirá y decidí"). El muro de 49
exchanges y los 4 pasos dejan de ser escenas y pasan a ser **beats dentro del recorrido**.
Objetivo medible: **≤2 elementos de texto por plano** (hoy hay 9,4 bloques simultáneos en el
problema y 5,2 en alertas) y **una sola idea por plano** (una frase que se pueda decir en voz
alta mirando el cuadro).

**Por qué.** El incumplimiento más grave de la gramática no es estético, es de conteo: 11 bloques
de texto a la vez no se leen, se miran. Y además obliga a que todo sea chico para que entre.

**Cómo queda.** 5 planos de 3,7 a 7,6 s. Cada uno con un sujeto dominante ≥45% del alto; al
menos uno (el producto) con el sujeto al 60-80%.

### C3 — Movimiento continuo: eliminar los cuadros congelados y los cuatro negros

**Qué hacer.** (a) Cada plano lleva un movimiento que nunca se detiene: escala 1,00 → 1,05,
o deriva de 0,15-0,3 px por cuadro, o la cámara de la UI avanzando. (b) Los holds se limitan a
**0,4 s** y nunca son de todo el cuadro. (c) Los cuatro cortes a negro (0,17 / 0,17 / 0,17 /
**0,34 s** en 3,50 / 8,20 / 13,30 / 21,00 s) se eliminan **solapando los clips**: el clip
saliente sigue visible hasta que el primero del entrante ya entró (hoy el entrante arranca
≈0,2 s después, y en 21,00 s el doble).

**Por qué.** 50,9% del metraje en holds con diferencia <0,10 y 45 cuadros idénticos: en
movimiento, eso se lee como un pase de diapositivas con cambios bruscos. Y el negro de 10
fotogramas cae justo en el punto más alto del video, donde menos se puede cortar el ritmo.

**Cómo queda.** Objetivo medible: **0 fotogramas idénticos**, 0 cuadros con diferencia <0,10
fuera de un hold deliberado de ≤0,4 s, y ningún cuadro por debajo del 3% de ocupación en la
zona de escena.

### C4 — Borrar el cromo fijo: el cuadro tiene que estar limpio

**Qué hacer.** Sacar la marca fija de arriba a la izquierda, el pie con repo/versión/tests, la
grilla técnica al 5,5% y los dos hairlines de encuadre. La marca aparece **una vez**, en el
cierre. El pie de desarrollador (v6.0.0 · 203 tests · Manifest V3 · URL) no pertenece a un film
de producto que se mira en un teléfono.

**Por qué.** Las cuatro capas de cromo son el tell de "página web" y además se comen el marco:
el análisis medido ya excluyó la franja 0-10% y 86-100% del cuadro *porque siempre tiene cromo*.
Es el 24% del alto del cuadro ocupado por muebles en el 100% del metraje. La referencia Apple
extraída por el proyecto prohíbe explícitamente grillas visibles y bordes en contenedores.

**Cómo queda.** Cuadro limpio en 5 de 5 planos. Lo que hoy hace de cromo (contexto técnico)
pasa a una línea final: "Sin servidores. Sin cuentas."

### C5 — Restricción tipográfica real

**Qué hacer.** Dos tamaños por plano (un display y un apoyo), **peso máximo 700**, tracking
negativo, **un solo acento**. Barlow para display, IBM Plex Mono **solo donde el mono es el
dato** (una cifra), nunca como decoración de etiqueta. Fuera el 900, fuera el cyan `#56d4dd`
de las etiquetas de sección, fuera los chips.

**Por qué.** Hoy el rango es 8 px → 146 px (18×) dentro del mismo plano, con 900 de peso y dos
acentos: es lo contrario de una restricción, es una hoja de estilos. La restricción tipográfica
es lo que hace que el ojo sepa dónde mirar cuando no hay nada más en el cuadro.

**Cómo queda.** El tipo de apoyo nunca baja de ~34 px @1080p (hoy hay trazos de 8 px en pantalla)
y el display del plano no baja del 25% del ancho del cuadro.

### C6 — Reescribir la narración para que haya silencio

**Qué hacer.** Bajar de **64 palabras a ~35-44**, quitar el **+12% de ritmo** (hoy el hook va a
**3,11 palabras/s** y rutas a 3,16: eso suena a locución de oferta, no a afirmación de producto),
y reemplazar las siete pausas metronómicas de 0,30 s por **dos pausas diseñadas de 0,9-1,2 s**
(antes de la frase que importa y antes de la tarjeta de aviso). Dejar **1,3-1,5 s de cola muda**
después de la última palabra (hoy quedan **0,04 s**: el video termina encima de la voz).

**Por qué.** LRA 3,8 LU y un único silencio de 0,36 s: el sonido no respira. En Apple la pausa
es la puntuación del film; sin pausa, la voz es relleno y todo suena igual de importante —o sea,
nada suena importante.

**Cómo queda.** La voz ocupa ~18 s de 27,3 y **~9 s quedan sin locución** (hoy 2,14 s). Hay al
menos **un plano sin voz** (el del producto, que se explica solo).

### C7 — Diseño sonoro de eventos (5 eventos, sintetizables con ffmpeg)

**Qué hacer.** Colchón musical **más bajo y que se retire**, más cinco eventos: impacto suave
al entrar la UI; dos *ticks* de 25 ms al resolver cada cifra en pantalla; un barrido de aire
(ruido filtrado 200→4000 Hz, 350 ms) sobre cada movimiento de cámara; 0,5 s de silencio antes de
la notificación; y decaimiento de la música a −inf en el último segundo del cierre.

**Por qué.** Es exactamente el recurso que reemplaza al texto que estamos borrando. Hoy el
video tiene voz + un pad, y el pad no se detiene nunca: nada marca el cambio, así que el corte
lo tiene que hacer la imagen sola, sin ayuda.

**Cómo queda.** Cada transición tiene un evento audible; los silencios (0,5-1,2 s) tienen
función y no son huecos.

### C8 — Reordenar: el producto antes, el problema después

**Qué hacer.** El producto aparece a los **8,23 s** hoy. Moverlo al **plano 2 (≈4,2 s)** y
comprimir el problema a un beat dentro del hook (el muro de 49 no necesita 4,7 s para
entenderse: es la mejor idea del video y está desperdiciada en el plano más vacío, 4,14% de
ocupación). Después del producto, en este orden: cómo se decide (rutas + simulador), el aviso,
el cierre. Y un solo `49` en todo el film: hoy aparece dos veces en 5 s (128 px y 176 px).

**Por qué.** Beneficio antes que característica también es un orden, no solo una redacción: el
espectador tiene que ver el objeto funcionando antes de que le expliquen por qué era difícil
hacerlo a mano.

**Cómo queda.** Plano 1 brecha → plano 2 producto en movimiento → plano 3 decisión → plano 4
aviso → plano 5 cierre. El problema queda como premisa corta del hook, no como escena.

---

## 3. Qué BORRARÍA

Elementos que hoy están y no deberían estar. Todos son *sustracciones*, no sustituciones.

1. **La marca fija arriba a la izquierda** (`ArbitrARS · Detector de Arbitraje`) en el 100% de los
   cuadros. Repetir la marca durante 27 s no construye marca: ocupa el cuadro.
2. **El pie fijo**: `github.com/… · Manifest V3 · v6.0.0 · 203 tests`. Es información para
   desarrolladores en un video que se mira en un teléfono. La única versión honesta de esto en
   un film es una línea al final ("Sin servidores"), no una barra de estado.
3. **Las 63 captions cinéticas palabra por palabra.** Presentes en el 89-96% de los fotogramas,
   ocupan 3-4,3% de la superficie en su banda y son la **segunda capa de texto** compitiendo con
   el titular. El color por palabra y el `y: 26 → 0` son karaoke: convierten un film en un video
   subtitulado. Si hace falta accesibilidad, va como pista SRT/CC **no quemada**.
4. **Las etiquetas de sección cyan y los chips**: `CRIPTOYA · USDT/ARS`, `BANCOS · DÓLAR
   OFICIAL`, `SPOT + P2P`, `EXCHANGES`, y los tres chips del aviso. Son rótulos de revista; con
   la UI en pantalla grande son redundantes y con la UI chica son lo único legible (peor).
5. **La línea cyan del hook**: `LA BRECHA ENTRE LOS DOS PRECIOS ES LA OPORTUNIDAD`, 15 px @1080p.
   No se lee y explica lo que `OFICIAL ≠ USDT` ya dijo. Es el ejemplo perfecto de "texto que
   existe porque el cuadro estaba vacío".
6. **Las notas mono al pie de escena**: las tres variables del problema y la línea de stack del
   cierre (`MANIFEST V3 · 49 EXCHANGES · 203 TESTS · 0 SERVIDORES`). Cuatro datos, cero
   jerarquía, y el mismo gesto que el pie fijo.
7. **Las dos tarjetas fantasma de notificación** (opacidad 0,28 y 0,55 + blur 1,1 y 0,5 px): el
   análisis visual medido dice que no llegan a sugerir "pila". Si no se leen, no existen: o una
   sola notificación grande, o ninguna.
8. **El badge `49` de 128 px** de la escena 2 (duplicado del `49` de 176 px de la escena 3).
   Repetir el mismo dato dos veces en 5 s es relleno, no énfasis.
9. **La grilla técnica azul al 5,5% y los dos hairlines de encuadre.** Textura de fondo y bordes:
   las dos cosas que la referencia Apple del proyecto prohíbe por escrito.
10. **Los hairlines y las descripciones de los 4 pasos** (4 reglas + 4 descripciones = 8 líneas
    de texto). La información de los 4 pasos se queda —es el mejor contenido del video— pero
    como **un objeto gráfico que se dibuja** (una ruta de 4 nodos), no como una lista con líneas.
11. **El cursor que titila** en el campo del monto. Es el cliché de captura de pantalla; el tipo
    de animación que dice "esto es una imagen de una interfaz" en vez de "esto es la interfaz".
12. **La matriz de escenarios del simulador con las celdas `−49,99% … +39,49%`.** No es solo
    estilo: por P-03 esa conversión está invertida y sobreestima 2,5-10,8 pp. Sale del cuadro
    hasta que esté corregida (y con F-01/F-02 pendientes, tampoco entra el `+$13.946,63`).
13. **El `≠` como truco dibujado en SVG con `back.out` y rotación −18°.** El concepto `≠` sirve;
    el rebote de juguete no. Entra, se sostiene y se va sin rebotar.

---

## 4. Qué NO hacer

### 4.1 Errores de imitación (lo que hacen mal las marcas cuando copian a Apple)

1. **Copiar la superficie y no la disciplina.** Es literalmente el error del video actual: se
   copió el "negro + poco contenido" y no se copió "un sujeto grande + movimiento continuo +
   sonido que ocupa el lugar del texto". El resultado es lo peor de los dos mundos: vacío y
   chico. **Vaciar más no acerca a Apple; agrandar el sujeto sí.**
2. **La música épica como sustituto del movimiento.** Riser + drone durante 27 s para una
   herramienta cotidiana. Apple no hace "épico" para un utilitario: hace preciso. Un pad
   constante que nunca se retira no es atmósfera, es relleno sonoro (hoy: LRA 3,8 LU).
3. **Superlativos.** "Revolucionario", "increíble", "potenciá tus ganancias". Apple dice números
   y frases cortas. Acá hay mejores números que cualquier adjetivo: 49 exchanges, 30 segundos,
   4 pasos, 0 servidores, 2 APIs. **Y ninguno de ellos puede convertirse en un número de
   rentabilidad hasta que F-01/F-02 estén corregidos.**
4. **3D falso y mockups glossy.** Reflejos, sombras duras, perspectiva CSS sobre copias del
   teléfono, "el marco girando". A 1080p se ve como lo que es, y contradice la referencia Apple
   ya extraída (sin gradientes, sin texturas, sin sombras duras, sin bordes).
5. **El zoom infinito / "power zoom" sobre capturas.** Marea, y el PNG es DPR 1: cualquier cosa
   más allá de ×3 se deshace. El zoom tiene que ser un movimiento de cámara con un destino
   (llegar a un módulo), no un efecto.
6. **El cursor real y la interfaz "en vivo".** Apple filma el producto interactuando. Acá no hay
   video del producto: hay 4 PNG estáticos y no hay captura en movimiento en el stack declarado.
   **Es la única brecha que el stack no puede cerrar:** se puede simular la interacción (escribir
   el monto, encender una comisión), no se puede mostrar la interfaz actualizándose de verdad.
   Decirlo, no disimularlo con animación exuberante.
7. **Subtítulos karaoke quemados "por las dudas".** Es la solución más común y la que más daño
   hace al tono. Si el video se mira sin audio en redes, la decisión es de diseño (jerarquía y
   una frase por plano), no de subtítulos.
8. **Mostrar 8 características en 30 segundos para justificar la duración.** El video actual
   hace la versión suave de esto: 7 escenas, cada una con titular + dato + chip + captura + nota.
   Un film de 27 s aguanta 4-5 ideas, no 7.
9. **Abrir con el logo o con "Bienvenido a…".** Apple abre con el producto o con una frase que
   plantea el mundo. Acá el logo va al final (hoy está bien resuelto: escena 7 limpia).
10. **Usar verde/rojo como decoración.** La referencia Apple del proyecto lo prohíbe: un único
    acento reservado a lo interactivo. Además, con la auditoría en curso, un verde de
    rentabilidad en pantalla grande es exactamente el número que no se puede sostener.

### 4.2 Lo que no hay que tocar del video actual

No todo se tira. Se conserva: la premisa del hook (`OFICIAL ≠ USDT`, se entiende sin audio), el
muro de 49 casillas como idea, los 4 pasos como contenido, la captura real en vez de una
recreación, el cierre limpio con el símbolo y el wordmark, y el guion narrado en segunda persona.
La recomendación es cambiar **la cámara y la jerarquía**, no el mensaje.

---

## 5. Riesgo de mis recomendaciones

1. **Se pierde densidad informativa, que hoy es la ventaja competitiva del video.** Los planos
   más llenos (rutas 11,75%, cobertura 8,92%) son los que más información entregan por segundo.
   Al agrandar el sujeto se muestran menos cosas por plano: si alguien mira el video buscando
   "¿tiene alertas?", la respuesta llega más tarde. Mitigación: mantener las 5 ideas completas
   (cobertura, rutas, simulador, aviso, privacidad) y sacrificar solo la repetición.
2. **El zoom sobre la interfaz expone los números bajo auditoría** (F-01, F-02, P-03). Riesgo
   real y no cosmético: hoy las capturas ya los exponen, pero chicos; al agrandarlos pasan a ser
   el centro del plano. **Sin corregir F-01/F-02 primero, C1 no se puede implementar.** Si el
   video tiene que salir antes, la única salida honesta es re-capturar con las cifras fuera de
   cuadro y no reemplazarlas por ninguna otra.
3. **Se pierde accesibilidad si se borran las captions.** El proyecto verificó 123/123 chequeos
   de contraste WCAG AA; eso no cubre a quien mira sin audio. Si el canal es redes con
   reproducción automática en silencio, la decisión de borrar captions tiene costo. Mitigación:
   pista SRT/CC separada + diseño "mudo-legible" (una frase corta por plano, grande y con la
   idea en la imagen).
4. **Menos palabras y sin +12% puede no entrar en 27,3 s con las 4 funcionalidades nombradas.**
   Con ~35-44 palabras entran 4-5 ideas cortas; nombrar las 4 funciones con una frase descriptiva
   cada una no entra. Si el cliente no acepta 30-35 s, hay que aceptar menos texto.
5. **Se pierde la única presencia de marca continua.** Al borrar la marca fija y el pie, el
   espectador recién ve "ArbitrARS" en el segundo 24. Si el objetivo es recordación de nombre en
   redes, eso baja. Compensación: que la URL del repo y el wordmark tengan los 3,7 s del cierre.
6. **El sonido sintetizado puede sonar barato.** No hay biblioteca de SFX: whooshes y ticks
   hechos con `anoisesrc` + filtros son reconocibles como sintéticos. Un whoosh mal calibrado es
   más berreta que no tener whoosh. Riesgo aceptable solo con volúmenes bajos (−24 a −30 dB) y
   eventos cortos.
7. **El movimiento continuo cuesta render y puede provocar jank.** El build actual renderiza 819
   fotogramas en ~35 s (dossier), así que hay margen; igual conviene animar solo `transform` y
   `opacity`, con tweens largos, y verificar que no aparezcan saltos de subpíxel en 1080p.
8. **El muro de 49 a pantalla completa puede leerse como ruido** si el stagger es agresivo (hoy
   21 ms). A cuadro completo hay que bajar el contraste de las casillas y el stagger a 10-14 ms,
   o el plano se vuelve un patrón y no un dato.
9. **Un plano menos de "problema" puede hacer que el valor no se entienda** para quien no sabe
   qué es la brecha entre el oficial y el USDT. Por eso el hook tiene que conservar la premisa
   completa (`OFICIAL ≠ USDT` + "El mismo dólar. Dos precios."), que es más clara que la
   explicación actual.

---

## 6. Cómo presentaría yo este producto en 27 segundos (storyboard alternativo)

Reglas del guion: **5 planos**, un sujeto por plano, **0 fotogramas congelados**, ninguna
afirmación de rentabilidad, un solo acento, sin cromo fijo, sin captions quemadas.
Voz: 6 líneas, **44 palabras**, sin +12% de ritmo (≈2,4 palabras/s). **~9 s del film sin
locución.** Música por debajo y retirándose; 5 eventos de sonido.

| # | Tiempo | Qué se ve | Voz | Sonido | Texto en pantalla |
|---|---|---|---|---|---|
| **1 · LA BRECHA** | 0,00-4,20 | `OFICIAL ≠ USDT` como sujeto real: el bloque ocupa **~70% del ancho y ~35% del alto** (hoy 13,6% del alto), entrando desde el negro con una deriva de escala continua 1,00→1,05. Sin línea cyan explicativa, sin hairline, sin marca. | 0,8-3,0: "El mismo dólar. Dos precios." | Silencio los primeros 0,8 s; pad entra bajo a −34 dB y sube. | solo `OFICIAL ≠ USDT` |
| **2 · EL PRODUCTO** | 4,20-11,00 | La captura real **dentro del cuadro**, escalada ×3 con cámara que baja por la interfaz: encabezado y tabla de bancos → tabla de exchanges. **Las cifras que la auditoría cuestiona no entran en cuadro.** El `49` se resuelve sobre la UI, no al lado. Sin marco de teléfono, sin chips. *(Único plano sin locución: el producto se explica solo.)* | 5,4-8,2: "Recorre 49 exchanges locales. Cada 30 segundos." | Impacto suave al entrar (nota de 60 Hz + ruido 40 ms); dos ticks de 25 ms al resolver cada cifra. | "49 exchanges" sobre la UI |
| **3 · LA DECISIÓN** | 11,00-18,60 | La misma cámara sigue sin corte: lista de rutas → **los 4 pasos como una ruta que se dibuja** (4 nodos, un nodo por vez, ~1,2 s cada uno, sin hairlines ni descripciones) → campos del simulador, donde el monto **se escribe** (no hay cursor titilando; el número aparece resuelto). Los porcentajes de la matriz quedan fuera de cuadro. | 11,8-15,4: "Te muestra dónde comprar y dónde vender, paso a paso." · **pausa 1,0 s** · 16,6-19,4: "Probá tu monto y tus comisiones antes de operar." | Un barrido de aire (ruido filtrado 200→4000 Hz, 350 ms) al iniciar el movimiento; el pad se retira durante la pausa. | una frase por beat: "Los 4 pasos" · "Antes de operar" |
| **4 · EL AVISO** | 18,60-23,60 | Fondo limpio, **una sola** notificación a **~70% del alto del cuadro** (hoy la tarjeta es un elemento entre cinco). Entra con un movimiento suave y corto, no con rebote. Sin tarjetas fantasma, sin chips, sin titular grande: la tarjeta *es* el titular. | 21,4-24,0: "Te avisa solo si la brecha supera tu umbral." | 0,5 s de **silencio** antes de que la tarjeta entre; un tick al asentarse; el pad vuelve a −30 dB. | "Brecha detectada" (dentro del objeto) |
| **5 · EL CIERRE** | 23,60-27,30 | Símbolo + wordmark `ArbitrARS`, sobre negro limpio, con deriva de escala 1,00→1,03 hasta el último cuadro. Una sola línea de apoyo. | 24,8-26,0: "Sin servidores. Sin cuentas." | El pad decae a −inf en el último segundo; el último 1,3 s es **silencio**. | "Sin servidores. Sin cuentas." · `github.com/nomdedev/ArbitrageAR-USDT` |

**Objetivos medibles de este corte (contra el actual):**

| Métrica | Hoy | Objetivo |
|---|---|---|
| Sujeto dominante / alto del cuadro | 13,6% (hook) · 22% de ancho | ≥45% (y 60-80% en el plano 2) |
| Bloques de texto simultáneos | 9,4 / 5,2 / 4,5 | ≤2 |
| Fotogramas idénticos | 45 | 0 |
| Metraje en holds con diff<0,10 | 50,9% (13,9 s) | <10% (y ningún hold >0,4 s de cuadro completo) |
| Cuadros con ocupación <3% | 4 (cortes a negro) | 0 salvo fundido deliberado |
| Silencio entre frases | 0,30 s ×7 (varianza 0) | 2 pausas de 0,9-1,2 s |
| Cola muda al final | 0,04 s | 1,3 s |
| Metraje sin locución | 2,14 s (7,8%) | ~9 s (33%) |
| Palabras | 64 | 44 |
| LRA (dinámica sonora) | 3,8 LU | ≥8 LU |
| Capas de cromo fijo | 4 (marca, sección, caption, pie) | 0 |

---

## 7. Qué me falta saber para tener certeza

1. **Cómo suena.** Ningún agente de este consejo puede oír el video (el análisis medido ya lo
   advierte). No puedo juzgar si la voz es-AR con +12% suena natural o apurada —y mi C6 depende
   de eso—, ni si el pad es tolerable. **Esto lo tiene que dictaminar el usuario escuchando.**
2. **Canal de destino.** Landing con audio y pantalla grande, o redes con reproducción automática
   en silencio y en teléfono: cambia la decisión de borrar captions y el tamaño mínimo de tipo.
   Hoy el video se diseña con cromo pensado para pantalla grande y se vería en 6-12 px en un
   teléfono.
3. **¿27,3 s es techo o es dato?** Con 44 palabras y silencio entran 5 planos. Si el cliente
   quiere nombrar las 4 funciones con una frase cada una, hacen falta 30-35 s.
4. **Estado de F-01, F-02 y P-03 y permiso de re-captura.** Necesito saber si el video sale antes
   o después de la corrección, y si se puede re-capturar la interfaz hoy con esas cifras fuera de
   cuadro. Sin eso, C1 (el cambio más importante) no se puede implementar.
5. **¿Sobrevive el badge verde de rentabilidad a la auditoría?** El análisis advierte que las
   capturas lo muestran. Si la auditoría lo cuestiona, no puede aparecer en un plano heroico, ni
   siquiera como parte de la interfaz real.
6. **¿"Cada 30 segundos" está verificado?** Al agrandar la UI, esa afirmación deja de ser una
   línea de voz y pasa a ser el tema del plano. Hay que poder sostenerla con el timestamp de la
   interfaz a la vista.
7. **¿Se puede simular la interacción o sólo mostrarla quieta?** El stack declarado es HTML+GSAP
   con 4 capturas PNG, ícono, logo, tipografías y audio sintetizable: no hay filmación real ni
   captura en movimiento de la extensión funcionando. **Simular escribir un monto y encender una
   comisión sí se puede; mostrar la interfaz actualizándose de verdad, no.** Si el pipeline
   aceptara una capa de video (screencast real del popup vía CDP), el plano 2 y el 3 darían un
   salto que ningún zoom sobre un PNG alcanza; si no la acepta, esta es la brecha donde el stack
   pone el techo y conviene saberlo antes de diseñar sobre esa expectativa.
8. **DPR de las capturas.** Mis mediciones indican DPR 1 (trazo mediano de 6 px). Si existe la
   posibilidad de re-capturar a `deviceScaleFactor: 3`, el zoom ×3 es nítido; si no, el zoom se
   limita a ×2 y la interfaz no llega a ser sujeto pleno. Es el dato técnico que decide el alcance
   de C1.

---

*Informe 03 — gramática de presentación de producto Apple. Medición propia sobre
`output/arbitrars-promo-1920x1080.mp4` (273 muestras a 10 fps + análisis de audio
ebur128/astats/silencedetect + medición de los PNG nativos del producto).*
