# API Auditor Skill

## Responsabilidad
Auditar toda la integración con APIs externas y el manejo de datos.

## Archivos Bajo Auditoría
- `src/background/apiClient.js`
- `src/DataService.js`

## APIs Monitoreadas

| API | URL | Timeout | TTL Cache |
|-----|-----|---------|-----------|
| DolarAPI | `/v1/dolares/oficial` | 12s | 60s |
| CriptoYa USDT/ARS | `/api/usdt/ars/1` | 12s | 30s |
| CriptoYa Banks | `/api/bancostodos` | 12s | 120s |
| CriptoYa USDT/USD | `/api/usdt/usd/1` | 12s | 30s |

## Checklist de Auditoría

### 1. Configuración de Endpoints
- [ ] Verificar URLs correctas
- [ ] Comprobar HTTPS obligatorio
- [ ] Validar host_permissions en manifest.json

### 2. Timeout y Rate Limiting
- [ ] Verificar timeout configurado (12s)
- [ ] Comprobar rate limiting habilitado
- [ ] Validar AbortController

### 3. Manejo de Errores
- [ ] Verificar try-catch en fetch
- [ ] Comprobar retry logic
- [ ] Validar mensajes de error

### 4. Validación de Respuestas
- [ ] Verificar validación de estructura
- [ ] Comprobar validación de tipos
- [ ] Validar rangos de valores

### 5. Cache
- [ ] Verificar TTL configurado
- [ ] Comprobar invalidación de cache
- [ ] Validar limpieza de cache

## Tests de Conectividad

```bash
# Test DolarAPI
curl -s -w "\nTime: %{time_total}s\n" \
  "https://dolarapi.com/v1/dolares/oficial"

# Test CriptoYa USDT
curl -s -w "\nTime: %{time_total}s\n" \
  "https://criptoya.com/api/usdt/ars/1"
```

## Schemas Esperados

### DolarAPI
```json
{
  "compra": 1050.50,  // number, required
  "venta": 1090.50    // number, required
}
```

### CriptoYa USDT
```json
{
  "binance": {
    "ask": 1200.50,  // number
    "bid": 1195.00   // number
  }
}
```

## Output de Auditoría
```
📊 AUDITORÍA APIs
=================
✅/⚠️ DolarAPI responde
✅/⚠️ CriptoYa responde
✅/⚠️ Timeout configurado
✅/⚠️ Rate limiting habilitado
✅/⚠️ Validación correcta
✅/⚠️ Cache implementado
```