@echo off
echo ============================================
echo TEST HOTFIX V5.0.24 - SIMULADOR AVANZADO
echo ============================================
echo.

echo [TEST 1/18] Verificando archivos modificados...
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

if exist "src\popup.html" (
    echo ✅ popup.html existe
) else (
    echo ❌ popup.html no encontrado
    goto :error
)

echo.
echo [TEST 2/18] Verificando version del manifest...
findstr /C:"\"version\": \"5.0.24\"" manifest.json >nul
if %errorlevel%==0 (
    echo ✅ Version 5.0.24 correcta en manifest.json
) else (
    echo ❌ Version incorrecta en manifest.json
    goto :error
)

echo.
echo [TEST 3/18] Verificando selector rutas compacto...
findstr /C:"display: flex" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Selector rutas compacto implementado
) else (
    echo ❌ Selector rutas compacto no encontrado
    goto :error
)

echo.
echo [TEST 4/18] Verificando configuración avanzada HTML...
findstr /C:"advanced-config" src\popup.html >nul
if %errorlevel%==0 (
    echo ✅ Configuración avanzada en HTML
) else (
    echo ❌ Configuración avanzada no encontrada en HTML
    goto :error
)

echo.
echo [TEST 5/18] Verificando toggle configuración avanzada...
findstr /C:"toggle-advanced" src\popup.html >nul
if %errorlevel%==0 (
    echo ✅ Toggle configuración avanzada
) else (
    echo ❌ Toggle configuración avanzada no encontrado
    goto :error
)

echo.
echo [TEST 6/18] Verificando inputs de precios USD...
findstr /C:"sim-usd-buy-price" src\popup.html >nul
if %errorlevel%==0 (
    echo ✅ Inputs precios USD añadidos
) else (
    echo ❌ Inputs precios USD no encontrados
    goto :error
)

echo.
echo [TEST 7/18] Verificando inputs de fees...
findstr /C:"sim-buy-fee" src\popup.html >nul
if %errorlevel%==0 (
    echo ✅ Inputs de fees añadidos
) else (
    echo ❌ Inputs de fees no encontrados
    goto :error
)

echo.
echo [TEST 8/18] Verificando configuración matriz...
findstr /C:"matrix-min-percent" src\popup.html >nul
if %errorlevel%==0 (
    echo ✅ Configuración matriz añadida
) else (
    echo ❌ Configuración matriz no encontrada
    goto :error
)

echo.
echo [TEST 9/18] Verificando función setupAdvancedSimulator...
findstr /C:"setupAdvancedSimulator" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Función setupAdvancedSimulator añadida
) else (
    echo ❌ Función setupAdvancedSimulator no encontrada
    goto :error
)

echo.
echo [TEST 10/18] Verificando función loadDefaultSimulatorValues...
findstr /C:"loadDefaultSimulatorValues" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Función loadDefaultSimulatorValues añadida
) else (
    echo ❌ Función loadDefaultSimulatorValues no encontrada
    goto :error
)

echo.
echo [TEST 11/18] Verificando función calculateProfitMatrix...
findstr /C:"calculateProfitMatrix" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Función calculateProfitMatrix añadida
) else (
    echo ❌ Función calculateProfitMatrix no encontrada
    goto :error
)

echo.
echo [TEST 12/18] Verificando función displayProfitMatrix...
findstr /C:"displayProfitMatrix" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Función displayProfitMatrix añadida
) else (
    echo ❌ Función displayProfitMatrix no encontrada
    goto :error
)

echo.
echo [TEST 13/18] Verificando parámetros configurables en calculateSimulation...
findstr /C:"usdBuyPrice" src\popup.js >nul
if %errorlevel%==0 (
    echo ✅ Parámetros configurables en calculateSimulation
) else (
    echo ❌ Parámetros configurables no encontrados
    goto :error
)

echo.
echo [TEST 14/18] Verificando estilos configuración avanzada...
findstr /C:".advanced-config" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos configuración avanzada añadidos
) else (
    echo ❌ Estilos configuración avanzada no encontrados
    goto :error
)

echo.
echo [TEST 15/18] Verificando estilos matriz...
findstr /C:".matrix-result-card" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos matriz añadidos
) else (
    echo ❌ Estilos matriz no encontrados
    goto :error
)

echo.
echo [TEST 16/18] Verificando tabla matriz...
findstr /C:".profit-matrix-table" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos tabla matriz añadidos
) else (
    echo ❌ Estilos tabla matriz no encontrados
    goto :error
)

echo.
echo [TEST 17/18] Verificando parámetros usados en resultados...
findstr /C:"sim-params-used" src\popup.css >nul
if %errorlevel%==0 (
    echo ✅ Estilos parámetros usados añadidos
) else (
    echo ❌ Estilos parámetros usados no encontrados
    goto :error
)

echo.
echo [TEST 18/18] Verificando botón calcular matriz...
findstr /C:"btn-calculate-matrix" src\popup.html >nul
if %errorlevel%==0 (
    echo ✅ Botón calcular matriz añadido
) else (
    echo ❌ Botón calcular matriz no encontrado
    goto :error
)

echo.
echo ============================================
echo ✅ TODOS LOS TESTS PASARON EXITOSAMENTE
echo ============================================
echo.
echo Resumen de cambios implementados:
echo - ✅ Selector de rutas más compacto (flex layout)
echo - ✅ Configuración avanzada expandible
echo - ✅ Controles para precios USD compra/venta
echo - ✅ Configuración de fees y comisiones
echo - ✅ Parámetros de matriz de rendimientos
echo - ✅ Función calcular matriz de ganancias
echo - ✅ UI tabla de resultados de matriz
echo - ✅ Mostrar parámetros usados en simulación
echo - ✅ Botones cargar valores por defecto y reset
echo - ✅ Estilos CSS completos para nueva funcionalidad
echo.
echo Version actual: 5.0.24
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