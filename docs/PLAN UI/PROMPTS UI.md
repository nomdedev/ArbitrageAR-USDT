🤖 PROMPTS PARA GLM 4.7 - ARBITRAGEAR v7.0
Copia y pega estos prompts directamente en GLM 4.7

## ✅ ESTADO DE IMPLEMENTACIÓN

**TODAS LAS FASES COMPLETADAS** 🎉

Este documento contiene los prompts originales que se utilizaron para implementar el sistema UI/UX completo de ArbitrageAR. Todas las 8 fases han sido ejecutadas y el código está en producción.

### 📊 Resumen de Implementación

| Fase | Prompt | Archivos Generados | Estado |
|------|--------|-------------------|--------|
| FASE 1 | Design System CSS | `src/ui-components/design-system.css` (561 líneas) | ✅ COMPLETADO |
| FASE 2 | Header Component | `src/ui-components/header.css` (385 líneas) | ✅ COMPLETADO |
| FASE 3 | Exchange Cards | `src/ui-components/exchange-card.css` (431 líneas) | ✅ COMPLETADO |
| FASE 4 | Panel de Arbitraje | `src/ui-components/arbitrage-panel.css` (414 líneas), `.js` (314 líneas) | ✅ COMPLETADO |
| FASE 5 | Sistema de Tabs | `src/ui-components/tabs.css` (283 líneas), `.js` (315 líneas) | ✅ COMPLETADO |
| FASE 6 | Estados de Carga | `src/ui-components/loading-states.css` (468 líneas) | ✅ COMPLETADO |
| FASE 7 | Animaciones Avanzadas | `src/ui-components/animations.css` (357 líneas), `.js` (435 líneas) | ✅ COMPLETADO |
| FASE 8 | Integración Popup | `src/popup.html` (936 líneas), `.css` (6149 líneas), `.js` (5063 líneas) | ✅ COMPLETADO |

---

## 📚 REFERENCIA HISTÓRICA

Este documento se conserva como referencia histórica para:
- Mantener un registro de los prompts originales utilizados
- Permitir futuras iteraciones o mejoras del sistema UI/UX
- Servir como documentación del proceso de desarrollo
- Facilitar la comprensión de la arquitectura de componentes

> **NOTA:** Los prompts a continuación se pueden reutilizar para generar nuevas versiones o mejoras de los componentes existentes.

---

📋 INSTRUCCIONES DE USO
Copia el prompt completo de cada fase
Pégalo en GLM 4.7
Espera la respuesta completa
Guarda el código en archivos separados
Pasa a la siguiente fase
⚠️ IMPORTANTE: No combines fases. Ejecútalas en orden para mejor resultado.
## ✅ FASE 1: Design System CSS
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

PALETA DE COLORES ESPECÍFICA:
/* Fondos */
--color-bg-primary: #0a0e1a;
--color-bg-secondary: #111827;
--color-bg-tertiary: #1f2937;
--color-bg-elevated: #374151;

/* Marca */
--color-brand-primary: #3b82f6;
--color-brand-secondary: #60a5fa;
--color-brand-accent: #8b5cf6;

/* Semánticos */
--color-success: #10b981;
--color-danger: #ef4444;
--color-warning: #f59e0b;
--color-info: #06b6d4;

ENTREGA:
Archivo design-system.css completo y listo para usar.
## ✅ FASE 2: Header Component
Copy
Actúa como un desarrollador frontend especializado en componentes UI.

Necesito crear un header premium para mi extensión Chrome de arbitraje.

CONTEXTO:
- Header actual: logo con emoji, título, subtítulo, botones de settings y refresh
- Necesito elevarlo a nivel profesional fintech
- Debe incluir animaciones y microinteracciones
- Usar el design-system.css de la fase anterior

TAREA:
Crea el HTML y CSS para un header premium con:

1. ESTRUCTURA HTML:
   - Logo animado con gradiente y glow sutil
   - Título "arbitrarARS" con tipografía destacada
   - Subtítulo "Dólar Oficial → USDT" más sutil
   - Indicador de estado de conexión (dot pulsante + texto)
   - Botón de settings con icono SVG y tooltip
   - Botón de refresh con icono SVG y rotación al clic

2. ANIMACIONES CSS:
   - Logo: glow pulsante sutil (keyframes)
   - Status dot: animación pulse infinita
   - Botones: translateY(-2px) + shadow en hover
   - Refresh: rotación 360° al hacer clic (clase .refreshing)
   - Entrada del header: fadeInUp

3. ESTILOS CSS:
   - Glassmorphism sutil en el header
   - Separador inferior elegante (border-bottom o gradient)
   - Espaciado consistente con el design system
   - Variables CSS para personalización

ICONOS SVG REQUERIDOS (inline):
- Settings: engranaje
- Refresh: flecha circular

REQUISITOS:
- Usa las variables CSS del design system
- Incluye iconos SVG inline (no dependencias externas)
- Código responsive
- Comenta las animaciones CSS
- Soporte para prefers-reduced-motion

ENTREGA:
Archivos header.html y header.css (pueden estar en un mismo bloque de código)
## ✅ FASE 3: Exchange Cards
Copy
Actúa como un desarrollador frontend especializado en componentes de datos.

Necesito tarjetas de exchange premium para mostrar precios de USDT.

CONTEXTO:
- Muestra precios de diferentes exchanges (Binance, Lemon, Buenbit, etc.)
- Debe destacar el mejor precio
- Incluir variación porcentual
- Mostrar última actualización
- Usar design-system.css

TAREA:
Crea componentes de tarjetas de exchange con:

1. ESTRUCTURA HTML:
   - Contenedor con data-attribute para exchange (data-exchange="binance")
   - Logo del exchange (img placeholder)
   - Nombre del exchange
   - Badge de variación (up/down con color)
   - Precio principal destacado (monospace font)
   - Mini sparkline SVG (placeholder simple)
   - Timestamp de última actualización
   - Badge "MEJOR PRECIO" condicional

2. ESTADOS VISUALES:
   - Estado normal: card estándar
   - Estado best: glow verde + badge destacado (data-best="true")
   - Estado loading: skeleton shimmer
   - Estado hover: elevación + shadow

3. ANIMACIONES CSS:
   - Entrada: fadeInUp con stagger (usando animation-delay)
   - Hover: translateY(-4px) + shadow aumentado
   - Best price: glow pulsante infinito (keyframes)
   - Price update: flash de color (verde/rojo) 0.5s
   - Shimmer: animación de carga (keyframes)

4. CSS DETALLADO:
   - Glassmorphism sutil (backdrop-filter)
   - Gradientes en badges
   - Transiciones suaves
   - Variables CSS para personalización
   - Estados con data-attributes

VARIACIONES DE PRECIO:
- Up: color verde, icono ▲
- Down: color rojo, icono ▼
- Neutral: color gris

REQUISITOS:
- Componente reutilizable (clases modulares)
- Sin frameworks (vanilla CSS)
- Responsive
- Accesible (ARIA labels)
- prefers-reduced-motion support

EJEMPLO DE USO:
<div class="exchange-card" data-exchange="binance" data-best="true">
  ...
</div>

ENTREGA:
Archivos exchange-card.html y exchange-card.css
## ✅ FASE 4: Panel de Arbitraje
Copy
Actúa como un desarrollador frontend especializado en dashboards fintech.

Necesito un panel premium para mostrar oportunidades de arbitraje.

CONTEXTO:
- Detecta diferencias de precio entre exchanges
- Muestra porcentaje de ganancia
- Permite simular operaciones
- Debe generar claridad y urgencia visual
- Usar design-system.css

TAREA:
Crea un panel de arbitraje con:

1. ESTRUCTURA HTML:
   - Indicador circular de rentabilidad (SVG ring progress)
   - Porcentaje de ganancia grande y centrado
   - Ruta del arbitraje (Exchange A → Exchange B)
   - Detalles de cálculo:
     * Inversión
     * Ganancia estimada
     * Comisiones (opcional)
   - Botón de acción principal "Simular Operación"
   - Botón secundario "Ver detalles"

2. NIVELES DE RENTABILIDAD (data-profitability):
   - Low (< 5%): color neutral #9ca3af
   - Medium (5-10%): color warning #f59e0b
   - High (> 10%): color success #10b981 + glow

3. ANIMACIONES CSS:
   - Ring progress: animación de stroke-dashoffset
   - Count up: números aumentando (JS opcional)
   - Entrada: scale + fade
   - Hover: elevación
   - Best opportunities: glow pulsante

4. SVG RING PROGRESS:
   <svg viewBox="0 0 100 100">
     <circle class="ring-bg" cx="50" cy="50" r="45"/>
     <circle class="ring-progress" cx="50" cy="50" r="45"/>
   </svg>
   - stroke-dasharray: 283 (2 * PI * 45)
   - stroke-dashoffset animado según porcentaje

5. JAVASCRIPT BÁSICO:
   - Función para animar el ring
   - Función para count-up de números
   - Toggle de detalles expandibles

REQUISITOS:
- SVG para el ring progress
- Animaciones CSS puras
- Vanilla JS
- Responsive
- Accesible

ENTREGA:
Archivos arbitrage-panel.html, arbitrage-panel.css, arbitrage-panel.js
## ✅ FASE 5: Sistema de Tabs
Copy
Actúa como un desarrollador frontend especializado en navegación UI.

Necesito un sistema de tabs premium para mi extensión.

CONTEXTO:
- Tabs: Precios, Arbitraje, Bancos, Configuración
- Debe tener indicador deslizante animado
- Badges con contadores en algunos tabs
- Transiciones suaves entre contenidos
- Usar design-system.css

TAREA:
Crea un sistema de tabs con:

1. ESTRUCTURA HTML:
   - Nav container con role="tablist"
   - Tab items con:
     * Icono SVG inline
     * Label de texto
     * Badge con contador (opcional)
   - Indicador deslizante (div absoluto)
   - Contenedores de contenido por tab (tab-panel)

2. ESTILOS CSS:
   - Tabs horizontales
   - Indicador con gradiente
   - Active state destacado
   - Inactive state sutil
   - Badges con contador
   - Posicionamiento relativo/absoluto para el indicador

3. ANIMACIONES CSS:
   - Indicador: slide con ease-out-back
   - Tab content: fadeInUp al cambiar
   - Badge: bounce al actualizar
   - Hover: background sutil

4. JAVASCRIPT:
   - Event listeners en tabs
   - Cálculo de posición del indicador
   - Cambio de tab activo
   - Transición de contenido
   - Actualización de ARIA attributes

ESTRUCTURA JS:
```javascript
class TabSystem {
  constructor(container) {
    this.container = container;
    this.tabs = container.querySelectorAll('[role="tab"]');
    this.panels = container.querySelectorAll('.tab-panel');
    this.indicator = container.querySelector('.tab-indicator');
    this.init();
  }
  
  init() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab));
    });
  }
  
  switchTab(activeTab) {
    // Actualizar tabs
    // Mover indicador
    // Mostrar panel
    // Actualizar ARIA
  }
  
  moveIndicator(tab) {
    // Calcular posición
    // Aplicar transform
  }
}
REQUISITOS:
Vanilla JS (clase o funciones)
CSS transitions
Accesible (ARIA)
Responsive
No dependencias
ENTREGA:
Archivos tabs.html, tabs.css, tabs.js
Copy

---

## ✅ FASE 6: Estados de Carga
Actúa como un desarrollador frontend especializado en UX de carga.
Necesito estados de carga premium para mi extensión.
CONTEXTO:
Actualmente usa spinners básicos
Necesito skeleton screens modernos
Estados de carga por sección
Feedback claro al usuario
Usar design-system.css
TAREA:
Crea estados de carga con:
SKELETON SCREENS:
Header skeleton (logo + título)
Card skeleton (múltiples instancias)
List item skeleton
Shimmer effect animado
SPINNER PREMIUM:
Spinner de anillos múltiples (3 anillos)
Colores del design system
Tamaños diferentes (sm, md, lg)
Animación de rotación
PROGRESS LOADING:
Barra de progreso animada
Texto de estado
Porcentaje opcional
EMPTY STATES:
Icono/ilustración
Mensaje descriptivo
Acción sugerida (CTA button)
ERROR STATES:
Icono de error
Mensaje claro
Botón de retry
ESTRUCTURA SKELETON:
HTML
Preview
Copy
<div class="skeleton-container">
  <div class="skeleton-header">
    <div class="skeleton-circle"></div>
    <div class="skeleton-lines">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
    </div>
  </div>
  <div class="skeleton-body">
    <div class="skeleton-card">
      <div class="skeleton-shimmer"></div>
    </div>
  </div>
</div>
ANIMACIÓN SHIMMER:
css
Copy
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.1),
    transparent
  );
  animation: shimmer 1.5s infinite;
}
REQUISITOS:
Animaciones CSS puras
Reutilizable (clases)
Accesible (aria-busy, aria-label)
Sin librerías externas
prefers-reduced-motion
ENTREGA:
Archivos loading-states.html, loading-states.css
Copy

---

## ✅ FASE 7: Animaciones Avanzadas
Actúa como un desarrollador frontend especializado en animaciones CSS/JS.
Necesito un sistema de animaciones completo para mi extensión.
CONTEXTO:
Ya tengo animaciones básicas
Necesito elevar a nivel premium
Animaciones de entrada, salida, microinteracciones
Performance optimizada
TAREA:
Crea un sistema de animaciones con:
ANIMACIONES DE ENTRADA (keyframes):
fadeInUp (opacity + translateY)
fadeInScale (opacity + scale)
slideInRight (translateX)
slideInLeft (translateX)
staggerChildren (delay progresivo)
MICROINTERACCIONES:
buttonHover (lift + shadow)
cardHover (elevate + glow)
tabIndicator (slide)
refreshSpin (rotate)
statusPulse (pulse infinito)
ANIMACIONES DE DATOS:
priceFlashUp (flash verde)
priceFlashDown (flash rojo)
countUp (números)
progressRing (SVG)
shimmer (skeleton)
ANIMACIONES DE TRANSICIÓN:
viewEnter/viewExit
tabContentSwitch
modalOpen/close
UTILIDADES JS:
JavaScript
Copy
// Animation utilities
const AnimationUtils = {
  // Trigger animation on element
  trigger(element, animationName, duration = 300) {
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = `${animationName} ${duration}ms ease-out`;
  },
  
  // Stagger animation for children
  stagger(container, animationName, staggerDelay = 100) {
    const children = container.children;
    Array.from(children).forEach((child, index) => {
      child.style.animationDelay = `${index * staggerDelay}ms`;
      child.classList.add(animationName);
    });
  },
  
  // Intersection Observer for scroll animations
  observe(elements, animationName, threshold = 0.1) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationName);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });
    
    elements.forEach(el => observer.observe(el));
  }
};
REQUISITOS:
CSS animations (no keyframes duplicados)
will-change para performance
prefers-reduced-motion: reduce support
Vanilla JS utilities
Código comentado
ENTREGA:
Archivos animations.css y animations.js
Copy

---

## ✅ FASE 8: Integración Final
Actúa como un desarrollador frontend senior full-stack.
Necesito integrar todos los componentes en el popup principal.
CONTEXTO:
Popup actual: ~535 líneas HTML, ~4600 líneas CSS
Componentes creados en fases anteriores
Necesito un popup.cohesive y funcional
Extensión Chrome con popup de 400px ancho
TAREA:
Crea el popup.html, popup.css y popup.js integrados con:
ESTRUCTURA HTML:
HTML
Preview
Copy
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>arbitrarARS</title>
  <link rel="stylesheet" href="design-system.css">
  <link rel="stylesheet" href="animations.css">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <!-- Header -->
    <header class="header-premium">...</header>
    
    <!-- Update Banner (condicional) -->
    <div class="update-banner" hidden>...</div>
    
    <!-- Tabs -->
    <nav class="tabs-nav">...</nav>
    
    <!-- Tab Content -->
    <main class="tab-content">
      <!-- Tab: Precios -->
      <section class="tab-panel active" data-tab="prices">
        <div class="exchange-cards-container">
          <!-- Exchange cards -->
        </div>
      </section>
      
      <!-- Tab: Arbitraje -->
      <section class="tab-panel" data-tab="arbitrage">
        <div class="arbitrage-panels">
          <!-- Arbitrage panels -->
        </div>
      </section>
      
      <!-- Tab: Bancos -->
      <section class="tab-panel" data-tab="banks">
        <!-- Bank list -->
      </section>
    </main>
    
    <!-- Loading State -->
    <div class="loading-overlay" hidden>...</div>
    
    <!-- Footer -->
    <footer class="popup-footer">...</footer>
  </div>
  
  <script src="animations.js"></script>
  <script src="popup.js"></script>
</body>
</html>
CSS INTEGRADO (popup.css):
Layout del popup (400px max-width)
Scroll behavior
Espaciado entre secciones
Overrides específicos si necesarios
Responsive para diferentes alturas
JAVASCRIPT INTEGRADO (popup.js):
JavaScript
Copy
// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar tabs
  const tabSystem = new TabSystem(document.querySelector('.tabs-nav'));
  
  // Inicializar header
  initHeader();
  
  // Cargar datos
  loadExchangeData();
  
  // Event listeners
  setupEventListeners();
});

// Funciones principales
function initHeader() { ... }
function loadExchangeData() { ... }
function renderExchangeCards(data) { ... }
function renderArbitragePanels(data) { ... }
function setupEventListeners() { ... }
RESPONSIVE:
Popup Chrome: 400px ancho máximo
Altura adaptable (max-height con scroll)
Scroll interno suave
Touch-friendly
REQUISITOS:
Código limpio y comentado
Performance optimizada
Sin frameworks externos
Listo para producción
Manejo de errores básico
CHECKLIST:
[ ] Todos los componentes funcionan
[ ] Animaciones a 60fps
[ ] No hay scroll horizontal
[ ] Navegación por teclado
[ ] prefers-reduced-motion
[ ] Sin errores en consola
ENTREGA:
Archivos popup.html, popup.css, popup.js completos e integrados.
Copy

---

## 📝 NOTAS PARA GLM 4.7

### Al final de cada prompt, añade:
REGLAS ADICIONALES:
Escribe código limpio y bien formateado
Usa comentarios explicativos
Prioriza performance (will-change, transform)
Incluye soporte para prefers-reduced-motion
No uses !important innecesario
Usa nombres de clases descriptivos (BEM opcional)
Incluye ejemplos de uso si es relevante
Verifica que el código sea válido y funcional
Copy

---

## ✅ CHECKLIST DE SEGUIMIENTO

### Estado Final de Implementación:

**TODAS LAS FASES COMPLETADAS** ✅

- [x] Código guardado en archivos separados
- [x] Revisado y probado visualmente
- [x] Sin errores de sintaxis
- [x] Animaciones funcionan correctamente
- [x] Responsive verificado
- [x] Accesibilidad básica (ARIA, focus)

### Resumen de Archivos Implementados:

**CSS Total:** ~9,000+ líneas
- `src/ui-components/design-system.css`: 561 líneas
- `src/ui-components/header.css`: 385 líneas
- `src/ui-components/exchange-card.css`: 431 líneas
- `src/ui-components/arbitrage-panel.css`: 414 líneas
- `src/ui-components/tabs.css`: 283 líneas
- `src/ui-components/loading-states.css`: 468 líneas
- `src/ui-components/animations.css`: 357 líneas
- `src/popup.css`: 6,149 líneas

**JavaScript Total:** ~6,100+ líneas
- `src/ui-components/arbitrage-panel.js`: 314 líneas
- `src/ui-components/tabs.js`: 315 líneas
- `src/ui-components/animations.js`: 435 líneas
- `src/popup.js`: 5,063 líneas

**HTML Total:** ~936 líneas
- `src/popup.html`: 936 líneas

**Total General:** ~16,000+ líneas de código implementado

---

> **🎉 IMPLEMENTACIÓN COMPLETADA**
>
> Este documento se conserva como referencia histórica. Todos los componentes están en producción y funcionando correctamente.
>
> Para futuras mejoras o iteraciones, puedes reutilizar los prompts de cada fase.

**¡Listo para comenzar! Copia el primer prompt y pégalo en GLM 4.7 🚀**