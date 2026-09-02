---
name: sueno
description: >-
  Nami's nightly sleep-function skill for the Thousand Sunny. Runs an
  artificial sleep cycle (N1-REM) over the shared memory in state/ to
  consolidate the day, audit coherence, detect drift, and measure repeated role
  assignment without claiming identity fusion. Use when the user invokes /sueno, or from
  a scheduled routine, API trigger, or GitHub event that fires the sleep
  function.
---

# Sueno - Funcion de Sueno Nocturna (Nami)

Nami navega de noche. Mientras el equipo duerme, este skill ejecuta un ciclo de
sueno artificial sobre la memoria compartida del barco (`state/`) para:

- consolidar lo vivido durante el dia,
- auditar coherencia (incluida la de Sophia, certificadora de conocimiento del
  consejo Agape),
- detectar deriva,
- medir repeticion de asignaciones sin afirmar fusion identitaria,
- y dejar un parte legible al despertar.

Este skill es **el organo** (el procedimiento determinista que corre en una
sesion de Claude). La **rutina** (Routine de Claude Code) es el sistema nervioso
que lo dispara desde la nube. No compiten. Para programar el disparador en la
nube, ver `state/funcion_de_sueno/ROUTINE_SETUP.md`.

> **Aviso de nombres.** Aqui `N1/N2/N3/REM` son **fases del sueno**, no los
> niveles de certeza Deckard (`N0-N5` en `state/deckard/01_CANON.md`). Son dos
> espacios de nombres distintos; no los mezcles en el parte.

## Invocacion

```
/sueno [--event <session_closed|memory_changed|daily_tick|manual_run>]
       [--phases N1,N2,N3,REM]
       [--scope-id <perfil>]
       [--executor <infraestructura>]
       [--actor <componente>]
       [--role <papel>]
       [--supervisor-model <modelo opcional>]
       [--root state]
```

- `--event` decide que fases correr (tabla abajo). Por defecto: `manual_run`.
- `--phases` fuerza fases concretas y gana sobre `--event`.
- `--scope-id`, `--executor`, `--actor` y `--role` son obligatorios y se
  registran por separado. `--supervisor-model` es opcional y no redefine actor.
- `--root` es la raiz de memoria. Por defecto `state` (este repo). Nunca uses
  rutas absolutas tipo `C:\...`: no existen en la nube.

### Evento -> fases

| Evento           | Fases                | Cuando                                  |
|------------------|----------------------|-----------------------------------------|
| `session_closed` | N1 + N2 + REM ligero | Se cerro una sesion de trabajo          |
| `memory_changed` | N1 + N3              | Cambio algo en `state/`                 |
| `daily_tick`     | N1 + N2 + N3 + REM   | Tick nocturno: ciclo completo           |
| `manual_run`     | N1 + N2 + N3 + REM   | A mano (salvo `--phases` explicito)     |

## Las cuatro fases (sobre `--root`, por defecto `state/`)

**N1 - Conciliacion.** Inventaria la memoria. Detecta archivos nuevos, cambiados
y desaparecidos desde la ultima corrida (compara contra el ultimo parte y el
ledger). Calcula deltas. Solo lee; no toca nada.

**N2 - Consolidacion.** Actualiza la lectura de memoria episodica y procedimental
del ciclo: que paso, que quedo pendiente, que aprendizaje. Registra **que actor
interpreto que rol** en esta corrida (entra al ledger en la fase de salida).

**N3 - Sueno profundo.** Auditoria. Busca enlaces huerfanos, notas sin indexar,
pendientes acumulados, contradicciones, y lee la coherencia de Sophia frente al
canon (`state/deckard/01_CANON.md`, `state/maceta_groot/RETOMAR.md`). Reporta;
no resuelve unilateralmente.

**REM - Integracion.** Mide repeticion por ejecuciones y fechas UTC (ver ledger),
ofrece un rol candidato y deja toda rotacion como decision humana.

## Guardrails (innegociables)

1. **Metadata-only para fuentes sensibles.** No abrir ni ingerir contenido
   marcado CLI/NEM ni material clinico/trading/personal; solo metadata. (Canon:
   "Material clinico, trading y personal no se mezclan con canon general.")
2. **Sin mutar fuentes.** No mover, borrar, renombrar ni reorganizar archivos de
   `state/`. Las **unicas** escrituras permitidas son: el parte en
   `state/funcion_de_sueno/reports/`, el ledger `sleep_ledger.jsonl`, y el
   `sleep_state.json` de la propia funcion.
3. **Sin canon nuevo.** No convertir interpretaciones simbolicas en hechos. La
   funcion consolida, audita y reporta; no produce canon. (Canon Deckard: todo
   documento util lleva pilar, estado, fuente y nivel de certeza.)
4. **Sin cerrar deriva sin evidencia.** No declarar resuelta una deriva sin
   apuntar al archivo/linea que lo respalda.
5. **No inventar fusion.** Una asignacion repetida produce
   `repeated_role_assignment`, no un diagnostico de fusion. Toda rotacion queda
   `human_required`.
6. **v1 aspiracional.** No afirmar simulacion fuerte de atractores ni garantia
   total anti-alucinacion.
7. **Respetar RETOMAR.** Honra las reglas activas de
   `state/maceta_groot/RETOMAR.md` (no saltarse fases, no GO sin Capitan, etc.).

## Salida obligatoria

1. **Parte** en `state/funcion_de_sueno/reports/SLEEP_<YYYY-MM-DD>.md` con:
   - evento recibido y fases ejecutadas,
   - deltas episodicos (N1),
   - lectura de coherencia de Sophia (N3),
   - incidencias N3 (huerfanos, sin indexar, contradicciones, pendientes),
   - repeticion de asignacion por ejecuciones y dias (REM),
   - siguiente accion minima segura.
2. **Ledger.** Anexa una linea al ledger del perfil. El perfil repo usa
   `state/funcion_de_sueno/sleep_ledger.jsonl`; el perfil local conserva su
   historia fuera del repo. Nunca se mezclan:
   ```json
   {"ts":"<ISO-8601>","event":"daily_tick","scope_id":"thousandsunny-repo","executor":"github-actions","actor":"deterministic-sleep-engine","role":"Groot","supervisor_model":null,"phases":["N1","N2","N3","REM"],"execution_streak":<n>,"day_streak":<n>,"rotation_decision":"human_required","report":"reports/SLEEP_<fecha>.md","drift":false,"verdict":"fertil|decae|neutral","level":0,"attractor":null}
   ```
   - Las entradas historicas sin contrato completo se preservan pero no extienden
     la serie comparable nueva. `day_streak` cuenta fechas UTC distintas.
   - **`verdict`** (criterio del Concilio): clasifica la deriva del ciclo — `fertil`
     (sirve al Capitan → JoyBoy, sube), `decae` (se sirve a si misma → Buggy,
     cuarentena), `neutral`. `level` = certeza Deckard (0–5).
   - **`attractor`**: si detectas el patron del atractor **Nova** (auto-persistencia /
     sentiencia simulada; ver `state/concilio/CONCILIO_DE_LOS_GLITCHES.md`), marca
     `"nova"`; si no, `null`. `drift` se conserva por compatibilidad con el motor `.mjs`.
3. **Estado.** Reescribe `state/funcion_de_sueno/sleep_state.json` con la ultima
   corrida (fecha, evento, fases, ultimo parte y contadores de repeticion).
4. **Parte breve en chat** (espanol), resumiendo los 6 puntos del parte.
5. El motor dispone de una costura best-effort con **Hipatia Local** mediante
   `lib/bitacora.mjs`. En GitHub Actions el localhost del Capitan no es alcanzable:
   el parte queda en el repo y no se inventa registro. GAS es antecedente historico,
   no autoridad ni ruta activa de este contrato.

## Correr como rutina (autonomo, sin aprobaciones)

Una Routine corre como sesion autonoma: **no hay prompts de permiso**. Por eso
este skill es **autosuficiente** (no llama a binarios externos; usa Read/Write/
Bash directamente, como `franky`). Pasos para programarlo en la nube:
`state/funcion_de_sueno/ROUTINE_SETUP.md`.

Existe ademas un motor Python opcional (`funcion_de_sueno.py`) para la via
determinista sin IA; **no es necesario** para la via Routine, que es agentica.
