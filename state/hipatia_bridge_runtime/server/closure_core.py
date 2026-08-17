#!/usr/bin/env python3
"""Circuito de cierre y cabos vivos para Hipatia Bridge Runtime Ola 2.1."""

from __future__ import annotations

import hashlib
import json
import os
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from bridge_core import list_operation_states
from git_actions import list_operation_states as list_git_operation_states

ROOT = Path(__file__).resolve().parents[1]
EVENTS_FILE = ROOT / "events" / "bitacora_events.jsonl"
CLOSURE_FILE = ROOT / "closure" / "closure_records.jsonl"
PHYSICAL_REPORT = ROOT / "closure" / "CIERRE_OPERATIVO.md"
OBSIDIAN_REPORT = Path(r"D:\La maceta de Groot\40_Biblioteca_Hipatia\_bitacora_v1\CIERRE_OPERATIVO.md")
PHYSICAL_DAILY = ROOT / "daily"
OBSIDIAN_DAILY = Path(r"D:\La maceta de Groot\40_Biblioteca_Hipatia\_bitacora_v1\daily")
LOCK = threading.RLock()

MISSION_STATES = {"active", "blocked", "verified", "absorbed", "closed", "superseded"}
CABO_STATES = {"detected", "proposed", "authorized", "executing", "blocked", "verified", "absorbed", "closed", "superseded"}
MISSION_TRANSITIONS = {
    "active": {"blocked", "verified", "superseded"},
    "blocked": {"active", "superseded"},
    "verified": {"absorbed", "blocked"},
    "absorbed": {"closed"},
    "closed": set(),
    "superseded": set(),
}
CABO_TRANSITIONS = {
    "detected": {"proposed", "superseded"},
    "proposed": {"authorized", "blocked", "superseded"},
    "authorized": {"executing", "blocked", "superseded"},
    "executing": {"verified", "blocked"},
    "blocked": {"proposed", "authorized", "superseded"},
    "verified": {"absorbed", "blocked"},
    "absorbed": {"closed"},
    "closed": set(),
    "superseded": set(),
}
PRIORITIES = {"P0", "P1", "P2", "P3"}


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def canonical_json(value: dict) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def clean_text(value: object, field: str, maximum: int, required: bool = False) -> str:
    text = str(value or "").strip()
    if required and not text:
        raise ValueError(f"{field} es obligatorio")
    if len(text) > maximum or "\x00" in text:
        raise ValueError(f"{field} inválido o superior a {maximum} caracteres")
    return text


def clean_list(value: object, field: str, maximum_items: int = 30) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or len(value) > maximum_items:
        raise ValueError(f"{field} debe ser una lista de hasta {maximum_items} elementos")
    return [clean_text(item, field, 500, required=True) for item in value]


def read_records() -> list[dict]:
    if not CLOSURE_FILE.exists():
        return []
    records = []
    with CLOSURE_FILE.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"registro de cierre inválido en línea {line_number}") from exc
    verify_records(records)
    return records


def verify_records(records: list[dict]) -> None:
    previous = "GENESIS"
    for index, record in enumerate(records, 1):
        if record.get("previous_hash") != previous:
            raise ValueError(f"cadena de cierre rota en posición {index}")
        payload = dict(record)
        actual = payload.pop("record_hash", "")
        expected = hashlib.sha256((previous + "\n" + canonical_json(payload)).encode("utf-8")).hexdigest()
        if actual != expected:
            raise ValueError(f"hash de cierre inválido en posición {index}")
        previous = actual


def append_record(record: dict) -> dict:
    with LOCK:
        records = read_records()
        previous = records[-1]["record_hash"] if records else "GENESIS"
        value = dict(record)
        value["recorded_at"] = now_utc()
        value["previous_hash"] = previous
        value["record_hash"] = hashlib.sha256(
            (previous + "\n" + canonical_json(value)).encode("utf-8")
        ).hexdigest()
        CLOSURE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with CLOSURE_FILE.open("a", encoding="utf-8", newline="\n") as handle:
            handle.write(canonical_json(value) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
        render_report()
        return value


def build_state(records: list[dict] | None = None) -> tuple[dict[str, dict], dict[str, dict]]:
    records = records if records is not None else read_records()
    missions: dict[str, dict] = {}
    cabos: dict[str, dict] = {}
    for record in records:
        record_type = record["record_type"]
        if record_type.startswith("mission_"):
            mission_id = record["mission_id"]
            if record_type == "mission_created":
                missions[mission_id] = dict(record)
            elif mission_id in missions:
                missions[mission_id].update(record)
        elif record_type.startswith("cabo_"):
            cabo_id = record["cabo_id"]
            if record_type == "cabo_created":
                cabos[cabo_id] = dict(record)
            elif cabo_id in cabos:
                cabos[cabo_id].update(record)
    return missions, cabos


def create_mission(incoming: dict) -> dict:
    mission_id = clean_text(incoming.get("mission_id"), "mission_id", 160, required=True)
    missions, _ = build_state()
    if mission_id in missions:
        raise ValueError("mission_id ya existe")
    return append_record({
        "record_type": "mission_created",
        "mission_id": mission_id,
        "title": clean_text(incoming.get("title"), "title", 200, required=True),
        "scope": clean_text(incoming.get("scope"), "scope", 1000, required=True),
        "owner_role": clean_text(incoming.get("owner_role", "Concilio"), "owner_role", 80),
        "state": "active",
        "evidence": clean_list(incoming.get("evidence"), "evidence"),
        "next_action": clean_text(incoming.get("next_action"), "next_action", 1000),
    })


def create_cabo(incoming: dict) -> dict:
    mission_id = clean_text(incoming.get("mission_id"), "mission_id", 160, required=True)
    missions, cabos = build_state()
    if mission_id not in missions:
        raise ValueError("la misión no está registrada")
    cabo_id = clean_text(incoming.get("cabo_id"), "cabo_id", 160) or f"CABO-{uuid.uuid4().hex[:12].upper()}"
    if cabo_id in cabos:
        raise ValueError("cabo_id ya existe")
    priority = clean_text(incoming.get("priority", "P2"), "priority", 10)
    if priority not in PRIORITIES:
        raise ValueError("priority no permitida")
    return append_record({
        "record_type": "cabo_created",
        "cabo_id": cabo_id,
        "mission_id": mission_id,
        "title": clean_text(incoming.get("title"), "title", 200, required=True),
        "description": clean_text(incoming.get("description"), "description", 4000, required=True),
        "priority": priority,
        "owner_role": clean_text(incoming.get("owner_role", "Concilio"), "owner_role", 80),
        "source_ref": clean_text(incoming.get("source_ref"), "source_ref", 500),
        "state": "detected",
        "evidence": clean_list(incoming.get("evidence"), "evidence"),
        "next_action": clean_text(incoming.get("next_action"), "next_action", 1000, required=True),
    })


def transition_entity(entity_type: str, entity_id: str, incoming: dict) -> dict:
    missions, cabos = build_state()
    if entity_type == "mission":
        current = missions.get(entity_id)
        transitions = MISSION_TRANSITIONS
        id_field = "mission_id"
    elif entity_type == "cabo":
        current = cabos.get(entity_id)
        transitions = CABO_TRANSITIONS
        id_field = "cabo_id"
    else:
        raise ValueError("tipo de entidad no permitido")
    if current is None:
        raise KeyError(f"{entity_type} no encontrado")
    target_state = clean_text(incoming.get("state"), "state", 30, required=True)
    if target_state not in transitions.get(current["state"], set()):
        raise ValueError(f"transición inválida: {current['state']} -> {target_state}")
    evidence = clean_list(incoming.get("evidence"), "evidence")
    next_action = clean_text(incoming.get("next_action"), "next_action", 1000)
    if target_state in {"verified", "absorbed", "closed", "superseded"} and not evidence:
        raise ValueError(f"{target_state} exige evidencia")
    if target_state == "blocked" and not next_action:
        raise ValueError("blocked exige next_action")
    if entity_type == "mission" and target_state == "closed":
        open_cabos = [
            cabo for cabo in cabos.values()
            if cabo["mission_id"] == entity_id and cabo["state"] not in {"closed", "superseded"}
        ]
        if open_cabos:
            raise ValueError("la misión conserva cabos abiertos")
    return append_record({
        "record_type": f"{entity_type}_transition",
        id_field: entity_id,
        "from_state": current["state"],
        "state": target_state,
        "evidence": evidence,
        "next_action": next_action,
        "note": clean_text(incoming.get("note"), "note", 4000),
        "authorization_ref": clean_text(incoming.get("authorization_ref"), "authorization_ref", 200),
    })


def read_events() -> list[dict]:
    if not EVENTS_FILE.exists():
        return []
    return [json.loads(line) for line in EVENTS_FILE.read_text(encoding="utf-8").splitlines() if line.strip()]


def event_absorbed(event: dict) -> bool:
    date = event.get("timestamp_local", "")[:10]
    event_id = event.get("event_id", "")
    if not date or not event_id:
        return False
    physical = PHYSICAL_DAILY / f"{date}.md"
    obsidian = OBSIDIAN_DAILY / f"{date}.md"
    return (
        physical.exists() and obsidian.exists()
        and event_id in physical.read_text(encoding="utf-8")
        and event_id in obsidian.read_text(encoding="utf-8")
    )


def dashboard() -> dict:
    missions, cabos = build_state()
    events = read_events()
    operations = list_operation_states()
    git_operations = list_git_operation_states()
    events_by_mission: dict[str, list[dict]] = {}
    for event in events:
        mission_id = event.get("mission_id", "")
        if mission_id:
            events_by_mission.setdefault(mission_id, []).append(event)

    mission_status = []
    for mission_id in sorted(set(missions) | set(events_by_mission)):
        mission_events = events_by_mission.get(mission_id, [])
        last_verified = next((event for event in reversed(mission_events) if event.get("status") == "verified"), None)
        mission_status.append({
            "mission_id": mission_id,
            "registered": mission_id in missions,
            "state": missions.get(mission_id, {}).get("state", "unregistered"),
            "executed": any(event.get("status") in {"executed", "verified"} for event in mission_events),
            "verified": last_verified is not None,
            "narrated": any(event.get("schema_version") == "hipatia-bitacora-v1.1" and (event.get("meaning") or event.get("after")) for event in mission_events),
            "absorbed": bool(last_verified and event_absorbed(last_verified)),
            "closed": missions.get(mission_id, {}).get("state") in {"closed", "superseded"},
            "event_count": len(mission_events),
        })

    now = datetime.now(timezone.utc)
    open_states = CABO_STATES - {"closed", "superseded"}
    aged = []
    for cabo in cabos.values():
        if cabo["state"] not in open_states:
            continue
        created = datetime.fromisoformat(cabo["recorded_at"].replace("Z", "+00:00"))
        if now - created >= timedelta(hours=24):
            aged.append(cabo)

    awaiting_go = [
        operation for operation in operations
        if operation.get("authority_required") == "explicit_go" and operation.get("state") == "planned"
    ]
    git_awaiting_go = [operation for operation in git_operations if operation.get("state") == "planned"]
    result = {
        "ok": True,
        "schema_version": "hipatia-closure-v1",
        "generated_at": now_utc(),
        "missions": list(missions.values()),
        "mission_status": mission_status,
        "cabos": list(cabos.values()),
        "awaiting_go": awaiting_go + git_awaiting_go,
        "authorized_operations": [
            operation for operation in operations if operation.get("state") == "authorized"
        ],
        "git_operations": git_operations,
        "git_authorized": [operation for operation in git_operations if operation.get("state") == "authorized"],
        "git_expired": [operation for operation in git_operations if operation.get("state") == "expired"],
        "executing": [cabo for cabo in cabos.values() if cabo["state"] == "executing"],
        "blocked": [cabo for cabo in cabos.values() if cabo["state"] == "blocked"],
        "verified_unabsorbed": [cabo for cabo in cabos.values() if cabo["state"] == "verified"],
        "aged": aged,
        "unregistered_missions": [mission for mission in mission_status if not mission["registered"]],
    }
    return result


def render_report() -> None:
    data = dashboard()
    lines = [
        "---", "hipatia_closure_dashboard: true", "schema_version: hipatia-closure-v1",
        f"generated_at: {data['generated_at']}", "source_of_truth: closure_records_jsonl", "---", "",
        "# Circuito de cierre y cabos vivos", "",
        "Vista reconstruible. No sustituye la Bitácora narrativa ni el registro de operaciones.", "",
        "## Resumen", "",
        f"- Misiones registradas: {len(data['missions'])}",
        f"- Cabos vivos: {len([c for c in data['cabos'] if c['state'] not in {'closed', 'superseded'}])}",
        f"- Esperando GO: {len(data['awaiting_go'])}",
        f"- Bloqueados: {len(data['blocked'])}",
        f"- Verificados sin absorber: {len(data['verified_unabsorbed'])}",
        f"- Envejecidos: {len(data['aged'])}", "",
        "## Cabos activos", "",
    ]
    active_cabos = [cabo for cabo in data["cabos"] if cabo["state"] not in {"closed", "superseded"}]
    if active_cabos:
        for cabo in active_cabos:
            lines.extend([
                f"- **{cabo['priority']} · {cabo['cabo_id']} · {cabo['state']}** — {cabo['title']}",
                f"  - Misión: `{cabo['mission_id']}` · Responsable: {cabo['owner_role']}",
                f"  - Siguiente acción: {cabo.get('next_action') or '—'}",
            ])
    else:
        lines.append("- Ninguno.")
    lines.extend(["", "## Misiones no registradas", ""])
    if data["unregistered_missions"]:
        lines.extend(f"- `{item['mission_id']}` · {item['event_count']} eventos" for item in data["unregistered_missions"])
    else:
        lines.append("- Ninguna.")
    content = "\n".join(lines) + "\n"
    PHYSICAL_REPORT.parent.mkdir(parents=True, exist_ok=True)
    PHYSICAL_REPORT.write_text(content, encoding="utf-8", newline="\n")
    OBSIDIAN_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OBSIDIAN_REPORT.write_text(content, encoding="utf-8", newline="\n")
