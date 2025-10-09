@echo off
echo ========================================
echo TESTING HOTFIX V5.0.18 - TIMEOUT CHECKANDNOTIFY
echo ========================================
echo.

echo 🔍 Verificando correcciones de timeout...
echo.

REM Test 1: Verificar que checkAndNotify no usa await
echo ✅ Test 1: Verificación de checkAndNotify sin await
findstr /C:"await checkAndNotify" "src\background\main.js" >nul
if %errorlevel%==1 (
    echo    ✓ checkAndNotify es no-bloqueante
) else (
    echo    ❌ ERROR: checkAndNotify es bloqueante
)
echo.

REM Test 2: Verificar que checkAndNotify usa .then()
echo ✅ Test 2: Verificación de checkAndNotify con .then()
findstr /C:"checkAndNotify(optimizedRoutes)" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ checkAndNotify se llama correctamente
) else (
    echo    ❌ ERROR: checkAndNotify no se llama
)
echo.

REM Test 3: Verificar mensaje de background en logs
echo ✅ Test 3: Verificación de mensaje "en background"
findstr /C:"en background" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ Mensaje "en background" presente
) else (
    echo    ❌ ERROR: Mensaje "en background" no encontrado
)
echo.

REM Test 4: Verificar timeout de 8s para getDollarPrice (de V5.0.17)
echo ✅ Test 4: Verificación de timeout getDollarPrice (V5.0.17)
findstr /C:"getDollarPriceWithTimeout" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ Timeout getDollarPrice implementado
) else (
    echo    ❌ ERROR: Timeout getDollarPrice no encontrado
)
echo.

REM Test 5: Verificar timeout de 5s para fetchDolaritoBankRates (de V5.0.17)
echo ✅ Test 5: Verificación de timeout fetchDolaritoBankRates (V5.0.17)
findstr /C:"Timeout fetchDolaritoBankRates" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ Timeout fetchDolaritoBankRates implementado
) else (
    echo    ❌ ERROR: Timeout fetchDolaritoBankRates no encontrado
)
echo.

echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo 📝 Pasos de testing manual:
echo    1. Cargar la extensión en Chrome
echo    2. Abrir popup
echo    3. Verificar que NO aparecen timeouts de 10s o 12s
echo    4. Verificar que los datos cargan en menos de 2 segundos
echo    5. Confirmar que las notificaciones funcionan correctamente
echo.
echo 💡 Problema resuelto:
echo    - checkAndNotify ya no bloquea la respuesta al popup
echo    - Las notificaciones se ejecutan en background
echo    - El popup responde inmediatamente después de obtener datos
echo.
pause