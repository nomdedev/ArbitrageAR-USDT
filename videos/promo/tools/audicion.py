#!/usr/bin/env python3
"""Genera un archivo de audicion para elegir pronunciaciones y velocidades.

Por que existe: ni el orquestador ni ningun agente delegado puede ESCUCHAR el
resultado. Se pueden medir duraciones y niveles, pero no se puede dictaminar si una
palabra quedo bien pronunciada. Este archivo le da al usuario las variantes
candidatas en un solo MP3, con un indice de tiempos, para que decida en 40 segundos.

Salida:
  review/audicion-pronunciacion.mp3   (audio)
  review/audicion-pronunciacion.txt   (indice con los tiempos de cada variante)
"""
import asyncio
import os
import subprocess

import edge_tts

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE, "review")
TMP = os.path.join(OUT_DIR, "_au")
VOZ_M = "es-AR-TomasNeural"
VOZ_F = "es-AR-ElenaNeural"
GAP = 0.85  # silencio entre variantes

# (etiqueta, texto que se sintetiza, voz, rate)
CLIPS = [
    ("USDT — leido letra por letra (candidato A)",
     "u ese de té", VOZ_M, "+12%"),
    ("USDT — crudo, como lo lee el motor (candidato B)",
     "El precio del USDT sube.", VOZ_M, "+12%"),
    ("USDT — como palabra 'tether' (candidato C)",
     "El precio del tether sube.", VOZ_M, "+12%"),

    ("ArbitrARS — deletreado (candidato A)",
     "Arbitr a erre ese la mide.", VOZ_M, "+8%"),
    ("ArbitrARS — crudo, como lo lee el motor (candidato B)",
     "ArbitrARS la mide.", VOZ_M, "+8%"),
    ("ArbitrARS — como palabra corrida (candidato C)",
     "Arbitrars la mide.", VOZ_M, "+8%"),

    ("exchange — crudo (candidato A)",
     "sobre 49 exchanges, cada 30 segundos.", VOZ_M, "+12%"),
    ("exchange — reescrito 'exchench' (candidato B)",
     "sobre 49 exchench, cada 30 segundos.", VOZ_M, "+12%"),

    ("HOOK completo a +8%  (direccion propuesta: mas peso)",
     "El dólar oficial y el u ese de té no valen lo mismo.", VOZ_M, "+8%"),
    ("HOOK completo a +12% (como esta hoy)",
     "El dólar oficial y el u ese de té no valen lo mismo.", VOZ_M, "+12%"),

    ("CIERRE a +6%  (direccion propuesta: mas lento)",
     "Todo en tu navegador, sin servidores.", VOZ_M, "+6%"),
    ("CIERRE a +12% (como esta hoy)",
     "Todo en tu navegador, sin servidores.", VOZ_M, "+12%"),

    ("VOZ ALTERNATIVA femenina es-AR — hook",
     "El dólar oficial y el u ese de té no valen lo mismo.", VOZ_F, "+8%"),
]


async def sintetizar(texto, voz, rate, destino):
    com = edge_tts.Communicate(texto, voz, rate=rate)
    with open(destino, "wb") as fh:
        async for trozo in com.stream():
            if trozo["type"] == "audio":
                fh.write(trozo["data"])


def main():
    os.makedirs(TMP, exist_ok=True)
    indice = []
    trozos = []
    reloj = 0.0

    # silencio de separacion
    sil = os.path.join(TMP, "_silencio.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i",
                    "anullsrc=r=24000:cl=mono", "-t", str(GAP), "-q:a", "9", "-y", sil],
                   check=True, capture_output=True)

    for i, (etiqueta, texto, voz, rate) in enumerate(CLIPS, 1):
        dest = os.path.join(TMP, f"c{i:02d}.mp3")
        asyncio.run(sintetizar(texto, voz, rate, dest))
        d = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", dest], capture_output=True, text=True, check=True).stdout.strip())
        if trozos:
            trozos.append(sil)
            reloj += GAP
        indice.append((i, etiqueta, round(reloj, 2), round(reloj + d, 2), rate))
        trozos.append(dest)
        reloj += d

    lista = os.path.join(TMP, "lista.txt")
    with open(lista, "w", encoding="utf-8") as fh:
        for t in trozos:
            fh.write(f"file '{t.replace(os.sep, '/')}'\n")

    out = os.path.join(OUT_DIR, "audicion-pronunciacion.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista,
                    "-c", "copy", "-y", out], check=True, capture_output=True)

    # MP3 con cabeceras del concat: normalizar a un solo stream limpio
    out2 = os.path.join(OUT_DIR, "audicion-pronunciacion.tmp.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-i", out, "-c:a", "libmp3lame",
                    "-b:a", "96k", "-ar", "24000", "-ac", "1", "-y", out2],
                   check=True, capture_output=True)
    os.replace(out2, out)

    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out],
        capture_output=True, text=True, check=True).stdout.strip())

    with open(os.path.join(OUT_DIR, "audicion-pronunciacion.txt"), "w", encoding="utf-8") as fh:
        fh.write("AUDICION DE PRONUNCIACION Y VELOCIDAD — ArbitrARS\n")
        fh.write(f"Archivo: review/audicion-pronunciacion.mp3  ({dur:.1f} s)\n")
        fh.write("Escuchar en orden y elegir una opcion por cada punto en discusion.\n")
        fh.write("=" * 78 + "\n\n")
        fh.write(f"{'#':>3}  {'desde':>7}  {'hasta':>7}  {'rate':>6}  variante\n")
        for i, etq, a, b, rate in indice:
            fh.write(f"{i:>3}  {a:>6.2f}s  {b:>6.2f}s  {rate:>6}  {etq}\n")

    print(f"generado: {out}  ({dur:.1f} s, {os.path.getsize(out)} bytes)")
    print(f"indice  : review/audicion-pronunciacion.txt  ({len(indice)} variantes)")
    print()
    with open(os.path.join(OUT_DIR, "audicion-pronunciacion.txt"), encoding="utf-8") as fh:
        print(fh.read())


if __name__ == "__main__":
    main()
