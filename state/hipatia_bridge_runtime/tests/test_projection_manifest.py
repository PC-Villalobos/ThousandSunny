#!/usr/bin/env python3
"""Contrato de integridad y exclusión de la proyección versionada."""

from __future__ import annotations

import hashlib
import json
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


if __name__ == "__main__":
    unittest.main()
