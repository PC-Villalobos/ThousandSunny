#!/usr/bin/env python3
"""Contrato de integridad y exclusión de la proyección versionada."""

from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "deploy" / "runtime-manifest.json"
FORBIDDEN_ROOTS = {
    "events",
    "index",
    "daily",
    "closure",
    "evidence",
    "operations",
    "backups",
    "logs",
    "config",
}


class ProjectionManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    def test_every_managed_projection_has_the_declared_hash(self) -> None:
        for item in self.manifest["files"]:
            with self.subTest(path=item["projection"]):
                path = ROOT / item["projection"]
                self.assertTrue(path.is_file())
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), item["sha256"])

    def test_runtime_paths_are_relative_and_confined(self) -> None:
        for item in self.manifest["files"]:
            with self.subTest(path=item["runtime"]):
                path = Path(item["runtime"])
                self.assertFalse(path.is_absolute())
                self.assertNotIn("..", path.parts)
                self.assertNotIn(path.parts[0].lower(), FORBIDDEN_ROOTS)

    def test_sovereign_data_roots_are_not_projected(self) -> None:
        present = {path.name.lower() for path in ROOT.iterdir() if path.is_dir()}
        self.assertTrue(FORBIDDEN_ROOTS.isdisjoint(present))
        self.assertTrue(FORBIDDEN_ROOTS.issubset(set(self.manifest["excluded_roots"])))

    def test_every_absolute_runtime_binding_is_declared_with_access(self) -> None:
        assignment = re.compile(
            r'^([A-Z][A-Z0-9_]*)\s*=\s*Path\(r"([A-Za-z]:\\[^"]+)"\)',
            re.MULTILINE,
        )
        observed = set()
        for path in sorted((ROOT / "server").glob("*.py")):
            for symbol, value in assignment.findall(path.read_text(encoding="utf-8")):
                observed.add((path.relative_to(ROOT).as_posix(), symbol, value))

        declared = {
            (item["projection"], item["symbol"], item["path"])
            for item in self.manifest["operational_bindings"]
        }
        self.assertEqual(observed, declared)

        for item in self.manifest["operational_bindings"]:
            with self.subTest(symbol=item["symbol"]):
                self.assertTrue(set(item["access"]))
                self.assertLessEqual(set(item["access"]), {"read", "write"})
                self.assertEqual(item["boundary"], "synced_vault")
                self.assertEqual(item["decision_status"], "inherited_pending_review")

    def test_synced_vault_writes_remain_an_explicit_pending_decision(self) -> None:
        writers = [
            item for item in self.manifest["operational_bindings"]
            if "write" in item["access"]
        ]
        self.assertEqual(
            {(item["projection"], item["symbol"]) for item in writers},
            {
                ("server/bitacora_server.py", "OBSIDIAN_ROOT"),
                ("server/closure_core.py", "OBSIDIAN_REPORT"),
            },
        )
        self.assertTrue(all(
            item["decision_status"] == "inherited_pending_review"
            for item in writers
        ))


if __name__ == "__main__":
    unittest.main()
