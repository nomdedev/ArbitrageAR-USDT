# 🎨 PLAN DE REDISEÑO UI/UX - ArbitrageAR

> **Objetivo:** Transformar la UI en una experiencia profesional, limpia y funcional  
> **Inspiración:** Linear, Stripe Dashboard, shadcn/ui  
> **Tiempo estimado:** 8-12 horas de trabajo

---

## 📋 RESUMEN DE CAMBIOS

| Área | Antes | Después |
|------|-------|---------|
| Animaciones | 50+ keyframes, 6-7 clases por botón | 8 keyframes esenciales, 1-2 clases máximo |
| Iconos | SVG custom inline (40 iconos) | Lucide Icons (biblioteca profesional) |
| Tipografía | System fonts, escala comprimida | Inter importada, escala ampliada |
| Colores | Oscuros extremos, saturados | Tonos medios, desaturados |
| Interacciones | Múltiples efectos superpuestos | Feedback sutil y con propósito |

---

## 🔧 FASE 1: ELIMINACIÓN DE ANIMACIONES EXCESIVAS

### 1.1 Clases a ELIMINAR del HTML

Buscar y reemplazar en `popup.html`:

```diff
- class="tab stagger-in hover-lift click-shrink magnetic-btn ripple-btn slide-up-reveal icon-rotate"
+ class="tab"
```

```diff
- class="filter-btn hover-lift click-shrink magnetic-btn ripple-btn icon-rotate"
+ class="filter-btn"
```

**Clases a eliminar globalmente:**
- `stagger-in`
- `hover-lift`
- `click-shrink`
- `magnetic-btn`
- `ripple-btn`
- `slide-up-reveal`
- `icon-rotate`
- `icon-spin-hover`
- `bounce-hover`
- `shake-hover`
- `tilt-3d`
- `card-flip`
- `wave-effect`
- `spotlight-effect`
- `gradient-shift`
- `morph-icon`
- `elastic-button`

### 1.2 Keyframes a MANTENER (8 esenciales)

```css
/* animations-minimal.css - ~150 líneas */

/* 1. Entrada suave */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 2. Entrada desde abajo (para contenido nuevo) */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 3. Spinner de carga */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 4. Skeleton shimmer */
@keyframes shimmer {
  to { background-position: 200% 0; }
}

/* 5. Pulse para indicadores activos */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 6. Flash de actualización */
@keyframes flashUpdate {
  0% { background-color: transparent; }
  30% { background-color: var(--color-update-flash); }
  100% { background-color: transparent; }
}

/* 7. Scale para modales */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* 8. Error shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

### 1.3 Transiciones a MANTENER

```css
/* Transiciones globales para elementos interactivos */
button, .btn, .tab, .filter-btn, a {
  transition: 
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease;
}

/* NO incluir transform en transiciones globales */
```

---

## 🎯 FASE 2: INTEGRACIÓN DE LUCIDE ICONS

### 2.1 Instalación

**Opción A: CDN (más simple)**
```html
<!-- En popup.html <head> -->
<script src="https://unpkg.com/lucide@latest"></script>
```

**Opción B: Descarga local (recomendado para extensión)**
1. Descargar lucide.min.js
2. Colocar en `/src/lib/lucide.min.js`
3. Incluir en manifest.json como recurso

### 2.2 Uso

```html
<!-- Antes -->
<span class="icon icon-sm"><svg><use href="#icon-dollar"></use></svg></span>

<!-- Después -->
<i data-lucide="dollar-sign" class="icon-sm"></i>
```

### 2.3 Inicialización

```javascript
// Al final de popup.js o en DOMContentLoaded
lucide.createIcons();
```

### 2.4 Tamaños estándar

```css
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 20px; height: 20px; }
.icon-lg { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }
```

### 2.5 Mapeo de iconos actuales → Lucide

| Actual | Lucide | Uso |
|--------|--------|-----|
| `#icon-dollar` | `dollar-sign` | Precio dólar |
| `#icon-coins` | `coins` | Criptos |
| `#icon-percent` | `percent` | Porcentajes |
| `#icon-clock` | `clock` | Tiempo |
| `#icon-info` | `info` | Información |
| `#icon-chart` | `chart-line` | Gráficos |
| `#icon-trend-up` | `trending-up` | Subida |
| `#icon-trend-down` | `trending-down` | Bajada |
| `#icon-settings` | `settings` | Configuración |
| `#icon-refresh` | `refresh-cw` | Actualizar |
| `#icon-download` | `download` | Descargar |
| `#icon-users` | `users` | Personas |
| `#icon-shield` | `shield` | Seguridad |
| `#icon-exchange` | `repeat` | Exchange |
| `#icon-bolt` | `zap` | Rápido |
| `#icon-target` | `target` | Objetivo |
| `#icon-filter` | `filter` | Filtrar |
| `#icon-bank` | `building-2` | Banco |
| `#icon-wallet` | `wallet` | Billetera |
| `#icon-check` | `check` | Confirmar |
| `#icon-warning` | `alert-triangle` | Advertencia |
| `#icon-close` | `x` | Cerrar |
| `#icon-menu` | `menu` | Menú |
| `#icon-chevron-*` | `chevron-*` | Navegación |
| `#icon-arrow-*` | `arrow-*` | Flechas |

---

## 🔤 FASE 3: TIPOGRAFÍA

### 3.1 Importar Inter

```css
/* Al inicio de design-system.css o popup.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
```

**O self-hosted (recomendado para extensión):**
1. Descargar Inter de Google Fonts
2. Colocar en `/src/fonts/`
3. Usar @font-face

### 3.2 Nueva escala tipográfica

```css
:root {
  /* Tipografía base */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Escala ampliada */
  --font-size-xs: 0.6875rem;   /* 11px */
  --font-size-sm: 0.8125rem;   /* 13px */
  --font-size-base: 0.9375rem; /* 15px */
  --font-size-md: 1.0625rem;   /* 17px */
  --font-size-lg: 1.25rem;     /* 20px */
  --font-size-xl: 1.5rem;      /* 24px */
  --font-size-2xl: 1.875rem;   /* 30px */
  
  /* Pesos simplificados */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  
  /* Line heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
}
```

### 3.3 Clases de texto

```css
/* Jerarquía clara */
.text-display { font-size: var(--font-size-2xl); font-weight: 700; }
.text-heading { font-size: var(--font-size-lg); font-weight: 600; }
.text-subheading { font-size: var(--font-size-md); font-weight: 500; }
.text-body { font-size: var(--font-size-base); font-weight: 400; }
.text-caption { font-size: var(--font-size-sm); font-weight: 400; }
.text-micro { font-size: var(--font-size-xs); font-weight: 400; }
```

---

## 🎨 FASE 4: PALETA DE COLORES

### 4.1 Nueva paleta base

```css
:root {
  /* === FONDOS === */
  --bg-base: #0f1117;           /* Fondo principal - más claro */
  --bg-surface: #161920;        /* Cards, elementos elevados */
  --bg-elevated: #1d2029;       /* Modales, dropdowns */
  --bg-hover: #252830;          /* Estados hover */
  --bg-active: #2d3038;         /* Estados activos */
  
  /* === BORDES === */
  --border-subtle: #2d3038;
  --border-default: #3d4048;
  --border-emphasis: #4d5058;
  
  /* === TEXTO === */
  --text-primary: #f0f2f5;      /* Texto principal */
  --text-secondary: #a0a5ad;    /* Texto secundario */
  --text-muted: #6b7078;        /* Texto terciario */
  --text-inverse: #0f1117;      /* Sobre fondos claros */
  
  /* === COLORES DE MARCA === */
  --brand-primary: #3b82f6;     /* Azul principal */
  --brand-primary-hover: #2563eb;
  --brand-primary-muted: rgba(59, 130, 246, 0.15);
  
  /* === COLORES SEMÁNTICOS (Desaturados) === */
  --color-success: #34d399;     /* Verde suave */
  --color-success-hover: #10b981;
  --color-success-muted: rgba(52, 211, 153, 0.12);
  
  --color-danger: #f87171;      /* Rojo suave */
  --color-danger-hover: #ef4444;
  --color-danger-muted: rgba(248, 113, 113, 0.12);
  
  --color-warning: #fbbf24;     /* Amarillo */
  --color-warning-muted: rgba(251, 191, 36, 0.12);
  
  --color-info: #38bdf8;        /* Cyan */
  --color-info-muted: rgba(56, 189, 248, 0.12);
  
  /* === COLORES ESPECÍFICOS TRADING === */
  --profit: #34d399;            /* Ganancia */
  --profit-bg: rgba(52, 211, 153, 0.08);
  --loss: #f87171;              /* Pérdida */
  --loss-bg: rgba(248, 113, 113, 0.08);
  --neutral: #a0a5ad;           /* Sin cambio */
}
```

### 4.2 Gradientes sutiles

```css
/* Gradientes para cards de alto rendimiento */
.card-profit {
  background: linear-gradient(135deg, var(--profit-bg), transparent);
  border-color: rgba(52, 211, 153, 0.3);
}

.card-loss {
  background: linear-gradient(135deg, var(--loss-bg), transparent);
  border-color: rgba(248, 113, 113, 0.3);
}
```

---

## 🖱️ FASE 5: INTERACCIONES CON PROPÓSITO

### 5.1 Estados de botón simplificados

```css
.btn {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  transition: background-color 150ms ease, border-color 150ms ease;
}

.btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-emphasis);
}

.btn:active {
  background: var(--bg-active);
}

.btn:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

### 5.2 Transiciones entre tabs

```css
.tab-content {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 200ms ease, transform 200ms ease;
}

.tab-content.active {
  opacity: 1;
  transform: translateY(0);
}
```

### 5.3 Feedback de actualización de datos

```javascript
// En lugar de múltiples animaciones CSS
function flashUpdate(element) {
  element.classList.add('updating');
  setTimeout(() => element.classList.remove('updating'), 600);
}
```

```css
.updating {
  animation: flashUpdate 600ms ease;
}

@keyframes flashUpdate {
  30% { background-color: rgba(59, 130, 246, 0.1); }
}
```

### 5.4 Loading states

```css
/* Skeleton simple */
.skeleton {
  background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-hover) 50%, var(--bg-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-default);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 5.5 Empty states

```html
<div class="empty-state">
  <i data-lucide="inbox" class="icon-xl"></i>
  <p class="text-heading">No hay rutas disponibles</p>
  <p class="text-caption text-secondary">Intenta ajustar los filtros o actualiza los datos</p>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--text-muted);
}
```

---

## 📝 ARCHIVOS A MODIFICAR

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `popup.html` | Eliminar clases de animación, migrar iconos | 🔴 Alta |
| `popup.css` | Eliminar ~500 líneas de animaciones | 🔴 Alta |
| `animations.css` | Reducir de 1,163 a ~150 líneas | 🔴 Alta |
| `design-system.css` | Actualizar variables de color y tipografía | 🟠 Media |
| `popup.js` | Añadir inicialización de Lucide | 🟡 Baja |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Limpieza
- [ ] Eliminar clases de animación del HTML
- [ ] Crear animations-minimal.css
- [ ] Eliminar código muerto de popup.css

### Fase 2: Iconos
- [ ] Descargar Lucide Icons
- [ ] Reemplazar sprite sheet
- [ ] Verificar todos los iconos

### Fase 3: Tipografía
- [ ] Importar Inter
- [ ] Aplicar nueva escala
- [ ] Verificar legibilidad

### Fase 4: Colores
- [ ] Aplicar nueva paleta
- [ ] Verificar contrastes (WCAG AA)
- [ ] Ajustar gradientes

### Fase 5: Interacciones
- [ ] Simplificar estados hover
- [ ] Implementar transiciones de tabs
- [ ] Añadir empty states

---

## 🎯 RESULTADO ESPERADO

- **Tiempo de carga percibido:** -40% (menos animaciones)
- **Claridad visual:** +60% (mejor jerarquía)
- **Accesibilidad:** WCAG AA compliant
- **Mantenibilidad:** -70% líneas de CSS de animación

---

*Plan creado para guiar la implementación del rediseño completo*
