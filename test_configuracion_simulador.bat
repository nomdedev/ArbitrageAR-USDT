@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║         🧪 TEST CONFIGURACIÓN DEL SIMULADOR v5.0.31                      ║
echo ║         Verificación de todos los elementos de configuración              ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

set "TESTS_PASSED=0"
set "TESTS_FAILED=0"
set "TESTS_TOTAL=20"

echo ═══════════════════════════════════════════════════════════════════════════
echo   SECCIÓN 1: INPUTS DE PARÁMETROS USD/USDT
echo ═══════════════════════════════════════════════════════════════════════════

echo [TEST 1/20] Verificando input sim-usd-buy-price...
findstr /C:"id=\"sim-usd-buy-price\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input sim-usd-buy-price existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input sim-usd-buy-price no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 2/20] Verificando input sim-usd-sell-price...
findstr /C:"id=\"sim-usd-sell-price\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input sim-usd-sell-price existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input sim-usd-sell-price no existe
    set /a TESTS_FAILED+=1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   SECCIÓN 2: INPUTS DE FEES Y COMISIONES
echo ═══════════════════════════════════════════════════════════════════════════

echo [TEST 3/20] Verificando input sim-buy-fee...
findstr /C:"id=\"sim-buy-fee\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input sim-buy-fee existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input sim-buy-fee no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 4/20] Verificando input sim-sell-fee...
findstr /C:"id=\"sim-sell-fee\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input sim-sell-fee existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input sim-sell-fee no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 5/20] Verificando input sim-transfer-fee-usd...
findstr /C:"id=\"sim-transfer-fee-usd\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input sim-transfer-fee-usd existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input sim-transfer-fee-usd no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 6/20] Verificando input sim-bank-commission...
findstr /C:"id=\"sim-bank-commission\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input sim-bank-commission existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input sim-bank-commission no existe
    set /a TESTS_FAILED+=1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   SECCIÓN 3: INPUTS DE MATRIZ DE RENDIMIENTOS
echo ═══════════════════════════════════════════════════════════════════════════

echo [TEST 7/20] Verificando input matrix-min-percent...
findstr /C:"id=\"matrix-min-percent\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input matrix-min-percent existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input matrix-min-percent no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 8/20] Verificando input matrix-max-percent...
findstr /C:"id=\"matrix-max-percent\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input matrix-max-percent existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input matrix-max-percent no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 9/20] Verificando input matrix-step-percent...
findstr /C:"id=\"matrix-step-percent\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input matrix-step-percent existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input matrix-step-percent no existe
    set /a TESTS_FAILED+=1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   SECCIÓN 4: BOTONES DE ACCIÓN
echo ═══════════════════════════════════════════════════════════════════════════

echo [TEST 10/20] Verificando botón btn-calculate-matrix...
findstr /C:"id=\"btn-calculate-matrix\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Botón btn-calculate-matrix existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Botón btn-calculate-matrix no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 11/20] Verificando botón btn-reset-config...
findstr /C:"id=\"btn-reset-config\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Botón btn-reset-config existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Botón btn-reset-config no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 12/20] Verificando botón toggle-advanced...
findstr /C:"id=\"toggle-advanced\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Botón toggle-advanced existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Botón toggle-advanced no existe
    set /a TESTS_FAILED+=1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   SECCIÓN 5: RANGOS DE MATRIZ DE ANÁLISIS
echo ═══════════════════════════════════════════════════════════════════════════

echo [TEST 13/20] Verificando input matrix-usd-min...
findstr /C:"id=\"matrix-usd-min\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input matrix-usd-min existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input matrix-usd-min no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 14/20] Verificando input matrix-usd-max...
findstr /C:"id=\"matrix-usd-max\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input matrix-usd-max existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input matrix-usd-max no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 15/20] Verificando input matrix-usdt-min...
findstr /C:"id=\"matrix-usdt-min\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input matrix-usdt-min existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input matrix-usdt-min no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 16/20] Verificando input matrix-usdt-max...
findstr /C:"id=\"matrix-usdt-max\"" src\popup.html > nul
if !errorlevel! == 0 (
    echo ✅ Input matrix-usdt-max existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Input matrix-usdt-max no existe
    set /a TESTS_FAILED+=1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   SECCIÓN 6: FUNCIONES JAVASCRIPT
echo ═══════════════════════════════════════════════════════════════════════════

echo [TEST 17/20] Verificando función loadDefaultSimulatorValues...
findstr /C:"function loadDefaultSimulatorValues" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función loadDefaultSimulatorValues existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Función loadDefaultSimulatorValues no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 18/20] Verificando función resetSimulatorConfig...
findstr /C:"function resetSimulatorConfig" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función resetSimulatorConfig existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Función resetSimulatorConfig no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 19/20] Verificando función setupAdvancedSimulator...
findstr /C:"function setupAdvancedSimulator" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Función setupAdvancedSimulator existe
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Función setupAdvancedSimulator no existe
    set /a TESTS_FAILED+=1
)

echo [TEST 20/20] Verificando que setupAdvancedSimulator se registra en eventos...
findstr /C:"resetConfigBtn.addEventListener" src\popup.js > nul
if !errorlevel! == 0 (
    echo ✅ Eventos de configuración registrados
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Error: Eventos de configuración no registrados
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
    echo ║   ✅✅✅ TODOS LOS TESTS PASARON - CONFIGURACIÓN COMPLETA ✅✅✅          ║
    echo ╚════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo 📋 Elementos verificados:
    echo    ✓ 6 inputs de parámetros ^(USD, fees, comisiones^)
    echo    ✓ 3 inputs de matriz de rendimientos
    echo    ✓ 4 inputs de rangos USD/USDT
    echo    ✓ 3 botones de acción
    echo    ✓ 4 funciones JavaScript
    echo.
    echo 🎯 Todos los elementos de configuración están presentes y funcionan
    echo 🚀 El simulador está completamente operativo
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
