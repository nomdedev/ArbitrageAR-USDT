# ANÁLISIS VISUAL MEDIDO — video actual

Medición propia del orquestador sobre el MP4 renderizado. Todo lo que sigue son números
obtenidos de los píxeles, no impresiones.

**Método.** Se decodifica el video completo a 6 muestras por segundo (`ffmpeg -vf fps=6`,
escalado a 640 px) y en cada muestra se mide la **ocupación**: porcentaje de píxeles con
luminancia > 22 sobre fondo `#09090b` (luminancia ≈ 9), contando **sólo la zona de escena**
—franja vertical de 10% a 86% del alto— para excluir el cromo fijo (marca arriba, pie
abajo) que siempre está presente. Reproducible: `review/metricas-fotogramas.json`.

---

## Hallazgo 1 — Cuatro cortes a negro no intencionales

En los cuatro puntos donde termina una escena y empieza la siguiente hay un cuadro
prácticamente vacío: sólo queda el cromo fijo.

| Inicio | Duración | Corte | Escenas |
|---|---|---|---|
| 3,50 s | 0,17 s | escena 1 → 2 | hook → problema |
| 8,17 s | 0,17 s | escena 2 → 3 | problema → cobertura |
| 13,33 s | 0,17 s | escena 3 → 4 | cobertura → rutas |
| **21,00 s** | **0,34 s** | escena 5 → 6 | simulador → alertas |

Son 5, 5, 5 y 10 fotogramas a 30 fps. **La causa es mecánica, no estética:** el clip de la
escena saliente se oculta en su límite (`data-start + data-duration`) y el primer elemento
de la escena entrante recién aparece con su animación de entrada, unos 0,2 s después. En
el hueco no hay nada. La escena 5 → 6 es el doble de larga porque la tarjeta de
notificación entra con más retardo que el resto.

**Por qué importa:** en un video de producto, un flash negro de 5 fotogramas en un corte
no se lee como pausa deliberada — se lee como error de render. Y el de 10 fotogramas, en el
punto donde el video debería estar en su momento más alto, corta el ritmo justo ahí.

## Hallazgo 2 — El cuadro está vacío al 93%

Ocupación media de la zona de escena en todo el video: **6,69%**. Dicho al revés: el
93,3% del área útil del cuadro está vacía en el promedio del video.

Perfil segundo a segundo (`#` ≈ 3% de ocupación):

| seg | ocup% | | seg | ocup% | | seg | ocup% |
|---|---|---|---|---|---|---|---|
| 0 | 3,67 | | 9 | 8,95 | | 18 | 8,61 |
| 1 | 4,51 | | 10 | 9,82 | | 19 | 8,86 |
| 2 | 4,59 | | 11 | 10,64 | | 20 | 8,86 |
| 3 | 2,91 | | 12 | 10,42 | | **21** | **2,34** |
| 4 | 3,46 | | 13 | 6,62 | | 22 | 4,04 |
| 5 | 4,87 | | 14 | 11,83 | | 23 | 4,06 |
| 6 | 4,95 | | 15 | 12,50 | | 24 | 3,64 |
| 7 | 4,95 | | 16 | 12,50 | | 25 | 4,86 |
| 8 | 4,64 | | 17 | 9,13 | | 26-27 | 4,95 |

**Lectura:** los dos primeros tercios más flojos son justamente los que tienen que
enganchar —el hook (0-3,5 s) y el problema (3,5-8 s) están entre 2,9% y 5,0%—, mientras
que las escenas de datos (14-16 s, 11,8-12,5%) son las más llenas. El video está, por
densidad, al revés de como debería: **entra vacío y se llena recién en el medio.**

**El dato que ordena la discusión de estilo.** El video ya es "minimalista": es más vacío
que la mayoría de las presentaciones de producto de primer nivel. Entonces el problema no
es vaciar más. Si la referencia es Apple, hay que notar que Apple sostiene cuadros de baja
densidad con recursos que este video **no tiene**: un objeto heroico fotografiado con luz
dramática, movimiento de cámara lento y seguro, profundidad de campo, sombras que dan
volumen, y diseño sonoro. Acá la baja densidad no está sostenida por nada: hay tipografía
sobre un fondo plano. Eso es lo que hay que resolver — agregar el peso que la ausencia de
contenido exige, o llenar el cuadro con sustancia.

## Hallazgo 3 — Las capturas muestran números que la auditoría cuestiona

El video usa capturas **reales** de la extensión. Esas capturas exponen cifras en pantalla:

- **Escena 4 (rutas, ~13-17 s):** las tarjetas de ruta visibles muestran `+0,70%`, `+0,45%`,
  `+0,38%` y `RESULTADO: +$13.946,63 ARS`.
- **Escena 5 (simulador, ~17-21 s):** la matriz de escenarios muestra celdas desde
  `-49,99%` hasta `+39,49%`.

La auditoría en curso sostiene que (a) el cálculo de ganancia descarta la comisión de venta
(F-01), (b) las comisiones vienen desactivadas por defecto (F-02), y (c) la conversión
USD→USDT de la matriz está invertida y **sobreestima entre 2,5 y 10,8 puntos porcentuales**
(P-03). Es decir: el video está poniendo en primer plano, y en pantalla grande, justo los
números sobre los que hay dudas abiertas. El guion se cuidó de no afirmarlos con la voz;
las capturas sí los muestran.

## Observaciones cualitativas (inspección de fotogramas)

Inspeccioné los fotogramas uno por uno. Lo que sigue es juicio, no medición.

- **Escena 1 (hook).** `OFICIAL` + `≠` + `USDT` en cuerpo gigante funciona como golpe
  visual: se entiende sin audio. La línea cyan que lo acompaña es muy chica (15 px en
  1080p) y prácticamente no se lee.
- **Escena 2 (problema).** El muro de 49 casillas es la mejor idea del video: comunica la
  escala del problema sin decirla. Pero está resuelto en gris sobre negro y a 19 px, así
  que llega como textura tenue más que como dato; y queda un vacío grande abajo.
- **Escena 3 (cobertura).** La más equilibrada: marco con captura real, `49` en 176 px y
  los tres chips. El barrido azul sobre la captura se lee bien.
- **Escena 4 (rutas).** La más fuerte en contenido: los 4 pasos numerados son claros y
  útiles, y el titular con el acento azul está bien resuelto. Es el momento donde el video
  se siente más producto y menos slide.
- **Escena 5 (simulador).** Bien compuesta, pero la captura de la matriz domina tanto que
  la vista va a los porcentajes dudosos en vez de a la idea ("probá antes de operar").
- **Escena 6 (alertas).** La tarjeta de notificación se lee bien; las dos fantasmas detrás
  son casi invisibles (0,28 y 0,55 de opacidad + blur), así que no llegan a sugerir "pila
  de notificaciones".
- **Escena 7 (cierre).** Limpia y bien compuesta. El logo se ve completo, sin recuadro.

## Lo que NO se puede verificar por ningún medio disponible

- **Cómo suena.** Medí niveles (voz: media −21,3 dB / pico −4,1 dB; música: media −37,4 dB
  duckeada) pero **no puedo juzgar si la voz suena bien ni si la música es del gusto
  correcto**. Ningún agente de este consejo puede oír el video. Que la locución suene
  natural, con las pausas correctas y sin acento raro, **lo tiene que dictaminar el usuario
  escuchándolo**.
- **Percepción en movimiento.** Todo lo anterior se midió fotograma por fotograma. Si las
  animaciones "se sienten" bien al reproducirse (velocidades, eases, si el barrido de la
  escena 3 distrae) es un juicio que requiere verlo correr.
