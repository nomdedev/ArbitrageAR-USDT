# 🔍 AUDITORÍA COMPLETA - ArbitrageAR-USDT

**Fecha:** 31 de Marzo de 2026
**Versión:** 6.0.0
**Estado:** En Progreso

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Agentes de Auditoría](#agentes-de-auditoría)
3. [Matriz de Responsabilidades](#matriz-de-responsabilidades)
4. [Auditoría por Componente](#auditoría-por-componente)
5. [Checklist de Tareas](#checklist-de-tareas)
6. [Priorización de Fixes](#priorización-de-fixes)

---

## 📊 RESUMEN EJECUTIVO

### Estado General del Proyecto

| Área | Estado | Prioridad | Agente Responsable |
|------|--------|-----------|-------------------|
| Service Worker | ⚠️ Revisar | Alta | `background-auditor` |
| Popup UI | ⚠️ Revisar | Alta | `ui-auditor` |
| Módulos | ✅ OK | Media | `modules-auditor` |
| APIs | ⚠️ Revisar | Alta | `api-auditor` |
| Seguridad | ⚠️ Revisar | Crítica | `security-auditor` |
| Performance | ⚠️ Revisar | Media | `performance-auditor` |
| Testing | ✅ OK | Baja | `testing-auditor` |
| Utils | ✅ OK | Baja | `utils-auditor` |

### Problemas Conocidos (de documentación)

1. **Configuración dólar manual no se aplica** - `main-simple.js`
2. **Botón "Recalcular" no funciona** - `popup.js`
3. **Storage changes no disparan recálculo** - Sin listener
4. **Posible XSS en innerHTML** - `popup.js` líneas 1177-1227
5. **Validación insuficiente de URLs** - `options.js`
6. **Logging excesivo en producción** - Múltiples archivos

---

## 🤖 AGENTES DE AUDITORÍA

### 1. `background-auditor`
**Responsabilidad:** Service Worker y procesos en segundo plano

**Archivos a auditar:**
- `src/background/main-simple.js`
- `src/background/apiClient.js`
- `src/background/arbitrageCalculator.js`
- `src/background/cacheManager.js`

**Tareas:**
- [ ] Verificar manejo de mensajes runtime
- [ ] Revisar inicialización del Service Worker
- [ ] Validar fetch de APIs con timeout
- [ ] Comprobar rate limiting
- [ ] Verificar persistencia de estado
- [ ] Revisar alarms y actualizaciones automáticas
- [ ] Validar manejo de errores

**Issues conocidos:**
- `dollarPriceSource: 'manual'` no se respeta
- Falta listener para `chrome.storage.onChanged`

---

### 2. `ui-auditor`
**Responsabilidad:** Interfaz de usuario del popup

**Archivos a auditar:**
- `src/popup.js`
- `src/popup.html`
- `src/popup.css`
- `src/ui/*.js`
- `src/ui-components/*.js`

**Tareas:**
- [ ] Verificar inicialización del DOM
- [ ] Revisar renderizado de rutas
- [ ] Validar sistema de tabs
- [ ] Comprobar responsive design (350px)
- [ ] Revisar modales y diálogos
- [ ] Validar botón actualizar
- [ ] Revisar botón recalcular (no funciona)
- [ ] Verificar filtros de rutas

**Issues conocidos:**
- Botón "Recalcular" no ejecuta cálculo real
- innerHTML sin sanitizar (XSS potencial)

---

### 3. `modules-auditor`
**Responsabilidad:** Módulos especializados

**Archivos a auditar:**
- `src/modules/filterManager.js`
- `src/modules/modalManager.js`
- `src/modules/notificationManager.js`
- `src/modules/routeManager.js`
- `src/modules/simulator.js`

**Tareas:**
- [ ] Verificar patrón Module (IIFE)
- [ ] Revisar inicialización de cada módulo
- [ ] Validar interfaz pública
- [ ] Comprobar encapsulamiento
- [ ] Revisar manejo de estado privado
- [ ] Verificar eventos emitidos

---

### 4. `api-auditor`
**Responsabilidad:** Integración con APIs externas

**Archivos a auditar:**
- `src/background/apiClient.js`
- `src/DataService.js`

**Tareas:**
- [ ] Verificar endpoints configurados
- [ ] Revisar timeout de requests
- [ ] Validar rate limiting
- [ ] Comprobar manejo de errores
- [ ] Revisar validación de respuestas
- [ ] Verificar retry logic
- [ ] Comprobar cache de respuestas

**APIs monitoreadas:**
- DolarAPI: `https://dolarapi.com/v1/dolares/oficial`
- CriptoYa USDT/ARS: `https://criptoya.com/api/usdt/ars/1`
- CriptoYa Banks: `https://criptoya.com/api/bancostodos`

---

### 5. `security-auditor`
**Responsabilidad:** Seguridad y vulnerabilidades

**Archivos a auditar:**
- Todos los archivos JS
- `manifest.json`

**Tareas:**
- [ ] Revisar Content Security Policy
- [ ] Validar permisos en manifest.json
- [ ] Buscar innerHTML sin sanitizar
- [ ] Revisar validación de URLs
- [ ] Comprobar sanitización de inputs
- [ ] Revisar almacenamiento de datos sensibles
- [ ] Verificar validación de origen de mensajes
- [ ] Buscar console.log en producción

**Vulnerabilidades conocidas:**
- XSS potencial en `popup.js:1177-1227`
- Validación URLs insuficiente en `options.js:300-350`
- Storage sin cifrar en `options.js:200-250`

---

### 6. `performance-auditor`
**Responsabilidad:** Rendimiento y optimización

**Archivos a auditar:**
- `src/popup.js` (4556 líneas - muy grande)
- `src/background/arbitrageCalculator.js`
- Todos los renderizadores

**Tareas:**
- [ ] Medir tiempo de carga del popup
- [ ] Revisar tamaño de archivos
- [ ] Identificar cuellos de botella
- [ ] Buscar memory leaks
- [ ] Revisar renderizado de listas
- [ ] Comprobar lazy loading
- [ ] Verificar uso de memoización
- [ ] Medir uso de CPU/memoria

**Métricas objetivo:**
- Tiempo carga popup: < 300ms
- Renderizado 100 items: < 200ms
- Memoria total: < 50MB

---

### 7. `testing-auditor`
**Responsabilidad:** Cobertura y calidad de tests

**Archivos a auditar:**
- `tests/*.test.js`
- `tests/e2e/*.spec.js`
- `jest.config.js`
- `playwright.config.js`

**Tareas:**
- [ ] Verificar cobertura de tests
- [ ] Revisar tests unitarios
- [ ] Validar tests E2E
- [ ] Comprobar mocks de Chrome APIs
- [ ] Verificar CI/CD si existe

**Cobertura objetivo:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

### 8. `utils-auditor`
**Responsabilidad:** Utilidades y helpers

**Archivos a auditar:**
- `src/utils/*.js`
- `src/utils.js`

**Tareas:**
- [ ] Verificar StateManager
- [ ] Revisar Formatters
- [ ] Validar Logger
- [ ] Comprobar CommonUtils
- [ ] Revisar bankCalculations

---

## 📋 MATRIZ DE RESPONSABILIDADES

| Archivo | background | ui | modules | api | security | performance | testing | utils |
|---------|------------|----|---------|-----|----------|-------------|---------|-------|
| `main-simple.js` | ✅ | | | ✅ | ✅ | ✅ | | |
| `apiClient.js` | ✅ | | | ✅ | ✅ | ✅ | | |
| `arbitrageCalculator.js` | ✅ | | | | | ✅ | ✅ | |
| `popup.js` | | ✅ | | | ✅ | ✅ | ✅ | |
| `options.js` | | ✅ | | | ✅ | | ✅ | |
| `modules/*.js` | | | ✅ | | | | ✅ | |
| `utils/*.js` | | | | | | | ✅ | ✅ |
| `manifest.json` | ✅ | | | | ✅ | | | |

---

## 🔍 AUDITORÍA POR COMPONENTE

### 1. Service Worker (`main-simple.js`)

**Estado actual:**
- ✅ Service Worker se inicia correctamente
- ✅ Mensajes runtime funcionan
- ⚠️ Configuración manual del dólar no se aplica
- ⚠️ No hay listener para cambios en storage

**Problemas detectados:**

```javascript
// BUG: Línea 185-190 - Siempre usa DolarAPI
const [oficial, usdt, usdtUsd] = await Promise.all([
  fetchDolarOficial(),  // ❌ SIEMPRE llama API
  fetchUSDT(),
  fetchUSDTtoUSD()
]);

// FIX REQUERIDO:
const settingsResult = await chrome.storage.local.get('notificationSettings');
if (settingsResult.notificationSettings?.dollarPriceSource === 'manual') {
  oficial = { compra: manualPrice, venta: manualPrice };
} else {
  oficial = await fetchDolarOficial();
}
```

**Tareas:**
1. Implementar respeto a `dollarPriceSource`
2. Añadir listener `chrome.storage.onChanged`
3. Verificar persistencia de `currentData`

---

### 2. Popup UI (`popup.js`)

**Estado actual:**
- ✅ UI se renderiza correctamente
- ✅ Tabs funcionan
- ⚠️ Botón "Recalcular" no funciona
- ⚠️ XSS potencial en innerHTML

**Problemas detectados:**

```javascript
// BUG: Línea 1886-1910 - Recalcular no ejecuta
async function showRecalculateDialog() {
  const customPrice = prompt('...');
  if (customPrice) {
    // ❌ NO recalcula realmente
    alert('Para cambiar el precio, usa Configuración');
    fetchAndDisplay(); // Solo refresca
  }
}

// SECURITY: Línea 1177-1227 - XSS potencial
card.innerHTML = `
  <h3>${exchangeFormatted}</h3>  // ❌ Sin sanitizar
`;
```

**Tareas:**
1. Implementar funcionalidad real de recalcular
2. Sanitizar HTML en `createRouteCard`
3. Reducir tamaño del archivo (4556 líneas)

---

### 3. Módulos Especializados

**Estado actual:**
- ✅ Patrón Module implementado
- ✅ Encapsulamiento correcto
- ✅ Interfaz pública clara

**Tareas:**
1. Verificar inicialización correcta
2. Revisar manejo de eventos
3. Validar integración entre módulos

---

### 4. APIs Externas

**Estado actual:**
- ✅ Fetch con timeout configurado
- ✅ Rate limiting implementado
- ⚠️ Validación de respuestas mejorable

**Tareas:**
1. Mejorar validación de schemas
2. Implementar retry con backoff
3. Añadir circuit breaker

---

### 5. Seguridad

**Estado actual:**
- ✅ CSP configurado
- ✅ Permisos mínimos
- ⚠️ XSS potencial
- ⚠️ Validación de URLs mejorable

**Puntuación: 8.0/10**

**Tareas prioritarias:**
1. Sanitizar innerHTML
2. Validar URLs con whitelist
3. Cifrar datos sensibles en storage

---

### 6. Performance

**Estado actual:**
- ⚠️ `popup.js` muy grande (4556 líneas)
- ⚠️ Sin virtual scrolling
- ⚠️ Sin memoización

**Puntuación: 7.0/10**

**Tareas prioritarias:**
1. Refactorizar `popup.js` en módulos
2. Implementar virtual scrolling
3. Añadir memoización en cálculos

---

## ✅ CHECKLIST DE TAREAS

### Alta Prioridad (Crítica)

- [ ] **FIX:** Implementar `dollarPriceSource: 'manual'` en `main-simple.js`
- [ ] **FIX:** Añadir `chrome.storage.onChanged` listener
- [ ] **SECURITY:** Sanitizar innerHTML en `popup.js`
- [ ] **SECURITY:** Validar URLs con whitelist en `options.js`

### Media Prioridad (Importante)

- [ ] **FIX:** Implementar funcionalidad real de "Recalcular"
- [ ] **REFACTOR:** Dividir `popup.js` en módulos
- [ ] **PERF:** Implementar virtual scrolling
- [ ] **PERF:** Añadir memoización en calculadora

### Baja Prioridad (Mejora)

- [ ] **CLEANUP:** Eliminar console.log de producción
- [ ] **DOCS:** Actualizar documentación
- [ ] **TEST:** Aumentar cobertura a > 80%

---

## 🎯 PRIORIZACIÓN DE FIXES

### Sprint 1 (Semana 1) - Crítico

| Tarea | Agente | Estimación | Impacto |
|-------|--------|------------|---------|
| Implementar dollarPriceSource manual | `background-auditor` | 2h | Alto |
| Añadir storage.onChanged listener | `background-auditor` | 1h | Alto |
| Sanitizar innerHTML (XSS) | `security-auditor` | 2h | Crítico |
| Validar URLs con whitelist | `security-auditor` | 1h | Crítico |

### Sprint 2 (Semana 2) - Importante

| Tarea | Agente | Estimación | Impacto |
|-------|--------|------------|---------|
| Funcionalidad "Recalcular" real | `ui-auditor` | 3h | Medio |
| Refactorizar popup.js | `ui-auditor` + `performance-auditor` | 8h | Medio |
| Virtual scrolling | `performance-auditor` | 4h | Medio |
| Memoización calculadora | `performance-auditor` | 2h | Medio |

### Sprint 3 (Semana 3-4) - Mejora

| Tarea | Agente | Estimación | Impacto |
|-------|--------|------------|---------|
| Eliminar console.log | `security-auditor` | 1h | Bajo |
| Aumentar cobertura tests | `testing-auditor` | 4h | Bajo |
| Actualizar documentación | `docs-auditor` | 2h | Bajo |

---

## 📝 NOTAS ADICIONALES

### Para ejecutar auditorías

```bash
# Auditoría de seguridad
npm run lint && npm run test

# Verificar APIs
curl -s https://dolarapi.com/v1/dolares/oficial | jq .

# Medir performance
npm run build:prod && ls -la dist/

# Tests con coverage
npm run test:coverage
```

### Contacto por componente

| Componente | Agente Principal | Archivo principal |
|------------|-----------------|-------------------|
| Background | `background-auditor` | `main-simple.js` |
| UI | `ui-auditor` | `popup.js` |
| APIs | `api-auditor` | `apiClient.js` |
| Seguridad | `security-auditor` | Todos |
| Performance | `performance-auditor` | `popup.js`, `arbitrageCalculator.js` |

---

**Documento generado:** 31 de Marzo de 2026
**Próxima revisión:** 7 de Abril de 2026