# 🧪 GUÍA DE TESTING MANUAL - v5.0.28

## 🎯 Objetivo
Validar manualmente todas las funcionalidades de seguridad y validación implementadas en v5.0.28.

---

## ⚙️ Preparación

### 1. Recargar Extensión
1. Abre Brave
2. Ve a `brave://extensions/`
3. Busca **arbitrarARS**
4. Click en el botón de **recargar** (🔄)
5. Verifica que aparece **v5.0.28** en la extensión

### 2. Abrir Popup
1. Click en el icono de la extensión
2. Debería aparecer el popup con el nuevo diseño

---

## 🧪 Tests de Funcionalidad

### TEST 1: Indicador de Estado de Datos en Header ✅

**Objetivo**: Verificar que el indicador muestra correctamente la frescura de los datos.

#### Pasos:
1. Abre el popup
2. Busca en el header (debajo del subtítulo "Dólar Oficial → USDT") el indicador de estado
3. Debería mostrar algo como: `🟢 Datos: hace X min`

#### Verificaciones:
- [ ] ✅ El indicador existe y es visible
- [ ] ✅ Muestra un emoji de semáforo (🟢/🟡/🔴)
- [ ] ✅ Muestra el tiempo transcurrido (ej: "hace 3 min")
- [ ] ✅ El color cambia según antigüedad:
  - **< 5 min**: 🟢 Verde
  - **5-15 min**: 🟡 Amarillo
  - **> 15 min**: 🔴 Rojo

#### ¿Cómo probar diferentes estados?
- **Para ver 🟡 o 🔴**: Espera 5-15 minutos sin refrescar
- **Para volver a 🟢**: Click en el botón "Actualizar" (🔄)

---

### TEST 2: Timestamp con Antigüedad en Footer ✅

**Objetivo**: Verificar que el timestamp del footer muestra la antigüedad.

#### Pasos:
1. Scroll hasta el footer del popup
2. Busca el texto "Última actualización"

#### Verificaciones:
- [ ] ✅ Muestra emoji de semáforo (🟢/🟡/🔴)
- [ ] ✅ Muestra la hora (ej: "14:35:12")
- [ ] ✅ Muestra antigüedad (ej: "(hace 3 min)")
- [ ] ✅ El color del emoji corresponde a la antigüedad

---

### TEST 3: Configuración de Seguridad ✅

**Objetivo**: Verificar que las nuevas configuraciones están disponibles.

#### Pasos:
1. En el popup, click en el botón de configuración (⚙️)
2. Se abrirá la página de opciones
3. Scroll hasta encontrar las nuevas configuraciones de seguridad

#### Verificaciones:
- [ ] ✅ Existe checkbox: **"Advertir sobre datos antiguos"**
- [ ] ✅ Existe checkbox: **"Mostrar alertas de riesgo"**
- [ ] ✅ Existe checkbox: **"Confirmar operaciones de monto alto"**
- [ ] ✅ Existe input: **"Ganancia mínima recomendada (%)"**
- [ ] ✅ Todos están activados por defecto (checked)

#### Prueba adicional:
1. Desmarca **"Confirmar operaciones de monto alto"**
2. Click en **Guardar Configuración**
3. Cierra y vuelve a abrir las opciones
4. Verifica que se guardó el cambio

---

### TEST 4: Simulación con Monto Bajo (Sin Confirmación) ✅

**Objetivo**: Verificar que montos bajos NO requieren confirmación.

#### Pasos:
1. Abre el popup
2. Ve a la pestaña **"Simulador"**
3. Ingresa un monto: **50,000** ARS
4. Selecciona una ruta del dropdown
5. Click en **"Calcular Simulación"**

#### Verificaciones:
- [ ] ✅ La simulación se ejecuta SIN mostrar diálogo de confirmación
- [ ] ✅ Aparecen los resultados inmediatamente
- [ ] ✅ Se muestra el indicador de nivel de riesgo
- [ ] ✅ No hay alertas de validación (si los datos son buenos)

---

### TEST 5: Simulación con Monto Alto (Con Confirmación) ✅

**Objetivo**: Verificar que montos > $500,000 ARS requieren confirmación.

#### Pasos:
1. En el simulador, ingresa un monto: **750,000** ARS
2. Selecciona una ruta
3. Click en **"Calcular Simulación"**

#### Verificaciones:
- [ ] ✅ Aparece un diálogo de confirmación (`confirm()`)
- [ ] ✅ El mensaje indica:
  - Monto: $750,000 ARS
  - Ganancia estimada
  - Ruta seleccionada
  - Advertencia: "Este es un monto considerable"
- [ ] ✅ Pregunta: "¿Deseas continuar con la simulación?"

#### Prueba A: Cancelar
1. Click en **"Cancelar"**
2. Verificar que NO se muestran resultados

#### Prueba B: Aceptar
1. Ingresa nuevamente 750,000 ARS
2. Click en "Calcular Simulación"
3. Click en **"Aceptar"**
4. Verificar que SÍ se muestran resultados

---

### TEST 6: Indicador de Riesgo en Resultados ✅

**Objetivo**: Verificar que se muestra el nivel de riesgo calculado.

#### Pasos:
1. Realiza una simulación (cualquier monto)
2. Observa los resultados

#### Verificaciones:
- [ ] ✅ Aparece un bloque con título: **"NIVEL DE RIESGO"**
- [ ] ✅ Muestra un emoji (🟢/🟡/🔴)
- [ ] ✅ Muestra el nivel: **BAJO** / **MEDIO** / **ALTO**
- [ ] ✅ Lista razones específicas (ej: "Fees combinados altos", "Rentabilidad marginal")

#### Cómo probar diferentes niveles:
- **BAJO**: Usa monto bajo ($50k), ruta sin P2P, buena ganancia
- **MEDIO**: Configura fees altos (3-5%) en parámetros avanzados
- **ALTO**: Ingresa parámetros que generen pérdida (precio USD venta < precio USD compra)

---

### TEST 7: Alertas de Validación ✅

**Objetivo**: Verificar que las alertas de validación aparecen cuando corresponde.

#### Pasos:
1. En el simulador, configura parámetros para generar una advertencia:
   - Monto: **$600,000** ARS (alto)
   - O configura fees muy altos (>5%)

2. Realiza la simulación

#### Verificaciones:
- [ ] ✅ Aparece un bloque de **"ADVERTENCIAS"** antes de los resultados
- [ ] ✅ Tiene icono ⚠️
- [ ] ✅ Lista advertencias específicas:
  - "Monto elevado ($600,000 ARS) - Verificar disponibilidad de liquidez"
  - "Fees totales muy altos (> 10%)" (si aplica)

---

### TEST 8: Validación de Cálculos ✅

**Objetivo**: Verificar que se detectan errores de cálculo.

#### Pasos:
1. En el simulador, ingresa:
   - Monto: **$100,000** ARS
   - USD Compra: **$1,000** ARS
   - USD Venta: **$900** ARS (menor que compra - esto es incorrecto)

2. Realiza la simulación

#### Verificaciones:
- [ ] ✅ Aparece alerta de validación
- [ ] ✅ Indica: **"ERRORES DE VALIDACIÓN"** o similar
- [ ] ✅ Lista el error detectado

---

### TEST 9: Proceso Completo de Simulación ✅

**Objetivo**: Verificar que la simulación completa (6 pasos) funciona correctamente.

#### Pasos:
1. Realiza una simulación normal
2. Scroll hacia abajo hasta la sección **"Proceso Completo Paso a Paso"**

#### Verificaciones:
- [ ] ✅ Se muestran los 6 pasos del proceso:
  1. Inversión en ARS
  2. Compra de USD oficial
  3. Compra de USDT
  4. Envío a Exchange de venta
  5. Venta de USDT
  6. Resultado final
- [ ] ✅ Cada paso tiene:
  - Icono descriptivo
  - Título
  - Valores calculados
  - Tiempo estimado
- [ ] ✅ Se muestra el tiempo total del proceso

---

### TEST 10: Matriz de Riesgo ✅

**Objetivo**: Verificar que la matriz de riesgo/rentabilidad funciona.

#### Pasos:
1. En el simulador, scroll hasta la sección **"Matriz de Riesgo/Rentabilidad"**
2. Ingresa un monto base (ej: $100,000)
3. Click en **"Generar Matriz"**

#### Verificaciones:
- [ ] ✅ Aparece una tabla 5x5
- [ ] ✅ Columnas: Diferentes % de rentabilidad objetivo (0%, 0.5%, 1%, 1.5%, 2%)
- [ ] ✅ Filas: Diferentes precios USD
- [ ] ✅ Celdas con código de colores:
  - 🟢 Verde: Ganancia positiva
  - 🟡 Amarillo: Ganancia marginal
  - 🔴 Rojo: Pérdida
- [ ] ✅ Muestra leyenda explicativa

---

## 🔍 Tests de Regresión

### TEST R1: Funcionalidad Existente NO Afectada ✅

**Objetivo**: Asegurar que las funciones anteriores siguen funcionando.

#### Verificaciones:
- [ ] ✅ Las rutas optimizadas se muestran correctamente
- [ ] ✅ Los filtros P2P funcionan (Todos / P2P / Sin P2P)
- [ ] ✅ El botón de actualizar (🔄) funciona
- [ ] ✅ La configuración de precio USD manual funciona
- [ ] ✅ El modo avanzado del simulador funciona
- [ ] ✅ La pestaña de bancos funciona

---

## 📋 Checklist Final

### Funcionalidades v5.0.28:
- [ ] ✅ Indicador de estado en header
- [ ] ✅ Timestamp con antigüedad en footer
- [ ] ✅ Configuración de seguridad en opciones
- [ ] ✅ Confirmación para montos altos
- [ ] ✅ Indicadores de nivel de riesgo
- [ ] ✅ Alertas de validación
- [ ] ✅ Verificación de cálculos
- [ ] ✅ Proceso completo paso a paso
- [ ] ✅ Matriz de riesgo/rentabilidad

### Funcionalidades previas (regresión):
- [ ] ✅ Rutas optimizadas
- [ ] ✅ Filtros P2P
- [ ] ✅ Simulador básico
- [ ] ✅ Simulador avanzado
- [ ] ✅ Actualización manual
- [ ] ✅ Configuración USD manual
- [ ] ✅ Pestaña de bancos

---

## 🐛 Reporte de Bugs

Si encuentras algún problema durante el testing, documenta:

### Template de Bug:
```
TÍTULO: [Descripción breve]

PASOS PARA REPRODUCIR:
1. 
2. 
3. 

RESULTADO ESPERADO:
[Qué debería pasar]

RESULTADO ACTUAL:
[Qué está pasando]

SEVERIDAD: [Crítico / Alto / Medio / Bajo]

CAPTURAS: [Si es posible]
```

---

## ✅ Criterios de Aceptación

Para considerar el hotfix v5.0.28 como **APROBADO**, deben cumplirse:

1. ✅ **Todos los tests de funcionalidad** (1-10) pasan sin errores críticos
2. ✅ **Todos los tests de regresión** (R1) pasan
3. ✅ **No hay errores en consola** del navegador
4. ✅ **La extensión no crashea** durante el uso normal
5. ✅ **Los estilos se ven correctamente** (sin elementos rotos)

---

## 📊 Resultado del Testing

### Completado por: _______________
### Fecha: _______________

### Resumen:
- Tests Pasados: ____ / 11
- Tests Fallidos: ____
- Bugs Encontrados: ____
- Severidad Bugs: ____

### Decisión:
- [ ] ✅ **APROBADO** - Listo para producción
- [ ] ⚠️ **APROBADO CON OBSERVACIONES** - Pequeños ajustes necesarios
- [ ] ❌ **RECHAZADO** - Requiere correcciones

### Notas Adicionales:
```
[Espacio para comentarios]
```

---

**¡BUENA SUERTE CON EL TESTING!** 🚀
