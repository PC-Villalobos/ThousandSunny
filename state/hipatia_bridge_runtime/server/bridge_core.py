#!/usr/bin/env python3
"""Bridge Core Ola 2: operaciones tipadas y confinadas sobre raíces locales."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_FILE = ROOT / "config" / "bridge_roots.json"
OPERATIONS_FILE = ROOT / "operations" / "bridge_operations.jsonl"
BACKUP_DIR = ROOT / "operations" / "backups"
ALLOWED_ADAPTERS = {"filesystem", "hipatia", "obsidian"}
READ_ACTIONS = {"list", "stat", "read_text"}
WRITE_ACTIONS = {"write_text"}
ALLOWED_EXTENSIONS = {".md", ".txt", ".json", ".jsonl"}
ALLOWED_SENSITIVITY = {"public_safe", "internal"}
MAX_TEXT_BYTES = 256 * 1024
LOCK = threading.RLock()


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_json(value: dict) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def clean_text(value: object, field: str, maximum: int, required: bool = False) -> str:
    text = str(value or "").strip()
    if required and not text:
        raise ValueError(f"{field} es obligatorio")
    if len(text) > maximum or "\x00" in text:
        raise ValueError(f"{field} inválido o superior a {maximum} caracteres")
    return text


def load_roots() -> dict[str, dict]:
    data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    roots = data.get("roots")
    if not isinstance(roots, dict) or not roots:
        raise ValueError("configuración de raíces vacía")
    normalized: dict[str, dict] = {}
    for root_id, config in roots.items():
        adapter = clean_text(config.get("adapter"), f"{root_id}.adapter", 40, required=True)
        if adapter not in ALLOWED_ADAPTERS:
            raise ValueError(f"adaptador no permitido en {root_id}")
        actions = set(config.get("actions", []))
        if not actions or not actions <= READ_ACTIONS | WRITE_ACTIONS:
            raise ValueError(f"acciones inválidas en {root_id}")
        normalized[root_id] = {
            "adapter": adapter,
            "path": Path(config["path"]).resolve(),
            "actions": sorted(actions),
        }
    return normalized


def append_record(record: dict) -> dict:
    OPERATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    value = dict(record)
    value["recorded_at"] = now_utc()
    with OPERATIONS_FILE.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(canonical_json(value) + "\n")
        handle.flush()
        os.fsync(handle.fileno())
    return value


def read_records() -> list[dict]:
    if not OPERATIONS_FILE.exists():
        return []
    records = []
    with OPERATIONS_FILE.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"registro de operaciones inválido en línea {line_number}") from exc
    return records


def operation_state(operation_id: str) -> dict:
    records = [record for record in read_records() if record.get("operation_id") == operation_id]
    if not records:
        raise KeyError("operación no encontrada")
    state = dict(records[0])
    state["history"] = records
    state["state"] = records[-1]["record_type"]
    for record in records[1:]:
        state.update({key: value for key, value in record.items() if key not in {"record_type", "recorded_at"}})
    return state


def list_operation_states() -> list[dict]:
    operation_ids: list[str] = []
    seen: set[str] = set()
    for record in read_records():
        operation_id = record.get("operation_id")
        if operation_id and operation_id not in seen:
            seen.add(operation_id)
            operation_ids.append(operation_id)
    return [operation_state(operation_id) for operation_id in operation_ids]


def resolve_target(root_id: str, relative_path: str) -> tuple[dict, Path, str]:
    roots = load_roots()
    if root_id not in roots:
        raise ValueError("root_id no permitido")
    root = roots[root_id]
    relative = clean_text(relative_path, "relative_path", 500)
    candidate_input = Path(relative or ".")
    if candidate_input.is_absolute() or ".." in candidate_input.parts:
        raise ValueError("relative_path debe permanecer dentro de la raíz")
    target = (root["path"] / candidate_input).resolve()
    root_norm = os.path.normcase(str(root["path"]))
    target_norm = os.path.normcase(str(target))
    try:
        common = os.path.commonpath([root_norm, target_norm])
    except ValueError as exc:
        raise ValueError("la ruta escapa de la raíz") from exc
    if common != root_norm:
        raise ValueError("la ruta escapa de la raíz")
    return root, target, relative.replace("\\", "/")


def file_fingerprint(path: Path) -> dict:
    if not path.exists():
        return {"exists": False, "type": "absent", "size": 0, "sha256": "ABSENT"}
    if path.is_symlink():
        raise ValueError("los enlaces simbólicos no están permitidos")
    stat = path.stat()
    if path.is_dir():
        return {"exists": True, "type": "directory", "size": 0, "sha256": "DIRECTORY"}
    if not path.is_file():
        raise ValueError("tipo de destino no permitido")
    if stat.st_size > MAX_TEXT_BYTES:
        digest = "SKIPPED_OVERSIZE"
    else:
        digest = sha256_bytes(path.read_bytes())
    return {"exists": True, "type": "file", "size": stat.st_size, "sha256": digest}


def discover() -> dict:
    roots = load_roots()
    adapters: dict[str, dict] = {}
    for adapter in sorted(ALLOWED_ADAPTERS):
        adapter_roots = []
        for root_id, config in roots.items():
            if config["adapter"] != adapter:
                continue
            adapter_roots.append({
                "root_id": root_id,
                "status": "healthy" if config["path"].exists() else "absent",
                "actions": config["actions"],
                "write_scope": "staging_only" if "write_text" in config["actions"] else "read_only",
            })
        adapters[adapter] = {"status": "healthy" if adapter_roots else "absent", "roots": adapter_roots}
    return {"ok": True, "schema_version": "hipatia-bridge-adapters-v1", "adapters": adapters}


def plan_operation(incoming: dict) -> dict:
    if not isinstance(incoming, dict):
        raise ValueError("el plan debe ser un objeto JSON")
    root_id = clean_text(incoming.get("root_id"), "root_id", 80, required=True)
    action = clean_text(incoming.get("action"), "action", 40, required=True)
    sensitivity = clean_text(incoming.get("sensitivity", "internal"), "sensitivity", 20)
    if sensitivity not in ALLOWED_SENSITIVITY:
        raise ValueError("material protected o sensibilidad desconocida no permitidos")
    root, target, relative = resolve_target(root_id, incoming.get("relative_path", ""))
    if action not in root["actions"]:
        raise ValueError("acción no permitida para esta raíz")
    if action in {"read_text", "write_text"} and target.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError("extensión no permitida")
    fingerprint = file_fingerprint(target)
    if action == "read_text" and (not fingerprint["exists"] or fingerprint["type"] != "file"):
        raise ValueError("read_text requiere un archivo existente")
    if action == "list" and fingerprint["exists"] and fingerprint["type"] != "directory":
        raise ValueError("list requiere un directorio")
    content_sha256 = clean_text(incoming.get("content_sha256"), "content_sha256", 64)
    if action == "write_text" and (len(content_sha256) != 64 or any(c not in "0123456789abcdef" for c in content_sha256)):
        raise ValueError("write_text requiere content_sha256 hexadecimal")
    operation_id = f"OP-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:12]}"
    authority = "mission_envelope" if action in READ_ACTIONS else "explicit_go"
    record = {
        "record_type": "planned",
        "operation_id": operation_id,
        "adapter": root["adapter"],
        "root_id": root_id,
        "relative_path": relative,
        "target": str(target),
        "action": action,
        "sensitivity": sensitivity,
        "authority_required": authority,
        "authorization_ref": "",
        "planned_fingerprint": fingerprint,
        "content_sha256": content_sha256,
        "result": "proposed",
    }
    return append_record(record)


def authorize_operation(operation_id: str, incoming: dict) -> dict:
    state = operation_state(operation_id)
    if state["state"] != "planned":
        raise ValueError("solo una operación planned puede autorizarse")
    authorization_ref = clean_text(incoming.get("authorization_ref"), "authorization_ref", 200, required=True)
    authorized_by = clean_text(incoming.get("authorized_by"), "authorized_by", 100, required=True)
    return append_record({
        "record_type": "authorized",
        "operation_id": operation_id,
        "authorization_ref": authorization_ref,
        "authorized_by": authorized_by,
        "result": "authorized",
    })


def validate_content(value: object) -> str:
    """Validate text without normalizing the bytes committed by content_sha256."""
    if not isinstance(value, str) or not value:
        raise ValueError("content es obligatorio y debe ser texto")
    if "\x00" in value:
        raise ValueError("content contiene NUL")
    if len(value) > MAX_TEXT_BYTES or len(value.encode("utf-8")) > MAX_TEXT_BYTES:
        raise ValueError("contenido superior al limite")
    return value


def cancel_operation(operation_id: str, incoming: dict) -> dict:
    """Cancel a pending operation only while its target remains untouched."""
    with LOCK:
        state = operation_state(operation_id)
        if state["state"] not in {"planned", "authorized"}:
            raise ValueError("solo una operacion pendiente puede cancelarse")
        authorization_ref = clean_text(
            incoming.get("authorization_ref"), "authorization_ref", 200, required=True
        )
        cancelled_by = clean_text(incoming.get("cancelled_by"), "cancelled_by", 100, required=True)
        _, target, _ = resolve_target(state["root_id"], state["relative_path"])
        current = file_fingerprint(target)
        if current != state["planned_fingerprint"]:
            raise RuntimeError("el destino cambio desde el plan; cancelacion detenida")
        return append_record({
            "record_type": "cancelled",
            "operation_id": operation_id,
            "authorization_ref": authorization_ref,
            "cancelled_by": cancelled_by,
            "mutation_started": False,
            "planned_fingerprint": state["planned_fingerprint"],
            "observed_fingerprint": current,
            "result": "cancelled",
        })


def supersede_operation(operation_id: str, incoming: dict) -> dict:
    """Close a pending operation through an equivalent verified replacement."""
    with LOCK:
        state = operation_state(operation_id)
        if state["state"] not in {"planned", "authorized"}:
            raise ValueError("solo una operacion pendiente puede quedar superseded")
        replacement_id = clean_text(
            incoming.get("replacement_operation_id"), "replacement_operation_id", 100, required=True
        )
        if replacement_id == operation_id:
            raise ValueError("la operacion no puede reemplazarse a si misma")
        replacement = operation_state(replacement_id)
        if replacement["state"] != "verified":
            raise ValueError("la operacion reemplazante debe estar verified")
        identity = ("adapter", "root_id", "relative_path", "action")
        if any(state.get(key) != replacement.get(key) for key in identity):
            raise ValueError("la operacion reemplazante no apunta al mismo destino y accion")
        authorization_ref = clean_text(
            incoming.get("authorization_ref"), "authorization_ref", 200, required=True
        )
        superseded_by = clean_text(incoming.get("superseded_by"), "superseded_by", 100, required=True)
        _, target, _ = resolve_target(state["root_id"], state["relative_path"])
        current = file_fingerprint(target)
        replacement_fingerprint = replacement.get("output", {}).get("fingerprint")
        if current != replacement_fingerprint:
            raise RuntimeError("el destino no coincide con la evidencia del reemplazo")
        return append_record({
            "record_type": "superseded",
            "operation_id": operation_id,
            "replacement_operation_id": replacement_id,
            "authorization_ref": authorization_ref,
            "superseded_by": superseded_by,
            "mutation_started": False,
            "observed_fingerprint": current,
            "result": "superseded",
        })


def list_directory(target: Path) -> list[dict]:
    if not target.exists():
        return []
    entries = []
    for path in sorted(target.iterdir(), key=lambda item: item.name.lower()):
        if path.is_symlink():
            continue
        info = file_fingerprint(path)
        entries.append({"name": path.name, **info})
        if len(entries) >= 500:
            break
    return entries


def execute_operation(operation_id: str, incoming: dict | None = None) -> dict:
    incoming = incoming or {}
    with LOCK:
        state = operation_state(operation_id)
        if state["state"] not in {"planned", "authorized"}:
            raise ValueError("operación no ejecutable en su estado actual")
        if state["authority_required"] == "explicit_go" and state["state"] != "authorized":
            raise PermissionError("la operación requiere autorización explícita")
        root, target, _ = resolve_target(state["root_id"], state["relative_path"])
        if root["adapter"] != state["adapter"] or state["action"] not in root["actions"]:
            raise ValueError("la configuración cambió desde el plan")
        current = file_fingerprint(target)
        if current != state["planned_fingerprint"]:
            raise RuntimeError("el destino cambió desde el plan; operación detenida")

        action = state["action"]
        backup_path = ""
        created_new = False
        if action == "list":
            output = {"entries": list_directory(target)}
        elif action == "stat":
            output = {"fingerprint": current}
        elif action == "read_text":
            if current["size"] > MAX_TEXT_BYTES:
                raise ValueError("archivo superior al límite de lectura")
            output = {"text": target.read_text(encoding="utf-8"), "fingerprint": current}
        elif action == "write_text":
            try:
                content = validate_content(incoming.get("content"))
                encoded = content.encode("utf-8")
                if sha256_bytes(encoded) != state["content_sha256"]:
                    raise ValueError("content_sha256 no coincide")
            except Exception as exc:
                append_record({
                    "record_type": "failed",
                    "operation_id": operation_id,
                    "result": "failed",
                    "failure_phase": "pre_write_validation",
                    "mutation_started": False,
                    "error": str(exc),
                    "planned_fingerprint": state["planned_fingerprint"],
                    "observed_fingerprint": current,
                })
                raise
            target.parent.mkdir(parents=True, exist_ok=True)
            if current["exists"]:
                BACKUP_DIR.mkdir(parents=True, exist_ok=True)
                backup = BACKUP_DIR / f"{operation_id}.bak"
                shutil.copy2(target, backup)
                backup_path = str(backup)
            else:
                created_new = True
            temp = target.with_name(target.name + f".{operation_id}.tmp")
            temp.write_bytes(encoded)
            try:
                os.replace(temp, target)
                verified = file_fingerprint(target)
                if verified["sha256"] != state["content_sha256"]:
                    raise RuntimeError("fallo la verificacion posterior a escritura")
            except Exception as exc:
                if temp.exists():
                    temp.unlink()
                append_record({
                    "record_type": "recovery_required",
                    "operation_id": operation_id,
                    "result": "recovery_required",
                    "failure_phase": "mutation_or_verify",
                    "mutation_started": True,
                    "error": str(exc),
                    "planned_fingerprint": state["planned_fingerprint"],
                    "observed_fingerprint": file_fingerprint(target),
                })
                raise
            output = {"fingerprint": verified}
        else:
            raise ValueError("acción no implementada")

        return append_record({
            "record_type": "verified",
            "operation_id": operation_id,
            "result": "verified",
            "output": output,
            "backup_path": backup_path,
            "created_new": created_new,
        })


def rollback_operation(operation_id: str, incoming: dict) -> dict:
    with LOCK:
        state = operation_state(operation_id)
        if state["state"] != "verified" or state["action"] != "write_text":
            raise ValueError("solo una escritura verificada puede revertirse")
        authorization_ref = clean_text(incoming.get("authorization_ref"), "authorization_ref", 200, required=True)
        _, target, _ = resolve_target(state["root_id"], state["relative_path"])
        if state.get("created_new"):
            if target.exists():
                target.unlink()
        else:
            backup = Path(state.get("backup_path", ""))
            if not backup.exists() or backup.parent.resolve() != BACKUP_DIR.resolve():
                raise RuntimeError("backup de rollback ausente o inválido")
            target.parent.mkdir(parents=True, exist_ok=True)
            os.replace(backup, target)
        final = file_fingerprint(target)
        if final != state["planned_fingerprint"]:
            raise RuntimeError("rollback no restauró el fingerprint planificado")
        return append_record({
            "record_type": "rolled_back",
            "operation_id": operation_id,
            "authorization_ref": authorization_ref,
            "result": "rolled_back",
            "output": {"fingerprint": final},
        })
