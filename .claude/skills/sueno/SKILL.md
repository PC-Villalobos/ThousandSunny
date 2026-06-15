---
name: sueno
description: >-
  Nami's nightly sleep-function skill for the Thousand Sunny. Runs an
  artificial sleep cycle (N1-REM) over the shared memory in state/ to
  consolidate the day, audit coherence, detect drift, and prevent actor/role
  fusion, leaving a readable report. Use when the user invokes /sueno, or from
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
- prevenir la fusion actor/rol,
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
       [--actor <modelo, p.ej. claude-code>]
       [--role Nami]
       [--root state]
```

- `--event` decide que fases correr (tabla abajo). Por defecto: `manual_run`.
- `--phases` fuerza fases concretas y gana sobre `--event`.
- `--actor` y `--role` se registran en el ledger para vigilar la fusion.
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

**REM - Integracion.** Revisa el riesgo de fusion actor/rol (ver ledger), sugiere
rotacion si procede, y extrae el aprendizaje del ciclo en una linea accionable.

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
5. **Sin fusion actor/rol.** Si el mismo modelo (actor) repite el mismo papel
   (rol) 3 ciclos seguidos en el ledger, recomendar rotacion en el parte.
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
   - aviso de fusion actor/rol (REM),
   - siguiente accion minima segura.
2. **Ledger.** Anexa una linea a `state/funcion_de_sueno/sleep_ledger.jsonl`:
   ```json
   {"ts":"<ISO-8601>","event":"daily_tick","actor":"claude-code","role":"Nami","phases":["N1","N2","N3","REM"],"streak":<n>,"report":"reports/SLEEP_<fecha>.md","drift":false}
   ```
   `streak` = numero de ciclos consecutivos con el mismo `actor`+`role` (incluida
   esta corrida). Si `streak >= 3`, marca `"rotate":true` y avisa en el parte.
3. **Estado.** Reescribe `state/funcion_de_sueno/sleep_state.json` con la ultima
   corrida (fecha, evento, fases, ultimo parte, streak actual).
4. **Parte breve en chat** (espanol), resumiendo los 6 puntos del parte.
5. Si hay **deriva significativa**, incluye al final del parte el bloque de
   Bitacora GAS para PuenteDeMando:
   ```
   nakama=Usopp
   tema=caso0
   mensaje=<resumen breve del sueno y deriva detectada>
   ```
   Si el entorno tiene red al web app de GAS, puedes POSTearlo; si no, el bloque
   queda en el parte como respaldo (no se pierde nada).

## Correr como rutina (autonomo, sin aprobaciones)

Una Routine corre como sesion autonoma: **no hay prompts de permiso**. Por eso
este skill es **autosuficiente** (no llama a binarios externos; usa Read/Write/
Bash directamente, como `franky`). Pasos para programarlo en la nube:
`state/funcion_de_sueno/ROUTINE_SETUP.md`.

Existe ademas un motor Python opcional (`funcion_de_sueno.py`) para la via
determinista sin IA; **no es necesario** para la via Routine, que es agentica.
