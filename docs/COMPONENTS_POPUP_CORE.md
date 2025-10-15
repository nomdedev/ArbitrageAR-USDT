# Documentación: Core del Popup (fetch & render)

Este documento describe las funciones centrales que obtienen datos y renderizan las tarjetas en el popup.

## Resumen general
Las piezas clave del flujo son:

1. `fetchAndDisplay()` — Orquesta la obtención de datos (DataService) y calcula/filtra rutas.
2. `displayArbitrages(arbitrages, official)` — Renderiza las `arbitrage-card` a partir del array de objetos `arbitrage`.
3. `displayRoutes(routes, official)` — Renderiza las `route-card` (rutas optimizadas) a partir del array `routes`.
4. `formatNumber`, `formatUsdUsdtRatio`, `formatCommissionPercent` — Helpers de formateo.
5. `validateRouteCalculations(route)` — Comprueba coherencia y retorna advertencias si algo no cuadra.

---

## `fetchAndDisplay()`
- Propósito: obtener datos (USDT por exchange, dólar oficial), calcular rutas y llamar a los renderers.
- Flujo:
  1. Llamar a `dataService.fetchUSDTData()` y `dataService.fetchDolarOficial()`.
  2. Ejecutar cálculo/filtrado (interno en `popup.js`) y poblar `allRoutes`.
  3. Llamar a `displayArbitrages()` / `displayRoutes()` con los datos.
- Errores: si `DataService` devuelve `null` se muestra mensaje de error en UI y se usa `handleNoData()`.

---

## `displayArbitrages(arbitrages, official)`

- Input: `arbitrages` = array de objetos con al menos `broker`, `profitPercentage`, `usdToUsdtRate`, `usdtArsBid`, `officialPrice`, `fees`.
- Output: inyecta HTML en `#optimized-routes`.

### Estructura generada (fragmento importante)
```html
<div class="arbitrage-card {profitClass}" data-index="{index}">
  <div class="card-header">
    <h3>🏦 {broker}</h3>
    <div class="broker-loss-indicator">⚠️ Pérdida</div> <!-- si aplica -->
    <div class="profit-badge {profitBadgeClass}">+{profit}%</div>
  </div>
  <div class="card-body">
    <div class="price-row"><span>💵 Dólar Oficial</span><span>${officialPrice}</span></div>
    <div class="price-row"><span>💸 USDT → ARS</span><span>${usdtArsBid}</span></div>
    <!-- Comisiones si existen -->
  </div>
</div>
```

### Notas
- `profitClass` y `profitBadgeClass` se obtienen con `getProfitClasses()` (ahora en `src/utils.js`).
- `negativeIndicator` (pérdida) se muestra como `.broker-loss-indicator` debajo del broker.

---

## `displayRoutes(routes, official)`

- Input: `routes` = array de rutas optimizadas con `displayMetrics`.
- Output: inyecta HTML en el contenedor adecuado (`#arbitrages` o similar).

### Fragmento de ruta
```html
<div class="route-card {profitClass} {routeType}" data-route='{routeJSON}'>
  <div class="route-header">
    <h3>🔀 Ruta N</h3>
    <div class="route-loss-indicator">⚠️ Pérdida</div> <!-- si aplica -->
    <div class="route-badges">...</div>
    <div class="profit-badge {profitBadgeClass}">+{percentage}%</div>
  </div>
  <div class="route-compact">...
  </div>
</div>
```

---

## Helpers de formateo
- `formatNumber(num)` — formatea con `toLocaleString('es-AR')` y maneja `NaN`.
- `formatUsdUsdtRatio(num)` — 3 decimales; si no hay dato devuelve `N/D`.

---

## Validación de rutas
`validateRouteCalculations(route)` devuelve `{ isValid, warnings }`.
Recomendaciones: llamar a esta función antes de mostrar rutas y mostrar `warnings` en `#data-warning` si existen.

---

## Tests propuestos (implementados)
- `tests/test_display_arbitrages.js` — crea datos de ejemplo y comprueba que el HTML contiene el broker y el profit.
- `tests/test_display_routes.js` — similar para `displayRoutes`.

---

## Cómo extender / ejemplos
1. Para añadir campos a la tarjeta (p.ej. tiempo de transferencia), modificar `displayArbitrages` y añadir la línea correspondiente en el `card-body`.
2. Para cambiar la ubicación del `negativeIndicator`, ajustar la plantilla HTML en `renderHelpers.js` (si usás helpers puros) o directamente en `popup.js`.

---

Si querés, ahora creo `src/renderHelpers.js` (helpers puros que devuelven HTML como string) y los tests que menciono. ¿Los creo ahora? 
