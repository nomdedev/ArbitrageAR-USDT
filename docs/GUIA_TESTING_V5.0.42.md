# 🚀 GUÍA DE TESTING POST-HOTFIX v5.0.42

**Versión:** 5.0.42  
**Fecha:** 12 de octubre de 2025  
**Propósito:** Verificar que el hotfix resolvió el problema de rutas no visibles

---

## 📋 PRE-REQUISITOS

- ✅ Navegador Chrome/Edge/Brave (Chromium)
- ✅ Conexión a internet
- ✅ Código actualizado a v5.0.42

---

## 🔧 PASO 1: Cargar la Extensión

### Método 1: Chrome Developer Mode

1. **Abrir Chrome Extensions:**
   ```
   chrome://extensions/
   ```

2. **Activar "Modo de desarrollador"** (esquina superior derecha)

3. **Clic en "Cargar extensión sin empaquetar"**

4. **Seleccionar carpeta:**
   ```
   d:\martin\Proyectos\ArbitrageAR-Oficial-USDT-Broker
   ```

5. **Verificar que aparece:**
   - ✅ Icono de la extensión
   - ✅ Nombre: "ArbitrARS - Detector de Arbitraje"
   - ✅ Versión: **5.0.42**
   - ✅ Estado: Habilitada

### Método 2: Edge/Brave

- **Edge:** `edge://extensions/`
- **Brave:** `brave://extensions/`
- Seguir mismos pasos que Chrome

---

## 🧪 PASO 2: Testing del Background

### 2.1 Abrir Consola del Background

1. En `chrome://extensions/`
2. Buscar "ArbitrARS"
3. Clic en **"Service Worker"** o **"background page"**
4. Se abre DevTools del background

### 2.2 Verificar Logs de Inicialización

Deberías ver:

```
🔧 [BACKGROUND] main.js se está cargando en: 2025-10-12T...
✅ [BACKGROUND] Todos los imports completados exitosamente
🔍 [BACKGROUND] Verificando funciones importadas...
- fetchCriptoyaUSDTtoUSD: function
- fetchCriptoyaUSDT: function
- calculateOptimizedRoutes: function
🚀 [BACKGROUND] Iniciando inicialización del service worker...
```

### 2.3 Verificar Fetch de Datos

Deberías ver:

```
🚀 [BACKGROUND] Inicializando background script en: ...
📡 [DEBUG] Consultando APIs...
📊 [DEBUG] Datos obtenidos - Oficial: true, USDT: true, USDT/USD: true
💵 [DEBUG] Precio dólar: $XXX (fuente) - banco
🧮 [DEBUG] Iniciando calculateOptimizedRoutes...
🔀 [DEBUG] Iniciando calculateOptimizedRoutes...
🏦 Exchanges válidos: XX (binance, buenbit, ...)
✅ [DEBUG] calculateOptimizedRoutes completado en XXms - XX rutas
✅ [DEBUG] updateData() COMPLETADO - XX rutas calculadas
```

### 2.4 ❌ Errores a Buscar (NO deberían aparecer)

Si ves esto, HAY UN PROBLEMA:

```
❌ Error en imports
❌ Cannot import
❌ Module not found
❌ calculateOptimizedRoutes is not a function
❌ Error calculando rutas
```

---

## 🎨 PASO 3: Testing del Popup

### 3.1 Abrir Popup

1. **Hacer clic en el icono de la extensión** en la barra de Chrome
2. Se abre el popup

### 3.2 Verificar UI

Deberías ver:

```
┌─────────────────────────────────────┐
│ 💰 arbitrarARS                      │
│ Dólar Oficial → USDT                │
│                           v5.0.42 ⚙️ ⟳│
├─────────────────────────────────────┤
│ 🏠 Rutas | 🎲 Simulador | 📚 Guía  │
├─────────────────────────────────────┤
│ TIPO:                               │
│ [⚡ DIRECTO 0] [🤝 P2P 0] [🔀 TODAS 0]│
├─────────────────────────────────────┤
│ RUTAS DE ARBITRAJE:                 │
│                                     │
│ [Tarjeta Ruta 1]                    │
│ 🎯 Ruta 1                          │
│ 🏦 Binance                         │
│ +X.XX% sobre $1,000,000            │
│                                     │
│ [Tarjeta Ruta 2]                    │
│ ...                                 │
└─────────────────────────────────────┘
```

### 3.3 Verificar Consola del Popup

1. **Click derecho en el popup** → "Inspeccionar"
2. Ir a pestaña **Console**

Deberías ver:

```
🚀 Popup.js cargado correctamente
📄 DOM Content Loaded - Iniciando setup...
🔄 Cargando datos de arbitraje... (intento 1)
📤 [POPUP] Solicitando datos al background...
📤 [POPUP] Enviando mensaje { action: "getArbitrages" }...
📥 [POPUP] Callback ejecutado - Datos recibidos: {...}
📥 Procesando respuesta del background...
📥 Data válida recibida, procesando...
🔍 [POPUP] allRoutes guardadas: XX rutas
📊 Contadores actualizados - Total: XX, P2P: X, No P2P: XX
🔍 [POPUP] applyP2PFilter() llamado con filtro: no-p2p
🔍 Filtro No-P2P: XX rutas directas de XX
🔍 Después de applyUserPreferences: XX rutas
🔍 Llamando displayOptimizedRoutes con XX rutas
✅ [POPUP] displayOptimizedRoutes() completado - HTML generado y aplicado
```

### 3.4 ❌ Errores a Buscar (NO deberían aparecer)

```
❌ No se recibió data del background
❌ optimizedRoutes no es array
❌ Error en chrome.runtime
⏰ Timeout de Conexión
No hay rutas disponibles (si hay datos en background)
```

---

## ✅ PASO 4: Verificación de Funcionalidad

### 4.1 Test de Rutas

- [ ] **Se muestran rutas** en el popup
- [ ] **Contadores actualizados:**
  - Total: X rutas
  - P2P: X rutas
  - No P2P: X rutas
- [ ] **Filtros funcionan:**
  - Click en "⚡ DIRECTO" → Solo rutas directas
  - Click en "🤝 P2P" → Solo rutas P2P
  - Click en "🔀 TODAS" → Todas las rutas

### 4.2 Test de Rutas Individuales

Hacer **click en una tarjeta de ruta**:

- [ ] Se **marca como seleccionada** (borde azul)
- [ ] Se **cambia a pestaña "Guía"**
- [ ] Se muestra **guía paso a paso:**
  - 💵 Comprar Dólares Oficiales
  - 🔄 Convertir USD a USDT
  - 💸 Vender USDT por Pesos
  - 🏦 Retirar a tu Banco

### 4.3 Test de Simulador

1. **Click en pestaña "Simulador"**
2. Verificar:
   - [ ] Campo de monto con valor por defecto
   - [ ] Selector de ruta
   - [ ] Botón "Calcular"
3. **Ingresar monto** (ej: 2000000)
4. **Seleccionar ruta**
5. **Click en "Calcular"**
6. Verificar:
   - [ ] Se muestra cálculo detallado
   - [ ] Inversión inicial
   - [ ] Ganancia proyectada
   - [ ] Porcentaje de ganancia

### 4.4 Test de Configuración

1. **Click en ⚙️** (Settings)
2. Se abre página de opciones
3. Verificar pestañas:
   - [ ] ⚙️ General
   - [ ] 🔔 Notificaciones
   - [ ] 💵 Precio Dólar
   - [ ] 🏦 Bancos

---

## 🐛 PASO 5: Troubleshooting

### Problema 1: No se cargan rutas

**Síntomas:**
- Popup muestra "No hay rutas disponibles"
- O muestra mensaje de "Inicializando..."

**Solución:**

1. **Verificar background console:**
   - Debe mostrar rutas calculadas
   - Verificar que no haya errores de import

2. **Recargar extensión:**
   - En `chrome://extensions/`
   - Click en ⟳ (Recargar)

3. **Verificar conexión:**
   - APIs deben estar accesibles
   - Probar: https://dolarapi.com/v1/dolares/oficial
   - Probar: https://criptoya.com/api/usdt/ars/1

### Problema 2: Error de imports

**Síntomas:**
```
Cannot import module './dataFetcher.js'
```

**Solución:**

1. **Verificar manifest.json:**
   ```json
   "background": {
     "service_worker": "src/background/main.js"
   }
   ```

2. **Verificar que archivos existen:**
   - `src/background/main.js`
   - `src/background/dataFetcher.js`
   - `src/background/routeCalculator.js`
   - `src/background/config.js`

3. **Recargar extensión**

### Problema 3: Rutas sin campo 'broker'

**Síntomas:**
```
🔍 undefined: requiresP2P=...
```

**Solución:**

1. **Verificar routeCalculator.js línea ~227:**
   ```javascript
   const broker = buyExchange === sellExchange 
     ? buyExchange 
     : `${buyExchange} → ${sellExchange}`;

   return {
     broker,  // ✅ Debe estar presente
     ...
   }
   ```

2. **Si falta, revisar que usas la versión correcta del archivo**

---

## 📊 CHECKLIST FINAL

### Verificación Completa:

- [ ] ✅ Extensión cargada en Chrome (v5.0.42)
- [ ] ✅ Background console sin errores
- [ ] ✅ Imports funcionan correctamente
- [ ] ✅ APIs responden
- [ ] ✅ Rutas se calculan (X rutas)
- [ ] ✅ Popup muestra rutas
- [ ] ✅ Contadores actualizados
- [ ] ✅ Filtros P2P funcionan
- [ ] ✅ Guía paso a paso funciona
- [ ] ✅ Simulador funciona
- [ ] ✅ Configuración accesible
- [ ] ✅ No hay errores en consolas

### Si TODO está ✅:

🎉 **¡HOTFIX EXITOSO!** 🎉

El problema de rutas no visibles ha sido resuelto.

---

## 📸 Screenshots Esperados

### 1. Background Console
```
✅ [BACKGROUND] calculateOptimizedRoutes completado en 234ms - 45 rutas
```

### 2. Popup - Rutas Visibles
```
🎯 Ruta 1                    +2.34%
🏦 Binance
sobre $1,000,000
```

### 3. Popup Console
```
🔍 [POPUP] allRoutes guardadas: 45 rutas
📊 Contadores actualizados - Total: 45, P2P: 12, No P2P: 33
```

---

## 📝 Notas

- **Tiempo estimado de testing:** 10-15 minutos
- **Requisitos de red:** Conexión estable a internet
- **Navegador recomendado:** Chrome/Edge versión reciente

## 🆘 Si Algo Falla

1. **Revisar documentación:**
   - `/docs/changelog/HOTFIX_V5.0.42_RUTAS_NO_VISIBLES.md`
   - `/docs/changelog/RESUMEN_COMPLETO_V5.0.42.md`

2. **Verificar archivos modificados:**
   - `src/background/main.js` (debe tener imports)
   - `src/background/routeCalculator.js` (debe tener campo broker)
   - `src/popup.js` (debe usar `data.oficial`)

3. **Restaurar desde respaldo:**
   - `src/background/main-old.js` → copiar a `main.js`

---

**Versión del documento:** 1.0  
**Última actualización:** 12 de octubre de 2025  
**Autor:** GitHub Copilot Assistant
