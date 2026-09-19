#!/usr/bin/env python3
"""Genera el lecho musical del promo, lo duckea bajo la narración y entrega la mezcla final.

Por qué sintetizado y no una pista de librería:
  - La librería de música del framework requiere sesión de HeyGen (servicio comercial)
    y MusicGen local requiere torch (>2 GB de dependencias).
  - Este lecho se sintetiza con ffmpeg a partir de tonos puros: es gratuito, no tiene
    licencia de terceros, es determinista y reproducible con un comando.

Qué corrigió esta versión (medido sobre el render anterior):
  - **Eventos musicales.** Antes era un acorde fijo: cero transitorios en 27 s, así que
    ningún corte tenía dónde caer. Ahora cae un golpe suave cada 3,5 s.
  - **Nivel audible.** El lecho quedaba a -31,7 dB de media y el ducking lo llevaba a
    -44/-49 dB dentro de las pausas: inaudible, y la pausa era un agujero. Ahora el
    ducking es suave (baja ~7 dB bajo la voz en vez de ~13) y el lecho tiene cuerpo.
  - **Sonoridad final.** La mezcla se normaliza con loudnorm a -14 LUFS / -1,5 dBTP
    (dos pasadas), el objetivo de la web. Antes quedaba en -17,6 LUFS con 3 dB de pico
    sin usar.

Acorde: La menor con novena (A1 · E3 · A3 · B3 · C4) — tensión suave, sin resolver.

Uso:  python tools/make_music.py
Salida: audio/music_bed.wav, audio/music_bed_ducked.wav, audio/mix_final.wav
"""
from __future__ import annotations

import json
import os
import re
import subprocess

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")
TIMELINE = os.path.join(AUDIO, "timeline.json")

# pad armónico: (frecuencia, peso en la mezcla)
CHORD = [(110.00, 0.42), (164.81, 0.30), (220.00, 0.22), (246.94, 0.14), (261.63, 0.10)]

# EVENTOS: un golpe grave cada BEAT segundos. Le da a la edición puntos donde cortar.
GOLPE_S = 0.70          # duración del golpe
GOLPE_GAP = 2.80        # silencio entre golpes
BEAT = GOLPE_S + GOLPE_GAP  # 3,5 s
NIVEL_PAD = 1.90        # el pad medía -22,1 dB con 0.85 → necesita +7 dB para oírse
NIVEL_GOLPE = 0.55

# ducking: antes threshold=0.02 ratio=6 (bajaba ~13 dB y ahogaba la pausa).
DUCK = "threshold=0.05:ratio=3.5:attack=20:release=420:makeup=1.35:level_sc=1"

# objetivo de sonoridad de la web
LUFS_OBJ = -14.0
TP_OBJ = -1.5
LRA_OBJ = 9.0


def run(args: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=True, capture_output=True, **kw)


def medir(path: str) -> dict:
    """Niveles con volumedetect: media y pico en dBFS."""
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    out = {}
    for line in r.stderr.splitlines():
        m = re.search(r"(mean|max)_volume: (-?[\d.]+) dB", line)
        if m:
            out[m.group(1)] = float(m.group(2))
    return out


def sonoridad(path: str) -> dict:
    """Loudness integrado + true peak con ebur128 (una pasada de medición)."""
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    txt = r.stderr
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", txt)
    lra = re.findall(r"LRA:\s+(-?[\d.]+) LU", txt)
    tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", txt)
    return {
        "lufs": float(lufs[-1]) if lufs else None,
        "lra": float(lra[-1]) if lra else None,
        "tp": float(tp[-1]) if tp else None,
    }


def main() -> int:
    with open(TIMELINE, encoding="utf-8") as fh:
        total = float(json.load(fh)["total"])
    dur = round(total + 0.06, 3)  # = TOTAL del video: la mezcla termina junto con el cuadro
    print(f"duración del lecho: {dur}s")

    # ── 1) pad: senoidales del acorde + modulación lenta + lowpass + espacio ────
    inputs: list[str] = []
    filters: list[str] = []
    labels: list[str] = []
    for i, (freq, gain) in enumerate(CHORD):
        inputs += ["-f", "lavfi", "-i", f"sine=frequency={freq}:duration={dur}"]
        labels.append(f"p{i}")
        filters.append(f"[{i}:a]volume={gain}[p{i}]")
    pad_mix = "".join(f"[{lb}]" for lb in labels)
    pad_graph = (
        ";".join(filters)
        + f";{pad_mix}amix=inputs={len(CHORD)}:normalize=0[chord]"
        + ";[chord]tremolo=f=0.12:d=0.30[mod]"
        + ";[mod]lowpass=f=1100,lowpass=f=1800[soft]"
        + ";[soft]aecho=0.8:0.85:520|1080:0.28|0.14[space]"
        + f";[space]volume={NIVEL_PAD},afade=t=in:st=0:d=1.2[pad]"
    )

    # ── 2) eventos: un golpe grave cada BEAT s, concatenado con silencio ────────
    golpe = os.path.join(AUDIO, "_golpe.wav")
    gap = os.path.join(AUDIO, "_gap.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", f"sine=frequency=55:duration={GOLPE_S}", "-af",
         f"afade=t=out:st=0:d={GOLPE_S},lowpass=f=320,volume=1.0",
         "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", golpe])
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
         "-i", f"anullsrc=r=44100:cl=mono:d={GOLPE_GAP}",
         "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", gap])

    n_eventos = max(1, int(dur // BEAT))
    lista = os.path.join(AUDIO, "_concat.txt")
    with open(lista, "w", encoding="utf-8") as fh:
        for _ in range(n_eventos):
            fh.write(f"file '{golpe}'\nfile '{gap}'\n")
    ritmo = os.path.join(AUDIO, "_ritmo.wav")
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista,
         "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", ritmo])
    print(f"eventos musicales: {n_eventos} cada {BEAT}s")

    # ── 3) lecho = pad + eventos ────────────────────────────────────────────────
    bed = os.path.join(AUDIO, "music_bed.wav")
    run(["ffmpeg", "-y", "-v", "error", *inputs,
         "-i", ritmo,
         "-filter_complex",
         pad_graph
         + f";[{len(CHORD)}:a]volume={NIVEL_GOLPE},apad,atrim=0:{dur}[ev]"
         + f";[pad][ev]amix=inputs=2:normalize=0,volume=1.0,atrim=0:{dur}[out]",
         "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", bed])
    print("music_bed.wav:", os.path.getsize(bed), "bytes", medir(bed))

    # ── 4) ducking suave: la voz empuja el lecho, pero la pausa respira ─────────
    narration = os.path.join(AUDIO, "narration.wav")
    ducked = os.path.join(AUDIO, "music_bed_ducked.wav")
    run([
        "ffmpeg", "-y", "-v", "error",
        "-i", bed, "-i", narration,
        "-filter_complex",
        f"[0:a][1:a]sidechaincompress={DUCK}[ducked];"
        f"[ducked]afade=t=out:st={max(dur - 2.8, 0)}:d=2.8,atrim=0:{dur}[out]",
        "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", ducked,
    ])
    print("music_bed_ducked.wav:", os.path.getsize(ducked), "bytes", medir(ducked))

    # ── 5) mezcla final: mismas proporciones que usa la composición (voz 1,0 /
    #      lecho 0,92) y normalización a -14 LUFS / -1,5 dBTP en dos pasadas ─────
    pre = os.path.join(AUDIO, "_premix.wav")
    run([
        "ffmpeg", "-y", "-v", "error", "-i", narration, "-i", ducked,
        "-filter_complex", "[0:a]volume=1.0[v];[1:a]volume=0.92[b];[v][b]amix=inputs=2:normalize=0[out]",
        "-map", "[out]", "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", pre,
    ])
    med = sonoridad(pre)
    print(f"premezcla: {med}")
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", pre, "-af",
         f"loudnorm=I={LUFS_OBJ}:TP={TP_OBJ}:LRA={LRA_OBJ}:print_format=json",
         "-f", "null", "-"],
        capture_output=True, text=True,
    )
    js = re.search(r"\{[^{}]*input_i[^{}]*\}", r.stderr, re.S)
    if not js:
        print("ERROR: loudnorm no devolvió medición"); return 1
    m = json.loads(js.group(0))
    mix = os.path.join(AUDIO, "mix_final.wav")
    run([
        "ffmpeg", "-y", "-v", "error", "-i", pre, "-af",
        f"loudnorm=I={LUFS_OBJ}:TP={TP_OBJ}:LRA={LRA_OBJ}"
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
        f":offset={m['target_offset']}:linear=true",
        "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", mix,
    ])
    fin = sonoridad(mix)
    print(f"mix_final.wav: {os.path.getsize(mix)} bytes → "
          f"{fin['lufs']} LUFS · LRA {fin['lra']} LU · pico {fin['tp']} dBFS")

    # ── 6) limpieza de temporales + informe ─────────────────────────────────────
    for tmp in (golpe, gap, lista, ritmo, pre):
        if os.path.exists(tmp):
            os.remove(tmp)

    for label, path in (("narración", narration), ("bed", bed), ("bed duckeado", ducked)):
        v = medir(path)
        print(f"  {label}: media {v.get('mean')} dBFS · pico {v.get('max')} dBFS")

    with open(os.path.join(BASE, "audio_meta.json"), encoding="utf-8") as fh:
        meta = json.load(fh)
    meta["bgm"] = {
        "path": "audio/mix_final.wav",
        "volume": 1.0,
        "query": "synthesized ambient pad + musical events (ffmpeg, sin licencia de terceros)",
        "duration_s": round(total, 3),
    }
    meta["bgm_pending"] = False
    meta["mix"] = {"lufs": fin["lufs"], "lra": fin["lra"], "true_peak_dbfs": fin["tp"],
                   "target_lufs": LUFS_OBJ, "target_tp": TP_OBJ}
    with open(os.path.join(BASE, "audio_meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=1)
    print("audio_meta.json actualizado (bgm = mezcla final normalizada).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
