#!/usr/bin/env python3
"""Consolida los hallazgos de la auditoría en un registro único.

Uso:  python docs/auditoria-2026-09/tools/consolidar.py

Lee todos los informes de docs/auditoria-2026-09/ que tengan hallazgos con el
formato de encabezado `#... <ID> — <SEVERIDAD> — <título>` y regenera
CONSOLIDADO-HALLAZGOS.md con el conteo por severidad, la tabla maestra y el
orden de corrección propuesto.

Es idempotente: se puede correr de nuevo cada vez que un auditor entrega su
informe y el consolidado se rearma solo. No inventa datos: lo que no puede
extraer lo marca como "(revisar en el informe origen)".
"""
from __future__ import annotations

import os
import re
import sys
from datetime import datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # docs/auditoria-2026-09
SALIDA = os.path.join(BASE, "CONSOLIDADO-HALLAZGOS.md")

# informe -> (área, prefijo de IDs)
FUENTES = {
    "HALLAZGOS-VERIFICADOS-ORQUESTADOR.md": "Financiero / motor de cálculo",
    "01-BACKGROUND.md": "Background (service worker)",
    "02-POPUP.md": "Popup / UI",
    "03-OPTIONS.md": "Configuración (options)",
    "04-SEGURIDAD.md": "Seguridad",
    "06-CALIDAD-BUILD.md": "Calidad / build",
}

SEVERIDADES = ["CRÍTICO", "ALTO", "MEDIO", "BAJO", "COSMÉTICO"]
ORDEN_SEV = {s: i for i, s in enumerate(SEVERIDADES)}

# Encabezado de hallazgo: "### B-01 — ALTO — El ..."  (guion largo o corto)
RE_HALLAZGO = re.compile(
    r"^#{2,4}\s*\**\s*([A-Z]{1,3}-\d{1,2})\s*\**\s*[—\-–]\s*\**\s*"
    r"(CRÍTICO|CRITICO|ALTO|MEDIO|BAJO|COSMÉTICO|COSMETICO)\s*\**\s*[—\-–]\s*\**\s*(.+?)\s*$",
    re.M | re.I,
)
RE_REF = re.compile(r"((?:src|tests|scripts|docs|\.claude|\.github)/[A-Za-z0-9_\-./]+\.[A-Za-z]{2,4}):(\d{1,5})")


def parsear(ruta: str):
    """Devuelve la lista de hallazgos de un informe."""
    if not os.path.exists(ruta):
        return None
    texto = open(ruta, encoding="utf-8", errors="replace").read()
    marcas = list(RE_HALLAZGO.finditer(texto))
    hallazgos = []
    for i, m in enumerate(marcas):
        ini = m.end()
        fin = marcas[i + 1].start() if i + 1 < len(marcas) else len(texto)
        cuerpo = texto[ini:fin]
        refs = []
        for rm in RE_REF.finditer(cuerpo):
            ref = f"{rm.group(1)}:{rm.group(2)}"
            if ref not in refs:
                refs.append(ref)
        sev = m.group(2).upper().replace("CRITICO", "CRÍTICO").replace("COSMETICO", "COSMÉTICO")
        hallazgos.append(
            {
                "id": m.group(1).upper(),
                "sev": sev,
                "titulo": re.sub(r"\s+", " ", m.group(3)).strip(),
                "refs": refs[:3],
                "cuerpo": cuerpo,
            }
        )
    return hallazgos


def main() -> int:
    todos = []
    presentes = []
    for archivo, area in FUENTES.items():
        ruta = os.path.join(BASE, archivo)
        hs = parsear(ruta)
        if hs is None:
            continue
        presentes.append(archivo)
        for h in hs:
            h["area"] = area
            h["origen"] = archivo
            todos.append(h)

    if not todos:
        print("No se encontraron hallazgos. ¿Falta algún informe?", file=sys.stderr)
        return 1

    ids = [h["id"] for h in todos]
    dups = {i for i in ids if ids.count(i) > 1}
    por_sev: dict[str, list] = {s: [] for s in SEVERIDADES}
    for h in todos:
        por_sev.setdefault(h["sev"], []).append(h)
    for s in por_sev:
        por_sev[s].sort(key=lambda h: h["id"])

    total = len(todos)
    lineas = []
    A = lineas.append

    A("# REGISTRO CONSOLIDADO DE HALLAZGOS — ArbitrageAR-USDT")
    A("")
    A(f"Generado por `docs/auditoria-2026-09/tools/consolidar.py` el "
      f"{datetime.now().strftime('%Y-%m-%d %H:%M')} (hora local).")
    A("")
    A("Extensión auditada: **ArbitrARS - Detector de Arbitraje**, manifest v6.0.0, "
      "commit base `5fdfa9e` (= `origin/main`), cargada descomprimida en Brave desde "
      "`D:\\martin\\Proyectos\\ArbitrageAR-USDT`.")
    A("")
    A("Este archivo es una **vista agregada**. El detalle, la evidencia citada y el fix "
      "propuesto de cada hallazgo viven en el informe del área correspondiente; acá está "
      "el conteo, la trazabilidad y el orden de corrección.")
    A("")
    A("Informes incluidos en esta corrida: " + ", ".join(f"`{p}`" for p in presentes) + ".")
    A("")
    if dups:
        A(f"> **Atención: IDs repetidos** {sorted(dups)} — revisar antes de corregir.")
        A("")

    A("## Conteo por severidad")
    A("")
    A("| Severidad | Cantidad | Áreas |")
    A("|---|---:|---|")
    for s in SEVERIDADES:
        hs = por_sev.get(s, [])
        if not hs:
            continue
        areas = sorted({h["area"] for h in hs})
        A(f"| {s} | {len(hs)} | {', '.join(areas)} |")
    A(f"| **Total** | **{total}** | |")
    A("")

    A("## Tabla maestra")
    A("")
    A("| ID | Sev | Área | Hallazgo | Evidencia principal | Informe |")
    A("|---|---|---|---|---|---|")
    for s in SEVERIDADES:
        for h in por_sev.get(s, []):
            ev = "<br>".join(f"`{r}`" for r in h["refs"]) or "(revisar en el informe origen)"
            A(f"| **{h['id']}** | {s} | {h['area']} | {h['titulo']} | {ev} | `{h['origen']}` |")
    for s in sorted(set(por_sev) - set(SEVERIDADES)):
        for h in por_sev[s]:
            A(f"| **{h['id']}** | {s} | {h['area']} | {h['titulo']} | — | `{h['origen']}` |")
    A("")

    # Índice por área
    A("## Índice por área")
    A("")
    areas: dict[str, list] = {}
    for h in todos:
        areas.setdefault(h["area"], []).append(h)
    for area, hs in sorted(areas.items()):
        hs.sort(key=lambda h: (ORDEN_SEV.get(h["sev"], 9), h["id"]))
        A(f"**{area}** ({len(hs)}): " + ", ".join(f"{h['id']} ({h['sev'].lower()})" for h in hs))
        A("")

    open(SALIDA, "w", encoding="utf-8").write("\n".join(lineas) + "\n")
    print(f"Consolidado escrito: {SALIDA}")
    print(f"Hallazgos: {total}")
    for s in SEVERIDADES:
        if por_sev.get(s):
            print(f"  {s}: {len(por_sev[s])}")
    if dups:
        print(f"  AVISO ids repetidos: {sorted(dups)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
