# 📋 CHECKLIST DE TESTING v5.0.64

## 🔄 PASO 1: Recargar Extensión

- [ ] Abrir Chrome
- [ ] Ir a `chrome://extensions/`
- [ ] Activar "Modo de desarrollador"
- [ ] Click en "Recargar" en la extensión ArbitrARS
- [ ] Verificar que no hay errores en consola

---

## ⚙️ PASO 2: Verificar Configuración

### A. Abrir Opciones
- [ ] Click derecho en ícono de extensión → "Opciones"
- [ ] O navegar a pestaña "Rutas"

### B. Verificar Sección "Visualización de Rutas"
- [ ] ✅ Título: "🎨 Visualización de Rutas"
- [ ] ✅ Descripción presente (fondo gris con borde azul)
- [ ] ✅ Input "Cantidad máxima de rutas": default 20
- [ ] ✅ Toggle "Ordenar por ganancia": default ON
- [ ] ✅ Toggle "Priorizar exchanges únicos": default OFF

### C. Verificar Sección "Filtros de Display"
- [ ] ✅ Título: "🔍 Filtros de Display"
- [ ] ✅ Advertencia amarilla presente
- [ ] ✅ Texto: "Estos filtros solo afectan qué rutas VES"
- [ ] ✅ Input "Ganancia mínima para mostrar":
  - Min: -10
  - Max: 20
  - Step: 0.5
  - Default: -10
- [ ] ✅ Hint explicativo presente con ejemplos `<code>`

### D. Verificar NO hay controles antiguos
- [ ] ❌ NO existe "Mostrar rutas negativas"
- [ ] ❌ NO existe "Solo mostrar rentables"
- [ ] ❌ NO existe "Umbral de ganancia" (antiguo)

---

## 🧪 PASO 3: Test Funcional de Filtros

### Test 1: Default (-10%)
1. [ ] Configurar `filter-min-profit = -10`
2. [ ] Guardar configuración
3. [ ] Abrir popup
4. [ ] **ESPERADO:** Ver rutas con pérdidas pequeñas y medianas (-9%, -5%, etc.)
5. [ ] **NO VER:** Rutas con pérdidas muy grandes (<-10%)

### Test 2: Solo Rentables (0%)
1. [ ] Configurar `filter-min-profit = 0`
2. [ ] Guardar configuración
3. [ ] Abrir popup
4. [ ] **ESPERADO:** Solo rutas con ganancia positiva (>0%)
5. [ ] **NO VER:** Ninguna ruta con pérdida

### Test 3: Muy Rentables (5%)
1. [ ] Configurar `filter-min-profit = 5`
2. [ ] Guardar configuración
3. [ ] Abrir popup
4. [ ] **ESPERADO:** Solo rutas con >5% ganancia
5. [ ] **NO VER:** Rutas con <5% ganancia

### Test 4: Mostrar Todo (-50%)
1. [ ] Configurar `filter-min-profit = -50`
2. [ ] Guardar configuración
3. [ ] Abrir popup
4. [ ] **ESPERADO:** Ver TODAS las rutas (incluso pérdidas grandes)

### Test 5: Ninguna Ruta (20%)
1. [ ] Configurar `filter-min-profit = 20`
2. [ ] Guardar configuración
3. [ ] Abrir popup
4. [ ] **ESPERADO:** Probablemente ninguna ruta (o muy pocas)
5. [ ] **MENSAJE:** "No hay rutas disponibles" o similar

---

## ♿ PASO 4: Test de Accesibilidad

### A. Navegación con Teclado
1. [ ] Abrir opciones
2. [ ] Presionar `Tab` repetidamente
3. [ ] **VERIFICAR:** Cada input recibe focus con outline azul (3px)
4. [ ] **VERIFICAR:** Orden lógico de navegación
5. [ ] Presionar `Enter` en toggles
6. [ ] **VERIFICAR:** Toggles cambian de estado

### B. Contraste Visual
1. [ ] Verificar texto en `.section-description`
2. [ ] **COLOR:** `#64748b` (gris)
3. [ ] **CONTRASTE:** Debe ser legible (ratio >4.5:1)
4. [ ] Verificar hint text
5. [ ] **COLOR:** `#64748b` (gris)
6. [ ] **LEGIBILIDAD:** Clara y fácil de leer

### C. Estados Visuales
1. [ ] Ingresar valor inválido en input (ej: 100)
2. [ ] **VERIFICAR:** Border rojo si `aria-invalid="true"`
3. [ ] Hover sobre inputs
4. [ ] **VERIFICAR:** Cambio visual claro
5. [ ] Focus en inputs
6. [ ] **VERIFICAR:** Outline azul 3px con offset 2px

---

## 🔍 PASO 5: Verificar Console (Errores)

### Abrir DevTools
1. [ ] Click derecho en popup → "Inspeccionar"
2. [ ] Ir a pestaña "Console"
3. [ ] **VERIFICAR:** NO hay errores rojos
4. [ ] **ACEPTABLE:** Warnings amarillos (no críticos)

### Errores Comunes a Revisar
- [ ] ❌ `show-negative-routes is not defined` (NO debe aparecer)
- [ ] ❌ `showOnlyProfitable is not defined` (NO debe aparecer)
- [ ] ❌ `applyNegativeFilter is not defined` (NO debe aparecer)
- [ ] ✅ Logs de filtrado con `filterMinProfit` (deben aparecer)

---

## 📊 PASO 6: Verificar Datos

### A. Popup Muestra Rutas
1. [ ] Abrir popup
2. [ ] **VERIFICAR:** Se muestran rutas
3. [ ] **VERIFICAR:** Cada ruta tiene:
   - Broker
   - Ganancia (%)
   - Ganancia ($)
   - USDT/USD rate (si aplica)

### B. Filtrado Correcto
1. [ ] Con `filter-min-profit = 0`
2. [ ] Verificar que TODAS las rutas visibles tienen ganancia >0%
3. [ ] Con `filter-min-profit = -10`
4. [ ] Verificar que hay rutas con ganancia negativa (pero >-10%)

### C. Advertencias USDT/USD
1. [ ] Buscar ícono ⚠️ en rutas
2. [ ] Hover sobre advertencia
3. [ ] **VERIFICAR:** Tooltip explicativo
4. [ ] **ESPERADO:** "Tasa USDT/USD calculada (API no disponible)"

---

## 🎨 PASO 7: Verificar Estilos

### Sección "Visualización de Rutas"
- [ ] Fondo gris claro (`#f1f5f9`)
- [ ] Borde izquierdo azul (`#667eea`)
- [ ] Padding y margin correctos
- [ ] Texto legible

### Sección "Filtros de Display"
- [ ] Fondo amarillo claro (`#fef3c7`)
- [ ] Borde izquierdo naranja (`#f59e0b`)
- [ ] Advertencia clara y visible
- [ ] Texto `<code>` con fondo diferenciado

### Inputs
- [ ] Border color correcto
- [ ] Padding interno adecuado
- [ ] Placeholder text visible
- [ ] Disabled state claro (si aplica)

---

## ✅ PASO 8: Checklist Final

### Funcionalidad
- [ ] ✅ Rutas se muestran correctamente
- [ ] ✅ Filtro `-10%` muestra casi todo
- [ ] ✅ Filtro `0%` solo muestra rentables
- [ ] ✅ Filtro configurable entre -10% y +20%
- [ ] ✅ NO hay controles superpuestos

### Accesibilidad
- [ ] ✅ Navegación con teclado funciona
- [ ] ✅ Focus visible en todos los inputs
- [ ] ✅ ARIA labels presentes
- [ ] ✅ Roles semánticos en toggles
- [ ] ✅ Contraste adecuado (>4.5:1)

### UI/UX
- [ ] ✅ Secciones claramente separadas
- [ ] ✅ Descripciones explicativas presentes
- [ ] ✅ Hints con ejemplos de código
- [ ] ✅ Advertencias visuales (fondo amarillo)
- [ ] ✅ Tipografía escalada y legible

### Performance
- [ ] ✅ Popup carga en <5 segundos
- [ ] ✅ NO hay lag al cambiar configuración
- [ ] ✅ Rutas se actualizan correctamente

---

## 🐛 TROUBLESHOOTING

### Problema: "No se muestran rutas"
**Soluciones:**
1. Verificar `filter-min-profit` no está en valor muy alto (ej: 20%)
2. Cambiar a `-50%` para ver todas las rutas
3. Revisar console por errores de API
4. Verificar que backend está funcionando (DevTools → Background Service Worker)

### Problema: "Controles antiguos todavía visibles"
**Soluciones:**
1. Hacer hard refresh de opciones: `Ctrl+Shift+R`
2. Verificar caché del navegador
3. Recargar extensión completamente
4. Revisar que `options.html` está actualizado

### Problema: "Focus no visible"
**Soluciones:**
1. Verificar que `options.css` tiene la sección de v5.0.64
2. Buscar `*:focus-visible { outline: 3px solid #667eea; }`
3. Si no está, copiar estilos del archivo de changelog

### Problema: "Filtro no funciona"
**Soluciones:**
1. Abrir console del popup
2. Buscar logs: `"Filtradas por ganancia mínima..."`
3. Verificar que `popup.js` tiene `applyMinProfitFilter()`
4. Verificar que `options.js` guarda `filterMinProfit` correctamente

---

## 📞 REPORTE DE BUGS

Si encuentras algún problema:

1. **Capturar pantalla** del problema
2. **Abrir console** y copiar errores
3. **Anotar pasos** para reproducir
4. **Verificar versión** en manifest.json (debe ser 5.0.64)

---

## 🎉 SUCCESS CRITERIA

La versión 5.0.64 está funcionando correctamente si:

- ✅ NO hay controles superpuestos (show-negative-routes, show-only-profitable)
- ✅ Hay UN SOLO control de filtro: `filter-min-profit` (-10% a +20%)
- ✅ Rutas se filtran correctamente según configuración
- ✅ Navegación con teclado funciona perfectamente
- ✅ Focus visible en todos los inputs
- ✅ Descripciones y advertencias claras
- ✅ NO hay errores en console
- ✅ Tests automatizados pasan (11/11)

**Si todos los items están ✅ → v5.0.64 FUNCIONANDO CORRECTAMENTE 🎉**
