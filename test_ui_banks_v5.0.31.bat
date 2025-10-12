@echo off
echo ========================================
echo TEST HOTFIX v5.0.31 - UI BANKS IMPROVEMENT
echo ========================================
echo.

set PASS=0
set FAIL=0

echo [TEST 1] Verificando estructura HTML de categorias de bancos...
findstr /C:"bank-category" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estructura de categorias encontrada
    set /a PASS+=1
) else (
    echo [FAIL] Estructura de categorias NO encontrada
    set /a FAIL+=1
)

echo.
echo [TEST 2] Verificando botones de seleccion rapida...
findstr /C:"select-all-banks" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Boton seleccionar todos encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Boton seleccionar todos NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 3] Verificando boton deseleccionar...
findstr /C:"deselect-all-banks" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Boton deseleccionar todos encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Boton deseleccionar todos NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 4] Verificando contador de bancos...
findstr /C:"banks-counter" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Contador de bancos encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Contador de bancos NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 5] Verificando categoria "Principales"...
findstr /C:"🏦 Principales" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Categoria Principales encontrada
    set /a PASS+=1
) else (
    echo [FAIL] Categoria Principales NO encontrada
    set /a FAIL+=1
)

echo.
echo [TEST 6] Verificando categoria "Regionales"...
findstr /C:"🌎 Regionales" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Categoria Regionales encontrada
    set /a PASS+=1
) else (
    echo [FAIL] Categoria Regionales NO encontrada
    set /a FAIL+=1
)

echo.
echo [TEST 7] Verificando categoria "Otros"...
findstr /C:"Otros</h4>" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Categoria Otros encontrada
    set /a PASS+=1
) else (
    echo [FAIL] Categoria Otros NO encontrada
    set /a FAIL+=1
)

echo.
echo [TEST 8] Verificando estilos CSS de banks-grid...
findstr /C:"banks-grid" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estilos banks-grid encontrados
    set /a PASS+=1
) else (
    echo [FAIL] Estilos banks-grid NO encontrados
    set /a FAIL+=1
)

echo.
echo [TEST 9] Verificando estilos CSS de bank-category...
findstr /C:"bank-category" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estilos bank-category encontrados
    set /a PASS+=1
) else (
    echo [FAIL] Estilos bank-category NO encontrados
    set /a FAIL+=1
)

echo.
echo [TEST 10] Verificando estilos CSS de category-title...
findstr /C:"category-title" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estilos category-title encontrados
    set /a PASS+=1
) else (
    echo [FAIL] Estilos category-title NO encontrados
    set /a FAIL+=1
)

echo.
echo [TEST 11] Verificando estilos CSS de bank-item...
findstr /C:"bank-item" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estilos bank-item encontrados
    set /a PASS+=1
) else (
    echo [FAIL] Estilos bank-item NO encontrados
    set /a FAIL+=1
)

echo.
echo [TEST 12] Verificando estilos CSS de selection-btn...
findstr /C:"selection-btn" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estilos selection-btn encontrados
    set /a PASS+=1
) else (
    echo [FAIL] Estilos selection-btn NO encontrados
    set /a FAIL+=1
)

echo.
echo [TEST 13] Verificando estilos CSS de banks-counter...
findstr /C:"banks-counter" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estilos banks-counter encontrados
    set /a PASS+=1
) else (
    echo [FAIL] Estilos banks-counter NO encontrados
    set /a FAIL+=1
)

echo.
echo [TEST 14] Verificando estilos CSS de banks-selection-header...
findstr /C:"banks-selection-header" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Estilos banks-selection-header encontrados
    set /a PASS+=1
) else (
    echo [FAIL] Estilos banks-selection-header NO encontrados
    set /a FAIL+=1
)

echo.
echo [TEST 15] Verificando funcion updateBanksCounter en options.js...
findstr /C:"updateBanksCounter" src\options.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Funcion updateBanksCounter encontrada
    set /a PASS+=1
) else (
    echo [FAIL] Funcion updateBanksCounter NO encontrada
    set /a FAIL+=1
)

echo.
echo [TEST 16] Verificando event listener select-all-banks...
findstr /C:"select-all-banks" src\options.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Event listener select-all-banks encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Event listener select-all-banks NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 17] Verificando event listener deselect-all-banks...
findstr /C:"deselect-all-banks" src\options.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Event listener deselect-all-banks encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Event listener deselect-all-banks NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 18] Verificando banco Nacion en categoria Principales...
findstr /C:"value=\"nacion\"" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Banco Nacion encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Banco Nacion NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 19] Verificando banco Galicia en categoria Principales...
findstr /C:"value=\"galicia\"" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Banco Galicia encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Banco Galicia NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 20] Verificando banco Ciudad en categoria Regionales...
findstr /C:"value=\"ciudad\"" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Banco Ciudad encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Banco Ciudad NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 21] Verificando banco Supervielle en categoria Otros...
findstr /C:"value=\"supervielle\"" src\options.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Banco Supervielle encontrado
    set /a PASS+=1
) else (
    echo [FAIL] Banco Supervielle NO encontrado
    set /a FAIL+=1
)

echo.
echo [TEST 22] Verificando grid responsivo en CSS...
findstr /C:"grid-template-columns: repeat(auto-fit" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Grid responsivo configurado
    set /a PASS+=1
) else (
    echo [FAIL] Grid responsivo NO configurado
    set /a FAIL+=1
)

echo.
echo [TEST 23] Verificando hover effects en bank-item...
findstr /C:"bank-item:hover" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Hover effects configurados
    set /a PASS+=1
) else (
    echo [FAIL] Hover effects NO configurados
    set /a FAIL+=1
)

echo.
echo [TEST 24] Verificando transiciones suaves...
findstr /C:"transition:" src\options.css >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Transiciones suaves configuradas
    set /a PASS+=1
) else (
    echo [FAIL] Transiciones suaves NO configuradas
    set /a FAIL+=1
)

echo.
echo [TEST 25] Verificando version 5.0.31 en manifest.json...
findstr /C:"\"version\": \"5.0.31\"" manifest.json >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Version correcta en manifest
    set /a PASS+=1
) else (
    echo [FAIL] Version incorrecta en manifest
    set /a FAIL+=1
)

echo.
echo ========================================
echo RESUMEN DE TESTS
echo ========================================
echo Tests PASADOS: %PASS%
echo Tests FALLIDOS: %FAIL%
echo Total: 25 tests
echo.

if %FAIL% equ 0 (
    echo [SUCCESS] Todos los tests pasaron correctamente!
    echo La mejora de UI de bancos esta completamente implementada.
    exit /b 0
) else (
    echo [ERROR] Algunos tests fallaron. Revisar implementacion.
    exit /b 1
)
