@echo off
echo ========================================
echo TESTING HOTFIX V5.0.20 - UPDATE NOTIFIER
echo ========================================
echo.

echo 🔍 Verificando implementación del sistema de notificaciones...
echo.

REM Test 1: Verificar creación de updateChecker.js
echo ✅ Test 1: Verificación de updateChecker.js
if exist "src\background\updateChecker.js" (
    echo    ✓ Archivo updateChecker.js creado
) else (
    echo    ❌ ERROR: updateChecker.js no encontrado
)
echo.

REM Test 2: Verificar import en main.js
echo ✅ Test 2: Verificación de import en main.js
findstr /C:"import { updateChecker }" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ updateChecker importado en main.js
) else (
    echo    ❌ ERROR: Import de updateChecker no encontrado
)
echo.

REM Test 3: Verificar inicialización en main.js
echo ✅ Test 3: Verificación de inicialización
findstr /C:"updateChecker.initialize()" "src\background\main.js" >nul
if %errorlevel%==0 (
    echo    ✓ updateChecker.initialize() presente
) else (
    echo    ❌ ERROR: Inicialización no encontrada
)
echo.

REM Test 4: Verificar banner HTML
echo ✅ Test 4: Verificación de banner HTML
findstr /C:"update-banner" "src\popup.html" >nul
if %errorlevel%==0 (
    echo    ✓ Banner HTML presente en popup
) else (
    echo    ❌ ERROR: Banner HTML no encontrado
)
echo.

REM Test 5: Verificar estilos CSS
echo ✅ Test 5: Verificación de estilos CSS
findstr /C:".update-banner" "src\popup.css" >nul
if %errorlevel%==0 (
    echo    ✓ Estilos del banner presentes
) else (
    echo    ❌ ERROR: Estilos del banner no encontrados
)
echo.

REM Test 6: Verificar función checkForUpdates en popup.js
echo ✅ Test 6: Verificación de checkForUpdates
findstr /C:"checkForUpdates" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Función checkForUpdates implementada
) else (
    echo    ❌ ERROR: checkForUpdates no encontrada
)
echo.

REM Test 7: Verificar función showUpdateBanner
echo ✅ Test 7: Verificación de showUpdateBanner
findstr /C:"showUpdateBanner" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Función showUpdateBanner implementada
) else (
    echo    ❌ ERROR: showUpdateBanner no encontrada
)
echo.

REM Test 8: Verificar setupUpdateBannerButtons
echo ✅ Test 8: Verificación de setupUpdateBannerButtons
findstr /C:"setupUpdateBannerButtons" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Función setupUpdateBannerButtons implementada
) else (
    echo    ❌ ERROR: setupUpdateBannerButtons no encontrada
)
echo.

REM Test 9: Verificar GitHub API endpoint
echo ✅ Test 9: Verificación de GitHub API
findstr /C:"api.github.com/repos" "src\background\updateChecker.js" >nul
if %errorlevel%==0 (
    echo    ✓ GitHub API endpoint configurado
) else (
    echo    ❌ ERROR: GitHub API endpoint no encontrado
)
echo.

REM Test 10: Verificar intervalo de verificación (6 horas)
echo ✅ Test 10: Verificación de intervalo
findstr /C:"6 * 60 * 60 * 1000" "src\background\updateChecker.js" >nul
if %errorlevel%==0 (
    echo    ✓ Intervalo de 6 horas configurado
) else (
    echo    ❌ ERROR: Intervalo no configurado correctamente
)
echo.

echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo 📝 Pasos de testing manual:
echo    1. Cargar la extensión en Chrome
echo    2. Verificar en console que updateChecker se inicializa
echo    3. Hacer un commit y push al repositorio
echo    4. Esperar o forzar verificación (recargar extensión)
echo    5. Abrir popup - debe aparecer banner verde arriba
echo    6. Click en "Ver cambios" - debe abrir GitHub
echo    7. Click en "X" - banner debe desaparecer
echo    8. Reabrir popup - banner NO debe aparecer
echo.
echo 💡 Para testing rápido:
echo    - En DevTools console del background:
echo      updateChecker.forceCheck()
echo    - Luego abrir popup para ver banner
echo.
pause
