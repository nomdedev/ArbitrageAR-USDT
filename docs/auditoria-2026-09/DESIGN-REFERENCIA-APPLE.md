# DESIGN-REFERENCIA — Sistema Apple (destilado para el rediseño de la página de configuración)

Fuente: `awesome-design-md/design-md/apple/DESIGN.md` (colección de design systems de referencia).
Se guarda acá como insumo verificable del rediseño: cada token que se implemente debe poder
rastrearse hasta esta tabla.

## 1. Principio rector

Apple no decora: **retira**. El objeto (acá: los datos de arbitraje y la configuración) manda,
la interfaz desaparece. Consecuencias obligatorias para nuestra página de opciones:

- Sin gradientes, sin texturas, sin patrones de fondo. Solo color plano.
- Sin bordes visibles en tarjetas y contenedores (Apple casi no usa `border`).
- Una sola sombra suave, o ninguna. La jerarquía se logra por **contraste de fondo**, no por sombra.
- **Un único color de acento** (`#0071e3`) reservado exclusivamente a lo interactivo.
- Ritmo por bloques de color: alternar `#000000` / `#f5f5f7` / `#ffffff` para separar "escenas".

## 2. Tokens de color

| Rol | Valor | Uso |
|---|---|---|
| Fondo oscuro | `#000000` | secciones inmersivas |
| Fondo claro | `#f5f5f7` | fondo de página / secciones informativas |
| Texto principal (claro) | `#1d1d1f` | títulos y cuerpo sobre fondo claro |
| Texto principal (oscuro) | `#ffffff` | texto sobre negro |
| Texto secundario | `rgba(0,0,0,0.8)` | navegación, texto de apoyo |
| Texto terciario / deshabilitado | `rgba(0,0,0,0.48)` | estados deshabilitados, ayuda |
| Acento (interactivo) | `#0071e3` | CTA, foco, controles activos |
| Link en fondo claro | `#0066cc` | links de texto |
| Link en fondo oscuro | `#2997ff` | links sobre negro |
| Superficie oscura (tarjeta) | `#272729` … `#2a2a2d` | tarjetas sobre fondo negro |
| Botón activo (pressed) | `#ededf2` | estado presionado |
| Botón filtro | `#fafafc` | fondo de controles tipo filtro/búsqueda |
| Sombra de tarjeta | `0 3px 30px rgba(0,0,0,0.22)` | única elevación permitida |

**Prohibido:** introducir cualquier otro color de acento (verde/rojo/naranja como decoración).
Si se necesita semántica de estado (error/alerta), se usa color solo en el mensaje, nunca como
decoración de la interfaz.

## 3. Tipografía

Familia: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI",
Helvetica Neue, Arial, sans-serif`. (En Windows el equivalente de sistema es Segoe UI; la pila
respeta el fallback de Apple en macOS.)

Regla de tamaño óptico: **≥20px → Display; <20px → Text**. Nunca mezclar criterio.

| Rol | Tamaño | Peso | Line-height | Letter-spacing |
|---|---|---|---|---|
| H1 (título de página) | 40px | 600 | 1.10 | normal |
| H2 (título de sección) | 28px | 400 | 1.14 | 0.196px |
| Título de tarjeta | 21px | 600 | 1.19 | 0.231px |
| Cuerpo | 17px | 400 | 1.47 | -0.374px |
| Cuerpo énfasis / label | 17px | 600 | 1.24 | -0.374px |
| Botón | 17px | 400 | — | normal |
| Link | 14px | 400 | 1.43 | -0.224px |
| Caption / descripción | 14px | 400 | 1.29 | -0.224px |
| Caption bold | 14px | 600 | 1.29 | -0.224px |
| Micro (ayuda, notas) | 12px | 400 | 1.33 | -0.12px |

Reglas: **letter-spacing negativo en todos los tamaños** (incluso cuerpo); títulos con
line-height comprimido (1.07–1.14); nunca peso 800/900 (máximo 700, excepcional).

## 4. Radios y elevación

| Token | Valor | Uso |
|---|---|---|
| Micro | 5px | contenedores chicos, etiquetas |
| Estándar | 8px | botones, tarjetas |
| Cómodo | 11px | inputs de búsqueda, controles de filtro |
| Grande | 12px | paneles de features |
| Píldora | 980px | CTA tipo link ("Más información") |
| Círculo | 50% | controles circulares |

Elevación: **Level 0 = plano sin sombra** (por defecto). Level 1 = la sombra de tarjeta de la
tabla de color. Nada más. La profundidad se logra por contraste de superficie.

## 5. Componentes clave

- **CTA primario**: fondo `#0071e3`, texto blanco, `padding: 8px 15px`, radio 8px, alto ~44px.
- **CTA oscuro**: fondo `#1d1d1f`, texto blanco, radio 8px.
- **CTA píldora (link)**: fondo transparente, texto `#0066cc` (o `#2997ff` en oscuro),
  radio 980px, borde 1px del mismo color, hover con subrayado.
- **Control de filtro/búsqueda**: fondo `#fafafc`, texto `rgba(0,0,0,0.8)`, radio 11px,
  borde 3px `rgba(0,0,0,0.04)`, foco `2px solid #0071e3`.
- **Tarjeta**: fondo `#f5f5f7` (o superficie oscura equivalente), **sin borde**, radio 8px,
  contenido con padding generoso, sin estado hover (las tarjetas son estáticas; lo interactivo
  son los controles dentro).
- **Navegación / barra superior**: fondo `rgba(0,0,0,0.8)` + `backdrop-filter: saturate(180%)
  blur(20px)`, alto 48px, texto 12px peso 400, sticky por encima del contenido.
- **Foco (accesibilidad)**: `2px solid #0071e3` en **todos** los elementos interactivos.

## 6. Espaciado y layout

- Unidad base: **8px**. Escala densa en valores chicos: 2,4,5,6,7,8,9,10,11,14,15,17,20,24px.
- Ancho máximo de contenido: **980px**, centrado.
- Prohibido: líneas de grilla visibles, gutters visibles. La estructura la da el espacio.
- **Densidad interna, aire externo**: los bloques de texto van compactos; el espacio que los
  rodea es amplio. El blanco no es vacío, es pausa.
- Espacio en blanco generoso entre secciones: es la forma de separar, más que los bordes.
- Tamaño de toque mínimo: 44×44px.

## 7. Responsive (la página de opciones es de ancho completo del navegador)

- Contenido centrado con máximo 980px; en pantallas angostas, una columna.
- Los controles de a dos columnas colapsan a una sola.
- Títulos escalan 40px → 28px.

## 8. Prohibiciones explícitas (para revisar el resultado)

1. Ningún acento además de `#0071e3`.
2. Ninguna sombra dura o multicapa.
3. Ningún borde en tarjetas/contenedores.
4. Ningún letter-spacing positivo salvo el 0.196/0.231px de los títulos de tarjeta.
5. Ningún gradiente ni textura.
6. Ninguna barra superior totalmente opaca.
7. Texto de cuerpo alineado a la izquierda, no centrado (solo se centran los títulos).
8. Radios >12px solo para píldoras (980px).
