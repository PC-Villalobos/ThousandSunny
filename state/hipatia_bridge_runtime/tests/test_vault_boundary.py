#!/usr/bin/env python3
"""La frontera del vault: espejo opcional, y lo que no se ve no se afirma.

Fija la decision tomada el 2026-10-16 sobre los tres `inherited_pending_review`
del manifiesto. La prueba que importa es la primera: el 2026-10-16 la Bitacora
NO arrancaba sin el MOC de Obsidian —`update_obsidian_moc` lanzaba
`RuntimeError`—, asi que la autoridad operativa no se podia levantar en ninguna
maquina que no fuese la del Capitan. Eso es ahora una regresion vigilada.
"""

from __future__ import annotations

import importlib
import os
import tempfile
import unittest
from pathlib import Path

VAULT_AUSENTE = Path(tempfile.gettempdir()) / "hipatia-vault-que-no-existe"
MARCADORES = (
    "<!-- BITACORA_DAILY_LINKS_START -->\n"
    "<!-- BITACORA_DAILY_LINKS_END -->\n"
)

os.environ["HIPATIA_OBSIDIAN_ROOT"] = str(VAULT_AUSENTE)

import bitacora_server  # noqa: E402  (el entorno se fija antes de importar)
import closure_core  # noqa: E402
import vault  # noqa: E402


def apuntar(raiz: Path):
    """Reapunta el vault y recarga lo que resolvio sus rutas al importarse."""
    os.environ["HIPATIA_OBSIDIAN_ROOT"] = str(raiz)
    importlib.reload(vault)
    importlib.reload(closure_core)
    importlib.reload(bitacora_server)


class FronteraDelVaultTests(unittest.TestCase):
    def setUp(self) -> None:
        apuntar(VAULT_AUSENTE)

    def test_sin_vault_el_arranque_no_lanza_y_no_crea_nada(self) -> None:
        self.assertFalse(vault.activo(), "el vault de esta prueba no debe existir")
        bitacora_server.synchronize()  # esto era lo que lanzaba RuntimeError
        self.assertFalse(
            VAULT_AUSENTE.exists(),
            "se creo la raiz del vault: crearla a ciegas es el defecto que se vino a quitar",
        )

    def test_sin_vault_la_absorcion_no_se_da_por_cierta(self) -> None:
        absorbido = closure_core.event_absorbed(
            {"timestamp_local": "2026-10-16T00:00:00", "event_id": "cualquiera"}
        )
        self.assertFalse(absorbido, "sin espejo que mirar, absorber no se afirma")

    def test_el_motivo_nombra_la_ruta_y_la_variable(self) -> None:
        motivo = vault.motivo_inactivo()
        self.assertIn(str(VAULT_AUSENTE), motivo)
        self.assertIn(vault.VARIABLE_ENTORNO, motivo)

    def test_con_vault_montado_se_espeja_y_el_MOC_se_mantiene(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            raiz = Path(tmp)
            moc = raiz / "MOC_BITACORA_HIPATIA_LOCAL_v1.md"
            moc.write_text(f"# MOC\n\n{MARCADORES}", encoding="utf-8")
            apuntar(raiz)
            self.assertTrue(vault.activo())
            bitacora_server.synchronize()
            texto = moc.read_text(encoding="utf-8")
            self.assertIn("<!-- BITACORA_DAILY_LINKS_START -->", texto)
            self.assertIn("<!-- BITACORA_DAILY_LINKS_END -->", texto)

    def test_con_vault_montado_y_MOC_ausente_si_es_un_error(self) -> None:
        # Ausencia del vault se tolera; incoherencia de un vault presente, no.
        with tempfile.TemporaryDirectory() as tmp:
            apuntar(Path(tmp))
            self.assertTrue(vault.activo())
            with self.assertRaises(RuntimeError):
                bitacora_server.synchronize()

    def test_la_raiz_por_defecto_sigue_siendo_la_heredada(self) -> None:
        # Con el entorno sin poner, el comportamiento en la maquina del Capitan
        # es el de siempre. Si esto cambia, cambia su runtime sin avisar.
        del os.environ[vault.VARIABLE_ENTORNO]
        try:
            importlib.reload(vault)
            self.assertEqual(
                str(vault.raiz()),
                r"D:\La maceta de Groot\40_Biblioteca_Hipatia\_bitacora_v1",
            )
        finally:
            apuntar(VAULT_AUSENTE)


if __name__ == "__main__":
    unittest.main()
