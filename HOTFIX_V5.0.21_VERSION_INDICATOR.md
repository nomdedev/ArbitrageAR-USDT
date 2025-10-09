# 🔄 HOTFIX V5.0.21 - INDICADOR DE VERSIÓN EN POPUP

**Fecha:** 9 de octubre de 2025  
**Versión:** 5.0.21  

## 🎯 MEJORA IMPLEMENTADA

### **Indicador de Versión Visible**
Ahora el usuario puede ver claramente:
- ✅ **Versión actual instalada** - Siempre visible en el header
- ✅ **Versión nueva disponible** - En el banner de actualización
- ✅ **Comparación visual** - Muestra versión actual → versión nueva

## ✨ CARACTERÍSTICAS AGREGADAS

### **1. Indicador de Versión en Header**
```
┌────────────────────────────────────┐
│ 💰 arbitrarARS     v5.0.20  ⚙️  ⟳  │
│ Dólar Oficial → USDT                │
└────────────────────────────────────┘
```

**Ubicación:** Esquina superior derecha del header, antes de los botones
**Estilo:** Badge semi-transparente con backdrop-filter
**Tooltip:** "Versión instalada" al pasar el mouse

### **2. Banner Mejorado con Comparación de Versiones**
```
┌──────────────────────────────────────────────────┐
│ ✨ Nueva actualización disponible                │
│    v5.0.20 → commit fb271bd                      │
│    🚀 Hotfixes V5.0.13 - V5.0.19: Mejoras...     │
│                        Ver cambios  ✕            │
└──────────────────────────────────────────────────┘
```

**Muestra:**
- Versión actual instalada (del manifest.json)
- Flecha visual →
- Nueva versión (primeros 7 caracteres del SHA del commit)
- Mensaje del commit

## 🔧 CAMBIOS TÉCNICOS

### **Archivo 1: `manifest.json`**
```json
{
  "version": "5.0.20"  // Actualizado de 5.0.0
}
```

### **Archivo 2: `popup.html`**
```html
<div class="header-buttons">
  <!-- NUEVO: Indicador de versión -->
  <span id="version-indicator" class="version-indicator" title="Versión instalada">
    v5.0.20
  </span>
  <button id="settings">⚙️</button>
  <button id="refresh">⟳</button>
</div>

<!-- Banner mejorado -->
<div class="update-text">
  <strong>Nueva actualización disponible</strong>
  <!-- NUEVO: Comparación de versiones -->
  <p class="update-version-info">
    <span class="current-version">v5.0.20</span>
    <span class="version-arrow">→</span>
    <span class="new-version" id="new-version">Nueva versión</span>
  </p>
  <p id="update-message" class="update-commit-msg">Mensaje del commit...</p>
</div>
```

### **Archivo 3: `popup.css`**

**Estilos para el indicador de versión:**
```css
.version-indicator {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75em;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: help;
}

.version-indicator:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
```

**Estilos para comparación de versiones:**
```css
.update-version-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  font-weight: 600;
}

.current-version {
  background: rgba(255, 255, 255, 0.2);
  color: #d1fae5;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.new-version {
  background: rgba(255, 255, 255, 0.3);
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}
```

### **Archivo 4: `popup.js`**

**Función mejorada:**
```javascript
function showUpdateBanner(updateInfo) {
  // Obtener versión actual del manifest
  const currentVersion = chrome.runtime.getManifest().version;
  
  // Mostrar SHA corto de la nueva versión
  if (newVersionEl && updateInfo.version) {
    const shortSha = updateInfo.version.substring(0, 7);
    newVersionEl.textContent = `commit ${shortSha}`;
  }
  
  // Actualizar mensaje (máximo 80 caracteres)
  const message = updateInfo.message || 'Nueva versión disponible';
  messageEl.textContent = message.substring(0, 80) + (message.length > 80 ? '...' : '');
}
```

## 📊 COMPARACIÓN ANTES vs DESPUÉS

### **ANTES:**
```
┌────────────────────────────────┐
│ 💰 arbitrarARS        ⚙️  ⟳    │  <- Sin versión visible
│ Dólar Oficial → USDT           │
└────────────────────────────────┘

Banner:
┌────────────────────────────────┐
│ ✨ Actualización disponible    │  <- No muestra qué versión
│    Nueva versión con mejoras   │
│                  Ver cambios ✕ │
└────────────────────────────────┘
```

### **DESPUÉS:**
```
┌────────────────────────────────┐
│ 💰 arbitrarARS  v5.0.20 ⚙️  ⟳  │  <- ✅ Versión siempre visible
│ Dólar Oficial → USDT           │
└────────────────────────────────┘

Banner:
┌────────────────────────────────┐
│ ✨ Nueva actualización          │
│    v5.0.20 → commit fb271bd    │  <- ✅ Comparación clara
│    🚀 Hotfixes V5.0.13 - ...   │
│                  Ver cambios ✕ │
└────────────────────────────────┘
```

## 💡 BENEFICIOS PARA EL USUARIO

### **Transparencia:**
- ✅ Siempre sabe qué versión tiene instalada
- ✅ Ve claramente qué versión está disponible
- ✅ Puede decidir informadamente si actualizar

### **UX Mejorada:**
- ✅ No hay sorpresas - todo es visible
- ✅ Comparación visual fácil de entender
- ✅ Información completa sin ser invasivo

### **Debugging:**
- ✅ Fácil reportar qué versión tiene problemas
- ✅ Verificar rápidamente si está actualizado
- ✅ Comparar con changelog en GitHub

## 🧪 TESTING

### **Verificación Visual:**
1. ✅ Cargar extensión
2. ✅ Abrir popup
3. ✅ Verificar "v5.0.20" en header (arriba a la derecha)
4. ✅ Tooltip "Versión instalada" al hover

### **Verificación del Banner:**
1. ✅ Hacer commit y push
2. ✅ Esperar verificación o forzar: `updateChecker.forceCheck()`
3. ✅ Abrir popup
4. ✅ Verificar banner muestra:
   - "v5.0.20" (versión actual)
   - "→" (flecha)
   - "commit abc1234" (SHA corto)
   - Mensaje del commit (máx 80 chars)

### **Estilos:**
1. ✅ Badge de versión semi-transparente con blur
2. ✅ Hover effect en badge
3. ✅ Versiones en monospace font
4. ✅ Colores distinguibles (actual vs nueva)

## 🎨 DETALLES DE DISEÑO

### **Paleta de Colores:**
- **Badge versión**: `rgba(255, 255, 255, 0.1)` con backdrop-filter blur
- **Versión actual**: `#d1fae5` (verde claro) en fondo semi-transparente
- **Versión nueva**: `#ffffff` (blanco) en fondo más opaco
- **Flecha**: `#d1fae5` (verde claro)

### **Tipografía:**
- **Badge**: 0.75em, font-weight 600, letter-spacing 0.5px
- **Versiones**: Courier New (monospace) para apariencia técnica
- **Mensaje commit**: 0.80em, opacity 0.9

## 📋 ARCHIVOS MODIFICADOS

1. ✅ `manifest.json` - Versión actualizada a 5.0.20
2. ✅ `src/popup.html` - Indicador de versión + banner mejorado
3. ✅ `src/popup.css` - Estilos para indicador y comparación
4. ✅ `src/popup.js` - Lógica para mostrar versiones

---

**Versión:** V5.0.21  
**Fecha:** 9 de octubre de 2025  
**Estado:** ✅ **COMPLETADO**  
**Impacto:** 🎯 **Mejora la transparencia y UX**  
**Prioridad:** 📝 **MEDIA** (mejora de usabilidad)
