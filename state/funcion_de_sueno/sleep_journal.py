"""Journal global de la funcion de sueno — esquema sleep_events/v1.

Motor Python. Debe producir exactamente los mismos identificadores, los mismos
hashes y la misma racha que `sleep_journal.mjs`. Contrato: `JOURNAL_v1.md`.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Iterable

SCHEMA = "sleep_events/v1"

STAGES = ("fired", "executed", "failed", "published", "absorbed")

# Maquina de estados. Ninguna etapa se infiere por la existencia de otra.
ALLOWED_NEXT: dict[str | None, tuple[str, ...]] = {
    None: ("fired",),
    "fired": ("executed", "failed"),
    "executed": ("published",),
    "published": ("absorbed",),
    "failed": (),
    "absorbed": (),
}

FIELDS = (
    "schema",
    "run_id",
    "attempt_id",
    "stage",
    "routine_id",
    "scheduled_at",
    "occurred_at",
    "actor",
    "role",
    "executor",
    "payload",
    "prev_hash",
)


def canonical(obj: Any) -> str:
    """JSON canonico: claves ordenadas, sin espacios. Identico en ambos motores."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def run_id(routine_id: str, scheduled_at: str, actor: str, role: str) -> str:
    """Identidad estable de una corrida.

    El separador `|` endurece la concatenacion del spec, que sin delimitador
    seria ambigua. Ver JOURNAL_v1.md seccion 4.
    """
    joined = "|".join([routine_id, scheduled_at, actor, role])
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()


def record_hash(record: dict[str, Any]) -> str:
    body = {k: record.get(k) for k in FIELDS}
    return hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()


def dedup_key(record: dict[str, Any]) -> tuple[str, str, int]:
    """Clave de deduplicacion: (run_id, stage, attempt_id).

    Anade `attempt_id` a la clave del spec porque `run_id + stage` estricto hace
    incompatibles las pruebas 2 y 3. Ver JOURNAL_v1.md seccion 5.
    """
    return (record["run_id"], record["stage"], int(record.get("attempt_id", 1)))


class Incidencia(Exception):
    """Rechazo registrable: duplicado en conflicto o transicion no permitida."""

    def __init__(self, reason: str, detail: dict[str, Any] | None = None) -> None:
        super().__init__(reason)
        self.reason = reason
        self.detail = detail or {}


class Journal:
    """Journal append-only. Escritor unico y serializado."""

    def __init__(self, records: Iterable[dict[str, Any]] | None = None) -> None:
        self.records: list[dict[str, Any]] = list(records or [])
        self.incidencias: list[dict[str, Any]] = []

    # -- lectura -------------------------------------------------------------

    @classmethod
    def loads(cls, text: str) -> "Journal":
        rows = [json.loads(line) for line in text.splitlines() if line.strip()]
        return cls(rows)

    def dumps(self) -> str:
        return "".join(canonical(r) + "\n" for r in self.records)

    @property
    def head_hash(self) -> str:
        return self.records[-1]["record_hash"] if self.records else ""

    def stage_of(self, rid: str, attempt: int = 1) -> str | None:
        """Ultima etapa alcanzada por una corrida, o None si no existe."""
        last = None
        for r in self.records:
            if r["run_id"] == rid and int(r.get("attempt_id", 1)) == attempt:
                last = r["stage"]
        return last

    # -- escritura -----------------------------------------------------------

    def append(
        self,
        *,
        stage: str,
        routine_id: str,
        scheduled_at: str,
        occurred_at: str,
        actor: str,
        role: str,
        executor: str | None = None,
        attempt_id: int = 1,
        payload: dict[str, Any] | None = None,
        expected_head: str | None = None,
    ) -> dict[str, Any] | None:
        """Anade una transicion. Devuelve el registro, o None si fue no-op idempotente.

        Lanza Incidencia si la transicion no esta permitida, si la clave ya existe
        con contenido distinto, o si `expected_head` no coincide con la cabeza
        actual (actualizacion optimista).
        """
        if stage not in STAGES:
            raise Incidencia("etapa_desconocida", {"stage": stage})

        if expected_head is not None and expected_head != self.head_hash:
            raise Incidencia(
                "cabeza_desplazada",
                {"expected": expected_head, "actual": self.head_hash},
            )

        rid = run_id(routine_id, scheduled_at, actor, role)
        record = {
            "schema": SCHEMA,
            "run_id": rid,
            "attempt_id": int(attempt_id),
            "stage": stage,
            "routine_id": routine_id,
            "scheduled_at": scheduled_at,
            "occurred_at": occurred_at,
            "actor": actor,
            "role": role,
            "executor": executor,
            "payload": payload or {},
            "prev_hash": self.head_hash,
        }

        key = dedup_key(record)
        for existing in self.records:
            if dedup_key(existing) != key:
                continue
            # misma clave: idempotente si el cuerpo coincide, incidencia si no
            same = all(existing.get(f) == record.get(f) for f in FIELDS if f != "prev_hash")
            if same:
                return None
            raise Incidencia(
                "conflicto_de_contenido",
                {"key": list(key), "existing": existing, "incoming": record},
            )

        current = self.stage_of(rid, int(attempt_id))
        if stage not in ALLOWED_NEXT.get(current, ()):
            raise Incidencia(
                "transicion_no_permitida",
                {"from": current, "to": stage, "run_id": rid},
            )

        record["record_hash"] = record_hash(record)
        self.records.append(record)
        return record

    def append_safe(self, **kwargs: Any) -> dict[str, Any] | None:
        """Como `append`, pero registra la incidencia en vez de propagarla."""
        try:
            return self.append(**kwargs)
        except Incidencia as exc:
            self.incidencias.append({"reason": exc.reason, "detail": exc.detail})
            return None

    # -- derivaciones --------------------------------------------------------

    def executed(self) -> list[dict[str, Any]]:
        """Ejecuciones globales, ordenadas por `scheduled_at`.

        Una corrida cuenta una sola vez aunque tenga varios intentos.
        """
        seen: dict[str, dict[str, Any]] = {}
        for r in self.records:
            if r["stage"] != "executed":
                continue
            seen.setdefault(r["run_id"], r)
        return sorted(seen.values(), key=lambda r: (r["scheduled_at"], r["actor"]))

    def streak_series(self) -> list[tuple[str, str, int]]:
        """(scheduled_at, actor, streak) sobre las ejecuciones globales."""
        out: list[tuple[str, str, int]] = []
        prev: str | None = None
        streak = 0
        for r in self.executed():
            actor = r["actor"]
            streak = streak + 1 if actor == prev else 1
            prev = actor
            out.append((r["scheduled_at"], actor, streak))
        return out

    def current_streak(self) -> tuple[str | None, int]:
        series = self.streak_series()
        if not series:
            return (None, 0)
        return (series[-1][1], series[-1][2])

    def max_streak(self) -> int:
        series = self.streak_series()
        return max((s for _, _, s in series), default=0)

    def unabsorbed(self) -> list[dict[str, Any]]:
        """Corridas ejecutadas que el canon todavia no ha incorporado."""
        absorbed = {r["run_id"] for r in self.records if r["stage"] == "absorbed"}
        return [r for r in self.executed() if r["run_id"] not in absorbed]

    def verify_chain(self) -> bool:
        prev = ""
        for r in self.records:
            if r.get("prev_hash") != prev:
                return False
            if r.get("record_hash") != record_hash(r):
                return False
            prev = r["record_hash"]
        return True


# -- migracion desde el ledger ----------------------------------------------

ROUTINE_ID = "sueno-nocturno"


def from_ledger(lines: Iterable[str], absorbed_keys: set[tuple] | None = None) -> Journal:
    """Proyecta `sleep_ledger.jsonl` al journal, sin perdida.

    Cada linea produce `fired` + `executed`. Si su clave figura en
    `absorbed_keys` (las que ya vivian en el tronco), anade tambien `absorbed`.
    """
    journal = Journal()
    rows = [json.loads(l) for l in lines if l.strip()]
    rows.sort(key=lambda e: (e.get("ts", ""), e.get("actor") or ""))
    for e in rows:
        actor = e.get("actor")
        role = e.get("role")
        if not actor or not role:
            continue  # bootstrap y filas sin identidad no son corridas
        ts = e["ts"]
        common = dict(
            routine_id=ROUTINE_ID,
            scheduled_at=ts,
            occurred_at=ts,
            actor=actor,
            role=role,
            executor=e.get("executor"),
        )
        journal.append_safe(stage="fired", payload={}, **common)
        journal.append_safe(
            stage="executed",
            payload={
                "report": e.get("report"),
                "verdict": e.get("verdict"),
                "phases": e.get("phases"),
            },
            **common,
        )
        key = (e.get("ts"), e.get("event"), actor, role)
        if absorbed_keys is None or key in absorbed_keys:
            journal.append_safe(stage="published", payload={}, **common)
            journal.append_safe(stage="absorbed", payload={}, **common)
    return journal
