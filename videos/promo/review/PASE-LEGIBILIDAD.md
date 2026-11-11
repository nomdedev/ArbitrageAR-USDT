# Pase de legibilidad — mobile y PC (v4 / v5)

Corrección de un defecto medible, no de gusto: el texto chico del video estaba por
debajo del tamaño en el que alguien puede leerlo, en **los dos formatos** y por razones
distintas. Nada de contenido cambió: mismos tiempos, mismo guion, mismo audio, mismas
escenas.

    mobile   output/arbitrars-promo-1080x1920-v4.mp4    1080x1920 · 28,300 s · 17,1 MB
    PC       output/arbitrars-promo-1920x1080-v5.mp4    1920x1080 · 28,300 s · 17,2 MB

## 1. El problema, medido

El tamaño que importa no es el que el archivo declara en píxeles, sino el que el ojo
recibe: `px declarado × (ancho real de pantalla ÷ ancho del cuadro)`.

| Texto | Declarado | En un celular (390pt) | En una ventana PC (1280px) |
|---|---|---|---|
| Etiqueta de sección (`FEATURE 02 · RUTAS`) | 14 px | **5,1 pt** | 9,3 pt |
| Pie de página (`MANIFEST V3 · 203 TESTS`) | 13 px | **4,7 pt** | 8,7 pt |
| Etiqueta del kicker de marca | 12,5 px | **4,5 pt** | 8,3 pt |
| Descripción de cada paso de la guía | 18 px | 6,5 pt | 12,0 pt |
| Etiqueta de los campos del simulador | 13 px | **4,7 pt** | 8,7 pt |
| Texto *dentro* de la captura del popup (11-13 px de origen) | — | **4,6-5,5 pt** | 7,3-8,6 pt |

Referencia: 12 pt es el piso cómodo de lectura en pantalla. Todo lo que está en negrita
arriba es ilegible o casi. El formato "PC" no se salva solo: un video 16:9 se consume
mayormente en el teléfono, y ahí ese mismo texto cae a 2,6-3,7 pt.

## 2. Qué se cambió

**Mobile (`tools/build_index.py`, bloque `VERTICAL`)** — piso tipográfico: ningún texto
informativo por debajo de **28 px** (10,1 pt a 390pt).

- Etiqueta de sección 15 → 32 px · chips 15 → 30 px · descripción de paso 17 → 32 px ·
  número de paso 15 → 30 px · valores del simulador 27 → 36 px · etiqueta de campo 13 →
  28 px · sello de la notificación 12,5 → 26 px · línea de stack 15 → 30 px · URL del
  repo 20 → 36 px · línea guía del hook 16 → 30 px · nota del muro 14 → 28 px.
- **Cromo que se elimina en mobile**: el kicker de marca (14 px) y el pie con repo y
  versión (15 px) — a esos tamaños no se leen, se ven como suciedad. En el horizontal
  quedan, pero ahora a 18 px.
- **El teléfono baja de 600×840 a 500×700.** Con el texto más grande, el bloque
  (teléfono + etiqueta + titular + 4 pasos) medía 1440 px y no entraba en los 1050 de la
  zona útil: se salía por arriba y pisaba la marca. Se verificó en el render, no en el
  código.
- **El muro de exchanges se compacta** (26 px, 13 filas): a 28 px empujaba la nota contra
  la banda de captions — 8 errores `content_overlap` que devolvió `check`.

**PC y base compartida (`tools/pase-legibilidad.py`)** — piso de **18 px** (=12 pt a
1280 px): kicker de marca, pie, etiqueta de sección, chips, número de paso, etiqueta de
campo, sello de la notificación, nota del muro, etiqueta del 49, línea guía del hook y
línea de stack. El script hace reemplazos exactos y **aborta si un ancla no aparece**,
así que no puede aplicar un cambio a medias.

## 3. Verificación

| | mobile v4 | PC v5 |
|---|---|---|
| `hyperframes check` | **passed** · 0 errores · layout 0 issues en 12 muestras · **116/116 WCAG AA** | **passed** · 0 errores · layout 0 issues en 12 muestras · **131/131 WCAG AA** |
| Ficha del MP4 (ffprobe) | H.264 1080×1920 · AAC · 28,300 s · 17,1 MB | H.264 1920×1080 · AAC · 28,300 s · 17,2 MB |
| Pico real (ebur128) | −1,5 dBFS | −1,5 dBFS |
| Inspección de fotogramas | al **tamaño real de un celular** (390 px de ancho), en t=2 / 10 / 16,5 / 19,5 s | cuadro completo, antes y después, en t=10 y 16,5 s |

Lo que la inspección confirmó: los 4 pasos de la guía, sus números, las etiquetas y
valores del simulador, la etiqueta de sección y el pie de página se leen; el marco del
teléfono se ve completo, sin cortes, y ya no pisa la marca. Fotogramas en
`review/frames-legibilidad/` (`mobile-v4-pasos-campos.png`,
`mobile-v3-tamano-telefono.png`, `pc-v5-16.5.png`, `pc-v4-16.5.png`,
`comparativa-antes-despues.png`).

## 4. Lo que este pase NO arregla (y es lo que falta decidir)

El texto **dentro de la captura del popup** sigue siendo ilegible: la captura es de
427-430 px de ancho y se muestra a 500 px (mobile) y 424 px (PC), así que su texto
interno queda en 4,6-5,5 pt (mobile) y 7,3-8,6 pt (PC). Se lee como textura, no como
información. La legibilidad del contenido del producto no se arregla con tipografía:
depende de una decisión de diseño, con dos caminos:

1. **Recortar y ampliar la captura por escena** — mostrar la parte que importa (el
   encabezado de precios, la fila de ruta, los campos del simulador) a 2-3× en vez del
   popup entero. Rápido, y no toca ningún texto.
2. **Dibujar esa interfaz en HTML** — la composición ya dibuja los 4 pasos, los campos
   del simulador y la notificación. Legibilidad total, y permite dejar fuera de cuadro
   las cifras que la auditoría cuestiona (F-01, F-02, P-03), que es además lo que más
   riesgo de moderación tiene en plataformas.

Y quedan las decisiones de Fase 2 que ya estaban abiertas: cuál de los dos formatos es
el master, si se recorta el guion (opción C de `GUION-LOCUCION.md`) y si se va a buscar
una captura nítida (DPR 3) de origen.
