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

    def test_no_module_level_absolute_vault_path_remains(self) -> None:
        # El cerrojo cambia de sentido el 2026-10-16, al resolverse la decision
        # heredada: antes obligaba a DECLARAR cada ruta absoluta de Windows que
        # hubiese en el codigo; ahora PROHIBE que quede ninguna. Las rutas del
        # vault se resuelven en `server/vault.py`, con el valor heredado como
        # defecto y `HIPATIA_OBSIDIAN_ROOT` para sobreescribirlo sin tocar
        # codigo. Una ruta absoluta nueva vuelve a dejar el runtime atado a una
        # sola maquina, que es justo lo que impedia arrancar la Bitacora en
        # cualquier otra.
        assignment = re.compile(
            r'^([A-Z][A-Z0-9_]*)\s*=\s*Path\(r"([A-Za-z]:\\[^"]+)"\)',
            re.MULTILINE,
        )
        observed = set()
        for path in sorted((ROOT / "server").glob("*.py")):
            for symbol, value in assignment.findall(path.read_text(encoding="utf-8")):
                observed.add((path.relative_to(ROOT).as_posix(), symbol, value))
        self.assertEqual(
            observed,
            set(),
            "una ruta absoluta de vault volvio al codigo: resuelvela por server/vault.py",
        )

    def test_every_vault_binding_is_declared_optional_and_overridable(self) -> None:
        import vault

        for item in self.manifest["operational_bindings"]:
            with self.subTest(symbol=item["symbol"]):
                self.assertTrue(set(item["access"]))
                self.assertLessEqual(set(item["access"]), {"read", "write"})
                self.assertEqual(item["boundary"], "synced_vault")
                self.assertEqual(item["decision_status"], "resolved_optional_mirror")
                self.assertEqual(item["env_override"], vault.VARIABLE_ENTORNO)
                self.assertFalse(item["required"], "el espejo del vault no es obligatorio")
                # El simbolo declarado existe de verdad en el modulo al que se
                # atribuye: el manifiesto no puede derivar del codigo.
                source = (ROOT / item["projection"]).read_text(encoding="utf-8")
                self.assertRegex(source, rf"(?m)^{item['symbol']}\s*=")
                # Y su ruta por defecto sigue siendo la heredada, que es la que
                # mantiene identico el comportamiento en la maquina del Capitan.
                self.assertTrue(item["path"].startswith(vault.RAIZ_POR_DEFECTO))

    def test_the_vault_writers_are_still_exactly_two(self) -> None:
        # El espejo es opcional, no libre: quien escribe en el vault sigue
        # estando enumerado, para que nadie anada un escritor nuevo en silencio.
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


if __name__ == "__main__":
    unittest.main()
