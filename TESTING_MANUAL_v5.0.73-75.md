# TESTING COMPLETO v5.0.73-75

**Fecha**: 13 de octubre de 2025  
**Versiones a testear**: 5.0.73, 5.0.74, 5.0.75  
**Tipo**: Testing Manual + Validación

---

## 📋 PREPARACIÓN

### 1. Recargar Extensión

```
1. Abrir Chrome/Edge
2. Ir a chrome://extensions
3. Buscar "ArbitrARS - Detector de Arbitraje"
4. Click en 🔄 (Recargar)
✅ Debe recargar sin errores
✅ Versión debe mostrar 5.0.75
```

### 2. Verificar Console

```
1. Click derecho en icono de extensión → Inspeccionar popup
2. Abrir Console (F12)
3. Abrir popup de la extensión
✅ No debe haber errores en rojo
✅ Debe mostrar logs de inicialización
```

---

## 🧪 TEST SUITE 1: v5.0.73 - Exchanges sin USD/USDT

### Test 1.1: Verificar exchanges válidos

**Objetivo**: Solo exchanges con datos USD/USDT reales deben aparecer

**Pasos:**
```
1. Abrir popup
2. Click "Actualizar" (🔄)
3. Esperar carga de datos
4. Abrir Console (F12)
5. Buscar logs: "Exchange válido" y "excluyendo"
```

**Resultado esperado:**
```
✅ [DEBUG] buenbit: USD/USDT = 1.0300 (válido)
✅ [DEBUG] lemon: USD/USDT = 1.0320 (válido)
✅ [DEBUG] belo: USD/USDT = 1.0400 (válido)
❌ [DEBUG] ripio: Sin datos USD/USDT en API, excluyendo
```

**Validación:**
- [ ] Solo exchanges con datos USD/USDT aparecen en rutas
- [ ] Ripio NO debe aparecer (no tiene USD/USDT)
- [ ] Logs muestran razón de exclusión
- [ ] No hay rutas con valores USD/USDT = 1.05 (fallback antiguo)

### Test 1.2: Verificar valores USD/USDT

**Objetivo**: Todos los valores USD/USDT deben estar en rango 0.95-1.15

**Pasos:**
```
1. Ver rutas mostradas
2. Verificar en console logs los valores USD/USDT
```

**Resultado esperado:**
```
Todos los valores entre 0.95 y 1.15
No hay valores exactamente 1.0 (sin spread)
No hay valores fuera de rango
```

**Validación:**
- [ ] Ningún exchange tiene USD/USDT = 1.0 exacto
- [ ] Todos los valores están en 0.95-1.15
- [ ] No hay warnings de "fuera de rango"

---

## 🧪 TEST SUITE 2: v5.0.74 - Validación e Indicadores

### Test 2.1: Indicador de frescura (datos frescos)

**Objetivo**: Datos <3 min deben mostrar 🟢 verde

**Pasos:**
```
1. Abrir popup
2. Click "Actualizar"
3. Inmediatamente ver header
```

**Resultado esperado:**
```
Header muestra: 🟢 Datos: hace 0 min
Timestamp abajo: 🟢 HH:MM:SS (hace 0 min)
Fondo verde claro
```

**Validación:**
- [ ] Icono 🟢 verde visible
- [ ] Texto "hace 0-2 min"
- [ ] Fondo verde en timestamp
- [ ] NO aparece banner de advertencia

### Test 2.2: Indicador de frescura (datos moderados)

**Objetivo**: Datos 3-5 min deben mostrar 🟡 amarillo

**Pasos:**
```
1. Abrir popup
2. Actualizar datos
3. Esperar 4 minutos SIN cerrar popup
4. Observar cambios
```

**Resultado esperado:**
```
Después de ~4 min:
Header muestra: 🟡 Datos: hace 4 min
Timestamp: 🟡 HH:MM:SS (hace 4 min)
Fondo amarillo
```

**Validación:**
- [ ] Icono cambia a 🟡 amarillo
- [ ] Texto muestra "hace 4 min"
- [ ] Fondo amarillo en timestamp
- [ ] AÚN NO aparece banner de advertencia

### Test 2.3: Advertencia datos desactualizados

**Objetivo**: Datos >5 min deben mostrar 🔴 rojo + banner

**Pasos:**
```
1. Abrir popup
2. Actualizar datos
3. Esperar 6 minutos SIN cerrar popup
4. Observar cambios
```

**Resultado esperado:**
```
Después de ~6 min:
Header: 🔴 Datos: hace 6 min
Timestamp: 🔴 HH:MM:SS (hace 6 min)
Banner aparece:
  ⚠️ Los datos tienen más de 6 minutos. 
  Actualiza para ver precios frescos. [🔄 Actualizar]
```

**Validación:**
- [ ] Icono cambia a 🔴 rojo
- [ ] Texto muestra "hace 6+ min"
- [ ] Fondo rojo en timestamp
- [ ] Banner de advertencia visible
- [ ] Banner tiene animación pulse
- [ ] Botón "Actualizar" funciona

### Test 2.4: Click en botón actualizar del banner

**Objetivo**: Banner debe desaparecer al actualizar

**Pasos:**
```
1. Con banner visible (datos >5 min)
2. Click en botón "🔄 Actualizar" del banner
3. Esperar carga
```

**Resultado esperado:**
```
Banner desaparece
Timestamp vuelve a 🟢 verde
Header muestra "hace 0 min"
```

**Validación:**
- [ ] Banner se oculta
- [ ] Indicador vuelve a verde
- [ ] Datos se actualizan

---

## 🧪 TEST SUITE 3: v5.0.75 - Filtros Avanzados

### Test 3.1: Toggle panel de filtros

**Objetivo**: Panel debe expandir/colapsar correctamente

**Pasos:**
```
1. Abrir popup
2. Buscar botón "⚙️ Filtros Avanzados"
3. Click en botón
4. Observar animación
5. Click de nuevo
```

**Resultado esperado:**
```
1er click: Panel se expande, flecha cambia a ▲
2do click: Panel se colapsa, flecha vuelve a ▼
Animación slideDown suave
```

**Validación:**
- [ ] Panel se expande al primer click
- [ ] Flecha cambia a ▲
- [ ] Panel se colapsa al segundo click
- [ ] Flecha vuelve a ▼
- [ ] Animación es suave

### Test 3.2: Filtro por exchange

**Objetivo**: Mostrar solo rutas del exchange seleccionado

**Pasos:**
```
1. Expandir "Filtros Avanzados"
2. Ver select "Exchange"
3. Verificar opciones disponibles
4. Seleccionar "Buenbit"
5. Click "✓ Aplicar Filtros"
6. Revisar rutas mostradas
```

**Resultado esperado:**
```
Select tiene opciones:
- Todos los exchanges
- Buenbit
- Lemon
- Belo
- (otros exchanges disponibles)

Después de aplicar:
- Solo rutas que compran O venden en Buenbit
- Panel se cierra automáticamente
```

**Validación:**
- [ ] Select se pobla con exchanges únicos
- [ ] Opciones están ordenadas alfabéticamente
- [ ] Al aplicar, solo rutas de ese exchange
- [ ] Panel se cierra al aplicar
- [ ] Contadores de filtros P2P se mantienen correctos

### Test 3.3: Slider profit mínimo

**Objetivo**: Filtrar por profit mínimo con slider

**Pasos:**
```
1. Expandir filtros
2. Mover slider "Profit mínimo"
3. Observar valor mostrado
4. Mover a 3%
5. Click "Aplicar Filtros"
```

**Resultado esperado:**
```
- Slider se mueve suavemente
- Valor se actualiza en tiempo real (ej: "3.0%")
- Después de aplicar: solo rutas con profit ≥ 3%
```

**Validación:**
- [ ] Slider se mueve correctamente
- [ ] Valor se actualiza en tiempo real
- [ ] Solo rutas con profit ≥ valor seleccionado
- [ ] Slider tiene estilo personalizado (azul)
- [ ] Hover en thumb hace scale

### Test 3.4: Toggle ocultar negativas

**Objetivo**: Ocultar todas las rutas con profit negativo

**Pasos:**
```
1. Expandir filtros
2. Activar checkbox "🚫 Ocultar rutas negativas"
3. Click "Aplicar Filtros"
4. Verificar rutas mostradas
```

**Resultado esperado:**
```
- Checkbox se marca
- Después de aplicar: NO hay rutas con profit < 0%
- Todas las rutas tienen profit ≥ 0%
```

**Validación:**
- [ ] Checkbox funciona
- [ ] No hay rutas negativas mostradas
- [ ] Contador de rutas disminuye correctamente

### Test 3.5: Ordenar por diferentes criterios

**Objetivo**: Verificar los 4 tipos de ordenamiento

**Test 3.5.1 - Profit (mayor a menor) [DEFAULT]:**
```
1. Expandir filtros
2. Verificar que "Profit (mayor a menor)" está seleccionado
3. Aplicar filtros
4. Verificar orden
```

**Resultado esperado:**
```
Primera ruta: Mayor profit %
Última ruta: Menor profit %
Orden descendente
```

**Validación:**
- [ ] Rutas ordenadas de mayor a menor profit
- [ ] Primera ruta tiene el profit más alto

**Test 3.5.2 - Profit (menor a mayor):**
```
1. Seleccionar "Profit (menor a mayor)"
2. Aplicar filtros
3. Verificar orden
```

**Resultado esperado:**
```
Primera ruta: Menor profit %
Última ruta: Mayor profit %
Orden ascendente
```

**Validación:**
- [ ] Rutas ordenadas de menor a mayor profit
- [ ] Primera ruta tiene el profit más bajo

**Test 3.5.3 - Exchange (A-Z):**
```
1. Seleccionar "Exchange (A-Z)"
2. Aplicar filtros
3. Verificar orden
```

**Resultado esperado:**
```
Rutas ordenadas alfabéticamente por buyExchange
Primera ruta: Exchange que empieza con letra temprana (A, B...)
```

**Validación:**
- [ ] Rutas ordenadas alfabéticamente
- [ ] Orden es consistente

**Test 3.5.4 - Inversión (mayor a menor):**
```
1. Seleccionar "Inversión (mayor a menor)"
2. Aplicar filtros
3. Verificar montos iniciales
```

**Resultado esperado:**
```
Primera ruta: Mayor monto inicial requerido
Última ruta: Menor monto inicial
```

**Validación:**
- [ ] Rutas ordenadas por inversión inicial
- [ ] Orden es correcto

### Test 3.6: Botón resetear

**Objetivo**: Volver todos los filtros a defaults

**Pasos:**
```
1. Configurar varios filtros:
   - Exchange: "Lemon"
   - Profit mín: 5%
   - Ocultar negativas: ON
   - Ordenar: "Exchange A-Z"
2. Click "✓ Aplicar Filtros"
3. Expandir filtros de nuevo
4. Click "⟲ Resetear"
```

**Resultado esperado:**
```
Después de resetear:
- Exchange: "Todos los exchanges"
- Profit mín: 0%
- Ocultar negativas: OFF
- Ordenar: "Profit (mayor a menor)"
- Filtros se aplican automáticamente
- Todas las rutas vuelven a mostrarse
```

**Validación:**
- [ ] Todos los campos vuelven a defaults
- [ ] Filtros se aplican automáticamente
- [ ] Rutas se actualizan correctamente

### Test 3.7: Combinación de filtros

**Objetivo**: Verificar que múltiples filtros funcionan juntos

**Pasos:**
```
1. Filtro P2P: "Directo" (sin P2P)
2. Expandir filtros avanzados
3. Exchange: "Buenbit"
4. Profit mín: 2%
5. Ocultar negativas: ON
6. Ordenar: "Profit (mayor a menor)"
7. Click "Aplicar Filtros"
```

**Resultado esperado:**
```
Solo rutas que cumplen TODO:
- Son directas (no P2P)
- Usan Buenbit (compra o venta)
- Tienen profit ≥ 2%
- No son negativas (redundante con profit ≥ 2%)
- Ordenadas por profit descendente
```

**Validación:**
- [ ] Todas las condiciones se cumplen
- [ ] No hay rutas que no cumplan algún filtro
- [ ] Orden es correcto
- [ ] Contadores de rutas son coherentes

---

## 🧪 TEST SUITE 4: Integración

### Test 4.1: Interacción filtros P2P + avanzados

**Objetivo**: Verificar que ambos sistemas de filtros cooperan

**Pasos:**
```
1. Seleccionar filtro P2P: "P2P"
2. Expandir filtros avanzados
3. Exchange: "Lemon"
4. Aplicar filtros
```

**Resultado esperado:**
```
Solo rutas que son:
- P2P (Lemon P2P o similar)
- Y usan Lemon como exchange
```

**Validación:**
- [ ] Filtros P2P se respetan
- [ ] Filtros avanzados se aplican encima
- [ ] No hay conflictos

### Test 4.2: Actualizar datos con filtros activos

**Objetivo**: Filtros deben persistir al actualizar datos

**Pasos:**
```
1. Configurar filtros:
   - P2P: "Directo"
   - Exchange: "Buenbit"
   - Profit mín: 3%
2. Aplicar filtros
3. Click botón "Actualizar" (🔄) principal
4. Esperar carga de datos
```

**Resultado esperado:**
```
Después de actualizar:
- Filtros siguen activos
- Rutas mostradas siguen filtradas
- Contadores se actualizan correctamente
```

**Validación:**
- [ ] Filtros persisten después de actualizar
- [ ] Rutas nuevas se filtran correctamente
- [ ] No se resetean los filtros

### Test 4.3: Cambiar de pestaña y volver

**Objetivo**: Verificar que filtros se mantienen al cambiar tabs

**Pasos:**
```
1. Configurar filtros en tab "Rutas"
2. Cambiar a tab "Simulador"
3. Volver a tab "Rutas"
```

**Resultado esperado:**
```
Filtros se mantienen configurados
Rutas siguen filtradas
```

**Validación:**
- [ ] Filtros no se pierden
- [ ] Vista de rutas se mantiene

---

## 🧪 TEST SUITE 5: Validación de Cálculos

### Test 5.1: Verificar coherencia de valores

**Objetivo**: Todos los cálculos deben ser coherentes

**Pasos:**
```
1. Ver rutas mostradas
2. Click en una ruta para ver guía
3. Comparar valores:
   - Profit % en tarjeta vs guía
   - Valores USD/USDT
   - Montos finales
```

**Resultado esperado:**
```
Todos los valores coinciden entre:
- Tarjeta de ruta
- Guía paso a paso
- Console logs
```

**Validación:**
- [ ] Profit % es consistente
- [ ] USD/USDT está en rango válido
- [ ] No hay advertencias de validación
- [ ] Cálculos son lógicos (no hay profit >50% sin explicación)

---

## 📊 CHECKLIST FINAL

### v5.0.73 - Exchanges sin USD/USDT
- [ ] Solo exchanges con datos reales aparecen
- [ ] Ripio NO aparece (sin USD/USDT)
- [ ] No hay valores fallback 1.05
- [ ] Logs explican exclusiones

### v5.0.74 - Validación e Indicadores
- [ ] 🟢 Verde para datos <3 min
- [ ] 🟡 Amarillo para datos 3-5 min
- [ ] 🔴 Rojo para datos >5 min
- [ ] Banner de advertencia aparece >5 min
- [ ] Banner tiene botón actualizar funcional
- [ ] Timestamp muestra edad en minutos

### v5.0.75 - Filtros Avanzados
- [ ] Panel toggle funciona
- [ ] Filtro por exchange funciona
- [ ] Slider profit mínimo funciona
- [ ] Toggle ocultar negativas funciona
- [ ] 4 tipos de ordenamiento funcionan
- [ ] Botón resetear funciona
- [ ] Combinación de filtros funciona
- [ ] Filtros persisten al actualizar datos

### Integración General
- [ ] No hay errores en console
- [ ] Extensión no crashea
- [ ] Performance es buena (<1s carga)
- [ ] UI es responsive
- [ ] Animaciones son suaves
- [ ] Dark theme consistente

---

## 🐛 BUGS ENCONTRADOS

_(Usar esta sección para documentar cualquier bug durante testing)_

### Bug #1:
**Descripción:**
**Pasos para reproducir:**
**Resultado esperado:**
**Resultado actual:**
**Severidad:** Alta/Media/Baja

---

## ✅ RESULTADO FINAL

### Tests Pasados: __/50
### Tests Fallados: __/50
### Bugs Críticos: __
### Bugs Menores: __

### Estado General:
- [ ] ✅ TODO FUNCIONA - Listo para producción
- [ ] ⚠️ FUNCIONA CON BUGS MENORES - Arreglar antes de release
- [ ] ❌ BUGS CRÍTICOS - No deployar

---

## 📝 NOTAS ADICIONALES

_(Agregar cualquier observación, sugerencia o comentario durante el testing)_

---

**Tester**: _______________________  
**Fecha completado**: _______________________  
**Tiempo total**: _______________________
