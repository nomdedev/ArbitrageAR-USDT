@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║         🧪 TEST HOTFIX v5.0.30 - SIMPLIFICACIÓN UI                        ║
echo ║         Verificación de eliminación de proceso completo                   ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

set "TESTS_PASSED=0"
set "TESTS_FAILED=0"
set "TESTS_TOTAL=8"

echo [TEST 1/8] Verificando versión en manifest.json...
findstr /C:"\"version\": \"5.0.30\"" manifest.json > nul
if !errorlevel! == 0 (
    echo ✅ Versión correcta en manifest.json
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Versión incorrecta en manifest.json
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 2/8] Verificando que NO existe la sección complete-process en popup.html...
findstr /C:"complete-process-section" src\popup.html > nul
if !errorlevel! == 1 (
    echo ✅ Sección complete-process ELIMINADA correctamente de HTML
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existe la sección complete-process en HTML
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 3/8] Verificando que NO existe populateCompleteProcessSimulation en popup.js...
findstr /C:"populateCompleteProcessSimulation" src\popup.js > nul
if !errorlevel! == 1 (
    echo ✅ Función populateCompleteProcessSimulation ELIMINADA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existe la función populateCompleteProcessSimulation
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 4/8] Verificando que NO existe calculateTotalProcessTime en popup.js...
findstr /C:"calculateTotalProcessTime" src\popup.js > nul
if !errorlevel! == 1 (
    echo ✅ Función calculateTotalProcessTime ELIMINADA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existe la función calculateTotalProcessTime
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 5/8] Verificando que NO existen estilos de .complete-process-section en popup.css...
findstr /C:".complete-process-section" src\popup.css > nul
if !errorlevel! == 1 (
    echo ✅ Estilos de complete-process ELIMINADOS correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existen estilos de complete-process
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 6/8] Verificando que NO existen estilos de .process-step en popup.css...
findstr /C:".process-step" src\popup.css > nul
if !errorlevel! == 1 (
    echo ✅ Estilos de process-step ELIMINADOS correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Todavía existen estilos de process-step
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 7/8] Verificando que SÍ existe la función calculateSimulation en popup.js...
findstr /C:"async function calculateSimulation" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función calculateSimulation MANTENIDA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: No se encuentra la función calculateSimulation
    set /a TESTS_FAILED+=1
)

echo.
echo [TEST 8/8] Verificando que SÍ existe la función generateRiskMatrix en popup.js...
findstr /C:"function generateRiskMatrix" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función generateRiskMatrix MANTENIDA correctamente
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: No se encuentra la función generateRiskMatrix
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
    echo ║   ✅✅✅ TODOS LOS TESTS PASARON - HOTFIX v5.0.30 EXITOSO ✅✅✅           ║
    echo ╚════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo 📋 Código eliminado correctamente:
    echo    - Sección complete-process-section en HTML
    echo    - Funciones populateCompleteProcessSimulation y calculateTotalProcessTime
    echo    - Estilos CSS relacionados con proceso completo
    echo.
    echo 📋 Funcionalidades mantenidas:
    echo    - Simulador básico ^(calculateSimulation^)
    echo    - Matriz de riesgo/rendimiento ^(generateRiskMatrix^)
    echo    - Validaciones de seguridad ^(v5.0.28^)
    echo    - Métodos estadísticos robustos ^(v5.0.29^)
    echo.
    echo ✨ La interfaz está más limpia y enfocada
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
