#!/usr/bin/env python3
"""Audición de voces: el mismo texto leído por cada arquetipo candidato.

Ningún agente de este proyecto puede oír. Se pueden medir duraciones y niveles, pero
"suena bien o suena mal" sólo lo puede decidir un oído humano. Este script produce el
archivo para hacerlo: candidatos numerados, con sus tiempos en un .txt al lado, para
elegir el NARRADOR y el CONTRASTE por número.

Uso:  python tools/audicion-voces.py
Salida: review/audicion-voces.mp3  +  review/audicion-voces.txt
"""
from __future__ import annotations

import asyncio
import os
import subprocess

import edge_tts

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")
REVIEW = os.path.join(BASE, "review")
TMP = os.path.join(AUDIO, "audicion")

GAP = 0.8

# La línea del hook y la del contraste (escena 2), con sus formas fonéticas reales.
HOOK = "El dólar oficial y el u ese de té no valen lo mismo."
CONTRASTE = "Esa diferencia es real. Medirla a tiempo, no."

# (etiqueta, voz, rate, pitch, [textos]) — varios textos = fragmentos en secuencia
HOOK_C = [HOOK, CONTRASTE]
CANDIDATOS = [
    ("REF voz vieja (rechazada)", "es-AR-TomasNeural", "+12%", "+0Hz", [HOOK]),
    ("N1 narrador · MX Jorge grave", "es-MX-JorgeNeural", "+22%", "-10Hz", [HOOK]),
    ("N2 narrador · CL Lorenzo", "es-CL-LorenzoNeural", "+22%", "-12Hz", [HOOK]),
    ("N3 narrador · UY Mateo con filo", "es-UY-MateoNeural", "+22%", "-6Hz", [HOOK]),
    ("N4 narrador · ES Álvaro seco", "es-ES-AlvaroNeural", "+22%", "-14Hz", [HOOK]),
    ("N5 narrador · VE Sebastián", "es-VE-SebastianNeural", "+22%", "-10Hz", [HOOK]),
    ("C1 contraste · PE Alex agudo", "es-PE-AlexNeural", "+22%", "+28Hz", [CONTRASTE]),
    ("C2 contraste · EC Luis agudo", "es-EC-LuisNeural", "+22%", "+26Hz", [CONTRASTE]),
    ("C3 contraste · Jorge subido", "es-MX-JorgeNeural", "+22%", "+30Hz", [CONTRASTE]),
    ("VOZ ÚNICA hoy · N1 en secuencia", "es-MX-JorgeNeural", "+22%", "-10Hz", HOOK_C),
    ("VOZ ÚNICA alternativa · C1 en secuencia", "es-PE-AlexNeural", "+22%", "+28Hz", HOOK_C),
]


async def uno(texto: str, voz: str, rate: str, pitch: str, destino: str) -> None:
    await edge_tts.Communicate(texto, voz, rate=rate, pitch=pitch).save(destino)


def dur(path: str) -> float:
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", path], capture_output=True, text=True,
                                check=True).stdout.strip())


def main() -> int:
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(REVIEW, exist_ok=True)
    silencio = os.path.join(TMP, "_sil.mp3")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
                    f"anullsrc=r=24000:cl=mono", "-t", str(GAP), "-c:a", "libmp3lame", silencio],
                   check=True)

    partes: list[str] = []
    lineas: list[str] = []
    t = 0.0
    for i, (etiqueta, voz, rate, pitch, textos) in enumerate(CANDIDATOS, 1):
        inicio = t
        for j, texto in enumerate(textos):
            p = os.path.join(TMP, f"c{i:02d}_{j}.mp3")
            asyncio.run(uno(texto, voz, rate, pitch, p))
            partes += [p, silencio]
            t += dur(p) + 0.25
        lineas.append(f"{i:2d}   {inicio:6.2f}s → {t:6.2f}s   {voz:24} rate {rate:>5} "
                      f"pitch {pitch:>6}   {etiqueta}")
        t += GAP

    lista = os.path.join(TMP, "_lista.txt")
    with open(lista, "w", encoding="utf-8") as fh:
        for p in partes:
            fh.write(f"file '{p}'\n")
    mp3 = os.path.join(REVIEW, "audicion-voces.mp3")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista,
                    "-b:a", "160k", mp3], check=True)

    txt = os.path.join(REVIEW, "audicion-voces.txt")
    with open(txt, "w", encoding="utf-8") as fh:
        fh.write("AUDICION DE VOCES — ArbitrARS\n")
        fh.write(f"Archivo: review/audicion-voces.mp3  ({dur(mp3):.1f} s)\n")
        fh.write("El video lo lee UNA sola voz de punta a punta: elegí un registro por número.\n")
        fh.write("N1-N5 son registros graves (científico loco); C1-C3, agudos (pibe nervioso).\n")
        fh.write("El 1 es la voz del video anterior, para comparar contra lo rechazado.\n")
        fh.write("Los últimos dos leen dos líneas seguidas: la voz única de hoy y la alternativa.\n")
        fh.write("=" * 78 + "\n\n")
        fh.write("\n".join(lineas) + "\n")

    print("\n".join(lineas))
    print(f"\nmp3:  {mp3}  ({dur(mp3):.1f}s)")
    print(f"txt:  {txt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
