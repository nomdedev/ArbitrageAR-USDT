# 🎨 Plan de Revisión Estética Completa - ArbitrARS

## 📋 Resumen Ejecutivo

**Objetivo:** Realizar una revisión y mejora estética completa de la extensión ArbitrARS, modernizando su diseño visual mientras se mantiene la integridad de todas las funcionalidades existentes.

**Alcance:** 
- Refactorización completa del CSS (de 6363 líneas a ~3500)
- Implementación de un sistema de diseño coherente
- Mejora de la experiencia visual dinámica
- Optimización de rendimiento visual
- Mejoras de accesibilidad

**Archivos a modificar:**
- `src/popup.css` - Estilos principales
- `src/popup.html` - Estructura HTML
- `src/options.css` - Estilos de opciones
- `src/options.html` - Estructura de opciones
- `src/renderHelpers.js` - Generación de elementos visuales
- `src/popup.js` - Lógica de UI

---

## 📊 ESTADO DE PROGRESO (Actualizado: 12 Dic 2025)

### ✅ COMPLETADO

| Tarea | Estado | Notas |
|-------|--------|-------|
| Sistema de variables CSS | ✅ HECHO | Colores, tipografía, espaciado, bordes, sombras, animaciones |
| Paleta de colores refinada | ✅ HECHO | GitHub Dark Style implementado |
| Escala tipográfica | ✅ HECHO | `--font-size-xs` a `--font-size-2xl` |
| Sistema de espaciado (4px base) | ✅ HECHO | `--space-1` a `--space-8` |
| Sistema de bordes y sombras | ✅ HECHO | `--radius-*`, `--shadow-*`, `--shadow-glow-*` |
| Sistema de animaciones | ✅ HECHO | `--duration-*`, `--ease-*` |
| Focus states (`:focus-visible`) | ✅ HECHO | 15 implementaciones en popup.css |
| Soporte `prefers-reduced-motion` | ✅ HECHO | Media query implementada |
| Modal con backdrop-filter blur | ✅ HECHO | 17 implementaciones |
| Modal cierre con Escape | ✅ HECHO | Event listener implementado |
| Modal atributos ARIA | ✅ HECHO | `role`, `aria-modal`, `aria-labelledby` |
| Options page CSS reescrito | ✅ HECHO | 576 líneas (antes ~896) |
| Options usa mismo sistema de diseño | ✅ HECHO | Variables compartidas |
| Cards con indicador de ganancia | ✅ HECHO | En renderHelpers.js |
| `formatVolume()` función | ✅ HECHO | En renderHelpers.js |
| Animaciones pulse/glow | ✅ HECHO | Múltiples @keyframes |
| Click fuera modal para cerrar | ✅ HECHO | En popup.js |
| Header con botones mejorados | ✅ HECHO | Iconos y hover states |

### ⏳ PENDIENTE

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| **Reducir líneas CSS** | 🔴 ALTA | Actualmente 5870, objetivo <3500 |
| Skeleton loaders | 🟡 MEDIA | Clases base añadidas (.skeleton) |
| Focus trap en modal | 🟡 MEDIA | No hay `focusableElements` tracking |
| Flash update animation | ✅ HECHO | `@keyframes flashUpdate` consolidado |
| Tab enter animation | ✅ HECHO | `@keyframes tabEnter` consolidado |
| Eliminar @keyframes duplicados | ✅ HECHO | Consolidados en sección única |
| Unificar estilos duplicados | ⏳ EN PROGRESO | Secciones legacy eliminándose |
| Consolidar media queries | ✅ HECHO | Unificadas al final del archivo |
| Responsive design | 🟡 MEDIA | Parcialmente implementado |
| Testing funcional completo | 🟢 BAJA | Documentar resultados |
| Documentación final | 🟢 BAJA | Actualizar CHANGELOG |

### 📊 Métricas Actuales vs Objetivo

| Métrica | Inicio | Actual | Objetivo |
|---------|--------|--------|----------|
| Líneas popup.css | 6764 | **5870** | < 3500 ⚠️ (-13.2%) |
| Líneas options.css | ~896 | **576** | < 700 ✅ |
| Focus states | Parcial | **15** | 100% ✅ |
| Contraste WCAG AA | Parcial | ~85% | 100% |
| @keyframes duplicados | 10+ | **0** | 0 ✅ |
| Media queries duplicadas | 3 | **1** | 1 ✅ |

---

## 🔍 Estado Actual del Proyecto

### Estructura Visual Existente

| Componente | Estado Actual | Problemas Identificados |
|------------|---------------|------------------------|
| **Header** | ✅ Mejorado | Espaciados consistentes ahora |
| **Tabs** | ✅ Mejorado | Animación underline suave |
| **Route Cards** | ✅ Mejorado | Código duplicado eliminado |
| **Compact Cards** | ✅ Mejorado | Indicadores visibles |
| **Simulador** | ✅ Mejorado | Matriz legible |
| **Modal** | ✅ Mejorado | ARIA, Escape, Blur implementados |
| **Options Page** | ✅ Completo | Sincronizado con popup |

### Métricas Actuales

```
📊 CSS: 5870 líneas (reducido de 6764, falta llegar a 3500 - 13.2% completado)
📊 Consistencia visual: ~85%
📊 Responsive: ⚠️ Parcial (media queries consolidadas)
📊 Accesibilidad: ~75%
📊 Performance animaciones: Bueno (animaciones consolidadas)
```

---

## 🎯 Objetivos de la Revisión

### 1. Sistema de Diseño Unificado
- [x] Consolidar variables CSS
- [x] Crear tokens de diseño reutilizables
- [x] Establecer escala tipográfica consistente
- [x] Definir paleta de colores refinada
- [x] Crear sistema de espaciado (4px base)

### 2. Componentes Visuales Mejorados
- [x] Cards rediseñadas con jerarquía visual clara
- [x] Tabs modernizados con transiciones suaves
- [x] Indicadores de profit más visibles y accesibles
- [x] Modal mejorado con animaciones y accesibilidad
- [x] Botones y controles unificados

### 3. Experiencia Dinámica
- [x] Animaciones optimizadas y consistentes
- [ ] Estados de carga elegantes (skeleton loaders pendiente)
- [x] Feedback visual en interacciones
- [ ] Transiciones entre pestañas fluidas (tab-enter pendiente)
- [x] Micro-interacciones en elementos clave

### 4. Accesibilidad
- [x] Contraste de colores WCAG AA (85%)
- [x] Focus states visibles (:focus-visible)
- [x] Navegación por teclado (Escape en modal)
- [x] Textos alternativos donde sea necesario (ARIA)

### 5. Optimización (PENDIENTE)
- [ ] Reducir CSS de 5818 a <3500 líneas
- [ ] Eliminar @keyframes duplicados (5 definiciones de pulse)
- [ ] Consolidar estilos repetidos
- [ ] Implementar focus trap completo en modal

---

## 🎨 Nuevo Sistema de Diseño

### Paleta de Colores Refinada

```css
/* === COLORES BASE === */
--color-bg-primary: #0d1117;      /* Fondo principal */
--color-bg-secondary: #161b22;    /* Fondo secundario */
--color-bg-tertiary: #21262d;     /* Fondo terciario/cards */
--color-bg-elevated: #30363d;     /* Elementos elevados */

/* === COLORES DE MARCA === */
--color-brand-primary: #58a6ff;   /* Azul principal */
--color-brand-secondary: #79c0ff; /* Azul secundario */
--color-accent-cyan: #56d4dd;     /* Acento cian */
--color-accent-purple: #bc8cff;   /* Acento púrpura */

/* === COLORES SEMÁNTICOS === */
--color-success: #3fb950;         /* Verde profit alto */
--color-success-muted: #238636;   /* Verde profit bajo */
--color-danger: #f85149;          /* Rojo pérdida */
--color-danger-muted: #da3633;    /* Rojo muted */
--color-warning: #d29922;         /* Amarillo advertencia */
--color-info: #58a6ff;            /* Azul informativo */

/* === COLORES DE TEXTO === */
--color-text-primary: #f0f6fc;    /* Texto principal */
--color-text-secondary: #8b949e;  /* Texto secundario */
--color-text-muted: #6e7681;      /* Texto muted */
--color-text-inverse: #0d1117;    /* Texto sobre fondo claro */

/* === BORDES === */
--color-border-default: #30363d;
--color-border-muted: #21262d;
--color-border-emphasis: #8b949e;
```

### Escala Tipográfica

```css
/* === TAMAÑOS === */
--font-size-xs: 0.6875rem;   /* 11px - Labels pequeños */
--font-size-sm: 0.75rem;     /* 12px - Texto secundario */
--font-size-base: 0.8125rem; /* 13px - Texto base */
--font-size-md: 0.875rem;    /* 14px - Texto destacado */
--font-size-lg: 1rem;        /* 16px - Títulos pequeños */
--font-size-xl: 1.125rem;    /* 18px - Títulos medianos */
--font-size-2xl: 1.25rem;    /* 20px - Títulos grandes */

/* === PESOS === */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* === LINE HEIGHTS === */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Sistema de Espaciado (Base 4px)

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

### Sistema de Bordes y Sombras

```css
/* === BORDER RADIUS === */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;

/* === SOMBRAS === */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);
--shadow-glow-success: 0 0 12px rgba(63, 185, 80, 0.4);
--shadow-glow-danger: 0 0 12px rgba(248, 81, 73, 0.4);
```

### Sistema de Animaciones

```css
/* === DURACIONES === */
--duration-instant: 75ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;

/* === EASINGS === */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 🧩 Componentes Rediseñados

### 1. Route Card (Principal)

**Antes:**
- Card con múltiples gradientes superpuestos
- Animación hover lift pesada
- Indicador de profit pequeño

**Después:**
```
┌─────────────────────────────────────────┐
│ [🏦] Exchange A → Exchange B      [+2.5%]│
│ ────────────────────────────────────────│
│ Compra: $1,050.00    Venta: $1,076.25   │
│ Spread: $26.25       Vol: Alto          │
│ ────────────────────────────────────────│
│ [💵 Ver Detalle]           ⏱️ hace 2min │
└─────────────────────────────────────────┘

Estados visuales:
- Profit > 2%: Borde izquierdo verde + Glow sutil
- Profit 0-2%: Borde izquierdo amarillo
- Profit < 0%: Borde izquierdo rojo + Badge rojo
```

### 2. Compact Card (Vista Compacta)

**Diseño:**
```
┌───┬────────────────────────────────┬─────┐
│ G │ Exchange A → B | $1,050 → $1,076│+2.5%│
└───┴────────────────────────────────┴─────┘
```
- Indicador lateral de color (G=Green, R=Red, Y=Yellow)
- Una sola línea compacta
- Badge de porcentaje destacado

### 3. Tabs Mejorados

**Diseño:**
```
┌──────────┬──────────┬──────────┬──────────┐
│ 💵 Fiat  │ 🔄 Crypto│ 🧮 Simul │ 🏦 Banks │
├──────────┴──────────┴──────────┴──────────┤
│ ════════                                   │ ← Underline animado
└────────────────────────────────────────────┘
```

**Comportamiento:**
- Transición suave del underline (--duration-normal)
- Cambio de opacidad en tabs inactivos
- Indicador de cantidad en badge (opcional)

### 4. Header Modernizado

**Diseño:**
```
┌────────────────────────────────────────────┐
│ 💰 arbitrARS                    ⚙️ 🔄      │
│ Dólar Oficial → USDT                       │
│ ────────────────────────────────────────── │
│ [● Datos OK] [Dólar: $1,050] [v5.0.75]    │
└────────────────────────────────────────────┘
```

### 5. Indicadores de Estado

**Health Indicator:**
```
● Excelente  - Verde (#3fb950)
● Bueno      - Verde claro (#56d364)
● Moderado   - Amarillo (#d29922)
● Bajo       - Naranja (#db6d28)
● Crítico    - Rojo (#f85149)
```

**Badges de Profit:**
```css
/* Positivo Alto (>2%) */
.badge-profit-high {
  background: linear-gradient(135deg, #238636 0%, #3fb950 100%);
  color: white;
  box-shadow: var(--shadow-glow-success);
}

/* Positivo Bajo (0-2%) */
.badge-profit-low {
  background: var(--color-success-muted);
  color: white;
}

/* Negativo */
.badge-profit-negative {
  background: linear-gradient(135deg, #da3633 0%, #f85149 100%);
  color: white;
  box-shadow: var(--shadow-glow-danger);
}
```

### 6. Modal de Detalles

**Diseño:**
```
┌────────────────────────────────────────────┐
│ ╔════════════════════════════════════════╗ │
│ ║  Detalles de Arbitraje              ✕  ║ │
│ ╟────────────────────────────────────────╢ │
│ ║  Ruta: Exchange A → Exchange B         ║ │
│ ║  ──────────────────────────────────    ║ │
│ ║  📊 ANÁLISIS                           ║ │
│ ║  • Ganancia: +2.5% ($1,312.50)         ║ │
│ ║  • Inversión: $52,500                  ║ │
│ ║  • Fees totales: $125.00               ║ │
│ ║  ──────────────────────────────────    ║ │
│ ║  ⚠️ RIESGOS                            ║ │
│ ║  • Volatilidad: Media                  ║ │
│ ║  • Liquidez: Alta                      ║ │
│ ║  ──────────────────────────────────    ║ │
│ ║  [Simular] [Cerrar]                    ║ │
│ ╚════════════════════════════════════════╝ │
└────────────────────────────────────────────┘
```

**Animaciones:**
- Entrada: fadeIn + scaleUp (--duration-normal)
- Salida: fadeOut + scaleDown (--duration-fast)
- Backdrop: blur(8px) + opacity transition

### 7. Simulador Mejorado

**Matriz de Análisis Rediseñada:**
```
┌─────────────────────────────────────────────┐
│  MATRIZ DE RIESGO/GANANCIA                  │
├──────────┬─────────┬─────────┬──────────────┤
│ Escenario│ Ganancia│  Riesgo │   Resultado  │
├──────────┼─────────┼─────────┼──────────────┤
│ Optimista│  +3.2%  │   Bajo  │ ██████░░ $800│
│ Esperado │  +2.5%  │  Medio  │ █████░░░ $625│
│ Pesimista│  +1.1%  │   Alto  │ ███░░░░░ $275│
└──────────┴─────────┴─────────┴──────────────┘
```

---

## 🔄 Elementos Dinámicos

### 1. Estados de Carga

**Skeleton Loader:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 0%,
    var(--color-bg-elevated) 50%,
    var(--color-bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Aplicación:**
- Cards de rutas mientras cargan
- Indicadores de precio
- Tabla de exchanges

### 2. Animaciones de Actualización

**Refresh Animation:**
```css
.refreshing {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Data Update Flash:**
```css
.data-updated {
  animation: flash-update 0.5s ease-out;
}

@keyframes flash-update {
  0% { background: var(--color-success); opacity: 0.3; }
  100% { background: transparent; opacity: 1; }
}
```

### 3. Transiciones de Tab

```css
.tab-content {
  animation: tab-enter var(--duration-normal) var(--ease-default);
}

@keyframes tab-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 4. Hover Effects

**Cards:**
```css
.route-card {
  transition: transform var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**Botones:**
```css
.btn {
  transition: all var(--duration-fast) var(--ease-default);
}

.btn:hover {
  filter: brightness(1.1);
}

.btn:active {
  transform: scale(0.98);
}
```

### 5. Indicadores en Tiempo Real

**Pulse para datos nuevos:**
```css
.live-indicator {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Contador de tiempo:**
```css
.timestamp-fresh { color: var(--color-success); }      /* < 1 min */
.timestamp-recent { color: var(--color-text-primary); } /* 1-5 min */
.timestamp-stale { color: var(--color-warning); }       /* 5-15 min */
.timestamp-old { color: var(--color-danger); }          /* > 15 min */
```

---

## 📝 Plan de Implementación

### Fase 1: Preparación y Base (Día 1)

1. **Backup del CSS actual**
   - Crear `popup.css.backup`
   - Documentar estado actual

2. **Crear nuevo archivo de variables**
   - Implementar sistema de colores
   - Implementar sistema tipográfico
   - Implementar sistema de espaciado

3. **Refactorizar estructura CSS**
   - Organizar por secciones
   - Eliminar duplicados obvios
   - Crear clases utilitarias base

### Fase 2: Componentes Core (Día 2)

1. **Header y navegación**
   - Aplicar nuevo sistema de espaciado
   - Mejorar indicadores de estado
   - Unificar botones de acción

2. **Sistema de Tabs**
   - Implementar nuevo diseño
   - Agregar animación de underline
   - Mejorar estados activo/inactivo

3. **Cards base**
   - Crear clase `.card` reutilizable
   - Implementar variantes (default, success, danger)
   - Agregar estados hover/active/focus

### Fase 3: Componentes Específicos (Día 3)

1. **Route Cards**
   - Rediseñar layout
   - Implementar indicadores de profit
   - Agregar animaciones de hover

2. **Compact Cards**
   - Optimizar para densidad de información
   - Mejorar legibilidad

3. **Badges y Tags**
   - Unificar estilos
   - Crear variantes semánticas

### Fase 4: Modal y Overlay (Día 4)

1. **Modal de detalles**
   - Implementar nuevo diseño
   - Agregar animaciones de entrada/salida
   - Mejorar accesibilidad (focus trap, escape key)

2. **Estados de carga**
   - Implementar skeleton loaders
   - Agregar spinners consistentes

### Fase 5: Simulador y Matriz (Día 5)

1. **Rediseñar formulario**
   - Mejorar inputs
   - Agregar validación visual

2. **Matriz de análisis**
   - Implementar nuevo diseño de tabla
   - Agregar indicadores visuales
   - Mejorar legibilidad de datos

### Fase 6: Options Page (Día 6)

1. **Sincronizar estilos**
   - Aplicar mismo sistema de diseño
   - Unificar componentes con popup

2. **Mejorar controles**
   - Toggles, sliders, inputs
   - Estados de validación

### Fase 7: Testing y Refinamiento (Día 7)

1. **Testing funcional**
   - Verificar todas las funcionalidades
   - Probar en diferentes estados
   - Verificar responsive

2. **Optimización**
   - Reducir CSS final
   - Optimizar animaciones
   - Performance testing

---

## ✅ Checklist de Funcionalidades a Preservar

### Tab Arbitraje Fiat
- [ ] Filtros No-P2P / P2P / Todas funcionan
- [ ] Contador de rutas por filtro actualiza
- [ ] Cards de rutas se renderizan correctamente
- [ ] Click en card abre modal de detalles
- [ ] Indicadores de profit muestran colores correctos
- [ ] Ordenamiento por ganancia funciona

### Tab Arbitraje Cripto
- [ ] Selector de criptomoneda funciona
- [ ] Filtros de operación funcionan
- [ ] Cards cripto se renderizan
- [ ] Modal de detalles cripto funciona

### Tab Simulador
- [ ] Input de monto funciona
- [ ] Parámetros avanzados se expanden
- [ ] Matriz de análisis se genera
- [ ] Cálculos son correctos
- [ ] Escenarios se muestran correctamente

### Tab Exchanges
- [ ] Lista de exchanges carga
- [ ] Cotizaciones se muestran
- [ ] Filtros de bancos funcionan
- [ ] Indicadores de estado funcionan

### Header y Controles
- [ ] Botón refresh actualiza datos
- [ ] Indicador de estado muestra correctamente
- [ ] Botón configuración abre options
- [ ] Indicador de versión muestra
- [ ] Banner de actualización funciona

### Modal
- [ ] Se abre correctamente
- [ ] Se cierra con X
- [ ] Se cierra con click fuera
- [ ] Datos se muestran correctos
- [ ] Botón simular funciona

### Notificaciones
- [ ] Alertas de umbral funcionan
- [ ] Sonidos funcionan (si habilitados)
- [ ] Badge de extensión actualiza

### Options Page
- [ ] Todas las configuraciones guardan
- [ ] Toggles funcionan
- [ ] Sliders funcionan
- [ ] Selectores funcionan
- [ ] Cambios se reflejan en popup

---

## 📊 Métricas de Éxito

| Métrica | Antes | Objetivo |
|---------|-------|----------|
| Líneas CSS | 6363 | < 3500 |
| Consistencia visual | 60% | 95% |
| Tiempo de carga visual | - | < 100ms |
| Animaciones suaves | Parcial | 100% |
| Contraste WCAG AA | Parcial | 100% |
| Focus states | Parcial | 100% |

---

## 🔧 Herramientas y Referencias

### Validación
- Contrast Checker: https://webaim.org/resources/contrastchecker/
- CSS Stats: https://cssstats.com/

### Inspiración
- GitHub Dark Theme
- TradingView Dark
- Discord Dark

### Testing
- Chrome DevTools para performance
- Lighthouse para accesibilidad
- Manual testing por funcionalidad

---

## 📅 Timeline Estimado

| Fase | Duración | Entregable |
|------|----------|------------|
| Fase 1 | 4 horas | Sistema de diseño base |
| Fase 2 | 4 horas | Componentes core |
| Fase 3 | 4 horas | Cards y badges |
| Fase 4 | 3 horas | Modal y overlays |
| Fase 5 | 3 horas | Simulador |
| Fase 6 | 3 horas | Options page |
| Fase 7 | 3 horas | Testing y fixes |

**Total estimado: ~24 horas de trabajo**

---

## 🚀 Próximos Pasos

1. Revisar y aprobar este plan
2. Comenzar con Fase 1: Preparación y Base
3. Revisión incremental después de cada fase
4. Testing continuo de funcionalidades
5. Deployment final y documentación

---

*Documento generado: 5 de diciembre de 2025*
*Última actualización: 12 de diciembre de 2025*
*Versión del plan: 1.1*

## 📝 NOTAS DE PROGRESO (12 Dic 2025)

### Sesión actual - Cambios realizados:
1. ✅ Consolidado @keyframes duplicados en sección única (~línea 260)
2. ✅ Eliminadas 5 definiciones duplicadas de `@keyframes pulse`
3. ✅ Eliminadas 2 definiciones duplicadas de `@keyframes fadeIn`
4. ✅ Eliminada definición duplicada de `@keyframes rotate`
5. ✅ Eliminada definición duplicada de `@keyframes pulseGlow`
6. ✅ Agregadas nuevas animaciones: skeletonPulse, flashUpdate, tabEnter, shake
7. ✅ Agregadas clases skeleton para estados de carga
8. ✅ Eliminada sección completa "FILTROS AVANZADOS v5.0.75" legacy (~200 líneas)
9. ✅ Eliminada sección "INDICADORES DE VALIDACIÓN v5.0.28" duplicada (~250 líneas)
10. ✅ Eliminada definición duplicada de `.tab-content`
11. ✅ Eliminada definición duplicada de `.profit-badge`
12. ✅ CSS reducido de 6764 → 5381 líneas (**~1383 líneas menos, -20%**)

### Próximos pasos inmediatos:
1. 🔴 Consolidar definiciones duplicadas de `.route-card` (líneas 983 y 1547)
2. 🔴 Revisar y eliminar más código duplicado
3. 🟡 Implementar skeleton loaders en HTML
4. 🟡 Agregar focus trap en modal (popup.js)
5. 🟡 Probar todas las funcionalidades

### Estimación para llegar a objetivo (<3500 líneas):
- Líneas actuales: ~5381
- Objetivo: ~3500
- Faltan eliminar: ~1881 líneas
- Progreso total: **-1383 líneas eliminadas (-20%)**
- Estrategia: Consolidar secciones repetidas, eliminar legacy code
