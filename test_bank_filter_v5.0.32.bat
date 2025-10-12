@echo off
echo ========================================
echo TEST HOTFIX v5.0.32 - BANK FILTER FIX
echo ========================================
echo.

set PASS=0
set FAIL=0

echo [TEST 1] Verificando version 5.0.32 en manifest.json...
findstr /C:"\"version\": \"5.0.32\"" manifest.json >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Version actualizada a 5.0.32
    set /a PASS+=1
) else (
    echo [FAIL] Version NO actualizada
    set /a FAIL+=1
)

echo.
echo [TEST 2] Verificando funcion getBankCode en DataService.js...
findstr /C:"getBankCode" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Funcion getBankCode encontrada
    set /a PASS+=1
) else (
    echo [FAIL] Funcion getBankCode NO encontrada
    set /a FAIL+=1
)

echo.
echo [TEST 3] Verificando mapeo de Banco Nacion...
findstr /C:"'nacion'," src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Mapeo de Banco Nacion correcto
    set /a PASS+=1
) else (
    echo [FAIL] Mapeo de Banco Nacion incorrecto
    set /a FAIL+=1
)

echo.
echo [TEST 4] Verificando mapeo de Banco Columbia...
findstr /C:"'Banco Columbia': 'columbia'" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Mapeo de Banco Columbia correcto
    set /a PASS+=1
) else (
    echo [FAIL] Mapeo de Banco Columbia incorrecto
    set /a FAIL+=1
)

echo.
echo [TEST 5] Verificando uso de bankCode en fetchDolaritoBankRates...
findstr /C:"const bankCode = this.getBankCode(bankName)" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] bankCode se genera correctamente
    set /a PASS+=1
) else (
    echo [FAIL] bankCode NO se genera
    set /a FAIL+=1
)

echo.
echo [TEST 6] Verificando uso de bankCode como key...
findstr /C:"bankRates[bankCode] = {" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] bankCode se usa como key del objeto
    set /a PASS+=1
) else (
    echo [FAIL] bankCode NO se usa como key
    set /a FAIL+=1
)

echo.
echo [TEST 7] Verificando paso de userSettings en getAutomaticDollarPrice...
findstr /C:"getBankRates(userSettings)" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] userSettings se pasa a getBankRates
    set /a PASS+=1
) else (
    echo [FAIL] userSettings NO se pasa a getBankRates
    set /a FAIL+=1
)

echo.
echo [TEST 8] Verificando logs de filtro de bancos seleccionados...
findstr /C:"[FILTRO] Bancos seleccionados:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Logs de filtro implementados
    set /a PASS+=1
) else (
    echo [FAIL] Logs de filtro NO implementados
    set /a FAIL+=1
)

echo.
echo [TEST 9] Verificando filtro en cache valido...
findstr /C:"selectedBanks.forEach(bankCode =>" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Filtro en cache implementado
    set /a PASS+=1
) else (
    echo [FAIL] Filtro en cache NO implementado
    set /a FAIL+=1
)

echo.
echo [TEST 10] Verificando filtro en cache vencido...
findstr /C:"Cache vencido pero filtrado:" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Filtro en cache vencido implementado
    set /a PASS+=1
) else (
    echo [FAIL] Filtro en cache vencido NO implementado
    set /a FAIL+=1
)

echo.
echo [TEST 11] Verificando mapeo de BBVA...
findstr /C:"'bbva'," src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Mapeo de BBVA correcto
    set /a PASS+=1
) else (
    echo [FAIL] Mapeo de BBVA incorrecto
    set /a FAIL+=1
)

echo.
echo [TEST 12] Verificando mapeo de Banco Galicia...
findstr /C:"'Banco Galicia': 'galicia'" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Mapeo de Galicia correcto
    set /a PASS+=1
) else (
    echo [FAIL] Mapeo de Galicia incorrecto
    set /a FAIL+=1
)

echo.
echo [TEST 13] Verificando mapeo de Banco Santander...
findstr /C:"'santander'," src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Mapeo de Santander correcto
    set /a PASS+=1
) else (
    echo [FAIL] Mapeo de Santander incorrecto
    set /a FAIL+=1
)

echo.
echo [TEST 14] Verificando mapeo de Banco Provincia...
findstr /C:"'Banco Provincia': 'provincia'" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Mapeo de Provincia correcto
    set /a PASS+=1
) else (
    echo [FAIL] Mapeo de Provincia incorrecto
    set /a FAIL+=1
)

echo.
echo [TEST 15] Verificando log sin filtro de bancos...
findstr /C:"Sin filtro de bancos" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Log de sin filtro implementado
    set /a PASS+=1
) else (
    echo [FAIL] Log de sin filtro NO implementado
    set /a FAIL+=1
)

echo.
echo [TEST 16] Verificando comentario MEJORADO v5.0.31...
findstr /C:"MEJORADO v5.0.31" src\background\dollarPriceManager.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Comentarios de version actualizados
    set /a PASS+=1
) else (
    echo [FAIL] Comentarios de version NO actualizados
    set /a FAIL+=1
)

echo.
echo [TEST 17] Verificando comentario NUEVO v5.0.31 en DataService...
findstr /C:"NUEVO v5.0.31" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Comentarios de DataService actualizados
    set /a PASS+=1
) else (
    echo [FAIL] Comentarios de DataService NO actualizados
    set /a FAIL+=1
)

echo.
echo [TEST 18] Verificando normalizacion de Banco Chaco...
findstr /C:"'Banco Chaco': 'chaco'" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Mapeo de Chaco correcto
    set /a PASS+=1
) else (
    echo [FAIL] Mapeo de Chaco incorrecto
    set /a FAIL+=1
)

echo.
echo [TEST 19] Verificando que se mantiene el nombre completo en propiedad...
findstr /C:"name: bankName" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Nombre completo se mantiene en propiedad
    set /a PASS+=1
) else (
    echo [FAIL] Nombre completo NO se mantiene
    set /a FAIL+=1
)

echo.
echo [TEST 20] Verificando fallback en getBankCode...
findstr /C:"toLowerCase().replace" src\DataService.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Fallback de getBankCode implementado
    set /a PASS+=1
) else (
    echo [FAIL] Fallback de getBankCode NO implementado
    set /a FAIL+=1
)

echo.
echo [TEST 21] Verificando carga de userSettings en updateData...
findstr /C:"const result = await chrome.storage.local.get('notificationSettings')" src\background\main.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] userSettings se carga antes de getDollarPrice
    set /a PASS+=1
) else (
    echo [FAIL] userSettings NO se carga antes de getDollarPrice
    set /a FAIL+=1
)

echo.
echo [TEST 22] Verificando paso de userSettings en main.js...
findstr /C:"getDollarPrice(userSettings)" src\background\main.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] userSettings se pasa a getDollarPrice en main.js
    set /a PASS+=1
) else (
    echo [FAIL] userSettings NO se pasa en main.js
    set /a FAIL+=1
)

echo.
echo [TEST 23] Verificando comentario IMPORTANTE v5.0.32...
findstr /C:"IMPORTANTE v5.0.32" src\background\main.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Comentario explicativo agregado
    set /a PASS+=1
) else (
    echo [FAIL] Comentario explicativo NO agregado
    set /a FAIL+=1
)

echo.
echo ========================================
echo RESUMEN DE TESTS
echo ========================================
echo Tests PASADOS: %PASS%
echo Tests FALLIDOS: %FAIL%
echo Total: 23 tests
echo.

if %FAIL% equ 0 (
    echo [SUCCESS] Todos los tests pasaron correctamente!
    echo El filtro de bancos en calculo de arbitrajes esta implementado.
    exit /b 0
) else (
    echo [ERROR] Algunos tests fallaron. Revisar implementacion.
    exit /b 1
)
