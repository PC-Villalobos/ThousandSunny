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

## Trillar el millo (el nombre canario del ciclo)

*Trillar el millo* es como el Capitan nombra este ciclo N1->REM: de noche se separa el
grano de la paja para que **por la manana el desayuno este hecho**. Es la misma funcion,
dicha en su lengua.

**El millo es el transcript.** El grano mas rico no son solo los ficheros de `state/`
(el granero), sino la **huella de cada sesion**: el transcript con las herramientas
llamadas, las decisiones y su *por que*. Ahi vive la memoria episodica real. Hoy el sueno
trilla `state/`; el transcript es el grano fresco que aun falta meter en la era.

**Quien trilla que:**
- **Grano publico** (arquitectura, trabajo no sensible): se puede destilar en la nube a
  un digest **filtrado** y commitearlo para que una Routine lo trille. Es el `checkpoint`
  con mas cuerpo.
- **Grano pesado y privado** (transcripts con cualquier dato clinico/de paciente): se
  trilla **solo en el cuerpo soberano** (Laboon/Odysseus), en local, bajo keystone.
  **Jamas** se sube un transcript crudo con datos de paciente al repo ni a una API de
  nube. El millo privado se trilla en casa.

**Limite honesto (nube).** En la nube cada Routine arranca en un contenedor nuevo, sin
disco compartido: **no ve los transcripts de ayer**. Trillar el millo de los transcripts
es, para el grano pesado, tarea del cuerpo soberano persistente
(`bridge-linux/ARQUITECTURA.md`, Laboon/Odysseus). Coherente con la casa: una tarea que
no puede observar su objetivo se marca `pending-rearchitect`, no finge.

## El shadowlog y la herencia de SOFIA (2026-07-02)

Orden del Capitan: la revision semanal manual de SOFIA (evento de Calendar, lunes
9:00) y las tareas programadas manuales quedan **sustituidas** por esta funcion
corriendo en la nube. El barco se audita solo; el Capitan lee el parte al despertar.

**Herencia SOFIA** — las cinco preguntas del "sistema inmune simbolico" viven ahora
en las fases:

1. Que hay en ZONA_DE_CAPTURA -> N1 (deltas) + triaje (la gran Nemesis propone).
2. Que proyectos avanzaron -> N2 (memoria episodica/procedimental).
3. Que esta bloqueado -> N3 (pendientes acumulados, marcadores RETOMAR).
4. Coherencia AGAPE / NEMESIS / OPERATIVO -> N3 (coherencia Sophia) + REM.
5. Que entra la semana siguiente -> REM (aprendizaje del ciclo) + meditacion semanal.

**El shadowlog** — nombre canonico revivido del canon viejo, apuntando ahora a
artefactos reales (nada de maquinaria nueva): es el registro de sombras del sueno.

- La luz (lo consolidado) -> `reports/SLEEP_<fecha>.md`.
- La sombra (deriva, contradicciones, huerfanos, glitches, streaks) ->
  `sleep_ledger.jsonl` + las secciones de auditoria del parte.
- En el hub, `state/cuarentena/` es su hermana: lo rechazado.

Un glitch anotado en el shadowlog no se exorciza: se juzga en el Concilio
(`state/concilio/`) — JoyBoy o Buggy, segun a quien sirve.

**Sustrato**: Routines de Claude Code en la nube, conectadas a **GitHub** (el repo
que la Routine clona y donde escribe), **Drive** (connector; precedente real:
meditacion 2026-06-25) y **Obsidian** (via micelio git: obsidian-git hace pull en
movil/PC y la maceta ve el parte). Salud por rutina: `RUTINAS.md`.

## La funcion del sueno: recordar mejor, no mas

El sueno no es recordar mas, es **recordar mejor**. Su metabolismo (no solo auditar):

```
SUENO = OLVIDAR + INTEGRAR + REENSAYAR + JERARQUIZAR + CANONIZAR + PODAR
```

El peligro no es solo perder memoria; es **conservarlo todo**: si nada se poda,
`canon = vertedero` y la memoria viva colapsa (la gran Nemesis, ver
`docs/MIGRACION_SEMANTICA.md`). El sueno **propone** el triaje
(TRIVIAL->eliminar / OPERATIVO->resumir / SIGNIFICATIVO->integrar / FUNDACIONAL->canonizar),
pero **la poda y la canonizacion requieren GO del Capitan**: borrar memoria es
consecuente, y el Capitan es la Nemesis que decide que sobrevive. El sueno marca; el
Capitan firma. (Coherente con el guardrail: sin mutar fuentes sin firma.)

> La memoria no consiste en conservarlo todo, sino en saber que merece seguir
> sonandose manana.

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
