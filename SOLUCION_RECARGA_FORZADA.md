# ⚡ SOLUCIÓN: Recarga Forzada de la Extensión

## 🚨 PROBLEMA: Service Worker No Carga

Si la consola del service worker está **completamente vacía**, sigue estos pasos:

### PASO 1: Desinstalar Completamente la Extensión

1. Ve a `chrome://extensions/`
2. Busca "ArbitrARS - Detector de Arbitraje"
3. Click en **"Quitar"** (Remove)
4. Confirma la eliminación

### PASO 2: Cerrar y Reabrir Chrome

1. **Cierra COMPLETAMENTE Chrome** (todas las ventanas)
2. Espera 5 segundos
3. Abre Chrome nuevamente

### PASO 3: Instalar la Extensión de Nuevo

1. Ve a `chrome://extensions/`
2. Activa **"Modo de desarrollador"** (esquina superior derecha)
3. Click en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta:
   ```
   d:\martin\Proyectos\ArbitrageAR-Oficial-USDT-Broker
   ```
5. La extensión debería aparecer

### PASO 4: Verificar Consola del Service Worker

1. En `chrome://extensions/`
2. Busca "ArbitrARS"
3. **IMPORTANTE:** Debería aparecer un link azul que dice **"service worker"**
4. Click en ese link
5. Se abre DevTools

**DEBERÍAS VER:**

```
🔧 [BACKGROUND-SIMPLE] main-simple.js cargando en: 2025-10-12T...
🔧 [BACKGROUND-SIMPLE] Registrando listener...
✅ [BACKGROUND-SIMPLE] Listener registrado
🚀 [BACKGROUND-SIMPLE] Iniciando primera actualización...
🔄 Actualizando datos...
📊 Datos obtenidos: {oficial: true, usdt: true, usdtUsd: true}
✅ Calculadas XX rutas
✅ Datos actualizados: XX rutas
✅ [BACKGROUND-SIMPLE] Primera actualización completada
✅ [BACKGROUND-SIMPLE] Background completamente inicializado
```

### PASO 5: Abrir el Popup

1. Click en el icono de la extensión
2. El popup debería mostrar rutas inmediatamente

---

## 🔍 SI AÚN NO FUNCIONA

### Verificar que el manifest.json está correcto:

```powershell
Get-Content "d:\martin\Proyectos\ArbitrageAR-Oficial-USDT-Broker\manifest.json" | Select-String -Pattern "service_worker" -Context 2
```

**Debe mostrar:**
```
"background": {
  "service_worker": "src/background/main-simple.js"
}
```

**NO debe tener:**
- `"type": "module"`

### Si el link "service worker" NO aparece:

Significa que hay un error de carga. Busca:
- **"Errors"** (botón rojo en la tarjeta de la extensión)
- Click para ver el error exacto

### Posibles errores y soluciones:

| Error | Solución |
|-------|----------|
| "Service worker registration failed" | Verificar manifest.json |
| "Failed to load resource" | Verificar que main-simple.js existe |
| "Unexpected token" | Error de sintaxis en main-simple.js |
| Sin mensaje de error pero no carga | Reiniciar Chrome completamente |

---

## 🎯 PRÓXIMO PASO

**Después de seguir estos pasos, reporta:**

1. ¿Apareció el link "service worker"? SÍ / NO
2. Si apareció, ¿qué logs ves?
3. Si no apareció, ¿hay un botón "Errors"?

Con esta información podré darte la solución exacta.
