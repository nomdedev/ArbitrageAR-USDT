# Script para subir ArbitrageAR a GitHub
# PowerShell Version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SUBIR ARBITRAGEAR A GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[PASO 1] Verificando repositorio local..." -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "[PASO 2] Configuración de Git actual:" -ForegroundColor Yellow
Write-Host "Usuario: $(git config user.name)"
Write-Host "Email: $(git config user.email)"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INSTRUCCIONES:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a: " -NoNewline
Write-Host "https://github.com/new" -ForegroundColor Green
Write-Host "2. Nombre del repositorio: " -NoNewline
Write-Host "ArbitrageAR-USDT" -ForegroundColor Green
Write-Host "3. Descripción: Extension Chrome para arbitraje Dolar Oficial → USDT en Argentina"
Write-Host "4. Selecciona: Público o Privado (tu elección)"
Write-Host "5. " -NoNewline
Write-Host "NO" -ForegroundColor Red -NoNewline
Write-Host " marcar: README, .gitignore, ni LICENSE (ya los tenemos)"
Write-Host "6. Click en " -NoNewline
Write-Host "Create repository" -ForegroundColor Green
Write-Host ""

Read-Host "Presiona ENTER cuando hayas creado el repositorio en GitHub"
Write-Host ""

Write-Host "[PASO 3] Conectando con GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Ingresa la URL del repositorio que acabas de crear:" -ForegroundColor Cyan
Write-Host "Ejemplo: " -NoNewline -ForegroundColor Gray
Write-Host "https://github.com/nomdedev/ArbitrageAR-USDT.git" -ForegroundColor Gray
Write-Host ""

$repoUrl = Read-Host "URL del repositorio"

try {
    Write-Host ""
    Write-Host "Agregando remote 'origin'..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    
    Write-Host "[PASO 4] Subiendo código a GitHub..." -ForegroundColor Yellow
    git branch -M main
    git push -u origin main
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   ✅ COMPLETADO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu repositorio está en: " -NoNewline
    Write-Host $repoUrl -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos recomendados:" -ForegroundColor Cyan
    Write-Host "1. Agrega topics al repositorio (chrome-extension, arbitrage, cryptocurrency, usdt, argentina)"
    Write-Host "2. Verifica que todos los archivos se subieron correctamente"
    Write-Host "3. Habilita Issues y Discussions en Settings si lo deseas"
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Error al subir el repositorio:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Verifica que la URL sea correcta"
    Write-Host "2. Si ya existe el remote, ejecuta: git remote remove origin"
    Write-Host "3. Asegúrate de estar autenticado en GitHub"
    Write-Host ""
}

Read-Host "Presiona ENTER para cerrar"
