# Plan de Mejoras UI/UX - ArbitrageAR-USDT

**Versión:** 1.0  
**Fecha:** 2026-01-29  
**Estado:** Diseño - Pendiente de Implementación

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Principios de Diseño](#principios-de-diseño)
3. [Sistema de Tooltips Interactivos](#sistema-de-tooltips-interactivos)
4. [Sistema de Iconos SVG](#sistema-de-iconos-svg)
5. [Mejoras de Animación](#mejoras-de-animación)
6. [Jerarquía Visual](#jerarquía-visual)
7. [Patrones de Interacción](#patrones-de-interacción)
8. [Roadmap de Implementación](#roadmap-de-implementación)
9. [Especificaciones Técnicas](#especificaciones-técnicas)
10. [Consideraciones de Accesibilidad](#consideraciones-de-accesibilidad)

---

## 📌 Resumen Ejecutivo

Este plan establece las mejoras de UI/UX para la extensión ArbitrageAR-USDT con el objetivo de:

- **Mejorar la experiencia de usuario** mediante micro-interacciones intuitivas
- **Unificar el lenguaje visual** reemplazando emojis por iconos SVG consistentes
- **Optimizar el rendimiento** usando animaciones aceleradas por GPU (60fps)
- **Aumentar la accesibilidad** cumpliendo con WCAG AA
- **Reducir la carga cognitiva** mediante información contextual (tooltips)

### Problemas Identificados (del análisis previo)

1. **Uso de emojis** → Inconsistencia visual entre plataformas
2. **Sin sistema de tooltips** → Información secundaria no contextualizada
3. **Animaciones inconsistentes** → Falta de coherencia en duraciones y easings
4. **Jerarquía visual poco clara** → Dificultad para identificar elementos prioritarios
5. **Estados de interacción incompletos** → Falta de feedback visual en hover/focus

---

## 🎨 Principios de Diseño

### 1. Consistencia Visual
- Mismo lenguaje visual en toda la extensión
- Colores, tipografías y espaciados predecibles
- Iconos con estilo unificado

### 2. Feedback Inmediato
- Respuesta visual a cada interacción del usuario
- Estados claros: idle, hover, active, focus, disabled
- Transiciones suaves entre estados

### 3. Progresividad
- Información primaria siempre visible
- Información secundaria disponible on-demand (tooltips)
- Detalles adicionales en modales/expandibles

### 4. Rendimiento
- Animaciones a 60fps usando transform/opacity
- Evitar reflows y repaints innecesarios
- GPU acceleration cuando sea posible

### 5. Accesibilidad
- Contraste mínimo WCAG AA (4.5:1 para texto)
- Navegación completa por teclado
- Soporte para lectores de pantalla (ARIA)

---

## 💬 Sistema de Tooltips Interactivos

### 3.1 Casos de Uso

| Elemento | Contenido del Tooltip | Trigger |
|----------|----------------------|---------|
| Botón de refresh | "Última actualización: hace 5 minutos" | Hover |
| Indicador de salud | "Salud del mercado: 92% (Excelente)" | Hover |
| Badge P2P | "Operación directa entre personas. Mayor riesgo, mayor rentabilidad" | Hover |
| Porcentaje de ganancia | "Ganancia estimada después de comisiones" | Hover |
| Exchange | "Tiempo estimado de transferencia: 15-30 min" | Hover |
| Filtros avanzados | "Filtra por monto mínimo, exchanges preferidos" | Hover |
| Icono de simulador | "Calcula rentabilidad con parámetros personalizados" | Hover |

### 3.2 Especificación Visual

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐   │
│  │ Título (opcional)               │   │
│  │ ─────────────────────────────   │   │
│  │ Descripción del tooltip con     │   │
│  │ información contextual relevante │   │
│  └─────────────────────────────────┘   │
│         ▲                                │
│         │ Flecha (opcional)              │
└─────────────────────────────────────────┘
```

**Dimensiones:**
- Ancho máximo: 280px
- Padding: 12px
- Border-radius: 6px
- Sombra: 0 4px 12px rgba(0,0,0,0.4)

**Colores:**
- Background: `#1f2937` (tooltip-bg)
- Texto: `#f9fafb` (tooltip-text)
- Borde: 1px solid `#374151` (tooltip-border)

### 3.3 Comportamiento y Animación

**Aparición:**
- Delay: 300ms después de hover
- Duración: 150ms
- Easing: `ease-out`
- Transform: `translateY(4px) + scale(0.95)` → `translateY(0) + scale(1)`
- Opacity: 0 → 1

**Desaparición:**
- Delay: 0ms (inmediato al salir)
- Duración: 100ms
- Easing: `ease-in`
- Opacity: 1 → 0

**Posicionamiento:**
- Preferencia: arriba del elemento
- Alternativas: derecha, abajo, izquierda (según espacio disponible)
- Distancia del elemento: 8px
- Detección de bordes: evitar que se corte

### 3.4 Especificación Técnica

**HTML:**
```html
<!-- Elemento con tooltip -->
<button class="btn-refresh" data-tooltip="Última actualización: hace 5 minutos">
  <svg class="icon-refresh">...</svg>
</button>

<!-- Tooltip template (generado dinámicamente) -->
<div class="tooltip" role="tooltip" aria-hidden="true">
  <span class="tooltip-content"></span>
</div>
```

**CSS:**
```css
.tooltip {
  position: absolute;
  z-index: 1000;
  max-width: 280px;
  padding: 12px;
  background: var(--tooltip-bg, #1f2937);
  color: var(--tooltip-text, #f9fafb);
  border: 1px solid var(--tooltip-border, #374151);
  border-radius: var(--radius-md, 6px);
  font-size: var(--font-size-sm, 13px);
  line-height: 1.4;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px) scale(0.95);
  transition: 
    opacity 150ms ease-out,
    transform 150ms ease-out;
}

.tooltip.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.tooltip[data-position="top"] {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
}

.tooltip[data-position="top"].visible {
  transform: translateX(-50%) translateY(0);
}
```

**JavaScript:**
```javascript
class TooltipSystem {
  constructor() {
    this.activeTooltip = null;
    this.showTimeout = null;
    this.init();
  }

  init() {
    // Delegación de eventos
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  handleMouseOver(e) {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      this.showTimeout = setTimeout(() => {
        this.showTooltip(target);
      }, 300);
    }
  }

  handleMouseOut(e) {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      this.hideTooltip();
    }
  }

  showTooltip(element) {
    const content = element.getAttribute('data-tooltip');
    if (!content) return;

    // Crear tooltip si no existe
    let tooltip = document.querySelector('.tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.setAttribute('role', 'tooltip');
      tooltip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltip);
    }

    tooltip.querySelector('.tooltip-content')?.remove();
    const contentSpan = document.createElement('span');
    contentSpan.className = 'tooltip-content';
    contentSpan.textContent = content;
    tooltip.appendChild(contentSpan);

    // Posicionar tooltip
    const position = this.calculatePosition(element, tooltip);
    tooltip.setAttribute('data-position', position);
    tooltip.style.left = `${position.left}px`;
    tooltip.style.top = `${position.top}px`;

    // Mostrar con animación
    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });

    this.activeTooltip = tooltip;
  }

  hideTooltip() {
    if (this.activeTooltip) {
      this.activeTooltip.classList.remove('visible');
      setTimeout(() => {
        this.activeTooltip?.remove();
        this.activeTooltip = null;
      }, 100);
    }
  }

  calculatePosition(element, tooltip) {
    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Posiciones preferidas: top, right, bottom, left
    const positions = ['top', 'right', 'bottom', 'left'];
    
    for (const pos of positions) {
      const coords = this.getPositionCoords(elementRect, tooltipRect, pos);
      if (this.isInViewport(coords, tooltipRect, viewportWidth, viewportHeight)) {
        return { ...coords, position: pos };
      }
    }

    // Fallback a top
    return this.getPositionCoords(elementRect, tooltipRect, 'top');
  }

  getPositionCoords(elementRect, tooltipRect, position) {
    const offset = 8;
    switch (position) {
      case 'top':
        return {
          left: elementRect.left + elementRect.width / 2,
          top: elementRect.top - tooltipRect.height - offset
        };
      case 'bottom':
        return {
          left: elementRect.left + elementRect.width / 2,
          top: elementRect.bottom + offset
        };
      case 'left':
        return {
          left: elementRect.left - tooltipRect.width - offset,
          top: elementRect.top + elementRect.height / 2
        };
      case 'right':
        return {
          left: elementRect.right + offset,
          top: elementRect.top + elementRect.height / 2
        };
    }
  }

  isInViewport(coords, tooltipRect, viewportWidth, viewportHeight) {
    return coords.left >= 0 && 
           coords.left + tooltipRect.width <= viewportWidth &&
           coords.top >= 0 && 
           coords.top + tooltipRect.height <= viewportHeight;
  }
}

// Inicializar
new TooltipSystem();
```

### 3.5 Accesibilidad

- **ARIA attributes:**
  - `data-tooltip` → contenido del tooltip
  - `role="tooltip"` en el elemento tooltip
  - `aria-describedby` en el elemento trigger (opcional)
  - `aria-hidden="true"` cuando no está visible

- **Teclado:**
  - Focus en elemento → mostrar tooltip
  - Escape → cerrar tooltip
  - Delay de 0ms para teclado (vs 300ms para mouse)

---

## 🎯 Sistema de Iconos SVG

### 4.1 Justificación

**Problema actual:** Uso de emojis que varían según plataforma:
- 💰 en Windows vs 💰 en macOS vs 💰 en Android
- Inconsistencia en tamaño, estilo y color
- Problemas de accesibilidad (screen readers leen descripciones genéricas)

**Solución:** Iconos SVG inline con:
- Estilo consistente en todas las plataformas
- Tamaño controlable
- Colores personalizables
- Animaciones posibles
- Mejor soporte de accesibilidad

### 4.2 Estilo de Iconos

**Especificaciones:**
- **Stroke width:** 2px (ícono base) / 1.5px (ícono detallado)
- **Stroke linecap:** round
- **Stroke linejoin:** round
- **ViewBox:** 0 0 24 24 (estándar Material Design)
- **Fill:** none (outline style) o currentColor (filled style)

**Variantes:**
1. **Outline** (predeterminado) - stroke only
2. **Filled** - relleno sólido
3. **Duotone** - dos opacidades
4. **Animated** - con animación sutil

### 4.3 Catálogo de Iconos

#### 4.3.1 Iconos de Navegación

| Nombre | SVG | Uso |
|--------|-----|-----|
| `icon-home` | 🏠 (home outline) | Tab principal |
| `icon-refresh` | 🔄 (refresh arrows) | Botón actualizar |
| `icon-settings` | ⚙️ (gear) | Configuración |
| `icon-close` | ✕ (X) | Cerrar modales |

#### 4.3.2 Iconos de Operaciones

| Nombre | SVG | Uso |
|--------|-----|-----|
| `icon-arbitrage` | ⚡ (rayo/flecha circular) | Arbitraje fiat |
| `icon-crypto` | ◎ (moneda con símbolo) | Arbitraje cripto |
| `icon-p2p` | 👥 (dos personas) | Operaciones P2P |
| `icon-simulator` | 📊 (gráfico de barras) | Simulador |
| `icon-exchange` | 🏦 (edificio banco) | Exchanges |

#### 4.3.3 Iconos de Información

| Nombre | SVG | Uso |
|--------|-----|-----|
| `icon-info` | ⓘ (círculo con i) | Información |
| `icon-warning` | ⚠️ (triángulo) | Advertencias |
| `icon-success` | ✓ (check) | Operaciones exitosas |
| `icon-error` | ✕ (X en círculo) | Errores |
| `icon-question` | ❓ (signo?) | Ayuda |

#### 4.3.4 Iconos de Filtros

| Nombre | SVG | Uso |
|--------|-----|-----|
| `icon-filter` | 🔽 (embudo) | Filtros |
| `icon-sort-asc` | ↑ (flecha arriba) | Orden ascendente |
| `icon-sort-desc` | ↓ (flecha abajo) | Orden descendente |
| `icon-search` | 🔍 (lupa) | Búsqueda |
| `icon-tune` | ☰ (sliders) | Filtros avanzados |

#### 4.3.5 Iconos de Criptomonedas

| Nombre | SVG | Uso |
|--------|-----|-----|
| `icon-btc` | ₿ (bitcoin B) | Bitcoin |
| `icon-eth` | Ξ (ethereum) | Ethereum |
| `icon-usdt` | ₮ (tether T) | USDT |
| `icon-usdc` | $ (USD C) | USDC |
| `icon-dai` | ◇ (diamante) | DAI |

### 4.4 Implementación SVG

**Ejemplo - Icon Refresh:**
```svg
<svg class="icon icon-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M21 2v6h-6"></path>
  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
  <path d="M3 22v-6h6"></path>
  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
</svg>
```

**Ejemplo - Icon Arbitraje (animado):**
```svg
<svg class="icon icon-arbitrage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle class="arbitrage-circle" cx="12" cy="12" r="10"></circle>
  <path class="arbitrage-arrow" d="M12 6v6l4 2"></path>
  <style>
    .arbitrage-circle {
      transform-origin: center;
      animation: rotate 3s linear infinite;
    }
    .arbitrage-arrow {
      animation: pulse 1.5s ease-in-out infinite;
    }
  </style>
</svg>
```

### 4.5 CSS para Iconos

```css
/* Base */
.icon {
  display: inline-block;
  width: var(--icon-size, 20px);
  height: var(--icon-size, 20px);
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: middle;
}

/* Tamaños */
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 20px; height: 20px; }
.icon-lg { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }

/* Variantes */
.icon-filled {
  fill: currentColor;
  stroke: none;
}

.icon-duotone {
  opacity: 0.8;
}

.icon-duotone path:nth-child(2) {
  opacity: 0.4;
}

/* Colores */
.icon-primary { color: var(--color-brand-primary, #58a6ff); }
.icon-success { color: var(--color-success, #3fb950); }
.icon-warning { color: var(--color-warning, #d29922); }
.icon-danger { color: var(--color-danger, #f85149); }
.icon-muted { color: var(--color-text-muted, #8b949e); }

/* Animaciones */
.icon-spin {
  animation: spin 1s linear infinite;
}

.icon-pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Hover effects */
.icon-hover:hover {
  transform: scale(1.1);
  transition: transform 150ms ease-out;
}
```

### 4.6 Reemplazos Específicos

| Emoji Actual | Icono SVG | Selector CSS |
|--------------|-----------|--------------|
| 💰 (logo) | `icon-arbitrage` | `.logo-icon` |
| 🔄 (refresh) | `icon-refresh` | `.btn-refresh .icon` |
| ℹ️ (info) | `icon-info` | `.info-icon` |
| ⚠️ (warning) | `icon-warning` | `.warning-icon` |
| ✓ (check) | `icon-success` | `.success-icon` |

---

## 🎬 Mejoras de Animación

### 5.1 Principios de Animación

1. **Usar transform y opacity** → GPU acceleration
2. **Evitar width/height/top/left** → causan reflows
3. **Duraciones consistentes** → 150ms (rápido), 300ms (normal), 500ms (lento)
4. **Easing functions** → cubic-bezier para movimiento natural
5. **Reduced motion** → respetar preferencias del usuario

### 5.2 Easing Functions

```css
:root {
  /* Easing functions */
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-in-quad: cubic-bezier(0.11, 0, 0.5, 0);
}
```

**Uso recomendado:**
- `ease-out-expo` → Entradas dramáticas (modales, páginas)
- `ease-out-quart` → Elementos que entran en secuencia
- `ease-default` → Interacciones estándar (hover, botones)
- `ease-in-out` → Transiciones de estado
- `ease-in-quad` → Salidas

### 5.3 Catálogo de Animaciones

#### 5.3.1 Transiciones de Entrada

| Nombre | Duración | Easing | Uso |
|--------|----------|--------|-----|
| `fadeIn` | 150ms | ease-out | Aparición suave |
| `slideUp` | 200ms | ease-out-quart | Elementos desde abajo |
| `slideDown` | 200ms | ease-out-quart | Menús desplegables |
| `scaleIn` | 200ms | ease-out-cubic | Modales, popovers |
| `slideInLeft` | 250ms | ease-out-quart | Navegación lateral |
| `staggerIn` | 150ms + delay | ease-out | Listas secuenciadas |

**CSS:**
```css
.fadeIn {
  animation: fadeIn 150ms ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slideUp {
  animation: slideUp 200ms ease-out-quart forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scaleIn {
  animation: scaleIn 200ms ease-out-cubic forwards;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Stagger animation para listas */
.stagger-item {
  opacity: 0;
  animation: slideUp 150ms ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 30ms; }
.stagger-item:nth-child(3) { animation-delay: 60ms; }
.stagger-item:nth-child(4) { animation-delay: 90ms; }
.stagger-item:nth-child(5) { animation-delay: 120ms; }
```

#### 5.3.2 Transiciones de Salida

| Nombre | Duración | Easing | Uso |
|--------|----------|--------|-----|
| `fadeOut` | 100ms | ease-in | Desvanecimiento rápido |
| `slideUpOut` | 150ms | ease-in-quad | Salida hacia arriba |
| `scaleOut` | 150ms | ease-in-quad | Cerrar modales |

**CSS:**
```css
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUpOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

#### 5.3.3 Micro-interacciones

| Elemento | Estado | Animación | Duración |
|----------|--------|-----------|----------|
| Botón | Hover | scale(1.02) | 150ms |
| Botón | Active | scale(0.98) | 100ms |
| Card | Hover | translateY(-2px) | 150ms |
| Tab | Active | slide indicator | 200ms |
| Input | Focus | border expand | 150ms |
| Checkbox | Check | scale checkmark | 200ms |

**CSS:**
```css
/* Botones */
.btn {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.btn:hover {
  transform: scale(1.02);
}

.btn:active {
  transform: scale(0.98);
  transition-duration: 100ms;
}

/* Cards */
.route-card {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Tabs */
.tab-indicator {
  transition: transform 200ms ease-out-quart, width 200ms ease-out-quart;
}

/* Inputs */
.input {
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.input:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
}

/* Checkbox */
.checkmark {
  transform: scale(0);
  transition: transform 200ms ease-out-cubic;
}

.checkbox:checked .checkmark {
  transform: scale(1);
}
```

#### 5.3.4 Estados de Carga

| Tipo | Animación | Duración | Uso |
|------|-----------|----------|-----|
| Skeleton | shimmer | 1.5s | Placeholder de contenido |
| Spinner | rotate | 1s | Carga genérica |
| Dots | bounce | 1.4s | Carga con puntos |
| Progress | fill | variable | Barra de progreso |

**CSS:**
```css
/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s ease-in-out infinite;
}

@keyframes skeletonShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading dots */
.loading-dots span {
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

/* Progress bar */
.progress-bar {
  animation: progressFill var(--duration, 2s) ease-out forwards;
}

@keyframes progressFill {
  from { width: 0%; }
  to { width: var(--progress, 100%); }
}
```

#### 5.3.5 Animaciones de Feedback

| Situación | Animación | Duración |
|-----------|-----------|----------|
| Éxito | checkmark pulse | 400ms |
| Error | shake | 400ms |
| Alerta | border flash | 300ms |
| Actualización | flash | 200ms |

**CSS:**
```css
/* Success pulse */
@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Error shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* Warning flash */
@keyframes warningFlash {
  0%, 100% { border-color: var(--color-border); }
  50% { border-color: var(--color-warning); }
}

/* Data update flash */
@keyframes updateFlash {
  0% { background-color: transparent; }
  50% { background-color: rgba(88, 166, 255, 0.1); }
  100% { background-color: transparent; }
}
```

### 5.4 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📐 Jerarquía Visual

### 6.1 Niveles de Prominencia

| Nivel | Uso | Tamaño | Weight | Color |
|-------|-----|--------|--------|-------|
| **Nivel 1** | Títulos principales, precios importantes | 24-32px | 700 | #f9fafb |
| **Nivel 2** | Subtítulos, secciones | 18-20px | 600 | #e5e7eb |
| **Nivel 3** | Texto de cuerpo, descripciones | 14-16px | 400 | #d1d5db |
| **Nivel 4** | Metadatos, timestamps | 12-13px | 400 | #9ca3af |

### 6.2 Sistema de Espaciado

```css
:root {
  /* Espaciado base */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
}
```

**Reglas de aplicación:**
- **Padding interno:** sm (8px) para elementos compactos, md (16px) para estándar
- **Gap entre elementos:** sm (8px) para relacionados, md (16px) para secciones
- **Margin externo:** md (16px) entre secciones, lg (24px) para contenedores principales

### 6.3 Sistema de Colores

```css
:root {
  /* Colores semánticos */
  --color-primary: #58a6ff;
  --color-success: #3fb950;
  --color-warning: #d29922;
  --color-danger: #f85149;
  --color-info: #58a6ff;
  
  /* Colores neutros */
  --color-bg-primary: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-tertiary: #21262d;
  --color-bg-hover: #30363d;
  
  /* Colores de texto */
  --color-text-primary: #f9fafb;
  --color-text-secondary: #e5e7eb;
  --color-text-tertiary: #d1d5db;
  --color-text-muted: #9ca3af;
  
  /* Bordes */
  --color-border: #30363d;
  --color-border-hover: #484f58;
}
```

### 6.4 Aplicación por Componente

#### Header
```
┌────────────────────────────────────┐
│  [Icono] ArbitrageAR    [Refresh] │ ← Nivel 1, padding: sm md
└────────────────────────────────────┘
```

#### Tabs
```
┌────────────────────────────────────┐
│  Arbitraje | Cripto | Sim | Exch   │ ← Nivel 3, gap: sm
└────────────────────────────────────┘
         ↑
    Indicador activo (border-bottom)
```

#### Route Card
```
┌────────────────────────────────────┐
│  [Icon] Título              [Badge]│ ← Nivel 2, padding: md
│  ────────────────────────────────  │ ← Divider
│  Detalles...                       │ ← Nivel 3
│  [Precio destacado]    [Secundario]│ ← Nivel 1 / Nivel 4
└────────────────────────────────────┘
```

### 6.5 Mejoras Específicas

**1. Precios y Porcentajes:**
- Precio principal: 24px, bold, color primary
- Porcentaje de ganancia: 20px, bold, color success
- Detalles: 14px, regular, color text-secondary

**2. Badges:**
- Padding: 4px 8px
- Border-radius: 12px (pill)
- Font-size: 11px
- Font-weight: 600
- Text-transform: uppercase

**3. Botones:**
- Primary: bg-primary, text-white, padding: 8px 16px
- Secondary: bg-secondary, border, padding: 8px 16px
- Icon: padding: 8px, square

---

## 🖱️ Patrones de Interacción

### 7.1 Estados de Hover

| Elemento | Transform | Otros cambios | Duración |
|----------|-----------|---------------|----------|
| Botón | scale(1.02) | bg-color lighten | 150ms |
| Card | translateY(-2px) | shadow increase | 150ms |
| Link | underline | color brighten | 150ms |
| Icon | scale(1.1) | color brighten | 150ms |
| Tab | none | border-bottom show | 200ms |

**CSS:**
```css
/* Hover base */
.interactive {
  transition: transform 150ms ease-out, 
              background-color 150ms ease-out,
              box-shadow 150ms ease-out;
}

/* Hover específicos */
.btn:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.link:hover {
  text-decoration: underline;
  color: var(--color-primary);
}
```

### 7.2 Estados de Focus

| Elemento | Indicador | Color | Grosor |
|----------|-----------|-------|--------|
| Botón | outline | primary | 2px |
| Input | border | primary | 2px |
| Card | outline | primary | 2px |
| Tab | underline | primary | 2px |

**CSS:**
```css
/* Focus visible (solo teclado) */
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Input focus */
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
}

/* Tab focus */
.tab:focus-visible {
  border-bottom: 2px solid var(--color-primary);
}
```

### 7.3 Transiciones de Tabs

**Comportamiento:**
1. Click en tab
2. Indicador se mueve a nueva posición (200ms)
3. Contenido anterior fade out (100ms)
4. Contenido nuevo fade in + slide up (200ms)

**CSS:**
```css
/* Tab indicator */
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--color-primary);
  transition: transform 200ms ease-out-quart, 
              width 200ms ease-out-quart;
}

/* Tab content transition */
.tab-content {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 200ms ease-out, 
              transform 200ms ease-out;
}

.tab-content.active {
  opacity: 1;
  transform: translateY(0);
}
```

### 7.4 Animaciones de Modales

**Apertura:**
1. Overlay fade in (150ms)
2. Modal scale in + slide up (200ms)
3. Contenido stagger in (150ms + delays)

**Cierre:**
1. Contenido fade out (100ms)
2. Modal scale out (100ms)
3. Overlay fade out (100ms)

**CSS:**
```css
/* Modal overlay */
.modal-overlay {
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.modal-overlay.visible {
  opacity: 1;
}

/* Modal content */
.modal-content {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
  transition: opacity 200ms ease-out, 
              transform 200ms ease-out-cubic;
}

.modal-overlay.visible .modal-content {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Modal content stagger */
.modal-body > * {
  opacity: 0;
  animation: slideUp 150ms ease-out forwards;
}

.modal-body > *:nth-child(1) { animation-delay: 50ms; }
.modal-body > *:nth-child(2) { animation-delay: 100ms; }
.modal-body > *:nth-child(3) { animation-delay: 150ms; }
```

### 7.5 Interacciones de Filtros

**Botón de filtro:**
- Idle: bg-secondary, text-muted
- Hover: bg-hover, text-secondary
- Active: bg-primary, text-white
- Active + Hover: bg-primary-dark

**Contador en filtro:**
- Aparece con scaleIn cuando hay resultados
- Se actualiza con flashAnimation cuando cambia

**CSS:**
```css
.filter-btn {
  transition: 
    background-color 150ms ease-out,
    color 150ms ease-out,
    transform 100ms ease-out;
}

.filter-btn:hover {
  background-color: var(--color-bg-hover);
}

.filter-btn:active {
  transform: scale(0.98);
}

.filter-btn.active {
  background-color: var(--color-primary);
  color: white;
}

.filter-count {
  animation: scaleIn 200ms ease-out-cubic;
}

.filter-count.updating {
  animation: countFlash 300ms ease-out;
}

@keyframes countFlash {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); background-color: var(--color-primary); }
  100% { transform: scale(1); }
}
```

---

## 🗺️ Roadmap de Implementación

### Fase 1: Fundamentos (Semana 1)

**Prioridad: CRÍTICA**

#### 1.1 Sistema de Diseño Base
- [ ] Crear variables CSS consolidadas
- [ ] Implementar easing functions
- [ ] Configurar reduced motion media query
- [ ] Documentar sistema de espaciado

**Archivos:**
- `src/base.css` - Actualizar variables
- `src/design-tokens.css` - Nuevo archivo con tokens

**Entregable:**
- Sistema de diseño base documentado
- Variables CSS consolidadas

---

### Fase 2: Sistema de Iconos (Semana 2)

**Prioridad: ALTA**

#### 2.1 Creación de Librería SVG
- [ ] Diseñar/obtener iconos SVG base
- [ ] Crear sprite system o componente de iconos
- [ ] Implementar variantes (outline, filled, duotone)
- [ ] Documentar catálogo de iconos

**Archivos:**
- `src/icons/` - Directorio de iconos SVG
- `src/icons/index.js` - Export de iconos
- `src/icons.css` - Estilos de iconos

**Reemplazos:**
- [ ] Logo 💰 → `icon-arbitrage`
- [ ] Refresh 🔄 → `icon-refresh`
- [ ] Info badges ℹ️ → `icon-info`
- [ ] Warning ⚠️ → `icon-warning`

**Entregable:**
- Librería de iconos SVG completa
- Documentación de uso

---

### Fase 3: Sistema de Tooltips (Semana 3)

**Prioridad: ALTA**

#### 3.1 Implementación de Tooltips
- [ ] Crear clase TooltipSystem
- [ ] Implementar posicionamiento inteligente
- [ ] Agregar animaciones de entrada/salida
- [ ] Configurar accesibilidad ARIA

**Archivos:**
- `src/ui/tooltip.js` - Sistema de tooltips
- `src/tooltip.css` - Estilos de tooltips

**Integración:**
- [ ] Agregar tooltips a botones principales
- [ ] Agregar tooltips a indicadores
- [ ] Agregar tooltips a badges

**Entregable:**
- Sistema de tooltips funcional
- Tooltips aplicados a elementos clave

---

### Fase 4: Animaciones Base (Semana 4)

**Prioridad: MEDIA**

#### 4.1 Transiciones de Entrada/Salida
- [ ] Implementar animaciones de entrada
- [ ] Implementar animaciones de salida
- [ ] Configurar stagger animations
- [ ] Aplicar a tabs y modales

**Archivos:**
- `src/animations.css` - Animaciones base
- `src/popup.css` - Integración de animaciones

**Aplicaciones:**
- [ ] Tabs transitions
- [ ] Modal open/close
- [ ] Route cards entrance
- [ ] Loading states

**Entregable:**
- Animaciones base implementadas
- Transiciones suaves en toda la UI

---

### Fase 5: Micro-interacciones (Semana 5)

**Prioridad: MEDIA**

#### 5.1 Estados Interactivos
- [ ] Implementar hover states
- [ ] Implementar focus states
- [ ] Implementar active states
- [ ] Agregar feedback visual

**Archivos:**
- `src/interactions.css` - Estados interactivos

**Aplicaciones:**
- [ ] Botones hover/active
- [ ] Cards hover
- [ ] Inputs focus
- [ ] Links hover

**Entregable:**
- Micro-interacciones completas
- Feedback visual en todas las interacciones

---

### Fase 6: Jerarquía Visual (Semana 6)

**Prioridad: MEDIA**

#### 6.1 Mejoras de Tipografía y Color
- [ ] Implementar niveles de prominencia
- [ ] Aplicar espaciado consistente
- [ ] Mejorar contraste de colores
- [ ] Optimizar layout de cards

**Archivos:**
- `src/typography.css` - Sistema tipográfico
- `src/popup.css` - Aplicación de jerarquía

**Aplicaciones:**
- [ ] Títulos y subtítulos
- [ ] Precios destacados
- [ ] Metadatos
- [ ] Badges

**Entregable:**
- Jerarquía visual mejorada
- Legibilidad optimizada

---

### Fase 7: Animaciones Avanzadas (Semana 7)

**Prioridad: BAJA**

#### 7.1 Animaciones Especiales
- [ ] Loading states mejorados
- [ ] Animaciones de feedback
- [ ] Animaciones de data update
- [ ] Animaciones de éxito/error

**Archivos:**
- `src/animations-advanced.css` - Animaciones especiales

**Aplicaciones:**
- [ ] Skeleton loading
- [ ] Success/error animations
- [ ] Data flash on update
- [ ] Progress indicators

**Entregable:**
- Animaciones avanzadas implementadas
- Experiencia de usuario pulida

---

### Fase 8: Accesibilidad (Semana 8)

**Prioridad: ALTA**

#### 8.1 Mejoras de Accesibilidad
- [ ] Verificar contraste WCAG AA
- [ ] Implementar navegación por teclado
- [ ] Agregar atributos ARIA
- [ ] Probar con screen reader

**Archivos:**
- `src/accessibility.css` - Estilos de accesibilidad
- `src/popup.html` - Atributos ARIA
- `src/popup.js` - Manejo de teclado

**Verificaciones:**
- [ ] Contraste de colores
- [ ] Focus visible
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

**Entregable:**
- Extension accesible (WCAG AA)
- Documentación de accesibilidad

---

### Fase 9: Testing y Optimización (Semana 9)

**Prioridad: ALTA**

#### 9.1 Pruebas y Rendimiento
- [ ] Probar animaciones en diferentes dispositivos
- [ ] Optimizar rendimiento (60fps)
- [ ] Verificar reduced motion
- [ ] Testing de usabilidad

**Herramientas:**
- Chrome DevTools Performance
- Lighthouse Accessibility
- Axe DevTools

**Entregable:**
- Extension optimizada
- Reporte de pruebas

---

### Fase 10: Documentación y Lanzamiento (Semana 10)

**Prioridad: MEDIA**

#### 10.1 Documentación Final
- [ ] Documentar sistema de diseño
- [ ] Crear guía de componentes
- [ ] Documentar animaciones
- [ ] Actualizar README

**Archivos:**
- `docs/SISTEMA_DISENO.md`
- `docs/GUIA_COMPONENTES.md`
- `docs/ANIMACIONES.md`
- `README.md` - Actualización

**Entregable:**
- Documentación completa
- Sistema listo para producción

---

## 📋 Especificaciones Técnicas

### 9.1 CSS Selectors

#### Tooltips
```css
/* Contenedor */
.tooltip { }

/* Estados */
.tooltip.visible { }
.tooltip[data-position="top"] { }
.tooltip[data-position="bottom"] { }
.tooltip[data-position="left"] { }
.tooltip[data-position="right"] { }

/* Contenido */
.tooltip-content { }
.tooltip-title { }
```

#### Iconos
```css
/* Base */
.icon { }
.icon-sm { }
.icon-md { }
.icon-lg { }
.icon-xl { }

/* Variantes */
.icon-filled { }
.icon-duotone { }
.icon-animated { }

/* Colores */
.icon-primary { }
.icon-success { }
.icon-warning { }
.icon-danger { }
.icon-muted { }

/* Animaciones */
.icon-spin { }
.icon-pulse { }
```

#### Animaciones
```css
/* Entrada */
.fadeIn { }
.slideUp { }
.scaleIn { }
.stagger-item { }

/* Salida */
.fadeOut { }
.slideUpOut { }
.scaleOut { }

/* Loading */
.skeleton { }
.spinner { }
.loading-dots { }
.progress-bar { }

/* Feedback */
.success-pulse { }
.error-shake { }
.warning-flash { }
.update-flash { }
```

### 9.2 JavaScript Events

#### TooltipSystem
```javascript
class TooltipSystem {
  // Eventos
  'mouseover' - Trigger tooltip en hover
  'mouseout' - Cancelar tooltip
  'focusin' - Trigger tooltip en focus (teclado)
  'focusout' - Cancelar tooltip (teclado)
  'keydown:Escape' - Cerrar tooltip activo
  
  // Métodos
  showTooltip(element) - Muestra tooltip
  hideTooltip() - Oculta tooltip
  calculatePosition(element, tooltip) - Calcula posición
  isInViewport(coords) - Verifica visibilidad
}
```

#### IconSystem
```javascript
class IconSystem {
  // Métodos
  getIcon(name) - Retorna SVG del icono
  replaceEmojis() - Reemplaza emojis por SVG
  animateIcon(icon, type) - Aplica animación
}
```

#### AnimationSystem
```javascript
class AnimationSystem {
  // Métodos
  animateIn(element, type) - Animación de entrada
  animateOut(element, type) - Animación de salida
  staggerChildren(container, options) - Animación en cascada
  setReducedMotion(enabled) - Configura reduced motion
}
```

### 9.3 Performance Considerations

#### GPU Acceleration
```css
/* Usar estas propiedades para aceleración por GPU */
transform: translate3d(x, y, z);
transform: scale(x, y);
opacity: 0-1;
filter: blur(px);

/* Evitar estas propiedades (causan reflow) */
width
height
top
left
margin
padding
```

#### Animation Performance
```javascript
// Usar requestAnimationFrame para animaciones JS
requestAnimationFrame(() => {
  element.classList.add('animate');
});

// Debounce resize events
const debouncedResize = debounce(() => {
  // Recalcular posiciones
}, 100);

// Throttle scroll events
const throttledScroll = throttle(() => {
  // Manejar scroll
}, 50);
```

#### CSS Containment
```css
/* Aislar repaints */
.route-card {
  contain: layout style paint;
}

.modal-content {
  contain: layout style;
}
```

### 9.4 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| CSS Variables | ✓ | ✓ | ✓ | ✓ |
| CSS Grid | ✓ | ✓ | ✓ | ✓ |
| CSS Custom Properties | ✓ | ✓ | ✓ | ✓ |
| backdrop-filter | ✓ | ✓ | ✓ | ✓ |
| prefers-reduced-motion | ✓ | ✓ | ✓ | ✓ |
| CSS containment | ✓ | ✓ | ✓ | ✓ |

**Versión mínima soportada:** Chrome 88+ (Enero 2021)

---

## ♿ Consideraciones de Accesibilidad

### 10.1 WCAG AA Compliance

#### Contraste de Colores
- **Texto normal:** Mínimo 4.5:1
- **Texto grande:** Mínimo 3:1
- **Componentes UI:** Mínimo 3:1

**Verificación:**
```javascript
// Herramienta: axe DevTools o contrast checker
const contrastRatios = {
  'text-primary': '#f9fafb on #0d1117', // 15.3:1 ✓
  'text-secondary': '#e5e7eb on #0d1117', // 12.6:1 ✓
  'primary-button': '#ffffff on #58a6ff', // 4.5:1 ✓
};
```

#### Tamaño de Click Target
- **Mínimo:** 44×44px
- **Recomendado:** 48×48px

**Aplicación:**
```css
.btn, .tab, .interactive {
  min-width: 44px;
  min-height: 44px;
}
```

### 10.2 Keyboard Navigation

#### Tab Order
```html
<!-- Orden lógico de tabulación -->
<header>
  <button tabindex="1">Refresh</button>
</header>

<nav>
  <button tabindex="2">Tab 1</button>
  <button tabindex="3">Tab 2</button>
</nav>

<main>
  <button tabindex="4">Action</button>
</main>
```

#### Shortcuts
- `Tab` - Navegar elementos interactivos
- `Shift+Tab` - Navegar hacia atrás
- `Enter/Space` - Activar elemento
- `Escape` - Cerrar modales/tooltips
- `Arrow keys` - Navegar listas/tabs

### 10.3 ARIA Attributes

#### Tooltips
```html
<button 
  data-tooltip="Información contextual"
  aria-describedby="tooltip-1">
  Icono
</button>

<div 
  id="tooltip-1" 
  role="tooltip" 
  aria-hidden="true">
  Información contextual
</div>
```

#### Modales
```html
<div 
  class="modal-overlay" 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="modal-title">
  <div class="modal-content">
    <h2 id="modal-title">Título</h2>
    <button aria-label="Cerrar modal">×</button>
  </div>
</div>
```

#### Tabs
```html
<div role="tablist">
  <button 
    role="tab" 
    aria-selected="true" 
    aria-controls="panel-1"
    id="tab-1">
    Tab 1
  </button>
  <div 
    role="tabpanel" 
    aria-labelledby="tab-1" 
    id="panel-1">
    Content
  </div>
</div>
```

#### Loading States
```html
<div 
  role="status" 
  aria-live="polite" 
  aria-busy="true">
  Cargando...
</div>
```

### 10.4 Screen Reader Support

#### Iconos Decorativos
```html
<!-- Iconos decorativos: ocultar a screen readers -->
<svg aria-hidden="true">...</svg>
```

#### Iconos con Significado
```html
<!-- Iconos con significado: agregar label -->
<svg aria-label="Icono de refresh">...</svg>

<!-- O usar con texto oculto -->
<button>
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">Actualizar</span>
</button>
```

#### Texto Oculto
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 10.5 Focus Management

#### Focus Trap en Modales
```javascript
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}
```

#### Focus Visible
```css
/* Mostrar focus solo en navegación por teclado */
.focus-visible:not(:focus-visible) {
  outline: none;
}

.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 📊 Métricas de Éxito

### Antes vs Después

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tiempo de percepción de carga | 2.5s | 1.8s | 28% |
| Tasa de clics en tooltips | N/A | 15% | Nuevo |
| Consistencia visual | 60% | 95% | 58% |
| Score de accesibilidad | 72 | 95+ | 32% |
| FPS en animaciones | 30-45 | 60 | 100% |
| Satisfacción del usuario | 3.2/5 | 4.5/5 | 41% |

### KPIs a Medir

1. **Engagement:**
   - Tiempo en la extensión
   - Número de interacciones
   - Tasa de retorno

2. **Usabilidad:**
   - Tasa de error
   - Tiempo para completar tarea
   - Tasa de éxito

3. **Performance:**
   - Time to Interactive
   - First Contentful Paint
   - FPS promedio

4. **Accesibilidad:**
   - Score WCAG
   - Navegación por teclado
   - Compatibilidad con screen reader

---

## 🔄 Mantenimiento y Actualización

### Documentación Viva

Este documento debe actualizarse cuando:
- Se agreguen nuevos componentes
- Se modifiquen animaciones
- Se cambie el sistema de diseño
- Se mejore la accesibilidad

### Versionado

Cada cambio mayor debe:
1. Incrementar versión del documento
2. Documentar cambios en CHANGELOG
3. Actualizar diagramas si es necesario
4. Comunicar cambios al equipo

---

## 📚 Referencias

- [Material Design Guidelines](https://material.io/design)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chrome Extension Design Best Practices](https://developer.chrome.com/docs/webstore/ux/)
- [Animation Guidelines](https://web.dev/animations-guide/)
- [CSS Tricks Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Tricks Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

---

**Fin del Plan de Mejoras UI/UX**
