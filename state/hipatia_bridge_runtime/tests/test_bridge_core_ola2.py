#!/usr/bin/env python3
"""Pruebas de integración local para los adaptadores gobernados de Ola 2."""

from __future__ import annotations

import hashlib
from pathlib import Path

from bridge_core import (
    authorize_operation,
    discover,
    execute_operation,
    operation_state,
    plan_operation,
    resolve_target,
    rollback_operation,
)

GO = "GO-OLA-2-ADAPTADORES-FILESYSTEM-HIPATIA-OBSIDIAN"


def expect_error(callable_value, error_type, fragment: str) -> None:
    try:
        callable_value()
    except error_type as exc:
        if fragment not in str(exc):
            raise AssertionError(f"error inesperado: {exc}") from exc
    else:
        raise AssertionError(f"se esperaba {error_type.__name__}")


def main() -> int:
    adapters = discover()["adapters"]
    assert set(adapters) == {"filesystem", "hipatia", "obsidian"}
    assert all(value["status"] == "healthy" for value in adapters.values())

    expect_error(
        lambda: resolve_target("filesystem_sandbox", r"D:\escape.md"),
        ValueError,
        "dentro de la raíz",
    )
    expect_error(
        lambda: resolve_target("filesystem_sandbox", r"..\escape.md"),
        ValueError,
        "dentro de la raíz",
    )
    expect_error(
        lambda: plan_operation({
            "root_id": "hipatia_bitacora", "relative_path": "README.md",
            "action": "write_text", "sensitivity": "internal",
            "content_sha256": "0" * 64,
        }),
        ValueError,
        "acción no permitida",
    )

    read_plan = plan_operation({
        "root_id": "hipatia_bitacora",
        "relative_path": "README.md",
        "action": "read_text",
        "sensitivity": "internal",
    })
    read_result = execute_operation(read_plan["operation_id"])
    assert "Bitácora Hipatia Local v1.1" in read_result["output"]["text"]

    list_plan = plan_operation({
        "root_id": "obsidian_bitacora",
        "relative_path": "daily",
        "action": "list",
        "sensitivity": "internal",
    })
    list_result = execute_operation(list_plan["operation_id"])
    assert any(entry["name"] == "2026-07-22.md" for entry in list_result["output"]["entries"])

    content = "Prueba Ola 2: escritura atómica, verificación y rollback."
    write_plan = plan_operation({
        "root_id": "filesystem_sandbox",
        "relative_path": "ola2-roundtrip.md",
        "action": "write_text",
        "sensitivity": "public_safe",
        "content_sha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
    })
    expect_error(
        lambda: execute_operation(write_plan["operation_id"], {"content": content}),
        PermissionError,
        "autorización explícita",
    )
    authorize_operation(write_plan["operation_id"], {
        "authorization_ref": GO,
        "authorized_by": "Antonio",
    })
    write_result = execute_operation(write_plan["operation_id"], {"content": content})
    assert write_result["output"]["fingerprint"]["sha256"] == write_plan["content_sha256"]
    state = operation_state(write_plan["operation_id"])
    assert state["state"] == "verified"
    rollback = rollback_operation(write_plan["operation_id"], {"authorization_ref": GO})
    assert rollback["output"]["fingerprint"]["sha256"] == "ABSENT"
    _, target, _ = resolve_target("filesystem_sandbox", "ola2-roundtrip.md")
    assert not target.exists()

    print({
        "ok": True,
        "adapters": sorted(adapters),
        "read_operation": read_plan["operation_id"],
        "obsidian_list_operation": list_plan["operation_id"],
        "write_operation": write_plan["operation_id"],
        "write_final_state": operation_state(write_plan["operation_id"])["state"],
        "negative_cases": 4,
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
