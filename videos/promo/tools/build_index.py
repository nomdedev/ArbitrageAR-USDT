#!/usr/bin/env python3
"""Genera index.html — la composición HyperFrames del promo de ArbitrARS.

Por qué un generador y no escribir el HTML a mano:
  los 27 s del video están sincronizados con 63 palabras de narración. Cada caption
  cinética revela su palabra EXACTAMENTE en el instante en que se pronuncia. Escribir
  esos tiempos a mano es garantizar la desincronización; acá salen de audio/words.json
  (timestamps reales de WordBoundary de edge-tts) y de audio/timeline.json.

Uso:  python tools/build_index.py
Salida: index.html (composición standalone, 1920x1080, 27.30 s)
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys

# ── formato de salida ─────────────────────────────────────────────────────────
#  horizontal 1920x1080 (YouTube / LinkedIn)   ·   vertical 1080x1920 (reels / shorts)
#  El layout se parametriza por CSS: misma composición y mismos tiempos, otra
#  disposición. La vertical apila el teléfono arriba y los datos abajo.
VERTICAL = "--vertical" in sys.argv
W, H = (1080, 1920) if VERTICAL else (1920, 1080)
# Un proyecto puede tener UNA sola composición raíz (`index.html`): el linter marca
# `multiple_root_compositions` como error y eso invalida el chequeo. Las variantes van
# en `compositions/`, que es donde el CLI las busca al renderizar con `-c`.
OUT_NAME = "compositions/vertical.html" if VERTICAL else "index.html"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")


def _duracion(nombre: str) -> float:
    """Duración real de un archivo de audio, medida con ffprobe.

    Estaba hardcodeada (27.30 / 27.26) y cuando la locución cambió de dirección pasó a
    recortar el audio. Ahora la composición se deriva del archivo: si la voz o la música
    cambian de largo, el video las sigue solo.
    """
    ruta = os.path.join(AUDIO, nombre)
    salida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta],
        capture_output=True, text=True, check=True).stdout.strip()
    return round(float(salida), 3)


VOZ_DUR = _duracion("narration.wav")
MIX_DUR = _duracion("mix_final.wav")
# el video dura lo que dura la voz más un respiro mínimo para que la última
# animación resuelva antes del corte final
TOTAL = round(VOZ_DUR + 0.06, 3)

# ── paleta de marca (remapeada desde el preset broadside por build-frame.mjs) ──────
C = {
    "ground": "#09090b",
    "ground_alt": "#18191A",
    "text": "#f0f6fc",
    "muted": "#8B9199",
    "faint": "#484B50",
    "border": "#262728",
    "accent": "#3b82f6",
    "cyan": "#56d4dd",
}

# 49 exchanges reales del proyecto (src/options.html) — el muro de datos de la escena 2
EXCHANGES = [
    "binance", "lemoncash", "ripio", "buenbit", "fiwind", "letsbit", "belo", "satoshitango",
    "bitso", "decrypto", "cocoscrypto", "pluscrypto", "tiendacrypto", "universalcoins",
    "saldo", "bitfinex", "kraken", "coinbase", "gemini", "bitstamp", "poloniex", "cexio",
    "gateio", "okx", "bybit", "eluter", "vitawallet", "wallbit", "xapo", "x4t", "trubit",
    "astropay", "banexcoin", "bingx", "bitget", "coinex", "cryptomktpro", "eldorado",
    "huobi", "kucoin", "mexc", "paydece", "weex", "bitsoalpha", "ripioexchange",
    "krakenp2p", "binancep2p", "bybitp2p", "okxp2p",
]

# pasos de la guía real del popup (pestaña "Guía Paso a Paso")
STEPS = [
    ("01", "Comprar dólar oficial", "en tu banco, dentro del cupo"),
    ("02", "Convertir a USDT", "transferís los USD al exchange"),
    ("03", "Vender los USDT", "por pesos, al mejor precio del mercado"),
    ("04", "Retirar la ganancia", "de vuelta a tu cuenta bancaria"),
]

# campos del simulador (lado ENTRADA: monto y comisiones — no se muestra ninguna ganancia)
SIM_FIELDS = [
    ("MONTO A INVERTIR", "$ 1.000.000", True),
    ("COMISIÓN DE TRADING", "0,5 %", False),
    ("COMISIÓN DE RETIRO", "0,5 %", False),
    ("COMISIÓN BANCARIA", "$ 0", False),
]


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def cargar_timeline():
    with open(os.path.join(AUDIO, "timeline.json"), encoding="utf-8") as fh:
        tl = json.load(fh)
    with open(os.path.join(AUDIO, "words.json"), encoding="utf-8") as fh:
        words = json.load(fh)
    segs = tl["segments"]
    # asignar cada palabra a su escena por ventana temporal
    for s in segs:
        s["words"] = []
    for w in words:
        for s in segs:
            if s["start"] - 0.05 <= w["start"] < s["end"] + 0.16:
                s["words"].append(w)
                break
        else:
            segs[-1]["words"].append(w)
    return segs


def ventanas(segs):
    """Ventana contigua de cada clip: arranca donde termina el anterior (sin huecos)."""
    out = []
    for i, s in enumerate(segs):
        start = 0.0 if i == 0 else round(segs[i - 1]["end"] + 0.30, 2)
        end = TOTAL if i == len(segs) - 1 else round(s["end"] + 0.30, 2)
        out.append((round(start, 2), round(end - start, 2)))
    return out


def caption_html(seg) -> str:
    """Caption cinética: un span por palabra, con su tiempo real de voz."""
    parts = []
    for i, w in enumerate(seg["words"]):
        parts.append(
            f'<span class="cw" data-s="{w["start"]}" data-e="{w["end"]}">{esc(w["text"])}</span>'
        )
    return "".join(parts)


def caption_anim(seg_id: str, seg) -> str:
    """Tweens de la caption: revelado por palabra + resaltado mientras se pronuncia."""
    out = []
    for i, w in enumerate(seg["words"]):
        t = w["start"]
        out.append(
            f'  tl.fromTo("#{seg_id} .cw[data-s=\'{w["start"]}\']",'
            f' {{ y: 26, opacity: 0 }},'
            f' {{ y: 0, opacity: 1, duration: .26, ease: "power2.out" }}, {t});'
        )
        out.append(
            f'  tl.set("#{seg_id} .cw[data-s=\'{w["start"]}\']", '
            f'{{ color: "{C["accent"]}" }}, {t});'
        )
        out.append(
            f'  tl.set("#{seg_id} .cw[data-s=\'{w["start"]}\']", '
            f'{{ color: "{C["text"]}" }}, {round(w["end"] + 0.06, 3)});'
        )
    return "\n".join(out)


def build() -> str:
    segs = cargar_timeline()
    win = ventanas(segs)

    with open(os.path.join(BASE, "assets", "fonts.css"), encoding="utf-8") as fh:
        # el CSS se inlinea en index.html (raíz del proyecto), así que las rutas
        # relativas al archivo CSS hay que reanclarlas a assets/fonts/
        fontface = fh.read().strip().replace("url(fonts/", "url(assets/fonts/")

    # ── layout vertical (1080x1920) ────────────────────────────────────────────
    #  La interfaz del producto es retrato (428x599): en 16:9 queda topada al 22%
    #  del ancho y el cuadro se lee como vacío; en 9:16 el mismo producto puede
    #  ocupar más de la mitad. Misma composición, mismos tiempos y mismos textos:
    #  sólo cambia la disposición. El bloque va al final del CSS a propósito, para
    #  que sus reglas ganen por orden de cascada.
    vert_css = "" if not VERTICAL else """
/* ───────── VERTICAL 1080x1920 (reels / shorts) ───────── */
#brand { left: 60px; top: 112px; gap: 12px; }
#brand b { font-size: 30px; }
#brand i { font-size: 14px; letter-spacing: .16em; }
#hair-top { top: 196px; }
#hair-bot { bottom: 452px; }
#foot { left: 60px; right: 60px; bottom: 400px; font-size: 15px; }

/* zona útil: 230 → 1280 (deja libres los 440px que en un feed tapa la interfaz) */
.scene { left: 60px; right: 60px; top: 230px; bottom: 640px; }
.caps { bottom: 470px; }
.caps-in { max-width: 940px; font-size: 52px; }
.cw { margin: 0 8px; }

/* el producto manda: teléfono arriba, datos abajo y centrados */
.split { display: flex; flex-direction: column; align-items: center; justify-content: center;
         gap: 34px; height: 100%; }
.split > div:not(.phone):not(.notif-stage) { width: 100%; text-align: center; }
.phone { width: 600px; height: 840px; margin: 0; border-radius: 32px; }
.feat-label { font-size: 15px; }
.feat-head { font-size: 50px; line-height: 1.06; margin-top: 12px; max-width: 100%; }
.big-num { font-size: 150px; line-height: .88; }
.chips { margin-top: 22px; justify-content: center; gap: 10px; }
.chip { font-size: 15px; padding: 12px 19px; }
.steps { margin-top: 24px; gap: 15px; }
.step { grid-template-columns: 58px 1fr; padding-top: 13px; }
.step b { font-size: 30px; }
.step span { font-size: 17px; }
.fields { margin-top: 22px; max-width: 100%; gap: 11px; }
.field { padding: 17px 21px; }
.field b { font-size: 27px; }

/* hook: en 9:16 la comparación se lee mejor apilada que en fila */
.s1 { gap: 38px; }
.s1-row { flex-direction: column; gap: 20px; }
.s1-word { font-size: 128px; }
#s1-neq { width: 108px; height: 108px; }
.s1-sub { font-size: 16px; letter-spacing: .2em; max-width: 900px; text-align: center; }

/* muro de exchanges: cuatro columnas en vez de siete, y el 49 primero */
#s2 .scene { display: flex; flex-direction: column; align-items: center; }
.s2-title { order: 1; font-size: 48px; max-width: 960px; text-align: center; }
.s2-badge { order: 2; position: static; text-align: center; margin: 30px 0 0; }
.s2-badge b { font-size: 138px; margin-bottom: 12px; }
.s2-grid { order: 3; grid-template-columns: repeat(4, 1fr); gap: 10px 18px; margin-top: 28px; }
.s2-chip { font-size: 17px; padding: 11px 0 11px 12px; }
.s2-note { order: 4; margin-top: 28px; font-size: 14px; text-align: center; }

/* alertas: la notificación arriba (es el sujeto) y el texto abajo */
#s6 .split { flex-direction: column-reverse; }
.notif-stage { width: 100%; height: 600px; }
.notif { width: 840px; grid-template-columns: 66px 1fr; }
.notif .ic { width: 66px; height: 66px; }
.notif h4 { font-size: 29px; }
.notif p { font-size: 20px; }

/* cierre */
.s7 { gap: 26px; }
.s7-mark { width: 344px; height: 320px; }
.s7-word { font-size: 134px; }
.s7-stack { font-size: 15px; letter-spacing: .2em; }
.s7-cta { font-size: 20px; }
"""

    css = f"""
{fontface}

:root {{
  --ground: {C['ground']};
  --ground-alt: {C['ground_alt']};
  --text: {C['text']};
  --muted: {C['muted']};
  --faint: {C['faint']};
  --border: {C['border']};
  --accent: {C['accent']};
  --cyan: {C['cyan']};
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: var(--ground); }}
body {{ font-family: 'Barlow', system-ui, sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }}

#root {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--ground); }}

/* fondo persistente: sin data-start, necesita su propio posicionamiento */
#bg {{ position: absolute; inset: 0; background:
    radial-gradient(1100px 620px at 78% 8%, rgba(59,130,246,.13), transparent 62%),
    radial-gradient(900px 520px at 12% 96%, rgba(86,212,221,.07), transparent 60%),
    linear-gradient(180deg, #09090b 0%, #0d0e11 52%, #09090b 100%); }}
#grid {{ position: absolute; inset: 0; opacity: .5;
    background-image: linear-gradient(rgba(59,130,246,.055) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(59,130,246,.055) 1px, transparent 1px);
    background-size: 64px 64px; }}
#hair-top, #hair-bot {{ position: absolute; left: 0; right: 0; height: 1px; background: var(--border); }}
#hair-top {{ top: 96px; }}
#hair-bot {{ bottom: 96px; }}

/* cromo persistente (marca + pie) */
#brand {{ position: absolute; left: 72px; top: 40px; display: flex; align-items: baseline; gap: 14px; }}
#brand b {{ font: 700 26px/1 'Barlow'; letter-spacing: .01em; }}
#brand i {{ font: 500 12.5px/1 'IBM Plex Mono'; letter-spacing: .18em; color: var(--cyan); font-style: normal; }}
#foot {{ position: absolute; left: 72px; right: 72px; bottom: 40px; display: flex; justify-content: space-between;
    font: 500 13px/1 'IBM Plex Mono'; letter-spacing: .13em; color: var(--muted); }}
#foot .a {{ color: var(--muted); }}
#foot .b {{ color: #7A7D81; }}

.mono {{ font-family: 'IBM Plex Mono'; letter-spacing: .15em; text-transform: uppercase; }}

/* ── escenas ── */
.clip {{ position: absolute; inset: 0; }}
.pz {{ position: absolute; inset: 0; }}
.scene {{ position: absolute; left: 72px; right: 72px; top: 138px; bottom: 300px; }}

/* caption cinética — banda propia, con aire respecto de la escena y del pie */
.caps {{ position: absolute; left: 0; right: 0; bottom: 118px; display: flex; justify-content: center; }}
.caps-in {{ max-width: 1500px; text-align: center; font: 600 42px/1.25 'Barlow'; letter-spacing: -.005em; }}
.cw {{ display: inline-block; margin: 0 9px; color: var(--text); }}

/* escena 1 — hook */
.s1 {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 46px; }}
.s1-row {{ display: flex; align-items: center; gap: 54px; }}
.s1-word {{ font: 900 148px/1 'Barlow'; letter-spacing: -.03em; display: block; }}
.s1-word.alt {{ color: var(--muted); }}
#s1-neq {{ width: 132px; height: 132px; display: block; }}
.s1-sub {{ font: 500 15px/1 'IBM Plex Mono'; letter-spacing: .26em; color: var(--cyan); text-transform: uppercase; }}

/* escena 2 — muro de exchanges */
.s2-title {{ font: 600 62px/1.1 'Barlow'; letter-spacing: -.02em; max-width: 1180px; }}
.s2-title em {{ font-style: normal; color: var(--accent); }}
.s2-grid {{ display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px 22px; width: 100%; margin-top: 44px; }}
.s2-chip {{ font: 400 19px/1 'IBM Plex Mono'; color: var(--muted); padding: 13px 0 13px 14px;
    border-left: 1px solid var(--border); display: block; }}
.s2-note {{ margin-top: 40px; font: 500 15px/1 'IBM Plex Mono'; letter-spacing: .14em; color: var(--muted); text-transform: uppercase; }}
.s2-badge {{ position: absolute; right: 0; top: 4px; text-align: right; }}
.s2-badge b {{ font: 900 128px/1 'Barlow'; color: var(--accent); display: block; letter-spacing: -.03em; margin-bottom: 22px; }}
.s2-badge span {{ font: 500 14px/1 'IBM Plex Mono'; letter-spacing: .18em; color: var(--muted); text-transform: uppercase; display: block; }}

/* escenas 3-5 — producto + columna de datos */
.split {{ display: grid; grid-template-columns: 700px 1fr; gap: 90px; height: 100%; align-items: center; }}
.phone {{ width: 424px; height: 594px; margin: 0 auto; border: 1px solid var(--border); border-radius: 26px;
    overflow: hidden; background: var(--ground-alt); position: relative;
    box-shadow: 0 40px 90px rgba(0,0,0,.6), 0 0 0 8px rgba(255,255,255,.02); }}
.phone img {{ width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }}
.scan {{ position: absolute; left: 0; right: 0; height: 140px; top: -140px;
    background: linear-gradient(180deg, rgba(59,130,246,0), rgba(59,130,246,.42), rgba(59,130,246,0)); }}
.feat-label {{ font: 500 14px/1 'IBM Plex Mono'; letter-spacing: .22em; color: var(--cyan); text-transform: uppercase; }}
.feat-head {{ font: 700 76px/1.02 'Barlow'; letter-spacing: -.025em; margin-top: 22px; max-width: 900px; }}
.feat-head em {{ font-style: normal; color: var(--accent); }}
.big-num {{ font: 900 176px/0.86 'Barlow'; color: var(--accent); letter-spacing: -.04em; }}
.chips {{ display: flex; gap: 12px; margin-top: 30px; flex-wrap: wrap; }}
.chip {{ font: 500 15px/1 'IBM Plex Mono'; letter-spacing: .12em; color: var(--text);
    border: 1px solid var(--border); border-radius: 999px; padding: 12px 20px; text-transform: uppercase; }}
.chip.on {{ border-color: rgba(59,130,246,.6); color: var(--accent); }}

/* pasos */
.steps {{ margin-top: 40px; display: flex; flex-direction: column; gap: 20px; }}
.step {{ display: grid; grid-template-columns: 74px 1fr; align-items: baseline;
    border-top: 1px solid var(--border); padding-top: 18px; }}
.step i {{ font: 500 15px/1 'IBM Plex Mono'; color: var(--accent); font-style: normal; letter-spacing: .1em; }}
.step b {{ font: 600 34px/1.15 'Barlow'; display: block; }}
.step span {{ font: 400 18px/1.4 'Barlow'; color: var(--muted); display: block; margin-top: 5px; }}

/* campos del simulador */
.fields {{ margin-top: 38px; display: flex; flex-direction: column; gap: 14px; max-width: 620px; }}
.field {{ display: flex; justify-content: space-between; align-items: center;
    border: 1px solid var(--border); border-radius: 14px; padding: 20px 24px; background: rgba(255,255,255,.012); }}
.field label {{ font: 500 13px/1 'IBM Plex Mono'; letter-spacing: .16em; color: var(--muted); text-transform: uppercase; }}
.field b {{ font: 600 30px/1 'Barlow'; }}
.field.primary {{ border-color: rgba(59,130,246,.55); }}
.field.primary b {{ color: var(--accent); }}
.caret {{ display: inline-block; width: 2px; height: 30px; background: var(--accent); vertical-align: -4px; margin-left: 8px; }}

/* notificaciones (escena 6) */
.notif-stage {{ position: relative; height: 560px; display: flex; align-items: center; justify-content: center; }}
.notif {{ position: absolute; width: 720px; border: 1px solid var(--border); border-radius: 20px; padding: 26px 30px;
    background: linear-gradient(180deg, #1a1c20 0%, #141619 100%); display: grid;
    grid-template-columns: 62px 1fr; gap: 20px; align-items: center;
    box-shadow: 0 34px 80px rgba(0,0,0,.62); }}
.notif.ghost2 {{ opacity: .28; filter: blur(1.1px); }}
.notif.ghost1 {{ opacity: .55; filter: blur(.5px); }}
.notif.ghost1, .notif.ghost2 {{ height: 118px; display: block; padding: 0; }}
.notif.ghost1 .dot, .notif.ghost2 .dot {{ display: block; }}
.notif .ic {{ width: 62px; height: 62px; border-radius: 15px; overflow: hidden; background: #0b0d10; display: grid; place-items: center; }}
.notif .ic img {{ width: 100%; height: 100%; object-fit: contain; }}
.notif h4 {{ font: 600 27px/1.2 'Barlow'; }}
.notif p {{ font: 400 19px/1.35 'Barlow'; color: var(--muted); margin-top: 5px; }}
.notif .t {{ position: absolute; right: 30px; top: 26px; font: 500 12.5px/1 'IBM Plex Mono'; letter-spacing: .14em; color: var(--faint); text-transform: uppercase; }}
.notif .dot {{ position: absolute; left: -1px; top: 50%; width: 3px; height: 44px; margin-top: -22px; background: var(--accent); border-radius: 2px; }}

/* escena 7 — cierre */
.s7 {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; }}
.s7-mark {{ width: 300px; height: 278px; position: relative; }}
.s7-mark img {{ width: 100%; height: 100%; display: block; }}
.s7-word {{ font: 900 116px/1 'Barlow'; letter-spacing: -.035em; }}
.s7-word i {{ font-style: normal; color: var(--accent); }}
.s7-stack {{ font: 500 15px/1 'IBM Plex Mono'; letter-spacing: .24em; color: var(--muted); text-transform: uppercase; }}
.s7-cta {{ margin-top: 8px; font: 500 19px/1 'IBM Plex Mono'; letter-spacing: .1em; color: var(--accent); }}
{vert_css}"""

    # ── markup de escenas ──────────────────────────────────────────────────────
    chips = "".join(f'<span class="s2-chip">{e}</span>' for e in EXCHANGES[:49])
    steps = "".join(
        f'<div class="step"><i>{n}</i><div><b>{esc(t)}</b><span>{esc(d)}</span></div></div>'
        for n, t, d in STEPS
    )
    caret = "<span class='caret' id='s5-caret'></span>"
    fields = "".join(
        f'<div class="field{" primary" if p else ""}"><label>{esc(l)}</label>'
        f'<b>{esc(v)}{caret if p else ""}</b></div>'
        for l, v, p in SIM_FIELDS
    )

    scenes = []
    # 1 — HOOK
    scenes.append(("s1", f"""
      <div class="s1">
        <div class="s1-row">
          <span class="s1-word" id="s1-a">OFICIAL</span>
          <svg id="s1-neq" viewBox="0 0 132 132" aria-hidden="true">
            <rect x="8" y="44" width="116" height="12" rx="3" fill="#f0f6fc"/>
            <rect x="8" y="76" width="116" height="12" rx="3" fill="#f0f6fc"/>
            <rect x="-6" y="59" width="144" height="13" rx="4" fill="#3b82f6"
                  transform="rotate(-34 66 66)"/>
          </svg>
          <span class="s1-word alt" id="s1-b">USDT</span>
        </div>
        <div class="s1-sub" id="s1-sub">La brecha entre los dos precios es la oportunidad</div>
      </div>"""))
    # 2 — PROBLEMA
    scenes.append(("s2", f"""
      <div class="s2-badge" id="s2-badge"><b>49</b><span>exchanges</span></div>
      <div class="s2-title" id="s2-title">Medirla a mano <em>no escala</em></div>
      <div class="s2-grid" id="s2-grid">{chips}</div>
      <div class="s2-note" id="s2-note">49 exchanges · 2 precios por exchange · comisiones distintas por plataforma</div>"""))
    # 3 — FEATURE 1
    scenes.append(("s3", f"""
      <div class="split">
        <div class="phone" id="s3-phone" data-layout-allow-overflow>
          <img src="capture/assets/popup-exchanges.png" alt="Precios por exchange en ArbitrARS"/>
          <div class="scan" id="s3-scan"></div>
        </div>
        <div>
          <div class="feat-label" id="s3-label">Feature 01 · Cobertura</div>
          <div class="big-num" id="s3-num">49</div>
          <div class="feat-head" id="s3-head">exchanges, <em>cada 30 segundos</em></div>
          <div class="chips" id="s3-chips">
            <span class="chip on">CriptoYA · USDT/ARS</span>
            <span class="chip">Bancos · dólar oficial</span>
            <span class="chip">Spot + P2P</span>
          </div>
        </div>
      </div>"""))
    # 4 — FEATURE 2
    scenes.append(("s4", f"""
      <div class="split">
        <div class="phone" id="s4-phone" data-layout-allow-overflow>
          <img src="capture/assets/popup-main.png" alt="Rutas de arbitraje en ArbitrARS"/>
        </div>
        <div>
          <div class="feat-label" id="s4-label">Feature 02 · Rutas</div>
          <div class="feat-head" id="s4-head" style="font-size:60px">Ordenadas por rentabilidad, <em>con la guía adentro</em></div>
          <div class="steps" id="s4-steps">{steps}</div>
        </div>
      </div>"""))
    # 5 — FEATURE 3
    scenes.append(("s5", f"""
      <div class="split">
        <div class="phone" id="s5-phone" data-layout-allow-overflow>
          <img src="capture/assets/popup-sim.png" alt="Simulador de ArbitrARS"/>
        </div>
        <div>
          <div class="feat-label" id="s5-label">Feature 03 · Simulador</div>
          <div class="feat-head" id="s5-head" style="font-size:58px">Tu monto y tus comisiones, <em>antes de operar</em></div>
          <div class="fields" id="s5-fields">{fields}</div>
        </div>
      </div>"""))
    # 6 — FEATURE 4
    scenes.append(("s6", f"""
      <div class="split" style="grid-template-columns: 1fr 860px">
        <div>
          <div class="feat-label" id="s6-label">Feature 04 · Alertas</div>
          <div class="feat-head" id="s6-head" style="font-size:64px">Te avisa solo, <em>cuando supera tu umbral</em></div>
          <div class="chips" id="s6-chips">
            <span class="chip on">Notificación nativa</span>
            <span class="chip">Umbral configurable</span>
            <span class="chip">Horario silencioso</span>
          </div>
        </div>
        <div class="notif-stage">
          <div class="notif ghost2" id="s6-g2"><div class="dot"></div></div>
          <div class="notif ghost1" id="s6-g1"><div class="dot"></div></div>
          <div class="notif" id="s6-n">
            <div class="dot"></div>
            <div class="ic"><img src="capture/assets/icon128.png" alt="ArbitrARS"/></div>
            <div>
              <h4>Brecha detectada</h4>
              <p>Una ruta supera el umbral que configuraste.</p>
            </div>
            <div class="t">ahora</div>
          </div>
        </div>
      </div>"""))
    # 7 — CIERRE
    scenes.append(("s7", """
      <div class="s7">
        <div class="s7-mark" id="s7-mark"><img src="capture/assets/logo-mark.png" alt="ArbitrARS"/></div>
        <div class="s7-word" id="s7-word">Arbitr<i>ARS</i></div>
        <div class="s7-stack" id="s7-stack">Manifest V3 · 49 exchanges · 203 tests · 0 servidores</div>
        <div class="s7-cta" id="s7-cta">github.com/nomdedev/ArbitrageAR-USDT</div>
      </div>"""))

    scene_html = []
    for i, ((sid, body), (start, dur), seg) in enumerate(zip(scenes, win, segs), start=1):
        scene_html.append(f"""
    <section class="clip scene-clip" id="{sid}" data-start="{start}" data-duration="{dur}" data-track-index="{2 + i}">
      <div class="pz" id="{sid}-pz">
        <div class="scene">
{body}
        </div>
      </div>
      <div class="caps"><div class="caps-in" id="{sid}-caps">{caption_html(seg)}</div></div>
    </section>""")

    # ── timeline GSAP (una sola, en pausa, registrada) ─────────────────────────
    anim = []
    total = TOTAL
    # deriva continua de la grilla de fondo: hay movimiento en TODOS los cuadros,
    # incluso en los que no tienen animación propia (no altera ninguna caja)
    anim.append(f'  tl.fromTo("#grid", {{ backgroundPosition: "0px 0px" }}, '
                f'{{ backgroundPosition: "128px 64px", duration: {TOTAL}, ease: "none" }}, 0);')
    for i, ((sid, _), (start, dur), seg) in enumerate(zip(scenes, win, segs), start=1):
        anim.append(f"\n  /* ── escena {i} ({sid}) · {start}s +{dur}s ── */")
        # PUSH-IN: la escena entera deriva durante toda su duración. El plano nunca
        # se queda quieto y, como el cuadro ya está compuesto, no hay fotograma vacío.
        anim.append(f'  tl.fromTo("#{sid}-pz", {{ scale: 1 }}, '
                    f'{{ scale: 1.03, duration: {dur}, ease: "none" }}, {start});')
        # Las entradas del BLOQUE PRINCIPAL son sólo de transformación: nada de
        # opacity 0. Con opacity, GSAP deja el elemento invisible desde el armado de
        # la línea de tiempo y el cuadro entrante aparece en negro 50-450 ms. Sin
        # opacity, el elemento está en pantalla desde su primer fotograma.
        if sid == "s1":
            anim.append(f'''  tl.fromTo("#s1-a", {{ x: -70 }}, {{ x: 0, duration: .62, ease: "power3.out" }}, {start});
  tl.fromTo("#s1-b", {{ x: 70 }}, {{ x: 0, duration: .62, ease: "power3.out" }}, {start + 0.14});
  tl.fromTo("#s1-neq", {{ scale: .55, rotate: -18 }}, {{ scale: 1, rotate: 0, duration: .7, ease: "back.out(1.7)" }}, {start + 0.08});
  tl.fromTo("#s1-sub", {{ opacity: 0, y: 16 }}, {{ opacity: 1, y: 0, duration: .5 }}, {start + 0.95});''')
        if sid == "s2":
            anim.append(f'''  tl.fromTo("#s2-title", {{ y: 30 }}, {{ y: 0, duration: .5, ease: "power2.out" }}, {start});
  tl.fromTo("#s2-badge", {{ y: 26 }}, {{ y: 0, duration: .55, ease: "power2.out" }}, {start + 0.06});
  tl.fromTo("#s2-grid .s2-chip", {{ opacity: 0, x: -14 }}, {{ opacity: 1, x: 0, duration: .22, stagger: 0.008, ease: "power1.out" }}, {start + 0.12});
  tl.fromTo("#s2-note", {{ opacity: 0 }}, {{ opacity: 1, duration: .45 }}, {start + 0.9});''')
        if sid in ("s3", "s4", "s5"):
            anim.append(f'''  tl.fromTo("#{sid}-phone", {{ scale: .97 }}, {{ scale: 1, duration: .6, ease: "power3.out" }}, {start});
  tl.fromTo("#{sid}-phone img", {{ scale: 1 }}, {{ scale: 1.09, duration: {dur}, ease: "none" }}, {start});
  tl.fromTo("#{sid}-label", {{ x: 22 }}, {{ x: 0, duration: .45 }}, {start + 0.06});
  tl.fromTo("#{sid}-head", {{ x: 22 }}, {{ x: 0, duration: .5 }}, {start + 0.18});''')
        if sid == "s3":
            anim.append(f'''  tl.fromTo("#s3-num", {{ scale: .86 }}, {{ scale: 1, duration: .55, ease: "back.out(1.5)" }}, {start + 0.26});
  tl.fromTo("#s3-chips .chip", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: .38, stagger: .07 }}, {start + 0.6});
  tl.fromTo("#s3-scan", {{ y: -140 }}, {{ y: 620, duration: {dur - 0.3}, ease: "none" }}, {start + 0.35});''')
        if sid == "s4":
            anim.append(f'''  tl.fromTo("#s4-steps .step", {{ opacity: 0, x: 26 }}, {{ opacity: 1, x: 0, duration: .42, stagger: .22, ease: "power2.out" }}, {start + 0.5});''')
        if sid == "s5":
            anim.append(f'''  tl.fromTo("#s5-fields .field", {{ opacity: 0, x: 26 }}, {{ opacity: 1, x: 0, duration: .34, stagger: .12 }}, {start + 0.5});
  tl.fromTo("#s5-caret", {{ opacity: 0 }}, {{ opacity: 1, duration: .34, repeat: 5, yoyo: true, ease: "steps(1)" }}, {start + 0.8});''')
        if sid == "s6":
            anim.append(f'''  tl.fromTo("#s6-label", {{ x: -22 }}, {{ x: 0, duration: .45 }}, {start});
  tl.fromTo("#s6-head", {{ x: -22 }}, {{ x: 0, duration: .5 }}, {start + 0.1});
  tl.fromTo("#s6-chips .chip", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: .3, stagger: .06 }}, {start + 0.22});
  tl.fromTo("#s6-g2", {{ opacity: 0, x: 90, y: 96, scale: .94 }}, {{ opacity: .28, x: 0, y: 96, scale: .94, duration: .5 }}, {start + 0.04});
  tl.fromTo("#s6-g1", {{ opacity: 0, x: 90, y: 50, scale: .97 }}, {{ opacity: .55, x: 0, y: 50, scale: .97, duration: .5 }}, {start + 0.12});
  tl.fromTo("#s6-n", {{ opacity: 0, x: 130 }}, {{ opacity: 1, x: 0, duration: .46, ease: "power3.out" }}, {start + 0.16});''')
        if sid == "s7":
            anim.append(f'''  tl.fromTo("#s7-mark", {{ scale: .8 }}, {{ scale: 1, duration: .7, ease: "power3.out" }}, {start});
  tl.fromTo("#s7-word", {{ y: 26 }}, {{ y: 0, duration: .55 }}, {start + 0.14});
  tl.fromTo("#s7-stack", {{ opacity: 0 }}, {{ opacity: 1, duration: .5 }}, {start + 0.4});
  tl.fromTo("#s7-cta", {{ opacity: 0, y: 12 }}, {{ opacity: 1, y: 0, duration: .5 }}, {start + 0.55});
  tl.to("#s7-cta", {{ color: "#f0f6fc", duration: .4 }}, {total - 0.5:.2f});''')
        anim.append(caption_anim(sid, seg))

    total = TOTAL
    anim_block = "\n".join(anim)
    # limpiar ruido de punto flotante (8.280000000000001 → 8.28) sin tocar los
    # timestamps de palabra, que ya vienen con 3 decimales exactos
    anim_block = re.sub(r"\d+\.\d{4,}", lambda m: str(round(float(m.group(0)), 3)), anim_block)

    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <title>ArbitrARS — Detector de Arbitraje · promo</title>
    <script src="assets/gsap.min.js"></script>
    <style>{css}
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="arbitrars-promo"
      data-start="0"
      data-width="{W}"
      data-height="{H}"
      data-duration="{TOTAL}"
    >
      <div id="bg"></div>
      <div id="grid"></div>
      <div id="hair-top"></div>
      <div id="hair-bot"></div>
      <div id="brand"><b>ArbitrARS</b><i>Detector de Arbitraje</i></div>
      <div id="foot">
        <span class="a">github.com/nomdedev/ArbitrageAR-USDT</span>
        <span class="b">Manifest V3 · v6.0.0 · 203 tests</span>
      </div>
{''.join(scene_html)}

      <audio id="mix" src="audio/mix_final.wav" data-start="0" data-duration="{MIX_DUR}"
             data-volume="1" data-track-index="0"></audio>
    </div>

    <script>
      const tl = gsap.timeline({{ paused: true }});
{anim_block}
      window.__timelines["arbitrars-promo"] = tl;
    </script>
  </body>
</html>
"""


if __name__ == "__main__":
    html = build()
    out = os.path.join(BASE, OUT_NAME)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(html)
    words = len(re.findall(r'class="cw"', html))
    print(f"{OUT_NAME} generado: {len(html)} bytes · {words} palabras de caption sincronizadas")
