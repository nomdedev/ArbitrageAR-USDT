@echo off
echo ========================================
echo    TESTING HOTFIX V5.0.14
echo    Precision USD/USDT - 3 Decimales
echo ========================================
echo.

echo 1. Verificando funcion formatUsdUsdtRatio...
findstr /C:"formatUsdUsdtRatio" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ formatUsdUsdtRatio añadida
) else (
    echo ❌ formatUsdUsdtRatio NO encontrada
)

echo.
echo 2. Verificando funcion formatCommissionPercent...
findstr /C:"formatCommissionPercent" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ formatCommissionPercent añadida
) else (
    echo ❌ formatCommissionPercent NO encontrada
)

echo.
echo 3. Verificando uso de formatUsdUsdtRatio en tarjetas...
findstr /C:"formatUsdUsdtRatio(arb.usdToUsdtRate)" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ formatUsdUsdtRatio usada en tarjetas de arbitraje
) else (
    echo ❌ formatUsdUsdtRatio NO usada en tarjetas
)

echo.
echo 4. Verificando uso en guía paso a paso...
findstr /C:"formatUsdUsdtRatio(usdToUsdtRate)" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ formatUsdUsdtRatio usada en guía
) else (
    echo ❌ formatUsdUsdtRatio NO usada en guía
)

echo.
echo 5. Verificando uso de formatCommissionPercent...
findstr /C:"formatCommissionPercent" src\popup.js | findstr /C:"usdToUsdtRate - 1" >nul
if %errorlevel%==0 (
    echo ✅ formatCommissionPercent usada para comisiones
) else (
    echo ❌ formatCommissionPercent NO usada para comisiones
)

echo.
echo 6. Verificando threshold mejorado...
findstr /C:"1.005" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Threshold mejorado a 1.005 (0.5%%)
) else (
    echo ❌ Threshold NO actualizado
)

echo.
echo 7. Verificando que la API mantiene precision...
findstr /C:"https://criptoya.com/api/usdt/usd/1" src\DataService.js >nul
if %errorlevel%==0 (
    echo ✅ API de CriptoYA configurada correctamente
) else (
    echo ❌ API de CriptoYA NO encontrada
)

echo.
echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo Para testing manual:
echo 1. Cargar la extensión en Chrome
echo 2. Verificar que los ratios USD/USDT muestren 3 decimales
echo 3. Ejemplo esperado: "1.049 USD/USDT" en lugar de "1.05 USD/USDT"
echo 4. Verificar comisiones con mayor precision
echo 5. Comprobar que umbrales sean mas sensibles
echo.
pause