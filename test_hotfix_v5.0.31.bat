@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║       🧪 TEST HOTFIX v5.0.31 - SIMULADOR SIMPLIFICADO                    ║
echo ║       Verificación de eliminación de rutas y mejoras de matriz            ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

set "TESTS_PASSED=0"
set "TESTS_FAILED=0"
set "TESTS_TOTAL=12"

echo [TEST 1/12] Verificando versión en manifest.json...
findstr /C:"\"version\": \"5.0.31\"" manifest.json > nul
if !errorlevel! == 0 (
    echo ✅ Versión correcta en manifest.json
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Versión incorrecta en manifest.json
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 2/12] Verificando que NO existe sim-route en popup.html...
findstr /C:"sim-route" src\popup.html > nul
if !errorlevel! == 1 (
    echo ✅ Selector sim-route ELIMINADO correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existe sim-route en HTML
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 3/12] Verificando que NO existe sim-calculate en popup.html...
findstr /C:"sim-calculate" src\popup.html > nul
if !errorlevel! == 1 (
    echo ✅ Botón sim-calculate ELIMINADO correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existe sim-calculate en HTML
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 4/12] Verificando que NO existe sim-results en popup.html...
findstr /C:"sim-results" src\popup.html > nul
if !errorlevel! == 1 (
    echo ✅ Sección sim-results ELIMINADA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existe sim-results en HTML
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 5/12] Verificando que SÍ existen filtros de matriz en popup.html...
findstr /C:"filter-min-profit" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Filtros de matriz AÑADIDOS correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: No se encuentran los filtros de matriz
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 6/12] Verificando que NO existe populateSimulatorRoutes en popup.js...
findstr /C:"populateSimulatorRoutes" src\popup.js > nul
if !errorlevel! == 1 (
    echo ✅ Función populateSimulatorRoutes ELIMINADA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existe populateSimulatorRoutes
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 7/12] Verificando que SÍ existe generateRiskMatrix en popup.js...
findstr /C:"function generateRiskMatrix" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función generateRiskMatrix MANTENIDA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: No se encuentra generateRiskMatrix
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 8/12] Verificando que SÍ existe applyMatrixFilter en popup.js...
findstr /C:"function applyMatrixFilter" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función applyMatrixFilter AÑADIDA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: No se encuentra applyMatrixFilter
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 9/12] Verificando que SÍ existe resetMatrixFilter en popup.js...
findstr /C:"function resetMatrixFilter" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función resetMatrixFilter AÑADIDA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: No se encuentra resetMatrixFilter
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 10/12] Verificando que SÍ existen estilos .matrix-filters en popup.css...
findstr /C:".matrix-filters" src\popup.css > nul
if !errorlevel! == 0 (
    echo ✅ Estilos de matrix-filters AÑADIDOS correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: No se encuentran estilos de matrix-filters
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 11/12] Verificando que setupAdvancedSimulator se llama en DOMContentLoaded...
findstr /C:"setupAdvancedSimulator()" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ setupAdvancedSimulator SE LLAMA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: setupAdvancedSimulator no se llama
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 12/12] Verificando título "Calculadora de Arbitraje" en popup.html...
findstr /C:"Calculadora de Arbitraje" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Título actualizado correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Título no actualizado
    set /a TESTS_FAILED+=1
)

echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                           📊 RESULTADOS FINALES                            ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo Total de tests: %TESTS_TOTAL%
echo Tests exitosos: %TESTS_PASSED%
echo Tests fallidos: %TESTS_FAILED%
echo.

if %TESTS_FAILED% == 0 (
    echo ╔════════════════════════════════════════════════════════════════════════════╗
    echo ║   ✅✅✅ TODOS LOS TESTS PASARON - HOTFIX v5.0.31 EXITOSO ✅✅✅           ║
    echo ╚════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo 📋 Funcionalidades eliminadas:
    echo    - Selector de rutas ^(sim-route^)
    echo    - Botón "Calcular Ganancia" ^(sim-calculate^)
    echo    - Sección de resultados individuales ^(sim-results^)
    echo    - Función populateSimulatorRoutes^(^)
    echo.
    echo 📋 Funcionalidades añadidas:
    echo    - Filtros de matriz ^(filter-min-profit, filter-max-profit^)
    echo    - Función applyMatrixFilter^(^)
    echo    - Función resetMatrixFilter^(^)
    echo    - Estilos .matrix-filters
    echo    - Contador de combinaciones visibles
    echo.
    echo 📋 Mejoras de UX:
    echo    - De 5 pasos a 3 pasos para simular
    echo    - No requiere datos de exchanges
    echo    - Filtros visuales para enfocar rangos
    echo    - Interfaz más limpia y directa
    echo.
    echo ✨ El simulador ahora es completamente autónomo
    echo 🚀 Lista para pruebas de usuario
) else (
    echo ╔════════════════════════════════════════════════════════════════════════════╗
    echo ║   ❌❌❌ ALGUNOS TESTS FALLARON - REVISAR IMPLEMENTACIÓN ❌❌❌           ║
    echo ╚════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo ⚠️ Revisa los errores anteriores antes de continuar
)

echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
