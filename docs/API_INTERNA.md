# 📚 Documentación de API Interna - ArbitrageAR-USDT

> **Versión:** 5.0.83  
> **Última actualización:** 16 de enero de 2026

---

## 📋 Índice

1. [Arquitectura General](#arquitectura-general)
2. [DataService](#dataservice)
3. [ValidationService](#validationservice)
4. [Sistema de Notificaciones](#sistema-de-notificaciones)
5. [StateManager](#statemanager)
6. [Utilidades](#utilidades)
7. [APIs Externas](#apis-externas)

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      POPUP (UI Layer)                       │
│  popup.js → routeRenderer.js → filterController.js          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   STATE MANAGEMENT                          │
│  stateManager.js ←→ chrome.storage.local                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKGROUND (Service Worker)               │
│  main-simple.js → apiClient.js → arbitrageCalculator.js     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  DataService.js → ValidationService.js                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL APIs                              │
│  DolarAPI │ CriptoYa USDT/ARS │ CriptoYa Banks              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 DataService

**Ubicación:** `src/DataService.js`  
**Responsabilidad:** Obtener datos de APIs externas con rate limiting y validación.

### Constructor

```javascript
const dataService = new DataService();
```

| Propiedad | Tipo | Valor Default | Descripción |
|-----------|------|---------------|-------------|
| `REQUEST_INTERVAL` | number | 600 | Milisegundos entre requests |
| `lastRequestTime` | number | 0 | Timestamp del último request |

### Métodos Públicos

#### `fetchWithRateLimit(url)`

Realiza fetch con rate limiting y timeout.

```javascript
const data = await dataService.fetchWithRateLimit('https://api.example.com/data');
// Returns: Object | null
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `url` | string | URL a fetchear |
| **Retorna** | Object\|null | JSON parseado o null si falla |

**Características:**
- ⏱️ Timeout de 10 segundos
- 🔄 Rate limiting de 600ms entre requests
- ✅ Manejo de errores (AbortError, SyntaxError)

#### `fetchDolarOficial()`

Obtiene cotización del dólar oficial de DolarAPI.

```javascript
const dolar = await dataService.fetchDolarOficial();
// Returns: { compra: number, venta: number, source: string } | null
```

**Validaciones:**
- Estructura: `compra` y `venta` deben ser números
- Rango: Entre 500 y 5000 ARS
- Spread: `venta >= compra`

#### `fetchUSDTData()`

Obtiene precios de USDT/ARS de todos los exchanges.

```javascript
const exchanges = await dataService.fetchUSDTData();
// Returns: { binance: {...}, buenbit: {...}, ... } | null
```

**Validaciones:**
- Estructura: Debe ser objeto
- Precios: Entre 100 y 10000 ARS
- Spread: Máximo 20% (warning si excede)

#### `fetchBanksData()`

Obtiene datos de transferencias bancarias.

```javascript
const banks = await dataService.fetchBanksData();
// Returns: Object | null
```

#### `validateExchangeData(data, pair)`

Valida datos de exchanges, filtrando precios fuera de rango.

```javascript
const validated = dataService.validateExchangeData(exchangeData, 'USDT/ARS');
// Returns: Object con exchanges válidos
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | Object | Datos de exchanges |
| `pair` | string | Par de trading ('USDT/ARS' o 'USDT/USD') |

---

## ✅ ValidationService

**Ubicación:** `src/ValidationService.js`  
**Responsabilidad:** Validación de datos, frescura y cálculo de riesgo.

### Métodos Estáticos

#### `isDataFresh(timestamp, maxAgeMinutes = 5)`

Verifica si los datos son recientes.

```javascript
ValidationService.isDataFresh(data.timestamp, 5);
// Returns: boolean
```

#### `getDataFreshnessLevel(timestamp)`

Obtiene nivel de frescura de datos.

```javascript
ValidationService.getDataFreshnessLevel(data.timestamp);
// Returns: 'fresh' | 'warning' | 'stale' | 'unknown'
```

| Nivel | Tiempo | Color sugerido |
|-------|--------|----------------|
| `fresh` | < 5 min | 🟢 Verde |
| `warning` | 5-15 min | 🟡 Amarillo |
| `stale` | > 15 min | 🔴 Rojo |
| `unknown` | Sin timestamp | ⚪ Gris |

#### `calculateRouteRiskLevel(route)`

Calcula nivel de riesgo de una ruta de arbitraje.

```javascript
const risk = ValidationService.calculateRouteRiskLevel(route);
// Returns: { level: 'low'|'medium'|'high', score: number, factors: string[] }
```

**Factores de riesgo:**
- Ganancia negativa: +30 puntos
- Ganancia < 1%: +10 puntos
- Operación P2P: +15 puntos
- Transferencia entre exchanges: +10 puntos
- Datos > 5 min: +20 puntos

#### `isValidNumber(value)`

Verifica si un valor es un número válido.

```javascript
ValidationService.isValidNumber(123.45);  // true
ValidationService.isValidNumber(NaN);     // false
ValidationService.isValidNumber(Infinity); // false
```

---

## 🔔 Sistema de Notificaciones

**Ubicación:** `src/background/main-simple.js` (sección SISTEMA DE NOTIFICACIONES)

### Configuración

```javascript
const settings = {
  notificationsEnabled: true,    // Habilitar/deshabilitar
  alertThreshold: 1.0,           // Umbral mínimo de ganancia (%)
  notificationFrequency: '15min', // Frecuencia: 'always'|'5min'|'15min'|'30min'|'1hour'|'once'
  soundEnabled: true,            // Sonido habilitado
  notificationExchanges: [...],  // Exchanges permitidos
  quietHoursEnabled: false,      // Horario silencioso
  quietStart: '22:00',           // Inicio horario silencioso
  quietEnd: '08:00'              // Fin horario silencioso
};
```

### `shouldSendNotification(settings, arbitrage)`

Determina si debe enviarse una notificación.

```javascript
const should = await shouldSendNotification(settings, arbitrage);
// Returns: boolean
```

**Verificaciones en orden:**
1. ✅ Notificaciones habilitadas
2. ⏰ Fuera de horario silencioso
3. 🔄 Frecuencia respetada
4. 📊 Ganancia >= umbral (`alertThreshold`)
5. 🏦 Exchange en lista permitida (`notificationExchanges`)
6. 🔕 No notificado recientemente

### `sendNotification(arbitrage, settings)`

Envía una notificación del sistema.

```javascript
await sendNotification(arbitrage, settings);
```

**Niveles de icono:**
| Ganancia | Icono | Prioridad |
|----------|-------|-----------|
| >= 15% | 🚀 | 2 (alta) + requireInteraction |
| >= 10% | 💎 | 2 (alta) |
| >= 5% | 💰 | 1 (normal) |
| < 5% | 📊 | 1 (normal) |

---

## 🗃️ StateManager

**Ubicación:** `src/utils/stateManager.js`  
**Responsabilidad:** Gestión centralizada del estado de la aplicación.

### Uso

```javascript
import { StateManager, getState, setState, subscribe } from './utils/stateManager.js';

// Obtener estado
const currentData = getState('currentData');

// Actualizar estado
setState('currentData', newData);

// Suscribirse a cambios
const unsubscribe = subscribe('currentData', (newValue, oldValue) => {
  console.log('Datos actualizados:', newValue);
});

// Cancelar suscripción
unsubscribe();
```

### Estado Global

```javascript
{
  currentData: {
    timestamp: number,
    dollarPrice: number,
    oficial: { compra, venta, source },
    usdt: { [exchange]: { bid, ask, ... } },
    banks: { ... }
  },
  userSettings: { ... },
  filteredRoutes: [],
  allRoutes: [],
  lastUpdate: Date
}
```

---

## 🛠️ Utilidades

### Formatters (`src/utils/formatters.js`)

```javascript
// Formatear moneda
formatCurrency(1234.56, 'ARS'); // "$1,234.56"
formatCurrency(1234.56, 'USD'); // "US$1,234.56"

// Formatear porcentaje
formatPercent(5.567); // "5.57%"
formatPercent(-2.1); // "-2.10%"

// Formatear número
formatNumber(1234567.89); // "1,234,567.89"
```

### Logger (`src/utils/logger.js`)

```javascript
import { Logger } from './utils/logger.js';

Logger.info('Mensaje informativo');
Logger.warn('Advertencia');
Logger.error('Error crítico', errorObject);
Logger.debug('Debug (solo en desarrollo)');
```

---

## 🌐 APIs Externas

### DolarAPI

**URL:** `https://dolarapi.com/v1/dolares/oficial`

```json
{
  "compra": 1050.00,
  "venta": 1100.00,
  "casa": "oficial",
  "fecha": "2026-01-16T10:00:00.000Z"
}
```

### CriptoYa USDT/ARS

**URL:** `https://criptoya.com/api/usdt/ars/1`

```json
{
  "binance": {
    "ask": 1250.00,
    "bid": 1245.00,
    "totalAsk": 1251.25,
    "totalBid": 1243.75,
    "time": 1705395600
  },
  "buenbit": { ... },
  "lemoncash": { ... }
}
```

### CriptoYa USDT/USD

**URL:** `https://criptoya.com/api/usdt/usd/1`

```json
{
  "binance": {
    "ask": 1.001,
    "bid": 0.999,
    "time": 1705395600
  }
}
```

### CriptoYa Bancos

**URL:** `https://criptoya.com/api/bancostodos`

Retorna datos de transferencias bancarias para calcular rutas de arbitraje.

---

## 📝 Ejemplos de Uso

### Obtener y validar datos completos

```javascript
const dataService = new DataService();

// 1. Obtener dólar oficial
const dolar = await dataService.fetchDolarOficial();
if (!dolar) {
  console.error('No se pudo obtener dólar oficial');
  return;
}

// 2. Obtener USDT/ARS
const usdt = await dataService.fetchUSDTData();
if (!usdt) {
  console.error('No se pudo obtener datos de USDT');
  return;
}

// 3. Calcular arbitrajes
const arbitrages = calculateArbitrages(dolar, usdt);

// 4. Verificar notificaciones
const settings = await chrome.storage.local.get('notificationSettings');
for (const arb of arbitrages) {
  if (await shouldSendNotification(settings, arb)) {
    await sendNotification(arb, settings);
    break; // Solo una notificación a la vez
  }
}
```

### Validar frescura de datos en UI

```javascript
const level = ValidationService.getDataFreshnessLevel(currentData.timestamp);

switch (level) {
  case 'fresh':
    indicator.className = 'status-fresh';
    indicator.textContent = '🟢 Datos actualizados';
    break;
  case 'warning':
    indicator.className = 'status-warning';
    indicator.textContent = '🟡 Datos de hace 5-15 min';
    break;
  case 'stale':
    indicator.className = 'status-stale';
    indicator.textContent = '🔴 Datos desactualizados';
    break;
}
```

---

## 🔧 Configuración del Usuario

Almacenada en `chrome.storage.local` bajo la key `notificationSettings`:

```javascript
{
  // Notificaciones
  notificationsEnabled: true,
  alertThreshold: 1.0,
  notificationFrequency: '15min',
  soundEnabled: true,
  notificationExchanges: ['binance', 'buenbit', 'lemoncash', ...],
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  
  // Simulador
  defaultSimAmount: 1000000,
  maxRoutesDisplay: 20,
  filterMinProfit: -10.0,
  sortByProfit: true,
  
  // Fees
  extraTradingFee: 0,
  extraWithdrawalFee: 0,
  extraTransferFee: 0,
  bankCommissionFee: 0,
  
  // Precio del dólar
  dollarPriceSource: 'auto',  // 'auto' | 'manual'
  manualDollarPrice: 1400,
  preferredBank: 'consenso',
  selectedBanks: ['bna', 'galicia', 'santander', 'bbva', 'icbc'],
  
  // APIs
  updateIntervalMinutes: 5,
  requestTimeoutSeconds: 10
}
```

---

*Documentación generada automáticamente - v5.0.83*
