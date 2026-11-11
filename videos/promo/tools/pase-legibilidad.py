#!/usr/bin/env python3
"""Pase de legibilidad tipografica (formato PC 1920x1080 y base compartida).

Por que la base tambien se toca: en el horizontal, un texto de 13px visto en una
ventana de 1280px equivale a 8,7pt, y el mismo video mirado en un telefono (390pt
de ancho) deja ese texto en 2,6pt: ilegible. Un video 16:9 se consume mayormente en
el telefono, asi que el piso tambien aplica al formato "PC".

Piso: 18px en el cuadro de 1920 (=12pt a 1280px, =3,7pt en un telefono).
No se toca nada mas: ni tamanos de display, ni tiempos, ni contenido.

Reemplazos exactos con verificacion de cantidad: si algun ancla no aparece, el
script aborta sin escribir.
"""
from __future__ import annotations

import sys
from pathlib import Path

RUTA = Path(__file__).resolve().parent.parent / "tools" / "build_index.py"

# (ancla exacta, reemplazo, descripcion)
CAMBIOS = [
    ("#brand i {{ font: 500 12.5px/1 'IBM Plex Mono'",
     "#brand i {{ font: 500 18px/1 'IBM Plex Mono'", "marca: kicker"),
    ("font: 500 13px/1 'IBM Plex Mono'; letter-spacing: .13em; color: var(--muted); }}",
     "font: 500 18px/1 'IBM Plex Mono'; letter-spacing: .13em; color: var(--muted); }}", "pie de pagina"),
    (".s1-sub {{ font: 500 15px/1 'IBM Plex Mono'; letter-spacing: .26em;",
     ".s1-sub {{ font: 500 18px/1 'IBM Plex Mono'; letter-spacing: .26em;", "hook: linea guia"),
    (".s2-note {{ margin-top: 40px; font: 500 15px/1 'IBM Plex Mono';",
     ".s2-note {{ margin-top: 40px; font: 500 18px/1 'IBM Plex Mono';", "muro: nota al pie"),
    (".s2-badge span {{ font: 500 14px/1 'IBM Plex Mono';",
     ".s2-badge span {{ font: 500 18px/1 'IBM Plex Mono';", "muro: etiqueta del 49"),
    (".feat-label {{ font: 500 14px/1 'IBM Plex Mono';",
     ".feat-label {{ font: 500 18px/1 'IBM Plex Mono';", "feature: etiqueta de seccion"),
    (".chip {{ font: 500 15px/1 'IBM Plex Mono';",
     ".chip {{ font: 500 18px/1 'IBM Plex Mono';", "chips"),
    (".step i {{ font: 500 15px/1 'IBM Plex Mono';",
     ".step i {{ font: 500 18px/1 'IBM Plex Mono';", "pasos: numero"),
    (".field label {{ font: 500 13px/1 'IBM Plex Mono';",
     ".field label {{ font: 500 18px/1 'IBM Plex Mono';", "campos: etiqueta"),
    (".notif .t {{ position: absolute; right: 30px; top: 26px; font: 500 12.5px/1 'IBM Plex Mono';",
     ".notif .t {{ position: absolute; right: 30px; top: 26px; font: 500 18px/1 'IBM Plex Mono';", "notificacion: sello"),
    (".s7-stack {{ font: 500 15px/1 'IBM Plex Mono';",
     ".s7-stack {{ font: 500 18px/1 'IBM Plex Mono';", "cierre: linea de stack"),
    (".s7-cta {{ margin-top: 8px; font: 500 19px/1 'IBM Plex Mono';",
     ".s7-cta {{ margin-top: 8px; font: 500 20px/1 'IBM Plex Mono';", "cierre: URL"),
    # overrides del vertical: estas tres piezas heredan de la base y en mobile
    # quedaban por debajo del piso de 28px (el numero del paso a 18px = 6,5pt)
    (".s7-cta { font-size: 36px; }",
     """.step i { font-size: 30px; }
.field label { font-size: 28px; letter-spacing: .1em; }
.notif .t { font-size: 26px; }
.s7-cta { font-size: 36px; }""", "vertical: piso de las piezas heredadas"),
]

texto = RUTA.read_text(encoding="utf-8")
original = texto
for viejo, nuevo, desc in CAMBIOS:
    n = texto.count(viejo)
    if n != 1:
        print(f"ABORTA: el ancla de '{desc}' aparece {n} veces (se esperaba 1)")
        sys.exit(1)
    texto = texto.replace(viejo, nuevo)
    print(f"ok  {desc}")

if texto == original:
    print("ABORTA: no cambio nada")
    sys.exit(1)
RUTA.write_text(texto, encoding="utf-8")
print(f"\nescrito: {RUTA} ({len(texto)} bytes)")
