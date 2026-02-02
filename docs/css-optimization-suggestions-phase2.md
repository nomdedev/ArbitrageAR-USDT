# Reporte de Optimización de Selectores CSS - FASE 2

**Fecha:** 2/2/2026, 08:28:10

## Resumen

- **Archivos analizados:** 8
- **Selectores de alta especificidad:** 7
- **Selectores largos:** 75
- **Total sugerencias:** 157

## src/popup.css

### Estadísticas

- **Total selectores:** 748
- **Alta especificidad:** 7
- **Selectores largos:** 43

### Selectores de Alta Especificidad (Top 10)

#### `broker-info h3 (no usadas en templates actuales) */

/* ============================================
   GUIDE RESPONSIVE STYLES (Reducido)
   ============================================ */

#selected-arbitrage-guide`

- **Especificidad:** (1, 0, 9)
- **Puntaje:** 109

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (16 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (216 caracteres)
  - Crear una clase específica para este elemento

#### `#crypto-routes-container .loading`

- **Especificidad:** (1, 1, 0)
- **Puntaje:** 110

#### `/* Mensaje de no resultados */
#crypto-routes-container .no-results`

- **Especificidad:** (1, 1, 4)
- **Puntaje:** 114

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas

#### `.filter-results #filter-count`

- **Especificidad:** (1, 1, 0)
- **Puntaje:** 110

#### `/* Estado en header */
#dataStatus`

- **Especificidad:** (1, 0, 3)
- **Puntaje:** 103

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (5 niveles)
  - Aplanar la estructura HTML o usar clases más específicas

#### `#dataStatus.moderate .age-text`

- **Especificidad:** (1, 2, 0)
- **Puntaje:** 120

#### `/* Container de rutas crypto */
#crypto-routes-container`

- **Especificidad:** (1, 0, 4)
- **Puntaje:** 104

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (6 niveles)
  - Aplanar la estructura HTML o usar clases más específicas

### Selectores Largos (Top 10)

#### `/* ==========================================
   ARBITRAGE AR - SISTEMA DE DISEÑO v6.0.0
   Revisión Estética Completa - Dic 2025
   ========================================== */

/* ===========================================
   🎯 SISTEMA DE ICONOS SVG (Fase 2)
   =========================================== */

/* Base de iconos */
.icon`

- **Longitud:** 341 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (33 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (341 caracteres)
  - Crear una clase específica para este elemento

#### `/* ===========================================
   💬 SISTEMA DE TOOLTIPS (Fase 3)
   =========================================== */

/* Contenedor del tooltip */
.tooltip-container`

- **Longitud:** 180 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (15 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (180 caracteres)
  - Crear una clase específica para este elemento

#### `/* ===========================================
   🎨 SISTEMA DE DISEÑO UNIFICADO
   =========================================== */
:root`

- **Longitud:** 136 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (9 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (136 caracteres)
  - Crear una clase específica para este elemento

#### `/* ============================================
   ACCESIBILIDAD GLOBAL v6.0.0
   Focus states consistentes para todos los elementos
   ============================================ */

/* Focus visible para navegación por teclado */
:focus`

- **Longitud:** 239 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (22 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (239 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   FASE 4: ANIMACIONES BASE - MICRO-INTERACCIONES
   ========================================== */

/* Hover Lift - Efecto de elevación al hover */
.hover-lift`

- **Longitud:** 205 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (20 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (205 caracteres)
  - Crear una clase específica para este elemento

#### `tab-button (no usadas en templates) */

/* ESTILOS PARA PESTAÑAS DE BANCOS - .banks-tabs usado */
.banks-tabs`

- **Longitud:** 109 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (16 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (109 caracteres)
  - Crear una clase específica para este elemento

#### `/* ============================================
   HEADER - Diseño Limpio y Funcional
   ============================================ */
header`

- **Longitud:** 143 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (10 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (143 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   FASE 4: EFECTOS AVANZADOS - Parallax Sutil en Header
   ========================================== */
.header-content`

- **Longitud:** 166 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (13 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (166 caracteres)
  - Crear una clase específica para este elemento

#### `/* ============================================
   PESTAÑAS - Diseño Pill Simple
   ============================================ */
.tabs`

- **Longitud:** 137 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (9 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (137 caracteres)
  - Crear una clase específica para este elemento

#### `/* ============================================
   ÁREA PRINCIPAL
   ============================================ */
main`

- **Longitud:** 121 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (6 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (121 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (216 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (341 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (180 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (136 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (239 caracteres)
  - Crear una clase específica para este elemento

## src/ui-components/design-system.css

### Estadísticas

- **Total selectores:** 81
- **Alta especificidad:** 0
- **Selectores largos:** 1

### Selectores Largos (Top 10)

#### `/* ==========================================
   ARBITRAGEAR - DESIGN SYSTEM v7.0
   Sistema de Diseño Premium Fintech
   ========================================== */

/* ==========================================
   1. VARIABLES CSS COMPLETAS
   ========================================== */

:root`

- **Longitud:** 309 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (22 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (309 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (309 caracteres)
  - Crear una clase específica para este elemento
- **[MEDIUM]** Reducir profundidad de descendientes (22 niveles)
  - Aplanar la estructura HTML o usar clases más específicas

## src/ui-components/animations.css

### Estadísticas

- **Total selectores:** 48
- **Alta especificidad:** 0
- **Selectores largos:** 2

### Selectores Largos (Top 10)

#### `/* ==========================================
   6. UTILIDADES DE PERFORMANCE
   ========================================== */

/* will-change para optimizar animaciones */
.will-change-transform`

- **Longitud:** 200 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (14 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (200 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   8. VARIABLES PARA STAGGER
   ========================================== */

:root`

- **Longitud:** 134 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (134 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (200 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (134 caracteres)
  - Crear una clase específica para este elemento
- **[MEDIUM]** Reducir profundidad de descendientes (14 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas

## src/ui-components/header.css

### Estadísticas

- **Total selectores:** 32
- **Alta especificidad:** 0
- **Selectores largos:** 4

### Selectores Largos (Top 10)

#### `/* ==========================================
   2. LOGO ANIMADO CON GRADIENTE
   ========================================== */

.header-brand`

- **Longitud:** 146 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (9 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (146 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   3. INDICADOR DE ESTADO DE CONEXIÓN
   ========================================== */

.header-status`

- **Longitud:** 152 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (10 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (152 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   4. BOTONES DE ACCIÓN
   ========================================== */

.header-actions`

- **Longitud:** 139 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (139 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   6. INDICADOR DE VERSIÓN
   ========================================== */

.version-indicator`

- **Longitud:** 145 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (145 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (146 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (152 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (139 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (145 caracteres)
  - Crear una clase específica para este elemento
- **[MEDIUM]** Reducir profundidad de descendientes (9 niveles)
  - Aplanar la estructura HTML o usar clases más específicas

## src/ui-components/exchange-card.css

### Estadísticas

- **Total selectores:** 45
- **Alta especificidad:** 0
- **Selectores largos:** 5

### Selectores Largos (Top 10)

#### `/* ==========================================
   ARBITRAGEAR - EXCHANGE CARDS v7.0
   Tarjetas de Exchange Premium con Animaciones
   ========================================== */

/* ==========================================
   1. ESTRUCTURA DE LA TARJETA
   ========================================== */

.exchange-card`

- **Longitud:** 331 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (24 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (331 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   2. INDICADOR LATERAL DE COLOR
   ========================================== */

.exchange-card::before`

- **Longitud:** 155 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (9 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (155 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   7. FOOTER DE LA TARJETA
   ========================================== */

.card-footer`

- **Longitud:** 139 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (9 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (139 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   8. ESTADOS VISUALES
   ========================================== */

/* Estado hover: elevación + shadow */
.exchange-card:hover`

- **Longitud:** 183 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (14 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (183 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   9. ANIMACIONES
   ========================================== */

/* Animación de entrada con stagger */
.exchange-card:nth-child(1)`

- **Longitud:** 185 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (13 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (185 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (331 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (155 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (139 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (183 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (185 caracteres)
  - Crear una clase específica para este elemento

## src/ui-components/loading-states.css

### Estadísticas

- **Total selectores:** 57
- **Alta especificidad:** 0
- **Selectores largos:** 6

### Selectores Largos (Top 10)

#### `/* ==========================================
   ARBITRAGEAR - LOADING STATES v7.0
   Estados de Carga Premium
   ========================================== */

/* ==========================================
   1. SKELETON SCREENS
   ========================================== */

.skeleton-container`

- **Longitud:** 308 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (20 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (308 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   2. SPINNER PREMIUM
   ========================================== */

.spinner-premium`

- **Longitud:** 138 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (138 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   3. PROGRESS LOADING
   ========================================== */

.progress-loading`

- **Longitud:** 140 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (140 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   4. EMPTY STATES
   ========================================== */

.empty-state`

- **Longitud:** 131 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (131 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   5. ERROR STATES
   ========================================== */

.error-state`

- **Longitud:** 131 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (131 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   7. LOADING OVERLAY
   ========================================== */

.loading-overlay`

- **Longitud:** 138 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (138 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (308 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (138 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (140 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (131 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (131 caracteres)
  - Crear una clase específica para este elemento

## src/ui-components/tabs.css

### Estadísticas

- **Total selectores:** 37
- **Alta especificidad:** 0
- **Selectores largos:** 6

### Selectores Largos (Top 10)

#### `/* ==========================================
   ARBITRAGEAR - TABS SYSTEM v7.0
   Sistema de Tabs Premium con Indicador Deslizante
   ========================================== */

/* ==========================================
   1. CONTENEDOR DE TABS
   ========================================== */

.tabs-nav`

- **Longitud:** 321 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (24 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (321 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   2. INDICADOR DESLIZANTE
   ========================================== */

.tab-indicator`

- **Longitud:** 141 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (141 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   3. TAB ITEMS
   ========================================== */

.tab-item`

- **Longitud:** 125 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (125 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   4. ESTADOS DEL TAB
   ========================================== */

/* Hover: background sutil */
.tab-item:hover`

- **Longitud:** 168 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (13 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (168 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   5. CONTENIDO DE LOS TABS
   ========================================== */

.tabs-content`

- **Longitud:** 141 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (9 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (141 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   6. ANIMACIONES
   ========================================== */

/* Badge: bounce al actualizar */
.tab-badge.updating`

- **Longitud:** 172 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (12 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (172 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (321 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (141 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (125 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (168 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (141 caracteres)
  - Crear una clase específica para este elemento

## src/ui-components/arbitrage-panel.css

### Estadísticas

- **Total selectores:** 58
- **Alta especificidad:** 0
- **Selectores largos:** 8

### Selectores Largos (Top 10)

#### `/* ==========================================
   ARBITRAGEAR - ARBITRAGE PANEL v7.0
   Panel de Oportunidades de Arbitraje Premium
   ========================================== */

/* ==========================================
   1. ESTRUCTURA DEL PANEL
   ========================================== */

.arbitrage-panel`

- **Longitud:** 329 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (23 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (329 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   2. HEADER DEL PANEL
   ========================================== */

.panel-header`

- **Longitud:** 136 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (136 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   3. INDICADOR CIRCULAR DE RENTABILIDAD (SVG RING)
   ========================================== */

.profit-indicator`

- **Longitud:** 169 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (11 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (169 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   4. DETALLES DEL ARBITRAJE
   ========================================== */

.arbitrage-details`

- **Longitud:** 147 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (147 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   5. CUERPO DEL PANEL
   ========================================== */

.panel-body`

- **Longitud:** 134 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (134 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   6. ACCIONES DEL PANEL
   ========================================== */

.panel-actions`

- **Longitud:** 139 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (139 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   7. DETALLES EXPANDIBLES
   ========================================== */

.panel-details-expandable`

- **Longitud:** 152 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (7 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (152 caracteres)
  - Crear una clase específica para este elemento

#### `/* ==========================================
   9. CONTENEDOR DE PANELES
   ========================================== */

.arbitrage-panels-container`

- **Longitud:** 155 caracteres

**Sugerencias:**

- **[MEDIUM]** Reducir profundidad de descendientes (8 niveles)
  - Aplanar la estructura HTML o usar clases más específicas
- **[HIGH]** Acortar selector (155 caracteres)
  - Crear una clase específica para este elemento

### Principales Sugerencias de Optimización

- **[HIGH]** Acortar selector (329 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (136 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (169 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (147 caracteres)
  - Crear una clase específica para este elemento
- **[HIGH]** Acortar selector (134 caracteres)
  - Crear una clase específica para este elemento

