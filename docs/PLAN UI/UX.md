🎨 PLAN COMPLETO DE UI/UX Y ANIMACIONES - ARBITRAGEAR v7.0
Fecha: Enero 2026 - Actualizado: 31/01/2026
Proyecto: ArbitrageAR - Extensión Chrome para Arbitraje Dólar/USDT
Objetivo: Elevar la UI/UX a nivel profesional fintech con animaciones premium

## ✅ ESTADO DE IMPLEMENTACIÓN

**ESTADO: COMPLETADO AL 100%** 🎉

Todas las 8 fases del plan de UI/UX han sido implementadas exitosamente:

| Fase | Componente | Archivos | Estado |
|------|------------|----------|--------|
| FASE 1 | Design System CSS | `src/ui-components/design-system.css` (561 líneas) | ✅ COMPLETADO |
| FASE 2 | Header Component | `src/ui-components/header.css` (385 líneas) | ✅ COMPLETADO |
| FASE 3 | Exchange Cards | `src/ui-components/exchange-card.css` (431 líneas) | ✅ COMPLETADO |
| FASE 4 | Panel de Arbitraje | `src/ui-components/arbitrage-panel.css` (414 líneas), `src/ui-components/arbitrage-panel.js` (314 líneas) | ✅ COMPLETADO |
| FASE 5 | Sistema de Tabs | `src/ui-components/tabs.css` (283 líneas), `src/ui-components/tabs.js` (315 líneas) | ✅ COMPLETADO |
| FASE 6 | Estados de Carga | `src/ui-components/loading-states.css` (468 líneas) | ✅ COMPLETADO |
| FASE 7 | Animaciones Avanzadas | `src/ui-components/animations.css` (357 líneas), `src/ui-components/animations.js` (435 líneas) | ✅ COMPLETADO |
| FASE 8 | Integración Popup | `src/popup.html` (936 líneas), `src/popup.css` (6149 líneas), `src/popup.js` (5063 líneas) | ✅ COMPLETADO |

**Total de código implementado: ~14,000+ líneas**

> **NOTA:** Este documento conserva el plan original como referencia histórica. La implementación está completa y en producción.

---

📋 ÍNDICE
Análisis de UI Actual
Sistema de Diseño Mejorado
Componentes UI a Rediseñar
Sistema de Animaciones Premium
Prompts para GLM 4.7
Roadmap de Implementación
1. ANÁLISIS DE UI ACTUAL
✅ Fortalezas Actuales
Sistema de diseño con variables CSS bien estructurado
Paleta de colores GitHub Dark consistente
Arquitectura modular (background/, ui/, utils/)
4 fases de animaciones implementadas
~4600 líneas de CSS organizadas
⚠️ Áreas de Mejora
Densidad visual: Mucha información en poco espacio
Jerarquía visual: Falta de énfasis en datos críticos
Microinteracciones: Básicas, pueden ser más sofisticadas
Feedback visual: Limitado en estados de carga/éxito/error
Responsive: No optimizado para diferentes tamaños de popup
Accesibilidad: Puede mejorar contrastes y navegación por teclado
2. SISTEMA DE DISEÑO MEJORADO
2.1 Paleta de Colores Premium (Fintech Dark)
css
Copy
/* === PALETA PRINCIPAL === */
--color-bg-primary: #0a0e1a;        /* Fondo principal más profundo */
--color-bg-secondary: #111827;      /* Tarjetas y secciones */
--color-bg-tertiary: #1f2937;       /* Elevación sutil */
--color-bg-elevated: #374151;       /* Hover states */

/* === COLORES DE MARCA === */
--color-brand-primary: #3b82f6;     /* Azul principal */
--color-brand-secondary: #60a5fa;   /* Azul claro */
--color-brand-accent: #8b5cf6;      /* Púrpura de acento */
--color-brand-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);

/* === COLORES SEMÁNTICOS MEJORADOS === */
--color-success: #10b981;
--color-success-glow: rgba(16, 185, 129, 0.3);
--color-danger: #ef4444;
--color-danger-glow: rgba(239, 68, 68, 0.3);
--color-warning: #f59e0b;
--color-warning-glow: rgba(245, 158, 11, 0.3);
--color-info: #06b6d4;

/* === COLORES DE TEXTO === */
--color-text-primary: #f9fafb;      /* Blanco puro para títulos */
--color-text-secondary: #e5e7eb;    /* Gris claro para body */
--color-text-muted: #9ca3af;        /* Gris medio para captions */
--color-text-subtle: #6b7280;       /* Gris oscuro para placeholders */
2.2 Tipografía Escalable
css
Copy
/* === SISTEMA TIPOGRÁFICO === */
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* === ESCALA DE TAMAÑOS === */
--text-xs: 0.625rem;    /* 10px - Labels */
--text-sm: 0.75rem;     /* 12px - Captions */
--text-base: 0.875rem;  /* 14px - Body */
--text-lg: 1rem;        /* 16px - Subtítulos */
--text-xl: 1.25rem;     /* 20px - Títulos */
--text-2xl: 1.5rem;     /* 24px - Headlines */

/* === PESOS === */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* === ALTURA DE LÍNEA === */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
2.3 Espaciado y Layout
css
Copy
/* === SISTEMA DE ESPACIADO (4px base) === */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */

/* === BORDES Y SOMBRAS === */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
--shadow-glow-success: 0 0 20px var(--color-success-glow);
--shadow-glow-danger: 0 0 20px var(--color-danger-glow);
3. COMPONENTES UI A REDISEÑAR
3.1 Header Premium
Características:
Logo animado con gradiente
Indicador de estado de conexión con pulso
Versión con badge de actualización
Botones con hover effects premium
Estructura HTML propuesta:
HTML
Preview
Copy
<header class="header-premium">
  <div class="header-brand">
    <div class="logo-container">
      <span class="logo-icon">💰</span>
      <div class="logo-glow"></div>
    </div>
    <div class="brand-text">
      <h1 class="brand-title">arbitrarARS</h1>
      <span class="brand-tagline">Dólar Oficial → USDT</span>
    </div>
  </div>
  <div class="header-actions">
    <div class="connection-status" data-status="connected">
      <span class="status-dot"></span>
      <span class="status-text">En vivo</span>
    </div>
    <button class="btn-icon btn-settings" aria-label="Configuración">
      <svg class="icon-settings">...</svg>
    </button>
    <button class="btn-icon btn-refresh" aria-label="Actualizar">
      <svg class="icon-refresh">...</svg>
    </button>
  </div>
</header>
3.2 Tarjetas de Precios (Exchange Cards)
Características:
Glassmorphism sutil
Indicador de mejor precio con animación
Sparkline mini gráfico de tendencia
Badge de variación porcentual
Estructura HTML:
HTML
Preview
Copy
<div class="exchange-card" data-exchange="binance" data-best="true">
  <div class="card-glow"></div>
  <div class="card-header">
    <div class="exchange-info">
      <img class="exchange-logo" src="..." alt="Binance">
      <span class="exchange-name">Binance</span>
    </div>
    <div class="variation-badge" data-trend="up">
      <span class="trend-icon">▲</span>
      <span class="variation-value">+2.4%</span>
    </div>
  </div>
  <div class="card-body">
    <div class="price-main">
      <span class="price-currency">$</span>
      <span class="price-value">1.247,50</span>
    </div>
    <div class="price-sparkline">
      <canvas class="sparkline-chart"></canvas>
    </div>
  </div>
  <div class="card-footer">
    <span class="update-time">Actualizado: hace 2s</span>
    <span class="best-price-badge">MEJOR PRECIO</span>
  </div>
</div>
3.3 Panel de Oportunidades de Arbitraje
Características:
Indicador visual de rentabilidad
Barra de progreso animada
Botón de acción rápida
Detalles expandibles
Estructura HTML:
HTML
Preview
Copy
<div class="arbitrage-panel" data-profitability="high">
  <div class="panel-header">
    <div class="profit-indicator">
      <div class="profit-ring">
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle class="progress-bg" cx="50" cy="50" r="45"/>
          <circle class="progress-fill" cx="50" cy="50" r="45"/>
        </svg>
        <span class="profit-percent">15.2%</span>
      </div>
    </div>
    <div class="arbitrage-details">
      <h3 class="arbitrage-title">Oportunidad Detectada</h3>
      <p class="arbitrage-route">Binance → Lemon Cash</p>
    </div>
  </div>
  <div class="panel-body">
    <div class="calculation-row">
      <span class="calc-label">Inversión:</span>
      <span class="calc-value">$100.000 ARS</span>
    </div>
    <div class="calculation-row highlight">
      <span class="calc-label">Ganancia estimada:</span>
      <span class="calc-value profit">+$15.200 ARS</span>
    </div>
  </div>
  <div class="panel-actions">
    <button class="btn-primary btn-action">
      <span>Simular Operación</span>
      <svg class="icon-arrow">...</svg>
    </button>
    <button class="btn-secondary btn-details">Ver detalles</button>
  </div>
</div>
3.4 Sistema de Tabs Mejorado
Características:
Indicador deslizante animado
Badges con contador
Transiciones suaves entre pestañas
Estructura HTML:
HTML
Preview
Copy
<nav class="tabs-nav" role="tablist">
  <div class="tab-indicator"></div>
  <button class="tab-item active" role="tab" aria-selected="true">
    <svg class="tab-icon">...</svg>
    <span class="tab-label">Precios</span>
    <span class="tab-badge">5</span>
  </button>
  <button class="tab-item" role="tab" aria-selected="false">
    <svg class="tab-icon">...</svg>
    <span class="tab-label">Arbitraje</span>
    <span class="tab-badge highlight">2</span>
  </button>
  <button class="tab-item" role="tab" aria-selected="false">
    <svg class="tab-icon">...</svg>
    <span class="tab-label">Bancos</span>
  </button>
</nav>
<div class="tab-content">
  <!-- Contenido de pestañas -->
</div>
3.5 Estados de Carga Premium
Características:
Skeleton screens en lugar de spinners
Animaciones de shimmer
Progreso por etapas
Estructura HTML:
HTML
Preview
Copy
<!-- Skeleton Loading -->
<div class="skeleton-container">
  <div class="skeleton-header">
    <div class="skeleton-circle"></div>
    <div class="skeleton-lines">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
    </div>
  </div>
  <div class="skeleton-body">
    <div class="skeleton-card" v-for="i in 3">
      <div class="skeleton-shimmer"></div>
    </div>
  </div>
</div>

<!-- Loading con Progreso -->
<div class="loading-state">
  <div class="loading-spinner">
    <div class="spinner-ring"></div>
    <div class="spinner-ring"></div>
    <div class="spinner-ring"></div>
  </div>
  <div class="loading-progress">
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <span class="progress-text">Cargando datos...</span>
  </div>
</div>
4. SISTEMA DE ANIMACIONES PREMIUM
4.1 Especificaciones de Timing
css
Copy
/* === CURVAS DE ANIMACIÓN === */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* === DURACIONES === */
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
--duration-slower: 600ms;

/* === STAGGER DELAYS === */
--stagger-fast: 50ms;
--stagger-normal: 100ms;
--stagger-slow: 150ms;
4.2 Animaciones de Entrada
css
Copy
/* === FADE IN UP === */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === FADE IN SCALE === */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* === SLIDE IN RIGHT === */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* === STAGGERED ENTRANCE === */
.stagger-children > * {
  animation: fadeInUp var(--duration-normal) var(--ease-out-expo) both;
}

.stagger-children > *:nth-child(1) { animation-delay: calc(var(--stagger-normal) * 0); }
.stagger-children > *:nth-child(2) { animation-delay: calc(var(--stagger-normal) * 1); }
.stagger-children > *:nth-child(3) { animation-delay: calc(var(--stagger-normal) * 2); }
.stagger-children > *:nth-child(4) { animation-delay: calc(var(--stagger-normal) * 3); }
.stagger-children > *:nth-child(5) { animation-delay: calc(var(--stagger-normal) * 4); }
4.3 Microinteracciones
css
Copy
/* === BUTTON HOVER === */
.btn-primary {
  transition: all var(--duration-fast) var(--ease-out-quart);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

/* === CARD HOVER === */
.exchange-card {
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.exchange-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.exchange-card[data-best="true"]:hover {
  box-shadow: 0 12px 40px var(--color-success-glow);
}

/* === TAB INDICATOR SLIDE === */
.tab-indicator {
  transition: all var(--duration-normal) var(--ease-out-back);
}

/* === REFRESH SPIN === */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refreshing .icon-refresh {
  animation: spin 1s linear infinite;
}

/* === PULSE ANIMATION === */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-dot[data-status="connected"] {
  animation: pulse 2s ease-in-out infinite;
}

/* === SHIMMER EFFECT === */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-shimmer::after {
  animation: shimmer 1.5s infinite;
}

/* === COUNT UP ANIMATION === */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.price-value.changing {
  animation: countUp var(--duration-fast) var(--ease-out-expo);
}

/* === RING PROGRESS === */
@keyframes ringProgress {
  from { stroke-dashoffset: 283; }
  to { stroke-dashoffset: var(--progress-offset); }
}

.progress-fill {
  animation: ringProgress 1s var(--ease-out-expo) forwards;
}

/* === GLOW PULSE === */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px var(--color-success-glow); }
  50% { box-shadow: 0 0 40px var(--color-success-glow); }
}

.best-price-badge {
  animation: glowPulse 2s ease-in-out infinite;
}

/* === BOUNCE SUBTLE === */
@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.notification-badge {
  animation: bounceSubtle 0.5s var(--ease-out-back);
}

/* === SLIDE INDICATOR === */
@keyframes slideIndicator {
  from { transform: translateX(var(--from-x)); }
  to { transform: translateX(var(--to-x)); }
}

/* === FADE STAGGER === */
@keyframes fadeStagger {
  from { 
    opacity: 0; 
    transform: translateY(10px) scale(0.98);
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1);
  }
}
4.4 Animaciones de Transición entre Vistas
css
Copy
/* === VIEW TRANSITION === */
.view-container {
  position: relative;
  overflow: hidden;
}

.view {
  position: absolute;
  width: 100%;
  transition: all var(--duration-slow) var(--ease-out-expo);
}

.view-enter {
  opacity: 0;
  transform: translateX(100%);
}

.view-enter-active {
  opacity: 1;
  transform: translateX(0);
}

.view-exit {
  opacity: 1;
  transform: translateX(0);
}

.view-exit-active {
  opacity: 0;
  transform: translateX(-100%);
}

/* === TAB CONTENT TRANSITION === */
.tab-panel {
  animation: fadeInUp var(--duration-normal) var(--ease-out-expo);
}
4.5 Animaciones de Datos
css
Copy
/* === PRICE UPDATE FLASH === */
@keyframes priceFlash {
  0% { background-color: transparent; }
  50% { background-color: rgba(16, 185, 129, 0.2); }
  100% { background-color: transparent; }
}

.price-value.updated-up {
  animation: priceFlash 0.5s ease-out;
}

@keyframes priceFlashDown {
  0% { background-color: transparent; }
  50% { background-color: rgba(239, 68, 68, 0.2); }
  100% { background-color: transparent; }
}

.price-value.updated-down {
  animation: priceFlashDown 0.5s ease-out;
}

/* === SPARKLINE DRAW === */
@keyframes drawLine {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.sparkline-path {
  stroke-dasharray: 1000;
  animation: drawLine 1s var(--ease-out-expo) forwards;
}
5. PROMPTS PARA GLM 4.7
FASE 1: Setup y Variables CSS
Copy
Actúa como un desarrollador frontend senior especializado en UI/UX fintech. 

Necesito que crees un sistema de diseño completo para una extensión Chrome de arbitraje cripto. 

CONTEXTO DEL PROYECTO:
- Extensión Chrome para detectar oportunidades de arbitraje Dólar Oficial → USDT
- Estilo visual: Dark mode premium tipo fintech (similar a Binance, Figma, Linear)
- Tecnologías: HTML, CSS vanilla, JavaScript vanilla
- Arquitectura actual: CSS con variables, ~4600 líneas

TAREA:
Crea un archivo design-system.css que incluya:

1. VARIABLES CSS COMPLETAS:
   - Paleta de colores dark premium (fondos, textos, semánticos)
   - Sistema tipográfico con fuente Inter
   - Sistema de espaciado (4px base)
   - Sombras y efectos de glow
   - Border radius consistente
   - Curvas de animación (ease-out-expo, ease-out-back, etc.)
   - Duraciones de animación

2. CLASES UTILITARIAS:
   - Flexbox utilities (flex, items-center, justify-between, etc.)
   - Spacing utilities (m-1, p-2, gap-3, etc.)
   - Text utilities (text-sm, font-bold, text-muted, etc.)
   - Display utilities (hidden, block, flex, grid)

3. COMPONENTES BASE:
   - .btn-primary, .btn-secondary, .btn-ghost
   - .card, .card-hover
   - .badge, .badge-success, .badge-danger
   - .input, .input-focus

REQUISITOS:
- Usa variables CSS nativas (:root)
- Comenta cada sección claramente
- Prioriza accesibilidad (contraste WCAG AA)
- Escribe código limpio y escalable
- Incluye ejemplos de uso en comentarios

ENTREGA:
Archivo design-system.css completo y listo para usar.
FASE 2: Header Component
Copy
Actúa como un desarrollador frontend especializado en componentes UI.

Necesito crear un header premium para mi extensión Chrome de arbitraje.

CONTEXTO:
- Header actual: logo con emoji, título, subtítulo, botones de settings y refresh
- Necesito elevarlo a nivel profesional fintech
- Debe incluir animaciones y microinteracciones

TAREA:
Crea el HTML y CSS para un header premium con:

1. ESTRUCTURA:
   - Logo animado con gradiente y glow sutil
   - Título "arbitrarARS" con tipografía destacada
   - Subtítulo "Dólar Oficial → USDT" más sutil
   - Indicador de estado de conexión (dot pulsante + texto)
   - Botón de settings con icono SVG y tooltip
   - Botón de refresh con icono SVG y rotación al clic

2. ANIMACIONES:
   - Logo: glow pulsante sutil
   - Status dot: animación pulse infinita
   - Botones: translateY(-2px) + shadow en hover
   - Refresh: rotación 360° al hacer clic
   - Entrada del header: fadeInUp staggered

3. ESTILOS:
   - Glassmorphism sutil en el header
   - Separador inferior elegante
   - Espaciado consistente con el design system

REQUISITOS:
- Usa las variables CSS del design system
- Incluye iconos SVG inline (no dependencias externas)
- Código responsive
- Comenta las animaciones CSS

ENTREGA:
Archivos header.html y header.css (o unificado en component.css)
FASE 3: Exchange Cards
Copy
Actúa como un desarrollador frontend especializado en componentes de datos.

Necesito tarjetas de exchange premium para mostrar precios de USDT.

CONTEXTO:
- Muestra precios de diferentes exchanges (Binance, Lemon, Buenbit, etc.)
- Debe destacar el mejor precio
- Incluir variación porcentual
- Mostrar última actualización

TAREA:
Crea componentes de tarjetas de exchange con:

1. ESTRUCTURA HTML:
   - Contenedor con data-attribute para exchange
   - Logo del exchange (img o placeholder)
   - Nombre del exchange
   - Badge de variación (up/down con color)
   - Precio principal destacado (monospace)
   - Mini sparkline SVG (placeholder)
   - Timestamp de última actualización
   - Badge "MEJOR PRECIO" condicional

2. ESTADOS VISUALES:
   - Estado normal: card estándar
   - Estado best: glow verde + badge destacado
   - Estado loading: skeleton shimmer
   - Estado hover: elevación + shadow

3. ANIMACIONES:
   - Entrada: fadeInUp con stagger
   - Hover: translateY(-4px) + shadow aumentado
   - Best price: glow pulsante infinito
   - Price update: flash de color (verde/rojo)
   - Shimmer: animación de carga

4. CSS:
   - Glassmorphism sutil
   - Gradientes en badges
   - Transiciones suaves
   - Variables CSS para personalización

REQUISITOS:
- Componente reutilizable
- Sin frameworks (vanilla CSS)
- Responsive
- Accesible (ARIA labels)

ENTREGA:
Archivos exchange-card.html y exchange-card.css
FASE 4: Panel de Arbitraje
Copy
Actúa como un desarrollador frontend especializado en dashboards fintech.

Necesito un panel premium para mostrar oportunidades de arbitraje.

CONTEXTO:
- Detecta diferencias de precio entre exchanges
- Muestra porcentaje de ganancia
- Permite simular operaciones
- Debe generar urgencia y claridad

TAREA:
Crea un panel de arbitraje con:

1. ESTRUCTURA:
   - Indicador circular de rentabilidad (SVG ring progress)
   - Porcentaje de ganancia grande y centrado
   - Ruta del arbitraje (Exchange A → Exchange B)
   - Detalles de cálculo (inversión, ganancia, comisiones)
   - Botón de acción principal "Simular"
   - Botón secundario "Ver detalles"

2. NIVELES DE RENTABILIDAD:
   - Low (< 5%): color neutral
   - Medium (5-10%): color warning
   - High (> 10%): color success + glow

3. ANIMACIONES:
   - Ring progress: animación de 0 a valor
   - Count up: números aumentando
   - Entrada: scale + fade
   - Hover: elevación
   - Best opportunities: glow pulsante

4. INTERACCIONES:
   - Expandir detalles al clic
   - Simular operación (modal placeholder)
   - Actualización en tiempo real

REQUISITOS:
- SVG para el ring progress
- Animaciones CSS puras
- JavaScript para count-up
- Responsive

ENTREGA:
Archivos arbitrage-panel.html, arbitrage-panel.css, arbitrage-panel.js
FASE 5: Sistema de Tabs
Copy
Actúa como un desarrollador frontend especializado en navegación UI.

Necesito un sistema de tabs premium para mi extensión.

CONTEXTO:
- Tabs: Precios, Arbitraje, Bancos, Configuración
- Debe tener indicador deslizante animado
- Badges con contadores en algunos tabs
- Transiciones suaves entre contenidos

TAREA:
Crea un sistema de tabs con:

1. ESTRUCTURA:
   - Nav container con role="tablist"
   - Tab items con icono + label + badge opcional
   - Indicador deslizante (div absoluto)
   - Contenedores de contenido por tab

2. ESTILOS:
   - Tabs horizontales
   - Indicador con gradiente
   - Active state destacado
   - Inactive state sutil
   - Badges con contador

3. ANIMACIONES:
   - Indicador: slide con ease-out-back
   - Tab content: fadeInUp al cambiar
   - Badge: bounce al actualizar
   - Hover: background sutil

4. JAVASCRIPT:
   - Cambio de tab al clic
   - Movimiento del indicador
   - Transición de contenido
   - Actualización de ARIA attributes

REQUISITOS:
- Vanilla JS
- CSS transitions
- Accesible (ARIA)
- Responsive

ENTREGA:
Archivos tabs.html, tabs.css, tabs.js
FASE 6: Estados de Carga
Copy
Actúa como un desarrollador frontend especializado en UX de carga.

Necesito estados de carga premium para mi extensión.

CONTEXTO:
- Actualmente usa spinners básicos
- Necesito skeleton screens modernos
- Estados de carga por sección
- Feedback claro al usuario

TAREA:
Crea estados de carga con:

1. SKELETON SCREENS:
   - Header skeleton
   - Card skeleton (múltiples)
   - List item skeleton
   - Shimmer effect animado

2. SPINNER PREMIUM:
   - Spinner de anillos múltiples
   - Colores del design system
   - Tamaños diferentes (sm, md, lg)

3. PROGRESS LOADING:
   - Barra de progreso animada
   - Texto de estado
   - Porcentaje opcional

4. EMPTY STATES:
   - Ilustración/icono
   - Mensaje descriptivo
   - Acción sugerida (CTA)

5. ERROR STATES:
   - Icono de error
   - Mensaje claro
   - Botón de retry

REQUISITOS:
- Animaciones CSS puras
- Reutilizable
- Accesible
- Sin librerías externas

ENTREGA:
Archivos loading-states.html, loading-states.css
FASE 7: Animaciones Avanzadas
Copy
Actúa como un desarrollador frontend especializado en animaciones CSS/JS.

Necesito un sistema de animaciones completo para mi extensión.

CONTEXTO:
- Ya tengo animaciones básicas
- Necesito elevar a nivel premium
- Animaciones de entrada, salida, microinteracciones
- Performance optimizada

TAREA:
Crea un sistema de animaciones con:

1. ANIMACIONES DE ENTRADA:
   - fadeInUp
   - fadeInScale
   - slideInRight
   - slideInLeft
   - staggerChildren

2. MICROINTERACCIONES:
   - buttonHover (lift + shadow)
   - cardHover (elevate + glow)
   - tabIndicator (slide)
   - refreshSpin (rotate)
   - statusPulse (pulse)

3. ANIMACIONES DE DATOS:
   - priceFlash (green/red)
   - countUp (numbers)
   - progressRing (SVG)
   - shimmer (skeleton)

4. ANIMACIONES DE TRANSICIÓN:
   - viewEnter/viewExit
   - tabContentSwitch
   - modalOpen/close

5. UTILIDADES JS:
   - Función para trigger animación
   - Intersection Observer para scroll
   - Stagger calculator
   - Animation class toggler

REQUISITOS:
- CSS animations (no keyframes duplicados)
- will-change para performance
- prefers-reduced-motion support
- Vanilla JS utilities

ENTREGA:
Archivos animations.css y animations.js
FASE 8: Integración y Popup Completo
Copy
Actúa como un desarrollador frontend senior full-stack.

Necesito integrar todos los componentes en el popup principal.

CONTEXTO:
- Popup actual: ~535 líneas HTML, ~4600 líneas CSS
- Componentes creados en fases anteriores
- Necesito un popup.cohesive y funcional

TAREA:
Crea el popup.html y popup.css integrados con:

1. ESTRUCTURA HTML:
   - Header premium
   - Banner de actualización (condicional)
   - Sistema de tabs
   - Tab: Precios (exchange cards)
   - Tab: Arbitraje (oportunidades)
   - Tab: Bancos (lista de bancos)
   - Estados de carga
   - Footer con info

2. CSS INTEGRADO:
   - Importar design-system.css
   - Importar componentes CSS
   - Importar animaciones CSS
   - Layout responsive
   - Scroll behavior

3. JAVASCRIPT:
   - Inicialización de componentes
   - Manejo de tabs
   - Actualización de datos
   - Event listeners
   - Animaciones trigger

4. RESPONSIVE:
   - Popup Chrome: 400px ancho máximo
   - Altura adaptable
   - Scroll interno

REQUISITOS:
- Código limpio y comentado
- Performance optimizada
- Sin frameworks
- Listo para producción

ENTREGA:
Archivos popup.html, popup.css, popup.js completos e integrados.
6. ROADMAP DE IMPLEMENTACIÓN ✅ COMPLETADO

**Progreso: 8/8 Fases Completadas (100%)**

Semana 1: Fundamentos ✅
- [x] Día 1-2: FASE 1 - Design System CSS ✅
- [x] Día 3-4: FASE 2 - Header Component ✅
- [x] Día 5-7: FASE 3 - Exchange Cards ✅

Semana 2: Componentes Principales ✅
- [x] Día 8-10: FASE 4 - Arbitrage Panel ✅
- [x] Día 11-12: FASE 5 - Tabs System ✅
- [x] Día 13-14: FASE 6 - Loading States ✅

Semana 3: Animaciones e Integración ✅
- [x] Día 15-17: FASE 7 - Advanced Animations ✅
- [x] Día 18-19: FASE 8 - Integration ✅
- [x] Día 20-21: Testing y refinamiento ✅

Checklist de Calidad ✅
- [x] Todas las animaciones funcionan correctamente
- [x] No hay scroll horizontal
- [x] Contraste WCAG AA en todos los textos
- [x] Navegación por teclado funcional
- [x] prefers-reduced-motion implementado
- [x] Performance 60fps en animaciones
- [x] Código comentado y limpio
📁 ESTRUCTURA DE ARCHIVOS FINAL
Copy
src/
├── design-system.css      # Variables y utilidades
├── animations.css         # Todas las animaciones
├── animations.js          # Utilities de animación
├── popup.html            # HTML integrado
├── popup.css             # CSS integrado
├── popup.js              # JS integrado
├── components/
│   ├── header.css
│   ├── exchange-card.css
│   ├── arbitrage-panel.css
│   ├── tabs.css
│   └── loading-states.css
└── icons/
    └── (SVGs inline en CSS)
🎯 MÉTRICAS DE ÉXITO
Table
Copy
Aspecto	Objetivo
Tiempo de carga	< 500ms
Animaciones	60fps
Lighthouse Performance	> 90
Lighthouse Accessibility	> 90
Tamaño CSS	< 100KB
Tamaño JS	< 50KB
Nota: Este plan está diseñado para ser ejecutado secuencialmente. Cada fase construye sobre la anterior. Usa los prompts tal cual con GLM 4.7 para obtener los mejores resultados.