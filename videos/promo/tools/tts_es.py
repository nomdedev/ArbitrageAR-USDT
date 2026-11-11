#!/usr/bin/env python3
"""Genera la narración del promo (es-AR) con edge-tts: prosodia dirigida y timestamps.

Implementa la dirección de voz de GUION-LOCUCION.md. Tres cosas que hace y que la
versión anterior no hacía:

1. DOBLE TEXTO. Cada palabra tiene una grafía de pantalla y una forma fonética que es
   la que recibe el sintetizador. La pantalla muestra "USDT"; al motor se le manda
   "u ese de té". El motor ignora SSML (no acepta <phoneme> ni <prosody>), así que la
   única palanca real de pronunciación es reescribir el texto.

2. PROSODIA POR LÍNEA. Cada escena tiene su propio `rate` — el hook va más lento que
   las enumeraciones — y su propia pausa posterior. Las pausas no son constantes.

3. ALINEACIÓN VERIFICADA. Las timestamps que devuelve el motor son de las palabras
   fonéticas (pueden ser 4 tokens para 1 palabra de pantalla). Se remapean a las
   palabras de pantalla y se informa cuántas se resolvieron por coincidencia exacta y
   cuántas por interpolación proporcional (cuando el motor fusiona tokens).

Por qué edge-tts y no los motores del framework: Kokoro exige espeak-ng + whisper-cpp
(compilar en Windows) y HeyGen exige cuenta. edge-tts es gratis, sin cuenta, y devuelve
eventos WordBoundary exactos. El audio queda congelado en local: en render no hay red.

Uso:  python tools/tts_es.py
Salida: audio/seg_N.mp3, audio/narration.wav, audio/words.json, audio_meta.json,
        audio/timeline.json

QUÉ ES LA VOZ (y qué no): no se clona ninguna voz real. Un arquetipo se arma con una
voz sintética del catálogo de edge-tts más parámetros de entrega (rate/pitch). La
referencia de registro es "científico loco sarcástico" (narrador) contra "pibe nervioso"
(contrapunto), en dos arquetipos: NARRADOR y CONTRASTE. Clonar la voz de un actor para
imitar a su personaje es un problema de derechos de imagen y de voz de una persona
concreta, y no es lo que hace esto.
"""
from __future__ import annotations

import asyncio
import json
import os
import re
import subprocess

import edge_tts

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")

# ── arquetipos de voz ─────────────────────────────────────────────────────────
#   Un arquetipo = voz del catálogo + entrega. El motor ignora SSML, así que las
#   únicas palancas son la voz, `rate` y `pitch`. El catálogo completo de es-* está
#   en `edge-tts --list-voices`; todas las voces son "Friendly, Positive", así que el
#   carácter sale de la entrega, no del timbre base.
ARQUETIPOS = {
    "narrador": {
        "voz": "es-MX-JorgeNeural",
        "pitch": "-10Hz",   # grave sin forzar
        "nota": "registro del científico loco: rápido, grave, irónico, sin solemnidad",
    },
    "contraste": {
        "voz": "es-PE-AlexNeural",
        "pitch": "+28Hz",   # agudo y joven contra el narrador
        "nota": "registro del pibe nervioso: agudo, acelerado, alarmado",
    },
}
VOICE = ARQUETIPOS["narrador"]["voz"]  # compatibilidad con versiones previas

# ── una sola voz ──────────────────────────────────────────────────────────────
#   El video no es un diálogo: lo lee UN arquetipo de punta a punta. Cuál, se elige
#   acá o por línea de comandos:  python tools/tts_es.py --voz contraste
#   `narrador` = registro del científico loco (grave, rápido, irónico).
#   `contraste` = registro del pibe nervioso (agudo, acelerado, alarmado).
VOZ_UNICA = "contraste" if "--voz" in os.sys.argv and "contraste" in os.sys.argv else "narrador"

# ── dirección por escena ──────────────────────────────────────────────────────
#   (escena, arquetipo, rate, pausa posterior (s), [(grafía de pantalla, forma fonética), ...])
SEGMENTS = [
    (1, "narrador", "+22%", 0.55, [
        ("El", "El"), ("dólar", "dólar"), ("oficial", "oficial"), ("y", "y"),
        ("el", "el"), ("USDT", "u ese de té"), ("no", "no"), ("valen", "valen"),
        ("lo", "lo"), ("mismo.", "mismo."),
    ]),
    (2, "contraste", "+24%", 0.45, [
        ("Esa", "Esa"), ("diferencia", "diferencia"), ("es", "es"), ("real.", "real."),
        ("Medirla", "Medirla"), ("a", "a"), ("tiempo,", "tiempo,"), ("no.", "no."),
    ]),
    (3, "narrador", "+20%", 0.35, [
        ("ArbitrARS", "Arbitr a erre ese"), ("la", "la"), ("mide", "mide"),
        ("sobre", "sobre"), ("49", "49"), ("exchanges,", "exchanges,"),
        ("cada", "cada"), ("30", "30"), ("segundos.", "segundos."),
    ]),
    (4, "narrador", "+26%", 0.35, [
        ("Te", "Te"), ("ordena", "ordena"), ("las", "las"), ("rutas", "rutas"),
        ("por", "por"), ("rentabilidad,", "rentabilidad,"), ("con", "con"),
        ("la", "la"), ("guía", "guía"), ("paso", "paso"), ("a", "a"), ("paso.", "paso."),
    ]),
    (5, "contraste", "+22%", 0.32, [
        ("Simulá", "Simulá"), ("tu", "tu"), ("monto", "monto"), ("y", "y"),
        ("tus", "tus"), ("comisiones", "comisiones"), ("antes", "antes"),
        ("de", "de"), ("operar.", "operar."),
    ]),
    (6, "narrador", "+26%", 0.30, [
        ("Y", "Y"), ("te", "te"), ("avisa", "avisa"), ("solo", "solo"),
        ("cuando", "cuando"), ("la", "la"), ("brecha", "brecha"), ("supera", "supera"),
        ("tu", "tu"), ("umbral.", "umbral."),
    ]),
    (7, "narrador", "+14%", 0.00, [
        ("Todo", "Todo"), ("en", "en"), ("tu", "tu"), ("navegador,", "navegador,"),
        ("sin", "sin"), ("servidores.", "servidores."),
    ]),
]

_PUNCT = re.compile(r"[^\wáéíóúüñÁÉÍÓÚÜÑ0-9]")


def _norm(s: str) -> str:
    return _PUNCT.sub("", s).lower()


async def synth(text: str, rate: str, pitch: str, voice: str) -> tuple[bytes, list[dict]]:
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    audio = bytearray()
    tokens: list[dict] = []
    async for chunk in com.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            tokens.append({
                "text": chunk["text"],
                "start": round(chunk["offset"] / 1e7, 3),
                "end": round((chunk["offset"] + chunk["duration"]) / 1e7, 3),
            })
    return bytes(audio), tokens


def alinear(pares: list[tuple[str, str]], tokens: list[dict], span: tuple[float, float]):
    """Remapea timestamps de palabras fonéticas a palabras de pantalla.

    Primero intenta coincidencia exacta (el motor devuelve un token por palabra
    fonética). Donde el motor fusiona o parte tokens, interpola proporcionalmente
    al largo de la forma fonética dentro del hueco disponible.
    """
    n = len(tokens)
    exacto: list[tuple[int, int] | None] = []
    ti = 0
    for _, speech in pares:
        got = []
        for forma in speech.split():
            if ti < n and _norm(tokens[ti]["text"]) == _norm(forma):
                got.append(ti)
                ti += 1
            else:
                break
        exacto.append((got[0], got[-1]) if got else None)

    # rellenar por interpolación los que quedaron sin token
    salida: list[dict] = []
    for i, (disp, speech) in enumerate(pares):
        if exacto[i]:
            a, b = exacto[i]
            salida.append({"text": disp, "start": tokens[a]["start"], "end": tokens[b]["end"],
                           "metodo": "exacto"})
            continue

        # vecinos asignados que enmarcan el hueco
        prev = next((j for j in range(i - 1, -1, -1) if exacto[j]), None)
        nxt = next((j for j in range(i + 1, len(pares)) if exacto[j]), None)
        ini = tokens[exacto[prev][1]]["end"] if prev is not None else span[0]
        fin = tokens[exacto[nxt][0]]["start"] if nxt is not None else span[1]

        # repartir el hueco entre las palabras sin token consecutivas
        grupo = [k for k in range(len(pares)) if exacto[k] is None
                 and (prev is None or k > prev) and (nxt is None or k < nxt)]
        largos = [len(pares[k][1]) for k in grupo]
        total = sum(largos) or 1
        cursor = ini
        for k, largo in zip(grupo, largos):
            if k == i:
                d = (fin - ini) * largo / total
                salida.append({"text": disp, "start": round(cursor, 3),
                               "end": round(cursor + d, 3), "metodo": "interpolado"})
            cursor += (fin - ini) * largo / total
        if len(salida) <= i:  # seguridad: nunca dejar una palabra sin tiempo
            salida.append({"text": disp, "start": round(ini, 3), "end": round(fin, 3),
                           "metodo": "interpolado"})
    return salida, ti


def duration_of(path: str) -> float:
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True).stdout.strip())


def main() -> int:
    os.makedirs(AUDIO, exist_ok=True)
    segments: list[dict] = []
    total_interp = 0
    total_pal = 0

    print(f"Generando locución dirigida · una sola voz: {VOZ_UNICA}\n")
    for frame, _arq_original, rate, gap, pares in SEGMENTS:
        # una sola voz de punta a punta: el arquetipo por escena queda documentado
        # arriba pero no se usa mientras el video sea monólogo.
        arq = VOZ_UNICA
        perfil = ARQUETIPOS[arq]
        speech = " ".join(f for _, f in pares)
        audio, tokens = asyncio.run(synth(speech, rate, perfil["pitch"], perfil["voz"]))
        path = os.path.join(AUDIO, f"seg_{frame}.mp3")
        with open(path, "wb") as fh:
            fh.write(audio)
        dur = duration_of(path)

        span = (tokens[0]["start"], tokens[-1]["end"]) if tokens else (0.0, dur)
        palabras, _ = alinear(pares, tokens, span)
        interp = [p for p in palabras if p["metodo"] == "interpolado"]
        total_interp += len(interp)
        total_pal += len(palabras)

        display = " ".join(p[0] for p in pares)
        segments.append({"frame": frame, "path": path, "duration": dur,
                         "gap": gap, "rate": rate, "words": palabras, "text": display,
                         "arquetipo": arq, "voz": perfil["voz"], "pitch": perfil["pitch"]})
        aviso = f"  ({len(interp)} interpoladas: {', '.join(p['text'] for p in interp)})" if interp else ""
        print(f"  escena {frame}  {arq:9} {perfil['voz']:20} {rate:>5} {perfil['pitch']:>6}  "
              f"{dur:5.2f}s  {len(tokens):2} tokens → {len(palabras):2} palabras  «{display[:38]}…»{aviso}")

    cursor = 0.0
    for seg in segments:
        seg["start"] = round(cursor, 3)
        cursor = round(cursor + seg["duration"] + seg["gap"], 3)
    total = round(cursor - segments[-1]["gap"], 3)
    print(f"\nLocución total: {total:.2f}s  ({total_interp}/{total_pal} palabras interpoladas)")

    # ── concatenar con las pausas dirigidas ──────────────────────────────────
    silencios: dict[float, str] = {}
    for g in sorted({s["gap"] for s in segments if s["gap"]}):
        p = os.path.join(AUDIO, f"_gap_{int(g*1000)}.mp3")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
                        "anullsrc=r=24000:cl=mono", "-t", f"{g}", "-c:a", "libmp3lame", p],
                       check=True)
        silencios[g] = p

    listfile = os.path.join(AUDIO, "_concat.txt")
    with open(listfile, "w", encoding="utf-8") as fh:
        for i, seg in enumerate(segments):
            fh.write(f"file '{os.path.basename(seg['path'])}'\n")
            if seg["gap"] and i < len(segments) - 1:
                fh.write(f"file '{os.path.basename(silencios[seg['gap']])}'\n")
    narration = os.path.join(AUDIO, "narration.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listfile,
                    "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", narration],
                   cwd=AUDIO, check=True)
    real = duration_of(narration)
    print(f"narration.wav: {real:.2f}s ({os.path.getsize(narration)} bytes)")

    # ── palabras con tiempo global (para las captions) ───────────────────────
    global_words: list[dict] = []
    wid = 0
    for seg in segments:
        for w in seg["words"]:
            global_words.append({"id": f"w{wid}", "text": w["text"],
                                 "start": round(seg["start"] + w["start"], 3),
                                 "end": round(seg["start"] + w["end"], 3)})
            wid += 1
    with open(os.path.join(AUDIO, "words.json"), "w", encoding="utf-8") as fh:
        json.dump(global_words, fh, ensure_ascii=False, indent=1)

    meta = {
        "bgm": None,
        "bgm_pending": True,
        "voices": [{
            "frame": seg["frame"],
            "path": os.path.relpath(seg["path"], BASE).replace("\\", "/"),
            "duration_s": round(seg["duration"], 3),
            "words": [{"id": f"w{i}", "text": w["text"],
                       "start": w["start"], "end": w["end"]}
                      for i, w in enumerate(seg["words"])],
        } for seg in segments],
        "sfx": [],
    }
    with open(os.path.join(BASE, "audio_meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=1)

    with open(os.path.join(AUDIO, "timeline.json"), "w", encoding="utf-8") as fh:
        json.dump({"total": total, "voice": VOICE, "arquetipos": ARQUETIPOS, "segments": [
            {"frame": s["frame"], "start": s["start"], "duration": round(s["duration"], 3),
             "end": round(s["start"] + s["duration"], 3), "rate": s["rate"],
             "gap": s["gap"], "text": s["text"], "arquetipo": s["arquetipo"],
             "voz": s["voz"], "pitch": s["pitch"]} for s in segments]}, fh,
            ensure_ascii=False, indent=1)

    print("\nLínea de tiempo real:")
    for s in segments:
        print(f"  {s['start']:6.2f}s → {s['start']+s['duration']:6.2f}s  "
              f"[{s['frame']}] {s['rate']:>5}  +{s['gap']:.2f}s  {s['text']}")

    # ── verificación de integridad ───────────────────────────────────────────
    print("\nVerificación:")
    fallas = []
    for w in global_words:
        if w["end"] <= w["start"]:
            fallas.append(f"palabra '{w['text']}' con duración no positiva")
    ord_ok = all(global_words[i]["start"] <= global_words[i + 1]["start"]
                 for i in range(len(global_words) - 1))
    print(f"  {len(global_words)} palabras · {total_interp} interpoladas · "
          f"orden temporal {'correcto' if ord_ok else 'ROTO'}")
    if not ord_ok:
        fallas.append("orden temporal de palabras roto")
    print("  " + ("sin problemas" if not fallas else "; ".join(fallas)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
