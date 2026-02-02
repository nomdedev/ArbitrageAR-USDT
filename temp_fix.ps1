# Script para corregir el Issue #1 - JSON escaping en src/popup.js
$file = "src\popup.js"
$content = Get-Content $file -Raw -Encoding UTF8

# Reemplazar la línea problemática
$oldText = "data-route='`${routeData.replace(/'/g, ''')}`'"
$newText = "data-route=`"${escapedRouteData}`""

$content = $content.Replace($oldText, $newText)

# Guardar el archivo
Set-Content $file -Value $content -NoNewline -Encoding UTF8

Write-Host "Cambio aplicado exitosamente"
