# Changelog - ArbitrageAR

Todos los cambios notables de este proyecto serán documentados en este archivo.

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
