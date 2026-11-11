#!/usr/bin/env python3
"""Verifica que el audio del render sea la locución sola: correlaciona muestra por muestra.

Por qué hace falta: "sin música de fondo" es una afirmación que se puede medir. Si el
audio del video fuese la locución más un lecho, la correlación con la locución cruda
caería bastante por debajo de 1 (el lecho aporta energía que la voz no tiene). Si el
render es la voz sola amplificada, la correlación se mantiene pegada a 1.

Uso:  python tools/verificar-audio.py output/<render>.mp4 [...]
"""
from __future__ import annotations

import array
import math
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(BASE, "audio", "narration.wav")
SR = 8000


def muestras(path: str, sr: int = SR) -> array.array:
    """Decodifica a PCM mono s16 a 8 kHz (basta para comparar forma de onda)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    a = array.array("h")
    a.frombytes(raw[:len(raw) // 2 * 2])
    return a


def correlacion(a: array.array, b: array.array) -> tuple[float, float]:
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    ma = sum(a) / n
    mb = sum(b) / n
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    da = math.sqrt(sum((x - ma) ** 2 for x in a))
    db = math.sqrt(sum((y - mb) ** 2 for y in b))
    rms_a = math.sqrt(sum(x * x for x in a) / n)
    rms_b = math.sqrt(sum(y * y for y in b) / n)
    dB = 20 * math.log10(rms_b / rms_a) if rms_a > 0 and rms_b > 0 else float("nan")
    return num / (da * db), dB


def main(argv: list[str]) -> int:
    objetivos = argv[1:] or [os.path.join(BASE, "output", "arbitrars-promo-1920x1080-v7.mp4")]
    ref = muestras(REF)
    dur_ref = len(ref) / SR
    print(f"referencia: audio/narration.wav · {dur_ref:.2f}s de voz cruda")
    malos = 0
    for path in objetivos:
        if not os.path.exists(path):
            print(f"FALTA {path}")
            malos += 1
            continue
        vs = muestras(path)
        r, dB = correlacion(ref, vs)
        dur = len(vs) / SR
        veredicto = "voz sola" if r > 0.99 else ("voz + algo más (¿lecho?)" if r > 0.9 else "NO es la voz sola")
        if r <= 0.99:
            malos += 1
        print(f"{os.path.basename(path):38} r={r:.4f}  ganancia={dB:+.2f} dB  "
              f"{dur:.2f}s  → {veredicto}")
    print("\nOK: el audio de los renders es la locución sola." if malos == 0
          else f"\nATENCIÓN: {malos} archivo(s) no son la locución sola.")
    return 1 if malos else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
