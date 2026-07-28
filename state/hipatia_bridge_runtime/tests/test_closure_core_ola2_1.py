#!/usr/bin/env python3
"""Pruebas del circuito de cierre y cabos vivos de Ola 2.1."""

from __future__ import annotations

import uuid

from closure_core import (
    OBSIDIAN_REPORT,
    PHYSICAL_REPORT,
    build_state,
    create_cabo,
    create_mission,
    dashboard,
    read_records,
    transition_entity,
    verify_records,
)


def expect_error(callable_value, fragment: str) -> None:
    try:
        callable_value()
    except (ValueError, KeyError) as exc:
        if fragment not in str(exc):
            raise AssertionError(f"error inesperado: {exc}") from exc
    else:
        raise AssertionError("la transición inválida fue aceptada")


def main() -> int:
    suffix = uuid.uuid4().hex[:8]
    mission_id = f"TEST-CIERRE-{suffix}"
    cabo_id = f"CABO-TEST-{suffix}"
    create_mission({
        "mission_id": mission_id,
        "title": "Prueba sintética del circuito de cierre",
        "scope": "Solo registro public-safe de prueba",
        "owner_role": "Usopp",
        "next_action": "Recorrer estados y cerrar.",
    })
    create_cabo({
        "cabo_id": cabo_id,
        "mission_id": mission_id,
        "title": "Cabo sintético",
        "description": "Demuestra que verified no equivale a closed.",
        "priority": "P2",
        "owner_role": "Usopp",
        "source_ref": "test_closure_core_ola2_1.py",
        "next_action": "Proponer resolución.",
    })
    expect_error(lambda: transition_entity("cabo", cabo_id, {"state": "closed", "evidence": ["no"]}), "transición inválida")
    transition_entity("cabo", cabo_id, {"state": "proposed", "next_action": "Autorizar."})
    transition_entity("cabo", cabo_id, {"state": "authorized", "authorization_ref": "TEST-GO", "next_action": "Ejecutar."})
    transition_entity("cabo", cabo_id, {"state": "executing", "next_action": "Verificar."})
    expect_error(lambda: transition_entity("cabo", cabo_id, {"state": "verified"}), "exige evidencia")
    transition_entity("cabo", cabo_id, {"state": "verified", "evidence": ["prueba positiva"]})

    transition_entity("mission", mission_id, {"state": "verified", "evidence": ["circuito ejecutado"]})
    transition_entity("mission", mission_id, {"state": "absorbed", "evidence": ["vista reconstruida"]})
    expect_error(lambda: transition_entity("mission", mission_id, {"state": "closed", "evidence": ["prematuro"]}), "cabos abiertos")

    transition_entity("cabo", cabo_id, {"state": "absorbed", "evidence": ["incluido en reporte"]})
    transition_entity("cabo", cabo_id, {"state": "closed", "evidence": ["cierre sintético"]})
    transition_entity("mission", mission_id, {"state": "closed", "evidence": ["todos los cabos cerrados"]})

    records = read_records()
    verify_records(records)
    missions, cabos = build_state(records)
    assert missions[mission_id]["state"] == "closed"
    assert cabos[cabo_id]["state"] == "closed"
    data = dashboard()
    assert not any(item["cabo_id"] == cabo_id for item in data["verified_unabsorbed"])
    assert PHYSICAL_REPORT.exists() and OBSIDIAN_REPORT.exists()
    print({
        "ok": True,
        "mission_id": mission_id,
        "cabo_id": cabo_id,
        "mission_state": missions[mission_id]["state"],
        "cabo_state": cabos[cabo_id]["state"],
        "negative_cases": 3,
        "closure_records": len(records),
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
