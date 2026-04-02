---
commandName: /check-apis
description: Verifica el estado de las APIs externas
---

# Comando: /check-apis

## APIs a verificar

### DolarAPI
```bash
curl -s https://dolarapi.com/v1/dolares/oficial | head -c 200
```

### CriptoYa USDT/ARS
```bash
curl -s https://criptoya.com/api/usdt/ars/1 | head -c 200
```

### CriptoYa Banks
```bash
curl -s https://criptoya.com/api/bancostodos | head -c 200
```

## Respuestas esperadas

### DolarAPI (200 OK)
```json
{
  "moneda": "USD",
  "casa": "oficial",
  "nombre": "Oficial",
  "compra": 1050.50,
  "venta": 1090.50,
  "fechaActualizacion": "2026-02-25T14:30:00.000Z"
}
```

### CriptoYa (200 OK)
```json
{
  "binance": {
    "ask": 1200.50,
    "bid": 1195.00,
    "time": 1708878600
  },
  ...
}
```

## Verificación
```bash
# Verificar todas las APIs
for api in "dolarapi" "criptoya"; do
  echo "Testing $api..."
  curl -s --max-time 5 "$api_url" > /dev/null && echo "✅ $api OK" || echo "❌ $api FAIL"
done
```