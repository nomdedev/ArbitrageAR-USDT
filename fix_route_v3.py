#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir Issue #1: Reemplazar routeData.replace por escapedRouteData
Usa los bytes exactos encontrados por el diagnóstico
"""

import sys

def fix_file():
    file_path = 'src/popup.js'
    
    try:
        # Leer archivo como bytes
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Patrón a buscar (bytes exactos del diagnóstico)
        # data-route='${routeData.replace(/'/g, ''')}'>
        old_pattern = bytes.fromhex('646174612d726f7574653d27247b726f757465446174612e7265706c616365282f272f672c20272661706f733b27297d273e')
        
        # Nuevo patrón: data-route="${escapedRouteData}">
        new_pattern = b'data-route="${escapedRouteData}">'
        
        # Verificar si el patrón existe
        if old_pattern in content:
            # Reemplazar
            new_content = content.replace(old_pattern, new_pattern)
            
            # Escribir el archivo
            with open(file_path, 'wb') as f:
                f.write(new_content)
            
            print("SUCCESS: Patrón encontrado y reemplazado correctamente")
            print(f"Patrón antiguo (hex): {old_pattern.hex()}")
            print(f"Patrón antiguo (texto): data-route='${{routeData.replace(/'/g, ''')}}>'")
            print(f"Patrón nuevo (hex): {new_pattern.hex()}")
            print(f"Patrón nuevo (texto): data-route=\"${{escapedRouteData}}\">")
            return True
        else:
            print("ERROR: Patrón no encontrado en el archivo")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = fix_file()
    sys.exit(0 if success else 1)
