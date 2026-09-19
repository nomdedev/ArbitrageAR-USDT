# LÍNEA BASE VISUAL Y DE UX — Página de configuración (`src/options.html`)

Medición hecha sobre el HTML/CSS real, renderizado en Chromium a 1264px de ancho.
Captura completa: `docs/auditoria-2026-09/baseline-visual/00-pagina-completa.png` (1264 × 5808 px).
Fecha: 2026-09-19 · Commit `5fdfa9e`.

Esta es la referencia contra la que se mide el rediseño. Todo lo que sigue son números medidos,
no impresiones.

## 1. Dimensiones y estructura

| Métrica | Valor medido |
|---|---|
| Alto total de la página | **5.808 px** (≈ 7 pantallas de 800px) |
| Ancho del contenedor | 1.264 px (sin `max-width`: se estira con la ventana) |
| Secciones (`.card`) | 8 |
| Controles `<input>` | **180** |
| — de los cuales checkbox | **156 (87%)** |
| — number | 15 |
| — url | 4 |
| — text | 1 |
| — radio | 2 |
| `<select>` | 4 |
| `<button>` | 7 |
| Navegación / índice / buscador | **ninguno** |

## 2. Reparto del peso por sección (alto real renderizado)

| # | Sección | Alto | Inputs | Checkboxes |
|---|---|---|---|---|
| 1 | 💵 Precio del Dólar | 510 px | 20 | 17 |
| 2 | 🔄 Exchanges P2P | **1.115 px** | 40 | 40 |
| 3 | 🏛️ Exchanges Tradicionales | 821 px | 36 | 36 |
| 4 | 💎 Exchanges USDT para Rutas | 964 px | 36 | 36 |
| 5 | 🎨 Interfaz | 333 px | 12 | 8 |
| 6 | 💸 Fees y Comisiones | 641 px | 7 | 0 |
| 7 | 🔔 Notificaciones | 431 px | 19 | 16 |
| 8 | 🔧 Avanzado | 600 px | 10 | 3 |

**Lectura:** las secciones 2, 3 y 4 suman 2.900 px (50% de la página) y **112 checkboxes
(62% de todos los controles)**. Son tres muros de casillas de exchanges. No hay buscador, ni
filtro, ni agrupación, ni chips de resumen. El usuario que sólo quiere "elegir dos exchanges"
tiene que recorrer 112 casillas.

## 3. Sistema visual actual

| Token | Valor medido |
|---|---|
| Fondo de página | `rgb(13, 17, 23)` (casi negro azulado) |
| Texto | `rgb(230, 237, 243)` |
| Fuente | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Tamaño base | **13px** (por debajo del mínimo cómodo de lectura; Apple usa 17px) |
| Acento | azul/violeta en botón primario y radios |
| Contenedor | sin ancho máximo; se estira a todo el ancho del navegador |

Contraste con el sistema Apple de referencia (`DESIGN-REFERENCIA-APPLE.md`): fondo `#f5f5f7` o
`#000000` con ritmo alternado, tipografía base 17px, un único acento `#0071e3`, contenido
limitado a 980px centrado, tarjetas sin borde.

## 4. Fricción medida en las tareas típicas

| Tarea | Costo actual |
|---|---|
| Guardar cualquier cambio | El único botón es `#save-settings` (`options.html:1233`), dentro de `<footer class="footer">` (`:1232`). **No es sticky ni fixed** (`options.css:759-767` no declara `position`). → El usuario debe recorrer 5.808 px hasta el fondo para guardar. |
| Resetear todo | Botón `#reset-settings` **inmediatamente al lado** de Guardar (`:1234`). Máximo riesgo de error humano en el peor lugar posible. |
| Elegir exchanges | Recorrer hasta 112 checkboxes repartidos en 2.900 px. Hay atajos por sección ("Todos / Ninguno / Solo los principales"), pero no hay vista consolidada ni búsqueda. |
| Entender si hay cambios sin guardar | No hay indicador de estado sucio ni aviso al cerrar con cambios pendientes (no se encontró `beforeunload`). |
| Encontrar una opción puntual | Sin buscador ni índice: hay que saber en qué sección está. |

## 5. Qué debe resolver el rediseño (derivado de las mediciones)

1. **Sacar el guardado del fondo de la página**: barra de acciones persistente y/o autoguardado
   con estado visible ("Guardado" / "Cambios sin guardar").
2. **Colapsar los 112 checkboxes** de exchanges: selección por defecto razonable + resumen con
   chips ("3 exchanges seleccionados") + búsqueda, y el detalle colapsado.
3. **Navegación lateral** con las 8 secciones, para que la página no sea un scroll de 5.808 px.
4. **Subir el tamaño tipográfico base** de 13px a 15-17px y limitar el ancho de contenido
   (~980px centrado) — hoy los textos largos cruzan 1.264px.
5. **Separar Reset de Guardar** y pedir confirmación.
6. **Un solo acento** y jerarquía por superficies, no por bordes (hoy las tarjetas usan
   `border: 1px solid` + radios grandes).

## 6. Cómo se va a verificar la mejora

Repetir exactamente esta medición sobre el resultado y comparar la tabla:

- alto total de la página,
- cantidad de scrolls hasta el botón de guardar,
- cantidad de controles visibles al abrir (vs. colapsados),
- ancho máximo de línea de texto,
- tamaño base de fuente,
- cantidad de acentos de color distintos.

Sin esa comparación numérica, "más moderno y más simple" es una opinión.
