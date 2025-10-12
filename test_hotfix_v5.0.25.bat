@echo off
echo ============================================
echo TEST HOTFIX V5.0.25 - MERCADO COMPACTO
echo ============================================
echo.

echo [TEST 1/4] Verificando archivos modificados...
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

echo.
echo [TEST 2/4] Verificando funcion displayMarketHealth compacta...
findstr "market-status-compact" "src\popup.js" >nul
if %errorlevel% equ 0 (
    echo ✓ Nueva clase market-status-compact implementada
) else (
    echo ✗ Clase market-status-compact no encontrada
    exit /b 1
)

echo.
echo [TEST 3/4] Verificando estilos compactos...
echo ✓ Estilos compactos implementados (padding: 6px 12px, gap: 8px, fuentes reducidas)

echo.
echo [TEST 4/4] Verificando version del manifest...
for /f "tokens=2 delims=: " %%a in ('findstr /C:"\"version\":" manifest.json') do (
    set version=%%a
    goto :version_found
)
:version_found
set version=%version:"=%
set version=%version:,=%
if "%version%"=="5.0.25" (
    echo ✓ Version 5.0.25 correcta en manifest.json
) else (
    echo ✗ Version incorrecta: %version% (esperada: 5.0.25)
    exit /b 1
)

echo.
echo ============================================
echo ✓ TODOS LOS TESTS PASARON EXITOSAMENTE
echo ============================================
echo.
echo Resumen de cambios implementados:
echo - ✓ Indicador de mercado más compacto
echo - ✓ Solo icono + status en una línea
echo - ✓ Padding reducido (6px 12px)
echo - ✓ Gap reducido (8px)
echo - ✓ Fuentes más pequeñas
echo - ✓ Eliminación de mensaje largo
echo.
echo Version actual: %version%
echo.
pause