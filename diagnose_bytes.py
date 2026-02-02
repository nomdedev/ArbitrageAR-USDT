#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de diagnóstico para ver los bytes exactos alrededor de data-route
"""

import sys

def diagnose():
    file_path = 'src/popup.js'
    
    try:
        # Leer archivo como bytes
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Buscar la posición de data-route
        pattern = b'data-route='
        pos = content.find(pattern)
        
        if pos == -1:
            print("ERROR: No se encontró 'data-route=' en el archivo")
            return
        
        print(f"Encontrado 'data-route=' en posición: {pos}")
        
        # Extraer 100 bytes alrededor de esa posición
        start = max(0, pos - 50)
        end = min(len(content), pos + 100)
        snippet = content[start:end]
        
        print(f"\nBytes alrededor de la posición (hex):")
        print(snippet.hex())
        
        print(f"\nBytes como texto (donde sea posible):")
        print(snippet.decode('utf-8', errors='replace'))
        
        # Buscar routeData.replace cerca de data-route
        replace_pattern = b'routeData.replace'
        replace_pos = content.find(replace_pattern, pos, pos + 200)
        
        if replace_pos != -1:
            print(f"\nEncontrado 'routeData.replace' en posición: {replace_pos}")
            
            # Extraer desde data-route hasta después de routeData.replace
            end_section = min(len(content), replace_pos + 50)
            full_snippet = content[pos:end_section]
            
            print(f"\nSnippet completo (hex):")
            print(full_snippet.hex())
            
            print(f"\nSnippet completo como texto:")
            print(full_snippet.decode('utf-8', errors='replace'))
            
            # Buscar el patrón de cierre
            print(f"\nBuscando patrones de cierre...")
            
            # Buscar ')> después de routeData.replace
            after_replace = content[replace_pos + len(replace_pattern):replace_pos + len(replace_pattern) + 50]
            print(f"Después de routeData.replace (hex): {after_replace.hex()}")
            print(f"Después de routeData.replace (texto): {after_replace.decode('utf-8', errors='replace')}")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    diagnose()
