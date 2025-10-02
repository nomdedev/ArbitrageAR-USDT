@echo off
echo ========================================
echo   SUBIR ARBITRAGEAR A GITHUB
echo ========================================
echo.

echo [PASO 1] Verificando repositorio local...
git status
echo.

echo [PASO 2] Verificando configuracion de Git...
echo Usuario: 
git config user.name
echo Email:
git config user.email
echo.

echo ========================================
echo   INSTRUCCIONES:
echo ========================================
echo.
echo 1. Ve a: https://github.com/new
echo 2. Nombre: ArbitrageAR-USDT
echo 3. Descripcion: Extension Chrome para arbitraje Dolar Oficial a USDT en Argentina
echo 4. Publico o Privado (tu eleccion)
echo 5. NO marcar README, .gitignore, ni LICENSE
echo 6. Click en "Create repository"
echo.

set /p "CONTINUAR=Presiona ENTER cuando hayas creado el repositorio en GitHub..."
echo.

echo [PASO 3] Conectando con GitHub...
echo.
echo Ingresa la URL del repositorio que creaste:
echo Ejemplo: https://github.com/nomdedev/ArbitrageAR-USDT.git
echo.
set /p "REPO_URL=URL del repositorio: "

git remote add origin %REPO_URL%
echo.

echo [PASO 4] Subiendo codigo a GitHub...
git branch -M main
git push -u origin main
echo.

echo ========================================
echo   COMPLETADO!
echo ========================================
echo.
echo Tu repositorio esta en: %REPO_URL%
echo.
pause
