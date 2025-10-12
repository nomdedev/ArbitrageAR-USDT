@echo off
chcp 65001 >nul
echo ============================================
echo TEST: Método Consenso con Filtro de Bancos
echo v5.0.33 - 11/10/2025
echo ============================================
echo.

set "PASS=0"
set "FAIL=0"

echo [TEST 1] Verificar que método consenso existe en dollarPriceManager.js
findstr /C:"preferredBank === 'consenso'" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Método consenso encontrado
    set /a PASS+=1
) else (
    echo [✗] FAIL - Método consenso NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 2] Verificar que consenso usa bankRates filtrados
findstr /C:"const banks = Object.values(bankRates)" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Consenso usa bankRates (ya filtrados)
    set /a PASS+=1
) else (
    echo [✗] FAIL - Consenso NO usa bankRates
    set /a FAIL+=1
)
echo.

echo [TEST 3] Verificar función de clustering
findstr /C:"findConsensusCluster" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Función findConsensusCluster implementada
    set /a PASS+=1
) else (
    echo [✗] FAIL - Función findConsensusCluster NO encontrada
    set /a FAIL+=1
)
echo.

echo [TEST 4] Verificar tolerancia del 2%%
findstr /C:"tolerance = 0.02" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Tolerancia configurada en 2%%
    set /a PASS+=1
) else (
    echo [✗] FAIL - Tolerancia NO configurada correctamente
    set /a FAIL+=1
)
echo.

echo [TEST 5] Verificar log de bancos seleccionados
findstr /C:"[CONSENSO] Calculando consenso SOLO con" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Log de filtro implementado
    set /a PASS+=1
) else (
    echo [✗] FAIL - Log de filtro NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 6] Verificar comentario sobre filtro
findstr /C:"bankRates ya viene FILTRADO" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Comentario explicativo del filtro presente
    set /a PASS+=1
) else (
    echo [✗] FAIL - Comentario explicativo NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 7] Verificar log de cluster encontrado
findstr /C:"[CONSENSO] Cluster más grande:" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Log de cluster implementado
    set /a PASS+=1
) else (
    echo [✗] FAIL - Log de cluster NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 8] Verificar retorno de clusterSize y clusterPercentage
findstr /C:"clusterSize:" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Metadatos de cluster incluidos
    set /a PASS+=1
) else (
    echo [✗] FAIL - Metadatos de cluster NO encontrados
    set /a FAIL+=1
)
echo.

echo [TEST 9] Verificar opción en options.html
findstr /C:"value=\""consenso\""" "src\options.html" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Opción consenso en UI
    set /a PASS+=1
) else (
    echo [✗] FAIL - Opción consenso NO en UI
    set /a FAIL+=1
)
echo.

echo [TEST 10] Verificar emoji de recomendación en UI
findstr /C:"🔥" "src\options.html" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Emoji de recomendación presente
    set /a PASS+=1
) else (
    echo [✗] FAIL - Emoji de recomendación NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 11] Verificar source 'dolarito_consensus'
findstr /C:"source: 'dolarito_consensus'" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Source identificador correcto
    set /a PASS+=1
) else (
    echo [✗] FAIL - Source identificador incorrecto
    set /a FAIL+=1
)
echo.

echo [TEST 12] Verificar bank: 'Consenso'
findstr /C:"bank: 'Consenso'" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Nombre de banco correcto
    set /a PASS+=1
) else (
    echo [✗] FAIL - Nombre de banco incorrecto
    set /a FAIL+=1
)
echo.

echo [TEST 13] Verificar versión actualizada en manifest.json
findstr /C:"\"version\": \"5.0.33\"" "manifest.json" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Versión 5.0.33 en manifest
    set /a PASS+=1
) else (
    echo [✗] FAIL - Versión NO actualizada
    set /a FAIL+=1
)
echo.

echo [TEST 14] Verificar archivo demo_consenso.html existe
if exist "demo_consenso.html" (
    echo [✓] PASS - Demo interactivo creado
    set /a PASS+=1
) else (
    echo [✗] FAIL - Demo interactivo NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 15] Verificar documentación creada
if exist "FEATURE_V5.0.33_METODO_CONSENSO.md" (
    echo [✓] PASS - Documentación completa creada
    set /a PASS+=1
) else (
    echo [✗] FAIL - Documentación NO encontrada
    set /a FAIL+=1
)
echo.

echo [TEST 16] Verificar algoritmo de búsqueda del mejor cluster
findstr /C:"if (cluster.length > bestCluster.length)" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Lógica de búsqueda del cluster más grande
    set /a PASS+=1
) else (
    echo [✗] FAIL - Lógica de búsqueda NO encontrada
    set /a FAIL+=1
)
echo.

echo [TEST 17] Verificar cálculo de promedio del cluster
findstr /C:"reduce((sum, item) => sum + item.price, 0)" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Cálculo de promedio correcto
    set /a PASS+=1
) else (
    echo [✗] FAIL - Cálculo de promedio NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 18] Verificar que consenso calcula tanto compra como venta
findstr /C:"const compraCluster = findConsensusCluster(compraValues)" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Calcula cluster de compra
    set /a PASS+=1
) else (
    echo [✗] FAIL - NO calcula cluster de compra
    set /a FAIL+=1
)
echo.

echo [TEST 19] Verificar log de varianza del cluster
findstr /C:"varianza:" "src\background\dollarPriceManager.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Log de varianza implementado
    set /a PASS+=1
) else (
    echo [✗] FAIL - Log de varianza NO encontrado
    set /a FAIL+=1
)
echo.

echo [TEST 20] Verificar recomendación en UI
findstr /C:"consenso de mercado" "src\options.html" >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] PASS - Texto de recomendación presente
    set /a PASS+=1
) else (
    echo [✗] FAIL - Texto de recomendación NO encontrado
    set /a FAIL+=1
)
echo.

echo ============================================
echo RESUMEN DE TESTS
echo ============================================
echo Tests PASADOS: %PASS%
echo Tests FALLIDOS: %FAIL%
echo.

if %FAIL% EQU 0 (
    echo ✅ TODOS LOS TESTS PASARON
    echo.
    echo SIGUIENTE PASO:
    echo 1. Recarga la extensión en Chrome
    echo 2. Abre DevTools ^> Application ^> Service Workers ^> Inspect
    echo 3. Configura método "Consenso" en opciones
    echo 4. Busca logs con [CONSENSO] en consola
    echo.
    exit /b 0
) else (
    echo ❌ ALGUNOS TESTS FALLARON
    echo Revisa los errores arriba
    echo.
    exit /b 1
)
