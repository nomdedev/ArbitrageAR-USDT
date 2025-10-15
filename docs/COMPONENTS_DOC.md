# Documentación de Componentes - ArbitrageAR-USDT

Este documento explica la arquitectura del popup y los componentes principales del proyecto, con ejemplos y contratos de datos. Está diseñado para ayudarte a entender la lógica en JS paso a paso.

## Índice

- Objetivo
- Estructura general
- Componentes principales
  - `popup.js`
  - `popup.html`
  - `popup.css`
  - `DataService.js`
  - `ScrapingService.js` (si existe)
  - `ArbitrageCalculator.js` (si existe)
  - `StorageManager.js`
  - `NotificationManager.js`
- Flujo de datos
- Contratos de datos (estructuras JSON)
- Ejemplos de uso y snippets
- Errores comunes y cómo debuggear

---

## Objetivo

La extensión calcula oportunidades de arbitraje entre USD/USDT y ARS usando precios de diferentes fuentes (CriptoYA, DolarAPI, bancos). Muestra rutas optimizadas en el popup y permite simular inversiones.

## Estructura general

- `src/popup.html`: Contiene la interfaz del popup (tabs, botones, paneles, modal)
- `src/popup.css`: Estilos del popup
- `src/popup.js`: Lógica del frontend: fetch de datos, render de cards, manejo de filtros, eventos
- `src/DataService.js`: Servicio que encapsula llamadas a APIs externas y normaliza respuestas
- `src/ArbitrageCalculator.js`: (si existe) Contiene la lógica de cálculo de rutas y profits
- `src/ScrapingService.js`: (si existe) Utilidades para scraping cuando la API no devuelve JSON
- `src/StorageManager.js`: (si existe) Wrapper sobre `chrome.storage` para persistencia
- `src/NotificationManager.js`: (si existe) Manejo de notificaciones y sonidos

---

## `popup.js` - Resumen y razonamiento paso a paso

Propósito: controlar el lifecycle del popup. Se encarga de:
- Inicializar la UI al `DOMContentLoaded`
- Llamar a `fetchAndDisplay()` para obtener datos combinados
- Renderizar las tarjetas de rutas (`route-card`) y de arbitraje (`arbitrage-card`)
- Gestionar filtros avanzados y acciones del usuario

### Contrato básico
- Inputs: datos combinados de `DataService` (precios USDT, dólar oficial, bancos)
- Outputs: HTML dinámico insertado en `#optimized-routes` y `#banks-list`
- Errores: Si `DataService` devuelve `null` muestra mensajes de error y un `fallback` visual

### Flujo principal (simplificado)
1. `DOMContentLoaded` -> llamadas a `setup*` para listeners
2. `fetchAndDisplay()` -> llama a `dataService.fetchUSDTData()` y `dataService.fetchDolarOficial()` y calcula rutas
3. `displayArbitrages()` y `displayRoutes()` -> generan HTML de las cards
4. Eventos de click en cards -> abren modal con detalles (`setupRouteDetailsModal()`)

#### Ejemplo: render de una arbitrage-card
- Se calcula si la ruta es negativa (`negativeIndicator`) y ahora mostramos ese indicador debajo del broker (mejora visual)
- Código de generación: (resumen)
  - `<div class="arbitrage-card ...">` contiene header con broker, loss indicator, profit badge y body con precios

---

## `popup.html` - Estructura clave

- Header con botones `#settings` y `#refresh`
- Tabs: `routes`, `simulator`, `banks`
- Panel `#advanced-filters-panel` con controles de filtro
- Modal `#route-details-modal` para detalles

---

## `popup.css` - Pautas de estilo

- Variables CSS en `:root` para paleta, spacing y sombras
- Clases reutilizables: `.input-base`, `.card`, `.profit-badge`, `.negative-tag`
- Recomendación: Para cambiar apariencia global, modificar las variables en `:root`

---

## `DataService.js` - Resumen

Responsabilidad: abstraer fetch a APIs y aplicar rate-limiting.

Funciones clave:
- `fetchWithRateLimit(url)`: fetch con timeout y manejo de errores
- `fetchDolarOficial()`: obtiene dolar oficial desde DolarAPI
- `fetchUSDTData()`: obtiene precios USDT desde CriptoYA
- `fetchDolaritoBankRates()`: scraping ligero para monedas bancarias
- `fetchCombinedBankRates()`: combinador de fuentes

### Contrato
- Entrada: URLs de APIs (internas hardcodeadas)
- Salida: objetos normalizados con fields `compra`, `venta`, `spread`, `timestamp`, `source`

### Ejemplo detallado: `fetchWithRateLimit`

Descripción: realiza un fetch con un intervalo mínimo entre requests para no saturar APIs externas. También aplica timeout y manejo de errores comunes.

Pseudo-código simplificado:

```js
async function fetchWithRateLimit(url) {
  // Esperar si la última petición fue reciente
  await waitIfNeeded();
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    // Si timeout o respuesta no-JSON, log y retornar null
    return null;
  }
}
```

Uso en el código:

```js
const ds = new DataService();
const usdtData = await ds.fetchUSDTData();
if (!usdtData) {
  // Mostrar fallback en UI
}
```

---

## `utils.js` - Helpers reutilizables

Se creó `src/utils.js` para funciones puras que se pueden testear fuera del navegador.

Función importante: `getProfitClasses(profitPercent)`

Descripción: Dada una cifra de porcentaje de profit, devuelve un objeto con banderas booleans y clases CSS para aplicar estilos.

Contrato:
- Input: profitPercent (Number)
- Output: { isNegative: Boolean, profitClass: String, profitBadgeClass: String }

Ejemplo:

```js
getProfitClasses(3.5) // => { isNegative:false, profitClass: '', profitBadgeClass: '' }
getProfitClasses(6.2) // => { isNegative:false, profitClass:'high-profit', profitBadgeClass:'high' }
getProfitClasses(-2.1) // => { isNegative:true, profitClass:'negative-profit', profitBadgeClass:'negative' }
```

---

## Mini-tutorial: Añadir un nuevo proveedor de precios (paso a paso)

1. En `src/DataService.js` añade un método `fetchFromNewProvider()` que use `fetchWithRateLimit`.
2. Normaliza la respuesta para que tenga la estructura `{ compra, venta, timestamp, source }`.
3. En `popup.js` modifica `fetchAndDisplay()` para llamar a `dataService.fetchFromNewProvider()` y combinar resultados.
4. Añade pruebas simples en `tests/` que importen `DataService` dinámicamente y verifiquen la normalización.

Snippet de ejemplo (DataService):

```js
async fetchFromNewProvider() {
  const data = await this.fetchWithRateLimit('https://nuevo/api/usdt');
  if (!data) return null;
  return {
    compra: parseFloat(data.ask),
    venta: parseFloat(data.bid),
    timestamp: new Date().toISOString(),
    source: 'nuevo'
  };
}
```

---

Si querés, puedo:
- Añadir más ejemplos por función (p.ej. `fetchDolaritoBankRates`) y explicar la lógica de parsing del HTML.
- Crear tests unitarios más formales (Jest o Mocha) para `DataService` y `utils`.
- Añadir una sección de debugging con comandos concretos para reproducir errores en Windows/PowerShell.


---

## Estructuras de datos importantes

Ejemplo de `arbitrage`:

```json
{
  "broker": "ExampleExchange",
  "profitPercentage": 3.45,
  "usdToUsdtRate": 1.001,
  "usdtArsBid": 1120.5,
  "officialPrice": 950,
  "fees": { "total": 1.2 },
  "calculation": {
    "initialAmount": 100000,
    "finalAmount": 103450
  }
}
```

Ejemplo de `route` (data-route en HTML):

```json
{
  "steps": [
    { "from": "USD", "to": "USDT", "exchange": "ExchangeA" },
    { "from": "USDT", "to": "ARS", "exchange": "ExchangeB" }
  ],
  "profitPercentage": 2.34,
  "displayMetrics": { "percentage": 2.34, "mainValue": "$1000" }
}
```

---

## Ejemplos prácticos y snippets

1) Cambiar la lógica para ocultar rutas negativas por defecto (en `loadUserSettings`):
```js
userSettings.showNegativeRoutes = false;
```

2) Añadir un nuevo proveedor en `DataService.fetchUSDTData` (ejemplo):
```js
async fetchFromNewProvider() {
  const data = await this.fetchWithRateLimit('https://nuevo-provider/api/usdt');
  // Normalizar estructura y retornar
}
```

---

## Errores comunes y debugging

- `Null` retornado por fetch -> revisar permisos CORS o endpoints
- Respuestas HTML cuando se esperaba JSON -> usar `fetchHTML` y parsear contenido
- Valores NaN en formateos -> añadir guards (`isNaN`) antes de mostrar

---

## Próximos pasos sugeridos

- Añadir tests unitarios para `ArbitrageCalculator.js` (si existe)
- Documentar la API interna con ejemplos JSON más completos
- Añadir un script de desarrollo para correr la extensión de forma local en Chrome

---

Si querés, ahora puedo:
- Expandir cada sección con más detalle y ejemplos concretos por función
- Generar un archivo `docs/COMPONENTS_DOC.md` más extenso y con índice completo y anclas
- Crear ejemplos ejecutables (mini-tests) para las funciones de `DataService` y `ArbitrageCalculator`.

Decime cuál prefieres y lo hago a continuación.