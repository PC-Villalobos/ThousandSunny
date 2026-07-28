#!/usr/bin/env python3
"""Bitácora Hipatia Local v1.1: escritor narrativo loopback y vistas reconstruibles."""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
import uuid
import webbrowser
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from bridge_core import (
    authorize_operation,
    cancel_operation,
    discover as discover_adapters,
    execute_operation,
    operation_state,
    plan_operation,
    rollback_operation,
    supersede_operation,
)
from closure_core import (
    create_cabo,
    create_mission,
    dashboard as closure_dashboard,
    transition_entity,
)
from git_evidence import (
    collect_snapshot as collect_git_snapshot,
    discover_repositories,
    github_status,
    local_status as git_local_status,
)
from git_actions import (
    authorize_operation as authorize_git_operation,
    cancel_operation as cancel_git_operation,
    execute_operation as execute_git_operation,
    operation_state as git_operation_state,
    plan_operation as plan_git_operation,
    rollback_operation as rollback_git_operation,
)

HOST = "127.0.0.1"
PORT = 8765
READ_ONLY_WEB_ORIGINS = {
    "https://puente-mando-m0.sonlasrisas.chatgpt.site",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}
ROOT = Path(__file__).resolve().parents[1]
EVENTS_FILE = ROOT / "events" / "bitacora_events.jsonl"
DB_FILE = ROOT / "index" / "bitacora.sqlite"
HTML_FILE = ROOT / "runtime" / "bitacora-local.html"
DAILY_DIR = ROOT / "daily"
OBSIDIAN_ROOT = Path(r"D:\La maceta de Groot\40_Biblioteca_Hipatia\_bitacora_v1")
OBSIDIAN_DAILY = OBSIDIAN_ROOT / "daily"
OBSIDIAN_MOC = OBSIDIAN_ROOT / "MOC_BITACORA_HIPATIA_LOCAL_v1.md"
ALLOWED_SENSITIVITY = {"public_safe", "internal"}
ALLOWED_STATUS = {"observed", "decided", "executed", "verified", "blocked", "superseded"}
ALLOWED_SOURCE = {"captain", "codex", "claude", "github", "obsidian", "local_runtime", "other"}
ALLOWED_EVENT_KIND = {"observation", "decision", "action", "result", "learning", "transition", "projection"}
ALLOWED_EPISTEMIC_STATUS = {"observed", "calculated", "inferred", "evaluated", "proposed", "unknown"}
ALLOWED_CONFIDENCE = {"low", "medium", "high", "unknown"}
LOCK = threading.Lock()


class IdempotencyConflict(ValueError):
    def __init__(self, event_id: str):
        super().__init__("idempotency_key ya fue usada con otro payload")
        self.event_id = event_id


def canonical_json(value: dict) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def read_events() -> list[dict]:
    if not EVENTS_FILE.exists():
        return []
    events: list[dict] = []
    with EVENTS_FILE.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if line.strip():
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError as exc:
                    raise ValueError(f"JSONL inválido en línea {line_number}: {exc}") from exc
    return events


def verify_chain(events: list[dict]) -> None:
    previous = "GENESIS"
    seen: set[str] = set()
    for index, event in enumerate(events, 1):
        if event.get("event_id") in seen:
            raise ValueError(f"event_id duplicado en posición {index}")
        seen.add(event.get("event_id", ""))
        if event.get("previous_hash") != previous:
            raise ValueError(f"cadena rota en posición {index}")
        payload = dict(event)
        actual = payload.pop("event_hash", "")
        expected = hashlib.sha256((previous + "\n" + canonical_json(payload)).encode("utf-8")).hexdigest()
        if actual != expected:
            raise ValueError(f"hash inválido en posición {index}")
        previous = actual


def clean_text(value: object, field: str, maximum: int, required: bool = False) -> str:
    text = str(value or "").strip()
    if required and not text:
        raise ValueError(f"{field} es obligatorio")
    if len(text) > maximum:
        raise ValueError(f"{field} supera {maximum} caracteres")
    if "\x00" in text:
        raise ValueError(f"{field} contiene un carácter no permitido")
    return text


def clean_list(value: object, field: str) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or len(value) > 20:
        raise ValueError(f"{field} debe ser una lista de hasta 20 elementos")
    return [clean_text(item, field, 1000) for item in value if clean_text(item, field, 1000)]


def clean_perspectives(value: object) -> list[dict]:
    if value is None:
        return []
    if not isinstance(value, list) or len(value) > 12:
        raise ValueError("perspectives debe ser una lista de hasta 12 aportaciones")
    result: list[dict] = []
    for index, item in enumerate(value, 1):
        if not isinstance(item, dict):
            raise ValueError(f"perspectives[{index}] debe ser un objeto")
        role = clean_text(item.get("role"), f"perspectives[{index}].role", 80, required=True)
        contribution = clean_text(
            item.get("contribution"), f"perspectives[{index}].contribution", 4000, required=True
        )
        confidence = clean_text(
            item.get("confidence", "unknown"), f"perspectives[{index}].confidence", 20
        )
        if confidence not in ALLOWED_CONFIDENCE:
            raise ValueError(f"perspectives[{index}].confidence no permitido")
        result.append({
            "role": role,
            "contribution": contribution,
            "confidence": confidence,
            "evidence": clean_list(item.get("evidence"), f"perspectives[{index}].evidence"),
        })
    return result


def idempotency_identity(incoming: dict) -> tuple[str, str]:
    key = clean_text(incoming.get("idempotency_key"), "idempotency_key", 200)
    if not key:
        return "", ""
    payload = {name: value for name, value in incoming.items() if name != "idempotency_key"}
    fingerprint = hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()
    return key, fingerprint


def resolve_idempotent_event(events: list[dict], incoming: dict) -> dict | None:
    key, fingerprint = idempotency_identity(incoming)
    if not key:
        return None
    for event in events:
        if event.get("idempotency_key") != key:
            continue
        if event.get("idempotency_fingerprint") == fingerprint:
            return event
        raise IdempotencyConflict(event.get("event_id", ""))
    return None


def make_event(incoming: dict, previous_hash: str) -> dict:
    if not isinstance(incoming, dict):
        raise ValueError("el cuerpo debe ser un objeto JSON")
    sensitivity = clean_text(incoming.get("sensitivity", "internal"), "sensitivity", 20)
    if sensitivity not in ALLOWED_SENSITIVITY:
        raise ValueError("v1 rechaza material protected o sensibilidad desconocida")
    status = clean_text(incoming.get("status", "observed"), "status", 20)
    source = clean_text(incoming.get("source", "local_runtime"), "source", 30)
    if status not in ALLOWED_STATUS:
        raise ValueError("status no permitido")
    if source not in ALLOWED_SOURCE:
        raise ValueError("source no permitido")
    event_kind = clean_text(incoming.get("event_kind"), "event_kind", 20, required=True)
    epistemic_status = clean_text(
        incoming.get("epistemic_status"), "epistemic_status", 20, required=True
    )
    if event_kind not in ALLOWED_EVENT_KIND:
        raise ValueError("event_kind no permitido")
    if epistemic_status not in ALLOWED_EPISTEMIC_STATUS:
        raise ValueError("epistemic_status no permitido")
    idempotency_key, idempotency_fingerprint = idempotency_identity(incoming)

    now_utc = datetime.now(timezone.utc)
    now_local = now_utc.astimezone()
    event = {
        "schema_version": "hipatia-bitacora-v1.1",
        "event_id": f"BIT-{now_utc.strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:12]}",
        "timestamp_utc": now_utc.isoformat().replace("+00:00", "Z"),
        "timestamp_local": now_local.isoformat(timespec="seconds"),
        "actor": clean_text(incoming.get("actor"), "actor", 100, required=True),
        "role": clean_text(incoming.get("role"), "role", 80, required=True),
        "topic": clean_text(incoming.get("topic"), "topic", 80, required=True),
        "title": clean_text(incoming.get("title"), "title", 160, required=True),
        "message": clean_text(incoming.get("message"), "message", 20000, required=True),
        "mission_id": clean_text(incoming.get("mission_id"), "mission_id", 120),
        "scope": clean_text(incoming.get("scope"), "scope", 500),
        "sensitivity": sensitivity,
        "status": status,
        "source": source,
        "event_kind": event_kind,
        "epistemic_status": epistemic_status,
        "project": clean_text(incoming.get("project"), "project", 120),
        "phase": clean_text(incoming.get("phase"), "phase", 120),
        "thread_id": clean_text(incoming.get("thread_id"), "thread_id", 160),
        "happened_at": clean_text(incoming.get("happened_at"), "happened_at", 40),
        "understood_at": clean_text(incoming.get("understood_at"), "understood_at", 40),
        "before": clean_text(incoming.get("before"), "before", 6000),
        "change": clean_text(incoming.get("change"), "change", 6000),
        "after": clean_text(incoming.get("after"), "after", 6000),
        "meaning": clean_text(incoming.get("meaning"), "meaning", 6000),
        "next_safe_action": clean_text(incoming.get("next_safe_action"), "next_safe_action", 2000),
        "perspectives": clean_perspectives(incoming.get("perspectives")),
        "source_event_id": clean_text(incoming.get("source_event_id"), "source_event_id", 200),
        "supersedes": clean_text(incoming.get("supersedes"), "supersedes", 200),
        "continues": clean_text(incoming.get("continues"), "continues", 200),
        "evidence": clean_list(incoming.get("evidence"), "evidence"),
        "relations": clean_list(incoming.get("relations"), "relations"),
        "idempotency_key": idempotency_key,
        "idempotency_fingerprint": idempotency_fingerprint,
        "previous_hash": previous_hash,
    }
    event["event_hash"] = hashlib.sha256(
        (previous_hash + "\n" + canonical_json(event)).encode("utf-8")
    ).hexdigest()
    return event


def markdown_escape(text: str) -> str:
    return text.replace("\r", "").replace("\n", "\n  ")


def render_daily(events: list[dict]) -> None:
    grouped: dict[str, list[dict]] = {}
    for event in events:
        date = event["timestamp_local"][:10]
        grouped.setdefault(date, []).append(event)
    DAILY_DIR.mkdir(parents=True, exist_ok=True)
    OBSIDIAN_DAILY.mkdir(parents=True, exist_ok=True)
    for date, day_events in grouped.items():
        lines = [
            "---",
            "hipatia_bitacora_daily: true",
            "schema_version: hipatia-bitacora-v1",
            f"date: {date}",
            f"event_count: {len(day_events)}",
            "source_of_truth: jsonl_append_only",
            "sensitivity: internal",
            "---",
            "",
            f"# Bitácora — {date}",
            "",
            "Vista reconstruible. La verdad canónica reside en `events/bitacora_events.jsonl`.",
            "",
            "[[../MOC_BITACORA_HIPATIA_LOCAL_v1|Volver al MOC de Bitácora]]",
            "",
        ]
        for event in day_events:
            event_kind = event.get("event_kind", "legacy")
            epistemic_status = event.get("epistemic_status", "unknown")
            lines.extend([
                f"## {event['timestamp_local'][11:19]} — {markdown_escape(event['title'])}",
                "",
                f"- ID: `{event['event_id']}`",
                f"- Actor/rol: {markdown_escape(event['actor'])} / {markdown_escape(event['role'])}",
                f"- Tema: `#{markdown_escape(event['topic'])}`",
                f"- Estado: `{event['status']}`",
                f"- Sensibilidad: `{event['sensitivity']}`",
                f"- Fuente: `{event['source']}`",
                f"- Tipo narrativo: `{event_kind}`",
                f"- Estatuto epistémico: `{epistemic_status}`",
                f"- Proyecto/fase: {markdown_escape(event.get('project', '')) or '—'} / {markdown_escape(event.get('phase', '')) or '—'}",
                f"- Misión: `{markdown_escape(event['mission_id']) or '—'}`",
                "",
                markdown_escape(event["message"]),
                "",
            ])
            narrative_fields = [
                ("Antes", event.get("before", "")),
                ("Cambio", event.get("change", "")),
                ("Después", event.get("after", "")),
                ("Significado", event.get("meaning", "")),
                ("Siguiente acción mínima segura", event.get("next_safe_action", "")),
            ]
            for label, value in narrative_fields:
                if value:
                    lines.extend([f"### {label}", "", markdown_escape(value), ""])
            perspectives = event.get("perspectives", [])
            if perspectives:
                lines.extend(["### Perspectivas de la tripulación", ""])
                for perspective in perspectives:
                    lines.append(
                        f"- **{markdown_escape(perspective['role'])}** "
                        f"(`{perspective['confidence']}`): {markdown_escape(perspective['contribution'])}"
                    )
                lines.append("")
            lines.extend([f"Hash: `{event['event_hash']}`", ""])
        content = "\n".join(lines) + "\n"
        (DAILY_DIR / f"{date}.md").write_text(content, encoding="utf-8", newline="\n")
        (OBSIDIAN_DAILY / f"{date}.md").write_text(content, encoding="utf-8", newline="\n")
    update_obsidian_moc(sorted(grouped, reverse=True))


def update_obsidian_moc(dates: list[str]) -> None:
    if not OBSIDIAN_MOC.exists():
        raise RuntimeError(f"no existe el MOC de Obsidian: {OBSIDIAN_MOC}")
    start_marker = "<!-- BITACORA_DAILY_LINKS_START -->"
    end_marker = "<!-- BITACORA_DAILY_LINKS_END -->"
    content = OBSIDIAN_MOC.read_text(encoding="utf-8")
    start = content.find(start_marker)
    end = content.find(end_marker)
    if start < 0 or end < 0 or end < start:
        raise RuntimeError("marcadores diarios ausentes o inválidos en el MOC")
    links = "\n".join(f"- [[daily/{date}|{date}]]" for date in dates)
    replacement = start_marker + "\n" + (links + "\n" if links else "") + end_marker
    updated = content[:start] + replacement + content[end + len(end_marker):]
    OBSIDIAN_MOC.write_text(updated, encoding="utf-8", newline="\n")


def rebuild_sqlite(events: list[dict]) -> None:
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp = DB_FILE.with_suffix(".sqlite.tmp")
    if temp.exists():
        temp.unlink()
    connection = sqlite3.connect(temp)
    try:
        connection.executescript("""
            PRAGMA journal_mode=DELETE;
            CREATE TABLE events (
                event_id TEXT PRIMARY KEY,
                timestamp_utc TEXT NOT NULL,
                timestamp_local TEXT NOT NULL,
                actor TEXT NOT NULL,
                role TEXT NOT NULL,
                topic TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                mission_id TEXT NOT NULL,
                scope TEXT NOT NULL,
                sensitivity TEXT NOT NULL,
                status TEXT NOT NULL,
                source TEXT NOT NULL,
                event_kind TEXT NOT NULL,
                epistemic_status TEXT NOT NULL,
                project TEXT NOT NULL,
                phase TEXT NOT NULL,
                thread_id TEXT NOT NULL,
                happened_at TEXT NOT NULL,
                understood_at TEXT NOT NULL,
                before_text TEXT NOT NULL,
                change_text TEXT NOT NULL,
                after_text TEXT NOT NULL,
                meaning TEXT NOT NULL,
                next_safe_action TEXT NOT NULL,
                perspectives_json TEXT NOT NULL,
                source_event_id TEXT NOT NULL,
                supersedes TEXT NOT NULL,
                continues TEXT NOT NULL,
                evidence_json TEXT NOT NULL,
                relations_json TEXT NOT NULL,
                previous_hash TEXT NOT NULL,
                event_hash TEXT NOT NULL UNIQUE
            );
            CREATE INDEX idx_events_timestamp ON events(timestamp_utc);
            CREATE INDEX idx_events_topic ON events(topic);
            CREATE INDEX idx_events_status ON events(status);
            CREATE INDEX idx_events_mission ON events(mission_id);
            CREATE INDEX idx_events_kind ON events(event_kind);
            CREATE INDEX idx_events_project ON events(project);
        """)
        for event in events:
            connection.execute(
                "INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    event["event_id"], event["timestamp_utc"], event["timestamp_local"],
                    event["actor"], event["role"], event["topic"], event["title"],
                    event["message"], event["mission_id"], event["scope"],
                    event["sensitivity"], event["status"], event["source"],
                    event.get("event_kind", "legacy"), event.get("epistemic_status", "unknown"),
                    event.get("project", ""), event.get("phase", ""), event.get("thread_id", ""),
                    event.get("happened_at", ""), event.get("understood_at", ""),
                    event.get("before", ""), event.get("change", ""), event.get("after", ""),
                    event.get("meaning", ""), event.get("next_safe_action", ""),
                    json.dumps(event.get("perspectives", []), ensure_ascii=False),
                    event.get("source_event_id", ""), event.get("supersedes", ""),
                    event.get("continues", ""),
                    json.dumps(event["evidence"], ensure_ascii=False),
                    json.dumps(event["relations"], ensure_ascii=False),
                    event["previous_hash"], event["event_hash"],
                ),
            )
        connection.commit()
    finally:
        connection.close()
    os.replace(temp, DB_FILE)


def append_event_with_receipt(incoming: dict) -> dict:
    with LOCK:
        events = read_events()
        verify_chain(events)
        existing = resolve_idempotent_event(events, incoming)
        if existing is not None:
            return {"event": existing, "idempotent_replay": True, "write_performed": False}
        previous = events[-1]["event_hash"] if events else "GENESIS"
        event = make_event(incoming, previous)
        EVENTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with EVENTS_FILE.open("a", encoding="utf-8", newline="\n") as handle:
            handle.write(canonical_json(event) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
        events.append(event)
        rebuild_sqlite(events)
        render_daily(events)
        return {"event": event, "idempotent_replay": False, "write_performed": True}


def append_event(incoming: dict) -> dict:
    return append_event_with_receipt(incoming)["event"]


def synchronize() -> list[dict]:
    with LOCK:
        events = read_events()
        verify_chain(events)
        rebuild_sqlite(events)
        render_daily(events)
        return events


class Handler(BaseHTTPRequestHandler):
    server_version = "HipatiaBitacora/1.1"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_json(self, status: int, payload: dict | list) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        origin = self.headers.get("Origin", "")
        if self.command == "GET" and origin in READ_ONLY_WEB_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        origin = self.headers.get("Origin", "")
        requested_method = self.headers.get("Access-Control-Request-Method", "")
        private_network = (
            self.headers.get("Access-Control-Request-Private-Network", "").lower()
            == "true"
        )
        if origin not in READ_ONLY_WEB_ORIGINS or requested_method != "GET":
            self.send_response(HTTPStatus.FORBIDDEN)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header(
            "Vary",
            "Origin, Access-Control-Request-Method, Access-Control-Request-Private-Network",
        )
        if private_network:
            self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path in {"/", "/index.html"}:
            body = HTML_FILE.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(body)
            return
        if path == "/api/health":
            try:
                events = read_events()
                verify_chain(events)
                versions = sorted({event.get("schema_version", "unknown") for event in events})
                self.send_json(HTTPStatus.OK, {
                    "ok": True, "version": "v1.1", "events": len(events),
                    "schemas": versions, "bind": f"{HOST}:{PORT}"
                })
            except Exception as exc:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})
            return
        if path == "/api/capabilities":
            self.send_json(HTTPStatus.OK, {
                "ok": True,
                "architecture": "ai_writes_humans_monitor_and_command",
                "canonical_writer": "POST /api/events",
                "captain_command": "POST /api/commands",
                "monitor": "GET /api/events?topic=&status=&limit=",
                "integrity": "GET /api/health",
                "adapters": "GET /api/adapters",
                "operation_plan": "POST /api/operations/plan",
                "operation_authorize": "POST /api/operations/{id}/authorize",
                "operation_execute": "POST /api/operations/{id}/execute",
                "operation_cancel": "POST /api/operations/{id}/cancel",
                "operation_supersede": "POST /api/operations/{id}/supersede",
                "operation_rollback": "POST /api/operations/{id}/rollback",
                "closure_dashboard": "GET /api/closure/dashboard",
                "mission_create": "POST /api/missions",
                "mission_transition": "POST /api/missions/{id}/transition",
                "cabo_create": "POST /api/cabos",
                "cabo_transition": "POST /api/cabos/{id}/transition",
                "git_repositories": "GET /api/git/repositories",
                "git_local_status": "GET /api/git/repositories/{id}/status",
                "github_status": "GET /api/github/repositories/{id}/status",
                "git_snapshot": "POST /api/git/snapshots (read-only remote, local evidence write)",
                "git_action_plan": "POST /api/git/actions/plan",
                "git_action_authorize": "POST /api/git/actions/{id}/authorize",
                "git_action_execute": "POST /api/git/actions/{id}/execute",
                "git_action_cancel": "POST /api/git/actions/{id}/cancel",
                "git_action_rollback": "POST /api/git/actions/{id}/rollback (create_branch only)",
                "schema": "hipatia-bitacora-v1.1 (lee v1 sin rehash)",
                "narrative_kinds": sorted(ALLOWED_EVENT_KIND),
                "epistemic_statuses": sorted(ALLOWED_EPISTEMIC_STATUS),
                "allowed_sensitivity": sorted(ALLOWED_SENSITIVITY),
                "protected": "rejected_in_v1.1",
            })
            return
        if path == "/api/adapters":
            try:
                self.send_json(HTTPStatus.OK, discover_adapters())
            except Exception as exc:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})
            return
        if path == "/api/closure/dashboard":
            try:
                self.send_json(HTTPStatus.OK, closure_dashboard())
            except Exception as exc:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})
            return
        if path == "/api/git/repositories":
            try:
                self.send_json(HTTPStatus.OK, discover_repositories())
            except Exception as exc:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})
            return
        if path.startswith("/api/git/repositories/") and path.endswith("/status"):
            repo_id = path.removeprefix("/api/git/repositories/").removesuffix("/status").strip("/")
            try:
                self.send_json(HTTPStatus.OK, {"ok": True, "repository": git_local_status(repo_id)})
            except ValueError as exc:
                self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})
            return
        if path.startswith("/api/github/repositories/") and path.endswith("/status"):
            repo_id = path.removeprefix("/api/github/repositories/").removesuffix("/status").strip("/")
            try:
                self.send_json(HTTPStatus.OK, {"ok": True, "repository": github_status(repo_id)})
            except ValueError as exc:
                self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})
            except Exception as exc:
                self.send_json(HTTPStatus.BAD_GATEWAY, {"ok": False, "error": str(exc)})
            return
        if path.startswith("/api/git/actions/"):
            operation_id = path.removeprefix("/api/git/actions/").strip("/")
            if not operation_id or "/" in operation_id:
                self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "operación Git no encontrada"})
                return
            try:
                self.send_json(HTTPStatus.OK, {"ok": True, "operation": git_operation_state(operation_id)})
            except KeyError as exc:
                self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": str(exc)})
            return
        if path.startswith("/api/operations/"):
            operation_id = path.removeprefix("/api/operations/").strip("/")
            if not operation_id or "/" in operation_id:
                self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "operación no encontrada"})
                return
            try:
                self.send_json(HTTPStatus.OK, {"ok": True, "operation": operation_state(operation_id)})
            except KeyError as exc:
                self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": str(exc)})
            except Exception as exc:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})
            return
        if path == "/api/events":
            try:
                events = read_events()
                verify_chain(events)
                query = parse_qs(parsed.query)
                topic = clean_text(query.get("topic", [""])[0], "topic", 80)
                status = clean_text(query.get("status", [""])[0], "status", 20)
                role = clean_text(query.get("role", [""])[0], "role", 80)
                project = clean_text(query.get("project", [""])[0], "project", 120)
                event_kind = clean_text(query.get("event_kind", [""])[0], "event_kind", 20)
                idempotency_key = clean_text(
                    query.get("idempotency_key", [""])[0], "idempotency_key", 200
                )
                try:
                    limit = max(1, min(500, int(query.get("limit", ["200"])[0])))
                except ValueError:
                    raise ValueError("limit debe ser numérico")
                if topic:
                    events = [event for event in events if event["topic"] == topic]
                if status:
                    events = [event for event in events if event["status"] == status]
                if role:
                    events = [event for event in events if event["role"] == role]
                if project:
                    events = [event for event in events if event.get("project", "") == project]
                if event_kind:
                    events = [event for event in events if event.get("event_kind", "legacy") == event_kind]
                if idempotency_key:
                    events = [
                        event for event in events
                        if event.get("idempotency_key", "") == idempotency_key
                    ]
                self.send_json(HTTPStatus.OK, events[-limit:])
            except Exception as exc:
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})
            return
        self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "ruta no encontrada"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        operation_route = path == "/api/operations/plan" or path.startswith("/api/operations/")
        closure_route = path in {"/api/missions", "/api/cabos"} or path.startswith("/api/missions/") or path.startswith("/api/cabos/")
        git_route = path == "/api/git/snapshots" or path == "/api/git/actions/plan" or path.startswith("/api/git/actions/")
        if path not in {"/api/events", "/api/commands"} and not operation_route and not closure_route and not git_route:
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "ruta no encontrada"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 65536:
                raise ValueError("cuerpo vacío o superior a 64 KiB")
            incoming = json.loads(self.rfile.read(length).decode("utf-8"))
            if path == "/api/git/snapshots":
                result = collect_git_snapshot(incoming.get("repositories"), incoming.get("mission_id"))
                self.send_json(HTTPStatus.CREATED, result)
                return
            if path == "/api/git/actions/plan":
                operation = plan_git_operation(incoming)
                self.send_json(HTTPStatus.CREATED, {"ok": True, "operation": operation})
                return
            if path.startswith("/api/git/actions/"):
                parts = [part for part in path.split("/") if part]
                if len(parts) != 5 or parts[:3] != ["api", "git", "actions"]:
                    raise ValueError("ruta de acción Git inválida")
                operation_id, action = parts[3], parts[4]
                if action == "authorize":
                    operation = authorize_git_operation(operation_id, incoming)
                elif action == "execute":
                    execute_git_operation(operation_id)
                    operation = git_operation_state(operation_id)
                    event = append_event({
                        "actor": "Hipatia Bridge", "role": "Robin", "source": "local_runtime",
                        "status": "verified", "event_kind": "result", "epistemic_status": "observed",
                        "sensitivity": "public_safe", "topic": "git_actions",
                        "title": f"Operación Git verificada: {operation_id}",
                        "message": f"{operation['action']} sobre {operation['repo_id']} terminó con resultado verificado.",
                        "mission_id": operation["mission_id"], "project": operation["repo_id"],
                        "phase": "Ola 3D", "scope": operation["github"],
                        "before": f"HEAD {operation['before'].get('head', '')} en {operation['before'].get('branch', '')}.",
                        "change": f"Se ejecutó {operation['action']} mediante {operation_id}.",
                        "after": f"HEAD {operation['after'].get('head', '')}; clean={operation['after'].get('clean')}.",
                        "meaning": "La mutación quedó vinculada automáticamente a su plan y evidencia posterior.",
                        "next_safe_action": "Revisar el resultado y cerrar o continuar la misión.",
                        "evidence": [f"operation:{operation_id}", f"result:{operation['result']}", operation.get("output_excerpt", "")],
                        "relations": [f"operation:{operation_id}"],
                    })
                    operation = {**operation, "narrative_event_id": event["event_id"], "narrative_event_hash": event["event_hash"]}
                elif action == "cancel":
                    operation = cancel_git_operation(operation_id, incoming)
                elif action == "rollback":
                    operation = rollback_git_operation(operation_id, incoming)
                else:
                    raise ValueError("acción Git inválida")
                self.send_json(HTTPStatus.OK, {"ok": True, "operation": operation})
                return
            if path == "/api/missions":
                record = create_mission(incoming)
                self.send_json(HTTPStatus.CREATED, {"ok": True, "record": record})
                return
            if path == "/api/cabos":
                record = create_cabo(incoming)
                self.send_json(HTTPStatus.CREATED, {"ok": True, "record": record})
                return
            if path.startswith("/api/missions/") or path.startswith("/api/cabos/"):
                parts = [part for part in path.split("/") if part]
                if len(parts) != 4 or parts[3] != "transition":
                    raise ValueError("ruta de transición inválida")
                entity_type = "mission" if parts[1] == "missions" else "cabo"
                record = transition_entity(entity_type, parts[2], incoming)
                self.send_json(HTTPStatus.OK, {"ok": True, "record": record})
                return
            if path == "/api/operations/plan":
                operation = plan_operation(incoming)
                self.send_json(HTTPStatus.CREATED, {"ok": True, "operation": operation})
                return
            if path.startswith("/api/operations/"):
                parts = [part for part in path.split("/") if part]
                if len(parts) != 4 or parts[:2] != ["api", "operations"]:
                    raise ValueError("ruta de operación inválida")
                operation_id, action = parts[2], parts[3]
                if action == "authorize":
                    operation = authorize_operation(operation_id, incoming)
                elif action == "execute":
                    operation = execute_operation(operation_id, incoming)
                elif action == "cancel":
                    operation = cancel_operation(operation_id, incoming)
                elif action == "supersede":
                    operation = supersede_operation(operation_id, incoming)
                elif action == "rollback":
                    operation = rollback_operation(operation_id, incoming)
                else:
                    raise ValueError("acción de operación inválida")
                self.send_json(HTTPStatus.OK, {"ok": True, "operation": operation})
                return
            if path == "/api/commands":
                command_idempotency_key = clean_text(
                    incoming.get("idempotency_key"), "idempotency_key", 200
                )
                command = clean_text(incoming.get("command"), "command", 20000, required=True)
                role_at_helm = clean_text(incoming.get("role_at_helm", "Concilio"), "role_at_helm", 80)
                incoming = {
                    "actor": "Antonio",
                    "role": "Capitán",
                    "topic": "orden_capitan",
                    "title": clean_text(command.splitlines()[0][:160], "title", 160, required=True),
                    "message": command,
                    "mission_id": clean_text(incoming.get("mission_id"), "mission_id", 120),
                    "scope": f"Timón delegado a: {role_at_helm}",
                    "sensitivity": incoming.get("sensitivity", "internal"),
                    "status": "decided",
                    "source": "captain",
                    "event_kind": "decision",
                    "epistemic_status": "observed",
                    "project": clean_text(incoming.get("project"), "project", 120),
                    "phase": clean_text(incoming.get("phase"), "phase", 120),
                    "thread_id": clean_text(incoming.get("thread_id"), "thread_id", 160),
                    "change": command,
                    "after": "Orden registrada; ejecución todavía pendiente.",
                    "meaning": clean_text(incoming.get("meaning"), "meaning", 6000),
                    "next_safe_action": "La tripulación debe tipar alcance, autoridad y evidencia antes de ejecutar.",
                    "continues": clean_text(incoming.get("continues"), "continues", 200),
                    "evidence": [],
                    "relations": [f"role_at_helm:{role_at_helm}"],
                    "idempotency_key": command_idempotency_key,
                }
            receipt = append_event_with_receipt(incoming)
            event = receipt["event"]
            reread = read_events()
            verify_chain(reread)
            if not any(item["event_hash"] == event["event_hash"] for item in reread):
                raise RuntimeError("falló la relectura posterior a escritura")
            self.send_json(HTTPStatus.OK if receipt["idempotent_replay"] else HTTPStatus.CREATED, {
                "ok": True,
                "kind": "captain_command" if path == "/api/commands" else "ai_event",
                "write_verified": True,
                "write_performed": receipt["write_performed"],
                "idempotent_replay": receipt["idempotent_replay"],
                "event": event,
            })
        except IdempotencyConflict as exc:
            self.send_json(HTTPStatus.CONFLICT, {
                "ok": False,
                "write_verified": False,
                "write_performed": False,
                "idempotent_replay": False,
                "error": "idempotency_key_conflict",
                "existing_event_id": exc.event_id,
            })
        except PermissionError as exc:
            self.send_json(HTTPStatus.FORBIDDEN, {"ok": False, "error": str(exc)})
        except KeyError as exc:
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": str(exc)})
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "write_verified": False, "error": str(exc)})
        except Exception as exc:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "write_verified": False, "error": str(exc)})


def main() -> None:
    events = synchronize()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Bitácora Hipatia Local v1.1 — http://{HOST}:{PORT} — {len(events)} eventos verificados")
    threading.Timer(0.6, lambda: webbrowser.open(f"http://{HOST}:{PORT}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
