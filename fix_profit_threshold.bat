@echo off
echo 🔧 CORRECCION: Umbral de rentabilidad bajado de 0.1%% a -50%%
echo.
echo Cambio realizado:
echo - ANTES: Solo rutas con rentabilidad > 0.1%%
echo - AHORA: Solo rutas con rentabilidad > -50%% (incluye negativas)
echo.
echo Esto deberia mostrar todas las rutas negativas que vimos en los logs
echo.
echo Pasos:
echo 1. Abrir Chrome en chrome://extensions/
echo 2. Buscar "ArbitrageAR" y hacer click en "Reload"
echo 3. Abrir popup de la extension
echo 4. Deberias ver muchas rutas negativas ahora
echo.
pause