@echo off
REM Test script para validar Hotfix V5.0.22 - CriptoYa Banks Integration
REM Fecha: 9 de octubre de 2025

echo ========================================
echo TEST HOTFIX V5.0.22 - CRIPTOYA INTEGRATION
echo ========================================
echo.

set "PASSED=0"
set "FAILED=0"

REM Test 1: Verificar que existe fetchCriptoYaBankRates en DataService.js
echo [TEST 1] Verificar metodo fetchCriptoYaBankRates existe...
findstr /C:"fetchCriptoYaBankRates" src\DataService.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] fetchCriptoYaBankRates encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] fetchCriptoYaBankRates NO encontrado
    set /a FAILED+=1
)

REM Test 2: Verificar que existe fetchCombinedBankRates en DataService.js
echo [TEST 2] Verificar metodo fetchCombinedBankRates existe...
findstr /C:"fetchCombinedBankRates" src\DataService.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] fetchCombinedBankRates encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] fetchCombinedBankRates NO encontrado
    set /a FAILED+=1
)

REM Test 3: Verificar que dollarPriceManager usa fetchCombinedBankRates
echo [TEST 3] Verificar dollarPriceManager usa fetchCombinedBankRates...
findstr /C:"fetchCombinedBankRates" src\background\dollarPriceManager.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] dollarPriceManager usa fetchCombinedBankRates
    set /a PASSED+=1
) else (
    echo [FAIL] dollarPriceManager NO usa fetchCombinedBankRates
    set /a FAILED+=1
)

REM Test 4: Verificar que popup.js tiene bank-price-alt
echo [TEST 4] Verificar popup.js muestra precios alternativos...
findstr /C:"bank-price-alt" src\popup.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] popup.js muestra bank-price-alt
    set /a PASSED+=1
) else (
    echo [FAIL] popup.js NO muestra bank-price-alt
    set /a FAILED+=1
)

REM Test 5: Verificar que popup.css tiene estilos para bank-price-alt
echo [TEST 5] Verificar estilos bank-price-alt en popup.css...
findstr /C:".bank-price-alt" src\popup.css >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Estilos bank-price-alt encontrados
    set /a PASSED+=1
) else (
    echo [FAIL] Estilos bank-price-alt NO encontrados
    set /a FAILED+=1
)

REM Test 6: Verificar que popup.html menciona CriptoYa
echo [TEST 6] Verificar popup.html menciona CriptoYa...
findstr /C:"CriptoYa" src\popup.html >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] popup.html menciona CriptoYa
    set /a PASSED+=1
) else (
    echo [FAIL] popup.html NO menciona CriptoYa
    set /a FAILED+=1
)

REM Test 7: Verificar version 5.0.22 en manifest.json
echo [TEST 7] Verificar version 5.0.22 en manifest.json...
findstr /C:"5.0.22" manifest.json >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Version 5.0.22 encontrada
    set /a PASSED+=1
) else (
    echo [FAIL] Version 5.0.22 NO encontrada
    set /a FAILED+=1
)

REM Test 8: Verificar que README tiene enlaces a DOCS_INDEX
echo [TEST 8] Verificar README enlaza a DOCS_INDEX...
findstr /C:"DOCS_INDEX.md" README.md >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] README enlaza a DOCS_INDEX
    set /a PASSED+=1
) else (
    echo [FAIL] README NO enlaza a DOCS_INDEX
    set /a FAILED+=1
)

REM Test 9: Verificar que existe docs/DOCS_INDEX.md
echo [TEST 9] Verificar docs/DOCS_INDEX.md existe...
if exist "docs\DOCS_INDEX.md" (
    echo [PASS] docs/DOCS_INDEX.md existe
    set /a PASSED+=1
) else (
    echo [FAIL] docs/DOCS_INDEX.md NO existe
    set /a FAILED+=1
)

REM Test 10: Verificar que existe docs/HOTFIX_SUMMARY.md
echo [TEST 10] Verificar docs/HOTFIX_SUMMARY.md existe...
if exist "docs\HOTFIX_SUMMARY.md" (
    echo [PASS] docs/HOTFIX_SUMMARY.md existe
    set /a PASSED+=1
) else (
    echo [FAIL] docs/HOTFIX_SUMMARY.md NO existe
    set /a FAILED+=1
)

REM Test 11: Verificar que existe HOTFIX_V5.0.22
echo [TEST 11] Verificar HOTFIX_V5.0.22 existe...
if exist "HOTFIX_V5.0.22_CRIPTOYA_BANKS_INTEGRATION.md" (
    echo [PASS] HOTFIX_V5.0.22 existe
    set /a PASSED+=1
) else (
    echo [FAIL] HOTFIX_V5.0.22 NO existe
    set /a FAILED+=1
)

REM Test 12: Verificar que normalizeBankName existe
echo [TEST 12] Verificar normalizeBankName existe...
findstr /C:"normalizeBankName" src\DataService.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] normalizeBankName encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] normalizeBankName NO encontrado
    set /a FAILED+=1
)

REM Test 13: Verificar que bancos nuevos están en getBankDisplayName
echo [TEST 13] Verificar bancos nuevos (ICBC, Bind, etc.)...
findstr /C:"icbc" src\popup.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Bancos nuevos encontrados en popup.js
    set /a PASSED+=1
) else (
    echo [FAIL] Bancos nuevos NO encontrados en popup.js
    set /a FAILED+=1
)

REM Test 14: Verificar que archivos antiguos fueron movidos a docs/archive
echo [TEST 14] Verificar docs/archive/hotfixes existe...
if exist "docs\archive\hotfixes" (
    echo [PASS] docs/archive/hotfixes existe
    set /a PASSED+=1
) else (
    echo [FAIL] docs/archive/hotfixes NO existe
    set /a FAILED+=1
)

REM Test 15: Verificar que URL de CriptoYa está en DataService
echo [TEST 15] Verificar URL api/bancostodos en DataService...
findstr /C:"api/bancostodos" src\DataService.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] URL api/bancostodos encontrada
    set /a PASSED+=1
) else (
    echo [FAIL] URL api/bancostodos NO encontrada
    set /a FAILED+=1
)

echo.
echo ========================================
echo RESULTADOS DEL TEST
echo ========================================
echo Tests PASADOS: %PASSED%
echo Tests FALLIDOS: %FAILED%
echo.

if %FAILED% EQU 0 (
    echo [SUCCESS] Todos los tests pasaron! V5.0.22 validado.
    exit /b 0
) else (
    echo [WARNING] Algunos tests fallaron. Revisar implementacion.
    exit /b 1
)
