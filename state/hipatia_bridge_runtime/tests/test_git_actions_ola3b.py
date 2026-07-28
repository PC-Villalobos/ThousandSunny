#!/usr/bin/env python3
"""Pruebas sintéticas: nunca toca los repositorios allowlist ni GitHub real."""

import json
import subprocess
import tempfile
from pathlib import Path

import git_actions as ga


def run(path: Path, *args: str) -> str:
    return subprocess.run(["git", *args], cwd=path, check=True, text=True,
                          encoding="utf-8", capture_output=True).stdout.strip()


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    repo = root / "synthetic"
    repo.mkdir()
    run(repo, "init", "-b", "main")
    run(repo, "config", "user.email", "test@invalid.local")
    run(repo, "config", "user.name", "Hipatia Test")
    (repo / "README.md").write_text("synthetic\n", encoding="utf-8")
    run(repo, "add", "README.md")
    run(repo, "commit", "-m", "synthetic baseline")

    ledger = root / "git_operations.jsonl"
    ga.OPERATIONS_FILE = ledger
    ga.repository = lambda repo_id: {"path": repo, "github": "invalid/synthetic"} if repo_id == "synthetic" else (_ for _ in ()).throw(ValueError("repo_id no permitido"))

    def status(repo_id):
        branch = run(repo, "branch", "--show-current")
        head = run(repo, "rev-parse", "HEAD")
        changes = run(repo, "status", "--porcelain")
        return {"repo_id": repo_id, "status": "healthy", "branch": branch,
                "head": head, "clean": not bool(changes), "upstream": ""}
    ga.local_status = status

    rejected = False
    try:
        ga.plan_operation({"repo_id": "synthetic", "action": "reset_hard", "mission_id": "TEST"})
    except ValueError:
        rejected = True
    assert rejected

    planned = ga.plan_operation({"repo_id": "synthetic", "action": "create_branch",
                                 "branch": "ola3b/synthetic", "mission_id": "TEST-OLA3B"})
    blocked = False
    try:
        ga.execute_operation(planned["operation_id"])
    except PermissionError:
        blocked = True
    assert blocked

    bad_ack = False
    try:
        ga.authorize_operation(planned["operation_id"], {"authorization_ref": "GO", "authorized_by": "test", "acknowledgement": "yes"})
    except PermissionError:
        bad_ack = True
    assert bad_ack

    ga.authorize_operation(planned["operation_id"], {
        "authorization_ref": "GO sintético", "authorized_by": "test",
        "acknowledgement": f"AUTHORIZE {planned['operation_id']}"
    })
    verified = ga.execute_operation(planned["operation_id"])
    assert verified["record_type"] == "verified"
    assert run(repo, "branch", "--show-current") == "ola3b/synthetic"
    cancel_plan = ga.plan_operation({"repo_id": "synthetic", "action": "fetch", "mission_id": "TEST-CANCEL"})
    cancelled = ga.cancel_operation(cancel_plan["operation_id"], {"authorization_ref": "cancel test", "cancelled_by": "test"})
    assert cancelled["record_type"] == "cancelled"
    expiry_plan = ga.plan_operation({"repo_id": "synthetic", "action": "fetch", "mission_id": "TEST-EXPIRY"})
    records = [json.loads(line) for line in ledger.read_text(encoding="utf-8").splitlines()]
    for record in records:
        if record.get("operation_id") == expiry_plan["operation_id"] and record["record_type"] == "planned":
            record["expires_at"] = "2000-01-01T00:00:00Z"
    ledger.write_text("\n".join(ga.canonical_json(record) for record in records) + "\n", encoding="utf-8")
    assert ga.operation_state(expiry_plan["operation_id"])["state"] == "expired"
    rolled_back = ga.rollback_operation(planned["operation_id"], {
        "authorization_ref": "rollback synthetic", "acknowledgement": f"ROLLBACK {planned['operation_id']}"
    })
    assert rolled_back["record_type"] == "rolled_back"
    assert run(repo, "branch", "--show-current") == "main"
    print(json.dumps({"ok": True, "real_repositories_mutated": False,
                      "forbidden_action_rejected": rejected,
                      "unauthorized_execution_blocked": blocked,
                      "bad_acknowledgement_blocked": bad_ack,
                      "synthetic_action_verified": True,
                      "cancellation_verified": True,
                      "expiry_verified": True,
                      "rollback_verified": True}, ensure_ascii=False))
