# ArbitrageAR Oficial a USDT Broker v2.0 🚀

Extensión moderna para navegadores Chromium (Chrome, Brave, Edge) que monitorea oportunidades de arbitraje entre el Dólar Oficial y USDT en brokers argentinos, con **UI/UX mejorada** y **guía paso a paso interactiva**.

## ✨ Características Principales (v2.0)

### 🎯 **Interfaz Renovada con 3 Pestañas:**
1. **Oportunidades** - Visualización de arbitrajes con tarjetas interactivas
2. **Guía Paso a Paso** - Instrucciones detalladas para cada arbitraje seleccionado
3. **Bancos** - Lista de bancos donde comprar dólares oficiales

### 📊 **Nuevo Sistema de Tarjetas Interactivas:**
- Diseño moderno con gradientes y sombras
- Click en cualquier tarjeta para ver guía detallada
- Indicadores visuales de alta rentabilidad (>5%)
- Información clara: Precio oficial, USDT compra/venta, ganancia

### 📚 **Guía Paso a Paso Detallada:**
- **Paso 1:** Dónde y cómo comprar dólares oficiales
- **Paso 2:** Cómo convertir USD a USDT en el exchange
- **Paso 3:** Vender USDT por pesos argentinos
- **Paso 4:** Retirar ganancias a cuenta bancaria
- **Calculadora incluida:** Ejemplo con inversión de $100,000 ARS
- **Advertencias importantes:** Comisiones, tiempos, límites

### 🏦 **Integración con Bancos:**
- Lista actualizada de bancos que venden dólar oficial
- Precios de compra y venta por banco
- Actualización automática cada 30 minutos
- Web scraping inteligente desde DolarAPI

### 🎨 **Diseño Profesional:**
- Gradientes modernos (púrpura/azul)
- Animaciones suaves y transiciones
- Responsive y optimizado
- Scrollbar personalizado
- Indicadores de carga elegantes

## � Mejoras Técnicas (v2.0)

### Correcciones Críticas:
1. ✅ **Variables correctamente declaradas** con `const`/`let`
2. ✅ **APIs funcionales y verificadas** (DolarAPI + CriptoYA)
3. ✅ **Lógica de arbitraje precisa** considerando precio oficial
4. ✅ **Validación robusta de datos** con optional chaining
5. ✅ **Timeout de 10 segundos** en todas las peticiones
6. ✅ **Manejo de errores completo** con mensajes claros
7. ✅ **Estructura de CriptoYA adaptada** al formato real

### Nuevas Características:
- 🌐 **Web scraping de bancos** desde múltiples endpoints
- 📱 **Sistema de pestañas** para mejor organización
- 🖱️ **Interactividad mejorada** con click en tarjetas
- 🧮 **Calculadora automática** de ganancias con ejemplos
- 🎯 **Selección visual** de arbitraje activo
- ⏰ **Timestamps diferenciados** (arbitrajes cada 1 min, bancos cada 30 min)
- 🔔 **Notificaciones inteligentes** solo para oportunidades >5%
- 💾 **Caché de datos** para mejor performance

## 🚀 Instalación

1. **Descarga** o clona este repositorio
2. Abre tu navegador Chromium: 
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`
3. **Activa** el "Modo de desarrollador" (toggle superior derecho)
4. Click en **"Cargar extensión sin empaquetar"**
5. Selecciona la carpeta `ArbitrageAR-Oficial-USDT-Broker`
6. ¡Listo! El ícono aparecerá en tu barra de extensiones

## � Cómo Usar

### 1️⃣ Ver Oportunidades:
- Abre la extensión (click en el ícono)
- En la pestaña **"Oportunidades"** verás las mejores opciones
- Las oportunidades >5% están destacadas en verde

### 2️⃣ Obtener Guía Detallada:
- **Click en cualquier tarjeta** de oportunidad
- Automáticamente se abre la pestaña **"Guía Paso a Paso"**
- Sigue las instrucciones numeradas
- Revisa el ejemplo de cálculo con $100,000 ARS

### 3️⃣ Consultar Bancos:
- Ve a la pestaña **"Bancos"**
- Encuentra dónde comprar dólares oficiales
- Compara precios entre diferentes entidades

### 4️⃣ Actualizar Datos:
- Click en el botón **⟳** (superior derecho)
- Actualiza arbitrajes y bancos manualmente
- También se actualiza automáticamente cada minuto

## 📊 Cómo Funciona el Arbitraje

### Flujo Completo:
```
1. Compras USD Oficial en banco → $1,050 ARS/USD
2. Depositas USD en exchange (Ej: Binance)
3. Compras USDT con esos USD (relación 1:1 aprox)
4. Vendes USDT por ARS → $1,150 ARS/USDT
5. ✅ Ganancia: $100 por cada USD = 9.52%
```

### Ejemplo Real con $100,000 ARS:
```
Inversión inicial:    $100,000 ARS
Compras USD:          95.24 USD (a $1,050)
Conviertes a USDT:    95.24 USDT
Vendes por ARS:       $109,526 ARS (a $1,150)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ganancia neta:        $9,526 ARS (9.52%)
```

## 🔌 APIs Utilizadas

### Cotizaciones:
- **DolarAPI** → Precio oficial del dólar
  - Endpoint: `https://dolarapi.com/v1/dolares/oficial`
  - Endpoint bancos: `https://dolarapi.com/v1/bancos/{banco}`
- **CriptoYA** → Precios USDT en exchanges argentinos
  - Endpoint: `https://criptoya.com/api/usdt/ars/1`
  - ⚠️ Solo exchanges, NO P2P

## ⚙️ Configuración

### Permisos Necesarios:
- `storage` → Guardar datos localmente
- `notifications` → Alertas de oportunidades
- `alarms` → Actualización automática
- `host_permissions` → Acceso a APIs (DolarAPI, CriptoYA)

### Frecuencia de Actualización:
- **Arbitrajes:** Cada 1 minuto
- **Bancos:** Cada 30 minutos
- **Rate Limiting:** 600ms entre peticiones (110 req/min)

## 📝 Consideraciones Importantes

### ⚠️ Antes de Operar:
- ✓ Verifica **comisiones del exchange** (pueden reducir ganancia)
- ✓ Los **precios fluctúan** constantemente
- ✓ Respeta el **límite de USD 200 mensuales** por persona
- ✓ Considera **tiempos de transferencia** bancaria (24-48hs)
- ✓ Algunos exchanges requieren **verificación de identidad**
- ✓ **NO uses P2P** para este arbitraje, solo exchange oficial

### 🚫 Limitaciones:
- Cupo mensual de USD 200 por persona (dólar oficial)
- Comisiones de exchanges varían (0.1% - 1%)
- Tiempos de acreditación bancaria
- Horarios de atención de bancos

## 🛠️ Desarrollo

### Estructura del Proyecto:
```
ArbitrageAR-Oficial-USDT-Broker/
├── manifest.json          # Config extensión v3
├── background.js          # Service worker + APIs
├── popup.html             # UI con 3 tabs
├── popup.js               # Lógica interactiva
├── popup.css              # Estilos modernos
├── icons/                 # Iconos 16/32/48/128px
└── README.md              # Esta documentación
```

### Tecnologías:
- **Manifest V3** (última versión de Chrome Extensions)
- **JavaScript ES6+** (async/await, optional chaining)
- **CSS3** (gradients, animations, flexbox)
- **Chrome APIs** (storage, notifications, alarms)

### Para Contribuir:
```bash
git clone https://github.com/tuusuario/ArbitrageAR.git
cd ArbitrageAR
# Haz tus cambios
git checkout -b feature/mi-mejora
git commit -m "Agrega mi mejora"
git push origin feature/mi-mejora
# Abre Pull Request
```

## 🐛 Troubleshooting

### La extensión no carga datos:
- Verifica conexión a internet
- Revisa la consola: `chrome://extensions` → Detalles → Inspeccionar service worker
- Las APIs pueden estar caídas temporalmente

### No aparecen bancos:
- Espera 30 segundos tras la primera carga
- Click en actualizar (⟳)
- Algunos endpoints de bancos pueden no estar disponibles

### Los precios parecen incorrectos:
- Verifica el timestamp de última actualización
- Los precios son referenciales, siempre verificar en la plataforma
- Algunos exchanges pueden tener spreads altos

## 📄 Licencia

MIT License - Libre para usar, modificar y distribuir.

## ⚠️ Disclaimer Legal

Esta extensión es **exclusivamente para fines informativos y educativos**. No constituye asesoramiento financiero. Los desarrolladores no se responsabilizan por pérdidas financieras derivadas del uso de esta herramienta. Siempre opera bajo tu propio riesgo y verifica todos los datos antes de realizar transacciones.

---

**Versión**: 2.0.0  
**Última actualización**: 2 de octubre de 2025  
**Desarrollado con** ❤️ **para la comunidad cripto argentina**
