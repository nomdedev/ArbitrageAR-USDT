# 🔄 Cómo recargar la extensión después de cambios

## Método 1: Desde brave://extensions (RECOMENDADO)

1. **Abre** `brave://extensions` en una nueva pestaña
2. **Busca** "ArbitrageAR Oficial a USDT Broker"
3. **Click** en el botón de recarga (⟳) en la tarjeta de la extensión
4. **Cierra** cualquier popup abierto de la extensión
5. **Abre nuevamente** el popup clickeando en el icono

## Método 2: Eliminar y volver a cargar

1. **Abre** `brave://extensions`
2. **Click** en "Quitar" en la extensión ArbitrageAR
3. **Click** en "Cargar descomprimida"
4. **Selecciona** la carpeta: `D:\martin\Proyectos\ArbitrageAR-Oficial-USDT-Broker-Folder\ArbitrageAR-Oficial-USDT-Broker`
5. **Confirma** que la extensión v3.2.0 está cargada

## Método 3: Modo desarrollador (para debugging)

1. **Click derecho** en el icono de la extensión
2. **Selecciona** "Inspeccionar ventana emergente"
3. En DevTools, **click** en "Console"
4. **Busca errores** en rojo
5. Si ves errores, **compártelos** para ayudarte a resolverlos

## ✅ Verificación de que funcionó:

Después de recargar, deberías ver:
- ✨ Header con gradiente azul (#1e3a8a → #3b82f6 → #06b6d4)
- 🌙 Fondo oscuro (#1a1f2e)
- 🔵 Botones con efecto glassmorphism
- 📊 Tabs con indicador animado
- 💎 Cards con bordes redondeados

## 🐛 Si sigue sin funcionar:

1. **Verifica** que estás en la carpeta correcta
2. **Asegúrate** de que `popup.css` tiene 525 líneas
3. **Revisa** que `manifest.json` dice version "3.2.0"
4. **Mira** la consola del service worker por errores:
   - `brave://extensions` → "service worker" link → Console

## 📸 Toma una captura cuando funcione!

Quiero ver el resultado final del Dark Mode Premium 🎨✨
