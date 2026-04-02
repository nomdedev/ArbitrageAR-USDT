---
skillName: background-auditor
description: Agente especializado en auditar el Service Worker y procesos en segundo plano
tags: [audit, background, service-worker, runtime, alarms]
---

# Background Auditor Skill

## Responsabilidad
Auditar el Service Worker y todos los procesos que ocurren en segundo plano.

## Archivos Bajo Auditoría
- `src/background/main-simple.js` (principal)
- `src/background/apiClient.js`
- `src/background/arbitrageCalculator.js`
- `src/background/cacheManager.js`

## Checklist de Auditoría

### 1. Service Worker Lifecycle
- [ ] Verificar inicialización correcta
- [ ] Comprobar manejo de terminación/reinicio
- [ ] Validar persistencia de estado global
- [ ] Revisar logs de inicio

### 2. Mensajería Runtime
- [ ] Verificar `chrome.runtime.onMessage` listeners
- [ ] Comprobar `return true` para async handlers
- [ ] Validar estructura de mensajes
- [ ] Revisar manejo de `chrome.runtime.lastError`

### 3. Alarms y Actualizaciones
- [ ] Verificar `chrome.alarms.create()` configuración
- [ ] Comprobar `chrome.alarms.onAlarm` listener
- [ ] Validar intervalo de actualización (1 min)
- [ ] Revisar cleanup de alarms

### 4. Storage y Persistencia
- [ ] Verificar uso de `chrome.storage.local`
- [ ] Comprobar listener `chrome.storage.onChanged`
- [ ] Validar persistencia de `notificationSettings`
- [ ] Revisar manejo de datos corruptos

### 5. APIs Fetching
- [ ] Verificar timeout configurado (12s)
- [ ] Comprobar rate limiting (600ms)
- [ ] Validar manejo de errores de red
- [ ] Revisar retry logic

## Issues Conocidos a Verificar

### Issue #1: Configuración dólar manual no aplica
**Archivo:** `main-simple.js` líneas 185-190
**Problema:** Siempre llama `fetchDolarOficial()` sin verificar `dollarPriceSource`

```javascript
// CÓDIGO ACTUAL (BUG):
const [oficial, usdt, usdtUsd] = await Promise.all([
  fetchDolarOficial(),  // ❌ Siempre usa API
  fetchUSDT(),
  fetchUSDTtoUSD()
]);

// FIX REQUERIDO:
const settings = await chrome.storage.local.get('notificationSettings');
let oficial;
if (settings.notificationSettings?.dollarPriceSource === 'manual') {
  oficial = {
    compra: settings.notificationSettings.manualDollarPrice,
    venta: settings.notificationSettings.manualDollarPrice,
    source: 'manual'
  };
} else {
  oficial = await fetchDolarOficial();
}
const [usdt, usdtUsd] = await Promise.all([fetchUSDT(), fetchUSDTtoUSD()]);
```

### Issue #2: Storage changes no disparan recálculo
**Problema:** No hay listener para `chrome.storage.onChanged`

```javascript
// FIX REQUERIDO:
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.notificationSettings) {
    console.log('⚙️ Configuración cambió, actualizando...');
    updateData();
  }
});
```

## Comandos de Diagnóstico

```javascript
// Verificar estado del Service Worker
chrome.runtime.getBackgroundPage((bg) => {
  console.log('Estado:', bg.currentData);
  console.log('Última actualización:', new Date(bg.lastUpdate));
});

// Verificar alarms
chrome.alarms.getAll((alarms) => {
  console.log('Alarms activas:', alarms);
});

// Verificar storage
chrome.storage.local.get(null, (data) => {
  console.log('Storage:', data);
});
```

## Métricas a Medir
- Tiempo de inicio del Service Worker
- Tiempo de respuesta a mensajes
- Uso de memoria
- Frecuencia de actualizaciones

## Output de Auditoría
```
📊 AUDITORÍA BACKGROUND
=======================
✅ Service Worker inicializa correctamente
✅ Mensajes runtime funcionan
⚠️ dollarPriceSource manual no implementado
⚠️ Falta storage.onChanged listener
✅ Alarms configuradas
✅ Rate limiting funciona
```