# Changelog - ArbitrageAR

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [5.0.84] - 2026-01-16 - ELIMINACIÓN DE CÓDIGO DUPLICADO

### 🧹 Refactorización popup.js
- **popup.js:** Reducido de 4791 a 4062 líneas (-729 líneas, -15.2%)
- Funciones de formateo delegadas completamente a módulo `Formatters`
- `getProfitClasses` y `getExchangeIcon` delegadas a `RouteRenderer`
- Eliminado código fallback duplicado que existía en popup.js y en módulos

### 🧹 Refactorización main-simple.js
- **main-simple.js:** Reducido de 2394 a 2115 líneas (-279 líneas, -11.6%)
- Eliminada `fetchDollarTypes()` - función legacy no referenciada
- Eliminada `getCachedData()` - función no utilizada

### 🔧 Cambios Técnicos
- `formatNumber`, `formatUsdUsdtRatio`, `formatCommissionPercent`, `getDollarSourceDisplay` → Formatters
- `getProfitClasses`, `getExchangeIcon` → RouteRenderer
- Módulos ya cargados vía popup.html (utils/logger.js, utils/formatters.js, utils/stateManager.js, ui/routeRenderer.js)

### 📊 Métricas Post-Refactorización
| Archivo | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| popup.js | 4791 líneas | 4062 líneas | -729 (-15.2%) |
| main-simple.js | 2394 líneas | 2115 líneas | -279 (-11.6%) |
| **TOTAL** | 7185 líneas | 6177 líneas | **-1008 (-14.0%)** |

### 🧪 Testing
- 47 tests passing
- Sin regresiones funcionales

---

## [5.0.83] - 2026-01-16 - SISTEMA DE ALERTAS CORREGIDO

### 🐛 BUG FIX CRÍTICO
- **SOLUCIONADO:** Sistema de alertas/notificaciones no respetaba configuración del usuario
- **Problema:** El `alertThreshold` de options.js no coincidía con lo que buscaba main-simple.js
- **Problema:** `notificationExchanges` no se usaba correctamente (se buscaba `preferredExchanges`)
- **Impacto:** Las notificaciones se enviaban sin respetar umbral ni filtro de exchanges

### 🔧 Cambios Técnicos
- **main-simple.js:** `shouldSendNotification()` ahora usa `alertThreshold` directamente
- **main-simple.js:** Corregido filtro de exchanges a `notificationExchanges`
- **main-simple.js:** Agregado logging para debugging de decisiones de notificación
- **main-simple.js:** `arbKey` ahora usa `Math.floor()` para evitar spam de notificaciones

### 🧪 Testing
- **Nuevos tests:** 11 tests de notificaciones agregados (`tests/notifications.test.js`)
- **Total tests:** 47 tests, todos pasando
- **Cobertura:** Threshold, exchanges, case-insensitive matching, rate limiting

### 📚 Documentación
- **NUEVO:** `docs/API_INTERNA.md` - Documentación completa de APIs internas
- **Actualizado:** `docs/DOCS_INDEX.md` - Agregada sección de documentación técnica
- **Actualizado:** `docs/AUDITORIA_COMPLETA_2026.md` - Puntuación global: 7.9/10 (+2.0)

### 📊 Métricas
| Métrica | Antes | Después |
|---------|-------|---------|
| Tests | 36 | 47 |
| Puntuación audit | 7.5/10 | 7.9/10 |
| Sistema alertas | 🔴 Broken | ✅ Funcional |

---

## [5.0.82] - 2026-01-15 - CI/CD + PRESETS SIMULADOR

### ✨ Nuevas Funcionalidades
- **CI/CD GitHub Actions:** Workflows para lint, test, build automáticos
- **Auto-release:** Publicación automática con tags `v*.*.*`
- **Presets de simulador:** 3 perfiles de riesgo (Conservador, Moderado, Agresivo)

### 🔧 Archivos Agregados
- `.github/workflows/ci.yml` - Pipeline de CI
- `.github/workflows/release.yml` - Auto-release

### 📊 Presets de Simulador
| Perfil | Fee Compra | Fee Venta | Spread |
|--------|------------|-----------|--------|
| Conservador | 1.5% | 1.5% | 1.02x |
| Moderado | 1.0% | 1.0% | 1.01x |
| Agresivo | 0.5% | 0.5% | 1.005x |

---

## [5.0.75] - 2025-10-12 - HOTFIX CRÍTICO

### 🐛 BUG FIX CRÍTICO
- **SOLUCIONADO:** Error "Error al obtener datos de bancos" causado por función duplicada
- **Eliminada función duplicada:** `loadBanksData` en popup.js (líneas 840-1070)
- **Impacto:** Sin este fix, la extensión no podía cargar datos de bancos
- **Estado:** ✅ Extensión ahora carga correctamente todos los datos

### 📝 Detalles Técnicos
- La función `loadBanksData` estaba duplicada en popup.js causando conflictos
- La versión duplicada era obsoleta y no manejaba correctamente los mensajes
- Eliminación de código duplicado resolvió el problema de carga de datos
- Verificación completa: sintaxis correcta, APIs funcionando (22 bancos disponibles)

### 🧪 Testing
- **Verificación sintáxis:** ✅ Pasó validación Node.js
- **Tests de funcionalidad:** ✅ Todos los tests pasan
- **APIs externas:** ✅ CriptoYa y DolarAPI responden correctamente
- **Componentes:** ✅ Popup, background, DataService, ValidationService funcionando

### 📚 Documentación
- Actualizado CHANGELOG en docs/changelog/CHANGELOG.md
- Agregada entrada de hotfix v5.0.75
- Documentado proceso de debugging y resolución

---

## 🔧 HOTFIX RECIENTE - Configuración por Defecto Más Permisiva

**Fecha**: 12 de octubre de 2025  
**Tipo**: UX IMPROVEMENT - Valores por defecto más amigables

### ⚙️ Cambios en Configuración por Defecto
- **Umbral de ganancia mínimo:** Cambiado de `1.5%` a `1.0%` para mostrar más oportunidades
- **Mostrar rutas negativas:** Activado por defecto (`true`) para que usuarios sepan que el sistema funciona
- **Motivo:** Los usuarios reportaban "no routes available" porque el umbral 1.5% era demasiado restrictivo

### 📊 Impacto en UX
- **Antes:** Solo rutas ≥1.5% mostradas, usuarios pensaban que el sistema no funcionaba
- **Ahora:** Todas las rutas ≥1.0% mostradas + rutas negativas, usuarios ven que el sistema está activo
- **Beneficio:** Mejor experiencia inicial, usuarios entienden que la extensión funciona correctamente

### 🔧 Archivos Modificados
- `src/options.js`: DEFAULT_SETTINGS.profitThreshold = 1.0
- `src/popup.js`: loadUserSettings() default profitThreshold = 1.0
- `docs/CHANGELOG.md`: Actualizada documentación de valores por defecto

---

## [3.2.1] - 2025-10-02 - HOTFIX CRÍTICO

### 🐛 BUG FIX CRÍTICO
- **SOLUCIONADO:** ReferenceError: usdtUsd is not defined
- **Agregada función faltante:** `fetchCriptoyaUSDTtoUSD()` en background.js
- **Impacto:** Sin este fix, v3.0-v3.2.0 NO FUNCIONABAN
- **Estado:** ✅ Extensión ahora carga correctamente

### 📝 Detalles Técnicos
- La función `updateData()` usaba `usdtUsd` pero nunca la obtenía de la API
- Agregado endpoint: `https://criptoya.com/api/usdt/usd/1`
- Validación añadida en updateData() para verificar que usdtUsd existe
- Este dato es CRÍTICO desde v3.0 para calcular el ratio USD/USDT (~1.049)

### 📚 Documentación
- Agregado `FIX_V3.2.1_CRITICAL.md` con análisis completo del problema
- Agregado `INSTRUCCIONES_RECARGA.md` para debugging

---

## [3.2.0] - 2025-10-02

### 🎨 REDISEÑO COMPLETO - Dark Mode Premium UI

#### ✨ Interfaz Oscura Profesional
- **Dark Mode nativo:** Fondo oscuro (#0a0e1a, #1a1f2e, #0f1419)
- **Gradientes azules premium:** De #1e3a8a → #3b82f6 → #06b6d4
- **Bordes redondeados:** 16px en container, 14-16px en cards
- **Mejor legibilidad:** Colores optimizados para Dark Mode

#### 🌟 Efectos Visuales Avanzados
- **Glassmorphism:** Efecto de vidrio con `backdrop-filter: blur(20px)`
- **Animaciones fluidas:** Transiciones suaves con `cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover effects mejorados:** Elevation, glow y scale
- **Sombras profundas:** Múltiples capas para mejor depth perception

#### 🎯 Mejoras en Componentes
- **Header animado:** Pulso radial de fondo con gradiente azul
- **Botones premium:** Glassmorphism, bordes redondeados 12px, animación de rotación 360°
- **Tabs modernas:** Indicador animado con gradiente, efectos hover suaves
- **Cards optimizadas:** Efecto shimmer al hover, borders con gradiente
- **Badges mejorados:** Animación `pulseGlow` para profits altos

#### 📱 Scrollbar Personalizado
- **Diseño custom:** Scrollbar con gradiente azul (#3b82f6 → #06b6d4)
- **Ancho optimizado:** 8px para mejor usabilidad
- **Hover effect:** Cambia a tonos más claros

#### ⚡ Performance UI
- **Font optimizado:** Inter como primary, fallback a system fonts
- **Animaciones suaves:** 60fps en todas las transiciones
- **Reduced motion support:** Respeta preferencias de accesibilidad

#### 🎨 Detalles de Diseño
- **Spacing consistente:** Sistema de espaciado coherente (8px base)
- **Typography mejorada:** Letter-spacing y font-weights optimizados
- **Color system:** Paleta coherente con variables semánticas
- **Focus states:** Outlines visibles para accesibilidad (WCAG 2.1)

#### 📊 Mejoras Visuales en Datos
- **Price rows:** Hover effect con background highlight
- **Fees section:** Gradiente naranja con borders y shadows
- **Profit values:** Text-shadow con glow effect para highlights
- **Loading states:** Spinner con gradiente azul, animación fadeInOut

### 📝 Documentación
- **MEJORAS_SUGERIDAS_V3.2+.md:** Documento completo con 10 mejoras prioritarias
- **Roadmap detallado:** Plan de desarrollo para Q4 2025 - Q3 2026
- **Quick wins:** 5 mejoras de implementación rápida (2-6 horas)
- **Análisis de competencia:** Comparación con herramientas similares

---

## [3.1.0] - 2025-10-02

### 🔔 NUEVA CARACTERÍSTICA - Sistema de Notificaciones Personalizable

#### ⭐ Página de Configuración Completa
- **Nueva página de opciones:** Interfaz dedicada para configurar notificaciones
- **Acceso fácil:** Botón ⚙️ en el popup + click derecho en extensión
- **6 secciones de configuración:** Control total sobre las notificaciones

#### 🎯 Control de Notificaciones
- **On/Off global:** Desactiva completamente las notificaciones si no quieres ser molestado
- **5 tipos de alertas:**
  - Todas (≥1.5%)
  - Moderadas (≥5%)
  - Altas (≥10%)
  - Excepcionales (≥15%)
  - Personalizado (1-20%)
- **Umbral custom:** Define tu propio porcentaje mínimo

#### ⏰ Control de Frecuencia
- **6 opciones de frecuencia:**
  - Sin límite
  - Cada 5 minutos
  - Cada 15 minutos (default)
  - Cada 30 minutos
  - Cada hora
  - Una vez por sesión
- **Previene spam:** Evita notificaciones repetitivas

#### 🏦 Filtros por Exchange
- **Selección múltiple:** Elige tus exchanges favoritos
- **8 exchanges disponibles:** Buenbit, Ripio, SatoshiTango, Letsbit, etc.
- **Todos por defecto:** Si no seleccionas, notifica de todos

#### 🕐 Modo Silencioso
- **Horario configurable:** Define cuándo NO quieres notificaciones
- **Soporta medianoche:** Ej: 22:00 - 08:00
- **Activación opcional:** Toggle on/off

#### 🔊 Sonido
- **Control de audio:** Activa/desactiva sonido de notificaciones
- **Toggle simple:** Un click para cambiar

#### 🧪 Test de Notificación
- **Botón de prueba:** Verifica tu configuración antes de guardar
- **Notificación de ejemplo:** Ve cómo se verán las alertas

### 🎨 Mejoras en la UI
- **Nuevo botón ⚙️:** Acceso rápido a configuración desde popup
- **Estilos modernos:** Gradientes purple/blue, switches animados
- **Grid responsivo:** Adaptable a móvil
- **Hover effects:** Feedback visual mejorado

### 🔧 Implementación Técnica
- **Nuevos archivos:**
  - `options.html` (242 líneas)
  - `options.css` (431 líneas)
  - `options.js` (189 líneas)
- **Sistema inteligente:** Verifica 6 condiciones antes de notificar
- **Persistencia local:** Configuración guardada en `chrome.storage.local`
- **Actualización en tiempo real:** No requiere reiniciar extensión

### 📊 Lógica de Notificaciones
- **6 validaciones antes de notificar:**
  1. ¿Notificaciones habilitadas?
  2. ¿Está en horario silencioso?
  3. ¿Pasó el tiempo mínimo?
  4. ¿Supera el umbral?
  5. ¿Es un exchange preferido?
  6. ¿Ya se notificó este arbitraje?
- **Niveles de prioridad:** 🚀 Excepcional, 💎 Alta, 💰 Moderada, 📊 Normal
- **Botones en notificación:** Ver Detalles + Configuración

### ⚙️ Configuración por Defecto
```
Notificaciones: ✅ Activadas
Tipo: Todas (≥1.0%)
Frecuencia: Cada 15 minutos
Sonido: ✅ Activado
Exchanges: Todos
Horario silencioso: ❌ Desactivado
Mostrar rutas negativas: ✅ Activado
```

### 📄 Documentación
- **SISTEMA_NOTIFICACIONES_V3.1.md:** Guía completa (400+ líneas)
- **Casos de uso:** 4 ejemplos de configuración
- **Diagramas de flujo:** Explicación técnica

### 🔒 Permisos
- **Nuevo permiso:** `notifications` (Chrome notifications API)

---

## [3.0.0] - 2025-10-02

### 🚨 CAMBIO CRÍTICO - Corrección de Lógica Fundamental

#### ❌ PROBLEMA CORREGIDO
- **ERROR CRÍTICO:** Las versiones anteriores NO consideraban el costo real de convertir USD a USDT
- **IMPACTO:** Sobreestimaba la ganancia en ~6.76% (~$6,758 por cada $100k)
- **EJEMPLO:** Mostraba 44.66% cuando la ganancia real era 37.91%

#### ✅ SOLUCIÓN IMPLEMENTADA
- **Agregada API USD/USDT:** Ahora consulta el precio real de conversión
- **Cálculo corregido:** Considera ratio USD/USDT (~1.049 en Buenbit)
- **Resultados REALES:** Las ganancias mostradas ahora son ejecutables

### 🔴 Breaking Changes
- **Objeto arbitrage modificado:**
  - ❌ Removidos: `buyPrice`, `sellPrice`
  - ⭐ Agregados: `usdToUsdtRate`, `usdtArsAsk`, `usdtArsBid`
- **Nueva API requerida:** `https://criptoya.com/api/usdt/usd/1`
- **Ganancia típica ajustada:** ~38% (antes mostraba ~45% incorrecto)

### ⭐ Nuevas Características
- Muestra ratio USD/USDT en tarjetas de oportunidad
- Detalle de conversión USD→USDT en guía paso a paso
- Advertencia de costo de conversión en UI
- Validación de ratios anormales (>1.15 o <0.95)

### 🐛 Correcciones
- **Cálculo de USDT comprados:** Ahora divide por ratio (antes multiplicaba por 1)
- **Validación de exchanges:** Omite exchanges sin cotización USD/USDT
- **Filtrado mejorado:** Detecta ratios P2P sospechosos

### 🧪 Testing
- **Test suite v3.0:** 6 tests, 100% passed
- **Validado con datos reales:** Buenbit, SatoshiTango, Decrypto
- **Análisis de sensibilidad:** Impacto del ratio documentado

### 📊 Comparación v2.x vs v3.0
| Métrica | v2.x | v3.0 | Diferencia |
|---------|------|------|------------|
| Ganancia con $100k | $144,664 | $137,906 | -$6,758 |
| % Ganancia | 44.66% | 37.91% | -6.76% |
| USDT comprados | 95.14 | 90.70 | -4.44 |
| Considera USD→USDT | ❌ | ✅ | CRÍTICO |

### 📄 Documentación
- **ACTUALIZACION_V3.0.md:** Documentación completa del cambio
- **ANALISIS_ERROR_LOGICA.md:** Análisis detallado del problema
- **test-extension-v3.js:** Suite de tests actualizada

### ⚠️ Nota para Usuarios
- ✅ El arbitraje SIGUE siendo rentable (~38%)
- ✅ Los cálculos ahora son CORRECTOS (antes sobrestimados)
- ⚠️ Las ganancias mostradas son MENORES pero REALES
- 📉 Esto NO es un bug, es una corrección necesaria

---

## [2.2.0] - 2025-01-XX

### 🔒 Seguridad
- Agregada validación de `officialSellPrice > 0` antes de división para evitar crashes
- Agregada validación `isFinite()` para prevenir NaN/Infinity en cálculos

### 🐛 Correcciones
- **Filtrado mejorado**: Excluye claves no-exchange (`time`, `p2p`, `timestamp`, etc.)
- **Umbral inclusivo**: Cambiado de `> 1.5%` a `>= 1.5%` para incluir exactamente 1.5%
- **Detección P2P**: Agregado filtro de spread >10% para identificar exchanges P2P
- **Validaciones estrictas**: Todos los precios deben ser `> 0` (no solo `!= 0`)

### ✨ Mejoras
- Agregados logs informativos (`console.info`) para exchanges desconocidos
- Logs de advertencia (`console.warn`) para spreads altos (posible P2P)
- Mejor manejo de errores con mensajes específicos al usuario
- Validación de doble verificación en precio oficial

### 🧪 Testing
- **Agregado test suite completo** con 5 categorías de tests
- Validación de estructura de comisiones (11 exchanges)
- Simulación de cálculo de arbitraje ($100k → 8.76% neto)
- Tests de condiciones límite (precio=0, pérdidas, fees altos)
- Validación de estructura de objeto arbitrage
- Tests de lógica de filtrado por umbral

### 📊 Resultados
- ✅ 5/5 tests pasados
- ✅ 5 correcciones críticas implementadas
- ✅ 0 breaking changes
- ✅ 100% compatible con v2.1.0

---

## [2.1.0] - 2025-10-02

### 💰 Actualización Mayor - Cálculo con Comisiones Reales

#### ✨ Agregado
- **Cálculo de comisiones por exchange:**
  - Trading fees al comprar USDT (0.1% - 1.5%)
  - Trading fees al vender USDT (0.1% - 1.5%)
  - Withdrawal fees al retirar ARS (0% - 0.5%)
  - Base de datos con fees reales de 10+ exchanges

- **Visualización mejorada de comisiones:**
  - Muestra total de comisiones en cada tarjeta
  - Diferencia entre ganancia bruta y neta
  - Desglose detallado en la guía paso a paso
  - Cálculo real con $100,000 ARS de ejemplo

- **Cálculos más precisos:**
  - Considera fees de trading en ambas operaciones
  - Incluye costs de retiro bancario
  - Muestra ganancia neta real (post-fees)
  - Umbral mínimo ajustado a 1.5% neto

#### 🔧 Mejorado
- Algoritmo de cálculo de arbitraje más realista
- Mejor transparencia en costos ocultos
- Ejemplos actualizados con comisiones incluidas
- Advertencias más claras sobre fees variables

---

## [2.0.0] - 2025-10-02

### 🎉 Nueva Versión Mayor - UI/UX Completamente Renovada

#### ✨ Agregado
- **Sistema de pestañas** con 3 secciones principales:
  - 🎯 Oportunidades: Visualización de arbitrajes
  - 📚 Guía Paso a Paso: Instrucciones detalladas
  - 🏦 Bancos: Información de entidades bancarias
  
- **Tarjetas interactivas de arbitraje:**
  - Diseño moderno con gradientes púrpura/azul
  - Click para ver guía detallada
  - Indicador visual de alta rentabilidad (>5%)
  - Animaciones suaves y transiciones
  
- **Guía paso a paso completa:**
  - 4 pasos numerados y detallados
  - Calculadora automática de ganancias
  - Ejemplo con inversión de $100,000 ARS
  - Enlaces directos a pestañas relacionadas
  - Advertencias importantes resaltadas
  
- **Integración con bancos:**
  - Web scraping desde DolarAPI
  - Lista de bancos con precios compra/venta
  - Actualización automática cada 30 minutos
  - Caché inteligente de datos
  
- **Mejoras visuales:**
  - Header con gradiente y botón flotante
  - Scrollbar personalizado
  - Loading spinner animado
  - Badges de rentabilidad destacados
  - Footer con timestamp y advertencias
  
- **Nueva funcionalidad JavaScript:**
  - Sistema de selección de arbitrajes
  - Navegación dinámica entre tabs
  - Formateo mejorado de números
  - Manejo robusto de estados
  
- **Documentación extendida:**
  - README.md v2.0 completamente reescrito
  - GUIA_USO.md con capturas textuales
  - CHANGELOG.md para seguimiento de versiones

#### 🔧 Corregido
- **Variables sin declarar** en background.js
- **Optional chaining** implementado en todo el código
- **Validación de datos** más robusta con `?.` operator
- **Estructura de APIs** adaptada al formato real
- **Timeout de peticiones** mejorado a 10 segundos
- **Manejo de errores** con mensajes descriptivos

#### 🚀 Mejorado
- **Performance:** Caché de datos de bancos (30 min)
- **UX:** Interfaz más intuitiva y clara
- **Código:** ES6+ moderno con async/await
- **Estilos:** CSS3 con animaciones y gradientes
- **Rate limiting:** Respeto estricto de límites API

#### 📝 Cambiado
- Versión de manifest a 3 (última versión)
- Ancho del popup aumentado a 450px
- Altura mínima establecida en 550px
- Top de arbitrajes de 3 a 5 oportunidades
- Umbral de notificaciones sigue en >5%

---

## [1.0.0] - 2025-10-02

### 🎊 Primera Versión - Lanzamiento Inicial

#### ✨ Agregado
- **Funcionalidad básica de arbitraje:**
  - Monitoreo de dólar oficial vs USDT
  - Cálculo automático de ganancias
  - Top 3 mejores oportunidades
  
- **Integración con APIs:**
  - DolarAPI para cotización oficial
  - CriptoYA para precios USDT en exchanges
  
- **Sistema de notificaciones:**
  - Alertas para oportunidades >5%
  - Icono y mensaje descriptivo
  
- **Actualización automática:**
  - Polling cada 1 minuto
  - Alarmas de Chrome para programación
  
- **Interfaz básica:**
  - Popup simple con lista de arbitrajes
  - Botón de actualización manual
  - Información del dólar oficial
  - Timestamp de última actualización
  
- **Rate limiting:**
  - Control de 110 peticiones/minuto
  - Delay de 600ms entre requests
  
- **Almacenamiento local:**
  - Chrome Storage API
  - Persistencia de datos entre sesiones
  
- **Validaciones:**
  - Verificación de estructura de datos
  - Manejo básico de errores
  - Timeout en peticiones fetch

#### 🔧 Configuración
- Manifest V3
- Permisos: storage, notifications, alarms
- Service Worker para background tasks
- Popup HTML/CSS/JS básico

---

## Formato del Changelog

Este changelog sigue los principios de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

### Tipos de Cambios:
- **Agregado** - Para nuevas funcionalidades
- **Cambiado** - Para cambios en funcionalidades existentes
- **Obsoleto** - Para funcionalidades que serán eliminadas
- **Eliminado** - Para funcionalidades eliminadas
- **Corregido** - Para corrección de bugs
- **Seguridad** - Para vulnerabilidades de seguridad

---

## Roadmap Futuro

### [2.1.0] - Próximamente
- [ ] Gráficos históricos de arbitrajes
- [ ] Comparación de múltiples arbitrajes
- [ ] Exportar datos a CSV/Excel
- [ ] Modo oscuro / tema personalizable
- [ ] Soporte para más exchanges

### [2.2.0] - En Planificación
- [ ] Integración con Telegram para alertas
- [ ] Calculadora avanzada con comisiones personalizables
- [ ] Historial de operaciones realizadas
- [ ] Estadísticas de rentabilidad mensual
- [ ] Widget de escritorio (opcional)

### [3.0.0] - Ideas Futuras
- [ ] Soporte para otras criptomonedas (BTC, ETH, DAI)
- [ ] Arbitraje entre múltiples exchanges
- [ ] Sistema de usuarios con perfiles
- [ ] API pública para desarrolladores
- [ ] Aplicación web complementaria

---

**Nota:** Las fechas son aproximadas y pueden cambiar según prioridades y feedback de usuarios.
