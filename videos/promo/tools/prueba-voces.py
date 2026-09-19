#!/usr/bin/env python3
"""Prueba de voces para la narración del promo: el mismo guion leído con varios arquetipos.

El motor (edge-tts) ignora SSML, así que las únicas palancas de actuación son la voz, `rate` y
`pitch`. Acá se prueban perfiles: el actual del video y cuatro alternativas con carácter.

Sobre la legalidad, que es lo que importa antes de elegir: acá NO se clona ninguna voz real. Un
arquetipo ("científico loco", "narrador grave") se arma con una voz sintética del catálogo y
parámetros de entrega; clonar la voz de un actor para imitar a su personaje es un problema de
derechos de imagen y voz de una persona concreta, y no es lo que hace esto.

Uso:  python tools/prueba-voces.py
Salida: audio/pruebas-voz/<perfil>.mp3  (no se versiona: audio/ está en .gitignore)
"""
from __future__ import annotations

import asyncio
import re
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
GUION = RAIZ / "guion-narracion.txt"
SALIDA = RAIZ / "audio" / "pruebas-voz"

# Voz del video actual + arquetipos. pitch/rate es toda la dirección de actuación disponible.
PERFILES = [
    {
        "nombre": "1-actual",
        "voz": "es-AR-TomasNeural",
        "rate": "+12%",
        "pitch": "+0Hz",
        "nota": "el que ya usa el video: rioplatense, ritmo informativo",
    },
    {
        "nombre": "2-cientifico-loco",
        "voz": "es-MX-JorgeNeural",
        "rate": "+24%",
        "pitch": "-8Hz",
        "nota": "arquetipo: rápido, grave, con urgencia maniaca (el registro tipo 'científico loco')",
    },
    {
        "nombre": "3-narrador-grave",
        "voz": "es-ES-AlvaroNeural",
        "rate": "+6%",
        "pitch": "-12Hz",
        "nota": "arquetipo: documental, lento, grave",
    },
    {
        "nombre": "4-rioplatense-con-filo",
        "voz": "es-UY-MateoNeural",
        "rate": "+16%",
        "pitch": "-4Hz",
        "nota": "arquetipo: rioplatense con ironía seca",
    },
    {
        "nombre": "5-femenina",
        "voz": "es-AR-ElenaNeural",
        "rate": "+12%",
        "pitch": "+0Hz",
        "nota": "la alternativa femenina que menciona el guion",
    },
]


def leer_lineas() -> list[str]:
    """Extrae las líneas habladas del guion: la que sigue a cada encabezado ESCENA."""
    texto = GUION.read_text(encoding="utf-8")
    lineas: list[str] = []
    esperando = False
    for cruda in texto.splitlines():
        if re.match(r"^ESCENA\s+\d", cruda):
            esperando = True
            continue
        if esperando:
            limpia = cruda.strip()
            if limpia:
                lineas.append(limpia)
                esperando = False
    return lineas


async def generar(perfil: dict, texto: str, destino: Path) -> None:
    comunicar = edge_tts.Communicate(
        texto,
        voice=perfil["voz"],
        rate=perfil["rate"],
        pitch=perfil["pitch"],
    )
    await comunicar.save(str(destino))


async def main() -> None:
    lineas = leer_lineas()
    if not lineas:
        raise SystemExit("no pude leer ninguna línea del guion")
    # Una sola toma con las líneas separadas por punto: las pausas salen de la puntuación.
    texto = " ".join(l if l.endswith(".") else l + "." for l in lineas)

    SALIDA.mkdir(parents=True, exist_ok=True)
    print(f"{len(lineas)} líneas, {len(texto.split())} palabras\n")

    for perfil in PERFILES:
        destino = SALIDA / f"{perfil['nombre']}.mp3"
        await generar(perfil, texto, destino)
        kb = destino.stat().st_size / 1024
        print(f"  {perfil['nombre']:26} {perfil['voz']:22} rate {perfil['rate']:>5} pitch {perfil['pitch']:>6}  {kb:6.0f} KB")
        print(f"      {perfil['nota']}")

    print(f"\nescuchar en: {SALIDA}")
    print("  python tools/prueba-voces.py   # vuelve a generarlas")


if __name__ == "__main__":
    asyncio.run(main())
