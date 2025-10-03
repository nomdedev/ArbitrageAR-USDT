@echo off
echo 🔍 DEBUG AVANZADO: Popup no muestra rutas
echo.
echo Nuevos logs agregados en popup.js:
echo - [POPUP] allRoutes guardadas: X rutas
echo - [POPUP] applyP2PFilter() llamado
echo - [POPUP] applyUserPreferences() llamado con X rutas
echo - [POPUP] displayOptimizedRoutes() llamado con X rutas
echo - [POPUP] displayOptimizedRoutes() completado
echo.
echo Posibles causas:
echo - applyUserPreferences filtra todas las rutas
echo - displayOptimizedRoutes no funciona
echo - Problema con el DOM/HTML
echo.
echo Pasos:
echo 1. Abrir Chrome en chrome://extensions/
echo 2. Buscar "ArbitrageAR" y hacer click en "Reload"
echo 3. Abrir popup + F12
echo 4. Buscar logs [POPUP] en consola
echo.
pause