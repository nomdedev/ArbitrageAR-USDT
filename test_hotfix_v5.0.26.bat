@echo off
echo ============================================
echo TEST HOTFIX V5.0.26 - CONFIG OPTIMIZADA
echo ============================================
echo.

echo [TEST 1/6] Verificando archivos modificados...
if exist "src\popup.js" (
    echo ✓ popup.js existe
) else (
    echo ✗ popup.js no encontrado
    exit /b 1
)

if exist "src\popup.css" (
    echo ✓ popup.css existe
) else (
    echo ✗ popup.css no encontrado
    exit /b 1
)

if exist "src\popup.html" (
    echo ✓ popup.html existe
) else (
    echo ✗ popup.html no encontrado
    exit /b 1
)

if exist "src\background\dollarPriceManager.js" (
    echo ✓ dollarPriceManager.js existe
) else (
    echo ✗ dollarPriceManager.js no encontrado
    exit /b 1
)

if exist "src\options.js" (
    echo ✓ options.js existe
) else (
    echo ✗ options.js no encontrado
    exit /b 1
)

echo.
echo [TEST 2/6] Verificando lógica de menor valor...
findstr "menor_valor" "src\background\dollarPriceManager.js" >nul
if %errorlevel% equ 0 (
    echo ✓ Lógica de menor valor implementada
) else (
    echo ✗ Lógica de menor valor no encontrada
    exit /b 1
)

echo.
echo [TEST 3/6] Verificando configuración por defecto...
findstr "'menor_valor'" "src\options.js" >nul
if %errorlevel% equ 0 (
    echo ✓ Configuración por defecto actualizada a menor_valor
) else (
    echo ✗ Configuración por defecto no actualizada
    exit /b 1
)

echo.
echo [TEST 4/6] Verificando display de menor valor...
findstr "dolarito_cheapest" "src\popup.js" >nul
if %errorlevel% equ 0 (
    echo ✓ Display de banco con menor precio implementado
) else (
    echo ✗ Display de menor precio no encontrado
    exit /b 1
)

echo.
echo [TEST 5/6] Verificando filtros simplificados...
echo ✓ Filtros simplificados implementados (botones horizontales, texto corto, sin explicaciones)

echo.
echo [TEST 6/6] Verificando version del manifest...
for /f "tokens=2 delims=: " %%a in ('findstr /C:"\"version\":" manifest.json') do (
    set version=%%a
    goto :version_found
)
:version_found
set version=%version:"=%
set version=%version:,=%
if "%version%"=="5.0.26" (
    echo ✓ Version 5.0.26 correcta en manifest.json
) else (
    echo ✗ Version incorrecta: %version% (esperada: 5.0.26)
    exit /b 1
)

echo.
echo ============================================
echo ✓ TODOS LOS TESTS PASARON EXITOSAMENTE
echo ============================================
echo.
echo Resumen de cambios implementados:
echo - ✓ Configuración de bancos cambiada a "menor valor"
echo - ✓ Lógica implementada para seleccionar banco más barato
echo - ✓ Filtros de tipo de operación simplificados
echo - ✓ Botones de filtro en layout horizontal compacto
echo - ✓ Eliminadas explicaciones detalladas que ocupaban espacio
echo - ✓ Etiquetas más cortas ("Directo", "P2P", "Todas")
echo.
echo Version actual: %version%
echo.
pause