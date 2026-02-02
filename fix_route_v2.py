#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir Issue #1: Reemplazar routeData.replace por escapedRouteData
Usa codificación bytes para evitar problemas con caracteres especiales
"""

import sys

def fix_file():
    file_path = 'src/popup.js'
    
    try:
        # Leer archivo como bytes
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Patrón a buscar (en bytes)
        # Buscamos: data-route='${routeData.replace(/'/g, ''')}'
        old_pattern = b"data-route='${routeData.replace(/'/g, ''')}'"
        new_pattern = b'data-route="${escapedRouteData}"'
        
        # Verificar si el patrón existe
        if old_pattern in content:
            # Reemplazar
            new_content = content.replace(old_pattern, new_pattern)
            
            # Escribir el archivo
            with open(file_path, 'wb') as f:
                f.write(new_content)
            
            print("SUCCESS: Patrón encontrado y reemplazado correctamente")
            print(f"Patrón buscado: {old_pattern}")
            print(f"Nuevo patrón: {new_pattern}")
            return True
        else:
            print("ERROR: Patrón no encontrado en el archivo")
            print(f"Buscando: {old_pattern}")
            
            # Buscar variantes
            variants = [
                b"data-route='",
                b"data-route=\"",
                b"routeData.replace",
            ]
            
            for v in variants:
                if v in content:
                    print(f"  Encontrado: {v}")
            
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = fix_file()
    sys.exit(0 if success else 1)
