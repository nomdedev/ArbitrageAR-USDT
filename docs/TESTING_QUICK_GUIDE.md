# 📋 GUÍA RÁPIDA DE TESTING v5.0.73-75

**Versión**: 5.0.75  
**Fecha**: 13 de octubre de 2025  
**Estado**: ✅ Pre-verificación PASADA

---

## 🚀 INICIO RÁPIDO (5 minutos)

### 1️⃣ Recargar Extensión
```
Chrome/Edge → chrome://extensions
Buscar "ArbitrARS - Detector de Arbitraje"
Click 🔄 (Recargar)
✅ Debe decir: v5.0.75
```

### 2️⃣ Abrir DevTools
```
Click derecho en icono de extensión → Inspeccionar popup
O: Abrir popup + F12
✅ Console debe estar visible
```

### 3️⃣ Primera Actualización
```
Click botón "Actualizar" (🔄)
Esperar 3-5 segundos
✅ Debe mostrar rutas
```

---

## ⚡ TESTS CRÍTICOS (10 minutos)

### 🧪 TEST 1: Exchanges Válidos (v5.0.73)
```
📍 Objetivo: Solo exchanges con USD/USDT real

1. Abrir Console (F12)
2. Click "Actualizar"
3. Buscar en logs: "Exchanges válidos"

✅ ESPERADO:
   - Logs muestran ~13 exchanges
   - Ripio NO aparece en rutas
   - No hay valores USD/USDT = 1.05

❌ SI FALLA:
   - Ver qué exchanges se están usando
   - Verificar si hay "excluyendo" en logs
```

### 🧪 TEST 2: Indicador Verde (v5.0.74)
```
📍 Objetivo: Datos frescos muestran 🟢

1. Después de actualizar inmediatamente
2. Ver header arriba
3. Ver timestamp abajo

✅ ESPERADO:
   Header: "🟢 Datos: hace 0 min"
   Timestamp: "🟢 HH:MM:SS (hace 0 min)"
   Fondo verde

❌ SI FALLA:
   - Verificar que dice "hace 0-2 min"
   - Ver console por errores
```

### 🧪 TEST 3: Advertencia Roja (v5.0.74)
```
📍 Objetivo: Datos >5min muestran 🔴 + banner

1. Actualizar datos
2. ESPERAR 6 MINUTOS (no cerrar popup)
3. Observar cambios

✅ ESPERADO:
   - Icono cambia a 🔴
   - Dice "hace 6 min"
   - Banner aparece: "⚠️ Los datos tienen más de 6 minutos..."
   - Botón "Actualizar" en banner

❌ SI FALLA:
   - Verificar si el tiempo avanza
   - Ver si hay errores en console
```

### 🧪 TEST 4: Toggle Filtros (v5.0.75)
```
📍 Objetivo: Panel se expande/colapsa

1. Buscar botón "⚙️ Filtros Avanzados"
2. Click en botón
3. Debe expandirse panel
4. Click de nuevo
5. Debe colapsarse

✅ ESPERADO:
   - Panel aparece con animación suave
   - Flecha cambia ▼ → ▲
   - Se ve select, slider, checkbox

❌ SI FALLA:
   - Ver si botón responde
   - Verificar errores en console
```

### 🧪 TEST 5: Filtro por Exchange (v5.0.75)
```
📍 Objetivo: Filtrar solo por un exchange

1. Expandir "Filtros Avanzados"
2. Select "Exchange": elegir "Buenbit"
3. Click "✓ Aplicar Filtros"
4. Ver rutas mostradas

✅ ESPERADO:
   - Solo rutas con Buenbit (compra O venta)
   - Panel se cierra
   - Contador de rutas disminuye

❌ SI FALLA:
   - Ver si hay rutas sin Buenbit
   - Verificar console logs
```

### 🧪 TEST 6: Slider Profit (v5.0.75)
```
📍 Objetivo: Filtrar por profit mínimo

1. Expandir filtros
2. Mover slider a 3%
3. Ver valor actualizado en tiempo real
4. Click "Aplicar Filtros"

✅ ESPERADO:
   - Valor dice "3.0%"
   - Solo rutas con profit ≥ 3%
   - Slider azul con animación

❌ SI FALLA:
   - Ver si slider se mueve
   - Verificar si hay rutas < 3%
```

### 🧪 TEST 7: Resetear Filtros (v5.0.75)
```
📍 Objetivo: Volver a defaults

1. Configurar varios filtros (exchange, profit, etc)
2. Aplicar filtros
3. Expandir filtros de nuevo
4. Click "⟲ Resetear"

✅ ESPERADO:
   - Exchange: "Todos los exchanges"
   - Profit: 0%
   - Checkbox: OFF
   - Sort: "Profit (mayor a menor)"
   - Todas las rutas vuelven

❌ SI FALLA:
   - Ver qué no se resetea
   - Verificar console
```

---

## 🎯 CHECKLIST RÁPIDO

### v5.0.73 - Exchanges
- [ ] Solo ~13 exchanges con USD/USDT
- [ ] Ripio NO aparece
- [ ] Logs explican exclusiones

### v5.0.74 - Indicadores
- [ ] 🟢 Verde <3min
- [ ] 🟡 Amarillo 3-5min
- [ ] 🔴 Rojo >5min + banner

### v5.0.75 - Filtros
- [ ] Panel toggle funciona
- [ ] 4 filtros funcionan (exchange, profit, hide, sort)
- [ ] Botones Apply/Reset funcionan

---

## 🐛 SI ALGO FALLA

### Error en Console
```
1. Captura screenshot del error completo
2. Anotar qué estabas haciendo
3. Verificar versión (debe ser 5.0.75)
```

### Función no responde
```
1. Ver console por errores
2. Recargar extensión (chrome://extensions)
3. Probar de nuevo
```

### Valores incorrectos
```
1. Ver logs de console
2. Verificar qué exchange tiene problema
3. Comparar con API real (criptoya.com/api)
```

---

## 📊 DOCUMENTO COMPLETO

Para testing exhaustivo (50+ tests), ver:
📄 **TESTING_MANUAL_v5.0.73-75.md**

Este documento tiene:
- 5 suites completas
- Tests de integración
- Tests de combinación de filtros
- Checklist de 50 puntos
- Sección para documentar bugs

---

## ✅ AL FINALIZAR

Si todo funciona:
- [ ] Marcar checklist en TESTING_MANUAL_v5.0.73-75.md
- [ ] Documentar bugs (si hay) en sección correspondiente
- [ ] Decidir próximos pasos:
  - Implementar persistencia de filtros (v5.0.76)
  - Más validaciones API
  - Historial de rutas

---

**🎯 ¡Listo para testear! Mucha suerte 🚀**
