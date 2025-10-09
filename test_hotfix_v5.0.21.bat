@echo off
echo ========================================
echo TESTING HOTFIX V5.0.21 - VERSION INDICATOR
echo ========================================
echo.

echo 🔍 Verificando indicador de versión...
echo.

REM Test 1: Verificar versión actualizada en manifest
echo ✅ Test 1: Verificación de versión en manifest.json
findstr /C:"\"version\": \"5.0.20\"" "manifest.json" >nul
if %errorlevel%==0 (
    echo    ✓ Versión actualizada a 5.0.20 en manifest.json
) else (
    echo    ❌ ERROR: Versión no actualizada en manifest.json
)
echo.

REM Test 2: Verificar indicador de versión en HTML
echo ✅ Test 2: Verificación de indicador en popup.html
findstr /C:"version-indicator" "src\popup.html" >nul
if %errorlevel%==0 (
    echo    ✓ Indicador de versión presente en HTML
) else (
    echo    ❌ ERROR: Indicador de versión no encontrado
)
echo.

REM Test 3: Verificar texto de versión en HTML
echo ✅ Test 3: Verificación de texto v5.0.20
findstr /C:"v5.0.20" "src\popup.html" >nul
if %errorlevel%==0 (
    echo    ✓ Texto de versión v5.0.20 presente
) else (
    echo    ❌ ERROR: Texto de versión no encontrado
)
echo.

REM Test 4: Verificar estilos del indicador
echo ✅ Test 4: Verificación de estilos CSS
findstr /C:".version-indicator" "src\popup.css" >nul
if %errorlevel%==0 (
    echo    ✓ Estilos de indicador de versión presentes
) else (
    echo    ❌ ERROR: Estilos de indicador no encontrados
)
echo.

REM Test 5: Verificar comparación de versiones en banner
echo ✅ Test 5: Verificación de comparación de versiones
findstr /C:"update-version-info" "src\popup.html" >nul
if %errorlevel%==0 (
    echo    ✓ Sección de comparación de versiones presente
) else (
    echo    ❌ ERROR: Comparación de versiones no encontrada
)
echo.

REM Test 6: Verificar current-version y new-version
echo ✅ Test 6: Verificación de elementos de versión
findstr /C:"current-version" "src\popup.html" >nul
if %errorlevel%==0 (
    findstr /C:"new-version" "src\popup.html" >nul
    if %errorlevel%==0 (
        echo    ✓ Elementos current-version y new-version presentes
    ) else (
        echo    ❌ ERROR: new-version no encontrado
    )
) else (
    echo    ❌ ERROR: current-version no encontrado
)
echo.

REM Test 7: Verificar flecha de versión
echo ✅ Test 7: Verificación de flecha de versión
findstr /C:"version-arrow" "src\popup.html" >nul
if %errorlevel%==0 (
    echo    ✓ Flecha de versión presente
) else (
    echo    ❌ ERROR: Flecha de versión no encontrada
)
echo.

REM Test 8: Verificar estilos de comparación
echo ✅ Test 8: Verificación de estilos de comparación
findstr /C:".update-version-info" "src\popup.css" >nul
if %errorlevel%==0 (
    echo    ✓ Estilos de comparación de versiones presentes
) else (
    echo    ❌ ERROR: Estilos de comparación no encontrados
)
echo.

REM Test 9: Verificar función showUpdateBanner mejorada
echo ✅ Test 9: Verificación de función mejorada
findstr /C:"chrome.runtime.getManifest().version" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ Función showUpdateBanner usa versión del manifest
) else (
    echo    ❌ ERROR: Función no obtiene versión del manifest
)
echo.

REM Test 10: Verificar SHA corto en nueva versión
echo ✅ Test 10: Verificación de SHA corto
findstr /C:"substring(0, 7)" "src\popup.js" >nul
if %errorlevel%==0 (
    echo    ✓ SHA corto implementado (primeros 7 caracteres)
) else (
    echo    ❌ ERROR: SHA corto no implementado
)
echo.

echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo 📝 Pasos de testing manual:
echo    1. Cargar la extensión en Chrome
echo    2. Abrir popup
echo    3. Verificar "v5.0.20" en la esquina superior derecha
echo    4. Pasar mouse sobre versión - debe mostrar tooltip
echo    5. Hacer un commit y push
echo    6. Forzar verificación: updateChecker.forceCheck()
echo    7. Reabrir popup
echo    8. Banner debe mostrar:
echo       - v5.0.20 (versión actual)
echo       - → (flecha)
echo       - commit abc1234 (SHA corto)
echo       - Mensaje del commit
echo.
echo 💡 Ejemplo esperado en banner:
echo    Nueva actualización disponible
echo    v5.0.20 → commit fb271bd
echo    🚀 Hotfixes V5.0.13 - V5.0.19: Mejoras...
echo.
pause
