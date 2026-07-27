#!/usr/bin/env python3
"""Pruebas locales sin persistencia para Bitácora Hipatia Local v1.1."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bitacora_server import (  # noqa: E402
    IdempotencyConflict,
    make_event,
    read_events,
    resolve_idempotent_event,
    verify_chain,
)


def narrative_payload() -> dict:
    return {
        "actor": "Codex",
        "role": "Usopp",
        "topic": "bitacora",
        "title": "Evento narrativo de prueba no persistido",
        "message": "Prueba de compatibilidad y semántica narrativa.",
        "mission_id": "TEST-BITACORA-V1.1",
        "scope": "Memoria local public-safe",
        "sensitivity": "public_safe",
        "status": "observed",
        "source": "local_runtime",
        "event_kind": "learning",
        "epistemic_status": "evaluated",
        "project": "Hipatia Bridge Runtime",
        "phase": "Ola 1",
        "thread_id": "local-test",
        "happened_at": "2026-07-22",
        "understood_at": "2026-07-22",
        "before": "Solo había eventos operativos v1.",
        "change": "Se añadió una capa narrativa compatible.",
        "after": "Los nuevos eventos pueden expresar gestación.",
        "meaning": "El pasado permanece verificable y el presente gana contexto.",
        "next_safe_action": "Ejecutar pruebas HTTP negativas y positivas.",
        "perspectives": [{
            "role": "Robin",
            "contribution": "La cronología conserva procedencia sin reescribir el pasado.",
            "confidence": "high",
            "evidence": ["cadena v1 verificada"],
        }],
        "source_event_id": "",
        "supersedes": "",
        "continues": "",
        "evidence": ["test_bitacora_v1_1.py"],
        "relations": [],
    }


def expect_rejected(payload: dict, fragment: str) -> None:
    try:
        make_event(payload, "GENESIS")
    except ValueError as exc:
        if fragment not in str(exc):
            raise AssertionError(f"rechazo inesperado: {exc}") from exc
    else:
        raise AssertionError("la entrada inválida fue aceptada")


def main() -> int:
    existing = read_events()
    verify_chain(existing)
    previous = existing[-1]["event_hash"] if existing else "GENESIS"
    candidate = make_event(narrative_payload(), previous)
    verify_chain(existing + [candidate])
    assert candidate["schema_version"] == "hipatia-bitacora-v1.1"
    assert candidate["perspectives"][0]["role"] == "Robin"

    protected = narrative_payload()
    protected["sensitivity"] = "protected"
    expect_rejected(protected, "rechaza material protected")

    missing_kind = narrative_payload()
    missing_kind.pop("event_kind")
    expect_rejected(missing_kind, "event_kind es obligatorio")

    invalid_perspective = narrative_payload()
    invalid_perspective["perspectives"][0]["confidence"] = "absolute"
    expect_rejected(invalid_perspective, "confidence no permitido")

    idempotent = narrative_payload()
    idempotent["idempotency_key"] = "test:bitacora:v1.1:stable-operation"
    first = make_event(idempotent, previous)
    replay = resolve_idempotent_event(existing + [first], idempotent)
    assert replay is first
    assert first["idempotency_key"] == idempotent["idempotency_key"]
    assert len(first["idempotency_fingerprint"]) == 64

    conflict = dict(idempotent)
    conflict["message"] = "Payload diferente con la misma clave."
    try:
        resolve_idempotent_event(existing + [first], conflict)
    except IdempotencyConflict as exc:
        assert exc.event_id == first["event_id"]
    else:
        raise AssertionError("una clave reutilizada con otro payload no fue rechazada")

    print({
        "ok": True,
        "persisted_events_untouched": len(existing),
        "candidate_schema": candidate["schema_version"],
        "negative_cases": 4,
        "idempotent_replay": True,
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
