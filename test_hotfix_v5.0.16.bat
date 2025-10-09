@echo off
echo ========================================
echo TESTING HOTFIX V5.0.16 - DOLLAR PRICE FIXES
echo ========================================
echo.

echo 🔍 Verificando correcciones implementadas...
echo.

REM Test 1: Verificar que DataService exporte la clase
echo ✅ Test 1: Verificación de export DataService
findstr /C:"export { DataService }" "src\DataService.js" >nul
if %errorlevel%==0 (
    echo    ✓ DataService se exporta correctamente
) else (
    echo    ❌ ERROR: DataService no se exporta
)
echo.

REM Test 2: Verificar que dollarPriceManager importe DataService
echo ✅ Test 2: Verificación de import en dollarPriceManager
findstr /C:"import { DataService }" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ DollarPriceManager importa DataService correctamente
) else (
    echo    ❌ ERROR: DollarPriceManager no importa DataService
)
echo.

REM Test 3: Verificar que dollarPriceManager crea instancia local
echo ✅ Test 3: Verificación de instancia local de DataService  
findstr /C:"this.dataService = new DataService()" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ DollarPriceManager crea instancia local correctamente
) else (
    echo    ❌ ERROR: DollarPriceManager no crea instancia local
)
echo.

REM Test 4: Verificar que se corrigieron las referencias self.dataService
echo ✅ Test 4: Verificación de corrección de referencias self.dataService
findstr /C:"self.dataService" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==1 (
    echo    ✓ Referencias self.dataService corregidas
) else (
    echo    ❌ ERROR: Aún hay referencias a self.dataService
)
echo.

REM Test 5: Verificar que se usa this.dataService
echo ✅ Test 5: Verificación de uso correcto this.dataService
findstr /C:"this.dataService.fetchDolaritoBankRates" "src\background\dollarPriceManager.js" >nul
if %errorlevel%==0 (
    echo    ✓ Se usa this.dataService.fetchDolaritoBankRates correctamente
) else (
    echo    ❌ ERROR: No se usa this.dataService.fetchDolaritoBankRates
)
echo.

REM Test 6: Verificar eliminación del límite de 200 USD
echo ✅ Test 6: Verificación de eliminación del límite 200 USD
findstr /C:"USD 200 por persona" "src\popup.js" >nul
if %errorlevel%==1 (
    echo    ✓ Mensaje del límite 200 USD eliminado
) else (
    echo    ❌ ERROR: Aún existe mensaje del límite 200 USD
)
echo.

REM Test 7: Verificar nuevo mensaje sobre límites
echo ✅ Test 7: Verificación de nuevo mensaje sobre límites
findstr /C:"tu banco" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Nuevo mensaje sobre límites bancarios presente
) else (
    echo    ❌ ERROR: Nuevo mensaje sobre límites no encontrado
)
echo.

echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo 📝 Pasos de testing manual recomendados:
echo    1. Cargar la extensión en Chrome
echo    2. Abrir popup y verificar que no aparecen timeouts
echo    3. Configurar precio manual del dólar en opciones
echo    4. Verificar que el precio se refleje en el primer paso
echo    5. Confirmar que no aparece el límite de 200 USD
echo.
pause