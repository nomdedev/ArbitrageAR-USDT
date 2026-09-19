# GUION DE LOCUCIÓN — ArbitrARS

Dirección de voz del video. Define **qué dice la voz, cómo lo pronuncia y dónde calla**.
Todo lo que está acá es implementable con el motor real (edge-tts): el control se hace por
tres vías, porque el motor **ignora SSML** — no acepta `<break>`, `<phoneme>` ni `<prosody>`:

| Se controla | Cómo | Parámetro real |
|---|---|---|
| Pronunciación | **reescribiendo el texto** que se le manda al motor | el texto en sí |
| Velocidad y tono | por utterance | `rate`, `pitch` |
| Pausas entre escenas | silencio insertado entre utterances | duración del gap |
| Pausas internas | puntuación (la coma pesa ~0,2 s; el punto ~0,35 s) | — |

Regla de oro del sistema: **el texto que se pronuncia y el texto que se ve son distintos.**
A la pantalla va la grafía correcta (`USDT`, `ArbitrARS`); al sintetizador va la forma
fonética. Los subtítulos se sincronizan por palabra igual, porque el generador guarda el
mapa de qué palabras pronunciadas corresponden a cada palabra escrita.

---

## 1. Estilo de voz (definición)

**Voz: `es-AR-TomasNeural`** — masculina, rioplatense, la única voz argentina masculina
disponible en el motor. Es la elección por defecto.

*Por qué esta y no otra:* el producto es argentino y la audiencia también; el tema (dólar
oficial contra USDT) es local. Una voz neutra o peninsular suena a banco extranjero
explicando algo que no vive. La alternativa equivalente es `es-AR-ElenaNeural` (femenina) —
cambiar de una a otra es una línea en `tools/tts_es.py`.

**Registro:** el de alguien que sabe y no necesita convencerte. No es publicidad: es un
dato. Cero entusiasmo de vendedor, cero exclamaciones, cero urgencia artificial. La idea
que gobierna toda la lectura: *"esto ya está pasando y vos todavía no lo estás viendo"*.

**Actitud por tramo:**

- Escenas 1-2 (planteo): **constata**, no anuncia. Es un hecho del mercado, no una noticia.
- Escenas 3-6 (producto): **describe**. Presenta lo que la herramienta hace, sin adjetivos.
- Escena 7 (cierre): **baja el ritmo y la voz**. Casi confidencial. Es la garantía.

**Parámetros base:**

| Parámetro | Valor | Motivo |
|---|---|---|
| `rate` base | **+12%** | ritmo informativo, sin arrastrar |
| `pitch` | **0** (sin cambio) | no forzar gravedad artificial |
| `volume` | 0 (sin cambio) | se nivela después en la mezcla |

**Variación por línea** (el `rate` no es constante: es dirección):

| Escena | `rate` | Por qué |
|---|---|---|
| 1 — hook | **+8%** | más lento que el resto: la premisa necesita peso |
| 2 — problema | +12% | seco, sin énfasis dramático |
| 3 — cobertura | **+8%** | se dice el nombre del producto: hay que entenderlo |
| 4 — rutas | +14% | enumeración: acá la velocidad da sensación de método |
| 5 — simulador | +12% | invitación, ritmo medio |
| 6 — alertas | +14% | el alivio es rápido, no solemne |
| 7 — cierre | **+6%** | el más lento del video: cierra y se queda |

---

## 2. Pronunciación — qué se dice y qué se le manda al motor

Ésta es la tabla central. La columna "se le envía" es literal: es el texto que va al
sintetizador.

| En pantalla | Se le envía | Por qué |
|---|---|---|
| **USDT** | `u ese de té` | En Argentina el acrónimo se dice letra por letra. El motor lo lee como una palabra suelta de 0,51 s (medido sobre la síntesis actual): ininteligible. La forma fonética ocupa ~1,2 s, que es lo que tarda de verdad. |
| **ArbitrARS** | `Arbitr a erre ese` | El nombre es un juego: *Arbitra* + *ARS* (el código del peso argentino). Leído como palabra suelta (0,79 s, medido) ese juego se pierde por completo. Deletrear las tres últimas hace que el chiste llegue — es el único lugar del video donde se nombra el producto. |
| **exchange / exchanges** | `exchange` (sin cambios) | La síntesis actual lo resuelve en 0,61 s, que es una duración plausible para la forma rioplatense del anglicismo. No se toca: reescribirlo a "exchench" arriesga empeorarlo. |
| **49** | `49` | El motor lee números en español correctamente ("cuarenta y nueve"). |
| **30 segundos** | `30 segundos` | Sin cambios. |
| **simulá** | `simulá` | Voseo rioplatense, correcto para la audiencia. No neutralizar a "simule". |
| dólar, oficial, brecha, umbral, rentabilidad, navegador | sin cambios | Sin riesgo fonético en es-AR. |

**Términos que NO se pronuncian nunca** (existen sólo en pantalla y no deben entrar a la
voz): CriptoYA, DolarAPI, USDT/ARS, Spot, P2P, Manifest V3, los nombres de los exchanges.
La voz no lee la interfaz.

---

## 3. Guion completo, línea por línea

Cada línea trae: lo que se dice, la forma que va al motor, la intención, dónde va el peso,
y cuánto se calla después.

---

### ESCENA 1 · entrada 0,00 s

> **Se dice:** El dólar oficial y el USDT no valen lo mismo.
> **Se le envía:** `El dólar oficial y el u ese de té no valen lo mismo.`
> **Intención:** constatar. Es un hecho del mercado, no una denuncia.
> **Peso:** en *oficial* y en *USDT* — son los dos términos del contraste. *lo mismo* cae,
> no sube: la frase termina hacia abajo.
> **Rate:** +8% · **Pausa interna:** ninguna (la línea va de un tirón, es una sola idea).
> **Pausa después:** **0,55 s** — la más larga del video. Es el silencio que deja instalada
> la premisa antes de complicarla. Sin esta pausa, la escena 2 pisa el hook.

### ESCENA 2 · entrada 3,52 s

> **Se dice:** Esa diferencia es real. Medirla a tiempo, no.
> **Se le envía:** *(sin cambios)*
> **Intención:** reconocer, y después negar. La primera frase concede; la segunda es la que
> duele.
> **Peso:** en *real*, y sobre todo en el **no** final — es la palabra que la escena 2
> entera está sosteniendo.
> **Rate:** +12% · **Pausa interna:** el punto entre *real* y *Medirla* ya produce ~0,35 s.
> Es la única pausa interna larga del guion y hay que cuidarla.
> **Pausa después:** 0,45 s.

### ESCENA 3 · entrada 8,23 s

> **Se dice:** ArbitrARS la mide sobre 49 exchanges, cada 30 segundos.
> **Se le envía:** `Arbitr a erre ese la mide sobre 49 exchanges, cada 30 segundos.`
> **Intención:** presentar. Primera vez que se nombra el producto en todo el video, y única.
> **Peso:** en el **nombre del producto** (tiene que quedar claro: es lo único que el
> espectador tiene que retener de esta línea), y en *cada 30 segundos*.
> **Rate:** +8% — la línea más lenta de las de producto. Acá no se corre.
> **Pausa interna:** la coma después de *exchanges* da ~0,2 s, justo lo necesario para
> separar el alcance de la frecuencia.
> **Pausa después:** 0,35 s.

### ESCENA 4 · entrada 13,33 s

> **Se dice:** Te ordena las rutas por rentabilidad, con la guía paso a paso.
> **Se le envía:** *(sin cambios)*
> **Intención:** describir. Sin adjetivos.
> **Peso:** en *rentabilidad* y en *paso a paso* (las dos mitades de la promesa: el orden y
> el método).
> **Rate:** +14% — la enumeración se acelera.
> **Pausa interna:** la coma después de *rentabilidad*.
> **Pausa después:** 0,35 s.

### ESCENA 5 · entrada 17,42 s

> **Se dice:** Simulá tu monto y tus comisiones antes de operar.
> **Se le envía:** *(sin cambios)*
> **Intención:** invitación, imperativo suave. No es una orden, es una sugerencia de alguien
> que ya sabe lo que te va a pasar si no lo hacés.
> **Peso:** en *simulá* y en *antes de operar*.
> **Rate:** +12% · **Pausa interna:** la coma implícita después de *comisiones*.
> **Pausa después:** 0,32 s.

### ESCENA 6 · entrada 20,92 s

> **Se dice:** Y te avisa solo cuando la brecha supera tu umbral.
> **Se le envía:** *(sin cambios)*
> **Intención:** alivio. La carga se corre del usuario a la herramienta.
> **Peso:** en *solo* y en *tu umbral* — el posesivo importa: el umbral es del usuario.
> **Rate:** +14%.
> **Pausa después:** 0,30 s.

### ESCENA 7 · entrada 24,41 s

> **Se dice:** Todo en tu navegador, sin servidores.
> **Se le envía:** *(sin cambios)*
> **Intención:** cerrar con la garantía. Bajar la voz. Es lo último que queda sonando.
> **Peso:** en *navegador* y en *sin servidores* — la segunda parte es la promesa real.
> **Rate:** +6% — el más lento del video.
> **Pausa después:** ninguna; el video termina en la última sílaba.

---

## 4. Pausas — resumen

| Después de | Duración | Para qué |
|---|---|---|
| Escena 1 (hook) | **0,55 s** | dejar instalar la premisa |
| Escena 2 (problema) | 0,45 s | asimilar el "no" |
| Escena 3 (cobertura) | 0,35 s | que se lea el nombre del producto |
| Escena 4 (rutas) | 0,35 s | — |
| Escena 5 (simulador) | 0,32 s | — |
| Escena 6 (alertas) | 0,30 s | — |
| Escena 7 (cierre) | — | fin del video |

Total de silencio: **2,32 s** (contra 1,80 s de la versión actual: +0,52 s, y todo el
agregado está en los dos primeros cortes, que es donde la medición mostró el cuadro más
vacío y por lo tanto donde más falta hace el aire).

---

## 5. Duración resultante y el límite

Con el guion de 63 palabras, el `rate` variable de la tabla y las pausas de arriba, la
locución queda en el orden de **27-28,5 s** (contra 27,26 s actuales). El video se mantiene
dentro del rango pedido de 20-30 s.

**Si se quiere una lectura más lenta** —el otro camino para acercarse al ritmo de un film
de producto, donde la voz no compite con nada— hay que bajar el `rate` base y **recortar
palabras**, porque no entran las dos cosas:

| Opción | `rate` base | Palabras | Locución | Video |
|---|---|---|---|---|
| **A (actual)** | +12% | 63 | 27,3 s | 27,3 s |
| **B (recomendada si se prioriza la calma)** | +6% | 63 | 28,4 s | 30,7 s — **se pasa del límite** |
| **C (ritmo de film, dentro del límite)** | +6% | 53 | 23,9 s | ~26 s |

La opción C recorta 10 palabras: *"Esa diferencia es real"* (escena 2), *"con la guía"*
(escena 4), *"tu"* y *"y tus"* (escena 5) y *"solo"* (escena 6). Ninguna de esas palabras
cambia lo que el video afirma; todas son relleno rítmico. **No la aplico sin decisión
explícita del usuario, porque cambia lo que dice el guion.**

---

### Resultado medido (implementado y verificado)

Generado con `python tools/tts_es.py`. Locución total: **28,24 s** en 64 palabras.
Video final: **28,30 s**. La voz arranca en 0 y la última palabra termina en 27,34 s.

| Escena | Entrada | Duración | `rate` | Pausa después | Palabras |
|---|---|---|---|---|---|
| 1 | 0,00 s | 3,34 s | +8% | 0,55 s | 10 |
| 2 | 3,89 s | 4,42 s | +12% | 0,45 s | 8 |
| 3 | 8,75 s | 5,09 s | +8% | 0,35 s | 9 |
| 4 | 14,19 s | 3,74 s | +14% | 0,35 s | 12 |
| 5 | 18,28 s | 3,19 s | +12% | 0,32 s | 9 |
| 6 | 21,80 s | 3,12 s | +14% | 0,30 s | 10 |
| 7 | 25,22 s | 3,02 s | +6% | — | 6 |

**Que las formas fonéticas efectivamente se aplicaron se verifica por conteo de tokens**,
sin necesidad de oír: el motor devolvió 13 tokens para las 10 palabras de la escena 1 (el
`USDT` se convirtió en cuatro: *u · ese · de · té*) y 11 tokens para las 9 palabras de la
escena 3 (`ArbitrARS` → *Arbitr · a · erre · ese*). Antes de la dirección, esas escenas
devolvían 10 y 8 tokens: el acrónimo entraba como una sola palabra.

**Alineación de subtítulos:** 62 de 64 palabras quedaron con timestamp por coincidencia
exacta; las 2 restantes (`30` y `segundos.`, que el motor fusiona en un solo token) se
resolvieron por interpolación proporcional. El orden temporal de las 64 palabras es
correcto y ninguna quedó con duración no positiva.

---

## 6. Lo que NO se puede verificar desde acá

Ningún agente de este proyecto —ni el que escribe esto— puede **oír** el resultado. Se
pueden medir duraciones, niveles y sincronización, pero no se puede dictaminar si la voz
suena natural, si el acento es correcto o si alguna palabra quedó mal pronunciada.

Para eso está **`review/audicion-pronunciacion.mp3`**: un archivo corto con las
pronunciaciones candidatas de los términos en discusión, para escuchar y elegir. Qué es
cada fragmento está en `review/audicion-pronunciacion.txt`. Los únicos tres puntos que
requieren oído humano son: **cómo suena `USDT`**, **cómo suena `ArbitrARS`**, y si el
ritmo del cierre (+6%) suena demasiado lento.
