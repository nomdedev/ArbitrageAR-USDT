@echo off
echo 🔧 DEBUG: Background no calcula rutas - Logs detallados activados
echo.
echo Nuevos logs de debug agregados:
echo - [DEBUG] Exchanges encontrados y validados
echo - [DEBUG] Combinaciones calculadas
echo - [DEBUG] Rutas nulas y rentabilidades bajas
echo - [DEBUG] Por que exchanges se excluyen
echo.
echo Pasos:
echo 1. Abrir Chrome en chrome://extensions/
echo 2. Buscar "ArbitrageAR" y hacer click en "Reload"
echo 3. Abrir popup de la extension + F12
echo 4. Buscar logs [DEBUG] en consola
echo.
echo Posibles causas:
echo - No hay exchanges validos (USD/USDT fuera de rango)
echo - Todas las rutas tienen rentabilidad <= 0.1%%
echo - Error en calculo de rutas individuales
echo.
pause