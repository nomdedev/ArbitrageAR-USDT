# 🔔 Sistema de Notificaciones Personalizable - v3.1.0

## 📅 Fecha: 2 de octubre de 2025

## ✨ Nueva Característica: Control Total de Notificaciones

La versión **3.1.0** introduce un **sistema completo de configuración de notificaciones** que permite al usuario personalizar completamente cómo y cuándo recibir alertas de oportunidades de arbitraje.

---

## 🎯 Características Principales

### 1. ⚙️ Página de Configuración Dedicada

Una interfaz completa y moderna accesible desde:
- **Botón ⚙️** en el popup de la extensión
- **Click derecho** en el ícono de la extensión → "Opciones"
- **Menú de Chrome** → Extensiones → ArbitrageAR → Opciones

### 2. 🔔 Control de Notificaciones

#### Activar/Desactivar Completamente
```
✅ Notificaciones activadas → Recibe alertas
❌ Notificaciones desactivadas → No molesta NUNCA
```

### 3. 📊 Tipos de Alertas Configurables

Elige el nivel de oportunidades que te interesan:

| Tipo | Umbral | Descripción |
|------|--------|-------------|
| **Todas** | ≥1.5% | Cualquier arbitraje rentable |
| **Moderadas** | ≥5% | Solo ganancias significativas |
| **Altas** | ≥10% | Mejores oportunidades |
| **Excepcionales** | ≥15% | Solo arbitrajes extraordinarios |
| **Personalizado** | Custom | Define tu propio umbral (1-20%) |

**Ejemplo:**
```
Configuración: "Moderadas" (≥5%)
Resultado: Solo recibirás notificaciones de arbitrajes con más del 5% de ganancia neta
```

### 4. ⏰ Control de Frecuencia

Evita notificaciones repetitivas:

- **Sin límite:** Notifica siempre que haya oportunidades
- **Cada 5 minutos:** Máximo 1 notificación cada 5 min
- **Cada 15 minutos:** Máximo 1 cada 15 min (recomendado)
- **Cada 30 minutos:** Máximo 1 cada 30 min
- **Cada hora:** Máximo 1 cada hora
- **Una vez por sesión:** Solo la primera oportunidad

**Ejemplo:**
```
Configuración: "Cada 15 minutos"
09:00 → Notificación de Buenbit 38%
09:05 → Nueva oportunidad 40% → ❌ NO notifica (muy pronto)
09:16 → Nueva oportunidad 42% → ✅ Notifica (pasaron 16 min)
```

### 5. 🏦 Exchanges Preferidos

Filtra notificaciones por exchanges específicos:

```
☑️ Buenbit
☑️ Ripio
☐ SatoshiTango
☑️ Letsbit
☐ Decrypto
...
```

**Resultado:** Solo recibirás notificaciones de Buenbit, Ripio y Letsbit.

**Si no seleccionas ninguno:** Recibirás de TODOS los exchanges.

### 6. 🕐 Modo Silencioso (Horario)

Configura horarios en los que NO quieres ser molestado:

```
Modo silencioso: ✅ Activado
Desde: 22:00
Hasta: 08:00
```

**Resultado:**
- Entre 22:00 y 08:00 → ❌ NO notifica
- Resto del día → ✅ Notifica normalmente

**Soporta horarios que cruzan medianoche** (ej: 22:00 - 08:00)

### 7. 🔊 Sonido de Notificación

```
✅ Activado → Notificaciones con sonido
❌ Desactivado → Notificaciones silenciosas (solo visual)
```

### 8. 🧪 Test de Notificación

Botón para **probar tu configuración** antes de guardar:

```
Click en "🔔 Enviar notificación de prueba"
→ Recibirás una notificación de ejemplo
→ Verifica que funciona como esperas
```

---

## 🎨 Interfaz de Notificaciones

### Tipos de Notificaciones Según Ganancia

Las notificaciones tienen diferentes **íconos y prioridades**:

| Ganancia | Ícono | Prioridad | Comportamiento |
|----------|-------|-----------|----------------|
| ≥15% | 🚀 Excepcional | Alta | Requiere interacción |
| ≥10% | 💎 Alta | Alta | Persistente |
| ≥5% | 💰 Moderada | Normal | Normal |
| <5% | 📊 Normal | Normal | Normal |

### Contenido de la Notificación

```
🚀 Oportunidad de Arbitraje: Buenbit
Ganancia: 37.91% neto
USD→USDT: 1.049
USDT: $1,529.66 ARS

[👀 Ver Detalles] [⚙️ Configuración]
```

### Botones de Acción

1. **👀 Ver Detalles:** Abre el popup con la oportunidad
2. **⚙️ Configuración:** Abre la página de opciones

**Click en la notificación:** Abre directamente el popup

---

## 🔧 Implementación Técnica

### Archivo de Configuración: `options.html`

Página dedicada con 6 secciones:
1. Activar/desactivar notificaciones
2. Tipos de alertas
3. Frecuencia
4. Exchanges preferidos
5. Horario silencioso
6. Test de notificación

### Lógica: `options.js`

**Características:**
- Persistencia en `chrome.storage.local`
- Validación de configuración
- Carga/guardado automático
- Restauración a valores por defecto

### Sistema de Notificaciones: `background.js`

**Función `shouldSendNotification(settings, arbitrage)`**

Verifica 6 condiciones antes de notificar:
1. ✅ ¿Notificaciones habilitadas?
2. ⏰ ¿Está en horario silencioso?
3. 🕐 ¿Pasó el tiempo mínimo desde última notificación?
4. 📊 ¿Supera el umbral configurado?
5. 🏦 ¿Es un exchange preferido?
6. 🔁 ¿Ya notificamos este arbitraje recientemente?

**Solo si TODAS son verdaderas → Envía notificación**

### Persistencia de Configuración

```javascript
// Estructura en storage
{
  notificationSettings: {
    notificationsEnabled: true,
    alertType: 'moderate',
    customThreshold: 5,
    notificationFrequency: '15min',
    soundEnabled: true,
    preferredExchanges: ['buenbit', 'ripio'],
    quietHoursEnabled: true,
    quietStart: '22:00',
    quietEnd: '08:00'
  }
}
```

---

## 📊 Flujo de Notificaciones

```
1. Extension actualiza datos (cada 1 min)
2. Encuentra arbitraje de 38% en Buenbit
3. Llama a checkAndNotify(arbitrages)
4. checkAndNotify obtiene configuración del usuario
5. shouldSendNotification verifica las 6 condiciones:
   ✅ Notificaciones habilitadas: true
   ✅ No está en horario silencioso: 14:30 (fuera de 22:00-08:00)
   ✅ Pasaron >15 min desde última notificación: true
   ✅ 38% >= umbral (5%): true
   ✅ Buenbit está en exchanges preferidos: true
   ✅ No se notificó este arbitraje recientemente: true
6. sendNotification envía la alerta
7. Usuario ve: "🚀 Oportunidad: Buenbit - 37.91%"
```

---

## 🎯 Casos de Uso

### Caso 1: Usuario Conservador

**Configuración:**
```
Notificaciones: ✅ Activadas
Tipo: Excepcionales (≥15%)
Frecuencia: Cada hora
Exchanges: Buenbit, Ripio
Horario silencioso: 22:00 - 08:00
Sonido: ✅ Activado
```

**Resultado:** Solo recibe notificaciones de oportunidades >15% en Buenbit/Ripio, máximo 1 por hora, y solo durante el día.

### Caso 2: Usuario Activo

**Configuración:**
```
Notificaciones: ✅ Activadas
Tipo: Todas (≥1.5%)
Frecuencia: Sin límite
Exchanges: (todos)
Horario silencioso: ❌ Desactivado
Sonido: ✅ Activado
```

**Resultado:** Recibe TODAS las oportunidades rentables de CUALQUIER exchange, sin límite de frecuencia.

### Caso 3: Usuario que NO quiere ser molestado

**Configuración:**
```
Notificaciones: ❌ Desactivadas
```

**Resultado:** NUNCA recibe notificaciones. Debe abrir la extensión manualmente para ver oportunidades.

### Caso 4: Usuario Nocturno

**Configuración:**
```
Notificaciones: ✅ Activadas
Tipo: Moderadas (≥5%)
Frecuencia: Cada 15 minutos
Exchanges: (todos)
Horario silencioso: ✅ 08:00 - 22:00
Sonido: ✅ Activado
```

**Resultado:** Solo recibe notificaciones entre 22:00 y 08:00 (horario nocturno).

---

## 🆕 Mejoras en la UI

### Botón de Configuración en Popup

**Antes:**
```
[💰 ArbitrageAR]                    [⟳]
```

**Ahora:**
```
[💰 ArbitrageAR]              [⚙️] [⟳]
```

Click en **⚙️** → Abre página de opciones

### Estilos Modernos

- **Gradientes:** Purple/blue theme
- **Switches animados:** Toggle suave
- **Grids responsivos:** Adaptable a móvil
- **Hover effects:** Feedback visual
- **Icons:** Emojis para claridad

---

## 📝 Valores por Defecto

Si el usuario no configura nada, se usan estos valores:

```javascript
{
  notificationsEnabled: true,        // Notificaciones activadas
  alertType: 'all',                  // Todas las oportunidades
  customThreshold: 5,                // 5% para modo custom
  notificationFrequency: '15min',    // Máximo cada 15 min
  soundEnabled: true,                // Con sonido
  preferredExchanges: [],            // Todos los exchanges
  quietHoursEnabled: false,          // Sin horario silencioso
  quietStart: '22:00',              
  quietEnd: '08:00'
}
```

---

## 🔄 Actualización en Tiempo Real

Cuando cambias la configuración:
```
1. Usuario modifica configuración
2. Click en "💾 Guardar Configuración"
3. options.js guarda en storage
4. Envía mensaje al background script
5. background.js recarga configuración
6. Próxima notificación usa nueva config
```

**No necesitas reiniciar la extensión.**

---

## 🚀 Instalación y Uso

### Primera Vez

1. Instala la extensión
2. Click en el ícono de la extensión
3. Click en el botón **⚙️** (arriba derecha)
4. Configura tus preferencias
5. Click en **🔔 Enviar notificación de prueba**
6. Verifica que funciona
7. Click en **💾 Guardar Configuración**
8. ¡Listo!

### Cambiar Configuración

1. Click en **⚙️** en el popup o click derecho → Opciones
2. Modifica lo que quieras
3. Usa **🔔 Enviar notificación de prueba** para verificar
4. Click en **💾 Guardar Configuración**

### Restaurar Defaults

1. Abre configuración
2. Click en **🔄 Restaurar Valores por Defecto**
3. Confirma
4. ¡Configuración reseteada!

---

## ⚠️ Consideraciones

### Permisos Requeridos

```json
{
  "permissions": [
    "notifications"  // NUEVO: Para enviar notificaciones
  ]
}
```

Chrome puede pedir permiso la primera vez.

### Limitaciones

1. **Notificaciones de Chrome:** Dependen del sistema operativo
2. **Sonido:** Chrome maneja el sonido automáticamente (no personalizable)
3. **Persistencia:** Las notificaciones desaparecen según config del sistema
4. **Background:** Solo notifica si la extensión está activa

### Privacidad

- ✅ **Toda la configuración se guarda localmente**
- ✅ **No se envía información a servidores externos**
- ✅ **Las notificaciones son generadas por la extensión**

---

## 🎉 Resumen

### Lo que Puedes Controlar

1. ✅ **SI** quieres notificaciones (on/off)
2. ✅ **CUÁNDO** recibirlas (umbral %)
3. ✅ **QUÉ TAN SEGUIDO** (frecuencia)
4. ✅ **DE QUIÉN** (exchanges preferidos)
5. ✅ **EN QUÉ HORARIO** (modo silencioso)
6. ✅ **CON O SIN SONIDO** (toggle)

### Lo que NO Cambia

- ✅ Actualizaciones siguen siendo cada 1 minuto
- ✅ Puedes seguir viendo oportunidades en el popup
- ✅ La lógica de arbitraje es la misma
- ✅ Los datos son los mismos

---

## 📦 Archivos Nuevos

```
options.html     # Página de configuración (242 líneas)
options.css      # Estilos de la página (431 líneas)
options.js       # Lógica de configuración (189 líneas)
```

## 📝 Archivos Modificados

```
manifest.json    # +1 permiso, +1 opción
background.js    # +200 líneas (sistema de notificaciones)
popup.html       # +4 líneas (botón configuración)
popup.css        # +30 líneas (estilos botón)
popup.js         # +5 líneas (handler botón)
```

---

## 🔗 Referencias

- **Página de opciones:** `chrome-extension://[ID]/options.html`
- **Storage key:** `notificationSettings`
- **API usada:** `chrome.notifications`, `chrome.storage.local`

---

**🎊 v3.1.0 - Tu extensión, tus reglas**

*"Now you're in control"*
