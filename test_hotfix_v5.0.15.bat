@echo off
echo ========================================
echo    TESTING HOTFIX V5.0.15
echo    Solucion Timeout Background-Popup
echo ========================================
echo.

echo 1. Verificando timeout aumentado en popup...
findstr /C:"15000" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Timeout aumentado a 15 segundos
) else (
    echo ❌ Timeout NO aumentado
)

echo.
echo 2. Verificando mejor manejo de errores en popup...
findstr /C:"error-container" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Contenedor de error mejorado añadido
) else (
    echo ❌ Contenedor de error NO encontrado
)

echo.
echo 3. Verificando timeout interno en background...
findstr /C:"getCurrentDataInternal" src\background\main.js >nul
if %errorlevel%==0 (
    echo ✅ Timeout interno del background añadido
) else (
    echo ❌ Timeout interno NO encontrado
)

echo.
echo 4. Verificando health check...
findstr /C:"performHealthCheck" src\background\main.js >nul
if %errorlevel%==0 (
    echo ✅ Health check del background añadido
) else (
    echo ❌ Health check NO encontrado
)

echo.
echo 5. Verificando safety timeout...
findstr /C:"safetyTimeout" src\background\main.js >nul
if %errorlevel%==0 (
    echo ✅ Safety timeout añadido
) else (
    echo ❌ Safety timeout NO encontrado
)

echo.
echo 6. Verificando estilos CSS para errores...
findstr /C:"error-container" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos CSS para errores añadidos
) else (
    echo ❌ Estilos CSS para errores NO encontrados
)

echo.
echo 7. Verificando manejo de chrome.runtime...
findstr /C:"chrome.runtime" src\popup.js | findstr /C:"disponible" >nul
if %errorlevel%==0 (
    echo ✅ Verificación de chrome.runtime añadida
) else (
    echo ❌ Verificación de chrome.runtime NO encontrada
)

echo.
echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo Para testing manual:
echo 1. Cargar la extensión en Chrome
echo 2. Abrir popup y verificar que carga sin timeout
echo 3. Si hay timeout, debe mostrar mensaje claro con botón reintentar
echo 4. Verificar que errores muestren información detallada
echo 5. Comprobar que el botón "Reintentar" funciona
echo.
echo Casos de prueba específicos:
echo - Desconectar internet y abrir popup (debe mostrar error de APIs)
echo - Esperar más de 15 segundos (debe mostrar timeout)
echo - Recargar extensión y verificar recuperación
echo.
pause