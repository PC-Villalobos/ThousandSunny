# MEDITACIÓN — spec

Version: 0.1
Estado: activo
Fuente: bridge-linux/ARQUITECTURA.md ("Meditación profunda — pendiente de implementar")
Certeza: N2 (procedimiento verificado en la primera corrida 2026-06-25)

## Propósito

Auditoría **semántica** del corpus fundacional ("la biblia"): detectar
contradicciones de sentido, estratos temporales incompatibles y nomenclatura
obsoleta frente al canon vigente. Complementa al sueño, no lo repite.

| | Sueño (`/sueno`, Nami) | Meditación (`/robin-meditacion`, Robin) |
|---|---|---|
| Audita | superficie | sentido |
| Detecta | hashes, enlaces, archivos | contradicciones, estratos, obsolescencia |
| Alcance | `state/` (repo) | la biblia (Drive + canon repo) |
| Cadencia | nocturna | semanal / a demanda |

## Órgano y sistema nervioso

- **Órgano**: el skill `.claude/skills/robin-meditacion/SKILL.md`.
- **Disparo**: Routine de Claude (con connector Drive) o invocación directa.
- Registro de rutina: `RUTINAS.md`.

## Archivos

- `MEDITACION_spec.md` — este documento.
- `meditacion_ledger.jsonl` — una línea por corrida.
- `reports/MEDITACION_<fecha>.md` — reportes.

## Guardrails

Ver lista canónica en el skill. Resumen: nunca mutar fuentes; no declarar canon
sin GO del Capitán; evidencia (doc + cita) en cada hallazgo; metadata-only para
material protegido; sin teatro.

## Variables de entorno (secretos, nunca commiteadas)

Reusa las del sueño: `BITACORA_GAS_URL`, `BITACORA_GAS_TOKEN` (nakama=Robin,
tema=meditacion). Si no están, el bloque de bitácora queda en el reporte.
