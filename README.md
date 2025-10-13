# ArbitrageAR - Detector de Arbitraje Dólar Oficial → USDT 🚀

[![Version](https://img.shields.io/badge/version-5.0.0-blue.svg)](https://github.com/nomdedev/ArbitrageAR-USDT)
[![Tests](https://img.shields.io/badge/tests-passing-green.svg)](tests/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Extensión profesional para navegadores Chromium que detecta oportunidades de arbitraje entre el Dólar Oficial argentino y USDT en exchanges locales. Sistema completamente probado y validado para uso en producción.

## ✨ Características Principales

- 🎯 **Detección Inteligente**: Algoritmos avanzados para identificar oportunidades rentables
- ⚙️ **Configuración Avanzada**: 4 pestañas de configuración personalizable
- 🔔 **Notificaciones Smart**: Alertas configurables por umbral y exchange
- 📊 **Múltiples Exchanges**: Soporte para Binance, Buenbit, Lemon Cash y más
- 🏦 **Datos Bancarios**: Integración con múltiples bancos para precios precisos
- 📈 **Simulador**: Herramientas avanzadas para calcular ganancias potenciales

## 📁 Estructura del Proyecto

```
ArbitrageAR-USDT/
├── src/                    # Código fuente principal
│   ├── background/         # Service Worker y lógica backend
│   │   ├── main.js        # Service worker principal
│   │   ├── dataFetcher.js # APIs externas (CriptoYa, DolarAPI)
│   │   ├── routeCalculator.js # Cálculos de arbitraje
│   │   └── notifications.js   # Sistema de notificaciones
│   ├── popup/             # Interfaz del popup
│   │   ├── popup.html/js/css # UI principal
│   └── options/           # Página de configuración
│       ├── options.html/js/css # Configuración avanzada
├── tests/                  # Suite completa de testing
│   ├── run-all-tests.js   # Ejecutor de tests
│   ├── test-complete-flow.js # Tests end-to-end
│   ├── test-communication.js # Tests de comunicación
│   └── test-popup-ui.js   # Tests de interfaz
├── docs/                   # Documentación completa
│   ├── changelog/         # Historial de versiones
│   ├── DEPLOYMENT_GUIDE.md # Guía de despliegue
│   └── *.md               # Documentación específica
├── icons/                  # Iconos de la extensión
├── manifest.json          # Configuración de Chrome Extension
├── package.json           # Dependencias y scripts
├── DEPLOYMENT_GUIDE.md    # 🚀 Guía de producción
└── README.md             # Este archivo
```
├── scripts/                # Scripts de automatización
├── icons/                  # Iconos de la extensión
├── manifest.json          # Configuración de la extensión
└── README.md              # Este archivo
```

## 🚀 Instalación

### Desde Chrome Web Store (Próximamente)
1. Visita la [Chrome Web Store](https://chrome.google.com/webstore)
2. Busca "ArbitrageAR"
3. Haz clic en "Agregar a Chrome"

### Instalación Manual (Desarrollo)
1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/nomdedev/ArbitrageAR-USDT.git
   cd ArbitrageAR-USDT
   ```

2. **Instala dependencias:**
   ```bash
   npm install
   ```

3. **Carga la extensión en Chrome:**
   - Abre `chrome://extensions/`
   - Activa "Modo desarrollador"
   - Haz clic en "Cargar descomprimida"
   - Selecciona la carpeta del proyecto

## 📖 Uso

### Configuración Inicial
1. Haz clic en el ícono de la extensión en la barra de herramientas
2. Ve a "Configuración" (⚙️)
3. Configura:
   - **Umbral de ganancia mínimo** (recomendado: 2-5%)
   - **Monto de inversión** (ARS)
   - **Exchanges preferidos**
   - **Notificaciones activadas**

### Monitoreo en Tiempo Real
- La extensión monitorea automáticamente cada 30 segundos
- Recibirás notificaciones cuando se detecten oportunidades
- El popup muestra las mejores oportunidades actuales

## 🛠️ Desarrollo

### Pruebas
```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm run test:popup
npm run test:communication
npm run test:flow
```

### Build y Empaquetado
```bash
# Build para producción
npm run build

# Crear paquete .zip para Chrome Web Store
npm run package
```

### Arquitectura
- **Service Worker**: Maneja la lógica backend y sincronización
- **Popup**: Interfaz de usuario principal
- **Options Page**: Configuración avanzada
- **Background Scripts**: Comunicación con APIs externas

## 📊 APIs Utilizadas

- **CriptoYa API**: Precios de exchanges locales
- **DolarAPI**: Cotizaciones del dólar oficial
- **Chrome Storage API**: Persistencia de configuración
- **Chrome Notifications API**: Alertas del sistema

## 🔒 Seguridad

- ✅ **Sin almacenamiento de datos sensibles**
- ✅ **Comunicación HTTPS obligatoria**
- ✅ **CSP (Content Security Policy) configurado**
- ✅ **Validación de inputs**
- ✅ **Rate limiting en APIs**

## 📈 Rendimiento

- **Tiempo de respuesta**: < 2 segundos
- **Uso de memoria**: < 50MB
- **CPU**: Mínimo impacto
- **Actualizaciones**: Cada 30 segundos (configurable)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Comunidad de desarrolladores argentinos
- APIs públicas de cotizaciones
- Contribuidores del proyecto

## 📞 Soporte

- 📧 **Email**: soporte@arbitragear.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/nomdedev/ArbitrageAR-USDT/issues)
- 📖 **Documentación**: [docs/](docs/)

---

**⚠️ Descargo de responsabilidad**: Esta herramienta es para fines informativos. El trading de criptomonedas implica riesgos financieros. Usa con responsabilidad.

## 🏗️ Arquitectura SOLID

La extensión sigue los principios SOLID con una arquitectura modular:

- **DataService**: Gestión de llamadas a APIs externas (DolarAPI, CriptoYA)
- **StorageManager**: Abstracción del almacenamiento Chrome
- **ArbitrageCalculator**: Lógica pura de cálculos de arbitraje
- **NotificationManager**: Sistema de notificaciones inteligentes
- **ScrapingService**: Web scraping de datos bancarios

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/nomdedev/ArbitrageAR-USDT.git
cd ArbitrageAR-USDT
```

2. Carga la extensión en Chrome:
   - Ve a `chrome://extensions/`
   - Activa "Modo desarrollador"
   - Haz clic en "Cargar descomprimida"
   - Selecciona la carpeta del proyecto

## 🧪 Testing

Ejecuta los tests para verificar que todo funciona correctamente:

```bash
cd tests
node --experimental-modules test-refactored-services.js
```

## 📚 Documentación

Toda la documentación detallada se encuentra en la carpeta `docs/`:
- **[Índice de Documentación](docs/DOCS_INDEX.md)** - Guía completa de toda la documentación disponible
- **[Resumen de Hotfixes](docs/HOTFIX_SUMMARY.md)** - Historial de correcciones v5.x
- Guías de instalación y uso
- Reportes de testing
- Análisis de mejoras
- Changelog completo

## 🔧 Desarrollo

### Requisitos
- Node.js (para testing)
- Chrome/Brave/Edge (para testing de extensión)

### Comandos útiles
```bash
# Ejecutar tests
cd tests && node --experimental-modules test-refactored-services.js

# Ver documentación
ls docs/
```

## 📈 Características

- ✅ Monitoreo automático de oportunidades de arbitraje
- ✅ Notificaciones inteligentes con filtros de horario
- ✅ Interfaz moderna y responsive
- ✅ Cálculos precisos considerando todas las comisiones
- ✅ Integración con múltiples APIs y bancos
- ✅ Arquitectura modular y mantenible

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**nomdedev** - [GitHub](https://github.com/nomdedev)

---

⭐ Si te gusta el proyecto, ¡dale una estrella!

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

### Flujo Completo (CON COMISIONES REALES):
```
1. Compras USD Oficial en banco → $1,050 ARS/USD
2. Depositas USD en exchange (Ej: Binance)
3. Compras USDT con esos USD → Fee: 0.1-1%
4. Vendes USDT por ARS → $1,150 ARS/USDT → Fee: 0.1-1%
5. Retiras a tu cuenta → Fee: 0-0.5%
6. ✅ Ganancia NETA (ya descontadas comisiones)
```

### Ejemplo Real con $100,000 ARS (Binance - Comisiones incluidas):
```
Inversión inicial:      $100,000 ARS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Compras USD oficial:   95.24 USD (a $1,050)
2️⃣ Fee trading (0.1%):    -0.10 USDT
3️⃣ USDT después de fee:   95.14 USDT
4️⃣ Vendes por ARS:        $109,411 ARS (a $1,150)
5️⃣ Fee venta (0.1%):      -$109 ARS
6️⃣ Fee retiro (0.5%):     -$547 ARS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ganancia NETA:         $8,755 ARS (8.76%)
📊 Comisiones totales:    $2,771 ARS (2.77%)
💡 Ganancia BRUTA:        $11,526 ARS (11.53%)
```

**✨ La extensión calcula automáticamente las comisiones reales de cada exchange**

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
