# AUDIO — el video va mudo (sin voz y sin música)

Estado: implementado y verificado en los dos formatos. Renders vigentes:
`output/arbitrars-promo-1920x1080-v8.mp4` (PC) y `output/arbitrars-promo-1080x1920-v7.mp4` (mobile),
26,867 s cada uno, **0 pistas de audio**.

## Cómo se llegó acá (tres versiones, dos rechazos)

| # | qué tenía | qué pasó |
|---|---|---|
| 1 | Voz `es-AR-TomasNeural` (`rate` +8/+12%, `pitch` sin usar) + cama de **La menor con novena**, lowpass 1.100 Hz, eco y golpe de 55 Hz cada 3,5 s | rechazado: la voz sonaba a locutor institucional y la música era tétrica. Tenía razón: un acorde menor con novena, apagado y con subgraves, es oscuro por construcción |
| 2 | Una sola voz con registro de arquetipo (grave, rápido, irónico) + lecho en **mayor** I-V-vi-IV con pulso y shaker | rechazado: la voz no queda bien en ninguno de los dos formatos |
| 3 | **Sin voz y sin música.** El video va mudo | actual |

Por qué los rechazos llegaron tarde: hay tres informes de expertos sobre el video (1.158 líneas) y
su propia síntesis, en la sección 8, dice que **ninguno pudo oírlo** — la escucha quedaba para el
usuario y nunca se pidió. Se eligió por argumentos técnicos y se entregó sin validación de oído.
Eso fue error del agente, no del consejo.

## El detalle técnico que importa: el reloj

El video no se sostiene sin su reloj. La duración total, los cortes de escena y **cada palabra** de
los captions salen de los tiempos reales de la locución (`audio/timeline.json` + `audio/words.json`,
timestamps de WordBoundary de edge-tts). Sacar el audio sin más habría dejado al video sin reloj.

Por eso la locución **no se borró del proyecto**: sigue siendo el reloj silencioso (26,80 s de
narración → 26,867 s de video). Lo que se sacó es el elemento de audio de la composición:

- antes: `<audio id="mix" src="audio/mix_final.wav" data-duration="26.86">`
- ahora: `<!-- sin audio: la voz se sacó del video -->`
- `tools/build_index.py` sin flags = mudo · `--con-audio` lo vuelve a embeber

## Verificación (medida)

| control | resultado |
|---|---|
| Pistas de audio en el render | **0** (`ffprobe -select_streams a`) en los dos formatos |
| Duración | 26,867 s en los dos: el reloj se conserva |
| Video | H.264 1920×1080 (17,2 MB) · H.264 1080×1920 (16,6 MB) |
| `hyperframes check --samples 12` | passed · 0 errores · 129/129 textos pasan WCAG AA |
| Fotogramas inspeccionados | PC t=3,2 s (hook) y mobile t=21 s (alerta): dentro del cuadro, sin superposiciones ni cortes |

Mientras había voz, el audio del render se verificaba por correlación con la locución cruda
(`tools/verificar-audio.py`, `r = 0,9980`; el mismo test sobre el render con música daba
`r = -0,0037`, o sea que discrimina). Con el video mudo esa comparación ya no aplica: lo que se
verifica ahora es la ausencia de pista y el reloj por duración.

## Cómo se vuelve atrás (si algún día lo pedís)

    python tools/tts_es.py --voz narrador          # regenera la locución (o --voz contraste)
    python tools/make_music.py                     # mezcla: voz sola (--con-musica agrega lecho)
    python tools/build_index.py --con-audio && python tools/build_index.py --vertical --con-audio
    npx --yes hyperframes@0.8.50 render -o output/<pc>.mp4
    npx --yes hyperframes@0.8.50 render -c compositions/vertical.html -o output/<mobile>.mp4

`review/audicion-voces.mp3` (56,6 s, 11 fragmentos numerados) queda como referencia de registros
si en algún momento se retoma la voz. Nada de lo elegido clona una voz real: es catálogo de
edge-tts más `rate` y `pitch`.

## Pendiente, y no es de audio

El texto **dentro** de la captura del popup sigue por debajo del piso de lectura: la captura es de
428 px y se muestra a 524 px (PC) o 500 px (mobile). Decisión tomada y sin hacer: **recortar y
ampliar la captura por escena a 2-3×**, mostrando solo la parte que importa (encabezado de precios,
fila de ruta, campos del simulador).
