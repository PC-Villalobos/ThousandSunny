#!/usr/bin/env python3
"""Ola 3B: mutaciones Git/GitHub tipadas, autorizadas y verificadas."""

from __future__ import annotations

import json
import os
import re
import subprocess
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from git_evidence import canonical_json, local_status, repository, run_process

ROOT = Path(__file__).resolve().parents[1]
OPERATIONS_FILE = ROOT / "operations" / "git_operations.jsonl"
LOCK = threading.RLock()
LOCAL_ACTIONS = {"fetch", "pull_ff_only", "create_branch", "push_branch"}
EXISTING_PR_ACTIONS = {"close_pr", "merge_pr"}
GITHUB_ACTIONS = EXISTING_PR_ACTIONS | {"create_draft_pr"}
ALLOWED_ACTIONS = LOCAL_ACTIONS | GITHUB_ACTIONS
REVERSIBILITY = {
    "fetch": "recoverable", "pull_ff_only": "recoverable",
    "create_branch": "reversible", "push_branch": "recoverable",
    "close_pr": "reversible", "merge_pr": "irreversible", "create_draft_pr": "reversible",
}


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def clean(value: object, field: str, maximum: int = 200, required: bool = False) -> str:
    text = str(value or "").strip()
    if required and not text:
        raise ValueError(f"{field} es obligatorio")
    if len(text) > maximum or "\x00" in text:
        raise ValueError(f"{field} inválido")
    return text


def append_record(record: dict) -> dict:
    OPERATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    value = {**record, "recorded_at": now_utc()}
    with OPERATIONS_FILE.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(canonical_json(value) + "\n")
        handle.flush()
        os.fsync(handle.fileno())
    return value


def read_records() -> list[dict]:
    if not OPERATIONS_FILE.exists():
        return []
    return [json.loads(line) for line in OPERATIONS_FILE.read_text(encoding="utf-8").splitlines() if line.strip()]


def operation_state(operation_id: str) -> dict:
    records = [item for item in read_records() if item.get("operation_id") == operation_id]
    if not records:
        raise KeyError("operación Git no encontrada")
    state = dict(records[0])
    for item in records[1:]:
        state.update({k: v for k, v in item.items() if k not in {"record_type", "recorded_at"}})
    state["state"] = records[-1]["record_type"]
    if state["state"] in {"planned", "authorized"}:
        expires_text = state.get("expires_at")
        if not expires_text:
            created = datetime.fromisoformat(records[0]["recorded_at"].replace("Z", "+00:00"))
            expires_text = (created + timedelta(hours=24)).isoformat().replace("+00:00", "Z")
            state["expires_at"] = expires_text
        expires_at = datetime.fromisoformat(expires_text.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) >= expires_at:
            state["state"] = "expired"
            state["result"] = "expired"
    state["history"] = records
    return state


def list_operation_states() -> list[dict]:
    operation_ids = list(dict.fromkeys(item["operation_id"] for item in read_records()))
    return [operation_state(operation_id) for operation_id in operation_ids]


def _git(path: Path, *args: str) -> str:
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    result = subprocess.run(["git", *args], cwd=str(path), env=env, text=True,
                            encoding="utf-8", errors="replace", capture_output=True,
                            timeout=60, check=False)
    output = (result.stdout + ("\n" + result.stderr if result.stderr else "")).strip()
    if result.returncode:
        raise RuntimeError(output or f"git terminó con {result.returncode}")
    return output


def _validate_branch(branch: str) -> str:
    branch = clean(branch, "branch", 200, True)
    if branch.startswith("-") or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]*", branch) or ".." in branch or "//" in branch:
        raise ValueError("branch inválida")
    return branch


def _github_pr(slug: str, number: int) -> dict:
    raw = run_process(["gh", "pr", "view", str(number), "--repo", slug,
                       "--json", "number,state,headRefOid,headRefName,baseRefName,url,isDraft"])
    return json.loads(raw)


def plan_operation(incoming: dict) -> dict:
    repo_id = clean(incoming.get("repo_id"), "repo_id", 80, True)
    action = clean(incoming.get("action"), "action", 40, True)
    mission_id = clean(incoming.get("mission_id"), "mission_id", 160, True)
    if action not in ALLOWED_ACTIONS:
        raise ValueError("acción Git/GitHub no permitida")
    config = repository(repo_id)
    if config.get("mode", "versioned") != "versioned":
        raise PermissionError("workspace no versionado: acciones Git/GitHub desactivadas")
    before = local_status(repo_id)
    if before.get("status") != "healthy":
        raise RuntimeError("repositorio local no saludable; no se planifica mutación")
    parameters: dict = {}
    if action == "create_branch":
        parameters["branch"] = _validate_branch(incoming.get("branch"))
    elif action == "push_branch":
        parameters["branch"] = _validate_branch(incoming.get("branch") or before.get("branch"))
        if parameters["branch"] != before.get("branch"):
            raise ValueError("push_branch solo acepta la rama actualmente activa")
    elif action == "create_draft_pr":
        base_branch = _validate_branch(incoming.get("base_branch"))
        head_branch = _validate_branch(incoming.get("head_branch"))
        if base_branch == head_branch:
            raise ValueError("base_branch y head_branch deben diferir")
        title = clean(incoming.get("title"), "title", 240, True)
        body = clean(incoming.get("body"), "body", 10000, True)
        base_data = json.loads(run_process(["gh", "api", f"repos/{config['github']}/branches/{base_branch}"]))
        head_data = json.loads(run_process(["gh", "api", f"repos/{config['github']}/branches/{head_branch}"]))
        existing = json.loads(run_process(["gh", "pr", "list", "--repo", config["github"], "--state", "open",
                                           "--base", base_branch, "--head", head_branch, "--json", "number,url"]) or "[]")
        if existing:
            raise ValueError("ya existe un PR abierto para base/head")
        parameters = {"base_branch": base_branch, "head_branch": head_branch,
                      "expected_base_sha": base_data["commit"]["sha"], "expected_head_sha": head_data["commit"]["sha"],
                      "title": title, "body": body, "draft": True}
    elif action in EXISTING_PR_ACTIONS:
        try:
            number = int(incoming.get("pr_number"))
        except (TypeError, ValueError):
            raise ValueError("pr_number debe ser entero")
        if number < 1:
            raise ValueError("pr_number inválido")
        pr = _github_pr(config["github"], number)
        parameters = {"pr_number": number, "expected_head_sha": pr["headRefOid"]}
        if action == "merge_pr":
            method = clean(incoming.get("merge_method", "squash"), "merge_method", 10)
            if method not in {"merge", "squash", "rebase"}:
                raise ValueError("merge_method inválido")
            parameters["merge_method"] = method
    operation_id = f"GOP-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:12]}"
    try:
        ttl_hours = int(incoming.get("ttl_hours", 24))
    except (TypeError, ValueError):
        raise ValueError("ttl_hours debe ser entero")
    if ttl_hours < 1 or ttl_hours > 168:
        raise ValueError("ttl_hours debe estar entre 1 y 168")
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=ttl_hours)).isoformat().replace("+00:00", "Z")
    return append_record({
        "record_type": "planned", "operation_id": operation_id,
        "mission_id": mission_id, "repo_id": repo_id, "github": config["github"],
        "action": action, "parameters": parameters, "before": before,
        "authority_required": "explicit_go", "authorization_ref": "",
        "reversibility": REVERSIBILITY[action], "result": "proposed",
        "expires_at": expires_at,
        "stop_conditions": ["HEAD_changed", "worktree_dirty", "PR_head_changed", "command_failure"],
    })


def authorize_operation(operation_id: str, incoming: dict) -> dict:
    state = operation_state(operation_id)
    if state["state"] != "planned":
        raise ValueError("solo una operación planned puede autorizarse")
    authorization_ref = clean(incoming.get("authorization_ref"), "authorization_ref", 300, True)
    authorized_by = clean(incoming.get("authorized_by"), "authorized_by", 100, True)
    acknowledgement = clean(incoming.get("acknowledgement"), "acknowledgement", 80, True)
    expected = f"AUTHORIZE {operation_id}"
    if acknowledgement != expected:
        raise PermissionError(f"acknowledgement debe ser exactamente: {expected}")
    return append_record({"record_type": "authorized", "operation_id": operation_id,
                          "authorization_ref": authorization_ref, "authorized_by": authorized_by,
                          "result": "authorized"})


def cancel_operation(operation_id: str, incoming: dict) -> dict:
    state = operation_state(operation_id)
    if state["state"] not in {"planned", "authorized"}:
        raise ValueError("solo una operación pendiente puede cancelarse")
    authorization_ref = clean(incoming.get("authorization_ref"), "authorization_ref", 300, True)
    cancelled_by = clean(incoming.get("cancelled_by"), "cancelled_by", 100, True)
    return append_record({"record_type": "cancelled", "operation_id": operation_id,
                          "authorization_ref": authorization_ref, "cancelled_by": cancelled_by,
                          "result": "cancelled"})


def execute_operation(operation_id: str) -> dict:
    with LOCK:
        state = operation_state(operation_id)
        if state["state"] != "authorized":
            raise PermissionError("la operación requiere autorización explícita vigente")
        repo_id, action, params = state["repo_id"], state["action"], state["parameters"]
        config = repository(repo_id)
        current = local_status(repo_id)
        before = state["before"]
        if current.get("status") != "healthy" or not current.get("clean"):
            raise RuntimeError("worktree no limpio o no saludable; ejecución detenida")
        if current.get("head") != before.get("head") or current.get("branch") != before.get("branch"):
            raise RuntimeError("HEAD o rama cambió desde el plan; ejecución detenida")
        output = ""
        if action == "fetch":
            output = _git(config["path"], "fetch", "--prune", "origin")
        elif action == "pull_ff_only":
            if not current.get("upstream"):
                raise RuntimeError("rama sin upstream")
            output = _git(config["path"], "pull", "--ff-only")
        elif action == "create_branch":
            output = _git(config["path"], "switch", "-c", params["branch"])
        elif action == "push_branch":
            output = _git(config["path"], "push", "--set-upstream", "origin", params["branch"])
        elif action == "create_draft_pr":
            base_data = json.loads(run_process(["gh", "api", f"repos/{config['github']}/branches/{params['base_branch']}"]))
            head_data = json.loads(run_process(["gh", "api", f"repos/{config['github']}/branches/{params['head_branch']}"]))
            if base_data["commit"]["sha"] != params["expected_base_sha"] or head_data["commit"]["sha"] != params["expected_head_sha"]:
                raise RuntimeError("base o head cambió desde el plan; ejecución detenida")
            existing = json.loads(run_process(["gh", "pr", "list", "--repo", config["github"], "--state", "open",
                                               "--base", params["base_branch"], "--head", params["head_branch"],
                                               "--json", "number,url"]) or "[]")
            if existing:
                raise RuntimeError("ya existe un PR abierto para base/head")
            output = run_process(["gh", "pr", "create", "--repo", config["github"], "--draft",
                                  "--base", params["base_branch"], "--head", params["head_branch"],
                                  "--title", params["title"], "--body", params["body"]])
        else:
            pr = _github_pr(config["github"], params["pr_number"])
            if pr["headRefOid"] != params["expected_head_sha"]:
                raise RuntimeError("PR head cambió desde el plan; ejecución detenida")
            if action == "close_pr":
                output = run_process(["gh", "pr", "close", str(params["pr_number"]), "--repo", config["github"]])
            elif action == "merge_pr":
                output = run_process(["gh", "pr", "merge", str(params["pr_number"]), "--repo", config["github"],
                                      f"--{params['merge_method']}", "--match-head-commit", params["expected_head_sha"]])
        after = local_status(repo_id)
        if action == "create_draft_pr":
            try:
                created_number = int(output.rstrip("/").split("/")[-1])
            except ValueError as exc:
                raise RuntimeError("no se pudo identificar el PR creado") from exc
            remote_after = _github_pr(config["github"], created_number)
        elif action in EXISTING_PR_ACTIONS:
            remote_after = _github_pr(config["github"], params["pr_number"])
        else:
            remote_after = None
        if action == "create_branch" and after.get("branch") != params["branch"]:
            raise RuntimeError("falló verificación de rama creada")
        if action == "close_pr" and remote_after.get("state") != "CLOSED":
            raise RuntimeError("falló verificación de cierre PR")
        if action == "merge_pr" and remote_after.get("state") != "MERGED":
            raise RuntimeError("falló verificación de merge PR")
        if action == "create_draft_pr" and (remote_after.get("state") != "OPEN" or not remote_after.get("isDraft")):
            raise RuntimeError("falló verificación del PR borrador")
        return append_record({"record_type": "verified", "operation_id": operation_id,
                              "result": "verified", "after": after,
                              "remote_after": remote_after, "output_excerpt": output[-4000:]})


def rollback_operation(operation_id: str, incoming: dict) -> dict:
    with LOCK:
        state = operation_state(operation_id)
        if state["state"] != "verified" or state["action"] != "create_branch":
            raise ValueError("solo create_branch verificado admite rollback automático")
        acknowledgement = clean(incoming.get("acknowledgement"), "acknowledgement", 100, True)
        expected = f"ROLLBACK {operation_id}"
        if acknowledgement != expected:
            raise PermissionError(f"acknowledgement debe ser exactamente: {expected}")
        authorization_ref = clean(incoming.get("authorization_ref"), "authorization_ref", 300, True)
        config = repository(state["repo_id"])
        current = local_status(state["repo_id"])
        created_branch = state["parameters"]["branch"]
        if not current.get("clean") or current.get("branch") != created_branch:
            raise RuntimeError("rollback detenido: rama activa o limpieza cambiaron")
        if current.get("head") != state["before"].get("head"):
            raise RuntimeError("rollback detenido: la rama creada contiene cambios")
        _git(config["path"], "switch", state["before"]["branch"])
        _git(config["path"], "branch", "-d", created_branch)
        after = local_status(state["repo_id"])
        if after.get("branch") != state["before"]["branch"] or after.get("head") != state["before"]["head"]:
            raise RuntimeError("rollback no restauró rama y HEAD")
        return append_record({"record_type": "rolled_back", "operation_id": operation_id,
                              "authorization_ref": authorization_ref, "result": "rolled_back", "after_rollback": after})
