# ✅ CHECKLIST DE MEJORAS UI/UX - ArbitrageAR

**Basado en**: Auditoría UI/UX Completa v5.0.63  
**Fecha**: 2025-10-12  
**Objetivo**: Score 9.5/10

---

## 🚨 FASE 1: QUICK WINS (Semanas 1-2)

### Accesibilidad Básica (CRÍTICO)

- [ ] **Contraste de Colores**
  - [ ] Auditar todos los textos con Lighthouse
  - [ ] Cambiar `.subtitle` de rgba(255,255,255,0.6) a 0.87 (ratio 4.5:1)
  - [ ] Validar con herramienta de contraste online
  - [ ] Documentar colores aprobados en design tokens

- [ ] **ARIA Labels**
  - [ ] Agregar `aria-label` a botón de refresh
  - [ ] Agregar `aria-label` a botón de settings
  - [ ] Agregar `aria-pressed` a filtros activos
  - [ ] Agregar `aria-hidden="true"` a todos los emojis
  - [ ] Agregar `aria-live="polite"` a indicadores de loading

- [ ] **Navegación por Teclado**
  - [ ] Definir orden de tabulación lógico
  - [ ] Agregar estilos `:focus-visible` a todos los elementos interactivos
  - [ ] Testear navegación completa solo con teclado
  - [ ] Documentar atajos de teclado

- [ ] **Form Labels**
  - [ ] Asociar todos los labels con inputs usando `for="id"`
  - [ ] Agregar `aria-required="true"` a campos obligatorios
  - [ ] Agregar mensajes de error accesibles con `aria-describedby`

**Tiempo estimado**: 8-10 horas  
**Archivos a modificar**: popup.html, options.html, popup.css

---

### Design Tokens Básicos (IMPORTANTE)

- [ ] **Crear Sistema de Tokens**
  - [ ] Crear archivo `src/design-tokens.css`
  - [ ] Definir paleta de colores completa
    ```css
    :root {
      /* Brand */
      --color-primary: #3b82f6;
      --color-success: #10b981;
      --color-warning: #f59e0b;
      --color-error: #ef4444;
      
      /* Spacing */
      --space-xs: 4px;
      --space-sm: 8px;
      --space-md: 16px;
      --space-lg: 24px;
      --space-xl: 32px;
      
      /* Typography */
      --font-size-xs: 12px;
      --font-size-sm: 14px;
      --font-size-base: 16px;
      --font-size-lg: 18px;
      --font-size-xl: 24px;
      
      /* Border Radius */
      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
      
      /* Shadows */
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    }
    ```
  - [ ] Importar en popup.html y options.html
  - [ ] Documentar uso en README

- [ ] **Refactorizar CSS Existente**
  - [ ] Buscar todos los colores hardcodeados (grep #[0-9a-f])
  - [ ] Reemplazar por variables CSS
  - [ ] Buscar todos los spacing hardcodeados
  - [ ] Reemplazar por variables de spacing
  - [ ] Testear que todo se ve igual

**Tiempo estimado**: 6-8 horas  
**Archivos a modificar**: popup.css, options.css, nuevo design-tokens.css

---

### Loading States (IMPORTANTE)

- [ ] **Skeleton Screens**
  - [ ] Crear componente skeleton para route cards
    ```css
    .skeleton {
      background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
    ```
  - [ ] Implementar en popup.js durante carga inicial
  - [ ] Testear con throttling de red (Chrome DevTools)

- [ ] **Spinners en Botones**
  - [ ] Crear SVG spinner reutilizable
  - [ ] Agregar a botón de refresh durante actualización
  - [ ] Agregar a botón de "Guardar" en options
  - [ ] Deshabilitar botón durante loading

- [ ] **Cache-First Strategy**
  - [ ] Mostrar datos cacheados inmediatamente
  - [ ] Agregar indicador "Actualizando..." mientras fetch en background
  - [ ] Reemplazar datos cuando llegue respuesta
  - [ ] Agregar timestamp de última actualización

**Tiempo estimado**: 10-12 horas  
**Archivos a modificar**: popup.js, popup.html, popup.css

---

## 📊 FASE 2: MEJORAS SIGNIFICATIVAS (Semanas 3-6)

### Atomic Design Implementation

- [ ] **Identificar Átomos**
  - [ ] Botones (primary, secondary, ghost, danger)
  - [ ] Inputs (text, number, checkbox, radio, select)
  - [ ] Labels y badges
  - [ ] Icons (estandarizar uso de emojis vs SVG)
  - [ ] Typography (h1-h6, p, span con clases)

- [ ] **Crear Moléculas**
  - [ ] Filter button group
  - [ ] Route card header
  - [ ] Stats indicator
  - [ ] Toggle switch
  - [ ] Alert/notification banner

- [ ] **Crear Organismos**
  - [ ] Route card completa
  - [ ] Filter bar completa
  - [ ] Header con navegación
  - [ ] Settings section
  - [ ] Modal dialog

- [ ] **Documentar en Storybook**
  - [ ] Instalar Storybook para Web Components
  - [ ] Crear stories para cada átomo
  - [ ] Crear stories para cada molécula
  - [ ] Documentar props y uso
  - [ ] Generar documentación automática

**Tiempo estimado**: 30-40 horas  
**Archivos a crear**: components/*.html, components/*.css, stories/*.stories.js

---

### Information Architecture

- [ ] **Card Sorting**
  - [ ] Reclutar 10 participantes
  - [ ] Preparar 30 tarjetas con features
  - [ ] Realizar sesión de open card sorting
  - [ ] Analizar resultados con OptimalSort o similar
  - [ ] Rediseñar navegación basada en insights

- [ ] **Simplificar Navegación**
  - [ ] Reducir tabs de 4 a 3 (combinar si es posible)
  - [ ] Agrupar filtros relacionados
  - [ ] Crear sección "Avanzado" para opciones raras
  - [ ] Implementar búsqueda global

- [ ] **Presets de Configuración**
  - [ ] Crear perfil "Conservador" (profit >10%)
  - [ ] Crear perfil "Moderado" (profit >5%)
  - [ ] Crear perfil "Agresivo" (profit >1%)
  - [ ] Permitir guardar configuración personalizada
  - [ ] Exportar/Importar configuración (JSON)

**Tiempo estimado**: 20-25 horas (incluyendo card sorting)  
**Archivos a modificar**: popup.html, options.html, popup.js, options.js

---

### Performance UX

- [ ] **Optimistic UI**
  - [ ] Al hacer click en filtro, aplicar inmediatamente
  - [ ] Mostrar animación de "aplicando..."
  - [ ] Si falla, revertir con mensaje de error
  - [ ] Cachear filtros seleccionados

- [ ] **Lazy Loading**
  - [ ] Cargar solo el tab activo
  - [ ] Cargar tabs inactivos al hacer hover (prefetch)
  - [ ] Virtualizar lista de rutas (solo mostrar visibles)
  - [ ] Implementar infinite scroll para +50 rutas

- [ ] **Optimizar Animaciones**
  - [ ] Usar `will-change` para propiedades animadas
  - [ ] Cambiar de `transition: all` a propiedades específicas
  - [ ] Usar `transform` y `opacity` (GPU accelerated)
  - [ ] Reducir duración a 200-300ms max
  - [ ] Agregar `prefers-reduced-motion` media query

**Tiempo estimado**: 15-20 horas  
**Archivos a modificar**: popup.js, popup.css

---

## 🎨 FASE 3: EXCELENCIA (Semanas 7-12)

### Design System Completo

- [ ] **Documentación**
  - [ ] Crear sitio de documentación (Docusaurus o VitePress)
  - [ ] Documentar cada componente con ejemplos
  - [ ] Crear guidelines de uso (do's and don'ts)
  - [ ] Agregar sección de contribución
  - [ ] Publicar en GitHub Pages

- [ ] **Dark Mode**
  - [ ] Definir paleta oscura en design tokens
    ```css
    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg-primary: #1f2937;
        --color-text-primary: #f9fafb;
      }
    }
    ```
  - [ ] Agregar toggle manual de tema
  - [ ] Guardar preferencia en storage
  - [ ] Testear contraste en dark mode

- [ ] **Temas Personalizables**
  - [ ] Permitir cambiar color primario
  - [ ] Crear 3-4 temas predefinidos
  - [ ] Preview en tiempo real
  - [ ] Exportar tema como CSS

**Tiempo estimado**: 35-45 horas  
**Archivos a crear**: docs/*, themes/*.css

---

### User Testing & Iteration

- [ ] **Reclutamiento**
  - [ ] 2 usuarios novatos en crypto
  - [ ] 2 usuarios intermedios
  - [ ] 1 usuario experto en arbitraje
  - [ ] Ofrecer incentivo ($10 gift card)

- [ ] **Protocolo de Testing**
  - [ ] Preparar 5 tareas específicas
    1. Encuentra la ruta más rentable
    2. Configura alertas para profits >10%
    3. Simula una operación de $500,000
    4. Entiende la guía paso a paso
    5. Cambia el precio del dólar manual
  - [ ] Grabar sesiones (con consentimiento)
  - [ ] Aplicar SUS questionnaire
  - [ ] Tomar notas de observación

- [ ] **Análisis**
  - [ ] Calcular task success rate
  - [ ] Calcular tiempo promedio por tarea
  - [ ] Identificar puntos de fricción
  - [ ] Calcular SUS score (objetivo >80)
  - [ ] Crear heat map de clicks

- [ ] **Iteración**
  - [ ] Priorizar problemas encontrados
  - [ ] Crear tickets para cada fix
  - [ ] Implementar cambios
  - [ ] Re-testear con nuevos usuarios

**Tiempo estimado**: 25-30 horas (incluyendo análisis)  
**Costo estimado**: $50 (incentivos)

---

### Advanced Features

- [ ] **Tour Interactivo**
  - [ ] Instalar librería (Intro.js o Shepherd.js)
  - [ ] Crear pasos del tour:
    1. Bienvenida
    2. Tabs principales
    3. Filtros
    4. Mejor oportunidad
    5. Configuración
  - [ ] Agregar opción "Saltar tour"
  - [ ] Mostrar solo en primera apertura
  - [ ] Permitir re-iniciar desde settings

- [ ] **Tooltips Contextuales**
  - [ ] Crear componente tooltip reutilizable
  - [ ] Agregar a cada término técnico
  - [ ] Explicar qué es USDT, ARS, spread, etc.
  - [ ] Agregar icono (?) para disparar tooltip
  - [ ] Hacer accessible con aria-describedby

- [ ] **Atajos de Teclado**
  - [ ] Definir shortcuts:
    - `R`: Refresh
    - `S`: Settings
    - `1-4`: Cambiar tabs
    - `F`: Focus en filtros
    - `/`: Búsqueda
  - [ ] Implementar listeners
  - [ ] Mostrar cheat sheet (? o Ctrl+/)
  - [ ] Documentar en ayuda

- [ ] **Modo Offline**
  - [ ] Detectar offline con navigator.onLine
  - [ ] Mostrar banner "Sin conexión"
  - [ ] Mostrar últimos datos cacheados
  - [ ] Agregar timestamp de caché
  - [ ] Auto-refresh cuando vuelva online

**Tiempo estimado**: 30-35 horas  
**Archivos a crear**: tour.js, tooltips.js, shortcuts.js

---

## 📊 MÉTRICAS Y VALIDACIÓN

### Checklist de Validación por Fase

**Fase 1 (Quick Wins)**:
- [ ] Lighthouse Accessibility score >90
- [ ] Todos los textos con contraste >4.5:1
- [ ] Navegación completa solo con teclado funciona
- [ ] Loading time percibido <1 segundo

**Fase 2 (Mejoras)**:
- [ ] Storybook con >20 componentes documentados
- [ ] Card sorting completado con insights documentados
- [ ] Performance score >90 en Lighthouse
- [ ] Time to Interactive <2 segundos

**Fase 3 (Excelencia)**:
- [ ] SUS score >80
- [ ] Task success rate >90%
- [ ] Dark mode implementado y testeado
- [ ] Tour completado por >70% de nuevos usuarios

---

## 🛠️ HERRAMIENTAS NECESARIAS

### Desarrollo
- [ ] Instalar axe DevTools
- [ ] Instalar WAVE Extension
- [ ] Configurar Lighthouse CI
- [ ] Instalar Storybook
- [ ] Configurar ESLint a11y plugin

### Testing
- [ ] Crear cuenta en Optimal Workshop (card sorting)
- [ ] Instalar OBS para grabar sesiones
- [ ] Configurar UsabilityHub para remote testing
- [ ] Instalar Chrome DevTools Performance Monitor

### Diseño
- [ ] Crear cuenta en Figma
- [ ] Instalar plugin de accesibilidad en Figma
- [ ] Configurar Color Contrast Analyzer

---

## 📅 TIMELINE SUGERIDO

```
Semana 1-2:   ✅ Fase 1 - Quick Wins
Semana 3-4:   📊 Fase 2.1 - Atomic Design
Semana 5-6:   🎯 Fase 2.2 - Information Architecture  
Semana 7-8:   ⚡ Fase 2.3 - Performance UX
Semana 9-10:  🎨 Fase 3.1 - Design System
Semana 11:    👥 Fase 3.2 - User Testing
Semana 12:    🚀 Fase 3.3 - Advanced Features

Total: 12 semanas (3 meses)
```

---

## ✅ CRITERIOS DE ÉXITO

### Por Fase

**Fase 1 Success Criteria**:
- ✅ Zero accessibility errors en axe DevTools
- ✅ Lighthouse Accessibility >90
- ✅ Variables CSS implementadas (0 colores hardcodeados)
- ✅ Skeleton screens funcionando

**Fase 2 Success Criteria**:
- ✅ Storybook funcionando con componentes
- ✅ Navegación rediseñada basada en card sorting
- ✅ Lighthouse Performance >90
- ✅ Time to Interactive <2s

**Fase 3 Success Criteria**:
- ✅ SUS score >80 (5 usuarios)
- ✅ Task success rate >90%
- ✅ Dark mode funcionando
- ✅ Tour completado por >70% nuevos usuarios

---

## 🎯 SCORE OBJETIVO

```
Actual:       ██████████░░░░ 7.2/10

Después F1:   ████████████░░ 8.0/10  (+0.8)
Después F2:   ██████████████ 8.5/10  (+0.5)
Después F3:   ███████████████ 9.5/10 (+1.0)

Meta Final:   ███████████████ 9.5/10
```

---

## 📝 NOTAS

- Revisar checklist semanalmente
- Actualizar con nuevos hallazgos
- Celebrar wins pequeños
- Iterar constantemente
- Escuchar feedback de usuarios

---

**Creado**: 2025-10-12  
**Última actualización**: 2025-10-12  
**Próxima revisión**: Semanal los lunes
