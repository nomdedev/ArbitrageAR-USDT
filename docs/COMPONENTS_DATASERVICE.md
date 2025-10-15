# Documentación: DataService

Este documento detalla `src/DataService.js`, sus métodos públicos, contratos de datos, ejemplos de respuestas y recomendaciones para añadir nuevos proveedores.

## Resumen
`DataService` encapsula todas las llamadas a APIs externas (CriptoYA, DolarAPI, Dolarito) y provee métodos normalizados:

- `fetchWithRateLimit(url)` - fetch con rate-limiting y timeout
- `fetchHTML(url)` - fetch de HTML (para scraping)
- `fetchDolarOficial()` - devuelve objeto con `compra`, `venta`, `fechaActualizacion`
- `fetchUSDTData()` - precios USDT por exchange
- `fetchDolaritoBankRates()` - scraping de dolarito.ar para precios por banco
- `fetchCriptoYaBankRates()` - obtiene bancos desde CriptoYa
- `fetchCombinedBankRates()` - combina las fuentes anteriores

---

## Métodos y ejemplos

### `fetchWithRateLimit(url)`
- Propósito: evitar saturar proveedores aplicando mínimo intervalo entre requests.
- Timeout: 10s
- Retorno: JSON o `null` en caso de error

Ejemplo:
```js
const ds = new DataService();
const raw = await ds.fetchWithRateLimit('https://criptoya.com/api/usdt/ars/1');
if (!raw) {
  // manejar falla
}
```

---

### `fetchDolarOficial()`
- Retorno esperado:
```json
{
  "moneda": "USD",
  "casa": "oficial",
  "nombre": "Oficial",
  "compra": 1365,
  "venta": 1415,
  "fechaActualizacion": "2025-10-15T10:26:00.000Z"
}
```

---

### `fetchUSDTData()`
- Retorna objeto con claves de exchanges y valores con `ask`, `bid`, etc.
- Ejemplo de normalización usada en popup:
```js
const data = await ds.fetchUSDTData();
// usar data.buenbit.ask, data.ripio.bid, etc.
```

---

### `fetchDolaritoBankRates()`
- Hace `fetchHTML` y extrae JSON embebido en el HTML de la web.
- Recomendación: documentar el selector/regex usado para extraer JSON.

Ejemplo de normalización de salida:
```js
{
  "nacion": { "name": "Banco Nación", "compra": 1410, "venta": 1390, "spread": 20, "source": "dolarito" }
}
```

---

## Cómo añadir un nuevo proveedor (checklist)
1. Añadir método en `DataService` que haga `fetchWithRateLimit`.
2. Normalizar respuesta a `{compra, venta, timestamp, source}`.
3. Añadir tests en `tests/` que mockeen la respuesta.
4. Actualizar `docs/COMPONENTS_DOC.md` y `docs/TEMPLATES.md`.

---

Si querés, ya creo un ejemplo de proveedor mock y un test que valide la normalización.
