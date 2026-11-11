#!/usr/bin/env python3
"""Entrega el audio final del promo: la voz sola (por defecto) o voz + lecho musical.

POR DEFECTO NO HAY MÚSICA DE FONDO. El video va con la locución y nada más:

    python tools/make_music.py                # voz sola → mix_final.wav
    python tools/make_music.py --con-musica   # voz + lecho duckeado (opcional)

Por qué existe la opción de música y por qué está apagada: la primera entrega llevaba un
lecho de **La menor con novena** — A1 · E3 · A3 · B3 · C4 — con lowpass de 1.100 Hz, eco y
un golpe de 55 Hz cada 3,5 s: un acorde menor sin resolver, apagado y con subgraves. Suena
a tensión y fue rechazado con razón. Se reescribió a una progresión **mayor** I-V-vi-IV en
La mayor (A · E · F#m · D), con lowpass a 3.5 kHz, pulso de 880 Hz y shaker, pero la
decisión de fondo fue sacarla: el video queda más limpio con la voz sola.

En los dos casos el audio se normaliza a -14 LUFS / -1,5 dBTP (objetivo de la web) y se
estira hasta la duración total del video, para que el último fotograma no quede mudo.

Uso:  python tools/make_music.py [--con-musica]
Salida: audio/mix_final.wav, audio/ESCUCHA-mix.mp3 (+ music_bed*.wav si hay música)
"""
from __future__ import annotations

import json
import math
import os
import re
import subprocess
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")
TIMELINE = os.path.join(AUDIO, "timeline.json")

# ── lecho musical (sólo con --con-musica) ─────────────────────────────────────
BAR = 3.5  # segundos por acorde
PROGRESION = [
    ("A",  [(220.00, 0.34), (277.18, 0.22), (329.63, 0.16)]),   # A  · C# · E
    ("E",  [(164.81, 0.32), (207.65, 0.22), (246.94, 0.16)]),   # E  · G# · B
    ("F#m", [(185.00, 0.34), (220.00, 0.22), (277.18, 0.15)]),  # F# · A  · C#
    ("D",  [(146.83, 0.34), (185.00, 0.22), (220.00, 0.16)]),   # D  · F# · A
]
PAD_TONO = 1.55
DUCK = "threshold=0.05:ratio=3.5:attack=20:release=420:makeup=1.35:level_sc=1"
PLUCK_EVERY = 0.875
SHAKER_EVERY = 0.4375
VOL_MUSICA = 0.92

LUFS_OBJ, TP_OBJ, LRA_OBJ = -14.0, -1.5, 9.0


def run(args: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=True, capture_output=True, **kw)


def _duracion(path: str) -> float:
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", path], capture_output=True, text=True,
                                check=True).stdout.strip())


def medir(path: str) -> dict:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True)
    out = {}
    for line in r.stderr.splitlines():
        m = re.search(r"(mean|max)_volume: (-?[\d.]+) dB", line)
        if m:
            out[m.group(1)] = float(m.group(2))
    return out


def sonoridad(path: str) -> dict:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    txt = r.stderr
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", txt)
    lra = re.findall(r"LRA:\s+(-?[\d.]+) LU", txt)
    tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", txt)
    return {"lufs": float(lufs[-1]) if lufs else None,
            "lra": float(lra[-1]) if lra else None,
            "tp": float(tp[-1]) if tp else None}


def barra(tonos: list[tuple[float, float]], destino: str) -> None:
    """Un compás: las tres notas del acorde, con brillo y sin cola."""
    inputs: list[str] = []
    filtros: list[str] = []
    labels: list[str] = []
    for i, (freq, gain) in enumerate(tonos):
        inputs += ["-f", "lavfi", "-i", f"sine=frequency={freq}:duration={BAR}"]
        labels.append(f"t{i}")
        filtros.append(f"[{i}:a]volume={gain}[t{i}]")
    mezcla = "".join(f"[{lb}]" for lb in labels)
    grafo = (";".join(filtros)
             + f";{mezcla}amix=inputs={len(tonos)}:normalize=0[ch]"
             + ";[ch]lowpass=f=3500,tremolo=f=0.35:d=0.12"
             + f",afade=t=in:st=0:d=0.12,afade=t=out:st={BAR - 0.14}:d=0.14"
             + f",volume={PAD_TONO}[out]")
    run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", grafo, "-map", "[out]",
         "-t", str(BAR), "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", destino])


def repetir(pieza: str, gap_s: float, veces: int, destino: str, tag: str) -> None:
    """Concatena una pieza corta con su silencio, N veces (pulso, shaker)."""
    silencio = os.path.join(AUDIO, f"_{tag}_gap.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
         f"anullsrc=r=44100:cl=mono:d={gap_s:.4f}", "-ar", "44100", "-ac", "1",
         "-c:a", "pcm_s16le", silencio])
    lista = os.path.join(AUDIO, f"_{tag}_lista.txt")
    with open(lista, "w", encoding="utf-8") as fh:
        for _ in range(veces):
            fh.write(f"file '{pieza}'\nfile '{silencio}'\n")
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista,
         "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", destino])


def construir_lecho(dur: float) -> tuple[str, str]:
    """Progresión mayor + pulso + shaker, duckeado bajo la voz. Devuelve (bed, ducked)."""
    n_barras = math.ceil(dur / BAR)
    partes: list[str] = []
    for i in range(n_barras):
        _nombre, tonos = PROGRESION[i % len(PROGRESION)]
        p = os.path.join(AUDIO, f"_bar_{i:02d}.wav")
        barra(tonos, p)
        partes.append(p)
    lista_barras = os.path.join(AUDIO, "_barras.txt")
    with open(lista_barras, "w", encoding="utf-8") as fh:
        for p in partes:
            fh.write(f"file '{os.path.basename(p)}'\n")
    pad = os.path.join(AUDIO, "_pad.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista_barras,
         "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", pad], cwd=AUDIO)
    print(f"progresión: {' · '.join(n for n, _ in PROGRESION)}  ({n_barras} compases de {BAR}s)")

    pluck = os.path.join(AUDIO, "_pluck.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=880:duration=0.18",
         "-f", "lavfi", "-i", "sine=frequency=1320:duration=0.18", "-filter_complex",
         "[0:a]volume=0.30[a];[1:a]volume=0.10[b];[a][b]amix=inputs=2:normalize=0,"
         "afade=t=in:st=0:d=0.008,afade=t=out:st=0:d=0.18[out]",
         "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", pluck])
    pulsos = os.path.join(AUDIO, "_pulsos.wav")
    repetir(pluck, PLUCK_EVERY - 0.18, max(1, int(dur / PLUCK_EVERY)), pulsos, "pluck")

    shaker = os.path.join(AUDIO, "_shaker.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anoisesrc=r=44100:d=0.05:c=pink",
         "-af", "highpass=f=5000,volume=0.16,afade=t=in:st=0:d=0.005,afade=t=out:st=0:d=0.05",
         "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", shaker])
    aires = os.path.join(AUDIO, "_aires.wav")
    repetir(shaker, SHAKER_EVERY - 0.05, max(1, int(dur / SHAKER_EVERY)), aires, "shaker")

    bed = os.path.join(AUDIO, "music_bed.wav")
    run(["ffmpeg", "-y", "-v", "error", "-i", pad, "-i", pulsos, "-i", aires,
         "-filter_complex",
         f"[0:a][1:a][2:a]amix=inputs=3:normalize=0,volume=0.72,atrim=0:{dur},"
         "afade=t=in:st=0:d=0.4[out]",
         "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", bed])
    print("music_bed.wav:", os.path.getsize(bed), "bytes", medir(bed))

    narration = os.path.join(AUDIO, "narration.wav")
    ducked = os.path.join(AUDIO, "music_bed_ducked.wav")
    run(["ffmpeg", "-y", "-v", "error", "-i", bed, "-i", narration, "-filter_complex",
         f"[0:a][1:a]sidechaincompress={DUCK}[ducked];"
         f"[ducked]afade=t=out:st={max(dur - 2.8, 0)}:d=2.8,atrim=0:{dur}[out]",
         "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", ducked])
    print("music_bed_ducked.wav:", os.path.getsize(ducked), "bytes", medir(ducked))

    for tmp in [*partes, lista_barras, pad, pluck, pulsos, aires, shaker,
                os.path.join(AUDIO, "_pluck_gap.wav"), os.path.join(AUDIO, "_pluck_lista.txt"),
                os.path.join(AUDIO, "_shaker_gap.wav"), os.path.join(AUDIO, "_shaker_lista.txt")]:
        if os.path.exists(tmp):
            os.remove(tmp)
    return bed, ducked


def main() -> int:
    con_musica = "--con-musica" in sys.argv
    with open(TIMELINE, encoding="utf-8") as fh:
        total = float(json.load(fh)["total"])
    dur = round(total + 0.06, 3)
    narration = os.path.join(AUDIO, "narration.wav")
    modo = "voz + lecho" if con_musica else "voz sola (sin música de fondo)"
    print(f"duración del audio: {dur}s · {modo}")

    bed = ducked = None
    if con_musica:
        bed, ducked = construir_lecho(dur)
    else:
        print("sin música de fondo. Para agregarla: python tools/make_music.py --con-musica")

    # ── mezcla: voz sola estirada a la duración del video, o voz + lecho ──────
    pre = os.path.join(AUDIO, "_premix.wav")
    if ducked:
        run(["ffmpeg", "-y", "-v", "error", "-i", narration, "-i", ducked, "-filter_complex",
             f"[0:a]volume=1.0[v];[1:a]volume={VOL_MUSICA}[b];[v][b]amix=inputs=2:normalize=0,"
             f"apad,atrim=0:{dur}[out]",
             "-map", "[out]", "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", pre])
    else:
        run(["ffmpeg", "-y", "-v", "error", "-i", narration, "-filter_complex",
             f"[0:a]apad,atrim=0:{dur},volume=1.0[out]",
             "-map", "[out]", "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", pre])
    print(f"premezcla: {sonoridad(pre)}")

    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af",
                        f"loudnorm=I={LUFS_OBJ}:TP={TP_OBJ}:LRA={LRA_OBJ}:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    js = re.search(r"\{[^{}]*input_i[^{}]*\}", r.stderr, re.S)
    if not js:
        print("ERROR: loudnorm no devolvió medición")
        return 1
    m = json.loads(js.group(0))
    mix = os.path.join(AUDIO, "mix_final.wav")
    run(["ffmpeg", "-y", "-v", "error", "-i", pre, "-af",
         f"loudnorm=I={LUFS_OBJ}:TP={TP_OBJ}:LRA={LRA_OBJ}"
         f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
         f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
         f":offset={m['target_offset']}:linear=true",
         "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", mix])
    fin = sonoridad(mix)
    print(f"mix_final.wav: {os.path.getsize(mix)} bytes → {fin['lufs']} LUFS · "
          f"LRA {fin['lra']} LU · pico {fin['tp']} dBFS · {_duracion(mix)}s")

    escucha = os.path.join(AUDIO, "ESCUCHA-mix.mp3")
    run(["ffmpeg", "-y", "-v", "error", "-i", mix, "-b:a", "192k", escucha])

    if os.path.exists(pre):
        os.remove(pre)

    v = medir(narration)
    print(f"  narración: media {v.get('mean')} dBFS · pico {v.get('max')} dBFS")
    for label, path in (("bed", bed), ("bed duckeado", ducked)):
        if path and os.path.exists(path):
            v = medir(path)
            print(f"  {label}: media {v.get('mean')} dBFS · pico {v.get('max')} dBFS")

    with open(os.path.join(BASE, "audio_meta.json"), encoding="utf-8") as fh:
        meta = json.load(fh)
    meta["bgm"] = ({
        "path": "audio/music_bed_ducked.wav",
        "volume": VOL_MUSICA,
        "query": "progresión mayor A · E · F#m · D sintetizada con ffmpeg (pulso + shaker)",
        "duration_s": round(total, 3),
    } if con_musica else None)
    meta["bgm_pending"] = False
    meta["mix"] = {"lufs": fin["lufs"], "lra": fin["lra"], "true_peak_dbfs": fin["tp"],
                   "target_lufs": LUFS_OBJ, "target_tp": TP_OBJ,
                   "con_musica": con_musica}
    with open(os.path.join(BASE, "audio_meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=1)
    print(f"audio_meta.json actualizado (bgm={'sí' if con_musica else 'no'}). Para oírlo: {escucha}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
