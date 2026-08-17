#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Suite del journal global — las nueve pruebas exigidas al encargo Groot 1-3.

stdlib + pytest. Ninguna prueba contacta red, GAS, Drive ni material protegido.
Run: python -m pytest state/funcion_de_sueno/test_sleep_journal.py -v
"""

import json
import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from sleep_journal import (  # noqa: E402
    Incidencia,
    Journal,
    canonical,
    from_ledger,
    run_id,
)

ROUTINE = "sueno-nocturno"


def _run(journal, stage, ts, actor, role, **kw):
    return journal.append(
        stage=stage,
        routine_id=ROUTINE,
        scheduled_at=ts,
        occurred_at=ts,
        actor=actor,
        role=role,
        **kw,
    )


def _executed(journal, ts, actor, role="Groot", attempt_id=1):
    """Lleva una corrida hasta `executed`."""
    _run(journal, "fired", ts, actor, role, attempt_id=attempt_id)
    return _run(journal, "executed", ts, actor, role, attempt_id=attempt_id)


class TestPrueba1CincoPRParalelos(unittest.TestCase):
    """Cinco PR paralelos producen cinco ejecuciones globales, no racha falsa."""

    def test_cinco_ramas_paralelas_no_producen_racha_del_determinista(self):
        j = Journal()
        # cada noche: la ruta agentica ejecuta en su rama, la determinista en el tronco
        for day in range(16, 21):
            _executed(j, f"2026-07-{day}T01:11:00Z", "claude-code")
            _executed(j, f"2026-07-{day}T04:30:00Z", "github-actions")

        self.assertEqual(len(j.executed()), 10)
        # las cinco agenticas estan presentes como ejecuciones globales
        agenticas = [r for r in j.executed() if r["actor"] == "claude-code"]
        self.assertEqual(len(agenticas), 5)
        # y por tanto no hay racha del actor determinista
        self.assertEqual(j.max_streak(), 1)


class TestPrueba2Idempotencia(unittest.TestCase):
    """Reejecutar el mismo evento no duplica filas."""

    def test_reemitir_identico_es_no_op(self):
        j = Journal()
        _executed(j, "2026-07-20T01:11:00Z", "claude-code")
        antes = len(j.records)

        repetido = _run(j, "executed", "2026-07-20T01:11:00Z", "claude-code", "Groot")

        self.assertIsNone(repetido, "el reemitido identico debe ser no-op")
        self.assertEqual(len(j.records), antes)


class TestPrueba3Reintentos(unittest.TestCase):
    """Un retry conserva run_id y genera otro attempt_id."""

    def test_retry_conserva_run_id_y_anade_attempt(self):
        j = Journal()
        ts = "2026-07-20T01:11:00Z"
        _run(j, "fired", ts, "claude-code", "Groot", attempt_id=1)
        _run(j, "failed", ts, "claude-code", "Groot", attempt_id=1)

        # reintento: mismo run_id, attempt distinto
        _run(j, "fired", ts, "claude-code", "Groot", attempt_id=2)
        r2 = _run(j, "executed", ts, "claude-code", "Groot", attempt_id=2)

        esperado = run_id(ROUTINE, ts, "claude-code", "Groot")
        ids = {r["run_id"] for r in j.records}
        self.assertEqual(ids, {esperado}, "el reintento debe conservar el run_id")
        self.assertEqual(r2["attempt_id"], 2)
        self.assertEqual({r["attempt_id"] for r in j.records}, {1, 2})
        # la corrida cuenta una sola vez como ejecucion global
        self.assertEqual(len(j.executed()), 1)


class TestPrueba4TransicionesContradictorias(unittest.TestCase):
    """Dos transiciones contradictorias para la misma etapa quedan bloqueadas."""

    def test_conflicto_de_contenido_se_rechaza(self):
        j = Journal()
        ts = "2026-07-20T01:11:00Z"
        _run(j, "fired", ts, "claude-code", "Groot")
        _run(j, "executed", ts, "claude-code", "Groot", payload={"verdict": "fertil"})

        with self.assertRaises(Incidencia) as ctx:
            _run(j, "executed", ts, "claude-code", "Groot", payload={"verdict": "esteril"})
        self.assertEqual(ctx.exception.reason, "conflicto_de_contenido")

    def test_transicion_fuera_de_la_maquina_de_estados_se_rechaza(self):
        j = Journal()
        ts = "2026-07-20T01:11:00Z"
        # absorbed sin haber pasado por executed/published
        with self.assertRaises(Incidencia) as ctx:
            _run(j, "absorbed", ts, "claude-code", "Groot")
        self.assertEqual(ctx.exception.reason, "transicion_no_permitida")

    def test_ninguna_etapa_se_infiere_por_otra(self):
        j = Journal()
        ts = "2026-07-20T01:11:00Z"
        _executed(j, ts, "claude-code")
        rid = run_id(ROUTINE, ts, "claude-code", "Groot")
        # ejecutada, pero no publicada ni absorbida
        self.assertEqual(j.stage_of(rid), "executed")
        self.assertEqual(len(j.unabsorbed()), 1)

    def test_cabeza_desplazada_bloquea_la_escritura(self):
        j = Journal()
        _executed(j, "2026-07-20T01:11:00Z", "claude-code")
        with self.assertRaises(Incidencia) as ctx:
            _run(
                j,
                "published",
                "2026-07-20T01:11:00Z",
                "claude-code",
                "Groot",
                expected_head="hash_que_no_es",
            )
        self.assertEqual(ctx.exception.reason, "cabeza_desplazada")


class TestPrueba5EjecutadoNoAbsorbido(unittest.TestCase):
    """`executed=true, absorbed=false` se representa correctamente."""

    def test_ejecutado_sin_absorber(self):
        j = Journal()
        _executed(j, "2026-07-20T01:11:00Z", "claude-code")  # agentica, en rama
        ts_det = "2026-07-20T04:47:00Z"
        _executed(j, ts_det, "github-actions")
        _run(j, "published", ts_det, "github-actions", "Groot")
        _run(j, "absorbed", ts_det, "github-actions", "Groot")

        sin_absorber = j.unabsorbed()
        self.assertEqual(len(sin_absorber), 1)
        self.assertEqual(sin_absorber[0]["actor"], "claude-code")
        # y absorber la determinista no altera el hecho de que la agentica se ejecuto
        self.assertEqual(len(j.executed()), 2)


class TestPrueba6SecuenciaReal(unittest.TestCase):
    """La secuencia real 16-20 calcula alternancia sin depender de merges."""

    VENTANA = ("2026-07-16", "2026-07-20")

    def _serie(self, journal):
        lo, hi = self.VENTANA
        return [
            (ts, actor, s)
            for ts, actor, s in journal.streak_series()
            if lo <= ts[:10] <= hi
        ]

    def test_ambas_rutas_estan_presentes_sin_depender_de_merges(self):
        ledger = (HERE / "sleep_ledger.jsonl").read_text(encoding="utf-8").splitlines()
        serie = self._serie(from_ledger(ledger))
        actores = {a for _, a, _ in serie}
        self.assertIn("claude-code", actores, "la ruta agentica debe estar presente")
        self.assertIn("github-actions", actores, "la ruta determinista debe estar presente")
        # hay alternancia real: el actor cambia varias veces dentro de la ventana
        cambios = sum(
            1 for i in range(1, len(serie)) if serie[i][1] != serie[i - 1][1]
        )
        self.assertGreaterEqual(cambios, 4, "debe haber alternancia, no un actor fijo")

    def test_la_consolidacion_reduce_la_racha_de_la_vista_parcial(self):
        """La vista parcial (solo lo que el tronco habia absorbido) infla la racha."""
        ledger = (HERE / "sleep_ledger.jsonl").read_text(encoding="utf-8").splitlines()
        completo = max(s for _, _, s in self._serie(from_ledger(ledger)))
        # el tronco solo absorbio la ruta determinista
        solo_tronco = [
            l
            for l in ledger
            if l.strip() and json.loads(l).get("actor") != "claude-code"
        ]
        parcial = max(s for _, _, s in self._serie(from_ledger(solo_tronco)))
        self.assertGreater(
            parcial,
            completo,
            "la vista parcial debe reportar una racha mayor que la consolidada",
        )
        self.assertGreaterEqual(parcial, 5, "la vista parcial reportaba rachas altas")

    def test_la_racha_residual_se_explica_por_noches_sin_ruta_agentica(self):
        """La racha consolidada que queda no es artefacto: es una ausencia real."""
        ledger = (HERE / "sleep_ledger.jsonl").read_text(encoding="utf-8").splitlines()
        j = from_ledger(ledger)
        noches = {}
        for r in j.executed():
            noches.setdefault(r["scheduled_at"][:10], set()).add(r["actor"])
        # el 2026-07-15 no hay corrida agentica en ninguna rama
        self.assertNotIn("claude-code", noches.get("2026-07-15", set()))
        # y por eso la determinista encadena 07-14, 07-15 y 07-16
        self.assertEqual(max(s for _, _, s in self._serie(j)), 3)


class TestPrueba7SaltoDeRacha(unittest.TestCase):
    """El salto streak 11->7 desaparece con el journal consolidado."""

    def test_vista_parcial_inventa_racha_que_el_journal_no_ve(self):
        # vista parcial: solo la ruta determinista (lo que veia el tronco)
        parcial = Journal()
        for day in range(8, 19):
            _executed(parcial, f"2026-07-{day:02d}T04:30:00Z", "github-actions")
        self.assertGreaterEqual(parcial.max_streak(), 11)

        # journal consolidado: incluye tambien la ruta agentica de cada noche
        completo = Journal()
        for day in range(8, 19):
            _executed(completo, f"2026-07-{day:02d}T01:11:00Z", "claude-code")
            _executed(completo, f"2026-07-{day:02d}T04:30:00Z", "github-actions")

        self.assertEqual(completo.max_streak(), 1)
        # y no hay saltos: la racha derivada es monotona por construccion
        serie = [s for _, _, s in completo.streak_series()]
        self.assertTrue(all(s == 1 for s in serie))

    def test_la_racha_no_se_persiste_nunca(self):
        j = Journal()
        _executed(j, "2026-07-20T01:11:00Z", "claude-code")
        for r in j.records:
            self.assertNotIn("streak", r, "streak jamas es dato primario")


class TestPrueba8ParidadDeMotores(unittest.TestCase):
    """Los motores .mjs y .py producen el mismo identificador y el mismo resultado."""

    def _node(self, script):
        res = subprocess.run(
            ["node", "--input-type=module", "-e", script],
            capture_output=True,
            text=True,
            cwd=str(HERE),
        )
        self.assertEqual(res.returncode, 0, res.stderr)
        return json.loads(res.stdout)

    def test_mismo_run_id(self):
        args = (ROUTINE, "2026-07-20T01:11:00Z", "claude-code", "Groot")
        py = run_id(*args)
        node = self._node(
            "import {runId} from './sleep_journal.mjs';"
            f"console.log(JSON.stringify(runId({json.dumps(list(args))[1:-1]})));"
        )
        self.assertEqual(py, node)

    def test_mismo_json_canonico(self):
        obj = {"b": 1, "a": {"d": [3, 2], "c": None}, "z": "ñ"}
        py = canonical(obj)
        node = self._node(
            "import {canonical} from './sleep_journal.mjs';"
            f"console.log(JSON.stringify(canonical({json.dumps(obj)})));"
        )
        self.assertEqual(py, node)

    def test_misma_racha_y_mismos_hashes_sobre_el_ledger_real(self):
        ledger_path = HERE / "sleep_ledger.jsonl"
        j = from_ledger(ledger_path.read_text(encoding="utf-8").splitlines())
        py = {
            "eventos": len(j.records),
            "ejecuciones": len(j.executed()),
            "max_streak": j.max_streak(),
            "cadena_ok": j.verify_chain(),
            "head": j.head_hash,
        }
        node = self._node(
            "import {readFileSync} from 'node:fs';"
            "import {fromLedger} from './sleep_journal.mjs';"
            "const ls=readFileSync('sleep_ledger.jsonl','utf8').split('\\n');"
            "const j=fromLedger(ls);"
            "console.log(JSON.stringify({eventos:j.records.length,"
            "ejecuciones:j.executed().length,max_streak:j.maxStreak(),"
            "cadena_ok:j.verifyChain(),head:j.headHash}));"
        )
        self.assertEqual(py, node, "ambos motores deben coincidir exactamente")
        self.assertTrue(py["cadena_ok"], "la cadena de hash debe verificar")


class TestPrueba9SinContactoExterno(unittest.TestCase):
    """Ninguna prueba contacta GAS, Claude, Drive ni material protegido."""

    PROHIBIDO = (
        "http://",
        "https://",
        "requests",
        "urllib",
        "socket",
        "fetch(",
        "node:http",
        "BITACORA_GAS",
        "drive.google",
        "HOLD_CLINICO",
        "BOVEDA_NEXUS",
    )

    def test_los_motores_y_la_suite_no_alcanzan_el_exterior(self):
        for nombre in ("sleep_journal.py", "sleep_journal.mjs", "test_sleep_journal.py"):
            texto = (HERE / nombre).read_text(encoding="utf-8")
            for aguja in self.PROHIBIDO:
                if nombre == "test_sleep_journal.py" and aguja in self.PROHIBIDO[:0]:
                    continue
                self.assertNotIn(
                    aguja,
                    texto.replace('"' + aguja + '"', "").replace("'" + aguja + "'", ""),
                    f"{nombre} no debe referirse a {aguja}",
                )

    def test_no_se_lee_material_protegido(self):
        # la suite solo toca el ledger, que es metadato operativo sin contenido clinico
        ledger = (HERE / "sleep_ledger.jsonl").read_text(encoding="utf-8")
        self.assertNotIn("HOLD_CLINICO", ledger)


class TestIntegridadDeCadena(unittest.TestCase):
    def test_la_cadena_detecta_manipulacion(self):
        j = Journal()
        _executed(j, "2026-07-20T01:11:00Z", "claude-code")
        self.assertTrue(j.verify_chain())
        j.records[0]["actor"] = "otro"
        self.assertFalse(j.verify_chain(), "manipular una fila debe romper la cadena")


class TestMigracionSinPerdida(unittest.TestCase):
    def test_toda_corrida_del_ledger_llega_al_journal(self):
        ledger = (HERE / "sleep_ledger.jsonl").read_text(encoding="utf-8").splitlines()
        filas = [json.loads(l) for l in ledger if l.strip()]
        corridas = [e for e in filas if e.get("actor") and e.get("role")]
        j = from_ledger(ledger)
        self.assertEqual(
            len(j.executed()),
            len({(e["ts"], e["actor"], e["role"]) for e in corridas}),
            "cada corrida del ledger debe aparecer como ejecucion global",
        )
        self.assertEqual(j.incidencias, [], "la migracion no debe generar incidencias")


if __name__ == "__main__":
    unittest.main()
