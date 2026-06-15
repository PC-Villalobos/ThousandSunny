#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FUNCIÓN DE SUEÑO · v0.2 — Thousand Sunny
=========================================
Órgano de consolidación y coherencia del segundo cerebro, POR FASES (como el
sueño humano). Es Nami hecha ejecutable y portátil: corre mientras el Capitán
está desconectado y deja a Sofía coherente para que Groot no se marchite.

Python puro (sólo stdlib) → vive en cualquier entorno y memoria compartida.

FASES (arquitectura del sueño):
  N1  · Conciliación (ingesta)        → captar el material y parsearlo
  N2  · Consolidación (husos)         → memoria episódica + guiones de rol (procedimental)
  N3  · Sueño profundo (lavado)       → auditoría de coherencia / poda de deriva (Sofía)
  REM · Integración (soñar)           → rotación de roles (anti-fusión) + traza de aprendizaje
                                         [aspiracional v1: replay/simulación de atractores]

Uso:
  python3 funcion_de_sueno.py --root <dir_memoria> [--out <dir>]
       [--rotation roles_rotation.jsonl] [--max-consecutive 3]
       [--phase N1,N2,N3,REM]   # subconjunto de fases; def: todas
"""
from __future__ import annotations
import argparse, json, hashlib, re, datetime, sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

WIKILINK = re.compile(r"\[\[([^\]\|]+)")
INDEX_LINK = re.compile(r"\[[^\]]+\]\(([^)]+\.md)\)")
PHASES = ["N1", "N2", "N3", "REM"]
PHASE_NAME = {"N1": "Conciliación (ingesta)", "N2": "Consolidación (husos)",
              "N3": "Sueño profundo (lavado de Sofía)", "REM": "Integración (soñar)"}


def parse_frontmatter(text: str):
    meta = {}
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            block = text[3:end].strip("\n")
            cur = meta
            for line in block.splitlines():
                if not line.strip():
                    continue
                indent = len(line) - len(line.lstrip())
                if ":" in line:
                    k, _, v = line.strip().partition(":")
                    k, v = k.strip(), v.strip()
                    if v == "":
                        meta[k] = {}; cur = meta[k]
                    elif indent >= 2 and isinstance(cur, dict) and cur is not meta:
                        cur[k] = v
                    else:
                        meta[k] = v; cur = meta
            return meta, text[end + 4:].lstrip("\n")
    return meta, text


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


class Sueno:
    def __init__(self, root: Path, out: Path):
        self.root, self.out = root, out
        self.out.mkdir(parents=True, exist_ok=True)
        self.notes, self.names, self.stems, self.issues = [], set(), set(), []

    # N1 — Conciliación / ingesta -----------------------------------------
    def n1_scan(self):
        for p in sorted(self.root.rglob("*.md")):
            if self.out in p.parents or p.name == "MEMORY.md":
                continue
            text = p.read_text(encoding="utf-8", errors="replace")
            meta, _ = parse_frontmatter(text)
            mtype = meta["metadata"].get("type", "") if isinstance(meta.get("metadata"), dict) else ""
            n = {"file": p.name, "stem": p.stem, "name": meta.get("name", ""),
                 "type": mtype, "links": sorted(set(m.strip() for m in WIKILINK.findall(text))),
                 "has_frontmatter": bool(meta), "pendiente": "PENDIENTE" in text.upper(),
                 "hash": sha(text)}
            self.notes.append(n); self.stems.add(p.stem)
            if n["name"]:
                self.names.add(n["name"])
        return len(self.notes)

    # N2 — Consolidación: episódica + guiones de rol ----------------------
    def n2_consolidate(self, rotation_file):
        with (self.out / "episodica.jsonl").open("w", encoding="utf-8") as fh:
            for n in self.notes:
                fh.write(json.dumps(n, ensure_ascii=False) + "\n")
        ledger = []
        if rotation_file and Path(rotation_file).exists():
            for line in Path(rotation_file).read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line:
                    try:
                        ledger.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
        (self.out / "roles_ledger.jsonl").write_text(
            "\n".join(json.dumps(e, ensure_ascii=False) for e in ledger), encoding="utf-8")
        return len(self.notes), ledger

    # N3 — Sueño profundo: auditoría de coherencia ------------------------
    def n3_audit(self):
        valid = self.names | self.stems
        seen = {}
        for n in self.notes:
            if n["name"]:
                seen.setdefault(n["name"], []).append(n["file"])
            if not n["has_frontmatter"]:
                self.issues.append(("SIN_FRONTMATTER", n["file"], "nota sin frontmatter"))
            for link in n["links"]:
                if link not in valid:
                    self.issues.append(("ENLACE_HUERFANO", n["file"], f"[[{link}]] no resuelve"))
        for name, files in seen.items():
            if len(files) > 1:
                self.issues.append(("NOMBRE_DUPLICADO", ", ".join(files), f"name: {name}"))
        idx = self.root / "MEMORY.md"
        if idx.exists():
            listed = set(INDEX_LINK.findall(idx.read_text(encoding="utf-8", errors="replace")))
            actual = {n["file"] for n in self.notes}
            for miss in sorted(listed - actual):
                self.issues.append(("INDICE_FANTASMA", miss, "listado en MEMORY.md pero no existe"))
            for unl in sorted(actual - listed):
                self.issues.append(("SIN_INDEXAR", unl, "existe pero no está en MEMORY.md"))
        return self.issues

    # REM — Integración: anti-fusión + traza ------------------------------
    def rem_integrate(self, ledger, max_consecutive):
        warnings, by_role = [], {}
        for e in ledger:
            by_role.setdefault(e.get("rol", "?"), []).append(e)
        for rol, entries in by_role.items():
            entries.sort(key=lambda x: x.get("fecha", ""))
            streak, last = 0, None
            for e in entries:
                m = e.get("modelo"); streak = streak + 1 if m == last else 1; last = m
                if streak >= max_consecutive:
                    warnings.append(f"FUSIÓN: el rol «{rol}» lleva {streak} ciclos seguidos en «{m}». Rota el actor.")
        state_file = self.out / "estado.json"
        prev = {}
        if state_file.exists():
            try:
                prev = json.loads(state_file.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                prev = {}
        cur = {n["file"]: n["hash"] for n in self.notes}
        added = sorted(set(cur) - set(prev)); removed = sorted(set(prev) - set(cur))
        changed = sorted(f for f in cur if f in prev and cur[f] != prev[f])
        state_file.write_text(json.dumps(cur, ensure_ascii=False, indent=2), encoding="utf-8")
        return sorted(set(warnings)), (added, changed, removed)

    # Orquestación por fases ----------------------------------------------
    def run(self, rotation_file, max_consecutive, phases):
        self.n1_scan()  # ingesta siempre primero
        sec, ledger, issues, rot_warn, diff = [], [], [], [], (["—"], ["—"], ["—"])
        n_notes = len(self.notes)
        if "N2" in phases:
            n_notes, ledger = self.n2_consolidate(rotation_file)
        if "N3" in phases:
            issues = self.n3_audit()
        if "REM" in phases:
            if not ledger:
                _, ledger = self.n2_consolidate(rotation_file)
            rot_warn, diff = self.rem_integrate(ledger, max_consecutive)

        ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        L = [f"# Informe de sueño — {ts}", "",
             f"Fases ejecutadas: {', '.join(p+' ('+PHASE_NAME[p]+')' for p in phases)}", ""]
        if "N1" in phases or "N2" in phases:
            L += [f"**N1/N2 · Ingesta + consolidación:** {n_notes} notas; {len(ledger)} entradas de rol.", ""]
        if "N3" in phases:
            L.append("## N3 · Sueño profundo — coherencia de Sofía")
            L += [f"- **{k}** · `{w}` — {d}" for k, w, d in issues] or ["- Sin incidencias. Sofía coherente. ✓"]
            L.append("")
        if "REM" in phases:
            L.append("## REM · Integración")
            L.append("**Anti-fusión (rotación de roles):**")
            L += [f"- ⚠ {w}" for w in rot_warn] or ["- Sin avisos de fusión."]
            a, c, r = diff
            L += ["", "**Traza de aprendizaje (desde el último sueño):**",
                  f"- Nuevas: {', '.join(a) or '—'}",
                  f"- Modificadas: {', '.join(c) or '—'}",
                  f"- Eliminadas: {', '.join(r) or '—'}",
                  "", "_(v1 aspiracional: replay/simulación de estados atractores — aún no implementado.)_"]
        report = "\n".join(L)
        (self.out / "coherencia_report.md").write_text(report, encoding="utf-8")
        print(report)
        return report


def main():
    ap = argparse.ArgumentParser(description="Función de Sueño v0.2 — Thousand Sunny (por fases)")
    ap.add_argument("--root", default=".")
    ap.add_argument("--out", default=None)
    ap.add_argument("--rotation", default=None)
    ap.add_argument("--max-consecutive", type=int, default=3)
    ap.add_argument("--phase", default="N1,N2,N3,REM",
                    help="Fases a ejecutar, separadas por coma (N1,N2,N3,REM)")
    a = ap.parse_args()
    phases = [p.strip().upper() for p in a.phase.split(",") if p.strip().upper() in PHASES] or PHASES
    root = Path(a.root).expanduser().resolve()
    out = Path(a.out).expanduser().resolve() if a.out else root / "sueno"
    Sueno(root, out).run(a.rotation, a.max_consecutive, phases)


if __name__ == "__main__":
    main()
