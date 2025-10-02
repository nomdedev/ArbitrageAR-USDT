# 🚀 Instalación Rápida - ArbitrageAR v2.0

## Instalación en 5 Pasos

### 1️⃣ Descargar el Proyecto
```bash
# Opción A: Clonar desde Git
git clone https://github.com/tuusuario/ArbitrageAR.git
cd ArbitrageAR

# Opción B: Descargar ZIP
# Descarga y descomprime en tu carpeta de proyectos
```

### 2️⃣ Abrir Extensiones del Navegador

**Para Chrome:**
1. Abre `chrome://extensions/`
2. O: Menú (⋮) → Extensiones → Administrar extensiones

**Para Brave:**
1. Abre `brave://extensions/`
2. O: Menú (☰) → Extensiones

**Para Edge:**
1. Abre `edge://extensions/`
2. O: Menú (⋯) → Extensiones

### 3️⃣ Activar Modo Desarrollador
```
┌─────────────────────────────────────┐
│ Extensiones                         │
│ ──────────────────────────────────  │
│ [x] Modo de desarrollador     ← ⬅️  │
└─────────────────────────────────────┘
```
**Activa el toggle en la esquina superior derecha**

### 4️⃣ Cargar la Extensión
```
┌─────────────────────────────────────┐
│ [📁 Cargar extensión sin empaquetar]│ ← Click aquí
│ [📂 Empaquetar extensión]           │
│ [🔄 Actualizar]                     │
└─────────────────────────────────────┘
```
1. Click en **"Cargar extensión sin empaquetar"**
2. Navega a la carpeta `ArbitrageAR-Oficial-USDT-Broker`
3. Selecciona la carpeta y da Aceptar

### 5️⃣ ¡Listo! 🎉
```
┌─────────────────────────────────────┐
│ ArbitrageAR Oficial a USDT Broker  │
│ v2.0.0                              │
│ [x] Habilitado                      │
│ [⚙️] Detalles  [🗑️] Quitar         │
└─────────────────────────────────────┘
```
**El ícono aparecerá en tu barra de herramientas**

---

## ✅ Verificación de Instalación

### Paso 1: Revisar Permisos
La extensión debe tener estos permisos:
- ✓ Almacenamiento
- ✓ Notificaciones
- ✓ Alarmas
- ✓ Acceso a: dolarapi.com, criptoya.com

### Paso 2: Probar la Extensión
1. **Click en el ícono** de la extensión (púrpura)
2. Deberías ver el popup con:
   - Header con gradiente púrpura/azul
   - 3 pestañas: Oportunidades, Guía, Bancos
   - Botón de actualizar (⟳)
3. **Espera 5-10 segundos** para la primera carga

### Paso 3: Verificar Datos
```
✅ Pestaña "Oportunidades":
   → Debe mostrar tarjetas de arbitraje
   → Con precios y porcentajes
   
✅ Pestaña "Bancos":
   → Debe cargar lista de bancos
   → Con precios compra/venta
   
✅ Timestamp al final:
   → Debe mostrar hora actual
```

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "Este directorio no es válido"
**Solución:** 
- Asegúrate de seleccionar la carpeta que contiene `manifest.json`
- La ruta correcta es: `.../ArbitrageAR-Oficial-USDT-Broker/`

### ❌ Error: "Manifest file is missing or unreadable"
**Solución:**
```bash
# Verifica que exista el archivo
ls -la manifest.json

# O en Windows:
dir manifest.json
```

### ❌ No carga datos
**Solución:**
1. Abre DevTools: Click derecho en el popup → Inspeccionar
2. Ve a la pestaña Console
3. Busca errores en rojo
4. Si hay errores de red, verifica tu conexión

### ❌ No aparece el ícono
**Solución:**
1. Revisa que esté habilitada en `chrome://extensions/`
2. Click en el ícono de puzzle (🧩) de extensiones
3. Fija ArbitrageAR con el pin 📌

---

## 🔧 Configuración Adicional

### Habilitar Notificaciones
```
Chrome → Configuración → Privacidad y seguridad 
→ Configuración de sitios → Notificaciones
→ Agrega chrome-extension://[ID_EXTENSION]
```

### Fijar en Barra de Herramientas
1. Click en el ícono de puzzle (🧩)
2. Busca "ArbitrageAR"
3. Click en el pin 📌

### Modo Desarrollador Persistente
- Algunos navegadores desactivan extensiones no verificadas
- Mantén "Modo desarrollador" siempre activo
- O firma la extensión para producción

---

## 🔄 Actualizar a Nueva Versión

### Método 1: Git Pull
```bash
cd ArbitrageAR-Oficial-USDT-Broker
git pull origin main
```
Luego click en **🔄 Actualizar** en `chrome://extensions/`

### Método 2: Reemplazar Archivos
1. Descarga la nueva versión
2. Reemplaza los archivos en la carpeta
3. Click en **🔄 Actualizar** en `chrome://extensions/`

### Método 3: Reinstalar
1. Elimina la extensión actual
2. Vuelve a cargar la carpeta actualizada
3. (Se perderán datos guardados)

---

## 📊 Primeros Pasos

### 1. Ver Oportunidades
```
1. Abre la extensión
2. Pestaña "Oportunidades" → Ver arbitrajes
3. Las mejores oportunidades estarán arriba
```

### 2. Entender una Oportunidad
```
┌──────────────────────────────┐
│ 🏦 Binance    [+15.24%] 🟢  │ ← Exchange y ganancia
│ ───────────────────────────  │
│ 💵 D. Oficial   $1,050.00   │ ← Precio banco
│ 💰 USDT Compra  $1,045.50   │ ← Precio exchange
│ 💸 USDT Venta   $1,210.00   │ ← Precio venta
└──────────────────────────────┘
```

### 3. Obtener Guía
```
1. Click en la tarjeta que te interese
2. Se abrirá automáticamente "Guía Paso a Paso"
3. Lee y sigue los 4 pasos
4. Revisa el ejemplo de cálculo
```

### 4. Consultar Bancos
```
1. Ve a pestaña "Bancos"
2. Busca tu banco
3. Verifica precio de venta del dólar
4. Asegúrate de tener cupo (USD 200/mes)
```

---

## 📚 Recursos Adicionales

- **README.md** - Documentación completa
- **GUIA_USO.md** - Guía detallada de uso
- **CHANGELOG.md** - Historial de versiones
- **GitHub Issues** - Reportar errores
- **GitHub Discussions** - Preguntas y sugerencias

---

## 🎯 Siguiente Paso

**¡Estás listo para comenzar!** 🚀

1. ✅ Extensión instalada
2. ✅ Permisos configurados
3. ✅ Datos cargando
4. ⏭️ **Siguiente:** Lee la [Guía de Uso](GUIA_USO.md)

---

## 💬 ¿Necesitas Ayuda?

- 🐛 **Bug?** → Abre un Issue en GitHub
- ❓ **Pregunta?** → GitHub Discussions
- 💡 **Sugerencia?** → Pull Request

**¡Buena suerte con tus arbitrajes!** 💰✨
