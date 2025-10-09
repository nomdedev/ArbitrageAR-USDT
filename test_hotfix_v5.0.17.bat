@echo off
echo ========================================
echo TESTING HOTFIX V5.0.17 - PRECIO DOLAR CONSISTENTE
echo ========================================
echo.

echo 🔍 Verificando correcciones del precio del dólar...
echo.

REM Test 1: Verificar que dollarPriceManager usa precio de venta correctamente
echo ✅ Test 1: Verificación de precio de venta en dollarPriceManager
findstr /C:"venta: manualPrice" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ DollarPriceManager usa precio de venta correctamente
) else (
    echo    ❌ ERROR: DollarPriceManager no usa precio de venta
)
echo.

REM Test 2: Verificar comentario sobre precio de VENTA
echo ✅ Test 2: Verificación de comentario sobre precio de VENTA
findstr /C:"VENTA" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ Comentario sobre precio de VENTA presente
) else (
    echo    ❌ ERROR: Comentario sobre precio de VENTA no encontrado
)
echo.

REM Test 3: Verificar que popup muestra officialData.venta
echo ✅ Test 3: Verificación de mostrar precio de venta en popup
findstr /C:"officialData.venta" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Popup muestra precio de venta correctamente
) else (
    echo    ❌ ERROR: Popup no muestra precio de venta
)
echo.

REM Test 4: Verificar que se añadió método invalidateCache
echo ✅ Test 4: Verificación de método invalidateCache
findstr /C:"invalidateCache()" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ Método invalidateCache presente
) else (
    echo    ❌ ERROR: Método invalidateCache no encontrado
)
echo.

REM Test 5: Verificar que main.js llama invalidateCache
echo ✅ Test 5: Verificación de llamada a invalidateCache en main.js
findstr /C:"dollarPriceManager.invalidateCache" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ Main.js llama invalidateCache correctamente
) else (
    echo    ❌ ERROR: Main.js no llama invalidateCache
)
echo.

REM Test 6: Verificar log con precio de VENTA
echo ✅ Test 6: Verificación de log con precio de VENTA
findstr /C:"VENTA:" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ Log con precio de VENTA presente
) else (
    echo    ❌ ERROR: Log con precio de VENTA no encontrado
)
echo.

REM Test 7: Verificar timeout en getDollarPrice
echo ✅ Test 7: Verificación de timeout en getDollarPrice
findstr /C:"getDollarPriceWithTimeout" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ Timeout para getDollarPrice implementado
) else (
    echo    ❌ ERROR: Timeout para getDollarPrice no encontrado
)
echo.

REM Test 8: Verificar timeout en fetchDolaritoBankRates
echo ✅ Test 8: Verificación de timeout en fetchDolaritoBankRates
findstr /C:"Timeout fetchDolaritoBankRates" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ Timeout para fetchDolaritoBankRates implementado
) else (
    echo    ❌ ERROR: Timeout para fetchDolaritoBankRates no encontrado
)
echo.

echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo 📝 Pasos de testing manual:
echo    1. Configurar precio manual del dólar: $1460
echo    2. Verificar que en "Fuente" aparezca: $1.460
echo    3. Verificar que en el primer paso aparezca: $1.460,00/USD
echo    4. Ambos valores deben ser exactamente iguales
echo    5. NO deben aparecer errores de timeout en console
echo.
echo 💡 Concepto clave:
echo    - El usuario configura el PRECIO DE VENTA del dólar ($1460)
echo    - Este es lo que cuesta comprar 1 USD
echo    - Se usa en todos los cálculos de arbitraje
echo.
pause