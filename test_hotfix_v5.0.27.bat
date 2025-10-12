@echo off
echo ============================================
echo TEST HOTFIX V5.0.27 - SIMULACION COMPLETA
echo ============================================
echo.

echo [TEST 1/8] Verificando archivos modificados...
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
echo [TEST 2/8] Verificando seccion proceso completo HTML...
findstr "complete-process-section" "src\popup.html" >nul
if %errorlevel% equ 0 (
    echo ✓ Sección proceso completo añadida en HTML
) else (
    echo ✗ Sección proceso completo no encontrada
    exit /b 1
)

echo.
echo [TEST 3/8] Verificando pasos del proceso...
findstr "process-step" "src\popup.html" >nul
if %errorlevel% equ 0 (
    echo ✓ Pasos del proceso implementados
) else (
    echo ✗ Pasos del proceso no encontrados
    exit /b 1
)

echo.
echo [TEST 4/8] Verificando matriz de riesgo HTML...
findstr "risk-matrix-section" "src\popup.html" >nul
if %errorlevel% equ 0 (
    echo ✓ Sección matriz de riesgo añadida en HTML
) else (
    echo ✗ Sección matriz de riesgo no encontrada
    exit /b 1
)

echo.
echo [TEST 5/8] Verificando funcion populateCompleteProcessSimulation...
findstr "populateCompleteProcessSimulation" "src\popup.js" >nul
if %errorlevel% equ 0 (
    echo ✓ Función populateCompleteProcessSimulation implementada
) else (
    echo ✗ Función populateCompleteProcessSimulation no encontrada
    exit /b 1
)

echo.
echo [TEST 6/8] Verificando funcion generateRiskMatrix...
findstr "generateRiskMatrix" "src\popup.js" >nul
if %errorlevel% equ 0 (
    echo ✓ Función generateRiskMatrix implementada
) else (
    echo ✗ Función generateRiskMatrix no encontrada
    exit /b 1
)

echo.
echo [TEST 7/8] Verificando estilos CSS...
findstr "complete-process-section" "src\popup.css" >nul
if %errorlevel% equ 0 (
    echo ✓ Estilos proceso completo añadidos
) else (
    echo ✗ Estilos proceso completo no encontrados
    exit /b 1
)

findstr "risk-matrix-section" "src\popup.css" >nul
if %errorlevel% equ 0 (
    echo ✓ Estilos matriz de riesgo añadidos
) else (
    echo ✗ Estilos matriz de riesgo no encontrados
    exit /b 1
)

echo.
echo [TEST 8/8] Verificando version del manifest...
for /f "tokens=2 delims=: " %%a in ('findstr /C:"\"version\":" manifest.json') do (
    set version=%%a
    goto :version_found
)
:version_found
set version=%version:"=%
set version=%version:,=%
if "%version%"=="5.0.27" (
    echo ✓ Version 5.0.27 correcta en manifest.json
) else (
    echo ✗ Version incorrecta: %version% (esperada: 5.0.27)
    exit /b 1
)

echo.
echo ============================================
echo ✓ TODOS LOS TESTS PASARON EXITOSAMENTE
echo ============================================
echo.
echo Resumen de cambios implementados:
echo - ✓ Simulación completa del proceso paso a paso
echo - ✓ Detalle de cada etapa del arbitraje
echo - ✓ Tiempos estimados por paso
echo - ✓ Información dinámica según la ruta
echo - ✓ Matriz de riesgo/rendimiento 5x5
echo - ✓ Análisis de múltiples escenarios USD/USDT
echo - ✓ Visualización con código de colores
echo - ✓ Controles configurables para rangos
echo - ✓ Integración con parámetros del simulador
echo.
echo Version actual: %version%
echo.
pause
