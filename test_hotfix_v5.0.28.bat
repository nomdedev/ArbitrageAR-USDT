@echo off
REM ============================================
REM TEST HOTFIX v5.0.28 - SEGURIDAD Y VALIDACIÓN
REM ============================================

echo.
echo ===============================================
echo    TEST HOTFIX v5.0.28 - SEGURIDAD
echo ===============================================
echo.

REM Verificar archivos críticos
echo [1/8] Verificando archivos criticos...
if not exist "src\ValidationService.js" (
    echo [ERROR] No se encontro ValidationService.js
    exit /b 1
)
if not exist "src\popup.js" (
    echo [ERROR] No se encontro popup.js
    exit /b 1
)
if not exist "src\popup.html" (
    echo [ERROR] No se encontro popup.html
    exit /b 1
)
if not exist "src\popup.css" (
    echo [ERROR] No se encontro popup.css
    exit /b 1
)
if not exist "src\options.js" (
    echo [ERROR] No se encontro options.js
    exit /b 1
)
if not exist "manifest.json" (
    echo [ERROR] No se encontro manifest.json
    exit /b 1
)
echo [OK] Todos los archivos criticos existen

echo.
echo [2/8] Verificando version en manifest.json...
findstr /C:"\"version\": \"5.0.28\"" manifest.json >nul
if errorlevel 1 (
    echo [ERROR] Version incorrecta en manifest.json
    exit /b 1
)
echo [OK] Version correcta: 5.0.28

echo.
echo [3/8] Verificando carga de ValidationService en popup.html...
findstr /C:"ValidationService.js" src\popup.html >nul
if errorlevel 1 (
    echo [ERROR] ValidationService.js no esta incluido en popup.html
    exit /b 1
)
echo [OK] ValidationService.js cargado en popup.html

echo.
echo [4/8] Verificando clase ValidationService...
findstr /C:"class ValidationService" src\ValidationService.js >nul
if errorlevel 1 (
    echo [ERROR] Clase ValidationService no encontrada
    exit /b 1
)
echo [OK] Clase ValidationService definida

echo.
echo [5/8] Verificando funciones de validacion...
findstr /C:"isDataFresh" src\ValidationService.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion isDataFresh no encontrada
    exit /b 1
)
findstr /C:"getDataFreshnessLevel" src\ValidationService.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion getDataFreshnessLevel no encontrada
    exit /b 1
)
findstr /C:"calculateRouteRiskLevel" src\ValidationService.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion calculateRouteRiskLevel no encontrada
    exit /b 1
)
findstr /C:"verifyCalculations" src\ValidationService.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion verifyCalculations no encontrada
    exit /b 1
)
findstr /C:"requiresConfirmation" src\ValidationService.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion requiresConfirmation no encontrada
    exit /b 1
)
echo [OK] Todas las funciones de validacion presentes

echo.
echo [6/8] Verificando integracion en popup.js...
findstr /C:"loadUserSettings" src\popup.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion loadUserSettings no encontrada
    exit /b 1
)
findstr /C:"updateDataStatusIndicator" src\popup.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion updateDataStatusIndicator no encontrada
    exit /b 1
)
findstr /C:"addRiskIndicatorToRoute" src\popup.js >nul
if errorlevel 1 (
    echo [ERROR] Funcion addRiskIndicatorToRoute no encontrada
    exit /b 1
)
findstr /C:"async function calculateSimulation" src\popup.js >nul
if errorlevel 1 (
    echo [ERROR] calculateSimulation no es async
    exit /b 1
)
echo [OK] Integracion correcta en popup.js

echo.
echo [7/8] Verificando nuevas configuraciones en options.js...
findstr /C:"dataFreshnessWarning" src\options.js >nul
if errorlevel 1 (
    echo [ERROR] Setting dataFreshnessWarning no encontrado
    exit /b 1
)
findstr /C:"riskAlertsEnabled" src\options.js >nul
if errorlevel 1 (
    echo [ERROR] Setting riskAlertsEnabled no encontrado
    exit /b 1
)
findstr /C:"requireConfirmHighAmount" src\options.js >nul
if errorlevel 1 (
    echo [ERROR] Setting requireConfirmHighAmount no encontrado
    exit /b 1
)
findstr /C:"minProfitWarning" src\options.js >nul
if errorlevel 1 (
    echo [ERROR] Setting minProfitWarning no encontrado
    exit /b 1
)
echo [OK] Nuevas configuraciones de seguridad presentes

echo.
echo [8/8] Verificando estilos CSS para indicadores...
findstr /C:".data-status" src\popup.css >nul
if errorlevel 1 (
    echo [ERROR] Estilos .data-status no encontrados
    exit /b 1
)
findstr /C:".risk-indicator" src\popup.css >nul
if errorlevel 1 (
    echo [ERROR] Estilos .risk-indicator no encontrados
    exit /b 1
)
findstr /C:".validation-alert" src\popup.css >nul
if errorlevel 1 (
    echo [ERROR] Estilos .validation-alert no encontrados
    exit /b 1
)
echo [OK] Estilos CSS presentes

echo.
echo ===============================================
echo    TODAS LAS VERIFICACIONES PASARON
echo ===============================================
echo.
echo SIGUIENTE PASO:
echo 1. Recarga la extension en Brave
echo 2. Verifica que aparece el indicador de estado en el header
echo 3. Simula con monto alto ^(^>500k^) para ver confirmacion
echo 4. Verifica colores del semaforo segun antiguedad de datos
echo 5. Revisa indicadores de riesgo en las rutas
echo.

pause
