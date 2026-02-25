#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para corregir Issue #1 - Reemplazar routeData.replace con escapedRouteData"""

# Leer el archivo
with open('src/popup.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Patrón a buscar y reemplazar - usando búsqueda simple de string
# Buscar: data-route='${routeData.replace(/'/g, ''')}'
# Reemplazar por: data-route="${escapedRouteData}"
old_text = "data-route='${routeData.replace(/'/g, ''')}'"
new_text = 'data-route="${escapedRouteData}"'

# Hacer el reemplazo usando str.replace
content = content.replace(old_text, new_text)

# Guardar el archivo modificado
with open('src/popup.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Reemplazo completado exitosamente")
print("Patrón buscado: data-route='${routeData.replace(/'/g, ''')}'")
print("Reemplazado por: data-route=\"${escapedRouteData}\"")
