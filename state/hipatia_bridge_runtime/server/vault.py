#!/usr/bin/env python3
"""Frontera del vault sincronizado: espejo opcional, nunca dependencia.

POR QUÉ EXISTE
Tres constantes de este runtime fijaban rutas absolutas de Windows al vault de
Obsidian, y el manifiesto las declaraba como `inherited_pending_review`. La
consecuencia práctica se observó el 2026-10-16: `bitacora_server.py` **no
arranca** si no existe el MOC del vault —`update_obsidian_moc` lanza
`RuntimeError`—, así que la Bitácora, que es la autoridad operativa, no se podía
levantar en ninguna máquina que no fuese la del Capitán.

Eso invierte la regla de la casa. La Cubierta trata a Hipatia como **autoridad,
no dependencia**: si la Bitácora calla, la Cubierta lo dice y sigue navegable.
Hipatia merece lo mismo respecto de Obsidian, que la arquitectura declara
**espejo, no fuente de verdad**: el JSONL local es la autoridad de cierre, y el
vault es una vista humana reconstruible.

Precedente dentro de este mismo runtime: la capa de adaptadores
(`bridge_core`) ya resuelve sus raíces desde `config/bridge_roots.json`. Estas
tres constantes eran la excepción, no la norma.

QUÉ CAMBIA Y QUÉ NO
- El valor **por defecto es el heredado**: con el vault en su sitio, el
  comportamiento es idéntico al de antes, escritura por escritura.
- `HIPATIA_OBSIDIAN_ROOT` permite apuntar a otra raíz sin tocar código.
- Si la raíz **no existe**, el espejo queda inactivo y se declara. No se crea
  nunca la raíz del vault: crearla a ciegas fue justo el defecto que en Linux
  llenaba el árbol de directorios llamados `D:\...`.
- Un vault **presente pero inconsistente** sigue siendo un error. Que falte el
  MOC con el vault montado no es ausencia: es incoherencia, y se lanza.
- Lo que no se puede observar no se afirma: con el espejo inactivo, la absorción
  de un evento en el vault **no se da por cierta** (ver `event_absorbed`).
"""

from __future__ import annotations

import os
from pathlib import Path

# Heredado del runtime observado el 2026-07-27. Sigue siendo el valor por
# defecto: cambiarlo no es cosa de este fichero, sino del entorno.
RAIZ_POR_DEFECTO = r"D:\La maceta de Groot\40_Biblioteca_Hipatia\_bitacora_v1"
VARIABLE_ENTORNO = "HIPATIA_OBSIDIAN_ROOT"


def raiz() -> Path:
    """Raíz del vault: la del entorno si está puesta, si no la heredada."""
    return Path(os.environ.get(VARIABLE_ENTORNO) or RAIZ_POR_DEFECTO)


def activo(raiz_vault: Path | None = None) -> bool:
    """El espejo está activo cuando su raíz existe como directorio."""
    objetivo = raiz_vault if raiz_vault is not None else raiz()
    try:
        return objetivo.is_dir()
    except OSError:
        # Una ruta imposible en esta plataforma no es un fallo: es un espejo
        # que no está.
        return False


def motivo_inactivo(raiz_vault: Path | None = None) -> str:
    """Una línea que dice por qué no se espeja, para no callar la ausencia."""
    objetivo = raiz_vault if raiz_vault is not None else raiz()
    return (
        f"espejo de Obsidian inactivo: no existe {objetivo}. "
        f"Apunta {VARIABLE_ENTORNO} a la raíz del vault para activarlo. "
        "La autoridad de cierre sigue siendo el JSONL local."
    )
