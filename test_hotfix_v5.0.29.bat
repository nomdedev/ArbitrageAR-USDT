@echo off
REM ============================================
REM TEST HOTFIX v5.0.29 - MÉTODOS ESTADÍSTICOS
REM ============================================

echo.
echo ===============================================
echo    TEST HOTFIX v5.0.29 - ESTADÍSTICA
echo ===============================================
echo.

REM Verificar archivos críticos
echo [1/6] Verificando archivos criticos...
if not exist "src\background\dollarPriceManager.js" (
    echo [ERROR] No se encontro dollarPriceManager.js
    exit /b 1
)
if not exist "src\popup.js" (
    echo [ERROR] No se encontro popup.js
    exit /b 1
)
if not exist "src\options.html" (
    echo [ERROR] No se encontro options.html
    exit /b 1
)
if not exist "src\options.js" (
    echo [ERROR] No se encontro options.js
    exit /b 1
)
echo [OK] Todos los archivos criticos existen

echo.
echo [2/6] Verificando version en manifest.json...
findstr /C:"\"version\": \"5.0.29\"" manifest.json >nul
if errorlevel 1 (
    echo [ERROR] Version incorrecta en manifest.json
    exit /b 1
)
echo [OK] Version correcta: 5.0.29

echo.
echo [3/6] Verificando metodo de mediana en dollarPriceManager.js...
findstr /C:"preferredBank === 'mediana'" src\background\dollarPriceManager.js >nul
if errorlevel 1 (
    echo [ERROR] Metodo de mediana no encontrado
    exit /b 1
)
findstr /C:"dolarito_median" src\background\dollarPriceManager.js >nul
if errorlevel 1 (
    echo [ERROR] Source dolarito_median no encontrado
    exit /b 1
)
echo [OK] Metodo de mediana implementado

echo.
echo [4/6] Verificando metodo de promedio recortado...
findstr /C:"promedio_recortado" src\background\dollarPriceManager.js >nul
if errorlevel 1 (
    echo [ERROR] Metodo de promedio recortado no encontrado
    exit /b 1
)
findstr /C:"dolarito_trimmed_average" src\background\dollarPriceManager.js >nul
if errorlevel 1 (
    echo [ERROR] Source dolarito_trimmed_average no encontrado
    exit /b 1
)
echo [OK] Metodo de promedio recortado implementado

echo.
echo [5/6] Verificando opciones en options.html...
findstr /C:"value=\"mediana\"" src\options.html >nul
if errorlevel 1 (
    echo [ERROR] Opcion mediana no encontrada en HTML
    exit /b 1
)
findstr /C:"value=\"promedio_recortado\"" src\options.html >nul
if errorlevel 1 (
    echo [ERROR] Opcion promedio_recortado no encontrada en HTML
    exit /b 1
)
findstr /C:"optgroup" src\options.html >nul
if errorlevel 1 (
    echo [ERROR] Optgroups no encontrados en HTML
    exit /b 1
)
echo [OK] Opciones correctamente agregadas al HTML

echo.
echo [6/6] Verificando valor por defecto en options.js...
findstr /C:"preferredBank: 'mediana'" src\options.js >nul
if errorlevel 1 (
    echo [ERROR] Valor por defecto no es mediana
    exit /b 1
)
echo [OK] Valor por defecto correcto: mediana

echo.
echo ===============================================
echo    TODAS LAS VERIFICACIONES PASARON
echo ===============================================
echo.
echo SIGUIENTE PASO - TESTING MANUAL:
echo.
echo 1. RECARGA LA EXTENSION EN BRAVE
echo    - Ve a brave://extensions/
echo    - Busca "arbitrarARS"
echo    - Click en el icono de recargar
echo.
echo 2. VERIFICA LA VERSION
echo    - Abre el popup
echo    - Deberia mostrar v5.0.29 en la esquina
echo.
echo 3. PRUEBA EL METODO DE MEDIANA
echo    - Abre configuracion ^(boton de engranaje^)
echo    - Busca "Metodo de precio USD oficial"
echo    - Deberia estar seleccionado "Mediana de bancos ^(robusto ante outliers^) ⭐"
echo    - Verifica que hay 3 secciones en el dropdown:
echo      * Metodos Estadisticos ^(Recomendado^)
echo      * Bancos Especificos
echo      * Legado ^(No recomendado^)
echo.
echo 4. VERIFICA EL DISPLAY EN POPUP
echo    - Cierra opciones y vuelve al popup
echo    - Busca la seccion de precio USD
echo    - Deberia mostrar: "📊 Mediana ^(X bancos^)"
echo.
echo 5. PRUEBA PROMEDIO RECORTADO
echo    - Vuelve a opciones
echo    - Selecciona "Promedio recortado ^(elimina 10%% extremos^)"
echo    - Guarda
echo    - Vuelve al popup
echo    - Deberia mostrar: "📊 Prom. Recortado ^(Y/X bancos^)"
echo.
echo 6. COMPARA PRECIOS
echo    - Anota el precio con mediana
echo    - Cambia a "Promedio simple"
echo    - Compara la diferencia
echo    - Si hay outliers, deberia haber diferencia notable
echo.

pause
