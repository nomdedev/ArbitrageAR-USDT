# Variante vertical 9:16 — 1080×1920

Segunda entrega de formato: la **misma** composición, los mismos tiempos, los mismos textos y
el mismo audio, con otra disposición. No es un recorte del horizontal: es un layout propio,
porque el hallazgo número uno del consejo fue justamente que el formato estaba mal elegido
para el material que tenemos.

    output/arbitrars-promo-1080x1920.mp4    1080×1920 · 28,300 s · 17,6 MB

## Por qué existe

La interfaz del producto es **retrato** (las capturas son de 428×599). En un cuadro 16:9 esa
proporción queda topada al 22% del ancho y el resto del cuadro se lee como vacío. En 9:16 el
mismo producto puede ocupar más de la mitad del ancho, que es lo que el consejo pidió: el
objeto a escala de sujeto.

| | horizontal | vertical |
|---|---|---|
| Ancho del producto dentro del cuadro | 424 / 1920 = **22,1%** | 600 / 1080 = **55,6%** |
| Ocupación de la banda útil (media) | 4,02% | **5,55%** |
| Ocupación máxima | 6,85% | **10,64%** |
| Sonoridad / pico | −14,0 LUFS / −1,5 dBFS | −14,0 LUFS / −1,5 dBFS (el mismo audio) |
| Fotogramas con cuadro muerto | 8,5% | 12,3% |
| Duración · cortes · WCAG | 28,300 s · 6/6 · 137/137 | 28,300 s · 6/6 · 137/137 |

Dos aclaraciones sobre esa tabla, para no comparar peras con manzanas:

- **"Cuadro muerto" no es comparable entre formatos.** La métrica es sobre el cuadro entero y
  el vertical tiene 440 px de alto que están vacíos a propósito (la zona que en un feed tapa
  la interfaz de la app). Ese tercio quieto engorda el número. Medida sólo la banda útil, el
  vertical se mueve igual que el horizontal.
- **La ocupación en % tampoco es comparable directo**, porque las bandas medidas tienen
  distinto tamaño (820 px de alto en el horizontal, 1056 en el vertical). Lo que sí es
  comparable y es el punto: **el producto pasó de 22,1% a 55,6% del ancho del cuadro.**

## Cómo se construye y se renderiza cada una

```bash
python tools/build_index.py                          # index.html          1920x1080
python tools/build_index.py --vertical               # compositions/vertical.html  1080x1920

npx hyperframes render -o output/arbitrars-promo-1920x1080-v4.mp4                    # horizontal
npx hyperframes render -c compositions/vertical.html -o output/arbitrars-promo-1080x1920.mp4
```

## Tres restricciones del framework que costaron tiempo (y quedan documentadas)

**1. Un proyecto puede tener UNA sola composición raíz.** Poner la variante en la raíz como
`index-vertical.html` hace fallar el chequeo con un **error** (`multiple_root_compositions`),
y además invalida el resto del chequeo: las pasadas de layout y contraste corren sobre 0
muestras y devuelven "todo bien" sin haber mirado nada. Las variantes van en `compositions/`,
que es donde el propio CLI busca con `-c`.

**2. `check` no tiene selector de composición** (sólo `render` lo tiene). Para verificar la
vertical se copia sobre `index.html`, se chequea, y se **regenera** el horizontal — que es
seguro justamente porque el generador es determinista:

```bash
cp compositions/vertical.html index.html
npx hyperframes check --samples 12
python tools/build_index.py      # deja index.html como el horizontal otra vez
```

**3. Un servidor de Studio en marcha reescribe la composición.** Si el Studio
(`npm run dev`, puerto 3002) está corriendo, vigila la carpeta y **reescribe el HTML de la
composición** inyectando atributos `data-hf-id` en cada elemento, para su línea de tiempo.
Verificado aislando la causa: recién generado el archivo son 55.101 bytes con 0 `data-hf-id`;
quince segundos después, **sin correr ningún otro comando**, son 60.630 bytes con 100
`data-hf-id`. No rompe nada —el render lo acepta y el generador sigue siendo la fuente de
verdad—, pero explica por qué el archivo cambia de tamaño solo y por qué no conviene editarlo
a mano con el Studio abierto.

## Qué cambia en el layout

El bloque de ajustes vive al final del CSS de la composición y gana por orden de cascada.

| Pieza | Horizontal | Vertical |
|---|---|---|
| Escena 1 (hook) | OFICIAL ≠ USDT en fila, 148 px | **apilado en columna**, 128 px |
| Escena 2 (muro) | 7 columnas, el "49" arriba a la derecha | **4 columnas**, el "49" centrado y primero |
| Escenas 3-5 (producto) | teléfono 424×594 a la izquierda, texto a la derecha | **teléfono 600×840 arriba**, texto centrado abajo |
| Escena 6 (alertas) | notificación a la derecha, texto a la izquierda | **notificación arriba**, texto abajo |
| Zona útil | 10%–86% del alto | 12%–67% (deja 440 px libres para la interfaz del feed) |

## Verificación

- `check` del proyecto: **0 errores** · layout 0 issues en 9 muestras · **137/137 WCAG**.
- Render sin errores; ficha del MP4 por ffprobe: H.264 1080×1920 @30, AAC 28,300 s.
- **Inspección visual** de cuatro fotogramas (`review/frames-vertical/`): hook, muro, feature y
  alertas. Tipografía cargada, captura dentro del marco, nada cortado, pisado ni desbordado.
- Los assets (fuentes, capturas, audio) resuelven bien desde `compositions/`: el audio del MP4
  mide exactamente lo mismo que el del horizontal (−14,0 LUFS).

## Lo que queda pendiente y es honesto decir

1. **Nitidez.** La captura es de 428 px de ancho y se muestra a 600: se amplía 1,4×. Se ve
   bien, pero no es nítida como podría. Arreglarlo requiere **re-capturar el popup a DPR 3**, y
   eso choca de frente con el bloqueo de honestidad: las capturas actuales muestran cifras
   (rentabilidad, matriz de riesgo) que dependen de F-01, F-02 y P-03. O se corrigen esos
   hallazgos primero, o se re-captura sin esas cifras en cuadro.
2. **El tercio inferior vacío.** Es deliberado (ahí va la interfaz de la app en un feed), pero
   visto suelto, fuera de una plataforma, se lee como espacio desperdiciado.
3. **La decisión de destino sigue siendo tuya.** Ahora están las dos y se pueden comparar:
   horizontal para README, landing o YouTube; vertical para reels, shorts y TikTok.
