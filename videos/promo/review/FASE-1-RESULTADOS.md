# FASE 1 — resultados medidos (v1 → v4)

Puro defecto: correcciones que no dependen de ninguna decisión de contenido. Todo lo que
sigue está medido sobre los MP4 renderizados, con el mismo método para todas las versiones
(los comandos están al final, para que se pueda repetir).

## Qué se implementó

| # | Cambio | Dónde |
|---|---|---|
| 1 | **Cortes duros sin hueco.** El bloque principal de cada escena entra sólo con transformación (nada de `opacity: 0`): el cuadro entrante ya está compuesto en su primer fotograma. Antes, GSAP dejaba invisible el bloque desde el armado de la línea de tiempo y cada corte caía en negro 50-450 ms. | `tools/build_index.py` (bloque de animaciones) |
| 2 | **Push-in por escena.** Un wrapper `.pz` por escena escala 1,00 → 1,03 durante toda su duración: el plano nunca se queda quieto. | `tools/build_index.py` (CSS `.pz` + timeline) |
| 3 | **Cámara dentro de la captura.** La captura del popup escala 1,00 → 1,09 dentro del marco del teléfono, que la recorta. Además, deriva continua de la grilla de fondo durante todo el video (hay movimiento hasta en los cuadros sin animación propia). | `tools/build_index.py` |
| 4 | **Mezcla al estándar web.** Lecho audible (pico −14,0 dBFS, antes −22,1), **eventos musicales** (8 golpes cada 3,5 s: antes un acorde fijo, cero transitorios), ducking suave para que la pausa no sea un agujero, y mezcla final normalizada con `loudnorm` en dos pasadas a −14 LUFS / −1,5 dBTP. | `tools/make_music.py` |

## Antes / después

| Métrica | v1 | v2 | **v4** |
|---|---|---|---|
| Fotogramas con cuadro muerto (Δ < 0,10) | 57,1% | 57,3% | **8,5%** |
| Rachas congeladas ≥ 0,5 s | 6 (peor 1,60 s) | 11 (peor 1,63 s) | **0** |
| Cortes duros en las 6 fronteras de escena | — | 6/6 | **6/6** |
| Tramos escasos (<2% de ocupación) | 6 · 5,83 s | 6 · 5,83 s | **2 · 1,50 s** |
| Sonoridad integrada | −17,5 LUFS | −17,6 LUFS | **−14,0 LUFS** |
| Pico | −4,1 dBFS | −4,0 dBFS | **−1,5 dBFS** |
| Ocupación media de la banda de escena | 3,59% | 3,61% | **4,02%** |

Ocupación por escena (v2 → v4): s1 3,70→4,11 · s2 2,42→2,57 · s3 5,36→5,64 · s4 3,70→4,23 ·
s5 3,84→4,60 · s6 1,88→2,09 · s7 3,89→4,39. Mejora en las siete.

El render v4 pesa 19,2 MB contra 5,9 MB de la v2: al no quedar ningún cuadro idéntico, el
codificador ya no puede ahorrar en cuadros repetidos. Es el precio de que la imagen se mueva.

## Dos correcciones a mis propios informes anteriores

**1. "No hay cortes en el video" era un artefacto de la métrica.** Yo reporté 0 fotogramas
sobre 0,1 de `scene score` y el consejo midió lo mismo (máximo 0,0636), y de ahí salió la
conclusión "no hay una sola decisión de montaje". Es falso: el `scene score` compara
histogramas, y entre dos cuadros oscuros con texto claro —que es todo este video— da valores
bajos aunque el contenido cambie por completo. La métrica correcta es la diferencia de
fotograma a fotograma **en el índice exacto de la frontera**:

| Frontera | Δ en v2 | Δ en v4 |
|---|---|---|
| 3,64 s | 5,60 | **7,21** |
| 8,60 s | 3,04 | **6,86** |
| 14,14 s | 6,02 | **8,54** |
| 18,23 s | 6,37 | **8,74** |
| 21,78 s | 9,84 | 7,25 |
| 25,22 s | 3,28 | **7,74** |

Los cortes existían desde la v1, y ahora son más decididos en cinco de las seis fronteras. Lo
que estaba roto no era la falta de corte: era que **el corte caía sobre un cuadro vacío**.

**2. La "caída de ocupación de 6,68% a 4,00%" no era una caída.** Ese 6,68% lo había medido
con otro umbral y otra escala de cuadro; puesto en la misma vara (mismo umbral de luminancia,
misma banda, misma escala de extracción) la v2 da 3,61% y la v4 4,02%. Comparar números
sacados con métodos distintos fue mi error, no un defecto del video.

## Lo que queda y NO es defecto

El tramo escaso de 1,17 s en 21,83 s (escena de alertas) **no es un cuadro vacío**: lo miré.
El corte entra con la etiqueta "FEATURE 04 · ALERTAS" y el titular "Te avisa solo, cuando
supera tu umbral" ya compuestos; la tarjeta de notificación llega 0,4 s después. Mi umbral del
2% de ocupación llama "vacío" a un cuadro que en realidad es **escaso** — un titular de dos
líneas sobre mucho negro. Eso es el problema de fondo que el consejo llamó "el objeto es
chico, no el video minimalista", y pertenece a la Fase 2 (formato y escala del sujeto), no a
esta fase.

## Comandos para repetir la medición

```bash
# movimiento: diferencia entre fotogramas consecutivos (YAVG por fotograma)
ffmpeg -hide_banner -i V.mp4 -vf "tblend=all_mode=difference,signalstats,metadata=print" -f null -

# corte en una frontera: máximo delta en ±3 fotogramas del índice round(segundos*30)
# sonoridad integrada + true peak
ffmpeg -hide_banner -i V.mp4 -af ebur128=peak=true -f null -

# ocupación: extraer a 6 fps, recortar la banda 10%-86% del alto (excluye el cromo fijo)
# y contar píxeles con luminancia > 40
ffmpeg -y -i V.mp4 -vf fps=6 -q:v 2 review/_occ/o-%03d.jpg
```
