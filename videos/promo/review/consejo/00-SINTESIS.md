# SÍNTESIS DEL CONSEJO — qué cambiar en el video

Tres expertos analizaron el video de forma independiente (dirección de fotografía,
edición y redes, marketing de producto estilo Apple). Este documento cruza sus informes,
separa lo verificado de lo opinable, y ordena el trabajo.

**Informes de origen:** `01-director.md` (378 líneas) · `02-social.md` (335) · `03-apple.md` (445).

---

## 1. El veredicto, medido por el orquestador

No me quedé con lo que dijeron los agentes: volví a medir el MP4 yo mismo. Los tres
diagnósticos centrales se confirman.

| Medición | Resultado | Qué significa |
|---|---|---|
| Cortes (`scene score`) | 0 de 849 fotogramas supera 0,1 (máximo 0,0637) | **Métrica inválida** — ver corrección abajo |
| Cortes reales (Δ cuadro a cuadro en la frontera) | **6 cortes duros**, uno por frontera: Δ 3,04 a 9,84 | Sí hay montaje; el problema era dónde caía |
| Movimiento (diferencia entre fotogramas) | **57,3%** con Δ < 0,10. Con umbral más estricto (Δ < 1,0): **12 rachas ≥0,5 s, la mayor de 5,53 s** | Más de la mitad del video es imagen fija |
| Huecos vacíos | **6**, uno en cada frontera de escena. **1,5 s** acumulados. El peor: **0,51 s en 21,83 s** | Cada corte deja un agujero, y el peor cae en el clímax |
| Sonoridad (EBU R128) | **−17,6 LUFS** integrado · **LRA 3,8 LU** · pico **−4,0 dBFS** | 3,6 LU bajo el estándar web, con 3 dB de pico sin usar y dinámica plana |
| Ocupación del cuadro | **3,61%** promedio en la banda de escena (medido con la misma vara que la v4: 4,02%) | El 96% del área útil está vacía |

## 2. El diagnóstico que explica todo

Los tres llegaron por caminos distintos a la misma causa, y es una sola:

> **El video no es minimalista. Es chico.**

El objeto más grande del film —la interfaz del producto— ocupa **22% del ancho** (la
captura de 428 px se muestra casi 1:1 dentro de un marco de 424 px). En una presentación de
producto de primer nivel el sujeto ocupa entre 60% y 100%, y el aire es *lo que rodea a
algo grande*. Acá el aire es *lo que sobró*.

Sumado: sin cortes no hay montaje (son 7 láminas, una por oración), sin movimiento no hay
cámara (todo es `fromTo` de entrada, nada sobrevive a su propia entrada), y sin dinámica
sonora no hay énfasis. **Vacío + objeto chico + cuadro congelado + sonido constante =
diapositiva.** Eso es exactamente lo que el video es hoy.

## 3. Dónde coinciden los tres (la señal más fuerte)

Los tres expertos, sin verse entre ellos, piden lo mismo. Eso convierte estos puntos en
casi obligatorios:

1. **Cortes duros y eliminar los huecos vacíos.** Hoy no hay un solo corte y cada frontera
   deja 0,25-0,51 s de plantilla vacía con membrete.
2. **Movimiento continuo.** Un push-in o deriva por plano (escala 1,00 → 1,035/1,05) y al
   menos un elemento que no deje de moverse. "Ningún plano quieto más de 0,4 s."
3. **Poner el producto a escala de sujeto.** La interfaz tiene que ocupar el cuadro, no
   flotar en el medio.
4. **Borrar el cromo fijo.** Marca arriba, pie con `v6.0.0 · 203 tests`, hairlines, grilla,
   chips y las captions tipo karaoke presentes en casi todos los cuadros.
5. **El audio tiene que tener eventos y silencios.** Normalizar a **−14 LUFS / −1,5 dBTP**;
   hoy está en −17,6 con LRA 3,8.
6. **Menos palabras y lectura más lenta.** Los tres, por separado, dijeron que el +12% de
   ritmo no hace falta: *"no hace falta acelerar la voz, hace falta dejar de hacer
   silencios"*.

## 4. El hallazgo estratégico: el problema es de formato

Dos de los tres (redes y Apple) llegaron por separado a la misma conclusión, y es la
observación más importante del consejo:

> La interfaz del producto es **vertical** (capturas de 428×599). En un cuadro 16:9 esa
> proporción queda **topada al 22% del ancho**. En 9:16 el mismo contenido llega al **100%
> del ancho y 79% del área**.

Es decir: **buena parte del "93% de cuadro vacío" no es un error de diseño, es el formato
equivocado para el material que tenemos.** El producto es un popup de navegador — una
interfaz en retrato — y lo estamos metiendo en un cuadro apaisado, así que sobra a los
costados por construcción.

Consecuencia práctica: si el destino son reels/shorts, el **master debería ser vertical** y
el horizontal una derivación. Al revés no funciona.

**Estado real del modo vertical:** **implementado y renderizado.** El layout vertical existe
(`compositions/vertical.html`, teléfono arriba / datos abajo, hook apilado, muro en cuatro
columnas), está verificado y su resultado se mide en `review/VERTICAL-9x16.md`: el producto
pasa de ocupar 22,1% del ancho del cuadro a **55,6%**. Las dos versiones existen; la elección
de destino queda abierta.

## 5. Dónde discrepan (y qué me parece)

| Punto | Director | Redes | Apple |
|---|---|---|---|
| Cantidad de planos | 12 | ~16 cortes | **5** |
| Ritmo | montaje clásico | corte por frase | un plano, una idea |

No es una contradicción real: es la misma pelea entre **montaje** (muchos planos, ritmo) y
**plano sostenido** (pocos planos, presencia). Mi lectura para 27 segundos y un solo
producto: **entre 8 y 12 planos**, un sujeto por plano, con el producto apareciendo cerca
del segundo 4-5. Cinco planos en 27 s es demasiado cerca de la diapositiva que queremos
matar; dieciséis cortes con este material es fragmentar algo que todavía no se vio.

## 6. Lo que el consejo midió sobre una versión que ya no es la actual

El consejo analizó la **v1** (27,3 s). Mientras corrían, se implementó la dirección de voz y
se generó la **v2** (28,3 s, `output/arbitrars-promo-1920x1080-v2.mp4`). Después se implementó
la Fase 1 completa, con sus resultados medidos en **`review/FASE-1-RESULTADOS.md`** (v4,
`output/arbitrars-promo-1920x1080-v4.mp4`): cuadro muerto 57,3% → **8,5%**, rachas congeladas
11 → **0**, huecos 5,83 s → **1,50 s**, sonoridad −17,6 → **−14,0 LUFS**.

Ese mismo documento corrige dos afirmaciones de este informe: **"0 cortes" era un artefacto
de la métrica** (el `scene score` es ciego entre dos cuadros oscuros con texto claro: en
realidad hay 6 cortes duros, verificados por diferencia cuadro a cuadro en la frontera), y la
ocupación de 6,68% salía de otro método de medición (puesta en la misma vara, la v1/v2 están
en 3,6% y la v4 en 4,0%).

- **Superado:** el hallazgo de "las 7 pausas idénticas de 0,30 s" (`GAP = 0.30`). La v2 ya
  tiene pausas desiguales por significado: 0,55 / 0,45 / 0,35 / 0,35 / 0,32 / 0,30 s
  (`tools/tts_es.py`), además de `rate` distinto por línea y la pronunciación corregida de
  `USDT` y `ArbitrARS`. El problema del audio que queda es otro: la **mezcla** (LUFS, LRA y
  los silencios digitales en lugar de ambiente), que sigue igual.
- **Sigue vigente todo lo demás**, y lo re-verifiqué sobre la v2: los 0 cortes, el 57,3% de
  cuadro muerto, los 6 huecos (ahora en 3,67 / 8,67 / 14,17 / 18,17 / 21,83 / 25,17 s), el
  −17,6 LUFS y el 6,68% de ocupación.

## 7. Plan de trabajo, en tres fases

### Fase 1 — HECHA Y VERIFICADA (resultados en `review/FASE-1-RESULTADOS.md`)

1. **Cortes duros en cada frontera de escena** y que el plano entrante esté ya compuesto en
   su fotograma 1. Elimina los 6 huecos de un saque. Es el mejor impacto por unidad de
   trabajo de toda la lista.
2. **Movimiento continuo**: un wrapper por escena con push-in 1,00 → 1,035 y un elemento
   permanente en movimiento (el barrido de la captura recirculando, un reloj de 30 s).
3. **Mezcla**: normalizar a −14 LUFS / −1,5 dBTP, y liberar el ducking del lecho dentro de
   las pausas (hoy la pausa es un agujero: el bed queda en −44 y −49 dB ahí).
4. **Un tween sobre algo ya presente** por escena: hoy toda animación es una entrada.

### Fase 2 — requiere una decisión tuya

5. **Formato del master** (vertical vs horizontal) — **las dos están construidas**: ver
   `review/VERTICAL-9x16.md`. Falta sólo decidir cuál es el master y cuál la derivación.
6. **Capturas raster vs interfaz dibujada en HTML.** Dibujarla resuelve tres cosas de una:
   legibilidad en pantalla chica, honestidad (sacar de cuadro las cifras cuestionadas) y
   riesgo de moderación (las plataformas castigan creativos con promesas financieras). La
   composición **ya** dibuja en HTML los 4 pasos, los campos del simulador y la
   notificación: no hay que inventar capacidad nueva.
7. **Recortar el guion** de 64 a ~44 palabras y bajar el ritmo (la "Opción C" que quedó
   documentada en `GUION-LOCUCION.md` sin aplicar, porque cambia lo que dice el guion).
8. **Borrar el cromo fijo** y las captions karaoke.

### Fase 3 — bloqueada por la auditoría

9. **Mostrar cualquier cifra de rentabilidad exige corregir antes F-01, F-02 y P-03** y
   re-renderizar con capturas nuevas. Los tres expertos lo marcaron por su cuenta: hoy el
   video expone en pantalla grande `RESULTADO: +$13.946,63 ARS`, `+0,70%` y la matriz de
   −49,99% a +39,49%.

## 8. Lo que nadie del consejo pudo hacer

- **Oír el video.** Los tres lo declararon como bloqueante. Los niveles se miden; si la
  locución suena natural lo tiene que decidir el usuario. Para eso está
  `review/audicion-pronunciacion.mp3`.
- **Ver las imágenes.** Está comprobado que los agentes delegados no reciben adjuntos. Por
  eso cada uno midió con ffmpeg en lugar de mirar, y el diagnóstico salió más duro y más
  preciso que una opinión: los números que encontraron (0 cortes, 57% congelado, −17,6
  LUFS) no son interpretables de otro modo.
- **Mostrar la interfaz actualizándose.** El stack puede simular interacción (un clic, un
  campo que se escribe), pero no que la UI se actualice sola en vivo.
