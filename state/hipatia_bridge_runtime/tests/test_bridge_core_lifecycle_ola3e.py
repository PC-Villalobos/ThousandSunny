#!/usr/bin/env python3
"""Regression tests for governed Bridge Core write lifecycles."""

from __future__ import annotations

import hashlib
import json
import tempfile
from pathlib import Path

import bridge_core as core
from verify_bitacora import verify_operation_lifecycle


def sha(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def expect_error(callable_value, error_type) -> None:
    try:
        callable_value()
    except error_type:
        return
    raise AssertionError(f"se esperaba {error_type.__name__}")


def plan(relative_path: str, content: str) -> dict:
    return core.plan_operation({
        "root_id": "test_root", "relative_path": relative_path,
        "action": "write_text", "sensitivity": "public_safe",
        "content_sha256": sha(content),
    })


def authorize(operation_id: str) -> None:
    core.authorize_operation(operation_id, {
        "authorization_ref": "GOP-20260722T194250Z-d2834ef11304",
        "authorized_by": "Antonio",
    })


def main() -> int:
    original = (core.CONFIG_FILE, core.OPERATIONS_FILE, core.BACKUP_DIR)
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        test_root = root / "target"
        test_root.mkdir()
        config = root / "bridge_roots.json"
        config.write_text(json.dumps({"roots": {"test_root": {
            "adapter": "filesystem", "path": str(test_root), "actions": ["write_text"],
        }}}), encoding="utf-8")
        core.CONFIG_FILE = config
        core.OPERATIONS_FILE = root / "operations.jsonl"
        core.BACKUP_DIR = root / "backups"
        try:
            exact = "primera línea\nsegunda línea\n"
            exact_plan = plan("exact.md", exact)
            authorize(exact_plan["operation_id"])
            core.execute_operation(exact_plan["operation_id"], {"content": exact})
            assert (test_root / "exact.md").read_bytes() == exact.encode("utf-8")

            invalid = plan("invalid.md", "esperado")
            authorize(invalid["operation_id"])
            expect_error(lambda: core.execute_operation(
                invalid["operation_id"], {"content": "distinto"}
            ), ValueError)
            invalid_state = core.operation_state(invalid["operation_id"])
            assert invalid_state["state"] == "failed"
            assert invalid_state["mutation_started"] is False
            assert not (test_root / "invalid.md").exists()

            cancelled = plan("cancelled.md", "no escribir")
            authorize(cancelled["operation_id"])
            core.cancel_operation(cancelled["operation_id"], {
                "authorization_ref": "GOP-20260722T194250Z-d2834ef11304",
                "cancelled_by": "Antonio",
            })
            assert core.operation_state(cancelled["operation_id"])["state"] == "cancelled"

            drift = plan("drift.md", "no escribir")
            (test_root / "drift.md").write_text("cambio externo", encoding="utf-8")
            expect_error(lambda: core.cancel_operation(drift["operation_id"], {
                "authorization_ref": "GOP-20260722T194250Z-d2834ef11304",
                "cancelled_by": "Antonio",
            }), RuntimeError)

            old = plan("replacement.md", "resultado")
            replacement = plan("replacement.md", "resultado")
            authorize(replacement["operation_id"])
            core.execute_operation(replacement["operation_id"], {"content": "resultado"})
            core.supersede_operation(old["operation_id"], {
                "replacement_operation_id": replacement["operation_id"],
                "authorization_ref": "GOP-20260722T194250Z-d2834ef11304",
                "superseded_by": "Antonio",
            })
            assert core.operation_state(old["operation_id"])["state"] == "superseded"
            expect_error(lambda: core.cancel_operation(replacement["operation_id"], {
                "authorization_ref": "GOP-20260722T194250Z-d2834ef11304",
                "cancelled_by": "Antonio",
            }), ValueError)

            recovery = plan("recovery.md", "mutado")
            authorize(recovery["operation_id"])
            real_replace = core.os.replace

            def replace_then_fail(source, target):
                real_replace(source, target)
                raise OSError("fallo sintético posterior a mutación")

            core.os.replace = replace_then_fail
            try:
                expect_error(lambda: core.execute_operation(
                    recovery["operation_id"], {"content": "mutado"}
                ), OSError)
            finally:
                core.os.replace = real_replace
            assert core.operation_state(recovery["operation_id"])["state"] == "recovery_required"

            states, unresolved = verify_operation_lifecycle(core.read_records())
            assert invalid["operation_id"] not in unresolved
            assert cancelled["operation_id"] not in unresolved
            assert old["operation_id"] not in unresolved
            assert drift["operation_id"] in unresolved
            assert recovery["operation_id"] in unresolved
            assert states[exact_plan["operation_id"]] == "verified"
        finally:
            core.CONFIG_FILE, core.OPERATIONS_FILE, core.BACKUP_DIR = original

    print({"ok": True, "cases": 7, "lifecycle": "verified"})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
