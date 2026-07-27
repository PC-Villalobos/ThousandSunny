#!/usr/bin/env python3
"""Pruebas read-only de Git local y GitHub como evidencia en Ola 3A."""

from pathlib import Path

from git_evidence import (
    collect_snapshot,
    discover_repositories,
    local_status,
    repository,
    run_git,
)


def expect_error(callable_value, error_type, fragment: str) -> None:
    try:
        callable_value()
    except error_type as exc:
        if fragment not in str(exc):
            raise AssertionError(f"error inesperado: {exc}") from exc
    else:
        raise AssertionError(f"se esperaba {error_type.__name__}")


def main() -> int:
    discovered = discover_repositories()["repositories"]
    assert {item["repo_id"] for item in discovered} == {
        "thousandsunny", "puentedemando", "sunnyfranky_control_plane"
    }
    expect_error(lambda: repository("fuera_allowlist"), ValueError, "no permitido")
    expect_error(
        lambda: run_git(Path(r"C:\Users\usuario\OneDrive\Documentos\GitHub\ThousandSunny"), "pull"),
        PermissionError,
        "no permitido",
    )
    sunnyfranky = local_status("sunnyfranky_control_plane")
    assert sunnyfranky["status"] == "unversioned"
    assert sunnyfranky["github"] is None
    assert sunnyfranky["git_actions_allowed"] is False

    result = collect_snapshot(
        ["thousandsunny", "puentedemando", "sunnyfranky_control_plane"],
        "TEST-OLA-3A-GIT-EVIDENCE",
    )
    assert result["write_verified"] is True
    assert result["snapshot"]["read_only"] is True
    assert len(result["snapshot"]["evidence"]) == 3
    assert Path(result["path"]).exists()
    assert all("token" not in str(item).lower() for item in result["snapshot"]["evidence"])
    print({
        "ok": True,
        "snapshot_id": result["snapshot"]["snapshot_id"],
        "snapshot_sha256": result["snapshot"]["snapshot_sha256"],
        "repositories": [item["repo_id"] for item in result["snapshot"]["evidence"]],
        "sunnyfranky_status": sunnyfranky["status"],
        "negative_cases": 2,
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
