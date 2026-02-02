# Script para corregir Issue #1 - Reemplazar routeData.replace con escapedRouteData
$content = Get-Content 'src/popup.js' -Raw

# Usar un patrón más simple sin caracteres problemáticos
# Buscar la línea que contiene routeData.replace y reemplazarla
$oldLine = 'data-route=''{routeData.replace(/''/g, ''''')}'''
$newLine = 'data-route="${escapedRouteData}"'

# Hacer el reemplazo usando el método Replace de string
$content = $content.Replace($oldLine, $newLine)

# Guardar el contenido modificado
Set-Content 'src/popup.js' -Value $content -NoNewline

Write-Host "Reemplazo completado exitosamente"
Write-Host "Buscado: $oldLine"
Write-Host "Reemplazado por: $newLine"
