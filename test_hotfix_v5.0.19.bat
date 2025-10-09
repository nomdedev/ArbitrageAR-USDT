@echo off
echo ========================================
echo TESTING HOTFIX V5.0.19 - PESTAÑA BANCOS DOLARITO.AR
echo ========================================
echo.

echo 🔍 Verificando implementación de pestaña de bancos...
echo.

REM Test 1: Verificar controles de bancos en HTML
echo ✅ Test 1: Verificación de controles de bancos en HTML
findstr /C:"refresh-banks" "src\popup.html" >nul
if %errorlevel%==0 (
    echo    ✓ Botón de refresh presente en HTML
) else (
    echo    ❌ ERROR: Botón de refresh no encontrado
)
echo.

REM Test 2: Verificar timestamp de bancos en HTML
echo ✅ Test 2: Verificación de timestamp de bancos
findstr /C:"banks-last-update" "src\popup.html" >nul
if %errorlevel%==0 (
    echo    ✓ Timestamp de bancos presente
) else (
    echo    ❌ ERROR: Timestamp de bancos no encontrado
)
echo.

REM Test 3: Verificar estilos de controles de bancos
echo ✅ Test 3: Verificación de estilos de controles
findstr /C:".banks-controls" "src\popup.css" >nul
if %errorlevel%==0 (
    echo    ✓ Estilos de controles de bancos presentes
) else (
    echo    ❌ ERROR: Estilos de controles no encontrados
)
echo.

REM Test 4: Verificar función loadBankRates en popup.js
echo ✅ Test 4: Verificación de función loadBankRates
findstr /C:"loadBankRates" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Función loadBankRates implementada
) else (
    echo    ❌ ERROR: Función loadBankRates no encontrada
)
echo.

REM Test 5: Verificar función getBankDisplayName
echo ✅ Test 5: Verificación de función getBankDisplayName
findstr /C:"getBankDisplayName" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Función getBankDisplayName implementada
) else (
    echo    ❌ ERROR: Función getBankDisplayName no encontrada
)
echo.

REM Test 6: Verificar handler getBankRates en background
echo ✅ Test 6: Verificación de handler getBankRates
findstr /C:"getBankRates" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ Handler getBankRates implementado en background
) else (
    echo    ❌ ERROR: Handler getBankRates no encontrado
)
echo.

REM Test 7: Verificar que displayBanks muestra spread
echo ✅ Test 7: Verificación de cálculo de spread
findstr /C:"spreadPercent" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Cálculo de spread implementado
) else (
    echo    ❌ ERROR: Cálculo de spread no encontrado
)
echo.

REM Test 8: Verificar event listener del botón refresh
echo ✅ Test 8: Verificación de event listener
findstr /C:"addEventListener('click', loadBankRates)" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Event listener del botón refresh implementado
) else (
    echo    ❌ ERROR: Event listener no encontrado
)
echo.

echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo 📝 Pasos de testing manual:
echo    1. Cargar la extensión en Chrome
echo    2. Abrir popup y ir a la pestaña "Bancos"
echo    3. Verificar que aparece botón "Actualizar"
echo    4. Click en "Actualizar" - debe mostrar cotizaciones de bancos
echo    5. Verificar que se muestra spread para cada banco
echo    6. Confirmar timestamp de actualización
echo.
echo 💡 Funcionalidad implementada:
echo    - Pestaña Bancos muestra cotizaciones de dolarito.ar
echo    - Botón de refresh para actualizar datos
echo    - Cálculo automático de spread por banco
echo    - Timestamp de última actualización
echo    - Nombres legibles para cada banco
echo.
pause