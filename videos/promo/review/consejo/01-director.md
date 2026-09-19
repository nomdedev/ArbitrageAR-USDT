# 01 — DIRECTOR / DIRECTOR DE FOTOGRAFÍA

**Qué es este informe.** Juicio de dirección sobre el corte de 27,300 s de ArbitrARS
(`output/arbitrars-promo-1920x1080.mp4`), con medición propia sobre el MP4 renderizado y
cita a `tools/build_index.py` e `index.html`. Todo lo que afirmo como hecho está medido
acá abajo; lo que es juicio está marcado como juicio.

**Lo que medí yo** (comandos reproducibles, todos sobre el render final):

| Medición | Comando | Resultado |
|---|---|---|
| ¿Hay cortes? | `select='gte(scene,0)',metadata=print:key=lavfi.scene_score` | **0 de 819 fotogramas supera 0,10**. El máximo de todo el film es **0,0636**, la media 0,00060 |
| Movimiento entre fotogramas | `fps=6,tblend=all_mode=difference,signalstats` | media **1,02/255**; **62% de las muestras por debajo de 0,5** |
| Niveles | `loudnorm=print_format=json` | **−17,39 LUFS**, true peak **−4,14 dBTP**, LRA 3,50 |
| Silencios de la voz | `silencedetect=noise=-35dB:d=0.25` sobre `audio/narration.wav` | 8 pausas de **1,257 / 0,861 / 0,304 / 1,298 / 1,305 / 1,296 / 1,325 / 1,340 / 0,816 s** = **9,80 s** de aire muerto |
| Cola de cada escena | `fps=6` + luma de la diferencia | escena 3: último movimiento >0,8 a los **9,00 s** → **4,33 s inmóvil de 5,10** |
| Corte a negro | `signalstats YAVG` alrededor de 3,50 / 8,20 / 13,33 / 21,00 | en los cuatro casos el YAVG cae a **26,70 idéntico** (83-90% del valor vecino) |
| Hook | YAVG de la zona de escena a 30 fps, primeros 45 fotogramas | 26,70 → 31,55; **se aplana recién a los 0,63 s** |

**Lo que no puedo juzgar:** cómo suena. Nadie de este consejo puede oír el video
(`ANALISIS-VISUAL-MEDIDO.md:107-113`). Todo lo que diga de voz y música se apoya en
niveles medidos, no en escucha.

---

## 1. Juicio del video actual

### Lo que funciona (una línea cada cosa, y paso a lo que hay que cambiar)

- **`OFICIAL ≠ USDT` es una idea, no una plantilla.** Plantea la premisa en un solo cuadro
  y se entiende sin audio. Es el único lugar del film donde hay un concepto y no un layout.
- **El muro de 49 casillas es el mejor hallazgo del video** (`DOSSIER-VIDEO.md:48`):
  comunica la escala del problema sin escribir "es mucha escala". Está desaprovechado
  (gris sobre negro, 19 px, y queda un vacío grande abajo — `ANALISIS:92-95`), pero la
  idea es correcta.
- **El barrido azul sobre la captura** (`build_index.py:422`) funciona: es el único
  movimiento del film que no es una entrada de elementos.
- **No inventar cifras de mercado** es una decisión de dirección acertada, y es lo que
  hace que el producto se sienta serio.
- **La escena de los 4 pasos es el único momento en que el film opera el producto** en
  vez de exhibirlo (`ANALISIS:96-99`).
- **El cierre está bien compuesto.** Nada que decir.

### Lo que no funciona, con evidencia

**a) No hay un solo corte en 27,3 segundos.** El mayor cambio entre dos fotogramas
consecutivos de todo el film es el **6,4%** del cuadro (medido sobre los 819 fotogramas;
0 frames superan 0,10 y sólo 6 superan 0,01). Un film cuya máxima diferencia entre
fotogramas es 6,4% **no tiene montaje**: no hay una sola decisión editorial tomada en
27,3 s. Y la causa es estructural, no de gusto: `tools/build_index.py:99-100` deriva el
límite de cada escena del final del segmento de audio más 0,30 —

```python
start = 0.0 if i == 0 else round(segs[i - 1]["end"] + 0.30, 2)   # build_index.py:99
```

— y `index.html:393-517` declara 7 clips contiguos de una sola pieza cada uno. **El film
está cortado según las oraciones del locutor, no según las ideas.** Una oración = una
lámina. Eso es la definición operativa de "presentación de diapositivas".

**b) El 62% de los fotogramas está congelado, y la causa también es de código.** La
diferencia media entre fotogramas consecutivos es 1,02/255 y más de la mitad de las
muestras no llega a 0,5. Leí todas las animaciones de `tools/build_index.py:406-434`: son
**una lista de entradas**. Cada tween del film es del tipo
`fromTo(opacity: 0, x: ±22…130 → opacity: 1, x: 0, duration: 0.34-0.7)`. Las únicas dos
excepciones en todo el video son el barrido de la escena 3 (`build_index.py:422`) y el
cambio de color de la URL al cierre (`build_index.py:440`). **No existe un solo tween que
anime algo que ya está en pantalla.** Por eso los picos de movimiento medidos caen todos a
±0,2 s de los límites de escena (3,50 → 5,60; 8,00 → 6,94; 13,33 → 5,96; 17,50 → 6,28;
21,00 → 5,58): lo único que se mueve es la llegada, y cuando la llegada termina, la
lámina se congela. Los números por escena: escena 3 queda inmóvil **4,33 s de 5,10**;
escena 5, **2,75 s de 3,50**.

**c) Las pausas están puestas con regla.** `tools/tts_es.py:29` define `GAP = 0.30` —
una constante única — y `tts_es.py:86-97` concatena los 7 segmentos intercalando el mismo
`_gap.mp3` (silencio digital generado con `anullsrc`, no ambiente). `audio/timeline.json`
confirma que cada arranque es exactamente el final anterior + 0,300. Las pausas efectivas
terminan siendo 1,26 / 1,30 / 1,31 / 1,30 / 1,33 / 1,34 s: **siete pausas del mismo largo,
todas decididas por una constante.** En cine la duración de una pausa es información: una
pausa corta apura, una larga anticipa. Acá no informa nada — es el sonido de la diapositiva
avanzando. Y esas pausas caen justo encima de los cuatro huecos negros (silencios medidos
de 1,257 / 1,298 / 1,305 / 1,296 s).

**d) El cuadro negro no es negro: es vacío con membrete.** Medí el YAVG de cuadro completo
en los cuatro pasajes: **cae exactamente a 26,70 en los cuatro casos**, 83-90% del valor
vecino. La cifra es idéntica porque lo único que queda encendido es el mismo cromo fijo
(marca arriba a la izquierda, pie abajo). Es decir: la audiencia no ve un corte a negro
—ve **10 fotogramas de plantilla vacía con encabezado y pie**— y el más largo de los
cuatro (0,34 s) cae en 21,00 s, justo en el clímax emocional del film, donde la tarjeta de
notificación recién aparece a `start + 0.45` (`build_index.py:434`). Ahí la ocupación
medida del cuadro es **2,34%**, la más baja de todo el video (`ANALISIS:48`).

**e) El film habla antes de mostrar.** El YAVG de la zona de escena sube de 26,70 a 31,55
y **se aplana a los 0,63 s**: los primeros dos tercios de segundo son el tránsito de
palabras entrando desde fuera de cuadro (`build_index.py:406-408`). La voz, mientras tanto,
arranca en 0,000 s (la mezcla ya está a −16,5 dB en la primera ventana de 0,5 s). El film
dice su frase más importante sobre un cuadro que todavía no está compuesto. En un feed, ese
es exactamente el tramo en el que se decide si alguien sigue mirando.

**f) El film no tiene banda sonora, tiene fondo.** `tools/make_music.py:29` fija un solo
acorde (A2 · E3 · A3 · B3 · C4) para los 27 s, con `tremolo=f=0.12` —periodo de 8,3 s—,
doble `lowpass`, `aecho` de 520/1080 ms y `afade=out` sobre los últimos 2,8 s
(`make_music.py:54-58`). **No hay un solo transitorio en todo el film**: ni un golpe, ni un
pulso, ni un cambio de acorde. Una banda sin eventos no puede marcar un corte, y por eso
tampoco hay cortes. Música y montaje tienen la misma patología: nada pasa.

**g) Está 3,4 LU por debajo del estándar de la web.** `loudnorm`: **−17,39 LUFS** con true
peak **−4,14 dBTP**. La web normaliza alrededor de −14 LUFS. En una lista de reproducción
este video va a sonar más débil que todo lo que lo rodea, y el pico de −4,14 dBTP
desperdicia unos 15 dB de techo que deberían estar usándose para el golpe del hook. Peor:
en las pausas el bed está *más* abajo, no más arriba — medí el ducking seco contra
duckeado y en los huecos (t = 2,0 s) pasa de −31,4 a **−44,6 dB**, y en t = 18,0 s de
−30,7 a **−49,0 dB**. El sidechain (`make_music.py:74`) no libera dentro de la pausa, así
que la pausa es un agujero real: ni voz ni música.

**h) El último acto del film es apagar cosas.** La URL vuelve a blanco en los últimos 0,4 s
(`build_index.py:440`: `tl.to("#s7-cta", {color: "#f0f6fc"}, total - 0.5)`), la música se
va en un fade de 2,8 s, y la mezcla termina a **−51,7 dB** en la última ventana de 0,5 s.
El plano de cierre de un film de producto es donde el ojo se queda: acá se va
desaturando y bajando el volumen hasta el silencio. No hay botón.

**i) Hay un membrete de ingeniería en todos los fotogramas.** Pie fijo con
`github.com/nomdedev/ArbitrageAR-USDT · Manifest V3 · v6.0.0 · 203 tests`
(`guion-narracion.txt:38`) más marca fija arriba. Cuatro elementos de texto permanentes.
"203 tests" y "v6.0.0" son datos para el que revisa el repositorio, no para el que mira.
Ocupan cuadro en los 27,3 s y son parte de por qué cada lámina parece un tablero interno.

**j) El héroe de la escena del simulador es el número equivocado.** La matriz de escenarios
domina la escena 5 y muestra celdas de −49,99% a +39,49% (`ANALISIS:75-77`); la auditoría
sostiene que esa conversión está invertida y sobreestima 2,5-10,8 puntos (P-03). La escena
del simulador tiene que decir "probá antes de operar": hoy dice "mirá estos porcentajes".

---

## 2. Qué cambiaría, priorizado (8 cambios)

### 1. Montar el film: 12 planos en lugar de 7 láminas

- **Qué hacer.** Subdividir cada escena en 2 planos (el clímax en 1, el problema en 3) con
  **corte duro**, no con relevo. Cada corte cae en un onset de palabra de `audio/words.json`
  o en un evento musical. El plano entrante tiene que estar **compuesto en su fotograma 1**
  (opacity 1, posición final); lo que entra en movimiento es la cámara, no el texto.
- **Por qué.** Es el defecto raíz: 0 de 819 fotogramas supera 0,10 de scene score. Sin
  corte no hay ritmo, y sin ritmo un film de 27 s se lee como 7 diapositivas. Además, el
  corte duro **elimina los 4 huecos negros de un saque**: no hay nada que ocultar si el
  plano que entra ya está lleno. Es el cambio con mejor relación impacto/costo de todo el
  informe, porque no requiere re-render de assets ni re-grabar la voz.
- **Cómo se vería.** El pasaje 20,92 → 21,00 deja de ser un hueco de 10 fotogramas y pasa a
  ser un corte que aterriza en el clímax; el ojo siente "editaron" en vez de "avanzó".

### 2. Sacarle la inercia: movimiento continuo dentro de cada plano

- **Qué hacer.** Envolver el contenido de cada escena en un wrapper y animar **el wrapper**
  durante toda la escena: push-in 1,00 → 1,025 o deriva de 40 px, ease `none`. Sumar por
  escena un tween que mueva algo *ya presente* (un subrayado que crece, un contador que
  corre, la fila activa de la captura que se ilumina). Regla: ningún estado final del film
  puede tener movimiento 0.
- **Por qué.** 62% de los fotogramas congelados (media 1,02/255), y `build_index.py:406-434`
  es una lista exclusivamente de entradas. Escena 3 inmóvil 4,33 s de 5,10.
- **Cómo se vería.** Ninguna lámina vuelve a ser una foto: el cuadro respira aunque el
  texto esté quieto, que es lo que hoy hace la diferencia entre esto y una placa.

### 3. Reescribir el ritmo del habla: pausas desiguales y sin `_gap`

- **Qué hacer.** Borrar `GAP = 0.30` de `tools/tts_es.py:29` y las uniones con `_gap.mp3`
  (`tts_es.py:86-97`). Pausas por significado: 0,12 s después del hook, 0,20 s entre
  "Esa diferencia es real." y "Medirla a tiempo, no." (son dos ideas), 0,70 s antes del
  cierre. Y reemplazar el silencio digital por ambiente sintetizado (ruido rosa con
  lowpass, mismo generador) para que la pausa no sea un agujero.
- **Por qué.** Las 7 pausas salen de una constante; `silencedetect` las mide en 1,257 a
  1,340 s. La pausa es el único recurso expresivo que el video no está usando, y son 9,80 s
  de los 27,3.
- **Cómo se vería.** La locución empieza a sonar pensada. Gana ~1,5 s recuperables que se
  pueden dar a la lectura de las capturas, que hoy está apretada.

### 4. Darle eventos a la música y arreglar la mezcla

- **Qué hacer.** Mantener el pad (`make_music.py:29`) pero agregar: golpe grave en el
  fotograma 1; un riser de 1,2 s hacia 20,92; un impacto con la tarjeta de notificación en
  21,37 s; y cambiar la salida —nota final sostenida y corte limpio, en lugar del
  `afade=out` de 2,8 s (`make_music.py:57`). Después, normalizar a −14 LUFS / −1,5 dBTP y
  ajustar el sidechain (`make_music.py:74`) para que **libere dentro de la pausa** (attack
  más corto, release 180-250 ms).
- **Por qué.** Medido: un solo acorde, ningún transitorio, y en las pausas el bed queda a
  −44,6 y −49,0 dB. La mezcla está a −17,39 LUFS / −4,14 dBTP. Sin eventos musicales no
  existe dónde hacer caer un corte — este cambio y el 1 se necesitan mutuamente.
- **Cómo se vería.** El film pasa de tener fondo a tener banda; la pausa deja de ser un
  agujero y el corte del clímax tiene un lugar donde aterrizar.

### 5. Componer el hook en el fotograma 1

- **Qué hacer.** `OFICIAL`, el `≠` y `USDT` ya legibles en f1; los primeros 3 fotogramas
  hacen un settle de 6 px y el `≠` se traza en 0,25 s. El movimiento del resto del plano es
  el push-in del cambio 2. Subir la línea guía de 15 px a 26 px, o borrarla.
- **Por qué.** El YAVG de la escena se aplana recién a los 0,63 s
  (`build_index.py:406-408`: entradas de 0,62 s desde x ±70). La voz arranca en 0,000 s. El
  segundo 0 es uno de los dos más vacíos del film (3,67% de ocupación, `ANALISIS:45`).
- **Cómo se vería.** El film muestra su premisa antes de decirla. El minuto 0 de un
  video es su miniatura, y hoy la miniatura es un cuadro vacío con palabras volando.

### 6. Sacar el membrete de ingeniería del cuadro

- **Qué hacer.** Del pie fijo (`guion-narracion.txt:38`) conservar sólo la marca; `v6.0.0`,
  `203 tests` y `Manifest V3` salen de todos los fotogramas. El repo aparece **una sola
  vez**, en el cierre y a tamaño legible (no a 12 px de cromo). En la escena 2, borrar la
  nota mono de tres variables al pie: el muro ya dice eso.
- **Por qué.** Cuatro elementos de texto permanentes hacen que cada lámina parezca un
  tablero interno. Y en el cierre la línea de stack
  (`MANIFEST V3 · 49 EXCHANGES · 203 TESTS · 0 SERVIDORES`) cuenta cosas que a la audiencia
  no le sirven: quedan `MANIFEST V3 · 0 SERVIDORES`, que sí son el argumento.
- **Cómo se vería.** El cuadro queda para lo que importa. Es el cambio más barato del
  informe.

### 7. Filmar la captura, y re-tomarla sin los números cuestionados

- **Qué hacer.** (a) Nunca mostrar la captura entera y quieta: hacer push-in de 6-8% sobre
  la zona que el plano está explicando, o un scroll lento dentro de la captura — la captura
  es el único objeto heroico real que tiene este film y hoy se usa como una imagen fija.
  (b) Volver a tomar `popup-main.png` y `popup-sim.png` con las comisiones activadas y sin
  la fila de resultado; dejar la matriz de escenarios **fuera de encuadre**.
- **Por qué.** Las capturas exponen `+0,70%`, `+0,45%`, `+0,38%`, `RESULTADO: +$13.946,63
  ARS` y la matriz de −49,99% a +39,49% (`ANALISIS:69-83`). El guion se cuidó de no
  afirmarlos con la voz; la imagen sí los pone en pantalla grande. Y de las 4 claims de
  producto, la del simulador es la que más se juega y hoy la tapa el objeto equivocado.
- **Cómo se vería.** La audiencia mira la operación, no un porcentaje discutido.
- **Condición de honestidad (no negociable).** Si el consejo decide mostrar una cifra de
  rentabilidad —badge, resultado o celda de la matriz—, **primero hay que corregir F-01
  (la comisión de venta que hoy se descarta), F-02 (comisiones por defecto) y P-03
  (conversión USD→USDT invertida, que sobreestima 2,5-10,8 puntos), y después re-renderizar
  con capturas nuevas.** Mientras eso no esté hecho, el film no puede afirmar cuánto se
  gana, ni con la voz ni con la pantalla.

### 8. Cerrar con un botón, no con una salida

- **Qué hacer.** El logo entra en 0,35 s (hoy 0,7 con `scale 0.8`, `build_index.py:436`),
  el wordmark 0,2 s después, sobre un golpe grave. **La URL queda azul** —se elimina el
  `tl.to("#s7-cta", {color: "#f0f6fc"}, total - 0.5)` de `build_index.py:440`— porque el
  azul es donde está el clic. Los últimos 0,6 s: cuadro totalmente inmóvil, música sonando,
  sin fade.
- **Por qué.** Medido: la mezcla termina a −51,7 dB en la última ventana; la música se va en
  2,8 s de fade; el último evento visual es una desaturación. Un film de producto termina
  poniendo algo, no sacándolo.
- **Cómo se vería.** El logo aterriza en lugar de desvanecerse, y el cuadro final es el que
  la audiencia recuerda.

---

## 3. Qué NO hacer

- **No copiar el look de Apple por la superficie.** Apple sostiene un cuadro vacío con un
  objeto filmado, luz direccional, profundidad de campo y diseño sonoro. Este stack no tiene
  filmación. Un radial-gradient detrás de una captura de extensión no va a parecer un
  iPhone: va a parecer una captura con un manchón. El peso en este film se consigue con
  **escala, ritmo y sonido**, no con glow, blur ni vignette.
- **No usar un fade a negro como transición.** Es exactamente el defecto actual: medí
  YAVG cayendo a 26,70 en los cuatro pasajes. Fades a negro en un film de datos se leen como
  error de render, no como pausa deliberada (`ANALISIS:32-34`).
- **No llenar el cuadro con más texto.** El cuadro ya está vacío al 93%
  (`ANALISIS:38-39`) y a la vez tiene cuatro elementos de cromo fijos. El problema no es
  falta de contenido: es que lo que hay no tiene jerarquía ni movimiento.
- **No mostrar ninguna cifra de rentabilidad** sin F-01/F-02/P-03 corregidos. Ni un badge,
  ni un "+0,70%", ni una celda de la matriz.
- **No subtitular palabra por palabra los 27,3 s.** La caption cinética ya existe (63
  palabras sincronizadas, `STORYBOARD:110-116`) y compite con la tipografía de la escena:
  la voz ya dice lo que la caption escribe. En un film, dejar sólo la línea que hay que
  recordar; el resto, fuera del cuadro.
- **No usar el mismo movimiento de cámara en todas las escenas.** Si todo empuja hacia
  adentro, el resultado vuelve a ser un slideshow, pero con movimiento. El push-in tiene
  que tener dirección dramática: acercarse cuando el film se compromete, alejarse cuando
  revela contexto.
- **No poner "whoosh" de librería.** La música está sintetizada a propósito (sin licencia de
  terceros, `make_music.py:4-10`). Mezclar un pack de sonidos gratuitos con un pad de tonos
  puros va a sonar a dos productos distintos.
- **No repetir el estilo de magazine técnica**: preset *broadside* heredado y remapeado
  (`DOSSIER:66-68`). Lo heredado es el problema, no el color.
- **No dejar el cuadro sin movimiento para "dar tiempo a leer".** El tiempo de lectura se da
  con duración del plano, no congelando la imagen.

---

## 4. Riesgo de mis recomendaciones

1. **Cortar más reduce el tiempo de lectura.** Hoy las capturas tienen ~4 s por escena; con
   2 planos cada una baja a ~2 s, y el texto interno de las capturas es chico. Mitigación:
   cada plano de captura es un push-in sobre **una zona**, no la captura completa — se lee
   menos superficie durante menos tiempo.
2. **Movimiento continuo sobre texto de 19 px puede vibrar.** A 30 fps, un desplazamiento
   lineal sub-píxel hace shimmer en los bordes tipográficos. Mitigación: mover el
   contenedor con incrementos alineados al píxel, y nunca animar el texto y el wrapper a la
   vez.
3. **Subir 3,4 LU sin poder escuchar el resultado es el riesgo más probable de fallar.**
   Nadie de este consejo puede oír el video (`ANALISIS:107-113`). Normalizar a −14 LUFS
   expone la voz TTS y el pad: el mismo material puede sonar más presente o más áspero. El
   usuario tiene que escuchar antes y después antes de aprobar este cambio.
4. **Rehacer la narración es el cambio de mayor costo, por lejos.** Tocar las pausas invalida
   `audio/words.json` (63 timestamps de palabra) y `audio/timeline.json`, y como los límites
   de escena se derivan del audio (`build_index.py:99-100`), **todos los tiempos de escena y
   de caption se recalculan**. Los otros 7 cambios, en comparación, son cosméticos.
5. **Sacar el cromo fijo quita información que el usuario valoraba.** El repo, la versión y
   los tests están ahí por una razón. La contrapartida: la URL tiene que ser grande y
   legible en el cierre, y eso le come ~0,5 s al cierre, que ya es el más corto.
6. **El riesgo grande: implementar los 8 cambios sin cambiar qué se dice.** Un film más
   cortado, más movido y más fuerte que sigue explicando lo mismo en el mismo orden es un
   slideshow más rápido y más ruidoso. Y hay un desbalance real en el guion: 8,23 s (30% del
   film) se dedican a "hay una brecha" y "es difícil medirla" —justo las láminas más vacías,
   2,91% a 4,95% de ocupación (`ANALISIS:45-58`)—, mientras que la única escena que opera el
   producto dura 4,09 s. El hook es lo que más peso visual necesita y lo que menos tiene.

---

## 5. Cómo contaría yo este producto en 27 segundos

**Premisa de dirección:** un film de 27 s para un producto de arbitraje no es un catálogo de
funciones; es **una operación**. El conflicto es que la diferencia existe y el tiempo no
alcanza. Los 12 planos arman eso: la brecha (plano 1), la imposibilidad de medirla a mano
(planos 2-4), la máquina que la mide (5-6), la operación (7-8), el ensayo (9-10), el aviso
que cambia el juego (11), el objeto al final (12).

**Mantengo las 7 frases del guion actual** —así este storyboard no agrega riesgo de
honestidad ni requiere revisar copy nueva— pero con pausas distintas y con el reparto de
tiempo corregido: la cobertura y la operación ganan 3,1 s que le saco a los huecos.

| # | Entrada | Plano | Qué se ve | Sonido / voz |
|---|---|---|---|---|
| **1** | 0,00-2,90 | **P1 · LA PREMISA** | `OFICIAL ≠ USDT` **ya compuesto y legible en el fotograma 1**. Settle de 6 px en 3 fotogramas; el `≠` se traza en 0,25 s. Después, push-in lento 1,00 → 1,025 sobre todo el lockup. La línea cyan a 26 px: "LA BRECHA ENTRE LOS DOS PRECIOS ES LA OPORTUNIDAD". Nada más en el cuadro. | Golpe grave en f1. Voz 0,20 → 2,90: "El dólar oficial y el USDT no valen lo mismo." |
| — | **2,90** | **CORTE** duro sobre "-mo" | | silencio 0,12 s |
| **2** | 3,02-5,30 | **P2 · LA ESCALA** | El muro de 49 chips, ahora en serio: chips a 26 px, grilla que **sangra por los cuatro bordes** (se ve que no entran todos), y un `49` de 340 px por encima, en el mismo plano. La cámara empuja 1,00 → 1,08 hacia el muro. | Voz 3,02 → 5,20: "Esa diferencia es real." |
| — | **5,30** | **CORTE** | | |
| **3** | 5,30-7,10 | **P3 · MEDIR A MANO** | El muro se aleja (1,08 → 0,90) y baja a 0,35 de opacidad — foco por planos, no por desenfoque — y queda **una sola casilla encendida** en el centro, a 120 px. Es la imagen del problema: 49 para 1. | Voz 5,50 → 7,10: "Medirla a tiempo, no." |
| **4** | 7,10-9,10 | **P4 · EL TITULAR** | "Medirla a mano **no escala**" a 96 px sobre el muro recedido. Tercer plano de la misma idea, sin texto nuevo. | 0,20 s de aire; el pad empieza a subir |
| — | **9,10** | **CORTE** | | |
| **5** | 9,10-11,40 | **P5 · LA CAPTURA (INSERCIÓN)** | Zoom 200% **dentro** de la tabla real: una fila, exchange / compra / venta. La cámara **se retira** 2,3 s hasta mostrar el marco completo del popup y el `49`. El movimiento termina junto con la cifra. | Voz 9,20 → 11,30: "ArbitrARS la mide sobre 49 exchanges" |
| **6** | 11,40-13,60 | **P6 · EL BARRIDO** | El barrido azul (funciona: `build_index.py:422`), pero de 1,4 s en lugar de 3,1, y mientras barre los chips aparecen **en el orden en que llega el dato**: BANCOS → CRIPTOYA → SPOT + P2P. | "…cada 30 segundos." |
| — | **13,60** | **CORTE** | | |
| **7** | 13,60-16,20 | **P7 · EL TRAVELLING** (el plano más largo del film) | Los 4 pasos son **una sola pieza continua** que se desplaza hacia arriba a velocidad constante durante 2,6 s: la cámara arranca encuadrando el **01 Comprar dólar oficial** y termina en el **04 Retirar la ganancia** justo cuando la voz termina. Sin stagger, sin cascada. Al lado, el popup enmarcado y quieto. | Voz 13,70 → 16,10: "Te ordena las rutas por rentabilidad" |
| **8** | 16,20-18,20 | **P8 · LAS RUTAS** | Las rutas ordenadas, cada una como **nombre + flecha de dirección** (comprar acá → vender allá) y el sello **MEJOR RUTA** en la primera. El porcentaje **sólo aparece si F-01 está corregido**; si no, se muestra la jerarquía sin la cifra. | "…con la guía paso a paso." 0,45 s de aire |
| — | **18,20** | **CORTE** | | |
| **9** | 18,20-20,00 | **P9 · EL CAMPO** | Primer plano del campo de monto al 200%, el número escribiéndose dígito por dígito (ya existe el cursor, `DOSSIER:51`), y enseguida **la comisión de compra y la de venta** entrando con un subrayado que crece. Que se vean las **dos**: ese es el argumento del producto. | Voz 18,30 → 20,00: "Simulá tu monto y tus comisiones antes de operar." |
| **10** | 20,00-21,60 | **P10 · EL ENCUADRE** | Pull-back al popup completo, con la **matriz de escenarios fuera de cuadro** (`ANALISIS:75-77`: está cuestionada y hoy es el objeto más grande). | riser de 1,2 s hacia el clímax |
| — | **21,60** | **CORTE** sobre el golpe | | |
| **11** | 21,60-25,00 | **P11 · LA ALERTA** (clímax) | La tarjeta de notificación entra **con impacto de sonido y congela el cuadro 3 fotogramas** (el impacto lo justifica); las fantasmas de atrás pasan de 0,28/0,55 de opacidad (`build_index.py:432-433`, `index.html:257-258`) a **0,45/0,72 con offsets de 10 y 20 px** para que se lean como pila. Después la tarjeta **vive**: un punto azul del ícono late a 1 Hz. El sello `AHORA` se actualiza en los últimos 0,4 s. | Impacto + nota sostenida. Voz 21,70 → 24,20: "Y te avisa solo cuando la brecha supera tu umbral." |
| **12** | 25,00-27,30 | **P12 · EL BOTÓN** | Logo en 0,35 s sobre el golpe, wordmark 0,2 s después. Línea de stack reducida a **`MANIFEST V3 · 0 SERVIDORES`**. La URL entra en azul y **se queda azul**. Últimos 0,6 s: cuadro inmóvil, música sonando, **sin fade**. | Voz 25,10 → 27,10: "Todo en tu navegador, sin servidores." Final sostenido y corte. |

**Reparto de tiempo resultante:** 2,90 s premisa · 6,20 s problema · 4,50 s cobertura ·
4,60 s operación · 3,40 s simulador · 3,40 s alerta · 2,30 s cierre. 12 planos, 2,3 s de
media. La voz ocupa 17,5 s y **deja 9,8 s de aire, pero repartidos en pausas distintas en
lugar de siete pausas iguales**.

---

## 6. Qué me falta saber para tener certeza

1. **Dónde se va a ver el video.** Es la incógnita más grande. 27 s en 16:9 con texto
   interno de 19 px es ilegible en un teléfono (YouTube Shorts, X, LinkedIn mobile). Si el
   destino es móvil, mi receta cambia de raíz: habría que reencuadrar a 9:16 o subir todo el
   cuerpo tipográfico, y probablemente partirlo en 2 piezas. Si el destino es una landing
   horizontal, el plan de arriba aplica tal cual.
2. **Cómo suena.** Nadie de este consejo puede oírlo (`ANALISIS:107-113`). El cambio 4
   (subir 3,4 LU a −14 LUFS) es el más riesgoso y el único que se aprueba escuchando.
3. **Si las capturas se pueden volver a tomar.** Con capturas nuevas, el cambio 7 es gratis
   y los números cuestionados salen del cuadro. Si no, hay que recortar, y entonces el
   cambio 7 queda condicionado a F-01: **con las capturas actuales el film está mostrando
   `RESULTADO: +$13.946,63 ARS` en pantalla grande y no puede hacerlo**.
4. **Si el pipeline sigue corriendo.** `tools/build_index.py` es la fuente de verdad
   (`STORYBOARD:19`) pero no lo ejecuté: no verifiqué que el build siga funcionando ni que
   `hyperframes check` siga pasando después de tocar los clips. Cualquier cambio estructural
   (cambio 1 y 3) depende de eso.
5. **Por qué el encargo dice "como Apple".** Si lo que se quiere es *que se vea caro*, el
   camino es ritmo y sonido (cambios 1, 2, 4) — barato y seguro. Si lo que se quiere es *que
   se parezca a Apple*, es un look que este stack no alcanza sin un objeto filmado con luz
   real, y ahí lo honesto es decirlo. De esa respuesta depende cuál de mis 8 cambios es el
   primero.
6. **Si el badge verde de rentabilidad puede aparecer.** Está en las capturas actuales y la
   auditoría lo cuestiona (`DOSSIER:83`). Necesito el estado de F-01/F-02/P-03 para saber si
   la escena 8 puede mostrar una cifra.
7. **Cuánto margen hay para cambiar el guion.** Mi storyboard no toca una palabra de las 7
   frases. Si se puede agregar una, la que falta es **para quién es el producto**: hoy el
   film explica cómo funciona y nunca a quién le sirve.
