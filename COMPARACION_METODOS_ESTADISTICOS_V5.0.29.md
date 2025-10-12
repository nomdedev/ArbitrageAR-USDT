# 📊 COMPARACIÓN DE MÉTODOS ESTADÍSTICOS - v5.0.29

## 🎯 Problema Resuelto

**Antes (v5.0.28)**: Promedio simple distorsionado por outliers
**Ahora (v5.0.29)**: Métodos robustos que reflejan el mercado real

---

## 📈 Ejemplo Real Comparativo

### Datos de Entrada (10 Bancos):

```
Banco 1:  $1,020  ←┐
Banco 2:  $1,018   │
Banco 3:  $1,022   │
Banco 4:  $1,019   │  Grupo principal
Banco 5:  $1,021   │  (9 bancos similares)
Banco 6:  $1,020   │
Banco 7:  $1,023   │
Banco 8:  $1,019   │
Banco 9:  $1,020  ←┘

Banco 10: $800    ← OUTLIER (banco con error o promoción)
```

---

## 💰 Resultados por Método

### 1️⃣ MEDIANA ⭐ (Recomendado)

**Proceso**:
```
1. Ordenar: [800, 1018, 1019, 1019, 1020, 1020, 1020, 1021, 1022, 1023]
2. Encontrar centro: posición 5 y 6
3. Calcular: (1020 + 1020) / 2 = $1,020
```

**Resultado**: `$1,020` ✅

**Ventajas**:
- ✅ Ignoró completamente el outlier ($800)
- ✅ Representa el precio real del mercado
- ✅ Robusto al 100%

**Display en Popup**: `📊 Mediana (10 bancos)`

---

### 2️⃣ PROMEDIO RECORTADO

**Proceso**:
```
1. Ordenar: [800, 1018, 1019, 1019, 1020, 1020, 1020, 1021, 1022, 1023]
2. Eliminar 10% inferior (1 banco): ❌ 800
3. Eliminar 10% superior (1 banco): ❌ 1023
4. Bancos restantes: [1018, 1019, 1019, 1020, 1020, 1020, 1021, 1022]
5. Promedio: (1018+1019+1019+1020+1020+1020+1021+1022) / 8 = $1,020.25
```

**Resultado**: `$1,020.25` ✅

**Ventajas**:
- ✅ Eliminó automáticamente el outlier
- ✅ Usa más datos que la mediana (8 vs 2)
- ✅ Más suave, menos extremo

**Display en Popup**: `📊 Prom. Recortado (8/10 bancos)`

---

### 3️⃣ MENOR VALOR

**Proceso**:
```
1. Encontrar mínimo: min(800, 1018, ..., 1023) = $800
```

**Resultado**: `$800` ⚠️

**Problema**:
- ❌ El outlier ES el menor valor
- ❌ Precio irrealista (-$220 del mercado)
- ❌ Puede llevar a pérdidas si calculas con este precio

**Cuándo usar**: Solo si tienes acceso garantizado al banco más barato

**Display en Popup**: `💰 Banco 10 (menor precio)`

---

### 4️⃣ PROMEDIO SIMPLE (No Recomendado)

**Proceso**:
```
1. Sumar todos: 800 + 1018 + 1019 + ... + 1023 = 9,982
2. Dividir por cantidad: 9,982 / 10 = $998.2
```

**Resultado**: `$998` ❌

**Problema**:
- ❌ Distorsionado por el outlier
- ❌ $22 menos que el precio real ($1,020)
- ❌ Error del 2.2%

**Display en Popup**: `📊 Promedio (10 bancos)`

---

## 📊 Tabla Comparativa

| Método | Resultado | Diferencia vs Real | Afectado por Outlier | Recomendado |
|--------|-----------|-------------------|---------------------|-------------|
| **Mediana** ⭐ | **$1,020** | **$0** | ❌ No | ✅ **SÍ** |
| **Prom. Recortado** | **$1,020.25** | **+$0.25** | ❌ No | ✅ **SÍ** |
| **Menor Valor** | $800 | -$220 | ✅ Sí | ⚠️ Depende |
| **Promedio Simple** | $998 | -$22 | ✅ Sí | ❌ **NO** |

**Precio Real del Mercado**: `$1,020` (9 de 10 bancos)

---

## 💡 Impacto en Cálculo de Rentabilidad

### Simulación: Invertir $100,000 ARS

#### Con Precio CORRECTO ($1,020):
```
1. Compra USD: $100,000 / $1,020 = 98.04 USD
2. Compra USDT: 98.04 / 1.001 = 97.94 USDT
3. Venta USDT: 97.94 × $1,050 = $102,837 ARS
4. Ganancia: $2,837 ARS (2.84%)
```

#### Con Precio PROMEDIO SIMPLE ($998):
```
1. Compra USD: $100,000 / $998 = 100.20 USD
2. Compra USDT: 100.20 / 1.001 = 100.10 USDT
3. Venta USDT: 100.10 × $1,050 = $105,105 ARS
4. Ganancia CALCULADA: $5,105 ARS (5.10%) ❌ IRREAL

REALIDAD AL OPERAR:
- Compras USD a $1,020 (precio real)
- Solo obtienes 98.04 USD
- Ganancia REAL: $2,837 ARS (2.84%)
- DIFERENCIA: -$2,268 ARS (-2.26%) ❌ PÉRDIDA POR CÁLCULO ERRÓNEO
```

#### Con Precio MEDIANA ($1,020):
```
1-4. Mismo cálculo que "Precio Correcto"
Ganancia CALCULADA: $2,837 ARS (2.84%) ✅
Ganancia REAL: $2,837 ARS (2.84%) ✅
DIFERENCIA: $0 ✅ CÁLCULO CORRECTO
```

---

## 🎯 Casos de Uso

### ✅ Usar MEDIANA cuando:
- Tienes múltiples bancos disponibles
- No sabes si hay outliers en los datos
- Quieres la máxima robustez
- **Uso general recomendado** ⭐

### ✅ Usar PROMEDIO RECORTADO cuando:
- Quieres un valor "suavizado"
- Te interesa usar más datos que solo el centro
- Buscas balance entre robustez y eficiencia

### ⚠️ Usar MENOR VALOR cuando:
- Tienes acceso GARANTIZADO al banco más barato
- Estás seguro que el mínimo NO es un outlier
- Quieres cálculos conservadores (pesimista en ganancia)

### ⚠️ Usar BANCO ESPECÍFICO cuando:
- Siempre operas con el mismo banco
- Conoces el precio exacto al que comprarás
- Quieres máxima precisión para TU caso particular

### ❌ EVITAR PROMEDIO SIMPLE:
- Cuando hay posibilidad de outliers
- No sabes la distribución de los precios
- Necesitas resultados confiables

---

## 📐 Matemática Detrás de los Métodos

### Mediana:
```
Definición: Valor que divide los datos en dos mitades iguales
Fórmula (n impar):  M = x[(n+1)/2]
Fórmula (n par):    M = (x[n/2] + x[n/2+1]) / 2
Robustez:          Punto de quiebre = 50%
```

### Promedio Recortado:
```
Definición: Media después de eliminar α% de cada extremo
Fórmula:    TM = (Σxi) / n'   donde i ∈ [α·n, (1-α)·n]
Parámetro:  α = 10% (elimina 10% superior e inferior)
Robustez:   Punto de quiebre = 10%
```

### Promedio Simple:
```
Definición: Suma de todos los valores dividido por la cantidad
Fórmula:    μ = (Σxi) / n
Robustez:   Punto de quiebre = 0% (no robusto)
```

**Punto de Quiebre**: % de datos anómalos que el método puede tolerar sin distorsionarse.

---

## 🚀 Mejora de Precisión

### Escenario 1: SIN Outliers
Todos los bancos entre $1,018 - $1,023

| Método | Resultado | Precisión |
|--------|-----------|-----------|
| Mediana | $1,020 | ✅ 100% |
| Prom. Recortado | $1,020.25 | ✅ 99.98% |
| Promedio Simple | $1,020.50 | ✅ 99.95% |

**Conclusión**: Todos funcionan bien, diferencia mínima.

---

### Escenario 2: CON 1 Outlier (10%)
9 bancos entre $1,018 - $1,023, 1 banco a $800

| Método | Resultado | Precisión |
|--------|-----------|-----------|
| Mediana | $1,020 | ✅ 100% |
| Prom. Recortado | $1,020.25 | ✅ 99.98% |
| Promedio Simple | $998 | ❌ 97.84% |

**Conclusión**: Mediana y Prom. Recortado robustos, Promedio Simple distorsionado.

---

### Escenario 3: CON 2 Outliers (20%)
8 bancos entre $1,018 - $1,023, 1 a $800, 1 a $1,200

| Método | Resultado | Precisión |
|--------|-----------|-----------|
| Mediana | $1,020 | ✅ 100% |
| Prom. Recortado | $1,020.25 | ✅ 99.98% |
| Promedio Simple | $1,018 | ❌ 99.80% |

**Conclusión**: Solo métodos robustos mantienen precisión.

---

## 🎓 Recomendaciones Finales

### Para Usuarios Nuevos:
```
✅ Usar: MEDIANA (opción por defecto)
Por qué: Máxima robustez sin complejidad
```

### Para Usuarios Avanzados:
```
✅ Comparar: MEDIANA vs PROMEDIO RECORTADO
✅ Elegir según: Preferencia personal (diferencia < 0.5%)
⚠️ Evitar: PROMEDIO SIMPLE (solo si estás 100% seguro sin outliers)
```

### Para Operadores Específicos:
```
✅ Usar: Tu banco específico
✅ O usar: MEDIANA como verificación
✅ Comparar: ¿Tu banco está cerca de la mediana?
```

---

## 📱 Cómo Cambiar de Método

1. **Abrir Configuración**:
   - Click en ⚙️ en el popup

2. **Encontrar Sección**:
   - "Método de precio USD oficial"

3. **Seleccionar**:
   - **Recomendado**: "Mediana de bancos (robusto ante outliers) ⭐"
   - **Alternativo**: "Promedio recortado (elimina 10% extremos)"
   - **Específico**: Seleccionar tu banco

4. **Guardar**:
   - Click en "Guardar Configuración"

5. **Verificar**:
   - Volver al popup
   - Ver fuente de precio actualizada

---

## 📊 Visualización del Problema

### Distribución de Precios:

```
$800   |  ●                              ← OUTLIER
       |
       |
       |
       |
$900   |
       |
       |
       |
       |
$1000  |
       |     ← Promedio Simple ($998)
       |
       |
$1020  |              ● ● ● ● ● ● ● ● ●  ← MEDIANA ($1,020)
       |                                   ← Grupo principal
$1040  |
```

**Interpretación**:
- ✅ Mediana captura el grupo principal
- ❌ Promedio Simple "jalado" hacia el outlier

---

**Conclusión**: La **MEDIANA** es el método más confiable para representar el precio real del mercado, protegiendo al usuario de cálculos distorsionados por valores atípicos.

---

**Versión**: v5.0.29
**Fecha**: 11 de octubre de 2025
**Estado**: ✅ Implementado y Validado
