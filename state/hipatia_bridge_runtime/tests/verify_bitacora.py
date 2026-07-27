#!/usr/bin/env python3
"""Verificación independiente de Bitácora Hipatia Local v1."""

import json
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bitacora_server import DB_FILE, EVENTS_FILE, read_events, verify_chain  # noqa: E402
from bridge_core import read_records  # noqa: E402
from closure_core import build_state, read_records as read_closure_records, verify_records as verify_closure_records  # noqa: E402
from git_evidence import SNAPSHOT_DIR, canonical_json as git_canonical_json, sha256_text as git_sha256_text  # noqa: E402


def verify_operation_lifecycle(operation_records: list[dict]) -> tuple[dict, list[str]]:
    """Accept terminal writes only when their closure evidence is coherent."""
    histories: dict[str, list[dict]] = {}
    for record in operation_records:
        operation_id = record.get("operation_id")
        record_type = record.get("record_type")
        if not operation_id or not record_type:
            raise RuntimeError("operation record without identifier or type")
        histories.setdefault(operation_id, []).append(record)
    states = {operation_id: records[-1]["record_type"] for operation_id, records in histories.items()}
    unresolved: list[str] = []
    for operation_id, records in histories.items():
        planned = next((record for record in records if record["record_type"] == "planned"), None)
        if not planned or planned.get("action") != "write_text":
            continue
        terminal = records[-1]
        state = terminal["record_type"]
        if state in {"verified", "rolled_back"}:
            continue
        if state in {"failed", "cancelled"}:
            if (terminal.get("mutation_started") is False
                    and terminal.get("observed_fingerprint") == terminal.get("planned_fingerprint")):
                continue
        elif state == "superseded":
            replacement_records = histories.get(terminal.get("replacement_operation_id"), [])
            replacement_plan = next(
                (record for record in replacement_records if record["record_type"] == "planned"), None
            )
            replacement_terminal = replacement_records[-1] if replacement_records else {}
            same_identity = replacement_plan and all(
                planned.get(key) == replacement_plan.get(key)
                for key in ("adapter", "root_id", "relative_path", "action")
            )
            if (replacement_terminal.get("record_type") == "verified" and same_identity
                    and terminal.get("observed_fingerprint")
                    == replacement_terminal.get("output", {}).get("fingerprint")):
                continue
        unresolved.append(operation_id)
    return states, unresolved


def main() -> int:
    events = read_events()
    verify_chain(events)
    if not DB_FILE.exists():
        raise RuntimeError("no existe el índice SQLite")
    with sqlite3.connect(DB_FILE) as connection:
        count = connection.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        last_hash = connection.execute("SELECT event_hash FROM events ORDER BY timestamp_utc DESC LIMIT 1").fetchone()
    if count != len(events):
        raise RuntimeError(f"desacuerdo JSONL/SQLite: {len(events)} != {count}")
    expected_last = events[-1]["event_hash"] if events else None
    actual_last = last_hash[0] if last_hash else None
    if actual_last != expected_last:
        raise RuntimeError("el último hash de SQLite no coincide con JSONL")
    operation_records = read_records()
    operation_states, unresolved_mutations = verify_operation_lifecycle(operation_records)
    if unresolved_mutations:
        raise RuntimeError(f"mutaciones sin cierre: {unresolved_mutations}")
    closure_records = read_closure_records()
    verify_closure_records(closure_records)
    missions, cabos = build_state(closure_records)
    git_snapshots = 0
    if SNAPSHOT_DIR.exists():
        for path in SNAPSHOT_DIR.glob("GIT-*.json"):
            snapshot = json.loads(path.read_text(encoding="utf-8"))
            actual = snapshot.pop("snapshot_sha256", "")
            expected = git_sha256_text(git_canonical_json(snapshot))
            if actual != expected:
                raise RuntimeError(f"snapshot Git inválido: {path.name}")
            git_snapshots += 1
    print(json.dumps({
        "ok": True,
        "write_verified": True,
        "events": len(events),
        "last_event_id": events[-1]["event_id"] if events else None,
        "last_hash": expected_last,
        "operation_records": len(operation_records),
        "operations": len(operation_states),
        "unresolved_mutations": unresolved_mutations,
        "closure_records": len(closure_records),
        "missions": len(missions),
        "cabos": len(cabos),
        "active_cabos": len([cabo for cabo in cabos.values() if cabo["state"] not in {"closed", "superseded"}]),
        "git_snapshots": git_snapshots,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
