# HOTFIX v5.0.63: Validación y Advertencias para Fallback USDT/USD

**Fecha**: 2025-10-12
**Tipo**: Mejora de Seguridad y UX
**Prioridad**: Alta
**Estado**: ✅ Implementado

---

## 🎯 MEJORA IMPLEMENTADA

### Feedback del Usuario
> "Como fallback entonces si no lo tenes al valor no lo deberias usar. Porque sino va a ser un error si en algún momento esa cifra sube. O si lo usamos a 1.05, deberias aclarar que tenemos que revisar este valor sea cierto"

**Excelente punto** ✅ - El usuario tiene razón en dos aspectos:

1. **No usar exchanges sin datos confiables**
2. **Advertir al usuario cuando se usa fallback calculado**

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Validación de Rango Razonable

**Archivo**: `src/background/main-simple.js` (línea ~189)

```javascript
// Validar que el cálculo sea razonable (USDT/USD típicamente entre 0.95 y 1.15)
if (calculatedRate >= 0.95 && calculatedRate <= 1.15) {
  usdToUsdtRate = calculatedRate;
  usingFallback = true;
  log(`⚠️ [${exchange}] No hay cotización USDT/USD directa en API`);
  log(`🧮 [${exchange}] PASO 2: Calculando USDT/USD = ${usdtArsPrice} ARS / ${officialPrice} ARS = ${usdToUsdtRate.toFixed(4)}`);
  log(`📊 [${exchange}] Tasa calculada: ${usdToUsdtRate.toFixed(4)} (rango válido: 0.95-1.15)`);
} else {
  // El cálculo dio un valor fuera de rango razonable
  log(`❌ [${exchange}] SALTANDO: Tasa calculada ${calculatedRate.toFixed(4)} fuera de rango válido (0.95-1.15)`);
  log(`   USDT/ARS: ${usdtArsPrice}, USD/ARS: ${officialPrice}`);
  skippedCount++;
  continue; // Saltar este exchange
}
```

**Comportamiento:**
- ✅ Si la tasa calculada está entre **0.95 y 1.15**: se usa
- ❌ Si está fuera de ese rango: se **salta el exchange**
- 📊 Se loggea la razón del skip

**Justificación del rango 0.95-1.15:**
- Históricamente, USDT/USD oscila entre 0.99 y 1.05
- Rango ampliado a 0.95-1.15 por seguridad (20% de margen)
- Valores fuera de este rango indican datos corruptos o errores

### 2. Saltar Exchange Sin Datos Suficientes

```javascript
} else {
  // Caso 3: No tenemos datos suficientes para calcular
  log(`❌ [${exchange}] SALTANDO: Sin datos para calcular USDT/USD`);
  log(`   API USDT/USD: No disponible`);
  log(`   Fallback calculado: Datos insuficientes (USDT/ARS o USD/ARS faltante)`);
  skippedCount++;
  continue; // Saltar este exchange
}
```

**Comportamiento:**
- ❌ No hay cotización USDT/USD en API
- ❌ No se puede calcular (falta USDT/ARS o USD/ARS)
- 🚫 **Exchange se SALTA completamente**

### 3. Metadata en Resultados

**Archivo**: `src/background/main-simple.js` (línea ~338)

```javascript
config: {
  applyFees,
  tradingFeePercent: userSettings.extraTradingFee || 0,
  brokerSpecificFees: !!brokerFeeConfig,
  usdtUsdSource: usdtUsd?.[exchange]?.totalAsk ? 'api' : 'calculated',
  usdtUsdWarning: usingFallback ? 'Tasa USDT/USD calculada indirectamente. Verificar en CriptoYa.' : null
}
```

**Datos expuestos:**
- `usdtUsdSource`: `'api'` o `'calculated'`
- `usdtUsdWarning`: Mensaje de advertencia si se usó fallback

### 4. Advertencia Visual en UI

**Archivo**: `src/popup.js` (línea ~1107)

```javascript
${config?.usdtUsdWarning ? `
<div class="step-simple-warning" style="background: #fff3cd; border-left: 3px solid #ffc107; padding: 8px; margin-top: 8px; font-size: 0.85em;">
  ℹ️ ${config.usdtUsdWarning}
</div>
` : ''}
```

**Resultado visual:**
```
┌─────────────────────────────────────────────────┐
│ 🔄 Convertir USD a USDT                        │
│ Tasa: 1,050 USD = 1 USDT → 952.38 USDT        │
│                                                 │
│ ⚠️ ┃ ℹ️ Tasa USDT/USD calculada indirectamente.│
│    ┃ Verificar en CriptoYa.                    │
└─────────────────────────────────────────────────┘
```

---

## 📊 FLUJO DE DECISIÓN

```
┌─────────────────────────────────────┐
│ ¿Existe USDT/USD en API CriptoYa?  │
└───────────┬─────────────────────────┘
            │
     ┌──────┴──────┐
     │             │
    SÍ            NO
     │             │
     ▼             ▼
┌─────────┐  ┌──────────────────────┐
│ Usar    │  │ ¿Tengo USDT/ARS y    │
│ valor   │  │ USD/ARS?             │
│ de API  │  └───────┬──────────────┘
│ ✅      │          │
└─────────┘   ┌──────┴──────┐
              │             │
             SÍ            NO
              │             │
              ▼             ▼
     ┌─────────────────┐  ┌──────────┐
     │ Calcular:       │  │ SALTAR   │
     │ USDT/USD =      │  │ exchange │
     │ USDT_ARS/USD_ARS│  │ ❌       │
     └────────┬────────┘  └──────────┘
              │
              ▼
     ┌─────────────────┐
     │ ¿Valor entre    │
     │ 0.95 y 1.15?    │
     └────────┬────────┘
              │
       ┌──────┴──────┐
       │             │
      SÍ            NO
       │             │
       ▼             ▼
  ┌─────────┐  ┌──────────┐
  │ Usar    │  │ SALTAR   │
  │ valor   │  │ exchange │
  │ + ⚠️    │  │ ❌       │
  └─────────┘  └──────────┘
```

---

## 🧪 CASOS DE PRUEBA

### Caso 1: Exchange con API directa (Buenbit)
```
Input:
  - usdtUsd['buenbit'].totalAsk = 1.034

Output:
  ✅ usdToUsdtRate = 1.034
  ✅ usdtUsdSource = 'api'
  ✅ usdtUsdWarning = null
  ✅ No hay advertencia en UI
```

### Caso 2: Exchange sin API, cálculo válido (RipioExchange)
```
Input:
  - usdtUsd['ripioexchange'] = undefined
  - usdt['ripioexchange'].totalAsk = 1050 ARS
  - oficial.compra = 1000 ARS

Cálculo:
  - calculatedRate = 1050 / 1000 = 1.05
  - Rango válido: 0.95 <= 1.05 <= 1.15 ✅

Output:
  ✅ usdToUsdtRate = 1.05
  ✅ usdtUsdSource = 'calculated'
  ⚠️ usdtUsdWarning = 'Tasa USDT/USD calculada indirectamente...'
  ⚠️ Advertencia amarilla en UI
```

### Caso 3: Exchange sin API, cálculo inválido
```
Input:
  - usdtUsd['fakeexchange'] = undefined
  - usdt['fakeexchange'].totalAsk = 500 ARS (dato corrupto)
  - oficial.compra = 1000 ARS

Cálculo:
  - calculatedRate = 500 / 1000 = 0.5
  - Rango válido: 0.95 <= 0.5 <= 1.15 ❌

Output:
  ❌ Exchange SALTADO
  📊 Log: "SALTANDO: Tasa calculada 0.5000 fuera de rango válido"
  🚫 No aparece en resultados
```

### Caso 4: Exchange sin datos suficientes
```
Input:
  - usdtUsd['unknownexchange'] = undefined
  - usdt['unknownexchange'] = null (sin datos de USDT/ARS)

Output:
  ❌ Exchange SALTADO
  📊 Log: "SALTANDO: Sin datos para calcular USDT/USD"
  🚫 No aparece en resultados
```

---

## 📝 ARCHIVOS MODIFICADOS

```
src/background/main-simple.js    (3 cambios)
  - Línea ~179-207: Validación de rango + skip si inválido
  - Línea ~208-214: Skip si no hay datos suficientes
  - Línea ~338-343: Metadata usdtUsdSource y usdtUsdWarning

src/popup.js                     (1 cambio)
  - Línea ~1107-1112: Advertencia visual amarilla

manifest.json                    (1 cambio)
  - version: "5.0.62" → "5.0.63"
```

---

## 🎯 BENEFICIOS

### 1. Seguridad
- ✅ No se usan exchanges con datos corruptos o inválidos
- ✅ Validación de rango previene cálculos absurdos
- ✅ Solo se muestran rutas con datos confiables

### 2. Transparencia
- ✅ Usuario sabe cuándo la tasa es calculada vs API
- ✅ Advertencia clara invita a verificar en CriptoYa
- ✅ Logs detallados para debugging

### 3. Robustez
- ✅ Manejo de 4 casos diferentes (API, calculado válido, inválido, sin datos)
- ✅ Continue en lugar de break = procesa otros exchanges aunque uno falle
- ✅ Contadores de skipped para estadísticas

### 4. UX Mejorado
- ✅ Advertencia no invasiva (amarilla, informativa)
- ✅ Solo aparece cuando se usa fallback
- ✅ Usuario puede decidir si confiar o no en la ruta

---

## 🔮 COMPORTAMIENTO ESPERADO

### Logs Típicos

**Exchange con API directa:**
```
💱 [buenbit] PASO 2: Cotización USDT/USD = 1.034 (desde API CriptoYa)
```

**Exchange con fallback válido:**
```
⚠️ [ripioexchange] No hay cotización USDT/USD directa en API
🧮 [ripioexchange] PASO 2: Calculando USDT/USD = 1050 ARS / 1000 ARS = 1.0500
📊 [ripioexchange] Tasa calculada: 1.0500 (rango válido: 0.95-1.15)
```

**Exchange saltado por rango inválido:**
```
❌ [fakeexchange] SALTANDO: Tasa calculada 0.5000 fuera de rango válido (0.95-1.15)
   USDT/ARS: 500, USD/ARS: 1000
```

**Exchange saltado por falta de datos:**
```
❌ [unknownexchange] SALTANDO: Sin datos para calcular USDT/USD
   API USDT/USD: No disponible
   Fallback calculado: Datos insuficientes (USDT/ARS o USD/ARS faltante)
```

---

## ✅ CONCLUSIÓN

Esta mejora implementa **todas las sugerencias del usuario**:

1. ✅ **"Si no lo tenes al valor no lo deberias usar"**
   - Implementado: Exchange se salta si no hay datos confiables

2. ✅ **"Va a ser un error si en algún momento esa cifra sube"**
   - Implementado: Validación de rango (0.95-1.15) previene valores absurdos

3. ✅ **"Deberias aclarar que tenemos que revisar este valor sea cierto"**
   - Implementado: Advertencia amarilla en UI + metadata en config

**Resultado**: Sistema más robusto, seguro y transparente 🎉

---

## 📚 REFERENCIAS

- Hotfix previo: v5.0.62 (Fallback Inteligente USDT/USD)
- Feedback del usuario: "Como fallback entonces si no lo tenes al valor no lo deberias usar..."
- Rango histórico USDT/USD: 0.99-1.05 (típico), 0.95-1.15 (con margen de seguridad)
