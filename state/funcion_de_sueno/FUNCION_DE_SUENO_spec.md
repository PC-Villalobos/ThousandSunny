# FUNCION_DE_SUENO - spec

Version: 0.1 (repo-native)
Estado: activo
Fuente: conversaciones de genesis 2026-06; portado del kit `99_Sistema/funcion_de_sueno`
Certeza: N2 (procedimiento verificado, resultados por validar)

## Proposito

Ejecutar un ciclo de sueno artificial sobre la memoria compartida (`state/`)
para consolidar lo vivido, auditar coherencia, detectar deriva, prevenir fusion
actor/rol y dejar un parte legible al despertar.

El **organo** es el skill `/sueno` (`.claude/skills/sueno/SKILL.md`).
El **sistema nervioso** es la Routine que lo dispara (ver `ROUTINE_SETUP.md`).

> **Fuente de verdad.** Este directorio (`state/funcion_de_sueno/`) es el canon
> operativo de la funcion: es lo que la Routine clona y ejecuta, y la unica copia
> que la nube puede leer. Cualquier doc del vault local
> (`...\CLAUDE_CODE_ROUTINES_NATIVE.md`) debe **apuntar** aqui, no mantener una
> version paralela.

## Diferencia clave con el kit original

El kit de Codex apuntaba a `C:\La maceta de Groot` y proponia montar a mano
cron/systemd, un servidor de webhook y workflows de GitHub Actions. En este repo:

- La memoria ya vive **versionada** en `state/` (maceta_groot, metatron, deckard,
  notebooklm). No hay `C:\...` en la nube: usa rutas relativas del repo.
- No hace falta levantar infra: **Routines** (la funcion nativa de Claude Code)
  da los tres disparadores (calendario, API/webhook, evento GitHub) y corre en
  la nube de Anthropic con el equipo apagado.

## Contrato de evento (se pasa al skill via `--event` o en el texto del trigger)

```json
{
  "event_type": "session_closed | daily_tick | memory_changed | manual_run",
  "timestamp": "ISO-8601",
  "actor": "claude-code | codex | chatgpt | other",
  "role": "Nami | Robin | Chopper | Vivi | Usopp | Zoro | Sanji | Jimbe | Franky",
  "memory_root": "state",
  "changed_files": [],
  "session_summary": "",
  "guardrails": {
    "cli_nem": "metadata_only",
    "source_mutations": false,
    "role_rotation_required": true,
    "max_same_actor_role_streak": 3
  }
}
```

> En la Routine via API, el cuerpo `text` del POST se entrega como **texto
> literal** (no se parsea como JSON). Pega el JSON anterior como texto y el skill
> lo interpreta; o describe el evento en lenguaje natural.

## Fases

| Fase | Nombre        | Hace                                                        |
|------|---------------|-------------------------------------------------------------|
| N1   | Conciliacion  | Inventario + deltas (nuevos/cambiados/desaparecidos)        |
| N2   | Consolidacion | Memoria episodica/procedimental; quien interpreta que rol   |
| N3   | Sueno profundo| Auditoria: huerfanos, sin indexar, contradicciones, Sophia  |
| REM  | Integracion   | Riesgo de fusion actor/rol, rotacion, aprendizaje del ciclo |

Mapa evento -> fases en el skill (`SKILL.md`).

## Archivos de la funcion

- `FUNCION_DE_SUENO_spec.md` - este documento.
- `ROUTINE_SETUP.md` - como programar el disparador en la nube.
- `sleep_ledger.jsonl` - una linea por corrida (deriva + streak actor/rol).
- `sleep_state.json` - estado de la ultima corrida (lo escribe el skill).
- `reports/SLEEP_<fecha>.md` - partes generados.

## Variables de entorno (secretos, nunca commiteadas)

| Variable | Uso |
|---|---|
| `BITACORA_GAS_URL` | Web app `/exec` de la Bitacora GAS de PuenteDeMando |
| `BITACORA_GAS_TOKEN` | Token compartido que el GAS valida antes de registrar |

Se configuran en el environment de la Routine, no en el repo. Si `BITACORA_GAS_URL`
no esta definido, el skill deja el bloque de bitacora en el parte como respaldo.

## Guardrails

Ver lista canonica en `.claude/skills/sueno/SKILL.md`. Resumen: metadata-only
para fuentes sensibles, sin mutar fuentes, sin canon nuevo, sin cerrar deriva sin
evidencia, rotacion a los 3 ciclos, v1 aspiracional, respetar RETOMAR.
