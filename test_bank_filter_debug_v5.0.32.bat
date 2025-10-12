@echo off
echo ========================================
echo TEST HOTFIX v5.0.32 - BANK FILTER DEBUG
echo ========================================
echo.

set PASS=0
set FAIL=0

echo [TEST 1] Verificando log de configuracion recibida...
findstr /C:"[CONFIG] preferredBank:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log de CONFIG preferredBank encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log de CONFIG preferredBank NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 2] Verificando log de selectedBanks recibido...
findstr /C:"[CONFIG] selectedBanks:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log de CONFIG selectedBanks encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log de CONFIG selectedBanks NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 3] Verificando log de bancos filtrados...
findstr /C:"[FILTRADO] Bancos obtenidos:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log de bancos filtrados encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log de bancos filtrados NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 4] Verificando log detallado de MEDIANA...
findstr /C:"[MEDIANA]" src\background\dollarPriceManager.js | findstr /C:"Bancos disponibles" >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log detallado de MEDIANA encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log detallado de MEDIANA NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 5] Verificando log de rango de precios MEDIANA...
findstr /C:"[MEDIANA] Rango de precios:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log de rango de precios MEDIANA encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log de rango de precios MEDIANA NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 6] Verificando log detallado de PROMEDIO RECORTADO...
findstr /C:"[PROM.RECORTADO] Bancos disponibles:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log detallado de PROM.RECORTADO encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log detallado de PROM.RECORTADO NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 7] Verificando log detallado de MENOR_VALOR...
findstr /C:"[MENOR_VALOR] Bancos disponibles:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log detallado de MENOR_VALOR encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log detallado de MENOR_VALOR NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 8] Verificando uso de b.name en logs...
findstr /C:"b.name || 'Unknown'" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Uso de b.name con fallback encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Uso de b.name con fallback NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 9] Verificando log de VENTA en MEDIANA...
findstr /C:"VENTA (${banks.length} bancos)" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log de precio VENTA en MEDIANA encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log de precio VENTA en MEDIANA NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 10] Verificando log de VENTA en MENOR_VALOR...
findstr /C:"COMPRA /" src\background\dollarPriceManager.js | findstr /C:"VENTA" >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log de COMPRA/VENTA en MENOR_VALOR encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Log de COMPRA/VENTA en MENOR_VALOR NO encontrado
    set /a FAIL+=1
)

echo.
echo ========================================
echo RESUMEN DE TESTS
echo ========================================
echo Tests PASADOS: %PASS%
echo Tests FALLIDOS: %FAIL%
echo Total: 10 tests
echo.

if %FAIL% equ 0 (
    echo [SUCCESS] Todos los tests pasaron correctamente!
    echo Los logs detallados estan implementados.
    echo.
    echo INSTRUCCIONES DE USO:
    echo 1. Recargar extension en Chrome
    echo 2. Abrir DevTools ^> Application ^> Service Workers ^> Inspect
    echo 3. Buscar logs con prefijos:
    echo    - [CONFIG] = Configuracion recibida
    echo    - [FILTRO] = Filtrado de bancos
    echo    - [FILTRADO] = Bancos despues del filtro
    echo    - [MEDIANA] = Calculo de mediana
    echo    - [MENOR_VALOR] = Banco mas barato
    exit /b 0
) else (
    echo [ERROR] Algunos tests fallaron. Revisar implementacion.
    exit /b 1
)
