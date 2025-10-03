@echo off
echo 🔧 DEBUG: No se muestran rutas - Logs activados
echo.
echo Pasos para diagnosticar:
echo 1. Abrir Chrome en chrome://extensions/
echo 2. Buscar "ArbitrageAR" y hacer click en "Reload"
echo 3. Abrir popup de la extension + F12 (consola)
echo 4. Buscar estos logs de debug:
echo.
echo    🔍 applyP2PFilter() llamado
echo    🔍 allRoutes.length: [numero]
echo    🔍 displayOptimizedRoutes() llamado con [numero] rutas
echo    🔍 applyUserPreferences() llamado con [numero] rutas
echo.
echo 5. Si allRoutes.length es 0, el problema esta en el background
echo 6. Si displayOptimizedRoutes recibe 0 rutas, el problema esta en applyUserPreferences
echo.
pause