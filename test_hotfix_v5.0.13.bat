@echo off
echo ========================================
echo    TESTING HOTFIX V5.0.13
echo    Configuracion Avanzada Precio Dolar
echo ========================================
echo.

echo 1. Verificando archivos nuevos...
if exist "src\background\dollarPriceManager.js" (
    echo ✅ dollarPriceManager.js encontrado
) else (
    echo ❌ dollarPriceManager.js NO encontrado
)

echo.
echo 2. Verificando modificaciones en DataService...
findstr /C:"fetchDolaritoBankRates" src\DataService.js >nul
if %errorlevel%==0 (
    echo ✅ fetchDolaritoBankRates añadido a DataService
) else (
    echo ❌ fetchDolaritoBankRates NO encontrado en DataService
)

echo.
echo 3. Verificando configuración en options.html...
findstr /C:"dollar-price-source" src\options.html >nul
if %errorlevel%==0 (
    echo ✅ Configuración de precio del dólar añadida
) else (
    echo ❌ Configuración de precio del dólar NO encontrada
)

echo.
echo 4. Verificando controles en popup.html...
findstr /C:"dollar-info" src\popup.html >nul
if %errorlevel%==0 (
    echo ✅ Información del dólar añadida al popup
) else (
    echo ❌ Información del dólar NO encontrada en popup
)

echo.
echo 5. Verificando estilos CSS...
findstr /C:"dollar-info" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos CSS para información del dólar añadidos
) else (
    echo ❌ Estilos CSS para información del dólar NO encontrados
)

echo.
echo 6. Verificando funcionalidad JavaScript...
findstr /C:"setupDollarPriceControls" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Controles JavaScript del dólar añadidos
) else (
    echo ❌ Controles JavaScript del dólar NO encontrados
)

echo.
echo 7. Verificando integración en background...
findstr /C:"recalculateWithCustomPrice" src\background\main.js >nul
if %errorlevel%==0 (
    echo ✅ Funcionalidad de recálculo añadida al background
) else (
    echo ❌ Funcionalidad de recálculo NO encontrada en background
)

echo.
echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo Para testing manual:
echo 1. Cargar la extensión en Chrome
echo 2. Ir a Configuración y verificar nueva sección
echo 3. Probar cambios entre automático y manual
echo 4. Verificar recálculo desde popup
echo 5. Comprobar fallbacks cuando APIs fallan
echo.
pause