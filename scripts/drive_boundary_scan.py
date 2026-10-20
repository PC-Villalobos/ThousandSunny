#!/usr/bin/env python3
"""Validate a metadata-only Google Drive inventory before any migration.

This program deliberately has no download, export, rename, move or delete path.
It consumes a pre-collected Drive metadata JSON file and produces a derived
report.  Drive shortcuts are never traversed: their targets are resolved only
far enough to decide whether they are allowed, then they are recorded as
blocked references.  This avoids treating a shortcut as an extra corpus item
or crossing a protected boundary through an innocent-looking parent folder.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict, deque
from pathlib import Path
from typing import Any


FOLDER_MIME = "application/vnd.google-apps.folder"
SHORTCUT_MIME = "application/vnd.google-apps.shortcut"
GOOGLE_DOC_MIME = "application/vnd.google-apps.document"
TEXT_MIMES = {"text/plain", "text/markdown"}
PROTECTED_MARKERS = ("clinica", "clínica", "nemesis", "némesis", "boveda", "bóveda", "caso")


def is_protected_name(name: str) -> bool:
    normalized = name.casefold()
    return any(marker.casefold() in normalized for marker in PROTECTED_MARKERS)


def classify(item: dict[str, Any]) -> str:
    mime = item.get("mimeType", "")
    if mime == GOOGLE_DOC_MIME:
        return "google_doc_requires_conversion"
    if mime in TEXT_MIMES:
        return "plain_text"
    if mime == FOLDER_MIME:
        return "folder"
    if mime == SHORTCUT_MIME:
        return "shortcut_requires_target_check"
    if mime in {"application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.script"}:
        return "requires_format_decision"
    return "requires_format_decision"


def _ancestor_state(
    item_id: str, index: dict[str, dict[str, Any]], denied_ids: set[str]
) -> tuple[bool, bool]:
    """Return (is_protected, is_complete); missing parent metadata fails closed."""
    seen: set[str] = set()
    pending = [item_id]
    complete = True
    while pending:
        current_id = pending.pop()
        if current_id in seen:
            continue
        seen.add(current_id)
        if current_id in denied_ids:
            return True, complete
        current = index.get(current_id)
        if current is None:
            complete = False
            continue
        if is_protected_name(str(current.get("name", ""))):
            return True, complete
        for parent_id in current.get("parents", []) or []:
            if parent_id not in index:
                complete = False
            else:
                pending.append(parent_id)
    return False, complete


def scan_inventory(
    inventory: dict[str, Any], root_ids: list[str], denied_ids: set[str] | None = None
) -> dict[str, Any]:
    """Traverse only normal folders below allowlisted roots.

    The inventory schema is ``{"items": [{"id", "name", "mimeType", "parents",
    "shortcutDetails"?}]}``.  It is intentionally metadata-only.
    """
    items = inventory.get("items")
    if not isinstance(items, list):
        raise ValueError("inventory.items must be a list")
    if not root_ids:
        raise ValueError("at least one --root-id is required")
    denied_ids = denied_ids or set()

    index = {item.get("id"): item for item in items if isinstance(item, dict) and item.get("id")}
    missing_roots = [root_id for root_id in root_ids if root_id not in index]
    if missing_roots:
        raise ValueError(f"allowlisted root metadata missing: {', '.join(missing_roots)}")

    children: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in index.values():
        for parent_id in item.get("parents", []) or []:
            children[parent_id].append(item)

    queue = deque(root_ids)
    visited_folders: set[str] = set()
    seen_items: set[str] = set()
    classes: Counter[str] = Counter()
    blocked: list[dict[str, str]] = []

    while queue:
        folder_id = queue.popleft()
        if folder_id in visited_folders:
            continue
        folder = index[folder_id]
        protected, complete = _ancestor_state(folder_id, index, denied_ids)
        if protected or not complete:
            blocked.append({"id": folder_id, "reason": "protected_or_incomplete_folder_ancestry"})
            continue
        visited_folders.add(folder_id)

        for item in children.get(folder_id, []):
            item_id = item["id"]
            if item_id in seen_items:
                continue
            seen_items.add(item_id)
            mime = item.get("mimeType", "")

            if mime == SHORTCUT_MIME:
                details = item.get("shortcutDetails") or {}
                target_id = details.get("targetId")
                if not target_id or target_id not in index:
                    blocked.append({"id": item_id, "reason": "shortcut_target_unresolved"})
                    continue
                target_protected, target_complete = _ancestor_state(target_id, index, denied_ids)
                reason = "shortcut_target_protected" if target_protected else "shortcut_target_ancestry_incomplete"
                if target_protected or not target_complete:
                    blocked.append({"id": item_id, "reason": reason})
                    continue
                # Never follow shortcuts, even to a currently safe target.
                blocked.append({"id": item_id, "reason": "shortcut_not_traversed"})
                continue

            protected, complete = _ancestor_state(item_id, index, denied_ids)
            if protected or not complete:
                blocked.append({"id": item_id, "reason": "protected_or_incomplete_ancestry"})
                continue

            item_class = classify(item)
            classes[item_class] += 1
            if mime == FOLDER_MIME:
                queue.append(item_id)

    return {
        "mode": "metadata_only",
        "source_mutations": 0,
        "roots": root_ids,
        "visited_folders": len(visited_folders),
        "eligible_items": sum(classes.values()),
        "classes": dict(sorted(classes.items())),
        "blocked": blocked,
        "blocked_count": len(blocked),
        "denylist_entries": len(denied_ids),
        "shortcut_policy": "resolve_target_then_never_traverse",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="metadata-only inventory JSON")
    parser.add_argument("--root-id", action="append", dest="root_ids", default=[], help="allowlisted root ID; repeatable")
    parser.add_argument("--deny-id", action="append", dest="deny_ids", default=[], help="local protected ID; repeatable")
    parser.add_argument(
        "--deny-ids-file",
        type=Path,
        help="local newline-delimited protected IDs; do not commit this file",
    )
    parser.add_argument("--out", type=Path, help="optional local derived-report path")
    args = parser.parse_args()

    inventory = json.loads(args.input.read_text(encoding="utf-8"))
    denied_ids = set(args.deny_ids)
    if args.deny_ids_file:
        denied_ids.update(
            line.strip() for line in args.deny_ids_file.read_text(encoding="utf-8").splitlines() if line.strip()
        )
    report = scan_inventory(inventory, args.root_ids, denied_ids)
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
