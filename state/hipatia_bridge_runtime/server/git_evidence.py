#!/usr/bin/env python3
"""Ola 3A: Git local y GitHub como evidencia estrictamente read-only."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_FILE = ROOT / "config" / "git_repositories.json"
SNAPSHOT_DIR = ROOT / "evidence" / "git"
ALLOWED_GIT_SUBCOMMANDS = {
    "rev-parse", "status", "branch", "remote", "rev-list", "log", "diff", "show"
}
MAX_OUTPUT = 256 * 1024


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def canonical_json(value: dict) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def load_repositories() -> dict[str, dict]:
    data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    repositories = data.get("repositories")
    if not isinstance(repositories, dict) or not repositories:
        raise ValueError("allowlist Git vacía")
    result = {}
    for repo_id, config in repositories.items():
        if not re.fullmatch(r"[a-z0-9_\-]+", repo_id):
            raise ValueError("repo_id inválido")
        mode = str(config.get("mode", "versioned"))
        if mode not in {"versioned", "workspace_unversioned"}:
            raise ValueError(f"mode inválido en {repo_id}")
        slug = config.get("github")
        if mode == "versioned":
            slug = str(slug or "")
            if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", slug):
                raise ValueError(f"slug GitHub inválido en {repo_id}")
        elif slug not in {None, ""}:
            raise ValueError(f"workspace_unversioned no puede declarar GitHub en {repo_id}")
        result[repo_id] = {"path": Path(config["path"]).resolve(), "github": slug, "mode": mode}
    return result


def repository(repo_id: str) -> dict:
    repositories = load_repositories()
    if repo_id not in repositories:
        raise ValueError("repo_id no permitido")
    return repositories[repo_id]


def run_process(args: list[str], cwd: Path | None = None) -> str:
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    completed = subprocess.run(
        args, cwd=str(cwd) if cwd else None, env=env, text=True,
        encoding="utf-8", errors="replace", capture_output=True, timeout=20, check=False,
    )
    output = (completed.stdout + ("\n" + completed.stderr if completed.stderr else "")).strip()
    if len(output.encode("utf-8")) > MAX_OUTPUT:
        raise RuntimeError("salida superior al límite de evidencia")
    if completed.returncode != 0:
        raise RuntimeError(output or f"comando terminó con {completed.returncode}")
    return output


def run_git(repo_path: Path, subcommand: str, *args: str) -> str:
    if subcommand not in ALLOWED_GIT_SUBCOMMANDS:
        raise PermissionError("subcomando Git no permitido en Ola 3A")
    forbidden = {"fetch", "pull", "checkout", "switch", "reset", "add", "commit", "push", "merge", "rebase", "cherry-pick", "clean", "tag"}
    if any(value in forbidden for value in (subcommand, *args)):
        raise PermissionError("mutación Git prohibida en Ola 3A")
    return run_process(["git", subcommand, *args], cwd=repo_path)


def redact_remote(value: str) -> str:
    return re.sub(r"(https?://)[^/@\s]+@", r"\1", value)


def local_status(repo_id: str) -> dict:
    config = repository(repo_id)
    path = config["path"]
    base = {"repo_id": repo_id, "path": str(path), "github": config["github"], "mode": config["mode"]}
    if not path.exists():
        return {**base, "status": "absent", "reason": "path_missing"}
    if config["mode"] == "workspace_unversioned":
        return {**base, "status": "unversioned", "reason": "declared_local_workspace", "git_actions_allowed": False}
    try:
        inside = run_git(path, "rev-parse", "--is-inside-work-tree") == "true"
    except Exception as exc:
        return {**base, "status": "degraded", "reason": str(exc)}
    if not inside:
        return {**base, "status": "degraded", "reason": "not_a_worktree"}
    branch = run_git(path, "branch", "--show-current")
    head = run_git(path, "rev-parse", "HEAD")
    status_lines = [line for line in run_git(path, "status", "--porcelain=v1", "--branch").splitlines()]
    remote = ""
    upstream = ""
    ahead = behind = None
    try:
        remote = redact_remote(run_git(path, "remote", "get-url", "origin"))
    except Exception:
        pass
    try:
        upstream = run_git(path, "rev-parse", "--abbrev-ref", "@{u}")
        counts = run_git(path, "rev-list", "--left-right", "--count", "HEAD...@{u}").split()
        ahead, behind = int(counts[0]), int(counts[1])
    except Exception:
        upstream = ""
    changes = [line for line in status_lines if not line.startswith("##")]
    recent_raw = run_git(path, "log", "-n", "20", "--date=iso-strict", "--pretty=format:%H%x09%ad%x09%an%x09%s")
    recent = []
    for line in recent_raw.splitlines():
        parts = line.split("\t", 3)
        if len(parts) == 4:
            recent.append({"sha": parts[0], "date": parts[1], "author": parts[2], "subject": parts[3]})
    return {
        **base, "status": "healthy", "branch": branch, "head": head,
        "upstream": upstream, "ahead": ahead, "behind": behind,
        "clean": not changes, "changes": changes[:500], "remote": remote,
        "recent_commits": recent,
    }


def github_status(repo_id: str) -> dict:
    config = repository(repo_id)
    if config["mode"] != "versioned":
        raise ValueError("workspace local sin remoto GitHub")
    slug = config["github"]
    repo_data = json.loads(run_process([
        "gh", "api", f"repos/{slug}", "--jq",
        "{nameWithOwner:.full_name,defaultBranch:.default_branch,isPrivate:.private,archived:.archived,updatedAt:.updated_at}"
    ]))
    pulls_raw = run_process([
        "gh", "pr", "list", "--repo", slug, "--state", "open", "--limit", "100",
        "--json", "number,title,isDraft,headRefName,baseRefName,mergeStateStatus,updatedAt,url"
    ])
    pulls = json.loads(pulls_raw or "[]")
    return {"repo_id": repo_id, "status": "healthy", "repository": repo_data, "open_pulls": pulls}


def discover_repositories() -> dict:
    values = []
    for repo_id in load_repositories():
        local = local_status(repo_id)
        values.append({
            "repo_id": repo_id, "local_status": local["status"],
            "github": local["github"], "path": local["path"],
            "reason": local.get("reason", ""),
        })
    return {"ok": True, "schema_version": "hipatia-git-evidence-v1", "repositories": values}


def collect_snapshot(repo_ids: list[str], mission_id: str) -> dict:
    if not isinstance(repo_ids, list) or not repo_ids or len(repo_ids) > 10:
        raise ValueError("repositories debe contener entre 1 y 10 repo_id")
    mission_id = str(mission_id or "").strip()
    if not mission_id or len(mission_id) > 160:
        raise ValueError("mission_id es obligatorio")
    evidence = []
    for repo_id in repo_ids:
        local = local_status(str(repo_id))
        remote = None
        remote_error = ""
        if local.get("mode") == "versioned":
            try:
                remote = github_status(str(repo_id))
            except Exception as exc:
                remote_error = str(exc)
        evidence.append({"repo_id": repo_id, "local": local, "github": remote, "github_error": remote_error})
    captured_at = now_utc()
    snapshot = {
        "schema_version": "hipatia-git-evidence-v1",
        "snapshot_id": f"GIT-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:12]}",
        "captured_at": captured_at,
        "mission_id": mission_id,
        "read_only": True,
        "forbidden_actions": ["fetch", "pull", "checkout", "commit", "push", "merge", "close_pr"],
        "evidence": evidence,
    }
    payload = canonical_json(snapshot)
    snapshot["snapshot_sha256"] = sha256_text(payload)
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    path = SNAPSHOT_DIR / f"{snapshot['snapshot_id']}.json"
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    reread = json.loads(path.read_text(encoding="utf-8"))
    actual_hash = reread.pop("snapshot_sha256")
    if actual_hash != sha256_text(canonical_json(reread)):
        raise RuntimeError("falló la relectura del snapshot Git")
    return {"ok": True, "snapshot": snapshot, "path": str(path), "write_verified": True}
