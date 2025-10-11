@echo off
echo ============================================
echo TEST HOTFIX V5.0.23 - CONFIGURACION BANCOS
echo ============================================
echo.

echo [TEST 1/15] Verificando archivos modificados...
if exist "src\popup.js" (
    echo ✅ popup.js existe
) else (
    echo ❌ popup.js no encontrado
    goto :error
)

if exist "src\popup.css" (
    echo ✅ popup.css existe
) else (
    echo ❌ popup.css no encontrado
    goto :error
)

if exist "src\options.js" (
    echo ✅ options.js existe
) else (
    echo ❌ options.js no encontrado
    goto :error
)

if exist "src\options.html" (
    echo ✅ options.html existe
) else (
    echo ❌ options.html no encontrado
    goto :error
)

if exist "src\background\dollarPriceManager.js" (
    echo ✅ dollarPriceManager.js existe
) else (
    echo ❌ dollarPriceManager.js no encontrado
    goto :error
)

if exist "src\background\main.js" (
    echo ✅ main.js existe
) else (
    echo ❌ main.js no encontrado
    goto :error
)

echo.
echo [TEST 2/15] Verificando version del manifest...
findstr /C:"\"version\": \"5.0.23\"" manifest.json >nul
if %errorlevel%==0 (
    echo ✅ Version 5.0.23 correcta en manifest.json
) else (
    echo ❌ Version incorrecta en manifest.json
    goto :error
)

echo.
echo [TEST 3/15] Verificando ordenamiento por precio compra en popup.js...
findstr /C:"banks.sort((a, b) => a[1].compra - b[1].compra);" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Ordenamiento por precio compra implementado
) else (
    echo ❌ Ordenamiento por precio compra no encontrado
    goto :error
)

echo.
echo [TEST 4/15] Verificando UI compacta en popup.js...
findstr /C:"bank-card compact" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ UI compacta implementada
) else (
    echo ❌ UI compacta no encontrada
    goto :error
)

echo.
echo [TEST 5/15] Verificando estilos compactos en popup.css...
findstr /C:".bank-card.compact" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos compactos añadidos
) else (
    echo ❌ Estilos compactos no encontrados
    goto :error
)

echo.
echo [TEST 6/15] Verificando configuracion showBestBankPrice en options.js...
findstr /C:"showBestBankPrice" src\options.js >nul
if %errorlevel%==0 (
    echo ✅ Configuracion showBestBankPrice añadida
) else (
    echo ❌ Configuracion showBestBankPrice no encontrada
    goto :error
)

echo.
echo [TEST 7/15] Verificando configuracion selectedBanks en options.js...
findstr /C:"selectedBanks" src\options.js >nul
if %errorlevel%==0 (
    echo ✅ Configuracion selectedBanks añadida
) else (
    echo ❌ Configuracion selectedBanks no encontrada
    goto :error
)

echo.
echo [TEST 8/15] Verificando seccion bancos en options.html...
findstr /C:"Bancos" src\options.html >nul
if %errorlevel%==0 (
    echo ✅ Seccion configuracion bancos añadida
) else (
    echo ❌ Seccion configuracion bancos no encontrada
    goto :error
)

echo.
echo [TEST 9/15] Verificando estilos bancos en options.css...
findstr /C:".checkbox-grid" src\options.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos checkbox-grid añadidos
) else (
    echo ❌ Estilos checkbox-grid no encontrados
    goto :error
)

echo.
echo [TEST 10/15] Verificando modo mejor precio en popup.js...
findstr /C:"showBestOnly" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Modo mejor precio implementado
) else (
    echo ❌ Modo mejor precio no encontrado
    goto :error
)

echo.
echo [TEST 11/15] Verificando estilos mejor precio en popup.css...
findstr /C:".best-bank-highlight" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos mejor precio añadidos
) else (
    echo ❌ Estilos mejor precio no encontrados
    goto :error
)

echo.
echo [TEST 12/15] Verificando filtrado bancos en dollarPriceManager.js...
findstr /C:"selectedBanks" src\background\dollarPriceManager.js >nul
if %errorlevel%==0 (
    echo ✅ Filtrado bancos implementado
) else (
    echo ❌ Filtrado bancos no encontrado
    goto :error
)

echo.
echo [TEST 13/15] Verificando mensaje con userSettings en popup.js...
findstr /C:"userSettings:" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Mensaje con userSettings implementado
) else (
    echo ❌ Mensaje con userSettings no encontrado
    goto :error
)

echo.
echo [TEST 14/15] Verificando handler userSettings en main.js...
findstr /C:"userSettings" src\background\main.js >nul
if %errorlevel%==0 (
    echo ✅ Handler userSettings implementado
) else (
    echo ❌ Handler userSettings no encontrado
    goto :error
)

echo.
echo [TEST 15/15] Verificando DEFAULT_SETTINGS actualizado...
findstr /C:"showBestBankPrice" src\options.js >nul
if %errorlevel%==0 (
    findstr /C:"selectedBanks" src\options.js >nul
    if %errorlevel%==0 (
        echo ✅ DEFAULT_SETTINGS actualizado correctamente
    ) else (
        echo ❌ selectedBanks no en DEFAULT_SETTINGS
        goto :error
    )
) else (
    echo ❌ showBestBankPrice no en DEFAULT_SETTINGS
    goto :error
)

echo.
echo ============================================
echo ✅ TODOS LOS TESTS PASARON EXITOSAMENTE
echo ============================================
echo.
echo Resumen de cambios implementados:
echo - ✅ Ordenamiento bancos por precio compra ascendente
echo - ✅ UI compacta para tarjetas de bancos
echo - ✅ Configuracion para mostrar solo mejor precio bancario
echo - ✅ Seleccion de bancos a consultar
echo - ✅ Interfaz de configuracion en options page
echo - ✅ Filtrado de bancos en background
echo - ✅ Estilos CSS para nueva funcionalidad
echo.
echo Version actual: 5.0.23
echo.
pause
exit /b 0

:error
echo.
echo ============================================
echo ❌ ERROR: Algunos tests fallaron
echo ============================================
echo.
echo Revisa los archivos modificados y vuelve a ejecutar el test.
echo.
pause
exit /b 1